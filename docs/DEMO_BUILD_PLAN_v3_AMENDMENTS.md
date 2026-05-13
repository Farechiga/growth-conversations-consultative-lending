# DEMO_BUILD_PLAN_v3_AMENDMENTS.md

**Sprint sequence revision following the v2 architectural pivot. Companion document to DEMO_BUILD_PLAN.md v2.1; does not replace the source plan but supersedes the relevant sprint sections. Read this together with the source plan.**

**Authored:** 2026-04-29 after the v2 design conversation that produced ARCHITECTURE_V2.md, EVIDENCE_FRAMEWORK.md, and COMPLIANCE.md.

**Path commitment:** Path C-modified (per the scope-discipline conversation). Ship v2 as the primary EVP demo surface, deprecate most v1 polish work, ship compliance posture floor before v2 work begins.

**Cross-references:** ARCHITECTURE_V2.md (the v2 architecture being built), EVIDENCE_FRAMEWORK.md (operational evidence catalog CC implements against), COMPLIANCE.md (the compliance floor that ships first).

---

## 1. What this document supersedes

The original DEMO_BUILD_PLAN.md v2.1 §3 specified Sprint 4 = 5 prompts (4.1-4.5) shipping the Growth Conversations stage-keyed UI, with Sprint 5 = Insight Engine and Sprint 6 = polish/deploy.

The actual build trajectory and the v2 architectural pivot make that plan stale. This document specifies the revised sprint sequence reflecting:

- Sprint 4 prompts 4.1a, 4.1b, 4.1c, 4.1d, 4.2a (3 blocks), and refinement turns 1-2 already shipped (per BUILD_LOG)
- Path C-modified scope going forward
- v2 as the primary demo surface, with v1 retained for fallback during build
- Compliance posture as the non-negotiable floor

The original plan's Sprint 1, Sprint 2, Sprint 3, and the early portions of Sprint 4 remain as historical record. From this point forward (post current refinement turn 2), the sequence below applies.

---

## 2. Path C-modified — the committed scope

### 2.1 What's in

| Track | Scope | Sprint | Estimate |
|---|---|---|---|
| Compliance posture floor | Field labels, banner disclaimer, helper text, submit-time keyword scan, banker training surface scaffolding | Sprint 4.6 | 1-2 days |
| v2 prototype phase 1 — foundation | New /v2/members/[id] route; page layout (header, key facts, dialpad, sidebar, captured feed); Objective entity; dot system component; capture card variants; reused capture forms; seed data enrichment; feature flag | Sprint 4.7 (foundation) | 3-4 days |
| v2 prototype phase 1 — content | + Model and + Show capture flows with new entities; + Reaction capture form; Tracks-supported-by-current-evidence panel; key facts strip computation; coach affordance scaffold; v1↔v2 cross-linking | Sprint 4.7 (content) | 2-3 days |
| Insight Engine in v2 style | Five views (Track Performance, Member portfolio overview, Coverage and indecision diagnostics, Stage-skip analytics, Macro context); cohort-query infrastructure shared with v2 inquiry-tracks; anonymizeForBanker integration; "What's actionable now" banner | Sprint 5 | 4-5 days |
| Polish and deploy | Demo polish across v2 surfaces; admin reset; Vercel deployment; final v1↔v2 cohabitation testing; demo run-through with Francisco | Sprint 6 | 1-2 days |

**Total: 11-16 effective CC days. Realistic calendar: 3-4 weeks at current pace.**

### 2.2 What's out (scoped down or deferred)

