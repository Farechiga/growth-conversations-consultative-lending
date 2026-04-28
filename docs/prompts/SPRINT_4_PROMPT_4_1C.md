# SPRINT_4_PROMPT_4_1C.md

**Sprint 4 — Growth Conversations module · Prompt 4.1c of 4-5**

This is the third executable prompt for Sprint 4. Sprint 4 Prompt 4.1a (foundation) and Prompt 4.1b (chrome refinements) have both been accepted on visual review.

This prompt builds the first real capture form in Growth Conversations — the Ask phase — along with the architectural pattern that handles signal longevity (augmenting summaries that show prior captures with timestamps, expandable and editable). This is the demo's first visible "real product" moment: bankers can actually capture Signals through a structured form, and prior captures persist with audit trail.

Per the discipline of breaking up monolithic prompts, this prompt deliberately scopes to Ask + augmenting summary. The Macro context banner on Member profile and stage label hyperlinks land in Prompt 4.1d. The remaining capture forms (Size, Show, Resolve, Connect) land in Prompt 4.2.

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan, Sprint 4 acceptance criteria
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` — actionable-insight discipline (relevant for inline insight surfaces inside Ask form)
- `docs/design/03_DATA_FRAMEWORK_AMENDMENTS.md` — schema authority (Signal supersession, ArtifactParameterCapture)
- `docs/design/04_MODULE_AND_DATA_FLOW_AMENDMENTS.md` — Growth Conversations module specification
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content
- `BLAZE_STYLE_GUIDE.md` — visual identity, four-tier display discipline, §13 Growth Conversations layout
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry

---

## Scope of this prompt

Three substantive blocks plus housekeeping. The Ask form is the largest architectural lift in Sprint 4 because it establishes the capture pattern that Size, Show, Resolve, and Connect will later replicate.

- **Block A:** Ask phase capture form — structured fields for capturing Goal, Blocker, Indecision, Trigger Signals
- **Block B:** Augmenting summary pattern — completed Ask sections show prior captures with timestamps; expandable; editable; audit trail preserved
- **Block C:** Save behavior for Ask phase — stage-by-stage save creates Signal records with proper supersession when updating prior captures

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 4 Prompt 4.1d: Macro context banner on Member profile, stage label hyperlinks from Member profile to Growth Conversations
- Sprint 4 Prompt 4.2: Size, Show, Resolve, Connect capture forms; ArtifactParameterCapture for Show
- Sprint 4 Prompt 4.3: Skip handling, popup confirmation, skip-state schema population
- Sprint 4 Prompt 4.4: ActionCard editing, atomic conversation-level save logic, post-save Member profile state propagation
- Inline insight surfaces during Ask phase that depend on cohort patterns at production scale (Sprint 5 work)
- Sprint 5 Insight Engine module
- Cross-portfolio anonymized insights (architectural foundation only — full surface in Sprint 5)

Stop and check in after the full prompt completes. Single checkpoint at end.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Ask phase capture form

### A.1 — Establish the form architecture

The Ask phase is **track-agnostic** discovery — bankers capture member context that holds true regardless of which growth product surfaces. Per Module and Data Flow §3, the Ask form captures four Signal types:

- **Goal Signals** — what the Member is trying to accomplish (smooth seasonal revenue, expand capacity, transition ownership)
- **Blocker Signals** — what's standing in the way (cash flow stress, slow customer payments, capacity constraints)
- **Indecision Signals** — uncertainty surfacing in conversation (needs spouse input, awaiting CPA review, evaluating partners)
- **Trigger Signals** — events warranting banker response (capital event anticipated, supply chain disruption, market shift)

A single Ask phase capture session can produce zero or many Signals across these four types. The form supports flexible capture — bankers add Signals as they emerge in conversation, rather than being forced through a fixed sequence.

### A.2 — Form layout

The Ask section on the Growth Conversations page becomes editable when no prior Ask captures exist (run_track mode) OR when the banker explicitly clicks "Update captures" on a section showing a prior summary (advance_opportunity mode — covered in Block B).

The capture form layout:

```
[orange section mark] Ask                                              ✓ · Stage 1 of 6
                                                                       [if has prior captures]

What did the Member share about their situation?
[Capture from this conversation:]

[+ Add Goal]    [+ Add Blocker]    [+ Add Indecision]    [+ Add Trigger]

[Each added Signal renders as a sub-form below — see A.3]

