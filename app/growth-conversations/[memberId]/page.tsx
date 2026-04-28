/*
 * Growth Conversations — prefilled entry (Sprint 4 §C / §E).
 *
 * Entered when the banker clicks "Run Growth Track" / "Run follow-up"
 * on a Member profile, or selects a Member from the standalone-entry
 * lookup. The Member is preloaded; the page shows the single scrolling
 * page architecture with all stages visible (Ask · Size · Show ·
 * Resolve / Connect · Decision pending / Specialist engagement · Funded
 * / Closed) and an anchor progress bar in the right column.
 *
 * Sprint 4 Prompt 4.1a deliberately ships *no* capture forms — each stage
 * section renders either a read-only summary of what was captured (when
 * a GrowthStepExecution exists for that step) or a placeholder
 * announcing the upcoming form work. Capture forms land in 4.1b (Ask)
 * and the subsequent prompts. The architecture is the deliverable.
 */

import "dotenv/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import {
  computeSuggestedNextStep,
  computeTrackProgress,
  slugifyStageLabel,
} from "@/lib/suggested-next-step";
import { getStageGuidance, type StepPhase } from "@/lib/stage-guidance";
import { GrowthConversationsHeader } from "../_shared";
import {
  AnchorProgressBar,
  type AnchorStage,
} from "./anchor-progress-bar";
import { Breadcrumb } from "@/app/_components/breadcrumb";
import {
  AskSection,
  type AskTopic,
  type AskPriorSignal,
} from "./ask-section";
import {
  SizeSection,
  type SizeDimensionOption,
  type SizePriorMeasurement,
} from "./size-section";
import {
  ResolveSection,
  type ResolveBankerOption,
  type ResolveCurrentState,
  type ResolveIndecisionTopicOption,
} from "./resolve-section";
import { formatRecommendationSize } from "@/lib/format-size";

function getPrisma() {
  const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
    /^file:/,
    "",
  );
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) });
}

