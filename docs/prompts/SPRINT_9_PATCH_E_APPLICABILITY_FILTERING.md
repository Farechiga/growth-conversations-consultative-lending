# Sprint 9 Patch E — Member-Type × Track Applicability Filtering

**Prompt for Claude Code. Single patch. Add dedicated `member_type_applicability` field on Track entity. Populate with the locked applicability matrix. Filter Track context dropdown to hide inapplicable Tracks per Member-Type. Preserve "compare to other lending products" link surfacing all Tracks. Estimated 0.5 effective build day CC time.**

## Pre-flight context

Patch C (PACE redesign) and Patch D (Unsecured redesign) both shipped clean. All 8 Sprint 9 visualizations now render with appropriate structures, cohesive palette, and accurate annotations. Playwright verification confirms 25/25 dialogs clean across all fixtures.

Visual review earlier in the build flagged that Jenny (event_services / catering) showed Equipment & Machinery as a selectable Track in her growth conversation page. Equipment financing isn't a natural product for a catering business. This pattern repeats across other Member-Types — the Track context dropdown currently shows all 10 lending products regardless of business-type fit.

The architecture already has the concept of applicability — Sprint 9 ArtifactTemplate.member_type_applicability fields declare which Member-Types each template applies to. But this lives at the artifact level, not the Track level. A Track is a lending product Blaze offers; an artifact is a visualization tool. Conceptually distinct.

Patch E adds a dedicated `member_type_applicability` field on the Track entity, populates it with the agreed matrix, and filters the Track context dropdown accordingly. The "compare to other lending products" affordance surfaces all 10 Tracks for the case where a banker needs to consider unusual options for a specific Member.

**Read these governance documents before starting:**

1. Existing Track entity in schema: `prisma/schema.prisma`
2. Existing Track seed: location depends on convention — verify
3. ArtifactTemplate seed: `prisma/seed-artifact-templates.ts` (reference for member_type_applicability pattern)
4. Track context dropdown component: likely `app/v2/members/[id]/track-context-switcher.tsx` or similar
5. "Compare to other lending products" link surface: location in sidebar component

If anything is unclear, surface to Francisco before starting.

**Approved decisions (already locked):**

- Source of truth: dedicated `Track.member_type_applicability` field (separate from ArtifactTemplate applicability)
- Applicability matrix (8 Member-Types × 10 Tracks) locked per Section M
- UI behavior: hide inapplicable Tracks entirely from the Track context dropdown
- "Compare to other lending products" link in sidebar continues to surface ALL 10 Tracks (banker can still see and reach inapplicable options)
- Fixture Members' existing multi-Track distributions (Sprint 8 Block G) preserved — verify that all fixture × Track combinations remain consistent with the new applicability matrix
- Synthetic Members in Stage 2 distribution preserved — most should fall within their Member-Type's applicable Tracks; if any synthetic Members have Tracks now flagged as inapplicable, treat as data inconsistency to be addressed

## What ships in this patch

Six blocks. Single checkpoint.

- **Block 1 — Schema change for Track.member_type_applicability.**
- **Block 2 — Seed data with locked applicability matrix.**
- **Block 3 — Track context dropdown filtering.**
- **Block 4 — "Compare to other lending products" link preservation.**
- **Block 5 — Fixture data verification.**
- **Block 6 — Verification.**

This patch does NOT ship: changes to ArtifactTemplate.member_type_applicability (existing fields preserved); changes to synthetic Member-Type distribution; changes to dashboard hero metrics or drill-downs; Sprint 7b drill-downs.

---

## Block 1 — Schema change for Track.member_type_applicability

### 1.1 Add field to Track entity

Add to Track entity in `prisma/schema.prisma`:

```prisma
member_type_applicability  Json  // String[] of Member-Type slugs that can be cultivated for this Track
```

Use Json type for consistency with how ArtifactTemplate.member_type_applicability is stored (per Sprint 9 conventions).

### 1.2 Migration

Single Prisma migration. Add the field as nullable initially (allows existing data to migrate without explicit values), then populate via seed in Block 2.

Alternative: add with default of empty array `'[]'` and populate via seed. Either approach works; CC picks the cleaner option for existing project conventions.

### 1.3 TypeScript types

Update relevant TypeScript types so the field is accessible in components that need to read it:

```typescript
type Track = {
  id: string;
  name: string;
  // ... existing fields
  member_type_applicability: string[];  // parsed from Json
};
```

### 1.4 Acceptance criteria

