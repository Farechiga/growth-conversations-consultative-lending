"use client";

/*
 * AskSection — Sprint 4 §4.1c, Blocks A + B.
 *
 * The Ask phase capture surface for Growth Conversations. Combines:
 *   - Augmenting summary list of prior captured Signals (expand/edit pattern)
 *   - Four "+ Add" buttons for Goal / Blocker / Indecision / Trigger
 *   - Inline sub-forms with type-specific fields
 *   - Stage-by-stage Save via the saveAskCaptures Server Action
 *
 * Augmenting-summary discipline (per Sprint 3 architectural conversation):
 * prior captures stay visible — no "Show prior captures" toggle hiding
 * them — and the banker can extend (add new) or update (edit existing,
 * which creates a new Signal record + sets supersession on the prior).
 *
 * UI vocabulary mapping (per BUILD_LOG): the prompt's UI labels diverge
 * from the persisted enum values for severity / recency / confidence.
 * The mappings live in the SEVERITY_LABELS / RECENCY_LABELS /
 * CONFIDENCE_LABELS tables below; UI shows the prose label, the enum
 * value persists.
 *
 * Pattern lift: this component will be the template for SizeSection,
 * ShowSection, ResolveSection, ConnectSection (Sprint 4 Prompt 4.2).
 * Keep its shape clean — what's idiomatic here will be replicated four
 * more times.
 */

import { Fragment, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  saveAskCaptures,
  type SignalDraft,
  type SignalEdit,
} from "./actions";
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";

// ────────────────────────────────────────────────
// Types — server passes prior signals + topic options + member/banker ids
// ────────────────────────────────────────────────

export type AskTopic = {
  id: string;
  display_name: string;
  type: "goal" | "blocker" | "trigger" | "indecision";
};

export type AskPriorSignal = {
  id: string;
  type: "goal" | "blocker" | "trigger" | "indecision";
  topic_id: string;
  topic_display_name: string;
  their_words: string | null;
  // Sprint 4 §4.1d Block C — severity, recency, time_horizon nullable
  // per the per-type required-field discipline. Existing seed Signals
  // have non-null values; future captures from Indecision/Trigger
  // sub-forms may leave them null.
  severity: "manageable" | "painful" | "threatening" | null;
  recency: "recent" | "ongoing" | "chronic" | "hypothetical_future" | null;
  time_horizon:
    | "imminent"
    | "three_to_six_months"
    | "six_to_twelve_months"
    | "twelve_to_twenty_four_months"
    | "longer"
    | null;
  confidence: "member_stated" | "banker_inferred" | "unclear";
  magnitude: number | null;
  unit: string | null;
  frequency: string | null;
  captured_at: string; // ISO
  conversation_meeting_type: string;
  conversation_date: string; // ISO
  banker_display_name: string;
};

type SignalKind = "goal" | "blocker" | "trigger" | "indecision";

// Sprint 5a.1 Block G — factor-tag dropdowns. Each signal type maps to a
// BusinessFactor in the matrix; the tag value drives matrix-aware Track
// ranking. Lists copied verbatim from BUSINESS_FACTOR_MATRIX_v1.md
// Sections 1.5 / 2.x. Default "other" so banker omission doesn't block
// submission.
const FACTOR_TAG_OPTIONS: Record<SignalKind, Array<{ label: string; value: string }>> = {
  goal: [
    { label: "smooth seasonal revenue", value: "smooth_seasonal_revenue" },
    { label: "expand capacity", value: "expand_capacity" },
    { label: "acquire real estate", value: "acquire_real_estate" },
    { label: "diversify revenue", value: "diversify_revenue" },
    { label: "acquire equipment", value: "acquire_equipment" },
    { label: "refinance existing", value: "refinance_existing" },
    { label: "scale workforce", value: "scale_workforce" },
    { label: "other", value: "other" },
  ],
  blocker: [
    { label: "cashflow volatility", value: "cashflow_volatility" },
    { label: "customer concentration", value: "customer_concentration" },
    { label: "capacity limit", value: "capacity_limit" },
    { label: "aging equipment", value: "aging_equipment" },
    { label: "real estate", value: "real_estate" },
    { label: "workforce gap", value: "workforce_gap" },
    { label: "regulatory compliance", value: "regulatory_compliance" },
    { label: "other", value: "other" },
  ],
  indecision: [
    { label: "timing", value: "timing" },
    { label: "pricing", value: "pricing" },
    { label: "structure", value: "structure" },
    { label: "co-decision-maker input", value: "co_decision_maker_input" },
    { label: "external advisor input", value: "external_advisor_input" },
    { label: "risk tolerance", value: "risk_tolerance" },
    { label: "capacity to service debt", value: "capacity_to_service_debt" },
    { label: "other", value: "other" },
  ],
  trigger: [
    { label: "late-paying customer", value: "late_paying_customer" },
    { label: "capacity evaluation", value: "capacity_evaluation" },
    { label: "equipment breakdown", value: "equipment_breakdown" },
    { label: "customer growth announcement", value: "customer_growth_announcement" },
    { label: "regulatory change", value: "regulatory_change" },
    { label: "refinancing window", value: "refinancing_window" },
    { label: "acquisition opportunity", value: "acquisition_opportunity" },
    { label: "other", value: "other" },
  ],
};

