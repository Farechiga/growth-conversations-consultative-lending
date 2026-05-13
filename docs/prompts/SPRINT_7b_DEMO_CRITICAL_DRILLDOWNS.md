# Sprint 7b — Demo-Critical Drill-down Views

**Prompt for Claude Code. Single sprint. Three new dashboard drill-down views integrated into the existing Insight Engine surface. Member-Type × Track matrix with applicability overlay, Conversion-per-pathway funnel small multiples with click-to-zoom, Sankey banker→specialist→closure flow with cohort selection. Estimated 3-4 effective build days CC time.**

## Pre-flight context

Sprint 7a + 7a-patch + Sprint 8 + Sprint 9 + Patches A-E shipped successfully. Dashboard now has 4 working drill-downs (Phase funnel, Lending product mix, Geographic, Banker activity). The 4 fixtures + 216 synthetic Members produce a rich demo data set. Applicability matrix (Patch E) locks which Tracks are typical for each Member-Type.

Sprint 7b adds three additional drill-down views, each demo-critical for the EVP demo:

1. **Member-Type × Track matrix** — shows segmentation power across the 8 Member-Types and 10 Tracks
2. **Conversion-per-pathway funnels** — shows where the cultivation cycle converts (or doesn't) for each Track
3. **Sankey banker → specialist → closure flow** — shows the architecture of how consultative conversations convert through the handoff process

These three were chosen as the demo-gold subset. Drill-downs 3 (handoff velocity), 5 (insight authorship pipeline), and 6 (business type filter view) deferred to post-demo enhancement.

Sprint 7b is the largest sprint since Sprint 9. Each drill-down is substantial. Sankey in particular has real implementation complexity. Playwright verification loop established through Patches C/D/E should hold here.

**Read these governance documents before starting:**

1. Existing Insight Engine implementation: `app/v2/insight-engine/`
2. Existing drill-down patterns: how Sprint 7a-patch implemented phase funnel, lending product mix, geographic, banker activity
3. Filter tag row component: how filters are encoded and applied
4. URL state encoding pattern: how existing views handle `?view=...` params
5. Stage 2-5 synthetic data spec: which fields produce the data each drill-down needs
6. Applicability matrix from Patch E: `prisma/seed-matrix.ts` (or equivalent)
7. Existing Member list drill-down component: how Sprint 7a-patch implemented click-to-Member-list pattern

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked through earlier conversation):**

Sprint 7b scope: drill-downs 1, 2, 4 only. Drill-downs 3, 5, 6 deferred.

**Drill-down 1 — Member-Type × Track matrix:**
- Cell content: toggle between count and pipeline value
- Visual treatment: heatmap color intensity
- Applicability overlay: yes — flag uncommon-but-occurring intersections per Patch E matrix

**Drill-down 2 — Conversion-per-pathway funnel:**
- Layout: all 10 small multiples side-by-side (2 rows × 5 columns)
- Click any small funnel → opens modal/popup with full-scale detailed view
- Numbers shown: stage-to-stage retention percentage in display; absolute counts in tooltips
- Drill behavior: click a stage in zoom view → drill to Member list filtered to (Track, Stage)

**Drill-down 4 — Sankey flow:**
- Layers: Bankers → Specialists → Closure outcomes (closed-won, closed-lost, still-active)
- Banker visibility: cohort dropdown showing 5-per-cohort ("Top 5 / 6-10 / 11-15 / ...")
- Banker ranking metric: closed pipeline value (last 12 months)
- Library: d3-sankey
- One cohort renders at a time; user navigates dropdown to see other cohorts

**Filter and URL integration:**
- All three drill-downs respect existing filter row (Track / Member-Type / Phase)
- URL state encodes view selection and cohort selection
- Browser back works correctly

## What ships in this sprint

Eleven blocks across four phases. Single checkpoint.

**Phase 1 — Foundation:**
- **Block A — Filter tag row updates.**
- **Block B — URL state schema additions.**

**Phase 2 — Drill-down 1 (Member-Type × Track matrix):**
- **Block C — Matrix data aggregation.**
- **Block D — Heatmap visualization component.**
- **Block E — Applicability overlay and drill-through.**

