"use client";

/*
 * Sprint 4.6 Block E — Capture discipline coach callout.
 *
 * Per COMPLIANCE.md §10.4 / §7.5 and Sprint 4.6 §E, this is the in-
 * product training surface for the F-7 banker-prose discipline. The
 * 100-word framing answers the "what should be in a member-file note?"
 * question and surfaces the regulator-readability heuristic ("would I
 * want a regulator, my compliance officer, or the Member themselves to
 * read this note?"). Per FFIEC examination practice, banker training
 * is itself a CMS element; making the training accessible at the
 * moment of capture is best-practice CMS design.
 *
 * Accessible from a footer-level affordance on the Growth Conversations
 * page. Click → renders a modal with the verbatim callout text + a
 * "Got it" action.
 *
 * Component is reusable for v2 (Sprint 4.7) — `/v2/members/[id]` will
 * surface the same content via the "show ?" coach affordance per
 * ARCHITECTURE_V2.md §11.
 */

import { useState } from "react";

export function CaptureDisciplineCallout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
      >
        Capture discipline ?
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="capture-discipline-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-xl rounded border border-blaze-rule bg-blaze-cream p-6 shadow-lg">
            <p
              id="capture-discipline-modal-title"
              className="text-xs font-semibold uppercase tracking-[0.06em] text-blaze-orange-deep"
            >
              Capture discipline
            </p>
            {/* Verbatim copy per COMPLIANCE.md §10.4 / Sprint 4.6 §E.1 */}
            <p className="mt-3 text-sm italic leading-relaxed text-blaze-charcoal">
              Captures in Member Signals are working notes for consultative
              conversations. The most useful captures focus on the Member's
              business situation, cashflow patterns, decision process, and
              stated concerns. Less useful — and potentially problematic —
              captures include personal characteristics, household details,
              or social context unrelated to business decisions. When in
              doubt, ask: would I want a regulator, my compliance officer,
              or the Member themselves to read this note?
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
