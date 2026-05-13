"use client";

/*
 * Sprint 7a Block D — URL-backed dashboard filter state.
 *
 * State keys (per spec D.3):
 *   view  : phase-funnel | lending-product-mix | geographic | banker-activity
 *   track : TRACK-NNN
 *   type  : Member-Type
 *   phase : discover | measure | consult | navigate
 *   banker: BANKER-NNN
 *   branch: BRANCH-NNN  (used by geographic view drill-down)
 *
 * Browser back/forward navigates state. URL is shareable.
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type {
  MemberType,
  Phase,
  TrackId,
} from "@/lib/synthetic-data/types";

export type DashboardView =
  | "phase-funnel"
  | "lending-product-mix"
  | "geographic"
  | "banker-activity"
  // Sprint 7b — three new demo-critical drill-downs.
  | "member-type-matrix"
  | "conversion-funnels"
  | "banker-flow";

export const DEFAULT_VIEW: DashboardView = "phase-funnel";

export const VIEW_LABELS: Record<DashboardView, string> = {
  "phase-funnel": "Phase funnel",
  "lending-product-mix": "Lending product mix",
  geographic: "Geographic",
  "banker-activity": "Banker activity",
  "member-type-matrix": "Member-Type matrix",
  "conversion-funnels": "Conversion funnels",
  "banker-flow": "Banker flow",
};

// Sprint 7b — Member-Type matrix cell-content toggle.
export type MatrixMetric = "count" | "value";

// Sprint 7b — Sankey banker cohort selection. String form is
// "top-5" | "6-10" | "11-15" | etc., generated dynamically from
// banker count. Stored as a plain string for forward-compat.
export type CohortKey = string;

export type FilterState = {
  view: DashboardView;
  track_id?: TrackId;
  member_type?: MemberType;
  phase?: Phase;
  banker_id?: string;
  branch_id?: string;
  pipeline_weighted?: boolean;
  // Sprint 7b — Member-Type matrix metric toggle.
  matrix_metric: MatrixMetric;
  // Sprint 7b — Conversion-funnels zoom-modal focus Track.
  focus_track?: TrackId;
  // Sprint 7b — Sankey cohort selection. Defaults to "top-5" when
  // unset.
  cohort: CohortKey;
};

export function useFilterState(): {
  state: FilterState;
  setView: (v: DashboardView) => void;
  toggleTrack: (t: TrackId | undefined) => void;
  toggleMemberType: (mt: MemberType | undefined) => void;
  togglePhase: (p: Phase | undefined) => void;
  toggleBanker: (b: string | undefined) => void;
  setBranch: (b: string | undefined) => void;
  togglePipelineWeighted: () => void;
  // Sprint 7b — new setters for the Sprint 7b drill-downs.
  setMatrixMetric: (m: MatrixMetric) => void;
  setFocusTrack: (t: TrackId | undefined) => void;
  setCohort: (c: CohortKey) => void;
  clear: () => void;
  hasFilters: boolean;
  filterDescription: string;
} {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const state: FilterState = useMemo(() => {
    const rawView = search.get("view");
    // 7a-patch Block E: "temporal-momentum" removed; redirect to default.
    const view = (rawView === "temporal-momentum" ? DEFAULT_VIEW : (rawView as DashboardView)) ?? DEFAULT_VIEW;
    const matrixMetricRaw = search.get("metric");
    const matrixMetric: MatrixMetric =
      matrixMetricRaw === "value" ? "value" : "count";
    const focusTrackRaw = search.get("focus_track");
    return {
      view: VIEW_LABELS[view as DashboardView] ? (view as DashboardView) : DEFAULT_VIEW,
      track_id: (search.get("track") as TrackId) ?? undefined,
      member_type: (search.get("type") as MemberType) ?? undefined,
      phase: (search.get("phase") as Phase) ?? undefined,
      banker_id: search.get("banker") ?? undefined,
      branch_id: search.get("branch") ?? undefined,
      pipeline_weighted: search.get("weighted") === "1",
      matrix_metric: matrixMetric,
      focus_track: (focusTrackRaw as TrackId) ?? undefined,
      cohort: search.get("cohort") ?? "top-5",
    };
  }, [search]);

  const push = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setKey = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(search.toString());
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [search, push],
  );

  const toggleKey = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(search.toString());
      if (value === undefined || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [search, push],
  );

  return {
    state,
    setView: (v) => setKey("view", v === DEFAULT_VIEW ? undefined : v),
    toggleTrack: (t) => toggleKey("track", t),
    toggleMemberType: (mt) => toggleKey("type", mt),
    togglePhase: (p) => toggleKey("phase", p),
    toggleBanker: (b) => toggleKey("banker", b),
    setBranch: (b) => setKey("branch", b),
    togglePipelineWeighted: () => {
      const next = new URLSearchParams(search.toString());
      if (next.get("weighted") === "1") next.delete("weighted");
      else next.set("weighted", "1");
      push(next);
    },
    // Sprint 7b — Member-Type matrix metric toggle. `count` is the
    // default; absent param implies default.
    setMatrixMetric: (m) => setKey("metric", m === "count" ? undefined : m),
    // Sprint 7b — opening / closing the Conversion-funnels zoom modal.
    setFocusTrack: (t) => setKey("focus_track", t),
    // Sprint 7b — Sankey cohort selection. `top-5` is the default;
    // absent param implies default.
    setCohort: (c) => setKey("cohort", c === "top-5" ? undefined : c),
    clear: () => {
      const next = new URLSearchParams();
      const v = search.get("view");
      if (v && v !== DEFAULT_VIEW) next.set("view", v);
      push(next);
    },
    hasFilters:
      !!state.track_id ||
      !!state.member_type ||
      !!state.phase ||
      !!state.banker_id ||
      !!state.branch_id,
    filterDescription: describe(state),
  };
}

function describe(s: FilterState): string {
  const parts: string[] = [];
  if (s.track_id) parts.push(s.track_id);
  if (s.member_type) parts.push(s.member_type.replace(/_/g, " "));
  if (s.phase) parts.push(s.phase);
  if (s.banker_id) parts.push(s.banker_id);
  if (s.branch_id) parts.push(s.branch_id);
  return parts.join(" · ");
}
