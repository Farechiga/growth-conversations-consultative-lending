# Stage 5 — Aggregate Metrics

Computed metrics derived from Stages 1-4 synthetic data. Final stage before Sprint 7 dashboard prompt.

This stage specifies the aggregate calculations that drive the hero metrics strip and the headline numbers within each drill-down view. Stage 5 is mostly arithmetic on prior stages — its purpose is to lock the specific computation logic and presentation framings before CC implements the data generator.

---

## Section 1 — Hero metrics strip

Six numbers always visible at top of dashboard. EVP sees these in first 3 seconds.

### 1.1 Hero metric specifications

| # | Metric | Value | Display | Computation |
|---|---|---|---|---|
| 1 | Pipeline value | $142M | "$142M active pipeline" | Sum of `sized_opportunity_amount` across all 220 active Members |
| 2 | Members in cultivation | 220 | "220 Members in cultivation" | Count of active Members from Stage 2 |
| 3 | Conversations this week | 68 | "68 conversations this week" | Sum of capture events Mon-Fri current week from Stage 4 |
| 4 | Insights authored this week | 51 | "51 insights authored this week" | Sum of insights authored Mon-Fri current week from Stage 4 |
| 5 | Avg Discover → Navigate | 87 days | "87 days avg Discover → Navigate" | Mean days for Members who progressed all phases over last 90 days |
| 6 | Closed last 12 months | $71M | "$71M closed last 12 months" | Sum of `closure_value` across 100 deals from Stage 3 |

### 1.2 Metric framing decisions

**Pipeline value at face value vs weighted.**
- Face value: $142M (all sized opportunities summed)
- Weighted: $48M (phase-progression weighted: Discover 10%, Measure 35%, Consult 60%, Navigate 85%)
- Display: Face value as primary hero number. "Toggle to weighted view" affordance reveals $48M with explanation tooltip.

**Members in cultivation excludes closed deals.**
The 220 Members are all active. The 100 closed deals from Stage 3 are separately attributed Members who already converted. Hero metric tracks active pipeline, not all-time relationships.

**Conversations this week is a current-week count.**
"This week" = Mon-current day of current week. Display sparkline below number showing trend across last 12 weeks (rolling weekly aggregates).

**Insights authored this week parallels conversations.**
Same framing — current week count + 12-week sparkline trend.

**Avg Discover → Navigate excludes Members still in flight.**
Computed from Members who *completed* the Discover → Navigate journey within last 90 days. Members still in earlier phases don't bias the average upward.

**Closed last 12 months has a separate sparkline.**
Monthly closure counts across 12 months. Demonstrates closure velocity over time.

### 1.3 Sparkline embedded in hero metrics

For metrics 3, 4, and 6 (conversations, insights, closures), small sparkline trend below the headline number:

- **Conversations sparkline:** 12 weeks of weekly capture totals
- **Insights sparkline:** 12 weeks of weekly insights authored
- **Closures sparkline:** 12 months of monthly closure counts

Sparklines reinforce "trending up" signal from Stage 4's +15% acceleration.

### 1.4 Hero metric responsiveness

When EVP clicks a filter tag, hero metrics update to reflect the filtered view.

Example: click "TRACK-008 SBA 504" filter →
- Pipeline value: $72M (24 SBA 504 Members × $3M median)
- Members in cultivation: 24
- Conversations this week: ~10 (proportional to SBA 504 share)
- Insights authored this week: ~6
- Avg Discover → Navigate: 162 days (slower for SBA 504)
- Closed last 12 months: $38.4M

Hero metrics always visible regardless of which drill-down is active.

---

## Section 2 — Phase funnel metrics

For the phase funnel drill-down view.

### 2.1 Funnel counts (current snapshot)

| Phase | Members | Share | Avg days in phase |
|---|---|---|---|
| Discover | 88 | 40% | 20 (median) |
| Measure | 66 | 30% | 28 (median) |
| Consult | 38 | 17% | 35 (median) |
| Navigate | 28 | 13% | 60 (median) |

Plus closed transitions: 100 deals closed over 12 months (Stage 3), giving sense of throughput.

