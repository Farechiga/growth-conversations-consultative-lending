// Probe: assert the new "Dashboards ↗" link is present and points to
// /v2/insight-engine on both the v2 workstation header and the v1
// Member profile header.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

const surfaces = [
  { name: "v2 workstation (Jenny)", url: `${BASE}/v2/members/jenny` },
  { name: "v1 member profile (Jenny)", url: `${BASE}/members/jenny` },
];

let failed = false;
for (const s of surfaces) {
  await page.goto(s.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const link = page.locator('a:has-text("Dashboards")').first();
  const count = await link.count();
  const href = count > 0 ? await link.getAttribute("href") : null;
  const ok = count >= 1 && href === "/v2/insight-engine";
  console.log(`${s.name}`);
  console.log(`  link count: ${count}   href: ${href}   ok: ${ok}`);
  if (!ok) failed = true;
}

await browser.close();
process.exit(failed ? 1 : 0);
