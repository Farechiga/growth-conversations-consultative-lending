"use client";

/*
 * v2 Activity Dialpad — Sprint 4.7 Turn 2.
 *
 * Sticky horizontal row of seven pill-shaped buttons. Each button opens
 * a right-drawer with the corresponding capture form. Persistent and
 * always-visible — does NOT change based on objective state.
 *
 * Visual:
 *   text  = --blaze-orange-deep
 *   bg    = --blaze-white
 *   border = 0.5px --blaze-orange-deep
 *   hover = --blaze-orange-pale fill
 *   pressed = --blaze-orange-burnt border
 *
 * Vocabulary (per ARCHITECTURE_V2 §11.7 translation discipline):
 *   "+ Quantify" maps to SizingMeasurement schema entity
 *   "+ Action"   maps to ActionCard schema entity
 *   "+ Ask"      maps to Signal capture (Goal/Blocker/Indecision/Trigger)
 *   "+ Model" / "+ Show" / "+ Reaction" — new v2 entities (Block B)
 *   "+ Resolve"  maps to Recommendation update + execution + maybe ActionCard
 *
 * Turn 2 wires real capture forms; Block I/J/K (new) and L (reused) all
 * surface from this dialpad.
 */

import { useState } from "react";
import {
  AskSection,
  type AskPriorSignal,
  type AskTopic,
} from "@/app/growth-conversations/[memberId]/ask-section";
import {
  type SizeDimensionOption,
  type SizePriorMeasurement,
} from "@/app/growth-conversations/[memberId]/size-section";
import {
  QuantifyForm,
  type QuantifyFactorOption,
} from "./capture-forms/quantify-form";
import { ModelForm, type ModelArtifactOption } from "./capture-forms/model-form";
import {
  ReactionForm,
  type ReactionShowEventOption,
} from "./capture-forms/reaction-form";
import {
  ActionForm,
  type ActionBankerOption,
} from "./capture-forms/action-form";
import {
  InsightForm,
  type InsightTrackOption,
  type InsightSignalOption,
} from "./capture-forms/insight-form";

// Sprint 4.7.2 Block E — dialpad reduced from 7 → 5 activities. Show
// removed (rendering an existing artifact happens via sidebar artifact-
// click → preview → Record show button per Block H, or auto-creates on
// + Model with-Member save per Block G). Resolve removed (Member
// responses captured via + Reaction, which now subsumes response value
// + member quote + primary concern per Block F). v1 ResolveSection
// persists for v1 routes per ARCHITECTURE_V2.md §12.5.
export type DialpadActivity =
  | "ask"
  | "quantify"
  | "model"
  | "reaction"
  | "action"
  | "insight";

type Activity = DialpadActivity;

const ACTIVITIES: Array<{ key: Activity; label: string }> = [
  { key: "ask", label: "+ Ask" },
  { key: "quantify", label: "+ Quantify" },
  { key: "model", label: "+ Model" },
  { key: "reaction", label: "+ Reaction" },
  { key: "action", label: "+ Action" },
  { key: "insight", label: "+ Insight" },
];

// Sprint 5d Block D — drawer titles rewritten for banker-natural voice
// per Section 3 of the content rewrite. Code-internal Activity keys
// unchanged.
const ACTIVITY_TITLES: Record<Activity, string> = {
  ask: "Capture what the Member said",
  quantify: "Capture a number",
  model: "Build a model",
  reaction: "Capture how the Member reacted",
  action: "Capture a follow-up",
  insight: "Capture an insight",
};

export type V2DialpadProps = {
  memberId: string;
  bankerId: string;
  // Ask dropdown / prior captures
  askPriorSignals: AskPriorSignal[];
  askTopicsByType: Record<
    "goal" | "blocker" | "trigger" | "indecision",
    AskTopic[]
  >;
  // Quantify — both modes
  sizingDimensions: SizeDimensionOption[];
  sizePriorMeasurements: SizePriorMeasurement[];
  // Sprint 5a.1 Block F — matrix-aware mode catalog.
  factors: QuantifyFactorOption[];
  // Model — Sprint 5d Block A.3: artifact attachment list now carries
  // ArtifactTemplate metadata so the form can render parameter inputs
  // when a template is selected. Free-form Artifact entries pass
  // template: null and behave like the pre-Sprint-5d attachment.
  artifacts: ModelArtifactOption[];
  // BUILD 2c — Member evidence + recommended product so the +Model
  // builder pre-fills essentials via the shared resolve engine.
  factorCapturesById?: Record<
    string,
    { display_value: string; capture_mode: "member_confirmed" | "banker_estimate" }
  >;
  recommendedProduct?: { amount: string; label: string } | null;
  activeTrackIds?: string[];
  // Reaction — needs ShowEvent list to optionally link the reaction
  // back to which artifact rendering it responds to
  showEvents: ReactionShowEventOption[];
  defaultShowEventId: string | null;
  // Action — needs banker list for owner dropdown
  bankers: ActionBankerOption[];
  // Sprint 5b.1 Block E — Insight needs Track + Signal options for the
  // form's pre-fill logic. Track defaults to current Track context.
  insightTracks: InsightTrackOption[];
  insightDefaultTrackId: string | null;
  insightSignals: InsightSignalOption[];
  // Sprint 5a.2 Block E — controlled drawer state. When set by the
  // WorkstationShell (e.g., a popup CTA chose "+ Quantify with factor X"),
  // the drawer opens to that activity with optional factor pre-selection.
  // When omitted, the dialpad falls back to its uncontrolled (button-
  // click) behavior.
  controlledActivity?: DialpadActivity | null;
  onActivityChange?: (a: DialpadActivity | null) => void;
  preselectedFactorId?: string;
  // Sprint 8 Block E — when the dialpad opens from an artifact's
  // missing-parameter CTA, capture_mode pre-selects to "member_confirmed"
  // (default) or "banker_estimate" (when banker hits the "Banker estimate"
  // button on the missing-param card).
  preselectedCaptureMode?: "member_confirmed" | "banker_estimate";
  // Sprint 5b.1 Block E — when popup-as-workflow's contextual "+ Insight"
  // affordance opens the drawer, these pre-fill the Insight form.
  preselectedSignalId?: string;
  preselectedInsightType?: "reframe" | "implication";
};

