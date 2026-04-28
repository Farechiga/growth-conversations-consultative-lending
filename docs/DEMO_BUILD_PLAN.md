# DEMO_BUILD_PLAN.md

**Strategic overview and executable build plan for the Blaze Member Signals demo. This document sits above the existing governance set (CLAUDE.md, SCOPE.md, OPEN_QUESTIONS.md, BUILD_LOG.md, BLAZE_STYLE_GUIDE.md, MEMBER_FIXTURE_BRIEF.md) as the single source of truth for what gets built, in what order, against what acceptance criteria.**

**Version 2.1.** Last updated: 2026-04-27 (after Insight Engine architectural conversation following Sprint 2 review). Supersedes the v1 planning doc from 2026-04-25.

**What changed in v2:** The Meeting Recap module is renamed Growth Conversations and substantially expanded in scope. Track-agnostic Ask + Size phases separate from track-specific Show + Resolve. Single scrolling page with anchor progress bar replaces the original wizard-style page transitions. Stage skipping with audit captured. Signal longevity becomes an explicit architectural concept. Open opportunities + Open work bands merge. Recommendation gets `owned_by` and `updated_at` fields. Sprint 4 grows from 4-6 days to 6-8 days.

**What changed in v2.1:** The Insight Engine architecture is captured in INSIGHT_ENGINE_DESIGN_NOTES.md. Sprint 4 (Growth Conversations) now includes inline insight surfaces (cross-cutting). Sprint 5 (Insight Engine) restructured to five views: Track performance, Member portfolio, Coverage and indecision diagnostics, Stage-skip analytics (NEW), and Macro context (NEW). New Macro entity for top-down market/regulatory/sector context. Anonymization layer for cross-portfolio insights within Blaze. Three-criterion "actionable insight" discipline applies across all surfaces. Sprint 5 grows from 3-4 days to 4-5 days. Total demo timeline extends accordingly.

**Audience:** Francisco (build oversight), Claude Code (execution), future stakeholders (post-demo handoff).

---

## 1. What the demo demonstrates

The Blaze Member Signals demo proves a strategic argument to the EVP of Lending: *that a lightweight enablement layer over HubSpot can transform consultative banking from craft-dependent to system-supported, without disrupting the relationship banker's existing workflow.*

The demo argues this through three connected demonstrations:

**Demonstration 1 — The Member profile as living relationship intelligence.** When Scott Brynjolffson opens Jenny's Catering, he sees not just contact information but a synthesis of every meaningful signal captured across her three-year relationship with Blaze, the active opportunities on the table, the open work demanding follow-up, and the prioritized next action. Every value on the page is auditable to the Growth step that captured it. Open opportunities are now the unified action surface — what was previously two separate bands (Active proposals + Open work) merges to reflect the underlying truth that ActionCards are the next steps within an opportunity, not parallel work.

**Demonstration 2 — Growth Conversations as continuous capture.** When Scott clicks "Run Growth Track" on a suggested next step, he enters Growth Conversations — a single scrolling page with all stages visible (Ask · Size · Show · Resolve · Decision pending · Funded), an anchor progress bar on the right, and stage-by-stage save behavior. The Ask + Size phases are track-agnostic, capturing member context that holds true regardless of which growth product surfaces; Show + Resolve are track-specific, conditioned on the Signals captured. When a banker re-enters Growth Conversations months after the last capture, prior Ask + Size signals are visible with timestamps; the banker can update stale captures, with the audit trail preserving prior state. Captured Signals can be skipped (with explicit confirmation and analytics tracking) for cases where the banker's judgment differs from the canonical Track. The discipline that distinguishes top-decile bankers from average ones (per SPIN Selling, Challenger, Activator research) becomes a system-enforced workflow without becoming a wizard.

**Demonstration 3 — The Insight Engine as cross-member intelligence.** Patterns across Members, Member Types, and Growth Tracks become visible to the Growth lead and to leadership. Coverage gaps in the canonical content surface as authoring queues. Aggregate performance of Tracks and Artifacts becomes measurable. Stage-skip patterns (where bankers diverge from the canonical sequence) become analytically visible — useful for identifying which Artifacts are landing and which aren't worth showing. Indecision diagnostics show why proposals stall. The system doesn't just enable the individual conversation; it learns from the population.

