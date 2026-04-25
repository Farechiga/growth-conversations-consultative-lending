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

### Q-011 · Repo-root documents not listed in CLAUDE.md §12

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** Three markdown files now live at the project root that are not in the CLAUDE.md §12 document set: `AGENTS.md` (generated by the Next.js 16 scaffold — a short agent-instruction file warning that Next.js 16 has breaking changes from training data), `README.md` (generated by the scaffold — standard Next.js readme), and `BLAZE_STYLE_GUIDE.md` (authored by Francisco during this session — ~21 KB of visual identity content derived from the Blaze source PDF, including exact color hex values, typography, and component patterns). Should they be retained, and if so, where do they slot into §12's four-tier structure?
- **Why it matters:** CLAUDE.md §12 says "If a file appears in this repo that is not on this list, raise it. Document sprawl is a real failure mode and we are guarding against it." Silently accepting three unlisted files contradicts that discipline.
- **Affects:** Governance hygiene; no direct functional impact.
- **Conservative default for now:**
  - Keep all three files (they each carry real content — removing them would destroy scaffolded framework guidance or authored visual direction).
  - **Recommendation for §12 update (pending Francisco's approval):** promote `BLAZE_STYLE_GUIDE.md` to Tier 2 alongside the design docs (it is authoritative for all UI work); add `AGENTS.md` to Tier 1 (framework agent-rules, loaded automatically by Claude Code's `@AGENTS.md` import convention from the scaffold's `CLAUDE.md` pattern); add `README.md` to a new "conventional / framework-generated" row or accept it as a standard artifact not requiring explicit listing.
- **Status:** Open. Requires Francisco's tiering decision before CLAUDE.md §12 is edited.

### Q-012 · Prisma 7 generator output location

- **Date logged:** 2026-04-24 (scaffold session)
- **Question:** Prisma 7's `prisma init` now defaults to generating the client into `../app/generated/prisma` (a new convention — previously `node_modules/.prisma/client`). This puts generated code *inside* Next.js's `app/` route directory. Should we keep this default, relocate it to `lib/generated/prisma` (outside the app routing tree), or restore the old `node_modules/.prisma/client` path?
- **Why it matters:** Generator output inside `app/` can theoretically be picked up by the App Router's file-routing scan and cause weirdness, though in practice the directory name `generated/` is ignored by Next.js. It is also a cognitive-load question — having generated artifacts next to route files is visually noisy.
- **Affects:** Ergonomics of code navigation; very minor runtime risk.
- **Conservative default:** Keep the Prisma 7 scaffolded default (`app/generated/prisma`) for now. It is gitignored. Revisit if Next.js picks it up as routes, or if imports feel awkward.
- **Status:** Open. Low priority; resolve naturally the first time we import the client.

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
