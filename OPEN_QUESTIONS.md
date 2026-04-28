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

### Q-008 · Demo data persistence model

- **Date logged:** Pre-build (new for build phase)
- **Question:** When a demo viewer runs a Meeting recap and saves, does the new data persist permanently (until reset) for all viewers, or is it scoped to the viewer's browser session?
- **Why it matters:** If permanent, multiple stakeholders viewing the demo will see each other's experimental conversations, which could be confusing. If scoped to session, each viewer has a clean Jenny's Catering to work with.
- **Affects:** Demo storage model; possibly the architecture (browser-local storage vs server SQLite).
- **Conservative default:** Server-side SQLite with the admin reset button. Multi-viewer experimentation is a known limitation; acceptable for demo phase given resetability. If the demo gets significant concurrent viewing, revisit.
- **Status:** Open. Could be resolved by adding session-scoped data layer, but adds complexity.

### Q-023 · Macro authors not seeded as Banker entities

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1a)
- **Question:** Macro 1 names "Marcus Wei (Chief Economist)" as author; Macros 2 and 3 name "Sarah Chen (Sector Specialist, Skilled Trades)". Neither exists as a `Banker` row in the demo seed (the seed has Scott / Marcus Webb / Priya Patel — all relationship/specialty bankers). Should Marcus Wei and Sarah Chen be seeded as Bankers, or kept as `authored_by_external_label` strings?
- **Why it matters:** As Banker rows they'd surface in the banker dropdown (Sprint 6) and gain referential integrity. As external labels they stay invisible to relationship-banker UI but lose queryability. The `Macro.authored_by_banker_id` field is FK-nullable specifically to support this dual mode; the current demo path uses external_label.
- **Affects:** Demo polish; Pilot phase considerations for whether non-relationship-banker authors get Banker records.
- **Conservative default:** External labels (`authored_by_external_label`). Sprint 4 ships with this; Pilot phase reconsiders.
- **Status:** Open / Deferred to Pilot.

### Q-024 · `ArtifactParameterCapture` table empty in seed

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1a)
- **Question:** The `ArtifactParameterCapture` schema landed in Prompt 4.1a but no rows are seeded. The capture flow (Show step pre-population + banker overrides) is Sprint 4 Prompt 4.2 work. Should we backfill rows for the three featured Recommendations now (with `banker_assumption` provenance) so the Insight Engine has data to work with?
- **Why it matters:** Empty table means Sprint 5's parameter-provenance correlation analysis has nothing to compute. Backfill would give the Insight Engine substrate for the demo; it'd also create rows that the Sprint 4 Prompt 4.2 capture flow would need to either honor or replace.
- **Affects:** Sprint 5 Insight Engine view richness; Sprint 4 Prompt 4.2 capture-flow design.
- **Conservative default:** Leave empty in 4.1a. Sprint 4 Prompt 4.2 will populate via the Show capture form; Sprint 5 view renders empty-state until then.
- **Status:** Open / Resolves naturally as Sprint 4 progresses.

### Q-025 · Signal supersession schema unused in seed

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1a)
- **Question:** `Signal.superseded_by_signal_id` and `superseded_at` fields landed in Prompt 4.1a; no Signals are superseded in the demo seed. Sprint 4 Prompt 4.2 will create supersession chains when bankers update stale captures. Should we backfill a synthetic supersession in the seed (e.g., a prior Conversation captured a `painful` cash flow Signal that the Apr 8 Conversation superseded with a `manageable` recovery Signal) to give the demo viewer something to look at?
- **Why it matters:** Without seeded supersessions, the Sprint 4 Prompt 4.2 audit trail UI has no fixture to render against. Demo viewers would see "no supersession history" until they actually create one through Growth Conversations.
- **Affects:** Demo richness; Sprint 4 Prompt 4.2 visual review.
- **Conservative default:** Leave empty in 4.1a. Sprint 4 Prompt 4.2 visual review will surface whether synthetic seeded supersession is needed.
- **Status:** Open / Revisit during Sprint 4 Prompt 4.2.

