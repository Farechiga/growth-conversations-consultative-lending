/*
 * Sprint 5a.2 Block B — Track-relative dot derivation.
 *
 * Replaces the Sprint 4.7.2 generic-catalog dot composition with
 * Track-template-relative derivation. Each TrackTemplate has a
 * `required_evidence_per_objective` JSON map (Section 2 of
 * BUSINESS_FACTOR_MATRIX_v1.md) listing the evidence refs that the
 * Track wants captured for each objective. This module resolves those
 * refs against the Member's captured data and produces dots.
 *
 * Evidence refs come in two flavors:
 *   1. Factor refs ("FACTOR-NNN") — resolve to FactorCapture for that
 *      factor on this Member. Captured if a non-null value exists.
 *   2. Symbolic refs ("model_produced", "model_shown", "reaction_captured",
 *      "decision_maker_mapping", "specialist_handoff_initiated") — resolve
 *      to entity-existence checks against the Member's other captures.
 *
 * Sprint 5a.2 also exports helpers for the popup-as-workflow surface:
 *   - missingEvidence: refs in current Track's required list that are
 *     not yet captured (drives top-zone CTAs)
 *   - capturedEvidence: refs that ARE captured plus their resolved
 *     display data (drives bottom-zone evidence rows)
 *   - nextValuable: the single highest-priority missing ref per
 *     objective (drives "+ next valuable" affordance)
 */

import type { V2Objective } from "./stage-guidance";

// ────────────────────────────────────────────────
// Input shapes — match Prisma row shapes but kept loose so callers
// can pass partial objects.
// ────────────────────────────────────────────────

export type FactorCaptureLite = {
  factor_id: string;
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
  unit: string | null;
  captured_at: Date | string;
  banker_id: string;
  source_signal_id: string | null;
  source_sizing_id: string | null;
  source_reaction_id: string | null;
  // Sprint 8 Block A — capture-mode dichotomy.
  capture_mode?: string;
};

export type BusinessFactorLite = {
  id: string;
  name: string;
  diagnostic_question: string;
  capture_mode: string;
  field_name: string;
  unit: string | null;
  category: string;
  enum_values: string | null;
};

export type TrackTemplateLite = {
  id: string;
  name: string;
  required_evidence_per_objective: Record<V2Objective, string[]>;
};

export type EntityCounts = {
  // Member-level capture counts used for symbolic evidence resolution.
  modelCount: number;
  showEventCount: number;
  reactionCount: number;
  // ActionCards filtered to specialist_handoff type for navigate symbol.
  specialistHandoffCount: number;
};

// ────────────────────────────────────────────────
// Output shapes
// ────────────────────────────────────────────────

export type ObjectiveDotData = {
  evidence_ref: string;        // FACTOR-NNN or symbolic ref
  label: string;               // banker-facing short label
  captured: boolean;
  // For captured factor refs: resolved values for display.
  capture?: FactorCaptureLite;
  // For symbolic refs: number of qualifying entities (e.g., 3 models).
  count?: number;
};

// ────────────────────────────────────────────────
// Symbolic ref resolution
// ────────────────────────────────────────────────

const SYMBOLIC_LABELS: Record<string, string> = {
  model_produced: "Model produced",
  model_shown: "Model shown",
  reaction_captured: "Reaction captured",
  decision_maker_mapping: "Decision-maker mapping",
  specialist_handoff_initiated: "Specialist handoff",
};

function isSymbolicRef(ref: string): boolean {
  return !ref.startsWith("FACTOR-");
}

