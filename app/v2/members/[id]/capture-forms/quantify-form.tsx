"use client";

/*
 * + Quantify hybrid form — Sprint 5a.1 Block F.
 *
 * Two modes:
 *   - Matrix-aware (default): banker selects a BusinessFactor from a
 *     category-grouped dropdown. Form surfaces the factor's diagnostic
 *     question and an appropriate input control per factor.capture_mode
 *     (numerical / boolean / qualitative_select / qualitative_multi).
 *     Saves a FactorCapture; optionally co-creates a SizingMeasurement
 *     when the factor is numerical and the banker checks the companion
 *     box.
 *   - Free-form (fallback): wraps the existing v1 SizeSection so the
 *     pre-Sprint-5a path still works for ad-hoc magnitudes that don't
 *     map to the matrix catalog. No FactorCapture created in this mode.
 *
 * Default to matrix-aware. Mode toggle at the top of the drawer.
 *
 * Compliance keyword scan continues to fire on free-text fields in the
 * free-form path (handled inside SizeSection per Sprint 4.7 Block Q).
 * Matrix-aware mode currently has no banker-prose free-text fields;
 * if Sprint 5a.2 adds an "additional notes" field on the matrix-aware
 * branch, wire the scan there.
 */

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveFactorCapture } from "../actions";
import {
  SizeSection,
  type SizeDimensionOption,
  type SizePriorMeasurement,
} from "@/app/growth-conversations/[memberId]/size-section";

export type QuantifyFactorOption = {
  id: string;
  name: string;
  diagnostic_question: string;
  capture_mode: string; // numerical | boolean | qualitative_select | qualitative_multi
  field_name: string;
  unit: string | null;
  category: string;
  // JSON-encoded array for qualitative_select / qualitative_multi.
  enum_values: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  cashflow: "Cashflow",
  capacity: "Capacity / growth",
  decision_process: "Decision process",
  industry_structural: "Industry / structural",
  member_stated: "Member-stated",
  banking_relationship: "Banking relationship",
};

// Sprint 5e Block E — factors whose qualitative_value should be
// captured as the Member's verbatim statement, not picked from the
// enumerated tag set. The enum_values are still defined on the
// BusinessFactor record to drive matrix threshold rules along the
// Signal-linked path; this set just tells the form to render a
// textarea instead of a dropdown.
const FREE_TEXT_FACTOR_IDS = new Set<string>([
  "FACTOR-021", // Stated growth aspiration
  "FACTOR-022", // Stated obstacle to growth
  "FACTOR-023", // Stated decision hesitation
  "FACTOR-024", // Triggering event observed
]);

