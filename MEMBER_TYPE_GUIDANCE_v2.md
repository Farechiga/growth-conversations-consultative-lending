# Member-Type Guidance v2 — Coach Source Content

Refined Coach content for the three demo Member-Types. Path B editorial pass: genuinely Member-Type-specific operational practice, not generic small-business consultation that happens to be tagged. Careful to not duplicate Pattern-shape content (Pattern library handles Track-keyed canonical reframings; Coach handles Member-Type-keyed consultative orientation).

**Authored by Claude. Status: draft for Francisco's editorial pass.**

**Discipline applied throughout:**

- Each Member-Type × Objective cell describes consultative practice specific to that Member-Type. Catering content describes how to consult with a small caterer; HVAC trades content describes how to consult with a trades business owner; specialty manufacturing content describes how to consult with a mid-market manufacturer.
- Content focuses on *operational practice* (what bankers do during the conversation) rather than *interpretive reframings* (which are Patterns).
- Each cell has 3-5 action-oriented bullets (verb-led: "Capture...", "Quantify...", "Confirm...", "Listen for...").
- Where bullets reference specific factors or capture activities, they're rendered as clickable CTAs (existing Sprint 5a.3 + Sprint 5b.1 plumbing).
- Honors COMPLIANCE.md §10.2 banned-phrase discipline.
- Member-Type voice differs: catering Members are operator-owners with seasonal pressure; HVAC trades Members are field-operations owners with capacity-and-equipment focus; specialty manufacturing Members are professionalized mid-market with board-and-specialist decision processes.

**Schema for Coach surface integration:**

The content below maps to `MEMBER_TYPE_GUIDANCE` constants in `lib/stage-guidance.ts`. Each Member-Type × Objective cell becomes a section in the Coach panel with verb-led bullets; bullets that reference specific capture activities become clickable CTAs.

---

## Section 1 — Catering (small_caterer)

Catering Members are operator-owners running personally-managed businesses with sharp seasonal cycles, customer relationships built on direct trust, and household financial entanglement common in decision-making. Conversations move quickly through Member-stated facts and slow down at decision-process and household-context questions.

### 1.1 Discover — Catering

What to focus on during the Discover phase with a catering Member:

- **Listen for the seasonal cycle's specific shape.** Catering seasonality varies by venue type and client mix — corporate event caterers peak differently from wedding caterers, who peak differently from holiday-and-private-party caterers. Confirm peak/trough months explicitly rather than assuming.
- **Capture the customer-mix concentration.** Many catering businesses have a handful of anchor clients (corporate accounts, venue partnerships) producing outsized revenue share. Sized capture of top-3 customer concentration % surfaces structural risk.
- **Probe the December-January-February pattern carefully.** Most catering businesses know December is strong; many haven't articulated how dependent their full-year viability is on that one month. The framing of January/February as "the kill months" or "the dry spell" matters; capture verbatim.
- **Ask about declined work directly.** Catering businesses often decline work without tracking it. "Have you turned down events in the past year? What kind?" surfaces lost-revenue context that Member may not have quantified.
- **Confirm household financial structure early.** Many catering businesses are jointly owned or have one spouse running operations and another holding household financial veto. The structural fact of co-decision-making matters before Measure phase.

### 1.2 Measure — Catering

What to focus on during the Measure phase with a catering Member:

- **Quantify the slow-season gap precisely.** Total revenue gap (in dollars or as % of peak month) across the slow window, not just monthly numbers. "How much do you net in November-December vs January-February?" produces sharper signal than asking about monthly revenue alone.
- **Capture seasonal-variance %.** The matrix-aware factor capture asks for it directly; catering Members often have intuition (~30-40% in their head) but haven't put numbers to it. Capture the Member's stated % and the structured field together.
- **Quantify customer payment cycle.** Corporate catering clients often pay 60-90 days; private events pay at booking or service. Mixed customer base produces complex cycle that Member may quote as average ("about 45 days") that hides the corporate-anchor stretch. Probe for the stretch.
- **Quantify lost revenue from declined work.** Even if Member tracks declined events loosely, an annual estimate produces useful signal. Catering Members often underestimate this number; capture the Member's stated estimate and note where to refine.
- **Build the seasonal cashflow model with Member visibility.** Catering Members respond to visual representations of their own cycle. Produce the Model collaboratively (Member sees it being constructed) rather than presenting a finished version.

