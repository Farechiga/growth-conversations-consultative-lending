# Stage 3 — Closed Deals (Last 12 Months)

Synthetic closed-deal portfolio for Insight Engine dashboard. 100 closed deals over rolling 12-month window with full attribution back to originating conversations.

This stage produces the data that drives several drill-down views: conversion per pathway, handoff velocity, Sankey banker → specialist → closure flow. It also produces "conversations that became deals" attribution material, which is demo-gold for an EVP audience.

---

## Section 1 — Scale and shape

### 1.1 Total closed deal count

**100 closed deals over last 12 months.** Roughly 8-9 closures per month on average; some months heavier than others (seasonal).

### 1.2 Why 100

- Stage 2 portfolio has 220 active Members. A 12-month closure rate producing 100 deals implies roughly 30-40% annual conversion from active cultivation, which is plausible for credit union relationship banking
- 100 deals provides sufficient sample for statistically meaningful conversion-per-pathway comparison across 10 Tracks
- Provides ~5-10 deals per Track for the smaller Tracks; ~15-20 for the larger Tracks
- Sankey flow visualization needs sufficient closure volume to show meaningful banker → specialist → closure paths

### 1.3 Closures by month

Distribution over rolling 12-month window:

| Months ago | Closure count | Notes |
|---|---|---|
| 12 | 7 | Older end of window |
| 11 | 8 |  |
| 10 | 10 | Spring uptick |
| 9 | 12 | Late Q1 / early Q2 surge |
| 8 | 9 |  |
| 7 | 8 |  |
| 6 | 7 | Mid-year lull |
| 5 | 6 | Summer slow |
| 4 | 8 |  |
| 3 | 10 | Q4 prep season starts |
| 2 | 9 |  |
| 1 | 6 | Last 30 days; some still in closing |

Total: 100. Distribution skewed slightly toward earlier months (more time for deals to close); recent months show in-progress deals that haven't closed yet (those stay in active pipeline from Stage 2).

---

## Section 2 — Track distribution of closures

Conversion rates vary by Track. Some Tracks (smaller, simpler) close faster and more often; others (large CRE, SBA 504) close slower and less often per active Member.

### 2.1 Per-Track closure counts

| Track | Active pipeline (Stage 2) | Closed (12mo) | Conversion rate | Avg days Discover→Close |
|---|---|---|---|---|
| TRACK-001 Working Capital LOC | 22 | 0 | N/A | N/A — future-expansion product |
| TRACK-002 Business Vehicle Loan | 28 | 14 | 50% | 65 days |
| TRACK-003 CRE Term Loan | 36 | 16 | 44% | 145 days |
| TRACK-004 SBA 7(a) | 16 | 0 | N/A | N/A — future-expansion product |
| TRACK-006 Investment Property Loan | 18 | 9 | 50% | 110 days |
| TRACK-007 Equipment & Machinery | 32 | 20 | 63% | 75 days |
| TRACK-008 SBA 504 | 24 | 12 | 50% | 220 days |
| TRACK-009 PACE Loan | 6 | 4 | 67% | 95 days |
| TRACK-010 Business Visa Credit Card | 22 | 18 | 82% | 35 days |
| TRACK-011 Unsecured Loan | 16 | 7 | 44% | 50 days |

Total closures: 100.

Notes:
- Working Capital LOC (TRACK-001) and SBA 7(a) (TRACK-004) have **0 closures** — they're future-expansion products Blaze doesn't offer. Members on these Tracks are tracked but can't convert. This is the architectural feature, not a bug. Conversion-per-pathway visualization shows these as "0 conversions" with a clear "Blaze doesn't offer this product yet" annotation.
- Business Visa highest conversion rate (82%) and shortest cycle — small, fast products convert efficiently.
- SBA 504 longest cycle (220 days median) — multi-party transactions inherently slower.

### 2.2 Closure value distribution

Per-Track closure values match Stage 2 sizing distributions but skew toward median (deals at extreme ends of size range less likely to close):

| Track | Median closure | Range | Total closed value (12mo) |
|---|---|---|---|
| TRACK-002 Business Vehicle Loan | $135K | $40K - $380K | $1.9M |
| TRACK-003 CRE Term Loan | $1.4M | $300K - $4.5M | $22.4M |
| TRACK-006 Investment Property | $340K | $180K - $700K | $3.1M |
| TRACK-007 Equipment & Machinery | $215K | $60K - $750K | $4.3M |
| TRACK-008 SBA 504 | $3.2M | $1.2M - $7M | $38.4M |
| TRACK-009 PACE Loan | $165K | $50K - $400K | $660K |
| TRACK-010 Business Visa | $22K | $8K - $65K | $396K |
| TRACK-011 Unsecured Loan | $16K | $7K - $25K | $112K |

