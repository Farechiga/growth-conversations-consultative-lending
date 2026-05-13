/*
 * v2 Member workstation — Sprint 5a.2.
 *
 * Single-page workstation per Member. Sprint 5a.2 lifts UI state
 * (selected Track, popup-open, dialpad-controlled-by-popup-CTA) into
 * `WorkstationShell` (client). This page (Server Component) fetches the
 * data and serializes it down.
 *
 * Layout:
 *   [HEADER]
 *   [COMPLIANCE BANNER]
 *   [KEY FACTS STRIP]
 *   [WORKSTATION SHELL]
 *     ├─ STICKY DIALPAD (controlled)
 *     └─ SIDEBAR (280px) + MAIN PANEL
 *        - Sidebar's Track context dropdown selects current Track
 *        - Click an objective → ObjectivePopup with missing-factor CTAs
 *          and structured captured-evidence rows
 */

import "dotenv/config";
import { notFound } from "next/navigation";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import { ComplianceDisclaimerBanner } from "@/app/_components/compliance-disclaimer-banner";
import { RepresentativeExampleBanner } from "@/app/_components/representative-example-banner";
import { CaptureDisciplineCallout } from "@/app/_components/capture-discipline-callout";
import { V2WorkstationHeader, type OpenThread } from "./header";
import { KeyFactsStrip, type KeyFact } from "./key-facts-strip";
import {
  WorkstationShell,
  type RankedTrackLite,
} from "./workstation-shell";
import {
  type SidebarArtifact,
  type SidebarMacro,
  type SidebarHistoryEntry,
  type SidebarCoachContent,
} from "./sidebar";
import { rankTracksForMember } from "@/lib/track-ranker";
import { type FeedItem } from "./main-panel";
import { RECOMMENDATION_PRIMARY_CONCERN_LABELS } from "@/lib/enum-descriptions";
import { coachBullets, type V2Objective } from "@/lib/stage-guidance";
import type { TrackEvidenceCohort } from "./tracks-supported-panel";
import type { AskPriorSignal, AskTopic } from "@/app/growth-conversations/[memberId]/ask-section";
import type {
  SizeDimensionOption,
  SizePriorMeasurement,
} from "@/app/growth-conversations/[memberId]/size-section";
import type { ModelArtifactOption } from "./capture-forms/model-form";
import type { ReactionShowEventOption } from "./capture-forms/reaction-form";
import type { ActionBankerOption } from "./capture-forms/action-form";
import type { QuantifyFactorOption } from "./capture-forms/quantify-form";
import type {
  FactorCaptureLite,
  BusinessFactorLite,
  TrackTemplateLite,
  EntityCounts,
} from "@/lib/objective-evidence";
import type { DeriveMatrixEntry } from "@/lib/cta-derivation";
import type {
  CapturedRowDisplay,
  InsightDisplay,
  PatternDisplay,
} from "./objective-popup";
import { formatRecommendationSize } from "@/lib/format-size";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

const NOW = new Date("2026-04-25T12:00:00Z");
const STALE_DAYS = 90;

function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isStaleDate(d: Date): boolean {
  return Date.now() - d.getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
}