### Q-026 · GrowthStepExecution skip-state schema unused in seed

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1a)
- **Question:** `GrowthStepExecution.was_skipped`, `skip_confirmed_*`, and `skip_reason` fields landed in Prompt 4.1a; no executions are skipped in the demo seed. Should we backfill a synthetic skip (e.g., Northland's Resolve step that captured `member_response = leaning_yes` could have a sibling skipped Size step demonstrating "banker skipped Size, went straight to Show") to populate the Sprint 5 stage-skip analytics view?
- **Why it matters:** Same shape as Q-024 / Q-025 — the analytics view has nothing until Sprint 4 Prompt 4.3 ships the skip flow.
- **Affects:** Sprint 5 stage-skip view; Sprint 4 Prompt 4.3 visual review.
- **Conservative default:** Leave empty in 4.1a. Sprint 4 Prompt 4.3 may seed synthetic skips if the analytics view needs substrate.
- **Status:** Open / Revisit during Sprint 4 Prompt 4.3.

### Q-028 · Stale signal threshold

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1c)
- **Question:** The Ask form's augmenting summary marks Signals captured more than 6 months ago as "stale" (italic date + " · stale" suffix + tooltip prompt). The 6-month threshold is a guess. Should the threshold differ by Signal type (e.g., Goals can hold longer than Triggers; Indecisions probably get stale fastest)?
- **Why it matters:** Per-type thresholds reflect real-world half-lives more accurately, but configuration cost rises and the UI gets more complex.
- **Affects:** Ask form UX; future Size / Show / Resolve / Connect form UX (likely the same pattern).
- **Conservative default:** 6 months across all Signal types. Configurable in code (`STALE_DAYS` constant in `ask-section.tsx`).
- **Status:** Open. Validate during Sprint 5 Insight Engine work when stale-signal patterns aggregate.

### Q-029 · Track-agnostic GrowthStepExecution.step_phase architectural choice

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1c)
- **Question:** Approach 2 from the prompt was implemented: `GrowthStepExecution.growth_step_id` made nullable, new `step_phase` enum (StepShape) field added. Track-agnostic Ask + Size captures populate `step_phase` only; track-specific Show / Resolve / Connect populate both. Approach 1 (synthetic "track-agnostic" Track + dedicated GrowthSteps) was rejected as polluting reference data.
- **Why it matters:** The Size capture form (Sprint 4 Prompt 4.2) will exercise this further. If issues surface (e.g., Insight Engine queries become awkward with mixed null / non-null growth_step_ids), Approach 1 may need reconsideration.
- **Affects:** Sprint 4 Prompt 4.2 Size form; Sprint 5 Insight Engine track-step analytics.
- **Conservative default:** Approach 2 (current implementation).
- **Status:** Open / Resolves with experience during Sprint 4 Prompts 4.2–4.5.

### Q-030 · Conversation defaults for Growth Conversations sessions

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1c)
- **Question:** When the Ask form creates a fresh Conversation record (no prior session conversation), the Server Action defaults `meeting_type = "check_in"`, `channel = "in_person"`, `sentiment = "receptive"`. Sprint 4 Prompt 4.4 will add explicit capture for these on the Resolve stage. Until then, all GC-created Conversations have these defaults.
- **Why it matters:** Insight Engine views over conversation type / channel / sentiment will reflect defaults rather than reality if Resolve doesn't ship before the views.
- **Affects:** Sprint 4 Prompt 4.4 Resolve form; Sprint 5 Insight Engine views.
- **Conservative default:** check_in / in_person / receptive. Documented in `actions.ts → saveAskCaptures`.
- **Status:** Open / Resolves in Sprint 4 Prompt 4.4.

