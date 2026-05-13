/*
 * Sprint 5b.1 Block E — Anthropic API integration for Insight matching.
 *
 * `matchInsight()` is called when a banker authors an Insight during a
 * demo session. It does the following:
 *
 *   1. Filter candidate Patterns by track_id + signal_tag_scope (when
 *      addresses_signal is set; otherwise broad track-only filter).
 *   2. Format the candidates + banker content + context as a prompt
 *      for Claude.
 *   3. Call the Anthropic Messages API with a 5-second timeout.
 *   4. Parse the response into { matchedPatternId, confidence, feedback }.
 *   5. Apply the confidence threshold per Sprint 5b.1 §E.2: ≥0.7 →
 *      'routine'; <0.7 → 'novel'.
 *
 * Graceful fallback per Francisco's caveat (b): if the API call
 * exceeds 5s or errors, return a generic affirmation with state='novel'
 * (flag for senior review). The banker's authored content is still
 * saved; the matching just doesn't surface a canonical reference.
 *
 * Demo robustness per Francisco's caveat (a): seed Insights ship with
 * cached match data (Block D); this function only fires for live
 * banker-authored Insights during a demo session. EVP day depends on:
 *   - ANTHROPIC_API_KEY env var being set (Pilot phase: secret manager)
 *   - 5-second timeout being short enough that demo doesn't stall
 *   - Pre-EVP verification per Francisco's caveat (c)
 *
 * Compliance considerations (logged in BUILD_LOG):
 *   - Banker-authored Insight content leaves the local environment
 *     when this function fires. The API call carries the Track name,
 *     Signal tag, and 200-char content; no Member identifier.
 *   - Pilot's compliance review should verify acceptable-use posture
 *     for outbound LLM calls in a Credit Union production environment.
 */

import Anthropic from "@anthropic-ai/sdk";

export type CandidatePattern = {
  id: string;
  content: string;
  insight_type: string;
};

export type MatchInput = {
  banker_content: string;
  track_name: string;
  addresses_signal_summary: string | null; // e.g. "Blocker · cashflow_volatility"
  candidates: CandidatePattern[];
};

export type MatchResult = {
  matched_pattern_id: string | null;
  match_confidence: number;
  llm_feedback: string;
  state: "routine" | "novel";
  // Indicates the result came from graceful-fallback path (timeout /
  // API error / unset API key). Surface to BUILD_LOG analytics for
  // Pilot debugging. Not persisted on the Insight row directly; the
  // caller may include this in audit logging.
  fallback: boolean;
};

const MODEL_ID = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 5000;
const MAX_FEEDBACK_CHARS = 220; // 200 target + small slack
const ROUTINE_CONFIDENCE_THRESHOLD = 0.7;

const FALLBACK_FEEDBACK =
  "Saved as novel for senior-lender review. The matching service is unavailable right now; your observation is preserved verbatim.";

const SYSTEM_PROMPT = `You are an expert in commercial lending consultative practice. Given a banker's authored insight about a Member, identify the closest matching canonical pattern from a curated library, and produce affirming-or-extending feedback.

Respond with strict JSON in this shape:
{
  "matched_pattern_id": "PATTERN-NNN" | null,
  "confidence": 0.0-1.0,
  "feedback": "200-char message"
}

Confidence guidance:
- High (≥0.7): banker's insight closely matches a canonical pattern. Affirm with reference. Format example: "Excellent observation! [reference to canonical pattern]"
- Medium (0.4-0.7): banker is catching something the canonical library partially covers. Extend with an implication question.
- Low (<0.4): novel angle, no clean match. Set matched_pattern_id to null. Acknowledge the distinct framing without forced reference.

Discipline (non-negotiable):
- Output strictly bounded to ~200 chars. Hard cap at 220.
- No marketing-flavored language. Banker tone.
- No banned phrases: "Recommended for", "Eligible for", "Pre-qualified", "Approved", "Approval-track".
- Frame as "supports" / "advances" / "develops" — not endorsement language.
- No JSON outside the response object. No code fences. No prefatory text.`;

