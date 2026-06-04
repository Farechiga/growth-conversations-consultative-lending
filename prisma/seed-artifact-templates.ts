/*
 * Sprint 5d Block B — ArtifactTemplate seed.
 *
 * Source: CONTENT_REWRITE_v1.md Sections 9.1-9.8 (verbatim title,
 * description, structural-content field lists, output_summary_template,
 * and Member-Type applicability). Parameter schemas are derived from
 * each section's structural-content field list — every line item becomes
 * a parameter_schema entry with key/label/type inferred from the text.
 *
 * No banking-conventions scaffolding. Each template carries only what
 * Section 9 specifies; nothing extra, nothing invented.
 */

import type { PrismaClient } from "../app/generated/prisma/client";

type TemplateSeed = {
  id: string;
  track_id: string;
  title: string;
  description: string;
  member_type_applicability: string; // 'broad' or JSON-encoded array
  parameter_schema: object;
  output_summary_template: string;
  structural_content: object;
};

const TEMPLATES: TemplateSeed[] = [
  // ============================================================
  // 9.1 — TRACK-003 Commercial Real Estate Term Loan
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-001",
    track_id: "TRACK-003",
    title: "CRE acquisition financing",
    description: "",
    member_type_applicability: JSON.stringify([
      "specialty_manufacturer",
      "maintenance_services",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "property_type",
          label: "Property type",
          type: "select",
          options: ["Retail", "Warehouse", "Industrial", "Office", "Mixed-use"],
          // BUILD 2a §3 — chart never reads property_type; not required.
        },
        { key: "acquisition_price", label: "Acquisition price", type: "currency", required: true, source_factor_id: "FACTOR-035" },
        { key: "loan_amount", label: "Loan amount", type: "currency" },
        {
          key: "ltv_ratio",
          label: "LTV ratio",
          type: "percentage",
          computed: true,
          computation: "loan_amount / acquisition_price",
        },
        {
          key: "amortization_years",
          label: "Amortization (years)",
          type: "integer",
          default: 25,
        },
        { key: "interest_rate", label: "Interest rate", type: "percentage" },
        { key: "current_monthly_rent", label: "Current monthly rent", type: "currency", required: true },
        { key: "annual_rent_escalation", label: "Annual rent escalation", type: "percentage", default: 3 },
        { key: "annual_appreciation", label: "Property appreciation", type: "percentage", default: 3 },
      ],
    },
    // Sprint 9 Block B — lease-vs-own wealth visualization.
    output_summary_template:
      "{property_type} at ${acquisition_price}. Mortgage of ${loan_amount} at {interest_rate}, {amortization_years}-year term. Current rent ${current_monthly_rent}/mo vs. owning. Crossover to ownership advantage around year 6-8; substantial equity built by year 15.",
    structural_content: {
      type: "lease_vs_own",
    },
  },

  // ============================================================
  // 9.2 — TRACK-004 SBA 7(a) financing structure
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-002",
    track_id: "TRACK-004",
    title: "SBA 7(a) growth financing",
    description: "",
    member_type_applicability: JSON.stringify([
      "event_services",
      "maintenance_services",
      "specialty_manufacturer",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "use_of_proceeds",
          label: "Use of proceeds",
          type: "select",
          options: [
            "Working capital",
            "Equipment",
            "Real estate",
            "Acquisition",
            "Refinancing",
          ],
          required: true,
        },
        { key: "loan_amount", label: "Loan amount", type: "currency", required: true, source_factor_id: "FACTOR-037" },
        { key: "current_annual_revenue", label: "Current annual revenue", type: "currency", required: true, source_factor_id: "FACTOR-019" },
        { key: "term_years", label: "Term (years)", type: "integer", default: 10 },
        { key: "interest_rate", label: "Interest rate", type: "percentage" },
        { key: "expected_year_1_revenue_uplift", label: "Year 1 revenue uplift", type: "currency", required: true },
        { key: "expected_annual_growth_rate_with_loan", label: "Annual growth rate with loan", type: "percentage", default: 12 },
        { key: "organic_growth_rate", label: "Organic growth rate (no loan)", type: "percentage", default: 6 },
      ],
    },
    // Sprint 9 Block C / Patch B Block 3 — growth-trajectory framing.
    output_summary_template:
      "SBA 7(a) of ${loan_amount} for {use_of_proceeds}. Without the loan, revenue grows organically at {organic_growth_rate}/yr. With the loan, year-1 revenue lifts by ${expected_year_1_revenue_uplift} and compounds at {expected_annual_growth_rate_with_loan}/yr over the {term_years}-year term — cumulative uplift dwarfs the debt service.",
    structural_content: {
      type: "growth_trajectory",
    },
  },

  // ============================================================
  // 9.3 — TRACK-006 Investment property cashflow projection
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-003",
    track_id: "TRACK-006",
    title: "Investment property cashflow",
    description: "",
    member_type_applicability: "broad",
    parameter_schema: {
      parameters: [
        {
          key: "property_type",
          label: "Property type",
          type: "select",
          options: [
            "Single-family rental",
            "Multi-family",
            "Commercial mixed-use",
            "Vacation rental",
          ],
          required: true,
        },
        { key: "purchase_price", label: "Purchase price", type: "currency", required: true, source_factor_id: "FACTOR-035" },
        { key: "loan_amount", label: "Loan amount", type: "currency", required: true },
        { key: "monthly_rent", label: "Monthly rental income", type: "currency", required: true },
        { key: "monthly_operating_expenses", label: "Monthly operating expenses", type: "currency", required: true },
        { key: "interest_rate", label: "Interest rate", type: "percentage" },
        { key: "term_years", label: "Term (years)", type: "integer", default: 30 },
        { key: "annual_appreciation", label: "Annual appreciation", type: "percentage", default: 4 },
      ],
    },
    // Sprint 9 Block D — cashflow + equity dual visualization.
    output_summary_template:
      "{property_type} at ${purchase_price}. Loan ${loan_amount} at {interest_rate}. Monthly rent ${monthly_rent}, opex ${monthly_operating_expenses}. Two payouts: monthly cashflow today + equity that builds toward future wealth.",
    structural_content: {
      type: "cashflow_equity_dual",
    },
  },

  // ============================================================
  // 9.4 — TRACK-007 Equipment financing ROI projection
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-004",
    track_id: "TRACK-007",
    title: "Equipment financing",
    description: "",
    member_type_applicability: JSON.stringify([
      "maintenance_services",
      "specialty_manufacturer",
      "event_services",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "equipment_type",
          label: "Equipment type",
          type: "select",
          options: [
            "HVAC systems",
            "Industrial machinery",
            "Vehicles (commercial)",
            "Commercial kitchen",
            "Specialty equipment",
          ],
          // BUILD 2a §3 — label only; not required.
        },
        { key: "loan_amount", label: "Loan amount", type: "currency", required: true },
        { key: "term_months", label: "Term (months)", type: "integer", default: 60 },
        { key: "interest_rate", label: "Interest rate", type: "percentage" },
        { key: "current_monthly_maintenance", label: "Current monthly maintenance on aging equipment", type: "currency", required: true },
        { key: "monthly_downtime_cost", label: "Monthly downtime / lost productivity", type: "currency", required: true },
        { key: "monthly_declined_revenue", label: "Monthly declined-job revenue (capacity loss)", type: "currency", required: true },
        { key: "new_equipment_monthly_maintenance", label: "New equipment maintenance", type: "currency", default: 200 },
      ],
    },
    // Sprint 9 Block E — cost-of-doing-nothing visualization.
    output_summary_template:
      "{equipment_type} at ${loan_amount} financed over {term_months} months at {interest_rate}. Aging equipment costs maintenance + downtime + declined-job revenue every month. Breakeven is the month financing becomes cheaper than waiting.",
    structural_content: {
      type: "cost_of_doing_nothing",
    },
  },

  // ============================================================
  // 9.5 — TRACK-009 PACE energy improvement projection
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-005",
    track_id: "TRACK-009",
    title: "PACE energy improvement",
    description: "",
    member_type_applicability: JSON.stringify([
      "maintenance_services",
      "specialty_manufacturer",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "improvement_type",
          label: "Energy improvement type",
          type: "select",
          options: [
            "HVAC system replacement",
            "Solar installation",
            "Insulation + windows",
            "LED lighting + controls",
            "Combined improvements",
          ],
          required: true,
          source_factor_id: "FACTOR-031",
        },
        { key: "improvement_cost", label: "Improvement cost", type: "currency", required: true, source_factor_id: "FACTOR-034" },
        { key: "pace_term_years", label: "PACE term (years)", type: "integer", default: 20 },
        { key: "interest_rate", label: "PACE interest rate", type: "percentage" },
        { key: "current_monthly_energy_cost", label: "Current monthly energy cost", type: "currency", required: true },
        { key: "monthly_energy_savings", label: "Monthly energy savings after improvements", type: "currency", required: true },
      ],
    },
    // Sprint 9 Block G + Patch C + Patch F — PACE annual cashflow viz.
    // Framing flips emphasis to "annual energy savings fund the
    // property-tax assessment — assessment taken from the top, net
    // benefit flows to cashflow." Matches the Patch F stacking flip:
    // net benefit at the bottom (the keeper), assessment on top (the
    // subtraction).
    output_summary_template:
      "{improvement_type} at ${improvement_cost} financed via PACE over {pace_term_years} years. Annual energy savings fund the property-tax assessment — assessment is taken from the top, and net benefit flows to the member's cashflow each year during the PACE term. After year {pace_term_years}, no more assessment; the full annual savings is theirs.",
    structural_content: {
      type: "pace_monthly_savings",
    },
  },

  // ============================================================
  // 9.6 — TRACK-010 Business credit card limit and use plan
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-006",
    track_id: "TRACK-010",
    title: "Business Visa — limit & use plan",
    // Patch G follow-up — description blanked. Operating-benefits
    // header + card grid carry the framing; the prior summary
    // paragraph competed with that content visually.
    description: "",
    member_type_applicability: "broad",
    parameter_schema: {
      parameters: [
        // BUILD 2a §4 (Q-056 un-mis-wire) — removed source_factor_id:"FACTOR-019".
        // FACTOR-019 is ANNUAL REVENUE, not operational spend; auto-resolving it
        // here silently populated the Visa headroom math with the wrong number.
        // Banker-entered until a real spend factor exists.
        { key: "annual_operational_spend", label: "Annual operational spend (current)", type: "currency", required: true },
        { key: "proposed_limit", label: "Proposed credit limit", type: "currency", required: true, source_factor_id: "FACTOR-036" },
        { key: "expected_monthly_spend", label: "Expected monthly card spend", type: "currency", required: true },
        {
          key: "primary_spend_categories",
          label: "Primary spend categories",
          type: "select",
          options: [
            "Supplies and inventory",
            "Travel and entertainment",
            "Vendor payments",
            "Fuel and vehicles",
            "Mixed",
          ],
          // BUILD 2a §3 — chart falls back to "Operational spend"; not required.
        },
        { key: "estimated_cashback_rate", label: "Estimated cashback rate", type: "percentage", default: 2 },
        // Sprint 9 Patch G Block 8 — capability-matrix content.
        // Banker captures during conversation; no FACTOR linkage.
        {
          key: "expense_management_integration",
          label: "Expense-management integration",
          type: "select",
          options: ["QuickBooks Online", "Xero", "FreshBooks", "Wave", "Other / none"],
          default: "QuickBooks Online",
        },
        {
          key: "authorized_users",
          label: "Authorized users",
          type: "text",
          helper:
            "Who's on the card — e.g. \"Jenny (owner), Mike (co-decision-maker)\".",
        },
        {
          key: "reward_structure",
          label: "Reward structure",
          type: "text",
          default: "2% cashback on supplies and fuel; 1% on other purchases",
        },
      ],
    },
    // Sprint 9 Block H + Patch G — operational-capability framing.
    output_summary_template:
      "Business Visa with ${proposed_limit} credit limit for {primary_spend_categories} spend. Expected monthly use: ${expected_monthly_spend}. Authorized users: {authorized_users}. Integration: {expense_management_integration}.",
    structural_content: {
      type: "business_visa_capability",
    },
  },

  // ============================================================
  // 9.7 — TRACK-011 Unsecured loan terms summary
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-007",
    track_id: "TRACK-011",
    title: "Unsecured loan",
    description: "",
    member_type_applicability: "broad",
    parameter_schema: {
      parameters: [
        {
          key: "opportunity_type",
          label: "Opportunity type",
          type: "select",
          options: [
            "Bulk inventory discount",
            "Urgent equipment replacement",
            "Bridge to seasonal revenue",
            "Marketing/sales push",
            "Repair or emergency",
            "Other",
          ],
          // BUILD 2a §3 — opportunity_type/description are output-summary labels
          // the chart never reads; not required.
        },
        { key: "opportunity_description", label: "Brief opportunity description", type: "text" },
        { key: "loan_amount", label: "Loan amount", type: "currency", required: true, source_factor_id: "FACTOR-037", max: 25000 },
        { key: "term_months", label: "Term (months)", type: "integer", default: 24 },
        { key: "interest_rate", label: "Interest rate", type: "percentage" },
        { key: "opportunity_value", label: "Estimated opportunity value", type: "currency", required: true, helper: "Central or single-point estimate. When uncertain, capture low/high below and set this to the midpoint." },
        // Sprint 9 Patch D — optional range parameters. When both are
        // captured, the chart renders opportunity + net benefit as
        // bands. `opportunity_value` acts as the central estimate.
        { key: "opportunity_value_low", label: "Opportunity value — low estimate", type: "currency", required: false, helper: "If estimating a range, capture both low and high. Leave blank when certain." },
        { key: "opportunity_value_high", label: "Opportunity value — high estimate", type: "currency", required: false, helper: "If estimating a range, this is the optimistic case." },
      ],
    },
    // Sprint 9 Block I + Patch D — opportunity-cost decision visualization.
    // Template references `opportunity_value` as the central/point
    // estimate (always captured); the chart + supporting text handle
    // range communication when low/high are also captured.
    output_summary_template:
      "{opportunity_type}: {opportunity_description}. Unsecured loan of ${loan_amount} over {term_months} months at {interest_rate}. Opportunity value: ${opportunity_value}. If the opportunity value exceeds the total interest cost, the loan pays for itself.",
    structural_content: {
      type: "unsecured_opportunity",
    },
  },

  // ============================================================
  // 9.8 — TRACK-008 SBA 504 transaction roadmap
  // (Capital event partnership map rewrite)
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-008",
    track_id: "TRACK-008",
    title: "SBA 504 transaction roadmap",
    description:
      "How the bank, the CDC, and the member each fund the deal — 50% first lien, 40% CDC second lien, 10% equity.",
    member_type_applicability: JSON.stringify(["specialty_manufacturer"]),
    parameter_schema: {
      parameters: [
        {
          key: "current_stage",
          label: "Member is currently at",
          type: "select",
          options: ["1", "2", "3", "4", "5", "6", "7", "8"],
          required: true,
          helper: "Which stage of the transaction is the Member at right now?",
        },
        {
          key: "you_are_here_label",
          label: "You-are-here marker",
          type: "text",
          helper:
            "Defaults to the Member's display name (e.g., \"Cygnus is here\"). Override only if a different framing fits the conversation.",
        },
        // Sprint 9 Block F — structure-comparison parameters paired
        // with the roadmap. Drive the conventional-vs-SBA-504 chart.
        { key: "property_value", label: "Property value", type: "currency", required: true, source_factor_id: "FACTOR-035" },
        // BUILD 2a §3 — all three rates have chart fallbacks (7.5/5.5/8); not required.
        { key: "bank_first_lien_rate", label: "Bank first lien rate", type: "percentage" },
        { key: "cdc_second_lien_rate", label: "CDC second lien rate", type: "percentage" },
        { key: "conventional_rate", label: "Conventional CRE rate", type: "percentage" },
        { key: "amortization_years", label: "Amortization (years)", type: "integer", default: 25 },
      ],
    },
    // Sprint 9 Block F — paired roadmap + structure comparison.
    output_summary_template:
      "SBA 504 transaction roadmap. {you_are_here_label} — at the {stage_name} stage (stage {current_stage} of 8). CDC handles the second-lien piece (40%); Blaze finances the first-lien piece (50%); Member contributes 10% equity.",
    structural_content: {
      type: "sba_504_paired",
      stages: [
        {
          stage_number: 1,
          title: "Initial conversation",
          roles: [{ name: "Scott Brynjolfsson", role: "Relationship banker" }],
          description:
            "Ask about the business and confirm they'll occupy the property.",
        },
        {
          stage_number: 2,
          title: "Specialist introduction",
          roles: [
            { name: "SBA specialist (Blaze)", role: "SBA specialist" },
            { name: "Scott Brynjolfsson", role: "Relationship banker" },
          ],
          description:
            "Bring in the SBA specialist to walk the member through the 504 structure and confirm fit.",
        },
        {
          stage_number: 3,
          title: "CDC partner introduction",
          roles: [
            { name: "CDC partner", role: "CDC partner" },
            { name: "SBA specialist (Blaze)", role: "SBA specialist" },
            { name: "Scott Brynjolfsson", role: "Relationship banker" },
          ],
          description:
            "Introduce the CDC partner, who handles the 504 second-lien piece.",
        },
        {
          stage_number: 4,
          title: "Joint financial review",
          roles: [
            { name: "SBA specialist (Blaze)", role: "SBA specialist" },
            { name: "CDC partner", role: "CDC partner" },
            { name: "Member's CFO/controller", role: "Member finance lead" },
            { name: "CPA", role: "External advisor" },
          ],
          description:
            "Walk through the project economics, the 50/40/10 structure, and the SBA 504 docs together.",
        },
        {
          stage_number: 5,
          title: "Underwriting",
          roles: [
            { name: "Blaze commercial credit underwriting", role: "First-lien underwriting" },
            { name: "CDC underwriting", role: "Second-lien underwriting" },
          ],
          description:
            "Blaze and the CDC underwrite in parallel, coordinated by the SBA specialist.",
        },
        {
          stage_number: 6,
          title: "Board and approvals",
          roles: [
            { name: "Member's board", role: "Internal approval" },
            { name: "Blaze loan committee", role: "First-lien approval" },
            { name: "CDC", role: "Second-lien approval" },
          ],
          description:
            "The member's board, Blaze's loan committee, and the CDC each approve their piece.",
        },
        {
          stage_number: 7,
          title: "Closing",
          roles: [{ name: "All parties", role: "Closing session" }],
          description:
            "Close: Blaze funds the first lien, the CDC the second (SBA debenture), the member the 10% equity; the property transfers.",
        },
        {
          stage_number: 8,
          title: "Post-close relationship",
          roles: [
            { name: "Scott Brynjolfsson", role: "Relationship banker" },
            { name: "Treasury team", role: "Treasury services" },
          ],
          description:
            "Carry the relationship forward — treasury, working capital, and operating support.",
        },
      ],
      you_are_here_marker: true,
      share_button: {
        label: "Mark as shared with Member",
        helper_text:
          "Records that you showed this roadmap to the Member during the conversation. Skip if you're just rehearsing.",
      },
    },
  },

  // ============================================================
  // Sprint 8 Block B.1 — TRACK-001 Working Capital LOC smoothing chart
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-009",
    track_id: "TRACK-001",
    title: "Seasonal cashflow smoothing",
    description: "",
    member_type_applicability: JSON.stringify([
      "event_services",
      "food_services",
      "retail",
      "professional_services",
      "construction",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "annual_revenue_band",
          label: "Annual revenue",
          type: "currency",
          required: true,
          source_factor_id: "FACTOR-019",
        },
        {
          key: "seasonal_variance",
          label: "Seasonal variance",
          type: "percentage",
          required: true,
          source_factor_id: "FACTOR-001",
        },
        {
          key: "slow_season_gap",
          label: "Slow-season cashflow gap",
          type: "currency",
          required: true,
          helper: "Banker-estimated from variance + revenue if not captured directly.",
        },
        {
          key: "requested_credit_limit",
          label: "Requested credit limit",
          type: "currency",
          required: true,
          source_factor_id: "FACTOR-036",
        },
        {
          key: "draw_pattern",
          label: "Expected draw pattern",
          type: "select",
          options: ["Q1 heavy", "Q4 heavy", "Mid-year build", "Mixed"],
          required: true,
        },
        {
          key: "repayment_window",
          label: "Repayment window (months)",
          type: "integer",
          default: 6,
          required: true,
        },
      ],
    },
    output_summary_template:
      "Annual revenue ${annual_revenue_band}. Seasonal variance {seasonal_variance}. Slow-season cashflow gap reaches ${slow_season_gap}. Proposed LOC of ${requested_credit_limit} smooths the cycle: draw during {draw_pattern} months, repay over {repayment_window} months as strong-season revenue flows in.",
    structural_content: {
      type: "cashflow_projection",
      sections: [
        { label: "Business profile", fields: ["annual_revenue_band", "seasonal_variance"] },
        { label: "Cashflow gap", fields: ["slow_season_gap"] },
        { label: "LOC structure", fields: ["requested_credit_limit", "draw_pattern", "repayment_window"] },
      ],
    },
  },

  // ============================================================
  // Sprint 8 Block B.2 — TRACK-002 Business Vehicle Loan financing summary
  // ============================================================
  {
    id: "ARTIFACT-TEMPLATE-010",
    track_id: "TRACK-002",
    title: "Business Vehicle Loan",
    description: "",
    member_type_applicability: JSON.stringify([
      "maintenance_services",
      "construction",
      "food_services",
      "event_services",
    ]),
    parameter_schema: {
      parameters: [
        {
          key: "vehicle_type",
          label: "Vehicle type",
          type: "select",
          options: [
            "Service truck",
            "Box truck",
            "Van",
            "Multiple vehicles (fleet)",
            "Specialty equipment vehicle",
          ],
          // BUILD 2a §3 — chart uses vehicle_type only as a label; not required.
        },
        {
          key: "vehicle_count",
          label: "Vehicles in transaction",
          type: "integer",
          default: 1,
          // BUILD 2a §3 — defaulted; not required.
        },
        {
          key: "purchase_price",
          label: "Total purchase price",
          type: "currency",
          // BUILD 2a §3 — chart never reads purchase_price (only output-summary
          // prose + the computed loan_amount do); kept but not required.
          source_factor_id: "FACTOR-033",
          helper:
            "Total acquisition cost across the vehicles in this transaction.",
        },
        { key: "down_payment", label: "Down payment", type: "currency" },
        {
          key: "loan_amount",
          label: "Loan amount",
          type: "currency",
          computed: true,
          computation: "purchase_price - down_payment",
        },
        {
          key: "term_months",
          label: "Term (months)",
          type: "integer",
          default: 60,
          helper: "Blaze offers 36-84 months for business vehicles.",
        },
        {
          key: "rate_type",
          label: "Rate type",
          type: "select",
          options: ["Fixed", "Variable"],
          // BUILD 2a §3 — chart never reads rate_type; not required.
        },
        {
          key: "monthly_debt_service",
          label: "Monthly debt service",
          type: "currency",
          required: true,
        },
        {
          key: "capacity_utilization_now",
          label: "Current capacity utilization",
          type: "percentage",
          required: true,
          source_factor_id: "FACTOR-006",
        },
        {
          key: "demand_exceeding_capacity",
          label: "Demand exceeding capacity?",
          type: "select",
          options: ["Yes", "No"],
          // BUILD 2a §3 — chart never reads demand_exceeding_capacity; not
          // required (source linkage to FACTOR-007 retained for later use).
          source_factor_id: "FACTOR-007",
        },
        {
          key: "expected_capacity_uplift",
          label: "Expected capacity uplift with new vehicle(s)",
          type: "percentage",
          // BUILD 2a §3 — chart defaults to 0 when absent; not required.
        },
        // Sprint 9 Patch F Block 3 — drives the "declined demand"
        // annotation on the today row.
        {
          key: "current_declined_revenue_monthly",
          label: "Current declined revenue per month",
          type: "currency",
          required: true,
          helper:
            "Estimated revenue from jobs the business declined this month due to capacity constraints.",
        },
        // Sprint 9 Patch G Block 4 — three-row temporal-progression
        // visualization parameters. Baseline revenue anchors Row 1;
        // induced demand drives Row 3's projected growth on top of
        // recaptured declined demand.
        {
          key: "current_monthly_revenue",
          label: "Current monthly revenue",
          type: "currency",
          required: true,
          // BUILD 2a §5 (Q-054 guard) — intentionally NO source_factor_id.
          // This is the fleet-line monthly baseline, NOT total business
          // revenue; it must not auto-resolve from FACTOR-019 (annual
          // revenue ÷ 12 would overstate it ~4×). Keep the seeded value.
          helper:
            "Today's monthly revenue baseline — anchors the bar lengths in the three-row temporal visualization.",
        },
        {
          key: "projected_induced_demand_monthly",
          label: "Projected induced-demand revenue per month",
          type: "currency",
          required: true,
          helper:
            "Banker estimate of new growth revenue the expanded capacity unlocks — new customers, geographic expansion, larger contracts. Realized over the projection horizon.",
        },
        {
          key: "induced_demand_realization_months",
          label: "Months to realize induced demand",
          type: "integer",
          default: 12,
          helper:
            "Time horizon over which induced demand materializes (typical service-business growth ramp).",
        },
      ],
    },
    // Sprint 9 Patch G Block 6 — output summary aligned to the new
    // three-row temporal-progression framing.
    output_summary_template:
      "{vehicle_count} {vehicle_type} at ${purchase_price}, financed at ${loan_amount} after ${down_payment} down. Monthly debt service ${monthly_debt_service}. Immediate effect: ${current_declined_revenue_monthly}/mo previously-declined revenue captured. Projected effect over {induced_demand_realization_months} months: additional ${projected_induced_demand_monthly}/mo from growth opportunities the expanded capacity enables. Combined revenue impact substantially exceeds debt service.",
    // Sprint 9 Patch F Block 2 — replaces the legacy section-list
    // financing summary with a business-impact visualization.
    structural_content: {
      type: "vehicle_capacity_uplift",
    },
  },
];

