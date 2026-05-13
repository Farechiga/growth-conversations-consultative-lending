# Sprint 9 Patch G — Annotation, Color, Vehicle, and Visa Fixes

**Prompt for Claude Code. Single patch. Four fixes: CRE annotation logic (net position vs cumulative cost), Unsecured net benefit color correction within existing palette, Business Vehicle Loan redesign with induced demand parameters and three-row temporal visualization, Business Visa replacement with capability matrix. Estimated 1.5 effective build days CC time.**

## Pre-flight context

Patch F shipped four visualization fixes but visual review surfaced four remaining issues:

1. **CRE annotation logic wrong:** Chart says "Ownership pulls ahead at year 1" but ownership cumulative cost ($6.12M) is higher than leasing cumulative cost ($5.80M) at year 15. The annotation should reference NET POSITION (cumulative cost minus equity built), where ownership genuinely pulls ahead early. Currently misleads viewer.

2. **Unsecured net benefit rendering in black:** Net benefit bar renders as solid black instead of within the established palette. This is a palette adherence issue. The fix is restoring the correct palette color, NOT changing colors.

3. **Business Vehicle Loan visualization not revelatory:** Current "fill the gap" framing (Today capacity at 95% with $4,200/month declined → with vehicles capacity stays high but declined revenue captured) misses the larger business story. The loan doesn't just recover existing lost revenue — it unlocks growth opportunities previously impossible due to capacity constraints. Need induced demand parameter and three-row temporal visualization.

4. **Business Visa cashback chart doesn't work:** Forcing Business Visa into dollar-comparison chart picks the smallest, weakest dimension of its value. Business Visa's actual value is multi-dimensional operational infrastructure (expense visibility, working capital cushion, credit story, operational flexibility). Capability matrix replaces the chart.

**Read these governance documents before starting:**

1. Existing component: `app/v2/members/[id]/artifact-visualizations/LeaseVsOwnChart.tsx`
2. Existing component: `app/v2/members/[id]/artifact-visualizations/UnsecuredOpportunityChart.tsx`
3. Existing component: `app/v2/members/[id]/artifact-visualizations/VehicleFinancingSummary.tsx`
4. Existing component: `app/v2/members/[id]/artifact-visualizations/CashbackOpportunityChart.tsx`
5. Palette constants: `app/v2/members/[id]/artifact-visualizations/palette.ts`
6. ArtifactTemplate seed: `prisma/seed-artifact-templates.ts` (for parameter schema updates)

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked through earlier conversation):**

- **Color discipline preserved without changes.** The existing palette stays as-is: black/grey/orange across the build. Accent colors per visualization:
  - Unsecured: orange family (the loan is the enabler)
  - PACE: green family (savings as ongoing benefit)
  - Vehicle Loan: orange family (vehicles as the enabler)
- DO NOT modify palette.ts color constants. The fix for Unsecured net benefit is restoring the correct existing palette color to that bar, not introducing new colors.
- **CRE annotation:** Reference NET POSITION (cumulative cost minus equity), not cumulative cost alone, for crossover calculations.
- **Vehicle Loan:** Three-row temporal progression. Today / Month 1 with vehicles / Month 12 projected. Show induced demand growth in addition to recaptured declined revenue. New parameters required.
- **Business Visa:** 4-card capability matrix replacing cashback chart. Themes: Expense Visibility, Working Capital Cushion, Credit Story, Operational Flexibility. One visual element (progress bar for cushion).

## What ships in this patch

Ten blocks across four phases. Single checkpoint.

**Phase 1 — CRE annotation fix:**
- **Block 1 — Net position calculation logic.**
- **Block 2 — Annotation text update.**

**Phase 2 — Unsecured color correction:**
- **Block 3 — Net benefit bar palette adherence.**

**Phase 3 — Vehicle Loan induced demand redesign:**
- **Block 4 — New parameter schema additions.**
- **Block 5 — Three-row visualization structure.**
- **Block 6 — Supporting text and seed updates.**

**Phase 4 — Business Visa capability matrix:**
- **Block 7 — Capability matrix component design.**
- **Block 8 — Parameter schema updates for capability content.**
- **Block 9 — Seed data and supporting text.**
- **Block 10 — Verification.**

