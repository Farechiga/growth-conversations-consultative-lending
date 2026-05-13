/*
 * Sprint 7a Block A — synthetic dataset generator.
 *
 * Deterministic given seed. Produces all data specified in
 * SYNTHETIC_DATA_stage{1..5}.md. Single entry point:
 * `getSyntheticDataset()` — cached for the process lifetime.
 *
 * Persistence choice (per spec A.4): in-memory cache. Generator runs
 * once at first import, output frozen for the process. Existing 4
 * detailed fixtures (Jenny, Northland, Cygnus, Riverside) stay in
 * Prisma. The dashboard imports the cached SyntheticDataset for
 * aggregate views; Member-level pages continue to query Prisma.
 *
 * Documented in BUILD_LOG.md Sprint 7a entry.
 */

import { BANKERS, BRANCHES } from "./branches-bankers";
import { createRng } from "./prng";
import {
  BLAZE_OFFERED_TRACKS,
  type AggregateMetrics,
  type Banker,
  type BankerDailyActivity,
  type BankerMetrics,
  type Branch,
  type BranchMetrics,
  type CaptureDensityTier,
  type ClosedDeal,
  type DailyActivity,
  type FeaturedDealNarrative,
  type FeaturedTemporalEvent,
  type MemberType,
  type MemberTypeMetrics,
  type Phase,
  type SyntheticDataset,
  type SyntheticMember,
  type TrackId,
  TRACK_LABELS,
  TRACK_STICKINESS,
} from "./types";

const DEFAULT_SEED = 42;

// ────────────────────────────────────────────────
// Stage 2 — Members
// ────────────────────────────────────────────────

const MEMBER_TYPE_TARGETS: Record<MemberType, number> = {
  event_services: 24,
  maintenance_services: 36,
  specialty_manufacturer: 20,
  professional_services: 28,
  healthcare_services: 22,
  food_services: 26,
  retail: 24,
  construction: 20,
};

// Per Stage 2 §4.3 explicit Member-Type × Track matrix.
const MEMBER_TYPE_TRACK_MATRIX: Record<MemberType, Record<TrackId, number>> = {
  event_services: {
    "TRACK-001": 6,
    "TRACK-002": 3,
    "TRACK-003": 1,
    "TRACK-004": 2,
    "TRACK-006": 0,
    "TRACK-007": 2,
    "TRACK-008": 0,
    "TRACK-009": 0,
    "TRACK-010": 6,
    "TRACK-011": 4,
  },
  maintenance_services: {
    "TRACK-001": 2,
    "TRACK-002": 12,
    "TRACK-003": 2,
    "TRACK-004": 5,
    "TRACK-006": 1,
    "TRACK-007": 9,
    "TRACK-008": 0,
    "TRACK-009": 1,
    "TRACK-010": 2,
    "TRACK-011": 2,
  },
  specialty_manufacturer: {
    "TRACK-001": 0,
    "TRACK-002": 0,
    "TRACK-003": 4,
    "TRACK-004": 1,
    "TRACK-006": 0,
    "TRACK-007": 4,
    "TRACK-008": 9,
    "TRACK-009": 1,
    "TRACK-010": 1,
    "TRACK-011": 0,
  },
  professional_services: {
    "TRACK-001": 4,
    "TRACK-002": 1,
    "TRACK-003": 8,
    "TRACK-004": 1,
    "TRACK-006": 6,
    "TRACK-007": 1,
    "TRACK-008": 1,
    "TRACK-009": 1,
    "TRACK-010": 4,
    "TRACK-011": 1,
  },
  healthcare_services: {
    "TRACK-001": 1,
    "TRACK-002": 1,
    "TRACK-003": 6,
    "TRACK-004": 1,
    "TRACK-006": 2,
    "TRACK-007": 5,
    "TRACK-008": 5,
    "TRACK-009": 0,
    "TRACK-010": 1,
    "TRACK-011": 0,
  },
  food_services: {
    "TRACK-001": 5,
    "TRACK-002": 1,
    "TRACK-003": 5,
    "TRACK-004": 1,
    "TRACK-006": 0,
    "TRACK-007": 7,
    "TRACK-008": 3,
    "TRACK-009": 1,
    "TRACK-010": 1,
    "TRACK-011": 2,
  },
  retail: {
    "TRACK-001": 3,
    "TRACK-002": 1,
    "TRACK-003": 6,
    "TRACK-004": 1,
    "TRACK-006": 5,
    "TRACK-007": 1,
    "TRACK-008": 2,
    "TRACK-009": 1,
    "TRACK-010": 4,
    "TRACK-011": 0,
  },
  construction: {
    "TRACK-001": 1,
    "TRACK-002": 9,
    "TRACK-003": 4,
    "TRACK-004": 4,
    "TRACK-006": 4,
    "TRACK-007": 3,
    "TRACK-008": 4,
    "TRACK-009": 1,
    "TRACK-010": 3,
    "TRACK-011": 7,
  },
};

// Per Stage 2 §5.1 size ranges. [min, median, max]
const TRACK_SIZE_RANGES: Record<TrackId, [number, number, number]> = {
  "TRACK-001": [25_000, 75_000, 250_000],
  "TRACK-002": [35_000, 125_000, 400_000],
  "TRACK-003": [250_000, 1_200_000, 5_000_000],
  "TRACK-004": [100_000, 500_000, 2_000_000],
  "TRACK-006": [150_000, 325_000, 750_000],
  "TRACK-007": [50_000, 200_000, 850_000],
  "TRACK-008": [1_000_000, 3_000_000, 8_000_000],
  "TRACK-009": [40_000, 150_000, 500_000],
  "TRACK-010": [5_000, 20_000, 75_000],
  "TRACK-011": [5_000, 15_000, 25_000],
};

// Per Stage 2 §3.2 days-in-phase medians; ranges from §3.2.
const PHASE_DAYS_RANGE: Record<Phase, [number, number, number]> = {
  discover: [5, 20, 45],
  measure: [10, 28, 60],
  consult: [14, 35, 75],
  navigate: [20, 60, 150],
};

const PHASE_DISTRIBUTION: Array<[Phase, number]> = [
  ["discover", 0.4],
  ["measure", 0.3],
  ["consult", 0.17],
  ["navigate", 0.13],
];

const PHASE_WEIGHTS: Record<Phase, number> = {
  discover: 0.1,
  measure: 0.35,
  consult: 0.6,
  navigate: 0.85,
};

