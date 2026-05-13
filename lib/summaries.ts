/*
 * Summary template registry — Semantic Discipline Principle 4 with structural
 * enforcement.
 *
 * Each summarizable entity has one function exported here. Each function:
 *   - Declares REQUIRED slots (data fields that must be populated for the
 *     summary to render) and OPTIONAL slots (color when available).
 *   - Returns Result<string, MissingSlotsError> rather than rendering half-
 *     blank prose. Half-blank prose hides data quality problems; explicit
 *     errors surface them.
 *   - Provides a separate "initial state" variant when an onboarding edge
 *     case (e.g., a Member with no Conversations yet) would otherwise force
 *     the main template to handle null/zero values awkwardly.
 *   - Carries a TEMPLATE_VERSION integer constant. Increment on any
 *     change. The MemberSummarySnapshot model persists the version of the
 *     template used so historical snapshots remain interpretable as
 *     templates evolve.
 *
 * Every change to a template is a meaningful change to canonical content
 * and gets noted in BUILD_LOG.
 *
 * Verb-phrases used in prose come from lib/relation-names.ts (Two-File
 * Rule discipline).
 */

import { describePrimaryConcern, RECOMMENDATION_PRIMARY_CONCERN_LABELS } from "./enum-descriptions";

// ============================================================
// Result + error shapes
// ============================================================

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type MissingSlotsError = {
  template: string;
  template_version: number;
  missing: string[];
};

