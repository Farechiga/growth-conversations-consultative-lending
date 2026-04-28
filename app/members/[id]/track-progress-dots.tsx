/*
 * TrackProgressDots — Sprint 2 §C.4.
 *
 * Adaptive journey visualization for the Suggested Next Step card. Renders
 * small discrete dots with a thin connecting line; each dot represents one
 * stage in the Member's journey through a Growth Track plus the post-Track
 * lifecycle. Adaptive to the Track's actual step shape per §C.2 (Resolve-
 * ending vs Connect-ending tracks get different post-Track labels).
 *
 * Visual discipline (BLAZE_STYLE_GUIDE.md progress visualization section):
 *   - Discrete dots only — no percentages, bars, or gradients
 *   - 6px dots; current state ~8px with a thin orange ring around it so
 *     "current" reads as distinct from "completed" without doubling the
 *     visual weight
 *   - Burnished orange fill (--blaze-orange) for completed and current
 *   - Light cool grey (--blaze-rule, #E8EAEC) for upcoming
 *   - 1px connecting line in the same upcoming-grey, behind the dots
 *   - Labels below each dot in 10px muted grey; labels for upcoming
 *     stages are slightly muted further so the reader's eye lands on
 *     completed/current first
 *
 * Per Francisco's locked direction: "small dots. These should be clear
 * and discrete, not a lot of ambiguity."
 */

import Link from "next/link";
import { slugifyStageLabel, type TrackStage } from "@/lib/suggested-next-step";

// Sprint 4 §4.1d Block B — when `memberSlug` is provided, stage labels
// render as hyperlinks to the matching stage anchor in Growth
// Conversations (`/growth-conversations/{slug}#stage-{slug-of-label}`).
// Dots remain non-clickable per the Sprint 2 architectural decision —
// "stage labels are clickable, dots are not." Without `memberSlug` the
// labels render as plain text (kept as a no-op fallback for any future
// caller that doesn't have a Member slug in scope).
export function TrackProgressDots({
  stages,
  memberSlug,
}: {
  stages: TrackStage[];
  memberSlug?: string;
}) {
  if (stages.length === 0) return null;

  return (
    // Sprint 2 Prompt 2 §D.1 — repositioned from upper-right of card to a
    // standalone block between body paragraph and action buttons. The
    // outer container left-aligns the visualization within the card; the
    // dots row and labels row stack vertically with the labels carrying
    // the pipe-separated horizontal sequence below the dot trail.
    <div className="flex flex-col items-start">
      <div
        className="relative flex items-center"
        role="list"
        aria-label="Growth Track progress"
      >
        {/* Thin connecting line behind the dots. Spans from the center of
            the first dot to the center of the last; `inset-x-2` aligns
            the line with the dot centers (each dot's container is 16px
            wide, so 8px inset = dot center). */}
        <span
          aria-hidden
          className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-blaze-rule"
        />
        {stages.map((s, i) => (
          <span
            key={i}
            role="listitem"
            aria-label={`${s.displayLabel ?? s.label} (${s.state})`}
            title={`${s.displayLabel ?? s.label} · ${s.state}`}
            className="relative z-10 flex h-4 w-4 items-center justify-center"
          >
            {s.state === "current" ? (
              // Current stage: orange dot with a thin orange ring around
              // it so the eye reads "this is where the journey is right
              // now" without doubling the dot size and breaking rhythm.
              <>
                <span
                  aria-hidden
                  className="absolute h-4 w-4 rounded-full border-[1.5px] border-blaze-orange bg-transparent"
                />
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-blaze-orange"
                />
              </>
            ) : (
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${
                  s.state === "completed" ? "bg-blaze-orange" : "bg-blaze-rule"
                }`}
              />
            )}
          </span>
        ))}
      </div>
      {/* Labels row with pipe separators per Sprint 2 Prompt 2 §D.2.
          Pipes (`|`) sit between labels in a constant muted grey
          (--blaze-grey-body) — they're separators, not state signals.
          Stage labels keep their state-based color (charcoal for
          current, grey-body for completed, grey-soft for upcoming).
          14px horizontal padding on each pipe creates the "explicit
          sequence" read Francisco called out. */}
      <div className="mt-2 flex items-baseline text-[11px] leading-tight">
        {stages.map((s, i) => {
          // Sprint 4 §4.1d Block B — labels become orange hyperlinks
          // matching the breadcrumb segment treatment when memberSlug is
          // present. State-based color (charcoal/grey-body/grey-soft) is
          // dropped on hyperlinks so the orange reads as the anchor
          // affordance; the dot itself still carries state. Hover adds
          // an underline. Non-link fallback keeps the prior state-based
          // color treatment.
          const labelClass = memberSlug
            ? s.state === "current"
              ? "font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
              : "text-blaze-orange-deep underline-offset-2 hover:underline"
            : s.state === "current"
            ? "font-medium text-blaze-charcoal"
            : s.state === "completed"
            ? "text-blaze-grey-body"
            : "text-blaze-grey-soft";
          const href = memberSlug
            ? `/growth-conversations/${memberSlug}#stage-${slugifyStageLabel(s.label)}`
            : null;
          return (
            <span key={i} className="inline-flex items-baseline">
              {i > 0 && (
                <span
                  aria-hidden
                  className="mx-3.5 text-blaze-grey-body"
                >
                  |
                </span>
              )}
              {href ? (
                <Link href={href} className={labelClass}>
                  {s.displayLabel ?? s.label}
                </Link>
              ) : (
                <span className={labelClass}>{s.displayLabel ?? s.label}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
