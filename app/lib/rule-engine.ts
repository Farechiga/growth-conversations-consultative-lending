/*
 * Rule engine — evaluates Rule.conditions AST against (Member + activeSignals).
 *
 * Rule.conditions is stored as JSONB in the shape documented in Data Framework
 * §6.7. The supported operand types map to the Rule examples in brief §2.5:
 *   - signal_match         { topic_id, active }
 *   - product_not_held     { product_subcategory }
 *   - product_held         { product_subcategory }
 *   - member_type_match    { member_type_id }
 *   - trigger_within_window  (deferred — no fixture rule uses it)
 *
 * Logical operators: and, or, not. Operators nest.
 *
 * The engine is intentionally explicit and inspectable — every rule firing can
 * be traced through the AST, no black-box scoring. This is how the Data
 * Framework §5.4 promises examiner-readable rule logic.
 */

export type RuleOperand =
  | { type: "signal_match"; params: { topic_id: string; active?: boolean } }
  | { type: "product_held"; params: { product_subcategory: string } }
  | { type: "product_not_held"; params: { product_subcategory: string } }
  | { type: "member_type_match"; params: { member_type_id: string } }
  | RuleConditionsNode;

export type RuleConditionsNode =
  | { operator: "and"; operands: RuleOperand[] }
  | { operator: "or"; operands: RuleOperand[] }
  | { operator: "not"; operands: [RuleOperand] };

export type RuleConditions = RuleConditionsNode;

export type EvalContext = {
  member: { id: string; member_type_id: string };
  activeSignals: { topic_id: string }[];
  productsHeld: { product_subcategory: string }[]; // pulled from MemberType lookup or the held-Product's subcategory
};

function isNode(op: RuleOperand): op is RuleConditionsNode {
  return (op as RuleConditionsNode).operator !== undefined;
}

export function evaluate(node: RuleOperand, ctx: EvalContext): boolean {
  if (isNode(node)) {
    switch (node.operator) {
      case "and":
        return node.operands.every((o) => evaluate(o, ctx));
      case "or":
        return node.operands.some((o) => evaluate(o, ctx));
      case "not":
        return !evaluate(node.operands[0], ctx);
    }
  }

  switch (node.type) {
    case "signal_match": {
      const wantActive = node.params.active ?? true;
      if (!wantActive) return true; // out of v1 scope; rules so far always check active
      return ctx.activeSignals.some((s) => s.topic_id === node.params.topic_id);
    }
    case "product_held":
      return ctx.productsHeld.some((p) => p.product_subcategory === node.params.product_subcategory);
    case "product_not_held":
      return !ctx.productsHeld.some((p) => p.product_subcategory === node.params.product_subcategory);
    case "member_type_match":
      return ctx.member.member_type_id === node.params.member_type_id;
  }
}

/**
 * Run every Rule against a Member's state. Returns the rules that fired,
 * with their output Growth tracks, ordered by confidence_band (high > medium > low).
 */
export function fireRules(
  rules: {
    id: string;
    name: string;
    conditions: RuleConditions;
    confidence_band: "low" | "medium" | "high";
    output_growth_tracks: { id: string; name: string }[];
  }[],
  ctx: EvalContext,
): { rule: { id: string; name: string; confidence_band: "low" | "medium" | "high" }; growth_tracks: { id: string; name: string }[] }[] {
  const order = { high: 0, medium: 1, low: 2 } as const;
  return rules
    .filter((r) => evaluate(r.conditions, ctx))
    .sort((a, b) => order[a.confidence_band] - order[b.confidence_band])
    .map((r) => ({
      rule: { id: r.id, name: r.name, confidence_band: r.confidence_band },
      growth_tracks: r.output_growth_tracks,
    }));
}
