/*
 * Day-2 step (b) — Member profile, live data.
 *
 * Server Component that fetches Jenny's record from Prisma with deep includes
 * and renders the six-band layout per Module and Data Flow §4.2 plus the
 * banker-only sidebar (§4.3) and the above-the-fold pinned suggested-next-step
 * panel (§4.4).
 *
 * Substantive treatments per the b.2 plan:
 *   - Trace pattern: <details>/<summary> blocks on Recommendations, ActionCards,
 *     and Artifact share records, expanding to the originating Conversation +
 *     Growth-step execution.
 *   - Captured-value chips: Recommendation.size_proposed, response, primary_concern,
 *     Signal magnitude, ActionCard due date — visually distinct chips with
 *     title-attribute tooltips citing the capture event.
 *   - Recommendation.responds_to_signals rendered inline with anchor links to
 *     the corresponding Signal in Band 3.
 *   - Active state summary tokens are clickable anchor links to the relevant
 *     bands (the minimal v1 of the §I (6)(a) treatment).
 *
 * Visual identity per b.3:
 *   - Page background = blaze-grey-darker; panels = frosted-glass white-on-dark
 *     with --blaze-frost-edge borders. All body prose stays on white panel
 *     surfaces, never on the dark ground directly.
 *
 * Live rule-engine wiring of the suggested-step panel is step (d). For now the
 * panel reads from Member.member_type.default_growth_tracks[0], which matches
 * what fireRules() returns at #1 for Jenny (verified at the Day-1 checkpoint).
 *
 * Live fetch is parameterless — Jenny is keyed by legal name. Step-(b) extension
 * to dynamic /members/[id] routing comes later when Northland and Cygnus surfaces
 * are added to the demo.
 */

