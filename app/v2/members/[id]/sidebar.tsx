/*
 * v2 Workstation Sidebar — Sprint 4.7 Block D / ARCHITECTURE_V2 §6.4.
 *
 * Width: 280px (Sprint 4.7.2.x Block C). Stacked sections:
 *   1. Track context (Sprint 5a.1 → 5a.2 dropdown)
 *   2. Objectives — 4 objective blocks with name + dot row +
 *                  optional "+ next" affordance + optional highlight
 *   3. Artifact slot
 *   4. Macro slot
 *   5. History affordance
 *   6. Coach affordance
 *
 * Sprint 5a.2 changes:
 *   - State lifted to WorkstationShell. Sidebar no longer mounts
 *     ObjectivePopup or TracksSupportedPanel; it dispatches click
 *     events upward via onObjectiveClick / onTracksComparisonOpen /
 *     onSelectTrack / onNextValuableClick.
 *   - Track context becomes interactive TrackContextSwitcher dropdown
 *     listing all rankedTracks; "view comparison" link surfaces the
 *     TracksSupportedPanel (per Francisco's directive — discoverable
 *     alongside the strength chip, not buried in dropdown).
 *   - Objective blocks render captured-only main row + nullable
 *     "+ next" affordance per Block C.
 */

"use client";

import { useState } from "react";
import { ObjectiveDotRow, type DotState } from "@/app/v2/_components/objective-dot";
import {
  V2_OBJECTIVE_LABELS,
  V2_OBJECTIVE_QUESTIONS,
  type V2Objective,
  type CoachBullet,
} from "@/lib/stage-guidance";
import type { CTA, CTAAction } from "@/lib/cta-derivation";
import {
  ArtifactPreviewDialog,
  type ArtifactPreviewSubject,
} from "./artifact-preview-dialog";
import { Chip } from "@/app/_components/chip";

export type ObjectiveBlock = {
  name: string;
  objective: V2Objective;
  dots: Array<{ state: DotState; label: string }>;
  highlight: string | null;
  // Sprint 5b.1 — "+ next" affordance carries the full top CTA from
  // deriveNextActions (3 layers). Null when no CTAs are available for
  // this objective under current Track. The CTA's action descriptor
  // routes through onCtaAction on click.
  nextCta: CTA | null;
  isComplete: boolean;
};

export type SidebarArtifact = {
  id: string;
  title: string;
  description: string | null;
  shown_at_label: string | null;
  // Sprint 5a.3 patch — template identifier so the artifact preview
  // dialog can dispatch to the correct chart renderer (reusing v1
  // components per Patch 3).
  template: string | null;
  // Sprint 8 Block F — Track id this artifact's ArtifactTemplate
  // belongs to (e.g., "TRACK-008"). The workstation shell filters the
  // sidebar artifact list to the current Track context so multi-Track
  // fixtures show only the artifact for the selected Track. Null when
  // the artifact has no template attached.
  track_id?: string | null;
  // Sprint 8 — schema + parameters for ArtifactTemplate-typed artifacts.
  // The preview dialog renders these via ArtifactTemplateRender. Null
  // for legacy chart artifacts (seasonal_smoothing, fleet_roi, etc.).
  template_data?: {
    parameter_schema_json: string | null;
    structural_content_json: string | null;
    output_summary_template: string;
    parameters_json: string | null;
  } | null;
  // Sprint 8 follow-up — Model id underlying this artifact tile. The
  // preview dialog's banker-entered missing-param `+ fill in` editor
  // uses this id to call updateModelParameter.
  model_id?: string | null;
};

export type SidebarMacro = {
  title: string;
  authored_label: string;
};

export type SidebarHistoryEntry = {
  date_label: string;
  meeting_type: string;
};

// Sprint 5a.3 Block C — coach content restructured to per-objective
// bullets. Sidebar renders a section per objective with the objective
// name + V2_OBJECTIVE_QUESTIONS framing + the bullet list. Bullets with
// ctaEvidenceRef render as clickable rows that fire onCtaClick (same
// plumbing as the popup-as-workflow CTAs and the "+ next" affordance).
export type SidebarCoachContent = Record<V2Objective, CoachBullet[]>;

