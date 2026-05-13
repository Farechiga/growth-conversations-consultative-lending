# EVIDENCE_FRAMEWORK.md

**Working catalog of evidence types in v2 Member Signals. Defines what evidence advances which objective, how dots map to evidence, and how Tracks-supported-by-current-evidence is computed. Companion to ARCHITECTURE_V2.md — read that first for the conceptual model; read this for the operational specifics.**

**Status:** v2 phase 1 reference. Implementation depends on this catalog being correct; review carefully before CC implementation.

**Authored:** 2026-04-29.

**Cross-references:** ARCHITECTURE_V2.md (conceptual model, dot semantics, "Tracks supported by" framing), COMPLIANCE.md (compliance tag inheritance), MEMBER_FIXTURE_BRIEF.md (which evidence types are populated per Member fixture in demo).

---

## 1. Purpose of this document

ARCHITECTURE_V2.md establishes that:
- v2 has four objectives (Discover / Measure / Consult / Navigate)
- Each objective accumulates evidence through banker activities
- Each piece of evidence renders as a dot
- Tracks are surfaced under Discover when supported by captured evidence

This document operationalizes those principles. It catalogs every evidence type, maps each to its primary and secondary objective contributions, defines how dots are computed from captured evidence, and specifies the evidence patterns that map to known Tracks.

CC and future Claude sessions reference this document when:
- Implementing dot rendering logic for an objective
- Authoring seed data for a Member fixture
- Building the Tracks-supported-by-current-evidence panel
- Adding a new evidence type or modifying an existing one
- Computing key facts strip content
- Determining which objective an activity capture advances

Without this document, dots are decorative; with it, dots are meaningful.

---

## 2. Evidence-type catalog

The catalog below maps 21 evidence types to the four v2 objectives (Discover / Measure / Consult / Navigate). Each row specifies: the evidence type, its source, the schema entity that captures it, its primary objective contribution, secondary contributions if any, and notes on character (achievement-shaped vs. accumulating, stale-able vs. permanent).

The catalog reorganized in 2026-04-30 to match the architectural vocabulary refactor:

- Goals / Blockers / Indecision moved from Understand → Discover (qualitative discovery work)
- Model produced moved from Consult → Measure (modeling is part of measuring; you have to measure and model before you can consult)
- "Recommendation rationale articulated" dropped from Discover (it's a field on the Recommendation candidate, not an independent evidence point)
- "Surfaced concern" dropped from Consult (redundant with "Primary concern or decline reason")
- Stale signal refresh primary objective derived from the type of refreshed entity (refreshed Goal advances Discover, refreshed SizingMeasurement advances Measure)

**Total per objective:** Discover 7 · Measure 4 · Consult 5 · Navigate 4.

**2026-05-04 update:** Methodology note dropped as standalone Measure evidence — it's a companion field on SizingMeasurement, not independent evidence (same logic that dropped "Recommendation rationale articulated" from Discover). Measure now ships 4 evidence types instead of 5; total catalog = 20 evidence types.

### 2.1 Discover — 7 evidence types

| Evidence type | Source | Schema entity | Primary | Secondary | Character |
|---|---|---|---|---|---|
| Goal | Member-stated, banker captured | Signal (Goal type) | Discover | — | Accumulating; stale-able after 6 months |
| Blocker | Member-stated, banker captured | Signal (Blocker type) | Discover | — | Accumulating; stale-able after 3 months |
| Indecision | Member-stated, banker captured | Signal (Indecision type) | Discover | Consult | Accumulating; stays filled after Consult resolves (audit trail preserved) |
| Trigger signal | Banker capture | Signal (Trigger type) | Discover | — | Accumulating; stale-able |
| Macro context match | System-derived | Macro + Member.member_type matching | Discover | — | Achievement; reactivates if Macro changes |
| Recommendation candidate | Banker capture | Recommendation (rationale captured as companion field on the same row, not independent evidence) | Discover | — | Achievement; updatable but not stale-able |
| Tracks-supported indicator | System-derived | Computed from captured evidence vs Track templates | Discover | — | Continuously updates as evidence accumulates |

**Note on Indecision character:** A previous version of the catalog listed Indecision as "resolves when Consult does," which suggested the dot would empty when Consult landed. Revised character: dot stays filled. Indecision is captured evidence; what gets resolved is the *content* of the Indecision, not the *fact* that it was captured. Audit trail visible across the relationship's lifetime.

**Note on Recommendation rationale:** A previous version listed "Recommendation rationale articulated" as a separate evidence type. Revised: rationale is a companion field on the Recommendation candidate row, not an independent evidence point. The dot fires when a Recommendation candidate exists; rationale text accompanies it.

### 2.2 Measure — 4 evidence types

| Evidence type | Source | Schema entity | Primary | Secondary | Character |
|---|---|---|---|---|---|
| Sized magnitude | Banker quantification | SizingMeasurement (methodology_note is a companion field on the same row, not independent evidence) | Measure | — | Accumulating; stale-able based on time period |
| Time period and confidence | Banker captured | SizingMeasurement.time_period, SizingMeasurement.confidence | Measure | — | Companions to magnitude; consolidated to single row |
| Model produced | Banker capture (+ Model activity) | Model entity (parameters, assumptions, output_summary, provenance) | Measure | Consult (when provenance is "with Member" — auto-creates ShowEvent) | Accumulating; banker may produce multiple models. Provenance distinguishes co-construction from prep work. |
| Stale signal refresh | Banker capture | Signal or SizingMeasurement supersession event | Derived from refreshed entity type | — | Refreshed Goal advances Discover; refreshed Blocker advances Discover; refreshed SizingMeasurement advances Measure. The refresh advances the same objective the original signal lived on. |

**Notes on consolidation:**

- Goals / Blockers / Indecision migrated to Discover (§2.1).
- Time period + Confidence rating consolidated into a single companion row.
- **Methodology note dropped (2026-05-04 update).** Methodology is a companion field on SizingMeasurement, not independent evidence — same logic that dropped "Recommendation rationale articulated" from Discover. The methodology text accompanies the Sized magnitude row when present; the dot fires for the magnitude itself.
- Model produced moved here from §2.3 (Consult). Modeling is a Measure activity; showing the model is a Consult activity. The schema unchanged. Provenance ("with Member" / "banker draft") is captured on the Model entity. When provenance is "with Member," a ShowEvent is auto-created (the model was constructed in front of the Member, which by definition includes showing it).
- Stale signal refresh primary objective is derived from the refreshed entity's type. Refreshed Goals / Blockers / Indecision advance Discover; refreshed SizingMeasurements advance Measure. Implementation: derive primary objective from the refreshed entity's type at the time of refresh capture.

### 2.3 Consult — 5 evidence types

| Evidence type | Source | Schema entity | Primary | Secondary | Character |
|---|---|---|---|---|---|
| Model shown | Auto-created on + Model save with "with Member" provenance, OR explicitly via "Record show" button on sidebar artifact preview | ShowEvent | Consult | — | Accumulating; same model may be shown multiple times. Sidebar artifact-click defaults to preview-only (rehearses-quietly use case); explicit Record-show preserves audit trail honesty. |
| Member reaction | Banker capture (+ Reaction activity) | Reaction.response_value (7 enum values: engaged / leaning_yes / skeptical / confused / dismissive / committed / declined) | Consult | Navigate when leaning_yes/committed | Accumulating; multiple reactions per Member possible. ReactionValue enum expanded in Sprint 4.7.2 to include `committed` and `declined` (subsumed from v1 Resolve terminal states). |
| Member quote on reaction | Member-stated | Reaction.member_quote | Consult | — | Companion to reaction; subject to compliance keyword scan |
| Decision posture | Derived from most-recent Reaction.response_value | Reaction (most-recent) | Consult | Navigate when leaning_yes/committed | Most-recent wins; surfaces in sidebar highlight |
| Primary concern or decline reason | Banker capture (+ Reaction form, contextual dropdown) | Reaction.primary_concern (NEW column added in Sprint 4.7.2) | Consult | — | Most-recent wins; supersedeable. Uses contextual taxonomy per COMPLIANCE.md §6.3: 8 open-thread enum values when response is engaged/leaning_yes/committed; 10 decline-reason enum values when response is declined/dismissive. Required for response_value ∈ {skeptical, confused, leaning_yes, declined}; optional for {engaged, committed, dismissive} per v1 NUANCED pattern. |

**Notes on the changes:**

- Model produced removed — moved to §2.2 (Measure). Modeling is measurement work.
- Surfaced concern removed — was redundant with "Primary concern or decline reason." Consolidated to single row.
- Show event source updated — Show is no longer a dialpad activity. ShowEvents fire two ways: automatically when + Model saves with "with Member" provenance, or explicitly via "Record show" button on the sidebar artifact preview dialog.
- Reaction.primary_concern is a real new schema column added in Sprint 4.7.2 (not a side-effect write to Recommendation). Side-effect path was rejected because it would break at Discover-stage Reactions (no Recommendation exists yet). The Reaction column lets the contextual taxonomy work regardless of objective context.

### 2.4 Navigate — 4 evidence types

| Evidence type | Source | Schema entity | Primary | Secondary | Character |
|---|---|---|---|---|---|
| Specialist handoff initiated | Banker capture (+ Action with type=specialist_handoff) | ActionCard with type=specialist_handoff | Navigate | — | Achievement; stays once captured |
| ActionCard for next formal step | Banker capture (+ Action) | ActionCard | Navigate | Consult if conversation-stage | Accumulating; due-date sensitive |
| Application initiated | System event (Pilot only) | Not yet defined; downstream system event | Navigate | — | Demo-deferred |
| Decision finalized | Derived from most-recent Reaction.response_value | Reaction (response_value = committed for funded path; declined/dismissive for withdrawn path) | Navigate | — | Achievement; terminal. v2 derives from Reaction; v1 retains Recommendation.member_response = funded/declined/withdrawn for v1 routes. |

**Note on Decision finalized:** v2 derives terminal state from the most-recent Reaction. v1's `Recommendation.member_response` field persists for v1 cohabitation. The two paths exist in parallel until v1 retires at Pilot.

---

## 3. Dot computation rules

Each objective renders as a row of dots. Dots are computed from captured evidence using deterministic rules.

### 3.1 Default dot rendering algorithm

For each objective, for each evidence type that contributes to it:

```
if evidence captured and current:
  render filled dot
elif evidence captured but stale (per evidence-type stale rules):
  render filled dot at 70% opacity
elif evidence type is suggested-relevant for this Member (per Track templates):
  render outlined dot
else:
  render faint dot OR omit dot entirely if evidence type doesn't apply
```

Discipline: there is no required dot count. The algorithm renders what's there, plus a small number of suggested-but-uncaptured dots when the Track templates indicate the banker may want to capture them. Faint dots can be omitted entirely if they create visual clutter; the visible dots reflect what matters.

### 3.2 Stale rules per evidence type

Stale rules trigger the 70% opacity treatment and (in objective sidebar highlight) the "stale" tag.

| Evidence type | Stale threshold | Notes |
|---|---|---|
| Goal | 6 months since last confirmation | Long-arc business goals don't shift quickly |
| Blocker | 3 months since last confirmation | Operational blockers shift faster |
| Indecision | 30 days since last surfacing | Decision-process facts go stale fast |
| Sized magnitude | Depends on time_period: more recent than time_period_end + 6 months | "Q1 2024 trailing" goes stale once 6 months past Q1 end |
| Confidence rating | Inherits from sized magnitude | Same window as parent magnitude |
| Member reaction | 30 days since captured | Reactions reflect a moment, not a state |
| Decision posture | 30 days since captured | Same |
| Primary concern | 30 days since captured | Same |
| Trigger signal | 60 days since captured | Triggers fade as the event recedes |
| Recommendation candidate | Never stale on its own; stale-by-update if a newer Recommendation supersedes | |
| Macro context match | Stale when Macro effective_period ends | System-derived; auto |

### 3.3 Accent state computation (open-thread coral)

The accent dot (coral ring/fill) appears on at most one dot per objective at a time. Selection rule for which dot earns the accent:

For Consult objective:
- If a current Member reaction has captured `primary_concern` and the Recommendation's `member_response` is in {leaning_yes, engaged, awaiting_decision}, accent the most-recent Resolution dot.
- If no resolution in flight, no accent.

For Navigate objective:
- If an ActionCard exists with due date <14 days away and status = open, accent the ActionCard dot.
- Otherwise no accent.

For Discover and Measure:
- Generally no accent state. These objectives accumulate; they don't have "open thread" semantics in the same way.
- Exception: a stale Goal in active conversation may surface as a Discover accent if Sprint 5 logic determines the staleness is consequential. Demo defers this.

At most one accent dot total across the entire workstation at any time. Multiple-urgent triage is handled in the open-thread badge in the header, which surfaces the single highest-priority accent.

### 3.4 Sidebar highlight text per objective

Below the dot row in each objective's sidebar slot, render a single line of highlight text. Computed as follows:

| Objective | Highlight content |
|---|---|
| Discover | Recommendation candidate name (e.g., "Working capital LOC") |
| Measure | Most consequential captured magnitude with stale indicator if applicable (e.g., "$48K gap · 1 stale") |
| Consult | Decision posture + primary concern if open thread (e.g., "leaning yes / spouse pending") in coral if accent active; otherwise just the posture |
| Navigate | "awaiting consult" if no Navigate evidence; otherwise "pending [next ActionCard]" or "[application status]" |

Highlights are 1 line, 24 characters or fewer. If longer, truncate with ellipsis and let click-into-objective surface full content.

---

## 4. Activity-to-evidence mapping

Five activities map to capture surfaces. Each captures one or more evidence types that advance one or more objectives. If a capture has no structured form behind it, it has no dialpad button — buttons exist only to invoke captures that produce evidence dots.

### 4.1 + Ask

**Captures:** Goals, Blockers, Indecision, Triggers via the Signal entity.

**Evidence types produced:** Goal · Blocker · Indecision · Trigger signal.

**Primary objective advanced:** Discover (all four signal types). Indecision has Consult as secondary contribution (the Indecision dot lights up under Discover; the Indecision content is referenced when consulting on the open thread).

**Form behavior:** The Ask form selects signal type (Goal / Blocker / Indecision / Trigger), captures the Member's verbatim language as direct_quote, and tags impact and timeframe attributes. Free-text fields (their_words, methodology_note where present) run compliance keyword scan on submit.

| Sub-type chosen | Evidence produced | Primary | Secondary |
|---|---|---|---|
| Goal | Goal Signal | Discover | — |
| Blocker | Blocker Signal | Discover | — |
| Indecision | Indecision Signal | Discover | Consult |
| Trigger | Trigger Signal | Discover | — |

### 4.2 + Quantify

**Captures:** SizingMeasurement entity (magnitude + dimension + methodology + time period + optional confidence).

**Evidence types produced:** Sized magnitude · Methodology note · Time period and confidence (consolidated companion row).

**Primary objective advanced:** Measure.

**Form behavior:** Quantify form captures topic/dimension, magnitude, unit, source, optional confidence, optional direct_quote, optional time period, optional methodology_note. Free-text fields run compliance keyword scan on submit.

| Field | Evidence produced | Primary | Secondary |
|---|---|---|---|
| Magnitude + unit | Sized magnitude | Measure | — |
| Methodology note | Methodology | Measure | — |
| Time period and confidence | Companions to magnitude (consolidated row) | Measure | — |
| Source (member-stated / banker-derived / cross-referenced) | Compliance-relevant per COMPLIANCE.md tagging | — | — |

### 4.3 + Model

**Captures:** Model entity (parameters, assumptions, output_summary, provenance radio).

**Evidence types produced:** Model produced. When provenance is "with Member," a ShowEvent is also auto-created (the model was constructed in front of the Member, which by definition includes showing it).

**Primary objective advanced:** Measure (Model produced); Consult (auto-ShowEvent if generated).

**Form behavior:** Model form selects parameters and assumptions (drawing from existing SizingMeasurement entries on this Member), captures output_summary as banker-prose, requires provenance radio selection. The "with Member" radio causes the save action to also create a ShowEvent record linked to this Model and the current featured Conversation. The "Banker draft" radio creates only the Model record. The output_summary field runs compliance keyword scan on submit.

| Field | Evidence produced | Primary | Secondary |
|---|---|---|---|
| Model name | Model produced | Measure | — |
| Provenance: with Member / banker draft (radio) | "With Member" auto-creates ShowEvent | — | Consult (when with Member) |
| Parameters | Companion to Model | — | — |
| Assumptions | Companion to Model | — | — |
| Output summary | Companion; subject to F-7 banker-prose discipline | — | — |
| Linked Artifact (optional) | Optional FK to Artifact | — | — |

### 4.4 + Reaction

**Captures:** Reaction entity (response_value, member_quote, optional show_event_id, primary_concern via contextual taxonomy).

**Evidence types produced:** Member reaction · Member quote on reaction · Decision posture (derived from response_value) · Primary concern or decline reason.

**Primary objective advanced:** Consult; secondary advance to Navigate when reaction is committed or leaning_yes.

**Form behavior:** Reaction form captures:
- **response_value** (radio buttons): engaged / leaning_yes / skeptical / confused / dismissive / committed / declined. The enum expands from 5 values to 7 in Sprint 4.7.2 (adds `committed`, `declined`).
- **member_quote** (banker-prose textarea): verbatim what the Member said. Subject to compliance keyword scan on submit.
- **show_event_id** (optional reference): which artifact rendering was the Member responding to? Pre-populated if the form is opened from an artifact preview context.
- **primary_concern** (contextual dropdown): NEW column on Reaction in Sprint 4.7.2. Dropdown options switch based on response_value:
  - When response_value ∈ {engaged, leaning_yes, committed}: 8 open-thread options (pricing_concern, terms_concern, timing_concern, co_decision_maker_household, external_advisor, co_owner_or_board, service_or_capability_concern, other_open_thread)
  - When response_value ∈ {declined, dismissive}: 10 decline-reason options (pricing_uncompetitive, terms_uncompetitive, timing_misaligned, chose_alternative_lender, chose_alternative_funding, need_resolved_otherwise, need_no_longer_present, wants_to_revisit_later, service_or_capability_concern, other_member_stated)
  - When response_value ∈ {skeptical, confused}: dropdown shows the open-thread set (same as engaged-spectrum) since these states are mid-conversation, not terminal

**primary_concern requiredness** matches v1 NUANCED pattern: required for response_value ∈ {skeptical, confused, leaning_yes, declined}; optional for {engaged, committed, dismissive}. The reasoning: these are the response states where the concern is the actionable signal. Engaged is too early (banker may not have probed yet); committed and dismissive are terminal in different ways and don't have the same "what's the open thread" question.

The contextual taxonomy follows COMPLIANCE.md §6.3 verbatim. Auto-clear behavior: if banker switches response_value across context boundaries (e.g., leaning_yes → declined), the primary_concern dropdown clears to "Select…".

| Field | Evidence produced | Primary | Secondary |
|---|---|---|---|
| Response value (7 enum values) | Member reaction · Decision posture | Consult | Navigate when committed/leaning_yes |
| Verbatim Member quote | Quote evidence; subject to PROTECTED_CLASS_KEYWORD_LIST scan | Consult | — |
| Primary concern (contextual taxonomy) | Concern/reason evidence; uses business-factor-only taxonomy | Consult | — |
| Linked ShowEvent (optional) | Companion | — | — |

### 4.5 + Action

**Captures:** ActionCard entity (description, owner, due_date, type).

**Evidence types produced:** ActionCard for next formal step · Specialist handoff initiated (when type = specialist_handoff).

**Primary objective advanced:** Navigate.

**Form behavior:** Action form captures description (banker-prose, subject to compliance keyword scan), owner (banker), due_date, optional next_action_type, optional reference to a Reaction or Recommendation.

| Field | Evidence produced | Primary | Secondary |
|---|---|---|---|
| Description | ActionCard evidence | Navigate | Consult |
| Owner | Companion | — | — |
| Due date | Companion; affects accent computation | — | — |
| Type (follow_up / specialist_handoff / formal_application_prep / etc.) | Companion; specialist_handoff variant adds Specialist handoff initiated dot | Navigate (when handoff) | Consult (otherwise) |

---

### Activities removed from dialpad in Sprint 4.7.2

**Show is not a dialpad button.** Showing an existing artifact during a Consult conversation is rendering, not a new capture. ShowEvents are created in two ways:

1. **Auto-creation** when the + Model form is saved with "with Member" provenance. The Model save action creates both a Model record and a companion ShowEvent record linked to the Model and the current featured Conversation.
2. **Explicit "Record show" button** on the sidebar artifact preview dialog. Clicking the artifact in the sidebar opens a preview modal. The preview modal includes a "Record show" affordance; clicking it creates a ShowEvent linked to the artifact and the current Conversation. The preview itself does not auto-create a ShowEvent — preview-without-record preserves the banker-rehearses-quietly use case.

The ShowEvent entity remains in schema. The change is at the surface layer — no + Show dialpad button.

**Resolve is not a dialpad button.** Member responses are captured via + Reaction, which now subsumes the response value, member quote, and primary concern fields previously captured in v1's Resolve form. Sprint 4.7.2 ships:
- ReactionValue enum expansion (5 → 7 values; adds `committed`, `declined`)
- Reaction.primary_concern column with contextual taxonomy

The v1 Resolve form persists for v1 routes; v2 routes do not surface it. The Reaction entity remains in schema as a distinct semantic capture from ShowEvent.

---

## 5. Tracks-supported-by-current-evidence framework

Per ARCHITECTURE_V2.md §10, the Discover panel surfaces Tracks supported by current evidence with strength banding (strong / moderate / insufficient). This section operationalizes the framework.

### 5.1 Track templates

A Track template defines:
- The Track's name (e.g., "Working Capital LOC")
- The Track's product type
- The expected Member Type cohort
- The expected evidence pattern (which evidence types should be present, with optional thresholds)
- The strength-banding thresholds (% of expected evidence captured)

Demo includes 6-8 Track templates initially. For phase 1, hand-author them in seed data.

### 5.2 Track-template structure (illustrative; not final schema)

```json
{
  "id": "working_capital_loc",
  "name": "Working Capital LOC",
  "product_type": "loan_revolving",
  "applicable_member_types": ["small_caterer", "trades_construction", "specialty_manufacturer"],
  "expected_evidence": [
    {
      "type": "blocker",
      "subtypes": ["seasonal_cashflow_stress", "slow_customer_payments"],
      "weight": 25
    },
    {
      "type": "sized_magnitude",
      "constraints": { "min_magnitude_usd": 25000, "max_magnitude_usd": 200000 },
      "weight": 25
    },
    {
      "type": "goal",
      "subtypes": ["smooth_seasonal_revenue", "operate_cash_freely"],
      "weight": 20
    },
    {
      "type": "macro_match",
      "macros": ["q3_supplier_payment_compression"],
      "weight": 15
    },
    {
      "type": "recommendation_candidate",
      "weight": 15
    }
  ],
  "strength_thresholds": {
    "strong": 75,
    "moderate": 40
  },
  "compliance_notes": "Member Type alignment is one input; banker confirms Member Type by direct observation, not by demographic inference. Per COMPLIANCE.md Member Type discipline."
}
```

### 5.3 Strength computation

For each Track template, for the current Member:
1. Sum the weights of expected evidence items that are captured and current.
2. Total possible weight = sum of all expected evidence weights = 100.
3. Resulting score = (captured weight) / 100, expressed as percentage.
4. Map to band: ≥75% strong; 40-74% moderate; <40% insufficient.

Surface the top 3-5 Tracks ranked by score. Tracks below 40% can be hidden from the panel by default ("see more →" expansion shows all).

### 5.4 Demo seed data

For each of the three Member fixtures, the seed defines:
- 1 strong-support Track per Member (matches what the Member's evidence supports)
- 1 moderate-support Track per Member (partial match, plausible second consideration)
- 1 insufficient-evidence Track per Member (didn't fit but worth showing the framework)

| Member | Strong | Moderate | Insufficient |
|---|---|---|---|
| Jenny's Catering | Working Capital LOC | Cash Management upgrade | Equipment Loan |
| Northland HVAC | Vehicle/Fleet Loan | Working Capital LOC | CRE Term Loan |
| Cygnus Bioscience | CRE Term Loan | Equipment Loan | Working Capital LOC |

These map cleanly to each Member's existing fixture content. The strength bands are honest reflections of captured evidence patterns.

### 5.5 Compliance discipline for the panel

Per ARCHITECTURE_V2.md §10.2, the panel uses careful framing language. Phrases that must appear:
- ✓ "Tracks supported by current evidence"
- ✓ "Strong support" / "Moderate support" / "Insufficient evidence"

Phrases that must not appear:
- ❌ "Candidate tracks for this Member"
- ❌ "Recommended for"
- ❌ "Eligible"
- ❌ "Bumped to"

The framing positions the system as informing banker judgment, not making credit decisions or steering. This is a non-negotiable in CC implementation.

---

## 6. Key facts strip computation

Per ARCHITECTURE_V2.md §6.2, the key facts strip surfaces 3-5 most-consequential captured facts per Member. For demo, these are hand-curated per fixture; for Pilot, an algorithm chooses.

### 6.1 What qualifies as a key fact

Key facts are externalizations of dot evidence. They make the dot's content visible at-a-glance without requiring click-through. Good key facts share three properties:

1. **Specific** — a number, a named state, a named entity, a date. Not "doing well" or "engaged conversation."
2. **Recent or persistent** — captured within the last 90 days OR an enduring foundation fact (e.g., the Recommendation product is persistent).
3. **Glance-meaningful** — banker reads it in <1 second and understands the implication.

### 6.2 Curation per fixture

Demo seeds with these key facts:

**Jenny's Catering:**
- `$48K · slow-season gap` (sourced from SizingMeasurement)
- `$75K · LOC sized` (sourced from Recommendation)
- `leaning yes · spouse pending` (sourced from Recommendation.member_response and primary_concern)
- `Apr 8 · last touch` (sourced from most recent Conversation)

**Northland HVAC:**
- `$180K · fleet target` (sourced from SizingMeasurement)
- `18 months · payback` (sourced from Model output_summary)
- `engaged · awaiting board` (sourced from Recommendation.member_response and primary_concern)
- `Apr 5 · last touch` (sourced from most recent Conversation)

**Cygnus Bioscience:**
- `$4-7M · CRE need` (sourced from SizingMeasurement range)
- `capital event · anchor customer` (sourced from Trigger signal)
- `specialist engaged · CRE underwriter` (sourced from Specialist handoff ActionCard)
- `Apr 21 · last touch` (sourced from most recent Conversation)

### 6.3 Click behavior per fact

Each key fact is clickable. Click opens an in-place panel showing the source evidence:

- Magnitude facts → SizingMeasurement detail
- Sized recommendation amount → Recommendation detail
- Decision posture / concern → most recent Resolution detail
- Last touch date → most recent Conversation summary
- Trigger or capital event → Trigger Signal detail
- Specialist engaged → ActionCard detail

### 6.4 Phase 1 implementation note

For phase 1, the keyFacts data is curated and stored as a JSON field on the Member entity. This is the simplest path. For Pilot, an algorithm derives keyFacts from captured evidence using rules like:
- Always include the largest captured magnitude
- Always include the active Recommendation's sized amount if any
- Always include the current decision posture if a Recommendation is active
- Always include the most recent Conversation date
- Always include Trigger if recent (<60 days) and high-impact

That algorithm is out of demo scope.

---

## 7. Compliance tag inheritance

Per COMPLIANCE.md, every field in the schema carries a compliance tag from the Wave 1 taxonomy. This section maps evidence types to their compliance tags.

| Evidence type | Compliance tags |
|---|---|
| Macro context match | `[FL:GOV-ARTIFACT]` (Macro entity) |
| Trigger signal | `[FL:BIZ-FACTOR]` `[FL:DECISION-TRACE]` |
| Recommendation candidate | `[FL:DECISION-TRACE]` |
| Recommendation rationale | `[FL:BANKER-PROSE]` `[FL:DECISION-TRACE]` |
| Goal | `[FL:BIZ-FACTOR]` `[FL:DECISION-TRACE]` |
| Blocker | `[FL:BIZ-FACTOR]` `[FL:DECISION-TRACE]` |
| Indecision | `[FL:DECISION-PROCESS]` `[FL:DECISION-TRACE]` |
| Sized magnitude | `[FL:BIZ-FACTOR]` `[FL:DECISION-TRACE]` |
| Methodology note | `[FL:BANKER-PROSE]` `[FL:BIZ-FACTOR]` |
| Time period | `[FL:BIZ-FACTOR]` |
| Confidence rating | `[FL:BIZ-FACTOR]` |
| Stale signal refresh | `[FL:DECISION-TRACE]` |
| Model produced | `[FL:BIZ-FACTOR]` `[FL:DECISION-TRACE]` |
| Model shown | `[FL:DECISION-TRACE]` |
| Member reaction | `[FL:DECISION-TRACE]` |
| Member quote | `[FL:BANKER-PROSE]` (subject to PROTECTED_CLASS_KEYWORD_LIST scan) |
| Surfaced concern | `[FL:DECISION-TRACE]` |
| Decision posture | `[FL:DECISION-TRACE]` |
| Primary concern / decline reason | `[FL:DECISION-TRACE]` (uses business-factor-only taxonomy) |
| Specialist handoff initiated | `[FL:DECISION-TRACE]` |
| ActionCard | `[FL:DECISION-TRACE]` |
| Application initiated | `[FL:DECISION-TRACE]` (Pilot only) |
| Decision finalized | `[FL:DECISION-TRACE]` |

Tags inherit through evidence types from their source schema fields. When CC implements v2, the compliance-tags.json registry per COMPLIANCE.md should reflect this mapping.

---

## 8. Banker-prose fields and submit-time scan

Three v2 evidence types involve banker free-text capture and are subject to the F-7 banker-prose discipline (helper text + submit-time keyword scan):

- **Methodology note** (in + Quantify form)
- **Member quote** (in + Reaction form, also in any other capture that allows verbatim member statement)
- **Closing notes** (in + Resolve form)
- **Customer response** (in + Resolve form)
- **Recommendation rationale** (when banker authors the rationale)
- **Context note** (in + Show form)

For each of these:
- Helper text frames business-cashflow-only capture (per Track 1 Sprint 4.6)
- Submit-time scan against PROTECTED_CLASS_KEYWORD_LIST_v1.md
- Soft advisory prompt on hit; banker can edit or continue
- Telemetry logged

CC implementation reuses the keyword scan infrastructure from Sprint 4.6 across all v2 banker-prose fields.

---

## 9. Track-template authoring discipline

When v2 phase 1 implementation defines Track templates, the templates themselves carry compliance considerations:

- **Member Type alignment** is one input. Member Type is governed by COMPLIANCE.md Member Type discipline (business attributes only; not protected-class proxies).
- **Magnitude constraints** are pure business factors (revenue, gap size, etc.).
- **Macro alignment** is a system-derived signal pointing to authored Macros.
- **No protected-class fields** appear in Track template expected-evidence patterns.
- **No demographic inference** is used to qualify or disqualify Tracks.

When CC implements Track templates, every expected_evidence entry must be classifiable under `[FL:BIZ-FACTOR]` or `[FL:GOV-ARTIFACT]` tags. Anything that cannot be is a finding.

---

## 10. Cross-references for implementation

When implementing v2:

- **For dot rendering**: §3 of this document, plus ARCHITECTURE_V2.md §5
- **For activity capture forms**: §4 of this document, plus the v1 capture forms (Ask, Quantify, Resolve) which are reused
- **For Tracks-supported panel**: §5 of this document, plus ARCHITECTURE_V2.md §10
- **For key facts**: §6 of this document, plus ARCHITECTURE_V2.md §6.2
- **For compliance tagging**: §7 of this document, plus COMPLIANCE.md Wave 1 taxonomy
- **For seed data authoring**: this document's strength-band thresholds, key facts curation, and Track template authoring; plus MEMBER_FIXTURE_BRIEF.md

---

## 11. Document maintenance

Like ARCHITECTURE_V2.md, this catalog is the authoritative reference. Updates happen in place when:
- A new evidence type is added or retired
- A Track template is added, modified, or retired
- Stale rules are calibrated based on real banker behavior (Pilot only)
- Compliance tag mappings change
- The strength-banding thresholds are revised

Updates are noted in BUILD_LOG.md with rationale and timestamp.

---

**End of EVIDENCE_FRAMEWORK.md.**
