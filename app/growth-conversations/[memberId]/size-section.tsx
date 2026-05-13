"use client";

/*
 * SizeSection — Sprint 4 §4.2a Block B.
 *
 * The Size phase capture surface. Track-agnostic quantification of
 * impact / opportunity emerging from Ask-phase Signals. A single Size
 * session can produce zero or many SizingMeasurement records.
 *
 * Pattern lift from AskSection (4.1c):
 *   - Augmenting summary list of prior captures (collapsed rows + expand/edit)
 *   - "+ Add measurement" button → adds a new sub-form
 *   - Multi-add: multiple sub-forms can be pending in one save
 *   - At most one in-progress edit at a time
 *   - Save commits all pending captures atomically via saveSizeCaptures
 *   - Supersession audit trail on edit (prior row retained immutably)
 *   - Stale cue at 6 months (italic + " · stale" suffix + tooltip)
 *
 * Differences from AskSection:
 *   - One sub-form type (no Goal / Blocker / Trigger / Indecision split)
 *   - SizingDimension dropdown sourced from a reference table (parallel
 *     to Topic for Signal); not hardcoded
 *   - Frequency required only for rate-based units (dollars / count / hours)
 *   - Confidence is optional with friendly fallback rendering
 */

import { Fragment, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  saveSizeCaptures,
  type SizingMeasurementDraft,
  type SizingMeasurementEdit,
} from "./actions";
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";

// ────────────────────────────────────────────────
// Types — server passes these in
// ────────────────────────────────────────────────

export type SizeDimensionOption = {
  id: string;
  key: string;
  display_name: string;
  description: string;
};

// Saved-measurement shape — unit + source are non-null because the
// validator (server + client) rejects null on save. Confidence stays
// nullable since it's optional. The Draft type allows null for in-form
// state; the Prior type narrows to the post-validation shape.
export type SizePriorMeasurement = {
  id: string;
  dimension_id: string;
  dimension_display_name: string;
  magnitude: number;
  unit: NonNullable<SizingMeasurementDraft["unit"]>;
  frequency: string | null;
  source: NonNullable<SizingMeasurementDraft["source"]>;
  their_words: string | null;
  confidence: SizingMeasurementDraft["confidence"];
  time_period: string | null;
  methodology_note: string | null;
  captured_at: string; // ISO
  conversation_meeting_type: string;
  conversation_date: string; // ISO
  banker_display_name: string;
};

// ────────────────────────────────────────────────
// Vocabulary tables — banker-facing labels paired with persisted values
// ────────────────────────────────────────────────

const UNIT_OPTIONS: Array<{
  label: string;
  value: NonNullable<SizingMeasurementDraft["unit"]>;
}> = [
  { label: "dollars", value: "dollars" },
  { label: "count", value: "count" },
  { label: "days", value: "days" },
  { label: "months", value: "months" },
  { label: "percentage", value: "percentage" },
  { label: "hours", value: "hours" },
];

const FREQUENCY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "per month", value: "per_month" },
  { label: "per quarter", value: "per_quarter" },
  { label: "annually", value: "annually" },
  { label: "one time", value: "one_time" },
  { label: "ongoing", value: "ongoing" },
  { label: "cumulative", value: "cumulative" },
];

const SOURCE_OPTIONS: Array<{
  label: string;
  value: NonNullable<SizingMeasurementDraft["source"]>;
}> = [
  { label: "member stated", value: "member_stated" },
  { label: "member's records", value: "member_records" },
  { label: "banker calculated", value: "banker_calculated" },
  { label: "market reference", value: "market_reference" },
];

const CONFIDENCE_OPTIONS: Array<{
  label: string;
  value: NonNullable<SizingMeasurementDraft["confidence"]>;
}> = [
  { label: "high", value: "high" },
  { label: "moderate", value: "moderate" },
  { label: "low", value: "low" },
  { label: "banker estimate", value: "banker_estimate" },
];

// 6-month staleness threshold (mirrors Ask form per §B.7).
const STALE_DAYS = 180;