const NOW = new Date("2026-04-25T12:00:00Z");

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function GrowthConversationsPrefilledPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId: slug } = await params;
  const prisma = getPrisma();

  const member = await prisma.member.findUnique({
    where: { slug },
    include: {
      primary_banker: { select: { id: true, display_name: true } },
      member_type: { select: { name: true } },
      // Pull executions + their relations so the read-only summaries
      // can show what was captured at each stage. The query mirrors the
      // Member profile's includes — the same data shape powers both
      // surfaces.
      conversations: {
        orderBy: { created_at: "desc" },
        include: {
          banker: { select: { display_name: true } },
          growth_step_executions: {
            include: {
              growth_step: { include: { artifact: true } },
              produced_signals: { include: { topic: true } },
              produced_action_cards: { include: { owner: true } },
              produced_recommendation: { include: { product: true } },
            },
            orderBy: { sequence_position: "asc" },
          },
        },
      },
      // Sprint 4 §4.1c — active Signals power the Ask augmenting
      // summary. Filter to active=true (not yet superseded); include
      // topic display_name and the originating Conversation context for
      // the expanded-detail view.
      signals: {
        where: { active: true },
        include: {
          topic: { select: { id: true, display_name: true, topic_type: true } },
          conversation: {
            select: {
              created_at: true,
              meeting_type: true,
              banker: { select: { display_name: true } },
            },
          },
        },
        orderBy: { captured_at: "desc" },
      },
      // Sprint 4 §4.2a Block B — active SizingMeasurements with the
      // conversation + banker context the augmenting summary needs.
      sizing_measurements: {
        where: { active: true },
        include: {
          dimension: { select: { id: true, display_name: true } },
          conversation: {
            select: {
              created_at: true,
              meeting_type: true,
              banker: { select: { display_name: true } },
            },
          },
        },
        orderBy: { captured_at: "desc" },
      },
    },
  });

  if (!member) {
    await prisma.$disconnect();
    notFound();
  }

  // Find the suggestion for this Member; in advance_opportunity mode, the
  // Track id comes from the Recommendation; in run_track mode, from the
  // rule engine. Either way, the dots/sections render the same Track.
  const nextStep = await computeSuggestedNextStep(prisma, member.id, NOW);
  const trackId =
    nextStep?.kind === "advance_opportunity"
      ? nextStep.recommendation.track_id
      : nextStep?.kind === "run_track"
      ? nextStep.track.id
      : null;
  const stages = trackId
    ? await computeTrackProgress(prisma, member.id, trackId)
    : null;

  // Pull the Track's growth-step-id sequence so each Track-step section
  // can find the matching GrowthStepExecution (when one exists). The
  // sequence is the source of truth for both the per-stage section ids
  // and the read-only summary lookup.
  const trackSteps = trackId
    ? (
        await prisma.growthTrack.findUnique({
          where: { id: trackId },
          select: {
            growth_step_sequence: {
              orderBy: { position: "asc" },
              select: {
                growth_step: {
                  select: {
                    id: true,
                    title: true,
                    step_shape: true,
                  },
                },
              },
            },
          },
        })
      )?.growth_step_sequence ?? []
    : [];

  // Sprint 4 §4.1c — Ask form data. Topics-by-SignalType for the
  // sub-form dropdowns; a "current banker" id for save attribution.
  // The simulated current banker for the demo is the Member's primary
  // banker (Sprint 6 will add identity-switching).
  const askTopics = await prisma.topic.findMany({
    where: { topic_type: { in: ["goal", "blocker", "trigger", "indecision"] } },
    select: { id: true, display_name: true, topic_type: true },
    orderBy: { display_name: "asc" },
  });
  const topicsByType: Record<
    "goal" | "blocker" | "trigger" | "indecision",
    AskTopic[]
  > = { goal: [], blocker: [], trigger: [], indecision: [] };
  for (const t of askTopics) {
    const k = t.topic_type as "goal" | "blocker" | "trigger" | "indecision";
    topicsByType[k].push({ id: t.id, display_name: t.display_name, type: k });
  }

  // Serialize the active Signals into the AskPriorSignal shape (ISO
  // date strings + flat scalar fields so the client component doesn't
  // need to know the schema include shape).
  const askPriorSignals: AskPriorSignal[] = member.signals
    .filter((s) =>
      ["goal", "blocker", "trigger", "indecision"].includes(s.type),
    )
    .map((s) => ({
      id: s.id,
      type: s.type as "goal" | "blocker" | "trigger" | "indecision",
      topic_id: s.topic_id,
      topic_display_name: s.topic.display_name,
      their_words: s.their_words,
      severity: s.severity,
      recency: s.recency,
      time_horizon: s.time_horizon,
      confidence: s.confidence,
      magnitude: s.magnitude,
      unit: s.unit,
      frequency: s.frequency,
      captured_at: s.captured_at.toISOString(),
      conversation_meeting_type: s.conversation.meeting_type,
      conversation_date: s.conversation.created_at.toISOString(),
      banker_display_name: s.conversation.banker.display_name,
    }));

  // Sprint 4 §4.2a Block B — Size phase reference data + prior captures.
  const sizingDimensionsRaw = await prisma.sizingDimension.findMany({
    select: { id: true, key: true, display_name: true, description: true },
    orderBy: { display_name: "asc" },
  });
  const sizingDimensions: SizeDimensionOption[] = sizingDimensionsRaw;

  const sizePriorMeasurements: SizePriorMeasurement[] =
    member.sizing_measurements.map((m) => ({
      id: m.id,
      dimension_id: m.dimension_id,
      dimension_display_name: m.dimension.display_name,
      magnitude: m.magnitude,
      // The DB column is plain TEXT; the client type narrows it.
      unit: m.unit as SizePriorMeasurement["unit"],
      frequency: m.frequency,
      source: m.source as SizePriorMeasurement["source"],
      their_words: m.their_words,
      confidence: m.confidence as SizePriorMeasurement["confidence"],
      time_period: m.time_period,
      methodology_note: m.methodology_note,
      captured_at: m.captured_at.toISOString(),
      conversation_meeting_type: m.conversation.meeting_type,
      conversation_date: m.conversation.created_at.toISOString(),
      banker_display_name: m.conversation.banker.display_name,
    }));

  // Sprint 4 §4.2a Block C — Resolve form data.
  // Active bankers populate the ActionCard owner dropdown (default to
  // current banker; cross-banker handoff supported when needed).
  const bankersRaw = await prisma.banker.findMany({
    where: { status: "active" },
    select: { id: true, display_name: true },
    orderBy: { display_name: "asc" },
  });
  const resolveBankers: ResolveBankerOption[] = bankersRaw;

  // Indecision Topics power the optional indecision sub-form. Pulled
  // from the existing askTopics list — same Topic table, filtered to
  // topic_type = "indecision".
  const resolveIndecisionTopics: ResolveIndecisionTopicOption[] = askTopics
    .filter((t) => t.topic_type === "indecision")
    .map((t) => ({ id: t.id, display_name: t.display_name }));

  // Find the Track's current Recommendation (if any). Demo pattern: each
  // Member has at most one active Recommendation per Track, so a single
  // findFirst keyed by member_id is sufficient. Pilot phase with multi-
  // Track-in-flight Members would key on growth_step_execution →
  // growth_step → Track relation instead.
  const trackRecommendation = trackId
    ? await prisma.recommendation.findFirst({
        where: { member_id: member.id },
        include: { product: true },
      })
    : null;

  // Find the most recent open ActionCard for this Member; surfaces in
  // the Resolve view-mode summary as "Open ActionCard". Only one is
  // surfaced for demo simplicity; the Member profile's Open
  // opportunities band remains the canonical multi-card list.
  const openActionCard = await prisma.actionCard.findFirst({
    where: {
      member_id: member.id,
      status: { in: ["open", "in_progress"] },
    },
    include: { owner: { select: { display_name: true } } },
    orderBy: { due_at: "asc" },
  });

  // Locate the Track's Resolve GrowthStep id (Resolve is Track-aware
  // unlike Ask + Size). Cygnus's Connect-ending Track has no Resolve
  // step — null in that case, and the Resolve render branch will not
  // fire.
  const resolveTrackStep = trackSteps.find(
    (ts) => ts.growth_step.step_shape === "resolve",
  );
  const resolveGrowthStepId = resolveTrackStep?.growth_step.id ?? null;

  // Compose the current-state shape ResolveSection's view-mode renders.
  const resolveCurrent: ResolveCurrentState | null = trackRecommendation
    ? {
        recommendation_id: trackRecommendation.id,
        recommendation_label: `${trackRecommendation.product.name}${
          trackRecommendation.size_proposed ||
          trackRecommendation.size_low ||
          trackRecommendation.size_high
            ? ` at ${formatRecommendationSize(trackRecommendation)}`
            : ""
        }`,
        response: trackRecommendation.response as ResolveCurrentState["response"],
        primary_concern:
          trackRecommendation.primary_concern as ResolveCurrentState["primary_concern"],
        their_words: trackRecommendation.their_words,
        open_action_card: openActionCard
          ? {
              id: openActionCard.id,
              rationale: openActionCard.rationale,
              owner_display_name: openActionCard.owner.display_name,
              due_at_iso: openActionCard.due_at.toISOString(),
            }
          : null,
      }
    : null;

  await prisma.$disconnect();

  if (!stages) {
    // No Track suggested for this Member — render a minimal empty-state
    // page rather than throw. Demo doesn't hit this path (all three
    // Members have an engaged Recommendation); covered for safety.
    return (
      <div className="min-h-screen w-full bg-blaze-paper">
        <div
          className="h-8 w-full"
          style={{ backgroundImage: "var(--blaze-gradient)" }}
          aria-hidden
        />
        <GrowthConversationsHeader
          bankerName={member.primary_banker.display_name}
          backToMemberSlug={slug}
        />
        <main className="mx-auto max-w-6xl px-8 py-12">
          <p className="text-sm text-blaze-grey-body">
            No Growth Track is currently suggested for{" "}
            {member.doing_business_as ?? member.legal_name}. Sprint 4 Prompt
            4.1b will introduce the Ask + Size discovery flow that surfaces
            Tracks as Signals are captured.
          </p>
        </main>
      </div>
    );
  }

  // Build a parallel array of "execution for this stage" so each section
  // can render a read-only summary when an execution exists. For Track-
  // step stages (the first N stages), the index aligns with trackSteps;
  // post-Track lifecycle stages (N+1, N+2) have no execution to look up.
  type StageExecution =
    (typeof member.conversations)[number]["growth_step_executions"][number];
  const executionByStepId = new Map<string, StageExecution>();
  for (const c of member.conversations) {
    for (const e of c.growth_step_executions) {
      // growth_step is nullable post-Sprint-4-§4.1c (track-agnostic Ask /
      // Size executions have null growth_step). Skip those for the
      // step-id keyed map; the AskSection has its own data path.
      if (e.growth_step) {
        executionByStepId.set(e.growth_step.id, e);
      }
    }
  }

  // Compute anchor stages (stage + DOM id) — pair the stages array with
  // a slug derived from the label. For repeated labels in track_step
  // shapes (Cygnus's Ask 1 / Ask 2), the slugify already produces unique
  // ids ("ask-1", "ask-2"); for unique labels, the slug matches the
  // shape ("ask", "size", "show", "resolve", "connect"). Lifecycle
  // stages slugify to "decision-pending" / "funded" /
  // "specialist-engagement" / "closed".
  const anchorStages: AnchorStage[] = stages.map((s) => ({
    ...s,
    anchor_id: `stage-${slugifyStageLabel(s.label)}`,
  }));

  // Sprint 4 §4.1c — for Tracks with multiple Ask steps (Cygnus's), only
  // the first Ask section gets the interactive AskSection; subsequent
  // Ask sections render a cross-reference pointing to the first.
  // anchorStages is parallel to trackSteps for the first N entries
  // (track_step kind); we collect indices of stages whose underlying
  // step_shape is "ask".
  const askStageIndices: number[] = [];
  anchorStages.forEach((stage, i) => {
    if (stage.kind === "track_step" && trackSteps[i]?.growth_step.step_shape === "ask") {
      askStageIndices.push(i);
    }
  });

  return (
    <div className="min-h-screen w-full bg-blaze-paper">
      <div
        className="h-8 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
      <GrowthConversationsHeader
        bankerName={member.primary_banker.display_name}
      />

      {/* Sprint 4 §4.1b C — breadcrumb. The "Growth Conversations"
          segment links to the standalone-entry page; the Member name is
          the terminal (current) segment. */}
      <div className="mx-auto max-w-6xl px-8 pt-4">
        <Breadcrumb
          segments={[
            { label: "Member Signals", href: "/members/jenny" },
            { label: "Growth Conversations", href: "/growth-conversations" },
            {
              label: member.doing_business_as ?? member.legal_name,
              current: true,
            },
          ]}
        />
      </div>

      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Member identity block — banker landing on this page needs
            immediate orientation about whose conversation this is. Compact
            treatment; the canonical identity surface is the Member profile
            sidebar. */}
        <section>
          <h1 className="text-3xl font-semibold leading-tight text-black">
            {member.doing_business_as ?? member.legal_name}
          </h1>
          <p className="mt-1 text-sm text-blaze-grey-body">
            {member.member_type.name} ·{" "}
            <Link
              href={`/members/${slug}`}
              className="text-blaze-orange-deep underline-offset-2 hover:underline"
            >
              View Member profile
            </Link>
          </p>
        </section>

        {/* Two-column layout per Sprint 4 §E.1: left ~70% scroll content,
            right ~30% sticky anchor progress bar. The sticky positioning
            on the right column keeps the bar in view as the banker
            scrolls through stages on the left. */}
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
          <main className="space-y-12">
            {anchorStages.map((stage, i) => {
              // Track-step stages are the first N entries (where N =
              // trackSteps.length); the index aligns with trackSteps.
              const trackStep =
                stage.kind === "track_step" ? trackSteps[i] : null;
              const execution = trackStep
                ? executionByStepId.get(trackStep.growth_step.id)
                : null;
              // Sprint 4 §4.2a Block A — derive the canonical step phase
              // for the stage-guidance lookup. Track-step stages read
              // step_shape directly; lifecycle stages map by label.
              const stepPhase: StepPhase | null = trackStep
                ? (trackStep.growth_step.step_shape as StepPhase)
                : stage.label === "Decision pending"
                ? "decision_pending"
                : stage.label === "Funded"
                ? "funded"
                : stage.label === "Specialist engagement"
                ? "specialist_engagement"
                : stage.label === "Closed"
                ? "closed"
                : null;
              const guidance = stepPhase
                ? getStageGuidance(
                    member.member_type.name,
                    stepPhase,
                    stage.label,
                  )
                : null;
              return (
                <section
                  key={stage.anchor_id}
                  id={stage.anchor_id}
                  className="scroll-mt-24"
                >
                  {/* Stage section header: orange mark + label + stage
                      counter. Sprint 4 §4.1b A — completed Track-step
                      stages get a small orange checkmark indicator before
                      the stage counter. Lifecycle stages (Decision pending,
                      Funded, Specialist engagement, Closed) do NOT get the
                      checkmark — those have a separate lifecycle treatment
                      tracked by the Member profile's Open opportunities
                      band. */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline">
                      <span
                        aria-hidden
                        className="mr-3 inline-block h-6 w-[27px] bg-blaze-orange"
                      />
                      {/* Sprint 4 §4.2a refinement #2 — render
                          displayLabel where present so committed-but-
                          not-funded shows "Closing" instead of "Funded".
                          Anchor IDs continue to use the canonical label
                          slug, so URL fragments stay stable. */}
                      <span className="text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none">
                        {stage.displayLabel ?? stage.label}
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-xs text-blaze-grey-body">
                      {stage.kind === "track_step" && stage.state === "completed" && (
                        <>
                          <CompletedCheckmark
                            label={`${stage.displayLabel ?? stage.label} captured`}
                          />
                          <span aria-hidden>·</span>
                        </>
                      )}
                      <span>
                        Stage {i + 1} of {anchorStages.length}
                      </span>
                    </span>
                  </div>

                  {/* Sprint 4 §4.2a Block A — stage guidance paragraph
                      for Track-step stages only. Renders below the
                      section header and above any capture content or
                      read-only summary. Lifecycle stages (Decision
                      pending, Funded, Specialist engagement, Closed)
                      route guidance into their dashed-border placeholder
                      instead of rendering it twice — see StagePlaceholder
                      below. Member-Type-aware content lives in
                      lib/stage-guidance.ts. Visual treatment per §A.4:
                      full-width body text, slightly muted, non-italic,
                      ~25-50 words. */}
                  {stage.kind === "track_step" && guidance && (
                    <p
                      className="mt-3 max-w-3xl text-sm leading-relaxed text-blaze-grey-body"
                      data-stage-guidance
                    >
                      {guidance}
                    </p>
                  )}

                  <div className="mt-5">
                    {/* Sprint 4 §4.1c — the Ask phase becomes an
                        interactive capture surface. AskSection handles
                        both the augmenting summary (when prior captures
                        exist) and the capture form (when new ones are
                        added). The Ask phase is track-agnostic, so we
                        render a single AskSection on the *first* Ask
                        stage and render a brief cross-reference on the
                        second Ask stage (Cygnus's Track has two Ask
                        steps; both share the same Member-level signals).
                        Other Track-step kinds (Size, Show, Resolve,
                        Connect) keep the read-only/placeholder treatment
                        until Sprint 4 Prompt 4.2 adds their forms. */}
                    {trackStep?.growth_step.step_shape === "ask" ? (
                      i === askStageIndices[0] ? (
                        <AskSection
                          memberId={member.id}
                          bankerId={member.primary_banker.id}
                          conversationId={null}
                          priorSignals={askPriorSignals}
                          topicsByType={topicsByType}
                        />
                      ) : (
                        <p className="border-l-[3px] border-blaze-rule pl-4 text-xs text-blaze-grey-body">
                          Track-agnostic Ask captures are shared across all
                          Ask stages in this Track. Manage captures in the
                          first Ask section above.
                        </p>
                      )
                    ) : trackStep?.growth_step.step_shape === "size" ? (
                      // Sprint 4 §4.2a Block B — Size is track-agnostic
                      // like Ask; SizeSection handles both the augmenting
                      // summary and the capture form.
                      <SizeSection
                        memberId={member.id}
                        bankerId={member.primary_banker.id}
                        conversationId={null}
                        priorMeasurements={sizePriorMeasurements}
                        dimensions={sizingDimensions}
                      />
                    ) : trackStep?.growth_step.step_shape === "resolve" &&
                      resolveGrowthStepId ? (
                      // Sprint 4 §4.2a Block C — Resolve is Track-aware.
                      // ResolveSection renders the closure capture (Member
                      // response + primary concern + optional Indecision
                      // Signal + ActionCard). Cross-table transaction
                      // (Recommendation + Signal + ActionCard +
                      // GrowthStepExecution) in saveResolveCaptures.
                      <ResolveSection
                        memberId={member.id}
                        bankerId={member.primary_banker.id}
                        conversationId={null}
                        resolveGrowthStepId={resolveGrowthStepId}
                        current={resolveCurrent}
                        bankers={resolveBankers}
                        indecisionTopics={resolveIndecisionTopics}
                      />
                    ) : execution ? (
                      <StageReadOnlySummary execution={execution} />
                    ) : stage.kind === "track_step" ? (
                      <StagePlaceholder
                        kind="track_step"
                        stageLabel={stage.label}
                        guidance={null}
                      />
                    ) : (
                      <StagePlaceholder
                        kind="lifecycle"
                        stageLabel={stage.label}
                        guidance={guidance}
                      />
                    )}
                  </div>
                </section>
              );
            })}
          </main>

          {/* Right column: sticky anchor progress bar. lg:sticky positions
              it relative to the viewport on desktop; on smaller screens
              it stacks below content. */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-blaze-grey-body">
                Stages
              </p>
              <AnchorProgressBar stages={anchorStages} />
            </div>
          </aside>
        </div>
      </div>

      <div
        className="mt-12 h-1 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
    </div>
  );
}

