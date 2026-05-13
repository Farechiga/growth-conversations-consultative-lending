/*
 * Sprint 5b.1 Block D — InsightPattern library seed + per-fixture Insight seed.
 *
 * Translates `INSIGHT_PATTERN_LIBRARY_v1.md` Sections 2-6 into 36
 * canonical InsightPattern records (Member-Type-agnostic content,
 * 200-char discipline, banked-phrase clean per COMPLIANCE.md §10.2).
 *
 * Then translates Section 7 per-fixture expectations into 12 banker-
 * authored Insight records (3 routine + 1 novel × 3 fixtures), each
 * with cached `matched_pattern_id`, `match_confidence`, and
 * `llm_feedback` so the demo doesn't depend on a live LLM call at
 * fixture-load time. Live API matching only fires for Insights authored
 * during a demo session (per Sprint 5b.1 §E.4).
 */

import type { PrismaClient } from "../app/generated/prisma/client";

// ============================================================
// Section 2 — TRACK-001 Working Capital LOC Patterns (9)
// ============================================================

type PatternSeed = {
  id: string;
  track_id: string;
  signal_tag_scope: string;
  insight_type: "reframe" | "implication";
  content: string;
  implication_questions: string[];
  member_type_origins: string[];
  member_type_applicability: string; // 'broad' or JSON array
};