// ────────────────────────────────────────────────
// UI vocabulary → schema enum mappings
//
// The prompt §A.3 specifies banker-facing labels that diverge from the
// existing SignalSeverity / Recency / SignalConfidence enums seeded in
// Sprint 1. Rather than churn the schema, we render the prompt's labels
// in the dropdowns and persist the existing enum values. The mapping is
// canonical here.
// ────────────────────────────────────────────────

const SEVERITY_OPTIONS_BY_TYPE: Record<
  SignalKind,
  Array<{ label: string; value: "manageable" | "painful" | "threatening" }>
> = {
  goal: [
    { label: "peripheral", value: "manageable" },
    { label: "important", value: "painful" },
    { label: "central", value: "threatening" },
  ],
  blocker: [
    { label: "manageable", value: "manageable" },
    { label: "painful", value: "painful" },
    { label: "acute", value: "threatening" },
  ],
  indecision: [
    { label: "manageable", value: "manageable" },
    { label: "painful", value: "painful" },
    { label: "acute", value: "threatening" },
  ],
  trigger: [
    { label: "low", value: "manageable" },
    { label: "moderate", value: "painful" },
    { label: "urgent", value: "threatening" },
  ],
};

const RECENCY_OPTIONS: Array<{
  label: string;
  value: "recent" | "ongoing" | "chronic" | "hypothetical_future";
}> = [
  { label: "recent", value: "recent" },
  { label: "ongoing", value: "ongoing" },
  { label: "historical", value: "chronic" },
  { label: "anticipated", value: "hypothetical_future" },
];

// Sprint 4 §4.1d Block C — Time horizon for forward-looking Trigger
// Signals. Display labels are friendly ("3-6 months"); enum values are
// identifier-safe ("three_to_six_months") to keep the persisted column
// human-readable.
const TIME_HORIZON_OPTIONS: Array<{
  label: string;
  value:
    | "imminent"
    | "three_to_six_months"
    | "six_to_twelve_months"
    | "twelve_to_twenty_four_months"
    | "longer";
}> = [
  { label: "imminent", value: "imminent" },
  { label: "3-6 months", value: "three_to_six_months" },
  { label: "6-12 months", value: "six_to_twelve_months" },
  { label: "12-24 months", value: "twelve_to_twenty_four_months" },
  { label: "longer", value: "longer" },
];

const CONFIDENCE_OPTIONS: Array<{
  label: string;
  value: "member_stated" | "banker_inferred" | "unclear";
}> = [
  { label: "member stated", value: "member_stated" },
  { label: "banker inferred", value: "banker_inferred" },
  { label: "banker observed", value: "banker_inferred" }, // §A.3 mapping
];

const MAGNITUDE_UNIT_OPTIONS = [
  "dollars",
  "count",
  "days",
  "months",
  "percentage",
] as const;

const MAGNITUDE_FREQUENCY_OPTIONS = [
  "per_month",
  "per_quarter",
  "annually",
  "one_time",
  "ongoing",
] as const;

const SIGNAL_KIND_LABEL: Record<SignalKind, string> = {
  goal: "Goal",
  blocker: "Blocker",
  trigger: "Trigger",
  indecision: "Indecision",
};

// 6-month staleness threshold per §B.6.
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

