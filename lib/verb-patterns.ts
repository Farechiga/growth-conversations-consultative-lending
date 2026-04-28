/*
 * Verb-pattern registry — Sprint 1 Prompt 1 §E.
 *
 * Canonical verb vocabulary for the verb-prefix lines that surface meaningful
 * relationships in the UI. The pattern from Open Opportunities ("→ serves goal:",
 * "→ addresses blocker:") propagates across the page; every verb that appears
 * comes from this registry.
 *
 * Two-File Rule discipline alongside lib/relation-names.ts: new verbs require
 * adding here first before being used in code. Where verbs reuse across
 * sections, they must be identical, not approximations — the system's
 * vocabulary should feel canonical, not freestyle.
 */

export const VERB_PATTERNS = {
  // ────────────────────────────────────────────────
  // Recommendation → Signal relationships (Block 4)
  // ────────────────────────────────────────────────
  serves: {
    description:
      "Recommendation or Conversation that addresses a member-stated goal Signal.",
    contexts: ["Recommendation → goal Signal", "Conversation → goal Signal"],
  },
  addresses: {
    description:
      "Recommendation or ActionCard that addresses a blocker Signal preventing member progress.",
    contexts: [
      "Recommendation → blocker Signal",
      "ActionCard → blocker Signal",
    ],
  },
  responds_to: {
    description:
      "Recommendation or ActionCard that responds to an indecision Signal preventing closure, or to a trigger Signal indicating a forward-looking event.",
    contexts: [
      "Recommendation → indecision Signal",
      "ActionCard → indecision Signal",
      "Recommendation → trigger Signal",
    ],
  },

  // ────────────────────────────────────────────────
  // ActionCard → other entities
  // ────────────────────────────────────────────────
  de_risks: {
    description:
      "ActionCard whose purpose is to de-risk an existing engaged Recommendation, typically by addressing a stated concern or providing supporting materials.",
    contexts: ["ActionCard → Recommendation"],
  },
  hands_off: {
    description:
      "ActionCard that transfers responsibility to a specialist Banker, typically with context for the receiving party.",
    contexts: ["ActionCard → specialist Banker"],
  },
  resolves: {
    description:
      "ActionCard whose completion will close out an open issue, blocker, or pending decision.",
    contexts: ["ActionCard → blocker Signal", "ActionCard → Recommendation"],
  },
  explores: {
    description:
      "ActionCard initiated to investigate a forward-looking trigger Signal whose implications are not yet clear.",
    contexts: ["ActionCard → trigger Signal"],
  },
  nurtures: {
    description:
      "ActionCard for ongoing relationship maintenance without immediate transactional intent.",
    contexts: ["ActionCard → Member"],
  },

  // ────────────────────────────────────────────────
  // Artifact share → other entities
  // ────────────────────────────────────────────────
  supports: {
    description:
      "Artifact share record indicating the artifact was used in service of a specific Recommendation or opportunity.",
    contexts: ["Artifact share → Recommendation"],
  },

  // ────────────────────────────────────────────────
  // Conversation → other entities
  // ────────────────────────────────────────────────
  produced: {
    description:
      "Conversation that originated a downstream Recommendation or significant Signal.",
    contexts: ["Conversation → Recommendation", "Conversation → Signal"],
  },
  captured: {
    description:
      "Conversation that originated a notable Signal (typically a goal, trigger, or blocker first surfaced).",
    contexts: ["Conversation → Signal"],
  },
  resolved: {
    description:
      "Conversation that closed an opportunity (committed, declined, or otherwise terminated).",
    contexts: ["Conversation → Recommendation closure"],
  },
  introduced: {
    description:
      "Onboarding-type Conversation that originated the Member relationship.",
    contexts: ["Conversation → Member relationship origin"],
  },

  // ────────────────────────────────────────────────
  // Sprint 4 §F.4 — Growth Conversations + signal longevity + skip handling
  // ────────────────────────────────────────────────
  supersedes: {
    description:
      "Newer Signal record that replaces a stale prior capture. The prior Signal is retained immutably; the supersession reference makes the most-recent state queryable while preserving the audit trail.",
    contexts: ["Signal → Signal"],
  },
  skipped: {
    description:
      "GrowthStepExecution where the banker explicitly skipped the stage rather than capturing content. Skip-state is recorded with confirming banker, timestamp, and optional reason. Skip patterns are queryable for Insight Engine analytics.",
    contexts: ["GrowthStepExecution"],
  },
  affects: {
    description:
      "Macro that targets a specific industry family or Member Type. Surfaces as the Member-profile context banner when a Member's Member Type matches the Macro's affected_member_types.",
    contexts: ["Macro → IndustryFamily", "Macro → MemberType"],
  },
} as const;

export type VerbPattern = keyof typeof VERB_PATTERNS;

/**
 * Banker-facing rendering of a verb. Replaces underscores with spaces.
 */
export function renderVerb(verb: VerbPattern): string {
  return verb.replace(/_/g, " ");
}
