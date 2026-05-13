# Sprint 7a — EVP Dashboard Foundation

**Prompt for Claude Code. Single checkpoint. New EVP-facing Insight Engine dashboard with synthetic-data-driven visualizations. Foundation + 5 highest-impact drill-downs. Estimated 4-5 effective build days CC time.**

## Pre-flight context

Sprint 5e v2 shipped visual density cleanup and Pattern surfacing. Sprint 6 (polish + production deploy) deferred until after Sprint 7a so the dashboard ships before production deployment.

The current Insight Engine has 4 separate tabs (Track Performance, Member portfolio, Coverage, Stage-skip). Visual review with Francisco surfaced that this tabbed structure doesn't communicate scale or generate excitement for an EVP audience. The columns-with-numbers layout reads as operational tooling, not strategic dashboard.

Sprint 7a rebuilds the Insight Engine as an EVP-facing dashboard with:
- Hero metrics strip (always visible)
- Filter tag system (click a tag → main canvas updates to that visualization type)
- Main visualization canvas (single view at a time, drill-down enabled)
- "Conversations that became deals" featured tile (always-visible demo-gold)
- 5 of 10 planned drill-down views (highest-impact for EVP narrative)

Sprint 7b will add the remaining 5 drill-downs (Member-Type matrix, conversion-per-pathway, handoff velocity, Sankey flow, insight authorship pipeline, business type) plus refinement.

**Read these governance documents before starting:**

1. `SYNTHETIC_DATA_stage1_branches_and_bankers.md` (root level — to be saved by Francisco)
2. `SYNTHETIC_DATA_stage2_member_roster.md` (root level)
3. `SYNTHETIC_DATA_stage3_closed_deals.md` (root level)
4. `SYNTHETIC_DATA_stage4_temporal_activity.md` (root level)
5. `SYNTHETIC_DATA_stage5_aggregate_metrics.md` (root level)
6. `ARCHITECTURE_V2.md`
7. `CONTENT_REWRITE_v1.md` Section 7 (Insight Engine surface copy)
8. Existing Insight Engine routes: `app/insight-engine/*`

If any document is missing, stop and surface to Francisco.

**Architecture authority:** Synthetic data specs are the source of truth for data shape, scale, and computation logic. ARCHITECTURE_V2.md wins for objective architecture. Existing fixtures (Jenny, Northland, Cygnus, Riverside) coexist with synthetic data, not replaced.

**Approved decisions (already locked through design):**

- 220 total Members in cultivation (only 4 are detailed; 216 are aggregate-only with no Member-level page)
- 14 bankers across 28 branches (per Stage 1 specs)
- 100 closed deals over last 12 months (per Stage 3)
- 90-day temporal activity window (per Stage 4)
- 6 hero metrics with sparklines: pipeline value, members in cultivation, conversations this week, insights this week, avg Discover→Navigate, closed last 12 months
- Filter tags: single-tag-only for visualization type; multiple-tag activation supported for filters within a visualization
- URL state management for shareable views
- Recharts for standard charts; custom SVG for geographic map; web-native interactive throughout
- 5 drill-down views in Sprint 7a: phase funnel, lending product mix, geographic branch map, banker activity heatmap, temporal momentum
- "Conversations that became deals" featured tile always visible
- Coexistence with existing 4-tab routes (deprecated but accessible until Sprint 7b)

## What ships in this sprint (7a)

Nine blocks across four phases. Single checkpoint.

**Phase 1 — Data infrastructure:**
- **Block A — Synthetic data generator (Stages 1-5).**

**Phase 2 — Dashboard shell:**
- **Block B — New dashboard route + layout.**
- **Block C — Hero metrics strip with sparklines.**
- **Block D — Filter tag system + URL state management.**
- **Block E — "Conversations that became deals" featured tile.**

**Phase 3 — Five drill-down views:**
- **Block F — Phase funnel drill-down.**
- **Block G — Lending product mix drill-down.**
- **Block H — Geographic branch map drill-down.**
- **Block I — Banker activity heatmap drill-down.**
- **Block J — Temporal momentum drill-down.**

**Phase 4 — Polish + governance:**
- **Block K — Visual polish, accessibility, and governance updates.**

Sprint 7a explicitly does NOT ship: Member-Type × Lending product matrix; conversion-per-pathway view; handoff velocity view; Sankey flow; insight authorship pipeline; business type filter view. All deferred to Sprint 7b.

---

## Block A — Synthetic data generator

### A.1 Goal

Produce a deterministic synthetic data generator that yields all data specified in Stages 1-5. The generator runs at seed time (or app startup); data persists as JSON, in-memory cache, or seeded database records depending on what fits the existing build.

### A.2 Generator structure

Single TypeScript module: `lib/synthetic-data/generator.ts`

