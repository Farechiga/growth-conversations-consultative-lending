# Sprint 5b.2 — Portfolio Surfaces, Re-capture Handling, Coach Refinement

**Prompt for Claude Code. Single checkpoint. Ships the Insight Engine portfolio surfaces, the re-capture-vs-new-record handling pattern, and refined Coach content. Estimated 4-5 effective build days CC time + ~3-4 hours Francisco editorial pass on Coach content. Three phases: portfolio surfaces, re-capture handling, Coach refinement.**

## Pre-flight context

Sprint 5b.1 + mini-patch confirmed: directional architecture works. Three CTA layers (missing evidence, threshold-uplift, specialist handoff). Insight architecture (canonical Patterns + banker-authored Insights with LLM matching). Surface polish (staleness, lightbulb, Implications footer, Treatment A nesting). Visual review surfaced no further surface defects after the eight-patch round.

Sprint 5b.2 brings the workstation to portfolio scale. Senior lenders and bankers have needed cross-Member views to do their jobs at portfolio scale. This sprint ships four portfolio surfaces driven by capture-density and workflow-state axes, plus resolves the re-capture-vs-new-record architectural question that surfaced during Sprint 5b.1 visual review, plus refines Coach content for Member-Type specificity.

Three architectural commitments locked through prior design conversation:

- **No strength labels at any scale.** Per-Member surfaces and portfolio surfaces both avoid "moderate/strong/insufficient" tier labels. Portfolio aggregations use capture density, open-thread counts, staleness, last touch, ActionCard status, specialist handoff status.
- **Re-capture updates existing record by timestamp.** When same Signal-type or factor is captured at later date with same value, update existing record's timestamp. New record only if value differs.
- **Coach + Insights coexist with distinct axes.** Coach is Member-Type-keyed consultative orientation; Insights are Track-keyed canonical patterns. Both surfaces persist; Coach content gets refinement pass for Member-Type specificity.

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` (at repo root)
2. `INSIGHT_PATTERN_LIBRARY_v1.md` (at repo root)
3. `ARCHITECTURE_V2.md` §3, §11
4. `EVIDENCE_FRAMEWORK.md`
5. `COMPLIANCE.md` §10.2 — banned phrases continue to apply at portfolio surfaces
6. `lib/stage-guidance.ts` — current MEMBER_TYPE_GUIDANCE; Coach refinement will replace this content
7. `lib/cta-derivation.ts` — Sprint 5b.1's CTA derivation function; portfolio surfaces may use similar layered derivation patterns

If any document is missing or outdated, stop and surface to Francisco rather than proceeding from inference.

**Architecture authority:** ARCHITECTURE_V2.md wins for objective architecture; portfolio surfaces must honor existing schema entities; COMPLIANCE.md §10.2 wins for banker-facing copy.

## What ships in this sprint (5b.2)

Eight blocks across three phases. Single checkpoint, delimited diffs.

**Phase 1 — Portfolio surfaces:**
- **Block A — Schema additions.** Minimal schema for portfolio query support.
- **Block B — Track Performance surface.** Per-Track aggregate view by capture density and workflow state.
- **Block C — Member portfolio surface.** Banker roster filtered/sorted by workflow axes.
- **Block D — Coverage and indecision surface.** Open threads visible at portfolio scale.
- **Block E — Stage-skip surface.** Members with later-objective evidence captured without earlier-objective evidence.

**Phase 2 — Re-capture handling:**
- **Block F — Update-timestamp-on-recapture pattern.** Centralized recapture detection across capture entities. New record only if value differs.

**Phase 3 — Coach refinement:**
- **Block G — Member-Type guidance content refresh.** Refined MEMBER_TYPE_GUIDANCE content (authored by Francisco) integrated into Coach surface.
- **Block H — Governance updates.** BUILD_LOG, OPEN_QUESTIONS, CLAUDE.md.

Sprint 5b.2 explicitly does NOT ship: full RBAC permission model (banker vs senior lender views simulated for demo); Insight Engine novel review surface (Pilot); make-canonical promotion affordance (Pilot); per-banker insight activity coaching analytics (Pilot); cross-Member novel-Insight LLM discovery (Pilot); date-arithmetic operators in evaluator (Pilot).

---

## Block A — Schema additions

### A.1 Minimal additions

Most portfolio queries can be served from existing entities (Member, FactorCapture, Signal, Insight, Reaction, ActionCard, SpecialistHandoff). Two minimal schema additions needed:

**MemberWorkflowState** — denormalized workflow signals per Member, recomputed on relevant writes. Materialized for portfolio query performance.

```prisma
model MemberWorkflowState {
  id                                 String   @id @default(cuid())
  member_id                          String   @unique
  member                             Member   @relation(fields: [member_id], references: [id])
  
  total_captures                     Int      @default(0)
  factor_captures_count              Int      @default(0)
  signals_count                      Int      @default(0)
  insights_count                     Int      @default(0)
  reactions_count                    Int      @default(0)
  
  open_thread_count                  Int      @default(0)
  stale_capture_count                Int      @default(0)
  
  last_touch_at                      DateTime?
  
  current_track_id                   String?
  pending_action_card_count          Int      @default(0)
  pending_specialist_handoff_count   Int      @default(0)
  
  recomputed_at                      DateTime @default(now())
  
  @@index([member_id])
  @@index([last_touch_at])
  @@index([current_track_id])
}
```

Workflow state recomputes on:
- New FactorCapture / Signal / Insight / Reaction created
- ActionCard status change
- SpecialistHandoff status change
- Any capture timestamp updated (re-capture path from Block F)

Recomputation function in `lib/workflow-state.ts`. Called from server actions that modify capture data. Pattern: similar to track-ranker re-execution from Sprint 5a.2 Block G.

### A.2 Acceptance criteria

- [ ] MemberWorkflowState entity defined; migration applies cleanly
- [ ] `lib/workflow-state.ts` exports `recomputeWorkflowState(memberId)` 
- [ ] All capture-modifying server actions trigger workflow state recomputation
- [ ] Initial seed populates workflow state for all fixtures
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — Track Performance surface

### B.1 Surface purpose

Per-Track aggregate view across all bankers' Members. Senior lender or banker uses this surface to understand: across the portfolio, how are Members distributed against this Track's required evidence and workflow state?

### B.2 Route and access

New route `/v2/insight-engine/tracks` rendering Track Performance surface. Accessible from main navigation (add nav entry). For demo, all bankers see all Tracks; Pilot adds RBAC for banker-vs-senior-lender scope.

### B.3 Surface layout

For each Track in the portfolio (5 Tracks for demo):

**Track header:**
- Track name (using "Lending product" terminology per Sprint 5b.1 mini-patch)
- Total Member count where this Track has any captured evidence
- Last activity timestamp across all Members for this Track

**Workflow state distribution (no strength labels):**
- Member count by capture density tier: Members with 0-2 captures, 3-6 captures, 7+ captures
- Member count by workflow state: Members with pending ActionCards, Members with stale captures, Members with open threads
- Member count by specialist handoff state (where Track requires specialist): initiated / specialist_engaged / closed

**Member list (collapsible):**
- Each row: Member name + Member-Type + capture count + last touch + open thread count + pending ActionCard count
- Sortable by any column
- Filterable by capture density, last touch range, open-thread presence, ActionCard status
- Click Member row → navigates to Member's growth conversation page

### B.4 Query implementation

Server-side aggregation query against MemberWorkflowState + capture entities. Pattern:

```typescript
async function trackPerformanceData(track_id: string) {
  const members = await db.member.findMany({
    where: {
      // Members with any captures referencing this Track
      OR: [
        { factor_captures: { some: { track_id } } },
        { signals: { some: { track_id } } },
        { insights: { some: { track_id } } },
      ]
    },
    include: { workflow_state: true }
  });
  
  return {
    members,
    aggregates: {
      total_count: members.length,
      capture_density: {
        low: members.filter(m => m.workflow_state.total_captures <= 2).length,
        medium: members.filter(m => m.workflow_state.total_captures >= 3 && m.workflow_state.total_captures <= 6).length,
        high: members.filter(m => m.workflow_state.total_captures >= 7).length,
      },
      pending_action_cards: members.filter(m => m.workflow_state.pending_action_card_count > 0).length,
      stale_captures: members.filter(m => m.workflow_state.stale_capture_count > 0).length,
      open_threads: members.filter(m => m.workflow_state.open_thread_count > 0).length,
    }
  };
}
```

### B.5 Acceptance criteria

- [ ] `/v2/insight-engine/tracks` route renders Track Performance surface
- [ ] All 5 Tracks display with aggregate counts
- [ ] Member list sortable and filterable per spec
- [ ] No strength tier labels rendered anywhere
- [ ] Click Member row navigates to growth conversation page
- [ ] No regression to existing routes

---

## Block C — Member portfolio surface

### C.1 Surface purpose

Banker's roster view. Banker uses this surface to orient: which of my Members need attention, what's pending, what's stale, what conversations are scheduled.

### C.2 Route and access

New route `/v2/insight-engine/portfolio` rendering Member portfolio surface. Demo: shows all Members assigned to current banker (Scott). Pilot: real banker-roster scoping via RBAC.

### C.3 Surface layout

**Header summary:**
- Total Member count in roster
- Members touched in last 30 days
- Members with pending ActionCards
- Members with stale captures (>90 days)
- Members with open threads

**Member cards or rows:**
Each Member rendered with:
- Member name + Member-Type
- Current Track name (where set)
- Last touch (precise day count: "12d ago" / "47d ago" / "184d ago")
- Capture count breakdown: Signals / Insights / Reactions
- Pending ActionCard count
- Open-thread count (Indecisions without subsequent Reaction)
- Specialist handoff state (where applicable)

**Filtering:**
- By Member-Type
- By current Track
- By last-touch range (<30d / 30-90d / >90d)
- By pending ActionCard presence
- By open-thread presence

**Sorting:**
- Last touch (default; oldest first to surface neglected Members)
- Member name
- Capture count
- Pending ActionCard count

### C.4 Acceptance criteria

- [ ] `/v2/insight-engine/portfolio` route renders Member portfolio
- [ ] Header summary aggregates correct
- [ ] Member rows show all listed fields
- [ ] Filters and sorts work
- [ ] Default sort surfaces oldest-touched Members first
- [ ] Click Member navigates to growth conversation page

---

## Block D — Coverage and indecision surface

### D.1 Surface purpose

Open threads visible at portfolio scale. Banker uses this surface to find: which Members have unresolved Indecisions, how old are they, what's needed to resolve them.

### D.2 Route and access

New route `/v2/insight-engine/coverage` rendering Coverage and indecision surface.

### D.3 Surface layout

**Aggregate summary:**
- Total open thread count across roster
- Distribution: open <30d / 30-90d / >90d
- Indecisions by tag type (timing / pricing / structure / co_decision_maker_input / etc.)

**Open thread list:**
Each open Indecision Signal rendered as a row:
- Member name + Member-Type
- Indecision tag (humanized)
- Member quote (Signal.direct_quote, italicized)
- Captured date (precise day count: "captured 47d ago")
- Current Track context
- Days since last touch on this Member
- Click row → navigates to Member's growth conversation page, scrolled to the Indecision Signal

**Sorting:**
- Days open (default; longest first)
- Member name
- Indecision tag

**Filtering:**
- By Member-Type
- By Indecision tag
- By days-open range

### D.4 Open thread detection

Reuses Sprint 5b.1 Block G heuristic: Indecision Signal is "open" if no subsequent Reaction exists for the same Member after the Indecision's captured_at timestamp. Where ActionCard.status (verified in Sprint 5b.1 Block C.2) is `completed` and references the Member's Track, treat as resolved (Pilot extension; demo defers).

### D.5 Acceptance criteria

- [ ] `/v2/insight-engine/coverage` route renders Coverage surface
- [ ] Aggregate summary correct
- [ ] Open thread rows show all fields
- [ ] Default sort surfaces longest-open threads first
- [ ] Click navigates to Member page positioned at Indecision Signal
- [ ] Open-thread detection matches Sprint 5b.1 heuristic

---

## Block E — Stage-skip surface

### E.1 Surface purpose

Members with later-objective evidence captured without earlier-objective evidence. Senior lender uses this surface for coaching: bankers who skip Discover/Measure work and jump to Consult/Navigate may be missing consultative depth.

### E.2 Route and access

New route `/v2/insight-engine/stage-skip` rendering Stage-skip surface.

### E.3 Stage-skip detection

Per Member, per current Track, evaluate evidence completeness across the four objectives in order: Discover → Measure → Consult → Navigate. A Member is "stage-skipping" if:

- Has any captured evidence at Consult or Navigate (Model produced, Reaction captured, ActionCard pending, etc.)
- AND has incomplete required evidence at Discover or Measure (per Track template's required_evidence_per_objective)

Severity: count of objectives skipped. Member with Consult evidence but missing both Discover and Measure required evidence is more severely stage-skipping than Member with Navigate evidence but only missing Measure.

### E.4 Surface layout

**Aggregate summary:**
- Total stage-skipping Member count
- Distribution by severity: 1 objective skipped / 2 / 3
- Distribution by which objectives skipped (Discover skipped / Measure skipped / both)

**Stage-skip list:**
Each Member rendered as a row:
- Member name + Member-Type
- Current Track
- Skipped objectives indicator: "Missing Discover + Measure" / "Missing Measure" etc.
- Most-recent later-objective evidence captured (timestamp + activity)
- Click row → navigates to Member growth conversation page

**Sorting:**
- Severity (default; most-severe first)
- Member name
- Last touch

### E.5 Acceptance criteria

- [ ] `/v2/insight-engine/stage-skip` route renders Stage-skip surface
- [ ] Stage-skip detection logic matches spec
- [ ] Aggregate summary correct
- [ ] Member rows show all fields
- [ ] Default sort surfaces most-severe first

---

## Block F — Update-timestamp-on-recapture pattern

### F.1 Pattern spec

When a banker re-captures information that already exists for a Member, update the existing record's timestamp rather than creating a duplicate. Create a new record only if the captured value differs from the existing.

Applies to:
- **Signal:** same signal_type + same direct_quote (or same factor_tag if tag-driven) → update captured_at; create new only if quote/tag differs
- **FactorCapture:** same factor_id + same numerical/boolean/qualitative value → update captured_at; create new only if value differs
- **Reaction:** same response_value for same Member → update captured_at; create new only if response_value differs
- **ShowEvent:** Sprint 5b.1 Patch 7 already implemented this pattern; confirm consistent

### F.2 Recapture detection function

Implement `lib/recapture-detection.ts` exporting:

```typescript
type RecaptureResult<T> =
  | { kind: 'updated'; record: T }
  | { kind: 'created'; record: T };