function isStale(captured_at: string): boolean {
  const ms = Date.now() - new Date(captured_at).getTime();
  return ms > STALE_DAYS * 24 * 60 * 60 * 1000;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Frequency required only for rate-based units (dollars / count / hours)
// per prompt §B.4. Other units (days / months / percentage) accept null.
function frequencyRequired(unit: SizingMeasurementDraft["unit"]): boolean {
  return unit === "dollars" || unit === "count" || unit === "hours";
}

// Sprint 4 §4.2a fix #2 — every dropdown defaults to null so the form
// opens with "Select…" placeholders rather than pre-picked values.
// Magnitude is NaN (renders as empty input). The "no defaults; every
// selection is deliberate" rule prevents bias from leftover defaults
// flowing into Insight Engine analytics.
function emptyDraft(): SizingMeasurementDraft {
  return {
    dimension_id: "",
    magnitude: null,
    unit: null,
    frequency: null,
    source: null,
    their_words: null,
    confidence: null,
    time_period: null,
    methodology_note: null,
  };
}

function priorToDraft(p: SizePriorMeasurement): SizingMeasurementDraft {
  return {
    dimension_id: p.dimension_id,
    magnitude: p.magnitude,
    unit: p.unit,
    frequency: p.frequency,
    source: p.source,
    their_words: p.their_words,
    confidence: p.confidence,
    time_period: p.time_period,
    methodology_note: p.methodology_note,
  };
}

function draftIsValid(d: SizingMeasurementDraft): boolean {
  if (!d.dimension_id) return false;
  if (d.magnitude === null || d.magnitude === undefined || Number.isNaN(d.magnitude)) return false;
  if (!d.unit) return false;
  if (!d.source) return false;
  if (frequencyRequired(d.unit) && !d.frequency) return false;
  return true;
}

// Helper for the magnitude/unit/frequency phrase format. The pre-fix
// signature took non-null unit; widening to accept the nullable draft
// shape lets the same helper render both the saved-row title (where
// unit is non-null) and any future preview where it might be null.
// Currently called only from the saved-row path, so the runtime path
// always hits a non-null unit.

// Format a magnitude + unit + frequency tuple into a banker-readable
// summary phrase. Used in the collapsed row title for saved
// measurements (where unit is always non-null post-validation).
function formatMagnitudePhrase(d: {
  magnitude: number;
  unit: NonNullable<SizingMeasurementDraft["unit"]>;
  frequency: string | null;
}): string {
  const value =
    d.unit === "dollars"
      ? `$${d.magnitude.toLocaleString("en-US")}`
      : d.unit === "percentage"
      ? `${d.magnitude}%`
      : `${d.magnitude} ${d.unit}`;
  const freq = d.frequency ? ` ${d.frequency.replace(/_/g, " ")}` : "";
  return `${value}${freq}`;
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

type PendingNew = { temp_id: string; draft: SizingMeasurementDraft };
type PendingEdit = { prior_measurement_id: string; draft: SizingMeasurementDraft };

export function SizeSection({
  memberId,
  bankerId,
  conversationId,
  priorMeasurements,
  dimensions,
  onSaveSuccess,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  priorMeasurements: SizePriorMeasurement[];
  dimensions: SizeDimensionOption[];
  // Sprint 4.7 Block L — optional callback for v2 drawer wrapper.
  onSaveSuccess?: () => void;
}) {
  const router = useRouter();
  const [pendingNew, setPendingNew] = useState<PendingNew[]>([]);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Sprint 4.7 Block Q — submit-time keyword scan over their_words +
  // methodology_note across pending captures.
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
  } | null>(null);

  function addNew() {
    setPendingNew((current) => [
      ...current,
      { temp_id: crypto.randomUUID(), draft: emptyDraft() },
    ]);
    setError(null);
    setSuccess(null);
  }

  function updatePendingNew(temp_id: string, draft: SizingMeasurementDraft) {
    setPendingNew((current) =>
      current.map((p) => (p.temp_id === temp_id ? { ...p, draft } : p)),
    );
  }

  function removePendingNew(temp_id: string) {
    setPendingNew((current) => current.filter((p) => p.temp_id !== temp_id));
  }

  function startEdit(prior: SizePriorMeasurement) {
    setPendingEdit({
      prior_measurement_id: prior.id,
      draft: priorToDraft(prior),
    });
    setExpandedId(prior.id);
  }

  function cancelEdit() {
    setPendingEdit(null);
  }

  function updatePendingEdit(draft: SizingMeasurementDraft) {
    if (pendingEdit) setPendingEdit({ ...pendingEdit, draft });
  }

  function commitSave() {
    setError(null);
    setSuccess(null);
    const invalidNew = pendingNew.find((p) => !draftIsValid(p.draft));
    if (invalidNew) {
      setError(
        "Some measurements are missing required fields. Pick a Topic / dimension, set Magnitude, Unit, and Source on each. Frequency is required for dollar / count / hour measurements.",
      );
      return;
    }
    if (pendingEdit && !draftIsValid(pendingEdit.draft)) {
      setError("The edited measurement is missing required fields.");
      return;
    }
    if (pendingNew.length === 0 && !pendingEdit) {
      setError("No measurements to save.");
      return;
    }

    // Sprint 4.7 Block Q — scan their_words + methodology_note across
    // all pending captures.
    const scanFieldsWithMatches: ScanFieldResult[] = [];
    pendingNew.forEach((p, i) => {
      if (p.draft.their_words) {
        const matches = scanText(p.draft.their_words);
        if (matches.length > 0) {
          scanFieldsWithMatches.push({
            fieldName: `Quantify.their_words[new #${i + 1}]`,
            matches,
          });
        }
      }
      if (p.draft.methodology_note) {
        const matches = scanText(p.draft.methodology_note);
        if (matches.length > 0) {
          scanFieldsWithMatches.push({
            fieldName: `Quantify.methodology_note[new #${i + 1}]`,
            matches,
          });
        }
      }
    });
    if (pendingEdit) {
      if (pendingEdit.draft.their_words) {
        const matches = scanText(pendingEdit.draft.their_words);
        if (matches.length > 0) {
          scanFieldsWithMatches.push({
            fieldName: "Quantify.their_words[edit]",
            matches,
          });
        }
      }
      if (pendingEdit.draft.methodology_note) {
        const matches = scanText(pendingEdit.draft.methodology_note);
        if (matches.length > 0) {
          scanFieldsWithMatches.push({
            fieldName: "Quantify.methodology_note[edit]",
            matches,
          });
        }
      }
    }
    if (scanFieldsWithMatches.length > 0) {
      setPendingScan({ fieldsWithMatches: scanFieldsWithMatches });
      return;
    }

    dispatchSave();
  }

  function dispatchSave() {
    setPendingScan(null);
    startTransition(async () => {
      const result = await saveSizeCaptures({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        new_measurements: pendingNew.map((p) => p.draft),
        edits: pendingEdit
          ? [
              {
                prior_measurement_id: pendingEdit.prior_measurement_id,
                draft: pendingEdit.draft,
              } as SizingMeasurementEdit,
            ]
          : [],
      });
      if (result.ok) {
        const total = pendingNew.length + (pendingEdit ? 1 : 0);
        setSuccess(
          `Size captures saved · ${total} measurement${
            total === 1 ? "" : "s"
          } recorded`,
        );
        setPendingNew([]);
        setPendingEdit(null);
        setExpandedId(null);
        router.refresh();
        onSaveSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  const hasPrior = priorMeasurements.length > 0;
  const isEmptyState = !hasPrior && pendingNew.length === 0 && !pendingEdit;

  return (
    <div>
      {/* Augmenting summary list */}
      {hasPrior && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-blaze-grey-body">
            Captured measurements ({priorMeasurements.length})
          </p>
          <ul className="space-y-2">
            {priorMeasurements.map((p) => {
              const expanded = expandedId === p.id;
              const editing = pendingEdit?.prior_measurement_id === p.id;
              const stale = isStale(p.captured_at);
              return (
                <li key={p.id} className="border-l-[3px] border-blaze-rule pl-3">
                  <div className="flex items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : p.id)}
                      className="flex flex-wrap items-baseline gap-2 text-left"
                      aria-expanded={expanded}
                      aria-controls={`measurement-${p.id}-detail`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block transition-transform ${
                          expanded ? "rotate-90" : ""
                        } text-blaze-grey-body`}
                      >
                        ›
                      </span>
                      <span className="text-sm font-medium text-blaze-charcoal">
                        {p.dimension_display_name}
                      </span>
                      <span className="text-sm text-blaze-charcoal">
                        · {formatMagnitudePhrase(p)}
                      </span>
                      <span
                        className={
                          stale
                            ? "text-xs italic text-blaze-grey-soft"
                            : "text-xs text-blaze-grey-body"
                        }
                        title={
                          stale
                            ? "Captured more than 6 months ago. Consider verifying or updating."
                            : undefined
                        }
                      >
                        {fmtDate(p.captured_at)}
                        {stale && " · stale"}
                      </span>
                    </button>
                  </div>

                  {expanded && !editing && (
                    <div
                      id={`measurement-${p.id}-detail`}
                      className="mt-2 space-y-2"
                    >
                      <PriorDetail measurement={p} />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
                        >
                          Edit captures
                        </button>
                      </div>
                    </div>
                  )}

                  {editing && pendingEdit && (
                    <div id={`measurement-${p.id}-detail`} className="mt-2">
                      <MeasurementSubForm
                        draft={pendingEdit.draft}
                        dimensions={dimensions}
                        onChange={updatePendingEdit}
                        onRemove={cancelEdit}
                        removeLabel="Cancel edit"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty-state prompt */}
      {isEmptyState && (
        <p className="text-sm italic text-blaze-grey-body">
          No measurements captured yet for this conversation. Click + Add
          measurement to begin.
        </p>
      )}

      {/* Pending new sub-forms */}
      {pendingNew.length > 0 && (
        <ul className="mt-4 space-y-3">
          {pendingNew.map((p) => (
            <li key={p.temp_id}>
              <MeasurementSubForm
                draft={p.draft}
                dimensions={dimensions}
                onChange={(d) => updatePendingNew(p.temp_id, d)}
                onRemove={() => removePendingNew(p.temp_id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add button — single, since Size has one sub-form type */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addNew}
          className="rounded border border-blaze-rule bg-white px-3 py-1.5 text-xs font-medium text-blaze-orange-deep transition-colors hover:bg-blaze-cream"
        >
          + Add measurement
        </button>
      </div>

      {/* Save / status */}
      {(pendingNew.length > 0 || pendingEdit) && (
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={commitSave}
            disabled={isPending}
            className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save Size captures"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingNew([]);
              setPendingEdit(null);
              setError(null);
            }}
            disabled={isPending}
            className="rounded bg-transparent px-3 py-2 text-sm font-medium text-blaze-grey-body transition-colors hover:bg-blaze-cream disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      )}
      {error && (
        <p className="mt-3 text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p
          className="mt-3 text-sm text-blaze-orange-deep"
          role="status"
          aria-live="polite"
        >
          {success}
        </p>
      )}
      {/* Sprint 4.7 Block Q — soft-advisory keyword scan modal. */}
      {pendingScan && (
        <ComplianceScanModal
          bankerId={bankerId}
          memberId={memberId}
          fieldsWithMatches={pendingScan.fieldsWithMatches}
          onContinue={dispatchSave}
          onEdit={() => setPendingScan(null)}
          onCancel={() => {
            setPendingScan(null);
            setPendingNew([]);
            setPendingEdit(null);
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function PriorDetail({ measurement: m }: { measurement: SizePriorMeasurement }) {
  const sourceLabel =
    SOURCE_OPTIONS.find((o) => o.value === m.source)?.label ??
    m.source.replace(/_/g, " ");
  const confidenceLabel = m.confidence
    ? CONFIDENCE_OPTIONS.find((o) => o.value === m.confidence)?.label ??
      m.confidence
    : null;
  const stale = isStale(m.captured_at);

  // Build inline metadata pieces; skip nulls so the row stays clean.
  const pieces: ReactNode[] = [];
  pieces.push(
    <span key="source" className="inline-flex items-baseline gap-1.5">
      <span>Source:</span>
      <strong className="font-medium text-blaze-charcoal">{sourceLabel}</strong>
    </span>,
  );
  if (confidenceLabel) {
    pieces.push(
      <span key="confidence" className="inline-flex items-baseline gap-1.5">
        <span>Confidence:</span>
        <strong className="font-medium text-blaze-charcoal">
          {confidenceLabel}
        </strong>
      </span>,
    );
  }
  if (m.time_period) {
    pieces.push(
      <span key="period" className="inline-flex items-baseline gap-1.5">
        <span>Time period:</span>
        <strong className="font-medium text-blaze-charcoal">
          {m.time_period}
        </strong>
      </span>,
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <p className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-xs text-blaze-grey-body">
        {pieces.map((piece, i) => (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden>·</span>}
            {piece}
          </Fragment>
        ))}
      </p>
      {m.their_words && (
        <blockquote className="border-l-[3px] border-blaze-orange py-1 pl-3 text-sm italic text-blaze-grey-body">
          &ldquo;{m.their_words}&rdquo;
        </blockquote>
      )}
      {m.methodology_note && (
        <p className="text-xs text-blaze-grey-body">
          <span className="font-medium text-blaze-charcoal">Methodology:</span>{" "}
          {m.methodology_note}
        </p>
      )}
      <p className="text-xs text-blaze-grey-body">
        Captured during:{" "}
        <span className="text-blaze-charcoal">
          {fmtDate(m.conversation_date)} ·{" "}
          {m.conversation_meeting_type.replace(/_/g, " ")}
        </span>
        {" · "}
        Captured by:{" "}
        <span className="text-blaze-charcoal">{m.banker_display_name}</span>
      </p>
      {stale && (
        <p className="text-xs italic text-blaze-grey-soft">
          This measurement was captured more than 6 months ago. Confirm it
          still holds, or update with current information.
        </p>
      )}
    </div>
  );
}

function MeasurementSubForm({
  draft,
  dimensions,
  onChange,
  onRemove,
  removeLabel = "× Remove",
}: {
  draft: SizingMeasurementDraft;
  dimensions: SizeDimensionOption[];
  onChange: (d: SizingMeasurementDraft) => void;
  onRemove: () => void;
  removeLabel?: string;
}) {
  const freqRequired = frequencyRequired(draft.unit);
  return (
    <div className="rounded border border-blaze-rule bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-blaze-charcoal">Measurement</p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-blaze-grey-body hover:text-blaze-danger"
        >
          {removeLabel}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Topic / dimension" required>
          <select
            value={draft.dimension_id}
            onChange={(e) =>
              onChange({ ...draft, dimension_id: e.target.value })
            }
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Magnitude" required>
            <input
              type="number"
              value={
                draft.magnitude === null || Number.isNaN(draft.magnitude)
                  ? ""
                  : draft.magnitude
              }
              onChange={(e) =>
                onChange({
                  ...draft,
                  magnitude:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              placeholder="e.g., 48000"
            />
          </Field>
          <Field label="Unit" required>
            <select
              value={draft.unit ?? ""}
              onChange={(e) => {
                const newUnit =
                  e.target.value === ""
                    ? null
                    : (e.target.value as NonNullable<
                        SizingMeasurementDraft["unit"]
                      >);
                onChange({
                  ...draft,
                  unit: newUnit,
                  // If the new unit doesn't require frequency and the
                  // banker hadn't picked one, leave frequency null.
                  // Otherwise preserve the existing pick.
                  frequency:
                    newUnit && !frequencyRequired(newUnit) && draft.frequency === null
                      ? null
                      : draft.frequency,
                });
              }}
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              {/* Sprint 4 §4.2a fix #2 — Select… empty option. */}
              <option value="">Select…</option>
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frequency" required={freqRequired}>
            <select
              value={draft.frequency ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  frequency: e.target.value === "" ? null : e.target.value,
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              <option value="">{freqRequired ? "Select…" : "(none)"}</option>
              {FREQUENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Source" required>
            <select
              value={draft.source ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  source:
                    e.target.value === ""
                      ? null
                      : (e.target.value as NonNullable<
                          SizingMeasurementDraft["source"]
                        >),
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              {/* Sprint 4 §4.2a fix #2 — Select… empty option. */}
              <option value="">Select…</option>
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Confidence (optional)">
            <select
              value={draft.confidence ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  confidence:
                    e.target.value === ""
                      ? null
                      : (e.target.value as NonNullable<
                          SizingMeasurementDraft["confidence"]
                        >),
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              <option value="">Select…</option>
              {CONFIDENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Direct quote (optional)">
          <textarea
            value={draft.their_words ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                their_words: e.target.value === "" ? null : e.target.value,
              })
            }
            rows={2}
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm italic text-blaze-grey-body focus:border-blaze-orange focus:outline-none"
            placeholder='What the Member said when stating the value'
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Time period (optional)">
            <input
              type="text"
              value={draft.time_period ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  time_period:
                    e.target.value === "" ? null : e.target.value,
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              placeholder="e.g., Q3 2025, trailing 12 months"
            />
          </Field>
          <Field label="Methodology note (optional)">
            <input
              type="text"
              value={draft.methodology_note ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  methodology_note:
                    e.target.value === "" ? null : e.target.value,
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              placeholder="e.g., Cross-referenced QuickBooks with verbal estimate"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-blaze-grey-body">
        {label}
        {required && <span className="ml-1 text-blaze-orange-deep">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
