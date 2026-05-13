"use client";

/*
 * Sprint 7a Block B — top-level dashboard client component.
 *
 * Reads URL filter state, applies scoped-metric computation, dispatches
 * to the active drill-down view. Hero strip + filter row + view +
 * featured tile composition.
 */

import { useMemo } from "react";
import type { SyntheticDataset } from "@/lib/synthetic-data/types";
import { computeScopedMetrics, filterMembers } from "@/lib/synthetic-data/filters";
import { useFilterState } from "../hooks/use-filter-state";
import { HeroMetricsStrip } from "./HeroMetricsStrip";
import { FilterTagRow } from "./FilterTagRow";
import { FeaturedDealTile } from "./FeaturedDealTile";
import { PhaseFunnelView } from "../views/PhaseFunnelView";
import { LendingProductMixView } from "../views/LendingProductMixView";
import { GeographicMapView } from "../views/GeographicMapView";
import { BankerActivityHeatmapView } from "../views/BankerActivityHeatmapView";
// Sprint 7b — three new demo-critical drill-downs.
import { MemberTypeMatrixView } from "../views/MemberTypeMatrixView";
import { ConversionFunnelsView } from "../views/ConversionFunnelsView";
import { BankerFlowView } from "../views/BankerFlowView";
import type { MemberType, TrackId } from "@/lib/synthetic-data/types";

export function DashboardClient({ dataset }: { dataset: SyntheticDataset }) {
  const { state, filterDescription } = useFilterState();

  const filter = useMemo(
    () => ({
      track_id: state.track_id,
      member_type: state.member_type,
      phase: state.phase,
      banker_id: state.banker_id,
      branch_id: state.branch_id,
    }),
    [state.track_id, state.member_type, state.phase, state.banker_id, state.branch_id],
  );

  const metrics = useMemo(() => computeScopedMetrics(dataset, filter), [dataset, filter]);
  const filteredMembers = useMemo(
    () => filterMembers(dataset.members, filter),
    [dataset.members, filter],
  );

  const availableTracks = useMemo<TrackId[]>(
    () =>
      (Object.keys(dataset.aggregate_metrics.track_metrics) as TrackId[]).filter(
        (t) => dataset.aggregate_metrics.track_metrics[t].member_count > 0,
      ),
    [dataset.aggregate_metrics.track_metrics],
  );
  const availableMemberTypes = useMemo<MemberType[]>(
    () =>
      (Object.keys(dataset.aggregate_metrics.member_type_metrics) as MemberType[]).filter(
        (mt) => dataset.aggregate_metrics.member_type_metrics[mt].member_count > 0,
      ),
    [dataset.aggregate_metrics.member_type_metrics],
  );

  return (
    <>
      <HeroMetricsStrip metrics={metrics} filterDescription={filterDescription} />
      <FilterTagRow
        availableTracks={availableTracks}
        availableMemberTypes={availableMemberTypes}
      />
      <main className="bg-blaze-cream/10 px-8 py-6">
        {state.view === "phase-funnel" && (
          <PhaseFunnelView
            members={filteredMembers}
            daily={dataset.daily_activity}
            closedCount12mo={metrics.closed_count_12mo}
          />
        )}
        {state.view === "lending-product-mix" && (
          <LendingProductMixView
            trackMetrics={dataset.aggregate_metrics.track_metrics}
            members={filteredMembers}
          />
        )}
        {state.view === "geographic" && (
          <GeographicMapView
            branches={dataset.branches}
            branchMetrics={dataset.aggregate_metrics.branch_metrics}
            members={filteredMembers}
          />
        )}
        {state.view === "banker-activity" && (
          <BankerActivityHeatmapView
            bankers={dataset.bankers}
            daily={dataset.daily_activity}
            bankerMetrics={dataset.aggregate_metrics.banker_metrics}
            members={filteredMembers}
          />
        )}
        {state.view === "member-type-matrix" && (
          <MemberTypeMatrixView members={filteredMembers} />
        )}
        {state.view === "conversion-funnels" && (
          <ConversionFunnelsView
            members={filteredMembers}
            closedDeals={dataset.closed_deals}
          />
        )}
        {state.view === "banker-flow" && (
          <BankerFlowView
            bankers={dataset.bankers}
            members={filteredMembers}
            closedDeals={dataset.closed_deals}
          />
        )}
      </main>
      <FeaturedDealTile deals={dataset.closed_deals} />
    </>
  );
}
