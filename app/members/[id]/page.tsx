/*
 * Day-2 — Member profile, live data + borderless typography-led pattern.
 *
 * Server Component that fetches Jenny's record from Prisma with deep includes
 * and renders the six-band layout per Module and Data Flow §4.2 plus the
 * banker-only sidebar (§4.3) and the above-the-fold pinned suggested-next-step
 * panel (§4.4).
 *
 * Visual identity (BLAZE_STYLE_GUIDE.md §4.5 — "Borderless typography-led
 * pattern"):
 *   - Page background: blaze-cream (warm parchment). No card chrome.
 *   - Each section opens with an orange rectangle mark (8×16px) followed by
 *     uppercase tracked label text in charcoal — the section anchor.
 *   - Section titles in true black at 18px / 600. Body in blaze-charcoal
 *     (#1A1A1A). Secondary prose in blaze-grey-body. Three levels of dark
 *     give typographic hierarchy without colored panels.
 *   - Captured-value chips: cool-grey fill (--blaze-data-cool) with 1.5px
 *     blaze-orange outline, square edges, monospace, charcoal text. The
 *     temperature shift signals "structured field" against the warm ground.
 *   - Verbatim member quotes: 3px blaze-orange vertical line + italic
 *     blaze-grey-body text. Voice, not statement.
 *   - Section dividers: 1px blaze-rule (#E8EAEC) centered in ~56px gaps.
 *   - The three pieces of orange semantic work: section marks, quote
 *     attribution lines, hyperlinks/verb-prefix labels.
 *
 * The pinned "Suggested next step" panel is the deliberate exception — it
 * keeps the orange-pale card treatment per §4 so the primary CTA stays
 * primary. Everything else is borderless.
 *
 * Substantive treatments retained from prior steps:
 *   - Trace pattern via <details>/<summary>.
 *   - Recommendation.responds_to_signals sorted goal → blocker → trigger →
 *     indecision with verb-prefix labels (in blaze-orange-deep inline).
 *   - Active state summary tokens are anchor links to the relevant bands.
 *   - Live fireRules() result populates the pinned panel.
 *
 * Live fetch is parameterless — Jenny is keyed by legal name. The /members/[id]
 * dynamic generalization for Northland and Cygnus surfaces lands in a follow-up
 * once this profile is reviewed feature-complete.
 */

import "dotenv/config";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
// Note: summarizeMember and MemberSummaryInput are no longer imported here
// because the Active state band that consumed them was deleted per
// Sprint 1 §C.1. The snapshot generation in prisma/seed.ts still uses
// summarizeMember; the audit trail is intact via MemberSummarySnapshot rows.
import { computeTopPriorities, shortTrackName, type Priority } from "@/lib/priorities";
import {
  computeSuggestedNextStep,
  computeTrackProgress,
} from "@/lib/suggested-next-step";
import { formatRecommendationSize } from "@/lib/format-size";
import { Breadcrumb } from "@/app/_components/breadcrumb";
import { V2OptInLink } from "@/app/_components/v2-opt-in-link";
import {
  ArtifactPreviewDialog,
  type ArtifactPreviewData,
} from "./artifact-preview-dialog";
import { TrackProgressDots } from "./track-progress-dots";
import {
  MacroContextBanner,
  type MacroBannerData,
} from "./macro-context-banner";
import { Fragment, type ReactNode } from "react";

// ============================================================
// Prisma client — short-lived per request. Server Components run on the server,
// so this is fine for the demo. (Production would extract to a singleton.)
// ============================================================

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

const NOW = new Date("2026-04-25T12:00:00Z");

// ============================================================
// Helpers
// ============================================================