export async function seedArtifactTemplates(prisma: PrismaClient) {
  for (const t of TEMPLATES) {
    await prisma.artifactTemplate.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        track_id: t.track_id,
        title: t.title,
        description: t.description,
        member_type_applicability: t.member_type_applicability,
        parameter_schema: JSON.stringify(t.parameter_schema),
        output_summary_template: t.output_summary_template,
        structural_content: JSON.stringify(t.structural_content),
      },
      update: {
        title: t.title,
        description: t.description,
        member_type_applicability: t.member_type_applicability,
        parameter_schema: JSON.stringify(t.parameter_schema),
        output_summary_template: t.output_summary_template,
        structural_content: JSON.stringify(t.structural_content),
      },
    });
  }
  console.log(`  Seeded ${TEMPLATES.length} ArtifactTemplate records`);
}

/**
 * Sprint 8 Block G — fixture multi-Track distribution.
 *
 * Sets `Member.active_track_ids` JSON and creates Model rows for each
 * fixture × secondary Track so the workstation Track-switcher shows
 * the appropriate artifact for each Track context.
 *
 * Distribution (per spec §G.1):
 *   Cygnus     → TRACK-008 SBA 504 (primary, existing roadmap) +
 *                TRACK-003 CRE Term Loan (new — CRE comparison artifact;
 *                some params missing → demonstrates Block E CTAs)
 *   Northland  → TRACK-002 Business Vehicle (primary, new template) +
 *                TRACK-007 Equipment & Machinery (existing template)
 *                FACTOR-007 captured as banker_estimate → demonstrates
 *                Block H visual treatment
 *   Jenny      → TRACK-001 Working Capital LOC (primary, new template) +
 *                TRACK-010 Business Visa (existing template — Blaze-
 *                current option for comparison)
 *   Riverside  → TRACK-001 (single Track; stage-skipping preserved;
 *                missing params demonstrate Block E end-to-end)
 */
