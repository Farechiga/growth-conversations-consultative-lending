/*
 * Sprint 5b.2 Block E — Stage-skip surface.
 *
 * Members with later-objective evidence captured (Consult / Navigate)
 * but missing earlier-objective required evidence (Discover / Measure).
 * Senior lender uses this surface for coaching: bankers who skip
 * Discover/Measure work and jump to Consult/Navigate may be missing
 * consultative depth.
 *
 * Default sort: severity descending (count of skipped objectives).
 */

import "dotenv/config";
import Link from "next/link";

export const dynamic = "force-dynamic";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import { stageSkipData } from "@/lib/portfolio-queries";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

const OBJECTIVE_LABELS: Record<string, string> = {
  discover: "Discover",
  measure: "Measure",
  consult: "Consult",
  navigate: "Navigate",
};

function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function StageSkipPage() {
  const prisma = getPrisma();
  const rows = await stageSkipData(prisma);
  await prisma.$disconnect();

  const total = rows.length;
  const sev_1 = rows.filter((r) => r.skipped_objectives.length === 1).length;
  const sev_2 = rows.filter((r) => r.skipped_objectives.length === 2).length;
  const sev_3plus = rows.filter((r) => r.skipped_objectives.length >= 3).length;
  const skipped_discover = rows.filter((r) =>
    r.skipped_objectives.includes("discover"),
  ).length;
  const skipped_measure = rows.filter((r) =>
    r.skipped_objectives.includes("measure"),
  ).length;
  const skipped_both = rows.filter(
    (r) =>
      r.skipped_objectives.includes("discover") &&
      r.skipped_objectives.includes("measure"),
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-blaze-charcoal">
          Members who skipped earlier work
        </h1>
        <p className="mt-2 text-sm text-blaze-grey-body">
          Members with Consult or Navigate evidence but missing Discover or
          Measure required evidence. Severity is the count of skipped
          objectives. Coaching surface for senior lenders.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-4 rounded border border-blaze-rule bg-white p-5 md:grid-cols-4">
        <Stat label="Stage-skipping Members" value={total} />
        <Stat label="1 objective skipped" value={sev_1} />
        <Stat label="2 objectives skipped" value={sev_2} />
        <Stat label="3+ objectives skipped" value={sev_3plus} />
      </section>
      <section className="rounded border border-blaze-rule bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
          Distribution by skipped objective
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-[12px] text-blaze-grey-body md:grid-cols-3">
          <li className="flex justify-between">
            <span>Discover skipped</span>
            <span className="font-medium text-blaze-charcoal">{skipped_discover}</span>
          </li>
          <li className="flex justify-between">
            <span>Measure skipped</span>
            <span className="font-medium text-blaze-charcoal">{skipped_measure}</span>
          </li>
          <li className="flex justify-between">
            <span>Both Discover + Measure</span>
            <span className="font-medium text-blaze-charcoal">{skipped_both}</span>
          </li>
        </ul>
      </section>
      <section className="overflow-hidden rounded border border-blaze-rule bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-sm italic text-blaze-grey-soft">
            No stage-skipping Members across the roster. Bankers are doing
            consultative depth at all stages.
          </p>
        ) : (
          <ul className="divide-y divide-blaze-rule">
            {rows.map((r) => (
              <li key={r.member_id}>
                <Link
                  href={`/v2/members/${r.member_slug}`}
                  className="block px-5 py-4 transition-colors hover:bg-blaze-cream/30"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-base font-medium text-blaze-charcoal">
                      {r.member_name}
                      <span className="ml-2 text-[11px] font-normal text-blaze-grey-soft">
                        {r.member_type_name}
                        {r.current_track_name && ` · ${r.current_track_name}`}
                      </span>
                    </p>
                    <p className="text-[11px] text-blaze-grey-body">
                      Severity:{" "}
                      <strong className="font-medium text-blaze-charcoal">
                        {r.skipped_objectives.length} objective
                        {r.skipped_objectives.length > 1 ? "s" : ""} skipped
                      </strong>
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-blaze-grey-soft">
                    Missing:{" "}
                    {r.skipped_objectives
                      .map((o) => OBJECTIVE_LABELS[o] ?? o)
                      .join(" + ")}
                    {r.most_recent_later_evidence_at &&
                      ` · later evidence captured ${fmtMonthDay(
                        r.most_recent_later_evidence_at,
                      )}`}
                    {r.most_recent_later_evidence_kind &&
                      ` (${r.most_recent_later_evidence_kind})`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
