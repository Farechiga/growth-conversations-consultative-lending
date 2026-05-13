/*
 * Sprint 9 — shared utilities for business-impact artifact visualizations.
 *
 * Each Track-specific chart accepts the same `parameterValues` map
 * (raw banker-entered strings + FactorCapture overlays) and renders
 * a before/after comparison demonstrating the loan's business effect.
 *
 * These helpers keep the per-chart components small + consistent:
 *   - num(): coerce a raw parameter to a finite number, with fallback
 *   - fmtUSD(): compact dollar formatting for axis ticks + annotations
 *   - fmtUSDLong(): full dollar formatting for inline call-outs
 *   - monthlyPayment(): standard mortgage/amortization formula
 */

export function num(
  parameterValues: Record<string, string>,
  key: string,
  fallback = 0,
): number {
  const raw = parameterValues[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const cleaned = String(raw).replace(/[$,%\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function fmtUSD(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : ""}$${Math.round(abs / 1_000)}K`;
  if (abs === 0) return "$0";
  return `${v < 0 ? "-" : ""}$${Math.round(abs).toLocaleString("en-US")}`;
}

export function fmtUSDLong(v: number): string {
  return `${v < 0 ? "-" : ""}$${Math.round(Math.abs(v)).toLocaleString("en-US")}`;
}

/**
 * Recharts Tooltip `formatter` accepts `ValueType | undefined`. This
 * wrapper coerces safely to a long-form dollar string, used across
 * all Sprint 9 visualizations.
 */
export function tooltipUSD(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return fmtUSDLong(n);
}

/**
 * Monthly payment for a standard fixed-rate amortizing loan.
 * principal × r × (1+r)^n / ((1+r)^n - 1), where r is monthly rate and
 * n is total months. Returns 0 when inputs invalid.
 */
export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / termMonths;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Standard chart color palette per Block A.4 visual treatment.
 * Muted greys for "before" / current state; warm Blaze accents for
 * "after" / loan-enabled outcome. Green-accent for equity / wealth.
 */
export const VIZ_COLORS = {
  before: "#4f5052", // blaze-grey-body
  beforeFill: "rgba(79, 80, 82, 0.08)",
  after: "#b45f26", // blaze-orange
  afterDeep: "#ad571c", // blaze-orange-deep
  afterFill: "rgba(180, 95, 38, 0.12)",
  equity: "#16a34a", // green-600 — wealth / positive accent
  equityFill: "rgba(22, 163, 74, 0.10)",
  axis: "#4f5052",
  grid: "rgba(232, 224, 212, 0.5)",
  danger: "#c63a26",
};

/**
 * Standard wrapper for chart annotations rendered as small cards below
 * the visualization. Used by all 8 visualizations.
 */
export function annotationLineClass(): string {
  return "rounded border-l-[3px] border-blaze-orange bg-blaze-cream/30 px-3 py-2 text-[12px] leading-relaxed text-blaze-charcoal";
}