import "dotenv/config";
import Link from "next/link";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  summarizeMember,
  type MemberSummaryInput,
} from "@/lib/summaries";
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
// Captured-value chip — Semantic Discipline (2). Visually distinct so audit /
// LLM readers can tell which strings are captured field values vs. prose.
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
      className="inline-flex items-baseline rounded border border-blaze-orange-deep/30 bg-blaze-orange-pale/50 px-1.5 py-px font-mono text-[0.85em] text-blaze-orange-deep align-baseline"
      title={`Captured · ${capturedBy}`}
    >
      {children}
    </span>
  );
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

  await prisma.$disconnect();

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

  // Suggested next step: hardcoded to MemberType.default_growth_tracks[0] for
  // step (b). Live rule-engine call lands in step (d).
  const defaultTrack = member.member_type.default_growth_tracks[0] ?? null;

  // Derive Artifact share records from Show-shape executions whose captured_data
  // includes shared_afterward = true. The brief's preferred storage shape is a
  // dedicated ArtifactShareRecord row; for the demo we read from captured_data
  // jsonb on the execution to avoid a second persistence path.
  type ArtifactShareRow = {
    artifact_title: string;
    artifact_description: string;
    artifact_type: "chart" | "comparison" | "calculator";
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

  const PANEL_CLS =
    "rounded-lg border border-blaze-frost-edge bg-white/92 backdrop-blur p-5";

  return (
    <div className="min-h-screen w-full bg-blaze-grey-darker">
      {/* §3 signature gradient band */}
      <div className="h-8 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />

      {/* App header — wordmark + banker identity. Frosted-glass panel sitting
          on the dark ground for visual continuity with the body bands below. */}
      <header className="border-b border-blaze-frost-edge/40 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            <span className="text-blaze-orange-deep">Member</span>{" "}
            <span className="text-blaze-grey-darker">Signals</span>
          </Link>
          <div className="rounded border border-blaze-grey-soft/40 bg-white px-3 py-1.5 text-sm text-blaze-grey-darker">
            Logged in as{" "}
            <span className="font-medium">{member.primary_banker.display_name}</span>
            <span className="ml-2 text-xs text-blaze-grey-soft">Primary banker</span>
          </div>
        </div>
      </header>

      {/* Main content + sidebar */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="space-y-6">
          {/* Pinned: Suggested next step (above the fold). On dark ground we
              keep the orange-pale tint but raise the contrast with a white
              underlay so prose stays readable. */}
          {defaultTrack && (
            <section
              aria-labelledby="suggested-heading"
              className="rounded-lg border border-blaze-orange/40 bg-blaze-orange-pale/85 p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-blaze-orange-deep">
                Suggested next step ·{" "}
                <CapturedChip capturedBy="rule firing">high confidence</CapturedChip>
              </p>
              <h2
                id="suggested-heading"
                className="mt-1 text-xl font-semibold text-blaze-grey-darker"
              >
                {defaultTrack.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-blaze-grey-body">
                {defaultTrack.description}
              </p>
              <p className="mt-2 text-xs text-blaze-grey-soft">
                Surfaced from{" "}
                <code className="rounded bg-white/60 px-1 py-px text-[0.85em]">
                  Member Type.default_growth_tracks
                </code>
                . Live rule-engine call wires up in step (d).
              </p>
              <div className="mt-3 flex gap-3">
                <button className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt">
                  Run Growth track
                </button>
                <button className="rounded border border-blaze-grey-soft bg-white/60 px-4 py-2 text-sm font-medium text-blaze-grey-dark transition-colors hover:bg-white/80">
                  Dismiss
                </button>
              </div>
            </section>
          )}

          {/* Band 1 — Identity strip */}
          <section aria-labelledby="identity-heading" id="band-identity" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Member · Band 1
            </p>
            <h1
              id="identity-heading"
              className="mt-1 text-2xl font-semibold text-blaze-grey-darker"
            >
              {member.doing_business_as ?? member.legal_name}
            </h1>
            <p className="text-sm text-blaze-grey-body">Legal: {member.legal_name}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-blaze-grey-body md:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Member Type</dt>
                <dd className="font-medium text-blaze-grey-darker">{member.member_type.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Industry</dt>
                <dd className="font-medium text-blaze-grey-darker">{member.industry_family.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Primary banker</dt>
                <dd className="font-medium text-blaze-grey-darker">
                  {member.primary_banker.display_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Member since</dt>
                <dd className="font-medium text-blaze-grey-darker">
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
                        <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Owner</dt>
                        <dd className="font-medium text-blaze-grey-darker">{f.owner_name}</dd>
                      </div>
                    )}
                    {f.location && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Location</dt>
                        <dd className="font-medium text-blaze-grey-darker">{f.location}</dd>
                      </div>
                    )}
                    {f.employees !== undefined && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Employees</dt>
                        <dd className="font-medium text-blaze-grey-darker">{f.employees}</dd>
                      </div>
                    )}
                    {f.revenue_ttm_band && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Revenue (TTM)</dt>
                        <dd className="font-medium text-blaze-grey-darker">{f.revenue_ttm_band}</dd>
                      </div>
                    )}
                  </>
                );
              })()}
            </dl>
          </section>

          {/* Band 2 — Active state summary, with clickable tokens. */}
          <section aria-labelledby="summary-heading" id="band-summary" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active state · Band 2
            </p>
            <h2 id="summary-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              Where things stand
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blaze-grey-darker">{summaryNodes}</p>
            <p className="mt-3 text-xs text-blaze-grey-soft">
              Generated from the Member summary template (
              <code className="rounded bg-blaze-cream px-1 py-px text-[0.85em]">
                lib/summaries.ts · v1
              </code>
              ). Tokens above link to the relevant band.
            </p>
          </section>

          {/* Band 3 — Active signals, grouped by all four types */}
          <section aria-labelledby="signals-heading" id="band-signals" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active signals · Band 3
            </p>
            <h2 id="signals-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              What we know about {member.doing_business_as ?? member.legal_name} right now
            </h2>
            <div className="mt-4 space-y-5">
              {(["goal", "blocker", "trigger", "indecision"] as const).map((type) => {
                const items = signalsByType[type];
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
                      {SIGNAL_TYPE_LABELS[type]} ({items.length})
                    </h3>
                    {items.length === 0 ? (
                      <p className="mt-1 text-sm italic text-blaze-grey-soft">
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
                              className="rounded border border-blaze-dust bg-blaze-cream/60 p-3 scroll-mt-24"
                            >
                              <div className="flex items-start gap-2">
                                <span
                                  className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                                    SEVERITY_DOT[s.severity]
                                  }`}
                                  aria-label={`severity: ${s.severity}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-blaze-grey-darker">
                                    {s.topic.display_name}
                                  </p>
                                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xs text-blaze-grey-soft">
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
                                  <p className="mt-1 text-xs text-blaze-grey-soft">
                                    {RECENCY_LABEL[s.recency]}
                                  </p>
                                  {s.their_words && (
                                    <blockquote className="mt-2 border-l-2 border-blaze-orange/40 pl-3 text-sm italic text-blaze-grey-body">
                                      &ldquo;{s.their_words}&rdquo;
                                    </blockquote>
                                  )}
                                  <details className="group mt-2 text-xs">
                                    <summary className="cursor-pointer text-blaze-grey-soft transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
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

          {/* Band 4 — Active proposals with responds_to_signals inline */}
          <section aria-labelledby="proposals-heading" id="band-proposals" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active proposals · Band 4
            </p>
            <h2
              id="proposals-heading"
              className="mt-1 text-base font-semibold text-blaze-grey-dark"
            >
              Recommendations on the table
            </h2>
            <ul className="mt-3 space-y-3">
              {member.recommendations.map((r) => {
                const conv = r.growth_step_execution.conversation;
                const captureRef = `Recommendation · Show step in ${conv.meeting_type.replace(
                  /_/g,
                  " ",
                )} · ${fmtDate(conv.created_at)}`;
                return (
                  <li
                    key={r.id}
                    className="rounded border border-blaze-dust bg-blaze-cream/60 p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-blaze-grey-darker">
                        {r.product.name}{" "}
                        {r.size_proposed !== null ? (
                          <>
                            at{" "}
                            <CapturedChip capturedBy={`size_proposed · ${captureRef}`}>
                              {dollars(r.size_proposed)}
                            </CapturedChip>
                          </>
                        ) : (
                          <span className="text-blaze-grey-soft">(unsized — see rationale)</span>
                        )}
                      </p>
                      <span className="text-xs text-blaze-grey-soft">
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
                      <p className="mt-2 text-xs text-blaze-grey-body">
                        <span className="text-blaze-grey-soft">responds to:</span>{" "}
                        {r.responds_to_signals.map((s, i) => (
                          <span key={s.id}>
                            <a
                              href={`#signal-${s.id}`}
                              className="text-blaze-orange-deep underline-offset-2 hover:underline"
                            >
                              {s.topic.display_name}
                            </a>{" "}
                            <span className="text-blaze-grey-soft">({s.type})</span>
                            {i < r.responds_to_signals.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
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

                    <p className="mt-2 text-sm leading-relaxed text-blaze-grey-darker">
                      {r.rationale_text}
                    </p>

                    <details className="group mt-3 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-soft transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
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

          {/* Band 5 — Open work */}
          <section aria-labelledby="work-heading" id="band-work" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Open work · Band 5
            </p>
            <h2 id="work-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              ActionCards for {member.doing_business_as ?? member.legal_name}
            </h2>
            <ul className="mt-3 space-y-3">
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
                    className={`rounded border p-4 ${
                      overdue
                        ? "border-blaze-danger/40 bg-blaze-danger/5"
                        : "border-blaze-dust bg-blaze-cream/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-blaze-grey-darker">
                        <CapturedChip capturedBy={`ActionCard.type · ${captureRef}`}>
                          {c.type.replace(/_/g, " ")}
                        </CapturedChip>{" "}
                        · owned by {c.owner.display_name}
                      </p>
                      <span
                        className={`text-xs ${
                          overdue ? "font-medium text-blaze-danger" : "text-blaze-grey-soft"
                        }`}
                      >
                        Due{" "}
                        <CapturedChip capturedBy={`due_at · ${captureRef}`}>
                          {fmtDate(c.due_at)}
                        </CapturedChip>
                        {overdue ? ` · ${Math.abs(days)}d overdue` : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-blaze-grey-darker">
                      {c.rationale}
                    </p>
                    {c.suggested_opening && (
                      <div className="mt-2 rounded border border-blaze-orange-deep/20 bg-white/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blaze-orange-deep">
                          Suggested opening (member-facing)
                        </p>
                        <p className="mt-1 text-sm italic text-blaze-grey-darker">
                          &ldquo;{c.suggested_opening}&rdquo;
                        </p>
                      </div>
                    )}
                    <details className="group mt-3 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-soft transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
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

          {/* Band 6 — History */}
          <section aria-labelledby="history-heading" id="band-history" className={PANEL_CLS}>
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              History · Band 6
            </p>
            <h2
              id="history-heading"
              className="mt-1 text-base font-semibold text-blaze-grey-dark"
            >
              Conversations and Artifact share record
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-blaze-dust pl-4">
              {member.conversations.map((c) => (
                <li key={c.id} className="relative">
                  <span className="absolute -left-[1.42rem] top-1.5 inline-block h-2 w-2 rounded-full bg-blaze-orange-deep" />
                  <p className="text-xs uppercase tracking-wide text-blaze-grey-soft">
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
                    <p className="mt-1 text-sm text-blaze-grey-darker">{c.banker_note}</p>
                  )}
                  {c.growth_step_executions.length > 0 && (
                    <details className="group mt-1 text-xs">
                      <summary className="cursor-pointer text-blaze-grey-soft transition-colors hover:text-blaze-orange-deep group-open:text-blaze-orange-deep">
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

            <div className="mt-6 border-t border-blaze-dust pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
                Artifact share record
              </p>
              {artifactShareRows.length === 0 ? (
                <p className="mt-2 text-sm italic text-blaze-grey-soft">
                  No Artifacts shown to this member yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {artifactShareRows.map((row, i) => {
                    const dialogData: ArtifactPreviewData = {
                      title: row.artifact_title,
                      description: row.artifact_description,
                      type: row.artifact_type,
                      parameters_used: row.parameters_used,
                      shared_on_iso: row.conversation_date_iso,
                      member_reaction: row.member_reaction,
                      shared_afterward: row.shared_afterward,
                      conversation_date_iso: row.conversation_date_iso,
                    };
                    return (
                      <li key={i} className="text-sm text-blaze-grey-darker">
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

        {/* Sidebar — banker-only context */}
        <aside className="space-y-4">
          <section aria-labelledby="notes-heading" className={PANEL_CLS.replace("p-5", "p-4")}>
            <h3
              id="notes-heading"
              className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft"
            >
              Private notes
            </h3>
            {(() => {
              const notes = (member.private_notes ?? []) as { content: string; created_at?: string }[];
              return notes.length === 0 ? (
                <p className="mt-2 text-sm italic text-blaze-grey-soft">
                  No private notes captured yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {notes.map((n, i) => (
                    <li key={i} className="text-sm text-blaze-grey-darker">
                      {n.content}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>

          <section aria-labelledby="forward-heading" className={PANEL_CLS.replace("p-5", "p-4")}>
            <h3
              id="forward-heading"
              className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft"
            >
              Forward signals
            </h3>
            <p className="mt-2 text-sm italic text-blaze-grey-soft">
              No forward intent captured yet. Check back after the next Connect step.
            </p>
          </section>

          <p className="px-1 text-xs text-blaze-cream/70">
            Sidebar visibility is banker-only. Private notes never aggregate to dashboards.
          </p>
        </aside>
      </div>

      {/* Footer thin gradient strip */}
      <div className="h-1 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />
    </div>
  );
}
