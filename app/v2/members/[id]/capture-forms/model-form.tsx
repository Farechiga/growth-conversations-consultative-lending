"use client";

/*
 * + Model capture form — Sprint 4.7 Block I; Sprint 5d Block A.3 + D;
 * BUILD 2c rework.
 *
 * Essentials-only builder. When the banker picks a lending product
 * (template), the form renders ONLY that template's essential set (the
 * §1 genuinely-needed = required params after 2a's trim) as primary
 * fields, PRE-FILLED from the Member's evidence via 2b's shared resolve
 * engine (captured → product → estimate), each tagged with the same
 * provenance chip. The remaining template params collapse into an
 * "Advanced / optional" disclosure. The legacy freeform key/value
 * "Inputs" grid is shown only on the no-template path.
 *
 * The model is auto-named from the lending product (no "what's it
 * called?" field); a datestamp suffix is added in saveModel on
 * collision. Save is anchored to a sticky footer.
 *
 * Compliance scan integration: output_summary is [FL:BANKER-PROSE] and
 * fires the Sprint 4.6 keyword scan on submit.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveModel } from "../actions";
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";
import {
  parseParameterSchema,
  resolveTemplateString,
  type ParameterSchema,
  type TemplateParameter,
} from "@/lib/artifact-template";
// BUILD 2c — reuse 2b's resolve engine (do not fork it).
import {
  overlayCaptures,
  resolveEssentials,
  ProvenanceChip,
  type EssentialResolution,
  type FactorCaptureValue,
} from "../artifact-template-render";

export type ModelArtifactOption = {
  id: string;
  title: string;
  // Sprint 5d Block A.3 — ArtifactTemplate metadata so the form can
  // render parameter inputs and pre-fill the output summary template.
  // When this is null, the option behaves like the legacy free-form
  // Artifact attachment (no parameter UI).
  template:
    | {
        track_id: string;
        track_name: string;
        description: string;
        parameter_schema: string; // JSON-encoded
        output_summary_template: string;
      }
    | null;
};

type ParameterRow = { temp_id: string; key: string; value: string };

export function ModelForm({
  memberId,
  bankerId,
  conversationId,
  artifacts,
  onSuccess,
  onCancel,
  factorCapturesById,
  recommendedProduct,
  activeTrackIds,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  artifacts: ModelArtifactOption[];
  onSuccess: () => void;
  onCancel: () => void;
  // BUILD 2c — Member evidence + recommended product, so essentials
  // pre-fill via the shared resolve engine instead of being re-entered.
  factorCapturesById?: Record<string, FactorCaptureValue>;
  recommendedProduct?: { amount: string; label: string } | null;
  activeTrackIds?: string[];
}) {
  const router = useRouter();
  const [builtWithMember, setBuiltWithMember] = useState<boolean | null>(null);
  const [artifactId, setArtifactId] = useState<string>("");
  const [parameters, setParameters] = useState<ParameterRow[]>([
    { temp_id: crypto.randomUUID(), key: "", value: "" },
  ]);
  const [assumptions, setAssumptions] = useState<string[]>([""]);
  const [outputSummary, setOutputSummary] = useState("");
  const [outputSummaryTouched, setOutputSummaryTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
  } | null>(null);

  // Template parameter values keyed by parameter_schema.key.
  const [templateParamValues, setTemplateParamValues] = useState<
    Record<string, string>
  >({});

  const captures = useMemo(
    () => factorCapturesById ?? {},
    [factorCapturesById],
  );

  const selectedArtifact = useMemo(
    () => artifacts.find((a) => a.id === artifactId) ?? null,
    [artifacts, artifactId],
  );
  const templateSchema: ParameterSchema | null = useMemo(
    () => parseParameterSchema(selectedArtifact?.template?.parameter_schema ?? null),
    [selectedArtifact],
  );

  // The banker-facing product name (used for auto-naming + the header).
  const productName =
    selectedArtifact?.template?.track_name ?? selectedArtifact?.title ?? "Model";

  // Tier-2 hint applies only when the selected product is one of the
  // Member's active recommended Tracks (Q-055 gating).
  const recommendedForSelected = useMemo(() => {
    const tid = selectedArtifact?.template?.track_id;
    if (tid && (activeTrackIds ?? []).includes(tid)) {
      return recommendedProduct ?? null;
    }
    return null;
  }, [selectedArtifact, activeTrackIds, recommendedProduct]);

  // Essential params (the §1 set = required, non-computed, non-static).
  const essentialParams = useMemo(
    () =>
      templateSchema?.parameters.filter(
        (p) => p.required === true && !p.computed && p.type !== "static_text",
      ) ?? [],
    [templateSchema],
  );
  const advancedParams = useMemo(() => {
    const ess = new Set(essentialParams.map((p) => p.key));
    return templateSchema?.parameters.filter((p) => !ess.has(p.key)) ?? [];
  }, [templateSchema, essentialParams]);

  // Reactive resolution of essentials (current values + Member evidence)
  // for the per-field provenance chips. Reuses 2b's engine.
  const resByKey = useMemo(() => {
    const m = new Map<string, EssentialResolution>();
    if (!selectedArtifact?.template || !templateSchema) return m;
    const { resolvedValues, captureModeByKey } = overlayCaptures(
      templateSchema,
      templateParamValues,
      captures,
    );
    for (const r of resolveEssentials({
      schema: templateSchema,
      resolvedValues,
      captureModeByKey,
      confirmedKeys: new Set<string>(),
      recommendedProduct: recommendedForSelected,
    })) {
      m.set(r.param.key, r);
    }
    return m;
  }, [
    selectedArtifact,
    templateSchema,
    templateParamValues,
    captures,
    recommendedForSelected,
  ]);

  // Pre-fill essentials from evidence when the selected template changes:
  // captured value / product amount; absent essentials start blank.
  useEffect(() => {
    setOutputSummaryTouched(false);
    if (selectedArtifact?.template && templateSchema) {
      const { resolvedValues, captureModeByKey } = overlayCaptures(
        templateSchema,
        {},
        captures,
      );
      const prefill: Record<string, string> = {};
      for (const r of resolveEssentials({
        schema: templateSchema,
        resolvedValues,
        captureModeByKey,
        confirmedKeys: new Set<string>(),
        recommendedProduct: recommendedForSelected,
      })) {
        if (r.value) prefill[r.param.key] = r.value;
      }
      setTemplateParamValues(prefill);
    } else {
      setTemplateParamValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactId]);

  // Auto-generate the output summary until the banker edits it. The
  // template now OMITS unfilled fields (no "[Label]" leaks — BUILD 2c §6).
  useEffect(() => {
    const tmpl = selectedArtifact?.template?.output_summary_template ?? null;
    if (!tmpl) return;
    if (outputSummaryTouched) return;
    setOutputSummary(
      resolveTemplateString(tmpl, templateSchema, templateParamValues),
    );
  }, [selectedArtifact, templateSchema, templateParamValues, outputSummaryTouched]);

  // Group artifact options for the dropdown: templates by Track, then any
  // non-template (legacy Artifact) options last.
  const groupedArtifacts = useMemo(() => {
    const byTrack = new Map<string, ModelArtifactOption[]>();
    const noTemplate: ModelArtifactOption[] = [];
    for (const a of artifacts) {
      if (a.template) {
        const list = byTrack.get(a.template.track_name) ?? [];
        list.push(a);
        byTrack.set(a.template.track_name, list);
      } else {
        noTemplate.push(a);
      }
    }
    return { byTrack, noTemplate };
  }, [artifacts]);

  function addParameterRow() {
    setParameters((p) => [
      ...p,
      { temp_id: crypto.randomUUID(), key: "", value: "" },
    ]);
  }
  function removeParameterRow(temp_id: string) {
    setParameters((p) => p.filter((row) => row.temp_id !== temp_id));
  }
  function updateParameterRow(
    temp_id: string,
    field: "key" | "value",
    value: string,
  ) {
    setParameters((p) =>
      p.map((row) => (row.temp_id === temp_id ? { ...row, [field]: value } : row)),
    );
  }
  function addAssumption() {
    setAssumptions((a) => [...a, ""]);
  }
  function removeAssumption(i: number) {
    setAssumptions((a) => a.filter((_, idx) => idx !== i));
  }
  function updateAssumption(i: number, value: string) {
    setAssumptions((a) => a.map((row, idx) => (idx === i ? value : row)));
  }
  function setTemplateParam(key: string, value: string) {
    setTemplateParamValues((prev) => ({ ...prev, [key]: value }));
  }

  function commitSave() {
    setError(null);
    if (builtWithMember === null) {
      setError("Pick how the model was built.");
      return;
    }
    if (!outputSummary.trim()) {
      setError("Output summary is required.");
      return;
    }

    // Block Q — compliance scan on output_summary [FL:BANKER-PROSE].
    const scanMatches = scanText(outputSummary);
    if (scanMatches.length > 0) {
      setPendingScan({
        fieldsWithMatches: [
          { fieldName: "Model.output_summary", matches: scanMatches },
        ],
      });
      return;
    }

    dispatchSave();
  }

  function dispatchSave() {
    setPendingScan(null);
    const usingTemplate = !!selectedArtifact?.template;
    // BUILD 2c req 1 — auto-name from the selected lending product;
    // saveModel adds a datestamp suffix on collision.
    const modelName = usingTemplate ? productName : "Banker model";
    startTransition(async () => {
      const result = await saveModel({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        model_name: modelName,
        built_with_member: builtWithMember!,
        // BUILD 2c §1 fix — never send a template id as artifact_id (the
        // root FK mis-mapping). Templates link via template_id only; the
        // freeform path may still attach a legacy Artifact.
        artifact_id: usingTemplate
          ? null
          : artifactId === ""
          ? null
          : artifactId,
        parameters: usingTemplate
          ? []
          : parameters
              .filter((p) => p.key.trim() !== "" || p.value.trim() !== "")
              .map((p) => ({ key: p.key, value: p.value })),
        assumptions: assumptions.filter((a) => a.trim() !== ""),
        output_summary: outputSummary,
        template_id: usingTemplate ? artifactId : null,
        template_parameters: usingTemplate ? templateParamValues : null,
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
    <div>
      <div className="space-y-4 pb-2">
        <Field
          label="How was it built?"
          required
          helper="A model built with the Member is stronger evidence than a draft you brought in."
        >
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-blaze-charcoal">
              <input
                type="radio"
                name="built_with_member"
                checked={builtWithMember === true}
                onChange={() => setBuiltWithMember(true)}
                className="accent-blaze-orange"
              />
              With the Member, in the conversation
            </label>
            <label className="flex items-center gap-2 text-sm text-blaze-charcoal">
              <input
                type="radio"
                name="built_with_member"
                checked={builtWithMember === false}
                onChange={() => setBuiltWithMember(false)}
                className="accent-blaze-orange"
              />
              Banker draft, before the meeting
            </label>
          </div>
        </Field>

        <Field
          label="Which lending product?"
          helper="Pick a product to model — we pre-fill what we already know about the Member, so you only fill the gaps."
        >
          <select
            value={artifactId}
            onChange={(e) => setArtifactId(e.target.value)}
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          >
            <option value="">— None (freeform) —</option>
            {Array.from(groupedArtifacts.byTrack.entries()).map(([trackName, list]) => (
              <optgroup key={trackName} label={trackName}>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </optgroup>
            ))}
            {groupedArtifacts.noTemplate.length > 0 && (
              <optgroup label="Other models">
                {groupedArtifacts.noTemplate.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>

        {selectedArtifact?.template && templateSchema && (
          <div className="rounded border border-blaze-rule bg-blaze-cream/30 p-3">
            <p className="text-xs font-medium text-blaze-charcoal">
              {selectedArtifact.title}
            </p>
            <p className="mt-0.5 text-[11px] text-blaze-grey-soft">
              Auto-named &ldquo;{productName}&rdquo; · pre-filled from the
              Member&rsquo;s evidence — edit or confirm each value.
            </p>
            {selectedArtifact.template.description && (
              <p className="mt-1 text-[11px] leading-snug text-blaze-grey-body">
                {selectedArtifact.template.description}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {essentialParams.map((p) => {
                const res = resByKey.get(p.key);
                return (
                  <div key={p.key}>
                    <TemplateParameterField
                      param={p}
                      value={templateParamValues[p.key] ?? ""}
                      onChange={(v) => setTemplateParam(p.key, v)}
                    />
                    {res && (
                      <div className="mt-1">
                        <ProvenanceChip res={res} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {advancedParams.length > 0 && (
              <details className="mt-3 border-t border-blaze-rule pt-2">
                <summary className="cursor-pointer text-[11px] font-medium text-blaze-grey-body hover:text-blaze-charcoal">
                  Advanced / optional ({advancedParams.length})
                </summary>
                <div className="mt-2 space-y-3">
                  {advancedParams.map((p) => (
                    <TemplateParameterField
                      key={p.key}
                      param={p}
                      value={templateParamValues[p.key] ?? ""}
                      onChange={(v) => setTemplateParam(p.key, v)}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Freeform key/value Inputs — only on the no-template path. */}
        {!selectedArtifact?.template && (
          <div>
            <p className="text-xs text-blaze-grey-body">Inputs</p>
            <div className="mt-1 space-y-2">
              {parameters.map((row) => (
                <div key={row.temp_id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      updateParameterRow(row.temp_id, "key", e.target.value)
                    }
                    placeholder="key, e.g., rate"
                    className="flex-1 border border-blaze-rule bg-white px-2 py-1.5 text-xs text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      updateParameterRow(row.temp_id, "value", e.target.value)
                    }
                    placeholder="value, e.g., 0.075"
                    className="flex-1 border border-blaze-rule bg-white px-2 py-1.5 text-xs text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeParameterRow(row.temp_id)}
                    className="text-xs text-blaze-grey-body hover:text-blaze-danger"
                    aria-label="Remove input row"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addParameterRow}
              className="mt-2 text-xs font-medium text-blaze-orange-deep hover:underline"
            >
              + Add another input
            </button>
          </div>
        )}

        <div>
          <p className="text-xs text-blaze-grey-body">What you assumed</p>
          <div className="mt-1 space-y-2">
            {assumptions.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={a}
                  onChange={(e) => updateAssumption(i, e.target.value)}
                  placeholder="e.g., Customer payments stay at 60-day average"
                  className="flex-1 border border-blaze-rule bg-white px-2 py-1.5 text-xs text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeAssumption(i)}
                  className="text-xs text-blaze-grey-body hover:text-blaze-danger"
                  aria-label="Remove assumption"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAssumption}
            className="mt-2 text-xs font-medium text-blaze-orange-deep hover:underline"
          >
            + Add another assumption
          </button>
        </div>

        <label className="block">
          <span className="text-xs text-blaze-grey-body">
            What the model shows <span className="text-blaze-orange-deep">*</span>
          </span>
          <span className="block text-[11px] italic text-blaze-grey-soft">
            Describe what the numbers tell you about the business. Don&rsquo;t
            write about the Member personally.
          </span>
          <textarea
            value={outputSummary}
            onChange={(e) => {
              setOutputSummary(e.target.value);
              setOutputSummaryTouched(true);
            }}
            rows={3}
            placeholder="e.g., A $75K line of credit covers the slow months with room to spare."
            className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          />
        </label>
      </div>

      {/* BUILD 2c req 2 — sticky Save footer, always visible. The negative
          margins extend it across the drawer's px-6/py-6 padding so it
          pins flush to the drawer bottom while content scrolls beneath. */}
      <div className="sticky bottom-0 -mx-6 -mb-6 mt-2 flex items-center gap-3 border-t border-blaze-rule bg-white px-6 py-3">
        <button
          type="button"
          onClick={commitSave}
          disabled={isPending}
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
        {error && (
          <p className="text-sm text-blaze-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      {pendingScan && (
        <ComplianceScanModal
          bankerId={bankerId}
          memberId={memberId}
          fieldsWithMatches={pendingScan.fieldsWithMatches}
          onContinue={dispatchSave}
          onEdit={() => setPendingScan(null)}
          onCancel={() => {
            setPendingScan(null);
            onCancel();
          }}
        />
      )}
    </div>
  );
}