export function QuantifyForm({
  memberId,
  bankerId,
  conversationId,
  // Matrix-aware mode data
  factors,
  // Free-form mode data
  sizingDimensions,
  sizePriorMeasurements,
  // Sprint 5a.2 Block E — pre-selected factor when opened from a
  // popup-as-workflow CTA. Forces matrix-aware mode and skips the
  // factor dropdown to the chosen factor.
  preselectedFactorId,
  // Sprint 8 Block E — pre-set capture mode when opened from an
  // artifact's missing-parameter CTA. "Banker estimate" path surfaces
  // helper copy that flags the capture as pending Member confirmation.
  preselectedCaptureMode,
  onSuccess,
  onCancel,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  factors: QuantifyFactorOption[];
  sizingDimensions: SizeDimensionOption[];
  sizePriorMeasurements: SizePriorMeasurement[];
  preselectedFactorId?: string;
  preselectedCaptureMode?: "member_confirmed" | "banker_estimate";
  onSuccess: () => void;
  onCancel: () => void;
}) {
  // When opened from a popup CTA (preselectedFactorId set), force
  // matrix-aware mode. Banker doesn't toggle to free-form because the
  // CTA invocation is tied to a specific factor.
  const [mode, setMode] = useState<"matrix" | "freeform">(
    preselectedFactorId ? "matrix" : "matrix",
  );

  return (
    <div className="space-y-4">
      {/* Mode toggle — radio at the top of the drawer.
          Sprint 5d Block D — labels and helper per CONTENT_REWRITE_v1 §3.2. */}
      <div
        className="border-b border-blaze-rule pb-3"
        role="radiogroup"
        aria-label="Quantify mode"
      >
        <div className="flex items-center gap-4">
          <ModeRadio
            checked={mode === "matrix"}
            onChange={() => setMode("matrix")}
            label="Tied to a lending product"
            tooltip="Walks through specific business factors."
          />
          <ModeRadio
            checked={mode === "freeform"}
            onChange={() => setMode("freeform")}
            label="Just a number"
            tooltip="Captures any quantity, free-form."
          />
        </div>
      </div>

      {preselectedCaptureMode === "banker_estimate" && (
        <div className="rounded border border-blaze-orange/30 bg-blaze-cream/40 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            Banker estimate mode
          </p>
          <p className="mt-1 text-[12px] leading-snug text-blaze-grey-body">
            Recording your working assumption. Marked as banker estimate so we
            know to confirm with the Member later.
          </p>
        </div>
      )}

      {mode === "matrix" ? (
        <MatrixAwareCapture
          memberId={memberId}
          bankerId={bankerId}
          factors={factors}
          sizingDimensions={sizingDimensions}
          preselectedFactorId={preselectedFactorId}
          captureMode={preselectedCaptureMode}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      ) : (
        <SizeSection
          memberId={memberId}
          bankerId={bankerId}
          conversationId={conversationId}
          priorMeasurements={sizePriorMeasurements}
          dimensions={sizingDimensions}
          onSaveSuccess={onSuccess}
        />
      )}
    </div>
  );
}

function ModeRadio({
  checked,
  onChange,
  label,
  tooltip,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  tooltip?: string;
}) {
  return (
    <label
      className="flex items-center gap-2 text-xs text-blaze-charcoal"
      title={tooltip}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="accent-blaze-orange"
      />
      {label}
    </label>
  );
}

// ── Matrix-aware capture surface ──

