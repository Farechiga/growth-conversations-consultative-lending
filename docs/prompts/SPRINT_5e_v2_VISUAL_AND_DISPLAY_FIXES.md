# Sprint 5e — Visual Density Cleanup, Cross-Type Linkage Display Fix, Pattern Surfacing

**Prompt for Claude Code. Single checkpoint. Visual density cleanup of popup-as-workflow surface. Fixture timeline compression to recent ~60-day window. Factor input rendering bug fix for qualitative factors. Cross-type linkage display fix (factor rows showing as duplicates of Signal quotes). Pattern surfacing expand affordance across all phase popups. Estimated 2-2.5 effective build days CC time.**

## Pre-flight context

Sprint 5d follow-up shipped the comprehensive content rewrite. Visual review surfaced multiple issues:

1. Popup-as-workflow evidence zone is dense and hard to read. Capture metadata repeats on every row producing visual noise. Verbatim quotes don't get visual prominence as primary content. LLM feedback adds clutter without banker value.

2. Fixture data has captures up to 539 days old creating an unprofessional demo appearance.

3. + refresh CTA on a qualitative factor opens + Quantify form with the wrong input type (enumerated dropdown instead of free-text input).

4. Factor display bug: when a FactorCapture has source_signal_id set, code overwrites type_chip and value_display, replacing the factor's natural identity. Combined with popup dedupe by signal_id, multiple factors source-linked to the same Signal collapse to a single row showing only the Signal quote. Northland's Measure popup shows 1 visible row when 3 captured factors should be visible (capacity utilization 88%, demand exceeding capacity true, equipment aging Yes).

5. Lightbulb popover only surfaces Patterns where signal_tag_scope matches a captured Signal tag. Track-relevant Patterns whose tags don't match captured Signals are invisible — banker has no way to access them during conversation.

Sprint 5e addresses these as a focused cleanup before Sprint 6 (polish + EVP demo deploy).

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level) — Sections 5 (popup copy), 8 (fixture data implications)
2. `ARCHITECTURE_V2.md`
3. `prisma/schema.prisma` — Signal, FactorCapture, Insight, Reaction, BusinessFactor entity definitions
4. Existing popup-as-workflow component: `app/v2/members/[id]/objective-popup.tsx`
5. Existing capturedRow construction: `app/v2/members/[id]/page.tsx`

## What ships in this sprint (5e)

Seven blocks. Single checkpoint.

- **Block A — Capture metadata to mouseover.**
- **Block B — Quote treatment + summary label drop + LLM feedback hide.**
- **Block C — Staleness color bug fix.**
- **Block D — Fixture timeline compression.**
- **Block E — Factor input rendering bug fix for qualitative factors.**
- **Block F — Cross-type linkage display fix.**
- **Block G — Pattern surfacing expand affordance.**

---

## Block A — Capture metadata to mouseover

### A.1 Current state

Each evidence row in popup-as-workflow displays a metadata line:

```
captured Apr 21 · by Scott Brynjolffson · via + Ask
```

This line repeats on every Signal row, every Insight row, every FactorCapture row. Adds significant visual weight.

### A.2 New state

Move the entire metadata line to row mouseover (hover state). Banker hovers a row to see the metadata; otherwise it's hidden.

### A.3 Implementation

- Wrap each row's metadata line in a hover-revealed element (visible on `:hover` parent row, hidden by default)
- Use subtle visual treatment when revealed (smaller font, lower contrast)
- Position: revealed metadata appears in same location as current rendering (below the quote/content, above any nested children)
- Mobile/touch behavior: reveal on tap; collapse on tap-elsewhere

### A.4 Apply to all row types

- Signal rows (Goals, Blockers, Indecisions, Triggers)
- FactorCapture rows
- Insight rows (both top-level and nested)
- Reaction rows
- ShowEvent rows

### A.5 Acceptance criteria

- [ ] Capture metadata hidden by default on all evidence row types
- [ ] Mouseover reveals metadata with appropriate visual treatment
- [ ] Touch behavior works on mobile
- [ ] Visual density on popup measurably reduced

---

## Block B — Quote treatment, summary label drop, LLM feedback hide

### B.1 Quote treatment matches Insight treatment