Exports:
```typescript
export function generateSyntheticDataset(seed: number = 42): SyntheticDataset {
  // Deterministic; same seed produces same data
  return {
    branches: generateBranches(),
    bankers: generateBankers(),
    members: generateMembers(seed),
    closed_deals: generateClosedDeals(seed),
    daily_activity: generateDailyActivity(seed),
    aggregate_metrics: computeAggregateMetrics(...),
  };
}
```

### A.3 Per-stage generator functions

**Branches (Stage 1 Section 1):**
- Hard-coded 28 records per Stage 1 specs
- Each: BRANCH-NNN ID, name, city, lat/lng, tier
- Total: 5 Major + 2 Regional + 15 Standard + 6 Outstate

**Bankers (Stage 1 Section 2):**
- Hard-coded 14 records per Stage 1 specs
- Each: BANKER-NNN ID, name, primary_branch_id, additional_branch_ids, tenure_years, specialty, activity_level, target_member_count
- Total: Scott Brynjolffson, Sarah Chen, Marcus Johansson, Linnea Petersen, David Nguyen, Rachel Goldman, Tom Olsson, Maria Reyes, James Patterson, Karin Lindgren, Abdirahman Hassan, Robert Anderson, Jennifer Vang, Diana Reyes

**Members (Stage 2):**
- 4 detailed Members: Jenny, Northland, Cygnus, Riverside (preserved from existing fixtures; not regenerated)
- 216 synthetic Members: generated per Stage 2 specs
  - Distribution per Section 1.1 (8 Member-Types)
  - Banker/branch assignment per Section 6.1
  - Phase distribution per Section 3.1
  - Track distribution per Section 4.1
  - Sized opportunity per Section 5.1 ranges
  - Geographic coordinates clustered around branch ±5 mile radius (with some Members up to ±15 miles)
  - Last touch date per Section 9 distribution
  - Capture density tier per Section 8.1

Synthetic Member names generated from per-Member-Type word banks:
- Event services: ["Lakeside", "Twin Cities", "Aurora", "North Star", "Headwaters", "Boundary Waters", "Loon Lake", "Pinewood"] + ["Catering", "Wedding", "Event", "Banquet", "Gathering", "Celebrations"]
- Maintenance services: ["Premier", "Frostbreak", "True North", "Headwaters", "Twin Cities", "Loon Lake", "Aurora"] + ["HVAC", "Plumbing", "Mechanical", "Landscaping", "Solutions"]
- Specialty manufacturer: ["Headwaters", "Ironwood", "Mille Lacs", "Aurora", "North Star"] + ["Precision", "Industrial", "Manufacturing", "Fabrication"]
- Professional services: ["Brynjolffson", "Lakeshore", "Skyline", "Citizens", "Headwaters"] + ["& Associates", "Accounting", "Engineering Partners", "Tax Advisory", "Legal Group"]
- Healthcare services: ["Mississippi", "Northgate", "Riverside", "Lake Country", "Citizens"] + ["Family Dental", "Veterinary Clinic", "Physical Therapy", "Medical Group", "Healthcare"]
- Food services: ["Kingfield", "Selby Avenue", "Boundary Waters", "North Loop", "Como"] + ["Bistro", "Bakery", "Brewery", "Coffee Co.", "Provisions"]
- Retail: ["Como", "Northeast", "Highland", "Lakeland", "Boundary Waters"] + ["Specialty Goods", "Apparel", "Outdoor Outfitters", "Provisions", "Mercantile"]
- Construction: ["True North", "Foundation First", "Pinewood", "Hennepin Heritage", "North Star"] + ["Builders", "Construction", "Homes", "Heritage Construction"]

Combine first + last per banker for unique names. If collision, add Roman numeral (II, III) or city qualifier.

**Closed deals (Stage 3):**
- 100 deals per Stage 3 specs
- Distribution per Section 1.3 (monthly)
- Track distribution per Section 2.1
- Banker attribution per Section 3.1
- Specialist coordination per Section 4.2
- 5 featured deals (per Section 6.4) with curated narratives in JSON

**Daily activity (Stage 4):**
- 90 daily records per Stage 4 specs
- Per-banker daily counts per Section 3.1
- Day-of-week pattern per Section 2.2
- +15% recent acceleration per Section 2.3
- 5 featured temporal events per Section 6.1
- Per-branch daily activity per Section 7.1
- Phase progression daily counts per Section 5.1
- Insight authorship by matched/novel per Section 4.2
- Open thread aging per Section 8

**Aggregate metrics (Stage 5):**
- Computed from prior stages at generator runtime
- Hero metrics + sparkline arrays per Section 1
- Per-Track / per-banker / per-branch / per-Member-Type rollups
- Top patterns matched per Section 10.3
- Featured deals and temporal events references

### A.4 Generator output format

The generator produces a single typed object. Persistence options:

**Option A — In-memory only.** Generator runs at app startup; data lives in memory; reset on restart. Simplest; fits dashboard rendering.

**Option B — Seeded to database.** Generator output written to Prisma at seed time; coexists with existing fixture data; queryable like fixtures. More complex but supports existing Member-level page rendering for the 4 detailed fixtures.

My recommendation: **Hybrid.** Generator output cached in memory (or in a JSON file under `lib/synthetic-data/cache/`); dashboard queries the cache. Existing 4 fixtures stay in Prisma for Member-level pages. Dashboard merges synthetic + fixture data for aggregate views.

CC decides exact mechanism; document choice in BUILD_LOG.

### A.5 Determinism + reproducibility

- Same seed → same output
- Seed value defaults to 42 (or any constant)
- Random number generation uses seedable PRNG (e.g., seedrandom library or hand-rolled)
- All distributions deterministic given seed

This means demo state is reproducible. If demo data needs adjustment, change the seed and regenerate, or adjust the generator to produce specific outputs.

### A.6 Acceptance criteria

- [ ] Generator produces all data per Stages 1-5 specs
- [ ] Deterministic given seed value
- [ ] 4 detailed fixtures (Jenny, Northland, Cygnus, Riverside) preserved
- [ ] 216 synthetic Members generated with realistic distribution
- [ ] 100 closed deals with correct Track/banker/specialist distribution
- [ ] 90 daily activity records with per-banker and per-branch granularity
- [ ] Aggregate metrics computed correctly (hero numbers match specs)
- [ ] `pnpm tsc --noEmit` clean
- [ ] Generator runs in <500ms on typical hardware (not blocking app startup)

---

## Block B — New dashboard route + layout

### B.1 Route structure

New route: `app/insight-engine/page.tsx` (or `app/v2/insight-engine/page.tsx` if needed to coexist with existing routes during transition).

The dashboard becomes the Insight Engine landing page. Existing 4-tab routes (`/insight-engine/track-performance`, etc.) continue working but are accessible from dashboard filter tags or kept as legacy routes during Sprint 7a → 7b transition.

### B.2 Page layout

Top-to-bottom structure:

```
┌──────────────────────────────────────────────────────────────────────┐
│  HEADER (page title, banker / admin context, return to v2)           │
├──────────────────────────────────────────────────────────────────────┤
│  HERO METRICS STRIP                                                  │
│  ┌────┬────┬────┬────┬────┬────┐                                    │
│  │$142M│ 220│  68│  51│  87│$71M│                                   │
│  │ ▁▂▃ │    │ ▆▅▇│ ▃▅▇│    │ ▂▄▆│                                  │
│  └────┴────┴────┴────┴────┴────┘                                    │
├──────────────────────────────────────────────────────────────────────┤
│  FILTER TAG ROW                                                      │
│  [Phase funnel] [Product mix] [Geographic] [Banker] [Temporal] ...  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MAIN VISUALIZATION CANVAS                                           │
│  (renders selected filter tag's visualization)                       │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  FEATURED TILE                                                       │
│  "Conversations that became deals"                                   │
│  Cygnus → Marcus Johansson + James Patterson + Diana Reyes           │
│  $3.2M SBA 504 closed Mar 14 · 187 days · 24 captures                │
└──────────────────────────────────────────────────────────────────────┘
```

### B.3 Component structure

Recommended decomposition:

```
app/insight-engine/
  page.tsx                            // Top-level page
  components/
    HeroMetricsStrip.tsx              // Block C
    FilterTagRow.tsx                  // Block D
    MainCanvas.tsx                    // Dispatches to view per active tag
    FeaturedDealTile.tsx              // Block E
    views/
      PhaseFunnelView.tsx             // Block F
      LendingProductMixView.tsx       // Block G
      GeographicMapView.tsx           // Block H
      BankerActivityHeatmapView.tsx   // Block I
      TemporalMomentumView.tsx        // Block J
  hooks/
    useSyntheticData.ts               // Reads generator output
    useFilterState.ts                 // URL-backed filter state
```

### B.4 Default state

On first load (no URL state), dashboard shows:
- Hero metrics: full population (no filter)
- Main canvas: phase funnel (default view)
- Featured tile: first of 5 curated deals (Cygnus SBA 504)

### B.5 Responsive behavior

- Desktop (1280px+): full layout as sketched
- Tablet (768-1280px): hero metrics wrap to 2 rows; filter tags wrap; canvas shrinks
- Mobile (<768px): hero metrics collapse to single column; canvas full-width; some visualizations may need mobile-specific simplification (especially Sankey + map in Sprint 7b)

Note: EVP demo will be on desktop. Mobile is acceptable-but-not-polished for Sprint 7a.

### B.6 Acceptance criteria

