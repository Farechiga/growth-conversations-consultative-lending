// scripts/verify-artifacts.mjs
//
// End-to-end verification that switching the Lending Product dropdown
// on each fixture produces a clickable artifact tile that opens a
// visualization dialog. Drives a real headless Chromium so what we
// record is what a banker would actually see — not a TypeScript signal.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const FIXTURES = ["jenny", "northland", "cygnus", "riverside"];
const OUT = "scripts/.verify-artifacts-out";
mkdirSync(OUT, { recursive: true });

function pad(s, n) {
  s = String(s ?? "");
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await ctx.newPage();

const results = [];

for (const slug of FIXTURES) {
  console.log(`\n=== ${slug} ===`);
  await page.goto(`${BASE}/v2/members/${slug}`, { waitUntil: "networkidle" });
  // The lending product section sits at the top of the sidebar.
  // Wait for either the dropdown trigger (multi-track) or the plain
  // static text fallback (single-track) to appear.
  await page.waitForSelector(
    'p:has-text("lending product"), [aria-haspopup="listbox"]',
    { timeout: 15000 },
  );

  // Resolve the lending-product SidebarSection wrapper so we scope
  // subsequent queries (the dropdown options are inside it).
  const lendingSection = page
    .locator('div:has(> p:text-is("lending product"))')
    .first();

  const dropdownTrigger = lendingSection.locator('button[aria-haspopup="listbox"]');
  const isMultiTrack = (await dropdownTrigger.count()) > 0;

  let trackNames = [];
  if (!isMultiTrack) {
    // Single-track fixture (riverside). The current Track name is the
    // bold paragraph inside the lending product section.
    const onlyName = await lendingSection
      .locator("p.text-sm.font-medium")
      .first()
      .textContent();
    trackNames = [onlyName?.trim() ?? "(unknown)"];
  } else {
    // Open dropdown, expand to full list if a "see all N" affordance
    // exists, then enumerate option buttons.
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
    // Collapse the dropdown before the per-track loop opens it again.
    await dropdownTrigger.click();
    await page.waitForTimeout(100);
  }

  console.log(`  ${trackNames.length} tracks: ${trackNames.join(" | ")}`);

  for (let i = 0; i < trackNames.length; i++) {
    const trackName = trackNames[i];

    if (isMultiTrack) {
      // Open dropdown and select this option by index.
      await dropdownTrigger.click();
      await page.waitForTimeout(150);
      const seeAll = lendingSection.locator('button:has-text("see all")');
      if ((await seeAll.count()) > 0) {
        await seeAll.first().click();
        await page.waitForTimeout(150);
      }
      const options = lendingSection.locator("ul > li > button");
      await options.nth(i).click();
      // Switcher closes itself on select. Allow the sidebar to repaint.
      await page.waitForTimeout(400);
    }

    // Look for the ARTIFACTS SidebarSection (uppercase via CSS, lowercase
    // in the DOM).
    const artifactsSection = page
      .locator('div:has(> p:text-is("artifacts"))')
      .first();
    const sectionPresent = (await artifactsSection.count()) > 0;

    let artifactTitle = null;
    let dialogOpened = false;
    let dialogTitle = null;

    if (sectionPresent) {
      // Each tile is a <button> whose first <p> is the title and which
      // also contains the "view ↗" affordance.
      const tile = artifactsSection.locator('button:has(p:has-text("view"))').first();
      if ((await tile.count()) > 0) {
        artifactTitle = (await tile.locator("p").first().textContent())?.trim() ?? null;
        await tile.click();
        await page.waitForTimeout(400);
        const dialog = page.locator('[role="dialog"]');
        dialogOpened = (await dialog.count()) > 0;
        if (dialogOpened) {
          dialogTitle = (
            await dialog.locator("h2").first().textContent()
          )?.trim() ?? null;
          // Close so we can iterate the next Track cleanly.
          await dialog
            .locator('button:has-text("Close")')
            .first()
            .click()
            .catch(() => {});
          await page.waitForTimeout(150);
        }
      }
    }

    results.push({
      slug,
      track: trackName,
      sectionPresent,
      artifactTitle,
      dialogOpened,
      dialogTitle,
    });
    console.log(
      `  - ${pad(trackName, 38)}  section=${sectionPresent ? "Y" : "N"}  title=${pad(
        artifactTitle ?? "—",
        40,
      )}  dialog=${dialogOpened ? "Y" : "N"}`,
    );
  }

  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });
}

await browser.close();

console.log("\n\n=== SUMMARY TABLE ===\n");
console.log(
  pad("fixture", 11) +
    " | " +
    pad("track", 38) +
    " | section | " +
    pad("artifact title", 40) +
    " | dialog | dialog title",
);
console.log("-".repeat(140));
for (const r of results) {
  console.log(
    pad(r.slug, 11) +
      " | " +
      pad(r.track, 38) +
      " |    " +
      (r.sectionPresent ? "Y" : "N") +
      "    | " +
      pad(r.artifactTitle ?? "—", 40) +
      " |   " +
      (r.dialogOpened ? "Y" : "N") +
      "    | " +
      (r.dialogTitle ?? "—"),
  );
}

const broken = results.filter(
  (r) => !r.sectionPresent || !r.artifactTitle || !r.dialogOpened,
);
console.log(`\nTotal rows: ${results.length}`);
console.log(`Rows with missing artifact / no dialog: ${broken.length}`);
if (broken.length > 0) {
  console.log("\nBroken:");
  for (const r of broken) {
    console.log(
      `  ${r.slug} / ${r.track}  →  section=${r.sectionPresent}  title=${r.artifactTitle}  dialog=${r.dialogOpened}`,
    );
  }
}
process.exit(broken.length > 0 ? 1 : 0);
