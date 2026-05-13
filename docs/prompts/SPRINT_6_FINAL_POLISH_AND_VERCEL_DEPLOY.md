# Sprint 6 — Final Polish and Vercel Production Deploy

**Prompt for Claude Code. Single checkpoint. Final polish across surfaces. Vercel production deployment with SQLite. DEMO_RUNBOOK creation. EVP demo readiness. Estimated 1.5-2 effective build days CC time.**

## Pre-flight context

Sprint 7a + 7a-patch shipped the EVP-facing dashboard with 4 drill-down views, hero metrics, featured deal tile, synthetic Member routing, and calibrated metrics. Visual review confirmed dashboard is EVP-presentable.

Sprint 6 is the final sprint before EVP demo. Three responsibilities:

1. Surface polish sweep across all touchpoints
2. Vercel production deployment with SQLite (read-only persistence constraint)
3. DEMO_RUNBOOK creation with suggested narrative arc for EVP demo

After Sprint 6 ships, the build is demo-ready. Francisco rehearses. Demo proceeds.

Sprint 7b (remaining 5 drill-down views + Sankey custom SVG + Member-Type matrix) ships AFTER Sprint 6 if time allows before demo, or after demo as enhancement.

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level)
2. `ARCHITECTURE_V2.md`
3. `BUILD_LOG.md` — recent sprint entries provide full context
4. `OPEN_QUESTIONS.md` — known deferred items
5. Dashboard implementation: `app/v2/insight-engine/`

**Approved decisions (already locked through earlier conversation):**

- Hosting target: Vercel with default `*.vercel.app` URL (no custom domain)
- Database: SQLite (accepting read-only persistence constraint at runtime)
- Live insight authoring: shows success in UI during demo session; doesn't persist between requests (acceptable for read-heavy EVP demo)
- Sprint 7b scope deferred to post-demo enhancement

## What ships in this sprint (6)

Six blocks across three phases. Single checkpoint.

**Phase 1 — Demo polish:**
- **Block A — Per-fixture narrative verification.**
- **Block B — Surface polish sweep across remaining touchpoints.**

**Phase 2 — Production readiness:**
- **Block C — Vercel deployment configuration.**
- **Block D — SQLite production deployment + seed verification.**

**Phase 3 — Governance + demo prep:**
- **Block E — DEMO_RUNBOOK creation.**
- **Block F — Governance updates.**

Sprint 6 does NOT ship: any architectural work; any new features; any Pattern library changes; any Coach content changes; Sprint 7b drill-down views. Polish + deploy + runbook only.

---

## Block A — Per-fixture narrative verification

### A.1 Goal

Walk through each fixture's full narrative arc and verify content consistency. The build has been through many iterations; small inconsistencies may have accumulated. Demo quality depends on each fixture reading coherently from Discover through Navigate.

### A.2 Per-fixture walk-through checklist

**Jenny's Catering (event_services, TRACK-001 Working Capital LOC):**
- Discover: cashflow seasonality story — slow Jan-Feb, strong Dec, corporate clients pay 60+ days
- Measure: $48K/quarter slow-season gap, 32% seasonal variance, customer concentration captured
- Consult: $75K LOC sized, smoothing chart shown, "leaning yes / spouse pending" Reaction
- Navigate: household decision pending, joint conversation scheduled
- Member-Type tag: "Event services"
- Track ranking: TRACK-001 first

**Northland HVAC (maintenance_services, TRACK-002 Business Vehicle Loan):**
- Discover: truck breakdown trigger, "I came in for my own truck but maybe what I really need is to think about the whole fleet"
- Measure: 88% capacity utilization, demand exceeding capacity, equipment aging confirmed, $180K fleet target
- Consult: ROI projection with sensitivity ranges, "leaning yes" with CPA-pending Reaction
- Navigate: CPA coordination in progress
- Member-Type tag: "Maintenance services"
- Track ranking: TRACK-002 first

