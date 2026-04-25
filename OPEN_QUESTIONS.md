# OPEN_QUESTIONS.md

**The explicit surface for ambiguity. Claude logs questions here before assuming. Francisco resolves; resolved items move to the resolved section (never deleted).**

---

## How to use this document

When Claude Code encounters a question that is not answered by `CLAUDE.md`, the four design documents, or `SCOPE.md`, the discipline is:

1. **Stop.** Do not invent a design just to keep moving.
2. **Add an entry to the "Open" section below** with: a unique ID (next available `Q-NNN`), the date, a clear statement of the question, why it matters (what is blocked or affected), and the conservative default Claude is using in the meantime.
3. **Proceed with the conservative default** if work can continue. If work is genuinely blocked, say so in the entry and stop.
4. **At session end,** make sure all new questions are reflected here.

When Francisco resolves a question:

1. Add the resolution to the entry (the decision and the reasoning).
2. Move the entry from "Open" to "Resolved."
3. Date the resolution.

Resolved entries are **never deleted** — they form the institutional memory of why the system is the way it is.

---

## Open

### Q-001 · HubSpot tier commitment

- **Date logged:** Pre-build (carried over from design phase)
- **Question:** Which HubSpot tier will Blaze commit to? UI Extensions and Custom Objects require Sales or Service Hub Enterprise. Pro tier blocks the native-HubSpot approach for production v1.
- **Why it matters:** Determines whether the production v1 banker UI lives natively inside HubSpot record pages (Enterprise) or is a separate web app linked from HubSpot Contact records (Pro). Both are viable; Enterprise is the better experience.
- **Affects:** Production architecture; does **not** affect the demo (the demo is standalone regardless).
- **Conservative default for demo phase:** Build the demo as a standalone Next.js app with no HubSpot integration code at all. Do not assume either tier; the demo is designed to work alongside any HubSpot configuration.
- **Status:** Awaiting EVP conversation.

### Q-002 · Growth lead role staffing model

- **Date logged:** Pre-build
- **Question:** Will the Growth lead role be a senior RM at 25% time, a dedicated lending-ops hire, or a rotating responsibility?
- **Why it matters:** The role is non-negotiable for the system to work in production. Different staffing models have different implications for neutrality, RM buy-in, content velocity, and cost.
- **Affects:** Production operating model; does **not** affect the demo (the demo simulates the role via a "Growth lead" identity in the banker dropdown).
- **Conservative default for demo phase:** Show the role exists by including a Growth lead identity in the demo's banker dropdown, with access to the Insight Engine's editor-facing views. Do not over-specify the operating model in the demo itself.
- **Status:** Awaiting Blaze leadership decision.

### Q-003 · Senior RM contribution incentives

- **Date logged:** Pre-build
- **Question:** What piece of senior RM compensation, recognition, or career progression ties to playbook contribution?
- **Why it matters:** Without behavioral incentives, the Knowledge cluster (Growth steps, Growth tracks, Artifacts) will be thin in production regardless of how good the tool is. This is a behavioral problem that the tool cannot solve alone.
- **Affects:** Production launch readiness; does **not** affect the demo.
- **Conservative default for demo phase:** Not applicable — the demo's Growth steps and Growth tracks are pre-authored as part of the seed fixture.
- **Status:** Awaiting Blaze leadership decision.

### Q-004 · Core system integration path

- **Date logged:** Pre-build
- **Question:** How will Member.core_sync_state data flow from Blaze's core system (Symitar, Jack Henry, or whichever is in place) into the Member Signals system? SFTP file drop nightly, API integration, or middleware?
- **Why it matters:** Determines freshness of products-held data and timing of Growth track suggestions. Also determines integration cost and complexity.
- **Affects:** Pilot and production; does **not** affect the demo (core_sync_state is hand-populated in the fixture).
- **Conservative default for demo phase:** Treat `Member.core_sync_state` as a static jsonb field populated from the fixture. Do not write any sync code.
- **Status:** Awaiting Blaze IT conversation.

### Q-005 · First Member Type buildout selection