export default async function V2MemberWorkstationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: slug } = await params;
  const sp = await searchParams;
  const representativeOfRaw = sp.representative_of;
  const exampleForRaw = sp.example_for;
  const representativeOf = Array.isArray(representativeOfRaw)
    ? representativeOfRaw[0]
    : representativeOfRaw;
  const exampleFor = Array.isArray(exampleForRaw)
    ? exampleForRaw[0]
    : exampleForRaw;
  const prisma = getPrisma();

  const member = await prisma.member.findUnique({
    where: { slug },
    include: {
      primary_banker: { select: { id: true, display_name: true } },
      member_type: { select: { id: true, name: true } },
      conversations: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          created_at: true,
          meeting_type: true,
        },
      },
      action_cards: {
        where: { status: { in: ["open", "in_progress"] } },
        orderBy: { due_at: "asc" },
        select: {
          id: true,
          type: true,
          due_at: true,
          rationale: true,
          status_changed_at: true,
          owner: { select: { display_name: true } },
        },
      },
      recommendations: {
        include: { product: true },
        orderBy: { updated_at: "desc" },
      },
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
      models: {
        where: { active: true },
        include: {
          built_by_banker: { select: { display_name: true } },
          // Sprint 5d Block A.4 — pull the attached ArtifactTemplate so
          // the feed card can render structural content + output summary
          // with parameter substitution.
          template: {
            select: {
              id: true,
              title: true,
              description: true,
              parameter_schema: true,
              structural_content: true,
              output_summary_template: true,
              // Sprint 8 Block F — Track id so the sidebar artifact tile
              // can filter to the active Track context.
              track_id: true,
            },
          },
          // Sprint 5e Block G — pull the legacy Artifact attached to
          // the Model so the popup-as-workflow Model row can dispatch
          // to the existing ArtifactPreviewDialog (the same preview the
          // sidebar shows). Members without an Artifact attached
          // (Riverside, banker drafts without share) render as
          // non-clickable Model rows.
          artifact: {
            select: { id: true, title: true, description: true, template: true },
          },
        },
        orderBy: { built_at: "desc" },
      },
      show_events: {
        include: {
          artifact: {
            select: { id: true, title: true, description: true, template: true },
          },
          // Sprint 8 Block F — pull the Model's template + its track_id
          // so the sidebar can filter artifacts to the active Track.
          model: {
            select: {
              id: true,
              parameters: true,
              template: { select: { track_id: true } },
            },
          },
          shown_by_banker: { select: { display_name: true } },
        },
        orderBy: { shown_at: "desc" },
      },
      reactions: {
        include: {
          show_event: {
            include: { artifact: { select: { title: true } } },
          },
          captured_by_banker: { select: { display_name: true } },
        },
        orderBy: { captured_at: "desc" },
      },
      // Sprint 5a.2 — FactorCaptures with full source linkage so the
      // popup bottom zone can render rich, denormalized capture rows.
      factor_captures: {
        include: {
          factor: true,
        },
        orderBy: { captured_at: "desc" },
      },
    },
  });

  if (!member) {
    await prisma.$disconnect();
    notFound();
  }

  // ── Open thread heuristic (Sprint 4.7.1 Block A) ──
  const TERMINAL_RESPONSES = new Set([
    "committed",
    "funded",
    "declined",
    "dismissive",
  ]);
  const RESPONSE_LABELS: Record<string, string> = {
    leaning_yes: "leaning yes",
    leaning_no: "leaning no",
    engaged: "engaged",
    skeptical: "skeptical",
    confused: "confused",
    neutral: "neutral",
    committed: "committed",
    funded: "funded",
    declined: "declined",
    dismissive: "dismissive",
  };
  let openThreadActionCardId: string | null = null;
  let openThreadRecommendationId: string | null = null;
  let openThread: OpenThread | null = null;
  const activeRec = member.recommendations.find(
    (r) => !TERMINAL_RESPONSES.has(r.response),
  );
  if (activeRec) {
    const ac = member.action_cards[0];
    const dateContext = ac
      ? `${ac.due_at < NOW ? "overdue " : "due "}${fmtMonthDay(ac.due_at)}`
      : fmtMonthDay(activeRec.updated_at);
    openThread = {
      responseLabel: RESPONSE_LABELS[activeRec.response] ?? activeRec.response,
      productLabel: activeRec.product?.name ?? null,
      context: dateContext,
    };
    openThreadRecommendationId = activeRec.id;
    if (ac) openThreadActionCardId = ac.id;
  }

  const keyFactsRaw: KeyFact[] = (member.key_facts as KeyFact[] | null) ?? [];
  // Sprint 6 Block C — `last touch` value in Member.key_facts is
  // hand-curated JSON authored when the demo's NOW was 2026-04-25. After
  // Sprint 5e Block D's relative-date compression, the date drifts each
  // run. Override the rendered value with the actual freshest capture
  // timestamp so the strip reads accurately on every demo session. Other
  // key_facts (quantitative figures, recommendation summaries) stay
  // hand-curated.
  const lastTouchAt =
    member.last_touch_at ?? member.signals.map((s) => s.captured_at).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const keyFacts: KeyFact[] = keyFactsRaw.map((f) =>
    f.label === "last touch" && lastTouchAt
      ? { ...f, value: fmtMonthDay(lastTouchAt) }
      : f,
  );
  const tracksCohort = member.tracks_by_evidence_strength as TrackEvidenceCohort | null;

  // ── Macro slot ──
  const effectiveMacros = await prisma.macro.findMany({
    where: {
      effective_period_start: { lte: NOW },
      OR: [
        { effective_period_end: null },
        { effective_period_end: { gte: NOW } },
      ],
    },
    orderBy: { authored_at: "desc" },
  });
  const matchingMacro = effectiveMacros.find((m) => {
    const memberTypes = (m.affected_member_types as string[]) ?? [];
    return memberTypes.includes(member.member_type_id);
  });
  const macro: SidebarMacro | null = matchingMacro
    ? {
        title: matchingMacro.title,
        authored_label:
          matchingMacro.authored_by_external_label ?? "Internal author",
      }
    : null;

  const history: SidebarHistoryEntry[] = member.conversations
    .slice(0, 4)
    .map((c) => ({
      date_label: fmtMonthDay(c.created_at),
      meeting_type: c.meeting_type.replace(/_/g, " "),
    }));
  const totalConversationCount = member.conversations.length;

  // Sprint 8 Block G fix — source sidebar artifacts from active Models
  // (not just ShowEvents). Each Model with either a legacy Artifact or
  // a Sprint 5d ArtifactTemplate becomes one tile. ShowEvent metadata
  // (most recent shown_at) overlays when present.
  const showEventByModelId = new Map<string, Date>();
  for (const s of member.show_events) {
    if (s.model?.id && !showEventByModelId.has(s.model.id)) {
      showEventByModelId.set(s.model.id, s.shown_at);
    }
  }
  const artifacts: SidebarArtifact[] = member.models
    .filter((m) => m.active && (m.template_id || m.artifact_id))
    .map((m) => {
      const title = m.artifact?.title ?? m.template?.title ?? "(untitled artifact)";
      const description = m.artifact?.description ?? m.template?.description ?? null;
      // Prefer legacy artifact.template (e.g. "seasonal_smoothing_chart_v1")
      // for the preview dialog's chart-renderer dispatch. Fall back to
      // template_id (e.g. "ARTIFACT-TEMPLATE-010") so Sprint 8 templates
      // are detected by the dialog's expanded dispatch.
      const templateStr = m.artifact?.template ?? m.template_id ?? null;
      const trackId = m.template?.track_id ?? null;
      const shownAt = showEventByModelId.get(m.id) ?? null;
      // Sprint 9 — only Jenny's TRACK-001 seasonal smoothing chart is
      // preserved as a legacy chart renderer per spec. All other legacy
      // renderers (fleet_roi, capital_event) are REPLACED by the new
      // business-impact visualizations via templateData → Sprint 9
      // chart components.
      const hasLegacyRenderer =
        templateStr === "seasonal_smoothing_chart_v1";
      const template_data =
        m.template && !hasLegacyRenderer
          ? {
              parameter_schema_json: m.template.parameter_schema ?? null,
              structural_content_json: m.template.structural_content ?? null,
              output_summary_template: m.template.output_summary_template ?? "",
              parameters_json: m.template_parameters ?? null,
            }
          : null;
      return {
        id: m.artifact?.id ?? m.id,
        title,
        description,
        shown_at_label: shownAt ? fmtMonthDay(shownAt) : null,
        template: templateStr,
        track_id: trackId,
        template_data,
        // Sprint 8 follow-up — Model id so the preview dialog's inline
        // banker-entered `+ fill in` editor can scope updateModelParameter.
        model_id: m.id,
      };
    });

  const coachContent: SidebarCoachContent = {
    discover: coachBullets("discover", member.member_type.name),
    measure: coachBullets("measure", member.member_type.name),
    consult: coachBullets("consult", member.member_type.name),
    navigate: coachBullets("navigate", member.member_type.name),
  };

  // ── Dialpad data ──
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

  const sizingDimensions: SizeDimensionOption[] = await prisma.sizingDimension.findMany({
    select: { id: true, key: true, display_name: true, description: true },
    orderBy: { display_name: "asc" },
  });

  const sizePriorMeasurements: SizePriorMeasurement[] =
    member.sizing_measurements.map((m) => ({
      id: m.id,
      dimension_id: m.dimension_id,
      dimension_display_name: m.dimension.display_name,
      magnitude: m.magnitude,
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

  // Sprint 5d Block A.3 — Model form attachment dropdown sources from
  // ArtifactTemplate (parameterized templates per Track) plus any
  // legacy free-form Artifact entries. Templates render parameter
  // input fields when selected; free-form artifacts behave like the
  // pre-Sprint-5d attachment.
  const artifactTemplates = await prisma.artifactTemplate.findMany({
    select: {
      id: true,
      track_id: true,
      title: true,
      description: true,
      parameter_schema: true,
      output_summary_template: true,
      track: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });
  const freeFormArtifacts = await prisma.artifact.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
  const allArtifacts: ModelArtifactOption[] = [
    ...artifactTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      template: {
        track_id: t.track_id,
        track_name: t.track.name,
        description: t.description,
        parameter_schema: t.parameter_schema,
        output_summary_template: t.output_summary_template,
      },
    })),
    ...freeFormArtifacts.map((a) => ({
      id: a.id,
      title: a.title,
      template: null,
    })),
  ];

  const factors: QuantifyFactorOption[] = await prisma.businessFactor.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      diagnostic_question: true,
      capture_mode: true,
      field_name: true,
      unit: true,
      category: true,
      enum_values: true,
    },
  });

  // Sprint 5a.2 — TrackTemplates needed by the shell so client-side
  // dot derivation can resolve required_evidence_per_objective for any
  // ranked Track, not just the top one. Sprint 9 Patch E — also pull
  // member_type_applicability so the Track context dropdown can filter
  // Tracks that don't fit the current Member's Member-Type.
  const allTrackTemplates = await prisma.trackTemplate.findMany({
    select: {
      id: true,
      name: true,
      required_evidence_per_objective: true,
      member_type_applicability: true,
    },
  });

  // Sprint 9 Patch E — derive the current Member's Member-Type slug.
  // MemberType.id is a UUID; the applicability matrix uses slugs that
  // match the synthetic-data convention (snake_case from
  // MemberType.name). Fixture Members map cleanly; if a future
  // Member-Type name doesn't round-trip, the comparison falls through
  // and the Track is treated as inapplicable (banker can still reach
  // it via "compare to other lending products").
  const memberTypeSlug = member.member_type.name
    .toLowerCase()
    .replace(/\s+/g, "_");
  const trackApplicabilityById = new Map<string, boolean>();
  for (const t of allTrackTemplates) {
    const raw = t.member_type_applicability;
    let slugs: string[] | null = null;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) slugs = parsed as string[];
      } catch {
        slugs = null;
      }
    } else if (Array.isArray(raw)) {
      slugs = raw as string[];
    }
    // Null/unparseable applicability = applicable to everyone (legacy
    // fallback per schema comment).
    const applicable = slugs === null ? true : slugs.includes(memberTypeSlug);
    trackApplicabilityById.set(t.id, applicable);
  }
  const trackTemplatesLite: TrackTemplateLite[] = allTrackTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    required_evidence_per_objective: t.required_evidence_per_objective as Record<
      V2Objective,
      string[]
    >,
  }));

  // Sprint 5b.1 Block A — MatrixEntry rows for Layer 2 threshold-uplift
  // detection. Lite shape (only fields cta-derivation needs).
  const allMatrixEntries = await prisma.matrixEntry.findMany({
    select: {
      factor_id: true,
      track_id: true,
      strength: true,
      threshold_rule: true,
    },
  });
  const matrixEntriesLite: DeriveMatrixEntry[] = allMatrixEntries.map((e) => ({
    factor_id: e.factor_id,
    track_id: e.track_id,
    strength: e.strength,
    threshold_rule: e.threshold_rule,
  }));

  // Sprint 5b.1 Block D — Member's Insights (incl. seed routine + novel).
  // Signal attribution resolved via manual lookup against the member's
  // already-loaded signals (Insight schema doesn't carry an FK relation
  // to Signal — `addresses_signal_id` is a plain string column).
  const memberInsights = await prisma.insight.findMany({
    where: { member_id: member.id },
    orderBy: { authored_at: "desc" },
  });
  const bankerById = new Map<string, string>();
  bankerById.set(member.primary_banker.id, member.primary_banker.display_name);
  const allBankersForLookup = await prisma.banker.findMany({
    select: { id: true, display_name: true },
  });
  for (const b of allBankersForLookup) bankerById.set(b.id, b.display_name);
  // Build a local signal lookup for Insight attribution (signalsById
  // proper is constructed later for the captured-rows builder).
  const signalsByIdForInsights = new Map(
    member.signals.map((s) => [s.id, s]),
  );
  const insightsLite: InsightDisplay[] = memberInsights.map((ins) => {
    let addresses_signal_summary: string | null = null;
    if (ins.addresses_signal_id) {
      const sig = signalsByIdForInsights.get(ins.addresses_signal_id);
      if (sig) {
        addresses_signal_summary = `${sig.type.charAt(0).toUpperCase()}${sig.type.slice(1)}: ${sig.topic.display_name}`;
      }
    }
    return {
      id: ins.id,
      track_id: ins.track_id,
      insight_type: ins.insight_type as "reframe" | "implication",
      content: ins.content,
      llm_feedback: ins.llm_feedback,
      matched_pattern_id: ins.matched_pattern_id,
      state: ins.state as "routine" | "novel",
      authored_at_label: fmtMonthDay(ins.authored_at),
      banker_name: bankerById.get(ins.authored_by) ?? null,
      addresses_signal_id: ins.addresses_signal_id,
      addresses_signal_summary,
    };
  });

  // Sprint 5b.1 Block F — canonical Patterns indexed by id.
  const allPatterns = await prisma.insightPattern.findMany({
    where: { status: "approved" },
  });
  const patternsById: Record<
    string,
    PatternDisplay & { track_id: string; signal_tag_scope: string }
  > = {};
  for (const p of allPatterns) {
    let questions: string[] = [];
    try {
      const parsed = JSON.parse(p.implication_questions);
      if (Array.isArray(parsed)) questions = parsed.filter((x) => typeof x === "string");
    } catch {
      // empty
    }
    patternsById[p.id] = {
      id: p.id,
      insight_type: p.insight_type as "reframe" | "implication",
      content: p.content,
      implication_questions: questions,
      track_id: p.track_id,
      signal_tag_scope: p.signal_tag_scope,
    };
  }

  const rankedTracks = await rankTracksForMember(prisma, member.id);
  const rankedTracksLite: RankedTrackLite[] = rankedTracks.map((t) => ({
    track_id: t.track_id,
    track_name: t.track_name,
    strength: t.strength,
    strong_count: t.strong_count,
    moderate_count: t.moderate_count,
    negative_count: t.negative_count,
    // Sprint 9 Patch E — flag drives the Track context dropdown filter
    // (compact view hides inapplicable; expanded view shows them
    // muted).
    applicable: trackApplicabilityById.get(t.track_id) ?? true,
  }));

  const showEventOptions: ReactionShowEventOption[] = member.show_events.map(
    (s) => ({
      id: s.id,
      label: `${s.artifact.title} · ${fmtMonthDay(s.shown_at)}`,
    }),
  );
  const defaultShowEventId = member.show_events[0]?.id ?? null;

  const allBankers: ActionBankerOption[] = await prisma.banker.findMany({
    where: { status: "active" },
    select: { id: true, display_name: true },
    orderBy: { display_name: "asc" },
  });

  const openActionCard = member.action_cards[0] ?? null;

  // ── Sprint 5a.2 — serialize FactorCaptures, BusinessFactors, counts ──
  const businessFactorsLite: BusinessFactorLite[] = factors.map((f) => ({
    id: f.id,
    name: f.name,
    diagnostic_question: f.diagnostic_question,
    capture_mode: f.capture_mode,
    field_name: f.field_name,
    unit: f.unit,
    category: f.category,
    enum_values: f.enum_values,
  }));

  const factorCapturesLite: FactorCaptureLite[] = member.factor_captures.map(
    (c) => ({
      factor_id: c.factor_id,
      numerical_value: c.numerical_value,
      boolean_value: c.boolean_value,
      qualitative_value: c.qualitative_value,
      unit: c.unit,
      captured_at: c.captured_at.toISOString(),
      banker_id: c.banker_id,
      source_signal_id: c.source_signal_id,
      source_sizing_id: c.source_sizing_id,
      source_reaction_id: c.source_reaction_id,
      // Sprint 8 Block A — forward capture_mode so the workstation shell
      // can flag banker-estimate values in the artifact renderer.
      capture_mode: c.capture_mode,
    }),
  );

  const entityCounts: EntityCounts = {
    modelCount: member.models.length,
    showEventCount: member.show_events.length,
    reactionCount: member.reactions.length,
    specialistHandoffCount: member.action_cards.filter(
      (a) => a.type === "handoff",
    ).length,
  };

  // ── Sprint 5a.2 — capturedRows: denormalized display data per
  // evidence_ref. Source linkage drives the bottom-zone display:
  //   FactorCapture.source_signal_id → Signal.their_words pulled into quote
  //   FactorCapture.source_sizing_id → SizingMeasurement magnitude pulled
  //   FactorCapture.source_reaction_id → Reaction quote pulled
  // For symbolic refs, resolve from the most-recent matching entity.
  const signalsById = new Map(member.signals.map((s) => [s.id, s]));
  const sizingsById = new Map(member.sizing_measurements.map((m) => [m.id, m]));
  const reactionsById = new Map(member.reactions.map((r) => [r.id, r]));

  // Sprint 5e v2 Block G — captured tag set per Signal id. Tags come
  // from source-linked qualitative FactorCaptures' qualitative_value
  // (e.g., FACTOR-022 with qualitative_value = "capacity_limit"). The
  // Pattern library's signal_tag_scope uses these same matrix tag
  // strings, so this map drives matched-vs-remaining Pattern split in
  // the lightbulb popover.
  const signalTagsBySignalId: Record<string, string[]> = {};
  for (const fc of member.factor_captures) {
    if (!fc.source_signal_id) continue;
    if (fc.qualitative_value === null) continue;
    const tags = signalTagsBySignalId[fc.source_signal_id] ?? [];
    if (!tags.includes(fc.qualitative_value)) tags.push(fc.qualitative_value);
    signalTagsBySignalId[fc.source_signal_id] = tags;
  }
  const bankersById = new Map<string, string>();
  bankersById.set(member.primary_banker.id, member.primary_banker.display_name);
  const allBankersLookup = await prisma.banker.findMany({
    select: { id: true, display_name: true },
  });
  for (const b of allBankersLookup) bankersById.set(b.id, b.display_name);

  // Sprint 5a.3 Block B — humanize qualitative values + use factor.name
  // as the row's primary chip when no source linkage exists. Source-
  // linked rows still get the Signal-type chip (Goal / Blocker / Trigger
  // / Indecision) per the path below, since the source Signal carries
  // the richer banker context (verbatim quote, original capture date).
  function humanizeQualitativeTag(tag: string): string {
    if (!tag) return tag;
    // JSON-array passthrough for qualitative_multi factors stored as
    // JSON strings (e.g., FACTOR-027 treasury_services_adopted).
    if (tag.startsWith("[") && tag.endsWith("]")) {
      try {
        const parsed = JSON.parse(tag);
        if (Array.isArray(parsed)) {
          return parsed
            .map((s) => String(s).replace(/_/g, " "))
            .join(" · ");
        }
      } catch {
        // Fall through to underscore-replace.
      }
    }
    const replaced = tag.replace(/_/g, " ");
    return replaced.charAt(0).toUpperCase() + replaced.slice(1);
  }

  function formatFactorValue(c: {
    numerical_value: number | null;
    boolean_value: boolean | null;
    qualitative_value: string | null;
    unit: string | null;
  }): string {
    if (c.numerical_value !== null) {
      const u = c.unit ?? "";
      if (u === "$") return `$${c.numerical_value.toLocaleString("en-US")}`;
      return `${c.numerical_value}${u ? ` ${u}` : ""}`;
    }
    if (c.boolean_value !== null) return c.boolean_value ? "Yes" : "No";
    if (c.qualitative_value !== null) {
      return humanizeQualitativeTag(c.qualitative_value);
    }
    return "captured";
  }

  const capturedRowsByEvidenceRef: Record<string, CapturedRowDisplay> = {};

  for (const fc of member.factor_captures) {
    const factor = fc.factor;
    if (!factor) continue;
    // Sprint 5a.3 Block B — for standalone rows (no source linkage),
    // chip = factor.name (e.g., "Annual revenue", "Member tenure"),
    // value = humanized capture value. For source-linked rows, the
    // chip becomes the Signal type (Goal/Blocker/Trigger/Indecision)
    // and the row carries the verbatim Member quote.
    let type_chip = factor.name;
    let value_display = formatFactorValue(fc);
    let member_quote: string | null = null;
    let captured_at = fc.captured_at;
    let banker_name = bankersById.get(fc.banker_id) ?? null;
    let captured_via: string | null = null;
    // Sprint 5b.1 — surface the source Signal id + type so popup can
    // wire the contextual + Insight affordance and lightbulb popover.
    let signal_id: string | null = null;
    let signal_type: "goal" | "blocker" | "indecision" | "trigger" | null = null;

    if (fc.source_signal_id) {
      const sig = signalsById.get(fc.source_signal_id);
      if (sig) {
        // Sprint 5e Block F.A — Signal-linkage carries the quote +
        // metadata for any factor, but the row's *primary* identity
        // (type_chip + value_display) only inherits from the Signal
        // when the factor is qualitative (the Signal IS the content,
        // e.g., FACTOR-022 Stated obstacle to growth). For numerical
        // and boolean factors, keep factor.name + the formatted value
        // as primary so the row reads "Capacity utilization · 88%"
        // not "Blocker · capacity_limit". The Signal quote attaches
        // as supplementary `member_quote` regardless.
        member_quote = sig.their_words;
        captured_at = sig.captured_at;
        banker_name = sig.conversation.banker.display_name;
        captured_via = "+ Ask";
        signal_id = sig.id;
        if (
          sig.type === "goal" ||
          sig.type === "blocker" ||
          sig.type === "indecision" ||
          sig.type === "trigger"
        ) {
          signal_type = sig.type;
        }
        const isQualitative =
          factor.capture_mode === "qualitative_select" ||
          factor.capture_mode === "qualitative_multi";
        if (isQualitative) {
          type_chip = sig.type.charAt(0).toUpperCase() + sig.type.slice(1);
          value_display = sig.topic.display_name;
        }
      }
    } else if (fc.source_sizing_id) {
      const siz = sizingsById.get(fc.source_sizing_id);
      if (siz) {
        type_chip = "Sized";
        const u = siz.unit === "dollars" ? "$" : siz.unit;
        value_display =
          u === "$"
            ? `$${siz.magnitude.toLocaleString("en-US")}${siz.frequency ? "/" + siz.frequency.replace(/_/g, " ") : ""} · ${siz.dimension.display_name}`
            : `${siz.magnitude} ${u}${siz.frequency ? "/" + siz.frequency.replace(/_/g, " ") : ""} · ${siz.dimension.display_name}`;
        member_quote = siz.their_words;
        captured_at = siz.captured_at;
        banker_name = siz.conversation.banker.display_name;
        captured_via = "+ Quantify";
      }
    } else if (fc.source_reaction_id) {
      const rxn = reactionsById.get(fc.source_reaction_id);
      if (rxn) {
        type_chip = "Reaction";
        value_display = rxn.response_value.replace(/_/g, " ");
        member_quote = rxn.member_quote;
        captured_at = rxn.captured_at;
        banker_name = rxn.captured_by_banker.display_name;
        captured_via = "+ Reaction";
      }
    } else {
      // Standalone FactorCapture — no source linkage.
      captured_via = "+ Quantify";
    }

    // Sprint 5b.1 Block G — open-thread heuristic: an Indecision
    // Signal is "open" if no subsequent Reaction exists for the Member
    // after the Indecision's captured_at. Pragmatic per spec G.3 —
    // not perfect but ships cleanly. ActionCard.status-driven richer
    // open-thread CTAs deferred to a future sprint per Pilot
    // deferrals (see BUILD_LOG Sprint 5b.1 entry).
    let is_open_thread = false;
    if (signal_type === "indecision") {
      const sig = signalsById.get(signal_id ?? "");
      if (sig) {
        const sigTime = sig.captured_at.getTime();
        const subsequentReaction = member.reactions.some(
          (r) => r.captured_at.getTime() > sigTime,
        );
        is_open_thread = !subsequentReaction;
      }
    }
    capturedRowsByEvidenceRef[fc.factor_id] = {
      evidence_ref: fc.factor_id,
      type_chip,
      value_display,
      member_quote,
      captured_at_label: fmtMonthDay(captured_at),
      captured_via,
      banker_name,
      signal_id,
      signal_type,
      captured_at_iso: captured_at.toISOString(),
      is_open_thread,
    };
  }

  // Symbolic refs.
  if (member.models.length > 0) {
    const mod = member.models[0];
    const params = mod.parameters as { name?: string } | null;
    capturedRowsByEvidenceRef["model_produced"] = {
      evidence_ref: "model_produced",
      type_chip: "Model",
      value_display: `${params?.name ?? "Untitled model"} · ${mod.built_with_member ? "with Member" : "banker draft"}`,
      member_quote: null,
      captured_at_label: fmtMonthDay(mod.built_at),
      captured_via: "+ Model",
      banker_name: mod.built_by_banker.display_name,
      // Sprint 5e Block G — Model row clickable when an Artifact is
      // attached. Banker draft Models without an Artifact (e.g.,
      // Riverside) render as non-clickable.
      artifact_preview: mod.artifact
        ? {
            id: mod.artifact.id,
            title: mod.artifact.title,
            description: mod.artifact.description ?? null,
            template: mod.artifact.template ?? null,
          }
        : null,
    };
  }
  if (member.show_events.length > 0) {
    const sh = member.show_events[0];
    capturedRowsByEvidenceRef["model_shown"] = {
      evidence_ref: "model_shown",
      type_chip: "Shared with member",
      value_display: sh.artifact.title,
      member_quote: null,
      captured_at_label: fmtMonthDay(sh.shown_at),
      captured_via: "Share recorded",
      banker_name: sh.shown_by_banker.display_name,
      // Sprint 5e Block G — ShowEvent always points to an Artifact;
      // row is always clickable.
      artifact_preview: {
        id: sh.artifact.id,
        title: sh.artifact.title,
        description: sh.artifact.description ?? null,
        template: sh.artifact.template ?? null,
      },
    };
  }
  if (member.reactions.length > 0) {
    const rxn = member.reactions[0];
    capturedRowsByEvidenceRef["reaction_captured"] = {
      evidence_ref: "reaction_captured",
      type_chip: "Reaction",
      value_display: rxn.response_value.replace(/_/g, " "),
      member_quote: rxn.member_quote,
      captured_at_label: fmtMonthDay(rxn.captured_at),
      captured_via: "+ Reaction",
      banker_name: rxn.captured_by_banker.display_name,
    };
  }
  const handoffCard = member.action_cards.find((a) => a.type === "handoff");
  if (handoffCard) {
    capturedRowsByEvidenceRef["specialist_handoff_initiated"] = {
      evidence_ref: "specialist_handoff_initiated",
      type_chip: "Handoff",
      value_display: handoffCard.rationale,
      member_quote: null,
      captured_at_label: fmtMonthDay(handoffCard.status_changed_at),
      captured_via: "+ Action",
      banker_name: handoffCard.owner.display_name,
    };
  }
  // decision_maker_mapping — proxied by FACTOR-014 capture if present
  // (already added above) OR by the most-recent indecision Signal as a
  // fallback. We only populate here if FACTOR-014 didn't land a row.
  if (!capturedRowsByEvidenceRef["decision_maker_mapping"]) {
    const indecisionSig = member.signals.find((s) => s.type === "indecision");
    if (indecisionSig) {
      capturedRowsByEvidenceRef["decision_maker_mapping"] = {
        evidence_ref: "decision_maker_mapping",
        type_chip: "Indecision",
        value_display: indecisionSig.topic.display_name,
        member_quote: indecisionSig.their_words,
        captured_at_label: fmtMonthDay(indecisionSig.captured_at),
        captured_via: "+ Ask",
        banker_name: indecisionSig.conversation.banker.display_name,
      };
    }
  }

  // ── Highlights per objective (unchanged from Sprint 4.7.2.x) ──
  const objectiveHighlights: Record<V2Objective, string | null> = {
    discover: tracksCohort?.strong[0]?.track_name ?? null,
    measure: keyFacts[0] ? `${keyFacts[0].value} ${keyFacts[0].label}` : null,
    consult: openThread
      ? `${openThread.responseLabel}${openThread.productLabel ? ` · ${openThread.productLabel}` : ""}`
      : null,
    navigate: null,
  };

  // ── Captured feed: assemble unified, recent-first FeedItem list ──
  const feedItems: FeedItem[] = [];

  for (const s of member.signals) {
    feedItems.push({
      kind: "ask",
      id: s.id,
      capturedAt: s.captured_at.toISOString(),
      signalType: s.type as "goal" | "blocker" | "trigger" | "indecision",
      topicLabel: s.topic.display_name,
      severity: s.severity,
      timeframe: s.recency,
      timeHorizon: s.time_horizon,
      sourceLabel: s.confidence.replace(/_/g, " "),
      magnitudeDisplay:
        s.magnitude !== null && s.unit
          ? s.unit === "dollars"
            ? `$${s.magnitude.toLocaleString("en-US")}${s.frequency ? "/" + s.frequency.replace(/_/g, " ") : ""}`
            : `${s.magnitude} ${s.unit}${s.frequency ? "/" + s.frequency.replace(/_/g, " ") : ""}`
          : null,
      memberQuote: s.their_words,
      bankerName: s.conversation.banker.display_name,
      isStale: isStaleDate(s.captured_at),
      isOpenThread: false,
    });
  }

  for (const m of member.sizing_measurements) {
    const magnitudeDisplay =
      m.unit === "dollars"
        ? `$${m.magnitude.toLocaleString("en-US")}${m.frequency ? "/" + m.frequency.replace(/_/g, " ") : ""}`
        : `${m.magnitude} ${m.unit}${m.frequency ? "/" + m.frequency.replace(/_/g, " ") : ""}`;
    feedItems.push({
      kind: "quantify",
      id: m.id,
      capturedAt: m.captured_at.toISOString(),
      dimensionLabel: m.dimension.display_name,
      magnitudeDisplay,
      sourceLabel: m.source.replace(/_/g, " "),
      confidenceLabel: m.confidence,
      timePeriod: m.time_period,
      methodologyNote: m.methodology_note,
      memberQuote: m.their_words,
      bankerName: m.conversation.banker.display_name,
      isStale: isStaleDate(m.captured_at),
      isOpenThread: false,
    });
  }

  for (const mod of member.models) {
    const params = mod.parameters as
      | { name?: string; rows?: Array<{ key: string; value: string }> }
      | null;
    const rows = params?.rows ?? [];
    const parametersSummary = rows
      .slice(0, 3)
      .map((r) => `${r.key}: ${r.value}`)
      .join(" · ");
    const assumptions = (mod.assumptions as string[] | null) ?? [];
    // Sprint 8 follow-up — fall back to the linked template's title
    // when the Model has no `name` parameter (default for Sprint 8
    // secondary-Track Models). Only show "Untitled model" when neither
    // a name nor a template exists.
    const displayName = params?.name ?? mod.template?.title ?? "Untitled model";
    // Build the artifact-preview payload so the feed card title can
    // open the same preview dialog the sidebar tile opens.
    const hasLegacyArtifact = !!mod.artifact;
    const hasTemplate = !!mod.template;
    const previewTemplate =
      mod.artifact?.template ?? mod.template_id ?? null;
    // Sprint 9 — only Jenny's TRACK-001 seasonal smoothing chart is
    // preserved as a legacy renderer. fleet_roi + capital_event are
    // replaced by Sprint 9 business-impact visualizations.
    const hasLegacyRenderer =
      previewTemplate === "seasonal_smoothing_chart_v1";
    const artifactPreview =
      hasLegacyArtifact || hasTemplate
        ? {
            id: mod.artifact?.id ?? mod.id,
            title:
              mod.artifact?.title ?? mod.template?.title ?? displayName,
            description:
              mod.artifact?.description ?? mod.template?.description ?? null,
            template: previewTemplate,
            templateData:
              mod.template && !hasLegacyRenderer
                ? {
                    parameter_schema_json: mod.template.parameter_schema ?? null,
                    structural_content_json:
                      mod.template.structural_content ?? null,
                    output_summary_template:
                      mod.template.output_summary_template ?? "",
                    parameters_json: mod.template_parameters ?? null,
                  }
                : null,
          }
        : null;
    feedItems.push({
      kind: "model",
      id: mod.id,
      capturedAt: mod.built_at.toISOString(),
      modelName: displayName,
      builtWithMember: mod.built_with_member,
      parametersSummary,
      assumptionsCount: assumptions.length,
      assumptions,
      outputSummary: mod.output_summary,
      bankerName: mod.built_by_banker.display_name,
      isStale: isStaleDate(mod.built_at),
      isOpenThread: false,
      // Sprint 5d Block A.4 — template metadata for parameter-substituted rendering.
      templateTitle: mod.template?.title ?? null,
      templateDescription: mod.template?.description ?? null,
      templateParameterSchema: mod.template?.parameter_schema ?? null,
      templateStructuralContent: mod.template?.structural_content ?? null,
      templateOutputSummaryTemplate: mod.template?.output_summary_template ?? null,
      templateParameters: mod.template_parameters ?? null,
      artifactPreview,
    });
  }

  for (const s of member.show_events) {
    const modelParams = s.model?.parameters as { name?: string } | null;
    feedItems.push({
      kind: "show",
      id: s.id,
      capturedAt: s.shown_at.toISOString(),
      artifactTitle: s.artifact.title,
      artifactId: s.artifact.id,
      artifactDescription: s.artifact.description ?? null,
      artifactTemplate: s.artifact.template ?? null,
      modelName: modelParams?.name ?? null,
      contextNote: s.context_note,
      bankerName: s.shown_by_banker.display_name,
      isStale: isStaleDate(s.shown_at),
      isOpenThread: false,
    });
  }

  for (const r of member.reactions) {
    feedItems.push({
      kind: "reaction",
      id: r.id,
      capturedAt: r.captured_at.toISOString(),
      responseValue: r.response_value,
      memberQuote: r.member_quote,
      reactionToLabel: r.show_event?.artifact.title ?? null,
      bankerName: r.captured_by_banker.display_name,
      isStale: isStaleDate(r.captured_at),
      isOpenThread: false,
    });
  }

  for (const rec of member.recommendations) {
    if (rec.response === "neutral") continue;
    const isOpenThread = rec.id === openThreadRecommendationId;
    const concernLabel = rec.primary_concern
      ? RECOMMENDATION_PRIMARY_CONCERN_LABELS[
          rec.primary_concern as keyof typeof RECOMMENDATION_PRIMARY_CONCERN_LABELS
        ] ?? (rec.primary_concern as string).replace(/_/g, " ")
      : null;
    feedItems.push({
      kind: "resolve",
      id: rec.id,
      capturedAt: rec.updated_at.toISOString(),
      productLabel: `${rec.product.name}${
        rec.size_proposed || rec.size_low || rec.size_high
          ? " at " + formatRecommendationSize(rec)
          : ""
      }`,
      response: rec.response,
      primaryConcernLabel: concernLabel,
      memberQuote: rec.their_words,
      bankerName: member.primary_banker.display_name,
      isStale: isStaleDate(rec.updated_at),
      isOpenThread,
      nextActionLabel:
        openActionCard && isOpenThread
          ? openActionCard.rationale.length > 60
            ? `${openActionCard.rationale.slice(0, 60)}…`
            : openActionCard.rationale
          : null,
    });
  }

  feedItems.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  if (openThreadActionCardId && feedItems[0]?.kind === "resolve") {
    feedItems[0].isOpenThread = true;
  }

  await prisma.$disconnect();

  return (
    <div className="min-h-screen w-full bg-blaze-paper">
      <V2WorkstationHeader
        memberName={member.doing_business_as ?? member.legal_name}
        memberTypeName={member.member_type.name}
        stage={member.stage as string}
        primaryBankerName={member.primary_banker.display_name}
        openThread={openThread}
        classicHref={`/members/${slug}`}
      />
      <ComplianceDisclaimerBanner />
      {representativeOf && (
        <RepresentativeExampleBanner
          representativeOf={representativeOf}
          exampleFor={exampleFor ?? null}
        />
      )}
      <KeyFactsStrip facts={keyFacts} />
      <WorkstationShell
        memberId={member.id}
        bankerId={member.primary_banker.id}
        artifacts={artifacts}
        macro={macro}
        history={history}
        totalConversationCount={totalConversationCount}
        coachContent={coachContent}
        tracksCohort={tracksCohort}
        rankedTracks={rankedTracksLite}
        activeTrackIds={
          Array.isArray(member.active_track_ids)
            ? (member.active_track_ids as string[])
            : null
        }
        trackTemplates={trackTemplatesLite}
        businessFactors={businessFactorsLite}
        factorCaptures={factorCapturesLite}
        entityCounts={entityCounts}
        capturedRowsByEvidenceRef={capturedRowsByEvidenceRef}
        matrixEntries={matrixEntriesLite}
        insights={insightsLite}
        patternsById={patternsById}
        signalTagsBySignalId={signalTagsBySignalId}
        objectiveHighlights={objectiveHighlights}
        dialpadProps={{
          askPriorSignals,
          askTopicsByType: topicsByType,
          sizingDimensions,
          sizePriorMeasurements,
          factors,
          artifacts: allArtifacts,
          showEvents: showEventOptions,
          defaultShowEventId,
          bankers: allBankers,
          insightTracks: rankedTracksLite.length
            ? rankedTracksLite.map((t) => ({ id: t.track_id, name: t.track_name }))
            : trackTemplatesLite.map((t) => ({ id: t.id, name: t.name })),
          insightDefaultTrackId: rankedTracksLite[0]?.track_id ?? null,
          insightSignals: member.signals
            .filter((s) =>
              ["goal", "blocker", "indecision", "trigger"].includes(s.type),
            )
            .map((s) => ({
              id: s.id,
              type: s.type as "goal" | "blocker" | "indecision" | "trigger",
              topic_display_name: s.topic.display_name,
            })),
        }}
        feedItems={feedItems}
      />
      <div className="mx-auto mt-12 max-w-6xl px-8">
        <CaptureDisciplineCallout />
      </div>
      <div
        className="mt-6 h-1 w-full"
        style={{ backgroundImage: "var(--blaze-gradient)" }}
        aria-hidden
      />
    </div>
  );
}
