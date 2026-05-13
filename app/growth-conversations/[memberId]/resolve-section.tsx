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
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";

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

// Sprint 4.6 Block A — Compliance posture floor primary_concern options.
//
// Refactored from the v1 hybrid taxonomy to a strict business-factor-only
// taxonomy per COMPLIANCE.md §6 and the resolved Q-041. Two contextual
// option sets, with `service_or_capability_concern` shared between them:
//
//   Open-thread (engaged / leaning_yes / committed): 8 values reflecting
//     business-decision-process facts. Field label: "Primary concern".
//
//   Decline-reason (declined / dismissive): 10 values reflecting member-
//     stated business reasons for declining. Field label: "Member's
//     stated reason for declining".
//
// All values are member-direction. Bank-side underwriting determinations
// (`does_not_qualify`, etc.) are not part of this taxonomy — they're
// deferred to Q-042 governance. Stigmatizing language ("doesn't trust
// the institution", "doesn't qualify") removed for UDAAP and Reg B
// §1002.9 hygiene.
const PRIMARY_CONCERN_OPTIONS_OPEN_THREAD: Array<{
  label: string;
  value: NonNullable<SaveResolveInput["primary_concern"]>;
}> = [
  { label: "Pricing concern", value: "pricing_concern" },
  { label: "Terms concern", value: "terms_concern" },
  { label: "Timing concern", value: "timing_concern" },
  { label: "Needs household co-decision-maker input", value: "co_decision_maker_household" },
  { label: "Needs external advisor review", value: "external_advisor" },
  { label: "Needs co-owner / board input", value: "co_owner_or_board" },
  { label: "Service or capability concern", value: "service_or_capability_concern" },
  { label: "Other (open thread)", value: "other_open_thread" },
];

const PRIMARY_CONCERN_OPTIONS_DECLINE_REASON: Array<{
  label: string;
  value: NonNullable<SaveResolveInput["primary_concern"]>;
}> = [
  { label: "Pricing uncompetitive", value: "pricing_uncompetitive" },
  { label: "Terms uncompetitive", value: "terms_uncompetitive" },
  { label: "Timing misaligned", value: "timing_misaligned" },
  { label: "Chose alternative lender", value: "chose_alternative_lender" },
  { label: "Chose alternative funding", value: "chose_alternative_funding" },
  { label: "Need resolved otherwise", value: "need_resolved_otherwise" },
  { label: "Need no longer present", value: "need_no_longer_present" },
  { label: "Wants to revisit later", value: "wants_to_revisit_later" },
  { label: "Service or capability concern", value: "service_or_capability_concern" },
  { label: "Other (member-stated)", value: "other_member_stated" },
];