// ============================================================
// Read-only stage summary — Sprint 4 §E.5.
//
// When an execution exists for a Track step, we render what was captured
// rather than a placeholder. Minimum viable: capture date + a list of
// produced entities (signals / action cards / recommendation). Sprint
// 4 Prompt 4.1b will replace the Ask section's read-only treatment with
// the full capture form; later prompts replace the others.
// ============================================================

type Execution = {
  executed_at: Date;
  // Sprint 4 §4.1c — nullable for track-agnostic executions. The
  // StageReadOnlySummary path only renders for executions where the
  // execution-by-step-id map produced a hit, so growth_step is non-null
  // at the call site; the type signature widens to match the Prisma
  // inference shape.
  growth_step: {
    title: string;
    step_shape: "ask" | "size" | "show" | "propose" | "resolve" | "connect";
    artifact: { title: string } | null;
  } | null;
  produced_signals: Array<{
    id: string;
    type: "goal" | "blocker" | "trigger" | "indecision";
    topic: { display_name: string };
  }>;
  produced_action_cards: Array<{
    id: string;
    rationale: string;
    owner: { display_name: string };
  }>;
  produced_recommendation: {
    id: string;
    product: { name: string };
  } | null;
};

function StageReadOnlySummary({ execution }: { execution: Execution }) {
  const sigByType = (type: string) =>
    execution.produced_signals.filter((s) => s.type === type);
  const goals = sigByType("goal");
  const blockers = sigByType("blocker");
  const triggers = sigByType("trigger");
  const indecisions = sigByType("indecision");
  return (
    <div className="border-l-[3px] border-blaze-rule pl-4">
      <p className="text-xs text-blaze-grey-body">
        Captured {fmtDate(execution.executed_at)}
        {execution.growth_step && (
          <>
            {" · "}
            <span className="font-medium text-blaze-charcoal">
              {execution.growth_step.title}
            </span>
          </>
        )}
      </p>
      <ul className="mt-2 space-y-0.5 text-sm leading-relaxed text-blaze-charcoal">
        {goals.map((s) => (
          <li key={s.id}>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            Goal — {s.topic.display_name}
          </li>
        ))}
        {blockers.map((s) => (
          <li key={s.id}>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            Blocker — {s.topic.display_name}
          </li>
        ))}
        {triggers.map((s) => (
          <li key={s.id}>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            Trigger — {s.topic.display_name}
          </li>
        ))}
        {indecisions.map((s) => (
          <li key={s.id}>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            Indecision — {s.topic.display_name}
          </li>
        ))}
        {execution.produced_recommendation && (
          <li>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            Recommendation — {execution.produced_recommendation.product.name}
          </li>
        )}
        {execution.produced_action_cards.map((c) => (
          <li key={c.id}>
            <span className="font-medium text-blaze-orange-deep">
              → produced:
            </span>{" "}
            ActionCard — owned by {c.owner.display_name}
          </li>
        ))}
        {execution.growth_step?.artifact && (
          <li>
            <span className="font-medium text-blaze-orange-deep">
              → shown:
            </span>{" "}
            Artifact — {execution.growth_step.artifact.title}
          </li>
        )}
      </ul>
      <p className="mt-3 text-xs italic text-blaze-grey-soft">
        Update captures (button placeholder — Sprint 4 Prompt 4.1b adds the
        Ask form; later prompts add Size, Show, Resolve, Connect forms).
      </p>
    </div>
  );
}

