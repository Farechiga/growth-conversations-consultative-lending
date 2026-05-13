# Sprint 5a.2 — Surface: Popup-as-Workflow, Dot Simplification, Track Switching UX

**Prompt for Claude Code. Single checkpoint. Ships the visible surface architecture that makes Sprint 5a.1's matrix foundation banker-usable. Estimated 2-3 effective build days. Sprint 5a.1 (foundation: schema, seed, evaluator, ranker, capture forms, basic Track context header) shipped clean; this sprint builds the consultative workflow surfaces on top.**

## Pre-flight context

Sprint 5a.1 visual review confirmed: matrix is alive end-to-end, Tracks rank correctly per fixture (Jenny → Working Capital LOC strong; Northland → Vehicle/Fleet Loan strong; Cygnus → CRE Term Loan strong), capture forms create FactorCaptures, sidebar Track context header renders read-only.

Sprint 5a.2 makes the matrix banker-usable through five surface enhancements:

- **Popup-as-workflow restructuring.** Click an objective in the sidebar → workflow surface with two zones: top (missing-factor CTAs from current Track template, each linking to its capture form), bottom (structured evidence rows from captured factors, no prose mush).
- **Dot system simplification.** Main dot row per objective shows captured-only evidence. "+ next valuable" affordance on the right surfaces the next-most-valuable missing factor per current Track. No faint/outlined ghosts.
- **State-dependent dot rendering.** Dot composition derives from current Track's `required_evidence_per_objective`, not the generic EVIDENCE_FRAMEWORK catalog. Different Tracks render different dot rows.
- **Track switching UX.** Sidebar Track context becomes an interactive dropdown. Switching re-renders dots and popups against new Track. Captures stay invariant; rendering is Track-relative.
- **Evaluator operator extension.** Add the LENGTH operator (and any other operators surfaced as needed) to the threshold rule evaluator so FACTOR-027 fires correctly.

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` (at repo root) — particularly Section 2 (Track templates' `required_evidence_per_objective`) and Section 4 (per-fixture demo data with expected popup content).
2. `ARCHITECTURE_V2.md` — particularly §3 (objectives), §11 (schema), §11.7 (surface vs schema separation).
3. `EVIDENCE_FRAMEWORK.md` — §2 (evidence catalog) and §4 (activity-to-evidence mapping).
4. `COMPLIANCE.md` §10 — banker-facing posture commitments. Popup CTAs and evidence rows must avoid the banned phrases ("Recommended for", "Eligible for", "Candidate tracks", etc.) per §10.2.
5. `BLAZE_STYLE_GUIDE.md` §14.9 — v2 workstation pattern.
6. `prisma/seed-matrix.ts` — to understand the matrix data structure CC seeded in Sprint 5a.1.

If `BUSINESS_FACTOR_MATRIX_v1.md` is not present at repo root, **stop and surface to Francisco** rather than proceeding from inference.

**Architecture authority:** ARCHITECTURE_V2.md §3 wins for objective-level architecture; `BUSINESS_FACTOR_MATRIX_v1.md` wins for matrix-data and Track-template questions; COMPLIANCE.md §10 wins for banker-facing copy discipline (banned phrases are non-negotiable).

## What ships in this sprint (5a.2)

Eight blocks. All part of one checkpoint, delimited diffs.

- **Block A — Evaluator operator extension.** Add LENGTH operator (and any others surfaced during implementation) to `lib/factor-evaluator.ts`. Verify FACTOR-027 fires correctly.
- **Block B — Track-relative dot derivation.** Replace the generic EVIDENCE_FRAMEWORK-based dot composition with Track-template-relative derivation. Each objective renders dots per current Track's required evidence for that objective.
- **Block C — Dot system simplification.** Captured-only dots in main row; "+ next valuable" affordance per current Track. No faint/outlined dots in the main row.
- **Block D — Popup-as-workflow surface.** Click objective in sidebar → modal/drawer with two-zone layout: top (missing-factor CTAs), bottom (structured evidence rows).
- **Block E — Capture form linking from popup CTAs.** Each missing-factor CTA opens the corresponding capture form (typically + Quantify in matrix-aware mode pre-selected to that factor; sometimes + Ask, + Reaction, etc.).
- **Block F — Track switching UX.** Sidebar Track context becomes interactive dropdown showing all candidate Tracks ranked. Switching Track re-renders dot composition and popup content against new Track.
- **Block G — Real-time ranker re-execution.** Track ranking re-computes when a new FactorCapture is created. Switchboard updates accordingly.
- **Block H — Governance updates.** BUILD_LOG entry; OPEN_QUESTIONS resolutions for any items closed by this sprint; CLAUDE.md manifest updates for new components.

---

## Block A — Evaluator operator extension

### A.1 Current state

`lib/factor-evaluator.ts` from Sprint 5a.1 supports: `>=`, `>`, `<=`, `<`, `==`, `!=`, `AND`, `OR`, `IN [...]`, and null-rule presence checks. CC noted FACTOR-027's `LENGTH(treasury_services_adopted) < 3` rule was omitted because LENGTH wasn't supported.

### A.2 Add LENGTH operator

Extend the evaluator's grammar to support `LENGTH(field_name) <comparison> value` for qualitative_multi factors stored as JSON arrays.

Grammar:
- `LENGTH(field_name) >= N`
- `LENGTH(field_name) > N`
- `LENGTH(field_name) <= N`
- `LENGTH(field_name) < N`
- `LENGTH(field_name) == N`

Implementation: when the evaluator encounters `LENGTH(...)`, parse the field reference, look up the corresponding FactorCapture's `qualitative_value` (which stores JSON array as string for qualitative_multi factors), parse the JSON, and evaluate the array's length against the comparison value.

### A.3 Other operators worth surfacing

If during Sprint 5a.2 implementation CC encounters additional operators needed for the demo to work correctly (e.g., date arithmetic, COUNT, range exclusions), surface them in BUILD_LOG with proposed grammar; Francisco decides whether to add or defer.

For Pilot, the evaluator likely needs: date arithmetic (CAPTURED_AT > 6_months_ago for stale-signal-refresh), COUNT (count of FactorCaptures matching a condition), regex matching for qualitative tags. These are out of scope for Sprint 5a.2 unless directly required for FACTOR-027 or another demo-blocking case.

### A.4 Verify FACTOR-027

After adding LENGTH, verify FACTOR-027's matrix entries fire correctly. The matrix should have an entry like:
- `LENGTH(treasury_services_adopted) < 3` → strong support for Treasury Services Upgrade (the "headroom to upgrade" signal)

For demo seed data, ensure each fixture has a captured `treasury_services_adopted` array. Suggested values:
- Jenny: 1 service adopted (e.g., business_checking) → LENGTH < 3 fires strong
- Northland: 1 service adopted → LENGTH < 3 fires strong
- Cygnus: 4 services adopted → LENGTH < 3 does not fire

If the seed data is missing, populate via Block B's seed extension.

### A.5 Acceptance criteria for Block A

- [ ] Evaluator supports LENGTH operator per grammar in A.2
- [ ] FACTOR-027 matrix entry fires correctly for at least one fixture
- [ ] All existing evaluator tests still pass
- [ ] Any additional operators added are documented in BUILD_LOG

---

## Block B — Track-relative dot derivation

### B.1 Current state

Sprint 4.7.2 dot composition derives from EVIDENCE_FRAMEWORK §2 catalog (generic per-objective evidence types). Dots show across all four objectives uniformly regardless of which Track is candidate.

Sprint 5a.1 added the Track context header to the sidebar but did not change dot rendering — dots still derive from the generic catalog.

### B.2 Replacement: Track-relative dot derivation

Dot composition for each objective derives from the **current Track's `required_evidence_per_objective`** field. Each Track template specifies which evidence types it requires per objective; the dot row renders one dot per required evidence type for the current Track.

Implementation in `lib/objective-evidence.ts` (or wherever current dot derivation lives):

```typescript
function deriveDotsForObjective(
  member: Member,
  objective: V2Objective,
  currentTrack: TrackTemplate,
  factorCaptures: FactorCapture[],
  // ... other captures (Signals, SizingMeasurements, etc.)
): ObjectiveDot[] {
  const requiredEvidence = currentTrack.required_evidence_per_objective[objective];
  return requiredEvidence.map(evidenceRef => {
    // evidenceRef is either a FACTOR-NNN id or a symbolic string ("model_produced", "model_shown", "reaction_captured")
    const captured = isEvidenceCaptured(evidenceRef, factorCaptures, member);
    return {
      evidence_ref: evidenceRef,
      label: humanizeEvidenceRef(evidenceRef),
      captured: captured,
    };
  });
}
```

The `isEvidenceCaptured` function:
- For FACTOR-NNN refs: check if the Member has a FactorCapture for that factor with a non-null value
- For symbolic refs ("model_produced"): check if the Member has a Model entity associated with the current Track (or any Model — depends on linkage decisions; CC implementation choice with rationale documented)
- For "model_shown": check ShowEvent existence
- For "reaction_captured": check Reaction existence

### B.3 What happens when no Track is current

If `rankTracksForMember` returns an empty array (Member has fewer than 2 firing factors), there's no current Track. Dot rendering falls back to one of:

- **Option 1:** Empty objective rows. Dots only appear once a Track is current.
- **Option 2:** Generic catalog rendering (existing Sprint 4.7.2 behavior) until a Track emerges.

CC chooses based on what visual review found cleaner; document the choice. My recommendation: **Option 2** (generic until Track emerges), so brand-new Members don't show empty objective rows. The Track context header already says "insufficient evidence yet" in this case; the objectives can stay populated with generic dots.

### B.4 Acceptance criteria for Block B

- [ ] Dot composition derives from current Track's `required_evidence_per_objective`
- [ ] Each fixture renders different dot rows depending on top-ranked Track
- [ ] Symbolic evidence refs (model_produced, model_shown, reaction_captured) resolve correctly
- [ ] Empty-Track fallback behavior chosen and documented
- [ ] No regression to Track context header from Sprint 5a.1

---

## Block C — Dot system simplification

### C.1 Current state

Sprint 4.7.2.x dot rendering shows captured dots (filled), suggested dots (outlined), and not-yet dots (faint) all in the same horizontal row. Visual review (Francisco's earlier feedback): *"the dots with concrete evidence is a huge win... white dot in the middle is odd... since this is 'linear process agnostic' there are just 2 dots, not a 'missing' dot."*

### C.2 Simplification: captured-only main row

Each objective's main dot row shows **only captured dots**. No faint, no outlined-suggested in the main row. Captured dots are filled; that's the whole row.

Implementation: filter `deriveDotsForObjective`'s output to only include `captured: true` dots in the main row.

### C.3 "+ next valuable" affordance

To the right of the main captured-dot row, render a single affordance: **"+ next valuable"**. This represents the next missing factor (per current Track) that would most strengthen the case.

Logic for "next valuable":
1. Get the current Track's `required_evidence_per_objective[objective]`
2. Filter to evidence refs not yet captured
3. Of remaining, pick the one with highest matrix strength (strong > moderate)
4. If multiple candidates tie, pick the one most commonly captured for similar Members in fixture data (or just first-by-id; CC implementation choice)

The "+ next valuable" affordance is clickable. Click → opens the corresponding capture form (per Block E), pre-selected to the missing factor.

### C.4 Visual treatment

- Captured dots: filled, ~10-12px diameter, ~14px center-to-center spacing (per existing Sprint 4.7.2 dot vocabulary)
- "+ next valuable" affordance: small text label "+ next" or "+ {factor diagnostic-question-shortened}" rendered to the right of the dot row, in muted color matching the dot vocabulary
- Coral ring dot (open thread): preserved per existing behavior — when a captured dot represents an open thread (e.g., Indecision under Discover with active leaning_yes Reaction in Consult), it gets the coral accent ring

### C.5 What if all required evidence is captured

If every required evidence ref for an objective is captured, the objective is "complete" for the current Track. Don't render "+ next valuable" — render a small subtle "complete" indicator, or simply nothing beyond the dot row.

### C.6 Acceptance criteria for Block C

- [ ] Main dot row shows only captured dots
- [ ] No faint/outlined ghost dots in main row
- [ ] "+ next valuable" affordance renders to the right
- [ ] Affordance is clickable and opens correct capture form
- [ ] Coral ring on open-thread dots preserved
- [ ] "Complete" state for objectives with all evidence captured

---

## Block D — Popup-as-workflow surface

### D.1 Current state

Sprint 4.7 phase 2 popups display objective-level coach guidance prose. Visual review feedback: *"Popups read as oddly formatted generated text mush... structure everything... figures should be bold or hyperlinked... break the evidence either into bullets or a table."* And: *"TOP: CTA recommended next dots with links to the capture forms. BOTTOM: list of concrete evidence (from dots) already completed."*

### D.2 Two-zone layout

Click an objective in the sidebar → modal/drawer (CC chooses; modal recommended for full-attention workflow surface) with two zones:

```
┌─────────────────────────────────────────────────────────┐
│ DISCOVER · for Working Capital LOC                       │
│ Do we understand how their business can grow?            │
├─────────────────────────────────────────────────────────┤
│ TO STRENGTHEN THIS CANDIDATE, CAPTURE:                   │
│ ☐ Operating cash buffer (months of expenses covered)     │
│   → opens + Quantify form, factor pre-selected           │
│ ☐ AR concentration of top 3 customers (% of total)       │
│   → opens + Quantify form, factor pre-selected           │
├─────────────────────────────────────────────────────────┤
│ ALREADY CAPTURED:                                         │
│ ✓ Trigger: Corporate-client late payments observed       │
│   captured Apr 8 by Scott Brynjolffson via + Ask         │
│ ✓ Goal: "I just want to be able to sleep through Jan."   │
│   captured Mar 12 by Scott Brynjolffson via + Ask        │
│ ✓ Blocker: Seasonal cashflow stress · $12K/quarterly     │
│   captured Apr 8 by Scott Brynjolffson via + Ask         │
│ ✓ Industry pattern: Catering — seasonal                   │
│   system-derived                                          │
└─────────────────────────────────────────────────────────┘
```

### D.3 Header zone

- Objective name (Discover / Measure / Consult / Navigate) + "for {Track name}"
- Question framing (verbatim from V2_OBJECTIVE_QUESTIONS): "Do we understand how their business can grow?" etc.

### D.4 Top zone — missing-factor CTAs

For each evidence ref in the current Track's `required_evidence_per_objective[objective]` that is NOT captured:

- Render as a checkbox-style row (visual: empty checkbox + text)
- Text: factor diagnostic question (humanized for banker)
- Click → opens corresponding capture form per Block E, pre-selected to that factor

CTAs are listed in priority order: strong-supporting factors first, then moderate, then "neutral" (factors that aren't supporting in the matrix but are required by the Track template).

### D.5 Bottom zone — captured evidence rows

For each captured FactorCapture (or related capture entity — Signal, SizingMeasurement, Model, ShowEvent, Reaction) for this objective:

Each row is a structured display:
- Type prefix (Trigger / Goal / Blocker / Indecision / Sized / Model / Reaction / etc.)
- Captured value (figures bolded; quotes italicized; tags chip-styled)
- Capture metadata (date · banker name · capture activity)

**No prose narrative.** Every element is a structured field. The row's job is to display *what was captured*, not to summarize or interpret.

If a captured factor has a verbatim Member quote attached (via source_signal_id linkage), display the quote as italicized blockquote within the row.

### D.6 Banker-facing copy discipline (non-negotiable)

Per COMPLIANCE.md §10.2, **never** use these phrases anywhere in popup content:

- "Recommended for"
- "Eligible for"
- "Candidate tracks"
- "Bumped to candidate track"
- "Pre-qualified"
- "Approved" / "Approval-track" / "Approval-bound"

Always frame as "supports" / "supported by evidence" / "advances this candidate."

If CC encounters wording uncertainty, default to the cleanest neutral framing and document in BUILD_LOG; visual review will confirm.

### D.7 GenAI filler discipline (non-negotiable)

Per Francisco's repeated framing across this build: **no manufactured prose**. Every element in the popup must be sourced from a structured field or a verbatim capture. If there's nothing structured to display for a position in the layout, leave it empty — don't fill with paraphrase.

This means the popup looks more sparse than CC might want to populate. That's correct. Captured facts earned their display; missing facts are absent.

### D.8 Modal vs drawer

CC chooses. Modal (full-attention overlay) is recommended for popup-as-workflow because the banker is doing focused work; drawer (partial overlay preserving page context) works if visual review prefers context preservation. Either is acceptable; document the choice in BUILD_LOG.

### D.9 Acceptance criteria for Block D

- [ ] Click objective in sidebar → opens popup-as-workflow surface
- [ ] Header shows objective + Track name + question framing (verbatim from V2_OBJECTIVE_QUESTIONS)
- [ ] Top zone shows missing-factor CTAs in priority order
- [ ] Bottom zone shows captured evidence rows with structured fields (no prose mush)
- [ ] All four objectives renderable for all three fixtures
- [ ] No banned phrases per §10.2
- [ ] No GenAI filler — every element is sourced from structured data

---

## Block E — Capture form linking from popup CTAs

### E.1 Click-target for missing-factor CTAs

When a banker clicks a missing-factor CTA in the popup top zone, the corresponding capture form opens with the factor pre-selected.

For each factor's `capture_mode`, the click target is:

- `numerical` factors → + Quantify form, matrix-aware mode, factor pre-selected
- `boolean` factors → + Quantify form, matrix-aware mode, factor pre-selected (capture mode renders yes/no toggle)
- `qualitative_select` factors → + Quantify form, matrix-aware mode, factor pre-selected (renders dropdown)
- `qualitative_multi` factors → + Quantify form, matrix-aware mode, factor pre-selected (renders multi-select)

For symbolic evidence refs (model_produced, model_shown, reaction_captured):

- "model_produced" → + Model form
- "model_shown" → sidebar artifact preview "Mark as shared" affordance (or auto-create on with-Member Model save)
- "reaction_captured" → + Reaction form

### E.2 Pre-selection mechanism

When the popup CTA opens a capture form, pass the factor_id (or symbolic ref) as a query param or state. The capture form initializes with that factor selected; banker fills in the value.

Implementation: the capture forms (+ Quantify, + Ask, + Reaction, + Action, + Model) gain an optional `preselected_factor_id` prop. When present, the form opens with the factor pre-selected and the diagnostic question rendered prominently.

### E.3 Returning to popup after capture

After the banker submits the capture form, the popup updates to reflect the new captured evidence:

- The CTA for that factor disappears from the top zone
- A new evidence row appears in the bottom zone
- If all required evidence for the objective is now captured, the popup updates to "complete" state (or banker is returned to sidebar)

CC may choose to either reload the popup after capture or use optimistic UI updates; either is acceptable for the demo.

### E.4 Acceptance criteria for Block E

- [ ] Each missing-factor CTA opens the correct capture form
- [ ] Capture form opens with factor pre-selected
- [ ] After capture, popup updates to reflect new evidence
- [ ] Symbolic refs (model_produced, etc.) route to correct forms

---

## Block F — Track switching UX

### F.1 Current state

Sprint 5a.1 sidebar Track context is read-only — shows top-ranked Track only. Visual review confirmed this works as foundation.

### F.2 Make Track context interactive

The sidebar Track context becomes a dropdown/popover. Click → reveals all candidate Tracks ranked by `rankTracksForMember` output:

```
[ Track context ▾ ]                    
  Working Capital LOC · strong (5s/1m)  ← currently selected (default top)
  SBA 7(a) Loan · moderate (2s/3m)
  Treasury Services Upgrade · moderate (0s/3m)
  Commercial Real Estate Term Loan · insufficient (0s/3m/1neg)
