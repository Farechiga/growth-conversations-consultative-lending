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
  await prisma.memberSummarySnapshot.deleteMany();
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
        "Compares twelve months of business cash flow with and without a working capital line of credit, parameterized by the member's own revenue band and seasonal pattern. Designed to make the seasonal smoothing benefit visually obvious without claiming any specific outcome. The reframe: a properly-sized LOC turns lumpy revenue into smooth cash flow, at a cost typically far below the cost of declined opportunities or stress-driven decisions during slow months.",
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
        "Compares 3 years of projected cash position under two paths: continuing to buy used vehicles with cash, versus financing two new vehicles to expand dispatch capacity. Shows captured-vs-declined revenue as a stacked overlay. The reframe is that revenue captured from previously-declined service calls outweighs the debt service cost of the financing — typically by year 2.",
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
      title: "Capital event partnership map",
      description:
        "A relationship map showing the banking products and specialist roles involved in a capital expansion event for an established commercial customer. Used in the moment to demonstrate Blaze's coordinated commercial banking capability — the reframe is that the capital event is not a single loan request but a coordinated multi-product engagement, and Blaze has the specialists to handle it. Designed for use with Specialty Manufacturer · Established and adjacent established Member Types.",
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
  required: ["artifact_id", "parameters_used", "member_reaction", "shared_afterward"],
  properties: {
    artifact_id: { type: "string" },
    parameters_used: { type: "object" },
    member_reaction: { type: "string", enum: ["engaged", "skeptical", "already_knew", "confused", "missed_it"] },
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
      target_member_types: { connect: [{ id: memberTypes.smallCatererStarting.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.smallCatererStarting.id }] },
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
        "Render the Seasonal cash flow smoothing chart Artifact parameterized to the member's revenue band and seasonal pattern. The visual makes the smoothing benefit of a properly-sized LOC obvious. Captures member reaction and any follow-up questions for downstream pattern matching.",
      step_shape: "show",
      content:
        "I want to show you what your year would look like with a working capital line of credit sized for your business — let's walk through it together.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.seasonalSmoothing.id,
      target_member_types: { connect: [{ id: memberTypes.smallCatererStarting.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.smallCatererStarting.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.hvacGrowing.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.hvacGrowing.id }] },
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
        "Render the Fleet expansion ROI projection Artifact parameterized to the member's current fleet, average call value, and proposed addition. The composed chart shows captured-vs-declined revenue against debt service, demonstrating that fleet financing typically pays for itself by year 2 in growing trades.",
      step_shape: "show",
      content:
        "Let me show you what financing two more trucks would look like against the work you've been turning down. This isn't a pitch; it's the math.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.fleetROI.id,
      target_member_types: { connect: [{ id: memberTypes.hvacGrowing.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.hvacGrowing.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturerEstablished.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturerEstablished.id }] },
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
        "Render the Capital event partnership map Artifact, showing the products and specialist roles that come together in a coordinated capital event. The reframe is that the capital event is a multi-product engagement Blaze can deliver, not a single CRE loan request — earning the right to be at the table before any RFP starts.",
      step_shape: "show",
      content:
        "Let me show you how a deal like this typically comes together at Blaze, so you can see what we'd actually bring to the table — products, specialists, timing.",
      capture_schema: SHOW_CAPTURE_SCHEMA,
      artifact_id: artifacts.capitalEventMap.id,
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturerEstablished.id }] },
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
      target_member_types: { connect: [{ id: memberTypes.specialtyManufacturerEstablished.id }] },
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
      target_member_type: { connect: { id: memberTypes.smallCatererStarting.id } },
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
      target_member_type: { connect: { id: memberTypes.hvacGrowing.id } },
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
      target_member_type: { connect: { id: memberTypes.specialtyManufacturerEstablished.id } },
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
    where: { id: memberTypes.smallCatererStarting.id },
    data: { default_growth_tracks: { connect: [{ id: growthTracks.seasonalCashFlow.id }] } },
  });
  await prisma.memberType.update({
    where: { id: memberTypes.hvacGrowing.id },
    data: { default_growth_tracks: { connect: [{ id: growthTracks.fleetFinancing.id }] } },
  });
  await prisma.memberType.update({
    where: { id: memberTypes.specialtyManufacturerEstablished.id },
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
      created_at: iso("2024-03-12"),
      closed_at: iso("2024-03-12"),
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
      captured_at: iso("2024-03-12"),
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
      created_at: iso("2025-12-04"),
      closed_at: iso("2025-12-04"),
    },
  });

  await prisma.signal.create({
    data: {
      conversation_id: dec2025.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerReceivables.id,
      severity: "manageable",
      their_words: "they keep slipping past 30 days and I have to keep pinging them",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2025-12-04"),
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
      created_at: iso("2026-04-08"),
      closed_at: iso("2026-04-08"),
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
        their_words: "this corporate client paying late really hit us, and our slow months are tough as it is",
        recency: "acute_recent",
        confidence: "member_stated",
      },
      executed_at: iso("2026-04-08"),
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
      their_words: "this corporate client paying late really hit us, and our slow months are tough as it is",
      recency: "acute_recent",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2026-04-08"),
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
      executed_at: iso("2026-04-08"),
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
        member_reaction: "engaged",
        followup_questions_asked: ["size", "rate", "flexibility"],
        shared_afterward: true,
        their_words: "this is exactly what I needed to see — wow",
      },
      executed_at: iso("2026-04-08"),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.workingCapitalLOC.id,
      size_proposed: 75000,
      structure: "standard",
      rationale_text:
        "Member showed acute seasonal cash flow stress quantified at approximately $12K per quarter, against a long-running goal of smoothing lumpy cash flow into manageable shape. A $75K LOC sized at roughly one quarter of the slow-season revenue gap provides smoothing capacity with comfortable headroom. Member's existing Visa demonstrates payment discipline; primary guarantee from the owner is appropriate given the size.",
      confidence_band: "high",
      response: "leaning_yes",
      primary_concern: "spouse",
      status: "surfaced",
      rule_id_that_fired: rules.rule1Id,
      responds_to_signals: {
        connect: [
          { id: seasonalSignal.id },
          { id: jennyCashFlowSmoothingGoalSignal.id },
        ],
      },
      their_words: "this is exactly what I needed to see — wow",
      created_at: iso("2026-04-08"),
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
      executed_at: iso("2026-04-08"),
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
      their_words: "I want to talk to my husband before we commit to anything this size",
      recency: "acute_recent",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2026-04-08"),
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
      due_at: iso("2026-04-22"),
      status: "open",
      status_changed_at: iso("2026-04-08"),
      created_at: iso("2026-04-08"),
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
      created_at: iso("2025-02-22"),
      closed_at: iso("2025-02-22"),
    },
  });

  const northlandFleetGoalSignal = await prisma.signal.create({
    data: {
      conversation_id: feb2025.id,
      member_id: m.id,
      type: "goal",
      topic_id: topics.goalFleet.id,
      severity: "manageable",
      their_words: "we're going to need another truck before next summer",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2025-02-22"),
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
      created_at: iso("2026-04-15"),
      closed_at: iso("2026-04-15"),
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
        their_words: "we just couldn't get to all the calls last summer — felt awful turning people away",
        recency: "ongoing",
        confidence: "member_stated",
      },
      executed_at: iso("2026-04-15"),
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
      their_words: "we just couldn't get to all the calls last summer — felt awful turning people away",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2026-04-15"),
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
      executed_at: iso("2026-04-15"),
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
        member_reaction: "engaged",
        followup_questions_asked: ["structure_options", "rate", "speed_of_approval"],
        shared_afterward: true,
        their_words: "I've been doing this all wrong — paying cash for used trucks while declining work",
      },
      executed_at: iso("2026-04-15"),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.fleetLoan.id,
      size_proposed: 180000,
      structure: "standard",
      rationale_text:
        "Member showed capacity constraint quantified at approximately 70 declined service calls per peak season (roughly $49K of annual lost revenue), against a stated objective of fleet expansion. Two new service vehicles at approximately $90K each, financed over 60 months at current rates, produce monthly debt service of approximately $3,600 — well below the lost revenue from declined calls. Member's existing Equipment Loan demonstrates payment discipline.",
      confidence_band: "high",
      response: "leaning_yes",
      primary_concern: "cpa",
      status: "surfaced",
      rule_id_that_fired: rules.rule2Id,
      their_words: "I've been doing this all wrong — paying cash for used trucks while declining work",
      created_at: iso("2026-04-15"),
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
        member_stated_reason: "I need to run the numbers by my accountant before I commit to something this size",
      },
      executed_at: iso("2026-04-15"),
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
      their_words: "I need to run the numbers by my accountant before I commit to something this size",
      recency: "acute_recent",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2026-04-15"),
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
      due_at: iso("2026-04-29"),
      status: "open",
      status_changed_at: iso("2026-04-15"),
      created_at: iso("2026-04-15"),
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
      created_at: iso("2024-11-15"),
      closed_at: iso("2024-11-15"),
    },
  });

  const cygnusCustomerGrowthGoalSignal = await prisma.signal.create({
    data: {
      conversation_id: nov2024.id,
      member_id: m.id,
      type: "goal",
      topic_id: topics.goalCustomerGrowth.id,
      severity: "manageable",
      their_words: "two of our customers are signaling we should plan for more volume next year",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2024-11-15"),
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
      created_at: iso("2025-06-22"),
      closed_at: iso("2025-06-22"),
    },
  });

  await prisma.signal.create({
    data: {
      conversation_id: jun2025.id,
      member_id: m.id,
      type: "blocker",
      topic_id: topics.blockerConcentration.id,
      severity: "manageable",
      their_words: "three customers are getting really big as a share of our book",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2025-06-22"),
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
      created_at: iso("2026-04-21"),
      closed_at: iso("2026-04-21"),
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
      executed_at: iso("2026-04-21"),
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
      captured_at: iso("2026-04-21"),
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
        their_words:
          "three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source",
        recency: "ongoing",
        confidence: "member_stated",
      },
      executed_at: iso("2026-04-21"),
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
      their_words:
        "three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source",
      recency: "ongoing",
      confidence: "member_stated",
      active: true,
      captured_at: iso("2026-04-21"),
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
        member_reaction: "engaged",
        followup_questions_asked: ["timeline_for_decision", "blaze_capacity_for_deal_size", "marcus_webb_background"],
        shared_afterward: false,
        their_words: "this is the conversation I've been wanting to have with you",
      },
      executed_at: iso("2026-04-21"),
    },
  });

  await prisma.recommendation.create({
    data: {
      member_id: m.id,
      growth_step_execution_id: showExec.id,
      product_id: products.creTermLoan.id,
      size_proposed: null,
      structure: "standard",
      rationale_text:
        "Member is evaluating a major capacity expansion driven by anchor customer volume growth commitments and a long-running customer-growth objective. Current capacity at ~85% utilization on primary production line; expansion estimated at $4M-$7M including facility, equipment qualification, and validation. Member explicitly receptive to Blaze handling the deal. CRE specialist Marcus Webb engaged; relationship coordination by Scott Brynjolffson.",
      confidence_band: "medium",
      response: "leaning_yes",
      primary_concern: "bank_capability",
      status: "surfaced",
      rule_id_that_fired: rules.rule3Id,
      their_words: "this is the conversation I've been wanting to have with you",
      created_at: iso("2026-04-21"),
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
      executed_at: iso("2026-04-21"),
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
      due_at: iso("2026-04-26"),
      status: "open",
      status_changed_at: iso("2026-04-21"),
      created_at: iso("2026-04-21"),
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
      status_changed_at: iso("2026-04-21"),
      created_at: iso("2026-04-21"),
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
        where: { status: { in: ["surfaced"] } },
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
// Main
// ============================================================

async function main() {
  console.log("Clearing existing rows…");
  await clear();

  console.log("Step 1 — reference data");
  const bankers = await seedBankers();
  const industryFamilies = await seedIndustryFamilies();
  const topics = await seedTopics();
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
  };
  console.log("\nRow counts after full seed:");
  console.table(counts);

  console.log("\nSeed complete (Steps 1-6).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