// Sprint 5a.2 Block F — full ranked Track list for the switcher dropdown.
// Sprint 9 Patch E — `applicable` flag drives the dropdown filter. The
// compact view (top 5) hides inapplicable Tracks entirely; the expanded
// "see all N lending products" view shows them with muted styling so
// the banker keeps the full Track set within reach for unusual cases.
export type SidebarTrackOption = {
  track_id: string;
  track_name: string;
  strength: "strong" | "moderate" | "insufficient";
  strong_count: number;
  moderate_count: number;
  negative_count: number;
  applicable: boolean;
};

export function V2Sidebar({
  objectives,
  artifacts,
  macro,
  history,
  totalConversationCount,
  coachContent,
  memberId,
  bankerId,
  rankedTracks,
  selectedTrackId,
  onSelectTrack,
  onTracksComparisonOpen,
  onObjectiveClick,
  onCtaAction,
}: {
  objectives: ObjectiveBlock[];
  artifacts: SidebarArtifact[];
  macro: SidebarMacro | null;
  history: SidebarHistoryEntry[];
  totalConversationCount: number;
  coachContent: SidebarCoachContent;
  memberId: string;
  bankerId: string;
  rankedTracks: SidebarTrackOption[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onTracksComparisonOpen: () => void;
  onObjectiveClick: (obj: V2Objective) => void;
  // Sprint 5b.1 — unified CTA action callback. Fires for: "+ next"
  // affordance (passes top CTA's action), popup CTA clicks, and coach
  // bullet CTAs. The action descriptor determines next surface.
  onCtaAction: (action: CTAAction) => void;
}) {
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [previewArtifact, setPreviewArtifact] =
    useState<ArtifactPreviewSubject | null>(null);

  // Sprint 5a.3 patch — sidebar width 280px (~24% of 6xl) → 1/3
  // (~33%). Main panel's flex-1 absorbs the inverse 2/3. Targets
  // Francisco's 33%/66% split per visual review. Prior comment about
  // sidebar width being "load-bearing" overstated the constraint —
  // sticky-dialpad and header-collapse use vertical CSS variables
  // only; nothing horizontal references the 280px figure.
  return (
    <aside className="w-1/3 shrink-0 border-r border-blaze-rule bg-white">
      <div className="flex flex-col gap-6 p-5">
        {/* Sprint 5a.2 Block F — Track context switcher. Replaces the
            Sprint 5a.1 read-only chip with an interactive dropdown
            listing all candidate Tracks ranked. "view comparison" link
            surfaces the TracksSupportedPanel for richer evidence-strength
            cohort review. */}
        {/* Sprint 5b.1 patch — "track context" → "lending product"
            per visual review. Code-internal Track/TrackTemplate
            unchanged. */}
        <SidebarSection label="lending product">
          <TrackContextSwitcher
            rankedTracks={rankedTracks}
            selectedTrackId={selectedTrackId}
            onSelect={onSelectTrack}
            onComparisonOpen={onTracksComparisonOpen}
          />
        </SidebarSection>

        {/* §6.4.1 — Objectives */}
        <SidebarSection label="objectives">
          <div className="space-y-3">
            {objectives.map((obj) => (
              <ObjectiveBlockComponent
                key={obj.name}
                {...obj}
                onClick={() => onObjectiveClick(obj.objective)}
                onNextClick={() =>
                  obj.nextCta && onCtaAction(obj.nextCta.action)
                }
              />
            ))}
          </div>
        </SidebarSection>

        {/* §6.4.2 — Artifact slot. Sprint 5d Block F — label pluralized. */}
        {artifacts.length > 0 && (
          <SidebarSection label="artifacts">
            <div className="space-y-2">
              {artifacts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() =>
                    setPreviewArtifact({
                      id: a.id,
                      title: a.title,
                      description: a.description,
                      template: a.template,
                      templateData: a.template_data
                        ? {
                            parameterSchemaJson:
                              a.template_data.parameter_schema_json,
                            structuralContentJson:
                              a.template_data.structural_content_json,
                            outputSummaryTemplate:
                              a.template_data.output_summary_template,
                            parametersJson: a.template_data.parameters_json,
                          }
                        : null,
                      modelId: a.model_id ?? null,
                    })
                  }
                  className="block w-full text-left transition-opacity hover:opacity-80"
                >
                  <p className="text-sm font-medium leading-tight text-blaze-charcoal">
                    {a.title}
                  </p>
                  {a.shown_at_label && (
                    <p className="text-[10px] uppercase tracking-[0.04em] text-blaze-grey-body">
                      {a.shown_at_label}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-blaze-orange-deep">
                    view ↗
                  </p>
                </button>
              ))}
            </div>
          </SidebarSection>
        )}

        {/* §6.4.3 — Macro slot. Sprint 5d Block F — banker-facing label
            "MACRO" → "OTHER ARTIFACTS" (Macro is a code-internal noun;
            bankers see them as the same kind of thing as artifacts). */}
        {macro && (
          <SidebarSection label="other artifacts">
            <button
              type="button"
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log("[v2 macro click]", macro);
              }}
              className="block w-full text-left transition-opacity hover:opacity-80"
            >
              <p className="line-clamp-2 text-xs font-medium leading-tight text-blaze-charcoal">
                {macro.title}
              </p>
              <p className="mt-1 text-[10px] text-blaze-grey-body">
                {macro.authored_label}
              </p>
            </button>
          </SidebarSection>
        )}

        {/* §6.4.4 — History affordance. Sprint 5d Block F — "history" →
            "past conversations". */}
        {history.length > 0 && (
          <SidebarSection label="past conversations">
            <ul className="space-y-1 text-[11px] text-blaze-grey-body">
              {history.map((h, i) => (
                <li key={i}>
                  <span className="text-blaze-charcoal">{h.date_label}</span>
                  <span className="ml-1 text-blaze-grey-soft">
                    · {h.meeting_type}
                  </span>
                </li>
              ))}
            </ul>
            {totalConversationCount > history.length && (
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("[v2 history popup]");
                }}
                className="mt-1 text-[11px] font-medium text-blaze-orange-deep hover:underline"
              >
                history ({totalConversationCount}) ↗
              </button>
            )}
          </SidebarSection>
        )}

        {/* §6.4.5 — Coach affordance.
            Sprint 5a.3 Block C — restructured into per-objective sections
            mirroring popup-as-workflow visual discipline: each objective
            gets a header + V2_OBJECTIVE_QUESTIONS framing + bullet list
            of verb-led action items. Bullets with ctaEvidenceRef render
            as clickable rows (reuses Block E plumbing via onCtaClick).
            Always-expanded when opened (no expand-per-objective). */}
        <SidebarSection label="coach">
          <button
            type="button"
            onClick={() => setCoachExpanded((x) => !x)}
            aria-expanded={coachExpanded}
            className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
          >
            {coachExpanded ? "hide coaching" : "show ?"}
          </button>
          {coachExpanded && (
            <div className="mt-4 space-y-5">
              {(["discover", "measure", "consult", "navigate"] as const).map(
                (obj) => (
                  <div key={obj}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
                      {V2_OBJECTIVE_LABELS[obj]}
                    </p>
                    <p className="mt-0.5 text-[11px] italic leading-snug text-blaze-grey-soft">
                      {V2_OBJECTIVE_QUESTIONS[obj]}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {coachContent[obj].map((bullet, i) => (
                        <CoachBulletRow
                          key={i}
                          bullet={bullet}
                          onCtaAction={onCtaAction}
                        />
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          )}
        </SidebarSection>
      </div>

      {previewArtifact && (
        <ArtifactPreviewDialog
          artifact={previewArtifact}
          memberId={memberId}
          bankerId={bankerId}
          conversationId={null}
          onClose={() => setPreviewArtifact(null)}
        />
      )}
    </aside>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-blaze-grey-soft">
        {label}
      </p>
      {children}
    </div>
  );
}

// Sprint 5a.3 patch — full-word tier counts for the Track context
// dropdown. Replaces the prior "5s/1m/2neg" abbreviation. Bankers
// without the legend read the words directly; abbreviations read as
// glitch. Pluralizes correctly ("1 strong" / "2 strong"). Negatives
// surface as "dealbreakers" per Francisco's wording (matches the
// matrix-data tier-vocabulary; "negative" is the schema field name).
function formatTierCounts(t: {
  strong_count: number;
  moderate_count: number;
  negative_count: number;
}): string {
  const parts: string[] = [];
  parts.push(`${t.strong_count} strong`);
  parts.push(`${t.moderate_count} moderate`);
  if (t.negative_count > 0) {
    parts.push(
      `${t.negative_count} dealbreaker${t.negative_count === 1 ? "" : "s"}`,
    );
  }
  return parts.join(", ");
}

// Sprint 5a.2 Block F — interactive Track context dropdown.
// Renders the currently-selected Track's name + strength chip + small
// "view comparison" link. Click the row → expands a compact list of all
// rankedTracks; click a Track → onSelect updates context.
//
// Sprint 5a.3 patch — Track name wraps multi-line (no ellipsis
// truncation; "Commercial Real Estate Term Loan" should fit clean).
// Chip + view-comparison link gain breathing room (vertical stack on
// narrow row; full label words for tier counts in the dropdown).
function TrackContextSwitcher({
  rankedTracks,
  selectedTrackId,
  onSelect,
  onComparisonOpen,
}: {
  rankedTracks: SidebarTrackOption[];
  selectedTrackId: string | null;
  onSelect: (trackId: string) => void;
  onComparisonOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    rankedTracks.find((t) => t.track_id === selectedTrackId) ??
    rankedTracks[0] ??
    null;

  if (!selected) {
    return (
      <p className="text-xs italic text-blaze-grey-soft">
        insufficient evidence yet
      </p>
    );
  }

  // Sprint 8 Block F follow-up — dropdown affordance made unmistakable
  // when more than one Track is available. Single-Track Members still
  // render as plain text (spec §F.4 — no dropdown when there's nothing
  // to switch to).
  const isMultiTrack = rankedTracks.length > 1;
  return (
    <div>
      {isMultiTrack ? (
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex w-full items-start gap-1.5 rounded border border-blaze-rule bg-white px-2.5 py-1.5 text-left transition-colors hover:border-blaze-orange-deep/40 hover:bg-blaze-cream/30"
        >
          <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-blaze-charcoal">
            {selected.track_name}
          </span>
          <span
            aria-hidden
            className={`mt-0.5 shrink-0 text-[11px] text-blaze-orange-deep transition-transform ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
      ) : (
        <p className="text-sm font-medium leading-snug text-blaze-charcoal">
          {selected.track_name}
        </p>
      )}
      <div className="mt-2.5 flex flex-col items-start gap-1.5">
        <Chip
          variant={
            selected.strength === "strong"
              ? "accent"
              : selected.strength === "moderate"
              ? "default"
              : "muted"
          }
        >
          {selected.strength} support
        </Chip>
        <button
          type="button"
          onClick={onComparisonOpen}
          className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
        >
          compare to other lending products ↗
        </button>
      </div>
      {open && (
        <TrackList
          rankedTracks={rankedTracks}
          selected={selected}
          onSelect={(id) => {
            onSelect(id);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Sprint 5c Block F — scales the Track switcher to 10 active Tracks.
// Sprint 9 Patch E — applicability filter. The compact view shows only
// Tracks applicable to the current Member's Member-Type (plus the
// currently-selected Track even if inapplicable, so the banker doesn't
// land in an empty dropdown). The "see all N lending products"
// affordance expands to the full ranked list with inapplicable Tracks
// rendered with muted styling + a small "uncommon for this Member-Type"
// caption — the matrix is guidance, not a hard constraint, and the
// banker keeps the escape hatch for legitimate edge cases.
function TrackList({
  rankedTracks,
  selected,
  onSelect,
}: {
  rankedTracks: SidebarTrackOption[];
  selected: SidebarTrackOption;
  onSelect: (trackId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const TOP_CAP = 5;

  // Compact view: applicable Tracks only, plus the currently-selected
  // Track even if it's flagged inapplicable (graceful edge case).
  const applicableTracks = rankedTracks.filter(
    (t) => t.applicable || t.track_id === selected.track_id,
  );
  const inapplicableTracks = rankedTracks.filter(
    (t) => !t.applicable && t.track_id !== selected.track_id,
  );

  const showFull = showAll || applicableTracks.length <= TOP_CAP;
  const visible = showFull
    ? applicableTracks
    : applicableTracks.slice(0, TOP_CAP);
  const hiddenApplicable = applicableTracks.length - visible.length;
  const hasInapplicable = inapplicableTracks.length > 0;
  return (
    <div className="mt-3 border-t border-blaze-rule pt-3">
      <ul className="space-y-1.5">
        {visible.map((t) => {
          const counts = formatTierCounts(t);
          const isSelected = t.track_id === selected.track_id;
          return (
            <li key={t.track_id}>
              <button
                type="button"
                onClick={() => onSelect(t.track_id)}
                className={`block w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-blaze-cream/40 ${
                  isSelected ? "bg-blaze-cream/40" : ""
                }`}
              >
                <p className="text-xs font-medium leading-snug text-blaze-charcoal">
                  {t.track_name}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-blaze-grey-body">
                  {t.strength} · {counts}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      {showAll && hasInapplicable && (
        <div className="mt-3 border-t border-dashed border-blaze-rule pt-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.06em] text-blaze-grey-soft">
            Uncommon for this Member-Type
          </p>
          <ul className="space-y-1.5">
            {inapplicableTracks.map((t) => {
              const counts = formatTierCounts(t);
              const isSelected = t.track_id === selected.track_id;
              return (
                <li key={t.track_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(t.track_id)}
                    className={`block w-full rounded px-2 py-1.5 text-left opacity-60 transition-colors hover:bg-blaze-cream/30 hover:opacity-100 ${
                      isSelected ? "bg-blaze-cream/40" : ""
                    }`}
                  >
                    <p className="text-xs font-medium leading-snug text-blaze-grey-body">
                      {t.track_name}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-blaze-grey-soft">
                      {t.strength} · {counts}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {(hiddenApplicable > 0 || (!showAll && hasInapplicable)) && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-[11px] font-medium text-blaze-orange-deep hover:underline"
        >
          see all {rankedTracks.length} lending products ↓
        </button>
      )}
      {showAll && (applicableTracks.length > TOP_CAP || hasInapplicable) && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-2 text-[11px] font-medium text-blaze-grey-body hover:underline"
        >
          show top {TOP_CAP} ↑
        </button>
      )}
    </div>
  );
}

// Sprint 5a.3 Block C — coach bullet row. Mirrors popup-as-workflow
// CTARow visual discipline (subtle border, checkbox-style mark, small
// hint) when the bullet has a CTA. Plain bullet (left-rule mark only)
// when no CTA. Bold fragments highlight figures.
// Sprint 5b.1 — coach bullets carry evidence_ref strings; convert to a
// CTAAction so the unified onCtaAction callback can route. FACTOR-NNN
// → quantify w/ preselect; symbolic refs map to known forms.
function coachRefToAction(ref: string): CTAAction | null {
  if (ref.startsWith("FACTOR-")) {
    return {
      type: "open_capture_form",
      form: "quantify",
      preselected_factor_id: ref,
    };
  }
  switch (ref) {
    case "model_produced":
      return { type: "open_capture_form", form: "model" };
    case "reaction_captured":
      return { type: "open_capture_form", form: "reaction" };
    case "specialist_handoff_initiated":
      return { type: "open_capture_form", form: "action" };
    case "decision_maker_mapping":
      return { type: "open_capture_form", form: "ask" };
    default:
      return null;
  }
}

function CoachBulletRow({
  bullet,
  onCtaAction,
}: {
  bullet: CoachBullet;
  onCtaAction: (action: CTAAction) => void;
}) {
  const renderedText = renderBoldFragments(bullet.text, bullet.boldFragments);
  const textClass = `text-[11px] leading-snug ${
    bullet.italic ? "italic text-blaze-grey-soft" : "text-blaze-grey-body"
  }`;

  if (bullet.ctaEvidenceRef) {
    const ref = bullet.ctaEvidenceRef;
    const formHint = formHintForRef(ref);
    const action = coachRefToAction(ref);
    return (
      <li>
        <button
          type="button"
          onClick={() => action && onCtaAction(action)}
          className="flex w-full items-start gap-2 rounded border border-blaze-rule bg-white px-2 py-1.5 text-left transition-colors hover:bg-blaze-cream/40"
          aria-label={`Open capture form: ${bullet.text}`}
        >
          <span
            aria-hidden
            className="mt-[3px] inline-block h-2.5 w-2.5 shrink-0 rounded-sm border border-blaze-grey-soft"
          />
          <span className="min-w-0 flex-1">
            <span className={`block ${textClass}`}>{renderedText}</span>
            {formHint && (
              <span className="mt-0.5 block text-[10px] text-blaze-orange-deep">
                {formHint}
              </span>
            )}
          </span>
        </button>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden
        className="mt-[5px] inline-block h-1 w-1 shrink-0 rounded-full bg-blaze-grey-soft"
      />
      <span className={`min-w-0 flex-1 ${textClass}`}>{renderedText}</span>
    </li>
  );
}

function renderBoldFragments(
  text: string,
  fragments: string[] | undefined,
): React.ReactNode {
  if (!fragments || fragments.length === 0) return text;
  // Build a regex that matches any of the fragments as alternation,
  // longest-first to prevent shorter substrings from claiming a hit
  // inside a longer one.
  const sorted = [...fragments].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((p, i) =>
    fragments.includes(p) ? (
      <strong key={i} className="font-semibold text-blaze-charcoal">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function formHintForRef(ref: string): string | null {
  if (ref.startsWith("FACTOR-")) return "+ Quantify";
  switch (ref) {
    case "model_produced":
      return "+ Model";
    case "reaction_captured":
      return "+ Reaction";
    case "specialist_handoff_initiated":
      return "+ Action";
    case "decision_maker_mapping":
      return "+ Ask";
    case "model_shown":
      return "Record from artifact preview";
    default:
      return null;
  }
}

function ObjectiveBlockComponent({
  name,
  dots,
  highlight,
  nextCta,
  isComplete,
  onClick,
  onNextClick,
}: ObjectiveBlock & { onClick: () => void; onNextClick: () => void }) {
  // Sprint 6 polish — entire block is the click target (name + dot row +
  // highlight line below). Previously only the title button received
  // clicks. Implemented as a div with role="button" so the inner
  // "+ next" affordance can remain a real <button> without nesting
  // interactive elements.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${name} popup`}
      className="block w-full cursor-pointer text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blaze-orange-deep/40 focus-visible:rounded-sm"
    >
      <p className="text-sm font-medium leading-tight text-blaze-charcoal">
        {name}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {/* Sprint 5a.2 Block C — captured-only main row. Empty-row case
            shows nothing; the "+ next" affordance carries the visual
            weight when no evidence is captured yet.
            Sprint 5b.1 — Sprint 5a.3 "complete" replaced with "promising"
            per Block G language polish. */}
        {dots.length > 0 ? (
          <ObjectiveDotRow
            dots={dots.map((d) => ({ state: d.state, ariaLabel: d.label }))}
            ariaLabel={`${name} captured evidence`}
          />
        ) : (
          <span aria-hidden className="h-2 w-2" />
        )}
        {nextCta ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNextClick();
            }}
            className="text-[10px] font-medium text-blaze-orange-deep hover:underline"
            aria-label={`Next action: ${nextCta.label}`}
          >
            + next
          </button>
        ) : isComplete ? (
          <span className="text-[10px] italic text-blaze-grey-soft">
            promising
          </span>
        ) : null}
      </div>
      {highlight && (
        <p className="mt-1 text-[11px] text-blaze-grey-body">{highlight}</p>
      )}
    </div>
  );
}