async function captureOrUpdate<T>(args: {
  entity: 'signal' | 'factor_capture' | 'reaction';
  member_id: string;
  match_predicate: Record<string, any>;  // fields that determine identity
  value_predicate: Record<string, any>;  // fields whose change triggers new record
  capture_data: Record<string, any>;
}): Promise<RecaptureResult<T>>
```

Logic:
1. Find existing records matching `match_predicate` for this Member
2. If none exist: create new record with `capture_data`
3. If one exists with value matching `value_predicate`: update its `captured_at` to now; return as `updated`
4. If one exists with different value: create new record with `capture_data` and supersede the prior one (mark prior as superseded via timestamp comparison; queries use newest-by-captured_at)

### F.3 Server action integration

Update existing server actions to use `captureOrUpdate`:
- `saveAskCaptures` (Signal capture)
- `saveFactorCapture` (FactorCapture capture)
- `saveReaction` (Reaction capture)

ShowEvent server action from Sprint 5b.1 Patch 7 stays as is (already implements the pattern).

### F.4 Workflow state recomputation

When recapture results in `updated` (timestamp-only change), workflow state recomputation still fires (last_touch_at updates). When result is `created`, full recomputation fires.

### F.5 Acceptance criteria

- [ ] `lib/recapture-detection.ts` exports `captureOrUpdate`
- [ ] Server actions for Signal / FactorCapture / Reaction use the function
- [ ] Re-capturing same value updates existing record's timestamp (no duplicate)
- [ ] Capturing different value creates new record
- [ ] Workflow state recomputes correctly in both cases

---

## Block G — Coach refinement

### G.1 Source content

`docs/MEMBER_TYPE_GUIDANCE_v2.md` (will be authored by Francisco before Sprint 5b.2 starts; not yet at repo root). Refined Member-Type-specific consultative content authored to Path B discipline: genuinely Member-Type-specific operational practice (not generic consultation that happens to be tagged); careful to not duplicate Pattern-shape content.

If the file isn't present at sprint start, **stop and surface to Francisco**.

### G.2 Coach surface integration

`lib/stage-guidance.ts` MEMBER_TYPE_GUIDANCE constants get replaced with content from `MEMBER_TYPE_GUIDANCE_v2.md`. Coach surface rendering in sidebar continues per Sprint 5a.3 structure; only content changes.

### G.3 Acceptance criteria

- [ ] `MEMBER_TYPE_GUIDANCE_v2.md` present at repo root
- [ ] `lib/stage-guidance.ts` MEMBER_TYPE_GUIDANCE constants updated with v2 content
- [ ] Coach surface renders refined content for all three Member-Types
- [ ] No regression to Coach surface structure (per-objective sections, bullets, CTAs)
- [ ] No banned phrases per COMPLIANCE.md §10.2

---

## Block H — Governance updates

### H.1 BUILD_LOG.md entry

Sprint 5b.2 entry covering:
- What shipped per block
- Portfolio surface architecture (capture-density and workflow-state axes; no strength labels at any scale)
- MemberWorkflowState materialization pattern
- Recapture detection pattern (update-timestamp; new-record-on-value-difference)
- Coach refinement scope (Path B editorial pass; v2 content)
- Cross-references to architectural commitments locked through design conversation

### H.2 OPEN_QUESTIONS amendments

- Q-A2 (open-thread tiebreaker) → fully resolved by Block D Coverage and indecision surface
- Add Q-C1: "Portfolio surface RBAC: demo simulates banker vs senior lender via Scott in dual role; Pilot needs real role-based scoping."
- Add Q-C2: "Recapture pattern when value differs: current implementation creates new record and supersedes prior. Pilot may want richer audit trail (preserve all captures with timestamps; query newest)."

### H.3 Architectural notes for Pilot (continuing 1-8 from Sprint 5b.1)

Add:
- **Note 9 — Portfolio surface RBAC.** Demo simulates with all-bankers-see-all; Pilot needs real role-based scoping. MemberWorkflowState entity supports this; access patterns need to filter by banker_id.
- **Note 10 — Workflow state materialization.** Materialized denormalized state recomputed on writes. Demo scale (~30 Members) is fine for synchronous recompute. Pilot scale needs async recompute via queue.

### H.4 CLAUDE.md manifest update

Add:
- `lib/workflow-state.ts`
- `lib/recapture-detection.ts`
- `docs/MEMBER_TYPE_GUIDANCE_v2.md` (Tier 1 hard-rules)
- New entity: MemberWorkflowState
- New routes: `/v2/insight-engine/tracks`, `/v2/insight-engine/portfolio`, `/v2/insight-engine/coverage`, `/v2/insight-engine/stage-skip`

### H.5 Acceptance criteria

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 9-10 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Pilot deferrals to honor

Sprint 5b.2 does not ship:
- Full RBAC permission model
- Insight Engine novel review surface
- Make-canonical promotion affordance
- Per-banker insight activity coaching analytics
- Cross-Member novel-Insight LLM discovery
- Date-arithmetic operators in evaluator
- Async workflow state recomputation
- Banker-mark-resolved on Indecision

If a question arises during 5b.2 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5b.2 is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Visual probes of all four portfolio surfaces (Track Performance, Member portfolio, Coverage and indecision, Stage-skip)
3. Recapture pattern verification: capture same Signal value twice → confirm timestamp updated, no duplicate
4. Recapture pattern verification: capture different value → confirm new record created, prior superseded
5. Coach surface verification: refined v2 content renders for all three Member-Types
6. Per-fixture sanity check: portfolio surfaces show correct Member counts and aggregations
7. Any deviations from spec with rationale
8. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan diff structure so each block is delimited.

---

## Estimated scope

4-5 effective build days CC time + ~3-4 hours Francisco editorial pass on Coach content.

Largest blocks:
- **Block B/C/D/E (portfolio surfaces)** — substantial UX work; ~2-3 days CC across all four
- **Block F (recapture handling)** — pure-function logic + server action integration; ~0.5-1 day CC
- **Block G (Coach refinement integration)** — straightforward once content authored; ~0.5 day CC

Smaller blocks (A schema, H governance) are routine.

After Sprint 5b.2 ships and visual review confirms (portfolio surfaces work; recapture pattern works; Coach refinement integrated), Sprint 6 (polish + EVP demo deploy) is the final sprint.
