"use client";

/*
 * Sprint 7a Block G — lending product mix treemap.
 * Sprint 7a-patch Block B — per-Track distinct colors grouped by family;
 * mouseover tooltips; click cell → drill to Member list filtered by
 * Track; summary cards dropped.
 */

import { useMemo, useState } from "react";
import { ResponsiveContainer, Treemap } from "recharts";
import { BLAZE_OFFERED_TRACKS, TRACK_LABELS, PHASE_LABELS } from "@/lib/synthetic-data/types";
import type { SyntheticMember, TrackId, TrackMetrics } from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { SyntheticMemberLink } from "../components/MemberLink";

// 7a-patch §B.1 — 10-color treemap palette per Francisco's selection.
// Sequential application across the Track set (existing family order
// preserved so the SBA, CRE, Equipment/Vehicle, Consumer, and Specialty
// groupings still cluster visually).
const TRACK_COLORS: Record<TrackId, string> = {
  "TRACK-004": "#000000", // SBA 7(a)
  "TRACK-008": "#A85923", // SBA 504
  "TRACK-003": "#262626", // CRE Term Loan
  "TRACK-006": "#C65300", // Investment Property
  "TRACK-002": "#404040", // Business Vehicle
  "TRACK-007": "#F36711", // Equipment & Machinery
  "TRACK-010": "#595959", // Business Visa
  "TRACK-011": "#F36711", // Unsecured
  "TRACK-001": "#767171", // Working Capital LOC
  "TRACK-009": "#A6A6A6", // PACE Loan
};

