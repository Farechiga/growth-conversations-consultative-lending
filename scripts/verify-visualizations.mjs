// scripts/verify-visualizations.mjs
//
// Sprint 9 Patch A+B verification. Opens each Track's artifact dialog
// on Cygnus (which has overrides for all 10 templates), screenshots
// the rendered visualization, and scans the dialog DOM for:
//   - Unsubstituted parameter placeholders like "[Term (years)]" or
//     "[Annual growth rate with loan]"
//   - Stale FACTOR-NNN labels in user-facing text
//
// Cygnus is the demo-rich fixture; if its dialogs render cleanly, the
// fall-through DEFAULT_TEMPLATE_PARAMS for other fixtures will too
// (we additionally spot-check jenny and northland for one Track each).

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "scripts/.verify-visualizations-out";
mkdirSync(OUT, { recursive: true });

const FIXTURES_TO_DRIVE = [
  // (slug, label) — cygnus drives the full 10-Track sweep; others
  // spot-check fall-through fixture overrides.
  { slug: "cygnus", driveAll: true },
  { slug: "jenny", driveAll: true },
  { slug: "northland", driveAll: true },
];

// Placeholder patterns we explicitly do not want to leak into the
// rendered dialog. `[<Label>]` is the resolveTemplateString fallback
// for unmatched keys; FACTOR-NNN should never appear in user-facing
// text (it's a code-internal identifier).
const LEAK_PATTERNS = [
  /\[Annual growth rate with loan\]/g,
  /\[Term \(years\)\]/g,
  /\[Year 1 revenue uplift\]/g,
  /\[Organic growth rate \(no loan\)\]/g,
  /\[Use of proceeds\]/g,
  /\[Current annual revenue\]/g,
  /\[Loan amount\]/g,
  /\[Improvement cost\]/g,
  /\[PACE term \(years\)\]/g,
  /\[Current monthly energy cost\]/g,
  /\[Monthly energy savings after improvements\]/g,
  /\[Opportunity type\]/g,
  /\[Brief opportunity description\]/g,
  /\[Estimated opportunity value\]/g,
  /\[Monthly rental income\]/g,
  /\[Monthly operating expenses\]/g,
  /\bFACTOR-\d{3}\b/g,
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

const results = [];

for (const { slug } of FIXTURES_TO_DRIVE) {
  console.log(`\n=== ${slug} ===`);
  await page.goto(`${BASE}/v2/members/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector(
    'p:has-text("lending product"), [aria-haspopup="listbox"]',
    { timeout: 15000 },
  );

  const lendingSection = page
    .locator('div:has(> p:text-is("lending product"))')
    .first();
  const dropdownTrigger = lendingSection.locator('button[aria-haspopup="listbox"]');
  const isMultiTrack = (await dropdownTrigger.count()) > 0;

  let trackNames = [];
  if (!isMultiTrack) {
    const onlyName = await lendingSection
      .locator("p.text-sm.font-medium")
      .first()
      .textContent();
    trackNames = [onlyName?.trim() ?? "(unknown)"];
  } else {
    await dropdownTrigger.click();
    await page.waitForTimeout(150);
    const seeAll = lendingSection.locator('button:has-text("see all")');
    if ((await seeAll.count()) > 0) {
      await seeAll.first().click();
      await page.waitForTimeout(150);
    }
    const options = lendingSection.locator("ul > li > button");
    const n = await options.count();
    for (let i = 0; i < n; i++) {
      const name = (await options.nth(i).locator("p").first().textContent()) ?? "";
      trackNames.push(name.trim());
    }
    await dropdownTrigger.click();
    await page.waitForTimeout(100);
  }

  for (let i = 0; i < trackNames.length; i++) {
    const trackName = trackNames[i];

    if (isMultiTrack) {
      await dropdownTrigger.click();
      await page.waitForTimeout(150);
      const seeAll = lendingSection.locator('button:has-text("see all")');
      if ((await seeAll.count()) > 0) {
        await seeAll.first().click();
        await page.waitForTimeout(150);
      }
      const options = lendingSection.locator("ul > li > button");
      await options.nth(i).click();
      await page.waitForTimeout(400);
    }

    const artifactsSection = page
      .locator('div:has(> p:text-is("artifacts"))')
      .first();
    const sectionPresent = (await artifactsSection.count()) > 0;
    if (!sectionPresent) {
      console.log(`  - ${trackName}: NO TILE`);
      results.push({ slug, track: trackName, status: "no-tile", leaks: [] });
      continue;
    }

    const tile = artifactsSection.locator('button:has(p:has-text("view"))').first();
    if ((await tile.count()) === 0) {
      console.log(`  - ${trackName}: NO TILE BUTTON`);
      results.push({ slug, track: trackName, status: "no-tile-button", leaks: [] });
      continue;
    }
    const artifactTitle = (await tile.locator("p").first().textContent())?.trim() ?? null;
    await tile.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    if ((await dialog.count()) === 0) {
      console.log(`  - ${trackName}: NO DIALOG`);
      results.push({ slug, track: trackName, status: "no-dialog", leaks: [] });
      continue;
    }

    const dialogText = (await dialog.textContent()) ?? "";
    const leaks = [];
    for (const pat of LEAK_PATTERNS) {
      const matches = dialogText.match(pat);
      if (matches) {
        for (const m of matches) if (!leaks.includes(m)) leaks.push(m);
      }
    }

    const dialogTitle = (await dialog.locator("h2").first().textContent())?.trim() ?? null;
    const slugName = trackName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    const path = `${OUT}/${slug}--${slugName}.png`;
    // Sprint 9 Patch F Block 7 — full-page capture instead of
    // `dialog.screenshot()`. The viewport-bounded capture cropped
    // anything below the scroll fold (e.g., SBA 504's structure
    // comparison sat below the visible viewport and was missing from
    // the saved PNG even though it rendered correctly). Full-page
    // capture grabs the whole rendered surface including the dialog
    // backdrop, so composite renders are fully captured.
    await page.screenshot({ path, fullPage: true });

    console.log(
      `  - ${trackName}: title="${dialogTitle}"  leaks=${leaks.length ? leaks.join(", ") : "0"}  screenshot=${path}`,
    );
    results.push({
      slug,
      track: trackName,
      artifactTitle,
      dialogTitle,
      leaks,
      screenshot: path,
      status: leaks.length === 0 ? "ok" : "leaks",
    });

    await dialog
      .locator('button:has-text("Close")')
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(150);
  }
}

await browser.close();

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));

console.log("\n\n=== SUMMARY ===\n");
const broken = results.filter((r) => r.status !== "ok");
console.log(`Total rows: ${results.length}`);
console.log(`OK: ${results.length - broken.length}`);
console.log(`Broken: ${broken.length}`);
for (const r of broken) {
  console.log(
    `  ${r.slug} / ${r.track}  →  status=${r.status}  leaks=${(r.leaks ?? []).join(", ") || "—"}`,
  );
}
process.exit(broken.length === 0 ? 0 : 1);