### 1.3 Consult — Catering

What to focus on during the Consult phase with a catering Member:

- **Show the smoothing chart with Member present.** Catering Members process visual cashflow representations differently than verbal descriptions. The smoothing chart's specific value comes from Member seeing their own seasonal pattern with the proposed facility overlay.
- **Listen for the household co-decision-maker reference early.** "I'd want my husband/wife to look at this" or equivalent surfaces structural fact about decision-process. Capture as Indecision Signal with co_decision_maker_input tag.
- **Probe specific facility sizing comfort.** Catering Members often have intuitive sense of "comfortable draw amount" that differs from what cashflow analysis suggests. Capture the Member's intuitive number alongside the analytical number.
- **Capture Reaction precisely.** Catering Members move from "I'm not sure" to "this might work" to "let me think about it" in identifiable steps. Reaction values (leaning_yes, hesitant, committed) should reflect the Member's actual posture, not banker hopes.
- **Don't rush Navigate-phase scheduling on first conversation.** Catering Members typically need household conversation between Consult and Navigate. Schedule the next conversation explicitly rather than assuming forward motion.

### 1.4 Navigate — Catering

What to focus on during the Navigate phase with a catering Member:

- **Confirm household conversation explicitly.** "Did you and [spouse] talk through the LOC?" surfaces resolution status without making assumptions. Capture as Reaction with response_value indicating commitment state.
- **Schedule joint conversation when household structure permits.** Many catering Members benefit from a joint banker conversation with both decision-makers present. Offer this rather than waiting for Member to request it.
- **Surface specific draw scenarios for first six months.** Catering Members commit more readily when first-six-month draw plans are explicit ("you'll likely draw $X in February, $Y in March, repay $Z in May"). Build this from the cashflow model.
- **Confirm Treasury Services adjacency.** Catering Members benefit from sweep accounts, automated payroll timing, and merchant services adjacent to the LOC. Surface treasury options without making them prerequisites.
- **Track introduction-to-formalization timeline carefully.** Catering Members can stall in Navigate for weeks if not actively managed. Specific next-conversation dates within 7-10 days produce better forward motion than open-ended "let me know when ready."

---

## Section 2 — HVAC Trades (hvac_trades)

HVAC trades Members are field-operations owners running businesses where capacity is physical and visible (trucks, technicians, scheduling load), equipment aging produces concrete operational pain, and consultative conversations move through capacity-and-equipment factors before reaching financing structure questions. Decision-making is often single-owner with strong CPA involvement.

### 2.1 Discover — HVAC Trades

What to focus on during the Discover phase with an HVAC trades Member:

- **Anchor on what brought them in today.** HVAC trades Members typically arrive with a specific operational trigger (truck breakdown, refused service call, technician hiring blocked by capacity). Capture this as Trigger before broader exploration.
- **Listen for "we had to turn down" or "we couldn't get to" framings.** Capacity-as-lost-revenue isn't always articulated by HVAC Members; the language surfaces it. Capture verbatim and as Blocker with capacity_limit tag.
- **Probe fleet age conversationally.** HVAC trades Members know their fleet intimately. "How old is the oldest truck still working? The newest?" surfaces fleet-aging structure quickly.
- **Capture seasonal pattern carefully — HVAC has multiple seasonal layers.** Cooling-season peak (summer service); heating-season peak (winter service); shoulder-season install work; emergency-service distribution. Don't assume one seasonal pattern; ask for the shape.
- **Confirm CPA relationship early.** HVAC trades Members typically have a long-tenured CPA who handles depreciation strategy, equipment financing, and tax-structuring. CPA reference shapes financing-structure conversations later.