[Save Ask captures] (button — disabled until at least one Signal is captured or fields are valid)
[Cancel — discards unsaved changes for this section only]
```

Above the buttons, when no Signals have been added yet, render a soft prompt:
```
No Signals captured yet for this conversation. Click + Add to begin.
```

### A.3 — Signal sub-form

When a banker clicks "+ Add Goal" (or Blocker, Indecision, Trigger), a sub-form expands inline. Each Signal sub-form has:

**Common fields (all Signal types):**
- **Title** — short descriptive label (text input, required) — e.g., "Smooth seasonal revenue with working capital"
- **Direct quote** — what the Member actually said, verbatim (text area, optional but encouraged) — e.g., "I just want to be able to sleep through January"
- **Impact** — severity assessment (select dropdown, required): for Goals, options are `peripheral / important / central`; for Blockers, options are `manageable / painful / acute`; for Indecisions, options are `manageable / painful / acute`; for Triggers, options are `low / moderate / urgent`
- **Timeframe** — recency of the signal (select dropdown, required): options are `recent / ongoing / historical / anticipated`
- **Source** — provenance (select dropdown, required): options are `member stated / banker inferred / banker observed`

**Type-specific structured fields:**

For **Goal Signals**, additional optional field:
- **Goal subtype** — dropdown of canonical goal subtypes from existing taxonomy (e.g., `smooth_seasonal_revenue`, `expand_capacity`, `transition_ownership`, `enter_new_market`, `improve_margins`)

For **Blocker Signals**, additional optional fields:
- **Blocker subtype** — dropdown of canonical blocker subtypes (e.g., `seasonal_cash_flow_stress`, `slow_customer_payments`, `capacity_below_demand`, `regulatory_compliance`)
- **Magnitude** — quantification (number input, optional): the dollar/count/days value
- **Magnitude unit** — dropdown (required if Magnitude entered): `dollars / count / days / months / percentage`
- **Magnitude frequency** — dropdown (required if Magnitude entered): `per_month / per_quarter / annually / one_time / ongoing`

For **Indecision Signals**, additional optional fields:
- **Indecision type** — dropdown of canonical indecision types (e.g., `spouse, cpa, partner, rate, speed, commitment, timing, bank_capability, other`)
- **Magnitude** — same as Blocker (often null for Indecisions)
- **Magnitude unit / frequency** — same as Blocker

For **Trigger Signals**, additional optional fields:
- **Trigger subtype** — dropdown of canonical trigger subtypes (e.g., `capital_event_anticipated`, `supply_chain_disruption`, `regulatory_change`, `competitive_pressure`, `succession_planning`)
- **Time horizon** — dropdown: `imminent / 3-6_months / 6-12_months / 12-24_months / longer`

### A.4 — Field validation

- Title and Impact and Timeframe and Source are required for any Signal
- If Magnitude is entered, Magnitude unit and Magnitude frequency are both required
- Save button disabled until at least one Signal has all required fields populated
- Inline error messages appear below fields with validation issues
- Validation runs on Save click, not continuously (avoid distracting the banker mid-entry)

### A.5 — Visual treatment

Apply the existing four-tier display discipline:

- Field labels: muted grey (#4F5052), 13px, regular weight
- Field inputs: standard form treatment matching the Member lookup search input from 4.1a
- Direct quote textarea: italicized text inside (matching how quotes render elsewhere on the system)
- Dropdowns: native select elements styled to match the system's overall identity (cool grey background, square edges, monospace for the dropdown indicator)
- Sub-form containers: subtle hairline border (#E8EAEC), 16px padding, rounded corners ~4px

The four "+ Add Signal" buttons render as a horizontal row of secondary buttons (cool grey background, orange text, hover state). They sit above the sub-form area; clicking one expands a sub-form below.

### A.6 — Multi-Signal capture in one session

A banker may add multiple Signals during a single Ask phase. Each click of "+ Add Goal" (or similar) adds a new sub-form below any existing ones. There's no fixed order — the banker can add Goals, then Blockers, then more Goals, as they emerge in conversation.

Each sub-form has its own "× Remove" affordance (small × in the upper right of the sub-form) to discard if the banker added it by mistake.

The Save button commits all sub-forms at once when clicked.

### A.7 — Reference data sourcing

The dropdowns for Goal subtype, Blocker subtype, Indecision type, Trigger subtype, and other enumerated values pull from existing reference data in the database. If the reference data isn't yet populated for a given enum, populate it as part of this prompt — values should match the values used in MEMBER_FIXTURE_BRIEF.md and existing seed data.

Document the reference data values in BUILD_LOG so they're traceable for Sprint 5 Insight Engine work (which will surface these subtypes as analytical axes).

---

## Block B — Augmenting summary pattern

### B.1 — The principle

Per the Sprint 3 architectural conversation: when a banker re-enters Growth Conversations months later and the Ask section already has captured Signals, those captures should remain visible (not hidden behind a "Show prior captures" toggle). The banker can update or extend.

Per the user-confirmed direction: "augment a summary would be very clean, as long as it was expandable and editable."

The pattern: the Ask section displays captured Signals as a summary list at the top, with each Signal expandable for full detail and editable.

### B.2 — Summary list rendering

For an Ask section with prior captures (one or more existing Signal records linked to this Member), render:

```
[orange section mark] Ask                                              ✓ · Stage 1 of 6

