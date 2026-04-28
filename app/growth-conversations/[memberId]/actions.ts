"use server";

/*
 * Growth Conversations — Server Actions (Sprint 4 §4.1c).
 *
 * `saveAskCaptures` is the canonical save path for the Ask phase. The
 * pattern established here will be replicated for Size, Show, Resolve,
 * Connect in Sprint 4 Prompt 4.2 — same transaction shape, same
 * conversation-attach logic, same supersession semantics.
 *
 * Transaction shape (per prompt §C.1, §C.2, §C.3):
 *   1. Find or create the Conversation record for this Growth Conversations
 *      session. The Conversation acts as the parent envelope; subsequent
 *      stage saves in the same session attach more executions to it.
 *   2. Find or create a track-agnostic GrowthStepExecution with
 *      step_phase = "ask" for that Conversation. Multiple Ask saves in
 *      the same session reuse the same execution row.
 *   3. For each new Signal: create a Signal record linked to the
 *      Conversation + execution.
 *   4. For each edit: create a NEW Signal with updated fields, then set
 *      the prior Signal's superseded_by_signal_id and superseded_at.
 *   5. Revalidate the Member profile + GC routes so the next render
 *      reflects the new state.
 *
 * Validation is shape-only here; richer field validation runs client-side
 * in AskSection. The Server Action trusts the shape it gets and surfaces
 * Prisma constraint violations as user-facing errors.
 *
 * Conversation defaults (per prompt §C.2 + schema constraints): the
 * schema requires meeting_type, channel, and sentiment as NOT NULL
 * enums. Sprint 4 Prompt 4.4 will add explicit capture for these on the
 * Resolve stage; for 4.1c, defaults are applied:
 *   meeting_type = "check_in"
 *   channel      = "in_person"
 *   sentiment    = "receptive"
 *
 * The defaults are conservative ("check_in" = the most generic non-onboarding
 * meeting type; "receptive" = the most positive sentiment, which Resolve
 * will overwrite when the actual outcome is known).
 */

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function getPrisma() {
  const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
    /^file:/,
    "",
  );
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) });
}

export type SignalDraft = {
  type: "goal" | "blocker" | "trigger" | "indecision";
  topic_id: string;
  their_words: string | null;
  // Sprint 4 §4.1d Block C — severity, recency, time_horizon nullable
  // to support per-type required-field discipline. Sprint 4 §4.2a fix
  // #2 — confidence also widened to nullable so the sub-form dropdown
  // can default to "Select…" rather than pre-picking a value (per the
  // "no defaults; every selection is deliberate" discipline). Per-type
  // validation below enforces the per-type rules; the validator treats
  // null as "not yet selected" and rejects required-but-null fields.
  severity: "manageable" | "painful" | "threatening" | null;
  recency: "recent" | "ongoing" | "chronic" | "hypothetical_future" | null;
  time_horizon:
    | "imminent"
    | "three_to_six_months"
    | "six_to_twelve_months"
    | "twelve_to_twenty_four_months"
    | "longer"
    | null;
  confidence: "member_stated" | "banker_inferred" | "unclear" | null;
  magnitude: number | null;
  unit: string | null;
  frequency: string | null;
};

// Sprint 4 §4.1d Block C — per-type validation. Returns null when valid;
// returns a user-facing error string when invalid. Server-side guard so a
// client bypass (e.g., curl-direct call) can't write malformed Signals.
function validateSignalDraft(draft: SignalDraft): string | null {
  if (!draft.topic_id) return "Topic is required.";
  if (!draft.confidence) return "Source is required.";

  if (draft.type === "goal" || draft.type === "blocker") {
    if (!draft.severity) return "Impact is required for Goal and Blocker Signals.";
    if (!draft.recency) return "Timeframe is required for Goal and Blocker Signals.";
  }

  if (draft.type === "trigger") {
    if (!draft.severity) return "Impact is required for Trigger Signals.";
    if (!draft.time_horizon)
      return "Time horizon is required for Trigger Signals.";
  }

  // Indecision: only Topic and Source are required (already checked above).

  // Magnitude conditional validation across all types.
  if (draft.magnitude !== null && draft.magnitude !== undefined) {
    if (!draft.unit) return "Unit is required when Magnitude is set.";
    if (!draft.frequency) return "Frequency is required when Magnitude is set.";
  }

  return null;
}

