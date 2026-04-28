# INSIGHT_ENGINE_DESIGN_NOTES.md

**Design reference document for the Insight Engine module and its inline-embedded surfaces. Prepared during Sprint 2 review (2026-04-27) after architectural conversation surfaced the Insight Engine's true scope and shape. This document is referenced by Sprint 4 and Sprint 5 prompts to draw from rather than re-establishing the design each time.**

**Audience:** Francisco (build oversight), Claude Code (Sprint 4 and Sprint 5 execution), future stakeholders (post-demo handoff).

**Status:** Reference document, not a build prompt. The decisions captured here are stable; the implementation plan is in DEMO_BUILD_PLAN.md.

---

## 1. The Insight Engine's job

The Insight Engine answers questions that no individual banker can answer alone, by aggregating captured Signals, Recommendations, ActionCards, and Growth step executions across the institution's banker book.

The job has two dimensions, both essential:

**Dimension 1 — Pattern intelligence.** What's working? What patterns predict opportunity advancement? Which Artifacts land with which Member Types? Which indecision types resolve and which don't? Where are coverage gaps in the canonical content?

**Dimension 2 — Macro context.** What's happening in the broader environment that a single banker can't see from their own book? Macro developments (trade policy shifts, regulatory changes, sector pressures, technology disruptions) affect groups of Members in correlated ways. The Insight Engine surfaces these as system-curated context that bankers can use as conversational on-ramps.

These two dimensions are complementary. Pattern intelligence is bottom-up — emergent from captured banker activity. Macro context is top-down — curated by economists, policy specialists, or thought leaders within Blaze (or sourced from external research feeds).

The Insight Engine is *not* a research database tool with filter-and-query patterns. It's a curated set of views designed to answer specific banker questions, presented in the same calm typography-led visual identity as the rest of the system.

---

## 2. Anonymized cross-portfolio architecture

Bankers see insights from other bankers' portfolios within Blaze, anonymized at the Member level. This is the most architecturally consequential decision.

### What gets anonymized

When Scott Brynjolffson views aggregate insights, he sees:

- **Member identity**: anonymized — appears as "Member A" or "a Specialty Manufacturer Member" or just count aggregations
- **Banker identity**: anonymized — appears as "another RM in your network" or count aggregations
- **Conversation content**: aggregated — direct quotes never surfaced for non-Scott Members; only structured field values (Signal types, response values, Track outcomes)
- **Numerical specifics**: rounded — "$75K LOC" becomes "LOC sized $50K-$100K range" for non-Scott Members

What stays visible:

- **Member Type** (Small Caterer, HVAC & Trades, Specialty Manufacturer, etc.) — required for the cohort intelligence to be useful
- **Industry Family** — same reasoning
- **Track names** — required for "this Track funded 12 of 15 times in similar Member Types"
- **Recommendation product types** — Working Capital LOC, Vehicle/Fleet Loan, etc.
- **Signal types** at the structured level — "spouse" as indecision_type; "seasonal cash flow stress" as blocker_subtype
- **Aggregate response distributions** — "8 engaged, 3 skeptical, 1 confused"
- **Stage skip patterns** — "Show was skipped 60% of the time before this Track funded"

### The architectural boundary

Every record in the system has a `banker_id` and a `member_id`. The Insight Engine layer applies anonymization through a single function:

```typescript
function anonymizeForBanker(records: Record[], viewingBanker: Banker): AnonymizedRecord[]
```

This function:
1. Strips Member.business_name, Member.address, Member.identifying_details from records where banker_id != viewingBanker.id
2. Replaces with Member Type label or count aggregation
3. Strips banker name from records where banker_id != viewingBanker.id
4. Replaces with role label or count aggregation
5. Buckets numerical specifics into ranges
6. Suppresses direct quotes (only allows structured field values through)

The function is the canonical anonymization boundary. Every Insight Engine view that surfaces cross-portfolio data flows through it. No view bypasses it.

### Demo scale honesty

