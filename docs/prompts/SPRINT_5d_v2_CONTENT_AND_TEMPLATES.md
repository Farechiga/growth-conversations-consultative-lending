# Sprint 5d — Content Rewrite, Artifact Templates, Bug Patches

**Prompt for Claude Code. Single checkpoint. Applies the comprehensive content rewrite from `CONTENT_REWRITE_v1.md`. Builds 7 parameterized artifact templates plus rewrites the SBA 504 partnership map. Three bug patches. Seeds one stage-skipping Member for portfolio demo coverage. Estimated 4-6 effective build days CC time.**

## Pre-flight context

Sprint 5c shipped Blaze product realignment (10 active Tracks, 8 Blaze + 2 future-expansion). Sprint 5d-pre shipped the comprehensive Member-Type rename clean (greps return 0 for old IDs; fixture Member-Type tags correct; all routes HTTP 200).

Sprint 5d builds on the renamed foundation. Visual review of Sprint 5c surfaced six categories of issues that needed editorial work before EVP demo:

- Voice and clarity throughout banker-facing surfaces (banker shorthand and consultant jargon mixed with banker-natural voice)
- 7 of 10 active Tracks had no artifact templates
- SBA 504 Capital event partnership map referenced wrong specialists post-Sprint-5c
- Three bugs (+ refresh CTA factor pre-selection; insights only on Discover phase; SizingMeasurement copy)
- Vocabulary inconsistencies across surfaces
- Stage-skip portfolio surface had empty state with no example to demonstrate

Francisco completed comprehensive editorial pass producing `CONTENT_REWRITE_v1.md` covering: voice fundamentals, Coach content rewrite, capture form copy rewrite, CTA labels, popup copy, sidebar copy, Insight Engine surfaces, Pattern library editorial, 7 new parameterized artifact templates, SBA 504 partnership map rewrite, vocabulary standardization, surface decisions locked.

Sprint 5d applies the rewrite across the build, builds the artifact template infrastructure, patches the three bugs, and seeds the stage-skip fixture. Member-Type rename already shipped in Sprint 5d-pre.

**Read these governance documents before starting:**

1. `CONTENT_REWRITE_v1.md` (root level) — comprehensive rewrite source; THE primary spec for this sprint
2. `BUSINESS_FACTOR_MATRIX_v2.md` (root level)
3. `INSIGHT_PATTERN_LIBRARY_v2_additions.md` (root level)
4. `MEMBER_TYPE_GUIDANCE_v3_addendum.md` (root level)
5. `ARCHITECTURE_V2.md`
6. `COMPLIANCE.md` §10.2

If any document is missing, stop and surface to Francisco.

**Architecture authority:** `CONTENT_REWRITE_v1.md` Section 10 vocabulary table wins for surface naming; ARCHITECTURE_V2.md wins for objective architecture; existing schema patterns extend additively where possible.

**Approved decisions (already locked through editorial review):**

- Section 3.1 Ask form title: "Capture what the Member said"
- Section 5.1 open thread label: "open thread" (small text label below row, alongside coral ring visual)
- Section 3.1 Ask form Type field: "Type of statement"
- Section 4.3 specialist handoff CTA: "Hand off to SBA 504 specialist" (avoid doubled SBA)
- Pattern rewrite language fine for all rewrites in Section 8
- All artifact template details fine for demo (Section 9 templates ship as specified)
- Cross-Track upsell language kept (Section 2.2.3 maintenance-services Consult bullet 6)
- Page title rewrites confirmed: "Member portfolio" / "Open threads" / "Members who skipped earlier work"
- Seed one stage-skipping Member (Section 4.7 review item)

## What ships in this sprint (5d)

Ten blocks across four phases. Single checkpoint, delimited diffs.

**Phase 1 — Artifact template infrastructure:**
- **Block A — ArtifactTemplate entity and parameterized template support.**
- **Block B — Seed 8 artifact templates** (7 new + SBA 504 partnership map rewrite).

**Phase 2 — Content rewrite application:**
- **Block C — Coach content rewrite** (`lib/stage-guidance.ts` MEMBER_TYPE_COACH constants).
- **Block D — Capture form copy rewrite** (six form components).
- **Block E — CTA labels rewrite** (`lib/cta-derivation.ts` and rendering).
- **Block F — Popup-as-workflow + sidebar + Insight Engine surface copy.**
- **Block G — Pattern library editorial integration** (~17 Pattern rewrites).