- [ ] Migration applies cleanly
- [ ] Track.member_type_applicability field exists
- [ ] Existing Track records preserve all current data
- [ ] TypeScript types updated
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` clean

---

## Block 2 — Seed data with locked applicability matrix

### 2.1 Member-Type × Track applicability matrix

The matrix below is the locked applicability per earlier conversation. Each cell is `applicable` or `not applicable`.

| Member-Type | TRACK-001 LOC | TRACK-002 Vehicle | TRACK-003 CRE | TRACK-004 SBA 7(a) | TRACK-006 Investment | TRACK-007 Equipment | TRACK-008 SBA 504 | TRACK-009 PACE | TRACK-010 Visa | TRACK-011 Unsecured |
|---|---|---|---|---|---|---|---|---|---|---|
| event_services | ✓ | — | — | — | — | — | — | — | ✓ | ✓ |
| maintenance_services | ✓ | ✓ | — | — | — | ✓ | — | — | — | ✓ |
| specialty_manufacturer | — | — | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — |
| professional_services | — | — | ✓ | — | ✓ | — | — | — | ✓ | — |
| healthcare_services | — | — | ✓ | — | — | ✓ | ✓ | ✓ | — | — |
| food_services | ✓ | ✓ | — | — | — | ✓ | — | — | ✓ | — |
| retail | ✓ | — | ✓ | — | — | — | — | — | ✓ | — |
| construction | — | ✓ | — | — | — | ✓ | — | — | — | ✓ |

### 2.2 Inverted view — per Track, applicable Member-Types

For seed clarity, here's the inverted view (each Track's member_type_applicability value):

| Track | Applicable Member-Types |
|---|---|
| TRACK-001 Working Capital LOC | event_services, maintenance_services, food_services, retail |
| TRACK-002 Business Vehicle | maintenance_services, food_services, construction |
| TRACK-003 CRE Term Loan | specialty_manufacturer, professional_services, healthcare_services, retail |
| TRACK-004 SBA 7(a) | specialty_manufacturer |
| TRACK-006 Investment Property | professional_services |
| TRACK-007 Equipment & Machinery | maintenance_services, specialty_manufacturer, healthcare_services, food_services, construction |
| TRACK-008 SBA 504 | specialty_manufacturer, healthcare_services |
| TRACK-009 PACE | specialty_manufacturer, healthcare_services |
| TRACK-010 Business Visa | event_services, professional_services, food_services, retail |
| TRACK-011 Unsecured | event_services, maintenance_services, construction |

### 2.3 Seed update implementation

Update Track seed file to populate `member_type_applicability` per the matrix. Each Track record gets its applicable Member-Type list as a JSON array.

Example:

```typescript
{
  id: "TRACK-001",
  name: "Working Capital Line of Credit",
  // ... existing fields
  member_type_applicability: JSON.stringify(["event_services", "maintenance_services", "food_services", "retail"]),
}
```

### 2.4 Acceptance criteria

- [ ] All 10 Tracks have member_type_applicability populated per matrix
- [ ] Values are JSON arrays of Member-Type slugs
- [ ] Matrix verified against the locked decision in Section 2.1
- [ ] `pnpm db:reset` runs cleanly with new seed

---

## Block 3 — Track context dropdown filtering

### 3.1 Filter logic

Locate the Track context dropdown component (per pre-flight reference). Update its data fetching/filtering logic to:

1. Determine the Member's Member-Type from the Member record
2. Fetch all Tracks the Member currently has in their multi-Track distribution (Sprint 8 Block G)
3. Filter to only those Tracks where the Member's Member-Type appears in `member_type_applicability`
4. Render dropdown with filtered Track list only

The dropdown should show:
- The Member's currently-selected primary Track (always)
- Other Tracks in the Member's active_tracks IF they are applicable per the matrix

If a Member has been assigned an inapplicable Track in their multi-Track distribution (data inconsistency), the inapplicable Track does NOT appear in the dropdown but DOES still exist in their record. Block 5 will verify whether any such inconsistencies exist in the fixture data.

### 3.2 Single-Track Members

For Members with only one active Track (most non-fixtures), no dropdown renders (existing behavior). Verify this still works after filtering changes.

### 3.3 Edge case — Member-Type changes

If a Member's Member-Type changes after Tracks have been assigned (uncommon edge case), the dropdown might filter out previously-applicable Tracks. Acceptable behavior: dropdown shows only Tracks currently applicable per the new Member-Type.

### 3.4 Acceptance criteria

- [ ] Dropdown filters Tracks by applicability matrix for current Member's Member-Type
- [ ] Filtered dropdown shows only applicable Tracks
- [ ] Member's currently-selected Track always renders even if it would be filtered out (graceful handling of edge cases)
- [ ] Single-Track Members continue to not show dropdown
- [ ] No console errors on render

---

## Block 4 — "Compare to other lending products" link preservation

### 4.1 Behavior preservation

The sidebar has a "compare to other lending products" link beneath the Track context. This link is the banker's escape hatch when they need to see Tracks that aren't typical for the Member-Type.

This link continues to surface ALL 10 Tracks regardless of applicability matrix. Banker can navigate from a filtered dropdown to see the full Track set when needed.

### 4.2 Comparison page rendering

The comparison page should distinguish:
- Tracks applicable per Member-Type (rendered normally)
- Tracks NOT applicable per Member-Type (rendered with visual treatment indicating "uncommon for [Member-Type]" — e.g., faded background, muted styling)

This preserves banker awareness that some products are unusual for this Member-Type without hiding the information.

### 4.3 Optional — banker override flow

If banker wants to actively cultivate an inapplicable Track for a Member, current behavior allows this through the comparison page. After Patch E, this flow should still work — adding an inapplicable Track to a Member's active_tracks just makes the dropdown surface it.

This is intentional. The matrix is guidance for typical workflows, not a hard constraint. Bankers should retain flexibility for legitimate edge cases.

### 4.4 Acceptance criteria

- [ ] "Compare to other lending products" link still surfaces all 10 Tracks
- [ ] Applicable vs inapplicable Tracks visually distinguished
- [ ] Banker can still add inapplicable Tracks to a Member's active_tracks (existing flow preserved)
- [ ] If added, inapplicable Track appears in dropdown for that Member (graceful handling)

---

## Block 5 — Fixture data verification

### 5.1 Per-fixture verification

Each fixture has a multi-Track distribution from Sprint 8 Block G. Verify each fixture × Track combination is consistent with the new applicability matrix:

**Jenny's Catering (event_services):**
- TRACK-001 Working Capital LOC ✓ (applicable for event_services)
- TRACK-010 Business Visa ✓ (applicable for event_services)
- Verification: both consistent

**Northland HVAC (maintenance_services):**
- TRACK-002 Business Vehicle Loan ✓ (applicable for maintenance_services)
- TRACK-007 Equipment & Machinery ✓ (applicable for maintenance_services)
- Verification: both consistent

**Cygnus Bioscience (specialty_manufacturer):**
- TRACK-008 SBA 504 ✓ (applicable for specialty_manufacturer)
- TRACK-003 CRE Term Loan ✓ (applicable for specialty_manufacturer)
- Verification: both consistent

**Riverside Catering (event_services):**
- TRACK-001 Working Capital LOC ✓ (applicable for event_services)
- Verification: consistent (single-Track, stage-skipping preserved)

### 5.2 Synthetic Member verification

Synthetic Members were distributed in Stage 2 per Member-Type and Track. Run a quick query: are there synthetic Members assigned to Tracks where their Member-Type isn't in the applicability matrix?

If yes, two options:
- **(a)** Leave as data inconsistency; the filtering hides it from dropdown without breaking anything
- **(b)** Migrate: reassign those synthetic Members to applicable Tracks per their Member-Type

CC judgment: option (a) is acceptable for demo since synthetic Members are pre-populated and the filtering handles edge cases gracefully. Option (b) is cleaner architecturally but requires data migration. Decision documented in BUILD_LOG.

### 5.3 Acceptance criteria

- [ ] All 4 fixtures verified consistent with applicability matrix
- [ ] Synthetic Member consistency assessed
- [ ] Any data inconsistencies documented
- [ ] No fixture loses functionality due to filtering

---

## Block 6 — Verification

### 6.1 Playwright verification

Run Playwright across the 4 fixtures to verify dropdown filtering works as expected. For each fixture:

- Load growth conversation page
- Inspect Track context dropdown
- Confirm only applicable Tracks appear in dropdown
- Confirm sidebar "compare to other lending products" link still works and shows all 10
- Take screenshot of filtered dropdown

### 6.2 Per-Member-Type verification

Optional: run Playwright across a sample of synthetic Members covering all 8 Member-Types. For each Member-Type, verify dropdown shows the expected applicable Tracks per the matrix.

### 6.3 No regression on Sprint 9 visualizations

Run Playwright on all Sprint 9 artifact visualizations to confirm no regression. Filtering should affect only the dropdown, not visualization rendering.

### 6.4 BUILD_LOG entry

Document the patch:
- Schema change rationale
- Applicability matrix decision
- UI filtering behavior
- "Compare to other lending products" link preservation
- Synthetic Member consistency decision

### 6.5 Acceptance criteria

- [ ] Playwright confirms dropdown filtering works per matrix
- [ ] Each fixture verified
- [ ] Sprint 9 visualizations have no regression
- [ ] BUILD_LOG entry comprehensive

---

## Reporting back

When patch is complete, report back with:

1. Confirmation Blocks 1-6 shipped per acceptance criteria
2. Per-fixture screenshot of filtered dropdown
3. Confirmation that all 4 fixtures' Track distributions remain consistent
4. Any synthetic Member data inconsistencies discovered
5. Decision on synthetic Member migration (option a leave or option b migrate)
6. Verification of "compare to other lending products" link behavior
7. Any deviations from spec with rationale

After this patch ships and visual review confirms (filtered dropdowns reading naturally per Member-Type, comparison link preserved, no regressions), next in the Option C-1 sequence is Sprint 7b drill-downs.

---

## Estimated scope

0.5 effective build day CC time.

Breakdown:
- **Block 1 (schema)** — additive field, single migration; ~0.1 day
- **Block 2 (seed data)** — populating matrix; ~0.1 day
- **Block 3 (dropdown filtering)** — UI filter logic; ~0.15 day
- **Block 4 (comparison link)** — verify and adjust if needed; ~0.05 day
- **Block 5 (fixture verification)** — data audit; ~0.05 day
- **Block 6 (verification)** — Playwright; ~0.05 day

Lighter than Patches C and D because the data model is simple and the UI change is contained.

After this patch lands, sequenced next:
- **Sprint 7b drill-downs** (6 views, ~3-4 days CC time, drafted next)
- **Sprint 6 production deployment**
- **DEMO_RUNBOOK review + demo rehearsal**
