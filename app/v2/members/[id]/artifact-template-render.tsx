"use client";

/*
 * Sprint 5d Block A.4 — ArtifactTemplate rendering with parameter
 * substitution.
 * Sprint 8 Blocks D + E + H — renderer pulls values from FactorCaptures
 * via `source_factor_id`; missing source-linked parameters render as
 * "missing-parameter CTA" cards with Capture-with-Member vs Banker-
 * estimate buttons; banker_estimate values render with a visual flag.
 * Sprint 8 follow-up — banker-entered missing required parameters get
 * their own "Fill in" CTA with inline save (no factor capture needed —
 * the value writes directly to the Model's parameters JSON via the
 * `updateModelParameter` server action).
 *
 * Renders a captured Model whose template_id is set against the
 * template's structural_content + output_summary_template. Dispatches
 * by structural_content.type:
 *   - financing_summary / cashflow_projection / roi_projection / use_plan
 *     → labeled section list with field/value rows
 *   - roadmap → numbered stage list with you-are-here marker (SBA 504)
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  computeAllValues,
  resolveTemplateString,
  type ParameterSchema,
  type StructuralContent,
  type StructuralRoadmapStage,
  type StructuralSection,
  type TemplateParameter,
} from "@/lib/artifact-template";
import { updateModelParameter } from "./actions";
// Sprint 9 — per-Track business-impact visualizations. Each Track's
// structural_content.type dispatches to a dedicated component that
// renders the before/after narrative instead of the prior generic
// section-list summary. Parameter schema + source_factor_id linkage
// from Sprint 8 carries through unchanged.
import { LeaseVsOwnChart } from "./artifact-visualizations/LeaseVsOwnChart";
import { GrowthTrajectoryChart } from "./artifact-visualizations/GrowthTrajectoryChart";
import { CashflowEquityDualChart } from "./artifact-visualizations/CashflowEquityDualChart";
import { CostOfDoingNothingChart } from "./artifact-visualizations/CostOfDoingNothingChart";
import { Sba504StructureComparison } from "./artifact-visualizations/Sba504StructureComparison";
import { VehicleCapacityUpliftChart } from "./artifact-visualizations/VehicleCapacityUpliftChart";
import { BusinessVisaCapabilityMatrix } from "./artifact-visualizations/BusinessVisaCapabilityMatrix";
import { PaceMonthlySavingsChart } from "./artifact-visualizations/PaceMonthlySavingsChart";
import { CashbackOpportunityChart } from "./artifact-visualizations/CashbackOpportunityChart";
import { UnsecuredOpportunityChart } from "./artifact-visualizations/UnsecuredOpportunityChart";
// BUILD 2e (Part B) — single currency convention shared with the charts.
import { fmtUSD } from "./artifact-visualizations/shared";

export type FactorCaptureValue = {
  display_value: string;
  capture_mode: "member_confirmed" | "banker_estimate";
};

export type ArtifactCaptureMode = "member_confirmed" | "banker_estimate";

export type ArtifactTemplateRenderProps = {
  title: string;
  description: string;
  schema: ParameterSchema | null;
  structuralContent: StructuralContent | null;
  outputSummaryTemplate: string;
  parameterValues: Record<string, string>;
  /**
   * Optional override for the "you are here" label on roadmap-typed
   * templates. Defaults to "You are here" when absent. SBA 504 fixture
   * passes the Member's display name (e.g., "Cygnus is here").
   */
  youAreHereLabel?: string;
  /**
   * Sprint 8 Block D — map of factor_id → captured value + capture_mode
   * for the Member. The renderer prefers FactorCapture values over
   * banker-entered `parameterValues` when a parameter has
   * `source_factor_id`. Capture mode flows through to the visual
   * treatment (Block H "banker estimate" flag).
   */
  factorCapturesById?: Record<string, FactorCaptureValue>;
  /**
   * Sprint 8 Block E — callback fired when banker clicks a missing-
   * parameter CTA. The artifact area shows the CTA card when a
   * source-linked parameter has no FactorCapture; clicking opens
   * + Quantify with the factor pre-selected and capture_mode pre-set.
   * If omitted, missing-parameter rows fall back to "—" placeholder.
   */
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  /**
   * Sprint 8 follow-up — when set, banker-entered required parameters
   * that are missing surface a "Fill in" affordance with an inline
   * input. Save writes back to the Model's parameters JSON via
   * `updateModelParameter`. Without modelId/memberId, banker-entered
   * missing params render as a plain "—" placeholder (no CTA, no
   * dead-end fallback).
   */
  modelId?: string | null;
  memberId?: string | null;
};