// Default-draft factory used when adding a new sub-form or starting an
// edit. Sprint 4 §4.2a fix #2 — every dropdown defaults to null so the
// form starts in a "nothing selected" state. Pre-populated defaults
// were biasing data: bankers leaving a default value in place
// triggered downstream prompts (e.g., "discuss with spouse" follow-up
// suggestions) that didn't apply to the actual conversation. The "no
// defaults; every selection is deliberate" rule applies uniformly to
// all four Signal types — Goal, Blocker, Indecision, Trigger.
//
// Per-type validation in `draftIsValid` (and server-side
// `validateSignalDraft`) enforces which fields must be set before
// save: Goal / Blocker require severity + recency + confidence; Trigger
// requires severity + time_horizon + confidence; Indecision requires
// only confidence (per Sprint 4 §4.1d Block C). The form rejects null
// where required.
function emptyDraft(type: SignalKind): SignalDraft {
  return {
    type,
    topic_id: "",
    their_words: null,
    severity: null,
    recency: null,
    time_horizon: null,
    confidence: null,
    magnitude: null,
    unit: null,
    frequency: null,
    factor_tag: null,
  };
}

function priorToDraft(p: AskPriorSignal): SignalDraft {
  return {
    type: p.type,
    topic_id: p.topic_id,
    their_words: p.their_words,
    severity: p.severity,
    recency: p.recency,
    time_horizon: p.time_horizon,
    confidence: p.confidence,
    magnitude: p.magnitude,
    unit: p.unit,
    frequency: p.frequency,
    // Edits don't pre-populate the factor tag; banker re-classifies on
    // each save. The companion FactorCapture chain is per-Signal, not
    // per-edit.
    factor_tag: null,
  };
}

