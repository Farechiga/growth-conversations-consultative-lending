/*
 * Breadcrumb navigation — Sprint 4 §4.1b C.
 *
 * Replaces the ad hoc "← Back to Member profile" link in the Growth
 * Conversations header with a structured path indicator. Renders below
 * the gradient bar, above the page heading, on:
 *   - Member profile (e.g., "Member Signals > Jenny's Catering")
 *   - Growth Conversations standalone ("Member Signals > Growth Conversations")
 *   - Growth Conversations prefilled
 *     ("Member Signals > Growth Conversations > Jenny's Catering")
 *
 * Visual identity (BLAZE_STYLE_GUIDE.md §14):
 *   - Clickable segments: burnished orange (--blaze-orange-deep), no
 *     underline by default, underline on hover.
 *   - Current-page segment: charcoal text, no link styling.
 *   - Separators: `›` chevron in muted grey (--blaze-grey-body).
 *   - 14px font / 6-8px spacing between segments and chevrons.
 */

import Link from "next/link";

export type BreadcrumbSegment =
  | { label: string; href: string }
  | { label: string; current: true };

export function Breadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {segments.map((s, i) => {
          const isCurrent = "current" in s && s.current;
          return (
            <li key={i} className="flex items-baseline gap-x-2">
              {i > 0 && (
                <span aria-hidden className="text-blaze-grey-body">
                  ›
                </span>
              )}
              {isCurrent ? (
                <span className="font-medium text-blaze-charcoal">
                  {s.label}
                </span>
              ) : (
                <Link
                  href={(s as { href: string }).href}
                  className="text-blaze-orange-deep underline-offset-2 hover:underline"
                >
                  {s.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
