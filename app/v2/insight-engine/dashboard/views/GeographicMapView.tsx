"use client";

/*
 * Sprint 7a Block H — geographic branch view.
 * Sprint 7a-patch Block C — spatial SVG replaced by three-region
 * alphabetical bar lists (Twin Cities Metro / Northern Minnesota /
 * Southern Minnesota). Click a branch → drill to Member list.
 *
 * Per patch §C.5: bars use a single accent fill (cleaner than per-bar
 * conversion-rate coloring). Documented in BUILD_LOG.
 */

import { useMemo, useState } from "react";
import type {
  Branch,
  BranchMetrics,
  SyntheticMember,
} from "@/lib/synthetic-data/types";
import { PHASE_LABELS, TRACK_LABELS } from "@/lib/synthetic-data/types";
import { SyntheticMemberLink } from "../components/MemberLink";

// 7a-patch §C.2 region groupings — exact lists, alphabetized.
const REGION_NAMES = [
  "Twin Cities Metro",
  "Northern Minnesota",
  "Southern Minnesota",
] as const;
type RegionName = (typeof REGION_NAMES)[number];

const TWIN_CITIES_METRO = new Set<string>([
  "Anoka",
  "Apple Valley",
  "Bloomington",
  "Brooklyn Park",
  "Burnsville",
  "Coon Rapids",
  "Cottage Grove",
  "Eagan",
  "Eden Prairie",
  "Edina",
  "Lakeville",
  "Maple Grove",
  "Minneapolis Downtown",
  "Minnetonka",
  "Plymouth",
  "Roseville",
  "Shakopee",
  "St. Paul Downtown",
  "Stillwater",
  "Woodbury",
]);

const NORTHERN_MN = new Set<string>([
  "Milaca",
  "Mora",
  "Ogilvie",
  "Pine City",
  "Princeton",
  "St. Cloud",
]);

const SOUTHERN_MN = new Set<string>(["Rochester", "Waseca"]);

function regionForBranch(name: string): RegionName | null {
  if (TWIN_CITIES_METRO.has(name)) return "Twin Cities Metro";
  if (NORTHERN_MN.has(name)) return "Northern Minnesota";
  if (SOUTHERN_MN.has(name)) return "Southern Minnesota";
  return null;
}

