"use client";

/*
 * Sprint 5b.1 Block G — specialist handoff dialog.
 *
 * Opens when banker clicks the Layer 3 specialist-handoff CTA from
 * popup-as-workflow's Navigate top zone. Captures:
 *   - Department / team tag (required, dropdown)
 *   - Specific specialist preference notes (optional, free-text 200-char)
 *
 * Submit creates a SpecialistHandoff record (Sprint 5b.1 Block C
 * schema). Once recorded, the artifact appears in the sidebar artifact
 * section pattern (Pilot work — schema is in place; sidebar render is
 * scope-limited for demo).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSpecialistHandoff } from "./actions";

const DEPARTMENT_OPTIONS = [
  "CRE specialists",
  "SBA specialists",
  "Treasury management",
  "Commercial credit underwriting",
] as const;

export function SpecialistHandoffDialogInner({
  memberId,
  bankerId,
  trackId,
  trackName,
  onClose,
}: {
  memberId: string;
  bankerId: string;
  trackId: string;
  trackName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [department, setDepartment] = useState<string>("");
  const [preference, setPreference] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [recorded, setRecorded] = useState(false);

  function commit() {
    setError(null);
    if (!department) {
      setError("Pick a department / team.");
      return;
    }
    startTransition(async () => {
      const result = await saveSpecialistHandoff({
        member_id: memberId,
        banker_id: bankerId,
        track_id: trackId,
        department_tag: department,
        specialist_preference: preference.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecorded(true);
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="specialist-handoff-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-20"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded border border-blaze-rule bg-white p-6 shadow-xl"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="specialist-handoff-title"
            className="text-base font-semibold text-blaze-charcoal"
          >
            Hand off to a specialist for {trackName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-blaze-grey-body hover:text-blaze-charcoal"
            aria-label="Close handoff dialog"
          >
            × Close
          </button>
        </div>

        {recorded ? (
          <div className="mt-5 rounded border-l-[3px] border-blaze-orange bg-blaze-orange-pale/30 px-4 py-3">
            <p className="text-sm font-medium text-blaze-charcoal">
              Specialist handoff recorded.
            </p>
            <p className="mt-1 text-[12px] leading-snug text-blaze-grey-body">
              Status: initiated. Coordination with {department} can proceed.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs text-blaze-grey-body">
                Which team?
                <span className="ml-1 text-blaze-orange-deep">*</span>
              </span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              >
                <option value="">Select…</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-blaze-grey-body">
                Notes (optional)
              </span>
              <textarea
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                rows={3}
                maxLength={220}
                placeholder="A specific specialist you want? Notes about timing or context?"
                className="mt-1 w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
              />
            </label>
            <p className="rounded border border-blaze-rule bg-blaze-cream/40 px-3 py-2 text-[11px] italic leading-snug text-blaze-grey-body">
              Recording the handoff creates a tracking artifact. The specialist
              team is not auto-notified in the demo; coordination is initiated
              by the banker.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={commit}
                disabled={isPending || !department}
                className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
              >
                {isPending ? "Recording…" : "Save"}
              </button>
              <button
                type="button"
                onClick={onClose}
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
        )}
      </div>
    </div>
  );
}
