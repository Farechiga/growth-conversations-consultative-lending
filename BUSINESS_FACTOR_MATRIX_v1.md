# Business Factor Matrix and Track Templates — Sprint 5a Source Data

**Draft for Francisco's review.** Hand-curated content for the EVP demo: 5 lending Tracks, 28 business factors, full factor-to-Track matrix, per-fixture demo data showing what the switchboard surfaces for Jenny / Northland / Cygnus.

**Authored:** 2026-04-30 by Claude. **Status:** Strawman for Francisco's editorial pass.

**Discipline applied throughout:**

- All factors are business-factor-only per COMPLIANCE.md §6.3. No protected-class proxies. No personal/household characteristics framed as decision factors.
- Thresholds aim at the "80% solid, defensible, standard zone" — banker-credible, not edge-case wizardry.
- Five Tracks demonstrate range without overengineering: Working Capital LOC, Vehicle/Fleet Loan, CRE Term Loan, SBA 7(a), Treasury Services upgrade.
- Hand-curated for three demo Members; Pilot expansion is post-EVP work.

**How this content is used by Sprint 5a:**

- Section 1 (factors catalog) → seed data for `BusinessFactor` entity
- Section 2 (Track templates) → seed data for `TrackTemplate` entity
- Section 3 (matrix entries) → seed data for `MatrixEntry` entity
- Section 4 (per-fixture demo data) → orientation for what the rendered switchboard, popups, and dots should display per Member during demo

**Editorial review prompts at end** (Section 5).

---

## Section 1 — Business Factors Catalog

28 business factors organized by category. Each factor has:

- **ID:** snake_case identifier used in matrix entries and capture forms
- **Banker-facing diagnostic question:** what the capture form prompts; first-person to the banker, asking about the Member
- **Capture mode:** how the field is captured (numerical with unit, presence boolean, qualitative selection)
- **Captured via activity:** which dialpad activity (+ Ask, + Quantify, + Reaction, etc.) typically captures this factor

### 1.1 Cashflow factors (5 factors)

**FACTOR-001 — Seasonal revenue variance**
- Diagnostic question: *"By what percentage does this Member's revenue swing between peak and trough seasons?"*
- Capture mode: numerical (percentage)
- Captured via: + Quantify
- Notes: Captured as `seasonal_variance_pct`. Threshold typically referenced at 20%+ (significant) and 30%+ (severe).

**FACTOR-002 — Customer payment cycle length**
- Diagnostic question: *"What's the typical payment cycle from this Member's customers (days outstanding)?"*
- Capture mode: numerical (days)
- Captured via: + Quantify
- Notes: Captured as `customer_payment_days`. Threshold at 45+ (slow), 60+ (very slow), often paired with seasonal variance for stress diagnosis.

**FACTOR-003 — Accounts receivable concentration**
- Diagnostic question: *"What percentage of A/R sits with this Member's top 3 customers?"*
- Capture mode: numerical (percentage)
- Captured via: + Quantify
- Notes: Captured as `ar_concentration_top3_pct`. Threshold at 50%+ (concentrated), 70%+ (heavily concentrated).

**FACTOR-004 — Operating cash buffer**
- Diagnostic question: *"How many months of operating expenses does this Member's current cash position cover?"*
- Capture mode: numerical (months)
- Captured via: + Quantify
- Notes: Captured as `operating_cash_months`. Threshold below 2 (thin), below 1 (precarious).

**FACTOR-005 — Surplus revenue over costs**
- Diagnostic question: *"What's this Member's typical operating margin (revenue surplus over costs)?"*
- Capture mode: numerical (percentage)
- Captured via: + Quantify
- Notes: Captured as `operating_margin_pct`. Threshold at 40%+ (strong), 20-40% (moderate), <20% (thin).

### 1.2 Capacity / growth factors (6 factors)

**FACTOR-006 — Capacity utilization**
- Diagnostic question: *"What's this Member's current production or service capacity utilization rate?"*
- Capture mode: numerical (percentage)
- Captured via: + Quantify
- Notes: Captured as `capacity_utilization_pct`. Threshold at 75%+ (constrained), 85%+ (severely constrained).

**FACTOR-007 — Demand exceeding capacity**
- Diagnostic question: *"Is this Member turning down work or losing opportunities due to capacity?"*
- Capture mode: presence boolean + magnitude (lost-revenue estimate optional)
- Captured via: + Ask (Blocker) or + Quantify (lost-revenue)
- Notes: Captured as `demand_exceeds_capacity_observed` (boolean) and `lost_revenue_estimate_quarterly` (currency, optional).

**FACTOR-008 — Customer growth signal**
- Diagnostic question: *"Are anchor customers signaling volume increases?"*
- Capture mode: presence boolean + magnitude (volume %)
- Captured via: + Ask (Trigger or Goal)
- Notes: Captured as `customer_growth_signal` (boolean) and `expected_volume_growth_pct` (optional).

**FACTOR-009 — Revenue trajectory**
- Diagnostic question: *"What's this Member's year-over-year revenue trajectory?"*
- Capture mode: numerical (percentage)
- Captured via: + Quantify
- Notes: Captured as `yoy_revenue_growth_pct`. Threshold at 10%+ (growing), 25%+ (rapid growth), <0% (declining).

**FACTOR-010 — Equipment / fleet aging**
- Diagnostic question: *"Is core operating equipment or fleet aging past useful life?"*
- Capture mode: presence boolean + qualitative (fleet age years, optional)
- Captured via: + Ask (Blocker)
- Notes: Captured as `equipment_aging_observed` (boolean) and `fleet_avg_age_years` (numerical, optional).

**FACTOR-011 — Real estate footprint constraint**
- Diagnostic question: *"Is the Member's physical footprint limiting growth?"*
- Capture mode: presence boolean
- Captured via: + Ask (Blocker)
- Notes: Captured as `real_estate_constraint_observed`. Distinguishes CRE candidates from operating-capital candidates.

### 1.3 Decision-process factors (4 factors)

**FACTOR-012 — Decision-maker count**
- Diagnostic question: *"How many decision-makers participate in financing decisions for this Member?"*
- Capture mode: qualitative selection (1 / 2-3 / 4+)
- Captured via: + Ask (Indecision)
- Notes: Captured as `decision_maker_count`. Per COMPLIANCE.md §6.3 — captures count, not relationship to Member.

**FACTOR-013 — External advisor involvement**
- Diagnostic question: *"Does the Member rely on an external advisor (CPA, attorney, financial advisor) for major decisions?"*
- Capture mode: presence boolean + qualitative (advisor type)
- Captured via: + Ask (Indecision)
- Notes: Captured as `external_advisor_involved` and `advisor_type` (cpa / attorney / financial_advisor / other).

