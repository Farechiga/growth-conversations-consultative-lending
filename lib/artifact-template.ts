/*
 * Sprint 5d Block A.3 / A.4 — ArtifactTemplate runtime helpers.
 *
 * Pure-function utilities for parsing template_id / parameter_schema /
 * structural_content / output_summary_template, evaluating computed
 * parameters, and rendering output strings with parameter substitution.
 *
 * Used by:
 *   - app/v2/members/[id]/capture-forms/model-form.tsx (parameter input UI)
 *   - app/v2/members/[id]/artifact-template-render.tsx (artifact view)
 */

export type TemplateParameter = {
  key: string;
  label: string;
  type:
    | "text"
    | "long_text"
    | "currency"
    | "decimal"
    | "integer"
    | "percentage"
    | "select"
    | "static_text"; // value set in schema; renders read-only
  options?: string[];
  required?: boolean;
  default?: string | number;
  max?: number;
  min?: number;
  helper?: string;
  /** Read-only fields with a fixed value (e.g., "No prepayment penalties"). */
  value?: string;
  /** When true, the field is auto-computed from `computation`. */
  computed?: boolean;
  /** Simple expression over other parameter keys, e.g. "loan_amount / acquisition_price". */
  computation?: string;
  /**
   * Sprint 8 Block A — when set, the renderer attempts to auto-populate
   * the parameter from the Member's most-recent FactorCapture for this
   * factor. If no capture exists, the parameter renders as a missing-
   * parameter CTA (Block E). Parameters without `source_factor_id` are
   * banker-entered only (no CTA needed).
   */
  source_factor_id?: string;
};

export type ParameterSchema = {
  parameters: TemplateParameter[];
};

export type StructuralSection = {
  label: string;
  fields: string[];
};

export type StructuralRoadmapStage = {
  stage_number: number;
  title: string;
  roles: Array<{ name: string; role: string }>;
  description: string;
};

export type StructuralContent =
  | {
      type: "financing_summary" | "cashflow_projection" | "roi_projection" | "use_plan";
      sections: StructuralSection[];
    }
  | {
      type: "roadmap";
      stages: StructuralRoadmapStage[];
      you_are_here_marker: boolean;
      share_button: { label: string; helper_text: string };
    }
  // Sprint 9 — business-impact visualization types. Each renders a
  // dedicated chart component (no `sections` field — parameters drive
  // the visualization directly). Sprint 9 Patch F added
  // `vehicle_capacity_uplift` — the Business Vehicle Loan
  // before/after capacity comparison that replaces the legacy
  // financing-summary section list.
  | {
      type:
        | "lease_vs_own"
        | "growth_trajectory"
        | "cashflow_equity_dual"
        | "cost_of_doing_nothing"
        | "pace_monthly_savings"
        | "cashback_opportunity"
        | "unsecured_opportunity"
        | "vehicle_capacity_uplift"
        // Sprint 9 Patch G — Business Visa capability matrix. Replaces
        // the cashback-chart framing for TRACK-010 with a four-card
        // operational-infrastructure view.
        | "business_visa_capability";
    }
  // Sprint 9 — paired roadmap + structure comparison for TRACK-008
  // SBA 504. Renders the existing partnership-map roadmap above the
  // new structure comparison chart.
  | {
      type: "sba_504_paired";
      stages: StructuralRoadmapStage[];
      you_are_here_marker: boolean;
      share_button?: { label: string; helper_text: string };
    };

