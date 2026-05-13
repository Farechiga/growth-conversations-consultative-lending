# Sprint 5c — Blaze Product Realignment, Additive Track Architecture, Bug Patches

**Prompt for Claude Code. Single checkpoint. Realigns Track architecture and matrix to map cleanly to Blaze's actual lending product offerings while retaining existing Tracks for future-expansion framing. Adds 6 new Tracks, drops 1 Track + 1 factor, updates fixtures, patches 2 visual review bugs. Estimated 4-6 effective build days CC time + ~1-1.5 days Francisco/Claude content authoring.**

## Pre-flight context

Sprint 5b.2 visual review surfaced a substantive architectural gap: 3 of 5 demo Tracks don't map to Blaze's actual lending product catalog. Working Capital LOC, SBA 7(a), and Treasury Services aren't in Blaze's current offerings. This undermines the EVP demo's authenticity at Blaze.

**Blaze's actual lending products:**
- Business Visa Credit Cards
- Investment Property Loans (single-family, duplex, triplex, fourplex)
- PACE Loans (solar, EV charging, energy improvements; up to 14-year fixed)
- Commercial Real Estate (retail, warehouse, industrial, office, mixed-use)
- SBA 504 (owner-occupied CRE)
- Equipment & Machinery (up to 7-year terms, 25% down)
- Business Vehicle Loans (up to 5-year terms, 25% down)
- Unsecured Loans (up to $25K, 5-year terms)

**Sprint 5c is additive realignment, not deletion.** Working Capital LOC, SBA 7(a) remain in demo as future-expansion framing for Blaze. Treasury Services drops (no equivalent product, no clean Pilot framing). Six new Tracks added to map to Blaze's actual catalog.

Three architectural commitments locked through design conversation:

- **TRACK-001 Working Capital LOC stays** as future-expansion product. Jenny's primary Track stays here.
- **TRACK-004 SBA 7(a) stays** as future-expansion product.
- **TRACK-005 Treasury Services Upgrade drops.** treasury_services_adoption factor drops.
- **TRACK-002 splits structurally:** rename to Business Vehicle Loan; add new TRACK-007 Equipment & Machinery as distinct Track.
- **SBA 504 added as TRACK-008** (owner-occupied CRE; distinct from TRACK-003 CRE Term Loan).
- **Cygnus's primary Track shifts from TRACK-003 to TRACK-008 SBA 504** (owner-occupied manufacturing facility).
- **Northland stays on TRACK-002** (now renamed Business Vehicle Loan).
- **Jenny stays on TRACK-001** (Working Capital LOC retained for future-expansion framing).

**Read these governance documents before starting:**

1. `BUSINESS_FACTOR_MATRIX_v1.md` — current factor catalog and matrix entries
2. `INSIGHT_PATTERN_LIBRARY_v1.md` — current 36 Patterns; library v2 additions ship in Sprint 5c
3. `MEMBER_TYPE_GUIDANCE_v2.md` — current Coach v2 content; updates ship in Sprint 5c
4. `ARCHITECTURE_V2.md` §3, §11
5. `COMPLIANCE.md` §10.2
6. `prisma/schema.prisma` — TrackTemplate, MatrixEntry, FactorCapture entities

**Architecture authority:** ARCHITECTURE_V2.md wins for objective architecture; existing schema patterns extend additively (no breaking schema changes); COMPLIANCE.md §10.2 wins for banker-facing copy.

## What ships in this sprint (5c)

Eight blocks across three phases. Single checkpoint, delimited diffs.

**Phase 1 — Track architecture realignment:**
- **Block A — Track schema additions and TRACK-002 rename.** Six new TrackTemplate records; TRACK-002 renamed; TRACK-005 + treasury_services_adoption factor dropped.
- **Block B — Matrix entry authoring.** Factor × Track tier rules for 6 new Tracks (~40-60 new MatrixEntry records).
- **Block C — Insight Pattern Library v2.** ~20-30 new Patterns for new Tracks; drop TRACK-005 Patterns.

