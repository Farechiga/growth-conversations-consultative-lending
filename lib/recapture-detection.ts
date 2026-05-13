/*
 * Sprint 5b.2 Block F — recapture detection pattern.
 *
 * When a banker re-captures information that already exists for a
 * Member, update the existing record's timestamp rather than creating
 * a duplicate. Create a new record only if the captured value differs.
 *
 * Three concrete entity helpers:
 *   - factorCaptureOrUpdate — match by (member_id, factor_id);
 *     value-equality across numerical_value | boolean_value |
 *     qualitative_value | unit
 *   - reactionOrUpdate — match by (member_id, show_event_id);
 *     value-equality on response_value (+ primary_concern)
 *
 * For ShowEvent, the equivalent guard ships in Sprint 5b.1 Patch 7
 * (saveShowEvent.findFirst → update existing).
 *
 * Each helper returns RecaptureResult so callers can branch on
 * created vs updated for analytics + audit logging.
 *
 * Pilot considerations (per Architectural Note in BUILD_LOG):
 *   - Demo treats updated as in-place timestamp bump. Pilot may want
 *     richer audit trail (preserve all captures with timestamps; query
 *     newest by captured_at). Schema additions: superseded_by_id
 *     pointer or audit-log table. See Q-C2 in OPEN_QUESTIONS.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";

export type RecaptureKind = "created" | "updated" | "superseded";

export type RecaptureResult<T> = {
  kind: RecaptureKind;
  record: T;
};

// ────────────────────────────────────────────────
// FactorCapture
// ────────────────────────────────────────────────

export type FactorCaptureValue = {
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
  unit: string | null;
};

function factorValuesEqual(
  a: FactorCaptureValue,
  b: FactorCaptureValue,
): boolean {
  return (
    a.numerical_value === b.numerical_value &&
    a.boolean_value === b.boolean_value &&
    a.qualitative_value === b.qualitative_value &&
    (a.unit ?? null) === (b.unit ?? null)
  );
}

export type FactorCaptureCreateData = {
  member_id: string;
  factor_id: string;
  banker_id: string;
  numerical_value?: number | null;
  boolean_value?: boolean | null;
  qualitative_value?: string | null;
  unit?: string | null;
  source_signal_id?: string | null;
  source_sizing_id?: string | null;
  source_reaction_id?: string | null;
  // Sprint 8 Block A — capture-mode dichotomy. Defaults to
  // member_confirmed; banker_estimate flows through from the artifact
  // missing-parameter CTA "Banker estimate" path (Block E).
  capture_mode?: "member_confirmed" | "banker_estimate";
};

/**
 * Capture a FactorCapture or update existing if same value already
 * captured. Match predicate: (member_id, factor_id). Value equality
 * across numerical/boolean/qualitative/unit.
 *
 * Returns:
 *   - { kind: 'created' } when no prior capture exists
 *   - { kind: 'updated' } when most-recent capture matches value;
 *     existing row's captured_at bumped to now
 *   - { kind: 'superseded' } when most-recent capture has different
 *     value; new capture row created (prior preserved by
 *     newest-by-captured_at queries; explicit supersession marker is
 *     a Pilot extension)
 */
// Both PrismaClient and TransactionClient expose factorCapture /
// reaction delegates. Type as PrismaClient and trust call sites to
// pass a structurally-compatible client (tx or prisma).
export async function factorCaptureOrUpdate(
  prismaOrTx: PrismaClient,
  data: FactorCaptureCreateData,
): Promise<RecaptureResult<{ id: string }>> {
  const tx = prismaOrTx;
  const existing = await tx.factorCapture.findFirst({
    where: { member_id: data.member_id, factor_id: data.factor_id },
    orderBy: { captured_at: "desc" },
    select: {
      id: true,
      numerical_value: true,
      boolean_value: true,
      qualitative_value: true,
      unit: true,
    },
  });

  const incoming: FactorCaptureValue = {
    numerical_value: data.numerical_value ?? null,
    boolean_value: data.boolean_value ?? null,
    qualitative_value: data.qualitative_value ?? null,
    unit: data.unit ?? null,
  };

  const captureMode = data.capture_mode ?? "member_confirmed";

  if (existing && factorValuesEqual(existing, incoming)) {
    // Bump timestamp + update capture_mode (e.g., a prior
    // banker_estimate may be re-captured as member_confirmed once
    // confirmed in conversation; the row converts in place).
    await tx.factorCapture.update({
      where: { id: existing.id },
      data: { captured_at: new Date(), capture_mode: captureMode },
    });
    return { kind: "updated", record: { id: existing.id } };
  }

  const created = await tx.factorCapture.create({
    data: {
      member_id: data.member_id,
      factor_id: data.factor_id,
      banker_id: data.banker_id,
      numerical_value: data.numerical_value ?? null,
      boolean_value: data.boolean_value ?? null,
      qualitative_value: data.qualitative_value ?? null,
      unit: data.unit ?? null,
      source_signal_id: data.source_signal_id ?? null,
      source_sizing_id: data.source_sizing_id ?? null,
      source_reaction_id: data.source_reaction_id ?? null,
      capture_mode: captureMode,
    },
    select: { id: true },
  });

  return {
    kind: existing ? "superseded" : "created",
    record: { id: created.id },
  };
}

// ────────────────────────────────────────────────
// Reaction
// ────────────────────────────────────────────────

export type ReactionCreateData = {
  member_id: string;
  banker_id: string;
  conversation_id: string;
  show_event_id: string | null;
  response_value: string;
  member_quote: string | null;
  primary_concern: string | null;
};

/**
 * Capture a Reaction or update existing if same response on the same
 * (member, show_event) already captured.
 *
 * Match predicate: (member_id, show_event_id). When show_event_id is
 * null on both, match by member_id alone (latest Reaction).
 *
 * Value equality: response_value AND primary_concern must match for
 * the result to be 'updated'. Anything else → new row.
 */
export async function reactionOrUpdate(
  prisma: PrismaClient,
  data: ReactionCreateData,
): Promise<RecaptureResult<{ id: string }>> {
  const where = data.show_event_id
    ? { member_id: data.member_id, show_event_id: data.show_event_id }
    : { member_id: data.member_id, show_event_id: null };
  const existing = await prisma.reaction.findFirst({
    where,
    orderBy: { captured_at: "desc" },
    select: {
      id: true,
      response_value: true,
      primary_concern: true,
    },
  });

  if (
    existing &&
    existing.response_value === data.response_value &&
    (existing.primary_concern ?? null) === (data.primary_concern ?? null)
  ) {
    await prisma.reaction.update({
      where: { id: existing.id },
      data: { captured_at: new Date() },
    });
    return { kind: "updated", record: { id: existing.id } };
  }

  // Cast response_value through `unknown` because Prisma's typed
  // ReactionValue enum isn't widened from the helper's plain `string`
  // input. Application-layer validation already happens in saveReaction
  // (REACTION_NUANCED_RESPONSES gate); helper trusts the caller.
  const created = await prisma.reaction.create({
    data: {
      member_id: data.member_id,
      conversation_id: data.conversation_id,
      show_event_id: data.show_event_id,
      response_value: data.response_value as unknown as Parameters<
        typeof prisma.reaction.create
      >[0]["data"]["response_value"],
      member_quote: data.member_quote,
      primary_concern: data.primary_concern,
      captured_by_banker_id: data.banker_id,
    },
    select: { id: true },
  });

  return {
    kind: existing ? "superseded" : "created",
    record: { id: created.id },
  };
}
