# Sprint 9 — Business-Impact Artifact Visualizations

**Prompt for Claude Code. Single checkpoint. Replace 8 of 10 lending-product artifacts with custom before/after business-impact visualizations. Preserve existing LOC + Vehicle Loan visualizations. Estimated 4-5 effective build days CC time.**

## Pre-flight context

Sprint 8 shipped multi-Track artifact support, FactorCapture-to-parameter linkage, two-mode capture (Member-confirmed vs banker-estimate), and missing-parameter CTAs. Visual review revealed a more fundamental issue: most artifact templates render as transaction summary cards rather than demonstrations of business impact.

The current artifacts show what the loan IS (proposed credit limit, monthly debt service, parameter inputs). The Member sees structure but not benefit. The artifacts that DO work — Jenny's seasonal smoothing chart and Northland's Vehicle Loan financing summary — show what the loan DOES (smoothing the cashflow trough, capturing previously-lost revenue from declined work). These two artifacts demonstrate business impact through visualization.

Sprint 9 brings the remaining 8 artifact templates up to the same standard: each lending product's artifact should visualize the before/after business effect, not the transaction structure. The artifact answers the question "why would a Member pursue this product" with quantified, visual evidence.

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level) — Section 9 (existing artifact template specs)
2. `BUSINESS_FACTOR_MATRIX_v1.md` (factor catalog with FACTOR-NNN IDs)
3. `ARCHITECTURE_V2.md`
4. `Synthetic data/SYNTHETIC_DATA_stage1_branches_and_bankers.md` through `stage5_aggregate_metrics.md`
5. Existing artifact template implementation: `prisma/seed-artifact-templates.ts`, `lib/artifact-template.ts`, `app/v2/members/[id]/artifact-template-render.tsx`
6. Existing chart components for legacy artifacts (seasonal smoothing chart, vehicle loan financing summary)

If any document is missing, stop and surface to Francisco.

**Architecture authority:** Sprint 9 produces new visualization components per Track. Each template's `structural_content` schema gets a new `type` value matching the visualization needed. Existing `cashflow_smoothing` (TRACK-001) and `financing_summary` (TRACK-002, vehicle loan) types are preserved.

**Approved decisions (already locked through earlier conversation):**

- Approach A — all 10 lending products get business-impact visualizations in single sprint
- TRACK-001 Working Capital LOC (Jenny's seasonal smoothing chart) and TRACK-002 Business Vehicle Loan (Northland's vehicle financing summary) are PRESERVED. No changes.
- The other 8 Tracks get NEW visualization components replacing current summary-card rendering
- Design principle: each visualization shows before state (current pain or missed opportunity) + after state (loan-enabled outcome) + quantified financial impact
- Parameter schema and source_factor_id linkage from Sprint 8 preserved (auto-population, missing-parameter CTAs continue to work)

## What ships in this sprint (9)

Ten blocks across three phases. Single checkpoint.

**Phase 1 — Foundation:**
- **Block A — Visualization design pattern and component infrastructure.**

**Phase 2 — Per-Track visualization implementations:**
- **Block B — TRACK-003 CRE Term Loan: lease-vs-own wealth chart.**
- **Block C — TRACK-004 SBA 7(a): growth trajectory chart.**
- **Block D — TRACK-006 Investment Property: cashflow + equity dual chart.**
- **Block E — TRACK-007 Equipment & Machinery: cost-of-doing-nothing chart.**
- **Block F — TRACK-008 SBA 504: structure comparison + roadmap.**
- **Block G — TRACK-009 PACE: monthly savings vs assessment chart.**
- **Block H — TRACK-010 Business Visa: cashback opportunity chart.**
- **Block I — TRACK-011 Unsecured Loan: opportunity cost decision chart.**

**Phase 3 — Governance:**
- **Block J — Parameter schema updates + fixture data + governance.**

Sprint 9 does NOT ship: any changes to TRACK-001 LOC visualization (Jenny's existing chart preserved); any changes to TRACK-002 Business Vehicle Loan visualization (Northland's existing summary preserved); the Cygnus partnership map roadmap (preserved alongside the new SBA 504 structure comparison per Block F).

---

## Block A — Visualization design pattern and component infrastructure

### A.1 Common design principles across all 8 new visualizations

Every new artifact visualization follows the same conceptual structure:

1. **Before state** — visual showing current business pain or missed opportunity (current cashflow, current costs, current capacity, etc.)
2. **After state** — visual showing what the loan unlocks (smoothed cashflow, lower costs, expanded capacity, etc.)
3. **Quantified financial impact** — specific dollar values, breakeven points, or magnitude indicators visible to the eye
4. **Member-comprehensible** — the visualization should communicate clearly to a Member viewing it during a Consult-phase conversation, not just to a banker

### A.2 Component organization

Recommended structure:

```
app/v2/members/[id]/artifact-visualizations/
  CashflowSmoothingChart.tsx       // TRACK-001 (existing, preserved)
  VehicleFinancingSummary.tsx      // TRACK-002 (existing, preserved)
  LeaseVsOwnChart.tsx              // TRACK-003 (new)
  GrowthTrajectoryChart.tsx        // TRACK-004 (new)
  CashflowEquityDualChart.tsx      // TRACK-006 (new)
  CostOfDoingNothingChart.tsx      // TRACK-007 (new)
  Sba504StructureComparison.tsx    // TRACK-008 (new, paired with existing roadmap)
  PaceMonthlySavingsChart.tsx      // TRACK-009 (new)
  CashbackOpportunityChart.tsx     // TRACK-010 (new)
  UnsecuredOpportunityChart.tsx    // TRACK-011 (new)
```

