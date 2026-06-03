"use server";

/*
 * v2 workstation Server Actions — Sprint 4.7 Turn 2.
 *
 * Four new actions for the v2-only entities and the standalone ActionCard:
 *   - saveModel       (Block I) — creates Model row
 *   - saveShowEvent   (Block J) — creates ShowEvent row
 *   - saveReaction    (Block K) — creates Reaction row
 *   - saveActionCard  (Block L) — creates standalone ActionCard
 *
 * Conversation-attach pattern parallels v1's saveAskCaptures: find or
 * create the parent Conversation with conservative defaults
 * (meeting_type=check_in, channel=in_person, sentiment=receptive). The
 * v2 workstation captures activities individually rather than as a
 * staged sequence, so every activity gets its own attachment.
 *
 * Cache invalidation: every action revalidates both the v2 workstation
 * route and the v1 routes, since the underlying schema reads share data.
 */

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import { matchInsight, type CandidatePattern } from "@/lib/insight-matching";
import { recomputeWorkflowState } from "@/lib/workflow-state";
import {
  factorCaptureOrUpdate,
  reactionOrUpdate,
  type RecaptureKind,
} from "@/lib/recapture-detection";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

function revalidateAllMemberSurfaces() {
  revalidatePath("/v2/members/[id]", "page");
  revalidatePath("/members/[id]", "page");
  revalidatePath("/growth-conversations/[memberId]", "page");
  // Sprint 5b.2 — portfolio surfaces also re-render on capture writes.
  revalidatePath("/v2/insight-engine/tracks", "page");
  revalidatePath("/v2/insight-engine/portfolio", "page");
  revalidatePath("/v2/insight-engine/coverage", "page");
  revalidatePath("/v2/insight-engine/stage-skip", "page");
}

// Sprint 5b.2 Block A — recompute MemberWorkflowState then revalidate
// surfaces. Replaces inline revalidateAllMemberSurfaces() calls in
// every save action so workflow state stays in sync with capture writes.
async function recomputeAndRevalidate(
  prisma: PrismaClient,
  memberId: string,
): Promise<void> {
  await recomputeWorkflowState(prisma, memberId);
  revalidateAllMemberSurfaces();
}

// ============================================================
// Block I — saveModel
// ============================================================

export type SaveModelInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  model_name: string;
  built_with_member: boolean;
  artifact_id: string | null;
  parameters: Array<{ key: string; value: string }>;
  assumptions: string[];
  output_summary: string;
  // Sprint 5d Block A.3 — when banker attaches an ArtifactTemplate, the
  // template_id and the parameter values keyed by parameter_schema.key
  // get persisted on the Model so the artifact view can re-render.
  template_id?: string | null;
  template_parameters?: Record<string, string> | null;
};

export type SaveModelResult =
  | {
      ok: true;
      conversation_id: string;
      model_id: string;
      // Sprint 4.7.2 Block G — non-null when provenance was with-Member
      // and the Model linked to an Artifact (atomic ShowEvent created
      // inside the same transaction).
      show_event_id: string | null;
    }
  | { ok: false; error: string };

