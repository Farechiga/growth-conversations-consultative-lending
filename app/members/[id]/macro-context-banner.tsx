"use client";

/*
 * MacroContextBanner — Sprint 4 §4.1d Block A.
 *
 * Surfaces a current Macro at the top of a Member profile when the
 * Member's Member Type matches the Macro's `affected_member_types`.
 * Per INSIGHT_ENGINE_DESIGN_NOTES.md §3 + §5, Macros are top-down
 * system-level briefings (market shifts, regulatory changes, sector
 * patterns) that bankers should be aware of when stepping into a
 * conversation.
 *
 * Banner positioning per the prompt §A.6: above the Suggested next
 * step card, below the page header. Visual treatment per §A.2:
 * subtle cream-tint background distinguishing it from the page
 * ground without competing; smaller orange section mark (~14px,
 * smaller than band marks); curator attribution + summary +
 * recommended-response copy + dismiss affordance.
 *
 * Dismissibility (§A.4): session-scoped via local component state.
 * Refreshing the page brings the banner back. Persistent dismissal
 * (per-banker preferences, expired-Macro auto-dismiss) is post-demo
 * work — logged as Q-032.
 */

import { useState } from "react";

export type MacroBannerData = {
  id: string;
  title: string;
  authored_label: string; // e.g., "Marcus Wei (Chief Economist)" or "Margot Desandre (Sector Specialist)"
  authored_at_iso: string;
  summary: string;
  recommended_response: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MacroContextBanner({ macro }: { macro: MacroBannerData }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <section
      aria-label="Macro context"
      className="relative border-y border-blaze-rule bg-blaze-cream/40 px-8 py-5"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline">
            {/* Smaller orange section mark per §A.2 — banner is a notification,
                not a content band, so the mark sits at ~14px (vs 24px for
                band marks). */}
            <span
              aria-hidden
              className="mr-2 inline-block h-3.5 w-[16px] bg-blaze-orange"
            />
            <p className="text-[15px] font-semibold leading-tight text-blaze-orange-deep">
              Macro context · {macro.title}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-blaze-grey-body transition-colors hover:text-blaze-charcoal"
            aria-label="Dismiss Macro context banner"
          >
            × Dismiss
          </button>
        </div>
        <p className="mt-1 text-xs text-blaze-grey-body">
          Authored by {macro.authored_label} on {fmtDate(macro.authored_at_iso)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-blaze-charcoal">
          {macro.summary}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
          <span className="font-medium">Recommended response:</span>{" "}
          {macro.recommended_response}
        </p>
        <div className="mt-3 text-right">
          {/* "View context →" placeholder. Sprint 5 will link to the
              Macro view in Insight Engine; for now href="#". */}
          <a
            href="#"
            className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
          >
            View context →
          </a>
        </div>
      </div>
    </section>
  );
}
