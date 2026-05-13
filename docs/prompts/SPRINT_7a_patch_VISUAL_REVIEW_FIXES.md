# Sprint 7a-patch — Visual Review Fixes

**Prompt for Claude Code. Single checkpoint. Visual review fixes following Sprint 7a dashboard walkthrough. Estimated 1.5-2 effective build days CC time.**

## Pre-flight context

Sprint 7a shipped the EVP dashboard with 5 drill-down views. Visual review with Francisco surfaced conceptual gaps that need resolution before Sprint 6 (polish + production deploy) and before Sprint 7b (remaining drill-downs + Sankey).

Patch scope: clarify phase funnel semantics; replace pattern labels with actual Pattern content in featured deal tile; rename "originating capture" to "first member signal"; recolor and add drill-through to lending product mix treemap; replace spatial geographic map with three-region alphabetical bar lists; enlarge banker activity heatmap with cell-level drill-through; drop temporal momentum view; route synthetic Member clicks to fixture detail pages as "representative examples"; calibrate hero metrics.

**Read these governance documents before starting:**

1. `Synthetic data/SYNTHETIC_DATA_stage1_branches_and_bankers.md` through `stage5_aggregate_metrics.md` (path noted from Sprint 7a checkpoint)
2. `CONTENT_REWRITE_v1.md` Section 7 (Insight Engine surface copy)
3. `INSIGHT_PATTERN_LIBRARY_v1.md` + `INSIGHT_PATTERN_LIBRARY_v2_additions.md` (for Pattern content lookup)
4. Existing dashboard implementation: `app/v2/insight-engine/`

If any document is missing, stop and surface to Francisco.

**Approved decisions (already locked through visual review):**

- Phase funnel: clarify bar semantics with subhead; drop 90-day phase progression sparkline
- Featured deal tile: show actual Pattern content (not just Pattern label); rename "originating capture" → "first member signal"
- Lending product mix: per-cell distinct colors; mouseover tooltips for small cells; click-through to Member list filtered by Track; drop "Lending products Blaze offers" and "Lending products Blaze doesn't offer today" summary blocks
- Geographic: replace spatial map with three-region alphabetical bar list (Twin Cities Metro 20 branches; Northern Minnesota 6; Southern Minnesota 2); each branch clickable for drill-down
- Banker activity: enlarge heatmap; thicker cells; click cell → drill to accounts touched on that banker × day
- Temporal momentum: drop entirely (remove filter tag; canvas defaults to phase funnel as before)
- Synthetic Member clicks: link to one of the 4 fixture detail pages (Jenny / Northland / Cygnus / Riverside) as "representative example"; surface notation that this is a sample conversation arc
- Hero metric calibration: aggregate fixtures + synthetic so total reads 220 Members (not 216); insights/week calibrate to ~51 (not ~88)

## What ships in this sprint (7a-patch)

Eight blocks across three phases. Single checkpoint.

**Phase 1 — Drill-down view fixes:**
- **Block A — Phase funnel clarification + sparkline drop.**
- **Block B — Lending product mix recolor + drill-through + block removal.**
- **Block C — Geographic redesign (spatial → three-region bar lists).**
- **Block D — Banker activity enlargement + cell drill-through.**
- **Block E — Temporal momentum removal.**

**Phase 2 — Featured deal tile + Member routing:**
- **Block F — Featured deal tile pattern content + rename.**
- **Block G — Synthetic Member → fixture link routing.**

**Phase 3 — Hero metric calibration + governance:**
- **Block H — Hero metric calibration + BUILD_LOG.**

---

## Block A — Phase funnel clarification + sparkline drop

### A.1 Bar semantics clarification

Current state: Phase funnel shows 4 phase bars (Discover/Measure/Consult/Navigate) + Closed (12mo) bar. Bar lengths reflect Member counts. Mixing current-snapshot data (4 phases) with 12-month-cumulative data (Closed) is confusing.

