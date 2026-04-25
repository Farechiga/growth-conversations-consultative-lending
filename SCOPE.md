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
2. The three modules — Meeting recap, Member profile, Insight Engine — are all built and working against the seed fixture.
3. The Jenny's Catering fixture is fully populated and renders end-to-end without errors.
4. At least four additional supporting Members exist with enough data that Insight Engine views feel populated rather than empty.
5. A banker-identity dropdown lets the demo viewer switch between roles (primary banker, specialist, growth lead) and see the appropriate views.
6. The demo can be reset to its original seed state via a single admin action.
7. All banker-facing strings use the locked vocabulary from `CLAUDE.md` Section 5.
8. All seed reference entities (Member Type, Topics, Growth steps, Growth tracks, Artifact) have populated description fields per Semantic Discipline.
9. `BUILD_LOG.md` has a final entry summarizing the build and listing any deferred items.
10. `IMPLEMENTATION_STATUS.md` shows all in-scope items as verified.

---

## 3. In scope

### 3.1 Modules (three required surfaces)

**Meeting recap**
- Banker selects a Member, then either a suggested Growth track or the fallback path
- Growth track execution: presents each Growth step in sequence with its capture form
- Each Growth step's capture form matches the capture schema for its shape (Ask, Size, Show, Propose, Resolve, Connect)
- Real-time preview panel showing what records will be created on save
- Save commits one Conversation, all Growth step executions, and any produced Signals, ActionCards, Recommendations, Artifact share records
- Fallback path: simpler chip-tap form for unstructured debrief

**Member profile**
- Six bands: identity strip, active state summary, active signals, active proposals, open work, history
- Sidebar with private notes and forward signals
- Suggested next step pinned above the fold
- Read-mostly (no inline editing of Member fields)
- Member summary band uses the templated summary per Semantic Discipline §3.4

**Insight Engine**
- All six views: Signal volume and trend, Growth track performance, Artifact effectiveness, Indecision diagnostics, Forward pipeline, Coverage gaps
- Faceted filtering by Member Type, date range, banker, primary concern, outcome
- Privacy floor enforced (cell size ≥ 5 for cross-member views)

### 3.2 Data and fixtures

**Jenny's Catering — fully fleshed Member fixture**
- Complete Member record with description, Member Type assignment, products held
- Three or more historical Conversations with realistic Growth step executions
- Active and resolved Signals demonstrating each Signal type (goal, blocker, trigger, indecision)
- At least one ActionCard in each lifecycle state (open, in_progress, completed, declined)
- At least one Artifact shown and shared
- The complete worked-example arc from Module and Data Flow document §9 reproducible end-to-end

**One fully fleshed Member Type**
- Small Caterer · Starting
- Complete description per Semantic Discipline
- Characteristic blockers, triggers, goals, typical products populated

**One fully fleshed Growth track**
- "Smooth seasonal cash flow with LOC for small caterer"
- Four Growth steps (Ask → Size → Show → Resolve, or similar)
- Each Growth step has full description, content, capture schema, target Member Types

**One fully built Artifact**
- Seasonal cash flow smoothing chart
- Parameter schema accepting member-specific revenue band
- Renders as an actual interactive chart in the demo
- Compliance status set to approved

**Three to five supporting Members at lower fidelity**
- Different Member Types (e.g., a dental practice, a manufacturer, a contractor)
- Enough Signals and conversations to populate Insight Engine views
- Demonstrates that Jenny is not the only Member in the system

### 3.3 Reference data

- Member Types: Small Caterer · Starting (full), three to five others at minimum viable detail
- Topic taxonomy: blockers, triggers, goals, indecisions sufficient to support fixture data
- Industry Family: enough entries to cover the fixtures
- Product catalog: at minimum the products referenced by Jenny's fixture (LOC, Business Visa, Business Checking, etc.)
- Rules: enough rules to make Growth track suggestions surface correctly for the fixtures

### 3.4 Banker identity

- Dropdown to select banker identity (e.g., "Sarah Chen — Primary banker", "Marcus Webb — CRE specialist", "Priya Patel — Growth lead")
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
3. **Click "Run Growth track"** from Jenny's profile and execute the four-step seasonal cash flow track end-to-end. The Show step renders an actual chart parameterized with Jenny's data.
4. **Save the Meeting recap** and see the new Conversation, Signals, and ActionCards immediately reflect on Jenny's Member profile.
5. **Switch banker identity** to a CRE specialist and see only the ActionCards where they are the owner, plus Members with active handoffs to them.
6. **Switch banker identity** to the Growth lead and see (in the Insight Engine) the six analytical views populated with cross-member data.
7. **Open the Insight Engine** as any banker, filter by "Small Caterer · Starting", and see Jenny's Catering plus other supporting Members contributing to rolled-up patterns.
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
- Days 6-8: Meeting recap (the most interaction-dense surface; proves the flow)
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
