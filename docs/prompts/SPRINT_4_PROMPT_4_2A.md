# SPRINT_4_PROMPT_4_2A.md

**Sprint 4 — Growth Conversations module · Prompt 4.2a of 4-5**

This is the fifth executable prompt for Sprint 4. Prompts 4.1a (foundation), 4.1b (chrome refinements), 4.1c (Ask form + augmenting summary), and 4.1d (Macro banner + stage hyperlinks + per-type field refactor) have all been accepted on visual review.

This prompt covers two connected workstreams: **stage-level guidance scaffolding for all stages** (addressing the "Ask implies questions, what's being asked?" observation from 4.1d's review) plus the **Size and Resolve capture forms** (replicating the patterns established in 4.1c for the simpler-to-implement of the four remaining stages).

The Show and Connect capture forms (with ArtifactParameterCapture parameter pre-population for Show, and Artifact clickability fix in read-only summaries) are deferred to Prompt 4.2b — they're the architecturally heavier capture forms.

**Prompt 4.2a covers:**
- Stage guidance scaffolding applied to all stage sections (Ask, Size, Show, Resolve, Connect, plus post-Track lifecycle stages)
- Size phase capture form (track-agnostic quantification of impact/opportunity)
- Resolve phase capture form (closure capture with sentiment, member response, ActionCard creation)
- One small refinement: log Q-034 (Macro authorship governance) per recent visual review

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan, Sprint 4 acceptance criteria
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` — actionable-insight discipline
- `docs/design/03_DATA_FRAMEWORK_AMENDMENTS.md` — schema authority
- `docs/design/04_MODULE_AND_DATA_FLOW_AMENDMENTS.md` — Growth Conversations module specification
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content
- `BLAZE_STYLE_GUIDE.md` — visual identity, four-tier display discipline, §13-14 Growth Conversations and breadcrumb patterns, §14.5 capture form patterns, §14.7 Macro banner
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry

---

## Scope of this prompt

Three substantive blocks plus housekeeping.

- **Block A:** Stage guidance scaffolding — each stage section displays a guidance paragraph that explains what the stage is for, written specifically for this Member's Member Type and Track
- **Block B:** Size phase capture form — track-agnostic quantification fields
- **Block C:** Resolve phase capture form — closure capture with sentiment, member response, and ActionCard creation

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 4 Prompt 4.2b: Show capture form with ArtifactParameterCapture parameter pre-population; Connect capture form; Artifact clickability fix in Show section read-only summaries
- Sprint 4 Prompt 4.3: Skip handling, popup confirmation, skip-state schema population
- Sprint 4 Prompt 4.4: ActionCard editing, atomic conversation-level save logic, post-save Member profile state propagation
- Sprint 5: Insight Engine module
- Topic-level question library with example phrasings (logged as Q-035; Pilot phase work)
- Macro authorship governance — power-user push, editorial review, recipient scoping (logged as Q-034; Pilot phase work)

Stop and check in after the full prompt completes. Single checkpoint at end.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Stage guidance scaffolding

### A.1 — Establish the principle

Visual review of Sprint 4 Prompt 4.1d surfaced that "Ask implies questions" — but the Ask section currently shows captured Signals without explaining what the phase is *for*. The same is true for Size, Show, Resolve, Connect, and the post-Track lifecycle stages: each section shows captured outputs without scaffolding the banker's understanding of the phase's purpose.

Stage guidance is a short paragraph displayed at the top of each stage section that explains:
- What the phase aims to surface or produce
- Member-Type-aware framing (small caterer vs. HVAC vs. specialty manufacturer)
- Track-aware framing where relevant (Working Capital LOC vs. Vehicle/Fleet vs. Commercial Real Estate)

The guidance renders in **both** the fresh capture form (when no prior captures exist) and the read-only augmenting summary (when prior captures exist). It's intended as conversational scaffolding for bankers, not as a replacement for their judgment.

### A.2 — Guidance content per stage per Member

The demo's three Members each have their own Track (or in Cygnus's case, two Asks plus a Connect-ending Track). Per Member, per stage, the guidance content is:

**Jenny's Catering — Working Capital LOC Track**

- **Ask** — *Establish the rhythm of cashflow and surface seasonal pressures driving working capital needs. Listen for blockers around customer payment timing and acute moments of seasonal stress.*
- **Size** — *Quantify the slow-season revenue gap and the magnitude of customer-payment-timing impact. Size the working capital line at roughly one quarter of the slow-season gap.*
- **Show** — *Render the seasonal cashflow chart that makes the smoothing math visible. The Member should see how the line of credit covers the trough.*
- **Resolve** — *Capture the Member's response, sentiment, and any indecision. If the Member is leaning yes but needs another decision-maker's input, surface that as the open thread.*
- **Decision pending** — *The Member has the proposal and needs internal alignment before committing. Track this as an open opportunity in the Member profile until the decision lands.*
- **Funded** — *The Working Capital LOC is funded and active. Member is in service mode; future Growth Conversations will likely surface utilization patterns or expansion triggers.*

**Northland HVAC — Vehicle/Fleet Loan Track**

- **Ask** — *Determine what greater fleet capacity would enable. Surface the work that's being declined, the regions where capacity falls short, and any trigger events (regulatory, seasonal, competitive) shaping the decision window.*
- **Size** — *Quantify the volume of declined work and the revenue-per-truck math. Size the fleet expansion against demonstrated demand and the time horizon for vehicle availability.*
- **Show** — *Render the fleet expansion ROI projection that maps quarterly cash flow against the vehicle financing payment. The Member should see breakeven and cumulative gain.*
- **Resolve** — *Capture the Member's response and any open indecision. If the Member needs to verify with their advisor or partner, surface that as the open thread.*
- **Decision pending** — *The Member has the ROI projection and needs to align with their partner or advisor before committing. Track as open opportunity.*
- **Funded** — *The Vehicle/Fleet Loan is funded and the trucks are being acquired. Future Growth Conversations may surface expansion-stage triggers (additional regions, fleet replacement).*

**Cygnus Bioscience — Commercial Real Estate Term Loan Track (Connect-ending)**

- **Ask 1** — *Probe the capital event under evaluation. Surface the Member's read on timing, scope, and the trigger event (capacity expansion, customer growth commitment, supply chain shift) shaping the window.*
- **Ask 2** — *Discover the timing driver behind the capital event. Surface the customer growth commitments or contractual milestones that anchor the decision calendar.*
- **Show** — *Render the capital event partnership map that lays out the milestones, decision points, and specialist handoffs. The Member should see the pathway from initial conversation to closing.*
- **Connect** — *Hand off to the appropriate specialist (CRE underwriter, Treasury, or Specialty Lending). Capture the introduction context and any open threads the specialist needs to know.*
- **Specialist engagement** — *The relationship is now driven by the specialist banker. Primary banker stays informed via the open opportunity thread but does not lead the technical conversation.*
- **Closed** — *The CRE Term Loan engagement has closed (funded, declined, or withdrawn). Future Growth Conversations may surface follow-on opportunities (expansion, treasury services, succession planning).*

### A.3 — Where guidance lives in the schema

Stage guidance content is Member-Type-aware and Track-aware. Two architectural options:

**Approach 1:** Store guidance as a denormalized field per stage section instance (i.e., per `GrowthStepExecution` record, or per Track-step combination in reference data).

**Approach 2:** Compute guidance from a lookup keyed on `(member_type, track_id, step_phase)` rendered server-side at page load.

**Recommend Approach 2.** Three reasons:
1. Guidance content is reference data, not member-specific captured data — it should live in code or a reference table, not be denormalized per execution
2. Updating guidance content (e.g., refining the Ask phase guidance for HVAC Members) shouldn't require migrating every existing execution record
3. The lookup naturally extends to new Member Types and new Tracks without schema changes

Implementation: create a `lib/stage-guidance.ts` module that exports a function `getStageGuidance(memberType, trackId | null, stepPhase): string`. The function returns the guidance paragraph for the (Member Type, Track, phase) tuple, with sensible fallbacks for combinations not yet authored (e.g., return a generic phase-only guidance if Member-Type-specific content isn't available).

Document the full content tree (the 18 specific guidance paragraphs above, plus any fallbacks) in `lib/stage-guidance.ts` with comments referencing this prompt's §A.2.

### A.4 — Visual treatment

Stage guidance renders directly below the stage section header (below the orange section mark and stage title), above any captured content or capture form.

Visual treatment:
- Body text size (14px), regular weight
- Slightly muted color to distinguish from primary content (between body text and labeled-value muted grey — e.g., `#3A3B3C` or similar)
- Italic or non-italic? Recommend non-italic to distinguish from direct quotes (which use italic) and stale signal date suffixes (which use italic). Stage guidance is primary instructional content, not quoted material.
- Single paragraph; no internal line breaks; ~25-50 words
- Indented or full-width? Recommend full-width to match section content alignment (no extra indent beyond what existing section content uses)
- Visual separation from header: 8-12px top margin from section title; 16-20px bottom margin to first piece of captured content or form

### A.5 — Conditional rendering

Stage guidance renders in both these states:
- **Empty state** (no prior captures, fresh form): guidance appears at the top of the section, above the "+ Add" buttons or the placeholder dashed-border box
- **Augmenting summary state** (prior captures exist): guidance appears at the top of the section, above the captured signals list

Stage guidance does NOT render when:
- The section is for a post-Track lifecycle stage (Decision pending, Funded, Specialist engagement, Closed) **AND** the existing placeholder dashed-border message already explains the lifecycle stage's purpose. In that case, replace the existing placeholder with the new stage guidance content (per the per-Member content above), keeping the dashed-border visual treatment.
- The Member has no Track yet (none of the demo Members fall into this category, but the architecture should handle it cleanly — render a generic "Run a Growth Conversation to begin capturing Signals" prompt)

### A.6 — Track-agnostic stages

Per the architectural decisions in 4.1c, Ask and Size are track-agnostic phases. The guidance for these phases is therefore Member-Type-aware but not Track-aware.

For the demo's Members:
- Jenny's Ask guidance is the same regardless of which Track surfaces (currently Working Capital LOC; future Tracks like Equipment Loan would share the same Ask guidance)
- Northland's Size guidance is the same regardless of Track
- Cygnus's two Ask stages have distinct guidance (Ask 1 vs Ask 2) but neither is Track-specific

The lookup function `getStageGuidance(memberType, trackId | null, stepPhase)` handles this cleanly — pass `null` for trackId on track-agnostic phases.

---

## Block B — Size phase capture form

### B.1 — Establish the form architecture

The Size phase is **track-agnostic** quantification — bankers capture the magnitude and scope of the opportunity that emerged from Ask phase Signals. Per Module and Data Flow §3, Size produces structured measurements that feed into Show phase Recommendations.

A single Size phase capture session can produce zero or many SizingMeasurement records. Each measurement is a quantified data point about the Member's situation.

### B.2 — Form layout

The Size section becomes editable when no prior Size captures exist OR when the banker explicitly clicks "Update captures" on a section showing prior captures.

The capture form layout:

```
[orange section mark] Size                                              ✓ · Stage 2 of 6
                                                                       [if has prior captures]

[Stage guidance paragraph from §A.2]

[+ Add measurement]

[Each added measurement renders as a sub-form below]

[Save Size captures] (button — disabled until at least one measurement is captured with valid fields)
[Cancel — discards unsaved changes for this section only]
```

When no measurements have been added yet, render the soft prompt:
```
No measurements captured yet for this conversation. Click + Add measurement to begin.
```

### B.3 — Measurement sub-form

Each measurement sub-form has:

**Required fields:**
- **Topic / dimension** — what's being measured (select dropdown, required) — pulls from a SizingDimension reference table or canonical taxonomy. Examples: `slow_season_revenue_gap`, `declined_work_volume`, `customer_concentration_percentage`, `capacity_utilization_rate`, `working_capital_cycle_days`
- **Magnitude** — the numeric value (number input, required)
- **Unit** — measurement unit (select dropdown, required): `dollars / count / days / months / percentage / hours`
- **Frequency / period** — temporal scope (select dropdown, required when applicable): `per_month / per_quarter / annually / one_time / ongoing / cumulative`
- **Source** — provenance (select dropdown, required): `member stated / member's records / banker calculated / market reference`

**Optional fields:**
- **Direct quote** — what the Member said when stating the value (text area, optional) — e.g., "About $12,000 a quarter is what I dip into the personal account for"
- **Confidence** — banker's confidence in the measurement (select dropdown, optional): `high / moderate / low / banker estimate`
- **Time period** — when the measurement applies (text input, optional) — e.g., "Q3 2025", "trailing 12 months", "fiscal year 2024"
- **Methodology note** — how the value was derived (text area, optional) — e.g., "Cross-referenced QuickBooks data with verbal estimate"

### B.4 — Field validation

- Topic / dimension, Magnitude, Unit, and Source are required
- Frequency / period is required for measurements with `unit ∈ (dollars, count, hours)` — these are typically rate-based; one-time costs use `frequency = one_time`
- Save button disabled until at least one measurement has all required fields populated
- Inline error messages appear below fields with validation issues
- Validation runs on Save click, not continuously

### B.5 — Visual treatment

Apply the four-tier display discipline (matching Ask form patterns from 4.1c):
- Field labels in muted grey
- Numeric inputs with appropriate validation (numbers only for Magnitude)
- Direct quote textarea italicized inside (matching how quotes render elsewhere)
- Sub-form container with hairline border, ~16px padding, rounded corners
- Per sub-form "× Remove" affordance in upper right
- The "+ Add measurement" button sits below any existing sub-forms

### B.6 — Multi-measurement capture

A banker may add multiple measurements during a single Size phase. Each click of "+ Add measurement" adds a new sub-form below existing ones. Save commits all sub-forms atomically.

### B.7 — Augmenting summary pattern

Same as Ask phase (4.1c). Prior measurements render as a collapsed summary list:

```
Captured measurements (3):
• slow_season_revenue_gap · $48,000 per quarter · Apr 8, 2026 [▶ expand]
• customer_payment_extension · 23 days average · Apr 8, 2026 [▶ expand]
• fixed_overhead_baseline · $8,500 per month · Dec 4, 2025 [▶ expand]
```

Each measurement row shows:
- Topic / dimension in muted grey
- Magnitude + unit + frequency in body text
- Capture date
- Expand affordance

Expanded detail uses four-tier display:
```
▼ slow_season_revenue_gap · $48,000 per quarter · Apr 8, 2026

Source: member's records · Confidence: moderate
Time period: Q3 2025 - Q1 2026
"My slow season runs about $12K/month under what I need for fixed costs"
Methodology: Cross-referenced bank statements with verbal estimate

Captured during: April 8, 2026 check in conversation
Captured by: Scott Brynjolffson

[Edit captures]   [▲ collapse]
```

Edit pattern works identically to Ask phase: editing creates a new SizingMeasurement record with supersession references on the prior. Schema additions if needed (e.g., `SizingMeasurement.superseded_by_id`, `SizingMeasurement.superseded_at`, `SizingMeasurement.active`) follow the same pattern as Signal supersession from 4.1a.

Stale signal cue at 6 months applies to SizingMeasurements as well (italic + "stale" suffix).

### B.8 — Save behavior

Save creates SizingMeasurement records linked to the same Conversation as the Ask phase captures (if one exists for this session) or creates a new Conversation (per 4.1c §C.2). Creates GrowthStepExecution record with `step_phase = size`, `growth_step_id = null` (track-agnostic).

All operations within a single transaction. After save, summary list updates with new measurements.

---

## Block C — Resolve phase capture form

### C.1 — Establish the form architecture

The Resolve phase is the **closure capture** — bankers record the Member's response to the Show phase Artifact and Recommendation, capture sentiment and any open indecision, and create the ActionCard that drives the open opportunity (or closes the conversation if the Member committed or declined).

Resolve is Track-aware: it's specific to the Track that produced the Show. The form references the Track's Recommendation in its layout.

### C.2 — Form layout

The Resolve section becomes editable when no prior Resolve captures exist OR when the banker explicitly updates.

```
[orange section mark] Resolve                                          ✓ · Stage 4 of 6
                                                                       [if has prior captures]

[Stage guidance paragraph from §A.2]

Member response on: [Track Recommendation name from Show phase]
[e.g., "Working Capital Line of Credit at $75K"]

[Single sub-form — Resolve is one capture per stage, not multi-add like Ask/Size]

[Save Resolve captures] (button)
[Cancel]
```

The Resolve form is unique among the capture forms in that it's **not multi-add** — each Resolve session captures one closure event per Track, not multiple parallel captures. The form renders as a single set of fields, not a series of "+ Add" buttons.

### C.3 — Resolve fields

**Required fields:**
- **Member response** — sentiment toward the Recommendation (select dropdown, required) — pulls from the existing 10-value `member_response` enum: `declined / leaning_no / dismissive / skeptical / confused / neutral / engaged / leaning_yes / committed / funded`
- **Primary concern** — what's driving the response (text input, required when response ∈ `skeptical / confused / leaning_no / declined / leaning_yes`) — short descriptive label, e.g., `spouse`, `rate`, `timing`, `bank capability`, `decision-maker input`
- **Source** — provenance (select dropdown, required): `member stated / banker observed`

**Optional but encouraged:**
- **Direct quote** — what the Member said about the Recommendation (text area, optional)
- **Open indecision** — captured Indecision Signal that comes out of this Resolve session (optional; if populated, creates a Signal record with `signal_type = indecision`)
- **ActionCard description** — what the banker commits to do next (text area, required when response ∈ `engaged / leaning_yes`; optional otherwise) — e.g., "Send Jenny the LOC application materials by Friday; follow up Tuesday next week"
- **ActionCard owner** — who's responsible for the next step (select dropdown, required when ActionCard description is populated) — defaults to current banker, but supports cross-banker handoff
- **ActionCard due date** — when the next step is due (date input, optional)

**Conditional rendering:**
- When response is `committed` or `funded`, the Open indecision and ActionCard fields collapse / hide (no follow-up needed in that direction)
- When response is `declined` or `dismissive`, ActionCard becomes "Closing notes" (text area, optional) — no due date or owner

### C.4 — Field validation

- Member response is required
- Primary concern is required for nuanced responses (skeptical, confused, leaning_no, declined, leaning_yes)
- ActionCard description is required for engagement responses (engaged, leaning_yes)
- Source is always required
- Save button enables when required fields are populated

### C.5 — Visual treatment

The Resolve form's single-set layout differs from Ask/Size's multi-add pattern. Visual treatment:

- Form fields render in a clean two-column grid where appropriate (e.g., ActionCard owner + due date in a row)
- Member response dropdown is the prominent first field
- Primary concern field appears just below Member response (same visual weight; closely associated)
- ActionCard fields are visually grouped (subtle hairline border around the ActionCard fieldset)
- Direct quote textarea matches Ask form treatment (italic placeholder, etc.)

### C.6 — Augmenting summary pattern

Resolve's augmenting summary is simpler than Ask/Size because there's typically one Resolve capture per Track conversation cycle:

```
[orange section mark] Resolve                                          ✓ · Stage 4 of 6

Captured April 8, 2026 · Capture closure on Working Capital Line of Credit at $75K

Member response: leaning yes · primary concern: spouse
Source: member stated
"Jenny said 'I need to talk to Marcus before I sign anything'"

→ produced: Indecision — Needs another decision-maker's input
→ produced: ActionCard — owned by Scott Brynjolffson · due Apr 22, 2026

Captured by: Scott Brynjolffson

[Edit captures]   [▲ collapse]
```

The Resolve summary expands inline (no separate sub-form list since there's only one capture). "Edit captures" converts the entire summary into the editable form pre-populated with current values.

If a Resolve session has been captured multiple times for the same Track (e.g., follow-up conversations that update the Member's response from `leaning_yes` to `committed`), the summary shows the most recent capture with a small history indicator: "(superseded 2 prior Resolve captures)". Clicking the indicator reveals prior captures (deferred to Sprint 5 polish; for demo, the supersession schema preserves the audit trail without a UI surface).

### C.7 — Save behavior

Save commits in a single transaction:
- Update or create the Track's `Recommendation.member_response` field (per Sprint 2 Prompt 1's 10-value enum)
- Update or create the Track's `Recommendation.primary_concern` field
- If Open indecision is populated, create a Signal record (`signal_type = indecision`) linked to the Conversation
- If ActionCard description is populated, create an ActionCard record with the captured fields
- Create GrowthStepExecution record with `step_phase = resolve`, `growth_step_id = [Track's Resolve step]`

Track-aware: Resolve captures must reference a specific Track's Resolve step (not track-agnostic like Ask/Size). Use the Track's GrowthStep records to find the correct `growth_step_id`.

After save, the Member profile's "Suggested next step" should re-derive based on the new `Recommendation.member_response` value. The Member profile's Active signals band updates if a new Indecision Signal was created. The Member profile's Open opportunities band updates if the response moved into engaged/leaning_yes territory.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Add or extend §13 (Growth Conversations layout) to document:
- Stage guidance scaffolding pattern (where it renders, visual treatment, content authoring philosophy)
- Size phase capture form pattern (multi-measurement, augmenting summary, supersession)
- Resolve phase capture form pattern (single-capture-per-Track, conditional fields, ActionCard creation)

Add or extend §14.5 (capture form patterns) to capture the Resolve-specific patterns:
- Member response dropdown driving conditional field visibility
- ActionCard fieldset visually grouped
- Conditional required fields based on response

### H.2 — Update lib/stage-guidance.ts (NEW)

Create the lookup module per §A.3. Document the 18 specific guidance paragraphs from §A.2 with comments referencing the source decision. Include reasonable fallbacks for (Member Type, Track, phase) tuples not yet authored.

### H.3 — Update lib/relation-names.ts and lib/verb-patterns.ts as needed

If new relations or verb patterns surface during implementation:
- Verb pattern: `quantified` (Member's situation `quantified` by SizingMeasurement)
- Verb pattern: `closed` (Conversation `closed` with Resolve capture)
- Verb pattern: `committed` (Member `committed` to Recommendation when response = committed)

### H.4 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 4 Prompt 4.2a work shipped
- Block A: Stage guidance scaffolding for all stages (18 guidance paragraphs)
- Block B: Size phase capture form with multi-measurement capture and supersession
- Block C: Resolve phase capture form with conditional fields and ActionCard creation
- Schema additions if any (SizingMeasurement supersession fields if new)
- Q-034 logged for Macro authorship governance (Pilot phase)
- Q-035 logged for Topic-level question library (Pilot phase)

### H.5 — Update OPEN_QUESTIONS

New entries:

- **Q-034:** Macro authorship governance — who can author, what review process, how recipients are scoped, what distinguishes a Macro from a Note. Power-user push vs editorial review vs portfolio-data-validated. Defer to Pilot phase.
- **Q-035:** Topic-level question library — example phrasings per Topic per Member Type to accompany the "+ Add" buttons. Editorial governance required. Defer to Pilot phase.
- **Q-036 (potentially):** Confidence field on SizingMeasurement — should this be required? Currently optional but could improve Insight Engine analytics. Revisit during Sprint 5.
- **Q-037 (potentially):** Resolve phase ActionCard owner can default to Recommendation.owned_by (cross-banker handoff scenario). Verify behavior with Cygnus's Marcus Webb handoff during testing.

### H.6 — Q-034 specifically

Per the recent visual review of the Macro banner, log Q-034 as an open question for Pilot phase. Don't address Macro governance in this prompt; it's documented as deferred work.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

**Block A:**
- [ ] All Ask sections render stage guidance paragraph at top (Member-Type-specific content per §A.2)
- [ ] All Size sections render stage guidance paragraph (Member-Type-specific)
- [ ] All Show sections render stage guidance paragraph (Member-Type and Track-specific)
- [ ] All Resolve sections render stage guidance paragraph (Track-specific)
- [ ] All Connect sections render stage guidance paragraph (for Cygnus only)
- [ ] Post-Track lifecycle stage placeholders replaced with stage guidance content
- [ ] Guidance renders in both empty state and augmenting summary state
- [ ] `lib/stage-guidance.ts` module created with all 18 guidance paragraphs documented
- [ ] Visual treatment matches §A.4 (full-width, body-text size, slightly muted color, no italic)

**Block B:**
- [ ] Size section renders editable capture form when no prior measurements
- [ ] "+ Add measurement" button works; opens sub-form
- [ ] Sub-forms have required fields (Topic/dimension, Magnitude, Unit, Source) and optional fields
- [ ] Conditional validation works (Frequency required for rate-based units)
- [ ] Multi-measurement capture in one session works
- [ ] Save commits all measurements atomically
- [ ] Save creates SizingMeasurement records with correct field values
- [ ] Save creates GrowthStepExecution with step_phase = size, growth_step_id = null
- [ ] Augmenting summary renders for sections with prior measurements
- [ ] Edit pattern works; saved edits create new records with supersession
- [ ] Stale measurement cue (>6 months) renders correctly

**Block C:**
- [ ] Resolve section renders editable form when no prior Resolve captures (single fieldset, not multi-add)
- [ ] Member response dropdown shows 10 values from existing enum
- [ ] Primary concern field is required for nuanced responses
- [ ] ActionCard description is required for engagement responses (engaged, leaning_yes)
- [ ] Conditional rendering works (committed/funded hides Indecision/ActionCard; declined/dismissive shows "Closing notes")
- [ ] Save commits in single transaction (Recommendation update + Signal creation + ActionCard creation)
- [ ] Save creates GrowthStepExecution with step_phase = resolve, growth_step_id = [Track's Resolve step]
- [ ] Member profile updates after Resolve save (Suggested next step re-derives, Active signals updates, Open opportunities updates)
- [ ] Augmenting summary renders Resolve detail in single expandable view
- [ ] Edit pattern converts summary into editable form pre-populated with current values

**Housekeeping:**
- [ ] BLAZE_STYLE_GUIDE.md updated with stage guidance, Size form, Resolve form patterns
- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS Q-034 and Q-035 logged (plus any others surfaced during implementation)
- [ ] Schema migrations run cleanly if needed
- [ ] All three Member profiles still load
- [ ] /growth-conversations/[id] for all three Members renders correctly with new guidance and forms

## Report-back format

When complete, send back:

1. **Screenshots:**
   - /growth-conversations/jenny showing Ask section with stage guidance + augmenting summary; Size section with stage guidance + capture form (or summary if seeded); Resolve section with stage guidance
   - /growth-conversations/northland showing similar with HVAC-specific guidance content
   - /growth-conversations/cygnus showing Ask 1 and Ask 2 with distinct guidance; Connect stage guidance
   - One Resolve capture form expanded showing all conditional fields working
   - One Size capture form with a measurement sub-form expanded
2. **The stage guidance lookup module** in summary form (content authoring approach, fallback handling)
3. **The Size form architecture** in summary form (component structure, multi-measurement state, supersession)
4. **The Resolve form architecture** in summary form (single-capture pattern, conditional rendering, ActionCard creation)
5. **The save behaviors** in summary form (transactions, GrowthStepExecution creation, propagation to Member profile)
6. **Any decisions made during implementation** that the prompt didn't pre-specify
7. **Any items logged to OPEN_QUESTIONS** during implementation
8. **Confirmation that hard refresh shows the changes correctly**

Stop and check in. Sprint 4 Prompt 4.2b (Show capture form with ArtifactParameterCapture parameter pre-population + Connect capture form + Artifact clickability fix in Show read-only summaries) follows after acceptance.

**Reminder:** Stage guidance is the demo's first instructional surface. When the EVP sees an Ask section with "Establish the rhythm of cashflow and surface seasonal pressures driving working capital needs" at the top, they should feel that the system is teaching the banker what to do, not just recording what was done. That's the difference between a CRM and an enablement layer.
