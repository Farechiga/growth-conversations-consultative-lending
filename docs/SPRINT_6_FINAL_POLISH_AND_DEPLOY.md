# Sprint 6 — Final Polish and EVP Demo Deploy

**Prompt for Claude Code. Single checkpoint. Final polish across surfaces. Three Sprint 5e v2 carryover items. Demo dataset cleanup. Production deployment configuration. EVP demo readiness. Estimated 2-3 effective build days CC time.**

## Pre-flight context

Sprint 5e v2 shipped visual density cleanup and Pattern surfacing expand affordance. Visual review surfaced three small carryover items: popup max-height scroll bug, Growth Insights breakout background differentiation, and verifying the expand affordance works within scrolled popups.

Sprint 6 is the final sprint before EVP demo. Three responsibilities:

1. Carryover items from Sprint 5e v2 visual review
2. Demo dataset polish (data verification, narrative consistency)
3. Production deployment configuration and EVP demo readiness

After Sprint 6 ships and visual review confirms, the build is demo-ready.

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level)
2. `ARCHITECTURE_V2.md`
3. `BUILD_LOG.md` — recent sprint entries provide context
4. `OPEN_QUESTIONS.md` — known deferred items

## What ships in this sprint (6)

Six blocks across three phases. Single checkpoint.

**Phase 1 — Sprint 5e v2 carryover:**
- **Block A — Popup max-height scroll fix.**
- **Block B — Growth Insights breakout visual differentiation.**

**Phase 2 — Demo polish:**
- **Block C — Demo dataset narrative verification.**
- **Block D — Surface polish across remaining touchpoints.**

**Phase 3 — Production readiness:**
- **Block E — Production deployment configuration.**
- **Block F — Governance updates and demo runbook.**

Sprint 6 does NOT ship: any architectural work; any new features; any Pattern library changes; any Coach content changes. Polish only.

---

## Block A — Popup max-height scroll fix

### A.1 Bug

When popup-as-workflow content exceeds viewport max-height, content below the visible area is unreachable. Banker can't scroll within the popup body to see all evidence and insights.

The "See all related insights" expand affordance from Sprint 5e v2 makes the popup substantially taller when expanded, exposing this scroll bug more visibly.

### A.2 Diagnosis path

Trace popup-as-workflow component CSS. Likely cause: outer container has `overflow: hidden` or fixed height without inner-scroll container; or the body content isn't wrapped in a scrollable region while header/footer are.

### A.3 Fix

Popup should have:
- Fixed header (objective name, close button) — does not scroll
- Scrollable body (evidence zone with all rows, insights, expanded patterns) — scrolls within popup
- Fixed footer (Implications: section, + Insight affordance) — does not scroll

Scroll behavior:
- Body container has max-height calculated from viewport minus header and footer heights
- `overflow-y: auto` on body container
- Smooth scrolling
- Scrollbar visible when content overflows

### A.4 Apply across all phase popups

Same scroll behavior on Discover, Measure, Consult, Navigate popups across all four fixtures. Same behavior whether "See all related insights" is collapsed or expanded.

### A.5 Acceptance criteria

- [ ] Popup body scrolls when content exceeds viewport
- [ ] Header and footer remain fixed during scroll
- [ ] Expand affordance works correctly within scrolled popup
- [ ] Scroll works on Cygnus's Discover popup with all 4 Patterns expanded (this is the densest test case)
- [ ] No regression to popup open/close behavior

---

## Block B — Growth Insights breakout visual differentiation

### B.1 Current state

Growth Insights (canonical Pattern reference content) appears nested under the Signal row it relates to, indented with left-rule (Treatment A from Sprint 5b.1 mini-patch). Insights section reads as part of the row's content stream without distinct visual differentiation.

### B.2 New state

Add subtle light grey background fill to the Growth Insights breakout container. This visually distinguishes the Pattern-reference content from the captured evidence above it, while preserving the indentation and left-rule treatment.

### B.3 Implementation

- Background color: subtle grey (e.g., `bg-stone-50` or equivalent in current Tailwind config; adjust to match Blaze color system)
- Apply to the entire Growth Insights container including the "GROWTH INSIGHTS" header, the Pattern entries, and the "See all related insights" expand region
- Maintain existing border-l left-rule treatment
- Maintain existing pl-4 indentation
- Background corner-radius matching component style guide

### B.4 Visual hierarchy goals

