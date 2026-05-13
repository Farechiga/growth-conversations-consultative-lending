# Stage 4 — Temporal Activity Stream (90 Days Rolling)

Synthetic temporal data for Insight Engine dashboard. 90 days of rolling daily activity across all 14 bankers and 220 Members.

This stage drives several drill-down views: temporal momentum (captures/conversations/insights over time), banker activity heatmap (banker-by-day capture density), insight authorship pipeline (matched-vs-novel ratio over time), and phase progression visualization (Members moving through phases day-by-day).

---

## Section 1 — Activity types tracked daily

For each of 90 days, the temporal stream records aggregated counts by:

### 1.1 Capture activity

- **FactorCaptures created** (quantitative business factor captures via + Quantify)
- **Signals created** (qualitative captures via + Ask: Goals, Blockers, Indecisions, Triggers)
- **Insights authored** (banker observations via + Insight)
- **Reactions captured** (Member responses to artifacts via + Reaction)
- **Models captured** (artifacts produced via + Model)
- **Actions logged** (committed next steps via + Action)
- **ShowEvents** (banker showed Member an artifact)

### 1.2 Phase progression activity

- **Members moving Discover → Measure** (per day)
- **Members moving Measure → Consult**
- **Members moving Consult → Navigate**
- **Members closing** (Navigate → closed deal; from Stage 3)

### 1.3 Insight authorship dimensions

For insights authored each day, additional attributes:
- **Matched vs novel split** (matched against canonical Pattern, or sent to senior-lender review)
- **Pattern matched** (which canonical Pattern, when matched)
- **Authoring banker** (which of 14 bankers)
- **Track context** (which lending product the insight relates to)

### 1.4 Banker-level granularity

All daily counts also broken out per-banker for the activity heatmap.

---

## Section 2 — Daily activity volume baselines

Baseline daily volumes producing realistic pipeline activity:

### 2.1 Average daily totals

| Activity type | Avg per day | Range | Weekly total |
|---|---|---|---|
| FactorCaptures | 18 | 8-32 | 90/week |
| Signals | 14 | 6-26 | 70/week |
| Insights authored | 10 | 4-22 | 50/week |
| Reactions | 6 | 2-12 | 30/week |
| Models | 4 | 1-9 | 20/week |
| Actions logged | 8 | 3-16 | 40/week |
| ShowEvents | 5 | 1-10 | 25/week |

**Total daily activity events: ~65 events.**

Across 14 bankers averaging 220 Members in cultivation, roughly 4-5 capture events per banker per day on average. Realistic for active relationship banking.

### 2.2 Day-of-week patterns

Activity weighted by day:

| Day | Activity multiplier | Notes |
|---|---|---|
| Monday | 1.2× | Strong start; planning + outreach |
| Tuesday | 1.3× | Peak activity day |
| Wednesday | 1.1× |  |
| Thursday | 1.0× | Average |
| Friday | 0.7× | Lighter; closure-pushing on key deals |
| Saturday | 0.2× | Minimal; some bankers do weekend reviews |
| Sunday | 0.1× | Very minimal |

This produces realistic activity heatmap with clear weekly rhythm.

### 2.3 Recent acceleration (demo signal)

Last 30 days show ~15% lift in activity vs prior 60 days. This produces "trending up" signal in temporal momentum view — important for EVP demo positioning ("the architecture is accelerating, not flatlining").

Specifically:
- Days 1-30 ago: avg 65 events/day baseline
- Days 31-60 ago: avg 56 events/day
- Days 61-90 ago: avg 52 events/day

Visible upward trend across rolling 90-day window.

---

## Section 3 — Banker activity differentiation

The banker activity heatmap renders all 14 bankers × 90 days = 1,260 cells. Differentiation makes the visualization meaningful.

### 3.1 Per-banker daily averages

Activity per banker correlates with activity level from Stage 1:

**High activity (5 bankers, avg 7-9 events/day):**
- Scott Brynjolffson: 8 events/day avg
- Sarah Chen: 9 events/day avg (CRE-heavy, more captures per Member)
- Marcus Johansson: 8 events/day avg
- David Nguyen: 7 events/day avg
- Maria Reyes: 7 events/day avg
- Abdirahman Hassan: 7 events/day avg

**Medium activity (7 bankers, avg 4-6 events/day):**
- Linnea Petersen: 5 events/day
- Rachel Goldman: 5 events/day
- Tom Olsson: 4 events/day
- James Patterson: 5 events/day
- Karin Lindgren: 4 events/day
- Jennifer Vang: 4 events/day
- Diana Reyes: 5 events/day

