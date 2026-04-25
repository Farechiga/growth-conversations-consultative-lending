# CLAUDE.md

**The prime contract for this project. Read this at the start of every session.**

You are Claude Code working on the Blaze Member Signals demo. This document is the session contract: it defines the hard rules, the tech stack, the naming conventions, the forbidden patterns, the session ritual, and pointers to the design documents that are authoritative for what gets built.

If a question arises that this document does not answer, check the four design documents (Tier 2 below). If they do not answer it, log it to `OPEN_QUESTIONS.md` and proceed with the most conservative reasonable default. **Never silently guess on substantive design decisions.**

---

## 1. What this project is

A standalone web demo of the Blaze Member Signals system, built to support an EVP-of-Lending follow-up at Blaze Credit Union. The demo shows three banker-facing surfaces (Meeting recap, Member profile, Insight Engine) running against a populated fixture (Jenny's Catering plus supporting Members) so the EVP can see the design in operation.

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
- **Meeting recap** — not Onboarding & Routing, Debrief, Capture
- **Member profile** — not Member Dashboard, Account view, Member page
- **Insight Engine** — not Patterns, Trends, Analytics

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

**Tier 2 — Reference design (consult when relevant)**
- `docs/design/01_Overview.docx`
- `docs/design/02_Semantic_Discipline.docx`
- `docs/design/03_Data_Framework.docx`
- `docs/design/04_Module_and_Data_Flow.docx`
- `docs/design/MEMBER_FIXTURE_BRIEF.md` (consult during fixture authoring)
- `BLAZE_STYLE_GUIDE.md` (consult before any UI work)

**Tier 3 — Living progress trackers**
- `BUILD_LOG.md` (append-only chronological log)
- `IMPLEMENTATION_STATUS.md` (verified-complete checklist)
- `SCOPE.md` (in/out scope contract)

**Tier 4 — Generated and synced**
- `prisma/schema.prisma` (single source of truth for table/column names)
- `FIXTURE.md` (documents the Jenny's Catering seed data)

If a file appears in this repo that is not on this list, raise it. Document sprawl is a real failure mode and we are guarding against it.
