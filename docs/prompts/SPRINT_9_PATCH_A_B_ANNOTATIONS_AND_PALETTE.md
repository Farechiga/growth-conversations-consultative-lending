# Sprint 9 Patch A + B — Annotation Fixes + Color Palette Sweep

**Prompt for Claude Code. Single patch. Quick polish for Sprint 9 visualizations after Playwright-verified rendering pass. Two coordinated changes: (A) annotation accuracy + variable substitution fixes, (B) cohesive color palette sweep across all 8 new visualizations. Estimated 0.5-1 effective build day CC time.**

## Pre-flight context

Sprint 9 shipped 8 new business-impact visualizations. Playwright verification confirmed they render. Visual review surfaced two categories of issues:

**Category A — Accuracy issues:**
- Annotations contradict the visual (e.g., "Cheaper from month 1" when the lines start at the same point and DIVERGE; "Ahead from year 1" when the crossover happens around year 5-6)
- Title mismatched to chart content (SBA 7(a) chart titled "financing structure" but visualizes growth trajectory)
- Variable substitution failures (placeholders like "[Annual growth rate with loan]/yr" and "[Term (years)]" appear in user-facing text instead of substituted values)

**Category B — Color palette issues:**
- Mixed palette across charts (some use bright green, some use solid black, some use bright red)
- Visual weight wrong: bright red "aging equipment" line reads as "danger" rather than "cost of status quo"
- Bright black bars in PACE / cashback charts feel harsh
- Inconsistent grammar of color meaning across visualizations

Patch A + B addresses both in one coordinated change. Patches C (PACE structural redesign) and Unsecured-chart redesign are separate, deferred.

**Read these governance documents before starting:**

1. Sprint 9 spec: `/mnt/user-data/uploads/SPRINT_9_BUSINESS_IMPACT_VISUALIZATIONS.md` (or root-level equivalent)
2. Visualization components: `app/v2/members/[id]/artifact-visualizations/`
3. Existing chart components for legacy artifacts (preserved unchanged)

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked):**

- Annotations must match visual reality
- Variable substitution failures fixed wherever they appear in user-facing text
- SBA 7(a) chart renamed to reflect growth trajectory content
- Cohesive color palette applied across all 8 new Sprint 9 visualizations
- TRACK-001 LOC seasonal smoothing chart (Jenny's existing) and TRACK-002 Business Vehicle Loan summary (Northland's existing) PRESERVED with current colors
- PACE structural redesign (Patch C) is separate; this patch applies new palette but doesn't redesign the visualization structure
- Unsecured chart redesign is separate; this patch applies new palette but doesn't redesign

## What ships in this patch

Six blocks across two phases. Single checkpoint.

**Phase 1 — Accuracy fixes:**
- **Block 1 — Annotation accuracy audit and fixes.**
- **Block 2 — Variable substitution failures.**
- **Block 3 — SBA 7(a) title and framing.**

**Phase 2 — Color palette sweep:**
- **Block 4 — Establish palette constants.**
- **Block 5 — Apply palette to all 8 new visualizations.**
- **Block 6 — Verify accessibility and contrast.**

This patch does NOT ship: PACE structural redesign; Unsecured chart redesign; any changes to TRACK-001 or TRACK-002 visualizations; any changes to legacy chart components; new visualization types; Member-Type × Track applicability filtering.

---

## Block 1 — Annotation accuracy audit and fixes

### 1.1 Audit all 8 new visualizations

For each visualization, verify that annotations match what the chart actually shows:

**LeaseVsOwnChart (TRACK-003 CRE):**
- Current annotation: "Ownership ahead from year 1"
- Visual reality: ownership total-paid line is HIGHER than leasing until ~year 5-7, then crossover
- Fix: change annotation to reference the actual crossover year. Use the computed crossover year from the parameter values. Format: "Ownership pulls ahead at year [crossover_year]" or "Crossover to ownership advantage: year [X]"

**GrowthTrajectoryChart (TRACK-004 SBA 7(a)):**
- Verify "What the model shows" text — currently contains placeholders that didn't substitute. See Block 2.
- Verify any in-chart annotations match the visual

**CashflowEquityDualChart (TRACK-006 Investment Property):**
- Verify "266% on initial investment" annotation matches computation
- Verify "Initial investment $213K" annotation matches the down_payment parameter

**CostOfDoingNothingChart (TRACK-007 Equipment):**
- Current annotation: "Cheaper from month 1"
- Visual reality: both lines start at $0 at month 1 (same point); they diverge from there
- Fix: change annotation to reflect actual breakeven point. The slope of "new equipment financed" is lower than "aging equipment" from month 1, meaning the slope-difference is positive from start. But CUMULATIVE cost only crosses over later if there's an upfront cost difference. Two options:
  - Option (a) — if cumulative new-equipment cost is always lower than aging-equipment cost (slopes diverge from month 1), say: "New equipment slope is lower from month 1; cumulative savings widen over time"
  - Option (b) — if there's a meaningful breakeven later, find it and annotate: "New equipment becomes cheaper than continuing at month [X]"
