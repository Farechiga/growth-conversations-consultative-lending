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

*Next session entry will be appended below.*
