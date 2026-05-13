# SCOPE.md

**The contract for what the demo includes and excludes. Any change to scope updates this file in the same commit.**

---

## 1. Purpose of the demo

A standalone, browser-accessible web app that demonstrates the Blaze Member Signals system to the EVP of Lending and other Blaze stakeholders. The demo's job is to make the design tangible — to let stakeholders click through the three banker-facing surfaces with realistic populated data and see how the system would feel in actual use.

The demo is **not** a pilot, not production, and not connected to any real Blaze systems. It is a showpiece designed to support a procurement and design-validation conversation.

---

## 2. Definition of done

The demo phase is complete when **all** of the following are true:

1. A deployed URL exists (Vercel) that any invited Blaze stakeholder can visit in a browser.
2. The three modules — Growth Conversations, Member profile, Insight Engine — are all built and working against the seed fixture.
3. **Three full-fidelity Members**, one per growth stage, are fully populated and render end-to-end without errors:
   - **Jenny's Catering** — Small Caterer · Starting (canonical; already designed)
   - **An HVAC company** — Trades & Construction · Growing (design brief pending from Francisco before fixture authoring)
   - **A biotech component manufacturer** — Manufacturing · Established (design brief pending from Francisco before fixture authoring)
4. Because the three full-fidelity Members span three stages, Insight Engine views are populated enough to read as real (not empty). Additional low-fidelity supporting Members are out of scope unless time permits at the end (see §3.2).
5. A banker-identity dropdown lets the demo viewer switch between roles (primary banker, specialist, growth lead) and see the appropriate views.
6. The demo can be reset to its original seed state via a single admin action.
7. All banker-facing strings use the locked vocabulary from `CLAUDE.md` Section 5.
8. All seed reference entities (Member Type, Topics, Growth steps, Growth tracks, Artifact) have populated description fields per Semantic Discipline.
9. `BUILD_LOG.md` has a final entry summarizing the build and listing any deferred items.
10. `IMPLEMENTATION_STATUS.md` shows all in-scope items as verified.

---

## 3. In scope

### 3.1 Modules (post-Sprint 4.7)

**v2 Member workstation** *(Sprint 4.7 → 4.7.2 — primary banker-facing surface)*
- Single page per Member at `/v2/members/[id]`. Replaces the v1 split between Member profile + Growth Conversations per ARCHITECTURE_V2 §7
- Two-layer model: persistent **objectives** (Discover · Measure · Consult · Navigate) × situational **activities** (+ Ask, + Quantify, + Model, + Reaction, + Action)
- Sticky activity dialpad surfaces capture forms in right-drawers; objectives surface accumulated evidence in the sidebar via dot vocabulary (filled / outlined / faint / accented)
- Captured feed renders six card variants recent-first across all activity types; primary tag is the substantive type (Goal/Blocker/etc. for Ask; Sized/Model/Shown/Reaction/Resolution for the others)
- + Reaction form subsumes v1 Resolve's response-value + member-quote + primary-concern (contextual taxonomy per COMPLIANCE.md §6.3)
- ShowEvents fire two ways: auto-created on + Model save with "with Member" provenance, OR explicitly via "Record show" button on the sidebar artifact preview dialog
- Compliance disclaimer banner + capture-discipline footer reused from Sprint 4.6; submit-time keyword scan fires on all banker-prose fields
- Click-in-place navigation discipline: no clicks on the workstation result in page navigation away

**v1 Member profile + Growth Conversations** *(legacy; retained for cohabitation during build)*
- Original v1 routes (`/members/[id]`, `/growth-conversations/[memberId]`) remain reachable
- Q-X1 — opt-in cross-link to v2 via `?v2=true` query param during build phase; default flips at Sprint 6 for EVP demo
- All v1 capture forms still functional; v2 dialpad reuses AskSection / SizeSection / ResolveSection components in drawer wrappers

**Insight Engine**
- All six views: Signal volume and trend, Growth track performance, Artifact effectiveness, Indecision diagnostics, Forward pipeline, Coverage gaps
- Faceted filtering by Member Type, date range, banker, primary concern, outcome
- Privacy floor enforced (cell size ≥ 5 for cross-member views)

### 3.2 Data and fixtures

The demo ships with **three full-fidelity Members**, one per growth stage. Each carries the complete data set listed under "Per-Member deliverables" below. Low-fidelity supporting Members are deferred to a stretch item (§3.2 bottom).