// Sprint 4 §4.1d Block C — per-type validation mirrors the server-side
// validateSignalDraft in actions.ts. Universal: Topic + Source (=
// confidence). Goal/Blocker require severity + recency; Trigger
// requires severity + time_horizon; Indecision adds nothing beyond
// universals. Magnitude trio is conditional across all types.
function draftIsValid(d: SignalDraft): boolean {
  if (!d.topic_id) return false;
  if (!d.confidence) return false;
  if (d.type === "goal" || d.type === "blocker") {
    if (!d.severity || !d.recency) return false;
  }
  if (d.type === "trigger") {
    if (!d.severity || !d.time_horizon) return false;
  }
  if (d.magnitude !== null) {
    if (!d.unit || !d.frequency) return false;
  }
  return true;
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

type PendingNew = { temp_id: string; draft: SignalDraft };
type PendingEdit = { prior_signal_id: string; draft: SignalDraft };

export function AskSection({
  memberId,
  bankerId,
  conversationId,
  priorSignals,
  topicsByType,
  onSaveSuccess,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  priorSignals: AskPriorSignal[];
  topicsByType: Record<SignalKind, AskTopic[]>;
  // Sprint 4.7 Block L — optional callback for v2 drawer wrapper to
  // close the drawer after a successful save. v1 callers (Growth
  // Conversations page) leave this undefined; AskSection's standard
  // post-save behavior (router.refresh + clear pending state) runs in
  // both cases.
  onSaveSuccess?: () => void;
}) {
  const router = useRouter();
  const [pendingNew, setPendingNew] = useState<PendingNew[]>([]);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Sprint 4.7 Block Q — submit-time keyword scan over [FL:BANKER-PROSE]
  // their_words fields across pendingNew + pendingEdit. Pause save when
  // any field has matches; resume via dispatchSave on continue.
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
  } | null>(null);

  // Helpers for adding a new sub-form.
  function addNewSignal(type: SignalKind) {
    setPendingNew((current) => [
      ...current,
      { temp_id: crypto.randomUUID(), draft: emptyDraft(type) },
    ]);
    setError(null);
    setSuccess(null);
  }

  function updatePendingNew(temp_id: string, draft: SignalDraft) {
    setPendingNew((current) =>
      current.map((p) => (p.temp_id === temp_id ? { ...p, draft } : p)),
    );
  }

  function removePendingNew(temp_id: string) {
    setPendingNew((current) => current.filter((p) => p.temp_id !== temp_id));
  }

  function startEdit(prior: AskPriorSignal) {
    setPendingEdit({ prior_signal_id: prior.id, draft: priorToDraft(prior) });
    setExpandedSignalId(prior.id);
  }

  function cancelEdit() {
    setPendingEdit(null);
  }

  function updatePendingEdit(draft: SignalDraft) {
    if (pendingEdit) setPendingEdit({ ...pendingEdit, draft });
  }

  function commitSave() {
    setError(null);
    setSuccess(null);
    // Validate before submitting.
    const invalidNew = pendingNew.find((p) => !draftIsValid(p.draft));
    if (invalidNew) {
      setError("Some captures are missing required fields. Pick a Topic on each, and ensure Magnitude entries include unit + frequency.");
      return;
    }
    if (pendingEdit && !draftIsValid(pendingEdit.draft)) {
      setError("The edited capture is missing required fields.");
      return;
    }
    if (pendingNew.length === 0 && !pendingEdit) {
      setError("No captures to save.");
      return;
    }

    // Sprint 4.7 Block Q — scan their_words across all pending captures.
    // Aggregate per-field matches; if any, pause and surface modal.
    const scanFieldsWithMatches: ScanFieldResult[] = [];
    pendingNew.forEach((p, i) => {
      if (p.draft.their_words) {
        const matches = scanText(p.draft.their_words);
        if (matches.length > 0) {
          scanFieldsWithMatches.push({
            fieldName: `Ask.their_words[new #${i + 1}]`,
            matches,
          });
        }
      }
    });
    if (pendingEdit?.draft.their_words) {
      const matches = scanText(pendingEdit.draft.their_words);
      if (matches.length > 0) {
        scanFieldsWithMatches.push({
          fieldName: "Ask.their_words[edit]",
          matches,
        });
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
      const result = await saveAskCaptures({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        new_signals: pendingNew.map((p) => p.draft),
        edits: pendingEdit
          ? [
              {
                prior_signal_id: pendingEdit.prior_signal_id,
                draft: pendingEdit.draft,
              } as SignalEdit,
            ]
          : [],
      });
      if (result.ok) {
        const total =
          pendingNew.length + (pendingEdit ? 1 : 0);
        setSuccess(
          `Ask captures saved · ${total} Signal${total === 1 ? "" : "s"} recorded`,
        );
        setPendingNew([]);
        setPendingEdit(null);
        setExpandedSignalId(null);
        router.refresh();
        onSaveSuccess?.();
      } else {
        setError(result.error);
      }
    });
  }

  const hasPrior = priorSignals.length > 0;
  const isEmptyState =
    !hasPrior && pendingNew.length === 0 && !pendingEdit;

  return (
    <div>
      {/* ── Augmenting summary list (Block B) ── */}
      {hasPrior && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-blaze-grey-body">
            Captured signals ({priorSignals.length})
          </p>
          <ul className="space-y-2">
            {priorSignals.map((p) => {
              const expanded = expandedSignalId === p.id;
              const editing = pendingEdit?.prior_signal_id === p.id;
              const stale = isStale(p.captured_at);
              return (
                <li key={p.id} className="border-l-[3px] border-blaze-rule pl-3">
                  <div className="flex items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSignalId(expanded ? null : p.id)}
                      className="flex items-baseline gap-2 text-left"
                      aria-expanded={expanded}
                      aria-controls={`signal-${p.id}-detail`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block transition-transform ${
                          expanded ? "rotate-90" : ""
                        } text-blaze-grey-body`}
                      >
                        ›
                      </span>
                      <span className="text-xs uppercase tracking-wider text-blaze-grey-body">
                        {SIGNAL_KIND_LABEL[p.type]}
                      </span>
                      <span className="text-sm font-medium text-blaze-charcoal">
                        {p.topic_display_name}
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
                    <div id={`signal-${p.id}-detail`} className="mt-2 space-y-2">
                      <PriorDetail signal={p} />
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
                    <div id={`signal-${p.id}-detail`} className="mt-2">
                      <SignalSubForm
                        draft={pendingEdit.draft}
                        topics={topicsByType[pendingEdit.draft.type]}
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

      {/* ── Empty-state prompt (when no prior + no pending) ── */}
      {isEmptyState && (
        <p className="text-sm italic text-blaze-grey-body">
          No Signals captured yet for this conversation. Click + Add to begin.
        </p>
      )}

      {/* ── Pending new sub-forms ── */}
      {pendingNew.length > 0 && (
        <ul className="mt-4 space-y-3">
          {pendingNew.map((p) => (
            <li key={p.temp_id}>
              <SignalSubForm
                draft={p.draft}
                topics={topicsByType[p.draft.type]}
                onChange={(d) => updatePendingNew(p.temp_id, d)}
                onRemove={() => removePendingNew(p.temp_id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Add buttons ── Sprint 5d Block D — Type-of-statement label
          per CONTENT_REWRITE_v1 Section 3.1. */}
      <div className="mt-5">
        <p className="text-xs text-blaze-grey-body">What type of statement is this?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["goal", "blocker", "indecision", "trigger"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => addNewSignal(k)}
              className="rounded border border-blaze-rule bg-white px-3 py-1.5 text-xs font-medium text-blaze-orange-deep transition-colors hover:bg-blaze-cream"
            >
              + Add {SIGNAL_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Save / status ── */}
      {(pendingNew.length > 0 || pendingEdit) && (
        <div className="mt-6 flex items-center gap-3">
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
      {/* Sprint 4.7 Block Q — soft-advisory keyword scan modal. Renders
          only when their_words on any pending capture flagged terms. */}
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

function PriorDetail({ signal }: { signal: AskPriorSignal }) {
  // Sprint 4 §4.1d Block C — per-type expanded detail rendering.
  // Goal / Blocker: Impact + Timeframe + Source (always present).
  // Indecision: Source always; Impact + Timeframe shown only if captured.
  // Trigger: Impact + Time horizon (from time_horizon field) + Source.
  const sevLabel = signal.severity
    ? SEVERITY_OPTIONS_BY_TYPE[signal.type].find(
        (o) => o.value === signal.severity,
      )?.label ?? signal.severity
    : null;
  const recencyLabel = signal.recency
    ? RECENCY_OPTIONS.find((o) => o.value === signal.recency)?.label ??
      signal.recency
    : null;
  const timeHorizonLabel = signal.time_horizon
    ? TIME_HORIZON_OPTIONS.find((o) => o.value === signal.time_horizon)
        ?.label ?? signal.time_horizon
    : null;
  const confidenceLabel = CONFIDENCE_OPTIONS.find(
    (o) => o.value === signal.confidence,
  )?.label ?? signal.confidence.replace(/_/g, " ");
  const stale = isStale(signal.captured_at);

  // Build the inline metadata pieces in order, separated by middots.
  // Skipping null fields keeps the Indecision rendering clean (no
  // empty "Impact: —" placeholders).
  const pieces: ReactNode[] = [];
  if (sevLabel) {
    pieces.push(
      <span key="impact" className="inline-flex items-baseline gap-1.5">
        <span>Impact:</span>
        <strong className="font-medium text-blaze-charcoal">{sevLabel}</strong>
      </span>,
    );
  }
  if (signal.type === "trigger" && timeHorizonLabel) {
    pieces.push(
      <span key="timehorizon" className="inline-flex items-baseline gap-1.5">
        <span>Time horizon:</span>
        <strong className="font-medium text-blaze-charcoal">
          {timeHorizonLabel}
        </strong>
      </span>,
    );
  } else if (signal.type !== "trigger" && recencyLabel) {
    pieces.push(
      <span key="timeframe" className="inline-flex items-baseline gap-1.5">
        <span>Timeframe:</span>
        <strong className="font-medium text-blaze-charcoal">{recencyLabel}</strong>
      </span>,
    );
  }
  if (signal.magnitude !== null && signal.unit) {
    pieces.push(
      <span key="quantified" className="inline-flex items-baseline gap-1.5">
        <span>Quantified:</span>
        <strong className="font-semibold text-blaze-charcoal">
          {signal.unit === "dollars"
            ? `$${signal.magnitude.toLocaleString("en-US")}`
            : `${signal.magnitude} ${signal.unit.replace(/_/g, " ")}`}
          {signal.frequency
            ? `/${signal.frequency.replace(/_/g, " ")}`
            : ""}
        </strong>
      </span>,
    );
  }
  pieces.push(
    <span key="source" className="inline-flex items-baseline gap-1.5">
      <span>Source:</span>
      <strong className="font-medium text-blaze-charcoal">
        {confidenceLabel}
      </strong>
    </span>,
  );

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
      {signal.their_words && (
        <blockquote className="border-l-[3px] border-blaze-orange py-1 pl-3 text-sm italic text-blaze-grey-body">
          &ldquo;{signal.their_words}&rdquo;
        </blockquote>
      )}
      <p className="text-xs text-blaze-grey-body">
        Captured during:{" "}
        <span className="text-blaze-charcoal">
          {fmtDate(signal.conversation_date)} · {signal.conversation_meeting_type.replace(/_/g, " ")}
        </span>
        {" · "}
        Captured by:{" "}
        <span className="text-blaze-charcoal">{signal.banker_display_name}</span>
      </p>
      {stale && (
        <p className="text-xs italic text-blaze-grey-soft">
          This signal was captured more than 6 months ago. Confirm it still
          holds, or update with current information.
        </p>
      )}
    </div>
  );
}

function SignalSubForm({
  draft,
  topics,
  onChange,
  onRemove,
  removeLabel = "× Remove",
}: {
  draft: SignalDraft;
  topics: AskTopic[];
  onChange: (d: SignalDraft) => void;
  onRemove: () => void;
  removeLabel?: string;
}) {
  const sevOptions = SEVERITY_OPTIONS_BY_TYPE[draft.type];
  return (
    <div className="rounded border border-blaze-rule bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-blaze-charcoal">
          {SIGNAL_KIND_LABEL[draft.type]} signal
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-blaze-grey-body hover:text-blaze-danger"
        >
          {removeLabel}
        </button>
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Which kind specifically?" required>
          <select
            value={draft.topic_id}
            onChange={(e) => onChange({ ...draft, topic_id: e.target.value })}
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          >
            <option value="">Select…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="The Member's own words"
          helper="Capture what the Member actually said. Not your summary."
        >
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
            placeholder='What the Member actually said'
          />
        </Field>
        {/* Sprint 5a.1 Block G — factor-tag dropdown. Maps the signal
            to the matrix's BusinessFactor for this signal type. Drives
            Track ranking. Default "other" if not picked. */}
        <Field label="Matrix tag">
          <select
            value={draft.factor_tag ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                factor_tag: e.target.value === "" ? null : e.target.value,
              })
            }
            className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          >
            <option value="">(other)</option>
            {FACTOR_TAG_OPTIONS[draft.type].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        {/* Sprint 4 §4.1d Block C — per-type required-field discipline.
            Goal / Blocker: Impact + Timeframe + Source all required.
            Indecision: Impact + Timeframe both optional (no asterisk;
              dropdown default is "Select…").
            Trigger: Impact required, Time horizon (replacing Timeframe)
              required, Source required. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Impact" required={draft.type !== "indecision"}>
            <select
              value={draft.severity ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  severity:
                    e.target.value === ""
                      ? null
                      : (e.target.value as NonNullable<SignalDraft["severity"]>),
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              {/* Sprint 4 §4.2a fix #2 — always render "Select…" first
                  so the form opens with no pre-picked value across all
                  Signal types. */}
              <option value="">Select…</option>
              {sevOptions.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {draft.type === "trigger" ? (
            <Field label="Time horizon" required>
              <select
                value={draft.time_horizon ?? ""}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    time_horizon:
                      e.target.value === ""
                        ? null
                        : (e.target.value as NonNullable<
                            SignalDraft["time_horizon"]
                          >),
                  })
                }
                className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              >
                <option value="">Select…</option>
                {TIME_HORIZON_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field
              label="Timeframe"
              required={draft.type !== "indecision"}
            >
              <select
                value={draft.recency ?? ""}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    recency:
                      e.target.value === ""
                        ? null
                        : (e.target.value as NonNullable<
                            SignalDraft["recency"]
                          >),
                  })
                }
                className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              >
                {/* Sprint 4 §4.2a fix #2 — Select… empty option for
                    all Signal types; banker actively chooses. */}
                <option value="">Select…</option>
                {RECENCY_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Source" required>
            <select
              value={draft.confidence ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  confidence:
                    e.target.value === ""
                      ? null
                      : (e.target.value as NonNullable<
                          SignalDraft["confidence"]
                        >),
                })
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              {/* Sprint 4 §4.2a fix #2 — Select… empty option. */}
              <option value="">Select…</option>
              {CONFIDENCE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {/* Magnitude trio (optional). When magnitude is set, unit and
            frequency are required; the Server Action's transaction
            preserves this shape. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Magnitude (optional)">
            <input
              type="number"
              value={draft.magnitude ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange({
                  ...draft,
                  magnitude: v === "" ? null : Number(v),
                  // Clear unit/frequency when magnitude clears
                  unit: v === "" ? null : draft.unit,
                  frequency: v === "" ? null : draft.frequency,
                });
              }}
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              placeholder="e.g., 12000"
            />
          </Field>
          <Field label="Unit" required={draft.magnitude !== null}>
            <select
              value={draft.unit ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  unit: e.target.value === "" ? null : e.target.value,
                })
              }
              disabled={draft.magnitude === null}
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none disabled:bg-blaze-cream"
            >
              <option value="">Select…</option>
              {MAGNITUDE_UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frequency" required={draft.magnitude !== null}>
            <select
              value={draft.frequency ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  frequency: e.target.value === "" ? null : e.target.value,
                })
              }
              disabled={draft.magnitude === null}
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none disabled:bg-blaze-cream"
            >
              <option value="">Select…</option>
              {MAGNITUDE_FREQUENCY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
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
