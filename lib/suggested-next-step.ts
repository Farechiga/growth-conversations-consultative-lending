/*
 * Context-aware Suggested Next Step — Sprint 2 §B.
 *
 * Pure async function over Member state. Returns one of two shapes:
 *
 *   advance_opportunity — the Member has an active engaged Recommendation
 *     (response in engaged | leaning_yes | committed; not declined / funded
 *     because both are terminal). The Suggested Next Step card renders a
 *     "Follow up on …" framing instead of suggesting a new Track run.
 *
 *   run_track — the Member has no active engaged Recommendation. The card
 *     falls back to the rule-engine output and renders the highest-ranked
 *     Growth Track suggestion (the existing Sprint 1 behavior).
 *
 * The boundary case Sprint 2 surfaced: bankers were getting a "Run new Track"
 * card for Members where an opportunity was already in motion — contradictory
 * signal. The advance_opportunity branch resolves that by reading the
 * Recommendation's primary_concern (and any linked overdue ActionCard) to
 * derive a concrete next-action description.
 */

import type { PrismaClient, RecommendationResponse } from "@/app/generated/prisma/client";
import { fireRules, type RuleConditions } from "@/lib/rule-engine";

// ============================================================
// TrackProgressDots — adaptive journey visualization (Sprint 2 §C).
//
// Stages 1..N      = the actual GrowthSteps in the Track (in order).
// Stage N+1, N+2   = post-Track lifecycle, shape-dependent:
//                      Resolve-ending track → "Decision pending" → "Funded"
//                      Connect-ending track → "Specialist engagement" → "Closed"
//
// State per stage:
//   completed — there's a GrowthStepExecution for this step (or terminal
//               state has been reached: response="funded" or Connect terminal)
//   current   — this is the next stage demanding attention
//   upcoming  — the journey hasn't reached this stage yet
//
// The component takes the precomputed stages array; the computation lives
// here so the function-vs-component split keeps presentation pure.
// ============================================================

export type TrackStageState = "completed" | "current" | "upcoming";

export type TrackStage = {
  label: string;
  // Sprint 4 §4.2a refinement #2 — display-only label override. When
  // present, renderers (TrackProgressDots, AnchorProgressBar, GC page
  // section header) show `displayLabel`; the canonical `label` stays
  // stable for slug derivation (anchor IDs in URLs). Currently used
  // only to render "Closing" instead of "Funded" when a Resolve-ending
  // Track's Recommendation is in `committed` state — the formalities
  // (underwriting, closing, disbursement) are pending but the loan is
  // not yet active. Keeping the slug stable means existing URLs (e.g.,
  // `/growth-conversations/jenny#stage-funded`) continue to resolve.
  displayLabel?: string;
  state: TrackStageState;
  // For accessibility / hover tooltips. The kind tells the renderer
  // whether to use the GrowthStep label, the post-Track lifecycle label,
  // or the terminal label so styling can vary if needed.
  kind: "track_step" | "lifecycle_pending" | "lifecycle_terminal";
};

// Sprint 4 §4.1d Block B — shared slugification for stage anchor IDs.
// Used by the Growth Conversations page (to assign DOM ids on stage
// sections) and by TrackProgressDots (to construct hyperlink hrefs).
// Both sides must agree, so the function lives here next to TrackStage.
export function slugifyStageLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Compute the journey progress stages for a given Track + Member.
 * Returns null if the Track can't be resolved (e.g., the member has no
 * Recommendation tied to this Track and the Track isn't currently being
 * suggested by the rule engine — in that case the caller can render all
 * stages as upcoming).
 *
 * Caller passes the Track's resolved data (steps in order) + the Member's
 * resolved Recommendation/executions to keep Prisma I/O at the page boundary.
 *
 * Sprint 2 Prompt 2 §A: completion tracking is step-id-based (per Track-step
 * instance), not step-shape-based. Cygnus's Track has two distinct Ask
 * steps in sequence (`probe_capital_event_evaluation` and
 * `discover_timing_driver`); shape-based tracking would mark both as
 * completed if either ran. Each step instance gets its own dot, even if
 * shapes repeat within a Track.
 */