**Phase 3 — Drill-down 2 (Conversion funnels):**
- **Block F — Funnel data aggregation per Track.**
- **Block G — Small multiples layout.**
- **Block H — Zoom modal with drill-through.**

**Phase 4 — Drill-down 4 (Sankey flow):**
- **Block I — Sankey data aggregation with cohort logic.**
- **Block J — Sankey visualization component (d3-sankey).**
- **Block K — Cohort dropdown and verification.**

Sprint 7b does NOT ship: Drill-downs 3, 5, 6; changes to existing drill-downs; changes to artifact visualizations; production deployment.

---

## Block A — Filter tag row updates

### A.1 Add three new visualization tags

Filter tag row currently has 4 visualization tags (Phase funnel / Lending product mix / Geographic / Banker activity). Add three more:

- **Member-Type matrix**
- **Conversion funnels**
- **Banker flow** (or "Banker-Specialist flow" — CC judgment on naming for readability)

Total filter tag row: 7 visualization tags.

### A.2 Layout

Tag row may need slight responsive adjustment to accommodate 7 tags. Two acceptable patterns:
- (a) Single row that wraps gracefully if narrow
- (b) Single row with horizontal scroll if needed

CC chooses based on existing patterns. The Insight Engine canvas is typically wide enough to handle 7 tags inline.

### A.3 Default view

Default view remains Phase funnel (existing behavior). New views accessible by clicking their tags.

### A.4 Acceptance criteria

- [ ] 3 new visualization tags added to filter row
- [ ] All 7 tags toggle correctly between views
- [ ] Layout readable across reasonable screen widths
- [ ] No regression on existing 4 drill-downs

---

## Block B — URL state schema additions

### B.1 New view values

Add to URL state schema (`?view=...`):
- `?view=member-type-matrix` (Drill-down 1)
- `?view=conversion-funnels` (Drill-down 2)
- `?view=banker-flow` (Drill-down 4)

### B.2 Additional URL parameters

**For Member-Type matrix:**
- `?metric=count` or `?metric=value` for cell content toggle
- Default: `count`

**For Conversion funnels:**
- `?focus_track=TRACK-NNN` when zoom modal is open
- No param when small multiples view

**For Banker flow:**
- `?cohort=top-5` or `?cohort=6-10` etc.
- Default: `top-5`

### B.3 Browser back behavior

All URL state changes (toggling metric, opening zoom modal, switching cohort) should push browser history correctly. Back button returns to previous state.

### B.4 Cross-filter parameters

Existing filter parameters (`?track=...`, `?member_type=...`, `?phase=...`) continue to apply to new views per Block C/F/I aggregation logic.

### B.5 Acceptance criteria

- [ ] New URL view values handled correctly
- [ ] State parameters (metric, focus_track, cohort) encoded and decoded
- [ ] Browser back works through URL state changes
- [ ] Existing filter params apply to new views

---

## Block C — Matrix data aggregation

### C.1 Data aggregation

For each (Member-Type, Track) intersection, aggregate:
- Member count
- Total pipeline value (sized opportunity sum)

Aggregation source: 220 Members (4 fixtures + 216 synthetic). Each Member contributes to their primary Track plus secondary Tracks (Sprint 8 Block G for fixtures; synthetic Members typically single-Track).

Stage 2 synthetic data has Member counts per (Member-Type, Track) intersection already specified. Verify aggregation matches.

### C.2 Cell structure

```typescript
type MatrixCell = {
  member_type: string;
  track_id: string;
  member_count: number;
  pipeline_value: number;
  is_applicable: boolean;  // from Patch E applicability matrix
  has_data: boolean;       // member_count > 0
};
```

### C.3 Filter application

When filter row applies a filter (e.g., user selects Phase = "Consult"):
- Matrix recomputes to show only Members in that Phase
- Cells update; some may go to zero
- Title or subtitle updates: "Filtered: Members in Consult phase"

### C.4 Acceptance criteria

- [ ] Per-intersection aggregation correct against Stage 2 expectations
- [ ] All 80 cells (8 Member-Types × 10 Tracks) populated
- [ ] is_applicable field correctly references Patch E matrix
- [ ] Filter row changes recompute aggregations

---

## Block D — Heatmap visualization component

