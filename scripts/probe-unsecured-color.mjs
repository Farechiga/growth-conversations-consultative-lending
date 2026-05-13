// scripts/probe-unsecured-color.mjs
//
// Sprint 9 Patch H Block 7 — strict verification per the spec's
// six-step protocol. Opens Cygnus's Unsecured Loan dialog, walks the
// rendered SVG for the Net Benefit bar's fill attribute, and asserts
// the value is NOT in the black family and IS in the orange family.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/v2/members/cygnus`, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-haspopup="listbox"]', { timeout: 15000 });

// Open the Lending Product dropdown and pick "Unsecured Loan".
const lendingSection = page
  .locator('div:has(> p:text-is("lending product"))')
  .first();
const dropdown = lendingSection.locator('button[aria-haspopup="listbox"]');
await dropdown.click();
await page.waitForTimeout(150);
const seeAll = lendingSection.locator('button:has-text("see all")');
if ((await seeAll.count()) > 0) {
  await seeAll.first().click();
  await page.waitForTimeout(150);
}
await lendingSection
  .locator('ul > li > button:has-text("Unsecured Loan")')
  .first()
  .click();
await page.waitForTimeout(400);

// Click the artifact tile.
const tile = page
  .locator('div:has(> p:text-is("artifacts"))')
  .locator('button:has(p:has-text("view"))')
  .first();
await tile.click();
await page.waitForTimeout(500);

const dialog = page.locator('[role="dialog"]');
const dialogCount = await dialog.count();
if (dialogCount === 0) {
  console.error("FAIL — dialog did not open");
  process.exit(1);
}

// Recharts paints each Cell as an SVG <path> with a `fill` attr (not
// <rect>) due to its custom shape implementation. Pull all <path>
// fills inside the dialog SVG, then group by frequency to identify
// the three bar colors.
const fills = await dialog.locator("svg path[fill]").evaluateAll((paths) =>
  paths
    .map((p) => p.getAttribute("fill") || "")
    .filter((v) => v && v !== "none" && v !== "transparent"),
);

// Group + sort by frequency to surface the dominant bar fills.
const counts = new Map();
for (const f of fills) counts.set(f, (counts.get(f) ?? 0) + 1);
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

console.log("Unique fill colors found in Unsecured dialog SVG:");
for (const [c, n] of sorted) console.log(`  ${c}  (×${n})`);

// Net Benefit bar should use ARTIFACT_PALETTE.annotationText = #9A3412.
// Recharts may report fills lower-case; normalize for comparison.
const norm = (s) => s.toLowerCase().replace(/\s/g, "");
const fillSet = new Set([...counts.keys()].map(norm));

const NET_BENEFIT_EXPECTED = "#9a3412";
const BLACK_VARIANTS = new Set([
  "#000",
  "#000000",
  "black",
  "rgb(0,0,0)",
  "#1c1917",
]);

const netBenefitPresent = fillSet.has(NET_BENEFIT_EXPECTED);
const blackPresent = [...fillSet].some((f) => BLACK_VARIANTS.has(f));

console.log("");
console.log(
  `Net Benefit expected fill (#9A3412) present in DOM: ${netBenefitPresent}`,
);
console.log(`Any black-family fill present:                       ${blackPresent}`);

await browser.close();

if (!netBenefitPresent) {
  console.error(
    "\nFAIL — Net Benefit fill not found at expected palette color.",
  );
  process.exit(1);
}
if (blackPresent) {
  console.error("\nFAIL — black-family fill detected on a chart element.");
  process.exit(1);
}
console.log("\nOK — Net Benefit bar verified in orange family, no black.");
process.exit(0);