The demo has three Members in three Member Types, with one active banker (Scott). True cross-portfolio anonymized intelligence requires more volume than the demo has.

For demo views that depend on cross-portfolio aggregation, the rendering pattern is:

- Show the view structure (axes, layout, visual treatment)
- Render with placeholder data that represents what production would show
- Annotate visibly: "In production scale, this would show patterns across [N] [Member Type] Members in your peer bankers' portfolios. Demo data shown is illustrative."
- Make the architectural argument visible: "the Insight Engine layer applies anonymization through `anonymizeForBanker()` regardless of data volume; rendering this view at production scale is a configuration question, not an architecture question."

This is honest about what the demo can show. It also makes the production-scaling argument explicit rather than implicit.

---

## 3. Macro layer

A Macro is a curated context entity — system-level, not banker-level — describing market, regulatory, sector, or technology developments affecting groups of Members.

### Macro entity model

```
Macro {
  id: string
  title: string                        # "Q3 supplier payment compression"
  summary: string                      # Brief description (banker-facing)
  authored_by: BankerOrSystem          # Curator (e.g., chief economist, sector specialist)
  authored_at: timestamp
  effective_period: DateRange          # When this Macro is current
  affected_industry_families: [Industry Family]
  affected_member_types: [Member Type]
  evidence_links: [URL]                # Sources supporting the Macro
  recommended_response: string         # What bankers should consider doing
  related_topics: [Topic]              # Connects to existing Topic taxonomy
}
```

A Macro is authored by economists, policy teams, or sector specialists within Blaze (or sourced from external research feeds in production). The demo includes 3-5 sample Macros authored by named curators, with realistic content.

### How Macros surface

**On the Insight Engine:** dedicated "Macro context" view listing current Macros with summaries, affected Member Types, and recommended banker responses.

**On the Member profile:** when a Member's Industry Family or Member Type matches a current Macro's `affected_*` fields, a small banner appears at the top of the page. Example:

> "Macro context · Q3 supplier payment compression — small caterers across the metro are reporting 20-30% extension in customer payment terms. Authored by Marcus Wei (Chief Economist) on Apr 15, 2026. [3 Members in your book affected]. View context →"

**In Growth Conversations (during Ask phase):** prompts can include Macro-derived suggestions. "Members affected by [Macro] commonly mention [Goal/Blocker]; consider asking about this."

### Why this matters

Per Francisco's observation: "Every financial institution has their economists, this can heavily frame learning paths and rationale." The Macro layer makes that institutional knowledge visible to relationship bankers who otherwise wouldn't see it. It also gives the Insight Engine a *top-down* contribution distinct from the *bottom-up* pattern intelligence.

### Macros vs Triggers

Triggers are per-Member Signal records captured during conversations — events affecting one specific Member that warrant a banker response. Macros are system-level entities authored independently of any specific Member, applying to groups.

A Trigger and a Macro can describe the same underlying phenomenon at different scales. "Cygnus Bioscience's customers are pulling forward orders" is a Trigger Signal on Cygnus. "Specialty manufacturers across the region are seeing pull-forward demand from supply chain disruption" is a Macro affecting many Members. The Insight Engine's "Trigger Signals rolling up to Macros" view surfaces the connection: when a critical mass of Triggers cluster around the same theme, that's a Macro emerging from the bottom up — confirmable by an economist.

### Demo content

The demo includes 3 sample Macros:

1. **"Q3 supplier payment compression — Small Caterers"** authored by chief economist on Apr 12, affecting Small Caterer Member Type. Recommends "surface seasonal cash flow stress; offer working capital LOC sized at quarter of revenue gap." Connects to Jenny's situation.

2. **"Light commercial fleet ROI window — HVAC & Trades"** authored by sector specialist on Apr 10, affecting HVAC & Trades Member Type. Recommends "highlight the 18-24 month payback; surface fleet expansion conversations." Connects to Northland's situation.