These three demonstrations together make the case: *Blaze can deliver the Petersen-Rajan relationship-banking spread (10-17 bps) systematically, not just through individual banker excellence.*

---

## 2. What's locked

The following decisions are stable and should not be reopened during build unless something in execution surfaces a real problem with them:

**Vocabulary (banker-facing):** Growth Track, Growth step, Growth Conversations (renamed from Meeting Recap), Topic, Member Type, Their words, Feeling, Follow up, Member profile, Insight Engine, Open opportunities (merged with Open work as of Sprint 2 Prompt 2), Signal, ActionCard, Artifact. Internal vocabulary (canonical_tag, capture_schema, Growth step shapes) never surfaces in banker-facing UI.

**Six Growth Step shapes (internal vocabulary):** Ask, Size, Show, Propose, Resolve, Connect. Used in code and design conversations; never visible to bankers.

**Eight core entities + Recommendation as first-class:** Member, Conversation, Signal, ActionCard, Recommendation, Growth step, Artifact, Growth Track. Reference data: Topic taxonomy, Industry Family, Product, Rule, Banker.

**Track entity model (updated v2):** A Growth Track represents a *track-specific* sequence of post-Signal steps (typically Show + Resolve, or Show + Connect for handoff Tracks). The pre-Track Ask + Size phases are NOT defined per-Track — they're track-agnostic discovery captures that surface Signals which the rule engine then matches to a Track. Operationally, a banker entering Growth Conversations always begins with Ask + Size (or reviews prior captures); the system surfaces matching Tracks once enough Signal data is captured.

**AI-native ontology principles:** Required descriptions on reference entities; named relationships maintained in lib/relation-names.ts; human-readable enum values; faithful summary as system primitive (lib/summaries.ts template registry with required-slot enforcement); verb pattern registry maintained in lib/verb-patterns.ts.

**Tech stack:** Next.js 16, TypeScript strict, React 19.2.4, Tailwind 4, shadcn/ui, Recharts 3.8, Prisma 7.8, SQLite (demo only — Postgres at Pilot phase), Zod 4.3, pnpm 10.33.2, Vercel deployment target.