### D.1 Component structure

New component: `MemberTypeMatrixView.tsx`

Renders an 8-row × 10-column matrix:
- Rows: 8 Member-Types (event_services, maintenance_services, specialty_manufacturer, professional_services, healthcare_services, food_services, retail, construction)
- Columns: 10 Tracks (TRACK-001 through TRACK-011 except missing IDs)
- Cells: heatmap color intensity proportional to value

### D.2 Color intensity scale

Color: warm Blaze accent (`afterState` from palette) at full intensity for max cell. Linear scale to white (or background) for zero cell.

Acceptable: use HSL or RGB interpolation to produce visually pleasing gradient.

Color scale recomputes when toggle switches between count and value, since the magnitudes are different.

### D.3 Toggle UI

Above or alongside the matrix:

```
Show: [Member count] [Pipeline value]
```

Toggle buttons; clicking switches the metric. URL state encodes selection.

When metric = "value", cell labels show `$X.XM` or `$XXXK` formatted.
When metric = "count", cell labels show integer count.

### D.4 Cell labels

Each cell shows the value (count or formatted dollar). Font color must contrast against cell background — for high-intensity cells, white text; for low-intensity cells, dark text.

### D.5 Axis labels

- Y-axis labels (Member-Types): clear, full names (e.g., "Event services", "Maintenance services", "Specialty manufacturer"). Use the readable display names, not the slug.
- X-axis labels (Tracks): clear, short Track names. Truncate to 12-15 characters where needed; full name in tooltip.
- Both axes left-readable and bottom-readable (matrix structure).

### D.6 Hover tooltip

On cell hover, show:
- Full Member-Type name
- Full Track name
- Both count and pipeline value (regardless of toggle state)
- Applicability flag: "Typical for this Member-Type" or "Uncommon for this Member-Type"

### D.7 Acceptance criteria

- [ ] Matrix renders 8×10 cells correctly
- [ ] Heatmap color intensity proportional to value
- [ ] Toggle between count and value updates display and rescales colors
- [ ] Cell labels readable across full intensity range
- [ ] Axis labels clear
- [ ] Hover tooltips show full detail

---

## Block E — Applicability overlay and drill-through

### E.1 Applicability visual treatment

