"use client";

/*
 * ResolveSection — Sprint 4 §4.2a Block C.
 *
 * The Resolve phase is the closure capture for a Track. Unlike Ask /
 * Size's multi-add pattern, Resolve is a single-fieldset form: one
 * Member-response capture per session, with conditional sub-captures
 * (Indecision Signal, ActionCard, or Closing notes) driven off the
 * response value.
 *
 * Conditional rendering per prompt §C.3:
 *   - committed / funded     → no Indecision, no ActionCard, no Closing notes.
 *                              The Member has decided; the Track moves to
 *                              Decision pending or Funded lifecycle.
 *   - declined / dismissive  → no ActionCard; "Closing notes" textarea
 *                              instead (saved to Conversation.banker_note).
 *   - engaged / leaning_yes  → ActionCard required (description + owner +
 *                              due_at). Indecision optional.
 *   - other (neutral /
 *     leaning_no / skeptical
 *     / confused)            → ActionCard optional. Indecision optional.
 *
 * Validation lives in client + server; the server-side guard
 * (validateResolveInput in actions.ts) is the safety net.
 *
 * View-mode vs edit-mode:
 *   - When the existing Recommendation already carries a response,
 *     view-mode summarizes the current capture (response chip, primary
 *     concern, source, any prior ActionCard) with an "Edit captures"
 *     button that toggles into edit-mode.
 *   - Edit-mode renders the full editable form pre-populated with
 *     current values. Save commits via saveResolveCaptures.
 */

import { Fragment, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  saveResolveCaptures,
  type SaveResolveInput,
} from "./actions";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export type ResolveBankerOption = {
  id: string;
  display_name: string;
};

export type ResolveIndecisionTopicOption = {
  id: string;
  display_name: string;
};

export type ResolveCurrentState = {
  recommendation_id: string;
  recommendation_label: string; // e.g., "Working Capital Line of Credit at $75K"
  response: SaveResolveInput["response"];
  primary_concern: SaveResolveInput["primary_concern"];
  their_words: string | null;
  // Most recent ActionCard linked to this Track (if any), for view-mode
  // summary. Edit-mode does not pre-populate from this — a new ActionCard
  // is captured per Resolve session.
  open_action_card: {
    id: string;
    rationale: string;
    owner_display_name: string;
    due_at_iso: string;
  } | null;
};

// ────────────────────────────────────────────────
// Vocabulary tables
// ────────────────────────────────────────────────

const RESPONSE_OPTIONS: Array<{
  label: string;
  value: SaveResolveInput["response"];
}> = [
  { label: "declined", value: "declined" },
  { label: "leaning no", value: "leaning_no" },
  { label: "dismissive", value: "dismissive" },
  { label: "skeptical", value: "skeptical" },
  { label: "confused", value: "confused" },
  { label: "neutral", value: "neutral" },
  { label: "engaged", value: "engaged" },
  { label: "leaning yes", value: "leaning_yes" },
  { label: "committed", value: "committed" },
  { label: "funded", value: "funded" },
];

// Sprint 4 §4.2a refinement #3 — Primary concern options are contextual.
//
// When the Member is on an open-thread response (engaged / leaning_yes /
// neutral / leaning_no / skeptical / confused), the dropdown surfaces
// reasons the deal is *not yet closed* — what's holding the Member back.
//
// When the Member declined or dismissed, the dropdown surfaces *why* —
// the closure context. Some values (rate, timing, bank_capability)
// appear in both sets with different banker-facing labels: e.g., "rate"
// is "Rate" (a hesitation factor) for an engaged Member but "Rate too
// high" (a decline reason) for a declined Member. The schema stores
// the same enum value either way; the contextual label resolution
// happens here in the form.
//
// The two sets are kept in code rather than a reference table for the
// demo; pilot phase may lift to a SizingDimension-style controlled
// vocabulary table if banking-product-specific reason taxonomies are
// needed.
const PRIMARY_CONCERN_OPTIONS_OPEN_THREAD: Array<{
  label: string;
  value: NonNullable<SaveResolveInput["primary_concern"]>;
}> = [
  { label: "rate", value: "rate" },
  { label: "speed", value: "speed" },
  { label: "commitment", value: "commitment" },
  { label: "spouse", value: "spouse" },
  { label: "CPA / accountant", value: "cpa" },
  { label: "partner", value: "partner" },
  { label: "timing", value: "timing" },
  { label: "bank capability", value: "bank_capability" },
  { label: "other", value: "other" },
  { label: "(none)", value: "none" },
];

