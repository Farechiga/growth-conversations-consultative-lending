/*
 * Sprint 5b.1 Block A — bounded CTA derivation.
 *
 * Returns ranked CTAs across three bounded layers for a given (Member,
 * Track, objective) tuple. When all layers are exhausted, returns an
 * empty array — the popup-as-workflow surface is honest about
 * completeness rather than fabricating "complete" labels (per
 * architectural commitment from sprint pre-flight).
 *
 * Three layers:
 *   1. Missing template evidence — required evidence per Track template
 *      not yet captured, split into Class 1A (numerical/boolean →
 *      higher priority, opens + Quantify) and Class 1B (qualitative or
 *      symbolic → lower priority, opens appropriate form).
 *   2. Threshold-uplift — captures that fired moderate but a strong
 *      tier exists in the matrix; surface as a re-confirm opportunity
 *      with the strong-tier threshold.
 *   3. Specialist handoff — when the current Track requires a
 *      specialist and the rockstar package is captured (Discover +
 *      Measure layer 1 exhausted; model_produced + reaction_captured
 *      present for Consult), surface handoff CTA on Navigate objective.
 *
 * Staleness CTAs (>90d) are NOT in the priority ranking — they surface
 * inline on the captured evidence row itself (Block G implementation).
 *
 * Strength tier labels (strong/moderate/insufficient) are not exposed
 * in CTA records' banker-facing fields. Matrix scoring drives ranking
 * and prioritization but isn't surfaced as a category banker has to
 * interpret.
 */

import type { V2Objective } from "./stage-guidance";

// ────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────

export type CTAAction =
  | {
      type: "open_capture_form";
      form: "quantify" | "ask" | "model" | "reaction" | "action" | "insight";
      preselected_factor_id?: string;
      preselected_signal_id?: string;
    }
  | { type: "open_specialist_handoff"; track_id: string }
  | { type: "refresh_capture"; factor_id: string }
  // Sprint 5e Block E.5 — + refresh on a Signal-linked row routes to
  // + Ask (banker re-captures the Member statement that drives the
  // Signal). + Quantify is the right destination only for standalone
  // numerical/boolean FactorCaptures; routing every refresh through
  // + Quantify produced the qualitative-dropdown bug for "Stated *"
  // factors.
  | {
      type: "refresh_signal";
      signal_type: "goal" | "blocker" | "indecision" | "trigger";
    };

export type CTALayer =
  | "missing_evidence"
  | "threshold_uplift"
  | "specialist_handoff"
  | "staleness_refresh";

export type CTA = {
  id: string;
  layer: CTALayer;
  priority: number; // 0-100, higher = more prominent
  label: string;
  action: CTAAction;
  context?: string;
};

// ────────────────────────────────────────────────
// Input shapes
// ────────────────────────────────────────────────

export type DeriveFactorCapture = {
  factor_id: string;
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
  unit: string | null;
  captured_at: Date | string;
};

export type DeriveBusinessFactor = {
  id: string;
  name: string;
  capture_mode: string; // numerical | boolean | qualitative_select | qualitative_multi
  field_name: string;
  unit: string | null;
};

export type DeriveTrackTemplate = {
  id: string;
  name: string;
  required_evidence_per_objective: Record<V2Objective, string[]>;
};

export type DeriveMatrixEntry = {
  factor_id: string;
  track_id: string;
  strength: string; // strong | moderate | negative
  threshold_rule: string | null;
};

export type DeriveEntityCounts = {
  modelCount: number;
  showEventCount: number;
  reactionCount: number;
  specialistHandoffCount: number;
};

export type DeriveArgs = {
  objective: V2Objective;
  track: DeriveTrackTemplate | null;
  factors: DeriveBusinessFactor[];
  captures: DeriveFactorCapture[];
  matrix_entries: DeriveMatrixEntry[];
  counts: DeriveEntityCounts;
};

// ────────────────────────────────────────────────
// Symbolic-ref → form routing (keeps consistent with workstation-shell
// handleCtaClick from Sprint 5a.2 Block E).
// ────────────────────────────────────────────────

type CaptureFormName = "quantify" | "ask" | "model" | "reaction" | "action" | "insight";

