/*
 * Sprint 7b Block F — per-Track conversion-funnel aggregation.
 *
 * For each Track, counts Members at each of the 4 cultivation phases
 * (Discover / Measure / Consult / Navigate) plus closed deals from the
 * last 12 months (ClosedDeal entries from Stage 3 synthetic data).
 *
 * Retention semantics per spec F.1:
 *   measure_retention   = (M + C + N + Cl) / (D + M + C + N + Cl)
 *   consult_retention   = (C + N + Cl) / (M + C + N + Cl)
 *   navigate_retention  = (N + Cl) / (C + N + Cl)
 *   close_retention     = Cl / (N + Cl)
 *
 * Higher retention = banker is moving Members forward, not losing
 * them at this transition.
 */

import type {
  ClosedDeal,
  SyntheticMember,
  TrackId,
} from "@/lib/synthetic-data/types";
import { ALL_TRACK_IDS } from "./matrix-axes";

export type FunnelStage = "discover" | "measure" | "consult" | "navigate" | "closed";

export const FUNNEL_STAGES: readonly FunnelStage[] = [
  "discover",
  "measure",
  "consult",
  "navigate",
  "closed",
];

export type FunnelData = {
  track_id: TrackId;
  counts: Record<FunnelStage, number>;
  closed_value_12mo: number;
  measure_retention: number;
  consult_retention: number;
  navigate_retention: number;
  close_retention: number;
  total_in_pipeline: number;
};

export type FunnelMap = Record<TrackId, FunnelData>;

function emptyCounts(): Record<FunnelStage, number> {
  return { discover: 0, measure: 0, consult: 0, navigate: 0, closed: 0 };
}

export function aggregateFunnels(
  members: SyntheticMember[],
  closedDeals: ClosedDeal[],
): FunnelMap {
  const out: FunnelMap = {} as FunnelMap;
  for (const t of ALL_TRACK_IDS) {
    out[t] = {
      track_id: t,
      counts: emptyCounts(),
      closed_value_12mo: 0,
      measure_retention: 0,
      consult_retention: 0,
      navigate_retention: 0,
      close_retention: 0,
      total_in_pipeline: 0,
    };
  }

  for (const m of members) {
    const t = m.current_track_id as TrackId;
    const bucket = out[t];
    if (!bucket) continue;
    bucket.counts[m.current_phase] += 1;
  }
  for (const d of closedDeals) {
    const t = d.track_id as TrackId;
    const bucket = out[t];
    if (!bucket) continue;
    bucket.counts.closed += 1;
    bucket.closed_value_12mo += d.closure_value;
  }

  for (const t of ALL_TRACK_IDS) {
    const f = out[t];
    const c = f.counts;
    const ratio = (num: number, den: number) => (den > 0 ? num / den : 0);
    const afterDiscover = c.measure + c.consult + c.navigate + c.closed;
    const afterMeasure = c.consult + c.navigate + c.closed;
    const afterConsult = c.navigate + c.closed;
    f.measure_retention = ratio(afterDiscover, c.discover + afterDiscover);
    f.consult_retention = ratio(afterMeasure, c.measure + afterMeasure);
    f.navigate_retention = ratio(afterConsult, c.consult + afterConsult);
    f.close_retention = ratio(c.closed, c.navigate + c.closed);
    f.total_in_pipeline =
      c.discover + c.measure + c.consult + c.navigate + c.closed;
  }

  return out;
}