export type SignalEdit = {
  prior_signal_id: string;
  draft: SignalDraft;
};

export type SaveAskInput = {
  member_id: string;
  banker_id: string;
  // Existing Conversation for this Growth Conversations session, if the
  // banker has saved a prior stage. Null for the first save in a session.
  conversation_id: string | null;
  new_signals: SignalDraft[];
  edits: SignalEdit[];
};

export type SaveResult =
  | { ok: true; conversation_id: string; created_signal_ids: string[] }
  | { ok: false; error: string };

export async function saveAskCaptures(input: SaveAskInput): Promise<SaveResult> {
  if (input.new_signals.length === 0 && input.edits.length === 0) {
    return { ok: false, error: "No captures to save." };
  }

  // Sprint 4 §4.1d Block C — server-side per-type validation. Client-side
  // validation in AskSection should catch these before submit; this is
  // the safety net.
  for (const draft of input.new_signals) {
    const err = validateSignalDraft(draft);
    if (err) return { ok: false, error: err };
  }
  for (const edit of input.edits) {
    const err = validateSignalDraft(edit.draft);
    if (err) return { ok: false, error: err };
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create the parent Conversation.
      let conversationId = input.conversation_id;
      if (!conversationId) {
        const conv = await tx.conversation.create({
          data: {
            member_id: input.member_id,
            banker_id: input.banker_id,
            // Defaults documented in module comment above.
            meeting_type: "check_in",
            channel: "in_person",
            sentiment: "receptive",
          },
          select: { id: true },
        });
        conversationId = conv.id;
      }

      // 2. Find or create the track-agnostic Ask GrowthStepExecution.
      // Multiple Ask saves in the same session attach Signals to the
      // same execution; the unique [conversation_id, sequence_position]
      // constraint requires a sequence_position, so we use the next
      // available position when creating fresh.
      let askExec = await tx.growthStepExecution.findFirst({
        where: {
          conversation_id: conversationId,
          step_phase: "ask",
        },
        select: { id: true },
      });
      if (!askExec) {
        // Find the highest existing sequence_position and add 1; fall back
        // to 1 when no executions exist yet.
        const maxPosRow = await tx.growthStepExecution.findFirst({
          where: { conversation_id: conversationId },
          orderBy: { sequence_position: "desc" },
          select: { sequence_position: true },
        });
        const nextPos = (maxPosRow?.sequence_position ?? 0) + 1;
        askExec = await tx.growthStepExecution.create({
          data: {
            conversation_id: conversationId,
            growth_step_id: null, // Track-agnostic: nullable per §C.3 schema change
            step_phase: "ask",
            sequence_position: nextPos,
            captured_data: {},
          },
          select: { id: true },
        });
      }

      // 3. Create new Signals.
      const createdSignalIds: string[] = [];
      for (const draft of input.new_signals) {
        const sig = await tx.signal.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            growth_step_execution_id: askExec.id,
            type: draft.type,
            topic_id: draft.topic_id,
            their_words: draft.their_words,
            severity: draft.severity,
            recency: draft.recency,
            time_horizon: draft.time_horizon,
            // validateSignalDraft has already rejected null confidence
            // before the transaction opens, so the non-null assertion
            // is post-validation narrowing.
            confidence: draft.confidence!,
            magnitude: draft.magnitude,
            unit: draft.unit,
            frequency: draft.frequency,
            active: true,
          },
          select: { id: true },
        });
        createdSignalIds.push(sig.id);
      }

      // 4. Apply edits — create new Signal records, set supersession.
      for (const edit of input.edits) {
        const newSig = await tx.signal.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            growth_step_execution_id: askExec.id,
            type: edit.draft.type,
            topic_id: edit.draft.topic_id,
            their_words: edit.draft.their_words,
            severity: edit.draft.severity,
            recency: edit.draft.recency,
            time_horizon: edit.draft.time_horizon,
            confidence: edit.draft.confidence!,
            magnitude: edit.draft.magnitude,
            unit: edit.draft.unit,
            frequency: edit.draft.frequency,
            active: true,
          },
          select: { id: true },
        });
        createdSignalIds.push(newSig.id);

        // Set the prior Signal's supersession reference. Keep the prior
        // row immutable per audit-trail discipline; we mark it superseded
        // and inactive but do not delete it.
        await tx.signal.update({
          where: { id: edit.prior_signal_id },
          data: {
            superseded_by_signal_id: newSig.id,
            superseded_at: new Date(),
            active: false,
          },
        });
      }

      return { conversation_id: conversationId, created_signal_ids: createdSignalIds };
    });

    // Revalidate downstream surfaces so they reflect the new captures on
    // next render. Use the dynamic-route segment pattern (with "page"
    // type) to invalidate all instances rather than the slug-vs-UUID
    // resolution path; the Member profile + GC routes both index by
    // slug at runtime, so blanket invalidation is the safe call.
    revalidatePath("/members/[id]", "page");
    revalidatePath("/growth-conversations/[memberId]", "page");
    return {
      ok: true,
      conversation_id: result.conversation_id,
      created_signal_ids: result.created_signal_ids,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Sprint 4 §4.2a Block B — Size phase capture.
//
// saveSizeCaptures mirrors saveAskCaptures' transaction shape:
//   1. Find or create the parent Conversation.
//   2. Find or create the track-agnostic Size GrowthStepExecution
//      (step_phase = "size", growth_step_id = null).
//   3. Per-measurement validation (server-side guard; client also validates).
//   4. Create new SizingMeasurement rows.
//   5. For edits: create new row, mark prior superseded + inactive.
//   6. revalidatePath on Member profile + Growth Conversations routes.
// ============================================================

export type SizingMeasurementDraft = {
  dimension_id: string;
  // Sprint 4 §4.2a fix #2 — magnitude / unit / source widened to allow
  // null so the form's empty state shows "Select…" / blank input rather
  // than a pre-picked value. Validation below treats null as "not yet
  // selected" and rejects on save. Frequency was already nullable
  // (conditional based on Unit selection).
  magnitude: number | null;
  unit:
    | "dollars"
    | "count"
    | "days"
    | "months"
    | "percentage"
    | "hours"
    | null;
  frequency: string | null;
  source:
    | "member_stated"
    | "member_records"
    | "banker_calculated"
    | "market_reference"
    | null;
  their_words: string | null;
  confidence: "high" | "moderate" | "low" | "banker_estimate" | null;
  time_period: string | null;
  methodology_note: string | null;
};

export type SizingMeasurementEdit = {
  prior_measurement_id: string;
  draft: SizingMeasurementDraft;
};

export type SaveSizeInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  new_measurements: SizingMeasurementDraft[];
  edits: SizingMeasurementEdit[];
};