- [ ] New dashboard route renders without errors
- [ ] Layout matches sketch (hero strip + filter tags + canvas + featured tile)
- [ ] Default state on first load shows phase funnel view
- [ ] Responsive breakpoints work at desktop / tablet
- [ ] Existing 4-tab routes continue to work
- [ ] Navigation to dashboard accessible from existing surfaces

---

## Block C — Hero metrics strip with sparklines

### C.1 Six metrics

Per Stage 5 Section 1:

| # | Metric | Value source | Sparkline |
|---|---|---|---|
| 1 | Pipeline value | $142M face (toggle to $48M weighted) | None |
| 2 | Members in cultivation | 220 count | None |
| 3 | Conversations this week | Current-week capture events | 12-week trend |
| 4 | Insights this week | Current-week insights authored | 12-week trend |
| 5 | Avg Discover → Navigate | 87 days median | None |
| 6 | Closed last 12 months | $71M total | 12-month trend |

### C.2 Visual treatment

Each metric card:
- Large headline number (4xl font; bold)
- Metric label below number (small caps; muted)
- Sparkline below label (where applicable; 12-15px height; matched line color)
- Subtle border or background card; equal sizing

Example card:
```
┌─────────────┐
│   $142M     │
│  PIPELINE   │
│   VALUE     │
│             │
└─────────────┘
```

For metrics with sparklines:
```
┌─────────────┐
│    68       │
│CONVERSATIONS│
│ THIS WEEK   │
│   ▁▂▃▅▆▇    │
└─────────────┘
```

### C.3 Pipeline value toggle

Pipeline value card has subtle toggle/tooltip:
- Default: $142M (face value)
- Click/hover toggle: $48M (weighted by phase)
- Tooltip explains: "Face value sums all sized opportunities. Weighted view applies phase-progression probability."

### C.4 Filter responsiveness

Hero metrics update when filter tags activated. Example: filter to TRACK-008 SBA 504 → metrics scope to SBA 504 only:
- Pipeline value: $72M (SBA 504 portfolio)
- Members in cultivation: 24
- Conversations this week: ~10
- Insights this week: ~6
- Avg Discover → Navigate: 162 days
- Closed last 12 months: $38.4M

All metrics recompute from synthetic data based on active filter state.

### C.5 Sparkline implementation

Use Recharts <Sparklines> or hand-rolled SVG sparkline. Specs:
- 12 data points (weeks for conversations/insights; months for closures)
- Smooth interpolation
- Matched color: accent color from current theme
- No axis labels (sparkline is contextual; not for precise reading)

### C.6 Acceptance criteria

- [ ] All 6 hero metrics render correctly with values from synthetic data
- [ ] Sparklines render for metrics 3, 4, and 6
- [ ] Pipeline value toggle works (face/weighted)
- [ ] Metrics update reactively when filter state changes
- [ ] Visual treatment consistent with Blaze color system
- [ ] Accessible (semantic labels; screen-reader friendly)

---

## Block D — Filter tag system + URL state management

### D.1 Filter tag types

Two categories of filter tags:

**Visualization tags (single-select; mutually exclusive):**
- Phase funnel (default)
- Product mix
- Geographic
- Banker activity
- Temporal momentum

(Sprint 7b adds: Member-Type matrix, Conversion, Handoff velocity, Sankey, Authorship pipeline, Business type)

**Filter tags (multi-select; combinable):**
- Track filters: TRACK-001 through TRACK-011 (excluding TRACK-005)
- Member-Type filters: event_services, maintenance_services, etc.
- Phase filters: Discover, Measure, Consult, Navigate
- Banker filters (when relevant)

Visualization tag determines which view renders in main canvas. Filter tags scope the data within that view.

### D.2 Visual treatment

Tag row layout:
```
[ Phase funnel ▶ ] [ Product mix ] [ Geographic ] [ Banker activity ] [ Temporal ]   |   [ + Add filter ▼ ]
```

- Active visualization tag: filled background, accent color
- Inactive visualization tags: outlined, muted
- Active filter tags (multi-select): smaller chips with × close affordance

### D.3 URL state encoding

URL query parameters reflect active state:

```
/insight-engine?view=phase-funnel
/insight-engine?view=phase-funnel&track=TRACK-008
/insight-engine?view=lending-product-mix&type=specialty_manufacturer
/insight-engine?view=banker-activity&banker=BANKER-001
```

State keys:
- `view`: visualization tag (`phase-funnel` | `lending-product-mix` | `geographic` | `banker-activity` | `temporal-momentum`)
- `track`: TRACK-NNN filter
- `type`: Member-Type filter
- `phase`: phase filter
- `banker`: banker filter
- `daterange`: temporal filter for momentum view

Multiple filters can stack: `?view=phase-funnel&track=TRACK-008&type=specialty_manufacturer`

### D.4 Browser back-button support