**Phase 3 — Bug patches:**
- **Block H — Three bug patches.**

**Phase 4 — Fixture and governance:**
- **Block I — Seed stage-skipping Member fixture.**
- **Block J — Governance updates.**

Sprint 5d explicitly does NOT ship: full RBAC permission model (Pilot); Insight Engine novel review surface (Pilot); make-canonical promotion affordance (Pilot); per-banker insight activity coaching analytics (Pilot); cross-Member novel-Insight LLM discovery (Pilot); Track-aware factor filtering in + Quantify (Pilot); Coach catering content shift to Blaze-current products (Pilot).

---

## Block A — ArtifactTemplate entity and parameterized template support

### A.1 Schema

New Prisma entity:

```prisma
model ArtifactTemplate {
  id                          String   @id  // ARTIFACT-TEMPLATE-NNN
  track_id                    String   // FK to TrackTemplate
  
  title                       String   // "CRE acquisition financing summary"
  description                 String   // ~60-100 word description
  
  member_type_applicability   String   // JSON-encoded array
  
  parameter_schema            Json     // structured spec of parameter keys, labels, types, helper text
  output_summary_template     String   // template string with {parameter} placeholders
  structural_content          Json     // structured content body (chart spec / ROI table / roadmap stages)
  
  created_at                  DateTime @default(now())
  
  @@index([track_id])
}
```

### A.2 Parameterized template structure

Each template defines a `parameter_schema` describing the parameters banker fills during + Model capture, and an `output_summary_template` that renders with those parameters.

Example parameter_schema for TRACK-003 CRE acquisition:

```json
{
  "parameters": [
    {"key": "property_type", "label": "Property type", "type": "select", "options": ["Retail", "Warehouse", "Industrial", "Office", "Mixed-use"], "required": true},
    {"key": "acquisition_price", "label": "Acquisition price", "type": "currency", "required": true},
    {"key": "loan_amount", "label": "Loan amount", "type": "currency", "required": true},
    {"key": "ltv_ratio", "label": "LTV ratio", "type": "percentage", "computed": true, "computation": "loan_amount / acquisition_price"},
    {"key": "amortization_years", "label": "Amortization (years)", "type": "integer", "default": 25, "max": 30, "helper": "Blaze offers up to 30-year amortization on qualified properties"},
    {"key": "rate_type", "label": "Rate type", "type": "select", "options": ["Fixed", "Variable"], "required": true},
    {"key": "monthly_debt_service", "label": "Monthly debt service", "type": "currency", "required": true},
    {"key": "dscr", "label": "Debt service coverage ratio", "type": "decimal", "required": true},
    {"key": "borrower_equity", "label": "Borrower equity contribution", "type": "currency", "required": true}
  ]
}
```

Example output_summary_template for the same:

```
{property_type} at ${acquisition_price}. Blaze finances ${loan_amount} at {rate_type}. Monthly debt service ${monthly_debt_service}. The property's cashflow plus the operating business covers debt service {dscr} times over.
```

### A.3 + Model form integration

When banker selects an artifact template in + Model form (per existing artifact dropdown):
1. Form expands to show parameter input fields per template's parameter_schema
2. Banker fills parameters during capture
3. On save, parameters stored as part of the Model record (extend Model schema with `template_id` and `template_parameters` JSON fields)
4. Output summary auto-generated from template + parameters; banker can edit before save

### A.4 Artifact rendering

When banker views captured Model with attached template:
- Title rendered from template.title
- Description rendered from template.description (with parameter substitution where applicable)
- Structural content rendered from template.structural_content with parameter substitution
- Output summary rendered from template.output_summary_template with parameter substitution
- "Mark as shared with Member" button (existing pattern)

### A.5 Acceptance criteria

- [ ] ArtifactTemplate entity defined; migration applies cleanly
- [ ] Model entity extended with `template_id` and `template_parameters` fields
- [ ] + Model form renders parameter inputs when template selected
- [ ] Output summary auto-generates from template; banker can edit
- [ ] Artifact view renders all template components with parameter substitution
- [ ] `pnpm tsc --noEmit` clean

---

## Block B — Seed 8 artifact templates

Build 8 ArtifactTemplate records per `CONTENT_REWRITE_v1.md` Section 9. Each requires title, description, parameter_schema, output_summary_template, structural_content, and member_type_applicability.

### B.1 Template specifications

Reference `CONTENT_REWRITE_v1.md` Section 9 sub-sections for each template:

| Template ID | Track | Title | Source section |
|---|---|---|---|
| ARTIFACT-TEMPLATE-001 | TRACK-003 | CRE acquisition financing summary | 9.1 |
| ARTIFACT-TEMPLATE-002 | TRACK-004 | SBA 7(a) financing structure | 9.2 |
| ARTIFACT-TEMPLATE-003 | TRACK-006 | Investment property cashflow projection | 9.3 |
| ARTIFACT-TEMPLATE-004 | TRACK-007 | Equipment financing ROI projection | 9.4 |
| ARTIFACT-TEMPLATE-005 | TRACK-009 | PACE energy improvement projection | 9.5 |
| ARTIFACT-TEMPLATE-006 | TRACK-010 | Business credit card limit and use plan | 9.6 |
| ARTIFACT-TEMPLATE-007 | TRACK-011 | Unsecured loan terms summary | 9.7 |
| ARTIFACT-TEMPLATE-008 | TRACK-008 | SBA 504 transaction roadmap | 9.8 |

### B.2 SBA 504 partnership map (ARTIFACT-TEMPLATE-008) special handling

This template replaces the current out-of-date Capital event partnership map. Section 9.8 specifies 8 roadmap stages with specific roles per stage. The structural_content for this template uses a different format than the cashflow/ROI templates — it's a roadmap diagram with stages, roles, and a "you-are-here" marker.

Structural content schema for SBA 504 roadmap:

```json
{
  "type": "roadmap",
  "stages": [
    {
      "stage_number": 1,
      "title": "Initial conversation",
      "roles": [{"name": "Scott Brynjolffson", "role": "Relationship banker"}],
      "description": "The starting point. Banker captures business context and confirms owner-occupancy intent."
    },
    {
      "stage_number": 2,
      "title": "Specialist introduction",
      "roles": [{"name": "James Patterson", "role": "SBA specialist"}, {"name": "Scott Brynjolffson", "role": "Relationship banker"}],
      "description": "The SBA specialist joins to walk through SBA 504 structure and confirm fit."
    },
    {
      "stage_number": 3,
      "title": "CDC partner introduction",
      "roles": [{"name": "Diana Reyes", "role": "Certified Development Company partner"}, {"name": "James Patterson", "role": "SBA specialist"}, {"name": "Scott Brynjolffson", "role": "Relationship banker"}],
      "description": "The CDC handles the SBA 504 second-lien piece. The Member meets the CDC partner during this stage."
    },
    {
      "stage_number": 4,
      "title": "Joint financial review",
      "roles": [{"name": "All parties", "role": "Joint working session"}],
      "description": "All parties review the project economics, the 50/40/10 structure, and SBA 504 documentation requirements."
    },
    {
      "stage_number": 5,
      "title": "Underwriting",
      "roles": [{"name": "Blaze commercial credit underwriting", "role": "First-lien underwriting"}, {"name": "CDC underwriting", "role": "Second-lien underwriting"}],
      "description": "Two parallel underwriting tracks coordinated through the SBA specialist."
    },
    {
      "stage_number": 6,
      "title": "Board and approvals",
      "roles": [{"name": "Member's board", "role": "Internal approval"}, {"name": "Blaze loan committee", "role": "First-lien approval"}, {"name": "CDC", "role": "Second-lien approval"}],
      "description": "Member's board reviews and approves on their side. Blaze loan committee approves the first-lien piece. CDC approves the second-lien piece."
    },
    {
      "stage_number": 7,
      "title": "Closing",
      "roles": [{"name": "All parties", "role": "Closing session"}],
      "description": "Bank funds first-lien piece. CDC funds second-lien piece (with SBA debenture). Member funds 10% equity. Property transfer."
    },
    {
      "stage_number": 8,
      "title": "Post-close relationship",
      "roles": [{"name": "Scott Brynjolffson", "role": "Relationship banker"}, {"name": "Treasury team", "role": "Treasury services"}],
      "description": "Treasury services, working capital, and ongoing operating support carry forward."
    }
  ],
  "you_are_here_marker": true,
  "share_button": {
    "label": "Mark as shared with Member",
    "helper_text": "Records that you showed this roadmap to the Member during the conversation. Skip if you're just rehearsing."
  }
}
```

Parameter schema for SBA 504 roadmap is minimal — primarily identifies which stage the Member is currently at:

```json
{
  "parameters": [
    {"key": "current_stage", "label": "Member is currently at", "type": "select", "options": ["1", "2", "3", "4", "5", "6", "7", "8"], "required": true, "helper": "Which stage of the transaction is the Member at right now?"}
  ]
}
```

### B.3 Cygnus migration

Cygnus's existing captured Model "Capital event partnership map" needs to migrate to the new ARTIFACT-TEMPLATE-008 template. Update Cygnus's Model record:
- template_id = "ARTIFACT-TEMPLATE-008"
- template_parameters = {"current_stage": "3"} (or whatever stage Cygnus is currently at per fixture state)

The old hard-coded partnership map text/diagram retires. The artifact view now renders from the template.

### B.4 Acceptance criteria

- [ ] 8 ArtifactTemplate seed records created per Section 9 specs
- [ ] Each template has parameter_schema, output_summary_template, structural_content, member_type_applicability populated
- [ ] Cygnus's existing Model migrates to ARTIFACT-TEMPLATE-008
- [ ] + Model form artifact dropdown shows all 8 templates organized by Track
- [ ] Visual probe: each template renders correctly with sample parameters

---

## Block C — Coach content rewrite

Apply `CONTENT_REWRITE_v1.md` Section 2 to `lib/stage-guidance.ts` MEMBER_TYPE_COACH constants.

### C.1 Replace MEMBER_TYPE_COACH content

Replace existing MEMBER_TYPE_COACH constant with content from `CONTENT_REWRITE_v1.md` Section 2:

- Section 2.1 (Event services) → MEMBER_TYPE_COACH.event_services × 4 phases
- Section 2.2 (Maintenance services) → MEMBER_TYPE_COACH.maintenance_services × 4 phases
- Section 2.3 (Specialty manufacturer) → MEMBER_TYPE_COACH.specialty_manufacturer × 4 phases

### C.2 CTA-eligible bullet integration

Bullets marked `[CTA: + activity · context]` in Section 2 need to be wired with action descriptors per existing Sprint 5b.2 Block G pattern.

CTA action descriptor format:
```typescript
{
  type: 'open_capture_form',
  form: 'quantify' | 'ask' | 'model' | 'reaction' | 'action' | 'insight',
  preselected_factor_id?: string,
  preselected_signal_id?: string,
  preselected_action_type?: string
}
```

### C.3 Acceptance criteria

- [ ] MEMBER_TYPE_COACH constant fully replaced with Section 2 content
- [ ] All CTA-eligible bullets have action descriptors wired
- [ ] Coach surface renders new content for all three Member-Types
- [ ] No banned phrases per COMPLIANCE.md §10.2
- [ ] No regression to Coach surface structure

---

## Block D — Capture form copy rewrite

Apply `CONTENT_REWRITE_v1.md` Section 3 to all six capture form components.

### D.1 Forms to update

Per Section 3 sub-sections:
- 3.1 + Ask form (component + helper text)
- 3.2 + Quantify form (mode toggles, factor labels, sizing checkbox)
- 3.3 + Model form (artifact attachment + parameter inputs from Block A)
- 3.4 + Reaction form
- 3.5 + Action form
- 3.6 + Insight form
- 3.7 Specialist handoff dialog

### D.2 Specific text updates

Reference `CONTENT_REWRITE_v1.md` Section 3 for old → new text mappings. Key updates include:

- Form titles changed to banker-natural (e.g., "Capture Quantify" → "Capture a number")
- Mode toggle labels (e.g., "Lending-product specific" → "Tied to a lending product")
- Helper text added where missing (e.g., sizing checkbox helper)
- Field labels rewritten as questions where natural (e.g., "Value" → "What's the number?")
- Button labels simplified ("Save factor" → "Save")

### D.3 Acceptance criteria

- [ ] All six form components reflect Section 3 text
- [ ] Sizing checkbox copy fully rewritten with helper text
- [ ] No banned phrases
- [ ] Forms function as before; only copy changed

---

## Block E — CTA labels rewrite

Apply `CONTENT_REWRITE_v1.md` Section 4 to `lib/cta-derivation.ts` CTA generation.

### E.1 Layer-by-layer updates

**Layer 1 Class 1A (quantitative):** Format kept as "Capture [factor name]" — already concrete.

**Layer 1 Class 1B (qualitative):** Reformat to "Capture what the Member said about [topic]" pattern for Signal-type CTAs; "Build a cashflow model with the Member" / "Show the Member the smoothing chart" for activity-type CTAs.

