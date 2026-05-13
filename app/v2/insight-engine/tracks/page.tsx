/*
 * Sprint 5b.2 Block B — Track Performance surface.
 *
 * Per-Track aggregate view across all bankers' Members. Drives a senior-
 * lender or banker view of "across the portfolio, how are Members
 * distributed against this Track's required evidence and workflow
 * state?" No strength-tier labels at any scale per architectural
 * commitment.
 */

import "dotenv/config";
import Link from "next/link";

// Server-render on each request so portfolio data reflects the live DB
// after capture writes (without this, Next.js prerenders at build time).
export const dynamic = "force-dynamic";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import {
  trackPerformanceData,
  dayCountSince,
  type TrackPerformanceRow,
} from "@/lib/portfolio-queries";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

// Sprint 5c Block F — Track display grouping. TRACK-001 (Working
// Capital LOC) and TRACK-004 (SBA 7(a)) are retained from pre-Sprint-5c
// era as future-expansion products (Blaze doesn't currently offer
// these). Grouped visually as "Future-expansion lending products" so
// portfolio surface is honest about Blaze's actual catalog without
// dropping the Tracks (Jenny's primary stays on TRACK-001).
const FUTURE_EXPANSION_TRACK_IDS = new Set(["TRACK-001", "TRACK-004"]);

export default async function TrackPerformancePage() {
  const prisma = getPrisma();
  const data = await trackPerformanceData(prisma);
  await prisma.$disconnect();

  const blazeOffers = data.filter(
    (r) => !FUTURE_EXPANSION_TRACK_IDS.has(r.track_id),
  );
  const futureExpansion = data.filter((r) =>
    FUTURE_EXPANSION_TRACK_IDS.has(r.track_id),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-blaze-charcoal">
          Lending product performance
        </h1>
        <p className="mt-2 text-sm text-blaze-grey-body">
          Per-lending-product Member distribution by capture density and
          workflow state. Click a Member to navigate to their conversation
          page.
        </p>
      </div>
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
          Lending products Blaze offers ({blazeOffers.length})
        </h2>
        <div className="mt-3 space-y-5">
          {blazeOffers.map((row) => (
            <TrackCard key={row.track_id} row={row} />
          ))}
        </div>
      </section>
      {futureExpansion.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
            Lending products Blaze doesn&rsquo;t offer today ({futureExpansion.length})
          </h2>
          <p className="mt-1 text-[11px] italic text-blaze-grey-soft">
            Tracks retained for matrix coverage; not currently in the Blaze
            offering catalog.
          </p>
          <div className="mt-3 space-y-5 opacity-90">
            {futureExpansion.map((row) => (
              <TrackCard key={row.track_id} row={row} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TrackCard({ row }: { row: TrackPerformanceRow }) {
  const { aggregates, members, track_name } = row;
  return (
    <section className="rounded border border-blaze-rule bg-white">
      <header className="flex items-baseline justify-between border-b border-blaze-rule px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-blaze-charcoal">
            {track_name}
          </h2>
          <p className="mt-0.5 text-[11px] text-blaze-grey-soft">
            {aggregates.total_count}{" "}
            {aggregates.total_count === 1 ? "Member" : "Members"}{" "}
            with this Track currently selected
          </p>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-4 border-b border-blaze-rule px-5 py-4 text-sm md:grid-cols-3">
        <Stat
          label="Capture density"
          values={[
            { k: "A little", v: aggregates.capture_density.low },
            { k: "Some", v: aggregates.capture_density.medium },
            { k: "A lot", v: aggregates.capture_density.high },
          ]}
        />
        <Stat
          label="Workflow state"
          values={[
            { k: "Pending follow-ups", v: aggregates.pending_action_cards },
            { k: "Captures over 90 days old", v: aggregates.stale_captures },
            { k: "Open threads", v: aggregates.open_threads },
          ]}
        />
        <Stat
          label="Member type mix"
          values={Array.from(
            members.reduce<Map<string, number>>((acc, m) => {
              acc.set(
                m.member_type_name,
                (acc.get(m.member_type_name) ?? 0) + 1,
              );
              return acc;
            }, new Map()),
          ).map(([k, v]) => ({ k, v }))}
        />
      </div>
      {members.length > 0 ? (
        <ul className="divide-y divide-blaze-rule">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                href={`/v2/members/${m.slug}`}
                className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3 transition-colors hover:bg-blaze-cream/30"
              >
                <span className="text-sm font-medium text-blaze-charcoal">
                  {m.display_name}
                  <span className="ml-2 text-[11px] font-normal text-blaze-grey-soft">
                    {m.member_type_name}
                  </span>
                </span>
                <span className="text-[11px] text-blaze-grey-soft">
                  {m.workflow_state?.total_captures ?? 0} captures ·{" "}
                  {m.workflow_state?.last_touch_at
                    ? `${dayCountSince(m.workflow_state.last_touch_at)}d ago`
                    : "no captures yet"}
                  {(m.workflow_state?.open_thread_count ?? 0) > 0 &&
                    ` · ${m.workflow_state?.open_thread_count} open thread${
                      (m.workflow_state?.open_thread_count ?? 0) > 1 ? "s" : ""
                    }`}
                  {(m.workflow_state?.pending_action_card_count ?? 0) > 0 &&
                    ` · ${m.workflow_state?.pending_action_card_count} ActionCard${
                      (m.workflow_state?.pending_action_card_count ?? 0) > 1
                        ? "s"
                        : ""
                    }`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm italic text-blaze-grey-soft">
          No Members currently have this Track selected.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  values,
}: {
  label: string;
  values: Array<{ k: string; v: number }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
        {label}
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[12px] text-blaze-grey-body">
        {values.map((v) => (
          <li key={v.k} className="flex justify-between gap-3">
            <span>{v.k}</span>
            <span className="font-medium text-blaze-charcoal">{v.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