Selecting a tag updates URL; browser back navigates to prior state. URL is shareable — copy/paste link reproduces exact view + filters.

### D.5 Acceptance criteria

- [ ] 5 visualization tags render and toggle correctly
- [ ] Filter tags activate and combine correctly
- [ ] URL updates on tag changes
- [ ] Back button navigates state correctly
- [ ] Shareable URLs reproduce exact view + filter state
- [ ] Visual treatment communicates active/inactive state

---

## Block E — "Conversations that became deals" featured tile

### E.1 Tile content

Always-visible card displaying one of 5 curated featured deals from Stage 3 Section 6.4 / Stage 5 Section 13.

Rotation: auto-cycles every 30 seconds; manual prev/next buttons available; pause toggle.

Tile structure:

```
┌──────────────────────────────────────────────────────────────────────┐
│  CONVERSATIONS THAT BECAME DEALS                       1 of 5  ◀ ▶ ⏸ │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Cygnus Bioscience · SBA 504 · Closed Mar 14 — $3.2M                │
│                                                                      │
│  187 days from first conversation to close                           │
│  24 captures · 7 insights authored                                   │
│                                                                      │
│  Originating Trigger (Day 1):                                        │
│  "We're at about 85% capacity utilization. Three of our              │
│  anchor customers are signaling 15-25% volume growth."               │
│                                                                      │
│  Key insights along the way:                                         │
│  → Owner-occupancy reframe (Day 23)                                  │
│  → Capacity-as-decision implication (Day 41)                         │
│  → Board engagement reframe (Day 67)                                 │
│                                                                      │
│  Specialist coordination:                                            │
│  Marcus Johansson (relationship) →                                   │
│  James Patterson (SBA) introduced Day 28 →                           │
│  Diana Reyes (CDC partner) joined Day 67                             │
│                                                                      │
│  [ View full attribution → ]                                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### E.2 Five curated deals

Per Stage 5 Section 13.1 — five deals rotating:

1. Cygnus-style SBA 504 ($3.2M, 187 days, specialty_manufacturer)
2. CRE Term Loan ($1.6M, 124 days, professional_services)
3. Equipment & Machinery ($245K, 68 days, maintenance_services)
4. Business Visa ($35K, 22 days, retail)
5. PACE Loan ($185K, 89 days, specialty_manufacturer)

Each deal has hand-crafted narrative content stored in synthetic data generator.

### E.3 Tile interactions

- Auto-rotates every 30 seconds
- Pause button: stops rotation; visible icon state
- Prev/Next buttons: manual navigation
- "View full attribution" link: drills into full conversation history detail panel (for Sprint 7b refinement; for now, link opens dialog with extended narrative)
- Click any banker/specialist name: filters dashboard to that banker's portfolio

### E.4 Acceptance criteria

- [ ] Tile renders with 5 rotating featured deals
- [ ] Auto-rotation works on 30-second interval
- [ ] Pause/play state controls rotation
- [ ] Prev/Next manual navigation works
- [ ] Tile placement below main canvas; full-width
- [ ] Banker/specialist name clicks filter dashboard
- [ ] All 5 deals have complete content from Stage 3/5

---

## Block F — Phase funnel drill-down

### F.1 Visualization

Funnel chart showing Members at each phase with flow rate arrows:

```
┌────────────────────────┐
│        DISCOVER        │
│          88            │  ← 40%
└──────────┬─────────────┘
           │
           │ 108 in 90 days
           ▼
┌────────────────────────┐
│        MEASURE         │
│          66            │  ← 30%
└──────────┬─────────────┘
           │
           │ 72 in 90 days
           ▼
┌────────────────────────┐
│        CONSULT         │
│          38            │  ← 17%
└──────────┬─────────────┘
           │
           │ 45 in 90 days
           ▼
┌────────────────────────┐
│        NAVIGATE        │
│          28            │  ← 13%
└──────────┬─────────────┘
           │
           │ 100 in 12 months
           ▼
