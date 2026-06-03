"use client";

/*
 * Sprint 5a.2 — workstation client shell.
 *
 * Coordinator for the four interactive surfaces that need to share UI
 * state:
 *   - V2Sidebar (Track context dropdown + objective click)
 *   - V2Dialpad (drawer open state + preselected factor)
 *   - ObjectivePopup (popup-as-workflow, opened from sidebar)
 *   - TracksSupportedPanel (opened from "view comparison" link)
 *
 * State the shell owns:
 *   - popupObjective       — which objective's popup is open
 *   - dialpadActivity      — which capture drawer is open
 *   - preselectedFactorId  — passed into + Quantify when popup CTA opens it
 *   - tracksOpen           — TracksSupportedPanel modal open
 *   - selectedTrackId      — banker-chosen Track override (Block F)
 *
 * State derivation:
 *   - currentTrack         — TrackTemplate for selectedTrackId, or default
 *                            to top-ranked from rankedTracks
 *   - objectives           — dot rows derived per current Track via
 *                            deriveDotsForObjective + capturedDots
 *   - nextValuableByObj    — single highest-priority missing ref per
 *                            objective for the "+ next" affordance
 *
 * sessionStorage key       — `v2-track-${memberId}` persists Track
 *                            selection across navigations within session
 *                            (per Sprint 5a.2 §F.4).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  V2Sidebar,
  type SidebarArtifact,
  type SidebarMacro,
  type SidebarHistoryEntry,
  type SidebarCoachContent,
  type SidebarTrackOption,
  type ObjectiveBlock,
} from "./sidebar";
import {
  V2Dialpad,
  type V2DialpadProps,
  type DialpadActivity,
} from "./dialpad";
import { V2MainPanel, type FeedItem } from "./main-panel";
import {
  ObjectivePopup,
  type CapturedRowDisplay,
  type InsightDisplay,
  type PatternDisplay,
} from "./objective-popup";
import {
  TracksSupportedPanel,
  type TrackEvidenceCohort,
} from "./tracks-supported-panel";
import { SpecialistHandoffDialogInner } from "./specialist-handoff-dialog";
import {
  ArtifactPreviewDialog,
  type ArtifactPreviewSubject,
} from "./artifact-preview-dialog";
import {
  deriveDotsForObjective,
  capturedDots,
  type FactorCaptureLite,
  type BusinessFactorLite,
  type TrackTemplateLite,
  type EntityCounts,
} from "@/lib/objective-evidence";
import {
  deriveNextActions,
  topCTA,
  type CTA,
  type CTAAction,
  type DeriveMatrixEntry,
} from "@/lib/cta-derivation";
import type { V2Objective } from "@/lib/stage-guidance";
import type { DotState } from "@/app/v2/_components/objective-dot";

// Ranked Track shape passed down from server. Mirrors RankedTrack from
// lib/track-ranker but with serialization-friendly fields only (no
// MatrixEntry rows — those don't render in the switchboard yet).
export type RankedTrackLite = {
  track_id: string;
  track_name: string;
  strength: "strong" | "moderate" | "insufficient";
  strong_count: number;
  moderate_count: number;
  negative_count: number;
  // Sprint 9 Patch E — true when the Track applies to the current
  // Member's Member-Type per the locked applicability matrix.
  // Inapplicable Tracks are hidden from the default dropdown view but
  // remain visible behind the "see all N lending products" expansion
  // with a muted visual treatment.
  applicable: boolean;
};

const OBJECTIVES_ORDER: ReadonlyArray<{ key: V2Objective; label: string }> = [
  { key: "discover", label: "Discover" },
  { key: "measure", label: "Measure" },
  { key: "consult", label: "Consult" },
  { key: "navigate", label: "Navigate" },
];

export type WorkstationShellProps = {
  memberId: string;
  bankerId: string;
  // Sidebar / coach data
  artifacts: SidebarArtifact[];
  macro: SidebarMacro | null;
  history: SidebarHistoryEntry[];
  totalConversationCount: number;
  coachContent: SidebarCoachContent;
  tracksCohort: TrackEvidenceCohort | null;
  // Dot derivation inputs
  rankedTracks: RankedTrackLite[];
  // Sprint 8 Block F — when Member has `active_track_ids` set (fixtures
  // only for demo), the Track switcher is restricted to those Tracks
  // and the primary defaults to active_track_ids[0]. Synthetic Members
  // pass null and fall through to rankedTracks[0].
  activeTrackIds: string[] | null;
  trackTemplates: TrackTemplateLite[];
  businessFactors: BusinessFactorLite[];
  factorCaptures: FactorCaptureLite[];
  entityCounts: EntityCounts;
  // Bottom-zone capture metadata for the popup, keyed by evidence_ref.
  capturedRowsByEvidenceRef: Record<string, CapturedRowDisplay>;
  // Sprint 5b.1 — MatrixEntry rows for threshold-uplift detection in
  // CTA derivation (Layer 2). Filtered to current Track in shell.
  matrixEntries: DeriveMatrixEntry[];
  // Sprint 5b.1 Block B/F — Insights for this Member + canonical
  // Patterns indexed by id. Shell filters per-objective + per-Signal
  // for popup rendering.
  insights: InsightDisplay[];
  patternsById: Record<string, PatternDisplay & { track_id: string; signal_tag_scope: string }>;
  // Sprint 5e v2 Block G — captured tag set per Signal id, derived
  // from the Signal's source-linked qualitative FactorCaptures'
  // qualitative_value (and the Topic.canonical_tag fallback).
  // Drives the matched/remaining Pattern split in the popover.
  signalTagsBySignalId: Record<string, string[]>;
  // Objective highlight strings (fixed per Member, not Track-dependent).
  objectiveHighlights: Record<V2Objective, string | null>;
  // Dialpad form data
  dialpadProps: Omit<
    V2DialpadProps,
    | "memberId"
    | "bankerId"
    | "controlledActivity"
    | "preselectedFactorId"
    | "preselectedSignalId"
    | "preselectedInsightType"
    | "onActivityChange"
    // BUILD 2c — factorCapturesById is computed in the shell, supplied
    // directly to the dialpad (not via page.tsx dialpadProps).
    | "factorCapturesById"
  >;
  // Captured feed
  feedItems: FeedItem[];
};

export function WorkstationShell(props: WorkstationShellProps) {
  const {
    memberId,
    bankerId,
    rankedTracks: rankedTracksAll,
    activeTrackIds,
    trackTemplates,
    businessFactors,
    factorCaptures,
    entityCounts,
    objectiveHighlights,
  } = props;

  // ── Track selection state (Block F) ──
  // Sprint 8 Block F — keep the full rankedTracks list visible in the
  // dropdown so bankers can compare against all 10 lending products.
  // `activeTrackIds` only influences the DEFAULT primary Track
  // (active_track_ids[0]) when no override is selected. Multi-Track
  // fixtures still default to their assigned primary; banker can still
  // explore other Tracks via the same dropdown.
  const rankedTracks = rankedTracksAll;

  // The fixture-assigned primary Track id, if any. Used as the default
  // when no URL/sessionStorage override is set. Sprint 9 Patch E — the
  // ranker-rank fallback prefers an applicable Track first so the
  // banker's first impression isn't a Track flagged as a non-fit for
  // this Member-Type.
  const defaultTrackId = useMemo<string | null>(() => {
    if (activeTrackIds && activeTrackIds.length > 0) {
      const found = rankedTracks.find(
        (t) => t.track_id === activeTrackIds[0],
      );
      if (found) return found.track_id;
    }
    return (
      rankedTracks.find((t) => t.applicable)?.track_id ??
      rankedTracks[0]?.track_id ??
      null
    );
  }, [rankedTracks, activeTrackIds]);

  // Sprint 8 Block F — URL `?track=TRACK-NNN` encoding for shareable
  // Track context. URL wins over sessionStorage on mount.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTrack = searchParams.get("track");
  // Bumped key suffix (v3) invalidates stale Sprint 8 testing values
  // that may have pinned the selection to a now-non-primary Track.
  const storageKey = `v2-track-v3-${memberId}`;
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    urlTrack && rankedTracks.some((t) => t.track_id === urlTrack)
      ? urlTrack
      : null,
  );

  // Initialize from sessionStorage on mount when URL has no override.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (urlTrack && rankedTracks.some((t) => t.track_id === urlTrack)) {
      setSelectedTrackId(urlTrack);
      return;
    }
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored && rankedTracks.some((t) => t.track_id === stored)) {
      setSelectedTrackId(stored);
    }
  }, [storageKey, rankedTracks, urlTrack]);

  function handleSelectTrack(trackId: string) {
    setSelectedTrackId(trackId);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, trackId);
    }
    // Sync URL — replace (not push) so the back button doesn't trap
    // banker in Track-switch history.
    const next = new URLSearchParams(searchParams.toString());
    next.set("track", trackId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // Default to the fixture-assigned primary (active_track_ids[0]) when
  // no override is selected. Synthetic Members fall through to
  // rankedTracks[0] via defaultTrackId.
  const currentRanked = useMemo(() => {
    if (selectedTrackId) {
      const found = rankedTracks.find((t) => t.track_id === selectedTrackId);
      if (found) return found;
    }
    if (defaultTrackId) {
      const found = rankedTracks.find((t) => t.track_id === defaultTrackId);
      if (found) return found;
    }
    return rankedTracks[0] ?? null;
  }, [selectedTrackId, rankedTracks, defaultTrackId]);

  const currentTrack: TrackTemplateLite | null = useMemo(() => {
    if (!currentRanked) return null;
    return (
      trackTemplates.find((t) => t.id === currentRanked.track_id) ?? null
    );
  }, [currentRanked, trackTemplates]);

  // ── Per-objective dot derivation (Block B + C) ──
  const factorsById = useMemo(() => {
    const m: Record<string, BusinessFactorLite> = {};
    for (const f of businessFactors) m[f.id] = f;
    return m;
  }, [businessFactors]);

  const dotsByObjective = useMemo(() => {
    const out: Record<V2Objective, ReturnType<typeof deriveDotsForObjective>> = {
      discover: [],
      measure: [],
      consult: [],
      navigate: [],
    };
    for (const { key } of OBJECTIVES_ORDER) {
      out[key] = deriveDotsForObjective({
        objective: key,
        currentTrack,
        factors: businessFactors,
        captures: factorCaptures,
        counts: entityCounts,
      });
    }
    return out;
  }, [currentTrack, businessFactors, factorCaptures, entityCounts]);

  // Sprint 5b.1 Block A/B — per-objective CTAs from deriveNextActions.
  // Drives both the popup top zone AND the sidebar "+ next" affordance.
  const ctasByObjective = useMemo(() => {
    const out: Record<V2Objective, CTA[]> = {
      discover: [],
      measure: [],
      consult: [],
      navigate: [],
    };
    if (!currentTrack) return out;
    for (const { key } of OBJECTIVES_ORDER) {
      out[key] = deriveNextActions({
        objective: key,
        track: currentTrack,
        factors: businessFactors,
        captures: factorCaptures,
        matrix_entries: props.matrixEntries.filter(
          (e) => e.track_id === currentTrack.id,
        ),
        counts: entityCounts,
      });
    }
    return out;
  }, [
    currentTrack,
    businessFactors,
    factorCaptures,
    entityCounts,
    props.matrixEntries,
  ]);

  // Build the ObjectiveBlock[] the sidebar consumes. Block C —
  // captured-only main row. Sprint 5b.1 — "+ next" uses topCTA from
  // deriveNextActions (which spans 3 layers) instead of just missing
  // template evidence.
  const objectives: ObjectiveBlock[] = useMemo(() => {
    return OBJECTIVES_ORDER.map(({ key, label }) => {
      const allDots = dotsByObjective[key];
      const onlyCaptured = capturedDots(allDots);
      const dots = onlyCaptured.map((d) => ({
        state: "filled" as DotState,
        label: d.label,
      }));
      const next = currentTrack
        ? topCTA({
            objective: key,
            track: currentTrack,
            factors: businessFactors,
            captures: factorCaptures,
            matrix_entries: props.matrixEntries.filter(
              (e) => e.track_id === currentTrack.id,
            ),
            counts: entityCounts,
          })
        : null;
      const isComplete = allDots.length > 0 && onlyCaptured.length === allDots.length;
      return {
        name: label,
        objective: key,
        dots,
        highlight: objectiveHighlights[key],
        // Sprint 5b.1 — "+ next" affordance carries the CTA action
        // directly (was previously a synthetic evidence_ref string).
        // Sidebar invokes onCtaAction(cta.action) on click.
        nextCta: next,
        isComplete,
      };
    });
  }, [
    dotsByObjective,
    objectiveHighlights,
    currentTrack,
    businessFactors,
    factorCaptures,
    entityCounts,
    props.matrixEntries,
  ]);

  // ── UI state ──
  const [popupObjective, setPopupObjective] = useState<V2Objective | null>(null);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [dialpadActivity, setDialpadActivity] = useState<DialpadActivity | null>(null);
  const [preselectedFactorId, setPreselectedFactorId] = useState<string | undefined>(undefined);
  // Sprint 5b.1 — pre-fill state for + Insight contextual affordances.
  const [preselectedSignalId, setPreselectedSignalId] = useState<string | undefined>(undefined);
  const [preselectedInsightType, setPreselectedInsightType] = useState<
    "reframe" | "implication" | undefined
  >(undefined);
  // Sprint 8 Block E — capture-mode pre-set when artifact's missing-
  // parameter CTA opens the dialpad. "Banker estimate" path surfaces a
  // helper line in the form (Block H visual treatment).
  const [preselectedCaptureMode, setPreselectedCaptureMode] = useState<
    "member_confirmed" | "banker_estimate" | undefined
  >(undefined);

  // Sprint 8 Block F — filter sidebar artifacts to the active Track.
  // Multi-Track fixtures have one artifact per Track; switching Track
  // context swaps the sidebar's visible artifact. Untagged artifacts
  // (no track_id from the Model's template) fall through and remain
  // visible across Tracks. Cap at 2 to preserve sidebar density.
  const trackFilteredArtifacts = useMemo(() => {
    const tid = currentRanked?.track_id ?? null;
    if (!tid) return props.artifacts.slice(0, 2);
    const matched = props.artifacts.filter(
      (a) => !a.track_id || a.track_id === tid,
    );
    return matched.slice(0, 2);
  }, [props.artifacts, currentRanked]);

  // Sprint 8 Block D — derived map of factor_id → captured value + mode.
  // Drives ArtifactTemplateRender's source_factor_id auto-population and
  // Block H's banker-estimate visual flag.
  const factorCapturesById = useMemo(() => {
    type FactorRow = { id: string; capture_mode: string; field_name: string };
    const factorMeta: Record<string, FactorRow> = {};
    for (const f of businessFactors) factorMeta[f.id] = f;
    const out: Record<string, { display_value: string; capture_mode: "member_confirmed" | "banker_estimate" }> = {};
    for (const c of factorCaptures) {
      const meta = factorMeta[c.factor_id];
      let display = "";
      if (c.numerical_value !== null && c.numerical_value !== undefined) {
        display = String(c.numerical_value);
        if (c.unit) display = display; // unit suffix handled by renderer per param.type
      } else if (c.boolean_value !== null && c.boolean_value !== undefined) {
        display = c.boolean_value ? "Yes" : "No";
      } else if (c.qualitative_value) {
        display = c.qualitative_value;
      }
      if (!display) continue;
      // Newest-by-captured_at wins (the loop pre-sorts by walking the
      // array; FactorCaptures arrive ordered desc per page query).
      if (out[c.factor_id]) continue;
      const mode =
        c.capture_mode === "banker_estimate"
          ? "banker_estimate"
          : "member_confirmed";
      out[c.factor_id] = { display_value: display, capture_mode: mode };
      void meta;
    }
    return out;
  }, [factorCaptures, businessFactors]);

  // Sprint 8 Block E — opens the dialpad in + Quantify with both the
  // factor and the capture-mode pre-set. Closes any overlay that may
  // be open above (artifact preview dialog, objective popup) so the
  // dialpad isn't obscured.
  function handleMissingParameterCapture(args: {
    factor_id: string;
    parameter_label: string;
    mode: "member_confirmed" | "banker_estimate";
  }) {
    // Close overlays that would block visibility of the dialpad drawer.
    setPopupArtifactPreview(null);
    setPopupObjective(null);
    setPreselectedSignalId(undefined);
    setPreselectedInsightType(undefined);
    setPreselectedFactorId(args.factor_id);
    setPreselectedCaptureMode(args.mode);
    setDialpadActivity("quantify");
  }

  function handleObjectiveClick(obj: V2Objective) {
    setPopupObjective(obj);
  }

  // Sprint 5b.1 — popup-as-workflow's contextual + Insight affordance
  // calls this with the row's Signal id + type. Form opens with all
  // three pre-fills (Track is current Track from shell state).
  function handleAuthorInsightForSignal(args: {
    signalId: string;
    signalType: "goal" | "blocker" | "indecision" | "trigger";
  }) {
    setPopupObjective(null);
    setPreselectedFactorId(undefined);
    setPreselectedSignalId(args.signalId);
    setPreselectedInsightType(
      args.signalType === "goal" || args.signalType === "blocker"
        ? "reframe"
        : "implication",
    );
    setDialpadActivity("insight");
  }

  // Sprint 5b.1 — unified CTA action routing. Popup, sidebar, and
  // canonical-Pattern affordances all funnel here. The CTAAction
  // discriminated union determines the next surface.
  const [specialistHandoffOpen, setSpecialistHandoffOpen] = useState<{
    track_id: string;
  } | null>(null);

  // Sprint 5e Block G — popup-as-workflow Model/Shown rows are clickable;
  // click opens the existing ArtifactPreviewDialog. State is hoisted to
  // the workstation shell so the dialog renders above the popup overlay
  // and survives popup close. Sidebar artifact previews use their own
  // local state (separate dialog instance) — only one renders at a time
  // because banker can't click both surfaces simultaneously.
  const [popupArtifactPreview, setPopupArtifactPreview] =
    useState<ArtifactPreviewSubject | null>(null);

  function handleCtaAction(action: CTAAction) {
    setPopupObjective(null);
    setPreselectedSignalId(undefined);
    setPreselectedInsightType(undefined);
    if (action.type === "open_specialist_handoff") {
      setPreselectedFactorId(undefined);
      setSpecialistHandoffOpen({ track_id: action.track_id });
      return;
    }
    if (action.type === "refresh_capture") {
      setPreselectedFactorId(action.factor_id);
      setDialpadActivity("quantify");
      return;
    }
    // Sprint 5e Block E.5 — refresh on Signal-linked row routes to
    // + Ask. The drawer opens with no pre-selection (banker re-captures
    // the same Signal type fresh; the new Signal supersedes the older
    // one via recency in evaluator queries).
    if (action.type === "refresh_signal") {
      setPreselectedFactorId(undefined);
      setDialpadActivity("ask");
      return;
    }
    // open_capture_form
    if (action.preselected_factor_id) {
      setPreselectedFactorId(action.preselected_factor_id);
    } else {
      setPreselectedFactorId(undefined);
    }
    if (action.preselected_signal_id) {
      setPreselectedSignalId(action.preselected_signal_id);
    }
    setDialpadActivity(action.form);
  }

  // Block F — banker clicks "Use as basis for + Insight" inside the
  // Sprint 5b.1 patch — handleUsePatternForInsight retired alongside
  // the "Use as basis for + Insight ↗" affordance (removed from the
  // Growth insights popover per visual review). Banker now authors
  // via the row's contextual + Insight affordance.

  function handleDialpadActivityChange(a: DialpadActivity | null) {
    setDialpadActivity(a);
    if (a === null) {
      setPreselectedFactorId(undefined);
      setPreselectedSignalId(undefined);
      setPreselectedInsightType(undefined);
      setPreselectedCaptureMode(undefined);
    }
  }

  // Sprint 5b.1 Block B/F — per-objective Insight + Pattern context for
  // popup rendering. The shell narrows the Member-wide Insights and
  // Patterns to what's relevant for the popup currently open.
  const popupContext = useMemo(() => {
    if (!popupObjective || !currentTrack) {
      return {
        insights: [] as InsightDisplay[],
        patternsBySignalId: {} as Record<
          string,
          { matched: PatternDisplay[]; remaining: PatternDisplay[] }
        >,
        implications: [] as string[],
      };
    }
    const objDots = dotsByObjective[popupObjective];
    const capturedRefs = new Set(
      objDots.filter((d) => d.captured).map((d) => d.evidence_ref),
    );
    // Map of signal_id → captured-row signal_type, so we can prioritize
    // implications by Goal > Blocker > Trigger > Indecision.
    const visibleSignals = new Map<string, "goal" | "blocker" | "trigger" | "indecision">();
    for (const ref of capturedRefs) {
      const row = props.capturedRowsByEvidenceRef[ref];
      if (row?.signal_id && row?.signal_type) {
        visibleSignals.set(row.signal_id, row.signal_type);
      }
    }
    // Insights: those addressing visible Signals + Track-level (no
    // signal) bound to the current Track.
    //
    // Sprint 5d Block H.2 — Track-level Insights now surface on every
    // objective popup, not just Discover. The prior Discover-only gate
    // suppressed authored Insights on Measure/Consult/Navigate even when
    // the current Track context plainly matched. Matched Patterns
    // (lightbulb icon) and captured Insights should surface wherever
    // they're relevant to the popup's Track context, regardless of which
    // objective phase the Insight was authored in.
    const insightsForObjective = props.insights.filter((ins) => {
      if (ins.addresses_signal_id && visibleSignals.has(ins.addresses_signal_id)) {
        return true;
      }
      // Track-level Insights surface on every objective popup tied to
      // the current Track.
      if (!ins.addresses_signal_id && ins.track_id === currentTrack.id) {
        return true;
      }
      return false;
    });
    // Sprint 5e v2 Block G — Patterns by signal_id, split into matched
    // (signal_tag_scope ∈ Signal's captured tag set) and remaining
    // (Track-relevant Patterns whose tag is outside the Signal's tag
    // set). The expand affordance reveals remaining inline. Captured
    // tags come from the Signal's source-linked qualitative
    // FactorCaptures' qualitative_value (e.g., FACTOR-022 with
    // qualitative_value = "capacity_limit") plus the Topic's
    // canonical_tag as a fallback hint.
    const patternsBySignalId: Record<
      string,
      { matched: PatternDisplay[]; remaining: PatternDisplay[] }
    > = {};
    const trackPatterns = Object.values(props.patternsById).filter(
      (p) => p.track_id === currentTrack.id,
    );
    for (const [signalId, signalType] of visibleSignals) {
      void signalType;
      const tagSet = new Set(props.signalTagsBySignalId[signalId] ?? []);
      const matched: PatternDisplay[] = [];
      const remaining: PatternDisplay[] = [];
      for (const p of trackPatterns) {
        const display: PatternDisplay = {
          id: p.id,
          insight_type: p.insight_type,
          content: p.content,
          implication_questions: p.implication_questions,
        };
        if (tagSet.has(p.signal_tag_scope)) {
          matched.push(display);
        } else {
          remaining.push(display);
        }
      }
      patternsBySignalId[signalId] = { matched, remaining };
    }
    // Implications footer: bulleted questions from Patterns matching
    // the visible Signals' inferred tags. Cap at 6, prioritize by
    // signal-type weight (Goal=4, Blocker=3, Trigger=2, Indecision=1).
    const TYPE_WEIGHT: Record<string, number> = {
      goal: 4,
      blocker: 3,
      trigger: 2,
      indecision: 1,
    };
    const ordered = [...visibleSignals.entries()].sort(
      (a, b) => (TYPE_WEIGHT[b[1]] ?? 0) - (TYPE_WEIGHT[a[1]] ?? 0),
    );
    const implications: string[] = [];
    for (const [signalId] of ordered) {
      // Sprint 5e v2 Block G — implications source from matched
      // Patterns only. Remaining Patterns are gated behind banker
      // expansion in the popover and shouldn't auto-surface in the
      // footer.
      const ps = patternsBySignalId[signalId]?.matched ?? [];
      for (const p of ps) {
        for (const q of p.implication_questions.slice(0, 1)) {
          if (implications.length >= 6) break;
          if (!implications.includes(q)) implications.push(q);
        }
        if (implications.length >= 6) break;
      }
      if (implications.length >= 6) break;
    }
    return { insights: insightsForObjective, patternsBySignalId, implications };
  }, [
    popupObjective,
    currentTrack,
    dotsByObjective,
    props.capturedRowsByEvidenceRef,
    props.insights,
    props.patternsById,
    props.signalTagsBySignalId,
  ]);

  return (
    <>
      <V2Dialpad
        memberId={memberId}
        bankerId={bankerId}
        controlledActivity={dialpadActivity}
        onActivityChange={handleDialpadActivityChange}
        preselectedFactorId={preselectedFactorId}
        preselectedCaptureMode={preselectedCaptureMode}
        preselectedSignalId={preselectedSignalId}
        preselectedInsightType={preselectedInsightType}
        factorCapturesById={factorCapturesById}
        {...props.dialpadProps}
      />
      <div className="mx-auto flex max-w-6xl">
        <V2Sidebar
          objectives={objectives}
          artifacts={trackFilteredArtifacts}
          macro={props.macro}
          history={props.history}
          totalConversationCount={props.totalConversationCount}
          coachContent={props.coachContent}
          memberId={memberId}
          bankerId={bankerId}
          // Track switcher (Block F)
          rankedTracks={rankedTracks.map<SidebarTrackOption>((t) => ({
            track_id: t.track_id,
            track_name: t.track_name,
            strength: t.strength,
            strong_count: t.strong_count,
            moderate_count: t.moderate_count,
            negative_count: t.negative_count,
            applicable: t.applicable,
          }))}
          selectedTrackId={currentRanked?.track_id ?? null}
          onSelectTrack={handleSelectTrack}
          onTracksComparisonOpen={() => setTracksOpen(true)}
          onObjectiveClick={handleObjectiveClick}
          onCtaAction={handleCtaAction}
          // Sprint 4/9 reconciliation (RC1) — same capture map + missing-
          // param handler the shell's popup dialog uses, so the sidebar's
          // own Model preview dialog resolves source-linked params too.
          factorCapturesById={factorCapturesById}
          onMissingParameterCapture={handleMissingParameterCapture}
        />
        <V2MainPanel
          items={props.feedItems}
          onPreviewArtifact={(subject) => setPopupArtifactPreview(subject)}
          factorCapturesById={factorCapturesById}
          onMissingParameterCapture={handleMissingParameterCapture}
          memberId={memberId}
        />
      </div>

      {popupObjective && currentTrack && currentRanked && (
        <ObjectivePopup
          objective={popupObjective}
          trackName={currentRanked.track_name}
          ctas={ctasByObjective[popupObjective]}
          dots={dotsByObjective[popupObjective]}
          capturedRows={props.capturedRowsByEvidenceRef}
          insights={popupContext.insights}
          patternsBySignalId={popupContext.patternsBySignalId}
          implications={popupContext.implications}
          factorsById={factorsById}
          onCtaClick={(cta) => handleCtaAction(cta.action)}
          onAuthorInsightForSignal={handleAuthorInsightForSignal}
          onRefreshFactor={(factorId) =>
            handleCtaAction({ type: "refresh_capture", factor_id: factorId })
          }
          onRefreshSignal={(signalType) =>
            handleCtaAction({ type: "refresh_signal", signal_type: signalType })
          }
          onPreviewArtifact={(subject) => setPopupArtifactPreview(subject)}
          onDeepen={() => {
            setPopupObjective(null);
            setPreselectedFactorId(undefined);
            setPreselectedSignalId(undefined);
            setPreselectedInsightType(undefined);
            setDialpadActivity("insight");
          }}
          onClose={() => setPopupObjective(null)}
        />
      )}

      {/* Empty-Track fallback popup. */}
      {popupObjective && (!currentTrack || !currentRanked) && (
        <ObjectivePopup
          objective={popupObjective}
          trackName="(no Track yet)"
          ctas={[]}
          dots={[]}
          capturedRows={{}}
          insights={[]}
          patternsBySignalId={{}}
          implications={[]}
          factorsById={factorsById}
          onCtaClick={(cta) => handleCtaAction(cta.action)}
          onAuthorInsightForSignal={handleAuthorInsightForSignal}
          onRefreshFactor={(factorId) =>
            handleCtaAction({ type: "refresh_capture", factor_id: factorId })
          }
          onRefreshSignal={(signalType) =>
            handleCtaAction({ type: "refresh_signal", signal_type: signalType })
          }
          onPreviewArtifact={(subject) => setPopupArtifactPreview(subject)}
          onDeepen={() => {
            setPopupObjective(null);
            setDialpadActivity("insight");
          }}
          onClose={() => setPopupObjective(null)}
        />
      )}

      {tracksOpen && (
        <TracksSupportedPanel
          cohort={props.tracksCohort}
          onClose={() => setTracksOpen(false)}
        />
      )}

      {/* Sprint 5b.1 Block G — specialist handoff dialog opens when
          banker clicks the Layer 3 specialist-handoff CTA. */}
      {specialistHandoffOpen && currentTrack && (
        <SpecialistHandoffDialogInner
          memberId={memberId}
          bankerId={bankerId}
          trackId={specialistHandoffOpen.track_id}
          trackName={
            trackTemplates.find(
              (t) => t.id === specialistHandoffOpen.track_id,
            )?.name ?? specialistHandoffOpen.track_id
          }
          onClose={() => setSpecialistHandoffOpen(null)}
        />
      )}

      {/* Sprint 5e Block G — artifact preview triggered from popup-as-
          workflow Model/Shown rows. Mounts above the popup overlay; the
          popup stays open underneath so banker returns to conversation
          context after closing the artifact. */}
      {popupArtifactPreview && (
        <ArtifactPreviewDialog
          artifact={popupArtifactPreview}
          memberId={memberId}
          bankerId={bankerId}
          conversationId={null}
          onClose={() => setPopupArtifactPreview(null)}
          factorCapturesById={factorCapturesById}
          onMissingParameterCapture={handleMissingParameterCapture}
        />
      )}
    </>
  );
}