**Phase 2 — Fixture and content updates:**
- **Block D — Fixture realignment.** Cygnus shifts to TRACK-008 SBA 504; Northland stays TRACK-002 (post-rename); Jenny stays TRACK-001. Per-fixture seed Insight updates.
- **Block E — Coach Member-Type guidance v3 updates.** Targeted updates where new Tracks shift Member-Type relevance.

**Phase 3 — Surface updates and bug patches:**
- **Block F — Track context dropdown scaling.** 10 active Tracks need scalable rendering in dropdowns and Track ranker views.
- **Block G — Bug patches.** CTA factor pre-selection (defaults to first factor instead of blank); recapture artifact duplication (still creating new ShowEvent records on share-event re-execution).
- **Block H — Governance updates.** BUILD_LOG, OPEN_QUESTIONS, CLAUDE.md, BUSINESS_FACTOR_MATRIX_v2.

Sprint 5c explicitly does NOT ship: full content authoring for all 6 new Tracks at full fixture depth (only sufficient seed data for portfolio surfaces to render and demo narrative to land); RBAC for Track visibility (all bankers see all Tracks); Track-discovery flow improvements (Pilot polish).

---

## Block A — Track schema additions and TRACK-002 rename

### A.1 Track schema state after Sprint 5c

Final TrackTemplate records:

| ID | Name | Blaze offers? | Notes |
|---|---|---|---|
| TRACK-001 | Working Capital Line of Credit | No | Future-expansion product; Jenny's primary |
| TRACK-002 | Business Vehicle Loan | Yes | Renamed from Vehicle/Fleet Loan; Northland's primary |
| TRACK-003 | Commercial Real Estate Term Loan | Yes | Conventional CRE |
| TRACK-004 | SBA 7(a) | No | Future-expansion product |
| ~~TRACK-005~~ | ~~Treasury Services Upgrade~~ | Dropped | Remove entity + Patterns + matrix entries |
| TRACK-006 | Investment Property Loan | Yes | Single-family, duplex, triplex, fourplex |
| TRACK-007 | Equipment & Machinery | Yes | 7-year terms, 25% down |
| TRACK-008 | SBA 504 | Yes | Owner-occupied CRE; Cygnus's primary |
| TRACK-009 | PACE Loan | Yes | Solar, EV, energy; 14-year fixed |
| TRACK-010 | Business Visa Credit Card | Yes | Revolving; smaller magnitudes |
| TRACK-011 | Unsecured Loan | Yes | Up to $25K, 5-year |

### A.2 New TrackTemplate records

For each new Track (006-011), populate TrackTemplate with:
- `track_id`, `name`, `display_name`
- `member_type_applicability` (which Member-Types this Track typically serves)
- `required_evidence_per_objective` (Discover, Measure, Consult, Navigate evidence requirements)
- `specialist_required` (boolean; SBA 504 = true, Investment Property = depends on size, etc.)
- `specialist_department_tag` (where applicable: 'CRE specialists', 'SBA specialists', etc.)

For each Track, define required_evidence_per_objective per Sprint 5a.2 pattern:

**TRACK-006 Investment Property Loan:**
- Discover: stated_growth_aspiration, stated_obstacle_to_growth, real_estate_target_property
- Measure: annual_revenue_band, existing_credit_facility_utilization, property_acquisition_amount_sized
- Consult: model_produced (cashflow projection on rental income), reaction_captured
- Navigate: action_card_scheduled, decision_maker_mapping (where multi-stakeholder)

**TRACK-007 Equipment & Machinery:**
- Discover: stated_growth_aspiration, equipment_aging_observed, capacity_limit_factor
- Measure: capacity_utilization, equipment_replacement_cost_sized, surplus_revenue_over_costs
- Consult: model_produced (equipment ROI), reaction_captured
- Navigate: action_card_scheduled, external_advisor_input (CPA on depreciation)

