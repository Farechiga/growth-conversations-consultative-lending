/*
 * Priority computation for the "What's hot" sidebar — Sprint 1 Prompt 1 §B.
 *
 * Pure function over Member state. Returns the top 4 items demanding the
 * banker's attention right now, ranked by transparent bucketed rules.
 *
 * Buckets (in priority order):
 *   1. Overdue ActionCards
 *   2. Open Recommendations awaiting decision
 *   3. Aging painful/threatening Signals not yet linked to a Recommendation
 *   4. Recently captured high-engagement Artifact shares
 *
 * Capped at 4 items total. Empty buckets contribute nothing — no padding
 * with placeholders, no "everything looks calm" empty-state text. Empty real
 * estate is better than filler.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";
import { formatRecommendationSize } from "@/lib/format-size";

export type Priority = {
  id: string;
  bucket: 1 | 2 | 3 | 4;
  label: string;
  detail: string;
  linked_entity_id: string;
  linked_entity_type: "action_card" | "recommendation" | "signal" | "artifact_share";
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

function fmtAge(days: number): string {
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"}`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"}`;
}

function dollars(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * Strip the trailing " for [member_type]" suffix from a Track name when
 * displaying on a Member profile (where context already establishes the
 * Member Type). Per Sprint 1 §A.5.
 */
export function shortTrackName(fullName: string): string {
  return fullName.replace(/ for [a-z A-Z&]+$/, "");
}

/**
 * Compute the top priorities for a Member's "what's hot" sidebar.
 * Caller passes a Prisma client + the demo "now" anchor (so test/demo time
 * is controllable independent of wall-clock).
 *
 * Deduplication discipline (Sprint 1 review fix #1):
 *   When a higher-bucket priority already represents a Recommendation —
 *   either by being that Recommendation directly (Bucket 2) or by being
 *   linked to it (Bucket 1 ActionCard → de-risks-rec, Bucket 4 Artifact
 *   share → supports-rec) — lower-bucket items that surface the same
 *   underlying Recommendation are suppressed.
 *
 *   The same opportunity demanding attention from multiple angles
 *   (overdue follow-up + member leaning yes) is one item to surface, not
 *   two. Bucket order is the priority: bankers should see the most-acute
 *   framing of an opportunity, not all framings.
 */