export function V2Dialpad(props: V2DialpadProps) {
  const isControlled = props.controlledActivity !== undefined;
  const [internalDrawer, setInternalDrawer] = useState<Activity | null>(null);
  const openDrawer = isControlled
    ? (props.controlledActivity ?? null)
    : internalDrawer;

  function setOpenDrawer(a: Activity | null) {
    if (isControlled) {
      props.onActivityChange?.(a);
    } else {
      setInternalDrawer(a);
    }
  }

  function handleClose() {
    setOpenDrawer(null);
  }

  return (
    <>
      {/* Sprint 4.7.1 Block G — sticky dialpad. Sticks below the
          collapsing header by reading --v2-header-h CSS variable from
          the <header> sticky element. The header's collapsed state
          flips that variable from 104px → 44px; the dialpad's top
          offset transitions in lockstep. */}
      <div
        className="sticky z-30 border-b border-blaze-rule bg-white transition-[top] duration-150 ease-out"
        style={{ top: "var(--v2-header-h, 88px)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-8 py-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setOpenDrawer(a.key)}
              className="rounded-full border-[0.5px] border-blaze-orange-deep bg-white px-3 py-1 text-xs font-medium text-blaze-orange-deep transition-colors hover:bg-blaze-orange-pale active:border-blaze-orange-burnt"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {openDrawer && (
        // Sprint 6 polish — drawer pinned explicitly to viewport right
        // edge via `inset-y-0 right-0` on the panel. Prior layout used a
        // flex backdrop pushing the panel right, which resolved against
        // any transformed/contained ancestor and could land the panel
        // off-screen requiring horizontal scroll. The new layout puts
        // the backdrop and the panel as absolute siblings inside a
        // viewport-locked fixed container.
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ACTIVITY_TITLES[openDrawer]}
          className="fixed inset-0 z-50"
          onClick={handleClose}
        >
          <div aria-hidden className="absolute inset-0 bg-black/20" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l border-blaze-rule bg-white shadow-xl"
          >
            <div className="flex items-baseline justify-between border-b border-blaze-rule px-6 py-4">
              <h2 className="text-base font-semibold text-blaze-charcoal">
                {ACTIVITY_TITLES[openDrawer]}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
                aria-label="Close drawer"
              >
                × Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {openDrawer === "ask" && (
                <AskSection
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  conversationId={null}
                  priorSignals={props.askPriorSignals}
                  topicsByType={props.askTopicsByType}
                  onSaveSuccess={handleClose}
                />
              )}
              {openDrawer === "quantify" && (
                // Sprint 5d Block H.1 — key forces a fresh QuantifyForm
                // mount whenever the preselect changes (e.g., banker
                // closes the drawer, opens it again via + refresh on a
                // different stale row). Belt-and-suspenders against
                // any stale internal state in MatrixAwareCapture.
                <QuantifyForm
                  key={`quantify-${props.preselectedFactorId ?? "none"}-${props.preselectedCaptureMode ?? "default"}`}
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  conversationId={null}
                  factors={props.factors}
                  sizingDimensions={props.sizingDimensions}
                  sizePriorMeasurements={props.sizePriorMeasurements}
                  preselectedFactorId={props.preselectedFactorId}
                  preselectedCaptureMode={props.preselectedCaptureMode}
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
              {openDrawer === "model" && (
                <ModelForm
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  conversationId={null}
                  artifacts={props.artifacts}
                  factorCapturesById={props.factorCapturesById}
                  recommendedProduct={props.recommendedProduct}
                  activeTrackIds={props.activeTrackIds}
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
              {openDrawer === "reaction" && (
                <ReactionForm
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  conversationId={null}
                  showEvents={props.showEvents}
                  defaultShowEventId={props.defaultShowEventId}
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
              {openDrawer === "action" && (
                <ActionForm
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  conversationId={null}
                  bankers={props.bankers}
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
              {openDrawer === "insight" && (
                <InsightForm
                  memberId={props.memberId}
                  bankerId={props.bankerId}
                  tracks={props.insightTracks}
                  defaultTrackId={props.insightDefaultTrackId}
                  signals={props.insightSignals}
                  preselectedSignalId={props.preselectedSignalId}
                  preselectedInsightType={props.preselectedInsightType}
                  onSuccess={handleClose}
                  onCancel={handleClose}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