export type SaveSizeResult =
  | { ok: true; conversation_id: string; created_measurement_ids: string[] }
  | { ok: false; error: string };

// Per-measurement validation. Topic / dimension, Magnitude, Unit, Source
// are universal; Frequency is required for rate-based units (dollars,
// count, hours) per prompt §B.4. Anything else stays optional.
function validateMeasurementDraft(
  draft: SizingMeasurementDraft,
): string | null {
  if (!draft.dimension_id) return "Topic / dimension is required.";
  if (
    draft.magnitude === null ||
    draft.magnitude === undefined ||
    Number.isNaN(draft.magnitude)
  ) {
    return "Magnitude is required.";
  }
  if (!draft.unit) return "Unit is required.";
  if (!draft.source) return "Source is required.";
  const rateBasedUnits: Array<SizingMeasurementDraft["unit"]> = [
    "dollars",
    "count",
    "hours",
  ];
  if (rateBasedUnits.includes(draft.unit) && !draft.frequency) {
    return "Frequency is required for dollar / count / hour measurements.";
  }
  return null;
}

export async function saveSizeCaptures(
  input: SaveSizeInput,
): Promise<SaveSizeResult> {
  if (input.new_measurements.length === 0 && input.edits.length === 0) {
    return { ok: false, error: "No measurements to save." };
  }

  for (const draft of input.new_measurements) {
    const err = validateMeasurementDraft(draft);
    if (err) return { ok: false, error: err };
  }
  for (const edit of input.edits) {
    const err = validateMeasurementDraft(edit.draft);
    if (err) return { ok: false, error: err };
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create parent Conversation. Defaults match Ask phase
      // (saveAskCaptures docblock §C.2).
      let conversationId = input.conversation_id;
      if (!conversationId) {
        const conv = await tx.conversation.create({
          data: {
            member_id: input.member_id,
            banker_id: input.banker_id,
            meeting_type: "check_in",
            channel: "in_person",
            sentiment: "receptive",
          },
          select: { id: true },
        });
        conversationId = conv.id;
      }

      // 2. Find or create track-agnostic Size execution.
      let sizeExec = await tx.growthStepExecution.findFirst({
        where: {
          conversation_id: conversationId,
          step_phase: "size",
        },
        select: { id: true },
      });
      if (!sizeExec) {
        const maxPosRow = await tx.growthStepExecution.findFirst({
          where: { conversation_id: conversationId },
          orderBy: { sequence_position: "desc" },
          select: { sequence_position: true },
        });
        const nextPos = (maxPosRow?.sequence_position ?? 0) + 1;
        sizeExec = await tx.growthStepExecution.create({
          data: {
            conversation_id: conversationId,
            growth_step_id: null,
            step_phase: "size",
            sequence_position: nextPos,
            captured_data: {},
          },
          select: { id: true },
        });
      }

      // 3. Create new SizingMeasurements. validateMeasurementDraft has
      // already guaranteed magnitude / unit / source are non-null at
      // this point; the `!` non-null assertions are post-validation
      // narrowing.
      const createdIds: string[] = [];
      for (const draft of input.new_measurements) {
        const m = await tx.sizingMeasurement.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            growth_step_execution_id: sizeExec.id,
            dimension_id: draft.dimension_id,
            magnitude: draft.magnitude!,
            unit: draft.unit!,
            frequency: draft.frequency,
            source: draft.source!,
            their_words: draft.their_words,
            confidence: draft.confidence,
            time_period: draft.time_period,
            methodology_note: draft.methodology_note,
            active: true,
          },
          select: { id: true },
        });
        createdIds.push(m.id);
      }

      // 4. Apply edits — create new row, mark prior superseded + inactive.
      for (const edit of input.edits) {
        const newM = await tx.sizingMeasurement.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            growth_step_execution_id: sizeExec.id,
            dimension_id: edit.draft.dimension_id,
            magnitude: edit.draft.magnitude!,
            unit: edit.draft.unit!,
            frequency: edit.draft.frequency,
            source: edit.draft.source!,
            their_words: edit.draft.their_words,
            confidence: edit.draft.confidence,
            time_period: edit.draft.time_period,
            methodology_note: edit.draft.methodology_note,
            active: true,
          },
          select: { id: true },
        });
        createdIds.push(newM.id);

        await tx.sizingMeasurement.update({
          where: { id: edit.prior_measurement_id },
          data: {
            superseded_by_id: newM.id,
            superseded_at: new Date(),
            active: false,
          },
        });
      }

      return {
        conversation_id: conversationId,
        created_measurement_ids: createdIds,
      };
    });

    revalidatePath("/members/[id]", "page");
    revalidatePath("/growth-conversations/[memberId]", "page");
    return {
      ok: true,
      conversation_id: result.conversation_id,
      created_measurement_ids: result.created_measurement_ids,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Sprint 4 §4.2a Block C — Resolve phase capture.
//
// saveResolveCaptures is the most complex transaction in Sprint 4 — it
// touches four tables in a single $transaction and the order of
// operations matters for both correctness and audit-trail integrity.
//
// Order of operations (atomic; rolls back on any failure):
//   1. Find or create the parent Conversation (defaults match Ask /
//      Size: meeting_type = check_in, channel = in_person,
//      sentiment = receptive). Required first because every downstream
//      row references conversation_id.
//   2. Create the GrowthStepExecution for this Resolve capture.
//      step_phase = "resolve"; growth_step_id = the Track's Resolve
//      step (Track-aware, unlike Ask + Size which are track-agnostic).
//      Required next because subsequent ActionCard / Signal records
//      reference this execution as their origin.
//   3. Update the Track's Recommendation with the new `response` and
//      `primary_concern`. Recommendation is mutated in place — the
//      schema's `growth_step_execution_id @unique` binds it permanently
//      to its originating execution; supersession lives in the new
//      GrowthStepExecution chain (one execution per Resolve session)
//      rather than in Recommendation versioning.
//   4. If `closing_notes` is set (declined / dismissive responses),
//      write to `Conversation.banker_note` rather than creating an
//      ActionCard. ActionCard.due_at is NOT NULL; closing notes have
//      no due date by definition, so they belong on the Conversation.
//   5. If an indecision draft is present, create a Signal with
//      type = "indecision". Linked to the new GrowthStepExecution as
//      growth_step_execution_id so the Member profile's "captured
//      during" provenance line traces back to this Resolve session.
//   6. If an action_card draft is present (engaged / leaning_yes /
//      neutral / leaning_no / skeptical / confused responses), create
//      an ActionCard with origin_conversation_id + origin_growth_step_
//      execution_id pointing to this Resolve session. Type defaults to
//      "follow_up"; status defaults to "open".
//   7. revalidatePath on Member profile + GC routes so the Suggested
//      next step recomputes from the new Recommendation.response, the
//      Active signals band reflects any new Indecision Signal, and the
//      Open opportunities band reflects any new ActionCard.
//
// Rollback: $transaction rolls back atomically on any thrown error.
// If step 5 fails (e.g., bad topic_id on the indecision draft), the
// new execution row + Recommendation update from steps 2-3 are also
// reverted. Callers see a single { ok: false, error } result without
// partial-write inconsistency.
//
// Validation runs before the transaction opens (per-draft guards on
// indecision and action_card). The transaction itself trusts the
// shape it gets and surfaces Prisma constraint violations as errors.
// ============================================================

export type ResolveIndecisionDraft = {
  topic_id: string;
  their_words: string | null;
};

export type ResolveActionCardDraft = {
  description: string;
  owner_id: string;
  due_at_iso: string;
};

export type SaveResolveInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  // The Track's Resolve GrowthStep id. Track-aware: we cannot use a
  // null growth_step_id here the way Ask / Size do.
  resolve_growth_step_id: string;
  // The Recommendation being updated. Resolved before the form opens
  // (page passes it in); may be null if the Track has no current
  // Recommendation (none of the demo Members fall into this case).
  recommendation_id: string | null;
  // Required core fields.
  response:
    | "declined"
    | "leaning_no"
    | "dismissive"
    | "skeptical"
    | "confused"
    | "neutral"
    | "engaged"
    | "leaning_yes"
    | "committed"
    | "funded";
  // Sprint 4 §4.2a refinement #3 — extended with decline-reason values
  // for the form's contextual option set when response is declined /
  // dismissive. The schema enum (RecommendationPrimaryConcern) carries
  // both open-thread and decline-reason values; the form picks the
  // appropriate set based on the response.
  primary_concern:
    | "none"
    | "rate"
    | "speed"
    | "commitment"
    | "spouse"
    | "cpa"
    | "partner"
    | "timing"
    | "bank_capability"
    | "other"
    | "terms_unfavorable"
    | "going_with_competitor"
    | "no_longer_needed"
    | "does_not_qualify"
    | "lost_interest"
    | "found_alternative"
    | "circumstances_changed"
    | null;
  source: "member_stated" | "banker_observed";
  their_words: string | null;
  // Optional sub-captures.
  indecision: ResolveIndecisionDraft | null;
  action_card: ResolveActionCardDraft | null;
  closing_notes: string | null;
};

