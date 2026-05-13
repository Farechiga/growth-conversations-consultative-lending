"use client";

/*
 * v2 Captured Feed (main panel) — Sprint 4.7 Block N.
 *
 * Recent-first feed across six card variants:
 *   Ask · Quantify · Model · Show · Reaction · Resolve
 *
 * Discipline (per ARCHITECTURE_V2 §6.5):
 *   - Member quote in italic with left-rule mark
 *   - Type tag in 12px caption weight
 *   - Magnitude/label in 16px heading weight
 *   - Detail in 14px body weight
 *   - Open-thread captures: coral border accent (1px --blaze-orange-burnt)
 *   - Stale captures (>90 days or superseded): 70% opacity
 *
 * Click expands the card inline (augmenting summary). Edit from the
 * expanded panel is scaffolded as a placeholder; the edit form lives in
 * the dialpad drawer (Turn 2 Block L).
 *
 * Empty state: dashed-border placeholder at bottom — "capture more —
 * activities above" at 50% opacity.
 */

import { useState } from "react";
import { Chip } from "@/app/_components/chip";
import {
  ArtifactTemplateRender,
  type ArtifactCaptureMode,
  type FactorCaptureValue,
} from "./artifact-template-render";
import type { ArtifactPreviewSubject } from "./artifact-preview-dialog";
import {
  parseParameterSchema,
  parseStructuralContent,
  parseTemplateParameters,
} from "@/lib/artifact-template";

const STALE_DAYS = 90;

export type FeedItem =
  | {
      kind: "ask";
      id: string;
      capturedAt: string; // ISO
      signalType: "goal" | "blocker" | "trigger" | "indecision";
      topicLabel: string;
      severity: string | null;
      timeframe: string | null;
      timeHorizon: string | null;
      sourceLabel: string;
      magnitudeDisplay: string | null;
      memberQuote: string | null;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
    }
  | {
      kind: "quantify";
      id: string;
      capturedAt: string;
      dimensionLabel: string;
      magnitudeDisplay: string;
      sourceLabel: string;
      confidenceLabel: string | null;
      timePeriod: string | null;
      methodologyNote: string | null;
      memberQuote: string | null;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
    }
  | {
      kind: "model";
      id: string;
      capturedAt: string;
      modelName: string;
      builtWithMember: boolean;
      parametersSummary: string;
      assumptionsCount: number;
      assumptions: string[];
      outputSummary: string;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
      // Sprint 5d Block A.4 — when the Model was captured against an
      // ArtifactTemplate, the feed card can render the structural
      // content + parameter substitution alongside the output summary.
      // All four fields populated together; null when the Model has
      // no template attached.
      templateTitle: string | null;
      templateDescription: string | null;
      templateParameterSchema: string | null; // JSON-encoded
      templateStructuralContent: string | null; // JSON-encoded
      templateOutputSummaryTemplate: string | null;
      templateParameters: string | null; // JSON-encoded
      // Sprint 8 follow-up — preview payload (when this Model has a
      // template OR a linked legacy Artifact). null when the Model is
      // a banker draft with no renderable artifact.
      artifactPreview: {
        id: string;
        title: string;
        description: string | null;
        template: string | null;
        templateData: {
          parameter_schema_json: string | null;
          structural_content_json: string | null;
          output_summary_template: string;
          parameters_json: string | null;
        } | null;
      } | null;
    }
  | {
      kind: "show";
      id: string;
      capturedAt: string;
      artifactTitle: string;
      // Sprint 6 polish — artifact subject payload so the feed card can
      // open the preview dialog when banker clicks the title.
      artifactId: string;
      artifactDescription: string | null;
      artifactTemplate: string | null;
      modelName: string | null;
      contextNote: string | null;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
    }
  | {
      kind: "reaction";
      id: string;
      capturedAt: string;
      responseValue: string;
      memberQuote: string | null;
      reactionToLabel: string | null;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
    }
  | {
      kind: "resolve";
      id: string;
      capturedAt: string;
      productLabel: string;
      response: string;
      primaryConcernLabel: string | null;
      memberQuote: string | null;
      bankerName: string;
      isStale: boolean;
      isOpenThread: boolean;
      nextActionLabel: string | null;
    };

