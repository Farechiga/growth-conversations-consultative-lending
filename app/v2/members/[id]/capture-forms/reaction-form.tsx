"use client";

/*
 * + Reaction capture form — Sprint 4.7.2 Block F.
 *
 * Subsumes v1 Resolve's functionality at the v2 surface. Captures:
 *   - response_value (7 enum values, expanded from 5 in Block A)
 *   - member_quote (verbatim Member quote; subject to compliance scan)
 *   - show_event_id (optional reference to which artifact rendering
 *     this is a reaction to)
 *   - primary_concern (contextual taxonomy per COMPLIANCE.md §6.3 —
 *     8 open-thread values when response is engaged/leaning_yes/
 *     committed/skeptical/confused; 10 decline-reason values when
 *     response is declined/dismissive)
 *
 * primary_concern requiredness matches v1 NUANCED pattern:
 *   - Required for: skeptical, confused, leaning_yes, declined
 *   - Optional for:  engaged, committed, dismissive
 *
 * Auto-clear on context boundary: if banker switches response_value
 * across context boundaries (e.g., leaning_yes → declined, or vice
 * versa), the primary_concern dropdown clears to "Select…" because
 * the option set shifts to a different taxonomy.
 *
 * Field label switches contextually:
 *   - "Primary concern" for engaged/leaning_yes/committed/skeptical/confused
 *   - "Member's stated reason for declining" for declined/dismissive
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveReaction,
  type ReactionResponseValue,
} from "../actions";
import { scanText } from "@/lib/compliance-keywords";
import {
  ComplianceScanModal,
  type ScanFieldResult,
} from "@/app/_components/compliance-scan-modal";

export type ReactionShowEventOption = {
  id: string;
  label: string; // e.g., "Seasonal smoothing chart · Apr 8"
};

const RESPONSE_OPTIONS: Array<{ label: string; value: ReactionResponseValue }> = [
  { label: "engaged", value: "engaged" },
  { label: "leaning yes", value: "leaning_yes" },
  { label: "skeptical", value: "skeptical" },
  { label: "confused", value: "confused" },
  { label: "dismissive", value: "dismissive" },
  { label: "committed", value: "committed" },
  { label: "declined", value: "declined" },
];

// Sprint 4.7.2 Block F — contextual taxonomy per COMPLIANCE.md §6.3.
// The same 8 open-thread values match Sprint 4.6 ResolveSection's
// PRIMARY_CONCERN_OPTIONS_OPEN_THREAD; the same 10 decline-reason
// values match its PRIMARY_CONCERN_OPTIONS_DECLINE_REASON.
const PRIMARY_CONCERN_OPEN_THREAD: Array<{ label: string; value: string }> = [
  { label: "Pricing concern", value: "pricing_concern" },
  { label: "Terms concern", value: "terms_concern" },
  { label: "Timing concern", value: "timing_concern" },
  { label: "Needs household co-decision-maker input", value: "co_decision_maker_household" },
  { label: "Needs external advisor review", value: "external_advisor" },
  { label: "Needs co-owner / board input", value: "co_owner_or_board" },
  { label: "Service or capability concern", value: "service_or_capability_concern" },
  { label: "Other (open thread)", value: "other_open_thread" },
];

const PRIMARY_CONCERN_DECLINE_REASON: Array<{ label: string; value: string }> = [
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

const OPEN_THREAD_VALUES = new Set(
  PRIMARY_CONCERN_OPEN_THREAD.map((o) => o.value),
);
const DECLINE_REASON_VALUES = new Set(
  PRIMARY_CONCERN_DECLINE_REASON.map((o) => o.value),
);

const TERMINAL_NO_RESPONSES = new Set<ReactionResponseValue>([
  "declined",
  "dismissive",
]);
const NUANCED_RESPONSES = new Set<ReactionResponseValue>([
  "skeptical",
  "confused",
  "leaning_yes",
  "declined",
]);

function optionsForResponse(response: ReactionResponseValue | "") {
  if (response === "") return [];
  return TERMINAL_NO_RESPONSES.has(response)
    ? PRIMARY_CONCERN_DECLINE_REASON
    : PRIMARY_CONCERN_OPEN_THREAD;
}

function labelForResponse(response: ReactionResponseValue | ""): string {
  // Sprint 5d Block D — Section 3.4: primary concern label rewritten
  // banker-natural for both terminal and non-terminal contexts.
  return TERMINAL_NO_RESPONSES.has(response as ReactionResponseValue)
    ? "Why did they decline?"
    : "What did they raise as the main concern?";
}

export function ReactionForm({
  memberId,
  bankerId,
  conversationId,
  showEvents,
  defaultShowEventId,
  onSuccess,
  onCancel,
}: {
  memberId: string;
  bankerId: string;
  conversationId: string | null;
  showEvents: ReactionShowEventOption[];
  defaultShowEventId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [responseValue, setResponseValue] =
    useState<ReactionResponseValue | "">("");
  const [memberQuote, setMemberQuote] = useState("");
  const [primaryConcern, setPrimaryConcern] = useState<string>("");
  const [showEventId, setShowEventId] = useState<string>(
    defaultShowEventId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingScan, setPendingScan] = useState<{
    fieldsWithMatches: ScanFieldResult[];
  } | null>(null);

  const concernRequired =
    !!responseValue && NUANCED_RESPONSES.has(responseValue);
  const concernOptions = optionsForResponse(responseValue);
  const concernLabel = labelForResponse(responseValue);

  function handleResponseChange(newValue: ReactionResponseValue | "") {
    // Sprint 4.7.2 Block F — auto-clear primary_concern on context
    // boundary switch. The two contexts use disjoint enum sets
    // (open-thread vs decline-reason); a value valid in one context
    // may be invalid in the other.
    if (!newValue) {
      setPrimaryConcern("");
    } else if (primaryConcern) {
      const validSet = TERMINAL_NO_RESPONSES.has(newValue)
        ? DECLINE_REASON_VALUES
        : OPEN_THREAD_VALUES;
      if (!validSet.has(primaryConcern)) {
        setPrimaryConcern("");
      }
    }
    setResponseValue(newValue);
  }

  function commitSave() {
    setError(null);
    if (!responseValue) {
      setError("Pick a response value.");
      return;
    }
    if (concernRequired && !primaryConcern) {
      setError("Primary concern is required for this response.");
      return;
    }

    if (memberQuote.trim() !== "") {
      const matches = scanText(memberQuote);
      if (matches.length > 0) {
        setPendingScan({
          fieldsWithMatches: [
            { fieldName: "Reaction.member_quote", matches },
          ],
        });
        return;
      }
    }

    dispatchSave();
  }

  function dispatchSave() {
    setPendingScan(null);
    startTransition(async () => {
      const result = await saveReaction({
        member_id: memberId,
        banker_id: bankerId,
        conversation_id: conversationId,
        response_value: responseValue as ReactionResponseValue,
        member_quote: memberQuote.trim() === "" ? null : memberQuote,
        show_event_id: showEventId === "" ? null : showEventId,
        primary_concern: primaryConcern === "" ? null : primaryConcern,
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
      <Field label="How did they respond?" required>
        <select
          value={responseValue}
          onChange={(e) =>
            handleResponseChange(e.target.value as ReactionResponseValue | "")
          }
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">Select…</option>
          {RESPONSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Sprint 4.7.2 Block F — contextual primary_concern dropdown.
          Hidden until response is picked. Field label + option set
          switch on response context. */}
      {responseValue && (
        <label className="block">
          <span className="text-xs text-blaze-grey-body">
            {concernLabel}
            {concernRequired && (
              <span className="ml-1 text-blaze-orange-deep">*</span>
            )}
          </span>
          <span className="block text-[11px] italic text-blaze-grey-soft">
            Focus on what the Member said and the business factors driving
            their decision. Avoid notes about personal characteristics,
            household circumstances, or social context.
          </span>
          <select
            value={primaryConcern}
            onChange={(e) => setPrimaryConcern(e.target.value)}
            className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
          >
            <option value="">Select…</option>
            {concernOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-xs text-blaze-grey-body">
          What did they actually say? (optional)
        </span>
        <span className="block text-[11px] italic text-blaze-grey-soft">
          Capture verbatim what the Member said. Focus on the business factors
          driving their response. Avoid notes about personal characteristics.
        </span>
        <textarea
          value={memberQuote}
          onChange={(e) => setMemberQuote(e.target.value)}
          rows={3}
          placeholder='e.g., "That makes sense — the line just covers the dip."'
          className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm italic text-blaze-grey-body focus:border-blaze-orange focus:outline-none"
        />
      </label>

      <Field label="Reaction to (optional)">
        <select
          value={showEventId}
          onChange={(e) => setShowEventId(e.target.value)}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">— None —</option>
          {showEvents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-blaze-grey-soft">
          Link this Reaction to the Show that triggered it, if applicable.
        </p>
      </Field>

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
