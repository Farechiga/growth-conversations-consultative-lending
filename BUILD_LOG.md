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

*Next session entry will be appended below.*