### 2.2 Flow rates (90-day rolling)

| Transition | Members moved (90 days) | Daily rate | Bottleneck indicator |
|---|---|---|---|
| Discover → Measure | 108 | 1.2/day | Lowest friction |
| Measure → Consult | 72 | 0.8/day | Mid-friction |
| Consult → Navigate | 45 | 0.5/day | Highest friction |
| Navigate → Closed | 100 | 1.1/day | Closing throughput |

Visualization: funnel shape with arrow widths proportional to flow rates. Wider arrows for high-throughput transitions; narrower for bottlenecks.

### 2.3 Funnel by Track filter

Per-Track funnel shapes vary significantly:

**TRACK-008 SBA 504 funnel:**
- Discover: 8 Members
- Measure: 6 Members
- Consult: 5 Members
- Navigate: 5 Members
- Closed (12mo): 12 deals
- Funnel shape: nearly straight (high stickiness once in pipeline)

**TRACK-010 Business Visa funnel:**
- Discover: 8 Members
- Measure: 6 Members
- Consult: 4 Members
- Navigate: 4 Members
- Closed (12mo): 18 deals
- Funnel shape: steep cone (faster flow-through)

**TRACK-001 Working Capital LOC funnel:**
- Discover: 12 Members
- Measure: 6 Members
- Consult: 3 Members
- Navigate: 1 Member
- Closed (12mo): 0 (future-expansion)
- Funnel shape: pipeline exists but converts to nothing — visible "trapped" in Navigate

### 2.4 Average phase progression sparkline

Daily phase-progression counts over 90 days produce momentum sparkline below funnel. Shows whether pipeline is accelerating or decelerating.

---

## Section 3 — Lending product mix metrics

For the lending product mix drill-down view.

### 3.1 Pipeline by Track

Treemap or stacked bar visualization per:

| Track | Members | Pipeline value | Share |
|---|---|---|---|
| TRACK-008 SBA 504 | 24 | $72M | 51% |
| TRACK-003 CRE Term Loan | 36 | $43.2M | 30% |
| TRACK-007 Equipment & Machinery | 32 | $6.4M | 5% |
| TRACK-006 Investment Property | 18 | $5.85M | 4% |
| TRACK-002 Business Vehicle Loan | 28 | $3.5M | 2% |
| TRACK-004 SBA 7(a) | 16 | $8M | 6% |
| TRACK-001 Working Capital LOC | 22 | $1.65M | 1% |
| TRACK-009 PACE Loan | 6 | $900K | 0.6% |
| TRACK-010 Business Visa | 22 | $440K | 0.3% |
| TRACK-011 Unsecured Loan | 16 | $240K | 0.2% |

**Total: $142M across 220 Members.**

Visualization weighted by pipeline value (not Member count) shows where the dollars sit. SBA 504 + CRE = 81% of pipeline value despite being 27% of Members.

### 3.2 Blaze active vs future-expansion split

Prominently displayed:
- **Blaze active offerings:** 182 Members (83%), $132.6M pipeline value (93%)
- **Future-expansion products:** 38 Members (17%), $9.65M pipeline value (7%)

Visual: stacked bar showing the split. Demonstrates pipeline value Blaze captures even on products it doesn't yet offer.

### 3.3 Track stickiness metric

For each Track, "stickiness" = share of Members who reach Navigate without dropping out:

| Track | Stickiness | Notes |
|---|---|---|
| TRACK-008 SBA 504 | 92% | Nearly all SBA 504 Members reach Navigate |
| TRACK-003 CRE Term Loan | 84% |  |
| TRACK-006 Investment Property | 78% |  |
| TRACK-007 Equipment & Machinery | 75% |  |
| TRACK-002 Business Vehicle Loan | 72% |  |
| TRACK-009 PACE Loan | 67% |  |
| TRACK-010 Business Visa | 64% | Smaller decisions, more drop-out |
| TRACK-011 Unsecured Loan | 60% | Often abandoned for other products |
| TRACK-001 Working Capital LOC | 75% | But never closes (future-expansion) |
| TRACK-004 SBA 7(a) | 70% | But never closes (future-expansion) |

