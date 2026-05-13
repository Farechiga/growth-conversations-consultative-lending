"use client";

/*
 * Anchor progress bar — Sprint 4 §E.2.
 *
 * Right-column sticky list of stage names; one per stage of the
 * Member's Growth Track + post-Track lifecycle. Click a stage to scroll
 * the left column to that section's anchor; the currently-in-view stage
 * gets the "current view" highlight that updates as the banker scrolls.
 *
 * State color discipline mirrors the Member profile's TrackProgressDots:
 *   - completed → orange
 *   - current   → orange (with a thin ring on the dot)
 *   - upcoming  → light grey
 *
 * "Currently viewed" is a separate concept from stage state — it tracks
 * scroll position, not journey-state. A `completed` stage that the
 * banker is currently scrolled to renders with the completed orange tone
 * AND the "currently-viewed" left-edge mark; a `current` stage that the
 * banker is scrolled past renders with the orange ring (its journey
 * state) but loses the "currently-viewed" mark.
 *
 * Intersection Observer watches each stage section's anchor target;
 * whichever is closest to the top of the viewport wins the
 * "currently-viewed" cue. Smooth scroll on click.
 */

import { useEffect, useRef, useState } from "react";
import type { TrackStage } from "@/lib/suggested-next-step";

export type AnchorStage = TrackStage & {
  // anchor_id is the DOM id of the section in the left column. Click
  // scrolls to this id; the IntersectionObserver also keys on it.
  anchor_id: string;
};

export function AnchorProgressBar({ stages }: { stages: AnchorStage[] }) {
  const [activeId, setActiveId] = useState<string | null>(stages[0]?.anchor_id ?? null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Track which section is closest to viewport top. We listen to all
    // section anchors at once and pick the first that's intersecting at
    // a "near-top" threshold. The rootMargin trims the top 20% so a
    // section is considered "in view" once its top has scrolled past
    // the upper fifth of the viewport.
    const sections = stages
      .map((s) => document.getElementById(s.anchor_id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the entry with smallest distance from the top of the viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      },
    );
    sections.forEach((s) => observerRef.current?.observe(s));
    return () => observerRef.current?.disconnect();
  }, [stages]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, anchorId: string) {
    e.preventDefault();
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Ensure the click result reflects in active state immediately;
      // the IntersectionObserver may take a frame to catch up.
      setActiveId(anchorId);
    }
  }

  return (
    <ol
      className="flex flex-col gap-1 text-sm"
      role="list"
      aria-label="Growth Conversation stages"
    >
      {stages.map((s) => {
        const isActive = activeId === s.anchor_id;
        return (
          <li key={s.anchor_id} className="relative">
            <a
              href={`#${s.anchor_id}`}
              onClick={(e) => handleClick(e, s.anchor_id)}
              className={`group/anchor flex items-center gap-3 py-1.5 pl-4 pr-2 transition-colors duration-150 ${
                isActive
                  ? "border-l-[2px] border-blaze-orange-deep"
                  : "border-l-[2px] border-transparent hover:border-blaze-rule"
              }`}
            >
              <span className="relative flex h-3 w-3 items-center justify-center">
                {s.state === "current" ? (
                  <>
                    <span
                      aria-hidden
                      className="absolute h-3 w-3 rounded-full border-[1.5px] border-blaze-orange bg-transparent"
                    />
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-blaze-orange"
                    />
                  </>
                ) : (
                  // Sprint 4.6 patch — `withdrawn` adds a fourth dot
                  // state with muted grey-soft fill, distinct from
                  // `upcoming`'s lighter grey-rule. Same vocabulary as
                  // TrackProgressDots.
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.state === "completed"
                        ? "bg-blaze-orange"
                        : s.state === "withdrawn"
                        ? "bg-blaze-grey-soft"
                        : "bg-blaze-rule"
                    }`}
                  />
                )}
              </span>
              <span
                className={
                  isActive
                    ? "font-medium text-blaze-charcoal"
                    : s.state === "current"
                    ? "font-medium text-blaze-charcoal"
                    : s.state === "completed"
                    ? "text-blaze-grey-body"
                    : "text-blaze-grey-soft"
                }
              >
                {/* Sprint 4 §4.2a refinement #2 — render displayLabel
                    when present (e.g., "Closing" instead of "Funded"
                    for committed-but-not-funded state). Falls back to
                    the canonical label otherwise. */}
                {s.displayLabel ?? s.label}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