**Low activity (1 banker, avg 1-2 events/day):**
- Robert Anderson: 2 events/day (tenured, smaller portfolio, slower pace)

### 3.2 Banker activity vacation patterns

Realistic absences in heatmap. For 90-day window, each banker has 0-1 vacation periods of 4-7 consecutive low-activity days. Spread across calendar:

- Scott Brynjolffson: short vacation 25-30 days ago
- Sarah Chen: vacation 60-65 days ago
- Marcus Johansson: continuous activity
- Linnea Petersen: vacation 15-20 days ago
- Robert Anderson: extended low-activity window 40-55 days ago (pre-retirement reduced load)
- Other bankers: scattered patterns

These vacation gaps add realism. EVP looking at the heatmap should see the kind of variation real banker calendars show — not unrealistic uniform activity.

### 3.3 Banker × Track activity correlation

Specialty-focused bankers' activity skews toward their specialty:
- Sarah Chen: 70% of captures on CRE / SBA 504 Members
- James Patterson: 80% of captures on SBA 504 Members (most concentrated)
- Linnea Petersen: 65% on SBA-related
- Rachel Goldman: 65% on CRE / SBA 504
- Diana Reyes: 60% on CRE / SBA 504
- Karin Lindgren: 50% on Treasury-adjacent Members

Generalist bankers spread across all Track types.

---

## Section 4 — Insight authorship temporal patterns

The insight authorship pipeline view tracks insights authored over time.

### 4.1 Daily insight authorship totals

90-day distribution producing the temporal trend:

| Time window | Avg insights/day | Total insights |
|---|---|---|
| Days 1-30 ago | 12 | 360 |
| Days 31-60 ago | 10 | 300 |
| Days 61-90 ago | 8 | 240 |

**Total insights authored across 90 days: 900.**

### 4.2 Matched-vs-novel ratio over time

Per Sprint 5b.1 architecture:
- **Matched:** insights matching a canonical Pattern (saved to library, used in matching for future similar captures)
- **Novel:** insights without canonical Pattern match (sent to senior-lender review for potential promotion to canonical)

Distribution:

| Time window | Matched share | Novel share |
|---|---|---|
| Days 1-30 ago | 78% (281 matched) | 22% (79 novel) |
| Days 31-60 ago | 72% (216 matched) | 28% (84 novel) |
| Days 61-90 ago | 68% (163 matched) | 32% (77 novel) |

Trend: matched share rises over time. As Pattern library matures and bankers see common reframes/implications, more insights match canonical Patterns. Novel rate trending down indicates the library is catching up to the conversational reality.

This is a positive signal — system learning. Worth surfacing on dashboard.

### 4.3 Top patterns matching trend

The 53 canonical Patterns surface at different rates based on Member-Type and Track distribution. For temporal momentum, top 10 most-matched Patterns over 90 days:

| Pattern ID | Type | Match count (90d) | Tracks |
|---|---|---|---|
| PATTERN-006 | seasonal_cashflow_gap reframe | 64 | TRACK-001 |
| PATTERN-010 | capacity_limit reframe | 52 | TRACK-002, 007 |
| PATTERN-017 | real_estate_constraint reframe | 41 | TRACK-003, 008 |
| PATTERN-019 | customer_growth_announcement reframe | 38 | TRACK-008, 003 |
| PATTERN-011 | capacity_limit implication | 35 | TRACK-002, 007 |
| PATTERN-012 | aging_equipment reframe | 33 | TRACK-002, 007 |
| PATTERN-005 | seasonal_cashflow implication | 31 | TRACK-001 |
| PATTERN-022 | co_decision_maker_input reframe | 28 | TRACK-008, 003 |
| PATTERN-018 | real_estate_implication | 26 | TRACK-003, 008 |
| PATTERN-013 | equipment_breakdown implication | 24 | TRACK-002, 007 |

Total top-10 matches: 372 (41% of 900 total insights).

The other 43 Patterns share the remaining 528 matches plus 240 novel insights authored across 90 days.

### 4.4 Senior-lender review queue

Novel insights queue for senior-lender review:

- 240 novel insights authored across 90 days
- Average review turnaround: 8 days
- Of 240 novel insights, ~12-15 promoted to canonical Pattern library (5-6%)
- Other ~225 either kept in master employee record or marked "noted but not promoted"

