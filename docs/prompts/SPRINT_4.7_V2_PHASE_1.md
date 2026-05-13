# Sprint 4.7 — v2 prototype phase 1

**Prompt for Claude Code. Two turns: Foundation (Turn 1) and Content (Turn 2). Each turn ships as a checkpoint with visual review before the next. Estimated 5-7 effective build days total. This is the largest single sprint in the build plan; complexity surprises are likely. Stop and re-scope with Francisco if either turn threatens to exceed budget.**

> **STATUS: EXECUTABLE.** §17 (open questions) was resolved 2026-04-29; decisions are baked into the relevant block sections below. Turn 1 restructured to 5 blocks (Route+flag / Schema / Dot system / Page layout primitives / Compliance banner+click-in-place) per Francisco's scope note that C/D/E (header/dialpad/sidebar) are best understood as one cohesive page-layout work piece.

## Pre-flight context for CC

Sprint 4.6 (Compliance posture floor) shipped the contextual taxonomy refactor for `Recommendation.primary_concern`, helper text on banker-prose fields, the submit-time keyword scan + `ComplianceScanEvent` telemetry entity, the compliance disclaimer banner, and the Capture discipline coach callout — all on v1 routes (`/growth-conversations`, `/members/[id]`). Sprint 4.6 patch added the Withdrawn terminal state and the Closed → Introduced rename for Connect-ending Tracks.

Sprint 4.7 ships **v2 phase 1**: a parallel `/v2/members/[id]` workstation that replaces the v1 split between Member Profile (`/members/[id]`) and Growth Conversations (`/growth-conversations/[memberId]`) with a single page per Member. v1 routes remain live; v2 is opt-in via feature flag during the build, primary at demo time.

The v2 architecture is fully specified in **`ARCHITECTURE_V2.md`** — read that document end-to-end before starting. The two-layer model (four persistent **objectives**, seven situational **activities**) is the foundation; everything else follows. Don't paraphrase from this prompt — go to ARCHITECTURE_V2 for the design substance.

Sprint 4.7 inherits all Sprint 4.6 patterns: helper text discipline, keyword scan, banner, coach affordance. Don't reinvent these in v2 — wire the existing components into the new surfaces.

**Read these governance documents before starting** (in order):

