# Source inventory — essential value → resolvable source or prompt

> Read-only · branch `diagnosis/required-field-audit` · continues
> [`01_required_field_audit.md`](./01_required_field_audit.md) §1.
> No code/schema/seed/design-doc changes.

## How to read this

**Resolution precedence** (the design this serves): ① captured evidence → ② Member-fact →
③ Recommendation/product → ④ derivation → ⑤ PROMPT.

**Two facts that shape every row:**
1. **There are no discrete quantitative Member columns.** `Member` holds only
   `slug/legal_name/stage/size_band/member_type/tenure/key_facts(JSON, hand-curated display)/active_track_ids`.
   Every "member-fact" (revenue, utilization) actually lives in a **FactorCapture** row. So tier
   *member-fact* and *captured-evidence* are the **same mechanism** here.
2. **The only resolution wired today** is the `source_factor_id` overlay at
   `artifact-template-render.tsx:123-133` (+ `computed` params). **Recommendation is never read.
   Derivation across keys is never done.** So any value without a `source_factor_id` resolves today
   only from the **hand-seeded literal** in `Model.template_parameters` — which in a real
   resolve-then-prompt flow = **PROMPT**.

**Captured-evidence reality for the three members** (FactorCaptures present):

| Factor | jenny | northland | cygnus |
|---|---|---|---|
| FACTOR-019 annual_revenue ($) | 850K | 2.4M | 28M |
| FACTOR-006 capacity_utilization (%) | — | 88 | 85 |
| FACTOR-007 demand_exceeds_capacity (bool) | — | ✓ (banker_estimate) | — |
| FACTOR-001 seasonal_variance (%) | 28 | — | — |
| FACTOR-035 property_acquisition_$ | — | — | 5.5M |
| FACTOR-033 equipment_$ / 034 improvement_$ / 036 credit_limit_$ / 037 loan_amount_$ | **none captured for anyone** | | |
| Recommendation (size_proposed) | LOC 75K | Vehicle/Fleet 180K | CRE 4–7M (range) |
| SizingMeasurements | none | none | none |

The "sized" dollar factors (033/034/036/037) **exist in the catalog as the intended home** but are
captured for **no demo member** → they resolve to PROMPT in practice.

**Tier** ∈ {member-fact, captured-evidence, product/Rec, forward-estimate, un-captured-measure}.
**PROMPT provenance tags** use the codebase's `capture_mode`: `member_confirmed` (a measure to confirm
with the member) or `banker_estimate` (a forward banker number).

---

## DEMO-CRITICAL (Northland walkthrough)

### Template 010 — Business Vehicle Loan (`vehicle_capacity_uplift`) · Northland primary · **Demo-critical Y**

| Essential value | Used for | Tier | Resolution (exact source) | Wired? | Populated (Northland)? | If PROMPT |
|---|---|---|---|---|---|---|
| `capacity_utilization_now` | "today" ceiling | member-fact | FactorCapture `source_factor_id=FACTOR-006` (88%) | **Y** | **Y** (88%) | — |
| `monthly_debt_service` | coverage line | product/Rec | derive `monthlyPayment(Recommendation.size_proposed=180K, term, rate)` | **N** | partial — Rec has **amount**, but **term/rate have no home** | forward `banker_estimate` (term+rate) |
| `current_monthly_revenue` | row-1 baseline | member-fact | derive FACTOR-019 ($2.4M)÷12 = $200K — **seed says $50K** | N | via FACTOR-019 Y, **but conflicts** | (resolve precedence — Q-054) |
| `current_declined_revenue_monthly` | declined-work annotation | un-captured-measure | SizingDimension `declined_work_volume` exists, **no SizingMeasurement** captured | N | N (seed literal $4,200) | measure → `member_confirmed` |
| `projected_induced_demand_monthly` | row-3 uplift | forward-estimate | none — Model param only | N | N (seed literal $6,000) | forward → `banker_estimate` |

> Schema marks `purchase_price`(FACTOR-033)/`down_payment`/`rate_type`/`demand_exceeding_capacity`(FACTOR-007)
> **required**, but per §1 the chart never reads them — excluded from essentials. Only **1 of 5**
> essentials (`capacity_utilization_now`) is actually resolvable today.

### Template 004 — Equipment ROI (`cost_of_doing_nothing`) · Northland's real (retagged) Fleet model · **Demo-critical Y**

