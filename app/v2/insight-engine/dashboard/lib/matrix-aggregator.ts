/*
 * Sprint 7b Block C — Member-Type × Track matrix aggregation.
 *
 * Pure-function helper. Walks a (filter-scoped) Member list and rolls
 * up per (Member-Type, Track) intersection: Member count + total
 * sized-opportunity value. Tags each cell with the applicability flag
 * from Patch E so the view can render uncommon-but-occurring cells
 * with a visual flag.
 */

import type {
  MemberType,
  SyntheticMember,
  TrackId,
} from "@/lib/synthetic-data/types";
import { MEMBER_TYPES, ALL_TRACK_IDS } from "./matrix-axes";
import { isApplicable } from "./applicability";

export type MatrixCell = {
  member_type: MemberType;
  track_id: TrackId;
  member_count: number;
  pipeline_value: number;
  is_applicable: boolean;
  has_data: boolean;
};

export type MatrixData = {
  cells: MatrixCell[];
  by_intersection: Map<string, MatrixCell>;
  max_count: number;
  max_value: number;
};

function cellKey(mt: MemberType, t: TrackId): string {
  return `${mt}::${t}`;
}

export function aggregateMatrix(members: SyntheticMember[]): MatrixData {
  const by_intersection = new Map<string, MatrixCell>();

  // Initialize every cell so the matrix grid always renders 8×10 even
  // when an intersection has zero data.
  for (const mt of MEMBER_TYPES) {
    for (const t of ALL_TRACK_IDS) {
      by_intersection.set(cellKey(mt, t), {
        member_type: mt,
        track_id: t,
        member_count: 0,
        pipeline_value: 0,
        is_applicable: isApplicable(mt, t),
        has_data: false,
      });
    }
  }

  for (const m of members) {
    const key = cellKey(m.member_type, m.current_track_id as TrackId);
    const cell = by_intersection.get(key);
    if (!cell) continue; // unrecognized Track id; skip defensively
    cell.member_count += 1;
    cell.pipeline_value += m.sized_opportunity_amount;
    cell.has_data = true;
  }

  let max_count = 0;
  let max_value = 0;
  const cells: MatrixCell[] = [];
  for (const cell of by_intersection.values()) {
    cells.push(cell);
    if (cell.member_count > max_count) max_count = cell.member_count;
    if (cell.pipeline_value > max_value) max_value = cell.pipeline_value;
  }

  return { cells, by_intersection, max_count, max_value };
}
