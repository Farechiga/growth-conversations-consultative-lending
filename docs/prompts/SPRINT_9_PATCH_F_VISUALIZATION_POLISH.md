# Sprint 9 Patch F — Visualization Polish

**Prompt for Claude Code. Single patch. Four-component visualization fixes after post-reseed visual review. Unsecured range anchoring, Business Vehicle Loan capacity uplift redesign, PACE stacking flip, SBA 504 verification. Estimated 0.5-1 effective build day CC time.**

## Pre-flight context

The migration drift issue from earlier (Patch E's TrackTemplate.member_type_applicability column missing) was resolved by CC generating a proper migration file. `pnpm db:reset && pnpm db:snapshot` ran cleanly and reseeded successfully.

Post-reseed visual review surfaced four issues across the visualization layer:

1. **UnsecuredOpportunityChart** — Range mode renders floating bars hovering above zero (opportunity band from $22K-$32K floats in mid-air, net benefit band similar). The visual is confusing because conventional bar charts anchor at zero. Range bands need anchoring.

2. **VehicleFinancingSummary** — Currently renders as structured summary card (VEHICLE / FINANCING / DEBT SERVICE / CAPACITY CONTEXT sections with values). This is informative but doesn't tell a business-impact story per Sprint 9 design pattern. Needs new visualization showing capacity uplift before/after.

3. **PaceMonthlySavingsChart** — Current stacking (red assessment at bottom, green net benefit on top) reads as "cost first, benefit on top of it." The intended grammar is "gross savings minus assessment leaves net" — assessment should subtract from the top of the gross savings bar, leaving net benefit visible at the bottom.

4. **Sba504StructureComparison** — Q3 verification confirmed the composite renders correctly (roadmap above, structure comparison below, separated by standard 16px gap). The earlier perception of "no comparison chart visible" was caused by Playwright dialog screenshot capturing only visible viewport. Patch F includes a defensive Playwright capture improvement to prevent this in future audits.

**Read these governance documents before starting:**

1. Existing component: `app/v2/members/[id]/artifact-visualizations/UnsecuredOpportunityChart.tsx`
2. Existing component: `app/v2/members/[id]/artifact-visualizations/VehicleFinancingSummary.tsx` (if exists) or the current summary card rendering
3. Existing component: `app/v2/members/[id]/artifact-visualizations/PaceMonthlySavingsChart.tsx`
4. Existing component: `app/v2/members/[id]/artifact-visualizations/Sba504StructureComparison.tsx`
5. Palette constants: `app/v2/members/[id]/artifact-visualizations/palette.ts`
6. Playwright probe scripts: `scripts/.verify-visualizations-out/` and any related probe scripts
7. Original Sprint 9 spec for VehicleFinancingSummary design intent (capacity uplift framing)

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked):**

- **Unsecured range mode:** Choice A2 — solid bar from $0 to central estimate, translucent fill from central to high estimate. Anchors at zero. Central estimate is the banker's best read; upside above is contingent.
- **Vehicle Loan:** Design new visualization following Sprint 9 business-impact pattern. Show capacity utilization before (80% with declined demand visible) → capacity after new vehicle (65% with declined demand eliminated). Existing summary card replaced.
- **PACE:** Flip the stacking. Each year's bar shows gross annual energy savings as total height. Assessment portion (gray) sits at the TOP of the bar, visually "subtracting" from gross savings. Net benefit (green) is the BOTTOM portion of the bar, representing what the Member keeps. Post-PACE term: bar is entirely green (no assessment), same total height as during-PACE bars.
- **SBA 504:** No structural fix needed — composite verified working. Improve Playwright probe scripts to do full-page capture to prevent similar perception issues in future audits.
- Color palette from earlier patches preserved.

## What ships in this patch

Seven blocks across four phases. Single checkpoint.

**Phase 1 — Unsecured chart fix:**
- **Block 1 — Anchor range bars at zero (Choice A2 implementation).**

**Phase 2 — Vehicle Loan redesign:**
- **Block 2 — New VehicleFinancingSummary visualization design.**
- **Block 3 — Parameter schema for new visualization.**