3. **"Specialty manufacturer capital event opportunities"** authored by sector specialist on Apr 5, affecting Specialty Manufacturer Member Type. Recommends "explore capital event evaluation; introduce CRE specialists for owner-occupied opportunities." Connects to Cygnus's situation.

Each Macro is realistic content (banker-grade specificity), authored by a named curator with timestamps, with explicit links to the Member Types it affects.

---

## 4. The "actionable insight" discipline

Per Francisco's question: "Can we determine what actionable means?"

The discipline that distinguishes actionable insight from noise.

### Definition

**An insight is actionable if and only if all three are true:**

1. **It changes what the banker would do or say.** The insight produces a different action than the banker would take in its absence. If the banker would proceed identically with or without seeing it, it's not actionable — it's just information.

2. **It's grounded in evidence the banker can verify.** The insight either (a) cites direct quotes from captured Conversations, (b) cites structured Signal data from captured Growth steps, (c) cites a named Macro with a named curator and authored date, or (d) cites aggregate counts with explicit data backing. Insights that can't be sourced are not surfaced.

3. **It's specific to the current context.** The insight is relevant to the specific Member, the specific opportunity, the specific stage, the specific Signal type the banker is currently working with. Generic insights ("members often want to talk to spouses about big decisions") are not actionable; specific insights ("Members at the leaning_yes stage with spouse as primary concern resolve in 73% of cases when joint call is scheduled within 2 weeks") are.

### What this filters out

- **Noisy aggregates** — "47 industries, 1759 Members, 511 business needs" type counts that overwhelm without directing action
- **Pattern descriptions without action implications** — "Small Caterers tend to have seasonal cash flow stress" — true but doesn't change banker behavior
- **Aspirational framings** — "Build deeper relationships" — not actionable
- **Generic best practices** — "Listen actively" — not specific to context
- **Statistical claims without underlying counts** — "73% conversion" without showing that the underlying N is 11 (which would invalidate the percentage in this context)

### What this surfaces

- **Specific quote callbacks** — "Six months ago Jenny said 'I just want to be able to sleep through January.' That captured Goal Signal still has no resolved Track. Worth revisiting in this conversation."
- **Cohort patterns at production scale, with explicit N** — "Members of this type with this Goal Signal resolved through Working Capital LOC in 8 of 12 cases (67%) — sourced from anonymized peer banker portfolios."
- **Macro context with curator attribution** — "Q3 supplier payment compression Macro (Marcus Wei, Chief Economist, Apr 12) suggests this Member's seasonal cash flow stress is part of a broader pattern. Recommended response: surface and offer working capital LOC."
- **Captured-vs-uncaptured gaps** — "This Member has had 3 Conversations in 2024 but no Goal Signal captured. Consider asking 'what does success look like in 18 months' during Ask phase."
- **Indecision pattern correlations** — "When 'spouse' is captured as primary_concern, scheduling joint call within 2 weeks resolves in 73% of cases. The longer the joint call delays, the more often the Recommendation declines."

### The honesty discipline

Insights that don't meet the three-criterion test are not surfaced. The system is silent rather than noisy. Bankers trust the system because when it speaks, it has something to say.

Building this discipline in from Sprint 4 onwards is more important than building lots of insights and then trying to filter them. The discipline is the design.

---

## 5. The Insight Engine's surfaces

Per Francisco's principle: "the insights should be intelligently embedded and delivered across the other pages where possible." The Insight Engine has both a destination surface (Sprint 5) and embedded surfaces (Sprint 4 cross-cutting + Sprint 5 polish).

### Surface A — The Insight Engine module (Sprint 5)

The destination surface accessible from main navigation. Five views:

**View 1 — Track performance.** For each Growth Track, shows:
- Total runs across the system (with appropriate "1 run, 0 funded yet" pluralization at demo scale)
- Stage advancement counts (how many advanced past Ask, past Size, past Show, past Resolve, past Decision pending, past Funded)
- Average time-to-decision (where N is large enough)
- Skip rates per stage (if any)
- Most common indecision types when Track stalls

