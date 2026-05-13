# Sprint 9 Patch D — Unsecured Chart Redesign

**Prompt for Claude Code. Single patch. Replace UnsecuredOpportunityChart's current two-column comparison with a three-bar proportional scale visualization. Add range-based opportunity value rendering to handle uncertainty in opportunity estimates. Estimated 0.5 effective build day CC time.**

## Pre-flight context

Patch C shipped the PACE structural redesign cleanly. Stacked positive bars + after-PACE cliff treatment communicates the value clearly. Playwright verification confirms no regressions across other visualizations.

Next in the Option C-1 sequence: the Unsecured Loan chart. Patch A+B applied the cohesive palette but the underlying structure is still weak. The current two-column "Without loan vs With loan" framing produces an awkward visualization:

- The "Without loan" column is mostly empty (just a ghosted "opportunity_passed" reference bar)
- The "With loan" column shows interest + opportunity as separate stacked values
- The actual decision — "is the opportunity worth more than the interest?" — isn't visually obvious; reads only in the math text box

The reframe: unsecured loans are decision-support tools where the math box already tells the story ("$120K opportunity - $7K interest = $113K net benefit"). The chart's job should be to make the scale disparity instantly visible — "the cost is tiny, the opportunity is large."

A three-bar comparison (Interest cost / Opportunity value / Net benefit) makes proportional scale the primary visual signal. The viewer sees at a glance that interest is small relative to opportunity, and net benefit is nearly the full opportunity value.

Additionally, unsecured loans often involve uncertain opportunity values — bulk discounts, emergency repairs, or marketing pushes may have a range rather than a precise figure. The redesign should accommodate range-based opportunity values to match real-world banker workflows.

**Read these governance documents before starting:**

1. Existing component: `app/v2/members/[id]/artifact-visualizations/UnsecuredOpportunityChart.tsx`
2. Palette constants: `app/v2/members/[id]/artifact-visualizations/palette.ts`
3. ArtifactTemplate seed: `prisma/seed-artifact-templates.ts` for ARTIFACT-TEMPLATE-007 (TRACK-011 Unsecured Loan)
4. Sprint 9 spec for original Unsecured parameter schema

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked):**

- Redesign approach: three-bar comparison (Interest cost / Opportunity value / Net benefit)
- Opportunity value handling: range-based (low estimate to high estimate) rather than single point
- Palette from Patch A+B preserved: `cost` (muted red) for interest, `afterState` (warm Blaze accent) for opportunity, `benefit` (muted green) for net benefit
- Decision framing ("if you don't take the loan vs if you do") moves to supporting annotation text below the chart, not into the chart structure
- Missing-parameter CTAs from Sprint 8 continue to handle the case where banker hasn't captured a meaningful opportunity value
- The chart should still render even when opportunity is uncertain, using the range-based treatment

## What ships in this patch

Five blocks. Single checkpoint.

- **Block 1 — Parameter schema additions for opportunity range.**
- **Block 2 — Three-bar chart structure.**
- **Block 3 — Range-based opportunity bar treatment.**
- **Block 4 — Annotations and supporting text.**
- **Block 5 — Verification.**

This patch does NOT ship: changes to other Sprint 9 visualizations; changes to other parameter schemas; the Member-Type × Track applicability filtering; Sprint 7b drill-downs.

---

## Block 1 — Parameter schema additions

### 1.1 New parameters for opportunity range

Current `opportunity_value` is a single currency parameter. Extend to support range-based estimation.

Add to ARTIFACT-TEMPLATE-007 parameter_schema:

```json
{
  "key": "opportunity_value_low",
  "label": "Opportunity value — low estimate",
  "type": "currency",
  "required": false,
  "helper": "If estimating a range, capture both low and high. If certain, leave low blank and use opportunity_value."
},
{
  "key": "opportunity_value_high",
  "label": "Opportunity value — high estimate",
  "type": "currency",
  "required": false,
  "helper": "If estimating a range, this is the optimistic case."
}
```

`opportunity_value` (existing parameter) is preserved as the "central estimate" or "single point estimate" depending on banker's certainty.