export function computeTrackStages(input: {
  // Track steps in sequence position order. `id` lets us identify the
  // specific step instance; `step_shape` is used for label rendering and
  // post-Track-shape inference.
  track_steps: Array<{
    id: string;
    step_shape: "ask" | "size" | "show" | "propose" | "resolve" | "connect";
  }>;
  // GrowthStepExecution rows for this Member, scoped to executions whose
  // step belongs to this Track. Each carries the executed step's id; a
  // stage is `completed` iff there's a row pointing to that specific
  // step instance.
  member_executions_for_track: Array<{
    growth_step_id: string;
  }>;
  // The Member's active Recommendation for this Track, if one exists.
  // Drives stage N+1 / N+2 state.
  recommendation_response: RecommendationResponse | null;
}): TrackStage[] {
  const { track_steps, member_executions_for_track, recommendation_response } = input;

  const stages: TrackStage[] = [];
  const executedStepIds = new Set(
    member_executions_for_track.map((e) => e.growth_step_id),
  );

  // Pre-compute per-shape occurrence counts so we can disambiguate
  // repeated shapes in labels: Cygnus's Track shows "Ask 1" / "Ask 2"
  // rather than two ambiguous "Ask" labels. When a shape appears once,
  // the label is just the capitalized shape ("Size", "Show").
  const shapeTotals = new Map<string, number>();
  for (const step of track_steps) {
    shapeTotals.set(step.step_shape, (shapeTotals.get(step.step_shape) ?? 0) + 1);
  }
  const shapeRunningCounts = new Map<string, number>();

  for (const step of track_steps) {
    const completed = executedStepIds.has(step.id);
    const total = shapeTotals.get(step.step_shape) ?? 1;
    const running = (shapeRunningCounts.get(step.step_shape) ?? 0) + 1;
    shapeRunningCounts.set(step.step_shape, running);
    const label =
      total > 1
        ? `${capitalize(step.step_shape)} ${running}`
        : capitalize(step.step_shape);
    stages.push({
      label,
      state: completed ? "completed" : "upcoming",
      kind: "track_step",
    });
  }

  // Promote the first non-completed Track step to "current" (only relevant
  // for partial-Track-run demos; with current seed data this no-ops since
  // all four steps are completed).
  const firstUpcoming = stages.findIndex((s) => s.state === "upcoming");
  if (firstUpcoming !== -1) {
    stages[firstUpcoming].state = "current";
  }

  // Determine post-Track shape based on the final step's step_shape.
  const finalStepShape = track_steps[track_steps.length - 1]?.step_shape;
  const isResolveTrack = finalStepShape === "resolve";
  const isConnectTrack = finalStepShape === "connect";

  // Stage N+1 — lifecycle pending.
  let pendingLabel = "Decision pending";
  let terminalLabel = "Funded";
  if (isConnectTrack) {
    pendingLabel = "Specialist engagement";
    terminalLabel = "Closed";
  }

  // State of N+1 / N+2 derives from recommendation_response. Sprint 4
  // §4.2a refinement (post-4.2a visual review fix #3) split `committed`
  // out of the engaged-cluster bucket. Earlier mapping conflated the
  // three "active engagement" responses (engaged | leaning_yes |
  // committed) onto Decision pending = current; that lost the
  // semantically important "the decision is now made" signal at
  // commitment. Decision pending is the *deciding* stage — once a
  // Member commits, the deciding is over and Funded becomes the
  // current stage (awaiting disbursement). The four-bucket mapping:
  //
  //   funded                          → N+1 completed, N+2 completed
  //   committed                       → N+1 completed, N+2 current
  //                                     ("decision is made; awaiting fund")
  //   leaning_yes | engaged           → N+1 current,   N+2 upcoming
  //                                     ("decision still pending")
  //   neutral | leaning_no | skeptical
  //     | confused | dismissive
  //     | declined | null             → N+1 upcoming,  N+2 upcoming
  //
  // For Connect tracks the same mapping holds — the post-Track journey
  // shape is the same shape (pending → terminal), even though the
  // banker-facing labels differ ("Specialist engagement" / "Closed").
  // A `committed` Connect-Track Member sees Specialist engagement
  // completed and Closed current, with the same semantic.
  //
  // Architectural note (per the visual review root-cause discussion):
  // lifecycle states are derived from Recommendation.response — a
  // state-machine-style read — rather than from a per-stage event log.
  // Pilot phase may want explicit GrowthStepExecution rows for
  // lifecycle stage transitions (decision_pending entered/exited,
  // funded entered) to support richer audit + correlation analytics.
  // For the demo, the state-machine derivation is sufficient and
  // matches the existing Recommendation-as-source-of-truth pattern.
  let pendingState: TrackStageState = "upcoming";
  let terminalState: TrackStageState = "upcoming";

  if (recommendation_response === "funded") {
    pendingState = "completed";
    terminalState = "completed";
  } else if (recommendation_response === "committed") {
    // Decision is made; awaiting disbursement. Decision pending is
    // past, Funded is the current waypoint.
    pendingState = "completed";
    terminalState = "current";
  } else if (
    recommendation_response === "leaning_yes" ||
    recommendation_response === "engaged"
  ) {
    // Mid-journey post-Track. If any Track step is still "current" (a
    // partial-execution case), demote pending to upcoming so the journey
    // doesn't show two simultaneous "current" stages. For demo seed data
    // this never triggers (all Track steps are completed).
    const trackStepCurrentExists = stages.some((s) => s.state === "current");
    pendingState = trackStepCurrentExists ? "upcoming" : "current";
  }

  stages.push({
    label: pendingLabel,
    state: pendingState,
    kind: "lifecycle_pending",
  });
  // Sprint 4 §4.2a refinement #2 — when the Member has committed but
  // the loan hasn't funded yet, the terminal stage represents the
  // formalities-pending phase (underwriting, closing, disbursement).
  // For Resolve-ending Tracks we relabel "Funded" → "Closing" via
  // displayLabel so bankers visually distinguish "committed" (deal is
  // happening but not active) from "funded" (money is in account).
  // The canonical `label` stays "Funded" so anchor slugs (used by URL
  // fragments like `#stage-funded`) remain stable. Connect-ending
  // Tracks keep "Closed" — the dot's current/orange-ringed state
  // already conveys "closure is in progress" for that path.
  const terminalDisplayLabel =
    isResolveTrack &&
    recommendation_response === "committed" &&
    terminalState === "current"
      ? "Closing"
      : undefined;
  stages.push({
    label: terminalLabel,
    displayLabel: terminalDisplayLabel,
    state: terminalState,
    kind: "lifecycle_terminal",
  });

  return stages;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Convenience wrapper — fetches the data computeTrackStages needs, given a
 * Track id and a Member id. Returns null if the Track doesn't exist.
 *
 * The Member's recommendation_response is read from the Recommendation
 * whose originating GrowthStepExecution belongs to a step in this Track
 * (the demo's one-Track-per-Recommendation shape; in production a Member
 * with multiple Tracks-in-flight would need a different lookup).
 */
export async function computeTrackProgress(
  prisma: PrismaClient,
  memberId: string,
  trackId: string,
): Promise<TrackStage[] | null> {
  const track = await prisma.growthTrack.findUnique({
    where: { id: trackId },
    select: {
      growth_step_sequence: {
        orderBy: { position: "asc" },
        select: {
          growth_step: { select: { id: true, step_shape: true } },
        },
      },
    },
  });
  if (!track) return null;

  const trackStepIds = track.growth_step_sequence.map((s) => s.growth_step.id);

  const memberExecutions = await prisma.growthStepExecution.findMany({
    where: {
      conversation: { member_id: memberId },
      growth_step_id: { in: trackStepIds },
    },
    // Sprint 2 Prompt 2 §A: select the executed step's id, not its shape.
    // Completion is per-instance; two shape-collisions in the Track must
    // not register as one-implies-the-other.
    select: { growth_step_id: true },
  });

  // Find the Member's Recommendation tied to this Track (if any). The
  // Recommendation's growth_step_execution's step is one of the Track's
  // steps, so we filter through the join.
  const recommendation = await prisma.recommendation.findFirst({
    where: {
      member_id: memberId,
      growth_step_execution: {
        growth_step_id: { in: trackStepIds },
      },
    },
    select: { response: true },
  });

  return computeTrackStages({
    track_steps: track.growth_step_sequence.map((s) => ({
      id: s.growth_step.id,
      step_shape: s.growth_step.step_shape,
    })),
    member_executions_for_track: memberExecutions
      .filter((e): e is typeof e & { growth_step_id: string } => e.growth_step_id !== null)
      .map((e) => ({ growth_step_id: e.growth_step_id })),
    recommendation_response: recommendation?.response ?? null,
  });
}

export type SuggestedNextStep =
  | {
      kind: "advance_opportunity";
      recommendation: {
        id: string;
        product_name: string;
        // Sprint 4 §A.4 — structured size capture. size_proposed retained
        // for back-compat with legacy data; new code reads size_low /
        // size_high via formatRecommendationSize().
        size_proposed: number | null;
        size_low: number | null;
        size_high: number | null;
        response: RecommendationResponse;
        primary_concern: string | null;
        rationale_summary: string | null;
        track_id: string | null; // GrowthTrack.id of the originating Track, if derivable
      };
      next_action_description: string;
      linked_action_card_id?: string;
    }
  | {
      kind: "run_track";
      track: {
        id: string;
        name: string;
        description: string;
        banker_facing_purpose: string | null;
      };
      rule: { name: string; confidence_band: "low" | "medium" | "high" };
    }
  | null;

// Active engagement responses — Members in any of these states are "in
// motion" on the opportunity. `funded` and `declined` are terminal and
// excluded; the remaining sub-mid-journey states (skeptical, confused,
// dismissive, leaning_no, neutral) signal the opportunity is on the table
// but the member's stance isn't yet positive enough that "Follow up on it"
// is the right card framing — those Members get the run_track card with the
// rule engine's suggestion (which may be the same Track or a different one).
const ACTIVE_ENGAGED_RESPONSES: RecommendationResponse[] = [
  "engaged",
  "leaning_yes",
  "committed",
];

// Map primary_concern → concrete next-action description. Keep these
// single-sentence and member-facing-register-aware (the description is
// banker-facing prose but its target action will become member-facing copy
// when the Meeting Recap module ships in Sprint 4).
function nextActionFromConcern(
  concern: string | null,
  product_name: string,
): string {
  switch (concern) {
    case "spouse":
      return `Schedule joint call with member's spouse to advance the ${product_name}.`;
    case "cpa":
      return `Follow up after the member's CPA review of the ${product_name}.`;
    case "partner":
      return `Schedule a conversation with the business partner to advance the ${product_name}.`;
    case "rate":
      return `Re-engage on pricing for the ${product_name}.`;
    case "speed":
      return `Confirm timing for the ${product_name} aligns with the member's window.`;
    case "commitment":
      return `Discuss commitment-level options (phased structure, smaller pilot) for the ${product_name}.`;
    case "timing":
      return `Re-engage on the ${product_name} when the member's timing window opens.`;
    case "bank_capability":
      return `Confirm the specialist introduction for the ${product_name} landed.`;
    case "other":
      return `Follow up on the recorded concern to advance the ${product_name}.`;
    case "none":
    case null:
    case undefined:
    default:
      return `Follow up to advance the ${product_name}.`;
  }
}

export async function computeSuggestedNextStep(
  prisma: PrismaClient,
  memberId: string,
  now: Date,
): Promise<SuggestedNextStep> {
  // ─── Branch 1 — active engaged Recommendation? ──────────────────
  // Sprint 2 Prompt 2 §B.3 — order by updated_at desc. With Prisma's
  // @updatedAt directive, the most-recently-engaged Recommendation
  // sorts first. For the demo (one engaged Rec per Member) this is
  // equivalent to created_at; in production, a Member with multiple
  // opportunities in flight will see the freshly engaged one surfaced
  // ahead of older ones that have been quiet.
  const engaged = await prisma.recommendation.findMany({
    where: {
      member_id: memberId,
      response: { in: ACTIVE_ENGAGED_RESPONSES },
    },
    include: {
      product: { select: { name: true } },
      growth_step_execution: {
        select: {
          conversation_id: true,
          growth_step: {
            select: {
              growth_track_steps: {
                select: { growth_track_id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { updated_at: "desc" },
    take: 1,
  });

  if (engaged.length > 0) {
    const r = engaged[0];

    // Find a linked overdue ActionCard for this Recommendation, if any.
    // "Linked" = the ActionCard's origin_conversation is the same
    // conversation that produced this Recommendation. This matches the
    // dedup logic already used in lib/priorities.ts.
    const linkedOverdueCard = await prisma.actionCard.findFirst({
      where: {
        member_id: memberId,
        status: { in: ["open", "in_progress"] },
        due_at: { lt: now },
        origin_conversation_id: r.growth_step_execution.conversation_id,
      },
      orderBy: { due_at: "asc" },
    });

    // Derivation order per §B.2:
    //   1. linked overdue ActionCard rationale (truncated)
    //   2. concern-mapped description (handles all primary_concern enum values)
    //   3. generic fallback
    let next_action_description: string;
    if (linkedOverdueCard) {
      const rationale = linkedOverdueCard.rationale;
      next_action_description =
        rationale.length > 160 ? `${rationale.slice(0, 160)}…` : rationale;
    } else {
      next_action_description = nextActionFromConcern(
        r.primary_concern,
        r.product.name,
      );
    }

    return {
      kind: "advance_opportunity",
      recommendation: {
        id: r.id,
        product_name: r.product.name,
        size_proposed: r.size_proposed,
        size_low: r.size_low,
        size_high: r.size_high,
        response: r.response,
        primary_concern: r.primary_concern,
        rationale_summary: r.rationale_summary,
        track_id:
          r.growth_step_execution.growth_step?.growth_track_steps[0]?.growth_track_id ?? null,
      },
      next_action_description,
      linked_action_card_id: linkedOverdueCard?.id,
    };
  }

  // ─── Branch 2 — fall through to rule-engine logic ───────────────
  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    select: { id: true, member_type_id: true, core_sync_state: true },
  });
  const activeSignals = await prisma.signal.findMany({
    where: { member_id: memberId, active: true },
    select: { topic_id: true },
  });
  const heldRaw =
    (member.core_sync_state as { products_held?: { product_id: string }[] })
      .products_held ?? [];
  const productsHeld: { product_subcategory: string }[] = (
    await Promise.all(
      heldRaw.map(async (p) => {
        const pr = await prisma.product.findUnique({
          where: { id: p.product_id },
          select: { subcategory: true },
        });
        return pr ? { product_subcategory: pr.subcategory as string } : null;
      }),
    )
  ).filter((x): x is { product_subcategory: string } => x !== null);

  const rules = await prisma.rule.findMany({
    include: {
      output_growth_tracks: {
        select: {
          id: true,
          name: true,
          description: true,
          banker_facing_purpose: true,
        },
      },
    },
  });

  const ranked = fireRules(
    rules.map((r) => ({
      id: r.id,
      name: r.name,
      conditions: r.conditions as RuleConditions,
      confidence_band: r.confidence_band,
      output_growth_tracks: r.output_growth_tracks.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    })),
    {
      member: { id: member.id, member_type_id: member.member_type_id },
      activeSignals,
      productsHeld,
    },
  );

  const top = ranked[0];
  const topTrackId = top?.growth_tracks[0]?.id;
  const topTrackFull = topTrackId
    ? rules
        .flatMap((r) => r.output_growth_tracks)
        .find((t) => t.id === topTrackId)
    : null;

  if (!top || !topTrackFull) return null;

  return {
    kind: "run_track",
    track: {
      id: topTrackFull.id,
      name: topTrackFull.name,
      description: topTrackFull.description,
      banker_facing_purpose: topTrackFull.banker_facing_purpose,
    },
    rule: {
      name: top.rule.name,
      confidence_band: top.rule.confidence_band,
    },
  };
}