- CC should determine which case applies based on the parameter values and pick the accurate annotation

**Sba504StructureComparison (TRACK-008 SBA 504):**
- Verify cash-at-closing comparison annotation matches the bars
- Verify 10-year interest savings annotation matches the bars

**PaceMonthlySavingsChart (TRACK-009 PACE):**
- Verify "Monthly assessment $373 vs. monthly energy savings $500" matches the parameters
- Verify "Net monthly benefit: $127" matches the math
- Note: PACE structural redesign deferred to Patch C; this patch only verifies annotation accuracy

**CashbackOpportunityChart (TRACK-010 Business Visa):**
- Verify "$30,600 in combined rewards + float" matches the 5-year computation
- Verify annual cashback annotation matches the parameters

**UnsecuredOpportunityChart (TRACK-011 Unsecured):**
- Verify "$112,917 net benefit" matches the math
- Note: Unsecured chart redesign deferred to separate patch; this patch only verifies annotation accuracy

### 1.2 General annotation principle

If an annotation references a specific event in the visualization (a crossover point, a breakeven month, an "ahead from year X"), that event must be visible in the chart. If the annotation describes a slope or trend, the chart must reflect that slope/trend.

When in doubt, drop a misleading annotation rather than keep it.

### 1.3 Acceptance criteria

- [ ] Each of 8 new visualizations audited for annotation accuracy
- [ ] LeaseVsOwn annotation updated to reflect actual crossover year
- [ ] CostOfDoingNothing annotation updated to reflect either slope-from-start or actual breakeven month
- [ ] All other annotations verified or corrected
- [ ] No annotation contradicts visual reality

---

## Block 2 — Variable substitution failures

### 2.1 Audit user-facing text for unsubstituted placeholders

Walk through all 8 new visualizations and find any user-facing text containing unsubstituted parameter placeholders. Pattern to find:

- `[Parameter Name]` (bracket-wrapped labels) appearing in rendered text
- `{parameter_key}` (curly-brace template literals) appearing in rendered text
- Any other placeholder format that didn't substitute at render time

Known cases:
- GrowthTrajectoryChart "What the model shows" text contains "[Annual growth rate with loan]/yr" and "[Term (years)]" — both should substitute to actual values
- Verify other visualizations don't have similar leakage

### 2.2 Fix substitution logic

For each unsubstituted placeholder:
- Identify the parameter the placeholder should reference
- Verify the parameter is in the artifact's parameter_schema
- Verify the parameter value is being passed through to the rendering component
- Fix the substitution logic so the value appears instead of the placeholder

Most likely root causes:
- Template string references a parameter key that doesn't exist in parameter_schema (typo or missing field)
- Substitution helper function doesn't handle a specific parameter type
- Parameter value is undefined/null and substitution returns the placeholder

### 2.3 Acceptance criteria