**Cygnus Bioscience (specialty_manufacturer, TRACK-008 SBA 504):**
- Discover: anchor customer growth signals, owner-occupancy confirmed, capacity at 85%
- Measure: $4M-$7M CRE need sized, employee count band captured, capacity utilization
- Consult: SBA 504 50/40/10 structure shown, "leaning yes" with board-pending Reaction
- Navigate: specialist handoff in motion (James Patterson SBA spec; Diana Reyes CDC partner)
- Member-Type tag: "Specialty manufacturer"
- Track ranking: TRACK-008 first

**Riverside Catering (event_services, TRACK-001, stage-skipping):**
- Stage-skipping: Consult-phase Model exists without Discover required evidence captured
- Visible on Stage-skip portfolio surface
- Member-Type tag: "Event services"

### A.3 Verification per fixture

For each fixture, verify:

- All required evidence per phase captured per Track template
- Captured evidence dates fall within compressed timeline (Sprint 5e Block D)
- Member quotes are concrete and Member-Type-appropriate
- Insights authored match Member's situation (not generic)
- Reactions reflect realistic banker-Member exchange
- Artifacts attached are appropriate for Track and Member-Type
- Coach surface displays appropriate Member-Type-specific content
- Insight Engine drill-downs include this fixture correctly when filtered

### A.4 Inconsistency fixes

If verification surfaces inconsistencies, document and fix. Common categories:

- Capture date out of sequence (Discover after Measure, etc.)
- Member-Type tag mismatched with content
- Track context inconsistency (e.g., Goal labeled Working Capital LOC but Track context shows Business Vehicle Loan)
- Insight content references wrong Member or wrong Track
- Synthetic Member representative example routing — verify the mapping (per Sprint 7a-patch Block G) feels representative for each Member-Type

### A.5 Acceptance criteria

- [ ] All four fixtures verified per checklist
- [ ] Inconsistencies documented and fixed
- [ ] Visual probe confirms each fixture's narrative arc reads coherently
- [ ] Track ranking outputs match expected primary Track per fixture
- [ ] Coach surface renders correct Member-Type content for each fixture
- [ ] Each fixture appears correctly in Insight Engine dashboard drill-downs

---

## Block B — Surface polish sweep

### B.1 Polish areas

Walk through these surfaces and apply polish where small issues remain:

**Insight Engine dashboard:**
- Verify all 6 hero metrics render correctly with calibrated values
- Verify sparklines render for 3 metrics with sparklines
- Verify pipeline value face/weighted toggle works
- Verify all 4 visualization filter tags toggle correctly
- Verify URL state encoding/decoding works
- Verify "Conversations that became deals" tile rotates and shows Pattern content
- Verify all drill-downs (phase funnel, lending product mix, geographic, banker activity) drill to Member lists
- Verify synthetic Member → fixture routing with representative example banner
- Verify representative example banner dismissible

**Sidebar:**
- Verify all section labels match Sprint 5d Section 6 rewrites
- Verify spacing and alignment
- Verify "see all N lending products" expand works correctly

**Capture form modals:**
- Verify all six forms render copy from Sprint 5d Section 3
- Verify form validation works (required fields enforced; submit disabled if invalid)
- Verify forms close cleanly on cancel
- Verify factor input rendering correct for each factor type (Sprint 5e Block E)

**Coach surface:**
- Verify Member-Type-specific content renders for each fixture
- Verify CTA-eligible bullets navigate to correct forms with correct pre-selection
- Verify "show ?" affordance toggles correctly

**Artifact rendering:**
- Verify all 8 ArtifactTemplate types render correctly with sample parameters
- Verify SBA 504 roadmap displays "Cygnus is here" marker on correct stage
- Verify "Mark as shared with Member" updates timestamp without creating duplicate

**Popup-as-workflow:**
- Verify scroll behavior with expanded "See all related insights"
- Verify mouseover metadata works on all row types
- Verify Growth Insights light grey background renders
- Verify factor rows display correctly (capacity utilization 88% visible, not collapsed)

**Existing 4-tab portfolio surfaces (deprecated but still functional):**
- Verify they still render correctly
- Verify navigation between them works
- Note: Sprint 7b will fully deprecate these; preserve for now

**Header / nav:**
- Verify Member name + Member-Type render correctly
- Verify Track context dropdown shows all candidates
- Verify breadcrumb navigation if present