export function ArtifactTemplateRender({
  title,
  description,
  schema,
  structuralContent,
  outputSummaryTemplate,
  parameterValues,
  youAreHereLabel,
  factorCapturesById,
  onMissingParameterCapture,
  modelId,
  memberId,
}: ArtifactTemplateRenderProps) {
  // Sprint 8 Block D — overlay parameter values with FactorCapture
  // values for source-linked parameters. Parameter remains undefined
  // (missing-state) when source_factor_id is set but no capture exists.
  const captures = factorCapturesById ?? {};
  // BUILD 2b — reserved control keys ride inside template_parameters:
  //   __confirmed            persisted array of keys a banker has upgraded
  //                          to member_confirmed via "Capture with Member"
  //   __recommended_product  read-time hint (injected in page.tsx, gated to
  //                          the member's primary recommended model) used
  //                          for the tier-2 "from product" provenance tag
  // Strip both before anything reaches the chart / output summary.
  const persistedConfirmed = parseConfirmedKeys(parameterValues["__confirmed"]);
  const recommendedProduct = parseRecommendedProduct(
    parameterValues["__recommended_product"],
  );
  const cleanValues: Record<string, string> = {};
  for (const [k, v] of Object.entries(parameterValues)) {
    if (!k.startsWith("__")) cleanValues[k] = v;
  }

  // BUILD 2d — optimistic confirmations. The popup's parametersJson is a
  // frozen snapshot from when the dialog opened, so a banker confirming an
  // estimate wouldn't progress THIS open dialog without reopening. Track
  // just-confirmed essentials locally (value + member_confirmed) so the
  // gate advances and the outcome reveals live; updateModelParameter still
  // persists the change so it survives reload.
  const [localConfirmed, setLocalConfirmed] = useState<Record<string, string>>(
    {},
  );
  const confirmedKeys = new Set<string>([
    ...persistedConfirmed,
    ...Object.keys(localConfirmed),
  ]);
  const baseValues = { ...cleanValues, ...localConfirmed };

  const { resolvedValues, captureModeByKey, missingByKey } = overlayCaptures(
    schema,
    baseValues,
    captures,
  );

  // BUILD 2e (A3) — render the SBA 504 stage as its NAME, not a bare index.
  // Inject `stage_name` so the output summary's {stage_name} resolves, and
  // build a display override so the essentials panel shows e.g.
  // "CDC partner introduction (stage 3 of 8)" instead of "3".
  const stageDisplayOverrides: Record<string, string> = {};
  const stageList =
    structuralContent && "stages" in structuralContent
      ? (structuralContent as { stages?: Array<{ title: string }> }).stages
      : undefined;
  if (stageList && stageList.length && resolvedValues.current_stage) {
    const stageTitle = stageList[Number(resolvedValues.current_stage) - 1]?.title;
    if (stageTitle) {
      resolvedValues.stage_name = stageTitle;
      stageDisplayOverrides.current_stage = `${stageTitle} (stage ${resolvedValues.current_stage} of ${stageList.length})`;
    }
  }

  const computedValues = computeAllValues(schema, resolvedValues);
  const resolvedSummary = resolveTemplateString(
    outputSummaryTemplate,
    schema,
    resolvedValues,
  );

  const canEditBankerParams = Boolean(modelId && memberId);
  // BUILD 2b — resolve each ESSENTIAL value (the §1 genuinely-needed set =
  // required, non-computed, non-static params after 2a's trim) in
  // precedence order: captured evidence → product → existing literal
  // (banker estimate) → prompt. The panel renders ONLY this essential set
  // with a provenance tag per value and prompts only the residual gaps.
  const essentials = resolveEssentials({
    schema,
    resolvedValues,
    captureModeByKey,
    confirmedKeys,
    recommendedProduct,
  });

  // Title + description intentionally omitted here — the parent dialog
  // (artifact-preview-dialog.tsx) already renders both in its header.
  // Rendering them again created a visibly doubled heading inside an
  // otherwise redundant bounding box. Reference: parameters retained
  // (title, description) so callers don't need to change; consumed by
  // anyone who needs them at the structural-visualization layer.
  void title;
  void description;

  // BUILD 2d — gate the outcome behind SUPPLIED essentials. An essential
  // is supplied when its value is real evidence, not an unconfirmed
  // banker guess: tier "captured" (a source FactorCapture OR a value the
  // banker confirmed via __confirmed) or tier "product" (the recommended
  // amount). A banker-estimate literal or a blank does NOT count until the
  // banker confirms it (which flips it to member_confirmed → captured).
  const suppliedCount = essentials.filter(
    (e) => e.tier === "captured" || e.tier === "product",
  ).length;
  const allSupplied =
    essentials.length === 0 || suppliedCount === essentials.length;

  return (
    <div className="space-y-4">
      {essentials.length > 0 && (
        <EssentialsPanel
          essentials={essentials}
          gated={!allSupplied}
          suppliedCount={suppliedCount}
          onConfirmed={(key, value) =>
            setLocalConfirmed((prev) => ({ ...prev, [key]: value }))
          }
          displayOverrides={stageDisplayOverrides}
          onMissingParameterCapture={onMissingParameterCapture}
          modelId={canEditBankerParams ? modelId ?? null : null}
          memberId={canEditBankerParams ? memberId ?? null : null}
        />
      )}

      {/* BUILD 2d — the outcome (chart + decision framing + "what the model
          shows") renders only once EVERY essential is supplied. Until then
          the EssentialsPanel above stands alone, prompting the banker to
          supply each number with the Member ("supply the numbers to
          generate the model"). Reusing the 2b render path means the same
          gate applies to the sidebar preview dialog. */}
      {allSupplied && (
        <>
          {structuralContent && renderStructuralVisualization({
            structuralContent,
            schema,
            parameterValues: computedValues,
            computedValues,
            captureModeByKey,
            missingByKey,
            onMissingParameterCapture,
            modelId: canEditBankerParams ? modelId ?? null : null,
            memberId: canEditBankerParams ? memberId ?? null : null,
            youAreHereLabel,
          })}

          <div className="rounded border-l-[3px] border-blaze-orange bg-blaze-cream/30 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
              What the model shows
            </p>
            <p className="mt-1 text-sm leading-relaxed text-blaze-charcoal">
              {resolvedSummary}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Sprint 9 Block A — central dispatch from structural_content.type to
// the per-Track visualization component. Returns null for unknown
// types; the renderer falls through to nothing (template stays
// banker-readable via the output summary below).
function renderStructuralVisualization(args: {
  structuralContent: StructuralContent;
  schema: ParameterSchema | null;
  parameterValues: Record<string, string>;
  computedValues: Record<string, string>;
  captureModeByKey: Record<string, "member_confirmed" | "banker_estimate">;
  missingByKey: Record<string, true>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  modelId: string | null;
  memberId: string | null;
  youAreHereLabel?: string;
}): React.ReactNode {
  const {
    structuralContent,
    schema,
    parameterValues,
    computedValues,
    captureModeByKey,
    missingByKey,
    onMissingParameterCapture,
    modelId,
    memberId,
    youAreHereLabel,
  } = args;
  const t = structuralContent.type;

  // Legacy section-list types (Sprint 5d) — preserved for templates
  // that haven't yet been migrated to a Sprint 9 visualization.
  if (
    t === "financing_summary" ||
    t === "cashflow_projection" ||
    t === "roi_projection" ||
    t === "use_plan"
  ) {
    return (
      <SectionListRender
        sections={structuralContent.sections}
        schema={schema}
        values={computedValues}
        captureModeByKey={captureModeByKey}
        missingByKey={missingByKey}
        onMissingCapture={onMissingParameterCapture}
        modelId={modelId}
        memberId={memberId}
      />
    );
  }

  // Existing SBA 504 partnership-map roadmap.
  if (t === "roadmap") {
    return (
      <RoadmapRender
        stages={structuralContent.stages}
        currentStage={Number(parameterValues.current_stage ?? 0)}
        youAreHereLabel={
          youAreHereLabel ?? parameterValues.you_are_here_label ?? "You are here"
        }
      />
    );
  }

  // Sprint 9 paired roadmap + new structure-comparison chart.
  if (t === "sba_504_paired") {
    return (
      <div className="space-y-4">
        <RoadmapRender
          stages={structuralContent.stages}
          currentStage={Number(parameterValues.current_stage ?? 0)}
          youAreHereLabel={
            youAreHereLabel ??
            parameterValues.you_are_here_label ??
            "You are here"
          }
        />
        <Sba504StructureComparison parameterValues={parameterValues} />
      </div>
    );
  }

  // Sprint 9 per-Track business-impact visualizations.
  if (t === "lease_vs_own") {
    return <LeaseVsOwnChart parameterValues={parameterValues} />;
  }
  if (t === "growth_trajectory") {
    return <GrowthTrajectoryChart parameterValues={parameterValues} />;
  }
  if (t === "cashflow_equity_dual") {
    return <CashflowEquityDualChart parameterValues={parameterValues} />;
  }
  if (t === "cost_of_doing_nothing") {
    return <CostOfDoingNothingChart parameterValues={parameterValues} />;
  }
  if (t === "pace_monthly_savings") {
    return <PaceMonthlySavingsChart parameterValues={parameterValues} />;
  }
  if (t === "cashback_opportunity") {
    return <CashbackOpportunityChart parameterValues={parameterValues} />;
  }
  if (t === "unsecured_opportunity") {
    return <UnsecuredOpportunityChart parameterValues={parameterValues} />;
  }
  // Sprint 9 Patch F Block 2 — Business Vehicle Loan capacity-uplift
  // visualization. Replaces the legacy section-list financing summary
  // (which still uses the `financing_summary` dispatch above for any
  // other templates that haven't been migrated to a visualization).
  if (t === "vehicle_capacity_uplift") {
    return <VehicleCapacityUpliftChart parameterValues={parameterValues} />;
  }
  // Sprint 9 Patch G Block 7 — Business Visa capability matrix
  // replaces the cashback-opportunity chart for TRACK-010.
  if (t === "business_visa_capability") {
    return <BusinessVisaCapabilityMatrix parameterValues={parameterValues} />;
  }

  return null;
}

// ============================================================
// BUILD 2b — resolve-then-prompt engine + provenance panel
// ============================================================

// Product-amount keys eligible for tier-2 "from product" resolution
// (Recommendation.size_proposed). The hint is gated upstream (page.tsx)
// to the member's PRIMARY recommended model, so a secondary model's
// loan_amount never claims an unrelated product's number (Q-055).
const PRODUCT_AMOUNT_KEYS = new Set([
  "loan_amount",
  "proposed_limit",
  "requested_credit_limit",
]);

export type EssentialTier = "captured" | "product" | "estimate" | "prompt";

export type EssentialResolution = {
  param: TemplateParameter;
  tier: EssentialTier;
  value: string;
  mode?: "member_confirmed" | "banker_estimate";
  productLabel?: string;
};

function parseConfirmedKeys(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function parseRecommendedProduct(
  raw: string | undefined,
): { amount: string; label: string } | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (o && typeof o.amount === "string" && typeof o.label === "string") {
      return { amount: o.amount, label: o.label };
    }
  } catch {
    // ignore malformed hint
  }
  return null;
}

function numbersClose(a: string, b: string): boolean {
  const na = Number(String(a).replace(/[$,%\s]/g, ""));
  const nb = Number(String(b).replace(/[$,%\s]/g, ""));
  if (!Number.isFinite(na) || !Number.isFinite(nb) || nb === 0) return false;
  return Math.abs(na - nb) / Math.abs(nb) < 0.001;
}

// Overlay FactorCapture values onto banker-entered/base values for
// source-linked params (Sprint 8 Block D). Shared by the render popup
// (BUILD 2b) and the +Model builder (BUILD 2c) so both resolve evidence
// identically. A param stays "missing" when its source_factor_id has no
// capture and no base value.
export function overlayCaptures(
  schema: ParameterSchema | null,
  baseValues: Record<string, string>,
  capturesByFactorId: Record<string, FactorCaptureValue>,
): {
  resolvedValues: Record<string, string>;
  captureModeByKey: Record<string, "member_confirmed" | "banker_estimate">;
  missingByKey: Record<string, true>;
} {
  const resolvedValues: Record<string, string> = { ...baseValues };
  const captureModeByKey: Record<
    string,
    "member_confirmed" | "banker_estimate"
  > = {};
  const missingByKey: Record<string, true> = {};
  if (schema) {
    for (const p of schema.parameters) {
      if (!p.source_factor_id) continue;
      const cap = capturesByFactorId[p.source_factor_id];
      if (cap) {
        resolvedValues[p.key] = cap.display_value;
        captureModeByKey[p.key] = cap.capture_mode;
      } else if (!resolvedValues[p.key] || resolvedValues[p.key] === "") {
        missingByKey[p.key] = true;
      }
    }
  }
  return { resolvedValues, captureModeByKey, missingByKey };
}

// Resolve each essential (required, non-computed, non-static) value in
// precedence order. Guards (Q-054/056) are structural: current_monthly_revenue
// and annual_operational_spend carry no source_factor_id (2a), so tier-1
// never fires for them — they fall to the literal/estimate tier.
export function resolveEssentials(args: {
  schema: ParameterSchema | null;
  resolvedValues: Record<string, string>;
  captureModeByKey: Record<string, "member_confirmed" | "banker_estimate">;
  confirmedKeys: Set<string>;
  recommendedProduct: { amount: string; label: string } | null;
}): EssentialResolution[] {
  const {
    schema,
    resolvedValues,
    captureModeByKey,
    confirmedKeys,
    recommendedProduct,
  } = args;
  if (!schema) return [];
  const out: EssentialResolution[] = [];
  for (const p of schema.parameters) {
    if (p.required !== true || p.computed || p.type === "static_text") continue;
    const value = resolvedValues[p.key] ?? "";
    const has = value !== "";
    // 1. captured evidence — banker-upgraded (member_confirmed) or a
    //    source FactorCapture overlaid this param.
    if (has && confirmedKeys.has(p.key)) {
      out.push({ param: p, tier: "captured", value, mode: "member_confirmed" });
      continue;
    }
    if (has && captureModeByKey[p.key]) {
      out.push({ param: p, tier: "captured", value, mode: captureModeByKey[p.key] });
      continue;
    }
    // 2. product — recommended amount (gated to primary model), only when
    //    the literal matches it (honest tag, no value override).
    if (
      has &&
      PRODUCT_AMOUNT_KEYS.has(p.key) &&
      recommendedProduct &&
      numbersClose(value, recommendedProduct.amount)
    ) {
      out.push({ param: p, tier: "product", value, productLabel: recommendedProduct.label });
      continue;
    }
    // 3. existing template_parameter literal → banker estimate.
    if (has) {
      out.push({ param: p, tier: "estimate", value, mode: "banker_estimate" });
      continue;
    }
    // 4. nothing resolves → prompt the residual gap.
    out.push({ param: p, tier: "prompt", value: "" });
  }
  return out;
}

export function ProvenanceChip({ res }: { res: EssentialResolution }) {
  if (res.tier === "captured" && res.mode === "member_confirmed") {
    return (
      <span className="rounded-sm bg-blaze-orange/10 px-1.5 py-0.5 text-[10px] font-semibold text-blaze-orange-deep">
        captured ✓ · from the Member
      </span>
    );
  }
  if (res.tier === "captured") {
    return (
      <span className="rounded-sm bg-blaze-cream px-1.5 py-0.5 text-[10px] font-medium text-blaze-grey-body">
        banker estimate · pending confirmation
      </span>
    );
  }
  if (res.tier === "product") {
    return (
      <span className="rounded-sm bg-blaze-cream px-1.5 py-0.5 text-[10px] font-medium text-blaze-charcoal">
        from product · {res.productLabel}
      </span>
    );
  }
  if (res.tier === "estimate") {
    return (
      <span className="rounded-sm bg-blaze-cream px-1.5 py-0.5 text-[10px] font-medium text-blaze-grey-body">
        banker estimate · confirm with Member
      </span>
    );
  }
  return (
    <span className="rounded-sm bg-blaze-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-blaze-danger">
      needs capture
    </span>
  );
}

// The single provenance surface for the model popup: renders ONLY the
// essential set, each value tagged with how it resolved, prompting only
// the tier-4 residual gaps. Replaces the prior missing-only banner.
function EssentialsPanel({
  essentials,
  gated,
  suppliedCount,
  onConfirmed,
  displayOverrides,
  onMissingParameterCapture,
  modelId,
  memberId,
}: {
  essentials: EssentialResolution[];
  // BUILD 2d — when gated, the outcome is hidden and this panel is the
  // primary surface: it leads with a "supply the numbers" header + a
  // "{supplied} of {total} supplied" progress hint.
  gated: boolean;
  suppliedCount: number;
  // BUILD 2d — fired after a confirm persists, so the parent can advance
  // the gate optimistically (live reveal without reopening).
  onConfirmed: (key: string, value: string) => void;
  // BUILD 2e (A3) — per-key value-display override (e.g. SBA 504 stage
  // rendered as its name instead of a bare index).
  displayOverrides?: Record<string, string>;
  onMissingParameterCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  modelId: string | null;
  memberId: string | null;
}) {
  const promptCount = essentials.filter((e) => e.tier === "prompt").length;
  return (
    <div
      className={
        gated
          ? "rounded border border-blaze-orange-deep/40 bg-blaze-cream/40 p-3"
          : "rounded border border-blaze-rule bg-blaze-cream/30 p-3"
      }
    >
      {gated ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-xs font-semibold text-blaze-orange-deep">
            Supply these numbers with the Member to generate the model
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
            {suppliedCount} of {essentials.length} supplied
          </p>
        </div>
      ) : (
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
          Evidence &amp; assumptions behind these numbers
          {promptCount > 0 && (
            <span className="ml-1.5 font-medium text-blaze-danger">
              · {promptCount} still to capture
            </span>
          )}
        </p>
      )}
      <ul className="mt-2 space-y-2">
        {essentials.map((res) => (
          <li
            key={res.param.key}
            className="rounded border border-blaze-rule bg-white px-3 py-2"
          >
            {res.tier === "prompt" ? (
              res.param.source_factor_id ? (
                <SourceParamFillInRow
                  param={res.param}
                  onCapture={onMissingParameterCapture}
                  modelId={modelId}
                  memberId={memberId}
                />
              ) : modelId && memberId ? (
                <BankerParamFillInRow
                  param={res.param}
                  modelId={modelId}
                  memberId={memberId}
                />
              ) : (
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-sm text-blaze-charcoal">
                    {res.param.label}
                  </span>
                  <ProvenanceChip res={res} />
                </div>
              )
            ) : (
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-sm text-blaze-charcoal">
                  {res.param.label}
                  <span className="ml-2 font-medium text-blaze-charcoal">
                    {displayOverrides?.[res.param.key] ??
                      formatDisplayValue(res.value, res.param)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <ProvenanceChip res={res} />
                  {res.tier === "estimate" && modelId && memberId && (
                    <CaptureWithMemberControl
                      param={res.param}
                      modelId={modelId}
                      memberId={memberId}
                      value={res.value}
                      onConfirmed={onConfirmed}
                    />
                  )}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// BUILD 2b.1 — "Capture with Member" upgrades a banker_estimate essential
// to member_confirmed. Clicking reveals an input pre-filled with the
// current estimate; the banker enters/edits the value the Member actually
// confirmed (override allowed), then Confirm writes value + provenance
// (__confirmed) to template_parameters via updateModelParameter. On reload
// the chip flips to "captured ✓" and the chart re-renders with the value.
function CaptureWithMemberControl({
  param,
  modelId,
  memberId,
  value,
  onConfirmed,
}: {
  param: TemplateParameter;
  modelId: string;
  memberId: string;
  value: string;
  // BUILD 2d — let the parent advance the gate optimistically (live
  // reveal) the moment the confirm persists.
  onConfirmed?: (key: string, value: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Enter the value the Member confirmed.");
      return;
    }
    startTransition(async () => {
      const result = await updateModelParameter({
        member_id: memberId,
        model_id: modelId,
        parameter_key: param.key,
        parameter_value: trimmed,
        mark_confirmed: true,
      });
      if (result.ok) {
        setEditing(false);
        onConfirmed?.(param.key, trimmed);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="rounded border border-blaze-orange-deep bg-white px-2 py-0.5 text-[10px] font-medium text-blaze-orange-deep transition-colors hover:bg-blaze-orange-deep hover:text-white"
      >
        Capture with Member
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="w-32">{renderParamInput(param, draft, setDraft)}</span>
      <button
        type="button"
        onClick={confirm}
        disabled={isPending}
        className="rounded border border-blaze-orange-deep bg-blaze-orange-deep px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-blaze-orange-burnt disabled:opacity-60"
      >
        {isPending ? "Confirming…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setError(null);
        }}
        className="text-[10px] text-blaze-grey-body hover:text-blaze-charcoal"
      >
        Cancel
      </button>
      {error && <span className="text-[10px] text-blaze-danger">{error}</span>}
    </span>
  );
}

// Sprint 8 follow-up — source-linked missing-param row. Renders the
// label + factor id, plus an inline + Quantify-style form right in the
// banner so the banker can capture without leaving the dialog.
// Two-mode toggle (member-confirmed vs banker-estimate) per Block E.
function SourceParamFillInRow({
  param,
  onCapture,
  modelId,
  memberId,
}: {
  param: TemplateParameter;
  onCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  modelId: string | null;
  memberId: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<ArtifactCaptureMode>("member_confirmed");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Inline-save path: write directly to the Model's parameters JSON so
  // the artifact shows the value immediately, regardless of whether the
  // upstream dialpad handler is wired. The factor capture itself can be
  // recorded separately by the banker via + Quantify later if they want
  // the audit trail.
  function commit() {
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a value.");
      return;
    }
    if (!modelId || !memberId) {
      setError("Model context unavailable.");
      return;
    }
    startTransition(async () => {
      const result = await updateModelParameter({
        member_id: memberId,
        model_id: modelId,
        parameter_key: param.key,
        parameter_value: trimmed,
      });
      if (result.ok) {
        setEditing(false);
        setValue("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function openInDialpad(captureMode: ArtifactCaptureMode) {
    if (!onCapture || !param.source_factor_id) return;
    onCapture({
      factor_id: param.source_factor_id,
      parameter_label: param.label,
      mode: captureMode,
    });
  }

  return (
    <>
      <p className="text-sm font-medium text-blaze-charcoal">
        {param.label}
      </p>

      {!editing ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("member_confirmed");
              setEditing(true);
            }}
            className="rounded border border-blaze-orange-deep bg-blaze-orange-deep px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blaze-orange-burnt"
          >
            Capture with Member
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("banker_estimate");
              setEditing(true);
            }}
            className="rounded border border-blaze-rule bg-white px-3 py-1 text-[11px] font-medium text-blaze-charcoal transition-colors hover:border-blaze-orange-deep hover:text-blaze-orange-deep"
          >
            Banker estimate
          </button>
          {onCapture && (
            <button
              type="button"
              onClick={() => openInDialpad("member_confirmed")}
              className="text-[11px] font-medium text-blaze-grey-body underline-offset-2 hover:text-blaze-orange-deep hover:underline"
              title="Open the + Quantify form for the full factor-capture flow."
            >
              open in + Quantify ↗
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {mode === "banker_estimate" && (
            <p className="text-[11px] italic text-blaze-grey-body">
              Saved as a banker estimate until the Member confirms.
            </p>
          )}
          {renderParamInput(param, value, setValue)}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={isPending}
              className="rounded border border-blaze-orange-deep bg-blaze-orange-deep px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blaze-orange-burnt disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setValue("");
              }}
              className="text-[11px] text-blaze-grey-body hover:text-blaze-charcoal"
            >
              Cancel
            </button>
            {error && (
              <span className="text-[11px] text-blaze-danger">{error}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Shared input renderer used by both source-linked + banker-entered
// fill-in rows. Type comes from the template parameter (numeric inputs
// for currency/decimal/integer/percentage, select for select, textarea
// for long_text, text otherwise).
function renderParamInput(
  param: TemplateParameter,
  value: string,
  setValue: (v: string) => void,
) {
  if (param.type === "select" && param.options) {
    return (
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded border border-blaze-rule bg-white px-2 py-1 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
      >
        <option value="">Select…</option>
        {param.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (param.type === "long_text") {
    return (
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="w-full rounded border border-blaze-rule bg-white px-2 py-1 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        placeholder={param.helper ?? ""}
      />
    );
  }
  const isNumeric =
    param.type === "currency" ||
    param.type === "decimal" ||
    param.type === "integer" ||
    param.type === "percentage";
  return (
    <input
      type={isNumeric ? "number" : "text"}
      inputMode={isNumeric ? "decimal" : undefined}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full rounded border border-blaze-rule bg-white px-2 py-1 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
      placeholder={param.helper ?? ""}
    />
  );
}

// Sprint 8 follow-up — inline "Fill in" editor for banker-entered
// required parameters that have no source_factor_id linkage. Save
// writes to the Model's parameters JSON via updateModelParameter.
function BankerParamFillInRow({
  param,
  modelId,
  memberId,
}: {
  param: TemplateParameter;
  modelId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(
    param.default !== undefined ? String(param.default) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit() {
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a value.");
      return;
    }
    startTransition(async () => {
      const result = await updateModelParameter({
        member_id: memberId,
        model_id: modelId,
        parameter_key: param.key,
        parameter_value: trimmed,
      });
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <p className="text-sm font-medium text-blaze-charcoal">
        {param.label}
        <span className="ml-2 text-[11px] font-normal text-blaze-grey-soft">
          banker entered
        </span>
      </p>
      {editing ? (
        <div className="mt-2 space-y-1.5">
          {renderParamInput(param, value, setValue)}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={isPending}
              className="rounded border border-blaze-orange-deep bg-blaze-orange-deep px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blaze-orange-burnt disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="text-[11px] text-blaze-grey-body hover:text-blaze-charcoal"
            >
              Cancel
            </button>
            {error && (
              <span className="text-[11px] text-blaze-danger">{error}</span>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 rounded border border-blaze-rule bg-white px-3 py-1 text-[11px] font-medium text-blaze-charcoal transition-colors hover:border-blaze-orange-deep hover:text-blaze-orange-deep"
        >
          + Fill in
        </button>
      )}
    </>
  );
}

function SectionListRender({
  sections,
  schema,
  values,
  captureModeByKey,
  missingByKey,
  onMissingCapture,
  modelId,
  memberId,
}: {
  sections: StructuralSection[];
  schema: ParameterSchema | null;
  values: Record<string, string>;
  captureModeByKey: Record<string, "member_confirmed" | "banker_estimate">;
  missingByKey: Record<string, true>;
  onMissingCapture?: (args: {
    factor_id: string;
    parameter_label: string;
    mode: ArtifactCaptureMode;
  }) => void;
  modelId: string | null;
  memberId: string | null;
}) {
  const paramByKey = new Map<string, TemplateParameter>();
  if (schema) {
    for (const p of schema.parameters) paramByKey.set(p.key, p);
  }
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.label} className="rounded border border-blaze-rule bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            {section.label}
          </p>
          <dl className="mt-2 space-y-1.5">
            {section.fields.map((key) => {
              const param = paramByKey.get(key);
              const raw = values[key] ?? "";
              const isMissing = missingByKey[key];
              const isBankerEstimate =
                captureModeByKey[key] === "banker_estimate";
              // Sprint 8 follow-up — banker-entered required missing
              // params surface a `+ fill in` link routing to the inline
              // editor in the top banner.
              const isBankerMissing =
                !!param &&
                !param.source_factor_id &&
                !param.computed &&
                param.type !== "static_text" &&
                param.required === true &&
                raw === "" &&
                modelId !== null &&
                memberId !== null;
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
                >
                  <dt className="text-[12px] text-blaze-grey-body">
                    {param?.label ?? key}
                  </dt>
                  <dd className="text-blaze-charcoal">
                    {isMissing && param?.source_factor_id && onMissingCapture ? (
                      <span className="inline-flex items-baseline gap-2">
                        <span className="italic text-blaze-grey-soft">— missing</span>
                        <button
                          type="button"
                          onClick={() =>
                            onMissingCapture({
                              factor_id: param.source_factor_id!,
                              parameter_label: param.label,
                              mode: "member_confirmed",
                            })
                          }
                          className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
                        >
                          + capture
                        </button>
                      </span>
                    ) : isBankerMissing && param ? (
                      <SectionInlineFillIn
                        param={param}
                        modelId={modelId!}
                        memberId={memberId!}
                      />
                    ) : raw === "" ? (
                      <span className="italic text-blaze-grey-soft">—</span>
                    ) : (
                      <>
                        {formatDisplayValue(raw, param)}
                        {isBankerEstimate && (
                          <span className="ml-2 text-[11px] italic text-blaze-grey-body">
                            · banker estimate{" "}
                            <span className="text-blaze-grey-soft">
                              (pending Member confirmation)
                            </span>
                          </span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

// Sprint 8 follow-up — inline `+ fill in` row used inside structural
// section listings. Hand-off to the same updateModelParameter server
// action that the top-of-artifact banker-entered banner uses.
function SectionInlineFillIn({
  param,
  modelId,
  memberId,
}: {
  param: TemplateParameter;
  modelId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(
    param.default !== undefined ? String(param.default) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit() {
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a value.");
      return;
    }
    startTransition(async () => {
      const result = await updateModelParameter({
        member_id: memberId,
        model_id: modelId,
        parameter_key: param.key,
        parameter_value: trimmed,
      });
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <span className="inline-flex items-baseline gap-2">
        <span className="italic text-blaze-grey-soft">— missing</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] font-medium text-blaze-orange-deep hover:underline"
        >
          + Fill in
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      {param.type === "select" && param.options ? (
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded border border-blaze-rule bg-white px-2 py-0.5 text-[12px] text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">Select…</option>
          {param.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={
            param.type === "currency" ||
            param.type === "decimal" ||
            param.type === "integer" ||
            param.type === "percentage"
              ? "number"
              : "text"
          }
          inputMode={
            param.type === "currency" ||
            param.type === "decimal" ||
            param.type === "integer" ||
            param.type === "percentage"
              ? "decimal"
              : undefined
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-32 rounded border border-blaze-rule bg-white px-2 py-0.5 text-[12px] text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
      )}
      <button
        type="button"
        onClick={commit}
        disabled={isPending}
        className="text-[11px] font-medium text-blaze-orange-deep hover:underline disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setError(null);
        }}
        className="text-[11px] text-blaze-grey-body hover:text-blaze-charcoal"
      >
        Cancel
      </button>
      {error && (
        <span className="text-[11px] text-blaze-danger">{error}</span>
      )}
    </span>
  );
}

function RoadmapRender({
  stages,
  currentStage,
  youAreHereLabel,
}: {
  stages: StructuralRoadmapStage[];
  currentStage: number;
  youAreHereLabel: string;
}) {
  return (
    <ol className="space-y-3">
      {stages.map((stage) => {
        const isCurrent = stage.stage_number === currentStage;
        return (
          <li
            key={stage.stage_number}
            className={`relative rounded border bg-white p-3 ${
              isCurrent
                ? "border-blaze-orange"
                : "border-blaze-rule"
            }`}
          >
            {isCurrent && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-orange-deep">
                {youAreHereLabel}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isCurrent
                    ? "bg-blaze-orange text-white"
                    : "bg-blaze-cream text-blaze-grey-body"
                }`}
              >
                {stage.stage_number}
              </span>
              <p className="text-sm font-semibold text-blaze-charcoal">
                {stage.title}
              </p>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-blaze-grey-body">
              {stage.description}
            </p>
            {stage.roles.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-[11px] text-blaze-grey-body">
                {stage.roles.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium text-blaze-charcoal">
                      {r.name}
                    </span>{" "}
                    <span className="text-blaze-grey-soft">— {r.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function formatDisplayValue(
  raw: string,
  param: TemplateParameter | undefined,
): string {
  if (!param) return raw;
  if (param.type === "currency") {
    const n = Number(raw.replace(/[$,\s]/g, ""));
    if (Number.isFinite(n)) return fmtUSD(n);
  }
  if (param.type === "percentage") {
    const trimmed = raw.replace(/\s+/g, "");
    return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
  }
  return raw;
}