type Slug = "jenny" | "northland" | "cygnus" | "riverside";

const FIXTURE_TRACKS: Record<Slug, string[]> = {
  cygnus: ["TRACK-008", "TRACK-003"],
  northland: ["TRACK-002", "TRACK-007"],
  jenny: ["TRACK-001", "TRACK-010"],
  riverside: ["TRACK-001"],
};

type ModelSeedSpec = {
  templateId: string;
  parameters: Record<string, string | number>;
  outputSummaryOverride?: string;
};

// Sprint 8 fix — Jenny's legacy seasonal-smoothing Model AND Northland's
// legacy fleet_roi Model are tagged in place with template_id (via the
// retag map below). Only Tracks without an existing covering Model get
// a new seeded Model here.
const FIXTURE_MODEL_SEEDS: Record<Slug, Record<string, ModelSeedSpec | null>> = {
  cygnus: {
    // SBA 504 roadmap — migration helper retags Cygnus's existing Model
    // with template_id=ARTIFACT-TEMPLATE-008. Sprint 9 — also need
    // structure-comparison parameters; the existing Model's parameters
    // get patched below via the `cygnusSba504Params` block.
    "TRACK-008": null,
    "TRACK-003": {
      templateId: "ARTIFACT-TEMPLATE-001",
      // Sprint 9 Block B — lease-vs-own viz parameters. Cygnus is
      // exploring a $5.5M industrial property; current rent is the
      // lease cost they'd avoid by owning.
      parameters: {
        property_type: "Industrial",
        // acquisition_price auto-pulls from FACTOR-035 ($5.5M).
        loan_amount: "4400000",
        amortization_years: 25,
        interest_rate: "7.25",
        current_monthly_rent: "26000",
        annual_rent_escalation: "3",
        annual_appreciation: "3",
      },
    },
    // Sprint 9 follow-up — SBA 7(a) growth-trajectory projection.
    // Cygnus is the manufacturer fixture; SBA 7(a) backs the
    // working-capital piece around the 504 real estate event.
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads.
    "TRACK-004": {
      templateId: "ARTIFACT-TEMPLATE-002",
      parameters: {
        use_of_proceeds: "Working capital",
        loan_amount: "750000",
        current_annual_revenue: "8400000",
        term_years: 10,
        interest_rate: "11.25",
        expected_year_1_revenue_uplift: "1050000",
        expected_annual_growth_rate_with_loan: "12",
        organic_growth_rate: "5",
      },
    },
    // Sprint 9 follow-up — PACE energy improvement projection on the
    // same industrial campus Cygnus is acquiring.
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads.
    "TRACK-009": {
      templateId: "ARTIFACT-TEMPLATE-005",
      parameters: {
        improvement_type: "Combined improvements",
        improvement_cost: "420000",
        pace_term_years: 20,
        interest_rate: "6.5",
        current_monthly_energy_cost: "15500",
        monthly_energy_savings: "7800",
      },
    },
  },
  northland: {
    "TRACK-002": {
      templateId: "ARTIFACT-TEMPLATE-010",
      parameters: {
        vehicle_type: "Service truck",
        vehicle_count: 2,
        // Sprint 9 Patch B Block 2 — include purchase_price directly so
        // the computed `loan_amount` resolves out of the box. FACTOR-033
        // is not in Northland's captured-factor fixture, so the auto-
        // pull would otherwise leave loan_amount unresolved in the
        // rendered output_summary_template.
        purchase_price: "160000",
        down_payment: "36000",
        term_months: 60,
        rate_type: "Fixed",
        monthly_debt_service: "3650",
        // capacity_utilization_now → FACTOR-006 (88% captured).
        // demand_exceeding_capacity → FACTOR-007 (banker_estimate).
        expected_capacity_uplift: "22",
        // Sprint 9 Patch G Block 6 — anchors Row 1 at $50K/mo current
        // revenue for the three-row temporal visualization.
        current_monthly_revenue: "50000",
        induced_demand_realization_months: 12,
        // Gate-demo pin (3 of 5 supplied): capacity utilization resolves
        // from FACTOR-006 (captured); monthly debt service + current
        // monthly revenue are member-confirmed here (`__confirmed`).
        // current_declined_revenue_monthly and
        // projected_induced_demand_monthly are intentionally omitted so
        // they read blank — the banker fills those two with the Member
        // to unlock the capacity-uplift outcome.
        __confirmed: '["monthly_debt_service","current_monthly_revenue"]',
      },
    },
    // TRACK-007 covered by the legacy fleet_roi Model — retagged below
    // with template_id=ARTIFACT-TEMPLATE-004 so it picks up Track-007
    // routing. Sprint 9 — that retagged Model gets the cost-of-doing-
    // nothing parameters via `northlandTrack007Params` below.
    "TRACK-007": null,
    // Sprint 9 follow-up — investment-property cashflow projection.
    // Reachable via Track Context Switcher; stays out of
    // active_track_ids so the primary narrative is unaffected.
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads.
    "TRACK-006": {
      templateId: "ARTIFACT-TEMPLATE-003",
      parameters: {
        property_type: "Commercial mixed-use",
        purchase_price: "1850000",
        loan_amount: "1387500",
        monthly_rent: "16500",
        monthly_operating_expenses: "5280",
        interest_rate: "7.75",
        term_years: 25,
        annual_appreciation: "4",
      },
    },
  },
  jenny: {
    // TRACK-001 — Jenny's seasonal LOC Model (the retagged legacy
    // seasonal-smoothing Model). Gate-demo pin (4 of 6 supplied):
    // annual revenue + seasonal variance resolve from captured factors
    // (FACTOR-019 / FACTOR-001); draw pattern + repayment are member-
    // confirmed here (`__confirmed`); requested credit limit +
    // slow-season gap are intentionally omitted so they read blank and
    // the model opens gated, ready for the banker to fill the last two.
    "TRACK-001": {
      templateId: "ARTIFACT-TEMPLATE-009",
      parameters: {
        draw_pattern: "Q1 heavy",
        repayment_window: 6,
        // Stored as a JSON-string array (the renderer parses it via
        // parseConfirmedKeys); a raw array would break under String(v).
        __confirmed: '["draw_pattern","repayment_window"]',
      },
    },
    "TRACK-010": {
      templateId: "ARTIFACT-TEMPLATE-006",
      // Sprint 9 Block H + Patch G — Business Visa capability-matrix
      // parameters. The cashback fields stay for the supporting-
      // paragraph footnote; the new banker-entered capability fields
      // drive the four card data points.
      parameters: {
        annual_operational_spend: "180000",
        // proposed_limit auto-pulls from FACTOR-036 if captured.
        proposed_limit: "25000",
        expected_monthly_spend: "8500",
        primary_spend_categories: "Supplies and inventory",
        estimated_cashback_rate: "2",
        expense_management_integration: "QuickBooks Online",
        authorized_users: "Jenny (owner), Mike (co-decision-maker spouse)",
        reward_structure: "2% cashback on supplies and fuel",
      },
    },
    // Sprint 9 follow-up — surface the Unsecured Working Capital template
    // on jenny so the banker can demo a small-dollar working-capital
    // top-up alongside the LOC + Visa Tracks. Stays out of
    // active_track_ids; reachable via the Track Context Switcher.
    //
    // Sprint 9 Patch D — Jenny's Unsecured fixture demos range mode
    // (Mode 3: low + high + central). The bulk-inventory take rate is
    // genuinely uncertain — discount depth depends on which SKUs the
    // supplier honors — so the range surfaces that uncertainty cleanly
    // for the demo conversation.
    "TRACK-011": {
      templateId: "ARTIFACT-TEMPLATE-007",
      parameters: {
        opportunity_type: "Bulk inventory discount",
        opportunity_description:
          "Q4 catering supplier prepay locks in 18% case-pricing on dry goods + paper.",
        loan_amount: "18000",
        term_months: 24,
        interest_rate: "10.5",
        opportunity_value: "27000",
        opportunity_value_low: "22000",
        opportunity_value_high: "32000",
      },
    },
  },
  riverside: {
    // Single-Track stage-skip fixture. seed-stage-skip creates the
    // Member but no Models; we add a TRACK-001 Model so the artifact
    // tile surfaces with missing-param CTAs (stage-skipping pattern).
    "TRACK-001": {
      templateId: "ARTIFACT-TEMPLATE-009",
      parameters: {
        draw_pattern: "Q1 heavy",
        repayment_window: 6,
      },
    },
  },
};