**Phase 3 — PACE stacking flip:**
- **Block 4 — Reverse stack order in PaceMonthlySavingsChart.**
- **Block 5 — Annotation and supporting text updates.**

**Phase 4 — Verification and Playwright improvement:**
- **Block 6 — Sba504StructureComparison verification documentation.**
- **Block 7 — Playwright probe full-page capture improvement.**

This patch does NOT ship: changes to other Sprint 9 visualizations; changes to Sprint 7b drill-downs; production deployment; DEMO_RUNBOOK changes.

---

## Block 1 — Anchor range bars at zero (Unsecured)

### 1.1 Implementation pattern — Choice A2

For range mode (Mode 2 or Mode 3 from Patch D):

**Opportunity value bar:**
- Solid bar from $0 to `opportunity_value` (central estimate)
- Translucent fill region from `opportunity_value` to `opportunity_value_high`
- Treatment: solid portion uses `afterState` (warm Blaze accent) at full opacity. Translucent portion uses same color at ~30-40% opacity.

**Net benefit bar:**
- Solid bar from $0 to `net_benefit_central` (computed from opportunity_value - total_interest_over_term)
- Translucent fill region from `net_benefit_central` to `net_benefit_high`
- Treatment: solid uses `benefit` (muted green). Translucent uses same color at ~30-40% opacity.

**Interest cost bar:** Unchanged — always single-value solid bar in `cost` (muted red) anchored at zero. Interest is computed from loan terms and doesn't have range mode.

### 1.2 Mode 2 fallback (no central estimate)

If banker captured only low and high estimates (Mode 2 — no central), compute midpoint as `(low + high) / 2` and use as the implicit central for the solid portion. Translucent extends from midpoint to high.

Document this fallback in component code comments so future maintainers understand the logic.

### 1.3 Visual reading

The new visualization should read as:
- "Solid portion: this is what we're confident about (the central estimate)"
- "Translucent portion: upside above central — could reach the high estimate but uncertain"

For Jenny's range scenario ($22K-$32K range with $27K central): solid bar from $0 to $27K + translucent from $27K to $32K. Reader's eye sees "we think she captures ~$27K, with upside to $32K."

### 1.4 Risk flag preservation

The dashed cost-red outline for negative low-end net benefit (from Patch D) is preserved. If `net_benefit_low` (computed from `opportunity_value_low - total_interest_over_term`) falls at or below zero, the net benefit bar still gets the dashed outline flag.

### 1.5 Labels and annotations

Bar labels above each bar:
- Interest cost: single value (e.g., "$2K")
- Opportunity value: range "$22K – $32K" or single value if point mode
- Net benefit: range "$20K – $30K" or single value if point mode

Below the chart, the existing "Opportunity captured as a range — bars span the low-to-high estimate. Net benefit inherits the same uncertainty." annotation needs slight rewording to match new anchoring:

> Solid bars show the central estimate. Translucent fill shows upside to the high estimate. Bars anchor at zero — definite outcome plus uncertain upside.

### 1.6 Acceptance criteria

- [ ] Range mode bars anchor at zero
- [ ] Solid portion from $0 to central estimate (or midpoint if Mode 2)
- [ ] Translucent portion from central to high estimate
- [ ] Translucent opacity ~30-40% of solid
- [ ] Interest cost bar unchanged (single value solid)
- [ ] Risk flag preservation for negative low-end
- [ ] Labels and annotation reflect new structure
- [ ] Point mode (Mode 1) unchanged — solid bars from zero to value
- [ ] Playwright re-verification passes

---

## Block 2 — New VehicleFinancingSummary visualization design

### 2.1 Visualization concept — capacity uplift before/after

The Vehicle Loan business-impact story:
- **Before:** Business has high capacity utilization (e.g., 80%). Demand exceeds capacity. Declined jobs accumulate as lost revenue.
- **After:** New vehicle(s) expand fleet capacity. Utilization drops to comfortable level (e.g., 65%). Declined demand eliminated. Previously-lost revenue captured.

The visualization shows this transformation directly. Reader sees "this is your business today, this is your business with the loan."