### 2.2 Measure — HVAC Trades

What to focus on during the Measure phase with an HVAC trades Member:

- **Quantify capacity utilization with concrete metrics.** HVAC trades Members track capacity in truck-days/week or technician-hours/month. "What percentage of available technician hours did you bill last month?" produces structured capacity utilization %.
- **Capture demand-exceeds-capacity events with magnitude.** "How many service calls did you decline last month? Last quarter?" with dollar estimate ("average ticket?"). Lost-revenue quantification grounds the fleet-expansion case.
- **Quantify fleet replacement vs expansion split.** HVAC trades Members often need both: replace aging trucks and add new capacity. The split matters for financing structure. "If we did this in two waves, what's wave-one replacement and wave-two expansion?"
- **Capture YoY revenue trajectory specifically.** HVAC trades businesses often grew 15-25% YoY over recent years; the trajectory shapes capacity-expansion ROI projection. Confirm with concrete numbers, not Member's general sense.
- **Build the fleet-expansion ROI projection with Member input.** HVAC trades Members validate ROI projections against operational reality (technician hiring lead time, vehicle outfitting cost, regional demand). Build with Member, not for Member.

### 2.3 Consult — HVAC Trades

What to focus on during the Consult phase with an HVAC trades Member:

- **Present financing structure options, not single recommendation.** HVAC trades Members typically evaluate equipment financing through CPA's tax-structuring lens. Present 2-3 structure options (term loan / lease structure / SBA-assisted purchase) so Member can engage CPA on structural choice.
- **Show fleet-expansion ROI projection with sensitivity ranges.** HVAC trades Members understand that operational ROI varies with assumptions (technician hiring success rate, regional demand stability). Sensitivity ranges produce more credible projection than point estimates.
- **Listen for "I want to talk to my CPA" signals.** Capture as Indecision with external_advisor_input tag. Surface explicitly: "What does your CPA typically focus on with equipment financing decisions?"
- **Capture Reaction precisely.** HVAC trades Members move through engagement (technical questions about structure) → consideration (deferred to advisor input) → commitment (specific timing/amount). Reaction values should track this progression.
- **Confirm operational timing.** Fleet expansion timing aligns with shoulder-season prep windows (spring before cooling-season demand; fall before heating-season demand). Surface this so Navigate-phase scheduling matches operational reality.

### 2.4 Navigate — HVAC Trades

What to focus on during the Navigate phase with an HVAC trades Member:

- **Coordinate with CPA on structuring decisions.** Most HVAC trades Members defer final structure to CPA review. Banker offers to coordinate directly with CPA on tax-structuring questions; surfaces as ActionCard.
- **Confirm vehicle-procurement timeline alignment.** Vehicle ordering and outfitting takes 8-12 weeks; technician hiring takes 6-10 weeks. Financing timeline should match shorter of these. Surface the timeline as part of Navigate-phase planning.
- **Specialist handoff to commercial credit underwriting.** HVAC trades fleet expansions over $250K typically route through commercial credit underwriting team. Initiate handoff via SpecialistHandoff with clear notes on operational timing and CPA coordination.
- **Track post-financing operational milestones.** First truck delivery, first new technician start, first month at expanded capacity. HVAC trades Members value banker continuity through operational transitions.

---

## Section 3 — Specialty Manufacturing (specialty_manufacturing)

Specialty manufacturing Members are professionalized mid-market businesses with multi-stakeholder decision processes (board, founders, CFO/controller, external advisors), capacity decisions tied to anchor-customer commitments, and material commitments evaluated through formal underwriting and structural analysis. Consultative conversations require specialist coordination from the early stages.

### 3.1 Discover — Specialty Manufacturing

What to focus on during the Discover phase with a specialty manufacturing Member:

- **Map the decision-process structure first.** Specialty manufacturing financing decisions involve board approval, CFO/controller analysis, founder authority, and often external advisors. Surface the structure explicitly: "Who on the team needs to be part of this conversation? What's the typical board cadence for capital decisions?"
- **Anchor on customer-growth commitments.** Specialty manufacturing capacity decisions are typically driven by anchor-customer volume signals (preferred-supplier announcements, multi-year volume commitments, capacity-reservation conversations). Capture these as Triggers with customer_growth_announcement tag.
- **Listen for the floor-space framing.** Specialty manufacturing Members articulate physical capacity through square-footage, production-line count, or specific equipment-housing constraints. Capture verbatim — the framing matters for CRE conversations.
- **Probe regulatory-compliance context.** Specialty manufacturing businesses often face industry-specific regulatory requirements (FDA, EPA, OSHA, sector-specific) that shape facility decisions. Surface regulatory context early; it constrains expansion options.
- **Confirm prior banking-relationship history.** Specialty manufacturing Members often have history with multiple institutions. Past lending events (especially with non-current institution) shape relationship-led pitch framing.

### 3.2 Measure — Specialty Manufacturing

What to focus on during the Measure phase with a specialty manufacturing Member:

- **Quantify capacity utilization with production-level precision.** Specialty manufacturing Members track capacity in production-line hours, machine utilization %, or output-units per shift. Capture the specific measure they use, not a generic %.
- **Quantify customer-growth volume commitments.** Anchor customers' volume signals translate to specific capacity demand. "If [customer] hits their stated growth, what does that require from your operations?" Member typically has this number; capture it.
- **Capture annual revenue band carefully.** Specialty manufacturing Members may have $5M-$50M revenue range; the specific band shapes financing options. Confirm at minimum revenue tier (above/below $10M) for CRE Term Loan size-fit; above/below $25M for sophistication of structure.
- **Quantify expansion scope in dollars.** Specialty manufacturing Members typically have an internal estimate of expansion cost (CRE acquisition + buildout + equipment + working capital). Capture as Sized magnitude with banker noting which components are in/out of scope.
- **Build the financing-scenario model with multiple structures.** Specialty manufacturing Members evaluate financing through structural lens (term loan vs CRE term + working capital line vs SBA-assisted). Model 2-3 structures with comparison; Member's CFO/controller will work through this in detail.

### 3.3 Consult — Specialty Manufacturing

What to focus on during the Consult phase with a specialty manufacturing Member:

- **Show the financing-scenario model with structural comparison.** Specialty manufacturing Members engage with structural tradeoffs (term length, rate structure, covenant structure, prepayment flexibility) more than they engage with single-structure recommendations. Present the comparison clearly.
- **Listen for board-process and timing language.** "We need to bring this to the board at our next meeting" surfaces specific timeline. Capture as Indecision with co_decision_maker_input tag plus timeline reference.
- **Capture multiple Reactions across the conversation.** Specialty manufacturing Members react differently to operational fit (banker shows structural understanding) vs financial fit (rate, terms, covenants) vs relationship fit (specialist coordination, decision-timeline match). Capture Reaction state on each dimension.
- **Surface specialist coordination explicitly.** CRE Term Loan for specialty manufacturing requires CRE specialist + commercial credit underwriting + sometimes industry-vertical specialist. Surface the coordination structure during Consult, not as Navigate-phase surprise.
- **Confirm relationship-led positioning when appropriate.** Specialty manufacturing Members with long Blaze relationships often prefer structuring this round with Blaze specifically when the case is competitive. The "we'd like the next round to be with you" framing matters; capture Member's stated preference.

### 3.4 Navigate — Specialty Manufacturing

What to focus on during the Navigate phase with a specialty manufacturing Member:

- **Initiate specialist handoff with full context package.** CRE specialist receives the captured evidence package (Track context, captured Signals, financing scenarios, board-process timeline). Surface the handoff as scheduled working session, not isolated email introduction.
- **Coordinate board-presentation timeline.** Specialty manufacturing Members often need a banker-supported board presentation (slides, structural rationale, term-sheet draft). Offer this coordination explicitly; capture as ActionCard with specific timeline.
- **Track external-advisor-review milestones.** External advisors (legal, financial, sometimes investment banker) typically review specialty manufacturing financing structures before commitment. Track each review milestone via ActionCards.
- **Confirm post-commitment relationship structure.** Specialty manufacturing Members typically continue treasury, working capital, and other relationship deepening post-CRE-commitment. Surface the post-commitment relationship structure during Navigate to anchor continuation.
- **Maintain specialist-handoff oversight.** Specialty manufacturing financings can take 60-120 days from Navigate to closing. Banker maintains relationship oversight while specialist drives structure execution; capture progression milestones.

---

## Section 4 — Editorial review prompts for Francisco

Five places where banker's-eye and product-voice judgment matter more than my drafting:

**E1 — Member-Type voice consistency.** I aimed for differentiated voice across the three Member-Types (catering = operator-owner with seasonal pressure; HVAC trades = field-operations owner; specialty manufacturing = professionalized mid-market). Worth checking whether voice carries consistently within each section or drifts toward generic.

**E2 — Action-orientation bullet quality.** Each cell has 3-5 verb-led bullets. Are any reading as descriptive rather than action-oriented? Most uncertain: catering Discover bullets ("Listen for...") may read as too passive compared to HVAC ("Anchor on...") — worth verifying tone is intentional or needs adjustment.

**E3 — CTA-translatable bullets.** Bullets that map to specific capture activities (factor diagnostic questions, Signal types, Reaction capture, ActionCard scheduling) become clickable CTAs in the Coach surface. Worth identifying which bullets in each cell should become CTAs vs which stay as orientation prose. My judgment: roughly half the bullets in each cell are CTA-eligible; CC will surface the affordances during integration.

**E4 — Banned-phrase audit.** I avoided "Recommended for", "Eligible for", "Pre-qualified" framings throughout. Worth a fresh pass for anything reading as approval-coded. Most uncertain spots: HVAC Consult ("Present financing structure options, not single recommendation") references "recommendation" but in a discipline-affirming context; specialty manufacturing Consult ("Confirm relationship-led positioning when appropriate") approaches sales-flavored framing.

**E5 — Pattern-overlap audit.** Path B discipline requires Coach content to not duplicate Pattern-shape content (Track-keyed canonical reframings). Worth checking specific bullets against the Pattern library (`INSIGHT_PATTERN_LIBRARY_v1.md`) for accidental restatement. Most uncertain: catering Measure section's "Capture seasonal-variance %" overlaps conceptually with PATTERN-001 territory but stays focused on capture-practice (how to ask, what to probe) rather than reframing (what the variance means).

---

## Section 5 — Sprint 5b.2 schema notes

The content above maps to `lib/stage-guidance.ts` MEMBER_TYPE_GUIDANCE constants per existing Sprint 5a.3 structure. CC integration:

```typescript
export const MEMBER_TYPE_GUIDANCE = {
  small_caterer: {
    discover: { 
      header: "What to focus on during the Discover phase with a catering Member:",
      bullets: [
        { text: "Listen for the seasonal cycle's specific shape...", cta: null },
        { text: "Capture the customer-mix concentration.", cta: { type: 'open_capture_form', form: 'quantify', preselected_factor_id: 'FACTOR-003' } },
        // etc.
      ]
    },
    measure: { /* ... */ },
    consult: { /* ... */ },
    navigate: { /* ... */ },
  },
  hvac_trades: { /* ... */ },
  specialty_manufacturing: { /* ... */ },
}
```

CC implementation translates each cell's content into this structure, identifying CTA-eligible bullets and wiring action descriptors.

---

**End of Member-Type guidance v2 draft.**

Total content: 12 cells (3 Member-Types × 4 Objectives), 56 verb-led bullets, structural metadata for Coach surface integration.

Ready for Francisco's review pass per Section 4 prompts. After review, this becomes seed content for Sprint 5b.2 Block G.
