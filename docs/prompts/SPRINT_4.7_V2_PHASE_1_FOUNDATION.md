# Sprint 4.7 — V2 Phase 1: Foundation

**Prompt for Claude Code. Single checkpoint. Ships the v2 Member workstation foundation: new route, page collapse, layout primitives, dot system, Objective entity. Estimated 3-4 effective build days. This is the largest single prompt in the build; plan accordingly. After this lands, Sprint 4.7 phase 2 ships the capture flows, inquiry-tracks panel, confidence-bands, and content enrichment.**

## Pre-flight context for CC

Sprint 4.6 + the Withdrawn/Introduced patch shipped clean. The v1 surfaces are in their final demo state. Sprint 4.7 phase 1 is where v2 begins.

**The path:** v2 lives at `/v2/members/[id]` as a parallel route to v1. v1 stays live indefinitely for cohabitation. Bankers opt into v2 via a feature flag. The EVP demo flows naturally between v1 and v2; v2 is the primary demo surface.

**Read these governance documents before starting any block** (in order):

1. `ARCHITECTURE_V2.md` — canonical v2 reference. Sections 2 (two-layer model), 3 (dot system), 4 (Pattern A layout), 7 (page collapse), 8 (clean-room architecture), 9 (coach surface), 11 (schema changes), 12 (v1 retention/retirement) are most directly relevant to phase 1.
2. `EVIDENCE_FRAMEWORK.md` — the 20 evidence types catalog. Phase 1 doesn't ship the full content rendering, but the dot counts per objective derive from this framework.
3. `BLAZE_STYLE_GUIDE.md` — typography hierarchy, color tokens, spacing scale. v2 maintains strict compliance with the existing design system. Pay particular attention to the recently extended §14.5 terminal vocabulary.
4. `COMPLIANCE.md` §10 — the three banker-facing posture commitments. v2 inherits all of these from Sprint 4.6's compliance floor (disclaimer banner, helper text, submit-time scan, capture discipline callout).

If any of these documents are not available at their expected paths, **stop and surface to Francisco** rather than proceeding from inference.

**Architecture authority:** When ARCHITECTURE_V2.md and other governance docs disagree on a v2-specific question, ARCHITECTURE_V2.md wins. When ARCHITECTURE_V2.md and BLAZE_STYLE_GUIDE.md disagree on visual treatment, BLAZE_STYLE_GUIDE.md wins (it predates v2 and v2 inherits from it).

## What ships in this sprint (phase 1)

Six blocks plus governance updates. All part of one checkpoint. Plan the diff structure so each block is delimited and visual review can probe each independently.

- **Block A — Route, feature flag, and v1 cohabitation.** New `/v2/members/[id]` route alongside existing pages; feature-flag toggle; cross-linking between v1 and v2.
- **Block B — Schema additions.** `Objective` entity, evidence-mapping derivation logic, no breaking changes to existing v1 entities.
- **Block C — Folder structure and component organization.** Hybrid `/components/v2/` pattern per ARCHITECTURE_V2 §7.
- **Block D — Page layout primitives.** Header strip, key facts strip, activity dialpad, sidebar with four objectives + artifact + macro + history slots, captured feed scaffold.
- **Block E — Dot system component.** Four-state dot primitive (Captured / Suggested / Not yet / Open thread) with click-to-open semantics scaffolded.
- **Block F — Compliance-floor reuse.** Sprint 4.6 components (disclaimer banner, capture discipline callout) mounted on v2 routes.

Phase 1 explicitly does **not** ship: capture forms wired to the dialpad, inquiry-tracks panel, confidence-bands, content rendering of capture cards, member fixture quote enrichment, the "show ?" coach surface content. All of these are phase 2 work.

---

## Block A — Route, feature flag, and v1 cohabitation

### A.1 Routes

Create new route at `app/v2/members/[id]/page.tsx`. This is a Next.js 16 route group at `app/v2/`. The route group does not modify URL paths beyond what the file structure implies — the URL is `/v2/members/{id}`, parallel to existing `/members/{id}`.

Existing v1 routes (`app/members/[id]/page.tsx`, `app/growth-conversations/page.tsx`, `app/growth-conversations/[memberId]/page.tsx`) **stay live**. Do not delete or deprecate them in this sprint.