export function LendingProductMixView({
  trackMetrics,
  members,
}: {
  trackMetrics: Record<TrackId, TrackMetrics>;
  members: SyntheticMember[];
}) {
  const { state } = useFilterState();
  const [hoveredId, setHoveredId] = useState<TrackId | null>(null);
  // Local drill state (does not touch the global track filter).
  // Pre-seed from URL state if a Track is already filter-pinned so the
  // drill-down opens automatically on direct-link navigation.
  const [selectedTrack, setSelectedTrack] = useState<TrackId | null>(
    state.track_id ?? null,
  );

  const data = useMemo(() => {
    const all = Object.values(trackMetrics)
      .filter((tm) => tm.pipeline_value > 0)
      .map((tm) => ({
        name: tm.track_id,
        size: tm.pipeline_value,
        label: TRACK_LABELS[tm.track_id],
        members: tm.member_count,
        isBlazeOffered: tm.is_blaze_offered,
        trackId: tm.track_id,
      }));
    return all.sort((a, b) => b.size - a.size);
  }, [trackMetrics]);

  const drillTrack = selectedTrack;
  const drillMembers = useMemo(() => {
    if (!drillTrack) return [];
    return members
      .filter((m) => m.current_track_id === drillTrack)
      .sort((a, b) => b.sized_opportunity_amount - a.sized_opportunity_amount);
  }, [drillTrack, members]);

  const hoverPayload = hoveredId
    ? data.find((d) => d.trackId === hoveredId)
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <h2 className="text-lg font-semibold text-blaze-charcoal">
          Lending product mix
        </h2>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          Pipeline value by lending product.
        </p>

        <div className="relative mt-5" style={{ width: "100%", height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              stroke="#fff"
              fill="#d97706"
              content={
                <TreemapCell
                  onClick={(id) =>
                    setSelectedTrack((cur) => (cur === id ? null : id))
                  }
                  onHover={setHoveredId}
                  activeTrackId={selectedTrack ?? state.track_id}
                />
              }
              isAnimationActive={false}
            />
          </ResponsiveContainer>
          {hoverPayload && (
            <div className="pointer-events-none absolute right-3 top-3 max-w-[260px] rounded border border-blaze-rule bg-white px-3 py-2 text-[11px] text-blaze-grey-body shadow-sm">
              <p className="text-[12px] font-semibold text-blaze-charcoal">
                {hoverPayload.label}
              </p>
              <p className="mt-0.5">
                ${(hoverPayload.size / 1_000_000).toFixed(1)}M pipeline · {hoverPayload.members} Members
              </p>
              <p className="text-blaze-grey-soft">
                {hoverPayload.isBlazeOffered ? "Active offering" : "Future-expansion product"}
              </p>
              <p className="mt-1 text-blaze-grey-soft">Click to see Members on this Track.</p>
            </div>
          )}
        </div>
      </div>

      {drillTrack && (
        <div className="rounded border border-blaze-rule bg-white p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              Members on {TRACK_LABELS[drillTrack]} ({drillMembers.length})
            </p>
            <button
              type="button"
              onClick={() => setSelectedTrack(null)}
              className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
            >
              close drill-down ×
            </button>
          </div>
          {drillMembers.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-blaze-grey-soft">
              No Members currently on this Track.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-blaze-rule text-[12px]">
              {drillMembers.slice(0, 30).map((m) => (
                <li key={m.id} className="flex items-baseline gap-3 py-2">
                  <SyntheticMemberLink member={m} className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline" />
                  <span className="w-32 text-blaze-grey-soft">{m.member_type.replace(/_/g, " ")}</span>
                  <span className="w-24 text-blaze-grey-soft">{PHASE_LABELS[m.current_phase]}</span>
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

type TreemapCellPayload = {
  name: string;
  size: number;
  label: string;
  members: number;
  isBlazeOffered: boolean;
  trackId: TrackId;
};

function TreemapCell({
  onClick,
  onHover,
  activeTrackId,
  // Recharts injects these props at runtime; types are loose.
  ...props
}: {
  onClick: (id: TrackId) => void;
  onHover: (id: TrackId | null) => void;
  activeTrackId?: TrackId;
} & Record<string, unknown>) {
  const x = props.x as number;
  const y = props.y as number;
  const width = props.width as number;
  const height = props.height as number;
  const payload = props as unknown as TreemapCellPayload;
  if (!payload.name || width <= 0 || height <= 0) return null;
  const base = TRACK_COLORS[payload.trackId] ?? "#94a3b8";
  const isActive = activeTrackId === payload.trackId;
  const hasSelection = activeTrackId != null;
  // Selection now reads via a HEAVY white outline on the selected cell and
  // by dimming the others — the prior darken-on-select was counterintuitive
  // (darker read as "more", not "selected"). Selected cell keeps full color.
  const fill = base;
  const isFuture = !payload.isBlazeOffered;
  let cellOpacity = isFuture ? 0.78 : 1;
  if (hasSelection && !isActive) cellOpacity = 0.3; // grey the unselected back
  const cellStrokeWidth = isActive ? 5 : 2;
  const showLabel = width > 90 && height > 50;
  const showSub = width > 110 && height > 80;
  // Label color flips dark on light fills (the lightest palette cells
  // would otherwise lose contrast against white text).
  const labelFill = isLightFill(fill) ? "#1c1917" : "#fff";
  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onClick(payload.trackId)}
      onMouseEnter={() => onHover(payload.trackId)}
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#fff"
        strokeWidth={cellStrokeWidth}
        opacity={cellOpacity}
      >
        <title>
          {payload.label} · ${(payload.size / 1_000_000).toFixed(1)}M · {payload.members} Members
          {isFuture ? " · future" : ""}
        </title>
      </rect>
      {showLabel && (
        <text x={x + 8} y={y + 18} fill={labelFill} fontSize={12} fontWeight={600}>
          {payload.label}
          {isFuture && " (future)"}
        </text>
      )}
      {showSub && (
        <>
          <text x={x + 8} y={y + 36} fill={labelFill} fontSize={11}>
            ${(payload.size / 1_000_000).toFixed(1)}M
          </text>
          <text x={x + 8} y={y + 50} fill={labelFill} fontSize={10} opacity={0.9}>
            {payload.members} Members
          </text>
        </>
      )}
    </g>
  );
}

/** Perceived-luminance threshold for flipping label color. */
function isLightFill(hex: string): boolean {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  // Rec. 601 luma (good-enough for label-contrast decisions).
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55;
}