**Visual identity:** Borderless typography-led design as the dominant pattern. Warm cream page ground (#F5EFE5). Burnished orange (#B45F26) used as accent only — section marks (orange rectangle), verb-prefix labels, hyperlinks, brand wordmark, primary CTAs, chart primary line. Tagged chip pattern (cool grey fill #F9FBFD, square edges, monospace) reserved for member-state values where the value is the primary signal (leaning yes, spouse, engaged). Labeled values (Field: value pattern) for descriptive captured fields where field name and value together convey meaning (Impact: painful, Timeframe: recent). Inline-bold with hover provenance for numeric measurements ($75K, $12K/quarterly, 45 days). Plain inline text for entity-categorizing metadata. Title-case section headers, not all-caps. Hairline rules in light cool grey (#E8EAEC) between bands. Progress visualization: small discrete dots with stage labels, adaptive to Track shape; stage labels clickable for navigation, dots are not.

**Three full-fidelity Members:** Jenny's Catering (Small Caterer · Starting), Northland Heating & Cooling (HVAC & Trades · Growing), Cygnus Bioscience (Specialty Manufacturer · Established). Three Growth Tracks, three Artifacts, three Member Types. Designed in MEMBER_FIXTURE_BRIEF.md.

**Demo "now" temporal anchor:** 2026-04-25. Featured Conversations are Apr 8 (Jenny), Apr 15 (Northland), Apr 21 (Cygnus).

**Verb registry pattern:** Every meaningful relationship in UI prose uses a canonical verb from lib/verb-patterns.ts. Verbs reuse identically across surfaces, not as approximations. New verbs require adding to the registry first.

**Member response single-field model:** Recommendation.member_response carries both sentiment and lifecycle position in a single 10-value enum (declined → leaning_no → dismissive → skeptical → confused → neutral → engaged → leaning_yes → committed → funded). No separate status field. Edge cases (paused, lost) handled by aging heuristics or response transitions.

**Two-path entry to Growth Conversations:** From a Member profile (member prefilled) or from the standalone module (banker selects Member from lookup). The two paths converge on the same scrolling page interface.

---

## 3. The build sequence — six sprints, multiple prompts per sprint

Each prompt is one self-contained handoff to Claude Code. CC executes the full prompt without intermediate user turns and reports back at the end. Larger sprints span multiple prompts.

**Total estimated effort from current state to demo-ready: 13-18 working days.** This represents a meaningful extension from v1's 11.5-15.5 day estimate, justified by the architectural expansion of Sprint 4 (Growth Conversations module).

### Sprint 1 — Member profile refinement pass — COMPLETE
**Estimate: 1 day · 1 prompt · accepted 2026-04-26**

Eliminated internal-vocabulary leaks, redesigned the sidebar as prioritized "what's hot" feed, reorganized layout, codified tag/chip discipline (now a four-tier discipline), propagated verb pattern, renamed acute_recent recency enum to recent. Foundational for everything that followed.

### Sprint 2 — Suggested Next Step intelligence + progress visualization — IN PROGRESS
**Estimate: 2 days · 2 prompts**

**Sprint 2 Prompt 1** (complete, accepted 2026-04-26): Schema simplification (member_response 10-value enum with funded as terminal); context-aware Suggested Next Step logic (advance_opportunity vs run_track modes); adaptive progress visualization with stage labels.

**Sprint 2 Prompt 2** (next): Mechanical refinement pass — step-position-based completion tracking (fixes Cygnus's two-Ask-step issue), Recommendation.updated_at field, Recommendation.owned_by field, progress dot repositioning, pipe separators between stage labels, Open opportunities + Open work band merger, ownership display.

**Acceptance criteria for Sprint 2 (cumulative):**
- member_response single-field model with 10-value enum
- Context-aware Suggested Next Step (advance_opportunity for engaged Recommendations; run_track otherwise)
- Adaptive progress visualization with stage labels (clickable)
- Step-position-based completion tracking (works correctly for Cygnus's two Ask steps)
- Recommendation.updated_at field
- Recommendation.owned_by field (defaulting to Member.primary_banker)
- Open opportunities + Open work bands merged into single band

### Sprint 3 — Multi-Member generalization
**Estimate: 1.5 days · 1-2 prompts**

Parameterizes /members/[id] dynamic route. Builds remaining two Artifacts (fleet ROI projection composed chart for Northland; capital event partnership map schematic for Cygnus). Verifies all discipline (chip patterns, verb patterns, sidebar priorities, progress visualization, ownership display) works cleanly across all three Members.

**Acceptance criteria:**
- All three Member profiles render correctly at /members/jenny, /members/northland, /members/cygnus
- Sidebar priorities differ meaningfully across Members (Cygnus's two ActionCards rank differently than Jenny's one overdue follow-up)
- Fleet expansion ROI projection chart (Northland) renders in its preview modal
- Capital event partnership map schematic (Cygnus) renders in its preview modal
- Cygnus's progress visualization shows distinct post-Track labels ("Specialist engagement", "Closed") for the Connect-ending track
- Ownership display correctly shows Marcus Webb on Cygnus's CRE opportunity vs Scott Brynjolffson on Jenny's and Northland's

### Sprint 4 — Growth Conversations module
**Estimate: 6-8 days · 4-5 prompts**

The destination of "Run Growth Track" — full structured capture interface accessible from both Member profiles and standalone module. Single scrolling page with anchor progress bar, stage-by-stage save, skip handling, signal longevity awareness. Per Module and Data Flow §3 (which itself needs reframing as part of this sprint).

This is the most consequential single sprint of the build. It's the moment the system stops being "a clever member dashboard" and becomes "an enablement system." It also represents the largest single chunk of work, both in absolute scope and in architectural ambition.

**Sprint 4 also incorporates inline insight surfaces** per INSIGHT_ENGINE_DESIGN_NOTES.md §5 Surface B. These are designed alongside the capture forms, not bolted on later. The actionable-insight discipline (three-criterion test) applies from the first capture form built. Insight surfaces appear during Ask, Size, Show, and Resolve phases when grounded in evidence and specific to context.

**Prompt decomposition:**
- **Prompt 4.1 (Day 1-2):** Route, shell, Member lookup component (for standalone entry path), single scrolling-page layout with anchor progress bar. Single Ask stage capture form working end-to-end with save. Track-agnostic for Ask + Size. Macro context banner integration on Member profile (when Macros exist in seed data) — depends on Macro entity which is added in this prompt. **Schema additions per Sprint 3 review (3a/3b/3c):** `Recommendation.size_low` + `Recommendation.size_high` (Decimal, both nullable, expected populated when captured) replacing freeform-prose size narrative; `Recommendation.product_subtype` (String, optional) for sub-type within a Product family; `ArtifactParameterCapture` model with `parameter_provenance` enum (`member_profile | captured_signal | banker_assumption | member_stated_in_followup`) linking captured parameters to their Show-step ArtifactShareRecord.
- **Prompt 4.2 (Day 2-4):** All four primary stages (Ask, Size, Show, Resolve) and the Connect alternative have working capture forms with validation. Real-time downstream preview panel. Signal longevity awareness — prior captures visible with timestamps; banker can update stale captures. Inline insight surfaces during each stage per INSIGHT_ENGINE_DESIGN_NOTES.md §5 Surface B. **Show step capture (per 3c):** form pre-populates Artifact parameters from Member profile + captured Signal magnitudes + prior captured Recommendations where possible (rendering each pre-fill with its provenance label — "from Member profile" / "from Size phase capture"); gap parameters with no auto-fill are highlighted for banker entry with provenance selection; banker overrides of pre-populated values are captured as `banker_assumption` provenance; on save, all parameters persist as `ArtifactParameterCapture` rows linked to the ArtifactShareRecord.
- **Prompt 4.3 (Day 4-5):** Skip handling — checkbox + popup confirmation; skipped state captured in schema (new `was_skipped`, `skip_confirmed_by`, `skip_confirmed_at` fields on GrowthStepExecution); analytics signal preserved. Final review screen showing all captured data.
- **Prompt 4.4 (Day 5-7):** Atomic save logic at conversation level; post-save navigation back to Member profile with new state visible; banker editing of ActionCards on review screen. **Resolve step capture (per 3a/3b):** form captures structured `size_low` / `size_high` (single value when both equal, range when `size_low < size_high`); display layer renders "$5.5M" or "$4M-$7M" accordingly across the Member profile and Insight Engine surfaces; `product_subtype` rendered as a dropdown contextualized to the Recommendation's Product family (e.g., for Vehicle/Fleet Loan: `fleet | farm_equipment | company_vehicle | service_van`; for Owner-Occupied CRE: `office_building | warehouse | manufacturing_facility`).
- **Prompt 4.5 (Day 7-8):** Integration testing, edge cases (validation failures, browser refresh recovery, concurrent edits), polish pass on inline insight surfaces (verifying actionable-insight discipline).

**Acceptance criteria:**
- Banker can navigate to Growth Conversations from any Member profile via "Run Growth Track" → single scrolling page renders with member prefilled
- Banker can navigate to Growth Conversations standalone → Member lookup → select Member → same interface
- Single page shows all stages with anchor progress bar on right
- Stage labels clickable; click scrolls to (or focuses) that stage's section
- Each stage has its own save button; save commits that stage's GrowthStepExecution + produced Signals/ActionCards/Recommendations
- Stage-by-stage save updates Member profile state immediately (no whole-conversation atomic commit required, but a "complete conversation" action commits any unsaved work and creates the parent Conversation record)
- Prior Ask + Size captures display with timestamps when re-entering Growth Conversations months later
- Banker can update stale captures; updates create new records with new timestamps; old records retained (Signal.superseded_by tracking)
- Skip checkbox present on each stage; submitting a later stage when an earlier stage is unfilled triggers confirmation popup
- Skipped state captured in schema for Insight Engine analytics (Sprint 5 stage-skip view depends on this)
- Connect alternative (handoff) works for Cygnus's track
- Cancel returns to Member profile without saving any unsaved work
- Inline insight surfaces during Ask, Size, Show, Resolve phases per INSIGHT_ENGINE_DESIGN_NOTES.md §5 Surface B
- All inline insights pass the three-criterion actionable-insight test (changes behavior, grounded in evidence, specific to context)
- Macro context banner appears on Member profiles when Member's Member Type matches a current Macro
- 3 sample Macros exist in seed data per INSIGHT_ENGINE_DESIGN_NOTES.md §3
- Insight Engine view (added in Sprint 5) can query skipped-stage patterns
- (3a) `Recommendation.size_low` + `Recommendation.size_high` schema landed; display logic renders single value when `size_low === size_high` ("$5.5M") and a range when `size_low < size_high` ("$4M-$7M"); freeform size narrative removed from rationale prose where the structured fields apply
- (3b) `Recommendation.product_subtype` schema landed; Resolve form captures it via a Product-family-contextualized dropdown; field is queryable for future Pilot-phase Product taxonomy refinement
- (3c) `ArtifactParameterCapture` schema landed with `parameter_provenance` enum (`member_profile | captured_signal | banker_assumption | member_stated_in_followup`); Show step capture pre-populates parameters from Member profile / captured Signals / prior Recommendations with provenance labels visible; gaps are highlighted; banker overrides land as `banker_assumption` provenance; all parameters persist as ArtifactParameterCapture rows linked to the ArtifactShareRecord
- Insight Engine view (Sprint 5) can query parameter-capture-provenance correlation with funding outcomes — the architectural seed for the future-state cohort insight

**Module and Data Flow §3 update required:** The current Meeting Recap section needs reframing to reflect Growth Conversations architecture. CC should make this update as part of Prompt 4.1.

### Sprint 5 — Insight Engine module
**Estimate: 4-5 days · 3 prompts**

The third module. Cross-portfolio anonymized intelligence within Blaze, Macro context, performance metrics, stage-skip analytics. Per Module and Data Flow §5 and INSIGHT_ENGINE_DESIGN_NOTES.md.

The Insight Engine has two surfaces per the design notes: the destination module (Sprint 5) and embedded inline insights (Sprint 4 cross-cutting + Sprint 5 polish). This Sprint covers the destination module; the inline surfaces are built in Sprint 4.

Built with full awareness that with three Members in three different Member Types and one active banker, most cross-portfolio aggregate views will render with explicit "production scale" annotations rather than synthesized data. The Macro view is the one that renders with full demo data (3 sample Macros).

**Prompt decomposition:**
- **Prompt 5.1 (Day 1-2):** Route, shell, anonymization layer (`anonymizeForBanker()` function per INSIGHT_ENGINE_DESIGN_NOTES.md §2). Macro context view (View 5) — fully populated from seed data. Track performance view (View 1) with appropriate "1 run" pluralization. Mock data where real aggregates are too thin, with explicit production-scale annotations.
- **Prompt 5.2 (Day 2-4):** Member portfolio overview (View 2) — Scott's three Members organized by Member Type. Coverage and indecision diagnostics (View 3) — synthesized coverage gap counts per MEMBER_FIXTURE_BRIEF.md §6 with footnote disclosing synthesis.
- **Prompt 5.3 (Day 4-5):** Stage-skip analytics (View 4) — depends on Sprint 4 capturing real skip data. Polish pass on all views; verify anonymization layer applies correctly to all cross-portfolio surfaces; verify production-scale annotations are clear and consistent.

**Acceptance criteria:**
- Insight Engine accessible from main navigation
- Five views per INSIGHT_ENGINE_DESIGN_NOTES.md §5 Surface A
- Anonymization layer (`anonymizeForBanker()`) implemented per §2; applied to all cross-portfolio queries
- Track performance view shows runs and outcomes for the three Tracks (with appropriate "1 run, 0 funded yet" pluralization)
- Member portfolio overview shows Scott's three Members organized by Member Type with current state per Member
- Coverage gaps view shows synthesized "rising trigger Signal but no Track targeting it" entries with footnote
- Indecision diagnostics view groups the indecision Signals by type
- Stage-skip analytics view shows Sprint 4 captured skip patterns
- Macro context view shows 3 sample Macros with curator attribution, affected Member Types, recommended responses
- Cross-portfolio views render with explicit "production scale" annotations at demo data volumes
- All views handle empty states with explicit "this is what would normally show; the demo has only one Member per type" annotations rather than blank screens
- All views match the calm typography-led visual identity (no database-query-tool aesthetics)

### Sprint 6 — Demo polish and deployment
**Estimate: 0.5-1 day · 1 prompt**

Admin reset functionality, Vercel deployment, banker dropdown identity switching cleanup, theme-check page cleanup, final smoke test against all SCOPE.md acceptance tests.

**Acceptance criteria:**
- All ten SCOPE.md acceptance tests pass (with criteria updated to reflect v2 architecture where applicable)
- Admin reset button (or admin route) returns demo to seeded state cleanly
- Banker dropdown lets viewer switch between Scott Brynjolffson, Marcus Webb, and Priya Patel
- Deployed Vercel URL works in incognito browser session
- Theme-check page either removed or moved to /admin/theme

---

## 4. What's deferred to post-demo (production work)

These are not in scope for the demo and should be flagged to CC if they surface as questions during build:

- HubSpot Custom Objects integration (the demo is standalone Next.js + SQLite per locked tech stack)
- Auth.js or any authentication (banker dropdown is a demo simulation)
- SFTP core ingest from Blaze's banking platform
- PostgreSQL migration (SQLite for demo phase only)
- Real LLM-driven summary generation (templated summaries via lib/summaries.ts for v1)
- SMS/email actually being sent for ActionCard suggested_openings (text captured but no integration)
- Multi-banker concurrent editing
- Member-facing surfaces (everything in the demo is banker-facing)
- MemberSummarySnapshot UI surfacing (Q-015 deferred to post-demo leadership conversation)
- Growth lead Track-editor view (the demo shows Tracks running, not Tracks being authored)
- Banker-personalized priority weighting (Sprint 1's sidebar uses simple bucketed priority rules)
- Real cross-Member analytics at production scale (synthesized data in Sprint 5 acknowledges this)
- Growth Hub (banker portfolio home page) — surfaced as a real concept during Sprint 2 review; deferred to post-demo
- Multi-product engagement modeling (current logic assumes one engaged Recommendation per Member at a time; multi-engagement adds complexity not needed for demo)

---

## 5. Updated timeline and pacing

**Current state:** End of Sprint 2 Prompt 1 review. Sprint 2 Prompt 2 next.

**Estimated calendar from now:**
- Sprint 2 Prompt 2: 1 day → Day 1
- Sprint 3: 1.5 days → Day 2-3
- Sprint 4: 6-8 days → Day 4-11
- Sprint 5: 4-5 days → Day 12-16
- Sprint 6: 0.5-1 day → Day 16-17

**Total: 13-17 working days from now to demo-ready.**

This assumes ~6 hours of focused build per day from CC. Calendar days may be longer if Francisco's review cadence introduces gaps between prompts.

The original SCOPE.md two-week budget no longer applies. The v2.1 timeline reflects honest scope after architectural review. Update SCOPE.md to reflect the new scope and timeline, with a brief note on what changed and why.

---

## 6. Risks and unknowns

**Risk 1 — Schema instability.** Sprint 2 Prompt 2 adds Recommendation.updated_at and Recommendation.owned_by. Sprint 4 will add fields for skipped state, signal longevity, and possibly Conversation-level vs Stage-level save tracking. Each addition compounds the cost of changes to early data. Mitigation: every schema change still walks through the four AI-native principles; descriptions authored at addition time; relation registry updated.

**Risk 2 — Growth Conversations complexity.** Sprint 4 is now the largest single chunk of work and includes architectural elements (single-scrolling-page, signal longevity, skip handling) that weren't in the original v1 plan. Mitigation: five explicit milestones within Sprint 4 with stakeholder review at each; willingness to extend Sprint 4 by 1-2 days if needed.

**Risk 3 — Insight Engine data thinness.** Three Members in three Member Types means most aggregate analytics views can't compute meaningfully. Mitigation: explicit annotations on each view explaining the data thinness; synthesized coverage gaps with disclosed footnote.

**Risk 4 — Visual identity drift across sprints.** As more components get built, BLAZE_STYLE_GUIDE.md needs to remain authoritative. Mitigation: every visual decision walks through the style guide first; deviations require explicit justification and update to the guide.

**Risk 5 — Demo deployment surprises.** Deploy a smoke-test version after Sprint 3 to surface deployment issues before larger Sprint 4 commits.

**Risk 6 (NEW for v2) — Two-path entry to Growth Conversations may surface UX issues.** From-profile and from-standalone entry paths look the same after the Member is selected, but the standalone path adds a Member-lookup step. Mitigation: prompt 4.1's review specifically tests both paths.

---

## 7. How prompts are written and reviewed

**Each prompt:**
- Is written by Francisco (with Claude's drafting assistance) immediately before sending to CC, not authored preemptively in batch
- Sits in the project at `docs/prompts/SPRINT_N_PROMPT_M.md`
- Has a clear scope statement at top, acceptance criteria, and explicit "out of scope for this prompt" callouts
- References governance docs by section reference rather than inlining their content
- Ends with explicit "stop and check in" instruction with what to show on report-back

**Each report-back from CC:**
- Sent to Francisco as the prompt completion artifact
- Reviewed by Francisco (with Claude's analysis assistance) against the prompt's acceptance criteria
- Either accepted (proceed to next prompt) or refined (issues sent back as additional refinement instructions)
- BUILD_LOG entry committed by CC capturing what shipped

**Review cadence:** Stop at every prompt boundary. The "daily-ish checkpoints with screenshots" pattern is achieved through prompt sizing.

---

## 8. Authority and changes

This document is the authoritative build plan. Changes to scope, sprint composition, or acceptance criteria require:

1. Surfacing the proposed change with reasoning
2. Reviewing implications (timeline, risk, dependencies)
3. Updating this document explicitly
4. Logging the change in BUILD_LOG

Drift from this plan during execution is expected and acceptable; document drift in BUILD_LOG and propose adjustments to the next prompt.

The plan is forward-looking. As sprints complete and learning accumulates, the plan gets refined. Sprint 4 onwards may have prompt decomposition adjusted based on learning.

---

## 9. Governance documents requiring updates

These need to be edited as part of upcoming prompts (not retroactively):

- **`docs/design/03_Data_Framework.docx`** §4 — Track entity model: revise to capture that Ask + Size are track-agnostic; Show + Resolve are track-specific. Recommendation entity: replace freeform size-narrative with structured `size_low` + `size_high` (3a) and add `product_subtype` (3b). Update as part of Sprint 4 Prompt 4.1.
- **`docs/design/03_Data_Framework.docx`** §5 (new) — Macro entity definition per INSIGHT_ENGINE_DESIGN_NOTES.md §3; ArtifactParameterCapture entity definition per Sprint 3 review §3c. Update as part of Sprint 4 Prompt 4.1.
- **`docs/design/04_Module_and_Data_Flow.docx`** §3 — Meeting Recap section: rename to Growth Conversations; rewrite to reflect single-scrolling-page architecture, two entry paths, signal longevity, skip handling, inline insight surfaces. Update as part of Sprint 4 Prompt 4.1.
- **`docs/design/04_Module_and_Data_Flow.docx`** §5 — Insight Engine section: rewrite per INSIGHT_ENGINE_DESIGN_NOTES.md §5. Update as part of Sprint 5 Prompt 5.1.
- **`SCOPE.md`** — Acceptance test #3 references "Meeting Recap"; update to "Growth Conversations". Acceptance criteria updated to reflect v2.1 module behavior including inline insights.
- **`CLAUDE.md`** §5 — vocabulary: replace "Meeting recap" with "Growth Conversations". Add "Macro" to vocabulary list.

**INSIGHT_ENGINE_DESIGN_NOTES.md** is referenced by Sprint 4 and Sprint 5 prompts. Treat it as authoritative for Insight Engine design decisions. Updates to that document during build should be tracked in BUILD_LOG.

These updates should happen alongside the implementation prompts, not in advance. Documenting them here so they're not forgotten.

---

## 10. The Meeting Recap → Growth Conversations rename

A note on rename scope to avoid confusion during Sprint 4 implementation:

**Renamed (user-facing and route-level):**
- All UI strings ("Meeting Recap" → "Growth Conversations")
- The route path (`/meeting-recap` → `/growth-conversations`)
- The folder name (`app/meeting-recap/` → `app/growth-conversations/`)
- New code references in Sprint 4+ work

**Not renamed (historical context preserved):**
- BUILD_LOG entries from prior sprints that mention Meeting Recap remain as-is — they accurately reflect what was named at the time
- Old code comments referencing "Meeting Recap" can be updated opportunistically as files are touched, not in a separate sweep
- Database table or column names that may use "meeting_recap" remain unchanged in v1 schema (no migration needed; if the demo phase ever transitions to production, this is a reasonable rename then)

This keeps the rename clean without creating massive churn for marginal benefit. When CC encounters "Meeting Recap" in user-facing or route-relevant code during Sprint 4, it gets renamed. When CC encounters it in historical logs or commit messages, it stays.