export async function saveModel(
  input: SaveModelInput,
): Promise<SaveModelResult> {
  if (!input.model_name.trim()) return { ok: false, error: "Model name is required." };
  if (!input.output_summary.trim()) {
    return { ok: false, error: "Output summary is required." };
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
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

      // The Model name is captured in the parameters Json blob to avoid
      // a schema column rename — the underlying entity stores the
      // structured shape (parameters/assumptions/output_summary) without
      // a dedicated `name` field. The model_name surfaces in the feed
      // via the `name` parameter key, which is how the captured-feed
      // card reads it back.
      // BUILD 2c req 1 — the Model is auto-named from the lending product.
      // On collision (a second model for the same product) append a
      // MM.DD.YY datestamp suffix so the feed cards stay distinguishable.
      const nameOf = (raw: unknown): string | undefined => {
        try {
          let p = typeof raw === "string" ? JSON.parse(raw) : raw;
          if (typeof p === "string") p = JSON.parse(p); // double-encoded
          return p && typeof p === "object"
            ? (p as { name?: string }).name
            : undefined;
        } catch {
          return undefined;
        }
      };
      const existingModels = await tx.model.findMany({
        where: { member_id: input.member_id, active: true },
        select: { parameters: true },
      });
      const existingNames = new Set(
        existingModels.map((m) => nameOf(m.parameters)).filter(Boolean),
      );
      let finalName = input.model_name;
      if (existingNames.has(finalName)) {
        const d = new Date();
        const stamp = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(
          d.getDate(),
        ).padStart(2, "0")}.${String(d.getFullYear() % 100).padStart(2, "0")}`;
        finalName = `${input.model_name} ${stamp}`;
      }

      const parametersWithName = {
        name: finalName,
        rows: input.parameters,
      };

      // BUILD 2b.1 fix — the +Model form passes the selected dropdown id
      // as BOTH template_id and artifact_id. For a template option that id
      // is an ArtifactTemplate id, NOT an Artifact id, so Model.artifact_id
      // (FK -> Artifact) was violated on every template save. Resolve
      // artifact_id to a real Artifact only: drop it when it matches the
      // template_id (template attach) or doesn't reference an existing
      // Artifact row. Templates link via template_id; they carry no
      // Artifact, so the auto-ShowEvent below is correctly skipped.
      let resolvedArtifactId: string | null = input.artifact_id;
      if (resolvedArtifactId && resolvedArtifactId === input.template_id) {
        resolvedArtifactId = null;
      }
      if (resolvedArtifactId) {
        const artifactExists = await tx.artifact.findUnique({
          where: { id: resolvedArtifactId },
          select: { id: true },
        });
        if (!artifactExists) resolvedArtifactId = null;
      }

      const model = await tx.model.create({
        data: {
          member_id: input.member_id,
          conversation_id: conversationId,
          artifact_id: resolvedArtifactId,
          built_with_member: input.built_with_member,
          parameters: parametersWithName,
          assumptions: input.assumptions,
          output_summary: input.output_summary,
          built_by_banker_id: input.banker_id,
          // Sprint 5d Block A.3 — template attachment.
          template_id: input.template_id ?? null,
          template_parameters:
            input.template_parameters && input.template_id
              ? JSON.stringify(input.template_parameters)
              : null,
        },
        select: { id: true },
      });

      // Sprint 4.7.2 Block G — auto-create ShowEvent when provenance is
      // "with Member." Per ARCHITECTURE_V2.md §4.3 + §11.4: with-Member
      // provenance means the model was constructed in front of the
      // Member, which by definition includes showing it. No separate
      // banker confirmation needed; the provenance radio is the
      // confirmation. Atomic with the Model create — if Show fails the
      // entire transaction rolls back.
      //
      // ShowEvent requires a non-null artifact_id. When the Model
      // doesn't link to an Artifact (artifact_id is null), the
      // auto-Show is skipped — there's no concrete Artifact for the
      // ShowEvent to point at. Banker can still record a Show via
      // the sidebar artifact preview "Record show" button (Block H).
      let showEventId: string | null = null;
      if (input.built_with_member && resolvedArtifactId) {
        const showEvent = await tx.showEvent.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversationId,
            artifact_id: resolvedArtifactId,
            model_id: model.id,
            shown_by_banker_id: input.banker_id,
            context_note: "Auto-created on + Model save with Member provenance",
          },
          select: { id: true },
        });
        showEventId = showEvent.id;
      }

      return {
        conversation_id: conversationId,
        model_id: model.id,
        show_event_id: showEventId,
      };
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      conversation_id: result.conversation_id,
      model_id: result.model_id,
      show_event_id: result.show_event_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Sprint 8 follow-up — updateModelParameter
//
// Updates a single parameter on an existing Model's `parameters` JSON
// in place. Used by the artifact renderer's inline "Fill in" affordance
// for banker-entered parameters that have no source_factor_id linkage.
// ============================================================

export type UpdateModelParameterInput = {
  member_id: string;
  model_id: string;
  parameter_key: string;
  parameter_value: string;
  // BUILD 2b — when true, "Capture with Member" upgraded this value to
  // member_confirmed: record the key in the reserved `__confirmed` array
  // so the renderer tags it "captured ✓" on next load. No schema change;
  // provenance rides inside template_parameters.
  mark_confirmed?: boolean;
};

export type UpdateModelParameterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateModelParameter(
  input: UpdateModelParameterInput,
): Promise<UpdateModelParameterResult> {
  if (!input.model_id) return { ok: false, error: "Model id is required." };
  if (!input.parameter_key)
    return { ok: false, error: "Parameter key is required." };

  const prisma = getPrisma();
  try {
    const model = await prisma.model.findUnique({
      where: { id: input.model_id },
      select: {
        id: true,
        member_id: true,
        parameters: true,
        template_parameters: true,
      },
    });
    if (!model) return { ok: false, error: "Model not found." };
    if (model.member_id !== input.member_id)
      return { ok: false, error: "Model does not belong to this Member." };

    function mergeJson(existing: unknown): string {
      const base =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? { ...(existing as Record<string, unknown>) }
          : {};
      base[input.parameter_key] = input.parameter_value;
      if (input.mark_confirmed) {
        // Store __confirmed as a JSON *string* value (not a raw array):
        // template_parameters is parsed downstream with String(v), which
        // would turn an array into a comma-joined string the renderer
        // can't JSON.parse. Read it back tolerantly (string or array).
        const raw = base.__confirmed;
        let prior: string[] = [];
        if (typeof raw === "string") {
          try {
            const p = JSON.parse(raw);
            if (Array.isArray(p)) prior = p.map(String);
          } catch {
            // ignore malformed prior
          }
        } else if (Array.isArray(raw)) {
          prior = (raw as unknown[]).map(String);
        }
        if (!prior.includes(input.parameter_key)) prior.push(input.parameter_key);
        base.__confirmed = JSON.stringify(prior);
      }
      return JSON.stringify(base);
    }

    // `parameters` is Json on Prisma. `template_parameters` is String? in
    // Sprint 5d's schema — JSON-encoded. Both kept in sync.
    let parametersJson: string;
    try {
      const existing =
        typeof model.parameters === "string"
          ? JSON.parse(model.parameters)
          : model.parameters;
      parametersJson = mergeJson(existing);
    } catch {
      parametersJson = mergeJson(null);
    }
    let templateParametersJson: string;
    try {
      const existing = model.template_parameters
        ? JSON.parse(model.template_parameters)
        : null;
      templateParametersJson = mergeJson(existing);
    } catch {
      templateParametersJson = mergeJson(null);
    }

    await prisma.model.update({
      where: { id: input.model_id },
      data: {
        parameters: parametersJson,
        template_parameters: templateParametersJson,
      },
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Block J — saveShowEvent
// ============================================================

export type SaveShowEventInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  artifact_id: string;
  model_id: string | null;
  context_note: string | null;
};

export type SaveShowEventResult =
  | { ok: true; conversation_id: string | null; show_event_id: string }
  | { ok: false; error: string };

export async function saveShowEvent(
  input: SaveShowEventInput,
): Promise<SaveShowEventResult> {
  if (!input.artifact_id) return { ok: false, error: "Model is required." };

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Sprint 5b.1 Patch 7 + Sprint 5c Block G.2 — guard duplicate
      // share-events. Two creation paths exist:
      //   1. saveModel with built_with_member=true + artifact_id non-null
      //      auto-creates a ShowEvent (model_id non-null).
      //   2. Artifact preview's "Mark as shared with Member" button
      //      calls saveShowEvent with model_id=null (the dialog doesn't
      //      know which Model produced the artifact rendering).
      // Sprint 5b.1 Patch 7 used strict (member, artifact, model_id)
      // match — that missed the cross-path case (auto-create with
      // model_id, manual share with null) and produced duplicates.
      //
      // Sprint 5c fix: drop the strict model_id match. A ShowEvent for
      // the same (member, artifact) is the same logical "shown" moment
      // regardless of whether a Model produced it. Update the
      // most-recent existing row's shown_at; never create a duplicate
      // for the same (member, artifact) pair.
      const existing = await tx.showEvent.findFirst({
        where: {
          member_id: input.member_id,
          artifact_id: input.artifact_id,
        },
        orderBy: { shown_at: "desc" },
        select: { id: true, conversation_id: true },
      });
      if (existing) {
        await tx.showEvent.update({
          where: { id: existing.id },
          data: { shown_at: new Date() },
        });
        return {
          conversation_id: existing.conversation_id,
          show_event_id: existing.id,
        };
      }

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

      const show = await tx.showEvent.create({
        data: {
          member_id: input.member_id,
          conversation_id: conversationId,
          artifact_id: input.artifact_id,
          model_id: input.model_id,
          shown_by_banker_id: input.banker_id,
          context_note: input.context_note,
        },
        select: { id: true },
      });

      return { conversation_id: conversationId, show_event_id: show.id };
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      conversation_id: result.conversation_id,
      show_event_id: result.show_event_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Block K — saveReaction
// ============================================================

// Sprint 4.7.2 Block A — ReactionValue expanded to 7 values
// (committed + declined subsumed from v1 Resolve terminal states).
export type ReactionResponseValue =
  | "engaged"
  | "leaning_yes"
  | "skeptical"
  | "confused"
  | "dismissive"
  | "committed"
  | "declined";

export type SaveReactionInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  response_value: ReactionResponseValue;
  member_quote: string | null;
  show_event_id: string | null;
  // Sprint 4.7.2 Block A + F — Reaction.primary_concern column with
  // contextual taxonomy (Sprint 4.6 §6.3). Open-thread context for
  // engaged/leaning_yes/committed; decline-reason context for
  // declined/dismissive. Required for skeptical/confused/leaning_yes/
  // declined (matches v1 NUANCED pattern); optional otherwise.
  primary_concern: string | null;
};

export type SaveReactionResult =
  | { ok: true; conversation_id: string; reaction_id: string }
  | { ok: false; error: string };

// Sprint 4.7.2 Block F — primary_concern is required for the v1
// NUANCED responses (skeptical / confused / leaning_yes / declined);
// these are the response states where the concern is the actionable
// signal. Engaged, committed, and dismissive don't require it.
const REACTION_NUANCED_RESPONSES = new Set<ReactionResponseValue>([
  "skeptical",
  "confused",
  "leaning_yes",
  "declined",
]);

export async function saveReaction(
  input: SaveReactionInput,
): Promise<SaveReactionResult> {
  if (!input.response_value) {
    return { ok: false, error: "Response value is required." };
  }
  if (
    REACTION_NUANCED_RESPONSES.has(input.response_value) &&
    !input.primary_concern
  ) {
    return {
      ok: false,
      error: "Primary concern is required for this response.",
    };
  }

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
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

      // Sprint 5b.2 Block F — recapture-aware Reaction write. Same
      // response_value + primary_concern on same (member, show_event)
      // → timestamp update; different → new row, prior preserved.
      const reactionResult = await reactionOrUpdate(tx as unknown as PrismaClient, {
        member_id: input.member_id,
        banker_id: input.banker_id,
        conversation_id: conversationId,
        show_event_id: input.show_event_id,
        response_value: input.response_value,
        member_quote: input.member_quote,
        primary_concern: input.primary_concern,
      });

      return {
        conversation_id: conversationId,
        reaction_id: reactionResult.record.id,
      };
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      conversation_id: result.conversation_id,
      reaction_id: result.reaction_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Sprint 5a.1 Block F — saveFactorCapture
//
// Matrix-aware capture path. Writes a FactorCapture row + optional
// companion SizingMeasurement when factor.capture_mode = "numerical"
// and the banker opts to also create a magnitude record.
// ============================================================

export type SaveFactorCaptureInput = {
  member_id: string;
  banker_id: string;
  factor_id: string;
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
  unit: string | null;
  // Optional companion SizingMeasurement creation. When true and the
  // factor is numerical, the save action also creates a SizingMeasurement
  // row using the same magnitude / unit so the captured-feed surfaces
  // a Sized card alongside the FactorCapture.
  also_create_sizing: boolean;
  // Required dimension_id only if also_create_sizing is true.
  sizing_dimension_id: string | null;
  // Sprint 8 Block E — capture-mode pre-set from artifact missing-
  // parameter CTA. Defaults to member_confirmed when omitted.
  capture_mode?: "member_confirmed" | "banker_estimate";
};

export type SaveFactorCaptureResult =
  | {
      ok: true;
      factor_capture_id: string;
      sizing_measurement_id: string | null;
      // Sprint 5b.2 Block F — recapture pattern. 'created' on first
      // capture; 'updated' when same value re-captured (timestamp
      // bumped, no new row); 'superseded' when different value
      // re-captured (new row, prior preserved by newest-by-captured_at).
      recapture_kind: RecaptureKind;
    }
  | { ok: false; error: string };

export async function saveFactorCapture(
  input: SaveFactorCaptureInput,
): Promise<SaveFactorCaptureResult> {
  if (!input.factor_id) return { ok: false, error: "Factor is required." };
  const hasValue =
    input.numerical_value !== null ||
    input.boolean_value !== null ||
    (input.qualitative_value !== null && input.qualitative_value !== "");
  if (!hasValue) return { ok: false, error: "A value is required." };

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find or create a working Conversation for traceability. Mirrors
      // the saveModel / saveReaction pattern.
      const conversation = await tx.conversation.create({
        data: {
          member_id: input.member_id,
          banker_id: input.banker_id,
          meeting_type: "check_in",
          channel: "in_person",
          sentiment: "receptive",
        },
        select: { id: true },
      });

      let sizingId: string | null = null;
      if (
        input.also_create_sizing &&
        input.numerical_value !== null &&
        input.sizing_dimension_id
      ) {
        const sizing = await tx.sizingMeasurement.create({
          data: {
            member_id: input.member_id,
            conversation_id: conversation.id,
            dimension_id: input.sizing_dimension_id,
            magnitude: input.numerical_value,
            unit: input.unit ?? "count",
            source: "banker_calculated",
            active: true,
          },
          select: { id: true },
        });
        sizingId = sizing.id;
      }

      // Sprint 5b.2 Block F — recapture-aware write. Same value as
      // most-recent capture for (member, factor) → timestamp update.
      // Different value → new row, prior preserved.
      const captureResult = await factorCaptureOrUpdate(tx as unknown as PrismaClient, {
        member_id: input.member_id,
        factor_id: input.factor_id,
        banker_id: input.banker_id,
        numerical_value: input.numerical_value,
        boolean_value: input.boolean_value,
        qualitative_value: input.qualitative_value,
        unit: input.unit,
        source_sizing_id: sizingId,
        capture_mode: input.capture_mode,
      });

      return {
        factor_capture_id: captureResult.record.id,
        sizing_measurement_id: sizingId,
        recapture_kind: captureResult.kind,
      };
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      factor_capture_id: result.factor_capture_id,
      sizing_measurement_id: result.sizing_measurement_id,
      recapture_kind: result.recapture_kind,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Block L — saveActionCard (standalone, not via Resolve)
// ============================================================
//
// In v1 the ActionCard is created inside the Resolve transaction with
// engagement-spectrum responses. In v2 the + Action activity is a
// standalone capture: the banker can record an operational follow-up
// without going through Resolve. The shape mirrors the Resolve flow's
// ActionCard sub-form (description / owner / due date) but creates the
// row directly without a Recommendation update.

export type SaveActionCardInput = {
  member_id: string;
  banker_id: string;
  conversation_id: string | null;
  description: string;
  owner_id: string;
  due_at_iso: string;
};

export type SaveActionCardResult =
  | { ok: true; conversation_id: string; action_card_id: string }
  | { ok: false; error: string };

export async function saveActionCard(
  input: SaveActionCardInput,
): Promise<SaveActionCardResult> {
  if (!input.description.trim()) {
    return { ok: false, error: "Description is required." };
  }
  if (!input.owner_id) return { ok: false, error: "Owner is required." };
  if (!input.due_at_iso) return { ok: false, error: "Due date is required." };

  const prisma = getPrisma();
  try {
    const result = await prisma.$transaction(async (tx) => {
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

      const card = await tx.actionCard.create({
        data: {
          type: "follow_up",
          owner_id: input.owner_id,
          member_id: input.member_id,
          origin_conversation_id: conversationId,
          rationale: input.description,
          due_at: new Date(input.due_at_iso),
          status: "open",
        },
        select: { id: true },
      });

      return { conversation_id: conversationId, action_card_id: card.id };
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      conversation_id: result.conversation_id,
      action_card_id: result.action_card_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================
// Sprint 5b.1 Block E — saveInsight (banker-authored Insight + LLM match)
// ============================================================

export type SaveInsightInput = {
  member_id: string;
  banker_id: string;
  track_id: string;
  addresses_signal_id: string | null;
  insight_type: "reframe" | "implication";
  content: string;
};

export type SaveInsightResult =
  | {
      ok: true;
      insight_id: string;
      matched_pattern_id: string | null;
      match_confidence: number;
      llm_feedback: string;
      state: "routine" | "novel";
      fallback: boolean;
    }
  | { ok: false; error: string };

export async function saveInsight(
  input: SaveInsightInput,
): Promise<SaveInsightResult> {
  const trimmed = input.content.trim();
  if (!trimmed) return { ok: false, error: "Insight content is required." };
  if (trimmed.length > 220) {
    return { ok: false, error: "Insight content must be 200 chars or less." };
  }
  if (!input.track_id) return { ok: false, error: "Track is required." };

  const prisma = getPrisma();
  try {
    // Build candidate Pattern set: filter by track_id, plus signal_tag
    // when addresses_signal is set (otherwise broad track-only).
    const candidatesWhere: Parameters<typeof prisma.insightPattern.findMany>[0] = {
      where: { track_id: input.track_id, status: "approved" },
      select: { id: true, content: true, insight_type: true, signal_tag_scope: true },
    };
    let signalSummary: string | null = null;
    let signalTagForFilter: string | null = null;
    if (input.addresses_signal_id) {
      const sig = await prisma.signal.findUnique({
        where: { id: input.addresses_signal_id },
        select: { type: true, topic: { select: { canonical_tag: true } } },
      });
      if (sig) {
        // The Pattern signal_tag_scope uses the Block-level enum (e.g.,
        // 'cashflow_volatility', 'capacity_limit'). The Signal's topic
        // canonical_tag uses dotted form (e.g., 'blocker.cash_flow_seasonal').
        // For the demo we approximate by using the second segment of the
        // canonical_tag with underscore-normalization, falling back to
        // broad track-only filter if no obvious mapping.
        const tail = sig.topic.canonical_tag.split(".").slice(1).join("_");
        signalTagForFilter = tail || null;
        signalSummary = `${capitalize(sig.type)} · ${tail}`;
      }
    }
    const allCandidates = await prisma.insightPattern.findMany(candidatesWhere);
    // Don't require strict tag match (the Pattern library uses a
    // narrower vocab than topic canonical_tags). Pass all track-scoped
    // Patterns to the LLM and let the model judge relevance.
    const candidatePayload: CandidatePattern[] = allCandidates.map((p) => ({
      id: p.id,
      content: p.content,
      insight_type: p.insight_type,
    }));
    void signalTagForFilter; // reserved for Pilot tighter pre-filter

    // Fetch track name for the prompt context.
    const track = await prisma.trackTemplate.findUnique({
      where: { id: input.track_id },
      select: { name: true },
    });
    const trackName = track?.name ?? input.track_id;

    // Live LLM match (or graceful fallback per insight-matching.ts).
    const match = await matchInsight({
      banker_content: trimmed,
      track_name: trackName,
      addresses_signal_summary: signalSummary,
      candidates: candidatePayload,
    });

    const insight = await prisma.insight.create({
      data: {
        member_id: input.member_id,
        track_id: input.track_id,
        addresses_signal_id: input.addresses_signal_id,
        insight_type: input.insight_type,
        content: trimmed,
        matched_pattern_id: match.matched_pattern_id,
        match_confidence: match.match_confidence,
        llm_feedback: match.llm_feedback,
        state: match.state,
        authored_by: input.banker_id,
      },
      select: { id: true },
    });

    await recomputeAndRevalidate(prisma, input.member_id);
    return {
      ok: true,
      insight_id: insight.id,
      matched_pattern_id: match.matched_pattern_id,
      match_confidence: match.match_confidence,
      llm_feedback: match.llm_feedback,
      state: match.state,
      fallback: match.fallback,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================
// Sprint 5b.1 Block G — saveSpecialistHandoff
// ============================================================

export type SaveSpecialistHandoffInput = {
  member_id: string;
  banker_id: string;
  track_id: string;
  department_tag: string;
  specialist_preference: string | null;
};

export type SaveSpecialistHandoffResult =
  | { ok: true; handoff_id: string }
  | { ok: false; error: string };

export async function saveSpecialistHandoff(
  input: SaveSpecialistHandoffInput,
): Promise<SaveSpecialistHandoffResult> {
  if (!input.track_id) return { ok: false, error: "Track is required." };
  if (!input.department_tag) {
    return { ok: false, error: "Department / team is required." };
  }

  const prisma = getPrisma();
  try {
    const h = await prisma.specialistHandoff.create({
      data: {
        member_id: input.member_id,
        track_id: input.track_id,
        department_tag: input.department_tag,
        specialist_preference: input.specialist_preference,
        status: "initiated",
        initiated_by: input.banker_id,
      },
      select: { id: true },
    });
    await recomputeAndRevalidate(prisma, input.member_id);
    return { ok: true, handoff_id: h.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}