function isMissing(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

// ============================================================
// summarizeMember
// ============================================================

export const SUMMARIZE_MEMBER_TEMPLATE_VERSION = 1;
const SUMMARIZE_MEMBER_TEMPLATE = "summarizeMember";

/**
 * Required slots per the Day-1 contract:
 *   1. business legal name
 *   2. Member Type name
 *   3. tenure (years with Blaze)
 *   4. primary banker name
 *   5. active blocker count
 *   6. active proposal status (if any exists — the field is required, but its
 *      value may be null when no Recommendation exists; null is *not* missing)
 *   7. last touch recency
 *   8. open ActionCard count
 *
 * Optional slots: doing_business_as, owner display name (color, when known).
 */
export type MemberSummaryInput = {
  // Required
  legal_name: string;
  member_type_name: string;
  tenure_started_at: Date;
  primary_banker_name: string;
  active_blocker_count: number;
  // active_proposal: required slot, but its content may be null (no proposal) — null is a valid value, not a missing slot.
  active_proposal:
    | null
    | {
        product_name: string;
        size_proposed: number | null;
        response:
          | "declined"
          | "leaning_no"
          | "dismissive"
          | "skeptical"
          | "confused"
          | "neutral"
          | "engaged"
          | "leaning_yes"
          | "committed"
          | "funded";
        primary_concern: keyof typeof RECOMMENDATION_PRIMARY_CONCERN_LABELS | null;
      };
  last_touch_at: Date | null; // null is the signal for the initial-state variant
  open_action_card_count: number;

  // Optional
  doing_business_as?: string | null;
  owner_display_name?: string | null;
  industry_family_name?: string | null;
  active_signal_count?: number; // color, beyond the blocker subset
};

function tenureYears(started: Date, now: Date): number {
  const ms = now.getTime() - started.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
}

function lastTouchRecency(lastTouchAt: Date, now: Date): string {
  const days = Math.floor((now.getTime() - lastTouchAt.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)}+ years ago`;
}

function formatProposalSize(size: number | null): string {
  if (size === null) return "an unsized proposal";
  if (size >= 1_000_000) return `a ~$${(size / 1_000_000).toFixed(size % 1_000_000 === 0 ? 0 : 1)}M proposal`;
  if (size >= 1_000) return `a $${(size / 1_000).toFixed(0)}K proposal`;
  return `a $${size.toLocaleString("en-US")} proposal`;
}

// Sprint 1 review fix #4 — extended to absorb the prior
// ArtifactShareRecord.member_reaction values. Listed in schema order
// (weakest-negative → strongest-positive). The verb table renders
// banker-facing prose for each value so summary templates stay clean.
type ProposalResponse =
  | "declined"
  | "leaning_no"
  | "dismissive"
  | "skeptical"
  | "confused"
  | "neutral"
  | "engaged"
  | "leaning_yes"
  | "committed"
  | "funded";

const PROPOSAL_RESPONSE_VERB: Record<ProposalResponse, string> = {
  declined: "declined",
  leaning_no: "is leaning no on",
  dismissive: "was dismissive of",
  skeptical: "is skeptical of",
  confused: "remains uncertain about",
  neutral: "is neutral on",
  engaged: "is engaged with",
  leaning_yes: "is leaning yes on",
  committed: "has committed to",
  // Sprint 2 §A.3 — `funded` is the terminal closed-won state. The
  // template below picks up an "active and funded" rendering for this
  // case so the resulting prose reads "Member has Working Capital LOC
  // active and funded" rather than copy-pasting the committed verb.
  funded: "has active and funded",
};

/**
 * Initial-state variant — Member with no Conversations on record yet.
 * Selected automatically when last_touch_at is null. The required slot list
 * collapses to the identity slots; signal/proposal/card counts are not part
 * of the prose because they are zero by definition.
 */
function summarizeMemberInitialState(
  input: MemberSummaryInput,
  now: Date,
): Result<string, MissingSlotsError> {
  const missing: string[] = [];
  if (isMissing(input.legal_name)) missing.push("legal_name");
  if (isMissing(input.member_type_name)) missing.push("member_type_name");
  if (isMissing(input.tenure_started_at)) missing.push("tenure_started_at");
  if (isMissing(input.primary_banker_name)) missing.push("primary_banker_name");
  if (missing.length > 0) {
    return err({
      template: `${SUMMARIZE_MEMBER_TEMPLATE}.initial_state`,
      template_version: SUMMARIZE_MEMBER_TEMPLATE_VERSION,
      missing,
    });
  }

  const dba = input.doing_business_as ?? input.legal_name;
  const tenureYear = input.tenure_started_at.getUTCFullYear();
  const years = tenureYears(input.tenure_started_at, now);
  const yearWord = years === 1 ? "year" : "years";
  const sentence1 = `${dba}${
    input.industry_family_name ? `, a ${input.member_type_name} in ${input.industry_family_name}` : `, a ${input.member_type_name}`
  }.`;
  const sentence2 = `Member since ${tenureYear} (${years} ${yearWord} with Blaze); primary banker is ${input.primary_banker_name}.`;
  const sentence3 = "No conversations on record yet.";
  return ok([sentence1, sentence2, sentence3].join(" "));
}

/**
 * Render the canonical Member summary. Selects between the main template and
 * the initial-state template based on last_touch_at.
 */
export function summarizeMember(
  input: MemberSummaryInput,
  now: Date = new Date(),
): Result<string, MissingSlotsError> {
  if (input.last_touch_at === null) {
    return summarizeMemberInitialState(input, now);
  }

  // Main template — required-slot validation
  const missing: string[] = [];
  if (isMissing(input.legal_name)) missing.push("legal_name");
  if (isMissing(input.member_type_name)) missing.push("member_type_name");
  if (isMissing(input.tenure_started_at)) missing.push("tenure_started_at");
  if (isMissing(input.primary_banker_name)) missing.push("primary_banker_name");
  if (input.active_blocker_count === undefined || input.active_blocker_count === null)
    missing.push("active_blocker_count");
  // active_proposal: the slot is required, but null is a valid value (means "no proposal").
  // Reject only if the slot wasn't provided (undefined). null is fine.
  if (input.active_proposal === undefined) missing.push("active_proposal");
  if (input.open_action_card_count === undefined || input.open_action_card_count === null)
    missing.push("open_action_card_count");

  if (missing.length > 0) {
    return err({
      template: SUMMARIZE_MEMBER_TEMPLATE,
      template_version: SUMMARIZE_MEMBER_TEMPLATE_VERSION,
      missing,
    });
  }

  const dba = input.doing_business_as ?? input.legal_name;
  const tenureYear = input.tenure_started_at.getUTCFullYear();
  const years = tenureYears(input.tenure_started_at, now);
  const yearWord = years === 1 ? "year" : "years";
  const lastTouch = lastTouchRecency(input.last_touch_at, now);
  const blockerLabel =
    input.active_blocker_count === 0
      ? "no active blockers"
      : `${input.active_blocker_count} active blocker${input.active_blocker_count === 1 ? "" : "s"}`;
  const cardLabel =
    input.open_action_card_count === 0
      ? "no open ActionCards"
      : `${input.open_action_card_count} open ActionCard${input.open_action_card_count === 1 ? "" : "s"}`;

  // Sentence 1 — identity. Matches Semantic Discipline §3.4 example shape.
  const sentence1 = `${dba}${
    input.industry_family_name ? `, a ${input.member_type_name} in ${input.industry_family_name}` : `, a ${input.member_type_name}`
  }.`;

  // Sentence 2 — relationship.
  const sentence2 = `Member since ${tenureYear} (${years} ${yearWord} with Blaze); primary banker is ${input.primary_banker_name}.`;

  // Sentence 3 — current state.
  const sentence3 = `Last touch was ${lastTouch}; ${blockerLabel}, ${cardLabel}.`;

  // Sentence 4 — proposal status, only when one exists.
  let sentence4 = "";
  if (input.active_proposal !== null) {
    const verb = PROPOSAL_RESPONSE_VERB[input.active_proposal.response];
    const sizeFragment = formatProposalSize(input.active_proposal.size_proposed);
    // Sprint 4.6 Block A — concern phrasing updated for the post-refactor
    // taxonomy. The `bank_capability` / `spouse` / `cpa` / `none` enum
    // values were retired; equivalent semantics now flow through the
    // 17-value compliance-posture-floor taxonomy. Bespoke phrasing for
    // a few high-frequency open-thread concerns; otherwise falls back
    // to the canonical compact label.
    const concernPhrase = input.active_proposal.primary_concern
      ? input.active_proposal.primary_concern === "service_or_capability_concern"
        ? "; concerned about whether the bank can deliver on a deal of this scope"
        : input.active_proposal.primary_concern === "co_decision_maker_household"
          ? "; needs household co-decision-maker input before committing"
          : input.active_proposal.primary_concern === "external_advisor"
            ? "; wants to verify with an external advisor before committing"
            : `; primary concern is ${RECOMMENDATION_PRIMARY_CONCERN_LABELS[input.active_proposal.primary_concern].toLowerCase()}`
      : "";
    sentence4 = `Member ${verb} ${sizeFragment} for ${input.active_proposal.product_name}${concernPhrase}.`;
  }

  const sentences = [sentence1, sentence2, sentence3];
  if (sentence4) sentences.push(sentence4);
  return ok(sentences.join(" "));
}

// ============================================================
// summarizeGrowthTrack
// ============================================================

export const SUMMARIZE_GROWTH_TRACK_TEMPLATE_VERSION = 1;
const SUMMARIZE_GROWTH_TRACK_TEMPLATE = "summarizeGrowthTrack";

export type GrowthTrackSummaryInput = {
  name: string;
  description: string;
  target_member_type_name: string;
  growth_steps: { position: number; title: string; step_shape: string }[];
};

export function summarizeGrowthTrack(
  input: GrowthTrackSummaryInput,
): Result<string, MissingSlotsError> {
  const missing: string[] = [];
  if (isMissing(input.name)) missing.push("name");
  if (isMissing(input.description)) missing.push("description");
  if (isMissing(input.target_member_type_name)) missing.push("target_member_type_name");
  if (!input.growth_steps || input.growth_steps.length === 0) missing.push("growth_steps");
  if (missing.length > 0) {
    return err({
      template: SUMMARIZE_GROWTH_TRACK_TEMPLATE,
      template_version: SUMMARIZE_GROWTH_TRACK_TEMPLATE_VERSION,
      missing,
    });
  }
  const stepNames = [...input.growth_steps]
    .sort((a, b) => a.position - b.position)
    .map((s) => s.title)
    .join(" → ");
  return ok(
    `${input.name} — applies to ${input.target_member_type_name}. ${stepNames}. ${input.description}`,
  );
}

// ============================================================
// summarizeRecommendation
// ============================================================
//
// Version 2 (Q-018): when `rationale_summary` is provided, prefer it over
// `rationale_text` in the output. The summary is the scan-friendly read;
// the full prose is the auditable detail and stays accessible via the
// Member profile's "View full rationale" expand. Snapshot generation
// (when this template is wired in) can rely on the summary for compact
// auditable text without the wall-of-prose feel.
// ============================================================

export const SUMMARIZE_RECOMMENDATION_TEMPLATE_VERSION = 2;
const SUMMARIZE_RECOMMENDATION_TEMPLATE = "summarizeRecommendation";

export type RecommendationSummaryInput = {
  product_name: string;
  size_proposed: number | null;
  structure: "standard" | "phased" | "conservative_first" | "paired_with";
  response: ProposalResponse;
  confidence_band: "low" | "medium" | "high";
  rationale_text: string;
  rationale_summary: string | null;
  primary_concern: keyof typeof RECOMMENDATION_PRIMARY_CONCERN_LABELS | null;
};

export function summarizeRecommendation(
  input: RecommendationSummaryInput,
): Result<string, MissingSlotsError> {
  const missing: string[] = [];
  if (isMissing(input.product_name)) missing.push("product_name");
  // size_proposed: nullable per design (Cygnus has a range, not a number)
  if (isMissing(input.structure)) missing.push("structure");
  if (isMissing(input.response)) missing.push("response");
  if (isMissing(input.confidence_band)) missing.push("confidence_band");
  // At least one of rationale_summary OR rationale_text must be populated.
  if (isMissing(input.rationale_text) && isMissing(input.rationale_summary)) {
    missing.push("rationale_text|rationale_summary");
  }
  // primary_concern: nullable
  if (missing.length > 0) {
    return err({
      template: SUMMARIZE_RECOMMENDATION_TEMPLATE,
      template_version: SUMMARIZE_RECOMMENDATION_TEMPLATE_VERSION,
      missing,
    });
  }
  const sizeFragment =
    input.size_proposed === null
      ? "an unsized proposal"
      : input.size_proposed >= 1_000_000
        ? `at ~$${(input.size_proposed / 1_000_000).toFixed(input.size_proposed % 1_000_000 === 0 ? 0 : 1)}M`
        : input.size_proposed >= 1_000
          ? `at $${(input.size_proposed / 1_000).toFixed(0)}K`
          : `at $${input.size_proposed.toLocaleString("en-US")}`;
  const head = `${input.product_name} ${sizeFragment} (${input.structure} structure, ${input.confidence_band} confidence).`;
  const responseLabel = input.response.replace(/_/g, " ");
  const concernSentence = input.primary_concern
    ? ` Primary concern: ${describePrimaryConcern(input.primary_concern)}`
    : "";
  const rationaleBody = input.rationale_summary ?? input.rationale_text;
  return ok(`${head} Member is ${responseLabel}.${concernSentence} Rationale: ${rationaleBody}`);
}