This produces the senior-lender review queue volume that EVP might want to see (showing the system has appropriate quality control).

---

## Section 5 — Phase progression activity

Members move through phases over time. The temporal stream tracks these movements.

### 5.1 Daily phase progression averages

Across all 220 Members over 90 days:

| Progression type | Avg per day | Total over 90 days |
|---|---|---|
| Discover → Measure | 1.2 | 108 |
| Measure → Consult | 0.8 | 72 |
| Consult → Navigate | 0.5 | 45 |
| Navigate → Closed | 1.1 | 100 (matches Stage 3 closures) |

### 5.2 Phase progression by Track

Faster Tracks produce more daily progressions:
- Business Visa: ~3-4 progressions/week (fast Discover-to-Close cycle)
- Equipment & Machinery: ~2-3 progressions/week
- CRE Term Loan: ~1 progression/week (slower cycle)
- SBA 504: ~0.5 progressions/week (slowest)

This drives phase funnel visualization — watching Members flow through phases over time.

### 5.3 Phase progression bottlenecks

Where Members tend to slow down:
- **Measure → Consult:** longest median wait (28 days). Banker building model often takes time.
- **Consult → Navigate:** second longest (22 days). Member processing artifacts, getting consensus.
- **Discover → Measure:** moderate (18 days). Quantitative work happening.
- **Navigate → Closed:** varies wildly by Track (from 5 days for Visa to 75 days for SBA 504).

Surfaces as friction in conversion-per-pathway view.

### 5.4 Stage-skip progressions

Per Stage 2: 5-8 Members are stage-skipping (have later-phase evidence without earlier-phase evidence). Over 90 days, these Members occasionally "regress" — banker fills in missing earlier-phase evidence (Discover → Measure happens AFTER Consult evidence already exists). This produces 3-5 stage-skip-correction events over 90 days.

Visible in temporal momentum as "Members backfilling Discover after stage-skip detection." Demo signal: the system catches stage-skipping and bankers correct it.

---

## Section 6 — Featured temporal events

For demo storytelling, hand-curate 3-5 specific dated events across the 90 days that produce visual highlights:

### 6.1 Curated event examples

**Event 1: "Major Insight Authoring Day" (Day 12 ago)**
- 28 insights authored in single day
- Originated in cross-banker workshop (synthetic — Blaze ran a banker training day)
- Visible spike in temporal momentum chart
- Storytelling: "The architecture supports concentrated learning moments."

**Event 2: "First SBA 504 close" (Day 45 ago)**
- $4.2M SBA 504 deal closed (specialty manufacturer)
- Marcus Johansson originating; James Patterson SBA specialist; Diana Reyes CDC partner
- Featured in "conversations that became deals" tile
- Storytelling: "Year-over-year first SBA 504 closure under new architecture."

**Event 3: "Pattern Library Update" (Day 28 ago)**
- 4 novel insights promoted to canonical Pattern library in single review cycle
- Library growth from 49 to 53 Patterns
- Visible jump in matched-rate trend
- Storytelling: "The library is learning."

**Event 4: "Maximum Activity Day" (Day 8 ago)**
- 89 events captured across all bankers
- Highest single-day activity in 90-day window
- Tuesday peak day pattern
- Storytelling: "Pipeline is accelerating, not stagnating."

**Event 5: "Stage-skip Catch" (Day 35 ago)**
- 2 Members detected stage-skipping; bankers backfilled Discover-phase evidence
- Demonstrates Coverage / Stage-skip surface utility
- Storytelling: "The system catches gaps and bankers self-correct."

These 3-5 curated events provide demo narrative beats. Outside curated events, daily activity follows baselines from Section 2.

---

## Section 7 — Geographic activity over time

Geographic segment view can scrub through time. For each branch, daily activity:

### 7.1 Per-branch activity correlation

Branches with concentrated activity:
- BRANCH-001 Minneapolis Downtown: ~14 events/day (high; Scott + James Patterson)
- BRANCH-002 St. Paul Downtown: ~10 events/day (Marcus solo)
- BRANCH-004 Edina: ~14 events/day (Sarah Chen + Rachel Goldman)
- BRANCH-005 Bloomington: ~7 events/day (David Nguyen)

Standard MSP branches: 3-5 events/day.

Outstate branches: 1-2 events/day.

### 7.2 Geographic temporal scrubbing

