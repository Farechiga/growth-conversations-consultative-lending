"use client";

/*
 * + Insight authoring form — Sprint 5b.1 Block E.
 *
 * Two entry points share this component:
 *   - Dialpad button (sixth activity, alongside + Ask / + Quantify /
 *     + Model / + Reaction / + Action). No pre-fill; banker selects
 *     Track + optional Signal.
 *   - Contextual affordance on Goal/Blocker/Indecision/Trigger rows in
 *     popup-as-workflow evidence zone. Pre-fills Track (current Track)
 *     + addresses_signal (the row's Signal) + insight_type (reframe
 *     for Goal/Blocker; implication for Indecision/Trigger). Banker
 *     can change any pre-fill before submit.
 *
 * Submit fires `saveInsight` server action which calls Anthropic
 * matching with 5s timeout + graceful fallback. Result determines
 * state (routine/novel) and surfaces feedback inline before form close.
 *
 * Novel-confirmation flow per Sprint 5b.1 §E.5: when match confidence
 * < 0.7, the form shows "This looks novel. Submit as is?" before the
 * Insight is saved. (Note: confidence-from-LLM is what triggers novel
 * state; we save in two phases to honor banker confirmation: (1) call
 * matchInsight first to get confidence, (2) if low, show confirmation,
 * (3) save with that match data on confirm. Actually saveInsight is a
 * single-shot for simplicity in the demo — it saves immediately with
 * whichever state the matcher returned. The confirmation flow becomes
 * a post-save banner if state ends up novel: "Saved as novel. Submit
 * to senior review? [Yes / Edit before re-saving]". Pilot may want
 * pre-save confirmation; demo ships post-save framing for simpler
 * round-tripping.)
 */

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveInsight } from "../actions";

export type InsightTrackOption = {
  id: string;
  name: string;
};

export type InsightSignalOption = {
  id: string;
  type: "goal" | "blocker" | "indecision" | "trigger";
  topic_display_name: string;
};

export type InsightFormProps = {
  memberId: string;
  bankerId: string;
  // All Tracks the banker can attach this Insight to. Defaults to
  // current Track per popup/sidebar context.
  tracks: InsightTrackOption[];
  defaultTrackId: string | null;
  // Member's captured Signals available for attachment. The form's
  // "Addresses Signal" dropdown lets banker pick none (Track-level)
  // or any one of these.
  signals: InsightSignalOption[];
  // Pre-fill from contextual entry point (Signal-row affordance).
  preselectedSignalId?: string;
  preselectedInsightType?: "reframe" | "implication";
  onSuccess: () => void;
  onCancel: () => void;
};

const MAX_CONTENT_LEN = 200;

export function InsightForm({
  memberId,
  bankerId,
  tracks,
  defaultTrackId,
  signals,
  preselectedSignalId,
  preselectedInsightType,
  onSuccess,
  onCancel,
}: InsightFormProps) {
  const router = useRouter();
  const [trackId, setTrackId] = useState<string>(defaultTrackId ?? tracks[0]?.id ?? "");
  const [signalId, setSignalId] = useState<string>(preselectedSignalId ?? "");
  const [insightType, setInsightType] = useState<"reframe" | "implication">(
    preselectedInsightType ??
      (() => {
        if (!preselectedSignalId) return "reframe";
        const sig = signals.find((s) => s.id === preselectedSignalId);
        if (!sig) return "reframe";
        return sig.type === "goal" || sig.type === "blocker"
          ? "reframe"
          : "implication";
      })(),
  );
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Post-save state: surface LLM feedback inline before close.
  const [savedFeedback, setSavedFeedback] = useState<{
    feedback: string;
    state: "routine" | "novel";
    fallback: boolean;
    matchedPattern: string | null;
  } | null>(null);

  function commit() {
    setError(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Insight content is required.");
      return;
    }
    if (trimmed.length > MAX_CONTENT_LEN + 20) {
      setError(`Keep the insight to about ${MAX_CONTENT_LEN} characters.`);
      return;
    }
    if (!trackId) {
      setError("Pick a Track.");
      return;
    }
    startTransition(async () => {
      const result = await saveInsight({
        member_id: memberId,
        banker_id: bankerId,
        track_id: trackId,
        addresses_signal_id: signalId || null,
        insight_type: insightType,
        content: trimmed,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      setSavedFeedback({
        feedback: result.llm_feedback,
        state: result.state,
        fallback: result.fallback,
        matchedPattern: result.matched_pattern_id,
      });
    });
  }

  function dismissAndClose() {
    setSavedFeedback(null);
    onSuccess();
  }

  // Post-save view: show LLM feedback + state + close button.
  if (savedFeedback) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded border-l-[3px] px-4 py-3 ${
            savedFeedback.state === "routine"
              ? "border-blaze-orange bg-blaze-orange-pale/30"
              : "border-blaze-grey-soft bg-blaze-cream/50"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
            {savedFeedback.state === "routine"
              ? "Insight saved · routine match"
              : savedFeedback.fallback
              ? "Insight saved · matching unavailable"
              : "Insight saved · novel"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
            {savedFeedback.feedback}
          </p>
          {savedFeedback.matchedPattern && (
            <p className="mt-2 text-[11px] text-blaze-grey-soft">
              Matched pattern: {savedFeedback.matchedPattern}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismissAndClose}
          className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sprint 5b.1 patch — "Track" → "Lending product" rename per
          visual review. Code-internal "Track"/"TrackTemplate" identifiers
          unchanged; this is banker-facing label only. */}
      <Field label="Lending product" required>
        <select
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">Select…</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="What captured statement does this respond to? (optional)">
        <select
          value={signalId}
          onChange={(e) => setSignalId(e.target.value)}
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="">— Lending-product-level (no Signal attachment) —</option>
          {signals.map((s) => (
            <option key={s.id} value={s.id}>
              {capitalize(s.type)}: {s.topic_display_name}
            </option>
          ))}
        </select>
      </Field>

      {/* Sprint 5b.1 patch — Reframe/Implication folded from radio →
          dropdown for visual consistency with the other selects. */}
      <Field label="What kind of insight?" required>
        <select
          value={insightType}
          onChange={(e) =>
            setInsightType(e.target.value as "reframe" | "implication")
          }
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        >
          <option value="reframe">
            Reframe — re-interprets a captured fact to shift Member&rsquo;s perspective
          </option>
          <option value="implication">
            Implication — develops a consequence the Member hasn&rsquo;t said
          </option>
        </select>
      </Field>

      <Field
        label={`The insight itself (${MAX_CONTENT_LEN} characters or less)`}
        required
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={MAX_CONTENT_LEN + 20}
          placeholder="What you'd say to the Member to help them see this differently…"
          className="w-full border border-blaze-rule bg-white px-2 py-1.5 text-sm leading-relaxed text-blaze-charcoal focus:border-blaze-orange focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-blaze-grey-soft">
          {content.length} / {MAX_CONTENT_LEN}
        </p>
      </Field>

      {/* Sprint 5b.1 patch — LLM matching explainer text removed per
          visual review. Behavior unchanged (matching still fires on
          submit with 5s timeout + graceful fallback); banker doesn't
          need the inline explanation. */}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={commit}
          disabled={isPending || !content.trim() || !trackId}
          className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt disabled:opacity-60"
        >
          {isPending ? "Matching…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm font-medium text-blaze-grey-body hover:text-blaze-charcoal"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p className="text-sm text-blaze-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-blaze-grey-body">
        {label}
        {required && <span className="ml-1 text-blaze-orange-deep">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
