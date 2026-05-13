// Probe: open the Business Visa artifact dialog on Jenny and assert
// the title "Business credit card limit and use plan" appears exactly
// once inside the dialog (was rendering twice — once in the dialog
// header, once inside an inner bordered box that wrapped the
// visualization).

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/v2/members/jenny`, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-haspopup="listbox"]', { timeout: 15000 });

// Open the lending-product dropdown and select Business Visa.
const lendingSection = page
  .locator('div:has(> p:text-is("lending product"))')
  .first();
const dropdown = lendingSection.locator('button[aria-haspopup="listbox"]');
await dropdown.click();
await page.waitForTimeout(200);
const seeAll = lendingSection.locator('button:has-text("see all")');
if ((await seeAll.count()) > 0) {
  await seeAll.first().click();
  await page.waitForTimeout(200);
}
await lendingSection
  .locator('ul > li > button:has-text("Business Visa")')
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

const dialogText = (await dialog.innerText()) || "";
const title = "Business credit card limit and use plan";
// Count non-overlapping occurrences.
const occurrences = dialogText.split(title).length - 1;

console.log(`Dialog text contains the title "${title}" × ${occurrences}`);
console.log(`  expected: 1   actual: ${occurrences}`);

await browser.close();
process.exit(occurrences === 1 ? 0 : 1);