function resolveSymbolic(
  ref: string,
  counts: EntityCounts,
  captures: FactorCaptureLite[],
): { captured: boolean; count: number } {
  switch (ref) {
    case "model_produced":
      return { captured: counts.modelCount > 0, count: counts.modelCount };
    case "model_shown":
      return { captured: counts.showEventCount > 0, count: counts.showEventCount };
    case "reaction_captured":
      return { captured: counts.reactionCount > 0, count: counts.reactionCount };
    case "decision_maker_mapping": {
      // Resolves to FACTOR-014 (co_decision_maker_required) presence —
      // the proxy for "decision-maker mapping has been captured."
      const cap = captures.find((c) => c.factor_id === "FACTOR-014");
      return { captured: !!cap && cap.boolean_value !== null, count: cap ? 1 : 0 };
    }
    case "specialist_handoff_initiated":
      return {
        captured: counts.specialistHandoffCount > 0,
        count: counts.specialistHandoffCount,
      };
    default:
      // Unknown symbolic ref — render as not-yet-captured so the
      // popup CTA surfaces it. Sprint 5a.2 may not handle every
      // possible symbolic ref the matrix author writes.
      return { captured: false, count: 0 };
  }
}

// ────────────────────────────────────────────────
// Factor ref resolution
// ────────────────────────────────────────────────

function resolveFactor(
  factorId: string,
  factors: BusinessFactorLite[],
  captures: FactorCaptureLite[],
): { factor: BusinessFactorLite | null; capture: FactorCaptureLite | null; captured: boolean } {
  const factor = factors.find((f) => f.id === factorId) ?? null;
  const capture = captures.find((c) => c.factor_id === factorId) ?? null;
  if (!capture) return { factor, capture: null, captured: false };
  const captured =
    capture.numerical_value !== null ||
    capture.boolean_value !== null ||
    (capture.qualitative_value !== null && capture.qualitative_value !== "");
  return { factor, capture, captured };
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

export type DeriveDotsArgs = {
  objective: V2Objective;
  currentTrack: TrackTemplateLite | null;
  factors: BusinessFactorLite[];
  captures: FactorCaptureLite[];
  counts: EntityCounts;
};

/**
 * Derive the full dot list (captured + missing) for an objective under
 * the current Track. Returns the dots in the order the matrix template
 * specifies, with `captured: true/false` resolved against Member data.
 * Block C will filter to captured-only for the main row; the full list
 * is what the popup-as-workflow uses.
 */
export function deriveDotsForObjective({
  objective,
  currentTrack,
  factors,
  captures,
  counts,
}: DeriveDotsArgs): ObjectiveDotData[] {
  if (!currentTrack) return [];
  const refs = currentTrack.required_evidence_per_objective[objective] ?? [];
  return refs.map((ref) => {
    if (isSymbolicRef(ref)) {
      const { captured, count } = resolveSymbolic(ref, counts, captures);
      return {
        evidence_ref: ref,
        label: SYMBOLIC_LABELS[ref] ?? ref,
        captured,
        count,
      };
    }
    const { factor, capture, captured } = resolveFactor(ref, factors, captures);
    return {
      evidence_ref: ref,
      label: factor?.name ?? ref,
      captured,
      capture: capture ?? undefined,
    };
  });
}

/**
 * Captured-only filter for the main dot row (Sprint 5a.2 Block C —
 * dot system simplification: no faint/outlined ghosts).
 */
export function capturedDots(dots: ObjectiveDotData[]): ObjectiveDotData[] {
  return dots.filter((d) => d.captured);
}

/**
 * Missing-evidence list for the popup top zone (Block D).
 * Returns the dots in matrix-template order (which is roughly
 * priority order; matrix authors front-load the strong/required refs).
 */
export function missingEvidence(dots: ObjectiveDotData[]): ObjectiveDotData[] {
  return dots.filter((d) => !d.captured);
}

/**
 * Single highest-priority missing ref for the "+ next valuable"
 * affordance (Block C). Picks the first uncaptured ref in the matrix
 * template order. Returns null if all required evidence is captured
 * (objective is "complete" for this Track).
 */
export function nextValuable(dots: ObjectiveDotData[]): ObjectiveDotData | null {
  const missing = missingEvidence(dots);
  return missing[0] ?? null;
}
