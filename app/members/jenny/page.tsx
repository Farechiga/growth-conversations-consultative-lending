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
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  summarizeMember,
  type MemberSummaryInput,
} from "@/lib/summaries";
import { fireRules, type RuleConditions } from "@/lib/rule-engine";
import {
  ArtifactPreviewDialog,
  type ArtifactPreviewData,
} from "./artifact-preview-dialog";
import type { ReactNode } from "react";

// ============================================================
// Prisma client — short-lived per request. Server Components run on the server,
// so this is fine for the demo. (Production would extract to a singleton.)
// ============================================================

function getPrisma() {
  const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) });
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

const RECENCY_LABEL: Record<string, string> = {
  acute_recent: "felt acutely · recent",
  ongoing: "ongoing pattern",
  chronic: "long-running",
  hypothetical_future: "anticipated · not yet acute",
};

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

// Replace the first occurrence of `token` in `text` with React node `replacement`.
// Used to retrofit anchor links onto the templated summary prose without
// duplicating summarizeMember's wording in the page (Semantic Discipline §3.4
// — the canonical prose lives in lib/summaries.ts; this is a presentation-layer
// overlay for interactivity).
function injectLink(text: string, token: string, replacement: ReactNode): ReactNode[] {
  const idx = text.indexOf(token);
  if (idx === -1) return [text];
  return [text.slice(0, idx), replacement, text.slice(idx + token.length)];
}

function injectLinks(text: string, links: { token: string; node: ReactNode }[]): ReactNode {
  let nodes: ReactNode[] = [text];
  for (const { token, node } of links) {
    nodes = nodes.flatMap((n) =>
      typeof n === "string" ? injectLink(n, token, node) : [n],
    );
  }
  return <>{nodes}</>;
}

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
  // ~80px between bands per BLAZE_STYLE_GUIDE §4.5: my-10 = 40px each side
  // + 1px line ≈ 81px total gap. Generous between-band whitespace is what
  // makes borderless designs read as elegant rather than cramped.
  return <hr className="my-10 border-0 border-t border-blaze-rule" aria-hidden />;
}

// ============================================================
// Page
// ============================================================