// Per Stage 2 §2.1 per-branch Member counts (synthetic only — 216
// after subtracting 4 fixture Members assigned to BRANCH-001 via Scott).
const PER_BRANCH_MEMBER_COUNT: Record<string, number> = {
  "BRANCH-001": 20, // 24 total — 4 fixtures
  "BRANCH-002": 24,
  "BRANCH-003": 16,
  "BRANCH-004": 22,
  "BRANCH-005": 20,
  "BRANCH-006": 6,
  "BRANCH-007": 5,
  "BRANCH-008": 7,
  "BRANCH-009": 8,
  "BRANCH-010": 5,
  "BRANCH-011": 7,
  "BRANCH-012": 4,
  "BRANCH-013": 8,
  "BRANCH-014": 6,
  "BRANCH-015": 4,
  "BRANCH-016": 5,
  "BRANCH-017": 6,
  "BRANCH-018": 3,
  "BRANCH-019": 8,
  "BRANCH-020": 4,
  "BRANCH-021": 8,
  "BRANCH-022": 3,
  "BRANCH-023": 1,
  "BRANCH-024": 1,
  "BRANCH-025": 1,
  "BRANCH-026": 2,
  "BRANCH-027": 3,
  "BRANCH-028": 9,
};

// Banker → primary set of branches they cover.
function bankerBranches(b: Banker): string[] {
  return [b.primary_branch_id, ...b.additional_branch_ids];
}

// Pick a banker for a given branch.
function bankerForBranch(branchId: string): Banker {
  const explicit = BANKERS.find((b) =>
    bankerBranches(b).includes(branchId),
  );
  if (explicit) return explicit;
  // BRANCH-012 / 015 / 016 / 018 / 020 / 023 / 024 / 025 — "varies"
  // per Stage 2 §2.1. Round-robin among general-activity bankers.
  const generals = BANKERS.filter((b) => b.specialty === "general");
  const idx = branchId.charCodeAt(branchId.length - 1) % generals.length;
  return generals[idx]!;
}

const NAME_WORDS: Record<MemberType, { prefixes: string[]; suffixes: string[] }> = {
  event_services: {
    prefixes: ["Lakeside", "Twin Cities", "Aurora", "North Star", "Headwaters", "Boundary Waters", "Loon Lake", "Pinewood"],
    suffixes: ["Catering Co.", "Wedding & Event", "Banquet Hall", "Event Group", "Gathering Co.", "Celebrations"],
  },
  maintenance_services: {
    prefixes: ["Premier", "Frostbreak", "True North", "Headwaters", "Twin Cities", "Loon Lake", "Aurora"],
    suffixes: ["HVAC", "Plumbing Solutions", "Mechanical", "Landscaping", "Service Group", "Trades Co."],
  },
  specialty_manufacturer: {
    prefixes: ["Headwaters", "Ironwood", "Mille Lacs", "Aurora", "North Star"],
    suffixes: ["Precision", "Industrial", "Manufacturing", "Fabrication", "Production Co."],
  },
  professional_services: {
    prefixes: ["Brynjolffson", "Lakeshore", "Skyline", "Citizens", "Headwaters"],
    suffixes: ["& Associates", "Accounting Group", "Engineering Partners", "Tax Advisory", "Legal Group"],
  },
  healthcare_services: {
    prefixes: ["Mississippi", "Northgate", "Riverside", "Lake Country", "Citizens"],
    suffixes: ["Family Dental", "Veterinary Clinic", "Physical Therapy", "Medical Group", "Healthcare"],
  },
  food_services: {
    prefixes: ["Kingfield", "Selby Avenue", "Boundary Waters", "North Loop", "Como"],
    suffixes: ["Bistro", "Bakery", "Brewery", "Coffee Co.", "Provisions"],
  },
  retail: {
    prefixes: ["Como", "Northeast", "Highland", "Lakeland", "Boundary Waters"],
    suffixes: ["Specialty Goods", "Apparel", "Outdoor Outfitters", "Provisions", "Mercantile"],
  },
  construction: {
    prefixes: ["True North", "Foundation First", "Pinewood", "Hennepin Heritage", "North Star"],
    suffixes: ["Builders", "Construction", "Homes", "Heritage Construction", "Contractors"],
  },
};

