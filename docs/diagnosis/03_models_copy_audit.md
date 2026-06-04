# Models screens — copy audit (READ-ONLY roundup)

> Working/review doc for Francisco. **Not** a tracked design doc (CLAUDE.md §12).
> Read-only: current text is verbatim; rewrites are PROPOSED, not applied.
> Branch `audit/models-copy`, off `main`. (The BUILD 2d "Supply these numbers…"
> gated header is NOT on main yet — this audit reflects main's chrome.)

Sources:
- Templates (title / description / value labels / output_summary / roadmap): `prisma/seed-artifact-templates.ts`
- Chart captions/annotations: `app/v2/members/[id]/artifact-visualizations/*.tsx`
- Shared chrome + value formatting: `app/v2/members/[id]/artifact-template-render.tsx`, `…/artifact-visualizations/shared.ts`

---

## Summary

**Flag counts (approx., flagged items):** SLOP ≈ 11 · VOICE ≈ 14 · NUMBER ≈ 13 · TYPO ≈ 5 · OK (clean labels) ≈ 50+

**5 worst offenders (fix first):**
1. **008 — roadmap stage descriptions (all 8):** third-person/passive narration ("*The starting point. Banker captures…*", "*The SBA specialist joins…*", "*The CDC handles…*"). The single biggest VOICE cluster; reads like a process doc, not banker direction.
2. **008 — `current_stage` renders as a bare index "3":** select options `["1"…"8"]`, label "Member is currently at", output summary "*at stage 3 of 8*", and the roadmap badge all surface a bare number instead of the stage **name**. The canonical NUMBER defect.
3. **008 — description (3-sentence meta-slop):** "*A roadmap showing how… Used during Consult to show the Member… Also shows the people involved…*" — describes the artifact, not the member's situation.
4. **008 — role-label TYPOs:** "**Brynjolffson**" (double-f; should be *Brynjolfsson*) appears 4×; "**Certified Development Company partner contact**" (verbose) should be "CDC partner".
5. **Portfolio-wide description pattern:** 001/002/003/004/005/007/009 all open "*A [summary/projection] showing… Used during Consult to…*" — meta-description SLOP repeated across nearly every template.

**Cross-cutting NUMBER issues (shared):**
- **Currency renders full** ("$5,500,000") in the essentials panel (`formatDisplayValue`) and in chart annotations (`fmtUSDLong`), but **abbreviated** ("$5.5M", "$180K") in chart bar labels (`fmtUSD`). Convention wants ≥$1M → "$X.XM" everywhere → the panel + annotation long form is over-long and inconsistent with the bars.
- Bare `"$0"` literals in prose (Unsecured chart ×3, Lease-vs-Own ×1); `%` / `×` glyphs hand-appended to raw numbers with **no divide-by-zero guard** (renders "0%", "100%", "0.0×" when a denominator is 0).
- "/month" used in output summaries where convention wants "/mo".

**Render caveats (so rewrites target the right surface):**
- **009 (Seasonal)**: on Jenny the model renders via the **legacy `SeasonalSmoothingChart`**, NOT the template render path — so 009's section-list copy + output summary below are **not** what shows in the demo. Its title/description still show in the +Model builder dropdown.
- **008 stage badge**: the roadmap renders `{stage.stage_number}` as a bare integer in a circle next to the stage title (the title is adjacent, so the badge itself is acceptable — the NUMBER problem is the *select value / output-summary "stage 3 of 8" / "Member is currently at"* label).

---

## SHARED CHROME (listed once; reused across all model popups)

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source (file:field) |
|---|---|---|---|---|
| Essentials panel header | `Evidence & assumptions behind these numbers` | OK | — | artifact-template-render.tsx EssentialsPanel |
| …count suffix | `· {promptCount} still to capture` | OK | — | EssentialsPanel |
| Provenance chip (confirmed) | `captured ✓ · from the Member` | OK | — | ProvenanceChip |
| Provenance chip (source banker-est) | `banker estimate · pending confirmation` | OK | — | ProvenanceChip |
| Provenance chip (product) | `from product · {label}` | OK | — | ProvenanceChip |
| Provenance chip (estimate) | `banker estimate · confirm with Member` | OK | — | ProvenanceChip |
| Provenance chip (blank) | `needs capture` | OK | — | ProvenanceChip |
| Output-summary box label | `What the model shows` | OK | — | render return |
| Currency value render | `$${n.toLocaleString("en-US")}` → "$5,500,000" | NUMBER | ≥$1M → "$5.5M"; <$1M → "$180K"/"$3,650" | formatDisplayValue · shared.ts `fmtUSDLong` |
| Currency (bars only) | `fmtUSD` → "$5.5M"/"$180K"/"$4K" | NUMBER | reconcile with panel/annotations (use one rule) | shared.ts `fmtUSD` |
| Roadmap "you are here" default | `You are here` | OK | — | RoadmapRender (dispatch default) |
| Roadmap stage badge | `{stage.stage_number}` → bare "3" | NUMBER (mild — title is adjacent) | keep badge but ensure stage NAME always shows (it does) | RoadmapRender |
| Buttons | `Capture with Member` / `Confirm` / `Confirming…` | OK | — | CaptureWithMemberControl |
| Button case drift | `Save`/`saving…`, `Cancel`/`cancel`, `+ Fill in`/`+ fill in` | TYPO | normalize case across the file | Banker/Section fill-in rows |
| Source-param note | `Recording your working assumption. Will be flagged as banker estimate pending Member confirmation.` | OK | (tighten: "Saved as a banker estimate until the Member confirms.") | SourceParamFillInRow |
| Section-list est. tag | `· banker estimate (pending Member confirmation)` | OK | — | SectionListRender |

---

# DEMO-VISIBLE TEMPLATES (fix first)

## TEMPLATE-010 — Business Vehicle Loan · `vehicle_capacity_uplift` · TRACK-002 · **DEMO-VISIBLE (Northland, "Fleet expansion ROI projection")**

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `Business Vehicle Loan financing summary` | SLOP (mild) | `Business Vehicle Loan` | 010.title |
| Description | `Vehicle financing structured to match the operational pattern of the business. The summary shows monthly debt service against operational revenue trajectory and demonstrates how the vehicle accelerates capacity expansion.` | SLOP | `What new vehicles do for capacity: the revenue they unlock vs. the monthly payment.` — or cut | 010.description |
| Value labels | Vehicle type · Vehicles in transaction · Total purchase price · Down payment · Loan amount (auto) · Term (months) · Rate type · Monthly debt service · Current capacity utilization · Demand exceeding capacity? · Expected capacity uplift with new vehicle(s) · Current declined revenue per month · Current monthly revenue · Projected induced-demand revenue per month · Months to realize induced demand | OK (mostly) | — | 010.parameter_schema |
| Value render | utilization "88%" (OK); currency full "$50,000" | NUMBER | "$50K"; keep "88%" | formatDisplayValue |
| Chart caption gap | (no uppercase panel heading on the chart card) | NUMBER/VOICE-adjacent | add a heading, e.g. "Capacity & revenue, before vs. after" | VehicleCapacityUpliftChart |
| Chart Y-axis | `Monthly revenue ($)` | NUMBER | `Monthly revenue` (drop redundant "($)") | VehicleCapacityUpliftChart:171 |
| Chart bars | `Current monthly revenue` · `Recaptured (previously declined)` · `Induced demand (banker estimate)` · `Monthly debt service (subtracted)` | OK | — | …:216-248 |
| Chart category | `Today` · `Month 1` · `Month {N} projected` | OK | — | …:108-126 |
| Chart annotation | `Today, the fleet of {n} {vehicleLabel} serves approximately {$/month}, with another {$/month} declined because the fleet is at capacity (utilization: 88%). … debt service … is covered by the recaptured revenue alone ({1.2}× coverage at month 1)…` | NUMBER | "/mo" not "/month"; guard "0.0×" when debt service is 0 | …:308-332 |
| Output summary | `{vehicle_count} {vehicle_type} at ${purchase_price}, financed at ${loan_amount} after ${down_payment} down. Monthly debt service ${monthly_debt_service}. Immediate effect: ${current_declined_revenue_monthly}/month previously-declined revenue captured. Projected effect over {induced_demand_realization_months} months: additional ${projected_induced_demand_monthly}/month from growth opportunities the expanded capacity enables. Combined revenue impact substantially exceeds debt service.` | NUMBER (mild) | "/mo"; abbreviate large $; otherwise solid | 010.output_summary_template |

## TEMPLATE-004 — Equipment financing ROI · `cost_of_doing_nothing` · TRACK-007 · **DEMO-VISIBLE (Northland)**

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `Equipment financing ROI projection` | SLOP (mild) | `Equipment financing — cost of waiting` (note: Northland overrides display name to "Fleet expansion ROI projection") | 004.title |
| Description | `A projection showing how new equipment generates revenue, the financing structure, and the payback timeline. Used during Consult to walk through whether the equipment pays for itself within the loan term.` | SLOP | `What aging equipment costs every month vs. financing the replacement.` — or cut | 004.description |
| Value labels | Equipment type · Loan amount · Term (months) · Interest rate · `Current monthly maintenance on aging equipment` · `Monthly downtime / lost productivity` · `Monthly declined-job revenue (capacity loss)` · `New equipment maintenance` | OK (verbose but clear) | optionally trim parentheticals | 004.parameter_schema |
| Chart heading | `Cumulative savings` / `Aging equipment — cumulative cost` / `New equipment financed — cumulative cost` | OK | — | CostOfDoingNothingChart:159-176 |
| Chart annotation | `Over 36 months: aging equipment costs {$} … New equipment financed costs {$} … Net savings: {$}` | NUMBER | "36" is a magic literal in copy (loop also hardcodes 36) — fine, but flag if horizon ever changes | …:199-204 |
| Output summary | `{equipment_type} at ${loan_amount} financed over {term_months} months at {interest_rate}. Aging equipment costs maintenance + downtime + declined-job revenue every month. New equipment breakeven shows the month from which acting is cheaper than waiting.` | NUMBER (mild) | abbreviate large $; "New equipment breakeven shows…" is mildly meta — "Breakeven is the month financing becomes cheaper than waiting." | 004.output_summary_template |

## TEMPLATE-008 — SBA 504 transaction roadmap · `sba_504_paired` · TRACK-008 · **DEMO-VISIBLE (Cygnus)** — heaviest

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `SBA 504 transaction roadmap` | OK | — | 008.title |
| Description | `A roadmap showing how Blaze and the CDC partner work together to complete an SBA 504 financing for an owner-occupied commercial property. Used during Consult to show the Member how all the pieces fit together — the bank's first-lien piece, the CDC's second-lien piece with longer fixed-rate terms, and the borrower's 10% equity. Also shows the people involved on Blaze's side and the CDC's side.` | **SLOP (worst)** | `How the bank, the CDC, and the member each fund the deal — 50% first lien, 40% CDC second lien, 10% equity.` — or cut | 008.description |
| `current_stage` | label `Member is currently at`; options `["1","2",…,"8"]` → renders bare **"3"** | **NUMBER (worst)** | render the stage NAME: "Member is currently at: **CDC partner introduction** (stage 3 of 8)" | 008.parameter_schema |
| `you_are_here_label` | label `You-are-here marker`; default "Cygnus is here" | OK | — | 008.parameter_schema |
| Value labels | Property value · Bank first lien rate · CDC second lien rate · Conventional CRE rate · Amortization (years) | OK | — | 008.parameter_schema |
| Output summary | `SBA 504 transaction roadmap. {you_are_here_label} — at stage {current_stage} of 8. CDC handles the second-lien piece (40%); Blaze finances the first-lien piece (50%); Member contributes 10% equity. Comparison below shows the structural advantage vs. conventional CRE.` | NUMBER + SLOP | "at the **CDC-introduction stage** (3 of 8)"; drop "Comparison below shows…" (self-ref) | 008.output_summary_template |
| Stage 1 title/desc | `Initial conversation` — `The starting point. Banker captures business context and confirms owner-occupancy intent.` | **VOICE** | `Ask about the business and confirm they'll occupy the property.` | 008.structural_content.stages[0] |
| Stage 2 | `Specialist introduction` — `The SBA specialist joins to walk through SBA 504 structure and confirm fit.` | VOICE | `Bring in the SBA specialist to walk the member through the 504 structure and confirm fit.` | stages[1] |
| Stage 3 | `CDC partner introduction` — `The CDC handles the SBA 504 second-lien piece. The Member meets the CDC partner during this stage.` | VOICE | `Introduce the CDC partner, who handles the 504 second-lien piece.` | stages[2] |
| Stage 4 | `Joint financial review` — `All parties review the project economics, the 50/40/10 structure, and SBA 504 documentation requirements.` | VOICE | `Walk through the project economics, the 50/40/10 structure, and the SBA 504 docs together.` | stages[3] |
| Stage 5 | `Underwriting` — `Two parallel underwriting tracks coordinated through the SBA specialist.` | VOICE | `Blaze and the CDC underwrite in parallel, coordinated by the SBA specialist.` | stages[4] |
| Stage 6 | `Board and approvals` — `Member's board reviews and approves on their side. Blaze loan committee approves the first-lien piece. CDC approves the second-lien piece.` | VOICE | `The member's board, Blaze's loan committee, and the CDC each approve their piece.` | stages[5] |
| Stage 7 | `Closing` — `Bank funds first-lien piece. CDC funds second-lien piece (with SBA debenture). Member funds 10% equity. Property transfer.` | VOICE | `Close: Blaze funds the first lien, the CDC the second (SBA debenture), the member the 10% equity; the property transfers.` | stages[6] |
| Stage 8 | `Post-close relationship` — `Treasury services, working capital, and ongoing operating support carry forward.` | VOICE (mild) | `Carry the relationship forward — treasury, working capital, and operating support.` | stages[7] |
| Role name | `Scott Brynjolffson` (×4) | **TYPO** | `Scott Brynjolfsson` (single-f-then-sson) | stages roles |
| Role name | `Certified Development Company partner contact` | TYPO (verbose) | `CDC partner` | stages[2].roles |
| Role labels | `SBA specialist (Blaze)` · `Member's CFO/controller` · `Member finance lead` · `Blaze commercial credit underwriting` | OK | — | stages roles |
| Share button | `Mark as shared with Member` / helper `Records that you showed this roadmap to the Member during the conversation. Skip if you're just rehearsing.` | OK | — | 008.structural_content.share_button |
| Chart panels | `Cash at closing` · `10-year cumulative interest` · `Conventional` · `SBA 504` | OK | — | Sba504StructureComparison:99-159 |
| Chart footnote | `Conventional needs 30% equity. SBA 504 needs 10%.` · `Below-market CDC second lien lowers blended interest.` | OK | (30/10 are hardcoded literals — keep in sync if structure changes) | …:153,201 |
| Chart annotation | `On a {$} property: SBA 504 saves {$} in cash at closing and ~{$} in interest over 10 years vs. conventional CRE. The roadmap above shows where you are in the three-party process.` | SLOP (tail) | drop "The roadmap above shows where you are…" (self-ref) | …:207-211 |

## TEMPLATE-001 — CRE acquisition financing · `lease_vs_own` · TRACK-003 · **DEMO-VISIBLE (Cygnus)**

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `CRE acquisition financing summary` | SLOP (mild) | `Owning vs. leasing this property` | 001.title |
| Description | `A summary showing how Blaze structures a commercial real estate term loan against the property and the borrower's operating cashflow. Used during Consult to show the Member how the loan fits both the property's cashflow profile and their broader operating cashflow.` | SLOP | `What owning this property costs vs. leasing — and the equity it builds.` — or cut | 001.description |
| Value labels | Property type · Acquisition price · Loan amount · LTV ratio (auto) · Amortization (years) · Interest rate · Current monthly rent · `Annual rent escalation %` · `Property appreciation %` | NUMBER (mild) | drop stray "%" from the two labels (field is already a % input) | 001.parameter_schema |
| Output summary | `{property_type} at ${acquisition_price}. Mortgage of ${loan_amount} at {interest_rate}, {amortization_years}-year term. Current rent ${current_monthly_rent}/month vs. owning. Crossover to ownership advantage around year 6-8; substantial equity built by year 15.` | NUMBER (mild) | "/mo"; abbreviate large $; "year 6-8"/"year 15" hardcoded but OK | 001.output_summary_template |
| Chart lines | `Continued leasing — total paid` · `Own with CRE Term Loan — total paid` · `Equity built (ownership)` · `Own — net cost (paid minus equity)` | OK | — | LeaseVsOwnChart:189-223 |
| Chart ref label | `Ownership net position pulls ahead at year {N}` (3 identical tiers) | NUMBER (code) | copy is fine; flag the dead tiering to engineering (3 branches → same string) | …:137-144 |
| Chart annotation | `At year 15: leasing has paid out {$} with $0 equity. Owning has paid {$} and built {$} in equity…` | NUMBER | bare `$0 equity` literal; "At year 15" magic literal | …:246-252 |

## TEMPLATE-009 — Seasonal cashflow smoothing · `cashflow_projection` (section list) · TRACK-001 · **DEMO-VISIBLE (Jenny)** ⚠ renders via legacy chart

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `Seasonal cashflow smoothing summary` | SLOP (mild) | `Smoothing the seasonal cash gap` | 009.title |
| Description | `Working Capital line of credit sized to bridge slow-season cashflow gaps. The summary shows the historical seasonal pattern and how the LOC drawdown/repayment cycle smooths revenue troughs.` | SLOP | `How a line of credit covers the slow months and gets repaid in the strong ones.` — or cut | 009.description |
| Value labels | Annual revenue · `Seasonal variance %` · Slow-season cashflow gap · Requested credit limit · Expected draw pattern · Repayment window (months) | NUMBER (mild) | drop stray "%" from "Seasonal variance %" | 009.parameter_schema |
| Section labels | `Business profile` · `Cashflow gap` · `LOC structure` | OK | — | 009.structural_content.sections |
| Output summary | `Annual revenue ${annual_revenue_band}. Seasonal variance {seasonal_variance}. Slow-season cashflow gap reaches ${slow_season_gap}. Proposed LOC of ${requested_credit_limit} smooths the cycle: draw during {draw_pattern} months, repay over {repayment_window} months as strong-season revenue flows in.` | NUMBER (mild) | abbreviate large $ | 009.output_summary_template |
| ⚠ Render note | On Jenny the popup uses the **legacy `SeasonalSmoothingChart`** (no template render) — the section list + output summary above don't show in the demo; only the title/description appear in the +Model dropdown. | — | decide whether to migrate 009 to the template path or leave legacy | preview-dialog dispatch |

## TEMPLATE-006 — Business credit card · `business_visa_capability` · TRACK-010 · **DEMO-VISIBLE (Jenny)**

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `Business credit card limit and use plan` | SLOP (mild) | `Business Visa — limit & use plan` | 006.title |
| Description | `""` (intentionally blank) | OK | — | 006.description |
| Value labels | Annual operational spend (current) · Proposed credit limit · Expected monthly card spend · Primary spend categories · Estimated cashback rate · Expense-management integration · Authorized users · Reward structure | OK | — | 006.parameter_schema |
| `authorized_users` helper | `Banker captures during conversation. E.g., 'Jenny (owner), Mike (co-decision-maker spouse)'.` | VOICE | `Who's on the card — e.g. "Jenny (owner), Mike (co-decision-maker)".` | 006.parameter_schema |
| Output summary | `Business Visa with ${proposed_limit} credit limit for {primary_spend_categories} spend. Expected monthly use: ${expected_monthly_spend}. Authorized users: {authorized_users}. Integration: {expense_management_integration}. Provides expense visibility, working-capital cushion, business credit profile, and operational flexibility for ongoing operations.` | SLOP (tail) | cut the generic capability-list tail (the chart cards already make that point) | 006.output_summary_template |
| Chart heading | `Operating benefits` | OK | — | BusinessVisaCapabilityMatrix:59 |
| Chart cards | `Expense visibility` / `Working capital cushion` / `Credit story building` / `Operational flexibility` + descriptions | OK | — | …:64-161 |
| Chart fallback | `Banker to capture during conversation` (authorized_users unset) | VOICE | hide the row when unset rather than print a process note | …:42 |
| Chart annotation | `A Business Visa provides operational support, not a wealth-generation product. Cashback at {N}% … is a small bonus; the real value is the four capabilities above…` | OK (mild) | "the four capabilities above" is a mild self-ref; otherwise good honest framing | …:172-180 |

## TEMPLATE-007 — Unsecured loan terms · `unsecured_opportunity` · TRACK-011 · **DEMO-VISIBLE (Jenny)**

| Surface | Current text (verbatim) | Flag | Proposed rewrite | Source |
|---|---|---|---|---|
| Title | `Unsecured loan terms summary` | SLOP (mild) | `Unsecured loan — does the opportunity beat the interest?` | 007.title |
| Description | `A summary of the unsecured loan structure, use of proceeds, and how it preserves collateral capacity for larger commitments. Used during Consult for bounded financing needs under $25K.` | SLOP | `A small unsecured loan that leaves collateral free for bigger deals — for needs under $25K.` — or cut | 007.description |
| Value labels | Opportunity type · Brief opportunity description · Loan amount · Term (months) · Interest rate · Estimated opportunity value · Opportunity value — low estimate · Opportunity value — high estimate | OK | — | 007.parameter_schema |
| Output summary | `{opportunity_type}: {opportunity_description}. Unsecured loan of ${loan_amount} over {term_months} months at {interest_rate}. Opportunity value: ${opportunity_value}. If the opportunity value exceeds the total interest cost, the loan pays for itself.` | OK | — | 007.output_summary_template |
| Chart heading | `Decision framing` | OK | — | UnsecuredOpportunityChart:256 |
| Chart prose | `Without the loan: the opportunity passes. Cost $0. Value captured $0. Net $0.` | NUMBER | bare `$0` ×3 — fine but flag as hardcoded literals | …:259-260 |
| Chart bars | `Interest cost` · `Opportunity value` · `Net benefit` | OK | — | …:119-139 |
| Chart note | `Note: at the low end of the opportunity range, the net benefit is small or negative. Worth confirming the opportunity value with the Member before committing.` | OK | — | …:271-273 |

---

# NOT DEMO-VISIBLE (002, 003, 005) — fix after the demo set

## TEMPLATE-002 — Growth trajectory w/ SBA 7(a) · `growth_trajectory` · TRACK-004 · not demo-visible

| Surface | Current | Flag | Proposed | Source |
|---|---|---|---|---|
| Title | `Growth trajectory with SBA 7(a) financing` | OK (mild) | `Growth with SBA 7(a) vs. organic` | 002.title |
| Description | `A projection showing how SBA 7(a) financing accelerates the business's growth trajectory. The chart compares revenue under organic growth (no loan) vs. expansion-fueled growth (with SBA 7(a)) over the loan term. Used during Consult to walk through how the financing pays for itself many times over.` | SLOP | `How much faster revenue grows with the loan than without — over the term.` — or cut | 002.description |
| Output summary | `SBA 7(a) of ${loan_amount} for {use_of_proceeds}. Without the loan, revenue grows organically at {organic_growth_rate}/yr…` | NUMBER (mild) | abbreviate large $ | 002.output_summary_template |
| Chart lines | `Organic growth (no loan)` · `With SBA 7(a) expansion` · `Annual debt service` | OK | — | GrowthTrajectoryChart |
| Chart annotation | `Over {N} years: cumulative revenue uplift over organic = {$}. Total debt service = {$}. Net gain = {$}.` | NUMBER | terse "=" phrasing; prefer prose; no chart heading | …:147-150 |

## TEMPLATE-003 — Investment property cashflow · `cashflow_equity_dual` · TRACK-006 · not demo-visible

| Surface | Current | Flag | Proposed | Source |
|---|---|---|---|---|
| Title | `Investment property cashflow projection` | OK (mild) | `Investment property — cashflow & equity` | 003.title |
| Description | `A projection showing rental income, operating expenses, debt service, and net cashflow on an investment property. Used during Consult to walk through how the property pays for itself and what the operating business contributes.` | SLOP | `What the property nets each month and the equity it builds.` — or cut | 003.description |
| Chart headings | `Monthly cashflow breakdown` · `Wealth accumulation over 10 years` | OK | — | CashflowEquityDualChart |
| Chart annotation | `… Total return: {$} ({N}% on initial investment).` | NUMBER | guard "0% on initial investment" when down payment is 0 | …:236 |
| Output summary | `{property_type} at ${purchase_price}. Loan ${loan_amount} at {interest_rate}. Monthly rent ${monthly_rent}, opex ${monthly_operating_expenses}. Two payouts: monthly cashflow today + equity that builds toward future wealth.` | NUMBER (mild) | abbreviate large $ | 003.output_summary_template |

## TEMPLATE-005 — PACE energy improvement · `pace_monthly_savings` · TRACK-009 · not demo-visible

| Surface | Current | Flag | Proposed | Source |
|---|---|---|---|---|
| Title | `PACE energy improvement projection` | OK (mild) | `PACE energy upgrade — savings vs. assessment` | 005.title |
| Description | `A projection showing how a solar, EV charging, or energy-efficiency improvement is financed through PACE assessment and how the long-term fixed terms protect against future energy price changes. Used during Consult.` | SLOP | `How energy savings cover the PACE assessment — and what's left over each year.` — or cut | 005.description |
| Output summary | `… net benefit flows to your cashflow each year during the PACE term…` | VOICE | "the member's cashflow" (second-person "your" in a banker-facing string) | 005.output_summary_template |
| Chart Y-axis | `Annual cashflow ($)` | NUMBER | drop redundant "($)" | PaceMonthlySavingsChart:164 |
| Chart annotation | `… paid through your property tax for {N} years …` | VOICE | "through property tax" (drop "your") | …:225 |
| Chart bars | `Net energy savings benefit` · `Annual PACE assessment` | OK | — | …:207-213 |