This patch does NOT ship: changes to other visualizations; changes to palette.ts; changes to Sprint 7b drill-downs; production deployment.

---

## Block 1 — Net position calculation logic (CRE)

### 1.1 The math

Current LeaseVsOwnChart computes:
- Lease cumulative cost over time
- Own cumulative cost over time (mortgage payments)
- Equity accumulated over time (principal paydown + property appreciation)

The annotation "Ownership pulls ahead at year X" currently references the crossover of cumulative cost lines, which can be misleading. Ownership cumulative cost may always be higher than leasing cumulative cost. What matters is NET POSITION.

Net position formula:
- **Lease net position at year N** = -(cumulative rent paid through year N)
- **Own net position at year N** = -(cumulative mortgage paid through year N) + (equity built at year N)

Net position is the wealth impact accounting for what you've spent AND what you own.

### 1.2 Crossover calculation

Compute crossover where:
- (Own net position at year N) > (Lease net position at year N)

Or equivalently:
- (Equity built at year N) > (Cumulative mortgage paid - Cumulative rent paid at year N)

This crossover typically happens within the first few years for most CRE scenarios because equity builds via both principal paydown and appreciation, while rent paid produces zero equity.

### 1.3 Implementation

Update `LeaseVsOwnChart.tsx` to compute net position series alongside cumulative cost series. Find the year where own net position first exceeds lease net position. Annotate that year.

If the crossover is year 1 (very early), the annotation: "Ownership net position pulls ahead at year 1 — equity builds faster than the cost differential."

If the crossover is later (e.g., year 6): "Ownership net position pulls ahead at year 6 once equity exceeds the cost gap."

### 1.4 Acceptance criteria

- [ ] Net position computed for both lease and own scenarios
- [ ] Crossover year computed from net position, not cumulative cost
- [ ] Annotation accurately reflects the net-position crossover
- [ ] Math correct for sample fixture values (Cygnus CRE scenario)
- [ ] No regression on other annotations in the chart

---

## Block 2 — Annotation text update (CRE)

### 2.1 Annotation language

Update the chart annotation to reflect net position framing:

**For early crossover (year 1-3):**
> Ownership net position pulls ahead at year [X] — equity builds faster than the cost differential.

**For mid crossover (year 4-8):**
> Ownership net position pulls ahead at year [X] once equity exceeds the cumulative cost gap.

**For late crossover (year 9+):**
> Ownership net position pulls ahead at year [X]; until then, leasing is cheaper but builds no equity.

CC chooses appropriate phrasing based on actual crossover year computed.

### 2.2 Supporting text below chart

Update existing supporting text to match the net position framing. Current text says:

> Industrial at $4,800,000. Mortgage of $4,400,000 at 7.25, 25-year term. Current rent $26,000/month vs. owning. Crossover to ownership advantage around year 6-8; substantial equity built by year 15.

Updated:

> [Property type] at {acquisition_price}. Mortgage of {loan_amount} at {interest_rate}, {amortization_years}-year term. Current rent {current_monthly_rent}/month. Cumulative cost-wise, leasing remains lower through the term — but owning builds {equity_at_year_15} in equity vs leasing's $0. Net position (cost minus equity) shifts in favor of ownership at year [computed_crossover]. At year 15: lease total paid {lease_total_paid} with $0 equity; own total paid {own_total_paid} and built {equity_at_year_15} in equity.

CC refines language for natural reading.

### 2.3 Acceptance criteria

- [ ] Annotation text reflects net position crossover accurately
- [ ] Supporting text below chart updated
- [ ] No misleading framing about cumulative cost crossover

---

## Block 3 — Net benefit bar palette adherence (Unsecured)

### 3.1 The fix

Current UnsecuredOpportunityChart renders the Net Benefit bar as solid black instead of using the established palette. This is a palette adherence regression.

The bar should use the existing palette color appropriate for net benefit. Per Sprint 9 design and Patch A+B, this would be a color within the orange family (Unsecured uses orange family per Section 4.1 decision).

