"use client";

/*
 * Member lookup — Sprint 4 §D.
 *
 * Standalone-entry path for Growth Conversations. Banker types a Member
 * name (legal_name, dba, or slug); matching results render below.
 * Clicking a result navigates to /growth-conversations/[slug].
 *
 * Search is client-side filtering over the banker's portfolio (passed in
 * by the server component as `members`). For the demo Scott has three
 * Members; Production-scale would page or virtualize. Empty query shows
 * all of the banker's Members.
 */

import { useMemo, useState } from "react";
import Link from "next/link";

export type LookupMember = {
  id: string;
  slug: string;
  legal_name: string;
  doing_business_as: string | null;
  member_type_name: string;
  stage: string;
  last_touch_at: string | null; // ISO string for serialization across server/client boundary
  // Sprint 4 §4.1b B — action notifications inline on the lookup row.
  // Counts are computed server-side and passed in. Member.active_signal_count
  // is denormalized from seed-time derivation; open_opportunity_count
  // counts active engaged Recommendations (response in engaged | leaning_yes
  // | committed; not declined / funded).
  active_signal_count: number;
  open_opportunity_count: number;
};

export function MemberLookup({ members }: { members: LookupMember[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      return (
        m.legal_name.toLowerCase().includes(q) ||
        (m.doing_business_as ?? "").toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
      );
    });
  }, [query, members]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Member name…"
        className="w-full max-w-xl border border-blaze-rule bg-white px-4 py-3 text-base text-blaze-charcoal placeholder-blaze-grey-soft focus:border-blaze-orange focus:outline-none focus:ring-2 focus:ring-blaze-orange/20"
        aria-label="Search Members"
      />

      {/* Empty-state and result-list rendering. With three Members in the
          demo, every state is reachable via the search box: full list when
          empty; filtered list when typing; "no Members match" when typo. */}
      {members.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-blaze-grey-body">
          You have no Members in your portfolio yet. Once Members are
          assigned to you, you&apos;ll be able to start Growth Conversations
          from here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 max-w-xl text-sm italic text-blaze-grey-body">
          No Members match your search.
        </p>
      ) : (
        <ul className="mt-6 max-w-xl divide-y divide-blaze-rule">
          {filtered.map((m) => {
            // Sprint 4 §4.1b B — two clickable affordances per row:
            //   1. Row body (name + metadata): primary action → start
            //      Growth Conversation for this Member.
            //   2. Action-notifications line: secondary action → view
            //      Member profile.
            // The row is NOT one big <Link> wrapping everything anymore;
            // we use a relative container with an absolute "stretched"
            // link covering name+metadata, and the action-notifications
            // text sits above the stretched link with its own <Link>.
            const hasActionNotifications =
              m.active_signal_count > 0 || m.open_opportunity_count > 0;
            return (
              <li key={m.id} className="relative py-3">
                {/* Stretched link — covers the row body but is layered
                    behind the action-notifications link above. The
                    nested-anchor accessibility caveat (links inside
                    links) is avoided because the action-notifications
                    line uses z-index to stack above the stretched
                    link's covered area. */}
                <Link
                  href={`/growth-conversations/${m.slug}`}
                  className="group/lookup absolute inset-0 transition-colors duration-150 hover:bg-[rgba(180,95,38,0.04)]"
                  aria-label={`Start Growth Conversation with ${m.doing_business_as ?? m.legal_name}`}
                />
                <p className="relative pointer-events-none text-base font-semibold text-blaze-charcoal">
                  {m.doing_business_as ?? m.legal_name}
                </p>
                {/* Labeled-value metadata line per BLAZE_STYLE_GUIDE §4.6.
                    Member Type · Stage as the primary classifier; last
                    touch as the relationship-recency cue. */}
                <p className="relative pointer-events-none mt-0.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-xs text-blaze-grey-body">
                  <span className="inline-flex items-baseline gap-1.5">
                    <span>Member Type:</span>
                    <strong className="font-medium text-blaze-charcoal">
                      {m.member_type_name}
                    </strong>
                  </span>
                  {m.last_touch_at && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-baseline gap-1.5">
                        <span>Last conversation:</span>
                        <strong className="font-medium text-blaze-charcoal">
                          {new Date(m.last_touch_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </strong>
                      </span>
                    </>
                  )}
                </p>
                {/* Action notifications line. Renders only when there's
                    something to notify; "0 active Signals · 0 open
                    opportunities" would be noise. The link is stacked
                    above the stretched primary link via z-10 +
                    pointer-events-auto, so clicking the orange text
                    navigates to the Member profile rather than starting
                    a Growth Conversation. */}
                {hasActionNotifications && (
                  <p className="relative z-10 mt-1 text-xs text-blaze-grey-body">
                    <Link
                      href={`/members/${m.slug}`}
                      className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
                    >
                      {m.active_signal_count > 0 && (
                        <>
                          {m.active_signal_count} active Signal
                          {m.active_signal_count === 1 ? "" : "s"}
                        </>
                      )}
                      {m.active_signal_count > 0 &&
                        m.open_opportunity_count > 0 &&
                        " · "}
                      {m.open_opportunity_count > 0 && (
                        <>
                          {m.open_opportunity_count} open opportunit
                          {m.open_opportunity_count === 1 ? "y" : "ies"}
                        </>
                      )}
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