const PATTERNS: PatternSeed[] = [
  // ── TRACK-001 Working Capital LOC ──
  {
    id: "PATTERN-001",
    track_id: "TRACK-001",
    signal_tag_scope: "cashflow_volatility",
    insight_type: "reframe",
    content:
      "Seasonal cashflow gaps aren't just something to ride out. They're the reason the business is turning down opportunities it can already see.",
    implication_questions: [
      "What opportunities have you turned down in the past two years because the timing didn't work for your cashflow?",
      "If cashflow timing weren't a problem, what would you say yes to this year?",
      "How often do you wait for cash to recover before making a decision?",
    ],
    member_type_origins: ["event_services", "specialty_retail", "agriculture", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-002",
    track_id: "TRACK-001",
    signal_tag_scope: "cashflow_volatility",
    insight_type: "implication",
    content:
      "When cashflow swings hard, the business absorbs all the timing risk. That changes decisions year-round, not just in the slow months.",
    implication_questions: [
      "When the slow season hits, how does that affect decisions you make in the strong season?",
      "Do you find yourself running the business more conservatively year-round because of seasonal swings?",
      "What does the volatility cost in opportunities you don't even consider?",
    ],
    member_type_origins: ["event_services", "hospitality", "tourism", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-003",
    track_id: "TRACK-001",
    signal_tag_scope: "late_paying_customer",
    insight_type: "reframe",
    content:
      "When customers pay you in 60 days, you're not just being patient. You're financing their cashflow with yours.",
    implication_questions: [
      "When customers pay 60+ days, are you essentially funding their cashflow?",
      "What would change in your operations if those receivables converted to cash 30 days sooner?",
      "Do your largest customers know they are leveraging your working capital?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-004",
    track_id: "TRACK-001",
    signal_tag_scope: "late_paying_customer",
    insight_type: "implication",
    content:
      "Late payments cost more than the time they take. Every one is a decision the business has to put off until the money lands.",
    implication_questions: [
      "What decisions do you defer when a major customer payment is late?",
      "How much of your operating runway is tied up in receivables at any given time?",
      "If the AR cycle compressed by 30 days, what would you do differently?",
    ],
    member_type_origins: ["event_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-005",
    track_id: "TRACK-001",
    signal_tag_scope: "customer_concentration",
    insight_type: "reframe",
    content:
      "When a few customers account for most of the revenue, the business gives up flexibility on price, timing, and which work to take on.",
    implication_questions: [
      "How does concentration with your top customers shape your pricing flexibility?",
      "What would you do differently if your top customer represented 20% rather than 50% of revenue?",
      "Are there customers you cannot afford to disappoint, even when their terms work against you?",
    ],
    member_type_origins: ["event_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-006",
    track_id: "TRACK-001",
    signal_tag_scope: "smooth_seasonal_revenue",
    insight_type: "reframe",
    content:
      "Smoothing cashflow isn't really about the cashflow. It's about being able to make decisions from choice instead of necessity.",
    implication_questions: [
      "If cashflow were predictable year-round, what would you focus on instead of survival planning?",
      "What does running the business from a position of choice look like to you?",
      "Where do you currently make decisions reactively that you would prefer to make proactively?",
    ],
    member_type_origins: ["event_services", "tourism", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-007",
    track_id: "TRACK-001",
    signal_tag_scope: "co_decision_maker_input",
    insight_type: "reframe",
    content:
      "Shared decisions aren't a delay. They make the financing work better day-to-day because both decision-makers are on board.",
    implication_questions: [
      "What does aligned ownership of a financial decision look like in your business?",
      "When you and your co-decision-maker work through this together, what concerns matter most to each of you?",
      "How would the conversation be different if you had a clear shared framework?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-008",
    track_id: "TRACK-001",
    signal_tag_scope: "capacity_to_service_debt",
    insight_type: "implication",
    content:
      "When a Member hesitates on financing, it's usually about future cashflow they're not sure of, not the financing itself. Worth asking what feels uncertain.",
    implication_questions: [
      "What aspects of your future cashflow feel certain, and what feels uncertain?",
      "If we modeled the facility against your most cautious cashflow scenario, would the picture change?",
      "What information would help you evaluate this with confidence?",
    ],
    member_type_origins: ["event_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-009",
    track_id: "TRACK-001",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "Bringing in the CPA or another advisor isn't stalling. It's how the Member makes the decision stick so they don't have to revisit it later under pressure.",
    implication_questions: [
      "What questions would your CPA want answered before signing off on this?",
      "How can we make sure the advisor has what they need to give a clear view?",
      "What does decision durability look like in your business — what would make this stick?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-002 Vehicle/Fleet Loan ──
  {
    id: "PATTERN-010",
    track_id: "TRACK-002",
    signal_tag_scope: "capacity_limit",
    insight_type: "reframe",
    content:
      "When operational capacity caps demand, every customer the business turns away today is one a competitor builds a relationship with — those customers don't recover later.",
    implication_questions: [
      "How often have you turned down work because of capacity constraints?",
      "Where do those customers go when you can't take their job?",
      "What does the lifetime relationship cost of one declined job actually total?",
    ],
    member_type_origins: ["maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-011",
    track_id: "TRACK-002",
    signal_tag_scope: "capacity_limit",
    insight_type: "implication",
    content:
      "When the business is at capacity, it has to choose which customers to keep happy. Over time, that choice damages relationships.",
    implication_questions: [
      "When you have to choose between customers, what factors guide your decisions?",
      "Are some customers waiting longer than others, and what does that pattern look like over a year?",
      "What's the customer relationship cost of consistently being at capacity?",
    ],
    member_type_origins: ["maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-012",
    track_id: "TRACK-002",
    signal_tag_scope: "aging_equipment",
    insight_type: "reframe",
    content:
      "Old equipment isn't just a maintenance issue. It eats management attention every day that should be going toward growth.",
    implication_questions: [
      "How much management time goes into managing the aging equipment situation?",
      "What growth conversations are getting deferred because of equipment-driven attention demands?",
      "If the equipment situation were resolved, what would your team focus on instead?",
    ],
    member_type_origins: ["maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-013",
    track_id: "TRACK-002",
    signal_tag_scope: "equipment_breakdown",
    insight_type: "implication",
    content:
      "An equipment failure that triggers a financing conversation is rarely about the failed unit — it is the moment the broader fleet question becomes unavoidable.",
    implication_questions: [
      "When this unit failed, what did it tell you about the rest of the fleet?",
      "How many of your other vehicles are approaching the same point?",
      "Is this the moment to think about the fleet strategically rather than reactively?",
    ],
    member_type_origins: ["maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-014",
    track_id: "TRACK-002",
    signal_tag_scope: "expand_capacity",
    insight_type: "reframe",
    content:
      "Expanding fleet capacity is not just buying more vehicles — it is committing the business to a larger operational footprint and the customer relationships that footprint enables.",
    implication_questions: [
      "What customer relationships have you been holding back from pursuing because of capacity?",
      "If the fleet doubled, what would your sales pipeline look like in a year?",
      "What kind of business do you want to be running in three years?",
    ],
    member_type_origins: ["maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-015",
    track_id: "TRACK-002",
    signal_tag_scope: "capacity_evaluation",
    insight_type: "implication",
    content:
      "The decision to evaluate capacity is itself a signal — it usually means demand has been pressuring operations long enough that the business cannot ignore it anymore.",
    implication_questions: [
      "What finally made the capacity question urgent enough to act on?",
      "How long has the demand pressure been building before this conversation?",
      "What would have happened if you delayed this evaluation another six months?",
    ],
    member_type_origins: ["maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-016",
    track_id: "TRACK-002",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "A CPA's perspective on a fleet financing decision frames the question in tax and depreciation terms — useful structure, not friction in the path.",
    implication_questions: [
      "What does your CPA typically focus on when evaluating capital equipment decisions?",
      "Are there tax structuring elements that would change which financing approach makes sense?",
      "How can we make sure your CPA has the operational picture to evaluate cleanly?",
    ],
    member_type_origins: ["maintenance_services", "general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-003 CRE Term Loan ──
  {
    id: "PATTERN-017",
    track_id: "TRACK-003",
    signal_tag_scope: "real_estate",
    insight_type: "reframe",
    content:
      "Real estate constraints aren't just an operational ceiling. They're decisions the business has been making silently — turning down growth without naming it.",
    implication_questions: [
      "What growth assumptions have you been making implicitly because of the current footprint?",
      "If physical space weren't the constraint, what would the business plan look like?",
      "How often does the footprint enter into decisions about customers, products, or hires?",
    ],
    member_type_origins: ["specialty_manufacturer", "specialty_retail", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-018",
    track_id: "TRACK-003",
    signal_tag_scope: "real_estate",
    insight_type: "implication",
    content:
      "A facility constraint at 80%+ utilization compounds — every additional commitment requires either rejecting work or accepting operational stress that erodes execution quality.",
    implication_questions: [
      "What's the quality cost of operating at the current capacity?",
      "Where does the 'we can fit it in' mindset start to break down?",
      "What kinds of customers do you pass on because the footprint can't accommodate them?",
    ],
    member_type_origins: ["specialty_manufacturer", "specialty_retail", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-019",
    track_id: "TRACK-003",
    signal_tag_scope: "customer_growth_announcement",
    insight_type: "reframe",
    content:
      "When anchor customers signal volume increases, the question is not whether to expand — it is whether expansion arrives ahead of the demand or behind it.",
    implication_questions: [
      "How aligned is your expansion timeline with your anchor customers' growth?",
      "What's the cost of expanding behind demand rather than ahead of it?",
      "Have you and the anchor customers had a direct conversation about timing?",
    ],
    member_type_origins: ["specialty_manufacturer", "specialty_retail", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-020",
    track_id: "TRACK-003",
    signal_tag_scope: "acquire_real_estate",
    insight_type: "reframe",
    content:
      "Acquiring real estate is not just a financing decision — it is a long-term commitment to a specific operational geometry that shapes the business for a decade.",
    implication_questions: [
      "What does the business need to look like in 10 years to make this footprint right?",
      "What growth scenarios change which property structure makes sense?",
      "If the current customers grow as expected, will this footprint serve them in 5 years?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-021",
    track_id: "TRACK-003",
    signal_tag_scope: "expand_capacity",
    insight_type: "implication",
    content:
      "Capacity expansion is more than financing. It requires hires, processes, and management the founder may need to grow into.",
    implication_questions: [
      "What does the leadership team need to look like to operate the expanded business?",
      "What systems and processes will need to be in place to scale into the new footprint?",
      "What aspects of running a larger operation feel comfortable, and what feels new?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-022",
    track_id: "TRACK-003",
    signal_tag_scope: "co_decision_maker_input",
    insight_type: "reframe",
    content:
      "Board-level input on a material commitment is not a delay mechanism — it produces the institutional memory needed to execute the decision well over years.",
    implication_questions: [
      "What perspectives does the board bring that the operating team might miss?",
      "How can we structure the materials so the board engages with the decision substantively?",
      "What concerns from the board would shift the decision parameters?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-023",
    track_id: "TRACK-003",
    signal_tag_scope: "refinancing_window",
    insight_type: "implication",
    content:
      "A refinancing window is not just about rate — it is the rare moment when the business can renegotiate the underlying structure of its capital relationships.",
    implication_questions: [
      "Beyond rate, what aspects of the current financing structure don't fit the business as it is now?",
      "What flexibility would matter most in a renegotiated facility?",
      "If we redesigned the capital structure from scratch, what would change?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-024",
    track_id: "TRACK-003",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "An advisor's review of a material commitment is not friction — it surfaces structural questions early, before they show up as constraints in the operational reality.",
    implication_questions: [
      "What structural questions has your advisor raised that would benefit from early discussion?",
      "Where might the advisor's perspective shift assumptions we have been making?",
      "How can we engage the advisor at the framing stage rather than the review stage?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-004 SBA 7(a) ──
  {
    id: "PATTERN-025",
    track_id: "TRACK-004",
    signal_tag_scope: "regulatory_compliance",
    insight_type: "reframe",
    content:
      "SBA paperwork isn't a hurdle. It makes the underwriting case explicit, which helps both sides.",
    implication_questions: [
      "What aspects of the business benefit from being articulated cleanly for outside review?",
      "Where would clarity about the financial picture help internal decision-making too?",
      "What does it mean for the business to have its case formally documented?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-026",
    track_id: "TRACK-004",
    signal_tag_scope: "capacity_to_service_debt",
    insight_type: "implication",
    content:
      "SBA structure produces longer terms and partial guarantees — which means the question is not 'can we afford the payment' but 'does the longer commitment fit the business plan'.",
    implication_questions: [
      "What does the business look like at the end of a longer term — does the commitment still make sense then?",
      "How does payment timing align with the operational cashflow cycle?",
      "What flexibility do you need in the structure to keep options open?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-027",
    track_id: "TRACK-004",
    signal_tag_scope: "expand_capacity",
    insight_type: "reframe",
    content:
      "SBA financing for expansion is not a fallback — it is the right structure when the business needs longer terms than conventional credit, and the use-of-proceeds case is clear.",
    implication_questions: [
      "What does longer-term financing enable that shorter-term wouldn't?",
      "Is the use-of-proceeds case clear enough to articulate in one paragraph?",
      "Where does the conventional credit structure constrain the business plan?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-028",
    track_id: "TRACK-004",
    signal_tag_scope: "refinancing_window",
    insight_type: "implication",
    content:
      "Refinancing existing debt into SBA structure is rarely about rate alone — it usually addresses term mismatch where short-term financing is propping up long-term operational decisions.",
    implication_questions: [
      "What's the term-fit of the existing debt — does it match the assets it financed?",
      "Where is short-term financing supporting decisions that should sit on longer terms?",
      "What flexibility do you lose by carrying debt that doesn't fit the business cycle?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-029",
    track_id: "TRACK-004",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "A CPA helps SBA structure by translating operational reality into the financial framing the program requires — they make the case visible, not different.",
    implication_questions: [
      "What does your CPA see in the financial picture that we should make sure surfaces in the package?",
      "Where does operational reality differ from how the financials look on paper?",
      "How can the CPA's perspective sharpen the case rather than complicate it?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-030",
    track_id: "TRACK-004",
    signal_tag_scope: "co_decision_maker_input",
    insight_type: "reframe",
    content:
      "SBA timelines work in favor of decisions that need shared input — the 60-90 day process gives the business space to align rather than rushing the conversation.",
    implication_questions: [
      "How does the timeline fit your shared decision process?",
      "What conversations need to happen during that window to land the decision well?",
      "Where would a faster timeline actually be a disadvantage?",
    ],
    member_type_origins: ["event_services", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },

  // ============================================================
  // Sprint 5c — TRACK-005 Patterns (PATTERN-031..036) dropped alongside
  // TRACK-005 retirement. 23 new Patterns (PATTERN-037..059) added for
  // Blaze product realignment Tracks. Library net: 36 - 6 + 23 = 53
  // Patterns total post-Sprint 5c.
  // ============================================================

  // ── TRACK-006 Investment Property Loan (5 patterns) ──
  {
    id: "PATTERN-037",
    track_id: "TRACK-006",
    signal_tag_scope: "real_estate_target_property",
    insight_type: "reframe",
    content:
      "Buying an investment property is a recurring monthly commitment. The operating business has to generate the surplus that covers it.",
    implication_questions: [
      "What's the surplus you generate monthly today, and how does the property service fit within it?",
      "If rental income runs 20% below projection, does the business still cover the mortgage comfortably?",
      "How does this property change your capital allocation over the next decade?",
    ],
    member_type_origins: ["general", "professional_services", "specialty_manufacturer"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-038",
    track_id: "TRACK-006",
    signal_tag_scope: "stated_growth_aspiration",
    insight_type: "implication",
    content:
      "Rental income builds slowly and steadily. The value is in long-term balance-sheet diversification, not month-to-month cashflow.",
    implication_questions: [
      "What's the role of this property in your 10-year picture vs the next 24 months?",
      "How does rental income complement the operating business's cashflow cycle?",
      "What does the portfolio look like if this is the first of several properties vs the only one?",
    ],
    member_type_origins: ["professional_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-039",
    track_id: "TRACK-006",
    signal_tag_scope: "existing_credit_facility_utilization",
    insight_type: "reframe",
    content:
      "A second mortgage on an investment property doesn't add risk in isolation — the question is how it interacts with operating debt the business already carries.",
    implication_questions: [
      "What other debt service obligations exist, and how does this stack against them?",
      "Where does the consolidated debt service ratio sit, considering all facilities together?",
      "What scenarios would stress the consolidated picture, and what flexibility do you want preserved?",
    ],
    member_type_origins: ["general", "specialty_manufacturer"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-040",
    track_id: "TRACK-006",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "Real estate investment decisions benefit from a CPA's view on tax-shelter structure and a real estate professional's view on regional rental dynamics — these aren't redundant inputs.",
    implication_questions: [
      "What's your CPA's view on how this property fits your tax-shelter structure?",
      "Have you confirmed regional rental demand matches your projection assumptions?",
      "What's the input you most need before committing?",
    ],
    member_type_origins: ["general", "professional_services"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-041",
    track_id: "TRACK-006",
    signal_tag_scope: "co_decision_maker_input",
    insight_type: "implication",
    content:
      "Investment property decisions often hide a household-level question — does the family want concentrated real estate exposure, or does this displace other goals?",
    implication_questions: [
      "Does this property align with your household's broader asset-mix goals?",
      "What would the family give up to add this property, and is that tradeoff explicit?",
      "Where does real estate fit in your overall investment strategy?",
    ],
    member_type_origins: ["general", "professional_services"],
    member_type_applicability: "broad",
  },

  // ── TRACK-007 Equipment & Machinery (5 patterns) ──
  {
    id: "PATTERN-042",
    track_id: "TRACK-007",
    signal_tag_scope: "equipment_aging",
    insight_type: "reframe",
    content:
      "Old equipment isn't just a maintenance problem. It's capacity the business isn't getting, sitting one breakdown away from real disruption.",
    implication_questions: [
      "What's the cost of one unplanned breakdown on your aging equipment?",
      "How much output is constrained by aging equipment running below original spec?",
      "What does proactive replacement enable that reactive replacement cannot?",
    ],
    member_type_origins: ["maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-043",
    track_id: "TRACK-007",
    signal_tag_scope: "capacity_limit",
    insight_type: "implication",
    content:
      "Equipment that bottlenecks production limits both volume and the kinds of work the business can take on — capacity isn't single-dimensional.",
    implication_questions: [
      "What customer requests do you currently decline because of equipment capabilities, not just throughput?",
      "How does new equipment unlock work classes you couldn't previously bid on?",
      "Where does equipment-driven capacity limit shape your customer mix?",
    ],
    member_type_origins: ["specialty_manufacturer", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-044",
    track_id: "TRACK-007",
    signal_tag_scope: "equipment_breakdown",
    insight_type: "reframe",
    content:
      "A breakdown is the moment the deferred-replacement decision becomes urgent — but the equipment financing question is the same one that existed before the breakdown.",
    implication_questions: [
      "What was the financing case before the breakdown forced it?",
      "How does urgency change the structural question, or does it just compress timing?",
      "What does it mean to plan equipment financing from steady-state rather than breakdown response?",
    ],
    member_type_origins: ["maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-045",
    track_id: "TRACK-007",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "Equipment financing structure is fundamentally a tax conversation — bonus depreciation, Section 179 timing, and term length interact with the operating business's tax position.",
    implication_questions: [
      "What's your CPA's view on bonus depreciation timing for this acquisition?",
      "How does the 7-year term align with the equipment's productive life and your tax horizon?",
      "Where does Section 179 fit in your year-end tax planning?",
    ],
    member_type_origins: ["maintenance_services", "specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-046",
    track_id: "TRACK-007",
    signal_tag_scope: "revenue_trajectory",
    insight_type: "implication",
    content:
      "Sustained YoY revenue growth signals the operational ceiling is approaching — equipment expansion ahead of the ceiling preserves growth momentum.",
    implication_questions: [
      "At current growth rates, when does existing equipment become the constraint?",
      "What's the cost of expanding equipment behind the growth curve vs ahead of it?",
      "How does demand visibility shape the timing of equipment commitment?",
    ],
    member_type_origins: ["specialty_manufacturer", "maintenance_services", "general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-008 SBA 504 (6 patterns) ──
  {
    id: "PATTERN-047",
    track_id: "TRACK-008",
    signal_tag_scope: "real_estate",
    insight_type: "reframe",
    content:
      "Buying the building you operate from is a 10-year commitment to that location. It shapes everything the business does from there.",
    implication_questions: [
      "What does the business need to look like in 10 years for this property to still serve it?",
      "How does owning the building change decisions about lease-vs-buy for adjacent operations?",
      "What's the strategic case for ownership at this stage rather than continued leasing?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-048",
    track_id: "TRACK-008",
    signal_tag_scope: "customer_growth_announcement",
    insight_type: "implication",
    content:
      "Anchor-customer volume signals push owner-occupied real estate decisions toward the building that supports near-term growth, not just current operations.",
    implication_questions: [
      "What capacity does the proposed footprint enable that the current one doesn't?",
      "How does anchor-customer growth alignment shape which property fits?",
      "Where would future expansion happen — within this footprint, or as a next acquisition?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-049",
    track_id: "TRACK-008",
    signal_tag_scope: "co_decision_maker_input",
    insight_type: "reframe",
    content:
      "SBA 504 structure requires CDC-bank coordination plus borrower-side advisory input — board-level alignment becomes the throughput constraint, not financing structure.",
    implication_questions: [
      "What does the board need to see to engage substantively rather than approve passively?",
      "How does the timeline align with board cadence and decision-process needs?",
      "What concerns from the board would shift the decision parameters?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-050",
    track_id: "TRACK-008",
    signal_tag_scope: "regulatory_compliance",
    insight_type: "reframe",
    content:
      "SBA 504 paperwork surfaces operational and financial questions early — questions that conventional CRE underwriting often skips.",
    implication_questions: [
      "What operational questions become explicit through SBA 504 documentation that wouldn't otherwise surface?",
      "How does the structured underwriting align with the business's strategic articulation needs?",
      "Where does SBA 504's documentation discipline produce decision durability?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-051",
    track_id: "TRACK-008",
    signal_tag_scope: "capacity_limit",
    insight_type: "implication",
    content:
      "When floor-space is maxed out for too long, the business makes silent tradeoffs — declined work, deferred hires, strained customer relationships. The new building resolves them all at once.",
    implication_questions: [
      "What tradeoffs has the team been making silently because of the current footprint?",
      "How does decision quality change when capacity isn't the binding constraint?",
      "What does operating with capacity headroom enable that current operations cannot?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-052",
    track_id: "TRACK-008",
    signal_tag_scope: "external_advisor_input",
    insight_type: "reframe",
    content:
      "SBA 504 specialist coordination — CDC partner plus bank lender plus borrower advisors — is the structural feature that makes long-term commitments durable.",
    implication_questions: [
      "How can we structure the working session so all parties engage substantively?",
      "What input does each party need to give clean review?",
      "Where does coordinated review surface concerns that sequential review would miss?",
    ],
    member_type_origins: ["specialty_manufacturer", "general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-009 PACE Loan (3 patterns) ──
  {
    id: "PATTERN-053",
    track_id: "TRACK-009",
    signal_tag_scope: "energy_improvement_target",
    insight_type: "reframe",
    content:
      "PACE financing isn't just about sustainability. It locks in 14-year fixed operating costs during years when energy prices are volatile.",
    implication_questions: [
      "What's your operating cost predictability look like over the next decade without the improvement?",
      "How does energy cost stability change capital planning for other parts of the business?",
      "Where does the long fixed term protect against scenarios that would otherwise stress cashflow?",
    ],
    member_type_origins: ["general", "specialty_manufacturer", "professional_services"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-054",
    track_id: "TRACK-009",
    signal_tag_scope: "stated_growth_aspiration",
    insight_type: "implication",
    content:
      "PACE structure ties improvement assessment to the property — which means improvements transfer with the property and don't constrain operational financing capacity.",
    implication_questions: [
      "How does PACE preserve your financing capacity for operations and growth?",
      "What's the strategic value of separating energy improvements from operating debt?",
      "Where does this structural feature shape how you think about future capital allocation?",
    ],
    member_type_origins: ["general", "specialty_manufacturer"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-055",
    track_id: "TRACK-009",
    signal_tag_scope: "property_eligibility_confirmed",
    insight_type: "reframe",
    content:
      "PACE eligibility confirmation isn't a hurdle — it surfaces whether the property is in a jurisdiction that has invested in energy-improvement financing infrastructure, which signals broader operational fit.",
    implication_questions: [
      "What does this jurisdiction's PACE infrastructure tell us about regional energy-improvement priorities?",
      "How does the PACE program structure reflect local economic development context?",
      "Where does jurisdiction alignment shape implementation timeline?",
    ],
    member_type_origins: ["general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-010 Business Visa Credit Card (2 patterns) ──
  {
    id: "PATTERN-056",
    track_id: "TRACK-010",
    signal_tag_scope: "stated_obstacle_to_growth",
    insight_type: "reframe",
    content:
      "Business credit card capacity isn't a debt facility — it's working capital flexibility that smooths timing mismatches between operations and customer payment cycles.",
    implication_questions: [
      "What timing mismatches do you currently absorb through your operating cash buffer?",
      "How does card flexibility change which decisions are timing-constrained vs cash-constrained?",
      "Where would predictable card capacity reduce decision friction?",
    ],
    member_type_origins: ["general", "event_services", "professional_services"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-057",
    track_id: "TRACK-010",
    signal_tag_scope: "existing_blaze_relationship_depth",
    insight_type: "implication",
    content:
      "A business credit card alongside primary operating accounts produces consolidated cashflow visibility that scattered card relationships cannot match.",
    implication_questions: [
      "Where does scattered card spending obscure your operational picture?",
      "How would consolidated card-plus-account visibility change your monthly review process?",
      "What does single-relationship banking enable that you don't currently have?",
    ],
    member_type_origins: ["general"],
    member_type_applicability: "broad",
  },

  // ── TRACK-011 Unsecured Loan (2 patterns) ──
  {
    id: "PATTERN-058",
    track_id: "TRACK-011",
    signal_tag_scope: "stated_growth_aspiration",
    insight_type: "reframe",
    content:
      "Unsecured financing for bounded purposes preserves collateral capacity for larger commitments — it's a strategic choice, not a fallback when collateral isn't available.",
    implication_questions: [
      "What larger commitments might benefit from preserved collateral capacity over the next 24 months?",
      "How does separating small targeted financing from collateral-backed facilities improve flexibility?",
      "Where does unsecured financing for this specific need fit your broader capital strategy?",
    ],
    member_type_origins: ["general", "event_services", "professional_services"],
    member_type_applicability: "broad",
  },
  {
    id: "PATTERN-059",
    track_id: "TRACK-011",
    signal_tag_scope: "member_tenure",
    insight_type: "implication",
    content:
      "Unsecured financing terms scale with member tenure and relationship depth — the case is fundamentally about predictability of cashflow over the term, not collateral conversion.",
    implication_questions: [
      "What does cashflow predictability look like over the next 5 years?",
      "How does relationship history shape the unsecured financing decision differently than a new-relationship case?",
      "Where does tenure-driven trust translate to structural advantages?",
    ],
    member_type_origins: ["general", "event_services"],
    member_type_applicability: "broad",
  },
];

export async function seedInsightPatterns(prisma: PrismaClient): Promise<number> {
  for (const p of PATTERNS) {
    await prisma.insightPattern.create({
      data: {
        id: p.id,
        track_id: p.track_id,
        signal_tag_scope: p.signal_tag_scope,
        insight_type: p.insight_type,
        content: p.content,
        implication_questions: JSON.stringify(p.implication_questions),
        member_type_origins: JSON.stringify(p.member_type_origins),
        member_type_applicability: p.member_type_applicability,
        status: "approved",
        authored_by: "library_seed",
        approved_at: new Date(),
        approved_by: "library_seed",
      },
    });
  }
  return PATTERNS.length;
}

// ============================================================
// Section 7 — Per-fixture Insight seed (3 routine + 1 novel × 3 fixtures)
// ============================================================
//
// Each Insight has a cached matched_pattern_id, match_confidence, and
// llm_feedback so demo doesn't depend on a live API for the pre-loaded
// fixtures. Live API matching only fires for Insights authored during a
// demo session (per Sprint 5b.1 §E.4).
//
// The Signal-attachment uses a predicate lookup pattern matching the
// Sprint 5a.3 source-linkage shape: { type, captured_at_iso,
// topic_canonical_tag } resolves to a Signal at seed time.

type InsightSeed = {
  // Member slug for lookup.
  member_slug: "jenny" | "northland" | "cygnus";
  track_id: string;
  // Optional Signal predicate. Null when the Insight is Track-level
  // (no addresses_signal_id).
  addresses_signal:
    | {
        type: "goal" | "blocker" | "trigger" | "indecision";
        captured_at_iso: string;
        topic_canonical_tag: string;
      }
    | null;
  insight_type: "reframe" | "implication";
  content: string;
  matched_pattern_id: string | null; // null = novel
  match_confidence: number;
  llm_feedback: string;
  state: "routine" | "novel";
};

const FIXTURE_INSIGHTS: InsightSeed[] = [
  // ── Jenny ──
  // Routine 1 — matches PATTERN-001 (cashflow_volatility reframe)
  {
    member_slug: "jenny",
    track_id: "TRACK-001",
    addresses_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-08",
      topic_canonical_tag: "blocker.cash_flow_seasonal",
    },
    insight_type: "reframe",
    content:
      "Jenny's January cashflow gap is the constraint preventing her from saying yes to corporate event opportunities she has been turning down.",
    matched_pattern_id: "PATTERN-001",
    match_confidence: 0.85,
    llm_feedback:
      "Excellent observation! We often see that seasonal cashflow gaps are the structural constraint preventing growth opportunities the business already sees but cannot pursue.",
    state: "routine",
  },
  // Routine 2 — matches PATTERN-003 (late_paying_customer reframe)
  {
    member_slug: "jenny",
    track_id: "TRACK-001",
    addresses_signal: {
      type: "blocker",
      captured_at_iso: "2025-12-04",
      topic_canonical_tag: "blocker.receivables_timing",
    },
    insight_type: "reframe",
    content:
      "Jenny's 60+ day customer payments mean she is financing her corporate clients' operations through her own working capital.",
    matched_pattern_id: "PATTERN-003",
    match_confidence: 0.82,
    llm_feedback:
      "Excellent observation! Customers stretching payment terms typically indicates the business is financing customer operations through its own working capital.",
    state: "routine",
  },
  // Routine 3 — matches PATTERN-007 (co_decision_maker_input reframe)
  {
    member_slug: "jenny",
    track_id: "TRACK-001",
    addresses_signal: {
      type: "indecision",
      captured_at_iso: "2026-04-08",
      topic_canonical_tag: "indecision.authority",
    },
    insight_type: "reframe",
    content:
      "Mike's review isn't a delay step — it ensures aligned ownership of the facility, which is what makes it work in operations.",
    matched_pattern_id: "PATTERN-007",
    match_confidence: 0.79,
    llm_feedback:
      "You're catching something key about shared decision-making — what concerns matter most to each of you when you work through this together?",
    state: "routine",
  },
  // Novel 1
  {
    member_slug: "jenny",
    track_id: "TRACK-001",
    addresses_signal: {
      type: "goal",
      captured_at_iso: "2024-03-12",
      topic_canonical_tag: "goal.cash_flow_smoothing",
    },
    insight_type: "reframe",
    content:
      "Jenny's catering business has hidden upside in shoulder-season events that competitors don't pursue because their financing won't accommodate the 30-day prep.",
    matched_pattern_id: null,
    match_confidence: 0.32,
    llm_feedback:
      "This observation surfaces a distinct angle on shoulder-season opportunity that doesn't map to a current canonical pattern. Saved as novel for senior-lender review.",
    state: "novel",
  },

  // ── Northland ──
  // Routine 1 — matches PATTERN-010 (capacity_limit reframe)
  {
    member_slug: "northland",
    track_id: "TRACK-002",
    addresses_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
    insight_type: "reframe",
    content:
      "Every customer Northland turns away today builds a relationship with a competitor — those customers don't recover later.",
    matched_pattern_id: "PATTERN-010",
    match_confidence: 0.84,
    llm_feedback:
      "Excellent observation! When operational capacity caps demand, every declined customer is one a competitor builds a relationship with.",
    state: "routine",
  },
  // Routine 2 — matches PATTERN-013 (equipment_breakdown implication)
  {
    member_slug: "northland",
    track_id: "TRACK-002",
    addresses_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
    insight_type: "implication",
    content:
      "The truck breakdown isn't about that vehicle — it's the moment the broader fleet question becomes unavoidable for Northland.",
    matched_pattern_id: "PATTERN-013",
    match_confidence: 0.81,
    llm_feedback:
      "You're catching something key — when this unit failed, what did it tell you about the rest of the fleet?",
    state: "routine",
  },
  // Routine 3 — matches PATTERN-016 (external_advisor_input reframe)
  {
    member_slug: "northland",
    track_id: "TRACK-002",
    addresses_signal: {
      type: "indecision",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "indecision.information",
    },
    insight_type: "reframe",
    content:
      "The CPA's depreciation perspective is structure for the decision, not friction — it sharpens the financing case.",
    matched_pattern_id: "PATTERN-016",
    match_confidence: 0.78,
    llm_feedback:
      "You're catching something key about how the CPA's perspective frames capital decisions — are there tax structuring elements that would change which financing approach makes sense?",
    state: "routine",
  },
  // Novel 1
  {
    member_slug: "northland",
    track_id: "TRACK-002",
    addresses_signal: {
      type: "goal",
      captured_at_iso: "2025-02-22",
      topic_canonical_tag: "goal.fleet_expansion",
    },
    insight_type: "implication",
    content:
      "Northland's growth ceiling isn't capacity — it's that residential customers prefer fleet-marked trucks for trust signals, which the current fleet age contradicts.",
    matched_pattern_id: null,
    match_confidence: 0.28,
    llm_feedback:
      "This observation surfaces a brand-trust angle distinct from the operational-capacity framing in the current library. Saved as novel for senior-lender review.",
    state: "novel",
  },

  // ── Cygnus ──
  // Routine 1 — matches PATTERN-019 (customer_growth_announcement reframe)
  {
    member_slug: "cygnus",
    // Sprint 5c Block D — Cygnus's primary Track migrated TRACK-003 →
    // TRACK-008 SBA 504 (owner-occupied facility). matched_pattern_id
    // intentionally retained at TRACK-003 Patterns where the content
    // matches; Insights and Patterns can reference different Tracks
    // when the underlying observation transfers cleanly.
    track_id: "TRACK-008",
    addresses_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.customer_volume_commitment",
    },
    insight_type: "reframe",
    content:
      "Cygnus's anchor customer growth signals mean the question isn't whether to expand — it's whether expansion arrives ahead of demand or behind it.",
    matched_pattern_id: "PATTERN-019",
    match_confidence: 0.86,
    llm_feedback:
      "Excellent observation! When anchor customers signal volume increases, the timing question becomes operational rather than strategic.",
    state: "routine",
  },
  // Routine 2 — matches PATTERN-017 (real_estate reframe)
  {
    member_slug: "cygnus",
    // Sprint 5c Block D — Cygnus's primary Track migrated TRACK-003 →
    // TRACK-008 SBA 504 (owner-occupied facility). matched_pattern_id
    // intentionally retained at TRACK-003 Patterns where the content
    // matches; Insights and Patterns can reference different Tracks
    // when the underlying observation transfers cleanly.
    track_id: "TRACK-008",
    addresses_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.capacity_expansion_evaluation",
    },
    insight_type: "reframe",
    content:
      "The floor-space constraint at 85% has been making growth decisions for Cygnus by default — without that articulation, opportunities get declined silently.",
    matched_pattern_id: "PATTERN-017",
    match_confidence: 0.83,
    llm_feedback:
      "You're catching something key — what growth assumptions has Cygnus been making implicitly because of the current footprint?",
    state: "routine",
  },
  // Routine 3 — matches PATTERN-022 (co_decision_maker_input reframe).
  // Section 7.3 specifies addressing a "board-approval Indecision";
  // Cygnus's seed has no Indecision Signal so this Insight is
  // Track-level (addresses_signal_id = null). The pattern match is
  // still clean against PATTERN-022 because the content is about
  // co-decision-maker input regardless of Signal attachment.
  {
    member_slug: "cygnus",
    // Sprint 5c Block D — Cygnus's primary Track migrated TRACK-003 →
    // TRACK-008 SBA 504 (owner-occupied facility). matched_pattern_id
    // intentionally retained at TRACK-003 Patterns where the content
    // matches; Insights and Patterns can reference different Tracks
    // when the underlying observation transfers cleanly.
    track_id: "TRACK-008",
    addresses_signal: null,
    insight_type: "reframe",
    content:
      "Board input on the expansion isn't a delay — it produces institutional memory the team will need to execute the decision well over years.",
    matched_pattern_id: "PATTERN-022",
    match_confidence: 0.8,
    llm_feedback:
      "You're catching something key about board engagement — what perspectives does the board bring that the operating team might miss?",
    state: "routine",
  },
  // Novel 1
  {
    member_slug: "cygnus",
    // Sprint 5c Block D — Cygnus's primary Track migrated TRACK-003 →
    // TRACK-008 SBA 504 (owner-occupied facility). matched_pattern_id
    // intentionally retained at TRACK-003 Patterns where the content
    // matches; Insights and Patterns can reference different Tracks
    // when the underlying observation transfers cleanly.
    track_id: "TRACK-008",
    addresses_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.customer_volume_commitment",
    },
    insight_type: "implication",
    content:
      "Cygnus's anchor customers naming them preferred supplier creates obligation pressure — declining is not an option, but timing is the conversation.",
    matched_pattern_id: null,
    match_confidence: 0.31,
    llm_feedback:
      "This observation surfaces an obligation-pressure framing distinct from the timing-driven framing in the current library. Saved as novel for senior-lender review.",
    state: "novel",
  },
];

export async function seedInsightsForFixtures(
  prisma: PrismaClient,
  members: { jenny: { id: string }; northland: { id: string }; cygnus: { id: string } },
  bankerId: string,
): Promise<number> {
  // Pre-resolve topic ids by canonical_tag for predicate lookup (same
  // pattern as Sprint 5a.3 seedFactorCapturesForFixtures).
  const allTopics = await prisma.topic.findMany({
    select: { id: true, canonical_tag: true },
  });
  const topicIdByCanonicalTag = new Map<string, string>();
  for (const t of allTopics) {
    topicIdByCanonicalTag.set(t.canonical_tag, t.id);
  }

  let created = 0;
  for (const ins of FIXTURE_INSIGHTS) {
    const memberId = members[ins.member_slug].id;
    let addresses_signal_id: string | null = null;
    if (ins.addresses_signal) {
      const topicId = topicIdByCanonicalTag.get(
        ins.addresses_signal.topic_canonical_tag,
      );
      if (!topicId) {
        throw new Error(
          `seedInsightsForFixtures: unknown topic ${ins.addresses_signal.topic_canonical_tag}`,
        );
      }
      // Sprint 5e Block D — captured_at constraint dropped from the
      // lookup. Each (member, type, topic) tuple in the demo fixture is
      // unique; member+type+topic_id disambiguates without a date match.
      // The captured_at_iso field stays on InsightSeed.addresses_signal
      // entries as documentation of the original phase mapping.
      const sig = await prisma.signal.findFirst({
        where: {
          member_id: memberId,
          type: ins.addresses_signal.type,
          topic_id: topicId,
        },
        select: { id: true },
      });
      if (!sig) {
        throw new Error(
          `seedInsightsForFixtures: no Signal matched (member=${ins.member_slug}, ` +
            `type=${ins.addresses_signal.type}, ` +
            `topic=${ins.addresses_signal.topic_canonical_tag})`,
        );
      }
      addresses_signal_id = sig.id;
    }

    await prisma.insight.create({
      data: {
        member_id: memberId,
        track_id: ins.track_id,
        addresses_signal_id,
        insight_type: ins.insight_type,
        content: ins.content,
        matched_pattern_id: ins.matched_pattern_id,
        match_confidence: ins.match_confidence,
        llm_feedback: ins.llm_feedback,
        state: ins.state,
        authored_by: bankerId,
      },
    });
    created++;
  }
  return created;
}

export const _insightSeedCounts = {
  patterns: PATTERNS.length,
  fixtureInsights: FIXTURE_INSIGHTS.length,
};