### B.2 Polish discipline

This is a sweep, not a redesign. If something feels wrong but is not clearly broken, document in BUILD_LOG and proceed. Sprint 6 ships.

### B.3 Acceptance criteria

- [ ] All listed surfaces walked through
- [ ] Visible polish issues fixed
- [ ] Anything not fixed documented in BUILD_LOG with rationale
- [ ] No regression to surface behavior during polish

---

## Block C — Vercel deployment configuration

### C.1 Vercel setup

Connect GitHub repo to Vercel:
- Vercel project linked to `github.com/Farechiga/blaze-member-signals-demo`
- Production branch: `main` (or whichever branch represents the production state)
- Build command: `pnpm exec next build`
- Output directory: `.next` (Next.js default)
- Install command: `pnpm install`
- Node version: align with current build (likely Node 20)

### C.2 Environment variables

Set production environment variables in Vercel project settings:

- `ANTHROPIC_API_KEY` — for live LLM matching (Sprint 5b.1 architecture)
- `DATABASE_URL` — points to SQLite file (see Block D)
- `NEXT_PUBLIC_*` variables as needed
- Any other env vars in current `.env`

### C.3 SQLite read-only constraint handling

Vercel runtime is read-only for the deployed filesystem. SQLite handling:

**Option 1 — SQLite file in build artifact (recommended):**
- `dev.db` (or `prod.db`) included in repo
- Seed data baked into the database file at build time
- Prisma reads from this file at runtime
- New writes (e.g., banker authoring an insight live) succeed in-memory or `/tmp` but don't persist

**Option 2 — In-memory SQLite at startup:**
- SQLite created in-memory on cold start
- Seed runs at startup
- Faster cold start; same read-only effective behavior

Choose Option 1 for predictability. Document choice in BUILD_LOG.

### C.4 Build verification

- `pnpm exec next build` produces clean production build locally
- No console warnings during build
- Bundle size reasonable (no unexpected bloat)
- All routes resolve at build time

### C.5 Acceptance criteria

- [ ] Vercel project connected to GitHub repo
- [ ] Environment variables configured in Vercel
- [ ] SQLite file present in build with seed data
- [ ] First deployment succeeds
- [ ] Deployment URL accessible: `https://[project-name].vercel.app`
- [ ] All routes return HTTP 200 in production
- [ ] HTTPS works correctly

---

## Block D — SQLite production deployment + seed verification

### D.1 Production seed verification

After deployment, verify production data state:

**Fixtures:**
- Jenny's Catering, Northland HVAC, Cygnus Bioscience, Riverside Catering all present
- All captures, factors, insights, reactions, models seeded
- Workflow states recomputed correctly
- ArtifactTemplates loaded with correct content (8 templates)

**Synthetic dataset:**
- 216 synthetic Members loaded
- 14 bankers, 28 branches loaded
- 100 closed deals loaded
- Daily activity stream loaded
- Aggregate metrics computed correctly

**Hero metrics:**
- Pipeline value: ~$147.5M face / ~$55.5M weighted
- Members in cultivation: 220
- Conversations this week: ~71
- Insights this week: ~51 (target band 48-55)
- Avg Discover → Navigate: ~75 days
- Closed last 12 months: ~$73.8M

### D.2 Live LLM matching verification

Test that ANTHROPIC_API_KEY works in production:
- Navigate to a fixture growth conversation page
- Open + Insight form
- Author a brief observation (e.g., "Testing matching")
- Submit
- Verify LLM matching returns within ~5 seconds
- Verify match-or-novel determination works
- Note: insight may not persist between requests due to SQLite read-only constraint, but the match should complete successfully and surface in UI for the current session

### D.3 Read-only constraint UX

When banker authors an insight (or any write operation) during demo:
- UI shows success message ("Insight saved")
- Insight surfaces in popup for current session
- Note: refresh page → insight disappears (this is acceptable for read-heavy demo)

If demo flow requires showing "look, this insight persists," consider an alternative narrative beat (e.g., point to pre-seeded insights instead of authoring live).

