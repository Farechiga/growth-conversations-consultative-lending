/*
 * Sprint 5a.1 Block D — threshold rule evaluator.
 *
 * Pure-function parser/evaluator for MatrixEntry.threshold_rule strings
 * against a Member's FactorCapture set. Hand-rolled recursive-descent;
 * no external parsing library.
 *
 * Supported grammar:
 *   expr        := and_expr ('OR' and_expr)*
 *   and_expr    := comparison ('AND' comparison)*
 *   comparison  := field op operand
 *   field       := snake_case_identifier (BusinessFactor.field_name)
 *   op          := '>=' | '>' | '<=' | '<' | '==' | '!=' | 'IN'
 *   operand     := number | identifier | '[' identifier (',' identifier)* ']'
 *
 * Examples:
 *   "seasonal_variance_pct >= 20"
 *   "seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20"
 *   "growth_obstacle_tag == cashflow_volatility"
 *   "decision_timeline IN [6_months, 12_months]"
 *   "growth_obstacle_tag == cashflow_volatility AND seasonal_variance_pct >= 30"
 *
 * Special cases:
 *   - Null rule: presence check. Returns true if the primary factor's
 *     capture has any non-null value.
 *   - "field != null": always true if the captured value is non-null.
 *   - Cross-factor rules: the captures map is keyed by factor field_name
 *     so a rule can reference any factor's value, not just the matrix
 *     entry's anchored factor. The negative entry on TRACK-002 uses this
 *     (growth_obstacle_tag + seasonal_variance_pct).
 */

export type CaptureValueLike = {
  numerical_value: number | null;
  boolean_value: boolean | null;
  qualitative_value: string | null;
};

// Minimal BusinessFactor shape needed by the evaluator. Accepts the full
// Prisma row or any object with these fields.
export type FactorMeta = {
  field_name: string;
  capture_mode: string;
};

/**
 * Evaluate a threshold rule against a Member's factor captures.
 *
 * @param primary The capture for the matrix entry's anchored factor.
 *   May be null when the Member has not captured the factor.
 * @param factor  Metadata for the anchored factor.
 * @param rule    The rule string from MatrixEntry.threshold_rule, or
 *   null for a presence-based check.
 * @param captures A map keyed by factor field_name → capture, used to
 *   resolve cross-factor field references (e.g., the TRACK-002 negative
 *   that references both growth_obstacle_tag and seasonal_variance_pct).
 *   May be omitted if no cross-factor lookups are expected; in that
 *   case any non-anchored field reference returns false.
 */
export function evaluateThreshold(
  primary: CaptureValueLike | null,
  factor: FactorMeta,
  rule: string | null,
  captures?: Record<string, CaptureValueLike>,
): boolean {
  // Null rule: presence check on the anchored factor.
  if (rule === null) {
    if (!primary) return false;
    return (
      primary.numerical_value !== null ||
      primary.boolean_value !== null ||
      primary.qualitative_value !== null
    );
  }

  const lookupField = (fieldName: string): CaptureValueLike | null => {
    if (fieldName === factor.field_name) return primary;
    if (!captures) return null;
    return captures[fieldName] ?? null;
  };

  return evaluateExpression(rule.trim(), lookupField);
}

// ── Expression evaluator: OR has lowest precedence; AND next; comparison atomic ──

function evaluateExpression(
  expr: string,
  lookup: (field: string) => CaptureValueLike | null,
): boolean {
  // Split on top-level OR (case-sensitive ' OR ' to avoid splitting on
  // identifier substrings; same for AND below).
  const orParts = splitOnTopLevel(expr, " OR ");
  if (orParts.length > 1) {
    return orParts.some((p) => evaluateAnd(p, lookup));
  }
  return evaluateAnd(expr, lookup);
}

function evaluateAnd(
  expr: string,
  lookup: (field: string) => CaptureValueLike | null,
): boolean {
  const parts = splitOnTopLevel(expr, " AND ");
  if (parts.length > 1) {
    return parts.every((p) => evaluateComparison(p.trim(), lookup));
  }
  return evaluateComparison(expr.trim(), lookup);
}

