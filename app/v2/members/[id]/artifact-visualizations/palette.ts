/*
 * Sprint 9 Patch A+B — cohesive palette for business-impact
 * visualizations. Replaces ad-hoc per-chart colors with a small set of
 * semantic constants so the eight Sprint 9 charts read as one system.
 *
 * Post-Patch-E refresh (per Francisco): red and green removed from the
 * artifact palette. `cost` is now darker grey (distinct from
 * beforeState's medium slate). `benefit` is now near-black. The
 * grammar still reads "before / cost / benefit / after" by weight:
 * medium grey (status quo) → darker grey (cost) → near-black (benefit)
 * → warm Blaze orange (loan-enabled outcome / hero). Every chart that
 * previously used red or green already had orange as its accent, so
 * the swap preserves visual hierarchy without flattening any view.
 *
 * The grammar of color meaning (consistent across every chart):
 *
 *   beforeState  — status quo / current pain / "what happens without
 *                  the loan." Muted warm slate.
 *                  Use for: aging equipment cost, continued leasing,
 *                  organic growth, current spend without rewards.
 *
 *   afterState   — loan-enabled outcome. Warm Blaze accent. The hero.
 *                  Use for: new equipment financed, owned property
 *                  mortgage, expansion-fueled revenue, business card
 *                  with rewards.
 *
 *   cost         — interest / debt service / negative financial
 *                  components. Darker grey, visually heavier than
 *                  beforeState so cost reads as "this is the drag."
 *                  Use for: interest paid, PACE assessment, monthly
 *                  debt service overlays.
 *
 *   benefit      — net positive financial outcomes, used sparingly.
 *                  Near-black so the eye reads "this is real cashflow
 *                  arriving in the business."
 *                  Use for: net cashflow gain, cashback captured,
 *                  energy savings shown as benefit, rent received.
 *
 *   wealth       — equity / long-term value / accumulated wealth.
 *                  Deep teal — the one chromatic accent retained
 *                  alongside orange so equity-vs-cashflow still reads
 *                  cleanly.
 *                  Use for: equity built over time, total equity at
 *                  year 10, opportunity value captured.
 *
 *   reference    — gridlines, baselines, dashed reference lines.
 *
 *   annotation   — callouts and reference-line labels. Same warm hue
 *                  as afterState so the eye reads "this is the loan-
 *                  driven story."
 *
 * Light variants (`*Light`) are for fills and area regions where
 * lower visual weight is needed.
 *
 * Legacy charts (Seasonal smoothing, Fleet ROI projection, Capital
 * event partnership map) are preserved with their original colors per
 * spec and do not import this file.
 */

export const ARTIFACT_PALETTE = {
  beforeState: "#78716C", // stone-500 — muted warm slate
  beforeStateLight: "#A8A29E", // stone-400
  beforeStateFill: "rgba(120, 113, 108, 0.10)",

  afterState: "#C2410C", // orange-700 — Blaze accent
  afterStateLight: "#FED7AA", // orange-200
  afterStateFill: "rgba(194, 65, 12, 0.10)",

  // Patch-E refresh — `cost` shifted from red-700 to a darker neutral
  // grey so it reads as "drag" rather than "danger." Distinct from
  // beforeState (medium grey) by ~2 lightness steps.
  cost: "#404040", // neutral-700 — darker grey for cost components
  costLight: "#D4D4D4", // neutral-300 — for bar fills under a cost border
  costFill: "rgba(64, 64, 64, 0.10)",

  // Patch-E refresh — `benefit` shifted from green-700 to near-black
  // so the eye reads "this is the gain landing in the business." The
  // warm-toned stone-900 (not pure #000) matches the surrounding
  // Blaze-charcoal text grammar.
  benefit: "#1C1917", // stone-900 — near-black for positive outcomes
  benefitLight: "#44403C", // stone-700 — softer near-black for fills
  benefitFill: "rgba(28, 25, 23, 0.10)",

  wealth: "#0F766E", // teal-700 — equity / long-term value
  wealthLight: "#99F6E4", // teal-200
  wealthFill: "rgba(15, 118, 110, 0.10)",

  reference: "#9CA3AF", // grey-400 — gridlines, baselines
  referenceGrid: "rgba(156, 163, 175, 0.35)",
  axis: "#4F5052", // blaze-grey-body — axis labels + tick text

  annotation: "#C2410C", // matches afterState — reference-line stroke
  annotationText: "#9A3412", // orange-800 — annotation label text
} as const;

export type ArtifactPaletteKey = keyof typeof ARTIFACT_PALETTE;