export default async function JennyMemberProfilePage() {
  const prisma = getPrisma();

  const member = await prisma.member.findFirstOrThrow({
    where: { legal_name: "Jenny's Catering LLC" },
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
          responds_to_signals: { include: { topic: true } },
          growth_step_execution: {
            include: {
              growth_step: { include: { artifact: true } },
              conversation: { select: { id: true, created_at: true, meeting_type: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      },
      conversations: {
        orderBy: { created_at: "desc" },
        include: {
          banker: { select: { display_name: true } },
          growth_step_executions: {
            include: { growth_step: { include: { artifact: true } } },
            orderBy: { sequence_position: "asc" },
          },
        },
      },
    },
  });

  // Step (d): live rule-engine call. Evaluate every Rule against the Member's
  // current active Signals + products held; the top-ranked result populates
  // the pinned suggested-next-step panel. For Jenny the engine returns
  // "Smooth seasonal cash flow with LOC for small caterer" at #1 with high
  // confidence (verified at the Day-1 checkpoint).
  const rules = await prisma.rule.findMany({
    include: {
      output_growth_tracks: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  // Resolve products held → their subcategories so the rule engine's
  // product_not_held / product_held operands evaluate correctly.
  const productsHeldRaw =
    (member.core_sync_state as { products_held: { product_id: string }[] })
      .products_held ?? [];
  const productsHeld = (
    await Promise.all(
      productsHeldRaw.map(async (p) => {
        const pr = await prisma.product.findUnique({
          where: { id: p.product_id },
          select: { subcategory: true },
        });
        return pr ? { product_subcategory: pr.subcategory } : null;
      }),
    )
  ).filter((x): x is { product_subcategory: string } => x !== null);

  await prisma.$disconnect();

  type SuggestedTrack = {
    name: string;
    description: string;
    rule_name: string;
    confidence_band: "low" | "medium" | "high";
  };

  const ranked = fireRules(
    rules.map((r) => ({
      id: r.id,
      name: r.name,
      conditions: r.conditions as RuleConditions,
      confidence_band: r.confidence_band,
      output_growth_tracks: r.output_growth_tracks.map((t) => ({
        id: t.id,
        name: t.name,
      })),
    })),
    {
      member: { id: member.id, member_type_id: member.member_type_id },
      activeSignals: member.signals.map((s) => ({ topic_id: s.topic_id })),
      productsHeld,
    },
  );

  // Top-ranked result + lookup the description from the original rules array
  // (fireRules's output type narrows to id + name only).
  const top = ranked[0];
  const topTrackId = top?.growth_tracks[0]?.id;
  const topTrackFull = topTrackId
    ? rules
        .flatMap((r) => r.output_growth_tracks)
        .find((t) => t.id === topTrackId)
    : null;
  const suggestedTrack: SuggestedTrack | null =
    top && topTrackFull
      ? {
          name: topTrackFull.name,
          description: topTrackFull.description,
          rule_name: top.rule.name,
          confidence_band: top.rule.confidence_band,
        }
      : null;

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

  const activeBlockerCount = signalsByType.blocker.length;
  const proposal = member.recommendations[0] ?? null;

  // Templated prose summary (canonical) — the snapshot store uses this verbatim.
  const summaryResult = summarizeMember(
    {
      legal_name: member.legal_name,
      doing_business_as: member.doing_business_as,
      member_type_name: member.member_type.name,
      industry_family_name: member.industry_family.name,
      tenure_started_at: member.tenure_started_at,
      primary_banker_name: member.primary_banker.display_name,
      active_blocker_count: activeBlockerCount,
      active_proposal: proposal
        ? {
            product_name: proposal.product.name,
            size_proposed: proposal.size_proposed,
            response: proposal.response,
            primary_concern: proposal.primary_concern,
          }
        : null,
      last_touch_at: member.last_touch_at,
      open_action_card_count: member.open_action_card_count,
      active_signal_count: member.active_signal_count,
    } satisfies MemberSummaryInput,
    NOW,
  );

  const summaryText = summaryResult.ok ? summaryResult.value : "";

  // Derive Artifact share records from Show-shape executions whose captured_data
  // includes shared_afterward = true. The brief's preferred storage shape is a
  // dedicated ArtifactShareRecord row; for the demo we read from captured_data
  // jsonb on the execution to avoid a second persistence path.
  type ArtifactShareRow = {
    artifact_title: string;
    artifact_description: string;
    artifact_type: "chart" | "comparison" | "calculator";
    artifact_template: string;
    parameters_used: Record<string, unknown>;
    member_reaction: string;
    shared_afterward: boolean;
    conversation_id: string;
    conversation_date_iso: string;
  };
  const artifactShareRows: ArtifactShareRow[] = [];
  for (const c of member.conversations) {
    for (const e of c.growth_step_executions) {
      if (e.growth_step.step_shape !== "show") continue;
      const captured = e.captured_data as {
        member_reaction?: string;
        shared_afterward?: boolean;
        parameters_used?: Record<string, unknown>;
      };
      const artifact = e.growth_step.artifact;
      if (!artifact) continue;
      artifactShareRows.push({
        artifact_title: artifact.title,
        artifact_description: artifact.description,
        artifact_type: artifact.type,
        artifact_template: artifact.template,
        parameters_used: captured.parameters_used ?? {},
        member_reaction: captured.member_reaction ?? "—",
        shared_afterward: captured.shared_afterward ?? false,
        conversation_id: c.id,
        conversation_date_iso: c.created_at.toISOString(),
      });
    }
  }

  // Build the active-state summary with token anchor links per (6)(a).
  // The links jump to bands. Linked tokens are computed against the live data
  // so plurals match summarizeMember's output exactly.
  const blockersToken = `${activeBlockerCount} active blocker${
    activeBlockerCount === 1 ? "" : "s"
  }`;
  const cardsToken = `${member.open_action_card_count} open ActionCard${
    member.open_action_card_count === 1 ? "" : "s"
  }`;
  const proposalToken = proposal
    ? proposal.size_proposed !== null
      ? `${dollars(proposal.size_proposed)} proposal for ${proposal.product.name}`
      : `unsized proposal for ${proposal.product.name}`
    : null;

  const summaryNodes = injectLinks(summaryText, [
    {
      token: blockersToken,
      node: (
        <a
          key="blockers"
          href="#band-signals"
          className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
        >
          {blockersToken}
        </a>
      ),
    },
    {
      token: cardsToken,
      node: (
        <a
          key="cards"
          href="#band-work"
          className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
        >
          {cardsToken}
        </a>
      ),
    },
    ...(proposalToken
      ? [
          {
            token: proposalToken,
            node: (
              <a
                key="proposal"
                href="#band-proposals"
                className="font-medium text-blaze-orange-deep underline-offset-2 hover:underline"
              >
                {proposalToken}
              </a>
            ),
          },
        ]
      : []),
  ]);

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
          <div className="text-sm text-blaze-charcoal">
            Logged in as{" "}
            <span className="font-medium">{member.primary_banker.display_name}</span>
            <span className="ml-2 text-xs text-blaze-grey-body">Primary banker</span>
          </div>
        </div>
      </header>

      {/* Main content + sidebar */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          {/* Pinned: Suggested next step (above the fold). Live result from
              fireRules(); hidden if no rule fires. THE deliberate exception
              to the borderless pattern — orange-pale card so the primary CTA
              reads as primary. Per BLAZE_STYLE_GUIDE §4. */}
          {suggestedTrack && (
            <section
              id="band-suggested"
              className="rounded-md bg-[#F6EFE5] p-5"
            >
              <p className="text-sm font-semibold text-blaze-orange-deep">
                Suggested next step ·{" "}
                <span className="font-medium">
                  {suggestedTrack.confidence_band} confidence
                </span>
              </p>
              <h2 className="mt-2 text-xl font-semibold text-blaze-orange-deep">
                {suggestedTrack.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
                {suggestedTrack.description}
              </p>
              <p className="mt-2 text-xs text-blaze-grey-body">
                Surfaced by rule:{" "}
                <span className="font-medium text-blaze-charcoal">
                  {suggestedTrack.rule_name}
                </span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt">
                  Run Growth track
                </button>
                <button className="rounded bg-transparent px-4 py-2 text-sm font-medium text-blaze-charcoal transition-colors hover:bg-blaze-orange-pale">
                  Dismiss
                </button>
              </div>
            </section>
          )}

          <Rule />

          {/* Band 1 — Identity strip */}
          <section id="band-identity">
            <SectionLabel label="Member" />
            <h1 className="mt-3 text-3xl font-semibold text-black">
              {member.doing_business_as ?? member.legal_name}
            </h1>
            <p className="mt-1 text-sm text-blaze-grey-body">
              Legal: {member.legal_name}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-blaze-grey-body md:grid-cols-4">
              <div>
                <dt className="text-xs font-medium text-blaze-grey-body">Member Type</dt>
                <dd className="font-medium text-blaze-charcoal">{member.member_type.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-blaze-grey-body">Industry</dt>
                <dd className="font-medium text-blaze-charcoal">{member.industry_family.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-blaze-grey-body">Primary banker</dt>
                <dd className="font-medium text-blaze-charcoal">
                  {member.primary_banker.display_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-blaze-grey-body">Member since</dt>
                <dd className="font-medium text-blaze-charcoal">
                  {fmtDate(member.tenure_started_at)}
                </dd>
              </div>
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
                return (
                  <>
                    {f.owner_name && (
                      <div>
                        <dt className="text-xs font-medium text-blaze-grey-body">Owner</dt>
                        <dd className="font-medium text-blaze-charcoal">{f.owner_name}</dd>
                      </div>
                    )}
                    {f.location && (
                      <div>
                        <dt className="text-xs font-medium text-blaze-grey-body">Location</dt>
                        <dd className="font-medium text-blaze-charcoal">{f.location}</dd>
                      </div>
                    )}
                    {f.employees !== undefined && (
                      <div>
                        <dt className="text-xs font-medium text-blaze-grey-body">Employees</dt>
                        <dd className="font-medium text-blaze-charcoal">{f.employees}</dd>
                      </div>
                    )}
                    {f.revenue_ttm_band && (
                      <div>
                        <dt className="text-xs font-medium text-blaze-grey-body">Revenue (TTM)</dt>
                        <dd className="font-medium text-blaze-charcoal">{f.revenue_ttm_band}</dd>
                      </div>
                    )}
                  </>
                );
              })()}
            </dl>
          </section>

          <Rule />

          {/* Band 2 — Active state summary, with clickable tokens. */}
          <section id="band-summary">
            <SectionLabel label="Active state" meta="where things stand" />
            <h2 className="mt-3 text-lg font-semibold text-black">
              Where things stand
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blaze-charcoal">{summaryNodes}</p>
            <p className="mt-3 text-xs text-blaze-grey-body">
              Generated from the Member summary template (
              <code className="rounded bg-white/60 px-1 py-px text-[0.85em]">
                lib/summaries.ts · v1
              </code>
              ). Tokens above link to the relevant band.
            </p>
          </section>

          <Rule />

          {/* Band 3 — Active signals, grouped by all four types */}
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
                            s.growth_step_execution
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
                                <span
                                  className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                                    SEVERITY_DOT[s.severity]
                                  }`}
                                  aria-label={`severity: ${s.severity}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-blaze-charcoal leading-tight">
                                    {s.topic.display_name}
                                  </p>
                                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xs text-blaze-grey-body">
                                    <CapturedChip capturedBy={`Signal.severity · ${captureRef}`}>
                                      {s.severity}
                                    </CapturedChip>
                                    <span>·</span>
                                    <CapturedChip capturedBy={`Signal.recency · ${captureRef}`}>
                                      {s.recency.replace(/_/g, " ")}
                                    </CapturedChip>
                                    {s.magnitude !== null && s.unit && (
                                      <>
                                        <span>·</span>
                                        <CapturedChip
                                          capturedBy={`Signal.magnitude (Size step) · ${captureRef}`}
                                        >
                                          {s.unit === "dollars"
                                            ? dollars(s.magnitude)
                                            : `${s.magnitude} ${s.unit.replace(/_/g, " ")}`}
                                          {s.frequency ? `/${s.frequency}` : ""}
                                        </CapturedChip>
                                      </>
                                    )}
                                    <span>·</span>
                                    <CapturedChip capturedBy={`Signal.confidence · ${captureRef}`}>
                                      {s.confidence.replace(/_/g, " ")}
                                    </CapturedChip>
                                  </p>
                                  <p className="mt-1 text-xs text-blaze-grey-body">
                                    {RECENCY_LABEL[s.recency]}
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
                                      {s.growth_step_execution
                                        ? `produced_by GrowthStepExecution (${s.growth_step_execution.growth_step.step_shape}-shape)`
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

          {/* Band 4 — Active proposals with responds_to_signals inline */}
          <section id="band-proposals">
            <SectionLabel
              label="Active proposals"
              meta="recommendations on the table"
            />
            <ul className="mt-5 space-y-4">
              {member.recommendations.map((r) => {
                const conv = r.growth_step_execution.conversation;
                const captureRef = `Recommendation · Show step in ${conv.meeting_type.replace(
                  /_/g,
                  " ",
                )} · ${fmtDate(conv.created_at)}`;
                return (
                  <li
                    key={r.id}
                    className="py-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-blaze-charcoal">
                        {r.product.name}{" "}
                        {r.size_proposed !== null ? (
                          <>
                            at{" "}
                            <CapturedChip capturedBy={`size_proposed · ${captureRef}`}>
                              {dollars(r.size_proposed)}
                            </CapturedChip>
                          </>
                        ) : (
                          <span className="text-blaze-grey-body">(unsized — see rationale)</span>
                        )}
                      </p>
                      <span className="text-xs text-blaze-grey-body">
                        <CapturedChip capturedBy={`confidence_band · ${captureRef}`}>
                          {r.confidence_band} confidence
                        </CapturedChip>{" "}
                        ·{" "}
                        <CapturedChip capturedBy={`structure · ${captureRef}`}>
                          {r.structure}
                        </CapturedChip>
                      </span>
                    </div>

                    {r.responds_to_signals.length > 0 && (
                      <ul className="mt-3 space-y-0.5 text-xs text-blaze-grey-body">
                        {[...r.responds_to_signals]
                          .sort((a, b) => SIGNAL_TYPE_ORDER[a.type] - SIGNAL_TYPE_ORDER[b.type])
                          .map((s) => {
                            // Magnitude rendered inline as plain text in this compact context.
                            // Chip treatment is reserved for the standalone Signal entry in Band 3.
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
                      {r.primary_concern && (
                        <>
                          {" "}
                          · primary concern:{" "}
                          <CapturedChip capturedBy={`primary_concern · ${captureRef}`}>
                            {r.primary_concern.replace(/_/g, " ")}
                          </CapturedChip>
                        </>
                      )}
                      .
                    </p>

                    {/* Progressive disclosure per Q-018: show one-line summary
                        by default; full rationale_text behind an expand. The
                        summary is the scan-friendly read; the full prose is
                        the auditable detail. */}
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

                    <details className="group mt-3 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-body transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
                        <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                          ›
                        </span>
                        from {captureRef}
                      </summary>
                      <div className="mt-2 ml-4 border-l-2 border-blaze-orange-deep/20 pl-3 text-blaze-grey-body">
                        Recommendation produced_by GrowthStepExecution (
                        {r.growth_step_execution.growth_step.step_shape}-shape){" "}
                        {r.rule_that_fired ? `· surfaced_by_rule "${r.rule_that_fired.name}"` : ""}.
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>

          <Rule />

          {/* Band 5 — Open work */}
          <section id="band-work">
            <SectionLabel
              label="Open work"
              meta={`ActionCards for ${
                member.doing_business_as ?? member.legal_name
              }`}
            />
            <ul className="mt-5 space-y-4">
              {member.action_cards.map((c) => {
                const days = daysBetween(c.due_at, NOW);
                const overdue = days < 0;
                const conv = c.origin_conversation;
                const captureRef = `${conv.meeting_type.replace(/_/g, " ")} · ${fmtDate(
                  conv.created_at,
                )}${
                  c.origin_growth_step_execution
                    ? ` · ${c.origin_growth_step_execution.growth_step.title}`
                    : ""
                }`;
                return (
                  <li
                    key={c.id}
                    className={`-mx-2 px-2 cursor-pointer transition-colors duration-150 hover:bg-[rgba(180,95,38,0.04)] ${
                      overdue
                        ? "border-l-[3px] border-blaze-danger py-1 pl-3"
                        : "py-2"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-blaze-charcoal">
                        <CapturedChip capturedBy={`ActionCard.type · ${captureRef}`}>
                          {c.type.replace(/_/g, " ")}
                        </CapturedChip>{" "}
                        · owned by {c.owner.display_name}
                      </p>
                      <span
                        className={`text-xs ${
                          overdue ? "font-medium text-blaze-danger" : "text-blaze-grey-body"
                        }`}
                      >
                        Due{" "}
                        <CapturedChip capturedBy={`due_at · ${captureRef}`}>
                          {fmtDate(c.due_at)}
                        </CapturedChip>
                        {overdue ? ` · ${Math.abs(days)}d overdue` : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-blaze-charcoal">
                      {c.rationale}
                    </p>
                    {c.suggested_opening && (
                      <div className="mt-3 border-l-[3px] border-blaze-orange py-1 pl-3">
                        <p className="text-xs font-semibold text-blaze-orange-deep">
                          Suggested opening · member-facing
                        </p>
                        <p className="mt-1 text-sm italic text-blaze-grey-body">
                          &ldquo;{c.suggested_opening}&rdquo;
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
                        ActionCard originated_from Conversation
                        {c.origin_growth_step_execution
                          ? ` · spawned_by GrowthStepExecution (${c.origin_growth_step_execution.growth_step.step_shape}-shape)`
                          : " · captured outside any specific Growth step (banker-edited add-on)"}
                        .
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
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
              {member.conversations.map((c) => (
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
                          <li key={e.id}>{e.growth_step.title}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                </li>
              ))}
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
                      member_reaction: row.member_reaction,
                      shared_afterward: row.shared_afterward,
                      conversation_date_iso: row.conversation_date_iso,
                    };
                    return (
                      <li key={i} className="text-sm text-blaze-charcoal">
                        <ArtifactPreviewDialog artifact={dialogData} /> · shown{" "}
                        {fmtDate(row.conversation_date_iso)} · member reaction:{" "}
                        <CapturedChip
                          capturedBy={`member_reaction · Show step ${fmtDate(
                            row.conversation_date_iso,
                          )}`}
                        >
                          {row.member_reaction}
                        </CapturedChip>
                        {row.shared_afterward ? " · sent as takeaway" : ""}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </main>

        {/* Sidebar — banker-only context. Borderless mini-bands matching the
            main column's typography-led pattern; section marks at compact
            size so the sidebar reads quieter than the primary column. */}
        <aside className="space-y-10">
          <section>
            <SectionLabel label="Private notes" size="compact" />
            <div className="mt-3">
              {(() => {
                const notes = (member.private_notes ?? []) as {
                  content: string;
                  created_at?: string;
                }[];
                return notes.length === 0 ? (
                  <p className="text-sm italic text-blaze-grey-body">
                    No private notes captured yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {notes.map((n, i) => (
                      <li key={i} className="text-sm text-blaze-charcoal">
                        {n.content}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </section>

          <section>
            <SectionLabel label="Forward signals" size="compact" />
            <p className="mt-3 text-sm italic text-blaze-grey-body">
              No forward intent captured yet. Check back after the next Connect step.
            </p>
          </section>

          <p className="px-1 text-xs text-blaze-grey-body">
            Sidebar visibility is banker-only. Private notes never aggregate to dashboards.
          </p>
        </aside>
      </div>

      {/* Footer thin gradient strip */}
      <div className="h-1 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />
    </div>
  );
}