function evaluateComparison(
  expr: string,
  lookup: (field: string) => CaptureValueLike | null,
): boolean {
  // Sprint 5a.2 Block A — LENGTH operator. Pattern:
  //   LENGTH(field_name) <op> N
  // For qualitative_multi factors stored as JSON-array strings on
  // qualitative_value. The captured array is parsed and its length is
  // compared numerically against N. FACTOR-027 (treasury services
  // adopted) is the demo-driving use case — fires "headroom to upgrade"
  // when fewer than 3 services are adopted.
  const lengthMatch = expr.match(
    /^LENGTH\((\w+)\)\s*(>=|<=|==|!=|>|<)\s*(-?\d+)$/,
  );
  if (lengthMatch) {
    const field = lengthMatch[1];
    const op = lengthMatch[2] as ">=" | "<=" | "==" | "!=" | ">" | "<";
    const target = Number(lengthMatch[3]);
    const cap = lookup(field);
    if (!cap || cap.qualitative_value === null) return false;
    let arr: unknown = null;
    try {
      arr = JSON.parse(cap.qualitative_value);
    } catch {
      return false;
    }
    if (!Array.isArray(arr)) return false;
    const len = arr.length;
    switch (op) {
      case ">=": return len >= target;
      case ">":  return len > target;
      case "<=": return len <= target;
      case "<":  return len < target;
      case "==": return len === target;
      case "!=": return len !== target;
    }
  }

  // Try IN-list comparison.
  const inMatch = expr.match(/^(\w+)\s+IN\s+\[([^\]]+)\]$/);
  if (inMatch) {
    const field = inMatch[1];
    const values = inMatch[2].split(",").map((v) => v.trim());
    const cap = lookup(field);
    if (!cap) return false;
    return cap.qualitative_value !== null && values.includes(cap.qualitative_value);
  }

  // Comparison operators ordered longest-first to avoid >= matching as >.
  const operators: Array<[string, ">=" | "<=" | "==" | "!=" | ">" | "<"]> = [
    [">=", ">="],
    ["<=", "<="],
    ["==", "=="],
    ["!=", "!="],
    [">", ">"],
    ["<", "<"],
  ];
  for (const [token, op] of operators) {
    const idx = expr.indexOf(` ${token} `);
    if (idx >= 0) {
      const field = expr.slice(0, idx).trim();
      const operand = expr.slice(idx + token.length + 2).trim();
      return compare(field, op, operand, lookup);
    }
  }
  return false;
}

function compare(
  field: string,
  op: ">=" | ">" | "<=" | "<" | "==" | "!=",
  operand: string,
  lookup: (field: string) => CaptureValueLike | null,
): boolean {
  const cap = lookup(field);
  // "field != null" syntactic sugar — true when capture exists.
  if (operand === "null") {
    const isNull =
      !cap ||
      (cap.numerical_value === null &&
        cap.boolean_value === null &&
        cap.qualitative_value === null);
    return op === "==" ? isNull : op === "!=" ? !isNull : false;
  }
  if (!cap) return false;

  // Numerical comparison: operand parses as a number.
  const numericOperand = Number(operand);
  if (!Number.isNaN(numericOperand) && cap.numerical_value !== null) {
    const lhs = cap.numerical_value;
    switch (op) {
      case ">=": return lhs >= numericOperand;
      case ">":  return lhs > numericOperand;
      case "<=": return lhs <= numericOperand;
      case "<":  return lhs < numericOperand;
      case "==": return lhs === numericOperand;
      case "!=": return lhs !== numericOperand;
    }
  }

  // Boolean comparison: operand is "true" / "false".
  if (operand === "true" || operand === "false") {
    if (cap.boolean_value === null) return false;
    const target = operand === "true";
    return op === "==" ? cap.boolean_value === target : cap.boolean_value !== target;
  }

  // Qualitative comparison: operand is an identifier (snake_case tag).
  if (cap.qualitative_value !== null) {
    return op === "=="
      ? cap.qualitative_value === operand
      : op === "!="
      ? cap.qualitative_value !== operand
      : false;
  }

  return false;
}

// Split an expression on a top-level token (e.g., " AND " / " OR ").
// Currently the grammar has no parentheses, so this is a simple
// case-sensitive split. Kept as a helper so a future grammar
// extension (parens for explicit grouping) can refine without
// touching every caller.
function splitOnTopLevel(expr: string, token: string): string[] {
  return expr.split(token);
}