const PRIMARY_CONCERN_OPTIONS_DECLINE_REASON: Array<{
  label: string;
  value: NonNullable<SaveResolveInput["primary_concern"]>;
}> = [
  { label: "Rate too high", value: "rate" },
  { label: "Terms unfavorable", value: "terms_unfavorable" },
  { label: "Going with competitor", value: "going_with_competitor" },
  { label: "No longer needed", value: "no_longer_needed" },
  { label: "Timing wrong", value: "timing" },
  { label: "Doesn't qualify (DTI / credit / collateral)", value: "does_not_qualify" },
  { label: "Doesn't trust the institution", value: "bank_capability" },
  { label: "Lost interest", value: "lost_interest" },
  { label: "Found alternative funding source", value: "found_alternative" },
  { label: "Business circumstances changed", value: "circumstances_changed" },
  { label: "Other", value: "other" },
];

const SOURCE_OPTIONS: Array<{
  label: string;
  value: SaveResolveInput["source"];
}> = [
  { label: "member stated", value: "member_stated" },
  { label: "banker observed", value: "banker_observed" },
];

const NUANCED_RESPONSES = new Set([
  "skeptical",
  "confused",
  "leaning_no",
  "declined",
  "leaning_yes",
]);
const ENGAGEMENT_RESPONSES = new Set(["engaged", "leaning_yes"]);
const TERMINAL_NO_RESPONSES = new Set(["declined", "dismissive"]);
const COMMITTED_RESPONSES = new Set(["committed", "funded"]);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Default due-at: 14 days from now, formatted YYYY-MM-DD for the date
// input. Demo-friendly default; banker can override.
function defaultDueAtIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

// Sprint 4 §4.2a fix #2 — DraftState widens response + source to allow
// null, so the form's initial state shows "Select…" rather than a
// pre-picked value. Validation in commitSave / saveResolveCaptures
// rejects null where required.
type DraftState = {
  response: SaveResolveInput["response"] | null;
  primary_concern: SaveResolveInput["primary_concern"];
  source: SaveResolveInput["source"] | null;
  their_words: string | null;
  // Indecision sub-form
  indecision_enabled: boolean;
  indecision_topic_id: string;
  indecision_words: string | null;
  // ActionCard sub-form
  action_card_enabled: boolean;
  action_card_description: string;
  action_card_owner_id: string;
  action_card_due_at_iso: string;
  // Closing notes (only used for terminal-no responses)
  closing_notes: string | null;
};

// Sprint 4 §4.2a fixes #1 + #2:
//   #1 — `their_words` (Customer response field) never pre-populates
//   from the prior Recommendation. The field is for capturing a *new*
//   reason for the current decision, not echoing the prior emotional
//   reaction. Always starts empty.
//
//   #2 — All dropdowns default to null ("Select…") rather than any
//   pre-picked value, including in edit mode. Banker re-saving
//   Resolve is making a fresh decision; the prior decision lives in
//   view-mode summary + the audit trail of GrowthStepExecutions.
//   Forcing re-selection prevents stale-default carry-forward.
//
// Conventional UX defaults that aren't domain-value bias remain:
//   - action_card_owner_id defaults to the current banker (the banker
//     filling out the form). This isn't a domain default that biases
//     analytics; it's "you are the default owner unless you hand off."
//   - action_card_due_at_iso defaults to a 14-day-from-today date.
//     A specific calendar pick is required to commit; the placeholder
//     is just a calendar-picker starting position.
function makeInitialDraft(primaryBankerId: string): DraftState {
  return {
    response: null,
    primary_concern: null,
    source: null,
    their_words: null,
    indecision_enabled: false,
    indecision_topic_id: "",
    indecision_words: null,
    action_card_enabled: false,
    action_card_description: "",
    action_card_owner_id: primaryBankerId,
    action_card_due_at_iso: defaultDueAtIso(),
    closing_notes: null,
  };
}