**TRACK-008 SBA 504:**
- Discover: stated_growth_aspiration, real_estate_constraint, owner_occupancy_confirmed
- Measure: annual_revenue_band, employee_count_band, property_acquisition_amount_sized, capacity_utilization
- Consult: model_produced (SBA 504 structure with first-lien + CDC second), reaction_captured, decision_maker_mapping
- Navigate: action_card_scheduled, specialist_handoff_initiated (SBA specialist + CRE specialist), external_advisor_input

**TRACK-009 PACE Loan:**
- Discover: stated_growth_aspiration, energy_improvement_target (solar / EV / efficiency)
- Measure: property_eligibility_confirmed, improvement_cost_sized
- Consult: model_produced (PACE structure with property-tax assessment), reaction_captured
- Navigate: action_card_scheduled, specialist_handoff_initiated (PACE specialist)

**TRACK-010 Business Visa Credit Card:**
- Discover: stated_obstacle_to_growth (working capital intermittent need), member_tenure
- Measure: annual_revenue_band, requested_credit_limit_sized
- Consult: card-program-fit confirmation, reaction_captured
- Navigate: application_action_card_scheduled

**TRACK-011 Unsecured Loan:**
- Discover: stated_growth_aspiration, stated_obstacle_to_growth, member_tenure
- Measure: annual_revenue_band, requested_loan_amount_sized (capped at $25K)
- Consult: model_produced (term structure), reaction_captured
- Navigate: action_card_scheduled

### A.3 TRACK-002 rename

Rename TRACK-002 from "Vehicle/Fleet Loan" to "Business Vehicle Loan" across:
- TrackTemplate.name and TrackTemplate.display_name
- All hardcoded references in seed data
- All hardcoded references in component copy
- BUILD_LOG cross-references

The fleet-expansion narrative for Northland still works under "Business Vehicle Loan" framing — fleet *is* multiple business vehicles. No fixture content changes required beyond label updates.

### A.4 TRACK-005 + treasury_services_adoption removal

Remove from schema/data:
- TrackTemplate where track_id = 'TRACK-005'
- All MatrixEntry where track_id = 'TRACK-005'
- All InsightPattern where track_id = 'TRACK-005' (~6 Patterns from Sprint 5b.1 library)
- All seed Insights addressing TRACK-005
- BusinessFactor where factor_id = 'FACTOR-treasury_services_adoption' (or whichever factor maps to it)
- All MatrixEntry referencing the dropped factor

If any fixture currently captures TRACK-005 evidence, migrate that evidence to alternate Track context or drop. Verify Northland and Jenny don't have orphan TRACK-005 captures after migration.

### A.5 New factor additions

Some new Tracks need new factors not in current matrix:

- **owner_occupancy_confirmed** (boolean) — for SBA 504 eligibility
- **real_estate_target_property** (qualitative tag) — for Investment Property Loan
- **energy_improvement_target** (qualitative tag: solar / ev_charging / efficiency / other) — for PACE
- **property_eligibility_confirmed** (boolean) — for PACE
- **equipment_replacement_cost_sized** (numerical, dollars) — for Equipment & Machinery
- **improvement_cost_sized** (numerical, dollars) — for PACE
- **property_acquisition_amount_sized** (numerical, dollars) — for Investment Property and SBA 504
- **requested_credit_limit_sized** (numerical, dollars) — for Business Visa
- **requested_loan_amount_sized** (numerical, dollars) — for Unsecured

Add to BusinessFactor catalog with appropriate tags, units, and Member-Type applicability.

### A.6 Acceptance criteria

- [ ] 6 new TrackTemplate records (006-011) with full required_evidence_per_objective
- [ ] TRACK-002 renamed across schema + components + seed data
- [ ] TRACK-005 + treasury_services_adoption factor + dependent matrix entries + Patterns dropped cleanly
- [ ] ~9 new BusinessFactor records added
- [ ] Migration applies cleanly
- [ ] No orphan references to TRACK-005 anywhere
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — Matrix entry authoring

### B.1 Matrix entry cardinality

For each new Track, factor × Track tier rules per existing MatrixEntry pattern. Approximate cardinality:

