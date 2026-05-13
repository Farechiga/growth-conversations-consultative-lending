"use client";

/*
 * Artifact preview dialog — Sprint 4.7.2 Block H.
 *
 * Opens when banker clicks an artifact card in the sidebar. Shows the
 * artifact's title + description with an explicit "Record show" button.
 *
 * Click semantics per ARCHITECTURE_V2.md §4 / EVIDENCE_FRAMEWORK.md §4:
 *   - Opening the preview alone does NOT create a ShowEvent. This
 *     preserves the banker-rehearses-quietly use case (banker glances
 *     at an artifact to refresh memory without polluting the audit
 *     trail with fake ShowEvents).
 *   - "Record show" button explicitly creates a ShowEvent linking the
 *     artifact to the current featured Conversation. Button updates
 *     to "Recorded ✓" disabled state for the session.
 *
 * Contrast with Block G's auto-create on + Model save with-Member
 * provenance — that path always creates a ShowEvent (no banker
 * confirmation needed because building with the Member implies showing).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveShowEvent } from "./actions";
// Sprint 5a.3 patch — reuse v1's three artifact renderers so the v2
// preview dialog displays the real chart / schematic, not just a
// placeholder. Components are no-arg client components with the fixture
// data baked in (single-instance-per-fixture for the demo). v2-native
// artifact authoring is full Sprint 5b polish work; this patch unblocks
// the demo by wiring the existing chart code to the v2 surface.
import { SeasonalSmoothingChart } from "@/app/members/[id]/seasonal-smoothing-chart";
import { FleetRoiProjectionChart } from "@/app/members/[id]/fleet-roi-projection-chart";
import { CapitalEventPartnershipMap } from "@/app/members/[id]/capital-event-partnership-map";
import {
  ArtifactTemplateRender,
  type ArtifactCaptureMode,
  type FactorCaptureValue,
} from "./artifact-template-render";
import {
  parseParameterSchema,
  parseStructuralContent,
  parseTemplateParameters,
} from "@/lib/artifact-template";

export type ArtifactPreviewSubject = {
  id: string;
  title: string;
  description?: string | null;
  // Sprint 5a.3 patch — template identifier dispatches the renderer.
  // Known templates: seasonal_smoothing_chart_v1 (Jenny),
  // fleet_roi_composed_chart_v1 (Northland), capital_event_map_v1
  // (Cygnus). Sprint 8 — strings prefixed `ARTIFACT-TEMPLATE-` dispatch
  // to the structured ArtifactTemplateRender; templateData carries the
  // schema + parameters needed for that render.
  template?: string | null;
  // Sprint 8 — populated for Models whose template_id points at an
  // ArtifactTemplate. Lets the preview dialog render structured content
  // with parameter substitution instead of falling through to
  // "Renderer not registered".
  templateData?: {
    parameterSchemaJson: string | null;
    structuralContentJson: string | null;
    outputSummaryTemplate: string;
    parametersJson: string | null;
  } | null;
  // Sprint 8 follow-up — Model id underlying this artifact, used by the
  // template renderer's inline `+ fill in` editor (banker-entered
  // missing required params). Null for legacy chart artifacts.
  modelId?: string | null;
};

export function ArtifactPreviewDialog({
  artifact,
  memberId,
  bankerId,
  conversationId,
  onClose,
  factorCapturesById,
  onMissingParameterCapture,
}: {
  artifact: ArtifactPreviewSubject;
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  onClose: () => void;
  // Sprint 8 Blocks D + E — when present, the dialog's
  // ArtifactTemplateRender auto-populates source-linked params and
  // surfaces missing-param CTAs that route through to the dialpad.
  factorCapturesById?: Record<string, FactorCaptureValue>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
}) {
  const router = useRouter();
  const [recorded, setRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRecord() {
    setError(null);
    startTransition(async () => {
      const result = await saveShowEvent({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        artifact_id: artifact.id,
        model_id: null,
        context_note: "Recorded via sidebar artifact preview",
      });
      if (result.ok) {
        setRecorded(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artifact-preview-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded border border-blaze-rule bg-white p-6 shadow-xl"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="artifact-preview-title"
            className="text-base font-semibold text-blaze-charcoal"
          >
            {artifact.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
            aria-label="Close artifact preview"
          >
            × Close
          </button>
        </div>
        {artifact.description && (
          <p className="mt-3 text-sm leading-relaxed text-blaze-charcoal">
            {artifact.description}
          </p>
        )}

        {/* Sprint 5a.3 patch — renderer dispatch. Reuses v1's chart
            components (no-arg, fixture-baked). Sprint 8 — `ARTIFACT-
            TEMPLATE-` prefix dispatches to ArtifactTemplateRender for
            structured Sprint 5d-style templates. The bordered/bg
            wrapper that used to sit here was a redundant outer frame
            around already-bordered visualization components, and it
            also visually doubled the title (dialog header repeats it).
            Removed; spacing preserved via `mt-5` on a plain div. */}
        <div className="mt-5">
          {/* Sprint 9 — dispatch priority changed. The legacy
              `fleet_roi_composed_chart_v1` (Northland TRACK-007) and
              `capital_event_map_v1` (Cygnus TRACK-008) artifacts are
              REPLACED by the new business-impact visualizations via
              templateData. Only Jenny's TRACK-001 legacy seasonal
              smoothing chart is preserved per Sprint 9 spec §preserved. */}
          {artifact.template === "seasonal_smoothing_chart_v1" &&
          !artifact.templateData ? (
            <SeasonalSmoothingChart />
          ) : artifact.templateData ? (
            <ArtifactTemplateRender
              title={artifact.title}
              description={artifact.description ?? ""}
              schema={parseParameterSchema(
                artifact.templateData.parameterSchemaJson,
              )}
              structuralContent={parseStructuralContent(
                artifact.templateData.structuralContentJson,
              )}
              outputSummaryTemplate={artifact.templateData.outputSummaryTemplate}
              parameterValues={parseTemplateParameters(
                artifact.templateData.parametersJson,
              )}
              factorCapturesById={factorCapturesById}
              onMissingParameterCapture={onMissingParameterCapture}
              modelId={artifact.modelId ?? null}
              memberId={memberId}
            />
          ) : (
            <div className="border border-dashed border-blaze-rule p-6 text-center">
              <p className="text-xs font-semibold text-blaze-grey-body">
                Renderer not registered
              </p>
              {artifact.template && (
                <p className="mt-1 text-xs text-blaze-grey-body">
                  No registered renderer for template{" "}
                  <code className="font-mono text-blaze-charcoal">
                    {artifact.template}
                  </code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sprint 4.7.2.x Block A — button label renamed to match how
            bankers think about the action. "Mark as shared with Member"
            (default) → "Shared ✓" (post-click, disabled). No semantic
            change to ShowEvent creation; rename only. */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRecord}
            disabled={isPending || recorded}
            className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:bg-blaze-grey-soft disabled:opacity-60"
          >
            {recorded
              ? "Shared ✓"
              : isPending
              ? "Marking…"
              : "Mark as shared with Member"}
          </button>
          <span className="text-xs italic text-blaze-grey-soft">
            Records that this artifact was shared with the Member during the
            current conversation. Skip if you&rsquo;re just rehearsing.
          </span>
        </div>
        {error && (
          <p className="mt-3 text-sm text-blaze-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
