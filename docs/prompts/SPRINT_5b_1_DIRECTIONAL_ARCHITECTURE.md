# Sprint 5b.1 — CTA Derivation, Insight Architecture, Polish

**Prompt for Claude Code. Single checkpoint. Ships the directional architecture that makes popup-as-workflow always actionable when work remains and honest when work is genuinely complete. Estimated 5-7 effective build days CC time + ~1.5 days Francisco/Claude pattern authoring + ~3 hours editorial pass. Three phases: bounded CTA derivation, insight architecture (canonical Patterns + banker-authored Insights with LLM matching), polish (staleness, specialist handoff, language).**

## Pre-flight context

Sprint 5a.3 mini-patch confirmed at visual review. Surface architecture works. Visual review surfaced one substantive architectural defect: when popup-as-workflow's missing-evidence CTAs are exhausted, the popup goes silent — no next valuable action surfaces, banker lands in a dead-end zone. The defect is structural (the CTA derivation only queried one source: missing template evidence) rather than visual.

Sprint 5b.1 addresses the directional architecture. Three architectural commitments locked through extended design conversation:

- **CTAs not labels.** No readiness composite states. No diagnostic categorization of Members. The product surface tells bankers what to do next, not where Members are.
- **Bounded CTA layers.** Three layers produce CTAs (missing template evidence; threshold-uplift; specialist handoff). When all three are exhausted for a phase, the popup is honest about it — evidence list stands alone, no fake CTAs, no "complete" label.
- **Insights as both reference and authorship.** Two distinct affordances. Lightbulb icon surfaces canonical Patterns (institutional knowledge for banker consultative reference). `+ Insight` button captures banker authorship (in dialpad and contextually on Signal rows).

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` (at repo root) — Section 1 factor catalog informs threshold-uplift logic.
2. `ARCHITECTURE_V2.md` §3 (objectives), §11 (schema), §11.7 (surface vs schema separation).
3. `EVIDENCE_FRAMEWORK.md` — current evidence catalog and activity-to-evidence mapping.
4. `COMPLIANCE.md` §10.2 — banned phrases. Insight content (canonical Patterns + banker-authored Insights) must continue to honor banned-phrase discipline.
5. `app/v2/members/[id]/objective-popup.tsx` — Sprint 5a.2's popup-as-workflow component. CTA zone and evidence zone get extended.
6. `lib/objective-evidence.ts` — Sprint 5a.2's helpers. CTA derivation in this sprint extends/replaces some of this logic.
7. `prisma/schema.prisma` — verify ActionCard entity exists. Verify whether ActionCard has a `status` field (or equivalent). If schema verification surfaces unexpected gaps, surface to Francisco rather than proceeding from inference.

**Architecture authority:** ARCHITECTURE_V2.md §3 wins for objective architecture; `BUSINESS_FACTOR_MATRIX_v1.md` wins for factor data; existing popup-as-workflow component pattern wins for surface integration.

## What ships in this sprint (5b.1)

Eight blocks across three phases. Single checkpoint, delimited diffs.

**Phase 1 — Bounded CTA derivation:**
- **Block A — CTA derivation function.** `lib/cta-derivation.ts` exporting `deriveNextActions(member, track, captures, signals, reactions)` returning ranked CTAs across three bounded layers.
- **Block B — Surface integration.** Popup-as-workflow CTA zone shows ranked CTAs from derivation; sidebar "+ next valuable" affordance uses same source.

**Phase 2 — Insight architecture:**
- **Block C — Schema additions.** `InsightPattern` entity (canonical, senior-authored) and `Insight` entity (banker-authored, two-state lifecycle).
- **Block D — Pattern data seed.** Translate authored canonical Patterns into seed data.
- **Block E — `+ Insight` authoring.** Dialpad button + contextual affordance on Blocker/Indecision/Goal rows. LLM matching API integration.
- **Block F — Insight reference surfaces.** Lightbulb icon on Signal rows surfaces canonical Patterns; popup footer "Implications:" section.

**Phase 3 — Polish:**
- **Block G — Staleness, specialist handoff, language polish.** Red font over 90d with `+ refresh` CTA; specialist handoff tag with notes field; "Promising" replaces "complete"; `+ deepen` affordance pattern; open-thread visual indicator.
- **Block H — Governance updates.** BUILD_LOG, OPEN_QUESTIONS, CLAUDE.md.

Sprint 5b.1 explicitly does **not** ship: readiness composite states, Insight Engine novel review surface, "Make canonical" promotion affordance, per-banker insight activity coaching view, cross-Track exploration CTAs, Reaction-driven CTAs, ActionCard-status-driven CTAs (unless schema verification permits cleanly). All of these are Sprint 5b.2 or Pilot.

---

## Block A — CTA derivation function

### A.1 Pure function spec

Implement `lib/cta-derivation.ts` exporting:

```typescript
type CTA = {
  id: string;                    // unique id for this CTA instance
  layer: 'missing_evidence' | 'threshold_uplift' | 'specialist_handoff' | 'staleness_refresh';
  priority: number;              // 0-100, higher = more prominent
  label: string;                 // banker-facing CTA text
  action: CTAAction;             // structured action descriptor (form open, factor preselect, etc.)
  context?: string;              // optional secondary text for banker context
};