High-value Tracks have highest stickiness — Members invested in those decisions don't easily abandon them.

---

## Section 4 — Member-Type × Lending product matrix metrics

For the matrix drill-down view (heatmap).

### 4.1 Cell values

Per Stage 2 Section 4.3 distribution. Cell value = active Member count for that Member-Type × Track combination.

Hot cells (highest density):
- maintenance_services × TRACK-002 Business Vehicle Loan: 12 Members
- maintenance_services × TRACK-007 Equipment & Machinery: 9 Members
- specialty_manufacturer × TRACK-008 SBA 504: 9 Members
- construction × TRACK-002 Business Vehicle Loan: 9 Members
- professional_services × TRACK-003 CRE Term Loan: 8 Members
- food_services × TRACK-007 Equipment & Machinery: 7 Members

Cold cells (zero or near-zero):
- specialty_manufacturer × TRACK-002 Business Vehicle Loan: 0 Members
- event_services × TRACK-008 SBA 504: 0 Members
- specialty_manufacturer × TRACK-011 Unsecured Loan: 0 Members
- specialty_manufacturer × TRACK-006 Investment Property: 0 Members

### 4.2 Heatmap color scale

- Cell with 0 Members: white/empty
- 1-2 Members: lightest color
- 3-5 Members: medium-light
- 6-9 Members: medium
- 10+ Members: darkest (signals concentration)

### 4.3 Cell drill-down

Click a heatmap cell → drills to the specific Member-Type × Track combination. Shows:
- Member list with names, current phase, sized opportunity, banker
- Avg pipeline cycle time for that combination
- Current closure rate
- Recent Insights authored related to this combination

---

## Section 5 — Conversion-per-pathway metrics

For the conversion-per-pathway drill-down view.

### 5.1 Per-Track conversion rate

Computed: closed deals (12mo) / (active Members + closed Members) × 100.

| Track | Active | Closed (12mo) | Total funnel | Conversion rate |
|---|---|---|---|---|
| TRACK-002 Business Vehicle | 28 | 14 | 42 | 33% |
| TRACK-003 CRE Term Loan | 36 | 16 | 52 | 31% |
| TRACK-006 Investment Property | 18 | 9 | 27 | 33% |
| TRACK-007 Equipment & Machinery | 32 | 20 | 52 | 38% |
| TRACK-008 SBA 504 | 24 | 12 | 36 | 33% |
| TRACK-009 PACE Loan | 6 | 4 | 10 | 40% |
| TRACK-010 Business Visa | 22 | 18 | 40 | 45% |
| TRACK-011 Unsecured Loan | 16 | 7 | 23 | 30% |
| TRACK-001 Working Capital LOC | 22 | 0 | 22 | 0% (future-expansion) |
| TRACK-004 SBA 7(a) | 16 | 0 | 16 | 0% (future-expansion) |

Conversion rate display annotates future-expansion Tracks with "Pathway exists; Blaze doesn't offer this product yet."

### 5.2 Conversion velocity

For closed Tracks, average days from Discover to closure:

| Track | Avg days | Range |
|---|---|---|
| TRACK-010 Business Visa | 35 | 18-72 |
| TRACK-011 Unsecured Loan | 50 | 25-95 |
| TRACK-002 Business Vehicle | 65 | 35-130 |
| TRACK-007 Equipment & Machinery | 75 | 40-145 |
| TRACK-009 PACE Loan | 95 | 55-180 |
| TRACK-006 Investment Property | 110 | 60-200 |
| TRACK-003 CRE Term Loan | 145 | 75-280 |
| TRACK-008 SBA 504 | 220 | 130-380 |

### 5.3 Conversion path visualization

Per Track, breakdown of where drop-offs happen:

For TRACK-008 SBA 504 (slowest, most specialist-heavy):
- Discover entries (90 days): ~10 Members
- Measure conversions: 7 (70%)
- Consult conversions: 6 (86% of Measure)
- Navigate conversions: 5 (83% of Consult)
- Closures: 5 (100% of Navigate that progress to closing)
- Net Discover → Closed: 50%