```

Each ranked Track shows:
- Track name
- Strength label (strong / moderate / insufficient)
- Counts per matrix entry tier (Xs/Ym/Zneg) — e.g., "5s/1m" means 5 strong + 1 moderate matrix entries fired

### F.3 Selecting a different Track

Click a different Track in the dropdown → page state updates:
- Sidebar Track context shows newly-selected Track
- Dot composition re-renders per Block B (new Track's required_evidence_per_objective)
- Popup-as-workflow content updates per Block D (new Track's missing-factor CTAs)
- Captured evidence in bottom zones unchanged (captures are invariant; rendering is Track-relative)

### F.4 State persistence

Track selection persists per session (not per page load). If banker selects "SBA 7(a)" view for Jenny, navigates away, comes back: SBA 7(a) is still selected. Use sessionStorage keyed by member_id.

When a banker opens a Member page for the first time in a session, default to top-ranked Track per ranker output.

### F.5 Empty-state behavior

If `rankTracksForMember` returns empty array (Member below 2-evidence threshold), Track context dropdown shows:
- "Track context: insufficient evidence yet"
- Disabled dropdown (no Tracks to switch to)
- Dots fall back to generic EVIDENCE_FRAMEWORK rendering per Block B.3

### F.6 Acceptance criteria for Block F

- [ ] Sidebar Track context renders as interactive dropdown
- [ ] Dropdown lists all ranked Tracks per ranker output
- [ ] Each Track shows strength label and matrix-tier counts
- [ ] Selecting a different Track re-renders dots and popups against new Track
- [ ] Selection persists per session via sessionStorage
- [ ] Empty-state behavior renders correctly

---

## Block G — Real-time ranker re-execution

### G.1 Current state

Sprint 5a.1 ranker (`lib/track-ranker.ts`) runs server-side, computes ranking from FactorCaptures at render time. Currently invoked once per Member page load.

### G.2 Re-rank on capture

When a new FactorCapture is created (via + Quantify matrix-aware mode, + Ask factor-tag dropdown, or popup CTA flow), re-run `rankTracksForMember` and update the sidebar Track context.

Implementation pattern: after the capture form save action commits, the calling component triggers a refetch of the ranker output. Either:

- **Option A:** Server action returns updated ranking alongside capture confirmation; client updates state.
- **Option B:** Client invalidates the ranker query; refetches.
- **Option C:** Page-level revalidation pattern (Next.js `revalidatePath` or similar).

CC chooses based on existing patterns in the codebase. Either way, the visible result: capturing a new factor updates the Track switchboard within ~1-2 seconds without manual page refresh.

### G.3 Edge cases

- New capture pushes Member from below-2-evidence-threshold to above: Track context dropdown becomes populated.
- New capture causes a Track to become top-ranked when previously second: sidebar Track context label updates.
- New capture doesn't change ranking: no visible change to sidebar; just the new evidence row in popup.

### G.4 Acceptance criteria for Block G

- [ ] Capturing a new factor triggers ranker re-execution
- [ ] Sidebar Track context updates with new ranking
- [ ] No manual page refresh required
- [ ] Edge cases handle gracefully (threshold crossings, top-Track changes)

---

## Block H — Governance updates

### H.1 BUILD_LOG.md entry

Comprehensive entry covering:
- What shipped per block (A-G)
- Operator extensions added to evaluator (LENGTH plus any others surfaced)
- Track-relative dot derivation logic
- Popup-as-workflow architectural decisions (modal vs drawer; pre-selection mechanism; refresh pattern)
- Track switching UX implementation
- Real-time ranker re-execution pattern chosen
- Decisions made during implementation
- Cross-references to BUSINESS_FACTOR_MATRIX_v1.md Section 4 for popup expectations

### H.2 OPEN_QUESTIONS resolutions

Sprint 5a.2 closes the following questions logged earlier:
- Q-A1 (full per-objective panel) → **Resolved by Block D popup-as-workflow surface.** Mark resolved.
- Q-A2 (open-thread tiebreaker) → Update if Block D's bottom-zone evidence row design surfaces enough behavior to resolve; otherwise keep open.

### H.3 CLAUDE.md manifest

Add new components and lib files to the manifest:
- Popup-as-workflow component (path TBD per CC's component naming)
- Track switching dropdown component
- Pre-selection prop additions to capture forms

### H.4 No ARCHITECTURE_V2 / EVIDENCE_FRAMEWORK changes expected

The architectural commitments in those docs are stable; this sprint executes against them, doesn't extend them. If implementation surfaces a need to update either doc, surface to Francisco rather than editing canonical docs unilaterally.

### H.5 Acceptance criteria for Block H

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS Q-A1 resolved; Q-A2 status updated as appropriate
- [ ] CLAUDE.md manifest reflects new files
- [ ] No silent canonical-doc edits

---

## Pilot deferrals to honor

Sprint 5a.2 does not ship:

- Insight Engine portfolio surfaces (Track Performance, Member portfolio, Coverage and indecision, Stage-skip, Macro context) — Sprint 5b
- v1 retirement — Pilot decision
- Mobile responsive — Pilot or post-EVP polish
- Member-Type guidance further refinement (Francisco's editorial pass already complete)
- Date-arithmetic operators in evaluator — Pilot
- COUNT, regex, advanced operators in evaluator — Pilot
- Stale-signal-refresh re-evaluation logic — Pilot
- Notification routing on Track-rank changes — Pilot
- Offline-capable capture flows — Pilot

If a question arises during 5a.2 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively. Do not anticipate Sprint 5b or Pilot work in this turn.

---

## Reporting back

When Sprint 5a.2 is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Operator extensions added to evaluator (with grammar additions)
3. Visual probes (screenshots if browser available, HTML probes if not) of:
   - Jenny's page with captured-only dots (no faint ghosts) and "+ next valuable" affordance per objective
   - Jenny's Discover popup-as-workflow showing missing-factor CTAs and captured evidence rows
   - Northland's Discover and Measure popups with Track-relative dot composition
   - Cygnus's Discover popup with all required evidence captured ("complete" state)
   - Sidebar Track context dropdown showing ranked Tracks with strength tiers
   - Track switching: select a different Track → dots and popups re-render
   - + Quantify form opening from popup CTA with factor pre-selected
4. Per-fixture sanity check: do popup contents match `BUSINESS_FACTOR_MATRIX_v1.md` Section 4 expectations?
5. Real-time re-rank verification: capture a new factor → sidebar updates within 1-2 seconds
6. Any deviations from spec with rationale
7. Any new questions logged to OPEN_QUESTIONS
8. Any acceptance-criteria items that proved infeasible (with explanation)

Visual review will probe each block independently. Plan the diff structure so each block is delimited.

---

## Estimated scope

2-3 effective build days. The biggest blocks:
- **Block D (popup-as-workflow surface)** — substantial UX work; structured-fields-only discipline requires careful attention to copy
- **Block B (Track-relative dot derivation)** — non-trivial logic; per-fixture rendering must match expected behaviors
- **Block F (Track switching UX)** — moderate UX work; state management for dropdown + persistence

Smaller blocks (A operator extension, C dot simplification, E pre-selection plumbing, G real-time ranker, H governance) are straightforward.

If scope creep emerges, **stop and re-scope with Francisco** before shipping. Sprint 5a.2 is the demo-critical sprint — popup-as-workflow surfaces and dot simplification are what make the matrix banker-usable.

After Sprint 5a.2 ships and visual review confirms (popups feel like workflow surfaces; dots feel honest; Track switching works), Sprint 5b (Insight Engine portfolio surfaces) is the next major sprint. Sprint 6 (polish + EVP demo deploy) follows Sprint 5b.

This is the demo-critical sprint. Everything we've architected from Sprint 4 onward — the two-layer model, the four-objective vocabulary, the five-activity dialpad, the matrix data, the rule engine — comes together in the popup-as-workflow surface where bankers actually do the consultative work. Get this right, and the EVP demo lands. Onward.
