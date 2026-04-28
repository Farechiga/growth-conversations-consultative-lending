# SPRINT_3_PROMPT_1.md

**Sprint 3 — Multi-Member generalization · Prompt 1 of 1**

This is the first executable prompt for Sprint 3. Sprint 2 is complete (Prompt 1 accepted 2026-04-26; Prompt 2 accepted 2026-04-27 after visual review). Sprint 1's Member profile work, Sprint 2's context-aware Suggested Next Step, progress visualization, and merged Open opportunities band are now stable for Jenny.

This sprint generalizes the Member profile to render correctly for all three demo Members (Jenny, Northland, Cygnus) and builds the remaining two Artifacts. It's also the first sprint that visually surfaces the architectural decisions made in Sprint 2 for Cygnus's Connect-ending Track — the deterministic logic exists in code, but Cygnus's profile hasn't rendered until now.

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan, §3 Sprint 3 acceptance criteria
- `docs/design/03_Data_Framework.docx` — schema authority
- `docs/design/04_Module_and_Data_Flow.docx` — module boundaries
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content for all three Members (Cygnus and Northland Artifact specifications)
- `BLAZE_STYLE_GUIDE.md` — visual identity; §12 progress visualization
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry
- `lib/priorities.ts` — priority computation
- `lib/enum-descriptions.ts` — enum value descriptions

---

## Scope of this prompt

Five connected blocks that together generalize the Member profile and complete the demo's three Artifact set:

- **Block A:** Open opportunities header refinement (small visual tweak from Sprint 2 Prompt 2 review)
- **Block B:** Dynamic route at `/members/[id]` parameterizing the Member profile
- **Block C:** Northland's Artifact — fleet expansion ROI projection chart
- **Block D:** Cygnus's Artifact — capital event partnership map schematic
- **Block E:** Visual verification across all three Members

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 4 work (Growth Conversations module, Macro entity, signal longevity model, skip handling)
- Sprint 5 work (Insight Engine module)
- Macro context banner on Member profiles (depends on Macro entity from Sprint 4 Prompt 4.1)
- Inline insight surfaces on the Member profile (Sprint 4/5 cross-cutting per INSIGHT_ENGINE_DESIGN_NOTES.md)
- A "members list" route or navigation index (out of scope; the demo accesses Members directly via /members/[id])
- Banker dropdown identity switching cleanup (Sprint 6 polish)

Stop and check in after the full prompt completes. Single checkpoint at end; do not pause mid-prompt unless you encounter a real blocker.

**Reminder:** Hard refresh after CSS or layout changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Open opportunities header refinement

### A.1 — The fix

Sprint 2 Prompt 2 merged Open opportunities + Open work successfully. The header layout currently shows the Recommendation title (left) and ownership/due-date metadata (right) on a single line. Visual review surfaced that this layout reads as cramped on the Recommendation header line.

Move the ownership and due date metadata to a second line below the Recommendation title, with a line break between them. Add additional vertical breathing room before the verb-prefix relationship lines begin.

**Before (current):**
```
Working Capital Line of Credit at $75K     owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue

→ serves goal: ...
```

**After:**
```
Working Capital Line of Credit at $75K
owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue


→ serves goal: ...
```

The opportunity title is on its own line. The ownership/due-date line sits below it. There is a double line break (approximately 24-32px of vertical whitespace) before the first verb-prefix relationship line begins.

### A.2 — Specific styling

- Recommendation title: dark text (existing treatment, ~16-18px font, semibold)
- Ownership/due-date metadata line: lighter weight body text (~13-14px, regular weight), with the existing red treatment for "3d overdue" preserved
- Spacing: tight between title and metadata (4-6px); larger gap (24-32px) between metadata and first verb-prefix line
- The opportunity card's overall left/right margins, surrounding spacing, and other treatments remain unchanged

### A.3 — Verify the change applies to all opportunities

When Sprint 3 generalizes to Northland and Cygnus, this header treatment should automatically inherit. Verify that the styling is component-level, not Jenny-specific.

For Cygnus's CRE opportunity (owned by Marcus Webb, no overdue ActionCard):
```
$2.4M Owner-Occupied CRE
owned by Marcus Webb


→ serves goal: ...
```

The ownership-only metadata renders on the second line with the same spacing treatment.

---

## Block B — Dynamic route at /members/[id]

### B.1 — Establish the route

Currently the Member profile lives at a hardcoded path (likely `/members/jenny` or similar). Refactor to a dynamic route:

```
app/members/[id]/page.tsx
```

The `[id]` parameter is the Member's stable identifier. For the demo seed data, use the Member.slug field (which should already exist in the schema) — values like `jenny`, `northland`, `cygnus`. If Member.slug doesn't exist, add it as part of this Block; populate it on seed.

