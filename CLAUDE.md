# CLAUDE.md

**The prime contract for this project. Read this at the start of every session.**

You are Claude Code working on the Blaze Member Signals demo. This document is the session contract: it defines the hard rules, the tech stack, the naming conventions, the forbidden patterns, the session ritual, and pointers to the design documents that are authoritative for what gets built.

If a question arises that this document does not answer, check the four design documents (Tier 2 below). If they do not answer it, log it to `OPEN_QUESTIONS.md` and proceed with the most conservative reasonable default. **Never silently guess on substantive design decisions.**

---

## 1. What this project is

A standalone web demo of the Blaze Member Signals system, built to support an EVP-of-Lending follow-up at Blaze Credit Union. The demo shows three banker-facing surfaces (Growth Conversations, Member profile, Insight Engine) running against a populated fixture (Jenny's Catering plus supporting Members) so the EVP can see the design in operation.

Scope is the demo phase only. The pilot phase and production v1 are separate efforts with different stack decisions; do not anticipate them in demo code.

---

## 2. Tech stack — locked

These are not preferences; they are constraints. Do not substitute libraries without logging the question to `OPEN_QUESTIONS.md` first.

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| UI library | React 19 |
| Styling | Tailwind CSS + shadcn/ui components |
| Charts | Recharts |
| ORM | Prisma |
| Database | SQLite (file-based, demo phase only) |
| Deployment target | Vercel |
| Node version | 20 LTS or 22 LTS |
| Package manager | pnpm (preferred) or npm |

**Why SQLite and not PostgreSQL:** the demo runs from a single file, has zero ops, and Prisma abstracts the SQL dialect. Migration to PostgreSQL is a one-line provider change in `schema.prisma` when the pilot phase begins. Do not introduce PostgreSQL during the demo phase.

**Why no auth:** the demo has no real PII, no real members, no real bankers. A banker dropdown for "logging in as" is sufficient. Do not add Auth.js, NextAuth, Clerk, or any authentication library during the demo phase.

---

## 3. Forbidden patterns

These are absolute prohibitions for the demo phase. Each has a specific reason; do not violate without first logging to `OPEN_QUESTIONS.md` and getting explicit human approval.

- **No real PII.** All Members, Conversations, Signals, and other member data are fictional. The Jenny's Catering fixture and supporting Members are synthetic.
- **No HubSpot integration code.** Not even stubbed. The demo is standalone. HubSpot UI Extensions are a production-phase concern.
- **No authentication library.** Banker identity is selected from a dropdown; no SSO, no OAuth, no session tokens.
- **No external API calls.** No LLM calls, no analytics services, no third-party data providers. The demo runs entirely against local seed data.
- **No PostgreSQL.** Stay on SQLite for the demo. Prisma schema changes that depend on PostgreSQL-only features (e.g., advanced jsonb operators) require logging to `OPEN_QUESTIONS.md` first.
- **No Supabase or any BaaS.** Pure Next.js + Prisma + SQLite.
- **No vector embeddings.** Descriptions are stored as plain text. Vector search is a Phase 2 capability.
- **No real-time anything.** No WebSockets, no SSE, no polling refresh. State updates on user action only.
- **No multi-tenancy code.** One Blaze instance only.

---

## 4. Source-of-truth hierarchy

When information conflicts between sources, this is the resolution order:

1. **`CLAUDE.md`** (this file) — the session contract, highest authority for stack and rules
2. **`OPEN_QUESTIONS.md`** — resolved decisions are authoritative once moved to the resolved section
3. **`SCOPE.md`** — what's in and out of demo scope
4. **The four design documents** (`01_Overview.docx`, `02_Semantic_Discipline.docx`, `03_Data_Framework.docx`, `04_Module_and_Data_Flow.docx`) — authoritative for design substance
5. **Code comments and inline docs** — implementation detail only; never override design docs
6. **`BLAZE_STYLE_GUIDE.md`** — colors and style guide for UX/UI design styling

The Data Framework document is authoritative for entity names, field names, types, and relationships. The Semantic Discipline document is authoritative for naming conventions and required descriptions. The Module and Data Flow document is authoritative for module behavior and data flow patterns. When something is in code but not in the design docs, that is a documentation gap to log, not a design decision to assume.

---

## 5. Naming conventions — strictly enforced

These names come from the locked vocabulary in the design documents. Use them exactly. Do not abbreviate, pluralize awkwardly, or invent variants.

### Banker-facing strings (UI labels, copy, summaries)

Always use:

- **Growth track** — not Track, Path, Playbook, Sequence
- **Growth step** — not Move, Play, Step (alone), Action
- **Growth lead** — not editor, curator, playbook lead, knowledge manager
- **Member Type** — not Persona, Segment, Cell, Cohort
- **Topic** — not tag, label, category (in user-facing strings)
- **Their words** — not quote, phrasing, member quote
- **Feeling** — not emotional charge, sentiment (in capture context)
- **Follow up** — not nurture, follow-up card, future contact
- **Growth Conversations** — not Meeting Recap (renamed Sprint 2 Prompt 2 §F per DEMO_BUILD_PLAN.md v2), not Onboarding & Routing, not Debrief, not Capture
- **Member profile** — not Member Dashboard, Account view, Member page
- **Growth Opportunities** — the EVP-facing portfolio surface (renamed from "Insight Engine" per human direction, this session). Not Patterns, Trends, Analytics, Insight Engine. Note: the URL route (`/v2/insight-engine/...`), code identifiers, and function names retain the `insight-engine` slug per surface-vs-schema separation; only banker-facing display strings use "Growth Opportunities".
- **Model** — `Artifact` (entity/schema name) is surfaced to bankers as "Model" (Sprint 4 interstitial rename). Keep the entity name in code; use "Model" in all banker-facing copy. The Prisma models `Artifact`, `ArtifactParameterCapture`, `ArtifactShareRecord`, `ArtifactTemplate`, all enums, fields, types, variables, functions, routes, and file names stay as-is per surface-vs-schema separation. Note: the "+ Model" dialpad button and the "Model" step/phase verb are a separate, intentional usage and predate this rename — the verb/noun overlap ("a Model step shows a Model") is by design.
- **Key Understanding** — the Artifact/Model editorial concept formerly written as "the reframe" (the reinterpretation a Model supports) is surfaced to bankers as "Key Understanding" (Sprint 4 interstitial rename). Distinct from the `insight_type` enum value `reframe` and its banker-facing chip/dropdown label "Reframe" (paired with "Implication"), which is a *separate* concept and is **unchanged** — see [[OPEN_QUESTIONS]] for the pending decision on whether that label should also move.

### v2 workstation banker-facing terms (Sprint 4.7 → 4.7.2)

The v2 prototype introduces a parallel banker-facing surface at `/v2/members/[id]`. Sprint 4.7.2 (vocabulary refactor) updated the four objectives and reduced activities from seven to five. Canonical terms:

- **Workstation** — the v2 single-page-per-Member surface. Replaces the v1 split between Member profile + Growth Conversations.
- **Objective** — persistent goal a banker is working toward across activities. The four objectives are **Discover · Measure · Consult · Navigate**.
- **Activity** — discrete capture action a banker takes. The five activities are **+ Ask · + Quantify · + Model · + Reaction · + Action**.
- **Dot** — UI primitive for evidence representation in the sidebar. Four states: filled (captured) · outlined (capturable) · faint (not yet relevant) · accented (open thread).
- **Open thread** — single most-urgent item for a Member, surfaced in the workstation header.
- **Evidence** — captured signal/magnitude/model/reaction/resolution; the substrate for objective dots.

**Surface changes from Sprint 4.7.2:**

- **Show** is no longer a dialpad button. ShowEvents fire two ways: automatically when + Model saves with "with Member" provenance, or explicitly via "Record show" button on the sidebar artifact preview dialog. Preview-without-record is the default (preserves the banker-rehearses-quietly use case).
- **Resolve** is no longer a dialpad button on v2. Member responses are captured via + Reaction, which subsumes response value (7 enum values), member quote, and primary concern (contextual taxonomy per COMPLIANCE.md §6.3). v1 ResolveSection persists for v1 routes per ARCHITECTURE_V2.md §12.5.

**Retired from banker-facing language** (code-internal use only):

- **Stage** — replaced by *objective* (persistent) or *activity* (discrete).
- **Phase** — replaced by *objective*.
- **Step** — replaced by *activity*.
- **Land · Understand · Formalize** — replaced by *Discover · Measure · Navigate* (Sprint 4.7.2 rename). Consult unchanged.

**Schema retains existing identifiers per ARCHITECTURE_V2 §11.7 surface-vs-schema separation:**

- `step_phase`, `StepShape` enum, `SizingMeasurement` table — unchanged.
- The Objective abstraction is **derived state**, not a Prisma model — there is no `Objective` table or `ObjectiveType` enum in the database.
- Sprint 4.7.2 ships two schema changes: ReactionValue enum 5 → 7 values (adds `committed`, `declined`); `Reaction.primary_concern` String column with contextual taxonomy.

Translation layer lives in `lib/enum-descriptions.ts`, `lib/stage-guidance.ts` (V2Objective union literal), and v2 component files. Example: `SizingMeasurement` table → "Quantify" banker-facing label → "Sized" feed-card type tag.

### Code-internal names (TypeScript types, Prisma models, function names)

The Data Framework document specifies machine-readable field names that may differ from banker-facing labels. For example: `canonical_tag` (field name in code) renders as **Topic** (banker-facing label). The pattern is: schema field names use snake_case as documented; banker-facing display strings use the labels above.

For Prisma model names, use PascalCase per Prisma convention: `Member`, `Conversation`, `Signal`, `ActionCard`, `GrowthStep`, `Artifact`, `GrowthTrack`, `MemberType`. The internal `step_shape` enum uses lowercase values (`ask | size | show | propose | resolve | connect`).

### Internal design vocabulary (never user-facing)

The six Growth step shapes (Ask, Size, Show, Propose, Resolve, Connect) are internal design concepts. They appear in:

- The Prisma schema as an enum
- TypeScript types
- Growth lead's authoring tools (not built in demo phase)

They do **not** appear in any banker-facing UI string. Bankers see step content; they do not see step shape labels.

### Member-facing language (the third register)

A third linguistic register applies anywhere the system surfaces banker-to-member follow-through — `ActionCard.suggested_opening` text, takeaway descriptions, email/SMS preview content, anything the member would actually read or hear. The discipline is: **code names → banker-facing labels → member-facing language**, with each tier obeying its own rules.

Banker-facing terms that **must not appear** in member-facing strings:

- "Growth track" — never use member-facing. The track is internal scaffolding the banker uses; the member experiences a conversation, not a track.
- "Artifact" — replace with "the projection," "the analysis," "the visualization," or simply name the artifact ("the seasonal smoothing chart"). "Parameterized chart" likewise becomes "custom projections for [your/her/their] business" or "the projection we walked through."
- "Topic" / "canonical_tag" / "Signal" — these are system-internal and do not appear in member-facing language.
- "Their words" — never appears in member-facing prose; just the quote itself does, in italics with proper typographic quotes.
- "Recommendation" — when surfacing to the member, prefer "what we proposed" or "the line of credit we discussed" — anchor on the product or the moment, not the system label.

Captured fields that **render differently** depending on register:

| Field | Code | Banker-facing | Member-facing |
|---|---|---|---|
| `Recommendation.size_proposed` | `75000` | "$75K" | "around seventy-five thousand" |
| `Recommendation.response = leaning_yes` | `leaning_yes` | "leaning yes" | (don't surface this back; the banker knows where they landed) |
| `Signal.severity = painful` | `painful` | "painful" | (don't surface; the member already knows it hurts) |
| `Signal.their_words` | string | shown verbatim in pull-quote | shown verbatim if echoed back, never as "their words" framing |
| Growth step `content` | string | the script the banker reads | the substance of the question, not the script |

Apply this in code: any field that flows into `ActionCard.suggested_opening`, into a takeaway email body, or into any string the member sees, must pass through the member-facing register lens. `ActionCard.rationale` (banker-only, drives the operational queue) stays banker-facing; `ActionCard.suggested_opening` (read by the member if the banker copy-pastes it) is member-facing.

When a fixture or template surfaces a banker-facing term in a member-facing field, that's a real defect, not a stylistic preference. Treat it the same as misspelling the member's name.

---

## 6. The Two-File Rule

When you change something that is described in two places, change both in the same commit. Specifically:

| If you change... | Also update... |
|---|---|
| A Prisma model field | The corresponding section of Data Framework (note in BUILD_LOG) |
| A banker-facing label | Verify it matches Section 5 above; if section 5 needs updating, log it |
| Demo scope (added or removed) | `SCOPE.md` |
| A resolved ambiguity | Move the entry from open to resolved in `OPEN_QUESTIONS.md` |
| Tech stack (any deviation) | Update Section 2 above; log the reason in `BUILD_LOG.md` |

If you cannot make the second update in the same change (e.g., the design document is not in this repository), log a deferred-doc entry in `BUILD_LOG.md` so the gap is visible.

---

## 7. Session ritual — mandatory

### Session start

1. Read this `CLAUDE.md` end to end.
2. Scan the most recent 1–2 entries in `BUILD_LOG.md` for context on where work left off.
3. Read `OPEN_QUESTIONS.md` — note any open items that affect today's planned work.
4. State (in your first response of the session) what you intend to work on and which design documents you plan to consult.

### During the session

- When you hit a substantive ambiguity not answered by the design docs, **stop and log it to `OPEN_QUESTIONS.md`** before proceeding. Note the conservative default you are using in the meantime.
- When you complete a verifiable milestone (a screen renders, a fixture loads, a test passes), note it briefly so it can be reflected in the session-end log.
- Prefer small, reviewable changes over large rewrites. If a change touches more than ~200 lines or more than ~5 files, ask before proceeding.

### Session end

1. Append a new entry to `BUILD_LOG.md` covering: what was built, what was learned, what blocked, what's open, what's the suggested next move.
2. If any items in `OPEN_QUESTIONS.md` were resolved during this session, move them to the resolved section with the resolution noted.
3. Verify that `SCOPE.md` is still accurate; if scope changed, update it.
4. Do not edit prior `BUILD_LOG.md` entries. Append-only.

---

## 8. Code style and discipline

- **TypeScript strict mode** — no `any` without explicit justification.
- **No magic strings for vocabulary terms** — define `LABELS` constants for banker-facing strings so the renaming discipline is enforced in one place.
- **Prisma migrations are first** — do not write code against a schema you have not migrated to. Migration first, code second, fixture data third.
- **Test the fixture loads cleanly** at every session end, even if no formal tests exist yet.
- **Comments explain why, not what** — the code shows what; the comment explains the design choice.
- **No dead code paths** — if a feature is out of scope, do not stub it; just don't write it.

---

## 9. The Semantic Discipline carries forward

Per the Semantic Discipline document (Tier 2), every `MemberType`, `Topic`, `GrowthStep`, `GrowthTrack`, `Artifact`, and `Rule` record in the seed data must have a populated `description` field. The description is one to two sentences, written for a reader outside the lending team.

This applies to fixture data, not just to documentation. The Jenny's Catering fixture must include real descriptions for the Member Type ("Small Caterer · Starting"), the Growth track ("Smooth seasonal cash flow with LOC for small caterer"), each Growth step in that track, the Artifact (the seasonal smoothing chart), and any Topics referenced.

Descriptions show in the demo UI — both as tooltips and (for some entities) as full paragraphs in admin/inspection views. They are not just metadata; they are user-facing content.

---

## 10. Out of scope reminders

These are explicitly out of scope for the demo phase. Do not build them, even if they seem easy:

- Authentication and authorization
- Multi-user concurrency
- Real-time updates
- Audit log persistence (the design captures it; the demo does not need to surface it)
- HubSpot UI Extensions
- HubSpot Custom Objects
- Core system (Symitar / Jack Henry) integration
- SFTP file ingest
- Compliance dashboards
- Email or SMS sending (Artifact share is captured as a record; no actual delivery)
- LLM-generated summaries (templated summaries only)
- Vector embeddings or semantic search
- Multiple Blaze instances or tenants

If a request comes in that touches any of these, stop and log to `OPEN_QUESTIONS.md` rather than building.

---

## 11. When in doubt

The honest defaults when a question is not answered by this document or the design docs:

- **Stack question** → use what's in Section 2; do not add new dependencies without logging to `OPEN_QUESTIONS.md`
- **Naming question** → use what's in Section 5; if it's not there, prefer the term used in the Data Framework document
- **Scope question** → check `SCOPE.md`; if not there, log to `OPEN_QUESTIONS.md` and assume out of scope until resolved
- **Design question** → check the four design docs; if not there, log to `OPEN_QUESTIONS.md` and use the most conservative interpretation
- **Style question** → match the existing code in this repo; if there's no precedent, prefer simplicity and explicitness

When you genuinely cannot proceed without a decision, stop and ask. Do not invent a design just to keep moving.

---

## 12. Document set

The complete documentation set for this project:

**Tier 1 — Hard rules (read every session)**
- `CLAUDE.md` (this file)
- `OPEN_QUESTIONS.md`
- `docs/DEMO_BUILD_PLAN.md` (strategic source of truth above this set; six sprints, multiple prompts each)
- `docs/DEMO_BUILD_PLAN_v3_AMENDMENTS.md` (Sprint sequence revision under Path C-modified; consult alongside DEMO_BUILD_PLAN.md until merged into v3.0)
- `ARCHITECTURE_V2.md` (canonical v2 architecture reference; the consultative-arc model, four-objective surfaces, two-layer view structure)
- `EVIDENCE_FRAMEWORK.md` (operational catalog of evidence types and how they map to the four objectives; companion to ARCHITECTURE_V2.md)
- `BUSINESS_FACTOR_MATRIX_v1.md` (canonical Sprint 5a matrix data: 28 business factors, 5 Track templates, ~60 matrix entries with threshold rules and banker rationale; per-fixture demo captured-factors data; consult for any matrix-data question)
- `INSIGHT_PATTERN_LIBRARY_v1.md` (canonical Sprint 5b.1 Insight pattern library: 36 senior-authored Patterns across 5 Tracks with implication questions; per-fixture demo Insight expectations Section 7; consult for any Pattern-data question)
- `MEMBER_TYPE_GUIDANCE_v2.md` (canonical Sprint 5b.2 Coach content: 12 Member-Type × Objective cells with verb-led bullets; Path B discipline for Member-Type-specific operational practice)
- `MEMBER_TYPE_GUIDANCE_v3_addendum.md` (canonical Sprint 5c Coach delta: SBA 504-aware specialty_manufacturing replacement + minor catering/HVAC cross-Track additions)
- `INSIGHT_PATTERN_LIBRARY_v2_additions.md` (canonical Sprint 5c Pattern delta: 23 new Patterns for TRACK-006 through TRACK-011; drop list for TRACK-005 patterns)
- `COMPLIANCE.md` (fair lending and compliance governance reference; FFIEC CMS framework; business-factor-only taxonomy for primary_concern; banker-prose discipline)

**Tier 2 — Reference design (consult when relevant)**
- `docs/design/01_Overview.docx`
- `docs/design/02_Semantic_Discipline.docx`
- `docs/design/03_Data_Framework.docx`
- `docs/design/04_Module_and_Data_Flow.docx`
- `docs/design/MEMBER_FIXTURE_BRIEF.md` (consult during fixture authoring)
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` (consult during Insight Engine work; authoritative for Insight Engine design decisions in Sprint 4 and Sprint 5; §9.5 addendum reflects the v2 design conversation)
- `BLAZE_STYLE_GUIDE.md` (consult before any UI work)
- `PROTECTED_CLASS_KEYWORD_LIST_v1.md` (source data for the compliance keyword scan; Sprint 4.6 implements `lib/compliance-keywords.ts` from this content)

**Tier 3 — Living progress trackers**
- `BUILD_LOG.md` (append-only chronological log)
- `IMPLEMENTATION_STATUS.md` (verified-complete checklist)
- `SCOPE.md` (in/out scope contract)
- `DEMO_RUNBOOK.md` (Sprint 6 — pre-demo checklist + narrative arcs + talking points + backup plans for the EVP demo)
- `docs/prompts/SPRINT_N_PROMPT_M.md` (executable sprint prompts; each is one self-contained handoff against the build plan)

**Tier 4 — Generated and synced**
- `prisma/schema.prisma` (single source of truth for table/column names)
- `prisma/seed.ts` + `prisma/seed-matrix.ts` + `prisma/seed-insights.ts` (Sprint 5a.1 split matrix records; Sprint 5b.1 split Insight architecture records — 36 InsightPatterns + 12 per-fixture Insights with cached LLM match data)
- `lib/factor-evaluator.ts` (Sprint 5a.1 — pure-function threshold rule parser; Sprint 5a.2 added LENGTH operator for qualitative_multi array-length comparisons)
- `lib/track-ranker.ts` (Sprint 5a.1 — `rankTracksForMember()` returns ordered Track candidates per the matrix)
- `lib/objective-evidence.ts` (Sprint 5a.2 — Track-relative dot derivation: `deriveDotsForObjective`, `capturedDots`, `missingEvidence`, `nextValuable`. Resolves both factor refs and symbolic refs against a Member's captured data)
- `lib/cta-derivation.ts` (Sprint 5b.1 Block A — bounded CTA derivation across three layers: missing template evidence; threshold-uplift; specialist handoff. `deriveNextActions()` returns ranked CTA[]; empty array is valid when work is genuinely complete)
- `lib/insight-matching.ts` (Sprint 5b.1 Block E — Anthropic API integration for live Insight matching during banker authoring. 5s timeout + graceful fallback to novel-state. Seed Insights ship cached match data; live API only fires for banker-authored Insights during a demo session)
- `lib/workflow-state.ts` (Sprint 5b.2 Block A — `recomputeWorkflowState(prisma, memberId)` materializes denormalized workflow signals for portfolio queries. Called from v2 server actions after capture writes via `recomputeAndRevalidate`)
- `lib/recapture-detection.ts` (Sprint 5b.2 Block F — `factorCaptureOrUpdate` + `reactionOrUpdate`. Same value re-captured → timestamp update; different value → new row with prior preserved by newest-by-captured_at queries)
- `lib/portfolio-queries.ts` (Sprint 5b.2 — `memberRoster`, `trackPerformanceData`, `openIndecisionData`, `stageSkipData`. Pure-function transforms over Prisma rows for the four Insight Engine surfaces)
- `app/v2/insight-engine/layout.tsx` + `page.tsx` (Sprint 5b.2 — Insight Engine shell + landing. Top nav: Track Performance / Member portfolio / Coverage / Stage-skip)
- `app/v2/insight-engine/{tracks,portfolio,coverage,stage-skip}/page.tsx` (Sprint 5b.2 Blocks B-E — four portfolio surfaces. All `force-dynamic` to reflect live DB on each visit)
- `lib/stage-guidance.ts` (Sprint 5a.3 added `coachBullets()`, `MEMBER_TYPE_COACH`, `CoachBullet` type — coach surface authored as per-Member-Type × per-objective bullets with optional CTAs and bold-fragment figures. `objectiveGuidance()` retained for backward compat)
- `app/v2/members/[id]/objective-popup.tsx` (Sprint 5a.2 Block D, refactored Sprint 5b.1 — popup-as-workflow surface. Top zone shows CTAs from `deriveNextActions` (empty array → not rendered). Bottom zone shows captured evidence + Insights. Goal/Blocker/Indecision/Trigger rows have lightbulb (canonical Patterns popover) + `+ Insight` (contextual authoring) affordances. Footer: Implications: bulleted from matched Patterns; `+ deepen` when CTAs empty + evidence present)
- `app/v2/members/[id]/specialist-handoff-dialog.tsx` (Sprint 5b.1 Block G — Layer 3 handoff modal. Department dropdown + 200-char preference notes; submit creates SpecialistHandoff record)
- `app/v2/members/[id]/capture-forms/insight-form.tsx` (Sprint 5b.1 Block E — Insight authoring form for both pre-fill paths)
- `app/v2/members/[id]/workstation-shell.tsx` (Sprint 5a.2 — client coordination layer. Hoists popup / dialpad / Track-selection state above the four sibling client components that need to share it. sessionStorage-persists Track selection per member_id. Sprint 5a.3 unified the CTA callback to `onCtaClick` for "+ next" / popup CTA / coach bullet CTA invocations)
- `lib/synthetic-data/{types,prng,branches-bankers,generator,filters}.ts` (Sprint 7a — synthetic dataset generator: 14 bankers, 28 branches, 216 synthetic Members, 100 closed deals, 90-day daily activity, aggregate metrics. Sprint 7a-patch §H added FIXTURE_OVERLAY constant to land hero metrics at 220 Members / ~55 insights/week.)
- `app/v2/insight-engine/page.tsx` (Sprint 7a — Insight Engine dashboard landing. Hero metrics strip + filter tag row + drill-down canvas + featured deal tile. URL state encodes filters; share-by-link.)
- `app/v2/insight-engine/dashboard/{components,views,hooks}/*.tsx` (Sprint 7a + 7a-patch — dashboard composition. HeroMetricsStrip, FilterTagRow, FeaturedDealTile, DashboardClient + four drill-down views: PhaseFunnelView · LendingProductMixView · GeographicMapView · BankerActivityHeatmapView. Per-Track 10-color treemap palette per Sprint 7a-patch follow-up.)
- `app/v2/insight-engine/dashboard/components/MemberLink.tsx` (Sprint 7a-patch §G — synthetic-Member → fixture routing helper. Member-Type-to-fixture-slug map; URL includes `representative_of` + `example_for` query params.)
- `app/_components/representative-example-banner.tsx` (Sprint 7a-patch §G — notation banner surfaced on fixture pages when the query params are present. Dismissible via sessionStorage.)
- `lib/db-path.ts` (Sprint 6 §D — SQLite path resolver. Local dev: pass through `DATABASE_URL`. Vercel: copy bundled `prisma/seed.db` to `/tmp/blaze.db` on cold start so reads + writes both succeed for the Lambda instance lifetime. Module-level cache short-circuits subsequent calls.)
- `prisma/seed.db` (Sprint 6 §C — committed SQLite snapshot. 999 KB. Ships with the Vercel deployment via `next.config.ts → outputFileTracingIncludes`. Refresh via `pnpm db:snapshot` before deploy.)
- `prisma/seed-artifact-templates.ts` (Sprint 5d Block B + Sprint 8 Block B/G — 10 ArtifactTemplate records seeded: TEMPLATE-001..008 (existing) + TEMPLATE-009 LOC smoothing (TRACK-001) + TEMPLATE-010 Vehicle financing (TRACK-002). Sprint 8's `seedFixtureMultiTrack` populates fixture multi-Track distribution: Cygnus → TRACK-008+003, Northland → TRACK-002+007, Jenny → TRACK-001+010, Riverside → TRACK-001. Backfilled `source_factor_id` on existing 7 templates per Block C.)
- Sprint 8 schema additions: `Member.active_track_ids Json?` (multi-Track fixtures; first entry is primary), `FactorCapture.capture_mode String @default("member_confirmed")` (member_confirmed | banker_estimate dichotomy). `ArtifactTemplate.parameter_schema` carries a `source_factor_id` JSON convention per parameter — the renderer overlays FactorCapture values for source-linked params; missing source-linked params surface as CTA cards (`app/v2/members/[id]/artifact-template-render.tsx`).
- `app/v2/members/[id]/artifact-visualizations/*.tsx` (Sprint 9 — 8 per-Track business-impact visualizations: LeaseVsOwnChart (TRACK-003), GrowthTrajectoryChart (TRACK-004), CashflowEquityDualChart (TRACK-006), CostOfDoingNothingChart (TRACK-007), Sba504StructureComparison (TRACK-008, paired with existing roadmap), PaceMonthlySavingsChart (TRACK-009), CashbackOpportunityChart (TRACK-010), UnsecuredOpportunityChart (TRACK-011). Each demonstrates before/after business effect rather than transaction summary. Shared palette + helpers in `shared.ts`. Dispatch via `StructuralContent.type` in `lib/artifact-template.ts`.)
- `vercel.json` (Sprint 6 §C — pins Next.js framework preset + install/build commands. Sister to `package.json` scripts.)
- `FIXTURE.md` (documents the Jenny's Catering seed data)

If a file appears in this repo that is not on this list, raise it. Document sprawl is a real failure mode and we are guarding against it.