Each component receives parameters from the template render and produces the visualization. Use Recharts where it fits cleanly; custom SVG where Recharts doesn't have a natural fit.

### A.3 Dispatch from artifact-template-render

Update `app/v2/members/[id]/artifact-template-render.tsx` to dispatch by `structural_content.type`:

```typescript
const TYPE_TO_COMPONENT = {
  cashflow_smoothing: CashflowSmoothingChart,         // TRACK-001 (existing)
  financing_summary: VehicleFinancingSummary,         // TRACK-002 (existing)
  lease_vs_own: LeaseVsOwnChart,                      // TRACK-003 (new)
  growth_trajectory: GrowthTrajectoryChart,           // TRACK-004 (new)
  cashflow_equity_dual: CashflowEquityDualChart,      // TRACK-006 (new)
  cost_of_doing_nothing: CostOfDoingNothingChart,     // TRACK-007 (new)
  sba_504_structure: Sba504StructureComparison,       // TRACK-008 (new, paired)
  roadmap: Sba504PartnershipMap,                      // TRACK-008 (existing, preserved)
  pace_monthly_savings: PaceMonthlySavingsChart,      // TRACK-009 (new)
  cashback_opportunity: CashbackOpportunityChart,     // TRACK-010 (new)
  unsecured_opportunity: UnsecuredOpportunityChart,   // TRACK-011 (new)
};
```

### A.4 Visual treatment standards

All visualizations share:

- **Before/after color coding:** muted/red for "before" or "current pain"; warm accent (Blaze brand) for "after" or "loan-enabled outcome"
- **Annotations:** key financial numbers called out adjacent to the chart (not buried in axis labels)
- **Member-readable text:** no jargon ("LTV", "DSCR" etc. unless contextually unavoidable). Plain English where possible
- **Banker-estimate flag:** Sprint 8 visual treatment for banker-estimate values carries through

### A.5 Acceptance criteria

- [ ] Visualization component directory created
- [ ] Existing LOC and Vehicle Loan components preserved unchanged
- [ ] artifact-template-render.tsx dispatches by structural_content.type
- [ ] Common design principles documented in code comments
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — TRACK-003 CRE Term Loan: lease-vs-own wealth chart

### B.1 What this visualization shows

The 15-year financial comparison between continuing to lease commercial real estate vs. owning via CRE Term Loan. Specifically:

- **Cumulative cost paid** under each scenario over time
- **Equity accumulated** under ownership scenario
- **Crossover point** where ownership becomes cheaper than leasing (typically year 5-8)
- **Final state** at year 15: total paid vs. equity owned

### B.2 Visualization design

Dual-line chart with annotations:

- X-axis: years 0 through 15
- Y-axis: dollars (cumulative)
- Line 1 (muted/red): "Continued leasing" — escalating rent costs accumulating year-over-year. Assume 3% annual rent escalation. By year 15, rent paid = ~$X with $0 equity.
- Line 2 (warm accent): "Own with CRE Term Loan" — mortgage payments accumulating (often slightly higher than rent in early years), with separate equity line shown rising
- Equity line (green or contrasting accent): "Equity accumulated" — rises with each mortgage payment + property appreciation (assume 3-4% annual appreciation)
- Crossover annotation: vertical line at the year where cumulative cost of ownership equals cumulative cost of leasing (typically year 5-8). Label: "Ownership ahead from here"
- Final state annotation at year 15: "Lease: $X paid, $0 equity / Own: $Y paid, $Z equity"

### B.3 Parameter schema

```json
{
  "parameters": [
    {"key": "property_type", "label": "Property type", "type": "select", "options": ["Retail", "Warehouse", "Industrial", "Office", "Mixed-use"], "required": true},
    {"key": "acquisition_price", "label": "Acquisition price", "type": "currency", "source_factor_id": "FACTOR-019", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "required": true},
    {"key": "ltv_ratio", "label": "LTV ratio", "type": "percentage", "computed": true, "computation": "loan_amount / acquisition_price"},
    {"key": "amortization_years", "label": "Amortization (years)", "type": "integer", "default": 25},
    {"key": "interest_rate", "label": "Interest rate", "type": "percentage", "required": true},
    {"key": "current_monthly_rent", "label": "Current monthly rent", "type": "currency", "required": true},
    {"key": "monthly_debt_service", "label": "Monthly debt service", "type": "currency", "computed": true},
    {"key": "annual_rent_escalation", "label": "Annual rent escalation %", "type": "percentage", "default": 3},
    {"key": "annual_appreciation", "label": "Property appreciation %", "type": "percentage", "default": 3}
  ]
}
```

### B.4 output_summary_template

```
{property_type} at {acquisition_price}. Mortgage of {loan_amount} at {interest_rate}, {amortization_years}-year term. Monthly debt service {monthly_debt_service} vs current rent of {current_monthly_rent}. Crossover to ownership advantage happens around year 6-8. At year 15, you've built ${equity_at_year_15} in equity vs. $0 from continued leasing.
```

