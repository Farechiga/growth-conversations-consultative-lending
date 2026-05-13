# Sprint 5a.1 — Foundation: Matrix Schema, Seed Data, Capture Form Updates, Basic Switchboard

**Prompt for Claude Code. Single checkpoint. Ships the matrix infrastructure that Sprint 5a.2 (popup-as-workflow + dot simplification) will build on top of. Estimated 2-3 effective build days. No popup-as-workflow yet; no dot system simplification yet — those land in Sprint 5a.2 after visual review confirms this foundation.**

## Pre-flight context

Sprint 4.7.2.x shipped clean (vocabulary refactor, dialpad simplification, Reaction expansion, layout spacing fixes). v2 architecture is structurally locked at Discover/Measure/Consult/Navigate × 5-activity dialpad.

Sprint 5a brings the consultative architecture: a hand-curated business-factor matrix that drives Track ranking and powers the popup-as-workflow surface. Sprint 5a is split into two phases for visual review safety:

- **Sprint 5a.1 (this sprint) — Foundation.** Schema + seed data + capture form updates + basic Track switchboard rendering from the matrix. No popup restructuring; no dot simplification. Goal: confirm the matrix is alive and Tracks rank correctly per fixture.
- **Sprint 5a.2 (next sprint) — Surface.** Popup-as-workflow restructuring + dot system simplification + Track switching UX polish. Built on the confirmed-working foundation from Sprint 5a.1.

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` (at repo root) — the canonical matrix data this sprint seeds. 28 business factors, 5 Track templates, ~80+ matrix entries, per-fixture demo data. Section 6 of that document has Prisma schema sketches that CC adapts to actual codebase patterns.
2. `ARCHITECTURE_V2.md` — particularly §3 (four objectives), §4 (five activities), §10 (Tracks-supported framework), §11.1 (Objective as derived state), §11.7 (surface vs schema separation).
3. `EVIDENCE_FRAMEWORK.md` — §2 (21-evidence-type catalog), §4 (five-activity to evidence mapping), §5 (Tracks-supported framework).
4. `COMPLIANCE.md` — §6.3 (business-factor-only contextual taxonomy), §10 (banker-facing posture commitments).
5. `BLAZE_STYLE_GUIDE.md` §14.9 — current v2 workstation pattern.

If `BUSINESS_FACTOR_MATRIX_v1.md` is not present at repo root, **stop and surface to Francisco** rather than proceeding from inference. The matrix is the source of truth for this sprint.

**Architecture authority:** When `BUSINESS_FACTOR_MATRIX_v1.md` and other governance docs disagree on Track-related architecture, the matrix file wins for matrix-data questions; ARCHITECTURE_V2.md wins for objective/activity/dot architecture questions. When in doubt, surface rather than guess.

## What ships in this sprint (5a.1)

Eight blocks. All part of one checkpoint, delimited diffs.

- **Block A — Schema additions.** `BusinessFactor`, `TrackTemplate`, `MatrixEntry`, `FactorCapture` entities. Migration. Indexes.
- **Block B — Matrix data seed.** Translate `BUSINESS_FACTOR_MATRIX_v1.md` Sections 1-3 into seed data: 28 factors, 5 Tracks, ~80+ matrix entries.
- **Block C — Per-fixture FactorCapture seed.** Translate Section 4 of the matrix file into FactorCapture records for Jenny, Northland, Cygnus.
- **Block D — Threshold rule evaluator.** Pure-function rule parser (~50 lines TypeScript) that evaluates `MatrixEntry.threshold_rule` strings against `FactorCapture` values.
- **Block E — Track ranking function.** Pure function that takes a Member's FactorCaptures and returns ranked Tracks per matrix-lookup logic, with the 2-evidence-threshold filter.
- **Block F — + Quantify form hybrid mode.** Matrix-aware structured mode (factor diagnostic dropdown + value capture) plus free-form fallback.
- **Block G — + Ask form light tagging updates.** Qualitative tag selectors that map to factor IDs for Goal/Blocker/Indecision/Trigger captures.
- **Block H — Basic Track switchboard sidebar.** Read-only Track dropdown showing top-ranked Track for the Member; renders existing dots against current Track. No track-switching UI yet, no popup restructuring yet.

Sprint 5a.1 explicitly does **not** ship: popup-as-workflow restructuring, dot system simplification (captured-only main row + "+ next valuable" affordance), Track switching UI polish, Insight Engine portfolio surfaces. All of these are Sprint 5a.2 or later.

---

## Block A — Schema additions

### A.1 Entities

Per Section 6 of `BUSINESS_FACTOR_MATRIX_v1.md`, add four new Prisma entities:

**BusinessFactor:**
```prisma
model BusinessFactor {
  id                    String   @id  // FACTOR-001 etc.
  name                  String
  diagnostic_question   String
  capture_mode          String   // numerical / boolean / qualitative_select / qualitative_multi
  field_name            String   // snake_case key for FactorCapture lookups
  unit                  String?  // %, days, months, $, null
  category              String   // cashflow, capacity, decision_process, industry_structural, member_stated, banking_relationship
  enum_values           String?  // JSON array for qualitative_select factors
  notes                 String?

  matrix_entries        MatrixEntry[]
  factor_captures       FactorCapture[]
}
```

**TrackTemplate:**
```prisma
model TrackTemplate {
  id                              String   @id  // TRACK-001 etc.
  name                            String
  banker_description              String
  typical_size_band               String?
  required_evidence_per_objective Json     // { discover: [...], measure: [...], consult: [...], navigate: [...] }
  notes                           String?

  matrix_entries                  MatrixEntry[]
}
```

**MatrixEntry:**
```prisma
model MatrixEntry {
  id                String   @id @default(cuid())
  factor_id         String
  factor            BusinessFactor @relation(fields: [factor_id], references: [id])
  track_id          String
  track             TrackTemplate  @relation(fields: [track_id], references: [id])
  strength          String   // strong / moderate / negligible / negative
  threshold_rule    String?  // e.g. "seasonal_variance_pct >= 20"
  banker_rationale  String   // surfaced in popup CTAs and Tracks-supported panel

  @@unique([factor_id, track_id, strength])
  @@index([factor_id])
  @@index([track_id])
}
```

The unique constraint includes `strength` because some factor-track pairs have multiple matrix entries at different strength tiers (e.g., FACTOR-001 / TRACK-001 has both a strong entry at threshold ≥ 20% and a moderate entry at threshold 10..20%). Each tier is a distinct entry.

**FactorCapture:**
```prisma
model FactorCapture {
  id                  String   @id @default(cuid())
  member_id           String
  member              Member   @relation(fields: [member_id], references: [id])
  factor_id           String
  factor              BusinessFactor @relation(fields: [factor_id], references: [id])
  numerical_value     Float?
  boolean_value       Boolean?
  qualitative_value   String?
  unit                String?
  source_signal_id    String?  // optional link to Signal capture
  source_sizing_id    String?  // optional link to SizingMeasurement
  source_reaction_id  String?  // optional link to Reaction
  captured_at         DateTime @default(now())
  banker_id           String

  @@index([member_id])
  @@index([factor_id])
  @@index([member_id, factor_id])  // for quick "do we have this factor for this member?" lookups
}
```

### A.2 Migration

Single Prisma migration adding all four entities and their indexes. SQLite-compatible DDL. No data backfill in this migration — Block B handles seed data separately.

### A.3 Acceptance criteria for Block A

- [ ] All four entities defined in `prisma/schema.prisma`
- [ ] Migration applies cleanly
- [ ] No regression to existing entities
- [ ] `pnpm tsc --noEmit` clean
- [ ] No relations break v1 routes

---

## Block B — Matrix data seed

### B.1 Source of truth

`BUSINESS_FACTOR_MATRIX_v1.md` at repo root. Sections 1, 2, and 3 of that document are the canonical content; this block translates them into seed data without authorial judgment.

### B.2 BusinessFactor seed records

28 factors per Section 1 of the matrix file. Each seed record has the fields per Block A's `BusinessFactor` schema, sourced verbatim from the matrix document. Example:

```typescript
{
  id: "FACTOR-001",
  name: "Seasonal revenue variance",
  diagnostic_question: "By what percentage does this Member's revenue swing between peak and trough seasons?",
  capture_mode: "numerical",
  field_name: "seasonal_variance_pct",
  unit: "%",
  category: "cashflow",
  enum_values: null,
  notes: "Captured as `seasonal_variance_pct`. Threshold typically referenced at 20%+ (significant) and 30%+ (severe).",
}
```

### B.3 TrackTemplate seed records

5 Tracks per Section 2 of the matrix file. The `required_evidence_per_objective` JSON column is structured:

```typescript
{
  discover: ["FACTOR-024", "FACTOR-022", "FACTOR-016"],
  measure: ["FACTOR-001", "FACTOR-005", "model_produced"],
  consult: ["model_shown", "reaction_captured"],
  navigate: []
}
```

For required evidence that maps to factors directly, use the FACTOR-NNN id. For required evidence that maps to schema entities (Model produced, Model shown, Reaction captured), use snake_case symbolic strings. The Sprint 5a.2 popup-as-workflow logic will resolve these symbolic references; for Sprint 5a.1, they're stored as opaque strings.

### B.4 MatrixEntry seed records

~80+ strong/moderate entries plus ~10 negative/dealbreaker entries per Section 3 of the matrix file.

Each entry per Block A's `MatrixEntry` schema. Example:

```typescript
{
  factor_id: "FACTOR-001",
  track_id: "TRACK-001",
  strength: "strong",
  threshold_rule: "seasonal_variance_pct >= 20",
  banker_rationale: "Significant seasonal swing; LOC absorbs the trough",
}
```

For entries with no threshold rule (presence-based factors, qualitative-tag matches), `threshold_rule` is `null`.

For threshold rules with range comparisons (e.g., "seasonal_variance_pct 10..20" for the moderate tier), normalize to a single comparison expression that the Block D evaluator handles. Suggested format: `seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20`.

### B.5 Authoring discipline

The matrix file is canonical. Do not editorially adjust factor definitions, threshold values, or banker rationale text. If a matrix entry's threshold rule format doesn't fit the Block D evaluator's grammar, surface to Francisco rather than guessing.

If you encounter an ambiguity in the matrix file (e.g., a threshold rule uses unusual operators, or a factor's capture mode is unclear), log it in BUILD_LOG.md as a "matrix interpretation note" rather than silently resolving.

### B.6 Acceptance criteria for Block B

- [ ] Seed script populates 28 BusinessFactor records
- [ ] Seed script populates 5 TrackTemplate records
- [ ] Seed script populates ~80+ MatrixEntry records
- [ ] All matrix entries have valid factor_id and track_id references
- [ ] Threshold rule strings are syntactically parseable by the Block D evaluator
- [ ] `pnpm exec tsx prisma/seed.ts` runs cleanly

---

## Block C — Per-fixture FactorCapture seed

### C.1 Source of truth

Section 4 of `BUSINESS_FACTOR_MATRIX_v1.md`. Three fixtures (Jenny, Northland, Cygnus), each with a captured-factors table.

### C.2 Seed records

For each Member fixture, create a FactorCapture record per captured factor in the matrix Section 4 table.

Example for Jenny's seasonal variance:
```typescript
{
  member_id: jennyMember.id,
  factor_id: "FACTOR-001",
  numerical_value: 28,
  boolean_value: null,
  qualitative_value: null,
  unit: "%",
  source_signal_id: null,
  source_sizing_id: relevantSizingMeasurement.id,  // link to existing SizingMeasurement if appropriate
  source_reaction_id: null,
  captured_at: jennyApr8ConversationDate,
  banker_id: scottBanker.id,
}
```

### C.3 Source linkage

Where a captured factor maps to an existing Signal, SizingMeasurement, or Reaction in current seed data, populate the corresponding `source_*_id` field for traceability. Where no existing capture exists, leave source IDs null and the FactorCapture stands alone.

This linkage allows the popup workflow surface in Sprint 5a.2 to show "this factor was captured via this Goal/SizingMeasurement/Reaction" with the original capture context.

### C.4 Acceptance criteria for Block C

- [ ] Jenny has FactorCaptures for all factors per Section 4.1
- [ ] Northland has FactorCaptures for all factors per Section 4.2
- [ ] Cygnus has FactorCaptures for all factors per Section 4.3
- [ ] Source linkage populated where existing captures align with factors
- [ ] `pnpm exec tsx prisma/seed.ts` runs cleanly

---

## Block D — Threshold rule evaluator

### D.1 Pure function spec

Implement `lib/factor-evaluator.ts` exporting:

```typescript
type CaptureValue = {
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
};