// ============================================================
// CompletedCheckmark — Sprint 4 §4.1b A.
//
// Inline SVG checkmark for completed Track-step stages. Burnished orange
// (#B45F26) at 14×14px — small enough to live alongside the "Stage N of 6"
// counter without dominating the section header. Inline SVG (not a
// font/icon library) per the prompt's note: emoji checkmarks render
// inconsistently across systems; an SVG keeps the visual exactly aligned
// with the rest of the orange-accent treatment.
// ============================================================

function CompletedCheckmark({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="#B45F26"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3,8 7,12 13,4" />
    </svg>
  );
}

function StagePlaceholder({
  kind,
  stageLabel,
  guidance,
}: {
  kind: "track_step" | "lifecycle";
  stageLabel: string;
  // Sprint 4 §4.2a Block A — for lifecycle stages, the guidance text
  // replaces the prior generic "future sprint when stage-by-stage
  // transitions ship" placeholder. The dashed-border treatment is
  // retained so lifecycle stages still read as different from active
  // capture surfaces. Track-step stages pass null here; they get the
  // upper guidance paragraph instead.
  guidance: string | null;
}) {
  if (kind === "lifecycle") {
    return (
      <div className="border border-dashed border-blaze-rule p-5 text-sm leading-relaxed text-blaze-grey-body">
        <p>
          <span className="font-medium text-blaze-charcoal">{stageLabel}</span>
          {guidance ? <> — {guidance}</> : (
            <> is a post-Track lifecycle stage. The Member profile&rsquo;s
            Open opportunities band tracks this status.</>
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="border border-dashed border-blaze-rule p-5 text-sm text-blaze-grey-body">
      <p>
        Capture form for {stageLabel} arrives in Sprint 4 Prompt 4.2 (Size,
        Show, Resolve, Connect).
      </p>
    </div>
  );
}