**Member 1 — Jenny's Catering · Small Caterer · Starting** *(canonical; designed)*
- Growth stage: Starting
- Member Type: Small Caterer · Starting
- Primary Growth track: "Smooth seasonal cash flow with LOC for small caterer"
- Artifact: seasonal cash flow smoothing chart
- Worked-example arc from Module and Data Flow §9 reproducible end-to-end

**Member 2 — HVAC company · Trades & Construction · Growing** *(design brief pending)*
- Growth stage: Growing
- Member Type: Trades & Construction · Growing (to be designed with Francisco before fixture authoring)
- Primary Growth track: TBD from design brief
- Artifact: TBD from design brief
- Conversation history: TBD from design brief
- **Do not author fixture data for this Member until the design brief arrives.**

**Member 3 — Biotech component manufacturer · Manufacturing · Established** *(design brief pending)*
- Growth stage: Established
- Member Type: Manufacturing · Established (to be designed with Francisco before fixture authoring)
- Primary Growth track: TBD from design brief
- Artifact: TBD from design brief
- Conversation history: TBD from design brief
- **Do not author fixture data for this Member until the design brief arrives.**

**Per-Member deliverables** (applies to each of the three above)
- Complete Member record with description, Member Type assignment, products held
- Three or more historical Conversations with realistic Growth step executions appropriate to the Member's stage
- Active and resolved Signals demonstrating each Signal type (goal, blocker, trigger, indecision)
- At least one ActionCard in each lifecycle state (open, in_progress, completed, declined) across the three Members combined — not necessarily all four per Member
- At least one Artifact shown and shared
- Member Type fully described per Semantic Discipline (characteristic blockers, triggers, goals, typical products)
- At least one fully authored Growth track with full Growth steps (description, content, capture schema, target Member Types)
- Artifact carries parameter schema, renders as a real interactive chart, compliance status approved

**Stretch (only if time permits at end of build):** two to three low-fidelity supporting Members in additional Member Types, to further populate the Insight Engine's cross-member views. **Default assumption: do not build these.** The three full-fidelity Members across three growth stages should give the Insight Engine enough volume to read as real.

### 3.3 Reference data

