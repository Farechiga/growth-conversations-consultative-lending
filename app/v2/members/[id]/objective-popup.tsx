"use client";

/*
 * Sprint 5b.1 Block B + E + F — popup-as-workflow surface, refactored.
 *
 * Click an objective in the sidebar → popup with three zones:
 *
 *   TOP zone — CTAs from `deriveNextActions` (Sprint 5b.1 Block A).
 *   When the array is empty, the zone is *not rendered at all* — no
 *   "complete" label, no "to strengthen this candidate, capture:"
 *   header. The evidence-list zone stands alone. Honest about
 *   completeness without false claims of finality.
 *
 *   BOTTOM zone — captured evidence rows + Insight rows. Each row
 *   carries structured fields. Goal/Blocker/Indecision/Trigger rows
 *   include two affordances on the right edge:
 *     - lightbulb icon (Block F): canonical Patterns popover
 *     - + Insight (Block E): opens authoring form pre-filled with the
 *       row's Signal id and an insight_type default
 *
 *   FOOTER — "Implications:" section (Block F): bulleted questions
 *   drawn from Patterns matching the captured Signals on this popup.
 *   Capped at 4-6 questions, prioritized Goal > Blocker > Trigger >
 *   Indecision.
 *
 * Discipline (per COMPLIANCE.md §10.2 + Francisco's GenAI-filler ban):
 *   - No banned phrases ("Recommended for", "Eligible for",
 *     "Candidate tracks", "Pre-qualified", "Approved")
 *   - Always frame as "supports" / "supported by evidence" / "advances"
 *   - Every element sourced from a structured field. Empty zones stay
 *     empty rather than fill with paraphrase.
 */

import { useState } from "react";
import { Chip } from "@/app/_components/chip";
import {
  V2_OBJECTIVE_LABELS,
  V2_OBJECTIVE_QUESTIONS,
  type V2Objective,
} from "@/lib/stage-guidance";
import type {
  ObjectiveDotData,
  BusinessFactorLite,
  FactorCaptureLite,
} from "@/lib/objective-evidence";
import type { CTA } from "@/lib/cta-derivation";

// ────────────────────────────────────────────────
// Captured-row display data (Sprint 5a.2 Block D shape, unchanged).
// ────────────────────────────────────────────────

export type CapturedRowDisplay = {
  evidence_ref: string;
  type_chip: string;
  value_display: string;
  member_quote: string | null;
  captured_at_label: string;
  captured_via: string | null;
  banker_name: string | null;
  // Sprint 5b.1 Block B — when this captured row corresponds to a
  // Goal/Blocker/Indecision/Trigger Signal, this is the Signal id +
  // type. Drives the contextual + Insight affordance + lightbulb
  // popover. Null on factor-only / Model / Reaction / etc. rows.
  signal_id?: string | null;
  signal_type?: "goal" | "blocker" | "indecision" | "trigger" | null;
  // Sprint 5b.1 Block G — captured_at as Date for staleness calculation.
  captured_at_iso?: string;
  // Sprint 5b.1 Block G — open-thread heuristic. True for Indecision
  // Signals with no subsequent Reaction. Rendered as small "open"
  // chip on the row.
  is_open_thread?: boolean;
  // Sprint 5e Block G — when the row corresponds to an Artifact-backed
  // capture (Model with artifact attached, ShowEvent), this carries
  // the metadata the existing ArtifactPreviewDialog needs to render
  // the artifact. Click on the row's value opens the dialog. Null on
  // rows without an Artifact (factor captures, banker-draft Models
  // without an attached Artifact, Reactions, Signal-quote rows).
  artifact_preview?: {
    id: string;
    title: string;
    description: string | null;
    template: string | null;
  } | null;
};

// ────────────────────────────────────────────────
// Insight display data — denormalized at page level.
// ────────────────────────────────────────────────