### 1.2 Three modes of opportunity capture

The renderer determines which mode to use based on what's captured:

**Mode 1 — Point estimate:** Only `opportunity_value` populated. Chart renders single value bar (current behavior).

**Mode 2 — Range estimate:** Both `opportunity_value_low` and `opportunity_value_high` populated. Chart renders range bar (per Block 3). `opportunity_value` should equal the midpoint or be left blank.

**Mode 3 — Range with central estimate:** All three populated. Chart renders range bar with a midpoint marker at `opportunity_value`.

If banker captures range without central, renderer auto-computes midpoint for math purposes. If banker captures only central, chart treats as Mode 1.

### 1.3 source_factor_id linkage

`opportunity_value_low` and `opportunity_value_high` do not have natural source_factor_id mappings (these are banker estimates, often captured during the conversation). Leave as banker-entered.

`opportunity_value` retains its existing source_factor_id linkage from Sprint 8.

### 1.4 Computed parameters update

Existing computed parameter `net_benefit = opportunity_value - total_interest_over_term` needs to handle range mode:

- Mode 1: `net_benefit = opportunity_value - total_interest_over_term`
- Mode 2 and 3: 
  - `net_benefit_low = opportunity_value_low - total_interest_over_term`
  - `net_benefit_high = opportunity_value_high - total_interest_over_term`
  - `net_benefit_central = opportunity_value - total_interest_over_term` (if opportunity_value is the midpoint)

### 1.5 Acceptance criteria

- [ ] Parameter schema includes `opportunity_value_low` and `opportunity_value_high` (both optional)
- [ ] Existing `opportunity_value` preserved with its source_factor_id linkage
- [ ] Computed parameters handle all three modes
- [ ] Missing-parameter CTAs (Sprint 8) work correctly: required `opportunity_value` triggers CTA if neither point nor range is captured

---

## Block 2 — Three-bar chart structure

### 2.1 New chart structure

The visualization renders three vertical bars side-by-side. No more two-column "Without loan vs With loan" framing.

**Bar 1 — Interest cost (leftmost):**
- Color: `cost` (muted red from palette)
- Height: `total_interest_over_term` (computed from loan_amount, term_months, interest_rate)
- Label below bar: "Interest cost"
- Annotation above bar: dollar value (e.g., "$7,083")

**Bar 2 — Opportunity value (middle):**
- Color: `afterState` (warm Blaze accent from palette)
- Height: per Block 3 (point or range)
- Label below bar: "Opportunity value"
- Annotation above bar: dollar value or range

**Bar 3 — Net benefit (rightmost):**
- Color: `benefit` (muted green from palette)
- Height: per Block 3 (point or range)
- Label below bar: "Net benefit"
- Annotation above bar: dollar value or range

### 2.2 Y-axis scale

Y-axis scales to the maximum value across all three bars (typically `opportunity_value` or `opportunity_value_high`). This ensures proportional comparison.

If `interest_cost` is much smaller than `opportunity_value` (typical case), the interest bar will appear visually tiny. That's the point — the proportional disparity is the visual message.

### 2.3 X-axis treatment

X-axis is categorical with three discrete positions. No need for numerical scaling.

### 2.4 Bar spacing and visual treatment

Bars should be visually balanced:
- Equal width across all three
- Comfortable spacing between bars (~25-30% of bar width)
- Y-axis labeled "Dollar value ($)" or similar
- Gridlines subtle, in `reference` color (grey-400)

### 2.5 Acceptance criteria

- [ ] Three vertical bars side-by-side
- [ ] Colors match palette grammar (cost / afterState / benefit)
- [ ] Y-axis scales to maximum value across bars
- [ ] Dollar value annotations above each bar
- [ ] Labels below each bar

---

## Block 3 — Range-based opportunity bar treatment

### 3.1 Range bar rendering for opportunity value

When opportunity value is captured as a range (Mode 2 or 3 from Block 1):

