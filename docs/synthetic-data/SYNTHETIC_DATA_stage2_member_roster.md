# Stage 2 — Member Roster (200 Members)

Synthetic Member portfolio for Insight Engine dashboard. 200 Members distributed across 14 bankers and 28 branches with full attributes for all 10 drill-down views.

---

## Section 1 — Member-Type taxonomy

Per earlier conversation, expanded from 3 demo Member-Types to 8 for portfolio realism. Coach content stays focused on the 3 with full content (event_services, maintenance_services, specialty_manufacturer); the other 5 fall back to a generic Coach experience for demo purposes.

### 1.1 Eight Member-Types

| ID | Display name | Examples | Portfolio share |
|---|---|---|---|
| event_services | Event services | Caterers, event planners, venue operators, wedding services | 12% (24 Members) |
| maintenance_services | Maintenance services | HVAC, plumbing, electrical, landscapers, pool service | 18% (36 Members) |
| specialty_manufacturer | Specialty manufacturer | Industrial fabrication, custom production, contract manufacturing | 10% (20 Members) |
| professional_services | Professional services | Legal, accounting, consulting, engineering firms | 14% (28 Members) |
| healthcare_services | Healthcare services | Clinics, dental, veterinary, physical therapy | 11% (22 Members) |
| food_services | Food services | Restaurants, bakeries, food production | 13% (26 Members) |
| retail | Retail | Specialty retail, boutique, consumer goods | 12% (24 Members) |
| construction | Construction | General contractors, specialty construction | 10% (20 Members) |

Total: 200 Members.

### 1.2 Member-Type to Track propensity

Different Member-Types have different lending product profiles. This drives realistic Track distribution in the dashboard.

| Member-Type | Most likely Tracks | Less likely Tracks |
|---|---|---|
| event_services | Working Capital LOC (future-expansion), Business Vehicle, Business Visa | CRE, SBA 504, Equipment & Machinery |
| maintenance_services | Business Vehicle, Equipment & Machinery, SBA 7(a) (future-expansion) | Investment Property, PACE |
| specialty_manufacturer | SBA 504, CRE, Equipment & Machinery | Business Visa, Unsecured |
| professional_services | CRE, Investment Property, Business Visa | Equipment & Machinery, PACE |
| healthcare_services | CRE, SBA 504, Equipment & Machinery | Investment Property, Unsecured |
| food_services | Equipment & Machinery, Working Capital LOC, CRE | PACE, SBA 504 |
| retail | CRE, Working Capital LOC, Business Visa | SBA 504, Equipment & Machinery |
| construction | Business Vehicle, Equipment & Machinery, SBA 7(a) | PACE, Investment Property |

This produces realistic Member-Type × Lending product matrix patterns.

---

## Section 2 — Member distribution by branch

200 Members distributed across 28 branches per branch tier targets from Stage 1 Section 1.4:

### 2.1 Per-branch Member counts

**Major branches (avg 20 Members each):**
- BRANCH-001 Minneapolis Downtown: 24 Members (Scott + James Patterson)
- BRANCH-002 St. Paul Downtown: 24 Members (Marcus Johansson)
- BRANCH-003 Maple Grove: 16 Members (Linnea Petersen)
- BRANCH-004 Edina: 22 Members (Sarah Chen, Rachel Goldman split coverage)
- BRANCH-005 Bloomington: 20 Members (David Nguyen)

Total Major: 106 Members

**Regional branches (avg 12 Members each):**
- BRANCH-021 St. Cloud: 8 Members (Jennifer Vang primary)
- BRANCH-028 Rochester: 9 Members (Diana Reyes primary)

Total Regional: 17 Members

**Standard MSP suburbs (avg 5 Members each):**
- BRANCH-006 Plymouth: 6 (Karin Lindgren)
- BRANCH-007 Roseville: 5 (Robert Anderson)
- BRANCH-008 Burnsville: 7 (Maria Reyes)
- BRANCH-009 Woodbury: 8 (Tom Olsson)
- BRANCH-010 Eagan: 5 (Robert Anderson)
- BRANCH-011 Coon Rapids: 7 (Abdirahman Hassan)
- BRANCH-012 Anoka: 4 (varies)
- BRANCH-013 Brooklyn Park: 8 (Abdirahman Hassan)
- BRANCH-014 Apple Valley: 6 (Maria Reyes)
- BRANCH-015 Lakeville: 4 (varies)
- BRANCH-016 Eden Prairie: 5 (varies)
- BRANCH-017 Minnetonka: 6 (Karin Lindgren)
- BRANCH-018 Shakopee: 3 (varies)
- BRANCH-019 Stillwater: 8 (Tom Olsson)
- BRANCH-020 Cottage Grove: 4 (varies)