function evaluateThreshold(capture: CaptureValue, rule: string | null): boolean
```

If `rule` is null (presence-based factor), return true if the capture has any non-null value (numerical, boolean, or qualitative).

If `rule` is a comparison string, parse and evaluate against the appropriate capture value field. Supported operators:

- `>=`, `>`, `<=`, `<`, `==`, `!=` (numerical and qualitative comparisons)
- `AND`, `OR` (composite rules)
- `IN [...]` (qualitative-value-in-list)

### D.2 Implementation guidance

Keep it simple. ~50 lines of TypeScript. Tokenize the rule string, evaluate against `capture` fields, return boolean. No external parsing library; hand-rolled is fine for this grammar.

The evaluator must handle field references like `seasonal_variance_pct >= 20`, where `seasonal_variance_pct` is the BusinessFactor.field_name and the captured value lives in `capture.numerical_value`. The evaluator can take an additional `factor: BusinessFactor` parameter to resolve which capture field corresponds to which factor's field_name.

Suggested signature refined:

```typescript
function evaluateThreshold(
  capture: FactorCapture,
  factor: BusinessFactor,
  rule: string | null
): boolean
```

### D.3 Test cases

Block D should be unit-testable. Suggested test cases:

- Numerical >=: `seasonal_variance_pct >= 20` against capture with `numerical_value: 28` → true; against `numerical_value: 15` → false
- Numerical range: `seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20` against `numerical_value: 15` → true; against `numerical_value: 25` → false
- Boolean: `industry_seasonal == true` against capture with `boolean_value: true` → true
- Qualitative: `growth_aspiration_tag == smooth_seasonal_revenue` against `qualitative_value: "smooth_seasonal_revenue"` → true
- Qualitative IN: `decision_timeline IN [6_months, 12_months]` against `qualitative_value: "6_months"` → true
- Null rule (presence): rule is null, capture has any non-null value → true
- Null rule + null capture: rule is null, all capture values null → false

If CC writes tests, place in `lib/__tests__/factor-evaluator.test.ts` per existing test conventions; if not, document expected behavior in JSDoc on the function.

### D.4 Acceptance criteria for Block D

- [ ] `lib/factor-evaluator.ts` exists with `evaluateThreshold` exported
- [ ] All seven test cases above pass (manual verification or unit tests)
- [ ] Function is pure (no side effects, deterministic)
- [ ] `pnpm tsc --noEmit` clean

---

## Block E — Track ranking function

### E.1 Pure function spec

Implement `lib/track-ranker.ts` exporting:

```typescript
type RankedTrack = {
  track_id: string;
  track_name: string;
  strength: "strong" | "moderate" | "insufficient";
  matrix_entries_fired: MatrixEntry[];  // which entries matched, for popup display in 5a.2
  strong_count: number;
  moderate_count: number;
  negative_count: number;
};

