/*
 * Blaze Member Signals — fixture seed.
 *
 * Authoring sequence per docs/design/MEMBER_FIXTURE_BRIEF.md §7.1:
 *   1. Reference data first   ← this file (step 1)
 *   2. Member identity records ← this file (step 2)
 *   3. Conversation history (low-fidelity) ← deferred
 *   4. Featured conversations + Growth step executions ← deferred
 *   5. Artifacts ← deferred
 *   6. Derived state verification ← deferred
 *
 * Stops at step 2. Re-running this script is safe — it deletes existing rows in
 * foreign-key-safe order before re-inserting.
 *
 * Demo "now" anchor: 2026-04-25 (per brief §1.1).
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

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

// ============================================================
// Step 0 — Clear existing data (idempotent)
// ============================================================

async function clear() {
  // Delete in FK-safe order: leaf tables first, root tables last.
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
      display_name: "Fleet expansion",
      description:
        "Member intends to add vehicles or expand fleet capacity, typically driven by service-area expansion, capacity constraints, or modernization needs.",
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
      display_name: "Customer base growth",
      description:
        "Member has indicated intent to grow their customer base, either by adding new customers or deepening existing ones. Often surfaces in routine relationship conversations as forward-looking commentary.",
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
    indecisionAuthority,
    indecisionInformation,
    indecisionOutcome,
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
  const smallCatererStarting = await prisma.memberType.create({
    data: {
      name: "Small Caterer · Starting",
      description:
        "Small event-driven catering businesses in their first three years of operations, typically with one to ten employees and revenue under $1.5M. These members face lumpy event-based revenue, perishable inventory risk, surge labor needs, and chronic working capital strain during slow seasons. They are typically owner-operated with the principal personally guaranteeing most credit decisions.",
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

  const hvacGrowing = await prisma.memberType.create({
    data: {
      name: "HVAC & Trades · Growing",
      description:
        "Established residential and light-commercial trade businesses (HVAC, electrical, plumbing) in their 8th-15th year of operations, with 10-30 employees and revenue between $2M and $10M. These members have proven their model and are at the inflection point where growth requires capital — fleet expansion, additional crews, equipment upgrades, sometimes second locations. Cash flow is steady and seasonal, but capital expenditure financing is the dominant capital question. Owner-operated with strong relationships in their service area; growth is constrained more by execution capacity than by demand.",
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

  const specialtyManufacturerEstablished = await prisma.memberType.create({
    data: {
      name: "Specialty Manufacturer · Established",
      description:
        "Established specialty manufacturers (precision components, contract manufacturing, specialty chemicals, medical device subassemblies) typically 15-30 years old, with 50-200 employees and revenue between $15M and $80M. These members serve concentrated B2B customer bases — often Fortune 500 or large mid-market — under multi-year contracts. Cash flow is steady but capital-intensive; growth requires periodic large capital events for facility expansion, equipment qualification, or capacity additions. Owner-operated or owner-led, often with a small leadership team and a CFO. Banking needs are sophisticated: treasury, FX in some cases, term financing, and commercial real estate. The competition for these relationships is regional and national commercial banks, not credit unions; Blaze wins these by combining deep-relationship attentiveness with sophisticated commercial banking capability.",
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

  return { smallCatererStarting, hvacGrowing, specialtyManufacturerEstablished };
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
            params: { member_type_id: memberTypes.smallCatererStarting.id },
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
            params: { member_type_id: memberTypes.hvacGrowing.id },
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
            params: { member_type_id: memberTypes.specialtyManufacturerEstablished.id },
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
      legal_name: "Jenny's Catering LLC",
      doing_business_as: "Jenny's Catering",
      industry_family_id: industryFamilies.eventDriven.id,
      stage: "starting",
      size_band: "small",
      member_type_id: memberTypes.smallCatererStarting.id,
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
    },
  });

  // Northland Heating & Cooling — products held: Business Checking, Business Visa, Equipment Loan
  const northland = await prisma.member.create({
    data: {
      legal_name: "Northland Heating & Cooling Inc.",
      doing_business_as: "Northland HVAC",
      industry_family_id: industryFamilies.tradesConstruction.id,
      stage: "growing",
      size_band: "mid",
      member_type_id: memberTypes.hvacGrowing.id,
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
    },
  });

  // Cygnus Bioscience — products held: Business Checking + Treasury, Commercial Credit Card, Working Capital LOC
  const cygnus = await prisma.member.create({
    data: {
      legal_name: "Cygnus Bioscience Inc.",
      doing_business_as: "Cygnus Bioscience",
      industry_family_id: industryFamilies.specialtyManufacturing.id,
      stage: "established",
      size_band: "mid",
      member_type_id: memberTypes.specialtyManufacturerEstablished.id,
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
    },
  });

  return { jenny, northland, cygnus };
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("Clearing existing rows…");
  await clear();

  console.log("Step 1 — reference data");
  console.log("  bankers");
  const bankers = await seedBankers();
  console.log("  industry families");
  const industryFamilies = await seedIndustryFamilies();
  console.log("  topics");
  const topics = await seedTopics();
  console.log("  products");
  const products = await seedProducts();
  console.log("  member types");
  const memberTypes = await seedMemberTypes(industryFamilies, topics, products);
  console.log("  rules");
  await seedRules(memberTypes, topics);

  console.log("Step 2 — Member identity records");
  const members = await seedMembers(industryFamilies, memberTypes, products, bankers);

  // Quick sanity-print so checkpoint review can eyeball counts.
  const counts = {
    bankers: await prisma.banker.count(),
    industryFamilies: await prisma.industryFamily.count(),
    topics: await prisma.topic.count(),
    products: await prisma.product.count(),
    memberTypes: await prisma.memberType.count(),
    rules: await prisma.rule.count(),
    members: await prisma.member.count(),
  };
  console.log("\nRow counts after seed:");
  console.table(counts);

  console.log(`\nMembers seeded:`);
  console.log(`  ${members.jenny.legal_name} (${members.jenny.id})`);
  console.log(`  ${members.northland.legal_name} (${members.northland.id})`);
  console.log(`  ${members.cygnus.legal_name} (${members.cygnus.id})`);

  console.log("\nSeed complete (Steps 1-2). Next: prior conversation history (step 3) and featured conversations (step 4).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