export function ResolveSection({
  memberId,
  bankerId,
  conversationId,
  resolveGrowthStepId,
  current,
  bankers,
  indecisionTopics,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  resolveGrowthStepId: string;
  current: ResolveCurrentState | null;
  bankers: ResolveBankerOption[];
  indecisionTopics: ResolveIndecisionTopicOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(current === null);
  const [draft, setDraft] = useState<DraftState>(() =>
    makeInitialDraft(bankerId),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function startEdit() {
    setDraft(makeInitialDraft(bankerId));
    setEditing(true);
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditing(current === null);
    setError(null);
  }

  function commitSave() {
    setError(null);
    setSuccess(null);

    // Sprint 4 §4.2a fix #2 — gate validation on the universal-required
    // dropdowns first. With null defaults, both response and source are
    // null until the banker picks; both must be set before downstream
    // per-response logic runs.
    if (!draft.response) {
      setError("Member response is required.");
      return;
    }
    if (!draft.source) {
      setError("Source is required.");
      return;
    }

    const isCommitted = COMMITTED_RESPONSES.has(draft.response);
    const isTerminalNo = TERMINAL_NO_RESPONSES.has(draft.response);
    const isEngagement = ENGAGEMENT_RESPONSES.has(draft.response);
    // Mirror the EditForm's derived visibility — engagement forces it
    // on, otherwise it tracks the banker's explicit toggle.
    const actionCardVisible = isEngagement || draft.action_card_enabled;

    if (NUANCED_RESPONSES.has(draft.response) && !draft.primary_concern) {
      setError("Primary concern is required for this response.");
      return;
    }
    if (isEngagement) {
      if (!draft.action_card_description.trim()) {
        setError(
          "Next step (ActionCard description) is required for engaged / leaning yes responses.",
        );
        return;
      }
      if (!draft.action_card_due_at_iso) {
        setError("ActionCard due date is required.");
        return;
      }
    }
    if (
      draft.indecision_enabled &&
      !draft.indecision_topic_id
    ) {
      setError("Pick an Indecision Topic, or uncheck the indecision capture.");
      return;
    }

    // After validation gates, response + source are non-null — narrow.
    const payload: SaveResolveInput = {
      member_id: memberId,
      banker_id: bankerId,
      conversation_id: conversationId,
      resolve_growth_step_id: resolveGrowthStepId,
      recommendation_id: current?.recommendation_id ?? null,
      response: draft.response,
      primary_concern: draft.primary_concern,
      source: draft.source,
      their_words: draft.their_words,
      indecision:
        !isCommitted && draft.indecision_enabled
          ? {
              topic_id: draft.indecision_topic_id,
              their_words: draft.indecision_words,
            }
          : null,
      action_card:
        !isCommitted && !isTerminalNo && actionCardVisible
          ? {
              description: draft.action_card_description,
              owner_id: draft.action_card_owner_id,
              due_at_iso: draft.action_card_due_at_iso,
            }
          : null,
      closing_notes: isTerminalNo ? draft.closing_notes : null,
    };

    startTransition(async () => {
      const result = await saveResolveCaptures(payload);
      if (result.ok) {
        setSuccess("Resolve captures saved");
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!editing && current) {
    return (
      <CurrentStateView
        current={current}
        onEdit={startEdit}
        success={success}
      />
    );
  }

  return (
    <EditForm
      current={current}
      draft={draft}
      update={update}
      bankers={bankers}
      indecisionTopics={indecisionTopics}
      isPending={isPending}
      onSave={commitSave}
      onCancel={cancelEdit}
      error={error}
    />
  );
}

// ────────────────────────────────────────────────
// View-mode summary
// ────────────────────────────────────────────────

function CurrentStateView({
  current,
  onEdit,
  success,
}: {
  current: ResolveCurrentState;
  onEdit: () => void;
  success: string | null;
}) {
  const responseLabel =
    RESPONSE_OPTIONS.find((o) => o.value === current.response)?.label ??
    current.response.replace(/_/g, " ");
  // Sprint 4 §4.2a refinement #3 — view-mode concern label resolves
  // against the contextual option set the value most likely came from.
  // Decline-reason options take precedence when the response is
  // declined / dismissive; otherwise open-thread labels apply. Falls
  // back to the raw enum value if neither matches (defensive).
  const isTerminalNoCurrent = TERMINAL_NO_RESPONSES.has(current.response);
  const concernLabel = current.primary_concern
    ? (isTerminalNoCurrent
        ? PRIMARY_CONCERN_OPTIONS_DECLINE_REASON
        : PRIMARY_CONCERN_OPTIONS_OPEN_THREAD
      ).find((o) => o.value === current.primary_concern)?.label ??
      current.primary_concern.replace(/_/g, " ")
    : null;
  const concernFieldLabel = isTerminalNoCurrent ? "Decline reason" : "Primary concern";

  const pieces: ReactNode[] = [];
  pieces.push(
    <span key="response" className="inline-flex items-baseline gap-1.5">
      <span>Member response:</span>
      <strong className="font-medium text-blaze-charcoal">
        {responseLabel}
      </strong>
    </span>,
  );
  if (concernLabel && concernLabel !== "(none)") {
    pieces.push(
      <span key="concern" className="inline-flex items-baseline gap-1.5">
        <span>{concernFieldLabel}:</span>
        <strong className="font-medium text-blaze-charcoal">
          {concernLabel}
        </strong>
      </span>,
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-blaze-grey-body">
        Member response on:{" "}
        <span className="text-blaze-charcoal">{current.recommendation_label}</span>
      </p>
      <p className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-xs text-blaze-grey-body">
        {pieces.map((piece, i) => (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden>·</span>}
            {piece}
          </Fragment>
        ))}
      </p>
      {current.their_words && (
        <blockquote className="border-l-[3px] border-blaze-orange py-1 pl-3 text-sm italic text-blaze-grey-body">
          &ldquo;{current.their_words}&rdquo;
        </blockquote>
      )}
      {current.open_action_card && (
        <div className="border-l-[3px] border-blaze-rule pl-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-blaze-grey-body">
            Open ActionCard
          </p>
          <p className="mt-1 text-blaze-charcoal">
            {current.open_action_card.rationale}
          </p>
          <p className="mt-1 text-xs text-blaze-grey-body">
            owned by {current.open_action_card.owner_display_name} · due{" "}
            {fmtDate(current.open_action_card.due_at_iso)}
          </p>
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
        >
          Edit captures
        </button>
      </div>
      {success && (
        <p
          className="text-sm text-blaze-orange-deep"
          role="status"
          aria-live="polite"
        >
          {success}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Edit form
// ────────────────────────────────────────────────

function EditForm({
  current,
  draft,
  update,
  bankers,
  indecisionTopics,
  isPending,
  onSave,
  onCancel,
  error,
}: {
  current: ResolveCurrentState | null;
  draft: DraftState;
  update: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void;
  bankers: ResolveBankerOption[];
  indecisionTopics: ResolveIndecisionTopicOption[];
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
  error: string | null;
}) {
  // Sprint 4 §4.2a fix #2 — null response means "no value picked yet";
  // conditional sub-form rendering is gated on a real response selection.
  // Until banker picks one, the form shows only the universal-required
  // fields (Member response, Source, Customer response).
  const isCommitted = !!draft.response && COMMITTED_RESPONSES.has(draft.response);
  const isTerminalNo = !!draft.response && TERMINAL_NO_RESPONSES.has(draft.response);
  const isEngagement = !!draft.response && ENGAGEMENT_RESPONSES.has(draft.response);
  const concernRequired = !!draft.response && NUANCED_RESPONSES.has(draft.response);

  // Sprint 4 §4.2a refinement bug fix #1 — ActionCard fieldset visibility
  // is derived from (response is engagement) OR (banker explicitly
  // checked the optional capture box). Engagement responses force the
  // fieldset visible because ActionCard is required there; the checkbox
  // is disabled in that mode so it can't be toggled off. Non-engagement
  // responses leave the choice to the banker via the toggle.
  //
  // Root cause of the prior bug: the fieldset was gated on
  // `draft.action_card_enabled` directly, which starts false (per fix #2's
  // "no defaults" rule). The checkbox was `disabled` for engagement
  // responses but `checked` was bound to the underlying false state, so
  // the banker couldn't toggle it on AND it stayed off. Result: fieldset
  // never appeared, save failed validation. Fix: derive visibility.
  const actionCardVisible = isEngagement || draft.action_card_enabled;

  return (
    <div>
      {current && (
        <p className="mb-3 text-xs text-blaze-grey-body">
          Member response on:{" "}
          <span className="text-blaze-charcoal">
            {current.recommendation_label}
          </span>
        </p>
      )}
      <div className="rounded border border-blaze-rule bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Member response" required>
            <select
              value={draft.response ?? ""}
              onChange={(e) =>
                update(
                  "response",
                  e.target.value === ""
                    ? null
                    : (e.target.value as SaveResolveInput["response"]),
                )
              }
              className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
            >
              {/* Sprint 4 §4.2a fix #2 — Select… empty option. */}
              <option value="">Select…</option>
              {RESPONSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {/* Sprint 4 §4.2a refinement #3 — contextual Primary concern.
              Field label and option set switch on response value: open-
              thread reasons for engagement-spectrum responses; decline
              reasons + relabeled "Decline reason" for declined /
              dismissive. Hidden entirely when response is null (banker
              hasn't picked a response yet). */}
          {draft.response && (
            <Field
              label={isTerminalNo ? "Decline reason" : "Primary concern"}
              required={concernRequired}
            >
              <select
                value={draft.primary_concern ?? ""}
                onChange={(e) =>
                  update(
                    "primary_concern",
                    e.target.value === ""
                      ? null
                      : (e.target.value as NonNullable<
                          SaveResolveInput["primary_concern"]
                        >),
                  )
                }
                className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              >
                <option value="">Select…</option>
                {(isTerminalNo
                  ? PRIMARY_CONCERN_OPTIONS_DECLINE_REASON
                  : PRIMARY_CONCERN_OPTIONS_OPEN_THREAD
                ).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="mt-3">
          <Field label="Source" required>
            <select
              value={draft.source ?? ""}
              onChange={(e) =>
                update(
                  "source",
                  e.target.value === ""
                    ? null
                    : (e.target.value as SaveResolveInput["source"]),
                )
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
        </div>
        <div className="mt-3">
          {/* Sprint 4 §4.2a fix #1 — relabeled "Direct quote" to
              "Customer response" with helper text. The field captures the
              *reason* for the decision, not the emotional reaction. Never
              pre-populates from the prior Recommendation; always starts
              empty so each save reflects a fresh decision rationale. */}
          <label className="block">
            <span className="text-xs text-blaze-grey-body">
              Customer response
            </span>
            <span className="block text-[11px] italic text-blaze-grey-soft">
              What factor caused this decision?
            </span>
            <textarea
              value={draft.their_words ?? ""}
              onChange={(e) =>
                update(
                  "their_words",
                  e.target.value === "" ? null : e.target.value,
                )
              }
              rows={2}
              className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm italic text-blaze-grey-body focus:border-blaze-orange focus:outline-none"
              placeholder='e.g., "I hadn’t realized the line of credit could absorb my whole slow season"'
            />
          </label>
        </div>

        {/* Conditional sub-captures based on response value. Hidden
            entirely until a response is picked. */}
        {isCommitted && (
          <p className="mt-4 text-xs italic text-blaze-grey-body">
            The Member has committed or funded; no follow-up capture is needed.
          </p>
        )}

        {isTerminalNo && (
          <div className="mt-4">
            <Field label="Closing notes (optional)">
              <textarea
                value={draft.closing_notes ?? ""}
                onChange={(e) =>
                  update(
                    "closing_notes",
                    e.target.value === "" ? null : e.target.value,
                  )
                }
                rows={3}
                className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                placeholder="Why the Member declined; whether to revisit later; any context for the next banker who picks up the relationship"
              />
            </Field>
          </div>
        )}

        {!isCommitted && !isTerminalNo && (
          <>
            {/* Indecision sub-form */}
            <div className="mt-5 rounded border border-blaze-rule p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-blaze-charcoal">
                <input
                  type="checkbox"
                  checked={draft.indecision_enabled}
                  onChange={(e) =>
                    update("indecision_enabled", e.target.checked)
                  }
                  className="accent-blaze-orange"
                />
                Capture an open indecision
              </label>
              {draft.indecision_enabled && (
                <div className="mt-3 space-y-3">
                  <Field label="Indecision Topic" required>
                    <select
                      value={draft.indecision_topic_id}
                      onChange={(e) =>
                        update("indecision_topic_id", e.target.value)
                      }
                      className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                    >
                      <option value="">Select…</option>
                      {indecisionTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.display_name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="What the Member said (optional)">
                    <textarea
                      value={draft.indecision_words ?? ""}
                      onChange={(e) =>
                        update(
                          "indecision_words",
                          e.target.value === "" ? null : e.target.value,
                        )
                      }
                      rows={2}
                      className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm italic text-blaze-grey-body focus:border-blaze-orange focus:outline-none"
                      placeholder='e.g., "I need to talk to my partner before I commit"'
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* ActionCard sub-form. Visibility derived from
                actionCardVisible (engagement → forced on; otherwise
                user-controlled via the checkbox). */}
            <div className="mt-3 rounded border border-blaze-rule p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-blaze-charcoal">
                <input
                  type="checkbox"
                  checked={actionCardVisible}
                  onChange={(e) =>
                    update("action_card_enabled", e.target.checked)
                  }
                  className="accent-blaze-orange"
                  disabled={isEngagement /* required for engagement */}
                />
                {isEngagement
                  ? "Next step (required)"
                  : "Capture a next-step ActionCard"}
              </label>
              {actionCardVisible && (
                <div className="mt-3 space-y-3">
                  <Field label="Description" required={isEngagement}>
                    <textarea
                      value={draft.action_card_description}
                      onChange={(e) =>
                        update("action_card_description", e.target.value)
                      }
                      rows={2}
                      className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                      placeholder="What the banker commits to do next, e.g., 'Send LOC application materials Friday; follow up Tuesday'"
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Owner" required={isEngagement}>
                      <select
                        value={draft.action_card_owner_id}
                        onChange={(e) =>
                          update("action_card_owner_id", e.target.value)
                        }
                        className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                      >
                        {bankers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.display_name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Due date" required={isEngagement}>
                      <input
                        type="date"
                        value={draft.action_card_due_at_iso}
                        onChange={(e) =>
                          update("action_card_due_at_iso", e.target.value)
                        }
                        className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Resolve captures"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded bg-transparent px-3 py-2 text-sm font-medium text-blaze-grey-body transition-colors hover:bg-blaze-cream disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Field helper
// ────────────────────────────────────────────────

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