New state: Add small subhead below "Phase funnel" title:

> Members currently at each phase. Closed bar shows 12-month total.

Closed (12mo) bar visually distinct from active funnel:
- Different color (muted/grey rather than warm accent)
- Slight horizontal gap above to separate from Navigate bar
- Optional label adjustment: "Closed (last 12 months)" instead of "Closed (12mo)"

### A.2 Drop 90-day phase progression sparkline

The sparkline at bottom of phase funnel view shows daily phase transitions. Visual review noted: shows cyclicality without actionable signal. EVP doesn't act on weekly rhythm.

Drop entirely. Remove the sparkline component and associated data wiring from the phase funnel view.

### A.3 Acceptance criteria

- [ ] Subhead clarifies bar semantics
- [ ] Closed (12mo) bar visually distinct
- [ ] 90-day phase progression sparkline removed
- [ ] Drill-down to Member list on phase click still works (preserved from Sprint 7a)
- [ ] Sub-filter responsiveness still works (Track / Member-Type / Phase filters preserved)

---

## Block B — Lending product mix recolor + drill-through + block removal

### B.1 Per-cell distinct colors

Current state: All Tracks render in a single color. Treemap reads as one mass.

New state: Each Track has a distinct color. Grouped color families help readability:

| Track group | Color family |
|---|---|
| SBA family (TRACK-004, TRACK-008) | Orange / amber range |
| CRE family (TRACK-003, TRACK-006) | Green range |
| Equipment / Vehicle (TRACK-002, TRACK-007) | Blue range |
| Consumer products (TRACK-010 Visa, TRACK-011 Unsecured) | Purple / lavender |
| Specialty (TRACK-001 LOC, TRACK-009 PACE) | Distinct accent colors |

Use Recharts Treemap's `content` prop or `colorScale` to map per-cell colors. Maintain accessibility (sufficient contrast for cell labels in white text).

### B.2 Mouseover tooltips for small cells

Cells with small area (PACE Loan, Working Capital LOC, etc.) currently truncate label text. Mouseover tooltip should reveal:
- Track name (full)
- Pipeline value
- Member count
- Active vs future-expansion indicator

Tooltip appears on hover with subtle offset; styled consistently with other dashboard tooltips.

### B.3 Click-through to Member list

Current state: Treemap is informational only. Clicking a cell does nothing.

New state: Click a Track cell → drills to Member list filtered by that Track. Same drill-down pattern as phase funnel (Sprint 7a Block F).

Member list shows:
- Member name (clickable per Block G — links to fixture profile)
- Member-Type
- Current phase
- Sized opportunity value
- Banker
- Branch

Sortable by sized opportunity (default), name, or phase.

### B.4 Drop summary blocks

Drop two summary cards currently below the treemap:
- "Lending products Blaze offers — 178 Members, $133.8M pipeline (94%)"
- "Lending products Blaze doesn't offer today — 38 Members, $9.3M pipeline (6%)"

These add clutter without providing new information beyond what the treemap shows. Remove component and associated layout.

### B.5 Acceptance criteria

- [ ] Each Track has distinct color (per grouped color families)
- [ ] Mouseover tooltips reveal full Track details
- [ ] Click cell → drills to Member list filtered by Track
- [ ] Member list links to fixture profile (per Block G)
- [ ] Summary blocks removed
- [ ] Sub-filter responsiveness preserved

---

## Block C — Geographic redesign

### C.1 Replace spatial map with three-region bar lists

Current state: Custom SVG spatial map with 28 markers. Visual review noted: spatial approximation doesn't add value; bankers/EVP need organized navigation, not geographic positioning.

New state: Three-region grouping with alphabetical bar lists per region. Drop the spatial SVG component entirely.

### C.2 Region groupings

**Twin Cities Metro (20 branches, alphabetical):**
Anoka, Apple Valley, Bloomington, Brooklyn Park, Burnsville, Coon Rapids, Cottage Grove, Eagan, Eden Prairie, Edina, Lakeville, Maple Grove, Minneapolis Downtown, Minnetonka, Plymouth, Roseville, Shakopee, St. Paul Downtown, Stillwater, Woodbury