**Visual treatment:**
- The opportunity bar renders as a vertical band, not a single solid bar
- Band extends from `opportunity_value_low` (bottom of band) to `opportunity_value_high` (top of band)
- Fill color: `afterState` (warm Blaze accent) at full opacity for the band
- Bar has visible top and bottom edges to show the range bounds
- Annotation above bar: "$X-$Y" range (e.g., "$100K - $150K")

**Optional midpoint marker:**
- If `opportunity_value` is captured (Mode 3) as a central estimate, render a small horizontal line across the band at that value
- Marker color: `afterStateDark` or a darker variant
- Annotation near marker: "central estimate: $X" (small text)

### 3.2 Range bar rendering for net benefit

When opportunity is a range, net benefit also has a range:

- `net_benefit_low = opportunity_value_low - total_interest_over_term`
- `net_benefit_high = opportunity_value_high - total_interest_over_term`

Render net benefit bar identically to opportunity range bar:
- Vertical band from `net_benefit_low` to `net_benefit_high`
- Fill color: `benefit` (muted green)
- Annotation above bar: "$X-$Y" range
- Optional midpoint marker if `net_benefit_central` is computed

### 3.3 Interest cost rendering

Interest cost is always a single value (computed from loan_amount, term_months, interest_rate). Always renders as a solid bar regardless of mode.

### 3.4 Visual proportion guidance

If `net_benefit_low` is at or below zero (opportunity might not exceed interest cost in the low scenario), the net benefit bar's bottom should be clearly visible at zero with the upper portion of the band above.

If `net_benefit_low` is negative (genuinely possible — low opportunity might not justify the loan), render the negative portion as a small downward extension below the zero baseline, in a different visual treatment (e.g., dashed outline) to flag the risk. This is a legitimate insight — sometimes the opportunity doesn't pencil out at the low end.

### 3.5 Single point estimate fallback

If opportunity is captured as a single point (Mode 1):
- Opportunity bar: solid `afterState` bar
- Net benefit bar: solid `benefit` bar
- No range treatment, no midpoint marker

This is the simplest and most common case.

### 3.6 Acceptance criteria

- [ ] Range mode renders opportunity bar as vertical band
- [ ] Range mode renders net benefit bar as vertical band
- [ ] Optional midpoint marker for Mode 3 (range with central estimate)
- [ ] Point mode renders solid bars (Mode 1)
- [ ] Negative net benefit at low end of range renders with visual flag (dashed outline or similar)
- [ ] Visual proportion consistent across all modes

---

## Block 4 — Annotations and supporting text

### 4.1 In-chart annotations

Keep minimal:
- Y-axis label: "Dollar value ($)"
- Dollar value or range above each bar
- Labels below each bar: "Interest cost" / "Opportunity value" / "Net benefit"

Optional: small note above the chart distinguishing point vs range mode if helpful. CC judgment.

### 4.2 Supporting text annotation below chart — decision framing

This is where the "if you don't take the loan vs if you do" framing lives. The chart shows scale; the text shows decision.

Draft (CC refines):

> **Without the loan:** the opportunity passes. Cost: $0. Value captured: $0. Net: $0.
>
> **With the loan:** you pay {total_interest_over_term} in interest over {term_months} months. You capture {opportunity_value_display} in opportunity value. Net benefit: {net_benefit_display}.
>
> If the opportunity value is uncertain — say, between $X and $Y — the net benefit ranges from $A to $B. {risk_flag_if_applicable}

Where:
- `opportunity_value_display` is either "$X" (point) or "$X-$Y" (range)
- `net_benefit_display` is either "$X" (point) or "$X-$Y" (range)
- `risk_flag_if_applicable` appears when `net_benefit_low` is at or below zero: "Note: at the low end of the opportunity range, the net benefit is small or negative. Worth confirming the opportunity value with the Member before committing."

### 4.3 Member-facing framing in output_summary_template

Update output_summary_template in ArtifactTemplate seed:

```
{opportunity_type}: {opportunity_description}. Unsecured loan of {loan_amount} over {term_months} months at {interest_rate}. Total interest cost: {total_interest_over_term}. Opportunity value: {opportunity_value_display}. Net benefit: {net_benefit_display}. {decision_summary}.
```