// Sprint 9 — patch parameters for legacy-retagged Models so the new
// visualizations have realistic inputs to render. Applied after
// `seedFixtureMultiTrack` retags Models, before the seed completes.
const LEGACY_MODEL_PARAMS: Partial<Record<Slug, Record<string, Record<string, string | number>>>> = {
  cygnus: {
    // Cygnus existing SBA 504 Model: stage 3 + structure-comparison
    // params for the Block F visualization.
    "ARTIFACT-TEMPLATE-008": {
      current_stage: "3",
      you_are_here_label: "Cygnus is here",
      property_value: "5500000",
      bank_first_lien_rate: "7.25",
      cdc_second_lien_rate: "5.25",
      conventional_rate: "8.5",
      amortization_years: 25,
    },
  },
  northland: {
    // Northland existing fleet ROI Model → ARTIFACT-TEMPLATE-004
    // (cost-of-doing-nothing viz). Parameters reflect an aging fleet
    // of service vehicles with rising maintenance + capacity strain.
    // BUILD 2a §5b — the retag overwrites the legacy Model's `parameters`
    // JSON, which carried its display name; without `name` the feed card
    // falls back to template-004's generic "Equipment financing ROI
    // projection" title. Re-assert the real name so the card reads
    // "Fleet expansion financing" (the sidebar tile already does,
    // via the linked Artifact.title).
    "ARTIFACT-TEMPLATE-004": {
      name: "Fleet expansion financing",
      equipment_type: "Vehicles (commercial)",
      loan_amount: "180000",
      term_months: 60,
      interest_rate: "7.5",
      current_monthly_maintenance: "2800",
      monthly_downtime_cost: "1500",
      monthly_declined_revenue: "4200",
      new_equipment_monthly_maintenance: "400",
    },
  },
  jenny: {},
  riverside: {},
};