- TRACK-006 Investment Property Loan: ~10 MatrixEntry records (rental income factors, property type factors, multi-property portfolio factors)
- TRACK-007 Equipment & Machinery: ~10 MatrixEntry records (capacity, equipment age, depreciation context, ROI factors)
- TRACK-008 SBA 504: ~12 MatrixEntry records (owner-occupancy, employment count, real estate factors, SBA-specific eligibility)
- TRACK-009 PACE Loan: ~6 MatrixEntry records (property eligibility, improvement type, energy ROI factors)
- TRACK-010 Business Visa: ~5 MatrixEntry records (revenue band, tenure, existing relationship)
- TRACK-011 Unsecured Loan: ~5 MatrixEntry records (revenue band, tenure, loan amount cap, existing relationship)

Total ~48 new MatrixEntry records.

### B.2 Tier authoring

For each new Track, MatrixEntry tiers follow Sprint 5a.1 pattern: strong / moderate / insufficient based on factor value thresholds. Authoring expectations:

- Use Blaze's actual product terms where surfacable (PACE 14-year fixed; Equipment 7-year terms; Vehicle 5-year terms; Unsecured $25K cap and 5-year terms; SBA 504 standard structure)
- Member-Type applicability tags ensure ranker doesn't surface Tracks that don't fit (e.g., PACE for catering Member with no real estate context; Investment Property for HVAC trades single-owner with no rental property)
- Insufficient tier captures eligibility blockers (revenue band too low, tenure too short, etc.)

### B.3 Cross-Track ranker behavior

With 10 active Tracks, the ranker output for any given Member should still surface 2-4 candidate Tracks. Most Members won't fit all 10 Tracks; matrix entries with insufficient tiers prune the ranker output naturally.

Verify post-Sprint 5c that ranker output for Jenny / Northland / Cygnus surfaces ~2-4 candidate Tracks with primary Track ranked top. If ranker surfaces 8+ candidates, matrix entries are too permissive; tighten with senior-lender review.

### B.4 Acceptance criteria

- [ ] ~48 new MatrixEntry records loaded
- [ ] All new Tracks have insufficient-tier rules for at least 2 disqualifying factors
- [ ] Member-Type applicability tags ensure correct ranker behavior
- [ ] Ranker output for each fixture surfaces 2-4 candidate Tracks with correct primary
- [ ] Seed data loads cleanly

---

## Block C — Insight Pattern Library v2

### C.1 Source content

`docs/INSIGHT_PATTERN_LIBRARY_v2_additions.md` (will be authored by Francisco/Claude before Sprint 5c starts; not yet at repo root). Contains:

- ~20-30 new Patterns for TRACK-006 through TRACK-011
- List of TRACK-005 Patterns to drop (PATTERN-031 through PATTERN-036 from v1 library)
- Updated Pattern-cardinality summary post-realignment

If the file isn't present at sprint start, **stop and surface to Francisco**.

### C.2 Library state after Sprint 5c

Library v1: 36 Patterns covering 5 Tracks. Library v2 after Sprint 5c:
- TRACK-001 Working Capital LOC: 9 Patterns (unchanged)
- TRACK-002 Business Vehicle Loan: 7 Patterns (unchanged; rename only)
- TRACK-003 CRE Term Loan: 8 Patterns (unchanged)
- TRACK-004 SBA 7(a): 6 Patterns (unchanged)
- TRACK-006 Investment Property Loan: ~5 new Patterns
- TRACK-007 Equipment & Machinery: ~5 new Patterns
- TRACK-008 SBA 504: ~6 new Patterns
- TRACK-009 PACE Loan: ~3 new Patterns
- TRACK-010 Business Visa: ~2 new Patterns
- TRACK-011 Unsecured Loan: ~2 new Patterns

Total ~53 Patterns post-realignment (was 36; net +17 after dropping 6 TRACK-005 Patterns).

### C.3 Acceptance criteria