For demo data: each Track has ~1 run; views show absolute counts honestly. Annotation: "At production scale, percentages and time-to-decision become meaningful with 50+ runs."

**View 2 — Member portfolio overview.** For the viewing banker's own book, shows:
- Members organized by Member Type
- Per Member: active opportunities, member_response state, last touch date, ownership
- Color-coded indicators for opportunities at risk (stale leaning_yes; overdue ActionCards)

Demo: shows Scott's three Members. Cross-banker views deferred via the anonymization architecture.

**View 3 — Coverage and indecision diagnostics.** Combined view:
- Trigger Signals surfacing without a corresponding Track to address them (coverage gaps)
- Indecision types most common across opportunities, with resolution rates
- Member Types underserved by current Tracks

Demo data is thin; views render with explicit "production data needed" annotations for cross-banker patterns.

**View 4 — Stage-skip analytics (NEW for v2).** Shows where bankers diverged from canonical Track sequences:
- Per Track: which stages were most often skipped
- Skip-vs-completion correlation with Track outcomes
- Hypothesis surfaces: "Show is skipped 60% in this Track; the chart Artifact may not be landing"

Sprint 5 work; depends on Sprint 4 capturing skip data.

**View 5 — Macro context.** Lists current Macros with summaries, affected Member Types, banker recommendations. Per §3 above.

### Surface B — Embedded inline insights

Insights surface contextually wherever they meet the three-criterion actionable test. Specific surfaces:

#### On the Member profile

**At top of page (above Suggested Next Step):** Macro banner when Member's Member Type matches a current Macro. Per §3.

**Within Open opportunities band:** A small "context callback" callout when:
- A Goal Signal captured 6+ months ago has no Track addressing it ("Jenny said 'I just want to be able to sleep through January' on Mar 12, 2024. The Working Capital LOC addresses this. Mention the historical capture in your follow-up.")
- A current Indecision pattern matches a known cohort pattern with high N

**Within History band:** Quoted callbacks to past direct statements when relevant to current opportunity. ("Capture from 9 months ago: 'winter was tough' — first surface of seasonal cash flow stress, retroactively captured.")

#### In Growth Conversations (Sprint 4 cross-cutting)

**During Ask phase:**
- Macro context banner suggests questions ("Members affected by Q3 supplier payment compression commonly mention [Goal/Blocker]; consider asking about it.")
- Prior captured Signal surfaces: "This Member has 3 Conversations on file but no captured Goal Signal. Common Goal Signals for [Member Type] in [period]: 'smooth seasonal revenue,' 'expand into new market,' 'transition ownership.'"

**During Size phase:**
- Cohort sizing context: "Members of this type with this Blocker quantified at this magnitude typically size their resolution at [range]."

**During Show phase:**
- Artifact effectiveness data: "This Artifact has been shown N times across the bank's small caterer portfolio (anonymized). Member responses: X engaged, Y skeptical, Z confused."
- Skip recommendation if applicable: "Members at this stage with this Signal pattern have been engaged 80%+ when this Artifact was shown."

**During Resolve phase:**
- Indecision-resolution patterns: "When members say 'leaning yes' with 'spouse' as primary concern, scheduling joint call within 2 weeks resolves in 73% of cases. Average resolution time: 9 days."

#### On Suggested Next Step cards

The current "high confidence" badge becomes "based on N similar Member journeys" when N is significant. The rationale paragraph includes pattern references when grounded data supports them.

### Surface integration discipline

Per the actionable-insight test (§4), inline insights only render when:
1. They change banker action
2. They're grounded in verifiable evidence  
3. They're specific to current context

If none of three criteria are met for a given moment, the surface is silent. No filler insights. No "fortune cookie" wisdom.

Specifically: do not surface insights when underlying N is below 5 (statistical claims become meaningless at low N). For demo data thinness, this means most cross-portfolio insights show as "production scale" placeholders rather than empty or fabricated content.