Two options for restoring correct color:
- Option (a) — Same `afterState` orange as opportunity value bar, slight variation (slightly lighter/darker or with pattern/border)
- Option (b) — A distinct orange-family color from the existing palette (e.g., `afterStateLight` or `afterStateDark` if these exist; otherwise an existing palette variant)

CC chooses based on existing palette constants. No new colors introduced.

### 3.2 Visual distinction

If both opportunity value and net benefit are orange-family, they need to be visually distinguishable. Options:
- Different opacity (e.g., opportunity at 100%, net benefit at 80%)
- Different fill pattern (subtle, e.g., diagonal lines on one)
- Different stroke/border treatment

CC chooses minimally-invasive treatment that maintains palette discipline.

### 3.3 Acceptance criteria

- [ ] Net Benefit bar no longer renders as black
- [ ] Net Benefit bar uses existing palette color (orange family)
- [ ] Visually distinguishable from Opportunity Value bar
- [ ] No new colors introduced to palette.ts
- [ ] Interest cost bar unchanged (cost/red)
- [ ] Range mode anchoring from Patch F preserved

---

## Block 4 — New parameter schema additions (Vehicle Loan)

### 4.1 New parameters

Add to ARTIFACT-TEMPLATE-002 parameter_schema:

```json
{
  "key": "current_declined_revenue_monthly",
  "label": "Current declined revenue per month",
  "type": "currency",
  "required": true,
  "helper": "Estimated revenue from jobs the business declined this month due to capacity constraints."
},
{
  "key": "projected_induced_demand_monthly",
  "label": "Projected induced demand revenue per month (12-month horizon)",
  "type": "currency",
  "required": true,
  "helper": "Banker estimate of new growth revenue the expanded capacity enables — new customers, geographic expansion, larger contracts. Realized over the projection horizon."
},
{
  "key": "induced_demand_realization_months",
  "label": "Months to realize induced demand",
  "type": "integer",
  "default": 12,
  "required": false,
  "helper": "Time horizon over which induced demand materializes (e.g., 12 months for typical service business growth ramp)."
}
```

`projected_induced_demand_monthly` is critical — this is the new economic value the loan unlocks beyond gap-fill. It's a banker estimate during the conversation (banker_estimate capture mode likely).

### 4.2 Source factor linkage

These are new banker-estimate parameters. No existing FACTOR-NNN maps to them. Leave without `source_factor_id`. Banker captures during conversation; missing-parameter CTA (Sprint 8) handles the case where banker hasn't captured.

### 4.3 Acceptance criteria

- [ ] New parameters added to ARTIFACT-TEMPLATE-002 schema
- [ ] Parameters have appropriate helper text
- [ ] No source_factor_id linkage (banker-estimate)
- [ ] Existing parameters preserved

---

## Block 5 — Three-row visualization structure (Vehicle Loan)

### 5.1 Visualization design

Replace current two-bar capacity visualization with three-row progressive temporal structure.

Each row shows a horizontal bar representing monthly revenue. Bars grow progressively across the three rows, telling a "loan effect compounds over time" story.

**Row 1 — "Today":**
- Bar: current monthly revenue (computed or from existing parameter)
- Annotation: "$X/month declined (lost capacity)"
- Treatment: grey/muted (current state, status quo)

**Row 2 — "With new vehicle(s) — month 1":**
- Bar: current revenue + recaptured declined revenue (current_declined_revenue_monthly captured)
- Annotation: "Captured $X/month previously declined"
- Treatment: orange (afterState, loan-enabled outcome — month 1 immediate effect)

**Row 3 — "With new vehicle(s) — month 12 projected":**
- Bar: current revenue + recaptured declined revenue + induced demand growth
- Annotation: "Plus $Y/month from growth opportunities now servable"
- Treatment: orange (afterState, same family as Row 2; possibly slightly more intense to indicate compounding effect)

### 5.2 Visual proportion

Bars in Rows 2 and 3 are visibly longer than Row 1. Row 3 is the longest. The visual progression reads as compound growth.

For Northland scenario: if current revenue is $X/month, declined is $4,200/month, and induced demand at month 12 is (banker estimate) $6,000/month additional:
- Row 1: bar length $X
- Row 2: bar length $X + $4,200
- Row 3: bar length $X + $4,200 + $6,000

### 5.3 Comparison to monthly debt service