**Northern Minnesota (6 branches, alphabetical):**
Milaca, Mora, Ogilvie, Pine City, Princeton, St. Cloud

**Southern Minnesota (2 branches, alphabetical):**
Rochester, Waseca

### C.3 Per-branch bar visualization

Each region renders as a labeled section with horizontal bars per branch:

```
TWIN CITIES METRO
Anoka                  ▓▓▓▓                  4 Members · $1.2M
Apple Valley           ▓▓▓▓▓▓                6 Members · $1.8M
Bloomington            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 20 Members · $14M
Brooklyn Park          ▓▓▓▓▓▓▓▓               8 Members · $3.2M
...

NORTHERN MINNESOTA
Milaca                 ▓                      2 Members · $400K
Mora                   ▓                      1 Member · $250K
...

SOUTHERN MINNESOTA
Rochester              ▓▓▓▓▓▓▓▓▓              9 Members · $2.7M
Waseca                 ▓▓▓                    3 Members · $900K
```

Bar length proportional to pipeline value (within region scale). Label shows Member count and pipeline value.

### C.4 Click-through to Member list

Click any branch row → drills to Members at that branch. Same drill-down pattern as Block B.

### C.5 Color coding

Optional: bars color-coded by conversion rate (green = high conversion 12-month, yellow = medium, red-orange = low). Same scale as the previous spatial map but applied to bar fills.

If color coding adds visual noise, default to single accent color for bars (simpler, cleaner).

CC chooses; document choice in BUILD_LOG.

### C.6 Acceptance criteria

- [ ] Spatial SVG map removed
- [ ] Three regions rendered as sections (Twin Cities Metro / Northern Minnesota / Southern Minnesota)
- [ ] Branches within each region in alphabetical order
- [ ] Bar lengths proportional to pipeline value
- [ ] Member count and pipeline value visible per branch
- [ ] Click branch row → drills to Member list at that branch
- [ ] Sub-filter responsiveness preserved (filtering by Track or Member-Type updates per-branch counts)

---

## Block D — Banker activity enlargement + cell drill-through

### D.1 Visual enlargement

Current state: 14 bankers × 90 days heatmap renders in compressed area. Cells small; visualization doesn't fill available canvas width.

New state: Heatmap fills the canvas width. Each cell wider (target ~10-14px wide). Total visualization takes substantially more vertical space (target 70% of canvas height; rest for legend + labels).

Maintain banker row labels at left; day labels at bottom (or top); legend below.

### D.2 Cell-level drill-through

Current state: Cells are visual only; no click interaction.

New state: Click cell (banker × day) → drills to "Accounts touched on this day":

```
Sarah Chen — May 4, 2026 — 8 events

ACCOUNTS TOUCHED THAT DAY
→ Headwaters Precision (specialty_manufacturer · SBA 504 · Measure)
   2 captures: Capacity utilization 87%, Owner-occupancy confirmed
→ Lakeshore Accounting Group (professional_services · CRE Term Loan · Consult)
   1 capture: Cashflow projection model shown
→ Selby Avenue Bakery (food_services · Equipment & Machinery · Discover)
   ...
```

Click Member name in drill-down → routes to fixture profile (per Block G).

### D.3 Vacation gap legibility

Per Stage 4 Section 3.2, several bankers have vacation gaps. With enlarged cells, these read more clearly. No additional work needed beyond enlargement.

### D.4 Acceptance criteria

- [ ] Heatmap fills canvas width
- [ ] Cells visibly wider (~10-14px)
- [ ] Click cell → drills to Accounts touched that day
- [ ] Drill-down shows Member name + Member-Type + Track + phase + events captured
- [ ] Member clicks route to fixture profile (per Block G)
- [ ] Banker row labels and day labels remain legible
- [ ] Sort order preserved (highest 90-day activity first)