---

## 6. Schema additions implied by this design

Captured here for the build to incorporate at the right sprint moments. Not a prompt; just architectural inventory.

### New entities

**Macro** (per §3): authored top-down by economists/specialists. Reference data. Schema as defined in §3.

### New fields

**On GrowthStepExecution:**
- `was_skipped: boolean` — captures skip state per the Block in DEMO_BUILD_PLAN.md Sprint 4 Prompt 4.3
- `skip_confirmed_by: BankerId` — who confirmed the skip
- `skip_confirmed_at: timestamp`

**On Conversation:**
- (No additions — existing schema sufficient)

**On Signal:**
- `superseded_by: SignalId` — when a Signal is updated (e.g., signal longevity refresh in Sprint 4), the prior Signal is retained but marked superseded; the new Signal references the prior. Audit trail preserved.
- `superseded_at: timestamp`

**On Recommendation:**
- (Sprint 2 Prompt 2 already adds owned_by and updated_at)
- No further additions required

**Anonymization layer:**
- Not a schema change — an application-layer function that runs at Insight Engine query time per §2.

### Reference data additions

The demo seed data extends to include:
- 3 sample Macros per §3 (authored by Marcus Wei, sector specialists)
- (Optional, depending on Surface B detail) — synthesized "peer Member" anonymized records to back specific cohort patterns. Per Francisco's earlier guidance against synthesized data dressed as real, prefer "production scale annotation" approach instead.

---

## 7. Build implications

This document implies the following work, which DEMO_BUILD_PLAN.md v2.1 incorporates:

### Sprint 4 (Growth Conversations module) — additions

- Inline insight surfaces during Ask, Size, Show, Resolve phases per Surface B above
- Macro context banner integration (when Macros exist in seed data)
- Skip-state schema fields per §6
- Signal superseded-by tracking per §6 (signal longevity)

These are integrated alongside the capture form work, not bolted on after. The actionable-insight discipline (§4) applies from the first capture form built.

### Sprint 5 (Insight Engine module) — restructure

Five views per §5 Surface A. Anonymization layer per §2. Macro entity and view per §3.

Most cross-portfolio views render with explicit "production scale" annotations at demo data volumes. The Macro view is the one that renders with full demo data (3 sample Macros).

Stage-skip analytics (View 4) becomes meaningful only after Sprint 4 captures real skip data. Order-of-prompts within Sprint 5 should reflect this.

### Cross-cutting

Sprint 2 Prompt 2 already captures the foundation (Recommendation.owned_by + updated_at). No additional Sprint 2 work required.

Sprint 3 (multi-Member generalization) doesn't require Insight Engine work, but the pages it generalizes should include the Macro banner surface when Member matches a Macro's affected_member_types.

Sprint 6 (deployment + polish) includes a final pass on inline insight discipline — verifying that the actionable-insight test holds across all surfaces.

---

## 8. What this rules out

To prevent scope creep, here's what this design explicitly does NOT include:

- **Cross-institutional insights** — anonymized peer data is within Blaze only. Cross-bank intelligence requires consent infrastructure that doesn't exist for the demo and isn't credibly demonstrable.
- **Functional role as a slicing axis** — relationship banking targets the Member (the business), not contacts within the business. Functional role from the original Joseph Adelman mockup is not incorporated.
- **Database-query-tool aesthetics** — the Insight Engine matches the rest of the system's calm typography-led identity. No filter+results research-tool patterns.
- **Synthesized aggregate data dressed as real** — when demo data is thin, surfaces explicitly annotate "this is what production would show" rather than fabricating.
- **Real-time research feeds** — Macros are authored entities, not auto-populated from external sources. Production may add external sourcing later; demo uses authored seed data.
- **Banker-personalized priority weighting on insights** — all bankers see the same insights for the same context. Personalization is post-demo.
- **AI-generated insight prose** — insight surfaces use templated prose with structured field substitution per the lib/summaries.ts pattern. No generative LLM calls in the demo.