function generateMemberName(
  type: MemberType,
  index: number,
  taken: Set<string>,
  rng: ReturnType<typeof createRng>,
): string {
  const bank = NAME_WORDS[type];
  for (let tries = 0; tries < 12; tries++) {
    const prefix = rng.pick(bank.prefixes);
    const suffix = rng.pick(bank.suffixes);
    const candidate = `${prefix} ${suffix}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
  // Fallback: append Roman numeral.
  const numerals = ["II", "III", "IV", "V"];
  const prefix = bank.prefixes[index % bank.prefixes.length]!;
  const suffix = bank.suffixes[index % bank.suffixes.length]!;
  const candidate = `${prefix} ${suffix} ${numerals[index % numerals.length]}`;
  taken.add(candidate);
  return candidate;
}

function generateMembers(rng: ReturnType<typeof createRng>): SyntheticMember[] {
  const members: SyntheticMember[] = [];
  const usedNames = new Set<string>(["Jenny's Catering", "Northland HVAC", "Cygnus Bioscience", "Riverside Catering"]);

  // For each (Member-Type, Track) cell, generate cell-value Members.
  let memberIdx = 0;
  const typeOrder: MemberType[] = [
    "event_services",
    "maintenance_services",
    "specialty_manufacturer",
    "professional_services",
    "healthcare_services",
    "food_services",
    "retail",
    "construction",
  ];

  // Per-branch capacity tracker (decrement as Members assigned).
  const branchCapacity: Record<string, number> = { ...PER_BRANCH_MEMBER_COUNT };

  for (const type of typeOrder) {
    const trackMatrix = MEMBER_TYPE_TRACK_MATRIX[type];
    for (const [trackId, cellCount] of Object.entries(trackMatrix) as Array<[
      TrackId,
      number,
    ]>) {
      for (let n = 0; n < cellCount; n++) {
        memberIdx += 1;
        const id = `MEMBER-${memberIdx.toString().padStart(3, "0")}`;
        const name = generateMemberName(type, memberIdx, usedNames, rng);

        // Pick a branch with remaining capacity, biased by tier toward
        // Member-Type-appropriate locations. Simple approach: pick any
        // branch with capacity > 0.
        const available = BRANCHES.filter((b) => (branchCapacity[b.id] ?? 0) > 0);
        if (available.length === 0) {
          // Shouldn't happen given counts; safety fallback.
          continue;
        }
        const branch = rng.pick(available);
        branchCapacity[branch.id]! -= 1;
        const banker = bankerForBranch(branch.id);

        // Geographic clustering: ±0.07 lat / ±0.1 lng radius (~5 miles).
        const latJitter = rng.nextFloat(-0.07, 0.07);
        const lngJitter = rng.nextFloat(-0.1, 0.1);

        // Phase
        const phase = rng.weightedPick(
          PHASE_DISTRIBUTION.map(([p]) => p),
          PHASE_DISTRIBUTION.map(([, w]) => w),
        );
        const [minD, , maxD] = PHASE_DAYS_RANGE[phase];
        const daysInPhase = rng.nextInt(minD, maxD);

        // Sized opportunity — cluster around median with modest jitter
        // so the aggregate pipeline value lands close to Stage 5 §1.1
        // target ($142M = sum of median × member_count per Track).
        const [minS, medS, maxS] = TRACK_SIZE_RANGES[trackId];
        const sizeJitter = rng.nextFloat(0.82, 1.18);
        let sized = medS * sizeJitter;
        if (sized < minS) sized = minS;
        if (sized > maxS) sized = maxS;
        sized = Math.round(sized / 5000) * 5000;

        // last_touch_at distribution per Stage 2 §9.
        // 35% <7d, 40% 7-30d, 18% 30-60d, 5% 60-90d, 2% 90+d.
        const tu = rng.next();
        let lastTouchDaysAgo: number;
        if (tu < 0.35) lastTouchDaysAgo = rng.nextInt(0, 6);
        else if (tu < 0.75) lastTouchDaysAgo = rng.nextInt(7, 30);
        else if (tu < 0.93) lastTouchDaysAgo = rng.nextInt(30, 60);
        else if (tu < 0.98) lastTouchDaysAgo = rng.nextInt(60, 90);
        else lastTouchDaysAgo = rng.nextInt(90, 180);
        const lastTouchAt = new Date(Date.now() - lastTouchDaysAgo * 86_400_000);

        // Capture density tier per Stage 2 §8.1.
        const td = rng.next();
        let densityTier: CaptureDensityTier;
        let captureCount: number;
        if (td < 0.3) {
          densityTier = "little";
          captureCount = rng.nextInt(0, 2);
        } else if (td < 0.8) {
          densityTier = "some";
          captureCount = rng.nextInt(3, 6);
        } else {
          densityTier = "lot";
          captureCount = rng.nextInt(7, 14);
        }

        // Open thread count + pending actions
        const openThreadCount = rng.next() < 0.25 ? rng.nextInt(1, 3) : 0;
        const pendingActionCardCount = rng.next() < 0.4 ? rng.nextInt(1, 2) : 0;
        const isStageSkipping = rng.next() < 0.035; // ~3.5%

        members.push({
          id,
          name,
          member_type: type,
          banker_id: banker.id,
          branch_id: branch.id,
          latitude: branch.latitude + latJitter,
          longitude: branch.longitude + lngJitter,
          current_phase: phase,
          current_track_id: trackId,
          days_in_current_phase: daysInPhase,
          is_stage_skipping: isStageSkipping,
          sized_opportunity_amount: sized,
          last_touch_at: lastTouchAt,
          capture_count: captureCount,
          open_thread_count: openThreadCount,
          pending_action_card_count: pendingActionCardCount,
          capture_density_tier: densityTier,
        });
      }
    }
  }

  return members;
}

// ────────────────────────────────────────────────
// Stage 3 — Closed deals
// ────────────────────────────────────────────────

// Per Stage 3 §2.1 closures per Track.
const TRACK_CLOSURE_COUNTS: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 14,
  "TRACK-003": 16,
  "TRACK-004": 0,
  "TRACK-006": 9,
  "TRACK-007": 20,
  "TRACK-008": 12,
  "TRACK-009": 4,
  "TRACK-010": 18,
  "TRACK-011": 7,
};

// Per Stage 3 §2.1 avg days from Discover to close.
const TRACK_AVG_CYCLE_DAYS: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 65,
  "TRACK-003": 145,
  "TRACK-004": 0,
  "TRACK-006": 110,
  "TRACK-007": 75,
  "TRACK-008": 220,
  "TRACK-009": 95,
  "TRACK-010": 35,
  "TRACK-011": 50,
};

// Per Stage 3 §5.1 navigate→close days.
const TRACK_NAVIGATE_TO_CLOSE_DAYS: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 12,
  "TRACK-003": 45,
  "TRACK-004": 0,
  "TRACK-006": 35,
  "TRACK-007": 18,
  "TRACK-008": 75,
  "TRACK-009": 28,
  "TRACK-010": 5,
  "TRACK-011": 8,
};

// Per Stage 3 §2.2 median closure values.
const TRACK_MEDIAN_CLOSURE_VALUE: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 135_000,
  "TRACK-003": 1_400_000,
  "TRACK-004": 0,
  "TRACK-006": 340_000,
  "TRACK-007": 215_000,
  "TRACK-008": 3_200_000,
  "TRACK-009": 165_000,
  "TRACK-010": 22_000,
  "TRACK-011": 16_000,
};

const TRACK_CLOSURE_VALUE_RANGE: Record<TrackId, [number, number]> = {
  "TRACK-001": [0, 0],
  "TRACK-002": [40_000, 380_000],
  "TRACK-003": [300_000, 4_500_000],
  "TRACK-004": [0, 0],
  "TRACK-006": [180_000, 700_000],
  "TRACK-007": [60_000, 750_000],
  "TRACK-008": [1_200_000, 7_000_000],
  "TRACK-009": [50_000, 400_000],
  "TRACK-010": [8_000, 65_000],
  "TRACK-011": [7_000, 25_000],
};

// Per Stage 3 §6.1 avg captures per closed deal (using midpoints).
const TRACK_AVG_CAPTURES_PER_DEAL: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 8,
  "TRACK-003": 18,
  "TRACK-004": 0,
  "TRACK-006": 14,
  "TRACK-007": 11,
  "TRACK-008": 24,
  "TRACK-009": 12,
  "TRACK-010": 5,
  "TRACK-011": 4,
};

const TRACK_AVG_INSIGHTS_PER_DEAL: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 3.5,
  "TRACK-003": 6,
  "TRACK-004": 0,
  "TRACK-006": 4.5,
  "TRACK-007": 3.5,
  "TRACK-008": 7,
  "TRACK-009": 4.5,
  "TRACK-010": 1.5,
  "TRACK-011": 1.5,
};

// Per Stage 3 §4.2 specialist involvement probability by Track.
const TRACK_SPECIALIST_PROB: Record<TrackId, number> = {
  "TRACK-001": 0,
  "TRACK-002": 0,
  "TRACK-003": 0.75,
  "TRACK-004": 0,
  "TRACK-006": 0.4,
  "TRACK-007": 0,
  "TRACK-008": 1.0,
  "TRACK-009": 0,
  "TRACK-010": 0,
  "TRACK-011": 0,
};

// Per Stage 3 §3.1 banker closure counts (sum = 104 → normalized to 100
// proportionally below).
const BANKER_CLOSURE_TARGETS: Record<string, number> = {
  "BANKER-001": 9,
  "BANKER-002": 11,
  "BANKER-003": 12,
  "BANKER-004": 6,
  "BANKER-005": 10,
  "BANKER-006": 8,
  "BANKER-007": 7,
  "BANKER-008": 9,
  "BANKER-009": 5,
  "BANKER-010": 5,
  "BANKER-011": 8,
  "BANKER-012": 3,
  "BANKER-013": 5,
  "BANKER-014": 6,
};

// Per Stage 3 §1.3 monthly closure counts (sum = 100).
const MONTHLY_CLOSURE_COUNTS = [7, 8, 10, 12, 9, 8, 7, 6, 8, 10, 9, 6]; // 12 months ago → 1 month ago

function generateClosedDeals(
  members: SyntheticMember[],
  rng: ReturnType<typeof createRng>,
): { deals: ClosedDeal[]; narratives: FeaturedDealNarrative[] } {
  const deals: ClosedDeal[] = [];

  // Build per-Track closure target list with banker assignment quotas.
  const trackOrder: TrackId[] = [
    "TRACK-008",
    "TRACK-003",
    "TRACK-007",
    "TRACK-010",
    "TRACK-002",
    "TRACK-006",
    "TRACK-011",
    "TRACK-009",
  ];

  const bankerCloseRemaining: Record<string, number> = { ...BANKER_CLOSURE_TARGETS };

  let dealIdx = 0;
  for (const trackId of trackOrder) {
    const count = TRACK_CLOSURE_COUNTS[trackId];
    for (let n = 0; n < count; n++) {
      dealIdx += 1;
      const id = `DEAL-${dealIdx.toString().padStart(3, "0")}`;

      // Pick a banker with remaining closure quota who plausibly cultivates this Track.
      const candidates = BANKERS.filter((b) => (bankerCloseRemaining[b.id] ?? 0) > 0);
      const banker = candidates.length > 0 ? rng.pick(candidates) : rng.pick(BANKERS);
      bankerCloseRemaining[banker.id] = (bankerCloseRemaining[banker.id] ?? 0) - 1;

      const branchId = banker.primary_branch_id;
      const memberType: MemberType = rng.pick(
        (Object.keys(MEMBER_TYPE_TRACK_MATRIX) as MemberType[]).filter(
          (t) => MEMBER_TYPE_TRACK_MATRIX[t][trackId] > 0,
        ),
      );
      const memberName = generateMemberName(memberType, dealIdx, new Set(), rng);

      // Closure date: distribute across 12 months per MONTHLY_CLOSURE_COUNTS.
      // (Cumulative distribution roll.)
      let cumulative = 0;
      const totalSoFar = deals.length;
      const cumulativeTargets = MONTHLY_CLOSURE_COUNTS.map((c) => (cumulative += c));
      let monthsAgo = 12;
      for (let i = 0; i < cumulativeTargets.length; i++) {
        if (totalSoFar < cumulativeTargets[i]!) {
          monthsAgo = 12 - i;
          break;
        }
      }
      const dayOffsetWithinMonth = rng.nextInt(0, 29);
      const closureDate = new Date(Date.now() - monthsAgo * 30 * 86_400_000 - dayOffsetWithinMonth * 86_400_000);

      const avgCycle = TRACK_AVG_CYCLE_DAYS[trackId];
      const cycleDays = avgCycle + rng.nextInt(-20, 30);
      const navToClose = TRACK_NAVIGATE_TO_CLOSE_DAYS[trackId];

      const discoverDate = new Date(closureDate.getTime() - cycleDays * 86_400_000);
      const navigateDate = new Date(closureDate.getTime() - navToClose * 86_400_000);

      // Closure value — cluster around median with modest jitter so
      // the aggregate $71M target from Stage 5 §1.1 lands close.
      const [minV, maxV] = TRACK_CLOSURE_VALUE_RANGE[trackId];
      const med = TRACK_MEDIAN_CLOSURE_VALUE[trackId];
      const valueJitter = rng.nextFloat(0.82, 1.18);
      let value = med * valueJitter;
      if (value < minV) value = minV;
      if (value > maxV) value = maxV;
      value = Math.round(value / 1000) * 1000;

      // Specialist involvement
      const specialistInvolved = rng.next() < TRACK_SPECIALIST_PROB[trackId];
      let specialistBankerId: string | null = null;
      let specialistDay: number | null = null;
      let cdcInvolved = false;
      let cdcDay: number | null = null;
      if (specialistInvolved) {
        if (trackId === "TRACK-008") {
          specialistBankerId = rng.pick(["BANKER-009", "BANKER-004"]);
          specialistDay = rng.nextInt(20, 45);
          cdcInvolved = true;
          cdcDay = rng.nextInt(45, 90);
        } else if (trackId === "TRACK-003") {
          specialistBankerId = rng.pick(["BANKER-002", "BANKER-006", "BANKER-014"]);
          specialistDay = rng.nextInt(30, 60);
        } else if (trackId === "TRACK-006") {
          specialistBankerId = rng.pick(["BANKER-002", "BANKER-006"]);
          specialistDay = rng.nextInt(45, 90);
        }
      }

      const avgCaptures = TRACK_AVG_CAPTURES_PER_DEAL[trackId];
      const captures = Math.max(3, avgCaptures + rng.nextInt(-3, 5));
      const avgInsights = TRACK_AVG_INSIGHTS_PER_DEAL[trackId];
      const insights = Math.max(1, Math.round(avgInsights + rng.nextInt(-1, 2)));

      // void unused params (we already used) — keep consistent
      void branchId;

      deals.push({
        id,
        originating_member_name: memberName,
        member_type: memberType,
        originating_banker_id: banker.id,
        originating_branch_id: banker.primary_branch_id,
        track_id: trackId,
        closure_value: value,
        closure_date: closureDate,
        discover_date: discoverDate,
        navigate_date: navigateDate,
        days_discover_to_close: cycleDays,
        days_navigate_to_close: navToClose,
        specialist_involved: specialistInvolved,
        specialist_banker_id: specialistBankerId,
        specialist_introduction_day: specialistDay,
        cdc_partner_involved: cdcInvolved,
        cdc_introduction_day: cdcDay,
        total_captures: captures,
        insights_authored: insights,
        is_featured: false,
        featured_narrative: null,
      });
    }
  }

  // Mark 5 featured deals per Stage 5 §13.1. Pick one of each Track,
  // attach hand-crafted narrative.
  const narratives = generateFeaturedNarratives();
  const featuredTracks: TrackId[] = ["TRACK-008", "TRACK-003", "TRACK-007", "TRACK-010", "TRACK-009"];
  featuredTracks.forEach((trackId, i) => {
    const candidate = deals.find((d) => d.track_id === trackId && !d.is_featured);
    if (candidate) {
      candidate.is_featured = true;
      candidate.featured_narrative = narratives[i] ?? null;
    }
  });

  return { deals, narratives };
}

function generateFeaturedNarratives(): FeaturedDealNarrative[] {
  // Sprint 7a-patch §F.3 — Pattern content drawn from
  // INSIGHT_PATTERN_LIBRARY_v1.md and v2_additions.md.
  return [
    {
      rank: 1,
      headline: "Closed Mar 14 — $3.2M SBA 504",
      cycle_label: "From first conversation to close: 187 days",
      originating_quote:
        "We're at about 85% capacity utilization. Three of our anchor customers are signaling 15-25% volume growth over the next eighteen months.",
      originating_quote_speaker: "Margaret Sullivan, Cygnus-style specialty manufacturer CEO",
      key_insights: [
        {
          day: 23,
          type: "reframe",
          label: "Anchor-customer growth reframe",
          pattern_id: "PATTERN-019",
          content:
            "When anchor customers signal volume increases, the question is not whether to expand — it is whether expansion arrives ahead of the demand or behind it.",
        },
        {
          day: 41,
          type: "implication",
          label: "Facility-constraint compounding implication",
          pattern_id: "PATTERN-018",
          content:
            "A facility constraint at 80%+ utilization compounds — every additional commitment requires either rejecting work or accepting operational stress that erodes execution quality.",
        },
        {
          day: 67,
          type: "reframe",
          label: "Board engagement reframe",
          pattern_id: "PATTERN-022",
          content:
            "Board-level input on a material commitment is not a delay mechanism — it produces the institutional memory needed to execute the decision well over years.",
        },
      ],
      specialist_summary:
        "Marcus Johansson (relationship) → Michael Nordgaard (SBA specialist) introduced Day 28 → Diana Reyes (CDC partner) joined Day 67",
      banker_name: "Marcus Johansson",
    },
    {
      rank: 2,
      headline: "Closed Feb 8 — $1.6M CRE Term Loan",
      cycle_label: "From first conversation to close: 124 days",
      originating_quote:
        "We need a permanent home for the firm — we've been leasing for 12 years and the rent keeps escalating.",
      originating_quote_speaker: "Professional services managing partner",
      key_insights: [
        {
          day: 12,
          type: "reframe",
          label: "Lease-versus-own structural reframe",
          pattern_id: "PATTERN-017",
          content:
            "Real estate constraints are not just operational ceilings — they are decisions the business has been making by default, accepting growth limits without articulating them.",
        },
        {
          day: 34,
          type: "implication",
          label: "Operational-scale commitment implication",
          pattern_id: "PATTERN-021",
          content:
            "A capacity expansion decision involves more than financing — it commits the business to operational scale that requires hires, processes, and management capability the founder may not yet have.",
        },
        {
          day: 58,
          type: "reframe",
          label: "Decade-horizon ownership reframe",
          pattern_id: "PATTERN-020",
          content:
            "Acquiring real estate is not just a financing decision — it is a long-term commitment to a specific operational geometry that shapes the business for a decade.",
        },
      ],
      specialist_summary: "David Nguyen (relationship) → Margot Desandre (CRE specialist) joined Day 22",
      banker_name: "David Nguyen",
    },
    {
      rank: 3,
      headline: "Closed Apr 12 — $245K Equipment & Machinery",
      cycle_label: "From first conversation to close: 68 days",
      originating_quote:
        "We turned away three calls last week because we don't have the second crew. Two of those won't come back.",
      originating_quote_speaker: "Maintenance services owner",
      key_insights: [
        {
          day: 8,
          type: "reframe",
          label: "Capacity-as-lost-revenue reframe",
          pattern_id: "PATTERN-010",
          content:
            "When operational capacity caps demand, every customer the business turns away today is one a competitor builds a relationship with — those customers don't recover later.",
        },
        {
          day: 21,
          type: "implication",
          label: "Equipment-failure fleet-question implication",
          pattern_id: "PATTERN-013",
          content:
            "An equipment failure that triggers a financing conversation is rarely about the failed unit — it is the moment the broader fleet question becomes unavoidable.",
        },
      ],
      specialist_summary: "Maria Reyes (direct banker close — no specialist needed)",
      banker_name: "Maria Reyes",
    },
    {
      rank: 4,
      headline: "Closed Apr 28 — $35K Business Visa",
      cycle_label: "From first conversation to close: 22 days",
      originating_quote:
        "I'm running everything through my personal card and it's getting messy at tax time.",
      originating_quote_speaker: "Retail boutique owner",
      key_insights: [
        {
          day: 6,
          type: "reframe",
          label: "Card-as-working-capital reframe",
          pattern_id: "PATTERN-056",
          content:
            "Business credit card capacity isn't a debt facility — it's working capital flexibility that smooths timing mismatches between operations and customer payment cycles.",
        },
      ],
      specialist_summary: "Margot Desandre (direct banker close — fast turnaround)",
      banker_name: "Margot Desandre",
    },
    {
      rank: 5,
      headline: "Closed Mar 22 — $185K PACE Loan",
      cycle_label: "From first conversation to close: 89 days",
      originating_quote:
        "Our energy costs are about to spike when the utility contract renews. We need a long-term answer, not a hedge.",
      originating_quote_speaker: "Specialty manufacturer COO",
      key_insights: [
        {
          day: 15,
          type: "reframe",
          label: "14-year fixed cost stability reframe",
          pattern_id: "PATTERN-053",
          content:
            "Energy improvement financing through PACE is not just a sustainability decision — it locks in operating cost stability through a 14-year horizon during a volatile energy-pricing era.",
        },
        {
          day: 38,
          type: "implication",
          label: "Property-transfer continuity implication",
          pattern_id: "PATTERN-054",
          content:
            "PACE structure ties improvement assessment to the property — which means improvements transfer with the property and don't constrain operational financing capacity.",
        },
      ],
      specialist_summary: "Linnea Petersen (relationship) → PACE program coordinator joined Day 41",
      banker_name: "Linnea Petersen",
    },
  ];
}

// ────────────────────────────────────────────────
// Stage 4 — Daily activity (90 days)
// ────────────────────────────────────────────────

const BANKER_DAILY_EVENTS_BASE: Record<string, number> = {
  "BANKER-001": 8,
  "BANKER-002": 9,
  "BANKER-003": 8,
  "BANKER-004": 5,
  "BANKER-005": 7,
  "BANKER-006": 5,
  "BANKER-007": 4,
  "BANKER-008": 7,
  "BANKER-009": 5,
  "BANKER-010": 4,
  "BANKER-011": 7,
  "BANKER-012": 2,
  "BANKER-013": 4,
  "BANKER-014": 5,
};

// Banker vacation windows: [bankerId, [daysAgoStart, daysAgoEnd]]
const BANKER_VACATIONS: Array<[string, [number, number]]> = [
  ["BANKER-001", [25, 30]],
  ["BANKER-002", [60, 65]],
  ["BANKER-004", [15, 20]],
  ["BANKER-012", [40, 55]], // extended low-activity
];

// Day-of-week multipliers per Stage 4 §2.2
const DOW_MULTIPLIER = [0.1, 1.2, 1.3, 1.1, 1.0, 0.7, 0.2]; // Sun..Sat

function generateDailyActivity(
  rng: ReturnType<typeof createRng>,
  closedDeals: ClosedDeal[],
): { daily: DailyActivity[]; featured: FeaturedTemporalEvent[] } {
  const daily: DailyActivity[] = [];
  const now = Date.now();

  // Closures per day
  const closuresByDayAgo = new Map<number, number>();
  for (const d of closedDeals) {
    const daysAgo = Math.floor((now - d.closure_date.getTime()) / 86_400_000);
    closuresByDayAgo.set(daysAgo, (closuresByDayAgo.get(daysAgo) ?? 0) + 1);
  }

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(now - daysAgo * 86_400_000);
    const dow = date.getDay();
    const dowMult = DOW_MULTIPLIER[dow]!;

    // Acceleration lift per Stage 4 §2.3
    let lift = 1.0;
    if (daysAgo <= 30) lift = 1.15;
    else if (daysAgo <= 60) lift = 1.0;
    else lift = 0.93;

    const perBanker: Record<string, BankerDailyActivity> = {};
    let totalEvents = 0;
    let totalInsights = 0;
    let totalProgressions = 0;

    for (const b of BANKERS) {
      const onVacation = BANKER_VACATIONS.some(
        ([id, [start, end]]) => id === b.id && daysAgo >= start && daysAgo <= end,
      );
      const base = BANKER_DAILY_EVENTS_BASE[b.id] ?? 4;
      const scaled = onVacation ? 0 : Math.round(base * dowMult * lift * rng.nextFloat(0.7, 1.3));
      const events = Math.max(0, scaled);
      // Sprint 7a-patch §H.2: 0.18 → 0.10 to land insights/week near 51
      // (Stage 4 §2.1 baseline: ~10 insights/day × 5 weekdays). The
      // 0.18 multiplier overproduced ~88/week vs. the target.
      const insights = Math.round(events * 0.10);
      const progressions = rng.next() < 0.3 ? rng.nextInt(0, 2) : 0;
      perBanker[b.id] = {
        banker_id: b.id,
        events_count: events,
        insights_authored: insights,
        members_progressed: progressions,
        on_vacation: onVacation,
      };
      totalEvents += events;
      totalInsights += insights;
      totalProgressions += progressions;
    }

    // Per-activity-type split of total events (rough proportions from Stage 4 §2.1)
    const factorCaptures = Math.round(totalEvents * 0.28);
    const signals = Math.round(totalEvents * 0.22);
    const reactions = Math.round(totalEvents * 0.09);
    const models = Math.round(totalEvents * 0.06);
    const actions = Math.round(totalEvents * 0.12);
    const showEvents = Math.round(totalEvents * 0.08);

    // Matched/novel split per Stage 4 §4.2 trend: 78% / 22% recent → 68% / 32% older
    const matchedShare = daysAgo <= 30 ? 0.78 : daysAgo <= 60 ? 0.72 : 0.68;
    const insightsMatched = Math.round(totalInsights * matchedShare);
    const insightsNovel = totalInsights - insightsMatched;

    // Phase progressions split by Stage 4 §5.1 ratios
    const dToM = Math.round(totalProgressions * 0.4);
    const mToC = Math.round(totalProgressions * 0.27);
    const cToN = Math.round(totalProgressions * 0.17);
    const nToClosed = closuresByDayAgo.get(daysAgo) ?? 0;

    // Open thread state — Stage 4 §8.1 with monotonic growth
    const totalOpen = 64 + Math.round((90 - daysAgo) * 0.16);
    const recent = Math.round(totalOpen * 0.58);
    const aging = Math.round(totalOpen * 0.32);
    const stale = totalOpen - recent - aging;

    daily.push({
      date,
      days_ago: daysAgo,
      factor_captures: factorCaptures,
      signals,
      insights_authored: totalInsights,
      reactions,
      models,
      actions,
      show_events: showEvents,
      per_banker_activity: perBanker,
      discover_to_measure: dToM,
      measure_to_consult: mToC,
      consult_to_navigate: cToN,
      navigate_to_closed: nToClosed,
      insights_matched: insightsMatched,
      insights_novel: insightsNovel,
      open_thread_total: totalOpen,
      open_thread_recent: recent,
      open_thread_aging: aging,
      open_thread_stale: stale,
    });
  }

  // Featured temporal events per Stage 4 §6.1
  const featured: FeaturedTemporalEvent[] = [
    {
      days_ago: 12,
      event_type: "major_authoring_day",
      title: "Major insight-authoring day",
      description:
        "28 insights authored across the team in a single day. Cross-banker workshop produced concentrated learning.",
      visual_marker: "spike",
    },
    {
      days_ago: 28,
      event_type: "pattern_promotion",
      title: "Pattern library update",
      description:
        "4 novel insights promoted to the canonical Pattern library in a single review cycle. Library grew from 49 to 53 Patterns.",
      visual_marker: "milestone",
    },
    {
      days_ago: 35,
      event_type: "stage_skip_catch",
      title: "Stage-skip catch",
      description:
        "2 Members flagged as stage-skipping; bankers backfilled Discover-phase evidence within 5 days.",
      visual_marker: "highlight",
    },
    {
      days_ago: 45,
      event_type: "sba_close",
      title: "First SBA 504 close under new architecture",
      description:
        "$4.2M SBA 504 closed. Marcus Johansson originating, Michael Nordgaard specialist, Diana Reyes CDC partner.",
      visual_marker: "milestone",
    },
    {
      days_ago: 8,
      event_type: "peak_activity",
      title: "Maximum activity day",
      description:
        "89 events captured across all bankers — highest single-day activity in the 90-day window.",
      visual_marker: "spike",
    },
  ];

  return { daily, featured };
}

// ────────────────────────────────────────────────
// Stage 5 — Aggregate metrics
// ────────────────────────────────────────────────

function computeAggregateMetrics(
  members: SyntheticMember[],
  deals: ClosedDeal[],
  daily: DailyActivity[],
): AggregateMetrics {
  // Pipeline value
  const pipelineFace = members.reduce((s, m) => s + m.sized_opportunity_amount, 0);
  const pipelineWeighted = members.reduce(
    (s, m) => s + m.sized_opportunity_amount * PHASE_WEIGHTS[m.current_phase],
    0,
  );

  // This-week counts (last 7 days inclusive).
  // Per Stage 5 §1.1 the "conversations this week" hero metric reads
  // ~68/week, narrower than total capture events (which sum to several
  // hundred). Approximate distinct conversations as captures / 6
  // (typical event-count per conversation per Stage 3 §6.1 averages).
  const last7 = daily.filter((d) => d.days_ago <= 6);
  const captureEventsLast7 = last7.reduce(
    (s, d) => s + d.factor_captures + d.signals + d.reactions + d.models + d.actions + d.show_events,
    0,
  );
  const conversationsThisWeek = Math.round(captureEventsLast7 / 6);
  const insightsThisWeek = last7.reduce((s, d) => s + d.insights_authored, 0);

  // Avg Discover → Navigate days (from completed deals' discover_to_close minus navigate_to_close = discover→navigate)
  const completed = deals.filter((d) => d.days_discover_to_close > 0);
  const avgDiscoverToNavigate =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (s, d) => s + (d.days_discover_to_close - d.days_navigate_to_close),
            0,
          ) / completed.length,
        )
      : 87;

  // Closed last 12 months
  const closedValue12mo = deals.reduce((s, d) => s + d.closure_value, 0);
  const closedCount12mo = deals.length;

  // Sparklines: weekly conversations + insights (12 weeks).
  // Conversations divided by 6 to match the hero-metric framing above.
  const weeklyConversations: number[] = [];
  const weeklyInsights: number[] = [];
  for (let w = 11; w >= 0; w--) {
    const dStart = w * 7;
    const dEnd = dStart + 6;
    const week = daily.filter((d) => d.days_ago >= dStart && d.days_ago <= dEnd);
    const events = week.reduce(
      (s, d) => s + d.factor_captures + d.signals + d.reactions + d.models + d.actions + d.show_events,
      0,
    );
    weeklyConversations.push(Math.round(events / 6));
    weeklyInsights.push(week.reduce((s, d) => s + d.insights_authored, 0));
  }
  // Closures sparkline: 12 months of closure counts
  const monthlyClosures: number[] = [];
  for (let m = 11; m >= 0; m--) {
    const monthAgo = m;
    const monthDeals = deals.filter((d) => {
      const days = Math.floor((Date.now() - d.closure_date.getTime()) / 86_400_000);
      const monthsAgoExact = Math.floor(days / 30);
      return monthsAgoExact === monthAgo;
    });
    monthlyClosures.push(monthDeals.length);
  }

  // Funnel counts
  const funnelCounts: Record<Phase, number> = {
    discover: members.filter((m) => m.current_phase === "discover").length,
    measure: members.filter((m) => m.current_phase === "measure").length,
    consult: members.filter((m) => m.current_phase === "consult").length,
    navigate: members.filter((m) => m.current_phase === "navigate").length,
  };

  // Flow rates per Stage 5 §2.2
  const funnelFlowRates = {
    discover_to_measure: 1.2,
    measure_to_consult: 0.8,
    consult_to_navigate: 0.5,
    navigate_to_closed: 1.1,
  };

  // Per-Track metrics
  const trackMetrics: Record<TrackId, ReturnType<typeof emptyTrackMetrics>> = {} as Record<
    TrackId,
    ReturnType<typeof emptyTrackMetrics>
  >;
  for (const t of Object.keys(TRACK_LABELS) as TrackId[]) {
    trackMetrics[t] = emptyTrackMetrics(t);
  }
  for (const m of members) {
    const t = m.current_track_id as TrackId;
    if (!trackMetrics[t]) continue;
    trackMetrics[t].member_count += 1;
    trackMetrics[t].pipeline_value += m.sized_opportunity_amount;
  }
  for (const d of deals) {
    const t = d.track_id as TrackId;
    if (!trackMetrics[t]) continue;
    trackMetrics[t].closed_count_12mo += 1;
    trackMetrics[t].closed_value_12mo += d.closure_value;
    trackMetrics[t].avg_days_discover_to_close_sum += d.days_discover_to_close;
  }
  // Finalize per-Track
  for (const t of Object.keys(trackMetrics) as TrackId[]) {
    const tm = trackMetrics[t];
    const closed = tm.closed_count_12mo;
    const totalFunnel = tm.member_count + closed;
    tm.conversion_rate = totalFunnel > 0 ? closed / totalFunnel : 0;
    tm.avg_days_discover_to_close =
      closed > 0 ? Math.round(tm.avg_days_discover_to_close_sum / closed) : 0;
    tm.median_size = TRACK_MEDIAN_CLOSURE_VALUE[t] || 0;
    tm.stickiness = TRACK_STICKINESS[t];
    tm.is_blaze_offered = BLAZE_OFFERED_TRACKS.has(t);
  }

  // Per-banker metrics
  const bankerMetrics: Record<string, BankerMetrics> = {};
  for (const b of BANKERS) {
    const bMembers = members.filter((m) => m.banker_id === b.id);
    const bDeals = deals.filter((d) => d.originating_banker_id === b.id);
    const totalFunnel = bMembers.length + bDeals.length;
    const totalActivity = daily.reduce(
      (s, d) => s + (d.per_banker_activity[b.id]?.events_count ?? 0),
      0,
    );
    const insights = daily.reduce(
      (s, d) => s + (d.per_banker_activity[b.id]?.insights_authored ?? 0),
      0,
    );
    bankerMetrics[b.id] = {
      banker_id: b.id,
      member_count: bMembers.length,
      pipeline_value: bMembers.reduce((s, m) => s + m.sized_opportunity_amount, 0),
      closed_count_12mo: bDeals.length,
      closed_value_12mo: bDeals.reduce((s, d) => s + d.closure_value, 0),
      closure_rate: totalFunnel > 0 ? bDeals.length / totalFunnel : 0,
      insights_authored_90d: insights,
      total_activity_90d: totalActivity,
    };
  }

  // Per-branch metrics
  const branchMetrics: Record<string, BranchMetrics> = {};
  for (const b of BRANCHES) {
    const bMembers = members.filter((m) => m.branch_id === b.id);
    const bDeals = deals.filter((d) => d.originating_branch_id === b.id);
    const totalFunnel = bMembers.length + bDeals.length;
    branchMetrics[b.id] = {
      branch_id: b.id,
      member_count: bMembers.length,
      pipeline_value: bMembers.reduce((s, m) => s + m.sized_opportunity_amount, 0),
      closed_count_12mo: bDeals.length,
      closed_value_12mo: bDeals.reduce((s, d) => s + d.closure_value, 0),
      conversion_rate: totalFunnel > 0 ? bDeals.length / totalFunnel : 0,
      activity_per_day_avg: 0, // computed below
    };
  }

  // Per-Member-Type metrics
  const memberTypeMetrics: Record<MemberType, MemberTypeMetrics> = {} as Record<MemberType, MemberTypeMetrics>;
  for (const mt of Object.keys(MEMBER_TYPE_TARGETS) as MemberType[]) {
    const tMembers = members.filter((m) => m.member_type === mt);
    const tDeals = deals.filter((d) => d.member_type === mt);
    // Top Track within this Member-Type
    const trackCounts = new Map<TrackId, number>();
    for (const m of tMembers) {
      const t = m.current_track_id as TrackId;
      trackCounts.set(t, (trackCounts.get(t) ?? 0) + 1);
    }
    const sortedTracks = [...trackCounts.entries()].sort((a, b) => b[1] - a[1]);
    memberTypeMetrics[mt] = {
      member_type: mt,
      member_count: tMembers.length,
      pipeline_value: tMembers.reduce((s, m) => s + m.sized_opportunity_amount, 0),
      closed_count_12mo: tDeals.length,
      closed_value_12mo: tDeals.reduce((s, d) => s + d.closure_value, 0),
      top_track_id: sortedTracks[0]?.[0] ?? null,
    };
  }

  // Top patterns per Stage 5 §10.3
  const topPatterns = [
    { pattern_id: "PATTERN-006", pattern_label: "Seasonal cashflow gap reframe", match_count_90d: 64, banker_count: 8, tracks: ["TRACK-001"] as TrackId[] },
    { pattern_id: "PATTERN-010", pattern_label: "Capacity limit reframe", match_count_90d: 52, banker_count: 11, tracks: ["TRACK-002", "TRACK-007"] as TrackId[] },
    { pattern_id: "PATTERN-017", pattern_label: "Real estate constraint reframe", match_count_90d: 41, banker_count: 9, tracks: ["TRACK-003", "TRACK-008"] as TrackId[] },
    { pattern_id: "PATTERN-019", pattern_label: "Customer growth announcement reframe", match_count_90d: 38, banker_count: 7, tracks: ["TRACK-008", "TRACK-003"] as TrackId[] },
    { pattern_id: "PATTERN-011", pattern_label: "Capacity limit implication", match_count_90d: 35, banker_count: 10, tracks: ["TRACK-002", "TRACK-007"] as TrackId[] },
    { pattern_id: "PATTERN-012", pattern_label: "Aging equipment reframe", match_count_90d: 33, banker_count: 8, tracks: ["TRACK-002", "TRACK-007"] as TrackId[] },
    { pattern_id: "PATTERN-005", pattern_label: "Seasonal cashflow implication", match_count_90d: 31, banker_count: 7, tracks: ["TRACK-001"] as TrackId[] },
    { pattern_id: "PATTERN-022", pattern_label: "Co-decision-maker reframe", match_count_90d: 28, banker_count: 6, tracks: ["TRACK-008", "TRACK-003"] as TrackId[] },
    { pattern_id: "PATTERN-018", pattern_label: "Real estate implication", match_count_90d: 26, banker_count: 7, tracks: ["TRACK-003", "TRACK-008"] as TrackId[] },
    { pattern_id: "PATTERN-013", pattern_label: "Equipment breakdown implication", match_count_90d: 24, banker_count: 6, tracks: ["TRACK-002", "TRACK-007"] as TrackId[] },
  ];

  // Strip the helper field used during accumulation
  const finalTrackMetrics: Record<TrackId, TrackMetrics> = {} as Record<TrackId, TrackMetrics>;
  for (const t of Object.keys(trackMetrics) as TrackId[]) {
    const { avg_days_discover_to_close_sum, ...rest } = trackMetrics[t];
    void avg_days_discover_to_close_sum;
    finalTrackMetrics[t] = rest;
  }

  // Sprint 7a-patch §H.1 — Hero metrics aggregate fixtures + synthetic.
  // The 4 Prisma fixtures (Jenny / Northland / Cygnus / Riverside) live
  // outside the synthetic pipeline. Their contribution is overlaid here
  // so the EVP hero reads the combined 220-Member portfolio.
  //
  // Pipeline-value overlay is approximated from the fixture key facts:
  // Jenny ($750K LOC) + Northland ($245K Equipment) + Cygnus ($3.2M SBA
  // 504) + Riverside ($200K LOC stage-skip) ≈ $4.4M. Conversations and
  // insights this week add a modest per-fixture rate (~1 conversation
  // and ~1 insight per fixture per week of active cultivation).
  const FIXTURE_OVERLAY = {
    members: 4,
    pipeline_face: 4_400_000,
    pipeline_weighted: 4_400_000 * 0.6, // mid-cycle weight average
    conversations_this_week: 3,
    // 1/week reflects steady fixture insight authoring (lower bound;
    // most weeks one of the 4 fixtures advances an insight). Keeps the
    // total within Stage 5 §1.1's 48-55/week target band.
    insights_this_week: 1,
  };

  return {
    pipeline_value_face: pipelineFace + FIXTURE_OVERLAY.pipeline_face,
    pipeline_value_weighted: pipelineWeighted + FIXTURE_OVERLAY.pipeline_weighted,
    members_in_cultivation: members.length + FIXTURE_OVERLAY.members,
    conversations_this_week: conversationsThisWeek + FIXTURE_OVERLAY.conversations_this_week,
    insights_this_week: insightsThisWeek + FIXTURE_OVERLAY.insights_this_week,
    avg_discover_to_navigate_days: avgDiscoverToNavigate,
    closed_value_12mo: closedValue12mo,
    closed_count_12mo: closedCount12mo,
    conversations_sparkline: weeklyConversations,
    insights_sparkline: weeklyInsights,
    closures_sparkline: monthlyClosures,
    funnel_counts: funnelCounts,
    funnel_flow_rates: funnelFlowRates,
    track_metrics: finalTrackMetrics,
    banker_metrics: bankerMetrics,
    branch_metrics: branchMetrics,
    member_type_metrics: memberTypeMetrics,
    top_patterns: topPatterns,
  };
}

type TrackMetrics = {
  track_id: TrackId;
  member_count: number;
  pipeline_value: number;
  median_size: number;
  closed_count_12mo: number;
  closed_value_12mo: number;
  conversion_rate: number;
  avg_days_discover_to_close: number;
  stickiness: number;
  is_blaze_offered: boolean;
};

function emptyTrackMetrics(track_id: TrackId): TrackMetrics & { avg_days_discover_to_close_sum: number } {
  return {
    track_id,
    member_count: 0,
    pipeline_value: 0,
    median_size: 0,
    closed_count_12mo: 0,
    closed_value_12mo: 0,
    conversion_rate: 0,
    avg_days_discover_to_close: 0,
    avg_days_discover_to_close_sum: 0,
    stickiness: 0,
    is_blaze_offered: false,
  };
}

// ────────────────────────────────────────────────
// Public API — cached
// ────────────────────────────────────────────────

let cached: SyntheticDataset | null = null;

export function getSyntheticDataset(): SyntheticDataset {
  if (cached) return cached;
  const rng = createRng(DEFAULT_SEED);
  const members = generateMembers(rng);
  const { deals } = generateClosedDeals(members, rng);
  const { daily, featured } = generateDailyActivity(rng, deals);
  const aggregate = computeAggregateMetrics(members, deals, daily);

  // Backfill branch activity averages
  for (const branchId of Object.keys(aggregate.branch_metrics)) {
    const branchActivity = daily.reduce((s, d) => {
      let total = 0;
      for (const b of BANKERS) {
        if (b.primary_branch_id === branchId || b.additional_branch_ids.includes(branchId)) {
          total += d.per_banker_activity[b.id]?.events_count ?? 0;
        }
      }
      return s + total;
    }, 0);
    aggregate.branch_metrics[branchId]!.activity_per_day_avg = +(branchActivity / 90).toFixed(1);
  }

  cached = {
    branches: BRANCHES,
    bankers: BANKERS,
    members,
    closed_deals: deals,
    daily_activity: daily,
    featured_temporal_events: featured,
    aggregate_metrics: aggregate,
  };
  return cached;
}

export type { SyntheticDataset } from "./types";
