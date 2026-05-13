// Quick diagnostic: open Cygnus SBA 504 dialog and check whether BOTH
// the roadmap and the structure comparison render.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "scripts/.probe-sba504-out";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/v2/members/cygnus", { waitUntil: "networkidle" });
await page.waitForSelector('[aria-haspopup="listbox"]', { timeout: 15000 });

// SBA 504 is the default Track for Cygnus — its tile should already be visible.
const tile = page
  .locator('div:has(> p:text-is("artifacts"))')
  .locator('button:has(p:has-text("view"))')
  .first();
await tile.click();
await page.waitForTimeout(800);

const dialog = page.locator('[role="dialog"]');
const dialogText = (await dialog.textContent()) ?? "";
const hasRoadmap =
  dialogText.includes("Initial conversation") ||
  dialogText.includes("CDC partner introduction");
const hasStructureComparison =
  dialogText.includes("Cash at closing") ||
  dialogText.includes("10-year cumulative interest") ||
  dialogText.includes("SBA 504 saves");

console.log("Dialog title:", await dialog.locator("h2").first().textContent());
console.log("Has roadmap (stage list):", hasRoadmap);
console.log("Has structure comparison chart:", hasStructureComparison);
console.log(
  "Dialog text length:",
  dialogText.length,
  "chars (probe phrases below)",
);
for (const phrase of [
  "Initial conversation",
  "CDC partner introduction",
  "Cash at closing",
  "10-year cumulative interest",
  "SBA 504 saves",
]) {
  console.log(`  "${phrase}": ${dialogText.includes(phrase)}`);
}

// Save a full-element screenshot. Playwright's `element.screenshot`
// captures the full scrollable area; use full-page mode as a backup.
await dialog.screenshot({ path: `${OUT}/cygnus-sba504-dialog.png` });
await page.screenshot({
  path: `${OUT}/cygnus-sba504-fullpage.png`,
  fullPage: true,
});

await browser.close();
console.log(`\nScreenshots: ${OUT}/`);