The geographic segment view with time scrub allows EVP to see:
- How activity has shifted over 90 days
- Recent pipeline expansion to specific branches
- Branch-level activity acceleration matching the overall +15% lift

---

## Section 8 — Open thread aging over time

For Coverage drill-down: how open threads age across 90 days.

### 8.1 Open thread snapshots

| Time window | Total open threads | 0-30 days old | 30-90 days old | 90+ days old |
|---|---|---|---|---|
| Today | 78 | 45 | 25 | 8 |
| 30 days ago | 72 | 42 | 24 | 6 |
| 60 days ago | 68 | 38 | 25 | 5 |
| 90 days ago | 64 | 36 | 23 | 5 |

Volume grows slightly as pipeline grows; aged thread proportion stays relatively stable. 90+ day cohort represents bankers needing senior-lender intervention.

### 8.2 Resolution velocity

- Average open thread resolution time: 22 days (Member returns and Reaction captured)
- Open threads becoming Indecision tags (90+ days old): 8 currently; 5-6 historically
- Resolution success rate: ~80% of open threads eventually resolve into Reactions; ~20% become permanent Indecision indicators

---

## Section 9 — Schema notes for synthetic data generator

When CC implements the data generator, Stage 4 produces:

```typescript
type DailyActivity = {
  date: Date;
  
  // Aggregate counts
  factor_captures: number;
  signals: number;
  insights_authored: number;
  reactions: number;
  models: number;
  actions: number;
  show_events: number;
  
  // Per-banker breakdown
  per_banker_activity: Record<string, BankerDailyActivity>;
  
  // Phase progressions
  discover_to_measure: number;
  measure_to_consult: number;
  consult_to_navigate: number;
  navigate_to_closed: number;
  
  // Insight authorship details
  insights_matched: number;
  insights_novel: number;
  patterns_matched: Record<string, number>;  // PatternID → match count
  
  // Geographic activity
  per_branch_activity: Record<string, number>;
  
  // Open thread state
  open_thread_total: number;
  open_thread_recent: number;     // 0-30 days old
  open_thread_aging: number;      // 30-90 days old
  open_thread_stale: number;      // 90+ days old
};

type BankerDailyActivity = {
  banker_id: string;
  events_count: number;
  insights_authored: number;
  members_progressed: number;
  on_vacation: boolean;
};

type FeaturedTemporalEvent = {
  date: Date;
  event_type: 'major_authoring_day' | 'sba_close' | 'pattern_promotion' | 'peak_activity' | 'stage_skip_catch';
  description: string;
  visual_marker: 'spike' | 'milestone' | 'highlight';
  related_entities: {
    banker_ids?: string[];
    member_ids?: string[];
    deal_id?: string;
    pattern_ids?: string[];
  };
};
```

Stage 4 produces:
- 90 DailyActivity records (one per day)
- 14 × 90 = 1,260 per-banker daily entries
- 28 × 90 = 2,520 per-branch daily entries
- 3-5 FeaturedTemporalEvent records
- Total: ~250KB of seed data

---

## Section 10 — Open items for review

**Decision needed:**

1. **90-day window: confirmed?** Could expand to 180 days for richer temporal data; could contract to 60 days for tighter focus. 90 days lands well — enough for trends, recent enough to feel current.

2. **Recent acceleration signal: +15% lift acceptable?** This is the "trending up" demo signal. Could be more aggressive (+25%) or more modest (+8%). +15% reads believable.

3. **Featured temporal events: 5 curated.** Confirm the 5 sketched in Section 6.1 work, or specify different mix. These are the "narrative beats" EVP demo highlights.

4. **Insight matched-vs-novel ratio trend.** Currently shows matched share rising 68% → 78% over 90 days (library learning). Worth confirming this trend reads as positive signal vs concerning. Some EVP audiences read declining novel as "system getting stale" — but in this context it's "system maturing."

5. **Robert Anderson low-activity portrayal.** Stage 1/3 show this banker as tenured-winding-down. Stage 4 reinforces with extended low-activity window 40-55 days ago. Worth confirming this doesn't read as performance issue. Could soften to "consistent moderate activity" if preferred.

---

**End of Stage 4 — Temporal Activity Stream.**

Ready for review per Section 10 open items. After confirmation, Stage 5 (Aggregate metrics — hero metrics, conversion rates, handoff velocities, pipeline values computed across all stages) is the final stage before Sprint 7 prompt drafting.