The route loads the Member by slug, then renders the same Member profile layout we have for Jenny, with all data driven by the loaded Member rather than hardcoded.

### B.2 — Data loading

The page server-loads (or uses appropriate Next.js 16 patterns for):
- The Member record itself
- All linked Signals (active and historical)
- All Recommendations with their linked ActionCards
- All Conversations
- All ArtifactShareRecords
- The Member's primary_banker
- Any Bankers referenced by Recommendation.owned_by

This uses the same patterns established in Sprint 1 and Sprint 2 — no new architectural patterns needed; just generalization.

### B.3 — Handle missing Member

If `/members/some-unknown-slug` is accessed, render a clean 404 page with a message like "Member not found" rather than throwing an error. For the demo, the only valid slugs are `jenny`, `northland`, `cygnus`.

### B.4 — Update internal links

Anywhere in the codebase that previously linked to the hardcoded Member profile path should update to use the dynamic path with the appropriate slug. The "Run Growth Track" / "Run follow-up" buttons should still link to `/growth-conversations` (placeholder route from Sprint 2 Prompt 2).

### B.5 — Banker context

Currently the page shows "Logged in as Scott Brynjolffson" — this is the simulated banker identity for the demo. For the Cygnus profile, the banker context still says Scott (Cygnus's primary_banker), but the CRE opportunity is owned by Marcus. The display correctly distinguishes these:

- Header: "Logged in as Scott Brynjolffson · Primary banker"
- Sidebar identity: "Primary banker: Scott Brynjolffson"
- Cygnus's CRE opportunity: "owned by Marcus Webb"

This is the architecturally important visual demonstration. The viewer sees Scott logged in as the relationship banker, but the specific opportunity is being moved by Marcus as the CRE specialist.

For Sprint 3, the banker dropdown identity switching is out of scope (Sprint 6). Just verify that the seeded "Scott logged in" identity displays correctly across all three Member profiles.

---

## Block C — Northland's Artifact: fleet expansion ROI projection chart

### C.1 — The Artifact specification

Per MEMBER_FIXTURE_BRIEF.md §5.3 (Northland's Track), the Show step's Artifact is a fleet expansion ROI projection chart. It should communicate:

- The 18-24 month payback window for fleet expansion in HVAC & Trades businesses of Northland's size
- Northland's specific position relative to the curve
- How the recommended Vehicle/Fleet Loan financing affects the payback timing

### C.2 — Visual treatment

This is a Recharts-based composed chart. Use the existing chart patterns from Jenny's seasonal smoothing chart as the visual template:

- Burnished orange (`#B45F26`) for the primary line/series
- Light cool grey (`#D5D8DB`) for secondary/baseline elements
- Clean axis labels in muted grey
- Title and brief contextual note above the chart
- Sourced data values (real or representative — banker-grade, not placeholder) per MEMBER_FIXTURE_BRIEF.md §5.3.4

If the brief does not specify exact data values, generate a banker-grade dataset that:
- Shows monthly cash flows over a 36-month projection horizon
- Highlights the break-even crossing point (the "payback" inflection)
- Includes 2-3 scenarios (e.g., "without fleet expansion baseline," "with fleet expansion at full equipment cost," "with fleet expansion at recommended Vehicle/Fleet Loan financing")
- Uses values consistent with Northland's $180K Vehicle/Fleet Loan size and the brief's narrative framing

Document the values used in BUILD_LOG so they're traceable.

### C.3 — Integration into the Member profile

The Artifact appears in the same way as Jenny's chart:
- Within the Open opportunities band (since it supports the Vehicle/Fleet Loan opportunity)
- As a click-to-preview affordance — title displayed, click opens a modal or expanded preview with the chart rendered
- The Artifact share record displays in the History band per Sprint 1's pattern

### C.4 — Artifact share record for Northland

Per MEMBER_FIXTURE_BRIEF.md, Northland's Artifact share record should reflect the seed data state (chart shown during the April 15 conversation; supports the Vehicle/Fleet Loan Recommendation).

Verify the verb-prefix line "→ supports opportunity: $180K Vehicle/Fleet Loan" renders correctly.

---

## Block D — Cygnus's Artifact: capital event partnership map schematic

### D.1 — The Artifact specification

Per MEMBER_FIXTURE_BRIEF.md §5.4 (Cygnus's Track), the Show step's Artifact is a capital event partnership map schematic. This is structurally different from the other two Artifacts — it's not a quantitative chart but a relationship/sequence diagram showing:

- The owner-occupied CRE opportunity in context
- The various partners involved at different stages (relationship banker, CRE specialist, lending committee, treasury)
- The sequence of milestones that lead from initial conversation to closed CRE deal
- How Cygnus's specific situation (anticipating a capital event) maps to this structure

### D.2 — Visual treatment

Since this is a schematic rather than a chart, the visual approach is different:

Honest read: a small SVG-based diagram is the right approach. Recharts is wrong here (it's optimized for quantitative charts). Build a custom SVG component with:

- Clean geometric shapes (circles, rectangles, connecting lines)
- Burnished orange for the primary path/sequence
- Light cool grey for secondary structure
- Labels in standard typography (system font, small size)
- A clear visual hierarchy distinguishing milestones, partners, and Cygnus's current position

The schematic should be readable at modal-preview size (~600-800px wide). Don't overcomplicate — 5-7 nodes connected by clean lines is sufficient.

If the brief specifies the exact partnership/milestone sequence, follow it. If not, design a sequence consistent with how a credit union actually moves a CRE deal through internal partnerships:
1. Initial conversation (relationship banker — Scott)
2. CRE specialist introduction (Marcus)
3. Capital event planning conversation
4. Site identification and underwriting (CRE team)
5. Lending committee review
6. Closing and treasury coordination

Highlight Cygnus's current position (probably between steps 2 and 3 — Marcus has been introduced; capital event planning is upcoming).

Document the sequence used in BUILD_LOG.

### D.3 — Integration into the Member profile

Same pattern as the other Artifacts — title shown in the Open opportunities band, click opens a modal or expanded preview showing the schematic.

### D.4 — Artifact share record for Cygnus

Per MEMBER_FIXTURE_BRIEF.md, Cygnus's Artifact share record reflects the seed data (schematic shown during the April 21 conversation; supports the $2.4M Owner-Occupied CRE Recommendation).

Verify the verb-prefix line "→ supports opportunity: $2.4M Owner-Occupied CRE" renders correctly.

---

## Block E — Visual verification across all three Members

### E.1 — Smoke test all three profiles render

After Blocks A-D are complete:

- `/members/jenny` — should render exactly as the Sprint 2 Prompt 2 accepted state, plus the Block A header refinement
- `/members/northland` — should render with similar visual rhythm; data-driven content reflects Northland's situation; fleet ROI chart accessible via preview
- `/members/cygnus` — should render with the architectural decisions visible (two Ask steps in progress dots; Marcus owns the CRE; Connect-ending Track shows "Specialist engagement → Closed" lifecycle stages instead of "Decision pending → Funded")

### E.2 — Sprint 2 architectural decisions visually verified for Cygnus

Cygnus's profile is the first time the following Sprint 2 architectural decisions render visually:

**Two Ask steps in progress visualization:**
- The progress dots show Ask 1 · Ask 2 · Show · Connect · Specialist engagement · Closed (six stages)
- Both Ask dots are independent (per Sprint 2 Prompt 2 step-position-based completion logic)
- For seeded Cygnus data (assumed all Track stages completed), both Ask dots appear filled

**Connect-ending Track post-stages:**
- Stages 5 and 6 are "Specialist engagement" and "Closed" — NOT "Decision pending" and "Funded"
- The post-Track stage labels are derived from the Track's final step shape (Connect → Specialist engagement / Closed; Resolve → Decision pending / Funded)

**Cross-banker ownership:**
- Cygnus's CRE Recommendation displays "owned by Marcus Webb" (not Scott Brynjolffson, who is the Member's primary_banker)
- Header still says "Logged in as Scott Brynjolffson" — the relationship banker is still Scott; only the CRE opportunity is owned by Marcus

**Suggested Next Step for Connect-ending Track:**
- Cygnus's card content (per Sprint 2 Prompt 1 logic) handles the Connect handoff case
- Action description should be something like "Confirm Marcus's introduction landed with Margaret" rather than "Schedule joint call" (which is the Resolve-track pattern)

If any of these don't render correctly, that's a bug to fix in this prompt rather than carrying forward.

### E.3 — Sidebar What's hot priority differences

The sidebar What's hot list should differ meaningfully across Members per the priority computation:

- **Jenny:** 1 priority item (overdue follow-up on the LOC) — exists in seed data
- **Northland:** depends on seed data — likely 1 priority item if there's an overdue or upcoming ActionCard for the Vehicle/Fleet Loan
- **Cygnus:** depends on seed data — possibly 2 priority items (CRE opportunity follow-up; treasury sweep evaluation as separate work area)

Document what each Member's What's hot list contains in BUILD_LOG. If it surfaces architectural questions (e.g., "should Cygnus have ActionCards from both Scott and Marcus visible?"), log them.

### E.4 — Visual rhythm and discipline holds

Verify that across all three Members:
- The four-tier display discipline (chips, labeled values, inline-bold with hover, plain text) renders consistently
- Hairline rules between bands have consistent spacing
- The orange section marks render at consistent size across all bands
- The verb-prefix relationship lines use canonical verbs from lib/verb-patterns.ts
- The "from check in on [date]" trace links display consistently

If any visual inconsistencies surface — e.g., Northland's data has a field that doesn't fit cleanly into the chip-vs-labeled-value-vs-inline discipline — flag the question, propose an answer, and continue. Don't get stuck on small visual decisions; document and move forward.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md if needed

The §12 progress visualization documentation should already cover the adaptive Track shape (Sprint 2 Prompt 1 work) and the Connect-ending Track variant. Verify that Cygnus's visualization is consistent with the documented pattern. Update §12 if any clarifications or additions are needed based on visual experience with Cygnus.

### H.2 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 3 Prompt 1 work shipped
- Block A: Open opportunities header refinement
- Block B: dynamic route at /members/[id]
- Block C: Northland's fleet ROI projection chart with documented data values
- Block D: Cygnus's capital event partnership schematic with documented sequence
- Block E: visual verification findings — note any visual differences across Members worth highlighting; note Cygnus's architectural decisions rendering as expected
- Any decisions made during implementation that the prompt didn't pre-specify

### H.3 — Update OPEN_QUESTIONS

Likely candidates if surfaced during implementation:
- Sidebar What's hot priority computation for Cygnus's two-ActionCard case (does the priority logic correctly surface both Scott's and Marcus's items?)
- Connect-ending Track Specialist-engagement → Closed transition logic (still hard-coded per Sprint 2 Prompt 1; meaningful resolution comes in Sprint 5 Insight Engine work)
- Whether any Member has a visual fit-up issue with the Track step labels (e.g., Cygnus's "Ask 1" vs "Ask 2" feels redundant with both visible — alternative could be "Ask · Ask" or step-specific labels)

### H.4 — Smoke-test deployment

Per DEMO_BUILD_PLAN.md §6 risk mitigation: deploy a smoke-test version after Sprint 3 to surface deployment issues before Sprint 4's larger commits.

If time permits in this prompt, run a build + Vercel deploy attempt and report any deployment-specific issues. If the Vercel deploy is non-trivial (e.g., needs env vars, build config tweaks), don't fix it in this prompt — log to OPEN_QUESTIONS as a Sprint 6 polish item.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Open opportunities header refined per Block A (title on first line; ownership/due-date on second line; double line break before first verb-prefix line)
- [ ] Dynamic route at /members/[id] working
- [ ] /members/jenny renders correctly (no regressions from Sprint 2 Prompt 2 accepted state, plus Block A refinement)
- [ ] /members/northland renders correctly with fleet ROI projection chart accessible via preview
- [ ] /members/cygnus renders correctly with capital event partnership schematic accessible via preview
- [ ] /members/some-unknown-slug returns clean 404
- [ ] Cygnus's progress visualization shows two independent Ask dots (Ask 1, Ask 2)
- [ ] Cygnus's progress visualization shows Connect-ending stage labels ("Specialist engagement", "Closed")
- [ ] Cygnus's CRE opportunity displays "owned by Marcus Webb"
- [ ] Cygnus's Suggested Next Step card handles the Connect handoff case appropriately (action description fits the handoff scenario)
- [ ] Northland's fleet ROI projection chart uses banker-grade data values (documented in BUILD_LOG)
- [ ] Cygnus's capital event partnership schematic uses a coherent partnership sequence (documented in BUILD_LOG)
- [ ] Sidebar What's hot priorities differ meaningfully across Members
- [ ] Four-tier display discipline (chips, labeled values, inline-bold, plain text) renders consistently across all Members
- [ ] BLAZE_STYLE_GUIDE.md still authoritative; updates only if Cygnus visualization surfaced clarifications
- [ ] BUILD_LOG entry comprehensive
- [ ] Clean re-seed succeeds; row counts stable
- [ ] All Member fixtures still seed correctly

## Report-back format

When complete, send back:

1. **Screenshots:** /members/jenny (showing Block A refinement); /members/northland (showing fleet ROI chart in opportunity card and as preview); /members/cygnus (showing two Ask dots, Connect-ending stages, Marcus ownership); ideally screenshots of the two new Artifacts in their preview/modal state
2. **The dynamic route implementation** in summary form (how data loads; how missing-Member case is handled)
3. **The fleet ROI chart data values** used (in BUILD_LOG link or summary)
4. **The capital event partnership schematic sequence** used (in BUILD_LOG link or summary)
5. **Visual verification findings:** what's working consistently, what surfaced as a question, what's still open
6. **Any decisions made during implementation** that the prompt didn't pre-specify
7. **Any items logged to OPEN_QUESTIONS** during implementation
8. **Confirmation that hard refresh shows the changes correctly** — take screenshots after Cmd+Shift+R or in incognito window
9. **Smoke-test deployment outcome** if attempted — success, failure with notes, or "not attempted in this prompt; logged for Sprint 6"

Stop and check in. Don't proceed to Sprint 4 work until this prompt is reviewed and accepted.
