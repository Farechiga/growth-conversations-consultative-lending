"use client";

/*
 * + Model capture form — Sprint 4.7 Block I; Sprint 5d Block A.3 + D.
 *
 * Captures a banker-built Model with structured parameters,
 * assumptions, and an output summary. "With the Member" / "Banker draft"
 * radio drives the built_with_member boolean — the critical evidentiary
 * distinction per ARCHITECTURE_V2 §4.
 *
 * Sprint 5d Block A.3 — when the banker attaches an ArtifactTemplate
 * via the dropdown, the form expands to render parameter input fields
 * driven by the template's parameter_schema. The output_summary
 * auto-generates from output_summary_template + parameters; banker can
 * edit the result before save. On save, template_id and
 * template_parameters persist so artifact rendering can re-render the
 * structural content + summary later.
 *
 * Copy follows CONTENT_REWRITE_v1.md Section 3.3.
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
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  artifacts: ModelArtifactOption[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
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

  // Sprint 5d Block A.3 — template parameter values keyed by
  // parameter_schema.key. When a template is selected, the form expands
  // to render inputs for each parameter; values flow into the output
  // summary template via resolveTemplateString().
  const [templateParamValues, setTemplateParamValues] = useState<
    Record<string, string>
  >({});

  const selectedArtifact = useMemo(
    () => artifacts.find((a) => a.id === artifactId) ?? null,
    [artifacts, artifactId],
  );
  const templateSchema: ParameterSchema | null = useMemo(
    () => parseParameterSchema(selectedArtifact?.template?.parameter_schema ?? null),
    [selectedArtifact],
  );

  // Reset template parameter values when the selected artifact changes.
  useEffect(() => {
    setTemplateParamValues({});
    setOutputSummaryTouched(false);
  }, [artifactId]);

  // Auto-generate output summary from template + parameters until banker
  // edits the field manually. Once edited, leave their text alone.
  useEffect(() => {
    const tmpl = selectedArtifact?.template?.output_summary_template ?? null;
    if (!tmpl) return;
    if (outputSummaryTouched) return;
    const resolved = resolveTemplateString(tmpl, templateSchema, templateParamValues);
    setOutputSummary(resolved);
  }, [selectedArtifact, templateSchema, templateParamValues, outputSummaryTouched]);

  // Group artifact options for the dropdown: templates by Track, then
  // any non-template (legacy Artifact) options last.
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
    if (!name.trim()) {
      setError("The model needs a name.");
      return;
    }
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
    startTransition(async () => {
      const result = await saveModel({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        model_name: name,
        built_with_member: builtWithMember!,
        artifact_id: artifactId === "" ? null : artifactId,
        parameters: parameters
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
    <div className="space-y-4">
      <Field label="What's the model called?" required>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Seasonal cashflow projection"
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
      </Field>

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
        label="Attach a template? (optional)"
        helper="If you used one of Blaze's pre-built templates, attach it here."
      >
        <select
          value={artifactId}
          onChange={(e) => setArtifactId(e.target.value)}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">— None —</option>
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
            <optgroup label="Other artifacts">
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
          <p className="mt-1 text-[11px] leading-snug text-blaze-grey-body">
            {selectedArtifact.template.description}
          </p>
          <div className="mt-3 space-y-3">
            {templateSchema.parameters.map((p) => (
              <TemplateParameterField
                key={p.key}
                param={p}
                value={templateParamValues[p.key] ?? ""}
                onChange={(v) => setTemplateParam(p.key, v)}
              />
            ))}
          </div>
        </div>
      )}

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
        {/* Block Q — banker-prose helper text per COMPLIANCE.md §10.2.
            Sprint 5d Block D — copy per Section 3.3. */}
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

      <div className="flex items-center gap-3 pt-2">
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
      </div>
      {error && (
        <p className="text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}

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
          {value || <span className="italic text-blaze-grey-soft">computed once inputs are filled</span>}
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
  const inputType =
    param.type === "currency" ||
    param.type === "decimal" ||
    param.type === "integer" ||
    param.type === "percentage"
      ? "text"
      : "text";
  const prefix = param.type === "currency" ? "$" : null;
  const suffix = param.type === "percentage" ? "%" : null;
  return (
    <label className="block">
      {labelNode}
      {helperNode}
      <div className="mt-1 flex items-center gap-1">
        {prefix && <span className="text-sm text-blaze-grey-body">{prefix}</span>}
        <input
          type={inputType}
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