**Layer 2 (threshold-uplift):** Reformat to "Re-check [factor name] — currently [value][unit]. If it's [threshold] or higher, the case gets stronger."

**Layer 8 (specialist handoff):** Reformat to "Hand off to the [department] for [Lending product]." Special case for SBA 504: "Hand off to SBA 504 specialist" (avoid doubled SBA per approved decision).

### E.2 Acceptance criteria

- [ ] CTA labels reflect Section 4 rewrites
- [ ] Layer 8 SBA 504 CTA uses approved phrasing ("Hand off to SBA 504 specialist")
- [ ] No "fires stronger support" jargon anywhere in CTA labels
- [ ] CTAs still trigger correct form/dialog actions

---

## Block F — Popup-as-workflow + sidebar + Insight Engine surface copy

Apply `CONTENT_REWRITE_v1.md` Sections 5, 6, and 7.

### F.1 Popup-as-workflow updates (Section 5)

Per Section 5 sub-sections:
- "ALREADY CAPTURED" → "What we've captured"
- Stale day count format: "[N]d · stale" → "[N] days old"
- Open thread visual + label: add small "open thread" text label below row
- Pattern label format: drop "PATTERN-NNN ·" prefix; just show type
- "Implications:" → "Questions to bring up with the Member:"
- Pattern type rendering: "REFRAME" → "Reframe" (sentence case)

### F.2 Sidebar updates (Section 6)

Per Section 6 table:
- "TRACK CONTEXT" → "LENDING PRODUCT"
- "view comparison ↗" → "compare to other lending products ↗"
- "view all [N] lending products ↓" → "see all [N] lending products ↓"
- "ARTIFACT" → "ARTIFACTS" (plural)
- "MACRO" → "OTHER ARTIFACTS"
- "HISTORY" → "PAST CONVERSATIONS"

### F.3 Insight Engine surface updates (Section 7)

Per Section 7 sub-sections:
- Track Performance: "Track Performance" → "Lending product performance"; "Blaze lending products (8)" → "Lending products Blaze offers (8)"; "Future-expansion lending products (2)" → "Lending products Blaze doesn't offer today (2)"; capture density tier labels: "0-2 / 3-6 / 7+" → "A little / some / a lot"
- Member portfolio: "Pending ActionCards" → "Pending follow-ups"; "Stale captures" → "Captures over 90 days old"
- Coverage: "Coverage and indecision" → "Open threads"; "Indecision tag distribution" → "What's holding things up"
- Stage-skip: "Stage-skip" → "Members who skipped earlier work"

### F.4 Acceptance criteria

- [ ] Popup-as-workflow copy reflects Section 5
- [ ] Sidebar copy reflects Section 6
- [ ] All four Insight Engine surface titles and labels reflect Section 7
- [ ] No internal IDs (PATTERN-NNN, FACTOR-NNN, TRACK-NNN) surface to banker

---

## Block G — Pattern library editorial integration

Apply `CONTENT_REWRITE_v1.md` Section 8 Pattern rewrites.

### G.1 Patterns to rewrite

~17 Patterns rewritten per Section 8 sub-sections. Apply rewrites to:
- InsightPattern.content field
- InsightPattern.implication_questions (where rewrites specified)

Specific Pattern IDs with rewrites: PATTERN-001 through PATTERN-007 (most), PATTERN-008, PATTERN-009, PATTERN-011, PATTERN-012, PATTERN-017, PATTERN-021, PATTERN-025, PATTERN-037, PATTERN-038, PATTERN-042, PATTERN-047, PATTERN-050, PATTERN-051, PATTERN-053.

### G.2 Patterns kept as-is

Patterns not listed in Section 8 rewrite tables pass editorial review without changes.

### G.3 Implication question audit

Apply general implication question rewrites per Section 8.10:
- "What does it mean to..." → "What would it look like to..."
- "How does X interact with Y..." → "When X changes, what happens to Y..."
- "Where does X show up..." → "When does X happen..."

Apply where natural; specific implementation review documented in BUILD_LOG.

### G.4 Acceptance criteria

- [ ] All Patterns listed in Section 8 rewrite tables updated
- [ ] Patterns not listed pass through unchanged
- [ ] Implication questions consistent with Section 8.10 patterns
- [ ] No banned phrases per COMPLIANCE.md §10.2
- [ ] Library state: 53 Patterns total (unchanged count from Sprint 5c)