For TRACK-010 Business Visa (fastest, high-volume):
- Discover entries (90 days): ~12 Members
- Measure conversions: 9 (75%)
- Consult conversions: 7 (78%)
- Navigate conversions: 6 (86%)
- Closures: 6 (100%)
- Net Discover → Closed: 50%

Both end at ~50% net conversion despite very different cycle times. This is realistic.

---

## Section 6 — Handoff velocity metrics

For the handoff velocity drill-down view.

### 6.1 Per-Track handoff stats

| Track | Avg Navigate → Close | Specialist coordination cycle |
|---|---|---|
| TRACK-010 Business Visa | 5 days | None |
| TRACK-011 Unsecured Loan | 8 days | None |
| TRACK-002 Business Vehicle Loan | 12 days | None |
| TRACK-007 Equipment & Machinery | 18 days | Sometimes vendor coordination (~5 days extra) |
| TRACK-009 PACE Loan | 28 days | PACE program coordination (~10 days) |
| TRACK-006 Investment Property | 35 days | Sometimes CRE specialist (~12 days extra) |
| TRACK-003 CRE Term Loan | 45 days | CRE specialist + commercial credit (~25 days handoff) |
| TRACK-008 SBA 504 | 75 days | SBA specialist + CDC partner (~50 days handoff) |

### 6.2 Specialist team performance

| Specialist team | Avg engagement days | Throughput (deals/year) |
|---|---|---|
| CRE specialist team (Sarah, Rachel, Diana) | 45 days avg | 16 CRE deals + cross-Track support |
| SBA specialist team (James, Linnea) | 75 days avg | 12 SBA 504 deals annually |
| Treasury specialist (Karin) | 30 days avg | 5 Treasury-adjacent deals |

### 6.3 Handoff bottleneck identification

Days where deals get stuck:

| Bottleneck stage | Avg days stuck | Frequency |
|---|---|---|
| Specialist introduction → Joint review | 18 days | 30% of specialist-involved deals |
| CDC onboarding (SBA 504) | 22 days | 80% of SBA 504 deals |
| Underwriting review | 14 days | All specialist deals |
| Board approval | 12 days | 60% of deals over $1M |
| Closing coordination | 10 days | All deals |

Visualization: stacked horizontal bar showing average time per stage, with color-coding for stages where deals tend to stall.

---

## Section 7 — Sankey banker → specialist → closure flow

For the Sankey diagram drill-down view.

### 7.1 Flow data

Per Stage 3 Section 4.3, mapping flows:

**Originating banker side (left):**
- Scott Brynjolffson: 9 closures (4 to James Patterson SBA, 2 to Sarah Chen CRE, 3 direct)
- Marcus Johansson: 12 closures (5 to Sarah Chen CRE, 2 to James Patterson SBA, 5 direct)
- Sarah Chen: 11 closures (8 own CRE, 3 to Diana Reyes CDC for SBA 504)
- David Nguyen: 10 closures (4 to Sarah Chen CRE, 6 direct)
- Linnea Petersen: 6 closures (3 to James Patterson SBA, 3 direct)
- Other bankers: 52 closures distributed across direct and minor specialist flows