┌────────────────────────┐
│      CLOSED            │
│       (12mo)           │
│       100              │
└────────────────────────┘
```

Implementation: Recharts FunnelChart or custom SVG funnel with per-phase counts and arrow widths proportional to flow rates.

### F.2 Flow rate arrows

Arrow widths proportional to flow rate per Stage 5 Section 2.2:
- Discover → Measure: 1.2/day (widest)
- Measure → Consult: 0.8/day
- Consult → Navigate: 0.5/day (narrowest)
- Navigate → Closed: 1.1/day

Visual emphasis communicates "where deals slow down."

### F.3 Phase-level drill-down

Click a phase → expands to show Members at that phase:
- Member name
- Member-Type
- Banker
- Current Track
- Days in phase
- Sized opportunity

Sortable by days-in-phase (longest first) or by sized opportunity (largest first).

### F.4 Filter responsiveness

Funnel updates when filter tags activated. Example:
- Filter to TRACK-008 → SBA 504 funnel only (8 / 6 / 5 / 5 / 12)
- Filter to specialty_manufacturer → that Member-Type's funnel
- Filters combine: TRACK-008 + specialty_manufacturer → 7 / 5 / 5 / 4 / 11

### F.5 Sparkline below funnel

Daily phase-progression count over 90 days (line chart):
- X-axis: 90 days
- Y-axis: progressions per day
- Series: Discover→Measure (one color), Measure→Consult (another), Consult→Navigate (third), Closures (fourth)

### F.6 Acceptance criteria

- [ ] Funnel renders with 4 phases + closed bucket
- [ ] Flow rate arrows width-proportional
- [ ] Click phase → drill-down list of Members
- [ ] Filter responsiveness works
- [ ] 90-day progression sparkline below funnel
- [ ] Recharts or custom SVG performs well (no rendering jank)

---

## Block G — Lending product mix drill-down

### G.1 Visualization

Treemap showing pipeline value by Track:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  SBA 504                              CRE Term Loan                  │
│  $72M                                  $43.2M                        │
│  (24 Members)                          (36 Members)                  │
│                                                                      │
│                                                                      │
├──────────────────────────────┬───────────────────────────────────────┤
│                              │                                       │
│  Equipment & Machinery       │  Invest. Property                     │
│  $6.4M                       │  $5.85M                               │
│  (32 Members)                │  (18 Members)                         │
│                              │                                       │
├─────────────┬────────────────┼───────────────┬───────────────────────┤
│             │                │               │                       │
│ Bus.Vehicle │ SBA 7(a)       │ Working Cap.  │ Other Tracks          │
│ $3.5M       │ $8M  (future)  │ $1.65M (future│ Visa $440K, PACE $900K│
│             │                │)              │ Unsecured $240K       │
└─────────────┴────────────────┴───────────────┴───────────────────────┘
```

Implementation: Recharts Treemap.

### G.2 Color coding

- Blaze active Tracks: warm accent color (e.g., blaze-brand brown/orange)
- Future-expansion Tracks: muted/grayed color with explicit "future" label
- Hover any cell: tooltip with Track details

### G.3 Cell content per Track

Each cell shows:
- Track name (e.g., "SBA 504")
- Pipeline value ($72M)
- Member count (24 Members)
- Active status (Blaze offers / future-expansion)

### G.4 Track-level drill-down

Click a cell → drills to that Track's view:
- Member list within Track
- Funnel for that Track
- Conversion rate
- Top bankers cultivating

### G.5 Active vs future-expansion split summary

Prominent display somewhere on the view:
- "Blaze active offerings: 182 Members, $132.6M pipeline value (93%)"
- "Future-expansion products: 38 Members, $9.65M pipeline value (7%)"

Optional toggle: "Show future-expansion only" or "Hide future-expansion."

### G.6 Acceptance criteria