---

## Block H — Three bug patches

### H.1 Bug 1 — + refresh CTA factor pre-selection

**Bug:** Clicking + refresh on stale capture row opens + Quantify form with no factor pre-selected (defaults to first factor in list, which is usually Accounts receivable concentration).

**Diagnosis path:** Trace CTA action descriptor for `refresh_capture` type. Verify `preselected_factor_id` is populated from the stale capture's factor_id and passed through to form. Likely bug: preselectedFactorId prop not flowing through MatrixAwareCapture component initialization.

**Fix:** Ensure + refresh CTA's action descriptor includes the stale FactorCapture's factor_id. Form opens with that factor pre-selected.

**Acceptance:** Inline test — click + refresh on stale capture; form opens with correct factor pre-selected.

### H.2 Bug 2 — Insights only surfacing on Discover phase

**Bug:** Per Francisco's visual review, insights (lightbulb icon, Implications: footer, captured Insight rows) appear on Discover popup but not Measure/Consult/Navigate popups.

**Diagnosis path:** Trace popup-as-workflow component query for matched Patterns and captured Insights. Likely bug: query is filtering by objective="discover" or by Discover-phase Signals only. Should query by current Track context regardless of objective; filter Patterns by signal_tag_scope matching captured Signals visible in current popup; surface captured Insights regardless of which objective phase they were authored in.

**Fix:** Insights surface on every objective popup where matched Patterns or captured Insights exist for the popup's Track context. Apply nesting (Treatment A from Sprint 5b.1 mini-patch) consistently across all phases.

**Acceptance:** Visual probe — open each phase popup (Discover, Measure, Consult, Navigate) for Cygnus, Northland, Jenny; insights surface where matched Patterns/Insights exist.

### H.3 Bug 3 — SizingMeasurement copy fix

**Bug:** Sizing checkbox label "Also save as a SizingMeasurement (surfaces in captured feed as a Sized card)" is opaque jargon.

**Fix:** Apply Section 3.2 + Quantify form copy update:
- Label: "Also show this as a sizing card"
- Helper text (new): "Use this when the value is a magnitude the Member should see at a glance — like a $75K credit limit or 70% capacity utilization."

This is technically a content fix not a bug, but bundle with Block H since it touches form integration.

**Acceptance:** Visual probe — open + Quantify form; sizing checkbox shows new label and helper text.

### H.4 Acceptance criteria

- [ ] Bug 1 patched; + refresh pre-selection works
- [ ] Bug 2 patched; insights surface on all four phase popups
- [ ] Bug 3 patched; sizing checkbox copy clear
- [ ] Inline tests pass for each bug

---

## Block I — Seed stage-skipping Member fixture

### I.1 Purpose

Sprint 5b.2 Stage-skip surface currently shows empty state because no fixtures demonstrate stage-skipping. Per editorial review approved decision, seed one stage-skipping Member to demonstrate the surface doing real work.

### I.2 Stage-skip fixture spec

Add a fourth fixture Member to demonstrate stage-skip detection:

**Fixture name:** Riverside Catering (or similar event_services Member-Type)

**Member-Type:** event_services

**Current Track:** TRACK-001 Working Capital LOC (or alternate event_services Track)

**Stage-skip pattern:** Member has Consult-phase evidence captured (a Model produced, a Reaction captured) but missing Discover-phase required evidence (no Stated growth aspiration captured; no Stated obstacle to growth captured).

**Specifically seed:**
- Model record: "Seasonal cashflow projection" with construction="Banker draft", template_id pointing to seasonal cashflow smoothing chart
- Reaction record: response_value="hesitant", primary_concern="needs more discovery" (or similar)
- Workflow state recompute reflects Consult evidence + missing Discover evidence

**Stage-skip detection logic** should surface this Member on the Stage-skip page with severity indicator showing "Missing Discover."

### I.3 Coach surface and growth conversation page

The new fixture also surfaces in:
- Member portfolio surface (as a Member with stale evidence + missing Discover)
- Coach surface for event_services Member-Type
- Growth conversation page renders normally

### I.4 Acceptance criteria

- [ ] Fourth fixture Member seeded with stage-skipping evidence pattern
- [ ] Stage-skip surface shows the new Member with appropriate severity indicator
- [ ] Member portfolio surface includes the new Member
- [ ] Growth conversation page renders for the new Member
- [ ] Workflow state recomputed correctly

---