- [ ] Library v2 additions file present
- [ ] ~23 new InsightPattern records loaded
- [ ] 6 TRACK-005 Patterns dropped
- [ ] All Pattern.track_id references resolve to active Tracks
- [ ] Per-Pattern signal_tag_scope references valid Signal tags
- [ ] Seed loads cleanly

---

## Block D — Fixture realignment

### D.1 Cygnus shifts to TRACK-008 SBA 504

Cygnus's primary Track changes from TRACK-003 (conventional CRE Term Loan) to TRACK-008 (SBA 504 for owner-occupied manufacturing facility). Updates required:

**Schema/data updates:**
- MemberWorkflowState.current_track_id reflects TRACK-008 after recompute
- ranked Tracks output for Cygnus surfaces TRACK-008 as primary

**Fixture content updates:**
- Owner-occupancy factor captured (boolean = true) — Cygnus is acquiring for own manufacturing operations
- Existing CRE-relevant factor captures retain (real estate factor, capacity factor, customer growth factor)
- Add SBA 504-specific factor captures (employment count band; owner-occupancy)
- Insight references update: Cygnus's existing routine Insights addressing CRE Track now reference SBA 504 patterns where applicable

**Seed Insight updates for Cygnus:**
Existing Cygnus seed Insights from Sprint 5b.1:
- Routine 1 (PATTERN-019 customer_growth) — applies to TRACK-008 too; retain with track_id update
- Routine 2 (PATTERN-017 real_estate) — applies to TRACK-008 too; retain with track_id update
- Routine 3 (PATTERN-022 co_decision_maker_input on board) — applies to TRACK-008 too; retain with track_id update
- Novel 1 (anchor customer obligation pressure) — applies to TRACK-008 too; retain with track_id update

All four Cygnus seed Insights migrate to TRACK-008. New Patterns authored for TRACK-008 in Block C will surface for Cygnus via lightbulb popover and Implications footer.

### D.2 Northland stays on TRACK-002 (renamed)

No fixture content changes for Northland beyond Track display name updates.

### D.3 Jenny stays on TRACK-001

No fixture changes for Jenny.

### D.4 Acceptance criteria

- [ ] Cygnus's primary Track ranks as TRACK-008 SBA 504
- [ ] Cygnus seed Insights migrate to TRACK-008 references
- [ ] Owner-occupancy factor captured for Cygnus
- [ ] Northland's TRACK-002 references work post-rename
- [ ] Jenny's TRACK-001 references unchanged
- [ ] All three fixtures' growth conversation pages render correctly
- [ ] Workflow state recomputes correctly post-realignment

---

## Block E — Coach Member-Type guidance v3 updates

### E.1 Targeted updates

Coach v2 content (MEMBER_TYPE_GUIDANCE) was authored against original 5 Tracks. Sprint 5c additive realignment introduces new Tracks that may shift Member-Type relevance. Targeted updates rather than full re-authoring:

**Catering (small_caterer) — minor updates:**
- Existing content stays (focused on Working Capital LOC scenario for Jenny — TRACK-001 retained)
- Add minor reference: catering Members with delivery vehicle needs may consider TRACK-002 Business Vehicle Loan; catering with owned facility may consider TRACK-008 SBA 504
- Don't re-author core sections; just add 1-2 bullets where naturally relevant

**HVAC Trades (hvac_trades) — minor updates:**
- Existing content stays (focused on TRACK-002 Business Vehicle scenario for Northland)
- Add references: HVAC Members frequently need Equipment & Machinery (TRACK-007) for HVAC-system equipment; PACE Loan (TRACK-009) for HVAC-installation customer financing facilitation (relationship-deepening even if not direct lending)
- Don't re-author core sections

**Specialty Manufacturing (specialty_manufacturing) — substantive updates:**
- Cygnus's primary shift from TRACK-003 to TRACK-008 SBA 504 means Member-Type guidance for specialty_manufacturing Discover/Measure/Consult/Navigate phases now references SBA 504 structure where currently references conventional CRE
- Owner-occupancy framing becomes central
- SBA 504 specialist coordination (CDC + bank lender) becomes the specialist-handoff context
- Approximately 30-40% of specialty_manufacturing Coach content needs SBA 504-aware language updates