function MatrixAwareCapture({
  memberId,
  bankerId,
  factors,
  sizingDimensions,
  preselectedFactorId,
  captureMode,
  onSuccess,
  onCancel,
}: {
  memberId: string;
  bankerId: string;
  factors: QuantifyFactorOption[];
  sizingDimensions: SizeDimensionOption[];
  preselectedFactorId?: string;
  captureMode?: "member_confirmed" | "banker_estimate";
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  // Sprint 5a.2 Block E — when opened from a popup CTA, initialize the
  // factor dropdown to the chosen factor so the diagnostic question
  // surfaces immediately and the banker doesn't re-pick.
  // Sprint 5c Block G.1 — defensive sync: when `preselectedFactorId`
  // changes prop-side (e.g., dialog reused across CTAs without unmount,
  // or shell state cleared between opens), keep `factorId` aligned. The
  // useState initializer fires only on mount; without this effect, a
  // stale preselection could persist.
  const [factorId, setFactorId] = useState<string>(
    preselectedFactorId && factors.some((f) => f.id === preselectedFactorId)
      ? preselectedFactorId
      : "",
  );
  useEffect(() => {
    if (
      preselectedFactorId &&
      factors.some((f) => f.id === preselectedFactorId)
    ) {
      setFactorId(preselectedFactorId);
    } else {
      setFactorId("");
      setNumericalValue("");
      setBooleanValue(null);
      setQualitativeValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedFactorId]);
  const [numericalValue, setNumericalValue] = useState<string>("");
  const [booleanValue, setBooleanValue] = useState<boolean | null>(null);
  const [qualitativeValue, setQualitativeValue] = useState<string>("");
  const [alsoCreateSizing, setAlsoCreateSizing] = useState(false);
  const [sizingDimensionId, setSizingDimensionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const factor = factors.find((f) => f.id === factorId) ?? null;

  // Group factors by category for the dropdown.
  const groupedFactors = factors.reduce<Record<string, QuantifyFactorOption[]>>(
    (acc, f) => {
      (acc[f.category] = acc[f.category] ?? []).push(f);
      return acc;
    },
    {},
  );

  function resetValueState() {
    setNumericalValue("");
    setBooleanValue(null);
    setQualitativeValue("");
    setAlsoCreateSizing(false);
    setSizingDimensionId("");
  }

  function handleFactorChange(newId: string) {
    setFactorId(newId);
    resetValueState();
    setError(null);
  }

  function commitSave() {
    setError(null);
    if (!factor) {
      setError("Pick a business factor.");
      return;
    }
    let parsedNumerical: number | null = null;
    let parsedBoolean: boolean | null = null;
    let parsedQualitative: string | null = null;
    if (factor.capture_mode === "numerical") {
      if (numericalValue === "" || Number.isNaN(Number(numericalValue))) {
        setError("Enter a numerical value.");
        return;
      }
      parsedNumerical = Number(numericalValue);
    } else if (factor.capture_mode === "boolean") {
      if (booleanValue === null) {
        setError("Pick yes or no.");
        return;
      }
      parsedBoolean = booleanValue;
    } else if (
      factor.capture_mode === "qualitative_select" ||
      factor.capture_mode === "qualitative_multi"
    ) {
      if (!qualitativeValue) {
        setError("Pick an option.");
        return;
      }
      parsedQualitative = qualitativeValue;
    }

    if (alsoCreateSizing && !sizingDimensionId) {
      setError("Pick a sizing dimension or uncheck the companion option.");
      return;
    }

    startTransition(async () => {
      const result = await saveFactorCapture({
        member_id: memberId,
        banker_id: bankerId,
        factor_id: factor.id,
        numerical_value: parsedNumerical,
        boolean_value: parsedBoolean,
        qualitative_value: parsedQualitative,
        unit: factor.unit,
        also_create_sizing: alsoCreateSizing,
        sizing_dimension_id: alsoCreateSizing ? sizingDimensionId : null,
        capture_mode: captureMode,
      });
      if (result.ok) {
        router.refresh();
        onSuccess();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Which business factor?" required>
        <select
          value={factorId}
          onChange={(e) => handleFactorChange(e.target.value)}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">Select…</option>
          {Object.entries(groupedFactors).map(([category, list]) => (
            <optgroup
              key={category}
              label={CATEGORY_LABELS[category] ?? category}
            >
              {list.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {factor && (
        <>
          <p className="rounded border-l-[3px] border-blaze-orange bg-blaze-cream/40 px-3 py-2 text-sm italic leading-relaxed text-blaze-grey-body">
            &ldquo;{factor.diagnostic_question}&rdquo;
          </p>

          {factor.capture_mode === "numerical" && (
            <NumericalCapture
              value={numericalValue}
              unit={factor.unit}
              onChange={setNumericalValue}
            />
          )}
          {factor.capture_mode === "boolean" && (
            <BooleanCapture value={booleanValue} onChange={setBooleanValue} />
          )}
          {(factor.capture_mode === "qualitative_select" ||
            factor.capture_mode === "qualitative_multi") && (
            // Sprint 5e Block E — "Stated *" factors (Member's
            // verbatim articulation of growth aspiration / obstacle /
            // hesitation / triggering event) render as a textarea so
            // banker captures the actual statement, not a tag bucket.
            // Matrix tag-anchored matching for these factors flows
            // through the Signal-linked + Ask path (Signal.topic_id
            // carries the bucket); standalone + Quantify on a Stated
            // factor stores the verbatim quote in qualitative_value.
            <QualitativeCapture
              value={qualitativeValue}
              onChange={setQualitativeValue}
              enumValues={factor.enum_values}
              freeText={FREE_TEXT_FACTOR_IDS.has(factor.id)}
            />
          )}

          {factor.capture_mode === "numerical" && (
            <CompanionSizingToggle
              alsoCreateSizing={alsoCreateSizing}
              onToggle={setAlsoCreateSizing}
              dimensionId={sizingDimensionId}
              onDimensionChange={setSizingDimensionId}
              dimensions={sizingDimensions}
            />
          )}
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={commitSave}
          disabled={isPending || !factor}
          className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm font-medium text-blaze-grey-body hover:text-blaze-charcoal"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function NumericalCapture({
  value,
  unit,
  onChange,
}: {
  value: string;
  unit: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="What's the number?" required>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          placeholder="e.g., 28"
        />
        {unit && (
          <span className="text-xs text-blaze-grey-body">{unit}</span>
        )}
      </div>
    </Field>
  );
}

function BooleanCapture({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label="Yes / No" required>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-blaze-charcoal">
          <input
            type="radio"
            checked={value === true}
            onChange={() => onChange(true)}
            className="accent-blaze-orange"
          />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm text-blaze-charcoal">
          <input
            type="radio"
            checked={value === false}
            onChange={() => onChange(false)}
            className="accent-blaze-orange"
          />
          No
        </label>
      </div>
    </Field>
  );
}

// Sprint 5a.3 patch — humanize dropdown option labels. The stored
// enum values are snake_case tags (e.g., `late_paying_customer`); the
// banker-facing labels read with underscores replaced + sentence-case.
// The `value` posted to the form remains the raw tag (the schema and
// matrix evaluator both expect the raw tag); only the displayed text
// is humanized.
function humanizeTag(tag: string): string {
  if (!tag) return tag;
  const replaced = tag.replace(/_/g, " ");
  return replaced.charAt(0).toUpperCase() + replaced.slice(1);
}

function QualitativeCapture({
  value,
  onChange,
  enumValues,
  freeText,
}: {
  value: string;
  onChange: (v: string) => void;
  enumValues: string | null;
  freeText?: boolean;
}) {
  if (freeText) {
    return (
      <Field
        label="What did the Member say?"
        required
        helper="Capture the Member's actual statement, not a tag."
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
      </Field>
    );
  }
  let options: string[] = [];
  if (enumValues) {
    try {
      const parsed = JSON.parse(enumValues);
      if (Array.isArray(parsed)) options = parsed.filter((x) => typeof x === "string");
    } catch {
      // Fallback: empty list; banker can pick "Select…" only.
    }
  }
  return (
    <Field label="Selection" required>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {humanizeTag(opt)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CompanionSizingToggle({
  alsoCreateSizing,
  onToggle,
  dimensionId,
  onDimensionChange,
  dimensions,
}: {
  alsoCreateSizing: boolean;
  onToggle: (v: boolean) => void;
  dimensionId: string;
  onDimensionChange: (v: string) => void;
  dimensions: SizeDimensionOption[];
}) {
  return (
    <div className="rounded border border-blaze-rule p-3">
      <label className="flex items-start gap-2 text-sm text-blaze-charcoal">
        <input
          type="checkbox"
          checked={alsoCreateSizing}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 accent-blaze-orange"
        />
        <span>
          Also show this as a sizing card
          <span className="mt-0.5 block text-[11px] text-blaze-grey-soft">
            Use this when the value is a magnitude the Member should see
            at a glance &mdash; like a $75K credit limit or 70% capacity
            utilization.
          </span>
        </span>
      </label>
      {alsoCreateSizing && (
        <div className="mt-3">
          <Field label="What kind of sizing?" required>
            <select
              value={dimensionId}
              onChange={(e) => onDimensionChange(e.target.value)}
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              <option value="">Select…</option>
              {dimensions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.display_name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-blaze-grey-body">
        {label}
        {required && <span className="ml-1 text-blaze-orange-deep">*</span>}
      </span>
      {helper && (
        <span className="mt-0.5 block text-[11px] text-blaze-grey-soft">
          {helper}
        </span>
      )}
      <div className="mt-1">{children}</div>
    </label>
  );
}