Captured signals (4):
• Goal · Smooth seasonal revenue with working capital · Apr 8, 2026 [▶ expand]
• Blocker · Seasonal cash flow stress · Apr 8, 2026 [▶ expand]
• Blocker · Slow customer payments · Dec 4, 2025 [▶ expand]
• Indecision · Needs another decision-maker's input · Apr 8, 2026 [▶ expand]

[+ Update captures]   [+ Add Goal]   [+ Add Blocker]   [+ Add Indecision]   [+ Add Trigger]
```

Each Signal row in the summary shows:
- Signal type (Goal / Blocker / Indecision / Trigger) in muted grey
- Signal title in body text
- Capture date in muted grey
- Expand affordance (▶ chevron, clickable)

### B.3 — Expanded Signal detail

Click the expand chevron to reveal full detail in place:

```
▼ Goal · Smooth seasonal revenue with working capital · Apr 8, 2026

Impact: central · Timeframe: ongoing · Source: banker inferred
"I just want to be able to sleep through January"
Goal subtype: smooth_seasonal_revenue

Captured during: April 8, 2026 check in conversation
Captured by: Scott Brynjolffson

[Edit captures]   [▲ collapse]
```

The expanded detail uses the four-tier display discipline:
- Labeled values for descriptive captured fields (Impact, Timeframe, Source)
- Italicized direct quote in the orange-vertical-line treatment from existing patterns
- Plain inline text for entity-categorizing metadata (Goal subtype: ...)
- Capture provenance in muted grey at the bottom

### B.4 — Edit pattern

Click "Edit captures" on an expanded Signal to enter edit mode. The expanded Signal becomes a fillable sub-form (same pattern as A.3) pre-populated with current values.

The banker can:
- Modify any field
- Save the changes
- Cancel to discard changes

When changes are saved, the system creates a NEW Signal record with the updated values, sets the prior Signal's `superseded_by_signal_id` to the new Signal's ID, and sets the prior Signal's `superseded_at` to now. The prior Signal is retained (audit trail); the new Signal is the canonical current state.

The summary list updates to show the new Signal in place of the prior one. Both can still be retrieved via expand → "View revision history" (deferred to Sprint 5 polish; for now, the supersession schema preserves the audit trail without a UI surface).

### B.5 — Add captures pattern

The "+ Add Goal / Blocker / Indecision / Trigger" buttons remain available even when prior captures exist. Clicking adds a new Signal sub-form below the summary list. New Signals do NOT supersede existing ones — they're additions, not replacements.

This handles the case where new context emerges in a follow-up conversation without invalidating prior captures.

### B.6 — Stale signal awareness

Per INSIGHT_ENGINE_DESIGN_NOTES.md, signals can become stale (e.g., a 9-month-old captured Goal that may no longer hold). Visual cue:

- Signals captured more than 6 months ago render the date in italic muted grey with " · stale" suffix (e.g., "Dec 4, 2025 · stale")
- Hover state on the date shows a tooltip: "Captured 9 months ago. Consider verifying or updating."
- The expanded detail view includes a soft prompt above the field detail: "This signal was captured 9 months ago. Confirm it still holds, or update with current information."

The 6-month threshold is configurable; document the choice in BUILD_LOG.

### B.7 — Empty state

When no Ask captures exist for the Member, the section renders the capture form directly (per Block A.2) without a summary list. The "+ Update captures" affordance is hidden in this state.

---

## Block C — Save behavior for Ask phase

### C.1 — Save semantics

Clicking "Save Ask captures" commits all currently-pending sub-forms (new additions and edits) atomically:

- For each new Signal sub-form: create a Signal record with the captured fields
- For each edited Signal: create a new Signal record with updated fields; set the prior Signal's `superseded_by_signal_id` and `superseded_at`
- All operations occur within a single transaction

If validation fails on any sub-form, no records are created; the banker sees inline errors and can correct.

### C.2 — Conversation linking

Each Signal record needs to link to a Conversation record (the Conversation in which it was captured). For this prompt's scope:

- If a Conversation record already exists for this Growth Conversations session (because the banker has saved prior stages), link new Signals to that Conversation
- If no Conversation record exists yet (this is the banker's first save action in the session), create a new Conversation record with appropriate fields:
  - `member_id` — the current Member
  - `banker_id` — the current banker
  - `conversation_type` — `check_in` (default for Growth Conversations sessions; future prompts may add type selection)
  - `conversation_date` — today
  - `sentiment` — null for now (captured later; Resolve phase typically captures sentiment)
  - `direct_quote_summary` — null for now (also Resolve phase concern)
- Link all new Signals to this newly-created Conversation

The Conversation record persists across the rest of the Growth Conversations session — when the banker eventually saves Size, Show, Resolve captures (in later prompts), those records link to the same Conversation.

### C.3 — GrowthStepExecution creation

When the banker saves Ask captures, also create a GrowthStepExecution record:

- `conversation_id` — the Conversation record from C.2
- `growth_step_id` — for now, use a "track-agnostic Ask" step ID (which may not yet exist in the schema)

**Architectural decision needed during implementation:** Track-agnostic Ask + Size phases don't have specific GrowthStep records in the way that track-specific Show/Resolve do (per Data Framework §4 amendment). Two approaches:

- **Approach 1:** Create a special "track-agnostic" Track entity that has a single Ask step and a single Size step; reference these GrowthSteps from track-agnostic captures
- **Approach 2:** Allow GrowthStepExecution.growth_step_id to be null when the execution is for track-agnostic Ask/Size; add a `step_phase` field that captures `ask | size | show | resolve | connect` independent of growth_step_id

**Recommend Approach 2** — cleaner architecturally; doesn't pollute the Track reference data with a synthetic "track-agnostic" Track. Implement and document the schema addition (GrowthStepExecution.step_phase enum field) as part of this prompt.

If GrowthStepExecution.step_phase requires schema migration, run it as part of Block C. If the existing schema can accommodate the pattern through other means (e.g., GrowthStep.is_track_agnostic flag), use that instead and document the decision.

### C.4 — UI feedback on save

After successful save:
- Sub-forms collapse and become summary rows in the augmenting summary list
- Brief toast or inline success message: "Ask captures saved · 3 Signals recorded"
- The Ask section header updates if needed (e.g., checkmark indicator appears if not already there; "Stage 1 of 6" remains)
- The anchor progress bar's Ask state updates to "completed" (orange filled dot, checkmark in section header)

After failed save:
- Toast or inline error: "Could not save. [validation error summary]"
- Sub-forms remain expanded with inline errors per A.4
- No records created; transaction rolled back

### C.5 — Cancel behavior

Click "Cancel" on a sub-form → discard that sub-form's changes, but don't affect other pending sub-forms or saved records. The sub-form collapses or is removed.

If the banker navigates away from Growth Conversations (clicks breadcrumb, clicks "View Member profile", clicks browser back button) with unsaved changes:

- For now, allow navigation without warning. Sprint 4 Prompt 4.4 will add unsaved-changes detection and confirmation prompts. Document this as a known gap in BUILD_LOG.

### C.6 — Re-rendering after save

After save, the Ask section re-renders with the augmenting summary pattern (Block B). The newly-saved Signals appear in the summary list. The form returns to its empty-or-augmented state.

The Member profile (in another tab or after navigation back) shows the new Signals in its Active signals band when refreshed. For this prompt's scope, full real-time propagation across tabs is not required; Sprint 4 Prompt 4.4 handles atomic save + propagation.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Update §13 (Growth Conversations layout) to document:
- Ask form architecture (four "+ Add" buttons; sub-form pattern; multi-Signal capture)
- Augmenting summary pattern (summary list + expand + edit; supersession audit trail)
- Stale signal visual cue (6-month threshold; italic suffix; hover tooltip)

Add a new subsection on capture form patterns that future capture forms (Size, Show, Resolve, Connect in Prompt 4.2) will follow. The Ask form establishes the canonical pattern.

### H.2 — Update lib/relation-names.ts and lib/verb-patterns.ts as needed

If new relations or verb patterns surface during implementation:
- Relation: `superseded_by` (Signal A `superseded_by` Signal B) — already added in 4.1a; verify still correct
- Verb pattern: `captured` (existing) — verify still works for new save behavior
- Verb pattern: `superseded` (potentially new) — Signal A `superseded` Signal B at timestamp T

### H.3 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 4 Prompt 4.1c work shipped
- Block A: Ask phase capture form with four Signal types and structured fields
- Block B: Augmenting summary pattern with expand, edit, and supersession audit trail
- Block C: Save behavior including Conversation creation and GrowthStepExecution.step_phase architectural decision
- Reference data values for Goal subtypes, Blocker subtypes, Indecision types, Trigger subtypes (full enumeration)
- Schema changes if any (GrowthStepExecution.step_phase or equivalent)
- Known gaps deferred to later prompts (unsaved-changes detection; multi-tab real-time propagation)

### H.4 — Update OPEN_QUESTIONS

Likely additions:

- **Q-028:** Stale signal threshold (6 months). Validate during real-world use; may need per-Signal-type thresholds.
- **Q-029:** Track-agnostic GrowthStepExecution.step_phase architectural choice. Document the decision; revisit if it surfaces issues during Size phase implementation.
- **Q-030:** Conversation.conversation_type defaulting to `check_in` for Growth Conversations sessions. Future prompts may need explicit type selection (e.g., quarterly review, onboarding, service inquiry).
- **Q-031:** Multi-tab/multi-window editing of the same Member's captures. Last-write-wins semantics; potential UX issue for production but acceptable for demo.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Ask section on `/growth-conversations/[memberId]` renders an editable capture form when no prior Ask captures exist
- [ ] Four "+ Add" buttons (Goal, Blocker, Indecision, Trigger) work; each opens a sub-form
- [ ] Sub-forms have appropriate type-specific fields per A.3
- [ ] Required field validation works (Title, Impact, Timeframe, Source)
- [ ] Conditional validation works (Magnitude requires unit and frequency)
- [ ] Multi-Signal capture in one session works (multiple sub-forms)
- [ ] Save commits all pending sub-forms atomically
- [ ] Save creates Signal records with correct field values
- [ ] Save creates a Conversation record if one doesn't exist for this session
- [ ] Save creates a GrowthStepExecution record (with step_phase or equivalent track-agnostic mechanism)
- [ ] Augmenting summary pattern renders for sections with prior captures
- [ ] Summary list shows Signal type, title, date, expand affordance
- [ ] Expand reveals full Signal detail with four-tier display discipline
- [ ] Edit pattern works; saved edits create new Signal records with supersession references
- [ ] "+ Add" buttons remain available alongside summary list
- [ ] Stale signal visual cue renders for Signals captured more than 6 months ago
- [ ] Empty state renders when no Ask captures exist
- [ ] Failed save shows validation errors; no records created
- [ ] Cancel discards sub-form changes without affecting saved records
- [ ] After successful save, summary list updates with new Signals
- [ ] Member profile (refreshed) shows newly captured Signals in Active signals band
- [ ] BLAZE_STYLE_GUIDE.md §13 updated with Ask form patterns
- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS updated with Q-028 through Q-031
- [ ] Schema migration runs cleanly if needed
- [ ] All three Member profiles still load
- [ ] /growth-conversations/jenny renders with Ask section showing prior captures (4 Signals from seed data)
- [ ] /growth-conversations/northland renders with Ask section showing prior captures
- [ ] /growth-conversations/cygnus renders with Ask section showing prior captures (2 Triggers)

## Report-back format

When complete, send back:

1. **Screenshots:** /growth-conversations/jenny showing Ask section with augmenting summary (4 Signals listed); one Signal expanded showing full detail; an in-progress edit; the empty state if you can simulate it (e.g., a hypothetical Member with no captures); /growth-conversations/cygnus showing Ask 1 and Ask 2 with their distinct captures
2. **The Ask form architecture** in summary form (component structure, validation approach, multi-Signal handling)
3. **The augmenting summary pattern** in summary form (summary list rendering, expand/edit pattern, supersession handling)
4. **The save behavior** in summary form (Conversation creation, GrowthStepExecution creation, supersession transactions)
5. **The track-agnostic GrowthStepExecution decision** (Approach 1 or Approach 2 or alternative; rationale)
6. **Reference data values** captured for the dropdowns
7. **Any decisions made during implementation** that the prompt didn't pre-specify
8. **Any items logged to OPEN_QUESTIONS** during implementation
9. **Confirmation that hard refresh shows the changes correctly**

Stop and check in. Sprint 4 Prompt 4.1d (Macro context banner on Member profile + stage label hyperlinks from Member profile to Growth Conversations) follows after acceptance.

**Reminder:** This is the largest single capture-form prompt in Sprint 4. The pattern established here (form architecture, augmenting summary, save behavior, supersession) will be replicated by Size, Show, Resolve, Connect in Prompt 4.2. Get this right before scaling.
