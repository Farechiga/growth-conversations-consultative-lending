# Sprint 8 — Multi-Track Artifacts with FactorCapture Linkage

**Prompt for Claude Code. Single checkpoint. Multi-Track artifact support for fixture Members. FactorCapture-to-parameter linkage with auto-population. Missing-parameter capture cueing with two-mode capture (Member-confirmed vs banker-estimate). Two new artifact templates for TRACK-001 LOC and TRACK-002 Business Vehicle Loan. Estimated 2.5-3 effective build days CC time.**

## Pre-flight context

Sprint 7a-patch shipped clean. Sprint 6 work is staged locally but deployment is held. Sprint 8 ships next, then Sprint 6 deploys with Sprint 8 included.

Visual review surfaced that the current artifact system has architectural gaps:

1. Each Member has only one artifact regardless of which Track is selected. When banker switches Track context (e.g., comparing SBA 504 vs CRE Term Loan structures for Cygnus), the artifact doesn't switch.

2. Artifact parameters are entered manually by the banker even when the same values exist as captured FactorCaptures. The FactorCapture-to-Model parameter linkage was deferred in Sprint 5d Note 13.

3. There's no mechanism to surface what factors are missing when an artifact can't be fully populated. Banker sees blank artifact without knowing what's needed.

4. 2 of 10 Tracks (TRACK-001 Working Capital LOC, TRACK-002 Business Vehicle Loan) lack artifact templates. These need to ship to complete lending product coverage.

Sprint 8 closes these gaps with a coordinated set of features:
- Multi-Track artifact support per Member (fixtures only; synthetic Members stay single-Track)
- ArtifactTemplate parameter schema gets `source_factor_id` field for auto-population
- Renderer: pulls captured FactorCapture values for source-linked parameters
- Missing-parameter CTAs: when factors aren't captured, surface capture cues directly in the artifact view
- Two-mode capture: banker chooses "Capture with Member" or "Banker estimate" at the artifact-cued capture point
- 2 new artifact templates for TRACK-001 LOC and TRACK-002 Business Vehicle Loan
- Backfill `source_factor_id` mapping on existing 8 templates

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level) — Section 9 (artifact template specs)
2. `BUSINESS_FACTOR_MATRIX_v1.md` (factor catalog with FACTOR-NNN IDs)
3. `ARCHITECTURE_V2.md`
4. `Synthetic data/SYNTHETIC_DATA_stage1_branches_and_bankers.md` through `stage5_aggregate_metrics.md`
5. Existing artifact template implementation: `prisma/seed-artifact-templates.ts`, `lib/artifact-template.ts`, `app/v2/members/[id]/artifact-template-render.tsx`
6. Sprint 5d Block C (artifact template parameterized infrastructure)
7. Sprint 5d Note 13 — FactorCapture-to-Model parameter linkage deferral context

If any document is missing, stop and surface to Francisco.

**Approved decisions (already locked through earlier conversation):**

- Multi-Track applies to fixtures only (Cygnus, Northland, Jenny, Riverside). Synthetic Members stay single-Track.
- Pipeline value handling: each Member carries one total sized opportunity (not per-Track). Stays at ~$147M.
- Two-mode capture surfaces only at artifact missing-parameter CTAs. Standard + Quantify defaults to member_confirmed mode.
- Fixture multi-Track distribution:
  - **Cygnus:** TRACK-008 SBA 504 (existing artifact) + TRACK-003 CRE Term Loan (new artifact — comparison structure)
  - **Northland:** TRACK-002 Business Vehicle (new template required) + TRACK-007 Equipment & Machinery (existing template — broader fleet investment)
  - **Jenny:** TRACK-001 Working Capital LOC (new template required) + TRACK-010 Business Visa (existing template — Blaze-current comparison)
  - **Riverside Catering:** TRACK-001 Working Capital LOC (new template — single Track, stage-skipping pattern preserved)
- Sprint 6 deployment held until Sprint 8 ships. Single deployment cycle after Sprint 8.

