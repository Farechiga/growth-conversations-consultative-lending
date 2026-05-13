/*
 * Enum value descriptions — Semantic Discipline Principle 3.
 *
 * Human-readable prose for enum values that surface in summaries, tooltips,
 * Insight Engine views, or LLM-facing layers. Banker UI labels and natural-language
 * summary sentences pull from here so prose stays in one place and tokens stay
 * for joining.
 *
 * The full enum value set is defined in prisma/schema.prisma. Values not yet
 * descriptioned below are deferred until they appear in a user-facing surface;
 * tracked as TODO items inline rather than in OPEN_QUESTIONS to avoid noise.
 */

// Sprint 4.6 Block A — Recommendation.primary_concern descriptions for the
// 17-value compliance-posture-floor taxonomy per COMPLIANCE.md §6 and the
// resolved Q-041. The descriptions below are banker-facing prose for the
// Resolve form's expanded help, summary templates, and Insight Engine
// surfaces. All values are member-direction (capture what the Member said
// or what's driving their decision process) — bank-side underwriting
// determinations are excluded by design and deferred to Q-042 governance
// for any future structured capture.
//
// The taxonomy splits into three groups:
//   1. Open-thread (engaged / leaning_yes / committed) — 7 unique values
//   2. Decline-reason (declined / dismissive) — 9 unique values
//   3. Shared (`service_or_capability_concern`) — appears in both
export const RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS = {
  // Open-thread context
  pricing_concern:
    "Member is open to the proposal but pricing — rate, fees, or all-in cost — is the open thread. Resolution typically requires rate review, structure adjustment, or reframing the cost against total benefit. Distinct from `pricing_uncompetitive` (decline-context: Member chose elsewhere on price).",
  terms_concern:
    "Member is open to the proposal but the structural terms (covenants, collateral asks, amortization, prepayment) are the open thread. Resolution requires product-design adjustment or specialist consultation.",
  timing_concern:
    "Member is open to the proposal but timing (cashflow, business calendar, sequencing relative to other commitments) is the open thread. Resolution typically requires a calendared follow-up rather than structure or pricing change.",
  co_decision_maker_household:
    "Member needs input from a household co-decision-maker before advancing — typically a spouse or family member with shared financial authority. Common in owner-operator businesses. Resolution requires bringing the co-decision-maker into a subsequent conversation. Direction-explicit framing replaces the prior `spouse` enum value.",
  external_advisor:
    "Member needs to verify with an external professional advisor (accountant, attorney, financial planner) before advancing. The advisor's role is typically to vet tax, cashflow, or legal implications. Resolution requires materials the Member can share with the advisor, then a follow-up after that consultation. Replaces the prior `cpa` enum value.",
  co_owner_or_board:
    "Member needs input from a business co-owner, board member, or other governance authority before advancing. Distinct from `co_decision_maker_household` (personal authority); a co-owner or board member is a business co-decision-maker. Resolution requires bringing them into the conversation. Replaces the prior `partner` enum value.",
  other_open_thread:
    "Open thread that doesn't fit the canonical engaged-context values. Always paired with banker_note context so the underlying reason is recoverable; chronic use of `other_open_thread` is a signal that a new canonical value should be proposed.",
  // Decline-reason context
  pricing_uncompetitive:
    "Member declined because pricing — rate, fees, or all-in cost — was higher than an alternative they were considering. Captures member-stated price comparison; not the bank's pricing decision.",
  terms_uncompetitive:
    "Member declined because the structural terms (covenants, collateral asks, amortization, prepayment) didn't fit their preferred deal shape. Captures member-side fit; not the bank's structuring decision.",
  timing_misaligned:
    "Member declined because the proposed financing didn't match their cashflow timing or business calendar. Captures member-side timing; resolution path is calendared revisit.",
  chose_alternative_lender:
    "Member proceeded with a different lender. Important to capture which competitor when offered, for portfolio-level pattern analysis. Distinct from `chose_alternative_funding` (non-debt) and `wants_to_revisit_later` (Member still interested).",
  chose_alternative_funding:
    "Member chose non-debt funding — retained earnings, owner injection, vendor financing, customer prepayment, equity raise, or other non-traditional alternative. Important for Insight Engine analytics tracking which alternatives erode bank-financing market share by Member Type.",
  need_resolved_otherwise:
    "The underlying business need that prompted the conversation was met without this financing. Member solved it through a different mechanism (cash, different bank product, business plan change). Distinct from `need_no_longer_present` (need disappeared) and `chose_alternative_funding` (different funding source for the same need).",
  need_no_longer_present:
    "The underlying business situation changed; financing is no longer needed. Examples: lost a major customer, paused expansion, sold the business, changed strategy. The decline is contextual rather than about the proposal itself; the Member may re-engage when circumstances stabilize.",
  wants_to_revisit_later:
    "Member is interested but not ready to act in this cycle. Captures member-side pacing without a specific blocker. Resolution is calendared follow-up at the Member's stated horizon.",
  other_member_stated:
    "Member stated a reason for declining that doesn't fit the canonical decline-context values. Free-text capture in Closing notes. Chronic use is a signal that a new canonical value should be proposed.",
  // Shared across both contexts
  service_or_capability_concern:
    "Member's concern is the bank's ability to deliver — response time, expertise, product range, sophistication. Captures member-side service or capability assessment without the UDAAP-risky `doesn't trust the institution` framing. Replaces the prior `bank_capability` enum value. Appears in both engaged-context (open thread) and decline-context (member-stated decline reason).",
} as const;

