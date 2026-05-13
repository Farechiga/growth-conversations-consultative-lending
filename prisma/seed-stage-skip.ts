/*
 * Sprint 5d Block I — Riverside Catering stage-skip fixture.
 *
 * Seeds a fourth fixture Member that demonstrates the Stage-skip
 * portfolio surface. Riverside has Consult evidence captured (Model
 * produced + Reaction captured) but is missing three of four
 * Discover-required factors for TRACK-001. The portfolio query
 * lib/portfolio-queries.ts → stageSkipData picks this up as
 * `skipped_objectives = ["discover"]`.
 *
 * Riverside is intentionally a leaner fixture than Jenny/Northland/
 * Cygnus — just enough surface area to demonstrate stage-skip
 * detection without polluting other Insight Engine surfaces with
 * partial-state noise.
 */

import type { PrismaClient } from "../app/generated/prisma/client";

type SeedDeps = {
  prisma: PrismaClient;
  bankerId: string;
  industryFamilyEventDrivenId: string;
  memberTypeEventServicesId: string;
};

export async function seedStageSkipFixture({
  prisma,
  bankerId,
  industryFamilyEventDrivenId,
  memberTypeEventServicesId,
}: SeedDeps) {
  // Sprint 5e Block D — relative dates so Riverside's Consult-phase
  // capture stays inside the recent window (per spec D.3: Consult Model
  // 20-25 days ago; Reaction 18-22 days ago). tenure_started_at stays
  // historical (~600 days) — the Member opened their account well
  // before the demo window.
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setUTCHours(15, 30, 0, 0);
    d.setUTCDate(d.getUTCDate() - n);
    return d;
  };
  const tenureStarted = daysAgo(615);
  const conversationDate = daysAgo(22);

  // Member.
  const riverside = await prisma.member.create({
    data: {
      slug: "riverside",
      legal_name: "Riverside Catering Co.",
      doing_business_as: "Riverside Catering",
      industry_family_id: industryFamilyEventDrivenId,
      stage: "starting",
      size_band: "small",
      member_type_id: memberTypeEventServicesId,
      primary_banker_id: bankerId,
      tenure_started_at: tenureStarted,
      consent_state: {
        marketing: false,
        data_sharing_third_party: false,
        last_updated_at: tenureStarted.toISOString(),
      },
      core_sync_state: {
        last_sync_at: new Date().toISOString(),
        products_held: [],
        deposit_activity_summary: {
          rolling_30d_inflow_band: "small",
          rolling_30d_outflow_band: "small",
          volatility_score: "high",
        },
        member_facing_summary: {
          owner_name: "Daniel Rivers",
          location: "St. Paul, MN",
          employees: 4,
          revenue_ttm_band: "$200K-$500K",
        },
      },
      private_notes: [],
      key_facts: [
        { label: "last touch", value: "Apr 30", source_type: "conversation", source_id: null },
      ],
      tracks_by_evidence_strength: {
        strong: [],
        moderate: [
          {
            track_name: "Working Capital LOC",
            evidence_count: 2,
            rationale:
              "Seasonal-variance and operating-margin captures fired moderate matrix entries; banker has built a smoothing model, but the discovery work that anchors a sized recommendation has not yet been done.",
          },
        ],
        insufficient: [],
      },
    },
  });

  // Conversation.
  const conversation = await prisma.conversation.create({
    data: {
      member_id: riverside.id,
      banker_id: bankerId,
      meeting_type: "opportunity",
      channel: "in_person",
      sentiment: "cautious",
      created_at: conversationDate,
      closed_at: conversationDate,
      banker_note:
        "Brought Riverside in to look at a seasonal smoothing projection. Walked Daniel through it. He was hesitant — wanted more time to think through last year's numbers before committing to a sizing.",
    },
  });

  // FactorCaptures — only two, neither in the Discover-required set
  // for TRACK-001 (which requires FACTOR-024, FACTOR-022, FACTOR-016,
  // FACTOR-001). FACTOR-001 IS Discover-required, but capturing it
  // alone leaves three of four Discover factors missing — which is
  // the stage-skip story this fixture demonstrates.
  await prisma.factorCapture.create({
    data: {
      member_id: riverside.id,
      factor_id: "FACTOR-001",
      numerical_value: 25,
      unit: "%",
      captured_at: conversationDate,
      banker_id: bankerId,
    },
  });
  await prisma.factorCapture.create({
    data: {
      member_id: riverside.id,
      factor_id: "FACTOR-005",
      numerical_value: 22,
      unit: "%",
      captured_at: conversationDate,
      banker_id: bankerId,
    },
  });

  // Model — banker draft of a seasonal cashflow projection. No artifact
  // attached; no template_id (Working Capital LOC has no parameterized
  // template in the demo's Sprint 5d Block B template seed).
  const model = await prisma.model.create({
    data: {
      member_id: riverside.id,
      conversation_id: conversation.id,
      built_with_member: true,
      parameters: { seasonal_variance_pct: 25, peak_months: ["May", "Jun", "Jul", "Aug", "Sep"] },
      assumptions: { collection_lag_days: 35, average_event_billing: 4500 },
      output_summary:
        "Seasonal cashflow projection for Riverside. Variance ~25% peak-to-trough; slow-season gap concentrates in late winter. A modest LOC could smooth the gap, but the sizing isn't yet anchored.",
      built_at: conversationDate,
      built_by_banker_id: bankerId,
      active: true,
    },
  });

  // Reaction — Daniel's response. `skeptical` is the closest enum value
  // to the spec's "hesitant"; primary_concern uses `timing_concern` from
  // the open-thread taxonomy (skeptical is non-terminal). The Member
  // quote signals he wants to step back and revisit discovery work.
  await prisma.reaction.create({
    data: {
      member_id: riverside.id,
      conversation_id: conversation.id,
      response_value: "skeptical",
      member_quote:
        "I hear you on the gap — I just want to look at last year's numbers more carefully before I commit to a number.",
      primary_concern: "timing_concern",
      captured_at: conversationDate,
      captured_by_banker_id: bankerId,
    },
  });

  return { riverside, conversation, model };
}