type CTAAction =
  | { type: 'open_capture_form', form: 'quantify' | 'ask' | 'model' | 'reaction' | 'action' | 'insight', preselected_factor_id?: string, preselected_signal_id?: string }
  | { type: 'open_specialist_handoff', track_id: string }
  | { type: 'refresh_capture', factor_id: string };

function deriveNextActions(args: {
  member: Member;
  track: TrackTemplate;
  factor_captures: FactorCapture[];
  signals: Signal[];
  reactions: Reaction[];
  objective: V2Objective;  // Discover / Measure / Consult / Navigate
}): CTA[]
```

Returns an array of CTAs ranked by priority. **Empty array is a valid return** — when no layer produces CTAs for the given objective + Track combination, the popup is honest about it (evidence list stands alone; no fake CTAs).

### A.2 Three layers

**Layer 1 — Missing template evidence (priority 60-80)**

Derived from current Track's `required_evidence_per_objective[objective]` minus captured evidence. Two classes within this layer:

- **Class 1A — Quantitative inputs needed for artifact production.** Required evidence that's a numerical/boolean factor still uncaptured. CTA opens + Quantify with factor pre-selected. Higher priority (75-80).
- **Class 1B — Rockstar evidence (qualitative or symbolic).** Required evidence that's a qualitative tag or symbolic ref (model_produced, model_shown, reaction_captured) still uncaptured. CTA opens appropriate capture form. Lower priority (60-70).

When all required evidence for the objective is captured, this layer produces no CTAs.

**Layer 2 — Threshold-uplift (priority 40-55)**

Captures that exist but fired at a lower matrix tier than possible. The matrix has tiered entries (e.g., FACTOR-001 strong at ≥20%, moderate at 10-20%); if Member's capture fires moderate, capture again could push to strong if the underlying business has shifted.

CTA: "Re-confirm [factor name] — current capture at [value][unit]; if [threshold value] or above, fires stronger support."

Implementation: query `MatrixEntry` records where the same factor has both a moderate-firing entry (currently matched) and a strong-firing entry (not yet matched). Surface the strong-tier threshold as the uplift target.

This layer is *honest about what it is*: it tells the banker "the matrix has a stronger tier you haven't reached." It does not claim the Track is incomplete; it offers an uplift opportunity.

**Note on labeling:** matrix strength tiers (strong/moderate/insufficient) are *internal scoring*, not banker-facing categorization. Sprint 5b.1 removes strength tier labels from banker-facing surfaces — the Track context dropdown shows ranked Tracks, but doesn't label them with strength tier words. Bankers see CTAs and evidence; matrix scoring drives ranking and prioritization but isn't surfaced as a category banker has to interpret.

**Layer 8 — Specialist handoff (priority 50-70)**

When the current Track requires a specialist (CRE Term Loan → CRE specialist; SBA 7(a) → SBA specialist) and rockstar package is captured (Layer 1 exhausted on Discover and Measure objectives, model_produced and reaction_captured for Consult), surface specialist handoff CTA on Navigate objective.

CTA: "Initiate specialist handoff for [Track] — coordinate with [department/team]."

Action opens a small specialist-handoff form with:
- Department/team tag (required, dropdown of: 'CRE specialists', 'SBA specialists', 'treasury management', 'commercial credit underwriting')
- Specific specialist preference notes (optional, free-text 200-char)
- Submit creates a SpecialistHandoff record (new minimal entity — see Block C).

### A.3 Layer 3 (staleness) — separate path

Staleness is also a CTA-producing source but operates differently. It's not part of the layered priority ranking; it's surfaced *inline on the captured evidence row itself* in the popup bottom zone. Implementation in Block G.

### A.4 Open-thread visual indicator

Indecision Signals without resolution (no subsequent Reaction with response_value indicating resolution; no banker-mark-resolved) get a visual "open" indicator in the popup evidence zone. This is polish, not a CTA — the indicator surfaces "this thread is still open" without prescribing action. Banker decides whether to address. Implementation in Block G.

### A.5 Acceptance criteria for Block A

- [ ] `lib/cta-derivation.ts` exists with `deriveNextActions` exported
- [ ] Three layers (missing_evidence, threshold_uplift, specialist_handoff) implemented as separable functions
- [ ] Function returns empty array when all layers exhausted for given objective + Track
- [ ] CTAs include action descriptors for surface routing
- [ ] Two-class distinction within Layer 1 (quantitative vs qualitative/symbolic) reflected in priority
- [ ] Strength-tier labels not surfaced in banker-facing fields of CTA records
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — Surface integration

### B.1 Popup-as-workflow CTA zone

Replace existing missing-evidence-only CTA derivation in `app/v2/members/[id]/objective-popup.tsx` with `deriveNextActions` call.

When CTAs returned: render in priority order (highest first) in the popup top zone. Each CTA renders as an existing CTARow component (Sprint 5a.2 pattern) with:
- Empty checkbox affordance (clickable)
- Label text
- Optional context text below label
- Click handler invokes the CTA's action descriptor

When CTAs returned is empty array: top zone is *not rendered at all*. No "complete" label, no "to strengthen this candidate, capture:" header, no empty zone. The evidence-list zone stands alone as the popup body. Honest about completeness without false claims of finality.

### B.2 Sidebar "+ next valuable" affordance

The sidebar's per-objective "+ next valuable" affordance (Sprint 5a.2 Block C) currently surfaces the next-most-valuable missing-evidence factor. Replace with the highest-priority CTA from `deriveNextActions` for that objective.

When `deriveNextActions` returns empty array: the "+ next valuable" affordance disappears for that objective. No fake affordance.

### B.3 CTA action routing

CTA action descriptors route to existing capture forms with pre-selection:

- `{ type: 'open_capture_form', form: 'quantify', preselected_factor_id }` → opens + Quantify form in matrix-aware mode with factor pre-selected (Sprint 5a.2 Block E plumbing reused)
- `{ type: 'open_capture_form', form: 'ask', preselected_signal_id }` → opens + Ask form (extend pre-selection plumbing if not already present)
- `{ type: 'open_capture_form', form: 'model' | 'reaction' | 'action' | 'insight', ... }` → opens corresponding form
- `{ type: 'open_specialist_handoff', track_id }` → opens specialist handoff dialog (Block G)
- `{ type: 'refresh_capture', factor_id }` → opens + Quantify form in matrix-aware mode pre-selected to factor; existing FactorCapture is treated as a "reference; banker can re-capture with updated value (creates new FactorCapture; old one not deleted, just superseded by recency in evaluator queries)

### B.4 Acceptance criteria for Block B

- [ ] Popup-as-workflow CTA zone renders CTAs from `deriveNextActions`
- [ ] Empty CTA array produces no CTA zone (not "complete" label)
- [ ] Sidebar "+ next valuable" affordance uses same derivation
- [ ] CTA action routing works for all action types
- [ ] No regression to existing popup-as-workflow evidence zone or Sprint 5a.3 row rendering

---

## Block C — Schema additions

### C.1 Entities

Three new Prisma entities:

**InsightPattern (canonical, senior-authored):**
```prisma
model InsightPattern {
  id                          String   @id  // PATTERN-NNN
  track_id                    String   // FK to TrackTemplate
  signal_tag_scope            String   // e.g. 'cashflow_volatility', 'capacity_limit', 'real_estate', 'co_decision_maker_input'
  insight_type                String   // 'reframe' | 'implication'
  content                     String   // 200-char canonical statement, Member-Type-agnostic
  implication_questions       Json     // array of 2-3 Rackham-style questions
  member_type_origins         Json     // array of Member-Types where Pattern was observed (metadata)
  member_type_applicability   String   // JSON-encoded array, or 'broad'
  status                      String   // 'draft' | 'approved' | 'archived'
  authored_at                 DateTime @default(now())
  authored_by                 String   // banker_id of senior lender
  approved_at                 DateTime?
  approved_by                 String?
  
  insights                    Insight[]
  
  @@index([track_id])
  @@index([signal_tag_scope])
}
```

**Insight (banker-authored, two-state):**
```prisma
model Insight {
  id                  String   @id @default(cuid())
  member_id           String
  member              Member   @relation(fields: [member_id], references: [id])
  track_id            String
  addresses_signal_id String?  // optional Signal reference
  insight_type        String   // 'reframe' | 'implication'
  content             String   // 200-char banker authorship
  matched_pattern_id  String?  // FK to InsightPattern; null if novel
  matched_pattern     InsightPattern? @relation(fields: [matched_pattern_id], references: [id])
  match_confidence    Float?   // 0-1, LLM judgment
  llm_feedback        String?  // 200-char system response (cached)
  state               String   // 'routine' | 'novel'
  authored_at         DateTime @default(now())
  authored_by         String   // banker_id
  
  @@index([member_id])
  @@index([track_id])
  @@index([addresses_signal_id])
  @@index([state])
}
```

**SpecialistHandoff (Layer 8 artifact):**
```prisma
model SpecialistHandoff {
  id                       String   @id @default(cuid())
  member_id                String
  member                   Member   @relation(fields: [member_id], references: [id])
  track_id                 String
  department_tag           String   // 'CRE specialists', 'SBA specialists', etc.
  specialist_preference    String?  // optional 200-char notes
  status                   String   // 'initiated' | 'specialist_engaged' | 'closed'
  initiated_at             DateTime @default(now())
  initiated_by             String   // banker_id
  
  @@index([member_id])
  @@index([track_id])
}
```

### C.2 ActionCard schema verification

Before Sprint 5b.1 starts, verify `ActionCard` entity exists in `prisma/schema.prisma`. If exists, verify whether it has a `status` field (or equivalent for tracking scheduled/complete/cancelled). 

- If status field exists: proceed with no schema change. CC may use ActionCard.status in Block G open-thread polish if useful.
- If status field doesn't exist: do not add it in Sprint 5b.1. Defer ActionCard-driven logic entirely. Surface to Francisco as note: "ActionCard.status would unlock open-thread CTAs in future sprint; not added in 5b.1 to keep scope tight."
- If ActionCard entity itself doesn't exist: surface to Francisco rather than proceeding. May indicate prior sprint discrepancy.

### C.3 Migration

Single Prisma migration adding the three new entities and indexes. No data backfill in this migration (Block D handles seed data).

### C.4 Acceptance criteria for Block C

- [ ] InsightPattern, Insight, SpecialistHandoff entities defined
- [ ] Migration applies cleanly
- [ ] ActionCard schema verified; outcome documented in BUILD_LOG
- [ ] No regression to existing entities
- [ ] `pnpm tsc --noEmit` clean

---

## Block D — Pattern data seed

### D.1 Source

`docs/INSIGHT_PATTERN_LIBRARY_v1.md` (will be authored by Francisco/Claude before Sprint 5b.1 starts; not yet at repo root). Contains ~30-40 canonical Patterns covering Track × Signal-tag combinations relevant to demo fixtures.

If the library file isn't present at sprint start, **stop and surface to Francisco**. The library is authored content, not a CC inference task.

### D.2 Pattern seed records

Translate library Patterns into InsightPattern records. Each Pattern populates:
- `id`: from library
- `track_id`: from library
- `signal_tag_scope`: from library
- `insight_type`: 'reframe' or 'implication'
- `content`: 200-char canonical statement
- `implication_questions`: JSON array of 2-3 questions
- `member_type_origins`: JSON array (typically populated as ['catering', 'hvac_trades', 'specialty_manufacturing', 'general'] depending on which fixtures the Pattern was authored against)
- `member_type_applicability`: 'broad' for most demo Patterns
- `status`: 'approved' (demo seed Patterns are pre-approved)
- `authored_by`, `approved_by`: senior lender placeholder (e.g., 'sherri_chen' or system role indicator)

### D.3 Pattern seed cardinality

Approximate breakdown:
- Working Capital LOC × {cashflow_volatility, customer_concentration, capacity_to_service_debt}: 6-8 Patterns
- Vehicle/Fleet Loan × {capacity_limit, aging_equipment, lost_revenue}: 6-8 Patterns
- CRE Term Loan × {real_estate, capacity_limit, customer_growth}: 6-8 Patterns
- SBA 7(a) × {regulatory_compliance, capacity_to_service_debt, refinancing_window}: 4-6 Patterns
- Treasury Services Upgrade × {cashflow_volatility, customer_concentration}: 3-4 Patterns
- Cross-Track / Member-Type × general (decision-process, indecision-resolution): 4-6 Patterns

Total ~30-40 Patterns.

### D.4 Per-fixture seed Insights

Create ~6-9 banker-authored Insight records in seed data for the three fixtures. Each Insight:
- Authored by Scott Brynjolffson
- Addresses a captured Signal in the fixture
- Has a pre-computed `matched_pattern_id` (cached, not live LLM call) so demo doesn't depend on live LLM at fixture-load time
- Has cached `llm_feedback` text (affirmation or extension) appropriate to match
- `state` is 'routine' for matched Insights; 1-2 demo Insights per fixture get 'novel' state to demonstrate that pathway

Suggested per-fixture distribution:
- Jenny: 3 routine Insights (addressing seasonal Goal, cashflow Blocker, late_paying_customer Trigger), 1 novel Insight (an unusual observation that doesn't match library)
- Northland: 3 routine Insights (addressing capacity Goal, capacity_limit Blocker, capacity_evaluation Trigger), 1 novel Insight
- Cygnus: 3 routine Insights (addressing expansion Goal, real_estate Blocker, customer_growth Trigger), 1 novel Insight

### D.5 Acceptance criteria for Block D

- [ ] Library file present at repo root or `docs/`
- [ ] ~30-40 InsightPattern seed records loaded
- [ ] ~6-9 Insight seed records per fixture loaded with cached LLM matches
- [ ] All matched_pattern_id references resolve correctly
- [ ] Novel-state Insights have null matched_pattern_id but valid llm_feedback
- [ ] `pnpm exec tsx prisma/seed.ts` runs cleanly

---

## Block E — `+ Insight` authoring

### E.1 Two entry points

Banker authors Insights via two paths:

**Path 1 — Dialpad button.** `+ Insight` becomes the sixth dialpad activity, alongside `+ Ask`, `+ Quantify`, `+ Model`, `+ Reaction`, `+ Action`. Form opens with:
- Track dropdown (defaults to current Track per sidebar Track context)
- Addresses Signal dropdown (optional; populated from Member's Goals/Blockers/Indecisions/Triggers)
- Insight type toggle ('reframe' / 'implication')
- 200-char content textarea

**Path 2 — Contextual affordance on Signal rows.** Within popup-as-workflow's evidence zone, each Goal/Blocker/Indecision/Trigger row gets a small `+ Insight` affordance in the lower-right of the row. Click → opens insight authoring form with:
- Track pre-filled (current Track)
- Addresses Signal pre-filled (the row's Signal id)
- Insight type defaulted to 'reframe' for Goal/Blocker, 'implication' for Indecision/Trigger (banker can change)
- Content textarea ready

Same form component for both paths; just different pre-fill state.

### E.2 LLM matching API integration

On Insight submit:

1. Insight record created in DB with status pending (no matched_pattern_id yet)
2. Server action calls LLM matching API:
   - Input: Insight content, Track, addresses_signal type/tag, candidate Patterns (filtered by track + matching signal_tag_scope)
   - Output: best-match Pattern id + confidence score (0-1) + feedback text
3. Insight record updated with matched_pattern_id, match_confidence, llm_feedback
4. State derivation:
   - `match_confidence >= 0.7` → state = 'routine'
   - `match_confidence < 0.7` → state = 'novel' (display "This looks novel. Submit as is?" confirmation; on confirm, save with state='novel')

### E.3 LLM prompt structure

Prompt sketch (CC implements; this is guidance, not literal):

```
System: You are an expert in commercial lending consultative practice. Given a banker's authored insight about a Member, identify the closest matching canonical pattern from a curated library, and produce affirming-or-extending feedback.