(`equity_at_year_15` is computed; the renderer calculates from inputs.)

### B.5 Member-facing framing

When Member views this artifact during Consult, the chart says: "Here's why owning is worth the financing complexity — at year 6 you're ahead of leasing, and by year 15 you've built substantial equity that's yours."

### B.6 Acceptance criteria

- [ ] LeaseVsOwnChart component renders dual-line chart with crossover annotation
- [ ] Computed equity calculations correct (mortgage paydown + appreciation)
- [ ] Crossover point visible and annotated
- [ ] Final state at year 15 annotated with totals
- [ ] Reads as banker-natural and Member-comprehensible
- [ ] member_type_applicability: ["professional_services", "healthcare_services", "specialty_manufacturer", "retail", "food_services", "construction"]

---

## Block C — TRACK-004 SBA 7(a): growth trajectory chart

### C.1 What this visualization shows

The business growth trajectory difference between not financing an expansion vs. financing it through SBA 7(a). Specifically:

- **Without financing:** business grows organically from current revenue, modest rate
- **With SBA 7(a) financing:** business deploys financed asset (acquisition, expansion, equipment) and revenue grows faster
- **Debt service overlay:** monthly debt service shown but as small overlay; revenue uplift dwarfs the debt cost

### C.2 Visualization design

Line chart with debt overlay:

- X-axis: years 0 through 7 (SBA 7(a) typical max term)
- Y-axis: business revenue ($)
- Line 1 (muted): "Organic growth" — current revenue with conservative organic growth (~5-8% annually)
- Line 2 (warm accent): "With SBA 7(a) expansion" — current revenue jumps in year 1 (new asset deployed) then continues growing at expanded scale
- Small overlay at bottom: annual debt service line (relatively flat, modest in comparison to revenue lift)
- Annotation: "Revenue uplift over 7 years: $X vs. total debt service: $Y. Net: $Z over the term."

### C.3 Parameter schema

```json
{
  "parameters": [
    {"key": "use_of_funds", "label": "Use of funds", "type": "select", "options": ["Business acquisition", "Equipment expansion", "Working capital", "Real estate", "Partner buyout", "Other"], "required": true},
    {"key": "current_annual_revenue", "label": "Current annual revenue", "type": "currency", "source_factor_id": "FACTOR-027", "required": true},
    {"key": "loan_amount", "label": "SBA 7(a) loan amount", "type": "currency", "source_factor_id": "FACTOR-020", "required": true},
    {"key": "term_years", "label": "Term (years)", "type": "integer", "default": 10},
    {"key": "interest_rate", "label": "Interest rate", "type": "percentage", "required": true},
    {"key": "expected_year_1_revenue_uplift", "label": "Year 1 revenue uplift", "type": "currency", "required": true},
    {"key": "expected_annual_growth_rate_with_loan", "label": "Annual growth rate with loan", "type": "percentage", "default": 12},
    {"key": "organic_growth_rate", "label": "Organic growth rate (without loan)", "type": "percentage", "default": 6},
    {"key": "annual_debt_service", "label": "Annual debt service", "type": "currency", "computed": true}
  ]
}
```

### C.4 output_summary_template

```
SBA 7(a) of {loan_amount} for {use_of_funds}. Revenue jumps {expected_year_1_revenue_uplift} in year 1, growing {expected_annual_growth_rate_with_loan} annually thereafter. Annual debt service {annual_debt_service}. Over {term_years} years: cumulative revenue uplift vs. organic growth = $X. The financing pays for itself many times over.
```

### C.5 Member-facing framing

"Without the loan, your business follows this slower path. With the loan and the asset it acquires, you're on this faster path. Here's how much more revenue that produces over the loan term, and here's the debt service cost — much smaller than the gain."

### C.6 Acceptance criteria

- [ ] GrowthTrajectoryChart renders two-line revenue comparison
- [ ] Year-1 jump visible at start of "with financing" line
- [ ] Debt service overlay readable but not visually dominant
- [ ] Annotation summarizes net financial impact over term
- [ ] member_type_applicability: ["professional_services", "specialty_manufacturer", "healthcare_services", "food_services", "retail", "construction"]

---

## Block D — TRACK-006 Investment Property: cashflow + equity dual chart

### D.1 What this visualization shows

Investment property is a wealth-building decision with both immediate cashflow and long-term equity components. Both matter. Visualize both.

### D.2 Visualization design

Dual chart with two stacked panels:

**Top panel — Monthly cashflow:**
- Bar chart of monthly components
- Rent received (positive, full bar height)
- Minus mortgage payment (cuts into the rent bar)
- Minus operating expenses (further cut)
- Net cashflow per month (the remaining green portion)
- Annotation: "Net cashflow per month: $X" called out clearly

**Bottom panel — Wealth accumulation over 10 years:**
- Line chart over 10 years
- Total equity = principal paydown + appreciation
- Bar overlay showing initial equity invested (down payment)
- Annotation: "Initial investment: $X / Year 10 equity: $Y / Return on investment: Z%"

### D.3 Parameter schema