### D.4 Acceptance criteria

- [ ] All 4 fixtures present and rendering correctly in production
- [ ] All 216 synthetic Members loaded
- [ ] Hero metrics match design specs (within tolerance)
- [ ] Live LLM matching works in production
- [ ] Write operations succeed for current session (acknowledged read-only limitation)
- [ ] Production URL stable; multiple test page loads succeed

---

## Block E — DEMO_RUNBOOK creation

### E.1 Create DEMO_RUNBOOK.md at repo root

Content structure:

**Section 1 — Pre-demo checklist:**
- Production deployment URL
- ANTHROPIC_API_KEY verification step
- Test data verification (4 fixtures + 216 synthetic Members)
- Browser tab setup (suggest 3-4 tabs pre-loaded for fast navigation)
- Backup plan if API outage

**Section 2 — Recommended demo narrative arc:**

Suggested flow lasting ~25-30 minutes (adjust to EVP's available time):

**Opening (3-5 min):**
- Open at `/v2/insight-engine` (dashboard)
- "Member Signals captures consultative banking conversations at portfolio scale."
- Walk hero metrics: "$147M active pipeline across 220 Members, 14 bankers, 28 branches."
- Mention that this is what 90 days of architecture looks like in practice.

**Architecture thesis (3-5 min):**
- Click "Lending product mix" tag
- "Here's where the cultivation work is concentrating across our 10 Tracks."
- Point out SBA 504 + CRE = 81% of pipeline value despite being 27% of Members
- Point out future-expansion Tracks (TRACK-001 LOC, TRACK-004 SBA 7(a)) visible at the same scale as Blaze-active offerings
- "These are pathways where bankers are doing the consultative work; the architecture demonstrates pipeline value even on products Blaze doesn't yet offer."

**Geographic + banker activity (3-5 min):**
- Click "Geographic" tag
- Show three-region grouping (Twin Cities Metro 20 branches + Northern MN 6 + Southern MN 2)
- Click a high-activity branch (e.g., Edina) to drill into Members
- Click "Banker activity" tag
- Show 14-banker heatmap; point out high-activity bankers (Sarah Chen, Marcus Johansson, Scott)
- Click a specific cell to show "Accounts touched that day"

**Deep dive — Cygnus (8-10 min):**
- Click into Cygnus Bioscience (representative manufacturer; SBA 504)
- Walk Discover → Measure → Consult → Navigate
- Show the captured Trigger ("we're going to need to make a big decision...")
- Show insights authored along the way (PATTERN-017 reframe, etc.)
- Show SBA 504 roadmap artifact with "Cygnus is here" marker on stage 3
- Demonstrate Coach surface for specialty_manufacturer Member-Type

**Live insight authoring (3-5 min):**
- During Cygnus or Northland walkthrough, open + Insight form
- Author a banker observation in real time
- Submit
- Show LLM matching live (match-or-novel determination returns)
- Briefly mention: the architecture catches novel insights for senior-lender review; matched insights save to library

**Closing — Conversations that became deals (2-3 min):**
- Click "Conversations that became deals" tile
- Walk through one of the 5 featured deals (Cygnus SBA 504 close, $3.2M, 187 days)
- Point out: captured insights drove the conversation; the architecture made it traceable

**Q&A (rest of time)**

**Section 3 — Talking points:**

For when EVP asks:
- "What does this scale to?": Pilot would scale linearly; architecture handles 1000+ Members per banker
- "How does this integrate with our existing lending decisioning system?": Member Signals captures consultative reasoning during conversation. Lending decisions and formal underwriting occur in the lending decisioning system. The architectures are complementary.
- "How does data get into this?": Bankers capture during conversations via the surfaces shown (+ Ask, + Quantify, + Insight, etc.). No batch import needed.
- "What's the ROI signal?": The architecture surfaces $147M active pipeline with attributed conversations. The "Conversations that became deals" tile shows specific deal attribution.

**Section 4 — Backup plans:**
- If LLM API unavailable: insights save as novel state with graceful fallback message; demo continues
- If specific surface fails: pivot to working surfaces; have 4 fixtures pre-loaded for quick navigation
- If demo dataset fails to load: re-seed runs cleanly; have local instance as backup

### E.2 Acceptance criteria

- [ ] DEMO_RUNBOOK.md created at repo root
- [ ] All four sections complete
- [ ] Talking points use approved framing from CONTENT_REWRITE_v1.md
- [ ] Backup plans listed
- [ ] Production URL documented in pre-demo checklist

---

## Block F — Governance updates

### F.1 BUILD_LOG final entry

Sprint 6 entry covering:
- Per-fixture narrative verification completed
- Surface polish sweep
- Vercel production deployment
- SQLite read-only constraint handling
- DEMO_RUNBOOK.md created

Cross-reference all sprint entries for the build's full history.

### F.2 OPEN_QUESTIONS final state

Verify all questions logged through the build. Items deferred to Pilot:

- Q-A2 (open-thread tiebreaker) — partial resolution; Pilot extends
- Q-B1 (CTA layer expansion at scale)
- Q-B2 (LLM matching reliability at scale)
- Q-B3 (Pattern library size bounds)
- Q-C1 (RBAC for portfolio surfaces)
- Q-C2 (Recapture audit trail)
- Q-D1 (Track display ordering when Blaze expands)
- Q-D2 (PACE customer fit at Pilot scale)
- Q-E1 (Track-aware factor filtering)
- Q-E2 (Coach catering content shift when Blaze expands)
- Q-F1 (Synthetic data persistence)
- Q-F2 (Mobile dashboard rendering)
- Q-F3 (Existing 4-tab routes deprecation)
- Q-F4 (Geographic spatial visualization deferred)
- Q-F5 (Temporal momentum dropped)
- Q-F6 (Representative example notation for synthetic Members)

Add Q-F7: "SQLite read-only persistence on Vercel runtime. Pilot may want Postgres for production write persistence."

### F.3 Architectural notes for Pilot

Notes 1-17 logged across sprints. Add for Sprint 6:

- Note 18 — Vercel deployment with SQLite read-only constraint. Production live demo accepts that writes don't persist between requests. Pilot needs Postgres for production write persistence and real-time data evolution.

### F.4 CLAUDE.md final state

Manifest reflects all canonical docs at repo root and code locations from build:

- Add DEMO_RUNBOOK.md to manifest
- Confirm all synthetic data stages listed
- Confirm dashboard route documented

### F.5 Acceptance criteria

- [ ] BUILD_LOG final entry comprehensive
- [ ] DEMO_RUNBOOK.md created at repo root
- [ ] OPEN_QUESTIONS.md reflects final state with all Pilot deferrals
- [ ] Note 18 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest current

---

## Reporting back

When Sprint 6 is complete, report back with:

1. Confirmation that Blocks A-F shipped per acceptance criteria
2. Production deployment URL
3. Verification that production URL is accessible
4. Live LLM matching test in production (author one insight; verify match returns)
5. Visual probes on production:
   - Cygnus Discover popup with scroll behavior verified
   - Northland Measure popup with 3 distinct factor rows
   - Dashboard hero metrics match design specs
   - All 4 visualization views render in production
   - Synthetic Member → fixture routing works in production
   - SBA 504 roadmap renders for Cygnus
6. DEMO_RUNBOOK.md preview for Francisco's review
7. Any deviations from spec with rationale

---

## Estimated scope

1.5-2 effective build days CC time.

Largest blocks:
- **Block A (per-fixture narrative verification)** — careful walkthrough of 4 fixtures × 4 phases each; ~0.5 day CC
- **Block C (Vercel deployment configuration)** — depends on first-time setup complexity; ~0.5 day CC
- **Block D (SQLite production deployment + seed verification)** — production testing + write-flow verification; ~0.25-0.5 day CC
- **Block E (DEMO_RUNBOOK creation)** — substantive documentation; ~0.25-0.5 day CC

Smaller blocks (B, F) are routine.

After Sprint 6 ships and visual review confirms (production deployment accessible, runbook ready, polish sweep clean), the build is EVP demo-ready. Francisco rehearses on production URL. Demo proceeds.