/**
 * Render a primary_concern enum value as banker-facing prose.
 * Used by Member, Recommendation, and ActionCard summary templates.
 */
export function describePrimaryConcern(
  value: keyof typeof RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS | null | undefined,
): string {
  if (!value) return "no recorded concern";
  return RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS[value] ?? value;
}

/**
 * Short banker-facing label (sentence-case) for a primary_concern value, suitable
 * for badges, list rows, and other compact surfaces. The full description (above)
 * is for tooltips, summaries, and analytical views.
 */
// Sprint 4.6 Block A — compact labels for the post-refactor taxonomy.
// Used by History timeline rows, Insight Engine list views, and any
// non-form surface that surfaces a primary_concern value. The Resolve
// form's contextual dropdown options live in `resolve-section.tsx` and
// may use slightly different prose (e.g., "pricing" vs "Pricing
// concern" vs "Pricing uncompetitive") — this map is the canonical
// short label.
export const RECOMMENDATION_PRIMARY_CONCERN_LABELS: Record<
  keyof typeof RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS,
  string
> = {
  // Open-thread context
  pricing_concern: "Pricing concern",
  terms_concern: "Terms concern",
  timing_concern: "Timing concern",
  co_decision_maker_household: "Needs household co-decision-maker input",
  external_advisor: "Needs external advisor review",
  co_owner_or_board: "Needs co-owner / board input",
  other_open_thread: "Other (open thread)",
  // Decline-reason context
  pricing_uncompetitive: "Pricing uncompetitive",
  terms_uncompetitive: "Terms uncompetitive",
  timing_misaligned: "Timing misaligned",
  chose_alternative_lender: "Chose alternative lender",
  chose_alternative_funding: "Chose alternative funding",
  need_resolved_otherwise: "Need resolved otherwise",
  need_no_longer_present: "Need no longer present",
  wants_to_revisit_later: "Wants to revisit later",
  other_member_stated: "Other (member-stated)",
  // Shared
  service_or_capability_concern: "Service or capability concern",
};

/**
 * RecommendationResponse value descriptions — Sprint 1 review fix #4.
 *
 * The enum was extended to absorb ArtifactShareRecord.member_reaction; the
 * principle is that the last interaction is the truest signal of member
 * state, so intermediate captures of how the member reacted to specific
 * Artifacts are subsumed by the final Resolve-step response on the
 * Recommendation. Values are listed in the schema in
 * weakest-negative → strongest-positive order; descriptions below match.
 *
 * Authored under Semantic Discipline Principle 3 (human-readable enums) so
 * banker UI labels, summary templates, and LLM-facing layers can pull
 * canonical prose from one place.
 */