---

## 9. Open questions to log against this design

Items to add to OPEN_QUESTIONS.md if not already logged:

- **Q-019**: At what N does a cohort insight become surfaceable? Currently §5 says N≥5. Validate at production data scale; may need tier system (N<5: hidden; N=5-19: shown with low-confidence framing; N≥20: shown as standard insight).
- **Q-020**: How does Macro effective_period interact with Member display? If a Macro expired 30 days ago but Member's situation still matches it, do we still show? Default: show with "expired" label and prompt for re-authoring.
- **Q-021**: Anonymized peer banker insights at production scale — will bankers feel comfortable with their portfolios visible in aggregate even with anonymization? Pilot phase consent question.
- **Q-022**: Macro authoring workflow for production — who can author? Editorial review process? Out of scope for demo.

---

## 9.5 Addendum — Bridge to current OPEN_QUESTIONS state and Sprint 4 Prompt 4.2b implications

**Added 2026-04-27 after Sprint 4 Prompt 4.2a refinement turn 2. The original §9 (Q-019–Q-022) above remains the design-time question list. This addendum cross-references questions logged against the design since drafting, notes Q-041's resolution status, and identifies which §5 Surface B insertion points are in scope vs deferred for the upcoming Sprint 4 Prompt 4.2b.**

### 9.5.1 OPEN_QUESTIONS Q-023 through Q-042 — Insight Engine relevance

Questions logged in OPEN_QUESTIONS.md after this design document was drafted, with section affected and current status:

| Q-ID | Topic | Section affected | Status |
|---|---|---|---|
| Q-023 | Macro authors not seeded as Banker entities | §3 Macro entity | Open / Deferred to Pilot |
| Q-024 | ArtifactParameterCapture seed empty | Sprint 4 acceptance criteria; §5 Surface A future cohort insight | Open / Resolves with 4.2b |
| Q-025 | Signal supersession schema unused in seed | §6 (Signal.superseded_by); §5 Surface B history-band callbacks | Open / Revisit during 4.2 visual review |
| Q-026 | GrowthStepExecution skip-state schema unused | §5 Surface A View 4 (stage-skip analytics) | Open / Revisit during 4.3 |
| Q-028 | Stale signal threshold | §4 actionable-insight discipline; §5 Surface B history-band callbacks | Open / Validate during Sprint 5 |
| Q-029 | Track-agnostic step_phase enum architecture | §5 Surface A View 1 (Track performance), View 4 (stage-skip) | Open / Resolves with 4.2–4.4 experience |
| Q-030 | Conversation defaults for Growth Conversations sessions | §5 Surface A views over conversation type/channel/sentiment | Open / Resolves in 4.4 |
| Q-032 | Persistent Macro context banner dismissal | §3 Macro banner UX | Open / Deferred to Pilot |
| Q-034 | Macro authorship governance (production) | §3; supersedes/extends Q-022 (original §9) | Open / Deferred to Pilot |
| Q-035 | Topic-level question library | §5 Surface B Ask-phase insertion points | Open / Deferred to Pilot |
| Q-036 | SizingMeasurement.confidence required | Sprint 5 confidence-stratified analytics | Open / Revisit Sprint 5 |
| Q-037 | Resolve ActionCard owner default | §5 Surface A View 2 (Member portfolio overview); cross-banker handoff visibility | Open / Verify during 4.2a visual review |
| Q-038 | Closing notes routed to Conversation.banker_note | §5 Surface A indecision/closure analytics — UNION across two locations required | Acceptable for demo; Pilot reconsiders |
| Q-039 | State-machine vs event-log for lifecycle stages | §5 Surface A "time from Resolve to commit" duration analytics — not computable in current schema | Acceptable for demo; Pilot reconsiders |
| Q-041 | Primary concern dropdown context-aware refactor | §5 Surface A View 3 (indecision diagnostics) — see §9.5.2 below | In active resolution |
| Q-042 (proposed) | Pre-application structural-fit observation capture | §5 Surface A View 3; fair-lending paper-trail concern | Proposed, not yet logged |