Two types of cells distinguish themselves visually:
- **Applicable cells** (Member-Type IS in Track's applicability list per Patch E matrix): render normally with full color intensity
- **Inapplicable cells** (Member-Type NOT in Track's applicability list) where data still exists: render with visual flag

Visual flag options for inapplicable cells with data:
- (a) Dashed border around cell
- (b) Diagonal stripe pattern overlaid on color
- (c) Smaller cell footprint within the grid space

My recommendation: **(a) dashed border**. Simplest, clearest semantic. CC chooses if better option emerges during implementation.

Inapplicable cells with zero data: render as empty/blank (no color), no special flag needed.

### E.2 Applicability legend

Below the matrix, add small legend:

```
Cell color intensity: relative magnitude of [count / pipeline value]
Dashed border: uncommon for this Member-Type per typical lending product fit
```

### E.3 Drill-through behavior

Click any cell with data → drill to Member list filtered to that (Member-Type, Track) intersection.

Member list shows:
- Member name (clickable per Sprint 7a-patch Block G routing)
- Current phase
- Sized opportunity
- Banker
- Branch

Inapplicable cells with data are particularly demo-interesting — click reveals the "unusual cases" Members that bankers should understand specifically.

### E.4 Acceptance criteria

- [ ] Applicable cells render normally
- [ ] Inapplicable cells with data render with dashed border (or chosen treatment)
- [ ] Inapplicable cells without data render blank
- [ ] Legend explains visual treatment
- [ ] Click cell → drill to filtered Member list
- [ ] Inapplicable cell drill-through works correctly

---

## Block F — Funnel data aggregation per Track

### F.1 Per-Track funnel data

For each of 10 Tracks, aggregate Members across the 5 stages:
- Discover: Members currently at Discover phase for this Track
- Measure: Members currently at Measure phase
- Consult: Members currently at Consult phase
- Navigate: Members currently at Navigate phase
- Closed (12mo): Closed deals for this Track in last 12 months (from Stage 3 synthetic data)

Stage-to-stage retention percentages:
- Measure retention = (Measure + Consult + Navigate + Closed) / (Discover + Measure + Consult + Navigate + Closed)
- Consult retention = (Consult + Navigate + Closed) / (Measure + Consult + Navigate + Closed)
- Navigate retention = (Navigate + Closed) / (Consult + Navigate + Closed)
- Close retention = Closed / (Navigate + Closed)

These represent "what % of Members at this stage progress to the next stage." Higher is better.

### F.2 Filter application

When filter row applies a filter (e.g., user selects Member-Type = "specialty_manufacturer"):
- Each Track funnel recomputes to show only Members of that Member-Type
- Some funnels may go to near-zero (Tracks where the Member-Type has few Members)
- Title or subtitle updates: "Filtered: specialty_manufacturer Members"

### F.3 Acceptance criteria

- [ ] Per-Track funnel data correctly aggregated
- [ ] Stage-to-stage retention percentages computed correctly
- [ ] Closed (12mo) draws from Stage 3 closed deals data
- [ ] Filter row changes recompute funnels

---

## Block G — Small multiples layout

### G.1 Component structure

New component: `ConversionFunnelsView.tsx`

Renders 10 small funnels in a 2-row × 5-column grid (responsive at narrower widths; could become 5×2 or other layouts).

Each small funnel:
- Track name as small header
- Vertical funnel shape (5 stages stacked)
- Stage labels: Discover / Measure / Consult / Navigate / Closed
- Stage widths proportional to Member count at that stage
- Stage-to-stage retention % displayed next to or below each transition

### G.2 Visual treatment

Funnel color: warm Blaze accent (`afterState`) for the funnel body. Subtle gradient or solid color — CC judgment.

Retention percentages displayed in muted text, smaller than stage labels.

Funnel sizing: each small funnel takes ~150-200px wide × ~250-300px tall in default layout.

### G.3 Hover/tooltip

On hover over any stage of a small funnel:
- Stage name
- Absolute Member count
- Retention from previous stage
- Track name

### G.4 Visual proportion across funnels

Each Track funnel uses its own internal scale (stage widths relative to that Track's max). Don't normalize across Tracks (which would make small-volume Tracks look identical in shape).

The relative magnitudes between funnels can be conveyed through the Track name and "Discover stage count" label rather than overall funnel size.

### G.5 Acceptance criteria

- [ ] 10 small funnels render in grid layout
- [ ] Each funnel shows 5 stages with proportional widths
- [ ] Retention percentages displayed clearly
- [ ] Hover tooltips show full detail
- [ ] Filter row changes recompute and re-render

---

## Block H — Zoom modal with drill-through

### H.1 Modal trigger

Click any small funnel → opens modal/popup with full-scale single funnel view.

Modal renders the same Track's funnel at significantly larger scale (e.g., 600-800px wide × 500px tall).

### H.2 Zoom modal content

Full-scale funnel includes:
- Track name as prominent header
- Larger funnel rendering
- Each stage labeled with:
  - Stage name
  - Member count at stage
  - Retention percentage from previous stage
  - Clickable affordance to drill to Member list
- Below the funnel: total Members in this Track's cultivation (sum across stages), total closed value 12mo, average cycle time if computed

### H.3 Drill-through behavior

Click any stage in zoom modal → drill to Member list filtered to (Track, Stage).

Member list shows:
- Member name (clickable)
- Member-Type
- Sized opportunity
- Banker
- Days at current stage (if available from Stage 4 daily activity data)

### H.4 Modal navigation

Modal has:
- Close button (returns to small multiples view)
- "Show another Track" affordance — optional dropdown or arrows to switch zoom to different Track without closing modal

### H.5 URL state

Opening modal pushes URL state: `?view=conversion-funnels&focus_track=TRACK-NNN`

Closing modal returns to `?view=conversion-funnels`

Browser back from zoom modal closes modal and returns to small multiples view.

### H.6 Acceptance criteria

- [ ] Click small funnel opens zoom modal
- [ ] Zoom modal renders full-scale funnel
- [ ] Drill-through from stage to Member list works
- [ ] Modal can be closed
- [ ] URL state encodes focus_track param
- [ ] Browser back works through modal state

---

## Block I — Sankey data aggregation with cohort logic

### I.1 Banker ranking

Compute "closed pipeline value (last 12 months)" per banker. Stage 3 synthetic data has 100 closed deals with banker attribution; sum closed value per banker.

Rank bankers descending by closed pipeline value. The Top 5 are the highest-value-closing bankers; 6-10 are the next tier; etc.

For demo with 14 bankers: ranks produce Top 5, 6-10, 11-14 (last cohort has 4 bankers; that's fine).

For Pilot scale (50+ bankers): same ranking logic produces more cohorts (Top 5, 6-10, 11-15, ..., 46-50). Cohort dropdown shows all available cohorts based on actual banker count.

### I.2 Cohort selection

Cohort dropdown lists available cohorts:
- Top 5
- 6-10
- 11-15
- 16-20
- ...etc, based on total banker count

User selects one cohort. Sankey renders flows for those 5 bankers (or fewer if it's the last partial cohort).

### I.3 Sankey data per cohort

For the selected cohort of bankers, aggregate flow data across three layers:

**Layer 1 — Banker nodes:** Each banker in the cohort is one node.

**Layer 2 — Specialist nodes:** Each specialist who received handoffs from these bankers. Specialists are surfaced from Stage 1 banker data and Stage 3 closed deal data (e.g., SBA specialist, CDC partner, sector specialist, treasury team, lending committee, etc.).

For demo, specialist roles are:
- SBA specialist
- CDC partner
- Sector specialist (skilled trades)
- Sector specialist (manufacturer)
- Treasury team
- Lending committee

(CC may need to derive this from existing data; if specialist concept doesn't exist explicitly, surface as architectural gap and propose handling.)

**Layer 3 — Closure outcome nodes:** Three nodes:
- Closed-won
- Closed-lost
- Still-active

**Flow widths:** Proportional to deal count (or value — see Section I.4) flowing through each path.

### I.4 Flow magnitude

Two options for flow width:
- (a) Deal count flowing through each path
- (b) Pipeline value flowing through each path

My recommendation: **(b) pipeline value**. Aligned with the "closed pipeline value" ranking metric. EVP perspective.

Acceptable: include a toggle if implementation supports both metrics. CC judgment.

### I.5 Edge cases

- Banker with no handoffs: Their node still renders but with no outflows. Worth flagging in tooltip ("This banker has no specialist handoffs in the cohort window.")
- Specialist with no closed outcomes yet: Their node renders flowing to "Still-active" outcome.
- Closed-lost outcomes: Real and informative; render in Sankey alongside closed-won.

### I.6 Acceptance criteria

- [ ] Bankers ranked by closed pipeline value
- [ ] Cohort selection produces correct subset
- [ ] Specialist nodes derived correctly
- [ ] Three closure outcome nodes
- [ ] Flow magnitudes proportional to pipeline value (or count per CC choice)
- [ ] Edge cases handled gracefully

---

## Block J — Sankey visualization component (d3-sankey)

### J.1 Dependencies

Install d3-sankey if not already present. Standard library; safe addition.

### J.2 Component structure

New component: `BankerFlowView.tsx`

Renders Sankey diagram with:
- 5 banker nodes (left side)
- ~5-6 specialist nodes (middle)
- 3 closure outcome nodes (right side)
- Flows between layers as paths with width proportional to magnitude

### J.3 Visual treatment

- Banker nodes: warm Blaze accent (`afterState`)
- Specialist nodes: deep teal (`wealth`) — distinct mid-layer accent
- Closure outcome nodes:
  - Closed-won: `benefit` (muted green)
  - Closed-lost: `cost` (muted red)
  - Still-active: `beforeState` (muted slate)
- Flow paths: gradient from source node color to target node color, or use single muted color for all flows

### J.4 Labels

- Each banker node labeled with banker name + closed pipeline value
- Each specialist node labeled with specialist role
- Each closure outcome node labeled with "Closed-won / Closed-lost / Still-active" + aggregate value flowing into that outcome

### J.5 Hover/interaction

- Hover over any node: highlight all flows passing through that node; tooltip shows aggregate value
- Hover over any flow: highlight that path; tooltip shows source banker, specialist, outcome, and value

### J.6 Cohort indicator

Above the Sankey, show the currently-selected cohort prominently:

```
Top 5 bankers — closed pipeline value last 12 months
```

This contextualizes the Sankey clearly.

### J.7 Acceptance criteria

- [ ] Sankey renders with 3 layers
- [ ] Node colors per palette
- [ ] Flow widths proportional to magnitude
- [ ] Labels clear on all nodes
- [ ] Hover interactions work
- [ ] Cohort indicator visible

---

## Block K — Cohort dropdown and verification

### K.1 Cohort dropdown UI

Above the Sankey component, render dropdown:

```
Cohort: [Top 5 ▼]
```

Dropdown options determined from total banker count divided by 5:
- Top 5
- 6-10
- 11-15
- ...

For demo (14 bankers): Top 5, 6-10, 11-14.

### K.2 Switching cohorts

When user selects different cohort:
- Sankey re-renders with new cohort's data
- URL state updates to `?cohort=...`
- Browser back works to return to previous cohort

### K.3 Filter interaction

Existing filter row (Track / Member-Type / Phase) affects the underlying data the Sankey draws from. Specifically:

When user filters by Track:
- Sankey shows only handoffs/closures for that Track
- Banker rankings recompute within the filter (different ranking emerges per Track)

When user filters by Member-Type:
- Sankey shows only flows involving Members of that type
- Banker rankings recompute

This is meaningful demo behavior — banker can filter to see "Top 5 bankers for SBA 504 closures" or "Top 5 for specialty_manufacturer Members."

### K.4 Verification

Run Playwright across:
- Default cohort (Top 5) renders correctly
- Switching to "6-10" cohort renders differently
- Filter row affects Sankey aggregation
- URL state encodes cohort selection

Save screenshots of each cohort + each filter combination tested.

### K.5 BUILD_LOG entry

Document:
- Sprint 7b implementation summary
- Three new drill-down views shipped
- d3-sankey dependency added
- Cohort logic ranking by closed pipeline value
- Specialist node derivation approach
- Any architectural decisions made during implementation

### K.6 Acceptance criteria

- [ ] Cohort dropdown lists correct options
- [ ] Selecting cohort re-renders Sankey
- [ ] URL state encodes cohort
- [ ] Filter row interactions work
- [ ] Playwright confirms all three new drill-downs
- [ ] BUILD_LOG entry comprehensive

---

## Reporting back

When sprint is complete, report back with:

1. Confirmation Blocks A-K shipped per acceptance criteria
2. Playwright screenshots:
   - Member-Type matrix in count mode
   - Member-Type matrix in value mode
   - Member-Type matrix with applicability overlay visible (uncommon cells with data flagged)
   - Conversion funnels small multiples view
   - Conversion funnel zoom modal for one Track
   - Sankey Top 5 cohort
   - Sankey 6-10 cohort
3. URL state encoding verification across all three views
4. Filter row integration verification across all three views
5. Per-drill-down architectural decisions:
   - Matrix: visual treatment for inapplicable cells (which option chosen)
   - Funnels: zoom modal navigation choice
   - Sankey: flow magnitude metric (value vs count) and specialist node derivation
6. Any deviations from spec with rationale
7. Note any places where data didn't match expectations and required adjustment

After this sprint ships and visual review confirms, next in Option C-1 sequence is Sprint 6 production deployment to Vercel.

---

## Estimated scope

3-4 effective build days CC time.

Per-drill-down breakdown:
- **Drill-down 1 (Member-Type matrix)** — Blocks C, D, E; ~1 day CC
- **Drill-down 2 (Conversion funnels)** — Blocks F, G, H; ~1 day CC
- **Drill-down 4 (Sankey)** — Blocks I, J, K; ~1.5 days CC (largest block due to d3-sankey integration and cohort logic)
- **Infrastructure** — Blocks A, B; ~0.25-0.5 day CC

After this sprint lands, sequenced next:
- **Sprint 6 production deployment** (deploy current state + Sprint 7b to Vercel)
- **DEMO_RUNBOOK review + demo rehearsal**

LinkedIn outreach to Cliff runs independently and can happen during or after this sprint.
