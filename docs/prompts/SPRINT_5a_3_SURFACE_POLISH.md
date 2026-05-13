# Sprint 5a.3 — Surface Polish: Semantic Labels, Humanized Values, Coach Restructure

**Prompt for Claude Code. Single checkpoint. Ships three surface-quality patches surfaced by Sprint 5a.2 visual review. Estimated 1.5-2 effective build days. Three blocks: semantic labels in popup CapturedRows; humanized qualitative values; coach surface structural redesign that reuses popup-as-workflow components.**

## Pre-flight context

Sprint 5a.2 shipped the popup-as-workflow surface, dot system simplification, Track switching dropdown, real-time ranker re-execution. Visual review confirmed structural landing. Three surface defects surfaced:

- **Defect 1 — Popup CapturedRows display the type chip ("Sized", "Member", "Industry") as primary label rather than the factor's display name.** Semantic context is missing. A row showing "Sized 28%" doesn't tell the banker *what* 28% measures. The factor's `name` field (e.g., "Seasonal cashflow variance") is the structured semantic label that already exists in matrix data.
- **Defect 2 — Qualitative values render as raw enum strings.** `late_paying_customer`, `cashflow_volatility`, `industry_seasonal = true` rendering as `late_paying_customer`, `cashflow_volatility`, `yes`. Bankers see machine-readable enums where they should see human-readable values.
- **Defect 3 — Coach surface renders as wall-of-prose.** While popup-as-workflow surfaces, dots, and dialpad all adopted structured-fields discipline, the coach surface still renders as paragraph narratives. Coach should mirror popup-as-workflow's structural pattern: section per objective, structured action items, clickable CTAs to capture forms, chip/figure aesthetic.

