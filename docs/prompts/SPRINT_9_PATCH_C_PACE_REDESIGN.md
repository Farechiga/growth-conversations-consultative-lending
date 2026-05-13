# Sprint 9 Patch C — PACE Visualization Structural Redesign

**Prompt for Claude Code. Single patch. Restructure PaceMonthlySavingsChart so net positive cashflow is the visual hero. Replace current "assessment below zero / savings above zero" framing with stacked positive bars that reveal the after-PACE-ends cliff effect. Estimated 0.5 effective build day CC time.**

## Pre-flight context

Patch A+B shipped clean. Playwright verification confirmed 26/26 sidebar tiles render correctly and 25/25 dialogs are free of unsubstituted placeholders. Palette applied consistently across all 8 new visualizations.

Visual review of PaceMonthlySavingsChart after palette application identified a remaining structural issue separate from color. The current chart renders annual PACE assessment as negative bars BELOW the zero baseline, and energy savings as positive bars ABOVE. The "Net annual benefit" line traces through the middle.

The structural framing is backwards from what PACE actually offers. PACE financing turns ongoing energy expense into ongoing net cashflow benefit from day one. The current chart visually emphasizes the magnitude of the assessment (large bars below zero, dominant visual weight). The viewer's eye reads "this product costs a lot" rather than "this product creates ongoing positive cashflow."

The reframe needed: visualize the net positive cashflow result directly. Show that every year of the PACE term produces net benefit. After the PACE term ends, the chart should reveal a visible cliff effect where the assessment cost disappears and savings flow through entirely — making the long-term value of the improvements obvious.

Patch C redesigns the chart structure to communicate this. Color palette from Patch A+B preserved.

**Read these governance documents before starting:**

1. Existing component: `app/v2/members/[id]/artifact-visualizations/PaceMonthlySavingsChart.tsx`
2. Palette constants: `app/v2/members/[id]/artifact-visualizations/palette.ts`
3. ArtifactTemplate seed: `prisma/seed-artifact-templates.ts` for ARTIFACT-TEMPLATE-005 (TRACK-009 PACE)
4. Sprint 9 spec for original PACE parameter schema

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked):**

- Redesign approach: Option 1 — single positive bar with stacked breakdown of components
- Color palette from Patch A+B preserved: energy savings as `benefit` (muted green), assessment as `cost` (muted red), net benefit line as `afterState` (warm Blaze accent)
- After-PACE-ends cliff effect is the demo punchline; chart structure must reveal it
- No other visualization changes in this patch (Unsecured redesign is separate)
- Parameter schema for ARTIFACT-TEMPLATE-005 preserved; structural_content.type remains `pace_monthly_savings`
- The new structure should still communicate the assessment cost (transparency matters), but as a component within the net positive bar, not as a separate negative bar dominating the visual

## What ships in this patch

Five blocks. Single checkpoint.

- **Block 1 — Chart structure redesign.**
- **Block 2 — After-PACE-ends cliff treatment.**
- **Block 3 — Net benefit line refinement.**
- **Block 4 — Annotations and supporting text.**
- **Block 5 — Verification.**

This patch does NOT ship: changes to other Sprint 9 visualizations; changes to parameter schema; new annotation logic for charts other than PACE; the Unsecured chart redesign; Member-Type × Track applicability filtering.

---

## Block 1 — Chart structure redesign

### 1.1 New chart structure

The visualization renders a stacked bar chart where every bar sits above the zero baseline. No bars below zero.

**Per-year bar composition (during PACE term, years 1 through pace_term_years):**

Each year's bar shows the components of that year's cashflow improvement, stacked from bottom to top:

1. **Bottom segment — PACE assessment cost** (small portion of bar)
   - Color: `cost` (muted red from palette)
   - Height: annual PACE assessment amount (e.g., $4,476/year for the seeded scenario)
   - Represents: the cost of the financing this year
   
2. **Top segment — Net energy savings benefit** (larger portion of bar)
   - Color: `benefit` (muted green from palette)
   - Height: annual energy savings MINUS annual PACE assessment (the net positive benefit)
   - Represents: the cashflow improvement after paying the assessment

The total bar height = annual energy savings (the full benefit before considering the assessment cost).

**Visual reading:** "Here's your annual energy savings. Within that, here's the small slice that goes to PACE assessment. The rest is yours."

This is structurally different from the current chart. The current chart subtracts assessment from savings visually (separate bars above and below zero). The new chart shows savings as the full positive value, with assessment as a transparent component within it.

### 1.2 Annual aggregation vs. monthly

Current chart shows annual buckets, which is correct. Maintain annual aggregation (not monthly). 20-25 annual bars are visually manageable; 240-300 monthly bars would be unreadable.