| Essential value | Used for | Tier | Resolution | Wired? | Populated (Northland)? | If PROMPT |
|---|---|---|---|---|---|---|
| `loan_amount` | financing/interest | product/Rec | `Recommendation.size_proposed` = $180K (matches seed) | **N** | **Y via Rec** (unread) | — (wire Rec) |
| `current_monthly_maintenance` | aging-cost slope | un-captured-measure | no factor/field; FACTOR-010 is boolean only | N | N (seed $2,800) | measure → `member_confirmed` |
| `monthly_downtime_cost` | aging-cost slope | un-captured-measure | no home | N | N (seed $1,500) | measure/estimate → `banker_estimate` |
| `monthly_declined_revenue` | aging-cost slope | un-captured-measure | SizingDimension exists, uncaptured | N | N (seed $4,200) | measure → `member_confirmed` |

### Template 002 — SBA 7(a) growth (`growth_trajectory`) · over-generated onto Northland · **Demo-critical Y**

| Essential value | Used for | Tier | Resolution | Wired? | Populated (Northland)? | If PROMPT |
|---|---|---|---|---|---|---|
| `current_annual_revenue` | organic baseline | member-fact | FactorCapture `FACTOR-019` ($2.4M) | **Y** | **Y** | — |
| `loan_amount` | with-loan curve | product/Rec | `FACTOR-037` (uncaptured) **or** `Recommendation.size_proposed` (Northland's Rec is Vehicle, not SBA → mismatch) | N | **N** | forward → `banker_estimate` |
| `expected_year_1_revenue_uplift` | with-loan curve | forward-estimate | none — Model param | N | N | forward → `banker_estimate` |

### Template 008 — SBA 504 roadmap (`sba_504_paired`) · over-generated onto Northland (natural fit = Cygnus) · **Demo-critical Y**

| Essential value | Used for | Tier | Resolution | Wired? | Populated? | If PROMPT |
|---|---|---|---|---|---|---|
| `property_value` | structure bars | captured-evidence | FactorCapture `FACTOR-035` | **Y** | **Cygnus Y (5.5M) · Northland N** | (Northland) capture → `member_confirmed` |
| `current_stage` | roadmap "you are here" | forward-estimate | **no home** — no entity tracks roadmap position | N | N (seed=3 for Cygnus only) | banker-set → `banker_estimate` |

> Cleanest illustration of the over-generation defect: `property_value` **is** wired, but for Northland
> the source is **empty**, so an SBA card on a fleet member is all-PROMPT.

### Template 005 — PACE (`pace_monthly_savings`) · over-generated onto Northland (natural fit = Cygnus) · **Demo-critical Y**

| Essential value | Used for | Tier | Resolution | Wired? | Populated? | If PROMPT |
|---|---|---|---|---|---|---|
| `improvement_cost` | assessment calc | captured-evidence | FactorCapture `FACTOR-034` (sized) | **Y** | **N (captured for nobody)** | capture → `member_confirmed` |
| `monthly_energy_savings` | net-benefit bars | un-captured-measure | no home | N | N (seed $7,800) | measure/estimate → `banker_estimate` |

---

## REMAINING TEMPLATES · **Demo-critical N**

### Template 001 — CRE Lease vs Own (`lease_vs_own`) · Cygnus compare
| Value | Tier | Resolution | Wired? | Populated (Cygnus)? | If PROMPT |
|---|---|---|---|---|---|
| `acquisition_price` | captured-evidence | `FACTOR-035` | Y | Y (5.5M) | — |
| `current_monthly_rent` | un-captured-measure | no home | N | N (seed) | measure → `member_confirmed` |

### Template 003 — Investment-property (`cashflow_equity_dual`) · over-gen
| Value | Tier | Resolution | Wired? | Populated? | If PROMPT |
|---|---|---|---|---|---|
| `purchase_price` | captured-evidence | `FACTOR-035` | Y | only Cygnus | capture → `member_confirmed` |
| `monthly_rent` | un-captured-measure | no home | N | N | measure → `member_confirmed` |
| `monthly_operating_expenses` | un-captured-measure | no home | N | N | measure → `member_confirmed` |

### Template 006 — Business Visa (`business_visa_capability`) · Jenny secondary
| Value | Tier | Resolution | Wired? | Populated (Jenny)? | If PROMPT |
|---|---|---|---|---|---|
| `annual_operational_spend` | footnote | captured-evidence | `FACTOR-019` ⚠ **wired to "annual revenue", semantic mismatch (spend≠revenue)** | Y | Y (=revenue, wrong meaning) | (flag — Q-056) |
| `proposed_limit` | headroom | product/Rec | `FACTOR-036` (uncaptured) or Recommendation | Y (factor) | N | forward → `banker_estimate` |
| `expected_monthly_spend` | usage % | forward-estimate | no home | N | N | forward → `banker_estimate` |

### Template 007 — Unsecured (`unsecured_opportunity`) · Jenny secondary
| Value | Tier | Resolution | Wired? | Populated? | If PROMPT |
|---|---|---|---|---|---|
| `loan_amount` | interest cost | product/Rec | `FACTOR-037` (uncaptured) or Recommendation | Y (factor) | N | forward → `banker_estimate` |
| `opportunity_value` | decision bar | forward-estimate | no home | N | N | forward → `banker_estimate` |

### Template 009 — Seasonal LOC (`cashflow_projection`, section-list) · Jenny/Riverside
| Value | Tier | Resolution | Wired? | Populated (Jenny)? | If PROMPT |
|---|---|---|---|---|---|
| `annual_revenue_band` | section | member-fact | `FACTOR-019` | Y | Y (850K) | — |
| `seasonal_variance` | section | captured-evidence | `FACTOR-001` | Y | Y (28%) | — |
| `requested_credit_limit` | section | product/Rec | `FACTOR-036` (uncaptured) **or** Recommendation.size_proposed ($75K) | Y (factor) | N (factor)/Y (Rec) | derive from Rec |
| `slow_season_gap` | section | un-captured-measure / derivation | derive from revenue×variance? no rule today | N | N | measure → `member_confirmed` |

---

## Three reported items

### 1. Precedence conflicts (essential values with >1 available source — flagged, not decided)
- **`current_monthly_revenue` (T-010):** derived FACTOR-019÷12 (**$200K**) vs. seeded literal (**$50K**),
  and semantically the chart's "baseline" may not be total business revenue. → **Q-054**.
- **`loan_amount` (T-002/004/007) & `requested_credit_limit`/`proposed_limit` (T-006/009):** "sized"
  factor (FACTOR-037/036) vs. **Recommendation.size_proposed**. Two homes for the same number; for
  Northland the sized factor is empty and the Rec product may not match the template's product. → **Q-055**.
- **One factor → many template keys:** `FACTOR-035` feeds `property_value`/`acquisition_price`/`purchase_price`
  (T-001/003/008); `FACTOR-019` feeds `annual_revenue_band`/`current_annual_revenue`/**`annual_operational_spend`**
  (T-002/006/009). The last is a **semantic mis-wire** (spend≠revenue). → **Q-056**.

### 2. The ledger question — where member-level facts live, and whether a per-product evidence tab is wiring vs. new structure
Member-level facts live in **FactorCapture rows keyed by FACTOR-0NN** — *not* discrete Member columns
(Member has none) and *not* Signals (those carry qualitative tags + quotes). `key_facts` is hand-curated
display JSON only. **A per-lending-product "evidence tab" can be assembled from existing data with no new
structure for the captured/sized tiers**: each template's `parameter_schema` already declares its
`source_factor_id` set, so the tab = join `FactorCapture` on that set + pull `Recommendation.size_proposed`
for the amount. That is a **wiring job**. The catch: the **forward estimates and recurring monthly
operating measures have no ledger home** (item 3), so they will always render as PROMPT rows on that tab
— the tab can show "captured ✓ / needs capture ⚠ / banker estimate" but cannot *populate* the latter two
from anywhere.

### 3. Essential values with NO home in the data model at all (genuine gaps, not just unwired)
- **Recurring monthly operating measures:** `current_monthly_maintenance`, `monthly_downtime_cost`,
  `monthly_(declined_revenue|rent|operating_expenses|energy_savings)`, `current_monthly_rent`,
  `expected_monthly_spend`, and a *monthly* revenue distinct from FACTOR-019's annual. No BusinessFactor,
  no Member field, no captured SizingMeasurement. (`declined_work_volume` SizingDimension exists but is
  uncaptured and is *volume*, not monthly $.) → **Q-057**.
- **Loan structure:** `term_months` / `interest_rate` — `Recommendation` carries `size_proposed` but
  **not term or rate**, so `monthly_debt_service` can't be derived from the Rec alone. Partial gap on
  Recommendation.
- **Roadmap position:** `current_stage` / `you_are_here_label` (T-008) — nothing models "where in the
  transaction roadmap this member is."
- **Forward projections** (`projected_induced_demand_monthly`, `expected_year_1_revenue_uplift`,
  `opportunity_value[_low/high]`) have no *evidence* home by nature; their correct home is
  `Model.template_parameters` as banker estimates — acceptable, but they can never resolve from the ledger.

**Net spec takeaway:** of the essential values across all 10 templates, the genuinely resolvable-today set
is small — `FACTOR-019`, `FACTOR-006`, `FACTOR-001`, `FACTOR-035` (Cygnus only). Everything else is either
an **unwired Recommendation amount** (mechanical wiring) or a **structural gap** (forward estimates +
monthly operating measures) that will remain a PROMPT row regardless of wiring.

---

*Flagged decisions Q-054–Q-057 are logged in `OPEN_QUESTIONS.md`.*