// Sprint 5d Block E.1 — Layer 1 Class 1B labels rewritten for
// banker-natural voice. Code-internal symbolic refs unchanged.
const SYMBOLIC_FORM_MAP: Record<
  string,
  { form: CaptureFormName; label: string; context: string }
> = {
  model_produced: {
    form: "model",
    label: "Build a model with the Member",
    context: "+ Model",
  },
  model_shown: {
    form: "model",
    label: "Show the Member the projection",
    context: "Record from artifact preview",
  },
  reaction_captured: {
    form: "reaction",
    label: "Capture how the Member reacted",
    context: "+ Reaction",
  },
  decision_maker_mapping: {
    form: "ask",
    label: "Capture what the Member said about who decides",
    context: "+ Ask",
  },
  specialist_handoff_initiated: {
    form: "action",
    label: "Hand off to a specialist",
    context: "+ Action",
  },
};

// Tracks that require a specialist for closing. Drives Layer 3.
// Sprint 5d Block E.1 — TRACK-008 (SBA 504) added; specialist handoff
// language reflects Section 4.3 approved decision ("Hand off to SBA 504
// specialist" — avoid doubled SBA).
const TRACK_SPECIALIST_DEPARTMENT: Record<string, string> = {
  "TRACK-003": "CRE specialists",
  "TRACK-004": "SBA specialists",
  "TRACK-008": "SBA 504 specialists",
};

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function isSymbolicRef(ref: string): boolean {
  return !ref.startsWith("FACTOR-");
}

function isCaptured(
  evidenceRef: string,
  captures: DeriveFactorCapture[],
  counts: DeriveEntityCounts,
): boolean {
  if (evidenceRef.startsWith("FACTOR-")) {
    const cap = captures.find((c) => c.factor_id === evidenceRef);
    if (!cap) return false;
    return (
      cap.numerical_value !== null ||
      cap.boolean_value !== null ||
      (cap.qualitative_value !== null && cap.qualitative_value !== "")
    );
  }
  switch (evidenceRef) {
    case "model_produced":
      return counts.modelCount > 0;
    case "model_shown":
      return counts.showEventCount > 0;
    case "reaction_captured":
      return counts.reactionCount > 0;
    case "decision_maker_mapping": {
      const cap = captures.find((c) => c.factor_id === "FACTOR-014");
      return !!cap && cap.boolean_value !== null;
    }
    case "specialist_handoff_initiated":
      return counts.specialistHandoffCount > 0;
    default:
      return false;
  }
}

function classForFactor(factor: DeriveBusinessFactor): "1A" | "1B" {
  // Class 1A: numerical or boolean — quantitative inputs for artifact
  // production. Higher priority because they unblock + Model.
  // Class 1B: qualitative — descriptive captures, lower priority.
  if (factor.capture_mode === "numerical" || factor.capture_mode === "boolean") {
    return "1A";
  }
  return "1B";
}

// Threshold-uplift detection: walk the matrix entries for the current
// Track's anchored factor. If a moderate-tier entry's threshold_rule
// matches the current capture but a strong-tier entry exists with a
// higher threshold not yet matched, that's an uplift opportunity.
function deriveThresholdUplift(
  factorId: string,
  capture: DeriveFactorCapture,
  factor: DeriveBusinessFactor,
  trackId: string,
  matrixEntries: DeriveMatrixEntry[],
): { strongThresholdValue: number; strongRule: string } | null {
  if (capture.numerical_value === null) return null;
  const trackEntries = matrixEntries.filter(
    (e) => e.factor_id === factorId && e.track_id === trackId,
  );
  // Only consider numeric >= comparisons for uplift surfacing — the
  // pattern "moderate fires at >=10 AND <20; strong fires at >=20"
  // gives us a clean uplift target. Other rule shapes (boolean ==,
  // qualitative IN) don't have a tiered uplift semantic.
  const strongEntry = trackEntries.find((e) => e.strength === "strong");
  if (!strongEntry?.threshold_rule) return null;
  const m = strongEntry.threshold_rule.match(
    /^(\w+)\s*>=\s*(-?\d+(?:\.\d+)?)/,
  );
  if (!m) return null;
  const strongFieldName = m[1];
  const strongThresholdValue = Number(m[2]);
  if (strongFieldName !== factor.field_name) return null;
  // If the captured value already meets the strong threshold, no
  // uplift opportunity — strong is already firing.
  if (capture.numerical_value >= strongThresholdValue) return null;
  // Confirm a moderate-tier entry currently fires (otherwise the
  // factor isn't in play; surfacing strong-only would be noise).
  const moderateFires = trackEntries.some((e) => {
    if (e.strength !== "moderate" || !e.threshold_rule) return false;
    return evaluateModerateNumericRule(
      capture.numerical_value!,
      e.threshold_rule,
      factor.field_name,
    );
  });
  if (!moderateFires) return null;
  return { strongThresholdValue, strongRule: strongEntry.threshold_rule };
}