Total Standard MSP: 86 Members

**Outstate branches (avg 2 Members each):**
- BRANCH-022 Princeton: 3 (Jennifer Vang)
- BRANCH-023 Mora: 1 (Jennifer Vang or Outstate-shared)
- BRANCH-024 Pine City: 1
- BRANCH-025 Ogilvie: 1
- BRANCH-026 Milaca: 2 (Jennifer Vang)
- BRANCH-027 Waseca: 3 (Diana Reyes)

Total Outstate: 11 Members

**Grand total: 220 Members across all branches.** Slightly above 200 target; allows for branches with slightly higher density and richer Major-branch concentrations. Real numbers used for dashboard render at 220 Members, presented as "200+" in hero metrics.

### 2.2 Geographic clustering

Members cluster around branches with normal distribution (most Members within ~5 miles of their assigned branch; some up to ~15 miles for Members who chose Blaze for relationship reasons rather than proximity).

Geographic visualization shows:
- Heavy MSP cluster (~165 Members in 7-county metro)
- Outstate dots in St. Cloud / Rochester / outstate exurban areas
- Visual density matches Blaze's branch footprint

---

## Section 3 — Phase distribution

Each Member is at one of four phases: Discover / Measure / Consult / Navigate. Distribution reflects realistic pipeline shape — most Members in early phases, fewer in late phases (some convert to closed deals which migrate to Stage 3 closed-deal data).

### 3.1 Per-phase Member counts

| Phase | Member count | Share | Implication |
|---|---|---|---|
| Discover | 88 | 40% | Largest phase; fresh prospecting |
| Measure | 66 | 30% | Quantitative work in progress |
| Consult | 38 | 17% | Showing models, gauging reactions |
| Navigate | 28 | 13% | Active path to closure |

Total: 220 Members.

### 3.2 Days-in-current-phase distribution

For temporal momentum and "average days to progress" hero metric:

- **Discover:** 5-45 days in phase (median 20 days)
- **Measure:** 10-60 days in phase (median 28 days)
- **Consult:** 14-75 days in phase (median 35 days)
- **Navigate:** 20-150 days in phase (median 60 days; SBA 504 tail extends this)

Days-in-phase correlates with Track type. CRE / SBA 504 deals take longer; Working Capital LOC / Business Visa shorter.

### 3.3 Stage-skip flag

Per Sprint 5d Riverside Catering fixture, ~5-8 Members in the portfolio (3-4% of 220) have stage-skip flag (later-phase evidence captured without earlier-phase required evidence).

These surface on the Stage-skip drill-down view.

---

## Section 4 — Track distribution

