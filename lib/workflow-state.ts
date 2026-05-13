/*
 * Sprint 5b.2 Block A — workflow state recompute.
 *
 * Denormalized per-Member state for portfolio surfaces. Computed on
 * capture writes (server actions call recomputeWorkflowState after
 * mutating capture data). Synchronous for demo scale; Pilot moves to
 * async queue per BUILD_LOG Architectural Note 10.
 *
 * Definitions:
 *   - total_captures            = sum of factor + signal + insight + reaction counts
 *   - open_thread_count         = Indecision Signals without subsequent Reaction
 *                                 (matches Sprint 5b.1 Block G heuristic)
 *   - stale_capture_count       = Signals or FactorCaptures captured >90d ago
 *   - last_touch_at             = max captured_at across all capture entities
 *                                 (Signal, FactorCapture, Insight, Reaction,
 *                                  Model, ShowEvent)
 *   - current_track_id          = rankTracksForMember[0].track_id (null when
 *                                 ranker returns empty)
 *   - pending_action_card_count = ActionCards in status open|in_progress
 *   - pending_specialist_handoff_count =
 *       SpecialistHandoffs in status initiated|specialist_engaged
 */

import type { PrismaClient } from "@/app/generated/prisma/client";
import { rankTracksForMember } from "./track-ranker";

const STALE_DAYS = 90;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

export async function recomputeWorkflowState(
  prisma: PrismaClient,
  memberId: string,
): Promise<void> {
  const now = Date.now();
  const [
    factorCaptures,
    signals,
    insights,
    reactions,
    models,
    showEvents,
    actionCards,
    specialistHandoffs,
  ] = await Promise.all([
    prisma.factorCapture.findMany({
      where: { member_id: memberId },
      select: { captured_at: true },
    }),
    prisma.signal.findMany({
      where: { member_id: memberId, active: true },
      select: { id: true, type: true, captured_at: true },
    }),
    prisma.insight.findMany({
      where: { member_id: memberId },
      select: { authored_at: true },
    }),
    prisma.reaction.findMany({
      where: { member_id: memberId },
      select: { captured_at: true },
    }),
    prisma.model.findMany({
      where: { member_id: memberId, active: true },
      select: { built_at: true },
    }),
    prisma.showEvent.findMany({
      where: { member_id: memberId },
      select: { shown_at: true },
    }),
    prisma.actionCard.findMany({
      where: { member_id: memberId },
      select: { status: true },
    }),
    prisma.specialistHandoff.findMany({
      where: { member_id: memberId },
      select: { status: true },
    }),
  ]);

  const factor_captures_count = factorCaptures.length;
  const signals_count = signals.length;
  const insights_count = insights.length;
  const reactions_count = reactions.length;
  const total_captures =
    factor_captures_count + signals_count + insights_count + reactions_count;

  // Open threads: Indecision Signals where no Reaction exists later.
  const reactionTimes = reactions.map((r) => r.captured_at.getTime());
  const maxReactionTime = reactionTimes.length ? Math.max(...reactionTimes) : 0;
  const open_thread_count = signals.filter(
    (s) =>
      s.type === "indecision" && s.captured_at.getTime() >= maxReactionTime,
  ).length;

  // Stale: any FactorCapture or Signal captured > STALE_DAYS ago.
  const stale_capture_count =
    factorCaptures.filter((c) => now - c.captured_at.getTime() > STALE_MS).length +
    signals.filter((s) => now - s.captured_at.getTime() > STALE_MS).length;

  // Last touch: max captured_at across all six capture entities.
  const allTimes: number[] = [
    ...factorCaptures.map((c) => c.captured_at.getTime()),
    ...signals.map((s) => s.captured_at.getTime()),
    ...insights.map((i) => i.authored_at.getTime()),
    ...reactions.map((r) => r.captured_at.getTime()),
    ...models.map((m) => m.built_at.getTime()),
    ...showEvents.map((s) => s.shown_at.getTime()),
  ];
  const last_touch_at = allTimes.length
    ? new Date(Math.max(...allTimes))
    : null;

  // Current Track via matrix-ranker (top-ranked).
  const ranked = await rankTracksForMember(prisma, memberId);
  const current_track_id = ranked[0]?.track_id ?? null;

  const pending_action_card_count = actionCards.filter(
    (a) => a.status === "open" || a.status === "in_progress",
  ).length;
  const pending_specialist_handoff_count = specialistHandoffs.filter(
    (h) => h.status === "initiated" || h.status === "specialist_engaged",
  ).length;

  const data = {
    total_captures,
    factor_captures_count,
    signals_count,
    insights_count,
    reactions_count,
    open_thread_count,
    stale_capture_count,
    last_touch_at,
    current_track_id,
    pending_action_card_count,
    pending_specialist_handoff_count,
  };

  await prisma.memberWorkflowState.upsert({
    where: { member_id: memberId },
    create: { member_id: memberId, ...data },
    update: data,
  });
}

/**
 * Recompute workflow state for all Members. Used in seed.ts after
 * fixture data lands.
 */
export async function recomputeAllWorkflowStates(
  prisma: PrismaClient,
): Promise<number> {
  const members = await prisma.member.findMany({ select: { id: true } });
  for (const m of members) {
    await recomputeWorkflowState(prisma, m.id);
  }
  return members.length;
}