function rankTracksForMember(memberId: string): Promise<RankedTrack[]>
```

### E.2 Algorithm

For each Track in the database:

1. Find all MatrixEntries for this Track
2. For each MatrixEntry, find the Member's FactorCapture for the entry's factor_id
3. If a FactorCapture exists, evaluate the entry's threshold_rule using Block D's evaluator
4. If evaluator returns true, count the entry as "fired" with its strength tier (strong / moderate / negative)
5. Aggregate counts per Track

After all Tracks are scored, apply the **2-evidence-threshold filter**: only return Tracks where `strong_count + moderate_count >= 2`. Tracks below this threshold are excluded from the ranked output.

Sort returned Tracks by:
1. Most negative_count first as **demerit** (a Track with 1 negative = "insufficient" regardless of positive count, unless overwhelming positives)
2. Then by strong_count descending
3. Then by moderate_count descending

Strength label rules:
- "strong" if strong_count >= 3 AND no negative_count
- "moderate" if (strong_count >= 1 OR moderate_count >= 2) AND no overriding negative
- "insufficient" otherwise (filtered out by 2-evidence threshold OR negative-count override)

### E.3 Negative override discipline

A single dealbreaker (negative matrix entry) doesn't always disqualify a Track in the demo — bankers may surface SBA 7(a) for a Member whose tenure is just below threshold to discuss the path forward. For Sprint 5a.1, render Tracks with any negative_count as "insufficient" but keep them in the returned list (banker can still see them in the switchboard with insufficient label). Sprint 5a.2 may refine this UX.

### E.4 Test cases

For each fixture (Jenny, Northland, Cygnus), the rankings should match Section 4 of the matrix file:

- **Jenny:** Working Capital LOC = strong; Treasury Services Upgrade = moderate; SBA 7(a) = moderate; Vehicle/Fleet Loan = insufficient (filtered); CRE Term Loan = insufficient.
- **Northland:** Vehicle/Fleet Loan = strong; SBA 7(a) = moderate; CRE Term Loan = moderate; Working Capital LOC = insufficient; Treasury Services Upgrade = insufficient.
- **Cygnus:** CRE Term Loan = strong; SBA 7(a) = moderate-or-insufficient (revenue ceiling edge case — confirm against matrix Section 4.3); Treasury Services Upgrade = moderate; Working Capital LOC = insufficient; Vehicle/Fleet Loan = insufficient.

If CC's ranker output differs from these expected rankings, surface the discrepancy in BUILD_LOG.md before proceeding to Block H.

### E.5 Acceptance criteria for Block E

- [ ] `lib/track-ranker.ts` exists with `rankTracksForMember` exported
- [ ] Function returns rankings matching matrix Section 4 expectations for all three fixtures
- [ ] 2-evidence-threshold filter applied
- [ ] Negative-count override applied
- [ ] Function is async (db queries) but pure beyond db access
- [ ] `pnpm tsc --noEmit` clean

---

## Block F — + Quantify form hybrid mode

### F.1 Current state

The + Quantify form ships from Sprint 4.7 phase 2 with free-form magnitude capture: banker enters topic, magnitude, unit, optional methodology note. No matrix awareness.

### F.2 Hybrid mode

The form gains a **mode toggle** at the top:

- **Default mode (matrix-aware structured):** Banker first selects a business factor from a categorized dropdown. The form then surfaces the factor's diagnostic question, capture mode (numerical / boolean / qualitative), and unit. Banker fills in the value.
- **Fallback mode (free-form magnitude):** Original Sprint 4.7 behavior — banker enters arbitrary topic, magnitude, unit, methodology. Captures as a SizingMeasurement without a FactorCapture.

Mode toggle visual: simple toggle or radio at top of form. Default to matrix-aware.

### F.3 Matrix-aware mode UX

Form layout:

```
[Mode: ● matrix-aware  ○ free-form]