### 2.2 Chart structure — two-bar horizontal grouped comparison

Two horizontal stacked bars side-by-side or stacked vertically:

**Bar 1 — "Today" (before vehicle expansion):**
- Total bar represents current fleet capacity
- Segment 1 (solid `beforeState` muted slate): "Capacity used" — `current_capacity_utilization` % of total
- Segment 2 (`beforeStateLight` lighter slate): "Capacity buffer" — remaining % up to 100%
- Annotation to the right: "Declined demand: $X/month in lost revenue"

**Bar 2 — "With new vehicle(s)" (after expansion):**
- Total bar represents expanded fleet capacity (capacity_uplift% larger than current)
- Segment 1 (solid `afterState` warm Blaze accent): "Capacity used" — new utilization % (e.g., 65%)
- Segment 2 (`afterStateLight` lighter orange): "Capacity buffer" — new buffer % up to 100%
- Annotation to the right: "Declined demand: $0/month (eliminated)"
- Below this bar: "Previously declined revenue now captured: $X/month"

### 2.3 Visual proportion

Bar 2 should be visibly longer than Bar 1 to show capacity expansion. Length ratio = (100% + capacity_uplift%) / 100%.

For example, if current capacity = 100 jobs/month and new vehicle adds 22% capacity, Bar 2 is 1.22x longer than Bar 1.

### 2.4 Parameter schema confirmation

The existing parameter schema for ARTIFACT-TEMPLATE-002 (TRACK-002 Business Vehicle Loan) should support this visualization. Required parameters per Sprint 9 Block B.2:

- `vehicle_type` — display only
- `vehicle_count` — display only
- `purchase_price` — display only
- `down_payment` — display only
- `loan_amount` — display only (computed)
- `term_months` — display only
- `rate_type` — display only
- `monthly_debt_service` — display only or supplementary annotation
- `capacity_utilization_now` — **drives Bar 1 utilization segment**
- `demand_exceeding_capacity` — drives "declined demand" annotation Bar 1
- `expected_capacity_uplift` — **drives Bar 2 sizing (relative to Bar 1)**

Two new parameters may be needed:
- `current_declined_revenue_monthly` — drives the dollar annotation on Bar 1 ("Declined demand: $X/month")
- `captured_revenue_after_uplift_monthly` — drives annotation below Bar 2

CC determines whether to add new parameters or derive from existing. If adding, follow source_factor_id linkage pattern from Sprint 8.

### 2.5 Supporting text below chart

Replace current summary card sections with a single supporting paragraph that ties the visual to financial reality:

> Today, capacity is at {current_capacity_utilization}% with demand exceeding what {member} can serve. Declined jobs cost approximately {current_declined_revenue_monthly}/month in lost revenue. With {vehicle_count} new {vehicle_type}{plural_suffix}, fleet capacity expands by {expected_capacity_uplift}% and utilization drops to a comfortable {new_capacity_utilization}%. Monthly debt service: {monthly_debt_service}. Previously-declined revenue now captured: approximately {captured_revenue_after_uplift_monthly}/month — exceeding the debt service by {revenue_minus_debt_service}/month. The loan funds itself from operations.

(Substitute appropriately. CC refines wording.)

### 2.6 Acceptance criteria

- [ ] Old summary card replaced with capacity uplift visualization
- [ ] Bar 1 represents current state with capacity utilization + declined demand annotation
- [ ] Bar 2 represents post-loan state with new capacity utilization (lower utilization on expanded base) + eliminated declined demand
- [ ] Bar 2 visually longer than Bar 1 proportional to capacity_uplift
- [ ] Supporting text ties chart to monthly debt service and captured revenue
- [ ] Visual reads as before/after business effect
- [ ] Parameter schema supports the visualization

---

## Block 3 — Parameter schema for new VehicleFinancingSummary

### 3.1 Additions

If Block 2.4 requires new parameters, add to ARTIFACT-TEMPLATE-002 parameter_schema:

```json
{
  "key": "current_declined_revenue_monthly",
  "label": "Current declined revenue per month",
  "type": "currency",
  "required": true,
  "helper": "Estimated revenue from jobs the business declined this month due to capacity constraints."
},
{
  "key": "captured_revenue_after_uplift_monthly",
  "label": "Captured revenue per month after new vehicle(s)",
  "type": "currency",
  "computed": true,
  "computation": "current_declined_revenue_monthly * (expected_capacity_uplift / 100)",
  "helper": "Estimated previously-declined revenue now servable with expanded capacity."
}
```

Alternative: derive these inline from existing parameters without adding new fields. CC judgment.

### 3.2 Acceptance criteria

- [ ] Parameter schema supports new visualization
- [ ] Either new params added OR existing params used cleanly
- [ ] Fixture data (Northland) updated to populate new params if added

---

## Block 4 — Reverse stack order in PaceMonthlySavingsChart

### 4.1 New stack order

Per Q4 confirmation:

**During-PACE bars (years 1 through pace_term_years):**

Each bar's total height = annual energy savings (full gross savings, e.g., $93,600).

Stack from TOP to BOTTOM:
1. **Top segment — Annual PACE assessment** (gray)
   - Color: `cost` (muted red, or stay with gray per current palette decision)
   - Height: annual PACE assessment amount (e.g., $37,577)
   - Position: TOP of bar (visually "subtracting" from gross savings)
   
2. **Bottom segment — Net energy savings benefit** (green)
   - Color: `benefit` (muted green)
   - Height: annual energy savings - annual PACE assessment (e.g., $56,023)
   - Position: BOTTOM of bar (what the Member keeps)

**Post-PACE bars (years after pace_term_years):**

Bar is entirely green at the same total height (annual energy savings). No gray segment.

### 4.2 Implementation note

In Recharts, this means the stack data order in the data array determines visual stacking. The first item in the stack array renders at the bottom. The second renders on top.

Configure stack so:
- First (bottom): net benefit value (savings - assessment)
- Second (top): assessment value

This produces "net benefit at the bottom, assessment on top" stacking.

### 4.3 Cliff effect preservation

The "PACE paid off" annotation line at year `pace_term_years + 0.5` remains. Post-PACE bars showing as pure green (no top gray segment) is the cliff effect.

The visual reading becomes: "during PACE, gray on top eats into your savings (subtracting from gross). After PACE, no gray — all savings is yours."

### 4.4 Acceptance criteria

- [ ] During-PACE bars stack with net benefit (green) at bottom, assessment (gray/red) at top
- [ ] Post-PACE bars are entirely green at same total height as during-PACE bars
- [ ] Total bar height = annual energy savings (consistent across PACE and post-PACE)
- [ ] Cliff annotation line preserved
- [ ] Visual contrast clearly visible: top gray segment disappears at year `pace_term_years + 1`

---

## Block 5 — Annotation and supporting text updates (PACE)

### 5.1 Legend update

Legend order matches new stacking:
- "Net energy savings benefit" (green) — bottom of bar
- "Annual PACE assessment" (gray/red) — top of bar

CC chooses legend display order. Both visible legends should reflect new grammar.

### 5.2 Supporting paragraph below chart

Existing supporting paragraph already mentions the cliff. Update to match new stacking grammar:

> Annual energy savings: $X. The annual PACE assessment of $Y is taken from the top of those savings (paid through your property tax for {pace_term_years} years), leaving net annual benefit of $Z. After year {pace_term_years}, the assessment ends — the full $X in annual savings flows to your cashflow. Cumulative net benefit over 25 years: $A.

Substitute parameter values appropriately. The phrasing "taken from the top" matches the visual.

### 5.3 output_summary_template update

Match the new framing in ArtifactTemplate seed:

```
{improvement_type} at {improvement_cost} financed via PACE over {pace_term_years} years. Annual energy savings of {annual_energy_savings} fund the property tax assessment of {annual_assessment} — assessment is taken from the top, net benefit of {annual_net_benefit} flows to your cashflow during the PACE term. After year {pace_term_years}, no more assessment; full {annual_energy_savings} in annual savings is yours. Cumulative net benefit over 25 years: {cumulative_benefit}.
```

Refine for natural reading.