- [ ] All user-facing text scanned for unsubstituted placeholders
- [ ] GrowthTrajectoryChart "What the model shows" text substitutes correctly
- [ ] Any other instances found and fixed
- [ ] If a parameter is genuinely missing (e.g., banker estimate hasn't captured it), text either displays a clear placeholder ("[capture this value]") or graceful fallback, NOT a raw template literal

---

## Block 3 — SBA 7(a) title and framing

### 3.1 Rename chart title

GrowthTrajectoryChart (TRACK-004 SBA 7(a)) currently titled "SBA 7(a) financing structure" in the artifact view, but the visualization shows growth trajectory (revenue uplift over time).

Rename to: **"Growth trajectory with SBA 7(a) financing"**

Update:
- ArtifactTemplate.title in seed (ARTIFACT-TEMPLATE-002)
- Any in-component title rendering
- Member-facing description (the artifact description field) — should match the new title's emphasis on growth, not structure

### 3.2 Update description for accuracy

Current description references "the SBA 7(a) loan structure" which mismatches the visualization. Rewrite to match what the chart actually shows. Draft:

> A projection showing how SBA 7(a) financing accelerates the business's growth trajectory. The chart compares revenue under organic growth (no loan) vs. expansion-fueled growth (with SBA 7(a)) over the loan term. Used during Consult to walk through how the financing pays for itself many times over.

### 3.3 output_summary_template review

Current template references SBA structure terms. Update to match the growth-trajectory framing. Verify the template language is consistent with what the chart visualizes.

### 3.4 Acceptance criteria

- [ ] ARTIFACT-TEMPLATE-002 title updated in seed
- [ ] Component renders new title
- [ ] Description matches visualization content (growth trajectory, not structure)
- [ ] output_summary_template language consistent with growth framing

---

## Block 4 — Establish palette constants

### 4.1 Define palette in a central location

Create a palette constants file (e.g., `app/v2/members/[id]/artifact-visualizations/palette.ts`):

```typescript
export const ARTIFACT_PALETTE = {
  // Before state / status quo / current pain
  // Muted slate; not harsh black
  beforeState: '#78716C',          // warm grey (stone-500)
  beforeStateLight: '#A8A29E',     // stone-400 (for fills/areas)
  
  // After state / loan-enabled outcome
  // Warm Blaze brand accent
  afterState: '#C2410C',           // orange-700 (Blaze accent)
  afterStateLight: '#FED7AA',      // orange-200 (for fills/areas)
  
  // Cost / negative financial component
  // Muted red; not bright danger
  cost: '#B91C1C',                 // red-700
  costLight: '#FECACA',            // red-200
  
  // Benefit / positive financial component  
  // Muted green; used sparingly for genuinely positive outcomes
  benefit: '#15803D',              // green-700
  benefitLight: '#BBF7D0',         // green-200
  
  // Wealth / equity / long-term value
  // Deep teal; distinct from cost/benefit
  wealth: '#0F766E',               // teal-700
  wealthLight: '#99F6E4',          // teal-200
  
  // Reference / baseline / dashed lines
  reference: '#9CA3AF',            // grey-400 (gridlines, axes, dashed reference lines)
  
  // Annotations / callouts
  annotation: '#C2410C',           // matches afterState (warm orange)
  annotationMuted: '#9A3412',      // orange-800 (for text)
};
```

### 4.2 Color semantics — the grammar of color meaning

Document the meaning in code comments:

- **Before state / status quo** = muted slate grey
  - Use for: aging equipment, continued leasing, organic growth, current spend without rewards
- **After state / loan-enabled outcome** = warm Blaze accent (orange)
  - Use for: new equipment financed, owned property mortgage, expansion-fueled revenue, business card with rewards
- **Cost** = muted red
  - Use for: interest paid, PACE assessment, monthly debt service overlays
- **Benefit** = muted green
  - Use for: net cashflow gain, cashback captured, energy savings (when shown as benefit)
- **Wealth / equity** = deep teal
  - Use for: equity built over time, total equity at year 10, accumulated wealth
- **Reference** = grey-400
  - Use for: gridlines, dashed reference lines, baseline annotations

### 4.3 Acceptance criteria

- [ ] palette.ts created with constants
- [ ] Color semantics documented in code comments
- [ ] Constants are importable from all artifact-visualization components

---

## Block 5 — Apply palette to all 8 new visualizations

### 5.1 Per-component palette application

For each of the 8 new Sprint 9 visualizations, replace existing colors with palette constants:

**LeaseVsOwnChart (TRACK-003 CRE):**
- "Continued leasing — total paid" line: `beforeState` (muted slate)
- "Own with CRE Term Loan — total paid" line: `afterState` (warm Blaze accent)
- "Equity built (ownership)" line: `wealth` (deep teal)
- Crossover annotation line: `annotation`
- Gridlines/axes: `reference`

**GrowthTrajectoryChart (TRACK-004 SBA 7(a)):**
- "Organic growth (no loan)" line: `beforeState`
- "With SBA 7(a) expansion" line: `afterState`
- "Annual debt service" overlay: `cost` (muted red, thinner stroke)
- Gridlines/axes: `reference`

**CashflowEquityDualChart (TRACK-006 Investment Property):**
- Top panel monthly cashflow breakdown:
  - Rent received: `benefit` (muted green)
  - Mortgage payment: `cost` (muted red)
  - Operating expenses: `costLight` (red-200 fill, with red-700 border)
  - Net cashflow: `afterState` (Blaze accent) — this is the loan-enabled outcome
- Bottom panel wealth accumulation:
  - Total equity: `afterState` (Blaze accent, primary line)
  - Cumulative net cashflow: `wealth` (deep teal, secondary line)
  - Initial investment dashed: `reference`

**CostOfDoingNothingChart (TRACK-007 Equipment):**
- "Aging equipment — cumulative cost" line: `beforeState` (muted slate, NOT bright red)
- "New equipment financed — cumulative cost" line: `afterState` (Blaze accent)
- Optional shaded region between lines: `afterStateLight` fill, low opacity, showing cumulative savings visually
- Breakeven annotation (when applicable): `annotation`

**Sba504StructureComparison (TRACK-008 SBA 504):**
- "Conventional CRE loan" bars: `beforeState`
- "SBA 504 structure" bars: `afterState`
- Within each bar, sub-segments:
  - Bank loan portion: `beforeStateLight`
  - CDC second lien portion: `wealthLight` (distinct accent for SBA-specific component)
  - Borrower equity: `afterState` or `wealth`
- Annotations: `annotation`
- Existing roadmap component above the comparison: preserved unchanged

**PaceMonthlySavingsChart (TRACK-009 PACE):**
- "Annual PACE assessment" bars (below zero): `cost` (muted red, NOT solid black)
- "Annual energy savings" bars (above zero): `benefit` (muted green) or `afterState` (warm Blaze accent — TBD by CC; the savings ARE the loan-enabled outcome, so afterState is defensible)
- "Net annual benefit" line: `annotation` (warm orange) — visual hero
- "PACE term ends" annotation: `annotation`
- Note: PACE structural redesign is separate patch; here we only apply palette to existing structure

**CashbackOpportunityChart (TRACK-010 Business Visa):**
- "Annual cashback" bar segment: `benefit` (muted green) — represents money captured
- "Annual float benefit (30-day)" bar segment: `afterState` (warm Blaze accent) — represents loan-enabled outcome
- "Current" column baseline: render at appropriate baseline (currently empty); see 5.2 below
- Annotations: `annotation`

**UnsecuredOpportunityChart (TRACK-011 Unsecured):**
- "Interest cost" bar: `cost` (muted red, NOT solid black)
- "Opportunity value captured" bar: `afterState` (warm Blaze accent, NOT bright green)
- "Without loan" column: include visible "$0 captured" reference bar so the comparison has visual weight
- Note: structural redesign is separate; here we apply palette and address the empty-column issue minimally

### 5.2 Fix the empty-baseline issue in cashback chart

Current CashbackOpportunityChart shows "Current" column as empty / zero. The comparison reads as "with Visa = something / without = nothing" which doesn't communicate the trade-off.

Fix: render the "Current" column with the underlying $180K operational spend as a reference bar (in `beforeState` muted slate), showing that the spend is happening either way. Then the "With Business Visa" column has the same baseline spend PLUS the cashback + float benefit on top (in `benefit` and `afterState`).

This makes the chart read as: "You're spending the money either way. The difference is whether you capture $X in rewards on top."

### 5.3 Acceptance criteria

- [ ] All 8 new visualizations use palette constants
- [ ] No hard-coded color hex values in component files (all reference palette)
- [ ] Color semantics consistent across visualizations (before = muted slate, after = warm Blaze, cost = muted red, etc.)
- [ ] PACE assessment renders in muted red, NOT solid black
- [ ] Unsecured chart renders in muted red + warm Blaze, NOT solid black + bright green
- [ ] CostOfDoingNothing aging-equipment line renders in muted slate, NOT bright red
- [ ] CashbackOpportunity Current column has visible baseline reference

---

## Block 6 — Verify accessibility and contrast

### 6.1 Visual probe

After applying palette, walk through each visualization and verify:

- All series labels readable
- Color contrast sufficient between adjacent series (not muddy or indistinguishable)
- Color-blind safe (the palette as defined uses different hue + luminance combinations; no pairs that fail common color-blindness types)
- Print-friendly (charts still readable if printed in greyscale; semantic relationships visible through luminance differences, not just hue)

### 6.2 Adjust if needed

If two adjacent colors muddle visually (e.g., `beforeState` slate and `reference` grey-400 are too similar in some chart context), adjust opacity, stroke width, or pick a slight variant.

### 6.3 Acceptance criteria

- [ ] All 8 visualizations pass visual probe
- [ ] No two adjacent series are visually indistinguishable
- [ ] Charts remain readable when imagined in greyscale
- [ ] BUILD_LOG entry documents the new palette and rationale

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-6 shipped per acceptance criteria
2. Run Playwright verification across all 8 new visualizations:
   - Screenshot each visualization
   - Confirm annotations match visual content
   - Confirm no unsubstituted placeholders
   - Confirm palette applied consistently
3. Per-component summary table showing what changed
4. Any annotation that required computation (e.g., LeaseVsOwn crossover year) — confirm the computed value
5. Note any visualization where palette decision required judgment (e.g., PACE energy savings as `benefit` vs `afterState`) and document choice in BUILD_LOG
6. Any deviations from spec with rationale

After this patch lands, the visualizations should read as a cohesive system. Patches C (PACE redesign) and the Unsecured chart redesign are separate work, drafted next based on visual review of this patch's results.

---

## Estimated scope

0.5-1 effective build day CC time.

Largest blocks:
- **Block 5 (palette application across 8 components)** — touches every Sprint 9 visualization file; ~0.5 day CC
- **Block 1 (annotation audit)** — careful review + computation of accurate values; ~0.25 day CC

Smaller blocks (2, 3, 4, 6) are routine.

After this patch ships and visual review confirms (cohesive palette, accurate annotations), Patch C drafts the PACE structural redesign separately.