**FACTOR-014 — Co-decision-maker structural fit**
- Diagnostic question: *"Does the Member need co-decision-maker input for material commitments?"*
- Capture mode: presence boolean
- Captured via: + Ask (Indecision)
- Notes: Captured as `co_decision_maker_required`. Note compliance discipline: this is a *process fact*, not a *relationship descriptor*. Does not capture who, only that the structure exists.

**FACTOR-015 — Decision timeline**
- Diagnostic question: *"What's the realistic timeline for the Member to commit?"*
- Capture mode: qualitative selection (this_quarter / next_quarter / 6_months / 12_months / undefined)
- Captured via: + Ask or + Reaction
- Notes: Captured as `decision_timeline`. Drives Track timing fit.

### 1.4 Industry / structural factors (5 factors)

**FACTOR-016 — Industry seasonality match**
- Diagnostic question: *"Does this Member's industry exhibit defined seasonal patterns?"*
- Capture mode: presence boolean
- Captured via: System-derived from Member.member_type / NAICS lookup OR + Ask (Trigger)
- Notes: Captured as `industry_seasonal`. System-derived for known seasonal industries (catering, agriculture, retail, hospitality).

**FACTOR-017 — Inventory turn cycle**
- Diagnostic question: *"What's the Member's typical inventory turn cycle (days)?"*
- Capture mode: numerical (days)
- Captured via: + Quantify
- Notes: Captured as `inventory_turn_days`. Differentiates working-capital-constrained from inventory-light businesses.

**FACTOR-018 — Member tenure (years in business)**
- Diagnostic question: *"How many years has this Member been in operation?"*
- Capture mode: numerical (years)
- Captured via: System-derived OR + Quantify
- Notes: Captured as `member_tenure_years`. SBA 7(a) and other Tracks have minimum-tenure thresholds.

**FACTOR-019 — Annual revenue band**
- Diagnostic question: *"What's the Member's annual revenue?"*
- Capture mode: numerical (currency)
- Captured via: System-derived OR + Quantify
- Notes: Captured as `annual_revenue`. Drives many Track size-fit thresholds.

**FACTOR-020 — Employee count band**
- Diagnostic question: *"How many full-time equivalents does this Member employ?"*
- Capture mode: numerical (count)
- Captured via: System-derived OR + Quantify
- Notes: Captured as `employee_count`. SBA-relevant; also drives capacity discussions.

### 1.5 Member-stated factors (4 factors — qualitative discovery)

**FACTOR-021 — Stated growth aspiration**
- Diagnostic question: *"What growth aspiration has the Member articulated?"*
- Capture mode: qualitative tag selection from list + verbatim quote
- Captured via: + Ask (Goal)
- Notes: Captured as `growth_aspiration_tag`. Tags include: smooth_seasonal_revenue / expand_capacity / acquire_real_estate / diversify_revenue / acquire_equipment / refinance_existing / scale_workforce / other. Free-form quote also captured.

**FACTOR-022 — Stated obstacle to growth**
- Diagnostic question: *"What obstacle to growth has the Member articulated?"*
- Capture mode: qualitative tag selection from list + verbatim quote
- Captured via: + Ask (Blocker)
- Notes: Captured as `growth_obstacle_tag`. Tags: cashflow_volatility / customer_concentration / capacity_limit / aging_equipment / real_estate / workforce_gap / regulatory_compliance / other.

**FACTOR-023 — Stated decision hesitation**
- Diagnostic question: *"What hesitation has the Member articulated?"*
- Capture mode: qualitative tag selection from list + verbatim quote
- Captured via: + Ask (Indecision)
- Notes: Captured as `hesitation_tag`. Tags: timing / pricing / structure / co_decision_maker_input / external_advisor_input / risk_tolerance / capacity_to_service_debt / other.

**FACTOR-024 — Triggering event observed**
- Diagnostic question: *"What specific event triggered this conversation about a financial product?"*
- Capture mode: qualitative tag selection from list + verbatim quote
- Captured via: + Ask (Trigger)
- Notes: Captured as `trigger_event_tag`. Tags: late_paying_customer / capacity_evaluation / equipment_breakdown / customer_growth_announcement / regulatory_change / refinancing_window / acquisition_opportunity / other.

### 1.6 Banking-relationship factors (4 factors)

**FACTOR-025 — Existing Blaze relationship depth**
- Diagnostic question: *"How long has this Member banked with Blaze?"*
- Capture mode: numerical (years)
- Captured via: System-derived
- Notes: Captured as `blaze_relationship_years`. Drives relationship-led vs RFP-style positioning.

**FACTOR-026 — Existing credit facility utilization**
- Diagnostic question: *"What's the utilization rate on the Member's existing credit facilities (if any)?"*
- Capture mode: numerical (percentage)
- Captured via: System-derived OR + Quantify
- Notes: Captured as `existing_facility_utilization_pct`. High utilization on existing facilities is an LOC expansion signal.

**FACTOR-027 — Treasury services adoption**
- Diagnostic question: *"Which Blaze treasury services has this Member already adopted?"*
- Capture mode: qualitative multi-select
- Captured via: System-derived
- Notes: Captured as `treasury_services_adopted` (array). Drives Treasury Services upgrade Track.

