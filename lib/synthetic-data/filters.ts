/*
 * Sprint 7a — filter-responsive metric computation.
 *
 * Pure functions that take a SyntheticDataset + an active filter and
 * return scoped aggregate metrics. The dashboard hero strip + drill-
 * down views re-derive their numbers via these helpers as the URL
 * state changes.
 */

import type {
  AggregateMetrics,
  BankerMetrics,
  BranchMetrics,
  ClosedDeal,
  MemberType,
  MemberTypeMetrics,
  Phase,
  SyntheticDataset,
  SyntheticMember,
  TrackId,
  TrackMetrics,
} from "./types";
import { BLAZE_OFFERED_TRACKS, PHASE_LABELS, TRACK_LABELS, TRACK_STICKINESS } from "./types";

export type DashboardFilter = {
  track_id?: TrackId;
  member_type?: MemberType;
  phase?: Phase;
  banker_id?: string;
  branch_id?: string;
};

export type ScopedMetrics = {
  pipeline_value_face: number;
  pipeline_value_weighted: number;
  members_in_cultivation: number;
  conversations_this_week: number;
  insights_this_week: number;
  avg_discover_to_navigate_days: number;
  closed_value_12mo: number;
  closed_count_12mo: number;
  conversations_sparkline: number[];
  insights_sparkline: number[];
  closures_sparkline: number[];
  funnel_counts: Record<Phase, number>;
};

const PHASE_WEIGHTS: Record<Phase, number> = {
  discover: 0.1,
  measure: 0.35,
  consult: 0.6,
  navigate: 0.85,
};

export function isFilterEmpty(f: DashboardFilter): boolean {
  return !f.track_id && !f.member_type && !f.phase && !f.banker_id && !f.branch_id;
}

export function filterMembers(
  members: SyntheticMember[],
  f: DashboardFilter,
): SyntheticMember[] {
  return members.filter((m) => {
    if (f.track_id && m.current_track_id !== f.track_id) return false;
    if (f.member_type && m.member_type !== f.member_type) return false;
    if (f.phase && m.current_phase !== f.phase) return false;
    if (f.banker_id && m.banker_id !== f.banker_id) return false;
    if (f.branch_id && m.branch_id !== f.branch_id) return false;
    return true;
  });
}

export function filterDeals(deals: ClosedDeal[], f: DashboardFilter): ClosedDeal[] {
  return deals.filter((d) => {
    if (f.track_id && d.track_id !== f.track_id) return false;
    if (f.member_type && d.member_type !== f.member_type) return false;
    if (f.banker_id && d.originating_banker_id !== f.banker_id) return false;
    if (f.branch_id && d.originating_branch_id !== f.branch_id) return false;
    // No phase filter on closed deals — they all closed.
    if (f.phase) return false;
    return true;
  });
}

/**
 * Compute scoped metrics for an arbitrary filter. When the filter is
 * empty, returns the precomputed AggregateMetrics directly. Otherwise
 * filters Members + Deals + Daily activity and recomputes.
 */
