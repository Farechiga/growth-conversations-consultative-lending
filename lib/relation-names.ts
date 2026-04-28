/*
 * Relation-name registry — Semantic Discipline Principle 2.
 *
 * Prisma's @relation names are join-table identifiers, not semantic
 * verb-phrases. This module is the canonical mapping from Prisma's structural
 * relations to the verb-phrases the LLM-facing summary layer (and the prose
 * templates in lib/summaries.ts) read when describing the schema.
 *
 * Two-File Rule discipline: when a relation is added or changed in
 * prisma/schema.prisma, this registry must be updated in the same commit.
 *
 * Semantic Discipline §3.2 names this approach "named relationships" — every
 * entity-to-entity link carries a verb-phrase that reads aloud as a sentence.
 * Reading "Member fits MemberType" tells you what the link means without
 * inspecting the schema.
 */

export type RelationName =
  // Member relations
  | "fits" // Member → MemberType
  | "owned_by" // Member → Banker (primary banker)
  | "holds" // Member ↔ Product (via core_sync_state)
  // MemberType relations
  | "characteristically_blocked_by" // MemberType ↔ Topic (blocker tags)
  | "characteristically_triggered_by" // MemberType ↔ Topic (trigger tags)
  | "characteristically_pursues" // MemberType ↔ Topic (goal tags)
  // Conversation relations
  | "held_with" // Conversation → Member
  | "led_by" // Conversation → Banker
  | "executed" // Conversation → GrowthStepExecution
  // GrowthStepExecution relations
  | "instance_of" // GrowthStepExecution → GrowthStep
  | "produced" // GrowthStepExecution → Signal
  | "spawned" // GrowthStepExecution → ActionCard
  | "surfaced" // GrowthStepExecution → Recommendation
  // Signal relations
  | "references" // Signal → Topic
  | "anchored_to" // Signal → Member, ActionCard → Member
  // ActionCard relations
  | "assigned_to" // ActionCard → Banker
  | "originated_from" // ActionCard → Conversation
  // GrowthTrack relations
  | "applies_to" // GrowthTrack → MemberType
  | "comprises" // GrowthTrack → GrowthStep (ordered)
  | "responds_to_blocker" // GrowthTrack → Topic (blocker triggers)
  | "responds_to_trigger" // GrowthTrack → Topic (trigger triggers)
  // Rule relations
  | "surfaces" // Rule → GrowthTrack
  // Note: GrowthStepExecution → Recommendation already uses the distinct verb
  // "surfaced" (past-tense). The bare "surfaces" verb here on Rule is unambiguous
  // because the source column always names the entity.
  // Recommendation relations (additional — see Recommendation row below)
  | "responds_to" // Recommendation → Signal (Q-016)
  // Sprint 4 §F.4 additions
  | "supersedes" // Signal → Signal (a newer Signal supersedes a stale prior capture)
  | "captured_during" // ArtifactParameterCapture → GrowthStepExecution
  | "authored_by" // Macro → Banker (when authored internally)
  | "affects_industry" // Macro → IndustryFamily (Json-indexed many-to-many)
  | "affects_member_type"; // Macro → MemberType (Json-indexed many-to-many)

/**
 * The canonical mapping. Read each entry as a sentence: subject + verb-phrase + object.
 * Where the same verb-phrase appears for multiple subject-object pairs, the
 * source/target columns disambiguate.
 */
export const RELATION_NAMES = [
  { source: "Member", verb: "fits", target: "MemberType" },
  { source: "Member", verb: "owned_by", target: "Banker" },
  { source: "Member", verb: "holds", target: "Product" },

  { source: "MemberType", verb: "characteristically_blocked_by", target: "Topic" },
  { source: "MemberType", verb: "characteristically_triggered_by", target: "Topic" },
  { source: "MemberType", verb: "characteristically_pursues", target: "Topic" },

  { source: "Conversation", verb: "held_with", target: "Member" },
  { source: "Conversation", verb: "led_by", target: "Banker" },
  { source: "Conversation", verb: "executed", target: "GrowthStepExecution" },

  { source: "GrowthStepExecution", verb: "instance_of", target: "GrowthStep" },
  { source: "GrowthStepExecution", verb: "produced", target: "Signal" },
  { source: "GrowthStepExecution", verb: "spawned", target: "ActionCard" },
  { source: "GrowthStepExecution", verb: "surfaced", target: "Recommendation" },

  { source: "Signal", verb: "references", target: "Topic" },
  { source: "Signal", verb: "anchored_to", target: "Member" },

  { source: "ActionCard", verb: "assigned_to", target: "Banker" },
  { source: "ActionCard", verb: "anchored_to", target: "Member" },
  { source: "ActionCard", verb: "originated_from", target: "Conversation" },

  { source: "GrowthTrack", verb: "applies_to", target: "MemberType" },
  { source: "GrowthTrack", verb: "comprises", target: "GrowthStep" },
  { source: "GrowthTrack", verb: "responds_to_blocker", target: "Topic" },
  { source: "GrowthTrack", verb: "responds_to_trigger", target: "Topic" },

  { source: "Rule", verb: "surfaces", target: "GrowthTrack" },

  { source: "Recommendation", verb: "responds_to", target: "Signal" },

  // Sprint 4 §F.4 — Signal supersession (longevity tracking).
  { source: "Signal", verb: "supersedes", target: "Signal" },

  // Sprint 4 §F.4 — ArtifactParameterCapture provenance link.
  {
    source: "ArtifactParameterCapture",
    verb: "captured_during",
    target: "GrowthStepExecution",
  },

  // Sprint 4 §F.4 — Macro authorship + targeting.
  { source: "Macro", verb: "authored_by", target: "Banker" },
  { source: "Macro", verb: "affects_industry", target: "IndustryFamily" },
  { source: "Macro", verb: "affects_member_type", target: "MemberType" },
] as const satisfies ReadonlyArray<{ source: string; verb: RelationName; target: string }>;

/**
 * Look up the verb-phrase for a (source, target, optional disambiguator) tuple.
 * Used by summary-template prose generation when expressing relationships in
 * natural language.
 */
export function relationVerb(
  source: string,
  target: string,
  filter?: (entry: (typeof RELATION_NAMES)[number]) => boolean,
): RelationName | undefined {
  const matches = RELATION_NAMES.filter((r) => r.source === source && r.target === target);
  const narrowed = filter ? matches.filter(filter) : matches;
  return narrowed[0]?.verb;
}
