/*
 * Sprint 5b.2 — portfolio query helpers.
 *
 * Shared aggregation logic across the four Insight Engine portfolio
 * surfaces (Track Performance, Member portfolio, Coverage and
 * indecision, Stage-skip). Pure-function transforms over Prisma rows.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";
import type { V2Objective } from "./stage-guidance";

const STALE_MS = 90 * 24 * 60 * 60 * 1000;

export type WorkflowStateLite = {
  member_id: string;
  total_captures: number;
  factor_captures_count: number;
  signals_count: number;
  insights_count: number;
  reactions_count: number;
  open_thread_count: number;
  stale_capture_count: number;
  last_touch_at: Date | null;
  current_track_id: string | null;
  pending_action_card_count: number;
  pending_specialist_handoff_count: number;
};

export type MemberRosterRow = {
  id: string;
  slug: string;
  display_name: string;
  member_type_name: string;
  primary_banker_name: string;
  workflow_state: WorkflowStateLite | null;
  current_track_name: string | null;
};

export function dayCountSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

export async function memberRoster(
  prisma: PrismaClient,
): Promise<MemberRosterRow[]> {
  const members = await prisma.member.findMany({
    include: {
      member_type: { select: { name: true } },
      primary_banker: { select: { display_name: true } },
      workflow_state: true,
    },
  });
  const allTracks = await prisma.trackTemplate.findMany({
    select: { id: true, name: true },
  });
  const trackName = new Map(allTracks.map((t) => [t.id, t.name]));
  return members.map((m) => ({
    id: m.id,
    slug: m.slug,
    display_name: m.doing_business_as ?? m.legal_name,
    member_type_name: m.member_type.name,
    primary_banker_name: m.primary_banker.display_name,
    workflow_state: m.workflow_state
      ? {
          member_id: m.workflow_state.member_id,
          total_captures: m.workflow_state.total_captures,
          factor_captures_count: m.workflow_state.factor_captures_count,
          signals_count: m.workflow_state.signals_count,
          insights_count: m.workflow_state.insights_count,
          reactions_count: m.workflow_state.reactions_count,
          open_thread_count: m.workflow_state.open_thread_count,
          stale_capture_count: m.workflow_state.stale_capture_count,
          last_touch_at: m.workflow_state.last_touch_at,
          current_track_id: m.workflow_state.current_track_id,
          pending_action_card_count: m.workflow_state.pending_action_card_count,
          pending_specialist_handoff_count:
            m.workflow_state.pending_specialist_handoff_count,
        }
      : null,
    current_track_name: m.workflow_state?.current_track_id
      ? trackName.get(m.workflow_state.current_track_id) ?? null
      : null,
  }));
}

// ────────────────────────────────────────────────
// Block B — Track Performance
// ────────────────────────────────────────────────

export type TrackPerformanceAggregates = {
  total_count: number;
  capture_density: { low: number; medium: number; high: number };
  pending_action_cards: number;
  stale_captures: number;
  open_threads: number;
};

export type TrackPerformanceRow = {
  track_id: string;
  track_name: string;
  members: MemberRosterRow[];
  aggregates: TrackPerformanceAggregates;
};

export async function trackPerformanceData(
  prisma: PrismaClient,
): Promise<TrackPerformanceRow[]> {
  const tracks = await prisma.trackTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const roster = await memberRoster(prisma);
  return tracks.map((t) => {
    const members = roster.filter(
      (m) => m.workflow_state?.current_track_id === t.id,
    );
    const ws = (r: MemberRosterRow) => r.workflow_state;
    return {
      track_id: t.id,
      track_name: t.name,
      members,
      aggregates: {
        total_count: members.length,
        capture_density: {
          low: members.filter(
            (m) => (ws(m)?.total_captures ?? 0) <= 2,
          ).length,
          medium: members.filter((m) => {
            const n = ws(m)?.total_captures ?? 0;
            return n >= 3 && n <= 6;
          }).length,
          high: members.filter(
            (m) => (ws(m)?.total_captures ?? 0) >= 7,
          ).length,
        },
        pending_action_cards: members.filter(
          (m) => (ws(m)?.pending_action_card_count ?? 0) > 0,
        ).length,
        stale_captures: members.filter(
          (m) => (ws(m)?.stale_capture_count ?? 0) > 0,
        ).length,
        open_threads: members.filter(
          (m) => (ws(m)?.open_thread_count ?? 0) > 0,
        ).length,
      },
    };
  });
}

// ────────────────────────────────────────────────
// Block D — Coverage and indecision
// ────────────────────────────────────────────────

export type OpenIndecisionRow = {
  signal_id: string;
  member_id: string;
  member_slug: string;
  member_name: string;
  member_type_name: string;
  topic_canonical_tag: string;
  topic_display_name: string;
  member_quote: string | null;
  captured_at: Date;
  days_open: number;
  current_track_name: string | null;
  days_since_last_touch: number | null;
};

export async function openIndecisionData(
  prisma: PrismaClient,
): Promise<OpenIndecisionRow[]> {
  const indecisions = await prisma.signal.findMany({
    where: { type: "indecision", active: true },
    include: {
      member: {
        include: {
          member_type: { select: { name: true } },
          workflow_state: true,
        },
      },
      topic: { select: { canonical_tag: true, display_name: true } },
    },
    orderBy: { captured_at: "asc" },
  });
  // Per Sprint 5b.1 Block G heuristic: Indecision is "open" if no
  // subsequent Reaction exists for the same Member after the
  // Indecision's captured_at.
  const reactionsByMember = new Map<string, Date[]>();
  const allReactions = await prisma.reaction.findMany({
    select: { member_id: true, captured_at: true },
  });
  for (const r of allReactions) {
    const list = reactionsByMember.get(r.member_id) ?? [];
    list.push(r.captured_at);
    reactionsByMember.set(r.member_id, list);
  }
  const tracks = await prisma.trackTemplate.findMany({
    select: { id: true, name: true },
  });
  const trackName = new Map(tracks.map((t) => [t.id, t.name]));
  const rows: OpenIndecisionRow[] = [];
  for (const s of indecisions) {
    const subsequent = (reactionsByMember.get(s.member_id) ?? []).some(
      (rt) => rt.getTime() > s.captured_at.getTime(),
    );
    if (subsequent) continue;
    rows.push({
      signal_id: s.id,
      member_id: s.member_id,
      member_slug: s.member.slug,
      member_name: s.member.doing_business_as ?? s.member.legal_name,
      member_type_name: s.member.member_type.name,
      topic_canonical_tag: s.topic.canonical_tag,
      topic_display_name: s.topic.display_name,
      member_quote: s.their_words,
      captured_at: s.captured_at,
      days_open: dayCountSince(s.captured_at) ?? 0,
      current_track_name: s.member.workflow_state?.current_track_id
        ? trackName.get(s.member.workflow_state.current_track_id) ?? null
        : null,
      days_since_last_touch: dayCountSince(
        s.member.workflow_state?.last_touch_at ?? null,
      ),
    });
  }
  // Sort by days_open descending (longest-open first per spec D.3).
  rows.sort((a, b) => b.days_open - a.days_open);
  return rows;
}

// ────────────────────────────────────────────────
// Block E — Stage-skip
// ────────────────────────────────────────────────

export type StageSkipRow = {
  member_id: string;
  member_slug: string;
  member_name: string;
  member_type_name: string;
  current_track_id: string | null;
  current_track_name: string | null;
  skipped_objectives: V2Objective[]; // Discover/Measure that are incomplete
  later_objective_evidence: V2Objective[]; // Consult/Navigate where evidence exists
  most_recent_later_evidence_at: Date | null;
  most_recent_later_evidence_kind: string | null;
};

const OBJECTIVE_ORDER: V2Objective[] = [
  "discover",
  "measure",
  "consult",
  "navigate",
];

function isCapturedAtObjective(
  objective: V2Objective,
  required: string[],
  factorCaptureSet: Set<string>,
  symbolic: { model_produced: boolean; model_shown: boolean; reaction_captured: boolean; specialist_handoff_initiated: boolean; decision_maker_mapping: boolean },
): boolean {
  void objective; // each objective uses the same evaluation logic
  return required.every((ref) => {
    if (ref.startsWith("FACTOR-")) return factorCaptureSet.has(ref);
    switch (ref) {
      case "model_produced":
        return symbolic.model_produced;
      case "model_shown":
        return symbolic.model_shown;
      case "reaction_captured":
        return symbolic.reaction_captured;
      case "specialist_handoff_initiated":
        return symbolic.specialist_handoff_initiated;
      case "decision_maker_mapping":
        return symbolic.decision_maker_mapping;
      default:
        return false;
    }
  });
}

export async function stageSkipData(
  prisma: PrismaClient,
): Promise<StageSkipRow[]> {
  const roster = await memberRoster(prisma);
  const tracks = await prisma.trackTemplate.findMany();
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const rows: StageSkipRow[] = [];

  for (const m of roster) {
    const track_id = m.workflow_state?.current_track_id ?? null;
    if (!track_id) continue;
    const track = trackById.get(track_id);
    if (!track) continue;
    const required =
      track.required_evidence_per_objective as Record<V2Objective, string[]>;

    const [factorCaptures, models, showEvents, reactions, handoffs] =
      await Promise.all([
        prisma.factorCapture.findMany({
          where: { member_id: m.id },
          select: { factor_id: true },
        }),
        prisma.model.count({ where: { member_id: m.id, active: true } }),
        prisma.showEvent.count({ where: { member_id: m.id } }),
        prisma.reaction.count({ where: { member_id: m.id } }),
        prisma.specialistHandoff.count({ where: { member_id: m.id } }),
      ]);
    const factorSet = new Set(factorCaptures.map((c) => c.factor_id));
    const factor14 = factorCaptures.find((c) => c.factor_id === "FACTOR-014");
    const symbolic = {
      model_produced: models > 0,
      model_shown: showEvents > 0,
      reaction_captured: reactions > 0,
      specialist_handoff_initiated: handoffs > 0,
      decision_maker_mapping: !!factor14,
    };

    const completeness: Record<V2Objective, boolean> = {
      discover: isCapturedAtObjective(
        "discover",
        required.discover ?? [],
        factorSet,
        symbolic,
      ),
      measure: isCapturedAtObjective(
        "measure",
        required.measure ?? [],
        factorSet,
        symbolic,
      ),
      consult: isCapturedAtObjective(
        "consult",
        required.consult ?? [],
        factorSet,
        symbolic,
      ),
      navigate: isCapturedAtObjective(
        "navigate",
        required.navigate ?? [],
        factorSet,
        symbolic,
      ),
    };

    // Has any captured later-objective evidence?
    const hasConsultEvidence =
      symbolic.model_shown ||
      symbolic.reaction_captured ||
      (required.consult ?? []).some(
        (ref) => ref.startsWith("FACTOR-") && factorSet.has(ref),
      );
    const hasNavigateEvidence =
      symbolic.specialist_handoff_initiated ||
      (required.navigate ?? []).some(
        (ref) => ref.startsWith("FACTOR-") && factorSet.has(ref),
      );

    const skipped: V2Objective[] = [];
    if (!completeness.discover && (hasConsultEvidence || hasNavigateEvidence)) {
      skipped.push("discover");
    }
    if (!completeness.measure && (hasConsultEvidence || hasNavigateEvidence)) {
      skipped.push("measure");
    }
    if (skipped.length === 0) continue;

    const laterEvidence: V2Objective[] = [];
    if (hasConsultEvidence) laterEvidence.push("consult");
    if (hasNavigateEvidence) laterEvidence.push("navigate");

    // Most-recent later-objective evidence timestamp.
    let mostRecent: Date | null = null;
    let mostRecentKind: string | null = null;
    if (symbolic.reaction_captured) {
      const r = await prisma.reaction.findFirst({
        where: { member_id: m.id },
        orderBy: { captured_at: "desc" },
        select: { captured_at: true },
      });
      if (r) {
        mostRecent = r.captured_at;
        mostRecentKind = "Reaction";
      }
    }
    if (symbolic.model_shown) {
      const s = await prisma.showEvent.findFirst({
        where: { member_id: m.id },
        orderBy: { shown_at: "desc" },
        select: { shown_at: true },
      });
      if (s && (!mostRecent || s.shown_at > mostRecent)) {
        mostRecent = s.shown_at;
        mostRecentKind = "ShowEvent";
      }
    }

    rows.push({
      member_id: m.id,
      member_slug: m.slug,
      member_name: m.display_name,
      member_type_name: m.member_type_name,
      current_track_id: track_id,
      current_track_name: track.name,
      skipped_objectives: skipped,
      later_objective_evidence: laterEvidence,
      most_recent_later_evidence_at: mostRecent,
      most_recent_later_evidence_kind: mostRecentKind,
    });
  }
  // Sort severity descending (count of skipped objectives).
  rows.sort(
    (a, b) => b.skipped_objectives.length - a.skipped_objectives.length,
  );
  return rows;
}