export type SaveResolveResult =
  | {
      ok: true;
      conversation_id: string;
      execution_id: string;
      created_signal_id: string | null;
      created_action_card_id: string | null;
    }
  | { ok: false; error: string };

const ENGAGEMENT_RESPONSES = new Set([
  "engaged",
  "leaning_yes",
]);
const NUANCED_RESPONSES = new Set([
  "skeptical",
  "confused",
  "leaning_no",
  "declined",
  "leaning_yes",
]);
const TERMINAL_NO_RESPONSES = new Set(["declined", "dismissive"]);
const COMMITTED_RESPONSES = new Set(["committed", "funded"]);

function validateResolveInput(input: SaveResolveInput): string | null {
  if (!input.response) return "Member response is required.";
  if (!input.source) return "Source is required.";

  // Primary concern required for nuanced responses.
  if (NUANCED_RESPONSES.has(input.response) && !input.primary_concern) {
    return "Primary concern is required for this response.";
  }

  // ActionCard description required for engagement responses.
  if (ENGAGEMENT_RESPONSES.has(input.response)) {
    if (!input.action_card) {
      return "Next step (ActionCard) is required for engaged / leaning yes responses.";
    }
    if (!input.action_card.description.trim()) {
      return "ActionCard description is required.";
    }
    if (!input.action_card.owner_id) {
      return "ActionCard owner is required.";
    }
    if (!input.action_card.due_at_iso) {
      return "ActionCard due date is required.";
    }
  }

  // Committed / funded suppress indecision + action_card per §C.3.
  if (COMMITTED_RESPONSES.has(input.response)) {
    if (input.indecision) {
      return "Indecision capture is suppressed when the Member has committed or funded.";
    }
    if (input.action_card) {
      return "ActionCard capture is suppressed when the Member has committed or funded.";
    }
  }

  // Indecision shape check.
  if (input.indecision) {
    if (!input.indecision.topic_id) {
      return "Indecision Topic is required when capturing an indecision.";
    }
  }

  return null;
}