function dollars(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

const SEVERITY_DOT: Record<string, string> = {
  manageable: "bg-blaze-grey-soft",
  painful: "bg-blaze-warning",
  threatening: "bg-blaze-danger",
};

// Sprint 4 §4.1d Block C — friendly display labels for the TimeHorizon
// enum. The enum values are identifier-safe; the labels here are what
// bankers see in the UI ("3-6 months" not "three_to_six_months").
const TIME_HORIZON_LABEL: Record<string, string> = {
  imminent: "imminent",
  three_to_six_months: "3-6 months",
  six_to_twelve_months: "6-12 months",
  twelve_to_twenty_four_months: "12-24 months",
  longer: "longer",
};

// RECENCY_LABEL was the prose gloss line ("recent · within the last month")
// that sat below the chip strip. Removed in Sprint 1 review fix #1 — the
// labeled-value pattern (Timeframe: recent / Time horizon: recent) makes
// the field meaning self-evident and the prose gloss became redundant.

const SIGNAL_TYPE_LABELS = {
  goal: "Goals",
  blocker: "Blockers",
  trigger: "Triggers",
  indecision: "Indecisions",
} as const;

// Verb-prefix labels per Signal type, used in the Recommendation responds-to
// list. Goal first reflects that recommendations exist to *serve* goals;
// blockers and triggers are the conditions that bring the goal into focus;
// indecisions are the member's hesitation about committing to the
// recommendation that addresses them. Order: goal → blocker → trigger →
// indecision.
const SIGNAL_TYPE_VERBS: Record<"goal" | "blocker" | "trigger" | "indecision", string> = {
  goal: "serves goal",
  blocker: "addresses blocker",
  trigger: "responds to trigger",
  indecision: "responds to indecision",
};
const SIGNAL_TYPE_ORDER: Record<"goal" | "blocker" | "trigger" | "indecision", number> = {
  goal: 0,
  blocker: 1,
  trigger: 2,
  indecision: 3,
};

// ============================================================
// Captured-value chip — borderless pattern per BLAZE_STYLE_GUIDE §4.5.
// Cool-grey fill + 1.5px blaze-orange outline + square edges + monospace
// + charcoal text. The temperature shift (cool grey on warm cream ground)
// signals "structured field" without competing with content.
// title attribute provides hover-tooltip citing the capture event.
// ============================================================

function CapturedChip({
  children,
  capturedBy,
}: {
  children: ReactNode;
  capturedBy: string;
}) {
  return (
    <span
      className="inline-flex items-baseline border-[1.5px] border-blaze-orange bg-blaze-data-cool px-1 py-0.5 font-mono text-[0.78em] text-blaze-charcoal align-baseline"
      title={`Captured · ${capturedBy}`}
    >
      {children}
    </span>
  );
}

// ============================================================
// InlineWithProvenance — Sprint 1 §D.3. Used for free numeric / non-enum
// captured values. Renders inline-bold (no chip — chips are reserved for
// enum values per §D.1) plus a custom hover tooltip showing the capture
// provenance. Native `title=` would also work but produces an unstyled
// browser tooltip; this version matches the spec (white bg, light cool
// border, charcoal text, max 280px wide, subtle shadow).
// ============================================================

function InlineWithProvenance({
  children,
  capturedBy,
}: {
  children: ReactNode;
  capturedBy: string;
}) {
  return (
    <span className="group/prov relative inline">
      <strong className="font-semibold text-blaze-charcoal">{children}</strong>
      <span
        role="tooltip"
        className="invisible absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[280px] -translate-x-1/2 whitespace-normal border border-blaze-rule bg-white px-3 py-2 text-xs leading-snug text-blaze-charcoal opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-opacity duration-150 group-hover/prov:visible group-hover/prov:opacity-100"
      >
        {capturedBy}
      </span>
    </span>
  );
}

// ============================================================
// LabeledValue — Sprint 1 review fix #1 (labeled-value pattern). Renders a
// captured Signal/Recommendation field as `[label]: [value]` instead of a
// bare chip, so the field name is visible alongside the value (Impact: painful
// reads as a sentence; `painful` alone reads as floating jargon). Discipline
// per BLAZE_STYLE_GUIDE §4.6:
//
//   - Chips: enumerated member-state values where the value is the salient
//     signal (e.g., leaning yes, spouse — Open opportunities).
//   - Labeled values: descriptive captured fields where field name + value
//     together convey meaning (e.g., Impact: painful, Timeframe: recent —
//     Active signals).
//   - Inline-bold with hover provenance: numeric measurements ($12K/quarterly).
//
// `children` is the value content (string for enum values, or an
// <InlineWithProvenance> element for numeric measurements). Native title=
// attribute provides a lightweight hover tooltip for the enum case; the
// styled custom tooltip from InlineWithProvenance handles the numeric case.
// ============================================================

function LabeledValue({
  label,
  children,
  capturedBy,
}: {
  label: string;
  children: ReactNode;
  capturedBy?: string;
}) {
  // Sprint 1 review fix #3: explicit 6px gap between label colon and value.
  // The previous `gap-1` (4px) plus a regular text space rendered as a
  // continuous string at small sizes; bumping to gap-1.5 (6px) and dropping
  // the regular space gives the eye a clear field-value boundary. The
  // surrounding pipe separator carries 14px on each side via the parent
  // container's `gap-x-3.5` (14px) so the labeled-value pairs read as
  // distinct visual groupings, not a run-together string.
  return (
    <span className="inline-flex items-baseline gap-1.5 align-baseline">
      <span className="text-blaze-grey-body">{label}:</span>
      {capturedBy ? (
        <strong
          className="font-medium text-blaze-charcoal"
          title={`Captured · ${capturedBy}`}
        >
          {children}
        </strong>
      ) : (
        children
      )}
    </span>
  );
}

// ============================================================
// VerbPrefixLine — Sprint 1 §E. Renders an inline relationship using the
// canonical verb pattern from lib/verb-patterns.ts:
//
//   → [verb]: [linked entity name]
//
// Verb in blaze-orange-deep (the third piece of orange semantic work per
// §4.5); linked entity in charcoal underline-on-hover, scrolls to the
// anchor on click. If no anchor is provided, the entity name renders as
// plain charcoal text (used for non-navigable relationships like the
// Member-relationship "introduction" anchor).
// ============================================================

function VerbPrefixLine({
  verb,
  entityName,
  anchorId,
}: {
  verb: string;
  entityName: string;
  anchorId?: string;
}) {
  return (
    <p className="mt-1 text-xs leading-relaxed text-blaze-grey-body">
      <span className="font-medium text-blaze-orange-deep">→ {verb}:</span>{" "}
      {anchorId ? (
        <a
          href={`#${anchorId}`}
          className="text-blaze-charcoal underline-offset-2 hover:underline"
        >
          {entityName}
        </a>
      ) : (
        <span className="text-blaze-charcoal">{entityName}</span>
      )}
    </p>
  );
}

// ============================================================
// SectionLabel — the section-anchor primitive from §4.5. Orange rectangle
// mark followed by uppercase tracked label text in charcoal. Optional
// descriptive meta in grey-body to the right.
//
// `size` switches between default (8×16) and compact (6×12) for sidebar
// mini-bands and modal sub-sections. `as` lets the surrounding element
// match the band's heading semantics (h2 by default; h3 inside nested
// sub-sections).
// ============================================================

function SectionLabel({
  label,
  meta,
  size = "default",
}: {
  label: string;
  meta?: ReactNode;
  size?: "default" | "compact";
}) {
  // Dimensions per BLAZE_STYLE_GUIDE §2.7. Title-case treatment per §4.5 —
  // the orange rectangle is doing enough visual work that we don't need
  // typographic shouting alongside it.
  const markCls =
    size === "compact" ? "h-4 w-[18px] mr-2" : "h-6 w-[27px] mr-3";
  const labelCls =
    size === "compact"
      ? "text-[19px] font-semibold tracking-[0.02em] text-blaze-charcoal leading-none"
      : "text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none";
  return (
    <div className="flex items-baseline">
      <span aria-hidden className={`inline-block bg-blaze-orange ${markCls}`} />
      <span className={labelCls}>{label}</span>
      {meta && (
        <span className="ml-3 text-sm font-medium text-blaze-grey-body">
          {meta}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Rule — 1px horizontal divider in blaze-rule (cool grey #E8EAEC), centered
// in ~96px of vertical space (my-12 = 48px above + 48px below). The cool
// grey should disappear into the page until the eye is looking for it.
// ============================================================

function Rule() {
  // Sprint 1 review fix #2: 56px each side (my-14) + 1px line ≈ 113px total
  // gap, with the rule itself at the lightened --blaze-rule value (#E8EAEC).
  // The earlier 40px-each-side spec was visually missing at the
  // Active-signals → History transition; bumping to 56px and using the
  // lighter rule color produces a consistent visible separator at every
  // band-to-band boundary.
  return <hr className="my-14 border-0 border-t border-blaze-rule" aria-hidden />;
}

// ============================================================
// Page
// ============================================================

// Sprint 3 §B — generalized from the Jenny-only page to a dynamic route
// at /members/[id] where [id] is the Member.slug. The page loads the
// Member by slug; unknown slugs return Next 16's 404 page.
//
// In Next 16, dynamic-segment params are async (Promise<Params>); the
// page awaits them before reading the slug. This is a breaking change
// from Next 15.
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const prisma = getPrisma();

  const member = await prisma.member.findUnique({
    where: { slug },
    include: {
      primary_banker: true,
      industry_family: true,
      member_type: { include: { default_growth_tracks: true } },
      signals: {
        where: { active: true },
        include: {
          topic: true,
          conversation: { select: { id: true, created_at: true, meeting_type: true } },
          growth_step_execution: {
            include: { growth_step: { select: { title: true, step_shape: true } } },
          },
        },
        orderBy: { captured_at: "desc" },
      },
      action_cards: {
        where: { status: { in: ["open", "in_progress"] } },
        include: {
          owner: true,
          origin_conversation: { select: { id: true, created_at: true, meeting_type: true } },
          origin_growth_step_execution: {
            include: { growth_step: { select: { title: true, step_shape: true } } },
          },
        },
        orderBy: { due_at: "asc" },
      },
      recommendations: {
        include: {
          product: true,
          rule_that_fired: { select: { name: true } },
          // Sprint 2 Prompt 2 §C — opportunity ownership renders prominently
          // top-right of the merged card; for Cygnus's CRE, this surfaces
          // Marcus Webb (specialist) distinct from Scott (relationship banker).
          owned_by: { select: { id: true, display_name: true } },
          responds_to_signals: { include: { topic: true } },
          growth_step_execution: {
            include: {
              growth_step: { include: { artifact: true } },
              conversation: { select: { id: true, created_at: true, meeting_type: true } },
            },
          },
        },
        orderBy: { updated_at: "desc" },
      },
      conversations: {
        orderBy: { created_at: "desc" },
        include: {
          banker: { select: { display_name: true } },
          growth_step_executions: {
            include: {
              growth_step: { include: { artifact: true } },
              // Sprint 1 §E.3 — Artifact share verb line links to the
              // Recommendation produced in the same execution sequence.
              produced_recommendation: { include: { product: true } },
            },
            orderBy: { sequence_position: "asc" },
          },
          // Sprint 1 §E.4 — History conversation verb line uses captured
          // goal Signals to render "→ captured: Goal — [topic]".
          signals: { include: { topic: true } },
        },
      },
    },
  });

  if (!member) {
    // Sprint 3 §B.3 — clean 404 for unknown slugs. The demo's only valid
    // slugs are jenny, northland, cygnus; any other path renders Next's
    // not-found UI rather than throwing.
    await prisma.$disconnect();
    notFound();
  }

  // Sprint 1 §B — top priorities for the "what's hot" sidebar.
  const priorities = await computeTopPriorities(prisma, member.id, NOW);

  // Sprint 2 §B — context-aware Suggested Next Step. Returns either an
  // `advance_opportunity` shape (when the Member has an active engaged
  // Recommendation) or a `run_track` shape (rule-engine output, the
  // Sprint 1 default behavior). The function handles its own data
  // fetches, including the rule engine call for the run_track branch.
  const nextStep = await computeSuggestedNextStep(prisma, member.id, NOW);

  // Sprint 2 §C — Track progress dots. The dots render on both
  // Suggested-Next-Step modes; the Track id comes from the engaged
  // Recommendation (advance_opportunity) or the rule-engine output
  // (run_track). For the rare null-nextStep case, no dots render.
  const trackIdForDots =
    nextStep?.kind === "advance_opportunity"
      ? nextStep.recommendation.track_id
      : nextStep?.kind === "run_track"
      ? nextStep.track.id
      : null;
  const trackStages = trackIdForDots
    ? await computeTrackProgress(prisma, member.id, trackIdForDots)
    : null;

  // Sprint 4 §4.1d Block A — find the matching Macro for this Member,
  // if any. A Macro `affects` a Member when (a) the Macro's
  // affected_member_types Json array includes this Member's
  // member_type_id, AND (b) the Macro's effective period covers NOW
  // (effective_period_start <= NOW; effective_period_end null or >= NOW).
  // The Json array can't be filtered cleanly in Prisma + SQLite, so we
  // fetch effective Macros and filter in-memory. Per §A.3, when
  // multiple match, the most recently authored wins.
  const effectiveMacros = await prisma.macro.findMany({
    where: {
      effective_period_start: { lte: NOW },
      OR: [
        { effective_period_end: null },
        { effective_period_end: { gte: NOW } },
      ],
    },
    orderBy: { authored_at: "desc" },
  });
  const matchingMacro = effectiveMacros.find((m) => {
    const memberTypes = (m.affected_member_types as string[]) ?? [];
    return memberTypes.includes(member.member_type_id);
  });
  const macroBanner: MacroBannerData | null = matchingMacro
    ? {
        id: matchingMacro.id,
        title: matchingMacro.title,
        authored_label:
          matchingMacro.authored_by_external_label ??
          "Internal author", // Sprint 4 §4.1a: demo Macros use external_label.
        authored_at_iso: matchingMacro.authored_at.toISOString(),
        summary: matchingMacro.summary,
        recommended_response: matchingMacro.recommended_response,
      }
    : null;

  await prisma.$disconnect();

  // Sprint 1 §E — opportunity-name helper used by every verb-prefix line that
  // references a Recommendation. Single source of truth so the spelling
  // ("Working Capital LOC at $75K") is identical across ActionCards, Artifact
  // share records, and History entries — the verb registry's "verbs reuse
  // identically across surfaces" discipline carries to the entity names too.
  // Sprint 4 §A.4 — opportunityName now reads size from the structured
  // size_low / size_high fields via formatRecommendationSize, falling back
  // to size_proposed for back-compat. Renders "$75K" when low === high
  // (Jenny, Northland) and "$4M-$7M" when low < high (Cygnus's CRE).
  const opportunityName = (
    r: {
      product: { name: string };
      size_proposed: number | null;
      size_low: number | null;
      size_high: number | null;
    },
  ): string => {
    const sized = formatRecommendationSize(r);
    return sized ? `${r.product.name} at ${sized}` : r.product.name;
  };

  // Sprint 1 §E.2 / §E.4 — map from conversation_id → the Recommendation
  // produced in that conversation. ActionCards link to this via their
  // origin_conversation_id; History conversations use it to render the
  // "→ produced:" verb line. Built once, consulted at render time.
  const recommendationByConversationId = new Map<
    string,
    (typeof member.recommendations)[number]
  >();
  for (const r of member.recommendations) {
    recommendationByConversationId.set(r.growth_step_execution.conversation.id, r);
  }

  // Sprint 2 Prompt 2 §E — map from recommendation_id → linked ActionCard.
  // Each opportunity card in the merged Open opportunities band folds in
  // the ActionCard's due-date / overdue-status (top-right corner) and
  // suggested_opening (member-facing copy block) when an ActionCard exists
  // for that opportunity. Linkage rule matches the dedup logic in
  // lib/priorities.ts: same origin_conversation as the Recommendation.
  type LinkedCard = (typeof member.action_cards)[number];
  const actionCardByRecommendationId = new Map<string, LinkedCard>();
  for (const c of member.action_cards) {
    const linkedRec = recommendationByConversationId.get(c.origin_conversation.id);
    if (linkedRec) actionCardByRecommendationId.set(linkedRec.id, c);
  }

  // Group signals by type for Band 3 (do not inherit the summary's blocker-only
  // compression — render all four types).
  const signalsByType: Record<string, typeof member.signals> = {
    goal: [],
    blocker: [],
    trigger: [],
    indecision: [],
  };
  for (const s of member.signals) {
    signalsByType[s.type].push(s);
  }

  // Active state band was deleted per Sprint 1 §C.1 — `summarizeMember` and
  // `MemberSummaryInput` no longer get called here. Snapshot generation
  // continues unchanged in prisma/seed.ts.

  // Derive Artifact share records from Show-shape executions whose captured_data
  // includes shared_afterward = true. The brief's preferred storage shape is a
  // dedicated ArtifactShareRecord row; for the demo we read from captured_data
  // jsonb on the execution to avoid a second persistence path.
  // member_reaction removed per Sprint 1 review fix #4 (schema collapse).
  // The truest signal of how the member responded to a shared Artifact now
  // lives canonically on Recommendation.response, captured at the closing
  // Resolve step. The supports-opportunity verb-prefix line surfaces that
  // linkage; the row itself records only that the share happened.
  type ArtifactShareRow = {
    artifact_title: string;
    artifact_description: string;
    artifact_type: "chart" | "comparison" | "calculator";
    artifact_template: string;
    parameters_used: Record<string, unknown>;
    shared_afterward: boolean;
    conversation_id: string;
    conversation_date_iso: string;
    // Sprint 1 §E.3 — Recommendation supported by this share, if any.
    // The Show-shape execution that rendered the Artifact also produced
    // the Recommendation in Jenny's case; we surface that linkage as a
    // verb-prefix line "→ supports opportunity: [name]".
    supports_recommendation_id: string | null;
    supports_recommendation_name: string | null;
  };
  const artifactShareRows: ArtifactShareRow[] = [];
  for (const c of member.conversations) {
    for (const e of c.growth_step_executions) {
      // Sprint 4 §4.1c — growth_step is nullable for track-agnostic
      // executions (Ask / Size); only Show-shape executions belong here.
      if (!e.growth_step || e.growth_step.step_shape !== "show") continue;
      const captured = e.captured_data as {
        shared_afterward?: boolean;
        parameters_used?: Record<string, unknown>;
      };
      const artifact = e.growth_step.artifact;
      if (!artifact) continue;
      const supportsRec = e.produced_recommendation;
      artifactShareRows.push({
        artifact_title: artifact.title,
        artifact_description: artifact.description,
        artifact_type: artifact.type,
        artifact_template: artifact.template,
        parameters_used: captured.parameters_used ?? {},
        shared_afterward: captured.shared_afterward ?? false,
        conversation_id: c.id,
        conversation_date_iso: c.created_at.toISOString(),
        supports_recommendation_id: supportsRec?.id ?? null,
        supports_recommendation_name: supportsRec
          ? opportunityName({
              product: supportsRec.product,
              size_proposed: supportsRec.size_proposed,
              size_low: supportsRec.size_low,
              size_high: supportsRec.size_high,
            })
          : null,
      });
    }
  }

  // (Dead code from the deleted Active state band cleaned up — the three
  // navigational tokens now render directly inline at the bottom of the
  // Member identity band, see §C.1.)

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen w-full bg-blaze-paper">
      {/* §3 signature gradient band */}
      <div className="h-8 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />

      {/* App header — wordmark + banker identity. Borderless on cream. */}
      <header>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            <span className="text-blaze-orange-deep">Member</span>{" "}
            <span className="text-blaze-charcoal">Signals</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-blaze-charcoal">
            {/* Sprint 4.7 Q-X1 — opt-in cross-link to v2 workstation.
                Renders only when ?v2=true query param sets the
                sessionStorage flag. v1 stays default during build per
                Q-X1; Sprint 6 may flip default for EVP demo deployment. */}
            <V2OptInLink href={`/v2/members/${slug}`} />
            <Link
              href="/v2/insight-engine"
              className="text-xs font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
            >
              Dashboards ↗
            </Link>
            <div>
              Logged in as{" "}
              <span className="font-medium">{member.primary_banker.display_name}</span>
              <span className="ml-2 text-xs text-blaze-grey-body">Primary banker</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sprint 4 §4.1b C — breadcrumb above the page identity. The
          home segment links to /members/jenny (the demo's home Member
          profile until a portfolio home page exists post-demo). The
          current Member is the terminal segment, not clickable. */}
      <div className="mx-auto max-w-6xl px-8 pt-4">
        <Breadcrumb
          segments={[
            { label: "Member Signals", href: "/members/jenny" },
            { label: member.doing_business_as ?? member.legal_name, current: true },
          ]}
        />
      </div>

      {/* Sprint 4 §4.1d Block A — Macro context banner. Renders full-width
          (its own cream-tinted band) above the main content grid when the
          Member's Member Type matches a current Macro. Suppressed silently
          when no match (no empty placeholder). */}
      {macroBanner && <MacroContextBanner macro={macroBanner} />}

      {/* Main content + sidebar */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          {/* Pinned: Suggested next step (above the fold). Live result from
              fireRules(); hidden if no rule fires. THE deliberate exception
              to the borderless pattern — orange-pale card so the primary CTA
              reads as primary. Per BLAZE_STYLE_GUIDE §4. */}
          {nextStep && (
            <section
              id="band-suggested"
              className="relative rounded-md bg-white p-5"
            >
              {/* Top-right corner: confidence-band tag for run_track mode
                  (system's belief in the rule that fired); progress dots
                  for advance_opportunity mode. The two never coexist —
                  advance_opportunity is grounded in member data, not in
                  rule confidence, so the system-confidence framing isn't
                  meaningful there. Dots render in both modes via the
                  block below the heading; the corner tag is exclusive to
                  run_track. */}
              {nextStep.kind === "run_track" && (
                <span className="absolute right-0 top-[18px] bg-blaze-charcoal px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
                  {nextStep.rule.confidence_band} confidence
                </span>
              )}

              <h2 className="text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none">
                Suggested next step
              </h2>

              {nextStep.kind === "advance_opportunity" ? (
                <>
                  {/* advance_opportunity card — Member has an active engaged
                      Recommendation. Title frames the action against the
                      product/size; subtitle includes member_response. */}
                  <p className="mt-4 text-xl font-semibold text-blaze-orange-deep leading-tight">
                    Follow up on{" "}
                    {nextStep.recommendation.product_name}
                    {(() => {
                      const sized = formatRecommendationSize(nextStep.recommendation);
                      return sized ? <> at {sized}</> : null;
                    })()}
                  </p>
                  <p className="mt-1 text-xs text-blaze-grey-body">
                    Member is{" "}
                    <span className="font-medium text-blaze-charcoal">
                      {nextStep.recommendation.response.replace(/_/g, " ")}
                    </span>
                    {nextStep.recommendation.primary_concern &&
                      nextStep.recommendation.primary_concern !== "none" && (
                        <>
                          {" "}· primary concern:{" "}
                          <span className="font-medium text-blaze-charcoal">
                            {nextStep.recommendation.primary_concern.replace(
                              /_/g,
                              " ",
                            )}
                          </span>
                        </>
                      )}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-blaze-charcoal">
                    {nextStep.next_action_description}
                  </p>
                  {/* Sprint 2 Prompt 2 §D.1 — progress visualization moved
                      from upper-right of card to between body paragraph and
                      action buttons. 24px breathing room above and below
                      separates it visually from the prose and the CTAs. */}
                  {trackStages && (
                    <div className="my-6">
                      <TrackProgressDots stages={trackStages} memberSlug={slug} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/growth-conversations/${slug}`}
                      className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt"
                    >
                      Run follow-up
                    </Link>
                    <button className="rounded bg-transparent px-4 py-2 text-sm font-medium text-blaze-charcoal transition-colors hover:bg-blaze-cream">
                      Dismiss
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* run_track card — fallback when no active engaged
                      Recommendation exists. Same shape as the Sprint 1
                      rendering; progress dots all show upcoming (no Track
                      work has happened yet). */}
                  <p className="mt-4 text-xl font-semibold text-blaze-orange-deep leading-tight">
                    {shortTrackName(nextStep.track.name)}
                  </p>
                  {nextStep.track.banker_facing_purpose && (
                    <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
                      {nextStep.track.banker_facing_purpose}
                    </p>
                  )}
                  {trackStages && (
                    <div className="my-6">
                      <TrackProgressDots stages={trackStages} memberSlug={slug} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/growth-conversations/${slug}`}
                      className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt"
                    >
                      Run Growth track
                    </Link>
                    <button className="rounded bg-transparent px-4 py-2 text-sm font-medium text-blaze-charcoal transition-colors hover:bg-blaze-cream">
                      Dismiss
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          <Rule />

          {/* Band — Open opportunities (Sprint 2 Prompt 2 §E). Merged with
              Open work; ActionCard data folds in (suggested_opening, due
              date / overdue status). The standalone Open work band is
              removed — every ActionCard in the demo links to a specific
              Recommendation, so showing both was the same opportunity from
              two angles. The verb-prefix `→ de-risks opportunity:` was
              dropped per §E.4 — redundant signaling when the card itself
              IS the opportunity. */}
          <section id="band-proposals">
            <SectionLabel
              label="Open opportunities"
              meta="recommendations on the table"
            />
            <ul className="mt-5 space-y-6">
              {member.recommendations.map((r) => {
                const conv = r.growth_step_execution.conversation;
                const captureRef = `${conv.meeting_type.replace(
                  /_/g,
                  " ",
                )} on ${fmtDate(conv.created_at)} · Show step`;
                const linkedCard = actionCardByRecommendationId.get(r.id);
                const cardDays = linkedCard
                  ? daysBetween(linkedCard.due_at, NOW)
                  : null;
                const cardOverdue = cardDays !== null && cardDays < 0;
                return (
                  <li key={r.id} id={`rec-${r.id}`} className="py-2 scroll-mt-24">
                    {/* Sprint 3 §A — header reorganized: title on its own
                        line; ownership + optional due-date metadata on a
                        second line below; larger gap (24px+) before the
                        verb-prefix relationship lines begin. The original
                        single-line header read as cramped on review. */}
                    <p className="text-sm font-semibold text-blaze-charcoal">
                      {r.product.name}
                      {(() => {
                        // Sprint 4 §A.4 — render structured size_low/size_high
                        // via the shared formatRecommendationSize helper. Single
                        // value for size_low === size_high; range for size_low
                        // < size_high. The capturedBy provenance string
                        // captures whichever shape is being shown.
                        const sized = formatRecommendationSize(r);
                        if (!sized) {
                          return (
                            <span className="text-blaze-grey-body"> (unsized — see rationale)</span>
                          );
                        }
                        const provenanceLabel =
                          r.size_low !== null && r.size_high !== null && r.size_low !== r.size_high
                            ? `size range: ${sized}`
                            : `size: ${sized}`;
                        return (
                          <>
                            {" "}at{" "}
                            <InlineWithProvenance
                              capturedBy={`${provenanceLabel} · captured ${captureRef}`}
                            >
                              {sized}
                            </InlineWithProvenance>
                          </>
                        );
                      })()}
                      {r.structure !== "standard" && (
                        <>
                          {" "}
                          <CapturedChip capturedBy={`structure · ${captureRef}`}>
                            {r.structure.replace(/_/g, " ")}
                          </CapturedChip>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-blaze-grey-body">
                      {/* Ownership always renders. For Cygnus's CRE this
                          is Marcus Webb (specialist), distinct from the
                          relationship banker — the cross-banker handoff
                          demo. */}
                      owned by{" "}
                      <span className="font-medium text-blaze-charcoal">
                        {r.owned_by?.display_name ?? member.primary_banker.display_name}
                      </span>
                      {linkedCard && (
                        <>
                          {" · "}
                          <span
                            className={
                              cardOverdue
                                ? "font-medium text-blaze-danger"
                                : "text-blaze-grey-body"
                            }
                          >
                            Due{" "}
                            <InlineWithProvenance
                              capturedBy={`due_at · ${conv.meeting_type.replace(/_/g, " ")} · ${fmtDate(conv.created_at)}`}
                            >
                              {fmtDate(linkedCard.due_at)}
                            </InlineWithProvenance>
                            {cardOverdue && cardDays !== null && (
                              <> · {Math.abs(cardDays)}d overdue</>
                            )}
                          </span>
                        </>
                      )}
                    </p>

                    {r.responds_to_signals.length > 0 && (
                      <ul className="mt-6 space-y-0.5 text-xs text-blaze-grey-body">
                        {[...r.responds_to_signals]
                          .sort((a, b) => SIGNAL_TYPE_ORDER[a.type] - SIGNAL_TYPE_ORDER[b.type])
                          .map((s) => {
                            const magnitudeText =
                              s.magnitude !== null && s.unit
                                ? ` (${
                                    s.unit === "dollars"
                                      ? dollars(s.magnitude)
                                      : `${s.magnitude} ${s.unit.replace(/_/g, " ")}`
                                  }${s.frequency ? `/${s.frequency}` : ""})`
                                : "";
                            return (
                              <li key={s.id} className="leading-relaxed">
                                <span className="font-medium text-blaze-orange-deep">
                                  → {SIGNAL_TYPE_VERBS[s.type]}:
                                </span>{" "}
                                <a
                                  href={`#signal-${s.id}`}
                                  className="text-blaze-charcoal underline-offset-2 hover:underline"
                                >
                                  {s.topic.display_name}
                                </a>
                                {magnitudeText && (
                                  <span className="text-blaze-grey-body">{magnitudeText}</span>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                    )}

                    <p className="mt-2 text-xs text-blaze-grey-body">
                      Member is{" "}
                      <CapturedChip capturedBy={`response · ${captureRef}`}>
                        {r.response.replace(/_/g, " ")}
                      </CapturedChip>
                      {/* Sprint 4.6 Block A — `none` enum value retired
                          in favor of nullable `primary_concern`. The
                          legacy guard against the literal "none" is
                          replaced with a simple null check; the field
                          is suppressed when the Member has no captured
                          concern. */}
                      {r.primary_concern && (
                        <>
                          {" "}· primary concern:{" "}
                          <CapturedChip capturedBy={`primary_concern · ${captureRef}`}>
                            {r.primary_concern.replace(/_/g, " ")}
                          </CapturedChip>
                        </>
                      )}
                      .
                    </p>

                    {/* Progressive disclosure per Q-018: summary by default,
                        full rationale_text behind an expand. */}
                    <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
                      {r.rationale_summary ?? r.rationale_text}
                    </p>
                    {r.rationale_summary && (
                      <details className="group mt-2 text-xs">
                        <summary className="cursor-pointer font-medium text-blaze-orange-deep underline-offset-2 hover:underline list-none">
                          <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                            ›
                          </span>
                          View full rationale
                        </summary>
                        <p className="mt-2 ml-4 border-l border-blaze-rule pl-3 text-sm leading-relaxed text-blaze-charcoal">
                          {r.rationale_text}
                        </p>
                      </details>
                    )}

                    {/* Suggested opening folded in from the linked
                        ActionCard per Sprint 2 Prompt 2 §E.4. The text is
                        member-facing prose the banker can copy-paste; the
                        treatment matches how it rendered in the prior
                        standalone Open work band. */}
                    {linkedCard?.suggested_opening && (
                      <div className="mt-3 border-l-[3px] border-blaze-orange py-1 pl-3">
                        <p className="text-xs font-semibold text-blaze-orange-deep">
                          Suggested opening · member-facing
                        </p>
                        <p className="mt-1 text-sm italic text-blaze-grey-body">
                          &ldquo;{linkedCard.suggested_opening}&rdquo;
                        </p>
                      </div>
                    )}

                    <details className="group mt-3 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-body transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
                        <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                          ›
                        </span>
                        from {captureRef}
                      </summary>
                      <div className="mt-2 ml-4 border-l-2 border-blaze-orange-deep/20 pl-3 text-blaze-grey-body">
                        Opportunity produced_by GrowthStepExecution (
                        {r.growth_step_execution.growth_step?.step_shape ?? "track-agnostic"}-shape).
                        {linkedCard?.origin_growth_step_execution && (
                          <>
                            {" · "}
                            ActionCard spawned_by GrowthStepExecution (
                            {linkedCard.origin_growth_step_execution.growth_step?.step_shape ?? "track-agnostic"}-shape).
                          </>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>

          <Rule />

          {/* Member identity band moved to the persistent sidebar header per
              Sprint 1 review fix #2 — "Open opportunities" referencing
              "Jenny's Catering" by name reads as ungrounded if the page
              hasn't established who that is, and a sidebar-pinned identity
              block stays visible regardless of scroll position. The three
              navigational tokens (active signals / open ActionCards / open
              opportunities) move with the identity content into the sidebar.

              Active state band remains deleted per Sprint 1 §C.1; the
              MemberSummarySnapshot audit trail in prisma/seed.ts is
              unchanged. */}

          {/* Open work band removed per Sprint 2 Prompt 2 §E. Every
              ActionCard in the demo links to a specific Recommendation;
              showing both bands surfaced the same opportunity from two
              angles. ActionCard data (suggested_opening, due-date /
              overdue status) folds into the unified Open opportunities
              band above. The action_cards relation on Member is still
              fetched (used by sidebar What's hot priorities, and by the
              actionCardByRecommendationId map that drives the merger). */}

          {/* Band — Active signals, grouped by all four types. The
              Open work band that previously preceded this is now merged
              into Open opportunities; the supporting-evidence framing
              still holds — Active signals follows the action surface. */}
          <section id="band-signals">
            <SectionLabel
              label="Active signals"
              meta={`what we know about ${
                member.doing_business_as ?? member.legal_name
              } right now`}
            />
            <div className="mt-5 space-y-5">
              {(["goal", "blocker", "trigger", "indecision"] as const).map((type) => {
                const items = signalsByType[type];
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-blaze-grey-body">
                      {SIGNAL_TYPE_LABELS[type]} ({items.length})
                    </h3>
                    {items.length === 0 ? (
                      <p className="mt-1 text-sm italic text-blaze-grey-body">
                        No active{" "}
                        {type === "indecision" ? "indecisions" : `${type}s`} on record.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {items.map((s) => {
                          const captureRef = `${s.conversation.meeting_type.replace(
                            /_/g,
                            " ",
                          )} · ${fmtDate(s.conversation.created_at)}${
                            s.growth_step_execution?.growth_step
                              ? ` · ${s.growth_step_execution.growth_step.title}`
                              : ""
                          }`;
                          return (
                            <li
                              key={s.id}
                              id={`signal-${s.id}`}
                              className="py-1 scroll-mt-24"
                            >
                              <div className="flex items-start gap-2">
                                {/* Sprint 4 §4.1d Block C — severity is now
                                    nullable (Indecision Signals may have
                                    no Impact). Fall back to a muted dot
                                    color when severity is null so the row
                                    still aligns visually. */}
                                <span
                                  className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                                    s.severity
                                      ? SEVERITY_DOT[s.severity]
                                      : "bg-blaze-rule"
                                  }`}
                                  aria-label={
                                    s.severity
                                      ? `severity: ${s.severity}`
                                      : "severity: not specified"
                                  }
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-blaze-charcoal leading-tight">
                                    {s.topic.display_name}
                                  </p>
                                  {/* Sprint 4 §4.1d Block C — per-type
                                      rendering. Goal / Blocker show
                                      Impact + Timeframe + Source. Trigger
                                      shows Impact + Time horizon (read
                                      from time_horizon, not recency) +
                                      Source. Indecision skips Impact /
                                      Timeframe when the captured value
                                      is null (per the optional-field
                                      discipline). Source is universal. */}
                                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-xs text-blaze-grey-body">
                                    {(() => {
                                      const items: ReactNode[] = [];
                                      if (s.severity) {
                                        items.push(
                                          <LabeledValue
                                            key="impact"
                                            label="Impact"
                                            capturedBy={`Signal.severity · ${captureRef}`}
                                          >
                                            {s.severity}
                                          </LabeledValue>,
                                        );
                                      }
                                      if (s.type === "trigger" && s.time_horizon) {
                                        items.push(
                                          <LabeledValue
                                            key="time_horizon"
                                            label="Time horizon"
                                            capturedBy={`Signal.time_horizon · ${captureRef}`}
                                          >
                                            {TIME_HORIZON_LABEL[s.time_horizon] ?? s.time_horizon}
                                          </LabeledValue>,
                                        );
                                      } else if (s.recency) {
                                        // Pre-refactor Trigger Signals in the seed
                                        // captured recency only; render under
                                        // "Timeframe" rather than dropping the
                                        // row entirely.
                                        items.push(
                                          <LabeledValue
                                            key="timeframe"
                                            label="Timeframe"
                                            capturedBy={`Signal.recency · ${captureRef}`}
                                          >
                                            {s.recency.replace(/_/g, " ")}
                                          </LabeledValue>,
                                        );
                                      }
                                      if (s.magnitude !== null && s.unit) {
                                        items.push(
                                          <LabeledValue key="quantified" label="Quantified">
                                            <InlineWithProvenance
                                              capturedBy={`Signal.magnitude (Size step) · ${captureRef}`}
                                            >
                                              {s.unit === "dollars"
                                                ? dollars(s.magnitude)
                                                : `${s.magnitude} ${s.unit.replace(/_/g, " ")}`}
                                              {s.frequency ? `/${s.frequency}` : ""}
                                            </InlineWithProvenance>
                                          </LabeledValue>,
                                        );
                                      }
                                      items.push(
                                        <LabeledValue
                                          key="source"
                                          label="Source"
                                          capturedBy={`Signal.confidence · ${captureRef}`}
                                        >
                                          {s.confidence.replace(/_/g, " ")}
                                        </LabeledValue>,
                                      );
                                      return items.map((node, i) => (
                                        <Fragment key={i}>
                                          {i > 0 && <span aria-hidden>·</span>}
                                          {node}
                                        </Fragment>
                                      ));
                                    })()}
                                  </p>
                                  {s.their_words && (
                                    <blockquote className="mt-2 border-l-[3px] border-blaze-orange py-1 pl-3 text-sm italic text-blaze-grey-body">
                                      &ldquo;{s.their_words}&rdquo;
                                    </blockquote>
                                  )}
                                  <details className="group mt-2 text-xs">
                                    <summary className="cursor-pointer text-blaze-grey-body transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
                                      <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                                        ›
                                      </span>
                                      from {captureRef}
                                    </summary>
                                    <div className="mt-2 ml-4 border-l-2 border-blaze-orange-deep/20 pl-3 text-blaze-grey-body">
                                      Signal anchored_to Member ·{" "}
                                      {s.growth_step_execution?.growth_step
                                        ? `produced_by GrowthStepExecution (${s.growth_step_execution.growth_step.step_shape}-shape)`
                                        : s.growth_step_execution
                                        ? "produced_by GrowthStepExecution (track-agnostic)"
                                        : "captured directly on Conversation (no execution)"}
                                      .
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <Rule />

          {/* Band 6 — History */}
          <section id="band-history">
            <SectionLabel
              label="History"
              meta="conversations and Artifact share record"
            />
            <ol className="relative mt-5 space-y-3 pl-6">
              {/* Continuous timeline thread — connects the orange dots into a
                  single chronology read. Sits at left-2 (8px) so the dot
                  centers (4px wide / -left-[20px] from li content at x=24)
                  land at exactly x=8. Per BLAZE_STYLE_GUIDE §4.5. */}
              <span
                aria-hidden
                className="absolute left-2 top-3 bottom-3 w-px bg-blaze-rule"
              />
              {member.conversations.map((c) => {
                // Sprint 1 §E.4 — selective verb-prefix lines on Conversations
                // that originated downstream entities. Heuristic priority:
                //   1. produced — if this Conversation produced a Recommendation
                //   2. introduced — if this is an onboarding Conversation
                //   3. captured — if a goal Signal was first surfaced here
                //   else: routine, no verb line.
                // The order matters: a Conversation that produced a
                // Recommendation likely also has goal Signals attached, but the
                // produced relationship is the more specific one to surface.
                const producedRec = recommendationByConversationId.get(c.id);
                const goalSignal = c.signals.find((s) => s.type === "goal");
                const verbInfo: { verb: string; entityName: string; anchorId?: string } | null =
                  producedRec
                    ? {
                        verb: "produced",
                        entityName: `${opportunityName(producedRec)} opportunity`,
                        anchorId: `rec-${producedRec.id}`,
                      }
                    : c.meeting_type === "onboarding"
                    ? {
                        verb: "introduced",
                        entityName: "Member relationship",
                      }
                    : goalSignal
                    ? {
                        verb: "captured",
                        entityName: `Goal — ${goalSignal.topic.display_name}`,
                        anchorId: `signal-${goalSignal.id}`,
                      }
                    : null;
                return (
                <li
                  key={c.id}
                  className="relative -mx-2 px-2 py-1 cursor-pointer transition-colors duration-150 hover:bg-[rgba(180,95,38,0.04)]"
                >
                  {/* dot center at x=8 (matching thread): with li -mx-2 px-2,
                      li's padding-box-left sits at x=16 from ol; thread is at
                      left-2 (=8). Dot is 8px wide; dot.left = -12 places dot
                      at x=4..12, centered at 8. */}
                  <span className="absolute -left-[12px] top-2.5 inline-block h-2 w-2 rounded-full bg-blaze-orange-deep" />
                  <p className="text-xs font-medium text-blaze-grey-body">
                    {fmtDate(c.created_at)} · {c.meeting_type.replace(/_/g, " ")} ·{" "}
                    {c.channel.replace(/_/g, " ")} · {c.sentiment}
                    {c.duration_min ? ` · ${c.duration_min}m` : ""}
                  </p>
                  {c.moment_quote && (
                    <p className="mt-1 text-sm italic text-blaze-grey-body">
                      &ldquo;{c.moment_quote}&rdquo;
                    </p>
                  )}
                  {c.banker_note && (
                    <p className="mt-1 text-sm text-blaze-charcoal">{c.banker_note}</p>
                  )}
                  {verbInfo && (
                    <VerbPrefixLine
                      verb={verbInfo.verb}
                      entityName={verbInfo.entityName}
                      anchorId={verbInfo.anchorId}
                    />
                  )}
                  {c.growth_step_executions.length > 0 && (
                    <details className="group mt-1 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-body transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
                        <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                          ›
                        </span>
                        {c.growth_step_executions.length} Growth step execution
                        {c.growth_step_executions.length === 1 ? "" : "s"}
                      </summary>
                      <ol className="mt-1 ml-4 list-decimal space-y-1 pl-3 text-blaze-grey-body">
                        {c.growth_step_executions.map((e) => (
                          <li key={e.id}>
                            {e.growth_step?.title ??
                              `Track-agnostic ${e.step_phase ?? "execution"}`}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </li>
                );
              })}
            </ol>

            <div className="mt-6 border-t border-blaze-rule pt-4">
              <p className="text-xs font-semibold text-blaze-grey-body">
                Artifact share record
              </p>
              {artifactShareRows.length === 0 ? (
                <p className="mt-2 text-sm italic text-blaze-grey-body">
                  No Artifacts shown to this member yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {artifactShareRows.map((row, i) => {
                    const dialogData: ArtifactPreviewData = {
                      title: row.artifact_title,
                      description: row.artifact_description,
                      type: row.artifact_type,
                      template: row.artifact_template,
                      parameters_used: row.parameters_used,
                      shared_on_iso: row.conversation_date_iso,
                      shared_afterward: row.shared_afterward,
                      conversation_date_iso: row.conversation_date_iso,
                    };
                    return (
                      <li key={i} className="text-sm text-blaze-charcoal">
                        {/* Sprint 1 review fix #1: takeaway-status display
                            dropped (the relevant signals — chart shown,
                            member responded, opportunity advanced — are
                            captured elsewhere; this line was filler). The
                            shared_afterward boolean stays in the schema for
                            future production analytics. */}
                        <ArtifactPreviewDialog artifact={dialogData} />
                        {" · "}
                        <LabeledValue label="Shared with member">
                          <InlineWithProvenance
                            capturedBy={`Show step · ${fmtDate(row.conversation_date_iso)}`}
                          >
                            {fmtDate(row.conversation_date_iso)}
                          </InlineWithProvenance>
                        </LabeledValue>
                        {row.supports_recommendation_id &&
                          row.supports_recommendation_name && (
                            <VerbPrefixLine
                              verb="supports opportunity"
                              entityName={row.supports_recommendation_name}
                              anchorId={`rec-${row.supports_recommendation_id}`}
                            />
                          )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </main>

        {/* Sidebar — persistent Member identity header + "What's hot"
            prioritized action feed.

            Member identity (Sprint 1 review fix #2): pinned at the top of
            the sidebar so the banker always knows whose profile they're
            reading regardless of scroll position. Replaces the prior
            main-column band-identity section. Three navigational tokens
            sit as a small footer below the identity block, anchoring to
            the relevant main-column bands.

            "What's hot" (Sprint 1 §B): top priorities computed by
            lib/priorities.ts. Empty list renders nothing — no placeholder
            text. */}
        <aside className="space-y-6">
          <section>
            <h1 className="text-xl font-semibold leading-tight text-black">
              {member.doing_business_as ?? member.legal_name}
            </h1>
            <p className="mt-1 text-xs text-blaze-grey-body">
              {member.member_type.name}
            </p>
            {(() => {
              const cs = member.core_sync_state as {
                member_facing_summary?: {
                  owner_name?: string;
                  location?: string;
                  employees?: number;
                  revenue_ttm_band?: string;
                };
              };
              const f = cs.member_facing_summary ?? {};
              const sinceYear = member.tenure_started_at.getUTCFullYear();
              const tenureFragment = `Member since ${sinceYear}`;
              const factFragments = [
                tenureFragment,
                f.location,
                f.employees !== undefined
                  ? `${f.employees} employee${f.employees === 1 ? "" : "s"}`
                  : null,
                f.revenue_ttm_band,
              ].filter((x): x is string => Boolean(x));
              return (
                <>
                  <p className="mt-3 text-xs leading-relaxed text-blaze-charcoal">
                    {factFragments.join(" · ")}
                  </p>
                  <p className="mt-2 text-xs text-blaze-grey-body">
                    Primary banker:{" "}
                    <span className="font-medium text-blaze-charcoal">
                      {member.primary_banker.display_name}
                    </span>
                  </p>
                </>
              );
            })()}

            {/* Two-token navigational summary line. Sprint 2 Prompt 2 §E.6
                dropped the "open ActionCard" token alongside the band
                merger — ActionCards no longer have their own band, and the
                ActionCard count duplicated the opportunity count for the
                demo's data shape (every card links to one opportunity). */}
            <p className="mt-3 text-xs leading-relaxed text-blaze-grey-body">
              <a
                href="#band-signals"
                className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
              >
                {member.active_signal_count} active Signal
                {member.active_signal_count === 1 ? "" : "s"}
              </a>
              {member.recommendations.length > 0 && (
                <>
                  {" · "}
                  <a
                    href="#band-proposals"
                    className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
                  >
                    {member.recommendations.length} open opportunit
                    {member.recommendations.length === 1 ? "y" : "ies"}
                  </a>
                </>
              )}
            </p>
          </section>

          {priorities.length > 0 && (
            <>
              {/* Hairline rule between identity header and What's hot. */}
              <hr className="border-0 border-t border-blaze-rule" aria-hidden />
              <section>
                <SectionLabel label="What's hot" size="compact" />
                <ol className="mt-4 space-y-3">
                  {priorities.map((p: Priority) => (
                    <li
                      key={p.id}
                      className="group/prio relative cursor-default text-sm leading-snug text-blaze-charcoal"
                    >
                      <p className="font-medium">{p.label}</p>
                      {p.detail && (
                        <p className="mt-1 text-xs text-blaze-grey-body">
                          {p.detail}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </aside>
      </div>

      {/* Footer thin gradient strip */}
      <div className="h-1 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />
    </div>
  );
}