---

## Block E — Temporal momentum removal

### E.1 Remove visualization view

Drop the Temporal momentum filter tag and view entirely:
- Remove "Temporal momentum" tag from filter tag row
- Remove `TemporalMomentumView.tsx` component
- Remove view from `MainCanvas.tsx` dispatch
- Remove `?view=temporal-momentum` URL state handling
- Default view remains Phase funnel (current behavior)

### E.2 Filter tag row layout

Filter tag row reduces to 4 visualization tags (Phase funnel / Lending product mix / Geographic / Banker activity). Layout naturally shifts; no additional spacing work needed.

### E.3 Code cleanup

Remove unused imports and data wiring for temporal momentum:
- Daily activity stream data (Stage 4 outputs) may still be used by other views (banker activity uses per-banker per-day data); preserve those
- Featured temporal events (Stage 4 Section 6) currently surface only in temporal momentum; can be deprecated or preserved in case Sprint 7b adds a sophisticated authorship pipeline view
- Time-window comparison cards (Stage 5 Section 11.3) currently in temporal momentum; remove

### E.4 Acceptance criteria

- [ ] Temporal momentum tag removed from filter row
- [ ] Component removed
- [ ] URL state for ?view=temporal-momentum no longer recognized (returns to default view or graceful redirect)
- [ ] No console errors or broken imports
- [ ] Featured temporal events data preserved for potential Sprint 7b use (or documented as deprecated in BUILD_LOG)

---

## Block F — Featured deal tile pattern content + rename

### F.1 Rename "originating capture" to "first member signal"

Replace label "ORIGINATING CAPTURE" with "FIRST MEMBER SIGNAL" throughout the featured deal tile.

Plain-language framing more banker-natural; clarifies what the field represents (the Signal that started the cultivation arc, not a generic "capture").

### F.2 Show actual Pattern content (not just Pattern label)

Current state: "Key insights along the way" section shows pattern labels like:
- → Capacity-as-lost-revenue reframe (Day 8)
- → Aging equipment compounding implication (Day 21)

Pattern labels are abstract. They name a category without showing the actual reframe content the banker authored or matched against.

New state: Each "Key insight" row shows actual Pattern content from the Pattern library. Pattern label appears as small caption above; rewritten reframe/implication text appears below as primary content.

Example rendering:

```
KEY INSIGHTS ALONG THE WAY

REFRAME · Day 8
"When operational capacity caps demand, every customer the
business turns away today is one a competitor builds a
relationship with — those customers don't recover later."

IMPLICATION · Day 21
"An equipment failure that triggers a financing conversation is
rarely about the failed unit — it is the moment the broader
fleet question becomes unavoidable."
```

### F.3 Pattern content lookup

For each featured deal, identify which Patterns the banker matched against (per Stage 3 Section 6.2 — insights authored per deal).

Pattern content lookup:
- Look up Pattern by ID in `InsightPattern` records
- Use `content` field as the displayed text
- If `content` field has been rewritten per Sprint 5d Section 8, use the rewritten version

For featured deal 3 (North Star Construction, $245K Equipment & Machinery, 68 days):
- Day 8 reframe matches PATTERN-010 (capacity_limit reframe): "When operational capacity caps demand, every customer the business turns away today is one a competitor builds a relationship with — those customers don't recover later."
- Day 21 implication matches PATTERN-013 (equipment_breakdown implication): "An equipment failure that triggers a financing conversation is rarely about the failed unit — it is the moment the broader fleet question becomes unavoidable."

For the other 4 featured deals, identify corresponding Patterns and apply same treatment.

### F.4 Visual treatment