// Sprint 4.7.1 Block E — primary tag derives from the substantive type
// of the capture, not the activity invocation. Ask captures show signal
// type (Goal / Blocker / Indecision / Trigger). Other captures use a
// natural label per their kind.
function tagFor(item: FeedItem): string {
  switch (item.kind) {
    case "ask":
      return capitalize(item.signalType);
    case "quantify":
      return "Sized";
    case "model":
      return "Model";
    case "show":
      return "Shared with member";
    case "reaction":
      return "Reaction";
    case "resolve":
      return "Resolution";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function V2MainPanel({
  items,
  onPreviewArtifact,
  factorCapturesById,
  onMissingParameterCapture,
  memberId,
}: {
  items: FeedItem[];
  onPreviewArtifact?: (subject: ArtifactPreviewSubject) => void;
  /** Sprint 8 Block D — factor_id → captured value for template auto-fill. */
  factorCapturesById?: Record<string, FactorCaptureValue>;
  /** Sprint 8 Block E — opens dialpad + Quantify with pre-set mode + factor. */
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  /**
   * Sprint 8 follow-up — Member id, used by the template renderer's
   * inline `+ fill in` editor to scope the `updateModelParameter`
   * server call. Optional so callers without context fall through to
   * read-only banker-entered missing rows.
   */
  memberId?: string;
}) {
  return (
    // Sprint 5a.3 patch — captured feed right-aligns to the column
    // edge (matches v1 classic-view behavior). Sprint 4.7.2.x had
    // capped at 720px centered for higher density; visual review
    // surfaced the centering as misaligned with v1's right edge.
    // Cards now fill the available column width; sidebar-280px on
    // the left + main flex-1 on the right means the cards extend
    // to the page's right padding.
    <main className="min-w-0 flex-1 px-8 py-8">
      {items.length === 0 ? (
        <div className="max-w-[440px] py-12">
          <div
            className="rounded border border-dashed border-blaze-rule px-6 py-10 text-center text-sm leading-relaxed text-blaze-grey-body opacity-50"
            aria-label="Captured feed empty state"
          >
            capture more — activities above
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard
              key={`${item.kind}-${item.id}`}
              item={item}
              onPreviewArtifact={onPreviewArtifact}
              factorCapturesById={factorCapturesById}
              onMissingParameterCapture={onMissingParameterCapture}
              memberId={memberId}
            />
          ))}
          <div
            className="mt-8 rounded border border-dashed border-blaze-rule px-6 py-6 text-center text-sm leading-relaxed text-blaze-grey-body opacity-50"
            aria-label="Captured feed nudge"
          >
            capture more — activities above
          </div>
        </div>
      )}
    </main>
  );
}

function FeedCard({
  item,
  onPreviewArtifact,
  factorCapturesById,
  onMissingParameterCapture,
  memberId,
}: {
  item: FeedItem;
  onPreviewArtifact?: (subject: ArtifactPreviewSubject) => void;
  factorCapturesById?: Record<string, FactorCaptureValue>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  memberId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const tag = tagFor(item);
  const borderClass = item.isOpenThread
    ? "border-l-[3px] border-l-blaze-orange-burnt"
    : "border-l-[3px] border-l-blaze-rule";
  const opacityClass = item.isStale ? "opacity-70" : "";
  const tagVariant = item.isOpenThread ? "accent" : "default";

  // Sprint 6 polish — outer expand toggle is now a div-role-button so
  // the "show" headline can host a real <button> (artifact title link)
  // without illegally nesting one <button> inside another.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded((x) => !x);
    }
  }
  return (
    <article
      className={`rounded border border-blaze-rule bg-white ${borderClass} ${opacityClass}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((x) => !x)}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-baseline justify-between gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-blaze-orange-deep/40 focus-visible:rounded-sm"
      >
        <div className="min-w-0 flex-1">
          {/* Sprint 4.7.1 Block E — primary tag in Chip aesthetic. For
              Ask captures the chip shows the signal type (Goal / Blocker
              / Indecision / Trigger); for other kinds it's the natural
              type label. */}
          <div className="flex items-baseline gap-2">
            <Chip variant={tagVariant}>{tag}</Chip>
            <span className="text-[11px] text-blaze-grey-soft">
              {fmtMonthDay(item.capturedAt)}
            </span>
            {item.isStale && (
              <span className="text-[11px] italic text-blaze-grey-soft">
                · stale
              </span>
            )}
          </div>
          <CardHeadline item={item} onPreviewArtifact={onPreviewArtifact} />
        </div>
        <span
          aria-hidden
          className={`text-blaze-grey-body transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </div>
      {expanded && (
        <div className="border-t border-blaze-rule px-4 py-3">
          <CardDetail
            item={item}
            factorCapturesById={factorCapturesById}
            onMissingParameterCapture={onMissingParameterCapture}
            memberId={memberId}
          />
        </div>
      )}
    </article>
  );
}

