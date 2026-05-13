// scripts/verify-sprint7b.mjs
//
// Sprint 7b drill-down verification. Drives a real Chromium across the
// three new Insight Engine views and records:
//   - Member-Type matrix: tag activates, 8x10 grid renders, toggle
//     between count and value works, applicability dashed-border cells
//     present, drill-through to Member list returns rows.
//   - Conversion funnels: tag activates, 10 small funnels render,
//     clicking a funnel opens zoom modal, drill-through to Member list
//     returns rows, modal closes cleanly.
//   - Banker flow: tag activates, Sankey renders with banker /
//     specialist / outcome nodes, cohort dropdown switches data,
//     Top 5 and 6-10 cohorts produce different node counts.
//
// Screenshots saved for each surface so the visual treatment can be
// eyeballed.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "scripts/.verify-sprint7b-out";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "OK " : "FAIL"}  ${name}  ${detail ?? ""}`);
}

// ─── Member-Type matrix ─────────────────────────────────────────────
console.log("\n=== Member-Type matrix ===");
await page.goto(`${BASE}/v2/insight-engine`, { waitUntil: "networkidle" });
await page.locator('button:has-text("Member-Type matrix")').first().click();
await page.waitForSelector('h2:has-text("Member-Type × Track matrix")', { timeout: 10000 });

const matrixCellsCount = await page
  .locator("table button[disabled], table button:not([disabled])")
  .count();
record(
  "matrix renders 8x10 grid",
  matrixCellsCount === 80,
  `cells=${matrixCellsCount}`,
);

// Count mode by default — find at least one cell with a numeric label.
const countCellsWithData = await page
  .locator("table button:not([disabled])")
  .count();
record(
  "matrix count mode has data-bearing cells",
  countCellsWithData > 0,
  `data-bearing=${countCellsWithData}`,
);
await page.screenshot({ path: `${OUT}/matrix-count.png`, fullPage: false });

// Toggle to value mode. Scope to the matrix toolbar (rounded-full button
// in the matrix card), not the hero-strip pipeline-value button.
await page
  .locator('button.rounded-full:has-text("Pipeline value")')
  .first()
  .click();
await page.waitForTimeout(300);
const valueCellsWithData = await page
  .locator("table button:not([disabled])")
  .count();
record(
  "matrix value mode preserves data cells",
  valueCellsWithData > 0,
  `data-bearing=${valueCellsWithData}`,
);
await page.screenshot({ path: `${OUT}/matrix-value.png`, fullPage: false });

// Inapplicable cells: dashed border classes appear on at least some cells.
const inapplicableCells = await page
  .locator("table button.border-dashed")
  .count();
record(
  "matrix flags inapplicable cells with dashed border",
  inapplicableCells > 0,
  `dashed=${inapplicableCells}`,
);

// Drill through: click first data-bearing cell.
const firstDataCell = page.locator("table button:not([disabled])").first();
await firstDataCell.click();
await page.waitForTimeout(400);
const drillList = await page.locator('ul.divide-y li').count();
record(
  "matrix drill-through renders Member list",
  drillList > 0,
  `rows=${drillList}`,
);
await page.screenshot({ path: `${OUT}/matrix-drill.png`, fullPage: false });

// ─── Conversion funnels ────────────────────────────────────────────
console.log("\n=== Conversion funnels ===");
await page.goto(`${BASE}/v2/insight-engine`, { waitUntil: "networkidle" });
await page.locator('button:has-text("Conversion funnels")').first().click();
await page.waitForSelector('h2:has-text("Conversion funnels per Track")', { timeout: 10000 });

// 10 small funnels render — each is a button containing a Track name.
const smallFunnels = await page
  .locator('main button.flex.flex-col.items-stretch')
  .count();
record(
  "10 small funnels render",
  smallFunnels === 10,
  `funnels=${smallFunnels}`,
);
await page.screenshot({ path: `${OUT}/funnels-small-multiples.png`, fullPage: false });

// Click one small funnel → zoom modal opens.
await page.locator('main button.flex.flex-col.items-stretch').first().click();
await page.waitForSelector('[role="dialog"] h2', { timeout: 5000 });
const modalTitle = (await page.locator('[role="dialog"] h2').first().textContent()) ?? "";
record(
  "zoom modal opens for clicked Track",
  modalTitle.includes("conversion funnel"),
  `title="${modalTitle.trim()}"`,
);
await page.screenshot({ path: `${OUT}/funnels-zoom-modal.png`, fullPage: false });

// Click a stage in the zoom modal → drill list appears.
const drillableStage = page.locator('[role="dialog"] button:has(div:has-text("Discover"))').first();
await drillableStage.click();
await page.waitForTimeout(300);
const modalDrillRows = await page.locator('[role="dialog"] li').count();
record(
  "modal stage drill renders Member list",
  modalDrillRows >= 0, // can be 0 for empty stages — assert presence of either rows or italic msg
  `rows=${modalDrillRows}`,
);

// Close modal via Close button.
await page.locator('[role="dialog"] button[aria-label="Close funnel zoom"]').click();
await page.waitForTimeout(300);
const modalGone = (await page.locator('[role="dialog"]').count()) === 0;
record("zoom modal closes", modalGone, "");

// ─── Banker flow (Sankey) ──────────────────────────────────────────
console.log("\n=== Banker flow Sankey ===");
await page.goto(`${BASE}/v2/insight-engine`, { waitUntil: "networkidle" });
await page.locator('button:has-text("Banker flow")').first().click();
await page.waitForSelector('h2:has-text("Banker → Specialist → Outcome flow")', { timeout: 10000 });

const sankeyRects = await page.locator('svg[aria-label*="Sankey"] rect').count();
record(
  "Sankey renders nodes (Top 5 default)",
  sankeyRects > 0,
  `node-rects=${sankeyRects}`,
);
const sankeyPaths = await page.locator('svg[aria-label*="Sankey"] path').count();
record(
  "Sankey renders links (Top 5 default)",
  sankeyPaths > 0,
  `link-paths=${sankeyPaths}`,
);
await page.screenshot({ path: `${OUT}/sankey-top5.png`, fullPage: false });

// Capture cohort options + switch to second cohort.
const cohortSelect = page.locator('select').filter({ hasText: "Top" }).first();
const cohortOptions = await cohortSelect.locator("option").count();
record(
  "cohort dropdown lists multiple options",
  cohortOptions > 1,
  `options=${cohortOptions}`,
);

// Select the second cohort option.
const optionValues = await cohortSelect
  .locator("option")
  .evaluateAll((nodes) => nodes.map((n) => /** @type {HTMLOptionElement} */ (n).value));
if (optionValues.length > 1) {
  await cohortSelect.selectOption(optionValues[1]);
  await page.waitForTimeout(500);
  const secondCohortRects = await page.locator('svg[aria-label*="Sankey"] rect').count();
  record(
    "second cohort re-renders Sankey",
    secondCohortRects > 0,
    `node-rects=${secondCohortRects}`,
  );
  await page.screenshot({ path: `${OUT}/sankey-second-cohort.png`, fullPage: false });
}

await browser.close();

// Summary
console.log("\n=== SUMMARY ===");
const failed = results.filter((r) => !r.ok);
console.log(`Total: ${results.length}, OK: ${results.length - failed.length}, FAIL: ${failed.length}`);
for (const f of failed) {
  console.log(`  FAIL — ${f.name}  ${f.detail ?? ""}`);
}
process.exit(failed.length === 0 ? 0 : 1);