// BUILD 2a (curation) — each demoable fixture surfaces ONLY the models
// that match its captured evidence + its actual Recommendation product,
// replacing the prior every-template fan-out (ALL_TEMPLATE_IDS) that
// over-generated SBA/PACE/CRE scattershot onto unrelated members (see
// diagnosis §3 over-generation + §5 SBA-prose-on-fleet). Per-member set
// confirmed with Francisco 2026-06-03:
//   Northland (HVAC/fleet) → 010 Vehicle (primary) + 004 Equipment
//                            (retagged legacy fleet model)
//   Cygnus    (manufacturer) → 008 SBA 504 (migrated legacy map) +
//                              001 CRE acquisition
//   Jenny     (caterer)    → 009 Seasonal (retagged legacy) + 006 Visa
//                            + 007 Unsecured
// Each list intentionally includes the member's legacy-retagged template
// so the per-template loop below patches its params in place. Riverside
// stays single-Track (stage-skip narrative).
const FIXTURE_TEMPLATES: Record<Slug, readonly string[]> = {
  jenny: ["ARTIFACT-TEMPLATE-009", "ARTIFACT-TEMPLATE-006", "ARTIFACT-TEMPLATE-007"],
  northland: ["ARTIFACT-TEMPLATE-010", "ARTIFACT-TEMPLATE-004"],
  cygnus: ["ARTIFACT-TEMPLATE-008", "ARTIFACT-TEMPLATE-001"],
  riverside: ["ARTIFACT-TEMPLATE-009"],
};