| Track | Original status | Path C-modified disposition |
|---|---|---|
| v1 visual review fixes (original 9 issues) | Was Sprint 4.5-equivalent | **Deferred.** Most fixes are organic to v2 (anchor jumping retired, current-stage indicators retired, Connect-handoff propagation reorganized). Only fix what blocks demo flow between v1 and v2 (the "Classic view ↗" link). |
| Full Wave 1 compliance tagging sweep | Was Sprint 4.5-equivalent | **Deferred to post-EVP.** Compliance posture floor (Track 1) ships taxonomy fixes and helper text; full schema-wide tagging waits. |
| Immutable decision-trace log (Sprint 4.5) | Designed during compliance conversation | **Deferred to post-EVP / Pilot.** The architectural pattern is documented in COMPLIANCE.md §11 as a Pilot transition requirement. Demo does not ship the trace log. |
| Sprint 4 Prompt 4.2b (Show + Connect capture forms in v1) | Originally planned | **Cancelled.** v2 supersedes; Show and Connect become activities in v2. |
| Sprint 4 Prompt 4.3 (Skip handling in v1) | Originally planned | **Cancelled.** v2's activity model has no stages to skip. |
| Sprint 4 Prompt 4.4 (Atomic save + propagation in v1) | Originally planned | **Cancelled.** v2 ships its own save/state pattern. |
| Sprint 4 Prompt 4.5 (Integration polish + edge cases for v1) | Originally planned | **Cancelled.** Same reason. |
| v2 phase 2 features (rich popup detail panels, telemetry-driven keyword calibration, multi-objective evidence support) | Designed during conversation | **Deferred.** Phase 1 ships the foundation; phase 2 lands post-EVP if time and learning support. |

### 2.3 The strategic case for Path C-modified

The cancelled work isn't lost — it's superseded. v2 reorganizes around the activities and objectives that the cancelled prompts were trying to express through stages. The structural pivot makes the remaining v1 polish redundant.

The demo story that results: "Here's where we started (v1, accessible via Classic view), here's where we ended (v2, the actual workstation), and here's the architecture that powers both (Insight Engine)." Strong narrative arc; honest about the design journey; demonstrates substantive iteration toward the right answer.

The risk: less polish on v1 means the Classic view affordance shows v1 in something close to its current state. Acceptable because v1 is contextual, not central, in the demo flow.

---

## 3. Sprint 4.6 — Compliance posture floor

**Objective:** Ship the compliance floor before v2 work begins, so v2 inherits the right foundation.