function buildUserPrompt(input: MatchInput): string {
  const candidatesBlock = input.candidates
    .map((c, i) => `${i + 1}. ${c.id} (${c.insight_type}) — "${c.content}"`)
    .join("\n");
  return [
    `Banker's insight: "${input.banker_content}"`,
    `Track: ${input.track_name}`,
    input.addresses_signal_summary
      ? `Addresses: ${input.addresses_signal_summary}`
      : "Addresses: (Track-level, no specific Signal)",
    "",
    "Candidate patterns:",
    candidatesBlock || "(no candidates filtered for this track + signal scope)",
    "",
    "Identify the closest matching pattern (or null) and produce the JSON response per system instructions.",
  ].join("\n");
}

/**
 * Match a banker-authored Insight against the candidate Pattern set.
 * Returns a MatchResult with cached fields ready to persist on the
 * Insight row.
 *
 * Graceful fallback paths:
 *   - ANTHROPIC_API_KEY unset → returns fallback novel-state result
 *   - API call exceeds 5s → returns fallback novel-state result
 *   - API call errors (network / 4xx / 5xx) → returns fallback novel-state result
 *   - API response unparseable → returns fallback novel-state result
 *
 * Successful API path:
 *   - Parses { matched_pattern_id, confidence, feedback } from response
 *   - Applies ROUTINE_CONFIDENCE_THRESHOLD (0.7) to derive state
 *   - Truncates feedback to MAX_FEEDBACK_CHARS if over
 */
export async function matchInsight(input: MatchInput): Promise<MatchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      matched_pattern_id: null,
      match_confidence: 0,
      llm_feedback: FALLBACK_FEEDBACK,
      state: "novel",
      fallback: true,
    };
  }

  const client = new Anthropic({ apiKey });

  try {
    const result = await Promise.race([
      client.messages.create({
        model: MODEL_ID,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(input) }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("matchInsight timeout (5s)")),
          TIMEOUT_MS,
        ),
      ),
    ]);

    const text = result.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    const parsed = parseMatchResponse(text);
    if (!parsed) {
      return {
        matched_pattern_id: null,
        match_confidence: 0,
        llm_feedback: FALLBACK_FEEDBACK,
        state: "novel",
        fallback: true,
      };
    }

    const matched_pattern_id =
      parsed.matched_pattern_id &&
      input.candidates.some((c) => c.id === parsed.matched_pattern_id)
        ? parsed.matched_pattern_id
        : null;
    const match_confidence = clamp(parsed.confidence, 0, 1);
    const state =
      matched_pattern_id && match_confidence >= ROUTINE_CONFIDENCE_THRESHOLD
        ? "routine"
        : "novel";
    const llm_feedback = (parsed.feedback ?? FALLBACK_FEEDBACK).slice(
      0,
      MAX_FEEDBACK_CHARS,
    );
    return {
      matched_pattern_id: state === "routine" ? matched_pattern_id : null,
      match_confidence,
      llm_feedback,
      state,
      fallback: false,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      "[insight-matching] graceful fallback:",
      e instanceof Error ? e.message : e,
    );
    return {
      matched_pattern_id: null,
      match_confidence: 0,
      llm_feedback: FALLBACK_FEEDBACK,
      state: "novel",
      fallback: true,
    };
  }
}

type ParsedResponse = {
  matched_pattern_id: string | null;
  confidence: number;
  feedback: string;
};

function parseMatchResponse(text: string): ParsedResponse | null {
  // Find a JSON object in the response. The system prompt asks for
  // strict JSON with no fences, but we tolerate ```json fences if the
  // model adds them and any leading whitespace.
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  const slice = text.slice(jsonStart, jsonEnd + 1);
  try {
    const obj = JSON.parse(slice) as Record<string, unknown>;
    const matched =
      typeof obj.matched_pattern_id === "string" ? obj.matched_pattern_id : null;
    const confidence =
      typeof obj.confidence === "number"
        ? obj.confidence
        : typeof obj.confidence === "string"
        ? Number(obj.confidence)
        : 0;
    const feedback = typeof obj.feedback === "string" ? obj.feedback : "";
    if (Number.isNaN(confidence) || feedback === "") return null;
    return {
      matched_pattern_id: matched,
      confidence,
      feedback,
    };
  } catch {
    return null;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