function CardHeadline({
  item,
  onPreviewArtifact,
}: {
  item: FeedItem;
  onPreviewArtifact?: (subject: ArtifactPreviewSubject) => void;
}) {
  switch (item.kind) {
    case "ask":
      // Block E — signal type is in the chip; headline is the topic.
      return (
        <p className="mt-0.5 text-base font-medium leading-tight text-blaze-charcoal">
          {item.topicLabel}
        </p>
      );
    case "quantify":
      return (
        <p className="mt-0.5 text-base font-semibold leading-tight text-blaze-charcoal">
          {item.magnitudeDisplay}
          <span className="ml-1.5 text-sm font-normal text-blaze-grey-body">
            · {item.dimensionLabel}
          </span>
        </p>
      );
    case "model":
      // Sprint 8 follow-up — Model title is clickable when the Model
      // has a renderable artifact (legacy chart OR Sprint 5d template).
      // stopPropagation prevents the outer card-expand toggle from
      // firing on title click.
      return (
        <p className="mt-0.5 text-base font-medium leading-tight">
          {item.artifactPreview && onPreviewArtifact ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewArtifact({
                  id: item.artifactPreview!.id,
                  title: item.artifactPreview!.title,
                  description: item.artifactPreview!.description,
                  template: item.artifactPreview!.template,
                  templateData: item.artifactPreview!.templateData
                    ? {
                        parameterSchemaJson:
                          item.artifactPreview!.templateData
                            .parameter_schema_json,
                        structuralContentJson:
                          item.artifactPreview!.templateData
                            .structural_content_json,
                        outputSummaryTemplate:
                          item.artifactPreview!.templateData
                            .output_summary_template,
                        parametersJson:
                          item.artifactPreview!.templateData.parameters_json,
                      }
                    : null,
                  modelId: item.id,
                });
              }}
              className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
            >
              {item.modelName}
              <span aria-hidden className="ml-1 text-[11px]">↗</span>
            </button>
          ) : (
            <span className="font-medium text-blaze-charcoal">
              {item.modelName}
            </span>
          )}
          <span className="ml-1.5 text-[11px] text-blaze-grey-body">
            {item.builtWithMember ? "· with Member" : "· banker draft"}
          </span>
        </p>
      );
    case "show":
      // Sprint 6 polish — artifact title is a clickable link that opens
      // the same ArtifactPreviewDialog the sidebar / popup row use.
      // Nested click target inside the card-expand button — stopPropagation
      // prevents the outer expand toggle from firing on title click.
      return (
        <p className="mt-0.5 text-base font-medium leading-tight">
          {onPreviewArtifact ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewArtifact({
                  id: item.artifactId,
                  title: item.artifactTitle,
                  description: item.artifactDescription,
                  template: item.artifactTemplate,
                });
              }}
              className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
            >
              {item.artifactTitle}
              <span aria-hidden className="ml-1 text-[11px]">↗</span>
            </button>
          ) : (
            <span className="font-medium text-blaze-charcoal">
              {item.artifactTitle}
            </span>
          )}
        </p>
      );
    case "reaction":
      return (
        <p className="mt-0.5 text-base font-semibold leading-tight text-blaze-charcoal">
          {item.responseValue.replace(/_/g, " ")}
          {item.reactionToLabel && (
            <span className="ml-1.5 text-sm font-normal text-blaze-grey-body">
              · to {item.reactionToLabel}
            </span>
          )}
        </p>
      );
    case "resolve":
      return (
        <p className="mt-0.5 text-base font-semibold leading-tight text-blaze-charcoal">
          {item.response.replace(/_/g, " ")}
          {item.primaryConcernLabel && (
            <span className="ml-1.5 text-sm font-normal text-blaze-grey-body">
              · {item.primaryConcernLabel}
            </span>
          )}
        </p>
      );
  }
}