// Tiny inline evaluator just for the uplift moderate-tier check. Mirrors
// the syntax patterns in lib/factor-evaluator.ts but bounded to the
// numeric AND-of-comparisons shapes the matrix uses for tier ranges.
function evaluateModerateNumericRule(
  value: number,
  rule: string,
  fieldName: string,
): boolean {
  const tokens = rule.split(/\s+AND\s+/);
  for (const t of tokens) {
    const m = t.match(
      /^(\w+)\s*(>=|<=|>|<|==|!=)\s*(-?\d+(?:\.\d+)?)/,
    );
    if (!m) continue;
    const [, field, op, n] = m;
    if (field !== fieldName) return false;
    const target = Number(n);
    switch (op) {
      case ">=":
        if (!(value >= target)) return false;
        break;
      case ">":
        if (!(value > target)) return false;
        break;
      case "<=":
        if (!(value <= target)) return false;
        break;
      case "<":
        if (!(value < target)) return false;
        break;
      case "==":
        if (value !== target) return false;
        break;
      case "!=":
        if (value === target) return false;
        break;
    }
  }
  return true;
}

// ────────────────────────────────────────────────
// Public API — deriveNextActions
// ────────────────────────────────────────────────

export function deriveNextActions(args: DeriveArgs): CTA[] {
  const { objective, track, factors, captures, matrix_entries, counts } = args;
  if (!track) return [];

  const cta_list: CTA[] = [];
  const requiredRefs = track.required_evidence_per_objective[objective] ?? [];

  // ── Layer 1 — missing template evidence ──
  for (const ref of requiredRefs) {
    if (isCaptured(ref, captures, counts)) continue;

    if (isSymbolicRef(ref)) {
      const route = SYMBOLIC_FORM_MAP[ref];
      if (!route) {
        // Unknown symbolic ref — surface as Class 1B with generic label.
        cta_list.push({
          id: `missing-${ref}`,
          layer: "missing_evidence",
          priority: 60,
          label: ref.replace(/_/g, " "),
          action: { type: "open_capture_form", form: "ask" },
        });
        continue;
      }
      cta_list.push({
        id: `missing-${ref}`,
        layer: "missing_evidence",
        priority: 65, // Class 1B (symbolic, qualitative-equivalent)
        label: route.label,
        context: route.context,
        action: route.form === "model"
          ? { type: "open_capture_form", form: "model" }
          : route.form === "reaction"
          ? { type: "open_capture_form", form: "reaction" }
          : route.form === "action"
          ? { type: "open_capture_form", form: "action" }
          : { type: "open_capture_form", form: "ask" },
      });
      continue;
    }

    // FACTOR-NNN ref
    const factor = factors.find((f) => f.id === ref);
    if (!factor) continue;
    const klass = classForFactor(factor);
    cta_list.push({
      id: `missing-${ref}`,
      layer: "missing_evidence",
      priority: klass === "1A" ? 78 : 65,
      label: `Capture ${factor.name.toLowerCase()}`,
      context:
        factor.capture_mode === "numerical"
          ? `+ Quantify · numerical input${factor.unit ? ` (${factor.unit})` : ""}`
          : factor.capture_mode === "boolean"
          ? "+ Quantify · yes/no"
          : "+ Quantify · select",
      action: {
        type: "open_capture_form",
        form: "quantify",
        preselected_factor_id: ref,
      },
    });
  }

  // ── Layer 2 — threshold-uplift ──
  // For each captured numerical factor, check if a strong-tier entry
  // exists for the current Track at a higher threshold than the
  // current capture. If so, surface as uplift CTA.
  for (const capture of captures) {
    if (capture.numerical_value === null) continue;
    const factor = factors.find((f) => f.id === capture.factor_id);
    if (!factor) continue;
    // Only surface uplift on factors that are actually required by this
    // objective for the current Track. Otherwise we'd surface random
    // uplift opportunities for off-objective factors.
    if (!requiredRefs.includes(capture.factor_id)) continue;
    const uplift = deriveThresholdUplift(
      capture.factor_id,
      capture,
      factor,
      track.id,
      matrix_entries,
    );
    if (!uplift) continue;
    const unit = factor.unit ?? "";
    const currentDisplay =
      unit === "$"
        ? `$${capture.numerical_value.toLocaleString("en-US")}`
        : `${capture.numerical_value}${unit ? ` ${unit}` : ""}`;
    const targetDisplay =
      unit === "$"
        ? `$${uplift.strongThresholdValue.toLocaleString("en-US")}`
        : `${uplift.strongThresholdValue}${unit ? ` ${unit}` : ""}`;
    cta_list.push({
      id: `uplift-${capture.factor_id}`,
      layer: "threshold_uplift",
      priority: 48,
      // Sprint 5d Block E.1 — Layer 2 reformat per Section 4.2.
      label: `Re-check ${factor.name.toLowerCase()}`,
      context: `currently ${currentDisplay}. If it’s ${targetDisplay} or higher, the case gets stronger.`,
      action: { type: "refresh_capture", factor_id: capture.factor_id },
    });
  }

  // ── Layer 3 — specialist handoff ──
  // Surface only on Navigate objective. Requires:
  //   - Track is in TRACK_SPECIALIST_DEPARTMENT map
  //   - All Discover + Measure required evidence captured
  //   - Consult-objective model_produced + reaction_captured both true
  //   - No SpecialistHandoff record yet (counts.specialistHandoffCount === 0)
  if (objective === "navigate" && TRACK_SPECIALIST_DEPARTMENT[track.id]) {
    const discoverComplete = (
      track.required_evidence_per_objective.discover ?? []
    ).every((r) => isCaptured(r, captures, counts));
    const measureComplete = (
      track.required_evidence_per_objective.measure ?? []
    ).every((r) => isCaptured(r, captures, counts));
    const consultMin =
      isCaptured("model_produced", captures, counts) &&
      isCaptured("reaction_captured", captures, counts);
    const handoffPending = counts.specialistHandoffCount === 0;
    if (discoverComplete && measureComplete && consultMin && handoffPending) {
      // Sprint 5d Block E.1 — Layer 8 reformat per Section 4.3.
      // SBA 504 special-cases to avoid the "SBA SBA" doubling per the
      // approved decision in the sprint preamble.
      const department = TRACK_SPECIALIST_DEPARTMENT[track.id];
      const label =
        track.id === "TRACK-008"
          ? "Hand off to SBA 504 specialist"
          : `Hand off to the ${department} for ${track.name}`;
      cta_list.push({
        id: `handoff-${track.id}`,
        layer: "specialist_handoff",
        priority: 70,
        label,
        context:
          track.id === "TRACK-008"
            ? `coordinate the SBA 504 transaction`
            : `coordinate with ${department}`,
        action: { type: "open_specialist_handoff", track_id: track.id },
      });
    }
  }

  // Sort by priority descending. Stable for equal priorities (insertion
  // order preserved by Array.prototype.sort in modern engines).
  cta_list.sort((a, b) => b.priority - a.priority);
  return cta_list;
}

// ────────────────────────────────────────────────
// Convenience — single highest-priority CTA for the sidebar
// "+ next valuable" affordance.
// ────────────────────────────────────────────────

export function topCTA(args: DeriveArgs): CTA | null {
  const all = deriveNextActions(args);
  return all[0] ?? null;
}