**Authoritative reference:** COMPLIANCE.md §6 (business-factor-only taxonomy), §7 (banker-prose discipline), PROTECTED_CLASS_KEYWORD_LIST_v1.md (final keyword list pending Francisco's editorial review).

### 3.1 Deliverables

1. **Field label fix** in current Resolve form: "Decline reason" → "Member's stated reason for declining" (when `member_response ∈ {declined, dismissive}`).
2. **Enum value labels softened:** `bank_capability` displays as "Service or capability concern" (formerly "Doesn't trust the institution" or similar UDAAP-fraught language).
3. **Decline-reason taxonomy refactor** to the business-factor-only set per COMPLIANCE.md §6.1. Ten enum values; no `does_not_qualify` value; no bank-side determination values. Marker migration required.
4. **Banner-level disclaimer** on /growth-conversations route: "Member Signals supports consultative banker conversations. It does not make credit decisions, generate adverse action notices, or substitute for formal underwriting." Visible once per session (dismissible after first read).
5. **Helper text** on the four free-text fields (Customer response, Closing notes, Methodology note, optional Description fields). Standard phrasing per COMPLIANCE.md §7.2.
6. **Submit-time keyword scan** infrastructure: keyword list loaded from `lib/compliance-keywords.ts` (sourced from finalized PROTECTED_CLASS_KEYWORD_LIST_v1); on submit, scan free-text fields case-insensitive whole-word with Unicode normalization; if hit, display soft advisory prompt with three actions (Continue saving / Edit / Cancel); telemetry logged.
7. **Banker training surface scaffold:** "Capture discipline" callout accessible from the Growth Conversations page (and v2 workstation when it ships). 100-word framing per COMPLIANCE.md §7.5.
8. **OPEN_QUESTIONS.md updates:** Q-041 resolved with reference to COMPLIANCE.md §6; Q-042 logged for Pilot resolution; Q-013 noted as superseded by the new taxonomy.
9. **BUILD_LOG.md entry** for the sprint.

### 3.2 Acceptance criteria

- All four free-text fields show business-factor helper text on focus or as persistent label
- Submit-time scan triggers correctly on test phrases (e.g., "Member's wife mentioned…" fires; "Member said the rate was uncompetitive" does not fire)
- Disclaimer banner visible on first /growth-conversations load per session
- Field labels and enum values updated in Resolve form for both engaged-spectrum and declined-spectrum response states
- Telemetry events logged for keyword scan fires and banker actions taken
- `compliance-keywords.ts` matches the finalized keyword list
- pnpm tsc --noEmit clean; pnpm build clean

### 3.3 Out of scope for this sprint

- Full Wave 1 compliance tagging sweep across schema (deferred)
- Immutable trace log (deferred)
- v2 work (next sprint)

### 3.4 Estimate and dependencies

- 1-2 effective CC days
- **Dependency:** PROTECTED_CLASS_KEYWORD_LIST_v1.md must be finalized (Francisco's editorial review of E1-E6 plus term-level objections) before this sprint starts

---

## 4. Sprint 4.7 — v2 prototype phase 1

**Objective:** Ship the v2 Member workstation with Pattern A architecture, four objectives, dot system, key facts, captured feed, and Tracks-supported panel.

**Authoritative references:** ARCHITECTURE_V2.md (the design), EVIDENCE_FRAMEWORK.md (the operational catalog), COMPLIANCE.md (the framing constraints).

This sprint is intentionally split into two CC turns due to scope. Foundation first, content second. Each turn ships as a checkpoint with visual review before the next.

### 4.1 Sprint 4.7-foundation (Turn 1)

**Deliverables:**

1. **New route at /v2/members/[id]** parallel to existing /. Uses Next.js route groups for clean separation.
2. **Feature flag mechanism** so v2 is opt-in. Banker setting or query string. Demo-day, toggled on.
3. **Page collapse** — single workstation per Member. No separate Member Profile / Growth Conversations split in v2.
4. **Page header component** — Member name + tagline + open-thread coral badge; per BLAZE_STYLE_GUIDE typography hierarchy.
5. **Key facts strip component** — horizontal strip with 3-5 curated facts per Member; clickable; per ARCHITECTURE_V2.md §6.2.
6. **Activity dialpad component** — 7 buttons (Ask, Quantify, Model, Show, Reaction, Resolve, Action) in a horizontal row. Per ARCHITECTURE_V2.md §6.3.
7. **Sidebar component** — Objectives section with 4 objectives, Artifact slot, Macro slot, History affordance, Coach affordance. Per ARCHITECTURE_V2.md §6.4.
8. **Dot system component** — four states (filled, outlined, faint, accented); 8px diameter; clickable per ARCHITECTURE_V2.md §5.3.
9. **Objective entity** in schema (per ARCHITECTURE_V2.md §11.1; may implement as derived view rather than persisted records).
10. **Cross-linking** from v1 to v2 ("Try the new view →") and v2 to v1 ("Classic view ↗").
11. **Empty captured feed scaffolding** — main panel renders with empty-state placeholder; actual capture cards follow in Turn 2.
12. **Strict BLAZE_STYLE_GUIDE typography hierarchy compliance** — not the flatter hierarchy in early v2 mockups. Display weight on Member name; heading weight on objective names and capture labels; caption weight on type tags; body weight on detail prose; italic with left-rule mark on Member quotes.

**Acceptance criteria for Turn 1:**

- v2 route loads for all three Member fixtures
- Header, key facts strip, dialpad, sidebar render with correct content per fixture
- Dot states render correctly (filled/outlined/faint/accented)
- Click-to-expand panels work for objective names and dots (basic in-place panels, content-light)
- Cross-links to v1 work bidirectionally
- pnpm tsc --noEmit clean; pnpm build clean
- BLAZE_STYLE_GUIDE typography hierarchy verified visually

### 4.2 Sprint 4.7-content (Turn 2)

**Deliverables:**

1. **+ Model capture form** with new Model entity per ARCHITECTURE_V2.md §11.2; "With Member" / "Banker draft" radio; parameters/assumptions/output capture; surfaced as modal or right-drawer.
2. **+ Show capture form** with new ShowEvent entity per ARCHITECTURE_V2.md §11.4; references existing Artifact and optional Model; surfaced as modal or right-drawer.
3. **+ Reaction capture form** with new Reaction entity per ARCHITECTURE_V2.md §11.3; response value enum + verbatim Member quote; surfaced as modal or right-drawer; submit-time keyword scan applies to quote field.
4. **+ Ask, + Quantify, + Resolve, + Action surfaces** — reuse existing v1 capture forms with light wrapper changes to surface as modal/drawer from dialpad rather than inline section.
5. **Tracks-supported-by-current-evidence panel** — surfaces inside the Identify objective when clicked; uses careful framing language per COMPLIANCE.md §10.2; renders 3-5 Tracks ranked by strength band; demo data hand-curated per Member fixture per EVIDENCE_FRAMEWORK.md §5.4.
6. **Captured feed** — six capture card variants (one per activity); sorted recent-first; click-to-expand inline with augmenting summary detail; per ARCHITECTURE_V2.md §6.5.
7. **Key facts strip computation** — facts authored per Member fixture seed; clickable to source evidence detail panels.
8. **Coach affordance "show ?"** — scaffolded with existing 18 stage-guidance paragraphs reorganized under the four objectives. Default collapsed; click expands inline help.
9. **Member fixture seed enrichment** — 5-7 verbatim Member quotes per Member distributed across goals, blockers, indecision, reactions. CC drafts; Francisco reviews and edits.
10. **All capture flows wired through compliance scan** — banker-prose fields in any v2 capture form fire the submit-time scan from Sprint 4.6.
11. **BUILD_LOG.md entry** comprehensive across both turns.

**Acceptance criteria for Turn 2:**

- All seven activity buttons surface their capture forms
- + Model form captures Model entity with all required fields including the With-Member/Banker-draft distinction
- + Show form captures ShowEvent referencing existing Artifact
- + Reaction form captures Reaction with optional verbatim quote; quote subject to scan
- Tracks-supported panel renders inside Identify objective for all three fixtures with strong/moderate/insufficient bands
- Captured feed renders all six card variants with correct typography
- Empty-state nudge displays at bottom of feed
- show ? affordance expands to existing coaching content reorganized by objective
- Member fixture seed includes the enriched quotes
- pnpm tsc --noEmit clean; pnpm build clean

### 4.3 Combined estimate

- Turn 1: 3-4 effective CC days
- Turn 2: 2-3 effective CC days
- **Total Sprint 4.7: 5-7 effective CC days**

### 4.4 Out of scope for Sprint 4.7

- Confidence-band threshold algorithms (hand-curated per fixture)
- Telemetry-driven keyword calibration (Pilot work)
- Multi-objective evidence support beyond simple primary mapping
- Rich popup detail panels (basic inline expansion only)
- Mobile/narrow-viewport optimization
- Insight Engine v2 (next sprint)

---

## 5. Sprint 5 — Insight Engine in v2 style

**Objective:** Ship the Insight Engine destination module using Pattern A architecture and the cohort-query infrastructure that v2 phase 1 introduced.

**Authoritative references:** INSIGHT_ENGINE_DESIGN_NOTES.md (the five-view design), ARCHITECTURE_V2.md §10 (cohort query reuse with v2 inquiry-tracks), COMPLIANCE.md (anonymization discipline).

### 5.1 Deliverables

1. **/v2/insight-engine route** (or /v2/insights — final naming TBD).
2. **Pattern A portfolio variant** — adapts the workstation layout for cross-Member views; sidebar shows view selector instead of objectives; main panel renders the chosen view.
3. **View 1 — Track Performance** — for each Growth Track, total runs, stage advancement counts, average time-to-decision (where N permits), skip rates, most common indecision types. Demo data: each Track has ~1 run; renders absolute counts honestly with "production scale" annotation.
4. **View 2 — Member portfolio overview** — banker's own book organized by Member Type; per Member: active opportunities, member_response state, last touch date, ownership; color-coded indicators for opportunities at risk.
5. **View 3 — Coverage and indecision diagnostics** — Trigger Signals surfacing without corresponding Track to address; indecision types most common across opportunities with resolution rates; Member Types underserved by current Tracks.
6. **View 4 — Stage-skip analytics** — rendered with explicit "production data needed" annotation given demo's thin skip data.
7. **View 5 — Macro context** — lists current Macros with summaries, affected Member Types, banker recommendations.
8. **Cohort-query infrastructure** — the same query layer that powers v2 inquiry-tracks panel powers View 1. One query, two surfaces.
9. **anonymizeForBanker() integration** — verified across all five views per COMPLIANCE.md §3.
10. **"What's actionable now" persistent banner** — at top of Insight Engine; surfaces the 1-3 most actionable items across the banker's portfolio.
11. **Cross-links** — clicking a Member in View 2 navigates to v2 workstation; clicking a Track in View 1 surfaces Track detail.
12. **BUILD_LOG.md entry.**

### 5.2 Acceptance criteria

- All five views render with appropriate demo or annotated data
- Cohort queries work for both v2 inquiry-tracks and Insight Engine View 1
- Anonymization verified: when banker views their own data, full detail; when banker views aggregate cross-banker data, anonymized per anonymizeForBanker
- "What's actionable now" banner surfaces correctly per banker fixture
- Navigation from Insight Engine to individual Member workstations works
- pnpm tsc --noEmit clean; pnpm build clean

### 5.3 Out of scope for Sprint 5

- View 4 (Stage-skip) at full data fidelity (demo data thin; render with annotation)
- Cross-institutional insights
- Real-time research feed integration for Macros
- Banker-personalized priority weighting on insights
- Compliance officer dashboard variant (Pilot work)

### 5.4 Estimate

- 4-5 effective CC days

---

## 6. Sprint 6 — Polish and deploy

**Objective:** Final polish for EVP demo and Vercel deployment.

### 6.1 Deliverables

1. **Demo polish across v2 surfaces** — visual review-driven fixes; typography consistency check; animation/transition polish; loading states.
2. **Admin reset** — single admin action to reset the demo to seed state. Per SCOPE.md §2 definition-of-done item 6.
3. **Vercel deployment** — production-ready deploy to a public URL.
4. **Final v1↔v2 cohabitation testing** — verify both views render correctly, cross-links work, no broken paths.
5. **Demo run-through with Francisco** — full-flow walk-through of the EVP demo narrative; iteration on any rough edges.
6. **Final BUILD_LOG.md entry** summarizing the build and listing deferred items (per SCOPE.md §2.9).
7. **IMPLEMENTATION_STATUS.md** showing all in-scope items as verified (per SCOPE.md §2.10).
8. **README.md update** with deployment URL and access instructions.

### 6.2 Acceptance criteria

- Demo URL is live and accessible
- Three Member fixtures (Jenny, Northland, Cygnus) render fully end-to-end in both v1 and v2
- All banker-facing strings use locked vocabulary per CLAUDE.md §5
- Admin reset works
- BUILD_LOG and IMPLEMENTATION_STATUS reflect final state
- All SCOPE.md §2 definition-of-done items verified

### 6.3 Estimate

- 1-2 effective CC days

---

## 7. Total build forecast

**Sprint 4.6 + Sprint 4.7 + Sprint 5 + Sprint 6 = 11-16 effective CC days.** At current pace (roughly one CC day per 1-2 calendar days due to review cycles), this is **3-4 calendar weeks** from current state to deployed demo.

This forecast assumes:
- Francisco's editorial reviews on PROTECTED_CLASS_KEYWORD_LIST_v1, ARCHITECTURE_V2, EVIDENCE_FRAMEWORK, and COMPLIANCE happen in the first week
- Member fixture seed quotes authored in the first week (CC drafts; Francisco reviews/edits)
- No major scope additions during the build
- v2 Turn 1 visual review surfaces no major architectural rework

If any of these slip, calendar extends proportionally. The risk areas:
- v2 phase 1 is the largest single sprint; complexity surprises possible
- Sprint 5 cohort-query infrastructure is novel work; some iteration likely
- The demo narrative may benefit from one extra polish pass beyond Sprint 6

---

## 8. Sprint sequence visualization

```
[NOW] Refinement turn 2 complete
    │
    ▼
Sprint 4.6 — Compliance posture floor (1-2 days)
    │
    ├─ Pre-req: PROTECTED_CLASS_KEYWORD_LIST_v1 finalized
    │
    ▼
Sprint 4.7 — v2 prototype phase 1
    │
    ├─ Turn 1 — Foundation (3-4 days)
    │   └─ Visual review checkpoint
    │
    └─ Turn 2 — Content (2-3 days)
        └─ Visual review checkpoint
    │
    ▼
Sprint 5 — Insight Engine in v2 style (4-5 days)
    │
    ▼
Sprint 6 — Polish and deploy (1-2 days)
    │
    ▼
[DEMO]
```

---

## 9. Documentation prerequisites

Before each sprint kicks off, these documents must be in their final state:

| Sprint | Required documents |
|---|---|
| Sprint 4.6 | PROTECTED_CLASS_KEYWORD_LIST_v1 (finalized); COMPLIANCE.md (current draft sufficient) |
| Sprint 4.7 | ARCHITECTURE_V2.md, EVIDENCE_FRAMEWORK.md, COMPLIANCE.md (all current drafts sufficient); MEMBER_FIXTURE_BRIEF.md updated for v2 quote enrichment |
| Sprint 5 | INSIGHT_ENGINE_DESIGN_NOTES.md updated for v2 alignment (currently has §9.5 addendum; needs ARCHITECTURE_V2 cross-reference); ARCHITECTURE_V2.md §10; EVIDENCE_FRAMEWORK.md §5 |
| Sprint 6 | All of the above; SCOPE.md unchanged; BUILD_LOG.md current through Sprint 5 |

---

## 10. Documents that this update affects

This update modifies the operational meaning of several existing documents:

- **DEMO_BUILD_PLAN.md** — Sprint 4 §3 sprint structure superseded for prompts 4.2b onward. Original document remains as historical record; this amendment is read as the current truth.
- **OPEN_QUESTIONS.md** — Q-041 closes (per COMPLIANCE.md §6); Q-042 opens (pre-application observation); Q-029 (track-agnostic step_phase enum) noted as superseded by v2 four-objective model; new Q-A1 through Q-A5 from ARCHITECTURE_V2.md §13 should be logged.
- **BUILD_LOG.md** — Sprint 4.6 and Sprint 4.7 will be the next major entries.
- **SCOPE.md** — §3 (in scope) and §4 (out of scope) need light update to reflect v2 architectural pivot. Three modules language updates from "Member profile / Growth Conversations / Insight Engine" to "v2 Member workstation / Insight Engine" with v1 noted as legacy-retained. §3.2 fixture targets unchanged.
- **CLAUDE.md** — Section 5 vocabulary lock should add v2 terms (workstation, objective, activity, dot, open thread, evidence) and retire stage/phase/step from banker-facing language.

These updates can land alongside Sprint 4.6 work or as a small documentation-only commit before Sprint 4.6.

---

**End of DEMO_BUILD_PLAN_v3_AMENDMENTS.md.**