### E.2 Authoring approach

Francisco/Claude author `docs/MEMBER_TYPE_GUIDANCE_v3_addendum.md` covering only the deltas from v2. CC integrates deltas into `lib/stage-guidance.ts` MEMBER_TYPE_COACH constants.

### E.3 Acceptance criteria

- [ ] v3 addendum file present at sprint start
- [ ] Coach surface renders updated specialty_manufacturing content for Cygnus
- [ ] Catering and HVAC Coach content includes minor cross-Track references
- [ ] No banned phrases per COMPLIANCE.md §10.2
- [ ] No regression to Coach surface structure

---

## Block F — Track context dropdown scaling

### F.1 Track ranker view

Per-Member Track context dropdown currently shows all candidate Tracks ranked. With 10 active Tracks, dropdown rendering needs:

- Show top 4-5 candidate Tracks (the ones with strong or moderate matrix tier matches)
- "View all 10 lending products" affordance to expand to full list
- Member-Type applicability filtering applied so dropdown doesn't show Tracks that obviously don't fit (e.g., PACE for catering with no real estate)
- Within candidate list, primary Track (top of ranker output) visually distinct

### F.2 Track Performance surface

Track Performance surface (`/v2/insight-engine/tracks` from Sprint 5b.2) shows all active Tracks. With 10 Tracks, layout updates:

- Card or row treatment that scales to 10 entries without overwhelming
- Group by Blaze-offers vs future-expansion (TRACK-001 and TRACK-004 separated visually as "future-expansion" or similar non-judgmental framing)

### F.3 Acceptance criteria

- [ ] Track context dropdown shows top candidates with expand-to-all affordance
- [ ] Track Performance surface scales to 10 Tracks
- [ ] Visual treatment distinguishes Blaze-offers from future-expansion Tracks (subtly, not as judgment)

---

## Block G — Bug patches

### G.1 CTA factor pre-selection bug

**Bug:** CTAs that should open + Quantify form with no factor pre-selected are defaulting to first factor (Accounts receivable concentration). Affects bullet-CTAs in Coach surface where the bullet doesn't specify a factor.

**Diagnosis path:** trace `open_capture_form` action descriptor handling for cases where `preselected_factor_id` is null/undefined. Verify form opens with empty factor dropdown rather than defaulting to first option.

**Fix:** + Quantify form opens with no factor selected when no preselected_factor_id provided. Banker selects from dropdown manually. Form save validates factor selection required before submit.

### G.2 Recapture artifact duplication bug

**Bug:** Marking Model "shared with member" continues to create duplicate ShowEvent records despite Sprint 5b.1 Patch 7 + Sprint 5b.2 Block F implementation.

**Diagnosis path:** trace ShowEvent server action; verify findFirst-update-or-create logic actually fires; check whether the bug is in the action or in the calling component (component may be calling create directly bypassing the dedupe).

**Fix:** ensure all ShowEvent creation paths route through the dedupe logic. Inline test: trigger "shared with member" on same artifact twice → confirm single ShowEvent record with updated timestamp.

### G.3 Acceptance criteria

- [ ] CTA opens + Quantify form with no factor pre-selected when no preselected_factor_id
- [ ] ShowEvent dedupe fires on all share-event paths
- [ ] Inline tests pass for both bugs

---

## Block H — Governance updates

### H.1 BUILD_LOG.md entry

Sprint 5c entry covering:
- What shipped per block
- Track architecture realignment rationale (Blaze product mapping)
- Additive approach (TRACK-001 + TRACK-004 retained as future-expansion)
- TRACK-005 + treasury_services_adoption drop rationale
- Cygnus shift to TRACK-008 SBA 504
- Cross-references to BUSINESS_FACTOR_MATRIX_v2 and INSIGHT_PATTERN_LIBRARY_v2_additions
- Bug patch notes