// Set of values valid in each context — used for auto-clear when the
// banker switches Response across contexts and the existing concern
// value is no longer valid in the new dropdown.
const OPEN_THREAD_VALUES = new Set(
  PRIMARY_CONCERN_OPTIONS_OPEN_THREAD.map((o) => o.value),
);
const DECLINE_REASON_VALUES = new Set(
  PRIMARY_CONCERN_OPTIONS_DECLINE_REASON.map((o) => o.value),
);

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
  onSaveSuccess,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  resolveGrowthStepId: string;
  current: ResolveCurrentState | null;
  bankers: ResolveBankerOption[];
  indecisionTopics: ResolveIndecisionTopicOption[];
  // Sprint 4.7 Block L — optional callback for v2 drawer wrapper.
  onSaveSuccess?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(current === null);
  const [draft, setDraft] = useState<DraftState>(() =>
    makeInitialDraft(bankerId),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Sprint 4.6 Block C — pending scan state. Non-null when the
  // submit-time keyword scan flagged terms in any [FL:BANKER-PROSE]
  // field; the modal renders and the underlying save is paused. The
  // payload is captured here so onContinue can resume the save without
  // re-running validation.
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
    payload: SaveResolveInput;
  } | null>(null);

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

    // Sprint 4.6 Block C — submit-time keyword scan over
    // [FL:BANKER-PROSE] fields. Three fields scanned: Customer
    // response (their_words), Closing notes, and the ActionCard
    // description (when the ActionCard sub-form is visible). If any
    // matches, pause the save and show the soft-advisory modal; the
    // modal's onContinue handler resumes by calling dispatchSave.
    const scanFields: Array<{ fieldName: string; text: string | null }> = [
      { fieldName: "Resolve.customer_response", text: draft.their_words },
    ];
    if (isTerminalNo) {
      scanFields.push({
        fieldName: "Resolve.closing_notes",
        text: draft.closing_notes,
      });
    }
    if (!isCommitted && !isTerminalNo && actionCardVisible) {
      scanFields.push({
        fieldName: "Resolve.action_card_description",
        text: draft.action_card_description,
      });
    }
    const fieldsWithMatches: ScanFieldResult[] = scanFields
      .map((f) => ({
        fieldName: f.fieldName,
        matches: f.text ? scanText(f.text) : [],
      }))
      .filter((f) => f.matches.length > 0);

    if (fieldsWithMatches.length > 0) {
      setPendingScan({ fieldsWithMatches, payload });
      return;
    }

    dispatchSave(payload);
  }

  // Performs the actual saveResolveCaptures dispatch + post-save UI
  // updates. Called either directly from commitSave (when the scan
  // returns no matches) or from the ComplianceScanModal's onContinue
  // (after the banker confirms the soft-advisory prompt).
  function dispatchSave(payload: SaveResolveInput) {
    setPendingScan(null);
    startTransition(async () => {
      const result = await saveResolveCaptures(payload);
      if (result.ok) {
        setSuccess("Resolve captures saved");
        setEditing(false);
        router.refresh();
        onSaveSuccess?.();
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
    <>
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
      {/* Sprint 4.6 Block C — soft-advisory keyword scan modal. Renders
          only when the scan flagged terms in any [FL:BANKER-PROSE]
          field. onContinue resumes the paused save; onEdit returns the
          banker to the form (modal closes, no save); onCancel discards
          the entire capture (modal closes + form resets). */}
      {pendingScan && (
        <ComplianceScanModal
          bankerId={bankerId}
          memberId={memberId}
          fieldsWithMatches={pendingScan.fieldsWithMatches}
          onContinue={() => dispatchSave(pendingScan.payload)}
          onEdit={() => setPendingScan(null)}
          onCancel={() => {
            setPendingScan(null);
            setDraft(makeInitialDraft(bankerId));
            setEditing(current === null);
          }}
        />
      )}
    </>
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
  // Sprint 4.6 Block A — view-mode field label switches contextually.
  // "Primary concern" for engaged-spectrum; "Member's stated reason for
  // declining" for declined / dismissive (per COMPLIANCE.md §8 explicit
  // member-direction framing).
  const concernFieldLabel = isTerminalNoCurrent
    ? "Member's stated reason for declining"
    : "Primary concern";

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
              onChange={(e) => {
                const newResponse =
                  e.target.value === ""
                    ? null
                    : (e.target.value as SaveResolveInput["response"]);
                update("response", newResponse);
                // Sprint 4.6 Block A.2 — auto-clear primary_concern
                // when the response change moves across contexts and
                // the existing concern value is no longer in the new
                // dropdown's option set. Addresses the watch-item
                // flagged in the previous turn's BUILD_LOG: a banker
                // who picked an open-thread value then switched to
                // declined would otherwise see an empty-looking
                // dropdown carrying a now-invalid value. React batches
                // these two `update` calls inside the same event
                // handler (React 18+), so the result is a single
                // re-render with both fields updated.
                if (!newResponse) {
                  // Clearing response also clears concern (concern
                  // dropdown is hidden when response is null anyway).
                  if (draft.primary_concern) update("primary_concern", null);
                } else if (draft.primary_concern) {
                  const validSet = TERMINAL_NO_RESPONSES.has(newResponse)
                    ? DECLINE_REASON_VALUES
                    : OPEN_THREAD_VALUES;
                  if (!validSet.has(draft.primary_concern)) {
                    update("primary_concern", null);
                  }
                }
              }}
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
              label={isTerminalNo ? "Member's stated reason for declining" : "Primary concern"}
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
              "Customer response". Sprint 4.6 Block B — helper text
              updated to the verbatim COMPLIANCE.md §10.2 framing. The
              banker-prose discipline ([FL:BANKER-PROSE]) anchors the
              field on observable business factors and steers away from
              personal-characteristic capture. Permanent (not
              dismissible). Field never pre-populates from prior
              Recommendation; each save captures a fresh rationale. */}
          <label className="block">
            <span className="text-xs text-blaze-grey-body">
              Customer response
            </span>
            <span className="block text-[11px] italic text-blaze-grey-soft">
              Focus on what the Member said and the business factors driving their decision. Avoid notes about personal characteristics, household circumstances, or social context.
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
            {/* Sprint 4.6 Block B — banker-prose helper text
                ([FL:BANKER-PROSE]) per COMPLIANCE.md §10.2. Permanent;
                not dismissible. Closing notes is the explicit free-
                text safety valve for context that doesn't fit the
                decline-reason taxonomy (per Q-042 / COMPLIANCE.md §5
                Pre-application observation handling). The framing
                pushes capture toward business-cashflow factors. */}
            <label className="block">
              <span className="text-xs text-blaze-grey-body">
                Closing notes (optional)
              </span>
              <span className="block text-[11px] italic text-blaze-grey-soft">
                Focus on observable business and cashflow factors: financing structure, timing, terms, costs, alternatives, business situation, decision process.
              </span>
              <textarea
                value={draft.closing_notes ?? ""}
                onChange={(e) =>
                  update(
                    "closing_notes",
                    e.target.value === "" ? null : e.target.value,
                  )
                }
                rows={3}
                className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                placeholder="Why the Member declined; whether to revisit later; any context for the next banker who picks up the relationship"
              />
            </label>
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
                  {/* Sprint 4.6 Block B — banker-prose helper text
                      ([FL:BANKER-PROSE]) per COMPLIANCE.md §10.2. The
                      ActionCard description surfaces in operational
                      queues + Member-facing follow-up communications;
                      keeping it business-action-focused is doubly
                      important for UDAAP hygiene. */}
                  <label className="block">
                    <span className="text-xs text-blaze-grey-body">
                      Description{" "}
                      {isEngagement && (
                        <span className="ml-1 text-blaze-orange-deep">*</span>
                      )}
                    </span>
                    <span className="block text-[11px] italic text-blaze-grey-soft">
                      Describe the business action and timing. Avoid notes about the Member's personal characteristics.
                    </span>
                    <textarea
                      value={draft.action_card_description}
                      onChange={(e) =>
                        update("action_card_description", e.target.value)
                      }
                      rows={2}
                      className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
                      placeholder="What the banker commits to do next, e.g., 'Send LOC application materials Friday; follow up Tuesday'"
                    />
                  </label>
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