Current state: verbatim quotes render as small italic text full-width.

New state: quotes get the same visual treatment as Insight content — bolder weight, indented with left-rule, generous right whitespace, larger font.

This creates visual parallelism: quotes are what the Member said; Insights are how we're interpreting it. Same visual weight communicates "these are the substantive content of the popup."

### B.2 Drop Signal.summary labels

Current state: each Signal row shows `Signal.summary` as a 2-4 word label in the row header (e.g., "Grow alongside customer expansion" / "Evaluating capacity expansion").

New state: drop summary labels entirely from popup display. The verbatim quote is the content. Type chip ("Goal" / "Trigger" / etc.) stays for orientation.

Note: `Signal.summary` field stays in schema; just not rendered in popup. Other surfaces (history, search results, etc.) may still use it.

### B.3 Hide LLM feedback

Current state: each Insight row shows `Insight.llm_feedback` text in italics below the Insight content.

New state: `Insight.llm_feedback` hidden from popup display entirely. Banker doesn't see LLM's "Excellent observation!" / "You're catching something key..." commentary.

The `Insight.matched_pattern_id` and match confidence still operate behind the scenes for routing (matched → library; novel → senior-lender review). Just the feedback text doesn't surface.

### B.4 Drop "matched" / "novel" tags from main view

Current state: Insight rows render "matched" or "novel" tag in row metadata.

New state: tag moves to mouseover (alongside other capture metadata per Block A). Not rendered in main row view.

### B.5 Acceptance criteria

- [ ] Verbatim quotes render with bolder weight, indented left-rule, right whitespace, larger font
- [ ] Signal.summary not displayed in popup rows
- [ ] Insight.llm_feedback not displayed in popup rows
- [ ] "matched" / "novel" tags moved to mouseover

---

## Block C — Staleness color bug fix

### C.1 Bug

Sprint 5b.1 Block G specified captures over 90 days old should render in red font with day count. Visual review shows captures over 90 days rendering in normal font.

### C.2 Diagnosis path

Trace staleness logic in popup row rendering. Likely cause: staleness check is gated on a condition that doesn't fire (incorrect day calculation, threshold off-by-one, conditional CSS class not applied).

### C.3 Fix

Captures with `captured_at` more than 90 days ago render in red font. Day count visible (e.g., "98 days old", "184 days old"). + refresh CTA visible on the row when staleness condition met.

After Block D fixture compression, no captures should be over 60 days old in the demo data. Staleness color bug fix is for correctness; visual won't trigger in normal demo state but should be ready if needed.

### C.4 Acceptance criteria

- [ ] Captures over 90 days old render in red font
- [ ] Day count visible
- [ ] + refresh CTA visible on stale rows

---

## Block D — Fixture timeline compression (Approach A)

### D.1 Goal

Compress all fixture capture timelines into a recent ~60-day window. Preserve narrative sequence (Discover before Measure before Consult before Navigate). All captures should appear recent and credible for EVP demo.

### D.2 Compression strategy

For each fixture Member (Jenny, Northland, Cygnus, Riverside Catering), re-date all captures (FactorCapture, Signal, Insight, Reaction, ShowEvent) such that:

- Earliest capture is ~55-60 days ago
- Latest capture is ~3-5 days ago
- Sequence preserved (older captures = earlier phase work; newer captures = later phase work)
- Captures within the same logical phase clustered within ~2-3 day windows

### D.3 Per-fixture target distribution

**Jenny (event_services, TRACK-001 Working Capital LOC):**
- Discover-phase captures: 50-55 days ago
- Measure-phase captures: 30-40 days ago
- Consult-phase captures: 15-20 days ago
- Navigate-phase captures: 3-7 days ago
- Insights authored: spread across last 30 days

**Northland (maintenance_services, TRACK-002 Business Vehicle Loan):**
- Discover: 45-50 days ago (truck breakdown trigger)
- Measure: 30-35 days ago (capacity utilization, declined work)
- Consult: 15-20 days ago (fleet ROI projection)
- Navigate: 5-10 days ago (CPA coordination)
- Insights: spread across last 25 days