1. `ARCHITECTURE_V2.md` — the design (40K, end-to-end)
2. `EVIDENCE_FRAMEWORK.md` — operational evidence catalog mapping evidence types to objectives
3. `COMPLIANCE.md` — clean-room architecture, framing constraints, banner copy
4. `BLAZE_STYLE_GUIDE.md` §5 (typography hierarchy) and §14.5 (capture form patterns)
5. `DEMO_BUILD_PLAN_v3_AMENDMENTS.md` §4 (this sprint's scope)
6. `INSIGHT_ENGINE_DESIGN_NOTES.md` §9.5 addendum (Insight Engine cross-reference)
7. `OPEN_QUESTIONS.md` — Q-043 (v1↔v2 cohabitation), Q-044 (confidence-band thresholds), Q-045 (inquiry-tracks scale), Q-046 (multi-objective evidence), Q-047 (coach content authoring), Q-048 (per-Member objective customization), and the Q-A1..Q-A5 to log per ARCHITECTURE_V2 §13

If any of these files are missing or stale, **stop and notify Francisco** before proceeding. The documents are the source of truth.

## What ships in this sprint

Two turns; each with its own checkpoint.

**Turn 1 — Foundation** (Sprint 4.7-foundation): the v2 workstation route, layout, components, and schema additions. Page renders structurally complete with empty-state captured feed; capture flows are scaffolded but not wired.

**Turn 2 — Content** (Sprint 4.7-content): capture forms wired (+ Model, + Show, + Reaction as new entities; + Ask, + Quantify, + Resolve, + Action reused from v1); Tracks-supported panel; captured feed populated; key facts computed; coach affordance content; Member fixture seed enriched with verbatim quotes.

Plus governance updates (BUILD_LOG, BLAZE_STYLE_GUIDE, CLAUDE.md, SCOPE.md, OPEN_QUESTIONS) at the end of each turn.

---

# Turn 1 — Foundation

## Block A — Route + feature flag scaffolding

### A.1 New route at `/v2/members/[id]`

Parallel to existing `/members/[id]`. Use Next.js route groups or a sibling directory under `app/v2/` for clean separation. Both routes resolve concurrently; both read the same underlying schema.

Per ARCHITECTURE_V2 §7, the v2 page collapse means **one URL per Member**. The v1 `/growth-conversations/[memberId]` does NOT have a v2 equivalent — its functionality folds into the workstation.

### A.2 Feature flag mechanism

Banker setting OR query string. Simplest demo path: query string `?v2=true` on Member profile / Growth Conversations routes adds a "Try the new view →" link to v2; v2 includes a "Classic view ↗" link back to v1. No persistent banker-side toggle required for demo.

If implementation calls for per-banker preference (post-EVP work), document the design choice in BUILD_LOG and proceed with the simpler query-string approach for Sprint 4.7.

### A.3 Cross-linking

- v1 Member profile (`/members/[id]`): "Try the new view →" affordance somewhere visible (header right? footer?). Click navigates to `/v2/members/[id]`.
- v2 workstation (`/v2/members/[id]`): "Classic view ↗" affordance in header or footer. Click navigates to `/members/[id]`.
- v1 Growth Conversations: same "Try the new view →" pattern, links to `/v2/members/[memberId]`.

The arrows (→, ↗) are intentional vocabulary signals — `→` means "forward / proceed"; `↗` means "open elsewhere / classic" per UX convention.

### A.4 Acceptance criteria for Block A

- [ ] `/v2/members/jenny`, `/v2/members/northland`, `/v2/members/cygnus` all load (with placeholder content for blocks not yet built)
- [ ] v1 `/members/jenny` has visible "Try the new view →" affordance routing to `/v2/members/jenny`
- [ ] v2 workstation has "Classic view ↗" affordance routing to `/members/jenny`
- [ ] Both views share the same underlying Prisma client + seed data
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — Schema additions for v2

Per ARCHITECTURE_V2 §11, three new entities + one schema-comment update.

### B.1 `Objective` entity

ARCHITECTURE_V2 §11.1 marks this as **largely derived state**. Demo can implement objectives as a derived view (a TypeScript-side computation, not a persisted entity) rather than persisted records. CC's call: implement as derived if simpler; document the choice in BUILD_LOG.

If derived: add `lib/objectives.ts` with `computeObjectives(memberId): Objective[]` function. The four objectives (`LAND`, `UNDERSTAND`, `CONSULT`, `FORMALIZE`) are computed from existing captures via the EVIDENCE_FRAMEWORK.md mapping table.

If persisted: add to `prisma/schema.prisma` per the §11.1 spec, plus a migration that backfills from existing captures.

### B.2 `Model` entity (new)

Per ARCHITECTURE_V2 §11.2 — captures the + Model activity output. Persisted entity; supersession discipline parallel to Signal/SizingMeasurement.

```prisma
model Model {
  id                  String       @id @default(uuid())
  member_id           String
  member              Member       @relation(fields: [member_id], references: [id])
  conversation_id     String?
  conversation        Conversation? @relation(fields: [conversation_id], references: [id])
  artifact_id         String?
  artifact            Artifact?    @relation(fields: [artifact_id], references: [id])
  built_with_member   Boolean
  parameters          Json
  assumptions         Json
  output_summary      String
  built_at            DateTime     @default(now())
  built_by_banker_id  String
  built_by_banker     Banker       @relation(fields: [built_by_banker_id], references: [id])
  superseded_by_id    String?
  superseded_by       Model?       @relation("ModelSupersession", fields: [superseded_by_id], references: [id])
  superseded_at       DateTime?
  superseding_models  Model[]      @relation("ModelSupersession")
  active              Boolean      @default(true)

  @@index([member_id, active])
  @@index([conversation_id])
}
```

### B.3 `Reaction` entity (new)

Per ARCHITECTURE_V2 §11.3 — captures the + Reaction activity output.

```prisma
model Reaction {
  id                    String           @id @default(uuid())
  member_id             String
  member                Member           @relation(fields: [member_id], references: [id])
  conversation_id       String?
  conversation          Conversation?    @relation(fields: [conversation_id], references: [id])
  show_event_id         String?
  show_event            ShowEvent?       @relation(fields: [show_event_id], references: [id])
  response_value        ReactionValue
  member_quote          String?
  captured_at           DateTime         @default(now())
  captured_by_banker_id String
  captured_by_banker    Banker           @relation(fields: [captured_by_banker_id], references: [id])

  @@index([member_id])
  @@index([conversation_id])
}

enum ReactionValue {
  engaged
  leaning_yes
  skeptical
  confused
  dismissive
}
```

### B.4 `ShowEvent` entity (new)

Per ARCHITECTURE_V2 §11.4 — captures the + Show activity output. Decouples "an artifact was produced" (Model) from "an artifact was rendered to the Member" (ShowEvent).

```prisma
model ShowEvent {
  id                  String         @id @default(uuid())
  member_id           String
  member              Member         @relation(fields: [member_id], references: [id])
  conversation_id     String?
  conversation        Conversation?  @relation(fields: [conversation_id], references: [id])
  artifact_id         String
  artifact            Artifact       @relation(fields: [artifact_id], references: [id])
  model_id            String?
  model               Model?         @relation(fields: [model_id], references: [id])
  shown_at            DateTime       @default(now())
  shown_by_banker_id  String
  shown_by_banker     Banker         @relation(fields: [shown_by_banker_id], references: [id])
  context_note        String?

  reactions           Reaction[]

  @@index([member_id])
  @@index([artifact_id])
}
```

### B.5 Reverse relations on existing entities

- `Member.models`, `Member.reactions`, `Member.show_events`
- `Conversation.models`, `Conversation.reactions`, `Conversation.show_events`
- `Banker.built_models`, `Banker.captured_reactions`, `Banker.shown_events`
- `Artifact.shown_events`, `Artifact.models`

### B.6 Migration strategy

v2 prototype ships as **additive**. New entities added; existing entities unchanged. v1 reads work without modification. v2 reads use both old and new entities.

Single migration: `<timestamp>_sprint4_7_v2_phase_1_entities` creates all four tables with foreign-key constraints + indexes.

### B.7 Acceptance criteria for Block B

- [ ] Schema validates; migration runs cleanly via `pnpm prisma migrate deploy`
- [ ] Prisma client regenerates without errors
- [ ] Existing v1 routes still load
- [ ] `pnpm tsc --noEmit` clean

---

## Block C — Dot system component

Per ARCHITECTURE_V2 §5. Built first because the sidebar (Block D) imports it.

### C.1 Component

`app/v2/_components/objective-dot.tsx` (shared client component).

```typescript
type DotState = "filled" | "outlined" | "faint" | "accented";

function ObjectiveDot({ state, onClick }: { state: DotState; onClick?: () => void }) { ... }
```

### C.2 Visual states (per ARCHITECTURE_V2 §5.1)

| State | Visual |
|---|---|
| `filled` | Solid `--blaze-grey-darker` fill, no stroke |
| `outlined` | Hollow circle, 0.5px `--blaze-grey-darker` stroke, 40% opacity |
| `faint` | Hollow circle, `--blaze-grey-soft` stroke, 20% opacity |
| `accented` | Solid `--blaze-orange-burnt` fill (CC's call between solid-fill and outlined-with-ring per ARCHITECTURE_V2 §5.1; solid-fill picked for visual weight against the all-grey dot rows; document in BUILD_LOG) |

Sizing: 8px diameter, 6px gap between dots in a row.

### C.3 Click behavior (per ARCHITECTURE_V2 §5.3)

| State | Click reveals |
|---|---|
| `filled` | Captured evidence detail panel (in-place) |
| `outlined` | Capture form for that evidence type, pre-routed to this objective |
| `faint` | No-op (or subtle "not yet relevant" tooltip) |
| `accented` | Detail panel for the open thread + affordances to address it |

Click handlers scaffolded in Turn 1 with placeholder behavior (e.g., a placeholder modal stating "Detail panel arrives in Turn 2"); full panel implementations in Turn 2.

### C.4 Acceptance criteria for Block C

- [ ] All four dot states render correctly per spec
- [ ] Sizing (8px diameter, 6px gap) matches §5.4
- [ ] Click handlers wire to placeholder panels in Turn 1; real panels Turn 2
- [ ] Coral accent uses `--blaze-orange-burnt` token

---

## Block D — Page layout primitives (header / key facts / dialpad / sidebar / main panel)

Per ARCHITECTURE_V2 §6. The five layout components ship as one cohesive work piece; the diff cleanly separates concerns by file but the visual-review checkpoint reads it as "the page chrome lands."

### D.1 Header (per §6.1)

`app/v2/members/[id]/header.tsx`. Single-line layout:

- **Left:** Member name in display weight per BLAZE_STYLE_GUIDE §5.2 (largest type on the page); tagline in caption weight: `Member Type · Lifecycle stage · Primary banker`
- **Right:** Open-thread badge with coral accent treatment. Per ARCHITECTURE_V2 §13 Q-A2 default heuristic: ActionCard with nearest due date wins; else Resolution with primary_concern; ties break by recency. Format: short noun phrase + date/context, e.g., *"Spouse pending · Apr 8"* or *"Application underway · due Apr 22"*. Renders nothing if no urgent item exists.

The header replaces both the v1 Member profile breadcrumb-and-identity-strip and the Growth Conversations breadcrumb. **One header per page** — establishes Member identity without anything above it.

### D.2 Key facts strip (per §6.2)

`app/v2/members/[id]/key-facts-strip.tsx`. Horizontal strip directly below header.

- Visual: lightest-coral background fill (define new `--blaze-coral-pale` token if needed); full-width; ~48px tall
- Content: 3-5 facts as glance-able key/value pairs, separated by middots
- Each fact: `{ label, value, source_id, source_type }`; clickable for source-evidence detail (Turn 1: placeholder click handler; Turn 2: real panel)

For demo, key facts are **curated per fixture**. Add `keyFacts: KeyFact[]` Json column on Member; populate in seed:

| Member | keyFacts (illustrative; refine if seed data differs) |
|---|---|
| Jenny's Catering | $48K slow-season · $75K LOC sized · leaning yes / spouse pending · Apr 8 last touch |
| Northland HVAC | $180K fleet target · 18-mo payback · engaged / awaiting board · Apr 5 last touch |
| Cygnus Bioscience | $4-7M CRE need · capital event · specialist engaged · Apr 21 last touch |

### D.3 Sticky activity dialpad (per §6.3)

`app/v2/members/[id]/dialpad.tsx`. Horizontal row of seven pill-shaped buttons in this order:

```
[+ Ask] [+ Quantify] [+ Model] [+ Show] [+ Reaction] [+ Resolve] [+ Action]
```

**Visual:**
- Text: `--blaze-orange-deep`
- Background: `--blaze-white`
- Border: 0.5px `--blaze-orange-deep`
- Hover: `--blaze-orange-pale` fill
- Pressed: `--blaze-orange-burnt` border, darker text
- Pill rounding: full pill (`rounded-full`)
- Inter-button gap: 8-12px (tune visually)

**Sticky positioning** per Q-D1: `position: sticky` so the dialpad stays at the top of the viewport when the captured feed scrolls. Tight height ~36px keeps the cost low. Sticks below the header + key facts strip + compliance banner; never below the page top.

**Persistent and always-visible.** Buttons do NOT change based on objective state, captured evidence, or any other condition. The mental model is "these are my tools."

**Click → right-drawer** for capture form (drawer chosen over modal per ARCHITECTURE_V2 §6.3 implementation flexibility — keeps workstation context partially visible for reference). All seven activities use the same drawer pattern.

In Turn 1: each button opens a placeholder drawer with "Capture form arrives in Turn 2" copy. Real capture forms wire in Turn 2.

**Vocabulary note** (per ARCHITECTURE_V2 §11.7): "+ Quantify" is the banker-facing label; the underlying schema entity is `SizingMeasurement` (no rename). Translation lives in this dialpad component file (the button label) and `lib/enum-descriptions.ts` (the sidebar / capture-feed labels).

### D.4 Sidebar (per §6.4)

`app/v2/members/[id]/sidebar.tsx`. Width: 180px. Stacked sections (top to bottom):

1. **Objectives** (60% vertical) — "objectives" caption label, then four objective blocks. Each block: objective name in heading weight (Land · Understand · Consult · Formalize); dot row beneath (using ObjectiveDot from Block C); optional sidebar highlight line beneath dots (most-consequential captured evidence, e.g., "$48K slow-season"). Coral `accented` dot reserved for the open thread; most blocks all-grey with at most one accented dot.
2. **Artifact slot** (15% vertical) — "artifact" caption label; 1-2 artifact cards (artifact name heading weight, shown-date caption, "view ↗" affordance). Click opens artifact preview popup; reuse `app/members/[id]/artifact-preview-dialog.tsx` if practical.
3. **Macro slot** (15% vertical) — "macro" caption label; compact Macro card if Member matches an active Macro. Reuse Macro match logic from `app/members/[id]/macro-context-banner.tsx`. Card: title (2 lines max) + authored-by caption. Click expands Macro detail.
4. **History affordance** (5% vertical) — "history" caption label; 3-4 most recent Conversation dates; "history (N) ↗" affordance opens timeline popup.
5. **Coach affordance** (5% vertical) — "show ?" at bottom; click expands inline coaching text. Turn 1: scaffold with placeholder content. Turn 2: real coach content reorganized under the four objectives per Block O.

### D.5 Main panel scaffolding (per §6.5)

`app/v2/members/[id]/captured-feed.tsx`. Width: 440px (or remaining). Captured-evidence feed renders in Turn 2; **Turn 1 ships the empty-state placeholder only**.

Empty state: dashed-border placeholder at bottom with text "capture more — activities above" at 50% opacity. Subtle, not pushy. The full six capture-card variants (one per activity) ship in Turn 2 Block N.

### D.6 Acceptance criteria for Block D

- [ ] Header renders Member name in display weight, tagline in caption weight, open-thread badge (coral accent) when applicable
- [ ] Open-thread badge picks ActionCard-with-nearest-due-date / Resolution-with-primary_concern / null per heuristic
- [ ] Key facts strip renders 3-5 facts per Member fixture with `--blaze-coral-pale` background
- [ ] Sticky dialpad with 7 buttons at ~36px height; sticky on scroll; pill styling correct
- [ ] Each dialpad button opens placeholder right-drawer ("Capture form arrives in Turn 2")
- [ ] Sidebar renders at 180px with all 5 stacked sections (objectives / artifact / macro / history / coach)
- [ ] Objectives section shows 4 blocks with name + dot row + (optional) highlight
- [ ] Macro slot renders for Members with matching Macros (reuse v1 match logic)
- [ ] Main panel renders empty-state nudge at bottom (dashed border, 50% opacity)
- [ ] BLAZE_STYLE_GUIDE typography hierarchy verified visually (display / heading / caption / body)

---

## Block E — Compliance disclaimer banner + click-in-place navigation

### E.1 Compliance disclaimer banner

Reuse `app/_components/compliance-disclaimer-banner.tsx` from Sprint 4.6 unchanged. Mount **below the page header, above the key facts strip** (per Q-H1 — the header establishes Member identity without anything above it; the banner is page-level context, not chrome).

The banner is sessionStorage-gated and renders only after client mount; SSR HTML probes won't see it. Real browsers do.

### E.2 Click-in-place navigation discipline (per ARCHITECTURE_V2 §6.6)

**No clicks on the workstation should result in page navigation away from the workstation.** Every interaction opens an in-place panel, popover, or modal that dismisses without leaving.

Specific behaviors:
- Objective name → full objective panel
- Individual dot → detail panel (per dot state, see Block C.3)
- Capture card in feed → expanded augmenting summary
- Key fact → source-evidence detail
- Artifact card → rendered chart popup
- Macro card → full Macro detail
- "history (N) ↗" → Conversation timeline popup
- "show ?" → inline coaching expansion

In Turn 1, scaffold these as placeholder panels ("Detail panel arrives in Turn 2"). Real content ships in Turn 2.

The only navigation link on the workstation is the cross-link affordance ("Classic view ↗" → /members/[id]).

### E.3 Acceptance criteria for Block E

- [ ] Compliance banner appears below header, above key facts strip on first session visit
- [ ] Banner dismissible per session via sessionStorage (test: dismiss, refresh tab → banner returns; close-tab + reopen → banner returns)
- [ ] All workstation click targets open in-place panels (Turn 1 placeholders; Turn 2 real)
- [ ] No click within the workstation navigates the page (except the explicit cross-link affordance)

---

## Turn 1 — Verification + checkpoint

Before reporting Turn 1 complete:

- [ ] All three Member fixtures load at `/v2/members/[slug]`
- [ ] Header, key facts strip, dialpad, sidebar, main panel all render structurally
- [ ] Dot states render correctly across the four states
- [ ] Cross-links (v1↔v2) work bidirectionally
- [ ] Compliance disclaimer banner renders correctly
- [ ] BLAZE_STYLE_GUIDE typography hierarchy verified visually (Member name display weight; objective names heading weight; type tags caption weight; body 14px)
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` clean

**Stop and report Turn 1 to Francisco for visual review before starting Turn 2.**

---

# Turn 2 — Content

Turn 2 wires capture forms (new + reused), populates the captured feed, surfaces the Tracks-supported panel, ships the coach content, and enriches Member fixtures with verbatim quotes.

## Block I — + Model capture form (new entity)

Per ARCHITECTURE_V2 §11.2 + §4 + §6.5.

### I.1 Capture form

Surfaced from the dialpad's + Model button. Fields:

- **Model name** (required, text input) — short noun phrase, e.g., "Seasonal cashflow projection"
- **With Member / Banker draft** (required, radio group) — `built_with_member: boolean`. Critical evidentiary distinction per ARCHITECTURE_V2 §4 notes
- **Artifact** (optional, select) — link to an existing Artifact if the Model produced or referenced one
- **Parameters** (Json input) — structured key/value pairs, e.g., `{rate: 0.075, term_months: 60, ...}`. Render as multi-row form with key/value text inputs + + Add Row affordance
- **Assumptions** (Json or repeating text input) — list of stated assumptions. Render as repeating text rows
- **Output summary** (required, textarea, 1-2 sentences) — banker's summary of what the model shows

### I.2 Server Action

`saveModel` in `app/v2/members/[id]/actions.ts`. Cross-table transaction:
1. Find or create Conversation
2. Create Model record with all captured fields + `built_at = now()`, `built_by_banker_id = currentBanker`
3. `revalidatePath` on `/v2/members/[id]` and `/members/[id]`

### I.3 Compliance scan integration

`output_summary` field is `[FL:BANKER-PROSE]` — runs the Sprint 4.6 keyword scan on submit. Reuse `ComplianceScanModal` + `recordComplianceScanEvent`.

### I.4 Acceptance criteria for Block I

- [ ] + Model button opens capture form
- [ ] All required fields validated; "With Member" / "Banker draft" radio enforced
- [ ] Save creates Model record with correct fields
- [ ] Output summary fires compliance scan when matches present
- [ ] Augmenting-summary detail panel shows the captured Model with edit affordance

---

## Block J — + Show capture form (new entity)

Per ARCHITECTURE_V2 §11.4 + §4.

### J.1 Capture form

Fields:

- **Artifact** (required, select) — which Artifact was rendered. Pulls from existing Artifact entity scoped to Member context where appropriate
- **Model** (optional, select) — which Model produced this Artifact, if applicable
- **Context note** (optional, text input) — e.g., "during Q1 review meeting"

### J.2 Server Action

`saveShowEvent`. Single-table transaction:
1. Find or create Conversation
2. Create ShowEvent record

### J.3 Acceptance criteria for Block J

- [ ] + Show button opens capture form
- [ ] Artifact dropdown populates from existing Artifacts
- [ ] Save creates ShowEvent record
- [ ] Captured ShowEvent renders in the captured feed

---

## Block K — + Reaction capture form (new entity)

Per ARCHITECTURE_V2 §11.3 + §4 + §6.5.

### K.1 Capture form

Fields:

- **Response value** (required, select) — `engaged | leaning_yes | skeptical | confused | dismissive`
- **Member quote** (optional, textarea) — verbatim what the Member said. Italic placeholder framing.
- **Show event** (optional, select) — which Show triggered this reaction (most recent ShowEvent for this Member is sensible default)

### K.2 Server Action

`saveReaction`. Single-table transaction.

### K.3 Compliance scan integration

`member_quote` field is `[FL:BANKER-PROSE]` — runs the keyword scan on submit. Helper text per COMPLIANCE.md §10.2 (similar to "Customer response" field on v1 Resolve).

### K.4 Acceptance criteria for Block K

- [ ] + Reaction button opens capture form
- [ ] Response value dropdown shows all 5 enum values
- [ ] Save creates Reaction record
- [ ] Member quote fires compliance scan when matches present
- [ ] Reaction renders in captured feed with `member_quote` set apart in italic with left-rule mark

---

## Block L — Existing capture forms reused as drawers/modals

Per ARCHITECTURE_V2 §4 — + Ask, + Quantify, + Resolve, + Action reuse existing v1 capture forms with light wrapper changes.

### L.1 + Ask

Wraps `app/growth-conversations/[memberId]/ask-section.tsx`. The component logic stays unchanged; the wrapper changes the surface from inline section to drawer/modal.

If the AskSection's parent component shape (props, state ownership) makes this awkward, the alternative is to lift the AskSection's internals into a new shared component used by both v1 and v2. CC's call; document the choice.

### L.2 + Quantify

Wraps `app/growth-conversations/[memberId]/size-section.tsx` (rename inline label from "Size" to "Quantify" if visible to banker — confirm with Francisco; see §17 Q-L1).

### L.3 + Resolve

Wraps `app/growth-conversations/[memberId]/resolve-section.tsx`.

### L.4 + Action

ActionCard creation. Currently lives inside Resolve form for engaged-spectrum responses; in v2 it's a standalone activity. Extract the ActionCard sub-form into a reusable component; surface it standalone via + Action.

### L.5 Acceptance criteria for Block L

- [ ] All four reused capture forms surface from dialpad as drawers/modals
- [ ] Existing v1 functionality (validation, save, supersession) preserved
- [ ] Captures save against the same underlying tables as v1
- [ ] Compliance scan continues to fire on banker-prose fields

---

## Block M — Tracks-supported-by-current-evidence panel

Per ARCHITECTURE_V2 §10.

### M.1 Surfacing

Inside the Identify objective. Click "Land" objective name → panel opens (in-place).

### M.2 Content

Panel renders 3-5 Tracks ranked by evidence-strength band:

```
Tracks supported by current evidence:

  Working Capital LOC          Strong support     (4 evidence dots)
  Cash Management upgrade      Moderate support   (2 evidence dots)
  Equipment Loan               Insufficient evidence yet
```

### M.3 Compliance-careful framing

**Required language** (per COMPLIANCE.md §10.2 / ARCHITECTURE_V2 §10.2):
- ✓ "Tracks supported by current evidence"
- ✓ "Strong support / moderate support / insufficient evidence yet"
- ✓ "The banker considers and decides"

**Banned language** (compliance-fraught):
- ❌ "Candidate tracks"
- ❌ "Recommended for this Member"
- ❌ "Eligible for"
- ❌ "Bumped to candidate track"

### M.4 Demo data — CC drafts with FIXME annotations (per Q-M1)

Per ARCHITECTURE_V2 §10.4 — at three Members in the demo, true cross-portfolio anonymized intelligence is not feasible. Hand-curate per fixture.

CC drafts the per-fixture data in Turn 2 with `// FIXME(Francisco): review and refine` comments in the seed. Francisco reviews before EVP demo; refinements land as a small follow-up commit.

Starting point per Member (CC's draft; EVIDENCE_FRAMEWORK.md §5.4 informs the strength scoring):

| Member | Strong | Moderate | Insufficient |
|---|---|---|---|
| Jenny | Working Capital LOC | (CC draft per fixture context) | (CC draft per fixture context) |
| Northland | Vehicle/Fleet Loan | (CC draft per fixture context) | (CC draft per fixture context) |
| Cygnus | CRE Term Loan | (CC draft per fixture context) | (CC draft per fixture context) |

Add `tracksByEvidenceStrength: TrackEvidenceCohort` field on Member (Json column); populate in seed with FIXME-annotated drafts; render in panel.

### M.5 Acceptance criteria for Block M

- [ ] Click on Land objective opens Tracks-supported panel
- [ ] Panel renders 3-5 Tracks with strength bands per fixture
- [ ] Compliance-careful framing language verified verbatim
- [ ] Each Track is clickable (placeholder navigation in phase 1; rich detail in phase 2)

---

## Block N — Captured feed (six capture-card variants)

Per ARCHITECTURE_V2 §6.5.

### N.1 Card variants

| Activity | Card content |
|---|---|
| Ask (Goal/Blocker/Indecision/Trigger) | Type tag · date · structured label · Member quote (italic, if present) · methodology or detail |
| Quantify | "sized" tag · date · magnitude (heading weight) · unit/period/source detail |
| Model | "model" tag · date · model name · parameters summary · "With Member" or "Banker draft" indicator |
| Show | "shown" tag · date · artifact name · context (which model, which conversation) |
| Reaction | "reaction" tag · date · response value (heading weight) · Member quote (italic, if present) |
| Resolve | "resolution" tag · date · posture (heading weight) · primary concern · Member quote (italic, if present) · "→ next" line |

### N.2 Discipline (per §6.5)

- Member quote in italic, set apart with left-rule mark
- Type tag in 12px caption weight
- Magnitude/label in 16px heading weight
- Detail in 14px body weight
- Open-thread captures get coral border accent (1px, `--blaze-orange-burnt`)
- Stale captures (>90 days old or explicitly superseded) get 70% opacity

### N.3 Sort + click

- Sort: recent-first across all activity types
- Click: expand inline with augmenting summary detail (reuse Sprint 4 §4.1c augmenting-summary pattern)
- Edit: from expanded panel, edit affordance opens form pre-populated; save creates supersession (Signal/SizingMeasurement supersession pattern)

### N.4 Acceptance criteria for Block N

- [ ] All six card variants render correctly with typography per spec
- [ ] Sort is recent-first across all activity types mixed
- [ ] Click expands inline; edit from expanded panel works
- [ ] Open-thread captures show coral border
- [ ] Stale captures show 70% opacity

---

## Block O — Coach affordance ("show ?") content

Per ARCHITECTURE_V2 §9 + Q-O1 resolution: route by **captured signal type**, not by stage label. This requires reading each existing v1 stage-guidance paragraph and routing it to the v2 objective whose evidence the paragraph informs.

### O.1 Content reorganization

The existing 18 v1 stage-guidance paragraphs (`lib/stage-guidance.ts`) split per stage label. v2 reorganizes by **what type of evidence the paragraph helps the banker capture** — which maps cleanly onto the four objectives via the EVIDENCE_FRAMEWORK.md catalog.

Routing rule:

| Source paragraph | v2 Objective | Why |
|---|---|---|
| **Ask** paragraphs informing **Trigger** captures | Land | Trigger signals advance Land per ARCHITECTURE_V2 §3.1 evidence types |
| **Ask** paragraphs informing **Goal / Blocker / Indecision** captures | Understand | Goal/Blocker/Indecision signals advance Understand per §3.2 |
| **Size** paragraphs (sized magnitudes + methodology) | Understand | Per §3.2 |
| **Show** paragraphs | Consult | Per §3.3 evidence types (Model produced / shown) |
| **Resolve** paragraphs | Consult | Per §3.3 (Member reaction / decision posture / primary concern) |
| **Lifecycle** paragraphs (Decision pending / Funded / Specialist engagement / Introduced) | Formalize | Per §3.4 |

This routing is finer-grained than a stage→objective mapping. Some Ask paragraphs split between Land and Understand because Ask captures four distinct signal types and the paragraph's content implies which type it scaffolds. CC reads each of the 18 paragraphs and routes by content. Estimated additional effort: ~30 minutes of careful reading.

Implementation: extend `lib/stage-guidance.ts` with an `objectiveGuidance(objective, memberTypeName)` helper that returns the relevant paragraphs (possibly multiple per objective, since several v1 paragraphs may map to the same objective).

### O.2 Surface

Click "show ?" → expands inline. Default state: collapsed. Per ARCHITECTURE_V2 §9.2 — junior bankers may keep it expanded; senior bankers ignore it.

### O.3 Acceptance criteria for Block O

- [ ] "show ?" affordance expands inline with content
- [ ] Content reorganized under four objectives, sourced from existing 18 paragraphs
- [ ] Member-Type-specific content surfaces correctly per Member fixture

---

## Block P — Member fixture seed enrichment

Per ARCHITECTURE_V2 §12.1 ("Direct Member quote capture (currently optional) → Promoted to centerpiece in v2") and the build plan amendments §4.2.

### P.1 Source: MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md (Francisco-authored)

Per Q-P1 resolution: Francisco authors 30 verbatim Member quotes (10 per Member) in `MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md` and uploads to project knowledge before Turn 2 begins. Block P picks the **strongest 5-7 per Member** distributed across:

- Goals (Signal.their_words for type=goal)
- Blockers (Signal.their_words for type=blocker)
- Indecisions (Signal.their_words for type=indecision)
- Reactions (Reaction.member_quote — new entity from Block K)
- Resolutions (Recommendation.their_words)

CC reads the file; selects 5-7 strongest per Member based on demo narrative fit (i.e., the quote that lands most clearly when read aloud); writes the selected quotes into seed.ts.

If `MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md` is not in project knowledge when Turn 2 starts, **stop and notify Francisco** rather than draft from scratch.

### P.2 Update seed.ts

Wire the selected quotes into the existing seed pattern. Where existing Signals lack `their_words`, populate. Where new Reaction entities are needed for v2 demo data, create in seed.

### P.3 Acceptance criteria for Block P

- [ ] `MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md` exists at repo root or project knowledge before Turn 2 starts
- [ ] Each Member has 5-7 verbatim quotes selected from the file, distributed across goal/blocker/indecision/reaction/resolution
- [ ] Quotes render correctly in v2 captured feed with italic + left-rule mark
- [ ] Re-seed cleanly loads all quotes
- [ ] CC reports back which quotes were picked per Member with rationale

---

## Block Q — Compliance scan integration on all v2 banker-prose fields

Per Sprint 4.6 §C.3 + ARCHITECTURE_V2 + COMPLIANCE.md §2.1.

### Q.1 Banker-prose fields in v2

Audit all v2 capture forms; fire the Sprint 4.6 keyword scan on these fields:

- + Ask: `their_words` (Direct quote on Signal) — extends Sprint 4.6 deferred scan to AskSection
- + Quantify: `their_words` + `methodology_note` — extends Sprint 4.6 deferred scan to SizeSection
- + Model: `output_summary` (new in v2)
- + Reaction: `member_quote` (new in v2)
- + Resolve: `customer_response` + `closing_notes` + `action_card_description` (existing from Sprint 4.6)
- + Action: `description` (existing from Sprint 4.6)

Reuse `ComplianceScanModal` + `recordComplianceScanEvent` from Sprint 4.6.

### Q.2 Acceptance criteria for Block Q

- [ ] Test phrases fire the scan on all v2 banker-prose fields
- [ ] `ComplianceScanEvent` rows accumulate per scan firing
- [ ] No regression in v1 scan behavior

---

## Block R — Governance updates

### R.1 BUILD_LOG.md entry

Comprehensive Sprint 4.7 entry covering both turns. Per-block delimited; decisions made; lessons recorded; deviations from spec.

### R.2 BLAZE_STYLE_GUIDE.md updates

New section §15 "v2 workstation pattern" documenting:
- Pattern A layout (header / key facts / dialpad / sidebar / main)
- Dot vocabulary (filled / outlined / faint / accented)
- Compliance-careful copy framings (Tracks-supported language)
- Coach affordance pattern
- Click-in-place navigation discipline
- Vocabulary updates (workstation, objective, activity, dot, open thread, evidence)

### R.3 CLAUDE.md §5 vocabulary lock update

Add v2 banker-facing terms:
- **Workstation** — the v2 single-page-per-Member surface
- **Objective** — persistent goal a banker is working toward
- **Activity** — discrete capture action a banker takes
- **Dot** — UI primitive for evidence representation
- **Open thread** — single most-urgent item for a Member
- **Evidence** — captured signal/magnitude/model/reaction/resolution

Retire from banker-facing language (note as code-internal only):
- **Stage** — replaced by *objective* or *activity*
- **Phase** — replaced by *objective*
- **Step** — replaced by *activity*

### R.4 SCOPE.md update

§3 (in scope) and §4 (out of scope): three-modules language updates from "Member profile / Growth Conversations / Insight Engine" to "**v2 Member workstation / Insight Engine**" with v1 noted as legacy-retained. §3.2 fixture targets unchanged.

### R.5 OPEN_QUESTIONS.md updates

Log Q-A1 through Q-A5 from ARCHITECTURE_V2.md §13 as new Open entries:
- Q-A1: Multi-objective evidence support (likely Q-046; verify and update if so)
- Q-A2: Open-thread badge content heuristic for tied urgent items
- Q-A3: Mobile/narrow-viewport behavior
- Q-A4: Notification routing v1 vs v2 (Pilot)
- Q-A5: Inquiry-tracks panel data source-of-truth at Pilot scale (likely Q-045; verify and update)

If any Q-A's overlap with already-logged Q-NNN entries, cross-reference rather than duplicate.

### R.6 Acceptance criteria for Block R

- [ ] BUILD_LOG entry comprehensive across both turns
- [ ] BLAZE_STYLE_GUIDE §15 added; vocabulary table reflects v2 terms
- [ ] CLAUDE.md §5 updated
- [ ] SCOPE.md updated
- [ ] OPEN_QUESTIONS.md has Q-A1..Q-A5 logged (or cross-referenced to existing Q-04x entries)

---

## Turn 2 — Verification + checkpoint

Before reporting Turn 2 complete:

- [ ] All seven activity buttons surface their capture forms
- [ ] + Model captures Model entity with all required fields (incl. With-Member/Banker-draft)
- [ ] + Show captures ShowEvent referencing existing Artifact
- [ ] + Reaction captures Reaction with optional verbatim quote (subject to scan)
- [ ] Tracks-supported panel renders inside Land objective for all three fixtures
- [ ] Captured feed renders all six card variants with correct typography
- [ ] Empty-state nudge displays at bottom of feed
- [ ] "show ?" affordance expands to coaching content reorganized by objective
- [ ] Member fixture seed includes 5-7 enriched quotes per Member
- [ ] All v2 banker-prose fields fire compliance scan
- [ ] BUILD_LOG, BLAZE_STYLE_GUIDE, CLAUDE.md, SCOPE.md, OPEN_QUESTIONS.md updated
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` clean

---

## 14. Pilot deferrals to honor

Sprint 4.7 does not ship:

- Confidence-band threshold algorithms (hand-curated per fixture per Q-044)
- Telemetry-driven keyword calibration (Pilot work per Q-035)
- Multi-objective evidence support beyond simple primary mapping (Q-046; v2 phase 2)
- Rich popup detail panels (basic inline expansion only; phase 2)
- Mobile/narrow-viewport optimization (Q-A3; Pilot)
- Insight Engine v2 (Sprint 5)
- Per-Member objective customization (Q-048; v2 phase 2 / Pilot)
- Coach surface content authoring at scale (Q-047; reuse v1's 18 paragraphs for phase 1)

If a question arises during 4.7 that touches these areas, log to OPEN_QUESTIONS.md and proceed conservatively.

---

## 15. Reporting back

When Sprint 4.7 is complete (after both turns), report back with:

1. Confirmation that Blocks A–R shipped per acceptance criteria
2. Screenshots of:
   - `/v2/members/jenny` with full workstation rendered
   - `/v2/members/northland` and `/v2/members/cygnus` for fixture variation
   - + Model capture form open
   - + Reaction capture form open with compliance scan firing on a test phrase
   - Tracks-supported panel inside Land objective
   - Captured feed showing all six card variants
   - "show ?" expanded coaching content
   - Cross-link from v1 → v2 → v1
3. Schema migration log: which entities created
4. Any deviations from the spec (with rationale)
5. Any new questions logged to OPEN_QUESTIONS.md
6. Any acceptance-criteria items that proved infeasible (with explanation)
7. Member fixture seed quote drafts for Francisco's editorial review

Visual review will probe each block independently; both turns ship as separate checkpoints.

---

## 16. Estimated scope

- Turn 1 (Foundation): 3-4 effective CC days
- Turn 2 (Content): 2-3 effective CC days
- **Total: 5-7 effective CC days** per DEMO_BUILD_PLAN_v3_AMENDMENTS.md §4.3

If either turn threatens to exceed budget (e.g., schema migration takes longer than expected, capture form integration surfaces unexpected coupling), **stop and re-scope with Francisco** before continuing. Sprint 4.7 must not block Sprint 5 (Insight Engine), which is the cross-cutting destination for the EVP demo.

---

## 17. Resolved decisions (formerly open questions)

The original draft of this prompt flagged 8 open questions for Francisco. All resolved 2026-04-29 and baked into the relevant block sections. Recorded here for change-history traceability:

| ID | Decision |
|---|---|
| Q-D1 (sticky dialpad) | Sticky positioning, ~36px tight height. Pill-style buttons. *(Block D.3)* |
| Q-H1 (banner placement) | Below header, above key facts strip — header establishes Member identity without anything above it. *(Block E.1)* |
| Q-L1 (Quantify vs Size) | No rename. Schema entity stays `SizingMeasurement`; banker-facing label is "Quantify". Two-layer vocabulary discipline documented in ARCHITECTURE_V2 §11.7. *(Block D.3 + ARCHITECTURE_V2 §11.7)* |
| Q-M1 (Tracks-supported data) | CC drafts in Turn 2 with FIXME annotations; Francisco reviews. *(Block M.4)* |
| Q-O1 (coach mapping) | Route by **captured signal type**, not stage label. Trigger → Land; Goal/Blocker/Indecision → Understand; Size → Understand; Show → Consult; Resolve → Consult; Lifecycle → Formalize. *(Block O.1)* |
| Q-P1 (member quotes) | Francisco authors `MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md` (30 quotes, 10 per Member); CC selects strongest 5-7 per Member for seed. *(Block P.1)* |
| Q-R3 (vocabulary retirement) | Banker-facing only. Schema identifiers persist. Translation layer in `lib/enum-descriptions.ts` and v2 component files. *(Block R.3 + ARCHITECTURE_V2 §11.7)* |
| Q-X1 (feature flag default) | Opt-in via `?v2=true` during build. Revisit at Sprint 6 for EVP demo deployment. *(Block A.2)* |

Other confirmations:
- Capture surface: **right-drawer** (not modal). *(Block D.3)*
- Block Q (audit-extended scan integration to Ask + Size sections from Sprint 4.6 deferral) bundled into Turn 2.
- Block M compliance-careful copy: verbatim per ARCHITECTURE_V2 §10.2 / COMPLIANCE.md §10.2; non-negotiable.

---

**End of Sprint 4.7 prompt — EXECUTABLE.**