export function parseParameterSchema(json: string | null): ParameterSchema | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as ParameterSchema;
    if (!parsed || !Array.isArray(parsed.parameters)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseStructuralContent(json: string | null): StructuralContent | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as StructuralContent;
    if (!parsed || !parsed.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseTemplateParameters(
  json: string | null,
): Record<string, string> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = v == null ? "" : String(v);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Resolve `{key}` placeholders in a template string against parameter
 * values. Computed parameters (e.g., `ltv_ratio` derived from
 * `loan_amount / acquisition_price`) are evaluated first; the resolved
 * map is then passed through. Unmatched placeholders fall through as
 * `[label]` so the output remains readable while the banker fills more
 * fields in.
 */
export function resolveTemplateString(
  template: string,
  schema: ParameterSchema | null,
  rawValues: Record<string, string>,
): string {
  const values = computeAllValues(schema, rawValues);
  // BUILD 2c (§6) — unfilled fields are OMITTED (not printed as literal
  // "[Label]" text). Mark each empty slot with a sentinel (and absorb a
  // preceding "$"), then drop any clause/sentence that still references an
  // unfilled field so the summary never shows half-finished prose.
  const SENT = "@@EMPTY@@";
  const filled = template.replace(/(\$?)\{(\w+)\}/g, (_, dollar, key) => {
    const v = values[key];
    if (v === undefined || v === "") return SENT;
    const formatted = formatValueForString(
      v,
      schema?.parameters.find((p) => p.key === key),
    );
    return `${dollar}${formatted}`;
  });
  return tidyResolvedString(filled, SENT);
}

// Drop clauses that reference an unfilled field, then clean up stray
// punctuation/whitespace so the omission is invisible.
function tidyResolvedString(s: string, sentinel: string): string {
  // Split into sentences; drop whole sentences that contain a sentinel.
  const sentences = s.match(/[^.]*\.\s*|[^.]+$/g) ?? [s];
  let out = sentences.filter((seg) => !seg.includes(sentinel)).join("");
  // Any residual sentinel (clause without a sentence boundary) → drop that
  // comma-separated clause.
  if (out.includes(sentinel)) {
    out = out
      .split(/,\s*/)
      .filter((c) => !c.includes(sentinel))
      .join(", ");
  }
  return out
    .replace(new RegExp(sentinel, "g"), "")
    .replace(/\$(?=[\s.,;:)]|$)/g, "") // dangling currency symbol
    .replace(/\(\s*\)/g, "") // empty parens
    .replace(/\s+([.,;:)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

/**
 * Evaluate computed parameters using a tiny safe expression evaluator.
 * Supports +, -, *, /, parentheses, decimal literals, and parameter
 * keys. No function calls, no JS eval. Returns the raw values object
 * extended with computed keys.
 */
export function computeAllValues(
  schema: ParameterSchema | null,
  rawValues: Record<string, string>,
): Record<string, string> {
  if (!schema) return rawValues;
  const out: Record<string, string> = { ...rawValues };
  // Static-text parameters carry a fixed value.
  for (const p of schema.parameters) {
    if (p.type === "static_text" && p.value !== undefined && (out[p.key] === undefined || out[p.key] === "")) {
      out[p.key] = p.value;
    }
  }
  for (const p of schema.parameters) {
    if (p.computed && p.computation) {
      const result = evalSimpleExpression(p.computation, out);
      if (result !== null) {
        out[p.key] = formatComputedNumber(result, p);
      }
    }
  }
  return out;
}

function evalSimpleExpression(
  expr: string,
  values: Record<string, string>,
): number | null {
  // Substitute parameter keys with their numeric values.
  const tokens = expr.split(/(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g);
  const substituted = tokens
    .map((t) => {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
        const v = values[t];
        if (v === undefined || v === "") return "NaN";
        const num = Number(stripFormatting(v));
        return Number.isFinite(num) ? String(num) : "NaN";
      }
      return t;
    })
    .join("");
  // Allow only digits, operators, decimals, parens, whitespace.
  if (!/^[0-9+\-*/().\s]+$/.test(substituted)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(`return (${substituted});`);
    const result = fn();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function stripFormatting(v: string): string {
  return v.replace(/[$,%\s]/g, "");
}

// BUILD 2e (Part B) — output-summary currency convention. Returns NO leading
// "$" (the output_summary_template supplies it). ≥$1M → "X.XM" (trim .0);
// $100K–999K → "XXXK"; <$100K → exact with commas.
function formatCurrencyShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 100_000) return `${sign}${Math.round(abs / 1_000)}K`;
  return `${sign}${Math.round(abs).toLocaleString("en-US")}`;
}

function formatComputedNumber(n: number, p: TemplateParameter): string {
  if (p.type === "percentage") return `${(n * 100).toFixed(1).replace(/\.0$/, "")}%`;
  if (p.type === "currency") return formatCurrencyShort(n);
  if (p.type === "integer") return `${Math.round(n)}`;
  if (p.type === "decimal") return n.toFixed(2).replace(/\.?0+$/, "");
  return String(n);
}

function formatValueForString(v: string, p: TemplateParameter | undefined): string {
  if (!p) return v;
  if (p.type === "currency") {
    const n = Number(stripFormatting(v));
    if (Number.isFinite(n)) return formatCurrencyShort(n);
  }
  // BUILD 2e follow-up — captured/string percentage values carry their units
  // already (e.g. "28" = 28%); append "%" if absent so summary prose reads
  // "variance 28%" not "variance 28". Mirrors formatDisplayValue (render side).
  // Template strings never hard-code a literal "%", so this can't double up.
  if (p.type === "percentage") {
    const trimmed = v.replace(/\s+/g, "");
    return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
  }
  return v;
}
