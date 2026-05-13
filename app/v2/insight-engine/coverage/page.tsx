/*
 * Sprint 5b.2 Block D — Coverage and indecision surface.
 *
 * Open Indecision threads at portfolio scale. Default sort: longest-
 * open first. Heuristic per Sprint 5b.1 Block G: "open" = no subsequent
 * Reaction exists for the same Member after the Indecision's
 * captured_at.
 */

import "dotenv/config";
import Link from "next/link";

export const dynamic = "force-dynamic";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "@/lib/db-path";
import { openIndecisionData } from "@/lib/portfolio-queries";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

export default async function CoveragePage() {
  const prisma = getPrisma();
  const rows = await openIndecisionData(prisma);
  await prisma.$disconnect();

  const total = rows.length;
  const tier = (lo: number, hi: number) =>
    rows.filter((r) => r.days_open >= lo && (hi === Infinity || r.days_open <= hi))
      .length;
  const tier_lt30 = tier(0, 29);
  const tier_30_90 = tier(30, 90);
  const tier_gt90 = tier(91, Infinity);

  // Tag distribution.
  const tagDist = new Map<string, number>();
  for (const r of rows) {
    const tag = r.topic_canonical_tag.split(".").slice(1).join(" / ") || "(other)";
    tagDist.set(tag, (tagDist.get(tag) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-blaze-charcoal">
          Open threads
        </h1>
        <p className="mt-2 text-sm text-blaze-grey-body">
          Open Indecision threads across the roster. An Indecision is open if
          no subsequent Reaction exists for the Member.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-4 rounded border border-blaze-rule bg-white p-5 md:grid-cols-4">
        <Stat label="Open threads" value={total} />
        <Stat label="< 30d open" value={tier_lt30} />
        <Stat label="30–90d open" value={tier_30_90} />
        <Stat label="> 90d open" value={tier_gt90} />
      </section>
      {tagDist.size > 0 && (
        <section className="rounded border border-blaze-rule bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-body">
            What&rsquo;s holding things up
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-[12px] text-blaze-grey-body md:grid-cols-2">
            {Array.from(tagDist.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => (
                <li key={tag} className="flex justify-between">
                  <span>{tag}</span>
                  <span className="font-medium text-blaze-charcoal">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
      <section className="overflow-hidden rounded border border-blaze-rule bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-sm italic text-blaze-grey-soft">
            No open Indecision threads across the roster. Bankers are caught up.
          </p>
        ) : (
          <ul className="divide-y divide-blaze-rule">
            {rows.map((r) => (
              <li key={r.signal_id}>
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
                      <strong className="font-medium text-blaze-charcoal">
                        {r.days_open}d open
                      </strong>
                      {r.days_since_last_touch !== null &&
                        ` · last touch ${r.days_since_last_touch}d ago`}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.04em] text-blaze-grey-soft">
                    Indecision · {r.topic_display_name}
                  </p>
                  {r.member_quote && (
                    <blockquote className="mt-2 border-l-[2px] border-blaze-orange py-0.5 pl-3 text-sm italic text-blaze-grey-body">
                      &ldquo;{r.member_quote}&rdquo;
                    </blockquote>
                  )}
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
