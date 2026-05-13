/*
 * Sprint 5a.1 Block B + C — Business Factor Matrix seed data.
 *
 * Translates BUSINESS_FACTOR_MATRIX_v1.md Sections 1-4 into Prisma
 * inserts. Verbatim per matrix; no editorial adjustment.
 *
 * Sections:
 *   1. BusinessFactor records (28 factors across 6 categories)
 *   2. TrackTemplate records (5 Tracks)
 *   3. MatrixEntry records (~80+ factor-track relevance rows)
 *   4. FactorCapture records (per-fixture: Jenny, Northland, Cygnus)
 *
 * Matrix interpretation notes (Block B.5 ambiguity handling):
 *   - SBA_size_standard threshold rule for FACTOR-019 / TRACK-004
 *     resolved as a fixed numeric constant (25_000_000) for Sprint
 *     5a.1 demo. Matrix file references the SBA size standard
 *     industry-by-industry; demo uses a single round value that
 *     correctly classifies all three demo Members. Pilot will
 *     resolve via NAICS lookup against the SBA's published table.
 *   - FACTOR-027 "treasury_services_adopted < 3" entry uses an
 *     `array_length` operator that the Block D evaluator does not
 *     support. Treasury Services Track ranking still works for the
 *     demo via FACTOR-019 (size fit) and FACTOR-004 (cash buffer);
 *     FACTOR-027 entry is omitted from MatrixEntry seed and noted
 *     here. Sprint 5a.2 may extend the evaluator to handle array
 *     length expressions, or Pilot can re-evaluate.
 *   - FACTOR-022 + FACTOR-001 composite negative rule on TRACK-002
 *     (cashflow_volatility AND seasonal_variance_pct >= 30)
 *     handled as a single MatrixEntry on FACTOR-022 with a
 *     compound rule that the evaluator's cross-factor lookup
 *     resolves via the captures map.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";

// ============================================================
// Section 1 — BusinessFactor records (28 factors)
// ============================================================

type BusinessFactorSeed = {
  id: string;
  name: string;
  diagnostic_question: string;
  capture_mode: string;
  field_name: string;
  unit: string | null;
  category: string;
  enum_values: string | null;
  notes: string | null;
};

const BUSINESS_FACTORS: BusinessFactorSeed[] = [
  // 1.1 Cashflow factors (5)
  {
    id: "FACTOR-001",
    name: "Seasonal revenue variance",
    diagnostic_question:
      "By what percentage does this Member's revenue swing between peak and trough seasons?",
    capture_mode: "numerical",
    field_name: "seasonal_variance_pct",
    unit: "%",
    category: "cashflow",
    enum_values: null,
    notes:
      "Captured as `seasonal_variance_pct`. Threshold typically referenced at 20%+ (significant) and 30%+ (severe).",
  },
  {
    id: "FACTOR-002",
    name: "Customer payment cycle length",
    diagnostic_question:
      "What's the typical payment cycle from this Member's customers (days outstanding)?",
    capture_mode: "numerical",
    field_name: "customer_payment_days",
    unit: "days",
    category: "cashflow",
    enum_values: null,
    notes:
      "Captured as `customer_payment_days`. Threshold at 45+ (slow), 60+ (very slow).",
  },
  {
    id: "FACTOR-003",
    name: "Accounts receivable concentration",
    diagnostic_question:
      "What percentage of A/R sits with this Member's top 3 customers?",
    capture_mode: "numerical",
    field_name: "ar_concentration_top3_pct",
    unit: "%",
    category: "cashflow",
    enum_values: null,
    notes:
      "Captured as `ar_concentration_top3_pct`. Threshold at 50%+ (concentrated), 70%+ (heavily concentrated).",
  },
  {
    id: "FACTOR-004",
    name: "Operating cash buffer",
    diagnostic_question:
      "How many months of operating expenses does this Member's current cash position cover?",
    capture_mode: "numerical",
    field_name: "operating_cash_months",
    unit: "months",
    category: "cashflow",
    enum_values: null,
    notes:
      "Captured as `operating_cash_months`. Threshold below 2 (thin), below 1 (precarious).",
  },
  {
    id: "FACTOR-005",
    name: "Surplus revenue over costs",
    diagnostic_question:
      "What's this Member's typical operating margin (revenue surplus over costs)?",
    capture_mode: "numerical",
    field_name: "operating_margin_pct",
    unit: "%",
    category: "cashflow",
    enum_values: null,
    notes:
      "Captured as `operating_margin_pct`. Threshold at 40%+ (strong), 20-40% (moderate), <20% (thin).",
  },
  // 1.2 Capacity / growth factors (6)
  {
    id: "FACTOR-006",
    name: "Capacity utilization",
    diagnostic_question:
      "What's this Member's current production or service capacity utilization rate?",
    capture_mode: "numerical",
    field_name: "capacity_utilization_pct",
    unit: "%",
    category: "capacity",
    enum_values: null,
    notes:
      "Captured as `capacity_utilization_pct`. Threshold at 75%+ (constrained), 85%+ (severely constrained).",
  },
  {
    id: "FACTOR-007",
    name: "Demand exceeding capacity",
    diagnostic_question:
      "Is this Member turning down work or losing opportunities due to capacity?",
    capture_mode: "boolean",
    field_name: "demand_exceeds_capacity_observed",
    unit: null,
    category: "capacity",
    enum_values: null,
    notes:
      "Captured as `demand_exceeds_capacity_observed` (boolean) and `lost_revenue_estimate_quarterly` (currency, optional).",
  },
  {
    id: "FACTOR-008",
    name: "Customer growth signal",
    diagnostic_question: "Are anchor customers signaling volume increases?",
    capture_mode: "boolean",
    field_name: "customer_growth_signal",
    unit: null,
    category: "capacity",
    enum_values: null,
    notes:
      "Captured as `customer_growth_signal` (boolean) and `expected_volume_growth_pct` (optional).",
  },
  {
    id: "FACTOR-009",
    name: "Revenue trajectory",
    diagnostic_question:
      "What's this Member's year-over-year revenue trajectory?",
    capture_mode: "numerical",
    field_name: "yoy_revenue_growth_pct",
    unit: "%",
    category: "capacity",
    enum_values: null,
    notes:
      "Captured as `yoy_revenue_growth_pct`. Threshold at 10%+ (growing), 25%+ (rapid growth), <0% (declining).",
  },
  {
    id: "FACTOR-010",
    name: "Equipment / fleet aging",
    diagnostic_question:
      "Is core operating equipment or fleet aging past useful life?",
    capture_mode: "boolean",
    field_name: "equipment_aging_observed",
    unit: null,
    category: "capacity",
    enum_values: null,
    notes:
      "Captured as `equipment_aging_observed` (boolean) and `fleet_avg_age_years` (numerical, optional).",
  },
  {
    id: "FACTOR-011",
    name: "Real estate footprint constraint",
    diagnostic_question:
      "Is the Member's physical footprint limiting growth?",
    capture_mode: "boolean",
    field_name: "real_estate_constraint_observed",
    unit: null,
    category: "capacity",
    enum_values: null,
    notes:
      "Distinguishes CRE candidates from operating-capital candidates.",
  },
  // 1.3 Decision-process factors (4)
  {
    id: "FACTOR-012",
    name: "Decision-maker count",
    diagnostic_question:
      "How many decision-makers participate in financing decisions for this Member?",
    capture_mode: "qualitative_select",
    field_name: "decision_maker_count",
    unit: null,
    category: "decision_process",
    enum_values: JSON.stringify(["1", "2-3", "4+"]),
    notes:
      "Per COMPLIANCE.md §6.3 — captures count, not relationship to Member.",
  },
  {
    id: "FACTOR-013",
    name: "External advisor involvement",
    diagnostic_question:
      "Does the Member rely on an external advisor (CPA, attorney, financial advisor) for major decisions?",
    capture_mode: "boolean",
    field_name: "external_advisor_involved",
    unit: null,
    category: "decision_process",
    enum_values: null,
    notes:
      "Captured as `external_advisor_involved` and `advisor_type` (cpa / attorney / financial_advisor / other).",
  },
  {
    id: "FACTOR-014",
    name: "Co-decision-maker structural fit",
    diagnostic_question:
      "Does the Member need co-decision-maker input for material commitments?",
    capture_mode: "boolean",
    field_name: "co_decision_maker_required",
    unit: null,
    category: "decision_process",
    enum_values: null,
    notes:
      "Process fact, not relationship descriptor. Does not capture who; only that the structure exists.",
  },
  {
    id: "FACTOR-015",
    name: "Decision timeline",
    diagnostic_question:
      "What's the realistic timeline for the Member to commit?",
    capture_mode: "qualitative_select",
    field_name: "decision_timeline",
    unit: null,
    category: "decision_process",
    enum_values: JSON.stringify([
      "this_quarter",
      "next_quarter",
      "6_months",
      "12_months",
      "undefined",
    ]),
    notes: "Drives Track timing fit.",
  },
  // 1.4 Industry / structural factors (5)
  {
    id: "FACTOR-016",
    name: "Industry seasonality match",
    diagnostic_question:
      "Does this Member's industry exhibit defined seasonal patterns?",
    capture_mode: "boolean",
    field_name: "industry_seasonal",
    unit: null,
    category: "industry_structural",
    enum_values: null,
    notes:
      "System-derived for known seasonal industries (catering, agriculture, retail, hospitality).",
  },
  {
    id: "FACTOR-017",
    name: "Inventory turn cycle",
    diagnostic_question:
      "What's the Member's typical inventory turn cycle (days)?",
    capture_mode: "numerical",
    field_name: "inventory_turn_days",
    unit: "days",
    category: "industry_structural",
    enum_values: null,
    notes:
      "Differentiates working-capital-constrained from inventory-light businesses.",
  },
  {
    id: "FACTOR-018",
    name: "Member tenure (years in business)",
    diagnostic_question:
      "How many years has this Member been in operation?",
    capture_mode: "numerical",
    field_name: "member_tenure_years",
    unit: "years",
    category: "industry_structural",
    enum_values: null,
    notes:
      "SBA 7(a) and other Tracks have minimum-tenure thresholds.",
  },
  {
    id: "FACTOR-019",
    name: "Annual revenue band",
    diagnostic_question: "What's the Member's annual revenue?",
    capture_mode: "numerical",
    field_name: "annual_revenue",
    unit: "$",
    category: "industry_structural",
    enum_values: null,
    notes: "Drives many Track size-fit thresholds.",
  },
  {
    id: "FACTOR-020",
    name: "Employee count band",
    diagnostic_question:
      "How many full-time equivalents does this Member employ?",
    capture_mode: "numerical",
    field_name: "employee_count",
    unit: "count",
    category: "industry_structural",
    enum_values: null,
    notes: "SBA-relevant; also drives capacity discussions.",
  },
  // 1.5 Member-stated factors (4 — qualitative discovery)
  {
    id: "FACTOR-021",
    name: "Stated growth aspiration",
    diagnostic_question:
      "What growth aspiration has the Member articulated?",
    capture_mode: "qualitative_select",
    field_name: "growth_aspiration_tag",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "smooth_seasonal_revenue",
      "expand_capacity",
      "acquire_real_estate",
      "diversify_revenue",
      "acquire_equipment",
      "refinance_existing",
      "scale_workforce",
      "other",
    ]),
    notes:
      "Free-form quote also captured alongside the structured tag.",
  },
  {
    id: "FACTOR-022",
    name: "Stated obstacle to growth",
    diagnostic_question:
      "What obstacle to growth has the Member articulated?",
    capture_mode: "qualitative_select",
    field_name: "growth_obstacle_tag",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "cashflow_volatility",
      "customer_concentration",
      "capacity_limit",
      "aging_equipment",
      "real_estate",
      "workforce_gap",
      "regulatory_compliance",
      "other",
    ]),
    notes: null,
  },
  {
    id: "FACTOR-023",
    name: "Stated decision hesitation",
    diagnostic_question:
      "What hesitation has the Member articulated?",
    capture_mode: "qualitative_select",
    field_name: "hesitation_tag",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "timing",
      "pricing",
      "structure",
      "co_decision_maker_input",
      "external_advisor_input",
      "risk_tolerance",
      "capacity_to_service_debt",
      "other",
    ]),
    notes: null,
  },
  {
    id: "FACTOR-024",
    name: "Triggering event observed",
    diagnostic_question:
      "What specific event triggered this conversation about a financial product?",
    capture_mode: "qualitative_select",
    field_name: "trigger_event_tag",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "late_paying_customer",
      "capacity_evaluation",
      "equipment_breakdown",
      "customer_growth_announcement",
      "regulatory_change",
      "refinancing_window",
      "acquisition_opportunity",
      "other",
    ]),
    notes: null,
  },
  // 1.6 Banking-relationship factors (4)
  {
    id: "FACTOR-025",
    name: "Existing Blaze relationship depth",
    diagnostic_question: "How long has this Member banked with Blaze?",
    capture_mode: "numerical",
    field_name: "blaze_relationship_years",
    unit: "years",
    category: "banking_relationship",
    enum_values: null,
    notes:
      "Drives relationship-led vs RFP-style positioning.",
  },
  {
    id: "FACTOR-026",
    name: "Existing credit facility utilization",
    diagnostic_question:
      "What's the utilization rate on the Member's existing credit facilities (if any)?",
    capture_mode: "numerical",
    field_name: "existing_facility_utilization_pct",
    unit: "%",
    category: "banking_relationship",
    enum_values: null,
    notes:
      "High utilization on existing facilities is an LOC expansion signal.",
  },
  // Sprint 5c — FACTOR-027 (Treasury services adoption) dropped
  // alongside TRACK-005 retirement. Treasury Services Upgrade is no
  // longer in the demo Track set; the factor's only role was driving
  // that Track's matrix entries.
  {
    id: "FACTOR-028",
    name: "Prior lending event with non-Blaze institution",
    diagnostic_question:
      "Has the Member taken a material credit facility with a non-Blaze institution in the past 5 years?",
    capture_mode: "boolean",
    field_name: "non_blaze_lending_history",
    unit: null,
    category: "banking_relationship",
    enum_values: null,
    notes:
      "Memory-of-lost-deal context (e.g., Cygnus's 2019 expansion); informs relationship-led pitch framing.",
  },
  // ============================================================
  // Sprint 5c — new factors for Blaze product realignment
  // ============================================================
  {
    id: "FACTOR-029",
    name: "Owner-occupancy confirmed",
    diagnostic_question:
      "Will the Member occupy the real estate for their own business operations (vs lease to others)?",
    capture_mode: "boolean",
    field_name: "owner_occupancy_confirmed",
    unit: null,
    category: "industry_structural",
    enum_values: null,
    notes: "SBA 504 eligibility hinge: requires owner-occupancy ≥51%.",
  },
  {
    id: "FACTOR-030",
    name: "Real estate target property type",
    diagnostic_question:
      "What property type is the Member targeting for investment property acquisition?",
    capture_mode: "qualitative_select",
    field_name: "real_estate_target_property",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "single_family",
      "duplex",
      "triplex",
      "fourplex",
      "small_commercial",
      "other",
    ]),
    notes: "Investment Property Loan eligibility band; 1-4 unit residential.",
  },
  {
    id: "FACTOR-031",
    name: "Energy improvement target",
    diagnostic_question:
      "What energy improvement is the Member targeting?",
    capture_mode: "qualitative_select",
    field_name: "energy_improvement_target",
    unit: null,
    category: "member_stated",
    enum_values: JSON.stringify([
      "solar",
      "ev_charging",
      "efficiency",
      "water_conservation",
      "other",
    ]),
    notes: "PACE Loan applicability tag.",
  },
  {
    id: "FACTOR-032",
    name: "Property PACE-eligibility confirmed",
    diagnostic_question:
      "Is the property in a jurisdiction that participates in PACE financing?",
    capture_mode: "boolean",
    field_name: "property_eligibility_confirmed",
    unit: null,
    category: "industry_structural",
    enum_values: null,
    notes: "PACE Loan structural prerequisite.",
  },
  {
    id: "FACTOR-033",
    name: "Equipment replacement cost (sized)",
    diagnostic_question:
      "What's the estimated total cost of the equipment / machinery acquisition?",
    capture_mode: "numerical",
    field_name: "equipment_replacement_cost_sized",
    unit: "$",
    category: "cashflow",
    enum_values: null,
    notes: "Equipment & Machinery Loan sizing input.",
  },
  {
    id: "FACTOR-034",
    name: "Energy improvement cost (sized)",
    diagnostic_question:
      "What's the estimated total cost of the energy improvement?",
    capture_mode: "numerical",
    field_name: "improvement_cost_sized",
    unit: "$",
    category: "cashflow",
    enum_values: null,
    notes: "PACE Loan sizing input.",
  },
  {
    id: "FACTOR-035",
    name: "Property acquisition amount (sized)",
    diagnostic_question:
      "What's the property's acquisition price (or refinance amount)?",
    capture_mode: "numerical",
    field_name: "property_acquisition_amount_sized",
    unit: "$",
    category: "cashflow",
    enum_values: null,
    notes:
      "Investment Property and SBA 504 sizing input.",
  },
  {
    id: "FACTOR-036",
    name: "Requested credit limit (sized)",
    diagnostic_question:
      "What credit limit is the Member requesting on the business credit card?",
    capture_mode: "numerical",
    field_name: "requested_credit_limit_sized",
    unit: "$",
    category: "cashflow",
    enum_values: null,
    notes: "Business Visa Credit Card sizing.",
  },
  {
    id: "FACTOR-037",
    name: "Requested loan amount (sized)",
    diagnostic_question:
      "What loan amount is the Member requesting (capped at $25K for unsecured)?",
    capture_mode: "numerical",
    field_name: "requested_loan_amount_sized",
    unit: "$",
    category: "cashflow",
    enum_values: null,
    notes:
      "Unsecured Loan sizing; >$25K disqualifies for unsecured tier.",
  },
  {
    id: "FACTOR-038",
    name: "Employee count band",
    diagnostic_question:
      "What's the Member's full-time-equivalent employee count?",
    capture_mode: "numerical",
    field_name: "employee_count_band",
    unit: "FTE",
    category: "industry_structural",
    enum_values: null,
    notes:
      "SBA 504 eligibility (industry-specific thresholds; common ceiling 500 FTE).",
  },
];

// ============================================================
// Section 2 — TrackTemplate records (5 Tracks)
// ============================================================

type TrackTemplateSeed = {
  id: string;
  name: string;
  banker_description: string;
  typical_size_band: string | null;
  required_evidence_per_objective: Record<string, string[]>;
  notes: string | null;
  // Sprint 9 Patch E — MemberType slugs (snake_case from MemberType.name)
  // for which this Track is a natural fit. Drives the Track context
  // dropdown filter on /v2/members/[id]. Empty array = applicable to no
  // one; null/undefined = applicable to everyone (legacy fallback).
  member_type_applicability: string[];
};

const TRACK_TEMPLATES: TrackTemplateSeed[] = [
  {
    id: "TRACK-001",
    name: "Working Capital Line of Credit",
    banker_description:
      "A revolving line of credit sized to absorb cashflow timing mismatches. Member draws during slow periods, repays during peaks. Ideal for businesses with structural cashflow volatility — seasonal patterns, slow-paying customers, or growing AR cycles.",
    typical_size_band: "$25K - $500K small business; $500K - $5M mid-market",
    required_evidence_per_objective: {
      discover: ["FACTOR-024", "FACTOR-022", "FACTOR-016", "FACTOR-001"],
      measure: ["FACTOR-001", "FACTOR-005", "model_produced"],
      consult: ["model_shown", "reaction_captured"],
      navigate: [],
    },
    notes:
      "Most heavily-supported Track in the matrix; cashflow problems are common and well-documented.",
    member_type_applicability: [
      "event_services",
      "maintenance_services",
      "food_services",
      "retail",
    ],
  },
  {
    // Sprint 5c — renamed from "Vehicle / Fleet Loan" to "Business
    // Vehicle Loan" to match Blaze product catalog. Up to 5-year terms,
    // 25% down. Fleet narrative (Northland) still works under this
    // framing — fleet IS multiple business vehicles.
    id: "TRACK-002",
    name: "Business Vehicle Loan",
    banker_description:
      "Term financing for commercial vehicles. Up to 5-year terms with 25% down. Sizing tied to vehicle counts, purchase prices, and trade-in values. Most common for trades, services, logistics, and field-operations businesses.",
    typical_size_band: "$50K - $1M",
    required_evidence_per_objective: {
      discover: ["FACTOR-024", "FACTOR-022"],
      measure: ["FACTOR-007", "FACTOR-006", "FACTOR-010"],
      consult: ["model_produced", "reaction_captured"],
      navigate: [],
    },
    notes:
      "Business Vehicle Loan often emerges from initial discussions about a single vehicle replacement, then expands to fleet-strategy framing.",
    member_type_applicability: [
      "maintenance_services",
      "food_services",
      "construction",
    ],
  },
  {
    id: "TRACK-003",
    name: "Commercial Real Estate Term Loan",
    banker_description:
      "Long-term financing for owner-occupied commercial real estate purchase, construction, or major renovation. Secured by the real estate. Typically requires significant member equity (20-30%) and underwriting around real estate value, business cashflow, and operating capacity.",
    typical_size_band: "$1M - $25M+",
    required_evidence_per_objective: {
      discover: ["FACTOR-024", "FACTOR-021", "FACTOR-022"],
      measure: ["FACTOR-006", "FACTOR-019", "FACTOR-005", "model_produced"],
      consult: ["model_shown", "reaction_captured", "decision_maker_mapping"],
      navigate: ["specialist_handoff_initiated"],
    },
    notes:
      "Most banker-process-intensive Track; requires specialist handoff, multi-month timeline, elaborate underwriting.",
    member_type_applicability: [
      "specialty_manufacturer",
      "professional_services",
      "healthcare_services",
      "retail",
    ],
  },
  {
    id: "TRACK-004",
    name: "SBA 7(a) Loan",
    banker_description:
      "Small Business Administration 7(a) general-purpose loan, partially guaranteed by SBA. Used for working capital, equipment, real estate, business acquisition, debt refinancing, or growth investment. Slower process (60-90+ days), more documentation, accessible to businesses that don't fit conventional credit criteria.",
    typical_size_band: "$50K - $5M",
    required_evidence_per_objective: {
      discover: ["FACTOR-024", "FACTOR-021", "FACTOR-018"],
      measure: ["FACTOR-019", "FACTOR-005"],
      consult: ["FACTOR-015", "reaction_captured"],
      navigate: ["specialist_handoff_initiated"],
    },
    notes:
      "Cross-cutting candidate that ranks moderate for many Members but rarely emerges as primary. Demonstrates matrix's range when banker pivots from primary Track to SBA via the switchboard.",
    member_type_applicability: ["specialty_manufacturer"],
  },
  // ============================================================
  // Sprint 5c — Blaze product realignment: TRACK-005 dropped (Treasury
  // Services Upgrade not in Blaze catalog); 6 new Tracks added mapping
  // to actual Blaze products. TRACK-001 Working Capital LOC and
  // TRACK-004 SBA 7(a) retained as future-expansion framing.
  // ============================================================
  {
    id: "TRACK-006",
    name: "Investment Property Loan",
    banker_description:
      "Term financing for residential investment properties (single-family through fourplex). Sized to property acquisition with rental-income underwriting. Common for Members building real estate portfolios alongside operating businesses.",
    typical_size_band: "$100K - $1M",
    required_evidence_per_objective: {
      discover: ["FACTOR-021", "FACTOR-022", "FACTOR-030"],
      measure: ["FACTOR-019", "FACTOR-026", "FACTOR-035"],
      consult: ["model_produced", "reaction_captured"],
      navigate: ["decision_maker_mapping"],
    },
    notes:
      "Investment Property Loan serves Members positioning real estate as long-horizon asset alongside operating business.",
    member_type_applicability: ["professional_services"],
  },
  {
    id: "TRACK-007",
    name: "Equipment & Machinery",
    banker_description:
      "Term financing for production equipment, machine tools, specialized industry equipment. Up to 7-year terms, 25% down, secured by equipment. Common for trades and manufacturing Members where equipment is the productive asset.",
    typical_size_band: "$50K - $2M",
    required_evidence_per_objective: {
      discover: ["FACTOR-021", "FACTOR-010", "FACTOR-022"],
      measure: ["FACTOR-006", "FACTOR-033", "FACTOR-005"],
      consult: ["model_produced", "reaction_captured"],
      navigate: ["FACTOR-013"],
    },
    notes:
      "Equipment & Machinery often surfaces alongside Vehicle Loan for trades; alongside CRE/SBA 504 for manufacturing.",
    member_type_applicability: [
      "maintenance_services",
      "specialty_manufacturer",
      "healthcare_services",
      "food_services",
      "construction",
    ],
  },
  {
    id: "TRACK-008",
    name: "SBA 504",
    banker_description:
      "Owner-occupied Commercial Real Estate financing through SBA-CDC structure (50% bank first lien, 40% CDC second lien, 10% borrower equity). Longer term and lower equity than conventional CRE for owner-occupants. Specialist coordination required (CRE + SBA + CDC).",
    typical_size_band: "$500K - $20M",
    required_evidence_per_objective: {
      discover: ["FACTOR-021", "FACTOR-029", "FACTOR-022"],
      measure: ["FACTOR-019", "FACTOR-038", "FACTOR-035", "FACTOR-006"],
      consult: ["model_produced", "reaction_captured", "decision_maker_mapping"],
      navigate: ["specialist_handoff_initiated", "FACTOR-013"],
    },
    notes:
      "SBA 504 is owner-occupancy hinge: distinct from TRACK-003 conventional CRE for owner-occupants; structural advantages in term length and equity required.",
    member_type_applicability: [
      "specialty_manufacturer",
      "healthcare_services",
    ],
  },
  {
    id: "TRACK-009",
    name: "PACE Loan",
    banker_description:
      "Property Assessed Clean Energy financing for solar, EV charging, energy efficiency improvements. Up to 100% financing, up to 14-year fixed terms, assessment tied to property (transfers with sale). Available in PACE-eligible jurisdictions.",
    typical_size_band: "$50K - $5M",
    required_evidence_per_objective: {
      discover: ["FACTOR-021", "FACTOR-031"],
      measure: ["FACTOR-032", "FACTOR-034"],
      consult: ["model_produced", "reaction_captured"],
      navigate: ["specialist_handoff_initiated"],
    },
    notes:
      "PACE is niche but structurally distinct: long fixed term, property-bound, energy-improvement-specific. Specialist coordination via PACE program partner.",
    member_type_applicability: [
      "specialty_manufacturer",
      "healthcare_services",
    ],
  },
  {
    id: "TRACK-010",
    name: "Business Visa Credit Card",
    banker_description:
      "Revolving credit for short-term working capital, expense management, and reward-program benefits. No collateral; underwriting on business cashflow + relationship depth. Smaller magnitudes than term-debt facilities.",
    typical_size_band: "$5K - $100K credit limit",
    required_evidence_per_objective: {
      discover: ["FACTOR-022", "FACTOR-018"],
      measure: ["FACTOR-019", "FACTOR-036"],
      consult: ["reaction_captured"],
      navigate: [],
    },
    notes:
      "Often adjacent to operating-account relationships; relationship-deepening tool more than credit-sale.",
    member_type_applicability: [
      "event_services",
      "professional_services",
      "food_services",
      "retail",
    ],
  },
  {
    id: "TRACK-011",
    name: "Unsecured Loan",
    banker_description:
      "Up to $25K, 5-year term, no collateral. Bounded targeted-purpose financing where collateral conversion isn't worth the friction. Underwriting on cashflow predictability + member tenure.",
    typical_size_band: "$5K - $25K",
    required_evidence_per_objective: {
      discover: ["FACTOR-021", "FACTOR-022", "FACTOR-018"],
      measure: ["FACTOR-019", "FACTOR-037"],
      consult: ["model_produced", "reaction_captured"],
      navigate: [],
    },
    notes:
      "Unsecured tier disqualifies above $25K; preserves collateral capacity for larger commitments.",
    member_type_applicability: [
      "event_services",
      "maintenance_services",
      "construction",
    ],
  },
];

// ============================================================
// Section 3 — MatrixEntry records (~80 entries)
// ============================================================

type MatrixEntrySeed = {
  factor_id: string;
  track_id: string;
  strength: string;
  threshold_rule: string | null;
  banker_rationale: string;
};

const MATRIX_ENTRIES: MatrixEntrySeed[] = [
  // ── TRACK-001 Working Capital LOC — strong factors (8) ──
  {
    factor_id: "FACTOR-001",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "seasonal_variance_pct >= 20",
    banker_rationale: "Significant seasonal swing; LOC absorbs the trough",
  },
  {
    factor_id: "FACTOR-001",
    track_id: "TRACK-001",
    strength: "moderate",
    threshold_rule: "seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20",
    banker_rationale: "Modest seasonality; LOC is one of several options",
  },
  {
    factor_id: "FACTOR-002",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "customer_payment_days >= 60",
    banker_rationale: "Severe AR-cycle stretch; LOC bridges the gap",
  },
  {
    factor_id: "FACTOR-002",
    track_id: "TRACK-001",
    strength: "moderate",
    threshold_rule: "customer_payment_days >= 45 AND customer_payment_days < 60",
    banker_rationale: "AR cycle elongated; warrants discussion",
  },
  {
    factor_id: "FACTOR-016",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "industry_seasonal == true",
    banker_rationale: "Industry pattern justifies structural mitigation",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == cashflow_volatility",
    banker_rationale:
      "Member articulated the exact pain LOC addresses",
  },
  {
    factor_id: "FACTOR-024",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "trigger_event_tag == late_paying_customer",
    banker_rationale: "Specific event motivates the conversation",
  },
  {
    factor_id: "FACTOR-026",
    track_id: "TRACK-001",
    strength: "strong",
    threshold_rule: "existing_facility_utilization_pct >= 75",
    banker_rationale: "Existing LOC near limit; expansion signal",
  },
  // TRACK-001 moderate (3)
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-001",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 20",
    banker_rationale: "Capacity-to-service signal",
  },
  {
    factor_id: "FACTOR-009",
    track_id: "TRACK-001",
    strength: "moderate",
    threshold_rule: "yoy_revenue_growth_pct >= 10",
    banker_rationale: "Growing business with volatility tolerance",
  },
  {
    factor_id: "FACTOR-017",
    track_id: "TRACK-001",
    strength: "moderate",
    threshold_rule: "inventory_turn_days >= 60",
    banker_rationale: "Working-capital constrained",
  },
  // TRACK-001 negative (2)
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-001",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "Limited history for LOC underwriting",
  },
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-001",
    strength: "negative",
    threshold_rule: "operating_margin_pct < 0",
    banker_rationale: "Loss-making; capacity-to-service question",
  },

  // ── TRACK-002 Vehicle / Fleet Loan — strong factors (7) ──
  {
    factor_id: "FACTOR-006",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "capacity_utilization_pct >= 75",
    banker_rationale: "Operational capacity constrained",
  },
  {
    factor_id: "FACTOR-007",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "demand_exceeds_capacity_observed == true",
    banker_rationale: "Lost-revenue context",
  },
  {
    factor_id: "FACTOR-010",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "equipment_aging_observed == true",
    banker_rationale: "Replacement-driven need",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == capacity_limit",
    banker_rationale: "Member articulated capacity pain",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == aging_equipment",
    banker_rationale: "Member articulated equipment pain",
  },
  {
    factor_id: "FACTOR-024",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "trigger_event_tag == capacity_evaluation",
    banker_rationale: "Capacity-evaluation event",
  },
  {
    factor_id: "FACTOR-024",
    track_id: "TRACK-002",
    strength: "strong",
    threshold_rule: "trigger_event_tag == equipment_breakdown",
    banker_rationale: "Equipment-breakdown event",
  },
  // TRACK-002 moderate (2)
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-002",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 20",
    banker_rationale: "Capacity-to-service",
  },
  {
    factor_id: "FACTOR-009",
    track_id: "TRACK-002",
    strength: "moderate",
    threshold_rule: "yoy_revenue_growth_pct >= 10",
    banker_rationale: "Justifies expansion vs. replacement",
  },
  // TRACK-002 negative (2) — composite rule on FACTOR-022
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-002",
    strength: "negative",
    threshold_rule:
      "growth_obstacle_tag == cashflow_volatility AND seasonal_variance_pct >= 30",
    banker_rationale:
      "Working capital comes first when cashflow volatility is severe",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-002",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "Limited history",
  },

  // ── TRACK-003 CRE Term Loan — strong factors (7) ──
  {
    factor_id: "FACTOR-006",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "capacity_utilization_pct >= 80",
    banker_rationale: "Operational pressure justifies expansion",
  },
  {
    factor_id: "FACTOR-008",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule:
      "customer_growth_signal == true AND expected_volume_growth_pct >= 15",
    banker_rationale: "Demand justification",
  },
  {
    factor_id: "FACTOR-011",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "real_estate_constraint_observed == true",
    banker_rationale: "Footprint pain",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "annual_revenue >= 10000000",
    banker_rationale: "Capital-adequacy floor for typical CRE deal",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == acquire_real_estate",
    banker_rationale: "Direct aspiration match",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == expand_capacity",
    banker_rationale: "Capacity-driven CRE move",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-003",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == real_estate",
    banker_rationale: "Member articulated real-estate pain",
  },
  // TRACK-003 moderate (7)
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 20",
    banker_rationale: "Capacity-to-service term debt",
  },
  {
    factor_id: "FACTOR-009",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "yoy_revenue_growth_pct >= 10",
    banker_rationale: "Growth justifies investment",
  },
  {
    factor_id: "FACTOR-013",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "external_advisor_involved == true",
    banker_rationale: "Procedural fit for material commitment",
  },
  {
    factor_id: "FACTOR-014",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "co_decision_maker_required == true",
    banker_rationale: "Decision-process complexity",
  },
  {
    factor_id: "FACTOR-015",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "decision_timeline IN [6_months, 12_months]",
    banker_rationale: "CRE process tolerates timeline",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "member_tenure_years >= 5",
    banker_rationale: "Established history",
  },
  {
    factor_id: "FACTOR-025",
    track_id: "TRACK-003",
    strength: "moderate",
    threshold_rule: "blaze_relationship_years >= 10",
    banker_rationale: "Relationship-led pitch fit",
  },
  // TRACK-003 negative (3)
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-003",
    strength: "negative",
    threshold_rule: "annual_revenue < 5000000",
    banker_rationale: "Sizing fit problem",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-003",
    strength: "negative",
    threshold_rule: "member_tenure_years < 3",
    banker_rationale: "Limited history for material commitment",
  },
  // Sprint 5c — owner-occupancy demotes conventional CRE: when the
  // Member is acquiring for their own operations, SBA 504 (TRACK-008)
  // is structurally better fit (longer term, lower equity, partial
  // guarantee). The negative-tier on TRACK-003 doesn't disqualify
  // outright but ranks TRACK-003 insufficient so SBA 504 surfaces as
  // the primary candidate.
  {
    factor_id: "FACTOR-029",
    track_id: "TRACK-003",
    strength: "negative",
    threshold_rule: "owner_occupancy_confirmed == true",
    banker_rationale:
      "Owner-occupancy points toward SBA 504 (better terms for owner-occupants)",
  },

  // ── TRACK-004 SBA 7(a) — strong factors (2) ──
  // Matrix interpretation note: SBA_size_standard is NAICS-specific
  // in the real world. Demo uses a fixed $25M threshold that
  // correctly classifies all three demo Members (Jenny $850K and
  // Northland $2.4M qualify; Cygnus $28M exceeds).
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-004",
    strength: "strong",
    threshold_rule: "member_tenure_years >= 2",
    banker_rationale: "SBA eligibility floor",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-004",
    strength: "strong",
    threshold_rule: "annual_revenue <= 25000000",
    banker_rationale:
      "SBA size-standard ceiling (industry-specific in practice; demo uses $25M placeholder)",
  },
  // TRACK-004 moderate (8)
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 15",
    banker_rationale: "Capacity-to-service",
  },
  {
    factor_id: "FACTOR-009",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule: "yoy_revenue_growth_pct >= 0",
    banker_rationale: "Stable or growing",
  },
  {
    factor_id: "FACTOR-013",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule: "external_advisor_involved == true AND advisor_type == cpa",
    banker_rationale: "Helps SBA paperwork burden",
  },
  {
    factor_id: "FACTOR-015",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule: "decision_timeline IN [6_months, 12_months]",
    banker_rationale: "SBA timeline tolerance",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule: "growth_aspiration_tag != null",
    banker_rationale: "SBA serves many use-of-proceeds",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-004",
    strength: "moderate",
    threshold_rule:
      "growth_obstacle_tag IN [capacity_limit, cashflow_volatility, aging_equipment]",
    banker_rationale: "Use-of-proceeds case",
  },
  // TRACK-004 negative (3)
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-004",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "SBA eligibility floor not met",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-004",
    strength: "negative",
    threshold_rule: "annual_revenue > 25000000",
    banker_rationale:
      "SBA size-standard exceeded (demo placeholder; real SBA ceiling is NAICS-specific)",
  },
  {
    factor_id: "FACTOR-015",
    track_id: "TRACK-004",
    strength: "negative",
    threshold_rule: "decision_timeline == this_quarter",
    banker_rationale: "SBA process won't fit a this-quarter timeline",
  },

  // ============================================================
  // Sprint 5c — TRACK-005 Treasury Services Upgrade entries dropped
  // alongside Track retirement. FACTOR-027 (treasury_services_adopted)
  // factor + LENGTH-based entry also dropped.
  // ============================================================

  // ── TRACK-006 Investment Property Loan ──
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-006",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == acquire_real_estate",
    banker_rationale: "Direct aspiration match",
  },
  {
    factor_id: "FACTOR-030",
    track_id: "TRACK-006",
    strength: "strong",
    threshold_rule: "real_estate_target_property IN [single_family, duplex, triplex, fourplex]",
    banker_rationale: "Property type fits 1-4 unit residential band",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "annual_revenue >= 500000",
    banker_rationale: "Operating-business cashflow capacity",
  },
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 15",
    banker_rationale: "Cashflow surplus to service property debt",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "member_tenure_years >= 3",
    banker_rationale: "Operating-business stability for portfolio play",
  },
  {
    factor_id: "FACTOR-013",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "external_advisor_involved == true",
    banker_rationale: "CPA + real estate advisor input typical",
  },
  {
    factor_id: "FACTOR-014",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "co_decision_maker_required == true",
    banker_rationale: "Household-level decision common for investment property",
  },
  {
    factor_id: "FACTOR-026",
    track_id: "TRACK-006",
    strength: "moderate",
    threshold_rule: "existing_facility_utilization_pct < 70",
    banker_rationale: "Capacity to take on additional debt service",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-006",
    strength: "negative",
    threshold_rule: "annual_revenue < 250000",
    banker_rationale: "Operating cashflow too thin for portfolio play",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-006",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "Limited operating-business history",
  },

  // ── TRACK-007 Equipment & Machinery ──
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-007",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == acquire_equipment",
    banker_rationale: "Direct aspiration match",
  },
  {
    factor_id: "FACTOR-010",
    track_id: "TRACK-007",
    strength: "strong",
    threshold_rule: "equipment_aging_observed == true",
    banker_rationale: "Replacement-driven need",
  },
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-007",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == aging_equipment",
    banker_rationale: "Member articulated equipment pain",
  },
  {
    factor_id: "FACTOR-024",
    track_id: "TRACK-007",
    strength: "strong",
    threshold_rule: "trigger_event_tag == equipment_breakdown",
    banker_rationale: "Equipment failure forced the conversation",
  },
  {
    factor_id: "FACTOR-006",
    track_id: "TRACK-007",
    strength: "moderate",
    threshold_rule: "capacity_utilization_pct >= 75",
    banker_rationale: "Equipment expansion drives capacity",
  },
  {
    factor_id: "FACTOR-005",
    track_id: "TRACK-007",
    strength: "moderate",
    threshold_rule: "operating_margin_pct >= 15",
    banker_rationale: "Capacity to service term debt",
  },
  {
    factor_id: "FACTOR-009",
    track_id: "TRACK-007",
    strength: "moderate",
    threshold_rule: "yoy_revenue_growth_pct >= 10",
    banker_rationale: "Growth justifies expansion vs replacement",
  },
  {
    factor_id: "FACTOR-013",
    track_id: "TRACK-007",
    strength: "moderate",
    threshold_rule: "external_advisor_involved == true",
    banker_rationale: "CPA depreciation strategy typical",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-007",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "Limited history for equipment financing",
  },

  // ── TRACK-008 SBA 504 ──
  {
    factor_id: "FACTOR-029",
    track_id: "TRACK-008",
    strength: "strong",
    threshold_rule: "owner_occupancy_confirmed == true",
    banker_rationale: "Owner-occupancy is SBA 504 eligibility hinge",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-008",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == acquire_real_estate",
    banker_rationale: "Direct aspiration match for owner-occupied CRE",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-008",
    strength: "strong",
    threshold_rule: "growth_aspiration_tag == expand_capacity",
    banker_rationale: "Capacity-driven facility acquisition",
  },
  {
    factor_id: "FACTOR-008",
    track_id: "TRACK-008",
    strength: "strong",
    threshold_rule: "customer_growth_signal == true AND expected_volume_growth_pct >= 15",
    banker_rationale: "Anchor-customer growth justifies expansion",
  },
  {
    factor_id: "FACTOR-011",
    track_id: "TRACK-008",
    strength: "strong",
    threshold_rule: "real_estate_constraint_observed == true",
    banker_rationale: "Footprint pain confirmed",
  },
  {
    factor_id: "FACTOR-006",
    track_id: "TRACK-008",
    strength: "moderate",
    threshold_rule: "capacity_utilization_pct >= 80",
    banker_rationale: "Capacity pressure justifies expansion",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-008",
    strength: "moderate",
    threshold_rule: "annual_revenue >= 5000000",
    banker_rationale: "Cashflow capacity for material commitment",
  },
  {
    factor_id: "FACTOR-038",
    track_id: "TRACK-008",
    strength: "moderate",
    threshold_rule: "employee_count_band <= 500",
    banker_rationale: "SBA 504 size standard typical ceiling",
  },
  {
    factor_id: "FACTOR-014",
    track_id: "TRACK-008",
    strength: "moderate",
    threshold_rule: "co_decision_maker_required == true",
    banker_rationale: "Board / multi-stakeholder decision common",
  },
  {
    factor_id: "FACTOR-013",
    track_id: "TRACK-008",
    strength: "moderate",
    threshold_rule: "external_advisor_involved == true",
    banker_rationale: "Legal / CPA / banker advisory typical",
  },
  {
    factor_id: "FACTOR-029",
    track_id: "TRACK-008",
    strength: "negative",
    threshold_rule: "owner_occupancy_confirmed == false",
    banker_rationale: "SBA 504 requires owner-occupancy ≥51%",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-008",
    strength: "negative",
    threshold_rule: "member_tenure_years < 3",
    banker_rationale: "Limited history for material commitment",
  },

  // ── TRACK-009 PACE Loan ──
  {
    factor_id: "FACTOR-031",
    track_id: "TRACK-009",
    strength: "strong",
    threshold_rule: "energy_improvement_target IN [solar, ev_charging, efficiency]",
    banker_rationale: "PACE-eligible improvement target",
  },
  {
    factor_id: "FACTOR-032",
    track_id: "TRACK-009",
    strength: "strong",
    threshold_rule: "property_eligibility_confirmed == true",
    banker_rationale: "PACE structural prerequisite",
  },
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-009",
    strength: "moderate",
    threshold_rule: "growth_aspiration_tag != null",
    banker_rationale: "PACE serves multiple use-of-proceeds",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-009",
    strength: "moderate",
    threshold_rule: "member_tenure_years >= 3",
    banker_rationale: "Long PACE term tolerates established history",
  },
  {
    factor_id: "FACTOR-032",
    track_id: "TRACK-009",
    strength: "negative",
    threshold_rule: "property_eligibility_confirmed == false",
    banker_rationale: "PACE requires participating jurisdiction",
  },
  {
    factor_id: "FACTOR-031",
    track_id: "TRACK-009",
    strength: "negative",
    threshold_rule: "energy_improvement_target == other",
    banker_rationale: "PACE-eligible improvement type required",
  },

  // ── TRACK-010 Business Visa Credit Card ──
  {
    factor_id: "FACTOR-022",
    track_id: "TRACK-010",
    strength: "strong",
    threshold_rule: "growth_obstacle_tag == cashflow_volatility",
    banker_rationale: "Card capacity smooths timing mismatches",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-010",
    strength: "moderate",
    threshold_rule: "member_tenure_years >= 2",
    banker_rationale: "Tenure floor for unsecured revolving",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-010",
    strength: "moderate",
    threshold_rule: "annual_revenue >= 250000",
    banker_rationale: "Operating-cashflow band for card sizing",
  },
  {
    factor_id: "FACTOR-025",
    track_id: "TRACK-010",
    strength: "moderate",
    threshold_rule: "blaze_relationship_years >= 1",
    banker_rationale: "Existing relationship anchors card adoption",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-010",
    strength: "negative",
    threshold_rule: "member_tenure_years < 1",
    banker_rationale: "Tenure floor not met",
  },

  // ── TRACK-011 Unsecured Loan ──
  {
    factor_id: "FACTOR-021",
    track_id: "TRACK-011",
    strength: "moderate",
    threshold_rule: "growth_aspiration_tag != null",
    banker_rationale: "Bounded targeted-purpose use-of-proceeds",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-011",
    strength: "moderate",
    threshold_rule: "member_tenure_years >= 3",
    banker_rationale: "Tenure-driven trust for unsecured tier",
  },
  {
    factor_id: "FACTOR-019",
    track_id: "TRACK-011",
    strength: "moderate",
    threshold_rule: "annual_revenue >= 250000",
    banker_rationale: "Cashflow predictability over 5-year term",
  },
  {
    factor_id: "FACTOR-037",
    track_id: "TRACK-011",
    strength: "negative",
    threshold_rule: "requested_loan_amount_sized > 25000",
    banker_rationale: "Unsecured tier capped at $25K",
  },
  {
    factor_id: "FACTOR-018",
    track_id: "TRACK-011",
    strength: "negative",
    threshold_rule: "member_tenure_years < 2",
    banker_rationale: "Limited history for unsecured tier",
  },
];

// ============================================================
// Section 4 — Per-fixture FactorCapture seed data
// ============================================================

type FactorCaptureSeed = {
  factor_id: string;
  numerical_value?: number | null;
  boolean_value?: boolean | null;
  qualitative_value?: string | null;
  unit?: string | null;
  // Sprint 5a.3 Block A — source linkage. When present, the seed
  // resolves this predicate to a Signal id and writes source_signal_id
  // on the FactorCapture. The lookup uniquely identifies a Signal by
  // (member, type, captured_at, topic_canonical_tag) — Cygnus Apr 21
  // has two same-day same-type Triggers, hence the topic disambiguator.
  // The popup-as-workflow surface uses source_signal_id to render the
  // banker's verbatim Member quote inside the captured-row blockquote.
  source_signal?: {
    type: "goal" | "blocker" | "trigger" | "indecision";
    captured_at_iso: string;
    topic_canonical_tag: string;
  };
};

// Section 4.1 — Jenny's Catering
//
// Sprint 5a.3 Block A — source_signal predicates added per audit. See
// Sprint 5a.3 BUILD_LOG entry for the full per-fixture linkage map and
// ambiguity-call rationale (Ambiguity #1: FACTOR-022 cashflow_volatility
// → seasonalSignal because the seasonal pattern is the structural
// volatility, while late-paying-customers is one symptom).
const JENNY_CAPTURES: FactorCaptureSeed[] = [
  {
    factor_id: "FACTOR-001",
    numerical_value: 28,
    unit: "%",
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-08",
      topic_canonical_tag: "blocker.cash_flow_seasonal",
    },
  },
  {
    factor_id: "FACTOR-002",
    numerical_value: 65,
    unit: "days",
    source_signal: {
      type: "blocker",
      captured_at_iso: "2025-12-04",
      topic_canonical_tag: "blocker.receivables_timing",
    },
  },
  { factor_id: "FACTOR-005", numerical_value: 22, unit: "%" },
  {
    factor_id: "FACTOR-014",
    boolean_value: true,
    source_signal: {
      type: "indecision",
      captured_at_iso: "2026-04-08",
      topic_canonical_tag: "indecision.authority",
    },
  },
  { factor_id: "FACTOR-015", qualitative_value: "next_quarter" },
  { factor_id: "FACTOR-016", boolean_value: true },
  { factor_id: "FACTOR-018", numerical_value: 7, unit: "years" },
  { factor_id: "FACTOR-019", numerical_value: 850000, unit: "$" },
  {
    factor_id: "FACTOR-021",
    qualitative_value: "smooth_seasonal_revenue",
    source_signal: {
      type: "goal",
      captured_at_iso: "2024-03-12",
      topic_canonical_tag: "goal.cash_flow_smoothing",
    },
  },
  {
    factor_id: "FACTOR-022",
    qualitative_value: "cashflow_volatility",
    // Ambiguity #1: routes to seasonalSignal (Apr 8 — "January and
    // February kill us"). The seasonal pattern IS the structural
    // cashflow volatility. Receivables-timing is one symptom.
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-08",
      topic_canonical_tag: "blocker.cash_flow_seasonal",
    },
  },
  {
    factor_id: "FACTOR-024",
    qualitative_value: "late_paying_customer",
    // Ambiguity #2: trigger-tag routes to a Blocker-type Signal
    // (Dec 2025 receivables). Cross-type linkage is provenance, not
    // type matching. See BUILD_LOG Note 1 for Pilot decision.
    source_signal: {
      type: "blocker",
      captured_at_iso: "2025-12-04",
      topic_canonical_tag: "blocker.receivables_timing",
    },
  },
  { factor_id: "FACTOR-025", numerical_value: 6, unit: "years" },
  // Sprint 5c — FACTOR-027 capture dropped alongside TRACK-005 retirement.
];

// Section 4.2 — Northland HVAC
//
// Sprint 5a.3 Block A — Ambiguity #3: Northland has no Trigger-type
// Signal; FACTOR-024 (capacity_evaluation tag) routes to capSignal
// (Blocker capturing the same conversation) for the rich "I came in to
// look at financing for my own truck" quote.
const NORTHLAND_CAPTURES: FactorCaptureSeed[] = [
  {
    factor_id: "FACTOR-006",
    numerical_value: 88,
    unit: "%",
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
  },
  {
    factor_id: "FACTOR-007",
    boolean_value: true,
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
  },
  { factor_id: "FACTOR-009", numerical_value: 18, unit: "%" },
  { factor_id: "FACTOR-010", boolean_value: true },
  {
    factor_id: "FACTOR-013",
    boolean_value: true,
    source_signal: {
      type: "indecision",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "indecision.information",
    },
  },
  { factor_id: "FACTOR-018", numerical_value: 12, unit: "years" },
  { factor_id: "FACTOR-019", numerical_value: 2400000, unit: "$" },
  {
    factor_id: "FACTOR-021",
    qualitative_value: "expand_capacity",
    source_signal: {
      type: "goal",
      captured_at_iso: "2025-02-22",
      topic_canonical_tag: "goal.fleet_expansion",
    },
  },
  {
    factor_id: "FACTOR-022",
    qualitative_value: "capacity_limit",
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
  },
  {
    factor_id: "FACTOR-024",
    qualitative_value: "capacity_evaluation",
    // Ambiguity #3 — cross-type linkage to Blocker; no Trigger Signal
    // exists for Northland.
    source_signal: {
      type: "blocker",
      captured_at_iso: "2026-04-15",
      topic_canonical_tag: "blocker.capacity_constrained",
    },
  },
  // Sprint 5c — FACTOR-027 capture dropped alongside TRACK-005 retirement.
];

// Section 4.3 — Cygnus Bioscience
//
// Sprint 5a.3 Block A — Ambiguity #4: FACTOR-022 (real_estate
// growth_obstacle_tag) routes to cygnusCapacityEvalSignal because the
// floor-space pain is captured in that Trigger Signal, not a separate
// Blocker. Cross-type linkage (obstacle-tag → Trigger Signal); see
// BUILD_LOG Note 1.
const CYGNUS_CAPTURES: FactorCaptureSeed[] = [
  {
    factor_id: "FACTOR-006",
    numerical_value: 85,
    unit: "%",
    // The 85% utilization figure is verbatim in the Goal Signal's
    // quote ("about eighty-five percent capacity utilization").
    source_signal: {
      type: "goal",
      captured_at_iso: "2024-11-15",
      topic_canonical_tag: "goal.customer_growth",
    },
  },
  {
    factor_id: "FACTOR-008",
    boolean_value: true,
    source_signal: {
      type: "goal",
      captured_at_iso: "2024-11-15",
      topic_canonical_tag: "goal.customer_growth",
    },
  },
  { factor_id: "FACTOR-009", numerical_value: 15, unit: "%" },
  {
    factor_id: "FACTOR-011",
    boolean_value: true,
    source_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.capacity_expansion_evaluation",
    },
  },
  { factor_id: "FACTOR-013", boolean_value: true },
  { factor_id: "FACTOR-014", boolean_value: true },
  {
    factor_id: "FACTOR-015",
    qualitative_value: "6_months",
    // "within the next two quarters" is the timeline phrase in the
    // capacity-eval trigger Signal.
    source_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.capacity_expansion_evaluation",
    },
  },
  { factor_id: "FACTOR-018", numerical_value: 22, unit: "years" },
  { factor_id: "FACTOR-019", numerical_value: 28000000, unit: "$" },
  {
    factor_id: "FACTOR-021",
    qualitative_value: "expand_capacity",
    source_signal: {
      type: "goal",
      captured_at_iso: "2024-11-15",
      topic_canonical_tag: "goal.customer_growth",
    },
  },
  {
    factor_id: "FACTOR-022",
    qualitative_value: "real_estate",
    // Ambiguity #4: real_estate obstacle routes to capacity-eval
    // Trigger Signal where the floor-space pain is captured.
    source_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.capacity_expansion_evaluation",
    },
  },
  {
    factor_id: "FACTOR-024",
    qualitative_value: "customer_growth_announcement",
    // Cygnus has TWO Triggers on Apr 21; topic disambiguator routes
    // FACTOR-024 to the volume-commitment trigger ("Three of our
    // biggest customers...").
    source_signal: {
      type: "trigger",
      captured_at_iso: "2026-04-21",
      topic_canonical_tag: "trigger.customer_volume_commitment",
    },
  },
  { factor_id: "FACTOR-025", numerical_value: 22, unit: "years" },
  { factor_id: "FACTOR-028", boolean_value: true },
  // Sprint 5c Block D — Cygnus's primary Track shifts from TRACK-003
  // conventional CRE to TRACK-008 SBA 504 (owner-occupied manufacturing
  // facility). New SBA-504-specific factor captures land here so the
  // ranker surfaces TRACK-008 as primary.
  { factor_id: "FACTOR-029", boolean_value: true }, // owner_occupancy_confirmed
  { factor_id: "FACTOR-038", numerical_value: 85, unit: "FTE" }, // employee_count_band — within SBA 504 typical ceiling
  { factor_id: "FACTOR-035", numerical_value: 5500000, unit: "$" }, // property_acquisition_amount_sized — mid of $4-7M expansion scope
];

// ============================================================
// Seed entry points
// ============================================================

export async function seedBusinessFactorMatrix(prisma: PrismaClient) {
  for (const f of BUSINESS_FACTORS) {
    await prisma.businessFactor.create({ data: f });
  }
  for (const t of TRACK_TEMPLATES) {
    const { member_type_applicability, ...rest } = t;
    await prisma.trackTemplate.create({
      data: {
        ...rest,
        required_evidence_per_objective: t.required_evidence_per_objective,
        // Sprint 9 Patch E — applicability matrix lives on Track. JSON-
        // stringified array of MemberType slugs.
        member_type_applicability: JSON.stringify(member_type_applicability),
      },
    });
  }
  for (const e of MATRIX_ENTRIES) {
    await prisma.matrixEntry.create({ data: e });
  }
}

export async function seedFactorCapturesForFixtures(
  prisma: PrismaClient,
  members: { jenny: { id: string }; northland: { id: string }; cygnus: { id: string } },
  bankerId: string,
) {
  // Sprint 5a.3 Block A — pre-resolve topic ids by canonical_tag for
  // source_signal predicate lookups. Done once before the per-fixture
  // loop to avoid N queries.
  const allTopics = await prisma.topic.findMany({
    select: { id: true, canonical_tag: true },
  });
  const topicIdByCanonicalTag = new Map<string, string>();
  for (const t of allTopics) {
    topicIdByCanonicalTag.set(t.canonical_tag, t.id);
  }

  type FixtureBlock = {
    member_id: string;
    captures: FactorCaptureSeed[];
  };
  const fixtures: FixtureBlock[] = [
    { member_id: members.jenny.id, captures: JENNY_CAPTURES },
    { member_id: members.northland.id, captures: NORTHLAND_CAPTURES },
    { member_id: members.cygnus.id, captures: CYGNUS_CAPTURES },
  ];
  for (const fx of fixtures) {
    for (const c of fx.captures) {
      // Sprint 5a.3 Block A — resolve source_signal_id from predicate.
      // Fail loud (throw) if the predicate doesn't resolve to a single
      // Signal — silent null linkage would mask seed-data bugs that
      // visual review would only catch by missing-quote inspection.
      let source_signal_id: string | null = null;
      if (c.source_signal) {
        const topicId = topicIdByCanonicalTag.get(
          c.source_signal.topic_canonical_tag,
        );
        if (!topicId) {
          throw new Error(
            `seedFactorCapturesForFixtures: unknown topic canonical_tag ` +
              `"${c.source_signal.topic_canonical_tag}" for factor ${c.factor_id}`,
          );
        }
        // Sprint 5e Block D — captured_at constraint dropped from the
        // lookup. Each (member, type, topic) tuple in the demo fixture
        // is unique (verified — no duplicates), so member+type+topic_id
        // disambiguates without a date match. Dropping the date keeps
        // the lookup robust against the relative-date helper used in
        // seed.ts (`daysAgo(n)`), which produces a different exact
        // millisecond on each seed run while preserving the relative
        // window. The `captured_at_iso` field is retained on
        // FactorCaptureSeed source_signal entries as documentation of
        // the original phase mapping; it doesn't drive lookup.
        const sig = await prisma.signal.findFirst({
          where: {
            member_id: fx.member_id,
            type: c.source_signal.type,
            topic_id: topicId,
          },
          select: { id: true },
        });
        if (!sig) {
          throw new Error(
            `seedFactorCapturesForFixtures: no Signal matched ` +
              `(member=${fx.member_id}, type=${c.source_signal.type}, ` +
              `topic=${c.source_signal.topic_canonical_tag}, ` +
              `captured_at=${c.source_signal.captured_at_iso}) for factor ${c.factor_id}`,
          );
        }
        source_signal_id = sig.id;
      }
      await prisma.factorCapture.create({
        data: {
          member_id: fx.member_id,
          factor_id: c.factor_id,
          numerical_value: c.numerical_value ?? null,
          boolean_value: c.boolean_value ?? null,
          qualitative_value: c.qualitative_value ?? null,
          unit: c.unit ?? null,
          source_signal_id,
          banker_id: bankerId,
        },
      });
    }
  }
}

export const _seedCounts = {
  businessFactors: BUSINESS_FACTORS.length,
  trackTemplates: TRACK_TEMPLATES.length,
  matrixEntries: MATRIX_ENTRIES.length,
};
