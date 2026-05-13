/*
 * Shared header for Growth Conversations routes (Sprint 4 §C).
 *
 * Both /growth-conversations and /growth-conversations/[memberId] use the
 * same warm-cream header treatment as the Member profile so the system
 * reads as a single application. The header shows brand wordmark on the
 * left and banker identity on the right; navigation back to the Member
 * profile is handled by the breadcrumb component (Sprint 4 §4.1b C),
 * which renders below the gradient bar above the page heading.
 *
 * The `backToMemberSlug` prop is retained as a no-op for backwards
 * compatibility with call sites that still pass it; it's no longer used
 * for rendering.
 */

import Link from "next/link";
import { V2OptInLink } from "@/app/_components/v2-opt-in-link";

export function GrowthConversationsHeader({
  bankerName,
  memberSlug,
}: {
  bankerName: string;
  // Sprint 4 §4.1b C — back-link removed; breadcrumb supersedes. Prop
  // retained on callers but ignored here.
  backToMemberSlug?: string;
  // Sprint 4.7 Block A — when present, renders the "Try the new view →"
  // cross-link to the v2 workstation for this Member. The lookup page
  // (/growth-conversations) doesn't pass this; v2 has no equivalent
  // generic lookup, only per-Member workstations.
  memberSlug?: string;
}) {
  return (
    <header>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        {/* Sprint 4 §4.1d Block D — dropped the redundant
            "· Growth Conversations" inline suffix. The breadcrumb just
            below the gradient bar carries the navigation context (e.g.,
            "Member Signals › Growth Conversations › Jenny's Catering"),
            making the header-level repetition redundant. */}
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            <span className="text-blaze-orange-deep">Member</span>{" "}
            <span className="text-blaze-charcoal">Signals</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-blaze-charcoal">
          {memberSlug && (
            // Sprint 4.7 Q-X1 — opt-in cross-link via ?v2=true. Renders
            // nothing unless the flag is set; divider lives inside the
            // component so we don't orphan a separator when v1 is the
            // default un-flagged view.
            <V2OptInLink href={`/v2/members/${memberSlug}`} />
          )}
          <div>
            Logged in as <span className="font-medium">{bankerName}</span>
            <span className="ml-2 text-xs text-blaze-grey-body">Primary banker</span>
          </div>
        </div>
      </div>
    </header>
  );
}