Debt service is a constant. Below the three rows, add small reference annotation:

> Monthly debt service: $[monthly_debt_service]
> 
> Recaptured revenue (month 1) covers debt service by [coverage_ratio]x.
> Combined with projected induced demand (month 12), the loan funds itself many times over.

CC computes coverage_ratio = recaptured_revenue / monthly_debt_service.

### 5.4 Acceptance criteria

- [ ] Three-row visualization replaces two-bar capacity comparison
- [ ] Row 1 shows current state with declined demand annotation
- [ ] Row 2 shows month-1 recapture (current + declined recaptured)
- [ ] Row 3 shows month-12 projected (Row 2 + induced demand growth)
- [ ] Bars visually proportional, growing progressively
- [ ] Treatment uses orange family per locked decision
- [ ] Debt service annotation provides financial coverage context

---

## Block 6 — Supporting text and seed updates (Vehicle Loan)

### 6.1 Supporting text below chart

Replace existing supporting text with new framing that captures the temporal story:

> Today, fleet capacity at {current_capacity_utilization}% with demand exceeding what {member_name} can serve. Declined jobs cost approximately {current_declined_revenue_monthly}/month in lost revenue.
>
> With {vehicle_count} new {vehicle_type}{plural_suffix}, immediate effect: previously-declined revenue captured (~{current_declined_revenue_monthly}/month). Within {induced_demand_realization_months} months: expanded capacity enables growth opportunities currently impossible — new contracts, geographic reach, larger jobs. Projected additional revenue: ~{projected_induced_demand_monthly}/month.
>
> Monthly debt service of {monthly_debt_service} is dwarfed by the combined recapture + induced demand value. Loan economically justifies itself from operations.

CC refines wording.

### 6.2 output_summary_template update

Update ArtifactTemplate seed output_summary_template to match:

```
{vehicle_count} {vehicle_type} at {purchase_price}, financed at {loan_amount} after {down_payment} down. Monthly debt service {monthly_debt_service}. Immediate effect: {current_declined_revenue_monthly}/month previously-declined revenue captured. Projected effect over {induced_demand_realization_months} months: additional {projected_induced_demand_monthly}/month from growth opportunities the expanded capacity enables. Combined revenue impact substantially exceeds debt service.
```

### 6.3 Fixture data updates (Northland)

Update Northland's TRACK-002 fixture parameter values to populate new parameters with realistic values. Suggested:

- `current_declined_revenue_monthly`: $4,200
- `projected_induced_demand_monthly`: $6,000 (banker estimate; banker_estimate capture mode)
- `induced_demand_realization_months`: 12

The induced demand value should be marked as banker_estimate so the visual flag (per Patch A+B / Sprint 8) is visible — this demonstrates two-mode capture in a real artifact context.

### 6.4 Acceptance criteria

- [ ] Supporting text below chart matches new temporal framing
- [ ] output_summary_template updated
- [ ] Northland fixture data populates new parameters
- [ ] Induced demand parameter marked as banker_estimate (where applicable)
- [ ] No placeholder leakage

---

## Block 7 — Capability matrix component design (Business Visa)

### 7.1 Component structure

New component: `BusinessVisaCapabilityMatrix.tsx`

Replace existing CashbackOpportunityChart entirely. Render 4-card grid (2×2 layout).

Each card represents one capability unlock. Structure per card:

```
┌─────────────────────────────────────┐
│ CAPABILITY NAME                     │
│ (small header, muted)               │
│                                     │
│ Capability description              │
│ (body text, normal weight)          │
│                                     │
│ [Concrete data point in emphasis]   │
│                                     │
│ [Optional visual element]           │
└─────────────────────────────────────┘
```

### 7.2 Four cards

**Card 1 — Expense Visibility:**
- Header: "EXPENSE VISIBILITY"
- Description: "All operational spend in one place. Auto-categorized for tax prep and reporting."
- Data point: "Categories captured: {primary_spend_categories}"
- Integration line: "Integration: {expense_management_integration}"
- Visual element: none (text-rich card)