## Block J — Governance updates

### J.1 BUILD_LOG.md entry

Sprint 5d entry covering:
- Comprehensive content rewrite applied across all banker-facing surfaces
- 8 ArtifactTemplate records seeded (7 new + SBA 504 partnership map rewrite)
- Parameterized template infrastructure: + Model form parameter inputs, output_summary_template auto-generation
- Three bug patches: + refresh pre-selection; insights-on-all-phases; SizingMeasurement copy
- Stage-skipping fixture seeded for portfolio coverage
- Cross-references to `CONTENT_REWRITE_v1.md`, `BUSINESS_FACTOR_MATRIX_v2.md`, `INSIGHT_PATTERN_LIBRARY_v2_additions.md`

### J.2 OPEN_QUESTIONS amendments

- Add Q-E1: "Track-aware factor filtering in + Quantify: 37 factors organized into 6 categories produces friction. Pilot polish: filter to ~6-8 factors relevant to current Track context."
- Add Q-E2: "Coach catering content references Working Capital LOC (future-expansion product). When Blaze expands product offerings, Coach content shifts from illustrative-LOC to Blaze-current products."

### J.3 Architectural notes for Pilot (continuing 1-12)

Add:
- **Note 13 — ArtifactTemplate parameter validation.** Demo accepts banker free-form parameter input. Pilot needs parameter validation per template schema (currency parsing, percentage range checks, etc.).
- **Note 14 — Member-Type taxonomy evolution.** Demo's three Member-Types broadened in Sprint 5d-pre. Pilot may add more Member-Types as bankers encounter business types not fitting current categories.

### J.4 CLAUDE.md manifest update

Add:
- `CONTENT_REWRITE_v1.md` (Tier 1 hard-rules)
- New entity: ArtifactTemplate
- 8 new ArtifactTemplate IDs
- Bug patch references

### J.5 Acceptance criteria

- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS amendments correct
- [ ] Notes 13-14 added under Architectural notes for Pilot
- [ ] CLAUDE.md manifest updated

---

## Pilot deferrals to honor

Sprint 5d does not ship:
- Full RBAC permission model
- Insight Engine novel review surface
- Make-canonical promotion affordance
- Per-banker insight activity coaching analytics
- Cross-Member novel-Insight LLM discovery
- Track-aware factor filtering in + Quantify
- Coach catering content shift to Blaze-current products
- ArtifactTemplate parameter validation logic
- Async workflow state recomputation

If a question arises during 5d implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively.

---

## Reporting back

When Sprint 5d is complete, report back with:

1. Confirmation that Blocks A-J shipped per acceptance criteria
2. Visual probes:
   - All three existing fixtures (Jenny, Northland, Cygnus) rendering with new Coach content
   - New fixture (Riverside Catering or similar) on Stage-skip surface
   - + Quantify form with new copy + sizing checkbox helper
   - + refresh CTA pre-selecting correct factor
   - Insights surfacing on all four phase popups (Discover, Measure, Consult, Navigate)
   - SBA 504 transaction roadmap rendering for Cygnus's Capital event Model
   - Sample new artifact templates rendering for at least 3 of the 7 new templates (e.g., CRE acquisition financing summary; Equipment financing ROI projection; Investment property cashflow projection)
   - Insight Engine surfaces with new copy
3. Per-fixture sanity check: ranker output, capture counts, workflow state
4. Pattern library state: 53 Patterns; ~17 rewritten per Section 8
5. Any deviations from spec with rationale
6. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan diff structure so each block is delimited.

---

## Estimated scope

4-6 effective build days CC time.

Largest blocks:
- **Block A/B (artifact template infrastructure + 8 templates)** — substantial schema work + parameterized rendering; ~2-2.5 days CC
- **Block C (Coach content rewrite)** — substantial content integration; ~1 day CC
- **Block D (capture form copy)** — six forms updated; ~0.5-1 day CC
- **Block G (Pattern library rewrites)** — ~17 Patterns updated; ~0.5 day CC
- **Block H (three bug patches)** — diagnosis + fix; ~0.5-1 day CC
- **Block I (stage-skip fixture)** — fixture seed + workflow state; ~0.5 day CC

Smaller blocks (E, F, J) are routine.

After Sprint 5d ships and visual review confirms (content rewrites land; artifact templates work; bugs patched; stage-skip fixture demonstrates the surface), Sprint 6 (polish + EVP demo deploy) is the final sprint.
