"use client";

/*
 * Sprint 7b Block G + H — conversion-funnel small multiples + zoom modal.
 *
 * Renders one compact funnel per Track in a responsive grid (5 cols on
 * wide screens, fewer on narrow). Click any small funnel → opens a
 * zoom modal with a full-scale funnel; click any stage in the modal →
 * drill to a Member list filtered to (Track, Stage). URL state encodes
 * the zoom focus via `focus_track` so direct-link navigation lands
 * already-zoomed.
 */

import { useMemo, useState } from "react";
import {
  PHASE_LABELS,
  TRACK_LABELS,
} from "@/lib/synthetic-data/types";
import type {
  ClosedDeal,
  Phase,
  SyntheticMember,
  TrackId,
} from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { SyntheticMemberLink } from "../components/MemberLink";
import {
  aggregateFunnels,
  FUNNEL_STAGES,
  type FunnelData,
  type FunnelStage,
} from "../lib/funnel-aggregator";
import { ALL_TRACK_IDS } from "../lib/matrix-axes";

const STAGE_LABELS: Record<FunnelStage, string> = {
  discover: "Discover",
  measure: "Measure",
  consult: "Consult",
  navigate: "Navigate",
  closed: "Closed (12mo)",
};

const STAGE_TO_PHASE: Record<FunnelStage, Phase | null> = {
  discover: "discover",
  measure: "measure",
  consult: "consult",
  navigate: "navigate",
  closed: null,
};

function fmtPct(r: number): string {
  if (r <= 0) return "—";
  return `${Math.round(r * 100)}%`;
}

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

export function ConversionFunnelsView({
  members,
  closedDeals,
}: {
  members: SyntheticMember[];
  closedDeals: ClosedDeal[];
}) {
  const { state, setFocusTrack } = useFilterState();
  const funnels = useMemo(
    () => aggregateFunnels(members, closedDeals),
    [members, closedDeals],
  );

  const focusTrack = state.focus_track ?? null;
  const focusFunnel = focusTrack ? funnels[focusTrack] : null;

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <h2 className="text-lg font-semibold text-blaze-charcoal">
          Conversion funnels per Track
        </h2>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          Stage-to-stage retention by lending product. Each funnel uses
          its own internal scale (widths are proportional within that
          Track). Click a funnel to zoom in.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ALL_TRACK_IDS.map((t) => (
            <SmallFunnel
              key={t}
              funnel={funnels[t]}
              onClick={() => setFocusTrack(t)}
            />
          ))}
        </div>
      </div>

      {focusFunnel && (
        <ZoomModal
          funnel={focusFunnel}
          members={members}
          onClose={() => setFocusTrack(undefined)}
        />
      )}
    </div>
  );
}