export function computeScopedMetrics(
  dataset: SyntheticDataset,
  filter: DashboardFilter,
): ScopedMetrics {
  if (isFilterEmpty(filter)) {
    const a = dataset.aggregate_metrics;
    return {
      pipeline_value_face: a.pipeline_value_face,
      pipeline_value_weighted: a.pipeline_value_weighted,
      members_in_cultivation: a.members_in_cultivation,
      conversations_this_week: a.conversations_this_week,
      insights_this_week: a.insights_this_week,
      avg_discover_to_navigate_days: a.avg_discover_to_navigate_days,
      closed_value_12mo: a.closed_value_12mo,
      closed_count_12mo: a.closed_count_12mo,
      conversations_sparkline: a.conversations_sparkline,
      insights_sparkline: a.insights_sparkline,
      closures_sparkline: a.closures_sparkline,
      funnel_counts: a.funnel_counts,
    };
  }

  const members = filterMembers(dataset.members, filter);
  const deals = filterDeals(dataset.closed_deals, filter);

  const pipelineFace = members.reduce((s, m) => s + m.sized_opportunity_amount, 0);
  const pipelineWeighted = members.reduce(
    (s, m) => s + m.sized_opportunity_amount * PHASE_WEIGHTS[m.current_phase],
    0,
  );

  // Scale weekly metrics proportionally by member share.
  const memberShare =
    dataset.members.length > 0 ? members.length / dataset.members.length : 0;
  const a = dataset.aggregate_metrics;
  const conversationsThisWeek = Math.round(a.conversations_this_week * memberShare);
  const insightsThisWeek = Math.round(a.insights_this_week * memberShare);
  const conversationsSparkline = a.conversations_sparkline.map((v) => Math.round(v * memberShare));
  const insightsSparkline = a.insights_sparkline.map((v) => Math.round(v * memberShare));
  const closuresSparkline = computeMonthlyClosures(deals);

  // Avg Discover → Navigate days — use deals as proxy for completed cycles.
  const completedDeals = deals.filter((d) => d.days_discover_to_close > 0);
  const avgDtoN =
    completedDeals.length > 0
      ? Math.round(
          completedDeals.reduce(
            (s, d) => s + (d.days_discover_to_close - d.days_navigate_to_close),
            0,
          ) / completedDeals.length,
        )
      : a.avg_discover_to_navigate_days;

  const closedValue = deals.reduce((s, d) => s + d.closure_value, 0);

  const funnelCounts: Record<Phase, number> = {
    discover: members.filter((m) => m.current_phase === "discover").length,
    measure: members.filter((m) => m.current_phase === "measure").length,
    consult: members.filter((m) => m.current_phase === "consult").length,
    navigate: members.filter((m) => m.current_phase === "navigate").length,
  };

  return {
    pipeline_value_face: pipelineFace,
    pipeline_value_weighted: pipelineWeighted,
    members_in_cultivation: members.length,
    conversations_this_week: conversationsThisWeek,
    insights_this_week: insightsThisWeek,
    avg_discover_to_navigate_days: avgDtoN,
    closed_value_12mo: closedValue,
    closed_count_12mo: deals.length,
    conversations_sparkline: conversationsSparkline,
    insights_sparkline: insightsSparkline,
    closures_sparkline: closuresSparkline,
    funnel_counts: funnelCounts,
  };
}

function computeMonthlyClosures(deals: ClosedDeal[]): number[] {
  const months: number[] = [];
  for (let m = 11; m >= 0; m--) {
    const monthDeals = deals.filter((d) => {
      const daysAgo = Math.floor((Date.now() - d.closure_date.getTime()) / 86_400_000);
      return Math.floor(daysAgo / 30) === m;
    });
    months.push(monthDeals.length);
  }
  return months;
}

// ────────────────────────────────────────────────
// Convenience labels
// ────────────────────────────────────────────────

export function describeFilter(f: DashboardFilter, ds: SyntheticDataset): string {
  const parts: string[] = [];
  if (f.track_id) parts.push(TRACK_LABELS[f.track_id]);
  if (f.member_type) {
    const mt = ds.aggregate_metrics.member_type_metrics[f.member_type];
    if (mt) parts.push(mt.member_type.replace(/_/g, " "));
  }
  if (f.phase) parts.push(PHASE_LABELS[f.phase]);
  if (f.banker_id) {
    const b = ds.bankers.find((b) => b.id === f.banker_id);
    if (b) parts.push(b.name);
  }
  if (f.branch_id) {
    const br = ds.branches.find((br) => br.id === f.branch_id);
    if (br) parts.push(br.name);
  }
  return parts.join(" · ");
}

export { BLAZE_OFFERED_TRACKS, TRACK_LABELS, TRACK_STICKINESS };
export type { TrackMetrics, BankerMetrics, BranchMetrics, MemberTypeMetrics, AggregateMetrics };