Each Member has a current Track (the lending product they're being cultivated for). Distribution per Member-Type propensity from Section 1.2.

### 4.1 Per-Track Member counts

| Track | Member count | Share | Notes |
|---|---|---|---|
| TRACK-001 Working Capital LOC | 22 | 10% | Future-expansion product |
| TRACK-002 Business Vehicle Loan | 28 | 13% | Active Blaze offering |
| TRACK-003 CRE Term Loan | 36 | 16% | Heaviest active offering |
| TRACK-004 SBA 7(a) | 16 | 7% | Future-expansion product |
| TRACK-006 Investment Property Loan | 18 | 8% | Active Blaze offering |
| TRACK-007 Equipment & Machinery | 32 | 15% | Active Blaze offering (heavy with maintenance + manufacturer + food) |
| TRACK-008 SBA 504 | 24 | 11% | Active Blaze offering (primary for specialty manufacturer) |
| TRACK-009 PACE Loan | 6 | 3% | Active but niche |
| TRACK-010 Business Visa Credit Card | 22 | 10% | Active; cross-Member-Type |
| TRACK-011 Unsecured Loan | 16 | 7% | Active; smaller amounts |

Total: 220.

### 4.2 Future-expansion vs Blaze offerings

Of 220 Members:
- **38 Members on future-expansion Tracks** (TRACK-001 + TRACK-004) = 17% of pipeline
- **182 Members on Blaze active offerings** = 83% of pipeline

In dashboards: Track Performance surface shows this split prominently. Demonstrates pipeline value if Blaze expands product offerings.

### 4.3 Member-Type × Track matrix

Computed distribution producing the heatmap visualization:

| Member-Type | TRACK-001 LOC | TRACK-002 Vehicle | TRACK-003 CRE | TRACK-004 SBA 7(a) | TRACK-006 IP | TRACK-007 Equipment | TRACK-008 SBA 504 | TRACK-009 PACE | TRACK-010 Visa | TRACK-011 Unsecured |
|---|---|---|---|---|---|---|---|---|---|---|
| event_services | 6 | 3 | 1 | 2 | 0 | 2 | 0 | 0 | 6 | 4 |
| maintenance_services | 2 | 12 | 2 | 5 | 1 | 9 | 0 | 1 | 2 | 2 |
| specialty_manufacturer | 0 | 0 | 4 | 1 | 0 | 4 | 9 | 1 | 1 | 0 |
| professional_services | 4 | 1 | 8 | 1 | 6 | 1 | 1 | 1 | 4 | 1 |
| healthcare_services | 1 | 1 | 6 | 1 | 2 | 5 | 5 | 0 | 1 | 0 |
| food_services | 5 | 1 | 5 | 1 | 0 | 7 | 3 | 1 | 1 | 2 |
| retail | 3 | 1 | 6 | 1 | 5 | 1 | 2 | 1 | 4 | 0 |
| construction | 1 | 9 | 4 | 4 | 4 | 3 | 4 | 1 | 3 | 7 |

This produces realistic dense + sparse cells in the heatmap.

---

## Section 5 — Sized opportunity values

Each Member has a sized opportunity (dollar amount). Distribution by Track:

### 5.1 Per-Track size ranges

| Track | Size range | Median | Distribution |
|---|---|---|---|
| TRACK-001 Working Capital LOC | $25K - $250K | $75K | Skewed lower |
| TRACK-002 Business Vehicle Loan | $35K - $400K | $125K | Mid-range |
| TRACK-003 CRE Term Loan | $250K - $5M | $1.2M | Wide range |
| TRACK-004 SBA 7(a) | $100K - $2M | $500K | Mid-large |
| TRACK-006 Investment Property Loan | $150K - $750K | $325K | Mid-range |
| TRACK-007 Equipment & Machinery | $50K - $850K | $200K | Mid-range |
| TRACK-008 SBA 504 | $1M - $8M | $3M | High-value |
| TRACK-009 PACE Loan | $40K - $500K | $150K | Mid-range |
| TRACK-010 Business Visa Credit Card | $5K - $75K | $20K | Smaller |
| TRACK-011 Unsecured Loan | $5K - $25K | $15K | Smallest (capped at $25K) |

### 5.2 Pipeline value calculation

Sum of sized opportunities across all 220 Members produces hero metric "pipeline value."

Approximate aggregate (using medians):
- 22 × $75K = $1.65M (LOC)
- 28 × $125K = $3.5M (Vehicle)
- 36 × $1.2M = $43.2M (CRE)
- 16 × $500K = $8M (SBA 7(a))
- 18 × $325K = $5.85M (Investment Property)
- 32 × $200K = $6.4M (Equipment)
- 24 × $3M = $72M (SBA 504)
- 6 × $150K = $900K (PACE)
- 22 × $20K = $440K (Visa)
- 16 × $15K = $240K (Unsecured)

**Total pipeline value: approximately $142M**

For hero metric display: "$140M+" or "$142M active pipeline."

### 5.3 Pipeline-value-by-phase weighting

Not all sized opportunities are equally likely to close. Pipeline value at face value is misleading; actual expected value weights by phase progression.

Optional weighted view:
- Discover-phase: 10% weighting
- Measure-phase: 35% weighting
- Consult-phase: 60% weighting
- Navigate-phase: 85% weighting

Weighted pipeline value: approximately $48M.

Demo decision: show face-value ($140M+) in hero metric (more impressive). Optional toggle to "weighted pipeline" view in drill-down.

---

## Section 6 — Banker assignment

Each Member assigned to one banker. Distribution matches banker target Member counts from Stage 1 Section 2.2.

### 6.1 Per-banker Member counts

| Banker | Target | Actual | Notes |
|---|---|---|---|
| Scott Brynjolffson | 18 | 18 | Includes Jenny, Northland, Cygnus, Riverside |
| Sarah Chen | 22 | 23 | CRE specialist; heavy CRE/SBA 504 |
| Marcus Johansson | 24 | 25 | Largest portfolio; tenured generalist |
| Linnea Petersen | 16 | 16 | SBA-focused; mixed portfolio |
| David Nguyen | 20 | 21 | Generalist; mixed portfolio |
| Rachel Goldman | 18 | 18 | CRE-focused |
| Tom Olsson | 16 | 16 | Multi-branch (Woodbury + Stillwater) |
| Maria Reyes | 17 | 18 | Multi-branch (Burnsville + Apple Valley) |
| James Patterson | 14 | 14 | SBA-focused |
| Karin Lindgren | 12 | 12 | Treasury-focused; lighter portfolio |
| Abdirahman Hassan | 15 | 15 | Multi-branch; high activity |
| Robert Anderson | 10 | 10 | Low-activity tenured; smaller portfolio |
| Jennifer Vang | 12 | 14 | Outstate (St. Cloud, Princeton, Mora, Pine City, Milaca) |
| Diana Reyes | 11 | 12 | Outstate (Rochester, Waseca) |

**Total: 232 Members.** Slightly higher than 220 because some bankers have 1-2 Members above target; absorbs natural variance. Display as "220+" in dashboards.

(Adjustment: pull total back to exactly 220 by dropping a few high-bankers; specific cuts per data generator.)

### 6.2 Banker activity correlation

High-activity bankers have:
- More recent captures per Member
- More open opportunities (Members with multiple Track contexts)
- Higher conversion rates (better at moving Members through phases)
- More insights authored

Low-activity bankers have:
- Older captures (more stale)
- Smaller per-Member capture density
- Slower phase progression
- Fewer insights authored

This drives banker activity heatmap differentiation.

---

## Section 7 — Member naming

200+ Member names need to feel realistic and Minnesota-appropriate. Mix of business types per Member-Type taxonomy.

### 7.1 Naming approach

Generate names using these patterns:

**Event services examples:**
- Lakeside Catering Co.
- Twin Cities Wedding & Event
- Aurora Banquet Hall
- North Star Event Group

**Maintenance services examples:**
- Northland HVAC (existing fixture; preserve)
- Premier Plumbing Solutions
- Frostbreak Mechanical
- Loon Lake Landscaping

**Specialty manufacturer examples:**
- Cygnus Bioscience (existing fixture; preserve)
- Headwaters Precision
- Ironwood Industrial
- Mille Lacs Manufacturing

**Professional services examples:**
- Brynjolffson & Associates Law (no relation to Scott)
- Lakeshore Accounting Group
- Skyline Engineering Partners
- Citizens Tax Advisory

**Healthcare services examples:**
- Mississippi Family Dental
- Northgate Veterinary Clinic
- Riverside Physical Therapy (note: not Riverside Catering — distinct)
- Lake Country Medical Group

**Food services examples:**
- Jenny's Catering (existing fixture; tagged event_services per current spec)
- Kingfield Bistro
- Selby Avenue Bakery
- Boundary Waters Brewery

**Retail examples:**
- Como Provisions
- Northeast Specialty Goods
- Highland Apparel
- Lakeland Outdoor Outfitters

**Construction examples:**
- True North Builders
- Foundation First Construction
- Pinewood Homes
- Hennepin Heritage Construction

### 7.2 Existing fixture preservation

Four existing fixtures continue in Stage 2 portfolio with their existing data:
- Jenny's Catering (event_services, BANKER-001 Scott, TRACK-001 Working Capital LOC)
- Northland HVAC (maintenance_services, BANKER-001 Scott, TRACK-002 Business Vehicle Loan)
- Cygnus Bioscience (specialty_manufacturer, BANKER-001 Scott, TRACK-008 SBA 504)
- Riverside Catering (event_services, BANKER-001 Scott, TRACK-001 Working Capital LOC, stage-skip)

Other 216 Members are dashboard-only — no detailed Member-level captures, just aggregate roll-up data.

---

## Section 8 — Capture density per Member

Members vary in capture density. This drives the "How much we've captured" tier display in Track Performance surface and feeds banker activity heatmap.

### 8.1 Density tiers

- **A little (0-2 captures):** ~30% of Members (66 Members) — newer relationships, recent prospects
- **Some (3-6 captures):** ~50% of Members (110 Members) — active cultivation
- **A lot (7+ captures):** ~20% of Members (44 Members) — deep relationships, late-phase

### 8.2 Density correlations

- **Phase correlation:** Discover Members tend toward "A little" or "Some"; Navigate Members tend toward "A lot"
- **Banker correlation:** High-activity bankers' Members skew toward "Some" or "A lot"; low-activity (Robert Anderson) skews toward "A little"
- **Track correlation:** High-value Tracks (SBA 504, CRE) accumulate more captures than smaller Tracks (Visa, Unsecured)

### 8.3 Open thread distribution

Per Sprint 5b.2 logic: open threads = Indecision Signals without subsequent Reaction. Distribution:

- ~25% of Members have at least 1 open thread (55 Members)
- ~5% have 3+ open threads (11 Members; surface on Coverage drill-down)
- Average days-open: 18 days (median); 90+ day cohort: 8% of open threads

---

## Section 9 — Last-touch dates

Each Member has a last_touch_at timestamp. Distribution:

- **Last touched <7 days:** 35% of Members (~77) — actively in conversation
- **Last touched 7-30 days:** 40% of Members (~88)
- **Last touched 30-60 days:** 18% of Members (~40)
- **Last touched 60-90 days:** 5% of Members (~11) — stale
- **Last touched 90+ days:** 2% of Members (~5) — very stale; on Stage-skip or Coverage surfaces

This produces realistic Member portfolio default sort (oldest-touched first).

---

## Section 10 — Schema notes for synthetic data generator

When CC implements the data generator, Stage 2 produces:

```typescript
type Member = {
  id: string;                          // MEMBER-NNN
  name: string;
  member_type: 'event_services' | 'maintenance_services' | 'specialty_manufacturer' | 
               'professional_services' | 'healthcare_services' | 'food_services' | 
               'retail' | 'construction';
  banker_id: string;                   // FK to Banker
  branch_id: string;                   // FK to Branch
  
  // Geographic
  latitude: number;                    // Geographic position (clustered around branch)
  longitude: number;
  
  // Pipeline state
  current_phase: 'discover' | 'measure' | 'consult' | 'navigate';
  current_track_id: string;            // FK to TrackTemplate
  days_in_current_phase: number;
  is_stage_skipping: boolean;
  
  // Sizing
  sized_opportunity_amount: number;    // Dollars
  
  // Activity
  last_touch_at: Date;
  capture_count: number;
  open_thread_count: number;
  pending_action_card_count: number;
  
  // Density tier (computed from capture_count)
  capture_density_tier: 'little' | 'some' | 'lot';
};
```

Stage 2 produces:
- 220 Member records (but only 4 are detailed — Jenny, Northland, Cygnus, Riverside)
- The 216 "dashboard-only" Members have aggregate attributes only
- Member coordinates randomized within branch radius
- Total: ~80KB of seed data

---

## Section 11 — Open items for review

**Decision needed:**

1. **Member count: 220 → display as 200+ acceptable?** Or pull strict to 200?

2. **Member-Type expansion to 8 types confirmed?** Or stay at the 3 from Coach content?

3. **Pipeline value display: $142M face value or $48M weighted?** My recommendation: face value with weighted view in drill-down toggle.

4. **Specific Member naming list needed, or generator approach acceptable?** I'm proposing a synthetic name generator producing realistic but fake Member names. Real-feeling but not real businesses. Want me to enumerate specific names for a sample, or trust generator approach?

5. **Member-Type × Track matrix accuracy.** The heatmap distribution in Section 4.3 reflects my best guess at realistic patterns. Worth reviewing for any gross mismatches.

---

**End of Stage 2 — Member Roster.**

Ready for review per Section 11 open items. After confirmation, Stage 3 (Closed deals — last 12 months) begins.
