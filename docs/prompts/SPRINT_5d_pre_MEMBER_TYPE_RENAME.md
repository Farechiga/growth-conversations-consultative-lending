# Sprint 5d-pre — Member-Type Rename (Standalone)

**Prompt for Claude Code. Single focused checkpoint. Comprehensive Member-Type rename across schema, seed data, code references, constants, and metadata. Foundation work before Sprint 5d. Estimated 1 effective build day CC time.**

## Pre-flight context

Sprint 5c shipped Blaze product realignment. Sprint 5d will apply a comprehensive content rewrite + 7 new artifact templates + bug patches. Before Sprint 5d ships, the Member-Type rename needs to land cleanly as standalone foundation work. This avoids tangling rename work with content rewrite work in a single checkpoint.

This sprint does ONE thing: rename Member-Types across the entire codebase. No content rewrite. No new artifact templates. No bug patches. Just the rename.

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level) — Section 1 specifies the rename mappings and coverage broadening
2. `INSIGHT_PATTERN_LIBRARY_v1.md` and `INSIGHT_PATTERN_LIBRARY_v2_additions.md` (root level) — Pattern member_type_origins metadata that needs mapping
3. `MEMBER_TYPE_GUIDANCE_v2.md` and `MEMBER_TYPE_GUIDANCE_v3_addendum.md` (root level) — Coach guidance keyed by Member-Type
4. `ARCHITECTURE_V2.md` and `prisma/schema.prisma`

If any document is missing, stop and surface to Francisco.

**Architecture authority:** `CONTENT_REWRITE_v1.md` Section 1 wins for rename specs.

## What ships in this sprint (5d-pre)

Single block. One focused execution. Comprehensive rename only.

---

## Block A — Member-Type rename (comprehensive)

### A.1 Rename mappings

**Member-Type ID rename:**
- `small_caterer` → `event_services`
- `hvac_trades` → `maintenance_services`
- `specialty_manufacturing` → `specialty_manufacturer`

**Banker-facing display labels:**
- `event_services` → "Event services"
- `maintenance_services` → "Maintenance services"
- `specialty_manufacturer` → "Specialty manufacturer"

**Pattern member_type_origins metadata mapping:**
- "catering" → "event_services"
- "small_caterer" → "event_services"
- "hvac_trades" → "maintenance_services"
- "plumbing" → "maintenance_services"
- "specialty_construction" → "maintenance_services"
- "specialty_manufacturing" → "specialty_manufacturer"
- "general" → "general" (kept; cross-Member-Type tag)
- "professional_services" → "professional_services" (kept)

For Patterns currently tagged with multiple specific industries that all map to the same broader Member-Type, dedupe to the broader Member-Type. Example: a Pattern with origins `['hvac_trades', 'plumbing', 'general']` becomes `['maintenance_services', 'general']` after dedupe.

### A.2 Scope

The rename touches:

1. **Prisma schema** — `Member.member_type` enum (or string field) values
2. **Seed data** — `prisma/seed.ts` and any per-fixture data files
3. **`lib/stage-guidance.ts`** — MEMBER_TYPE_COACH (or MEMBER_TYPE_GUIDANCE) constant keys
4. **InsightPattern records** — `member_type_origins` JSON field per A.1 mapping
5. **TrackTemplate records** — `member_type_applicability` JSON arrays
6. **MatrixEntry records** — any conditions referencing Member-Type strings
7. **TypeScript type definitions** — any types/enums/literal-union references
8. **Component-level display logic** — Member-Type display strings in any component
9. **Banker-facing display strings** — new labels per A.1 ("Event services", etc.)

### A.3 Migration

Single Prisma migration:
- Update `Member.member_type` field values for existing records
- For demo, migration also updates existing Member records: Jenny → event_services, Northland → maintenance_services, Cygnus → specialty_manufacturer
- Preserve all existing data

If `Member.member_type` is currently a Prisma enum, the migration adds new enum values, migrates Member records, then drops old enum values. If it's a string field, the migration is a simple data update.