User: 
Banker's insight: "[200-char content]"
Track: [track_name]
Addresses: [signal_type_tag]

Candidate patterns:
1. [pattern_id] [content]
2. [pattern_id] [content]
...

Task:
1. Identify the closest matching pattern (or 'none' if no clear match).
2. Score match confidence 0-1.
3. Produce 200-char feedback in one of two modes:
   - High confidence (≥0.7): Affirm the banker's observation. Format: "Excellent observation! [reference to canonical pattern]." 
   - Medium confidence (0.4-0.7): Extend the banker's observation. Format: "You're catching something key about [topic]; [implication question from matched pattern]."
   - Low confidence (<0.4): Acknowledge novelty. Format: "[short acknowledgment of the observation's distinct angle]"
```

Constraints:
- Output strictly bounded to 200 chars
- No banned phrases per COMPLIANCE.md §10.2
- No marketing-flavored content; banker tone

### E.4 Demo-time LLM call vs cached

Live LLM call only on banker-authored Insights during demo session. Seed Insights have cached `matched_pattern_id` and `llm_feedback` populated at seed-time (no live call). This protects demo from API outage on EVP day.

### E.5 Form rendering and feedback

Insight authoring form displays banker feedback inline after submit:
- Brief animation/transition confirming save
- LLM feedback text rendered prominently for ~3-5 seconds
- Then closes form, returns banker to popup-as-workflow
- New Insight appears in popup evidence zone

For state='novel': "Submit as is?" confirmation appears before LLM call. Confirmation modal:
- "This looks novel."
- "Submit as is?" (Yes / Edit before submit)
- On Yes → LLM call with novel framing → save as state='novel'
- On Edit → return to form with content preserved

### E.6 Insight rendering in popup evidence zone

Insights appear in popup-as-workflow bottom zone alongside captured Signals/SizingMeasurements/Reactions. Each Insight row:
- Type chip ('Insight' or could be 'Reframe' / 'Implication' specifically)
- Content (200-char) as primary text
- LLM feedback in italics below content
- Capture metadata: "captured [date] · by [banker] · via + Insight"
- Addresses-Signal chip linking to the addressed Signal row

### E.7 Acceptance criteria for Block E

- [ ] `+ Insight` dialpad button added (sixth activity)
- [ ] `+ Insight` contextual affordance on Goal/Blocker/Indecision/Trigger rows in popup
- [ ] Insight authoring form supports both pre-fill paths
- [ ] LLM matching API integration functional
- [ ] Two-state lifecycle (routine / novel) with confidence threshold
- [ ] "Submit as is?" novel confirmation flow
- [ ] Demo seed has cached LLM matches; live LLM only for banker-authored insights during session
- [ ] Insight rows render in popup evidence zone with feedback
- [ ] No banned phrases in feedback templates

---

## Block F — Insight reference surfaces

### F.1 Lightbulb icon on Signal rows

Each Goal/Blocker/Indecision/Trigger row in popup-as-workflow evidence zone gets a small lightbulb icon affordance in the upper-right of the row (distinct from `+ Insight` affordance in lower-right).

Click lightbulb → reveals popover or expandable section with canonical Patterns ranked by match:
- Query Patterns where `track_id == current_track AND signal_tag_scope == row.signal.tag`
- Order by approved_at DESC (newest first) or by usage frequency (Pilot signal; for demo, simple ordering)
- Display each Pattern with: content (200-char canonical statement) + implication_questions as bulleted secondary content
- "Use as basis for + Insight" affordance on each Pattern → opens authoring form with content pre-filled from pattern (banker edits to Member-specific)

This is consultative reference, not authorship. Banker reads canonical patterns; potentially uses as raw material for own authoring.

### F.2 Footer "Implications:" section

Below the popup-as-workflow evidence zone, before the popup close button, a divider line followed by "Implications:" section.

Content: bulleted implication-questions drawn from matched Patterns in the popup's context.

Logic for which implications to surface:
- Query Patterns matching the popup's current Track + each captured Signal's tag in evidence zone
- For each matched Pattern, surface 1-2 of its implication_questions
- Cap at 4-6 total implication questions per popup
- Order by Signal-tag importance (Goal > Blocker > Trigger > Indecision; secondary by Pattern recency)

Render as:
```
─────────────────────────────────
Implications:
• [implication question 1]
• [implication question 2]
• [implication question 3]
```

These are conversational raw material — banker scans before/during conversation. Not CTAs; not actions; just reference scaffolding.

### F.3 Acceptance criteria for Block F

- [ ] Lightbulb icon on Signal rows; click reveals ranked canonical Patterns
- [ ] Pattern preview shows content + implication questions
- [ ] "Use as basis for + Insight" pre-fills authoring form
- [ ] Footer "Implications:" section renders bulleted questions from matching Patterns
- [ ] Implications capped at 4-6 per popup
- [ ] No banned phrases in pattern content or implications

---

## Block G — Polish

### G.1 Staleness with red font + "+ refresh" CTA

Captures older than 90 days render in red font in popup evidence zone. Precise day count displayed inline (28d, 73d, 184d format — no abstract "fresh" / "stale" labels).

For captures >90d: a `+ refresh` CTA appears in the row's lower-right (similar pattern to `+ Insight`). Click → opens + Quantify form in matrix-aware mode with factor pre-selected; banker re-captures with current value.

The new FactorCapture supersedes the old one in evaluator queries (newest by `captured_at`); old capture is not deleted.

### G.2 Specialist handoff dialog

Layer 8 CTA opens a small dialog (modal or inline drawer):
- Header: "Initiate specialist handoff for [Track name]"
- Department/team dropdown: 'CRE specialists', 'SBA specialists', 'treasury management', 'commercial credit underwriting'
- Specific specialist preference notes (optional, 200-char): "Optional — request specific specialist or routing notes"
- Submit creates SpecialistHandoff record with status='initiated'
- Existing artifact appears in Member's history

Render SpecialistHandoff as artifact in sidebar under existing artifact section pattern.

### G.3 Open-thread visual indicator on Indecision rows

Indecision Signals without resolution render with a small "open" indicator (could be the existing coral-ring treatment from earlier sprints, or a new minimal "open thread" chip).

Resolution detection:
- Signal has subsequent Reaction with response_value indicating resolution (banker-judged via existing Sprint 5a Reaction values)
- OR Signal has a banker-mark-resolved field (small affordance to mark resolved; defer if scope tight)

For Sprint 5b.1, simplest implementation: Indecision Signal is "open" if no subsequent Reaction exists for the same Member after the Indecision's captured_at timestamp. If even one Reaction exists later, treat as resolved (pragmatic; not perfect but ships cleanly).

Visual: small "open" chip on the Indecision row; muted color, not alarming.

### G.4 Language polish

Replace "complete" with "promising" wherever currently shown:
- Coach surface section indicators
- Any other surface with "complete" status

Add `+ deepen` affordance pattern: when popup-as-workflow CTA zone is empty (Block B) but evidence zone has content, an unobtrusive `+ deepen` affordance appears at popup bottom (above Implications:). Click → opens contextual menu of secondary actions:
- Author additional Insight (opens `+ Insight`)
- Schedule next conversation (opens `+ Action`)
- Refresh stale captures (if any exist)
- Initiate specialist handoff (if Track requires specialist)

`+ deepen` is the "always be closing" affordance — appears when primary CTAs exhausted but banker may still want secondary options. Distinct from "no CTAs needed; evidence stands alone" — `+ deepen` is opt-in, low-prominence, unobtrusive.

### G.5 Acceptance criteria for Block G

- [ ] Captures >90d render red with precise day counts
- [ ] `+ refresh` CTA opens + Quantify with factor pre-selected
- [ ] New FactorCapture supersedes old in evaluator queries
- [ ] Specialist handoff dialog functional; SpecialistHandoff record created
- [ ] SpecialistHandoff renders as artifact in sidebar
- [ ] Indecision Signals show "open" indicator when no subsequent Reaction
- [ ] "complete" replaced with "promising" everywhere it appeared
- [ ] `+ deepen` affordance appears at popup bottom when CTA zone empty + evidence exists
- [ ] No banned phrases in any new copy

---

## Block H — Governance updates

### H.1 BUILD_LOG.md entry

Comprehensive Sprint 5b.1 entry covering:
- What shipped per block (A-G)
- CTA derivation architecture (3 layers; bounded; empty-array-honest)
- Insight architecture (2 entities; 2-state lifecycle; LLM matching with caching for demo)
- Pattern library cardinality (~30-40 Patterns; per-Track distribution)
- ActionCard schema verification outcome
- Architectural decisions with rationale (e.g., why LLM matching not generation; why insight type is reframe/implication only; why staleness is inline visual not in CTA priority ranking)
- Cross-references to BUSINESS_FACTOR_MATRIX_v1.md and INSIGHT_PATTERN_LIBRARY_v1.md
- Per-fixture demo Insight cardinality (3 routine + 1 novel each)

### H.2 OPEN_QUESTIONS amendments

- Q-A2 (open-thread tiebreaker) → Update status: partial resolution via Block G open-thread visual indicator. Full resolution (multiple simultaneous open threads) deferred to Pilot.
- Add Q-B1 (CTA layer expansion): "When does the CTA layer set need expansion beyond 3 layers? Pilot signal: observed banker workflow patterns at scale."
- Add Q-B2 (LLM matching reliability at scale): "Pattern matching reliability decreases with library growth. Pilot needs: (a) library size bounds, (b) match confidence calibration, (c) escape hatch for low-confidence matches."

### H.3 Architectural notes for Pilot (continue from Sprint 5a.3 Note 1-4)

Add:
- **Note 5 — Insight authoring as KPI.** Demo doesn't track per-banker insight authoring counts as a KPI; Pilot may want to surface this to senior lenders for coaching opportunities. Architecture supports it (Insight entity has authored_by); Pilot adds the analytics layer.
- **Note 6 — LLM-mediated novel-Insight discovery.** Demo surfaces novel Insights only by direct query in Insight Engine; Pilot may want LLM to surface relevant historical novel Insights when banker authors new Insight (cross-Member edge-case discovery). Out of scope for 5b.1.
- **Note 7 — Make-canonical promotion flow.** Senior lender promoting a novel Insight to a canonical Pattern is meaningful product capability; demo defers to Pilot. When implemented: includes audit trail (promoted_from_insight_id), edit-and-approve flow, library growth governance.

### H.4 CLAUDE.md manifest update

Add to manifest:
- `lib/cta-derivation.ts`
- `docs/INSIGHT_PATTERN_LIBRARY_v1.md` (Tier 1 hard-rules, alongside BUSINESS_FACTOR_MATRIX_v1.md)
- New entities: InsightPattern, Insight, SpecialistHandoff
- LLM API integration module (location TBD per CC's architecture)

### H.5 Acceptance criteria for Block H

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 5-7 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Pilot deferrals to honor

Sprint 5b.1 does not ship:
- Readiness composite states (entirely)
- Reaction-driven CTAs (Layer 6 from architectural conversation)
- ActionCard-status-driven CTAs (Layer 7; conditional on schema verification)
- Cross-Track exploration CTAs (Layer 9)
- Insight Engine novel review surface (Sprint 5b.2 or Pilot)
- "Make canonical" promotion affordance (Pilot)
- Per-banker insight activity coaching view (Pilot)
- Real RBAC for senior-lender-only views (Pilot)
- Cross-Member novel Insight discoverability via LLM (Pilot)
- Banker-mark-resolved on Indecision (deferred)
- Strength tier label re-introduction (banker-facing surface stays CTA-driven)

If a question arises during 5b.1 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5b.1 is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. ActionCard schema verification outcome
3. Visual probes (screenshots if browser available, HTML probes if not) of:
   - Jenny's Discover popup with CTA zone showing Layer 1 CTAs (Class 1A or 1B)
   - Jenny's Measure popup with mix of Layer 1 + Layer 2 (threshold-uplift)
   - Jenny's Consult popup with empty CTA zone (rockstar package complete) and evidence list standing alone
   - Cygnus's Navigate popup with Layer 8 (specialist handoff) CTA
   - Northland's Discover popup with `+ Insight` contextual affordance on Goal/Blocker rows
   - Lightbulb icon click revealing canonical Patterns ranked by match
   - Footer "Implications:" section with bulleted questions
   - Stale capture (>90d) rendering red with `+ refresh` CTA
   - Open-thread indicator on Indecision row
   - `+ deepen` affordance at popup bottom when CTA zone empty
4. LLM matching test: author one banker Insight during demo session; verify live LLM call returns matched Pattern + feedback within reasonable latency
5. Per-fixture sanity check: 6-9 seed Insights render correctly across fixtures with cached LLM matches
6. Any deviations from spec with rationale
7. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan diff structure so each block is delimited.

---

## Estimated scope

5-7 effective build days CC time + ~1.5 days Francisco/Claude pattern authoring + ~3 hours editorial pass.

Largest blocks:
- **Block E (Insight authoring + LLM matching)** — non-trivial UX + API integration; ~1.5-2 days CC
- **Block A (CTA derivation)** — pure-function logic but careful per-layer implementation; ~1 day CC
- **Block F (Pattern reference surfaces)** — lightbulb interaction + Implications footer; ~1 day CC
- **Block G (Polish)** — multiple small items; ~1-1.5 days CC

Smaller blocks (B, C, D, H) are straightforward.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Sprint 5b.1 is the directional architecture sprint — the CTA derivation and Insight architecture are demo-critical foundations for Sprint 5b.2 and EVP demo.

After Sprint 5b.1 ships and visual review confirms (CTAs surface across all surfaces; popup-as-workflow honest about completion; insights render with feedback; canonical Patterns surface as reference; specialist handoff works), Sprint 5b.2 (portfolio surfaces — Track Performance, Member portfolio, Coverage, Stage-skip) is the next CC turn.