export type InsightDisplay = {
  id: string;
  // Sprint 5d Block H.2 — track_id surfaces so the workstation shell can
  // gate Track-level Insights to the current Track context across all
  // four objective popups (not just Discover).
  track_id: string;
  insight_type: "reframe" | "implication";
  content: string;
  llm_feedback: string | null;
  matched_pattern_id: string | null;
  state: "routine" | "novel";
  authored_at_label: string;
  banker_name: string | null;
  addresses_signal_id: string | null;
  addresses_signal_summary: string | null; // "Blocker: cashflow_volatility"
};

// ────────────────────────────────────────────────
// Pattern preview for the lightbulb popover (Block F).
// ────────────────────────────────────────────────

export type PatternDisplay = {
  id: string;
  insight_type: "reframe" | "implication";
  content: string;
  implication_questions: string[];
};

export type ObjectivePopupProps = {
  objective: V2Objective;
  trackName: string;
  // Sprint 5b.1 — top zone derives from CTAs, not dots. Empty → no zone.
  ctas: CTA[];
  // Bottom zone uses dots to know which refs belong to this objective.
  dots: ObjectiveDotData[];
  capturedRows: Record<string, CapturedRowDisplay>;
  // Sprint 5b.1 Block B — Insights to display in bottom zone
  // (Signal-attached Insights matching captured rows on this objective +
  // Track-level Insights for current Track).
  insights: InsightDisplay[];
  // Sprint 5b.1 Block F — Patterns by signal_id for lightbulb popover.
  //
  // Sprint 5e v2 Block G — split into `matched` (Patterns whose
  // `signal_tag_scope` matches a tag captured against this Signal,
  // either via the Signal's source-linked qualitative FactorCapture's
  // qualitative_value or the Topic.canonical_tag) and `remaining`
  // (Track-relevant Patterns whose tag doesn't match — surfaced via
  // the "See all related insights" expand affordance). Empty arrays
  // acceptable for either side.
  patternsBySignalId: Record<
    string,
    { matched: PatternDisplay[]; remaining: PatternDisplay[] }
  >;
  // Sprint 5b.1 Block F — bulleted implication questions from matched
  // Patterns; rendered in popup footer. Capped 4-6 by caller.
  implications: string[];
  factorsById: Record<string, BusinessFactorLite>;
  // Action handlers
  onCtaClick: (cta: CTA) => void;
  onAuthorInsightForSignal: (args: {
    signalId: string;
    signalType: "goal" | "blocker" | "indecision" | "trigger";
  }) => void;
  // Sprint 5b.1 patch — onUsePatternForInsight removed: visual review
  // dropped the "Use as basis for + Insight ↗" affordance from the
  // Growth insights popover. Banker authors via the row's + Insight
  // affordance which is contextually pre-filled with the same Signal.
  // Sprint 5b.1 Block G — refresh stale capture: opens + Quantify
  // pre-selected to factor; new FactorCapture supersedes old via
  // recency in evaluator queries.
  // Sprint 5e Block E.5 — refresh splits by row type. Signal-linked
  // rows (Goal/Blocker/Indecision/Trigger) route to + Ask via
  // onRefreshSignal; standalone factor rows continue to onRefreshFactor.
  onRefreshFactor: (factorId: string) => void;
  onRefreshSignal: (
    signalType: "goal" | "blocker" | "indecision" | "trigger",
  ) => void;
  // Sprint 5e Block G — banker clicks the Model/Shown row's artifact
  // value to open the existing ArtifactPreviewDialog (same dialog
  // used from the sidebar). Workstation-shell hoists the dialog state
  // and renders the dialog above the popup.
  onPreviewArtifact: (subject: NonNullable<CapturedRowDisplay["artifact_preview"]>) => void;
  // Sprint 5b.1 Block G — + deepen affordance opens + Insight in
  // Track-level mode (no Signal pre-fill). Surfaces only when CTA
  // zone is empty AND evidence list exists.
  onDeepen: () => void;
  onClose: () => void;
};