What business factor are you capturing?
[dropdown grouped by category: cashflow / capacity / decision_process / industry_structural / member_stated / banking_relationship]

[On factor selection, surface the diagnostic question:]

"By what percentage does this Member's revenue swing between peak and trough seasons?"

[capture field varies by mode:]
- numerical: number input + unit (auto-filled from factor)
- boolean: yes/no
- qualitative_select: dropdown of enum_values
- qualitative_multi: multi-select of enum_values

[Optional source linkage:]
☐ Link to an existing SizingMeasurement (dropdown of this Member's existing magnitudes)
☐ Link to an existing Signal (dropdown of this Member's existing signals)

[Submit]
```

On submit (matrix-aware mode):
1. Create a FactorCapture record with the structured value
2. If banker linked to an existing SizingMeasurement, populate `source_sizing_id`
3. If a SizingMeasurement should be created alongside (factor is numerical and no existing magnitude was linked), prompt banker via inline checkbox: "Also save as SizingMeasurement?"

This dual-write pattern lets factors live independently or alongside existing capture entities. The intent: + Quantify is the primary path for matrix-aware factor capture; SizingMeasurement persists for v1 cohabitation and free-form fallback.

### F.4 Free-form fallback mode

Identical to current + Quantify form behavior. Captures only as SizingMeasurement; no FactorCapture created.

### F.5 Compliance keyword scan

Free-text fields (methodology_note in fallback mode; optional notes in either mode) continue to run the Sprint 4.6 compliance keyword scan on submit.

### F.6 Acceptance criteria for Block F

- [ ] + Quantify form has matrix-aware vs free-form mode toggle
- [ ] Matrix-aware mode surfaces factor diagnostic question on factor selection
- [ ] Capture field type adapts to factor's capture_mode (numerical / boolean / qualitative_select / qualitative_multi)
- [ ] Form creates FactorCapture record in matrix-aware mode
- [ ] Optional companion SizingMeasurement creation works
- [ ] Free-form fallback preserves current Sprint 4.7 behavior
- [ ] Compliance keyword scan runs on free-text fields

---

## Block G — + Ask form light tagging updates

### G.1 Current state

The + Ask form captures Goals/Blockers/Indecision/Trigger as Signal entities with free-text Member quotes and qualitative metadata.

### G.2 Light updates — factor mapping

For qualitative captures (Goal, Blocker, Indecision, Trigger), surface a **factor-tag dropdown** that maps the capture to a FactorCapture record.

Per matrix file Section 1.5:
- **Goal capture →** dropdown of `growth_aspiration_tag` values: smooth_seasonal_revenue / expand_capacity / acquire_real_estate / diversify_revenue / acquire_equipment / refinance_existing / scale_workforce / other
- **Blocker capture →** dropdown of `growth_obstacle_tag` values: cashflow_volatility / customer_concentration / capacity_limit / aging_equipment / real_estate / workforce_gap / regulatory_compliance / other
- **Indecision capture →** dropdown of `hesitation_tag` values: timing / pricing / structure / co_decision_maker_input / external_advisor_input / risk_tolerance / capacity_to_service_debt / other
- **Trigger capture →** dropdown of `trigger_event_tag` values: late_paying_customer / capacity_evaluation / equipment_breakdown / customer_growth_announcement / regulatory_change / refinancing_window / acquisition_opportunity / other

On submit:
1. Create the Signal record as currently
2. Additionally create a FactorCapture record with `qualitative_value` set to the selected tag, linked to the corresponding factor (FACTOR-021 / FACTOR-022 / FACTOR-023 / FACTOR-024 respectively)
3. Populate FactorCapture.source_signal_id with the Signal's id

### G.3 Notes on form complexity

Keep the form change light. The factor tag dropdown is added below the existing free-text quote field. If the banker doesn't select a tag, default to "other" (which still creates a FactorCapture but doesn't drive specific Track scoring).

### G.4 Acceptance criteria for Block G

- [ ] + Ask form has factor-tag dropdown for each signal type
- [ ] Tag dropdown values match Section 1.5 of the matrix file
- [ ] Form creates both Signal and FactorCapture records on submit
- [ ] FactorCapture.source_signal_id populated for traceability
- [ ] Default-to-"other" behavior works when no tag selected

---

## Block H — Basic Track switchboard sidebar

### H.1 Current sidebar

Sprint 4.7.2.x sidebar shows objectives (Discover/Measure/Consult/Navigate), captured artifact, captured macro, recent history, coach affordance.

### H.2 Add Track switchboard header

Insert a Track context indicator above the four objectives:

```
[Track context]
Working Capital LOC · strong
[chip] [chip] [chip]
```

The Track context indicator:
- **Track name:** the top-ranked Track per Block E's ranker output
- **Strength label:** strong / moderate / insufficient
- **Visual:** small chip-style label using existing chip primitive from Sprint 4.7.1

If `rankTracksForMember` returns an empty array (no Tracks meet the 2-evidence threshold), display: "Track context: insufficient evidence yet" with no specific Track named.

### H.3 No track-switching UI in this sprint

For Sprint 5a.1, the displayed Track is read-only. The dropdown UX (banker switches between candidate Tracks via dropdown, dot composition re-renders against new Track) is **Sprint 5a.2 work**.

For 5a.1: simple read-only header. Sprint 5a.2 makes it interactive.

### H.4 Dots remain rendered as per Sprint 4.7.2.x

Dot composition in the four objectives stays as currently rendered (per the Sprint 4.7.2 dot composition rewrite based on EVIDENCE_FRAMEWORK catalog). No track-state-dependent dot rendering yet — that's Sprint 5a.2.

The Track context indicator at the top simply shows what Track ranks highest; the dots don't yet reflect Track-relative evidence requirements.

### H.5 Acceptance criteria for Block H

- [ ] Sidebar displays Track context header above objectives
- [ ] Track name and strength reflect Block E ranker output
- [ ] Empty-state ("insufficient evidence yet") renders correctly
- [ ] Three fixtures show expected top Tracks: Jenny → Working Capital LOC; Northland → Vehicle/Fleet Loan; Cygnus → CRE Term Loan
- [ ] No regression to existing sidebar sections (objectives, artifact, macro, history, coach)

---

## Governance updates

After Blocks A-H ship and visual review confirms acceptance:

1. **BUILD_LOG.md entry** — Sprint 5a.1 entry covering:
   - What shipped per block
   - Schema additions and seed data counts
   - Threshold evaluator design decisions
   - Any matrix interpretation notes (from Block B.5 ambiguity handling)
   - Any deviations from the matrix file with rationale
   - Cross-references to BUSINESS_FACTOR_MATRIX_v1.md

2. **No OPEN_QUESTIONS amendments expected.** If implementation surfaces new questions, log per existing pattern.

3. **CLAUDE.md manifest update** — note new entities (BusinessFactor, TrackTemplate, MatrixEntry, FactorCapture) and new lib files (factor-evaluator.ts, track-ranker.ts) so future sessions can orient.

---

## Pilot / 5a.2 deferrals to honor

Sprint 5a.1 does not ship:

- Popup-as-workflow restructuring (top-zone CTAs, bottom-zone evidence) — Sprint 5a.2
- Dot system simplification (captured-only main row, "+ next valuable" affordance) — Sprint 5a.2
- Track switching UX (banker switches Track via dropdown, dot composition re-renders) — Sprint 5a.2
- State-dependent dot rendering (dots derived from current Track's required evidence) — Sprint 5a.2
- Insight Engine portfolio surfaces — Sprint 5b
- Real-time Track ranking on capture (re-run ranker on each FactorCapture creation) — defer to 5a.2 if useful, otherwise Pilot

If a question arises during 5a.1 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively. Do not anticipate 5a.2 work in this turn.

---

## Reporting back

When Sprint 5a.1 is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Schema migrations applied (entity counts, indexes verified)
3. Seed data counts: 28 BusinessFactors, 5 TrackTemplates, ~80+ MatrixEntries, FactorCaptures per fixture
4. Block D evaluator: confirm all seven test cases pass (with output)
5. Block E ranker: confirm Track rankings for all three fixtures match matrix Section 4 expectations
6. Visual probes (HTML or screenshots) of:
   - Jenny's page sidebar showing "Working Capital LOC · strong" Track context
   - Northland's page sidebar showing "Vehicle/Fleet Loan · strong" Track context
   - Cygnus's page sidebar showing "CRE Term Loan · strong" Track context
   - + Quantify form in matrix-aware mode (factor dropdown + diagnostic question + value capture)
   - + Ask form with factor-tag dropdown
7. Any matrix interpretation notes from Block B.5
8. Any deviations from spec with rationale
9. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan the diff structure so each block is delimited.

---

## Estimated scope

2-3 effective build days. The biggest blocks:
- **Block B (matrix data seed)** — large content translation; mechanical but voluminous
- **Block D (threshold evaluator)** — small but needs careful test coverage
- **Block E (track ranker)** — pure function, but the negative-override and 2-evidence-threshold logic deserves attention
- **Block F (+ Quantify hybrid mode)** — non-trivial form UX

Smaller blocks (A schema, C fixture seed, G + Ask updates, H sidebar header) are straightforward.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Sprint 5a.1 must land cleanly so Sprint 5a.2 has a stable foundation. Better to defer questionable scope to 5a.2 than to risk a fragile 5a.1.

After Sprint 5a.1 ships and visual review confirms the matrix is alive (Tracks rank correctly per fixture, capture forms create FactorCaptures, sidebar Track context renders), Sprint 5a.2 (popup-as-workflow + dot simplification + Track switching UX) is the next CC turn.
