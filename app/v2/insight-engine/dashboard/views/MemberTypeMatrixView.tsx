"use client";

/*
 * Sprint 7b Block D + E — Member-Type × Track heatmap.
 *
 * 8 Member-Type rows × 10 Track columns. Cell color intensity scales
 * with the active metric (count | pipeline value). Inapplicable cells
 * (per Sprint 9 Patch E matrix) carrying data render with a dashed
 * border so the demo viewer notices "this is an uncommon fit." Click
 * any data-bearing cell → drill to a Member list filtered to that
 * (Member-Type, Track) intersection.
 */

import { useMemo, useState } from "react";
import {
  MEMBER_TYPE_LABELS,
  PHASE_LABELS,
  TRACK_LABELS,
} from "@/lib/synthetic-data/types";
import type {
  MemberType,
  SyntheticMember,
  TrackId,
} from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { SyntheticMemberLink } from "../components/MemberLink";
import { aggregateMatrix, type MatrixCell } from "../lib/matrix-aggregator";
import { MEMBER_TYPES, ALL_TRACK_IDS } from "../lib/matrix-axes";

// Warm Blaze accent at full intensity → near-white at zero. HSL
// interpolation produces a perceptually pleasing ramp. Reference orange
// is approximately HSL(20, 79%, 40%).
const ACCENT_HSL = { h: 20, s: 79 };
function intensityFill(ratio: number, applicable: boolean): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  // Light fill background; high ratio darkens. Inapplicable cells use
  // a slightly desaturated variant so the dashed border + muted color
  // both read as "this is uncommon."
  const lightness = 95 - clamped * 50; // 95% → 45%
  const sat = applicable ? ACCENT_HSL.s : ACCENT_HSL.s - 35;
  return `hsl(${ACCENT_HSL.h}, ${sat}%, ${lightness}%)`;
}

function isLightFill(lightness: number): boolean {
  return lightness > 60;
}