**Specialist side (middle):**
- James Patterson: 10 SBA 504 closures
- Sarah Chen: 11 CRE closures
- Rachel Goldman: 8 CRE closures
- Diana Reyes (CDC): 3 SBA 504 closures (she's also a banker; here in CDC role)
- Karin Lindgren: 5 Treasury-adjacent closures
- Direct (no specialist): 70 closures

**Closure side (right):**
Bucketed by Track type and value:
- High-value (>$1M): 23 closures, $61M total
- Mid-value ($100K-$1M): 47 closures, $9.4M total
- Low-value (<$100K): 30 closures, $880K total

### 7.2 Sankey rendering specs

- Flow width proportional to flow count (not value, to avoid over-emphasizing single high-value deals)
- Color flows by Track category (SBA flows one color; CRE flows another; direct flows muted)
- Hover flow → highlights specific banker/specialist/Track combination with deal count and total value
- Click flow → drills to the specific deals within that flow

---

## Section 8 — Geographic segment metrics

For the geographic segment drill-down view.

### 8.1 Per-branch metrics

For each of 28 branches:

**Active pipeline:**
- Member count
- Pipeline value ($M)
- Avg pipeline value per Member
- Banker count covering branch

**Closure history (12 months):**
- Closed deal count
- Closed value ($M)
- Conversion rate (closures / total funnel)

**Activity:**
- Avg events/day (per Stage 4)
- Insights authored last 30 days
- Recent acceleration trend

### 8.2 Top 5 branches by pipeline value

| Rank | Branch | Members | Pipeline value | Closed (12mo) |
|---|---|---|---|---|
| 1 | Minneapolis Downtown | 24 | $24M | $14M |
| 2 | Edina | 22 | $22M | $11M |
| 3 | St. Paul Downtown | 24 | $19M | $11M |
| 4 | Bloomington | 20 | $14M | $8M |
| 5 | Maple Grove | 16 | $11M | $6M |

### 8.3 Map rendering

Geographic map with markers per branch:
- Marker size proportional to active pipeline value
- Marker color indicates conversion rate (green = high, yellow = medium, red-orange = low)
- Click marker → branch detail panel showing all metrics
- Hover marker → tooltip with summary

Map centered on MSP with view extending to outstate branches.

---

## Section 9 — Banker activity heatmap metrics

For the banker activity heatmap drill-down view.

### 9.1 Heatmap dimensions

14 bankers × 90 days = 1,260 cells. Each cell = capture event count for that banker on that day.

### 9.2 Cell value scale

- 0 events: empty cell (banker not active that day, vacation, weekend)
- 1-3 events: light tint
- 4-6 events: medium tint
- 7-9 events: medium-dark
- 10+ events: darkest (peak activity)

### 9.3 Banker rows ordered by total activity

Most active at top, least active at bottom:
1. Sarah Chen
2. Marcus Johansson
3. Scott Brynjolffson
4. David Nguyen
5. Maria Reyes
6. Abdirahman Hassan
7. Diana Reyes
8. James Patterson
9. Linnea Petersen
10. Rachel Goldman
11. Tom Olsson
12. Karin Lindgren
13. Jennifer Vang
14. Robert Anderson

### 9.4 Per-banker drill-down

Click a banker row → drills to that banker's portfolio:
- Total active Members
- Pipeline value
- Closed deals last 12 months
- Top Tracks they cultivate
- Most-recent insights authored
- Activity sparkline (90-day capture trend)

---

## Section 10 — Insight authorship pipeline metrics

For the insight authorship pipeline drill-down view (architecture-differentiating visualization).

### 10.1 Authoring volume

- 90-day total: 900 insights authored
- 30-day total: 360 insights (peak)
- Weekly average: 70 insights
- Per-banker: ~64 insights/banker over 90 days

### 10.2 Matched-vs-novel breakdown

Per Stage 4 Section 4.2:
- Total matched: 660 (73% across 90 days)
- Total novel: 240 (27% across 90 days)
- Trend: matched share growing 68% → 78% over 90 days

### 10.3 Top patterns matched

| Pattern | Matches (90d) | Track context | Bankers |
|---|---|---|---|
| PATTERN-006 seasonal_cashflow_gap reframe | 64 | TRACK-001 | 8 different bankers |
| PATTERN-010 capacity_limit reframe | 52 | TRACK-002, 007 | 11 different bankers |
| PATTERN-017 real_estate_constraint reframe | 41 | TRACK-003, 008 | 9 different bankers |
| PATTERN-019 customer_growth_announcement reframe | 38 | TRACK-008, 003 | 7 different bankers |
| PATTERN-011 capacity_limit implication | 35 | TRACK-002, 007 | 10 different bankers |
| PATTERN-012 aging_equipment reframe | 33 | TRACK-002, 007 | 8 different bankers |
| PATTERN-005 seasonal_cashflow implication | 31 | TRACK-001 | 7 different bankers |
| PATTERN-022 co_decision_maker_input reframe | 28 | TRACK-008, 003 | 6 different bankers |
| PATTERN-018 real_estate_implication | 26 | TRACK-003, 008 | 7 different bankers |
| PATTERN-013 equipment_breakdown implication | 24 | TRACK-002, 007 | 6 different bankers |

Patterns matching across multiple bankers signal "common consultative ground" — patterns the architecture surfaces consistently regardless of which banker is in conversation. Demo signal: the architecture produces consistency across the team.

### 10.4 Senior-lender review queue

- Novel insights pending review: 8 currently
- Avg review turnaround: 8 days
- Promotion rate: 5-6% of novel insights become canonical (12-15 over 90 days)
- Library growth: 49 → 53 Patterns over 90 days (4 promoted)

### 10.5 Authoring trend visualization

Daily authoring count over 90 days produces line chart with two stacked colors (matched vs novel). Visual shows:
- Overall volume rising over 90 days
- Matched share rising faster than novel
- "System learning" signal

---

## Section 11 — Temporal momentum metrics

For the temporal momentum drill-down view.

### 11.1 Time-series metrics

Daily counts of:
- Total capture events
- Insights authored
- Phase progressions
- Closed deals (Stage 3)

Each renders as line chart over 90-day window. Together they show pipeline pulse.

### 11.2 Featured event annotations

Per Stage 4 Section 6:

- Day 12 ago: Major Insight Authoring Day (28 insights — visible spike on chart)
- Day 28 ago: Pattern Library Update (49 → 53 Patterns)
- Day 35 ago: Stage-skip Catch (2 Members backfilled)
- Day 45 ago: First SBA 504 Close ($4.2M)
- Day 8 ago: Maximum Activity Day (89 events)

Annotations appear as labeled markers on temporal momentum chart. Click annotation → expanded narrative.

### 11.3 Time-window comparisons

EVP can compare:
- This week vs last week (sparkline-style)
- Last 30 days vs prior 30 days
- Last 30 days vs same period 12 months ago (year-over-year)

The +15% acceleration signal appears explicitly in these comparisons.

---

## Section 12 — Business type view metrics

For the Member-Type filter view (added per Francisco's earlier request).

### 12.1 Per-Member-Type metrics

| Member-Type | Members | Pipeline value | Closed (12mo) | Top Track |
|---|---|---|---|---|
| event_services | 24 | $4.5M | 0 (TRACK-001 future) + $440K (Visa) | TRACK-001 LOC |
| maintenance_services | 36 | $9.2M | $4.6M (Vehicle, Equipment) | TRACK-002 Vehicle |
| specialty_manufacturer | 20 | $34.5M | $19M (SBA 504, CRE) | TRACK-008 SBA 504 |
| professional_services | 28 | $14.8M | $7.2M (CRE, Investment Property) | TRACK-003 CRE |
| healthcare_services | 22 | $19.3M | $9.8M (CRE, SBA 504, Equipment) | TRACK-003 CRE |
| food_services | 26 | $12.7M | $5.8M (Equipment, CRE, Visa) | TRACK-007 Equipment |
| retail | 24 | $11.4M | $4.5M (CRE, Visa) | TRACK-003 CRE |
| construction | 20 | $8.6M | $4.2M (Vehicle, Equipment, SBA 7(a)) | TRACK-002 Vehicle |

Heaviest pipeline value: specialty_manufacturer (24% of total $142M) and healthcare_services (14%).

### 12.2 Member-Type drill-down

Click a Member-Type filter → main canvas shows:
- Funnel view filtered to that Member-Type
- Top Tracks they pursue
- Avg pipeline cycle time
- Top insights authored related to that Member-Type
- Top patterns surfacing
- Banker portfolio distribution

---

## Section 13 — "Conversations that became deals" demo gold tile

For the dashboard view that closes the loop on capture-to-closure attribution.

### 13.1 Tile rendering

Featured deal display (cycles through 5 curated deals):

**Deal 1 — Cygnus-style SBA 504 close:**
- "Closed Mar 14 — $3.2M SBA 504"
- "From first conversation to close: 187 days"
- Originating capture: "Trigger: 'we're at about 85% capacity utilization. Three of our anchor customers are signaling 15-25% volume growth over the next eighteen months.'"
- Key insights: "Owner-occupancy reframe" / "Capacity-as-decision implication" / "Board engagement reframe"
- Specialist coordination: "James Patterson (SBA) introduced Day 28; Diana Reyes (CDC) joined Day 67"
- Banker: Marcus Johansson

**Deal 2 — CRE Term Loan close:**
- "Closed Feb 8 — $1.6M CRE Term Loan"
- "From first conversation to close: 124 days"
- Originating: "Goal: 'We need a permanent home for the firm — we've been leasing for 12 years and the rent keeps escalating.'"
- Key insights: 5 reframes/implications across cycle
- Specialist: Sarah Chen
- Banker: David Nguyen

**Deal 3 — Equipment & Machinery close:**
- "Closed Apr 12 — $245K Equipment & Machinery"
- "From first conversation to close: 68 days"
- Originating: Capture from Northland-style maintenance services Member
- Key insights: Capacity reframe + Aging equipment reframe
- Specialist: None (direct banker close)
- Banker: Maria Reyes

**Deal 4 — Business Visa close:**
- "Closed Apr 28 — $35K Business Visa"
- "From first conversation to close: 22 days"
- Originating: Retail boutique Member
- Key insights: 1-2 brief observations
- Specialist: None
- Banker: Sarah Chen

**Deal 5 — PACE Loan close:**
- "Closed Mar 22 — $185K PACE Loan"
- "From first conversation to close: 89 days"
- Originating: Specialty manufacturer energy improvement
- Key insights: Energy ROI reframe
- Specialist: PACE program coordinator
- Banker: Linnea Petersen

### 13.2 Tile interaction

- Auto-rotates through 5 featured deals every 30 seconds
- Click "Pause" to inspect specific deal
- Click "Next" / "Previous" to navigate
- Click any deal → full attribution view (entire conversation history with timestamps)

---

## Section 14 — Open thread aging metrics (Coverage drill-down)

For the open thread aging cohort view.

### 14.1 Current open thread state

| Cohort | Count | Share |
|---|---|---|
| 0-30 days old | 45 | 58% |
| 30-60 days old | 18 | 23% |
| 60-90 days old | 7 | 9% |
| 90+ days old | 8 | 10% |

Total open threads: 78.

### 14.2 Resolution metrics

- Avg time to resolution: 22 days
- Resolution rate: 80% (of open threads, 80% eventually capture a Reaction)
- Indecision-becomes-permanent rate: 20% (open threads that don't resolve become Indecision tags)

### 14.3 Open thread by Track

Distribution shows where indecision concentrates:
- TRACK-008 SBA 504: 18 open threads (longest cycle, more accumulated indecision)
- TRACK-003 CRE Term Loan: 22 open threads
- TRACK-007 Equipment & Machinery: 14 open threads
- Other Tracks: 24 distributed

### 14.4 Senior-lender intervention queue

90+ day cohort (8 currently) signals where senior lender may need to intervene with banker on stuck conversations. Worth a focused list, not a vague aggregate.

---

## Section 15 — Stage-skip portfolio metrics (Stage-skip drill-down)

For the Members who skipped earlier work view.

### 15.1 Current stage-skip state

5-8 Members currently flagged stage-skipping (3-4% of 220 Members):

- Riverside Catering (existing fixture; event_services on TRACK-001; Consult-phase Model without Discover)
- 4-7 additional Members across various Member-Types and Tracks demonstrating different stage-skip patterns

### 15.2 Stage-skip patterns

| Pattern | Description | Frequency |
|---|---|---|
| Banker-driven artifact-first | Banker built model before formal Discover; banker-led conversation | 45% |
| Member-driven late entry | Member came in already at decision point; banker reverse-engineered Discover | 30% |
| Cross-Track migration | Member moved from one Track to another mid-cycle; old Discover not refreshed | 15% |
| Re-engagement | Member returned after long absence; banker resumed mid-pipeline | 10% |

### 15.3 Stage-skip resolution

- Avg days to backfill missing Discover evidence: 14 days
- Resolution rate: 90% (most stage-skip flags get resolved within 30 days)
- Permanent skips: 10% (stay flagged because Member already too far along to backfill)

---

## Section 16 — Drill-down view inventory (final)

Master list of 10 drill-down views accessible via filter tags + 1 always-visible hero strip:

| Filter tag | Drill-down view | Section |
|---|---|---|
| (always visible) | Hero metrics strip | 1 |
| Phase funnel | Phase funnel + flow rates | 2 |
| Lending product mix | Lending product mix treemap | 3 |
| Member-Type matrix | Member-Type × Track heatmap | 4 |
| Conversion per pathway | Conversion-per-pathway funnel | 5 |
| Handoff velocity | Handoff velocity bottlenecks | 6 |
| Sankey flow | Banker → specialist → closure | 7 |
| Geographic | Branch map view | 8 |
| Banker activity | Banker × day heatmap | 9 |
| Insight authorship | Insight authorship pipeline | 10 |
| Temporal momentum | 90-day temporal trends | 11 |
| Business type | Member-Type filter view | 12 |
| (always-visible card) | "Conversations that became deals" tile | 13 |

13 views total (10 filter-driven drill-downs + 1 hero strip + 1 demo-gold tile + 1 always-on Coverage indicator).

For Sprint 7 dashboard scope: this matches the master list locked earlier in conversation.

---

## Section 17 — Schema notes for synthetic data generator

When CC implements the data generator, Stage 5 produces aggregate calculations from Stages 1-4 raw data:

```typescript
type AggregateMetrics = {
  // Hero metrics (current state)
  pipeline_value_face: number;
  pipeline_value_weighted: number;
  members_in_cultivation: number;
  conversations_this_week: number;
  insights_this_week: number;
  avg_discover_to_navigate_days: number;
  closed_value_12mo: number;
  
  // Sparklines (12 weeks of weekly aggregates)
  conversations_sparkline: number[];
  insights_sparkline: number[];
  closures_sparkline: number[];  // 12 months of monthly counts
  
  // Funnel state
  funnel_counts: Record<Phase, number>;
  funnel_flow_rates: Record<PhaseTransition, number>;
  
  // Per-Track aggregates
  track_metrics: Record<TrackId, TrackMetrics>;
  
  // Per-banker aggregates
  banker_metrics: Record<BankerId, BankerMetrics>;
  
  // Per-branch aggregates
  branch_metrics: Record<BranchId, BranchMetrics>;
  
  // Per-Member-Type aggregates
  member_type_metrics: Record<MemberType, MemberTypeMetrics>;
  
  // Pattern matching state
  top_patterns: Array<{ pattern_id: string; match_count: number; banker_count: number }>;
  
  // Featured content
  featured_deals: FeaturedDeal[];
  featured_temporal_events: FeaturedTemporalEvent[];
};
```

Stage 5 produces:
- 1 AggregateMetrics record (computed at data-generator runtime)
- All metrics derived from Stages 1-4 data
- Total: ~15KB of computed data

---

## Section 18 — Open items for review

**Decision needed:**

1. **Hero metrics: 6 confirmed (pipeline value, members in cultivation, conversations this week, insights this week, avg Discover→Navigate, closed last 12 months)?** Or modify count/composition?

2. **Pipeline value framing.** Face value ($142M) as primary with weighted ($48M) as toggle. Confirm or invert.

3. **Sparkline embedding in hero metrics.** Sparklines below hero numbers add visual richness but consume vertical space. Confirm yes/no.

4. **Drill-down view count.** 13 views total. Sprint 7 prompt will scope rendering complexity per view. Worth confirming all 13 are in scope or whether to descope (e.g., defer Insight authorship pipeline + Stage-skip + Coverage to Sprint 7b).

5. **"Conversations that became deals" tile placement.** Always-on featured card next to hero metrics, or accessible via a separate filter tag? Always-on is more demo-impactful.

6. **Filter tag UI.** Click to highlight + activate; click again to deactivate. Multiple tags activatable simultaneously (e.g., "TRACK-008 SBA 504" + "specialty_manufacturer" filters to specialty manufacturer SBA 504 deals)? Or single-tag-only mode for simplicity?

---

**End of Stage 5 — Aggregate Metrics.**

Ready for review per Section 18 open items. After confirmation, we proceed to Sprint 7 dashboard prompt for CC.
