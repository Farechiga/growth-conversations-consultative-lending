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

export const RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS = {
  none: "No specific concern — the member is ready to commit or has no remaining hesitation.",
  rate:
    "Member's hesitation is rooted in the price of the proposal. Resolution typically requires either rate negotiation, comparison to alternatives, or reframing the cost in terms of total benefit.",
  speed:
    "Member's hesitation is rooted in timing — either the bank's processing speed, the member's decision-making timeline, or the urgency of the underlying need. Distinct from `bank_capability` (institutional capacity) and `timing` (broader sequencing).",
  commitment:
    "Member is hesitant about the binding nature of the proposal — long-term debt service, multi-year commitment, or irreversibility. Often surfaces as preference for phased or smaller-pilot structures.",
  spouse:
    "Member needs spousal input before committing. Common in owner-operator businesses where the spouse is involved in financial decisions even if not in operations. Resolution requires bringing the spouse into a subsequent conversation.",
  cpa:
    "Member needs to verify with their accountant before committing. The accountant's role is typically to vet tax and cash-flow implications. Resolution requires the bank providing materials the member can share with the CPA, then following up after that meeting.",
  partner:
    "Member needs business-partner input before committing. Distinct from `spouse` (personal authority) — a partner is a co-decision-maker in the business. Resolution requires bringing the partner into the conversation.",
  timing:
    "The proposal is right but the timing is wrong — seasonality, an anticipated business event, or sequencing relative to other commitments. Resolution typically requires a calendared follow-up rather than rate or structure change.",
  bank_capability:
    "Member's hesitation is rooted in uncertainty about whether the bank can actually deliver on a proposal of the specified size, structure, or sophistication. Distinct from `rate` (which is about price) or `speed` (which is about timing) — `bank_capability` is about institutional capacity. Most common in established commercial relationships where the member is comparing the bank's offering to a regional or national commercial bank's track record.",
  other:
    "Hesitation that does not fit the canonical concern types. Always paired with banker_note context so the underlying reason is recoverable; chronic use of `other` is a signal that a new canonical value should be proposed.",
  // Sprint 4 §4.2a refinement #3 — decline-reason values. These surface
  // only when Recommendation.response is `declined` or `dismissive`; the
  // form's contextual option set switches to these for closure capture.
  // Some decline reasons reuse open-thread values with different
  // banker-facing labels (rate → "Rate too high", timing → "Timing
  // wrong", bank_capability → "Doesn't trust institution") — see
  // resolve-section.tsx for the contextual label resolution.
  terms_unfavorable:
    "Member declined because the structural terms (covenants, prepayment penalties, collateral requirements, amortization shape) didn't fit their situation, even setting aside rate. Resolution path is product-design — different structure, paired product, or specialist consultation.",
  going_with_competitor:
    "Member chose another lender's offer. Important to capture which competitor and why — pricing, relationship, speed, sophistication — for portfolio-level pattern analysis. Distinct from `lost_interest` (no longer pursuing) and `circumstances_changed` (need disappeared).",
  no_longer_needed:
    "The underlying need that prompted the conversation has resolved without bank financing. Member solved it with internal cash, a different bank product, or by changing the underlying business plan. Distinct from `circumstances_changed` (broader business pivot) and `going_with_competitor` (competitive loss).",
  does_not_qualify:
    "Member doesn't meet the underwriting bar for this product — DTI, credit profile, collateral coverage, or operating history. The conversation closes here even if the member would have committed; the decline is on the bank's side. Often paired with a referral to specialist or to a different product the member does qualify for.",
  lost_interest:
    "Member's engagement faded between conversations without a specific blocker. Distinct from `going_with_competitor` (lost to alternative) and `circumstances_changed` (specific event). Often signals the original framing didn't sustain attention; pattern analysis at the Insight Engine layer tracks lost-interest rates by product and Member Type.",
  found_alternative:
    "Member solved the need with non-bank financing — owner equity injection, vendor financing, customer prepayment, equity raise, or a non-traditional alternative. Important to capture for Insight Engine analytics tracking which alternatives are eroding bank-financing market share by Member Type.",
  circumstances_changed:
    "A specific business event shifted the calculus — lost a major customer, changed strategy, sold the business, paused expansion. The decline is contextual rather than about the proposal itself; the Member may re-engage when circumstances stabilize.",
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
export const RECOMMENDATION_PRIMARY_CONCERN_LABELS: Record<
  keyof typeof RECOMMENDATION_PRIMARY_CONCERN_DESCRIPTIONS,
  string
> = {
  none: "No concern",
  rate: "Rate",
  speed: "Speed",
  commitment: "Commitment level",
  spouse: "Needs spouse's input",
  cpa: "Needs CPA review",
  partner: "Needs business partner's input",
  timing: "Timing",
  bank_capability: "Bank capability",
  other: "Other",
  // Sprint 4 §4.2a refinement #3 — decline-context labels. The Resolve
  // form maps these to friendlier per-context strings ("Rate too high"
  // for declined; just "Rate" for open-thread). Compact labels here
  // for use in History timeline / Insight Engine list views.
  terms_unfavorable: "Terms unfavorable",
  going_with_competitor: "Went with competitor",
  no_longer_needed: "No longer needed",
  does_not_qualify: "Doesn't qualify",
  lost_interest: "Lost interest",
  found_alternative: "Found alternative funding",
  circumstances_changed: "Circumstances changed",
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
