// Probe: navigate to the Member-Type Matrix view in the Insight Engine
// dashboard and assert the new heading + subheading are present and the
// old wording is gone.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/v2/insight-engine?view=member-type-matrix`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(500);

const body = (await page.locator("body").textContent()) ?? "";

const newHeading = "Lending product overview by member type";
const newSubheading = "Number of members exploring each lending product";
const oldHeading = "Member-Type × Track matrix";
const oldSubheading = "Cell intensity = relative magnitude";

const checks = [
  { name: "new heading present", pass: body.includes(newHeading) },
  { name: "new subheading present", pass: body.includes(newSubheading) },
  { name: "old heading absent", pass: !body.includes(oldHeading) },
  { name: "old subheading absent", pass: !body.includes(oldSubheading) },
];

for (const c of checks) {
  console.log(`  ${c.pass ? "OK" : "FAIL"} — ${c.name}`);
}

await browser.close();
process.exit(checks.every((c) => c.pass) ? 0 : 1);
