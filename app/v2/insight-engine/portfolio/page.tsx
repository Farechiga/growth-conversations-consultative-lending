/*
 * Sprint 5b.2 Block C — Member portfolio surface.
 *
 * Banker roster with last-touch-driven default sort (oldest first to
 * surface neglected Members). For demo: shows all Members assigned to
 * Scott. Pilot: real banker-roster scoping via RBAC (Note 9).
 */

import "dotenv/config";
import Link from "next/link";

export const dynamic = "force-dynamic";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import { memberRoster, dayCountSince } from "@/lib/portfolio-queries";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

export default async function MemberPortfolioPage() {
  const prisma = getPrisma();
  const roster = await memberRoster(prisma);
  await prisma.$disconnect();

  // Default sort: oldest-touched first.
  const sorted = [...roster].sort((a, b) => {
    const at = a.workflow_state?.last_touch_at?.getTime() ?? 0;
    const bt = b.workflow_state?.last_touch_at?.getTime() ?? 0;
    return at - bt;
  });

  // Header aggregates.
  const total = roster.length;
  const touched_30d = roster.filter((m) => {
    const d = dayCountSince(m.workflow_state?.last_touch_at ?? null);
    return d !== null && d <= 30;
  }).length;
  const pending_action_cards = roster.filter(
    (m) => (m.workflow_state?.pending_action_card_count ?? 0) > 0,
  ).length;
  const stale = roster.filter(
    (m) => (m.workflow_state?.stale_capture_count ?? 0) > 0,
  ).length;
  const open_threads = roster.filter(
    (m) => (m.workflow_state?.open_thread_count ?? 0) > 0,
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-blaze-charcoal">
          Member portfolio
        </h1>
        <p className="mt-2 text-sm text-blaze-grey-body">
          Roster sorted oldest-touched first to surface Members needing
          attention. Click a Member to navigate to their conversation page.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-4 rounded border border-blaze-rule bg-white p-5 md:grid-cols-5">
        <Stat label="Members" value={total} />
        <Stat label="Touched in 30d" value={touched_30d} />
        <Stat label="Pending follow-ups" value={pending_action_cards} />
        <Stat label="Captures over 90 days old" value={stale} />
        <Stat label="Open threads" value={open_threads} />
      </section>
      <section className="overflow-hidden rounded border border-blaze-rule bg-white">
        <ul className="divide-y divide-blaze-rule">
          {sorted.map((m) => {
            const days = dayCountSince(m.workflow_state?.last_touch_at ?? null);
            return (
              <li key={m.id}>
                <Link
                  href={`/v2/members/${m.slug}`}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-blaze-cream/30 md:flex-row md:items-baseline md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-blaze-charcoal">
                      {m.display_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-blaze-grey-soft">
                      {m.member_type_name}
                      {m.current_track_name && ` · ${m.current_track_name}`}
                      {` · banker: ${m.primary_banker_name}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-blaze-grey-body md:justify-end">
                    <span>
                      Last touch:{" "}
                      <strong className="font-medium text-blaze-charcoal">
                        {days !== null ? `${days}d ago` : "never"}
                      </strong>
                    </span>
                    <span>
                      Captures: {m.workflow_state?.total_captures ?? 0}{" "}
                      <span className="text-blaze-grey-soft">
                        ({m.workflow_state?.signals_count ?? 0}S /{" "}
                        {m.workflow_state?.insights_count ?? 0}I /{" "}
                        {m.workflow_state?.reactions_count ?? 0}R)
                      </span>
                    </span>
                    {(m.workflow_state?.pending_action_card_count ?? 0) > 0 && (
                      <span className="text-blaze-orange-deep">
                        {m.workflow_state?.pending_action_card_count} ActionCard
                        {(m.workflow_state?.pending_action_card_count ?? 0) > 1
                          ? "s"
                          : ""}
                      </span>
                    )}
                    {(m.workflow_state?.open_thread_count ?? 0) > 0 && (
                      <span className="text-blaze-orange-deep">
                        {m.workflow_state?.open_thread_count} open thread
                        {(m.workflow_state?.open_thread_count ?? 0) > 1
                          ? "s"
                          : ""}
                      </span>
                    )}
                    {(m.workflow_state?.stale_capture_count ?? 0) > 0 && (
                      <span className="text-blaze-danger">
                        {m.workflow_state?.stale_capture_count} stale
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-semibold text-blaze-charcoal">{value}</p>
    </div>
  );
}
