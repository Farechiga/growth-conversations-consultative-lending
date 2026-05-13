"use client";

/*
 * v2 Workstation Header — Sprint 4.7.1.
 *
 * Hierarchy (Block D):
 *   left  — Member Signals wordmark + "Growth Conversations" page title
 *           (matches v1 Member Signals brand mark treatment per BLAZE_STYLE_GUIDE)
 *           Below: Member name · type · stage · banker as subtitle
 *   right — Two-pill open-thread badge (Block A): response value + product
 *           "Classic view ↗" cross-link to v1 Member profile
 *
 * Scroll-collapse (Block G):
 *   - Header is `position: sticky; top: 0`. As the banker scrolls, the
 *     header collapses to a thin strip (~40px) showing logo + Member
 *     name + open-thread badge.
 *   - Compliance banner and key facts strip remain in normal flow —
 *     they scroll away as expected.
 *   - Dialpad sticks below the (collapsed) header via CSS variable
 *     `--v2-header-h` so its sticky offset tracks the header height.
 *
 * Block A — open-thread badge:
 *   Two structured pills + date · derived from `member_response` and
 *   `Recommendation.product.name`. No truncation, no synthetic prose.
 *   Empty when no Recommendation in the engaged spectrum.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Chip } from "@/app/_components/chip";

export type OpenThread = {
  responseLabel: string;       // e.g., "leaning yes"
  productLabel: string | null; // e.g., "Working Capital LOC"
  context: string;             // e.g., "overdue Apr 22"
};

const STAGE_LABELS: Record<string, string> = {
  starting: "Starting",
  growing: "Growing",
  established: "Established",
  mature: "Mature",
};

export function V2WorkstationHeader({
  memberName,
  memberTypeName,
  stage,
  primaryBankerName,
  openThread,
  classicHref,
}: {
  memberName: string;
  memberTypeName: string;
  stage: string;
  primaryBankerName: string;
  openThread: OpenThread | null;
  classicHref: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Collapse threshold matches the natural top region. Past that,
      // the header morphs to thin so the dialpad reads as the active
      // anchor.
      setCollapsed(window.scrollY > 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Publish header height as a CSS variable on documentElement so the
    // dialpad's sticky offset (which is a sibling element) can read it.
    // Sibling-scoped CSS variables don't propagate, so we hoist it.
    // Heights tuned to the simplified two-row layout (Issues 2 + 3):
    // collapsed = single-row title-only; expanded = title + subtitle.
    document.documentElement.style.setProperty(
      "--v2-header-h",
      collapsed ? "48px" : "88px",
    );
    return () => {
      document.documentElement.style.removeProperty("--v2-header-h");
    };
  }, [collapsed]);

  return (
    <header
      data-collapsed={collapsed ? "true" : "false"}
      className="sticky top-0 z-40 border-b border-blaze-rule bg-white transition-[padding] duration-150 ease-out"
    >
      <div
        className={`mx-auto max-w-6xl px-8 transition-[padding] duration-150 ease-out ${
          collapsed ? "py-2" : "py-4"
        }`}
      >
        {/* Top row: page title (left) · open-thread badge + Classic view (right). */}
        <div className="flex items-center justify-between gap-4">
          {/* Sprint 4.7.1 follow-up Issue 2 — single page identity using
              the Member Signals brand treatment. "Growth" in orange,
              "Conversations" in charcoal, display heading weight. The
              standalone "Member Signals" wordmark is gone — one
              identity, not two. */}
          <Link
            href="/"
            // Sprint 6 polish — 40% larger logo (text-2xl 24px → 34px;
            // text-base 16px → 22px). Tracking-tight kept for the
            // wordmark feel.
            className={`shrink-0 font-semibold tracking-tight transition-[font-size] duration-150 ease-out ${
              collapsed ? "text-[22px]" : "text-[34px]"
            }`}
          >
            <span className="text-blaze-orange-deep">Growth</span>{" "}
            <span className="text-blaze-charcoal">Conversations</span>
          </Link>

          {/* Collapsed mode — Member name appears inline next to the
              title for context (since the subtitle row hides).
              Sprint 6 polish — added ml-3 to breathe space between the
              wordmark and the inline member name. */}
          {collapsed && (
            <p className="ml-3 min-w-0 flex-1 truncate text-sm text-blaze-grey-body">
              · {memberName}
            </p>
          )}

          <div className="flex shrink-0 items-center gap-3">
            {/* Block A (Sprint 4.7.1) — two-pill open-thread badge.
                Sprint 6 polish — dropped the "· due [date]" tail. The
                two response/product pills carry the information the
                banker needs at a glance; the date felt like noise on
                top of the rest of the header context. */}
            {openThread && (
              <div
                className="flex items-center gap-1.5"
                role="status"
                aria-label="Open thread"
              >
                <Chip variant="accent">{openThread.responseLabel}</Chip>
                {openThread.productLabel && (
                  <Chip variant="accent">{openThread.productLabel}</Chip>
                )}
              </div>
            )}
            {!collapsed && (
              <>
                <Link
                  href="/v2/insight-engine"
                  className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
                >
                  Dashboards ↗
                </Link>
                <Link
                  href={classicHref}
                  className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
                >
                  Classic view ↗
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Sprint 4.7.1 follow-up Issue 3 — Member info on its own line
            below the title. Full width; no truncation. Hidden in
            collapsed mode (Member name moves up to title row).
            Sprint 6 polish — segments rendered as flex children with
            gap-x-3 so the breathing room between Member · Type · Stage
            · Banker is consistent and visible. mt-3 (12px) gives the
            subtitle room to breathe under the wordmark, rather than the
            mt-1 (4px) that crowded it. */}
        {!collapsed && (
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 text-xs uppercase tracking-[0.06em] text-blaze-grey-body">
            <span>{memberName}</span>
            <span aria-hidden>·</span>
            <span>{memberTypeName}</span>
            <span aria-hidden>·</span>
            <span>{STAGE_LABELS[stage] ?? stage}</span>
            <span aria-hidden>·</span>
            <span>{primaryBankerName}</span>
          </p>
        )}
      </div>
    </header>
  );
}