function TemplateParameterField({
  param,
  value,
  onChange,
}: {
  param: TemplateParameter;
  value: string;
  onChange: (v: string) => void;
}) {
  const labelNode = (
    <span className="block text-xs text-blaze-charcoal">
      {param.label}
      {param.required && <span className="ml-1 text-blaze-orange-deep">*</span>}
      {param.computed && (
        <span className="ml-2 text-[10px] uppercase tracking-[0.04em] text-blaze-grey-soft">
          auto
        </span>
      )}
    </span>
  );
  const helperNode = param.helper && (
    <span className="mt-0.5 block text-[11px] text-blaze-grey-soft">
      {param.helper}
    </span>
  );

  if (param.type === "static_text") {
    return (
      <div>
        {labelNode}
        <p className="mt-1 text-sm text-blaze-grey-body">{param.value ?? ""}</p>
      </div>
    );
  }

  if (param.computed) {
    return (
      <div>
        {labelNode}
        {helperNode}
        <p className="mt-1 rounded bg-white px-2 py-1.5 text-sm text-blaze-grey-body">
          {value || (
            <span className="italic text-blaze-grey-soft">
              computed once inputs are filled
            </span>
          )}
        </p>
      </div>
    );
  }

  if (param.type === "select") {
    return (
      <label className="block">
        {labelNode}
        {helperNode}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">Select…</option>
          {(param.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (param.type === "long_text") {
    return (
      <label className="block">
        {labelNode}
        {helperNode}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
      </label>
    );
  }

  // currency / decimal / integer / percentage / text — single-line input.
  const prefix = param.type === "currency" ? "$" : null;
  const suffix = param.type === "percentage" ? "%" : null;
  return (
    <label className="block">
      {labelNode}
      {helperNode}
      <div className="mt-1 flex items-center gap-1">
        {prefix && <span className="text-sm text-blaze-grey-body">{prefix}</span>}
        <input
          type="text"
          inputMode={
            param.type === "currency" ||
            param.type === "decimal" ||
            param.type === "integer" ||
            param.type === "percentage"
              ? "decimal"
              : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
        {suffix && <span className="text-sm text-blaze-grey-body">{suffix}</span>}
      </div>
    </label>
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
  children: React.ReactNode;
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