### A.2 Feature flag

Add a feature-flag mechanism for opting bankers into v2. Implementation pattern:

- A `lib/feature-flags.ts` module that exports `isV2Enabled(banker?: Banker | null): boolean`
- Feature flag persists per-banker via localStorage (banker preference) OR via query string (`?v2=true`) for ad-hoc demo use
- Default state: v2 disabled for all bankers in seed data
- A toggle UI affordance on existing v1 pages (e.g., a small "Try the new view →" link in the header or settings menu)
- Symmetric "Classic view ↗" link on v2 pages

For demo/EVP use, document how to enable v2 via query string in BUILD_LOG.md so Francisco can demo flexibly.

### A.3 V1 ↔ V2 cross-linking

When v2 is enabled for a banker:
- v1 routes show a "Try the new view →" link in their header (top-right area is fine)
- v2 routes show a "Classic view ↗" link in equivalent position

Cross-linking preserves the Member context — clicking from `/v2/members/{id}` goes to `/members/{id}`, not to a list page.

### A.4 Acceptance criteria for Block A

- [ ] `/v2/members/[id]` route resolves and renders (even if mostly placeholder content from this phase)
- [ ] Feature flag mechanism works via both localStorage and query string
- [ ] Cross-linking works in both directions, preserving Member context
- [ ] No v1 routes were modified or deleted
- [ ] Visiting `/v2/members/[id]` without v2 enabled either redirects to v1 OR renders with a notice (CC's choice; document the behavior)

---

## Block B — Schema additions

### B.1 New `Objective` entity

Add to `prisma/schema.prisma`:

```prisma
model Objective {
  id              String        @id @default(cuid())
  member_id       String
  member          Member        @relation(fields: [member_id], references: [id])
  type            ObjectiveType
  display_order   Int           // for sidebar rendering order
  created_at      DateTime      @default(now())

  // Optional cached snapshot for performance; recomputed on capture changes
  cached_evidence_count        Int?
  cached_last_evidence_at      DateTime?

  @@unique([member_id, type])
  @@index([member_id])
}

enum ObjectiveType {
  IDENTIFY_PRODUCT_FIT
  UNDERSTAND
  CONSULT
  FORMALIZE
}
```

Each Member gets exactly four `Objective` records — one per `ObjectiveType` — created when the Member is created (or backfilled in migration).

### B.2 Evidence-mapping derivation

The objectives layer is a *projection over* the existing v1 entities (Signal, SizingMeasurement, Recommendation, Artifact, ActionCard, GrowthStepExecution), not a duplicate store. Derive evidence per objective using the catalog in EVIDENCE_FRAMEWORK.md.

Add `lib/objective-evidence.ts` module that exports:

```typescript
type ObjectiveEvidenceType =
  // Identify (Land on product fit)
  | "macro_match"
  | "trigger_signal"
  | "recommendation_candidate"
  | "cohort_track_support"
  // Understand
  | "goal_signal"
  | "blocker_signal"
  | "indecision_signal"
  | "sized_magnitude"
  | "methodology_note"
  | "stale_signal_refresh"
  // Consult
  | "model_produced"
  | "model_shown"
  | "member_reaction"
  | "surfaced_concern"
  | "decision_posture"
  | "primary_concern_or_decline_reason"
  // Formalize
  | "specialist_handoff_initiated"
  | "application_initiated"
  | "actioncard_for_next_step"
  | "decision_finalized";

type ObjectiveEvidence = {
  type: ObjectiveEvidenceType;
  status: "captured" | "suggested" | "not_yet" | "open_thread";
  source_entity_type?: string;       // e.g., "Signal", "SizingMeasurement"
  source_entity_id?: string;
  captured_at?: Date;
  is_stale?: boolean;
  highlight?: string;                // one-line summary for sidebar display
};

function deriveEvidenceForObjective(
  member: Member,
  objectiveType: ObjectiveType,
  // dependencies passed in: signals, sizing measurements, recommendations, artifacts, action cards, etc.
): ObjectiveEvidence[];
```

The derivation logic interrogates v1 entities and returns the evidence array. This is the function that powers the dot rendering — each `ObjectiveEvidence` becomes one dot in the sidebar.

For phase 1, the derivation can be conservative: return `captured` for evidence types where the corresponding v1 entity exists, `suggested` or `not_yet` for missing evidence types per heuristic. Phase 2 enriches with sophisticated suggested-vs-not-yet logic.

### B.3 Migration

New Prisma migration that:
1. Adds the `Objective` table and `ObjectiveType` enum
2. Backfills four `Objective` records per existing Member in seed data
3. Adds appropriate indexes

If the seed-data backfill is awkward in pure SQL, extract to a TypeScript seed script.

### B.4 No breaking changes to v1

Existing v1 entities (Signal, SizingMeasurement, Recommendation, Artifact, ArtifactParameterCapture, ActionCard, GrowthStepExecution, Macro, MemberSummarySnapshot) remain untouched. The `Objective` entity adds new capability without modifying existing ones.

`ComplianceScanEvent` from Sprint 4.6 also remains untouched.

### B.5 Acceptance criteria for Block B

- [ ] `Objective` entity defined in schema with `ObjectiveType` enum
- [ ] Migration applies cleanly; backfills four objectives per Member
- [ ] `lib/objective-evidence.ts` exports the derivation function
- [ ] Three Member fixtures (Jenny, Northland, Cygnus) each have four Objective records after seed
- [ ] No v1 entities modified; v1 routes still function identically
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` succeeds

---

## Block C — Folder structure and component organization

### C.1 Hybrid Option γ structure

Per ARCHITECTURE_V2.md §7 commitment:

```
app/v2/
  members/
    [id]/
      page.tsx                  # v2 Member workstation page (this sprint)
      components/               # page-specific components (use sparingly)
components/v2/                  # v2-specific shared components
  dot-system/                   # Block E lives here
    objective-dot.tsx
    objective-dot-row.tsx
    captured-dot.tsx
  layout/                       # Block D primitives
    page-header.tsx
    key-facts-strip.tsx
    activity-dialpad.tsx
    sidebar.tsx
    captured-feed.tsx
  workstation/                  # higher-level v2 components (phase 2)
components/                     # existing root, used by both v1 and v2
lib/                            # existing root, shared
```

### C.2 What goes where — discipline

- `components/v2/` — components specific to v2 design language (dot system, dialpad, key facts strip, etc.). Reused across v2 surfaces.
- `app/v2/members/[id]/components/` — components specific to *just this page* and not reused elsewhere. Use sparingly; most components belong in `components/v2/`.
- `components/` (root) — genuinely shared primitives that work in both v1 and v2 (existing shadcn primitives, generic UI elements like Button, Input, etc.).
- `lib/` (root) — pure logic, fully shared. Add v2-relevant logic here without subdirectories unless folder gets large.

### C.3 Acceptance criteria for Block C

- [ ] Folder structure created per spec
- [ ] No components placed at incorrect tier (e.g., a v2-specific dot component at root `components/`)
- [ ] Documentation comment at top of each new directory's index file noting its scope (v2-specific vs shared)

---

## Block D — Page layout primitives

This block builds the structural skeleton of the v2 Member workstation. Content rendering (capture cards, key facts data, etc.) is phase 2; phase 1 ships the *primitives* and *empty-state* renders.

### D.1 Page-level structure

The v2 Member page renders in this layout (per ARCHITECTURE_V2.md §4.1):

```
+-------------------------------------------------------------+
|  Header strip (Member name + tagline + open thread badge)    |
+-------------------------------------------------------------+
|  Key facts strip (4-5 hand-curated facts)                    |
+-------------------------------------------------------------+
|  Activity dialpad (7 buttons)                                |
+-------------------------------------------------------------+
|              |                                                |
|  Sidebar:    |   Captured feed (newest first):               |
|  - objectives|                                                |
|  - artifact  |   [phase 2 content]                            |
|  - macro     |                                                |
|  - history   |                                                |
|              |                                                |
+-------------------------------------------------------------+
```

Sidebar fixed width (~200-220px); main panel fills remaining width. Mobile responsive deferred to phase 2.

### D.2 Header strip component

`components/v2/layout/page-header.tsx`:

- Member name (display heading weight, `--blaze-grey-darker`, ~32-40px)
- Tagline: `"{Member Type} · {lifecycle stage} · {primary banker name}"` (smaller, muted, regular weight)
- Right side: open-thread badge in coral when `member_response = leaning_yes` AND `primary_concern` is not null. Empty when no open thread.
- Open-thread badge content: `"{concern label} · {date or follow-up date}"` (e.g., "Joint call · May 12")

Badge is clickable; click handler stub (real handler in phase 2). Use `coral` accent treatment per BLAZE_STYLE_GUIDE — not a new color.

### D.3 Key facts strip component

`components/v2/layout/key-facts-strip.tsx`:

- Horizontal strip of 4-5 facts
- Each fact: magnitude/label in heading weight, descriptor in regular weight, muted
- Visual treatment: lightest coral fill (low opacity) per ARCHITECTURE_V2.md §4.3
- Click handler stub for each fact (real navigation in phase 2)

For phase 1, the strip renders with hand-curated facts per Member fixture. Phase 2 adds the heuristic for fact selection and click-through navigation. For phase 1, hardcode the facts per fixture (Jenny / Northland / Cygnus) directly in seed data or fixture-specific helper:

- **Jenny**: $48K (slow-season gap), $75K (LOC sized), leaning yes (spouse pending), Apr 8 (last touch)
- **Northland**: $180K (fleet expansion), 4 trucks (current fleet), engaged (early stage), Apr 12 (last touch)
- **Cygnus**: $2.4M (CRE acquisition), specialist intro (next step), committed (ready), Apr 15 (last touch)

### D.4 Activity dialpad component

`components/v2/layout/activity-dialpad.tsx`:

Seven pill-style buttons in a row:
- + Ask
- + Quantify
- + Model
- + Show
- + Reaction
- + Resolve
- + Action

Visual treatment: subtle purple tint (use `--blaze-info` or adjacent token from BLAZE_STYLE_GUIDE; do not add new color tokens). Hover state lifts subtly. Active state (capture form open) shows pressed state.

For phase 1, each button has a click handler stub that opens an empty modal/drawer with placeholder text "Capture form for [activity name] coming in phase 2." Phase 2 wires the actual capture forms.

Responsive behavior deferred to phase 2.

### D.5 Sidebar component

`components/v2/layout/sidebar.tsx` containing four sub-components:

**D.5.1 Objectives section**

Heading: "objectives"

Four objectives in order:
- Land on product fit
- Understand
- Consult
- Formalize

For each objective:
- Heading-weight name
- Row of dots (Block E component)
- Single-line highlight (most consequential captured fact for this objective; for phase 1, hand-curated per fixture)
- Coral accent when `member_response = leaning_yes` AND `primary_concern` is not null AND objective is "Consult"

Each objective is clickable (header-level click handler stub).

**D.5.2 Artifact section**

Heading: "artifact"

For phase 1, render the most recent Artifact for this Member (if any). Card with:
- Artifact name + type
- "Shown {date} · view ↗" affordance (click handler stub for popup in phase 2)

If no Artifact exists, render `<empty>` placeholder.

**D.5.3 Macro section**

Heading: "macro"

Compact 3-line card with the most relevant Macro for this Member's Type/Industry. Use existing Macro entity.

For phase 1, hardcode the relevance per fixture or use a simple Member-Type lookup. Phase 2 adds the proper relevance heuristic.

If no Macro is relevant, render `<empty>` placeholder.

**D.5.4 History section**

Heading: "history"

Thin timeline with 3-4 most recent Conversation dates and brief type labels. "history (N) ↗" affordance opens full timeline popup (click handler stub for phase 2).

### D.6 Captured feed component

`components/v2/layout/captured-feed.tsx`:

For phase 1, renders an empty/placeholder state. Phase 2 wires the actual capture cards.

Placeholder state shows:
- Section heading: "captured · most recent first"
- Empty state message: "Begin capturing — activities above"
- Subtle visual treatment

### D.7 Compliance disclaimer banner placement

The disclaimer banner from Sprint 4.6 (`app/_components/compliance-disclaimer-banner.tsx`) appears on `/v2/members/[id]` per the cohabitation discipline:

- Subtle styling, dismissible per session
- Appears above the page header
- Same component as v1; just mounted on the v2 route

### D.8 Acceptance criteria for Block D

- [ ] Header strip renders with Member name, tagline, open-thread badge (where applicable)
- [ ] Key facts strip renders with hand-curated facts per fixture
- [ ] Activity dialpad shows 7 buttons with click handler stubs
- [ ] Sidebar renders with four sections: objectives, artifact, macro, history
- [ ] Captured feed renders empty placeholder state
- [ ] Disclaimer banner appears on v2 route per Sprint 4.6 pattern
- [ ] BLAZE_STYLE_GUIDE typography hierarchy strict compliance (verify with visual review)
- [ ] No new color tokens added; existing tokens reused

---

## Block E — Dot system component

This is the most distinctive v2 visual primitive. Per ARCHITECTURE_V2.md §3.

### E.1 Dot states

Four states per ARCHITECTURE_V2.md §3.2:

| State | Visual | Token |
|---|---|---|
| Captured | Filled, neutral gray | `var(--blaze-grey-dark)` (or equivalent existing token) |
| Suggested | Outlined, medium opacity gray | Existing border-only token + opacity |
| Not yet | Faintest gray, near-invisible | Existing token at low opacity |
| Open thread | Coral ring | `--blaze-warning` or similar coral accent token |

Use existing BLAZE_STYLE_GUIDE color tokens. Do not add new tokens. If a token doesn't exist for an exact target, use the closest match and document the choice.

### E.2 Dot component

`components/v2/dot-system/objective-dot.tsx`:

```typescript
type DotState = "captured" | "suggested" | "not_yet" | "open_thread";

type ObjectiveDotProps = {
  state: DotState;
  evidence?: ObjectiveEvidence;
  onClick?: () => void;
  ariaLabel?: string;
};
```

Props:
- `state` — one of four
- `evidence` — optional; if provided, click reveals this evidence
- `onClick` — handler stub for phase 1; phase 2 wires the popover
- `ariaLabel` — for accessibility

Visual specs:
- Diameter: ~10-12px (fine-tune to match existing v1 stage progress dots for vocabulary continuity)
- Spacing in row: ~14px center-to-center

### E.3 Dot row component

`components/v2/dot-system/objective-dot-row.tsx`:

Renders a row of dots for an Objective. Takes:
- `objective` — the Objective entity
- `evidence` — array of `ObjectiveEvidence` for this objective
- Renders one dot per evidence type

The dot count is determined by the evidence types catalog (per EVIDENCE_FRAMEWORK.md). For phase 1, the count per objective is approximately:
- Land on product fit: 3-4 dots
- Understand: 5-7 dots
- Consult: 4-6 dots
- Formalize: 2-3 dots

Phase 1 derives dot states conservatively (most are "not yet" or "suggested" until phase 2 wires the real rendering). Hand-curate the demo state per fixture so the visual review can validate the dot vocabulary.

### E.4 Demo state per fixture (phase 1)

For visual review, hand-curate dot states per Member fixture:

**Jenny's Catering:**
- Identify: 3 dots (all captured) — Macro match, trigger, recommendation candidate
- Understand: 5 dots (4 captured + 1 suggested) — Goal, Blocker (recent), Blocker (older), sized magnitude, methodology suggested
- Consult: 4 dots (3 captured + 1 open thread) — model produced, model shown, member reaction, decision posture (open thread coral ring on the 4th dot)
- Formalize: 2 dots (both not yet)

**Northland HVAC:**
- Identify: 3 dots (all captured)
- Understand: 4 dots (3 captured + 1 suggested)
- Consult: 3 dots (2 captured + 1 suggested)
- Formalize: 2 dots (both not yet)

**Cygnus Bioscience:**
- Identify: 4 dots (all captured) — including cohort track support
- Understand: 6 dots (5 captured + 1 suggested)
- Consult: 5 dots (4 captured + 1 captured)
- Formalize: 3 dots (1 captured "specialist handoff initiated" + 2 suggested)

These are illustrative; CC may adjust slightly based on what the actual fixture data supports. The point is to demonstrate all four dot states in the demo.

### E.5 Acceptance criteria for Block E

- [ ] Four dot states render distinguishably; visual review can identify each
- [ ] Click handler stub fires per dot (phase 2 wires real behavior)
- [ ] Each Member fixture renders the hand-curated dot state from E.4
- [ ] Dot vocabulary matches existing v1 stage progress dots in size/spacing for continuity
- [ ] No new color tokens added

---

## Block F — Compliance-floor reuse

Sprint 4.6 components mount on v2 routes per ARCHITECTURE_V2.md §6.

### F.1 Disclaimer banner

`app/_components/compliance-disclaimer-banner.tsx` mounts on `/v2/members/[id]`. Same per-session sessionStorage gating; same dismissible behavior.

### F.2 Capture discipline callout

`app/_components/capture-discipline-callout.tsx` accessible from v2 page footer. Same content; same behavior.

### F.3 Helper text and submit-time scan

These live on capture forms, not on the page itself. Phase 2 wires the capture forms; phase 2 inherits the helper text and submit-time scan from Sprint 4.6 patterns. Phase 1 does not need to wire these.

### F.4 Acceptance criteria for Block F

- [ ] Disclaimer banner appears on v2 route on first session visit
- [ ] Capture discipline callout accessible from v2 route footer
- [ ] No regression in Sprint 4.6 compliance components on v1 routes

---

## Governance updates

After Blocks A-F ship and visual review confirms acceptance:

1. **BUILD_LOG.md entry** — Sprint 4.7 phase 1 entry covering:
   - What shipped per block
   - Decisions made during implementation (e.g., feature flag mechanism choice, derivation logic shape)
   - Lessons recorded
   - Cross-references to ARCHITECTURE_V2.md and EVIDENCE_FRAMEWORK.md

2. **No OPEN_QUESTIONS amendments expected.** If implementation surfaces new questions, log them per the existing pattern.

3. **CLAUDE.md manifest update** — note the new `app/v2/` route, `components/v2/` folder, and `lib/objective-evidence.ts` so future sessions can orient.

---

## Pilot deferrals to honor

Sprint 4.7 phase 1 does not ship:

- Capture forms wired to the dialpad (phase 2)
- Inquiry-tracks panel content (phase 2)
- Confidence-bands "Tracks supported by current evidence" (phase 2)
- Capture cards in feed (phase 2)
- "Show ?" coach surface content (phase 2)
- Member fixture quote enrichment (phase 2; quotes will be authored separately and delivered to CC)
- Multi-objective evidence support per capture (Pilot)
- Cross-Member portfolio view in Pattern A geometry (Sprint 5)
- Mobile responsive (Pilot or post-EVP polish)
- Rich popup detail panels (phase 2)

If a question arises during phase 1 implementation that touches these areas, log to OPEN_QUESTIONS.md and proceed conservatively.

---

## Reporting back

When Sprint 4.7 phase 1 is complete, report back with:

1. Confirmation that Blocks A-F shipped per acceptance criteria
2. Screenshots (or HTML probes if browser unavailable) of:
   - `/v2/members/[id]` for Jenny — full page render
   - `/v2/members/[id]` for Cygnus — full page render
   - Sidebar with all four objectives and their dot rows
   - Activity dialpad with all 7 buttons
   - Disclaimer banner first visit
   - Capture discipline callout
3. Migration log: schema changes applied, seed-data backfill verified
4. Feature flag toggle: instructions for enabling v2 (URL parameter or banker setting)
5. V1 ↔ V2 cross-linking: verification that both directions work
6. Any deviations from the spec (with rationale)
7. Any new questions logged to OPEN_QUESTIONS.md
8. Any acceptance-criteria items that proved infeasible (with explanation)

Visual review will probe each block independently. Plan the diff structure so each block is a delimited section in the change log.

---

## Estimated scope

3-4 effective build days. This is the largest single prompt in the build.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Phase 1 must land cleanly so phase 2 has a stable foundation to build on. Better to defer questionable scope to phase 2 than to risk a fragile phase 1.

If you encounter any architectural ambiguity during implementation that ARCHITECTURE_V2.md doesn't resolve, surface it rather than deciding heuristically. The architectural commitments in v2 are deliberate; deviations cascade.

After this lands, Sprint 4.7 phase 2 ships the capture flows, inquiry-tracks panel, confidence-bands, capture cards in feed, fixture quote enrichment, and coach surface content.
