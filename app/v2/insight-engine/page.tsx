/*
 * Sprint 7a — Insight Engine dashboard (EVP-facing).
 *
 * Replaces the prior 4-card landing page with the synthetic-data-driven
 * dashboard. Hero metrics + filter tags + drill-down canvas + featured
 * deal tile. URL state drives filter / view selection (shareable links).
 *
 * Existing 4 portfolio routes (`/v2/insight-engine/tracks`, `portfolio`,
 * `coverage`, `stage-skip`) continue to work and are reachable from the
 * "Legacy portfolio views" footer below. Deprecated in Sprint 7b once
 * the dashboard fully absorbs their roles.
 */

import Link from "next/link";
import { Suspense } from "react";
import { getSyntheticDataset } from "@/lib/synthetic-data/generator";
import { DashboardClient } from "./dashboard/components/DashboardClient";

export const dynamic = "force-dynamic";

const LEGACY_LINKS: Array<{ href: string; title: string }> = [
  { href: "/v2/insight-engine/tracks", title: "Lending product performance" },
  { href: "/v2/insight-engine/portfolio", title: "Member portfolio" },
  { href: "/v2/insight-engine/coverage", title: "Open threads" },
  { href: "/v2/insight-engine/stage-skip", title: "Members who skipped earlier work" },
];

export default function InsightEngineDashboard() {
  const dataset = getSyntheticDataset();
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-blaze-rule px-8 py-5">
        <h1 className="text-2xl font-semibold text-blaze-charcoal">
          <span className="text-blaze-orange-deep">Growth</span> Opportunities
        </h1>
      </div>
      <Suspense fallback={<div className="px-8 py-6 text-sm text-blaze-grey-body">Loading dashboard…</div>}>
        <DashboardClient dataset={dataset} />
      </Suspense>
      <footer className="border-t border-blaze-rule bg-blaze-cream/20 px-8 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
          Legacy portfolio views (deprecated in Sprint 7b)
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-blaze-grey-body">
          {LEGACY_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-blaze-orange-deep hover:underline">
                {l.title} ↗
              </Link>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
