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

*Next session entry will be appended below.*
