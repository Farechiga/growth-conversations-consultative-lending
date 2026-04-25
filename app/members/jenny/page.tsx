/*
 * Day-2 step (a) — Member profile smoke test.
 *
 * Jenny's Catering rendered with HARDCODED data, plain Tailwind, six bands
 * per Module and Data Flow §4.2 (identity · summary · active signals ·
 * active proposals · open work · history) plus the right-side banker-only
 * sidebar and the above-the-fold pinned suggested-next-step panel.
 *
 * Deliberately NOT in this step:
 *   - Live data from Prisma — that's step (b).
 *   - Orange-headed-panel pattern from BLAZE_STYLE_GUIDE.md §4 — that's step (c).
 *   - Rule-engine call wiring the suggested next step — that's step (d). The
 *     pinned panel here uses a hardcoded suggestion that matches what the
 *     engine would return.
 *
 * Per the Day-1 close BUILD_LOG note: the active-signals band groups by ALL
 * FOUR Signal types (goal / blocker / trigger / indecision), even though
 * Jenny has data only in two of them. The grouped-by-type rendering must
 * NOT inherit the summary's blocker-only compression.
 */

import Link from "next/link";

// ============================================================
// Hardcoded Jenny data — replaced by Prisma fetch in step (b)
// ============================================================

const JENNY = {
  identity: {
    legal_name: "Jenny's Catering LLC",
    doing_business_as: "Jenny's Catering",
    industry_family: "Event-driven services",
    member_type: "Small Caterer · Starting",
    primary_banker: "Scott Brynjolffson",
    tenure_started_at: "2023-06-15",
    tenure_years: 2,
    location: "Plymouth, MN",
    owner: "Jenny Patel",
    employees: 6,
    revenue_band: "$500K-$1M",
  },

  // Templated summary from lib/summaries.ts (verified at Day-1 checkpoint).
  summary:
    "Jenny's Catering, a Small Caterer · Starting in Event-driven services. Member since 2023 (2 years with Blaze); primary banker is Scott Brynjolffson. Last touch was 2 weeks ago; 2 active blockers, 1 open ActionCard. Member is leaning yes on a $75K proposal for Working Capital Line of Credit; needs spousal input before committing.",

  // Suggested next step — what the rule engine returns for Jenny (verified
  // at Day-1 checkpoint). Hardcoded here; step (d) calls fireRules() live.
  suggested_next_step: {
    growth_track_name: "Smooth seasonal cash flow with LOC for small caterer",
    description:
      "Surfaces seasonal cash flow stress for small caterers, quantifies the gap, renders a parameterized smoothing chart, and closes with a sized LOC proposal.",
    rule_name: "Surface seasonal cash flow track for small caterers",
    confidence_band: "high" as const,
  },

  // Active signals grouped by type. Empty buckets are rendered as
  // explicit "none" rows for the smoke test so the layout reads correctly
  // for Members who have data in all four (e.g., Cygnus).
  active_signals: {
    goal: [],
    blocker: [
      {
        topic_display_name: "Seasonal cash flow stress",
        severity: "painful" as const,
        recency: "acute_recent" as const,
        their_words:
          "this corporate client paying late really hit us, and our slow months are tough as it is",
        magnitude: { value: 12000, unit: "dollars", frequency: "quarterly" },
      },
      {
        topic_display_name: "Slow customer payments",
        severity: "manageable" as const,
        recency: "ongoing" as const,
        their_words: "they keep slipping past 30 days and I have to keep pinging them",
        magnitude: null,
      },
    ],
    trigger: [],
    indecision: [
      {
        topic_display_name: "Needs another decision-maker's input",
        severity: "manageable" as const,
        recency: "acute_recent" as const,
        their_words: "I want to talk to my husband before we commit to anything this size",
        magnitude: null,
      },
    ],
  },

  active_proposals: [
    {
      product_name: "Working Capital Line of Credit",
      size_proposed: 75000,
      structure: "standard",
      response: "leaning_yes",
      primary_concern: "spouse",
      confidence_band: "high" as const,
      rationale_text:
        "Member showed acute seasonal cash flow stress quantified at approximately $12K per quarter. A $75K LOC sized at roughly one quarter of the slow-season revenue gap provides smoothing capacity with comfortable headroom. Member's existing Visa demonstrates payment discipline; primary guarantee from the owner is appropriate given the size.",
    },
  ],

  open_action_cards: [
    {
      type: "follow_up",
      owner: "Scott Brynjolffson",
      rationale:
        "Jenny was 'leaning yes' on the $75K LOC after seeing the seasonal smoothing chart but wants to discuss with her husband before committing. De-risk by sending her the parameterized chart and offering a joint call next week.",
      due_at: "2026-04-22",
      days_until_due: -3, // Today is 2026-04-25; this is overdue by 3 days
      status: "open",
    },
  ],

  history: [
    {
      date: "2026-04-08",
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "receptive",
      moment_quote: "this is exactly what I needed to see — wow",
      banker_note: "Husband is the financial decision-maker; include him next time",
      duration_min: 32,
    },
    {
      date: "2025-12-04",
      meeting_type: "service",
      channel: "call",
      sentiment: "uncertain",
      moment_quote: null,
      banker_note: "Inquiry about a corporate client paying 45+ days late. Scott offered guidance, no Growth track run.",
      duration_min: null,
    },
    {
      date: "2024-09-08",
      meeting_type: "check_in",
      channel: "in_person",
      sentiment: "cautious",
      moment_quote: null,
      banker_note: "Visa limit increase request approved; Jenny mentioned spouse helps with books.",
      duration_min: null,
    },
    {
      date: "2024-03-12",
      meeting_type: "check_in",
      channel: "call",
      sentiment: "receptive",
      moment_quote: "winter was tough",
      banker_note: "Year-end review; Jenny mentioned 'winter was tough' but didn't elaborate.",
      duration_min: null,
    },
    {
      date: "2023-06-15",
      meeting_type: "onboarding",
      channel: "in_person",
      sentiment: "receptive",
      moment_quote: null,
      banker_note: "Account opening; Visa application initiated.",
      duration_min: null,
    },
  ],

  artifact_share_history: [
    {
      title: "Seasonal cash flow smoothing chart",
      shared_on: "2026-04-08",
      member_reaction: "engaged",
      shared_afterward: true,
    },
  ],

  private_notes: [], // Empty for Jenny — sidebar shows the empty state
  forward_signals: [], // Empty for Jenny — Cygnus has these

  banker_logged_in_as: "Scott Brynjolffson",
  banker_role: "Primary banker",
};