## What ships in this sprint (8)

Nine blocks across four phases. Single checkpoint.

**Phase 1 — Schema foundations:**
- **Block A — Schema changes (multi-Track, capture_mode, source_factor_id).**

**Phase 2 — Artifact templates:**
- **Block B — Two new artifact templates (TRACK-001 LOC + TRACK-002 Business Vehicle Loan).**
- **Block C — Backfill source_factor_id on existing 8 templates.**

**Phase 3 — Renderer + capture cueing:**
- **Block D — Artifact renderer pulls from FactorCaptures.**
- **Block E — Missing-parameter CTAs with two-mode capture.**
- **Block F — Track context toggle for multi-Track artifact switching.**

**Phase 4 — Fixture data + governance:**
- **Block G — Fixture multi-Track data updates.**
- **Block H — Visual treatment for banker-estimate values.**
- **Block I — Governance updates.**

Sprint 8 does NOT ship: synthetic Member multi-Track expansion; mode toggle on every + Quantify form; Sprint 7b drill-downs; production deployment (held until Sprint 8 ships clean).

---

## Block A — Schema changes

### A.1 Member multi-Track support (fixtures only)

Schema update. Add ability for fixtures to have multiple active Tracks. Two implementation options:

**Option (a):** Modify `Member.current_track_id` to `Member.active_track_ids: String[]` (JSON array). Single field; lighter migration.

**Option (b):** Add join table `MemberTrack(member_id, track_id, is_primary, ...)`. Cleaner relational model; supports per-Member-per-Track metadata.

CC's choice based on existing schema conventions. Document in BUILD_LOG.

For both options, preserve a concept of "primary Track" (for ranking displays). Other Tracks are secondary cultivation paths.

Migration: existing Members keep their current Track as primary. Fixture Members get additional Tracks added per Section 7 fixture data updates.

### A.2 FactorCapture capture_mode field

Add to FactorCapture entity:

```prisma
capture_mode  String  @default("member_confirmed")  // 'member_confirmed' | 'banker_estimate'
```

All existing FactorCaptures default to 'member_confirmed' on migration. New field appears only at artifact missing-parameter capture points (per Block E).

### A.3 ArtifactTemplate parameter source_factor_id

Update `ArtifactTemplate.parameter_schema` to support `source_factor_id` per parameter:

```json
{
  "parameters": [
    {
      "key": "capacity_utilization",
      "label": "Capacity utilization",
      "type": "percentage",
      "source_factor_id": "FACTOR-006",
      "required": true
    }
  ]
}
```

When `source_factor_id` is present, the renderer attempts to pull the value from the Member's FactorCapture for that factor. If captured, the parameter auto-populates. If not captured, the parameter is "missing" and surfaces a capture CTA (per Block E).

