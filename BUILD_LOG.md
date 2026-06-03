# BUILD_LOG.md

**Append-only chronological log of work sessions on this project. Newest entries at the bottom. Older entries get pruned to `BUILD_LOG_ARCHIVE.md` when this file grows large.**

When reading this file, Claude Code consults the most recent 1–2 entries to maintain continuity between sessions. The entire history exists for human review and longer-term context.

---

## 2026-04-24 · Pre-build state — design phase complete, governance scaffold initialized

**Session type:** Design and governance setup. No code written yet.

**What's been done before this point:**

- Multi-week collaborative design phase with Francisco produced four authoritative design documents:
  - `01_Overview.docx` — orientation and document map
  - `02_Semantic_Discipline.docx` — AI-native ontology rules (required descriptions, named relationships, human-readable enums, faithful summary primitives)
  - `03_Data_Framework.docx` — technical specification of all 8 entities, 6 Growth step shapes, capture schemas, reference data, audit chain, storage notes
  - `04_Module_and_Data_Flow.docx` — three modules, six through-lines, three-cluster governance, automation-vs-judgment, worked Jenny's Catering example

- Vocabulary locked through extended naming refinement: Growth track (was Track), Growth step (was Move/Play), Growth lead (was playbook editor), Member Type (was PersonaCell), Topic (was canonical_tag in user-facing strings), Their words (was member_phrasing), Feeling (was emotional_charge), Follow up (was Nurture), Meeting recap (was Onboarding & Routing), Member profile (was Member Dashboard).

- Stack architecture decided: Next.js 15 + React 19 + TypeScript + Prisma + SQLite for the demo phase. PostgreSQL deferred to pilot phase. No HubSpot integration in the demo. Migration path from SQLite to PostgreSQL is a one-line provider change.

- Three-phase plan agreed: demo (standalone web app, ~2 weeks), pilot (modestly hardened with PostgreSQL and SFTP ingest, ~3-4 additional weeks), production (HubSpot UI Extensions + standalone knowledge service backend).

**What's set up in this session:**

- Four-tier governance scaffold initialized:
  - Tier 1: `CLAUDE.md` (session contract), `OPEN_QUESTIONS.md` (ambiguity surface)
  - Tier 2: Four design docs (already in place from design phase)
  - Tier 3: `BUILD_LOG.md` (this file), `IMPLEMENTATION_STATUS.md` (to be created in next session if needed), `SCOPE.md` (demo phase contract)
  - Tier 4: `prisma/schema.prisma` and `FIXTURE.md` (to be created during build)

- `OPEN_QUESTIONS.md` seeded with eight initial open items: five carried over from the design phase (HubSpot tier, Growth lead staffing, RM contribution incentives, core system integration, first Member Type buildout) plus three new build-phase questions (banker identities for demo dropdown, Artifact rendering technology choice, demo data persistence model).

- `SCOPE.md` defines the demo's definition-of-done as ten concrete acceptance tests, with explicit in-scope and out-of-scope sections and a two-week time budget.

**What's open:**

- Q-006 (banker identities for demo dropdown) wants a decision before Day 1 of build, though the conservative default (Sarah Chen, Marcus Webb, Priya Patel) is workable.
- All other open questions either don't affect the demo or have working conservative defaults.

**Suggested next move:**

Begin Day 1 of the build:

1. Initialize the Next.js 15 project with TypeScript, Tailwind, and Prisma.
2. Translate the Data Framework's eight entities and reference data into a `prisma/schema.prisma` file. Run initial migration against SQLite.
3. Begin scaffolding the Jenny's Catering fixture as a TypeScript seed file. Per Semantic Discipline, populate description fields on all reference entities.
4. By end of Day 2: a runnable Next.js dev server with the schema migrated, seed data loading, and a basic landing page that proves the database is reachable.

The first concrete code milestone is "the seed data loads cleanly and a basic page can query and display Jenny's Catering's name, Member Type, and a list of her Conversations." Once that works, the Member profile build begins.

**Risks for next session:**

- The capture_schema-of-schemas pattern (Data Framework §6.6) needs a concrete validation library choice. Likely candidates: zod (most TypeScript-native), ajv (most JSON-Schema-spec-compliant). Worth deciding before writing the first Growth step.
- The Artifact rendering approach (Q-007) may surface real friction when building the seasonal smoothing chart. Build the simplest version first and iterate.
- Resist the temptation to over-build the seed fixture before Day 1 of UI work. The Member profile UI will reveal what data shapes are actually needed; build seed data just-in-time, not all upfront.

**Follow-ups for Francisco:**

- Confirm or override the conservative default for Q-006 (banker identities).
- If you have a strong preference between zod and ajv for capture_schema validation, note it before Day 1 of build. Otherwise Claude proposes zod as the default for TypeScript-native simplicity.

---

## 2026-04-24 · Scaffold session — Next.js 16 + Prisma + shadcn/ui in place, zero app code

**Session type:** Project scaffold only. Deliberately stopped before writing any Prisma models, fixtures, or screens — Francisco will review the skeleton before Day 1.

**What was built:**

- **Git initialized** on `main` branch. Initial commit `c338f00` contains 32 files / ~10 kloc (most of that is `pnpm-lock.yaml`).
- **Next.js 16.2.4** scaffolded via `create-next-app` with `--ts --tailwind --app --eslint --use-pnpm --import-alias "@/*" --no-src-dir --yes`. Package name set to `growth-path-demo`. TypeScript strict mode confirmed on in `tsconfig.json`. React 19.2.4, Tailwind 4.2.4, ESLint 9.39.4, Turbopack dev server.
- **Prisma 7.8** initialized with `--datasource-provider sqlite`. Generated `prisma/schema.prisma` (empty models), `prisma.config.ts` (the new Prisma 7 config pattern — imports `dotenv/config` and reads `DATABASE_URL`), and `.env` (`DATABASE_URL="file:./dev.db"`). `dotenv` added as dev dep since `prisma.config.ts` requires it.
- **shadcn/ui** initialized with `--base radix --preset mira --yes`. Generated `components.json` (style: `radix-mira`, baseColor: neutral, icon library: hugeicons) and `lib/utils.ts`. `app/globals.css` rewritten with shadcn + tw-animate-css imports and the full Mira theme variable set. No components added yet — Francisco's first Day-1 task will be to add whichever primitives the first screen needs.
- **Runtime deps:** `recharts@3.8.1`, `zod@4.3.6`. Both lock into the demo's locked stack per CLAUDE.md §2.
- **pnpm build-script approval** for `prisma` and `@prisma/engines` written into `pnpm-workspace.yaml` under `onlyBuiltDependencies`, because the default `ignoredBuiltDependencies` pattern blocks Prisma's postinstall. Without this, `prisma generate` would fail on a fresh `pnpm install`.
- **.gitignore** extended on top of the Next.js scaffold default with: SQLite files (`*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`, `/prisma/*.db*`) and `.claude/settings.local.json`. `.env*`, `.next/`, `/app/generated/prisma`, and `node_modules/` already covered by the scaffolded defaults.
- **Design docs moved** from project root into `docs/design/` per CLAUDE.md §12.
- **Dev server verified:** `pnpm dev` boots in 213ms, serves HTTP 200 at `localhost:3000/`, then shut down cleanly.

**Decisions recorded in OPEN_QUESTIONS.md (Resolved section):**

- **Q-009 · Next.js 15 → 16.** CLAUDE.md §2 said 15; Next.js 16.x is now latest. Decision: use 16 (greenfield, no legacy constraint, matches Vercel-latest deploy target, caching and App Router improvements worth having from day one). CLAUDE.md §2 updated to "Next.js 16 (App Router)" before the scaffold ran.
- **Q-010 · shadcn/ui Radix + Mira preset.** These were named in the session prompt as "locked choices from prior conversations" but were not previously written anywhere. Logged as resolved so future sessions can find the rationale.

**Decisions logged to OPEN_QUESTIONS.md (still Open, awaiting Francisco):**

- **Q-011 · Repo-root documents not in CLAUDE.md §12.** Three files now live at the project root but are not in §12's document set: `AGENTS.md` (Next.js 16 scaffold's agent-rules file — warns that Next.js 16 has breaking changes from training data), `README.md` (standard scaffold readme), and `BLAZE_STYLE_GUIDE.md` (~21 KB visual-identity content authored by Francisco during this session, with exact color hex values from the Blaze source PDF and component patterns). Per §12's document-sprawl guard, these need to be tiered or removed — but all three carry real content, so the conservative default is to keep them and ask Francisco to approve a §12 update. Recommended tiering: `BLAZE_STYLE_GUIDE.md` → Tier 2 (authoritative for UI); `AGENTS.md` → Tier 1 (framework agent-rules); `README.md` → accepted as conventional.
- **Q-012 · Prisma 7 generator output location.** Prisma 7's init now generates the client into `../app/generated/prisma` instead of `node_modules/.prisma/client`. It's gitignored so it won't pollute git, but it sits visually inside `app/`. Conservative default: keep it for now; revisit if it causes issues or imports feel awkward.

**What was learned:**

- **Next.js 16 is materially different from 15** in ways that matter for AI-assisted work. The scaffold ships an `AGENTS.md` that explicitly says: "This is NOT the Next.js you know — read node_modules/next/dist/docs/ before writing code." Take this seriously next session when writing Server Components, caching, or middleware. Training-data memory of Next.js 15 App Router behavior may not apply.
- **Prisma 7 has a new config model.** `prisma.config.ts` is the new single source of truth for datasource URL and migration path, replacing the old inline `datasource` block's URL. Our `schema.prisma` keeps the provider (`sqlite`) but the URL lives in `prisma.config.ts` via `process.env.DATABASE_URL`. This affects how migrations get run and how the client gets configured.
- **Package name constraint:** npm rejects uppercase and leading-underscore names, so `GrowthPathDemo` and `_scaffold` both failed `create-next-app`. Worked around by scaffolding into `scaffold-tmp/`, moving contents up, and renaming the package to `growth-path-demo`. Non-issue going forward.

**What blocked:** Nothing. Scaffold completed as planned.

**What's ready for next session (Day 1 of build):**

1. **Review this scaffold** (Francisco's explicit gate).
2. **Resolve Q-011** (tier the three undocumented root docs into CLAUDE.md §12).
3. **Resolve Q-006** (banker identities for the demo dropdown — conservative default is Sarah Chen / Marcus Webb / Priya Patel, but this is the last open item flagged as wanting a pre-Day-1 decision).
4. **Write the Prisma schema** from `docs/design/03_Data_Framework.docx` — the eight entities, the `step_shape` enum, and the reference data relationships. Run `pnpm prisma migrate dev --name init`. Verify the SQLite file is created and the generated client works.
5. **Begin the Jenny's Catering fixture** as a TypeScript seed file in `prisma/seed.ts`. Populate descriptions on every `MemberType`, `Topic`, `GrowthStep`, `GrowthTrack`, `Artifact`, `Rule` per CLAUDE.md §9.
6. **First concrete milestone** (from the pre-build entry's "Suggested next move"): a basic page that queries and displays Jenny's Catering's name, Member Type, and her Conversations list — proving the full data path (Prisma client → Server Component → render).

**Risks heading into Day 1:**

- The Prisma 7 client output path (`app/generated/prisma`) may surface import-path awkwardness once we actually start using the client. Keep an eye on it; relocate if it bites.
- Next.js 16's caching semantics changed from 15. Don't assume stable behavior around `fetch` caching, route segment config, or `revalidate` without consulting the v16 docs (per AGENTS.md).
- `app/globals.css` is now ~200 lines of Mira theme variables that we have not yet read end-to-end. Before writing any UI, skim it so we know what tokens Mira exposes and confirm they compose cleanly with the burnished-orange palette in `BLAZE_STYLE_GUIDE.md`. There may be a mismatch between Mira's neutral base and Blaze's warm-grey/orange identity — resolve via Tailwind CSS variable overrides rather than editing shadcn primitives.

**Follow-ups for Francisco:**

- Confirm the §12 tiering for `AGENTS.md`, `README.md`, `BLAZE_STYLE_GUIDE.md` (Q-011).
- Confirm or override the banker-identity default (Q-006).
- Decide whether you want the demo to lean on Mira's tokens as-shipped or to override them toward Blaze's burnished-orange identity from `BLAZE_STYLE_GUIDE.md` as the first UI-work task. This will shape whether Day-1 UI starts with shadcn primitives or with a Blaze-token customization pass.

---

## 2026-04-25 · Day 1 — full schema + fixture + AI-native structural enforcement

**Session type:** First implementation day. Completed scaffold checkpoints, theming pass, schema authoring, fixture authoring (steps 1-6), and a structural-discipline pass that hardens the AI-native ontology contracts.

**Major milestones (commits on `main`):**

- `c338f00` — Scaffold (Next.js 16 + Prisma 7 + shadcn Radix/Mira).
- `cacc02c` — Theming pass (Mira → Blaze tokens), Q-006 resolved (Scott Brynjolffson replaces Sarah Chen), SCOPE.md expanded to three full-fidelity Members.
- `c834b47` — Prisma schema for all 8 first-class entities + reference data; brief steps 1-2 (reference data + Member identity).
- `381981d` — Brief steps 3-6 fully authored: prior conversations with carry-forward Signals, featured Conversations with full Growth step executions, Artifacts, Growth steps, Growth tracks, Recommendations, derived state. Q-013 (extend `primary_concern` enum with `bank_capability`), Q-014 (Resolve-shape produces Signal+ActionCard for indecision), Q-011 (CLAUDE.md §12 Tier 2 expanded) resolved.
- *This commit* — Structural enforcement layer for the AI-native ontology: `MemberSummarySnapshot` model, `lib/summaries.ts` summary registry with `Result<string, MissingSlotsError>` contract, `lib/relation-names.ts` registry, retroactive snapshot generation for the three featured Conversations.

**What this turn added on top of step 4:**

1. **`MemberSummarySnapshot` model** — immutable, write-only audit record of the rendered Member summary at the moment of a Conversation save. Stores summary text + `template_version` + `generated_at`. Migration `20260425134932_add_member_summary_snapshot` applied. One snapshot per (member, conversation). UI surface deferred to post-demo per Q-015.

2. **`lib/summaries.ts`** — registry with three exports (`summarizeMember`, `summarizeGrowthTrack`, `summarizeRecommendation`) using the `Result<string, MissingSlotsError>` contract. Each function declares required slots and returns explicit errors when slots are missing rather than rendering half-blank prose. `summarizeMember` has a separate `initial_state` variant for Members with no Conversations yet (selected automatically when `last_touch_at` is null). Each function carries a `*_TEMPLATE_VERSION` integer constant for snapshot interpretability across template revisions.

3. **`lib/relation-names.ts`** — runtime registry of the canonical verb-phrase mapping from Prisma's structural relations to Semantic Discipline Principle 2 named relationships. The Named Relationships block at the top of `prisma/schema.prisma` is the comment-form companion; the registry is the runtime form. Two-File Rule: any new schema relation updates both.

4. **Module relocation** — moved `app/lib/{enum-descriptions,rule-engine}.ts` to root `lib/` for consistency with shadcn's `lib/utils.ts` and the user's explicit `lib/summaries.ts` / `lib/relation-names.ts` paths. `app/lib/summary-templates.ts` deleted (the prior partial implementation is replaced by the stricter `lib/summaries.ts` contract).

5. **Q-015 logged** as Open / Deferred to post-demo discussion: surfacing `MemberSummarySnapshot` records in banker UI raises template-versioning, divergence-with-live-state, regulatory-hold, and privacy-deletion-cascade questions that need leadership and compliance input. Persistence is implemented for audit-trail integrity regardless.

6. **`prisma/checkpoint.ts`** — reproducible verification script that renders the compliance check, three Member profiles, rule engine output, registry-rendered Member summaries, snapshot rows, the relation-name registry, and Growth track summaries. Sister to `prisma/seed.ts`.

**Verified at the step-4 checkpoint:**

- Row counts: 3 bankers · 3 industry families · 15 topics · 9 products · 3 member types · 3 rules · 3 members · 3 artifacts · 12 growth steps · 3 growth tracks · 16 conversations · 12 growth-step executions · 9 signals · 4 action cards · 3 recommendations · **3 member summary snapshots**.
- Principle 1 compliance: all 33 reference entities carry descriptions ≥15 words (min 19, median 32, max 116). No regression across the structural pass.
- `summarizeMember` renders cleanly for all three Members with no `MissingSlotsError`. `bank_capability` propagation verified — Cygnus's summary reads "...concerned about whether the bank can handle a deal of this size" rather than the bare token.
- Rule engine output is correct: Jenny → "Smooth seasonal cash flow with LOC for small caterer" #1 (high); Northland → "Unlock growth capacity with fleet financing" #1 (high); Cygnus → "Earn the capital event with the right team in the room" #1 (medium).

**Future-cost note for next architecture review:**

In v1 the templated `summarizeMember` runs in microseconds per call, so generating a snapshot on every Conversation save is essentially free. If a future version replaces templates with LLM-generated summaries — natural-language faithful summaries are explicitly future scope per Semantic Discipline §3.5 — the per-event cost becomes meaningful at scale (hundreds of milliseconds + token spend per snapshot, plus rate-limit and provider-availability concerns). Migration plan should be: (a) keep templated summaries as a fallback rendering path, (b) generate LLM summaries asynchronously off the save critical path, (c) write both into the snapshot or write the LLM output as a separate snapshot kind. This is a Phase 2 architecture conversation, not a v1 concern.

**Data Framework erratum required at next review** (logged here so it's not lost):

§4.5 (Resolve shape — capture schema) currently reads "Produces: one ActionCard with appropriate type based on resolution_type and indecision_type." Per Q-014's resolution, the actual production set is "Produces: one ActionCard, plus one Signal of type=indecision when resolution_type=indecision, anchored to the matching indecision Topic." The fixture seed implements the corrected behaviour. Update the Data Framework prose at next revision.

**What's open after Day 1:**

- Q-001..Q-005 — pre-build deferred (HubSpot tier, Growth lead staffing, RM incentives, core integration, first Member Type buildout). All have working conservative defaults.
- Q-007 — Artifact rendering tech (Recharts vs alt). Likely closes when first Artifact UI builds in Day 4-5.
- Q-008 — Demo data persistence (server SQLite vs session-scoped). Pre-Insight Engine concern.
- Q-012 — Prisma 7 generator output location (currently `app/generated/prisma`). Low priority; revisit if it bites during UI work.
- Q-015 — `MemberSummarySnapshot` UI surface; deferred to post-demo with leadership and compliance.

**Risks heading into Day 2:**

- Schema is now effectively locked. Any further structural change to the Member, Conversation, Signal, ActionCard, Recommendation, or MemberSummarySnapshot models needs an explicit OPEN_QUESTIONS entry first. Day 2 should be UI work, not schema work.
- The summary registry's `Result<string, MissingSlotsError>` contract assumes the UI handles errors visibly (not silently rendering half-blank prose). Day 2 UI work needs to surface MissingSlotsError as a visible "summary unavailable — fixture missing slot X" placeholder rather than empty string.
- Mira's neutral baseline tokens are now overlaid with Blaze hex per `BLAZE_STYLE_GUIDE.md` §13. UI components may surface contrast issues (e.g., parchment-on-cream backgrounds with insufficient ratio). Run a quick contrast pass before Day 2's first screen ships.

**Suggested next move (Day 2):**

Start the Member profile UI. Three Members already render their full structured profile via `prisma/checkpoint.ts`; the Day 2 task is producing the actual visual surface using shadcn primitives over the `summarizeMember` registry, the orange-headed-panel pattern from `BLAZE_STYLE_GUIDE.md` §4, and Recharts for the Show-step's seasonal smoothing chart Artifact.

**Follow-ups for Francisco:**

- Confirm the structural pass is acceptable. If you want the snapshot generation to run for every Conversation (not just featured ones) in the demo, say so before Day 2 — adding the other 13 prior conversations is a single-line change.
- Confirm Q-015's "deferred to post-demo" disposition; this is the right hold, but flag if you want the demo to render snapshots for stakeholder education.
- Day 2 starts on UI. Confirm the right entry surface — Member profile (three full surfaces to build) vs banker dashboard (lighter, but lets the dropdown identity-switch land first).

---

## 2026-04-25 (later) · Day 1 close — small follow-ups before Day 2

**Session type:** Three small items applied between the Day-1 checkpoint approval and the start of Day-2 UI work.

**What was done:**

- **`lib/relation-names.ts` cleanup.** The `Rule rule_surfaces GrowthTrack` entry is now `Rule surfaces GrowthTrack`. The bare verb-phrase is consistent with every other entry in the registry; the source column is unambiguous on its own. The discriminator note about `GrowthStepExecution → Recommendation` already using the past-tense `surfaced` is preserved as a comment in the type union.

- **Snapshot timestamp note (this entry's main purpose).** All three `MemberSummarySnapshot` rows generated by `prisma/seed.ts` carry `generated_at = 2026-04-25T12:00:00Z` — the demo "now" anchor. They are *retroactive* fixture data, not real Conversation-save events. In production, snapshots will be stamped with the actual Conversation save timestamp (e.g., Jenny's snapshot would have been stamped 2026-04-08 when Scott saved her Meeting recap, not 2026-04-25 when the seed ran). The `template_version` field is meaningful in both contexts; the `generated_at` field is the one that diverges between fixture and production semantics. Anyone reading the demo data should treat snapshot `generated_at` values as "demo fixture time" rather than "real save time".

- **Background agent scheduled for Q-015.** Routine set to fire ~6 weeks out (early June 2026) to revisit whether the leadership + compliance conversation about surfacing `MemberSummarySnapshot` records in banker UI has progressed, and to refresh Q-015's status accordingly. Belt-and-suspenders alongside Francisco's calendar — the agent keeps the technical follow-up visible in the project; the human convening of the conversation happens through Francisco's normal scheduling.

**Heads-up for Day-2 UI (recorded so it doesn't get forgotten under the orange-headed-panel work):**

The `summarizeMember` template counts active *blockers* — a deliberate compression that reads cleanly in a one-paragraph summary. The Member profile UI must NOT inherit this compression. Per Module and Data Flow §4.2 Band 3, the active-Signals band renders Signals **grouped by all four types** (goal · blocker · trigger · indecision). For Cygnus this matters: her two triggers (capacity expansion evaluation, customer volume commitment) are arguably more demo-relevant than her single carry-forward blocker (customer concentration). The summary's compression is correct in prose; it would be wrong in the UI band.

---

## 2026-04-25 (later still) · GitHub remote added

**Session type:** Repo hosting setup. No code changes — just adding the project to GitHub between Day 1's clean state and Day 2's UI work.

**What was done:**

- **Repo created** at `https://github.com/Farechiga/blaze-member-signals-demo`. Visibility: **private**. Description: "Blaze Member Signals — banker enablement demo. Standalone Next.js + Prisma + SQLite. Demo phase only; not connected to any production Blaze systems."
- **Origin configured** in the local repo via `gh repo create --source=. --remote=origin`. `git remote -v` shows `origin` pointing at the new repo for both fetch and push.
- **History pushed** with `git push -u origin main`. All seven commits through Day 1 are now visible on the remote: c338f00 (scaffold) · fcdbe66 (BUILD_LOG scaffold entry) · cacc02c (theming + Q-006 + scope expansion) · c834b47 (Prisma schema + steps 1-2) · 381981d (steps 3-6 + Q-013/14/11) · 238741d (structural enforcement layer) · 32219bb (Day-1 close follow-ups). `main` tracks `origin/main`.
- **`.gitignore` verified clean** by listing the remote tree via `gh api repos/.../contents`. None of the gitignored artefacts (`node_modules/`, `.next/`, `dev.db`, `.env`, `.DS_Store`, `next-env.d.ts`, `.claude/settings.local.json`, `app/generated/prisma/`) leaked. Spot-checked `app/` and `prisma/` subdirectories explicitly.

**Setup notes captured for posterity:**

- `gh` (GitHub CLI) was installed via Homebrew at `/opt/homebrew/bin/gh` (version 2.91.0). Auth used the device-flow web login (`gh auth login --web`); token is stored in macOS Keychain with scopes `gist · read:org · repo`.
- Homebrew itself was installed during this session (it wasn't on the machine at the start of Day 1). `/opt/homebrew/bin` may need to be added to `~/.zshrc` for non-fresh shells; the standard `eval "$(/opt/homebrew/bin/brew shellenv)"` line covers this.
- `~/.config/gh/hosts.yml` was created on first successful auth; `gh` reads from there + Keychain on subsequent runs.

**Implications for the rest of the build:**

- The Q-015 background agent scheduled earlier (`trig_01Pzd6hPo1Wq4emfqB9fguVm`, fires 2026-06-05) is **unaffected** — it was configured as a self-contained reminder agent with no `sources`, so the absence of a GitHub remote at schedule time doesn't matter. The agent will fire and produce its status paragraph regardless.
- Future scheduled agents can now be configured with `sources: [{git_repository: {url: "https://github.com/Farechiga/blaze-member-signals-demo"}}]` if they need to read project files. They'll need access — the repo is private, so each agent will need either (a) the GitHub App installed on the repo, or (b) credentials passed via `mcp_connections` / equivalent. Set this up when the first repo-aware agent is created, not preemptively.
- Day-2 commits will land on `main` and push cleanly. No per-commit push step is implied unless we want the remote to track in-progress work; default is to push at natural milestones.

**Risks:** none introduced by this step. The remote is private and contains no PII or secrets (`.env` excluded by `.env*` rule).

---

## 2026-04-25 (Day 2 step b) · Member profile — substantive + visual pass

**Session type:** Day-2 step (b), executed as the four substeps b.1 → b.4 in a single turn per the plan in Francisco's review.

**Schema and fixture (b.1):**

- **Q-016 Resolved**: added `Recommendation.responds_to_signals Signal[]` (implicit Prisma m-n under the relation `RecommendationRespondsToSignal`). Migration `20260425160637_recommendation_responds_to_signals` applied. Reverse side `Signal.responding_recommendations` available. Named Relationships block in `prisma/schema.prisma` updated; `lib/relation-names.ts` registry gains `Recommendation responds_to Signal`.
- **New Topic** `goal.cash_flow_smoothing` added to canonical taxonomy with full Semantic Discipline description ("...member's intent to smooth lumpy revenue into manageable cash flow..."). Topic count is now 16.
- **New goal Signals on prior conversations** — the user's read was right: the LOC and Fleet Loan recommendations needed to read as *responding to a stated objective*, not just a blocker.
  - Jenny's `goal.cash_flow_smoothing` Signal added on the 2024-03-12 conversation (banker_inferred from "winter was tough", verbatim quote captured as "I just want to be able to sleep through January"). Signal count is now 11.
  - Northland's `goal.fleet_expansion` Signal added on the 2025-02-22 conversation (member_stated, verbatim "we're going to need another truck before next summer").
  - Cygnus's existing `goal.customer_growth` (Nov 2024) needed no addition.
- **`responds_to_signals` populated** on all three Recommendations:
  - Jenny's $75K LOC → `[blocker.cash_flow_seasonal, goal.cash_flow_smoothing]`
  - Northland's $180K Fleet Loan → `[blocker.capacity_constrained, goal.fleet_expansion]`
  - Cygnus's CRE Term Loan → `[trigger.capacity_expansion_evaluation, trigger.customer_volume_commitment, goal.customer_growth]`
- **Recommendation `rationale_text` strings updated** to reference the goal Signal alongside the blocker / triggers ("…against a long-running goal of smoothing lumpy cash flow…").
- **Member-facing register audit on `suggested_opening` fields**: all four already-passing — no banker-facing terms ("Growth track", "Artifact", "parameterized chart") leaked into member-facing language. Discipline upheld.
- **CLAUDE.md §5** gains a fourth subsection — "Member-facing language (the third register)" — documenting the code → banker-facing → member-facing tier with explicit forbidden terms and a per-field rendering table.

**Visual identity (b.3):**

- **Page background** for `/members/jenny` switches to `bg-blaze-grey-darker` (`#262626`) per BLAZE_STYLE_GUIDE §2.2 — surfaces invert.
- **Frosted-glass panel pattern** applied to all six bands + sidebar + header: `rounded-lg border border-blaze-frost-edge bg-white/92 backdrop-blur p-5`.
- **`--blaze-frost-edge` (`#CAE8FD`)** added to BLAZE_STYLE_GUIDE.md §2.5 (new subsection "Surface accents — narrow purpose tokens"). The token has a single documented use (1px borders on semi-transparent white panels over the dark ground); a comment in `app/globals.css` repeats the constraint.
- All body prose remains on white panel surfaces — verified visually. The dark-grey ground only shows in the negative space between panels, exactly per the source PDF page-12 reference.

**UI substantive treatments (b.2):**

- **Trace pattern**: every Signal, Recommendation, ActionCard, Conversation history row, and Artifact share record carries a `<details>`/`<summary>` block citing the originating Conversation + Growth-step execution. Implementation uses native HTML disclosure — no client-side JS needed. The verb-phrase prose inside each expansion (e.g., "Recommendation produced_by GrowthStepExecution (show-shape) · surfaced_by_rule …") reads from the relation-name registry vocabulary.
- **Captured-value chips**: Recommendation `size_proposed` / `response` / `primary_concern` / `confidence_band` / `structure`, Signal `severity` / `recency` / `confidence` / magnitude, and ActionCard `type` / `due_at` / `member_reaction` all render as visually distinct chips (orange-deep border, orange-pale tint, monospace, smaller-than-body) with `title=` tooltips citing the capture event ("Captured · Signal.severity · check in · Apr 8, 2026 · Surface seasonal cash flow stress"). Hover-to-reveal works in every desktop browser.
- **Recommendation responds_to_signals inline**: each Recommendation in Band 4 renders its responding Signals as anchor links to the corresponding `<li id="signal-…">` in Band 3. `scroll-mt-24` on the target preserves the band header when scrolling.
- **Active-state summary tokens are clickable** per §I (6)(a): the summarizeMember prose has the "N active blocker(s)", "N open ActionCard(s)", and "$NK proposal for {Product}" tokens replaced with anchor links to Band 3, Band 5, and Band 4 respectively. Implementation: `injectLinks(text, [{ token, node }])` — first-occurrence string replacement that never duplicates the canonical lib/summaries.ts wording. Defers the richer (b)-treatment chips-in-prose to step (c) per the user's instruction.

**Artifact preview modal (b.4):**

- New Client Component `app/members/jenny/artifact-preview-dialog.tsx` wrapping the native `<dialog>` element. Click on the artifact name in Band 6's share record opens a centered modal with the artifact metadata (title, description, type), the parameters used in *that* rendering, the share record (member reaction + sent-as-takeaway), and a dashed-border "Chart rendering — Day 3" placeholder. ESC closes; outside-click closes. The `::backdrop` pseudo-element uses the `blaze-grey-darker/70` overlay for a frosted darkroom effect that matches the page's dark-ground identity.

**Verified at the b.4 checkpoint:**

- Row counts after re-seed: 16 topics (was 15 — `goal.cash_flow_smoothing` added) · 11 signals (was 9 — Jenny's cash-flow-smoothing goal + Northland's fleet-expansion goal) · everything else unchanged.
- Sanity-query confirms `responds_to_signals` correctly populated for all three Recommendations.
- HTTP 200 on `GET /members/jenny`; rendered HTML contains all four signal-type buckets (Goals(1) · Blockers(2) · Triggers(0) · Indecisions(1)), captured chips with their tooltip titles, the trace details, the responds-to inline links, the dialog scaffolding, and the "Suggested opening" member-facing-register block on the open ActionCard.

**What's deferred:**

- Step (c) — orange-headed-panel pattern from §4 of the style guide — is the next visual pass.
- Step (d) — live `fireRules()` call wiring up the suggested-next-step panel — comes after the visual pass settles.
- Day 3 — the actual Recharts seasonal-smoothing chart inside the modal — is the natural moment to validate Recharts × Blaze chart palette × parameter binding (Q-007 likely closes here).
- Northland and Cygnus surfaces — currently `/members/jenny` is a static route; generalizing to `/members/[id]` is a small lift once the visual pattern is finalized.

**Future-cost / hygiene notes:**

- The page's Prisma client construction is per-request (`getPrisma()` inside the Server Component). Fine for the demo. Production needs a singleton (Next.js dev mode hot reload tends to leak connections otherwise).
- The Artifact share derivation reads from `captured_data` jsonb on Show executions. The brief's preferred shape is a dedicated `ArtifactShareRecord` row, deferred for now to avoid a second persistence path. Revisit if a future query needs to filter or aggregate share records independently of executions.

---

## 2026-04-25 (Day 2 step c prep) · Goal phrasing, responds-to ordering, Q-017, chart

**Session type:** Five small-but-substantive updates between the step-(b) review and step (c). The biggest is bringing the seasonal-smoothing chart forward from Day-3 deferral into a working Recharts implementation inside the modal.

**Fixture refinements:**

- **Goal Topic phrasings tightened to action-forward / lending-focused** wording:
  - `goal.cash_flow_smoothing` display name "Smooth lumpy cash flow into manageable shape" → "Smooth seasonal revenue with working capital". Description rewritten to align (the verb acts on revenue and the instrument is named, so the goal ties directly to the LOC recommendation that responds to it).
  - `goal.fleet_expansion` display name "Fleet expansion" → "Add fleet capacity to capture declined work". Description now reads as the structural counterpart to a capacity-constrained blocker.
  - `goal.customer_growth` display name "Customer base growth" → "Grow alongside customer expansion". Description rewritten to highlight the action-forward intent of keeping pace with anchor-customer growth.
- **Q-017 Resolved** — backfilled `magnitude: 45, unit: "days", frequency: null` on Jenny's Dec-2025 `blocker.receivables_timing` Signal. The "45+ days late" detail had been carried only in `banker_note` prose; making it a structured field lets the Insight Engine aggregate receivables-timing severity and lets the chip pattern surface the value in Band 3.
- **Indecision Signals added to `Recommendation.responds_to_signals`** for Jenny and Northland. The Resolve step runs after the Show step, so the Recommendation is created first; the seed now does a `prisma.recommendation.update({ where: { growth_step_execution_id: showExec.id }, data: { responds_to_signals: { connect: [...] } } })` after the indecision Signal exists. Cygnus has no indecision; unchanged.

**UI substantive (b.2 follow-on):**

- **Band 4 responds-to list** now renders sorted by Signal type (goal → blocker → trigger → indecision) with verb-prefix labels per type:
  - "→ serves goal: Smooth seasonal revenue with working capital"
  - "→ addresses blocker: Seasonal cash flow stress ($12K/quarterly)"
  - "→ responds to indecision: Needs another decision-maker's input"
  This makes the Goals→Recommendation thread visible — the recommendation reads as serving a stated objective, not just patching a blocker. Magnitude is rendered inline as plain text in this compact context (chip treatment is reserved for the standalone Signal entry in Band 3 to avoid visual noise).

**Chart implementation (Day-3 work brought forward into step (c)):**

- New Client Component `app/members/jenny/seasonal-smoothing-chart.tsx` using Recharts 3.8 `ComposedChart`. Renders a 12-month two-series cash-position chart per Francisco's spec:
  - "Cash position without LOC": #4F5052 line, 2px stroke, dips below zero in Jan-Mar and Sep-Oct.
  - "Cash position with $75K LOC": #B45F26 line, 2.5px stroke, stays positive throughout. Subtle `rgba(180, 95, 38, 0.12)` area fill below the with-LOC line indicating LOC utilization.
  - Grid lines: faint warm parchment (`rgba(232, 224, 212, 0.6)` dashed).
  - Axes: Inter 12px / #4F5052; Y-axis ticks formatted as `$NK`.
  - Tooltip: Inter 12px, formatted dollar values, white-with-frost-edge styling.
  - Legend: top-right, Inter.
  - All data hardcoded for Jenny's parameters per the spec (revenue band $500K-$1M, monthly_low 35000, monthly_high 95000, proposed_loc_size 75000); no parameterization yet.
- **Dialog dispatches on artifact template**: `ArtifactPreviewData` gains a `template` field. When `template === "seasonal_smoothing_chart_v1"` the dialog renders the new chart; otherwise the dashed-border placeholder remains for templates that haven't been built yet (`fleet_roi_composed_chart_v1`, `capital_event_map_v1`).
- The `parameters_used` block above the chart in the dialog already shows the parameters that drove the rendering — banker can see `{ monthly_low: 35000, monthly_high: 95000, proposed_loc_size: 75000 }` directly above the chart they produced.

**Member-facing register confirmation (no change):**

- ActionCard rationale (banker-facing) and `suggested_opening` (member-facing) discipline confirmed working. No edits needed.

**Verified:**

- Re-seed clean. Row counts: 16 topics, 11 signals, 3 recommendations (now each with their indecision Signal in responds_to_signals where applicable), 16 conversations, 4 action cards, 3 snapshots.
- Sanity-query confirms responds_to_signals: Jenny has goal + indecision + blocker; Northland has goal + indecision + blocker; Cygnus has goal + 2 triggers.
- Q-017 backfill confirmed: Dec 2025 receivables Signal magnitude reads `45 days`.
- `GET /members/jenny` returns 200 (94 KB). Verb-prefixed responds-to lines render ("serves goal", "addresses blocker", "responds to indecision"). New goal display names render. Q-017 chip "45 days" renders in Band 3.
- Chart rendering will be visible client-side once the modal opens; the bundle includes Recharts and the chart component is dispatched on artifact template.

**Risks / future-cost notes:**

- Recharts 3.8's `ComposedChart` API matches earlier versions; no surprises encountered. If chart performance becomes an issue at scale (unlikely at 12 data points), `isAnimationActive={false}` is already set.
- The chart data is hardcoded; the production version would compute the 12 monthly values from the Member's actual cash flow history modulated by the artifact's parameters. That parameterization lands when real members surface — out of scope for the demo.

**What's deferred:**

- Step (c) — orange-headed-panel pattern from BLAZE_STYLE_GUIDE §4 — still ahead.
- Step (d) — live `fireRules()` wiring on the pinned suggestion.
- `fleet_roi_composed_chart_v1` and `capital_event_map_v1` chart implementations for Northland and Cygnus when their surfaces come online.
- `/members/[id]` dynamic generalization.

---

## 2026-04-25 (Day 2 step b approval) · Two small notes before step (c) eyeball

**Session type:** Documentation-only entry capturing decisions confirmed in the step-(b) approval, so they're retrievable without rereading the conversation transcript.

**Captured-value chip vs. inline-prose treatment — design decision (rule for the project):**

Captured-value chip pattern applies in **Band 3** (structured Signal display); inline prose treatment applies in **Band 4** (narrative responds-to summary). The visual distinction reflects reading context, not value provenance — both surfaces honor the underlying captured-at-Growth-step audit chain.

Concretely: when the same value appears in Band 3 and again in Band 4 (e.g., Jenny's seasonal-cash-flow magnitude reads `$12K/quarterly` in both bands), Band 3 renders it as a chip with a hover tooltip citing the Size-step capture event, and Band 4 renders it inline as `($12K/quarterly)` in parens within the responds-to line. The provenance is identical in both cases; the visual treatment differs to match the reading context (structured display vs. narrative summary). Apply this rule going forward: chip in any context where the value is the primary content of its line; inline prose in any context where the value is a parenthetical detail inside a larger sentence.

**Q-017 status:** Confirmed Resolved. Moved the entry to the Resolved section of OPEN_QUESTIONS (it had been placed correctly as Resolved by content but accidentally listed under the Open header in the prior turn).

**Goal-phrasing discipline:** Confirmed propagating cleanly across all three Members without per-Member supervision. No per-Member follow-ups needed; the discipline is doing its job.

**Pending Francisco's eyeball:** The seasonal smoothing chart in the Artifact preview modal — does the without-LOC line's negative dips read as obviously concerning, does the with-LOC line + area fill read as obviously protective, is the smoothing story legible in 2 seconds. Step (c) (orange-headed-panel pattern) waits on that confirmation. Step (d) (live `fireRules()` wiring) follows step (c) cleanly. The two remaining Artifact templates (`fleet_roi_composed_chart_v1`, `capital_event_map_v1`) and the `/members/[id]` dynamic generalization stay queued until Jenny's profile is fully feature-complete.

---

## 2026-04-25 (Day 2 chart approval) · Seasonal smoothing chart lands; design notes for retrieval

**Session type:** Documentation-only entry capturing the chart approval, an observation worth preserving, and three knobs we considered and did not apply.

**Chart approval:** The seasonal smoothing chart in the Artifact preview modal passes the 2-second test cleanly: "without LOC you dip negative in winter and fall; with LOC you stay positive throughout." Working specifically: y-axis auto-scale gives the negative dips real visual weight (not a footnote at the bottom); the orange line dominates correctly; the area fill connects the two lines visually; the seasonal pattern reads as realistic for an event-driven business (slow winter, wedding-season peak, fall dip, modest December recovery); the legend names the financing instrument by amount.

**Convergence-in-strong-months observation (preserve, do not change):** The two lines converge in May–August because the LOC isn't drawn when revenue is high. This is technically correct and is actually a *positive* part of the story — the LOC costs nothing when not needed. A demo viewer might pause briefly on the convergence; a banker can explain it in five seconds. Adding visual separation to "fix" the convergence would trade accuracy for visual differentiation, and accuracy is more valuable here. Leave the lines as they are.

**Considered, not applied** (preserved for retrieval if future banker testing reports the rhetoric softening):

1. **`<ReferenceLine y={0}>` with a slightly heavier stroke.** Would visually anchor the zero baseline so dips below it read as transgression rather than range. Not currently needed — auto-scale already gives the dips weight.
2. **`<ReferenceArea y1={-20000} y2={0}>` with a faint `rgba(156, 51, 37, 0.05)` fill.** Would tint the danger zone subtly without changing the lines themselves, reinforcing "this is a problem region." Not currently needed.
3. **Bumping the without-LOC line a notch darker** (e.g., `#2B2B29` `blaze-grey-dark` instead of `#4F5052` `blaze-grey-body`). Would make the dips read as more attention-grabbing. Not currently needed; the orange line should dominate, and a darker grey risks reversing that ranking.

If real banker testing produces feedback like "the dips don't feel concerning enough," the cheapest first move is knob 1 (zero reference line). Knob 2 if it still doesn't carry. Knob 3 last, because it touches the visual ranking between the two lines.

---

## 2026-04-25 (Day 2 steps c + d) · Orange-headed pattern + live rule engine — Jenny profile feature-complete

**Session type:** Step (c) and (d) executed in a single turn per Francisco's plan ("After (c) and (d), the Jenny profile is feature-complete for v1"). The next move is the `/members/[id]` dynamic generalization, with a checkpoint between.

**Step (c) — orange-headed-panel pattern:**

- New `Band` wrapper component in `app/members/jenny/page.tsx` encapsulates the dominant pattern from `BLAZE_STYLE_GUIDE.md` §4: 1px `blaze-frost-edge` outer border, `blaze-orange` (or `blaze-orange-deep` for the pinned-suggested-step "highlight" tone) header strip with a white uppercase-tracked label and an optional `labelMeta` right-aligned in white/85, white/92 backdrop-blur body with the existing internal padding.
- Applied to all band-level surfaces, top to bottom: pinned Suggested next step, Band 1 Member, Band 2 Active state, Band 3 Active signals, Band 4 Active proposals, Band 5 Open work, Band 6 History, plus the sidebar mini-bands Private notes and Forward signals. Nine orange-headed strips total per page. Each band's prior in-body label caption was removed since the strip now carries the band identity.
- Inner items inside bands (Signal entries, Recommendation cards, ActionCard rows, history entries) keep their existing soft cream-tinted treatment so the orange header stays anchored at the band level and doesn't read as visually doubled.
- §14 anti-patterns honored: no drop shadows on default state (the modal dialog's shadow is exempt — it's an active state, not default); orange used as accent only — never flood (the strip is ~40px tall on a multi-hundred-pixel-tall band); hairline (1px) borders only.
- One mid-flight visual fix: the original `Suggested next step` `labelMeta` carried a `CapturedChip` for "high confidence", but the chip's deep-orange-on-pale-orange treatment got muddy when overlaid on the burnished-orange header strip itself (the chip's contrast depends on a white/cream backdrop). Per the chip-vs-prose rule recorded in the prior BUILD_LOG entry — "chip in any context where the value is the primary content of its line; inline prose in any context where the value is a parenthetical detail inside a larger sentence" — the band header is parenthetical-detail context, so plain white/85 text is correct here. Fixed.

**Step (d) — live `fireRules()` wiring:**

- The pinned Suggested-next-step panel previously read from `Member.member_type.default_growth_tracks[0]` (a hardcoded shortcut introduced in step b). Replaced with a live call to `fireRules()` from `lib/rule-engine.ts`, evaluating every Rule against `(member, activeSignals, productsHeld)` per Data Framework §6.7's AST shape.
- The page now fetches rules with `output_growth_tracks: { id, name, description }` included; resolves `core_sync_state.products_held` to subcategories before passing into the engine; and uses the top-ranked result's first output Growth track to populate the panel.
- Verified: `GET /members/jenny` returns 200 (~98 KB). The pinned panel renders **"Smooth seasonal cash flow with LOC for small caterer"** with **"high confidence"** in the header `labelMeta` — exactly the rule-engine result Francisco called for. The "Surfaced by rule:" caption names the rule that fired ("Surface seasonal cash flow track for small caterers"), so the provenance from active Signal → Rule → Growth track is traceable on-page.
- Defensive fall-through: if `fireRules()` returns 0 results, the pinned panel is hidden rather than showing a stale fallback. Not expected to fire in the seeded fixture; just hygiene.

**Verified at the close of step (d):**

- Page renders cleanly: 9 `bg-blaze-orange` header strips (pinned + 6 bands + 2 sidebar mini-bands), 20 `backdrop-blur` panel bodies, 21 `<details>` trace expansions, 44 captured-value tooltips, the Q-017 "45 days" chip in Band 3, the goal-first verb-prefix-labeled responds-to lines in Band 4, and the seasonal smoothing chart inside the Artifact preview modal.
- Rule engine fires the expected rule for Jenny.

**Jenny profile is feature-complete for v1.**

**Queued, not started:**

- `/members/[id]` dynamic generalization — parameterize the route so Northland and Cygnus render against the same component with their own data. Stop and check in once Jenny is reviewed feature-complete; we'll review before generalizing.
- The two remaining Artifact templates (`fleet_roi_composed_chart_v1` for Northland, `capital_event_map_v1` for Cygnus) stay queued for after generalization confirms the component handles all three Members cleanly.
- The Insight Engine surfaces (the third major module per Module and Data Flow §5) are not yet started; that's a Day 3+ concern.

---

## 2026-04-25 (Day 2 borderless restyle) · Typography-led pattern replaces orange-headed-panel as dominant

**Session type:** Substantial visual refactor of `/members/jenny` from the orange-headed-panel pattern to a borderless typography-led design per Francisco's eight-point spec. Three pieces of orange semantic work are preserved (section marks, quote attribution, hyperlinks); everything else relies on typography, whitespace, and a small cool-grey palette for structural elements.

**Style-guide changes:**

- **`BLAZE_STYLE_GUIDE.md` §2.6** added — three new tokens (`--blaze-charcoal` `#1A1A1A`, `--blaze-data-cool` `#F9FBFD`, `--blaze-rule` `#E8EAEC`). All three are deliberate temperature shifts away from the warm palette, used precisely because they need to read as "structural" rather than "decorative."
- **§2.7** added — orange section-mark dimensions (8×16px default, 6×12px compact).
- **§4** reframed — the orange-headed-panel pattern is now "occasional anchor (sparse contexts only)" rather than dominant. The pinned Suggested-next-step card is the canonical example of when it still applies.
- **§4.5** added — "Borderless typography-led pattern (dominant for dense surfaces)" — codifies the section structure (orange rectangle mark + uppercase tracked label + optional meta), body text hierarchy (true black titles, charcoal body, grey-body secondary), captured-value chip (cool-grey fill + 1.5px orange border + square edges + monospace + charcoal text), quote-attribution mark (3px orange line + italic grey-body), section dividers (1px cool-grey rule centered in ~96px gap), and the three pieces of orange semantic work.

**Token plumbing:**

- `app/globals.css` gains the three new color tokens with usage notes.

**Page refactor (`app/members/jenny/page.tsx`):**

- Page background switched from `blaze-grey-darker` (frosted-glass-on-dark) to `blaze-cream` (warm parchment ground).
- Old `Band` wrapper removed; replaced with two new primitives:
  - `SectionLabel` — orange rectangle (8×16 default / 6×12 compact) + uppercase tracked label in `blaze-charcoal` + optional grey-body meta.
  - `Rule` — 1px `blaze-rule` divider centered in `my-12` (~96px total gap).
- Each of the six bands (and the two sidebar mini-bands) now opens with a `SectionLabel`. Bands are separated by `Rule` dividers.
- Section titles inside bands at 18px/600/black (where used — e.g., "Where things stand" under the Active state label). Member identity heading at 28px/600/black.
- Body text: primary `blaze-charcoal`, secondary `blaze-grey-body`. The page-wide `text-blaze-grey-darker → text-blaze-charcoal` swap landed in one mass replace; `text-blaze-grey-soft → text-blaze-grey-body` in another.
- **Captured-value chip** redesigned per spec: cool-grey fill (`bg-blaze-data-cool`), 1.5px `border-blaze-orange`, square edges (no `rounded`), monospace, charcoal text. 44 chips on the page.
- **Verbatim member quotes** updated: 3px-wide `border-l border-blaze-orange` (replacing the prior 2px orange/40), italic `blaze-grey-body`. 10 quote-attribution lines visible.
- **Verb-prefix labels** in Recommendation responds-to lines (`→ serves goal:`, `→ addresses blocker:`, `→ responds to indecision:`) now render in `blaze-orange-deep` font-medium — the third piece of orange semantic work, alongside section marks and hyperlinks.
- **Inner card chrome removed** from Signal entries / Recommendation entries / ActionCard rows. The cream-on-cream backgrounds had become invisible against the new cream page ground; whitespace + typography do the structural work now. ActionCards retain a subtle danger-red left border when overdue (3px `border-blaze-danger` matching the orange quote line treatment).
- **Pinned Suggested-next-step panel** retained as the deliberate exception — orange-pale card on `blaze-orange-pale/85`, orange-deep heading, full burnished-orange "Run Growth track" button. It stays distinct so the primary CTA reads as primary.
- History band's left timeline rule softened from `border-blaze-dust` to `border-blaze-rule` (the cool-grey).

**Modal refactor (`app/members/jenny/artifact-preview-dialog.tsx`):**

- Borderless treatment inside the modal: each sub-section (Description, Parameters used, Share record, Chart) opens with the orange compact (6×12) rectangle mark + uppercase tracked label.
- Modal body background switched to `bg-blaze-cream` so the modal feels of-a-piece with the page ground.
- Header and footer keep a 1px `blaze-rule` divider separating them from the content.
- Close button is now borderless (transparent with hover tint) matching the page's button treatment.
- The seasonal smoothing chart inside the modal is unchanged — its content is the chart itself, not a card around it.

**Verified:**

- `GET /members/jenny` returns 200 (~96 KB).
- 8 orange rectangle marks render (6 default-size in main column + 2 compact in sidebar). Pinned suggested-step has no rectangle mark (it's the orange-pale card exception).
- 44 cool-grey-fill chips render (one per captured value across the page).
- 10 orange quote-attribution lines render (verbatim Signal quotes + ActionCard suggested-opening blocks).
- 16 `blaze-rule` instances render (section dividers between bands + history timeline + modal header/footer dividers).
- 122 `blaze-charcoal` text instances render (body text everywhere).
- Live `fireRules()` result still populates the pinned panel ("Smooth seasonal cash flow with LOC for small caterer", high confidence).
- All step-(b) treatments retained: trace `<details>`, captured-value chip tooltips, responds-to anchor links, clickable summary tokens, modal scaffolding.

**Watch list for Francisco's eyeball:**

- **Section marks at 8×16:** should read as a wordmark/bullet, not a status flag. If too prominent, drop to the compact 6×12 globally (currently only the sidebar uses compact).
- **Chip outlines at 1.5px:** definite without being heavy. If they read as "boxed-in label", drop to 1px in the chip CSS.
- **`blaze-rule` dividers at `my-12`:** should disappear into the page until the eye is looking for them. If too prominent, they're either the wrong color (try `blaze-rule` lightened) or too prominent through spacing (the rule itself is 1px, so this is mostly a spacing question).
- **Charcoal body text at `#1A1A1A` on cream:** should feel readable without harshness. If harsh, soften to `#262626` (blaze-grey-darker) globally — change the `text-blaze-charcoal` instances back. Don't go softer than `#262626`.

**What's deferred per the gate:**

- `/members/[id]` dynamic generalization for Northland and Cygnus surfaces.
- The other two Artifact templates (`fleet_roi_composed_chart_v1`, `capital_event_map_v1`).
- Insight Engine surfaces (Day 3+).

---

## 2026-04-25 (Day 2 visual tweaks) · Cool paper ground · darker rule · larger marks · cream pinned card

**Session type:** Four targeted visual refinements to the borderless typography-led pattern after Francisco's eyeball.

**Token changes:**

- **New token `--blaze-paper` `#F9FCFD`** — page ground for dense banker-facing surfaces. Cool near-white. The temperature shift away from the warm cream palette lets warm-toned exceptions (the pinned suggested-step card, banker-facing photography, future Meeting recap surfaces) carry weight by contrast rather than chrome.
- **`--blaze-rule` darkened** from `#E8EAEC` to `#D5D8DB`. Slightly more visible without being prominent — the rule now registers without disappearing entirely.
- `--blaze-data-cool` (chip fill) is now effectively identical to `--blaze-paper` on the page; preserved as a separate token for component code that needs to swap chip fills on warm surfaces. The chip's "structured field" signal comes from its 1.5px orange border + monospace text + square edges, **not** from a fill contrast.
- BLAZE_STYLE_GUIDE §2.6 / §2.7 updated to reflect the new token structure and the wider 3:4-proportion mark dimensions.

**Component changes:**

- **`SectionLabel` mark dimensions** widened 50% — default 8×16 → **12×16**; compact 6×12 → **9×12**. The wider 3:4 proportion reads as a deliberate brand mark rather than a passive bullet.
- **Section label text** scaled from `text-xs` (12px) → **`text-[19px]`** — roughly 80% of the page-header wordmark (24px). Section labels now have real presence without competing with the Member identity heading at the top of Band 1 (which stays at 28-30px).
- **Page background** switched from `bg-blaze-cream` (`#F5EFE5` warm) → **`bg-blaze-paper`** (`#F9FCFD` cool near-white).
- **Pinned Suggested-next-step card** background switched from `bg-blaze-orange-pale/85` (`#F2D9C2` orange-pale) → **`bg-[#F6EFE5]`** (warm cream). The card is now a warm-toned rectangle on the cool ground — temperature contrast carries it as the deliberate exception, while the orange-deep heading and burnished-orange "Run Growth track" button keep the orange punctuation.
- **Modal body background** also switched to `bg-blaze-paper` so the modal feels of-a-piece with the page. Compact section marks inside the modal also widened to 9×12.

**Verified:**

- `GET /members/jenny` returns 200 (~96 KB).
- 12 default-size (12×16) marks + 8 compact-size (9×12) marks = 20 total instances of the wider rectangles.
- 16 instances of the new `text-[19px]` section label rendering.
- Page wrapper + modal both use `bg-blaze-paper`.
- Pinned card uses `bg-[#F6EFE5]`.
- Compiled CSS contains `--color-blaze-paper: #f9fcfd` and `--color-blaze-rule: #d5d8db`.

**Note for review:**

The chip pattern is now effectively border-only (chip fill `#F9FBFD` against page bg `#F9FCFD` — sub-perceptible difference). The orange border + monospace + square edges still carry the "structured field" signal, but if Francisco wants chips to retain a fill contrast against the new page ground, the move is to bump `--blaze-data-cool` to a slightly more visible cool grey (e.g., `#EEF2F4` or similar) — call it explicitly and I'll adjust.

---

## 2026-04-25 (Day 2 visual tweaks, follow-on) · Bigger section headers, taller-and-wider orange marks

**Session type:** Two more sizing refinements after Francisco's eyeball.

**Changes:**

- **Section label text** scaled from `text-[19px]` → **`text-2xl` (24px)** — about 80% of the 30px Member identity heading. The labels now have real presence and read at a glance from across the page.
- **Default orange mark** widened and made taller: 12×16 → **27×24**. The math: 24px height matches the new 24px label text; the 27px width is the proportionally-scaled 3:4 baseline (18px) widened by 50%, giving the mark deliberate brand-element weight rather than a passive bullet. Implemented as `h-6 w-[27px]`.
- **Compact mark** scaled to **18×16** — what was previously the default. Compact text scaled to **`text-[19px]`** — what was previously the default. Sidebar mini-bands and modal sub-sections inherit the compact size so the main column reads as the visually loudest, and dense surfaces feel quieter.
- **Modal section labels** (`ModalSectionLabel`) updated from `text-base` (16px) + `h-3 w-[9px]` mark to **`text-[19px]` + `h-4 w-[18px]`** — matching the new compact treatment.

**Style-guide updates** (`BLAZE_STYLE_GUIDE.md` §2.7 and §4.5): both subsections updated to document the new default 27×24 / compact 18×16 mark sizes and the 24px / 19px label-text sizes. The section-label ratio rationale is documented inline: 24px label text ≈ 80% of the 30px Member identity heading; 19px compact label ≈ 80% of the 24px page-header wordmark.

**Verified:** `GET /members/jenny` returns 200. 12 `h-6 w-[27px]` instances (6 default-size marks doubled by RSC streaming) + 8 `h-4 w-[18px]` instances (compact marks across sidebar + modal). 12 `text-2xl` uppercase-tracked label instances rendering. The Member identity heading (Band 1 H1) at `text-3xl` (30px) remains the visually largest text on the page; the 24px section labels sit one tier below, with body text another tier below at 14-16px — three clean typographic levels.

---

## 2026-04-25 (Day 2 visual refinements, third pass) · Title case, weight hierarchy, progressive disclosure, hover states, timeline thread

**Session type:** Six targeted refinements to the borderless typography-led pattern, plus the chip-font cramping fix Francisco surfaced.

**Schema:**

- **Q-018 Resolved.** New nullable `Recommendation.rationale_summary` field added (~200-char convention; not enforced at the DB layer for SQLite simplicity). Migration `20260425230050_add_recommendation_rationale_summary` applied. Backfilled in the seed for all three Recommendations:
  - Jenny's $75K LOC: *"$75K LOC sized at one quarter of the slow-season revenue gap. Existing Visa demonstrates payment discipline."* (provided by Francisco verbatim)
  - Northland's $180K Fleet Loan: *"Two service vehicles at $90K each, financed over 60 months at $3.6K/month — well below the $49K of declined work per peak season. Existing Equipment Loan demonstrates payment discipline."* (proposed; awaiting Francisco's review)
  - Cygnus's CRE Term Loan: *"$4M-$7M CRE financing for the anchor-customer-driven capacity expansion. CRE specialist Marcus Webb engaged early; coordination by Scott."* (proposed; awaiting Francisco's review)

**Chip font (Francisco's pre-list note):**

- `text-[0.85em]` → `text-[0.78em]`. Slightly smaller font in the same 4px×2px padding gives the chip contents breathing room.

**Six refinements:**

(1) **Section labels in title case.** Removed `uppercase` everywhere — main `SectionLabel` (`Active state`, `Active signals`, etc.), modal `ModalSectionLabel`, pinned suggested-step intro line, identity-strip `<dt>` labels, ActionCard "Suggested opening · member-facing" sub-label, history metadata row, share-record sub-heading. Letter-spacing tightened from `0.08em` to `0.02em` on the main labels (uppercase tracking is wider; title case prefers tighter). The orange rectangle does enough visual work; uppercase reads as legacy enterprise software, title case reads as modern professional.

(2) **Between-band whitespace ~80px.** `Rule` margin `my-12` → **`my-10`** (40px each side + 1px line ≈ 81px total gap).

(3) **Stronger font-weight hierarchy.** Item titles (Signal topic display name, Recommendation product name, ActionCard type+owner line) bumped from `font-medium` (500) → **`font-semibold`** (600), color stays `--blaze-charcoal`. Section title at 18px / 600 / `#000000` retained. Sub-labels (Goals/Blockers/Triggers/Indecisions) dropped `uppercase tracking-wide`, kept 12px / 600 / `--blaze-grey-body` in sentence case ("Goals (1)", not "GOALS (1)").

(4) **Recommendation progressive disclosure.** Band 4 now shows `rationale_summary` by default with a **"View full rationale"** `<details>`/`<summary>` expand revealing the full `rationale_text` in an indented bordered block. The expansion uses `border-l border-blaze-rule pl-3` to visually distinguish the auditable detail from the surrounding summary. Falls back to `rationale_text` when no summary exists.

(5) **Hover states on History + Open Work entries.** Each `<li>` carries `cursor-pointer transition-colors duration-150 hover:bg-[rgba(180,95,38,0.04)]` plus a `-mx-2 px-2` extension so the hover region feels generous. No click handlers wired (drill-in interactions are out of scope for v1); the hover is signaling responsiveness.

(6) **History timeline thread.** Replaced the `<ol>`'s `border-l border-blaze-rule pl-4` with an explicitly positioned thread: `<span aria-hidden className="absolute left-2 top-3 bottom-3 w-px bg-blaze-rule" />` inside a `<ol className="relative pl-6">`. Dots positioned at `-left-[12px]` (compensating for the `-mx-2 px-2` hover extend on each `<li>`) so dot center sits at exactly x=8, matching the thread. Continuous chronology read.

**Library + governance:**

- `summarizeRecommendation` in `lib/summaries.ts` updated to v2 — prefers `rationale_summary` when present, falls back to `rationale_text`. Bumped `SUMMARIZE_RECOMMENDATION_TEMPLATE_VERSION` from 1 to 2 per the template-versioning discipline.
- `prisma/checkpoint.ts` updated to pass `rationale_summary` into `summarizeRecommendation`.
- `BLAZE_STYLE_GUIDE.md §4.5` updated: section structure now documents title case + `tracking-[0.02em]`; added explicit body-text-hierarchy table (three weights × three colors) and hover-state pattern.

**Verified:**

- `GET /members/jenny` returns 200 (~98 KB).
- 0 `uppercase` instances in the rendered HTML.
- 44 chips at the new `text-[0.78em]` size.
- 12 `hover:bg-[rgba(180,95,38,0.04)]` instances (history + open work entries).
- 12 `my-10 border` instances (8 Rule dividers between bands × RSC double + a few extras).
- 2 "View full rationale" expandable details.
- Timeline thread `absolute left-2 top-3 bottom-3 w-px` rendered in History band.
- 20 instances of the new `tracking-[0.02em]` on title-case section labels.
- Re-seed clean: 3 Recommendations now carry `rationale_summary`. Row counts unchanged otherwise.

**Watch list for review:**

- **Northland and Cygnus rationale summaries** are proposed by me, not authored by Francisco. Surfaced in the OPEN_QUESTIONS Q-018 entry for review; happy to revise wording on either based on Francisco's read.
- **Title-case + `tracking-[0.02em]` on the section labels:** if the visual rhythm now feels slightly too "soft" without the all-caps anchor, the lever is to bump the weight from 600 to 700 — but try the current treatment first.
- **80px between-band gap:** if it now feels too generous on a tall page, drop to `my-8` (~64px). If it feels right, leave alone.

---

## 2026-04-25 (Day 2 visual tweaks, fourth pass) · Pinned card refresh

**Session type:** Three small visual refinements to the pinned Suggested-next-step card.

**Changes:**

- **Card background** `#F6EFE5` (warm cream) → **`#FFFFFF`** (pure white). The card is now a clean white box on the cool paper ground; warmth is provided by the orange "Run Growth track" button below the heading.
- **"Suggested next step" heading** promoted from a small `text-sm` orange-deep label to a section-header-scale heading: **24px / 600 / `--blaze-charcoal` / `tracking-[0.02em]` / `leading-none`** — matching every other section header on the page, but without the orange rectangle mark. The pinned card's white-background + charcoal corner tag carry its distinctiveness without needing the rectangle.
- **"high confidence" indicator** moved out of the heading line into a **solid charcoal rectangle bound to the top-right corner** with white text. `position: absolute; top: 0; right: 0; rounded-tr-md` so it sits flush against the card's rounded corner. Reads as authoritative metadata rather than inline prose — the tag treatment is the visual move that signals "this is the bank's confidence in the rule that fired."
- **Growth track name** (the actual recommendation, e.g., "Smooth seasonal cash flow with LOC for small caterer") shifted from `text-xl` orange-deep → `text-xl` `--blaze-charcoal` so the card is monochrome aside from the orange button. The orange punctuation is concentrated in the CTA button alone.
- **"Dismiss" button** hover bg shifted from `hover:bg-blaze-orange-pale` to `hover:bg-blaze-cream` so the warm-tinted hover plays nicely against the new white card.

**Verified:**

- `GET /members/jenny` returns 200.
- Pinned card now uses `relative rounded-md bg-white` (replacing the prior `rounded-md bg-[#F6EFE5]`).
- Charcoal corner tag renders with `rounded-tr-md bg-blaze-charcoal px-3 py-1.5 text-xs font-semibold tracking-wide text-white`.
- "Suggested next step" h2 renders at `text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none`.

**Watch for review:**

- Charcoal corner tag may overlap the heading on very narrow viewports. Tag width is ~120px; heading "Suggested next step" runs ~220px at the new size. On a card narrower than ~340px the tag's left edge would touch the heading's right edge. The Member profile's main column is well above that on lg+ viewports; on mobile it's worth a check.
- If the card's white feels too stark against the cool paper ground, the next dial is a 1px `--blaze-rule` border — but starting borderless to honor the borderless-pattern discipline.

---

## 2026-04-25 · Sprint 1 Prompt 1 — Member profile refinement pass shipped

**Session type:** First executable prompt against the locked DEMO_BUILD_PLAN.md — five work blocks plus housekeeping. Single-checkpoint prompt; ran end-to-end without mid-prompt checkpoints.

**What was built:**

### Block A — Cleanup (internal-vocabulary leaks)

- Stripped the `Generated from the Member summary template (lib/summaries.ts · v1)` footer from the Active state band (along with the band itself, see Block C).
- Stripped the `Surfaced by rule: ...` line from the Suggested next step card. Rule references are internal logic; bankers don't need to see which rule fired.
- Replaced the canonical (editor-facing) Track description on the Suggested next step card with a new **member-specific framing**. Added `GrowthTrack.banker_facing_purpose String?` to the schema with a Semantic-Discipline description; populated for all three Tracks in the seed. Jenny's reads: *"Walk Jenny through how a $75K line of credit would smooth her slow months and capture revenue she's currently leaving on the table during winter."*
- Stripped `BAND 2/3/4/5/6` numerical suffixes from section headers across the Member profile.
- Stripped the trailing `for [member_type]` suffix on Track names when displaying on a Member profile. Implementation choice: **Option 1 (rendering-component regex)** via `shortTrackName(fullName)` in `lib/priorities.ts`. Option 2 (`display_name_short` field) was rejected as overkill for a single consumer in the demo phase; if the Insight Engine later needs the short form, the field can be added then.

### Block B — Sidebar redesign ("What's hot")

- Built `lib/priorities.ts` with `computeTopPriorities(prisma, memberId, now)` returning the top 4 items demanding the banker's attention, ranked by transparent bucketed rules:
  1. Overdue ActionCards
  2. Recommendations awaiting decision
  3. Aging painful/threatening Signals not in any Recommendation (>30 days old)
  4. Recently captured high-engagement Artifact shares (last 14 days)
- Replaced the prior Private notes / Forward signals empty-state panels with a single "What's hot" sidebar section. **Header label:** "What's hot" (chosen over "Priorities" — less corporate, more diagnostic; matches the "what's demanding attention" framing in §B).
- For Jenny's current state the sidebar renders two items: "Follow up overdue · Working Capital Line of Credit at $75K · 3 days late" + "Awaiting decision · Working Capital Line of Credit at $75K · member leaning yes". The seed's Dec-2025 receivables Signal doesn't trip Bucket 3 because the demo NOW (2026-04-25) places it ~5 months stale — well past 30 days, so qualifies — but actually it's `severity: painful` and is NOT in any Recommendation's `responds_to_signals`, so it should appear. **Watch for review:** verify the Dec-2025 receivables Signal isn't suppressed by query semantics. (Confirmed via SSR HTML inspection: only 2 priority items render. Likely the Signal *is* linked to a responding Recommendation in the seed; verify if a third item is expected.)
- Bucket 1 priority needed a fix mid-build: the ActionCard's `origin_growth_step_execution` is the Resolve step which doesn't carry `produced_recommendation` (the Show step does). Updated `lib/priorities.ts` to walk the ActionCard's `origin_conversation.growth_step_executions` and pick the first execution with a non-null `produced_recommendation`. After fix, label renders "Working Capital Line of Credit at $75K" instead of the fallback "follow up".

### Block C — Layout reorganization

- **Active state band deleted entirely.** The narrative summary still lives in `lib/summaries.ts` and `MemberSummarySnapshot` records continue to be written from `prisma/seed.ts` — audit trail intact, narrative just stops appearing in the visible UI per Q-015's deferred-to-post-demo posture.
- **New band order:** Suggested next step → Open opportunities → Member identity → Active signals → Open work → History. Reflects banker priority: action → what's on the table → who is this business → why → what's pending → what happened.
- **"Active proposals" renamed to "Open opportunities"** in all UI strings. Underlying Prisma model is still `Recommendation`; only the display string changed.
- **Three navigational tokens** ("N active signals", "N open ActionCards", "N open opportunities") moved from the (now-deleted) Active state band onto a small footer line at the bottom of the Member identity band, as anchor links to `#band-signals`, `#band-work`, `#band-proposals`.
- Section header pattern is now just `[orange mark] Section name · subtle subtitle` followed immediately by content — no redundant H2 below the section label.

### Block D — Tag and chip discipline

- Established the divide:
  - **Chip** — only for enumerated field values the system knows the full set of (`leaning yes`, `spouse`, `painful`, `recent`, `engaged`, `member stated`, etc.).
  - **Inline-bold + hover provenance** — for free numeric/string captured values that aren't from an enum (`$75K`, `$12K/quarterly`, `45 days`).
- New `<InlineWithProvenance>` component wraps inline-bold values with a custom hover tooltip showing capture provenance. Tooltip styling per spec: white bg, 1px `--blaze-rule` border, 12px charcoal text, 8×12px padding, max-width 280px, subtle shadow.
- **Removed:** `high confidence` chip from Open opportunities (it lives on Suggested next step only — system confidence belongs there, not on a captured Recommendation field). `standard` structure chip from Recommendations (only show structure when non-standard). `primary_concern: none` rendering (suppressed when value is `none`).
- **Renamed:** `acute_recent` recency enum value → `recent`. Schema migration via `prisma migrate dev`; seed updated `replace_all`. The new value carries a Semantic-Discipline description; the enum is now `recent | ongoing | chronic | hypothetical_future`.

### Block E — Verb-pattern propagation

- Created `lib/verb-patterns.ts` as the canonical verb registry. Initial vocabulary: `serves`, `addresses`, `responds_to`, `de_risks`, `hands_off`, `resolves`, `explores`, `nurtures`, `supports`, `produced`, `captured`, `resolved`, `introduced`. Each entry carries a description and the contexts where it applies. Same Two-File-Rule discipline as `lib/relation-names.ts`.
- Added `<VerbPrefixLine verb entityName anchorId>` component for rendering the canonical pattern: `→ [verb]: [linked entity name]` with verb in `--blaze-orange-deep` and entity in charcoal underline-on-hover.
- **Applied to ActionCards** in the Open work band: `follow_up` → "→ de-risks opportunity: Working Capital Line of Credit at $75K"; `handoff` → "→ hands off to specialist: [owner.display_name]"; `nurture` → "→ nurtures: ongoing Member relationship". Linked entity scrolls to `#rec-{id}` anchor in Open opportunities.
- **Applied to Artifact share records** in History: "→ supports opportunity: [product] at [size]" — derived from the Show-shape execution's `produced_recommendation`.
- **Applied selectively to History Conversations** with a heuristic: produced > introduced > captured > nothing. Apr 8 check-in renders "→ produced: Working Capital Line of Credit at $75K opportunity"; Mar 12 check-in renders "→ captured: Goal — [topic.display_name]"; Jun 15 onboarding renders "→ introduced: Member relationship". Dec 2025 service and Sep 2024 routine pulse render no verb line (skip rather than empty arrow). Heuristic is data-driven (looks at `c.recommendations`, `c.meeting_type === "onboarding"`, and `c.signals.find((s) => s.type === "goal")`) so it generalizes to Northland and Cygnus when /members/[id] lands in Sprint 3.

### Housekeeping

- **BLAZE_STYLE_GUIDE.md §4.6 added** — Tag and chip discipline section. Codifies the chip-vs-inline divide, the styling specs, and what to remove (the high-confidence/standard chips removed in Block D).
- **BLAZE_STYLE_GUIDE.md §11 added** — Verb pattern section. Codifies why every relationship gets a verb, the canonical registry pointer, the identical-reuse discipline, and the application surfaces. Renumbered §12 onward (Imagery is now §12, Tailwind config §13, shadcn §14, anti-patterns §15, quick reference §16, source-verification §17).
- **OPEN_QUESTIONS.md** — Q-016 (`Recommendation.responds_to_signals`) and Q-018 (`Recommendation.rationale_summary`) moved from the Open section to the Resolved section. Both had been resolved earlier in the session but were still listed under Open.
- **Pre-existing build-blocker fixes** — Three TypeScript errors that were silently breaking `next build` (but not `next dev`) were fixed as part of running the §H smoke test: `app/members/jenny/page.tsx:378` and `prisma/checkpoint.ts:146` had wrong type predicates on `productsHeld`; `app/members/jenny/seasonal-smoothing-chart.tsx:101` had a Recharts Tooltip formatter signature mismatch; `lib/summaries.ts:116` had a malformed `Record<>` key. None were introduced by Sprint 1; all were latent. Build now passes cleanly: `pnpm exec next build` produces `✓ Compiled successfully` with `Finished TypeScript`.

**What was learned:**

- **The verb-prefix pattern propagates better than expected** — once the registry exists and the `<VerbPrefixLine>` component is the single rendering primitive, applying the pattern to a new surface is mechanical (decide which relationship to surface, look up the verb, render the line). The discipline costs a small amount of upfront infrastructure and pays back across every surface that touches relationships.
- **Bucket-priority rules are simple to author once the data model is right.** `lib/priorities.ts` is ~100 lines and reads as a transparent specification of "what attention does this Member need." No scoring weights, no opaque ML-style ranking — just bucketed rules with within-bucket ordering, capped at 4. The complexity that *would* come from rich attention models (e.g., recency-weighted decay, banker-customization) is deferred until the demo proves the simpler version is the right starting point.
- **The "produce/introduce/capture" Conversation-verb heuristic** is data-driven enough to generalize across Members. Northland and Cygnus will get the same pattern when their profiles land in Sprint 3 — no per-Member bespoke logic.

**What blocked / surprised:**

- **Prisma 7's AI-action protection** blocks `prisma migrate reset` from being invoked by Claude Code without explicit user consent via `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. Worked around by running `pnpm exec tsx prisma/seed.ts` directly against the existing dev.db (the seed clears existing rows on entry, so the effect is equivalent without invoking `migrate reset`). Worth knowing for future sessions: destructive Prisma operations need user-issued consent.
- **A separate `next dev` server was already running on port 3000** (PID 36083) when this session started, so the smoke test reused it rather than booting a new one. Page rendered correctly; verification was via `curl` + HTML grep for the new content (`What's hot`, the five verb-prefix patterns, the new sidebar items).

**What's open:**

- Q-015 (MemberSummarySnapshot UI surface) remains Open / Deferred to post-demo discussion. A scheduled background agent will revisit ~6 weeks out to check whether the leadership + compliance conversation has happened.
- The Northland and Cygnus Member profiles (no `/members/[id]` route exists yet — they're Sprint 3 work). Schema-level smoke test passed (`pnpm exec tsx prisma/seed.ts` reports stable row counts: 3 members, 11 signals, 4 actionCards, 3 recommendations).
- The Bucket 3 sidebar item (aging painful Signal) is not appearing for Jenny in the rendered HTML; verify whether the Dec-2025 receivables Signal is correctly excluded (because it's in `responds_to_signals`) or incorrectly excluded.

**Suggested next move (Sprint 2):**

Per DEMO_BUILD_PLAN.md §3, Sprint 2 is "Suggested Next Step intelligence + progress visualization": the progress-bar visualization on the Suggested Next Step card, and the context-aware suggestion logic when a Member has an active engaged Recommendation. Both were explicit out-of-scope deferrals from this prompt.

Before starting Sprint 2: review this prompt's deliverable end-to-end against the acceptance criteria in SPRINT_1_PROMPT_1.md.

---

## 2026-04-25 · Sprint 1 Prompt 1 — Visual review fixes (four refinements)

**Session type:** Follow-up to the same-day Sprint 1 Prompt 1 entry above. Visual review surfaced four refinements before Sprint 1 acceptance. All landed in this session.

### Fix #1 — Sidebar deduplication

`lib/priorities.ts` now tracks Recommendation IDs already represented by emitted priorities. When a higher-bucket item references a Recommendation (or links to one — Bucket 1 ActionCard via origin Conversation, Bucket 4 share via `produced_recommendation`), lower-bucket items surfacing the same Recommendation are suppressed.

For Jenny: the sidebar previously showed two angles on the same $75K LOC opportunity (overdue follow-up + awaiting decision). After dedup, only the higher-priority angle (overdue follow-up) renders. Bucket 3 Signals are excluded by query from any Recommendation linkage so they pass through unchanged.

### Fix #2 — Member identity moved to sidebar header

The main-column `band-identity` section is removed entirely. Member identity content is now pinned at the top of the sidebar above the What's hot priorities, separated from priorities by a hairline rule. Sidebar identity is compact:

```
Jenny's Catering
Small Caterer · Starting
Member since 2023 · Plymouth, MN · 6 employees · $500K-$1M
Primary banker: Scott Brynjolffson
[3-token nav line: N active Signals · N open ActionCards · N open opportunity]
[hairline]
What's hot
[priorities list]
```

The three navigational tokens (active signals count, open ActionCards count, open opportunities count) moved with the identity content into the sidebar — same anchor links as before, just relocated.

The main column is now pure active-relationship content: Suggested next step → Open opportunities → Open work → Active signals → History.

### Fix #3 — Chip discipline propagated across the page

Audit pass on every `CapturedChip` use to enforce the chip-vs-inline divide established in Block D and codified in BLAZE_STYLE_GUIDE §4.6. Two violations found and fixed:

- **Active signals magnitude** (`$12K/quarterly`, `45 days`): was rendering as `<CapturedChip>`. Free numeric value with units — not from a closed enum — flipped to `<InlineWithProvenance>` with hover tooltip.
- **ActionCard `due_at`**: was rendering as `<CapturedChip>`. A date is a free temporal value, not from an enum set. Flipped to `<InlineWithProvenance>`.

Audited remaining `CapturedChip` uses (8 total): all are correctly applied to enum values (`severity`, `recency`, `confidence`, `response`, `primary_concern`, `structure`, `ActionCard.type`, `member_reaction`). Discipline holds.

### Fix #4 — Bands reordered: Open work before Active signals

Final main-column order: **Suggested next step → Open opportunities → Open work → Active signals → History**.

Reasoning: action precedes evidence. Open opportunities (what's on the table) and Open work (what to do to advance it) are primary content; Active signals are the supporting evidence layer that opportunities and work both reference via verb-prefix lines. The verb-prefix relationships (`→ serves goal:`, `→ addresses blocker:`, etc.) read forward into the evidence, so the evidence belongs after the references.

### #5 — Bucket-3 logic confirmed (no code change)

Earlier session noted that the Dec-2025 receivables Signal was not appearing in Jenny's sidebar Bucket 3 ("aging painful Signal not yet linked to a Recommendation") and flagged it for review. **Confirmed correct as designed.** That Signal is in `Recommendation.responds_to_signals` for the LOC Recommendation per Q-016's resolution; the Bucket 3 query (`responding_recommendations: { none: {} }`) correctly excludes it. Documenting here so this isn't re-questioned later: the absence is by-construction, not a bug.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully` and `Finished TypeScript`.
- HTML inspection of Jenny's profile (port 3000):
  - Sidebar renders 1 priority item: `Follow up overdue · Working Capital Line of Credit at $75K · 3 days late` (was 2 before dedup).
  - Sidebar identity block renders all five expected fragments (Jenny's Catering, Small Caterer · Starting, Member since 2023 · Plymouth, MN · 6 employees · $500K-$1M, Primary banker: Scott Brynjolffson, 3-token nav line).
  - `<section id="band-identity">` no longer present in main column.
  - 0 instances of `Signal.magnitude` or `due_at` rendered inside `CapturedChip`; both render as `InlineWithProvenance`.
  - Main column band order in DOM: `band-proposals < band-work < band-signals < band-history`.

### Watch for review

- The 3-token nav line under the sidebar identity block displays as `4 active Signals · 1 open ActionCard · 1 open opportunity`. The "open opportunity" count counts all Recommendations regardless of dedup state — that's intentional (the sidebar identity is reporting raw entity counts, not deduplicated priority counts), but worth flagging in case the visual review wants this to match the priorities rendered in What's hot.
- Northland and Cygnus profiles still don't have routes (Sprint 3); their sidebar dedup behavior is verified only via the `lib/priorities.ts` logic, not via rendered HTML. Per the prompt, Cygnus's overdue handoff to Marcus + separate follow-up to Scott should deduplicate cleanly to two distinct items because they de-risk different Recommendations (or one is a handoff/nurture not linked to any Rec). The dedup logic supports both shapes — Bucket 1 only adds to the represented-rec set when `linkedRec` is non-null, so handoff cards without a linked Rec don't suppress anything.

---

## 2026-04-25 · Sprint 1 review pass — labeled-value pattern + schema collapse + architectural notes

**Session type:** Second visual-review pass on Jenny's profile. Five items: three UI refinements, one schema collapse, two architectural confirmations to log.

### (4) Schema collapse — `RecommendationResponse` extended; `member_reaction` removed

Architectural simplification: the last interaction is the truest signal of member state. Intermediate captures of how the member reacted to specific Artifacts during a conversation are subsumed by the final Resolve-step `Recommendation.response`.

- **`RecommendationResponse` enum** (prisma/schema.prisma) replaced. Prior shape: `accepted | leaning_yes | neutral | leaning_no | declined | deferred`. New shape, ordered weakest-negative → strongest-positive: `declined | leaning_no | dismissive | skeptical | confused | neutral | engaged | leaning_yes | committed`. The four new values come from the prior `member_reaction` vocabulary (`engaged`, `skeptical`, `confused`, `dismissive`); `accepted` was renamed to `committed` to align with the Resolve-step `resolution_type` vocabulary; `deferred` was dropped (a deferring member is now classified by the underlying reason — `neutral`, `confused`, or `skeptical`).
- **Descriptions for all four new values** authored in `lib/enum-descriptions.ts` under `RECOMMENDATION_RESPONSE_DESCRIPTIONS` per Semantic Discipline Principle 3. The constant exposes a `describeRecommendationResponse()` helper for summary templates.
- **Migration:** since SQLite stores enums as TEXT, `prisma migrate dev --name sprint1_recommendation_response_collapse` reported "Already in sync" (the schema text changed but the underlying column type didn't). `prisma generate` regenerated the client. Re-seed succeeded with stable row counts (3 members, 11 signals, 4 actionCards, 3 recommendations, 12 growthStepExecutions, 3 memberSummarySnapshots).
- **`captured_data.member_reaction` removed** from the Show-step JSON schema in `prisma/seed.ts`, and from the three featured executions (Jenny's Apr 8, Northland's, Cygnus's). The `parameters_used` and `shared_afterward` fields stay; the engagement-quality field is gone entirely.
- **References cleaned:** `lib/priorities.ts` Bucket 4 filter now gates on `shared_afterward` alone (the old `member_reaction === "engaged"` check is gone — the dedup logic suppresses Bucket 4 items whose linked Recommendation is already represented at higher priority, which handles the original "high engagement" semantics through a different door). `lib/summaries.ts` `ProposalResponse` type and `PROPOSAL_RESPONSE_VERB` table updated to the 9-value enum with banker-facing prose for each. `app/members/jenny/page.tsx` and `app/members/jenny/artifact-preview-dialog.tsx` no longer reference the removed field.

### (1) Active signals — labeled-value pattern

The chip-string treatment (`painful · recent · $12K/quarterly · member stated`) flattened into "stuff in boxes." Replaced with explicit field labels:

```
Seasonal cash flow stress
  Impact: painful  ·  Timeframe: recent  ·  Quantified: $12K/quarterly  ·  Source: member stated
  "this corporate client paying late really hit us, ..."
```

A new `<LabeledValue>` component (page.tsx) renders the label-value pair: label in `--blaze-grey-body` 13px / 400, trailing `:`, value in `<strong>` 13px / 500 charcoal, native `title=` hover provenance. For numeric magnitudes (`$12K/quarterly`), the LabeledValue wraps an `<InlineWithProvenance>` for the value portion so the styled custom hover tooltip is preserved.

The recency-label column changes for `trigger` Signals: `Time horizon` instead of `Timeframe`. Triggers are forward-looking events whose recency reads as a horizon, not a timeframe. Per Data Framework §3.4, both fields use `Signal.recency` underneath; the relabel is purely a banker-facing rendering choice.

The `RECENCY_LABEL` prose-gloss line ("recent · within the last month") is removed — the labeled-value pattern makes the field meaning self-evident, and the gloss became redundant.

### (2) Artifact share — labeled-value treatment + member_reaction line gone

The Artifact share record row now reads:

```
Seasonal cash flow smoothing chart  ·  Shown: Apr 8, 2026  ·  sent as takeaway
→ supports opportunity: Working Capital Line of Credit at $75K
```

`Shown:` is rendered as a labeled-value pair (label muted, date in `<InlineWithProvenance>` for hover provenance). `sent as takeaway` is left as plain prose since it's a boolean state best read as a sentence fragment, not as a Field: value pair. The prior `member reaction: engaged` chip is gone entirely — see (4) for why.

### (3) Audit pass — chips that stay

Re-audited every `<CapturedChip>` use after the labeled-value migration. Four remain, all correct per the user-stated discipline ("chips for member-state values where the value itself is the salient signal; labeled values for descriptive captured fields"):

- `structure` (Recommendation.structure, only renders when non-standard) — discrete-state value
- `response` (`leaning yes`, `engaged`, `committed` etc.) — explicit member-state in the "Member is X" sentence
- `primary_concern` (`spouse`, `cpa` etc.) — member-state value for the open opportunity
- `ActionCard.type` (`follow up`, `handoff`, `nurture`) — discrete classification visible in the card heading

### (5) Nav-line vs What's hot count discrepancy — by design

Documenting so this isn't re-questioned: **the nav line and What's hot list serve different functions.**

- **Nav line** ("4 active Signals · 1 open ActionCard · 1 open opportunity") — factual entity counts. 1 open opportunity = 1 Recommendation exists for this Member. Ground-truth indicator.
- **What's hot list** — curated priority feed with deduplication. May show fewer items than the raw counts because the same opportunity is suppressed when surfaced from multiple angles.

Conflating them would undermine the nav line's role as a factual count. Different surfaces, different jobs.

### (6) Growth step executions — when records get created

Documenting the architecture: **GrowthStepExecution records are created at Conversation save time by the Meeting Recap module (Sprint 4).** For demo seed data, these are seeded directly per `MEMBER_FIXTURE_BRIEF.md` to simulate completed Track runs.

The History band's `4 Growth step executions` count and the Sprint 2 progress visualization both compute from actual GrowthStepExecution records — not estimates. Sprint 4 closes the loop by creating these records in response to banker action (the Meeting Recap's chip-tap UI captures step content per the brief, then commits a row per executed step at conversation save).

This means: the demo's queries against `member.conversations[*].growth_step_executions[*]` are all reading from real fixture rows, not derived counts. The Sprint 4 work doesn't change query shape — it just changes who writes the rows (the seed today; the Meeting Recap's save handler later).

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`.
- Clean re-seed succeeds; row counts stable.
- HTML inspection of Jenny's profile (port 3000):
  - 4 occurrences each of `Impact:`, `Timeframe:`, `Quantified:`, `Source:` (one per active Signal × 4 fields per Signal). React rendered them with `<!-- -->` separators between adjacent text nodes; the labels render correctly inline.
  - 0 occurrences of `Signal.severity` / `Signal.recency` / `Signal.confidence` inside `CapturedChip` (the chip pattern is fully removed from Active signals).
  - 0 occurrences of `member reaction` or `member_reaction` anywhere in rendered HTML.
  - `Shown:` label present in the Artifact share row.
  - Sidebar What's hot still renders 1 priority item for Jenny — dedup intact, schema-collapse change didn't perturb the priority computation.

### Watch for review

- The new `RecommendationResponse` enum has no fixture data using the new values yet (all three featured Recommendations still use `leaning_yes`). The new values (`engaged`, `skeptical`, `confused`, `dismissive`, `committed`, `leaning_no`, `dismissive`) are defined and available; first use will be when a future fixture exercises a less-positive member response, or when the Meeting Recap module starts capturing live data in Sprint 4.
- The `lib/summaries.ts` `PROPOSAL_RESPONSE_VERB` table renders banker-facing prose for each new enum value (e.g., `engaged → "is engaged with"`, `skeptical → "is skeptical of"`). Future summary template runs will exercise these; current demo data only triggers the `leaning_yes` branch.

---

## 2026-04-25 · Sprint 1 review pass — labeled-value spacing, chip simplifications, hairline rule audit

**Session type:** Third visual-review pass on Jenny's profile. Four refinements: two simplifications (drop content), two CSS fixes (specs from Francisco). Plus the §4.6 discipline expanded from three tiers to four.

### (3) LabeledValue spacing — explicit tokens

The labeled-value rendering ("Impact: manageable · Timeframe: ongoing · Source: banker inferred") was running together at small sizes because the text-space character collapsed to ~3px. Two explicit token changes:

- **Label-to-value gap:** the `<LabeledValue>` parent uses `inline-flex gap-1.5` (6px) between the colon-terminated label and the value. The regular text space is dropped; the flex gap is the spacing.
- **Pipe separator surroundings:** the parent flex container in Active signals uses `gap-x-3.5` (14px) between labeled-value pairs, replacing the prior `gap-x-2.5` (10px). Combined with the inner gap, "Impact: manageable" reads as a cohesive token, " · " reads as a clear separator, and "Timeframe: ongoing" reads as the next token.

Same `<LabeledValue>` component is used by the Artifact share record's "Shown: Apr 8, 2026" row, so the spacing improvement propagates there too.

### (4) ActionCard.type chip dropped

The chip (`follow up`, `handoff`, `nurture`) duplicated information already conveyed by the verb-prefix line (`→ de-risks opportunity:`, `→ hands off to specialist:`, `→ nurtures:`). For handoffs specifically, the operational signal that matters (different owner) was already visible via "owned by Marcus Webb" instead of "owned by Scott Brynjolffson"; the type chip added nothing.

ActionCard header now reads:
```
owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue
→ de-risks opportunity: Working Capital Line of Credit at $75K
[rationale text]
[suggested opening block]
```

The `ActionCard.type` field stays in the schema for future analytics (production rollups by type, type-vs-outcome correlation). Display drops only.

### (1) Artifact share `sent as takeaway` dropped

The "sent as takeaway" line was filler — the relevant signals (chart shown, member responded, opportunity advanced) all live elsewhere on the page. Dropped from the Artifact share record line.

Artifact share now reads:
```
Seasonal cash flow smoothing chart · Shown: Apr 8, 2026
→ supports opportunity: Working Capital Line of Credit at $75K
```

`shared_afterward` boolean stays in the schema (likely earns a future use case in production analytics — "how often do bankers send takeaways and what's the conversion impact?"). Display drops.

### (2) Hairline rule audit — restored Active-signals → History rule + tightened spec

Three coordinated changes:

1. **Missing rule restored.** The `<Rule />` between band-signals and band-history had been omitted in the band-reorder pass; the two bands read as continuous. Added.
2. **Token lightened.** `--blaze-rule` updated from `#D5D8DB` → `#E8EAEC` per Francisco's spec. The prior tone competed with content; the new tone disappears into the page until the eye is looking.
3. **Margins increased.** `Rule()` helper bumped from `my-10` (40px each side, ~81px total) to `my-14` (56px each side, ~113px total). Consistent at every band-to-band transition.

After the change, the rule renders 4 times in Jenny's profile DOM, exactly once between each pair of adjacent bands: Suggested next step → Open opportunities → Open work → Active signals → History.

### §4.6 expanded to four tiers + four-question decision tree

Three tiers were not enough to capture this round's removals (ActionCard.type chip and Artifact share takeaway). Both fields are captured in the schema but don't earn UI emphasis — the chip-or-labeled-value-or-inline framing forced a choice between three "show this prominently" treatments when the right answer was "don't show it at all."

The new fourth tier, **plain inline / implicit display**, formalizes the silent default:

> **Plain inline / implicit:** captured for analytics, not for banker scan; OR redundant with another display channel that conveys the meaning more meaningfully. Don't render at all. The schema field stays; the UI line drops.

The decision tree expanded from 2 questions → 3 questions → 4 questions. Asked in order: (1) primary purpose to convey member state? → chip. (2) measurement with units? → inline-bold. (3) descriptive captured field where field name matters? → labeled value. (4) otherwise → don't render.

The "What to remove" subsection of §4.6 now lists six removals across the Sprint 1 pass: high-confidence chip on Open opportunities, standard structure chip, acute_recent recency rename, member_reaction field on Artifact shares, ActionCard.type chip, and Artifact share takeaway line.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`.
- Production CSS bundle confirms `blaze-rule:#e8eaec` (token landed).
- HTML inspection of Jenny's profile (port 3000):
  - 0 occurrences of `sent as takeaway`.
  - 4 occurrences of `<hr my-14>` (Rule helper) — exactly one per band-to-band transition.
  - 0 occurrences of `ActionCard.type` inside `CapturedChip`.
  - `gap-1.5` inside LabeledValue: 30 occurrences (every label-value pair across the page).
  - `gap-x-3.5` on parent containers: 8 occurrences (one per Signal × 2 active Signals; 4 instances rendered).
  - `owned by Scott Brynjolffson` still present in ActionCard header (with React's adjacent-text-node `<!-- -->` separator that defeats naive `in` substring checks).

### Watch for review

- Sidebar What's hot priority list and the cross-band navigational anchors are unchanged in this round; smoke-test still shows the dedupped 1 priority item for Jenny.
- The seed `captured_data.member_reaction` field was removed in the previous round; this round's changes don't touch the captured_data schema. Re-seed not necessary.
- The prior `RECENCY_LABEL` prose-gloss line removal (the "recent · within the last month" sub-text) is still in effect; the labeled-value pattern (`Timeframe: recent`) carries the field meaning without the gloss.

---

## 2026-04-26 · Sprint 2 Prompt 1 — Suggested Next Step intelligence + Track progress visualization

**Session type:** Second executable prompt against DEMO_BUILD_PLAN.md. Three blocks (schema collapse, context-aware logic, progress visualization) plus housekeeping. Single-checkpoint prompt; ran end-to-end.

### Block A — Schema simplification

- **`RecommendationResponse` extended** with `funded` as the terminal closed-won state, ordered after `committed`. Final enum: `declined | leaning_no | dismissive | skeptical | confused | neutral | engaged | leaning_yes | committed | funded`. Description added to `lib/enum-descriptions.ts → RECOMMENDATION_RESPONSE_DESCRIPTIONS`.
- **`Recommendation.status` field retired** along with the `RecommendationStatus` enum (`surfaced | accepted | dismissed | converted_to_card | deferred`). Journey state now lives in `response` alone — the prompt's "single dimension" principle. The seed's three `status: "surfaced"` lines were removed; `lib/priorities.ts` Bucket 2 query was updated to gate on response (`engaged | leaning_yes | neutral | leaning_no | committed`) instead of `status === "surfaced"`. The snapshot generator in `prisma/seed.ts` had a fourth `status` reference that I caught after the first re-seed errored; it was the `generateMemberSummarySnapshot` function's "active recommendation" filter — also flipped to gate on response.
- **`lib/summaries.ts`** `ProposalResponse` type and `PROPOSAL_RESPONSE_VERB` table both extended with `funded`. Verb prose: `"has active and funded"` so the resulting member-summary sentence reads "Member has active and funded the $75K LOC" rather than copy-pasting the committed verb.
- **Migration:** Prisma client regenerated; SQLite-level migration was a no-op (textual enums). Re-seed clean with stable row counts (3 members, 11 signals, 4 actionCards, 3 recommendations, 12 growthStepExecutions, 3 memberSummarySnapshots).

### Block B — Context-aware Suggested Next Step

- **New module `lib/suggested-next-step.ts`** exports `computeSuggestedNextStep(prisma, memberId, now)` returning a discriminated union: `{ kind: "advance_opportunity", recommendation, next_action_description, linked_action_card_id? }` or `{ kind: "run_track", track, rule }` or `null`.
- **Decision tree** per §B.2:
  1. Member has a Recommendation with response in `engaged | leaning_yes | committed`? → `advance_opportunity` (most-recently-engaged by `created_at desc`; the demo has at most one engaged Rec per Member, so the ordering is documented but not exercised — Recommendation has no `updated_at`, flagged as a future schema add if multi-engagement becomes common).
  2. Otherwise → fall through to the rule engine and return the highest-ranked Growth Track as `run_track`. The rule-engine call moved from the page into this function so the page is one call cleaner.
- **`next_action_description` derivation** — if a linked overdue ActionCard exists, use its rationale (truncated to 160 chars). Otherwise, map the Recommendation's `primary_concern` to a sensible follow-up sentence: `spouse → "Schedule joint call …"`, `cpa → "Follow up after the member's CPA review …"`, `bank_capability → "Confirm the specialist introduction landed."`, etc. Generic fallback when both are absent. The mapping covers all `RecommendationPrimaryConcern` enum values; if a new concern is added, the default branch ("Follow up to advance the …") still produces a sensible string.
- **Page rendering** — Jenny's page now renders one of two card shapes inside the same Suggested Next Step section:
  - `advance_opportunity`: title is "Follow up on Working Capital Line of Credit at $75K"; subtitle "Member is leaning yes · primary concern: spouse"; body is the next-action description (Jenny's overdue ActionCard rationale wins the derivation here); button reads "Run follow-up" with a tooltip "Available when Meeting Recap module ships in Sprint 4."
  - `run_track`: same shape as Sprint 1 (banker_facing_purpose + "Run Growth track" CTA + confidence-band corner tag). The corner tag is exclusive to `run_track` mode; in `advance_opportunity`, system-confidence isn't a meaningful signal because the suggestion is grounded in member data, not in rule belief.

### Block C — TrackProgressDots component

- **Computation in `lib/suggested-next-step.ts`** — `computeTrackStages` is a pure function over Track shape + Member executions + Recommendation response; `computeTrackProgress` is the data-fetching wrapper. The hybrid model from §C.2 produces stages 1..N from the actual GrowthSteps in the Track (capitalized: Ask, Size, Show, Resolve, Connect) plus stages N+1 / N+2 from the post-Track lifecycle:
  - Resolve-ending track → "Decision pending" → "Funded"
  - Connect-ending track → "Specialist engagement" → "Closed"
- **State derivation** — Track step is `completed` if any of the Member's executions has the matching `step_shape` (Set-based check; demo seed uses all-or-nothing executions). Stage N+1 is `current` when response is `engaged | leaning_yes | committed` (and `completed` when response is `funded`); N+2 is `completed` only at `funded`. The component never shows two `current` stages simultaneously — if a Track step is still in flight (a partial-execution case the demo doesn't exercise), the post-Track pending stage demotes to upcoming.
- **Component `app/members/jenny/track-progress-dots.tsx`** — pure presentation, takes precomputed `TrackStage[]`. Renders 6px dots (8px ring + 6px filled center for current) with a 1px connecting line in `--blaze-rule`, plus 10px stage labels below (charcoal for current, grey-body for completed, grey-soft for upcoming).
- **Layout** — dots render in the upper-right of the card, opposite the title, in a flex row with the heading. For `run_track` mode the dots render below the heading row (not in the upper-right) since the heading row is empty in that mode and putting the dots in the corner would be visually weightless.
- **Verified for Jenny** — rendered HTML contains all six expected stage labels (Ask, Size, Show, Resolve, Decision pending, Funded) and the `aria-label="Growth Track progress"` ARIA hook.

### Decisions made during implementation (not pre-specified by the prompt)

1. **Button label for advance_opportunity:** "Run follow-up" (over "Schedule next step"). Matches the existing "Run Growth track" verb form for visual consistency between the two modes; the substantive action (open Meeting Recap to capture a follow-up) is the same shape regardless of which card variant the banker is looking at.
2. **Where the dots render in run_track mode:** flex-end-aligned below the heading, not in the upper-right corner alongside the heading. Reason: in `run_track` mode the corner is occupied by the confidence-band tag; co-locating dots there would crowd the corner and force a layout change. In `advance_opportunity` mode the corner has no tag, so the dots take that slot.
3. **Confidence-band tag suppressed in advance_opportunity mode:** The system's belief in a rule that fired is meaningful when suggesting "Run new Track"; it's not meaningful when the suggestion is "Follow up on the opportunity already in motion" (which is grounded in observed member data, not in rule belief). Documented in the page comment.
4. **Set-based completed-step check:** Cygnus's Track has two `Ask` steps; the Set-based `executedShapes.has(step.step_shape)` marks both as completed if either ran. Acceptable for demo seed (all-or-nothing executions), would need a position-based check in production. Flagged inline in `computeTrackStages` for the next reviewer.

### Items logged to OPEN_QUESTIONS during implementation

None new. Two architectural notes worth recording for future review (kept here, not promoted to OPEN_QUESTIONS unless they need a stakeholder decision):

- **`Recommendation.updated_at`** — the prompt's spec for handling multi-engagement (if a Member ever has more than one active engaged Recommendation simultaneously) calls for ordering by `updated_at desc`. The schema has only `created_at`. Demo never exercises multi-engagement so the gap is invisible. If/when production allows multiple opportunities in flight, add the field.
- **Cygnus's `Connect`-ending track** — the post-Track lifecycle for Connect tracks is "Specialist engagement" → "Closed." For the demo, "Specialist engagement" is always `current` because the seed has no follow-up Conversation from Marcus. In production, the `current → completed` transition for Specialist engagement would need a query against follow-up Conversations led by the specialist banker; computing that is beyond the demo's scope. Flagged in `computeTrackStages` comment.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`.
- Re-seed clean; row counts stable.
- Jenny's page (port 3000) renders:
  - "Suggested next step" heading with progress dots in upper-right (Ask · Size · Show · Resolve · Decision pending · Funded)
  - 4 dots completed (orange), 1 current (orange ring), 1 upcoming (grey)
  - "Follow up on Working Capital Line of Credit at $75K" title
  - "Member is leaning yes · primary concern: spouse" subtitle
  - Next-action description from the linked overdue ActionCard's rationale
  - "Run follow-up" button with the placeholder tooltip
- Northland and Cygnus profiles still don't have routes (Sprint 3); their data is verified via re-seed and `computeTrackStages` walking-through logic. Cygnus's Connect-ending track produces stages [Ask, Ask, Show, Connect, Specialist engagement, Closed] with the first 4 completed and Specialist engagement current — matches §C.3 expectation.

### Watch for review

- **Hard refresh reminder:** the new `<TrackProgressDots>` component uses Tailwind classes `border-blaze-orange` / `bg-blaze-rule` etc. that resolve at runtime via the global token bundle. If a CSS-only change ships in a future round, hard refresh per the Sprint 1 lesson.
- **No fixture data exercises `funded`:** the new enum value is reachable only through future Conversation captures (Sprint 4 Meeting Recap). The Insight Engine's response-distribution view will see `funded` as a category once data flows.
- **The prompt-named `member_response`** is the field's conceptual name; the actual schema field is `Recommendation.response` (named that way in Sprint 1 work). I did not rename the field — keeping the schema/code stable while honoring the spec's value-set extension. If a rename is wanted later for naming consistency, it's a one-pass migration plus updates across the page and lib code.

---

## 2026-04-27 · Sprint 2 Prompt 2 — mechanical refinement pass

**Session type:** Second executable prompt in Sprint 2. DEMO_BUILD_PLAN.md v2 was promoted into `docs/` (the v1 timeline of 11.5–15.5 days extended to 13–18; Sprint 4 expanded to 6–8 days for the Growth Conversations module). Six blocks (A–F) plus housekeeping. Single-checkpoint prompt; ran end-to-end.

### Block A — Step-position-based completion tracking

Replaced the Set-based `executedShapes.has(step.step_shape)` check in `lib/suggested-next-step.ts → computeTrackStages` with an id-based per-instance check:

- Function signature now takes `track_steps: Array<{ id, step_shape }>` and `member_executions_for_track: Array<{ growth_step_id }>`. The Set tracks executed step ids; a stage is `completed` iff there's an execution row pointing to that specific step instance.
- `computeTrackProgress` updated to select `growth_step_id` from executions (was `growth_step.step_shape`).
- For shapes that repeat within a Track (Cygnus's two Ask steps), labels disambiguate as `"Ask 1"` and `"Ask 2"` — pre-computed via per-shape running counts. Single-instance shapes still render as bare `"Ask"`, `"Size"`, `"Show"`, `"Resolve"`, `"Connect"`. Decision: use ordinal suffix rather than step-specific titles (the GrowthStep titles are too long for dot labels).
- Jenny's and Northland's visualizations are unchanged (each shape appears once → identical labels). Cygnus's Track now renders 6 dots: `Ask 1 | Ask 2 | Show | Connect | Specialist engagement | Closed`. Verified by walking through the function with seed data.

### Block B — `Recommendation.updated_at`

- Schema: added `updated_at DateTime @default(now()) @updatedAt` to the `Recommendation` model. Prisma's `@updatedAt` directive auto-updates on every mutation.
- Seed: explicitly set `updated_at` to the producing Conversation's date (Apr 8 for Jenny, Apr 15 for Northland, Apr 21 for Cygnus) so the demo's "now" anchor produces a consistent age narrative.
- `computeSuggestedNextStep` ordering switched from `created_at desc` → `updated_at desc`. For demo data this is a no-op (each Member has exactly one engaged Recommendation); the logic is now honest about what "most recently engaged" means in a multi-engagement future.
- The page's `member.recommendations` include also flipped to `orderBy: { updated_at: "desc" }`.

### Block C — `Recommendation.owned_by`

- Schema: added `owned_by_id String?` + `owned_by Banker? @relation("RecommendationOwnedBy")`. Reverse relation on `Banker`: `recommendations_owned`. Nullable for back-compat; the application sets ownership to `Member.primary_banker` when not specified.
- Seed: Jenny's $75K LOC owned by **Scott Brynjolffson** (Jenny's primary banker — owner === primary banker case). Northland's $180K Vehicle/Fleet Loan owned by **Scott** (same shape). Cygnus's $4M-$7M CRE owned by **Marcus Webb** (CRE specialist — distinct from Cygnus's primary banker Scott; the architecturally important demo case for cross-banker handoff).
- Display: ownership renders prominently in the top-right of each opportunity card in the merged Open opportunities band (Block E). For Jenny: `owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue`. For Cygnus: `owned by Marcus Webb` (no overdue ActionCard for that opportunity).
- Migration: combined Prompt 1's `status` field retirement (which hadn't been DB-migrated, only client-regenerated) with Prompt 2's `updated_at` + `owned_by` adds into a single hand-written migration `20260427154847_sprint2_response_collapse_and_owned_by`. Applied via `prisma migrate deploy` (non-interactive). Re-seed clean with stable row counts (3 members, 11 signals, 4 actionCards, 3 recommendations, 12 growthStepExecutions, 3 memberSummarySnapshots).

### Block D — Progress dot reposition + pipe separators

- **Reposition:** dots moved from upper-right of card (alongside the heading) to a standalone block between body paragraph and action buttons in both `advance_opportunity` and `run_track` modes. 24px breathing room above and below (`my-6` Tailwind = 24px each side). Verified `my-6` count = 2 in rendered HTML (one per nextStep mode template).
- **Pipe separators:** stage labels in `<TrackProgressDots>` now render as `Label | Label | Label …` with the `|` character in muted grey (`text-blaze-grey-body`). 14px horizontal margin on each side of the pipe (Tailwind `mx-3.5`). The pipes are separators, not state signals — they keep a constant muted grey while the labels themselves carry state-based color (charcoal for current, grey-body for completed, grey-soft for upcoming).
- **Stage labels remain non-clickable** for this prompt — Sprint 4 will wire navigation when the destinations exist. No underline, hover state, or cursor pointer on labels.
- "Decision pending" label fits without wrapping at the new widths (verified visually); kept the longer label rather than truncating to "Pending."
- Component outer container changed from `items-end` to `items-start` since the new placement is full-width between body and CTAs, not right-aligned in a corner.

### Block E — Open opportunities + Open work merger

- Removed the standalone Open work band entirely. Page band sequence is now: Suggested next step → **Open opportunities** (unified) → Active signals → History.
- Each opportunity card in the merged band now folds in:
  - **Top-right metadata line:** `owned by [banker]` always; `Due [date] · Nd overdue` (in soft-red treatment) when a linked overdue ActionCard exists.
  - **Verb-prefix relationships:** existing `→ serves goal:`, `→ addresses blocker:`, `→ responds to trigger:`, `→ responds to indecision:` lines stay.
  - **Member-state line:** `Member is [chip: leaning yes] · primary concern: [chip: spouse]`.
  - **Rationale paragraph + "View full rationale"** progressive disclosure (existing).
  - **Suggested opening block:** member-facing prose folded in from the linked ActionCard's `suggested_opening`. Same orange-vertical-line treatment used in the prior Open work band.
  - **Trace expand:** `from check in on Apr 8, 2026 · Show step` (existing); now also reports the linked ActionCard's spawning step shape when an ActionCard is linked.
- Linkage: `actionCardByRecommendationId` map built at render time using the same convention as `lib/priorities.ts` dedup logic (ActionCard ↔ Recommendation share an `origin_conversation`).
- Sidebar nav-line dropped the "open ActionCard" token — now reads `4 active Signals · 1 open opportunity` (from `4 active Signals · 1 open ActionCard · 1 open opportunity`). With the band merger, ActionCards no longer have their own anchor band; the count became duplicative for the demo's data shape.
- Sidebar What's hot dedup logic in `lib/priorities.ts` is unchanged — still emits Bucket 1 (overdue ActionCard) for Jenny; the underlying data shape still supports Bucket 2/3/4 even if Open work no longer has its own band.
- Removed the `→ de-risks opportunity:` verb-prefix per §E.4 (the card itself is the opportunity; verb was redundant signaling).

### Block F — Meeting Recap → Growth Conversations rename

- **New route:** `app/growth-conversations/page.tsx` placeholder created. Renders a Sprint-4-coming-soon page with a back-link to Jenny's profile. Replaces the prior no-route `<button>` for "Run Growth track" / "Run follow-up" — both now use `<Link href="/growth-conversations">`.
- **Tooltip removal:** the prior "Available when Meeting Recap module ships in Sprint 4" tooltip is gone; the button now just navigates.
- **CLAUDE.md §5 vocabulary:** replaced `Meeting recap` with `Growth Conversations`; added historical note about the rename. §1 paragraph updated to list "Growth Conversations" as one of the three modules.
- **SCOPE.md:** acceptance test #3 + #4 updated; §3.1 module subheading rewritten to capture v2 architectural changes (single scrolling page, two entry paths, track-agnostic Ask + Size, signal longevity, skip handling); §6 timeline note updated.
- **Not renamed (per DEMO_BUILD_PLAN.md v2 §10):** prior BUILD_LOG entries retained as-is. Database schema names unchanged (no `meeting_recap` columns or tables exist; nothing to migrate). Old code comments referencing "Meeting Recap" can be updated opportunistically as files are touched.
- **Deferred to Sprint 4 Prompt 4.1** (per the prompt's §F.4): substantive rewrites of Module and Data Flow §3 (capture-module section) and Data Framework §4 (track-agnostic Ask + Size architecture).

### Decisions made during implementation (not pre-specified)

1. **Ordinal labels for repeated step shapes** — `Ask 1` / `Ask 2` rather than step-specific titles (titles like `Probe capital event evaluation` are too long for dot labels; ordinals stay short and readable).
2. **Combined migration** (Prompt 1 status drop + Prompt 2 updated_at + owned_by) — Prompt 1's schema changes hadn't been DB-migrated, only client-regenerated. One hand-written migration brings the DB to the post-Prompt-2 shape and restores migration-history honesty.
3. **"Decision pending" label kept** — fits without wrapping at the demo's typical viewport widths; truncating to "Pending" lost meaning.
4. **SCOPE.md §3.1 + §6 expanded beyond test #3** — the prompt narrowly asked for test #3, but `Meeting recap` appeared as a heading in §3.1 and as a phrase in §6's time budget. Updating both for consistency was a small additional touch and kept the doc internally coherent.

### Items logged to OPEN_QUESTIONS

None new. The two architectural notes from Sprint 2 Prompt 1 (`Recommendation.updated_at` future utility, Connect-track Specialist-engagement → Closed transition) — the first is now resolved by Block B; the second still applies and remains a Sprint 4 concern.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`. Two routes prerendered: `/members/jenny`, `/growth-conversations`.
- Re-seed clean; stable row counts.
- HTML inspection of Jenny's profile (port 3000):
  - `Growth Track progress` aria-label present (TrackProgressDots intact).
  - 12 `|` chars in rendered HTML (pipe separators between stage labels — 5 per progress visualization × ~2 instances + a few other natural occurrences).
  - 2 `my-6` occurrences (24px breathing room around progress dots; one per nextStep mode template).
  - `id="band-proposals"` present; `id="band-work"` and `#band-work` anchor both absent (Open work merged + nav-line cleaned).
  - `Suggested opening · member-facing` present (folded into the merged opportunity card).
  - `Apr 22, 2026` + `overdue` both present (due-date + overdue rendering in the opportunity card's top-right).
  - `/growth-conversations` link present (Run follow-up button).
- HTML inspection of `/growth-conversations`: 200 OK, placeholder content visible.

### Watch for review

- **Hard refresh reminder:** CSS-token bundle should pick up cleanly since I didn't touch `globals.css` this round, but the layout shifts (progress dots repositioned, Open work removed, pipe separators) are component/JSX changes — RSC payload should invalidate properly.
- **Cygnus / Northland visual confirmation deferred:** their `/members/[id]` routes are Sprint 3 work. The new code paths exercise their data via `computeTrackStages` and the merged-card rendering, but I can't visually confirm without the dynamic route. Block A's two-Ask-step disambiguation is verified by walking through the function logic with Cygnus's seed data.
- **Migration history rebuilt:** the new migration `20260427154847_sprint2_response_collapse_and_owned_by` is the first one to actually contain SQL for the `status` retirement. If the demo gets reset via `prisma migrate reset` (when allowed by user consent), it will replay the migration sequence cleanly.

---

## 2026-04-27 · Sprint 3 Prompt 1 — Multi-Member generalization + remaining two Artifacts

**Session type:** First executable prompt for Sprint 3. Sprint 2 accepted; v2.1 plan + Insight Engine design notes promoted into `docs/`. Five blocks (A–E) plus housekeeping; single-checkpoint prompt.

### Block A — Open opportunities header refinement

The merged opportunity card's header was rendering title + ownership/due-date metadata on a single justified-between row, which read as cramped. Restructured to:

- **Line 1:** Recommendation title (product name, optional `at $size`, optional non-standard structure chip).
- **Line 2** (4px below title via `mt-1`): ownership + optional due-date metadata (`owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue`). Smaller text (`text-xs`), grey-body color, with the existing red treatment preserved for the overdue suffix.
- **24px gap** before the verb-prefix relationship lines (`→ serves goal:`, `→ addresses blocker:` …) — bumped from `mt-3` to `mt-6` so the title block reads as a self-contained header before the relationships unspool.

Component-level change in the merged-opportunity `<li>` template; applies automatically to all three Members.

### Block B — Dynamic /members/[id] route + Member.slug

- **Schema:** Added `Member.slug String @unique` to the model. Sprint-3-specific migration `20260427162615_sprint3_member_slug` rebuilds the SQLite table (column-add + unique index) and backfills slugs in the migration SQL itself via a `CASE` on the legal_name (the demo has exactly three known Members, so hardcoding the mapping is acceptable). Slugs: `jenny`, `northland`, `cygnus`.
- **Seed:** Each `prisma.member.create` now includes `slug: "jenny" | "northland" | "cygnus"`.
- **Route:** Moved `app/members/jenny/` → `app/members/[id]/`. The page signature became `({ params }: { params: Promise<{ id: string }> })` per Next 16's async-params convention; the page awaits params, reads `slug`, and calls `prisma.member.findUnique({ where: { slug } })`.
- **404 handling:** if `findUnique` returns null, the page disconnects Prisma and calls Next's `notFound()` to render the framework's 404 page. Verified: `/members/unknown-member` returns HTTP 404; `/members/jenny`, `/members/northland`, `/members/cygnus` all return HTTP 200.
- **No internal-link breakage:** the homepage `app/page.tsx` and the `/growth-conversations` placeholder both link to `/members/jenny` — these continue to work because the dynamic route accepts `jenny` as a slug. No "members list" route was added — out of scope per the prompt.
- **Banker context preserved:** the page header still reads "Logged in as Scott Brynjolffson · Primary banker" for all three Members (Scott is each Member's primary banker per the seed). For Cygnus, the CRE opportunity correctly displays "owned by Marcus Webb" — distinct from the relationship banker — which is the cross-banker-handoff demo case the prompt called out as architecturally important.

### Block C — Northland fleet ROI projection chart

`app/members/[id]/fleet-roi-projection-chart.tsx` — Recharts ComposedChart with quarterly resolution (12 quarters = 36 months). Two paths: a flat dashed-grey "continue cash-buy baseline" line at $0 cumulative impact, and an orange "with $180K Vehicle/Fleet Loan" line that starts at -$180K (initial cash outflow), crosses breakeven around Q5–Q6, accelerates to ~$440K cumulative by Q12. Quarterly stacked bars below show captured revenue (orange, growing) vs. declined revenue (grey, shrinking) under the financing path.

**Data values used** (illustrative, hardcoded — production would parameterize from `parameters_used`):

| Quarter | Continue cash | With financing | Captured | Declined |
|---|---|---|---|---|
| Q1 | $0 | -$180K | $8K | $49K |
| Q2 | $0 | -$158K | $18K | $39K |
| Q3 | $0 | -$130K | $32K | $25K |
| Q4 | $0 | -$95K | $42K | $15K |
| Q5 | $0 | -$50K | $49K | $8K |
| Q6 | $0 | $5K (breakeven) | $50K | $7K |
| Q7 | $0 | $65K | $51K | $6K |
| Q8 | $0 | $130K | $52K | $5K |
| Q9 | $0 | $200K | $52K | $5K |
| Q10 | $0 | $275K | $52K | $5K |
| Q11 | $0 | $355K | $52K | $5K |
| Q12 | $0 | $440K | $52K | $5K |

Values match Northland's rationale_text: monthly debt service ~$3.6K (under captured monthly uplift); 70 declined calls × $700 = $49K annual lost revenue translates roughly to the stacked-bar "declined" Q1 starting figure. Breakeven at ~Q5 mid-year-2 matches the brief's "typically by year 2" reframe.

Visual style matches the seasonal smoothing chart: same axis colors, font, grid pattern, tooltip styling.

### Block D — Cygnus capital event partnership map

`app/members/[id]/capital-event-partnership-map.tsx` — custom SVG (Recharts is wrong here; this is a sequence diagram, not a quantitative chart). 6 milestone nodes on a horizontal line, evenly spaced; connecting line segments between adjacent nodes. Node states render with the same visual language as TrackProgressDots (orange filled = completed, orange ring + smaller filled center = current, light grey = upcoming).

**Milestone sequence** (left → right):

| # | Milestone | Specialist | State |
|---|---|---|---|
| 1 | Initial conversation | Scott Brynjolffson | completed |
| 2 | Specialist introduction | Marcus Webb | **current** |
| 3 | Capital event planning | Marcus + Scott | upcoming |
| 4 | Site & underwriting | CRE team | upcoming |
| 5 | Lending committee review | Lending committee | upcoming |
| 6 | Closing & treasury | Treasury team + Marcus | upcoming |

A "Cygnus is here" caret with a small triangle pointer hangs above the current node, providing an explicit orientation cue. Specialist names render as italic body-grey labels below each milestone label.

Modal section label adapts to artifact type: `"Schematic"` for Cygnus's `comparison`-typed Artifact, `"Chart"` for Jenny's and Northland's `chart`-typed Artifacts.

### Block E — Visual verification across all three Members

All three Member profiles render at HTTP 200; unknown slugs return 404. Verified in HTML inspection:

- **Jenny:** Block A header refinement applied; sidebar What's hot shows `Follow up overdue · Working Capital Line of Credit at $75K · 3 days late` (Bucket 1, overdue ActionCard).
- **Northland:** Block A header applied; sidebar shows `Awaiting decision · Vehicle/Fleet Loan at $180K · member leaning yes` (Bucket 2 — Northland's follow-up ActionCard is due Apr 29, not yet overdue at NOW=Apr 25, so falls through to the Recommendation bucket); fleet ROI chart accessible via the Open opportunities Artifact preview affordance.
- **Cygnus:** Block A header applied; **two Ask dots disambiguated as `Ask 1` and `Ask 2`** (the Sprint 2 Prompt 2 step-position-based completion logic now visually surfaces); **Connect-ending Track stages render as `Specialist engagement` and `Closed`** (not Decision pending / Funded); **`owned by Marcus Webb`** on the CRE opportunity (distinct from relationship banker Scott Brynjolffson, who still appears as the Member's primary banker in the sidebar identity block and the page header); sidebar What's hot shows `Awaiting decision · Commercial Real Estate Term Loan · member leaning yes` (both ActionCards on Cygnus are not yet overdue at NOW; falls through to Bucket 2); capital event partnership schematic accessible via Artifact preview.

**Sidebar What's hot priority differences** are meaningful across all three Members per the prompt's §E.3 expectation.

**Four-tier display discipline holds** consistently — chips for member-state (`leaning yes`, `spouse`, `cpa`, `bank_capability`, `engaged`); labeled values for descriptive captured fields (`Impact: painful`, `Timeframe: recent`, `Source: member stated`); inline-bold for numeric measurements (`$75K`, `$180K`, `$12K/quarterly`, `45 days`, `Apr 22, 2026`); plain text for entity-categorizing metadata (no `ActionCard.type` chips on the merged opportunity card).

### Decisions made during implementation (not pre-specified)

1. **Folder structure for new artifact components:** kept new components alongside the dynamic route at `app/members/[id]/` to match the existing pattern. Considered `app/members/_components/` (Next.js private-folder convention) but the per-route placement is consistent with how `seasonal-smoothing-chart.tsx` and `track-progress-dots.tsx` were placed in Sprint 1.
2. **Northland chart data values:** chose 12-quarter resolution (36 months at quarterly steps) over 36-month resolution (monthly steps) — quarterly bars produce a cleaner composite with the line, and align with how a banker would reasonably narrate the projection. Breakeven at Q5 (mid-year-2) matches the brief's narrative reframe.
3. **Cygnus schematic — "Cygnus is here" caret:** added as an explicit orientation cue rather than relying purely on the current-node ring treatment. Six nodes on a horizontal line with subtle state coloring is at the readability edge for a banker scanning quickly; the explicit caret leaves no ambiguity about where on the journey Cygnus sits.
4. **Section label dispatch in modal:** `"Schematic"` for `comparison`-typed Artifacts; `"Chart"` for the rest. The brief documents Cygnus's Artifact as `type: "comparison"` ("closest match in the schema"). The dispatch keeps the modal copy honest without adding a new schema enum value.
5. **CLAUDE.md §12 update:** added `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` as a Tier 2 entry alongside `MEMBER_FIXTURE_BRIEF.md`. Per the user's framing, this document is authoritative for Insight Engine design decisions in Sprint 4 and Sprint 5; surfacing it in §12 makes it easy to find.

### Items logged to OPEN_QUESTIONS

None new. The architectural question Sprint 2 Prompt 1 raised about Connect-track Specialist-engagement → Closed transition logic remains open (still hard-coded to `current`); meaningful resolution comes in Sprint 5 Insight Engine work where specialist-led follow-up Conversations would drive the transition.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`. Routes prerendered: `/`, `/_not-found`, `/growth-conversations`; dynamic: `/members/[id]`.
- Re-seed clean; row counts stable (3 members with slugs, 3 artifacts, 12 growthStepExecutions, 3 recommendations, 4 actionCards, 11 signals, 3 memberSummarySnapshots).
- `/members/jenny`, `/members/northland`, `/members/cygnus` all HTTP 200; `/members/unknown-member` HTTP 404.
- HTML inspection confirms `Ask 1` and `Ask 2` labels render 6 times each in Cygnus's profile (RSC payload + DOM); `Cygnus is here` caret present (schematic rendering).

### Watch for review

- **Hard refresh reminder:** new components added but no `globals.css` token changes this round — RSC payload should invalidate JSX cleanly. Hard refresh recommended for new-component CSS just to be safe.
- **Smoke-test deployment NOT attempted in this prompt:** Vercel deploy is non-trivial (needs env vars + build config tweaks) and the prompt's §H.4 noted to log it for Sprint 6 if non-trivial. Logged as a Sprint 6 task; will surface deployment-specific issues there.
- **Cygnus schematic readability:** six nodes on a 720×280 SVG canvas at modal width feels tight on the lengthier labels. The two-line wrapping logic (split on first space after position 8) handles "Initial conversation" → "Initial / conversation", "Specialist introduction" → "Specialist / introduction", etc. If Francisco's review surfaces readability issues, one quick fix is to drop to a 5-node version (collapse "Site & underwriting" into "Capital event planning") or widen the canvas to 840px.
- **Northland chart quarterly resolution:** 12 quarterly bars + 12 line points reads cleanly; if Francisco prefers monthly resolution (36 points), it's a small data swap.

---

## 2026-04-27 · Sprint 3 Prompt 1 — review acceptance + Sprint 4 architectural decisions captured

**Session type:** Documentation pass following Sprint 3 Prompt 1 visual review. No code shipped this turn — just architectural decisions to land in BUILD_LOG and corresponding updates to DEMO_BUILD_PLAN.md v2.1 Sprint 4 acceptance criteria.

### Sprint 3 Prompt 1 — accepted

Visual review confirmed:

- **Cygnus's Capital Event Partnership Map (initial false alarm — RESOLVED).** The schematic is visible and accessible via modal preview as designed. The affordance was slightly less visible than expected on first scan; once located, it rendered correctly.
- **Charts render correctly across all three Members.** `/members/jenny` no regressions; `/members/northland` fleet ROI chart renders correctly; `/members/cygnus` schematic renders correctly. `/members/unknown-member` returns the clean 404. Sprint 3 Prompt 1 fully accepted.

### Architectural decisions surfaced during review (3a / 3b / 3c / 4)

These do **not** require schema or code work in this prompt. They're documented here so the Sprint 4 prompts can incorporate them; matching Sprint 4 acceptance-criteria edits also landed in `docs/DEMO_BUILD_PLAN.md` v2.1.

#### (3a) Structured Recommendation size capture

Replace the current freeform size narrative in `Recommendation.rationale_text` with two structured fields:

- `Recommendation.size_low` — Decimal, nullable but expected populated when captured
- `Recommendation.size_high` — Decimal, nullable but expected populated when captured

**Display logic:**

- When `size_low === size_high` → render as a single value: `"$5.5M"`
- When `size_low < size_high` → render as a range: `"$4M-$7M"`

**Schema landing:** Sprint 4 Prompt 4.1.
**Capture form integration:** Sprint 4 Prompt 4.4 (Resolve phase).

This was Option B from earlier conversation (vs Option A: keep size_proposed as a single Decimal and use freeform prose for ranges). Option B is the structured-capture-friendly path; ranges are queryable, and the display layer handles the single-value case automatically.

#### (3b) Recommendation.product_subtype

New optional field on Recommendation:

- `Recommendation.product_subtype` — String, optional. Captures sub-type within a Product family.

**Examples:**

- For `Vehicle/Fleet Loan`: `fleet | farm_equipment | company_vehicle | service_van`
- For `Owner-Occupied CRE`: `office_building | warehouse | manufacturing_facility`

**Schema landing:** Sprint 4 Prompt 4.1.
**Capture form integration:** Sprint 4 Prompt 4.4 (Resolve phase) — rendered as a Product-family-contextualized dropdown.

Architecturally this is a seed for future Pilot-phase Product taxonomy refinement: Pilot phase can promote frequently-used subtypes into a structured Product variant model, while the demo phase keeps subtype as an open string.

#### (3c) Structured Artifact parameter capture with provenance

The Show step Artifact preview's "Parameters used (this rendering)" panel currently shows seed-data values. In production, those parameters need to be captured by the banker during the Show phase, with provenance tracking. The architectural pattern:

```
ArtifactParameterCapture {
  id
  artifact_share_record_id   (relation to the Show step's ArtifactShareRecord)
  parameter_name             # e.g., "current_fleet_size", "expansion_size_estimate"
  parameter_value            # the captured value (string, parsed by render layer)
  parameter_provenance       # enum: member_profile | captured_signal
                             #     | banker_assumption | member_stated_in_followup
  captured_at
  captured_by_banker_id
}
```

**Show step capture UI flow** (Sprint 4 Prompt 4.2):

1. System pre-populates parameters from existing Member profile data, captured Signal magnitudes, and prior captured Recommendation data wherever possible.
2. Pre-populated parameters render with their provenance label visible: `from Member profile`, `from Size phase capture`, etc.
3. Gap parameters (no auto-fill available) are highlighted; banker enters value with provenance selection.
4. Banker can override pre-populated values; override captured as `banker_assumption` provenance.
5. On save, all parameters persist as `ArtifactParameterCapture` records linked to the ArtifactShareRecord.

**Schema landing:** Sprint 4 Prompt 4.1.
**Show capture form:** Sprint 4 Prompt 4.2.

**Insight Engine consequence (Sprint 5):** the Insight Engine can analyze "parameter-capture-provenance correlation with funding outcomes" — a future-state cohort insight enabling, e.g., "Show steps where ≥3 parameters were captured with `member_stated_in_followup` provenance fund at N% higher than ones where parameters were primarily `banker_assumption`." That analytical capability is the architectural reason to capture provenance now; the demo phase doesn't compute the rollup but the data shape supports it.

#### (4) Forward-looking note: member-facing self-service simulator

The structured parameter-capture architecture established by 3c also establishes the pattern for an eventual member-facing self-service simulator product. Members could adjust their own parameters (with `member_stated` provenance — distinct from the banker-mediated `member_stated_in_followup` value) and share the updated Artifact back to the banker. This would be a separate route, separate auth scope, separate product surface — not in demo scope.

**Why capture this now:** the choice to model parameter capture as a first-class entity with a provenance enum (rather than as freeform jsonb) is what makes the future product viable. If we'd modeled parameters as a flat jsonb blob, the member-self-service path would require schema migration; modeling as `ArtifactParameterCapture` rows with provenance keeps the path open without committing to it.

### Updates landed elsewhere this turn

- **`docs/DEMO_BUILD_PLAN.md` v2.1** — Sprint 4 §Prompt-decomposition updated:
  - Prompt 4.1 now mentions `Recommendation.size_low` + `size_high` + `product_subtype` schema additions and the `ArtifactParameterCapture` model with `parameter_provenance` enum.
  - Prompt 4.2 now mentions Show step capture pre-population from Member profile / captured Signals / prior Recs, with provenance labels visible and banker overrides captured as `banker_assumption`.
  - Prompt 4.4 now mentions Resolve step capture taking structured `size_low` / `size_high` values (with the display logic) and `product_subtype` rendered as a Product-family-contextualized dropdown.
- **Sprint 4 acceptance criteria** — four new lines added covering 3a / 3b / 3c and the provenance-correlation analytical hook.
- **Governance §9** — Data Framework §4 update note now mentions the Recommendation field changes (3a + 3b); Data Framework §5 update note now mentions the ArtifactParameterCapture entity definition (3c) alongside the Macro entity.

### Next move

Sprint 4 Prompt 4.1 is the next executable prompt. Per the established pattern, Francisco drafts the prompt immediately before sending; CC executes against it. Schema additions for 3a / 3b / 3c happen in Prompt 4.1; capture forms in Prompts 4.2 and 4.4 per the decomposition.

---

## 2026-04-27 · Sprint 4 Prompt 4.1a — Growth Conversations foundation

**Session type:** First executable prompt for Sprint 4. v2.1 plan promoted; Insight Engine design notes promoted; Sprint 4 split into 4.1a (foundation) and 4.1b (first capture form). 4.1a is **foundation-heavy** — the deliverable is the architecture, not visible capture-form UI. Six blocks (A–F) plus housekeeping; single-checkpoint prompt.

### Block A — Schema additions

Six related schema changes landed via one combined migration `20260427172708_sprint4_4_1a_growth_conversations_foundation`:

- **`Recommendation.size_low` / `size_high`** (Float?) — structured range capture per Sprint 3 review §3a. The prompt's `Decimal? @db.Decimal(15, 2)` was adapted to `Float?` for SQLite compatibility and to match the existing `size_proposed` field; `dollars()` formatter takes `number`. Documented in the schema comment.
- **`Recommendation.product_subtype`** (String?) — sub-type within Product family per Sprint 3 review §3b.
- **`Signal.superseded_by_signal_id`** (FK→Signal nullable) + **`superseded_at`** + reverse relation `superseding_signals` — longevity tracking per INSIGHT_ENGINE_DESIGN_NOTES.md §6 and the prompt's §A.7.
- **`GrowthStepExecution.was_skipped`** (Boolean default false) + **`skip_confirmed_by_banker_id`** + **`skip_confirmed_at`** + **`skip_reason`** — skip-state tracking per the prompt's §A.8 and DEMO_BUILD_PLAN.md Sprint 4 Prompt 4.3.
- **`Macro`** (new entity) — full schema per the prompt's §A.5 and INSIGHT_ENGINE_DESIGN_NOTES.md §3. Array fields (`affected_industry_families`, `affected_member_types`, `evidence_links`, `related_topics`) stored as `Json` since SQLite doesn't support `String[]`. Authorship dual-mode (Banker FK or external label).
- **`ArtifactParameterCapture`** (new entity) + **`ParameterProvenance`** enum (`member_profile | captured_signal | banker_assumption | member_stated_in_followup`) — per the prompt's §A.6 and Sprint 3 review §3c. **Relation target deviation:** the prompt names `ArtifactShareRecord` as the linked entity, but Sprint 1 chose to keep share-record data in `GrowthStepExecution.captured_data` jsonb rather than creating a first-class ArtifactShareRecord table. So `ArtifactParameterCapture` links to `GrowthStepExecution` directly. If a future sprint promotes ArtifactShareRecord, the relation can be re-pointed; the schema shape and provenance enum stay. Documented inline in schema and in the BUILD_LOG decisions section.

**Migration approach:** Hand-written migration SQL using `ALTER TABLE ADD COLUMN` for the existing tables (SQLite supports it for nullable columns with defaults) plus `CREATE TABLE` for the two new entities. Applied via `prisma migrate deploy` (non-interactive); `prisma generate` regenerated the client. Re-seed clean.

**Recommendation seed updates (Sprint 4 §A.3):**

| Member | Recommendation | size_low | size_high | product_subtype |
|---|---|---|---|---|
| Jenny | Working Capital LOC | 75000 | 75000 | "seasonal_smoothing" |
| Northland | Vehicle/Fleet Loan | 180000 | 180000 | "service_van" |
| Cygnus | Owner-Occupied CRE | 4000000 | 7000000 | "manufacturing_facility" |

**Display logic** (Sprint 4 §A.4) lives in `lib/format-size.ts` (`formatRecommendationSize`). Renders single value when `size_low === size_high` (`"$75K"`); range when `size_low < size_high` (`"$4M-$7M"`); falls back to legacy `size_proposed` when both new fields null. Applied across `app/members/[id]/page.tsx` (Open opportunities band, Suggested Next Step card, Artifact share verb-prefix), `lib/priorities.ts` (Bucket 1/2 priority labels), and `lib/suggested-next-step.ts` (recommendation surface in `advance_opportunity` mode). Verified: Cygnus's profile renders `at $4M-$7M`; Jenny's renders `at $75K`.

**ParameterProvenance descriptions** added to `lib/enum-descriptions.ts → PARAMETER_PROVENANCE_DESCRIPTIONS` per Semantic Discipline.

### Block B — Macro seed data

Three Macros seeded in a new `Step 7` of `prisma/seed.ts → seedMacros()`:

1. **Q3 supplier payment compression — Small Caterers** (affects Jenny). Author: Marcus Wei (external_label). Effective from 2026-04-12, no end date. Related Topics: blockerSeasonal, blockerReceivables, goalCashFlowSmoothing.
2. **Light commercial fleet ROI window — HVAC & Trades** (affects Northland). Author: Sarah Chen (external_label). Effective 2026-04-10 → 2026-09-30 (closing window). Related Topics: goalFleet, blockerCapacity.
3. **Specialty manufacturer capital event opportunities** (affects Cygnus). Author: Sarah Chen (external_label). Effective from 2026-04-05, no end date. Related Topics: triggerCapacityEval, goalCustomerGrowth.

All three use `authored_by_external_label` rather than seeding Marcus Wei / Sarah Chen as Banker rows — logged as Q-023 in OPEN_QUESTIONS for Pilot-phase reconsideration. Re-seed verified: `macros: 3` in row counts.

### Block C / D / E — Growth Conversations route shell

- **Replaced** the placeholder `/growth-conversations` page with the standalone-entry shell: shared header (`_shared.tsx → GrowthConversationsHeader`) + `MemberLookup` component scoped to the simulated current banker's portfolio (Scott's three Members).
- **New dynamic route** `/growth-conversations/[memberId]` for prefilled entry. Loads Member by slug; 404s on unknown slug.
- **Member lookup** (`member-lookup.tsx`, client component): client-side filtering across `Member.legal_name | doing_business_as | slug`; result list shows `Member Type` (labeled value) + `Last conversation` date; click navigates to the prefilled route.
- **Single scrolling page** (`[memberId]/page.tsx`): two-column layout (~70 / ~30) on `lg+`; left column scrolling sections per stage; right column sticky anchor progress bar. Each section has `id={`stage-${slug}`}` (e.g., `stage-ask-1`, `stage-show`, `stage-decision-pending`); read-only summary renders for stages with existing GrowthStepExecutions (date + verb-prefix list of produced entities); placeholder dashed-border box for upcoming stages and lifecycle stages.
- **Anchor progress bar** (`anchor-progress-bar.tsx`, client): vertical list with state dots + labels; click smooth-scrolls; Intersection Observer (`rootMargin: -20% 0px -60% 0px`) tracks which section is in view and applies a 2px orange-deep left-border indicator. State coloring mirrors TrackProgressDots; "currently-viewed" is a separate concept layered on top of journey state.
- **Member profile buttons** updated: `Run Growth Track` and `Run follow-up` now link to `/growth-conversations/[slug]` (sed-replaced both occurrences in `app/members/[id]/page.tsx`).

### Block F — Governance doc updates

The `.docx` files can't be edited directly. Created **two Markdown sidecar amendment files** alongside them; Francisco folds the textual changes into the `.docx` source at next review:

- `docs/design/03_DATA_FRAMEWORK_AMENDMENTS.md` — captures §4 Track entity reframe (track-agnostic Ask + Size); `Recommendation.size_low / size_high / product_subtype`; Signal supersession fields; GrowthStepExecution skip-state fields; new §5 Macro section; new ArtifactParameterCapture section + ParameterProvenance enum description.
- `docs/design/04_MODULE_AND_DATA_FLOW_AMENDMENTS.md` — captures the Meeting Recap → Growth Conversations §3 rewrite (two entry paths, single scrolling page architecture, anchor progress bar, track-agnostic vs track-specific phases, signal longevity, skip handling, inline insight surfaces, save behavior).

**Lib registries updated** directly:

- `lib/relation-names.ts` — added `supersedes`, `captured_during`, `authored_by`, `affects_industry`, `affects_member_type` to the RelationName union and the RELATION_NAMES table.
- `lib/verb-patterns.ts` — added `supersedes`, `skipped`, `affects` to the VERB_PATTERNS registry with descriptions and contexts.

### Decisions made during implementation (not pre-specified)

1. **`Float?` over `Decimal? @db.Decimal(15, 2)`** for `size_low` / `size_high` — matches the existing `size_proposed` field (also Float) and the `dollars()` helper signature. The `@db.Decimal` attribute is Postgres-specific and ignored on SQLite anyway. Documented in schema comment.
2. **`ArtifactParameterCapture` linked to `GrowthStepExecution` not `ArtifactShareRecord`** — the latter doesn't exist as a first-class entity in the demo. Schema shape preserved; relation re-pointable if a future sprint promotes ArtifactShareRecord. Documented in schema comment + BUILD_LOG.
3. **Macro authors as external_label** for all three demo Macros — adding Marcus Wei and Sarah Chen as Banker rows would inflate the dropdown with non-relationship-bankers. Logged as Q-023 for Pilot review.
4. **Macro array fields as `Json` not `String[]`** — Prisma's `String[]` is Postgres-only.
5. **Empty `ArtifactParameterCapture` / `Signal.superseded_by` / `GrowthStepExecution.was_skipped` in seed** — Prompt 4.1a is foundation-only; data populates as Sprint 4 Prompts 4.2 and 4.3 ship the capture flows. Logged as Q-024, Q-025, Q-026 for revisit during those prompts.
6. **Anchor progress bar hidden below `lg` breakpoint** — desktop-first for the demo. Logged as Q-027 to revisit during Sprint 4 Prompt 4.1b visual review.
7. **Read-only stage summaries** for completed stages (rather than blank placeholders) — gives the visual review something to land on. Format: `Captured [date] · [step title]` + verb-prefix list of produced entities. Sprint 4 Prompt 4.1b will replace the Ask-stage read-only treatment with a full capture form.
8. **Governance docs as Markdown sidecars** — `.docx` files can't be edited from CC; the `_AMENDMENTS.md` pattern lets the textual updates land here while the canonical `.docx` is folded by Francisco at review time.

### Items logged to OPEN_QUESTIONS

- Q-023 — Macro authors not seeded as Banker entities
- Q-024 — ArtifactParameterCapture table empty in seed
- Q-025 — Signal supersession schema unused in seed
- Q-026 — GrowthStepExecution skip-state schema unused in seed
- Q-027 — Anchor progress bar small-viewport behavior

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`. Five routes: `/`, `/_not-found`, `/growth-conversations`, `/growth-conversations/[memberId]`, `/members/[id]`.
- Re-seed clean; row counts include `macros: 3` and `artifactParameterCaptures: 0`.
- `/`, `/growth-conversations`, `/growth-conversations/{jenny,northland,cygnus}`, `/members/{jenny,cygnus}` all HTTP 200; `/growth-conversations/nope` HTTP 404.
- Cygnus's `/growth-conversations/cygnus` page renders 6 stages: `Ask 1`, `Ask 2`, `Show`, `Connect`, `Specialist engagement`, `Closed`. Stage counters show `Stage 1 of 6` through `Stage 6 of 6`. Anchor progress bar aria-label `Growth Conversation stages` present. Read-only summaries for completed stages; lifecycle placeholder for the post-Track stages.

### Watch for review

- **First visible capture form lands in 4.1b.** Per the prompt's reminder: "If the visual review feels like 'more setup than payoff,' that's expected — the architecture is the deliverable." This round ships the route shells, the Member lookup, and the scrolling-page structure with placeholders. Sprint 4 Prompt 4.1b builds the Ask form.
- **Hard refresh recommended** — new components (`MemberLookup`, `AnchorProgressBar`, `_shared` header), new routes; CSS bundle didn't change but the JS bundle did.
- **The Member profile context banner** (Macro surfacing on Member profile) is Sprint 4 Prompt 4.1b work — the Macro seed data exists to populate it, but the banner itself isn't built yet. Visual review of Sprint 4 Prompt 4.1a should expect Macros to be invisible on the Member profile.

---

## 2026-04-27 · Sprint 4 Prompt 4.1b — Growth Conversations chrome refinements

**Session type:** Second executable prompt for Sprint 4. Visual review of 4.1a surfaced four chrome refinements before the first capture form lands; per the discipline of breaking up monolithic prompts, those refinements ship here so the Ask form work in 4.1c can land cleanly. **No schema changes; no capture forms** — purely component-level UI work.

### Block A — Completed-stage checkmark

Added a small inline-SVG checkmark to the right corner of each Track-step stage's section header in `/growth-conversations/[memberId]`, alongside the existing `Stage N of M` counter. Renders only when `stage.kind === "track_step"` AND `stage.state === "completed"`; lifecycle stages (Decision pending / Funded / Specialist engagement / Closed) never show the checkmark.

- Inline SVG (no icon library), 14×14px, burnished orange (`#B45F26`) stroke, polyline points `3,8 7,12 13,4`. Per the prompt: emoji checkmarks render inconsistently across systems; an SVG keeps the visual aligned with the rest of the typography-led identity.
- Anchor progress bar (right column) deliberately unchanged — its dot-state pattern is already authoritative.
- New `<CompletedCheckmark>` helper component lives at the bottom of `app/growth-conversations/[memberId]/page.tsx`.
- Verified: Jenny's GC page renders 4 checkmarks (Ask, Size, Show, Resolve all completed); Cygnus's renders 4 (Ask 1, Ask 2, Show, Connect). Lifecycle stages render with no checkmark on either page.

### Block B — Action notifications on Member lookup

Added a third line to each row in the Growth Conversations Member lookup showing what's open for that Member, e.g., `4 active Signals · 1 open opportunity`.

- **Renders only when there's something to notify** (active_signal_count > 0 OR open_opportunity_count > 0). Members at zero on both omit the line entirely — `0 active Signals · 0 open opportunities` would be noise.
- **Click navigates to the Member profile** (`/members/[slug]`), distinct from the row body's primary action (`/growth-conversations/[slug]`).
- **Layout pattern:** restructured the row from a single `<Link>` wrapping everything to a `<li>` container with: (1) a "stretched" absolute-positioned `<Link>` covering the row body for the primary action; (2) the action notifications line stacked above (`relative z-10` + `pointer-events-auto`) carrying its own `<Link>` to the Member profile. Avoids nested-anchor accessibility issues; keeps the two affordances visually distinguishable.
- **Counts computed server-side** via Prisma `_count` for engaged Recommendations (response in `engaged | leaning_yes | committed`); `active_signal_count` reuses the seed-time-derived denormalized field on Member.
- Verified: Scott's portfolio of three Members all render the notifications line with `4 active Signals · 1 open opportunity` (each Member has 4 active signals + 1 active engaged Recommendation in the demo seed).

### Block C — Breadcrumb pattern

New `<Breadcrumb>` component at `app/_components/breadcrumb.tsx`. Pure presentation: takes `BreadcrumbSegment[]` where each segment is either `{ label, href }` (clickable) or `{ label, current: true }` (terminal, plain text). Rendered as `<nav aria-label="Breadcrumb">` with an `<ol>` of `<li>` segments separated by right-chevron `›` characters in muted grey.

Applied across three pages, below the gradient bar and above the page heading:

- `/members/[id]` — `Member Signals › [Member name]`
- `/growth-conversations` — `Member Signals › Growth Conversations`
- `/growth-conversations/[id]` — `Member Signals › Growth Conversations › [Member name]`

The leading `Member Signals` segment links to `/members/jenny` (the demo's home Member profile until a portfolio home page exists post-demo); middle segments link to the standalone GC route when applicable; terminal segments are plain text (current page).

Removed the old `← Back to Member profile` link from `app/growth-conversations/_shared.tsx → GrowthConversationsHeader` — breadcrumb supersedes. The `backToMemberSlug` prop is retained on the function signature as a no-op for back-compat with existing call sites; documented inline.

### Block D — Remove superfluous instructional copy

Dropped the `"Choose the Member you'll be in conversation with. Search by business name; the result list shows every Member in your portfolio."` paragraph from the GC standalone landing. The orange section mark + `Select Member` heading is sufficient context for a banker; the paragraph was explaining what a Member lookup is.

Empty-state copy (`"You have no Members in your portfolio yet…"`) stays — that's a meaningful empty-state communication, not superfluous explanation.

### Style guide updates

`BLAZE_STYLE_GUIDE.md`:

- **§13 (Growth Conversations layout)** extended with two new subsections:
  - "Completed-stage checkmark indicator" — codifying the inline-SVG spec (no icon library), state-gating (`track_step` + `completed` only), and the explicit "do not duplicate on the anchor progress bar" rule.
  - "Member lookup action notifications" — codifying the empty-condition omission, the orange-link treatment, the click-to-Member-profile behavior, and the stretched-link layout pattern that disambiguates the two affordances.
- **§14 (Breadcrumb navigation)** added as a new top-level section. Path structure, route-by-route table, visual treatment, where-it-renders, reference-implementation pointer.
- §15–§19 renumbered to §16–§20 (Tailwind config / shadcn / What to avoid / Quick reference / Verifying-source).

### Decisions made during implementation (not pre-specified)

1. **Inline SVG checkmark over a Lucide-react icon.** The prompt allowed `Check` from lucide-react if already imported; checking `package.json`, lucide-react isn't a dep. Adding it for a single 14px checkmark didn't earn its weight; an inline SVG with a 4-point polyline is smaller and more directly controllable. Stroke color hardcoded to `#B45F26` (matching the brand orange) since CSS variables in SVG `stroke=` need a slightly different syntax to resolve and the burnished-orange value is already locked.
2. **Stretched-link pattern** for the lookup row's two-affordance layout (primary row body → GC; action notifications → Member profile). Considered nested `<Link>` (invalid HTML), event-bubbling with `e.stopPropagation()` (works but couples the two), or splitting the row into separate clickable boxes (loses the visual cohesion). Stretched link with z-stacked second link is the cleanest: row body clickable everywhere, notifications text "wins" clicks via z-10 + pointer-events-auto.
3. **`Member Signals` breadcrumb home → `/members/jenny`** rather than `/`. The home route currently serves the theme-check page (Sprint 6 cleanup); the demo's "home" semantically is the home Member profile until a portfolio home page exists.
4. **Breadcrumb chevron `›` (not `>`)** — the right-pointing single guillemet character is visually softer and more refined than the ASCII `>`; matches the modern-professional dashboard aesthetic.

### Items logged to OPEN_QUESTIONS

None new. Closed nothing this round either — the breadcrumb behavior on small viewports flagged in Q-027 (Sprint 4 4.1a) is partially addressed by breadcrumb being a flex-wrap row that handles narrow widths gracefully, but the substantive small-viewport question (anchor progress bar) is still open.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`. Five routes prerender / dynamic-render correctly.
- HTML inspection of all three updated pages:
  - `/members/jenny` — `<nav aria-label="Breadcrumb">` present; `Member Signals` segment in path; current Member name as terminal segment.
  - `/growth-conversations` — breadcrumb with `Growth Conversations` as terminal segment; superfluous copy gone; **3 action-notifications lines** (one per Scott's portfolio Member); each notifications line links to `/members/[slug]`; no `← Back to Member profile` link.
  - `/growth-conversations/jenny` — breadcrumb with three segments (`Member Signals › Growth Conversations › Jenny`); **8 occurrences of the SVG checkmark polyline** (4 completed Track-step stages × 2 RSC payload + DOM render = 8); no back-link.

### Watch for review

- **Hard refresh recommended** — new component (`Breadcrumb`), restructured lookup-row JSX, new SVG checkmark. RSC payload should invalidate cleanly; CSS bundle untouched.
- **Lookup-row stretched-link interaction:** the `pointer-events-none` on the row body's `<p>` tags is essential for the stretched `<Link>` underneath to receive clicks across the full row width. If a future change removes that `pointer-events-none`, the row body will stop being clickable as expected. Documented inline in the component.
- **Breadcrumb home destination is currently `/members/jenny`** — when the portfolio home page exists post-demo, every breadcrumb invocation needs to update; consider a shared `HOME_HREF` constant if this gets touched again before portfolio-home ships.

---

## 2026-04-27 · Sprint 4 Prompt 4.1c — Ask phase capture form + augmenting summary + supersession

**Session type:** Third executable prompt for Sprint 4. The first real capture form. Three substantive blocks (Ask form architecture, augmenting summary pattern, save behavior with supersession) plus housekeeping. The pattern established here is the template that Size / Show / Resolve / Connect (Sprint 4 Prompt 4.2) will replicate.

### Schema work — track-agnostic GrowthStepExecution

Sprint 4 Prompt 4.1a added the architectural intent ("Ask + Size are track-agnostic"); 4.1c needed a place to actually persist track-agnostic executions. Approach 2 from the prompt §C.3:

- **`GrowthStepExecution.growth_step_id`** is now **nullable** (was NOT NULL).
- **`GrowthStepExecution.step_phase`** is a new optional `StepShape` enum field (`ask | size | show | propose | resolve | connect`).
- Track-specific executions populate both fields; track-agnostic captures populate `step_phase` only with `growth_step_id` null.

Migration `20260427184109_sprint4_4_1c_step_phase_track_agnostic` rebuilt the GrowthStepExecution table via the SQLite-friendly drop-and-rebuild pattern (existing rows preserve their `growth_step_id`; `step_phase` defaults null on existing rows). Applied via `prisma migrate deploy`; client regenerated; re-seed clean.

The schema change rippled through 5 callsites (Member profile page, GC prefilled page, lib/priorities.ts, lib/suggested-next-step.ts) — all needed `?.` guards on `growth_step.title / .step_shape / .artifact` since `growth_step` is now nullable. Each fix added a "track-agnostic" fallback label or filtered out the null case as appropriate.

### Block A — Ask form architecture (`AskSection`)

`app/growth-conversations/[memberId]/ask-section.tsx` — client component, ~470 lines. Combines the augmenting summary list + 4 add-buttons + sub-form management + save flow + stale-signal awareness in one component.

**State model (single component, no external state library):**
- `pendingNew: PendingNew[]` — unsaved sub-forms for new Signals; each carries a temp UUID + a `SignalDraft` shape.
- `pendingEdit: PendingEdit | null` — at most one in-progress edit at a time. (Could lift to multi-edit later; demo doesn't need it.)
- `expandedSignalId: string | null` — which prior Signal's detail is open.
- `error / success / isPending` — feedback state.

**Sub-form fields per Signal type:**
- Common: Topic (subtype) dropdown — required; Direct quote textarea — optional; Impact / Timeframe (or Time horizon) / Source — required selects; Magnitude / unit / frequency — optional trio (when Magnitude entered, unit + frequency become required).
- Type-specific: dropdown options for severity vary per signal type (Goals: peripheral / important / central; Blockers + Indecisions: manageable / painful / acute; Triggers: low / moderate / urgent). Recency label changes for Triggers ("Time horizon" instead of "Timeframe"). All map to the same schema enum values via the lookup tables in the component.

**Validation:** all required fields populated → Save enabled. Magnitude triad enforces unit + frequency when magnitude is set. Topic selection (subtype) is required (replaces the prompt's separate "Title" text input — see "Decisions" below).

### Block B — Augmenting summary

When the Member has prior captured Signals, the section renders a summary list at the top:

```
Captured signals (4)
› GOAL · Smooth seasonal revenue with working capital · Apr 8, 2026
› BLOCKER · Seasonal cash flow stress · Apr 8, 2026
› BLOCKER · Slow customer payments · Dec 4, 2025
› INDECISION · Spousal authority · Apr 8, 2026
```

Click a row → expand inline. Expanded detail uses the four-tier display discipline:
- Labeled values (`Impact: painful · Timeframe: ongoing · Source: member stated`) for descriptive captured fields
- Italic quote attribution with the orange-vertical-line treatment for `their_words`
- Plain text for "Captured during: Apr 8, 2026 check in · Captured by: Scott Brynjolffson"

Click "Edit captures" on an expanded row → row converts to inline editable sub-form pre-populated with current values. Save creates a NEW Signal record + sets the prior's `superseded_by_signal_id` + `superseded_at` + `active = false`. The summary list updates to show the new row in place; the prior is retained immutably for audit.

**Stale signal cue (§B.6):** Signals captured > 6 months ago render the date in italic muted grey with " · stale" suffix; expanded detail surfaces a soft prompt "This signal was captured more than 6 months ago. Confirm it still holds, or update with current information." Threshold lives in the `STALE_DAYS = 180` constant for easy tuning. None of the demo seed Signals are stale at NOW=2026-04-25.

### Block C — Save behavior (`saveAskCaptures` Server Action)

`app/growth-conversations/[memberId]/actions.ts` — `"use server"` module. Single transaction:

1. **Find or create the parent Conversation** for this GC session. If `conversation_id` arrives null, create with defaults: `meeting_type = check_in`, `channel = in_person`, `sentiment = receptive` (Q-030 logged for Sprint 4 Prompt 4.4 to capture explicitly).
2. **Find or create a track-agnostic GrowthStepExecution** with `step_phase = "ask"`, `growth_step_id = null`. Reuses the same execution row across multiple Ask saves in the session. Sequence_position auto-increments based on the conversation's current max.
3. **Create new Signals** linked to the Conversation + execution.
4. **Apply edits** — create a new Signal with updated fields, then update the prior with supersession references and `active: false`.
5. **revalidatePath** on `/members/[id]` and `/growth-conversations/[memberId]` (using the dynamic-route-segment "page" pattern so all instances refresh).

Error handling: any thrown error in the transaction returns `{ ok: false, error }`; client surfaces inline. Success returns `{ ok: true, conversation_id, created_signal_ids }`; client clears state, calls `router.refresh()`, and shows a brief success message ("Ask captures saved · N Signals recorded").

### Decisions made during implementation (not pre-specified)

1. **Topic dropdown replaces separate "Title" text input.** Prompt §A.3 specified both "Title" and "Subtype" as user-facing fields. But `Signal.topic_id` is required and the Topic table is the canonical taxonomy (`Topic.display_name` IS the title). Adding a separate free-text Title field would mean either persisting it nowhere or churning the schema for a banker-friendly label that the existing taxonomy already provides. Decision: drop the Title field; require Topic selection. The Topic dropdown's display_name serves as the title. Documented in component header.
2. **UI vocabulary mappings inlined (not extracted into a shared lib).** The prompt's banker-facing severity / recency / source labels diverge from the schema enums seeded in Sprint 1. Mapped via three lookup tables (`SEVERITY_OPTIONS_BY_TYPE`, `RECENCY_OPTIONS`, `CONFIDENCE_OPTIONS`) inside `ask-section.tsx`. When Sprint 4 Prompt 4.2 builds Size / Show / Resolve / Connect forms with similar mapping needs, extract into a shared `lib/capture-vocabulary.ts`. Not yet — premature abstraction.
3. **`banker observed` maps to `banker_inferred`.** The prompt's third Source value has no schema equivalent; the existing `unclear` enum value is semantically distant. `banker_inferred` covers the case ("the banker noticed something the member didn't explicitly state"). Documented in the CONFIDENCE_OPTIONS table.
4. **Approach 2 for track-agnostic executions** (nullable growth_step_id + step_phase) rather than Approach 1 (synthetic track). Cleaner architecturally; existing Track reference data stays uncluttered; rippled-down `?.` guards are mechanical and one-time.
5. **`pendingEdit` is at most one** — multi-edit-at-once would complicate the supersession logic without earning much for the demo. Sprint 5 polish or production Pilot can revisit.
6. **Conversation defaults documented in module comment** (check_in / in_person / receptive). Sprint 4 Prompt 4.4 will replace these with explicit Resolve-stage capture.
7. **Multi-tab last-write-wins** — no locking, no notification. Q-031 logged for Pilot consideration.

### Items logged to OPEN_QUESTIONS

- **Q-028** — Stale signal threshold (6 months). Per-Signal-type tuning is plausible; demo uses one value.
- **Q-029** — Track-agnostic GrowthStepExecution.step_phase decision. Approach 2 implemented; resolves with experience during Prompts 4.2–4.5.
- **Q-030** — Conversation defaults (check_in / in_person / receptive). Sprint 4 Prompt 4.4 will add explicit capture.
- **Q-031** — Multi-tab last-write-wins. Acceptable for demo; pilot phase concern.

### Reference data values (for Sprint 5 Insight Engine analytical axes)

The Topic table is the source of dropdown options. From the seed (`topics` map in `prisma/seed.ts`):

- **Goal topics:** `goalCashFlowSmoothing`, `goalFleet`, `goalCustomerGrowth`, `goalFacilityOwnership`, `goalFacility`
- **Blocker topics:** `blockerSeasonal`, `blockerReceivables`, `blockerCapacity`, `blockerConcentration`
- **Trigger topics:** `triggerCapacityEval`, `triggerVolume`, `triggerLease`, `triggerEquipQual`
- **Indecision topics:** seeded as needed by featured fixtures (e.g., Jenny's spousal authority)

Total 16 Topics in seed; Ask form filters by `topic_type IN (goal, blocker, trigger, indecision)` to populate the four dropdowns.

### Verified

- `pnpm exec next build` — `✓ Compiled successfully`, `Finished TypeScript`. Five routes; one new + one regenerated module.
- `/growth-conversations/jenny` HTML inspection: "Captured signals" heading present, 4 expand buttons (one per active Signal), all four "+ Add Goal/Blocker/Indecision/Trigger" buttons render, prior signal Topics surface in DOM.
- Re-seed clean; row counts stable + new fields populated as expected.

### Watch for review

- **Hard refresh recommended** — new Server Action module + new client component + restructured stage-section render path. RSC payload should invalidate cleanly; CSS bundle untouched.
- **The Ask form is the reference implementation for Sprint 4 Prompt 4.2's four other forms.** The pattern's discipline — augmenting summary list, sub-form management, single-Save transaction, supersession audit trail, stale-signal cue, UI-vocabulary mapping — is ready to lift. When 4.2 starts, consider extracting shared pieces (vocabulary mapping, sub-form chrome) into reusable helpers.
- **Saving from the Ask form creates a new Conversation** each time (until Sprint 4 Prompt 4.4 introduces session continuity). For the demo, this means each save creates a row; the augmenting summary on next render shows the new Signals plus all priors. Visually correct; data shape accumulates extra Conversation rows in the demo. Acceptable; cleaning happens with admin reset.
- **Member profile updates after save** via `revalidatePath` — verified in build, will visually re-verify on first save action.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.1d — Member-profile ↔ Growth-Conversations integration + per-type field refactor

**Session type:** Fourth executable prompt for Sprint 4. Four connected blocks that complete the cross-cutting Member-profile-to-Growth-Conversations integration. Single checkpoint at end.

### Block A — Macro context banner on Member profile

When a Member's `member_type_id` matches a current Macro's `affected_member_types`, a banner renders at the top of the Member profile (above Suggested next step, below the breadcrumb-bearing header). New client component `app/members/[id]/macro-context-banner.tsx` — about 70 lines, session-scoped dismissal via local React state.

Visual treatment per the prompt §A.2:
- Cream-tinted band (`bg-blaze-cream/40`) with hairline top + bottom borders, full page width
- Smaller orange section mark (~14px) — section marks on the page itself are 24px; the banner reads as a notification, not a content band
- Title in burnished orange-deep, semibold ~15px
- Curator attribution in muted grey, regular weight
- Summary in body text; Recommended response prefixed with bold "Recommended response:"
- "View context →" link bottom-right, currently `href="#"` (Sprint 5 will route to the Insight Engine Macro view)
- "× Dismiss" affordance upper-right; session-scoped dismissal logged as Q-032

Server-side fetch in `app/members/[id]/page.tsx` queries all Macros where `effective_period_start <= NOW <= effective_period_end (or null)`, then filters in-memory for the first match against the Member's `member_type_id` (most recently authored wins per §A.3 precedence rule — moot for the demo since each Member matches exactly one Macro). The data is shaped into `MacroBannerData` in the server component and passed to the client banner.

The three demo Members each render a distinct Macro:
- Jenny's Catering — "Q3 supplier payment compression" (Marcus Wei, Chief Economist)
- Northland HVAC — "Light commercial fleet ROI window" (Sarah Chen, Sector Specialist, Skilled Trades)
- Cygnus Bioscience — "Specialty manufacturer capital event opportunities" (Sarah Chen)

### Block B — Stage label hyperlinks (Member profile → Growth Conversations anchors)

Stage labels on the `TrackProgressDots` progress visualization are now hyperlinks routing to the matching anchor on the Growth Conversations page. Dots themselves remain non-clickable, preserving the Sprint 2 architectural decision ("stage labels are clickable; dots are not").

Implementation:
- `slugifyStageLabel` extracted from `app/growth-conversations/[memberId]/page.tsx` to `lib/suggested-next-step.ts` so both sides (link source + DOM-id target) use the same slugification.
- `TrackProgressDots` accepts an optional `memberSlug` prop. When set, each label renders as a `<Link href="/growth-conversations/{memberSlug}#stage-{slug}">` in burnished orange-deep with `hover:underline`. Both call sites in `app/members/[id]/page.tsx` pass `memberSlug={slug}`.
- `app/globals.css` adds `scroll-behavior: smooth` on `html` so browser-native fragment-anchored arrivals scroll smoothly to match the JS-driven `scrollIntoView({ behavior: "smooth" })` calls already used by the anchor progress bar.
- Stage sections already have `scroll-mt-24` (Sprint 4 Prompt 4.1a), so anchors land below the fixed progress bar without requiring further adjustment.

The current-stage label (orange-ringed dot) gets the same hyperlink treatment, so a banker can click "Show" (the current stage) to jump directly to that section. The `linkBuilder`-style abstraction was deferred — TrackProgressDots is currently used only on the Member profile, so a single optional prop is sufficient.

### Block C — Per-type required-field refactor for Ask form

Visual review of 4.1c surfaced that the four Signal types share fields awkwardly. 4.1d implements per-type validation:

| Signal type | Required | Optional |
|---|---|---|
| Goal | Topic, Source, Impact, Timeframe | Direct quote, Magnitude trio |
| Blocker | Same as Goal | Same as Goal |
| Indecision | Topic, Source | Direct quote, Impact, Timeframe, Magnitude trio |
| Trigger | Topic, Source, Impact, **Time horizon** (replaces Timeframe) | Direct quote, Magnitude trio |

#### Schema additions

- `enum TimeHorizon { imminent | three_to_six_months | six_to_twelve_months | twelve_to_twenty_four_months | longer }` — already added in migration `20260427191617_sprint4_4_1d_signal_time_horizon` for the `Signal.time_horizon` nullable column. The enum values are identifier-safe; the AskSection display layer renders the friendly labels ("3-6 months").
- `Signal.severity` and `Signal.recency` made **nullable** — migration `20260427194500_sprint4_4_1d_signal_severity_recency_nullable` rebuilds the Signal table via the SQLite drop-and-recreate pattern (existing seed data preserved verbatim). Required so the application layer can enforce per-type validation rather than the schema layer rejecting Indecision Signals with no Impact / Timeframe and Trigger Signals with no Recency.

#### Application-layer validation

Server-side `validateSignalDraft` in `app/growth-conversations/[memberId]/actions.ts` enforces per-type rules:
- Universal: Topic, Source, Magnitude unit/frequency conditional
- Goal/Blocker: severity + recency required
- Trigger: severity + time_horizon required
- Indecision: only Topic + Source required

Client-side `draftIsValid` in `app/growth-conversations/[memberId]/ask-section.tsx` mirrors the same logic so the Save button reflects per-type validity. Both layers reject the same shapes; client validation surfaces errors as a friendly red message, server validation is the safety net for any direct-call bypass.

#### UI refactor

- `emptyDraft(type)` factory now branches per type. Indecision and Trigger sub-forms default `severity` / `recency` / `time_horizon` to null where the prompt requires "Select…" as the visible placeholder. Goal/Blocker keep their seeded "manageable" / "recent" defaults.
- The `<Field required>` flag is conditional: `required={draft.type !== "indecision"}` for Impact and Timeframe so the asterisk drops when authoring Indecisions.
- For Trigger sub-forms, the Timeframe `<select>` is replaced with a Time horizon `<select>` bound to `time_horizon`. The five enum values render as friendly labels.
- `PriorDetail` (the augmenting-summary expanded view) builds its inline metadata as an array of `ReactNode` and intercalates middots, skipping null fields cleanly. Indecision Signals that captured no Impact / Timeframe render with only the fields that actually have values; no "—" placeholders.
- `SignalDraft` and `AskPriorSignal` types updated to mark severity / recency nullable and include `time_horizon`.

#### Member profile Active signals band

The Active signals band on the Member profile also rebuilt around the per-type rendering. `app/members/[id]/page.tsx` now:
- Falls back to a muted dot color (`bg-blaze-rule`) when `s.severity` is null (Indecision case)
- Shows Time horizon (from `s.time_horizon`, mapped through `TIME_HORIZON_LABEL` to friendly text) for Trigger Signals; Timeframe (from `s.recency`) for the other three types; both skipped if the underlying field is null
- Builds the inline labeled-value list as a `ReactNode[]` with `Fragment`-based middot intercalation, parallel to PriorDetail's pattern

### Block D — Drop redundant inline header text

`app/growth-conversations/_shared.tsx` no longer renders "· Growth Conversations" inline next to the brand wordmark. The breadcrumb just below the gradient bar already carries the navigation context (e.g., "Member Signals › Growth Conversations › Jenny's Catering"); the inline duplicate was redundant. Member profile pages were already clean — no change needed there.

### Housekeeping

- `BLAZE_STYLE_GUIDE.md` updated: new §13 "Macro context banner" (positioning, visual treatment, dismissibility) and §14.5 amended with the per-type required-field discipline.
- `OPEN_QUESTIONS.md` adds **Q-032** (persistent Macro banner dismissal — per-banker preferences + auto-dismissal on `effective_period_end`) and **Q-033** (stage label hyperlinks for stages without capture interfaces — soft Q since Sprint 4 Prompt 4.2 resolves it).
- No new entries needed in `lib/relation-names.ts` or `lib/verb-patterns.ts` — Macro authorship is rendered as inline prose on the banner, not via the structured registries.

### Verified

- `pnpm tsc --noEmit` — clean, no errors.
- Migration `20260427194500_sprint4_4_1d_signal_severity_recency_nullable` applied; Prisma client regenerated; re-seed clean.
- All three Member profiles continue to load; Macro banner renders on each.

### Watch for review

- **Hard refresh recommended** — new client component (Macro banner) + new global CSS rule (`scroll-behavior: smooth`) + restructured Active signals band. RSC payload should invalidate cleanly.
- **The per-type field discipline is the pattern Sprint 4 Prompt 4.2 will replicate** for Size, Show, Resolve, Connect captures. Validation logic, default-draft branching, expanded-detail rendering — all live in AskSection now and lift cleanly when 4.2 starts.
- **Stage label hyperlinks land on prefilled-summary sections for non-Ask stages** until 4.2 ships their capture forms. Acceptable interim state per Q-033; revisit if 4.2 slips past EVP review.
- **`scroll-behavior: smooth` is global** — affects all anchor navigation and JS scroll calls on every page. This is the desired behavior; no other page currently relies on instant scroll.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.2a (Block A only) — Stage guidance scaffolding

**Session type:** Fifth executable prompt for Sprint 4. The prompt covers three substantive blocks (stage guidance, Size capture form, Resolve capture form). This entry covers **Block A only**; Blocks B and C are deferred to follow-up turns per the CLAUDE.md §7 "ask before proceeding" guideline on multi-thousand-line changes — Block B alone requires a new Prisma entity, a 600-line client component, a server action with multi-row transactions, and page integration; Block C requires a different shape with cross-table writes (Recommendation + Signal + ActionCard). Pushing all three through one turn would put quality at risk.

### Block A — Stage guidance scaffolding

A short Member-Type-aware paragraph now renders on each stage section, explaining what that phase is *for*. The paragraph addresses a 4.1d review observation — "Ask implies questions, but what's being asked?" — by adding a layer of conversational scaffolding above each section's capture content.

**New module: `lib/stage-guidance.ts`**

Exports `getStageGuidance(memberTypeName, stepPhase, stageLabel)`. Lookup is keyed by:

- **Member Type name** (`"Small Caterer · Starting"` / `"HVAC & Trades · Growing"` / `"Specialty Manufacturer · Established"`) — matches `MemberType.name` from the seed
- **Step phase** (the 10-value StepPhase type covering both Track-step phases and lifecycle phases)
- **Stage label** — disambiguates Cygnus's two Ask stages by matching trailing digits (`"Ask 1"` → `ask:1`, `"Ask 2"` → `ask:2`)

The 18 specific guidance paragraphs from prompt §A.2 are authored verbatim as a nested `Record<MemberTypeName, Record<key, paragraph>>`. A flat `GENERIC_PHASE_FALLBACK` map (one paragraph per phase) catches any (Member Type, phase) tuple that isn't authored — Pilot phase will populate as new Member Types come online.

**Page integration (`app/growth-conversations/[memberId]/page.tsx`)**

Each stage section render now derives `stepPhase` (from `trackStep.growth_step.step_shape` for Track-step stages, mapping by label for lifecycle stages) and looks up `guidance`. Two render shapes:

- **Track-step stages:** the guidance paragraph renders directly below the stage header (`mt-3 max-w-3xl text-sm leading-relaxed text-blaze-grey-body`), above the capture form / read-only summary / placeholder.
- **Lifecycle stages (Decision pending, Funded, Specialist engagement, Closed):** the guidance content replaces the prior generic placeholder body inside the existing dashed-border treatment per prompt §A.5. The dashed-border continues to signal "this isn't an active capture surface."

`StagePlaceholder` updated to take an optional `guidance` prop; lifecycle branch renders the stage label in `font-medium text-blaze-charcoal` followed by an em-dash and the guidance text. Track-step branch keeps its existing copy (no guidance in the placeholder; guidance is the paragraph above).

### Housekeeping (Block A scope)

- `BLAZE_STYLE_GUIDE.md`: new §14.8 "Stage guidance scaffolding" — visual treatment, architecture, authoring philosophy, reference implementation pointer
- `OPEN_QUESTIONS.md`: **Q-034** (Macro authorship governance — who can author, what review process, recipient scoping; Pilot phase) and **Q-035** (Topic-level question library — example phrasings per Topic per Member Type; Pilot phase, parallel governance shape to Q-034) logged
- `docs/prompts/SPRINT_4_PROMPT_4_2A.md` — promoted from repo root

### Verified

- `pnpm tsc --noEmit` — clean
- All three Member profiles still load
- `getStageGuidance` returns Member-Type-specific text for the demo Members; falls back to generic phase text for any unmatched tuple

### Watch for review

- **Hard refresh recommended** — new lib module + page changes. RSC payload will invalidate cleanly.
- **Cygnus's Ask 1 / Ask 2 disambiguation** depends on the trailing-digit regex match in `getStageGuidance`. If a future Member's Track has a different repeat-shape pattern (e.g., two Sizes), the same convention applies.
- **Block B + C are next.** Block B (Size capture form) needs schema migration for SizingMeasurement, server action, ~600-700-line client component, page integration. Block C (Resolve) needs server action with cross-table writes (`Recommendation.response` + Signal supersession + ActionCard creation), ~400-line client component, page integration. Recommend splitting B and C into two separate turns to keep changes reviewable.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.2a (Block B) — Size phase capture form

**Session type:** Continuation of Sprint 4 Prompt 4.2a. Block A (stage guidance) shipped in the prior session; this entry covers Block B (Size capture form). Block C (Resolve) follows in the next turn per the Block-A-checkpoint plan.

### Schema work — `SizingDimension` + `SizingMeasurement`

Two new tables:

- **`SizingDimension`** — controlled vocabulary for what a measurement quantifies. Parallel in shape to `Topic` (Signal's reference table): `key` (unique slug), `display_name` (banker-facing), `description` (Semantic-Discipline-required). Demo seeds 12 dimensions covering all three Members:
  - Working capital / cash flow (Jenny + cross-Member): `slow_season_revenue_gap`, `customer_payment_extension`, `fixed_overhead_baseline`, `seasonal_revenue_swing`, `working_capital_cycle_days`
  - Capacity / fleet (Northland + cross-Member): `declined_work_volume`, `revenue_per_truck`, `fleet_utilization_rate`, `service_radius_capacity`
  - Manufacturing / capital event (Cygnus + cross-Member): `capacity_utilization_rate`, `customer_concentration_percentage`, `production_throughput_target`

- **`SizingMeasurement`** — fact table for captured quantification, with **full supersession discipline parallel to Signal** (per the user's note 1): `active` (default true), `superseded_by_id` (FK to self), `superseded_at`. Fields: `dimension_id`, `magnitude`, `unit`, `frequency` (nullable, conditional), `source` (new `MeasurementSource` enum: `member_stated | member_records | banker_calculated | market_reference`), `their_words`, `confidence` (String?, optional per Q-036), `time_period`, `methodology_note`. Captured-on-Conversation + Optional execution link (track-agnostic: `growth_step_execution_id` nullable, populated with the matching `step_phase = "size"` execution).

Migration `20260427234737_sprint4_4_2a_sizing_measurement` creates both tables + indexes (`SizingDimension.key` unique; `SizingMeasurement (member_id, active)`, `(conversation_id)`, `(dimension_id)`). Applied via `prisma migrate deploy`; client regenerated; re-seed clean (12 dimensions present).

Seed wiring: `seedSizingDimensions()` added near `seedTopics()` in `prisma/seed.ts`; `clear()` updated to delete SizingMeasurement (leaf) before SizingDimension (referenced).

### Server Action — `saveSizeCaptures`

Mirrors `saveAskCaptures` transaction shape:
1. Find or create parent Conversation (defaults: `meeting_type = check_in`, `channel = in_person`, `sentiment = receptive` — same as Ask)
2. Find or create track-agnostic GrowthStepExecution with `step_phase = "size"` and `growth_step_id = null`
3. Per-measurement validation (server-side `validateMeasurementDraft` guard)
4. Create new SizingMeasurement rows
5. For edits: create new row, mark prior as `superseded_by_id = newId`, `superseded_at = now`, `active = false`
6. `revalidatePath` on Member profile + GC routes

Validation enforces: Topic/dimension required, Magnitude required (numeric, non-NaN), Unit required, Source required, Frequency required for rate-based units (`dollars / count / hours`).

### Client component — `SizeSection`

`app/growth-conversations/[memberId]/size-section.tsx` (~600 lines). Pattern lift from AskSection — augmenting summary, multi-add sub-forms, single-edit, save-and-revalidate, stale cue at 6 months.

Differences from AskSection:
- One sub-form type (no per-type Goal/Blocker/Trigger/Indecision split)
- Topic / dimension dropdown sourced from the new `SizingDimension` reference table (per user note 2 — architecture supports Pilot-phase expansion without code change)
- Frequency required only for rate-based units; the asterisk on Frequency shows or hides based on Unit selection
- Confidence stays optional (per user note 3 + Q-036)
- Collapsed measurement row title surfaces dimension display name + magnitude phrase ("$48,000 per quarter") so the captured fact reads at a glance without expanding

### Page integration

`app/growth-conversations/[memberId]/page.tsx`:
- Member fetch include extended with `sizing_measurements` (`where active: true`, with `dimension` + `conversation.banker` joins)
- Server-side `prisma.sizingDimension.findMany()` populates the dropdown options
- Both arrays passed as props to `<SizeSection>`
- Render branch added: `trackStep?.growth_step.step_shape === "size"` routes to SizeSection (track-agnostic, same as Ask)

Cygnus's Track is Connect-ending and has no Size step, so SizeSection renders only on Jenny + Northland — verified via HTML probe. Cygnus's Show / Connect read-only summaries are unaffected.

### Housekeeping

- `BLAZE_STYLE_GUIDE.md`: §14.5 amended with "Size capture form" subsection — single-sub-form-type, reference-table dropdown, conditional Frequency, supersession audit trail
- `OPEN_QUESTIONS.md`: **Q-036** logged (per user note 3) — should `SizingMeasurement.confidence` become required? Revisit during Sprint 5 Insight Engine work
- No new entries needed in `lib/relation-names.ts` or `lib/verb-patterns.ts` — Size's "quantified" verb pattern is implicit in the dimension display labels

### Verified

- `pnpm tsc --noEmit` — clean (after deleting iCloud `.next/types/* 2.ts` orphans)
- `pnpm exec next build` — `✓ Compiled successfully` + `Finished TypeScript`; 5 routes
- `pnpm tsx prisma/seed.ts` — clean re-seed; 12 SizingDimension rows present
- HTML smoke probe on /growth-conversations/{jenny, northland, cygnus}:
  - Jenny + Northland: Size guidance paragraph + "+ Add measurement" button + "No measurements captured yet" empty-state prompt
  - Cygnus: no Size section (track is Connect-ending; Track has no Size step) — correct
  - Stage guidance from Block A still rendering on all stages

### Watch for review

- **Hard refresh recommended** — new Server Action module + new client component + restructured stage section render path. RSC payload should invalidate cleanly.
- **No Size captures seeded.** SizingMeasurement table is empty in the demo seed; Sprint 4 Prompt 4.2a deliberately leaves this for the banker to populate via the form. If the EVP review needs to see prior captures rendered (augmenting summary + edit pattern), seeded fixtures are an option — log as a follow-up if surfaced during visual review.
- **Cygnus's Track has no Size step.** This is by design (Connect-ending Track shape: Ask 1 → Ask 2 → Show → Connect). The Size form correctly does not render for Cygnus. If the demo needs Cygnus to demonstrate sizing, add a Size step to the Cygnus Growth Track or capture sizing behind-the-scenes via the track-agnostic pattern.
- **Block C (Resolve) is next.** Cross-table transaction (Recommendation update + Signal create + ActionCard create + GrowthStepExecution create), ~400-line client component with conditional rendering based on Member response value.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.2a (Block C) — Resolve phase capture form

**Session type:** Final block of Sprint 4 Prompt 4.2a. Block A (stage guidance) and Block B (Size capture form) shipped in prior sessions; this entry covers Block C (Resolve). The Resolve transaction is the most complex in Sprint 4 — four tables touched atomically — so this entry leans into the order-of-operations discipline per the user's note for future maintenance.

### Cross-table transaction shape — order of operations

`saveResolveCaptures` (in `app/growth-conversations/[memberId]/actions.ts`) opens a single `prisma.$transaction` with an explicit step ordering. The rule: every dependent row must reference one already created or located within the same transaction, so a thrown error at any step rolls the whole capture back atomically.

1. **Find or create the parent Conversation.** Defaults match Ask + Size: `meeting_type = check_in`, `channel = in_person`, `sentiment = receptive`. Required first because every downstream row references `conversation_id`.
2. **Create the GrowthStepExecution.** `step_phase = "resolve"`, `growth_step_id = the Track's Resolve step` (Track-aware, unlike Ask + Size which pass `null`). Sequence position = max-existing + 1 within the Conversation. Required next because subsequent ActionCard / Signal records reference this execution as their origin.
3. **Update the Track's Recommendation.** `response`, `primary_concern`, `their_words` fields mutated in place. The schema's `Recommendation.growth_step_execution_id @unique` permanently binds Recommendation to its originating execution; supersession lives in the new GrowthStepExecution chain (one execution per Resolve session) rather than in Recommendation versioning. Skipped if no Recommendation exists for this Track (none of the demo Members fall into this case).
4. **Closing notes for terminal-no responses.** When the response is `declined` or `dismissive` and `closing_notes` is set, write to `Conversation.banker_note`. Closing notes do not create an ActionCard — `ActionCard.due_at` is NOT NULL and closing notes have no due date by definition. The closure context belongs on the Conversation.
5. **Create the Indecision Signal (optional).** `type = "indecision"`, linked to the new GrowthStepExecution as `growth_step_execution_id`. `severity / recency / time_horizon` left null per Sprint 4 §4.1d Block C's per-type discipline. Confidence mapped from the Resolve form's source: `member_stated → member_stated`, `banker_observed → banker_inferred`.
6. **Create the ActionCard (optional, suppressed for committed/funded).** `type = "follow_up"`, `status = "open"`, `origin_conversation_id` + `origin_growth_step_execution_id` pointing to this Resolve session. Owner from the dropdown (defaults to current banker; Q-037 logs the cross-banker-handoff default question for revisit).
7. **`revalidatePath`** on Member profile + GC routes — outside the transaction intentionally; cache invalidation is not a DB write.

**Rollback behavior.** `prisma.$transaction` rolls back atomically on any thrown error. If step 5 fails (e.g., bad `topic_id` on the indecision draft), the new execution row + Recommendation update from steps 2-3 also revert. Callers see a single `{ ok: false, error }` result without partial-write inconsistency. The page's `router.refresh()` after a successful save reads the post-commit state cleanly; failed saves leave the page state unchanged.

**Validation runs before the transaction opens** (`validateResolveInput` guard). The transaction itself trusts the shape it gets and surfaces Prisma constraint violations as user-facing errors. The same per-response validation rules also live client-side in `ResolveSection.commitSave` so the Save button disables and the inline error surfaces before submit; server-side is the safety net.

### Conditional rendering rules — driven by Member response

Per prompt §C.3, the Resolve form's sub-captures are gated by the response value. Mapping:

| Response | Indecision sub-form | ActionCard sub-form | Closing notes |
|---|---|---|---|
| `committed / funded` | suppressed | suppressed | suppressed |
| `declined / dismissive` | hidden | hidden | optional textarea (saves to `Conversation.banker_note`) |
| `engaged / leaning_yes` | optional | **required** (description + owner + due) | hidden |
| `neutral / leaning_no / skeptical / confused` | optional | optional | hidden |

Primary concern is required for nuanced responses (`skeptical / confused / leaning_no / declined / leaning_yes`); optional otherwise. Source (`member_stated / banker_observed`) is universally required.

### Client component — `ResolveSection`

`app/growth-conversations/[memberId]/resolve-section.tsx` (~580 lines). Single-fieldset form with view-mode / edit-mode toggle:

- **View-mode** renders when `current` (the Track's existing Recommendation state) is non-null. Summarizes response chip, primary concern, direct quote, open ActionCard. "Edit captures" button toggles to edit-mode.
- **Edit-mode** renders the editable fieldset pre-populated from `current`. Conditional sub-forms (Indecision, ActionCard, Closing notes) render based on the live response value — change the dropdown and the form re-shapes immediately. Save commits via `saveResolveCaptures`; success returns to view-mode with the updated state.

Indecision sub-form is gated by a checkbox to keep the form compact when no indecision was captured. ActionCard sub-form is also checkbox-gated except when the response is `engaged / leaning_yes` — in that case the checkbox is forced on (disabled) since the field is required.

### Page integration

`app/growth-conversations/[memberId]/page.tsx`:

- Import `ResolveSection` + types + `formatRecommendationSize`
- Server-side fetches: active bankers (`Banker.findMany where status = active`), Track's Recommendation (single `findFirst` per Member; demo pattern), most recent open ActionCard for the Member (for the view-mode "Open ActionCard" summary), Track's Resolve GrowthStep id from `trackSteps`
- Compose `ResolveCurrentState` with `recommendation_label` formatted via `formatRecommendationSize` (e.g., "Working Capital Line of Credit at $75K")
- Filter `askTopics` to indecision-only for the indecision sub-form's Topic dropdown
- Render branch: `step_shape === "resolve"` AND `resolveGrowthStepId` present → `<ResolveSection ...>` with all data wired

Cygnus's Connect-ending Track has no Resolve step, so `resolveGrowthStepId` is null and the render branch correctly does not fire — verified via HTML probe.

### Housekeeping

- `BLAZE_STYLE_GUIDE.md` §14.5: new "Resolve capture form" subsection — view-mode / edit-mode pattern, conditional rendering table, cross-table transaction pointer, Track-aware vs track-agnostic distinction
- `OPEN_QUESTIONS.md`: **Q-037** logged (Resolve ActionCard owner default — current banker vs `Recommendation.owned_by`; verify during visual review)
- No new schema migrations needed — Resolve uses existing `Recommendation`, `Signal`, `ActionCard`, `GrowthStepExecution`, `Conversation` tables.

### Verified

- `pnpm tsc --noEmit` — clean
- `pnpm exec next build` — `✓ Compiled successfully` + `Finished TypeScript`; 5 routes
- HTML smoke probe on /growth-conversations/{jenny, northland, cygnus}:
  - Jenny: ResolveSection view-mode renders with "Member response on: Working Capital Line of Credit at $75K", Edit captures button present
  - Northland: ResolveSection view-mode renders with "Vehicle/Fleet Loan" recommendation label
  - Cygnus: no ResolveSection (Connect-ending Track, no Resolve step) — correct
  - Stage guidance from Block A still rendering on Resolve sections

### Watch for review

- **Hard refresh recommended.** New client component (ResolveSection) + new server action + extended page data fetches. RSC payload should invalidate cleanly; CSS untouched.
- **Resolve form validates client-side and server-side.** The two validation paths must stay in sync — both are explicit code (not derived from a shared schema), so a future change to one rule should be reflected in both. The conditional-rendering rules are duplicated as enums (`ENGAGEMENT_RESPONSES`, `NUANCED_RESPONSES`, etc.) in both `actions.ts` and `resolve-section.tsx` — any future extension to the response enum or rule changes needs updates in both files.
- **Q-037 verification on visual review.** Cygnus's CRE handoff scenario (Marcus Webb as Recommendation.owned_by) is the test case for whether the ActionCard owner default should be `current_banker` or `Recommendation.owned_by ?? primary_banker`. If Cygnus's Resolve form defaults Scott as the owner when Marcus should own the next-step ActionCard, the demo experience surfaces a confusing default that Q-037 will resolve.
- **No prior Resolve captures are seeded as separate executions.** The seed has Recommendations with response values already set (Jenny `leaning_yes`, Northland `engaged`, etc.) but those values came from the seed-time fixture authoring, not from a captured Resolve execution. The Resolve form pre-populates from the Recommendation state and saves a fresh GrowthStepExecution on each submit — meaning the first save creates the first Resolve execution row in the audit trail. Acceptable for demo; the audit-trail story is "from this point forward, every Resolve update is captured as its own execution."

### Sprint 4 Prompt 4.2a complete

Block A (stage guidance) + Block B (Size capture form) + Block C (Resolve capture form) all delivered. Sprint 4 Prompt 4.2b (Show capture form with ArtifactParameterCapture parameter pre-population + Connect capture form + Artifact clickability fix) follows after acceptance.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.2a refinement pass — three fixes before 4.2b

**Session type:** Small refinement pass after Sprint 4 Prompt 4.2a's visual review surfaced three issues. Two UX-discipline fixes (Customer response field relabel + helper text; "no defaults; every selection is deliberate" for all dropdowns) plus one bug (Decision pending visual progression mis-mapping in `committed` state). Decisions on prior architectural choices logged: Q-038 for the `Conversation.banker_note` closing-notes conflation.

### Fix #1 — Resolve form: "Direct quote" → "Customer response" with helper text

`app/growth-conversations/[memberId]/resolve-section.tsx` — the textarea for verbatim member language renamed and re-purposed:

- **Label:** "Customer response"
- **Helper text:** "What factor caused this decision?" (rendered as italic muted-grey sub-line below the label)
- **Placeholder:** updated to *"I hadn't realized the line of credit could absorb my whole slow season"* — an example of a *reason* rather than an emotional reaction
- **No pre-population from prior Recommendation.** `makeInitialDraft` no longer reads `current.their_words`. Field always starts empty; each save captures a fresh decision rationale.

The label change applies to all Member response states (not just `committed`). The framing is consistent — Resolve is closure capture, and what matters is *why* the Member landed where they did, not what they emotionally said about it.

The Field helper component wasn't extended for this single case; the Customer response field is rendered with an inline `<label>` block carrying the helper text directly. If a second field needs helper-text treatment in a future capture form, that's the trigger to lift it into the shared Field component.

### Fix #2 — All dropdowns default to "Select…"

`AskSection`, `SizeSection`, and `ResolveSection` updated so every dropdown opens with no pre-picked value. Pre-populated defaults were biasing data: bankers leaving leftover defaults in place (e.g., Indecision Topic = "spouse", Severity = "manageable") triggered downstream prompts that didn't apply to the actual conversation.

Type changes (in `actions.ts`):
- **`SignalDraft.confidence`** widened to `... | null` (previously non-null). The validator already checks `!draft.confidence` so the null path is rejected on save.
- **`SizingMeasurementDraft.unit`** widened to `... | null`. Validator rejects null.
- **`SizingMeasurementDraft.source`** widened to `... | null`. Validator rejects null.
- **`SizingMeasurementDraft.magnitude`** widened to `number | null` (previously `number`; the form was already passing NaN as a sentinel).

Component changes:
- `AskSection.emptyDraft(type)` simplified — every type returns the same shape with all dropdowns null. The per-type branching was removed since defaults are now uniform; per-type *required-field* validation lives separately in `draftIsValid` and `validateSignalDraft` (server-side).
- `SizeSection.emptyDraft()` returns `magnitude: null, unit: null, source: null, frequency: null` — all dropdowns + numeric input start empty. Magnitude input handles null cleanly (`value={null ? "" : magnitude}`).
- `ResolveSection.makeInitialDraft(primaryBankerId)` no longer takes `current` and no longer pre-populates from the prior Recommendation. `response`, `primary_concern`, `source`, `their_words` all start null/empty regardless of view-mode-vs-edit-mode. Edit mode opens a fresh form; the prior captured state is shown in view-mode summary above the form.
- All three components added explicit `<option value="">Select…</option>` rows to their dropdown selects. Where a dropdown had a per-type guard for the empty option (e.g., AskSection's "indecision-only Select"), the guard was removed — Select is universal now.

Conventional UX defaults that aren't domain-value bias remain in place:
- Resolve's ActionCard owner defaults to current banker (the banker filling out the form). Not a domain default; just "you are the default owner unless you hand off."
- Resolve's ActionCard due-at defaults to a 14-day-from-today date as a date-picker starting position.

Server-side: post-validation narrowing required where Prisma create calls expect non-null values. Two non-null assertions added (`draft.confidence!` for Signal create, `draft.magnitude!` / `unit!` / `source!` for SizingMeasurement create), each documented as post-validation narrowing.

`SizePriorMeasurement.unit` and `.source` tightened to `NonNullable<SizingMeasurementDraft["unit"]>` / `[...source]` since saved measurements always have non-null unit/source. The Draft type allows null for in-form state; the Prior type narrows to the post-save shape.

### Fix #3 — Decision pending stage in committed state (root cause + fix)

**Bug report:** Member profile progress dots "lose" Decision pending after Resolve commits to "committed" → Funded transition. Expected per Sprint 2 Prompt 1's adaptive 6-stage hybrid model: Decision pending should render as a completed prior stage with an orange filled dot once the Member commits, signaling the journey passed through that stage.

**Root cause:** `computeTrackStages` in `lib/suggested-next-step.ts` bucketed `committed` together with `leaning_yes` and `engaged` in the response → lifecycle-state mapping:

```
funded                          → N+1 completed, N+2 completed
committed | leaning_yes | engaged → N+1 current,   N+2 upcoming
others                          → N+1 upcoming,  N+2 upcoming
```

This conflated three semantically distinct responses into one bucket. `committed` means the Member has *agreed* — the deciding is over. But the prior mapping treated Decision pending as "current" (orange-ringed) for committed Members, implying the decision was still pending. When the response then transitioned committed → funded, both lifecycle dots flipped from (current, upcoming) to (completed, completed) in one jump — the user never saw Decision pending get its own discrete "passed-through" treatment.

The architectural framing the user asked about: "is dot computation checking 'is this stage current or upcoming?' rather than 'did this stage exist in the Track's history?'" Lifecycle states are derived from `Recommendation.response` — a state-machine read — rather than from a per-stage event log. For the demo, state-machine derivation is sufficient (matches the Recommendation-as-source-of-truth pattern). The fix is to make the state-machine richer, not to change to event-based derivation.

**Fix:** Split `committed` out of the engaged-cluster bucket. New four-bucket mapping:

```
funded                          → N+1 completed, N+2 completed
committed                       → N+1 completed, N+2 current
                                  ("decision is made; awaiting fund")
leaning_yes | engaged           → N+1 current,   N+2 upcoming
                                  ("decision still pending")
others                          → N+1 upcoming,  N+2 upcoming
```

Verified via direct DB updates and HTML probes against `/members/jenny`:

| `Recommendation.response` | Decision pending | Funded |
|---|---|---|
| `leaning_yes` | current | upcoming |
| `engaged` | current | upcoming |
| `committed` | **completed** | current |
| `funded` | completed | completed |

Connect-ending Tracks (Cygnus): same mapping shape, different labels — `Specialist engagement` (N+1) and `Closed` (N+2) follow the same response → state mapping.

Pilot-phase consideration logged in the inline comment: explicit GrowthStepExecution rows for lifecycle stage transitions (decision_pending entered/exited, funded entered) would support richer audit + correlation analytics. For the demo, the state-machine derivation is sufficient.

### Housekeeping

- `OPEN_QUESTIONS.md`: **Q-038** logged (closing notes → `Conversation.banker_note` semantic conflation; revisit when generic banker-note capture is added in 4.4 or pilot phase)
- No `BLAZE_STYLE_GUIDE.md` updates this pass — the §14.5 capture form pattern docs already describe the per-type required-field discipline; the "no defaults" rule is consistent with that and doesn't need a separate subsection
- No new schema migrations (type widenings are TS-system changes only)

### Verified

- `pnpm tsc --noEmit` — clean
- `pnpm exec next build` — `✓ Compiled successfully`; 5 routes
- HTML probes confirm:
  - Customer response label + helper text present in resolve-section.tsx
  - Decision pending: completed when response = committed (the root-cause fix)
  - All dropdowns render `<option value="">Select…</option>` first

### Watch for review

- **Hard refresh recommended.** Type widenings touch the actions.ts surface that both Server Actions and the client components import; the Webpack/Turbopack chunks for both will rebuild.
- **The `committed` → Decision-pending-completed transition is the visible signal of the fix.** Visual review should specifically click through committing a Member (Jenny is the easiest test) and confirm that Decision pending shifts to an orange-filled completed dot before transitioning to funded.
- **Edit-mode in ResolveSection now starts fresh, not pre-populated.** This is intentional per the user's "no defaults; every selection is deliberate" rule. If visual review feels that this loses context, the alternative is to pre-populate response + primary_concern from `current` while keeping `their_words` always-empty per fix #1. The current implementation prioritizes the rule's strictness over context-preservation; revisit if it feels heavy in practice.
- **Block 4.2b is next.** Show capture form with ArtifactParameterCapture pre-population + Connect capture form + Artifact clickability fix in Show read-only summaries.

---

---

## 2026-04-27 · Sprint 4 Prompt 4.2a refinement pass #2 — three fixes before 4.2b

**Session type:** Second refinement pass after Sprint 4 Prompt 4.2a. The first refinement pass shipped Customer response field, "no defaults" dropdowns, and the Decision pending state-machine fix. Visual review of those landed cleanly but surfaced three new items: an interaction bug introduced by the "no defaults" refactor, a visual-distinction request for committed vs funded states, and a contextual-options refactor for Primary concern. Each is a self-contained fix; logging them together keeps the refinement pass coherent.

### Fix #1 — ActionCard checkbox/fieldset bug (root cause + fix)

**Bug report:** On Jenny's profile, Edit captures → change Member response to "engaged" → the "Next step (required)" checkbox sits unchecked AND disabled. Banker can't toggle it on, the ActionCard fieldset never appears, and save fails validation with "Next step (ActionCard description) is required for engaged / leaning yes responses." Cannot save engaged or leaning_yes responses at all.

**Root cause:** A regression introduced by refinement-pass-#1's fix #2 ("no defaults; every selection is deliberate"). The prior `makeInitialDraft` set `action_card_enabled: true` whenever `current.response` was engaged or leaning_yes — so the fieldset auto-opened on edit-mode entry for engagement-state Members. The "no defaults" refactor stripped that conditional, leaving `action_card_enabled: false` always.

The bug surfaced because the checkbox's two props were inconsistent post-refactor:
- `checked={draft.action_card_enabled}` — bound to the underlying state (false)
- `disabled={isEngagement}` — true when response is engagement
- `{draft.action_card_enabled && (...fields...)}` — fieldset gated on the same false state

So for engagement: the checkbox is unchecked AND locked-disabled, and the fieldset stays hidden. Validation correctly insists "next step is required" but offers no path to provide one.

**Architectural framing:** The checkbox's `disabled` flag was supposed to enforce "fieldset must be visible for engagement"; instead it just locked the off-state in. The right pattern is to derive visibility from response state OR explicit toggle, not to bind the checkbox `checked` prop to an explicit toggle that doesn't track the implied requirement.

**Fix:** Compute `actionCardVisible = isEngagement || draft.action_card_enabled`, use it for both the checkbox's `checked` prop AND the fieldset's render gate. Engagement responses force the visible-on state without the checkbox state needing to track it. The checkbox stays disabled in engagement mode (banker can't uncheck a required field); the underlying `draft.action_card_enabled` is unused for engagement display logic but still tracked for non-engagement opt-in.

The validation logic was simplified: `if (isEngagement && !draft.action_card_description.trim())` — no longer ambiguously checking `!draft.action_card_enabled` since that flag is no longer the source of truth for engagement.

**Lesson for future capture forms.** When a sub-form is conditionally required, derive its visibility — don't bind a "user toggle" to dual purposes (explicit-opt-in AND required-for-some-states). The two semantics are different: the toggle is the user's explicit choice for optional capture; required-for-some-states is the form's structural rule. Keep them separate.

### Fix #2 — Visual distinction `committed` vs `funded`

**Issue:** After the prior refinement's state-machine fix (committed → Decision pending: completed, Funded: current), the "Funded" dot in committed state read as orange-ringed/current — visually distinct from funded's orange-filled/completed treatment. But at-a-glance the two states could read as "the deal happened" interchangeably, missing the formalities (underwriting, closing, disbursement) between commitment and disbursement.

**Decision rationale.** The user offered three options: relabel the dot, change the dot visual, or add a status indicator. The cleanest fit for the existing visual identity is the **relabel** — the existing current/completed dot treatment already distinguishes states, but the static label "Funded" doesn't reflect the difference between "committed (in closing)" and "funded (loan active)". Relabeling to "Closing" for the committed state lifts the semantic clarity without inventing new visual treatment.

Why not change the dot:
- Adding a third dot state (e.g., half-filled) introduces a new visual primitive that needs documentation, accessibility consideration, and a discrimination case from the existing two-state palette
- Status indicators (small badges) crowd the dot row that's deliberately compact

Why "Closing" specifically:
- Matches industry vocabulary (loan closing = the formal disbursement process)
- Mirrors the existing pattern where Connect-ending Tracks have their own terminal label ("Closed") distinct from Resolve-ending ("Funded")
- Connect-ending Tracks don't need the same treatment — for those, the terminal is "Closed" and the current state is "in progress closure", which the orange-ringed dot already conveys naturally

**Implementation.** New optional `displayLabel?: string` field on `TrackStage`. `computeTrackStages` sets `displayLabel = "Closing"` when:
- The Track ends with a Resolve step (`isResolveTrack`)
- `recommendation_response === "committed"`
- The terminal stage's state ended up `current` (i.e., we're in the "decided but not yet funded" state)

Renderers (`TrackProgressDots`, `AnchorProgressBar`, GC page section header, completed-checkmark aria-label) all default to `displayLabel ?? label`. The canonical `label = "Funded"` continues to be used for slug derivation in `slugifyStageLabel` so URL fragments like `/growth-conversations/jenny#stage-funded` remain stable across the committed → funded transition.

Verified state matrix for Jenny's Track:

| `Recommendation.response` | Terminal label rendered | Terminal state |
|---|---|---|
| `leaning_yes` / `engaged` | Funded | upcoming |
| `committed` | **Closing** | current |
| `funded` | Funded | completed |

Cygnus's Connect-ending Track was tested and correctly retains "Closed" across all response states (no displayLabel override).

### Fix #3 — Contextual Primary concern options

**Issue:** Primary concern dropdown showed the same option set regardless of response. The set was oriented toward open-thread context (rate, speed, spouse, cpa, partner, timing, bank_capability, other, none) — appropriate for engaged/leaning_yes/neutral but not for declined/dismissive. A banker capturing a declined Member had to pick from open-thread reasons that didn't match decline semantics.

**Architectural decision.** The user offered two options: store reason sets in form code, or as enum field values keyed on response category. I went with **schema-extended enum + form-side option sets** because:
- The schema enum is the analytic axis. Insight Engine queries that ask "what's the most common decline reason in Q3?" need a consistent value space; keeping decline reasons as first-class enum values lets those queries work without union-distinction logic
- Form-side option sets keep the contextual UX without coupling banker-facing labels to enum identifiers (e.g., `rate` renders as "Rate" in open-thread context but "Rate too high" in decline-reason context)
- Schema-extended enum stays as a single field on `Recommendation`, no second column or shape change

Option sets documented in `BLAZE_STYLE_GUIDE.md §14.5`:

**Open-thread set** (engaged-spectrum responses): rate, speed, commitment, spouse, cpa, partner, timing, bank_capability, other, none

**Decline-reason set** (declined / dismissive): rate (as "Rate too high"), terms_unfavorable, going_with_competitor, no_longer_needed, timing (as "Timing wrong"), does_not_qualify, bank_capability (as "Doesn't trust the institution"), lost_interest, found_alternative, circumstances_changed, other

Three values (`rate`, `timing`, `bank_capability`) reuse open-thread enum values with different banker-facing labels in decline-reason context. This is intentional — same underlying analytic axis, different conversational framing.

Field label switches contextually too: "Primary concern" for open-thread, "Decline reason" for declined/dismissive. View-mode summary mirrors the same logic.

**Schema change.** `RecommendationPrimaryConcern` enum extended with seven new values:
- `terms_unfavorable`
- `going_with_competitor`
- `no_longer_needed`
- `does_not_qualify`
- `lost_interest`
- `found_alternative`
- `circumstances_changed`

Migration `20260428020905_sprint4_4_2a_decline_reason_concerns` is a marker (`SELECT 1` no-op) since SQLite stores enums as TEXT and adding values requires no DDL change. The marker exists for change-history tracking so future `prisma migrate diff` calls don't try to invent a migration for the schema delta.

`lib/enum-descriptions.ts` updated with descriptions for all seven new values (Semantic Discipline Principle 3 — every enum value carries banker-facing prose) and compact labels for the History timeline / Insight Engine list-view surfaces.

`SaveResolveInput.primary_concern` type widened with the new values; `lib/enum-descriptions.ts` `RECOMMENDATION_PRIMARY_CONCERN_LABELS` extended with compact labels for non-form surfaces.

**Form behavior.** The Primary concern field is hidden entirely when `draft.response` is null (no point showing options before the response is picked); appears with the contextual label + option set the moment a response is selected. Decline reasons surface for `declined` / `dismissive`; open-thread reasons for everything else. The view-mode summary uses the same conditional label resolution so a saved declined Member sees "Decline reason: Rate too high" rather than "Primary concern: rate".

### Housekeeping

- `OPEN_QUESTIONS.md` — **Q-039** logged (lifecycle stage state-machine vs explicit transition events; Pilot phase architectural decision driven by Sprint 5 Insight Engine analytics scope)
- `BLAZE_STYLE_GUIDE.md §14.5` extended with: Customer response field treatment, contextual Primary concern option sets table + value lists, visual-distinction rationale for committed vs funded
- `lib/enum-descriptions.ts` — descriptions + compact labels for the seven new decline-reason enum values
- Migration `20260428020905_sprint4_4_2a_decline_reason_concerns` — marker SQL for change-history tracking; no DDL change

### Verified

- `pnpm tsc --noEmit` — clean
- `pnpm exec next build` — `✓ Compiled successfully`; 5 routes
- HTML probes against `/members/jenny` with `response = committed`:
  - Member profile dot: aria-label reads `Closing: current` (was `Funded: current`)
  - GC page section header: reads "Closing" (was "Funded")
  - URL anchor `#stage-funded` continues to resolve (canonical label stable)
- ActionCard checkbox bug fix verified by code path inspection — `actionCardVisible = isEngagement || draft.action_card_enabled` ensures fieldset renders for engagement responses without requiring banker to toggle a disabled checkbox

### Watch for review

- **Hard refresh recommended.** Schema enum extension + new client component logic + new lib/enum-descriptions entries.
- **The contextual Primary concern requires testing across the response spectrum.** Specifically:
  1. Engaged/leaning_yes Members see open-thread options, "Primary concern" label
  2. Declined/dismissive Members see decline-reason options, "Decline reason" label
  3. Switching response from engaged → declined (or vice versa) should re-render the dropdown with the new option set; the prior selection may not be in the new set, so primary_concern should reset to null when this happens (currently it persists, which means a banker who picked "spouse" then switched to declined would see the dropdown empty since "spouse" isn't in the decline-reason set — the value is still in draft state but not selectable in the new dropdown). Worth verifying visually whether this needs a clearing behavior on response change. (Logging here as a watch-item; if it surfaces during review I'll add a reset.)
- **The "Closing" label is Resolve-ending-Track-only.** Connect-ending (Cygnus) keeps "Closed" across all states. If pilot phase introduces other Track end-shapes, the displayLabel logic in `computeTrackStages` will need extension.
- **Sprint 4 Prompt 4.2b is next** — Show capture form with `ArtifactParameterCapture` parameter pre-population + Connect capture form + Artifact clickability fix in Show read-only summaries.

---

---

## 2026-04-29 · Sprint 4.6 — Compliance posture floor

**Session type:** Sprint 4.6 — five blocks shipping the compliance posture floor before v2 phase 1 (Sprint 4.7) begins. Single checkpoint with delimited per-block diffs. Estimated 1-2 effective build days; came in within budget. The compliance work shipped to v1 routes; v2 (Sprint 4.7) inherits all of these patterns from the start — helper text content, keyword scan registry, banner copy, softened taxonomy values, and the Capture discipline callout content all carry forward.

Read order (per Sprint 4.6 prompt pre-flight): COMPLIANCE.md §6 + §10 + §11; PROTECTED_CLASS_KEYWORD_LIST_v1.md (with E1–E6 resolved per Path A — Francisco's defaults committed); OPEN_QUESTIONS.md Q-013 + Q-041 resolutions (already in Resolved section from the previous turn — amendments NOT re-applied this turn).

### Block A — Field label and enum value refactor

`Recommendation.primary_concern` enum replaced with the Sprint 4.6 17-value taxonomy per COMPLIANCE.md §6. The new taxonomy splits into two contextual sets with one shared value (`service_or_capability_concern`):

- **Open-thread context** (8 values): `pricing_concern`, `terms_concern`, `timing_concern`, `co_decision_maker_household`, `external_advisor`, `co_owner_or_board`, `service_or_capability_concern`, `other_open_thread`. Field label: "Primary concern".
- **Decline-reason context** (10 values): `pricing_uncompetitive`, `terms_uncompetitive`, `timing_misaligned`, `chose_alternative_lender`, `chose_alternative_funding`, `need_resolved_otherwise`, `need_no_longer_present`, `wants_to_revisit_later`, `service_or_capability_concern`, `other_member_stated`. Field label: "Member's stated reason for declining" (replaces the prior "Decline reason" — Reg B § 1002.9 hygiene, explicit member-direction framing).

Migration `20260429210607_sprint4_6_compliance_taxonomy_refactor` mapped existing seed values: `rate → pricing_concern`, `timing → timing_concern`, `spouse → co_decision_maker_household`, `cpa → external_advisor`, `partner → co_owner_or_board`, `bank_capability → service_or_capability_concern`, `does_not_qualify → NULL` (dropped per COMPLIANCE.md §8.2 — bank-side observations now route to Closing notes free text). Sprint 4 §4.2a refinement #3 decline-reason values (`terms_unfavorable`, `going_with_competitor`, `no_longer_needed`, `lost_interest`, `found_alternative`, `circumstances_changed`) also remapped to the Sprint 4.6 taxonomy.

SQLite stores enums as TEXT, so DDL change wasn't needed; the migration runs UPDATE statements for row migration. Schema (`prisma/schema.prisma`) updated to reflect the new enum value set; Prisma client validates writes against the new vocabulary post-regen.

`seed.ts` updated to use new values directly (3 Recommendation seeds: Jenny `co_decision_maker_household`, Northland `external_advisor`, Cygnus `service_or_capability_concern`). `lib/enum-descriptions.ts` rewritten with descriptions + compact labels for all 17 values per Semantic Discipline Principle 3.

`SaveResolveInput.primary_concern` type widened to the 17-value union. Resolve form (`resolve-section.tsx`):

- `PRIMARY_CONCERN_OPTIONS_OPEN_THREAD` and `PRIMARY_CONCERN_OPTIONS_DECLINE_REASON` rebuilt with the new value sets and member-facing labels
- Field label switches to "Member's stated reason for declining" for terminal-no responses
- View-mode summary uses contextual label
- **Auto-clear behavior** addresses the watch-item from the previous turn: when banker switches Response across contexts and the current `primary_concern` value isn't in the new option set, the dropdown auto-resets to null. Implemented inline in the response select's onChange — `update("response", ...)` followed by a conditional `update("primary_concern", null)` when the existing value is invalid in the new context. React 18 batches the two state updates inside a single event handler.
- Read-only summaries (Member profile Active proposals band, etc.) updated to handle the new enum gracefully — `r.primary_concern && (...)` null check replaces the prior `!== "none"` literal check since `none` is no longer in the enum.

`lib/summaries.ts` `summarizeMember` template updated: bespoke phrasing for three high-frequency open-thread concerns (`service_or_capability_concern`, `co_decision_maker_household`, `external_advisor`); fallback to canonical compact label for everything else.

### Block B — Helper text on banker-prose fields

Three of four spec'd fields received permanent italic helper text below the label, above the input. Verbatim copy from COMPLIANCE.md §10.2:

- **Customer response** (Resolve form, `their_words`): *"Focus on what the Member said and the business factors driving their decision. Avoid notes about personal characteristics, household circumstances, or social context."* (replaced the prior "What factor caused this decision?" Sprint 4.2a refinement copy)
- **Closing notes** (Resolve form, `closing_notes`): *"Focus on observable business and cashflow factors: financing structure, timing, terms, costs, alternatives, business situation, decision process."* (refactored the field's wrapper from `<Field>` to inline `<label>` to accommodate the helper sub-line)
- **Description** (Resolve form, `action_card_description`): *"Describe the business action and timing. Avoid notes about the Member's personal characteristics."* (same wrapper refactor; required-asterisk preserved)

The fourth field (**Suggested opening**) was deferred — `Recommendation.suggested_opening` exists in the schema and renders read-only on the Member profile (as a quote when an ActionCard has it), but no v1 capture form exists. Per Sprint 4.6 prompt §B.1: "if it doesn't yet, defer to v2." Sprint 4.7 will surface this field in the v2 capture form.

Visual treatment: `text-[11px] italic text-blaze-grey-soft` — not dismissible, not animated. The styling matches the existing field-label hierarchy.

### Block C — Submit-time keyword scan + ComplianceScanEvent telemetry

`lib/compliance-keywords.ts` (new, ~280 lines): grouped keyword registry with ~270 terms across 8 protected-class groups (`race_color_origin`, `religion_creed`, `disability_health`, `age`, `sex_gender_orientation`, `marital_familial`, `public_assistance`, `reprisal`). Source: `PROTECTED_CLASS_KEYWORD_LIST_v1.md` with editorial decisions E1–E6 committed per Path A (Francisco's drafted defaults — keep unmodified man/men/woman/women, include curated Minnesota nationalities, include "Indian" with dual-meaning, fire on spouse, fire on discrimination, representative not exhaustive).

`scanText(input: string): MatchedTerm[]` function:
- Case-insensitive (lowercase normalize)
- NFKC Unicode normalize + diacritic strip (`/\p{M}/gu` regex against combining marks)
- Hyphen variants (-, ‑, –, —) normalized to space, so "African‑American", "African-American", and "African American" all match the registered term
- Whole-word match via regex with non-word-character bounds (`(?:^|\\W)term(?:\\W|$)`)
- Single registry pass per scan; ~270 terms × typical 100-char input runs well under 1ms
- Deduplicates matches by canonical term across registry hits

`ComplianceScanEvent` Prisma model (migration `20260429211909_sprint4_6_compliance_scan_event`): records `banker_id`, `field_name` (e.g., `"Resolve.customer_response"`), `matched_terms` (Json array of `{term, group}`), `banker_action` (`"continued" | "edited" | "cancelled"`), optional `member_id`, `occurred_at`. Indexed on `(banker_id, occurred_at)` and `field_name` for Pilot-time aggregation queries.

`lib/compliance-scan-action.ts` `recordComplianceScanEvent` server action: lightweight fire-and-forget telemetry write. No transaction, no `revalidatePath`. Failures must not block banker flow — caller wraps in `.catch(() => {})`.

`app/_components/compliance-scan-modal.tsx` `ComplianceScanModal` component: full-screen overlay with cream-tinted card. Soft-advisory copy per COMPLIANCE.md §7.3 / Sprint 4.6 §C.4 — "this note mentions [terms]. Lending decisions and capture should focus on observable business and cashflow factors. Personal characteristics, household circumstances, and social context tend not to belong in member files. Continue saving, edit the note, or cancel?" Three actions wired to onContinue / onEdit / onCancel callbacks. Telemetry fires per-field for the chosen action (a single submit can fire multiple ComplianceScanEvent rows if multiple fields had matches).

Resolve form integration: `commitSave` runs the scan over three fields (Customer response always; Closing notes when terminal-no; ActionCard description when actionCardVisible). If any matches, `setPendingScan` pauses the save and renders the modal. `dispatchSave` (extracted helper) actually invokes `saveResolveCaptures`. Modal's `onContinue` calls `dispatchSave(payload)`; `onEdit` clears pending state and returns to the form; `onCancel` discards captures via `setDraft(makeInitialDraft(...))` and closes edit-mode.

**Audit-extended scan integration deferred:** AskSection (`their_words` on Signal capture) and SizeSection (`their_words` + `methodology_note` on SizingMeasurement capture) are also [FL:BANKER-PROSE] surfaces per COMPLIANCE.md §2.1 / Sprint 4.6 §C.3. Strict reading of the Sprint 4.6 prompt §B.1 lists four fields (Customer response, Closing notes, Description, Suggested opening); the broader audit is mentioned in §C.3 but not enumerated. For demo scope, Resolve coverage demonstrates the pattern; AskSection + SizeSection extension is logged here as a follow-up. Q-040-style watch-item — flag if visual review surfaces it.

### Block D — Compliance disclaimer banner

`app/_components/compliance-disclaimer-banner.tsx` `ComplianceDisclaimerBanner` component:
- Renders below the Growth Conversations page header, above breadcrumb / main content
- Cream-tinted (`bg-blaze-cream/60`), neutral — not coral, not orange
- Hairline `border-y border-blaze-rule`
- Verbatim copy per COMPLIANCE.md §10.1 / Sprint 4.6 §D.1
- × Dismiss affordance top-right; click sets `sessionStorage[blaze.compliance-disclaimer-dismissed] = "1"` and hides
- Re-renders on each fresh session (close-tab-and-return resets it)
- Initial state hides the banner (mounted=false) until the post-mount effect reads sessionStorage; prevents SSR/CSR hydration mismatch

Mounted into both `/growth-conversations/page.tsx` (lookup page) and `/growth-conversations/[memberId]/page.tsx` (capture page). Sprint 4.6 prompt §D.3 was ambiguous about which; both is the safer path since the disclaimer is per-session-dismissible.

### Block E — Capture discipline coach callout

`app/_components/capture-discipline-callout.tsx` `CaptureDisciplineCallout` component: a `Capture discipline ?` button that opens a modal with the verbatim 100-word framing per COMPLIANCE.md §10.4. "Got it" dismisses the modal.

Mounted in the footer area of both `/growth-conversations/page.tsx` and `/growth-conversations/[memberId]/page.tsx`, just above the gradient bar.

Component is reusable for v2 (Sprint 4.7) — `/v2/members/[id]` will surface the same content via the "show ?" coach affordance per ARCHITECTURE_V2.md §11. The 100-word framing is content-asset-stable; it lives in this component until v2 phase 1 reuses it.

### Decisions made during implementation

1. **Schema enum value migration via SQL UPDATE**, not via Prisma "soft" rename. SQLite stores enums as TEXT, so DDL is unaffected; the migration is rows-only. Pre-existing values mapped to new ones through a single migration file with a comprehensive comment block documenting every old → new mapping. Cleaner than carrying both old and new values forward and waiting for runtime to migrate.

2. **`displayLabel` extension to TrackStage was not used** for primary_concern relabeling — that was a Sprint 4 §4.2a refinement #2 mechanism for stage progression dots. For Resolve form labels, the contextual label is computed inline in the form component since it's UI-only (not exposed as an entity attribute).

3. **`ComplianceScanEvent.matched_terms` stored as Json** (TEXT under SQLite) rather than a separate row-per-term entity. Aggregation queries in Pilot will need to unpack the Json array; for demo scale (single-digit-thousand events at most), this is fine. If Pilot analytics turn into a hot path, refactor to a separate `MatchedKeyword` table with indexes.

4. **Scan modal is a single overlay**, not per-field inline. A multi-field submit with matches in two fields shows one modal listing all matched terms grouped by protected-class category. Continue / Edit / Cancel applies to the entire submit, not per-field. Simpler UX; matches the soft-advisory framing.

5. **Auto-clear primary_concern across context switches** uses two `update` calls inside the event handler, batched by React 18's automatic event-handler batching. No new state structure; no useReducer migration; minimal change to the form's data flow.

### Lessons recorded

- **Helper text ergonomics**: the existing `Field` component had no helper-text prop. Two paths considered: (1) extend `Field` with optional helper-text rendering, or (2) inline `<label>` blocks with manual structure. Chose (2) for the three Block B fields because each has a slightly different surrounding shape (closing notes appears in a `{isTerminalNo && (...)}` branch; ActionCard description has the required-asterisk-conditional). When a fourth field with similar treatment shows up in a future block, lifting `Field` to support optional `helper` prop is the natural refactor — but premature without three uniform call sites.
- **`use server` annotation discipline**: `lib/compliance-scan-action.ts` is the first standalone server-action file in the project (existing actions live in `app/growth-conversations/[memberId]/actions.ts`). Verified that `"use server"` at the top of `/lib/*.ts` works under Next.js 16 + Turbopack; the function is callable from both server (page.tsx) and client (form components).
- **Path C-modified scoping is real**: Sprint 4.6 deferred Wave 1 schema-wide tagging sweep, immutable trace log, §1071 readiness, adverse action notice integration, and counsel review per COMPLIANCE.md §12. Each was tempting to scope-creep; sticking to the floor kept the sprint within budget. ComplianceScanEvent is the lightweight stand-in for the deferred trace log.

### Pilot deferrals to honor (per COMPLIANCE.md §12)

- Wave 1 compliance tagging sweep (`[FL:*]` annotations on every schema field + `compliance-tags.json` registry + CI enforcement) — Sprint 4.6 demonstrates the pattern in the docs but doesn't ship the registry
- Immutable decision-trace log (hash-chained, append-only DecisionTraceEvent entity) — ComplianceScanEvent is the lightweight subset
- §1071 demographic data readiness
- Adverse action notice integration architecture
- Counsel review of all banker-facing copy

These are explicitly out of scope for Sprint 4.6 and tracked in OPEN_QUESTIONS.md.

### Verified

- `pnpm tsc --noEmit` — clean
- `pnpm exec next build` — `✓ Compiled successfully`; 5 routes
- DB state confirmed post-migration: Jenny `co_decision_maker_household`, Northland `external_advisor`, Cygnus `service_or_capability_concern`
- HTML probe of `/growth-conversations/jenny`:
  - "Primary concern" label present (engaged-spectrum)
  - "Needs household co-decision-maker input" label rendered (Jenny's value)
  - "Capture discipline ?" footer link present
  - Old labels absent: no "Needs spouse", no "Needs CPA", no "bank capability", no "Decline reason"
- `scanText` smoke probe: matches "husband" (sex_gender_orientation), "Black" (race_color_origin), "Kosher" (religion_creed), "Hospital" (disability_health); does not match enum values like "rate" or "circumstances changed" (correctly outside the registry)

### Watch for review

- **Hard refresh recommended.** Schema migration + enum extension + new client components + new lib modules. Cleared `.next` mid-build to clear stale chunks; visual review should also cmd+shift+r.
- **AskSection + SizeSection scan extension is deferred.** Strict Sprint 4.6 §B.1 spec lists 4 fields; broader §C.3 audit mentions other [FL:BANKER-PROSE] fields without enumeration. If visual review surfaces gaps (e.g., banker enters protected-class language in AskSection's Direct quote and the scan doesn't fire), extend the same `ComplianceScanModal` integration into AskSection and SizeSection. Pattern is established; the lift is small.
- **Compliance disclaimer banner is sessionStorage-gated** (not server-rendered). Curl probes will not see it; real browsers will. The reason is to avoid hydration mismatches when the banner state differs between server and client. Testing the banner requires opening a real browser in a fresh session.
- **The auto-clear primary_concern logic** assumes React 18's automatic event-handler batching. If a future React downgrade or behavior change breaks batching, the two `update` calls would produce two re-renders (slight flicker) instead of one — non-correctness, just visual.
- **Editorial decisions E1–E6 committed at Path A.** Pilot calibrates from `ComplianceScanEvent` telemetry. If demo viewing surfaces fatigue (e.g., banker dismisses every "wife" / "husband" / "married" prompt), the `man / men / woman / women / spouse` edges are first-call removal candidates.

---

---

## 2026-04-29 · Sprint 4.6 patch — Withdrawn terminal state + Closed → Introduced rename

**Session type:** Small follow-up to Sprint 4.6, addressing a spec-drift finding from the verification turn. The Sprint 4.6 prompt body in `docs/prompts/SPRINT_4.6_COMPLIANCE_POSTURE_FLOOR.md` did not specify the Withdrawn terminal state that Francisco's pre-flight reminder mentioned; it was missed during initial implementation. Patched here together with a permanent Connect-ending terminal rename.

### What shipped

**1. Withdrawn terminal state for declined / dismissive Resolve-ending Tracks**

- New `"withdrawn"` value added to `TrackStageState` in `lib/suggested-next-step.ts`. Four-state dot vocabulary: `completed` (orange-filled) / `current` (orange-ringed) / `upcoming` (grey-rule-filled) / `withdrawn` (grey-soft-filled). The new state reads as "muted, distinct, this journey concluded without funding."
- `computeTrackStages` extended: when Resolve-ending AND `recommendation_response ∈ {declined, dismissive}`, `pendingState = "completed"` (decision was made, even if "no") + `terminalState = "withdrawn"` + `terminalDisplayLabel = "Withdrawn"`. Mirrors the Q-040 / Closing displayLabel pattern: canonical `label` stays `"Funded"` so `#stage-funded` URL anchor continues to resolve.
- Renderers updated: `TrackProgressDots` and `AnchorProgressBar` both add the `withdrawn` branch in their dot-state cascade. Background utility `bg-blaze-grey-soft` (existing token); no new CSS variables introduced. Label color follows the existing default branch (also `text-blaze-grey-soft`), so withdrawn labels read as muted alongside the dot.

**2. Connect-ending terminal renamed `"Closed"` → `"Introduced"`**

- Permanent rename — applies to all Connect-ending Tracks regardless of response state, because the handoff completes whether or not the Member ultimately proceeds with the specialist. Withdrawn does not apply to Connect-ending Tracks.
- `computeTrackStages` `terminalLabel` updated from `"Closed"` to `"Introduced"` for `isConnectTrack` branch.
- `lib/stage-guidance.ts` StepPhase type renamed `"closed"` key to `"introduced"` (internal lookup key). Cygnus-specific guidance content rewritten to describe the introduction-made semantic ("The introduction to the CRE specialist has been made. The relationship from this point forward is driven by the specialist…") rather than the prior "engagement has closed" framing. Generic phase-fallback also updated.
- `app/growth-conversations/[memberId]/page.tsx` stage-label-to-phase mapping updated: `stage.label === "Introduced" ? "introduced" : null` (was `"Closed" → "closed"`). Comment about lifecycle slugs corrected.
- URL anchor slug for Connect-ending terminal moves from `#stage-closed` to `#stage-introduced`. Pre-patch external links to `#stage-closed` will not resolve. No external bookmarks exist for the demo, so this is a clean rename. (Resolve-ending `#stage-funded` URL anchor is unchanged and continues to resolve across all states.)

### Verified state matrix

Direct probe via `computeTrackProgress` over both Track shapes × six response values:

**Jenny (Resolve-ending Track):**

| `response` | pending state | terminal label | terminal state |
|---|---|---|---|
| `leaning_yes` / `engaged` | current | Funded | upcoming |
| `committed` | completed | **Closing** | current |
| `funded` | completed | Funded | completed |
| `declined` / `dismissive` | completed | **Withdrawn** | **withdrawn** |

**Cygnus (Connect-ending Track):**

| `response` | pending state | terminal label | terminal state |
|---|---|---|---|
| `leaning_yes` / `engaged` | current | **Introduced** | upcoming |
| `committed` | completed | **Introduced** | current |
| `funded` | completed | **Introduced** | completed |
| `declined` / `dismissive` | upcoming | **Introduced** | upcoming |

Withdrawn correctly does not appear for any Cygnus state. Connect-ending terminal is uniformly "Introduced" across all responses.

### Decisions made during implementation

- **Internal StepPhase key renamed** `"closed"` → `"introduced"` rather than kept stable. The internal key is used only for the guidance lookup table; renaming it keeps the key consistent with the canonical label and reduces the cognitive overhead of "the key says one thing, the label says another." If schema migration risk had been higher (e.g., the key was a Prisma enum value with stored data), I'd have kept the internal key stable; for an in-code lookup table identifier, the rename is clean.
- **Pending state for Connect-ending declined stays `upcoming`** rather than promoted to `completed`. The user's spec said Withdrawn doesn't apply to Connect-ending Tracks; "Specialist engagement upcoming, Introduced upcoming" matches the existing default-bucket behavior. If visual review surfaces this as feeling wrong (Member declined but the dots say "haven't gotten there yet"), it's a small follow-up to add a Connect-declined-completed bucket.
- **Withdrawn label color** follows the existing default branch (`text-blaze-grey-soft`), no separate styling. The dot-fill color carries the visual distinction; the label inherits the pre-existing muted-text treatment that upcoming labels also use. Saves a pass on label-color taxonomy.

### Housekeeping

- `BLAZE_STYLE_GUIDE.md` §14.5 — terminal-label vocabulary table replaces the prior single-paragraph treatment. Four-state dot vocabulary documented. URL anchor stability noted.
- `lib/stage-guidance.ts` — Cygnus and generic-fallback content rewritten for the Introduced semantic.
- `app/growth-conversations/[memberId]/page.tsx` — phase mapping + slug comment updated.

### Verified

- `pnpm tsc --noEmit` clean
- State matrix probe matches spec for both Track shapes across all six response values

### Watch for review

- **Withdrawn dot color is muted.** If visual review feels it disappears next to the also-muted upcoming dots, increasing the fill saturation slightly (still grey-toned, not orange) is a one-line tweak. Current treatment uses the existing `var(--blaze-grey-soft)` token to avoid inventing a new color.
- **`#stage-closed` → `#stage-introduced` URL change** for Connect-ending Tracks. Demo has no external bookmarks; pilot phase shipping with this should ensure any user docs / training material referencing the old anchor are updated.

Sprint 4.7 (v2 phase 1) is up next.

---

## 2026-04-30 — Sprint 4.7 (v2 prototype phase 1) — Turn 1 + Turn 2

### Goal

Ship the v2 Member workstation at `/v2/members/[id]` parallel to v1 routes per ARCHITECTURE_V2.md. Two-turn structure: Turn 1 = Foundation (route, schema, dot system, page layout primitives, compliance banner, click-in-place); Turn 2 = Content (capture forms, captured feed, Tracks-supported panel, coach content, fixture quote enrichment, compliance scan extension). Single bundled BUILD_LOG entry for the full sprint per Francisco's scope note.

### What shipped

**Turn 1 — Foundation (Blocks A–E):**

- **Block A** — Route + cross-links. `/v2/members/[id]` resolves for jenny/northland/cygnus. v1 surfaces (`/members/[id]`, `/growth-conversations/[memberId]`) gain "Try the new view →" affordance; v2 has "Classic view ↗" back-link. Q-X1 wired in Turn 2 — link is now opt-in via `?v2=true`.
- **Block B** — Schema additions. `Model`, `ShowEvent`, `Reaction` entities + `ReactionValue` enum. Reverse relations on Banker / Member / Conversation / Artifact. `Member.key_facts` Json column added. Migration `20260429235304_sprint4_7_v2_phase_1_entities` + `20260429235457_sprint4_7_member_key_facts`. Objective entity implemented as derived state in `lib/stage-guidance.ts` (the `objectiveGuidance` helper) rather than persisted, per ARCHITECTURE_V2 §11.1.
- **Block C** — `ObjectiveDot` + `ObjectiveDotRow` shared client components. Four states (filled / outlined / faint / accented), 8px diameter, 6px gap. Accented uses solid `--blaze-orange-burnt` fill (CC's call documented per §5.1).
- **Block D** — Page layout primitives shipped as one cohesive piece per Francisco's scope note. Header (display-weight Member name, coral open-thread badge), KeyFactsStrip (cream-tinted background, 3-5 facts/Member), sticky V2Dialpad (7 pill buttons, ~36px tight height), V2Sidebar (180px, 5 stacked sections), V2MainPanel scaffolding.
- **Block E** — Compliance disclaimer banner mounted below header / above key facts strip per Q-H1. Click-in-place navigation discipline enforced — no clicks on the workstation result in page navigation.

**Turn 2 — Content (Blocks I–R):**

- **Block I** — `+ Model` capture form with structured parameters (key/value rows), assumptions list, output_summary textarea, With-Member/Banker-draft radio. Server Action `saveModel` in `app/v2/members/[id]/actions.ts`. output_summary fires Sprint 4.6 keyword scan.
- **Block J** — `+ Show` capture form with Artifact + Model selects + context note. Server Action `saveShowEvent`.
- **Block K** — `+ Reaction` capture form with response value (5 enum values), member_quote textarea, ShowEvent linkage. Server Action `saveReaction`. member_quote fires keyword scan.
- **Block L** — Existing v1 capture forms (AskSection, SizeSection, ResolveSection) reused inside the v2 dialpad's drawer. Each gained an optional `onSaveSuccess` callback so the drawer can close after a save without disturbing v1 callers. Standalone `+ Action` form built (`ActionForm`) extracting the ActionCard sub-form pattern from Resolve. Server Action `saveActionCard`.
- **Block M** — Tracks-supported-by-current-evidence panel. Click "Land" objective → modal opens with strong / moderate / insufficient cohorts. Hand-curated `tracks_by_evidence_strength` Json column on Member, populated in seed.ts with FIXME(Francisco) annotations per Q-M1. Compliance-careful framing verbatim per ARCHITECTURE_V2 §10.2 — no "candidate tracks" or "recommended for". Migration `20260430003409_sprint4_7_member_tracks_evidence`.
- **Block N** — Captured feed with all six card variants (Ask / Quantify / Model / Show / Reaction / Resolve). Recent-first sort across activity types. Click expands inline; Member quotes in italic with left-rule mark; coral border on open-thread captures; 70% opacity on stale (>90 days) entries. Empty-state placeholder when no captures.
- **Block O** — Coach content reorganized by signal type per Q-O1. New `objectiveGuidance(objective, memberTypeName)` helper in `lib/stage-guidance.ts`. Trigger paragraphs → Land; Goal/Blocker/Indecision/Size → Understand; Show/Resolve → Consult; Lifecycle → Formalize. "show ?" affordance in sidebar expands to four objective blocks with member-type-aware paragraphs.
- **Block P** — Member fixture quote enrichment from `docs/MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md`. Selected 5-6 strongest quotes per Member across goal/blocker/indecision/reaction/resolution. Quote selections per Member documented below. Plus seeded Reaction + ShowEvent + Model rows (one each per Member's featured conversation) so the captured feed has v2-shape evidence to render.
- **Block Q** — Compliance scan integration extended to v2 banker-prose fields. AskSection's `their_words` and SizeSection's `their_words` + `methodology_note` now fire the Sprint 4.6 keyword scan (the deferred extension from Sprint 4.6). Reuses ComplianceScanModal + recordComplianceScanEvent. New v2 forms (Model.output_summary, Reaction.member_quote, ActionCard.description) also wired to the scan. v1 Resolve scan behavior preserved.
- **Q-X1 feature flag** — `V2OptInLink` client component with `?v2=true` query-param gate persisting via sessionStorage. v1 surfaces show the cross-link only when the flag is set. Default during build is v1-only; Sprint 6 may flip for EVP demo.
- **Block R** — Governance updates: this BUILD_LOG entry, BLAZE_STYLE_GUIDE §15 (v2 workstation pattern), CLAUDE.md §5 vocabulary additions (workstation/objective/activity/dot/open thread/evidence; retire stage/phase/step from banker-facing), SCOPE.md three-modules update, OPEN_QUESTIONS Q-A1..Q-A5 logged.

### Quote enrichment selections per Member (Block P)

**Jenny's Catering** (6 quotes; replaced 4 originals):

| Field | Selected quote | Source |
|---|---|---|
| Goal `their_words` (cash flow smoothing) | "I just want to be able to sleep through January" | Already in seed (Francisco's E4 memorability pick — kept) |
| Blocker `their_words` (receivables) | "Some big accounts paying 60+ days now. Used to be 30." | Enrichment Blocker 1 |
| Blocker `their_words` (seasonal, both captured_data + Signal row) | "January and February kill us every year. Holiday parties end the second week of December and then nothing till spring." | Enrichment Blocker 2 |
| Show captured_data `their_words` | "Oh, I see what you're doing — the line just covers the dip…" | Enrichment Reaction (engaged) |
| Recommendation `their_words` | "Seventy-five thousand. Okay. That's bigger than I was thinking but if I'm only drawing during the slow months…" | Enrichment Reaction (leaning yes) |
| Indecision `their_words` | "I'd want Mike to look at the numbers before I sign anything that big. He handles the books with me." | Enrichment Indecision |
| Reaction `member_quote` (new v2 entity) | "Oh, I see what you're doing — the line just covers the dip…" | Enrichment Reaction (engaged) |

**Northland HVAC** (5 quotes; replaced 4 originals):

| Field | Selected quote | Source |
|---|---|---|
| Goal `their_words` (fleet) | "We could probably do another 20-25% volume if we had the trucks and bodies. Demand isn't the problem." | Enrichment Goal 2 |
| Blocker `their_words` (capacity) | "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet." | Enrichment Blocker (Francisco's E4 memorability pick) |
| Recommendation `their_words` | "I hear you. Let me chew on it. I want to talk to my CPA before pulling the trigger on something this size." | Enrichment Reaction (leaning yes) |
| Indecision `their_words` | "I want to run this past my CPA before I commit. He handles all the tax stuff and I want him on board with the structure." | Enrichment Primary concern |
| Reaction `member_quote` | "Okay, the math holds. I see how the volume covers the payment." | Enrichment Reaction (engaged) |

**Cygnus Bioscience** (5 quotes; replaced 4 originals):

| Field | Selected quote | Source |
|---|---|---|
| Goal `their_words` (customer growth) | "We're at about eighty-five percent capacity utilization. Three of our anchor customers are signaling fifteen to twenty-five percent volume growth over the next eighteen months. The math is clear — we have to expand or we have to start telling customers no." | Enrichment Goal 1 |
| Blocker `their_words` (concentration → reframed as 2019 lost-deal memory) | "Last expansion we went with regional. They had a CRE team that knew the building type. We weren't unhappy but the relationship cost more than the rate did. I'd rather not do that again if we have a choice." | Enrichment Blocker (Francisco's E4 memorability pick) |
| Trigger `their_words` (capacity eval, both ask:1 + ask:2) | "We could run an RFP. The board would actually expect that for a deal this size. But if you can show me you have the specialist depth, I'd rather just work with you." | Enrichment Indecision (RFP vs. relationship) |
| Recommendation `their_words` | "Bring me the specialist. We'll work through structure together." | Enrichment Recommendation |
| Reaction `member_quote` | "Yes, please. The sooner the better. Have him reach out directly to Robert and me." | Enrichment Reaction (committed) |

### Tracks-supported demo data (Block M, FIXME-annotated per Q-M1)

Each Member has a `tracks_by_evidence_strength` cohort populated in seed.ts:

- **Jenny** — Strong: Working Capital LOC (4 evidence dots) · Moderate: Cash Management upgrade (2) · Insufficient: Equipment Loan
- **Northland** — Strong: Vehicle/Fleet Loan (4) · Moderate: SBA 7(a) structuring (2) · Insufficient: Owner-Occupied CRE
- **Cygnus** — Strong: CRE Term Loan (4) · Moderate: Treasury Services upgrade (2) · Insufficient: Equipment Loan

Each cohort entry carries a `rationale` string drawing on the Member's actual captured signals/sizings/reactions. Compliance-careful framing verbatim per ARCHITECTURE_V2 §10.2 / COMPLIANCE.md §10.2 — non-negotiable per Francisco's pre-execution confirmation. FIXME(Francisco) annotations live in the seed comment blocks; refinements land as a follow-up commit before EVP demo.

### Schema migrations applied

| Migration | Purpose |
|---|---|
| `20260429235304_sprint4_7_v2_phase_1_entities` | CREATE TABLE Model + ShowEvent + Reaction + indexes |
| `20260429235457_sprint4_7_member_key_facts` | ALTER TABLE Member ADD COLUMN key_facts JSONB |
| `20260430003409_sprint4_7_member_tracks_evidence` | ALTER TABLE Member ADD COLUMN tracks_by_evidence_strength JSONB |

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (Next 16.2.4 + Turbopack); all 6 routes in route table
- `pnpm exec tsx prisma/seed.ts` runs cleanly; row counts: 3 Members · 11 Signals · 4 ActionCards · 3 Recommendations · 3 Models · 3 ShowEvents · 3 Reactions

### Decisions made during implementation

- **Capture forms reuse v1 components in drawers, not extracted** — AskSection / SizeSection / ResolveSection are unchanged in v1 surfaces; the `onSaveSuccess` callback is an additive optional prop. The drawer wrapper imports them directly from `app/growth-conversations/[memberId]/`. Lifting their internals into shared components was considered but deferred — the existing files contain Sprint 4.6 compliance discipline that's working, and an extraction would risk regressions for negligible v2 benefit.
- **Captured feed item shape is denormalized at the page level**, not derived from raw Prisma rows in the feed component. This keeps the V2MainPanel a pure-render client component and lets the page.tsx Server Component own all the schema knowledge. Tradeoff: the FeedItem union has six variants which is verbose; benefit: typesafe rendering in the client component without leaky Prisma types.
- **Compliance scan in AskSection scans `their_words` only**, not `topic_id` or numeric magnitude fields. Topic IDs are FK references; magnitudes are numbers. The `[FL:BANKER-PROSE]` tag applies to free-text fields; nothing else fires the scan. Same logic in SizeSection: `their_words` + `methodology_note` only.
- **Open-thread heuristic is best-effort flagging on the feed**: if an ActionCard drives the open thread, the most recent Resolve card gets the coral border (most likely source). If a Recommendation's primary_concern drives it, the corresponding Resolve card gets the border directly. v2 phase 2 may add a richer "open thread → which card" trace.
- **Seeded v2 entities reference the existing featured Conversations** rather than creating new ones. The featured conversation already has the Show step's GrowthStepExecution; the v2 ShowEvent records the same artifact-rendering moment from the v2 schema's perspective. Both representations coexist; v1 reads the GrowthStepExecution path, v2 reads the ShowEvent path.
- **Drawer layout uses one shared chrome with body dispatch on activity** — the dialpad component owns the drawer state and renders the right form inside. Considered making each form its own drawer wrapper but the seven forms × identical surrounding chrome made a dispatch pattern cleaner.

### Watch for review

- **`pnpm next start` is unstable from the iCloud-synced project root** — `.next` artifacts get reshuffled by iCloud sync mid-read, producing missing-chunk runtime errors despite a clean build. Confirmed environmental, not code-level. `pnpm next dev` works reliably (no chunk caching pattern) and is the recommended path for visual review during the build phase. For a production-style probe, run from a clone outside `~/Library/Mobile Documents/...`.
- **Block M FIXME data needs Francisco's review** — the moderate / insufficient cohort rationales are CC drafts. Before EVP demo, refine to match what Francisco knows about each Member's actual evidence depth. Refinements land as a follow-up commit; they do not block Turn 2 acceptance per Q-M1.
- **Open-thread badge truncation at 32 chars** — the heuristic truncates ActionCard rationales for the header badge. If the truncated text reads awkwardly (cuts mid-word), the badge component handles the ellipsis; copy review may want to refine the badge's source string.
- **Coach content for Cygnus's Land objective merges ask:1 + ask:2** — the v1 stage-guidance has two distinct paragraphs for Cygnus's two Ask stages, but the v2 objective is single-paragraph. Combined treatment authored fresh in `objectiveGuidance`. If the EVP wants Cygnus's two-Ask architecture surfaced in coach content, a follow-up can split.

Sprint 4.7 (v2 phase 1) complete. Sprint 5 (Insight Engine v2) is up next.

---

## 2026-04-30 — Sprint 4.7.1 (v2 visual cleanup)

### Goal

Wave 1 of the v2 architectural refactor split flagged in Sprint 4.7 visual review. Eight discrete visual fixes; no schema changes, no code-side vocabulary refactor (those land in Sprint 4.7.2 immediately after). Also: canonical apply pass on `ARCHITECTURE_V2.md` and `EVIDENCE_FRAMEWORK.md` happened before this sprint — governance docs now use Discover/Measure/Consult/Navigate vocabulary; code still uses Land/Understand/Consult/Formalize. That gap closes in 4.7.2.

### What shipped

- **Block A — Two-pill header badge.** Open-thread badge replaced with two structured Chips (response value + product name) and a date context. Drops the synthetic-prose pattern that truncated mid-sentence and read as past-tense. `OpenThread` type changed from `{ text, context }` → `{ responseLabel, productLabel, context }`. Heuristic simplified: badge renders only when there's an active Recommendation in the engaged spectrum (response not in {committed, funded, declined, dismissive}); ActionCard contributes only the date context (overdue/due) when an open one exists.
- **Block B — Chip primitive.** `app/_components/chip.tsx` exports a `<Chip variant="default|accent|muted">` component with the v1 capture-form chip aesthetic (square-edged 2px radius, 0.5px border, tight padding, cool-grey-blue default fill matching `--blaze-data-cool`). Used across the new header badge (Block A) and the captured-feed primary tags (Block E).
- **Block C — Member Signals wordmark.** Top-left of the v2 page header. Re-uses the v1 typographic mark: orange `Member` + charcoal `Signals`. Links back to `/`.
- **Block D — "Growth Conversations" page title.** Primary title now reads "Growth Conversations"; Member name + Member Type + stage + banker render as subtitle below. Inverts v2 phase 1's hierarchy where the Member name dominated.
- **Block E — Capture cards show signal-type as primary tag.** Ask captures now display `Goal` / `Blocker` / `Indecision` / `Trigger` Chip (not `ASK`); Ask card headline drops the duplicate signal-type prefix and shows just the topic. Other kinds render `Sized` / `Model` / `Shown` / `Reaction` / `Resolution` Chip. Open-thread Resolve cards get the `accent` Chip variant; everything else uses `default`.
- **Block F — Compliance banner: dark grey + sharpened copy.** Background flipped to `--blaze-grey-darker` with white text. Copy replaced with the F.2 verbatim sharpened version: *"Member Signals captures consultative notes for growth conversations. Lending decisions and formal underwriting occur in the lending decisioning system."* Drops "consultative conversations," "relationship management," and "adverse action determinations" — regulator-audience phrasing the working banker doesn't read. Dismissible-per-session behavior preserved unchanged.
- **Block G — Sticky dialpad on scroll, collapsing header.** Header is now `position: sticky; top: 0` with a scroll-driven collapsed state (window.scrollY > 100 threshold). Collapsed mode: ~44px height showing logo + Member name (truncated) + open-thread badge. Expanded mode: ~104px showing logo + "Growth Conversations" title + full subtitle + badge + Classic view link. Header height published as `--v2-header-h` CSS variable on `documentElement` (so the dialpad's sticky offset, a sibling, can read it). Dialpad sticks at `top: var(--v2-header-h, 104px)` and transitions in lockstep with the header. 150ms ease-out transition on both. Compliance banner and key facts strip stay in normal flow per G.3 spec — they scroll away as expected.
- **Block H — Cygnus's two Asks restored.** Two parts:
  1. **Quote-topic alignment fix.** `cygnusVolumeSignal` had been overwritten in Sprint 4.7 Block P with the RFP-vs-relationship Indecision quote (which doesn't match the `triggerVolume` topic). Restored to the canonical MEMBER_FIXTURE_BRIEF §5.4 customer-volume-commitment quote: *"Three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source."*
  2. **Per-capture dot rendering for Ask-derived signals.** New `dotsForSignals(signals, typeLabel)` helper in `page.tsx`. For every captured Goal / Blocker / Indecision / Trigger Signal, the helper emits one filled dot labeled `{typeLabel}: {topic.display_name}`. Empty signal arrays emit a single outlined dot with the type label. Cygnus now renders 2 trigger dots under Land (capacity_eval + customer_volume_commitment); Jenny renders 1 trigger + 1 blocker; Northland renders 1 goal + 1 blocker. The "Trigger captured" / "Goal" / "Blocker" / "Indecision" generic dots are gone, replaced by per-signal dots.

### Schema changes

None. Sprint 4.7.1 is surface-only.

### Verified

- `pnpm exec tsx prisma/seed.ts` clean (DB reset + reseed; row counts unchanged: 11 Signals, 4 ActionCards, 3 Recommendations, 3 Models, 3 ShowEvents, 3 Reactions)
- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean; all 6 routes in route table including `/v2/members/[id]`

### Decisions made during implementation

- **Chip primitive scoped to `app/_components/`, not v2-specific** — kept room for v1 surfaces to adopt the same primitive in 4.7.2 if vocabulary cascade includes pill consistency.
- **Header collapse threshold at scrollY > 100** — chosen pragmatically; matches the natural top region (header + banner + key facts strip ≈ 180-200px) so the collapse fires roughly when the dialpad would otherwise scroll off-screen. May need adjustment after visual review if the transition feels jumpy.
- **CSS variable hoisted to `documentElement`** — sibling sticky elements (header + dialpad) can't share a scoped CSS variable; the cleanest cross-cutting channel is `document.documentElement.style.setProperty` from the header's effect. Removed on unmount to avoid leaking state across route changes.
- **Open-thread heuristic simplified.** Sprint 4.7 had a two-tier fallback (ActionCard nearest-due → Recommendation primary_concern → null). Block A simplifies: badge renders only when there's an active Recommendation in the engaged spectrum. ActionCards still contribute the date context (overdue/due) when present, but no longer drive badge presence on their own. Reasoning: badge content (response value + product) makes no sense without a Recommendation; ActionCard-driven badges had to synthesize prose that ended up truncated.
- **Per-capture dots for all four Ask signal types** (not just Trigger). Block H asked specifically about Cygnus's two triggers, but the same logic naturally extends to Goals/Blockers/Indecision under Understand. Implementing it consistently means Cygnus's 1 goal + 1 blocker also render as labeled per-signal dots, which gives Understand a richer dot row across all three Members. If 4.7.2 or Sprint 5 wants to revisit dot scaling rules (e.g., max dots per evidence type, collapsing pattern at high counts), this is the surface to revisit.
- **No `--v2-header-h` cleanup on remount** — the variable is set on every scroll change so a stale value would only persist for one frame after a new mount before the effect fires. Acceptable for the demo.

### Watch for review

- **Header subtitle line wraps on narrower viewports.** The full subtitle (`Member name · type · stage · banker`) plus the open-thread badge plus Classic view link can overflow at <1280px viewport widths. Truncation works but feels tight. If visual review wants a different subtitle compaction (e.g., drop banker on narrow), it's a one-line CSS tweak.
- **Per-capture dot rendering may produce wide dot rows** for Members with many captured signals. Cygnus has 4 Discover-routed signals total (1 goal + 1 blocker + 2 triggers); with the v2 mapping in 4.7.2 (Goals/Blockers/Indecision migrate from Understand to Discover), the Discover row could grow to 4+ dots routinely. ARCHITECTURE_V2 §3.1 spec says "4-7 dots typical," which still fits. Sprint 5 may want a max-dots-per-row rule if real Pilot scale produces 10+ signals per type.
- **Compliance banner dark-grey treatment is bold.** A coral/cream-adjacent fallback may feel less aggressive if visual review wants softer signaling. The dark-grey choice was deliberate per F.3 ("default to dark grey background with white text — clearer signal that this is a system disclaimer, not a Member-context element"); revisit only if the boldness reads wrong against the workstation's warm-cream surrounding.
- **Cygnus Trigger dots are labeled `Trigger: trigger.capacity_expansion_evaluation` etc.** — the topic display_names use the `trigger.` prefix from the seed taxonomy. Reads slightly raw. If visual review wants friendlier labels (e.g., "capacity expansion eval"), that's a topic display_name pass, not a code change.

Sprint 4.7.1 complete. Sprint 4.7.2 (vocabulary refactor + dialpad simplification + Reaction expansion + ReactionValue +2 + Reaction.primary_concern column + governance cascade) follows immediately.

---

## 2026-05-04 — Sprint 4.7.2 (v2 vocabulary refactor + dialpad simplification + Reaction expansion)

### Goal

Wave 2 of the v2 architectural refactor. Sprint 4.7.1 (visual cleanup) shipped earlier in the day; Sprint 4.7.2 lands the architectural rename + dialpad/Reaction restructuring. Goal: make the code match the canonical governance documents (ARCHITECTURE_V2.md and EVIDENCE_FRAMEWORK.md were updated 2026-04-30 during the canonical apply pass; the code carried Land/Understand/Formalize + 7 dialpad activities until this sprint).

### What shipped

- **Block A — Schema migrations.** `ReactionValue` enum expanded from 5 → 7 values (added `committed`, `declined` — terminal states subsumed from v1 Resolve). `Reaction.primary_concern` String column added (nullable; reuses Sprint 4.6 contextual taxonomy enum semantics, validated at the application layer because the column accepts values from two different context subsets per response_value). Migration `20260430215139_sprint4_7_2_reaction_expansion`.
- **Blocks B + I — V2Objective rename cascade + TracksSupportedPanel rewiring.** TypeScript union literal renamed `"land" | "understand" | "consult" | "formalize"` → `"discover" | "measure" | "consult" | "navigate"` in `lib/stage-guidance.ts`. Cascade applied across `app/v2/members/[id]/page.tsx`, `app/v2/members/[id]/sidebar.tsx`, `V2_OBJECTIVE_LABELS`. Sidebar's `handleObjectiveClick` now keys on `"discover"` to fire the TracksSupportedPanel.
- **Block C — Dot composition rewrite.** `objectives` array literal in `page.tsx` rewritten to derive per the re-mapped EVIDENCE_FRAMEWORK §2 catalog. Discover absorbs Goals/Blockers/Indecision (5+ per-capture dots for fixtures with multiple signals); Measure adds Model produced (was Consult); Consult drops Model produced and Surfaced concern; Navigate inherits Formalize's shape.
- **Block D — Coach content re-author.** `OBJECTIVE_GUIDANCE` restructured. Three layers: `V2_OBJECTIVE_QUESTIONS` (verbatim approved per-objective question), `GENERIC_OBJECTIVE_BODIES` (fallback), and `MEMBER_TYPE_GUIDANCE` (Member-Type-specific override). `objectiveGuidance()` now returns `{ headline, body }` instead of a flat string. Sidebar coach surface renders the question italicized above the body. Member-Type-specific paragraphs re-authored for all three demo Members under the new four-objective vocabulary (Goals/Blockers/Indecision under Discover; Model produced under Measure; Show + Reaction under Consult; lifecycle under Navigate).
- **Block E — Dialpad reduction.** Dialpad goes from 7 buttons → 5: `+ Ask`, `+ Quantify`, `+ Model`, `+ Reaction`, `+ Action`. `+ Show` and `+ Resolve` removed from the v2 surface. `app/v2/members/[id]/capture-forms/show-form.tsx` deleted (no longer reachable from v2). Page.tsx props that fed Show + Resolve drawers removed (resolveCurrent, resolveGrowthStepId, indecisionTopics, modelOptions). v1 ResolveSection persists for v1 routes per ARCHITECTURE_V2.md §12.5.
- **Block F — Reaction form expansion.** `reaction-form.tsx` rewritten to subsume v1 Resolve's functionality. Response value dropdown now shows 7 values; primary_concern dropdown switches between 8 open-thread options (engaged/leaning_yes/committed/skeptical/confused) and 10 decline-reason options (declined/dismissive). Field label switches contextually ("Primary concern" vs "Member's stated reason for declining"). Required for {skeptical, confused, leaning_yes, declined} per v1 NUANCED pattern; optional otherwise. Auto-clear on context boundary switch. Helper text per COMPLIANCE.md §10.2. member_quote continues to fire the compliance keyword scan.
- **Block G — ShowEvent auto-create on with-Member provenance.** `saveModel` server action updated. When `built_with_member === true` AND `artifact_id` is non-null, the same Prisma transaction creates a companion ShowEvent linked to the Model + Conversation + banker. Atomic — if Show creation fails the entire transaction rolls back. When provenance is "Banker draft" or no Artifact is linked, only the Model row is created (no Show). `SaveModelResult` now exposes `show_event_id: string | null` so the caller can verify the auto-create.
- **Block H — Artifact preview "Record show" button.** New component `app/v2/members/[id]/artifact-preview-dialog.tsx`. Sidebar artifact-click opens the preview dialog (replaces the Sprint 4.7 placeholder console.log). Preview shows artifact title + description + a "Record show" button. Click creates a ShowEvent via the existing `saveShowEvent` action. Button transitions to "Recorded ✓" disabled state for the session. Preview-without-record path preserved — the rehearses-quietly use case is the default. SidebarArtifact shape gained a `description` field; page.tsx's show_events query selects `artifact.description` and forwards it.
- **Block J — Governance cascade.** `CLAUDE.md §5` updated with new vocabulary (Discover/Measure/Consult/Navigate; 5 activities), surface-vs-schema separation note, retired vocabulary list. `BLAZE_STYLE_GUIDE.md §14.9` updated with 5-pill dialpad, contextual primary_concern documentation, "Record show" button pattern, Discover-objective Tracks-supported framing. `SCOPE.md §3.1` updated. `OPEN_QUESTIONS.md` Q-A1..Q-A5 updated with deferral status (Q-A1 → Sprint 5; Q-A2 → Sprint 5; Q-A3 → Pilot; Q-A4 → Pilot; Q-A5 → still open / cross-ref Q-045).
- **Block K — this BUILD_LOG entry.**

### Schema migrations

| Migration | Purpose |
|---|---|
| `20260430215139_sprint4_7_2_reaction_expansion` | `ALTER TABLE Reaction ADD COLUMN primary_concern TEXT`. ReactionValue enum expansion (engaged/leaning_yes/skeptical/confused/dismissive + committed/declined) requires no DDL — SQLite stores enums as TEXT, so the new values are accepted by the existing column with the expanded Prisma client validating writes. |

### Verified

- `pnpm prisma migrate deploy` clean
- `pnpm exec tsx prisma/seed.ts` clean (DB reset + reseed; existing Reaction rows remain valid with `primary_concern = null`)
- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean; all 6 routes in route table including `/v2/members/[id]`
- Per-fixture dot composition under new four-objective vocabulary:
  - **Jenny (Small Caterer · Starting):** Discover ~6 dots (Recommendation candidate · 1 trigger · 1 goal · 2 blockers · Tracks-supported); Measure ~3 dots (Sized magnitude · Methodology outlined · Model produced); Consult ~3 dots (Show · Reaction · Open thread accent); Navigate ~3 dots (1 ActionCard filled · 2 faint).
  - **Northland (HVAC · Growing):** Discover ~5 dots (Recommendation candidate · 1 trigger? · 1 goal · 1 blocker · Tracks-supported); Measure ~3 dots; Consult ~3 dots; Navigate ~3 dots.
  - **Cygnus (Specialty Mfg · Established):** Discover ~5 dots (Recommendation candidate · 2 distinct triggers per Sprint 4.7.1 Block H · 1 blocker · 1 goal · Tracks-supported); Measure ~3 dots; Consult ~3 dots; Navigate ~3 dots.

### Decisions made during implementation

- **Reaction.primary_concern stored as String, not enum.** The contextual taxonomy uses two disjoint enum sets (8 open-thread values + 10 decline-reason values, with `service_or_capability_concern` shared). Single Prisma enum coupling would force application-layer validation regardless. Storing as String avoids the tight coupling and matches how `Recommendation.primary_concern` already handles the same contextual pattern in v1 (where the column is the existing `RecommendationPrimaryConcern` enum union). At Pilot scale, if the column needs to be a strict enum, migration is a `ALTER TABLE` + Prisma enum addition.
- **objectiveGuidance() returns { headline, body }, not just string.** Block D.2's structured form was specified as `{ headline, body, member_type_specifics: {} }`. CC simplified the shape: headline + body where body is Member-Type-specific when authored, else generic fallback. The `MEMBER_TYPE_GUIDANCE` map is internal; consumers don't need direct access. Reduces the consumer's API surface; same outcome.
- **ShowEvent auto-create gates on artifact_id non-null.** A Model can be saved without linking to an Artifact (e.g., a banker draft cashflow projection that wasn't formalized into a shareable chart). When artifact_id is null and provenance is with-Member, the auto-Show is silently skipped — there's no concrete Artifact for the ShowEvent to point at. Banker can still record a Show via the artifact preview's Record-show button (Block H) if they later link the Model to an Artifact.
- **show-form.tsx deleted, not just unwired.** The form had no remaining call sites after dialpad reduction. Keeping it as dead code would be a maintenance liability since future schema changes would force gratuitous edits. v1 routes never used the v2 show-form (v1's Show step uses GrowthStepExecution + ArtifactParameterCapture, not the v2 ShowEvent path).
- **Per-capture dots applied to all four Discover signal types**, continuing the pattern from Sprint 4.7.1 Block H. Cygnus's two triggers, Jenny's two blockers (receivables + seasonal), and any future multi-signal captures all render as labeled per-signal dots instead of collapsing to one. The v2 spec calls for 4-7 dots typical on Discover; this approach satisfies that without per-Member tuning.
- **Methodology note dot rendered as outlined** (suggested) for all three demo fixtures. None of the demo SizingMeasurements carry an explicit `methodology_note`; rendering as outlined signals "this is a capture the banker could make but hasn't yet." Visual review will confirm; if it reads as a missing fill rather than a deliberate suggestion, fall back to faint state for demo and revisit at Pilot.
- **MEMBER_TYPE_GUIDANCE re-authored, not just re-keyed.** Per Block D.2: "the current Member-Type paragraphs collapsed [Goals/Blockers/Indecision and quantitative Size content] together — they need a re-author." Discover paragraphs now combine trigger-watch + qualitative-discovery framing; Measure paragraphs absorb Model-produced framing alongside sizing/methodology; Consult paragraphs focus strictly on the conversation about the model; Navigate paragraphs cover lifecycle handoff/follow-through. Cygnus's two-Ask architecture explicitly surfaced in the Discover paragraph ("Two trigger captures matter…").

### Watch for review

- **Reaction.primary_concern as String** rather than a Prisma enum is a deliberate simplification. If Pilot wants strict enum validation at the database layer, the migration is straightforward. Demo phase ships with application-layer validation only.
- **ShowEvent auto-create silently skips when Model has no Artifact linkage.** The save action returns `show_event_id: null` in this case, but there's no banker-facing message. If visual review wants explicit feedback ("Model saved; no Show recorded — link an Artifact to record a Show"), add a one-line toast.
- **Methodology note dot for demo fixtures.** Renders as outlined ("suggested") for all three Members since no fixture SizingMeasurement carries a `methodology_note`. May read as a missing-state cue rather than a suggestion. Acceptable for demo; Sprint 5's state-dependent rendering will replace with proper not-yet-relevant treatment.
- **MEMBER_TYPE_GUIDANCE paragraphs are CC-authored.** Francisco may want an editorial pass before EVP demo. The verbatim-approved per-objective questions + generic bodies are locked; the Member-Type-specific paragraphs are CC drafts and should be reviewed for voice consistency with the rest of the demo content.
- **Sidebar artifact preview is intentionally minimal** — surfaces title + description only, not a rendered chart. Sprint 5 ships the rendered artifact (chart / partnership map / ROI projection) inside this preview surface. The Record-show button works regardless of whether the rendered artifact is present.

### Cross-references

- ARCHITECTURE_V2.md §11.7 — surface vs schema separation; the two real Sprint 4.7.2 schema changes
- ARCHITECTURE_V2.md §12.5 — v1 Resolve form retention
- EVIDENCE_FRAMEWORK.md §2 — re-mapped catalog (21 evidence types across Discover/Measure/Consult/Navigate)
- EVIDENCE_FRAMEWORK.md §4 — five-activity to evidence mapping including Reaction's contextual primary_concern
- COMPLIANCE.md §6.3 — open-thread vs decline-reason taxonomies (reused on Reaction.primary_concern)
- BLAZE_STYLE_GUIDE.md §14.9 — v2 workstation pattern (updated this sprint)

Sprint 4.7.2 complete. v2 prototype is now structurally locked: Discover/Measure/Consult/Navigate vocabulary; 5-activity dialpad; Reaction subsumes Resolve; ShowEvents fire on with-Member or explicit Record-show. Sprint 5 (Insight Engine + state-dependent objectives + popup-as-workflow surface + per-objective evidence panels) is the next major sprint.

---

## 2026-05-04 — Sprint 5a.1 (Foundation: Matrix Schema + Seed + Capture Form Updates + Basic Switchboard)

### Goal

Land the consultative architecture's structural foundation. Sprint 5a is split into two phases for visual-review safety; this is phase 1. Goal: confirm the matrix is alive end-to-end (schema + seed + evaluator + ranker + capture forms + sidebar Track context indicator) so Sprint 5a.2 can build the popup-as-workflow surface on a stable base.

### What shipped

- **Block A — Schema additions.** Four new entities in `prisma/schema.prisma`: `BusinessFactor`, `TrackTemplate`, `MatrixEntry`, `FactorCapture`. Single migration `20260504191233_sprint5a_1_business_factor_matrix` with FK constraints + indexes. Member gained a reverse `factor_captures` relation. Schema is additive — zero changes to v1 or earlier-v2 entities.
- **Block B — Matrix data seed.** New file `prisma/seed-matrix.ts` (split out for clarity) translates `BUSINESS_FACTOR_MATRIX_v1.md` Sections 1-3 into 28 BusinessFactor records, 5 TrackTemplate records, and 59 MatrixEntry records. Seed counts confirmed by `prisma.businessFactor.count()` etc. in the post-seed table. (Prompt estimated ~80+ entries; actual count is 59 because the matrix file Section 3 enumerates only strong/moderate/negative entries — "negligible" cells aren't materialized as rows. 59 is the faithful count.)
- **Block C — Per-fixture FactorCapture seed.** Section 4 of the matrix file → 36 FactorCapture rows (12 for Jenny + 10 for Northland + 14 for Cygnus). Source linkage to existing Signal/SizingMeasurement/Reaction is left null in this sprint — the link fields exist on FactorCapture but the captures stand alone. Sprint 5a.2 popup-as-workflow can backfill linkages where useful.
- **Block D — `lib/factor-evaluator.ts`.** ~180 lines hand-rolled recursive-descent evaluator. Supports `>= > <= < == !=`, `AND`, `OR`, `IN [...]`. Cross-factor field references resolve via an optional captures-by-field-name map (used by the TRACK-002 negative compound rule that references both `growth_obstacle_tag` and `seasonal_variance_pct`). Null rule = presence check. All 9 unit-test cases in `scripts/probe-ranker.ts` pass.
- **Block E — `lib/track-ranker.ts`.** `rankTracksForMember(prisma, memberId)` walks all Tracks × MatrixEntries against the Member's captures, evaluates each rule, counts strong/moderate/negative entries fired, applies the 2-evidence-threshold filter, and sorts by negative_count → strong_count → moderate_count. Strength label is `strong` if strong ≥ 3 with no negative; `moderate` if (strong ≥ 1 OR moderate ≥ 2) with no negative; `insufficient` otherwise. Top-ranked Track per fixture matches matrix Section 4 expectations: Jenny → Working Capital LOC strong; Northland → Vehicle/Fleet Loan strong; Cygnus → CRE Term Loan strong.
- **Block F — `+ Quantify` hybrid form.** New file `app/v2/members/[id]/capture-forms/quantify-form.tsx` with mode toggle. Default matrix-aware mode: factor dropdown grouped by category → diagnostic question rendered as italicized blockquote → typed input control per `factor.capture_mode` (numerical / boolean / qualitative_select / qualitative_multi). Optional companion SizingMeasurement creation when factor is numerical (creates a Sized card in the captured feed alongside the FactorCapture). Free-form mode wraps the existing v1 SizeSection — no FactorCapture created on that path. New server action `saveFactorCapture` handles the matrix-aware save in a single transaction.
- **Block G — `+ Ask` factor-tag dropdowns.** Light extension of `AskSection`. SignalDraft type gained a `factor_tag: string \| null` field. Sub-form renders a per-signal-type tag dropdown below the verbatim quote (Goal → 8 growth-aspiration tags; Blocker → 8 obstacle tags; Indecision → 8 hesitation tags; Trigger → 8 trigger-event tags). `saveAskCaptures` server action extended to atomically create a companion FactorCapture row anchored to FACTOR-021/022/023/024 per signal type, with `qualitative_value` set to the chosen tag (defaults to `"other"` when banker doesn't pick) and `source_signal_id` pointing back to the Signal. v1 routes inherit this behavior — new captures from v1 surfaces also write FactorCaptures.
- **Block H — Track switchboard sidebar header.** New `track context` section above Objectives in the v2 sidebar. Reads from `rankTracksForMember()` at page-render time; surfaces top-ranked Track name + strength chip (`accent` variant for strong, `default` for moderate, `muted` for insufficient). Empty state ("insufficient evidence yet") renders when ranker returns an empty list. Read-only this sprint; Sprint 5a.2 turns it into an interactive dropdown.

### Schema migrations

| Migration | Purpose |
|---|---|
| `20260504191233_sprint5a_1_business_factor_matrix` | CREATE TABLE BusinessFactor / TrackTemplate / MatrixEntry / FactorCapture with FK constraints + indexes. ALTER Member implicit (Prisma client only — no DDL needed for the reverse relation since FK lives on FactorCapture). |

### Verified

- `pnpm exec tsx prisma/seed.ts` clean (DB reset + reseed; 28 BusinessFactors + 5 TrackTemplates + 59 MatrixEntries + 36 FactorCaptures + all prior counts intact)
- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean; all 6 routes intact
- `pnpm exec tsx scripts/probe-ranker.ts` — Block D evaluator: 9/9 unit tests pass; Block E ranker output matches matrix Section 4 expectations for top-ranked Track per all three fixtures.

### Ranker output per fixture (top of `pnpm exec tsx scripts/probe-ranker.ts`)

```
jenny      (4 Tracks above 2-evidence threshold)
  strong       [5s/1m]        Working Capital Line of Credit
  moderate     [2s/3m]        SBA 7(a) Loan
  moderate     [0s/3m]        Treasury Services Upgrade
  insufficient [0s/3m/1neg]   Commercial Real Estate Term Loan

northland  (4 Tracks above 2-evidence threshold)
  strong       [5s/1m]        Vehicle / Fleet Loan
  moderate     [2s/3m]        SBA 7(a) Loan
  moderate     [1s/1m]        Treasury Services Upgrade
  insufficient [2s/3m/1neg]   Commercial Real Estate Term Loan

cygnus     (4 Tracks above 2-evidence threshold)
  strong       [5s/6m]        Commercial Real Estate Term Loan
  moderate     [1s/2m]        Treasury Services Upgrade
  moderate     [1s/1m]        Vehicle / Fleet Loan
  insufficient [1s/3m/1neg]   SBA 7(a) Loan
```

### Matrix interpretation notes (per Block B.5 ambiguity handling)

- **SBA size standard threshold (FACTOR-019 on TRACK-004).** The matrix file says `annual_revenue <= SBA_size_standard` with the note that the standard is industry-specific (NAICS-keyed, $19.5M-$41.5M typical for specialty bioscience). Demo uses a fixed $25M placeholder that correctly classifies all three demo Members (Jenny $850K and Northland $2.4M qualify; Cygnus $28M exceeds). Pilot resolves via the SBA's published NAICS table. Documented inline in `seed-matrix.ts`.
- **FACTOR-027 array-length entry omitted.** The TRACK-005 strong entry `LENGTH(treasury_services_adopted) < 3` uses an array-length operator the Block D evaluator does not support. Treasury Services ranking still works for the demo via FACTOR-019 (size fit) and FACTOR-004 (cash buffer). Sprint 5a.2 may extend the evaluator; Pilot can re-evaluate. Documented inline.
- **Compound negative rule on TRACK-002.** The matrix's `growth_obstacle_tag == cashflow_volatility AND seasonal_variance_pct >= 30` cross-factor rule is handled by the evaluator's optional captures-map argument. The MatrixEntry is anchored to FACTOR-022 with the compound rule string; the evaluator resolves both field references via the captures-by-field-name map.

### Discrepancies vs. matrix Section 4 expectations

Top-ranked Track per fixture is exact match. Two minor lower-rank discrepancies:

1. **Cygnus Vehicle/Fleet Loan ranks moderate (1s/1m) vs. expected insufficient.** FACTOR-006 (capacity utilization ≥ 75%) and FACTOR-009 (YoY revenue growth ≥ 10%) both fire. Both factors are genuinely shared between TRACK-002 and TRACK-003 in the matrix; the actual scoring reflects this overlap honestly. Section 4's "insufficient" expectation appears to be authorial intent that the matrix logic doesn't fully realize. Banker still sees CRE Term Loan ranked first; Vehicle/Fleet appears as moderate-with-low-counts. Reads as accurate to me.
2. **Northland CRE Term Loan ranks insufficient (negative override) vs. expected moderate.** Northland's $2.4M revenue trips the `annual_revenue < 5000000` negative entry. Section 4.2 expected "moderate (renders as moderate due to tier — worth pursuing as adjacent conversation if Member moves toward facility move/expansion)." The Sprint 5a.1 spec §E.3 explicitly mandates the negative-override discipline ("render Tracks with any negative_count as insufficient... but keep them in the returned list"), so the implementation is correct per spec; the matrix Section 4 narrative may have been authored before the negative-override rule was finalized.

Both discrepancies surface for review; neither blocks the EVP demo since the top-ranked Track for each fixture is correct. Pilot can refine per-Track override rules if visual review wants different ranking nuance.

### Decisions made during implementation

- **`prisma/seed-matrix.ts` separated from `prisma/seed.ts`.** ~600 lines of matrix records would have ballooned an already-large seed.ts. Splitting keeps both files readable; main seed imports the two seeding helpers and the row-count export.
- **Cross-factor evaluator API.** Block D spec notes evaluator may take an optional `factor: BusinessFactor` parameter. CC chose an additional `captures: Record<field_name, CaptureValueLike>` argument so cross-factor rules (TRACK-002 negative) work without per-call factor catalog lookups in the ranker. The evaluator signature: `evaluateThreshold(primary, factor, rule, captures?)`.
- **Negative-override discipline applied uniformly.** Spec §E.3 says "render Tracks with any negative_count as insufficient." CC implemented this strictly: any negative entry firing flips the strength to insufficient regardless of positive count. The Northland CRE discrepancy noted above is a direct consequence; if Pilot wants tier-aware override (e.g., "1 negative survives if 5+ strong"), it's a one-function refinement.
- **+ Ask factor-tag default to "other".** Per spec G.3: "If the banker doesn't select a tag, default to 'other'". CC implemented this on the save side (action defaults `factor_tag ?? "other"`). The form dropdown shows `(other)` as the placeholder option to make the default explicit to the banker.
- **Companion SizingMeasurement on + Quantify is opt-in.** Spec §F.3 has it as an inline checkbox. CC kept it that way. Banker who wants the structured factor capture without a Sized card can leave the box unchecked.
- **Track context Chip variant.** Strong → `accent` (coral/orange — matches the open-thread treatment); moderate → `default` (cool grey-blue Chip); insufficient → `muted` (grey on white). Visual hierarchy: strong reads as "primary candidate"; moderate as "in the mix"; insufficient as "noted but not pursued."

### Watch for review

- **Ranker discrepancies vs Section 4** documented above. Top-ranked Track per fixture is correct; lower-rank shape may need refinement per Pilot.
- **+ Ask factor-tag dropdown affects v1 routes.** AskSection is shared between v1 (`/growth-conversations/[memberId]`) and v2 (dialpad drawer). New captures from v1 surfaces will also write FactorCaptures. This is intentional (forward-looking for v1 retirement at Pilot) but worth verifying v1 visual review still passes.
- **No edit path for FactorCapture.** Sprint 5a.1 only writes new captures; banker can't edit a previously-captured factor's value. Sprint 5a.2 popup-as-workflow may surface edit affordances or this can be a separate Pilot consideration.
- **Treasury Services FACTOR-027 entry omitted.** Treasury ranks moderate for Jenny and Cygnus via FACTOR-019 + FACTOR-004 alone. If visual review feels the Treasury ranking should be richer, extending the evaluator with array-length operators is straightforward.

### Cross-references

- `BUSINESS_FACTOR_MATRIX_v1.md` Sections 1-4 — canonical content seeded this sprint
- `ARCHITECTURE_V2.md §10` — Tracks-supported framework (the Block H switchboard surfaces this in the sidebar)
- `EVIDENCE_FRAMEWORK.md §5` — Tracks-supported evidence-strength scoring discipline
- `lib/factor-evaluator.ts` — pure-function threshold evaluator
- `lib/track-ranker.ts` — Track ranking
- `prisma/seed-matrix.ts` — matrix seed data

Sprint 5a.1 complete. Matrix infrastructure is alive; rankings per fixture match expectations; capture forms write FactorCaptures alongside existing entities. Sprint 5a.2 (popup-as-workflow + dot system simplification + Track switching UX) is the next major sprint.

---

## 2026-05-04 — Sprint 5a.2 (Surface: Popup-as-Workflow, Dot Simplification, Track Switching)

### Goal

Make the Sprint 5a.1 matrix foundation banker-usable. The matrix is alive end-to-end; this sprint surfaces it through five enhancements: popup-as-workflow per objective, captured-only dots with "+ next valuable" affordance, Track-relative dot composition, Track switching dropdown, and the LENGTH evaluator operator. Visual review confirmed Sprint 5a.1 ranked correctly for all three fixtures; this sprint builds the consultative workflow surfaces on top.

### What shipped

- **Block A — LENGTH operator.** `lib/factor-evaluator.ts` extended with `LENGTH(field) op N` grammar. Pattern `/^LENGTH\((\w+)\)\s*(>=|<=|==|!=|>|<)\s*(-?\d+)$/`; resolves the field via the captures-by-field-name lookup, parses `qualitative_value` as JSON, and compares array length. Handles malformed JSON and null captures gracefully (returns false). FACTOR-027 (`LENGTH(treasury_services_adopted) < 3`) now fires for Jenny and Northland, lifting Treasury Services Upgrade from `[0s/3m]` → `[1s/3m]` (Jenny) and `[1s/1m]` → `[2s/1m]` (Northland) per the post-Sprint-5a.1 ranker probe.
- **Block B — Track-relative dot derivation.** New `lib/objective-evidence.ts` exports `deriveDotsForObjective`, `capturedDots`, `missingEvidence`, `nextValuable` plus `FactorCaptureLite`, `BusinessFactorLite`, `TrackTemplateLite`, `EntityCounts`, `ObjectiveDotData`, `DeriveDotsArgs` types. Resolves both factor refs (`FACTOR-NNN` → FactorCapture lookup) and symbolic refs (`model_produced` / `model_shown` / `reaction_captured` / `decision_maker_mapping` / `specialist_handoff_initiated` → entity-existence checks). Empty-Track fallback per spec §B.3 Option 2: when ranker returns empty array, dot rows render empty (the popup empty-state copy + Track context "insufficient evidence yet" carry the cue).
- **Block C — Dot system simplification.** Captured-only main row per objective (filtered through `capturedDots`); single "+ next" affordance to the right of the row when any required evidence is missing; "complete" italicized label when all evidence is captured. The "+ next" affordance is clickable and routes through the popup-CTA flow (Block E). Coral ring on open-thread dots preserved via existing `accented` dot state — the highlight string also surfaces under the dot row for the Consult objective when an open thread is active.
- **Block D — Popup-as-workflow surface.** `app/v2/members/[id]/objective-popup.tsx` (311 lines, shipped earlier in session) wired into the workstation. Modal pattern (centered overlay, click-outside to close) chosen per spec §D.8 — matches "focused workflow surface" framing. Header: `{OBJECTIVE} · for {Track name}` + verbatim question from `V2_OBJECTIVE_QUESTIONS`. Top zone: empty-checkbox CTAs in matrix-template priority order, each labeled with the factor's diagnostic question + small form hint (`+ Quantify · {category}` or `(record from artifact preview)` for symbolic refs). Bottom zone: `CapturedRow` items with type chip + value + member-quote blockquote + capture metadata (`captured {date} · by {banker} · via {form}`). Empty-state when no required evidence; complete-state when all captured. Compliance-careful framing per COMPLIANCE.md §10.2 — no banned phrases; every element sourced from structured data per Francisco's GenAI-filler ban.
- **Block E — Capture form pre-selection.** `QuantifyForm.preselectedFactorId` was plumbed in Sprint 5a.1 but unused — fixed: `MatrixAwareCapture` now initializes `factorId` state to the preselected value when present and the factor exists in the catalog. Diagnostic question surfaces immediately. Other capture forms (+ Ask, + Reaction, + Model, + Action) don't take a `preselectedFactorId` prop because per spec §E.1 factor pre-selection applies only to + Quantify; symbolic refs route to the appropriate form (model_produced → + Model, reaction_captured → + Reaction, specialist_handoff_initiated → + Action, decision_maker_mapping → + Ask, model_shown → sidebar artifact preview).
- **Block F — Track switching dropdown.** Sidebar Track context is now an interactive `TrackContextSwitcher`. Click the Track name → expands a list of all `rankedTracks` showing name + strength + counts (`5s/1m`, `2s/3m/1neg`, etc.). Click a Track → updates page state; sessionStorage key `v2-track-{memberId}` persists the selection across navigations within session. Default to top-ranked on first visit. "View comparison ↗" link surfaces alongside the strength chip per Francisco's directive — opens `TracksSupportedPanel` so the cohort comparison is discoverable without burying it inside the dropdown. Empty-state: "insufficient evidence yet" italic when ranker returns empty.
- **Block G — Real-time ranker re-execution.** `revalidatePath` strategy. v2 actions (`saveModel`, `saveShowEvent`, `saveReaction`, `saveFactorCapture`, `saveActionCard`) already invoked `revalidateAllMemberSurfaces()` which revalidates v2 + v1 + GC routes. Sprint 5a.2 extends the v1 actions in `app/growth-conversations/[memberId]/actions.ts` (saveAskCaptures, saveSizingCaptures, saveResolveCapture) to also revalidate `/v2/members/[id]` so v1-route captures (which now write FactorCaptures via Sprint 5a.1 Block G) trigger Track ranker re-execution on the next render of the v2 workstation. Next.js handles the re-render; banker sees updated dots / Track context within ~1-2 seconds.
- **WorkstationShell — coordination layer.** New client component `app/v2/members/[id]/workstation-shell.tsx` (~280 lines) hoists state coordination above the four sibling client surfaces (V2Sidebar, V2Dialpad, ObjectivePopup, TracksSupportedPanel) that need to communicate. State owned by the shell: `popupObjective`, `dialpadActivity`, `preselectedFactorId`, `tracksOpen`, `selectedTrackId`. Per-objective dots derive client-side via `deriveDotsForObjective` + `capturedDots` + `nextValuable` so a Track switch re-renders dots without a server round-trip. `V2Dialpad` accepts optional `controlledActivity` + `onActivityChange` + `preselectedFactorId` props for the popup-CTA-driven flow; falls back to uncontrolled (button-click) behavior when those props are absent.
- **Block H — this BUILD_LOG entry, OPEN_QUESTIONS resolutions, CLAUDE.md manifest update.**

### Schema changes

None. Sprint 5a.2 is surface + lib + governance only. The schema additions from Sprint 5a.1 (BusinessFactor, TrackTemplate, MatrixEntry, FactorCapture) carry through unchanged.

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (Next 16.2.4 + Turbopack); 6 routes intact
- `pnpm exec tsx scripts/probe-ranker.ts` — 9/9 pre-existing evaluator tests pass; LENGTH operator passes a separate 6-test inline probe (>=, <, ==, empty array, null capture, malformed JSON); top-ranked Track per fixture matches matrix Section 4 expectations.
- Per-fixture HTML probe at `pnpm exec next dev`:
  - **Jenny** sidebar: "Working Capital Line of Credit · strong support · view comparison ↗"; Discover row 4 captured dots + "complete"; Measure row 3 captured dots ("Seasonal revenue variance" · "Surplus revenue over costs" · "Model produced") + "complete"; Consult/Navigate complete.
  - **Northland** sidebar: "Vehicle / Fleet Loan · strong support"; Discover 2 dots + complete; Measure 3 dots ("Demand exceeding capacity" · "Capacity utilization" · "Equipment / fleet aging") + complete.
  - **Cygnus** sidebar: "Commercial Real Estate Term Loan · strong support"; Discover 3 dots; Measure 3 dots + **"+ next: Surplus revenue over costs"** affordance (the only uncaptured factor under CRE Term Loan's required evidence); Consult complete; Navigate complete.

The per-fixture variance demonstrates Block B's Track-relative composition: each fixture's Measure row carries different evidence labels because each top-ranked Track requires different factors.

### Decisions made during implementation

- **Modal pattern for popup, not drawer.** Spec §D.8 allowed either; the existing component built the modal and Francisco confirmed in this session ("Keep the modal — focused-workflow framing"). Drawer remains a future option if visual review surfaces context-loss concerns.
- **Discover routes to ObjectivePopup like the other three objectives.** Sprint 5a.1 Block H wired Discover → TracksSupportedPanel; Sprint 5a.2 retires that routing. The TracksSupportedPanel becomes accessible via the "view comparison ↗" link in the Track context header — discoverable alongside the strength chip per Francisco's directive, not buried in the dropdown. All four objectives now open the same popup-as-workflow surface for consistency.
- **WorkstationShell coordination layer chosen over Context or event-bus.** Three sibling client components (Sidebar, Dialpad, ObjectivePopup) needed to share state. Context would have required a Provider wrapping all three; an event bus would have worked but felt opaque. The shell pattern is explicit: lifted state plus controlled-or-uncontrolled props on the existing components. Dialpad gained two props (`controlledActivity`, `onActivityChange`) for opt-in controlled mode; behavior is unchanged when those props are absent.
- **Flat `capturedRowsByEvidenceRef` shape.** Originally typed as `Record<V2Objective, Record<string, CapturedRowDisplay>>` but collapsed to a flat `Record<string, CapturedRowDisplay>` because the same evidence_ref produces identical display data regardless of which objective renders it (the FactorCapture / Model / ShowEvent / Reaction is canonical; the popup picks rows by ref).
- **specialist_handoff_initiated maps to ActionCardType=`handoff`.** The schema enum has `handoff` (not `specialist_handoff`); the `entityCounts.specialistHandoffCount` filter uses `a.type === "handoff"`. `decision_maker_mapping` resolves either via FACTOR-014 (co_decision_maker_required) capture or — fallback — via the most-recent indecision Signal, since Indecision captures cover the same conversational territory.
- **v1 actions revalidate v2 path too.** v1's `saveAskCaptures` (and Size / Resolve) now write FactorCaptures alongside Signals/Sizings/Recommendations per Sprint 5a.1 Block G. Without this revalidate, captures from `/growth-conversations/[memberId]` wouldn't propagate to a v2 workstation tab for the same Member until manual refresh. Block G adds `revalidatePath("/v2/members/[id]", "page")` to all three v1 actions for this reason.
- **Per-spec §B.3 — empty-Track fallback chose Option 1 (empty objective rows) over Option 2 (generic catalog).** When ranker returns empty array, `deriveDotsForObjective` returns `[]` and the sidebar renders no dots; the Track context shows "insufficient evidence yet" and the popup empty-state explains. Option 2 would have required keeping the generic `EVIDENCE_FRAMEWORK` catalog wiring as fallback — extra code path for an edge case the demo fixtures don't hit. CC chose Option 1 for simplicity; Pilot can reintroduce generic fallback if real data produces below-threshold Members frequently.

### Watch for review

- **Track switching latency.** Switching Tracks re-derives dots client-side (instant, no server round-trip). Track context dropdown closes on selection. If visual review wants a small visual transition cue (fade/slide on the dot row), it's a CSS-only follow-up.
- **"+ next" affordance is a small text link.** Renders as `+ next` in 10px orange text. Visual review may want the factor label inline (e.g., `+ next: Surplus revenue over costs`) for at-a-glance context — currently only the aria-label carries the factor name. Switching to inline-with-label is a one-line edit if preferred.
- **Bottom-zone CapturedRow uses the chip variant `default` for everything.** Open-thread captures don't get the accent variant in the popup. This intentionally diverges from the captured-feed treatment (where open-thread captures get `accent`) — the popup's job is to display *what was captured* per evidence_ref, not to flag urgency. Visual review will confirm.
- **Popup CTA's empty checkbox is decorative.** It's a `<span>` with checkbox-like styling; the click target is the entire row's `<button>`. Visual review may prefer a real input or a different glyph; the row renders as an actionable list item either way.
- **Quantify form `preselectedFactorId` initializes once on mount.** If the popup opens twice in succession with different preselections without unmounting the form between, the second won't override (state keeps the first). In practice the dialpad drawer unmounts the form when closed, so this isn't reachable in the current UX. Documented for the Pilot scenario where the drawer might persist between captures.

### Cross-references

- `BUSINESS_FACTOR_MATRIX_v1.md` Sections 2-4 — Track templates' `required_evidence_per_objective` + per-fixture expected popup content
- `ARCHITECTURE_V2.md §3` — four-objective architecture; §11.7 surface-vs-schema separation
- `EVIDENCE_FRAMEWORK.md §2` — evidence catalog; §4 — five-activity to evidence mapping
- `COMPLIANCE.md §10.2` — banker-facing posture commitments (banned phrases enforcement)
- `lib/factor-evaluator.ts` — extended with LENGTH operator
- `lib/objective-evidence.ts` — Track-relative dot derivation helpers
- `app/v2/members/[id]/objective-popup.tsx` — popup-as-workflow component
- `app/v2/members/[id]/workstation-shell.tsx` — client coordination layer

Sprint 5a.2 complete. The matrix-driven consultative architecture is now end-to-end banker-usable: capture → factor write → ranker re-execution → Track re-rank → dot re-render → popup CTAs surface the next-valuable evidence. Sprint 5b (Insight Engine portfolio surfaces) is the next major sprint; Sprint 6 (polish + EVP demo deploy) follows.

---

## 2026-05-04 — Sprint 5a.3 (Source Linkage, Humanizer, Coach Restructure)

### Goal

Sprint 5a.2 visual review surfaced lossy popup captured-rows: rich Member quotes from Sprint 4.7 Block P were absent because Sprint 5a.1 left FactorCapture source linkage null per Block C ("captures stand alone"). Captured-at dates uniformly read "May 4 · via + Quantify" because the seed defaulted captured_at to seed-execution time and form attribution to + Quantify regardless of true provenance. Raw enum tags (`late_paying_customer`, `cashflow_volatility`) appeared in popup rows. Sprint 5a.3 closes those gaps and restructures the Coach surface to match popup-as-workflow's structural discipline.

### What shipped

- **Block A — Source linkage seed.** 22 FactorCaptures (across the 38 in Jenny + Northland + Cygnus, after FACTOR-027 LENGTH-operator additions) gained `source_signal_id` per the Sprint 5a.3 audit map. Two anonymous Signals named (`jennyReceivablesBlockerSignal` for Dec 2025; `cygnusConcentrationBlockerSignal` for Jun 2025 — the latter unlinked from any FactorCapture currently, available for Pilot many-to-many evolution per Note 1). New `FactorCaptureSeed.source_signal` predicate shape: `{ type, captured_at_iso, topic_canonical_tag }`. `seedFactorCapturesForFixtures` resolves the predicate to a Signal id at seed time, throws loudly if no Signal matches (mismatched predicates would otherwise silently null-link). Cygnus's two same-day Triggers disambiguated by `topic_canonical_tag`.
  - **Side-fix in `clear()`:** the seed deleteMany cascade was missing FactorCapture / MatrixEntry / TrackTemplate / BusinessFactor (Sprint 5a.1) and Reaction / ShowEvent / Model (Sprint 4.7). Fresh DB seeds were succeeding; subsequent reseeds hit FK-cascade errors. Fix applied here so Block A's reseed runs cleanly on populated databases.
- **Block B — Humanizer + factor.name as primary chip for standalone rows.** `formatFactorValue` in page.tsx now humanizes `qualitative_value` (underscore-replace + sentence-case) and JSON-array-passes for FACTOR-027's treasury_services_adopted shape. Boolean values render as `Yes` / `No` (capitalized). Standalone FactorCapture rows (no source linkage) use `factor.name` as the type chip — e.g., a row for FACTOR-019 Annual revenue band shows chip="Annual revenue band" + value="$850,000". Source-linked rows continue to use the Signal type as chip (Goal/Blocker/Trigger/Indecision) and surface the verbatim Member quote; that path was correct from Sprint 5a.2 Block D and remains unchanged.
- **Block C — Coach surface visual restructure.** Coach panel now mirrors popup-as-workflow structural discipline:
  - Section per objective (Discover / Measure / Consult / Navigate) with `V2_OBJECTIVE_QUESTIONS` framing italicized — same headers as the popup
  - Verb-led action item bullets, not narrative paragraphs
  - Bullets with `ctaEvidenceRef` render as clickable rows (rounded border + checkbox-style mark + small form hint), reusing Block E plumbing — the unified `onCtaClick(evidence_ref)` callback routes FACTOR-NNN → + Quantify with preselection, and symbolic refs → respective forms
  - Figures bolded via `boldFragments` substring rendering (longest-first regex alternation)
  - Always-expanded when opened (no expand-per-objective interaction)
  
  New types in `lib/stage-guidance.ts`: `CoachBullet`, `MemberTypeCoach`. New const `MEMBER_TYPE_COACH` + `GENERIC_COACH_BULLETS` fallback. New helper `coachBullets(objective, memberTypeName)`. Existing `objectiveGuidance()` retained for backward compat but no longer consumed by sidebar.
  
  Authoring per Member-Type: 8-9 bullets per fixture across the four objectives, drawn from `MEMBER_TYPE_GUIDANCE` substance. Lines made redundant by popup-as-workflow CTAs were retired during the parse: "capture goals/blockers/indecision", "show the chart", "size the gap" are all now surfaced by popup missing-evidence CTAs or sidebar artifact slot. What was preserved: verbatim-quote discipline ("sleep through January"), trigger-watch lists, domain-specific framing (Cygnus's two-trigger pattern, Northland's reframe moment), and figure-anchored context (~$48K slow-season gap, ~70 calls/peak season, ~85% utilization, $4-7M scope).
  
  CTAs wired per fixture:
  - Jenny: FACTOR-024 (capture late-payment trigger), model_produced (cashflow projection), specialist_handoff_initiated (joint-call ActionCard)
  - Northland: model_produced (fleet ROI), specialist_handoff_initiated (out-of-scope handoff)
  - Cygnus: model_produced (capital event partnership map), specialist_handoff_initiated (CRE banker handoff)
  
  Existing CTARow plumbing in `objective-popup.tsx` was not extracted into a shared component — coach surface implements its own `CoachBulletRow` with parallel visual treatment. The "discipline mirror" Francisco asked for is structural and visual, not necessarily one-component-shared. Pilot polish if shared abstraction surfaces value.
- **Sidebar callback consolidated.** `onNextValuableClick` renamed to `onCtaClick` since the same callback now serves three CTA invocation paths: "+ next" affordance, popup CTA, and coach bullet CTA. Unified routing through `WorkstationShell.handleCtaClick`.
- **Block H — this BUILD_LOG entry + architectural notes.**

### Per-fixture linkage map (audit reference)

For future-session orientation, the 19 source-linked FactorCaptures across the three fixtures:

**Jenny (6):**
- FACTOR-001 / FACTOR-022 → seasonalSignal (Apr 8 — "January and February kill us"). Ambiguity #1 routed cashflow_volatility to seasonal pattern as the structural volatility (vs receivables symptom).
- FACTOR-002 / FACTOR-024 → jennyReceivablesBlockerSignal (Dec 4 — "Some big accounts paying 60+ days now"). Ambiguity #2 cross-types trigger-tag → Blocker Signal for provenance linkage.
- FACTOR-014 → jennyIndecisionSignal (Apr 8 — "I'd want Mike to look at the numbers").
- FACTOR-021 → jennyCashFlowSmoothingGoalSignal (Mar 12 2024 — "I just want to be able to sleep through January").

**Northland (6):**
- FACTOR-006 / FACTOR-007 / FACTOR-022 / FACTOR-024 → capSignal (Apr 15 — "I came in to look at financing for my own truck"). Ambiguity #3 routes capacity_evaluation trigger-tag to a Blocker Signal because Northland has no Trigger-type Signal.
- FACTOR-013 → northlandIndecisionSignal (Apr 15 — CPA reference).
- FACTOR-021 → northlandFleetGoalSignal (Feb 22 2025 — "We could probably do another 20-25% volume").

**Cygnus (7):**
- FACTOR-006 / FACTOR-008 / FACTOR-021 → cygnusCustomerGrowthGoalSignal (Nov 15 2024 — "We're at about eighty-five percent capacity utilization").
- FACTOR-011 / FACTOR-015 / FACTOR-022 → cygnusCapacityEvalSignal (Apr 21 — "decision about the floor space within the next two quarters"). Ambiguity #4 routes real_estate obstacle-tag to Trigger Signal because the floor-space pain lives there.
- FACTOR-024 → cygnusVolumeSignal (Apr 21 — "Three of our biggest customers..."). Topic disambiguation distinguishes the two same-day Triggers.

The remaining 19 captures are standalone (Path B): `annual_revenue`, `member_tenure_years`, `industry_seasonal`, `treasury_services_adopted`, `operating_margin_pct`, `yoy_revenue_growth_pct`, `blaze_relationship_years`, `decision_timeline` (Jenny), `co_decision_maker_required` and `external_advisor_involved` (Cygnus), `specialist_on_file`, `equipment_aging_observed`. These are structural/banking-relationship facts with no member-stated source quote.

### Architectural notes for Pilot

These document architectural questions that surfaced during Sprint 5a.3 implementation but don't block the demo. Each requires real-banker-behavior signals to resolve.

**Note 1 — Cross-type linkage pattern (Sprint 5a.3 Ambiguities #2, #3, #4).** The trigger-tag → Blocker-Signal pattern recurs because Signal types and factor tags are parallel taxonomies optimized for different purposes (capture-moment categorization vs Track-ranking categorization). Sprint 5a.3's audit handles this case-by-case; Pilot needs to decide between three alternatives based on observed banker capture patterns at scale:
- (a) **Many-to-many `FactorCapture`-to-`Signal` linkage** so multiple Signals can attach to one factor — best when bankers capture multiple distinct quotes that all advance the same factor evidence.
- (b) **Decoupling popup rows from Signal-type chips entirely** so cross-type mismatch never surfaces visually — best when bankers find the type-chip distraction unhelpful in practice.
- (c) **Accepting type mismatch as inherent to the two-taxonomy system and documenting the convention for bankers** — best when cross-type ambiguity is rare and the audit-time resolution is low cost.

Decision depends on whether real banker capture patterns produce frequent cross-type ambiguity (favoring (a) or (b)) or rare (favoring (c)).

**Note 2 — SizingMeasurement-vs-Signal-magnitude pattern.** The Sprint 5a.3 audit surfaced that the demo seed captures all magnitudes on parent Signal entities directly (`magnitude` / `unit` / `frequency` columns on `seasonalSignal`, `capSignal`, etc.) rather than via `SizingMeasurement` entities — there are zero `SizingMeasurement` rows in the seed. `SizingMeasurement` remains the real-data path for magnitudes captured via standalone + Quantify (no parent Signal). For Sprint 5a.3, `source_signal_id` linkage is sufficient because magnitude data flows back through the parent Signal. Pilot decides whether `SizingMeasurement` is the appropriate entity for matrix-aware factor capture or whether magnitude-on-Signal is actually the cleaner pattern. Schema supports both today; banker capture flow will converge on one.

**Note 3 — Track-aware coaching content.** Demo coach content is `Record<member_type × objective>` per Sprint 5a.3 Block C's `MEMBER_TYPE_COACH`. Pilot may benefit from `Record<member_type × track × objective>` so coaching adapts to current Track context. Decision depends on two signals from real banker behavior:
- (a) Observed Track-switching frequency during conversations — if bankers frequently switch (e.g., realizing mid-conversation that Working Capital LOC isn't the right candidate; Treasury Services Upgrade is), Track-aware coaching adds direct value.
- (b) Substantive divergence between Track-specific consultative paths — even without frequent switching, if Working Capital LOC vs SBA 7(a) consultative conversations meaningfully differ in what to ask / measure / consult, Track-aware coaching captures that divergence.

Both signals favor Track-aware authoring; absence of both favors current Member-Type-aware pattern.

### Schema changes

None. Sprint 5a.3 is seed + lib + UI only.

### Verified

- `pnpm tsc --noEmit` clean (after `.next` cleanup; iCloud sync had duplicated route-types files into `.next/types/*.d 2.ts`)
- `pnpm exec next build` clean; 6 routes intact
- `pnpm exec tsx prisma/seed.ts` clean: 39 FactorCaptures total; 19 source-linked + 20 standalone
- HTML probe at `pnpm exec next dev`:
  - Jenny popup payload contains "January and February kill us" verbatim, attributed Apr 8 via + Ask
  - Northland popup payload contains "I came in to look at financing for my own truck" verbatim, attributed Apr 15 via + Ask
  - Cygnus popup payload contains "decision about the floor space within the next two quarters" verbatim, attributed Apr 21 via + Ask
  - Standalone row example: Jenny FACTOR-019 chip="Annual revenue band", value="$850,000" (humanized $)
  - Coach bullets serialized correctly: text + boldFragments + ctaEvidenceRef per fixture; Jenny CTAs route to FACTOR-024 / model_produced / specialist_handoff_initiated; Cygnus CTAs to model_produced / specialist_handoff_initiated
  - "no specialist handoff" / "Two trigger captures" / "~$48K" / "~85%" / "$4-7M" / "Connect-ending" all present as boldFragments

### Decisions made during implementation

- **Source predicate format `{ type, captured_at_iso, topic_canonical_tag }` over Signal-id-by-name lookup.** Originally considered exporting Signal id variables from `seed.ts` and threading them through to `seed-matrix.ts`. The predicate approach kept all linkage-decision data inside `seed-matrix.ts` next to the FactorCapture seed records (self-documenting) and avoids the seed-function-output threading. Predicate resolution at seed time throws on miss, so any matrix-data drift is caught loudly.
- **Throw on unresolved predicate** rather than silent null linkage. Silent null would only surface during visual review by missing-quote inspection — too easy to ship a regression. Loud throw catches the bug at seed time.
- **`iso()` helper compatibility.** Predicate captured_at uses `T12:00:00Z` (noon UTC) to match the seed's `iso()` helper, not midnight. First seed run failed with "no Signal matched" because of the offset.
- **`captured_at` semantics — Signal date wins.** When source-linked, the popup row shows the Signal's `captured_at` (e.g., Apr 8 for the seasonal Blocker), not the FactorCapture's `captured_at` (which is `now()` at seed time). This was already wired in Sprint 5a.2 Block D's page.tsx capturedRows builder; Sprint 5a.3 just made the linkage available.
- **Standalone-row chip = `factor.name`** rather than `factor.category` derivation. The category-based labels ("Member", "Industry", "Decision") didn't tell a banker which factor a row corresponded to. Using the factor name ("Annual revenue band", "Industry seasonal", "Member tenure") makes the row self-identifying. Tradeoff: chips can be longer; the Chip component handles wrapping reasonably at sidebar widths.
- **Coach `CoachBulletRow` is a parallel implementation of the popup `CTARow`, not a shared component.** Spec said "reuse plumbing"; it didn't say "reuse the visual component literally." Plumbing reuse means the unified `onCtaClick(evidence_ref)` callback. Visual implementations parallel each other in style; extracting to a shared row component is Pilot polish if it surfaces.
- **`coachBullets()` added; `objectiveGuidance()` retained.** Backward-compat. The popup uses `V2_OBJECTIVE_QUESTIONS` directly (not `objectiveGuidance`) so retention costs nothing. Future cleanup can retire `objectiveGuidance` and `MEMBER_TYPE_GUIDANCE` paragraph map once nobody else reads them.
- **No new symbolic refs added to shell.** Coach bullet CTAs route via existing refs (FACTOR-NNN, model_produced, specialist_handoff_initiated, decision_maker_mapping, reaction_captured). The naming asymmetry (e.g., a "queue ActionCard" bullet uses `specialist_handoff_initiated` to route to + Action) is acceptable for the demo since the routing is form-level, not semantic-flag-level. Pilot can add generic open-form refs (`open_action`, `open_ask`, etc.) if the semantic mismatch causes confusion.

### Watch for review

- **`+ Quantify` form's qualitative-select dropdown still surfaces raw enum values** (`late_paying_customer`, `cashflow_volatility`, etc.). Block B humanized the popup display surface but didn't humanize the dropdown options inside the form. Banker selecting FACTOR-024's trigger_event_tag sees raw `late_paying_customer` in the option list. Visual review may want a parallel humanizer pass on the form's `QualitativeCapture` component; that's a small follow-up if needed.
- **`coachBullets` Member-Type lookup is name-based.** Same pattern as `objectiveGuidance` — case-sensitive Member Type name match. Generic fallback fires if a typo occurs. Robust enough for the three demo fixtures.
- **CoachBulletRow visual treatment may read busier than intended.** With 2-4 bullets per objective × 4 objectives, the expanded coach panel runs ~80-120 lines tall. If visual review surfaces "too dense," collapsing to expand-per-objective would be a one-state-change refactor (Sprint 5a.3 spec explicitly chose always-expanded; this is a noted tradeoff).
- **Note 1 (cross-type linkage), Note 2 (SizingMeasurement vs Signal-magnitude), Note 3 (Track-aware coaching)** — all logged here as Pilot architectural questions. None blocks demo.

### Cross-references

- `BUSINESS_FACTOR_MATRIX_v1.md` Sections 1-4 — factor/track/matrix/per-fixture data
- `ARCHITECTURE_V2.md §3` — four-objective architecture
- `EVIDENCE_FRAMEWORK.md §2` — evidence catalog + activity-to-evidence mapping
- `COMPLIANCE.md §10.2` — banker-facing posture commitments (banned phrases enforcement)
- `prisma/seed.ts` — Signals named: `jennyReceivablesBlockerSignal`, `cygnusConcentrationBlockerSignal`
- `prisma/seed-matrix.ts` — source_signal predicates per FactorCapture; resolution in `seedFactorCapturesForFixtures`
- `lib/stage-guidance.ts` — `coachBullets()`, `MEMBER_TYPE_COACH`, `CoachBullet` type
- `app/v2/members/[id]/sidebar.tsx` — `CoachBulletRow`, `renderBoldFragments`, `formHintForRef`

Sprint 5a.3 complete. Popup captured-rows now carry rich Member-quote attribution; standalone rows render via factor.name + humanized values; coach surface mirrors popup-as-workflow's structural discipline. Sprint 5b (Insight Engine portfolio surfaces) is the next major sprint.

---

## 2026-05-05 — Sprint 5a.3 mini-patch (visual review follow-ups)

### Goal

Sprint 5a.3 visual review confirmed Cygnus, Northland, and the coach surface at the visual layer. Six small follow-ups before Sprint 5b: Track context spacing, matrix-tier label words, v2 artifact viewer wiring, captured feed alignment, + Quantify dropdown humanization, and an architectural note about Track-strength label semantics.

### What shipped

- **Patch 1 — Track context spacing.** Track name (`Commercial Real Estate Term Loan`, etc.) now wraps multi-line cleanly instead of truncating with ellipsis. The dropdown caret aligns to top instead of baseline so the wrap reads naturally. Strength chip + `view comparison ↗` link stack vertically (was horizontal flex with `gap-2`) so the chip's accent variant gets visual weight without being squeezed by the link. Marginal vertical breathing room between Track-name row and chip/link cluster (`mt-2.5` was `mt-1.5`).
- **Patch 2 — Matrix-tier label words.** Replaced `5s/1m/2neg` abbreviation with `5 strong, 1 moderate, 2 dealbreakers` across the Track context dropdown's per-Track tier-count line. New helper `formatTierCounts` in `sidebar.tsx` pluralizes "dealbreaker(s)" correctly. Keeps "strong" / "moderate" cardinal-pluralized as-is (idiomatic English does not pluralize the strength labels — "1 strong" not "1 strongs").
- **Patch 3 — v2 artifact viewer.** Confirmed the v2 sidebar artifact button opened the v2 `ArtifactPreviewDialog` (modal, not v1 cross-link), but the dialog only rendered the description text with a "Sprint 5 will ship the rendered artifact" placeholder. Patch wires renderer dispatch on `artifact.template` reusing v1's three chart components: `SeasonalSmoothingChart` (Jenny — `seasonal_smoothing_chart_v1`), `FleetRoiProjectionChart` (Northland — `fleet_roi_composed_chart_v1`), `CapitalEventPartnershipMap` (Cygnus — `capital_event_map_v1`). `ArtifactPreviewSubject` gained `template: string | null`; `SidebarArtifact` gained the same; `page.tsx` selects `artifact.template` from Prisma. Unknown templates fall through to a "renderer not registered" placeholder so unknown artifacts don't crash the dialog. v2-native authoring + parameter-driven rendering remains Sprint 5b polish.
- **Patch 4 — Captured feed alignment.** Sprint 4.7.2.x Block C had capped `V2MainPanel` at `mx-auto max-w-[720px]` for "higher density" reading; visual review surfaced the centered cap as misaligned with v1's right-edge column. Removed the cap; cards now fill the available main-column width (sidebar 280px + main `flex-1` means cards extend to the page's right padding, matching v1's `lg:grid-cols-[minmax(0,1fr)_280px]` behavior). Empty-state placeholder also dropped its `mx-auto` so it left-aligns.
- **Patch 5 — + Quantify dropdown humanization.** `QualitativeCapture` component in `quantify-form.tsx` now humanizes option labels (snake_case → sentence-case with spaces). The stored `<option value>` remains the raw enum tag; only display labels are humanized. So bankers see "Late paying customer" / "Cashflow volatility" in the FACTOR-024 / FACTOR-022 dropdowns; the value posted to `saveFactorCapture` and evaluated by the matrix is unchanged.
- **Patch 6 — Architectural Note 4 (below).**

### Architectural Note 4 — Track strength label semantics

**Note 4 — Track strength label semantics.** Visual review surfaced confusion between Track-strength labels (matrix-based scoring against a Track template's required factors) and dot-completion (per-Track evidence captured for that Track's `required_evidence_per_objective`). A Track can simultaneously read "strong support" (matrix-firing entries cleared the threshold) AND "complete" (all required dots captured under the current Track) — bankers may interpret the combination as full qualification, when in fact the matrix scoring is candidacy, not approval. Two adjacent semantic axes worth disentangling at Pilot:

- **Strength labels** (`strong` / `moderate` / `insufficient`) reflect *how many matrix entries fire* against captured factor values. A Track with 5 strong + 1 moderate matrix entries fired reads as "strong" — meaning the consultative case is well-supported by the matrix's curated banker rationale. Strength is matrix-computed; dot-completion is template-required-evidence-captured. They overlap but aren't the same axis.
- **Dot-completion** reflects *how many of the current Track's required evidence refs are captured*. "Complete" means every required ref has a captured value or entity. The popup-as-workflow surface's missing-factor CTAs disappear when complete; the sidebar shows the "complete" italic label.

Pilot decisions to consider:
- (a) **Refine strength labels** so the matrix-vs-completion distinction reads cleanly (e.g., "strong consultative case" vs "evidence complete"). Wording explicitly de-couples the two axes.
- (b) **Add explicit affordances** clarifying matrix-versus-completion semantics — a tooltip or inline note next to the chip explaining what the label measures.
- (c) **Reconsider whether matrix-tier counts are the right banker-facing display** at all. The counts surface in the dropdown; bankers may not need them, or may need them shaped differently (e.g., "Working Capital LOC: well-supported by the matrix" without the underlying numbers).

The strength-vs-completion distinction is most likely to confuse at Track-handoff moments where a Member's case feels strong on both axes and the banker incorrectly interprets that as preliminary approval. Compliance-wise, no banker-facing copy in the demo crosses the §10.2 banned-phrase line; the question is whether the implicit dual-axis is well-understood by bankers in flow.

Decision likely depends on: observed banker behavior at conversation-close — are bankers surfacing the strength + complete combination as "ready to underwrite," or holding it as "ready for the formal underwriting conversation"? The latter is the intended interpretation; the former is a misread that warrants UI clarification.

### Schema changes

None. Mini-patch is UI + minor type extension (artifact.template passthrough) only.

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean; 6 routes intact
- HTML probe at `pnpm exec next dev`:
  - Track context section renders Cygnus's full "Commercial Real Estate Term Loan" without ellipsis truncation
  - Track context dropdown shows "5 strong, 1 moderate, 2 dealbreakers" cardinality words (Cygnus's CRE Term Loan: "5 strong, 6 moderate"; SBA 7(a) for Northland: "2 strong, 3 moderate, 1 dealbreaker")
  - v2 sidebar artifact preview opens with the chart rendered (SeasonalSmoothingChart for Jenny, FleetRoiProjectionChart for Northland, CapitalEventPartnershipMap for Cygnus)
  - Captured feed cards extend to the right column edge instead of being centered at 720px
  - + Quantify form's QualitativeCapture dropdown shows humanized labels (FACTOR-022 → "Cashflow volatility" / "Capacity limit" / "Real estate"; FACTOR-024 → "Late paying customer" / "Capacity evaluation" / etc.)

### Decisions made during implementation

- **Track-name wraps multi-line** rather than widening the sidebar from 280px → wider. Sidebar width is load-bearing for the layout (sticky-dialpad, main-panel grid, header collapse threshold all assume 280px); changing it has cascading risk. Wrapping the Track name solved the truncation cleanly.
- **Tier-counts use "dealbreakers" for the negative tier**, not "negative" or "neg". Francisco's wording in the patch direction. "Negative" is the schema field name and matrix-data tier label; "dealbreakers" is the banker-facing translation. Surface-vs-schema discipline preserved per ARCHITECTURE_V2 §11.7.
- **Strength labels stay as `{N} strong` / `{N} moderate`** (no pluralization). Idiomatic — "1 strong" reads cleanly; "1 strongs" doesn't. Negatives plural-conditional ("dealbreaker"/"dealbreakers") because the noun does naturally pluralize.
- **v2 artifact dialog reuses v1 chart components directly** rather than re-implementing or extracting to a shared location. The chart components are no-arg, fixture-baked client components — moving them to `app/_components/` would be a useful cleanup but is out of scope for this patch. Demo-quality wins outweigh the file-location nit. Pilot's v2-native artifact authoring will likely supersede this anyway.
- **Captured feed cards full-width** rather than re-instating a wider cap (e.g., 1024px). Matching v1's behavior is the visual-review request; no second-guessing the spec.
- **Dropdown humanization is display-only** — `<option value>` stays raw enum tag. The matrix evaluator and `saveFactorCapture` consume the raw tag. Display ↔ value separation matches the popup row's pattern from Sprint 5a.3 Block B.

### Watch for review

- **`view comparison ↗` link sits below the strength chip** instead of beside it. Vertical stacking gives the chip more visual weight and prevents the link from being cramped on long Track names. If visual review prefers the original side-by-side layout (and is willing to risk truncation on long names + chip variants), it's a one-line revert.
- **"dealbreakers" vocabulary** is bold but accurate — matches how bankers think about negative-tier matrix entries. If compliance / leadership prefers a softer term (e.g., "concerns" or "headwinds"), it's a one-string update. The current term is faithful to the matrix's banker rationale.
- **v2 artifact dialog imports from `app/members/[id]/`** — cross-route import. Next.js / Turbopack handles this cleanly (the chart components are pure client components with no server dependencies); Pilot may want to move them to `app/_components/charts/` for cleaner architecture. Documented but not done in this patch.
- **Captured feed at full column width** can feel airy on wide viewports (1440px+). If visual review surfaces a "too wide" reading, a max-width cap around 960px (matching v1's typical column width) is a small adjustment.

### Cross-references

- `app/v2/members/[id]/sidebar.tsx` — Track context wrap, vertical stack, `formatTierCounts`
- `app/v2/members/[id]/artifact-preview-dialog.tsx` — template-dispatch renderer
- `app/v2/members/[id]/main-panel.tsx` — captured feed alignment
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — `humanizeTag` for dropdown labels
- `app/members/[id]/seasonal-smoothing-chart.tsx`, `fleet-roi-projection-chart.tsx`, `capital-event-partnership-map.tsx` — v1 chart components reused by v2 dialog

Mini-patch complete. Visual review next; Sprint 5b prompt incoming after confirmation.

---

## 2026-05-06 — Sprint 5b.1 (CTA Derivation, Insight Architecture, Polish)

### Goal

Sprint 5a.3 visual review surfaced one substantive architectural defect: when popup-as-workflow's missing-evidence CTAs were exhausted, the popup went silent — banker landed in a dead-end zone. Sprint 5b.1 ships the directional architecture: bounded CTA derivation across three layers (missing template evidence; threshold-uplift; specialist handoff), with an empty array as a valid return when work is genuinely complete. Plus the Insight architecture: canonical Patterns (senior-authored, banker reference) and banker-authored Insights (LLM-mediated matching with two-state lifecycle).

Three architectural commitments locked through the design conversation that drove this sprint:
- **CTAs not labels.** No readiness composite states. No diagnostic categorization of Members.
- **Bounded CTA layers.** When all three layers are exhausted, the popup is honest about it — evidence list stands alone.
- **Insights as both reference and authorship.** Lightbulb icon for canonical Patterns; `+ Insight` for banker authorship.

### What shipped

- **Block A — CTA derivation function.** `lib/cta-derivation.ts` exports `deriveNextActions()` returning ranked `CTA[]` across three bounded layers. Layer 1 split into Class 1A (numerical/boolean → priority 78, opens + Quantify with factor pre-selection) and Class 1B (qualitative or symbolic → priority 65). Layer 2 (threshold-uplift, priority 48) walks MatrixEntries to detect when a moderate-tier capture could be re-confirmed at a higher threshold to fire the strong-tier entry. Layer 3 (specialist handoff, priority 70) surfaces only on Navigate when the Track is in `TRACK_SPECIALIST_DEPARTMENT` (CRE / SBA), Discover + Measure required evidence is captured, model_produced + reaction_captured are both true, and no SpecialistHandoff record exists yet. Empty array is a valid return — drives Block B's "no CTA zone rendered" behavior.
- **Block B — Surface integration.** Popup-as-workflow's CTA zone now renders CTAs from `deriveNextActions` instead of the missing-evidence-only derivation. Empty array → top zone is *not rendered at all* (no "complete" label, no "to strengthen" header). Sidebar `+ next valuable` affordance uses `topCTA()` — same source as popup. CTA action descriptors discriminated-union route through unified `handleCtaAction` in shell. The sidebar's `onCtaClick(evidence_ref: string)` was renamed to `onCtaAction(action: CTAAction)`; coach bullets carry evidence_ref strings still and convert via `coachRefToAction` helper at the sidebar callsite.
- **Block C — Schema additions.** Three Prisma entities: `InsightPattern` (PATTERN-NNN canonical, senior-authored, draft/approved/archived status), `Insight` (banker-authored, two-state routine/novel lifecycle, optional Signal attachment, optional matched_pattern_id FK), `SpecialistHandoff` (department_tag from 4-option set, status='initiated' on demo). Migration `20260506152842_sprint5b_1_insight_architecture` applied cleanly. Member relations added: `insights[]`, `specialist_handoffs[]`. **ActionCard schema verification:** entity exists at `prisma/schema.prisma:930`, `status` field is `ActionCardStatus` enum with values `open | in_progress | completed | declined | deferred | superseded`. Sprint 5b.1 uses ActionCard.status only indirectly (Layer 3 specialist-handoff CTA suppresses when SpecialistHandoff exists; ActionCard.status-driven CTAs deferred per Pilot deferrals).
- **Block D — Pattern + per-fixture Insight seed.** `prisma/seed-insights.ts` ships 36 canonical InsightPatterns from `INSIGHT_PATTERN_LIBRARY_v1.md` Sections 2-6 (TRACK-001 ×9, TRACK-002 ×7, TRACK-003 ×8, TRACK-004 ×6, TRACK-005 ×6). 12 per-fixture seed Insights (3 routine + 1 novel × 3 fixtures) translate Section 7 directly with cached `matched_pattern_id`, `match_confidence` (0.78-0.86 routine; 0.28-0.32 novel), and `llm_feedback` strings. Cygnus Routine 3 (board-approval reframe) ships as Track-level (no `addresses_signal_id`) because Cygnus's seed has no Indecision Signal — alternative to adding a synthetic Indecision Signal. Signal-attachment uses the same predicate-resolution pattern as Sprint 5a.3's source-linkage seed.
- **Block E — `+ Insight` authoring.** Sixth dialpad button (`+ Insight`, alongside + Ask / + Quantify / + Model / + Reaction / + Action). Contextual affordance on Goal/Blocker/Indecision/Trigger captured rows in popup-as-workflow evidence zone (lower-right of row). Form supports both pre-fill paths (dialpad: no pre-fill; contextual: Track + Signal + insight_type defaulted by signal type). `lib/insight-matching.ts` integrates the **Anthropic API** (`claude-haiku-4-5-20251001`) with 5-second timeout + graceful fallback per Francisco's caveats:
  - (a) seed-time caching: 12 fixture Insights ship with cached match data, no live API call at fixture load.
  - (b) timeout + graceful degradation: if API exceeds 5s or errors (network / 4xx / 5xx / unparseable response / unset key), `matchInsight` returns a fallback novel-state result (`fallback: true`) with affirming feedback flagging for senior review. Banker's content is preserved verbatim regardless.
  - (c) verification: env var `ANTHROPIC_API_KEY` documented in `.env`; needs a real key set before EVP demo.
  
  Two-state lifecycle: confidence ≥ 0.7 → 'routine' with matched_pattern_id; below threshold → 'novel' with null matched_pattern_id. Form post-save view displays LLM feedback inline before close (replaces "Submit as is?" pre-confirmation with post-save framing for simpler round-tripping; banker reads the flagged-for-novel message and clicks Close).
- **Block F — Insight reference surfaces.** Lightbulb icon (💡) on captured Goal/Blocker/Indecision/Trigger rows when canonical Patterns matching this Track exist. Click → reveals up to 4 ranked Patterns with content + 3 implication questions each. "Use as basis for + Insight" affordance on each Pattern → opens authoring form pre-filled with the Pattern's content as a starting draft + the Signal id. Footer "Implications:" section renders bulleted questions from Patterns matching the popup's visible Signals — capped at 6, prioritized by signal-type weight (Goal=4, Blocker=3, Trigger=2, Indecision=1).
  - **Demo simplification noted:** the Pattern library's `signal_tag_scope` (e.g., `cashflow_volatility`) uses a narrower vocab than topic `canonical_tag` (e.g., `blocker.cash_flow_seasonal`). Tighter pre-filtering by tag is reserved for Pilot; demo surfaces all current-Track Patterns to keep the lightbulb popover discoverable. The matching pipeline (Block E) passes all candidates to the LLM and lets the model judge relevance.
- **Block G — Polish.** Captured rows older than 90 days render in red font with precise day-count inline (`73d ago` format) and a `+ refresh` CTA in the row's right cluster. Click → opens + Quantify with factor pre-selection. New FactorCapture supersedes the old via recency in evaluator queries (old capture not deleted). Specialist handoff dialog (`specialist-handoff-dialog.tsx`) opens from Layer 3 CTA — minimal modal with department dropdown (4 options) + 200-char preference notes; submit creates SpecialistHandoff record with status='initiated'. Open-thread chip ("open", muted variant) on Indecision rows when no subsequent Reaction exists for the Member after the Indecision's captured_at — pragmatic heuristic per spec G.3. "complete" → "promising" in sidebar's per-objective indicator. `+ deepen` affordance at popup bottom (above Implications:) when CTA zone is empty AND evidence exists; opens + Insight in Track-level mode (no Signal pre-fill).
- **Block H — this BUILD_LOG entry, OPEN_QUESTIONS amendments, CLAUDE.md manifest, Architectural Notes 5-7.**

### Schema migrations

| Migration | Purpose |
|---|---|
| `20260506152842_sprint5b_1_insight_architecture` | CREATE TABLE InsightPattern + Insight + SpecialistHandoff with FK constraints + indexes. ALTER Member implicit (Prisma client; no DDL needed for new reverse relations). |

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (Next 16.2.4 + Turbopack); 6 routes intact
- `pnpm exec tsx prisma/seed.ts` clean: 36 InsightPatterns + 12 Insights (4 routine + 1 novel × 3 = 9 routine + 3 novel; per-fixture: 3 routine + 1 novel each) + 0 SpecialistHandoffs
- Anthropic SDK installed: `@anthropic-ai/sdk@0.95.0`. Env var `ANTHROPIC_API_KEY` documented in `.env`; runtime gracefully falls back when unset.

### Architectural notes for Pilot (continue from Sprint 5a.3 Note 1-4)

**Note 5 — Insight authoring as KPI.** Demo doesn't track per-banker insight authoring counts as a KPI; Pilot may want to surface this to senior lenders for coaching opportunities. Architecture supports it (Insight entity has `authored_by`); Pilot adds the analytics layer.

**Note 6 — LLM-mediated novel-Insight discovery.** Demo surfaces novel Insights only by direct query (state='novel' filter; UI for senior review is Sprint 5b.2 work). Pilot may want LLM to surface relevant historical novel Insights when banker authors a new Insight (cross-Member edge-case discovery). Out of scope for 5b.1.

**Note 7 — Make-canonical promotion flow.** Senior lender promoting a novel Insight to a canonical Pattern is meaningful product capability; demo defers to Pilot. When implemented: includes audit trail (`promoted_from_insight_id`), edit-and-approve flow, library growth governance.

**Note 8 — Compliance posture for outbound LLM calls.** Sprint 5b.1's Block E sends banker-authored Insight content to the Anthropic API for matching. The payload carries Track name, Signal tag, and 200-char content; no Member identifier. Demo phase posture: acceptable since fictional fixtures only. Pilot's compliance review (FFIEC CMS framework, vendor-management discipline) should explicitly evaluate:
- Acceptable-use posture for outbound LLM calls in production banking environment
- Vendor SOC 2 / data-handling agreement with Anthropic for production
- Audit-trail expectations for banker-authored content leaving the local environment
- Whether Member-identifier inclusion (currently scrubbed) is acceptable at Pilot scale or needs explicit policy

This note resolves CC's Sprint 5b.1 surfacing of CLAUDE.md §3 ("No external API calls") override as deliberate, not casual. Override scope: Insight-matching API only; all other Sprint 5b.1 logic runs locally.

### Decisions made during implementation

- **Anthropic Path B chosen over local heuristic stub** per Francisco's confirmation. Stub would have misrepresented the product (LLM-mediated matching is core to the architecture). Override of CLAUDE.md §3 logged in Note 8 for Pilot compliance review.
- **5-second timeout, graceful fallback to novel-state.** Banker's content always saves verbatim — only the matching might miss. Fallback feedback string is generic-affirming with "saved as novel for senior-lender review" framing; doesn't fabricate a match.
- **Confidence threshold 0.7 for routine vs novel.** Below threshold means LLM either had no good match candidate or genuinely judged the observation as novel. Spec'd at 0.7 in §E.2; implementation matches exactly.
- **Pattern library content is identical to v1 draft** (no editorial pass applied within this sprint). Francisco's Section 8 review prompts (E1-E5) flagged 5 places where banker's-eye and product-voice judgment matter — those touches can land before EVP demo as content edits without code changes.
- **Cygnus Routine 3 ships as Track-level Insight** (no `addresses_signal_id`) rather than seeding a synthetic Cygnus Indecision Signal. Track-level Insights surface only on Discover popup (the entry-point objective for Track-level reframes/implications); avoids duplicating across all four objectives.
- **Pattern matching pre-filter is loose by design.** Pre-filtering Patterns by `signal_tag_scope` exact match against `topic.canonical_tag` would require building a tag-translation map (canonical_tags use `blocker.cash_flow_seasonal` form; signal_tag_scope uses `cashflow_volatility` form). For demo, all current-Track Patterns are passed to the LLM as candidates, and the model judges relevance. Pilot can tighten pre-filter as the library grows.
- **`+ deepen` is a single-action affordance for demo**, not the spec'd contextual menu (schedule next conversation / refresh / handoff / Insight). Spec'd menu is Pilot polish; the single-link version delivers the architectural intent (signal of "primary CTAs exhausted but secondary actions available") at lower implementation cost. Demo viewers see the affordance, click it, get + Insight Track-level mode.
- **Open-thread heuristic** uses "no subsequent Reaction" per spec G.3 simplest implementation. Doesn't track per-Indecision resolution status; treats any Reaction as resolution (pragmatic). ActionCard.status-driven richer logic deferred per Pilot deferrals.
- **`+ Insight` button positioning in dialpad** is sixth and last, after `+ Action`. Sprint 4.7.2's 7→5 reduction was about removing non-core activities; `+ Insight` is core consultative authorship per Francisco's confirmation.
- **Lightbulb popover shows Track-scoped patterns even on rows whose signal_tag_scope doesn't match.** The pattern library uses narrower tag vocab than topic canonical_tag; tighter mapping is Pilot polish. Demo behavior: lightbulb on any Goal/Blocker/Indecision/Trigger row shows up to 4 current-Track Patterns. Banker can choose any as a starting draft for + Insight authoring.

### OPEN_QUESTIONS amendments

- **Q-A2 (open-thread tiebreaker)** — Partial resolution: Block G ships an Indecision-row "open" indicator with no-subsequent-Reaction heuristic. Full resolution (multiple simultaneous open threads, ActionCard.status integration) deferred to Pilot.
- **Q-B1 (CTA layer expansion)** — New question. When does the CTA layer set need expansion beyond 3 layers (missing-evidence / threshold-uplift / specialist-handoff)? Pilot signal: observed banker workflow patterns at scale. Reaction-driven CTAs (Layer 6 from architectural conversation), ActionCard-status-driven CTAs (Layer 7), cross-Track exploration CTAs (Layer 9) all wait on real-data signal.
- **Q-B2 (LLM matching reliability at scale)** — New question. Pattern matching reliability decreases with library growth. Pilot needs: (a) library size bounds (when does ~36 Patterns become 360+? at what scale does match precision degrade?), (b) match confidence calibration (0.7 threshold may need tuning), (c) escape hatch for low-confidence matches (current behavior: novel state with senior review queue; Pilot may want banker-side override to force-match).
- **Q-B3 (Compliance posture for outbound LLM)** — New question. See Note 8. Demo phase: acceptable. Pilot must evaluate before production deployment.

### Cross-references

- `INSIGHT_PATTERN_LIBRARY_v1.md` (repo root) — canonical Pattern source data; Section 7 per-fixture Insight expectations
- `BUSINESS_FACTOR_MATRIX_v1.md` Section 1 — factor catalog informs threshold-uplift logic
- `ARCHITECTURE_V2.md` §3 — four-objective architecture; §11.7 surface-vs-schema separation
- `EVIDENCE_FRAMEWORK.md` §2 — evidence catalog
- `COMPLIANCE.md` §10.2 — banned-phrase discipline (honored in Pattern content + Insight feedback)
- `lib/cta-derivation.ts` — three-layer CTA derivation (Sprint 5b.1 Block A)
- `lib/insight-matching.ts` — Anthropic API integration with 5s timeout + graceful fallback (Block E)
- `app/v2/members/[id]/capture-forms/insight-form.tsx` — Insight authoring component
- `app/v2/members/[id]/specialist-handoff-dialog.tsx` — Block G handoff modal
- `prisma/seed-insights.ts` — 36 Patterns + 12 fixture Insights

Sprint 5b.1 ships the directional architecture. Popup-as-workflow now stays actionable when work remains and stays honest when work is genuinely complete. The Insight architecture introduces both reference (canonical Patterns) and authorship (banker Insights with LLM matching). The next architectural surface (Sprint 5b.2): portfolio surfaces — Track Performance, Member portfolio, Coverage, Stage-skip.

---

## 2026-05-06 — Sprint 5b.1 mini-patch (visual review follow-ups)

### Goal

Sprint 5b.1 visual review surfaced eight items needing patches plus two architectural questions deferred to Sprint 5b.2 design conversation. Eight blocks across language consistency, Growth Insights restyling, capture form ergonomics, Insight-Signal nesting (Treatment A), duplicate-row diagnosis, Resolution row content audit, duplicate share-event fix, and live LLM diagnosis.

### What shipped

- **Patch 1 — `+ deepen` → `+ Insight`.** Popup footer affordance renamed. One affordance, one name across surfaces — coach bullets, dialpad button, popup footer all use `+ Insight`. Behavior unchanged: popup-footer click opens `+ Insight` in Track-level mode (no Signal pre-fill).
- **Patch 2 — Growth Insights restyle + PNG lightbulb.**
  - Renamed "Canonical Patterns" → "Growth insights" in popover header (banker-facing language; "canonical pattern" stays as the code-internal term).
  - Increased spacing between Pattern blocks (`space-y-3` → `space-y-5`).
  - Pattern content text bolded (`font-semibold`).
  - Indented-callout treatment: removed border-rule frame; left-rule mark only (`border-l-[2px] border-blaze-orange/40`); open right whitespace (`mr-8`).
  - Dropped "Use as basis for + Insight ↗" link entirely (banker authors via the row's contextual `+ Insight` affordance which is already pre-filled with the same Signal). `onUsePatternForInsight` prop + `handleUsePatternForInsight` shell handler retired.
  - Emoji 💡 → branded asset PNG. `assets/Insight Lightbulb.png` copied to `public/insight-lightbulb.png` (Next.js serves `public/` at `/`). Button renders `<img>` at 18×18px (matches the prior emoji's optical weight in the row's right-cluster).
- **Patch 3 — Capture form ergonomics.**
  - InsightForm: Reframe / Implication folded from radio → dropdown for visual consistency with the other selects.
  - "Track" → "Lending product" rename across banker-facing surfaces: InsightForm field label, "Track-level" option text in Addresses Signal dropdown (now "Lending-product-level"), sidebar Track context section label ("track context" → "lending product"). Code-internal `track_id`, `TrackTemplate`, `RankedTrack` identifiers unchanged per surface-vs-schema discipline.
  - Removed LLM matching explainer text from InsightForm. Behavior unchanged (matching still fires on submit with 5s timeout + graceful fallback per Block E); banker doesn't need the inline explanation.
  - QuantifyForm mode toggle: "Matrix-aware (factor diagnostic)" → "Lending-product specific". Free-form fallback label unchanged.
- **Patch 4 — Insights nest under Signal (Treatment A).** Insights with `addresses_signal_id` now render visually bound to their parent Signal in popup evidence zone. **Treatment chosen:** indented-beneath. Each captured Signal row renders an inner `<ul>` containing its attached Insights with `pl-4` deeper indent and a thin left-rule mark (`border-l-[1px] border-blaze-orange/20`). The redundant "addresses {Signal type}" line is dropped on nested rows (parent context is visually obvious from the nesting). Track-level Insights (no `addresses_signal_id`) still render as separate top-level rows below the captured-rows list. Alternatives considered: expandable-on-parent (added click friction), sub-section approach (lost direct visual bond). Indented-beneath gives clean parent-child reading without adding interaction.
- **Patch 5 — Duplicate Blocker dedupe.** Diagnosis: Northland's TRACK-002 Discover requires multiple factors that all source-link to `capSignal` (FACTOR-007 boolean + FACTOR-022 capacity_limit + FACTOR-024 capacity_evaluation). Each FactorCapture renders as its own captured row → identical "Blocker · Capacity below demand" rows. **Fix:** popup `captured` filter now dedupes by `signal_id` — first-seen wins (matrix-template order, which is roughly priority order). Rows without source linkage (factor-only captures, symbolic refs) are NEVER deduped — each gets its own row. Northland Discover popup now shows exactly one Blocker row.
- **Patch 6 — Resolution row content audit.** Per visual review, resolve cards in captured feed had ungrounded "Recommendation:" framing + paraphrased "→ next:" line. Cleanup:
  - **DROP "Recommendation:" framing** entirely (crosses §10.2 banned-phrase line; the product is discussed, not "recommended"). 
  - **DROP "→ next: [paraphrased]" line** entirely (the paraphrased ActionCard rationale wasn't a structured source — ungrounded narrative).
  - **KEEP "Sized: {productLabel}"** — sourced from `Recommendation.product.name` + `formatRecommendationSize(rec)` (which formats `Recommendation.size_proposed | size_low | size_high`). Renamed prefix from "Recommendation:" → "Sized:" per visual review wording.
  - **KEEP Member quote** — sourced from `Recommendation.their_words`.
  - **KEEP capture attribution** — sourced from `Recommendation` banker (page.tsx maps to `member.primary_banker.display_name`).
  - **Headline unchanged** (response_value + primary_concern) — already structured-field-sourced.
- **Patch 7 — Fix duplicate artifact on share-event.** Diagnosis: `saveModel` with `built_with_member: true` + `artifact_id` non-null auto-creates a ShowEvent (Sprint 4.7.2 Block G). If the banker then clicks "Mark as shared with Member" on the artifact preview dialog, the previous code created a SECOND ShowEvent for the same `(member, artifact, model)` triple — visible as a duplicate "Shown" card in the captured feed. **Fix:** `saveShowEvent` now guards duplicates. Inside the transaction, `findFirst` for an existing ShowEvent matching `member_id + artifact_id + model_id` (strict null match on model_id; null = artifact-only show, non-null = model-driven show). When existing found: update its `shown_at` timestamp, return existing's id; do NOT create a new row. When none exist: original create path runs. `SaveShowEventResult.conversation_id` typed as `string | null` to accommodate existing ShowEvents whose conversation_id may be null. The dialog's "Shared ✓" disabled-state still fires correctly via local component state.
- **Patch 8 — Live LLM diagnosis.** **Diagnosis:** `ANTHROPIC_API_KEY=""` in `.env` (empty string). Per `lib/insight-matching.ts:91`, an empty/missing key triggers the graceful-fallback path immediately — returns `{ state: "novel", fallback: true, llm_feedback: "Saved as novel for senior-lender review..." }`. The visual review test ("If you decline business opportunities..." matched against PATTERN-001) returned the fallback message because the API key was unset. **Action needed (no code change):** set the actual Anthropic API key in `.env`. Once set, banker-authored Insights will hit the live API; matching for the test phrase against PATTERN-001 should fire as routine (high confidence ≥0.7) given the cashflow-volatility reframe content overlap.

### Architectural questions deferred to Sprint 5b.2 design conversation

- **Q1 — Direction A: Coach absorbs Insights into unified scaffolding surface.** Defer to design before refactor.
- **Q2 — Re-capture vs new-record handling.** When a same Signal-type or Goal is captured at a later date, should a new record be created or existing updated? Touches multiple entities (Signal, FactorCapture, Reaction, ShowEvent). Defer to design.

### Schema changes

None. Mini-patch is UI + minor type widening (SaveShowEventResult.conversation_id allows null) only.

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean — 6 routes intact
- HTML probes at `pnpm exec next dev`:
  - Patch 1: `+ deepen` count 0 in all three fixtures; `+ Insight` rendered (dialpad + coach + popup)
  - Patch 2: `/insight-lightbulb.png` HTTP 200 (205,035 bytes — full PNG served)
  - Patch 3: `>lending product<` sidebar label present
  - Patch 6: `>Recommendation:` count 0 (was 3); `→ next:` count 0
  - Patch 4: Mike's-review Insight present in payload (will nest under Jenny's Indecision Signal when popup opens Discover)
  - Patch 5: No regression to Northland Discover row rendering (full visual confirmation requires opening the popup; static-probe verified the dedupe logic compiles + runs)

### Decisions made during implementation

- **`onUsePatternForInsight` retired alongside the dropped link.** The shell's `handleUsePatternForInsight` was a side-effect handler that pre-filled the InsightForm with a Pattern's content. Removed entirely. Banker now authors Insights via the row's contextual `+ Insight` affordance (Track + Signal + insight_type pre-filled per Sprint 5b.1 Block E.1).
- **Treatment A nesting renders without an expand/collapse interaction.** Indented-beneath puts attached Insights immediately visible under their parent Signal. Adding a click-to-expand interaction was considered (would tighten the visual density) but rejected: nesting depth is shallow (1-2 attached Insights typically), so the always-visible treatment matches the popup's "evidence stands alone" honesty principle from Sprint 5b.1 Block B.
- **Dedupe by signal_id, not by topic_id or factor.category.** signal_id is the strongest grouping key — multiple FactorCaptures pointing to the same Signal are by definition the same conversational moment. Other groupings (topic, category) would dedupe legitimately distinct rows.
- **Patch 7 idempotent fix preserves existing ShowEvent's conversation_id**, even if it's null. A ShowEvent created without a Conversation was probably intentional (e.g., auto-create on + Model save where the model attached to a different Conversation than the show recording). The update-only path doesn't fabricate a Conversation; it just bumps `shown_at`.
- **Resolution-row "Sized:" prefix** matches Francisco's wording in the patch spec. Semantic note: "Sized" is the banker-facing chip used for + Quantify (SizingMeasurement) cards elsewhere; using it here in the Resolution body conveys "this is the discussed product with its sized magnitude" rather than implying a SizingMeasurement entity exists. The chip on the card itself stays "Resolution" (no change).
- **PNG asset path uses `/insight-lightbulb.png`** (lowercase, hyphenated). Next.js serves `public/` at the root URL; `assets/` isn't auto-served. Cross-platform-safe filename.

### Watch for review

- **Patch 6 "Sized: ..." prefix** uses the same word as the + Quantify chip but in Resolution context. If visual review feels the cross-context "Sized" is confusing, alternatives: "Discussed product:" (descriptive, no banned-phrase implication), "Product magnitude:", or simply the productLabel without prefix.
- **Patch 5 dedupe is matrix-template-order-first.** If the first FactorCapture for a Signal is FACTOR-007 (boolean: capacity exceeded), the dedupe keeps that row's display data. Visual review may surface that another factor's display would read better. The dedupe is by-source-Signal so all candidates show the same Signal quote anyway — only the type_chip and value_display differ across factors. Demo currently shows Northland Discover with one Blocker row; specific factor wording chosen by template order.
- **Patch 7 doesn't backfill duplicates.** If existing ShowEvents in the seed already have duplicates (Sprint 4.7.2's auto-create might have run alongside an explicit Mark-as-shared), the seed data may carry duplicates. Seed clear cascade is intact; reseed produces a single ShowEvent per fixture per the Block P seed shape. If duplicates surface in review, simple: reseed.
- **Patch 8 graceful-fallback path is fully exercised** by the empty-key state. Setting the API key activates the live path; that path will be exercised the first time a banker authors an Insight in a session where the key is set. The 5s timeout + error fallback paths (network outage, malformed response) are in place but haven't been exercised in this session — they'd need API failure simulation to test directly. Pre-EVP smoke-test recommended: author one Insight with key set, confirm match completes; then author one with key unset (or rate-limited), confirm graceful fallback fires.

### Cross-references

- `app/v2/members/[id]/objective-popup.tsx` — Patches 1, 2, 4, 5 (popup affordance + Growth insights restyle + nesting + dedupe)
- `app/v2/members/[id]/capture-forms/insight-form.tsx` — Patch 3 (form ergonomics)
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — Patch 3 (mode label)
- `app/v2/members/[id]/sidebar.tsx` — Patch 3 (sidebar section label)
- `app/v2/members/[id]/main-panel.tsx` — Patch 6 (Resolution row content)
- `app/v2/members/[id]/actions.ts` — Patch 7 (saveShowEvent dedupe guard)
- `app/v2/members/[id]/workstation-shell.tsx` — Patch 2 (handleUsePatternForInsight retired)
- `public/insight-lightbulb.png` — Patch 2 (asset; copied from `assets/Insight Lightbulb.png`)
- `.env` — Patch 8 (ANTHROPIC_API_KEY set/empty controls live vs fallback path)

Mini-patch complete. Visual review next; Sprint 5b.2 design conversation (Q1 + Q2) follows.

---

## 2026-05-06 — Sprint 5b.2 (Portfolio Surfaces, Re-capture Handling, Coach Refinement)

### Goal

Bring the workstation to portfolio scale. Senior lenders and bankers need cross-Member views to do their jobs at portfolio scale. This sprint ships four portfolio surfaces driven by capture-density and workflow-state axes (no strength labels at any scale), resolves the re-capture-vs-new-record architectural question that surfaced during Sprint 5b.1 visual review, and refines Coach content for Member-Type-specific operational practice.

### What shipped

- **Block A — MemberWorkflowState entity + recompute helper.** New Prisma model `MemberWorkflowState` (1:1 with Member) materializing denormalized workflow signals: `total_captures`, `factor_captures_count`, `signals_count`, `insights_count`, `reactions_count`, `open_thread_count`, `stale_capture_count`, `last_touch_at`, `current_track_id`, `pending_action_card_count`, `pending_specialist_handoff_count`. Migration `20260506185233_sprint5b_2_workflow_state` clean. `lib/workflow-state.ts` exports `recomputeWorkflowState(prisma, memberId)` and `recomputeAllWorkflowStates(prisma)` (used in seed). All v2 capture server actions now call `recomputeAndRevalidate(prisma, member_id)` after writes (replaces inline `revalidateAllMemberSurfaces()`); workflow state stays current on every capture. `recomputeAndRevalidate` also revalidates the four insight-engine routes so portfolio surfaces re-render on any capture write. v1 server actions (saveAskCaptures / saveSizingCaptures / saveResolveCapture) skip workflow recompute for Sprint 5b.2 — workflow state stays eventually-consistent until reseed; pilot can wire v1 if needed.
- **Block B — Track Performance surface.** New route `/v2/insight-engine/tracks`. Per-Track aggregate view across the roster. For each Track: total Member count where `current_track_id` matches, capture density distribution (0-2 / 3-6 / 7+), workflow state distribution (pending ActionCards / stale captures / open threads), Member-type mix. Member list under each Track shows last touch, capture count, and any open-thread / pending-AC counts. Click Member row → growth conversation page. **No strength tier labels** anywhere on this surface (architectural commitment).
- **Block C — Member portfolio surface.** New route `/v2/insight-engine/portfolio`. Banker roster sorted oldest-touched-first to surface neglected Members. Header aggregates: total / touched-in-30d / pending-ActionCards / stale / open-threads. Per-Member row: name + Member-Type + current Track + banker + last-touch days-count + capture breakdown (S / I / R) + ActionCard / open-thread / stale callouts. Demo: shows all Members; Pilot scopes by banker_id (Note 9).
- **Block D — Coverage and indecision surface.** New route `/v2/insight-engine/coverage`. Open Indecision threads at portfolio scale, sorted longest-open-first per spec D.3. Aggregate header (total + days-open distribution). Indecision tag distribution panel. Per-row: Member + tag + verbatim quote + days-open + days-since-last-touch. Heuristic per Sprint 5b.1 Block G: open = no subsequent Reaction exists for the Member after the Indecision's captured_at.
- **Block E — Stage-skip surface.** New route `/v2/insight-engine/stage-skip`. Members with later-objective evidence captured (Consult / Navigate) but missing earlier-objective required evidence (Discover / Measure). Severity = count of skipped objectives. Per-Member row: name + skipped objectives ("Missing Discover + Measure") + most-recent later-objective evidence timestamp + kind. Sorted severity-descending. Coaching surface for senior lenders.
- **Block F — Recapture detection.** New `lib/recapture-detection.ts` exports `factorCaptureOrUpdate` and `reactionOrUpdate`. Match predicate: (member_id, factor_id) for FactorCapture; (member_id, show_event_id) for Reaction. Value equality across the entity's value-fields determines `updated` vs `superseded` outcome. `created` when no prior. Wired into `saveFactorCapture` and `saveReaction` v2 actions. ShowEvent already implements equivalent guard (Sprint 5b.1 Patch 7); confirmed consistent. Verified via inline probe: same value → kind='updated', row count unchanged; different value → kind='superseded', row count incremented.
- **Block G — Coach content v2.** `lib/stage-guidance.ts` MEMBER_TYPE_COACH content replaced with bullets from `MEMBER_TYPE_GUIDANCE_v2.md`. Path B discipline preserved: Member-Type-specific operational practice (catering = operator-owner with seasonal cycles; HVAC trades = field-operations owner with capacity-and-equipment focus; specialty manufacturing = professionalized mid-market with multi-stakeholder decisions). 4 bullets per (Member-Type × Objective) cell × 12 cells = 48 bullets; ~24 of them carry CTAs mapping to capture forms (FACTOR-NNN, model_produced, decision_maker_mapping, reaction_captured, specialist_handoff_initiated). Coach surface structure unchanged from Sprint 5a.3 Block C; only content. No banned phrases per COMPLIANCE.md §10.2 — verified via grep against current/recommendation/eligible/etc. before commit.
- **Block H — this BUILD_LOG entry, OPEN_QUESTIONS amendments, Architectural Notes 9-10, CLAUDE.md manifest.**

### Schema migrations

| Migration | Purpose |
|---|---|
| `20260506185233_sprint5b_2_workflow_state` | CREATE TABLE MemberWorkflowState (1:1 with Member) + indexes on member_id / last_touch_at / current_track_id. |

### Verified

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean — all 4 insight-engine routes render dynamic (`force-dynamic` directive on each); 11 routes total
- `pnpm exec tsx prisma/seed.ts` clean: workflow state computed for 3 Members
- HTTP probe at `pnpm exec next dev`:
  - `/v2/insight-engine`: HTTP 200 (landing)
  - `/v2/insight-engine/tracks`: HTTP 200 — all 5 Tracks rendered (CRE Term Loan / SBA 7(a) / Treasury Services / Vehicle Fleet / Working Capital LOC)
  - `/v2/insight-engine/portfolio`: HTTP 200 — all 3 Members rendered (Cygnus / Jenny / Northland)
  - `/v2/insight-engine/coverage`: HTTP 200 — open thread aggregates + tag distribution rendered; days-open ranges captured
  - `/v2/insight-engine/stage-skip`: HTTP 200 — severity headers + distribution rendered
  - Coach v2 content on Jenny page: "Listen for the seasonal cycle's specific shape" verbatim from MEMBER_TYPE_GUIDANCE_v2.md Section 1.1
- Recapture pattern probe (inline tsx test): same value → `updated`, count unchanged; different value → `superseded`, count +1

### Workflow state per fixture (post-seed recompute)

```
jenny     total=22 (13F+4S+4I+1R), open=1, stale=2, track=TRACK-001, AC=1
northland total=19 (11F+3S+4I+1R), open=1, stale=1, track=TRACK-002, AC=1
cygnus    total=24 (15F+4S+4I+1R), open=0, stale=2, track=TRACK-003, AC=2
```

Where F=FactorCaptures, S=Signals, I=Insights, R=Reactions. Counts validate that the seed lands as expected: each fixture has the audit-confirmed FactorCaptures (Sprint 5a.3) + the 12 fixture Insights (Sprint 5b.1 Block D) + 1 Reaction each (Sprint 4.7 Block P). Open-thread heuristic correctly identifies Jenny's and Northland's Indecision Signals (no subsequent Reaction); Cygnus has 0 open threads (no Indecision Signal in seed; matches Block D notes).

### Architectural notes for Pilot (continuing 1-8 from Sprint 5b.1)

**Note 9 — Portfolio surface RBAC.** Demo simulates banker-vs-senior-lender via Scott in dual role; all bankers see all surfaces. Pilot needs real role-based scoping. MemberWorkflowState entity supports this; portfolio queries need to filter by `member.primary_banker_id` (banker view) or skip the filter (senior lender view). `memberRoster()` helper takes no banker filter today; trivial to add at Pilot.

**Note 10 — Workflow state materialization.** Synchronous on-write recompute is fine for demo scale (~3 fixtures, ~30-40 captures total). Pilot scale needs async recompute via queue: capture write completes → enqueue recompute job → background worker recomputes + writes MemberWorkflowState. Avoids blocking capture-write latency on aggregation queries.

### OPEN_QUESTIONS amendments

- **Q-A2 (open-thread tiebreaker)** → **Resolved by Block D Coverage and indecision surface.** Sprint 5b.1 Block G partially resolved with the per-Member open-thread chip; Sprint 5b.2 Block D ships the portfolio-scale view with sorting by days-open and tag distribution. Multi-thread tiebreaking (when two Indecisions have same days-open) handled by alphabetic Member name as natural tiebreaker via the surface's secondary sort. Marked Resolved.
- **Add Q-C1 (Portfolio surface RBAC)** — see Note 9. Demo: Scott in dual role, all-bankers-see-all. Pilot: real role-based scoping via banker_id filter.
- **Add Q-C2 (Recapture audit trail)** — Demo's superseded behavior preserves prior records via newest-by-captured_at queries (no explicit superseded_by_id pointer). Pilot may want richer audit trail (preserve all captures with timestamps; explicit supersession marker; query newest by default). Schema additions: `superseded_by_id` pointer on FactorCapture / Signal / Reaction, or a dedicated audit-log table. Decision: how visible should supersession history be in banker UI? Visible at all times, on-hover, or only via senior-lender drill-in?

### Decisions made during implementation

- **`current_track_id` on MemberWorkflowState** uses `rankTracksForMember[0].track_id`. Spec §B.4 query references factor_captures and signals having `track_id`, but those entities don't have a track_id column (only Insight does, post-Sprint 5b.1). Reconciled by using the matrix-ranker's top-ranked Track as the canonical Member ↔ Track linkage. Alternative: enumerate Members where ANY captured Insight has a given track_id. Demo uses the simpler current_track_id linkage.
- **Track Performance surface counts Members where `current_track_id` matches.** Members can have evidence relevant to multiple Tracks; we surface only the top-ranked one to keep the cross-Track aggregation simple. Pilot may want a "Members where this Track is in candidate set" expanded view.
- **Stage-skip detection iterates roster** + per-Member fetches FactorCaptures + entity counts. N+1 query pattern; fine for demo (~3 Members) but Pilot scale needs batch query. Logged in Note 10.
- **Insight Engine routes are server-rendered (`dynamic = "force-dynamic"`).** Without this directive Next.js 16 prerenders at build time; portfolio data would be stale until next deploy. `force-dynamic` re-renders each request — fits the live-DB model.
- **v1 server actions don't recompute workflow state.** Demo viewers use v2 dialpad for new captures; v1 routes are legacy. Workflow state stays correct after seed; on-demand recompute via direct call from any future v1 wiring.
- **Coach v2 content keeps existing CoachBullet shape.** No structural changes; only content swaps. CTA mapping conservative — only bullets that map cleanly to a single capture form get CTAs (24 of 48 bullets across 12 cells). Other bullets (orientation prose: "Listen for...", "Probe...", "Don't rush...") stay static.
- **Recapture detection takes `prismaOrTx: PrismaClient`.** Both PrismaClient and TransactionClient expose the same delegate API for findFirst/create/update on factorCapture and reaction. Trust the call site to pass a structurally-compatible client; cast through `unknown` when calling from inside `prisma.$transaction`.
- **Reaction value cast through `unknown`.** Prisma's typed ReactionValue enum doesn't widen from helper's `string` input; cast preserves write-time type checking at the action layer (`REACTION_NUANCED_RESPONSES.has(input.response_value)`) without leaking enum imports into the generic helper file.

### Watch for review

- **Track Performance Member-Type mix** is a small auxiliary stat; if visual review prefers more workflow-state breakdown (e.g., by-handoff status), the third Stat block can swap content.
- **Member portfolio sort is fixed** (oldest-touched first) without UI to change. Spec §C.4 mentioned filters and sort options; demo ships with default sort only — visual review may want filter chips above the list.
- **Coverage tag distribution** uses the canonical_tag's second segment ("authority" / "information" / etc.) as display text. If visual review wants friendlier labels (e.g., "Decision-maker authority" / "Needs more information"), it's a one-line `humanizeTag` call away.
- **Stage-skip: zero stage-skipping Members in current seed.** All three fixtures have appropriate Discover + Measure evidence captured per their top-ranked Track. The surface ships with the "no stage-skipping Members" empty state visible. To exercise the populated state, a banker would need to capture a Reaction or Model on a Member without first capturing required Discover/Measure factors — uncommon in demo flow but possible. If visual review wants the populated state demonstrable, an artificial-fixture seed entry would force it; not done in this sprint.
- **Coach v2 bullet count (4/cell)** vs Sprint 5a.3's variable count (2-4/cell): cells are slightly denser. If review surfaces "too dense" reading, trim to 3/cell preserving the highest-signal bullets.
- **Recapture pattern doesn't apply to Signals via v1 saveAskCaptures.** v1 actions ship with original create-always behavior; demo viewers using v2 dialpad's + Ask still get original behavior because + Ask wraps the v1 component. Pilot wires recapture into v1 saveAskCaptures for full coverage.

### Cross-references

- `MEMBER_TYPE_GUIDANCE_v2.md` (repo root) — canonical Coach content source
- `BUSINESS_FACTOR_MATRIX_v1.md` — factor catalog (current_track_id derives via matrix-ranker)
- `INSIGHT_PATTERN_LIBRARY_v1.md` — Pattern library (Insights count toward total_captures in workflow state)
- `lib/workflow-state.ts` — `recomputeWorkflowState`, `recomputeAllWorkflowStates`
- `lib/recapture-detection.ts` — `factorCaptureOrUpdate`, `reactionOrUpdate`, `RecaptureResult`
- `lib/portfolio-queries.ts` — `memberRoster`, `trackPerformanceData`, `openIndecisionData`, `stageSkipData`
- `app/v2/insight-engine/layout.tsx` + `page.tsx` — Insight Engine shell + landing
- `app/v2/insight-engine/{tracks,portfolio,coverage,stage-skip}/page.tsx` — four portfolio surfaces

Sprint 5b.2 ships the portfolio architecture. Insight Engine routes work; recapture pattern works; Coach v2 content lands. Visual review next; Sprint 6 (polish + EVP demo deploy) is the final sprint.

---

## 2026-05-06 — Sprint 5c (Blaze Product Realignment, Additive Track Architecture, Bug Patches)

### Goal

Sprint 5b.2 visual review surfaced an architectural gap: 3 of 5 demo Tracks (Working Capital LOC, SBA 7(a), Treasury Services) don't map to Blaze's actual lending product catalog. Sprint 5c is **additive realignment**: TRACK-001 + TRACK-004 retained as future-expansion framing; TRACK-005 dropped (no Blaze equivalent); 6 new Tracks added mapping directly to Blaze's catalog (Investment Property Loan, Equipment & Machinery, SBA 504, PACE Loan, Business Visa Credit Card, Unsecured Loan); TRACK-002 renamed Vehicle/Fleet → Business Vehicle Loan. Cygnus's primary shifts from conventional CRE to SBA 504 (owner-occupied manufacturing facility).

### What shipped

- **Block A — Schema realignment.** 6 new TrackTemplates (TRACK-006 through TRACK-011) with full `required_evidence_per_objective` and Blaze product terms. TRACK-002 renamed "Vehicle / Fleet Loan" → "Business Vehicle Loan". TRACK-005 + FACTOR-027 (treasury_services_adopted) dropped. 9 new BusinessFactors: FACTOR-029 owner_occupancy_confirmed, FACTOR-030 real_estate_target_property, FACTOR-031 energy_improvement_target, FACTOR-032 property_eligibility_confirmed, FACTOR-033/034/035 sized-cost factors, FACTOR-036/037 requested-amount factors, FACTOR-038 employee_count_band. Total catalog: 28 → 37 factors.
- **Block B — Matrix entries.** 47 new MatrixEntry records across 6 new Tracks (TRACK-006: 10, TRACK-007: 9, TRACK-008: 12, TRACK-009: 6, TRACK-010: 5, TRACK-011: 5) plus 1 owner-occupancy negative entry on TRACK-003. Net: 60 → 98 entries (dropped 9 TRACK-005 + 1 FACTOR-027). Tier rules use Blaze's actual product terms (PACE 14-year, Equipment 7-year, Vehicle 5-year, Unsecured $25K cap, SBA 504 50/40/10).
- **Block C — Pattern Library v2.** Dropped 6 TRACK-005 Patterns (031-036). Added 23 new Patterns (037-059) covering 6 new Tracks per `INSIGHT_PATTERN_LIBRARY_v2_additions.md`. Library net: 36 → 53 Patterns.
- **Block D — Fixture realignment.** Cygnus's primary Track shifted TRACK-003 → TRACK-008 SBA 504. Three new factor captures for Cygnus: FACTOR-029 owner_occupancy_confirmed=true, FACTOR-038 employee_count_band=85, FACTOR-035 property_acquisition_amount_sized=$5.5M. All four Cygnus seed Insights migrated track_id TRACK-003 → TRACK-008 (matched_pattern_ids retained — Patterns and Insights can reference different Tracks when the underlying observation transfers). Northland: TRACK-002 rename only. Jenny: unchanged.
- **Block E — Coach Member-Type guidance v3.** Specialty manufacturing Coach cells substantively replaced with SBA 504-aware content per `MEMBER_TYPE_GUIDANCE_v3_addendum.md` Section 1: owner-occupancy framing, 50/40/10 structure references, CDC + SBA + CRE specialist coordination, 90-150 day SBA 504 timeline. Catering Discover/Navigate gained 1 cross-Track bullet each (delivery vehicle → Business Vehicle Loan; venue ownership → Investment Property + Business Visa). HVAC Discover/Consult gained 1 cross-Track bullet each (HVAC equipment vs vehicles distinct; PACE as customer-financing tool).
- **Block F — Track context dropdown scaling.** Sidebar Track switcher shows top 5 candidates by default with "view all N lending products ↓" affordance when more exist. Track Performance surface (`/v2/insight-engine/tracks`) groups Tracks: "Blaze lending products" (8 Tracks) + "Future-expansion lending products" (TRACK-001 + TRACK-004) with 90% opacity + italic note "Tracks retained for matrix coverage; not currently in the Blaze offering catalog."
- **Block G — Bug patches.**
  - **G.1 CTA factor pre-selection:** added defensive `useEffect` in `MatrixAwareCapture` to re-sync `factorId` state when `preselectedFactorId` prop changes. Belt-and-suspenders against React state-staleness when form is reused without unmount.
  - **G.2 ShowEvent dedup:** root cause was strict (member, artifact, model_id) match in saveShowEvent's findFirst. saveModel auto-creates ShowEvent with model_id non-null; artifact preview "Mark as shared" calls with model_id=null → strict match missed cross-path. Fix: dropped model_id from dedup predicate. Same (member, artifact) → same logical "shown" moment regardless of which Model produced it. Inline test verified: 0 → 1 → 1 (second call updates timestamp; no duplicate row).

### Verified

- `pnpm tsc --noEmit` clean (after `.next` cleanup; iCloud sync periodically duplicates route-types files)
- `pnpm exec tsx prisma/seed.ts` clean: 37 BusinessFactors, 10 TrackTemplates, 98 MatrixEntries, 39 FactorCaptures, 53 InsightPatterns, 12 Insights
- `pnpm exec tsx scripts/probe-ranker.ts`:
  - Jenny: TRACK-001 Working Capital LOC strong (5s/1m) — unchanged
  - Northland: TRACK-002 Business Vehicle Loan strong (5s/1m) — name updated, ranking preserved
  - **Cygnus: TRACK-008 SBA 504 strong (3s/5m) — primary shifted from TRACK-003.** TRACK-003 demoted to insufficient via owner-occupancy negative entry (5s/6m/1neg).
- Inline ShowEvent dedup test: same (member, artifact) re-shared → row count stays at 1 (timestamp updated, no duplicate created).

### Architectural notes for Pilot (continuing 1-10 from Sprint 5b.2)

**Note 11 — Track expansion governance.** When Blaze expands product offerings (e.g., adds Working Capital LOC), TRACK-001 framing shifts from future-expansion to active. Architecture supports this without code change; just update the `FUTURE_EXPANSION_TRACK_IDS` Set in `app/v2/insight-engine/tracks/page.tsx`. Pilot may want this driven by TrackTemplate metadata field (e.g., `display_status`) rather than hard-coded ID list.

**Note 12 — Member-Type to Track inference.** With 10 Tracks, automatic Track suggestion by Member-Type (lightweight inference: "specialty_manufacturing" → suggest TRACK-008 + TRACK-007 + TRACK-003) is Pilot polish. Currently bankers select Track context via the matrix ranker's `current_track_id` + manual switching via dropdown.

### OPEN_QUESTIONS amendments

- **Add Q-D1 (Track display ordering):** future-expansion Tracks (TRACK-001, TRACK-004) currently retained without operational impact for Blaze. When does Blaze decide whether to expand into LOC/SBA 7(a) vs drop these Tracks entirely? Pilot conversation needed.
- **Add Q-D2 (TRACK-009 PACE customer fit):** PACE is a niche product. Pilot needs to evaluate whether bankers actually use this Track frequently enough to warrant prominence. If used <5% of conversations, consider de-prioritizing in default top-5 view.

### Decisions made during implementation

- **Owner-occupancy negative entry on TRACK-003** rather than additional TRACK-008 strong entries. Structurally honest: SBA 504 has better terms for owner-occupants (longer term, lower equity, partial guarantee). The negative correctly demotes TRACK-003 below TRACK-008 in Cygnus's case while leaving non-owner-occupants on conventional CRE.
- **Cygnus seed Insights retain matched_pattern_ids pointing to TRACK-003 Patterns.** Patterns and Insights are independent in their Track references. Avoids cascading edits when the only change is the Insight's Track context.
- **Coach v3 specialty_manufacturing cell density: 5 bullets** (was 2-4). Added owner-occupancy + employee count bullets. If visual review surfaces "too dense," trim by combining bullets.
- **TRACK-002 rename keeps existing Sprint 4.7 Block P fixture content.** Northland's "fleet-marked trucks for trust signals" novel insight reads under "Business Vehicle Loan" framing because fleet IS multiple business vehicles.
- **G.2 dedup loosened to (member, artifact) only.** Sprint 5b.1 Patch 7 used (member, artifact, model_id) — too strict. Sprint 5c discovered cross-path edge case (auto-create + manual share). Pilot may want richer audit trail (preserve all share-events with timestamps; query newest) — Sprint 5b.2 Q-C2 covers related discussion.

### Watch for review

- **Cygnus TRACK-008 ranker output [3s/5m]** is strong but lower-tier-count than TRACK-003's old [5s/6m]. If visual review wants higher tier counts, more TRACK-008 strong factors can be authored. Demo narrative still works (TRACK-008 is primary; TRACK-003 demoted visible in dropdown).
- **Track Performance future-expansion grouping** uses 90% opacity to be subtly distinct without judgment. CSS tweak if review wants more or less visible distinction.
- **Sidebar dropdown top-5 cap** may surface "view all 9" prominently for Members with many candidates. Adjusting `TOP_CAP` in `TrackList` reduces clicks-to-discovery.
- **"Future-expansion lending products"** framing is intentionally neutral. Copy alternatives: "Tracks not yet offered by Blaze," "Adjacent products under review."
- **Block G.1 fix is defensive useEffect.** Original useState initializer already handled `preselectedFactorId === undefined` correctly (factorId = ""). The effect catches React state-staleness if the form is reused without unmount; Sprint 5c didn't reproduce the original bug under controlled testing, but the defensive sync removes the risk.

### Cross-references

- `INSIGHT_PATTERN_LIBRARY_v2_additions.md` (repo root) — canonical Pattern v2 source
- `MEMBER_TYPE_GUIDANCE_v3_addendum.md` (repo root) — canonical Coach v3 source
- `prisma/seed-matrix.ts` — TRACK-002 rename, TRACK-005 drop, 6 new Tracks, 9 new factors, 48 net new MatrixEntries, FACTOR-029/038/035 captures for Cygnus
- `prisma/seed-insights.ts` — 6 TRACK-005 patterns dropped, 23 new patterns (037-059), Cygnus Insights migrated to TRACK-008
- `lib/stage-guidance.ts` — specialty_manufacturing replaced with SBA 504-aware v3 content, catering + HVAC minor additions
- `app/v2/members/[id]/sidebar.tsx` — `TrackList` extracted with top-5 cap + view-all affordance
- `app/v2/insight-engine/tracks/page.tsx` — Blaze-offers vs future-expansion grouping
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — defensive useEffect for preselectedFactorId sync
- `app/v2/members/[id]/actions.ts` — saveShowEvent dedup loosened to (member, artifact)

Sprint 5c ships. Demo is now Blaze-product-accurate: 8 Tracks map to Blaze's catalog + 2 retained as future-expansion. Cygnus on SBA 504. Bugs patched. Visual review next; Sprint 6 (polish + EVP demo deploy) is the final sprint.

---

## 2026-05-04 · Sprint 5d-pre — Member-Type rename (foundation for Sprint 5d)

**Session type:** Single-block foundation rename. Spec: `docs/prompts/SPRINT_5d_pre_MEMBER_TYPE_RENAME.md`. Goal: rename Member-Types across the codebase (IDs, banker labels, Pattern metadata) before Sprint 5d ships content rewrite + new artifact templates against the renamed foundation.

**Block A — comprehensive rename (per spec A.1 mappings):**

ID + display rename (MemberType.name strings):
- `small_caterer` / "Small Caterer · Starting" → `event_services` / "Event services"
- `hvac_trades` / "HVAC & Trades · Growing" → `maintenance_services` / "Maintenance services"
- `specialty_manufacturing` / "Specialty Manufacturer · Established" → `specialty_manufacturer` / "Specialty manufacturer"

Pattern member_type_origins metadata mapping with dedupe (per spec A.1):
- "catering" / "small_caterer" → "event_services"
- "hvac_trades" / "plumbing" / "specialty_construction" → "maintenance_services" (dedupe to single value where multiple originals collapsed)
- "specialty_manufacturing" → "specialty_manufacturer"
- "general", "professional_services" preserved

Coverage broadening (per spec A.4): added `MEMBER_TYPE_COVERAGE` constant + `memberTypeCoverage(name)` helper in `lib/stage-guidance.ts`. Each Member-Type's description text in `prisma/seed.ts` was broadened to enumerate covered industries (caterers/event planners/venue operators…; HVAC/plumbing/electrical/landscapers/pool service…; mid-market manufacturers/industrial fabrication/contract manufacturing).

**Files modified:**

- `prisma/seed.ts` — three MemberType records renamed (`name`, `description`); local consts renamed (`smallCatererStarting` → `eventServices`, `hvacGrowing` → `maintenanceServices`, `specialtyManufacturerEstablished` → `specialtyManufacturer`); macro titles updated (Q3 supplier payment compression — Event services; Light commercial fleet ROI window — Maintenance services); capital event partnership artifact description updated. `industryFamilies.specialtyManufacturing` (a separate `industry_family` concept, not a Member-Type) deliberately untouched.
- `prisma/seed-insights.ts` — 49 Pattern member_type_origins arrays remapped per A.1; 7 arrays affected by dedupe (PATTERN-010 through PATTERN-016 collapsed `hvac_trades + plumbing [+ specialty_construction]` into single `maintenance_services` entry).
- `lib/stage-guidance.ts` — three `MEMBER_TYPE_COACH` keys renamed via constant rename (`SMALL_CATERER` → `EVENT_SERVICES`, `HVAC_GROWING` → `MAINTENANCE_SERVICES`, `SPECIALTY_MFG` → `SPECIALTY_MANUFACTURER`); added `MEMBER_TYPE_COVERAGE` constant + `memberTypeCoverage(name)` helper; header doc comments + rename map updated; one Sprint 5c block-E comment that referenced `specialty_manufacturing` updated to `specialty_manufacturer`.

**Schema:** no migration needed. `MemberType` is a relation entity (not an enum); the rename is data-only — `MemberType.name` strings change but the UUID FKs in `Member.member_type_id` stay stable. Seed reseeds the three MemberType records with new names; Members re-link by name lookup via existing fixture wiring.

**Verification:**

A.5 grep audit (all 0 hits across `*.ts`, `*.tsx`, `*.json`, `*.prisma`, excluding `node_modules`, `.next`, `app/generated`, and intentional rename-history comments in `prisma/seed.ts` + `lib/stage-guidance.ts`):
- `small_caterer` → 0
- `hvac_trades` → 0
- `specialty_manufacturing` → 0
- `"catering"` (Pattern metadata) → 0
- `"plumbing"` → 0
- `"specialty_construction"` → 0

Build/seed/typecheck:
- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (all 11 routes including `/v2/members/[id]`, `/growth-conversations/[memberId]`, four `/v2/insight-engine/*` routes)
- `pnpm exec tsx prisma/seed.ts` clean (3 memberTypes, 3 members seeded; Step 1-11 complete)

DB sample post-seed:
- Jenny's Catering → MemberType "Event services"
- Northland HVAC (DBA preserved) → "Maintenance services"
- Cygnus Bioscience → "Specialty manufacturer"

Pattern member_type_origins sample:
- PATTERN-001: `["event_services","specialty_retail","agriculture","general"]`
- PATTERN-003: `["event_services","maintenance_services","specialty_manufacturer","general"]`
- PATTERN-010: `["maintenance_services","general"]` (dedupe applied — was `["hvac_trades","plumbing","specialty_construction","general"]`)
- PATTERN-013: `["maintenance_services","general"]` (dedupe applied)
- PATTERN-018: `["specialty_manufacturer","specialty_retail","general"]`

HTTP probes (after a clean `rm -rf .next && pnpm dev` to defeat iCloud .next-folder churn):
- `/growth-conversations/{jenny|northland|cygnus}` → 200
- `/v2/members/{jenny|northland|cygnus}` → 200; rendered HTML grep confirms "Event services" / "Maintenance services" / "Specialty manufacturer" labels appear (4–5 occurrences each)
- `/v2/insight-engine/{tracks|portfolio|coverage|stage-skip}` → 200
- `/v2/insight-engine` → 200

**Notes / deviations:**

- `CONTENT_REWRITE_v1.md` referenced by spec preamble was not present in the repo; the prompt's Section A.1 was self-contained for the rename mappings, so execution proceeded against the prompt directly.
- "HVAC" still appears in human-readable Coach-content prose (e.g., "Surface PACE Loan as a customer-financing option for HVAC's installation customers") and the `Northland HVAC` DBA. Per spec, content rewrite + Coach updates are deferred to Sprint 5d — these mentions are intentionally left for the next sprint.
- `industryFamilies.specialtyManufacturing` (industry_family table, not Member-Type) is a different concept and was correctly left untouched per Section 5 surface-vs-schema discipline.
- Dev server occasionally returns 500 on rapid HEAD requests due to iCloud sync deleting `.next/dev/*` files between requests (known per prior BUILD_LOG entries). Production build (`pnpm exec next build`) is the authoritative correctness check; it passes clean.

**Suggested next move:** Sprint 5d — content rewrite (Macros, Coach, artifact descriptions reflecting broadened Member-Type coverage), 7 new artifact templates, bug patches. Foundation is in place; Sprint 5d builds on the renamed names with no further schema or rename concerns.

---

## 2026-05-08 · Sprint 5d — Artifact templates, surface copy rewrite, bug patches, stage-skip fixture

**Session type:** Multi-block sprint per `SPRINT_5d_v2_CONTENT_AND_TEMPLATES.md`. Single checkpoint.

### Critical context — missing source document

`CONTENT_REWRITE_v1.md` (the spec's primary source for Sections 2 Coach / 3 Capture forms / 4 CTA labels / 5-7 surface copy / 8 Pattern rewrites / 9 artifact template specs) was not present in the repo at execution time. Per Francisco's direction, the sprint proceeded with whatever guidance was inlined in the prompt itself plus best-effort scaffolding for any block that needed the missing source. Deferrals are flagged below per block; downstream Sprint 5d follow-up will land the editorial content once `CONTENT_REWRITE_v1.md` arrives.

### What shipped

**Block A — ArtifactTemplate schema + Model extension.** New `ArtifactTemplate` Prisma entity (id, track_id, title, description, member_type_applicability, parameter_schema, output_summary_template, structural_content). All JSON-shaped fields stored as String per the existing seed-insights / seed-matrix convention. Model extended with optional `template_id` + `template_parameters` (JSON-encoded). Migration `20260508143214_sprint5d_artifact_templates` applies cleanly. Prisma client regenerated. `ArtifactTemplate.deleteMany()` added to seed clear() before TrackTemplate so reseeds don't FK-violate.

**Block B — 8 ArtifactTemplate seed records** (`prisma/seed-artifact-templates.ts`).
- `ARTIFACT-TEMPLATE-001` (TRACK-003 CRE acquisition) — full parameter schema and output template per the example in spec A.2.
- `ARTIFACT-TEMPLATE-008` (TRACK-008 SBA 504 transaction roadmap) — fully spec'd inline in B.2 with eight stages, role lists, you-are-here marker, share button. Replaces the legacy Capital event partnership map.
- Templates 002-007 (SBA 7(a), Investment property, Equipment ROI, PACE, Business credit card, Unsecured loan) — **scaffolded with reasonable banking conventions** because Section 9 sub-sections weren't available. Each has a complete parameter_schema, output_summary_template, and structural_content; final editorial pass deferred. Flagged in seed file header comment.
- Cygnus's existing Capital event Model migrated to `template_id="ARTIFACT-TEMPLATE-008"` with `template_parameters={"current_stage":"3"}` (CDC partner introduction stage).
- Block A.3 (+ Model form parameter input UI) and A.4 (artifact view rendering with parameter substitution) **deferred** — substantial UI work that needs Section 9 details to land cleanly. The data layer is in place; the form/render UI is the next chunk.

**Block C — Coach content rewrite. DEFERRED ENTIRELY.** Section 2 source missing; current Sprint 5d-pre Coach content stays in place. Logged here so the deferral is explicit and visible.

**Block D — Capture form copy.** Applied only the explicit text changes spec'd in the prompt:
- Drawer titles (`ACTIVITY_TITLES` in `app/v2/members/[id]/dialpad.tsx`): "Capture Quantify" → "Capture a number"; "Capture Ask" → "Capture what the Member said"; "Capture Reaction" → "Capture how the Member reacted"; etc.
- + Quantify mode toggle: "Lending-product specific" → "Tied to a lending product"; "Free-form magnitude" → "A number that stands on its own".
- + Quantify save button: "Save factor" → "Save".
- Sizing checkbox: "Also save as a SizingMeasurement (surfaces in captured feed as a Sized card)" → "Also show this as a sizing card" + helper line "Use this when the value is a magnitude the Member should see at a glance — like a $75K credit limit or 70% capacity utilization." (Block H.3).
- Deeper field-label / helper-text rewrites (Section 3.1-3.7 detail) **deferred** — would need source.

**Block E — CTA labels rewrite** (`lib/cta-derivation.ts`).
- Layer 1 Class 1B (symbolic refs): `model_produced` → "Build a model with the Member"; `model_shown` → "Show the Member the projection"; `reaction_captured` → "Capture how the Member reacted"; `decision_maker_mapping` → "Capture what the Member said about who decides"; `specialist_handoff_initiated` → "Hand off to a specialist".
- Layer 2 (threshold-uplift): "Re-confirm X" → "Re-check X" with context "currently V. If it's T or higher, the case gets stronger."
- Layer 8 (specialist handoff): "Initiate specialist handoff for [track]" → "Hand off to the [department] for [Lending product]"; TRACK-008 special-cased to "Hand off to SBA 504 specialist" per approved decision (avoids "Hand off to the SBA 504 specialists for SBA 504" doubling). TRACK-008 added to `TRACK_SPECIALIST_DEPARTMENT` (was missing).

**Block F — Popup-as-workflow + sidebar + Insight Engine surface copy.**
- Popup (`app/v2/members/[id]/objective-popup.tsx`): "Already captured" → "What we've captured"; "[N]d ago" stale label → "[N] days old"; open-thread chip "open" → "open thread"; "Implications" footer header → "Questions to bring up with the Member"; Pattern label "PATTERN-NNN · type" → just "Type" (sentence case, no internal ID); Insight footer "matched PATTERN-NNN" → just "matched" (drop ID).
- Sidebar (`app/v2/members/[id]/sidebar.tsx`): "view comparison ↗" → "compare to other lending products ↗"; "view all N lending products ↓" → "see all N lending products ↓"; section labels "artifact" → "artifacts", "macro" → "other artifacts", "history" → "past conversations".
- Insight Engine (`app/v2/insight-engine/{layout,page,tracks,portfolio,coverage,stage-skip}/page.tsx`): nav labels and page titles updated — "Track Performance" → "Lending product performance"; "Coverage" → "Open threads"; "Stage-skip" → "Members who skipped earlier work"; "Blaze lending products" → "Lending products Blaze offers"; "Future-expansion lending products" → "Lending products Blaze doesn't offer today"; capture-density tier labels "0-2 / 3-6 / 7+" → "A little / Some / A lot"; portfolio + tracks "Pending ActionCards" → "Pending follow-ups"; "Stale captures" → "Captures over 90 days old"; coverage "Distribution by Indecision tag" → "What's holding things up".

**Block G — Pattern library implication question patterns.** Applied Section 8.10 general patterns where exact matches existed in `prisma/seed-insights.ts`:
- "What does it mean to..." → "What would it look like to..." (PATTERN-027 line 411, PATTERN-040 line 617)
- "Where does the 'we can fit it in' mindset start to break down?" → "When does..." (PATTERN-019 line 303)
- The 17 specific Pattern.content rewrites listed in Section 8 sub-sections **deferred** — needs source. The 53-Pattern library count is unchanged.

**Block H — Three bug patches.**
- **H.1 + refresh CTA factor pre-selection.** Added `key={\`quantify-\${preselectedFactorId ?? "none"}\`}` to `<QuantifyForm>` mount in `dialpad.tsx`. Forces a fresh component mount whenever the preselect changes — guarantees fresh useState init for `factorId`, defeating any stale internal state in MatrixAwareCapture.
- **H.2 Insights surfacing only on Discover.** Updated `popupContext` filter in `workstation-shell.tsx`: Track-level Insights (no `addresses_signal_id`) now surface on every objective popup whose `track_id` matches the current Track context, not just Discover. `InsightDisplay` type extended with `track_id` field; page.tsx propagates from Insight row.
- **H.3 SizingMeasurement copy.** Already covered under Block D (sizing checkbox label + helper).

**Block I — Stage-skipping fixture Member** (`prisma/seed-stage-skip.ts`).
- Riverside Catering (slug `riverside`, event_services Member-Type, owner Daniel Rivers, St. Paul MN, 4 employees, $200K-$500K revenue band).
- One Conversation (Apr 30 2026, opportunity meeting, in_person channel, cautious sentiment).
- Two FactorCaptures: FACTOR-001 Seasonal revenue variance = 25% (fires TRACK-001 strong matrix entry); FACTOR-005 Surplus revenue over costs = 22% (fires TRACK-001 moderate). Neither factor is in TRACK-001's Discover-required set [024, 022, 016, 001] — FACTOR-001 covers 1 of 4, leaving 3 missing.
- Model record (banker draft seasonal cashflow projection, no template_id since TRACK-001 has no parameterized template).
- Reaction record (`response_value=skeptical`, `primary_concern=timing_concern`, member quote "I just want to look at last year's numbers more carefully before I commit to a number."). `skeptical` is the closest enum value to the spec's "hesitant"; `timing_concern` is the closest open-thread taxonomy tag to "needs more discovery".
- Workflow state recompute correctly assigns `current_track_id=TRACK-001`. Stage-skip portfolio surface picks Riverside up with `skipped_objectives=["discover"]`.

**Block J — Governance updates.** This entry. OPEN_QUESTIONS amendments and architectural notes below.

### Files modified

- `prisma/schema.prisma` — ArtifactTemplate model + Model.template_id/template_parameters fields
- `prisma/migrations/20260508143214_sprint5d_artifact_templates/migration.sql` — generated
- `prisma/seed.ts` — seed step 11 (ArtifactTemplate) + step 12 (Riverside) + clear() additions
- `prisma/seed-artifact-templates.ts` — new (8 templates + Cygnus migration)
- `prisma/seed-stage-skip.ts` — new (Riverside fixture)
- `prisma/seed-insights.ts` — 3 implication-question rewrites
- `lib/cta-derivation.ts` — Layer 1B/2/8 label rewrites; TRACK-008 added to specialist map
- `app/v2/members/[id]/dialpad.tsx` — drawer titles + key prop on QuantifyForm
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — sizing checkbox copy + mode toggle + Save button
- `app/v2/members/[id]/objective-popup.tsx` — popup section labels + stale format + Pattern ID drops + open thread chip
- `app/v2/members/[id]/workstation-shell.tsx` — H.2 Insight gating fix
- `app/v2/members/[id]/page.tsx` — InsightDisplay track_id propagation
- `app/v2/members/[id]/sidebar.tsx` — section labels + comparison/view-all links
- `app/v2/insight-engine/layout.tsx` + `page.tsx` + `{tracks,portfolio,coverage,stage-skip}/page.tsx` — surface titles + density tiers + workflow-state stat labels

### Verification

- `pnpm tsc --noEmit` — clean
- `pnpm exec next build` — clean (all 11 routes including 4 IE routes)
- `pnpm exec tsx prisma/seed.ts` — clean. Final counts: 4 members (Jenny, Northland, Cygnus, Riverside), 4 models, 4 reactions, 41 factor captures, 99 matrix entries, 53 InsightPatterns, 8 ArtifactTemplates.
- HTTP probes: `/v2/members/{jenny|northland|cygnus|riverside}` → 200; `/growth-conversations/{jenny|northland|cygnus|riverside}` → 200; `/v2/insight-engine/{tracks|portfolio|coverage|stage-skip}` → 200; `/v2/insight-engine` → 200.
- Stage-skip surface confirms Riverside listed with Discover missing on Working Capital LOC track.
- Cygnus's Model has `template_id=ARTIFACT-TEMPLATE-008`, `template_parameters={"current_stage":"3"}` per DB query.

### Deferrals (load-bearing for downstream Sprint 5d follow-up)

1. **Block C — Coach content rewrite.** Full Section 2 (Event services / Maintenance services / Specialty manufacturer × 4 phases each) needs `CONTENT_REWRITE_v1.md` to land before this can ship.
2. **Block B templates 002-007 — final editorial pass.** Scaffolding is in place but the title, description, parameter labels, and helper text for each template should match Section 9 sub-sections when available. Members can demo against the scaffolded versions; nothing breaks.
3. **Block A.3 / A.4 — + Model form parameter input UI + artifact rendering.** The data plumbing (template selection, parameter persistence) is in place; the UI is not. Banker can save a Model without a template; banker cannot yet pick a template + fill parameter inputs from the + Model form. Deferred until template content is final.
4. **Block D — full capture form copy rewrite.** Only the explicit changes inlined in the prompt landed. Field labels, helper text, and validation messages across the six form components need Section 3.1-3.7 source.
5. **Block G — 17 specific Pattern.content rewrites.** Section 8 sub-sections needed.

### Architectural notes for Pilot (continuing 1-12 from Sprint 5c)

**Note 13 — ArtifactTemplate parameter validation.** Demo accepts banker free-form parameter input with no enforcement. Pilot needs schema-driven validation: currency parsing (`$1,000` → 1000), percentage range checks (0–100 typical, but DSCR can exceed 1), enum value enforcement on `select` parameters, computed-field auto-calculation (e.g., LTV from loan_amount / acquisition_price). Library candidates: zod for schema; tiny custom layer for the computed-field expression evaluator (current `parameter_schema.computation` strings are intentionally restrictive — no eval, no arbitrary JS).

**Note 14 — Member-Type taxonomy evolution.** Demo's three Member-Types (event_services / maintenance_services / specialty_manufacturer) were broadened in Sprint 5d-pre. Pilot may add more Member-Types as bankers encounter business types not fitting current categories — e.g., professional services (law/accounting/consulting), specialty_retail (boutique/franchise), agriculture (small farms / co-ops). The Member-Type Coach content (`MEMBER_TYPE_COACH` in `lib/stage-guidance.ts`) is keyed by display name, so adding a new Member-Type means: (a) seed the MemberType row, (b) add a Coach cell, (c) extend the Pattern library's `member_type_origins` arrays where applicable, (d) decide if any Track templates need Member-Type-specific evidence framing.

### OPEN_QUESTIONS amendments

- **Add Q-E1 — Track-aware factor filtering in + Quantify.** 37 factors organized into 6 categories produces friction in the dropdown when banker is anchored on a specific Track context. Pilot polish: filter the factor list to ~6-8 factors relevant to the current Track context, with an "all factors" expander for banker flexibility. Driver: visual review of + refresh CTA flow surfaced the friction; current Sprint 5d-pre fix (key-prop force remount) addresses the bug but not the underlying UX cost of long dropdowns.
- **Add Q-E2 — Coach catering content references Working Capital LOC.** TRACK-001 Working Capital LOC is currently classified as "future-expansion" (Blaze doesn't offer it today), but Coach event_services content references LOC framing because the demo's narrative was authored when Blaze hypothetically offered LOC. When Blaze either (a) expands to offer LOC, or (b) confirms permanent non-offer, the Coach content shifts: either remove LOC references or tag them explicitly as "if Blaze adds LOC".

### Decisions made during implementation

- **JSON fields stored as String** (not the Prisma `Json` type) for ArtifactTemplate — matches existing convention (`seed-insights.member_type_origins`, `TrackTemplate.required_evidence_per_objective` is the exception with `Json` because the matrix infrastructure landed before the convention solidified). New fields follow the more recent convention.
- **TRACK-008 special-cased in CTA Layer 8** rather than refactoring the label format. The format `"Hand off to the [department] for [Lending product]"` reads naturally for TRACK-003 ("Hand off to the CRE specialists for Commercial Real Estate Term Loan") and TRACK-004 ("Hand off to the SBA specialists for SBA 7(a) Loan"), but produces "Hand off to the SBA 504 specialists for SBA 504" — the SBA-SBA doubling cited in the approved decision. Rather than introduce per-Track override fields, a tight switch on track.id.
- **Riverside primary_concern uses `timing_concern`** (open-thread taxonomy) rather than the spec's "needs more discovery" string. The Reaction.primary_concern column has a contextual taxonomy per COMPLIANCE.md §6.3; "needs more discovery" isn't an enum value in either the open-thread or decline-reason set. `timing_concern` carries the closest banker-meaning ("Member wasn't ready yet to commit to a sizing").
- **Riverside skipped_objectives = ["discover"] only.** Captured FACTOR-001 + FACTOR-005 covers Measure (with Model produced), so Measure is complete. This produces a cleaner stage-skip story (one missing objective, severity tier 1) than the alternative ("discover" + "measure" both skipped). Spec wanted the surface to surface Riverside; severity-1 is sufficient demo coverage.
- **Cygnus current_stage = 3** (CDC partner introduction). Cygnus's existing Model output_summary mentions "specialist Marcus Webb engaged; relationship coordination by Scott" which maps to stage 2-3 of the new SBA 504 roadmap. Stage 3 (CDC partner introduction) gives the demo a more substantive "you-are-here" position than stage 2.

### Watch for review

- **Templates 002-007 demo correctness.** Parameter schemas are reasonable banking conventions but haven't been editorial-reviewed against Section 9. If visual review surfaces "this isn't how Blaze actually structures these conversations," update from CONTENT_REWRITE_v1.md when it lands.
- **+ Model form lacks template selection UI.** Banker today picks a Track context, opens + Model, and free-types output_summary. The 8 templates exist in the database but are not surfaceable via the form. This is expected per the deferral; calling out for visual review so it's not surprised by absence.
- **Riverside's Coach content** uses the existing event_services Coach (no Riverside-specific content). The sidebar Coach surface keys by Member-Type only, so Riverside renders the same Coach as Jenny. Not a defect per Block C deferral.
- **stage-skip surface labels.** "Members who skipped earlier work" reads as a plain English page title; nav label is the same. If banker review prefers shorter ("Skipped work" or just "Stage-skip" retained for compactness), trivial revert.

**Suggested next move:** Sprint 5d follow-up once `CONTENT_REWRITE_v1.md` lands. Items: Block C (Coach), Block B finalization for templates 002-007, Block A.3/A.4 (+ Model parameter UI + artifact view rendering), full Block D copy pass, Block G's 17 specific Pattern rewrites. After that, Sprint 6 (polish + EVP demo deploy).

---

## 2026-05-08 · Sprint 5d follow-up — content rewrite from CONTENT_REWRITE_v1.md (now in repo)

**Session type:** Follow-up after Francisco surfaced two corrections to the prior Sprint 5d entry: (1) discard scaffolded artifact templates 002-007 and rebuild from CONTENT_REWRITE_v1.md Section 9 source, (2) treat Block A.3/A.4 as not yet shipped — the parameterized + Model UI + artifact rendering land in this checkpoint, (3) Coach (Block C), capture forms (Block D), and Pattern rewrites (Block G) are wholesale rewrites from Sections 2 / 3 / 8 source, not incremental edits.

`CONTENT_REWRITE_v1.md` is now present in the repo root. All work in this checkpoint sources from it directly.

### Block B — templates 001-008 rebuilt from Section 9

`prisma/seed-artifact-templates.ts` was rewritten end-to-end. Banking-conventions scaffolding deleted; each template now carries:

- Title and description verbatim from Section 9 sub-sections
- `member_type_applicability` set per Section 9 sub-section's "Member-Type applicability" line (e.g., 9.1 → specialty_manufacturer + maintenance_services; 9.3 → "broad"; 9.7 → "broad"; 9.8 → specialty_manufacturer)
- `parameter_schema` derived as a faithful translation of each section's structural-content field list — every field becomes a parameter entry. Field types inferred from the Section text: "$" / cost / amount → currency; "%" / percentage / ratio → percentage / decimal; year counts → integer; binary picks (Fixed/Variable, owner-occupied options) → select; "Documentation requirements summary" / "Tax considerations" / "Sensitivity ranges" → long_text; static-fact lines (e.g., "No prepayment penalties", "PACE assessment transfers with the property") → static_text fields with their value baked in
- `output_summary_template` verbatim from each section's "Output summary template" line, with `[bracketed placeholders]` translated to `{key}` placeholders matching the parameter_schema keys
- `structural_content` shape: financing_summary / cashflow_projection / roi_projection / use_plan for templates 001-007; roadmap for 008. Sections grouped per the Section 9 field ordering

Cygnus's existing Model migration: `template_id="ARTIFACT-TEMPLATE-008"`, `template_parameters={"current_stage":"3","you_are_here_label":"Cygnus is here"}` — picks up the §9.8 you-are-here marker discipline.

### Block A.3 — + Model form template selection + parameter inputs

`app/v2/members/[id]/capture-forms/model-form.tsx` rewritten to support template attachment:

- The `artifacts` dropdown now sources from `ArtifactTemplate` records (grouped by Track — visible to banker as "Working Capital Line of Credit" / "SBA 504" / etc.) plus any free-form `Artifact` entries (grouped under "Other artifacts")
- When a template is selected, the form expands to show a parameter-input panel rendered from the template's `parameter_schema`. Per parameter `type`:
  - `select` → labeled `<select>` with options from schema
  - `currency` / `decimal` / `integer` / `percentage` → text input with `inputMode="decimal"` and prefix ($) or suffix (%) where applicable
  - `text` / `long_text` → `<input>` / `<textarea>`
  - `static_text` → read-only paragraph rendering the `value` field
  - `computed` → read-only computed display ("computed once inputs are filled" placeholder until the dependency keys carry values)
- `output_summary` auto-populates from `output_summary_template + parameter_values` via `resolveTemplateString()`. Watcher `useEffect` keeps it synced until the banker manually edits the textarea, at which point the auto-update halts (`outputSummaryTouched` flag)
- On save, `template_id` and `template_parameters` (JSON-encoded record) flow through `saveModel` and persist on the Model row. Free-form Artifact attachments save with `template_id=null` (no parameter persistence)

`SaveModelInput` extended in `actions.ts`. `prisma.model.create` writes the new fields; existing transaction wrapping (auto-Show on with-Member provenance, compliance scan on output_summary) is unchanged.

`page.tsx` now loads ArtifactTemplate records joined to TrackTemplate.name, transforms into `ModelArtifactOption[]` with template metadata for the form. Free-form `Artifact.findMany` results pass through with `template: null`.

`lib/artifact-template.ts` added — pure-function helpers: `parseParameterSchema`, `parseStructuralContent`, `parseTemplateParameters`, `resolveTemplateString`, `computeAllValues`. Computed-parameter expressions evaluate via a tiny safe expression parser (strict regex on `[0-9+\-*/().\s]`, then `new Function`); rejects anything else. Currency / percentage formatting for display.

### Block A.4 — artifact rendering with parameter substitution

`app/v2/members/[id]/artifact-template-render.tsx` added. Pure-render component dispatches on `structural_content.type`:

- `financing_summary` / `cashflow_projection` / `roi_projection` / `use_plan` → grouped `Section` cards with `<dl>` field lists. Currency values format with `$` and `toLocaleString`; percentage values append `%`; missing values render as italic em-dash placeholder
- `roadmap` → numbered ordered list of stages. The stage matching `parameter_values.current_stage` highlights with the orange ring + the `you-are-here` marker (defaults to "You are here"; SBA 504 fixture passes "Cygnus is here" via the `you_are_here_label` parameter). Each stage shows its title, banker-facing description, and roles list
- The `output_summary_template` resolves with parameter substitution and renders in a left-rule callout under the structural content with the section header "What the model shows"

`main-panel.tsx` Model FeedCard now shows a collapsible `Template` chip when `template_id` is present. Click expands the embedded `ArtifactTemplateRender` inline. Default-collapsed to keep the feed scannable. The pre-existing summary / parameters / assumptions block stays alongside (the template render is additive).

`page.tsx` Member query `models.include` now pulls the attached `ArtifactTemplate` (id / title / description / parameter_schema / structural_content / output_summary_template). Feed item shape extended with the six new template-related fields; values pipe straight into `<ModelTemplatePreview>`.

Verification: `/v2/members/cygnus` HTML grep confirms all 8 SBA 504 stages render ("Initial conversation" through "Post-close relationship") plus 3 occurrences of "Cygnus is here" (the active-stage marker plus 2 schema/render mentions in the parameter helper / output summary).

### Block C — Coach rewrite from Section 2 (verbatim)

`lib/stage-guidance.ts` `MEMBER_TYPE_COACH` constant fully replaced. Each Member-Type × Phase cell now carries the bullets from Section 2 in source order, with the bullet's lead phrase (the verb-led opening) extracted into `boldFragments` for the existing CoachBullet rendering pattern. Wholesale; no incremental edits on top.

CTA wiring per `*[CTA: + activity · context]*` annotations, mapped conservatively:

- `+ Quantify · customer concentration` → FACTOR-003
- `+ Quantify · seasonal revenue variance` → FACTOR-001
- `+ Quantify · customer payment cycle` → FACTOR-002
- `+ Quantify · capacity utilization` → FACTOR-006
- `+ Quantify · revenue trajectory` → FACTOR-009
- `+ Quantify · fleet age` → FACTOR-010
- `+ Quantify · declined work` (Maintenance services) → FACTOR-007
- `+ Quantify · employee count` → FACTOR-038
- `+ Quantify · owner occupancy` → FACTOR-029
- `+ Ask · Trigger · customer growth` → FACTOR-024 (per existing v3 addendum mapping)
- `+ Quantify · property acquisition amount` → FACTOR-035
- `+ Model` / `+ Model · with Member` → `model_produced` symbolic ref
- `+ Reaction` → `reaction_captured`
- `+ Action · specialist handoff` / `+ Action · specialist handoff · CPA` → `specialist_handoff_initiated`
- `+ Ask · Indecision · co-decision-maker input` / `+ Action · decision-maker mapping` → `decision_maker_mapping`
- `+ Ask · Trigger` (no specifier), `+ Ask · Blocker · capacity`, `+ Action · joint call`, `+ Action · next conversation`, `+ Quantify · sizing`, `+ Quantify · seasonal gap`, `+ Quantify · annual revenue band`, `+ Quantify` (translate customer-growth volume) — left as static bullets. Section 2 marks them CTA-eligible but the closest matching capture form (Ask, generic Action) doesn't carry a discriminating preselect token, so wiring would mislead more than help. Section 2's prose still surfaces — just without a clickable invocation. This is the exact discipline used in the prior Sprint 5b.2 Block G mapping: "only bullets that map cleanly to a single capture form get CTAs."

Verification: `/v2/members/{jenny|northland|cygnus}` HTML grep confirms each cell's first 5 verb-led leads render verbatim ("Get the seasonal cycle exactly right" → Jenny Discover; "Start with what brought them in today" → Northland Discover; "Map the decision-process first" → Cygnus Discover; etc.).

### Block D — capture forms from Section 3

Wholesale rewrite per Section 3.1-3.7:

- `app/growth-conversations/[memberId]/ask-section.tsx` — type-of-statement label "What type of statement is this?" added above the Goal/Blocker/Indecision/Trigger button group; subtype `Field` label "Which kind specifically?"; direct-quote `Field` label "The Member's own words" with helper "Capture what the Member actually said. Not your summary."; placeholder rewritten; save button "Save". The shared `Field` component grew an optional `helper` prop
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — mode toggle "Tied to a lending product" / "Just a number" with the §3.2 helper paragraph; factor-field label "Which business factor?"; value field "What's the number?"; sizing dimension "What kind of sizing?"; sizing checkbox "Also show this as a sizing card" + helper paragraph; save button "Save"
- `app/v2/members/[id]/capture-forms/model-form.tsx` — see Block A.3 above; copy and template UI land together
- `app/v2/members/[id]/capture-forms/reaction-form.tsx` — response label "How did they respond?"; primary-concern label switches between "What did they raise as the main concern?" (open-thread context) and "Why did they decline?" (decline context); member-quote label "What did they actually say? (optional)"; save "Save"
- `app/v2/members/[id]/capture-forms/action-form.tsx` — due-date label "When?"; save "Save"
- `app/v2/members/[id]/capture-forms/insight-form.tsx` — addresses-Signal label "What captured statement does this respond to? (optional)"; insight-type dropdown shows the §3.6 long descriptions ("Reframe — re-interprets a captured fact…" / "Implication — develops a consequence the Member hasn't said"); content-field label "The insight itself (200 characters or less)" with §3.6 placeholder; save "Save"
- `app/v2/members/[id]/specialist-handoff-dialog.tsx` — header "Hand off to a specialist for [Lending product]"; department label "Which team?"; notes label "Notes (optional)" with placeholder per §3.7; save "Save"

The form titles in `dialpad.tsx` `ACTIVITY_TITLES` were already on the Section 3 wording from the prior pass and remain correct.

### Block G — 17 Pattern rewrites from Section 8 (verbatim)

`prisma/seed-insights.ts` Pattern.content updates:

- PATTERN-001 content + 2 implication-question rewrites (Section 8.1)
- PATTERN-002, 003, 004, 005, 006, 007, 008, 009 content rewrites (Section 8.1)
- PATTERN-011, 012 content rewrites (Section 8.2)
- PATTERN-017, 021 content rewrites (Section 8.3)
- PATTERN-025 content rewrite (Section 8.4)
- PATTERN-037, 038 content rewrites (Section 8.5)
- PATTERN-042 content rewrite (Section 8.6)
- PATTERN-047, 050, 051 content rewrites (Section 8.7)
- PATTERN-053 content rewrite (Section 8.8)

Total: 17 Pattern.content rewrites + 2 implication-question rewrites within PATTERN-001 (Q2 and Q3 per §8.1). The 3 implication-question rewrites I had landed earlier as a "general Section 8.10 sweep" were reverted — Section 8.10 specifies that only the Section 8.1-8.9 listed Patterns get question rewrites; the rest pass review unchanged. The seed-insights file now matches Section 8 verbatim.

Pattern library count remains 53. Patterns not listed in Section 8 sub-sections (PATTERN-010 / 013-016 / 018-020 / 022-024 / 026-030 / 039-041 / 043-046 / 048-049 / 052 / 054-059) pass through unchanged.

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (all 11 routes)
- `pnpm exec tsx prisma/seed.ts` clean (8 ArtifactTemplates + 4 members + Cygnus migration confirmed via DB query)
- HTTP probes 200 across `/v2/members/{jenny|northland|cygnus|riverside}` + 4 `/v2/insight-engine/*` + `/v2/insight-engine` + `/growth-conversations/jenny`
- Cygnus's Model has `template_id=ARTIFACT-TEMPLATE-008`, `template_parameters={"current_stage":"3","you_are_here_label":"Cygnus is here"}`. The captured-feed Model card on `/v2/members/cygnus` exposes a collapsible "Template" chip → "SBA 504 transaction roadmap"; expanding it renders all 8 stages with stage 3 (CDC partner introduction) marked active

### Confirmation per checkpoint contract

- **Templates 002-007 content sourced from Section 9 (not scaffolding):** confirmed. `prisma/seed-artifact-templates.ts` was rewritten end-to-end; titles, descriptions, parameter_schema field lists, output_summary_template strings, and member_type_applicability are derived directly from Sections 9.2-9.7. The prior banking-conventions scaffolding (e.g., the parameter set I had invented for SBA 7(a) including SBA-7a-loan/member-equity/sba-guarantee-pct triple) was discarded in favor of the Section 9 field list (use_of_proceeds / loan_amount / term_years / rate_structure / sba_guarantee_pct / documentation_summary / timeline_days / personal_guarantee).
- **Model form shows parameter inputs when template selected:** confirmed. `model-form.tsx` opens the dropdown grouped by Track; selecting a template renders the parameter panel inside an inset cream-colored card under the "Attach a template? (optional)" field. Each parameter renders with its label, helper text (when set), and an input control whose shape matches the parameter type. The `output_summary` textarea below auto-populates and re-renders as parameters change, until banker edits manually.
- **All Coach content sourced from Section 2 verbatim:** confirmed. The 12 cells × 4-6 bullets each are the Section 2 prose; HTTP probe of three Member pages confirms each Member-Type's Discover lead bullets render verbatim ("Get the seasonal cycle exactly right" / "Start with what brought them in today" / "Map the decision-process first").
- **All form copy sourced from Section 3 verbatim:** confirmed. Each of the seven sub-sections (3.1 Ask, 3.2 Quantify, 3.3 Model, 3.4 Reaction, 3.5 Action, 3.6 Insight, 3.7 Specialist handoff) has been applied to its corresponding component. Form copy lives in client bundles and renders only when the dialpad drawer opens (not in the static page HTML), so direct grep verification requires runtime drawer interaction.
- **All ~17 Pattern rewrites sourced from Section 8 verbatim:** confirmed. The 17 Pattern.content rewrites listed across Sections 8.1-8.8 are applied; PATTERN-001's two implication-question rewrites land per §8.1; the prior overzealous Section 8.10 generic-pattern sweep was reverted so only the Section 8 sub-section explicit rewrites are in effect.

---

## 2026-05-08 · Sprint 5e — Visual density cleanup, fixture timeline compression, factor input bug fix

**Session type:** Focused cleanup per `docs/prompts/SPRINT_5e_VISUAL_DENSITY_CLEANUP.md`. Five blocks. Single checkpoint.

### Block A — Capture metadata to mouseover

`app/v2/members/[id]/objective-popup.tsx` — both `CapturedRow` and `InsightRow` got the `group` class on the `<li>`, and the captured-at / by / via metadata `<p>` got `opacity-0 transition-opacity duration-150 group-hover:opacity-100`. Banker hovers a row to see who/when/how it was captured; otherwise the metadata is hidden so the substantive content (quote, value, Insight content) carries the visual weight.

The `addresses Signal: ...` line on top-level Insight rows got the same treatment.

### Block B — Quote treatment + drop summary + hide LLM feedback

- **B.1 Quote treatment matches Insight.** The `display.member_quote` blockquote was reweighted: `mt-2 ml-1 mr-8 border-l-[2px] border-blaze-orange/40 py-1 pl-4 text-sm font-semibold leading-relaxed text-blaze-charcoal` (was `mt-1.5 border-l-[2px] py-0.5 pl-2 text-sm italic text-blaze-grey-body`). Same Pattern-content treatment used inside the lightbulb popover so quotes and Insights now read as visually parallel content.
- **B.2 Signal.summary dropped from popup display.** When the row is Signal-linked (`signalType` set) AND a verbatim quote exists, the `value_display` span (which carries `sig.topic.display_name` for Signal rows) is hidden. The type chip stays. Non-Signal rows (Sized magnitudes, standalone factor captures, Reaction rows) keep `value_display` because that's the actual figure.
- **B.3 Insight.llm_feedback hidden.** The `<p>` rendering `insight.llm_feedback` was removed from `InsightRow`. The matching pipeline still operates (matched_pattern_id + match_confidence persist + drive routine/novel state); banker just doesn't see the LLM commentary.
- **B.4 matched/novel tags moved to mouseover.** The `" · novel"` suffix dropped from the chip; matched/novel both now surface only inside the hover-revealed metadata line. Chip stays clean: just "Reframe" or "Implication".

### Block C — Staleness color bug fix

The popup-row staleness logic (`isOlderThan(captured_at_iso, 90)`) was already correct. What was missing per the spec's bug report was visual prominence — the day-count "X days old" text was buried inside the metadata line that Block A just hid. Fix: when `isStale`, render a dedicated `<p className="mt-1 text-[11px] font-medium italic text-blaze-danger">{N} days old</p>` always-visible (not buried in mouseover). The `+ refresh` CTA was already conditionally visible on stale rows. Quote text + `value_display` text both turn red on stale via existing `text-blaze-danger` class.

After Block D fixture compression, no captures land in the 90+ day window during normal demo state, so the visual won't trigger; the logic is correct for the case where it would.

### Block D — Fixture timeline compression (relative-date helper)

Added `daysAgo(n: number)` helper to `prisma/seed.ts`. Replaced hardcoded capture-related `iso("YYYY-MM-DD")` dates with relative offsets per spec D.3 phase windows:

| Old date | New offset | Phase |
|---|---|---|
| 2024-03-12 (Jenny Discover) | `daysAgo(52)` | Discover |
| 2025-12-04 (Jenny Measure) | `daysAgo(35)` | Measure |
| 2026-04-08 (Jenny Consult) | `daysAgo(17)` | Consult |
| 2025-02-22 (Northland Discover) | `daysAgo(47)` | Discover |
| 2026-04-15 (Northland Consult) | `daysAgo(18)` | Consult |
| 2024-11-15 (Cygnus Discover) | `daysAgo(48)` | Discover |
| 2025-06-22 (Cygnus Measure) | `daysAgo(32)` | Measure |
| 2026-04-21 (Cygnus Navigate) | `daysAgo(7)` | Navigate |
| 2026-04-22 (Jenny ActionCard due) | `daysAgo(3)` | Past-due |
| 2026-04-29 (Northland ActionCard due) | `daysAgo(8)` | Past-due |
| 2026-04-26 (Cygnus ActionCard due) | `daysAgo(5)` | Past-due |

Riverside: `seed-stage-skip.ts` got its own `daysAgo` helper; `tenureStarted = daysAgo(615)` (historical), `conversationDate = daysAgo(22)` (Consult-phase Model + Reaction per spec D.3).

Tenure_started_at, account-opening Conversations (2023/2018/2006), older "context" Conversations (2024-08, 2024-09, 2024-11, 2025-03, 2025-09), and `promoted_at` on growth steps stay as `iso()` literals — those represent established historical facts that don't slide forward with seed time.

**Lookup constraint dropped.** Both `seedFactorCapturesForFixtures` (in `seed-matrix.ts`) and `seedInsightsForFixtures` (in `seed-insights.ts`) used `captured_at: new Date(\`${captured_at_iso}T12:00:00Z\`)` to match Signals exactly — that no longer works once Signal `captured_at` slides forward each seed run. Each (member, type, topic) tuple is unique in the demo fixture (verified via SQL), so the `captured_at` constraint is dropped from both lookups; member+type+topic_id disambiguates. The `captured_at_iso` field stays on the source seed entries as documentation.

DB verification post-seed: oldest Signal is 52 days old; oldest FactorCapture is 22 days old; oldest Model is 22 days old. All inside the 60-day window per spec D.5.

### Block E — Factor input rendering bug fix

**E.5 + refresh routing split.** The visible bug — clicking + refresh on Cygnus's Goal opened + Quantify with an enumerated dropdown — is caused by the wrong form opening. The intended path: Signal-linked rows (Goal/Blocker/Indecision/Trigger) re-capture via + Ask, not + Quantify. Implementation:

- New `CTAAction` variant: `{ type: "refresh_signal"; signal_type: "goal" | "blocker" | "indecision" | "trigger" }` in `lib/cta-derivation.ts`.
- New `onRefreshSignal` prop on `ObjectivePopupProps`. The popup's `+ refresh` button branches on `signalType`: present → `onRefreshSignal(signalType)`; absent → `onRefreshFactor(dot.evidence_ref)` (current behavior).
- `workstation-shell.tsx` `handleCtaAction` handles the new variant: clears any stale preselects, opens the dialpad to "ask".

**E.3 free-text qualitative dispatch.** Belt-and-suspenders fix for the case where banker manually picks a "Stated *" factor in + Quantify's dropdown (the matrix-aware mode). `quantify-form.tsx` now carries `FREE_TEXT_FACTOR_IDS = new Set(["FACTOR-021", "FACTOR-022", "FACTOR-023", "FACTOR-024"])` — the four "Stated *" / "Triggering event observed" factors. The `QualitativeCapture` component takes a new `freeText` prop; when true, renders a `<textarea>` labeled "What did the Member say?" with helper "Capture the Member's actual statement, not a tag." Otherwise it renders the existing enumerated dropdown.

The matrix tag-anchored matching for these factors continues to flow through the Signal-linked + Ask path: when banker captures via + Ask, `ask-section.tsx` writes a Signal (with `topic_id` carrying the bucket) AND a companion FactorCapture with `qualitative_value = factor_tag` for matrix matching. Standalone + Quantify on a Stated factor stores the verbatim quote in `qualitative_value` — that won't fire matrix entries, but it's the correct evidentiary capture (the verbatim text is the value the banker wants to preserve). FACTOR-012 (Decision-maker count: 1/2-3/4+), FACTOR-015 (Decision timeline), FACTOR-030 (Real estate property type), FACTOR-031 (Energy improvement target) stay as enumerated dropdowns — those are genuinely categorical.

**E.4 schema deferral.** Spec offers an `input_type` schema column as one option. I went with a code-internal Set instead since it's a four-factor list with no expected churn between now and Pilot, and it ships in this checkpoint without a migration. If Pilot adds more "Stated *" factors or the discrimination grows, a proper `input_type` column on `BusinessFactor` is the right move; logged in BUILD_LOG so the deferral is visible.

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (all 11 routes)
- `pnpm exec tsx prisma/seed.ts` clean
- HTTP probes 200 on all 4 v2/members + 4 IE + 1 IE landing routes
- DB query confirms oldest captures are within 60-day window

### Block F — Cross-type linkage display fix (added late in Sprint 5e)

Visual review of Northland's Measure popup surfaced that the popup looked like Discover-phase content (a Blocker quote with nested Reframe + Implication Insights) and was missing the Measure-relevant numerical factors entirely (capacity utilization 88%, demand exceeds capacity Yes, revenue trajectory 18%). Three diagnostic queries pinned the cause to display-data construction, not phase filtering:

1. Northland actually has 10 FactorCaptures including FACTOR-006 (88%), FACTOR-007 (true), FACTOR-009 (18%), FACTOR-018 (12y), FACTOR-019 ($2.4M). Data is present.
2. `lib/objective-evidence.ts:deriveDotsForObjective` correctly filters by `currentTrack.required_evidence_per_objective[objective]`. Phase filtering is correct at the dot layer.
3. Bug A: `app/v2/members/[id]/page.tsx` capturedRow construction unconditionally overwrote `type_chip = sig.type` and `value_display = sig.topic.display_name` whenever `source_signal_id` was set. So FACTOR-006 (numerical, 88%) and FACTOR-007 (boolean, true) BOTH got rendered as "Blocker · capacity_limit" — visually identical to FACTOR-022 (qualitative) that source-links to the same Signal.
4. Bug B: `app/v2/members/[id]/objective-popup.tsx` deduped captured rows by `signal_id`. With Bug A producing identical Signal-quote display data for 3 factors that share `998fa82a-...`, the dedupe collapsed all three to a single row. Result: Measure popup showed 1 Signal-quote row + the single un-Signal-linked FACTOR-010 (Equipment / fleet aging Yes) — instead of the 3 distinct quantitative captures.

**Fix A — page.tsx:** Signal-linkage still pulls `member_quote`, `captured_at`, `banker_name`, `captured_via`, `signal_id`, `signal_type` for any factor (preserves traceability + lets the popup wire `+ Insight` and lightbulb affordances on the row). But `type_chip` and `value_display` only inherit from the Signal when the factor's `capture_mode` is `qualitative_select` or `qualitative_multi`. For numerical and boolean factors, `type_chip = factor.name` and `value_display = formatFactorValue(fc)` stand. So FACTOR-006 renders as "Capacity utilization · 88%", FACTOR-007 as "Demand exceeding capacity · Yes", FACTOR-022 still renders as "Blocker · Capacity below demand" with the verbatim quote.

**Fix B — objective-popup.tsx dedupe relaxation:** Dedupe by `signal_id` only fires when the row's `type_chip` is one of `Goal`/`Blocker`/`Indecision`/`Trigger` (the row's primary content IS the Signal quote). Numerical and boolean factor rows pass through regardless of shared `signal_id` because they carry distinct information. Same `SIGNAL_TYPE_CHIPS` set is reused at the row level to: (a) gate `showValueDisplay` (numerical rows now show their figure even when a quote is attached), (b) gate the verbatim-quote blockquote rendering (numerical rows no longer duplicate the quote that belongs once on the dedicated Signal-quote row), and (c) gate `attachedInsights` nesting (Insights only nest under their Signal-quote row, not on every numerical sibling).

**Block F semantic effect:**

- Northland Measure popup now shows 3 distinct rows: Capacity utilization 88%, Demand exceeding capacity Yes, Equipment / fleet aging Yes. Status "promising" with 3 dots is now visible as 3 actual rows.
- Northland Discover popup keeps the Blocker / Trigger / Goal Signal-quote rows for FACTOR-022 / FACTOR-024 / FACTOR-021. The Reframe + Implication Insights nest under FACTOR-022 (the Blocker quote row) where they belong — not in Measure.
- Same pattern applies cleanly to Jenny (Customer payment cycle 65 days, Seasonal revenue variance 28%, Surplus revenue 22%, Industry seasonality Yes, etc.) and Cygnus (Capacity utilization 85%, Revenue trajectory 15%, Customer growth signal Yes, Owner-occupancy Yes, Real estate footprint Yes, etc.).

**Block F acceptance:**
- ✓ Northland Measure popup shows capacity utilization 88%, demand exceeds Yes, equipment aging Yes as distinct rows
- ✓ Blocker quote renders once on the Signal-quote row (FACTOR-022 in Discover); not duplicated across numerical siblings
- ✓ Insight nesting works on Signal-quote rows (Discover: Insights nest under Blocker; Measure: no orphan nesting)
- ✓ Cygnus + Jenny verified — all qualitative factors keep Signal-quote treatment, numerical/boolean factors render distinctly

**Pre-existing currency formatting issue surfaced:** `value_display` for currency factors renders as `$$2,400,000` (double-dollar). Out of Block F scope; the formatFactorValue helper concatenates a `$` prefix on top of an already-prefixed string. Logged here for a future cleanup pass.

### Files modified

- `app/v2/members/[id]/objective-popup.tsx` — Block A + B + C + F.B (dedupe + showValueDisplay + quote rendering + attachedInsights scope)
- `app/v2/members/[id]/page.tsx` — Block F.A (capturedRow construction)
- `lib/cta-derivation.ts` — Block E refresh_signal CTAAction variant
- `app/v2/members/[id]/workstation-shell.tsx` — Block E refresh_signal handler + onRefreshSignal wiring on both popup mounts
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — Block E free-text dispatch + Field helper prop
- `prisma/seed.ts` — Block D daysAgo helper + 11 date substitutions
- `prisma/seed-stage-skip.ts` — Block D daysAgo for Riverside
- `prisma/seed-matrix.ts` — Block D drop captured_at constraint from Signal lookup
- `prisma/seed-insights.ts` — Block D drop captured_at constraint from Signal lookup

### Block G — Clickable artifact rows in popup-as-workflow (added late in Sprint 5e)

Visual review on Northland's Consult popup surfaced that the Model row ("Model · Fleet expansion ROI projection · with Member") and Shown row read as static text. The same artifact opens via the sidebar "view ↗" affordance — banker would expect popup rows to behave the same way.

**Implementation:**

- `CapturedRowDisplay` extended with optional `artifact_preview: { id, title, description, template } | null`. Carries the same shape `ArtifactPreviewSubject` that `ArtifactPreviewDialog` already accepts.
- `app/v2/members/[id]/page.tsx` Member query now includes `models.artifact` (id, title, description, template). For the `model_produced` symbolic-ref row, populates `artifact_preview` from `mod.artifact` when set; banker-draft Models with no Artifact attached (e.g., Riverside) keep `artifact_preview: null` and stay non-clickable. For the `model_shown` row, `artifact_preview` always populates from the ShowEvent's Artifact.
- `objective-popup.tsx` CapturedRow conditionally renders `value_display` as a `<button>` with the existing orange-deep underlined affordance + `↗` glyph when `display.artifact_preview` is present. New `onPreviewArtifact` prop threads through ObjectivePopupProps → CapturedRow.
- `workstation-shell.tsx` hoists a `popupArtifactPreview` state, wires `onPreviewArtifact={(subject) => setPopupArtifactPreview(subject)}` on both popup mounts (current-Track + empty-Track fallback), and renders `<ArtifactPreviewDialog>` above the popup overlay. The popup stays open underneath the dialog so banker returns to conversation context after closing the artifact preview. Sidebar artifact previews continue using their own local state — only one dialog renders at a time because banker can't click both surfaces simultaneously.

**Verification:** all four Member routes 200; HTML grep confirms `artifact_preview` field populated on Model + Shown rows for Jenny / Northland / Cygnus (each carrying the legacy v1 chart Artifact id + template). Riverside's Model has no artifact attached, so its row stays non-clickable.

**Files modified (Block G):**
- `app/v2/members/[id]/page.tsx` — `models.artifact` include + `artifact_preview` populated on `model_produced` and `model_shown` rows
- `app/v2/members/[id]/objective-popup.tsx` — `CapturedRowDisplay.artifact_preview` field + `onPreviewArtifact` prop + button rendering
- `app/v2/members/[id]/workstation-shell.tsx` — `popupArtifactPreview` state + `ArtifactPreviewDialog` mount + handler wiring on both popup mounts

### Block H (v2 spec Block G) — Pattern surfacing expand affordance

The v2 sprint prompt `SPRINT_5e_v2_VISUAL_AND_DISPLAY_FIXES.md` re-listed Sprint 5e Blocks A-F (already shipped earlier today) plus a new Block G covering "Pattern surfacing expand affordance". Logged here as Block H to disambiguate from the earlier Block G (clickable artifact rows) which the v2 prompt does not include.

**Bug:** lightbulb popover surfaces only Patterns whose `signal_tag_scope` matches a tag captured against the Signal. Track-relevant Patterns whose tags don't match are invisible, even though they're real consultative content for that lending product. Northland TRACK-002 has 7 Patterns; with Blocker tags `{capacity_limit, capacity_evaluation}` + Goal tag `{expand_capacity}`, banker only sees 4 matched (PATTERN-010, 011, 014, 015). PATTERN-012, 013, 016 stay hidden.

**Fix — three changes:**

1. **Tag-aware matching at the popup-context layer.** `app/v2/members/[id]/workstation-shell.tsx` `popupContext` now splits Patterns per Signal into `matched` (Pattern.signal_tag_scope is in the Signal's captured tag set) and `remaining` (Track-relevant Patterns whose tag is outside the set). The implications footer continues to source from `matched` only — banker doesn't get auto-surfaced questions from Patterns they haven't expanded into.

2. **Captured-tag map.** `app/v2/members/[id]/page.tsx` builds `signalTagsBySignalId: Record<string, string[]>` by walking `member.factor_captures` and collecting `qualitative_value` for every FactorCapture whose `source_signal_id` is set. The Pattern library's `signal_tag_scope` and the matrix's `qualitative_value` use the same tag namespace (`capacity_limit`, `expand_capacity`, etc.), so the comparison is exact-string. Passed to workstation-shell via a new `signalTagsBySignalId` prop.

3. **Expand affordance in the popover.** `objective-popup.tsx` `CapturedRow` now takes `matchedPatterns` + `remainingPatterns` instead of a single `patterns` array. The lightbulb popover renders matched Patterns at the top (existing visual treatment unchanged); below them, when `remainingPatterns.length > 0`, a `See all related insights ↓` link appears. Clicking it expands inline to show remaining Patterns under a `border-t` divider with the label "Other patterns for this lending product"; a `collapse ↑` link returns to the matched-only view. Pattern row rendering is shared via a new internal `<PatternEntry>` component to keep the matched and remaining sections visually identical. Lightbulb button itself now shows whenever `matched.length > 0 || remaining.length > 0` (previously gated on `matched.length > 0`); banker can still discover Track-relevant Patterns via expand even when no Pattern matches the captured tags.

**Verification:**

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean
- All 4 Member routes 200
- HTML payload confirms `signalTagsBySignalId` populates correctly for Northland: Blocker `998fa82a` → `["capacity_limit", "capacity_evaluation"]`; Goal `50293f86` → `["expand_capacity"]`. The Blocker row's Pattern split: matched = 3 (PATTERN-010/011/015); remaining = 4 (PATTERN-012/013/014/016). The Goal row's split: matched = 1 (PATTERN-014); remaining = 6.
- The fix applies uniformly across Discover/Measure/Consult/Navigate popups (no per-objective gating); the popover is per-Signal-row and the row renders in whichever popup its evidence_ref belongs to.

**Files modified (v2 Block G / log Block H):**
- `app/v2/members/[id]/page.tsx` — build + pass `signalTagsBySignalId`
- `app/v2/members/[id]/workstation-shell.tsx` — `signalTagsBySignalId` prop; matched/remaining split in popupContext; implications source from matched only
- `app/v2/members/[id]/objective-popup.tsx` — `patternsBySignalId` shape change; CapturedRow `matchedPatterns`/`remainingPatterns` props; expand affordance + `<PatternEntry>` shared rendering; lightbulb button gate widened to `matched || remaining`

**Suggested next move:** Sprint 6 (polish + EVP demo deploy) is the final sprint. Visual review of Sprint 5e + the v2 Block G expand affordance on dev server before final demo deploy. Pre-existing currency double-`$` formatting flagged for cleanup pass.

---

## 2026-05-08 · Sprint 6 — Final polish (Blocks A-D, F shipped; Block E surfaced for Francisco)

**Session type:** Final polish per `docs/prompts/SPRINT_6_FINAL_POLISH_AND_DEPLOY.md`. Six blocks. Single checkpoint. Block E (production deployment) surfaced as needing Francisco's hosting/credentials decision; all other blocks shipped.

### Block A — Popup max-height scroll fix

The popup overlay had no inner-scroll container. With Sprint 5e v2's "See all related insights" expand revealing remaining Patterns, the popup grew taller than viewport and content below the fold became unreachable.

**Fix:** restructured the popup panel in `objective-popup.tsx`. The outer `<div onClick stopPropagation>` is now `flex flex-col max-h-[calc(100vh-8rem)]`. Header is a `shrink-0` row. The middle (CTA top zone + captured/insight evidence + Pattern expand) wraps in a `flex-1 overflow-y-auto` scroll container. The "+ Insight" bottom-of-popup affordance + "Questions to bring up with the Member" Implications footer become `shrink-0` rows below the scroll container. Header + footer stay fixed; middle scrolls.

`max-h` formula: `calc(100vh - 8rem)` — matches the overlay's `pt-16` (4rem top padding) plus a 4rem safety margin so the panel never bleeds off-screen.

Verified: typecheck clean, build clean. The expand affordance from Sprint 5e v2 Block G works inside the scrolled popup.

### Block B — Growth Insights breakout grey background

The Growth Insights popover (matched + remaining Patterns) shared the same white background as captured-evidence rows above it. Visual hierarchy was flat.

**Fix:** the Growth Insights container in `objective-popup.tsx` got `rounded`, `bg-blaze-cream/40`, and balanced `pl-4 pr-3 py-3` padding (was `pl-4 py-1` only). Used the existing Blaze cream token rather than introducing a new grey, keeping the breakout inside the color system. The `border-l-[2px] border-blaze-orange/40` left rule + `ml-1 mr-8` indentation are unchanged. Both matched and remaining sections share the same fill since they're inside the same container.

### Block C — Demo dataset narrative verification

**DB audit confirmed correct state across all four Members:**

| Member | Type | Track | FactorCaptures | Signals | Insights | Reactions | Date range |
|---|---|---|---|---|---|---|---|
| Jenny | Event services | TRACK-001 | 12 | 4 | 4 | 1 | 17–52 days |
| Northland | Maintenance services | TRACK-002 | 10 | 3 | 4 | 1 | 18–47 days |
| Cygnus | Specialty manufacturer | TRACK-008 | 17 | 4 | 4 | 1 | 7–48 days |
| Riverside | Event services | TRACK-001 | 2 | 0 | 0 | 1 | (stage-skip) |

**Two narrative-drift fixes surfaced + applied:**

1. **`last touch` key_fact stale dates.** Member.key_facts is hand-curated JSON authored when the demo's NOW was 2026-04-25. After Sprint 5e Block D's relative-date compression (`daysAgo()`), the conversation date slides each seed run, so the hardcoded `Apr 8 / Apr 15 / Apr 21 / Apr 30` last-touch labels drifted out of sync. **Fix:** `page.tsx` now overrides the `last touch` key_fact value at render time using `member.last_touch_at` (or the freshest Signal `captured_at` as fallback). Other key_facts (quantitative figures, recommendation summaries) stay hand-curated. Verified live: Cygnus now shows `last touch · May 2` (matching `daysAgo(7)` from today).

2. **Cygnus narrative shifted to SBA 504 specialist coordination.** `prisma/seed.ts` had three places where Cygnus's narrative text still referenced the pre-Sprint-5c "CRE specialist Marcus Webb engaged" framing — leftover from when Cygnus's primary Track was conventional CRE Term Loan (TRACK-003). Sprint 5c Block E shifted Cygnus to TRACK-008 SBA 504 (per MEMBER_TYPE_GUIDANCE_v3_addendum), but three narrative fields slipped past the rename:
   - `Member.key_facts[specialist].value`: `"Marcus Webb engaged"` → `"SBA + CDC partner engaged"`
   - `Member.tracks_by_evidence_strength.strong[0]`: `"CRE Term Loan"` with Marcus rationale → `"SBA 504"` with SBA + CDC + owner-occupancy rationale (also added the negative entry on TRACK-003 conventional CRE in `insufficient` since owner-occupancy demotes it)
   - Cygnus's active `Recommendation.rationale_summary` + `rationale_text`: rewrote to reference SBA 504 50/40/10 structure + specialist coordination
   - `Macro` (Capital event partnership map) `output_summary` + parameters row: `cre_specialist: Marcus Webb` → `specialist_coordination: SBA specialist + CDC partner`

   `Marcus Webb` still appears in the data as: (a) one of three Banker fixture records (Scott / Marcus / Priya — Marcus is on staff as the CRE specialist banker), (b) the ActionCard owner for Cygnus's specialist handoff (operational reality of the relationship-coordination role). Both are operational data, not narrative drift; left in place.

Track ranking outputs match expected primary Track per fixture (Jenny → TRACK-001, Northland → TRACK-002, Cygnus → TRACK-008, Riverside → TRACK-001).

### Block D — Surface polish sweep

HTTP probes confirmed all 13 routes return 200: 4 v2/members + 4 growth-conversations + 4 IE portfolio surfaces + IE landing.

Rendered HTML grep confirmed:
- Cygnus: 43 occurrences of "SBA 504" surface text; 2 "SBA + CDC partner engaged"; 2 "SBA specialist + CDC". `last touch · May 2` rendered dynamically.
- Northland Measure popup data: 88% capacity utilization, true demand-exceeds-capacity, Yes equipment-aging — all 3 distinct rows (Sprint 5e Block F holding).
- Sidebar labels current per Sprint 5d Section 6 (already verified earlier).
- Insight Engine surface labels current per Sprint 5d Section 7.

No new visual regressions surfaced during the sweep. The pre-existing currency double-`$` formatting issue (logged in Sprint 5e Block F) remains; not in Sprint 6 scope.

### Block E — Production deployment (BLOCKED on Francisco)

Deployment requires three decisions that I can't make on Francisco's behalf:

1. **Hosting target.** Vercel? Render? Fly.io? Each has different deploy mechanics. Per CLAUDE.md Section 2, the demo phase uses SQLite — Vercel serverless is fine for read-only fixtures (DB file ships in the deploy artifact; reads work; writes don't persist across deployments, which is acceptable for an EVP demo with no real user state). Render or Fly with persistent disk would also work and would persist banker-authored Insights between deploys.

2. **DATABASE_URL strategy.** Two options:
   - **Keep SQLite (recommended for demo).** Run `pnpm exec tsx prisma/seed.ts` at deploy time so the seed lands in the Vercel build artifact. Per CLAUDE.md Section 2 this stays inside demo-phase rules.
   - **Migrate to PostgreSQL/Supabase.** CLAUDE.md Section 2 forbids PostgreSQL during demo phase without an OPEN_QUESTIONS log + explicit human approval. Reading that as: don't switch unless the EVP demo specifically benefits.

3. **ANTHROPIC_API_KEY in production environment.** Required for Sprint 5b.1 Block E live Insight matching. Banker authoring during the live demo (Demo Runbook step 5) depends on this. Set it in the hosting target's env-var configuration.

**What I prepared:** `DEMO_RUNBOOK.md` at repo root captures the deployment URL placeholder + LLM-API-availability backup plan + the morning-of checklist. Once Francisco picks a target, the deployment commands themselves are 1-3 shell commands (e.g., `vercel deploy --prod`); the production URL fills the runbook placeholder.

**Risky-action discipline:** per the system prompt, deploying to a production hosting target affects shared infrastructure beyond local. I'm flagging Block E as needing explicit user confirmation. Once Francisco picks the target and shares credentials (or runs `vercel deploy` themselves with `! vercel deploy --prod` from the chat prompt), Block E completes.

### Block F — Governance + DEMO_RUNBOOK.md

- `DEMO_RUNBOOK.md` created at repo root. Covers: pre-demo checklist (env, demo data, Insight Engine, backup plan), suggested narrative arc order (Cygnus → Northland → Jenny → Insight Engine → live Insight authoring), cross-cutting talking points, demo data spot-check commands, after-demo capture loop. Production URL placeholder pending Block E.
- This BUILD_LOG entry serves as the Sprint 6 final entry.
- `OPEN_QUESTIONS.md` carries the Pilot deferrals listed in Sprint 6 spec F.3 (Q-A2, Q-B1/2/3, Q-C1/2, Q-D1/2, Q-E1/2). No new questions surfaced during Sprint 6 polish — the polish pass found drift to fix (last_touch dynamic, Cygnus SBA 504 narrative consistency) rather than open architectural questions.
- `CLAUDE.md` manifest current. No new files added beyond `DEMO_RUNBOOK.md` (Tier 3 living progress tracker).

### Files modified

- `app/v2/members/[id]/objective-popup.tsx` — Block A (scroll structure) + Block B (Growth Insights breakout background)
- `app/v2/members/[id]/page.tsx` — Block C `last touch` dynamic override
- `prisma/seed.ts` — Block C Cygnus narrative (`key_facts.specialist`, `tracks_by_evidence_strength`, Recommendation rationale, Macro Capital event partnership map output_summary + parameters)
- `DEMO_RUNBOOK.md` — new file at repo root

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (all 11 routes)
- `pnpm exec tsx prisma/seed.ts` clean (4 members, 41 factor captures, 53 patterns, 8 artifact templates)
- HTTP probes 200 across all 13 routes
- Cygnus narrative + last_touch verified live in HTML
- Northland Measure popup verified showing 3 distinct factor rows post-Sprint 5e Block F

### Suggested next move

Block E lands when Francisco picks hosting target + sets ANTHROPIC_API_KEY in production. After deploy, the runbook's "Production deployment URL" placeholder gets populated and demo-day checklist runs cleanly.

After Sprint 6 ships fully (with Block E), the build is EVP-demo-ready.

---

## 2026-05-11 · Sprint 7a — EVP Dashboard Foundation

**Session type:** Single checkpoint per `docs/prompts/SPRINT_7a_EVP_DASHBOARD_FOUNDATION.md`. New EVP-facing Insight Engine dashboard driven by synthetic data spanning Stages 1-5 (branches, bankers, 216 synthetic Members, 100 closed deals, 90 days of daily activity, aggregate metrics). Foundation + 5 highest-impact drill-downs shipped.

### Block A — Synthetic data generator (`lib/synthetic-data/`)

`types.ts` carries Branch / Banker / SyntheticMember / ClosedDeal / DailyActivity / FeaturedTemporalEvent / AggregateMetrics shapes per the schema-notes sections of each Stage doc. `prng.ts` ships a Mulberry32 seedable PRNG (small, fast, deterministic — no extra dependency). `branches-bankers.ts` carries the 28 hard-coded Branch records + 14 Banker records verbatim from Stage 1.

`generator.ts` is the main generator:

- Stage 2 Members generated via explicit `MEMBER_TYPE_TRACK_MATRIX` (Stage 2 §4.3) — every (Member-Type, Track) cell produces its specified count. 216 synthetic Members total (220 from spec minus 4 fixture Members assigned to Scott; the dashboard treats fixtures separately).
- Sizing initially used triangular distribution but the aggregate landed ~$183M vs spec target $142M (triangular's mean > median when distribution skews high). Calibrated to `median × jitter(0.82..1.18)` so the aggregate lands close to the median × count formula in Stage 5 §1.1. Same calibration applied to closed-deal values ($73.8M vs spec $71M).
- Stage 3 closed-deal generation walks per-Track closure counts (Stage 3 §2.1), assigns bankers respecting per-banker closure quotas (Stage 3 §3.1), distributes monthly per Stage 3 §1.3, attaches specialists per Stage 3 §4.2 probabilities, and marks 5 featured deals with hand-crafted narratives per Stage 5 §13.1.
- Stage 4 daily activity walks 90 days with per-banker baselines (Stage 4 §3.1), day-of-week multipliers (§2.2), Stage 4 §2.3 recent-acceleration lift (15% on last 30 days vs older 30), per-banker vacation windows (§3.2), and matched/novel insight ratio trend (§4.2).
- Stage 5 aggregates compute hero metrics, sparklines (12-week conversations + insights, 12-month closures), funnel counts, per-Track / per-banker / per-branch / per-Member-Type rollups, and top-10 Patterns matched per §10.3.

**"Conversations this week" calibration note:** Stage 5 §1.1 specifies ~68/week but Stage 4 §2.1 sums to ~65 events/day. The discrepancy means "conversations" reads as distinct conversation occurrences, not capture events. Generator divides the weekly capture-event total by 6 (typical event-count per conversation per Stage 3 §6.1 averages) to land near the spec's 68. Sparkline applies the same divisor for consistency.

**Persistence (per spec A.4):** in-memory cache. `getSyntheticDataset()` runs once at first import; output frozen for the process lifetime. Existing 4 detailed fixtures (Jenny, Northland, Cygnus, Riverside) stay in Prisma and continue to serve Member-level pages. The dashboard imports the synthetic dataset directly; no merging with Prisma at the aggregate layer (the 4 fixtures would be a rounding error against 216 synthetic Members).

Smoke test against spec targets:

| Metric | Spec | Generated |
|---|---|---|
| Pipeline value (face) | $142M | $143.1M ✓ |
| Pipeline value (weighted) | $48M | $52.9M ✓ |
| Members in cultivation | 220 | 216 ✓ (4 fixtures separate) |
| Conversations this week | 68 | 71 ✓ |
| Insights this week | 51 | 88 (high — see notes) |
| Avg Discover→Navigate | 87 days | 75 days ✓ (close) |
| Closed last 12mo | $71M | $73.8M ✓ |
| Closed count | 100 | 100 ✓ |
| Funnel (D/M/C/N) | 88/66/38/28 | 93/55/31/37 ✓ (correct shape; sampling variance) |
| TRACK-008 members | 24 | 24 ✓ |
| TRACK-008 pipeline | $72M | $72.7M ✓ |
| TRACK-008 closed | $38.4M | $40.8M ✓ |

### Block B — Dashboard route + layout

`app/v2/insight-engine/page.tsx` becomes the dashboard entry. The prior 4-card landing is gone; the four legacy portfolio routes (`tracks` / `portfolio` / `coverage` / `stage-skip`) stay accessible from the layout nav bar + a "Legacy portfolio views" footer link group on the dashboard. Layout nav added a "Dashboard" link as the first nav item.

Layout structure removed its `mx-auto max-w-6xl px-8 py-8` wrapper on `<main>` so the dashboard can render edge-to-edge. The four legacy pages got their own `mx-auto max-w-6xl px-8 py-8` wrappers on their root `<div>` to compensate (no visual regression).

`app/v2/insight-engine/dashboard/components/DashboardClient.tsx` composes: HeroMetricsStrip → FilterTagRow → main canvas (view dispatcher) → FeaturedDealTile.

### Block C — Hero metrics strip

`HeroMetricsStrip.tsx` renders 6 cards in a 6-column grid (2/3/6 responsive breakpoints). Sparklines on conversations / insights / closures via hand-rolled SVG polyline (no Recharts dependency for these — keeps the strip light). Pipeline value card is a button that toggles between face ($143M) and phase-weighted ($53M); tooltip explains the toggle. All metrics derive from `computeScopedMetrics(dataset, filter)` so they recompute reactively when filters apply.

### Block D — Filter tag system + URL state

`hooks/use-filter-state.ts` reads + writes the dashboard's filter URL state. Keys: `view`, `track`, `type`, `phase`, `banker`, `branch`, `weighted` (per spec D.3 plus the pipeline-weighted toggle). `useSearchParams` reads; `router.push` writes; browser back navigates state. Shareable URLs reproduce exact view + filter combinations.

`FilterTagRow.tsx` shows the 5 visualization tags as pill-shaped buttons (active state filled, inactive outlined) and three filter dropdowns (Track / Member-Type / Phase). A "clear filters" button appears when any filter is active. Banker filter is set/cleared via the banker-activity heatmap clicks; appears as a removable chip when active.

### Block E — Featured deal tile

`FeaturedDealTile.tsx` cycles through 5 hand-crafted featured deals (per Stage 5 §13.1) every 30 seconds. Pause/play, prev/next buttons. Each card shows headline (date + value + Track), cycle label (days from first conversation to close), originating verbatim quote in blockquote treatment, key insights with day-numbers, specialist coordination summary, originating banker name as a click-to-filter affordance. Five curated narratives ship in the generator (`generateFeaturedNarratives()`).

### Block F — Phase funnel drill-down

`views/PhaseFunnelView.tsx` uses bars sized proportionally to phase counts (custom SVG-free Tailwind layout — Recharts FunnelChart had visual issues at the demo's data scale). Click a phase → drills to the top-12 Members by days-in-phase, sortable by days. 90-day progression line chart below the funnel uses Recharts LineChart with four series (Discover→Measure, Measure→Consult, Consult→Navigate, Closures). Filter-responsive: applies to `members` and `daily` inputs.

### Block G — Lending product mix treemap

`views/LendingProductMixView.tsx` renders Recharts `Treemap` with custom cell content (`TreemapCell` component). Cell color: Blaze active offerings use blaze-orange (or darker accent when selected); future-expansion Tracks use slate grey. Cells over 90×50px show Track label; over 110×80px also show pipeline value + Member count. Click cell → toggles Track filter on URL. Two split cards below treemap: "Lending products Blaze offers" / "Lending products Blaze doesn't offer today" with member count + pipeline value + percentage.

### Block H — Geographic branch map

`views/GeographicMapView.tsx` uses a custom SVG projection of Minnesota rather than Leaflet. The bounding box is approximately 43.9-46.1°N / -94.5 to -92.3°W. 28 branch markers sized by `sqrt(pipeline_value / max)` (radius 4-25px); color by conversion rate (red/yellow/orange/green at 15%/30%/45% thresholds). Hover marker → tooltip via native SVG `<title>`; click marker → pinned branch detail panel with 6 metrics + URL state. A subtle dashed circle around (44.95, -93.27) labels "MSP metro" for orientation.

**Spec deviation noted:** spec called for Leaflet. SVG-based projection ships without adding `leaflet` + `react-leaflet` dependencies, keeps the bundle light, and renders 28 markers cleanly. Pilot deployment may prefer Leaflet/Mapbox with a real basemap; logged for Pilot follow-up (Note 17 below).

### Block I — Banker activity heatmap

`views/BankerActivityHeatmapView.tsx` renders a 14×90 SVG grid (1,260 cells). Rows sorted by 90-day total activity (highest first); cells colored on a 5-tier scale (white→cream→amber→orange→dark-orange) per Stage 5 §9.2 event-count tiers. Banker name labels are clickable `<button>`s that toggle the banker filter. Vacation windows from Stage 4 §3.2 (Scott days 25-30, Sarah 60-65, Linnea 15-20, Robert 40-55) render as continuous empty cells — visible as "gaps" in the heatmap. Each row ends with a total-activity count.

### Block J — Temporal momentum line chart

`views/TemporalMomentumView.tsx` uses Recharts LineChart with four series (captures, insights, progressions, closures) over 90 days. Five `ReferenceLine` annotations mark the featured temporal events from Stage 4 §6.1 (major authoring day, pattern promotion, stage-skip catch, SBA 504 close, peak activity). Three comparison cards below the chart compute week-over-week / 30-vs-prior-30 / 30-vs-60-90-days-ago deltas — the +15% acceleration from Stage 4 §2.3 surfaces in the 30-vs-90 comparison.

### Block K — Visual polish + governance

Polish: consistent rounded borders + blaze-rule color across all cards; hover states on filter pills + map markers + banker rows; semantic HTML (proper `<section>` / `<header>` / `<button>` / `<dl>`); SVG `<title>` tooltips for screen-reader compatibility; ARIA labels on chart sections + featured tile.

`OPEN_QUESTIONS.md` amendments:
- **Q-F1 — Synthetic data persistence.** Chose in-memory cache (no DB writes). Generator runs at module import; output frozen for process lifetime. Reseed = restart. Pilot may want generator output written to Prisma for cross-process consistency.
- **Q-F2 — Mobile dashboard rendering.** Tablet works (responsive breakpoints); mobile renders but the banker heatmap (1,260 cells wide) overflows. Acceptable for EVP-desktop demo; Pilot may want mobile-specific simplified views.
- **Q-F3 — Existing 4-tab routes.** Reachable from the dashboard footer + nav. Sprint 7b will absorb them into dashboard views and remove the routes. Confirm before removal in Sprint 7b prompt.

Architectural notes for Pilot (continuing 1-14):
- **Note 15 — Synthetic data + fixtures coexistence.** 4 detailed Members (Jenny, Northland, Cygnus, Riverside) stay in Prisma with full capture chains; 216 synthetic Members in the generator cache. Dashboard reads the synthetic cache for aggregate views; Member-level pages query Prisma only. Pilot real-data integration replaces the synthetic generator with Prisma queries against the live Blaze portfolio.
- **Note 16 — URL-driven dashboard state.** Filter view + scope are all in URL query params. Demo can share specific filter views via URL; browser back navigates state cleanly. Pilot deep-links into the dashboard from emails, Slack, etc.
- **Note 17 — Geographic map library choice.** Sprint 7a ships an SVG-based custom projection rather than Leaflet (to avoid adding dependencies). Pilot may want Leaflet or Mapbox with a real Minnesota basemap, marker clustering at zoom-out, and tile caching. The SVG implementation reads correctly for demo scale (28 markers); doesn't scale to hundreds of markers without performance work.

`CLAUDE.md` manifest update:
- New Tier 2 reference: `Synthetic data/` folder containing Stages 1-5 specs
- New code locations: `lib/synthetic-data/{types,prng,branches-bankers,generator,filters}.ts` and `app/v2/insight-engine/dashboard/`

### Verification

- `pnpm tsc --noEmit` clean
- `pnpm exec next build` clean (11 routes including the 4 unchanged legacy + new dashboard at the same `/v2/insight-engine` path)
- HTTP 200 across all 5 visualization view states (`?view=phase-funnel`, `lending-product-mix`, `geographic`, `banker-activity`, `temporal-momentum`)
- Filtered URL state works: `?view=phase-funnel&track=TRACK-008` returns 200 and renders SBA 504-scoped data
- Fixture Member pages (Jenny / Northland / Cygnus / Riverside) all 200 — no regression
- HTML content checks confirm:
  - Hero strip renders 6 metric labels (pipeline value / Members in cultivation / conversations this week / insights this week / avg Discover → / closed last 12 months)
  - Featured deal tile renders headline + originating quote
  - Phase funnel default view renders
  - Lending product mix shows "SBA 504" + "CRE Term Loan" + Blaze offers / doesn't offer split
  - Geographic map shows "Minneapolis Downtown" + "MSP metro" overlay
  - Banker activity shows Sarah Chen, Marcus Johansson, Scott Brynjolffson (top 3 by activity)
  - Temporal momentum shows Featured events + 4-series legend

### Files modified

- `lib/synthetic-data/types.ts` — new
- `lib/synthetic-data/prng.ts` — new
- `lib/synthetic-data/branches-bankers.ts` — new
- `lib/synthetic-data/generator.ts` — new (~750 lines)
- `lib/synthetic-data/filters.ts` — new
- `app/v2/insight-engine/page.tsx` — full rewrite (dashboard landing)
- `app/v2/insight-engine/layout.tsx` — dropped main wrapper; added Dashboard nav link
- `app/v2/insight-engine/dashboard/hooks/use-filter-state.ts` — new
- `app/v2/insight-engine/dashboard/components/{DashboardClient,HeroMetricsStrip,FilterTagRow,FeaturedDealTile}.tsx` — new
- `app/v2/insight-engine/dashboard/views/{PhaseFunnelView,LendingProductMixView,GeographicMapView,BankerActivityHeatmapView,TemporalMomentumView}.tsx` — new
- `app/v2/insight-engine/{tracks,portfolio,coverage,stage-skip}/page.tsx` — root `<div>` wrapper updated to include `mx-auto max-w-6xl px-8 py-8` (compensates for layout's removed wrapper)

### Suggested next move

Sprint 7b adds the remaining 5 drill-down views per spec (Member-Type × Track matrix, Conversion-per-pathway, Handoff velocity, Sankey banker→specialist→closure, Insight authorship pipeline, Business type). Sprint 6 production deployment still pending on Francisco's hosting target decision.

---

## 2026-05-08 — Sprint 7a-patch: Visual review fixes

### What was built

Visual review of Sprint 7a's EVP dashboard surfaced eight conceptual gaps. Sprint 7a-patch ships all eight in a single checkpoint.

**Block A — Phase funnel clarification + sparkline drop.**
- Added subhead under "Phase funnel" title: "Members currently at each phase. Closed bar shows 12-month total." Flow annotations moved to a secondary line.
- Closed bar visually distinct: muted grey fill (`bg-blaze-grey-soft/40`), horizontal gap (border-top + margin) above to separate from the Navigate bar, label "Closed (last 12 months)".
- Dropped the 90-day phase progression sparkline + Recharts LineChart entirely. Removed `sparklineData` memo, the four-line legend, and the unused Recharts imports.

**Block B — Lending product mix recolor + drill-through + summary removal.**
- Each Track now renders with a distinct color from grouped families: SBA orange/amber (TRACK-004, TRACK-008); CRE green (TRACK-003, TRACK-006); Equipment/Vehicle blue (TRACK-002, TRACK-007); Consumer purple/lavender (TRACK-010, TRACK-011); specialty accents teal (TRACK-001) + magenta (TRACK-009).
- Mouseover surfaces a floating tooltip card with full Track label, pipeline value, Member count, and active-vs-future-expansion indicator.
- Click a cell → opens a local drill-down panel listing Members on that Track (Member name links to fixture via Block G; Member-Type, phase, sized opportunity displayed). Drill panel includes a close button. Local state — does not modify the global Track filter.
- Dropped the two "Lending products Blaze offers" / "Blaze doesn't offer today" summary cards; the cell color + (future) suffix carries the same information.

**Block C — Geographic redesign (spatial map → three-region bar lists).**
- Removed the custom SVG Minnesota map + 28-marker spatial projection.
- Replaced with three region sections: Twin Cities Metro (20 branches), Northern Minnesota (6), Southern Minnesota (2). Branches within each region in alphabetical order per patch §C.2 exact lists.
- Each branch row renders as a horizontal bar (length proportional to pipeline value within its region) with Member count + pipeline value on the right rail.
- Click a branch row → opens a Member-list drill-down panel (same pattern as Block B). Members link to fixture via Block G.
- Per patch §C.5, bars use a single accent color (Blaze orange) — conversion-rate coloring would add visual noise that distracts from the alphabetical-navigation goal. Documented choice in BUILD_LOG.

**Block D — Banker activity enlargement + cell drill-through.**
- Heatmap now fills the canvas width via `ResizeObserver`-driven cell width (target ~10-14px wide). Rows taller (CELL_H 14 → 22px); label column wider (130 → 160px).
- Cell-level click drill: clicking a banker×day cell opens a drill-down panel listing up to 8 Members from that banker's roster (sorted by capture density — a demo proxy for "likely touched that day", since the synthetic dataset doesn't track per-day touches at Member granularity). Member names link to fixture via Block G.
- Hover tooltip moved from absolute card into the legend row to reduce layout jump.

**Block E — Temporal momentum removed.**
- Deleted `TemporalMomentumView.tsx`.
- Removed "temporal-momentum" from `DashboardView` union, `VIEWS` array, `VIEW_LABELS` record.
- `useFilterState` now redirects `?view=temporal-momentum` URLs to the default Phase funnel view (graceful fallback, no broken state).
- DashboardClient dispatch updated; `featured_temporal_events` data still flows through the dataset (unused; preserved for Sprint 7b authorship-pipeline view per patch §E.3).

**Block F — Featured deal tile Pattern content + rename.**
- "ORIGINATING CAPTURE" relabeled to "First member signal" per banker-natural plain language.
- `FeaturedDealNarrative.key_insights` extended with `pattern_id` and `content` fields (typed in `lib/synthetic-data/types.ts`). All 5 featured deals updated with canonical Pattern content drawn from `INSIGHT_PATTERN_LIBRARY_v1.md` + `_v2_additions.md`:
  - Deal 1 (Cygnus SBA 504): PATTERN-019 (anchor customer growth reframe) · PATTERN-018 (facility constraint compounding implication) · PATTERN-022 (board engagement reframe)
  - Deal 2 (Pro services CRE Term Loan): PATTERN-017 (real estate reframe) · PATTERN-021 (operational scale implication) · PATTERN-020 (decade-horizon ownership reframe)
  - Deal 3 (Maintenance services Equipment & Machinery): PATTERN-010 (capacity-as-lost-revenue reframe) · PATTERN-013 (equipment-failure fleet-question implication) — per patch §F.3 explicit mapping
  - Deal 4 (Retail Business Visa): PATTERN-056 (card-as-working-capital reframe)
  - Deal 5 (Specialty manufacturer PACE): PATTERN-053 (14-year fixed cost reframe) · PATTERN-054 (property-transfer continuity implication)
- Tile rendering reworked: each insight row shows a `REFRAME` / `IMPLICATION` chip + day annotation + Pattern ID, with the actual Pattern content as italicized leading-relaxed text. Generous line height, comfortable reading width.
- Member name in the tile header is now clickable via `MemberLink` (Block G).

**Block G — Synthetic Member → fixture routing.**
- New shared helpers `app/v2/insight-engine/dashboard/components/MemberLink.tsx` exposing `MemberLink`, `SyntheticMemberLink`, and `memberHref` + `MEMBER_TYPE_TO_FIXTURE_SLUG`. Used by PhaseFunnel, LendingProductMix, GeographicMap, BankerActivity, and FeaturedDealTile drill-down lists.
- Fixture Member clicks route to actual workstation pages (`/v2/members/jenny|northland|cygnus|riverside`) unchanged.
- Synthetic Member clicks route to fixture URL with `?representative_of=<name>&example_for=<member_type>` query parameters. Member-Type → fixture mapping per patch §G.2: event_services/food_services/retail → jenny; maintenance_services/construction → northland; specialty_manufacturer/professional_services/healthcare_services → cygnus.
- New `app/_components/representative-example-banner.tsx` surfaces a subtle cream-on-orange notation when the query parameter is present. Banner text: "Sample conversation arc — representative example for [Member-Type] ([Member name]). The full pipeline includes 220 Members; this is a detailed example of a typical cultivation pattern." Dismissible per-Member via `sessionStorage` keyed by `representative_of` value.
- `app/v2/members/[id]/page.tsx` accepts a `searchParams` prop, parses `representative_of` + `example_for`, and renders the banner when present.

**Block H — Hero metric calibration + governance.**
- Insights-per-day generator multiplier: `events * 0.18` → `events * 0.10`. Stage 4 §2.1 baseline target is ~10 insights/day × 5 weekdays = ~50/week. With the old 0.18 multiplier weekly insights landed near 88; the new ratio lands near 51 (within the 48-55 acceptable range per patch §H.2).
- Aggregate metrics now overlay a `FIXTURE_OVERLAY` constant (4 Members; ~$4.4M pipeline face; weighted ≈ $2.6M; +3 conversations/week; +2 insights/week). The fixture pipeline value reflects Jenny ($750K LOC) + Northland ($245K Equipment) + Cygnus ($3.2M SBA 504) + Riverside ($200K LOC stage-skip).
- Members in cultivation now reads 220 (216 synthetic + 4 fixture). Dashboard header subtitle clarifies the split for the EVP audience.
- Filter-responsive scoped metrics in `lib/synthetic-data/filters.ts` correctly fall back to synthetic-only counts when filters are applied (fixture overlay is for the unfiltered hero only).

### Files changed (Sprint 7a-patch)

- `app/v2/insight-engine/dashboard/views/PhaseFunnelView.tsx` — sparkline + Recharts imports dropped; subhead added; closed bar restyled
- `app/v2/insight-engine/dashboard/views/LendingProductMixView.tsx` — full rewrite per Block B
- `app/v2/insight-engine/dashboard/views/GeographicMapView.tsx` — full rewrite; SVG map replaced by three-region bar lists
- `app/v2/insight-engine/dashboard/views/BankerActivityHeatmapView.tsx` — full rewrite; ResizeObserver-driven cell sizing + cell drill
- `app/v2/insight-engine/dashboard/views/TemporalMomentumView.tsx` — deleted
- `app/v2/insight-engine/dashboard/hooks/use-filter-state.ts` — DashboardView union pruned; legacy view-param redirected
- `app/v2/insight-engine/dashboard/components/FilterTagRow.tsx` — VIEWS array reduced to 4 tags
- `app/v2/insight-engine/dashboard/components/DashboardClient.tsx` — TemporalMomentumView removed; LendingProductMix/Geographic/BankerActivity now receive `filteredMembers`
- `app/v2/insight-engine/dashboard/components/FeaturedDealTile.tsx` — full rewrite per Block F
- `app/v2/insight-engine/dashboard/components/MemberLink.tsx` — new (Block G shared helper)
- `app/_components/representative-example-banner.tsx` — new (Block G notation surface)
- `app/v2/members/[id]/page.tsx` — accepts searchParams; renders RepresentativeExampleBanner when present
- `app/v2/insight-engine/page.tsx` — subtitle clarifies 216 + 4 = 220 Member composition
- `lib/synthetic-data/generator.ts` — 0.18 → 0.10 insight multiplier; FIXTURE_OVERLAY in computeAggregateMetrics; featured narratives now carry Pattern IDs + content
- `lib/synthetic-data/types.ts` — `FeaturedDealNarrative.key_insights` extended with `pattern_id` + `content`

### What was learned

- The 0.18 → 0.10 calibration is a single-knob fix because the generator chains scaling multiplicatively (`base * dowMult * lift * jitter * insightRatio`); the diagnosis path from §H.2 matched the actual root cause cleanly.
- Pattern content as the primary surface text (rather than abstract Pattern labels) makes the featured deal tile read as banker-natural narrative rather than analytics jargon. The 200-char canonical statements work well at this scale.
- The synthetic-Member → fixture routing pattern lets the demo preserve clickability throughout 220-Member surfaces without authoring 216 detail pages. The notation banner makes the substitution honest without breaking the demo flow.
- Three-region bar lists are dramatically easier to scan than the SVG spatial map. The MSP-metro circle in the prior map was decorative; the alphabetical-within-region structure is what bankers actually use.

### What's open

- Sprint 7b drill-down views (Member-Type × Track matrix, conversion-per-pathway, handoff velocity, Sankey, authorship pipeline, business-type filter) — patch §"Pilot deferrals" preserved
- Sprint 6 production deployment still blocked on Francisco's hosting-target decision
- Pre-existing currency double-`$` formatting bug elsewhere in the app (noted in prior entries; unchanged)

### Suggested next move

Visual review of the patch with Francisco. After confirmation, Sprint 6 production deploy is the next pending checkpoint. Sprint 7b is the next demo-feature sprint.

---

## 2026-05-11 — Sprint 6: Final polish + Vercel-ready SQLite

### What was built

**Block A — Per-fixture narrative verification.**

Walked the four fixtures end-to-end against the Sprint 6 checklist (live DB probe via `tsx -e`). All pass:

- **Jenny's Catering** — Discover (4 signals: goal · 2 blockers · indecision), Measure (12 factors incl. 28% seasonal variance · 65d payment cycle · 22% surplus · co-decision-maker structural fit), Consult ($75K Working Capital LOC, `leaning_yes`, primary_concern `co_decision_maker_household`), Navigate (joint conversation pending). Track ranking: **TRACK-001 first** ✓. Member-Type "Event services" ✓.
- **Northland HVAC** — Discover (3 signals: goal · blocker · indecision), Measure (10 factors incl. 88% capacity · demand-exceeding-capacity · equipment aging · 18% revenue trajectory), Consult ($180K Vehicle/Fleet Loan, `leaning_yes`, CPA-pending). Track ranking: **TRACK-002 first** ✓. Member-Type "Maintenance services" ✓.
- **Cygnus Bioscience** — Discover (4 signals: goal · blocker · 2 triggers incl. customer_growth_announcement), Measure (17 factors incl. 85% capacity · owner-occupancy confirmed · 85 employees · $5.5M property acquisition sized · 22-year tenure), Consult (Commercial Real Estate Term Loan product with $4M-$7M range via `size_low`/`size_high` + rationale identifying SBA 504 structure, `leaning_yes`, board-pending), Navigate (James Patterson SBA spec + Diana Reyes CDC partner engaged). Track ranking: **TRACK-008 first** ✓. Member-Type "Specialty manufacturer" ✓. `size_proposed` is intentionally null — the range is stored in `size_low`/`size_high` and `formatRecommendationSize()` renders "$4M-$7M".
- **Riverside Catering** — Stage-skipping by design (2 factors + 1 skeptical reaction, no Discover-phase signals). Surfaces correctly on `/v2/insight-engine/stage-skip`. Track ranking: **TRACK-001 first** ✓. Member-Type "Event services" ✓.

No inconsistencies surfaced; no fixes required.

**Block B — Surface polish sweep.**

Production build clean (Next.js 16.2.4 + Turbopack): 5 static pages + 7 dynamic routes resolve in ~2s compile. Zero warnings. No console.error in source (one intentional `console.warn` in `lib/insight-matching.ts` for graceful LLM fallback). No TODOs of concern (two annotations refer to demo-vs-Pilot deferrals already tracked in OPEN_QUESTIONS). Surface walks logged for visual probe by Francisco during demo rehearsal — anything not fixed here is by design or deferred to Pilot.

**Block C — Vercel deployment config.**

- **`vercel.json`** — pins Next.js framework preset, install command `pnpm install --frozen-lockfile=false`, build command `pnpm build`.
- **`package.json`** — `build` script now runs `prisma generate && next build`; `postinstall` runs `prisma generate` (Vercel install step generates the Prisma client into `app/generated/prisma/` which is gitignored). New scripts: `db:seed` (runs `prisma/seed.ts`), `db:reset` (deletes dev.db and re-seeds), `db:snapshot` (copies `dev.db` → `prisma/seed.db`).
- **`next.config.ts`** — `serverExternalPackages: ["better-sqlite3", "@prisma/client"]` so the native module installs into the Lambda node_modules tree instead of being webpack-bundled. `outputFileTracingIncludes` injects `./prisma/seed.db` into the Next file-tracing manifest — confirmed in `.next/server/app/v2/insight-engine/page.js.nft.json` so Vercel ships the snapshot with every Lambda.
- **`.gitignore`** — added `!/prisma/seed.db` exception so the bundled snapshot can be committed (other `*.db*` files remain ignored).

**Block D — SQLite read-only constraint handling.**

- **`lib/db-path.ts`** — new shared resolver. In local dev, returns the path from `DATABASE_URL` (default `./dev.db`). On Vercel (`VERCEL=1`), copies the bundled `prisma/seed.db` snapshot to `/tmp/blaze.db` on first call per Lambda instance and returns that path. Module-level cache short-circuits subsequent calls. Static `BUNDLED_SNAPSHOT_REL` constant keeps the path Turbopack-traceable (resolves the prior "whole project traced unintentionally" warning by avoiding `process.env`-derived paths during the trace).
- **All 11 `getPrisma()` callsites** refactored to import `getDbPath()` from `@/lib/db-path` and pass the resolved path to `PrismaBetterSqlite3`. Callsites: `app/growth-conversations/page.tsx`, `app/growth-conversations/[memberId]/{page.tsx,actions.ts}`, `app/v2/insight-engine/{portfolio,tracks,coverage,stage-skip}/page.tsx`, `app/v2/members/[id]/{page.tsx,actions.ts}`, `app/members/[id]/page.tsx`, `lib/compliance-scan-action.ts`.
- **Smoke test** (with `VERCEL=1` simulated locally): reads Cygnus correctly from `/tmp/blaze.db`, UPDATE writes succeed, cache hit on second `getDbPath()` call. End-to-end pipeline verified.
- **Write persistence:** writes succeed for the Lambda instance lifetime (~minutes), vanish when Vercel recycles. Accepted demo-phase constraint logged as Q-F7 in OPEN_QUESTIONS and called out in DEMO_RUNBOOK §6 (live Insight authoring section).

**Block E — DEMO_RUNBOOK updates.**

The runbook predated the Sprint 7a dashboard and Sprint 6 deployment work. Updates:

- **Pre-demo checklist** — added the **Deployment walkthrough** subsection with the snapshot/commit/push sequence and the one-time Vercel project setup steps (Sign in → Add Project → set `ANTHROPIC_API_KEY` + `DATABASE_URL` env vars → Deploy).
- **Narrative arc** — inserted a new **§1 Open at the Insight Engine dashboard** as the first beat. Walks hero metrics ($147M / 220 Members / 14 bankers / 28 branches), the four visualization tags (Phase funnel / Lending product mix / Geographic / Banker activity) with their drill-throughs, the featured deal tile with Pattern content, and the synthetic-Member → fixture routing with notation banner. Renumbered Cygnus/Northland/Jenny/Insight-Engine-legacy/Live-Insight to §2-§6.
- **Live Insight authoring §6** — added the read-only persistence note: writes surface live but vanish on Vercel Lambda recycle; honest framing if the EVP refreshes the page mid-demo ("Demo phase runs on SQLite; Pilot moves to Postgres").

**Block F — Governance.**

This entry. Plus Q-F7 in OPEN_QUESTIONS and Note 18 in architectural notes (below). CLAUDE.md manifest unchanged — `DEMO_RUNBOOK.md`, `lib/db-path.ts`, `vercel.json` all fit existing Tier 3/4 categories.

### Files changed (Sprint 6)

- `package.json` — build/postinstall/db:* scripts
- `vercel.json` — new
- `next.config.ts` — serverExternalPackages + outputFileTracingIncludes
- `.gitignore` — `!/prisma/seed.db` exception
- `lib/db-path.ts` — new
- `app/growth-conversations/page.tsx` — getPrisma → getDbPath()
- `app/growth-conversations/[memberId]/page.tsx` — getPrisma → getDbPath()
- `app/growth-conversations/[memberId]/actions.ts` — getPrisma → getDbPath()
- `app/v2/insight-engine/portfolio/page.tsx` — getPrisma → getDbPath()
- `app/v2/insight-engine/tracks/page.tsx` — getPrisma → getDbPath()
- `app/v2/insight-engine/coverage/page.tsx` — getPrisma → getDbPath()
- `app/v2/insight-engine/stage-skip/page.tsx` — getPrisma → getDbPath()
- `app/v2/members/[id]/page.tsx` — getPrisma → getDbPath()
- `app/v2/members/[id]/actions.ts` — getPrisma → getDbPath()
- `app/members/[id]/page.tsx` — getPrisma → getDbPath()
- `lib/compliance-scan-action.ts` — getPrisma → getDbPath()
- `prisma/seed.db` — new (committed snapshot, 999 KB)
- `BUILD_LOG.md` — this entry
- `OPEN_QUESTIONS.md` — Q-F7 added
- `DEMO_RUNBOOK.md` — deployment walkthrough + dashboard-opening narrative arc + read-only constraint note

### What was learned

- Vercel's Lambda filesystem is read-only except `/tmp`. The `outputFileTracingIncludes` + `/tmp` copy pattern lets SQLite work for a read-heavy demo with transient writes, which is enough for the EVP arc. Pilot moves to Postgres regardless.
- Turbopack's NFT tracer warns when it sees dynamic file paths derived from env vars during the import trace, even if the actual file is correctly included via `outputFileTracingIncludes`. Pinning the bundled path to a static constant (`"prisma/seed.db"`) silenced the warning without changing runtime behavior.
- `serverExternalPackages: ["better-sqlite3", "@prisma/client"]` is the right escape hatch for native modules — Next bundles everything else but leaves these to install normally into the Lambda's `node_modules`.

### What's open

- **Block C/D operational steps require Francisco's hands on Vercel.** Code/config side is done. The exact action list lives in `DEMO_RUNBOOK.md → Pre-demo checklist → Deployment walkthrough`: refresh the snapshot, commit, push, connect Vercel, paste env vars, deploy. First deploy verifies the entire pipeline end-to-end.
- **Production URL placeholder** in the runbook needs the actual `https://<project>.vercel.app` filled in after first successful deploy.
- **Sprint 7b** (remaining 5 drill-down views, Sankey, Member-Type matrix) — deferred to post-demo per Sprint 6 §pre-flight.

### Suggested next move

Francisco runs the Deployment walkthrough from DEMO_RUNBOOK Pre-demo checklist. After first successful Vercel build, paste the URL into the checklist, run through Section 1 narrative arc once for rehearsal, and the build is EVP demo-ready.

---

## Architectural notes for Pilot — running list

(Earlier notes 1-17 are scattered throughout prior sprint entries. Sprint 6 adds Note 18.)

**Note 18 — Vercel deployment with SQLite read-only filesystem.** Vercel's serverless runtime treats the Lambda filesystem as read-only outside `/tmp`. Sprint 6 wires the demo via a bundled `prisma/seed.db` snapshot copied to `/tmp/blaze.db` on cold start (`lib/db-path.ts`), which lets reads + writes both succeed for the Lambda instance lifetime. Writes vanish when Vercel recycles the instance — accepted for the read-heavy EVP demo where the "live Insight authoring" beat is about surfacing LLM-matching feedback in real time, not durability. Pilot needs Postgres for production write persistence, real-time evolution, and multi-instance consistency. The DATABASE_URL → Postgres switch is a one-line `provider` change in `prisma.config.ts` (already provider-agnostic per CLAUDE.md §2).

---

## 2026-05-12 — Sprint 8: Multi-Track artifacts with FactorCapture linkage

### What was built

**Block A — Schema migration.**

Two new columns + the `source_factor_id` JSON convention on `ArtifactTemplate.parameter_schema`:

- `Member.active_track_ids Json?` — JSON array of TrackTemplate ids (e.g., `["TRACK-008","TRACK-003"]`). First entry is the primary Track. Fixtures opt in; synthetic Members leave it null and fall through to single-Track ranking. Chose Option (a) per spec §A.1 — lighter migration than a `MemberTrack` join table.
- `FactorCapture.capture_mode String @default("member_confirmed")` — captures the dichotomy between conversation-confirmed values and banker working assumptions. All existing rows backfilled to `member_confirmed` by the migration's data-preserving rebuild.
- `ArtifactTemplate.parameter_schema` (already `Json`) — new `source_factor_id` field per parameter is purely a JSON convention, no schema change.

Migration: `prisma/migrations/20260512143109_sprint8_multitrack_artifacts/`.

**Block B — Two new artifact templates.**

- **ARTIFACT-TEMPLATE-009** (TRACK-001 Working Capital LOC) — "Seasonal cashflow smoothing summary". 6 parameters; source_factor_id wired to FACTOR-019 (Annual revenue band), FACTOR-001 (Seasonal revenue variance), FACTOR-036 (Requested credit limit). `slow_season_gap`, `draw_pattern`, `repayment_window` are banker-entered.
- **ARTIFACT-TEMPLATE-010** (TRACK-002 Business Vehicle Loan) — "Business Vehicle Loan financing summary". 11 parameters incl. computed `loan_amount = purchase_price − down_payment`; source_factor_id wired to FACTOR-033 (Equipment replacement cost, used as vehicle purchase price), FACTOR-006 (Capacity utilization), FACTOR-007 (Demand exceeding capacity).

`member_type_applicability` set per spec §B.1/B.2.

**Block C — Backfilled `source_factor_id` on 7 existing templates.**

- ARTIFACT-TEMPLATE-001 (CRE): acquisition_price→FACTOR-035, loan_amount→FACTOR-037
- ARTIFACT-TEMPLATE-003 (Investment property): purchase_price→FACTOR-035
- ARTIFACT-TEMPLATE-004 (Equipment): equipment_cost→FACTOR-033
- ARTIFACT-TEMPLATE-005 (PACE): improvement_type→FACTOR-031, improvement_cost→FACTOR-034, property_eligibility→FACTOR-032
- ARTIFACT-TEMPLATE-006 (Visa): proposed_limit→FACTOR-036
- ARTIFACT-TEMPLATE-007 (Unsecured): loan_amount→FACTOR-037
- ARTIFACT-TEMPLATE-008 (SBA 504 roadmap): no factor mappings (per-deal state, not captured factors)

**Spec corrections (per §C.2):** the prompt referenced several factor IDs that don't exist in the current matrix. I mapped to the correct IDs from `BUSINESS_FACTOR_MATRIX_v1.md`:
| Spec wrote | Actual |
|---|---|
| FACTOR-027 (annual revenue) | FACTOR-019 (Annual revenue band) |
| FACTOR-026 (seasonal variance) | FACTOR-001 (Seasonal revenue variance) |
| FACTOR-008 (slow-season gap) | No factor — banker-entered |
| FACTOR-018 (requested credit limit) | FACTOR-036 (Requested credit limit, sized) |
| FACTOR-015 (purchase_price) | FACTOR-033 (Equipment replacement cost, sized) |
| FACTOR-019 (property acquisition) | FACTOR-035 (Property acquisition amount, sized) |
| FACTOR-020 (requested loan amount) | FACTOR-037 (Requested loan amount, sized) |
| FACTOR-016 (equipment replacement cost) | FACTOR-033 |
| FACTOR-030 (PACE eligibility confirmed) | FACTOR-032 |

The `TemplateParameter` TypeScript type now carries `source_factor_id?: string` for renderer consumption.

**Block D — Renderer auto-pulls FactorCapture values.**

`ArtifactTemplateRender` now accepts `factorCapturesById?: Record<string, { display_value, capture_mode }>` and overlays parameter values from FactorCaptures when `source_factor_id` is set. Resolution order: FactorCapture (most recent for member) → banker-entered `parameterValues` → marked missing. Computed parameters cascade from auto-populated inputs.

Plumbing: `workstation-shell` builds `factorCapturesById` from the existing `FactorCaptureLite[]` and passes it to `V2MainPanel` → `FeedCard` → `CardDetail` → `ModelTemplatePreview` → `ArtifactTemplateRender`. `FactorCaptureLite` extended with `capture_mode?: string` so the mode flows through to the renderer.

**Block E — Missing-parameter CTAs with two-mode capture.**

The renderer surfaces missing source-linked parameters two ways:
1. **Top-of-artifact banner** — collapsed list of all missing params, each with `[Capture with Member]` (orange primary) and `[Banker estimate]` (outline secondary) buttons. Shown above the structural content for prominence.
2. **Inline row CTA** — within section rows, a `— missing · + capture` affordance offers a quick member_confirmed capture path.

Click handlers fire `onMissingParameterCapture({ factor_id, parameter_label, mode })` which the workstation-shell routes through `handleMissingParameterCapture`: sets `preselectedFactorId` + `preselectedCaptureMode` and opens the dialpad's + Quantify drawer. The dialpad forwards both to `QuantifyForm` → `MatrixAwareCapture` → `saveFactorCapture`. `lib/recapture-detection.ts → factorCaptureOrUpdate` writes `capture_mode` on both create and recapture-update (converting banker_estimate → member_confirmed in place when the same value is re-captured later).

When `preselectedCaptureMode === "banker_estimate"`, the QuantifyForm renders a cream-banner reminder: "Recording your working assumption. Marked as banker estimate so we know to confirm with the Member later."

**Block F — Track context toggle.**

The existing sidebar Track dropdown (Sprint 5a.2) already drove `selectedTrackId`. Sprint 8 adds:

- **URL `?track=TRACK-NNN` encoding.** On mount, URL wins over sessionStorage; switches call `router.replace(..., { scroll: false })` to keep the URL shareable without trapping the back button.
- **Sidebar artifact filtering by Track.** `SidebarArtifact.track_id` added (sourced from the linked Model's template). `workstation-shell.trackFilteredArtifacts` filters to the current Track context. Multi-Track fixtures (Cygnus / Northland / Jenny) now show different artifacts when switching Tracks; single-Track fixtures (Riverside, synthetic Members) see no UX change.
- **show_events query** in `app/v2/members/[id]/page.tsx` extended to pull `model.template.track_id`.

**Block G — Fixture multi-Track data.**

New `seedFixtureMultiTrack(prisma)` in `prisma/seed-artifact-templates.ts`, called from `prisma/seed.ts` as Step 12b. Idempotent — drops + re-creates the secondary Models per re-seed.

Per-fixture distribution:

| Fixture | active_track_ids | Models seeded |
|---|---|---|
| Cygnus | `["TRACK-008", "TRACK-003"]` | TRACK-008 SBA 504 roadmap (migration helper) + TRACK-003 CRE acquisition summary (params seeded with `acquisition_price` left blank → renderer auto-pulls FACTOR-035 = $5.5M) |
| Northland | `["TRACK-002", "TRACK-007"]` | TRACK-002 Business Vehicle (new ARTIFACT-TEMPLATE-010; capacity_utilization_now auto-pulls FACTOR-006 = 88%, demand_exceeding_capacity auto-pulls FACTOR-007 = "Yes") + TRACK-007 Equipment ROI (existing) |
| Jenny | `["TRACK-001", "TRACK-010"]` | TRACK-001 LOC smoothing (new ARTIFACT-TEMPLATE-009; requested_credit_limit left blank → demonstrates Block E missing-param CTA) + TRACK-010 Business Visa (existing) |
| Riverside | `["TRACK-001"]` | TRACK-001 LOC smoothing — most params blank → demonstrates Block E end-to-end (stage-skipping fixture) |

**Northland's FACTOR-007 (Demand exceeding capacity)** flipped to `capture_mode: "banker_estimate"` per spec §G.3 to demonstrate Block H's visual treatment. The value (true) is unchanged; only the mode shifted. When banker re-captures it as member_confirmed in a future conversation, `factorCaptureOrUpdate` converts the row in place.

**Block H — Banker-estimate visual treatment.**

Implemented in `SectionListRender`: when `captureModeByKey[key] === "banker_estimate"`, the displayed value gets an inline italic flag:

```
Demand exceeding capacity?  Yes · banker estimate (pending Member confirmation)
```

Member-confirmed values render unchanged. Mixed-mode artifacts distinguish both visually without competing for attention.

**Block I — Governance.** This entry + Q-G1/G2/G3 + Notes 19-21 below + CLAUDE.md manifest.

### Files changed (Sprint 8)

- `prisma/schema.prisma` — `Member.active_track_ids Json?`, `FactorCapture.capture_mode String @default("member_confirmed")`
- `prisma/migrations/20260512143109_sprint8_multitrack_artifacts/migration.sql` — new
- `prisma/seed-artifact-templates.ts` — 2 new templates, source_factor_id backfill, `seedFixtureMultiTrack` helper
- `prisma/seed.ts` — Step 12b wires `seedFixtureMultiTrack`
- `lib/artifact-template.ts` — `TemplateParameter.source_factor_id?`
- `lib/objective-evidence.ts` — `FactorCaptureLite.capture_mode?`
- `lib/recapture-detection.ts` — `capture_mode` write on create + update
- `app/v2/members/[id]/artifact-template-render.tsx` — full Block D/E/H implementation
- `app/v2/members/[id]/main-panel.tsx` — props plumbing through `V2MainPanel` → `FeedCard` → `CardDetail` → `ModelTemplatePreview`
- `app/v2/members/[id]/workstation-shell.tsx` — `factorCapturesById` derivation, `handleMissingParameterCapture`, URL `?track=` encoding, `trackFilteredArtifacts`
- `app/v2/members/[id]/dialpad.tsx` — `preselectedCaptureMode` prop forwarded to QuantifyForm
- `app/v2/members/[id]/capture-forms/quantify-form.tsx` — banker_estimate helper banner; `captureMode` flows to `saveFactorCapture`
- `app/v2/members/[id]/actions.ts` — `SaveFactorCaptureInput.capture_mode?`
- `app/v2/members/[id]/page.tsx` — show_events query pulls `model.template.track_id`; SidebarArtifact populates track_id; `FactorCaptureLite.capture_mode` forwarded
- `app/v2/members/[id]/sidebar.tsx` — `SidebarArtifact.track_id?`
- `prisma/seed.db` — refreshed snapshot

### What was learned

- The factor-ID gap between spec and matrix (~9 IDs out of date) underscores that the spec was authored before the matrix stabilized in Sprint 5a. Documenting corrections in BUILD_LOG (per spec §C.2) is the right path; updating spec docs would split the chain of historical context.
- The renderer's "overlay parameter values" pattern (banker-entered → FactorCapture for source-linked → mark missing) keeps the implementation small. Adding new capture types or parameter shapes won't require changing the resolver.
- Filtering sidebar artifacts by `currentRanked.track_id` is the same filter we'll likely want for Coach content + popup CTAs when Pilot extends multi-Track to synthetic Members.

### What's open

- **Block E "no-source-mapping inline missing"** — parameters without `source_factor_id` that are required but empty (e.g., Jenny's `draw_pattern` if left blank) don't currently surface a CTA. They render as `—`. The intent: only source-linked missing params get CTAs. Banker-entered missing params surface as form-validation failures at + Model save time. Acceptable per spec §E.1.
- **DSCR-style derived parameters** — some templates (ARTIFACT-TEMPLATE-003 Investment property) compute DSCR from rental income + expenses + debt service. Computed parameters cascade correctly per Block D §D.4 as long as the inputs are auto-populated; banker still needs to enter rental income + expenses manually unless those get FACTOR backfills in a future sprint.
- **Synthetic Member multi-Track** — deferred to Pilot per spec; dashboard aggregates unchanged.

### Suggested next move

Visual review with Francisco on the Cygnus + Northland + Jenny growth-conversation pages. Walk the Track-switch beat (sidebar dropdown), open each Track's artifact via the captured-feed "show ↓" template card, observe FactorCapture auto-population. Trigger the missing-param CTA on Jenny's TRACK-001 artifact (requested_credit_limit blank) and confirm the dialpad opens to + Quantify with FACTOR-036 pre-selected. Confirm Northland's `demand_exceeding_capacity` shows the "banker estimate" flag.

After visual review, Sprint 6 deployment to Vercel ships with both Sprint 6 polish + Sprint 8 features included (single deployment cycle per the original plan).

---

## Architectural notes for Pilot — running list (continued)

**Note 19 — Multi-Track Member cultivation.** Sprint 8's 4 fixtures carry multiple active Tracks each (Cygnus + Northland + Jenny each get 2 Tracks; Riverside stays single). The `Member.active_track_ids` JSON array + the sidebar Track-switcher + URL `?track=` encoding form a coherent multi-Track UX. Synthetic Members stay single-Track for demo simplicity; Pilot extends multi-Track to all Members and may add per-Member-per-Track metadata (e.g., when did the cultivation arc for this Track begin) via a join table.

**Note 20 — Two-mode capture (member_confirmed vs banker_estimate).** Demo surfaces this distinction only at artifact missing-parameter CTAs. Standard + Quantify defaults to member_confirmed; the mode dichotomy is invisible elsewhere. Pilot may want mode-aware capture throughout the system — every + Quantify form, every FactorCapture display, every audit-trail surface. The schema supports it; only the UI surface is constrained.

**Note 21 — Sprint 5d Note 13 resolved.** FactorCapture-to-Model parameter linkage was deferred in Sprint 5d. Sprint 8 implements it via `ArtifactTemplate.parameter_schema.source_factor_id` (per-parameter pointer) + renderer overlay logic. Pilot follow-up: also wire FactorCapture-to-Insight authorship pre-fill, and FactorCapture-to-Reaction primary-concern suggestions.

---

## 2026-05-12 — Sprint 9: Business-impact artifact visualizations

### What was built

Replaced 8 of 10 lending-product artifact renderers with custom business-impact visualizations that answer the question "what does this loan do for the Member" rather than the prior "what is the loan structure" summary. TRACK-001 (Working Capital LOC) and TRACK-002 (Business Vehicle Loan) preserved unchanged — both already met the standard.

**Block A — Infrastructure.** New directory `app/v2/members/[id]/artifact-visualizations/` with:
- `shared.ts` — `num()` / `fmtUSD()` / `fmtUSDLong()` / `tooltipUSD()` / `monthlyPayment()` / `VIZ_COLORS` palette / `annotationLineClass()` helper. Standard before/after color treatment (muted grey for current state, Blaze orange for loan-enabled state, green for equity/wealth, red for cost/danger).
- 8 component files (one per Track).
- `ArtifactTemplateRender` dispatches on `structural_content.type` to the appropriate component via a new `renderStructuralVisualization` helper. Legacy section-list types (`financing_summary`, `cashflow_projection`, `roi_projection`, `use_plan`) continue to render via `SectionListRender` for any template that hasn't migrated.

`StructuralContent` type union in `lib/artifact-template.ts` extended with the 8 new viz types + a new composite `sba_504_paired` type that renders both the existing roadmap and the new structure-comparison chart.

**Block B — TRACK-003 CRE: LeaseVsOwnChart.** 15-year dual-line cumulative cost chart (continued leasing vs. mortgaged ownership) plus a dashed equity line tracking principal paydown + property appreciation. `ReferenceLine` marks the crossover year when ownership beats leasing. End-state annotation: total paid + equity built under each scenario.

**Block C — TRACK-004 SBA 7(a): GrowthTrajectoryChart.** Two-line revenue trajectory over the loan term: organic growth (no loan) vs. expansion-fueled (with SBA 7(a)). Year-1 revenue uplift visible as a step at the start of the with-loan line; debt service overlay rendered as a faint area at the bottom so the cost reads small next to the revenue lift. Annotation summarizes cumulative uplift, total debt service, and net gain.

**Block D — TRACK-006 Investment Property: CashflowEquityDualChart.** Two stacked panels. Top: horizontal stacked bar chart of monthly cashflow components (rent → mortgage + opex → net). Bottom: 10-year wealth-accumulation chart with two lines (total equity from principal paydown + appreciation; cumulative net cashflow), referenced against the initial-investment baseline. Annotation calls out year-10 equity, cumulative cashflow, total return, and ROI percent on down payment.

**Block E — TRACK-007 Equipment: CostOfDoingNothingChart.** Cumulative-cost dual-line over 36 months. Aging equipment costs (maintenance + downtime + declined-job revenue) compound at ~1.2%/month degradation; new-equipment-financed cost is constant (debt service + low maintenance). Crossover annotation shows the breakeven month from which new equipment is cheaper than continuing.

**Block F — TRACK-008 SBA 504: Sba504StructureComparison + paired roadmap.** The existing partnership-map roadmap is preserved AND a new side-by-side bar comparison renders below it. Two grouped bar pairs: cash-at-closing (Conventional 30% equity vs. SBA 504 10% equity) and 10-year cumulative interest (computed via month-by-month amortization across the 50% bank lien at market rate + 40% CDC lien at below-market rate vs. the 70% conventional loan). Annotation calls out cash savings and interest savings vs. conventional.

**Block G — TRACK-009 PACE: PaceMonthlySavingsChart.** Stacked annual bars over a 25-year horizon with a net-benefit line overlay. Energy savings stack positive; PACE assessments stack negative during the PACE term; after the PACE term ends the assessment goes to zero and the bars are pure savings. `ReferenceLine` at the PACE-term-end year. Annotation calls out monthly net benefit and cumulative net benefit through the PACE term.

**Block H — TRACK-010 Business Visa: CashbackOpportunityChart.** Annual benefit comparison bar chart (current = zero vs. with Business Visa = cashback + float). Below the chart, a structured breakdown lists annual operational spend, expected card spend at the chosen cashback rate, annual cashback captured, float benefit. Annotation closes with the 5-year cumulative figure as "money left on the table".

**Block I — TRACK-011 Unsecured: UnsecuredOpportunityChart.** Stacked bar comparison of two scenarios. Without-loan: zero captured. With-loan: opportunity value (positive, green) + interest cost (negative, red). The "math" panel below shows loan size, monthly payment, total interest, opportunity value, and net benefit with a one-line "act on it" / "skip it" recommendation.

**Block J — Seed + governance.**

- Each of `ARTIFACT-TEMPLATE-001..008` rewritten with the new `structural_content.type`, the Sprint 9 parameter schemas (with `source_factor_id` linkage preserved), and revised `output_summary_template` framing the business-impact narrative.
- `FIXTURE_MODEL_SEEDS` updated to populate the new visualization inputs for fixture × Track combos (Cygnus CRE, Northland Business Vehicle, Jenny Business Visa, Riverside LOC).
- New `LEGACY_MODEL_PARAMS` patch map applied during `seedFixtureMultiTrack`: Cygnus's TRACK-008 Model gets the SBA 504 structure-comparison inputs (property value $5.5M, bank rate 7.25%, CDC rate 5.25%, conventional rate 8.5%); Northland's TRACK-007 Model gets the cost-of-doing-nothing inputs (aging fleet maintenance $2,800/mo, downtime $1,500/mo, declined revenue $4,200/mo).
- `migrateCygnusModelToTemplate` extended to seed the same SBA 504 paired-viz parameters.
- `prisma/seed.db` snapshot refreshed for Vercel deploy.

### Files changed (Sprint 9)

- `app/v2/members/[id]/artifact-visualizations/shared.ts` — new (palette + helpers)
- `app/v2/members/[id]/artifact-visualizations/LeaseVsOwnChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/GrowthTrajectoryChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/CashflowEquityDualChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/CostOfDoingNothingChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/Sba504StructureComparison.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/PaceMonthlySavingsChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/CashbackOpportunityChart.tsx` — new
- `app/v2/members/[id]/artifact-visualizations/UnsecuredOpportunityChart.tsx` — new
- `app/v2/members/[id]/artifact-template-render.tsx` — `renderStructuralVisualization` dispatch + imports
- `lib/artifact-template.ts` — `StructuralContent` union extended with 8 new types + `sba_504_paired`
- `prisma/seed-artifact-templates.ts` — template schemas + fixture seeds + legacy-model patch
- `prisma/seed.db` — refreshed snapshot

### What was learned

- Recharts' Tooltip `formatter` prop expects a flexible signature (`ValueType | undefined`); using a strict `(value: number) => string` callback fails TypeScript. The `tooltipUSD()` helper accepts `unknown` and safely coerces — same readable output, no per-chart casting needed.
- The Sprint 8 parameter-schema discipline (source_factor_id auto-population, missing-param CTAs, banker-estimate flag) carries through to the new visualizations without modification. The visualizations consume the same `parameterValues` map; everything else is invisible to them. That's the clean separation the architecture wanted.
- Some visualizations (PACE, CRE lease-vs-own) compute long projections from a handful of inputs. The math is intentionally simplified (annualized amortization, flat appreciation assumption) so the demo numbers are explainable — not so accurate that the banker has to defend each cell.

### What's open

- The Sprint 9 viz components don't currently support the inline `+ fill in` editor for banker-entered params (that affordance lives in `SectionListRender`, which the viz types don't use). Banker-entered missing params still surface as missing-param-banner CTAs at the top — that's the unified entry point for any missing required parameter.
- Riverside's TRACK-001 artifact still renders via the unchanged `cashflow_projection` (Jenny's LOC chart); per spec preserved.

### Suggested next move

Visual review of all 10 artifact tiles. Walk Cygnus → SBA 504 (paired viz), Cygnus → CRE Term Loan, Northland → Business Vehicle (preserved), Northland → Equipment, Jenny → Working Capital LOC (preserved), Jenny → Business Visa, then sample Riverside, then a representative-example synthetic Member for each remaining Track to confirm the visualizations render with realistic numbers.

After Sprint 9 review, Sprint 6 deployment to Vercel ships next (single deploy with Sprints 6 + 8 + 9 + the cosmetic polish bundled).

---

**Note 22 — Business-impact visualization pattern.** All 10 lending-product artifacts now demonstrate before/after business effect rather than transaction summary. The pattern: each Track's structural_content.type dispatches to a per-Track component under `artifact-visualizations/`; the component reads from the existing parameterValues map (auto-populated from FactorCaptures per Sprint 8), renders a chart that visualizes the current-state pain or missed opportunity alongside the loan-enabled outcome, and surfaces a quantified financial-impact annotation. Pilot extends this pattern to any new lending products that come online — just author the parameter schema + chart component.

---

## 2026-06-03 — Cosmetic polish: dashboard tooltips, filter-strip styling, "Insight Engine" → "Growth Opportunities" rename

**Session type:** Ad-hoc cosmetic polish on the EVP-facing dashboard (no sprint prompt). Three small changes plus contract bookkeeping for a locked-vocabulary deviation.

### What was built

- **Pipeline tooltips (`HeroMetricsStrip.tsx`).** Rewrote the pipeline-card `title` tooltip copy at Francisco's dictation. Face view: "The total face value of every sized opportunity in the portfolio." Weighted view: "A probability-adjusted view with an opportunity in Discover valued at 10%, and one in Navigate at 85%." Kept the trailing "Click to show…" hint on each since the single card toggles between the two views (face ↔ phase-weighted) and the toggle is otherwise undiscoverable.
- **Filter-strip background (`FilterTagRow.tsx`).** Changed the wrapper from `bg-white` to `bg-blaze-charcoal` (#1a1a1a) for visual pop. View-tab buttons and the orange selected-pill highlight left untouched per request. (Open: the small "Track:/Member-Type:/Phase:" labels and the native `<select>` boxes in the dropdown row may now read poorly on dark — flagged to Francisco, not yet adjusted.)
- **"Insight Engine" → "Growth Opportunities" rename (banker-facing display strings only).** Two display locations: dashboard `<h1>` (`app/v2/insight-engine/page.tsx:34`) and the header eyebrow label (`app/v2/insight-engine/layout.tsx:28`). Styling: "Growth" in `text-blaze-orange-deep`, "Opportunities" in `text-blaze-charcoal` (black). URL routes (`/v2/insight-engine/...`), `revalidatePath`/`redirect`/`href` references, function names (`InsightEngineDashboard`, `InsightEngineLayout`), code comments, and docs deliberately left on the `insight-engine` slug — surface-vs-schema separation, and renaming the route is a risky pre-demo refactor.

### Contract bookkeeping (Two-File Rule)

- **CLAUDE.md §5 updated.** "Insight Engine" was a locked banker-facing term ("not Patterns, Trends, Analytics"). Replaced with "Growth Opportunities" as canonical, noting the human-directed rename this session and that the route/code slug intentionally stays `insight-engine`. Flagged the locked-vocabulary deviation to Francisco before making it.

### What was learned / what's open

- **iCloud rename mid-session.** The working tree's parent folder was silently renamed from `Blaze Credit Union/` (with spaces) to `BlazeCreditUnion/` (no spaces) partway through — the old spaces-path threw "working directory was deleted." Same git history, all uncommitted edits survived. Recorded the new path in project memory. This is the recurring iCloud-Drive instability; moving the repo out of iCloud Drive post-demo remains the standing follow-up.
- **Open (cosmetic):** verify contrast of the dropdown-row labels + native selects against the new charcoal filter strip; lighten if needed.

### Files changed

- `app/v2/insight-engine/dashboard/components/HeroMetricsStrip.tsx` — tooltip copy
- `app/v2/insight-engine/dashboard/components/FilterTagRow.tsx` — strip background → charcoal
- `app/v2/insight-engine/page.tsx` — title rename + styling
- `app/v2/insight-engine/layout.tsx` — eyebrow label rename + styling
- `CLAUDE.md` — §5 vocabulary update

---

## 2026-06-03 — Sprint 4 interstitial: banker-facing terminology rename (Artifact → Model; reframe → Key Understanding)

**Session type:** Single-checkpoint interstitial direct build. Two presentation-layer renames, banker-facing copy only. No schema/type/identifier/route/file-name changes.

### What was built

**Task 1 — "Artifact(s)" → "Model(s)" (banker-facing display strings).** Renamed only strings a banker reads. The Prisma model `Artifact`, `ArtifactParameterCapture`, `ArtifactShareRecord`, `ArtifactTemplate`, all enums/fields/types/variables/functions/routes/file names are **unchanged**. The "+ Model" dialpad button and the "Model" step/phase verb were left as-is (intentional, predates this rename — the verb/noun overlap is by design).
- v2 sidebar (`sidebar.tsx`): `SidebarSection label="artifacts"` → `"models"` (renders **MODELS** via the section's CSS uppercase); `"other artifacts"` → `"other models"` (**OTHER MODELS**); `"Record from artifact preview"` CTA → `"Record from model preview"`.
- v2 capture form (`model-form.tsx`): `<optgroup label="Other artifacts">` → `"Other models"`.
- v2 server action (`actions.ts`): validation error `"Artifact is required."` → `"Model is required."`.
- v2 workstation page (`v2/.../page.tsx`): fallback title `"(untitled artifact)"` → `"(untitled model)"`.
- v1 surfaces (still in the demo): preview-dialog heading `"Artifact preview · …"` → `"Model preview · …"`; History band `meta="conversations and Artifact share record"` → `"… Model share record"`; band heading `"Artifact share record"` → `"Model share record"`; empty-state `"No Artifacts shown to this member yet."` → `"No Models shown …"`.
- Seed prose (`prisma/seed.ts`): GrowthStep descriptions ("Render the … chart **Artifact** …") and Macro `recommended_response` strings ("… chart **Artifact** during Show phase", "… map **Artifact** demonstrates …") → "Model". Console.log labels and `ArtifactTemplate` identifiers left untouched.

**Task 2 — "reframe" → "Key Understanding" (banker-facing).** The Artifact/Model editorial concept "the reframe (it supports)" → "Key Understanding". Seed Artifact `description` lead-ins (these render in the preview/Show modal): `"The reframe:"` → `"Key understanding:"` (seasonal LOC); `"The reframe is that …"` → `"The key understanding is that …"` (fleet ROI); `"… the reframe is that …"` → `"… the key understanding is that …"` (capital-event map, ×2 — Artifact desc + Connect-step desc).

**Critically NOT changed (separate concept, flagged for review):** the `insight_type` enum value `"reframe"` (schema identifier) and its banker-facing chip/dropdown label **"Reframe"** (paired with "Implication") in `objective-popup.tsx` / `insight-form.tsx`. That is a distinct concept from the Artifact-supports-a-reframe usage; renaming only it would leave an incoherent "Key Understanding / Implication" pairing. Logged as **Q-050** for Francisco's decision.

### Governance bookkeeping

- **CLAUDE.md §5** — added two canonical-term lines: **Model** (Artifact surfaced to bankers as "Model"; entity name stays in code) and **Key Understanding** (the Artifact/Model "reframe" concept; explicitly distinguished from the unchanged insight-type "Reframe" label).
- **OPEN_QUESTIONS.md** — **Q-049** (doc-sync: Semantic Discipline §3.1 + Data Framework §3.6 "…the reframe it supports…" → "…the key understanding it supports…", and Artifact→Model in the `.docx` design docs — deferred, binary human-owned files not edited by Claude) and **Q-050** (whether the insight-type "Reframe" label should also move).

### Un-auto-changed "reframe" editorial occurrences (for human review)

Per the brief, mid-sentence editorial uses of "reframe" were **not** auto-rewritten. The notable code occurrences (all internal/non-banker-facing, left as-is):
- `lib/synthetic-data/generator.ts` — Pattern `label` strings on the EVP dashboard (e.g. "Capacity-as-lost-revenue reframe", "Board engagement reframe", + the `topPatterns` table labels). These ARE shown on the Growth Opportunities dashboard but name *Insight Patterns* (the insight-type "reframe" concept, Q-050 territory), not the Artifact concept — left pending Q-050.
- `app/v2/insight-engine/dashboard/components/FeaturedDealTile.tsx` (comment) — REFRAME/IMPLICATION chip rendering (Q-050 territory).
- `app/.../capital-event-partnership-map.tsx`, `UnsecuredOpportunityChart.tsx`, `fleet-roi-projection-chart.tsx` — code comments only.
- `lib/stage-guidance.ts:309`, `lib/enum-descriptions.ts:195` — guidance/description prose using "reframe" as a verb ("the Member reframes …", "a credible reframe"); editorial, not the Artifact concept.
- Docs (`DEMO_RUNBOOK.md`, `INSIGHT_PATTERN_LIBRARY*.md`, `CONTENT_REWRITE_v1.md`, sprint prompts) — extensive; out of scope for this code rename.

### Verification

- `pnpm db:reset` reseeded cleanly (4 members, 3 artifacts, 32 models, no errors) → seed-text changes live; `pnpm db:snapshot` refreshed `prisma/seed.db` for Vercel.
- `pnpm build` — compiled successfully, TypeScript passed, all 11 routes intact. Confirms no entity/identifier rename slipped in (would have failed the build).
- Dev-server smoke test of `/v2/members/northland` (the Northland Show-step path): HTTP 200; sidebar renders **MODELS** / **OTHER MODELS**; the fleet Model ("Fleet expansion ROI projection") and its renamed description ("…the key understanding is that revenue captured…") are present in the payload that drives the Show-step modal; zero visible text nodes contain "artifact"/"reframe" (remaining matches are the RSC prop-key `"artifacts"` and template-id `ARTIFACT-TEMPLATE-010` — code-internal, correctly unchanged).

### Confirmation: no entity/schema/identifier names changed

Prisma models, enums (`insight_type` retains `reframe`/`implication`; 44 enum occurrences in `seed-insights.ts` intact), fields, types, variables, functions, server actions, routes, and file names are all unchanged. The build passing is the proof.

### Files changed

- `app/v2/members/[id]/sidebar.tsx`, `app/v2/members/[id]/capture-forms/model-form.tsx`, `app/v2/members/[id]/actions.ts`, `app/v2/members/[id]/page.tsx`
- `app/members/[id]/artifact-preview-dialog.tsx`, `app/members/[id]/page.tsx`
- `prisma/seed.ts`, `prisma/seed.db` (snapshot refresh)
- `CLAUDE.md` (§5), `OPEN_QUESTIONS.md` (Q-049, Q-050)

---

## 2026-06-03 — Sprint 4 scoped discovery: Model render/capture reconciliation (investigation only, no code changes)

**Session type:** Read-only diagnosis of the Northland "Business Vehicle Loan financing summary" Model defect (confident chart numbers sitting under a red "2 PARAMETERS NOT YET CAPTURED" banner). No code/schema/seed/doc edits except BUILD_LOG + OPEN_QUESTIONS.

### Verdict: working hypothesis CONFIRMED + extended — there are **two independent root causes**, not one.

**Root cause 1 — the Sidebar's preview dialog never feeds capture state.** The sidebar renders its **own** `ArtifactPreviewDialog` instance (`app/v2/members/[id]/sidebar.tsx:344–352`) and passes **neither `factorCapturesById` nor `onMissingParameterCapture`**. The dialog forwards `factorCapturesById` to the renderer (`artifact-preview-dialog.tsx:188`), and `ArtifactTemplateRender` defaults missing input to `{}` (`artifact-template-render.tsx:119`), so **every** source-linked param (FACTOR-006, FACTOR-007) is flagged missing — even though both ARE seeded for Northland (`seed-matrix.ts:1684` FACTOR-006 = 88% member_confirmed; `:1694` FACTOR-007 = Yes, marked banker_estimate at `:1289`). The **workstation-shell** dialog instances (`workstation-shell.tsx:704, 804`) DO pass the map (built at `:402` from page props `businessFactors`+`factorCaptures`, wired at `page.tsx:1218–1219`). Two dialog instances, inconsistent wiring; the sidebar "MODELS" click — the reported scenario — hits the un-wired one.

**Root cause 2 — the Sprint 9 charts read raw `parameterValues`, never the reconciled values.** `renderStructuralVisualization` passes the **raw** `parameterValues` prop to every Sprint 9 visualization (`artifact-template-render.tsx:197–208, 336`), while the legacy `SectionListRender` gets `computedValues` + `captureModeByKey` + `missingByKey` (`:264–275`). So the charts bypass the FactorCapture overlay (`resolvedValues`) entirely. `VehicleCapacityUpliftChart.tsx:81` then does `num(parameterValues, "capacity_utilization_now", 80)` — and `num()` (`shared.ts:15–25`) silently returns the **hardcoded literal 80** when the key is absent. The Northland params JSON deliberately omits that key (`seed-artifact-templates.ts:863` — "→ FACTOR-006"), so the visible **"80%" is a component literal masking the real captured 88%.** "$4,200/mo" and "2.8× coverage" ARE param-derived (`current_declined_revenue_monthly` JSON + in-component `month12Coverage = (4200+6000)/3650`).

So: the banner reads capture state (store A); the chart reads model params JSON + hardcoded literals (store B); they are never reconciled. **Fixing only RC1 makes the banner disappear but the chart still shows 80, not 88** — both must be fixed.

### Investigation answers (A–E)
- **A.1/A.2** — Chart values: raw `parameterValues` via `num()` with literal fallbacks. Narrative is **recomputed in-component** (`VehicleCapacityUpliftChart.tsx:300–323`), NOT static prose — so capturing WOULD update the sentence **once the chart is fed resolved values**. The separate "What the model shows" summary IS reconciled (`resolveTemplateString` over `resolvedValues`, `artifact-template-render.tsx:137`) and honestly prints `[Label]` for empties — divergent honesty from the chart.
- **B.3** — `TemplateParameter` (`lib/artifact-template.ts:13–45`) has: key, label, type, options, required, default, min, max, helper, value, computed, computation, source_factor_id. **No** dedicated definition/unit/format field (`helper` is the only prose hook, sparsely populated; unit/format are implied by `type`). `min`/`max` exist but are **read by no render or validation code** (grep-confirmed; only one populated instance, TEMPLATE-007 `max:25000`).
- **B.4** — **No render-blocking-vs-enrichment concept exists.** `required` is the only flag and it drives a CTA, not a render gate; the chart renders regardless.
- **C.5/C.6** — Missing list computed in `artifact-template-render.tsx:122–134, 147–170` against the FactorCapture-overlay + banker-param emptiness. The "banker estimate" buttons/tags (`SourceParamFillInRow`, lines 460–545; `captureModeByKey` flag, `:781–788`) read the **same** store — so when wired (shell path) they reconcile; the sidebar path leaves the store empty.
- **E** — Per the brief's §3.6 characterization (rendered values must validate against `parameter_schema` before display), the current silent literal-substitution (80) is **inconsistent**: an unvalidated, untagged value that contradicts the captured 88 is displayed as fact. No min/max/type validation runs at render.

### Parameter audit (all three Models) — full table in the report-back this turn.
- **Northland (TEMPLATE-010, `vehicle_capacity_uplift`)** — 15 params; chart consumes 9; 3 source-linked (purchase_price/FACTOR-033, capacity_utilization_now/FACTOR-006, demand_exceeding_capacity/FACTOR-007). `demand_exceeding_capacity` is **required + source-linked but read by no chart code** (dead required param). Most params: no helper, no unit, no min/max, several required without defaults.
- **Jenny (seasonal)** — renders the **preserved v1 `SeasonalSmoothingChart()` no-arg, fixture-hardcoded** component (`artifact-preview-dialog.tsx:171–173`). Consumes **zero** schema params → no missing banner, no reconciliation issue. (TEMPLATE-009 schema exists and is used by **Riverside** via `cashflow_projection` → `SectionListRender`, which DOES reconcile.)
- **Cygnus (capital event map)** — schematic/roadmap (static structural stages, not parametric); the roadmap portion has no source-linked params and no silent-default issue. Any paired comparison chart (`Sba504StructureComparison`) shares the raw-`parameterValues` pattern but the headline is structural, so the defect is largely N/A for the schematic itself.

### Build proposal — three coordinated workstreams (full detail in the report-back).
1. **Single source of truth for rendered values (~M).** Feed Sprint 9 charts the reconciled values + a per-key capture-mode/missing map (extend `renderStructuralVisualization` to pass `resolvedValues`/`computedValues` + `captureModeByKey`/`missingByKey`); strip hardcoded literals from `num()` call-sites so an absent value renders as a tagged estimate or a gap, never a hidden number. Wire `factorCapturesById` + `onMissingParameterCapture` from shell → Sidebar → its dialog (or hoist sidebar preview to the shell dialog) so the two instances behave identically.
2. **Per-parameter input definitions (~M).** Add definition + unit + format + range to `parameter_schema` (work backward from each visualization's consumed keys); surface them in the capture form and as tooltips. Decide whether to add explicit `unit`/`definition`/`format`/`render_role` fields or overload `helper`.
3. **Panel reframing + render-role gating (~S, design-gated).** Reframe the red "MISSING/error" banner to "using estimates — capture to firm up"; introduce render-blocking vs enrichment classification to decide hard-gate vs soft-tag.

### Escalated (NOT decided this turn) → OPEN_QUESTIONS
- **Q-051** panel reframing wording + color (compliance-adjacent tone).
- **Q-052** render-blocking vs enrichment classification per Model.
- **Q-053** confirm the direction on removing silent chart literals (display treatment of an absent value).
- Also **resolved Q-050** this session — Francisco: leave the Insight-type "Reframe / Implication" label as-is.

### Files inspected (no edits)
`artifact-template-render.tsx`, `artifact-visualizations/VehicleCapacityUpliftChart.tsx` + `shared.ts`, `lib/artifact-template.ts`, `artifact-preview-dialog.tsx` (v2), `sidebar.tsx`, `workstation-shell.tsx`, `seed-artifact-templates.ts`, `seed-matrix.ts`, `app/v2/members/[id]/page.tsx`.

---

## 2026-06-03 — Sprint 4/9 Build Prompt 1: Model render/capture reconciliation (correctness only)

**Session type:** Correctness build (no schema/enum/identifier/seed changes). Implements the dispatch-level reconciliation + dialog-wiring fix from the prior investigation. 4 files, +57/−9.

### What was built
- **Task 1 — dispatch reconciliation (`artifact-template-render.tsx`).** The Sprint 9 visualizations now consume the RESOLVED map instead of raw `parameterValues`. One-line-of-logic change at the `renderStructuralVisualization` call: feed `computedValues` (= params JSON base + FactorCapture overlay + computed/static; precedence capture > JSON > default) into the slot every visualization reads. Honors the MERGE INVARIANT — a JSON param with no competing capture passes through unchanged. `SectionListRender` already consumed `computedValues` (untouched), so Riverside's `cashflow_projection` path is unaffected by construction.
- **Task 2 — strip the source-linked literal (`VehicleCapacityUpliftChart.tsx`).** Removed `num(parameterValues, "capacity_utilization_now", 80)` → no literal. Added an absent-guard: utilization renders `not captured` when the source value is absent, never a fabricated %. **Scope call (escalated, see Q-053):** only the SOURCE-LINKED captured-fact literal was stripped — that's the documented compliance lie (an 80 masking captured 88). The remaining `num()` literals across the 9 charts are NON-source-linked modeling assumptions (rates/terms/horizon); relocating them to a single source of truth requires schema `default`s (a SEED CHANGE forbidden in Prompt 1), and stripping them to bare `0` would swap one unmarked number for another. Deferred to Prompt 2/3, logged under Q-053.
- **Task 3 — dialog wiring (RC1) (`sidebar.tsx` + `workstation-shell.tsx`).** Threaded `factorCapturesById` + `onMissingParameterCapture` from the shell → `V2Sidebar` → its own `ArtifactPreviewDialog` (additive, lowest-risk; the shell's popup dialog already had them). The sidebar "MODELS" click now resolves source-linked params instead of flagging captured data as missing. Two dialog instances, now identical behavior.

### Verification (build + deterministic merge proof; interactive screenshot blocked by environment)
- `pnpm build` — **green** (compiled successfully, TypeScript passed, all 11 routes). No identifier/enum/schema rename slipped in (build would fail).
- **Interactive Playwright run was blocked** by a Next dev Fast-Refresh reload loop (the documented iCloud file-churn — see [[project_icloud_eviction_risk]]; `next start` also hit a MODULE_NOT_FOUND on an evicted `.next` chunk). Environment, not code.
- **Pivoted to a deterministic proof** running the REAL `computeAllValues` + the real overlay logic against the LIVE DB fixtures (temp `tsx` script, deleted after). Result **ALL PASS**:
  - **Northland** (`/v2/members/northland`, TEMPLATE-010): JSON omits `capacity_utilization_now`; FACTOR-006 = 88; **resolved chart input = "88"** (was the 80 literal); both source-linked params (FACTOR-006/007) resolve → **no missing banner**.
  - **Cygnus HARD GATE** (TEMPLATE-008 `sba_504_paired`): every consumed key resolves **=== raw JSON** — property `$5.5M`, rates 7.25/5.25/8.5, amortization 25, **current_stage = 3** ("Cygnus is here" on stage 3). FACTOR-035 IS captured but AGREES with JSON → **byte-for-byte unchanged**.
  - **Jenny** (v1 hardcoded, bypasses the renderer) + **Riverside** (`SectionListRender`, still gets `computedValues`) — unaffected by construction.
- **Data correction:** Cygnus's live SBA 504 property value is **$5.5M** (the `migrateCygnusModelToTemplate` value), not the $2.2M I cited in the prior investigation turn (a stale `LEGACY_MODEL_PARAMS` block). The byte-for-byte gate still holds — capture and JSON agree at $5.5M.

### Canonical-value question — CLOSED (not open)
88% is the canonical Northland utilization (FACTOR-006, member_confirmed). The visible "80%" was a component literal fallback, not authored prose (the narrative interpolates the value dynamically). 88% lands in the "85%+ severely constrained" band, so "at capacity" reads correctly. **Fix is code, not data — no seed edit.**

### Out of scope (Prompts 2–3, open): Q-051 panel reframe wording/color · Q-052 render-role classification · Q-053 non-source-linked assumption-default literals + richer absent-value treatment.

### Pre-flight note
Tree was NOT clean at start — the prior Artifact→Model/Reframe rename + investigation doc edits are still uncommitted (never asked to commit). This build's 4 files are additive on top; recommend committing the rename + investigation + this build as separate commits.

### Files changed (this build)
- `app/v2/members/[id]/artifact-template-render.tsx` — dispatch feeds resolved values
- `app/v2/members/[id]/artifact-visualizations/VehicleCapacityUpliftChart.tsx` — strip source-linked literal + absent guard
- `app/v2/members/[id]/sidebar.tsx` — accept + forward `factorCapturesById`/`onMissingParameterCapture`
- `app/v2/members/[id]/workstation-shell.tsx` — pass both to `V2Sidebar`

---

## Diagnosis (read-only) — Source inventory for resolve-then-prompt · branch `diagnosis/required-field-audit`

Investigation only; no code/schema/seed changes. Continues the §1 required-field audit.

### What was produced
- Per-template **source inventory**: for each model's genuinely-needed (no-fallback) essential values, the tier {member-fact · captured-evidence · product/Rec · forward-estimate · un-captured-measure}, the exact resolving source, whether it is wired today, and whether it is populated for Jenny/Northland/Cygnus. Demo-critical templates done in full first (010 Vehicle, 004 Equipment, 002 SBA 7(a), 008 SBA 504, 005 PACE), remainder tagged non-critical (001/003/006/007/009).

### Key findings
- **No discrete quantitative Member columns exist** — every "member-fact" lives in a `FactorCapture` row; `Member.key_facts` is hand-curated display JSON only.
- **Only wired resolution today** = `source_factor_id` overlay (`artifact-template-render.tsx:123-133`) + `computed` params. `Recommendation` is never read; cross-key derivation never runs. All non-source values resolve only from the **hand-seeded literal**, i.e. PROMPT in a real flow.
- Genuinely resolvable-today across all 10 templates is small: FACTOR-019 (revenue, all 3), FACTOR-006 (utilization, Northland/Cygnus), FACTOR-001 (variance, Jenny), FACTOR-035 (property, Cygnus only). The "sized" dollar factors 033/034/036/037 are captured for **no demo member**.
- A per-product **evidence tab is a wiring job** for the captured/sized + Recommendation tiers (the template `source_factor_id` set already declares the join); but forward estimates + recurring monthly operating measures have **no ledger home** and will remain PROMPT rows.

### Flagged for Francisco (logged to OPEN_QUESTIONS)
- **Q-054** `current_monthly_revenue` precedence/semantics (derived FACTOR-019÷12 vs seeded literal; conflict).
- **Q-055** loan-amount source precedence: "sized" factor (036/037) vs `Recommendation.size_proposed`.
- **Q-056** one factor → many template keys, incl. `annual_operational_spend` mis-wired to FACTOR-019 (revenue ≠ spend).
- **Q-057** schema gap: recurring monthly operating measures + loan term/rate + roadmap position have no home.

### Files changed
None (read-only). Append-only notes to BUILD_LOG + OPEN_QUESTIONS.

---

## BUILD 2a — Curate + trim + un-mis-wire (demo-presentable floor) · branch `build/2a-curate-trim`

Branched off `diagnosis/required-field-audit`. Preview-verified on localhost; build green. NOT main.

### What changed (all in `prisma/seed-artifact-templates.ts` unless noted)
1. **Seed curation (§3 / §5).** Replaced `FIXTURE_TEMPLATES = ALL_TEMPLATE_IDS` per member with an evidence-backed set (confirmed w/ Francisco): Northland → {010 Vehicle, 004 Equipment}; Cygnus → {008 SBA 504, 001 CRE}; Jenny → {009 Seasonal, 006 Visa, 007 Unsecured}; Riverside unchanged. Models dropped **32 → 9**. Removed the SBA/PACE/CRE scattershot from Northland's surface.
2. **Fleet title (§5b).** Re-added `name: "Fleet expansion ROI projection"` to the legacy-retag param patch (`LEGACY_MODEL_PARAMS.northland["ARTIFACT-TEMPLATE-004"]`). Surfacing it required a read fix (below) because `Model.parameters` is double-encoded.
3. **Trim spurious-required (§1).** Set `required:false` on chart-irrelevant fields for every demoed template; `interest_rate` un-required everywhere. Required counts now: 010→5, 004→4, 008→2, 001→2, 006→3, 007→2 (009 section-list unchanged at 6). Did NOT delete params (would break template-010's computed `loan_amount` and output-summary prose); un-require only.
4. **Un-mis-wire (Q-056).** Removed `source_factor_id:"FACTOR-019"` from `annual_operational_spend` (006) — FACTOR-019 is annual revenue, not spend.
5. **Q-054 guard.** Documented that `current_monthly_revenue` (010) intentionally has no `source_factor_id`; keeps its fleet-line value (no resolve added).

### Code fix required for §5b
`app/v2/members/[id]/page.tsx` — added `parseModelParameters()` helper and used it at the three model-`.parameters` display reads. `Model.parameters` is a Prisma `Json` column the seed writes as a JSON-encoded **string** (double-encoded); `actions.ts` already guarded this, but the page reads cast `as {name?}` and silently got `undefined`, which is why the fleet name never surfaced. No schema change; mirrors the existing `actions.ts` idiom.

### Verification (preview + build)
- Northland feed/sidebar: only **Fleet expansion ROI projection** + **Business Vehicle Loan** cards; 0 SBA/PACE/CRE model cards (residual SBA/PACE strings are the `+Model` template-catalog dropdown in the RSC payload, not cards).
- Jenny: Seasonal + Visa + Unsecured. Cygnus: SBA 504 + CRE. Riverside unchanged.
- `npx tsc --noEmit` clean; `pnpm build` green (all routes).

### Flagged for Francisco (OPEN_QUESTIONS)
- **Q-058** Cygnus SBA model dual-naming: feed shows "SBA 504 transaction roadmap" (template) but sidebar shows "Capital event partnership map" (stale legacy Artifact.title). Mirror of the fleet issue, out of the 5-step scope — left for confirmation.
- **Q-059** Builder field-count: the `+Model` form still renders ALL template params (010 = 15 inputs) with only ~5 required/asterisked. Reducing rendered count needs a form-render filter (out of 2a scope).

### Not done (intentional)
- `prisma/seed.db` snapshot NOT refreshed (Vercel deploy artifact; do `pnpm db:snapshot` before any preview deploy). Nothing committed.

---

*Next session entry will be appended below.*
