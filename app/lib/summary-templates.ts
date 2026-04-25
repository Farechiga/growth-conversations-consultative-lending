/*
 * Summary templates — Semantic Discipline Principle 4.
 *
 * Functions that produce plain-English summaries of system entities. Templated
 * in v1; LLM-ready when Phase 2 wires up natural-language generation. The
 * discipline: every interesting entity is summarizable without a UI component
 * having to invent prose. Tokens are for joining; this is where prose lives.
 *
 * These functions are called by:
 *   - The Member profile band UI (Day 4-5)
 *   - The Insight Engine's drilldown panels
 *   - Any LLM-facing surface that emits assistant-style summaries
 *   - The step-4 fixture-checkpoint output
 *
 * Inputs are typed shapes that mirror Prisma row shapes loaded with `include`.
 * Functions never take raw Prisma client; callers do the loading.
 */

import {
  RECOMMENDATION_PRIMARY_CONCERN_LABELS,
  describePrimaryConcern,
} from "./enum-descriptions";

// ============================================================
// Shared types — narrow shapes the templates operate on
// ============================================================

export type SignalSummaryInput = {
  type: "goal" | "blocker" | "trigger" | "indecision";
  topic: { display_name: string; canonical_tag: string };
  severity: "manageable" | "painful" | "threatening";
  recency: "acute_recent" | "ongoing" | "chronic" | "hypothetical_future";
  their_words: string | null;
  magnitude: number | null;
  unit: string | null;
  frequency: string | null;
};

export type ActionCardSummaryInput = {
  type: "follow_up" | "handoff" | "nurture" | "research" | "escalation";
  status: "open" | "in_progress" | "completed" | "declined" | "deferred" | "superseded";
  rationale: string;
  due_at: Date;
  owner: { display_name: string };
};

export type RecommendationSummaryInput = {
  product: { name: string };
  size_proposed: number | null;
  structure: "standard" | "phased" | "conservative_first" | "paired_with";
  response: "accepted" | "leaning_yes" | "neutral" | "leaning_no" | "declined" | "deferred";
  primary_concern: keyof typeof RECOMMENDATION_PRIMARY_CONCERN_LABELS | null;
  rationale_text: string;
  confidence_band: "low" | "medium" | "high";
};

export type GrowthTrackSummaryInput = {
  name: string;
  description: string;
  target_member_type: { name: string };
  growth_step_sequence: { position: number; growth_step: { title: string; step_shape: string } }[];
};

export type MemberSummaryInput = {
  doing_business_as: string | null;
  legal_name: string;
  member_type: { name: string };
  industry_family: { name: string };
  primary_banker: { display_name: string };
  tenure_started_at: Date;
  active_signal_count: number;
  open_action_card_count: number;
  last_touch_at: Date | null;
};

// ============================================================
// Helpers
// ============================================================

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

