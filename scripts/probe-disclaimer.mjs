// Quick probe: verify the compliance disclaimer banner is rendering
// the new copy.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/v2/members/jenny", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Find any text node that matches either old or new wording.
const bodyText = await page.locator("body").textContent();
const hasNew = bodyText?.includes("Growth Conversations captures consultative notes from members") ?? false;
const hasOld = bodyText?.includes("Member Signals captures consultative notes for growth conversations") ?? false;

console.log("Disclaimer copy in rendered DOM:");
console.log(`  new wording present: ${hasNew}`);
console.log(`  old wording present: ${hasOld}`);

await browser.close();
process.exit(hasNew && !hasOld ? 0 : 1);