Where `decision_summary` is:
- Mode 1 (point): "Opportunity value exceeds interest cost by {net_benefit} — the loan pays for itself."
- Mode 2/3 (range with positive low-end): "Even at the low end of the opportunity range, net benefit is positive — the loan likely pays for itself across the range."
- Mode 2/3 (range with negative low-end): "At the high end the loan is clearly worth it; at the low end the math is marginal. Worth tightening the opportunity estimate with the Member before committing."

### 4.4 Acceptance criteria

- [ ] In-chart annotations updated for three-bar structure
- [ ] Supporting text below chart includes decision framing
- [ ] Range mode rendering reflects in supporting text (range values displayed)
- [ ] Risk flag appears when net_benefit_low is at or below zero
- [ ] output_summary_template handles all three modes
- [ ] No placeholder leakage (verify per Patch A+B Block 2)

---

## Block 5 — Verification

### 5.1 Playwright verification

Run existing Playwright verification script for the Unsecured chart specifically. Confirm:

- Chart renders without errors in all three modes (point / range / range with central)
- Three bars at proportional heights
- Range mode renders bands correctly
- Negative net benefit at low end (if applicable) renders with visual flag
- Supporting text substitutes correctly across all modes
- Screenshot saved to `scripts/.verify-visualizations-out/`

### 5.2 Fixture data updates for verification

Update at least one fixture's Unsecured loan parameters to demonstrate range mode. Suggested fixture: any fixture with the Unsecured artifact in their Sprint 8 multi-Track distribution.

Sample range scenario: bulk inventory discount with uncertain take rate — `opportunity_value_low: $80K`, `opportunity_value_high: $150K`, `opportunity_value: $115K`. This demonstrates Mode 3.

Keep at least one fixture using point mode (Mode 1) for the simpler case.

### 5.3 Cross-fixture verification

If multiple fixtures have Unsecured artifacts, verify each renders correctly. Verify the chart structure is consistent across fixtures regardless of which mode each uses.

### 5.4 Visual probe checklist for Francisco

When CC reports back, Francisco walks through:
- Open Unsecured artifact for a fixture using point mode — verify three solid bars
- Open Unsecured artifact for a fixture using range mode — verify range bands
- Verify proportional scale: interest bar visually small next to opportunity bar
- Verify supporting text decision framing reads naturally
- Verify range mode communicates uncertainty clearly without being confusing

### 5.5 Acceptance criteria

- [ ] Playwright confirms chart renders correctly in all modes
- [ ] At least one fixture demonstrates range mode
- [ ] Point mode preserved for fixtures with single-value opportunities
- [ ] BUILD_LOG entry documents the structural redesign and rationale
- [ ] No regression on other Sprint 9 visualizations

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-5 shipped per acceptance criteria
2. Playwright screenshots of point mode and range mode Unsecured charts
3. Per-fixture verification of Unsecured rendering
4. Sample range fixture configuration (which fixture, what opportunity range, computed net benefit range)
5. Decision summary on any judgment calls (visual treatment for range bands, midpoint marker rendering)
6. Any deviations from spec with rationale

After this patch ships and visual review confirms (three-bar comparison clear, range bands legible, decision framing accurate), next in the Option C-1 sequence is Member-Type × Track applicability filtering.

---

## Estimated scope

0.5 effective build day CC time.

Breakdown:
- **Block 1 (parameter schema)** — additive changes, no migration needed; ~0.1 day
- **Block 2 (three-bar structure)** — restructure Recharts composition; ~0.2 day
- **Block 3 (range-based treatment)** — new visual logic for bands and midpoint markers; ~0.2 day
- **Block 4 (annotations + supporting text)** — multi-mode text logic; ~0.15 day
- **Block 5 (verification)** — Playwright + fixture updates; ~0.1 day

Comparable scope to PACE patch. Most effort in range-based band rendering and multi-mode text logic.

After this patch lands, sequenced next:
- **Member-Type × Track applicability filtering** (drafted after Unsecured verification)
- **Sprint 7b drill-downs** (drafted after applicability ships)
- **Sprint 6 production deployment**
- **DEMO_RUNBOOK review + demo rehearsal**