### Q-031 · Multi-tab editing of the same Member's captures

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1c)
- **Question:** Two browser tabs open on `/growth-conversations/jenny`, both with pending Ask captures. Both Save → two independent Conversation rows + two independent execution rows. Last-write-wins semantics. Acceptable for demo; potential UX issue for production.
- **Why it matters:** Production deployment with multiple bankers (or one banker with multiple tabs) needs clearer semantics — either lock-on-edit, last-write-wins with notification, or explicit "active session" concept.
- **Affects:** Production UX; demo unaffected.
- **Conservative default:** No locking; no notification; both saves succeed. Documented as known gap.
- **Status:** Open / Deferred to Pilot phase.

### Q-027 · Anchor progress bar small-viewport behavior

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1a)
- **Question:** The right-column anchor progress bar is hidden below the `lg` breakpoint (1024px). On tablets and mobile, the page becomes single-column scrolling with no anchor navigation. Is this acceptable for the demo? Production may need a collapsed mobile treatment (top-edge sticky bar with horizontal pipe-separated stage labels, similar to TrackProgressDots).
- **Why it matters:** EVP demo will likely happen on desktop (1280px+); tablet review during meetings is plausible. If the demo gets reviewed on tablet, the missing anchor bar may surface as a gap.
- **Affects:** Demo polish; Sprint 4 Prompt 4.1b visual review on small viewports.
- **Conservative default:** Hidden below `lg`. Sprint 4 Prompt 4.1b visual review will surface whether a small-viewport treatment is needed.
- **Status:** Open / Revisit during Sprint 4 Prompt 4.1b.

### Q-032 · Persistent Macro context banner dismissal

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1d)
- **Question:** The Macro context banner on the Member profile is dismissible per Sprint 4 §4.1d Block A.4, but dismissal is session-scoped only — refreshing the page brings the banner back. Production likely needs persistent dismissal: per-banker preferences (acknowledged Macros suppressed for that banker) and automatic dismissal when a Macro's `effective_period_end` passes. Where do per-banker preferences live (a new `BankerMacroDismissal` join table? a JSON field on `Banker`?), and what's the auto-dismissal trigger (page render check vs. nightly job)?
- **Why it matters:** Banker UX in production. A banker who's already absorbed the Macro's recommended response shouldn't re-see the banner every time they open the Member profile. Without persistent state, the banner becomes noise quickly.
- **Affects:** Schema (new field or table); UX flow; possibly a backend job for expiry sweeps.
- **Conservative default:** Session-scoped dismissal only for demo. Component holds local React state; refresh restores. Documented in `app/members/[id]/macro-context-banner.tsx`.
- **Status:** Open / Deferred to post-demo. Pilot phase decides persistence shape.

### Q-033 · Stage label hyperlinks for stages without capture interfaces

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.1d)
- **Question:** Stage label hyperlinks on the Member profile's TrackProgressDots now route to `/growth-conversations/[memberId]#stage-{shape}` anchors per Sprint 4 §4.1d Block B. Sprint 4 Prompt 4.1c shipped the Ask capture interface; Size / Show / Resolve / Connect are still placeholder summaries until Sprint 4 Prompt 4.2. A banker clicking "Show" today lands on a section with a stage anchor but no capture form — the page renders the prefilled summary text. Is this an acceptable interim state, or should links to not-yet-built stages render as plain text (no hyperlink) until 4.2 lands?
- **Why it matters:** Demo polish during the EVP review window. If 4.2 doesn't land in time, "Show" linking to a read-only summary may feel incomplete; if 4.2 does land, the links will route to functional capture forms and the question evaporates.
- **Affects:** Sprint 4 Prompt 4.2 sequencing; demo experience between 4.1d and 4.2.
- **Conservative default:** Hyperlinks all stages today. The Growth Conversations page renders prefilled-summary sections for non-Ask stages, which is at minimum a useful read-only reference. If 4.2 lands before EVP review, the question is moot; if not, revisit.
- **Status:** Open / Resolves naturally as Sprint 4 Prompt 4.2 lands.

