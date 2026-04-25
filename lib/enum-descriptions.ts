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
};

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