**Cygnus (specialty_manufacturer, TRACK-008 SBA 504):**
- Discover: 45-50 days ago (customer growth Trigger)
- Measure: 30-35 days ago (owner-occupancy, employee count, capacity)
- Consult: 15-20 days ago (SBA 504 structure model)
- Navigate: 5-10 days ago (specialist handoff in motion)
- Insights: spread across last 25 days

**Riverside Catering (event_services, TRACK-001 stage-skip fixture):**
- Consult-phase Model: 20-25 days ago
- Reaction: 18-22 days ago
- Missing Discover-phase intentional (stage-skip pattern)

### D.4 Implementation

Update `prisma/seed.ts` and any fixture data files to use computed-from-now dates rather than hardcoded calendar dates. Use date arithmetic relative to current date so the compressed window stays valid as time passes.

Example:
```typescript
// Instead of: captured_at: new Date('2024-11-15')
// Use:
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Then:
captured_at: daysAgo(55),  // Discover-phase capture
captured_at: daysAgo(35),  // Measure-phase capture
// etc.
```

### D.5 Acceptance criteria

- [ ] No fixture capture is more than 60 days old at seed time
- [ ] Sequence preserved (Discover before Measure before Consult before Navigate)
- [ ] Visual probe: open each fixture's growth conversation page; capture dates appear recent
- [ ] After re-seeding tomorrow, the captures are still within the compressed window (relative dates, not hardcoded)

---

## Block E — Factor input rendering bug fix

### E.1 Bug

Visual review test: clicked + refresh on Cygnus's Goal row (factor: Stated growth aspiration). + Quantify form opened with factor pre-selected correctly. But the value capture rendered as an enumerated dropdown ("Selection: Other / Smooth seasonal revenue / Expand capacity / Acquire real estate / Diversify revenue / Acquire equipment / Refinance existing / Scale workforce / Other") instead of a free-text input where banker captures the Member's actual statement.

### E.2 Root cause analysis

