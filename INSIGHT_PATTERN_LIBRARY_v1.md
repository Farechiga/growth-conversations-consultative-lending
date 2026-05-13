# Insight Pattern Library v1 — Canonical Source Data

**Draft for Francisco's review.** Hand-authored canonical Patterns for the EVP demo: ~36 Patterns covering 5 lending Tracks × Signal-tag combinations relevant to Jenny / Northland / Cygnus fixtures. Authored to the standard articulated through architectural conversation — Member-Type-agnostic content, growth-capital connection, growth-horizon expansion, 200-char discipline.

**Authored:** by Claude. **Status:** Strawman for Francisco's editorial pass (Section 7 review prompts at end).

**Discipline applied throughout:**

- Patterns are Member-Type-agnostic in *content*; Member-Type origin/applicability is metadata for library navigation.
- Each Pattern is roughly 200 characters in content (some intentionally shorter for tight phrasing).
- Each Pattern has 2-3 Rackham-style implication questions designed to develop the underlying problem with the Member.
- All content honors COMPLIANCE.md §10.2 banned-phrase discipline. No "Recommended for", "Eligible for", "Pre-qualified", "Approved" framings.
- Patterns connect captured business reality to growth capital reasoning — not generic banking platitudes.
- Insight type is `reframe` (reinterprets a captured fact) or `implication` (develops a consequence the Member hasn't articulated).

**How this content is used by Sprint 5b.1:**

- Section 1 (factor catalog reference) → links the library to the canonical factor matrix from Sprint 5a
- Section 2-6 (Patterns by Track) → seed data for `InsightPattern` entity
- Section 7 (per-fixture insight expectations) → orientation for what Insights and Patterns should appear in demo
- Section 8 (editorial review prompts) → Francisco's editorial pass before sprint execution

---

## Section 1 — Library structure

### 1.1 Pattern schema reminder

Each Pattern records:

- **id:** `PATTERN-NNN` identifier (sequential)
- **track_id:** which Track this Pattern serves (TRACK-001 through TRACK-005)
- **signal_tag_scope:** which Signal-tag this Pattern addresses (e.g., `cashflow_volatility`, `capacity_limit`, `real_estate`)
- **insight_type:** `reframe` or `implication`
- **content:** 200-char canonical statement (Member-Type-agnostic)
- **implication_questions:** 2-3 Rackham-style starter questions
- **member_type_origins:** Member-Types where Pattern was observed/authored (metadata)
- **member_type_applicability:** `broad` or specific list (senior judgment)
- **status:** `approved` for all demo seed Patterns

### 1.2 Track coverage

The 36 demo Patterns distribute across 5 Tracks:

- **TRACK-001 — Working Capital LOC:** 9 Patterns (Jenny's primary Track; needs richest coverage)
- **TRACK-002 — Vehicle/Fleet Loan:** 7 Patterns (Northland's primary)
- **TRACK-003 — CRE Term Loan:** 8 Patterns (Cygnus's primary)
- **TRACK-004 — SBA 7(a):** 6 Patterns (cross-cutting)
- **TRACK-005 — Treasury Services Upgrade:** 6 Patterns (non-credit Track)

### 1.3 Signal-tag coverage

Patterns address common Signal-tag combinations from the matrix:

- `cashflow_volatility`, `customer_concentration`, `capacity_limit`, `aging_equipment`, `real_estate`, `regulatory_compliance`, `co_decision_maker_input`, `external_advisor_input`, `late_paying_customer`, `capacity_evaluation`, `equipment_breakdown`, `customer_growth_announcement`, `refinancing_window`, `smooth_seasonal_revenue`, `expand_capacity`, `acquire_real_estate`

### 1.4 Insight type distribution

Approximately 60% `reframe` (reinterprets captured facts to shift Member perspective) and 40% `implication` (develops not-yet-articulated consequences). Bankers use both depending on conversation moment.

---

## Section 2 — TRACK-001 Working Capital LOC Patterns (9 Patterns)

Patterns for Working Capital LOC address cashflow timing mismatches, customer payment stretching, seasonal volatility, and the capacity to pursue growth opportunities currently constrained by working capital tightness.

---

**PATTERN-001**
- track_id: TRACK-001
- signal_tag_scope: `cashflow_volatility`
- insight_type: `reframe`
- content: *"Seasonal cashflow gaps are not a survival problem to manage — they are the structural constraint preventing growth opportunities the business already sees but cannot pursue."*
- implication_questions:
  - "What opportunities have you turned down in the past two years because the timing didn't work for your cashflow?"
  - "If working capital weren't the bottleneck, what would your business say yes to next quarter?"
  - "How often do you delay decisions until the cash position recovers?"
- member_type_origins: ['catering', 'specialty_retail', 'agriculture', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-002**
- track_id: TRACK-001
- signal_tag_scope: `cashflow_volatility`
- insight_type: `implication`
- content: *"Cashflow volatility transfers operational risk from customers to the business, where it limits decisions far beyond the trough months themselves."*
- implication_questions:
  - "When the slow season hits, how does that affect decisions you make in the strong season?"
  - "Do you find yourself running the business more conservatively year-round because of seasonal swings?"
  - "What does the volatility cost in opportunities you don't even consider?"
- member_type_origins: ['catering', 'hospitality', 'tourism', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-003**
- track_id: TRACK-001
- signal_tag_scope: `late_paying_customer`
- insight_type: `reframe`
- content: *"Customers stretching payment terms are not a relationship problem — they are evidence the business is financing customer operations through its own working capital."*
- implication_questions:
  - "When customers pay 60+ days, are you essentially funding their cashflow?"
  - "What would change in your operations if those receivables converted to cash 30 days sooner?"
  - "Do your largest customers know they are leveraging your working capital?"
- member_type_origins: ['catering', 'hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-004**
- track_id: TRACK-001
- signal_tag_scope: `late_paying_customer`
- insight_type: `implication`
- content: *"When receivables stretch, the business absorbs the gap through reduced operating flexibility — every late payment is a deferred decision the business cannot make."*
- implication_questions:
  - "What decisions do you defer when a major customer payment is late?"
  - "How much of your operating runway is tied up in receivables at any given time?"
  - "If the AR cycle compressed by 30 days, what would you do differently?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-005**
- track_id: TRACK-001
- signal_tag_scope: `customer_concentration`
- insight_type: `reframe`
- content: *"Concentrated AR is not just a risk story — it is a structural lock-in that constrains pricing, timing, and opportunity to diversify."*
- implication_questions:
  - "How does concentration with your top customers shape your pricing flexibility?"
  - "What would you do differently if your top customer represented 20% rather than 50% of revenue?"
  - "Are there customers you cannot afford to disappoint, even when their terms work against you?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-006**
- track_id: TRACK-001
- signal_tag_scope: `smooth_seasonal_revenue`
- insight_type: `reframe`
- content: *"The aspiration to smooth cashflow often hides a deeper aspiration: to operate the business from a position of choice rather than necessity."*
- implication_questions:
  - "If cashflow were predictable year-round, what would you focus on instead of survival planning?"
  - "What does running the business from a position of choice look like to you?"
  - "Where do you currently make decisions reactively that you would prefer to make proactively?"
- member_type_origins: ['catering', 'tourism', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-007**
- track_id: TRACK-001
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `reframe`
- content: *"A shared financing decision is not an obstacle — it produces aligned ownership of the facility, which is what makes it actually work in operations."*
- implication_questions:
  - "What does aligned ownership of a financial decision look like in your business?"
  - "When you and your co-decision-maker work through this together, what concerns matter most to each of you?"
  - "How would the conversation be different if you had a clear shared framework?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-008**
- track_id: TRACK-001
- signal_tag_scope: `capacity_to_service_debt`
- insight_type: `implication`
- content: *"Hesitation to take on a facility often reflects uncertainty about future cashflow stability, not about the facility itself — the question worth examining is the predictability assumption."*
- implication_questions:
  - "What aspects of your future cashflow feel certain, and what feels uncertain?"
  - "If we modeled the facility against your most cautious cashflow scenario, would the picture change?"
  - "What information would help you evaluate this with confidence?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-009**
- track_id: TRACK-001
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"Bringing in an outside advisor is not a hesitation step — it is a way to make the decision durable so the business isn't revisiting it under pressure later."*
- implication_questions:
  - "What questions would your CPA want answered before signing off on this?"
  - "How can we make sure the advisor has what they need to give a clear view?"
  - "What does decision durability look like in your business — what would make this stick?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 3 — TRACK-002 Vehicle/Fleet Loan Patterns (7 Patterns)

Patterns for Vehicle/Fleet Loan address operational capacity constraints, equipment aging, demand pressure, and the cost of declined work.

---

**PATTERN-010**
- track_id: TRACK-002
- signal_tag_scope: `capacity_limit`
- insight_type: `reframe`
- content: *"When operational capacity caps demand, every customer the business turns away today is one a competitor builds a relationship with — those customers don't recover later."*
- implication_questions:
  - "How often have you turned down work because of capacity constraints?"
  - "Where do those customers go when you can't take their job?"
  - "What does the lifetime relationship cost of one declined job actually total?"
- member_type_origins: ['hvac_trades', 'plumbing', 'specialty_construction', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-011**
- track_id: TRACK-002
- signal_tag_scope: `capacity_limit`
- insight_type: `implication`
- content: *"Capacity at the operational ceiling forces the business to prioritize among customers — but that triage compounds into customer relationship risk over time."*
- implication_questions:
  - "When you have to choose between customers, what factors guide your decisions?"
  - "Are some customers waiting longer than others, and what does that pattern look like over a year?"
  - "What's the customer relationship cost of consistently being at capacity?"
- member_type_origins: ['hvac_trades', 'plumbing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-012**
- track_id: TRACK-002
- signal_tag_scope: `aging_equipment`
- insight_type: `reframe`
- content: *"Equipment past its useful life is not just a maintenance problem — it is a daily decision tax that consumes management attention better spent on growth."*
- implication_questions:
  - "How much management time goes into managing the aging equipment situation?"
  - "What growth conversations are getting deferred because of equipment-driven attention demands?"
  - "If the equipment situation were resolved, what would your team focus on instead?"
- member_type_origins: ['hvac_trades', 'plumbing', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-013**
- track_id: TRACK-002
- signal_tag_scope: `equipment_breakdown`
- insight_type: `implication`
- content: *"An equipment failure that triggers a financing conversation is rarely about the failed unit — it is the moment the broader fleet question becomes unavoidable."*
- implication_questions:
  - "When this unit failed, what did it tell you about the rest of the fleet?"
  - "How many of your other vehicles are approaching the same point?"
  - "Is this the moment to think about the fleet strategically rather than reactively?"
- member_type_origins: ['hvac_trades', 'plumbing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-014**
- track_id: TRACK-002
- signal_tag_scope: `expand_capacity`
- insight_type: `reframe`
- content: *"Expanding fleet capacity is not just buying more vehicles — it is committing the business to a larger operational footprint and the customer relationships that footprint enables."*
- implication_questions:
  - "What customer relationships have you been holding back from pursuing because of capacity?"
  - "If the fleet doubled, what would your sales pipeline look like in a year?"
  - "What kind of business do you want to be running in three years?"
- member_type_origins: ['hvac_trades', 'plumbing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-015**
- track_id: TRACK-002
- signal_tag_scope: `capacity_evaluation`
- insight_type: `implication`
- content: *"The decision to evaluate capacity is itself a signal — it usually means demand has been pressuring operations long enough that the business cannot ignore it anymore."*
- implication_questions:
  - "What finally made the capacity question urgent enough to act on?"
  - "How long has the demand pressure been building before this conversation?"
  - "What would have happened if you delayed this evaluation another six months?"
- member_type_origins: ['hvac_trades', 'plumbing', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-016**
- track_id: TRACK-002
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"A CPA's perspective on a fleet financing decision frames the question in tax and depreciation terms — useful structure, not friction in the path."*
- implication_questions:
  - "What does your CPA typically focus on when evaluating capital equipment decisions?"
  - "Are there tax structuring elements that would change which financing approach makes sense?"
  - "How can we make sure your CPA has the operational picture to evaluate cleanly?"
- member_type_origins: ['hvac_trades', 'plumbing', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 4 — TRACK-003 CRE Term Loan Patterns (8 Patterns)

Patterns for CRE Term Loan address physical footprint constraints, growth-driven facility decisions, decision-process complexity for material commitments, and relationship-led financing positioning.

---

**PATTERN-017**
- track_id: TRACK-003
- signal_tag_scope: `real_estate`
- insight_type: `reframe`
- content: *"Real estate constraints are not just operational ceilings — they are decisions the business has been making by default, accepting growth limits without articulating them."*
- implication_questions:
  - "What growth assumptions have you been making implicitly because of the current footprint?"
  - "If physical space weren't the constraint, what would the business plan look like?"
  - "How often does the footprint enter into decisions about customers, products, or hires?"
- member_type_origins: ['specialty_manufacturing', 'specialty_retail', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-018**
- track_id: TRACK-003
- signal_tag_scope: `real_estate`
- insight_type: `implication`
- content: *"A facility constraint at 80%+ utilization compounds — every additional commitment requires either rejecting work or accepting operational stress that erodes execution quality."*
- implication_questions:
  - "What's the quality cost of operating at the current capacity?"
  - "Where does the 'we can fit it in' mindset start to break down?"
  - "What kinds of customers do you pass on because the footprint can't accommodate them?"
- member_type_origins: ['specialty_manufacturing', 'specialty_retail', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-019**
- track_id: TRACK-003
- signal_tag_scope: `customer_growth_announcement`
- insight_type: `reframe`
- content: *"When anchor customers signal volume increases, the question is not whether to expand — it is whether expansion arrives ahead of the demand or behind it."*
- implication_questions:
  - "How aligned is your expansion timeline with your anchor customers' growth?"
  - "What's the cost of expanding behind demand rather than ahead of it?"
  - "Have you and the anchor customers had a direct conversation about timing?"
- member_type_origins: ['specialty_manufacturing', 'specialty_retail', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-020**
- track_id: TRACK-003
- signal_tag_scope: `acquire_real_estate`
- insight_type: `reframe`
- content: *"Acquiring real estate is not just a financing decision — it is a long-term commitment to a specific operational geometry that shapes the business for a decade."*
- implication_questions:
  - "What does the business need to look like in 10 years to make this footprint right?"
  - "What growth scenarios change which property structure makes sense?"
  - "If the current customers grow as expected, will this footprint serve them in 5 years?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-021**
- track_id: TRACK-003
- signal_tag_scope: `expand_capacity`
- insight_type: `implication`
- content: *"A capacity expansion decision involves more than financing — it commits the business to operational scale that requires hires, processes, and management capability the founder may not yet have."*
- implication_questions:
  - "What does the leadership team need to look like to operate the expanded business?"
  - "What systems and processes will need to be in place to scale into the new footprint?"
  - "What aspects of running a larger operation feel comfortable, and what feels new?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-022**
- track_id: TRACK-003
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `reframe`
- content: *"Board-level input on a material commitment is not a delay mechanism — it produces the institutional memory needed to execute the decision well over years."*
- implication_questions:
  - "What perspectives does the board bring that the operating team might miss?"
  - "How can we structure the materials so the board engages with the decision substantively?"
  - "What concerns from the board would shift the decision parameters?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-023**
- track_id: TRACK-003
- signal_tag_scope: `refinancing_window`
- insight_type: `implication`
- content: *"A refinancing window is not just about rate — it is the rare moment when the business can renegotiate the underlying structure of its capital relationships."*
- implication_questions:
  - "Beyond rate, what aspects of the current financing structure don't fit the business as it is now?"
  - "What flexibility would matter most in a renegotiated facility?"
  - "If we redesigned the capital structure from scratch, what would change?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-024**
- track_id: TRACK-003
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"An advisor's review of a material commitment is not friction — it surfaces structural questions early, before they show up as constraints in the operational reality."*
- implication_questions:
  - "What structural questions has your advisor raised that would benefit from early discussion?"
  - "Where might the advisor's perspective shift assumptions we have been making?"
  - "How can we engage the advisor at the framing stage rather than the review stage?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 5 — TRACK-004 SBA 7(a) Patterns (6 Patterns)

Patterns for SBA 7(a) address use-of-proceeds clarity, eligibility framing, the value of SBA structure for specific situations, and timeline tolerance.

---

**PATTERN-025**
- track_id: TRACK-004
- signal_tag_scope: `regulatory_compliance`
- insight_type: `reframe`
- content: *"SBA paperwork is not a hurdle to push through — it is structure that benefits both sides by making the underwriting question fully explicit."*
- implication_questions:
  - "What aspects of the business benefit from being articulated cleanly for outside review?"
  - "Where would clarity about the financial picture help internal decision-making too?"
  - "What does it mean for the business to have its case formally documented?"
- member_type_origins: ['catering', 'hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-026**
- track_id: TRACK-004
- signal_tag_scope: `capacity_to_service_debt`
- insight_type: `implication`
- content: *"SBA structure produces longer terms and partial guarantees — which means the question is not 'can we afford the payment' but 'does the longer commitment fit the business plan'."*
- implication_questions:
  - "What does the business look like at the end of a longer term — does the commitment still make sense then?"
  - "How does payment timing align with the operational cashflow cycle?"
  - "What flexibility do you need in the structure to keep options open?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-027**
- track_id: TRACK-004
- signal_tag_scope: `expand_capacity`
- insight_type: `reframe`
- content: *"SBA financing for expansion is not a fallback — it is the right structure when the business needs longer terms than conventional credit, and the use-of-proceeds case is clear."*
- implication_questions:
  - "What does longer-term financing enable that shorter-term wouldn't?"
  - "Is the use-of-proceeds case clear enough to articulate in one paragraph?"
  - "Where does the conventional credit structure constrain the business plan?"
- member_type_origins: ['catering', 'hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-028**
- track_id: TRACK-004
- signal_tag_scope: `refinancing_window`
- insight_type: `implication`
- content: *"Refinancing existing debt into SBA structure is rarely about rate alone — it usually addresses term mismatch where short-term financing is propping up long-term operational decisions."*
- implication_questions:
  - "What's the term-fit of the existing debt — does it match the assets it financed?"
  - "Where is short-term financing supporting decisions that should sit on longer terms?"
  - "What flexibility do you lose by carrying debt that doesn't fit the business cycle?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-029**
- track_id: TRACK-004
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"A CPA helps SBA structure by translating operational reality into the financial framing the program requires — they make the case visible, not different."*
- implication_questions:
  - "What does your CPA see in the financial picture that we should make sure surfaces in the package?"
  - "Where does operational reality differ from how the financials look on paper?"
  - "How can the CPA's perspective sharpen the case rather than complicate it?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-030**
- track_id: TRACK-004
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `reframe`
- content: *"SBA timelines work in favor of decisions that need shared input — the 60-90 day process gives the business space to align rather than rushing the conversation."*
- implication_questions:
  - "How does the timeline fit your shared decision process?"
  - "What conversations need to happen during that window to land the decision well?"
  - "Where would a faster timeline actually be a disadvantage?"
- member_type_origins: ['catering', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 6 — TRACK-005 Treasury Services Upgrade Patterns (6 Patterns)

Patterns for Treasury Services Upgrade address operational cashflow management, the value of treasury infrastructure beyond credit, and the relationship deepening that treasury adoption represents.

---

**PATTERN-031**
- track_id: TRACK-005
- signal_tag_scope: `cashflow_volatility`
- insight_type: `reframe`
- content: *"Treasury services that smooth daily cash positioning are not just convenience — they reduce the operational tax of managing volatility manually."*
- implication_questions:
  - "How much management time goes into manual cash positioning each week?"
  - "What decisions get deferred because cash visibility isn't real-time?"
  - "If cash management ran in the background, what would you focus on instead?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-032**
- track_id: TRACK-005
- signal_tag_scope: `customer_concentration`
- insight_type: `implication`
- content: *"When AR is concentrated, treasury services that automate collection and payment timing reduce single-customer cashflow risk by smoothing the operational impact."*
- implication_questions:
  - "When your largest customer pays late, what does that do to the rest of the operation?"
  - "Where could automated treasury infrastructure absorb timing variability?"
  - "What treasury capabilities would you build first if starting from scratch?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-033**
- track_id: TRACK-005
- signal_tag_scope: `expand_capacity`
- insight_type: `implication`
- content: *"Operational scale brings transaction-volume changes that small-business banking infrastructure cannot absorb gracefully — treasury upgrade is often a precondition to scale, not a result of it."*
- implication_questions:
  - "Where does the current banking infrastructure constrain operational decisions?"
  - "What transaction-volume changes are coming with growth, and is the infrastructure ready?"
  - "What would the operations look like if banking scaled with the business?"
- member_type_origins: ['catering', 'hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-034**
- track_id: TRACK-005
- signal_tag_scope: `regulatory_compliance`
- insight_type: `reframe`
- content: *"Treasury services produce the audit-trail and reconciliation infrastructure that compliance and tax conversations require — not as overhead, but as durable operational backbone."*
- implication_questions:
  - "What aspects of compliance currently consume operational attention that infrastructure could absorb?"
  - "Where would clean reconciliation save time at year-end or in tax planning?"
  - "What audit-trail gaps would benefit from systematized capture?"
- member_type_origins: ['catering', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-035**
- track_id: TRACK-005
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `reframe`
- content: *"Shared visibility into cashflow positioning is itself a treasury capability — it changes how co-decision-makers engage with operational decisions."*
- implication_questions:
  - "Where does shared visibility into cash positioning matter most for the decisions you make together?"
  - "What gets discussed weekly or monthly that real-time visibility would shift?"
  - "How would the conversation be different with a shared dashboard rather than retrospective reports?"
- member_type_origins: ['catering', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-036**
- track_id: TRACK-005
- signal_tag_scope: `customer_growth_announcement`
- insight_type: `implication`
- content: *"Customer-growth signals arriving without treasury infrastructure ready to scale produce operational fragility — the growth lands faster than the systems supporting it."*
- implication_questions:
  - "If volume increases 25% in the next six months, what breaks first in the current banking setup?"
  - "Where would you want infrastructure ahead of growth rather than behind it?"
  - "What does operational readiness for customer-growth look like in your business?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 7 — Per-fixture insight expectations

For Sprint 5b.1 demo seed, each fixture gets ~3 routine Insights (matching canonical Patterns) + 1 novel Insight (intentionally not matching, to demonstrate that pathway).

### 7.1 Jenny's seed Insights

**Routine 1** (matches PATTERN-001 — cashflow_volatility reframe):
- Addresses: Apr 8 seasonalSignal Blocker
- Insight type: reframe
- Content: *"Jenny's January cashflow gap is the constraint preventing her from saying yes to corporate event opportunities she has been turning down."*
- Cached match: PATTERN-001 (high confidence ~0.85)
- Cached LLM feedback: *"Excellent observation! We often see that seasonal cashflow gaps are the structural constraint preventing growth opportunities the business already sees but cannot pursue."*

**Routine 2** (matches PATTERN-003 — late_paying_customer reframe):
- Addresses: Dec 2025 receivables Blocker
- Insight type: reframe
- Content: *"Jenny's 60+ day customer payments mean she is financing her corporate clients' operations through her own working capital."*
- Cached match: PATTERN-003 (high confidence ~0.82)
- Cached LLM feedback: *"Excellent observation! Customers stretching payment terms typically indicates the business is financing customer operations through its own working capital."*

**Routine 3** (matches PATTERN-007 — co_decision_maker_input reframe):
- Addresses: Jenny's Indecision Signal (husband review)
- Insight type: reframe
- Content: *"Mike's review isn't a delay step — it ensures aligned ownership of the facility, which is what makes it work in operations."*
- Cached match: PATTERN-007 (high confidence ~0.79)
- Cached LLM feedback: *"You're catching something key about shared decision-making — what concerns matter most to each of you when you work through this together?"*

**Novel 1** (intentionally low-match):
- Addresses: Jenny's CashFlowSmoothingGoalSignal
- Insight type: reframe
- Content: *"Jenny's catering business has hidden upside in shoulder-season events that competitors don't pursue because their financing won't accommodate the 30-day prep."*
- Cached match: null (low confidence ~0.32)
- Cached LLM feedback: *"This looks novel. Submit as is?"* — banker confirmed; saved as `state='novel'`

### 7.2 Northland's seed Insights

**Routine 1** (matches PATTERN-010 — capacity_limit reframe):
- Addresses: capSignal (Apr 15 capacity Blocker)
- Insight type: reframe
- Content: *"Every customer Northland turns away today builds a relationship with a competitor — those customers don't recover later."*
- Cached match: PATTERN-010 (high confidence ~0.84)
- Cached LLM feedback: *"Excellent observation! When operational capacity caps demand, every declined customer is one a competitor builds a relationship with."*

**Routine 2** (matches PATTERN-013 — equipment_breakdown implication):
- Addresses: Apr 15 capSignal (interpreted with truck-replacement framing)
- Insight type: implication
- Content: *"The truck breakdown isn't about that vehicle — it's the moment the broader fleet question becomes unavoidable for Northland."*
- Cached match: PATTERN-013 (high confidence ~0.81)
- Cached LLM feedback: *"You're catching something key — when this unit failed, what did it tell you about the rest of the fleet?"*

**Routine 3** (matches PATTERN-016 — external_advisor_input reframe):
- Addresses: northlandIndecisionSignal (CPA reference)
- Insight type: reframe
- Content: *"The CPA's depreciation perspective is structure for the decision, not friction — it sharpens the financing case."*
- Cached match: PATTERN-016 (high confidence ~0.78)
- Cached LLM feedback: *"You're catching something key about how the CPA's perspective frames capital decisions — are there tax structuring elements that would change which financing approach makes sense?"*

**Novel 1** (intentionally low-match):
- Addresses: northlandFleetGoalSignal (the "20-25% volume" Goal)
- Insight type: implication
- Content: *"Northland's growth ceiling isn't capacity — it's that residential customers prefer fleet-marked trucks for trust signals, which the current fleet age contradicts."*
- Cached match: null (low confidence ~0.28)
- Cached LLM feedback: *"This looks novel. Submit as is?"* — banker confirmed; saved as `state='novel'`

### 7.3 Cygnus's seed Insights

**Routine 1** (matches PATTERN-019 — customer_growth_announcement reframe):
- Addresses: cygnusVolumeSignal (Apr 21 customer growth Trigger)
- Insight type: reframe
- Content: *"Cygnus's anchor customer growth signals mean the question isn't whether to expand — it's whether expansion arrives ahead of demand or behind it."*
- Cached match: PATTERN-019 (high confidence ~0.86)
- Cached LLM feedback: *"Excellent observation! When anchor customers signal volume increases, the timing question becomes operational rather than strategic."*

**Routine 2** (matches PATTERN-017 — real_estate reframe):
- Addresses: cygnusCapacityEvalSignal (the "floor space" Trigger framed as obstacle)
- Insight type: reframe
- Content: *"The floor-space constraint at 85% has been making growth decisions for Cygnus by default — without that articulation, opportunities get declined silently."*
- Cached match: PATTERN-017 (high confidence ~0.83)
- Cached LLM feedback: *"You're catching something key — what growth assumptions has Cygnus been making implicitly because of the current footprint?"*

**Routine 3** (matches PATTERN-022 — co_decision_maker_input reframe):
- Addresses: Cygnus's board-approval Indecision (June 15 meeting reference)
- Insight type: reframe
- Content: *"Board input on the expansion isn't a delay — it produces institutional memory the team will need to execute the decision well over years."*
- Cached match: PATTERN-022 (high confidence ~0.80)
- Cached LLM feedback: *"You're catching something key about board engagement — what perspectives does the board bring that the operating team might miss?"*

**Novel 1** (intentionally low-match):
- Addresses: cygnusVolumeSignal (the "Three of our biggest customers" Trigger)
- Insight type: implication
- Content: *"Cygnus's anchor customers naming them preferred supplier creates obligation pressure — declining is not an option, but timing is the conversation."*
- Cached match: null (low confidence ~0.31)
- Cached LLM feedback: *"This looks novel. Submit as is?"* — banker confirmed; saved as `state='novel'`

---

## Section 8 — Editorial review prompts for Francisco

Five places where banker's-eye and product-voice judgment matter more than my drafting:

**E1 — Tone calibration.** The Patterns aim for consultative-banker voice — substantive but not lecturing. Are any reading too academic, too marketing-flavored, or too generic? My most uncertain calls: PATTERN-021 (Cygnus expand_capacity implication around "operational scale that requires hires, processes, and management capability the founder may not yet have") risks reading like criticism; PATTERN-026 (SBA capacity_to_service_debt) may be too abstract.

**E2 — 200-character discipline.** Some Patterns run close to the 200-char limit; some are intentionally shorter. Worth verifying none are over (CC implementation will validate, but editorial pass should flag if any feel too dense for screen reading). My most concerning: PATTERN-002, PATTERN-018 — both around 195 chars, may need tightening.

**E3 — Implication question quality.** The Rackham-style questions are designed as conversational starters, not interrogations. Are any reading too aggressive, too leading, or too generic? My most uncertain: PATTERN-005 implication question 2 ("What would you do differently if your top customer represented 20% rather than 50% of revenue?") may feel hypothetical-uncomfortable.

**E4 — Banned-phrase audit.** I've avoided "Recommended for", "Eligible for", "Pre-qualified", "Approved", and similar per COMPLIANCE.md §10.2. Worth a fresh pass for anything that reads as approval-coded. Most uncertain: PATTERN-027 ("SBA financing for expansion is not a fallback — it is the right structure when...") — "right structure" framing approaches but doesn't cross the line; worth verifying.

**E5 — Per-fixture seed Insight realism.** Are the routine matches Section 7 specifies actually plausible high-confidence matches? Are the novel insights genuinely novel (not just poorly written versions of canonical patterns)? My most uncertain: Jenny's Novel 1 ("hidden upside in shoulder-season events that competitors don't pursue") — could read as reasonable extension of PATTERN-001 rather than truly novel.

---

## Section 9 — Sprint 5b.1 schema notes (for prompt drafting)

The library translates to seed data per the Sprint 5b.1 prompt's Block D specification:

```typescript
// One InsightPattern per entry in Sections 2-6
{
  id: "PATTERN-001",
  track_id: "TRACK-001",
  signal_tag_scope: "cashflow_volatility",
  insight_type: "reframe",
  content: "Seasonal cashflow gaps are not a survival problem to manage...",
  implication_questions: JSON.stringify([
    "What opportunities have you turned down...",
    "If working capital weren't the bottleneck...",
    "How often do you delay decisions..."
  ]),
  member_type_origins: JSON.stringify(['catering', 'specialty_retail', 'agriculture', 'general']),
  member_type_applicability: "broad",
  status: "approved",
  authored_at: new Date(),
  authored_by: "library_seed",
  approved_at: new Date(),
  approved_by: "library_seed",
}
```

Section 7's per-fixture Insights become seed Insight records with cached LLM matches per Sprint 5b.1 Block D.4.

---

**End of insight pattern library v1 draft.**

Total content: 36 canonical Patterns across 5 Tracks, 9 per-fixture seed Insights (3 routine + 1 novel per fixture × 3 fixtures), structural metadata, editorial review prompts.

Ready for Francisco's review pass per Section 8 prompts. After review, this becomes the seed data for Sprint 5b.1.