**Total closed value (12 months): approximately $71M.**

Hero metric option: "$71M closed in last 12 months" — strong EVP signal showing pipeline → outcomes.

---

## Section 3 — Banker attribution

Each closed deal attributed to one originating banker (the relationship banker who started the conversation). For specialty deals, additional attribution to specialist who closed.

### 3.1 Per-banker closure counts

Closures correlate with banker activity level (high-activity bankers close more) but also Member portfolio size:

| Banker | Active Members | Closed (12mo) | Closure rate |
|---|---|---|---|
| Scott Brynjolffson | 18 | 9 | 50% |
| Sarah Chen | 23 | 11 | 48% |
| Marcus Johansson | 25 | 12 | 48% |
| Linnea Petersen | 16 | 6 | 38% |
| David Nguyen | 21 | 10 | 48% |
| Rachel Goldman | 18 | 8 | 44% |
| Tom Olsson | 16 | 7 | 44% |
| Maria Reyes | 18 | 9 | 50% |
| James Patterson | 14 | 5 | 36% |
| Karin Lindgren | 12 | 5 | 42% |
| Abdirahman Hassan | 15 | 8 | 53% |
| Robert Anderson | 10 | 3 | 30% |
| Jennifer Vang | 14 | 5 | 36% |
| Diana Reyes | 12 | 6 | 50% |

**Total: 104 closures** (slight overshoot; pull back to exact 100 by trimming a few from highest counts).

### 3.2 Banker activity correlation

- **High-activity bankers:** average 50% closure rate; bigger pipelines close at higher rates
- **Medium-activity bankers:** average 42% closure rate
- **Low-activity banker (Robert Anderson):** 30% closure rate — slower, fewer deals, but tenured and respected

This produces meaningful banker activity heatmap differentiation without making any single banker look bad. Robert Anderson's lower rate reads as "tenured banker winding down" rather than "underperformer."

---

## Section 4 — Specialist coordination

Some closures involve specialist handoffs. The Sankey flow visualization needs this attribution.

### 4.1 Specialist types

Per current build:
- **SBA specialist** (James Patterson, Linnea Petersen) — handles SBA 504 and SBA 7(a) (when SBA 7(a) becomes a Blaze offering)
- **CRE specialist** (Sarah Chen, Rachel Goldman, Diana Reyes) — handles CRE Term Loan and complex Investment Property
- **Treasury specialist** (Karin Lindgren) — handles Treasury Services as adjacent to lending closures
- **CDC partner** (Diana Reyes for SBA 504) — Certified Development Company partner for SBA 504 second-lien piece

### 4.2 Specialist involvement by Track

| Track | Specialist involvement | Avg involvement timing |
|---|---|---|
| TRACK-002 Business Vehicle Loan | None | Direct relationship banker |
| TRACK-003 CRE Term Loan | CRE specialist (75% of closures) | Day 30-60 from Discover |
| TRACK-006 Investment Property | CRE specialist (40% of closures) | Day 45-90 |
| TRACK-007 Equipment & Machinery | None typically | Direct relationship banker |
| TRACK-008 SBA 504 | SBA specialist + CDC partner (100% of closures) | Day 20-45 SBA spec; Day 45-90 CDC |
| TRACK-009 PACE Loan | None typically | Direct relationship banker |
| TRACK-010 Business Visa | None | Direct relationship banker |
| TRACK-011 Unsecured Loan | None | Direct relationship banker |

### 4.3 Sankey flow data

The Sankey diagram visualizes flow from relationship banker → specialist → closure. Per-flow counts:

**Specialist-involved flows (12mo):**

| Originating banker | → Specialist | → Closures |
|---|---|---|
| Scott Brynjolffson | → James Patterson (SBA) | 4 SBA 504 closures |
| Scott Brynjolffson | → Sarah Chen (CRE) | 2 CRE closures |
| Marcus Johansson | → Sarah Chen (CRE) | 5 CRE closures |
| Marcus Johansson | → James Patterson (SBA) | 2 SBA 504 closures |
| David Nguyen | → Sarah Chen (CRE) | 4 CRE closures |
| Linnea Petersen | → James Patterson (SBA) | 3 SBA 504 closures |
| Sarah Chen | → CDC partner (Diana Reyes) | 3 SBA 504 closures (Sarah handles, Diana CDC role) |
| Rachel Goldman | → James Patterson (SBA) | 1 SBA 504 closure |
| Diana Reyes | → Sarah Chen (CRE consultation) | 2 CRE closures (outstate Members consulting MSP CRE) |
| Multiple direct (no specialist) | → Direct close | 70 closures (vehicle, equipment, visa, unsecured, PACE, some IP) |