function tenureYears(started: Date, now: Date = new Date()): number {
  const ms = now.getTime() - started.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

const SEVERITY_PHRASE: Record<string, string> = {
  manageable: "manageable",
  painful: "actively painful",
  threatening: "at a threatening level",
};

const RECENCY_PHRASE: Record<string, string> = {
  acute_recent: "felt acutely in the last few weeks",
  ongoing: "an ongoing pattern",
  chronic: "a long-running condition",
  hypothetical_future: "anticipated, not yet acute",
};

// ============================================================
// Templates
// ============================================================

/**
 * One-line summary of a Signal in plain English.
 * Example: "Seasonal cash flow stress (blocker, actively painful, $12,000/quarter), an ongoing pattern."
 */
export function signalSummary(s: SignalSummaryInput): string {
  const parts: string[] = [];
  parts.push(`${s.topic.display_name} (${s.type}, ${SEVERITY_PHRASE[s.severity]})`);
  if (s.magnitude !== null && s.unit) {
    const num = s.unit === "dollars" ? formatDollars(s.magnitude) : s.magnitude.toString();
    const unitLabel = s.unit === "dollars" ? "" : ` ${s.unit.replace(/_/g, " ")}`;
    const freqLabel = s.frequency ? `/${s.frequency}` : "";
    parts.push(`${num}${unitLabel}${freqLabel}`);
  }
  let body = parts.join(" — ");
  body += `, ${RECENCY_PHRASE[s.recency]}.`;
  if (s.their_words) body += ` Member's words: "${s.their_words}"`;
  return body;
}

/**
 * One-line summary of an open ActionCard.
 * Example: "Follow-up due Wednesday, owned by Scott Brynjolffson — Jenny was leaning yes…"
 */
export function actionCardSummary(c: ActionCardSummaryInput): string {
  const due = c.due_at.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const typeLabel = c.type.replace(/_/g, " ");
  return `${typeLabel} (${c.status}) due ${due}, owned by ${c.owner.display_name} — ${c.rationale}`;
}

/**
 * One-line summary of a Recommendation.
 * Example: "Working Capital Line of Credit at $75K (standard structure, high confidence). Member is leaning yes; primary concern is needs spouse's input."
 */
export function recommendationSummary(r: RecommendationSummaryInput): string {
  const size = r.size_proposed !== null ? ` at ${formatDollars(r.size_proposed)}` : "";
  const head = `${r.product.name}${size} (${r.structure} structure, ${r.confidence_band} confidence).`;
  const responseLabel = r.response.replace(/_/g, " ");
  const concernPhrase = r.primary_concern
    ? `; primary concern is ${RECOMMENDATION_PRIMARY_CONCERN_LABELS[r.primary_concern].toLowerCase()}`
    : "";
  return `${head} Member is ${responseLabel}${concernPhrase}.`;
}

/**
 * Multi-sentence summary of a Recommendation that pulls in the description of
 * the primary_concern enum value when present. Used in the Insight Engine
 * detail view and in LLM-ready summaries.
 */
export function recommendationLongSummary(r: RecommendationSummaryInput): string {
  const lines = [recommendationSummary(r), `Rationale: ${r.rationale_text}`];
  if (r.primary_concern && r.primary_concern !== "none") {
    lines.push(`Concern detail: ${describePrimaryConcern(r.primary_concern)}`);
  }
  return lines.join(" ");
}

/**
 * One-paragraph summary of a Growth track suitable for the Insight Engine
 * Growth track view or a Member profile suggested-track band.
 */
export function growthTrackSummary(t: GrowthTrackSummaryInput): string {
  const stepNames = [...t.growth_step_sequence]
    .sort((a, b) => a.position - b.position)
    .map((s) => s.growth_step.title)
    .join(" → ");
  return `${t.name} — for ${t.target_member_type.name}. ${stepNames}. ${t.description}`;
}

/**
 * Multi-sentence Member summary suitable for the top of a Member profile.
 * Pure templated prose; will be replaced (or augmented) by an LLM-driven
 * summary in Phase 2.
 */
export function memberSummary(m: MemberSummaryInput, now: Date = new Date()): string {
  const dba = m.doing_business_as ?? m.legal_name;
  const years = tenureYears(m.tenure_started_at, now);
  const banker = m.primary_banker.display_name;
  const lastTouch = m.last_touch_at
    ? m.last_touch_at.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "no Conversations on record yet";
  const signalLine =
    m.active_signal_count === 0
      ? "no active Signals"
      : `${m.active_signal_count} active Signal${m.active_signal_count === 1 ? "" : "s"}`;
  const cardLine =
    m.open_action_card_count === 0
      ? "no open ActionCards"
      : `${m.open_action_card_count} open ActionCard${m.open_action_card_count === 1 ? "" : "s"}`;
  return [
    `${dba} (legal: ${m.legal_name}) is a ${m.member_type.name} in ${m.industry_family.name}.`,
    `Banker is ${banker}; relationship of ${years} year${years === 1 ? "" : "s"}.`,
    `Last conversation: ${lastTouch}. ${signalLine}, ${cardLine}.`,
  ].join(" ");
}
