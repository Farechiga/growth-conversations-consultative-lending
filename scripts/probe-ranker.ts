/*
 * Sprint 5a.1 — quick verification probe for Blocks D + E.
 *
 * Runs rankTracksForMember against each demo fixture and prints the
 * ranked Tracks with strength label and supporting-entry counts.
 * Verifies the matrix-Section-4 expected rankings.
 *
 * Usage: pnpm exec tsx scripts/probe-ranker.ts
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { rankTracksForMember } from "../lib/track-ranker";
import { evaluateThreshold } from "../lib/factor-evaluator";

const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
  /^file:/,
  "",
);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath }),
});

async function main() {
  console.log("=== Block D — evaluator unit tests ===\n");
  const meta = { field_name: "seasonal_variance_pct", capture_mode: "numerical" };
  const tests = [
    {
      label: "Numerical >=: 28 vs >= 20",
      cap: { numerical_value: 28, boolean_value: null, qualitative_value: null },
      rule: "seasonal_variance_pct >= 20",
      expected: true,
    },
    {
      label: "Numerical >=: 15 vs >= 20",
      cap: { numerical_value: 15, boolean_value: null, qualitative_value: null },
      rule: "seasonal_variance_pct >= 20",
      expected: false,
    },
    {
      label: "Numerical range: 15 vs >= 10 AND < 20",
      cap: { numerical_value: 15, boolean_value: null, qualitative_value: null },
      rule: "seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20",
      expected: true,
    },
    {
      label: "Numerical range: 25 vs >= 10 AND < 20",
      cap: { numerical_value: 25, boolean_value: null, qualitative_value: null },
      rule: "seasonal_variance_pct >= 10 AND seasonal_variance_pct < 20",
      expected: false,
    },
    {
      label: "Boolean ==: true",
      cap: { numerical_value: null, boolean_value: true, qualitative_value: null },
      rule: "industry_seasonal == true",
      expected: true,
      meta: { field_name: "industry_seasonal", capture_mode: "boolean" },
    },
    {
      label: "Qualitative ==: smooth_seasonal_revenue",
      cap: {
        numerical_value: null,
        boolean_value: null,
        qualitative_value: "smooth_seasonal_revenue",
      },
      rule: "growth_aspiration_tag == smooth_seasonal_revenue",
      expected: true,
      meta: { field_name: "growth_aspiration_tag", capture_mode: "qualitative_select" },
    },
    {
      label: "Qualitative IN: 6_months in [6_months, 12_months]",
      cap: {
        numerical_value: null,
        boolean_value: null,
        qualitative_value: "6_months",
      },
      rule: "decision_timeline IN [6_months, 12_months]",
      expected: true,
      meta: { field_name: "decision_timeline", capture_mode: "qualitative_select" },
    },
    {
      label: "Null rule + non-null capture: presence true",
      cap: { numerical_value: 5, boolean_value: null, qualitative_value: null },
      rule: null,
      expected: true,
    },
    {
      label: "Null rule + null capture: presence false",
      cap: { numerical_value: null, boolean_value: null, qualitative_value: null },
      rule: null,
      expected: false,
    },
  ];

  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    const result = evaluateThreshold(t.cap, t.meta ?? meta, t.rule);
    const ok = result === t.expected;
    if (ok) pass++;
    else fail++;
    console.log(`  ${ok ? "✓" : "✗"} ${t.label} → ${result} (expected ${t.expected})`);
  }
  console.log(`\n  ${pass}/${tests.length} passing\n`);

  console.log("=== Block E — Track ranker per fixture ===\n");
  const slugs = ["jenny", "northland", "cygnus"];
  for (const slug of slugs) {
    const member = await prisma.member.findUnique({ where: { slug } });
    if (!member) {
      console.log(`  ${slug}: member not found`);
      continue;
    }
    const ranked = await rankTracksForMember(prisma, member.id);
    console.log(`\n  ${slug.padEnd(10)} (${ranked.length} Tracks above 2-evidence threshold)`);
    for (const t of ranked) {
      const counts = `[${t.strong_count}s/${t.moderate_count}m${
        t.negative_count > 0 ? `/${t.negative_count}neg` : ""
      }]`;
      console.log(
        `    ${t.strength.padEnd(12)} ${counts.padEnd(14)} ${t.track_name}`,
      );
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