Total: 100 closures across 30 specialist-involved + 70 direct.

---

## Section 5 — Handoff velocity data

For the handoff velocity drill-down view: time from Navigate phase entry to specialist closure.

### 5.1 Per-Track handoff velocity

| Track | Avg days Navigate → Close | Range | Notes |
|---|---|---|---|
| TRACK-008 SBA 504 | 75 days | 45-180 days | Multi-party, longest |
| TRACK-003 CRE Term Loan | 45 days | 20-95 days | CRE specialist + commercial credit |
| TRACK-006 Investment Property | 35 days | 18-70 days | Sometimes CRE specialist |
| TRACK-002 Business Vehicle Loan | 12 days | 5-30 days | Direct banker, fast |
| TRACK-007 Equipment & Machinery | 18 days | 7-40 days | Sometimes vendor coordination |
| TRACK-009 PACE Loan | 28 days | 14-60 days | PACE program coordination |
| TRACK-010 Business Visa | 5 days | 2-12 days | Fastest |
| TRACK-011 Unsecured Loan | 8 days | 3-20 days | Fast |

### 5.2 Handoff velocity by specialist

For SBA 504 specifically (the most specialist-heavy Track):

- Specialist introduction (Stage 2) typically Day 20-45 from Discover
- CDC partner introduction (Stage 3) typically Day 45-90
- Joint underwriting (Stages 4-5) typically Day 90-150
- Board + approvals (Stage 6) typically Day 150-180
- Closing (Stage 7) typically Day 180-220

For CRE deals:
- CRE specialist introduction typically Day 30-60
- Underwriting typically Day 45-90
- Closing typically Day 90-145

This data drives the handoff velocity heatmap showing where in the pipeline deals tend to slow down.

---

## Section 6 — Conversation history attribution

For the "conversations that became deals" demo-gold visualization, each closed deal attributes back to its originating conversation history.

### 6.1 Per-deal conversation count

How many captured Signals + FactorCaptures + Insights + Reactions accumulated across the Discover → Navigate journey:

| Track | Avg captures per closed deal | Range |
|---|---|---|
| TRACK-002 Business Vehicle | 8 captures | 5-14 |
| TRACK-003 CRE Term Loan | 18 captures | 12-32 |
| TRACK-006 Investment Property | 14 captures | 9-22 |
| TRACK-007 Equipment & Machinery | 11 captures | 7-18 |
| TRACK-008 SBA 504 | 24 captures | 16-40 |
| TRACK-009 PACE Loan | 12 captures | 8-18 |
| TRACK-010 Business Visa | 5 captures | 3-9 |
| TRACK-011 Unsecured Loan | 4 captures | 3-8 |

Higher-value, longer-cycle deals accumulate more captures (more conversations, more iterations). Smaller deals close on lighter capture density.

### 6.2 Insights authored per closed deal

| Track | Avg insights authored per deal | Notes |
|---|---|---|
| TRACK-008 SBA 504 | 6-8 insights | Heavy reframe + implication work |
| TRACK-003 CRE Term Loan | 5-7 insights |  |
| TRACK-006 Investment Property | 4-5 insights |  |
| TRACK-002 Business Vehicle | 3-4 insights |  |
| TRACK-007 Equipment & Machinery | 3-4 insights |  |
| TRACK-009 PACE Loan | 4-5 insights | Newer Track, more reframing needed |
| TRACK-010 Business Visa | 1-2 insights | Quick decisions |
| TRACK-011 Unsecured Loan | 1-2 insights | Quick decisions |

Total insights authored across 100 closed deals: approximately 350-450 insights tied to closures.

### 6.3 "Conversations that became deals" demo tile

For the dashboard view that closes the loop on capture-to-closure attribution:

A featured deal display shows:
- Member name (synthetic)
- Closure date and value (e.g., "Closed Mar 14 — $2.4M SBA 504")
- Closure timeline (e.g., "From first conversation to close: 187 days")
- Originating capture (e.g., "Trigger captured: 'we're going to need to expand within the next two quarters'")
- Key insights authored along the way (3-4 highlighted Reframes/Implications)
- Specialist coordination summary (e.g., "James Patterson (SBA) introduced Day 28; Diana Reyes (CDC) joined Day 67")

EVP gold: this view demonstrates the architecture's value. Capturing consultative conversations isn't just bureaucracy — it produces traceable revenue.

