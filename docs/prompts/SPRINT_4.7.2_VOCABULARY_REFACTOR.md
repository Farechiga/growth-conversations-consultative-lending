# Sprint 4.7.2 — V2 Vocabulary Refactor + Dialpad Simplification + Reaction Expansion

**Prompt for Claude Code. Single checkpoint. Ships the architectural rename and dialpad/Reaction restructuring after Sprint 4.7.1's visual cleanup lands. Estimated 2-3 effective build days. Touches schema (two real migrations), TypeScript union literals, all banker-facing strings, dot composition, coach content re-author, capture forms, dialpad reduction, sidebar artifact preview, governance cascade.**

## Pre-flight context

Sprint 4.7.1 (visual cleanup) shipped. Sprint 4.7.2 lands the architectural changes that the canonical governance docs already specify: ARCHITECTURE_V2.md and EVIDENCE_FRAMEWORK.md were updated before this sprint runs (per the 2026-04-30 amendments); CC's job here is to make the code match the documentation.

**Read these governance documents before starting:**

1. **ARCHITECTURE_V2.md** — particularly §3 (renamed objectives Discover/Measure/Consult/Navigate), §4 (five activities, with Show and Resolve removed from dialpad), §11.7 (surface vs schema separation; the two real Sprint 4.7.2 schema changes), §12.5 (v1 Resolve form retention).
2. **EVIDENCE_FRAMEWORK.md** — §2 (re-mapped catalog: 21 evidence types), §4 (five-activity to evidence mapping including Reaction form's contextual primary_concern dropdown).
3. **COMPLIANCE.md** §6.3 — the contextual primary_concern taxonomy that Reaction now adopts.
4. **BLAZE_STYLE_GUIDE.md** §14.9 — current v2 workstation pattern (will be updated as part of governance cascade in this sprint).

If any of these documents do not yet reflect the 2026-04-30 amendments (Discover/Measure/Consult/Navigate vocabulary, five-activity dialpad, ReactionValue expansion, Reaction.primary_concern column), **stop and surface to Francisco** rather than proceeding from inference. The documents are the source of truth for the work in this sprint.

**Architecture authority:** ARCHITECTURE_V2.md §11.7 is the canonical reference for what changes at the schema layer vs the surface layer. When this prompt and ARCHITECTURE_V2.md disagree on architectural commitment, ARCHITECTURE_V2.md wins.

## What ships in this sprint

Eleven blocks. All part of one checkpoint, delimited diffs.

- **Block A — Schema migrations.** ReactionValue enum expansion (5 → 7 values); Reaction.primary_concern column addition.
- **Block B — TypeScript V2Objective rename.** Code-side rename of the union literal and all references.
- **Block C — Dot composition rewrite.** Replace dotFromCount-style hardcoded arrays with derivation from the re-mapped EVIDENCE_FRAMEWORK catalog.
- **Block D — Coach content re-author.** Rewrite the four objective-level coach paragraphs against the new evidence-type mapping.
- **Block E — Dialpad button reduction.** Remove + Show and + Resolve from v2 dialpad. Leaves five buttons.
- **Block F — Reaction form expansion.** Subsume primary_concern dropdown with contextual taxonomy; expand response_value enum coverage.
- **Block G — ShowEvent auto-creation.** Wire deterministic ShowEvent creation on + Model save with "with Member" provenance.
- **Block H — Sidebar artifact preview.** Add explicit "Record show" button to artifact preview dialog.
- **Block I — TracksSupportedPanel wiring.** Update from "land" enum value to "discover".
- **Block J — Governance cascade.** Update CLAUDE.md §5, BLAZE_STYLE_GUIDE §14.9, SCOPE.md §3.1; resolve OPEN_QUESTIONS Q-A1..Q-A5.
- **Block K — BUILD_LOG entry.** Sprint 4.7.2 entry covering all of the above.

---

## Block A — Schema migrations

### A.1 ReactionValue enum expansion

Current ReactionValue enum has 5 values: `engaged`, `leaning_yes`, `skeptical`, `confused`, `dismissive`.

Expand to 7 values by adding:
- `committed` — Member said yes; formalities pending. Subsumes v1 RecommendationResponse.committed semantics.
- `declined` — Member said no. Subsumes v1 RecommendationResponse.declined semantics.

**Migration:** Prisma migration adds the two enum values. Existing Reaction records with the original 5 values remain valid.

**Note:** v2 ReactionValue is a deliberate subset of v1 RecommendationResponse. Per ARCHITECTURE_V2.md §11.7: funded moves to Navigate via ActionCard outcome; neutral is subsumed by absence-of-Reaction; leaning_no folds into skeptical for v2. Don't try to round-trip RecommendationResponse data into ReactionValue assuming parity.

### A.2 Reaction.primary_concern column

Add a new optional column on Reaction:

```prisma
model Reaction {
  // ... existing fields ...
  primary_concern  String?  // contextual taxonomy per COMPLIANCE.md §6.3
}
```

Column is `String?` (nullable, text storage) because the contextual taxonomy uses two different enum sets (8 open-thread values for engaged/leaning_yes/committed; 10 decline-reason values for declined/dismissive). Storing as String avoids the Prisma constraint of single-enum-per-column. Validation happens at the application layer per the contextual rule.

If the codebase prefers separate Prisma enums, define `ReactionPrimaryConcern` as the union of all 18 values across both contexts plus `service_or_capability_concern` (which appears in both) — total 17 distinct values (8 + 10 - 1 shared) — and let application-layer validation enforce which subset is allowed per response_value. Either approach is acceptable; CC chooses based on existing schema patterns.

**Migration:** Prisma migration adds the column. Existing Reaction records have `primary_concern = null`.

### A.3 Acceptance criteria for Block A

- [ ] ReactionValue enum has 7 values: engaged / leaning_yes / skeptical / confused / dismissive / committed / declined
- [ ] Reaction.primary_concern column exists; nullable
- [ ] Migrations apply cleanly; existing seed data remains valid
- [ ] `pnpm tsc --noEmit` clean
- [ ] No other entities modified; v1 entities unchanged

---

## Block B — TypeScript V2Objective rename

### B.1 Source-of-truth file

The V2Objective type is defined in `lib/stage-guidance.ts` (per ARCHITECTURE_V2.md §11.1 — Objective is derived state, not a Prisma model). Current definition:

```typescript
export type V2Objective = "land" | "understand" | "consult" | "formalize";
```

### B.2 Rename

Update the type definition to:

```typescript
export type V2Objective = "discover" | "measure" | "consult" | "navigate";
```

### B.3 Cascade rename across codebase

Audit and update all references:

- `lib/stage-guidance.ts` — type definition + OBJECTIVE_GUIDANCE keys
- `lib/objective-evidence.ts` — derivation function and any objective-keyed maps
- `app/v2/members/[id]/page.tsx` — objectives array literal, dot composition (Block C)
- `app/v2/_components/sidebar.tsx` — handleObjectiveClick conditional (currently keys on "land" for TracksSupportedPanel)
- `app/v2/_components/objective-dot.tsx` — any objective references in props or accessibility labels
- `app/v2/_components/tracks-supported-panel.tsx` — currently triggered by "land" click; update to "discover"
- All capture form files in `app/v2/members/[id]/capture-forms/` — any objective-keyed logic
- Any test fixtures or seed data referencing the old vocabulary

Use case-insensitive grep to find every reference: `grep -ri "\"land\"\|\"understand\"\|\"formalize\"" app/ lib/ components/v2/ prisma/seed*.ts` and update each match.

### B.4 Acceptance criteria for Block B

- [ ] V2Objective union literal renamed to discover/measure/consult/navigate
- [ ] No code references to "land" / "understand" / "formalize" remain in v2 code paths
- [ ] v1 code paths unaffected (v1 still uses its own enums; this rename is v2-only)
- [ ] `pnpm tsc --noEmit` clean
- [ ] Build succeeds

---

## Block C — Dot composition rewrite

### C.1 Current state

Per CC's Sprint 4.7 review note: dot composition currently lives as `dotFromCount(...)` array literal in `app/v2/members/[id]/page.tsx`. The literal hardcodes per-objective dot counts based on the old four-objective evidence mapping (Land 3 dots, Understand 4-7, Consult 4-7, Formalize 2-3).

### C.2 Replacement

The dot count and state per objective derives from the EVIDENCE_FRAMEWORK.md catalog (§2.1-2.4) applied against the captured evidence for this Member. Move from hardcoded literal to derivation.

Implementation approach (CC's choice):

**Option A — Refactor `lib/objective-evidence.ts`** to export a function `computeDotsForObjective(member: Member, objective: V2Objective, ...captures): ObjectiveDot[]` that returns the array of dot states for the given objective based on captured evidence per the catalog mapping in EVIDENCE_FRAMEWORK.md §2.

**Option B — Inline derivation in page.tsx** that walks the catalog mapping and produces the dot array per objective.

Option A is preferred because it keeps the logic testable and reusable; Option B is acceptable if the lib/ file becomes too large.

### C.3 Per-objective evidence types (from EVIDENCE_FRAMEWORK.md §2)

For dot derivation, the canonical mapping:

**Discover (7 evidence types):**
1. Goal
2. Blocker
3. Indecision
4. Trigger signal
5. Macro context match
6. Recommendation candidate
7. Tracks-supported indicator

**Measure (5 evidence types):**
1. Sized magnitude
2. Methodology note
3. Time period and confidence (companion row)
4. Model produced
5. Stale signal refresh (primary objective derived from refreshed entity type)

**Consult (5 evidence types):**
1. Model shown
2. Member reaction
3. Member quote on reaction
4. Decision posture
5. Primary concern or decline reason

**Navigate (4 evidence types):**
1. Specialist handoff initiated
2. ActionCard for next formal step
3. Application initiated
4. Decision finalized

For each evidence type, the dot state is computed:
- **Filled** if the corresponding capture exists for this Member
- **Outlined** if the evidence type is "suggested" — system can propose this evidence is missing but recommended (phase 2 work; for 4.7.2 demo, hand-curated per fixture)
- **Faint** if "not yet" — placeholder; don't actively suggest
- **Coral ring** if the dot represents an open thread (e.g., the Consult primary_concern dot when response is leaning_yes)

### C.4 Demo state per fixture (hand-curated for 4.7.2 visual review)

Update the per-fixture dot states to match the new objective vocabulary and evidence mapping:

**Jenny's Catering:**
- Discover: 5 captured (Goal "smooth seasonal revenue," Blocker "slow customer payments," Blocker "seasonal cash flow stress," Trigger "corporate-client late payments," Recommendation candidate "Working Capital LOC"); 2 not-yet (Indecision spot; Tracks-supported indicator)
- Measure: 3 captured (Sized $48K slow-season gap, Methodology note, Model produced "Seasonal cashflow projection · with Member"); 1 suggested (additional methodology refinement); 1 faint
- Consult: 4 captured (Model shown via with-Member auto-create, Reaction "leaning_yes," Member quote "That makes sense," Primary concern "co_decision_maker_household"); 1 open thread coral ring on Decision posture
- Navigate: 1 captured (ActionCard "joint call by May 12"); 3 faint

**Northland HVAC:**
- Discover: 5-6 captured per fixture content
- Measure: 2-3 captured
- Consult: 2-3 captured
- Navigate: 0-1 captured (mostly faint)

**Cygnus Bioscience:**
- Discover: 7 captured (two Asks now distinct per Sprint 4.7.1 Block H, plus Trigger, Macro, Recommendation candidate, Tracks-supported)
- Measure: 4 captured
- Consult: 5 captured
- Navigate: 1 captured (specialist handoff initiated to Marcus); 3 faint or in-flight

These are illustrative; CC may adjust slightly based on what the actual fixture seed data supports. The demo should demonstrate all four dot states (captured, suggested, not-yet, open-thread coral) across the three Members.

### C.5 Acceptance criteria for Block C

- [ ] Dot composition derives from captured evidence per EVIDENCE_FRAMEWORK.md catalog
- [ ] No hardcoded dot count arrays in page.tsx
- [ ] Per-fixture dot states match the new objective vocabulary
- [ ] All four dot states (captured / suggested / not-yet / open-thread) demonstrable across the three fixtures

---

## Block D — Coach content re-author

### D.1 Current state

`lib/stage-guidance.ts` ships with V2Objective = "land" | "understand" | "consult" | "formalize" and OBJECTIVE_GUIDANCE keyed the same way. Content was authored per the old four-objective vocabulary with Goals/Blockers/Indecision under Understand.

### D.2 Re-author, not just re-key

Coach content needs a content rewrite, not just a key rename. Per CC's review: "the current Member-Type paragraphs collapsed [Goals/Blockers/Indecision and quantitative Size content] together — they need a re-author, not a rename."

The new mapping:
- **Discover** (was Land + qualitative Understand): captures Goals, Blockers, Indecision, Triggers
- **Measure** (was quantitative Understand + Model produced): sized magnitudes, methodology, modeling
- **Consult**: shown artifacts, member reactions, decision posture
- **Navigate** (was Formalize): handoff, follow-through

Content structure per objective:

```typescript
export const OBJECTIVE_GUIDANCE: Record<V2Objective, ObjectiveGuidance> = {
  discover: {
    headline: "Do we understand how their business can grow?",
    body: "Surface the supporting context, market issues, seasonality, business-specific circumstances. Capture goals, blockers, indecision, triggers. Connect to a candidate product or growth track.",
    member_type_specifics: { /* Member-Type paragraphs */ },
  },
  measure: {
    headline: "Have we measured the pain, the lost opportunities, the solution?",
    body: "Quantify the gap. Cost the status quo. Size and shape the proposed solution. Scope and model — banker draft or with Member.",
    member_type_specifics: { /* Member-Type paragraphs */ },
  },
  consult: {
    headline: "Does the Member see how the opportunity comes together?",
    body: "Walk them through the model. Capture how they react, what they push back on, what threads hold the decision.",
    member_type_specifics: { /* Member-Type paragraphs */ },
  },
  navigate: {
    headline: "Are we helping get this across the finish line?",
    body: "Move the Member from ready-to-proceed to actually-proceeded. Handoff to specialist, ensure introductions land, track ActionCards through to completion.",
    member_type_specifics: { /* Member-Type paragraphs */ },
  },
};
```

### D.3 Member-Type-specific paragraphs

The existing 18 Member-Type-specific paragraphs (from Sprint 4 Prompt 4.2a Block A — three Member Types × six stages) need re-mapping under the new four-objective vocabulary. The re-mapping is:

- Old Ask paragraphs (Member-Type-specific guidance for "what to ask") → split between Discover (qualitative listening) and not-needed (the activity-button level). The signal-type-aware guidance becomes Discover content.
- Old Size paragraphs → Measure
- Old Show paragraphs → Consult (model shown framing)
- Old Resolve paragraphs → Consult (reaction framing)
- Old Lifecycle paragraphs → Navigate

Where the content collapses (e.g., Show + Resolve both becoming Consult), CC may merge two paragraphs into one cohesive Consult paragraph per Member Type. Authorial judgment on prose; the structural commitment is the four-objective mapping.

### D.4 Authority for content authoring

CC drafts the four objective-level paragraphs and the Member-Type-specific paragraphs. Francisco reviews before this sprint reports back. The verbatim phrasing for the four objective-level headlines and bodies is approved (above); CC drafts the Member-Type-specific content with FIXME annotations where authorial judgment is genuinely uncertain.

### D.5 Acceptance criteria for Block D

- [ ] OBJECTIVE_GUIDANCE keyed by discover/measure/consult/navigate
- [ ] Four objective-level paragraphs use the verbatim approved phrasing
- [ ] Member-Type-specific paragraphs re-mapped per the new vocabulary
- [ ] No remaining references to old vocabulary in coach content
- [ ] Content reads coherently when surfaced via "show ?" coach affordance

---

## Block E — Dialpad button reduction

### E.1 Current state

`app/v2/_components/dialpad.tsx` ships with seven pill-style buttons: + Ask, + Quantify, + Model, + Show, + Reaction, + Resolve, + Action.

### E.2 Replacement

Reduce to five buttons: + Ask, + Quantify, + Model, + Reaction, + Action.

**Removed:**
- **+ Show** — showing an existing artifact happens via sidebar artifact-click → preview dialog → optional "Record show" button (per Block H). Dialpad button retired.
- **+ Resolve** — member responses captured via + Reaction (per Block F). Dialpad button retired.

The corresponding capture form files (`show-form.tsx`, the v2 wrapper around v1 ResolveSection) can be:
- **Deleted entirely** for + Show — the v2 + Show form is no longer reachable
- **Retained for v1 only** for + Resolve — v1 ResolveSection persists for v1 routes per ARCHITECTURE_V2.md §12.5

### E.3 Acceptance criteria for Block E

- [ ] Dialpad shows 5 buttons in order: + Ask, + Quantify, + Model, + Reaction, + Action
- [ ] No + Show or + Resolve buttons rendered on v2 routes
- [ ] v1 routes unaffected (v1 ResolveSection still functions)
- [ ] Dialpad styling (pill aesthetic, sticky behavior, hover states) preserved from Sprint 4.7.1

---

## Block F — Reaction form expansion

### F.1 Current state

`app/v2/members/[id]/capture-forms/reaction-form.tsx` ships from Sprint 4.7 phase 2 with: response_value (5 enum values), member_quote, optional show_event_id reference.

### F.2 Expansion

Reaction form now subsumes v1 Resolve's functionality. Add:

**1. response_value enum expansion (Block A schema change reflected in form):**

Radio buttons or dropdown showing 7 values:
- engaged
- leaning_yes
- skeptical
- confused
- dismissive
- committed (NEW)
- declined (NEW)

**2. primary_concern contextual dropdown (Block A schema column reflected in form):**

When response_value ∈ {engaged, leaning_yes, committed}: show 8 open-thread options
- pricing_concern
- terms_concern
- timing_concern
- co_decision_maker_household
- external_advisor
- co_owner_or_board
- service_or_capability_concern
- other_open_thread

When response_value ∈ {declined, dismissive}: show 10 decline-reason options
- pricing_uncompetitive
- terms_uncompetitive
- timing_misaligned
- chose_alternative_lender
- chose_alternative_funding
- need_resolved_otherwise
- need_no_longer_present
- wants_to_revisit_later
- service_or_capability_concern
- other_member_stated

When response_value ∈ {skeptical, confused}: show open-thread set (since these are mid-conversation, not terminal).

When response_value is unset: dropdown hidden or disabled.

**3. Required vs optional behavior:**

primary_concern is **required** when response_value ∈ {skeptical, confused, leaning_yes, declined}; **optional** when response_value ∈ {engaged, committed, dismissive}. Matches v1 ResolveSection's NUANCED_RESPONSES discipline.

**4. Auto-clear on context switch:**

When banker switches response_value across context boundaries (e.g., from leaning_yes → declined, or vice versa), the primary_concern dropdown auto-clears to "Select…". Same pattern as v1 Sprint 4.6 implementation.

**5. Field labels:**

Field label on primary_concern dropdown switches contextually:
- For engaged/leaning_yes/committed: **"Primary concern"**
- For declined/dismissive: **"Member's stated reason for declining"**
- For skeptical/confused: **"Primary concern"**

### F.3 Helper text

primary_concern field receives helper text per COMPLIANCE.md §10.2:

> *Focus on what the Member said and the business factors driving their decision. Avoid notes about personal characteristics, household circumstances, or social context.*

Permanent (not dismissible). Italic, muted styling. Same pattern as Sprint 4.6 helper text on v1 ResolveSection.

### F.4 Submit-time scan

member_quote and any free-text fields on the Reaction form continue to run the compliance keyword scan from Sprint 4.6. primary_concern is structured (dropdown), so no scan needed on that field.

### F.5 Acceptance criteria for Block F

- [ ] Reaction form shows 7 response values
- [ ] primary_concern dropdown shows context-appropriate option set based on response_value
- [ ] Required vs optional behavior matches v1 NUANCED_RESPONSES discipline
- [ ] Auto-clear on context switch works
- [ ] Field label switches contextually
- [ ] Helper text appears on primary_concern field
- [ ] member_quote runs compliance keyword scan on submit

---

## Block G — ShowEvent auto-creation on with-Member provenance

### G.1 Current state

The + Model form has a provenance radio: "With Member" / "Banker draft." Currently the form's saveModel server action creates only a Model entity regardless of provenance.

### G.2 Update saveModel action

When provenance = "With Member," the saveModel action additionally creates a ShowEvent record:

```typescript
// pseudocode; CC adapts to actual server action shape
if (input.provenance === "with_member") {
  const showEvent = await prisma.showEvent.create({
    data: {
      model_id: model.id,
      conversation_id: input.conversation_id,
      banker_id: input.banker_id,
      member_id: input.member_id,
      occurred_at: model.created_at, // or "now"
      // any other required ShowEvent fields
    },
  });
}
```

When provenance = "Banker draft," only the Model record is created; no ShowEvent.

### G.3 Why deterministic, not optional

Per ARCHITECTURE_V2.md §4.3 and EVIDENCE_FRAMEWORK.md §2.3: with-Member provenance means the model was constructed in front of the Member, which by definition includes showing it. Banker doesn't need a separate confirmation step; the provenance radio is the confirmation. Simpler UX, fewer clicks.

### G.4 Acceptance criteria for Block G

- [ ] saveModel with provenance = "with_member" creates both Model and ShowEvent
- [ ] saveModel with provenance = "banker_draft" creates only Model
- [ ] ShowEvent created with correct linkage (model_id, conversation_id, banker_id, member_id)
- [ ] Existing seed data updated if needed to demonstrate the auto-creation pattern

---

## Block H — Sidebar artifact preview "Record show" button

### H.1 Current state

The sidebar artifact section has a "view ↗" affordance that opens an artifact preview dialog. Per Sprint 4.7 phase 1 + 2: clicking opens the preview; no explicit "Record show" mechanism exists.

### H.2 Add "Record show" button

The artifact preview dialog gains an explicit "Record show" button. When clicked:

1. A ShowEvent record is created linking this artifact to the current featured Conversation
2. The button updates to "Recorded ✓" state for the session (visual feedback)
3. The dialog can be dismissed; ShowEvent is captured

When the dialog is opened but the button is not clicked: no ShowEvent is created. This preserves the banker-rehearses-quietly use case (banker glances at an artifact to refresh memory before a call without polluting the audit trail with fake ShowEvents).

### H.3 Visual treatment

Button placement: bottom-right of preview dialog, primary action style (orange or accent treatment per BLAZE_STYLE_GUIDE).

Button copy: **"Record show"** when not yet clicked; **"Recorded ✓"** when clicked (disabled state, muted).

### H.4 Acceptance criteria for Block H

- [ ] Artifact preview dialog includes "Record show" button
- [ ] Clicking button creates ShowEvent linked to current Conversation
- [ ] Button updates to "Recorded" state after click
- [ ] Preview-without-record path preserved (banker can dismiss without recording)

---

## Block I — TracksSupportedPanel wiring update

### I.1 Current state

Per CC's Sprint 4.7 review note: TracksSupportedPanel is wired to fire when banker clicks the "land" objective in the sidebar (`handleObjectiveClick` conditional in `sidebar.tsx`).

### I.2 Update wiring

Update the conditional to fire on "discover" objective click instead. Trivial code change; mentioned for completeness so it doesn't get missed.

### I.3 Acceptance criteria for Block I

- [ ] TracksSupportedPanel opens when Discover objective is clicked
- [ ] No regression — other objective clicks behave correctly

---

## Block J — Governance cascade

### J.1 CLAUDE.md §5 (v2 workstation banker-facing terms)

Currently lists Land · Understand · Consult · Formalize and "seven activities." Update to:

- Discover · Measure · Consult · Navigate
- Five activities: Ask, Quantify, Model, Reaction, Action

Add the §11.7 surface-vs-schema separation note as a brief reference: schema retains existing names; banker-facing UI uses v2 vocabulary.

### J.2 BLAZE_STYLE_GUIDE.md §14.9 (v2 workstation pattern)

Currently documents the seven-pill dialpad and the four-objective vocabulary verbatim. Update to:

- Five-pill dialpad
- Four-objective vocabulary: Discover · Measure · Consult · Navigate
- Reaction form's contextual primary_concern dropdown pattern (cross-reference to COMPLIANCE.md §6.3 for taxonomy)
- "Record show" button on artifact preview dialog
- Updated terminal vocabulary table from Sprint 4.6 patch (Closing / Funded / Withdrawn / Introduced) — verify still current

### J.3 SCOPE.md §3.1 (v2 architecture commitment)

Currently rewritten with "objectives (Land · Understand · Consult · Formalize) × seven activities." Update to "objectives (Discover · Measure · Consult · Navigate) × five activities."

### J.4 OPEN_QUESTIONS — resolve Q-A1 through Q-A5

Per Sprint 4.7 phase 2 report-back, five questions Q-A1..Q-A5 were logged:
- Q-A1 (full per-objective panel)
- Q-A2 (open-thread tiebreaker)
- Q-A3 (mobile)
- Q-A4 (notifications routing)
- Q-A5 (inquiry-tracks data at scale; cross-referenced to Q-045)

For each, append resolution metadata or update status:
- Q-A1: deferred to Sprint 5 (popup-as-workflow)
- Q-A2: deferred to Sprint 5
- Q-A3: deferred to Pilot
- Q-A4: deferred to Pilot
- Q-A5: still open, cross-references Q-045 Pilot deferral

CC drafts the resolution language; Francisco reviews.

### J.5 Acceptance criteria for Block J

- [ ] CLAUDE.md §5 updated with new vocabulary
- [ ] BLAZE_STYLE_GUIDE §14.9 updated with five-pill dialpad and new architecture
- [ ] SCOPE.md §3.1 updated
- [ ] OPEN_QUESTIONS Q-A1..Q-A5 entries updated with resolution status

---

## Block K — BUILD_LOG.md entry

Single comprehensive entry covering:

- What shipped per block (A-J)
- Schema migrations applied (ReactionValue expansion, Reaction.primary_concern column)
- TypeScript V2Objective rename
- Coach content re-author with new evidence mapping
- Dialpad reduction (7 → 5 buttons)
- Reaction form expansion with contextual primary_concern
- ShowEvent auto-creation rule
- Artifact preview "Record show" button
- TracksSupportedPanel rewiring
- Governance cascade
- Q-A1..Q-A5 resolutions
- Decisions made during implementation (e.g., schema column type for primary_concern: String vs ReactionPrimaryConcern enum; Member-Type paragraph re-mapping where prose collapsed)
- Cross-references to ARCHITECTURE_V2.md §11.7 and EVIDENCE_FRAMEWORK.md §2

---

## Pilot deferrals to honor

Sprint 4.7.2 does not ship:

- State-dependent dot rendering (track candidate determines which dots to show) — Sprint 5
- Popup-as-workflow-surface (CTAs, links to capture forms, structured evidence display) — Sprint 5
- Track templates defining evidence inputs per dot — Sprint 5
- Insight Engine portfolio surfaces — Sprint 5
- Mobile responsive — Pilot or post-EVP
- v1 retirement — Pilot decision
- ReactionValue extension to v1 RecommendationResponse parity — explicitly out of scope (v2 ReactionValue is intentionally a deliberate subset)
- Reaction-side migration of Recommendation.member_response/primary_concern data — Pilot decision

If a question arises during 4.7.2 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively. Do not anticipate Sprint 5 or Pilot work in this turn.

---

## Reporting back

When Sprint 4.7.2 is complete, report back with:

1. Confirmation that Blocks A-K shipped per acceptance criteria
2. Visual probes (screenshots if browser available, HTML probes if not) of:
   - Dialpad showing 5 buttons (no + Show, no + Resolve)
   - Reaction form with all 7 response values and contextual primary_concern dropdown
   - Reaction form's auto-clear behavior across response context boundaries
   - Sidebar showing four objectives with new names (Discover/Measure/Consult/Navigate)
   - Coach content rendered via "show ?" affordance with new vocabulary
   - Artifact preview dialog with "Record show" button
   - + Model form's auto-create ShowEvent behavior on with-Member provenance (verify ShowEvent created in DB)
   - TracksSupportedPanel firing on Discover click
3. Migration log: schema changes applied, seed-data backfill verified
4. Per-fixture dot composition for Jenny, Northland, Cygnus (verify all four dot states demonstrable)
5. Governance updates: list of files updated (CLAUDE.md, BLAZE_STYLE_GUIDE, SCOPE.md, OPEN_QUESTIONS)
6. Any deviations from spec with rationale
7. Any new questions logged to OPEN_QUESTIONS
8. Any acceptance-criteria items that proved infeasible (with explanation)

Visual review will probe each block independently. Plan the diff structure so each block is delimited.

---

## Estimated scope

2-3 effective build days. The biggest blocks: B (rename cascade — touches many files), C (dot composition rewrite — non-trivial logic), D (coach content re-author — content authoring effort), F (Reaction form expansion — multiple sub-features). Smaller blocks (A migrations, E dialpad reduction, G/H/I single-feature wires, J governance cascade, K BUILD_LOG) are straightforward.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Sprint 4.7.2 must land cleanly so Sprint 5 has a stable foundation.

After Sprint 4.7.2 ships and visual review confirms, Sprint 5 (Insight Engine + state-dependent objectives + popup-as-workflow) is the next major sprint.