function SmallFunnel({
  funnel,
  onClick,
}: {
  funnel: FunnelData;
  onClick: () => void;
}) {
  const maxCount = Math.max(...FUNNEL_STAGES.map((s) => funnel.counts[s]), 1);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-stretch rounded border border-blaze-rule bg-white p-3 text-left transition-shadow hover:border-blaze-orange-deep/40 hover:shadow-sm"
    >
      <p className="text-[11px] font-semibold leading-tight text-blaze-charcoal">
        {TRACK_LABELS[funnel.track_id]}
      </p>
      <p className="mt-0.5 text-[10px] text-blaze-grey-soft">
        {funnel.total_in_pipeline} in pipeline
      </p>
      <div className="mt-2 space-y-0.5">
        {FUNNEL_STAGES.map((s, i) => {
          const count = funnel.counts[s];
          const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const ret =
            i === 0
              ? null
              : i === 1
              ? funnel.measure_retention
              : i === 2
              ? funnel.consult_retention
              : i === 3
              ? funnel.navigate_retention
              : funnel.close_retention;
          return (
            <div key={s} className="flex items-center gap-1 text-[10px]">
              <div className="w-14 truncate text-blaze-grey-body">
                {STAGE_LABELS[s].replace(" (12mo)", "")}
              </div>
              <div className="relative h-3 flex-1 overflow-hidden rounded bg-blaze-cream/30">
                <div
                  className={`absolute inset-y-0 left-0 ${
                    s === "closed"
                      ? "bg-green-600/70"
                      : "bg-blaze-orange-deep/70"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="w-8 text-right text-blaze-charcoal">{count}</div>
              {ret !== null && (
                <div className="w-9 text-right text-[9px] text-blaze-grey-soft">
                  {fmtPct(ret)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

function ZoomModal({
  funnel,
  members,
  onClose,
}: {
  funnel: FunnelData;
  members: SyntheticMember[];
  onClose: () => void;
}) {
  const [drillStage, setDrillStage] = useState<FunnelStage | null>(null);
  const maxCount = Math.max(...FUNNEL_STAGES.map((s) => funnel.counts[s]), 1);

  const drillMembers = useMemo(() => {
    if (!drillStage) return [];
    const phase = STAGE_TO_PHASE[drillStage];
    if (!phase) return []; // closed-stage drill not surfaced for synthetic members
    return members
      .filter(
        (m) =>
          (m.current_track_id as TrackId) === funnel.track_id &&
          m.current_phase === phase,
      )
      .sort((a, b) => b.sized_opportunity_amount - a.sized_opportunity_amount);
  }, [drillStage, funnel.track_id, members]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="funnel-zoom-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded border border-blaze-rule bg-white p-6 shadow-xl"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="funnel-zoom-title"
            className="text-base font-semibold text-blaze-charcoal"
          >
            {TRACK_LABELS[funnel.track_id]} — conversion funnel
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
            aria-label="Close funnel zoom"
          >
            × Close
          </button>
        </div>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          {funnel.total_in_pipeline} Members in pipeline · closed value last
          12 months: {fmtUSD(funnel.closed_value_12mo)}. Click any stage to
          see the Members at that stage.
        </p>

        <div className="mt-5 space-y-2">
          {FUNNEL_STAGES.map((s, i) => {
            const count = funnel.counts[s];
            const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const ret =
              i === 0
                ? null
                : i === 1
                ? funnel.measure_retention
                : i === 2
                ? funnel.consult_retention
                : i === 3
                ? funnel.navigate_retention
                : funnel.close_retention;
            const canDrill = STAGE_TO_PHASE[s] !== null;
            const active = drillStage === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => canDrill && setDrillStage(active ? null : s)}
                disabled={!canDrill || count === 0}
                className={`flex items-center gap-3 rounded px-3 py-2 text-left transition-colors ${
                  canDrill && count > 0
                    ? "hover:bg-blaze-cream/40"
                    : "cursor-default opacity-60"
                } ${active ? "bg-blaze-cream/60" : ""} w-full`}
              >
                <div className="w-24 text-[12px] font-medium text-blaze-charcoal">
                  {STAGE_LABELS[s]}
                </div>
                <div className="relative h-7 flex-1 overflow-hidden rounded bg-blaze-cream/30">
                  <div
                    className={`absolute inset-y-0 left-0 ${
                      s === "closed"
                        ? "bg-green-600/70"
                        : "bg-blaze-orange-deep/70"
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-semibold text-blaze-charcoal">
                    {count}
                  </span>
                </div>
                <div className="w-20 text-right text-[11px] text-blaze-grey-body">
                  {ret !== null ? `${fmtPct(ret)} retained` : "—"}
                </div>
              </button>
            );
          })}
        </div>

        {drillStage && drillMembers.length > 0 && (
          <div className="mt-5 rounded border border-blaze-rule bg-blaze-cream/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              {STAGE_LABELS[drillStage]} · {drillMembers.length} Members
            </p>
            <ul className="mt-2 divide-y divide-blaze-rule/60 text-[12px]">
              {drillMembers.slice(0, 12).map((m) => (
                <li key={m.id} className="flex items-baseline gap-3 py-1.5">
                  <SyntheticMemberLink
                    member={m}
                    className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"
                  />
                  <span className="w-32 text-blaze-grey-soft">
                    {m.member_type.replace(/_/g, " ")}
                  </span>
                  <span className="w-16 text-right text-blaze-charcoal">
                    {m.days_in_current_phase}d
                  </span>
                  <span className="w-20 text-right text-blaze-charcoal">
                    ${(m.sized_opportunity_amount / 1000).toFixed(0)}K
                  </span>
                </li>
              ))}
              {drillMembers.length > 12 && (
                <li className="py-1.5 text-[11px] italic text-blaze-grey-soft">
                  Showing first 12 of {drillMembers.length}.
                </li>
              )}
            </ul>
          </div>
        )}
        {drillStage && drillMembers.length === 0 && drillStage !== "closed" && (
          <p className="mt-4 text-[12px] italic text-blaze-grey-soft">
            No Members at this stage for this Track.
          </p>
        )}
        {drillStage === "closed" && (
          <p className="mt-4 text-[12px] italic text-blaze-grey-soft">
            Closed deals link to the closure record, not active Members.
            Use the lending-product mix view to drill into closed deals.
          </p>
        )}
      </div>
    </div>
  );
}