X-axis: Year 1 through Year 25 (or whatever range matches `pace_term_years + 5` to show the post-term effect).

### 1.3 Pre-PACE state (year 0 baseline)

Worth considering: include a "Year 0 — current state" bar showing what the cashflow looks like WITHOUT any PACE intervention.

- Bar height: `0` (no savings, no assessment — baseline status quo)
- Color: `beforeState` (muted slate) — represents the do-nothing reference

If included, this bar provides visual context for "the alternative is doing nothing — and doing nothing gives you zero benefit."

CC decision: include Year 0 baseline if it strengthens the visual story without adding clutter. Document choice in BUILD_LOG.

### 1.4 Acceptance criteria

- [ ] Chart renders all bars above zero baseline (no negative bars)
- [ ] Each year's bar stacked: assessment cost (red, bottom) + net benefit (green, top)
- [ ] Total bar height = annual energy savings
- [ ] Year 0 baseline bar included if it strengthens the visual (CC choice, documented)
- [ ] Annual aggregation maintained (not monthly)

---

## Block 2 — After-PACE-ends cliff treatment

### 2.1 Post-term bar composition

For years after `pace_term_years` (e.g., years 21-25 for a 20-year PACE term):

- Each year's bar is **entirely green** (`benefit` color)
- Bar height = annual energy savings (same as during PACE term)
- No assessment segment (PACE has been paid off; no more assessment cost)

The visual contrast between during-PACE bars (mostly green with small red base) and post-PACE bars (entirely green, same total height) is the demo punchline. EVP sees: "during PACE you net most of the savings; after PACE you net ALL of them."

### 2.2 Cliff annotation

Add a vertical annotation line at the year PACE ends. The annotation should be visually present but not overwhelming.

Treatment:
- Vertical dashed line at `pace_term_years + 0.5` (between the last during-PACE year and the first post-PACE year)
- Color: `annotation` (warm Blaze accent) — matches Patch A+B palette
- Label above the line: "PACE paid off — savings flow through entirely"

The label should be clearly readable. If space is tight, shorten to "PACE term ends" with the explanation in the supporting annotation text below the chart.

### 2.3 Visual emphasis

The bars after the cliff should feel distinctly "more" than during-PACE bars, even though they're the same total height. Ways to enhance this visually (CC choice):

- Subtle drop shadow on post-PACE bars
- Slightly bolder green saturation post-cliff
- A "flow through" visual element (small arrow or indicator showing the savings going to cashflow)

If any of these add clutter, default to clean bars with the dashed line and label doing the work.

### 2.4 Acceptance criteria

- [ ] Post-PACE-term bars render entirely green (`benefit` color)
- [ ] Bar heights equal annual energy savings (no assessment component after term)
- [ ] Vertical dashed annotation at term-end year
- [ ] Annotation label readable
- [ ] Visual contrast between during-PACE and post-PACE bars is clearly visible to the eye

---

## Block 3 — Net benefit line refinement

### 3.1 Decision: keep or drop the net benefit line

Patch A+B added a "Net annual benefit" line traced across the chart in `afterState` (warm Blaze accent). With the new stacked-bar structure, this line is largely redundant — the green portion of each bar IS the net benefit.

Two options:

**Option (a) — Drop the net benefit line.** Cleaner visual. The green stacking already shows the net benefit per year. Removing the line reduces clutter.

**Option (b) — Keep the line but reframe.** Repurpose as a "cumulative net benefit" line on a secondary y-axis (right side). Shows total accumulated wealth from the energy improvements over the chart range. Useful but adds complexity.

My recommendation: **Option (a) — drop the line**. The stacked bars carry the message. Adding a cumulative line creates visual noise without clarifying anything.

CC may revisit if removing the line makes the chart feel sparse. Document the choice in BUILD_LOG.

### 3.2 Acceptance criteria

- [ ] Net annual benefit line removed (or repurposed per CC judgment)
- [ ] If kept, line is clearly distinct from bar coloring and adds analytical value
- [ ] If dropped, chart feels complete without it
- [ ] Decision documented in BUILD_LOG

---

## Block 4 — Annotations and supporting text

### 4.1 In-chart annotations

Keep minimal but present:

- Y-axis label: "Annual cashflow ($)"
- X-axis label: "Year"
- Legend: "PACE assessment" (red) | "Net energy savings benefit" (green)
- Vertical dashed line + label at term end (per Block 2)

Drop the previous "Net annual benefit" line legend if removed per Block 3.

### 4.2 Supporting text annotation below chart