### A.4 Coverage broadening (banker-facing definitions)

Update Member-Type definitions where banker-facing context references the broadened scope. These definitions surface in: Member-Type filter dropdowns, Track Performance surface Member-Type mix labels, Coach surface section headers.

**Event services** covers: caterers, event planners, venue operators, mobile bartenders, party rental companies, wedding services, corporate event management.

**Maintenance services** covers: HVAC, plumbing, electrical, mechanical contractors, landscapers, pool service, pest control, cleaning services.

**Specialty manufacturer** covers: mid-market manufacturers, industrial fabrication, custom production, contract manufacturing.

These definitions can be added as constants in `lib/stage-guidance.ts` or wherever Member-Type metadata is centralized.

### A.5 Verification grep

Before reporting back, verify the rename is complete via grep:

```bash
# These greps should return 0 results across the entire codebase:
grep -rn "small_caterer" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.prisma"
grep -rn "hvac_trades" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.prisma"
grep -rn "specialty_manufacturing" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.prisma"
```

Pattern member_type_origins should not contain old values:

```bash
# Verify Pattern metadata cleaned:
grep -rn '"catering"' --include="*.ts" --include="*.json"
grep -rn '"plumbing"' --include="*.ts" --include="*.json"
grep -rn '"specialty_construction"' --include="*.ts" --include="*.json"
```

Document grep output in checkpoint report.

### A.6 Acceptance criteria

- [ ] All `small_caterer` references replaced with `event_services` (case-sensitive grep returns 0)
- [ ] All `hvac_trades` references replaced with `maintenance_services` (case-sensitive grep returns 0)
- [ ] All `specialty_manufacturing` references replaced with `specialty_manufacturer` (case-sensitive grep returns 0)
- [ ] Pattern member_type_origins metadata updated per A.1 mapping (dedupe applied where appropriate)
- [ ] Schema migration applies cleanly
- [ ] Banker-facing displays show "Event services" / "Maintenance services" / "Specialty manufacturer"
- [ ] Existing fixture Members render correctly post-rename:
  - Jenny → tagged event_services
  - Northland → tagged maintenance_services
  - Cygnus → tagged specialty_manufacturer
- [ ] All three Member growth conversation pages HTTP 200 and render without errors
- [ ] All four Insight Engine portfolio routes HTTP 200 and render without errors
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` clean
- [ ] `pnpm exec tsx prisma/seed.ts` clean

---

## What this sprint explicitly does NOT ship

- No content rewrite (deferred to Sprint 5d)
- No new artifact templates (deferred to Sprint 5d)
- No Coach content updates (deferred to Sprint 5d)
- No CTA label changes (deferred to Sprint 5d)
- No bug patches (deferred to Sprint 5d)
- No new fixture seeding (deferred to Sprint 5d)

Sprint 5d-pre is foundation-only. If a question arises during execution that touches deferred areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5d-pre is complete, report back with:

1. Confirmation that Block A shipped per acceptance criteria
2. Output of verification grep commands (should all return 0 for old IDs)
3. Visual probes:
   - Jenny growth conversation page renders (HTTP 200; Member-Type tag shows "Event services")
   - Northland growth conversation page renders (HTTP 200; Member-Type tag shows "Maintenance services")
   - Cygnus growth conversation page renders (HTTP 200; Member-Type tag shows "Specialty manufacturer")
   - All four Insight Engine routes render (HTTP 200)
   - Coach surface displays Member-Type-keyed content for all three fixtures (existing v2/v3 content unchanged; just keyed under new IDs)
4. Pattern member_type_origins sample check: pick 3-5 Patterns and confirm metadata uses new Member-Type IDs
5. Any deviations from spec with rationale

After Sprint 5d-pre ships and visual review confirms (rename clean; all surfaces work), Sprint 5d (content rewrite + artifact templates + bug patches) ships against the renamed foundation.

---

## Estimated scope

1 effective build day CC time. Single block. Single checkpoint. Verification-heavy.