**FACTOR-028 — Prior lending event with non-Blaze institution**
- Diagnostic question: *"Has the Member taken a material credit facility with a non-Blaze institution in the past 5 years?"*
- Capture mode: presence boolean + qualitative (institution type, year)
- Captured via: + Ask (Blocker or contextual signal)
- Notes: Captured as `non_blaze_lending_history`. Memory-of-lost-deal context (e.g., Cygnus's 2019 expansion); informs relationship-led pitch framing.

---

## Section 2 — Track Templates

5 Tracks, each with: definition, banker-facing description, required-evidence-per-objective ("rockstar package"), strong/moderate-supporting factors, dealbreakers, and notes.

### 2.1 TRACK-001 — Working Capital Line of Credit

**Banker-facing description:** A revolving line of credit sized to absorb cashflow timing mismatches. Member draws during slow periods, repays during peaks. Ideal for businesses with structural cashflow volatility — seasonal patterns, slow-paying customers, or growing AR cycles.

**Typical size band:** $25K - $500K for small business; $500K - $5M for mid-market.

**Rockstar package — required evidence per objective:**

| Objective | Required evidence | Rationale |
|---|---|---|
| Discover | Trigger event observed | Why this conversation now? |
| Discover | Stated obstacle (cashflow_volatility) | Member articulated the pain |
| Discover | Industry seasonal match OR seasonal variance > 20% | Structural justification |
| Measure | Seasonal variance % quantified | The size of the mismatch |
| Measure | Operating margin or surplus % quantified | Capacity to repay |
| Measure | Model produced (smoothing projection or similar) | Banker has done the math |
| Consult | Model shown to Member | Evidence Member has seen the case |
| Consult | Reaction captured | Decision posture clear |
| Navigate | (Optional at scoping stage) ActionCard for next step | Path to formalization defined |

**Strong-supporting factors (matrix entries):**
- FACTOR-001 (seasonal variance ≥ 20%) — Strong
- FACTOR-002 (customer payment cycle ≥ 45 days) — Strong
- FACTOR-016 (industry seasonal) — Strong
- FACTOR-017 (inventory turn ≥ 60 days) — Moderate
- FACTOR-024 (trigger: late_paying_customer) — Strong
- FACTOR-022 (obstacle: cashflow_volatility) — Strong

**Moderate-supporting factors:**
- FACTOR-005 (operating margin ≥ 20%) — Moderate (capacity-to-service signal)
- FACTOR-009 (YoY revenue growth ≥ 10%) — Moderate
- FACTOR-026 (existing facility utilization ≥ 75%) — Moderate (expansion signal)

**Dealbreakers / negative factors:**
- FACTOR-018 (member tenure < 2 years) — Negative (limited history)
- Operating margin < 0% (loss-making) — Negative

**Notes for matrix authoring:** This is the most heavily-supported Track because cashflow problems are common and well-documented. Threshold rules are well-established. Pilot may add factors around AR concentration (FACTOR-003) for nuanced sizing.

### 2.2 TRACK-002 — Vehicle / Fleet Loan

**Banker-facing description:** Term financing for commercial vehicles or fleet expansion. Secured by vehicles. Sizing typically tied to vehicle counts, purchase prices, and trade-in values. Most common for trades, services, logistics, and field-operations businesses.

**Typical size band:** $50K - $1M depending on fleet size.

**Rockstar package — required evidence per objective:**

| Objective | Required evidence | Rationale |
|---|---|---|
| Discover | Trigger event (capacity_evaluation OR equipment_breakdown) | Why now? |
| Discover | Stated obstacle (capacity_limit OR aging_equipment) | Member articulated the constraint |
| Measure | Demand-exceeding-capacity observed OR lost-revenue quantified | Magnitude of constraint |
| Measure | Capacity utilization % | Current capacity load |
| Measure | Existing fleet aging context | What's being replaced/added |
| Consult | Model produced (fleet expansion ROI) | Math on vehicle additions |
| Consult | Reaction captured | Member commitment |

**Strong-supporting factors:**
- FACTOR-006 (capacity utilization ≥ 75%) — Strong
- FACTOR-007 (demand exceeds capacity observed) — Strong
- FACTOR-010 (equipment / fleet aging) — Strong
- FACTOR-022 (obstacle: capacity_limit) — Strong
- FACTOR-022 (obstacle: aging_equipment) — Strong
- FACTOR-024 (trigger: capacity_evaluation OR equipment_breakdown) — Strong

**Moderate-supporting factors:**
- FACTOR-009 (YoY revenue growth ≥ 10%) — Moderate (justifies expansion)
- FACTOR-005 (operating margin ≥ 20%) — Moderate (capacity to service)

**Dealbreakers / negative factors:**
- FACTOR-022 (obstacle: cashflow_volatility, when severe) — Negative (need working capital before fleet)
- FACTOR-018 (member tenure < 2 years) — Negative (limited history)

**Notes for matrix authoring:** Vehicle/Fleet Loan often emerges from initial discussions about a single vehicle replacement, then expands to fleet-strategy framing once the banker connects to capacity factors. The "I came in for my own truck but maybe really need to think about the whole fleet" insight (Northland's memorability quote) is exactly this pattern.

### 2.3 TRACK-003 — Commercial Real Estate Term Loan

**Banker-facing description:** Long-term financing for owner-occupied commercial real estate purchase, construction, or major renovation. Secured by the real estate. Typically requires significant member equity (20-30%) and underwriting around real estate value, business cashflow, and operating capacity.

**Typical size band:** $1M - $25M+.

**Rockstar package — required evidence per objective:**

| Objective | Required evidence | Rationale |
|---|---|---|
| Discover | Trigger event (capacity_evaluation, customer_growth_announcement, OR refinancing_window) | Why now? |
| Discover | Stated growth aspiration (acquire_real_estate OR expand_capacity) | Member articulated the move |
| Discover | Stated obstacle (real_estate OR capacity_limit) | Pain point clear |
| Measure | Capacity utilization % at high level (≥ 75%) | Operational pressure |
| Measure | Annual revenue / size band confirmed | Capital adequacy |
| Measure | Operating margin / cash adequacy | Capacity to service term debt |
| Measure | Model produced (financing scenarios — typically 2-3) | Banker has run scenarios |
| Consult | Model shown / Reaction captured | Member has seen the case |
| Consult | Decision-maker mapping (board, co-owners, external advisors) | Decision-process clarity for material commitment |
| Navigate | Specialist handoff initiated to CRE specialist | Banker isn't underwriting; specialist takes over |

**Strong-supporting factors:**
- FACTOR-006 (capacity utilization ≥ 80%) — Strong
- FACTOR-008 (customer growth signal, ≥ 15% volume) — Strong
- FACTOR-011 (real estate footprint constraint observed) — Strong
- FACTOR-019 (annual revenue ≥ $10M) — Strong
- FACTOR-021 (aspiration: acquire_real_estate) — Strong
- FACTOR-021 (aspiration: expand_capacity) — Strong
- FACTOR-022 (obstacle: real_estate) — Strong

**Moderate-supporting factors:**
- FACTOR-005 (operating margin ≥ 20%) — Moderate
- FACTOR-009 (YoY revenue growth ≥ 10%) — Moderate
- FACTOR-013 (external advisor involved) — Moderate (procedural fit, not pain)
- FACTOR-014 (co-decision-maker required) — Moderate
- FACTOR-015 (decision timeline ≥ 6 months) — Moderate
- FACTOR-018 (member tenure ≥ 5 years) — Moderate
- FACTOR-025 (Blaze relationship ≥ 10 years) — Moderate (relationship-led pitch)

**Dealbreakers / negative factors:**
- FACTOR-019 (annual revenue < $5M, for sizing fit) — Negative
- FACTOR-018 (member tenure < 3 years) — Negative
- FACTOR-022 (obstacle: cashflow_volatility, severe) — Negative (need stability first)

**Notes for matrix authoring:** CRE Term Loan is the most banker-process-intensive Track in the matrix — it requires specialist handoff, multi-month timeline, and elaborate underwriting. The Sprint 5a demo for Cygnus showcases this Track's complexity. The factor FACTOR-028 (prior lending event with non-Blaze institution) is contextually relevant for the Cygnus 2019 lost-deal memory: doesn't disqualify the Track but informs the relationship-led pitch framing.

### 2.4 TRACK-004 — SBA 7(a) Loan

**Banker-facing description:** Small Business Administration 7(a) general-purpose loan, partially guaranteed by SBA. Used for working capital, equipment, real estate, business acquisition, debt refinancing, or growth investment. Slower process than conventional credit (60-90+ days), more documentation, but accessible to businesses that don't fit conventional credit criteria. Credit Union must be SBA-approved to participate.

**Typical size band:** $50K - $5M.

**Rockstar package — required evidence per objective:**

| Objective | Required evidence | Rationale |
|---|---|---|
| Discover | Trigger event observed | Why financing now? |
| Discover | Stated growth aspiration OR stated obstacle | The use-of-proceeds case |
| Discover | Member tenure ≥ 2 years (typically) | SBA eligibility |
| Measure | Annual revenue / size band confirmed | SBA size standards |
| Measure | Use-of-proceeds quantified | What's the loan for? |
| Measure | Operating margin / cash adequacy | Capacity to service debt |
| Consult | Decision timeline confirmed (60-90 days realistic?) | Member tolerates SBA timeline |
| Consult | Reaction captured | Member commitment |
| Navigate | Specialist handoff to SBA-specialist banker | Banker isn't running SBA process |

**Strong-supporting factors:**
- FACTOR-018 (member tenure ≥ 2 years) — Strong (SBA eligibility floor)
- FACTOR-019 (annual revenue ≤ SBA size standard) — Strong (SBA eligibility ceiling)
- FACTOR-005 (operating margin ≥ 15%) — Moderate
- FACTOR-013 (external advisor involved, particularly CPA) — Moderate (helps SBA paperwork)
- FACTOR-015 (decision timeline ≥ 6 months) — Moderate (SBA timeline tolerance)
- FACTOR-021 (any growth aspiration) — Moderate (SBA serves many use-of-proceeds)
- FACTOR-022 (obstacle: capacity_limit OR cashflow_volatility OR aging_equipment) — Moderate

**Moderate-supporting factors:**
- FACTOR-009 (YoY revenue growth, positive) — Moderate
- FACTOR-018 (member tenure ≥ 5 years) — Moderate

**Dealbreakers / negative factors:**
- FACTOR-018 (member tenure < 2 years) — Strong negative (SBA eligibility floor)
- FACTOR-019 (annual revenue exceeds SBA size standard for industry) — Strong negative
- FACTOR-015 (decision timeline = this_quarter) — Negative (SBA process won't fit)

**Notes for matrix authoring:** SBA 7(a) is the cross-cutting candidate that ranks moderate for many Members but rarely emerges as primary. It's most useful as an alternative-Track-comparison in the demo — when banker pivots from "Working Capital LOC" to "SBA 7(a)" via the switchboard, it demonstrates the matrix's ranking value. For Pilot, factors should expand to include collateral availability, owner credit profile (CMS-allowed), and other SBA-specific eligibility checks.

### 2.5 TRACK-005 — Treasury Services Upgrade

**Banker-facing description:** Non-credit Track. Adoption or upgrade of Blaze treasury services: business checking, payment processing, payroll services, treasury management (sweeps, ACH, wire), merchant services, fraud protection. Drives deposit growth and stickier relationship; often adjacent to (or precursor to) a credit conversation. Sized in monthly fee revenue rather than principal.

**Typical size band:** $200/month - $10K/month service revenue.

**Rockstar package — required evidence per objective:**

| Objective | Required evidence | Rationale |
|---|---|---|
| Discover | Trigger event OR stated obstacle | Why discuss treasury now? |
| Discover | Treasury services not yet adopted (gap exists) | Room to upgrade |
| Measure | Annual revenue / transaction volume | Service-fit sizing |
| Measure | Operating cash management style observed | What pain is being addressed? |
| Consult | Model produced (treasury services proposal) | Banker drafted the package |
| Consult | Reaction captured | Member committed to specific services |

**Strong-supporting factors:**
- FACTOR-019 (annual revenue ≥ $1M) — Strong (service fit)
- FACTOR-003 (AR concentration ≥ 50%) — Moderate (treasury management value)
- FACTOR-004 (operating cash buffer < 2 months) — Strong (cash management value)
- FACTOR-027 (treasury services adopted, count) — Inverse: fewer adopted = more upgrade headroom
- FACTOR-022 (obstacle: cashflow_volatility) — Moderate (treasury-management value)
- FACTOR-001 (seasonal variance) — Moderate (sweep/timing services value)

**Moderate-supporting factors:**
- FACTOR-009 (YoY revenue growth ≥ 10%) — Moderate (transaction-volume growth driver)
- FACTOR-025 (Blaze relationship ≥ 5 years) — Moderate (relationship deepening fit)

**Dealbreakers / negative factors:**
- FACTOR-019 (annual revenue < $250K) — Negative (service fit too small)

**Notes for matrix authoring:** Treasury Services is the non-credit Track included in the matrix to demonstrate that the Member Signals product handles relationship growth beyond credit. For the EVP demo, this Track ranks moderate for Jenny (cashflow-volatility-relevant) and Cygnus (size-fit), but rarely as the primary Track. Worth surfacing because relationship managers drive both credit and treasury revenue.

---

## Section 3 — Matrix Entries

The matrix is conceptually a table: 28 factors × 5 Tracks = 140 cells. Many cells are "no relevance" (factor doesn't bear on Track). The cells that matter are populated with strength values and threshold rules.

### 3.1 Matrix entry schema

Each matrix entry specifies:

- **factor_id:** Reference to FACTOR-NNN
- **track_id:** Reference to TRACK-NNN
- **strength:** strong / moderate / negligible / negative
- **threshold_rule:** Optional comparison rule for numerical factors. Format: `field_name >= threshold_value` or similar.
- **notes:** Banker-facing rationale; used in popup CTAs and Tracks-supported panel rationale text.

### 3.2 Matrix entries — by Track (full enumeration)

For brevity, I list strong-positive entries here. Full matrix expansion (including negligible cells, dealbreakers) lives in Sprint 5a's seed data; CC will translate this content directly.

**TRACK-001 Working Capital LOC — strong factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-001 (seasonal variance) | Strong | seasonal_variance_pct >= 20 | Significant seasonal swing; LOC absorbs the trough |
| FACTOR-001 (seasonal variance) | Moderate | seasonal_variance_pct 10..20 | Modest seasonality; LOC is one of several options |
| FACTOR-002 (customer payment cycle) | Strong | customer_payment_days >= 60 | Severe AR-cycle stretch; LOC bridges the gap |
| FACTOR-002 (customer payment cycle) | Moderate | customer_payment_days 45..60 | AR cycle elongated; warrants discussion |
| FACTOR-016 (industry seasonal) | Strong | industry_seasonal == true | Industry pattern justifies structural mitigation |
| FACTOR-022 (obstacle: cashflow_volatility) | Strong | growth_obstacle_tag == cashflow_volatility | Member articulated the exact pain LOC addresses |
| FACTOR-024 (trigger: late_paying_customer) | Strong | trigger_event_tag == late_paying_customer | Specific event motivates the conversation |
| FACTOR-026 (existing facility utilization) | Strong | existing_facility_utilization_pct >= 75 | Existing LOC near limit; expansion signal |

**TRACK-001 — moderate factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-005 (operating margin) | Moderate | operating_margin_pct >= 20 | Capacity-to-service signal |
| FACTOR-009 (YoY revenue growth) | Moderate | yoy_revenue_growth_pct >= 10 | Growing business with volatility tolerance |
| FACTOR-017 (inventory turn) | Moderate | inventory_turn_days >= 60 | Working-capital constrained |

**TRACK-001 — negative factors (dealbreakers):**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-018 (member tenure) | Negative | member_tenure_years < 2 | Limited history for LOC underwriting |
| FACTOR-005 (operating margin) | Negative | operating_margin_pct < 0 | Loss-making; capacity-to-service question |

---

**TRACK-002 Vehicle / Fleet Loan — strong factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-006 (capacity utilization) | Strong | capacity_utilization_pct >= 75 | Operational capacity constrained |
| FACTOR-007 (demand exceeds capacity) | Strong | demand_exceeds_capacity_observed == true | Lost-revenue context |
| FACTOR-010 (equipment / fleet aging) | Strong | equipment_aging_observed == true | Replacement-driven need |
| FACTOR-022 (obstacle: capacity_limit) | Strong | growth_obstacle_tag == capacity_limit | Member articulated capacity pain |
| FACTOR-022 (obstacle: aging_equipment) | Strong | growth_obstacle_tag == aging_equipment | Member articulated equipment pain |
| FACTOR-024 (trigger: capacity_evaluation) | Strong | trigger_event_tag == capacity_evaluation | Specific event |
| FACTOR-024 (trigger: equipment_breakdown) | Strong | trigger_event_tag == equipment_breakdown | Specific event |

**TRACK-002 — moderate factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-005 (operating margin) | Moderate | operating_margin_pct >= 20 | Capacity-to-service |
| FACTOR-009 (YoY revenue growth) | Moderate | yoy_revenue_growth_pct >= 10 | Justifies expansion vs. replacement |

**TRACK-002 — negative factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-022 (obstacle: cashflow_volatility, when severe) | Negative | seasonal_variance_pct >= 30 AND obstacle = cashflow_volatility | Working capital comes first |
| FACTOR-018 (member tenure) | Negative | member_tenure_years < 2 | Limited history |

---

**TRACK-003 CRE Term Loan — strong factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-006 (capacity utilization) | Strong | capacity_utilization_pct >= 80 | Operational pressure justifies expansion |
| FACTOR-008 (customer growth signal) | Strong | customer_growth_signal == true AND expected_volume_growth_pct >= 15 | Demand justification |
| FACTOR-011 (real estate constraint) | Strong | real_estate_constraint_observed == true | Footprint pain |
| FACTOR-019 (annual revenue) | Strong | annual_revenue >= 10000000 | Capital-adequacy floor for typical CRE deal |
| FACTOR-021 (aspiration: acquire_real_estate) | Strong | growth_aspiration_tag == acquire_real_estate | Direct aspiration match |
| FACTOR-021 (aspiration: expand_capacity) | Strong | growth_aspiration_tag == expand_capacity | Capacity-driven CRE move |
| FACTOR-022 (obstacle: real_estate) | Strong | growth_obstacle_tag == real_estate | Member articulated real-estate pain |

**TRACK-003 — moderate factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-005 (operating margin) | Moderate | operating_margin_pct >= 20 | Capacity-to-service term debt |
| FACTOR-009 (YoY revenue growth) | Moderate | yoy_revenue_growth_pct >= 10 | Growth justifies investment |
| FACTOR-013 (external advisor) | Moderate | external_advisor_involved == true | Procedural fit for material commitment |
| FACTOR-014 (co-decision-maker required) | Moderate | co_decision_maker_required == true | Decision-process complexity |
| FACTOR-015 (decision timeline) | Moderate | decision_timeline IN [6_months, 12_months] | CRE process tolerates timeline |
| FACTOR-018 (member tenure) | Moderate | member_tenure_years >= 5 | Established history |
| FACTOR-025 (Blaze relationship) | Moderate | blaze_relationship_years >= 10 | Relationship-led pitch fit |

**TRACK-003 — negative factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-019 (annual revenue) | Negative | annual_revenue < 5000000 | Sizing fit problem |
| FACTOR-018 (member tenure) | Negative | member_tenure_years < 3 | Limited history for material commitment |

---

**TRACK-004 SBA 7(a) — strong factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-018 (member tenure) | Strong | member_tenure_years >= 2 | SBA eligibility floor |
| FACTOR-019 (annual revenue) | Strong | annual_revenue <= SBA_size_standard | SBA eligibility ceiling (industry-specific) |

**TRACK-004 — moderate factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-005 (operating margin) | Moderate | operating_margin_pct >= 15 | Capacity-to-service |
| FACTOR-009 (YoY revenue growth) | Moderate | yoy_revenue_growth_pct >= 0 | Stable or growing |
| FACTOR-013 (external advisor: CPA) | Moderate | external_advisor_involved == true AND advisor_type == cpa | Helps SBA paperwork burden |
| FACTOR-015 (decision timeline) | Moderate | decision_timeline IN [6_months, 12_months] | SBA timeline tolerance |
| FACTOR-021 (any growth aspiration) | Moderate | growth_aspiration_tag != null | SBA serves many use-of-proceeds |
| FACTOR-022 (obstacle: any of capacity_limit / cashflow_volatility / aging_equipment) | Moderate | growth_obstacle_tag IN [...] | Use-of-proceeds case |

**TRACK-004 — negative factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-018 (member tenure) | Strong negative | member_tenure_years < 2 | SBA eligibility floor not met |
| FACTOR-019 (annual revenue) | Strong negative | annual_revenue > SBA_size_standard | SBA size-standard exceeded |
| FACTOR-015 (decision timeline) | Negative | decision_timeline == this_quarter | SBA process won't fit |

---

**TRACK-005 Treasury Services Upgrade — strong factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-019 (annual revenue) | Strong | annual_revenue >= 1000000 | Service-fit floor |
| FACTOR-004 (operating cash buffer) | Strong | operating_cash_months < 2 | Cash management pain → treasury value |
| FACTOR-027 (treasury services adopted) | Inverse | LENGTH(treasury_services_adopted) < 3 | Headroom to upgrade |

**TRACK-005 — moderate factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-001 (seasonal variance) | Moderate | seasonal_variance_pct >= 15 | Sweep/timing services value |
| FACTOR-003 (AR concentration) | Moderate | ar_concentration_top3_pct >= 50 | Treasury-management value for concentrated AR |
| FACTOR-009 (YoY revenue growth) | Moderate | yoy_revenue_growth_pct >= 10 | Transaction-volume growth |
| FACTOR-022 (obstacle: cashflow_volatility) | Moderate | growth_obstacle_tag == cashflow_volatility | Treasury-management value |
| FACTOR-025 (Blaze relationship) | Moderate | blaze_relationship_years >= 5 | Relationship deepening fit |

**TRACK-005 — negative factors:**

| Factor | Strength | Threshold rule | Banker rationale |
|---|---|---|---|
| FACTOR-019 (annual revenue) | Negative | annual_revenue < 250000 | Service-fit too small |

---

## Section 4 — Per-Fixture Demo Data

For each demo Member, this section specifies:

- **Captured factors** (what the seed data should encode for this Member)
- **Expected switchboard output** (which Tracks rank where, given those captured factors)
- **Expected dot composition per current Track** (what dots fill, what's missing)
- **Expected popup CTAs and evidence rows** (what surface should show on click)

### 4.1 Jenny's Catering (member_type: small_caterer)

**Captured factors (seed data should set):**

| Factor | Captured value |
|---|---|
| FACTOR-001 (seasonal variance) | seasonal_variance_pct = 28 |
| FACTOR-002 (customer payment cycle) | customer_payment_days = 65 |
| FACTOR-005 (operating margin) | operating_margin_pct = 22 |
| FACTOR-016 (industry seasonal) | industry_seasonal = true (system-derived) |
| FACTOR-018 (member tenure) | member_tenure_years = 7 |
| FACTOR-019 (annual revenue) | annual_revenue = 850000 |
| FACTOR-021 (aspiration) | growth_aspiration_tag = smooth_seasonal_revenue |
| FACTOR-022 (obstacle: cashflow_volatility) | growth_obstacle_tag = cashflow_volatility |
| FACTOR-024 (trigger) | trigger_event_tag = late_paying_customer |
| FACTOR-014 (co-decision-maker required) | co_decision_maker_required = true |
| FACTOR-015 (decision timeline) | decision_timeline = next_quarter |
| FACTOR-025 (Blaze relationship) | blaze_relationship_years = 6 |

**Expected switchboard output (ranked):**

1. **Working Capital LOC — Strong support.** Multiple strong factors: seasonal variance ≥ 20, customer payment days ≥ 60, industry seasonal, obstacle = cashflow_volatility, trigger = late_paying_customer. Plus moderate operating margin. ~6-7 supporting factors.
2. **Treasury Services Upgrade — Moderate support.** Annual revenue ≥ $1M (just barely below threshold; matrix entry for Jenny's actual value of $850K may render as "moderate" or "near-fit" depending on threshold rule strictness). Adjusted to moderate; banker can pursue as adjacent conversation.
3. **SBA 7(a) — Moderate support.** Member tenure ≥ 2, revenue under SBA size standard, obstacle = cashflow_volatility, timeline = next_quarter. Cross-cutting candidate.
4. **Vehicle / Fleet Loan — Insufficient support.** No capacity factors captured.
5. **CRE Term Loan — Insufficient support.** Annual revenue under $5M dealbreaker.

**Expected dot composition for current Track (Working Capital LOC):**

| Objective | Dots | Status |
|---|---|---|
| Discover | Trigger (late_paying_customer) ✓ · Goal (smooth_seasonal_revenue) ✓ · Blocker (cashflow_volatility) ✓ · Industry seasonal ✓ · Tracks-supported indicator ✓ | 5 captured dots |
| Measure | Seasonal variance % ✓ · Operating margin % ✓ · Model produced (smoothing projection) ✓ · Customer payment days ✓ | 4 captured dots |
| Consult | Model shown ✓ · Reaction (leaning_yes) ✓ · Member quote ✓ · Decision posture ✓ · Primary concern (co_decision_maker_household) ✓ — open thread coral | 5 captured dots; 1 open thread |
| Navigate | ActionCard (joint call by May 12) ✓ · 1 faint, awaiting commit | 1 captured, 1 faint |

**Expected popup content for "Discover" objective (when banker clicks):**

```
DISCOVER · for Working Capital LOC
Do we understand how their business can grow?

To strengthen this candidate, capture:
☐ AR concentration of top 3 customers (% of total)
☐ Operating cash buffer (months of expenses covered)

Already captured:
✓ Trigger: Corporate-client late payments observed (Apr 8)
✓ Goal: "I just want to be able to sleep through January." (Mar 12)
✓ Blocker: Seasonal cashflow stress · "January and February kill us every year." ($12K/quarterly impact)
✓ Industry pattern: Catering — seasonal
✓ Tracks supported: Working Capital LOC (strong); Treasury Services Upgrade (moderate); SBA 7(a) (moderate)
```

**Expected popup content for "Measure" objective:**

```
MEASURE · for Working Capital LOC
Have we measured the pain, the lost opportunities, the solution?

To strengthen this candidate, capture:
☐ AR concentration % (suggested: top 3 customers)
☐ Operating cash buffer months

Already captured:
✓ Seasonal revenue variance: 28% (strong-LOC threshold met)
✓ Customer payment cycle: 65 days (strong-LOC threshold met)
✓ Operating margin: 22% (capacity to service)
✓ Annual revenue: $850K
✓ Model: Seasonal cashflow projection (with Member, Apr 8)
```

### 4.2 Northland HVAC (member_type: trades_business)

**Captured factors:**

| Factor | Captured value |
|---|---|
| FACTOR-006 (capacity utilization) | capacity_utilization_pct = 88 |
| FACTOR-007 (demand exceeds capacity) | demand_exceeds_capacity_observed = true; lost_revenue_estimate_quarterly = 45000 |
| FACTOR-009 (YoY revenue growth) | yoy_revenue_growth_pct = 18 |
| FACTOR-010 (equipment / fleet aging) | equipment_aging_observed = true; fleet_avg_age_years = 8 |
| FACTOR-013 (external advisor: CPA) | external_advisor_involved = true; advisor_type = cpa |
| FACTOR-018 (member tenure) | member_tenure_years = 12 |
| FACTOR-019 (annual revenue) | annual_revenue = 2400000 |
| FACTOR-021 (aspiration) | growth_aspiration_tag = expand_capacity |
| FACTOR-022 (obstacle: capacity_limit) | growth_obstacle_tag = capacity_limit |
| FACTOR-022 (obstacle: aging_equipment, secondary) | (multiple obstacle tags supported) |
| FACTOR-024 (trigger) | trigger_event_tag = capacity_evaluation |

**Expected switchboard output (ranked):**

1. **Vehicle / Fleet Loan — Strong support.** Capacity utilization ≥ 75 (strong), demand-exceeds-capacity observed (strong), equipment aging (strong), obstacle: capacity_limit (strong), trigger: capacity_evaluation (strong). Plus moderate operating margin and YoY growth. ~6 strong factors.
2. **SBA 7(a) — Moderate support.** Member tenure ≥ 2, revenue under SBA size standard, CPA advisor (helps paperwork), obstacle: capacity_limit. Cross-cutting candidate.
3. **CRE Term Loan — Moderate support.** Capacity utilization ≥ 80, growth aspiration: expand_capacity, YoY revenue growth, but annual revenue $2.4M is below the $10M strong threshold (renders as moderate due to tier). Worth pursuing as adjacent conversation if Member moves toward facility move/expansion.
4. **Working Capital LOC — Insufficient support.** No cashflow-volatility factors captured.
5. **Treasury Services Upgrade — Insufficient support.** No treasury-relevant factors captured beyond size.

**Expected dot composition for current Track (Vehicle / Fleet Loan):**

| Objective | Dots | Status |
|---|---|---|
| Discover | Trigger (capacity_evaluation) ✓ · Goal (expand_capacity) ✓ · Blocker (capacity_limit) ✓ · Blocker (aging_equipment) ✓ · Tracks-supported indicator ✓ | 5 captured dots |
| Measure | Capacity utilization % ✓ · Lost-revenue quarterly $ ✓ · Fleet avg age ✓ · YoY revenue growth ✓ · Operating margin (suggested next dot) ☐ | 4 captured, 1 suggested |
| Consult | Model produced (fleet expansion ROI) ✓ · Reaction (engaged) ✓ · Indecision (external_advisor) ✓ — open thread coral · Decision posture ✓ | 4 captured; 1 open thread |
| Navigate | (suggested next dot: ActionCard for CPA conversation) ☐ · 2 faint | 0 captured, 1 suggested, 2 faint |

**Expected popup content for "Discover":**

```
DISCOVER · for Vehicle / Fleet Loan
Do we understand how their business can grow?

To strengthen this candidate, capture:
☐ Annual revenue (for fleet-expansion sizing)

Already captured:
✓ Trigger: Capacity-evaluation event (Apr 15)
✓ Goal: "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet."
✓ Blocker: Fleet capacity at limit (88% utilization, 4 trucks)
✓ Blocker: Equipment aging (avg 8 years; one fleet truck on its last legs)
✓ Tracks supported: Vehicle / Fleet Loan (strong); SBA 7(a) (moderate); CRE Term Loan (moderate, sizing-dependent)
```

### 4.3 Cygnus Bioscience (member_type: specialty_manufacturing)

**Captured factors:**

| Factor | Captured value |
|---|---|
| FACTOR-006 (capacity utilization) | capacity_utilization_pct = 85 |
| FACTOR-008 (customer growth signal) | customer_growth_signal = true; expected_volume_growth_pct = 20 |
| FACTOR-009 (YoY revenue growth) | yoy_revenue_growth_pct = 15 |
| FACTOR-011 (real estate constraint) | real_estate_constraint_observed = true |
| FACTOR-013 (external advisor: financial_advisor / CPA) | external_advisor_involved = true; advisor_type = cpa |
| FACTOR-014 (co-decision-maker required) | co_decision_maker_required = true (board) |
| FACTOR-015 (decision timeline) | decision_timeline = 6_months |
| FACTOR-018 (member tenure) | member_tenure_years = 22 |
| FACTOR-019 (annual revenue) | annual_revenue = 28000000 |
| FACTOR-021 (aspiration) | growth_aspiration_tag = expand_capacity |
| FACTOR-022 (obstacle: real_estate) | growth_obstacle_tag = real_estate |
| FACTOR-024 (trigger) | trigger_event_tag = customer_growth_announcement |
| FACTOR-025 (Blaze relationship) | blaze_relationship_years = 18 |
| FACTOR-028 (prior non-Blaze lending) | non_blaze_lending_history = true (2019 expansion) |

**Expected switchboard output (ranked):**

1. **CRE Term Loan — Strong support.** Capacity utilization ≥ 80 (strong), customer growth signal ≥ 15 (strong), real estate constraint observed (strong), annual revenue ≥ $10M (strong), aspiration: expand_capacity (strong), obstacle: real_estate (strong). Plus moderate factors: operating margin, external advisor, co-decision-maker, decision timeline, member tenure, Blaze relationship. ~6 strong + 6 moderate factors.
2. **SBA 7(a) — Moderate support, but disqualifying revenue ceiling.** Member tenure strong, but revenue $28M likely exceeds SBA 7(a) size standard for specialty bioscience (typically $19.5M–$41.5M depending on NAICS). Edge-case Track for the demo; switchboard may surface as moderate-with-caveat or insufficient depending on industry threshold rule.
3. **Treasury Services Upgrade — Moderate support.** Annual revenue ≥ $1M, Blaze relationship ≥ 5 years, possible cashflow-management value. Adjacent conversation.
4. **Working Capital LOC — Insufficient support.** No cashflow-volatility factors captured.
5. **Vehicle / Fleet Loan — Insufficient support.** No fleet/capacity-equipment factors captured.

**Expected dot composition for current Track (CRE Term Loan):**

| Objective | Dots | Status |
|---|---|---|
| Discover | Trigger (customer_growth_announcement) ✓ · Goal (expand_capacity) ✓ · Blocker (real_estate) ✓ · Customer growth signal ✓ · Tracks-supported indicator ✓ | 5 captured dots |
| Measure | Capacity utilization % ✓ · Annual revenue ✓ · Customer-growth volume % ✓ · Model produced (financing scenarios) ✓ · Operating margin (suggested) ☐ | 4 captured, 1 suggested |
| Consult | Model shown (with Member) ✓ · Reaction (committed) ✓ · Member quote ✓ · Decision posture ✓ · Indecision (RFP vs relationship) ✓ — resolved-but-filled (audit trail) | 5 captured |
| Navigate | Specialist handoff initiated to CRE specialist (Marcus Wei) ✓ · ActionCard (working session next week) ✓ · 2 faint awaiting board approval | 2 captured, 2 faint |

**Expected popup content for "Discover":**

```
DISCOVER · for CRE Term Loan
Do we understand how their business can grow?

To strengthen this candidate, capture:
✓ All Discover-objective factors captured

Already captured:
✓ Trigger: Customer-growth announcement (anchor customer naming Cygnus preferred supplier)
✓ Goal: "We're past the question of whether; we're working on the how and the when."
✓ Blocker: Real-estate footprint constraint at 85% capacity
✓ Customer growth signal: 20% volume increase expected over 18 months
✓ Tracks supported: CRE Term Loan (strong, 6 factors); Treasury Services (moderate); SBA 7(a) (insufficient — revenue ceiling)

Notable context:
• Member's last expansion (2019) was financed by a regional bank, not Blaze. Relationship-led pitch fits the Member's stated preference: "I'd like the next round to be with you."
```

---

## Section 5 — Editorial Review Prompts for Francisco

Five places where banker's-eye judgment matters more than my drafting:

**E1 — Threshold values.** I drafted thresholds at common-sense business levels (seasonal variance ≥ 20%, capacity utilization ≥ 75%, etc.). These should reflect what real bankers consider "strong support" vs "moderate." Are any obviously wrong? My most uncertain calls: the seasonal variance threshold (could be 15% or 25% depending on industry sensitivity) and the operating margin threshold for SBA 7(a) (15% feels low; 20% feels high).

**E2 — Track scoping.** Five Tracks demonstrate range; do they cover the demo cases well? Specifically: is "Treasury Services Upgrade" the right non-credit Track to include, or would another (Merchant Services? Business Credit Card?) demonstrate the matrix's range better? Is SBA 7(a) the right cross-cutting candidate, or is Equipment Loan a better choice for Northland's narrative?

**E3 — Factor catalog completeness.** 28 factors. Anything obviously missing? My most uncertain: should we have a factor for collateral availability? For owner credit profile (CMS-allowed bands)? For member's debt-service-coverage ratio? These start to overlap with downstream underwriting; line-drawing matters.

**E4 — Per-fixture demo data realism.** For each Member, the captured factors should produce a switchboard ranking that "rings true" to a banker eyeballing the case. Does Jenny's data produce a ranking where Working Capital LOC is unambiguously top? Does Cygnus's produce CRE Term Loan unambiguously top? Does the Northland fleet-loan ranking feel right? Anything that should be sharpened?

**E5 — Compliance discipline gap-check.** I applied COMPLIANCE.md §6.3 throughout (business-factor-only, no protected-class proxies, structural framing for decision-process factors). Worth a fresh pass: anything that reads like a protected-class proxy when viewed with skeptical eyes? My most uncertain: FACTOR-014 (co-decision-maker required) — captured as structural fact, not relationship descriptor, but worth verifying the framing reads cleanly to a regulator.

---

## Section 6 — Sprint 5a Schema Notes (for prompt drafting)

When CC implements this in Sprint 5a, the schema additions are:

**BusinessFactor entity:**
```prisma
model BusinessFactor {
  id                    String   @id  // FACTOR-001 etc.
  name                  String   // "Seasonal revenue variance"
  diagnostic_question   String   // "By what percentage..."
  capture_mode          String   // "numerical" | "boolean" | "qualitative_select" | "qualitative_multi"
  field_name            String   // "seasonal_variance_pct"
  unit                  String?  // "%" | "days" | "months" | "$" | null
  category              String   // "cashflow" | "capacity" | "decision_process" | etc.
  enum_values           String?  // JSON array of allowed values for qualitative_select
  notes                 String?
  
  matrix_entries        MatrixEntry[]
  factor_captures       FactorCapture[]
}
```

**TrackTemplate entity:**
```prisma
model TrackTemplate {
  id                            String   @id  // TRACK-001 etc.
  name                          String   // "Working Capital Line of Credit"
  banker_description            String
  typical_size_band             String?
  required_evidence_per_objective Json   // { discover: [...], measure: [...], consult: [...], navigate: [...] }
  notes                         String?
  
  matrix_entries                MatrixEntry[]
}
```

**MatrixEntry entity:**
```prisma
model MatrixEntry {
  id                    String   @id @default(cuid())
  factor_id             String
  factor                BusinessFactor @relation(fields: [factor_id], references: [id])
  track_id              String
  track                 TrackTemplate @relation(fields: [track_id], references: [id])
  strength              String   // "strong" | "moderate" | "negligible" | "negative"
  threshold_rule        String?  // Comparison rule, e.g. "seasonal_variance_pct >= 20"
  banker_rationale      String   // Used in popup CTAs and Tracks-supported panel
  
  @@unique([factor_id, track_id])  // each factor-track pair has one entry
}
```

**FactorCapture entity (links captured factors to Members):**
```prisma
model FactorCapture {
  id                    String   @id @default(cuid())
  member_id             String
  member                Member   @relation(fields: [member_id], references: [id])
  factor_id             String
  factor                BusinessFactor @relation(fields: [factor_id], references: [id])
  numerical_value       Float?
  boolean_value         Boolean?
  qualitative_value     String?
  unit                  String?
  source_signal_id      String?  // optional reference to Signal
  source_sizing_id      String?  // optional reference to SizingMeasurement
  source_reaction_id    String?  // optional reference to Reaction
  captured_at           DateTime @default(now())
  banker_id             String
  
  @@index([member_id])
  @@index([factor_id])
}
```

The matrix lookup at render time is essentially:

```typescript
// pseudocode
function rankTracksForMember(memberId): RankedTrack[] {
  const captures = await db.factorCapture.findMany({ where: { member_id: memberId } });
  const matrix = await db.matrixEntry.findMany({ include: { factor: true, track: true } });
  
  const trackScores = new Map<string, { strong: number, moderate: number, negative: number }>();
  
  for (const capture of captures) {
    const relevantEntries = matrix.filter(e => e.factor_id === capture.factor_id);
    for (const entry of relevantEntries) {
      if (evaluateThreshold(capture, entry.threshold_rule)) {
        // increment trackScores[entry.track_id][entry.strength]
      }
    }
  }
  
  // Filter: only return Tracks where (strong + moderate) >= 2 (the 2-evidence-threshold rule)
  // Sort by: strong DESC, then moderate DESC, with negative as a strong demerit
  return rankedTracks;
}

function evaluateThreshold(capture: FactorCapture, rule: string): boolean {
  // Simple rule parser: "field_name >= value" or "field_name == value" or "field_name IN [...]"
  // Uses capture.numerical_value, capture.boolean_value, capture.qualitative_value
}
```

This is the entire "rule engine" — a comparison-operator evaluator. ~50 lines of TypeScript.

---

**End of matrix data draft.**

Total content: 28 factors, 5 Tracks, ~80 strong/moderate matrix entries, ~10 negative/dealbreaker entries, 3 fixtures' demo data with switchboard / dot / popup expectations.

Ready for Francisco's review pass per Section 5 prompts. After review, this becomes the seed data for Sprint 5a.