### 5.4 Acceptance criteria

- [ ] Legend reflects new stacking order
- [ ] Supporting paragraph uses "taken from the top" framing
- [ ] output_summary_template updated
- [ ] No placeholder leakage

---

## Block 6 — Sba504StructureComparison verification documentation

### 6.1 No code fix needed

Q3 verification from CC confirmed:
- The composite renders correctly: roadmap above, structure comparison below
- Both render together in same dialog
- Standard 16px gap between
- Reseed didn't break this

### 6.2 BUILD_LOG entry

Add a note in BUILD_LOG documenting:
- Q3 perceived issue: structure comparison "not visible"
- Root cause: Playwright dialog screenshot captures only visible viewport, cropping out below-fold content
- Resolution: composite was always rendering correctly; perception issue resolved via improved verification

### 6.3 No further action

This block is documentation only. Composite rendering preserved as-shipped in Sprint 9 Block F.

### 6.4 Acceptance criteria

- [ ] BUILD_LOG entry added
- [ ] No code changes to Sba504StructureComparison

---

## Block 7 — Playwright probe full-page capture improvement

### 7.1 Defensive improvement to verification scripts

The Playwright verification scripts (`scripts/verify-artifacts.mjs` or similar) currently use `dialog.screenshot()` which captures only the visible viewport. For tall composite dialogs (like SBA 504), this can crop content below the fold.

Improve the scripts to:
- Use full-page capture for dialog content (`fullPage: true` or similar)
- Or: capture multiple screenshots (header + body) for tall dialogs and combine
- Or: skip image capture and use DOM-based phrase-presence checks (as CC did with `scripts/probe-sba504.mjs`)

CC chooses the approach. The goal: future visualization audits don't get cropped.

### 7.2 Reusable composite probe

The `scripts/probe-sba504.mjs` pattern (full-page capture + DOM phrase-presence check) is a good template. Consider generalizing into a reusable probe pattern for any composite-render verification.

### 7.3 Acceptance criteria

- [ ] Playwright verification scripts capture full dialog content
- [ ] No cropping of below-fold content
- [ ] Reusable composite probe pattern documented or available

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-7 shipped per acceptance criteria
2. Playwright screenshots (full-page captures):
   - Unsecured chart in range mode showing anchored bars with translucent upside
   - Unsecured chart in point mode (unchanged behavior)
   - Vehicle Financing Summary new visualization for Northland
   - PACE chart with flipped stacking (net benefit on bottom, assessment on top)
   - PACE post-PACE bars pure green at same height
   - SBA 504 composite verification (roadmap + structure comparison both visible in full-page capture)
3. Per-component summary of changes
4. Sample parameter values for fixture verification:
   - Northland VehicleFinancingSummary: capacity_utilization_now, expected_capacity_uplift, declined revenue values
   - Jenny Unsecured range: opportunity_value_low/high, central estimate
   - Any fixture PACE: annual energy savings, annual assessment
5. Any deviations from spec with rationale

After this patch ships and visual review confirms, sequence is:
- **Sprint 6 production deployment to Vercel**
- **DEMO_RUNBOOK review + demo rehearsal**

---

## Estimated scope

0.5-1 effective build day CC time.

Breakdown:
- **Block 1 (Unsecured anchoring)** — Recharts data restructuring for solid + translucent stacking; ~0.2 day
- **Block 2 (Vehicle Loan redesign)** — New component design + implementation; ~0.4 day
- **Block 3 (parameter schema)** — Additive schema work; ~0.1 day
- **Block 4 (PACE flip)** — Reverse stack data array; ~0.1 day
- **Block 5 (PACE annotations)** — Text rewrites; ~0.05 day
- **Block 6 (SBA 504 doc)** — BUILD_LOG entry only; ~0.05 day
- **Block 7 (Playwright improvement)** — Full-page capture refactor; ~0.1 day

Vehicle Loan redesign (Block 2) is the largest effort. It's a meaningful new visualization, not a tweak.

After this patch lands, the visualization layer should be cohesive and ready for production deployment. Sprint 6 deployment is the next step in the Option C-1 sequence.