export function GeographicMapView({
  branches,
  branchMetrics,
  members,
}: {
  branches: Branch[];
  branchMetrics: Record<string, BranchMetrics>;
  members: SyntheticMember[];
}) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const byRegion = useMemo(() => {
    const out: Record<RegionName, Branch[]> = {
      "Twin Cities Metro": [],
      "Northern Minnesota": [],
      "Southern Minnesota": [],
    };
    for (const b of branches) {
      const r = regionForBranch(b.name);
      if (r) out[r].push(b);
    }
    for (const r of REGION_NAMES) {
      out[r] = [...out[r]].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [branches]);

  const regionMaxPipeline = useMemo(() => {
    const out: Record<RegionName, number> = {
      "Twin Cities Metro": 0,
      "Northern Minnesota": 0,
      "Southern Minnesota": 0,
    };
    for (const r of REGION_NAMES) {
      for (const b of byRegion[r]) {
        const v = branchMetrics[b.id]?.pipeline_value ?? 0;
        if (v > out[r]) out[r] = v;
      }
    }
    return out;
  }, [byRegion, branchMetrics]);

  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId) ?? null
    : null;
  const branchMembers = useMemo(() => {
    if (!selectedBranchId) return [];
    return members
      .filter((m) => m.branch_id === selectedBranchId)
      .sort((a, b) => b.sized_opportunity_amount - a.sized_opportunity_amount);
  }, [selectedBranchId, members]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <h2 className="text-lg font-semibold text-blaze-charcoal">
          Geographic — branches by region
        </h2>
        <p className="mt-1 text-[12px] text-blaze-grey-body">
          28 branches grouped into three regions. Bar length within each region scales to pipeline value. Click a branch to drill into the Member list.
        </p>

        <div className="mt-5 space-y-6">
          {REGION_NAMES.map((region) => {
            const branchesInRegion = byRegion[region];
            const max = regionMaxPipeline[region] || 1;
            const memberTotal = branchesInRegion.reduce(
              (s, b) => s + (branchMetrics[b.id]?.member_count ?? 0),
              0,
            );
            const pipelineTotal = branchesInRegion.reduce(
              (s, b) => s + (branchMetrics[b.id]?.pipeline_value ?? 0),
              0,
            );
            return (
              <section key={region}>
                <header className="flex items-baseline justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
                    {region}
                  </p>
                  <p className="text-[11px] text-blaze-grey-soft">
                    {branchesInRegion.length} branches · {memberTotal} Members · $
                    {(pipelineTotal / 1_000_000).toFixed(1)}M pipeline
                  </p>
                </header>
                <ul className="mt-2 divide-y divide-blaze-rule">
                  {branchesInRegion.map((b) => {
                    const m = branchMetrics[b.id];
                    if (!m) return null;
                    const widthPct = Math.max(
                      4,
                      Math.round((m.pipeline_value / max) * 100),
                    );
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedBranchId(isSelected ? null : b.id)
                          }
                          aria-pressed={isSelected}
                          className={`flex w-full items-center gap-3 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-blaze-cream/40"
                              : "hover:bg-blaze-cream/20"
                          }`}
                        >
                          <span
                            className={`w-44 shrink-0 text-blaze-charcoal ${
                              isSelected
                                ? "text-[13px] font-bold"
                                : "text-[12px] font-medium"
                            }`}
                          >
                            {b.name}
                          </span>
                          <span className="relative h-3 flex-1 overflow-hidden rounded bg-blaze-rule/30">
                            <span
                              className={`absolute inset-y-0 left-0 rounded ${
                                isSelected
                                  ? "bg-blaze-orange-deep"
                                  : "bg-blaze-orange/70"
                              }`}
                              style={{ width: `${widthPct}%` }}
                              aria-hidden
                            />
                          </span>
                          <span className="w-44 shrink-0 text-right text-[11px] text-blaze-grey-body">
                            {m.member_count} Member{m.member_count === 1 ? "" : "s"} · $
                            {formatBranchValue(m.pipeline_value)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {selectedBranch && (
        <div className="rounded border border-blaze-rule bg-white p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
                Members at {selectedBranch.name}
              </p>
              <p className="text-[11px] text-blaze-grey-soft">
                {branchMembers.length} Member
                {branchMembers.length === 1 ? "" : "s"} ·{" "}
                {Math.round(
                  (branchMetrics[selectedBranch.id]?.conversion_rate ?? 0) * 100,
                )}
                % 12-month conversion
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBranchId(null)}
              className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
            >
              close drill-down ×
            </button>
          </div>
          {branchMembers.length === 0 ? (
            <p className="mt-3 text-[12px] italic text-blaze-grey-soft">
              No active Members at this branch under current filters.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-blaze-rule text-[12px]">
              {branchMembers.slice(0, 30).map((m) => (
                <li key={m.id} className="flex items-baseline gap-3 py-2">
                  <SyntheticMemberLink
                    member={m}
                    className="flex-1 font-medium text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"
                  />
                  <span className="w-32 text-blaze-grey-soft">
                    {m.member_type.replace(/_/g, " ")}
                  </span>
                  <span className="w-40 text-blaze-grey-soft">
                    {TRACK_LABELS[
                      m.current_track_id as keyof typeof TRACK_LABELS
                    ] ?? m.current_track_id}
                  </span>
                  <span className="w-24 text-blaze-grey-soft">
                    {PHASE_LABELS[m.current_phase]}
                  </span>
                  <span className="w-20 text-right text-blaze-charcoal">
                    ${(m.sized_opportunity_amount / 1000).toFixed(0)}K
                  </span>
                </li>
              ))}
              {branchMembers.length > 30 && (
                <li className="py-2 text-[11px] italic text-blaze-grey-soft">
                  Showing first 30 of {branchMembers.length}.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatBranchValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return `${v.toLocaleString()}`;
}