### H.2 BUSINESS_FACTOR_MATRIX_v2.md

Update root-level matrix documentation to reflect post-Sprint 5c state:
- 10 active Tracks
- ~9 new factors
- ~48 new MatrixEntry records
- Member-Type applicability per Track

### H.3 OPEN_QUESTIONS amendments

- Add Q-D1: "Track display ordering: future-expansion Tracks (TRACK-001, TRACK-004) currently retained without operational impact. When does Blaze decide whether to expand into LOC/SBA 7(a) vs drop these Tracks from the demo?"
- Add Q-D2: "TRACK-009 PACE Loan customer fit: PACE is a niche product. Pilot needs to evaluate whether bankers actually use this Track frequently enough to warrant prominence."

### H.4 Architectural notes for Pilot (continuing 1-10)

- **Note 11 — Track expansion governance.** When Blaze expands product offerings (e.g., adds Working Capital LOC), TRACK-001 framing shifts from future-expansion to active. Architecture supports this without code change; just update display metadata.
- **Note 12 — Member-Type to Track inference.** With 10 Tracks, automatic Track suggestion by Member-Type (lightweight inference) is Pilot polish. Currently bankers select Track context manually.

### H.5 CLAUDE.md manifest update

Add to manifest:
- 6 new TrackTemplate IDs
- 9 new BusinessFactor IDs
- ~23 new InsightPattern IDs
- `BUSINESS_FACTOR_MATRIX_v2.md`
- `INSIGHT_PATTERN_LIBRARY_v2_additions.md`
- `MEMBER_TYPE_GUIDANCE_v3_addendum.md`

### H.6 Acceptance criteria

- [ ] BUILD_LOG entry comprehensive
- [ ] BUSINESS_FACTOR_MATRIX_v2 updated
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 11-12 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Pilot deferrals to honor

Sprint 5c does not ship:
- Full content depth for all 6 new Tracks (only seed-data sufficient for portfolio surfaces and demo narrative)
- Member-Type to Track inference / suggestion
- Track display polish for future-expansion vs Blaze-offers
- Per-Track pricing content
- PACE-specific Member workflow (specialty path)
- SBA 504 CDC partner integration

If a question arises during 5c implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5c is complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Visual probes of:
   - All three fixtures rendering with realigned Tracks (Cygnus on TRACK-008; Northland on renamed TRACK-002; Jenny on TRACK-001 unchanged)
   - Track Performance surface showing 10 Tracks scaled appropriately
   - Track context dropdown showing top candidates with expand-to-all
   - Coach surface for Cygnus showing SBA 504-aware specialty_manufacturing content
   - + Quantify CTA opening with no factor pre-selected (bug fix)
   - Sharing same Model twice produces single ShowEvent (bug fix)
   - Lightbulb popover on Cygnus showing TRACK-008 Patterns
3. Per-fixture sanity check: ranker output, capture counts, workflow state
4. Any deviations from spec with rationale

Visual review will probe each block independently. Plan diff structure so each block is delimited.

---

## Estimated scope

4-6 effective build days CC time + ~1-1.5 days Francisco/Claude content authoring (Pattern Library v2 additions + Coach v3 addendum).

Largest blocks:
- **Block A (schema + 6 new Tracks)** — substantial schema + seed work; ~1-1.5 days CC
- **Block B (matrix entries)** — ~48 records authored carefully; ~1 day CC + matrix-authoring time
- **Block D (fixture realignment for Cygnus)** — careful seed updates and Insight migrations; ~0.5-1 day CC
- **Block F (surface scaling)** — UI work for 10-Track rendering; ~0.5-1 day CC

Smaller blocks (C, E, G, H) are routine if content is authored cleanly upfront.

After Sprint 5c ships and visual review confirms (10 Tracks rendering; Cygnus on SBA 504; Coach v3 content; bugs patched), Sprint 6 (polish + EVP demo deploy) is the final sprint. Demo is now Blaze-product-accurate.
