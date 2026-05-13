# Insight Pattern Library v2 Additions — Blaze Product Realignment

**Draft for Francisco's review.** Pattern additions for Sprint 5c covering 6 new Tracks (TRACK-006 through TRACK-011) added during Blaze product realignment. Drops 6 TRACK-005 Patterns. Library grows from 36 → ~53 Patterns net.

**Authored:** by Claude. **Status:** Draft for Francisco's editorial pass (Section 8 review prompts).

**Discipline applied throughout:**

- Member-Type-agnostic content; Member-Type origin/applicability is metadata
- ~200-character discipline per Pattern
- 2-3 Rackham-style implication questions each
- Honors COMPLIANCE.md §10.2 (no "Recommended for", "Eligible for", "Pre-qualified", "Approved")
- Connects captured business reality to growth capital reasoning specific to each Blaze product
- Insight type roughly 60% reframe / 40% implication
- Each Pattern uses Blaze's actual product terms where surfacable (PACE 14-year fixed; Equipment 7-year; Vehicle 5-year; SBA 504 structure; Unsecured $25K cap)

**Total additions: ~23 new Patterns.**

---

## Section 1 — Patterns to drop (TRACK-005 Treasury Services)

Drop the following 6 Patterns from v1 library:

- PATTERN-031 (TRACK-005 cashflow_volatility reframe)
- PATTERN-032 (TRACK-005 customer_concentration implication)
- PATTERN-033 (TRACK-005 expand_capacity implication)
- PATTERN-034 (TRACK-005 regulatory_compliance reframe)
- PATTERN-035 (TRACK-005 co_decision_maker_input reframe)
- PATTERN-036 (TRACK-005 customer_growth_announcement implication)

Cleanup operation: drop InsightPattern records where track_id = 'TRACK-005'. Verify no fixture seed Insights reference these IDs (Sprint 5b.1 fixture Insights addressed TRACK-001/002/003 Patterns; no TRACK-005 references should exist).

---

## Section 2 — TRACK-006 Investment Property Loan (5 new Patterns)

Investment Property Loans serve Members acquiring or refinancing residential investment properties (single-family through fourplex). Patterns address rental income predictability, property selection rationale, multi-property portfolio dynamics, and the strategic difference between investment property as cashflow asset vs appreciation play.

---

**PATTERN-037**
- track_id: TRACK-006
- signal_tag_scope: `real_estate_target_property`
- insight_type: `reframe`
- content: *"An investment property purchase is not just a real estate decision — it is a recurring monthly cashflow commitment that requires the underlying business to generate the surplus."*
- implication_questions:
  - "What's the surplus you generate monthly today, and how does the property service fit within it?"
  - "If rental income runs 20% below projection, does the business still cover the mortgage comfortably?"
  - "How does this property change your capital allocation over the next decade?"
- member_type_origins: ['general', 'professional_services', 'specialty_manufacturing']
- member_type_applicability: broad
- status: approved

---

**PATTERN-038**
- track_id: TRACK-006
- signal_tag_scope: `stated_growth_aspiration`
- insight_type: `implication`
- content: *"Rental property income compounds slowly but predictably — its strategic value is in long-horizon balance sheet diversification, not near-term cashflow contribution."*
- implication_questions:
  - "What's the role of this property in your 10-year picture vs the next 24 months?"
  - "How does rental income complement the operating business's cashflow cycle?"
  - "What does the portfolio look like if this is the first of several properties vs the only one?"