### Q-034 · Macro authorship governance

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a; raised during 4.1d visual review)
- **Question:** Where does Macro content come from in production? Who can author a Macro (Chief Economist? Sector specialists? Any senior banker?). What review process applies before a Macro reaches relationship bankers' Member-profile banners (peer review? compliance sign-off? sector head approval?). How are recipients scoped (all bankers? bankers serving the affected_member_types only? opt-in subscription model?). What distinguishes a Macro from a less-formal Note shared in Slack — is the threshold "applies to a defined Member Type cohort" sufficient, or should accuracy / data-validation be required? The demo uses external_label strings ("Marcus Wei (Chief Economist)") with no governance scaffold.
- **Why it matters:** Macros are high-leverage — they shape banker conversations directly via the profile banner. Wrong, stale, or biased Macro content has outsized impact on Member outcomes. Production needs an editorial layer (some combination of role-gated authoring + peer review + portfolio-data validation) before Macros are widely deployed.
- **Affects:** Pilot phase Macro authoring tooling; Banker role schema (new "macro_author" role flag?); editorial workflow design.
- **Conservative default for now:** External_label strings on Macros; no governance scaffold; manual seeding only. Demo phase ships with three Macros authored verbatim into the seed.
- **Status:** Open / Deferred to Pilot phase. Reopen with leadership before any production rollout of Macro authoring.

### Q-035 · Topic-level question library — example phrasings per Topic per Member Type

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a)
- **Question:** The Ask form's "+ Add" buttons spawn sub-forms with a Topic dropdown but no example phrasings or sample questions to scaffold the banker's actual conversational prompt. Sprint 4 §4.2a's stage guidance scaffolds the *purpose* of each phase per Member Type, but doesn't go down to the Topic level. Should each (Topic, Member Type) pair carry a small library of example phrasings — verbatim banker-tested questions a primary banker can use as a starting point? E.g., for `blockerSeasonal` × Small Caterer: "Which months does your business typically slow down? About how much does revenue drop?". Editorial governance would parallel the Macro question (Q-034) — who authors, who reviews.
- **Why it matters:** Stage guidance answers "what is this phase for?" but bankers also benefit from "what's a good way to ask?". A question library closes the gap between intent and execution. Without it, junior bankers may struggle to translate guidance into dialogue.
- **Affects:** Pilot phase content authoring scope; Topic schema (new optional `example_phrasings` field or join table); Ask form UI (could surface 1-3 example phrasings under the Topic dropdown when a Topic is selected).
- **Conservative default:** Stage guidance only for the demo. Topic-level question library deferred.
- **Status:** Open / Deferred to Pilot phase. Same governance shape as Q-034.

### Q-036 · `SizingMeasurement.confidence` — should it be required?

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a Block B)
- **Question:** The Size capture form's Confidence dropdown (`high / moderate / low / banker_estimate`) is currently optional. Should it become required so every SizingMeasurement carries an explicit confidence axis the Insight Engine can aggregate against? Cost: one more required click per measurement. Benefit: Sprint 5 analytics can correlate "high-confidence Size measurements at quarter-end" vs "banker estimates" across the portfolio, surfacing patterns where banker estimation diverges systematically from member-stated values.
- **Why it matters:** Required-fields drive cleaner aggregations downstream. But over-required forms breed click-fatigue and bankers default to "moderate" to move on, defeating the analytic value. The right answer probably depends on whether Insight Engine views surface confidence-stratified analytics meaningfully — to be tested during Sprint 5.
- **Affects:** Size form UX; SizingMeasurement schema (currently `confidence: String?`, would become `String` — non-trivial migration once data exists); Insight Engine analytical surfaces.
- **Conservative default:** Optional (`String?`) for the demo. Field rendered with optional asterisk treatment; banker may skip.
- **Status:** Open / Revisit during Sprint 5 Insight Engine work.