### 6.4 Featured deal selection

For demo, hand-curate 4-5 featured closed deals across different Tracks and Member-Types:

1. **SBA 504 deal** — Specialty manufacturer; $3.2M; 187 days; full James Patterson + Diana Reyes coordination
2. **CRE Term Loan** — Professional services firm; $1.6M; 124 days; Sarah Chen specialist
3. **Equipment & Machinery** — Maintenance services contractor; $245K; 68 days; direct banker
4. **Business Visa** — Retail boutique; $35K; 22 days; fast turnaround
5. **PACE Loan** — Specialty manufacturer; $185K; 89 days; energy improvement story

Each curated deal has fabricated detail sufficient for demo storytelling.

---

## Section 7 — Geographic distribution of closures

For the geographic segment view showing closures by branch:

### 7.1 Per-branch closure counts

| Branch tier | Branch count | Avg closures per branch | Total closures |
|---|---|---|---|
| Major (5 branches) | 5 | 9 | 45 |
| Regional (2 branches) | 2 | 7 | 14 |
| Standard MSP (15 branches) | 15 | 2.5 | 37 |
| Outstate (6 branches) | 6 | 0.7 | 4 |

Total: 100 closures.

Visual: closures cluster heavily in MSP metro with sparse outstate dots. Matches active pipeline distribution from Stage 2.

### 7.2 Branch closure efficiency

The geographic view can also show closure efficiency per branch (closure rate vs active pipeline). Branches with high efficiency:
- BRANCH-001 Minneapolis Downtown: 24 active → 11 closed = 46%
- BRANCH-005 Bloomington: 20 active → 11 closed = 55%
- BRANCH-013 Brooklyn Park: 8 active → 4 closed = 50%

Branches with lower efficiency:
- Outstate branches generally lower (smaller pipelines, slower cycles)
- Some Standard MSP suburbs lower (newer banker presence)

---

## Section 8 — Schema notes for synthetic data generator

When CC implements the data generator, Stage 3 produces:

```typescript
type ClosedDeal = {
  id: string;                          // DEAL-NNN
  
  // Attribution
  originating_member_name: string;     // Synthetic name
  member_type: MemberType;
  originating_banker_id: string;
  originating_branch_id: string;
  
  // Track + closure
  track_id: string;
  closure_value: number;               // Dollars
  closure_date: Date;
  
  // Cycle
  discover_date: Date;
  navigate_date: Date;
  days_discover_to_close: number;
  days_navigate_to_close: number;
  
  // Specialist coordination
  specialist_involved: boolean;
  specialist_banker_id?: string;       // FK to Banker
  specialist_introduction_day?: number;
  cdc_partner_involved?: boolean;      // SBA 504 only
  cdc_introduction_day?: number;
  
  // Conversation history attribution
  total_captures: number;
  insights_authored: number;
  
  // Featured flag (for demo storytelling)
  is_featured: boolean;
  featured_narrative?: string;         // Curated summary for "conversations that became deals" tile
};
```

Stage 3 produces:
- 100 ClosedDeal records
- 4-5 featured deals with detailed narratives
- Total: ~40KB of seed data

---

## Section 9 — Open items for review

**Decision needed:**

1. **Closure count: 100 acceptable?** Could expand to 120-150 for richer Sankey flows; could contract to 75 for cleaner visualization. 100 is a reasonable middle ground.

2. **Closed value display: $71M total.** Hero metric option: "$71M closed in last 12 months." Worth confirming this is the framing you want, or whether to suppress closed-value totals from hero metrics (avoid lending-quota framing the architecture explicitly avoids).

3. **Featured deals: 4-5 curated.** Confirm the 5 sketched in Section 6.4 work, or specify different mix.

4. **TRACK-001 and TRACK-004 zero closures.** These are future-expansion products. Section 2.1 shows them as 0 closures with annotation "Blaze doesn't offer this product yet." Worth confirming this framing — these Members count toward pipeline but can't convert. Conversion-per-pathway view shows them as "0 / N pathway exists when Blaze expands offerings."

5. **Banker closure attribution sensitivity.** Section 3.1 shows per-banker closure counts and rates. Robert Anderson's 30% rate is lowest (tenured winding down). Worth confirming this framing reads as nuanced rather than performance-comparison-style. EVP audiences sometimes pull single numbers out of context.

---

**End of Stage 3 — Closed Deals.**

Ready for review per Section 9 open items. After confirmation, Stage 4 (Temporal activity stream — 90 days of rolling captures, conversations, insights, phase progressions) begins.