// Generic, demo-plausible defaults per template. Used as fallback when
// neither FIXTURE_MODEL_SEEDS nor LEGACY_MODEL_PARAMS specifies values
// for a given (fixture, template) pair. Values are sensible but not
// fixture-specific; the natural-fit fixture for each template still
// overrides via FIXTURE_MODEL_SEEDS / LEGACY_MODEL_PARAMS.
const DEFAULT_TEMPLATE_PARAMS: Record<string, Record<string, string | number>> = {
  "ARTIFACT-TEMPLATE-001": {
    property_type: "Commercial",
    acquisition_price: "1500000",
    loan_amount: "1200000",
    amortization_years: 25,
    interest_rate: "7.5",
    current_monthly_rent: "9500",
    annual_rent_escalation: "3",
    annual_appreciation: "3",
  },
  "ARTIFACT-TEMPLATE-002": {
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads
    // (current_annual_revenue, term_years, expected_year_1_revenue_uplift,
    // expected_annual_growth_rate_with_loan, organic_growth_rate).
    use_of_proceeds: "Working capital",
    loan_amount: "350000",
    current_annual_revenue: "2400000",
    term_years: 10,
    interest_rate: "11.25",
    expected_year_1_revenue_uplift: "480000",
    expected_annual_growth_rate_with_loan: "12",
    organic_growth_rate: "6",
  },
  "ARTIFACT-TEMPLATE-003": {
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads
    // (purchase_price, loan_amount, monthly_rent, monthly_operating_expenses,
    // interest_rate, term_years, annual_appreciation).
    property_type: "Commercial mixed-use",
    purchase_price: "850000",
    loan_amount: "637500",
    monthly_rent: "7200",
    monthly_operating_expenses: "2300",
    interest_rate: "7.75",
    term_years: 25,
    annual_appreciation: "4",
  },
  "ARTIFACT-TEMPLATE-004": {
    equipment_type: "Commercial equipment",
    loan_amount: "120000",
    term_months: 60,
    interest_rate: "7.5",
    current_monthly_maintenance: "1800",
    monthly_downtime_cost: "1200",
    monthly_declined_revenue: "3200",
    new_equipment_monthly_maintenance: "350",
  },
  "ARTIFACT-TEMPLATE-005": {
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads
    // (improvement_cost, pace_term_years, current_monthly_energy_cost,
    // monthly_energy_savings).
    improvement_type: "HVAC system replacement",
    improvement_cost: "180000",
    pace_term_years: 20,
    interest_rate: "6.5",
    current_monthly_energy_cost: "5200",
    monthly_energy_savings: "2600",
  },
  "ARTIFACT-TEMPLATE-006": {
    annual_operational_spend: "120000",
    expected_monthly_spend: "6500",
    primary_spend_categories: "Supplies, fuel, utilities",
    estimated_cashback_rate: "2",
    proposed_limit: "25000",
    // Patch G — capability-matrix content with sensible generic values
    // so non-Jenny fixtures still render cleanly.
    expense_management_integration: "QuickBooks Online",
    authorized_users: "Owner + one operational delegate",
    reward_structure: "2% cashback on supplies and fuel; 1% on other purchases",
  },
  "ARTIFACT-TEMPLATE-007": {
    // Sprint 9 Patch B Block 2 — keys aligned to schema + chart reads
    // (opportunity_type, opportunity_description, loan_amount, term_months,
    // interest_rate, opportunity_value).
    opportunity_type: "Bulk inventory discount",
    opportunity_description: "Seasonal supplier prepay locks in 18% volume discount.",
    loan_amount: "20000",
    term_months: 24,
    interest_rate: "11.5",
    opportunity_value: "32000",
  },
  "ARTIFACT-TEMPLATE-008": {
    current_stage: "2",
    you_are_here_label: "Current stage",
    property_value: "2200000",
    bank_first_lien_rate: "7.5",
    cdc_second_lien_rate: "5.25",
    conventional_rate: "8.5",
    amortization_years: 25,
  },
  "ARTIFACT-TEMPLATE-009": {
    draw_pattern: "Q1 heavy",
    repayment_window: 6,
  },
  "ARTIFACT-TEMPLATE-010": {
    vehicle_type: "Service truck",
    vehicle_count: 1,
    purchase_price: "75000",
    down_payment: "15000",
    term_months: 60,
    rate_type: "Fixed",
    monthly_debt_service: "1200",
    expected_capacity_uplift: "18",
    // Patch F — drives the declined-revenue annotation on the new
    // capacity-uplift chart. Generic-fixture value; per-fixture
    // overrides (e.g., Northland) set sharper numbers.
    current_declined_revenue_monthly: "2400",
    // Patch G — three-row temporal visualization parameters.
    current_monthly_revenue: "32000",
    projected_induced_demand_monthly: "3500",
    induced_demand_realization_months: 12,
  },
};