These defects are demo-quality issues, not foundation issues. Sprint 5a.3 patches them before Sprint 5b (Insight Engine portfolio surfaces).

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` (at repo root) — particularly Section 1 (factor display names that become primary labels in popup CapturedRows).
2. `ARCHITECTURE_V2.md` §3 (objectives + question framings from V2_OBJECTIVE_QUESTIONS) — these become coach section headers per Block C.
3. `lib/stage-guidance.ts` — current MEMBER_TYPE_GUIDANCE and OBJECTIVE_GUIDANCE content. Block C restructures how this is rendered, not the content itself (Francisco's editorial pass on MEMBER_TYPE_GUIDANCE is complete and stays as authored).
4. `app/v2/members/[id]/objective-popup.tsx` — Sprint 5a.2's popup-as-workflow component. Block C reuses CTARow and CapturedRow components from this file.
5. `COMPLIANCE.md` §10.2 — banned-phrase discipline. Coach section copy must continue to honor it.

If any of these documents are missing or out of date, **stop and surface to Francisco** rather than proceeding from inference.

**Architecture authority:** ARCHITECTURE_V2.md §3 wins for objective architecture; `BUSINESS_FACTOR_MATRIX_v1.md` wins for factor display names; existing popup-as-workflow component pattern (`objective-popup.tsx`) wins for coach surface structural discipline.

## What ships in this sprint (5a.3)

Three blocks plus governance updates. Single checkpoint, delimited diffs.

- **Block A — CapturedRow semantic labels.** Replace type-chip primary label with factor display name. Two-column layout: factor name (primary label) + value (right-aligned figure). Apply uniformly across all surfaces that render captured factors.
- **Block B — Humanize qualitative values.** Transformation helper applied to all qualitative captured value rendering. Drop underscores, sentence-case appropriately.
- **Block C — Coach surface structural redesign.** Reuse popup-as-workflow components (CTARow, question framings). Section per objective with structured action items and clickable CTAs to capture forms. Maximum component reuse; minimum new authoring.

---

## Block A — CapturedRow semantic labels

### A.1 Current state

Sprint 5a.2's popup CapturedRow renders as:

```
[Sized chip]   28 %
captured May 4 · by Scott Brynjolffson · via + Quantify
```

The type chip ("Sized") is the primary label. The captured value (28%) sits next to it. Banker has to infer *what* 28% measures from the surrounding popup context.

### A.2 Replacement layout

Two-column layout where the factor's display name (from `BusinessFactor.name`) is the primary label and the captured value is the right-aligned figure:

```
Seasonal cashflow variance                              28%
captured May 4 · by Scott Brynjolffson · via + Quantify
```

Visual treatment:
- Factor name: regular weight, primary text color
- Value: bold, right-aligned, larger size for emphasis on the figure
- Capture metadata: smaller, muted, on the line below

The type chip ("Sized" / "Goal" / "Blocker" / "Trigger" / "Reaction" / "Model") is **secondary metadata**, not the primary label. CC chooses how to render it:
- **Option 1:** Drop entirely (the factor's category in matrix data already implies the type)
- **Option 2:** Keep as small accent chip near the metadata line
- **Option 3:** Keep as left-margin gutter element

CC defaults to Option 1 (drop entirely) for cleanest layout. Document the choice in BUILD_LOG.

### A.3 Source of factor display name

For factor-derived captures, the primary label comes from `FactorCapture → BusinessFactor.name` lookup. Block B helpers from Sprint 5a.2 (`deriveDotsForObjective` etc.) already do this lookup; reuse the same pattern in CapturedRow rendering.

For non-factor-derived captures (existing Signals, SizingMeasurements, Models, ShowEvents, Reactions that don't yet have FactorCapture linkage), use the most descriptive available field:
- Signal: `Signal.signal_type` + `Signal.title` if present, else `Signal.direct_quote` excerpt
- SizingMeasurement (free-form mode): `SizingMeasurement.topic` + dimension
- Model: `Model.title` or model name
- ShowEvent: artifact name (via `ShowEvent.artifact_id` lookup)
- Reaction: `Reaction.response_value` humanized + "to {artifact name if linked}"

Each non-factor source type gets a clean derivation rule. CC implements per existing patterns.

### A.4 Apply uniformly across surfaces

CapturedRow is rendered in:
- Popup-as-workflow bottom zone (primary case from Sprint 5a.2)
- Captured feed (main panel)
- Sidebar artifact preview (if applicable)
- Anywhere else captures display

Apply the new layout uniformly. Visual review will probe each surface for consistency.

### A.5 Acceptance criteria for Block A

- [ ] Popup CapturedRows display factor display name as primary label (from BusinessFactor.name)
- [ ] Captured values right-aligned and visually emphasized (bold or larger)
- [ ] Type chip dropped or moved to secondary metadata
- [ ] Non-factor captures display sensibly (per A.3 derivation rules)
- [ ] Layout consistent across popup, captured feed, sidebar artifact
- [ ] No regression in capture metadata display (date · banker · activity)

---

## Block B — Humanize qualitative values

### B.1 Current state

Qualitative captures render raw enum values:
- `late_paying_customer` (factor-tag from + Ask)
- `cashflow_volatility` (factor-tag from + Ask)
- `industry_seasonal = true` rendering as `yes`
- `co_decision_maker_household` (primary_concern dropdown)

These are machine-readable but not banker-readable.

### B.2 Humanization helper

Implement `lib/humanize-capture-value.ts` exporting:

```typescript
function humanizeCaptureValue(
  capture: FactorCapture,
  factor: BusinessFactor
): string
```

Rules per `factor.capture_mode`:

- **`numerical`:** Format with appropriate unit. `28` + unit `%` → `28%`. `48000` + unit `$` → `$48,000`. CC's call on locale formatting; default to en-US conventions per existing codebase.

- **`boolean`:** Map to factor-context-appropriate text. Not always "Yes/No":
  - For confirmation-type factors (like `industry_seasonal`): boolean true → "Confirmed" or "Yes — seasonal industry"; false → "Confirmed not seasonal" or "Not seasonal industry"
  - For presence-type factors: boolean true → "Observed"; false → "Not observed"
  - CC chooses sensible defaults per factor; document edge cases in BUILD_LOG

- **`qualitative_select`:** Drop underscores, sentence-case the value. `late_paying_customer` → "Late-paying customer". `co_decision_maker_household` → "Co-decision-maker household". Apply consistently.

- **`qualitative_multi`:** JSON array; render as comma-separated humanized list. `["business_checking", "ach_origination"]` → "Business checking, ACH origination".

### B.3 Implementation guidance

Keep the helper pure: takes capture + factor, returns string. No side effects. Testable in isolation.

For the underscore-dropping/sentence-casing rule, simple transformation:
1. Replace `_` with ` `
2. Capitalize first letter
3. Preserve hyphens (e.g., `late-paying-customer-style` should stay as "Late-paying-customer-style" not "Late paying customer style")

### B.4 Apply across surfaces

Apply humanization wherever qualitative captures render:
- Popup CapturedRow values (Block A's right-column figure)
- Capture form display when reviewing existing captures
- Captured feed items
- Anywhere else qualitative values appear

Replace any direct `qualitative_value` rendering with `humanizeCaptureValue(capture, factor)`.

### B.5 Acceptance criteria for Block B

- [ ] `humanizeCaptureValue` exists in `lib/humanize-capture-value.ts`
- [ ] Numerical values render with appropriate units and formatting
- [ ] Boolean values render as factor-context-appropriate text (not raw "yes/no")
- [ ] Qualitative_select values drop underscores and sentence-case correctly
- [ ] Qualitative_multi values render as comma-separated humanized list
- [ ] Helper applied uniformly across popup, captured feed, capture forms
- [ ] No raw enum strings visible to banker

---

## Block C — Coach surface structural redesign

### C.1 Current state

Coach surface renders as wall-of-prose paragraphs per objective. Example from Cygnus's coach:

> *"Two trigger captures matter: capacity expansion under evaluation (the floor-space decision) and customer volume commitments (the volumes that anchor the timing). Capture both as distinct Triggers. Macro context (regional commercial banking competition) frames the conversation."*

Banker has to read paragraphs and infer action items. No clickable CTAs, no structured fields, no figure emphasis.

### C.2 Replacement structure

Coach surface mirrors popup-as-workflow structural discipline. Per objective, render:

**Section header:**
- Objective name (Discover / Measure / Consult / Navigate)
- Question framing (verbatim from V2_OBJECTIVE_QUESTIONS)

**Top zone — what to capture (action items):**
- Bulleted list of action items from existing MEMBER_TYPE_GUIDANCE prose, restructured as discrete bullets
- Each bullet is action-oriented (verb-led: "Capture...", "Quantify...", "Show...", "Confirm...")
- Where a bullet maps to a specific factor or capture, render as **clickable CTA** that opens the corresponding capture form (reuse Block E pre-selection plumbing from Sprint 5a.2)
- Figures and quantities **bolded** (e.g., "~85% capacity utilization", "$4-7M scope")

**Bottom zone — supporting context:**
- Brief structured note about Member-Type-specific patterns
- Where captures already exist for this Member, optionally surface a small "see captured" link to the popup (CC's call; nice-to-have, not blocking)

### C.3 Reuse popup-as-workflow components

Coach surface should reuse:
- `CTARow` component from `objective-popup.tsx` for clickable action items in top zone (or a lightly-adapted variant)
- `V2_OBJECTIVE_QUESTIONS` constants for section headers
- Capture form pre-selection plumbing from Sprint 5a.2 Block E (clicking a coach CTA pre-selects the relevant factor in the capture form)

Where the popup component pattern doesn't quite fit (e.g., coach has a "supporting context" subsection that popups don't have), CC adapts minimally rather than building from scratch.

### C.4 Restructure existing content, don't author new content

The existing MEMBER_TYPE_GUIDANCE paragraphs in `lib/stage-guidance.ts` (post-Francisco's editorial pass) are the **source content**. Block C restructures the *rendering*, not the content authorship.

Process:
1. For each Member Type × Objective combination, parse the existing paragraph into discrete action items
2. Render each action item as a structured bullet (clickable CTA where applicable)
3. Preserve the substantive content (Member-Type-specific guidance for Cygnus's capacity-expansion path, etc.) — just render it structurally instead of as prose

Where the existing prose has "narrative connective tissue" (transition phrases, framing language) that doesn't translate to structured bullets, drop it. The bullets stand on their own.

If you find a paragraph that genuinely requires narrative form to make sense (rare, but possible), keep that subsection as a brief structured prose paragraph below the bullets — not the primary rendering, but a secondary "context" sub-element.

### C.5 Banner-phrase discipline

Per COMPLIANCE.md §10.2, coach surface must continue to honor banned phrases. The existing MEMBER_TYPE_GUIDANCE content was authored with this discipline; restructuring should preserve it. If any restructured bullet ends up using "Recommended for", "Eligible for", "Pre-qualified", etc., adjust before shipping.

### C.6 Visual treatment

Match the popup-as-workflow visual vocabulary:
- Section headers: same weight/style as popup headers
- Bullets: structured rows similar to CTARow
- Figures: bolded
- Clickable CTAs: visually distinct from non-clickable bullets (subtle hover state, click affordance icon)
- Spacing and typography: consistent with popup-as-workflow surface

### C.7 Acceptance criteria for Block C

- [ ] Coach surface renders structured per objective (section headers + bullets + supporting context)
- [ ] Action items render as discrete bullets (not paragraphs)
- [ ] Clickable CTAs link to correct capture forms with pre-selection
- [ ] Figures and quantities bolded
- [ ] Banned phrases per COMPLIANCE.md §10.2 not present
- [ ] All four objectives renderable for all three Member Types
- [ ] Visual coherence with popup-as-workflow surface
- [ ] Existing MEMBER_TYPE_GUIDANCE content preserved (restructured, not rewritten)

---

## Governance updates

After Blocks A, B, C ship and visual review confirms acceptance:

1. **BUILD_LOG.md entry** for Sprint 5a.3 covering:
   - What shipped per block
   - Type chip handling decision (Option 1 / 2 / 3 from A.2)
   - Boolean humanization choices per factor (B.2)
   - Coach restructuring decisions (which paragraphs collapsed cleanly into bullets, which retained brief prose form)
   - Cross-references to BUSINESS_FACTOR_MATRIX_v1.md and existing component reuse

2. **No OPEN_QUESTIONS amendments expected.** Sprint 5a.3 is execution polish, not architectural extension.

3. **CLAUDE.md manifest update** — note `lib/humanize-capture-value.ts` as new file.

---

## Pilot deferrals to honor

Sprint 5a.3 does not ship:
- Coach surface real-time updates on new captures — Sprint 5b consideration
- Member-Type guidance further authoring — Pilot
- Coach for Member Types beyond the current three — Pilot
- Coach localization — Pilot
- Full per-objective evidence panel from Q-A1 — already resolved by popup-as-workflow

If a question arises during 5a.3 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5a.3 is complete, report back with:

1. Confirmation that Blocks A, B, C shipped per acceptance criteria
2. Visual probes (screenshots if browser available, HTML probes if not) of:
   - Jenny's Discover popup with new CapturedRow layout (factor display name + value)
   - Jenny's Measure popup with humanized qualitative values
   - Cygnus's coach surface restructured (section per objective + bullets + clickable CTAs)
   - Northland's coach surface (verify Member-Type-specific content preserved)
   - Click-flow from coach CTA to capture form with pre-selection
3. Type chip handling decision (which option chosen and rationale)
4. Boolean humanization decisions per factor (any edge cases worth flagging)
5. Any coach paragraphs that didn't restructure cleanly (kept as brief prose)
6. Any deviations from spec with rationale
7. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan the diff structure so each block is delimited.

---

## Estimated scope

1.5-2 effective build days. The biggest block:
- **Block C (coach restructure)** — non-trivial composition work; reusing popup-as-workflow components helps; per-Member-Type content restructuring is the bulk of the time

Smaller blocks (A semantic labels, B humanizer) are straightforward extensions of existing patterns.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Sprint 5a.3 is surface polish; over-engineering it delays Sprint 5b unnecessarily.

After Sprint 5a.3 ships and visual review confirms (popups display semantic labels, qualitative values are human-readable, coach mirrors popup-as-workflow discipline), Sprint 5b (Insight Engine portfolio surfaces) is the next major sprint.
