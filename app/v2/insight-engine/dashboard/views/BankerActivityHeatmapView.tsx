"use client";

/*
 * Sprint 7a Block I — banker activity heatmap.
 * Sprint 7a-patch Block D — heatmap fills canvas width; cells thicker;
 * click cell → drill to "Members touched on this day" with route to
 * fixture pages via SyntheticMemberLink.
 *
 * 14 bankers × 90 days. Sorted by 90-day total activity (highest first).
 * 5-tier color scale. Vacation gaps visible as continuous empty cells.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Banker,
  BankerMetrics,
  DailyActivity,
  SyntheticMember,
} from "@/lib/synthetic-data/types";
import { PHASE_LABELS, TRACK_LABELS } from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { SyntheticMemberLink } from "../components/MemberLink";

const CELL_H = 22;
const ROW_GAP = 4;
const LABEL_W = 160;
const RIGHT_PAD = 48;
const TOP_PAD = 8;
const BOTTOM_PAD = 28;

export function BankerActivityHeatmapView({
  bankers,
  daily,
  bankerMetrics,
  members,
}: {
  bankers: Banker[];
  daily: DailyActivity[];
  bankerMetrics: Record<string, BankerMetrics>;
  members: SyntheticMember[];
}) {
  const { toggleBanker, state } = useFilterState();
  const [hovered, setHovered] = useState<{
    bankerId: string;
    daysAgo: number;
    events: number;
  } | null>(null);
  const [selected, setSelected] = useState<{
    bankerId: string;
    daysAgo: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const obs = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth);
    });
    obs.observe(el);
    setContainerWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const sortedBankers = useMemo(() => {
    return [...bankers].sort(
      (a, b) =>
        (bankerMetrics[b.id]?.total_activity_90d ?? 0) -
        (bankerMetrics[a.id]?.total_activity_90d ?? 0),
    );
  }, [bankers, bankerMetrics]);

  // 90 days ordered oldest → newest left-to-right.
  const dayCols = useMemo(() => {
    return [...daily].sort((a, b) => b.days_ago - a.days_ago);
  }, [daily]);

  const availableWidth = Math.max(
    containerWidth - LABEL_W - RIGHT_PAD,
    dayCols.length * 6,
  );
  const cellW = Math.max(6, Math.floor(availableWidth / dayCols.length));
  const svgWidth = LABEL_W + dayCols.length * cellW + RIGHT_PAD;
  const svgHeight =
    sortedBankers.length * (CELL_H + ROW_GAP) + TOP_PAD + BOTTOM_PAD;

  function cellColor(events: number): string {
    if (events === 0) return "#f5f5f4";
    if (events <= 3) return "#fde68a";
    if (events <= 6) return "#fbbf24";
    if (events <= 9) return "#d97706";
    return "#92400e";
  }

  const selectedBanker = selected
    ? bankers.find((b) => b.id === selected.bankerId)
    : null;
  const selectedDay = selected
    ? dayCols.find((d) => d.days_ago === selected.daysAgo)
    : null;
  const drilledMembers = useMemo(() => {
    if (!selected) return [] as SyntheticMember[];
    // Demo proxy: surface up to ~8 Members assigned to this banker. The
    // synthetic dataset doesn't track per-day touch records at Member
    // granularity, so we cap by capture_density tier (a richer-density
    // Member is more likely to have been touched on a high-activity day).
    return members
      .filter((m) => m.banker_id === selected.bankerId)
      .sort((a, b) => {
        const tier = (t: SyntheticMember["capture_density_tier"]) =>
          t === "lot" ? 2 : t === "some" ? 1 : 0;
        return tier(b.capture_density_tier) - tier(a.capture_density_tier);
      })
      .slice(0, 8);
  }, [selected, members]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <h2 className="text-lg font-semibold text-blaze-charcoal">
          Banker activity
        </h2>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          14 bankers × 90 days. Cell color reflects daily capture events. Sorted by 90-day total. Click a banker name to filter the dashboard, or click a cell to see Members touched that day. Vacation gaps appear as continuous empty cells.
        </p>

        <div ref={containerRef} className="mt-5 w-full">
          <svg
            width={svgWidth}
            height={svgHeight}
            role="img"
            aria-label="Banker activity heatmap"
            className="block w-full"
          >
            {sortedBankers.map((b, rowIdx) => {
              const y = TOP_PAD + rowIdx * (CELL_H + ROW_GAP);
              const totalActivity =
                bankerMetrics[b.id]?.total_activity_90d ?? 0;
              const isFiltered = state.banker_id === b.id;
              return (
                <g key={b.id} transform={`translate(0, ${y})`}>
                  <foreignObject
                    x={0}
                    y={0}
                    width={LABEL_W - 10}
                    height={CELL_H + ROW_GAP}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleBanker(isFiltered ? undefined : b.id)
                      }
                      className={`block w-full truncate text-left leading-[22px] transition-colors ${
                        isFiltered || selected?.bankerId === b.id
                          ? "text-[13px] font-bold text-blaze-orange-deep"
                          : "text-[12px] text-blaze-charcoal hover:text-blaze-orange-deep"
                      }`}
                      title={`${b.name} · ${totalActivity} events in 90 days`}
                    >
                      {b.name}
                    </button>
                  </foreignObject>
                  {dayCols.map((d, colIdx) => {
                    const events = d.per_banker_activity[b.id]?.events_count ?? 0;
                    const x = LABEL_W + colIdx * cellW;
                    const isSelectedCell =
                      selected?.bankerId === b.id &&
                      selected?.daysAgo === d.days_ago;
                    return (
                      <rect
                        key={d.days_ago}
                        x={x}
                        y={0}
                        width={cellW - 1}
                        height={CELL_H}
                        fill={cellColor(events)}
                        stroke={isSelectedCell ? "#1c1917" : "transparent"}
                        strokeWidth={isSelectedCell ? 1.5 : 0}
                        onMouseEnter={() =>
                          setHovered({
                            bankerId: b.id,
                            daysAgo: d.days_ago,
                            events,
                          })
                        }
                        onMouseLeave={() => setHovered(null)}
                        onClick={() =>
                          setSelected((cur) =>
                            cur &&
                            cur.bankerId === b.id &&
                            cur.daysAgo === d.days_ago
                              ? null
                              : { bankerId: b.id, daysAgo: d.days_ago },
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <title>
                          {b.name} · Day -{d.days_ago} · {events} events
                          {d.per_banker_activity[b.id]?.on_vacation
                            ? " (vacation)"
                            : ""}
                        </title>
                      </rect>
                    );
                  })}
                  <text
                    x={LABEL_W + dayCols.length * cellW + 6}
                    y={CELL_H - 6}
                    fontSize={11}
                    fill="#6b7280"
                  >
                    {totalActivity}
                  </text>
                </g>
              );
            })}
            <text x={LABEL_W} y={svgHeight - 8} fontSize={10} fill="#9ca3af">
              ← 90 days ago
            </text>
            <text
              x={LABEL_W + dayCols.length * cellW - 50}
              y={svgHeight - 8}
              fontSize={10}
              fill="#9ca3af"
            >
              today →
            </text>
          </svg>
        </div>

        <ul className="mt-3 flex flex-wrap gap-3 text-[10px] text-blaze-grey-body">
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: "#f5f5f4" }}
            />
            0 events
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: "#fde68a" }}
            />
            1–3
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: "#fbbf24" }}
            />
            4–6
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: "#d97706" }}
            />
            7–9
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ backgroundColor: "#92400e" }}
            />
            10+
          </li>
          {hovered && (
            <li className="ml-auto text-blaze-grey-body">
              {bankers.find((b) => b.id === hovered.bankerId)?.name} · Day -
              {hovered.daysAgo} ·{" "}
              <span className="font-semibold text-blaze-charcoal">
                {hovered.events}
              </span>{" "}
              events
            </li>
          )}
        </ul>
      </div>

      {selected && selectedBanker && selectedDay && (
        <div className="rounded border border-blaze-rule bg-white p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
                {selectedBanker.name} —{" "}
                {selectedDay.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                — {selectedDay.per_banker_activity[selectedBanker.id]?.events_count ?? 0} events
              </p>
              <p className="text-[11px] text-blaze-grey-soft">
                Members touched that day (representative sample from this
                banker&rsquo;s roster).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
            >
              close drill-down ×
            </button>
          </div>
          {drilledMembers.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-blaze-grey-soft">
              No Members on this banker&rsquo;s roster under current filters.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-blaze-rule text-[12px]">
              {drilledMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2"
                >
                  <SyntheticMemberLink
                    member={m}
                    className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"
                  />
                  <span className="text-[11px] text-blaze-grey-soft">
                    {m.member_type.replace(/_/g, " ")} ·{" "}
                    {TRACK_LABELS[
                      m.current_track_id as keyof typeof TRACK_LABELS
                    ] ?? m.current_track_id}{" "}
                    · {PHASE_LABELS[m.current_phase]}
                  </span>
                  <span className="text-right text-[11px] text-blaze-charcoal">
                    ${(m.sized_opportunity_amount / 1000).toFixed(0)}K
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