- **Date logged:** Pre-build
- **Question:** Which four Member Types should be fully built out for v1 production launch? The design proposes Small Caterer · Starting, Dental Practice · Growing, General Contractor · Growing, Manufacturer · Established.
- **Why it matters:** Each fully-built Member Type requires authoring effort (Member Type description, characteristic blockers/triggers/goals, multiple Growth tracks, multiple Growth steps, multiple Artifacts).
- **Affects:** Production v1 content scope; partially affects the demo (the demo needs at least one fully-built Member Type plus 3-5 supporting at lower fidelity).
- **Conservative default for demo phase:** Build Small Caterer · Starting at full fidelity (per `SCOPE.md`). Build the other supporting Members at minimum-viable detail using the proposed types as defaults.
- **Status:** Demo proceeds with default; production selection awaits Blaze input.

### Q-007 · Artifact rendering technology

- **Date logged:** Pre-build (new for build phase)
- **Question:** Should Artifacts be rendered as Recharts components (per the locked stack), or is there a case for using a more flexible chart-rendering approach?
- **Why it matters:** Artifacts are central to the Show Growth step shape. They need to render consistently with member-specific parameters. Recharts is on the locked stack but has limits on certain chart types (e.g., complex multi-axis comparisons).
- **Affects:** Show Growth step implementation; the seasonal cash flow smoothing chart specifically.
- **Conservative default:** Use Recharts per the locked stack. The seasonal smoothing chart is a multi-line chart (with-LOC vs without-LOC over 12 months) which Recharts handles natively.
- **Status:** Open. Likely resolves to "Recharts is fine" after first Artifact build attempt.

### Q-012 · Prisma 7 generator output location

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** Prisma 7's `prisma init` now defaults to generating the client into `../app/generated/prisma` (a new convention — previously `node_modules/.prisma/client`). This puts generated code *inside* Next.js's `app/` route directory. Should we keep this default, relocate it to `lib/generated/prisma` (outside the app routing tree), or restore the old `node_modules/.prisma/client` path?
- **Why it matters:** Generator output inside `app/` can theoretically be picked up by the App Router's file-routing scan and cause weirdness, though in practice the directory name `generated/` is ignored by Next.js. It is also a cognitive-load question — having generated artifacts next to route files is visually noisy.
- **Affects:** Ergonomics of code navigation; very minor runtime risk.
- **Conservative default:** Keep the Prisma 7 scaffolded default (`app/generated/prisma`) for now. It is gitignored. Revisit if Next.js picks it up as routes, or if imports feel awkward.
- **Status:** Open. Low priority; resolve naturally the first time we import the client.

### Q-015 · `MemberSummarySnapshot` banker-facing UI surface

- **Date logged:** 2026-04-25 (Day-1, raised at the structural-discipline pass before step 4)
- **Question:** `MemberSummarySnapshot` persistence is implemented for audit-trail integrity (one immutable row per Conversation save, carrying the rendered prose plus the template version used). Surfacing snapshots in banker-facing UI raises questions that should not be answered ad hoc:
  1. Template versioning — when do banker views show "this snapshot was rendered at template v1, current is v3"? Diff highlight or silent rerender?
  2. Divergence with live state — a snapshot at conversation-save reflects the Member's state at that moment; subsequent conversations may have shifted active Signals or open ActionCards. Do banker views show the snapshot verbatim, or annotate divergences?
  3. Regulatory hold — if a Member is under regulatory hold, are snapshots part of the held record set? Are they the *primary* record of "what the banker would have seen"?
  4. Privacy-deletion cascade — snapshots are immutable. What happens to them when a Member exercises a deletion right under Minnesota privacy law? Hard delete? Tombstone? Tombstone + retain summary text?
