/*
 * Chip primitive — Sprint 4.7.1 Block B.
 *
 * Square-edged status pill in the v1 capture-form aesthetic. Used across
 * v2 surfaces for status pills (open-thread badge), signal-type tags
 * (captured feed), and any other glance-able label that needs to read
 * as a structured token rather than free prose.
 *
 * Visual baseline: tight padding, slight border-radius (2px), 0.5px
 * border, neutral background. Variants change foreground/background/
 * border to express semantic weight (default / accent / muted).
 *
 * Drift discipline (per CLAUDE.md §5): chip aesthetic is locked. If a
 * new chip variant is needed, add it here rather than inventing inline
 * styling at the call site.
 */

import type { ReactNode } from "react";

export type ChipVariant = "default" | "accent" | "muted";

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  // Default — quiet, structural. Cool grey-blue (--blaze-data-cool)
  // matches the v1 captured-value chip pattern from BLAZE_STYLE_GUIDE.
  default:
    "border-blaze-rule bg-blaze-data-cool/40 text-blaze-charcoal",
  // Accent — coral/orange. Reserved for open-thread urgency and
  // engaged-spectrum decision postures.
  accent:
    "border-blaze-orange-burnt bg-blaze-orange-pale/40 text-blaze-orange-deep",
  // Muted — for secondary or neutral context.
  muted:
    "border-blaze-rule bg-white text-blaze-grey-body",
};

export function Chip({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: ChipVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border-[0.5px] px-2 py-0.5 text-[11px] font-medium leading-tight ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