Questions NOT directly affecting the Insight Engine (logged for completeness, not tracked here): Q-027 (anchor progress bar small viewport), Q-031 (multi-tab editing), Q-033 (stage-label hyperlinks during 4.1d→4.2 transition), Q-040 (committed vs funded visual distinction — UI question with marginal analytics implication via Q-039).

Q-022 (original §9) is superseded by Q-034 — the Macro authoring workflow question logged at higher fidelity during 4.1d visual review. Treat Q-034 as canonical going forward; Q-022 remains in §9 as a historical record of the design-time framing.

### 9.5.2 Q-041 status note — directional fallacy and resolution-pending

Q-041 surfaces a directional confusion in the Resolve form's Primary concern field that is consequential for §5 Surface A View 3 (indecision diagnostics) analytics:

- For `member_response ∈ {engaged, leaning_yes, committed}` — Primary concern answers *"what's the open thread keeping this from advancing?"* (member-side, pre-decline)
- For `member_response ∈ {declined, dismissive}` — Primary concern was being repurposed to answer *"why did the member decline?"* (member-side, post-decline) — but the original Q-041 framing said *"actual reasons banks decline lending products,"* which conflates two formally distinct events: bank-decline (the bank denies a member's application; ECOA Reg B adverse action notice with FFIEC reason codes) and member-decline (the member chooses not to proceed with an offer the bank made).

The decline-reason taxonomy proposed during refinement-turn-2 (12 values: `rate_uncompetitive | terms_unfavorable | timing_wrong | competitor_chosen | no_longer_needed | doesnt_qualify_credit | doesnt_qualify_collateral | doesnt_qualify_dti | bank_relationship_concern | internal_objection | product_misfit | other`) inherits the directional confusion — the three `doesnt_qualify_*` values are bank-decline events, while the remaining nine are member-decline events.

**Implications for §5 Surface A View 3 (indecision diagnostics):**

- Aggregations over a mixed-direction enum produce blended signal classes that don't map cleanly to either *"we lost on competitiveness"* (sales/positioning lesson) or *"our underwriting box doesn't fit this Member Type"* (product/risk-policy lesson).
- Pre-application structural-fit observations (the `doesnt_qualify_*` cases) carry fair-lending paper-trail considerations distinct from member-decline events. Per FFIEC Interagency Fair Lending Examination Procedures, pre-application screening is a recognized disparate-impact risk area; logging structural-disqualification observations against Member-Type cohorts in a pre-application context creates a record set that fair-lending examiners scrutinize. Demo phase carries no real exposure (no real members; no real adverse actions); Pilot phase inherits whatever schema shape ships from the demo unless explicitly redesigned.

**Resolution status:** Open. Three options under consideration:

- **Option A** — Strict member-direction (drop `doesnt_qualify_*`; replace with one `structural_fit_issue` value). Sidesteps fair-lending concern; loses some granularity. *Recommended pending Sprint 5 evidence to the contrary.*
- **Option B** — Two-field model (add `decline_party` enum: `member | bank | mutual`; constrain values per party). Preserves granularity; doubles capture cost; cleanest analytics.
- **Option C** — Ship 12 values as proposed. Zero further iteration; bakes directional confusion into schema.

Q-042 (proposed) covers pre-application structural-fit observation capture as a distinct field with appropriate retention/access policy if Option A is selected. Resolution pending Sprint 4 Prompt 4.2a refinement-turn-2 acceptance.

### 9.5.3 Sprint 4 Prompt 4.2b — §5 Surface B insertion points in scope vs deferred

Sprint 4 Prompt 4.2b ships Show + Connect capture forms plus Artifact clickability fix. Surface B insertion-point status:

**In scope for 4.2b:**

- **Show phase — Artifact effectiveness data** (per §5 Surface B *During Show phase* first bullet). At demo data thinness (each Artifact has been shown ≤1 time), this renders as production-scale-annotated placeholder per §2 *Demo scale honesty* rather than fabricated counts. The architectural primitive — `anonymizeForBanker()` applied to Artifact share records grouped by Member Type — is what's demonstrated; the data backing it accumulates in Sprint 5.
- **Show phase — Skip recommendation** (per §5 Surface B *During Show phase* second bullet). Same production-scale annotation pattern. Acceptable to defer to Sprint 5 polish if 4.2b's Show form UX feels incomplete without it during visual review; not a 4.2b acceptance gate.
- **Connect phase — handoff context** (not explicit in original §5 Surface B; implied for Cygnus's specialist-handoff Track). When the Connect form is reached, an inline insight surfaces "This Track's Connect step has been engaged N times across the bank's [Member Type] portfolio with handoff completion rate of X%." Same production-scale annotation pattern at demo scale. Architecturally analogous to Show-phase Artifact effectiveness; symmetry argues for inclusion.

**Deferred to later prompts:**

- **Resolve phase — Indecision-resolution patterns** (per §5 Surface B *During Resolve phase*). The indecision-pattern correlation insights are Sprint 4 Prompt 4.4 territory, not 4.2b. The Resolve form already shipped in 4.2a; insight surfaces over it land in 4.4 alongside atomic save and ActionCard editing.
- **Ask phase — Macro-derived prompts and prior-Signal surfacing** (per §5 Surface B *During Ask phase*). Already shipped in 4.1c (augmenting summary pattern) and 4.1d (Macro context banner integration). Not 4.2b work.
- **Size phase — cohort sizing context** (per §5 Surface B *During Size phase*). Sprint 4 Prompt 4.2a Block B shipped the Size capture form without this inline surface; deferred to Sprint 5 polish given demo data thinness (one SizingMeasurement per dimension at most).

### 9.5.4 §8 rule-outs to verify against during 4.2b

§8 explicitly rules out several behaviors that 4.2b implementations should not cross:

- **No synthesized aggregate data dressed as real.** Show-phase *N times across the portfolio* insights at demo scale must annotate "this is what production would show" rather than fabricating counts. Pre-populated Artifact parameters from member profile / captured signals / prior Recommendations are NOT synthesized aggregates — they're real captured values; this rule-out doesn't apply to them. The rule-out applies specifically to the cohort/effectiveness inline insight surfaces.
- **No AI-generated insight prose.** Templated prose with structured field substitution per the `lib/summaries.ts` pattern only. The Show form's parameter pre-population logic itself is allowed (it's pulling structured field values, not generating prose); the inline insights *about* the parameters/Artifact are templated.
- **No banker-personalized priority weighting.** All bankers see the same Show-phase insights for the same context.
- **No real-time research feeds.** Macros remain authored seed entities; if 4.2b's Connect form references Macro context for handoff routing, it pulls from the same seeded Macros, not external sources.

Per §4's three-criterion actionable-insight test, 4.2b's inline insights only render when they (1) change banker action, (2) are grounded in verifiable evidence, (3) are specific to current context. At demo data thinness, most cohort/effectiveness insights fail criterion 2 (N too small to be evidence-grounded); the production-scale annotation pattern is the honest treatment.

---

## 10. Closing principle

The Insight Engine's job is to make institutional intelligence accessible to the individual banker without overwhelming them. The discipline that achieves this is the actionable-insight test: only surface what changes behavior, only when grounded in evidence, only when specific to context.

A noisy Insight Engine destroys banker trust faster than an empty one. Build for silence-by-default; let actionable insights earn their visibility through the three-criterion test.

The Member profile and Growth Conversations are the operational surfaces — where bankers do their job. The Insight Engine is the intelligence layer that makes those operational surfaces smarter without taking attention away from them. When the design works, bankers don't feel like they're using two tools; they feel like the system knows things and tells them at the right moments.