Not all parameters have source_factor_id. Some are purely banker-entered (e.g., the specific loan amount being modeled, which doesn't have a corresponding factor). Those continue working as before.

### A.4 Migration steps

Single Prisma migration:
- Add Member multi-Track field (either option a or b)
- Add FactorCapture.capture_mode with default 'member_confirmed'
- ArtifactTemplate.parameter_schema is already Json type; no schema change needed (source_factor_id is a JSON field within)
- Preserve all existing data

### A.5 Acceptance criteria

- [ ] Schema migration applies cleanly
- [ ] Member entity supports multiple active Tracks (fixture or all; CC's implementation choice)
- [ ] FactorCapture has capture_mode field with default 'member_confirmed'
- [ ] All existing FactorCaptures retain member_confirmed mode
- [ ] ArtifactTemplate.parameter_schema supports source_factor_id (no schema change needed; JSON convention only)
- [ ] `pnpm tsc --noEmit` clean
- [ ] Existing fixtures still render correctly after migration

---

## Block B — Two new artifact templates

### B.1 ARTIFACT-TEMPLATE-009 — Working Capital LOC smoothing chart (TRACK-001)

Working Capital LOC artifact for event_services and other seasonal Members. The artifact visualizes how a credit line smooths seasonal cashflow gaps.

**Title:** Seasonal cashflow smoothing summary

**Description:** Working Capital line of credit sized to bridge slow-season cashflow gaps. The chart shows historical seasonal pattern and how the LOC drawdown/repayment cycle smooths revenue troughs.

**parameter_schema:**

```json
{
  "parameters": [
    {"key": "annual_revenue_band", "label": "Annual revenue", "type": "currency", "source_factor_id": "FACTOR-027", "required": true},
    {"key": "seasonal_variance", "label": "Seasonal variance %", "type": "percentage", "source_factor_id": "FACTOR-026", "required": true},
    {"key": "slow_season_gap", "label": "Slow-season cashflow gap", "type": "currency", "source_factor_id": "FACTOR-008", "required": true},
    {"key": "requested_credit_limit", "label": "Requested credit limit", "type": "currency", "source_factor_id": "FACTOR-018", "required": true},
    {"key": "draw_pattern", "label": "Expected draw pattern", "type": "select", "options": ["Q1 heavy", "Q4 heavy", "Mid-year build", "Mixed"], "required": true},
    {"key": "repayment_window", "label": "Repayment window (months)", "type": "integer", "default": 6, "required": true}
  ]
}
```

**output_summary_template:**

```
Annual revenue {annual_revenue_band}. Seasonal variance {seasonal_variance}. Slow-season cashflow gap reaches {slow_season_gap}. Proposed LOC of {requested_credit_limit} smooths the cycle: draw during {draw_pattern} months, repay over {repayment_window} months as strong-season revenue flows in.
```

**structural_content:**

```json
{
  "type": "cashflow_smoothing",
  "chart_spec": {
    "x_axis": "month",
    "y_axis": "cashflow",
    "series": ["revenue", "expenses", "loc_drawdown", "loc_repayment"],
    "annotation": "LOC bridges the slow-season cashflow gap"
  },
  "share_button": {
    "label": "Mark as shared with Member"
  }
}
```

**member_type_applicability:** ["event_services", "food_services", "retail", "professional_services", "construction"]

### B.2 ARTIFACT-TEMPLATE-010 — Business Vehicle Loan financing summary (TRACK-002)

Business Vehicle Loan artifact for maintenance_services and similar Members with vehicle/fleet needs.

**Title:** Business Vehicle Loan financing summary

**Description:** Vehicle financing structured to match the operational pattern of the business. The artifact shows monthly debt service against the operational revenue trajectory and demonstrates how the vehicle accelerates capacity expansion.

**parameter_schema:**

```json
{
  "parameters": [
    {"key": "vehicle_type", "label": "Vehicle type", "type": "select", "options": ["Service truck", "Box truck", "Van", "Multiple vehicles (fleet)", "Specialty equipment vehicle"], "required": true},
    {"key": "vehicle_count", "label": "Vehicles in transaction", "type": "integer", "default": 1, "required": true},
    {"key": "purchase_price", "label": "Total purchase price", "type": "currency", "source_factor_id": "FACTOR-015", "required": true},
    {"key": "down_payment", "label": "Down payment", "type": "currency", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "computed": true, "computation": "purchase_price - down_payment"},
    {"key": "term_months", "label": "Term (months)", "type": "integer", "default": 60, "helper": "Blaze offers 36-84 months for business vehicles"},
    {"key": "rate_type", "label": "Rate type", "type": "select", "options": ["Fixed", "Variable"], "required": true},
    {"key": "monthly_debt_service", "label": "Monthly debt service", "type": "currency", "required": true},
    {"key": "capacity_utilization_now", "label": "Current capacity utilization", "type": "percentage", "source_factor_id": "FACTOR-006", "required": true},
    {"key": "demand_exceeding_capacity", "label": "Demand exceeding capacity?", "type": "boolean", "source_factor_id": "FACTOR-007", "required": true},
    {"key": "expected_capacity_uplift", "label": "Expected capacity uplift with new vehicle(s)", "type": "percentage", "required": true}
  ]
}
```

**output_summary_template:**

```
{vehicle_count} {vehicle_type} at {purchase_price}. Loan of {loan_amount} after {down_payment} down. Monthly payment {monthly_debt_service} over {term_months} months. With capacity at {capacity_utilization_now} and demand exceeding capacity at {demand_exceeding_capacity}, the new vehicle(s) enable an estimated {expected_capacity_uplift} capacity increase — converting turn-aways into served customers.
```

**structural_content:**

```json
{
  "type": "financing_summary",
  "summary_lines": [
    "Vehicle: {vehicle_count} {vehicle_type}",
    "Cost: {purchase_price} purchase, {down_payment} down, {loan_amount} financed",
    "Terms: {term_months} months at {rate_type}",
    "Monthly debt service: {monthly_debt_service}",
    "Capacity context: {capacity_utilization_now} utilization, demand exceeding capacity",
    "Expected outcome: {expected_capacity_uplift} capacity uplift"
  ],
  "share_button": {
    "label": "Mark as shared with Member"
  }
}
```

**member_type_applicability:** ["maintenance_services", "construction", "food_services", "event_services"]

### B.3 Acceptance criteria

- [ ] ARTIFACT-TEMPLATE-009 (TRACK-001 LOC smoothing) seeded
- [ ] ARTIFACT-TEMPLATE-010 (TRACK-002 Vehicle financing) seeded
- [ ] Both templates render correctly with sample parameters in + Model form
- [ ] source_factor_id references valid FACTOR-NNN IDs from business factor matrix
- [ ] member_type_applicability matches Member-Type matrix from Stage 2

---

## Block C — Backfill source_factor_id on existing templates

### C.1 Templates to update

Existing 8 artifact templates need `source_factor_id` mapping for parameters where a corresponding factor exists:

**ARTIFACT-TEMPLATE-001 (TRACK-003 CRE acquisition):**
- `acquisition_price` → FACTOR-019 (property_acquisition_amount) if exists; otherwise banker-entered
- `loan_amount` → banker-entered
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-002 (TRACK-004 SBA 7(a)):**
- `loan_amount_requested` → FACTOR-020 (requested_loan_amount) if exists
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-003 (TRACK-006 Investment property):**
- `property_purchase_price` → FACTOR-019 if exists
- `dscr` → may map to FACTOR-NNN if defined
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-004 (TRACK-007 Equipment & Machinery):**
- `equipment_cost` → FACTOR-016 (equipment_replacement_cost_sized) if exists
- `equipment_aging` → FACTOR-010
- `capacity_utilization` → FACTOR-006
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-005 (TRACK-009 PACE):**
- `energy_improvement_target` → FACTOR-031
- `energy_improvement_cost` → FACTOR-015
- `pace_eligibility_confirmed` → FACTOR-030
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-006 (TRACK-010 Business Visa):**
- `requested_credit_limit` → FACTOR-018
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-007 (TRACK-011 Unsecured Loan):**
- `requested_loan_amount` → FACTOR-020
- Other parameters → banker-entered

**ARTIFACT-TEMPLATE-008 (TRACK-008 SBA 504 roadmap):**
- `current_stage` → no factor mapping (this is per-deal state, not a captured factor)
- Other content is roadmap-based, not factor-driven

### C.2 Factor ID verification

Use `BUSINESS_FACTOR_MATRIX_v1.md` as authoritative source for factor IDs. If a factor referenced above doesn't exist, document in BUILD_LOG and proceed with banker-entered parameter for that field.

### C.3 Acceptance criteria

- [ ] All 8 existing templates updated with source_factor_id where mapping exists
- [ ] All source_factor_id references valid FACTOR-NNN IDs
- [ ] Parameters without factor mapping continue as banker-entered (no regression)
- [ ] Existing fixture artifacts still render correctly (Cygnus SBA 504 roadmap unchanged)

---

## Block D — Artifact renderer pulls from FactorCaptures

### D.1 Renderer behavior

Current state: + Model form artifact rendering uses parameters entered by banker in form. No FactorCapture lookup.

New state: When banker views an artifact, the renderer:
1. For each parameter with `source_factor_id`, look up the Member's FactorCapture for that factor (within the relevant Track context)
2. If captured: auto-populate the parameter value
3. If not captured: parameter is "missing"; surface CTA per Block E
4. For parameters without `source_factor_id`: use banker-entered value (existing behavior)

### D.2 Capture scoping

Each FactorCapture has both `member_id` and (optionally) a Track context. When pulling values for an artifact, prioritize:
1. FactorCapture with matching member_id + track_id (most specific)
2. FactorCapture with matching member_id only (general, no Track scope)

If multiple FactorCaptures exist for the same factor (e.g., banker captured twice with different values), use the most recent.

### D.3 capture_mode preservation

When auto-populating from FactorCapture, the renderer preserves the capture_mode. Banker-estimate values are flagged visually per Block H.

### D.4 Computed parameters

Parameters with `computed: true` still compute from other parameters per their `computation` formula. If their inputs auto-populate from FactorCaptures, the computed value auto-populates downstream.

Example: `loan_amount` computed from `purchase_price - down_payment`. If purchase_price auto-populates from FACTOR-015 captured value, and down_payment is banker-entered, loan_amount computes automatically.

### D.5 Editing behavior

Banker can override any auto-populated value by editing in the form. This creates a new FactorCapture (or updates the existing one per existing recapture pattern from Sprint 5b.2).

If banker edits an auto-populated value, the override is captured as a new FactorCapture in member_confirmed mode (since banker is in the conversation while editing).

### D.6 Acceptance criteria

- [ ] Renderer pulls FactorCapture values for source_factor_id parameters
- [ ] Auto-population works for Cygnus SBA 504 artifact (e.g., owner-occupancy confirmed should auto-populate)
- [ ] Banker can override auto-populated values in form
- [ ] capture_mode preserved on display (sets up Block H visual treatment)
- [ ] Computed parameters compute correctly from auto-populated inputs
- [ ] Performance: no noticeable delay in artifact rendering due to FactorCapture lookup

---

## Block E — Missing-parameter CTAs with two-mode capture

### E.1 Missing-parameter detection

For each artifact's required parameter with `source_factor_id`:
- If FactorCapture exists for that factor: parameter populated
- If FactorCapture does NOT exist: parameter is "missing"; surface CTA

For parameters without source_factor_id: continue as banker-entered (no CTA needed; if banker hasn't filled it, the form requires it before saving).

### E.2 CTA rendering

When an artifact has missing required parameters, the artifact view shifts to hybrid rendering:
- Populated parameters render with their captured values
- Missing parameters render as CTA cards (instead of as blank fields)

Visual treatment of missing-parameter CTA card:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ MISSING                                              │
│                                                         │
│  Capacity utilization (FACTOR-006)                      │
│  Required for: Vehicle financing summary                │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Capture with Member │  │ Banker estimate          │  │
│  └─────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

Each missing parameter gets one card. Multiple missing parameters → multiple cards.

### E.3 Two-mode capture flow

Click "Capture with Member" CTA:
- Opens + Quantify form with factor pre-selected
- `capture_mode` set to `member_confirmed`
- After save, FactorCapture created with member_confirmed mode
- Artifact view refreshes; the parameter now populated; CTA card replaced with populated value

Click "Banker estimate" CTA:
- Opens + Quantify form with factor pre-selected
- `capture_mode` set to `banker_estimate`
- Helper text on form: "Recording your working assumption. Mark as banker estimate so we know to confirm with the Member later."
- After save, FactorCapture created with banker_estimate mode
- Artifact view refreshes; the parameter now populated with visual flag per Block H

### E.4 Form pre-fill

When + Quantify form opens from a missing-parameter CTA, pre-fill:
- factor_id: from CTA's source_factor_id
- capture_mode: from CTA's mode choice (member_confirmed or banker_estimate)
- track_context_id: current Track being viewed

Banker fills the actual value and any other fields. Saves. FactorCapture created.

### E.5 Acceptance criteria

- [ ] Missing-parameter CTAs render when source-linked factor not captured
- [ ] CTA card visually clear (warning icon, factor name, two mode buttons)
- [ ] "Capture with Member" → opens + Quantify in member_confirmed mode
- [ ] "Banker estimate" → opens + Quantify in banker_estimate mode with helper text
- [ ] After capture, artifact view refreshes with populated parameter
- [ ] CTA disappears when parameter populated
- [ ] Form pre-fill (factor, mode, Track) works correctly

---

## Block F — Track context toggle for multi-Track artifacts

### F.1 Member growth conversation page Track context

Current state: each Member page has a primary Track context. Sidebar shows "LENDING PRODUCT: [Track]" with no toggle.

New state: For fixtures with multi-Track support, sidebar shows the active Track with a toggle/dropdown to switch between the Member's active Tracks.

### F.2 Toggle UI

Sidebar treatment:

```
LENDING PRODUCT: SBA 504 ▼
─────────────────────────
  ● SBA 504 (primary)
  ○ CRE Term Loan
```

Click to switch. Active Track context updates throughout the page:
- Track context in sidebar
- Artifact in sidebar (switches to artifact for the selected Track)
- Coach surface (if Track-aware)
- Phase popups (filter to selected Track context)

### F.3 URL state

Track context selection reflects in URL:
- `/v2/members/[id]?track=TRACK-008` (default to primary; switch updates parameter)

Browser back-button works to revert Track context switches.

### F.4 Single-Track Members

For Members with only one active Track (most non-fixtures), the toggle doesn't render. Just shows current Track context without dropdown affordance.

### F.5 Acceptance criteria

- [ ] Sidebar Track context shows dropdown for multi-Track fixtures
- [ ] Click switches active Track context across the page
- [ ] Artifact, Coach, popups all update to reflect new Track
- [ ] URL parameter ?track=TRACK-NNN reflects selection
- [ ] Browser back works correctly
- [ ] Single-Track Members don't show toggle (no regression)

---

## Block G — Fixture multi-Track data updates

### G.1 Per-fixture Track distribution

**Cygnus Bioscience:**
- Primary Track: TRACK-008 SBA 504 (preserve existing)
- Secondary Track: TRACK-003 CRE Term Loan (new — comparing structures)
- New Model for TRACK-003: CRE acquisition financing summary template (ARTIFACT-TEMPLATE-001). Banker estimates or captures the CRE-specific parameters.

**Northland HVAC:**
- Primary Track: TRACK-002 Business Vehicle Loan (preserve as primary; was secondary before)
- Secondary Track: TRACK-007 Equipment & Machinery (existing template)
- Model for TRACK-002: Business Vehicle Loan financing summary (ARTIFACT-TEMPLATE-010, new from Block B)
- Model for TRACK-007: Equipment financing ROI projection (ARTIFACT-TEMPLATE-004, existing)

**Jenny's Catering:**
- Primary Track: TRACK-001 Working Capital LOC (preserve)
- Secondary Track: TRACK-010 Business Visa (new — Blaze-current option for comparison)
- Model for TRACK-001: Working Capital LOC smoothing summary (ARTIFACT-TEMPLATE-009, new from Block B)
- Model for TRACK-010: Business credit card limit and use plan (ARTIFACT-TEMPLATE-006, existing)

**Riverside Catering:**
- Primary Track: TRACK-001 Working Capital LOC
- No secondary Track (preserves stage-skipping pattern; single Track with incomplete evidence)
- Model for TRACK-001: Working Capital LOC smoothing summary (ARTIFACT-TEMPLATE-009)
- Stage-skip pattern: some required FactorCaptures missing; artifact shows missing-parameter CTAs (demonstrating Block E behavior cleanly)

### G.2 FactorCapture data updates

For each fixture × Track combination, verify FactorCaptures exist for source-linked parameters. Where missing, decide whether to:
- Add captured FactorCapture (Member-confirmed mode) to populate the artifact, OR
- Leave missing to demonstrate the CTA behavior

My recommendation: each fixture should have at least one missing-parameter CTA showing in their secondary Track artifact. Demonstrates the feature. Cygnus's TRACK-003 CRE artifact is a good candidate — Cygnus's evidence focused on SBA 504; CRE-specific factors (e.g., DSCR, exact property type) may not be captured yet. Renders as CTAs.

### G.3 Banker estimate examples

For demo richness, include one or two banker-estimate captures per fixture. Example: Northland's Track-002 artifact has Member-confirmed FACTOR-006 (capacity utilization 88%) but banker-estimate FACTOR-007 (demand exceeding capacity — banker hasn't formally confirmed but is working assumption). Demonstrates the visual treatment from Block H.

### G.4 Stage 2 synthetic data preservation

Synthetic Members stay single-Track (no changes to Stage 2 data). Pipeline value, member counts, dashboard aggregates unchanged.

### G.5 Acceptance criteria

- [ ] 4 fixtures have multi-Track distribution per Section G.1
- [ ] Each Member-Track combination has a Model record with appropriate template
- [ ] Per-Track FactorCaptures wired to source_factor_id parameters where captured
- [ ] At least one fixture × Track has missing-parameter CTAs (demonstrating Block E)
- [ ] At least one fixture has a banker-estimate capture (demonstrating Block H visual treatment)
- [ ] Synthetic Members unchanged (no multi-Track expansion)
- [ ] Dashboard hero metrics, drill-downs unchanged

---

## Block H — Visual treatment for banker-estimate values

### H.1 Banker-estimate visual flag

Parameters auto-populated from banker_estimate captures render with visual flag:

```
Capacity utilization
88% · banker estimate (pending Member confirmation)
```

Treatment:
- Value renders normally (e.g., "88%")
- Small inline flag: "banker estimate" in muted/italic
- Optional secondary line: "(pending Member confirmation)" — fainter, subtle

In artifact summary text, banker-estimate values can be visually distinct (italic, lighter weight, or with parenthetical note).

### H.2 Confirmation conversion path

When banker captures the same factor again in member_confirmed mode (e.g., after confirming with Member in next conversation), the banker_estimate FactorCapture is superseded. The artifact updates to show the member_confirmed value without the visual flag.

This produces a natural "banker captures estimate → discusses with Member next time → confirms" workflow.

### H.3 Member-confirmed values

Default visual treatment. No additional flags. (Stays as current behavior — captured values render as captured values.)

### H.4 Mixed-mode artifacts

When an artifact has both member_confirmed and banker_estimate values, the artifact display reflects both clearly:
- Member-confirmed values: standard treatment
- Banker-estimate values: flagged per Section H.1
- Output summary template can include conditional language: "(parameters marked as estimates pending Member confirmation)"

### H.5 Acceptance criteria

- [ ] banker_estimate values render with "banker estimate" visual flag
- [ ] member_confirmed values render normally (no regression)
- [ ] Mixed-mode artifacts clearly distinguish both types
- [ ] Re-capture in member_confirmed mode supersedes banker_estimate
- [ ] Visual treatment readable and clear without being heavy

---

## Block I — Governance updates

### I.1 BUILD_LOG entry

Sprint 8 entry covering:
- Schema changes (Member multi-Track, FactorCapture.capture_mode, ArtifactTemplate parameter source_factor_id)
- 2 new artifact templates (TRACK-001 LOC, TRACK-002 Business Vehicle)
- Backfill source_factor_id on existing 8 templates
- Renderer FactorCapture auto-population
- Missing-parameter CTAs with two-mode capture
- Track context toggle for fixtures
- Fixture multi-Track data updates
- Visual treatment for banker-estimate values

### I.2 OPEN_QUESTIONS amendments

- Add Q-G1: "Multi-Track for synthetic Members deferred to Pilot. Demo-scale uses fixtures only."
- Add Q-G2: "Two-mode capture surface on every + Quantify form deferred to Pilot. Demo surfaces mode choice only at artifact CTAs."
- Add Q-G3: "FactorCapture audit trail for banker_estimate → member_confirmed conversions. Pilot may want explicit conversion history."

### I.3 Architectural notes for Pilot

- Note 19 — Multi-Track Member cultivation. Demo's 4 fixtures have multi-Track artifacts. Pilot should extend to all Members; synthetic Members stay single-Track for demo simplicity.
- Note 20 — Two-mode capture (Member-confirmed vs banker-estimate). Demo surfaces this distinction at artifact missing-parameter CTAs. Pilot may want mode-aware capture throughout the system.
- Note 21 — Resolves Sprint 5d Note 13. FactorCapture-to-Model parameter linkage implemented in Sprint 8.

### I.4 CLAUDE.md manifest update

- Add ARTIFACT-TEMPLATE-009 and ARTIFACT-TEMPLATE-010 to manifest
- Document multi-Track schema change
- Document capture_mode field

### I.5 Acceptance criteria

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 19-21 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Reporting back

When Sprint 8 is complete, report back with:

1. Confirmation that Blocks A-I shipped per acceptance criteria
2. Visual probes:
   - Cygnus growth conversation page: Track context toggle shows SBA 504 + CRE Term Loan; switching updates artifact
   - Northland: Track toggle shows Business Vehicle + Equipment; switching updates artifact
   - Jenny: Track toggle shows Working Capital LOC + Business Visa; switching updates artifact
   - Riverside: single Track (Working Capital LOC) with missing-parameter CTAs visible (demonstrating stage-skip + CTA behavior)
   - Cygnus TRACK-003 CRE Term Loan artifact: at least one missing-parameter CTA visible
   - Missing-parameter CTA click → opens + Quantify form with mode pre-selected
   - "Capture with Member" → creates member_confirmed FactorCapture; artifact refreshes
   - "Banker estimate" → creates banker_estimate FactorCapture; visual flag visible on artifact value
   - Banker-estimate value with visual flag clearly distinguishable
   - URL parameter ?track=TRACK-NNN reflects Track context
3. Sample workflow: open Cygnus's CRE artifact (TRACK-003), capture a missing parameter as banker_estimate, view the visual flag, then re-capture as member_confirmed to demonstrate the conversion
4. Schema verification: `pnpm tsc --noEmit` clean, `pnpm exec next build` clean, all routes return 200
5. Any deviations from spec with rationale

After Sprint 8 ships and visual review confirms, Sprint 6 deployment to Vercel ships next (single deployment cycle with both Sprint 6 polish + Sprint 8 features included).

---

## Estimated scope

2.5-3 effective build days CC time.

Largest blocks:
- **Block D (renderer pulls from FactorCaptures)** — substantial logic + edge cases; ~0.5-1 day CC
- **Block E (missing-parameter CTAs + two-mode capture)** — new UI pattern + form integration; ~0.5-1 day CC
- **Block A (schema changes)** — migration + multi-Track support; ~0.5 day CC
- **Block B (2 new templates)** — template specs + seed; ~0.5 day CC
- **Block G (fixture multi-Track data)** — 4 fixtures × 2-3 Tracks; ~0.5 day CC

Smaller blocks (C, F, H, I) are routine.

After Sprint 8 ships and Sprint 6 deployment lands, build is EVP demo-ready with the full architectural depth visible. Sprint 7b drill-downs (Member-Type matrix, conversion-per-pathway, handoff velocity, Sankey flow, insight authorship pipeline, business type) deferred to post-demo enhancement.