function fmtValue(v: number): string {
  if (v === 0) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

export function MemberTypeMatrixView({
  members,
}: {
  members: SyntheticMember[];
}) {
  const { state, setMatrixMetric } = useFilterState();
  const metric = state.matrix_metric;

  const matrix = useMemo(() => aggregateMatrix(members), [members]);
  const maxForMetric =
    metric === "count" ? matrix.max_count : matrix.max_value;

  const [drill, setDrill] = useState<{
    member_type: MemberType;
    track_id: TrackId;
  } | null>(null);

  const drillMembers = useMemo(() => {
    if (!drill) return [];
    return members
      .filter(
        (m) =>
          m.member_type === drill.member_type &&
          (m.current_track_id as TrackId) === drill.track_id,
      )
      .sort((a, b) => b.sized_opportunity_amount - a.sized_opportunity_amount);
  }, [drill, members]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-blaze-charcoal">
              Lending product overview by member type
            </h2>
            <p className="mt-1 text-[12px] text-blaze-grey-body">
              Number of members exploring each lending product
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-blaze-grey-soft">Show:</span>
            <button
              type="button"
              onClick={() => setMatrixMetric("count")}
              aria-pressed={metric === "count"}
              className={
                metric === "count"
                  ? "rounded-full bg-blaze-orange-deep px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-blaze-rule bg-white px-3 py-1 text-xs font-medium text-blaze-grey-body hover:border-blaze-orange-deep/40 hover:text-blaze-orange-deep"
              }
            >
              Member count
            </button>
            <button
              type="button"
              onClick={() => setMatrixMetric("value")}
              aria-pressed={metric === "value"}
              className={
                metric === "value"
                  ? "rounded-full bg-blaze-orange-deep px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-blaze-rule bg-white px-3 py-1 text-xs font-medium text-blaze-grey-body hover:border-blaze-orange-deep/40 hover:text-blaze-orange-deep"
              }
            >
              Pipeline value
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <thead>
              <tr>
                <th className="w-44 px-2 pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft" />
                {ALL_TRACK_IDS.map((t) => (
                  <th
                    key={t}
                    className="px-1 pb-2 text-left text-[10px] font-semibold uppercase tracking-[0.04em] text-blaze-grey-body"
                    title={`${t} · ${TRACK_LABELS[t]}`}
                  >
                    <span className="block truncate">{TRACK_LABELS[t]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEMBER_TYPES.map((mt) => (
                <tr key={mt}>
                  <th
                    scope="row"
                    className="px-2 py-1 text-left text-[12px] font-medium text-blaze-charcoal"
                  >
                    {MEMBER_TYPE_LABELS[mt]}
                  </th>
                  {ALL_TRACK_IDS.map((t) => {
                    const cell = matrix.by_intersection.get(`${mt}::${t}`)!;
                    return (
                      <MatrixCellTd
                        key={t}
                        cell={cell}
                        metric={metric}
                        maxForMetric={maxForMetric}
                        active={
                          drill?.member_type === mt && drill?.track_id === t
                        }
                        onClick={() =>
                          cell.has_data
                            ? setDrill({ member_type: mt, track_id: t })
                            : null
                        }
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-blaze-grey-body">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-6 rounded"
              style={{ background: intensityFill(0.15, true) }}
            />
            <span
              className="h-3 w-6 rounded"
              style={{ background: intensityFill(0.55, true) }}
            />
            <span
              className="h-3 w-6 rounded"
              style={{ background: intensityFill(1, true) }}
            />
            <span>low → high {metric === "count" ? "count" : "value"}</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-3 w-6 rounded border border-dashed border-blaze-grey-body"
              style={{ background: intensityFill(0.5, false) }}
            />
            <span>uncommon for this Member-Type</span>
          </span>
        </div>
      </div>

      {drill && (
        <div className="rounded border border-blaze-rule bg-white p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              {MEMBER_TYPE_LABELS[drill.member_type]} · {TRACK_LABELS[drill.track_id]}{" "}
              ({drillMembers.length})
            </p>
            <button
              type="button"
              onClick={() => setDrill(null)}
              className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
            >
              close drill-down ×
            </button>
          </div>
          {drillMembers.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-blaze-grey-soft">
              No Members in this intersection.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-blaze-rule text-[12px]">
              {drillMembers.slice(0, 30).map((m) => (
                <li key={m.id} className="flex items-baseline gap-3 py-2">
                  <SyntheticMemberLink
                    member={m}
                    className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"
                  />
                  <span className="w-24 text-blaze-grey-soft">
                    {PHASE_LABELS[m.current_phase]}
                  </span>
                  <span className="w-20 text-right text-blaze-charcoal">
                    ${(m.sized_opportunity_amount / 1000).toFixed(0)}K
                  </span>
                </li>
              ))}
              {drillMembers.length > 30 && (
                <li className="py-2 text-[11px] italic text-blaze-grey-soft">
                  Showing first 30 of {drillMembers.length}.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MatrixCellTd({
  cell,
  metric,
  maxForMetric,
  active,
  onClick,
}: {
  cell: MatrixCell;
  metric: "count" | "value";
  maxForMetric: number;
  active: boolean;
  onClick: () => void;
}) {
  const raw = metric === "count" ? cell.member_count : cell.pipeline_value;
  const ratio = maxForMetric > 0 ? raw / maxForMetric : 0;
  const fill = cell.has_data
    ? intensityFill(ratio, cell.is_applicable)
    : "transparent";
  // Lightness reverse-derived for label color decision (mirrors
  // intensityFill formula).
  const lightness = 95 - Math.max(0, Math.min(1, ratio)) * 50;
  const labelDark = isLightFill(lightness) || !cell.has_data;
  const flagInapplicable = cell.has_data && !cell.is_applicable;
  const label = cell.has_data
    ? metric === "count"
      ? String(cell.member_count)
      : fmtValue(cell.pipeline_value)
    : "";

  return (
    <td
      className="p-0.5"
      title={`${MEMBER_TYPE_LABELS[cell.member_type]} · ${TRACK_LABELS[cell.track_id]} · ${cell.member_count} Members · ${fmtValue(cell.pipeline_value)} pipeline${cell.is_applicable ? " · typical for this Member-Type" : " · uncommon for this Member-Type"}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!cell.has_data}
        className={`flex h-12 w-full items-center justify-center rounded text-[11px] transition-shadow ${
          flagInapplicable
            ? "border border-dashed border-blaze-grey-body"
            : cell.has_data
            ? "border border-blaze-rule/60"
            : "border border-blaze-rule/30"
        } ${
          cell.has_data
            ? "cursor-pointer hover:shadow-sm"
            : "cursor-default opacity-50"
        } ${active ? "ring-2 ring-blaze-orange-deep" : ""}`}
        style={{ background: fill, color: labelDark ? "#1c1917" : "#fff" }}
      >
        <span className="font-medium">{label}</span>
      </button>
    </td>
  );
}