- member_type_origins: ['professional_services', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-039**
- track_id: TRACK-006
- signal_tag_scope: `existing_credit_facility_utilization`
- insight_type: `reframe`
- content: *"A second mortgage on an investment property doesn't add risk in isolation — the question is how it interacts with operating debt the business already carries."*
- implication_questions:
  - "What other debt service obligations exist, and how does this stack against them?"
  - "Where does the consolidated debt service ratio sit, considering all facilities together?"
  - "What scenarios would stress the consolidated picture, and what flexibility do you want preserved?"
- member_type_origins: ['general', 'specialty_manufacturing']
- member_type_applicability: broad
- status: approved

---

**PATTERN-040**
- track_id: TRACK-006
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"Real estate investment decisions benefit from a CPA's view on tax-shelter structure and a real estate professional's view on regional rental dynamics — these aren't redundant inputs."*
- implication_questions:
  - "What's your CPA's view on how this property fits your tax-shelter structure?"
  - "Have you confirmed regional rental demand matches your projection assumptions?"
  - "What's the input you most need before committing?"
- member_type_origins: ['general', 'professional_services']
- member_type_applicability: broad
- status: approved

---

**PATTERN-041**
- track_id: TRACK-006
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `implication`
- content: *"Investment property decisions often hide a household-level question — does the family want concentrated real estate exposure, or does this displace other goals?"*
- implication_questions:
  - "Does this property align with your household's broader asset-mix goals?"
  - "What would the family give up to add this property, and is that tradeoff explicit?"
  - "Where does real estate fit in your overall investment strategy?"
- member_type_origins: ['general', 'professional_services']
- member_type_applicability: broad
- status: approved

---

## Section 3 — TRACK-007 Equipment & Machinery (5 new Patterns)

Equipment & Machinery loans serve Members financing production equipment, machine tools, specialized industry equipment with up to 7-year terms and 25% down. Patterns address equipment-as-capacity-investment, depreciation strategy, replacement vs expansion logic, and operational continuity dynamics.

---

**PATTERN-042**
- track_id: TRACK-007
- signal_tag_scope: `equipment_aging`
- insight_type: `reframe`
- content: *"Equipment past its productive prime is not a maintenance problem — it is unrealized capacity sitting one breakdown away from operational disruption."*
- implication_questions:
  - "What's the cost of one unplanned breakdown on your aging equipment?"
  - "How much output is constrained by aging equipment running below original spec?"
  - "What does proactive replacement enable that reactive replacement cannot?"
- member_type_origins: ['hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-043**
- track_id: TRACK-007
- signal_tag_scope: `capacity_limit`
- insight_type: `implication`
- content: *"Equipment that bottlenecks production limits both volume and the kinds of work the business can take on — capacity isn't single-dimensional."*
- implication_questions:
  - "What customer requests do you currently decline because of equipment capabilities, not just throughput?"
  - "How does new equipment unlock work classes you couldn't previously bid on?"
  - "Where does equipment-driven capacity limit shape your customer mix?"
- member_type_origins: ['specialty_manufacturing', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-044**
- track_id: TRACK-007
- signal_tag_scope: `equipment_breakdown`
- insight_type: `reframe`
- content: *"A breakdown is the moment the deferred-replacement decision becomes urgent — but the equipment financing question is the same one that existed before the breakdown."*
- implication_questions:
  - "What was the financing case before the breakdown forced it?"
  - "How does urgency change the structural question, or does it just compress timing?"
  - "What does it mean to plan equipment financing from steady-state rather than breakdown response?"
- member_type_origins: ['hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-045**
- track_id: TRACK-007
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"Equipment financing structure is fundamentally a tax conversation — bonus depreciation, Section 179 timing, and term length interact with the operating business's tax position."*
- implication_questions:
  - "What's your CPA's view on bonus depreciation timing for this acquisition?"
  - "How does the 7-year term align with the equipment's productive life and your tax horizon?"
  - "Where does Section 179 fit in your year-end tax planning?"
- member_type_origins: ['hvac_trades', 'specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-046**
- track_id: TRACK-007
- signal_tag_scope: `revenue_trajectory`
- insight_type: `implication`
- content: *"Sustained YoY revenue growth signals the operational ceiling is approaching — equipment expansion ahead of the ceiling preserves growth momentum."*
- implication_questions:
  - "At current growth rates, when does existing equipment become the constraint?"
  - "What's the cost of expanding equipment behind the growth curve vs ahead of it?"
  - "How does demand visibility shape the timing of equipment commitment?"
- member_type_origins: ['specialty_manufacturing', 'hvac_trades', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 4 — TRACK-008 SBA 504 (6 new Patterns)

SBA 504 Loans serve owner-occupied Commercial Real Estate acquisitions with the SBA-CDC structure (50% bank first lien, 40% CDC second lien, 10% borrower equity). Patterns address owner-occupancy as strategic decision, the SBA 504 structure's specific advantages, multi-stakeholder coordination (CDC + bank + borrower + advisors), and long-term commitment to the property as operational anchor.

---

**PATTERN-047**
- track_id: TRACK-008
- signal_tag_scope: `real_estate`
- insight_type: `reframe`
- content: *"Owner-occupied real estate acquisition is not just a financing decision — it commits the business to a physical address as the platform for the next decade of operations."*
- implication_questions:
  - "What does the business need to look like in 10 years for this property to still serve it?"
  - "How does owning the building change decisions about lease-vs-buy for adjacent operations?"
  - "What's the strategic case for ownership at this stage rather than continued leasing?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-048**
- track_id: TRACK-008
- signal_tag_scope: `customer_growth_announcement`
- insight_type: `implication`
- content: *"Anchor-customer volume signals push owner-occupied real estate decisions toward the building that supports near-term growth, not just current operations."*
- implication_questions:
  - "What capacity does the proposed footprint enable that the current one doesn't?"
  - "How does anchor-customer growth alignment shape which property fits?"
  - "Where would future expansion happen — within this footprint, or as a next acquisition?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-049**
- track_id: TRACK-008
- signal_tag_scope: `co_decision_maker_input`
- insight_type: `reframe`
- content: *"SBA 504 structure requires CDC-bank coordination plus borrower-side advisory input — board-level alignment becomes the throughput constraint, not financing structure."*
- implication_questions:
  - "What does the board need to see to engage substantively rather than approve passively?"
  - "How does the timeline align with board cadence and decision-process needs?"
  - "What concerns from the board would shift the decision parameters?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-050**
- track_id: TRACK-008
- signal_tag_scope: `regulatory_compliance`
- insight_type: `reframe`
- content: *"SBA 504 paperwork structure benefits both sides — it surfaces operational and financial questions early that conventional CRE underwriting handles less rigorously."*
- implication_questions:
  - "What operational questions become explicit through SBA 504 documentation that wouldn't otherwise surface?"
  - "How does the structured underwriting align with the business's strategic articulation needs?"
  - "Where does SBA 504's documentation discipline produce decision durability?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-051**
- track_id: TRACK-008
- signal_tag_scope: `capacity_limit`
- insight_type: `implication`
- content: *"Operating at floor-space capacity for too long forces tradeoffs invisible to leadership — declined work, deferred hires, customer-relationship strain — that the new footprint resolves at once."*
- implication_questions:
  - "What tradeoffs has the team been making silently because of the current footprint?"
  - "How does decision quality change when capacity isn't the binding constraint?"
  - "What does operating with capacity headroom enable that current operations cannot?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

**PATTERN-052**
- track_id: TRACK-008
- signal_tag_scope: `external_advisor_input`
- insight_type: `reframe`
- content: *"SBA 504 specialist coordination — CDC partner plus bank lender plus borrower advisors — is the structural feature that makes long-term commitments durable."*
- implication_questions:
  - "How can we structure the working session so all parties engage substantively?"
  - "What input does each party need to give clean review?"
  - "Where does coordinated review surface concerns that sequential review would miss?"
- member_type_origins: ['specialty_manufacturing', 'general']
- member_type_applicability: broad
- status: approved

---

## Section 5 — TRACK-009 PACE Loan (3 new Patterns)

PACE Loans serve Members financing solar, EV charging, and energy-saving improvements with up to 100% financing and up to 14-year fixed terms. Available for commercial, multi-family, religious organizations, and non-profits. Patterns address energy improvement as long-horizon decision, cashflow alignment between PACE assessment and energy savings, and PACE's specific structural advantages.

---

**PATTERN-053**
- track_id: TRACK-009
- signal_tag_scope: `energy_improvement_target`
- insight_type: `reframe`
- content: *"Energy improvement financing through PACE is not just a sustainability decision — it locks in operating cost stability through a 14-year horizon during a volatile energy-pricing era."*
- implication_questions:
  - "What's your operating cost predictability look like over the next decade without the improvement?"
  - "How does energy cost stability change capital planning for other parts of the business?"
  - "Where does the long fixed term protect against scenarios that would otherwise stress cashflow?"
- member_type_origins: ['general', 'specialty_manufacturing', 'professional_services']
- member_type_applicability: broad
- status: approved

---

**PATTERN-054**
- track_id: TRACK-009
- signal_tag_scope: `stated_growth_aspiration`
- insight_type: `implication`
- content: *"PACE structure ties improvement assessment to the property — which means improvements transfer with the property and don't constrain operational financing capacity."*
- implication_questions:
  - "How does PACE preserve your financing capacity for operations and growth?"
  - "What's the strategic value of separating energy improvements from operating debt?"
  - "Where does this structural feature shape how you think about future capital allocation?"
- member_type_origins: ['general', 'specialty_manufacturing']
- member_type_applicability: broad
- status: approved

---

**PATTERN-055**
- track_id: TRACK-009
- signal_tag_scope: `property_eligibility_confirmed`
- insight_type: `reframe`
- content: *"PACE eligibility confirmation isn't a hurdle — it surfaces whether the property is in a jurisdiction that has invested in energy-improvement financing infrastructure, which signals broader operational fit."*
- implication_questions:
  - "What does this jurisdiction's PACE infrastructure tell us about regional energy-improvement priorities?"
  - "How does the PACE program structure reflect local economic development context?"
  - "Where does jurisdiction alignment shape implementation timeline?"
- member_type_origins: ['general']
- member_type_applicability: broad
- status: approved

---

## Section 6 — TRACK-010 Business Visa Credit Card (2 new Patterns)

Business Visa Credit Cards serve Members needing flexible short-term working capital, expense management, and reward-program benefits. Patterns address card-as-tool-not-debt and the strategic difference between card spend and term-loan financing.

---

**PATTERN-056**
- track_id: TRACK-010
- signal_tag_scope: `stated_obstacle_to_growth`
- insight_type: `reframe`
- content: *"Business credit card capacity isn't a debt facility — it's working capital flexibility that smooths timing mismatches between operations and customer payment cycles."*
- implication_questions:
  - "What timing mismatches do you currently absorb through your operating cash buffer?"
  - "How does card flexibility change which decisions are timing-constrained vs cash-constrained?"
  - "Where would predictable card capacity reduce decision friction?"
- member_type_origins: ['general', 'small_caterer', 'professional_services']
- member_type_applicability: broad
- status: approved

---

**PATTERN-057**
- track_id: TRACK-010
- signal_tag_scope: `existing_blaze_relationship_depth`
- insight_type: `implication`
- content: *"A business credit card alongside primary operating accounts produces consolidated cashflow visibility that scattered card relationships cannot match."*
- implication_questions:
  - "Where does scattered card spending obscure your operational picture?"
  - "How would consolidated card-plus-account visibility change your monthly review process?"
  - "What does single-relationship banking enable that you don't currently have?"
- member_type_origins: ['general']
- member_type_applicability: broad
- status: approved

---

## Section 7 — TRACK-011 Unsecured Loan (2 new Patterns)

Unsecured Loans serve Members needing up to $25K with 5-year terms for specific bounded purposes — equipment purchase under collateral threshold, working capital bridge, professional services investment. Patterns address loan-as-targeted-tool and the structural difference between unsecured and secured options.

---

**PATTERN-058**
- track_id: TRACK-011
- signal_tag_scope: `stated_growth_aspiration`
- insight_type: `reframe`
- content: *"Unsecured financing for bounded purposes preserves collateral capacity for larger commitments — it's a strategic choice, not a fallback when collateral isn't available."*
- implication_questions:
  - "What larger commitments might benefit from preserved collateral capacity over the next 24 months?"
  - "How does separating small targeted financing from collateral-backed facilities improve flexibility?"
  - "Where does unsecured financing for this specific need fit your broader capital strategy?"
- member_type_origins: ['general', 'small_caterer', 'professional_services']
- member_type_applicability: broad
- status: approved

---

**PATTERN-059**
- track_id: TRACK-011
- signal_tag_scope: `member_tenure`
- insight_type: `implication`
- content: *"Unsecured financing terms scale with member tenure and relationship depth — the case is fundamentally about predictability of cashflow over the term, not collateral conversion."*
- implication_questions:
  - "What does cashflow predictability look like over the next 5 years?"
  - "How does relationship history shape the unsecured financing decision differently than a new-relationship case?"
  - "Where does tenure-driven trust translate to structural advantages?"
- member_type_origins: ['general', 'small_caterer']
- member_type_applicability: broad
- status: approved

---

## Section 8 — Editorial review prompts for Francisco

Five places where banker's-eye and product-voice judgment matter:

**E1 — Blaze product-term accuracy.** Patterns reference Blaze's actual product terms (PACE 14-year fixed; Equipment 7-year; Vehicle 5-year; Unsecured $25K cap; SBA 504 50/40/10 structure). Worth verifying terms surface accurately and don't misrepresent Blaze's product positioning. Most uncertain: PATTERN-053 PACE "volatile energy-pricing era" framing may read as opinionated rather than factual.

**E2 — Owner-occupancy framing for SBA 504.** PATTERN-047 frames owner-occupancy as decade-long commitment to physical address. Worth checking this lands as appropriately weighty (it's a major decision) without reading as discouraging or fear-coded. The "decade of operations" framing is intentional gravity; verify it doesn't tip into hesitation-inducing.

**E3 — Investment Property household framing.** PATTERN-041 surfaces household-level asset-mix questions. Worth verifying this lands as appropriately consultative rather than personal-finance-overreach. Bankers may consult on household financial structure in private banking contexts but should be careful in business banking conversations.

**E4 — PACE Pattern coverage thinness.** Only 3 PACE Patterns authored — that's the low end of useful library coverage. Worth deciding whether to expand (5-6 PACE Patterns) or accept thin coverage given PACE is niche product. My judgment: accept thin coverage; PACE niche makes deeper library content speculative.

**E5 — Banned-phrase audit.** Patterns avoid "Recommended for", "Eligible for", "Pre-qualified". Worth fresh pass for anything reading as approval-coded. Most uncertain: PATTERN-058 "preserves collateral capacity for larger commitments" approaches positioning language without crossing the line.

---

## Section 9 — Sprint 5c schema notes

The content above maps to InsightPattern records per Sprint 5c Block C specification. Each Section 2-7 entry becomes one InsightPattern record with:

- id from PATTERN-NNN
- track_id from section header (TRACK-006 through TRACK-011)
- signal_tag_scope from per-Pattern field
- insight_type from per-Pattern field
- content as 200-char canonical statement
- implication_questions as JSON array of question strings
- member_type_origins as JSON array
- member_type_applicability as 'broad' for all entries
- status: 'approved'
- authored_by: 'library_seed'

Sprint 5c Block C drops 6 TRACK-005 Pattern records and loads ~23 new Pattern records (5+5+6+3+2+2 = 23 new).

Library state after Sprint 5c: 36 - 6 + 23 = 53 Patterns total.

---

**End of insight pattern library v2 additions draft.**

Total content: 23 new canonical Patterns across 6 new Tracks, drop list for 6 TRACK-005 Patterns, structural metadata for Sprint 5c integration.

Ready for Francisco's review pass per Section 8 prompts.