// Resolve params for a (fixture, template) pair. Override precedence:
//   1. FIXTURE_MODEL_SEEDS — fixture-specific override (trackId-keyed,
//      where seed.templateId matches)
//   2. LEGACY_MODEL_PARAMS — params for a legacy-retagged Model
//   3. DEFAULT_TEMPLATE_PARAMS — generic fallback
function paramsFor(
  slug: Slug,
  templateId: string,
): Record<string, string | number> {
  const fixtureSeeds = FIXTURE_MODEL_SEEDS[slug];
  for (const trackId of Object.keys(fixtureSeeds)) {
    const seed = fixtureSeeds[trackId];
    if (seed && seed.templateId === templateId) {
      return seed.parameters;
    }
  }
  const legacy = LEGACY_MODEL_PARAMS[slug]?.[templateId];
  if (legacy) return legacy;
  return DEFAULT_TEMPLATE_PARAMS[templateId] ?? {};
}

// Legacy Model retag map — Sprint 8 fix.
// Maps fixture slug → { matchTitle, newTemplateId }. The seed finds the
// fixture's existing Model whose linked Artifact title matches and sets
// `template_id` so the artifact picks up Track routing via
// ArtifactTemplate.track_id.
const LEGACY_MODEL_RETAG: Record<Slug, Array<{ artifactTitle: string; templateId: string }>> = {
  jenny: [
    {
      // Must match the Artifact.title set in prisma/seed.ts (renamed to
      // "Seasonal cashflow smoothing" so feed names are consistent).
      artifactTitle: "Seasonal cashflow smoothing",
      templateId: "ARTIFACT-TEMPLATE-009",
    },
  ],
  northland: [
    {
      artifactTitle: "Fleet expansion financing",
      templateId: "ARTIFACT-TEMPLATE-004",
    },
  ],
  cygnus: [], // handled by migrateCygnusModelToTemplate
  riverside: [],
};

