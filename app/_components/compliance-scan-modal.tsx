"use client";

/*
 * Sprint 4.6 Block C — ComplianceScanModal: shared modal for the soft-
 * advisory keyword scan across [FL:BANKER-PROSE] form fields.
 *
 * Usage pattern (client form):
 *
 *   const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
 *
 *   function commitSave() {
 *     // ... validation ...
 *     // Scan all banker-prose fields; collect matches per field.
 *     const scanFields = [
 *       { fieldName: "Resolve.customer_response", text: draft.their_words },
 *       { fieldName: "Resolve.closing_notes",     text: draft.closing_notes },
 *       ...
 *     ];
 *     const matchesByField = scanFields
 *       .map(f => ({ ...f, matches: scanText(f.text ?? "") }))
 *       .filter(f => f.matches.length > 0);
 *
 *     if (matchesByField.length === 0) {
 *       proceedWithSave();
 *       return;
 *     }
 *     setPendingScan({ fields: matchesByField, savePayload: ... });
 *   }
 *
 * The modal renders itself when `pendingScan` is non-null and exposes
 * three actions:
 *   - Continue saving → records "continued" telemetry per fired field
 *     and calls onContinue (which proceeds with the save)
 *   - Edit the note → records "edited" telemetry and calls onEdit
 *     (which closes the modal; banker returns to form)
 *   - Cancel        → records "cancelled" telemetry and calls onCancel
 *     (which discards captures and closes the form)
 *
 * Telemetry firing happens here so callers don't repeat the wiring. The
 * server action is fire-and-forget; we do not await it before invoking
 * the action callback so banker-visible flow stays responsive.
 *
 * Visual treatment: full-screen overlay with centered card. Soft amber/
 * cream tone (not coral, not orange) — soft-advisory framing per
 * COMPLIANCE.md §7.3. Three actions horizontally arranged.
 */

import { useTransition } from "react";
import { recordComplianceScanEvent } from "@/lib/compliance-scan-action";
import {
  formatMatchedTermsForPrompt,
  KEYWORD_GROUP_LABELS,
  type MatchedTerm,
} from "@/lib/compliance-keywords";

export type ScanFieldResult = {
  fieldName: string;
  matches: MatchedTerm[];
};

export function ComplianceScanModal({
  bankerId,
  memberId,
  fieldsWithMatches,
  onContinue,
  onEdit,
  onCancel,
}: {
  bankerId: string;
  memberId: string | null;
  fieldsWithMatches: ScanFieldResult[];
  onContinue: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  // Aggregate all matched terms across fields for the prompt copy. The
  // soft-advisory text per COMPLIANCE.md §7.3 / Sprint 4.6 §C.4 names
  // the matched terms; we present them deduplicated and grouped.
  const allTerms = fieldsWithMatches.flatMap((f) => f.matches);
  const uniqueTerms: MatchedTerm[] = [];
  const seen = new Set<string>();
  for (const t of allTerms) {
    const key = t.term.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTerms.push(t);
    }
  }
  const termsList = formatMatchedTermsForPrompt(uniqueTerms);

  // Group terms by protected-class category for the secondary detail
  // line. Helps the banker understand which flag fired.
  const termsByGroup = new Map<MatchedTerm["group"], string[]>();
  for (const t of uniqueTerms) {
    const arr = termsByGroup.get(t.group) ?? [];
    arr.push(t.term);
    termsByGroup.set(t.group, arr);
  }

  function fireTelemetry(action: "continued" | "edited" | "cancelled") {
    // Record one event per (field, banker_action) tuple. Fire-and-forget;
    // we don't await the round-trip before transitioning the UI.
    for (const f of fieldsWithMatches) {
      recordComplianceScanEvent({
        banker_id: bankerId,
        field_name: f.fieldName,
        matched_terms: f.matches,
        banker_action: action,
        member_id: memberId,
      }).catch(() => {
        // Telemetry failure must not block the banker's flow. Swallow.
      });
    }
  }

  function handleContinue() {
    startTransition(() => {
      fireTelemetry("continued");
      onContinue();
    });
  }
  function handleEdit() {
    fireTelemetry("edited");
    onEdit();
  }
  function handleCancel() {
    fireTelemetry("cancelled");
    onCancel();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-scan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-xl rounded border border-blaze-rule bg-blaze-cream p-6 shadow-lg">
        <p
          id="compliance-scan-modal-title"
          className="text-xs font-semibold uppercase tracking-[0.06em] text-blaze-orange-deep"
        >
          Compliance check
        </p>
        <p className="mt-3 text-sm leading-relaxed text-blaze-charcoal">
          {/* Verbatim copy per COMPLIANCE.md §7.3 / Sprint 4.6 §C.4 */}
          This note mentions{" "}
          <span className="font-medium text-blaze-charcoal">{termsList}</span>.
          Lending decisions and capture should focus on observable business
          and cashflow factors. Personal characteristics, household
          circumstances, and social context tend not to belong in member
          files.
        </p>
        {termsByGroup.size > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-blaze-grey-body">
            {Array.from(termsByGroup.entries()).map(([group, terms]) => (
              <li key={group}>
                <span className="text-blaze-grey-soft">
                  {KEYWORD_GROUP_LABELS[group]}:
                </span>{" "}
                <span className="text-blaze-charcoal">{terms.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-blaze-charcoal">
          Continue saving, edit the note, or cancel?
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isPending}
            className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
          >
            Continue saving
          </button>
          <button
            type="button"
            onClick={handleEdit}
            disabled={isPending}
            className="rounded border border-blaze-rule bg-white px-3 py-2 text-sm font-medium text-blaze-charcoal transition-colors hover:bg-blaze-cream disabled:opacity-60"
          >
            Edit the note
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded bg-transparent px-3 py-2 text-sm font-medium text-blaze-grey-body transition-colors hover:underline disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