- **Why it matters:** Each of these is a multi-stakeholder decision (compliance, legal, operations, banker UX) that should not be made by build-time defaults. The persistence layer exists for audit-trail integrity regardless; the UI surface is a separate decision.
- **Affects:** Production rollout. Demo phase: snapshots are persisted but no UI surface displays them — intentional.
- **Conservative default for now:** Snapshots are written by the seed (and by Conversation save in production) but are not rendered in any Member profile, Insight Engine, or admin view in the demo. This proves out the persistence architecture without committing to UX semantics that need stakeholder input.
- **Status:** Open / Deferred to post-demo discussion. Reopen with leadership and compliance before any production rollout of user-facing snapshot views.

### Q-016 · `Recommendation.responds_to_signals` — surfacing the Signal→Recommendation link

- **Date logged:** 2026-04-25 (Day-2 step (b))
- **Question:** The original schema captures provenance via `Recommendation.growth_step_execution_id` (the execution that surfaced the recommendation) and `Recommendation.rule_id_that_fired` (the rule that triggered the suggestion), but does not directly capture *which active Signals* a recommendation responds to. Francisco's review surfaced this as a real gap: the Member profile UI needs to render "Working Capital LOC at $75K — responds to: seasonal cash flow stress (blocker), cash flow smoothing (goal)" inline on each Recommendation. This is not derivable cleanly from the existing relations — Rule.conditions reference Topic IDs but not the specific Signal instances that satisfied the rule at fire time.
- **Why it matters:** Without an explicit relation, the UI either invents the linkage at render time (brittle, doesn't survive future Signal/Topic edits) or fails to surface a relationship that's central to the demo's narrative ("the recommendation responds to specific things you've heard from this Member"). The relationship is also a queryable property the Insight Engine will want when it ships ("which Signals most often produce funded outcomes?").
- **Affects:** Schema (one new m-n relation), seed (populate for the three featured Recommendations), Member profile UI (render the linkage), `lib/relation-names.ts` registry.
- **Resolution date:** 2026-04-25
- **Decision:** Add `Recommendation.responds_to_signals Signal[]` as an implicit Prisma m-n relation (`@relation("RecommendationRespondsToSignal")`). Reverse side on `Signal` is `recommendations_responding_to_this Recommendation[]` under the same relation name. Stored under SQLite as a single hidden join table `_RecommendationRespondsToSignal`.
- **Migration approach:** A clean Prisma `migrate dev` since the join table is new and no existing rows depend on it. Backfill happens in the seed (`prisma/seed.ts`) for the three featured Recommendations:
  - Jenny's $75K LOC → `[blocker.cash_flow_seasonal, goal.cash_flow_smoothing]`
  - Northland's $180K Fleet Loan → `[blocker.capacity_constrained, goal.fleet_expansion]`
  - Cygnus's CRE Term Loan → `[trigger.capacity_expansion_evaluation, trigger.customer_volume_commitment, goal.customer_growth]`
- **Reasoning:** Implicit m-n is the lowest-friction Prisma-on-SQLite shape for this — no extra model, no order column needed, and the relationship is naturally bidirectional. The Insight Engine's future queries ("most-funded-from Signal types") become a simple aggregate over the join table. The relation name `responds_to` is added to `lib/relation-names.ts` per Two-File Rule.
- **Resolved by:** Francisco (via the Day-2 step (b) plan).

### Q-017 · Dec-2025 `receivables_timing` Signal — magnitude was banker prose, not structured

- **Date logged:** 2026-04-25 (Day-2 step (c) prep — Francisco's review of step (b))
- **Question:** The Member profile's History band entry for Jenny's 2025-12-04 conversation paraphrases the situation as "Inquiry about a corporate client paying 45+ days late." The "45+ days" detail is in the conversation's `banker_note` (banker prose), not captured as a `Signal.magnitude` on the `blocker.receivables_timing` Signal anchored to that conversation. The Signal exists with no magnitude. So when the Active Signals band (Band 3) renders the receivables-timing Signal, it has no chip-able captured-value to show, while the banker_note quietly carries a quantitative claim that should arguably be queryable.
- **Why it matters:** Auditability discipline (the Day-2 Part-I (2) framing): captured field values render as chips, banker prose renders as text. A quantitative fact tucked in `banker_note` is invisible to the Insight Engine and to any cross-Member rollup of receivables-timing severity. It's also a small but real instance of the pattern Francisco flagged as the kind of thing the chip treatment is supposed to expose.
- **Affects:** Fixture data integrity for Jenny's profile + any Insight Engine view that aggregates receivables-timing magnitudes.
- **Resolution date:** 2026-04-25
- **Decision:** Backfill the missing structured capture. Update the seed to set `magnitude: 45, unit: "days"` (and `frequency: null`) on the Dec-2025 `receivables_timing` Signal. The `banker_note` prose stays as the human reading; the structured magnitude becomes the chip-able captured value.
- **Reasoning:** The alternative — accepting the gap with explicit prose treatment — is the lesser path because it tells future readers (banker, auditor, LLM) that no structured capture exists, when in fact the gap is purely fixture-authoring oversight. Backfilling is true to what the Member said in the conversation and matches the discipline applied elsewhere (e.g., the seasonal-cash-flow Signal carries `magnitude: 12000, unit: "dollars", frequency: "quarterly"` — same pattern). `unit: "days"` is open in the schema (Signal.unit is String? with no enum constraint); only the Size step's `captured_data.unit` is constrained to the enumerated set, and this Signal was captured outside any Size step (no Growth track ran on the Dec-2025 service call).
- **Resolved by:** Francisco (via the step (c) prep §3 instruction).

### Q-008 · Demo data persistence model

- **Date logged:** Pre-build (new for build phase)
- **Question:** When a demo viewer runs a Meeting recap and saves, does the new data persist permanently (until reset) for all viewers, or is it scoped to the viewer's browser session?
- **Why it matters:** If permanent, multiple stakeholders viewing the demo will see each other's experimental conversations, which could be confusing. If scoped to session, each viewer has a clean Jenny's Catering to work with.
- **Affects:** Demo storage model; possibly the architecture (browser-local storage vs server SQLite).
- **Conservative default:** Server-side SQLite with the admin reset button. Multi-viewer experimentation is a known limitation; acceptable for demo phase given resetability. If the demo gets significant concurrent viewing, revisit.
- **Status:** Open. Could be resolved by adding session-scoped data layer, but adds complexity.

---

## Resolved

### Q-006 · Banker identities for the demo dropdown

- **Date logged:** Pre-build (new for build phase)
- **Question:** What specific banker identities should the demo's "log in as" dropdown include? Each identity should illustrate a distinct role and access pattern.
- **Why it matters:** The demo's value depends partly on showing how different roles see different views. Too few identities means we can't show the role variation; too many overwhelms the demo viewer.
- **Affects:** Demo build only.
- **Resolution date:** 2026-04-24
- **Decision:** Three identities for v1 of the demo:
  - **Scott Brynjolffson** — Primary banker. Owns Jenny's Catering and the other two full-fidelity Members. Sees Meeting recap and Member profile.
  - **Marcus Webb** — CRE specialist. Receives handoffs from primary bankers; sees the handoff-inbox view and a narrower Member profile cut.
  - **Priya Patel** — Growth lead. Sees the editor-facing Insight Engine views (Topic patterns, Growth step performance, authoring tools).
  A fourth (manager) identity is deferred unless stakeholder demand surfaces during the demo.
- **Reasoning:** Three is the minimum that shows the role variation the design relies on (Primary banker vs. specialist vs. Growth lead). Each name is distinctive enough to read quickly in the dropdown without being distracting. No fourth identity because a manager view is not a designed module in the demo phase.
- **Resolved by:** Francisco. Scott Brynjolffson replaces the earlier placeholder (Sarah Chen); Marcus Webb and Priya Patel unchanged.

### Q-013 · `Recommendation.primary_concern` — closed enum vs free-form

- **Date logged:** 2026-04-25 (Day-1 schema authoring)
- **Question:** Data Framework §4.4 specifies `primary_concern` as a closed enum: `none | rate | speed | commitment | spouse | cpa | partner | timing | other`. The fixture brief introduces `blaze_capacity_for_deal_size` for Cygnus's Recommendation — meaningful for the demo display but outside the canonical enum.
- **Why it matters:** Enforcing the closed enum loses the demo-meaningful Cygnus value; widening drifts from the Data Framework; relaxing to free-form sacrifices validation and the AI-native discipline of human-readable enum values (Semantic Discipline Principle 3).
- **Affects:** Schema design and Cygnus fixture rendering on the Member profile.
- **Resolution date:** 2026-04-25
- **Decision:** Extend the canonical enum with a new value, `bank_capability`, replacing `blaze_capacity_for_deal_size`. The full enum is now `none | rate | speed | commitment | spouse | cpa | partner | timing | bank_capability | other`. The new value carries this description per Semantic Discipline §3.1: *"Member's hesitation is rooted in uncertainty about whether the bank can actually deliver on a proposal of the specified size, structure, or sophistication. Distinct from `rate` (which is about price) or `speed` (which is about timing) — `bank_capability` is about institutional capacity. Most common in established commercial relationships where the member is comparing the bank's offering to a regional or national commercial bank's track record."*
- **Reasoning:** When reality demands a new categorical value, Principle 3 says add it with a description rather than collapse to `other` or to free-form. `bank_capability` is structurally distinct from `rate` (price), `speed` (timing), and `commitment` (binding nature) — it deserves to be queryable as a first-class category in the Insight Engine, not buried in `other` notes. The description lets summary templates render it as natural-language prose.
- **Propagation:** Schema enum updated. Description stored in `app/lib/enum-descriptions.ts` keyed under `RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS`. Summary templates pull from that store so prose stays in one place. Insight Engine views over `primary_concern` will treat `bank_capability` as a first-class category. Data Framework §4.4 will need an erratum at next review.
- **Resolved by:** Francisco.

### Q-014 · Resolve-shape Growth step produces a Signal *and* an ActionCard for indecision

- **Date logged:** 2026-04-25 (raised at step-2 checkpoint)
- **Question:** Data Framework §4.5 specifies that a Resolve-shape Growth step "Produces: one ActionCard with appropriate type based on resolution_type and indecision_type." The fixture brief §3.6 lists "Spousal authority indecision (from Step 4)" as an active **Signal** on Jenny's record, distinct from the follow-up ActionCard. The framework is silent on whether Resolve-with-indecision also produces a Signal.
- **Why it matters:** The Signal and ActionCard model different things — the Signal captures the current member state ("member is in authority indecision on this proposal"), and the ActionCard captures the operational follow-through (who does what, by when). Without the Signal, the Insight Engine's indecision-diagnostics view loses its primary input; without the ActionCard, the operational queue loses its referent.
- **Affects:** Schema interpretation; fixture authoring for Jenny and Northland (both end in indecision); future Insight Engine indecision-diagnostics view.
- **Resolution date:** 2026-04-25
- **Decision:** Resolve-shape executions where `resolution_type = "indecision"` produce **both** a Signal (type: `indecision`, topic: the matching indecision topic, severity per brief) **and** an ActionCard (per the framework). The Signal is `growth_step_execution_id`-linked to the Resolve execution.
- **Reasoning:** The brief's §3.6 listing is internally consistent and reflects the AI-native modeling intent: every interesting member state must be queryable as a first-class record. An ActionCard alone does not let the Insight Engine roll up indecision patterns across members; a Signal alone does not give a banker an operational next step. Both are needed. The Data Framework will need an erratum at next review — §4.5's "Produces: one ActionCard" should read "Produces: one ActionCard, plus one Signal of type=indecision when resolution_type=indecision". BUILD_LOG records this for the next Data Framework revision.
- **Resolved by:** Francisco.

### Q-011 · Repo-root documents not listed in CLAUDE.md §12

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** Three markdown files at the project root were not in the CLAUDE.md §12 document set: `AGENTS.md` (Next.js 16 scaffold's agent-rules), `README.md` (standard scaffold readme), and `BLAZE_STYLE_GUIDE.md` (Blaze visual identity). With the introduction of `MEMBER_FIXTURE_BRIEF.md` in `docs/design/`, the §12 listing also needed a Tier 2 line for that brief.
- **Why it matters:** §12 says "If a file appears in this repo that is not on this list, raise it. Document sprawl is a real failure mode and we are guarding against it." Silently accepting unlisted files contradicts the discipline.
- **Affects:** Governance hygiene; no direct functional impact.
- **Resolution date:** 2026-04-25
- **Decision:** Tier 2 in CLAUDE.md §12 now reads:
  - `docs/design/01_Overview.docx`
  - `docs/design/02_Semantic_Discipline.docx`
  - `docs/design/03_Data_Framework.docx`
  - `docs/design/04_Module_and_Data_Flow.docx`
  - `docs/design/MEMBER_FIXTURE_BRIEF.md` (consult during fixture authoring)
  - `BLAZE_STYLE_GUIDE.md` (consult before any UI work)

  `AGENTS.md` and `README.md` are framework-generated artifacts. Their continued presence is acknowledged but they are not promoted to a tier; CLAUDE.md §12 was not extended for them at this revision.
- **Resolved by:** Francisco.

### Q-009 · Next.js major version for the demo (15 vs 16)

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** The original locked stack in BUILD_LOG's pre-build entry specified Next.js 15. The current published major version is Next.js 16. Which version should the scaffold use?
- **Why it matters:** The scaffold command (`create-next-app`) installs whatever is the current `latest` tag by default. Choosing the version locks the App Router behaviors, React Server Component semantics, caching defaults, and plugin compatibility for the rest of the demo build.
- **Affects:** Demo build only. Pilot/production inherit from whichever the demo lands on, but can revisit.
- **Resolution date:** 2026-04-24
- **Decision:** Use Next.js 16 (current latest). CLAUDE.md §2 was updated to reflect this.
- **Reasoning:** (1) Demo is a greenfield standalone app with no legacy constraints — no reason to pin to the previous major. (2) Next.js 16 ships with turbopack-stable dev server, updated caching semantics, and improved App Router ergonomics that match what we'll be building. (3) Vercel deploy target prefers current. (4) No locked dependency in the rest of the stack requires Next.js 15. Risk is low and upgrade cost later would exceed the scaffold cost now.
- **Resolved by:** Claude (with user confirmation via session prompt explicitly flagging the 15 vs 16 decision). The CLAUDE.md update to "Next.js 16 (App Router)" is the authoritative record.

### Q-010 · shadcn/ui configuration (component library and preset)

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** CLAUDE.md §2 specifies "shadcn/ui components" but does not specify which underlying component library or which theme preset. The session prompt named the Radix component library and the Mira preset as locked choices from prior conversations, but these were not previously written down anywhere.
- **Why it matters:** shadcn/ui now supports multiple component-library backends (Radix, Base UI, etc.) and ships with several named theme presets. The choice shapes the visual identity of the demo and determines which component primitives are available.
- **Affects:** Demo visual/UX foundation. Hard to change later without visual churn across every screen.
- **Resolution date:** 2026-04-24
- **Decision:** Use the Radix component library with the Mira preset when running `pnpm dlx shadcn@latest init`.
- **Reasoning:** User specified both explicitly in the session prompt. Radix is the best-established backend for shadcn/ui and matches the original shadcn lineage; Mira is an approved visual preset. Documented here so the choice is retrievable.
- **Resolved by:** Francisco (via session prompt), recorded by Claude.

---

## Format reference

When adding a new entry, use this template:

```
### Q-NNN · Short title

- **Date logged:** YYYY-MM-DD
- **Question:** Clear statement of the question.
- **Why it matters:** What is blocked or affected if this is unresolved.
- **Affects:** Demo / Pilot / Production / Multiple.
- **Conservative default:** What Claude is doing in the meantime to not block work.
- **Status:** Open / Awaiting [person] / Awaiting [external dependency].
```

When resolving, append:

```
- **Resolution date:** YYYY-MM-DD
- **Decision:** What was decided.
- **Reasoning:** Why this decision was reached, including alternatives considered.
- **Resolved by:** Name.
```

Then move the entry to the Resolved section in chronological order of resolution date.