function CardDetail({
  item,
  factorCapturesById,
  onMissingParameterCapture,
  memberId,
}: {
  item: FeedItem;
  factorCapturesById?: Record<string, FactorCaptureValue>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  memberId?: string;
}) {
  switch (item.kind) {
    case "ask":
      return (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-blaze-grey-body">
            {item.severity && (
              <>
                Impact:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.severity}
                </strong>
              </>
            )}
            {(item.timeframe || item.timeHorizon) && (
              <>
                {item.severity && <span aria-hidden> · </span>}
                {item.signalType === "trigger" ? "Time horizon" : "Timeframe"}:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.timeHorizon ?? item.timeframe}
                </strong>
              </>
            )}
            <span aria-hidden> · </span>
            Source:{" "}
            <strong className="font-medium text-blaze-charcoal">
              {item.sourceLabel}
            </strong>
            {item.magnitudeDisplay && (
              <>
                <span aria-hidden> · </span>
                Quantified:{" "}
                <strong className="font-semibold text-blaze-charcoal">
                  {item.magnitudeDisplay}
                </strong>
              </>
            )}
          </p>
          {item.memberQuote && <Quote text={item.memberQuote} />}
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
    case "quantify":
      return (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-blaze-grey-body">
            Source:{" "}
            <strong className="font-medium text-blaze-charcoal">
              {item.sourceLabel}
            </strong>
            {item.confidenceLabel && (
              <>
                <span aria-hidden> · </span>
                Confidence:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.confidenceLabel}
                </strong>
              </>
            )}
            {item.timePeriod && (
              <>
                <span aria-hidden> · </span>
                Period:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.timePeriod}
                </strong>
              </>
            )}
          </p>
          {item.memberQuote && <Quote text={item.memberQuote} />}
          {item.methodologyNote && (
            <p className="text-xs text-blaze-grey-body">
              <span className="font-medium text-blaze-charcoal">
                Methodology:
              </span>{" "}
              {item.methodologyNote}
            </p>
          )}
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
    case "model":
      return (
        <div className="space-y-3 text-sm">
          <p className="text-sm text-blaze-charcoal">{item.outputSummary}</p>
          {item.templateTitle && item.templateOutputSummaryTemplate && (
            // Sprint 5d Block A.4 — render attached ArtifactTemplate
            // structural content with parameter substitution.
            // Sprint 8 Blocks D + E — factorCaptures auto-populate
            // source-linked params; missing params surface CTAs.
            <ModelTemplatePreview
              title={item.templateTitle}
              description={item.templateDescription ?? ""}
              parameterSchemaJson={item.templateParameterSchema}
              structuralContentJson={item.templateStructuralContent}
              outputSummaryTemplate={item.templateOutputSummaryTemplate}
              parametersJson={item.templateParameters}
              factorCapturesById={factorCapturesById}
              onMissingParameterCapture={onMissingParameterCapture}
              modelId={item.id}
              memberId={memberId}
            />
          )}
          {item.parametersSummary && (
            <p className="text-xs text-blaze-grey-body">
              <span className="font-medium text-blaze-charcoal">Parameters:</span>{" "}
              {item.parametersSummary}
            </p>
          )}
          {item.assumptions.length > 0 && (
            <div className="text-xs text-blaze-grey-body">
              <span className="font-medium text-blaze-charcoal">Assumptions:</span>
              <ul className="ml-3 mt-1 list-disc">
                {item.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
    case "show":
      return (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-blaze-grey-body">
            {item.modelName && (
              <>
                Linked Model:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.modelName}
                </strong>
              </>
            )}
            {item.contextNote && (
              <>
                {item.modelName && <span aria-hidden> · </span>}
                Context:{" "}
                <strong className="font-medium text-blaze-charcoal">
                  {item.contextNote}
                </strong>
              </>
            )}
          </p>
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
    case "reaction":
      return (
        <div className="space-y-2 text-sm">
          {item.memberQuote && <Quote text={item.memberQuote} />}
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
    case "resolve":
      // Sprint 5b.1 Patch 6 — Resolution row content audit:
      //   KEEP — discussed product + sized value, rendered with "Sized:"
      //          prefix (sourced: Recommendation.product.name +
      //          formatRecommendationSize from Recommendation.size_*)
      //   KEEP — Member quote (sourced: Recommendation.their_words)
      //   KEEP — Capture attribution (sourced: Recommendation banker)
      //   DROP — "Recommendation:" framing entirely (§10.2 banned-
      //          phrase line; the product is discussed, not "recommended")
      //   DROP — "→ next: [paraphrased]" line entirely (the
      //          paraphrased ActionCard rationale wasn't a structured
      //          source; ungrounded narrative)
      // Headline still shows response_value + primary_concern (sourced
      // from Recommendation.response + .primary_concern); see CardHeadline.
      return (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-blaze-grey-body">
            Sized:{" "}
            <strong className="font-medium text-blaze-charcoal">
              {item.productLabel}
            </strong>
          </p>
          {item.memberQuote && <Quote text={item.memberQuote} />}
          <CapturedByLine bankerName={item.bankerName} />
        </div>
      );
  }
}

function Quote({ text }: { text: string }) {
  return (
    <blockquote className="border-l-[3px] border-blaze-orange py-1 pl-3 text-sm italic text-blaze-grey-body">
      &ldquo;{text}&rdquo;
    </blockquote>
  );
}

function CapturedByLine({ bankerName }: { bankerName: string }) {
  return (
    <p className="text-[11px] text-blaze-grey-soft">
      Captured by <span className="text-blaze-charcoal">{bankerName}</span>
    </p>
  );
}

// Sprint 5d Block A.4 — collapsible template preview embedded in the
// Model feed card. Default-collapsed so the feed stays scannable; the
// banker expands to see the rendered structural content.
function ModelTemplatePreview({
  title,
  description,
  parameterSchemaJson,
  structuralContentJson,
  outputSummaryTemplate,
  parametersJson,
  factorCapturesById,
  onMissingParameterCapture,
  modelId,
  memberId,
}: {
  title: string;
  description: string;
  parameterSchemaJson: string | null;
  structuralContentJson: string | null;
  outputSummaryTemplate: string;
  parametersJson: string | null;
  factorCapturesById?: Record<string, FactorCaptureValue>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  modelId?: string | null;
  memberId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const schema = parseParameterSchema(parameterSchemaJson);
  const structuralContent = parseStructuralContent(structuralContentJson);
  const parameterValues = parseTemplateParameters(parametersJson);

  return (
    <div className="rounded border border-blaze-rule bg-blaze-cream/20">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-blaze-cream/40"
      >
        <span className="text-[12px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            Template
          </span>{" "}
          <span className="text-blaze-charcoal">{title}</span>
        </span>
        <span className="text-[11px] text-blaze-orange-deep">
          {open ? "hide ↑" : "show ↓"}
        </span>
      </button>
      {open && (
        <div className="border-t border-blaze-rule px-3 py-3">
          <ArtifactTemplateRender
            title={title}
            description={description}
            schema={schema}
            structuralContent={structuralContent}
            outputSummaryTemplate={outputSummaryTemplate}
            parameterValues={parameterValues}
            factorCapturesById={factorCapturesById}
            onMissingParameterCapture={onMissingParameterCapture}
            modelId={modelId ?? null}
            memberId={memberId ?? null}
          />
        </div>
      )}
    </div>
  );
}

export { STALE_DAYS };
