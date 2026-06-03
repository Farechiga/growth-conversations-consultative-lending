"use client";

/*
 * Sprint 7a Block D — filter tag row.
 *
 * Two strips:
 *   1. Visualization tags (mutually exclusive; controls main canvas).
 *   2. Filter chips (multi-select; scopes data within current view).
 */

import {
  DEFAULT_VIEW,
  VIEW_LABELS,
  useFilterState,
  type DashboardView,
} from "../hooks/use-filter-state";
import { TRACK_LABELS } from "@/lib/synthetic-data/types";
import type { MemberType, Phase, TrackId } from "@/lib/synthetic-data/types";
import { MEMBER_TYPE_LABELS, PHASE_LABELS } from "@/lib/synthetic-data/types";

const VIEWS: DashboardView[] = [
  "phase-funnel",
  "lending-product-mix",
  "geographic",
  "banker-activity",
  // Sprint 7b — three new demo-critical drill-downs. Order preserved in
  // tag-row left-to-right reading order.
  "member-type-matrix",
  "conversion-funnels",
  "banker-flow",
];

export function FilterTagRow({
  availableTracks,
  availableMemberTypes,
}: {
  availableTracks: TrackId[];
  availableMemberTypes: MemberType[];
}) {
  const {
    state,
    setView,
    toggleTrack,
    toggleMemberType,
    togglePhase,
    toggleBanker,
    clear,
    hasFilters,
  } = useFilterState();

  return (
    <div className="border-b border-blaze-rule bg-blaze-charcoal px-8 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => {
          const active = state.view === v || (state.view === DEFAULT_VIEW && v === DEFAULT_VIEW);
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-blaze-orange-deep px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-blaze-rule bg-white px-3 py-1 text-xs font-medium text-blaze-grey-body hover:border-blaze-orange-deep/40 hover:text-blaze-orange-deep"
              }
            >
              {VIEW_LABELS[v]}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <FilterDropdown
          label="Track"
          value={state.track_id}
          options={availableTracks.map((t) => ({ value: t, label: `${t} · ${TRACK_LABELS[t]}` }))}
          onChange={(v) => toggleTrack(v as TrackId | undefined)}
        />
        <FilterDropdown
          label="Member-Type"
          value={state.member_type}
          options={availableMemberTypes.map((mt) => ({ value: mt, label: MEMBER_TYPE_LABELS[mt] }))}
          onChange={(v) => toggleMemberType(v as MemberType | undefined)}
        />
        <FilterDropdown
          label="Phase"
          value={state.phase}
          options={(["discover", "measure", "consult", "navigate"] as Phase[]).map((p) => ({
            value: p,
            label: PHASE_LABELS[p],
          }))}
          onChange={(v) => togglePhase(v as Phase | undefined)}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-[11px] font-medium text-blaze-orange-deep hover:underline"
          >
            clear filters ×
          </button>
        )}
        {/* Always allow clearing the banker filter when set, but no
            dropdown — it's set via banker-activity heatmap clicks. */}
        {state.banker_id && (
          <button
            type="button"
            onClick={() => toggleBanker(undefined)}
            className="rounded-full bg-blaze-cream px-2 py-0.5 text-[11px] text-blaze-charcoal"
          >
            banker: {state.banker_id} ×
          </button>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-blaze-grey-soft">{label}:</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        className="rounded border border-blaze-rule bg-white px-2 py-0.5 text-[11px] text-blaze-charcoal focus:border-blaze-orange-deep focus:outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