Current chart includes annotation text below the chart that reads roughly:
> Monthly assessment $373 vs. monthly energy savings $500. Net monthly benefit: $127. Over the 20-year PACE term: cumulative net benefit ≈ $30,540. After PACE ends, all energy savings flow directly to cashflow.

Update to match new visual structure:

> Annual energy savings: $X. Annual PACE assessment: $Y (paid for [pace_term_years] years through property tax). Net annual benefit during PACE term: $Z. After year [pace_term_years]: full $X annual savings flows to cashflow with no more assessment. Cumulative net benefit over the chart range: $A.

Substitute parameter values appropriately. Make sure NO placeholders leak (per Patch A+B Block 2 verification).

### 4.3 Member-facing framing in output_summary_template

Update output_summary_template in ArtifactTemplate seed to match the new framing:

```
{improvement_type} at {improvement_cost} financed via PACE over {pace_term_years} years through property tax assessment. Annual energy savings of {annual_energy_savings} exceed the annual PACE assessment of {annual_assessment} from day one — net annual benefit during PACE term: {annual_net_benefit}. After year {pace_term_years}, the full {annual_energy_savings} in annual savings flows directly to cashflow with no more assessment. Cumulative net benefit over 25 years: {cumulative_benefit}.
```

Refine language for natural reading. The point is to communicate: "saves money from day one, then keeps saving even more after PACE ends."

### 4.4 Acceptance criteria

- [ ] In-chart annotations updated to match new structure
- [ ] Supporting text below chart matches the stacked-bar framing
- [ ] output_summary_template in seed reflects new framing
- [ ] All parameter substitutions work (no placeholder leakage)

---

## Block 5 — Verification

### 5.1 Playwright re-verification

Run the existing Playwright verification script (from Patch A+B Block 6) for the PACE visualization specifically. Confirm:

- Chart renders without errors
- Bars all above zero
- Stacking renders correctly (red base + green top during PACE term)
- Post-PACE bars entirely green
- Vertical term-end annotation visible with label
- Supporting text below chart substitutes parameter values correctly
- Screenshot saved to `scripts/.verify-visualizations-out/` for comparison with previous version

### 5.2 Cross-fixture verification

The PACE artifact may appear under multiple fixture × Track combinations (Member-Types where PACE applies). Verify the chart renders correctly across each.

Worth checking specifically: Jenny's growth conversation page with PACE Loan selected as the Track context. The earlier visual review showed Jenny on PACE was the surface where the broken-feeling visualization was most apparent.

### 5.3 Visual probe checklist for Francisco's review

When CC reports back, Francisco walks through:
- Open PACE artifact for at least one fixture
- Verify stacked bars render top-to-bottom: green (net benefit) on top, red (assessment) on bottom
- Verify post-PACE bars are entirely green and visibly larger in green-area than during-PACE bars
- Verify term-end annotation reads correctly
- Verify supporting text matches what the chart shows
- Verify the "after-PACE cliff" effect is visually obvious — the chart should communicate "savings flow through entirely after term" without needing the supporting text to explain it

### 5.4 Acceptance criteria

- [ ] Playwright verification confirms chart renders correctly
- [ ] Screenshot saved for record
- [ ] No regression in Playwright verification of other Sprint 9 visualizations
- [ ] BUILD_LOG entry documents the redesign rationale and key choices (Year 0 baseline, net benefit line decision, etc.)

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-5 shipped per acceptance criteria
2. Playwright screenshot of PACE chart inline or attached
3. Per-fixture verification of PACE rendering
4. Decision summary:
   - Year 0 baseline bar included or not (and why)
   - Net benefit line dropped or kept (and why)
5. Any deviations from spec with rationale

After this patch ships and visual review confirms (stacked bars clear, after-PACE cliff visible, supporting text accurate), the next patch in Option C-1 sequence is Unsecured chart redesign.

---

## Estimated scope

0.5 effective build day CC time.

Single-component change with clear structural transformation. Most effort goes into:

- **Block 1 (chart structure redesign)** — restructure Recharts stack composition; ~0.25 day CC
- **Block 4 (annotations and supporting text)** — update annotation logic and seed template; ~0.15 day CC
- **Blocks 2, 3, 5** — visual treatment + verification; ~0.1 day CC combined

Smaller scope than typical patches because it's surgical to one visualization with clear acceptance criteria.

After this patch lands, sequenced next steps:
- **Unsecured chart redesign** (drafted after PACE verification)
- **Member-Type × Track applicability filtering** (drafted after Unsecured ships)
- **Sprint 7b drill-downs** (drafted after applicability ships)
- **Sprint 6 production deployment** (after all above land)
- **DEMO_RUNBOOK review + demo rehearsal**
