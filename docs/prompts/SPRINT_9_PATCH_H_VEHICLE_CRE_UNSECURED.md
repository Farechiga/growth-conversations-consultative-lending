# Sprint 9 Patch H — Vehicle Stacked Bars, CRE Net Position Line, Unsecured Verification

**Prompt for Claude Code. Single patch. Three fixes: redesign Vehicle Loan as three-bar stacked chart with capacity ceiling lines and debt service overlay; add explicit Net Position line to CRE chart so year-1 crossover is visually obvious; re-verify Unsecured Net Benefit bar color is not black. Estimated 0.5-0.75 effective build day CC time.**

## Pre-flight context

Patch G shipped four fixes but visual review of the rendered output surfaced three remaining issues:

1. **Business Vehicle Loan visualization is still weak.** Patch G implemented horizontal bars (Today / Month 1 / Month 12 projected) showing revenue but:
   - No capacity ceiling reference (viewer can't see "what's the maximum the business could capture")
   - Monthly debt service ($3,650) shown as text annotation only, not visually integrated
   - The three bars look like generic revenue comparison; doesn't communicate "capacity expansion + debt service tradeoff"

2. **CRE chart annotation says one thing, visible curves show another.** Patch G updated the supporting text to reference net position correctly. But the chart visualization still shows three lines (lease total paid, own total paid, equity) and none of them IS the net position. The annotation "Ownership net position pulls ahead at year 1" requires the viewer to mentally compute "own total paid minus equity" to see the crossover. Need explicit Net Position line on the chart.

3. **Unsecured Net Benefit bar still rendering as black.** Patch G Block 3 specifically directed CC to restore the bar to palette color (orange family). The rendered output still shows solid black. The fix didn't land — either CC misinterpreted, the seed didn't refresh, or the verification was stale.

Patch H addresses these three with strict acceptance criteria and verification requirements.

**Read these governance documents before starting:**

1. Existing component: `app/v2/members/[id]/artifact-visualizations/VehicleFinancingSummary.tsx`
2. Existing component: `app/v2/members/[id]/artifact-visualizations/LeaseVsOwnChart.tsx`
3. Existing component: `app/v2/members/[id]/artifact-visualizations/UnsecuredOpportunityChart.tsx`
4. Palette constants: `app/v2/members/[id]/artifact-visualizations/palette.ts`
5. Patch G spec: `SPRINT_9_PATCH_G_FOUR_FIXES.md` for original directives
6. ArtifactTemplate seed: `prisma/seed-artifact-templates.ts`

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked through earlier conversation):**

- **Vehicle Loan:** Three vertically-stacked bar segments per scenario in one chart with three bars (Today / Month 1 / Month 12 projected). Capacity ceilings as dotted horizontal lines (current capacity + expanded capacity). Monthly debt service as dotted clear/light bar overlaid ON TOP of bars 2 and 3 only (where the debt is taken on). New parameter `current_monthly_revenue` added.
- **CRE chart:** Add fourth line showing "Own — net position (cost minus equity)" so the year-1 crossover is visible. This line should dip below the lease total paid line, making the visual annotation honest.
- **Unsecured:** Re-verify Net Benefit bar uses palette color (orange family, NOT black). Fresh screenshot required before claiming fixed.
- **No palette changes.** Existing black/grey/orange grammar preserved. Greens used only for PACE.
- **No green and orange together anywhere.** Per locked rule.

## What ships in this patch

Eight blocks across three phases. Single checkpoint.

**Phase 1 — Vehicle Loan three-bar stacked redesign:**
- **Block 1 — New parameter additions.**
- **Block 2 — Three-bar stacked visualization with capacity ceilings.**
- **Block 3 — Debt service overlay logic.**
- **Block 4 — Supporting text and seed updates.**

**Phase 2 — CRE Net Position line:**
- **Block 5 — Net Position series computation.**
- **Block 6 — Fourth line rendering on chart.**

**Phase 3 — Unsecured re-verification:**
- **Block 7 — Net Benefit color re-application with strict verification.**

**Phase 4 — Verification:**
- **Block 8 — Full Playwright verification with explicit visual confirmation.**