export const RECOMMENDATION_RESPONSE_DESCRIPTIONS = {
  declined:
    "Member explicitly declined the proposal. A clear no, distinct from a deferred or hesitant state.",
  leaning_no:
    "Member is signaling they're likely to decline but hasn't formally said no. Resolution requires either reframing the proposal or accepting the no.",
  dismissive:
    "Member explicitly rejected or showed strong disinterest in what was discussed; not the same as a formal `declined` decision but a clear negative signal.",
  skeptical:
    "Member expressed doubt or pushback on what was discussed; they're not dismissive but they need more convincing.",
  confused:
    "Member appeared to not fully understand what was discussed; the conversation needs further clarification before a decision direction can form.",
  neutral:
    "Member is genuinely undecided — neither leaning positive nor negative. The proposal is on the table but the member needs more time, information, or context.",
  engaged:
    "Member showed active interest and engagement with what was discussed; they leaned in without yet committing to a decision direction.",
  leaning_yes:
    "Member is signaling they're likely to accept but hasn't formally committed. Resolution typically involves addressing a specific remaining concern (often surfaced as primary_concern).",
  committed:
    "Member has committed to the proposal. Distinct from `leaning_yes` (still hedging) — `committed` means the member has formally said yes and the work shifts to closing.",
  funded:
    "The opportunity has closed and money has flowed. Terminal state in the journey; the Recommendation is closed-won. Distinct from `committed` which captures member intent but precedes operational funding.",
} as const;

export function describeRecommendationResponse(
  value: keyof typeof RECOMMENDATION_RESPONSE_DESCRIPTIONS,
): string {
  return RECOMMENDATION_RESPONSE_DESCRIPTIONS[value];
}

/**
 * ParameterProvenance value descriptions — Sprint 4 §A.6 (Sprint 3 review §3c).
 *
 * Each ArtifactParameterCapture row carries a provenance label that
 * tracks where the parameter value came from. The Insight Engine
 * eventually correlates provenance distribution with funding outcomes;
 * the demo phase doesn't compute the rollup but the data shape supports
 * it. Descriptions live here so summary templates and UI labels render
 * banker-facing prose, not bare tokens.
 */
export const PARAMETER_PROVENANCE_DESCRIPTIONS = {
  member_profile:
    "Parameter value pulled from existing Member profile data (e.g., revenue band, fleet size, employee count). Auto-populated by the system; banker did not type it.",
  captured_signal:
    "Parameter value derived from a captured Signal during Ask or Size phase (e.g., a magnitude or quantification the Member stated). Auto-populated; provenance preserved.",
  banker_assumption:
    "Parameter value entered by the banker as a working assumption (e.g., proposed financing rate based on similar deals). Banker judgment, not Member-stated.",
  member_stated_in_followup:
    "Parameter value the Member provided directly in a follow-up after the Show phase (e.g., 'actually our average call value is closer to $850'). Highest-confidence provenance.",
} as const;

export function describeParameterProvenance(
  value: keyof typeof PARAMETER_PROVENANCE_DESCRIPTIONS,
): string {
  return PARAMETER_PROVENANCE_DESCRIPTIONS[value];
}

/**
 * Severity level descriptions — used in Signal summary prose and Insight
 * Engine cell tooltips so the difference between manageable / painful /
 * threatening is concrete rather than ordinal-only.
 */
export const SEVERITY_DESCRIPTIONS = {
  manageable:
    "The issue exists but the member is coping with it; not currently driving urgent action.",
  painful:
    "The issue is actively causing strain; the member is feeling it and likely to engage with a credible reframe.",
  threatening:
    "The issue is at a level where the member is making strategic decisions in response — either to the bank's benefit (engaging seriously) or away from it (looking elsewhere).",
} as const;

export function describeSeverity(value: keyof typeof SEVERITY_DESCRIPTIONS): string {
  return SEVERITY_DESCRIPTIONS[value];
}
