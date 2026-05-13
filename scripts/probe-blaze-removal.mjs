// Probe: (1) root `/` redirects to /v2/insight-engine,
//        (2) the theme-check page is gone,
//        (3) no banker-facing "Blaze" wording appears on the main
//            surfaces a banker would visit during the demo.
//
// Allowed exceptions: the word "Blaze" may still appear in HTML class
// attributes (Tailwind tokens like `text-blaze-charcoal`) and CSS
// custom properties — these are never rendered as text. We assert
// against visible text only via `body.innerText`.

import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

let failed = false;

async function check(label, url, mustContain = [], mustNotContain = ["Blaze"]) {
  const resp = await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  const finalUrl = page.url();
  const status = resp?.status() ?? 0;
  const visible = (await page.locator("body").innerText()) ?? "";
  // Tailwind's `uppercase` utility transforms text in the rendered DOM
  // (and Playwright's innerText respects the CSS transform), so we do
  // case-insensitive matching for must-contain. The must-not-contain
  // check is also case-insensitive to catch any "blaze" / "BLAZE" leaks.
  const haystack = visible.toLowerCase();
  const missing = mustContain.filter((s) => !haystack.includes(s.toLowerCase()));
  const leaked = mustNotContain.filter((s) => haystack.includes(s.toLowerCase()));
  const ok = missing.length === 0 && leaked.length === 0;
  console.log(`${ok ? "OK" : "FAIL"} — ${label}`);
  console.log(`     requested: ${url}`);
  console.log(`     final url: ${finalUrl.replace(BASE, "")}   status: ${status}`);
  if (missing.length) console.log(`     missing required text: ${JSON.stringify(missing)}`);
  if (leaked.length) console.log(`     leaked forbidden text: ${JSON.stringify(leaked)}`);
  if (!ok) failed = true;
}

// 1. `/` redirects to /v2/insight-engine, dashboard landing surface
await check(
  "homepage → /v2/insight-engine, no 'Blaze' in visible text",
  "/",
  ["Insight Engine"],
  ["Blaze"],
);

// 2. Theme-check page is gone — should not contain "Blaze token check"
//    (since we redirected /, the theme-check content should be unreachable)
await check(
  "theme-check page content is gone",
  "/",
  [],
  ["Blaze token check", "theme verification", "THEME VERIFICATION"],
);

// 3. v2 workstation header should not say "Blaze"
await check(
  "v2 workstation (Jenny)",
  "/v2/members/jenny",
  ["Growth Conversations"],
  ["Blaze"],
);

// 4. v1 member profile should not say "Blaze"
await check(
  "v1 member profile (Jenny)",
  "/members/jenny",
  ["Member Signals"],
  ["Blaze"],
);

// 5. Insight Engine sub-routes
await check(
  "Insight Engine — Lending product performance",
  "/v2/insight-engine/tracks",
  ["Lending products we offer"],
  ["Blaze"],
);

// 6. Insight Engine dashboard landing
await check(
  "Insight Engine — dashboard landing",
  "/v2/insight-engine",
  [],
  ["Blaze"],
);

await browser.close();
process.exit(failed ? 1 : 0);