- **Member Types** (three, all at full fidelity):
  - Small Caterer · Starting (for Jenny's Catering)
  - Trades & Construction · Growing (for the HVAC company; design pending)
  - Manufacturing · Established (for the biotech component manufacturer; design pending)
- **Topic taxonomy:** blockers, triggers, goals, indecisions sufficient to support the three Members' fixture data
- **Industry Family:** three entries covering Food & Beverage, Trades & Construction, and Manufacturing, plus any parent taxonomy needed
- **Product catalog:** at minimum the products referenced by the three Members' fixtures (LOC, Business Visa, Business Checking, and whichever larger-ticket products show up in Growing and Established tracks — equipment loan, treasury services, etc., per design briefs)
- **Rules:** enough rules to make Growth track suggestions surface correctly for each of the three Members

### 3.4 Banker identity

- Dropdown to select banker identity: "Scott Brynjolffson — Primary banker", "Marcus Webb — CRE specialist", "Priya Patel — Growth lead" (per Q-006 resolution)
- Switching identity changes what the user sees (e.g., specialist sees only their own ActionCards plus Members where they have active handoffs)
- No real authentication; selection persists in the browser session only

### 3.5 Demo administration

- A `/admin` route or similar that lets the demo viewer reset all data to the seed state with one click
- A simple inspection view showing the underlying data model (useful for stakeholder Q&A about how data is structured)

---

## 4. Out of scope

These are explicitly excluded from the demo. If a request comes in to add any of these, log to `OPEN_QUESTIONS.md` rather than building.

### 4.1 Integrations
- HubSpot UI Extensions
- HubSpot Custom Objects
- HubSpot CRM API calls of any kind
- Core system integration (Symitar, Jack Henry, etc.)
- SFTP file ingest
- LOS integration
- Email or SMS sending
- Calendar integration

### 4.2 Identity and security
- Real authentication (Auth.js, Clerk, etc.)
- SSO of any kind
- Password storage
- Session tokens
- Role-based access control beyond the simple dropdown
- Audit log surfacing in UI (the design captures provenance; the demo doesn't display it)

### 4.3 Production capabilities
- Real-time updates or websockets
- Multi-tenancy
- Multi-user concurrency
- Data export
- Backup/restore beyond the seed reset
- Error reporting to external services
- Analytics or telemetry

### 4.4 Advanced features
- LLM-generated summaries (templated summaries only per Semantic Discipline)
- Vector embeddings or semantic search
- Natural-language querying of the Insight Engine
- Voice input
- Mobile-specific UI (responsive design is fine; native mobile is not)
- PWA installation
- Offline support
- Email digest of weekly insights
- Automated content generation for Growth steps or Artifacts

### 4.5 Operational features
- Performance monitoring
- A/B testing infrastructure
- Feature flags
- Internationalization
- Accessibility audit (basic semantic HTML is fine; WCAG compliance audit is not)
- Comprehensive test coverage (a smoke test that the fixture loads is sufficient)
- CI/CD pipeline beyond Vercel's default

### 4.6 Scope deferrals from prior conversations
- Off-meeting contribution feed (the AmCham-style 250-char stream)
- Household relationship graph
- Forward-horizon Signal field as first-class
- Event sourcing as primary storage
- Sandboxed extension model
- Banker-facing exposure of step_shape labels

---

## 5. Acceptance tests

A demo viewer (the EVP, a banker, a stakeholder) should be able to:

1. **Open the demo URL** and immediately see a banker dashboard with a list of recent conversations and pending work for the default banker identity.
2. **Click into Jenny's Catering** and see a complete Member profile with all six bands populated, including active signals with magnitude data ("$12K quarterly impact"), the active proposal, the open de-risking ActionCard, and a history of conversations.
3. **Click "Run Growth track"** from Jenny's profile and enter the Growth Conversations module (single scrolling page with all stages visible, anchor progress bar, stage-by-stage save). Capture content through the Ask · Size · Show · Resolve sequence with the Show step rendering the seasonal smoothing chart parameterized with Jenny's data.
4. **Save Growth Conversations** stage-by-stage (or via the final review screen) and see the new Conversation, GrowthStepExecutions, Signals, ActionCards, and Recommendation immediately reflect on Jenny's Member profile.
5. **Switch banker identity** to a CRE specialist and see only the ActionCards where they are the owner, plus Members with active handoffs to them.
6. **Switch banker identity** to the Growth lead and see (in the Insight Engine) the six analytical views populated with cross-member data.
7. **Open the Insight Engine** as any banker, filter by Member Type or growth stage, and see the three full-fidelity Members (Jenny's Catering, the HVAC company, the biotech manufacturer) contributing to rolled-up patterns across stages.
8. **Click any Member Type, Topic, Growth track, or Growth step** and see a tooltip or detail view showing its description (per Semantic Discipline).
9. **Reset the demo** via the admin route and have all data return to the seed state.
10. **Refresh the browser** and see all state preserved (banker identity selection persists; data does not get reset by refresh).

If all ten of these work end-to-end without errors, the demo is shippable.

---

## 6. Time and effort budget

Target: **two weeks of focused build time** using Claude Code, assuming the data framework holds up cleanly under implementation pressure.

If the build runs materially over budget (e.g., approaching three weeks), pause and reassess. Likely causes: scope creep (most common), data model issues surfaced during build (legitimate; resolve via `OPEN_QUESTIONS.md`), or stack/library friction (resolve by simplifying, not by switching stack).

Time budget breakdown (approximate):
- Days 1-2: Project scaffolding, Prisma schema, basic seed data
- Days 3-5: Member profile (the most data-touching surface; proves the model)
- Days 6-8: Growth Conversations (the most interaction-dense surface; proves the flow) — note: Sprint 4 in DEMO_BUILD_PLAN.md v2 expanded this to 6-8 days as a single sprint
- Days 9-11: Insight Engine (the most aggregation-heavy surface; proves the rollup logic)
- Days 12-14: Polish, additional fixture content, deployment, demo walkthrough validation

---

## 7. Scope changes

This document is updated whenever scope changes. Per the Two-File Rule, scope changes require:

1. Update to this `SCOPE.md` describing what changed and why
2. Entry in `BUILD_LOG.md` noting the change
3. Update to `IMPLEMENTATION_STATUS.md` if any in-scope items are added or removed
4. If the change affects design substance, an entry in `OPEN_QUESTIONS.md` to document the resolved decision

Scope changes that **add** capabilities require explicit human approval. Scope changes that **remove** capabilities can be proposed by Claude Code in a session-end log entry, then approved or rejected by the human at the start of the next session.