`Stated growth aspiration` is a qualitative factor (Member's free-text statement of growth goal). The factor's BusinessFactor record likely has a discrete option set defined, which causes the form to render as enumerated dropdown.

But qualitative factors should render as text input (or textarea for longer responses), with the captured value being the Member's actual statement.

### E.3 Fix

Investigate factor-type handling in + Quantify form rendering:

1. Identify factors that are qualitative free-text by nature (e.g., Stated growth aspiration, Stated obstacle to growth, Stated decision hesitation, Triggering event observed)
2. Confirm BusinessFactor schema supports differentiating "qualitative free-text" from "qualitative enumerated"
3. Update form rendering to dispatch by factor type:
   - Numerical factors → number input with unit suffix
   - Boolean factors → toggle/radio
   - Qualitative enumerated → dropdown (current behavior, still needed for some factors)
   - Qualitative free-text → text input or textarea (THIS is the missing case)
   - Currency factors → currency input
   - Percentage factors → percentage input

### E.4 Schema implication

If BusinessFactor schema doesn't currently differentiate qualitative-enumerated from qualitative-free-text, add a field:

```prisma
model BusinessFactor {
  // existing fields...
  input_type String  // 'number' | 'boolean' | 'enumerated' | 'free_text' | 'currency' | 'percentage'
  // ...
}
```

Then update affected factors:
- Stated growth aspiration: input_type = 'free_text'
- Stated obstacle to growth: input_type = 'free_text'
- Stated decision hesitation: input_type = 'free_text'
- Triggering event observed: input_type = 'free_text' (or 'enumerated' if discrete options are reasonable)
- All numeric factors: input_type = 'number' / 'currency' / 'percentage' as appropriate
- Owner-occupancy confirmed: input_type = 'boolean'

If the schema already supports this differentiation, just correct the affected factor records.

### E.5 + Refresh re-capture flow

When + refresh is clicked on a Signal row (Goal/Blocker/Indecision/Trigger), the action should open + Ask form (not + Quantify form) since these are qualitative captures. Worth verifying which form opens for + refresh on different row types:

- + refresh on FactorCapture row → + Quantify form with factor pre-selected
- + refresh on Signal row → + Ask form with Signal type pre-selected (the Member restated something)

If + refresh currently opens + Quantify regardless of row type, that's a related bug worth fixing.

### E.6 Acceptance criteria

- [ ] BusinessFactor schema differentiates input types (or affected factor records corrected)
- [ ] + Quantify form renders text input for qualitative free-text factors
- [ ] + refresh on Signal row opens + Ask form (if this is the intended behavior)
- [ ] + refresh on FactorCapture row opens + Quantify form
- [ ] Inline test: click + refresh on Cygnus's Goal row → form opens with text input (not enumerated dropdown)

---

## Block F — Cross-type linkage display fix

### F.1 Bug

Visual review of Northland's Measure popup shows only 1 captured row visible (Equipment / fleet aging = Yes) when 3 Measure-required factors are actually captured (FACTOR-006 capacity utilization 88%, FACTOR-007 demand exceeding capacity true, FACTOR-010 equipment / fleet aging Yes).

CC's diagnostic identified two coupled bugs:

**Bug F-A:** `app/v2/members/[id]/page.tsx` capturedRow construction unconditionally overwrites `type_chip` to "Blocker" and `value_display` to the source Signal's quote when a FactorCapture has `source_signal_id` set. So FACTOR-006 (88%) and FACTOR-007 (true) both get rendered as "Blocker / capacity_limit" — visually identical to each other and to the source Signal.

**Bug F-B:** Dedupe in `objective-popup.tsx` collapses by signal_id. FACTOR-006, FACTOR-007, FACTOR-022, and FACTOR-024 all source-link to the same Signal. Dedupe keeps only the first one, hiding the rest entirely.

The combined effect: 3 captured factors appear as 1 visible row showing only the Signal quote. Banker can't see the actual quantitative captures that drove "promising" status on the objective.

### F.2 Fix

Two surgical changes:

**Fix F-A — page.tsx capturedRow construction.** Only overwrite type_chip and value_display when the factor's `capture_mode` is qualitative. Numerical and boolean factors keep factor name + formatted value as primary content. The Signal quote (if source-linked) attaches as supplementary `member_quote` field on the row, but isn't the primary display content.

After fix:
- FACTOR-006 row: type_chip = factor type indicator (e.g., "Factor"), value_display = "Capacity utilization | 88%"
- FACTOR-007 row: type_chip = factor type indicator, value_display = "Demand exceeding capacity | Yes"
- FACTOR-010 row: unchanged (no source-link)
- The source Signal (Blocker quote) renders as its own row separately

**Fix F-B — objective-popup.tsx dedupe.** Only dedupe rows whose primary content IS the Signal quote (qualitative-mapped rows where the row's display content is sourced from `Signal.direct_quote`). Numerical and boolean factor rows always pass through dedupe regardless of source_signal_id.

### F.3 Affected popups

The fix applies to all phase popups across all fixtures. Verify no regression on:
- Jenny's Discover/Measure/Consult/Navigate popups
- Northland's Discover/Measure/Consult/Navigate popups
- Cygnus's Discover/Measure/Consult/Navigate popups
- Riverside Catering's available popups

### F.4 Insight nesting still works

Insights with `addresses_signal_id` continue to nest under their addressed Signal (Treatment A from Sprint 5b.1 mini-patch). Block F fix doesn't change Insight nesting behavior; just changes how source-linked FactorCapture rows display.

### F.5 Acceptance criteria

- [ ] Northland's Measure popup shows capacity utilization (88%), demand exceeding capacity (Yes/true), equipment aging (Yes) as distinct factor rows
- [ ] The Blocker quote may render once if its source-linkage requires (not collapsing other factors)
- [ ] Insight nesting still works (Insights addressing the Blocker still nest under it)
- [ ] No regression on Cygnus and Jenny popups
- [ ] No regression on Insight rendering (nested Insights still appear under addressed Signals)

---

## Block G — Pattern surfacing expand affordance

### G.1 Current state

Lightbulb popover surfaces canonical Patterns ranked by `signal_tag_scope` matching captured Signal tags in the current Track context. Track-relevant Patterns whose tags don't match captured Signals are invisible.

Example: Northland on TRACK-002 has 7 Patterns total in the library. Banker sees only 4 (those matching tags `capacity_limit`, `aging_equipment`, `equipment_breakdown`). PATTERN-014, PATTERN-015, PATTERN-016 are Track-relevant but invisible because Northland's captured Signals don't have matching tags.

Banker has no way to access those Patterns during conversation even though they're real consultative content for this lending product.

### G.2 New state

Default lightbulb popover behavior unchanged — surfaces matched Patterns by signal_tag_scope.

Below the matched Patterns list, add **"See all related insights"** hyperlink. Click expands to show remaining Track-relevant Patterns (Patterns with same `track_id` as current Track, but `signal_tag_scope` doesn't match captured Signals).

### G.3 Implementation

- Hyperlink renders only when remaining Track-relevant Patterns exist (don't show "See all related insights" if all Track Patterns are already matched)
- Click expands inline within the popover (no separate modal); collapse affordance toggles back
- Expanded Patterns render with same visual treatment as matched Patterns: same Reframe/Implication chips, same content layout, same implication question rendering
- Optional: subtle visual divider between matched and expanded sections (small label "Other patterns for this lending product" or just whitespace separation)

### G.4 Apply uniformly across phase popups

Same pattern in every phase popup: Discover, Measure, Consult, Navigate. Same hyperlink, same expand behavior.

This addresses two related concerns:
1. Banker access to Track-relevant Patterns regardless of Signal-tag matching
2. Verification that Patterns surface on Consult/Measure/Navigate popups (not just Discover) — Sprint 5d Block H.2 should have fixed this; Block G work confirms it's working

### G.5 Acceptance criteria

- [ ] Default popover shows signal-tag-matched Patterns (current behavior)
- [ ] "See all related insights" hyperlink appears below matched Patterns when remaining Track Patterns exist
- [ ] Click expands inline to show remaining Track-relevant Patterns
- [ ] Pattern surfacing works on all four phase popups (Discover, Measure, Consult, Navigate)
- [ ] Northland Measure popup: 4 matched Patterns + "See all related insights" expanding to show PATTERN-014, 015, 016
- [ ] Northland Consult popup: same Patterns surface (verify Sprint 5d Block H.2 fix held)
- [ ] No regression on existing matched-Pattern surfacing

---

## Pilot deferrals to honor

Sprint 5e does not ship:
- Layered re-introduction of Signal.summary labels (deferred until navigation/orientation needs surface in real banker testing)
- Full LLM feedback design (currently hidden; Pilot may want optional expand-on-click affordance)
- Type chip de-emphasis (kept as-is per Francisco's call)
- Mobile-specific interaction patterns beyond touch-tap behavior on mouseover
- FactorCapture-to-Model parameter linkage (Pilot concern per Sprint 5d Note 13)

---

## Reporting back

When Sprint 5e is complete, report back with:

1. Confirmation that Blocks A-G shipped per acceptance criteria
2. Visual probes:
   - Cygnus popup with cleaner evidence zone (no metadata clutter; quote-prominent treatment; no LLM feedback; no summary labels; no matched/novel tags in main view)
   - Mouseover behavior verified on at least 3 row types (Signal, Insight, FactorCapture)
   - All four fixtures show captures within ~60-day window
   - + refresh on Cygnus's Goal opens form with text input (not enumerated dropdown)
   - Northland's Measure popup shows 3 distinct factor rows (88%, true, Yes) — Block F fix verified
   - Northland Measure and Consult popups both show matched Patterns + "See all related insights" expand affordance — Block G fix verified
3. Any deviations from spec with rationale

After Sprint 5e ships and visual review confirms (popup readable; fixtures recent; + refresh works correctly; factors display correctly; Patterns accessible across phases), Sprint 6 (polish + EVP demo deploy) is the final sprint.

---

## Estimated scope

2-2.5 effective build days CC time.

Largest blocks:
- **Block D (fixture timeline compression)** — touches all fixture data; ~0.5 day CC
- **Block E (factor input rendering)** — schema + form dispatch logic; ~0.5 day CC
- **Block F (cross-type linkage fix)** — surgical changes in two files, regression-test across all popups; ~0.5 day CC
- **Block A (mouseover metadata)** — interaction pattern across multiple row types; ~0.25-0.5 day CC
- **Block G (Pattern expand affordance)** — popover behavior + verify cross-phase surfacing; ~0.25-0.5 day CC

Smaller blocks (B, C) are routine.