Each insight in the tile:
- Pattern type chip (small, muted) — "REFRAME" / "IMPLICATION" / etc.
- Day annotation (small) — "Day 8" / "Day 21"
- Pattern content (primary text — italic if it's a direct quote from the canonical Pattern; regular weight if banker-authored variation)

Pattern content should breathe — generous line height, comfortable reading width.

### F.5 Acceptance criteria

- [ ] "ORIGINATING CAPTURE" relabeled to "FIRST MEMBER SIGNAL"
- [ ] Key insights show actual Pattern content (not just labels)
- [ ] Pattern type chip and day annotation render above content
- [ ] All 5 featured deals updated with Pattern content lookup
- [ ] Content text feels banker-natural and demo-compelling
- [ ] Visual treatment breathes (line height, margins)

---

## Block G — Synthetic Member → fixture link routing

### G.1 Routing logic

When a Member name is clicked anywhere in the dashboard (drill-down lists, featured deal tile, banker activity drill, etc.):

**If Member is one of 4 fixtures (Jenny / Northland / Cygnus / Riverside):**
- Link to their actual growth conversation page (existing behavior)

**If Member is one of 216 synthetic Members:**
- Link to one of the 4 fixture detail pages as "representative example"
- Page surfaces a notation: "Sample conversation arc — representative example for [Member-Type]"

### G.2 Fixture mapping for synthetic Members

Map synthetic Member to fixture by Member-Type for closest representation:

| Synthetic Member-Type | Maps to fixture |
|---|---|
| event_services | Jenny's Catering |
| maintenance_services | Northland HVAC |
| specialty_manufacturer | Cygnus Bioscience |
| professional_services | Cygnus Bioscience (closest analog for complex multi-party Track) |
| healthcare_services | Cygnus Bioscience (CRE / SBA 504 patterns similar) |
| food_services | Jenny's Catering (seasonality patterns) |
| retail | Jenny's Catering (smaller business, mixed-Track patterns) |
| construction | Northland HVAC (vehicle/equipment patterns) |

If Riverside Catering's stage-skip pattern is being demonstrated, link there instead.

### G.3 Representative example notation

When user lands on a fixture page from a synthetic Member click, surface a notation at the top of the page:

> Sample conversation arc — representative example for [Member-Type]. 
> The full pipeline includes 216 Members; this is a detailed example of 
> a typical cultivation pattern.

Notation should be:
- Visually subtle (small banner or note, not heavy)
- Easily dismissible (X button to hide for current session)
- Honest about the demo state without breaking the demo flow

### G.4 URL handling

URL pattern: `/v2/members/[fixture-id]?representative_of=[synthetic-member-name]&example_for=[member-type]`

When `representative_of` query parameter present, surface the notation. Otherwise, page renders normally (existing behavior for direct fixture navigation).

### G.5 Click implementation across surfaces

Apply Member-click routing to:
- Phase funnel drill-down Member lists
- Lending product mix drill-down Member lists
- Geographic drill-down Member lists (per Block C)
- Banker activity drill-down Member lists (per Block D)
- Featured deal tile (deal Member name clickable)
- Any other Member references in dashboard surfaces

### G.6 Acceptance criteria

- [ ] Fixture Member clicks route to actual growth conversation pages (preserved)
- [ ] Synthetic Member clicks route to mapped fixture page
- [ ] Representative example notation surfaces when query parameter present
- [ ] Notation dismissible
- [ ] URL pattern includes representative_of and example_for parameters
- [ ] Mapping logic per Section G.2 implemented
- [ ] All Member references across dashboard surfaces support click routing

---

## Block H — Hero metric calibration + governance

### H.1 Members in cultivation calibration (216 → 220)

Current state: Hero metric reads 216 (synthetic Members only, excluding the 4 Prisma fixtures).

New state: Aggregate Prisma fixtures + synthetic generator output for total count. Hero metric reads 220.

Same aggregation applies to other count-based metrics:
- Members in cultivation: 216 + 4 = 220
- Pipeline value: aggregate sized_opportunity_amount across all 220
- Conversations this week: aggregate fixtures + synthetic
- Insights this week: aggregate fixtures + synthetic (also affected by Block H.2 calibration)

### H.2 Insights this week calibration (~88 → ~51)

Stage 5 Section 1.1 specified 51 insights/week for hero metric. Sprint 7a generator currently produces ~88/week.

Diagnosis path: trace insight authorship daily distribution in synthetic data generator. Stage 4 Section 2.1 baseline says 10 insights/day average × 5 weekdays = 50/week. Current generator likely produces too many insights per banker per day, or applies day-of-week pattern incorrectly.

Fix: adjust generator distribution constants so insights authored per day average ~10/day (mostly weekdays, light weekend). Total weekly insights land near 51.

### H.3 Acceptance criteria

- [ ] Members in cultivation displays 220
- [ ] Other count-based metrics aggregate fixtures + synthetic
- [ ] Insights this week metric calibrated to ~51 (acceptable range 48-55)
- [ ] Sparklines reflect calibrated values
- [ ] Filter-responsive metric calculations still work (filter to TRACK-008 → recomputed correctly)

### H.4 BUILD_LOG entry

Sprint 7a-patch entry covering:
- Phase funnel clarification + sparkline drop
- Lending product mix recolor + drill-through
- Geographic redesign (spatial → three-region bar lists)
- Banker activity enlargement + cell drill
- Temporal momentum removal
- Featured deal pattern content + rename
- Synthetic Member → fixture routing
- Hero metric calibration (216 → 220; insights 88 → ~51)

### H.5 OPEN_QUESTIONS amendments

- Q-F4: "Geographic spatial visualization deferred. Three-region bar list provides actionable navigation. Pilot may want real basemap with branch markers for sales planning."
- Q-F5: "Temporal momentum dropped from dashboard. Sprint 7b's insight authorship pipeline may provide a more sophisticated temporal view."
- Q-F6: "Representative example notation when synthetic Members route to fixture pages. Pilot needs real Member detail pages for full deployment."

### H.6 Acceptance criteria

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] No regression on existing dashboard functionality