The differentiation should communicate:
- Captured evidence (quotes, factors) is primary content
- Growth Insights is reference content, visually distinct but adjacent
- Expanded "Other patterns for this lending product" section uses same background treatment
- Implications: footer remains visually separate (it's already in popup footer position)

### B.5 Acceptance criteria

- [ ] Light grey background applied to Growth Insights breakout container
- [ ] Visual differentiation clear without being heavy
- [ ] Expanded section retains background treatment
- [ ] No regression to indentation or left-rule treatment

---

## Block C — Demo dataset narrative verification

### C.1 Per-fixture narrative verification

Walk through each fixture's full narrative arc and verify content consistency. The build has been through many iterations; small inconsistencies may have accumulated.

**Jenny (event_services, TRACK-001 Working Capital LOC):**
- Discover: cashflow seasonality story — slow Jan-Feb, strong Dec, corporate clients pay 60+ days
- Measure: $48K/quarter slow-season gap, 32% seasonal variance, customer concentration captured
- Consult: $75K LOC sized, smoothing chart shown, "leaning yes / spouse pending" Reaction
- Navigate: household decision pending, joint conversation scheduled

**Northland (maintenance_services, TRACK-002 Business Vehicle Loan):**
- Discover: truck breakdown trigger, "I came in for my own truck but maybe what I really need is to think about the whole fleet"
- Measure: 88% capacity utilization, demand exceeding capacity, equipment aging confirmed, $180K fleet target
- Consult: ROI projection with sensitivity ranges, "leaning yes" with CPA-pending Reaction
- Navigate: CPA coordination in progress

**Cygnus (specialty_manufacturer, TRACK-008 SBA 504):**
- Discover: anchor customer growth signals, owner-occupancy confirmed, capacity at 85%
- Measure: $4M-$7M CRE need sized, employee count band captured, capacity utilization
- Consult: SBA 504 50/40/10 structure shown, "leaning yes" with board-pending Reaction
- Navigate: specialist handoff in motion

**Riverside Catering (event_services, TRACK-001, stage-skipping):**
- Stage-skipping: Consult-phase Model exists without Discover required evidence captured
- Visible on Stage-skip portfolio surface

### C.2 Verification checklist

For each fixture, verify:

- All required evidence per phase captured per Track template
- Captured evidence dates fall within compressed timeline (Sprint 5e Block D)
- Member quotes are concrete and Member-Type-appropriate
- Insights authored match Member's situation (not generic)
- Reactions reflect realistic banker-Member exchange
- Artifacts attached are appropriate for Track and Member-Type
- Track ranking shows expected primary Track for each Member

### C.3 Inconsistency fixes

If verification surfaces inconsistencies, document and fix. Common categories:

- Capture date out of sequence (Discover after Measure, etc.)
- Member-Type tag mismatched with content (e.g., Maintenance services Member with catering-style content)
- Track context inconsistency (e.g., Goal labeled Working Capital LOC but Track context shows Business Vehicle Loan)
- Insight content references wrong Member or wrong Track

### C.4 Acceptance criteria

- [ ] All four fixtures verified per checklist
- [ ] Inconsistencies documented and fixed
- [ ] Visual probe confirms each fixture's narrative arc reads coherently
- [ ] Track ranking outputs match expected primary Track per fixture

---

## Block D — Surface polish across remaining touchpoints

### D.1 Polish areas

Walk through these surfaces and apply polish where small issues remain:

**Sidebar:**
- Verify all section labels match Sprint 5d Section 6 rewrites
- Verify spacing and alignment
- Verify "see all N lending products" expand works correctly

**Insight Engine portfolio surfaces:**
- Verify all four routes render with new copy from Sprint 5d Section 7
- Verify member rows clickable and navigate to growth conversation page correctly
- Verify aggregate counts match underlying data

**Capture form modals:**
- Verify all six forms render copy from Sprint 5d Section 3
- Verify form validation works (required fields enforced; submit disabled if invalid)
- Verify forms close cleanly on cancel

**Coach surface:**
- Verify Member-Type-specific content renders for each fixture
- Verify CTA-eligible bullets navigate to correct forms with correct pre-selection
- Verify "show ?" affordance toggles correctly

**Artifact rendering:**
- Verify all 8 ArtifactTemplate types render correctly with sample parameters
- Verify SBA 504 roadmap displays "you-are-here" marker on correct stage for Cygnus
- Verify "Mark as shared with Member" updates timestamp without creating duplicate (Sprint 5b.1 Patch 7)

**Header / nav:**
- Verify Member name + Member-Type render correctly
- Verify Track context dropdown shows all candidates
- Verify breadcrumb navigation if present

### D.2 Polish discipline

This is a sweep, not a redesign. If something feels wrong but is not clearly broken, document in BUILD_LOG and proceed. Sprint 6 ships.

### D.3 Acceptance criteria

- [ ] All listed surfaces walked through
- [ ] Visible polish issues fixed
- [ ] Anything not fixed documented in BUILD_LOG with rationale
- [ ] No regression to surface behavior during polish

---

## Block E — Production deployment configuration

### E.1 Environment configuration

Verify production deployment config:

**Database:**
- Production Postgres connection (or Supabase) configured
- Schema migrations applied
- Production seed runs cleanly with all four fixtures

**API keys:**
- ANTHROPIC_API_KEY set in production environment
- Verify live LLM matching works in production (not just dev)

**Build:**
- `pnpm exec next build` produces clean production build
- No console warnings during build
- Bundle size reasonable

**Runtime:**
- All routes return HTTP 200 in production environment
- Server actions work correctly
- Static assets serve correctly

### E.2 Deployment target

Deploy to production hosting target (Vercel, Render, or whichever Francisco selects). Document deployment URL in BUILD_LOG.

### E.3 Demo URL

Confirm demo URL accessible. Test from external network (not just localhost). Verify HTTPS works.

### E.4 Demo data state

Production deployment uses the same seed data as dev. Verify:
- Jenny, Northland, Cygnus, Riverside Catering all present
- All Patterns, Insights, FactorCaptures, Reactions, Models seeded
- Workflow states recomputed
- ArtifactTemplates loaded with correct content

### E.5 Acceptance criteria

- [ ] Production build clean
- [ ] Production deployment accessible via HTTPS
- [ ] All routes return 200 in production
- [ ] Live LLM matching works in production
- [ ] Demo data complete and consistent in production

---

## Block F — Governance updates and demo runbook

### F.1 BUILD_LOG.md final entry

Sprint 6 entry covering:
- Carryover items from Sprint 5e v2
- Demo dataset verification
- Production deployment configuration
- EVP demo readiness

Cross-reference all sprint entries for the build's full history.

### F.2 Demo runbook

Create `DEMO_RUNBOOK.md` at repo root. Contents:

**Pre-demo checklist:**
- Production deployment URL
- ANTHROPIC_API_KEY verification step
- Test data verification (Jenny, Northland, Cygnus, Riverside present)
- Backup plan if API outage

**Demo narrative arcs (suggested order):**

1. **Open with Cygnus (specialty_manufacturer, TRACK-008 SBA 504).** Strongest Track with full narrative — anchor customer growth, owner-occupancy, SBA 504 structure, board pending. Demonstrates the full consultative arc.

2. **Walk through Northland (maintenance_services, TRACK-002 Business Vehicle Loan).** Different Member-Type, different Track, but parallel structure. Shows the architecture works across Member-Type / Track combinations.

3. **Brief Jenny (event_services, TRACK-001 Working Capital LOC).** Shows future-expansion product framing — Working Capital LOC retained for future Blaze product expansion.

4. **Insight Engine portfolio surfaces.** Track Performance showing Blaze offerings + future-expansion split. Member portfolio with sort by oldest-touched. Coverage with open threads. Stage-skip with Riverside Catering.

5. **Author one insight live.** During Cygnus or Northland walkthrough, click + Insight, write a banker observation, see live LLM matching. Demonstrates the matching architecture.

**Talking points:**
- Architecture thesis: Member Signals captures consultative reasoning during conversation. Lending decisions and formal underwriting occur in the lending decisioning system.
- Three-layer CTA derivation: missing evidence + threshold-uplift + specialist handoff
- Pattern library + banker-authored Insights with LLM matching for routing
- Portfolio surfaces give senior lenders cross-Member views

**Backup plan:**
- If LLM API unavailable: insights save as novel state with graceful fallback message
- If demo dataset corrupts: re-seed runs cleanly
- If specific surface fails: pivot to working surfaces

### F.3 OPEN_QUESTIONS.md final state

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

### F.4 Architectural notes for Pilot

Notes 1-14 logged across sprints. No new notes for Sprint 6 unless polish surfaces something architectural.

### F.5 CLAUDE.md final state

Manifest reflects all canonical docs at repo root and code locations from build.

### F.6 Acceptance criteria

- [ ] BUILD_LOG final entry comprehensive
- [ ] DEMO_RUNBOOK.md created at repo root
- [ ] OPEN_QUESTIONS.md reflects final state with all Pilot deferrals
- [ ] CLAUDE.md manifest current

---

## Reporting back

When Sprint 6 is complete, report back with:

1. Confirmation that Blocks A-F shipped per acceptance criteria
2. Production deployment URL and verification
3. Live LLM matching test in production (author one insight; verify match returns)
4. Visual probes on production:
   - Cygnus Discover popup with scroll behavior verified
   - Cygnus Discover popup with Growth Insights light-grey background
   - Northland Measure popup with 3 distinct factor rows + Pattern surfacing expand
   - Insight Engine portfolio surfaces all rendering
   - Sidebar with Coach surface working
5. DEMO_RUNBOOK.md preview for Francisco's review
6. Any deviations from spec with rationale
7. Final OPEN_QUESTIONS state for Pilot reference

---

## Estimated scope

2-3 effective build days CC time.

Largest blocks:
- **Block C (demo dataset verification)** — careful walkthrough of all four fixtures; ~0.5-1 day CC
- **Block D (surface polish sweep)** — many small touchpoints; ~0.5-1 day CC
- **Block E (production deployment)** — depends on hosting target complexity; ~0.5-1 day CC
- **Block F (demo runbook)** — substantive documentation; ~0.5 day CC

Smaller blocks (A, B) are routine.

After Sprint 6 ships and visual review confirms, the build is EVP demo-ready. Francisco rehearses. Demo proceeds.