```json
{
  "parameters": [
    {"key": "property_type", "label": "Property type", "type": "select", "options": ["Single-family rental", "Multi-family", "Commercial mixed-use", "Vacation rental"], "required": true},
    {"key": "purchase_price", "label": "Purchase price", "type": "currency", "source_factor_id": "FACTOR-019", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "required": true},
    {"key": "down_payment", "label": "Down payment", "type": "currency", "computed": true, "computation": "purchase_price - loan_amount"},
    {"key": "monthly_rent", "label": "Monthly rental income", "type": "currency", "required": true},
    {"key": "monthly_mortgage", "label": "Monthly mortgage payment", "type": "currency", "computed": true},
    {"key": "monthly_operating_expenses", "label": "Monthly operating expenses (taxes, insurance, maintenance)", "type": "currency", "required": true},
    {"key": "monthly_net_cashflow", "label": "Monthly net cashflow", "type": "currency", "computed": true, "computation": "monthly_rent - monthly_mortgage - monthly_operating_expenses"},
    {"key": "annual_appreciation", "label": "Annual appreciation %", "type": "percentage", "default": 4},
    {"key": "interest_rate", "label": "Interest rate", "type": "percentage", "required": true},
    {"key": "term_years", "label": "Term (years)", "type": "integer", "default": 30}
  ]
}
```

### D.4 output_summary_template

```
{property_type} at {purchase_price}. Down payment {down_payment}; loan {loan_amount} at {interest_rate}. Monthly rent {monthly_rent} produces {monthly_net_cashflow}/month net cashflow after mortgage and expenses. Over 10 years, expect $X in cumulative cashflow + $Y in equity = $Z total return on {down_payment} initial investment.
```

### D.5 Member-facing framing

"This property pays you in two ways: monthly cashflow into your pocket today, and equity that builds toward future wealth. The chart shows both. The monthly check matters. The equity matters more."

### D.6 Acceptance criteria

- [ ] CashflowEquityDualChart renders both panels
- [ ] Monthly cashflow breakdown visible (rent - mortgage - expenses = net)
- [ ] Wealth accumulation curve over 10 years
- [ ] Return on initial investment annotation
- [ ] member_type_applicability: ["professional_services", "retail", "healthcare_services", "construction"]

---

## Block E — TRACK-007 Equipment & Machinery: cost-of-doing-nothing chart

### E.1 What this visualization shows

Aging equipment isn't free. It has hidden costs (maintenance, downtime, lost productivity, declined jobs) that accumulate over time. New equipment with financing has predictable monthly cost but lower hidden costs. There's a breakeven point where new equipment becomes cheaper than continuing with old.

### E.2 Visualization design

Cumulative cost chart with breakeven:

- X-axis: months 0 through 36
- Y-axis: cumulative cost ($)
- Line 1 (muted/red): "Cost of aging equipment" — starts at 0 and accumulates: monthly maintenance + lost productivity + declined jobs revenue. Slope increases over time (equipment degrades).
- Line 2 (warm accent): "Cost of new equipment with loan" — starts at $0, accumulates fixed monthly debt service + lower maintenance + productivity gains (gains shown as negative, reducing total cost).
- Crossover annotation: vertical line at the month where new equipment becomes cheaper. Label: "From month X, new equipment is cheaper than continuing"
- Annotations at month 36: "Aging equipment cost: $X / New equipment cost: $Y / Net savings: $Z over 36 months"

### E.3 Parameter schema

```json
{
  "parameters": [
    {"key": "equipment_type", "label": "Equipment type", "type": "select", "options": ["HVAC systems", "Industrial machinery", "Vehicles (commercial)", "Commercial kitchen", "Specialty equipment"], "required": true},
    {"key": "equipment_cost", "label": "Equipment cost", "type": "currency", "source_factor_id": "FACTOR-016", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "required": true},
    {"key": "term_months", "label": "Term (months)", "type": "integer", "default": 60},
    {"key": "interest_rate", "label": "Interest rate", "type": "percentage", "required": true},
    {"key": "monthly_debt_service", "label": "Monthly debt service", "type": "currency", "computed": true},
    {"key": "current_monthly_maintenance", "label": "Current monthly maintenance cost on aging equipment", "type": "currency", "required": true},
    {"key": "monthly_downtime_cost", "label": "Monthly cost of downtime (lost productivity)", "type": "currency", "required": true},
    {"key": "monthly_declined_revenue", "label": "Monthly revenue from declined jobs (capacity loss)", "type": "currency", "required": true},
    {"key": "new_equipment_monthly_maintenance", "label": "New equipment estimated maintenance", "type": "currency", "default": 200}
  ]
}
```

### E.4 output_summary_template

```
{equipment_type} at {equipment_cost} with {loan_amount} financed over {term_months} months. Monthly debt service {monthly_debt_service}. Current aging equipment costs you {current_monthly_maintenance} maintenance + {monthly_downtime_cost} downtime + {monthly_declined_revenue} declined revenue per month. New equipment becomes cheaper than continuing around month X. Over 36 months, total savings: $Y.
```

### E.5 Member-facing framing

"Aging equipment isn't 'free' — it's costing you in maintenance, downtime, and the jobs you can't take. The chart shows when new equipment becomes cheaper than holding on. From that point forward, every month you waited is a month you paid more than you needed to."

### E.6 Acceptance criteria