**Card 2 — Working Capital Cushion:**
- Header: "WORKING CAPITAL CUSHION"
- Description: "Credit limit provides month-end float for vendor payments and reserves for unexpected opportunities."
- Data point: "{requested_credit_limit} credit limit"
- Sub-detail: "Expected monthly use: {expected_monthly_spend}. Available headroom: {headroom_amount}."
- Visual element: small horizontal progress bar showing typical use vs available limit

**Card 3 — Credit Story Building:**
- Header: "CREDIT STORY BUILDING"
- Description: "Business credit profile established through consistent business-only spending."
- Data point: "Strengthens future borrowing capacity for larger commitments (CRE, SBA, equipment financing)."
- Visual element: none

**Card 4 — Operational Flexibility:**
- Header: "OPERATIONAL FLEXIBILITY"
- Description: "Spend without disrupting cash reserves. Fund opportunities as they arise."
- Data point: "Authorized users: {authorized_users}"
- Sub-detail: "Reward structure: {reward_structure}"
- Visual element: none

### 7.3 Visual treatment

- Cards visually distinct (subtle border or background separation)
- Header text in muted slate, all caps, small
- Body text in normal weight
- Emphasis on the concrete data point in each card
- Progress bar (Card 2 only) uses orange family per Block 7.4 color decision below

### 7.4 Color discipline

Cards should use neutral typography. The only visual element is Card 2's progress bar. Use orange family (afterState) for the "expected monthly use" portion of the bar, muted slate for the "available headroom" portion.

No green. No mixing of accent colors. Orange + slate only.

### 7.5 Acceptance criteria

- [ ] 2×2 card grid layout
- [ ] 4 cards with correct headers, descriptions, data points
- [ ] Card 2 includes progress bar visual element
- [ ] Card layout readable and visually balanced
- [ ] No new colors; orange family + slate only
- [ ] Cards differentiated by content, not color variety

---

## Block 8 — Parameter schema updates for capability content (Business Visa)

### 8.1 Parameter additions / preservation

Existing parameters likely include:
- `requested_credit_limit`
- `expected_monthly_spend`
- `primary_spend_categories`
- `estimated_cashback_rate` (no longer used in chart; preserve for output_summary if helpful)
- `annual_cashback` (computed; preserve)
- `annual_float_benefit` (computed; preserve)

May need to add for capability matrix:
```json
{
  "key": "expense_management_integration",
  "label": "Expense management integration",
  "type": "select",
  "options": ["QuickBooks Online", "Xero", "FreshBooks", "Wave", "Other / none"],
  "default": "QuickBooks Online",
  "required": false
},
{
  "key": "authorized_users",
  "label": "Authorized users",
  "type": "text",
  "required": false,
  "helper": "Banker captures during conversation. E.g., 'Jenny (owner), Mike (co-decision-maker spouse)'"
},
{
  "key": "reward_structure",
  "label": "Reward structure",
  "type": "text",
  "default": "2% cashback on supplies and fuel; 1% on other purchases",
  "required": false
}
```

### 8.2 Source factor linkage

These parameters don't have natural FACTOR-NNN mappings. Banker captures during conversation or banker estimates.

### 8.3 Acceptance criteria

- [ ] New parameters added to ARTIFACT-TEMPLATE-006 schema
- [ ] Existing parameters preserved
- [ ] Helper text clear

---

## Block 9 — Seed data and supporting text (Business Visa)

### 9.1 Fixture data updates (Jenny)

Update Jenny's TRACK-010 fixture parameter values to populate new parameters with realistic values from the existing fixture context:

- `expense_management_integration`: "QuickBooks Online"
- `authorized_users`: "Jenny (owner), Mike (co-decision-maker spouse)"
- `reward_structure`: "2% cashback on supplies and fuel"

(Match the existing values that appeared in the previous structured artifact.)

### 9.2 Supporting text below capability matrix

Replace existing supporting paragraph:

> Business Visa is operational infrastructure, not a wealth-generation product. Cashback is a small bonus; the real value is expense visibility, working capital flexibility, credit profile building, and operational agility. For {member_name}, the {requested_credit_limit} card line provides ongoing capacity to spend across operational categories without disrupting cash reserves — fundamental to running a small business at scale.

CC refines wording.

### 9.3 output_summary_template update

Replace existing cashback-focused template with capability-focused:

```
Business Visa with {requested_credit_limit} credit limit for {primary_spend_categories} spend. Expected monthly use: {expected_monthly_spend}. Authorized users: {authorized_users}. Integration: {expense_management_integration}. Provides expense visibility, working capital cushion, business credit profile, and operational flexibility for {member_name}'s ongoing operations.
```

### 9.4 Acceptance criteria

- [ ] Supporting text reframes Business Visa as operational infrastructure
- [ ] output_summary_template captures capability framing
- [ ] Jenny fixture data populates new parameters
- [ ] No placeholder leakage

---

## Block 10 — Verification

### 10.1 Playwright verification

Run Playwright across all four affected visualizations:
- CRE LeaseVsOwn — verify annotation references net position correctly
- Unsecured — verify Net Benefit bar in correct palette color (not black)
- Vehicle Loan — verify three-row temporal structure renders correctly with Northland data
- Business Visa — verify 4-card capability matrix renders correctly with Jenny data

Use full-page capture (per Patch F Block 7) to ensure no below-fold cropping.

### 10.2 Cross-fixture verification

For each affected visualization, verify all relevant fixtures render correctly:
- CRE: Cygnus
- Unsecured: Cygnus, Northland (point mode); Jenny (range mode)
- Vehicle Loan: Northland
- Business Visa: Jenny

### 10.3 No regression verification

Run Playwright across other Sprint 9 visualizations to confirm no regressions:
- PACE stacking flip preserved
- Equipment cost-of-doing-nothing preserved
- SBA 504 composite (roadmap + structure comparison) preserved
- Investment Property dual chart preserved
- Lease vs Own (other annotations) preserved
- Growth Trajectory preserved

### 10.4 BUILD_LOG entry

Document:
- Four fixes shipped
- New parameters added (Vehicle Loan: induced demand; Business Visa: capability content)
- CRE annotation logic now correctly uses net position
- Unsecured palette adherence restored
- Vehicle Loan redesigned with three-row temporal structure
- Business Visa replaced cashback chart with capability matrix
- Color discipline preserved across all changes

### 10.5 Acceptance criteria

- [ ] All four fixes Playwright-verified
- [ ] All affected fixtures render correctly
- [ ] No regressions on other Sprint 9 visualizations
- [ ] BUILD_LOG entry comprehensive
- [ ] Production build clean (`pnpm exec next build`)
- [ ] TypeScript clean (`pnpm tsc --noEmit`)

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-10 shipped per acceptance criteria
2. Playwright screenshots (full-page captures):
   - CRE LeaseVsOwn with corrected net-position annotation
   - Unsecured with restored palette color on Net Benefit bar
   - Vehicle Loan three-row temporal visualization for Northland
   - Business Visa capability matrix for Jenny
3. Per-component summary of changes
4. Sample parameter values used for fixture verification:
   - Northland Vehicle Loan: current_declined_revenue_monthly, projected_induced_demand_monthly, induced_demand_realization_months
   - Jenny Business Visa: expense_management_integration, authorized_users, reward_structure
5. CRE net-position crossover year for Cygnus scenario (computed value)
6. Any deviations from spec with rationale
7. Confirmation no green+orange adjacency anywhere in patched visualizations

After this patch ships and visual review confirms, next in sequence:
- **Sprint 6 production deployment to Vercel**
- **DEMO_RUNBOOK review + demo rehearsal**

---

## Estimated scope

1.5 effective build days CC time.

Breakdown:
- **Block 1-2 (CRE annotation)** — Net position math + annotation logic; ~0.2 day
- **Block 3 (Unsecured color)** — Single bar color restoration; ~0.05 day
- **Block 4-6 (Vehicle Loan redesign)** — New parameters + three-row visualization + fixture data; ~0.5 day
- **Block 7-9 (Business Visa redesign)** — New component + parameters + seed; ~0.5 day
- **Block 10 (verification)** — Playwright + cross-fixture + regression; ~0.25 day

Larger than typical patch because Vehicle Loan and Business Visa are both substantive component redesigns. CRE annotation is logic-only; Unsecured is single-bar color fix.

After this patch lands, visualization layer should be stable. Sprint 6 production deployment is next.
