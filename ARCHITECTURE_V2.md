# ARCHITECTURE_V2.md

**Authoritative reference for the v2 Member Signals architecture. Captures the conceptual model, layout pattern, navigation discipline, and design vocabulary that supersede the prior 6-stage, multi-page approach. Read this before authoring any v2 prompt, building any v2 component, or making design decisions about Member-facing surfaces.**

**Status:** v2 is the architectural target for the EVP demo. v1 (the existing 6-stage Member Profile + Growth Conversations split) remains live and accessible during the build for reference and fallback, but is not the primary demo surface.

**Authored:** 2026-04-29 after multi-message design conversation working from fresh-eyes review of the v1 build, swimlane analysis of consultative banking activity, and pattern-comparison against best-in-class parallel-process interfaces (Linear, HubSpot, mission-control consoles).

**Supersedes:** Stage-keyed routing in DEMO_BUILD_PLAN.md §3, six-stage progression model in BLAZE_STYLE_GUIDE.md §13, much of the cross-cutting integration narrative in 04_MODULE_AND_DATA_FLOW_AMENDMENTS.md.

**Cross-references:** EVIDENCE_FRAMEWORK.md (the evidence-type catalog this document refers to), COMPLIANCE.md (the clean-room and protected-class governance this design depends on), BLAZE_STYLE_GUIDE.md (typography and visual identity the v2 components must comply with), INSIGHT_ENGINE_DESIGN_NOTES.md (the cohort-query infrastructure v2 shares with Sprint 5).

---

## 1. The architectural premise

The v1 build modeled a banker-Member relationship as a **6-stage sequenced pipeline** (Ask → Size → Show → Resolve → Decision pending → Funded). This model is borrowed from sales pipelines and was useful for early build velocity, but it does not match how consultative lending conversations actually proceed.

Consultative banking is **continuous parallel activity** organized around persistent objectives. A banker doesn't "complete Ask, then complete Size, then complete Show." A banker discovers Goals, captures sized magnitudes, models scenarios, surfaces Member reactions, and addresses concerns — often in the same conversation, often in different orders, often returning to earlier activities as new information emerges. Discovery never ends. Quantification refines iteratively. Reactions surface continuously.

The v1 page UI tried to render this stage model literally — sections per stage, descriptions per stage, completion checkmarks per stage. The result was an interface that showed the *system's view* of the conversation rather than the *banker's view*: stage scaffolding visible everywhere, captured Member voice buried beneath system-authored coaching prose, empty stages occupying as much vertical space as captured ones.

v2 reorganizes around two abstractions that match consultative reality:

- **Objectives** — what the banker is trying to accomplish. Persistent, evidence-based, never strictly "complete." Four of them, defined in §3.
- **Activities** — what the banker does. Free-form, cycle-able, banker-initiated. Seven of them, defined in §4.

These two layers are independent. An activity (capture a Goal) produces evidence that may advance one or more objectives. The same objective may receive evidence from many activities. Bankers reach for activities as tools, not stages; objectives accumulate evidence as the relationship deepens, not as a workflow advances.

**The two-layer model is the foundation of v2. Everything else in this document follows from it.**

---

## 2. Definitional vocabulary

Words used precisely throughout v2. Drift from these definitions is a documentation bug.

| Term | Definition |
|---|---|
| **Member** | The business entity Blaze serves. Individual contacts within the business are not Members; the business is the Member. |
| **Banker** | The Blaze relationship manager (RM) using the system. The system's primary user persona. |
| **Conversation** | A single touchpoint — a meeting, call, email exchange, captured asynchronously. Not an entity that has a "stage." |
| **Objective** | A persistent goal the banker is working toward with this Member. v2 defines four objectives. Objectives accumulate evidence; they are not strictly "complete" or "incomplete." |
| **Activity** | A discrete capture or modeling action the banker takes. v2 defines five activities. Activities produce evidence. |
| **Evidence** | A captured signal, magnitude, model, reaction, resolution, or action that supports one or more objectives. Each piece of evidence is rendered in the UI as a "dot" against the relevant objective. |
| **Dot** | The UI primitive that represents a single evidence point against an objective. Has four visual states (filled, outlined, faint, accented). |
| **Track** | A named pattern of business need + financial product + conversation arc that has worked for similar Members. Surfaced under the Discover objective when evidence supports it. |
| **Workstation** | The single v2 page per Member. Replaces the v1 split between Member Profile and Growth Conversations. |
| **Open thread** | The single most-urgent item requiring banker attention for this Member. Surfaced as the coral-accented badge in the workstation header. |
| **Capture form** | The form (modal or drawer) surfaced when a banker presses an activity button. |

Three terms from v1 are deliberately retired in v2 vocabulary:

- **"Stage"** — replaced by *objective* (when persistent) or *activity* (when transient). The word "stage" is not used in v2 banker-facing UI.
- **"Phase"** — same retirement. The `step_phase` enum may persist in the schema for backward compatibility but is not visible in v2 UI.
- **"Step"** — replaced by *activity* in banker-facing language. `GrowthStepExecution` may persist in schema but its banker-visible expression is the activity capture.

---

## 3. The four objectives

Each objective has: a name, a question the banker is answering, a definition, the kinds of evidence that advance it, and the visual rendering pattern. The four-objective structure replaces v1's six-stage waterfall; objectives are persistent abstractions that accumulate evidence rather than transitioning sequentially. A banker can capture evidence advancing any objective at any moment in the relationship; the typical arc Discover → Measure → Consult → Navigate is descriptive, not prescriptive.

### 3.1 Discover

**Question the banker is answering:** *Do we understand how their business can grow?*

**Definition:** Surface the supporting context, market conditions, seasonality, and business-specific circumstances that frame what this Member needs. Capture qualitative discovery signals (Goals, Blockers, Indecision, Triggers) and connect them to a candidate product or growth track.