This patch does NOT ship: changes to PACE, other Sprint 9 visualizations, Sprint 7b drill-downs, production deployment, palette modifications.

---

## Block 1 — New parameter additions (Vehicle Loan)

### 1.1 Add `current_monthly_revenue`

Add to ARTIFACT-TEMPLATE-002 parameter_schema:

```json
{
  "key": "current_monthly_revenue",
  "label": "Current monthly revenue",
  "type": "currency",
  "required": true,
  "helper": "Member's actual monthly revenue today. Forms the baseline for capacity calculations."
}
```

Source_factor_id: if FACTOR-NNN exists for monthly revenue (e.g., FACTOR-027 if it's currently annual_revenue_band or similar), reference it. Otherwise banker-entered.

### 1.2 Computed parameters

These derive from existing + new parameters:

- `current_capacity_ceiling` (computed) = `current_monthly_revenue + current_declined_revenue_monthly`
  - Represents the maximum revenue current fleet capacity COULD serve if no jobs were declined
- `expanded_capacity_ceiling` (computed) = `current_capacity_ceiling * (1 + expected_capacity_uplift / 100)`
  - Represents the maximum revenue post-loan fleet capacity could serve

Both computed values used in chart rendering (capacity ceiling dotted lines).

### 1.3 Preserve existing parameters

All existing parameters from Patch G remain:
- `vehicle_type`, `vehicle_count`, `purchase_price`, `down_payment`, `loan_amount`, `term_months`, `rate_type`, `monthly_debt_service`, `capacity_utilization_now`, `expected_capacity_uplift`, `current_declined_revenue_monthly`, `projected_induced_demand_monthly`, `induced_demand_realization_months`

### 1.4 Acceptance criteria

- [ ] `current_monthly_revenue` parameter added with helper text
- [ ] Computed parameters `current_capacity_ceiling` and `expanded_capacity_ceiling` derived correctly
- [ ] Existing parameters preserved
- [ ] Source_factor_id linkage where applicable

---

## Block 2 — Three-bar stacked visualization with capacity ceilings

### 2.1 Chart structure

Single chart canvas. Three bars rendered side-by-side (vertical bars). Each bar is stacked with multiple segments. X-axis: three categories. Y-axis: dollars per month.

**Bar 1 — "Today":**
- Single segment, color `beforeState` (muted slate)
- Height: `current_monthly_revenue`
- Annotation above bar: "$X/month"

**Bar 2 — "With 2 new service trucks — month 1":**
- Bottom segment: current revenue (muted slate, same color as Bar 1's segment) — height = `current_monthly_revenue`
- Middle segment: recaptured declined revenue (orange `afterState`) — height = `current_declined_revenue_monthly`
- Top segment: debt service overlay (per Block 3)
- Annotation above bar: "$Y/month" (where Y = current_monthly_revenue + recaptured)

**Bar 3 — "With 2 new service trucks — month 12 projected":**
- Bottom segment: current revenue (muted slate) — height = `current_monthly_revenue`
- Middle segment: recaptured declined revenue (orange `afterState`) — height = `current_declined_revenue_monthly`
- Upper-middle segment: induced demand growth (orange, distinct shade or pattern — see Section 2.3)
- Top segment: debt service overlay (per Block 3)
- Annotation above bar: "$Z/month" (where Z = current_monthly_revenue + recaptured + induced)

### 2.2 Capacity ceiling lines

Two horizontal dotted lines drawn across the entire chart:

**Current capacity line:**
- Y-axis position: `current_capacity_ceiling` ($current_monthly_revenue + $current_declined_revenue_monthly)
- Style: dotted, color `beforeState` (muted slate)
- Label at right end of line: "Current capacity ceiling: $X/month"

**Expanded capacity line:**
- Y-axis position: `expanded_capacity_ceiling`
- Style: dotted, color `afterState` (orange) — represents the new ceiling the loan unlocks
- Label at right end of line: "Expanded capacity ceiling (post-loan): $Y/month"

The visual reading:
- Bar 1 reaches just below the current capacity line — showing declined demand as the gap
- Bar 2 reaches the current capacity line exactly — showing recapture closes the gap to current ceiling
- Bar 3 grows toward the expanded capacity line — showing induced demand fills the new headroom

### 2.3 Induced demand segment visual treatment

The induced demand segment in Bar 3 needs to be visually distinct from the recaptured segment (both are orange family). Options:

- **Different orange shade:** induced demand in slightly different orange than recapture (e.g., recapture in `afterState`, induced in `afterStateLight` or vice versa)
- **Pattern fill:** induced demand uses subtle diagonal pattern over orange
- **Border treatment:** induced demand has dashed border to indicate "projected, not yet realized"

CC recommendation: **dashed border on the induced demand segment** to communicate "projected/banker estimate, not yet realized." Honest about the uncertainty.

### 2.4 Annotations under each bar

Below each bar's category label, small explanatory annotation:

**Bar 1:** "$X/month declined (lost capacity)"
**Bar 2:** "+$X/month captured (previously declined)"
**Bar 3:** "+$Y/month projected growth (banker estimate)"

These reinforce what each bar's segments represent.

### 2.5 Acceptance criteria

- [ ] Three vertical bars rendered side-by-side
- [ ] Bar 1: single segment (current revenue)
- [ ] Bar 2: two stacked segments (current + recaptured) plus debt service overlay
- [ ] Bar 3: three stacked segments (current + recaptured + induced) plus debt service overlay
- [ ] Two dotted horizontal capacity lines visible across the chart
- [ ] Current capacity line at appropriate height
- [ ] Expanded capacity line at higher height
- [ ] Capacity lines labeled clearly
- [ ] Annotations below each bar explain segments
- [ ] Induced demand visually distinct (dashed border or shade variation)
- [ ] No green anywhere in the chart

---

## Block 3 — Debt service overlay logic

### 3.1 Overlay treatment

Monthly debt service ($3,650 for Northland) appears as a "subtraction" indicator ON TOP of Bars 2 and 3 only. Not on Bar 1 (no debt service today).

**Visual treatment:**
- Top segment of Bar 2: dotted/dashed outline rectangle with no fill, height = `monthly_debt_service`
- Color of outline: muted slate (`beforeState`) or light grey
- Position: stacked on top of the orange/slate segments
- Label near segment: "Debt service: $3,650"

**Equivalent treatment on Bar 3:** same dotted/dashed outline rectangle on top, same height.

**Visual reading:** "The orange/slate segments are gross revenue at that timepoint. The dotted box on top represents the debt service — what you pay monthly. The net effect is what remains after subtracting this small piece."

### 3.2 Visual proportion

`monthly_debt_service` ($3,650) is small compared to the revenue segments (could be $50,000-$70,000+). The dotted outline rectangle will be visually small at the top of each bar — exactly the point. The debt service is small relative to recaptured + induced demand revenue.

### 3.3 Alternative treatment

If the dotted outline approach reads as cluttered, CC may use a small horizontal annotation line at `monthly_debt_service` height above zero with a label "Monthly debt service: $3,650" — but this loses the "subtraction" visual relationship.

CC recommendation: **stick with dotted outline rectangle on top** unless it genuinely doesn't work visually. Document choice in BUILD_LOG.

### 3.4 Acceptance criteria

- [ ] Debt service overlay rendered on Bars 2 and 3 only (NOT Bar 1)
- [ ] Treatment is dotted/dashed outline (light grey or muted slate) without fill
- [ ] Positioned at top of stacked bars
- [ ] Height proportional to `monthly_debt_service`
- [ ] Labeled clearly
- [ ] Visually communicates "subtract from gross"

---

## Block 4 — Supporting text and seed updates (Vehicle Loan)

### 4.1 Supporting text below chart

Update existing supporting paragraph to match the new three-bar structure:

> Today, {member_name}'s {vehicle_count} {vehicle_type}{plural_suffix} serve approximately {current_monthly_revenue}/month, with another {current_declined_revenue_monthly}/month declined because the fleet is at capacity (utilization: {current_capacity_utilization}%). 
>
> Adding {vehicle_count_new} new {vehicle_type}{plural_suffix} expands capacity by {expected_capacity_uplift}%. Immediate effect (month 1): the {current_declined_revenue_monthly}/month previously declined is now serviceable. Over the next {induced_demand_realization_months} months: expanded capacity unlocks new growth — banker estimate of approximately {projected_induced_demand_monthly}/month in new revenue from larger contracts, geographic reach, and contracts previously not pursued.
>
> Monthly debt service of {monthly_debt_service} is covered by the recaptured revenue alone ({coverage_ratio_immediate}× coverage at month 1). With induced demand at month 12, debt service coverage exceeds {coverage_ratio_projected}×.

Where `coverage_ratio_immediate` = `current_declined_revenue_monthly / monthly_debt_service` and `coverage_ratio_projected` = `(current_declined_revenue_monthly + projected_induced_demand_monthly) / monthly_debt_service`.

CC refines wording.

### 4.2 output_summary_template update

Update ArtifactTemplate seed:

```
{vehicle_count} {vehicle_type} at {purchase_price}. Financed at {loan_amount} after {down_payment} down. Monthly debt service {monthly_debt_service}. Today: {current_monthly_revenue}/month revenue with {current_declined_revenue_monthly}/month declined (lost capacity). Immediate effect: declined revenue captured. Month 12 projected: additional {projected_induced_demand_monthly}/month from growth opportunities the expanded capacity enables. Loan funds itself many times over.
```

### 4.3 Fixture data updates (Northland)

Update Northland's TRACK-002 fixture parameter values:

- `current_monthly_revenue`: $50,000 (or appropriate baseline — adjust to match a realistic Northland HVAC monthly revenue)
- `current_declined_revenue_monthly`: $4,200 (preserve)
- `projected_induced_demand_monthly`: $6,000 (preserve)
- `induced_demand_realization_months`: 12 (preserve)
- `monthly_debt_service`: $3,650 (preserve)

The induced demand parameter remains in banker_estimate capture mode (per Sprint 8 two-mode capture) so the visual flag appears.

### 4.4 Acceptance criteria

- [ ] Supporting text reflects new three-bar structure
- [ ] output_summary_template updated
- [ ] Northland fixture data populates new parameters
- [ ] Coverage ratios computed and inserted correctly
- [ ] No placeholder leakage

---

## Block 5 — Net Position series computation (CRE)

### 5.1 Net Position formula

For each year N in the chart range:

- **Lease net position** = -(cumulative_rent_paid_through_year_N) — always negative, growing more negative each year
- **Own net position** = -(cumulative_mortgage_paid_through_year_N) + equity_built_at_year_N

Own net position is initially very negative (down payment + early mortgage payments without much equity), then becomes less negative as equity accumulates and eventually crosses above lease net position.

### 5.2 Crossover detection

The year where `own_net_position > lease_net_position` for the first time is the crossover year.

For Cygnus scenario ($4.8M property, $4.4M mortgage at 7.25%, 3% appreciation):
- Year 0: Own NP = -$400K (down payment) + $0 equity = -$400K; Lease NP = $0. Lease ahead.
- Year 1: Own NP = -$400K - $381K mortgage + ~$580K equity (principal paydown + appreciation) = -$200K. Lease NP = -$312K. **Own pulls ahead.**

This is the year-1 crossover the annotation references. The new fourth line should make this visually obvious.

### 5.3 Compute series for chart

Add a new series to the chart data array: `own_net_position` (or "Own — net position") with year-by-year values.

This series will likely:
- Start very negative at year 0 (down payment alone is $400K out, no equity yet)
- Drop further in early years before equity catches up
- Eventually exceed lease net position (which only goes more negative as rent accumulates)

### 5.4 Acceptance criteria

- [ ] Net Position computed for both lease and own scenarios per year
- [ ] Net Position series added to chart data
- [ ] Crossover year correctly computed (typically year 1 for typical CRE scenarios)
- [ ] Math verified against Cygnus fixture values

---

## Block 6 — Fourth line rendering on CRE chart

### 6.1 New line on the chart

Add fourth line to the LeaseVsOwnChart rendering:

**Own — Net Position (cost minus equity):**
- Color: distinct from existing lines — use a darker orange, OR a different orange treatment to differentiate from "Own total paid"
- Style: solid line with markers, or distinctive stroke (e.g., thicker than existing lines)
- Label in legend: "Own — net position (cost minus equity)"

The line starts very low (negative) at year 0, dips further in early years, then rises sharply as equity catches up, eventually crossing above the "Continued leasing — total paid" line.

Wait — there's a sign convention issue. The existing chart shows "total paid" as positive cumulative cost. Net position as I defined it is negative. Two options for plotting:

**Option (a):** Plot net position as negative values on the same axis. Y-axis extends below zero.
**Option (b):** Plot |net position| OR plot "wealth equivalent" as a positive value. The line for own would start very negative and rise toward zero; the line for lease would continue going more negative.

**Option (c) — cleaner: Plot "net cost" instead.** Net cost = cumulative paid MINUS equity built.
- Lease net cost = cumulative rent (positive, growing)
- Own net cost = cumulative mortgage paid - equity built (positive at year 0, but smaller and possibly crossing below lease net cost early)

This is mathematically equivalent and avoids negative axis.

For the chart visualization, **option (c)** is cleanest: same positive axis as existing lines. The new "Own — net cost" line dips below the "Continued leasing — total paid" line at the crossover year (visually compelling).

### 6.2 Visual treatment

The new line should be:
- Visually distinct from existing 3 lines
- Strong enough to be the visual answer to the annotation
- Color from existing palette (orange family, since this is about ownership — the loan-enabled outcome)

CC choice: darker orange variant from palette, OR same orange with different stroke (thicker, dashed differently).

### 6.3 Updated legend

Legend lists 4 series:
1. Continued leasing — total paid (grey/slate)
2. Own with CRE Term Loan — total paid (orange)
3. Equity built (ownership) — teal/distinct
4. Own — net position (cost minus equity) (darker orange or distinct treatment)

### 6.4 Annotation alignment

The vertical dashed annotation line at year 1 ("Ownership net position pulls ahead at year 1") now visually makes sense — the new fourth line crosses below "Continued leasing — total paid" at year 1.

### 6.5 Acceptance criteria

- [ ] Fourth line added to LeaseVsOwnChart
- [ ] Line represents Own — net position (or net cost using Option (c) approach)
- [ ] Line visually distinct from existing 3 lines
- [ ] Crossover with leasing line visually obvious at the annotated year
- [ ] Legend updated with new series
- [ ] No green colors introduced; orange family for ownership-related series
- [ ] Existing curves preserved

---

## Block 7 — Unsecured Net Benefit color re-application

### 7.1 The verification gap

Patch G Block 3 directed CC to restore the Net Benefit bar from black to palette orange. The rendered output still shows solid black. This was not caught in Patch G's verification.

This block is explicit about verification.

### 7.2 The fix

In `UnsecuredOpportunityChart.tsx`, identify the Net Benefit bar rendering. The current implementation has it as solid black (likely a hard-coded color or a wrong palette reference).

Restore to: existing palette color in the orange family. The exact color depends on what's available:
- If `afterState` exists in palette.ts (warm Blaze orange), use that
- If there's an `afterStateDark` or `afterStateLight` variant, optionally use that to differentiate from Opportunity Value bar (which is also orange)

If both Opportunity Value and Net Benefit are the same orange shade, use opacity or border to differentiate:
- Net Benefit at 100% opacity, slightly darker stroke
- Or Net Benefit at 80% opacity (lighter) to read as "subset of Opportunity Value"

### 7.3 Verification protocol

**Before claiming this fixed:**

1. CC runs `pnpm db:reset && pnpm db:snapshot` to ensure clean state
2. CC starts dev server: `pnpm dev`
3. CC drives Playwright headless: navigate to Cygnus growth conversation page (or Jenny's), switch to Unsecured Loan track, open the artifact dialog
4. CC takes a fresh full-page screenshot of the dialog
5. CC programmatically inspects the rendered SVG/DOM for the Net Benefit bar's fill color
6. CC confirms the fill is NOT black (`#000`, `#000000`, `rgb(0,0,0)`, or `black`)
7. CC confirms the fill IS within the orange family per palette.ts

If any check fails, CC stops and investigates. No "I fixed it" until all 6 steps pass.

### 7.4 Acceptance criteria

- [ ] Net Benefit bar fill verified NOT black via programmatic DOM inspection
- [ ] Net Benefit bar fill verified IS palette orange via reference to palette.ts constants
- [ ] Visually distinguishable from Opportunity Value bar (via opacity, stroke, or distinct shade)
- [ ] Fresh Playwright screenshot included in checkpoint report
- [ ] No new colors introduced to palette.ts

---

## Block 8 — Full Playwright verification

### 8.1 Required verifications

Run Playwright with full-page capture across all three affected visualizations:

**Vehicle Loan (Northland TRACK-002):**
- Three vertical bars visible
- Two dotted horizontal capacity lines visible
- Bar 2 and Bar 3 have dotted debt service overlay on top
- Induced demand segment in Bar 3 visually distinct
- All annotations readable
- Screenshot saved

**CRE chart (Cygnus TRACK-003):**
- Four lines visible in legend
- New "Own — net position" line clearly crosses below "Continued leasing — total paid" near the annotated year
- Existing 3 lines preserved
- Annotation reads accurately given new visual
- Screenshot saved

**Unsecured (Cygnus or Northland TRACK-011):**
- Net Benefit bar visibly NOT black
- Net Benefit bar in orange family
- Interest cost bar still in cost color (muted red)
- Opportunity value bar in orange (afterState)
- Visually distinguishable hierarchy
- Screenshot saved

### 8.2 No regression checks

Run Playwright on these visualizations to confirm Patch H didn't break them:
- PACE (Cygnus, Jenny) — stacking flip preserved
- SBA 504 composite (Cygnus) — roadmap + structure comparison preserved
- Equipment cost-of-doing-nothing (Northland) — preserved
- Lease vs Own existing 3 lines on chart — preserved alongside new fourth line
- Business Visa capability matrix (Jenny) — preserved
- Investment Property (any fixture) — preserved
- Growth Trajectory (any fixture) — preserved

### 8.3 BUILD_LOG entry

Document:
- Vehicle Loan redesigned to three-bar stacked with capacity ceilings and debt service overlay
- CRE chart added explicit Net Position line; year-1 crossover now visually obvious
- Unsecured Net Benefit color restored to orange family; verification protocol applied
- No palette modifications
- No green+orange adjacency anywhere

### 8.4 Acceptance criteria

- [ ] All three affected visualizations verified with fresh full-page screenshots
- [ ] No regressions on other Sprint 9 visualizations
- [ ] BUILD_LOG entry comprehensive
- [ ] Production build clean
- [ ] TypeScript clean

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-8 shipped per acceptance criteria
2. Three fresh full-page Playwright screenshots:
   - Northland Vehicle Loan (three-bar stacked with capacity ceilings + debt service overlay)
   - Cygnus CRE (four lines including Net Position with crossover visible at annotated year)
   - Cygnus or Northland Unsecured (Net Benefit bar visibly in orange family, NOT black)
3. Per-component summary of changes
4. Sample parameter values verified:
   - Northland Vehicle Loan: current_monthly_revenue, current_declined_revenue_monthly, projected_induced_demand_monthly, monthly_debt_service — and the computed coverage ratios
   - Cygnus CRE: computed net-position crossover year
5. Verification protocol confirmation for Unsecured fix:
   - `pnpm db:reset && pnpm db:snapshot` completed cleanly
   - Programmatic DOM inspection of Net Benefit bar fill color (paste the actual hex code or color name found)
   - Confirmation hex is NOT in black family
6. Any deviations from spec with rationale

After this patch ships and visual review confirms (three-bar Vehicle Loan reads, CRE crossover visually obvious, Unsecured Net Benefit clearly orange), next in sequence is **Sprint 6 production deployment to Vercel**.

---

## Estimated scope

0.5-0.75 effective build day CC time.

Breakdown:
- **Block 1-4 (Vehicle Loan redesign)** — New parameters + three-bar stacked structure + capacity lines + debt service overlay + supporting text; ~0.3 day
- **Block 5-6 (CRE Net Position line)** — Math + new line rendering; ~0.15 day
- **Block 7 (Unsecured color fix)** — Single line of code + strict verification protocol; ~0.1 day
- **Block 8 (verification)** — Full Playwright + regression; ~0.1 day

Smaller than Patch G because two of three fixes are surgical. Vehicle Loan is the largest effort.

After this patch lands, visualization layer should be cohesive and ready for production deployment.