export async function saveResolveCaptures(
  input: SaveResolveInput,
): Promise<SaveResolveResult> {
  const err = validateResolveInput(input);
  if (err) return { ok: false, error: err };

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1 — Conversation.
      let conversationId = input.conversation_id;
      if (!conversationId) {
        const conv = await tx.conversation.create({
          data: {
            member_id: input.member_id,
            banker_id: input.banker_id,
            meeting_type: "check_in",
            channel: "in_person",
            sentiment: "receptive",
          },
          select: { id: true },
        });
        conversationId = conv.id;
      }

      // Step 2 — GrowthStepExecution (Track-aware).
      const maxPosRow = await tx.growthStepExecution.findFirst({
        where: { conversation_id: conversationId },
        orderBy: { sequence_position: "desc" },
        select: { sequence_position: true },
      });
      const nextPos = (maxPosRow?.sequence_position ?? 0) + 1;
      const exec = await tx.growthStepExecution.create({
        data: {
          conversation_id: conversationId,
          growth_step_id: input.resolve_growth_step_id,
          step_phase: "resolve",
          sequence_position: nextPos,
          captured_data: {
            response: input.response,
            primary_concern: input.primary_concern,
            source: input.source,
            their_words: input.their_words,
          },
        },
        select: { id: true },
      });

      // Step 3 — Recommendation update (in place; no supersession).
      if (input.recommendation_id) {
        await tx.recommendation.update({
          where: { id: input.recommendation_id },
          data: {
            response: input.response,
            primary_concern: input.primary_concern,
            their_words: input.their_words,
          },
        });
      }

      // Step 4 — Closing notes for terminal-no responses.
      if (input.closing_notes && TERMINAL_NO_RESPONSES.has(input.response)) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: { banker_note: input.closing_notes },
        });
      }

      // Step 5 — Indecision Signal (optional).
      let createdSignalId: string | null = null;
      if (input.indecision) {
        const sig = await tx.signal.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            growth_step_execution_id: exec.id,
            type: "indecision",
            topic_id: input.indecision.topic_id,
            their_words: input.indecision.their_words,
            // Indecision Signals don't require severity / recency /
            // time_horizon per Sprint 4 §4.1d Block C.
            severity: null,
            recency: null,
            time_horizon: null,
            // Source-of-capture: "member stated" or "banker inferred".
            // The Resolve form's source enum (member_stated / banker_observed)
            // maps directly to SignalConfidence (member_stated /
            // banker_inferred); banker_observed → banker_inferred.
            confidence:
              input.source === "member_stated"
                ? "member_stated"
                : "banker_inferred",
            active: true,
          },
          select: { id: true },
        });
        createdSignalId = sig.id;
      }

      // Step 6 — ActionCard (optional, suppressed for committed/funded).
      let createdActionCardId: string | null = null;
      if (input.action_card) {
        const ac = await tx.actionCard.create({
          data: {
            type: "follow_up",
            owner_id: input.action_card.owner_id,
            member_id: input.member_id,
            origin_conversation_id: conversationId,
            origin_growth_step_execution_id: exec.id,
            rationale: input.action_card.description,
            due_at: new Date(input.action_card.due_at_iso),
            status: "open",
          },
          select: { id: true },
        });
        createdActionCardId = ac.id;
      }

      return {
        conversation_id: conversationId,
        execution_id: exec.id,
        created_signal_id: createdSignalId,
        created_action_card_id: createdActionCardId,
      };
    });

    // Step 7 — Revalidate downstream surfaces. Outside the transaction
    // intentionally; revalidatePath is a Next.js cache invalidation,
    // not a DB write, so it doesn't participate in the rollback.
    revalidatePath("/members/[id]", "page");
    revalidatePath("/growth-conversations/[memberId]", "page");
    return {
      ok: true,
      conversation_id: result.conversation_id,
      execution_id: result.execution_id,
      created_signal_id: result.created_signal_id,
      created_action_card_id: result.created_action_card_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}