### Q-037 · Resolve ActionCard owner default — current banker vs Recommendation.owned_by

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a Block C)
- **Question:** When the Resolve form creates an ActionCard, the owner currently defaults to the current banker (the Member's primary banker, since the demo has no banker-switcher). Should it default to `Recommendation.owned_by` instead? Sprint 2 Prompt 2 introduced `Recommendation.owned_by` to support cross-banker handoff — Cygnus's CRE opportunity is owned by Marcus Webb (CRE specialist) even though Scott Brynjolffson is the relationship banker. If Scott captures the Resolve and the ActionCard defaults to Scott, the cross-banker handoff doesn't surface unless Scott manually changes the owner.
- **Why it matters:** Demo correctness — Cygnus's specialist scenario is exactly the case the cross-banker pattern was built to demonstrate. Defaulting to `Recommendation.owned_by` makes the handoff implicit and correct; defaulting to current banker requires a manual override every time. But: not every Track has `owned_by` set (it's nullable; falls back to primary_banker). The fallback chain matters.
- **Affects:** ResolveSection default owner logic; the demo's ability to surface cross-banker handoff without manual action.
- **Conservative default:** Current banker for now. Banker can manually pick from the dropdown (Marcus Webb is in the active bankers list). Verify behavior with Cygnus's flow during visual review of Sprint 4 Prompt 4.2a; if the handoff is confusing or invisible, switch the default to `Recommendation.owned_by ?? primary_banker`.
- **Status:** Open / Verify during Sprint 4 Prompt 4.2a visual review; resolve based on demo experience.

### Q-038 · Closing notes persistence — `Conversation.banker_note` vs dedicated entity

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a refinement pass)
- **Question:** Closing notes captured on Resolve forms for `declined` / `dismissive` responses save to `Conversation.banker_note`. The choice was forced by `ActionCard.due_at` being NOT NULL — closing notes have no due date by definition, so they don't fit the ActionCard shape. But `Conversation.banker_note` is a generic free-text field that's also used for non-Resolve banker notes; conflating "this is the closure context for a declined opportunity" with "this is a generic conversation note" loses semantic separation. Should there be a dedicated `RecommendationClosure` entity (or `Recommendation.closure_notes` field) so the closing-context case has its own first-class home?
- **Why it matters:** Pilot phase analytics — "what reasons do members give for declining?" is a high-value Insight Engine query. If closing notes are mixed into generic banker notes, the analytic surface needs a way to disambiguate. A dedicated field/entity makes the query trivial; staying on `banker_note` requires a tag or category convention. Right now the demo has only the Resolve form writing to `banker_note`, so the conflation is theoretical, but it'll surface as soon as bankers start using `banker_note` for non-Resolve notes.
- **Affects:** Schema (new field or entity); Resolve form save behavior; Insight Engine "decline-reason" analytics surface.
- **Conservative default:** `Conversation.banker_note` for the demo. The semantic conflation is acceptable because the demo's banker_note is empty for everything except Resolve closing notes — i.e., everything currently in banker_note IS a closing note. Pilot phase needs to address this before banker_note grows multi-purpose.
- **Status:** Open / Deferred to Pilot phase. Revisit when generic banker-note capture is added (likely Sprint 4 Prompt 4.4 or pilot-phase work).

### Q-039 · Lifecycle stage transitions — state-machine derivation vs explicit transition events