export async function computeTopPriorities(
  prisma: PrismaClient,
  memberId: string,
  now: Date,
): Promise<Priority[]> {
  const items: Priority[] = [];
  // Track Recommendation IDs already represented by an emitted priority.
  // Populated by Bucket 1 (linked rec), Bucket 2 (the rec itself), and
  // Bucket 4 (the supported rec). Bucket 3 Signals are excluded by query
  // from any rec linkage so they don't contribute, but they still consult
  // the set in case a future bucket-ordering revision makes them relevant.
  const representedRecIds = new Set<string>();

  // ─── Bucket 1 — Overdue ActionCards ─────────────────────────────
  // ActionCard.origin_growth_step_execution is typically the Resolve-shape
  // step, which itself does not carry produced_recommendation (the Show
  // step does). To name the opportunity, walk the ActionCard's origin
  // Conversation and find any GrowthStepExecution that produced a
  // Recommendation. For follow_up cards spawned from a track that closed
  // with a sized proposal, this surfaces "Working Capital LOC at $75K".
  const overdue = await prisma.actionCard.findMany({
    where: {
      member_id: memberId,
      status: { in: ["open", "in_progress"] },
      due_at: { lt: now },
    },
    include: {
      origin_conversation: {
        include: {
          growth_step_executions: {
            include: { produced_recommendation: { include: { product: true } } },
          },
        },
      },
    },
    orderBy: { due_at: "asc" },
  });
  for (const c of overdue) {
    const days = daysBetween(now, c.due_at);
    const linkedRec = c.origin_conversation.growth_step_executions
      .map((e) => e.produced_recommendation)
      .find((r): r is NonNullable<typeof r> => r !== null);
    // Sprint 4 §A.4 — read structured size via formatRecommendationSize
    // (handles single value and range cases). Falls back to ActionCard
    // type label when no linked Rec exists.
    const sizedName = linkedRec
      ? (() => {
          const sized = formatRecommendationSize(linkedRec);
          return sized ? `${linkedRec.product.name} at ${sized}` : linkedRec.product.name;
        })()
      : null;
    const opportunityName = sizedName ?? c.type.replace(/_/g, " ");
    items.push({
      id: `card-${c.id}`,
      bucket: 1,
      label: `Follow up overdue · ${opportunityName} · ${days} day${days === 1 ? "" : "s"} late`,
      detail: c.rationale.slice(0, 120) + (c.rationale.length > 120 ? "…" : ""),
      linked_entity_id: c.id,
      linked_entity_type: "action_card",
    });
    if (linkedRec) representedRecIds.add(linkedRec.id);
  }

  // ─── Bucket 2 — Recommendations awaiting decision ───────────────
  // Sprint 2 §A.2: the separate `status` field was retired; lifecycle
  // position is now read from `response` alone. This bucket gates on
  // mid-journey response values — engaged / leaning_yes / neutral /
  // leaning_no — explicitly excluding terminal states (`funded`, `declined`)
  // and the sub-mid-journey states (`committed` is post-decision and
  // arguably belongs in a separate "closing pipeline" bucket; for now
  // include it here so committed-but-not-yet-funded opportunities still
  // surface as awaiting attention).
  const awaiting = await prisma.recommendation.findMany({
    where: {
      member_id: memberId,
      response: { in: ["engaged", "leaning_yes", "neutral", "leaning_no", "committed"] },
    },
    include: {
      product: true,
    },
    orderBy: { created_at: "desc" },
  });
  for (const r of awaiting) {
    // Dedup: if this Recommendation is already represented by a higher-
    // bucket item (e.g., an overdue ActionCard de-risking it), skip.
    if (representedRecIds.has(r.id)) continue;
    // Sprint 4 §A.4 — structured size via formatRecommendationSize;
    // single value or range as appropriate.
    const sized = formatRecommendationSize(r);
    const sizeStr = sized ? ` at ${sized}` : "";
    const responseLabel = r.response.replace(/_/g, " ");
    const concernDetail = r.primary_concern
      ? `Primary concern: ${r.primary_concern.replace(/_/g, " ")}`
      : "Awaiting follow-up";
    items.push({
      id: `rec-${r.id}`,
      bucket: 2,
      label: `Awaiting decision · ${r.product.name}${sizeStr} · member ${responseLabel}`,
      detail: concernDetail,
      linked_entity_id: r.id,
      linked_entity_type: "recommendation",
    });
    representedRecIds.add(r.id);
  }

  // ─── Bucket 3 — Aging painful/threatening Signals not in any Rec ─────
  // Signals here are filtered to those with no responding_recommendations,
  // so by construction they cannot duplicate a represented Recommendation.
  // No further dedup needed; they pass through directly.
  const aging = await prisma.signal.findMany({
    where: {
      member_id: memberId,
      active: true,
      severity: { in: ["painful", "threatening"] },
      captured_at: { lt: new Date(now.getTime() - 30 * MS_PER_DAY) },
      responding_recommendations: { none: {} },
    },
    include: { topic: true },
    orderBy: { captured_at: "asc" },
  });
  for (const s of aging) {
    const days = daysBetween(now, s.captured_at);
    items.push({
      id: `signal-${s.id}`,
      bucket: 3,
      label: `Unaddressed · ${s.topic.display_name} · ${fmtAge(days)} stale`,
      detail: s.their_words ? `"${s.their_words.slice(0, 100)}${s.their_words.length > 100 ? "…" : ""}"` : "(no member quote captured)",
      linked_entity_id: s.id,
      linked_entity_type: "signal",
    });
  }

  // ─── Bucket 4 — Recent Artifact shares the member kept ──────────
  // Sprint 1 review fix #4: previously gated on captured_data.member_reaction
  // === "engaged". The schema collapse moved engagement quality canonically
  // to Recommendation.response, so this filter now uses shared_afterward
  // as the standalone signal (the member chose to take the artifact home —
  // a behavioral signal independent of any reaction-label capture). The
  // engagement quality of the underlying opportunity, where present, is
  // already reflected in the dedup against represented Recommendation IDs:
  // a positive opportunity that's also surfaced via Bucket 1/2 will not
  // duplicate-emit here.
  const recentShares = await prisma.growthStepExecution.findMany({
    where: {
      conversation: { member_id: memberId },
      executed_at: { gt: new Date(now.getTime() - 14 * MS_PER_DAY) },
      growth_step: { step_shape: "show" },
    },
    include: {
      growth_step: { include: { artifact: true } },
      conversation: { select: { id: true, created_at: true } },
      produced_recommendation: { include: { product: true } },
    },
    orderBy: { executed_at: "desc" },
  });
  for (const e of recentShares) {
    const captured = e.captured_data as {
      shared_afterward?: boolean;
    };
    if (!captured.shared_afterward) continue;
    if (!e.growth_step?.artifact) continue;
    // Dedup: if this share supports a Recommendation already represented by
    // a higher-bucket item (e.g., that Rec's overdue follow-up ActionCard),
    // skip — surfacing the share separately would just be a third angle on
    // the same opportunity.
    if (e.produced_recommendation && representedRecIds.has(e.produced_recommendation.id)) continue;
    const days = daysBetween(now, e.conversation.created_at);
    items.push({
      id: `share-${e.id}`,
      bucket: 4,
      label: `Member engaged · ${e.growth_step.artifact.title} · sent as takeaway ${fmtAge(days)} ago`,
      detail: e.produced_recommendation
        ? `Supports ${e.produced_recommendation.product.name}`
        : e.growth_step.artifact.title,
      linked_entity_id: e.id,
      linked_entity_type: "artifact_share",
    });
    if (e.produced_recommendation) representedRecIds.add(e.produced_recommendation.id);
  }

  // Sort by bucket then by within-bucket order already applied above; cap at 4.
  items.sort((a, b) => a.bucket - b.bucket);
  return items.slice(0, 4);
}
