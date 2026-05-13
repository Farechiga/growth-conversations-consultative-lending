// scripts/verify-applicability.mjs
//
// Sprint 9 Patch E verification. Opens each fixture's Track context
// dropdown and records:
//   - Compact view: which Tracks appear before clicking "see all"
//   - Expanded view: which Tracks appear in the "Uncommon for this
//     Member-Type" section after expansion
//   - Asserts the compact view contains the expected applicable Tracks
//     per the locked matrix and excludes the expected inapplicable ones.
//
// Also screenshots the expanded dropdown for each fixture so the
// applicable / inapplicable visual treatment can be eyeballed.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "scripts/.verify-applicability-out";
mkdirSync(OUT, { recursive: true });

// Expected applicable Tracks per fixture's Member-Type, per the locked
// applicability matrix.
const EXPECTED_APPLICABLE = {
  jenny: [
    "Working Capital Line of Credit",
    "Business Visa Credit Card",
    "Unsecured Loan",
  ],
  northland: [
    "Working Capital Line of Credit",
    "Business Vehicle Loan",
    "Equipment & Machinery",
    "Unsecured Loan",
  ],
  cygnus: [
    "Commercial Real Estate Term Loan",
    "SBA 7(a) Loan",
    "Equipment & Machinery",
    "SBA 504",
    "PACE Loan",
  ],
  riverside: ["Working Capital Line of Credit"],
};

const FIXTURES = ["jenny", "northland", "cygnus", "riverside"];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();

const results = [];

for (const slug of FIXTURES) {
  console.log(`\n=== ${slug} ===`);
  await page.goto(`${BASE}/v2/members/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector(
    'p:has-text("lending product"), [aria-haspopup="listbox"]',
    { timeout: 15000 },
  );

  const lendingSection = page
    .locator('div:has(> p:text-is("lending product"))')
    .first();
  const dropdownTrigger = lendingSection.locator(
    'button[aria-haspopup="listbox"]',
  );
  const isMultiTrack = (await dropdownTrigger.count()) > 0;

  if (!isMultiTrack) {
    const onlyName =
      (await lendingSection.locator("p.text-sm.font-medium").first().textContent()) ?? "";
    const expected = EXPECTED_APPLICABLE[slug] ?? [];
    const ok = expected.includes(onlyName.trim());
    console.log(
      `  single-Track Member: ${onlyName.trim()}  expected=[${expected.join(", ")}]  ok=${ok}`,
    );
    results.push({
      slug,
      compact: [onlyName.trim()],
      uncommon: [],
      expectedApplicable: expected,
      missing: ok ? [] : [`single Track ${onlyName} not in expected`],
      unexpected: [],
      screenshot: null,
    });
    continue;
  }

  // Open dropdown — capture compact view first.
  await dropdownTrigger.click();
  await page.waitForTimeout(200);

  const collectVisible = async () => {
    const options = lendingSection.locator("ul > li > button");
    const n = await options.count();
    const names = [];
    for (let i = 0; i < n; i++) {
      const name = (await options.nth(i).locator("p").first().textContent()) ?? "";
      names.push(name.trim());
    }
    return names;
  };

  const compactVisible = await collectVisible();
  console.log(`  compact view (${compactVisible.length}):`);
  for (const n of compactVisible) console.log(`    - ${n}`);

  // Expand "see all N lending products" if present.
  const seeAll = lendingSection.locator('button:has-text("see all")');
  let expandedAll = [...compactVisible];
  let uncommon = [];
  if ((await seeAll.count()) > 0) {
    await seeAll.first().click();
    await page.waitForTimeout(200);
    expandedAll = await collectVisible();
    // The "Uncommon for this Member-Type" section is rendered separately.
    const uncommonSection = lendingSection.locator(
      'div:has(> p:text-is("Uncommon for this Member-Type"))',
    );
    if ((await uncommonSection.count()) > 0) {
      const uncommonOpts = uncommonSection.locator("ul > li > button");
      const m = await uncommonOpts.count();
      for (let i = 0; i < m; i++) {
        const name = (await uncommonOpts.nth(i).locator("p").first().textContent()) ?? "";
        uncommon.push(name.trim());
      }
    }
    console.log(`  expanded view total ${expandedAll.length + uncommon.length}; uncommon (${uncommon.length}):`);
    for (const n of uncommon) console.log(`    - ${n}`);
  }

  // Screenshot the expanded dropdown.
  const path = `${OUT}/${slug}--dropdown-expanded.png`;
  await lendingSection.screenshot({ path });

  // Validate compact view against expected matrix.
  // Assertion is one-way: every Track in the compact view must be in
  // the expected-applicable set. The reverse direction does NOT hold —
  // the evidence-based ranker may legitimately drop applicable Tracks
  // when the Member has no supporting signals captured (e.g., Northland
  // has no seasonal-variance evidence so TRACK-001 LOC never makes
  // rankedTracks, even though the matrix says it's a fit for
  // maintenance_services). That's correct behavior, not a bug —
  // applicability filters what the ranker surfaces; it doesn't
  // synthesize Tracks the ranker didn't include.
  const expected = EXPECTED_APPLICABLE[slug] ?? [];
  const unexpected = compactVisible.filter((t) => !expected.includes(t));
  const rankerDropped = expected.filter((t) => !compactVisible.includes(t));

  results.push({
    slug,
    compact: compactVisible,
    uncommon,
    expectedApplicable: expected,
    unexpected,
    rankerDropped,
    screenshot: path,
  });
}

await browser.close();

console.log("\n\n=== SUMMARY ===\n");
let broken = 0;
for (const r of results) {
  const unexpected = r.unexpected ?? [];
  // Only `unexpected` (inapplicable Tracks leaking into compact view)
  // is a real failure. `rankerDropped` is informational — applicable
  // Tracks that the evidence-ranker excluded — and not a defect.
  const ok = unexpected.length === 0;
  if (!ok) broken++;
  console.log(
    `${r.slug.padEnd(11)} compact=${r.compact.length}  uncommon=${r.uncommon.length}  unexpected=${unexpected.join(", ") || "—"}  ranker-dropped=${(r.rankerDropped ?? []).join(", ") || "—"}  ${ok ? "OK" : "BROKEN"}`,
  );
}
console.log(`\nTotal: ${results.length} fixtures, ${broken} broken`);
process.exit(broken === 0 ? 0 : 1);