export function ObjectivePopup({
  objective,
  trackName,
  ctas,
  dots,
  capturedRows,
  insights,
  patternsBySignalId,
  implications,
  factorsById,
  onCtaClick,
  onAuthorInsightForSignal,
  onRefreshFactor,
  onRefreshSignal,
  onPreviewArtifact,
  onDeepen,
  onClose,
}: ObjectivePopupProps) {
  // Sprint 5b.1 Patch 5 — dedupe captured rows by source signal_id.
  // Multiple FactorCaptures can source-link to the same Signal (e.g.,
  // Northland's FACTOR-007 + FACTOR-022 + FACTOR-024 all → capSignal),
  // which would otherwise render as identical Blocker rows.
  // Deduplication keeps the first occurrence per signal_id (matrix
  // template order, which is roughly priority order). Rows without
  // source linkage (factor-only captures, symbolic refs) are NEVER
  // deduped — each gets its own row.
  //
  // Sprint 5e Block F.B — dedupe only applies to rows whose primary
  // content IS the Signal quote (qualitative factors mapped via Block
  // F.A to type_chip = Goal/Blocker/Indecision/Trigger). Numerical and
  // boolean factors that source-link to the same Signal carry distinct
  // information (88% capacity utilization is not "the same row" as
  // the Blocker's verbatim quote). Those always pass through.
  const SIGNAL_TYPE_CHIPS = new Set(["Goal", "Blocker", "Indecision", "Trigger"]);
  const captured = (() => {
    const seenSignalIds = new Set<string>();
    return dots.filter((d) => {
      if (!d.captured) return false;
      const display = capturedRows[d.evidence_ref];
      const sigId = display?.signal_id;
      if (!sigId) return true;
      const rowIsSignalQuoteRow = SIGNAL_TYPE_CHIPS.has(display?.type_chip ?? "");
      if (!rowIsSignalQuoteRow) return true;
      if (seenSignalIds.has(sigId)) return false;
      seenSignalIds.add(sigId);
      return true;
    });
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="objective-popup-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // Sprint 6 Block A — popup becomes flex column with capped
        // viewport height. Header + footer stay fixed; the middle
        // section (CTAs + evidence zone + nested Pattern expand)
        // scrolls within the panel. `max-h-[calc(100vh-8rem)]`
        // matches the outer overlay's `pt-16` (4rem) plus a 4rem
        // safety margin at the bottom so the panel never bleeds off-screen.
        className="flex w-full max-w-2xl max-h-[calc(100vh-8rem)] flex-col rounded border border-blaze-rule bg-white shadow-xl"
      >
        {/* Header zone — fixed; doesn't scroll. */}
        <div className="shrink-0 border-b border-blaze-rule px-6 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="objective-popup-title"
              className="text-base font-semibold text-blaze-charcoal"
            >
              {V2_OBJECTIVE_LABELS[objective].toUpperCase()} ·{" "}
              <span className="font-normal text-blaze-grey-body">
                for {trackName}
              </span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
              aria-label="Close popup"
            >
              × Close
            </button>
          </div>
          <p className="mt-1 text-sm italic leading-snug text-blaze-grey-body">
            {V2_OBJECTIVE_QUESTIONS[objective]}
          </p>
        </div>

        {/* Sprint 6 Block A — scrollable body wraps the CTA top-zone +
            captured/insight evidence zone + nested Pattern expand. The
            "+ Insight bottom-of-popup" affordance and Implications
            footer stay below this container as fixed footer rows. */}
        <div className="flex-1 overflow-y-auto">

        {/* Top zone — CTAs from deriveNextActions. Empty array → not rendered. */}
        {ctas.length > 0 && (
          <div className="border-b border-blaze-rule px-6 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              Next valuable actions
            </p>
            <ul className="space-y-2">
              {ctas.map((cta) => (
                <CTARow key={cta.id} cta={cta} onClick={() => onCtaClick(cta)} />
              ))}
            </ul>
          </div>
        )}

        {/* Bottom zone — captured evidence + Insights.
            Sprint 5b.1 patch — Insights nest under their addressed
            Signal (Treatment A: indented beneath the parent row, sharing
            the row's <li> container with a deeper-indent inner <ul>).
            Track-level Insights (no addresses_signal_id) render as
            separate top-level rows below all captured rows. */}
        {(captured.length > 0 || insights.length > 0) && (
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              {/* Sprint 5d Block F.1 — "ALREADY CAPTURED" → "What we've captured" */}
              What we&rsquo;ve captured
            </p>
            <ul className="space-y-3">
              {captured.map((dot) => {
                const display = capturedRows[dot.evidence_ref] ?? null;
                const factor = factorsById[dot.evidence_ref] ?? null;
                const signalId = display?.signal_id ?? null;
                const signalType = display?.signal_type ?? null;
                const patternBundle = signalId
                  ? patternsBySignalId[signalId] ?? { matched: [], remaining: [] }
                  : { matched: [], remaining: [] };
                // Sprint 5e Block F.A — Insights nest only under
                // Signal-quote rows (rows whose primary content IS the
                // Signal). Numerical/boolean factors that source-link
                // to the same Signal carry the signal_id for traceability
                // but should not duplicate the Insight nest. If the
                // current popup has no Signal-quote row for this
                // Signal (e.g., Measure-phase popup where the Signal's
                // qualitative factor lives in Discover), the Insights
                // surface in their phase-of-origin popup instead of
                // duplicating here.
                const isSignalQuoteRow = SIGNAL_TYPE_CHIPS.has(
                  display?.type_chip ?? "",
                );
                const attachedInsights =
                  signalId && isSignalQuoteRow
                    ? insights.filter((i) => i.addresses_signal_id === signalId)
                    : [];
                return (
                  <CapturedRow
                    key={dot.evidence_ref}
                    dot={dot}
                    display={display}
                    factor={factor}
                    matchedPatterns={patternBundle.matched}
                    remainingPatterns={patternBundle.remaining}
                    attachedInsights={attachedInsights}
                    onAuthorInsightForSignal={onAuthorInsightForSignal}
                    onRefreshFactor={onRefreshFactor}
                    onRefreshSignal={onRefreshSignal}
                    onPreviewArtifact={onPreviewArtifact}
                    signalId={signalId}
                    signalType={signalType}
                  />
                );
              })}
              {/* Track-level Insights (no Signal attachment) render
                  separately at the bottom of the list. */}
              {insights
                .filter((ins) => !ins.addresses_signal_id)
                .map((ins) => (
                  <InsightRow key={ins.id} insight={ins} />
                ))}
            </ul>
          </div>
        )}

        {/* Empty state — no CTAs, no captured, no insights. Spec D
            empty-state allowance. */}
        {ctas.length === 0 && captured.length === 0 && insights.length === 0 && (
          <div className="px-6 py-6">
            <p className="text-sm italic text-blaze-grey-soft">
              No required evidence is defined for this objective under the
              current Track template, and no Insights have been captured yet.
            </p>
          </div>
        )}

        {/* Sprint 6 Block A — close the scrollable body container; the
            sections that follow are fixed footer rows. */}
        </div>

        {/* Sprint 5b.1 patch — affordance surfaces only when CTA zone
            is empty AND evidence list exists. Opens + Insight in Track-
            level mode (no Signal pre-fill). Renamed from "+ deepen"
            per visual review for consistency: one affordance, one name
            ("+ Insight") across all surfaces. */}
        {ctas.length === 0 &&
          (captured.length > 0 || insights.length > 0) && (
            <div className="shrink-0 border-t border-blaze-rule px-6 py-3">
              <button
                type="button"
                onClick={onDeepen}
                className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
              >
                + Insight
              </button>
            </div>
          )}

        {/* Footer — Implications: section (Block F).
            Sprint 5d Block F.1 — "Implications" header copy revised
            for banker-natural voice. */}
        {implications.length > 0 && (
          <div className="shrink-0 border-t border-blaze-rule px-6 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              Questions to bring up with the Member
            </p>
            <ul className="space-y-1">
              {implications.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12px] leading-snug text-blaze-grey-body"
                >
                  <span aria-hidden className="mt-1 text-blaze-grey-soft">
                    •
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Top-zone CTA row ──

function CTARow({ cta, onClick }: { cta: CTA; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 rounded border border-blaze-rule bg-white px-3 py-2 text-left transition-colors hover:bg-blaze-cream/40"
      >
        <span
          aria-hidden
          className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-blaze-grey-soft"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug text-blaze-charcoal">
            {cta.label}
          </span>
          {cta.context && (
            <span className="mt-0.5 block text-[11px] text-blaze-grey-soft">
              {cta.context}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

// ── Bottom-zone captured row (Sprint 5a.3 shape + Block E/F affordances) ──

function CapturedRow({
  dot,
  display,
  factor,
  matchedPatterns,
  remainingPatterns,
  attachedInsights,
  signalId,
  signalType,
  onAuthorInsightForSignal,
  onRefreshFactor,
  onRefreshSignal,
  onPreviewArtifact,
}: {
  dot: ObjectiveDotData;
  display: CapturedRowDisplay | null;
  factor: BusinessFactorLite | null;
  // Sprint 5e v2 Block G — split into matched (signal_tag_scope hits
  // this row's tag set) and remaining (Track-relevant Patterns whose
  // tag doesn't match — gated behind "See all related insights").
  matchedPatterns: PatternDisplay[];
  remainingPatterns: PatternDisplay[];
  // Sprint 5b.1 patch — Insights addressing this row's Signal,
  // rendered nested beneath the row.
  attachedInsights: InsightDisplay[];
  signalId: string | null;
  signalType: "goal" | "blocker" | "indecision" | "trigger" | null;
  onAuthorInsightForSignal: ObjectivePopupProps["onAuthorInsightForSignal"];
  onRefreshFactor: ObjectivePopupProps["onRefreshFactor"];
  onRefreshSignal: ObjectivePopupProps["onRefreshSignal"];
  onPreviewArtifact: ObjectivePopupProps["onPreviewArtifact"];
}) {
  const [bulbOpen, setBulbOpen] = useState(false);
  const [remainingExpanded, setRemainingExpanded] = useState(false);
  const patterns = matchedPatterns;
  const hasRemaining = remainingPatterns.length > 0;
  const showAffordances = !!signalId && !!signalType;
  const isStale = !!display?.captured_at_iso && isOlderThan(display.captured_at_iso, 90);
  const isOpenThread = !!display?.is_open_thread;
  const isFactorRow = dot.evidence_ref.startsWith("FACTOR-");

  if (display) {
    // Sprint 5e Block B — Signal-linked rows whose primary content IS
    // the Signal quote drop the topic-summary label (the quote is the
    // content). For these rows, the type_chip is "Goal"/"Blocker"/
    // "Indecision"/"Trigger" and value_display is the topic name.
    //
    // Sprint 5e Block F.A refines: numerical and boolean factors that
    // source-link to a Signal now keep factor.name as type_chip and
    // the formatted figure as value_display (the Signal quote attaches
    // as supplementary `member_quote`). Those rows must show their
    // value_display — that's the captured figure (88%, true, $2.4M).
    // Only Signal-quote rows hide value_display when a quote exists.
    const SIGNAL_TYPE_CHIPS = new Set([
      "Goal",
      "Blocker",
      "Indecision",
      "Trigger",
    ]);
    const isSignalQuoteRow = SIGNAL_TYPE_CHIPS.has(display.type_chip);
    const hasQuote = !!display.member_quote;
    const showValueDisplay = !(isSignalQuoteRow && hasQuote);
    return (
      <li
        className={`group/captured relative border-l-[3px] pl-3 ${
          isStale ? "border-blaze-danger/40" : "border-blaze-orange/30"
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <Chip variant="default">{display.type_chip}</Chip>
          {showValueDisplay && (
            // Sprint 5e Block G — when the row has an attached Artifact
            // (Model with artifact, Shown event), the value renders as
            // a button that opens the existing ArtifactPreviewDialog.
            // Otherwise it stays plain text.
            display.artifact_preview ? (
              <button
                type="button"
                onClick={() => onPreviewArtifact(display.artifact_preview!)}
                className={`text-sm font-semibold underline-offset-2 hover:underline ${
                  isStale ? "text-blaze-danger" : "text-blaze-orange-deep"
                }`}
              >
                {display.value_display}
                <span aria-hidden className="ml-1 text-[11px]">↗</span>
              </button>
            ) : (
              <span
                className={`text-sm font-semibold ${isStale ? "text-blaze-danger" : "text-blaze-charcoal"}`}
              >
                {display.value_display}
              </span>
            )
          )}
          {isOpenThread && (
            // Sprint 5d Block F.1 — open-thread chip text "open" → "open thread".
            <Chip variant="muted">open thread</Chip>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isStale && isFactorRow && (
              // Sprint 5e Block E.5 — Signal-linked rows refresh via
              // + Ask (re-capture the Member's statement); standalone
              // factor rows refresh via + Quantify with the factor
              // pre-selected.
              <button
                type="button"
                onClick={() => {
                  if (signalType) {
                    onRefreshSignal(signalType);
                  } else {
                    onRefreshFactor(dot.evidence_ref);
                  }
                }}
                className="text-[11px] font-medium text-blaze-danger hover:underline"
              >
                + refresh
              </button>
            )}
            {showAffordances && (patterns.length > 0 || hasRemaining) && (
              // Sprint 5e v2 Block G — lightbulb shows when matched
              // Patterns OR remaining Track Patterns exist. Banker can
              // expand the popover to see all related insights even when
              // no Pattern's signal_tag_scope matches captured tags.
              <button
                type="button"
                onClick={() => setBulbOpen((x) => !x)}
                aria-expanded={bulbOpen}
                className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 transition-opacity hover:opacity-80"
                aria-label="Show Growth insights"
                title="Growth insights"
              >
                {/* Sprint 5b.1 patch — emoji 💡 swapped for the
                    branded lightbulb asset (assets/Insight Lightbulb.png
                    copied to public/insight-lightbulb.png).
                    Source PNG is 1749×2481 (portrait, ratio ~0.705).
                    Height-only sizing preserves aspect ratio; explicit
                    width/height attributes match the natural ratio so
                    Next/Tailwind doesn't squash. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/insight-lightbulb.png"
                  alt=""
                  width={13}
                  height={18}
                  className="block h-[18px] w-auto"
                />
              </button>
            )}
            {showAffordances && (
              <button
                type="button"
                onClick={() =>
                  onAuthorInsightForSignal({
                    signalId: signalId!,
                    signalType: signalType!,
                  })
                }
                className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
              >
                + Insight
              </button>
            )}
          </div>
        </div>
        {display.member_quote && isSignalQuoteRow && (
          // Sprint 5e Block B.1 — quote treatment now matches Insight
          // content treatment: bolder, indented with left rule, generous
          // right whitespace, larger font. Visual parallelism with
          // Insight rows: quotes are what the Member said; Insights are
          // how we're interpreting it.
          //
          // Sprint 5e Block F.A — quote renders only on Signal-quote
          // rows (Goal/Blocker/Indecision/Trigger). Numerical and
          // boolean factors source-linked to the same Signal also
          // carry `member_quote` for traceability, but rendering the
          // quote on every sibling row would create visual repetition.
          // The quote belongs once, on the dedicated Signal row.
          <blockquote
            className={`mt-2 ml-1 mr-8 border-l-[2px] border-blaze-orange/40 py-1 pl-4 text-sm font-semibold leading-relaxed ${
              isStale ? "text-blaze-danger" : "text-blaze-charcoal"
            }`}
          >
            &ldquo;{display.member_quote}&rdquo;
          </blockquote>
        )}
        {/* Sprint 5e Block C — staleness day-count is always visible on
            stale rows (not buried in mouseover); banker needs the "X days
            old" cue without hovering. The captured/by/via metadata moves
            to mouseover (Block A). */}
        {isStale && display.captured_at_iso && (
          <p className="mt-1 text-[11px] font-medium italic text-blaze-danger">
            {dayCountSince(display.captured_at_iso)} days old
          </p>
        )}
        {/* Sprint 5e Block A — capture metadata revealed on row hover only.
            Named group `captured` so hovering the parent CapturedRow doesn't
            also reveal the metadata of nested Insight rows (which use their
            own `insight` named group). */}
        <p className="mt-1 text-[11px] text-blaze-grey-soft opacity-0 transition-opacity duration-150 group-hover/captured:opacity-100">
          captured {display.captured_at_label}
          {display.banker_name && ` · by ${display.banker_name}`}
          {display.captured_via && ` · via ${display.captured_via}`}
        </p>
        {bulbOpen && (patterns.length > 0 || hasRemaining) && (
          // Sprint 5b.1 patch — Growth Insights restyle:
          //   - Renamed from "Canonical Patterns" → "Growth insights"
          //     (banker-facing language; canonical pattern is the code-
          //     internal term)
          //   - Increased spacing between Pattern blocks (space-y-5)
          //   - Pattern content bolded (font-semibold)
          //   - Indented callout treatment with open right whitespace
          //     (no border-rule frame; left-rule mark only)
          //   - "Use as basis for + Insight ↗" link removed entirely
          //     (banker authors via the row's + Insight affordance,
          //     which is contextually pre-filled with the same Signal)
          //
          // Sprint 5e v2 Block G — popover splits into matched (default
          // visible) and remaining (revealed via "See all related
          // insights" expand link). Same visual treatment for both;
          // remaining are separated by a small divider with the label
          // "Other patterns for this lending product".
          <div className="mt-3 ml-1 mr-8 rounded border-l-[2px] border-blaze-orange/40 bg-blaze-cream/40 pl-4 pr-3 py-3">
            {/* Sprint 6 Block B — subtle background fill differentiates
                Pattern reference content from captured evidence above.
                Uses the existing blaze-cream/40 token (very light orange-
                cream) to stay inside the Blaze color system rather than
                introducing a new grey. Container is now a unified
                rounded panel; matched + remaining sections share the
                same fill. */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
              Growth insights
            </p>
            {/* Sprint 5b.2 patch — only the bolded Pattern content is
                constrained to ~2/3 width; implication bullets below run
                full width for visual contrast (bold = anchored callout;
                bullets = full reading flow). */}
            {patterns.length > 0 && (
              <ul className="mt-3 space-y-5">
                {patterns.map((p) => (
                  <li key={p.id}>
                    <PatternEntry pattern={p} />
                  </li>
                ))}
              </ul>
            )}
            {hasRemaining && (
              <div className="mt-4">
                {!remainingExpanded ? (
                  <button
                    type="button"
                    onClick={() => setRemainingExpanded(true)}
                    className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
                  >
                    See all related insights ↓
                  </button>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between border-t border-blaze-rule pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
                        Other patterns for this lending product
                      </p>
                      <button
                        type="button"
                        onClick={() => setRemainingExpanded(false)}
                        className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
                      >
                        collapse ↑
                      </button>
                    </div>
                    <ul className="mt-3 space-y-5">
                      {remainingPatterns.map((p) => (
                        <li key={p.id}>
                          <PatternEntry pattern={p} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {/* Sprint 5b.1 patch — Insights nest beneath their addressed
            Signal. Treatment A: indented <ul> inside the parent row's
            <li>, with deeper left padding (pl-6) to visually convey
            the parent-child relationship. Track-level Insights (no
            addressed Signal) render separately at the list root. */}
        {attachedInsights.length > 0 && (
          <ul className="mt-2 ml-2 space-y-2 border-l-[1px] border-blaze-orange/20 pl-4">
            {attachedInsights.map((ins) => (
              <InsightRow key={ins.id} insight={ins} nested />
            ))}
          </ul>
        )}
      </li>
    );
  }
  // Minimal fallback when no display data (symbolic ref without
  // resolved metadata, or data gaps).
  return (
    <li className="border-l-[3px] border-blaze-orange/30 pl-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <Chip variant="default">{factor?.name ?? dot.label}</Chip>
        <span className="text-sm text-blaze-charcoal">
          {dot.capture
            ? formatCapture(dot.capture, factor)
            : dot.count !== undefined
            ? `${dot.count} captured`
            : "captured"}
        </span>
      </div>
    </li>
  );
}

// ── Insight row ──
//
// Sprint 5b.1 patch — `nested` flag controls Treatment A vs top-level
// rendering. Nested rows drop the redundant "addresses" line (parent
// Signal context is visually obvious from the nesting) and use a
// lighter chrome (no full left-rule mark). Top-level rows (Track-level
// Insights, no Signal attachment) keep the original treatment.

function InsightRow({
  insight,
  nested,
}: {
  insight: InsightDisplay;
  nested?: boolean;
}) {
  return (
    <li
      className={`group/insight ${
        nested ? "pl-0" : "border-l-[3px] border-blaze-orange-deep/40 pl-3"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        {/* Sprint 5e Block B.4 — "novel" suffix dropped from chip; the
            tag moves to the mouseover metadata so the chip stays clean. */}
        <Chip variant={insight.state === "novel" ? "muted" : "default"}>
          {insight.insight_type === "reframe" ? "Reframe" : "Implication"}
        </Chip>
        <span className="text-sm text-blaze-charcoal">{insight.content}</span>
      </div>
      {/* Sprint 5e Block B.3 — Insight.llm_feedback hidden from popup
          display entirely. Banker doesn't see the LLM commentary;
          matched_pattern_id and confidence still operate behind the
          scenes for routing. */}
      {/* Sprint 5e Block A — capture metadata + matched/novel tag
          revealed on row hover only. Named group `insight` so hovering
          the parent CapturedRow (which uses `group/captured`) doesn't
          spill over and reveal nested Insight metadata. */}
      <p className="mt-1 text-[11px] text-blaze-grey-soft opacity-0 transition-opacity duration-150 group-hover/insight:opacity-100">
        captured {insight.authored_at_label}
        {insight.banker_name && ` · by ${insight.banker_name}`} · via + Insight
        {insight.matched_pattern_id && " · matched"}
        {insight.state === "novel" && " · novel"}
      </p>
      {!nested && insight.addresses_signal_summary && (
        <p className="mt-0.5 text-[11px] text-blaze-grey-soft opacity-0 transition-opacity duration-150 group-hover/insight:opacity-100">
          addresses {insight.addresses_signal_summary}
        </p>
      )}
    </li>
  );
}

function formatCapture(
  capture: FactorCaptureLite,
  factor: BusinessFactorLite | null,
): string {
  if (capture.numerical_value !== null) {
    const unit = capture.unit ?? factor?.unit ?? "";
    return unit === "$"
      ? `$${capture.numerical_value.toLocaleString("en-US")}`
      : `${capture.numerical_value}${unit ? ` ${unit}` : ""}`;
  }
  if (capture.boolean_value !== null) {
    return capture.boolean_value ? "Yes" : "No";
  }
  if (capture.qualitative_value !== null) {
    return capture.qualitative_value;
  }
  return "captured";
}

// Sprint 5e v2 Block G — Pattern row rendering shared across the
// matched and remaining sections of the lightbulb popover.
function PatternEntry({ pattern }: { pattern: PatternDisplay }) {
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.04em] text-blaze-grey-soft">
        {pattern.insight_type === "reframe" ? "Reframe" : "Implication"}
      </p>
      <p className="mt-1 max-w-[66%] text-sm font-semibold leading-relaxed text-blaze-charcoal">
        {pattern.content}
      </p>
      {pattern.implication_questions.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] leading-snug text-blaze-grey-body">
          {pattern.implication_questions.slice(0, 3).map((q, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span aria-hidden className="text-blaze-grey-soft">
                •
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Sprint 5b.1 Block G — staleness helpers.
function isOlderThan(iso: string, days: number): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t > days * 24 * 60 * 60 * 1000;
}
function dayCountSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}