---

## Pilot deferrals to honor

Sprint 7a-patch does not ship:
- Sprint 7b drill-down views (Member-Type matrix, conversion-per-pathway, handoff velocity, Sankey flow, insight authorship pipeline, business type filter)
- Real Member detail pages for synthetic Members
- Real basemap geographic visualization
- Insight authorship pipeline view (potential replacement for temporal momentum)

---

## Reporting back

When Sprint 7a-patch is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Visual probes:
   - Phase funnel with clarifying subhead and dropped sparkline
   - Lending product mix with distinct per-cell colors and click-through to Member list
   - Geographic with three-region alphabetical bar lists
   - Banker activity enlarged with cell drill-through
   - Filter tag row with 4 tags (Temporal momentum removed)
   - Featured deal tile with actual Pattern content for at least 3 of 5 featured deals
   - Synthetic Member click → routes to fixture page with representative example notation
   - Hero metric "Members in cultivation" reads 220
   - Hero metric "Insights this week" reads ~51
3. Sample URL: paste a URL representing "Lending product mix filtered to SBA 504 with drill-down showing Member list" to verify state encoding
4. Any deviations from spec with rationale

After Sprint 7a-patch ships and visual review confirms, Sprint 6 (polish + production deploy) ships next.

---

## Estimated scope

1.5-2 effective build days CC time.

Largest blocks:
- **Block F (featured deal tile Pattern content)** — Pattern lookup across 5 deals + visual treatment; ~0.5 day CC
- **Block C (Geographic redesign)** — replace spatial map with three-region bar lists; ~0.5 day CC
- **Block G (synthetic Member → fixture routing)** — routing logic + notation + URL handling; ~0.25-0.5 day CC
- **Block B (Lending product mix recolor + drill)** — recoloring + drill implementation; ~0.25 day CC
- **Block D (Banker activity enlargement + cell drill)** — visual sizing + cell-level interaction; ~0.25 day CC

Smaller blocks (A, E, H) are routine.