- [ ] Treemap renders with all 10 Tracks
- [ ] Cell sizes proportional to pipeline value
- [ ] Color coding distinguishes Blaze active vs future-expansion
- [ ] Click cell → drill-down works
- [ ] Tooltips show Track details on hover
- [ ] Filter responsiveness (filter to Member-Type → treemap shows only that Member-Type's Tracks)

---

## Block H — Geographic branch map drill-down

### H.1 Visualization

Geographic map of Minnesota with 28 branch markers. Markers size by pipeline value; color by conversion rate.

Map library: **Leaflet** (lightweight, open source, web-native, integrates well with React).

### H.2 Map content

- Base map: light/muted tile set; focus on Twin Cities metro with extents to outstate branches
- 28 branch markers per Stage 1 coordinates
- Marker size: proportional to active pipeline value (log scale)
- Marker color: gradient from low conversion rate (red-orange) to high (green)
- Cluster markers when zoomed out (Major branches stay separate)

### H.3 Marker interaction

- Hover marker → tooltip: branch name, member count, pipeline value, conversion rate
- Click marker → expanded panel below map:
  - Branch name + city + tier
  - Member count
  - Pipeline value
  - Banker(s) covering
  - Closed deals last 12 months
  - Activity sparkline (90 days)

### H.4 Map state in URL

URL preserves zoom level + center + selected branch:
```
/insight-engine?view=geographic&branch=BRANCH-001&zoom=11
```

### H.5 Filter responsiveness

Filter to TRACK-008 → markers resize to show SBA 504 pipeline value per branch.
Filter to specialty_manufacturer → markers show that Member-Type's distribution.

### H.6 Acceptance criteria

- [ ] Map renders with all 28 branch markers at correct coordinates
- [ ] Marker size proportional to pipeline value
- [ ] Marker color reflects conversion rate
- [ ] Marker hover/click interactions work
- [ ] Filter responsiveness updates marker sizes
- [ ] Map state preserved in URL
- [ ] Performance: smooth pan/zoom with 28 markers

---

## Block I — Banker activity heatmap drill-down

### I.1 Visualization

Grid heatmap: 14 bankers × 90 days = 1,260 cells.

Layout:
```
        Day-90 ──────────────────────────────────── Day-0 (today)
Sarah Chen          ▓ ░ ▓ ▓ ▓ ░ ▓ ▓ ░ . . ▓ ▓ ▓ ▓
Marcus Johansson    ▓ ▓ ▓ ▓ ▓ ▓ ░ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
Scott Brynjolffson  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ . ▓ ▓ ▓ ▓
David Nguyen        ▓ ▓ ░ ▓ ▓ ▓ ▓ ▓ ░ ▓ ▓ ▓ ▓ ▓ ▓
Maria Reyes         ▓ ░ ▓ ▓ ▓ ░ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
Abdirahman Hassan   ▓ ▓ ▓ ░ ░ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
Diana Reyes         ░ ▓ ▓ ▓ ▓ ▓ ░ ▓ ░ ▓ ▓ ▓ ░ ▓ ▓
James Patterson     ░ ▓ ▓ ▓ ▓ ░ ░ ▓ ▓ ▓ ▓ ▓ ░ ▓ ░
...
Robert Anderson     . . ░ . . . . ░ . . . ░ . ▓ ░
        ↑ vacation                                   ↑ acceleration
```

Color scale:
- White / empty: 0 events
- Light: 1-3 events
- Medium-light: 4-6 events
- Medium: 7-9 events
- Dark: 10+ events

### I.2 Banker rows ordered by activity

Sorted top-to-bottom by total 90-day activity, per Stage 5 Section 9.3 order.

### I.3 Cell interactions

- Hover cell → tooltip: banker name, date, event count, breakdown by type
- Click cell → drill-down: which events captured that day; which Members touched
- Click banker name → drills to banker's portfolio view

### I.4 Week-pattern visual

Optional: 7-day grid pattern visible (Mon-Sun stacked) to emphasize weekly rhythm. Or 90 days as horizontal strip per banker (simpler).

CC decides; horizontal strip preferred for simplicity.

### I.5 Vacation pattern visibility

Per Stage 4 Section 3.2, several bankers have realistic vacation gaps. These appear as continuous white/empty cell sequences. Worth being legible.

### I.6 Acceptance criteria

- [ ] Heatmap renders 14 bankers × 90 days
- [ ] Color scale reflects event counts correctly
- [ ] Sorted by total activity (highest first)
- [ ] Hover/click interactions work
- [ ] Vacation gaps visible
- [ ] Robert Anderson's lower activity reads as character (not performance issue)
- [ ] Performance: smooth rendering with 1,260 cells

---

## Block J — Temporal momentum drill-down

### J.1 Visualization

Multi-series line chart of daily activity over 90 days:

Series:
- Total capture events (FactorCaptures + Signals + Reactions + Models + Actions + ShowEvents)
- Insights authored
- Phase progressions
- Closed deals

X-axis: 90 days (Day -90 to today).
Y-axis: count.

Implementation: Recharts LineChart with multiple Line series.

### J.2 +15% acceleration visibility

Trend lines should visually communicate the recent acceleration:
- Last 30 days vs prior 60 days: visibly higher
- Optional dashed reference line at "average baseline" to emphasize trend

### J.3 Featured event annotations

Per Stage 4 Section 6, 5 curated events appear as labeled markers:
- Day 12 ago: Major Insight Authoring Day (spike on insights line)
- Day 28 ago: Pattern Library Update (annotation only)
- Day 35 ago: Stage-skip Catch (annotation)
- Day 45 ago: First SBA 504 Close (spike on closures)
- Day 8 ago: Maximum Activity Day (peak on captures)

Clicking annotation expands narrative panel.

### J.4 Time window comparisons

Below chart, three small comparison cards:
- "This week vs last week": +X% change
- "Last 30 days vs prior 30 days": +Y% change
- "Last 30 days vs same period 12 months ago": +Z% change

### J.5 Filter responsiveness

Filter to TRACK-008 → chart shows SBA 504-specific activity only.
Filter to specialty_manufacturer → that Member-Type's daily activity.

### J.6 Acceptance criteria

- [ ] Line chart renders 90 days of daily activity
- [ ] All 4 series visible with distinct colors
- [ ] +15% acceleration trend visible
- [ ] 5 featured events annotated correctly
- [ ] Annotation clicks expand narrative
- [ ] Time window comparison cards display correct deltas
- [ ] Filter responsiveness works
- [ ] Chart performant with 90×4 data points

---

## Block K — Visual polish, accessibility, governance

### K.1 Visual polish

- Consistent spacing and typography across all components
- Color palette aligned with Blaze brand (consult existing tokens in current build)
- Hover states on all interactive elements
- Loading states for chart rendering (skeleton or spinner)
- Empty states when filters produce no data ("No Members match these filters")
- Consistent component sizing across drill-downs

### K.2 Accessibility

- Semantic HTML throughout (use `<button>`, `<nav>`, `<h1>`-`<h6>` correctly)
- ARIA labels on all interactive controls
- Keyboard navigation: tab order logical, Enter activates filter tags
- Screen reader support: chart data readable via alternative text or hidden tables
- Color contrast: meet WCAG AA standard (4.5:1 for text)

### K.3 Governance updates

**BUILD_LOG entry** for Sprint 7a covering:
- New dashboard route as Insight Engine entry
- Synthetic data generator infrastructure
- Hero metrics + sparklines
- Filter tag system + URL state
- 5 drill-down views shipped
- Featured deal tile
- Coexistence with existing 4-tab routes (deprecated; remove in Sprint 7b)

**OPEN_QUESTIONS amendments:**
- Q-F1: "Synthetic data persistence — in-memory vs database. Choose at implementation; document choice."
- Q-F2: "Mobile dashboard rendering. Tablet works; mobile may need view-specific simplification."
- Q-F3: "Existing 4-tab routes will be deprecated in Sprint 7b. Confirm before removal."

**Architectural notes (continuing 1-14):**
- Note 15 — Synthetic data + fixtures coexistence: 4 detailed Members (Jenny, Northland, Cygnus, Riverside) preserved in Prisma; 216 synthetic Members in generator cache. Dashboard queries merge sources for aggregate views; Member-level pages query Prisma only.
- Note 16 — URL-driven dashboard state. Demo can share specific filter views via URL; browser back button works.

**CLAUDE.md manifest update:**
- Add synthetic data stage docs as Tier 2 reference docs
- Add new dashboard route to manifest
- Update Insight Engine entry to reflect new dashboard structure

### K.4 Acceptance criteria

- [ ] Visual polish applied across all components
- [ ] Accessibility requirements met
- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 15-16 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Pilot deferrals to honor

Sprint 7a does not ship:
- 5 remaining drill-down views (deferred to Sprint 7b)
- Sankey custom SVG (Sprint 7b)
- Full mobile experience (acceptable-but-not-polished for 7a)
- Synthetic data validation logic (Pilot)
- Per-banker permission scoping (Pilot)
- Real Blaze API integration (Pilot)

---

## Reporting back

When Sprint 7a is complete, report back with:

1. Confirmation that Blocks A-K shipped per acceptance criteria
2. Visual probes:
   - Dashboard renders at `/insight-engine` (or chosen route)
   - All 6 hero metrics show correct values
   - 5 sparklines render
   - Pipeline value face/weighted toggle works
   - 5 visualization filter tags toggle correctly
   - URL state updates and back-button works
   - "Conversations that became deals" tile rotates through 5 deals
   - Phase funnel view: click Discover → drill-down list
   - Lending product mix: SBA 504 cell largest (largest pipeline value)
   - Geographic map: 28 markers, MSP cluster visible
   - Banker activity heatmap: 14 bankers, 90 days, vacation gaps visible
   - Temporal momentum: 4 series visible, +15% trend, 5 annotations
3. Per-fixture sanity check: 4 detailed fixtures (Jenny, Northland, Cygnus, Riverside) still render correctly on growth conversation pages
4. Sample URL: paste a URL representing "phase funnel filtered to TRACK-008 + specialty_manufacturer" to verify state encoding
5. Any deviations from spec with rationale
6. Synthetic data persistence choice (in-memory / database / hybrid) documented

After Sprint 7a ships and visual review confirms (dashboard works, hero strip + filters + 5 views all render), Sprint 6 (polish + production deploy) ships before Sprint 7b adds remaining views.

---

## Estimated scope

4-5 effective build days CC time.

Largest blocks:
- **Block A (synthetic data generator)** — substantial spec across 5 stages; ~1-1.5 days CC
- **Block H (geographic map)** — Leaflet integration + custom marker rendering; ~0.5-1 day CC
- **Block I (banker activity heatmap)** — 1,260 cells, custom grid component; ~0.5-1 day CC
- **Block F (phase funnel)** — Recharts FunnelChart + drill-down; ~0.5 day CC
- **Block G (lending product mix treemap)** — Recharts Treemap; ~0.5 day CC
- **Block J (temporal momentum)** — Recharts multi-series + annotations; ~0.5 day CC

Smaller blocks (B, C, D, E, K) are routine but cumulatively meaningful (~0.5-1 day combined).

After Sprint 7a ships and visual review confirms, Sprint 6 (polish + production deploy) ships next. Sprint 7b adds remaining 5 drill-downs + Sankey custom SVG.