- **Date logged:** 2026-04-27 (Sprint 4 Prompt 4.2a refinement pass)
- **Question:** Track lifecycle states (Decision pending, Funded / Specialist engagement, Closed / Closing) are currently derived from `Recommendation.response` — a state-machine read where the response value implies the lifecycle position. This is sufficient for the demo's static visualization. Sprint 5 Insight Engine analytics that compute *duration at lifecycle stage* (e.g., "average time in Decision pending before commitment", "median Closing-to-Funded interval") will require explicit transition events — when did the Member enter Decision pending, when did they exit, when did funding clear. Should there be a `RecommendationLifecycleEvent` table (or extend `GrowthStepExecution` with lifecycle-stage rows) that records each entry/exit timestamp?
- **Why it matters:** State-machine derivation tells you *where* a Member is now; event-log derivation tells you *how long* they've been there and *when* they transitioned. Insight Engine's most valuable analytics are duration-based: which Member Types take longest in Decision pending, which Tracks have the highest Closing-to-Funded conversion rate, which primary concerns correlate with longer commitment-to-funding intervals. Without an event log, those analytics are impossible.
- **Affects:** Schema (new entity or extension of GrowthStepExecution); Resolve form save behavior (must emit transition events on every state change); Insight Engine view design.
- **Conservative default:** State-machine derivation for the demo (current implementation). Lifecycle dot states computed inline in `computeTrackStages` from `recommendation_response`. Pilot phase or Sprint 5 architectural pass should design the event-log entity before Insight Engine analytics ship; backfill from the existing `Recommendation.updated_at` history is feasible but lossy (only records the most-recent transition timestamp).
- **Status:** Open / Pilot phase architectural decision. Revisit when Sprint 5 Insight Engine analytics scope is defined.

---

## Resolved

### Q-018 · `Recommendation.rationale_summary` — progressive disclosure of the dense rationale

- **Date logged:** 2026-04-25 (step-(c)-prep visual refinements)
- **Question:** The `Recommendation.rationale_text` field carries dense banker prose (3-5 sentences explaining why the proposal is sized and structured the way it is). On the Member profile's Active proposals band, the full prose reads as a wall of text. Bankers scan; they only need full rationale when drilling in. The page needs a one-line summary visible by default and the full prose available on demand.
- **Why it matters:** Visual density on a Member profile is the difference between "scanned in 5 seconds" and "demanded a 30-second read." Progressive disclosure preserves the auditable detail without forcing it on every page load. This is the same pattern used elsewhere on the page (the trace `<details>` blocks); applying it consistently to the rationale carries the design language.
- **Affects:** Schema (one new optional String field), seed (three Recommendations need summaries authored), Member profile rendering (default-summary + expandable-detail), `lib/summaries.ts` (the `summarizeRecommendation` template can prefer the summary when present).
- **Resolution date:** 2026-04-25
- **Decision:** Add `Recommendation.rationale_summary String?` (nullable for now; production capture could enforce required at the next schema review). Cap at ~200 characters by convention; not enforced at the database layer for SQLite simplicity. Populated for the three demo Recommendations in the seed.
- **Migration approach:** Clean Prisma `migrate dev`. Backfill happens in the seed only — no production data exists.
- **Authored summaries (proposed; Francisco to review):**
  - Jenny's $75K LOC: *"$75K LOC sized at one quarter of the slow-season revenue gap. Existing Visa demonstrates payment discipline."* (provided by Francisco verbatim)
  - Northland's $180K Fleet Loan: *"Two service vehicles at $90K each, financed over 60 months at $3.6K/month — well below the $49K of declined work per peak season. Existing Equipment Loan demonstrates payment discipline."*
  - Cygnus's CRE Term Loan: *"$4M-$7M CRE financing for the anchor-customer-driven capacity expansion. CRE specialist Marcus Webb engaged early; coordination by Scott."*
- **Reasoning:** A rendered field is the right home for this — it's content the Growth lead curates per recommendation, not derivable mechanically from `rationale_text`. Storing it lets the Insight Engine aggregate "median summary length per Member Type" or similar quality signals later. Keeping it nullable lets us roll out without a coordinated edit to all rationale templates.
- **Resolved by:** Francisco (via the step-(c)-prep §4 instruction).

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
- **Resolved by:** Francisco (via the step (c) prep §3 instruction; explicitly re-confirmed in the step (b) approval reply).

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
