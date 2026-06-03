/*
 * Blaze Member Signals — fixture seed (full body).
 *
 * Authoring sequence per docs/design/MEMBER_FIXTURE_BRIEF.md §7.1:
 *   1. Reference data
 *   2. Member identity records
 *   3. Prior conversation history (low-fidelity, with carry-forward Signals)
 *   4. Featured conversations + Growth step executions + Signals + ActionCards + Recommendations
 *   5. Artifacts (authored before step 4 since Show executions reference them)
 *   6. Derived state on Member (last_touch_at, active_signal_count, open_action_card_count)
 *
 * Re-running this script is safe — it clears existing rows in FK-safe order
 * before re-inserting.
 *
 * Demo "now" anchor: 2026-04-25 (per brief §1.1).
 *
 * AI-native ontology check (applies throughout):
 *   - Every reference entity carries a populated description (Principle 1).
 *   - Named relationships are catalogued at the top of schema.prisma (Principle 2).
 *   - Enum values that surface to humans have descriptions in
 *     app/lib/enum-descriptions.ts (Principle 3).
 *   - Every interesting entity is summarizable via app/lib/summary-templates.ts
 *     (Principle 4).
 *
 * Brief-vs-Framework reconciliation decisions encoded in this seed:
 *   - Q-013 (resolved): primary_concern enum extended with bank_capability.
 *     The Cygnus Recommendation uses this value with a description.
 *   - Q-014 (resolved): Resolve-shape executions where resolution_type=indecision
 *     produce both a Signal (type=indecision, topic=indecision.<authority|information>)
 *     and an ActionCard. Implemented in seedJennyFeaturedConversation and
 *     seedNorthlandFeaturedConversation.
 *   - Show-shape executions are the producer of Recommendation in this fixture
 *     (the Data Framework formally ascribes Recommendation to Propose-shape, but
 *     none of the brief's three tracks include a Propose step; the parameterized
 *     proposal is embedded in the Show step's parameters_used). Each Recommendation's
 *     growth_step_execution_id points at the Show execution.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  summarizeMember,
  SUMMARIZE_MEMBER_TEMPLATE_VERSION,
  type MemberSummaryInput,
} from "../lib/summaries";
import {
  seedBusinessFactorMatrix,
  seedFactorCapturesForFixtures,
  _seedCounts as _matrixCounts,
} from "./seed-matrix";
import {
  seedInsightPatterns,
  seedInsightsForFixtures,
} from "./seed-insights";
import {
  seedArtifactTemplates,
  migrateCygnusModelToTemplate,
  seedFixtureMultiTrack,
} from "./seed-artifact-templates";
import { seedStageSkipFixture } from "./seed-stage-skip";
import { recomputeAllWorkflowStates } from "../lib/workflow-state";

// Prisma 7 requires an explicit driver adapter. The DATABASE_URL is "file:./dev.db"
// but better-sqlite3 wants a plain filesystem path; strip the file: prefix.
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = dbUrl.replace(/^file:/, "");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath }),
});

// ============================================================
// Constants
// ============================================================

const NOW = new Date("2026-04-25T12:00:00Z");

// Helper to build ISO dates without timezone surprises in the seed.
const iso = (yyyymmdd: string) => new Date(`${yyyymmdd}T12:00:00Z`);

// Sprint 5e Block D — relative date helper. All capture-related dates
// (Signals, FactorCaptures, featured Conversations, Models, ShowEvents,
// Reactions) compute from "now" so the demo stays inside a recent
// window every time the seed runs. Historical anchors (tenure_started_at,
// account-opening Conversations, GrowthStep promoted_at) keep the
// hardcoded `iso()` dates because those represent established facts
// that don't slide forward with time.
const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

// ============================================================
// Step 0 — Clear existing data (idempotent)
// ============================================================

async function clear() {
  // Delete in FK-safe order: leaf tables first, root tables last.
  // Sprint 4 §A — new tables added; clear ahead of MemberSummarySnapshot
  // since they're independent leaves.
  await prisma.artifactParameterCapture.deleteMany();
  await prisma.macro.deleteMany();
  await prisma.memberSummarySnapshot.deleteMany();
  // Sprint 5a.3 hygiene — FactorCapture (Sprint 5a.1) and v2 entities
  // (Sprint 4.7) were missing from the cleanup. Reseeds were succeeding
  // on fresh databases but failing FK-cascade on subsequent runs once
  // data was present. Listed before sizingMeasurement / reaction since
  // they reference Signal + Reaction + SizingMeasurement.
  // Sprint 5b.2 — MemberWorkflowState references Member (1:1); drop
  // first so Member.deleteMany doesn't FK-cascade-fail.
  await prisma.memberWorkflowState.deleteMany();
  // Sprint 5b.1 — Insight + InsightPattern + SpecialistHandoff added
  // ahead of FactorCapture (Insight references InsightPattern; both
  // reference Member).
  await prisma.specialistHandoff.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.insightPattern.deleteMany();
  await prisma.factorCapture.deleteMany();
  await prisma.matrixEntry.deleteMany();
  // Sprint 5d Block A — ArtifactTemplate references TrackTemplate;
  // drop before TrackTemplate to avoid FK violation.
  await prisma.artifactTemplate.deleteMany();
  await prisma.trackTemplate.deleteMany();
  await prisma.businessFactor.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.showEvent.deleteMany();
  await prisma.model.deleteMany();
  await prisma.sizingMeasurement.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.actionCard.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.growthStepExecution.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.growthTrackStep.deleteMany();
  await prisma.growthTrack.deleteMany();
  await prisma.growthStep.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.memberType.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sizingDimension.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.industryFamily.deleteMany();
  await prisma.banker.deleteMany();
}

// ============================================================
// Step 1a — Bankers (brief §2.1)
// ============================================================

async function seedBankers() {
  const scott = await prisma.banker.create({
    data: {
      external_user_id: "scott.b",
      display_name: "Scott Brynjolffson",
      roles: ["primary_banker"],
      status: "active",
    },
  });

  const marcus = await prisma.banker.create({
    data: {
      external_user_id: "marcus.w",
      display_name: "Marcus Webb",
      roles: ["commercial_re_specialist"],
      status: "active",
    },
  });

  const priya = await prisma.banker.create({
    data: {
      external_user_id: "priya.p",
      display_name: "Priya Patel",
      roles: ["growth_lead"],
      status: "active",
    },
  });

  return { scott, marcus, priya };
}

// ============================================================
// Step 1b — Industry Families (brief §2.2)
// ============================================================

async function seedIndustryFamilies() {
  const eventDriven = await prisma.industryFamily.create({
    data: {
      name: "Event-driven services",
      description:
        "Service businesses whose revenue follows discrete events rather than ongoing service relationships. Includes catering, florists, event planners, photographers, and similar businesses. Characterized by lumpy event-driven revenue, perishable inventory exposure, surge labor needs, and seasonal concentration around weddings, corporate events, and holiday cycles.",
      naics_codes: ["72232", "45311", "71139"],
      size_band_thresholds: {
        solo: { employees_max: 1 },
        small: { employees_min: 2, employees_max: 10 },
        mid: { employees_min: 11, employees_max: 50 },
        larger: { employees_min: 51 },
      },
    },
  });

  const tradesConstruction = await prisma.industryFamily.create({
    data: {
      name: "Trades and construction",
      description:
        "Service businesses providing skilled trade work for residential and light-commercial customers. Includes HVAC, electrical, plumbing, general contracting, landscaping, and similar trades. Characterized by recurring service revenue plus project revenue, seasonal demand patterns, capital-intensive equipment and vehicle fleets, and growth constrained by skilled-technician availability.",
      naics_codes: ["238220", "238210", "238110"],
      size_band_thresholds: {
        solo: { employees_max: 1 },
        small: { employees_min: 2, employees_max: 10 },
        mid: { employees_min: 11, employees_max: 30 },
        larger: { employees_min: 31 },
      },
    },
  });

  const specialtyManufacturing = await prisma.industryFamily.create({
    data: {
      name: "Specialty manufacturing",
      description:
        "B2B manufacturers producing precision components, contract-manufactured products, or specialty inputs for larger downstream manufacturers. Includes precision machining, microfluidics, specialty chemicals, medical device subassemblies, and similar specialty manufacturing. Characterized by concentrated B2B customer bases under multi-year contracts, capital-intensive operations requiring periodic facility and equipment investment, regulatory and qualification burden, and steady but capital-constrained growth.",
      naics_codes: ["332710", "339113", "325413"],
      size_band_thresholds: {
        solo: null,
        small: { employees_min: 1, employees_max: 25 },
        mid: { employees_min: 26, employees_max: 100 },
        larger: { employees_min: 101 },
      },
    },
  });

  return { eventDriven, tradesConstruction, specialtyManufacturing };
}

// ============================================================
// Step 1c — Topics (brief §2.3)
// ============================================================

async function seedTopics() {
  const blockerSeasonal = await prisma.topic.create({
    data: {
      canonical_tag: "blocker.cash_flow_seasonal",
      display_name: "Seasonal cash flow stress",
      description:
        "Revenue follows a predictable annual peak-and-trough pattern, with intervening periods where operating costs continue but income is significantly reduced. Distinct from cash_flow_receivables (timing-driven) and cash_flow_growth (expansion-driven). Common in event-driven services, hospitality, and tourism.",
      topic_type: "blocker",
      status: "canonical",
    },
  });

  const blockerReceivables = await prisma.topic.create({
    data: {
      canonical_tag: "blocker.receivables_timing",
      display_name: "Slow customer payments",
      description:
        "Customers consistently pay later than invoiced terms, creating cash flow strain even when overall revenue is healthy. Often involves anchor-client concentration where one or two customers' payment behavior dominates working capital needs.",
      topic_type: "blocker",
      status: "canonical",
    },
  });

  const blockerCapacity = await prisma.topic.create({
    data: {
      canonical_tag: "blocker.capacity_constrained",
      display_name: "Capacity below demand",
      description:
        "Business is turning away work or losing growth opportunities because production, dispatch, or service capacity cannot meet demand. Typical in trades during peak season and in manufacturing approaching utilization ceilings.",
      topic_type: "blocker",
      status: "canonical",
    },
  });

  const blockerConcentration = await prisma.topic.create({
    data: {
      canonical_tag: "blocker.customer_concentration",
      display_name: "Customer concentration risk",
      description:
        "A small number of customers represent a large share of revenue, creating vulnerability if any one relationship changes materially. Common in B2B specialty manufacturing where qualification cycles favor incumbent suppliers.",
      topic_type: "blocker",
      status: "canonical",
    },
  });

  const triggerVolume = await prisma.topic.create({
    data: {
      canonical_tag: "trigger.customer_volume_commitment",
      display_name: "Customer growth commitment",
      description:
        "An existing customer has indicated forthcoming volume growth, creating both opportunity (revenue expansion) and pressure (capacity to fulfill). Often the precipitating event for capacity-expansion conversations.",
      topic_type: "trigger",
      status: "canonical",
    },
  });

  const triggerCapacityEval = await prisma.topic.create({
    data: {
      canonical_tag: "trigger.capacity_expansion_evaluation",
      display_name: "Evaluating capacity expansion",
      description:
        "Member is actively evaluating a major capacity expansion — facility, equipment, or fleet — typically as a multi-quarter strategic decision rather than an acute response. The bank's role is to earn the right to be the financing partner before the formal evaluation begins.",
      topic_type: "trigger",
      status: "canonical",
    },
  });

  const triggerLease = await prisma.topic.create({
    data: {
      canonical_tag: "trigger.lease_expiration",
      display_name: "Lease expiration approaching",
      description:
        "An existing lease (facility, equipment, vehicle) is approaching expiration, forcing a renew-or-replace decision. Often a financing trigger for ownership conversion or upgrade.",
      topic_type: "trigger",
      status: "canonical",
    },
  });

  const triggerEquipQual = await prisma.topic.create({
    data: {
      canonical_tag: "trigger.equipment_qualification_window",
      display_name: "Equipment qualification window",
      description:
        "A new piece of production equipment requires customer qualification or regulatory validation before it can generate revenue. Creates a financing window where capital is deployed but revenue is delayed.",
      topic_type: "trigger",
      status: "canonical",
    },
  });

  const goalFleet = await prisma.topic.create({
    data: {
      canonical_tag: "goal.fleet_expansion",
      display_name: "Add fleet capacity to capture declined work",
      description:
        "Member's intent to add fleet capacity — typically vehicles or specialized equipment — in order to take on work that capacity has forced them to decline. Action-forward and lending-relevant: the goal is the structural counterpart to a capacity-constrained blocker, and it is the proposition a fleet-financing recommendation responds to.",
      topic_type: "goal",
      status: "canonical",
    },
  });

  const goalFacility = await prisma.topic.create({
    data: {
      canonical_tag: "goal.facility_expansion",
      display_name: "Facility expansion",
      description:
        "Member is planning a major facility investment — new building, addition, or significant renovation — typically a multi-year capital event.",
      topic_type: "goal",
      status: "canonical",
    },
  });

  const goalCustomerGrowth = await prisma.topic.create({
    data: {
      canonical_tag: "goal.customer_growth",
      display_name: "Grow alongside customer expansion",
      description:
        "Member's intent to grow capacity, capability, or footprint in step with anchor-customer or new-customer demand signals. Action-forward framing: the goal is to keep pace with — or get ahead of — customer-side expansion rather than to defend current share. Surfaces in established commercial relationships when customers communicate volume forecasts, qualifications, or platform consolidations that imply more work for the supplier.",
      topic_type: "goal",
      status: "canonical",
    },
  });

  const goalFacilityOwnership = await prisma.topic.create({
    data: {
      canonical_tag: "goal.facility_ownership",
      display_name: "Move from leasing to owning",
      description:
        "Member is considering or planning a transition from leasing their primary facility to owning it. Common in established small-to-mid businesses approaching their second decade.",
      topic_type: "goal",
      status: "canonical",
    },
  });

  // Added 2026-04-25 to surface goal-side intent on Jenny's record (the LOC
  // proposal needs to read as "responding to a stated objective", not just to a
  // blocker). The Topic is canonical; seed for any other Member with similar
  // seasonal-cash-flow objectives.
  const goalCashFlowSmoothing = await prisma.topic.create({
    data: {
      canonical_tag: "goal.cash_flow_smoothing",
      display_name: "Smooth seasonal revenue with working capital",
      description:
        "Member's intent to smooth seasonal or event-driven revenue swings using working capital instruments — most commonly a Working Capital Line of Credit. Action-forward and lending-focused framing: the verb acts on revenue and the instrument is named, so the goal ties directly to the recommendation it justifies. Distinct from goal.facility_ownership or goal.facility_expansion (which are capital events); this is an ongoing-operations objective common in event-driven services, hospitality, and seasonal businesses.",
      topic_type: "goal",
      status: "canonical",
    },
  });

  const indecisionAuthority = await prisma.topic.create({
    data: {
      canonical_tag: "indecision.authority",
      display_name: "Needs another decision-maker's input",
      description:
        "Member is unable to commit because a key decision-maker is not in the conversation — a spouse, business partner, board member, or other stakeholder. Resolution requires bringing the missing party into a subsequent conversation. Distinct from indecision.information (which is about data) and indecision.outcome_uncertainty (which is about confidence in the outcome).",
      topic_type: "indecision",
      status: "canonical",
    },
  });

  const indecisionInformation = await prisma.topic.create({
    data: {
      canonical_tag: "indecision.information",
      display_name: "Needs to verify with their advisor",
      description:
        "Member is unable to commit because they want to verify the financial or operational implications with a trusted advisor — typically a CPA, attorney, or business mentor. Resolution requires the bank providing materials the member can share with their advisor and following up after that conversation.",
      topic_type: "indecision",
      status: "canonical",
    },
  });

  const indecisionOutcome = await prisma.topic.create({
    data: {
      canonical_tag: "indecision.outcome_uncertainty",
      display_name: "Uncertain about the outcome",
      description:
        "Member is unable to commit because they're not confident the proposed action will produce the intended outcome. Resolution often requires de-risking through phased structure, smaller pilot, or comparable case studies.",
      topic_type: "indecision",
      status: "canonical",
    },
  });

  return {
    blockerSeasonal,
    blockerReceivables,
    blockerCapacity,
    blockerConcentration,
    triggerVolume,
    triggerCapacityEval,
    triggerLease,
    triggerEquipQual,
    goalFleet,
    goalFacility,
    goalCustomerGrowth,
    goalFacilityOwnership,
    goalCashFlowSmoothing,
    indecisionAuthority,
    indecisionInformation,
    indecisionOutcome,
  };
}

// ============================================================
// Step 1c.5 — Sizing dimensions (Sprint 4 §4.2a Block B)
//
// Reference vocabulary for what a SizingMeasurement quantifies. Demo
// seeds 12 dimensions covering the three featured Members; pilot phase
// will expand without schema change. Descriptions are required by
// Semantic Discipline — every reference entity carries one. Dimension
// keys are identifier-safe; display_name is what bankers see in the
// Size form's Topic / dimension dropdown.
// ============================================================

async function seedSizingDimensions() {
  // Working-capital / cash-flow dimensions (Jenny + cross-Member)
  const slowSeasonRevenueGap = await prisma.sizingDimension.create({
    data: {
      key: "slow_season_revenue_gap",
      display_name: "Slow-season revenue gap",
      description:
        "Dollar amount by which slow-season revenue falls short of the fixed-cost baseline. Captured per quarter or per month depending on the rhythm of the Member's business cycle. Drives working capital line sizing.",
    },
  });
  const customerPaymentExtension = await prisma.sizingDimension.create({
    data: {
      key: "customer_payment_extension",
      display_name: "Customer payment extension",
      description:
        "Average number of days customers pay beyond invoiced terms. Higher values indicate working capital stress driven by receivables timing rather than absolute revenue shortfall. Distinct from slow_season_revenue_gap.",
    },
  });
  const fixedOverheadBaseline = await prisma.sizingDimension.create({
    data: {
      key: "fixed_overhead_baseline",
      display_name: "Fixed overhead baseline",
      description:
        "Monthly fixed costs the Member must cover regardless of revenue (rent, payroll, insurance, equipment leases). Provides the floor against which slow-season gap and capacity utilization are sized.",
    },
  });
  const seasonalRevenueSwing = await prisma.sizingDimension.create({
    data: {
      key: "seasonal_revenue_swing",
      display_name: "Seasonal revenue swing",
      description:
        "Magnitude of revenue variation between peak and trough quarters, expressed as a percentage of peak revenue. Used to dimension the working-capital cushion needed to bridge the trough.",
    },
  });
  const workingCapitalCycleDays = await prisma.sizingDimension.create({
    data: {
      key: "working_capital_cycle_days",
      display_name: "Working capital cycle (days)",
      description:
        "Days from cash outflow (paying suppliers, payroll) to cash inflow (collecting receivables). Longer cycles indicate higher working capital needs at any given revenue level.",
    },
  });

  // Capacity / fleet dimensions (Northland + cross-Member)
  const declinedWorkVolume = await prisma.sizingDimension.create({
    data: {
      key: "declined_work_volume",
      display_name: "Declined work volume",
      description:
        "Dollar volume of work declined per period due to capacity constraints (insufficient trucks, technicians, or production hours). Direct sizing input for fleet expansion or capacity-add financing.",
    },
  });
  const revenuePerTruck = await prisma.sizingDimension.create({
    data: {
      key: "revenue_per_truck",
      display_name: "Revenue per truck",
      description:
        "Average annualized revenue per service vehicle. Combined with declined work volume to size fleet expansion: declined_volume / revenue_per_truck approximates the number of additional vehicles justified.",
    },
  });
  const fleetUtilizationRate = await prisma.sizingDimension.create({
    data: {
      key: "fleet_utilization_rate",
      display_name: "Fleet utilization rate",
      description:
        "Percentage of available service hours that are actually billed. High utilization (>85%) with declined work indicates capacity constraint; low utilization indicates demand or scheduling problems instead.",
    },
  });
  const serviceRadiusCapacity = await prisma.sizingDimension.create({
    data: {
      key: "service_radius_capacity",
      display_name: "Service radius capacity",
      description:
        "Geographic reach the current fleet can profitably cover (in miles or counties). Constrains where the Member can accept work; expansion increases this radius.",
    },
  });

  // Manufacturing / capital-event dimensions (Cygnus + cross-Member)
  const capacityUtilizationRate = await prisma.sizingDimension.create({
    data: {
      key: "capacity_utilization_rate",
      display_name: "Capacity utilization rate",
      description:
        "Percentage of production capacity currently being used. Sustained high utilization (>90%) combined with growth commitments is the signal for capacity-expansion financing.",
    },
  });
  const customerConcentrationPercentage = await prisma.sizingDimension.create({
    data: {
      key: "customer_concentration_percentage",
      display_name: "Customer concentration",
      description:
        "Share of revenue concentrated in the top customer (or top 3). High concentration is both a credit risk factor and an opportunity signal — large customer growth commitments often trigger capacity expansion.",
    },
  });
  const productionThroughputTarget = await prisma.sizingDimension.create({
    data: {
      key: "production_throughput_target",
      display_name: "Production throughput target",
      description:
        "Targeted production output (units, tons, or batches per period) the Member is committing to deliver. Anchors capacity-expansion sizing against contractual obligations rather than aspirational growth.",
    },
  });

  return {
    slowSeasonRevenueGap,
    customerPaymentExtension,
    fixedOverheadBaseline,
    seasonalRevenueSwing,
    workingCapitalCycleDays,
    declinedWorkVolume,
    revenuePerTruck,
    fleetUtilizationRate,
    serviceRadiusCapacity,
    capacityUtilizationRate,
    customerConcentrationPercentage,
    productionThroughputTarget,
  };
}

// ============================================================
// Step 1d — Products (brief §2.4)
// ============================================================

async function seedProducts() {
  const businessChecking = await prisma.product.create({
    data: {
      name: "Business Checking",
      description:
        "Routine deposit account for business operations. The default starting product for new business members; underpins payroll, vendor payments, and day-to-day cash management. Pairs with Treasury Services as members grow.",
      category: "business",
      subcategory: "transaction_services",
      routing_owner_role: "consumer",
      compliance_tags: [],
      status: "active",
    },
  });

  const businessVisa = await prisma.product.create({
    data: {
      name: "Business Visa",
      description:
        "Small-business credit card with employee cards available. Used for operational spend, travel, and supplier purchases. Demonstrates payment discipline that informs subsequent lending decisions.",
      category: "business",
      subcategory: "credit",
      routing_owner_role: "cards",
      compliance_tags: [],
      status: "active",
    },
  });

  const commercialCreditCard = await prisma.product.create({
    data: {
      name: "Commercial Credit Card",
      description:
        "Mid-market commercial card with treasury integration. Used by established businesses with structured AP processes; supports rebate programs and integrated expense reporting.",
      category: "business",
      subcategory: "credit",
      routing_owner_role: "cards",
      compliance_tags: [],
      status: "active",
    },
  });

  const workingCapitalLOC = await prisma.product.create({
    data: {
      name: "Working Capital Line of Credit",
      description:
        "Revolving credit facility for cash flow smoothing. Sized to bridge typical timing gaps between expenses and receivables. The primary product for solving seasonal or receivables-driven cash flow stress.",
      category: "business",
      subcategory: "cash_flow",
      routing_owner_role: "commercial_re",
      compliance_tags: [],
      status: "active",
    },
  });

  const equipmentLoan = await prisma.product.create({
    data: {
      name: "Equipment Loan",
      description:
        "Secured term loan for equipment acquisition. Typical term 3 to 7 years; collateralized by the equipment itself. Used for production tools, technology, and capital assets where the asset's useful life informs the financing structure.",
      category: "business",
      subcategory: "equipment",
      routing_owner_role: "commercial_re",
      compliance_tags: [],
      status: "active",
    },
  });

  const fleetLoan = await prisma.product.create({
    data: {
      name: "Vehicle/Fleet Loan",
      description:
        "Secured term loan for vehicles, including fleet structures. Typical term 4 to 5 years; collateralized by the vehicles. Used by trades and service businesses where dispatch capacity is a binding constraint on growth.",
      category: "business",
      subcategory: "equipment",
      routing_owner_role: "commercial_re",
      compliance_tags: [],
      status: "active",
    },
  });

  const treasuryServices = await prisma.product.create({
    data: {
      name: "Treasury Services",
      description:
        "Sweep accounts, lockbox, ACH origination, positive pay, and related cash management capabilities. Bundled offering for established businesses with sufficient deposit volume to benefit from automated cash positioning.",
      category: "business",
      subcategory: "transaction_services",
      routing_owner_role: "treasury",
      compliance_tags: [],
      status: "active",
    },
  });

  const creTermLoan = await prisma.product.create({
    data: {
      name: "Commercial Real Estate Term Loan",
      description:
        "Large secured term loan for facility acquisition or construction. Typical term 10 to 25 years; collateralized by the real estate. The product behind capital-event conversations for established businesses transitioning from leasing to owning, or expanding owned facilities.",
      category: "business",
      subcategory: "real_estate",
      routing_owner_role: "commercial_re",
      compliance_tags: ["hmda", "cra"],
      status: "active",
    },
  });

  const fxServices = await prisma.product.create({
    data: {
      name: "FX Services",
      description:
        "Foreign exchange and international wire services. Used by manufacturers and other businesses with international supplier or customer relationships. Pairs with Treasury Services for businesses that have outgrown ad-hoc bank wires.",
      category: "business",
      subcategory: "transaction_services",
      routing_owner_role: "treasury",
      compliance_tags: [],
      status: "active",
    },
  });

  return {
    businessChecking,
    businessVisa,
    commercialCreditCard,
    workingCapitalLOC,
    equipmentLoan,
    fleetLoan,
    treasuryServices,
    creTermLoan,
    fxServices,
  };
}

// ============================================================
// Step 1e — Member Types (brief §3.1, §4.1, §5.1)
// ============================================================

type IndustryFamilies = Awaited<ReturnType<typeof seedIndustryFamilies>>;
type Topics = Awaited<ReturnType<typeof seedTopics>>;
type Products = Awaited<ReturnType<typeof seedProducts>>;

async function seedMemberTypes(industryFamilies: IndustryFamilies, topics: Topics, products: Products) {
  // default_growth_tracks intentionally left empty here. Growth tracks are authored
  // in step 4 (featured conversations). Member Types are updated to point at their
  // canonical track at that time.
  // Sprint 5d-pre — renamed "Small Caterer · Starting" → "Event services"
  // per CONTENT_REWRITE_v1.md Section 1. Coverage broadened beyond
  // catering to include event planners, venue operators, mobile
  // bartenders, party rental companies, wedding services, corporate
  // event management. The stage descriptor ("Starting") moves out of
  // the display name into the existing `stage` field; banker-facing
  // surfaces show short Member-Type label + separate stage chip.
  const eventServices = await prisma.memberType.create({
    data: {
      name: "Event services",
      description:
        "Event-driven service businesses whose revenue follows discrete events rather than ongoing service relationships. Includes caterers, event planners, venue operators, mobile bartenders, party rental companies, wedding services, and corporate event management. Members face lumpy event-based revenue, perishable inventory risk, surge labor needs, and seasonal concentration around weddings, corporate events, and holiday cycles. Often owner-operated with personal guarantees on credit decisions.",
      industry_family_id: industryFamilies.eventDriven.id,
      stage: "starting",
      size_band: "small",
      characteristic_blockers: {
        connect: [{ id: topics.blockerSeasonal.id }, { id: topics.blockerReceivables.id }],
      },
      characteristic_triggers: {
        connect: [{ id: topics.triggerLease.id }],
      },
      characteristic_goals: {
        connect: [{ id: topics.goalFacilityOwnership.id }],
      },
      typical_products: {
        connect: [
          { id: products.businessChecking.id },
          { id: products.businessVisa.id },
          { id: products.workingCapitalLOC.id },
        ],
      },
    },
  });

  // Sprint 5d-pre — renamed "HVAC & Trades · Growing" → "Maintenance
  // services". Coverage broadened beyond HVAC to include plumbing,
  // electrical, mechanical contractors, landscapers, pool service,
  // pest control, cleaning services. Stage descriptor moves to the
  // separate `stage` field.
  const maintenanceServices = await prisma.memberType.create({
    data: {
      name: "Maintenance services",
      description:
        "Recurring-service businesses (HVAC, plumbing, electrical, mechanical contractors, landscapers, pool service, pest control, cleaning services) typically in their 8th-15th year of operations with 10-30 employees and revenue between $2M and $10M. These members have proven their model and are at the inflection point where growth requires capital — fleet expansion, additional crews, equipment upgrades, sometimes second locations. Cash flow is steady and seasonal; capital expenditure financing is the dominant capital question. Owner-operated with strong relationships in their service area; growth is constrained more by execution capacity than by demand.",
      industry_family_id: industryFamilies.tradesConstruction.id,
      stage: "growing",
      size_band: "mid",
      characteristic_blockers: {
        connect: [
          { id: topics.blockerCapacity.id },
          { id: topics.blockerSeasonal.id },
          { id: topics.blockerReceivables.id },
        ],
      },
      characteristic_triggers: {
        connect: [{ id: topics.triggerLease.id }],
      },
      characteristic_goals: {
        connect: [{ id: topics.goalFleet.id }, { id: topics.goalFacilityOwnership.id }],
      },
      typical_products: {
        connect: [
          { id: products.businessChecking.id },
          { id: products.businessVisa.id },
          { id: products.workingCapitalLOC.id },
          { id: products.equipmentLoan.id },
          { id: products.fleetLoan.id },
          { id: products.creTermLoan.id },
        ],
      },
    },
  });

  // Sprint 5d-pre — renamed "Specialty Manufacturer · Established" →
  // "Specialty manufacturer". Coverage covers mid-market manufacturers,
  // industrial fabrication, custom production, contract manufacturing.
  // Stage descriptor moves to the separate `stage` field.
  const specialtyManufacturer = await prisma.memberType.create({
    data: {
      name: "Specialty manufacturer",
      description:
        "Mid-market manufacturers (precision components, contract manufacturing, industrial fabrication, custom production, specialty chemicals, medical device subassemblies) typically 15-30 years old, with 50-200 employees and revenue between $15M and $80M. These members serve concentrated B2B customer bases — often Fortune 500 or large mid-market — under multi-year contracts. Cash flow is steady but capital-intensive; growth requires periodic large capital events for facility expansion, equipment qualification, or capacity additions. Owner-operated or owner-led, often with a small leadership team and a CFO. Banking needs are sophisticated: treasury, term financing, and commercial real estate. The competition for these relationships is regional and national commercial banks, not credit unions; Blaze wins by combining deep-relationship attentiveness with sophisticated commercial banking capability.",
      industry_family_id: industryFamilies.specialtyManufacturing.id,
      stage: "established",
      size_band: "mid",
      characteristic_blockers: {
        connect: [
          { id: topics.blockerCapacity.id },
          { id: topics.blockerConcentration.id },
        ],
      },
      characteristic_triggers: {
        connect: [
          { id: topics.triggerVolume.id },
          { id: topics.triggerCapacityEval.id },
          { id: topics.triggerLease.id },
          { id: topics.triggerEquipQual.id },
        ],
      },
      characteristic_goals: {
        connect: [{ id: topics.goalFacility.id }, { id: topics.goalCustomerGrowth.id }],
      },
      typical_products: {
        connect: [
          { id: products.businessChecking.id },
          { id: products.commercialCreditCard.id },
          { id: products.workingCapitalLOC.id },
          { id: products.equipmentLoan.id },
          { id: products.creTermLoan.id },
          { id: products.fxServices.id },
          { id: products.treasuryServices.id },
        ],
      },
    },
  });

  return { eventServices, maintenanceServices, specialtyManufacturer };
}

// ============================================================
// Step 1f — Rules (brief §2.5)
// ============================================================

type MemberTypes = Awaited<ReturnType<typeof seedMemberTypes>>;

async function seedRules(memberTypes: MemberTypes, topics: Topics) {
  // output_growth_tracks is left empty until Growth tracks are authored in step 4.
  // The rule's conditions reference Member Type and Topic IDs that already exist.
  await prisma.rule.create({
    data: {
      name: "Surface seasonal cash flow track for small caterers",
      description:
        "Surfaces the seasonal smoothing track when a small caterer shows active seasonal cash flow stress and has no existing LOC. The combination is a high-confidence indicator that the seasonal smoothing reframe is appropriate.",
      conditions: {
        operator: "and",
        operands: [
          {
            type: "member_type_match",
            params: { member_type_id: memberTypes.eventServices.id },
          },
          {
            type: "signal_match",
            params: { topic_id: topics.blockerSeasonal.id, active: true },
          },
          {
            type: "product_not_held",
            params: { product_subcategory: "cash_flow" },
          },
        ],
      },
      confidence_band: "high",
      compliance_gates: [],
      status: "canonical",
      version: 1,
    },
  });

  await prisma.rule.create({
    data: {
      name: "Surface fleet financing track for growing trades",
      description:
        "Surfaces the fleet financing track when a growing trades business shows capacity constraint signals. Pre-existing equipment loans or vehicle financing do not block this rule — the assumption is that growth has outpaced earlier capital deployment.",
      conditions: {
        operator: "and",
        operands: [
          {
            type: "member_type_match",
            params: { member_type_id: memberTypes.maintenanceServices.id },
          },
          {
            type: "signal_match",
            params: { topic_id: topics.blockerCapacity.id, active: true },
          },
        ],
      },
      confidence_band: "high",
      compliance_gates: [],
      status: "canonical",
      version: 1,
    },
  });

  await prisma.rule.create({
    data: {
      name: "Surface capital event track for established manufacturers",
      description:
        "Surfaces the coordinated commercial banking track when an established manufacturer shows capital-event signals. Confidence is medium rather than high because the signal could lead to either a banking opportunity or a confirmation that the customer is using another bank — the track's job is to discover which.",
      conditions: {
        operator: "and",
        operands: [
          {
            type: "member_type_match",
            params: { member_type_id: memberTypes.specialtyManufacturer.id },
          },
          {
            operator: "or",
            operands: [
              {
                type: "signal_match",
                params: { topic_id: topics.triggerCapacityEval.id, active: true },
              },
              {
                type: "signal_match",
                params: { topic_id: topics.triggerVolume.id, active: true },
              },
            ],
          },
        ],
      },
      confidence_band: "medium",
      compliance_gates: [],
      status: "canonical",
      version: 1,
    },
  });
}

// ============================================================
// Step 2 — Member identity records (brief §3.2, §4.2, §5.2)
// ============================================================

type Bankers = Awaited<ReturnType<typeof seedBankers>>;

async function seedMembers(industryFamilies: IndustryFamilies, memberTypes: MemberTypes, products: Products, bankers: Bankers) {
  const baseConsentState = {
    marketing_communications: false,
    data_sharing_with_partners: false,
    purpose_limitations: [],
    last_consent_review: "2026-01-15",
    minnesota_privacy_act_acknowledged: true,
    data_export_history: [],
  };

  // Jenny's Catering — products held: Business Checking, Business Visa
  const jenny = await prisma.member.create({
    data: {
      slug: "jenny",
      legal_name: "Jenny's Catering LLC",
      doing_business_as: "Jenny's Catering",
      industry_family_id: industryFamilies.eventDriven.id,
      stage: "starting",
      size_band: "small",
      member_type_id: memberTypes.eventServices.id,
      primary_banker_id: bankers.scott.id,
      tenure_started_at: iso("2023-06-15"),
      consent_state: baseConsentState,
      core_sync_state: {
        last_sync_at: NOW.toISOString(),
        products_held: [
          {
            product_id: products.businessChecking.id,
            product_name: "Business Checking",
            account_number_masked: "****4421",
            balance_band: "small",
            opened_at: "2023-06-15",
            last_activity_at: "2026-04-22",
            status: "active",
          },
          {
            product_id: products.businessVisa.id,
            product_name: "Business Visa",
            account_number_masked: "****8810",
            balance_band: "small",
            opened_at: "2023-08-02",
            last_activity_at: "2026-04-23",
            status: "active",
          },
        ],
        deposit_activity_summary: {
          rolling_30d_inflow_band: "small",
          rolling_30d_outflow_band: "small",
          volatility_score: "high",
        },
        member_facing_summary: {
          owner_name: "Jenny Patel",
          location: "Plymouth, MN",
          employees: 6,
          revenue_ttm_band: "$500K-$1M",
        },
      },
      private_notes: [],
      // Sprint 4.7 Block D — v2 key facts strip per ARCHITECTURE_V2
      // §6.2. Hand-curated for the demo. source_id stays null in
      // Turn 1; Turn 2's key-facts click handler will resolve to
      // specific captured-evidence records.
      key_facts: [
        { label: "slow-season gap", value: "$48K/quarter", source_type: "sizing_measurement", source_id: null },
        { label: "LOC sized", value: "$75K", source_type: "recommendation", source_id: null },
        { label: "response", value: "leaning yes / spouse pending", source_type: "recommendation", source_id: null },
        { label: "last touch", value: "Apr 8", source_type: "conversation", source_id: null },
      ],
      // Sprint 4.7 Block M — Tracks-supported-by-current-evidence cohort.
      // FIXME(Francisco): review and refine the per-Member rationales
      // before EVP demo. Per Q-M1 — CC drafts; Francisco refines.
      // Compliance-careful framing per ARCHITECTURE_V2 §10.2 verbatim.
      tracks_by_evidence_strength: {
        strong: [
          {
            track_name: "Working Capital LOC",
            evidence_count: 4,
            rationale:
              "Trigger (corporate-client late payments) captured; slow-season gap quantified at $48K; seasonal smoothing chart shown; Member reacted leaning yes.",
          },
        ],
        moderate: [
          {
            track_name: "Cash Management upgrade",
            evidence_count: 2,
            rationale:
              "Persistent cashflow volatility band + seasonal payment-timing pattern suggest treasury / sweep upgrade could absorb stress; banker has not yet surfaced.",
          },
        ],
        insufficient: [
          {
            track_name: "Equipment Loan",
            rationale:
              "No equipment-investment trigger captured. Catering equipment refresh has not surfaced as a stated need.",
          },
        ],
      },
    },
  });

  // Northland Heating & Cooling — products held: Business Checking, Business Visa, Equipment Loan
  const northland = await prisma.member.create({
    data: {
      slug: "northland",
      legal_name: "Northland Heating & Cooling Inc.",
      doing_business_as: "Northland HVAC",
      industry_family_id: industryFamilies.tradesConstruction.id,
      stage: "growing",
      size_band: "mid",
      member_type_id: memberTypes.maintenanceServices.id,
      primary_banker_id: bankers.scott.id,
      tenure_started_at: iso("2018-09-22"),
      consent_state: baseConsentState,
      core_sync_state: {
        last_sync_at: NOW.toISOString(),
        products_held: [
          {
            product_id: products.businessChecking.id,
            product_name: "Business Checking",
            account_number_masked: "****1102",
            balance_band: "mid",
            opened_at: "2018-09-22",
            last_activity_at: "2026-04-24",
            status: "active",
          },
          {
            product_id: products.businessVisa.id,
            product_name: "Business Visa",
            account_number_masked: "****7733",
            balance_band: "mid",
            opened_at: "2019-04-10",
            last_activity_at: "2026-04-23",
            status: "active",
          },
          {
            product_id: products.equipmentLoan.id,
            product_name: "Equipment Loan",
            account_number_masked: "****9050",
            balance_band: "mid",
            opened_at: "2022-03-15",
            last_activity_at: "2026-04-15",
            status: "active",
            balance_remaining_band: "$25K-$50K",
            term_end_date: "2027-03-15",
          },
        ],
        deposit_activity_summary: {
          rolling_30d_inflow_band: "mid",
          rolling_30d_outflow_band: "mid",
          volatility_score: "medium",
        },
        member_facing_summary: {
          owner_name: "Dan Reichart",
          location: "Maple Grove, MN",
          employees: 16,
          revenue_ttm_band: "$3M-$5M",
          revenue_growth_yoy_pct: 15,
        },
      },
      private_notes: [],
      // Sprint 4.7 Block D — v2 key facts strip.
      key_facts: [
        { label: "fleet target", value: "$180K", source_type: "recommendation", source_id: null },
        { label: "payback", value: "18 months", source_type: "sizing_measurement", source_id: null },
        { label: "response", value: "leaning yes / awaiting advisor", source_type: "recommendation", source_id: null },
        { label: "last touch", value: "Apr 5", source_type: "conversation", source_id: null },
      ],
      // Sprint 4.7 Block M — Tracks-supported-by-current-evidence cohort.
      // FIXME(Francisco): review and refine.
      tracks_by_evidence_strength: {
        strong: [
          {
            track_name: "Vehicle/Fleet Loan",
            evidence_count: 4,
            rationale:
              "Capacity goal captured (declining 20-25% bread-and-butter work); fleet target sized at $180K; ROI projection shown; Member reacted leaning yes pending CPA review.",
          },
        ],
        moderate: [
          {
            track_name: "SBA 7(a) structuring",
            evidence_count: 2,
            rationale:
              "Revenue growth pattern + technician-hiring constraint suggest SBA structure could fit fleet + working capital combined; not surfaced in current capture.",
          },
        ],
        insufficient: [
          {
            track_name: "Owner-Occupied CRE",
            rationale:
              "No real estate trigger captured. Northland currently rents the service bay; ownership has not been raised as a goal.",
          },
        ],
      },
    },
  });

  // Cygnus Bioscience — products held: Business Checking + Treasury, Commercial Credit Card, Working Capital LOC
  const cygnus = await prisma.member.create({
    data: {
      slug: "cygnus",
      legal_name: "Cygnus Bioscience Inc.",
      doing_business_as: "Cygnus Bioscience",
      industry_family_id: industryFamilies.specialtyManufacturing.id,
      stage: "established",
      size_band: "mid",
      member_type_id: memberTypes.specialtyManufacturer.id,
      primary_banker_id: bankers.scott.id,
      tenure_started_at: iso("2006-04-10"),
      consent_state: baseConsentState,
      core_sync_state: {
        last_sync_at: NOW.toISOString(),
        products_held: [
          {
            product_id: products.businessChecking.id,
            product_name: "Business Checking",
            account_number_masked: "****0042",
            balance_band: "larger",
            opened_at: "2006-04-10",
            last_activity_at: "2026-04-24",
            status: "active",
          },
          {
            product_id: products.treasuryServices.id,
            product_name: "Treasury Services",
            account_number_masked: "n/a",
            balance_band: "n/a",
            opened_at: "2014-08-20",
            last_activity_at: "2026-04-24",
            status: "active",
            package: "full",
          },
          {
            product_id: products.commercialCreditCard.id,
            product_name: "Commercial Credit Card",
            account_number_masked: "****6611",
            balance_band: "mid",
            opened_at: "2017-02-14",
            last_activity_at: "2026-04-23",
            status: "active",
          },
          {
            product_id: products.workingCapitalLOC.id,
            product_name: "Working Capital Line of Credit",
            account_number_masked: "****3300",
            balance_band: "larger",
            opened_at: "2019-06-01",
            last_activity_at: "2026-04-20",
            status: "active",
            commitment_band: "$1M-$3M",
            currently_drawn_band: "$250K-$500K",
            last_renewed: "2025-03-08",
          },
        ],
        deposit_activity_summary: {
          rolling_30d_inflow_band: "larger",
          rolling_30d_outflow_band: "larger",
          volatility_score: "low",
        },
        member_facing_summary: {
          ceo_name: "Margaret Sullivan",
          coo_name: "Tom Reyes",
          location: "St. Louis Park, MN",
          employees: 75,
          revenue_ttm_band: "$25M-$50M",
          revenue_growth_yoy_pct: 8,
          capacity_utilization_pct: 85,
          customer_concentration_note:
            "3 anchor customers (anonymized as Customer A/B/C) represent ~62% of revenue; each has indicated 15-25% volume growth over the next 18 months.",
          historical_note:
            "2019 facility expansion was financed through a regional commercial bank ('wasn't really set up for that' at the time). Margaret still mentions this; the upcoming capital event is an opportunity to address the relationship sore point.",
        },
      },
      private_notes: [],
      // Sprint 4.7 Block D — v2 key facts strip.
      key_facts: [
        { label: "CRE need", value: "$4M-$7M", source_type: "recommendation", source_id: null },
        { label: "trigger", value: "capital event", source_type: "signal", source_id: null },
        // Sprint 6 Block C — Cygnus's primary Track is SBA 504 (TRACK-008)
        // per Sprint 5c v3 addendum. SBA 504 specialist coordination
        // involves the SBA specialist + CDC partner, not the conventional
        // CRE specialist. Updated to reflect that.
        { label: "specialist", value: "SBA + CDC partner engaged", source_type: "recommendation", source_id: null },
        { label: "last touch", value: "Apr 21", source_type: "conversation", source_id: null },
      ],
      // Sprint 4.7 Block M — Tracks-supported-by-current-evidence cohort.
      // Sprint 6 Block C — Cygnus's primary Track shifted from
      // conventional CRE Term Loan to SBA 504 in Sprint 5c (per
      // MEMBER_TYPE_GUIDANCE_v3_addendum); this cohort updated to
      // match the live Track ranking. Specialist references shifted
      // from CRE-only (Marcus Webb) to SBA specialist + CDC partner
      // coordination per the Sprint 5d Section 9.8 roadmap.
      tracks_by_evidence_strength: {
        strong: [
          {
            track_name: "SBA 504",
            evidence_count: 5,
            rationale:
              "Capital event trigger captured; owner-occupancy confirmed; capacity utilization (85%) + customer growth commitments quantified; SBA specialist + CDC partner coordination underway; Member committed to working with Blaze if structural depth is shown.",
          },
        ],
        moderate: [
          {
            track_name: "Treasury Services upgrade",
            evidence_count: 2,
            rationale:
              "Multi-customer payment flow complexity + 20-year banking continuity goal suggest cash management refresh could attach to the capital event; not currently surfaced in capture.",
          },
        ],
        insufficient: [
          {
            track_name: "Conventional CRE Term Loan",
            rationale:
              "Owner-occupancy makes SBA 504 the structurally-stronger fit. Conventional CRE retained for completeness; demoted by the negative owner-occupancy entry on TRACK-003.",
          },
        ],
      },
    },
  });

  return { jenny, northland, cygnus };
}

// ============================================================
// Step 5 — Artifacts (brief §3.5, §4.5, §5.5)
//
// Authored before the featured conversations because Show-shape executions
// reference them. Each carries a description (Principle 1), a parameter_schema
// describing what member-specific values it accepts, and a compliance_status.
// `template` is a stable identifier the front-end uses to pick the correct
// React/Recharts renderer; the actual visual is rendered client-side from
// parameters_used at view time.
// ============================================================

async function seedArtifacts(reviewedByBankerId: string) {
  const seasonalSmoothing = await prisma.artifact.create({
    data: {
      title: "Seasonal cash flow smoothing chart",
      description:
        "Compares twelve months of business cash flow with and without a working capital line of credit, parameterized by the member's own revenue band and seasonal pattern. Designed to make the seasonal smoothing benefit visually obvious without claiming any specific outcome. Key understanding: a properly-sized LOC turns lumpy revenue into smooth cash flow, at a cost typically far below the cost of declined opportunities or stress-driven decisions during slow months.",
      type: "chart",
      parameter_schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["revenue_band", "monthly_low", "monthly_high", "proposed_loc_size"],
        properties: {
          revenue_band: { type: "string", description: "Banded TTM revenue (e.g., '$500K-$1M')" },
          monthly_low: { type: "number", description: "Slow-season monthly cash position floor in dollars." },
          monthly_high: { type: "number", description: "Peak-season monthly cash position in dollars." },
          proposed_loc_size: { type: "number", description: "Proposed Working Capital LOC commitment in dollars." },
        },
      },
      template: "seasonal_smoothing_chart_v1",
      compliance_status: "approved",
      last_reviewed_at: iso("2025-08-15"),
      reviewed_by_id: reviewedByBankerId,
      shareable: true,
    },
  });

  const fleetROI = await prisma.artifact.create({
    data: {
      title: "Fleet expansion ROI projection",
      description:
        "Compares 3 years of projected cash position under two paths: continuing to buy used vehicles with cash, versus financing two new vehicles to expand dispatch capacity. Shows captured-vs-declined revenue as a stacked overlay. The key understanding is that revenue captured from previously-declined service calls outweighs the debt service cost of the financing — typically by year 2.",
      type: "chart",
      parameter_schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: [
          "revenue_band",
          "current_fleet_size",
          "proposed_addition",
          "service_call_avg_value",
          "financing_term_months",
          "financing_rate_pct",
        ],
        properties: {
          revenue_band: { type: "string" },
          current_fleet_size: { type: "integer", description: "Number of service vehicles currently in operation." },
          proposed_addition: { type: "integer", description: "Number of vehicles in the proposed expansion." },
          service_call_avg_value: { type: "number", description: "Average revenue per service call in dollars." },
          financing_term_months: { type: "integer" },
          financing_rate_pct: { type: "number" },
        },
      },
      template: "fleet_roi_composed_chart_v1",
      compliance_status: "approved",
      last_reviewed_at: iso("2025-11-20"),
      reviewed_by_id: reviewedByBankerId,
      shareable: true,
    },
  });

  const capitalEventMap = await prisma.artifact.create({
    data: {
      // BUILD 2a (Q-058) — the legacy Artifact title surfaces in Cygnus's
      // sidebar tile (m.artifact?.title), while the migrated model's feed
      // card uses the ArtifactTemplate title "SBA 504 transaction roadmap".
      // Renamed so feed + sidebar match on Cygnus (a headline demo member).
      // The variable name + `template: "capital_event_map_v1"` dispatch key
      // are unchanged (surface-vs-schema separation).
      title: "SBA 504 transaction roadmap",
      description:
        "A relationship map showing the banking products and specialist roles involved in a capital expansion event for an established commercial customer. Used in the moment to demonstrate Blaze's coordinated commercial banking capability — the key understanding is that the capital event is not a single loan request but a coordinated multi-product engagement, and Blaze has the specialists to handle it. Designed for use with Specialty manufacturer and adjacent established Member-Types.",
      type: "comparison",
      parameter_schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["company_revenue_band", "expansion_size_estimate", "current_blaze_relationships", "cre_specialist_id"],
        properties: {
          company_revenue_band: { type: "string" },
          expansion_size_estimate: { type: "string", description: "Banded estimate of the expansion size (e.g., '$4M-$7M')." },
          current_blaze_relationships: {
            type: "array",
            items: { type: "string", enum: ["checking", "treasury", "loc", "card", "equipment", "cre"] },
          },
          cre_specialist_id: { type: "string", description: "Banker.id of the CRE specialist to surface in the map." },
        },
      },
      template: "capital_event_map_v1",
      compliance_status: "approved",
      last_reviewed_at: iso("2026-02-12"),
      reviewed_by_id: reviewedByBankerId,
      shareable: true,
    },
  });

  return { seasonalSmoothing, fleetROI, capitalEventMap };
}

// ============================================================
// Step 4a — Growth steps (templates)
//
// Twelve Growth steps total (4 per featured track). Each carries a description
// (Principle 1) and a capture_schema matching its step_shape per Data Framework
// §4. The `content` is a short banker-facing prompt; the verbatim member words
// are captured per execution, not per template.
//
// All authored by Priya Patel (the Growth lead). Status = canonical.
// ============================================================

type Artifacts = Awaited<ReturnType<typeof seedArtifacts>>;

const ASK_CAPTURE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["signal_type", "topic_id", "severity", "recency", "confidence"],
  properties: {
    signal_type: { type: "string", enum: ["goal", "blocker", "trigger", "indecision"] },
    topic_id: { type: "string" },
    severity: { type: "string", enum: ["manageable", "painful", "threatening"] },
    their_words: { type: "string" },
    recency: { type: "string", enum: ["acute_recent", "ongoing", "chronic", "hypothetical_future"] },
    confidence: { type: "string", enum: ["member_stated", "banker_inferred", "unclear"] },
  },
};

const SIZE_CAPTURE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["parent_signal_id", "magnitude", "unit", "frequency", "quantification_confidence"],
  properties: {
    parent_signal_id: { type: "string" },
    magnitude: { type: "number" },
    unit: { type: "string", enum: ["dollars", "orders", "weeks", "hours", "percent", "fte", "calls_declined", "other"] },
    frequency: { type: "string", enum: ["one_time", "monthly", "quarterly", "annual", "perpetual"] },
    feeling: { type: "string", enum: ["resigned", "frustrated", "energized", "angry"] },
    quantification_confidence: {
      type: "string",
      enum: ["member_stated", "banker_estimated_from_cues"],
    },
  },
};

const SHOW_CAPTURE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  // member_reaction removed in Sprint 1 review fix #4 — the schema collapse
  // moved that signal canonically onto Recommendation.response. The Show
  // step now captures only how the artifact was rendered and whether it was
  // sent as takeaway; how the member ultimately responded is the
  // Recommendation's response field, captured at Resolve-step closure.
  required: ["artifact_id", "parameters_used", "shared_afterward"],
  properties: {
    artifact_id: { type: "string" },
    parameters_used: { type: "object" },
    followup_questions_asked: { type: "array", items: { type: "string" } },
    shared_afterward: { type: "boolean" },
    their_words: { type: "string" },
  },
};

const RESOLVE_CAPTURE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["resolution_type", "next_step_owner_id", "due_date"],
  properties: {
    resolution_type: { type: "string", enum: ["committed", "deferred", "declined", "indecision"] },
    indecision_type: { type: ["string", "null"], enum: ["valuation", "information", "outcome_uncertainty", "authority", null] },
    next_step_description: { type: "string" },
    next_step_owner_id: { type: "string" },
    due_date: { type: "string", format: "date" },
    member_stated_reason: { type: "string" },
  },
};

const CONNECT_CAPTURE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["connect_type", "trigger_reason", "member_receptiveness"],
  properties: {
    connect_type: {
      type: "string",
      enum: ["specialist_handoff", "external_referral", "resource_share", "forward_intent", "stale_signal_cleanup"],
    },
    target_specialist_id: { type: "string" },
    target_resource_id: { type: "string" },
    forward_topic_ids: { type: "array", items: { type: "string" } },
    trigger_reason: { type: "string" },
    member_receptiveness: { type: "string", enum: ["eager", "neutral", "reluctant"] },
  },
};

async function seedGrowthSteps(
  memberTypes: MemberTypes,
  topics: Topics,
  artifacts: Artifacts,
  bankers: Bankers,
) {
  // Jenny's track steps
  const jennyAsk = await prisma.growthStep.create({
    data: {
      title: "Surface seasonal cash flow stress",
      description:
        "Open a routine relationship conversation by asking the member how cash flow has felt across the recent slow season. Designed to elicit a self-reported pattern rather than diagnosing the issue from system signals; produces a blocker Signal with recency and severity captured from the member's own framing.",
      step_shape: "ask",
      content:
        "How has cash flow been feeling over the last few months — particularly through the slower stretches? Tell me where it's been hardest.",
      capture_schema: ASK_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.eventServices.id }] },
      trigger_signals: { connect: [{ id: topics.blockerSeasonal.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const jennySize = await prisma.growthStep.create({
    data: {
      title: "Quantify the seasonal impact",
      description:
        "Layer on top of a captured seasonal cash flow stress Signal to attach a magnitude. Asks the member to estimate the revenue gap or working capital pressure during the worst stretches — banker can convert qualitative cues into a banker-estimated magnitude when the member doesn't carry the number.",
      step_shape: "size",
      content:
        "Roughly how big does the cash gap feel during your slowest months — in dollars, in weeks of payroll, however you think about it?",
      capture_schema: SIZE_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.eventServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const jennyShow = await prisma.growthStep.create({
    data: {
      title: "Render seasonal smoothing chart",
      description:
        "Render the Seasonal cash flow smoothing chart Model parameterized to the member's revenue band and seasonal pattern. The visual makes the smoothing benefit of a properly-sized LOC obvious. Captures member reaction and any follow-up questions for downstream pattern matching.",
      step_shape: "show",
      content:
        "I want to show you what your year would look like with a working capital line of credit sized for your business — let's walk through it together.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.seasonalSmoothing.id,
      target_member_types: { connect: [{ id: memberTypes.eventServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const jennyResolve = await prisma.growthStep.create({
    data: {
      title: "Capture closure",
      description:
        "Close the conversation with a structured capture of where the member landed: committed, deferred, declined, or indecision (with type). Produces an ActionCard for the next step. When resolution_type is indecision, also produces an indecision Signal so the member's current state is queryable in the Insight Engine.",
      step_shape: "resolve",
      content:
        "Where does this leave you for the next step? What do you want me to have ready for our next conversation?",
      capture_schema: RESOLVE_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.eventServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  // Northland's track steps
  const northlandAsk = await prisma.growthStep.create({
    data: {
      title: "Surface capacity constraint",
      description:
        "Open the conversation by asking how the recent peak season went — especially whether the member had to turn work away. The most common articulation of capacity constraint in growing trades is 'declined calls' or 'missed work'; the prompt is designed to elicit that specific framing.",
      step_shape: "ask",
      content:
        "How did your last peak season go for you — were you able to get to all the work, or were there calls you couldn't take?",
      capture_schema: ASK_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.maintenanceServices.id }] },
      trigger_signals: { connect: [{ id: topics.blockerCapacity.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-15"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const northlandSize = await prisma.growthStep.create({
    data: {
      title: "Quantify declined work",
      description:
        "Quantify the capacity constraint into declined service calls or lost project revenue. Trades members typically estimate this in calls or jobs declined per peak season; the banker converts to dollars using the member's average call value for the ROI calculation.",
      step_shape: "size",
      content:
        "Roughly how many calls do you think you had to turn away during peak — and what's a typical call worth to you?",
      capture_schema: SIZE_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.maintenanceServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-15"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const northlandShow = await prisma.growthStep.create({
    data: {
      title: "Render fleet expansion ROI",
      description:
        "Render the Fleet expansion ROI projection Model parameterized to the member's current fleet, average call value, and proposed addition. The composed chart shows captured-vs-declined revenue against debt service, demonstrating that fleet financing typically pays for itself by year 2 in growing trades.",
      step_shape: "show",
      content:
        "Let me show you what financing two more trucks would look like against the work you've been turning down. This isn't a pitch; it's the math.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.fleetROI.id,
      target_member_types: { connect: [{ id: memberTypes.maintenanceServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-15"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const northlandResolve = await prisma.growthStep.create({
    data: {
      title: "Capture closure",
      description:
        "Close with a structured capture of where the member landed and what the next step is. Same shape as Jenny's Resolve step but anchored to the trades-financing track; produces an ActionCard for the follow-up and an indecision Signal when applicable.",
      step_shape: "resolve",
      content:
        "Where does this leave you? Want me to put together the full projection for you to take to your CPA, or is there a different next step?",
      capture_schema: RESOLVE_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.maintenanceServices.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-02-15"),
      promoted_by_id: bankers.priya.id,
    },
  });

  // Cygnus's track steps
  const cygnusAsk1 = await prisma.growthStep.create({
    data: {
      title: "Probe the capital event evaluation",
      description:
        "When an established manufacturer references a forward-looking capital decision in casual conversation, this Ask step elevates the comment into a structured trigger Signal. Captures what they're evaluating, the time horizon, and how acutely it's on their mind.",
      step_shape: "ask",
      content:
        "Tell me more about what you're weighing on the floor space — what's driving the timing, and how sure are you that something has to give?",
      capture_schema: ASK_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturer.id }] },
      trigger_signals: { connect: [{ id: topics.triggerCapacityEval.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-03-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const cygnusAsk2 = await prisma.growthStep.create({
    data: {
      title: "Discover the timing driver",
      description:
        "Layered after the capital-event Ask: probe for the specific customer or market signal driving the timing. Established manufacturers' capital events are rarely speculative; surfacing the underlying customer-volume or qualification trigger sharpens the rationale and provides the timing anchor.",
      step_shape: "ask",
      content:
        "What's making this particular moment the right time — anything from your customer side that's pushing the timing?",
      capture_schema: ASK_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturer.id }] },
      trigger_signals: { connect: [{ id: topics.triggerVolume.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-03-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const cygnusShow = await prisma.growthStep.create({
    data: {
      title: "Render the capital event partnership map",
      description:
        "Render the Capital event partnership map Model, showing the products and specialist roles that come together in a coordinated capital event. The key understanding is that the capital event is a multi-product engagement Blaze can deliver, not a single CRE loan request — earning the right to be at the table before any RFP starts.",
      step_shape: "show",
      content:
        "Let me show you how a deal like this typically comes together at Blaze, so you can see what we'd actually bring to the table — products, specialists, timing.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.capitalEventMap.id,
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturer.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-03-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  const cygnusConnect = await prisma.growthStep.create({
    data: {
      title: "Hand off to Marcus Webb",
      description:
        "Bring the CRE specialist into the relationship before any formal RFP process begins. The handoff is a Connect step (specialist_handoff), preserves the primary banker as the relationship owner, and creates an ActionCard for Marcus to schedule a working session with the member.",
      step_shape: "connect",
      content:
        "I'd like to bring in our CRE specialist Marcus Webb early so you can hear directly from him on a deal of this size. Would you be open to a 30-minute working session in the next two weeks?",
      capture_schema: CONNECT_CAPTURE_SCHEMA,
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturer.id }] },
      author_id: bankers.priya.id,
      status: "canonical",
      promoted_at: iso("2026-03-01"),
      promoted_by_id: bankers.priya.id,
    },
  });

  return {
    jennyAsk,
    jennySize,
    jennyShow,
    jennyResolve,
    northlandAsk,
    northlandSize,
    northlandShow,
    northlandResolve,
    cygnusAsk1,
    cygnusAsk2,
    cygnusShow,
    cygnusConnect,
  };
}

// ============================================================
// Step 4b — Growth tracks (with ordered Growth step sequences)
// ============================================================

type GrowthSteps = Awaited<ReturnType<typeof seedGrowthSteps>>;

async function seedGrowthTracks(
  memberTypes: MemberTypes,
  topics: Topics,
  growthSteps: GrowthSteps,
  bankers: Bankers,
) {
  const seasonalCashFlow = await prisma.growthTrack.create({
    data: {
      name: "Smooth seasonal cash flow with LOC for small caterer",
      description:
        "Surfaces seasonal cash flow stress for small caterers, quantifies the gap, renders a parameterized smoothing chart, and closes with a sized LOC proposal. Designed for owner-operator catering businesses in their first three years where seasonality is the dominant cash flow shape.",
      banker_facing_purpose:
        "Walk Jenny through how a $75K line of credit would smooth her slow months and capture revenue she's currently leaving on the table during winter.",
      target_member_type: { connect: { id: memberTypes.eventServices.id } },
      target_blocker_topics: { connect: [{ id: topics.blockerSeasonal.id }] },
      author: { connect: { id: bankers.priya.id } },
      status: "canonical",
      promoted_at: iso("2026-02-01"),
      promoted_by: { connect: { id: bankers.priya.id } },
      growth_step_sequence: {
        create: [
          { position: 1, growth_step: { connect: { id: growthSteps.jennyAsk.id } } },
          { position: 2, growth_step: { connect: { id: growthSteps.jennySize.id } } },
          { position: 3, growth_step: { connect: { id: growthSteps.jennyShow.id } } },
          { position: 4, growth_step: { connect: { id: growthSteps.jennyResolve.id } } },
        ],
      },
    },
  });

  const fleetFinancing = await prisma.growthTrack.create({
    data: {
      name: "Unlock growth capacity with fleet financing",
      description:
        "Surfaces capacity constraint for growing trades businesses, quantifies declined work, renders a fleet ROI projection, and closes with a sized vehicle/fleet loan proposal. Designed for HVAC, electrical, plumbing, and similar trades businesses that have proven their model and are constrained by execution capacity rather than demand.",
      banker_facing_purpose:
        "Walk Dan through how financing two new trucks would let him capture the ~70 service calls he's been turning away each peak season.",
      target_member_type: { connect: { id: memberTypes.maintenanceServices.id } },
      target_blocker_topics: { connect: [{ id: topics.blockerCapacity.id }] },
      author: { connect: { id: bankers.priya.id } },
      status: "canonical",
      promoted_at: iso("2026-02-15"),
      promoted_by: { connect: { id: bankers.priya.id } },
      growth_step_sequence: {
        create: [
          { position: 1, growth_step: { connect: { id: growthSteps.northlandAsk.id } } },
          { position: 2, growth_step: { connect: { id: growthSteps.northlandSize.id } } },
          { position: 3, growth_step: { connect: { id: growthSteps.northlandShow.id } } },
          { position: 4, growth_step: { connect: { id: growthSteps.northlandResolve.id } } },
        ],
      },
    },
  });

  const capitalEvent = await prisma.growthTrack.create({
    data: {
      name: "Earn the capital event with the right team in the room",
      description:
        "Surfaces the capital event evaluation for established specialty manufacturers, discovers the customer-volume or qualification driver, demonstrates Blaze's coordinated commercial banking capability via the partnership map, and hands off to the CRE specialist before any formal RFP starts. Designed to address the recurring failure mode where established manufacturers default to regional commercial banks for capital events because their primary credit union 'isn't really set up for that'.",
      banker_facing_purpose:
        "Bring Marcus into the conversation early — Margaret's leadership team is moving on a $4-7M expansion and Blaze should be the bank that earns this deal.",
      target_member_type: { connect: { id: memberTypes.specialtyManufacturer.id } },
      target_trigger_topics: {
        connect: [
          { id: topics.triggerCapacityEval.id },
          { id: topics.triggerVolume.id },
        ],
      },
      author: { connect: { id: bankers.priya.id } },
      status: "canonical",
      promoted_at: iso("2026-03-01"),
      promoted_by: { connect: { id: bankers.priya.id } },
      growth_step_sequence: {
        create: [
          { position: 1, growth_step: { connect: { id: growthSteps.cygnusAsk1.id } } },
          { position: 2, growth_step: { connect: { id: growthSteps.cygnusAsk2.id } } },
          { position: 3, growth_step: { connect: { id: growthSteps.cygnusShow.id } } },
          { position: 4, growth_step: { connect: { id: growthSteps.cygnusConnect.id } } },
        ],
      },
    },
  });

  return { seasonalCashFlow, fleetFinancing, capitalEvent };
}

// Wire MemberType.default_growth_tracks and Rule.output_growth_tracks now that
// the Growth tracks exist. This was deliberately deferred from step 1.
async function linkMemberTypesAndRulesToTracks(
  memberTypes: MemberTypes,
  growthTracks: Awaited<ReturnType<typeof seedGrowthTracks>>,
) {
  await prisma.memberType.update({
    where: { id: memberTypes.eventServices.id },
    data: { default_growth_tracks: { connect: [{ id: growthTracks.seasonalCashFlow.id }] } },
  });
  await prisma.memberType.update({
    where: { id: memberTypes.maintenanceServices.id },
    data: { default_growth_tracks: { connect: [{ id: growthTracks.fleetFinancing.id }] } },
  });
  await prisma.memberType.update({
    where: { id: memberTypes.specialtyManufacturer.id },
    data: { default_growth_tracks: { connect: [{ id: growthTracks.capitalEvent.id }] } },
  });

  // Rules → output Growth tracks. Look up rules by name (the canonical key).
  const rule1 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface seasonal cash flow track for small caterers" } });
  const rule2 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface fleet financing track for growing trades" } });
  const rule3 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface capital event track for established manufacturers" } });

  await prisma.rule.update({
    where: { id: rule1.id },
    data: { output_growth_tracks: { connect: [{ id: growthTracks.seasonalCashFlow.id }] } },
  });
  await prisma.rule.update({
    where: { id: rule2.id },
    data: { output_growth_tracks: { connect: [{ id: growthTracks.fleetFinancing.id }] } },
  });
  await prisma.rule.update({
    where: { id: rule3.id },
    data: { output_growth_tracks: { connect: [{ id: growthTracks.capitalEvent.id }] } },
  });
}

// ============================================================
// Step 3 + Step 4 — Conversations per Member
//
// Each Member has a sequence of prior Conversations (low-fidelity — meeting
// type, channel, sentiment, optional moment_quote / banker_note) plus one
// featured Conversation with full Growth step executions, Signals,
// ActionCards, and a Recommendation.
//
// Carry-forward Signals (active Signals captured in prior Conversations that
// remain part of the current state) are attached to the prior Conversation
// they originated in.
// ============================================================

type Members = Awaited<ReturnType<typeof seedMembers>>;

async function seedJennyConversations(
  members: Members,
  bankers: Bankers,
  topics: Topics,
  growthSteps: GrowthSteps,
  artifacts: Artifacts,
  rules: { rule1Id: string },
  products: Products,
) {
  const m = members.jenny;

  // 2023-06-15 onboarding
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "onboarding",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Account opening; Visa application initiated",
      created_at: iso("2023-06-15"),
      closed_at: iso("2023-06-15"),
    },
  });

  // 2024-03-12 check_in — Jenny mentioned 'winter was tough'. Banker also
  // captured an underlying goal Signal here (cash flow smoothing intent),
  // inferred rather than directly stated by Jenny — early surface of the
  // objective the seasonal-smoothing track addresses two years later.
  const mar2024 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "call",
      sentiment: "receptive",
      moment_quote: "winter was tough",
      banker_note: "Year-end review; Jenny mentioned 'winter was tough' but didn't elaborate. In hindsight this was the first surface of seasonal cash flow stress; not formally captured as a Signal at the time. A goal Signal (cash flow smoothing) was banker_inferred from the comment and added retroactively when reviewing the relationship for the April 2026 meeting.",
      created_at: daysAgo(52),
      closed_at: daysAgo(52),
    },
  });

  const jennyCashFlowSmoothingGoalSignal = await prisma.signal.create({
    data: {
      conversation_id: mar2024.id,
      member_id: m.id,
      type: "goal",
      topic_id: topics.goalCashFlowSmoothing.id,
      severity: "manageable",
      their_words: "I just want to be able to sleep through January",
      recency: "ongoing",
      confidence: "banker_inferred",
      active: true,
      captured_at: daysAgo(52),
    },
  });

  // 2024-09-08 check_in — Visa limit increase, spouse mention
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "cautious",
      banker_note: "Visa limit increase request approved; Jenny mentioned spouse helps with books — first surface of spousal involvement in financial decisions.",
      created_at: iso("2024-09-08"),
      closed_at: iso("2024-09-08"),
    },
  });

  // 2025-12-04 service — late-paying corporate client; produces a carry-forward Signal
  const dec2025 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "service",
      channel: "call",
      sentiment: "uncertain",
      banker_note: "Inquiry about a corporate client paying 45+ days late. Scott offered guidance, no Growth track run.",
      created_at: daysAgo(35),
      closed_at: daysAgo(35),
    },
  });

  // Sprint 5a.3 Block A — naming this Signal so Sprint 5a.3's
  // FactorCapture source linkage can reference it by variable in
  // seed-matrix.ts. Behavior unchanged; previously anonymous.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const jennyReceivablesBlockerSignal = await prisma.signal.create({
    data: {
      conversation_id: dec2025.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerReceivables.id,
      severity: "manageable",
      // Sprint 4.7 Block P — quote enrichment per Q-P1 (selected from
      // MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md).
      their_words: "Some big accounts paying 60+ days now. Used to be 30.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(35),
      // Magnitude backfilled per Q-017. The 45-days-late detail was originally
      // captured only as banker_note prose on the conversation; making it a
      // structured field on the Signal lets the Insight Engine aggregate
      // receivables-timing severity across Members and lets the chip-pattern
      // surface the value in the active-Signals band.
      magnitude: 45,
      unit: "days",
      // No frequency: this is a one-time observation about a specific late
      // payment, not a recurring rhythm.
      frequency: null,
    },
  });

  // 2026-04-08 — featured conversation
  const apr8 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      duration_min: 32,
      moment_quote: "this is exactly what I needed to see — wow",
      banker_note: "Husband is the financial decision-maker; include him next time",
      created_at: daysAgo(17),
      closed_at: daysAgo(17),
    },
  });

  // Step 1 — Ask
  const askExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr8.id,
      growth_step_id: growthSteps.jennyAsk.id,
      sequence_position: 1,
      captured_data: {
        signal_type: "blocker",
        topic_id: topics.blockerSeasonal.id,
        severity: "painful",
        their_words: "January and February kill us every year. Holiday parties end the second week of December and then nothing till spring.",
        recency: "recent",
        confidence: "member_stated",
      },
      executed_at: daysAgo(17),
    },
  });

  const seasonalSignal = await prisma.signal.create({
    data: {
      conversation_id: apr8.id,
      growth_step_execution_id: askExec.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerSeasonal.id,
      severity: "painful",
      their_words: "January and February kill us every year. Holiday parties end the second week of December and then nothing till spring.",
      recency: "recent",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(17),
    },
  });

  // Step 2 — Size: layers magnitude onto the seasonal Signal
  const sizeExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr8.id,
      growth_step_id: growthSteps.jennySize.id,
      sequence_position: 2,
      captured_data: {
        parent_signal_id: seasonalSignal.id,
        magnitude: 12000,
        unit: "dollars",
        frequency: "quarterly",
        feeling: "frustrated",
        quantification_confidence: "banker_estimated_from_cues",
      },
      executed_at: daysAgo(17),
    },
  });

  // Update parent Signal with magnitude per Data Framework §4.2
  await prisma.signal.update({
    where: { id: seasonalSignal.id },
    data: {
      magnitude: 12000,
      unit: "dollars",
      frequency: "quarterly",
      feeling: "frustrated",
    },
  });

  // Step 3 — Show: produces Recommendation
  const showExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr8.id,
      growth_step_id: growthSteps.jennyShow.id,
      sequence_position: 3,
      captured_data: {
        artifact_id: artifacts.seasonalSmoothing.id,
        parameters_used: {
          revenue_band: "$500K-$1M",
          monthly_low: 35000,
          monthly_high: 95000,
          proposed_loc_size: 75000,
        },
        followup_questions_asked: ["size", "rate", "flexibility"],
        shared_afterward: true,
        // Sprint 4.7 Block P — quote enrichment per Q-P1.
        their_words:
          "Oh, I see what you're doing — the line just covers the dip. That's actually... yeah, that's helpful to see it laid out.",
      },
      executed_at: daysAgo(17),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.workingCapitalLOC.id,
      size_proposed: 75000,
      structure: "standard",
      rationale_summary:
        "$75K LOC sized at one quarter of the slow-season revenue gap. Existing Visa demonstrates payment discipline.",
      rationale_text:
        "Member showed acute seasonal cash flow stress quantified at approximately $12K per quarter, against a long-running goal of smoothing lumpy cash flow into manageable shape. A $75K LOC sized at roughly one quarter of the slow-season revenue gap provides smoothing capacity with comfortable headroom. Member's existing Visa demonstrates payment discipline; primary guarantee from the owner is appropriate given the size.",
      confidence_band: "high",
      response: "leaning_yes",
      // Sprint 4.6 Block A — value migrated from "spouse" to
      // "co_decision_maker_household" per COMPLIANCE.md §6.3 business-
      // factor-only taxonomy. Same semantic meaning; direction-explicit
      // framing.
      primary_concern: "co_decision_maker_household",
      // Sprint 4 §A.3 — structured size capture (Sprint 3 review §3a).
      // size_low === size_high → display layer renders "$75K" (single value).
      size_low: 75000,
      size_high: 75000,
      // Sprint 4 §A.3 — product sub-type within Working Capital LOC family.
      product_subtype: "seasonal_smoothing",
      rule_id_that_fired: rules.rule1Id,
      // Sprint 2 Prompt 2 §C — opportunity ownership. Jenny's relationship
      // banker (Scott) also owns the LOC opportunity — no specialist
      // handoff for this product. Demo case for owner === primary_banker.
      owned_by_id: bankers.scott.id,
      responds_to_signals: {
        connect: [
          { id: seasonalSignal.id },
          { id: jennyCashFlowSmoothingGoalSignal.id },
        ],
      },
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      their_words:
        "Seventy-five thousand. Okay. That's bigger than I was thinking but if I'm only drawing during the slow months...",
      created_at: daysAgo(17),
      updated_at: daysAgo(17),
    },
  });

  // Step 4 — Resolve: produces ActionCard + Signal (Q-014)
  const resolveExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr8.id,
      growth_step_id: growthSteps.jennyResolve.id,
      sequence_position: 4,
      captured_data: {
        resolution_type: "indecision",
        indecision_type: "authority",
        next_step_description: "Send Jenny the parameterized chart by email; offer joint call with her spouse next week",
        next_step_owner_id: bankers.scott.id,
        due_date: "2026-04-22",
        member_stated_reason: "I want to talk to my husband before we commit to anything this size",
      },
      executed_at: daysAgo(17),
    },
  });

  const jennyIndecisionSignal = await prisma.signal.create({
    data: {
      conversation_id: apr8.id,
      growth_step_execution_id: resolveExec.id,
      member_id: m.id,
      type: "indecision",
      topic_id: topics.indecisionAuthority.id,
      severity: "manageable",
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      their_words:
        "I'd want Mike to look at the numbers before I sign anything that big. He handles the books with me.",
      recency: "recent",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(17),
    },
  });

  // Wire the freshly-created indecision Signal back into the Recommendation's
  // responds_to_signals. The Resolve step runs after the Show step, so the
  // Recommendation already exists; update it now that the indecision Signal
  // is queryable. The growth_step_execution_id is @unique, so this is a safe
  // single-row lookup.
  await prisma.recommendation.update({
    where: { growth_step_execution_id: showExec.id },
    data: { responds_to_signals: { connect: [{ id: jennyIndecisionSignal.id }] } },
  });

  await prisma.actionCard.create({
    data: {
      type: "follow_up",
      owner_id: bankers.scott.id,
      member_id: m.id,
      origin_conversation_id: apr8.id,
      origin_growth_step_execution_id: resolveExec.id,
      rationale:
        "Jenny was 'leaning yes' on the $75K LOC after seeing the seasonal smoothing chart but wants to discuss with her husband before committing. De-risk by sending her the parameterized chart and offering a joint call next week.",
      suggested_opening:
        "Hi Jenny — attaching the projection we walked through. Happy to set up a quick call with you and Mike if that would be helpful before deciding.",
      due_at: daysAgo(3),
      status: "open",
      status_changed_at: daysAgo(17),
      created_at: daysAgo(17),
    },
  });
}

async function seedNorthlandConversations(
  members: Members,
  bankers: Bankers,
  topics: Topics,
  growthSteps: GrowthSteps,
  artifacts: Artifacts,
  rules: { rule2Id: string },
  products: Products,
) {
  const m = members.northland;

  // 2018-09-22 onboarding
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "onboarding",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Account opening; first business banking relationship for Dan.",
      created_at: iso("2018-09-22"),
      closed_at: iso("2018-09-22"),
    },
  });

  // 2024-08-12 check_in
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      moment_quote: "really busy summer",
      banker_note: "Annual check-in; Dan mentioned 'really busy summer' — early surface of capacity pressure, not formally captured.",
      created_at: iso("2024-08-12"),
      closed_at: iso("2024-08-12"),
    },
  });

  // 2024-11-03 service
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "service",
      channel: "call",
      sentiment: "receptive",
      banker_note: "Equipment loan payment review; routine.",
      created_at: iso("2024-11-03"),
      closed_at: iso("2024-11-03"),
    },
  });

  // 2025-02-22 opportunity — Visa limit increase approved; Dan also mentioned
  // wanting another truck. Captured as a goal Signal (fleet expansion) on
  // this conversation; the capacity-constraint blocker isn't explicitly
  // captured here yet because Dan framed it as wanting more capacity, not as
  // declining work.
  const feb2025 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "opportunity",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Visa limit increase approved; Dan mentioned needing one more truck. Captured as a goal Signal (fleet expansion). The capacity-constraint blocker comes through as the structural counterpart in the April 2026 conversation when Dan reframes the same situation as 'turning people away'.",
      created_at: daysAgo(47),
      closed_at: daysAgo(47),
    },
  });

  const northlandFleetGoalSignal = await prisma.signal.create({
    data: {
      conversation_id: feb2025.id,
      member_id: m.id,
      type: "goal",
      topic_id: topics.goalFleet.id,
      severity: "manageable",
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      their_words:
        "We could probably do another 20-25% volume if we had the trucks and bodies. Demand isn't the problem.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(47),
    },
  });

  // 2026-04-15 — featured
  const apr15 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      duration_min: 35,
      moment_quote: "I've been doing this all wrong — paying cash for used trucks while declining work",
      banker_note: "Daughter's vehicle loan also approved separately; that conversation went well too.",
      created_at: daysAgo(18),
      closed_at: daysAgo(18),
    },
  });

  // Step 1 — Ask
  const askExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr15.id,
      growth_step_id: growthSteps.northlandAsk.id,
      sequence_position: 1,
      captured_data: {
        signal_type: "blocker",
        topic_id: topics.blockerCapacity.id,
        severity: "painful",
        their_words: "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet.",
        recency: "ongoing",
        confidence: "member_stated",
      },
      executed_at: daysAgo(18),
    },
  });

  const capSignal = await prisma.signal.create({
    data: {
      conversation_id: apr15.id,
      growth_step_execution_id: askExec.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerCapacity.id,
      severity: "painful",
      their_words: "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(18),
    },
  });

  // Step 2 — Size
  const sizeExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr15.id,
      growth_step_id: growthSteps.northlandSize.id,
      sequence_position: 2,
      captured_data: {
        parent_signal_id: capSignal.id,
        magnitude: 70,
        unit: "calls_declined",
        frequency: "annual",
        feeling: "frustrated",
        quantification_confidence: "banker_estimated_from_cues",
      },
      executed_at: daysAgo(18),
    },
  });

  await prisma.signal.update({
    where: { id: capSignal.id },
    data: {
      magnitude: 70,
      unit: "calls_declined",
      frequency: "annual",
      feeling: "frustrated",
    },
  });

  // Step 3 — Show
  const showExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr15.id,
      growth_step_id: growthSteps.northlandShow.id,
      sequence_position: 3,
      captured_data: {
        artifact_id: artifacts.fleetROI.id,
        parameters_used: {
          revenue_band: "$3M-$5M",
          current_fleet_size: 8,
          proposed_addition: 2,
          service_call_avg_value: 700,
          financing_term_months: 60,
          financing_rate_pct: 7.5,
        },
        followup_questions_asked: ["structure_options", "rate", "speed_of_approval"],
        shared_afterward: true,
        their_words: "I hear you. Let me chew on it. I want to talk to my CPA before pulling the trigger on something this size.",
      },
      executed_at: daysAgo(18),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.fleetLoan.id,
      size_proposed: 180000,
      structure: "standard",
      rationale_summary:
        "Two service vehicles at $90K each, financed over 60 months at $3.6K/month — well below the $49K of declined work per peak season. Existing Equipment Loan demonstrates payment discipline.",
      rationale_text:
        "Member showed capacity constraint quantified at approximately 70 declined service calls per peak season (roughly $49K of annual lost revenue), against a stated objective of fleet expansion. Two new service vehicles at approximately $90K each, financed over 60 months at current rates, produce monthly debt service of approximately $3,600 — well below the lost revenue from declined calls. Member's existing Equipment Loan demonstrates payment discipline.",
      confidence_band: "high",
      response: "leaning_yes",
      // Sprint 4.6 Block A — value migrated from "cpa" to
      // "external_advisor" per COMPLIANCE.md §6.3 business-factor-only
      // taxonomy. Same semantic meaning; direction-explicit framing.
      primary_concern: "external_advisor",
      // Sprint 4 §A.3 — structured size capture (firm size).
      size_low: 180000,
      size_high: 180000,
      // Two service vehicles for a residential/light-commercial trades fleet.
      product_subtype: "service_van",
      rule_id_that_fired: rules.rule2Id,
      // Sprint 2 Prompt 2 §C — Northland's fleet loan also owned by Scott
      // (Northland's primary banker); no specialist handoff for fleet
      // financing.
      owned_by_id: bankers.scott.id,
      their_words: "I hear you. Let me chew on it. I want to talk to my CPA before pulling the trigger on something this size.",
      created_at: daysAgo(18),
      updated_at: daysAgo(18),
      responds_to_signals: {
        connect: [
          { id: capSignal.id },
          { id: northlandFleetGoalSignal.id },
        ],
      },
    },
  });

  // Step 4 — Resolve: produces ActionCard + Signal (Q-014)
  const resolveExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr15.id,
      growth_step_id: growthSteps.northlandResolve.id,
      sequence_position: 4,
      captured_data: {
        resolution_type: "indecision",
        indecision_type: "information",
        next_step_description: "Send Dan the projection report; schedule call after he meets with his CPA",
        next_step_owner_id: bankers.scott.id,
        due_date: "2026-04-29",
        member_stated_reason: "I want to run this past my CPA before I commit. He handles all the tax stuff and I want him on board with the structure.",
      },
      executed_at: daysAgo(18),
    },
  });

  const northlandIndecisionSignal = await prisma.signal.create({
    data: {
      conversation_id: apr15.id,
      growth_step_execution_id: resolveExec.id,
      member_id: m.id,
      type: "indecision",
      topic_id: topics.indecisionInformation.id,
      severity: "manageable",
      their_words: "I want to run this past my CPA before I commit. He handles all the tax stuff and I want him on board with the structure.",
      recency: "recent",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(18),
    },
  });

  // Wire the indecision Signal into the Recommendation's responds_to_signals
  // (same pattern as Jenny — the Resolve step runs after the Show step).
  await prisma.recommendation.update({
    where: { growth_step_execution_id: showExec.id },
    data: { responds_to_signals: { connect: [{ id: northlandIndecisionSignal.id }] } },
  });

  await prisma.actionCard.create({
    data: {
      type: "follow_up",
      owner_id: bankers.scott.id,
      member_id: m.id,
      origin_conversation_id: apr15.id,
      origin_growth_step_execution_id: resolveExec.id,
      rationale:
        "Dan was leaning yes on fleet financing after seeing the ROI projection but wants to verify with his CPA before committing. De-risk by sending him the projection report and scheduling a follow-up call after his CPA meeting.",
      suggested_opening:
        "Hi Dan — attaching the projection we walked through. Take it to your CPA and let's schedule a call once you've had that conversation. No pressure on timing.",
      due_at: daysAgo(8),
      status: "open",
      status_changed_at: daysAgo(18),
      created_at: daysAgo(18),
    },
  });
}

async function seedCygnusConversations(
  members: Members,
  bankers: Bankers,
  topics: Topics,
  growthSteps: GrowthSteps,
  artifacts: Artifacts,
  rules: { rule3Id: string },
  products: Products,
) {
  const m = members.cygnus;

  // 2006-04-10 onboarding
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "onboarding",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Account opening as a deposit relationship; Margaret was already 3 years into building Cygnus.",
      created_at: iso("2006-04-10"),
      closed_at: iso("2006-04-10"),
    },
  });

  // 2024-11-15 check_in — captures carry-forward goal.customer_growth Signal
  const nov2024 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Annual treasury review; Margaret mentioned anchor customers signaling volume growth — captured as a forward-looking goal.",
      created_at: daysAgo(48),
      closed_at: daysAgo(48),
    },
  });

  const cygnusCustomerGrowthGoalSignal = await prisma.signal.create({
    data: {
      conversation_id: nov2024.id,
      member_id: m.id,
      type: "goal",
      topic_id: topics.goalCustomerGrowth.id,
      severity: "manageable",
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      their_words:
        "We're at about eighty-five percent capacity utilization. Three of our anchor customers are signaling fifteen to twenty-five percent volume growth over the next eighteen months. The math is clear — we have to expand or we have to start telling customers no.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(48),
    },
  });

  // 2025-03-08 service
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "service",
      channel: "call",
      sentiment: "receptive",
      banker_note: "LOC renewal at $2M; routine.",
      created_at: iso("2025-03-08"),
      closed_at: iso("2025-03-08"),
    },
  });

  // 2025-06-22 check_in — captures carry-forward blocker.customer_concentration Signal
  const jun2025 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      moment_quote: "they're naming us a preferred supplier on the platform consolidation",
      banker_note: "Margaret described a customer 'platform consolidation' naming Cygnus a preferred supplier; surfaced concentration risk as the structural counterpart. No Growth track existed for this pattern at the time.",
      created_at: daysAgo(32),
      closed_at: daysAgo(32),
    },
  });

  // Sprint 5a.3 Block A — named for source-linkage availability.
  // Currently unlinked from any FactorCapture per Sprint 5a.3 audit;
  // Pilot may route a future FACTOR-022 customer_concentration capture
  // through this grounding (architectural Note 1 — many-to-many
  // FactorCapture-to-Signal linkage decision).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cygnusConcentrationBlockerSignal = await prisma.signal.create({
    data: {
      conversation_id: jun2025.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerConcentration.id,
      severity: "manageable",
      // Sprint 4.7 Block P — quote enrichment per Q-P1. Captures the
      // memorable "lost-2019-deal" recall (Francisco's E4 demo pick).
      their_words:
        "Last expansion we went with regional. They had a CRE team that knew the building type. We weren't unhappy but the relationship cost more than the rate did. I'd rather not do that again if we have a choice.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(32),
    },
  });

  // 2025-09-04 service
  await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "service",
      channel: "in_person",
      sentiment: "receptive",
      banker_note: "Margaret introduced new COO Tom Reyes to Scott. No Growth track run.",
      created_at: iso("2025-09-04"),
      closed_at: iso("2025-09-04"),
    },
  });

  // 2026-04-21 — featured
  const apr21 = await prisma.conversation.create({
    data: {
      member_id: m.id,
      banker_id: bankers.scott.id,
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      duration_min: 55,
      moment_quote: "this is the conversation I've been wanting to have with you",
      banker_note: "Margaret still references the 2019 deal we lost; this is the chance to make that right.",
      created_at: daysAgo(7),
      closed_at: daysAgo(7),
    },
  });

  // Step 1 — Ask: capacity expansion evaluation
  const ask1Exec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr21.id,
      growth_step_id: growthSteps.cygnusAsk1.id,
      sequence_position: 1,
      captured_data: {
        signal_type: "trigger",
        topic_id: topics.triggerCapacityEval.id,
        severity: "painful",
        their_words: "we're going to need to make a big decision about the floor space within the next two quarters",
        recency: "ongoing",
        confidence: "member_stated",
      },
      executed_at: daysAgo(7),
    },
  });

  const cygnusCapacityEvalSignal = await prisma.signal.create({
    data: {
      conversation_id: apr21.id,
      growth_step_execution_id: ask1Exec.id,
      member_id: m.id,
      type: "trigger",
      topic_id: topics.triggerCapacityEval.id,
      severity: "painful",
      their_words: "we're going to need to make a big decision about the floor space within the next two quarters",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(7),
    },
  });

  // Step 2 — Ask: customer volume commitment
  const ask2Exec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr21.id,
      growth_step_id: growthSteps.cygnusAsk2.id,
      sequence_position: 2,
      captured_data: {
        signal_type: "trigger",
        topic_id: topics.triggerVolume.id,
        severity: "painful",
        // Sprint 4.7.1 Block H — restore quote-topic alignment. Block P
      // had overwritten this with the RFP-vs-relationship Indecision
      // quote, which doesn't match the triggerVolume topic. Restored to
      // the canonical MEMBER_FIXTURE_BRIEF §5.4 customer-volume-commitment
      // quote so the two Cygnus triggers render as distinct, faithful
      // captures (capacity_eval + customer_volume_commitment).
      their_words:
          "Three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source.",
        recency: "ongoing",
        confidence: "member_stated",
      },
      executed_at: daysAgo(7),
    },
  });

  const cygnusVolumeSignal = await prisma.signal.create({
    data: {
      conversation_id: apr21.id,
      growth_step_execution_id: ask2Exec.id,
      member_id: m.id,
      type: "trigger",
      topic_id: topics.triggerVolume.id,
      severity: "painful",
      // Sprint 4.7.1 Block H — restored canonical volume-trigger quote.
      their_words:
        "Three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source.",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: daysAgo(7),
    },
  });

  // Step 3 — Show: produces Recommendation (size_proposed null per brief — range stays in rationale)
  const showExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr21.id,
      growth_step_id: growthSteps.cygnusShow.id,
      sequence_position: 3,
      captured_data: {
        artifact_id: artifacts.capitalEventMap.id,
        parameters_used: {
          company_revenue_band: "$25M-$50M",
          expansion_size_estimate: "$4M-$7M",
          current_blaze_relationships: ["treasury", "loc"],
          cre_specialist_id: bankers.marcus.id,
        },
        followup_questions_asked: ["timeline_for_decision", "blaze_capacity_for_deal_size", "marcus_webb_background"],
        shared_afterward: false,
        // Sprint 4.7 Block P — quote enrichment per Q-P1.
their_words: "Bring me the specialist. We'll work through structure together.",
      },
      executed_at: daysAgo(7),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.creTermLoan.id,
      size_proposed: null,
      structure: "standard",
      // Sprint 6 Block C — Cygnus shifted from conventional CRE to
      // SBA 504 in Sprint 5c. Recommendation narrative updated to
      // reflect SBA specialist + CDC partner coordination.
      rationale_summary:
        "$4M-$7M SBA 504 financing for the owner-occupied capacity expansion. SBA specialist + CDC partner engaged early; relationship coordination by Scott.",
      rationale_text:
        "Member is evaluating a major capacity expansion driven by anchor customer volume growth commitments and a long-running customer-growth objective. Owner-occupancy confirmed, which makes SBA 504 structurally stronger than conventional CRE (longer-term fixed CDC piece, lower equity requirement). Current capacity at ~85% utilization on primary production line; expansion estimated at $4M-$7M including facility, equipment qualification, and validation. Member explicitly receptive to Blaze handling the deal. SBA specialist + CDC partner engaged; relationship coordination by Scott Brynjolffson.",
      confidence_band: "medium",
      response: "leaning_yes",
      // Sprint 4.6 Block A — value migrated from "bank_capability" to
      // "service_or_capability_concern" per COMPLIANCE.md §6.3
      // business-factor-only taxonomy. The new value is the shared
      // engaged-and-decline-context value. Cygnus's concern is the
      // bank's ability to deliver a CRE deal of this size — a service /
      // capability question, not a UDAAP-risky "doesn't trust" framing.
      primary_concern: "service_or_capability_concern",
      // Sprint 4 §A.3 — structured range capture (Sprint 3 review §3a).
      // size_low < size_high → display layer renders "$4M-$7M" (range).
      // The legacy size_proposed field stays null for this Recommendation
      // since the range is the truer capture; the rationale prose carries
      // the size context.
      size_low: 4000000,
      size_high: 7000000,
      product_subtype: "manufacturing_facility",
      rule_id_that_fired: rules.rule3Id,
      // Sprint 2 Prompt 2 §C — Cygnus's CRE opportunity is owned by Marcus
      // Webb (CRE specialist), distinct from the Member's primary banker
      // (Scott Brynjolffson). The architecturally important demo case:
      // ownership routes specialty product opportunities to the right
      // expert while the relationship banker remains the primary contact.
      owned_by_id: bankers.marcus.id,
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
their_words: "Bring me the specialist. We'll work through structure together.",
      created_at: daysAgo(7),
      updated_at: daysAgo(7),
      responds_to_signals: {
        connect: [
          { id: cygnusCapacityEvalSignal.id },
          { id: cygnusVolumeSignal.id },
          { id: cygnusCustomerGrowthGoalSignal.id },
        ],
      },
    },
  });

  // Step 4 — Connect: produces ActionCard (handoff)
  const connectExec = await prisma.growthStepExecution.create({
    data: {
      conversation_id: apr21.id,
      growth_step_id: growthSteps.cygnusConnect.id,
      sequence_position: 4,
      captured_data: {
        connect_type: "specialist_handoff",
        target_specialist_id: bankers.marcus.id,
        trigger_reason:
          "Capital event evaluation underway; CRE and structured term financing required; bringing CRE specialist in early to earn the relationship before any RFP process. Member explicitly receptive to Blaze handling the deal.",
        member_receptiveness: "eager",
      },
      executed_at: daysAgo(7),
    },
  });

  await prisma.actionCard.create({
    data: {
      type: "handoff",
      owner_id: bankers.marcus.id,
      member_id: m.id,
      origin_conversation_id: apr21.id,
      origin_growth_step_execution_id: connectExec.id,
      rationale:
        "Capital event evaluation underway at Cygnus Bioscience. Member is at ~85% capacity utilization with 3 anchor customers indicating 15-25% volume growth over 18 months. Expansion size estimated at $4-7M. Member is explicitly receptive to Blaze handling the deal but is keeping options open. Bring CRE specialist in early to earn the relationship before any RFP process. Note: Cygnus financed their 2019 expansion through a regional commercial bank — Margaret still mentions this; this is an opportunity to make that right.",
      suggested_opening:
        "Margaret, Scott told me you're starting to think about your floor space situation. I lead our commercial real estate and structured financing work — I'd love to spend 30 minutes understanding what you're weighing, with no expectation that we're the right answer. When works for you?",
      due_at: daysAgo(5),
      status: "open",
      status_changed_at: daysAgo(7),
      created_at: daysAgo(7),
    },
  });

  // Card 2 — Scott follow-up: a banker-edited add-on (no specific step origin).
  await prisma.actionCard.create({
    data: {
      type: "follow_up",
      owner_id: bankers.scott.id,
      member_id: m.id,
      origin_conversation_id: apr21.id,
      origin_growth_step_execution_id: null,
      rationale:
        "Confirm Marcus's introduction to Margaret landed cleanly. Check in with Margaret separately to see if there's anything else she wanted to discuss but didn't. The primary banker stays primary even when the specialist comes in.",
      suggested_opening:
        "Margaret — wanted to follow up on our conversation last week. Did Marcus reach out? And is there anything else you've been thinking about that we should put on the next agenda?",
      due_at: iso("2026-05-05"),
      status: "open",
      status_changed_at: daysAgo(7),
      created_at: daysAgo(7),
    },
  });
}

// ============================================================
// Step 6 — Derive Member.last_touch_at, active_signal_count, open_action_card_count
// ============================================================

async function deriveMemberState(memberId: string) {
  const lastConv = await prisma.conversation.findFirst({
    where: { member_id: memberId },
    orderBy: { created_at: "desc" },
    select: { created_at: true },
  });
  const activeSignals = await prisma.signal.count({ where: { member_id: memberId, active: true } });
  const openCards = await prisma.actionCard.count({
    where: { member_id: memberId, status: { in: ["open", "in_progress"] } },
  });
  await prisma.member.update({
    where: { id: memberId },
    data: {
      last_touch_at: lastConv?.created_at ?? null,
      active_signal_count: activeSignals,
      open_action_card_count: openCards,
    },
  });
}

// ============================================================
// Step 6b — MemberSummarySnapshot generation (retroactive for featured Conversations)
//
// In production, snapshots are written by the Conversation-save flow AFTER
// deriveMemberState has run, capturing the prose a banker would see at that
// moment. For the demo seed, we generate one snapshot per featured
// Conversation per Member to populate the audit trail visibly. UI surfacing
// of snapshots is deferred to post-demo (Q-015).
//
// Performance note: in v1 the templated summarizeMember runs in microseconds
// per call. If a future version replaces templates with LLM-generated
// summaries, the per-event cost becomes meaningful at scale (hundreds of
// milliseconds + token spend per Conversation save) — flagged in BUILD_LOG
// for the next architecture review.
// ============================================================

async function generateMemberSummarySnapshot(memberId: string, conversationId: string, now: Date) {
  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: {
      member_type: { select: { name: true } },
      industry_family: { select: { name: true } },
      primary_banker: { select: { display_name: true } },
      recommendations: {
        // Sprint 2 §A.2 — status field retired; gate on response instead.
        // Mid-journey responses (engaged through committed) represent
        // active opportunities the snapshot prose should mention.
        where: {
          response: { in: ["engaged", "leaning_yes", "neutral", "leaning_no", "committed"] },
        },
        orderBy: { created_at: "desc" },
        take: 1,
        include: { product: { select: { name: true } } },
      },
    },
  });

  const activeBlockerCount = await prisma.signal.count({
    where: { member_id: memberId, active: true, type: "blocker" },
  });

  const proposal = member.recommendations[0] ?? null;

  const input: MemberSummaryInput = {
    legal_name: member.legal_name,
    doing_business_as: member.doing_business_as,
    member_type_name: member.member_type.name,
    industry_family_name: member.industry_family.name,
    tenure_started_at: member.tenure_started_at,
    primary_banker_name: member.primary_banker.display_name,
    active_blocker_count: activeBlockerCount,
    active_proposal: proposal
      ? {
          product_name: proposal.product.name,
          size_proposed: proposal.size_proposed,
          response: proposal.response,
          primary_concern: proposal.primary_concern,
        }
      : null,
    last_touch_at: member.last_touch_at,
    open_action_card_count: member.open_action_card_count,
    active_signal_count: member.active_signal_count,
  };

  const result = summarizeMember(input, now);
  if (!result.ok) {
    throw new Error(
      `summarizeMember produced MissingSlotsError for ${member.legal_name}: missing=${result.error.missing.join(", ")}`,
    );
  }

  await prisma.memberSummarySnapshot.create({
    data: {
      member_id: memberId,
      conversation_id: conversationId,
      summary_text: result.value,
      template_version: SUMMARIZE_MEMBER_TEMPLATE_VERSION,
      generated_at: now,
    },
  });
}

// ============================================================
// Step 7 — Macros (Sprint 4 §B).
//
// Three sample Macros per the prompt's §B and per
// INSIGHT_ENGINE_DESIGN_NOTES.md §3. Each Macro affects exactly one of
// the demo's three Member Types so the Macro context banner (Prompt 4.1b
// work) has something to surface for each Member profile.
//
// Authorship: external_label is used for all three demo Macros — Marcus
// Wei (Chief Economist) and Margot Desandre (Sector Specialist) aren't seeded
// as Banker entities in this demo, and adding them as Banker rows would
// inflate the banker dropdown with non-relationship-banker identities.
// Logged as Q-023 in OPEN_QUESTIONS for Pilot-phase reconsideration.
//
// Affected entities (industry_families / member_types / topics) are stored
// as Json arrays of ID strings since SQLite doesn't support String[].
// ============================================================

async function seedMacros(
  industryFamilies: IndustryFamilies,
  memberTypes: MemberTypes,
  topics: Topics,
) {
  // Macro 1 — Q3 supplier payment compression (affects Event services)
  await prisma.macro.create({
    data: {
      title: "Q3 supplier payment compression — Event services",
      summary:
        "Small caterers across the metro are reporting 20-30% extension in customer payment terms during Q3 2025 through Q1 2026. Driven by tightened working capital across customers in the corporate hospitality segment, particularly mid-sized firms responding to elevated cost-of-capital. Members exposed to corporate event catering are most affected.",
      authored_by_external_label: "Marcus Wei (Chief Economist)",
      authored_at: iso("2026-04-12"),
      effective_period_start: iso("2026-04-12"),
      effective_period_end: null, // Still effective
      affected_industry_families: [industryFamilies.eventDriven.id],
      affected_member_types: [memberTypes.eventServices.id],
      recommended_response:
        "Surface seasonal cash flow stress during Ask phase. Quantify customer-payment-extension impact in Size phase. Working Capital LOC Track is well-suited; size at one quarter of slow-season revenue gap. Reference this Macro in Suggested opening to the Member as part of the conversational on-ramp.",
      evidence_links: [
        "https://www.minneapolisfed.org/research/srr/q3-2025-payments-compression",
        "https://blaze-internal.example.com/research/2026-04-12-small-caterer-cash-flow",
      ],
      related_topics: [
        topics.blockerSeasonal.id,
        topics.blockerReceivables.id,
        topics.goalCashFlowSmoothing.id,
      ],
    },
  });

  // Macro 2 — Light commercial fleet ROI window (affects Maintenance services)
  await prisma.macro.create({
    data: {
      title: "Light commercial fleet ROI window — Maintenance services",
      summary:
        "Vehicle and equipment financing rates are at a 24-month low; meanwhile capacity-constrained HVAC and trades businesses are reporting elevated declined-call rates from limited fleet capacity. The combination creates a roughly 18-24 month ROI window where financed fleet expansion captures previously-declined revenue meaningfully faster than its debt service. Window expected to close in late Q3 2026 as financing rates normalize upward.",
      authored_by_external_label: "Margot Desandre (Sector Specialist, Skilled Trades)",
      authored_at: iso("2026-04-10"),
      effective_period_start: iso("2026-04-10"),
      effective_period_end: iso("2026-09-30"), // Window expected to close
      affected_industry_families: [industryFamilies.tradesConstruction.id],
      affected_member_types: [memberTypes.maintenanceServices.id],
      recommended_response:
        "Surface capacity-vs-demand tension during Ask phase. Quantify declined-call value in Size phase. Vehicle/Fleet Loan Track demonstrates payback within the ROI window. Use the fleet ROI projection chart Model during Show phase.",
      evidence_links: [
        "https://blaze-internal.example.com/research/2026-04-10-fleet-roi-window",
        "https://www.federalreserve.gov/data/h15/current/h15.htm",
      ],
      related_topics: [topics.goalFleet.id, topics.blockerCapacity.id],
    },
  });

  // Macro 3 — Specialty manufacturer capital events (affects Specialty manufacturer)
  await prisma.macro.create({
    data: {
      title: "Specialty manufacturer capital event opportunities",
      summary:
        "Specialty manufacturers in the Twin Cities region are reporting elevated rates of anchor-customer-driven capacity expansion conversations. Many of these capital events qualify for owner-occupied CRE financing combined with equipment lending. Members in the $20M-$100M revenue band are most likely to face these decisions in 2026.",
      authored_by_external_label: "Margot Desandre (Sector Specialist, Skilled Trades)",
      authored_at: iso("2026-04-05"),
      effective_period_start: iso("2026-04-05"),
      effective_period_end: null, // Still effective
      affected_industry_families: [industryFamilies.specialtyManufacturing.id],
      affected_member_types: [memberTypes.specialtyManufacturer.id],
      recommended_response:
        "Probe capital event evaluation during Ask phase. Discover the timing driver. CRE specialist introduction (Connect step) is likely the right path. Capital event partnership map Model demonstrates Blaze's coordinated commercial banking capability.",
      evidence_links: [
        "https://blaze-internal.example.com/research/2026-04-05-specialty-mfg-capital-events",
      ],
      related_topics: [
        topics.triggerCapacityEval.id,
        topics.goalCustomerGrowth.id,
      ],
    },
  });
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("Clearing existing rows…");
  await clear();

  console.log("Step 1 — reference data");
  const bankers = await seedBankers();
  const industryFamilies = await seedIndustryFamilies();
  const topics = await seedTopics();
  await seedSizingDimensions();
  const products = await seedProducts();
  const memberTypes = await seedMemberTypes(industryFamilies, topics, products);
  await seedRules(memberTypes, topics);

  console.log("Step 2 — Member identity records");
  const members = await seedMembers(industryFamilies, memberTypes, products, bankers);

  console.log("Step 5 — Artifacts (authored before featured conversations)");
  // Reviewed by Priya Patel — placeholder reviewer. The Compliance reviewer is
  // a distinct role per Data Framework §3.6; for the demo we attach the Growth
  // lead as the reviewer of record since she's the one curating the canonical content.
  const artifacts = await seedArtifacts(bankers.priya.id);

  console.log("Step 4a — Growth steps (templates)");
  const growthSteps = await seedGrowthSteps(memberTypes, topics, artifacts, bankers);

  console.log("Step 4b — Growth tracks");
  const growthTracks = await seedGrowthTracks(memberTypes, topics, growthSteps, bankers);

  console.log("Linking MemberType.default_growth_tracks and Rule.output_growth_tracks");
  await linkMemberTypesAndRulesToTracks(memberTypes, growthTracks);

  // Look up rule IDs once so per-Member seeds can attach Recommendations to the
  // rule that fired.
  const rule1 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface seasonal cash flow track for small caterers" } });
  const rule2 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface fleet financing track for growing trades" } });
  const rule3 = await prisma.rule.findFirstOrThrow({ where: { name: "Surface capital event track for established manufacturers" } });

  console.log("Step 3 + 4c — Conversations (prior + featured) per Member");
  await seedJennyConversations(members, bankers, topics, growthSteps, artifacts, { rule1Id: rule1.id }, products);
  await seedNorthlandConversations(members, bankers, topics, growthSteps, artifacts, { rule2Id: rule2.id }, products);
  await seedCygnusConversations(members, bankers, topics, growthSteps, artifacts, { rule3Id: rule3.id }, products);

  console.log("Step 6 — Derive last_touch_at, active_signal_count, open_action_card_count");
  for (const m of [members.jenny, members.northland, members.cygnus]) {
    await deriveMemberState(m.id);
  }

  console.log("Step 6b — MemberSummarySnapshot for each featured Conversation");
  // Featured Conversations are the most recent per Member, by design (the
  // brief sets the demo "now" anchor at 2026-04-25 with the featured
  // Conversations within the prior month).
  for (const m of [members.jenny, members.northland, members.cygnus]) {
    const featured = await prisma.conversation.findFirstOrThrow({
      where: { member_id: m.id },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });
    await generateMemberSummarySnapshot(m.id, featured.id, NOW);
  }

  console.log("Step 7 — Macros (Sprint 4 §B)");
  await seedMacros(industryFamilies, memberTypes, topics);

  console.log("Step 8 — v2 entities (Sprint 4.7 Block P / B)");
  await seedV2Entities(members, bankers, artifacts);

  console.log("Step 9 — Business Factor Matrix (Sprint 5a.1)");
  await seedBusinessFactorMatrix(prisma);
  await seedFactorCapturesForFixtures(prisma, members, bankers.scott.id);

  console.log("Step 10 — Insight architecture (Sprint 5b.1)");
  await seedInsightPatterns(prisma);
  await seedInsightsForFixtures(prisma, members, bankers.scott.id);

  console.log("Step 11 — ArtifactTemplate seed (Sprint 5d Block B)");
  await seedArtifactTemplates(prisma);
  await migrateCygnusModelToTemplate(prisma);

  console.log("Step 12 — Stage-skip fixture (Sprint 5d Block I)");
  await seedStageSkipFixture({
    prisma,
    bankerId: bankers.scott.id,
    industryFamilyEventDrivenId: industryFamilies.eventDriven.id,
    memberTypeEventServicesId: memberTypes.eventServices.id,
  });
  console.log("  Seeded Riverside Catering (event_services, TRACK-001 stage-skip)");

  console.log("Step 12b — Fixture multi-Track (Sprint 8 Block G)");
  await seedFixtureMultiTrack(prisma);

  console.log("Step 13 — Workflow state recompute (Sprint 5b.2)");
  const wfCount = await recomputeAllWorkflowStates(prisma);
  console.log(`  Workflow state computed for ${wfCount} Members`);

  // Final row counts.
  const counts = {
    bankers: await prisma.banker.count(),
    industryFamilies: await prisma.industryFamily.count(),
    topics: await prisma.topic.count(),
    products: await prisma.product.count(),
    memberTypes: await prisma.memberType.count(),
    rules: await prisma.rule.count(),
    members: await prisma.member.count(),
    artifacts: await prisma.artifact.count(),
    growthSteps: await prisma.growthStep.count(),
    growthTracks: await prisma.growthTrack.count(),
    conversations: await prisma.conversation.count(),
    growthStepExecutions: await prisma.growthStepExecution.count(),
    signals: await prisma.signal.count(),
    actionCards: await prisma.actionCard.count(),
    recommendations: await prisma.recommendation.count(),
    memberSummarySnapshots: await prisma.memberSummarySnapshot.count(),
    macros: await prisma.macro.count(),
    artifactParameterCaptures: await prisma.artifactParameterCapture.count(),
    // Sprint 4.7 v2 entities.
    models: await prisma.model.count(),
    showEvents: await prisma.showEvent.count(),
    reactions: await prisma.reaction.count(),
    // Sprint 5a.1 — business factor matrix.
    businessFactors: await prisma.businessFactor.count(),
    trackTemplates: await prisma.trackTemplate.count(),
    matrixEntries: await prisma.matrixEntry.count(),
    factorCaptures: await prisma.factorCapture.count(),
  };
  console.log("\nRow counts after full seed:");
  console.table(counts);

  console.log("\nSeed complete (Steps 1-6).");
}

// ============================================================
// Sprint 4.7 Block P — v2 entity seeds.
//
// Seeds Model + ShowEvent + Reaction rows for each Member's featured
// conversation, populating the v2 captured-feed with realistic
// banker-built models, artifact-rendering events, and Member-quote
// reactions. Quotes selected from MEMBER_FIXTURE_QUOTE_ENRICHMENT_v1.md
// per Q-P1 resolution; Francisco reviews before EVP demo.
// ============================================================

async function seedV2Entities(
  members: Members,
  bankers: Bankers,
  artifacts: Artifacts,
) {
  // ── Jenny — Apr 8 conversation; LOC sized + seasonal smoothing chart shown ──
  const jennyApr8 = await prisma.conversation.findFirstOrThrow({
    where: { member_id: members.jenny.id, created_at: daysAgo(17) },
    select: { id: true },
  });

  const jennyModel = await prisma.model.create({
    data: {
      member_id: members.jenny.id,
      conversation_id: jennyApr8.id,
      artifact_id: artifacts.seasonalSmoothing.id,
      built_with_member: true,
      parameters: {
        name: "Seasonal cashflow projection",
        rows: [
          { key: "monthly_low", value: "$35,000" },
          { key: "monthly_high", value: "$95,000" },
          { key: "proposed_loc_size", value: "$75,000" },
          { key: "slow_season_months", value: "Jan-Feb" },
        ],
      },
      assumptions: [
        "Customer payment timing stays at 60-day average for top accounts",
        "Slow season runs Jan-Feb with ~$48K aggregate gap",
        "Member draws only during slow months and pays down by April",
      ],
      output_summary:
        "$75K LOC covers the slow-season gap with 30% headroom. Member draws ~$48K in Jan-Feb and pays down by April collections.",
      built_by_banker_id: bankers.scott.id,
      built_at: daysAgo(17),
    },
  });

  const jennyShowEvent = await prisma.showEvent.create({
    data: {
      member_id: members.jenny.id,
      conversation_id: jennyApr8.id,
      artifact_id: artifacts.seasonalSmoothing.id,
      model_id: jennyModel.id,
      shown_by_banker_id: bankers.scott.id,
      context_note: "Walked through during in-person check-in",
      shown_at: daysAgo(17),
    },
  });

  await prisma.reaction.create({
    data: {
      member_id: members.jenny.id,
      conversation_id: jennyApr8.id,
      show_event_id: jennyShowEvent.id,
      response_value: "leaning_yes",
      // Sprint 4.7 Block P — quote enrichment per Q-P1 (Francisco's E4
      // memorability pick: the moment Jenny sees the smoothing logic).
      member_quote:
        "Oh, I see what you're doing — the line just covers the dip. That's actually... yeah, that's helpful to see it laid out.",
      captured_by_banker_id: bankers.scott.id,
      captured_at: daysAgo(17),
    },
  });

  // ── Northland — Apr 15 conversation; fleet ROI projection shown ──
  const northlandApr15 = await prisma.conversation.findFirstOrThrow({
    where: { member_id: members.northland.id, created_at: daysAgo(18) },
    select: { id: true },
  });

  const northlandModel = await prisma.model.create({
    data: {
      member_id: members.northland.id,
      conversation_id: northlandApr15.id,
      artifact_id: artifacts.fleetROI.id,
      built_with_member: true,
      parameters: {
        name: "Fleet expansion ROI projection",
        rows: [
          { key: "current_fleet_size", value: "8 trucks" },
          { key: "proposed_addition", value: "2 trucks" },
          { key: "service_call_avg_value", value: "$700" },
          { key: "financing_term_months", value: "60" },
          { key: "financing_rate_pct", value: "7.5" },
        ],
      },
      assumptions: [
        "Declined service-call backlog stays at current ~70 calls/peak season",
        "Two new trucks each cover 35 additional calls per peak season",
        "Technician hiring keeps pace with truck delivery",
      ],
      output_summary:
        "Two service vehicles at $90K each, financed over 60 months at $3.6K/month — well below the $49K of declined work per peak season.",
      built_by_banker_id: bankers.scott.id,
      built_at: daysAgo(18),
    },
  });

  const northlandShowEvent = await prisma.showEvent.create({
    data: {
      member_id: members.northland.id,
      conversation_id: northlandApr15.id,
      artifact_id: artifacts.fleetROI.id,
      model_id: northlandModel.id,
      shown_by_banker_id: bankers.scott.id,
      context_note: "Walked through ROI breakeven and cumulative gain",
      shown_at: daysAgo(18),
    },
  });

  await prisma.reaction.create({
    data: {
      member_id: members.northland.id,
      conversation_id: northlandApr15.id,
      show_event_id: northlandShowEvent.id,
      response_value: "engaged",
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      member_quote: "Okay, the math holds. I see how the volume covers the payment.",
      captured_by_banker_id: bankers.scott.id,
      captured_at: daysAgo(18),
    },
  });

  // ── Cygnus — Apr 21 conversation; capital event partnership map shown ──
  const cygnusApr21 = await prisma.conversation.findFirstOrThrow({
    where: { member_id: members.cygnus.id, created_at: daysAgo(7) },
    select: { id: true },
  });

  const cygnusModel = await prisma.model.create({
    data: {
      member_id: members.cygnus.id,
      conversation_id: cygnusApr21.id,
      artifact_id: artifacts.capitalEventMap.id,
      built_with_member: true,
      parameters: {
        name: "Capital event partnership map",
        rows: [
          { key: "company_revenue_band", value: "$25M-$50M" },
          { key: "expansion_size_estimate", value: "$4M-$7M" },
          { key: "current_blaze_relationships", value: "Treasury, LOC" },
          { key: "specialist_coordination", value: "SBA specialist + CDC partner" },
        ],
      },
      assumptions: [
        "Anchor customer volume commitments hold at 15-25% growth over 18 months",
        "Capacity expansion lands at $4-7M including facility, equipment qualification, validation",
        "Board calendar requires three financing scenarios before September meeting",
      ],
      // Sprint 6 Block C — output summary aligned with SBA 504 narrative
      // (Cygnus's primary Track per Sprint 5c v3 addendum).
      output_summary:
        "Pathway from initial conversation to closing with milestone calendar. SBA specialist + CDC partner engaged; relationship coordination by Scott.",
      built_by_banker_id: bankers.scott.id,
      built_at: daysAgo(7),
    },
  });

  const cygnusShowEvent = await prisma.showEvent.create({
    data: {
      member_id: members.cygnus.id,
      conversation_id: cygnusApr21.id,
      artifact_id: artifacts.capitalEventMap.id,
      model_id: cygnusModel.id,
      shown_by_banker_id: bankers.scott.id,
      context_note: "Walked Margaret + Robert through the pathway",
      shown_at: daysAgo(7),
    },
  });

  await prisma.reaction.create({
    data: {
      member_id: members.cygnus.id,
      conversation_id: cygnusApr21.id,
      show_event_id: cygnusShowEvent.id,
      response_value: "engaged",
      // Sprint 4.7 Block P — quote enrichment per Q-P1.
      member_quote:
        "Yes, please. The sooner the better. Have him reach out directly to Robert and me.",
      captured_by_banker_id: bankers.scott.id,
      captured_at: daysAgo(7),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