- [ ] CostOfDoingNothingChart renders dual-line breakeven chart
- [ ] Hidden costs of aging equipment visible (maintenance + downtime + declined jobs)
- [ ] New equipment fixed costs visible (debt service + lower maintenance)
- [ ] Breakeven point annotated
- [ ] Net savings at end of period annotated
- [ ] member_type_applicability: ["maintenance_services", "specialty_manufacturer", "food_services", "construction", "healthcare_services"]

---

## Block F — TRACK-008 SBA 504: structure comparison + roadmap

### F.1 Pairing existing + new visualization

TRACK-008 is unique: the existing partnership map roadmap (8 stages, you-are-here marker) is preserved AND a new structure comparison visualization is added. Both render in the artifact.

The roadmap orients Members to the process (who's involved, what stages exist). The structure comparison demonstrates the financial advantage of SBA 504 vs. conventional CRE.

### F.2 New structure comparison visualization

Three-bar comparison chart:

**Bar 1 — Conventional CRE loan:**
- 70% bank loan
- 30% borrower equity (down payment)
- Total cash at closing
- 10-year cumulative interest paid

**Bar 2 — SBA 504 structure:**
- 50% bank first lien (market rate)
- 40% CDC second lien (below-market fixed rate, SBA-debentured)
- 10% borrower equity
- Total cash at closing (much lower than conventional)
- 10-year cumulative interest paid (lower than conventional due to below-market CDC portion)

**Side annotations:**
- "Conventional: $X cash at closing, $Y total interest over 10 years"
- "SBA 504: $A cash at closing, $B total interest over 10 years"
- "Difference: $X-A less cash up front, $Y-B less interest paid"

### F.3 Combined artifact rendering

When banker views the SBA 504 artifact:
- Top section: roadmap (existing) — shows process stages with you-are-here marker
- Bottom section: structure comparison (new) — shows financial advantage

Both render together in the artifact view. Existing roadmap component preserved unchanged; new component added below.

### F.4 Parameter schema

```json
{
  "parameters": [
    {"key": "current_stage", "label": "Member is currently at", "type": "select", "options": ["1", "2", "3", "4", "5", "6", "7", "8"], "required": true},
    {"key": "property_value", "label": "Property value", "type": "currency", "source_factor_id": "FACTOR-019", "required": true},
    {"key": "bank_first_lien_rate", "label": "Bank first lien rate", "type": "percentage", "required": true},
    {"key": "cdc_second_lien_rate", "label": "CDC second lien rate", "type": "percentage", "required": true},
    {"key": "conventional_rate", "label": "Conventional CRE rate (for comparison)", "type": "percentage", "required": true},
    {"key": "loan_term_years", "label": "Loan term (years)", "type": "integer", "default": 10},
    {"key": "amortization_years", "label": "Amortization (years)", "type": "integer", "default": 25}
  ]
}
```

### F.5 output_summary_template

```
{property_value} property purchase. SBA 504 structure: 50% bank first lien at {bank_first_lien_rate}, 40% CDC second lien at {cdc_second_lien_rate} (below market), 10% borrower equity. vs. conventional CRE at {conventional_rate} with 30% equity required. SBA 504 saves you {savings_at_closing} in cash at closing and ~{interest_savings_10yr} in interest over 10 years. Three-party transaction; roadmap shows the process.
```

### F.6 Member-facing framing

"SBA 504 has more parties than a conventional loan — that's the roadmap. But the structure saves you more than 20% of your cash at closing and ~$X over 10 years. The complexity is worth it. Here's where you are in the process."

### F.7 Acceptance criteria

- [ ] Sba504StructureComparison component renders 3-bar comparison
- [ ] Existing roadmap component preserved unchanged
- [ ] Both render together in artifact view (roadmap above, comparison below)
- [ ] Cash-at-closing and 10-year interest savings calculated and annotated
- [ ] member_type_applicability: ["specialty_manufacturer", "healthcare_services", "food_services", "retail", "construction"]

---

## Block G — TRACK-009 PACE Loan: monthly savings vs assessment chart

### G.1 What this visualization shows

PACE financing is counterintuitive: you take on debt to save money. The visualization shows that the PACE assessment (long-term, paid through property taxes) costs LESS per month than the energy savings the improvements generate. So cashflow improves from day one.

### G.2 Visualization design

Monthly cost comparison chart over 15-25 years:

- X-axis: months 0 through 240 (or 300 for 25-year PACE)
- Y-axis: monthly cost or savings ($)
- Bar 1 per month: "Current energy costs" (high baseline)
- Bar 2 per month: "Energy costs after PACE improvements" (lower)
- Bar 3 per month: "PACE assessment" (the cost of the financing)
- Net line: "Net monthly impact" = energy savings - PACE assessment = positive net per month
- Annotation: "Net monthly savings: $X / Cumulative savings over PACE term: $Y / Equipment continues generating savings after PACE paid off"

### G.3 Visualization variant

If 240-300 months feels overwhelming visually, alternative: aggregate to annual buckets.

- X-axis: years 0 through 20 (or 25)
- Stacked bar per year showing energy savings (positive) vs PACE assessment (negative)
- Net annual benefit visible

### G.4 Parameter schema

```json
{
  "parameters": [
    {"key": "improvement_type", "label": "Energy improvement type", "type": "select", "options": ["HVAC system replacement", "Solar installation", "Insulation + windows", "LED lighting + controls", "Combined improvements"], "required": true},
    {"key": "improvement_cost", "label": "Improvement cost", "type": "currency", "source_factor_id": "FACTOR-015", "required": true},
    {"key": "pace_term_years", "label": "PACE term (years)", "type": "integer", "default": 20},
    {"key": "interest_rate", "label": "PACE interest rate", "type": "percentage", "required": true},
    {"key": "monthly_assessment", "label": "Monthly PACE assessment (added to property tax)", "type": "currency", "computed": true},
    {"key": "current_monthly_energy_cost", "label": "Current monthly energy cost", "type": "currency", "required": true},
    {"key": "monthly_energy_savings", "label": "Monthly energy savings after improvements", "type": "currency", "required": true},
    {"key": "net_monthly_benefit", "label": "Net monthly benefit (savings - assessment)", "type": "currency", "computed": true, "computation": "monthly_energy_savings - monthly_assessment"}
  ]
}
```

### G.5 output_summary_template

```
{improvement_type} at {improvement_cost} financed via PACE over {pace_term_years} years. Monthly assessment {monthly_assessment} added to property taxes. Monthly energy savings {monthly_energy_savings}. Net monthly benefit: {net_monthly_benefit}. Property improvement pays for itself from day one. After PACE term ends, all energy savings flow directly to cashflow.
```

### G.6 Member-facing framing

"PACE feels counterintuitive — debt to save money? But the math is clear: the monthly assessment costs you less than the energy savings. From the day the improvements are installed, your cashflow is better. After the PACE term, every dollar of energy savings is yours. The improvements pay for themselves and then keep paying."

### G.7 Acceptance criteria

- [ ] PaceMonthlySavingsChart renders savings vs assessment over time
- [ ] Net monthly benefit visible and clearly positive
- [ ] Cumulative savings over PACE term annotated
- [ ] Note about post-PACE pure savings included
- [ ] member_type_applicability: ["specialty_manufacturer", "food_services", "professional_services", "retail", "healthcare_services"]

---

## Block H — TRACK-010 Business Visa: cashback opportunity chart

### H.1 What this visualization shows

Business Visa is often a quiet product — businesses are already spending the money; the question is whether they're capturing the rewards. The visualization shows the "money left on the table" by not using a business card with cashback.

### H.2 Visualization design

Annual spend efficiency chart:

**Comparison bar chart:**

- Bar 1: "Current state" — total annual operational spend ($X), $0 cashback captured, no 30-day float benefit
- Bar 2: "With Business Visa" — same total annual operational spend ($X) + cashback earned ($Y, typically 1-3% of categorized spend) + 30-day float benefit ($Z in interest savings or float value)

**Side annotation:**
- "Effective annual benefit: $X-Y combined"
- "Over 5 years: $Z left on the table by not capturing rewards"

**Smaller breakdown:**
- Categorized spend that produces cashback
- Average cashback rate by category (supplies, fuel, travel, etc.)
- Float benefit calculation

### H.3 Parameter schema

```json
{
  "parameters": [
    {"key": "annual_operational_spend", "label": "Annual operational spend (current)", "type": "currency", "source_factor_id": "FACTOR-027", "required": true},
    {"key": "requested_credit_limit", "label": "Proposed credit limit", "type": "currency", "source_factor_id": "FACTOR-018", "required": true},
    {"key": "expected_monthly_spend", "label": "Expected monthly business card spend", "type": "currency", "required": true},
    {"key": "primary_spend_categories", "label": "Primary spend categories", "type": "select", "options": ["Supplies and inventory", "Travel and entertainment", "Vendor payments", "Fuel and vehicles", "Mixed"], "required": true},
    {"key": "estimated_cashback_rate", "label": "Estimated cashback rate", "type": "percentage", "default": 2},
    {"key": "annual_cashback", "label": "Annual cashback estimate", "type": "currency", "computed": true},
    {"key": "annual_float_benefit", "label": "Annual float benefit (30-day delayed payment)", "type": "currency", "computed": true}
  ]
}
```

### H.4 output_summary_template

```
Business Visa with {requested_credit_limit} credit limit for {primary_spend_categories} spend. Expected monthly business spend {expected_monthly_spend}. At {estimated_cashback_rate} effective cashback rate, you capture {annual_cashback} annually + ~{annual_float_benefit} in 30-day float value. Over 5 years: ~$X in combined rewards plus float. Currently, this is money left on the table.
```

### H.5 Member-facing framing

"You're already spending this money — the question is whether you're getting paid for it. The Business Visa captures ~2% back on the categories where you spend most. Over five years, that's $X in your pocket that's currently being captured by whichever method you're using now."

### H.6 Acceptance criteria

- [ ] CashbackOpportunityChart renders annual benefit comparison
- [ ] Cashback breakdown by category visible
- [ ] Float benefit explained
- [ ] 5-year cumulative benefit annotated
- [ ] member_type_applicability: ["event_services", "professional_services", "retail", "food_services", "healthcare_services"]

---

## Block I — TRACK-011 Unsecured Loan: opportunity cost decision chart

### I.1 What this visualization shows

Unsecured loans are often opportunistic — short-term funding for time-sensitive opportunities. The visualization shows the decision: opportunity captured vs. opportunity missed.

### I.2 Visualization design

Decision matrix / before-after comparison:

**Two-scenario visualization:**

- **Scenario A: Without loan** — opportunity passes; competitor or supplier moves on. Net financial position unchanged or slightly behind (missed margin / opportunity cost).
- **Scenario B: With unsecured loan** — opportunity captured. Show:
  - Loan amount taken
  - Total interest over term (typically short, 12-36 months)
  - Opportunity captured value (margin from bulk purchase, urgent need filled, equipment downtime avoided, etc.)
  - Net gain: opportunity value MINUS interest paid

**Side-by-side comparison:**
- Without loan: $0 captured, $0 cost, $0 net
- With loan: $X captured, $Y interest, $Z net positive

### I.3 Parameter schema

```json
{
  "parameters": [
    {"key": "opportunity_type", "label": "Opportunity type", "type": "select", "options": ["Bulk inventory discount", "Urgent equipment replacement", "Bridge to seasonal revenue", "Marketing/sales push", "Repair or emergency", "Other"], "required": true},
    {"key": "opportunity_description", "label": "Brief opportunity description", "type": "text", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "source_factor_id": "FACTOR-020", "required": true},
    {"key": "term_months", "label": "Term (months)", "type": "integer", "default": 24},
    {"key": "interest_rate", "label": "Interest rate", "type": "percentage", "required": true},
    {"key": "total_interest_over_term", "label": "Total interest over term", "type": "currency", "computed": true},
    {"key": "opportunity_value", "label": "Estimated opportunity value", "type": "currency", "required": true},
    {"key": "net_benefit", "label": "Net benefit (opportunity value - interest)", "type": "currency", "computed": true, "computation": "opportunity_value - total_interest_over_term"}
  ]
}
```

### I.4 output_summary_template

```
{opportunity_type}: {opportunity_description}. Unsecured loan of {loan_amount} over {term_months} months at {interest_rate}. Total interest: {total_interest_over_term}. Opportunity value: {opportunity_value}. Net benefit: {net_benefit}. Without the loan, the opportunity passes — that's the unrecoverable cost of not acting.
```

### I.5 Member-facing framing

"Unsecured loans are about opportunity. The loan costs money — interest — but the opportunity it lets you capture is worth more. The math is simple: if the opportunity is worth more than the interest, you're ahead. If it's not, don't take the loan. Here's the math."

### I.6 Acceptance criteria

- [ ] UnsecuredOpportunityChart renders scenario comparison
- [ ] Without-loan baseline ($0 captured) visible
- [ ] With-loan scenario shows opportunity captured + interest cost
- [ ] Net benefit clearly annotated
- [ ] member_type_applicability: ["event_services", "maintenance_services", "food_services", "retail", "construction", "professional_services"]

---

## Block J — Parameter schema updates + fixture data + governance

### J.1 ArtifactTemplate seed data updates

Update `prisma/seed-artifact-templates.ts` with new template structural_content types and parameter schemas:

- ARTIFACT-TEMPLATE-001 (TRACK-003 CRE): structural_content.type = "lease_vs_own"; new parameter schema per Block B
- ARTIFACT-TEMPLATE-002 (TRACK-004 SBA 7(a)): structural_content.type = "growth_trajectory"; new parameter schema per Block C
- ARTIFACT-TEMPLATE-003 (TRACK-006 Investment Property): structural_content.type = "cashflow_equity_dual"; new parameter schema per Block D
- ARTIFACT-TEMPLATE-004 (TRACK-007 Equipment): structural_content.type = "cost_of_doing_nothing"; new parameter schema per Block E
- ARTIFACT-TEMPLATE-005 (TRACK-009 PACE): structural_content.type = "pace_monthly_savings"; new parameter schema per Block G
- ARTIFACT-TEMPLATE-006 (TRACK-010 Business Visa): structural_content.type = "cashback_opportunity"; new parameter schema per Block H
- ARTIFACT-TEMPLATE-007 (TRACK-011 Unsecured): structural_content.type = "unsecured_opportunity"; new parameter schema per Block I
- ARTIFACT-TEMPLATE-008 (TRACK-008 SBA 504): structural_content.type = "sba_504_paired" (renders both roadmap AND new structure comparison); existing roadmap preserved; new comparison added per Block F

ARTIFACT-TEMPLATE-009 (TRACK-001 LOC) and ARTIFACT-TEMPLATE-010 (TRACK-002 Vehicle): UNCHANGED. Preserve existing.

### J.2 Source_factor_id preservation

All source_factor_id mappings from Sprint 8 Block C preserved. New parameters added in Sprint 9 may add additional source_factor_id mappings where appropriate per parameter schemas above.

### J.3 Fixture data updates

For each fixture × Track combination from Sprint 8:

**Cygnus (TRACK-008 SBA 504):**
- Update existing Model to use new ARTIFACT-TEMPLATE-008 structural content (roadmap + comparison paired)
- Populate property_value, bank_first_lien_rate, cdc_second_lien_rate, conventional_rate

**Cygnus (TRACK-003 CRE Term Loan secondary):**
- Update existing Model to use new ARTIFACT-TEMPLATE-001 structural content (lease vs own)
- Populate parameters with realistic Cygnus data ($4M-$7M property purchase, current lease costs, etc.)

**Northland (TRACK-002 Business Vehicle primary):**
- UNCHANGED. Preserve existing financing summary visualization.

**Northland (TRACK-007 Equipment & Machinery secondary):**
- Update existing Model to use new ARTIFACT-TEMPLATE-004 structural content (cost of doing nothing)
- Populate with realistic Northland equipment scenario (aging HVAC systems, maintenance costs, etc.)

**Jenny (TRACK-001 Working Capital LOC primary):**
- UNCHANGED. Preserve existing seasonal smoothing chart.

**Jenny (TRACK-010 Business Visa secondary):**
- Update existing Model to use new ARTIFACT-TEMPLATE-006 structural content (cashback opportunity)
- Populate with realistic Jenny annual spend, expected monthly spend, primary categories (food supplies, equipment rentals, venue scouting, vendor payments per existing Business Visa fixture)

**Riverside Catering (TRACK-001 LOC, stage-skipping):**
- UNCHANGED. Preserve existing artifact behavior; missing-parameter CTAs continue to demonstrate.

### J.4 BUILD_LOG entry

Sprint 9 entry covering:
- Replaced 8 of 10 artifact visualizations with business-impact charts
- Preserved TRACK-001 LOC and TRACK-002 Business Vehicle Loan visualizations
- 8 new visualization components added under `artifact-visualizations/`
- artifact-template-render dispatches by structural_content.type
- Parameter schemas updated for all 8 changed templates
- Fixture data updated for 4 Cygnus + Northland + Jenny artifact combinations

### J.5 OPEN_QUESTIONS amendments

- Q-H1: "Pilot expansion: visualization complexity scales as Member portfolio grows. Each visualization currently renders synchronously; Pilot may want background rendering or caching for many simultaneous artifacts in a banker session."
- Q-H2: "Member-facing print/share format for visualizations. Demo focuses on banker-screen rendering. Pilot may want PDF export or shareable links."

### J.6 Architectural notes for Pilot

- Note 22 — Business-impact visualization pattern established. All 10 lending products demonstrate before/after business effect rather than transaction summary. Pattern extends to future products.

### J.7 CLAUDE.md manifest update

- Document new visualization components under `artifact-visualizations/`
- Update structural_content.type registry
- Note new parameter schemas per Track

### J.8 Acceptance criteria

- [ ] All 8 new ArtifactTemplate seed records updated with new structural_content and parameter schemas
- [ ] TRACK-001 and TRACK-002 templates unchanged
- [ ] Fixture data updated for Cygnus × CRE, Cygnus × SBA 504, Northland × Equipment, Jenny × Business Visa
- [ ] BUILD_LOG, OPEN_QUESTIONS, Note 22, CLAUDE.md updated
- [ ] All visualizations render without TypeScript errors

---

## Reporting back

When Sprint 9 is complete, report back with:

1. Confirmation that Blocks A-J shipped per acceptance criteria
2. Visual probes for each of the 8 new visualizations:
   - TRACK-003 lease-vs-own chart renders with realistic Cygnus parameters
   - TRACK-004 SBA 7(a) growth trajectory renders
   - TRACK-006 Investment Property cashflow + equity renders
   - TRACK-007 cost-of-doing-nothing chart renders for Northland equipment scenario
   - TRACK-008 SBA 504 structure comparison + existing roadmap render together for Cygnus
   - TRACK-009 PACE monthly savings renders
   - TRACK-010 Business Visa cashback opportunity renders for Jenny
   - TRACK-011 Unsecured opportunity chart renders
3. Preserved visualizations:
   - TRACK-001 Jenny seasonal smoothing chart renders unchanged
   - TRACK-002 Northland Vehicle Loan financing summary renders unchanged
4. Each visualization shows: before/after, financial impact, banker-natural language
5. Visualizations work with Sprint 8 missing-parameter CTAs (banker can still capture missing values, and visualization re-renders with captured values)
6. Any deviations from spec with rationale
7. Note any visualizations that needed scope adjustment during implementation

After Sprint 9 ships and visual review confirms (all 10 artifacts demonstrate business impact, fixtures render correctly), Sprint 6 deployment to Vercel ships next.

---

## Estimated scope

4-5 effective build days CC time.

Largest blocks:
- **Block B (TRACK-003 lease-vs-own)** — dual-line chart with crossover; ~0.5 day CC
- **Block D (TRACK-006 cashflow + equity dual)** — two-panel chart; ~0.5 day CC
- **Block E (TRACK-007 cost-of-doing-nothing)** — multi-component cost accumulation; ~0.5 day CC
- **Block F (TRACK-008 SBA 504 paired)** — new component + existing roadmap composition; ~0.5 day CC
- **Block G (TRACK-009 PACE)** — savings vs assessment chart; ~0.5 day CC
- **Block I (TRACK-011 Unsecured)** — scenario comparison; ~0.5 day CC
- **Block A (infrastructure)** — component organization + dispatch; ~0.25 day CC

Smaller blocks (C, H, J) are routine but cumulatively meaningful (~0.5-1 day combined).

After Sprint 9 ships clean, the full architectural demonstration is in place: all 10 lending products show business impact visually, multi-Track artifact toggling works, missing-parameter capture cueing works, FactorCapture linkage works. Sprint 6 deployment to Vercel ships next.