// ============================================================
// Small presentation helpers
// ============================================================

const SEVERITY_DOT: Record<"manageable" | "painful" | "threatening", string> = {
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

function dollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const SIGNAL_TYPE_LABELS = {
  goal: "Goals",
  blocker: "Blockers",
  trigger: "Triggers",
  indecision: "Indecisions",
} as const;

// ============================================================
// Page
// ============================================================

export default function JennyMemberProfilePage() {
  return (
    <div className="min-h-screen w-full bg-blaze-cream">
      {/* §3 signature gradient band */}
      <div className="h-8 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />

      {/* App header — wordmark + banker identity */}
      <header className="border-b border-blaze-dust bg-blaze-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            <span className="text-blaze-orange-deep">Member</span>{" "}
            <span className="text-blaze-grey-darker">Signals</span>
          </Link>
          <div className="rounded border border-blaze-grey-soft/40 bg-blaze-white px-3 py-1.5 text-sm text-blaze-grey-darker">
            Logged in as <span className="font-medium">{JENNY.banker_logged_in_as}</span>
            <span className="ml-2 text-xs text-blaze-grey-soft">{JENNY.banker_role}</span>
          </div>
        </div>
      </header>

      {/* Two-column layout: main + banker-only sidebar */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="space-y-6">
          {/* Pinned: Suggested next step (above the fold) */}
          <section
            aria-labelledby="suggested-heading"
            className="rounded border border-blaze-orange/30 bg-blaze-orange-pale/40 p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-orange-deep">
              Suggested next step · {JENNY.suggested_next_step.confidence_band} confidence
            </p>
            <h2
              id="suggested-heading"
              className="mt-1 text-xl font-semibold text-blaze-grey-darker"
            >
              {JENNY.suggested_next_step.growth_track_name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blaze-grey-body">
              {JENNY.suggested_next_step.description}
            </p>
            <p className="mt-2 text-xs text-blaze-grey-soft">
              Surfaced by rule: {JENNY.suggested_next_step.rule_name}
            </p>
            <div className="mt-3 flex gap-3">
              <button className="rounded bg-blaze-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blaze-orange-bright active:bg-blaze-orange-burnt">
                Run Growth track
              </button>
              <button className="rounded border border-blaze-grey-soft bg-transparent px-4 py-2 text-sm font-medium text-blaze-grey-dark transition-colors hover:bg-blaze-cream">
                Dismiss
              </button>
            </div>
          </section>

          {/* Band 1 — Identity strip */}
          <section
            aria-labelledby="identity-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Member · Band 1
            </p>
            <h1 id="identity-heading" className="mt-1 text-2xl font-semibold text-blaze-grey-darker">
              {JENNY.identity.doing_business_as}
            </h1>
            <p className="text-sm text-blaze-grey-body">
              Legal: {JENNY.identity.legal_name}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-blaze-grey-body md:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Member Type</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.member_type}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Industry</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.industry_family}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Primary banker</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.primary_banker}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Member since</dt>
                <dd className="font-medium text-blaze-grey-darker">
                  {fmtDate(JENNY.identity.tenure_started_at)} · {JENNY.identity.tenure_years} years
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Owner</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.owner}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Location</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.location}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Employees</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.employees}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-blaze-grey-soft">Revenue (TTM)</dt>
                <dd className="font-medium text-blaze-grey-darker">{JENNY.identity.revenue_band}</dd>
              </div>
            </dl>
          </section>

          {/* Band 2 — Active state summary */}
          <section
            aria-labelledby="summary-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active state · Band 2
            </p>
            <h2 id="summary-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              Where things stand
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blaze-grey-darker">{JENNY.summary}</p>
            <p className="mt-3 text-xs text-blaze-grey-soft">
              Generated from the Member summary template (lib/summaries.ts · v1).
            </p>
          </section>

          {/* Band 3 — Active signals, grouped by ALL FOUR types */}
          <section
            aria-labelledby="signals-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active signals · Band 3
            </p>
            <h2 id="signals-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              What we know about Jenny right now
            </h2>
            <div className="mt-4 space-y-5">
              {(["goal", "blocker", "trigger", "indecision"] as const).map((type) => {
                const items = JENNY.active_signals[type];
                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
                      {SIGNAL_TYPE_LABELS[type]} ({items.length})
                    </h3>
                    {items.length === 0 ? (
                      <p className="mt-1 text-sm italic text-blaze-grey-soft">
                        No active {type === "indecision" ? "indecisions" : `${type}s`} on record.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {items.map((s, i) => (
                          <li
                            key={`${type}-${i}`}
                            className="rounded border border-blaze-dust bg-blaze-cream/50 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[s.severity]}`}
                                aria-label={`severity: ${s.severity}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-blaze-grey-darker">
                                  {s.topic_display_name}
                                </p>
                                <p className="text-xs text-blaze-grey-soft">
                                  {s.severity} · {RECENCY_LABEL[s.recency]}
                                  {s.magnitude
                                    ? ` · ${dollars(s.magnitude.value)} ${s.magnitude.frequency}`
                                    : ""}
                                </p>
                                {s.their_words && (
                                  <blockquote className="mt-2 border-l-2 border-blaze-orange/40 pl-3 text-sm italic text-blaze-grey-body">
                                    “{s.their_words}”
                                  </blockquote>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Band 4 — Active proposals */}
          <section
            aria-labelledby="proposals-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Active proposals · Band 4
            </p>
            <h2 id="proposals-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              Recommendations on the table
            </h2>
            <ul className="mt-3 space-y-3">
              {JENNY.active_proposals.map((p, i) => (
                <li key={i} className="rounded border border-blaze-dust bg-blaze-cream/50 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-blaze-grey-darker">
                      {p.product_name}{" "}
                      <span className="text-blaze-orange-deep">at {dollars(p.size_proposed)}</span>
                    </p>
                    <span className="text-xs text-blaze-grey-soft">
                      {p.confidence_band} confidence · {p.structure} structure
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-blaze-grey-body">
                    Member is <strong>{p.response.replace(/_/g, " ")}</strong>; primary concern:{" "}
                    <strong>{p.primary_concern.replace(/_/g, " ")}</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-blaze-grey-darker">
                    {p.rationale_text}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Band 5 — Open work */}
          <section
            aria-labelledby="work-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              Open work · Band 5
            </p>
            <h2 id="work-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              ActionCards for Jenny
            </h2>
            <ul className="mt-3 space-y-3">
              {JENNY.open_action_cards.map((c, i) => {
                const overdue = c.days_until_due < 0;
                return (
                  <li
                    key={i}
                    className={`rounded border p-4 ${
                      overdue
                        ? "border-blaze-danger/40 bg-blaze-danger/5"
                        : "border-blaze-dust bg-blaze-cream/50"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-blaze-grey-darker">
                        {c.type.replace(/_/g, " ")} · owned by {c.owner}
                      </p>
                      <span
                        className={`text-xs ${
                          overdue ? "font-medium text-blaze-danger" : "text-blaze-grey-soft"
                        }`}
                      >
                        Due {fmtDate(c.due_at)}
                        {overdue ? ` · ${Math.abs(c.days_until_due)}d overdue` : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-blaze-grey-darker">
                      {c.rationale}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Band 6 — History */}
          <section
            aria-labelledby="history-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-blaze-grey-soft">
              History · Band 6
            </p>
            <h2 id="history-heading" className="mt-1 text-base font-semibold text-blaze-grey-dark">
              Conversations and Artifact share record
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-blaze-dust pl-4">
              {JENNY.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.42rem] top-1.5 inline-block h-2 w-2 rounded-full bg-blaze-orange-deep" />
                  <p className="text-xs uppercase tracking-wide text-blaze-grey-soft">
                    {fmtDate(h.date)} · {h.meeting_type.replace(/_/g, " ")} · {h.channel.replace(/_/g, " ")} · {h.sentiment}
                    {h.duration_min ? ` · ${h.duration_min}m` : ""}
                  </p>
                  {h.moment_quote && (
                    <p className="mt-1 text-sm italic text-blaze-grey-body">“{h.moment_quote}”</p>
                  )}
                  {h.banker_note && (
                    <p className="mt-1 text-sm text-blaze-grey-darker">{h.banker_note}</p>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 border-t border-blaze-dust pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
                Artifact share record
              </p>
              <ul className="mt-2 space-y-2">
                {JENNY.artifact_share_history.map((a, i) => (
                  <li key={i} className="text-sm text-blaze-grey-darker">
                    <span className="font-medium">{a.title}</span> · shown {fmtDate(a.shared_on)} ·{" "}
                    member reaction: <em>{a.member_reaction}</em>
                    {a.shared_afterward ? " · sent as takeaway" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>

        {/* Sidebar — banker-only context */}
        <aside className="space-y-4">
          <section
            aria-labelledby="notes-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-4"
          >
            <h3 id="notes-heading" className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Private notes
            </h3>
            {JENNY.private_notes.length === 0 ? (
              <p className="mt-2 text-sm italic text-blaze-grey-soft">
                No private notes captured yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {JENNY.private_notes.map((n: { content: string; created_at: string }, i) => (
                  <li key={i} className="text-sm text-blaze-grey-darker">
                    {n.content}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="forward-heading"
            className="rounded border border-blaze-dust bg-blaze-white p-4"
          >
            <h3 id="forward-heading" className="text-xs font-semibold uppercase tracking-wide text-blaze-grey-soft">
              Forward signals
            </h3>
            {JENNY.forward_signals.length === 0 ? (
              <p className="mt-2 text-sm italic text-blaze-grey-soft">
                No forward intent captured yet. Check back after the next Connect step.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {JENNY.forward_signals.map((f: { topic: string; their_words: string }, i) => (
                  <li key={i} className="text-sm text-blaze-grey-darker">
                    {f.topic}: “{f.their_words}”
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="px-1 text-xs text-blaze-grey-soft">
            Sidebar visibility is banker-only. Private notes never aggregate to dashboards.
          </p>
        </aside>
      </div>

      {/* Footer thin gradient strip */}
      <div className="h-1 w-full" style={{ backgroundImage: "var(--blaze-gradient)" }} aria-hidden />
    </div>
  );
}
