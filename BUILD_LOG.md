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

*Next session entry will be appended below.*