export async function seedFixtureMultiTrack(prisma: PrismaClient) {
  for (const slug of Object.keys(FIXTURE_TRACKS) as Slug[]) {
    const member = await prisma.member.findFirst({ where: { slug } });
    if (!member) {
      console.log(`  Sprint 8: fixture ${slug} not found; skipping`);
      continue;
    }
    const tracks = FIXTURE_TRACKS[slug];
    await prisma.member.update({
      where: { id: member.id },
      data: { active_track_ids: tracks },
    });

    // Retag legacy Models with template_id so they pick up Track routing
    // via ArtifactTemplate.track_id without losing the chart renderer.
    // Sprint 9 — also patch the Model's `parameters` / `template_parameters`
    // JSON with the new visualization inputs so the Sprint 9 charts have
    // realistic numbers to render.
    for (const retag of LEGACY_MODEL_RETAG[slug]) {
      const targetModel = await prisma.model.findFirst({
        where: {
          member_id: member.id,
          active: true,
          artifact: { title: retag.artifactTitle },
        },
        select: { id: true },
      });
      if (targetModel) {
        const newParams =
          LEGACY_MODEL_PARAMS[slug]?.[retag.templateId];
        await prisma.model.update({
          where: { id: targetModel.id },
          data: {
            template_id: retag.templateId,
            ...(newParams
              ? {
                  template_parameters: JSON.stringify(newParams),
                  parameters: JSON.stringify(newParams),
                }
              : {}),
          },
        });
      }
    }

    // Sprint 9 follow-up — seed a Model for every template the fixture
    // should expose, so the Track Context Switcher reveals an artifact
    // tile for any Lending Product. Upsert semantics: if a Model with
    // this template_id already exists (e.g. a legacy retag preserved
    // the artifact_id linkage), patch its params; otherwise create.
    for (const templateId of FIXTURE_TEMPLATES[slug]) {
      const params = paramsFor(slug, templateId);
      const existing = await prisma.model.findFirst({
        where: {
          member_id: member.id,
          template_id: templateId,
          active: true,
        },
        select: { id: true, artifact_id: true },
      });
      if (existing) {
        await prisma.model.update({
          where: { id: existing.id },
          data: {
            template_parameters: JSON.stringify(params),
            parameters: JSON.stringify(params),
          },
        });
        continue;
      }
      const conv = await prisma.conversation.create({
        data: {
          member_id: member.id,
          banker_id: member.primary_banker_id,
          meeting_type: "check_in",
          channel: "in_person",
          sentiment: "receptive",
        },
        select: { id: true },
      });
      await prisma.model.create({
        data: {
          member_id: member.id,
          conversation_id: conv.id,
          built_by_banker_id: member.primary_banker_id,
          built_with_member: false,
          assumptions: JSON.stringify([]),
          output_summary: `${templateId} working model`,
          active: true,
          template_id: templateId,
          template_parameters: JSON.stringify(params),
          parameters: JSON.stringify(params),
        },
      });
    }
  }

  // Sprint 8 Block G §G.3 — mark Northland's FACTOR-007 capture as
  // banker_estimate to demonstrate Block H visual treatment. The
  // underlying value stays true (demand-exceeding-capacity); only the
  // mode shifts so the artifact flag surfaces.
  const northland = await prisma.member.findFirst({ where: { slug: "northland" } });
  if (northland) {
    await prisma.factorCapture.updateMany({
      where: { member_id: northland.id, factor_id: "FACTOR-007" },
      data: { capture_mode: "banker_estimate" },
    });
  }

  console.log(`  Sprint 8: multi-Track seed applied to 4 fixtures`);
}

/**
 * Sprint 5d Block B.3 — migrate Cygnus's existing "Capital event
 * partnership map" Model to ARTIFACT-TEMPLATE-008. Cygnus is at stage 3
 * (CDC partner introduction) per existing fixture state.
 */
export async function migrateCygnusModelToTemplate(prisma: PrismaClient) {
  const cygnus = await prisma.member.findFirst({ where: { slug: "cygnus" } });
  if (!cygnus) {
    console.log("  Cygnus member not found; skipping template migration");
    return;
  }
  const cygnusModels = await prisma.model.findMany({
    where: { member_id: cygnus.id, active: true },
  });
  // Sprint 9 Block F — SBA 504 paired visualization expects roadmap +
  // structure-comparison parameters in the same Model.parameters JSON.
  const sba504Params = JSON.stringify({
    current_stage: "3",
    you_are_here_label: "Cygnus is here",
    property_value: "5500000",
    bank_first_lien_rate: "7.25",
    cdc_second_lien_rate: "5.25",
    conventional_rate: "8.5",
    amortization_years: 25,
  });
  let migrated = 0;
  for (const m of cygnusModels) {
    if (m.template_id) continue;
    await prisma.model.update({
      where: { id: m.id },
      data: {
        template_id: "ARTIFACT-TEMPLATE-008",
        template_parameters: sba504Params,
        parameters: sba504Params,
      },
    });
    migrated += 1;
  }
  console.log(`  Migrated ${migrated} Cygnus Model record(s) to ARTIFACT-TEMPLATE-008`);
}