**Evidence types that advance it (7 total):**
- Goal (Member-stated growth aspiration)
- Blocker (Member-stated obstacle to growth)
- Indecision (Member-stated hesitation, with structured indecision_type)
- Trigger signal (banker observation of an event warranting reach-out)
- Macro context match (system-derived: Member's Type/Industry matches an active Macro)
- Recommendation candidate proposed (banker hypothesis about a specific product; rationale captured as a companion field, not a separate evidence type)
- Tracks supported by current evidence (anonymized cohort match — *v2 phase 1 addition*)

**Character:** Continuously deepening early in the relationship; achievement-shaped once a candidate Track is supported. New conversations surface new Goals/Blockers/Indecision; the discovery surface stays open even after the banker has identified a candidate Recommendation, because Member context evolves.

**Visual rendering:** 4-7 dots typical. The "Tracks supported" panel surfaces under this objective when clicked. Sidebar highlight typically surfaces the candidate Recommendation product label (e.g., "Working Capital LOC").

### 3.2 Measure

**Question the banker is answering:** *Have we measured the pain, the lost opportunities, and the solution?*

**Definition:** Quantify the business situation: the magnitude of the gap, the cost of the status quo, and the size and shape of the proposed solution. Scope and model. Move from "we understand the business has a need" to "we have a defensible read on the numbers and a model the Member can examine."

**Evidence types that advance it (4 total):**
- Sized magnitude (banker-quantified, with source, time period, optional confidence; methodology is a companion field on the SizingMeasurement, not independent evidence)
- Time period and confidence (companions to magnitude; together captured on the SizingMeasurement)
- Model produced (banker constructed an artifact with parameters, assumptions, output_summary — provenance is "with Member" or "banker draft")
- Stale signal refresh (banker confirms or supersedes a previously-captured signal or measurement; primary objective derived from the type of the refreshed entity — refreshed Goal advances Discover, refreshed SizingMeasurement advances Measure)

**Character:** Continuously deepening through quantification. Magnitudes get sharpened as more evidence accumulates. Models get built as banker drafts and refined into with-Member co-construction. The objective is "supported enough" when there's a defensible numerical case for the candidate Recommendation.

**Visual rendering:** 3-5 dots typical. Sidebar highlight surfaces the most consequential captured magnitude (e.g., "$48K slow-season gap"). When a Model has been produced, the artifact card in the sidebar reflects it.

### 3.3 Consult

**Question the banker is answering:** *Does the Member see how the opportunity comes together? Can they map the numbers to their business?*

**Definition:** Walk the Member through the model produced in Measure. Capture how they react, what they understand, what they push back on, and what open threads hold their decision. Consult is the conversation *about* the measurement work — not the measurement itself.

**Evidence types that advance it (5 total):**
- Model shown (artifact rendered to Member during a conversation; created automatically when a Model is saved with "with Member" provenance, or explicitly when banker clicks "Record show" on a sidebar artifact preview)
- Member reaction (engaged / leaning yes / skeptical / confused / dismissive / committed / declined — captured via + Reaction)
- Member quote on reaction (verbatim what they said; companion field on Reaction)
- Decision posture (most-recent reaction value; surfaces in sidebar highlight when leaning_yes or committed)
- Primary concern or decline reason (the specific thread holding the decision, captured per the contextual business-factor-only taxonomy in COMPLIANCE.md §6.3 — open-thread context for engaged/leaning_yes/committed; decline-reason context for declined/dismissive)

**Character:** Iterative. A Consult conversation may surface a new Blocker that sends the banker back to Discover, or surface a concern that requires more Measure work. A Member may shift from leaning-yes to engaged when a concern surfaces. The objective is "in motion" until the Member commits, declines, or moves into Navigate.

**Visual rendering:** 4-5 dots typical. The most-recent captured posture appears in the objective sidebar highlight. When an open thread exists (e.g., "spouse pending"), the ringed-dot accent appears on the Consult objective using the coral urgency color.

**Note on Indecision dots:** Indecision captures contributed to Discover (primary) and Consult (secondary). When a Consult conversation resolves the indecision (Member commits or proceeds despite the indecision), the Indecision dot stays filled — audit trail preserved. The dot represents what was captured, not its current resolution state.

### 3.4 Navigate

**Question the banker is answering:** *Are we helping get this across the finish line and ensuring introductions get traction?*

**Definition:** Move the Member from "ready to proceed" to "actually proceeded." Initiate handoff to specialist, ensure introductions land, track ActionCards through to completion, and confirm the formal application or specialist engagement actually happens.

**Evidence types that advance it (4 total):**
- Specialist handoff initiated (banker triggered an introduction or referral via + Action with type=specialist_handoff)
- ActionCard for next formal step exists (concrete commitment with owner and due date)
- Application initiated (system event from downstream loan-origination system; Pilot only)
- Decision finalized (committed → funded; or declined / withdrawn)

**Character:** Achievement-shaped. Once initiated, it stays initiated. Most Members in active conversation will not have any Navigate evidence until late in the relationship. The objective is "satisfied" when the Member has formally moved into a downstream system or specialist engagement, regardless of final outcome.

**Visual rendering:** 2-4 dots typical. Frequently shows zero filled dots ("awaiting consult") for Members in earlier objectives. Visible but dimmed when no evidence; activates when first Navigate activity occurs.

---

## 4. The five activities

Activities are tools the banker reaches for. Each maps to a structured capture form. If there is no structured form, there is no button — buttons exist only to invoke captures that produce evidence dots.

The dialpad (see §6) renders these five activities as buttons at the top of the workstation, persistent and always-visible.

**The five activities:**

| Activity | Captures | Schema entity | Evidence advances |
|---|---|---|---|
| **+ Ask** | Goal / Blocker / Indecision / Trigger | Signal | Discover (primary); Indecision secondary on Consult |
| **+ Quantify** | SizingMeasurement (magnitude + methodology + period + confidence) | SizingMeasurement | Measure |
| **+ Model** | Model entity (parameters, assumptions, output_summary, with-Member or banker-draft provenance) | Model; auto-creates ShowEvent when provenance is "with Member" | Measure (Model produced); Consult (auto ShowEvent if generated) |
| **+ Reaction** | Reaction entity (response value, member quote, primary concern via contextual taxonomy) | Reaction | Consult (primary); Navigate when reaction is committed |
| **+ Action** | ActionCard (description, owner, due date, type) | ActionCard | Navigate (primary) |

Notes on activity choice:

- **The "With Member" / "Banker draft" radio on + Model** is critical. When the model is built collaboratively with the Member during a conversation, that's a stronger evidentiary capture than a banker draft. With-Member provenance also auto-creates a ShowEvent (the model was constructed in front of the Member, which by definition includes showing it).
- **+ Reaction subsumes v1's Resolve.** The form captures response value (7 enum values), member quote, optional ShowEvent reference, and primary concern via contextual taxonomy (Sprint 4.6 8-value open-thread set or 10-value decline-reason set, switched on response value).
- **Activities don't enforce sequence.** The dialpad doesn't gray out activities that "shouldn't yet" be available. Bankers can press any activity any time.

**Activities removed from dialpad in Sprint 4.7.2:**

- **Show is not a dialpad button.** Showing an existing artifact during a Consult conversation is rendering, not a new capture. ShowEvents are created in two ways: automatically when the + Model form is saved with "with Member" provenance, or explicitly when the banker clicks "Record show" on the sidebar artifact preview dialog. Sidebar artifact-click defaults to preview-only (preserves the banker-rehearses-quietly use case); the explicit Record-show action keeps the audit trail honest.

- **Resolve is not a dialpad button.** Member responses are captured via + Reaction, which subsumes the response value, member quote, and primary concern fields previously captured in v1's Resolve form. The v1 Resolve form persists for v1 routes (`/growth-conversations/[memberId]`); v2 routes do not surface it through the dialpad.

**Schema implications:** Both ShowEvent and Reaction entities continue to exist in the schema as distinct semantic captures. The simplification is at the surface layer (dialpad), not the data layer. Sprint 4.7.2 ships two real schema changes: ReactionValue enum expands from 5 to 7 values (adds `committed`, `declined` — terminal states subsumed from v1 Resolve) and Reaction gains a `primary_concern` column with the contextual taxonomy from COMPLIANCE.md §6.3.

---

## 5. The dot system

Each piece of evidence renders as a single dot against the objective(s) it advances. Dots are the primary glance-able UI primitive of v2.

### 5.1 Dot states

| State | Visual | Semantic |
|---|---|---|
| **Filled** | Solid `--blaze-grey-darker` fill, no stroke | This evidence is captured and current |
| **Outlined** | Hollow circle with 0.5px `--blaze-grey-darker` stroke, 40% opacity | This evidence type is suggested but optional — banker may want to capture but isn't required |
| **Faint** | Hollow circle with `--blaze-grey-soft` stroke, 20% opacity | Not yet relevant; placeholder space; banker can ignore |
| **Accented** | Solid `--blaze-orange-burnt` fill OR outlined with 1.5px `--blaze-orange-burnt` stroke and ring | This evidence is the open thread; needs banker attention |

**Discipline:** Dots are predominantly gray. Color appears only as urgency accent. A typical Member workstation has many gray dots and zero-to-one accented dots. Two or more accented dots simultaneously is a signal that the Member's situation has multiple urgent items and the banker should triage.

### 5.2 Dot count and "no required N"

There is **no required dot count** per objective. There is no "of N" counter, no progress bar, no completion threshold. Dots represent supporting evidence; an objective is "satisfied enough" when the banker judges they have a defensible case to move forward, not when a bar fills.

This is a deliberate departure from gamified progress UIs. The discipline rests on banker judgment, not system-enforced thresholds.

That said, certain Tracks may surface "Tracks supported by current evidence" with confidence-band framing (see §10). This is not a system-enforced threshold for the banker's overall objective; it is a *Track-specific* indication that "given the captured evidence, here are products with strong/moderate/insufficient support." The banker still decides.

### 5.3 Dots are clickable

Every dot is interactive. Click behavior:

| Dot type | Click reveals |
|---|---|
| Filled | The captured evidence detail (full augmenting summary, supersession history, edit controls) — opens in-place panel |
| Outlined (suggested) | Capture form for that evidence type, pre-routed to this objective |
| Faint | No-op (or subtle "not yet relevant" tooltip) |
| Accented | Detail panel for the open thread, with affordances to address it (schedule call, mark resolved, etc.) |

Clicking an objective name (rather than a specific dot) opens the full objective panel showing all evidence organized by type with inline + Add affordances per evidence type.

### 5.4 Dot rendering layout

In the sidebar, dots render as a horizontal row directly under the objective name. Sizing: 8px diameter (4px radius), 6px gap. A row of 5-8 dots fits comfortably in the 180px-wide sidebar slot.

For mobile/narrow viewports, dots may need to wrap; the wrap should preserve evidence-type ordering rather than recency ordering so the banker's mental model of "which dot represents what" stays stable.

---

## 6. Pattern A: the workstation layout

The v2 Member workstation uses a single layout pattern across all Members. Variation by Member Type is in *content*, not *structure*.

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                          OPEN THREAD  │
│ Member name / type / banker          coral accent if active  │
├──────────────────────────────────────────────────────────────┤
│ KEY FACTS STRIP                                              │
│ Most-consequential captured facts, externalized              │
├──────────────────────────────────────────────────────────────┤
│ ACTIVITY DIALPAD                                             │
│ [+Ask] [+Quantify] [+Model] [+Reaction] [+Action]            │
├────────────┬─────────────────────────────────────────────────┤
│ SIDEBAR    │ MAIN PANEL                                      │
│            │                                                 │
│ Objectives │ Captured evidence feed                          │
│  + dots    │  Sorted recent-first                            │
│            │  6 capture-card variants (one per activity)     │
│ Artifact   │  Each card click-to-expand                      │
│  slot      │                                                 │
│            │  Empty-state nudge at bottom                    │
│ Macro      │                                                 │
│  slot      │                                                 │
│            │  Coach affordance: "show ?"                     │
│ History    │  History affordance: "history (N) ↗"            │
└────────────┴─────────────────────────────────────────────────┘
```

### 6.1 Header

Single-line layout:
- **Left:** Member name (display weight per BLAZE_STYLE_GUIDE.md §5.2), tagline (Member Type · Lifecycle stage · Primary banker)
- **Right:** Open thread badge — the single most-urgent item with date or context. Coral accent treatment per §5.4 of BLAZE_STYLE_GUIDE.md typography hierarchy.

The header replaces both the v1 Member profile breadcrumb-and-identity-strip and the Growth Conversations breadcrumb. One header per page.

### 6.2 Key facts strip

A horizontal strip directly below the header, lightest-coral background fill. Surfaces 3-5 most-consequential captured facts about this Member as glance-able key/value pairs.

For each Member fixture, the curated facts:

| Member | Facts (illustrative) |
|---|---|
| Jenny's Catering | $48K slow-season · $75K LOC sized · leaning yes / spouse pending · Apr 8 last touch |
| Northland HVAC | $180K fleet target · 18-mo payback · engaged / awaiting board · Apr 5 last touch |
| Cygnus Bioscience | $4-7M CRE need · capital event · specialist engaged · Apr 21 last touch |

Facts are clickable. Click reveals the underlying captured evidence (the SizingMeasurement detail, the Recommendation, the Resolution, the Conversation summary).

For demo, key facts are curated per fixture. For Pilot, an algorithm chooses the most consequential facts from captured evidence. The algorithm is out of demo scope; for now, the data layer exposes a `keyFacts` field per Member that the seed populates.

### 6.3 Activity dialpad

A horizontal row of five pill-shaped buttons:

```
[+ Ask] [+ Quantify] [+ Model] [+ Reaction] [+ Action]
```

Buttons use `--blaze-orange-deep` text on `--blaze-white` background with 0.5px `--blaze-orange-deep` border. Hover states use `--blaze-orange-pale` fill. Pressed state uses `--blaze-orange-burnt` border with darker text.

The dialpad is **persistent and always-visible** when the workstation is in view. It does not change based on objective state, current activity, or any other condition. The banker's mental model is "these are my tools; I reach for whichever I need."

Clicking a button opens the corresponding capture form as a right-drawer (slides in from the right; preserves workstation context partially visible).

Visual treatment:
- Pills are tight (~36px height), use the v1 chip aesthetic (square-edged, modest border-radius, neutral background with hover state).
- Spacing: ~12px between pills.
- Sticky on scroll once the page extends below the fold. When the dialpad sticks during scroll, the page header collapses to a thin strip showing logo + Member name + open-thread badge.

**No + Show or + Resolve buttons.** Show is rendering an existing artifact (sidebar artifact-click → preview dialog → optional "Record show" button). Resolve subsumes into + Reaction. See §4 for full treatment.

### 6.4 Sidebar (left column)

Width: 180px. Stacked sections, top to bottom:

1. **Objectives** (60% of vertical space)
   - "objectives" label, then four objective blocks
   - Each block: objective name in heading weight, dot row below, optional sidebar highlight line below dots
   - Dot states render per §5.1
   - Coral accent applies only to the dot/highlight that represents an open thread

2. **Artifact slot** (15% of vertical space)
   - "artifact" label, then 1-2 artifact cards
   - Each card: artifact name (heading weight), shown-date (small caps), "view ↗" affordance
   - Click opens artifact in popup with rendered chart and parameter detail

3. **Macro slot** (15% of vertical space)
   - "macro" label, then compact Macro card if Member matches an active Macro
   - Card: Macro title (2 lines max), authored-by (1 line)
   - Click expands Macro detail with full recommended response

4. **History affordance** (5% of vertical space)
   - "history" label, then 3-4 most recent Conversation dates as compact list
   - "history (N) ↗" affordance opens full timeline popup

5. **Coach affordance** (5% of vertical space)
   - "show ?" affordance at bottom
   - Click expands inline coaching text for any element on the page that has it

### 6.5 Main panel (right column)

Width: 440px (or remaining width on responsive layouts). Captured evidence feed, sorted recent-first.

Each capture renders as one of six capture cards:

| Activity | Card content |
|---|---|
| Ask (Goal/Blocker/Indecision/Trigger) | Type tag · date · structured label · Member quote (italic, if present) · methodology or detail |
| Quantify | "sized" tag · date · magnitude (heading weight) · unit/period/source detail |
| Model | "model" tag · date · model name · parameters summary · "With Member" or "Banker draft" indicator |
| Show | "shown" tag · date · artifact name · context (which model, which conversation) |
| Reaction | "reaction" tag · date · response value (heading weight) · Member quote (italic, if present) |
| Resolve | "resolution" tag · date · posture (heading weight) · primary concern · Member quote (italic, if present) · "→ next" line |

Discipline:
- Member quote in italic, set apart with a left-rule mark
- Type tag in 12px caption weight
- Magnitude/label in 16px heading weight
- Detail in 14px body weight
- Open-thread captures get coral border accent (1px instead of 0.5px, color `--blaze-orange-burnt`)
- Stale captures (>90 days old or explicitly superseded) get 70% opacity

Empty state at bottom: dashed-border placeholder with text "capture more — activities above" at 50% opacity. Subtle, not pushy.

### 6.6 Click-in-place navigation discipline

**No clicks on this page result in page navigation.** Every interaction opens an in-place panel, popover, or modal that can be dismissed without leaving the workstation.

Specific behaviors:

| Click target | Reveals (in-place) |
|---|---|
| Objective name | Full objective panel: all evidence organized by type, inline + Add per type |
| Individual dot | Detail panel scrolled/anchored to specific evidence |
| Capture card in feed | Expanded augmenting summary with edit controls, supersession history |
| Key fact | Source evidence detail (SizingMeasurement, Recommendation, etc.) |
| Artifact card | Rendered chart popup with parameters |
| Macro card | Full Macro detail with author, recommended response, evidence links |
| "history (N) ↗" | Conversation timeline popup |
| "show ?" | Inline coaching text expansion |

The page never scrolls due to a click. The page never navigates to a different URL due to a click within the workstation. Detail surfaces over the workstation, dismissed with click-outside or close button.

This is a deliberate departure from v1's anchor-jumping behavior, which the visual review identified as disorienting (issue #1 from the original 9-issue review).

---

## 7. The page collapse: one workstation per Member

**v1 had two banker-facing surfaces per Member:** the Member Profile page (member context, history, suggested next step) and the Growth Conversations page (active stage capture, prior captures). Bankers navigated between them via stage hyperlinks and breadcrumbs.

**v2 collapses to one surface:** the workstation at `/v2/members/[id]`. Everything that was on the Member Profile *and* everything that was on Growth Conversations is in this single page.

This collapse is structurally truer because:
- A real banker's mental model of a Member is unitary, not bifurcated
- The "Profile vs. Conversations" split was a sales-CRM convention, not a consultative-banking necessity
- Anchor navigation between pages was a known UX failure point in v1
- Captures and context are not separate concerns; captures *are* context

The classic v1 routes (`/` for Member profile, `/growth-conversations` for the conversation flow) remain live during the build. v2 lives at `/v2/members/[id]` parallel to them. Cross-links exist:
- v1 Member profile → "Try the new view →" link to v2 workstation
- v2 workstation → "Classic view ↗" link back to v1 Member profile
- A feature flag (banker setting or query string) determines which view is the default

Both views read from the same underlying data. No data lives in v1 that is unavailable to v2 or vice versa. The schema is shared.

---

## 8. The clean-room architecture (from COMPLIANCE.md)

The v2 architecture commits to the clean-room principle: **the Member Signals system reads only business and cashflow factors. Protected-class data does not flow into the Member Signals layer.**

This is an extension to the broader system architecture, not a v2-specific design choice, but v2 reinforces it:

- All v2 fields and enums are tagged per the Wave 1 compliance taxonomy in COMPLIANCE.md
- The submit-time keyword scan (per PROTECTED_CLASS_KEYWORD_LIST_v1.md) protects free-text capture fields
- The "Member Signals does not make credit decisions" framing appears as a banner-level disclaimer on the workstation
- Lending decisions happen in a downstream system that ingests business-factor outputs from Member Signals; Member Signals is a banker conversation tool, not a credit-decisioning tool

v2 inherits the clean-room architecture from v1's planned compliance-posture work (Track 1 in the build plan). v2 must not introduce new fields or capture surfaces that violate the clean-room discipline. Any new field added in v2 implementation must carry a compliance tag per COMPLIANCE.md §2 before the field enters the schema.

The v2 workstation's banner disclaimer reads:

> *Member Signals supports consultative banker conversations. It does not make credit decisions, generate adverse action notices, or substitute for formal underwriting. Captures are banker working notes; formal lending decisions occur in downstream systems.*

This disclaimer is visible once per session per Member workstation visit (dismissible after first read; reappears on new sessions).

---

## 9. The "show ?" coach surface

System-authored coaching text exists in v1 as persistent prose throughout pages (stage descriptions, augmenting-summary prose, suggested-next-step rationale). v2 strips this from primary view and routes it through a single optional surface.

### 9.1 What's in primary view

- Activity affordance labels (the seven dialpad buttons)
- Section anchors ("objectives," "captured," "artifact," "macro," "history")
- Empty-state nudges (dashed-border placeholder at bottom of feed)
- Capture form helper text (compliance-framed, per Track 1)
- Open thread one-liner (header badge)
- Activity-type tags on capture cards (one word each)
- Member's voice (verbatim quotes, prominent)
- Captured magnitudes and structured field values

That's it. Approximately 80 words of system-authored text on a typical workstation page (compared to ~600 words in v1).

### 9.2 What's in "show ?"

Click "show ?" at the bottom of the main panel. Inline coaching text expands for any element on the page that has it:

- Per objective: "what does this objective ask of me?" framing (sourced from existing 18 stage-guidance paragraphs from Sprint 4 Prompt 4.2a Block A, reorganized under the four objectives)
- Per activity: "what does this capture do for the conversation?" framing
- Per dot type: "what does this dot represent?" framing

Banker reads on demand. Default state: collapsed. Junior bankers may keep it expanded; senior bankers ignore it.

### 9.3 Phase 1 vs phase 2 coaching content

v2 phase 1 ships with the existing 18 stage-guidance paragraphs reorganized under the four objectives. No new coaching content authoring required; just rerouting.

v2 phase 2 (post-EVP if pursued) authors objective-aligned coaching text from scratch and adds activity-level and dot-level coaching.

---

## 10. Inquiry tracks and confidence-band evidence (Discover objective)

### 10.1 The pattern

Under the Discover objective, the system surfaces **"Tracks supported by current evidence"** — a panel showing financial product candidates with evidence-strength indicators.

The pattern is:

```
Tracks supported by current evidence:
- Working Capital LOC — strong support (4 evidence dots)
- Cash Management upgrade — moderate support (2 evidence dots)
- Equipment Loan — insufficient evidence yet
```

The banker reads this and uses judgment. The system informs; the banker decides.

### 10.2 Why this language matters (compliance framing)

The phrasing is deliberate. "Tracks supported by current evidence" frames the system as **supporting banker judgment, not making decisions or steering Members toward products.** This framing protects the architectural commitment that Member Signals does not make credit decisions and does not steer (per the FFIEC Interagency Fair Lending Examination Procedures' steering risk category).

Phrasings to avoid because they carry compliance-fraught semantics:
- ❌ "Candidate tracks" (implies system is candidating, not informing)
- ❌ "Recommended for this Member" (implies system is recommending, not surfacing)
- ❌ "Eligible for" (implies underwriting determination)
- ❌ "Bumped to candidate track" (implies automatic categorization)

Phrasings to use:
- ✓ "Tracks supported by current evidence"
- ✓ "Strong support / moderate support / insufficient evidence"
- ✓ "The banker considers and decides"

This language is non-negotiable in v2 surfaces and copy.

### 10.3 Evidence-strength scoring

Each Track has a defined set of evidence types it expects (e.g., Working Capital LOC expects: seasonal-gap signal + Member-stated cashflow blocker + sized magnitude in $25K-$200K range + Member Type in {Small Caterer, Trades & Construction, Specialty Manufacturer, ...}).

Captured evidence on the Member is matched against each Track's evidence pattern. Strength bands:
- **Strong support**: Member's evidence matches ≥75% of Track expectations
- **Moderate support**: Member's evidence matches 40-74% of Track expectations
- **Insufficient evidence**: Member's evidence matches <40% of Track expectations

These thresholds are heuristic; for demo, hand-curated per fixture. For Pilot, calibrated against real captured-evidence patterns.

### 10.4 Cohort intelligence (anonymized peer banker data)

Beyond the Member's own evidence, the panel can surface "Tracks that worked for similar Members" — anonymized cohort data showing what other bankers have run with comparable Members.

Demo treatment: at three Members in the demo, true cross-portfolio anonymized intelligence is not feasible. The panel renders with placeholder data annotated "in production scale, this would show patterns across N similar Members in your peer bankers' portfolios." The architectural infrastructure (anonymizeForBanker function, cohort-query layer) is the demonstrated piece; the data backing it is the Pilot piece.

### 10.5 Sprint 5 Insight Engine cross-link

The same cohort-query infrastructure that powers the Discover panel powers Insight Engine View 1 (Track Performance). Same query, two surfaces:
- Member workstation: "what tracks does this Member's evidence support?"
- Insight Engine: "across all Members in the bank, how is this Track performing?"

Architectural reuse. Sprint 5 Insight Engine work directly extends what v2 phase 1 builds.

---

## 11. Schema changes for v2

v2 reuses ~75% of the existing schema and adds three new entities/fields. The existing 6-stage `step_phase` machinery may persist for backward compatibility; v2 does not depend on it but does not remove it.

### 11.1 Objective abstraction (derived, not persisted)

The four objectives are **derived state**, not a persisted Prisma model. Sprint 4.7 phase 1 implemented this in `lib/stage-guidance.ts` via the `V2Objective` TypeScript union literal:

```typescript
export type V2Objective = "discover" | "measure" | "consult" | "navigate";
```

There is no `Objective` table and no `ObjectiveType` Prisma enum. Objective dots, sidebar highlights, and open-thread accent are all computed at request time from the underlying captured evidence (Signals, SizingMeasurements, Models, ShowEvents, Reactions, ActionCards, Recommendations). The Sprint 4.7.2 vocabulary refactor (Land/Understand/Formalize → Discover/Measure/Navigate) is a TypeScript union literal change plus a content rewrite — no database migration. See §11.7 for the surface-vs-schema separation.

### 11.2 New: Model entity (capturing + Model activity output)

```
Model {
  id                  String   @id
  member_id           String
  conversation_id     String?
  artifact_id         String?  // if Model produced or referenced an Artifact
  built_with_member   Boolean  // True for "With Member", False for "Banker draft"
  parameters          Json     // captured parameters
  assumptions         Json     // captured assumptions
  output_summary      String   // 1-2 sentence summary of the model's output
  built_at            DateTime
  built_by_banker_id  String
  superseded_by       String?  // FK to a Model that supersedes this one
  superseded_at       DateTime?
}
```

### 11.3 New: Reaction entity (capturing + Reaction activity output)

```
Reaction {
  id                    String   @id
  member_id             String
  conversation_id       String?
  show_event_id         String?  // FK to the Show that triggered this reaction
  response_value        ReactionValue
  member_quote          String?  // verbatim; banker-prose, subject to compliance scan
  primary_concern       RecommendationPrimaryConcern?  // contextual taxonomy; added Sprint 4.7.2
  captured_at           DateTime
  captured_by_banker_id String
}

enum ReactionValue {
  // Sprint 4.7 phase 1 shipped: 5 values
  ENGAGED
  LEANING_YES
  SKEPTICAL
  CONFUSED
  DISMISSIVE
  // Sprint 4.7.2 expansion: subsumed v1 Resolve terminal states
  COMMITTED
  DECLINED
}
```

**Reaction.primary_concern** uses the existing `RecommendationPrimaryConcern` enum (defined for v1 Resolve in Sprint 4.6) so the contextual taxonomy is shared. Open-thread context (8 values) when `response_value` ∈ {engaged, leaning_yes, committed}; decline-reason context (10 values) when `response_value` ∈ {declined, dismissive}; mid-conversation states {skeptical, confused} use the open-thread set per the contextual logic in v1's Resolve form.

### 11.4 Modification: Show event capture

Currently the Show stage captures via GrowthStepExecution + ArtifactParameterCapture. For v2, ShowEvents capture artifact-rendering moments via a lightweight entity. ShowEvents are created (a) automatically when a + Model is saved with "with Member" provenance, or (b) explicitly when the banker clicks "Record show" on the sidebar artifact preview dialog. There is no + Show dialpad button; see §4 for the surface-layer treatment.

```
ShowEvent {
  id                  String   @id
  member_id           String
  conversation_id     String?
  artifact_id         String   // FK to Artifact rendered
  model_id            String?  // FK to Model that produced this artifact
  shown_at            DateTime
  shown_by_banker_id  String
  context_note        String?  // e.g., "during Q1 review meeting"
}
```

This lets v2 cleanly distinguish "an artifact was produced by modeling" from "an artifact was rendered in a conversation."

### 11.5 Existing entities reused unchanged

- Member, Conversation, Banker, Artifact, ActionCard, Macro
- Signal (with Goal/Blocker/Indecision/Trigger types)
- SizingMeasurement
- Recommendation
- ArtifactParameterCapture (still relevant for parameter pre-population from Quantify into Model)
- GrowthStepExecution (persists for backward compat; not v2-visible)

### 11.6 Migration strategy

v2 prototype ships as additive. New entities (Model, Reaction, ShowEvent) added; existing entities unchanged. v1 reads work without modification. v2 reads use both old and new entities.

When v2 supersedes v1 post-EVP, the 6-stage `step_phase` machinery can be retired. For demo, both paths coexist cleanly.

### 11.7 Surface vs schema separation (Sprint 4.7.2 vocabulary refactor)

Sprint 4.7.2 introduces the vocabulary refactor (Land/Understand/Formalize → Discover/Measure/Navigate) and the dialpad simplification (7 activities → 5). The refactor's surface-vs-schema impact:

**No new database schema for Objective.** The Objective abstraction remains derived state per §11.1. There is no Prisma `Objective` model and no `ObjectiveType` database enum. The "rename" is a TypeScript union literal change: the existing `V2Objective = "land" | "understand" | "consult" | "formalize"` constant in `lib/stage-guidance.ts` becomes `V2Objective = "discover" | "measure" | "consult" | "navigate"`. All banker-facing strings, sidebar headings, popup titles, and coach content keys update accordingly. The ObjectiveType abstraction lives in code, not in the database — so the rename is a code refactor, not a database migration.

**Two real schema changes ship in Sprint 4.7.2:**

1. **ReactionValue enum expansion.** Reaction subsumes v1 Resolve's terminal states. The enum grows from 5 values to 7: existing `engaged / leaning_yes / skeptical / confused / dismissive` plus new `committed / declined`. Prisma migration adds the new enum values; existing Reaction records remain valid.

2. **Reaction.primary_concern column.** Reaction gains a new column for the primary concern (or decline reason) using the Sprint 4.6 contextual taxonomy. Open-thread context (8 enum values) when response is engaged/leaning_yes/committed; decline-reason context (10 enum values) when response is declined/dismissive. Prisma migration adds the column as nullable. The column lives on Reaction (not as a side-effect write to Recommendation) so that Discover-stage Reactions — captured before any Recommendation exists — still have a valid place to write the concern.

**v2 ReactionValue is a deliberate subset of v1 RecommendationResponse.** v1 has 10 values; v2 has 7. The three v1 values dropped from v2 are intentional design choices: `funded` moves to Navigate via ActionCard outcome (a Reaction is not a payment record); `neutral` is subsumed by absence-of-Reaction (no captured response means no captured response); `leaning_no` folds into `skeptical` for v2 (the directional read of the response is captured in subsequent Reactions or in the eventual `declined` terminal state). v1↔v2 data does not round-trip with parity; that's accepted given v1's planned retirement at Pilot.

**Banker-facing strings change:** All UI strings, dialpad button labels, sidebar headings, popup titles, coach content paragraphs reflect the new vocabulary. Coach content gets re-authored, not just re-keyed, because the evidence-type re-mapping (Goals/Blockers/Indecision moving from Understand-primary to Discover-primary; Model produced moving from Consult to Measure) changes which captures coach which objectives.

**The two-layer discipline holds:** Schema names use existing v1 vocabulary where it predates v2; banker-facing UI uses v2 vocabulary; the two don't always match; that's intentional. Translation happens in `lib/enum-descriptions.ts` and v2 component files. Full discipline documented in §11.8.

### 11.8 v1↔v2 vocabulary translation layer

v2 retires v1 banker-facing vocabulary (stage / phase / step) but does **not rename schema identifiers**. The v1 enum values, table names, and column names persist unchanged for backward compatibility. The translation between schema-level names and v2 banker-facing labels lives in two places:

- **`lib/enum-descriptions.ts`** — single source of truth for enum value display labels (e.g., `RECOMMENDATION_PRIMARY_CONCERN_LABELS` maps `co_decision_maker_household` → "Needs household co-decision-maker input"). Banker-prose surfaces (sidebar highlights, capture-card labels, summary templates) read from this map; the schema column stays as the canonical identifier.
- **v2 component files** — UI labels for activities and structural elements (e.g., the dialpad button reads "+ Quantify" while the underlying capture writes to the `SizingMeasurement` schema entity). The component-side label is the banker-facing word; the schema-side identifier is the developer-facing word.

Three-layer example:

| Layer | Identifier | Visibility |
|---|---|---|
| Schema (Prisma) | `SizingMeasurement` | Developer; never shown to bankers |
| Activity (v2 banker-facing) | "Quantify" | Banker; shown on dialpad button "+ Quantify" |
| Captured-feed card | "sized" tag (per §6.5) | Banker; shown above the captured magnitude |

Translation discipline: when a new v2 surface is built, the developer must explicitly choose the banker-facing label, document it in this section if novel, and use `lib/enum-descriptions.ts` (or equivalent) as the lookup. Drift between the schema identifier and the banker label is intentional — v2 banker-facing language can evolve without forcing schema migrations.

For Sprint 4.7 implementation: do not rename `SizingMeasurement` or its Prisma columns. The activity label in v2 dialpad is "+ Quantify". The captured-feed type tag is "sized". Same entity; different banker contexts.

---

## 12. What v1 retains, what v1 retires (in v2 surfaces)

### 12.1 Retained from v1

| v1 element | v2 status |
|---|---|
| Schema (Member, Conversation, Signal, etc.) | Unchanged, reused |
| `lib/anonymizeForBanker()` | Unchanged, reused |
| `lib/summaries.ts` (templated prose) | Reused for summary text in coach surface |
| Capture forms (Ask, Quantify, Resolve) | Reused, surfaced via dialpad as modal/drawer |
| BLAZE_STYLE_GUIDE typography hierarchy | Strictly applied in v2 |
| Macro entity and Macro context banner | Reused, banner compacts to sidebar slot |
| Three Member fixtures (Jenny, Northland, Cygnus) | Enriched with additional Member quotes for v2 |
| Augmenting summary expand/edit pattern | Reused for capture detail panels |
| Direct Member quote capture (currently optional) | Promoted to centerpiece in v2 |

### 12.2 Retired from v2 surfaces (not necessarily from schema)

| v1 element | v2 status |
|---|---|
| 6-stage section structure on pages | Retired; replaced by objective sidebar |
| Stage progression dots | Retired; replaced by objective dots |
| Side-nav STAGES list | Retired; replaced by Objectives sidebar |
| Stage-by-stage descriptions | Moved to "show ?" coach surface |
| Suggested Next Step card with rationale | Compacted to open-thread badge in header |
| Recommendation rationale paragraph | Moved to capture detail panel |
| "Captured Signals (4)" group headers | Retired; captures stand alone in feed |
| Anchor navigation between Member profile and Growth Conversations | Retired; one workstation, in-place panels |
| Stage-label hyperlinks across pages | Retired (resolves issue #1 from visual review) |
| `step_phase` enum | Persists in schema; not visible in v2 UI |
| `GrowthStepExecution` | Persists in schema; superseded for new captures by Model/Reaction/ShowEvent in v2 |

### 12.5 v1 Resolve form retention

The v1 Resolve form (Sprint 4 Prompt 4.2a Block C) remains intact and surfaced on v1 routes (`/growth-conversations/[memberId]`). v2 routes do not surface this form through the dialpad — Reaction subsumes its functionality at the v2 surface, with the response value, member quote, and primary_concern captures all consolidated into a single + Reaction form.

The v1 form code is preserved for v1 cohabitation. The v1 form continues to write to `Recommendation.member_response` and `Recommendation.primary_concern`. Sprint 4.7.2's `Reaction.primary_concern` column does not replace the v1 fields — both paths exist in parallel during cohabitation, with v2 surfaces reading Reaction-side data and v1 surfaces reading Recommendation-side data.

**primary_concern requiredness on the v2 + Reaction form** matches the v1 NUANCED pattern: required for response_value ∈ {skeptical, confused, leaning_yes, declined}; optional for {engaged, committed, dismissive}. The reasoning: these are the response states where the concern is the actionable signal. Engaged is too early (banker may not have probed yet); committed and dismissive are terminal in different ways and don't have the same "what's the open thread" question.

If v1 retires at Pilot, the form retires with it. The Recommendation-side `member_response` and `primary_concern` fields can be retired at the same time (after data migration to Reaction-side equivalents) or persist as denormalized cache fields for query convenience. That's a Pilot decision, not a Sprint 4.7.2 decision.

---

## 13. Open architectural questions for v2

Items not yet resolved at architecture-document time. These should be tracked in OPEN_QUESTIONS.md and resolved during implementation.

- **Q-A1.** When a capture advances multiple objectives (e.g., an Indecision Signal that's primary on Discover and secondary on Consult), does the dot appear under both objectives or just one? *Demo lean: single primary objective per capture, with secondary contributions noted in the detail panel.*
- **Q-A2.** What's the heuristic for choosing the open-thread badge content when multiple urgent items exist? *Demo lean: ActionCard with nearest due date wins; if no ActionCard, then Resolution with primary_concern wins; tied breaks by recency.*
- **Q-A3.** Mobile/narrow-viewport behavior of the dialpad and sidebar. *Demo lean: not optimized for mobile; demo viewing assumed on laptop or desktop. Pilot revisits.*
- **Q-A4.** When v2 ships and v1 remains live, do existing notification surfaces (none yet built) link to v1 or v2? *Default: respect banker's preferred-view setting.*
- **Q-A5.** Authoring source of truth for the inquiry-tracks panel data at demo scale. *Demo lean: hand-curated per fixture in seed; algorithm in Pilot.*

---

## 14. Document maintenance

This document is the authoritative v2 architecture reference. Updates happen when:

- A v2 design decision changes (architecture, layout, vocabulary)
- A new objective or activity is added or retired
- The clean-room or compliance posture changes
- A schema change for v2 lands

When updates happen, the changing section is rewritten in place (not appended). The change is noted in BUILD_LOG.md with a timestamp and rationale. Cross-referencing documents (EVIDENCE_FRAMEWORK, COMPLIANCE, BLAZE_STYLE_GUIDE, INSIGHT_ENGINE_DESIGN_NOTES) update in the same commit if affected.

---

**End of ARCHITECTURE_V2.md.**
