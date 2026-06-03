# Diagnosis — Models / preview / seed wiring

> Read-only diagnosis · branch `diagnosis/required-field-audit` · HEAD `e8324bc`.
> Evidence from source + the seeded `dev.db` (copied from committed `prisma/seed.db`)
> + a live fetch of the running dev server. No code/schema/seed changes.

A note on "the prior audit": it wasn't available in-session, so the per-visualization
consumption map was reconstructed directly from the chart components and cross-referenced
against the template `parameter_schema`. That cross-reference is what §1 reports.

---

## 1. Required-field audit (schema `required` vs. what the visualization consumes)

**Mechanics that matter:** every chart receives one prop — `parameterValues: Record<string,string>`
— and pulls fields via `num(values, key, fallback)` (`artifact-visualizations/shared.ts:15`).
**Any field with a non-zero fallback is non-essential**: the chart renders without it.
Separately, `required:true` in the schema only drives the red "⚠ Missing parameter" banner
(`artifact-template-render.tsx:147-170`) and the `*` in the builder form — it has **no
connection** to whether the chart needs the value. That disconnect is the source of the
"spurious required" set.

Per template (REQUIRED in schema → consumed by the viz?):

| Template (viz) | Genuinely needed (no fallback → chart degenerates without it) | Spurious-required (schema `required:true`, but viz defaults it or never reads it) |
|---|---|---|
| **004 Equipment ROI** (`cost_of_doing_nothing`) | `loan_amount`, `current_monthly_maintenance`, `monthly_downtime_cost`, `monthly_declined_revenue` | `equipment_type` (label only), `interest_rate` (chart default 8%) |
| **008 SBA 504** (`sba_504_paired`) | `property_value`, `current_stage` (roadmap) | `bank_first_lien_rate` (def 7.5), `cdc_second_lien_rate` (def 5.5), `conventional_rate` (def 8) — all three rates hardcoded in `Sba504StructureComparison.tsx` |
| **010 Vehicle** (`vehicle_capacity_uplift`) | `current_monthly_revenue`, `current_declined_revenue_monthly`, `monthly_debt_service`, `projected_induced_demand_monthly`, `capacity_utilization_now` | `purchase_price`, `down_payment`, `rate_type`, **`demand_exceeding_capacity`** — all `required:true` but **never read by the chart**; `vehicle_type`/`vehicle_count`/`expected_capacity_uplift` have fallbacks |
| **005 PACE** (`pace_monthly_savings`) | `monthly_energy_savings`, `improvement_cost` | `improvement_type` (label), `interest_rate` (def 6), **`current_monthly_energy_cost`** (`required:true` but the chart never references it) |
| **001 CRE Lease/Own** (`lease_vs_own`) | `acquisition_price`, `current_monthly_rent` | `property_type` (never read), `loan_amount` (derived `acquisition_price*0.7`), `interest_rate` (def 7) |
| **003 Inv. Property** (`cashflow_equity_dual`) | `purchase_price`, `monthly_rent`, `monthly_operating_expenses` | `property_type` (never read), `loan_amount` (derived `purchase*0.75`), `interest_rate` (def 7.5) |
| **002 SBA 7(a)** (`growth_trajectory`) | `current_annual_revenue`, `loan_amount`, `expected_year_1_revenue_uplift` | `use_of_proceeds` (label), `interest_rate` (def 8) |
| **007 Unsecured** (`unsecured_opportunity`) | `loan_amount`, `opportunity_value` (+`_low`/`_high` for range) | `opportunity_type`, `opportunity_description` (labels), `interest_rate` (def 11) |
| **006 Business Visa** (`business_visa_capability`) | `proposed_limit`, `expected_monthly_spend`, `annual_operational_spend` | `primary_spend_categories` (fallback "Operational spend") |
| **009 Seasonal** (`cashflow_projection`) | legacy `SectionListRender` (not a Sprint-9 chart) — every field is display-only | n/a |

**Cross-cutting finding:** `interest_rate` is marked `required:true` on **8 of 10** templates,
yet **every** chart hardcodes a fallback rate — so it is *universally* spurious-required.
The genuinely-needed input set is far smaller than the schema implies; the worst offenders are
**010 Vehicle** (4 required fields the chart never reads, incl. the FACTOR-007-linked
`demand_exceeding_capacity`) and **005 PACE** (`current_monthly_energy_cost` required but unused).

---

## 2. Regression check — Prompt 1 (`e8324bc`) vs `fde4ba8`

**Prompt 1 did NOT change which models prompt-for-input vs. render-fully. "Previews no longer
ask for inputs" is pre-existing, not a Prompt-1 effect.**

- `git diff fde4ba8 e8324bc` touches 18 files, but the prompting-decision logic (`missingByKey`,
  `missingBankerParams`, `canEditBankerParams`, `totalMissing` in `artifact-template-render.tsx:116-170`)
  is **byte-for-byte identical** across the two commits.
- The only functional change in the render file is line ~200: `parameterValues` → `parameterValues:
  computedValues` (charts now receive the *resolved* capture-overlaid map instead of raw JSON). That
  changes *which values* charts show, not *whether* inputs are prompted.
- The rest of Prompt 1 is label renames ("Artifacts"→"Models", "Artifact is required."→"Model is
  required.") plus wiring `factorCapturesById` into the **sidebar's** preview dialog (`sidebar.tsx`,
  `workstation-shell.tsx:700`). That made the sidebar prompt *more* accurately, not less.
- The no-prompt-on-preview behavior originates in **`d677d32`** (two commits earlier): `git log -S
  'missingByKey'` and `-S 'canEditBankerParams'` both resolve only to `d677d32`. At `fde4ba8` the main
  popup dialog already received captures (`workstation-shell.tsx:798`), and seeded models already carry
  literal parameter values, so `missingByKey` never fires → preview renders fully without asking.
  That was already true before Prompt 1.

---

## 3. Evidence gating — there is none; the seed over-generates

**What governs whether a model renders for a member: only `active && (template_id || artifact_id)` —
never captured Signals.** `app/v2/members/[id]/page.tsx:334-335` builds sidebar tiles, and `page.tsx:1040`
pushes **every** active model into the feed. No factor/signal/applicability check exists on either path.
`applicability.ts` (`TRACK_APPLICABILITY`) is consulted **only** to style the Track-context dropdown
(`page.tsx:644-647`) — inapplicable tracks are shown muted, never removed, and it does not gate model
rendering at all.

**Models seeded per member (verified in `dev.db`):**

| Member | Active models | Reality |
|---|---|---|
| Jenny (catering) | **10** | one per template 001–010 |
| Northland (HVAC/fleet) | **10** | one per template 001–010 |
| Cygnus (manufacturer) | **10** | one per template 001–010 |
| Riverside (stage-skip) | 2 | intentionally minimal |

**Root cause of over-generation:** `seed-artifact-templates.ts:1020-1023` sets
`FIXTURE_TEMPLATES = { jenny: ALL_TEMPLATE_IDS, northland: ALL_TEMPLATE_IDS, cygnus: ALL_TEMPLATE_IDS }`,
and the loop at `:1242` creates a Model for **every** template with generic `DEFAULT_TEMPLATE_PARAMS`
and `output_summary = "ARTIFACT-TEMPLATE-0NN working model"`. So Northland — whose only evidence is
fleet/equipment (TRACK-002/007) — is seeded SBA 504, SBA 7(a), PACE, Business Visa, CRE, and
investment-property models with **zero** captured signal for any of them. Live-fetch confirms it:
Northland's workstation renders all 9 structural-viz types and 32× "SBA 504" / 102× CDC-lien strings.
**Yes — the seed is over-generating models for products with no evidence on the member**, and nothing
downstream filters them.

---

## 4. Builder reconciliation — two parallel input systems that never merge

`capture-forms/model-form.tsx` is a **freeform builder with an optional template bolt-on**, and it
carries three disconnected input channels:

1. **Generic freeform "Inputs"** — `parameters[]` key/value rows (`:79`, `:322-363`). Arbitrary strings,
   saved to `Model.parameters`.
2. **Structured template fields** — `templateParamValues` (`:95`), rendered **only** when a template with
   a schema is attached (`:301-320`), saved to `Model.template_parameters`.
3. **Assumptions** + free-text output summary.

**Why "attaching a template doesn't load its structured inputs":**
- Attaching a template *does* render its structured fields **when the chosen option carries a schema**
  — but the dropdown (`:280-298`) also lists every legacy `Artifact` under an **"Other models"** group
  with `template: null` (sourced from `page.tsx:462-465`/`478-482`). Picking one of those — which is the
  natural thing to do, since they have plausible titles — loads **no** structured inputs by design.
- The structured values feed **only** the auto-generated `output_summary` (`resolveTemplateString`,
  `:120`) and `template_parameters`. They are **never** written into the visible generic "Inputs" rows,
  so the two systems never reconcile.
- The form is **create-only** — there is no `existing`/`modelId` prop and all state initializes empty.
  So re-opening a previously template-built Model cannot rehydrate its structured inputs; the form
  literally has no load path. That is the most concrete reading of "attaching a template doesn't load
  its structured inputs."

**Intended single flow** (what the architecture clearly wants): pick a template → its `parameter_schema`
*is* the input set (with `source_factor_id` params auto-pulled from FactorCaptures and missing ones
surfaced as the in-dialog CTA that already exists in `artifact-template-render.tsx`) → no separate
freeform key/value grid. The freeform `parameters[]` grid should collapse into "advanced/extra" or be
removed once a template is attached, and `template_parameters` should be the single source the viz reads.

---

## 5. The "Fleet ROI shows SBA 504 prose" bug — seed/template wiring cause

**Root cause: the same unconditional over-generation in §3 — not a mis-wired template-004.** Verified
template-004 is correct end-to-end: in both the source and `dev.db` it is `cost_of_doing_nothing`, and
Northland's real Fleet model (`89b8b9ef…`) carries `template_id=ARTIFACT-TEMPLATE-004` with fleet params
and fleet prose. There is **no** path where a Fleet-tagged model renders the SBA chart.

What actually puts SBA-504 prose on the fleet member:

1. **`seedFixtureMultiTrack` seeds `ARTIFACT-TEMPLATE-008` (SBA 504) onto Northland** via
   `FIXTURE_TEMPLATES[northland] = ALL_TEMPLATE_IDS` (`seed-artifact-templates.ts:1022`, loop `:1242`).
   That model gets `structural_content = sba_504_paired`, whose roadmap stages contain the CDC/
   "second-lien"/SBA-specialist prose. The feed renders it unconditionally (`page.tsx:1040`). Live
   payload confirms the SBA roadmap stage text is embedded on Northland's page.
2. **The real Fleet model loses its name to the generic template title.** The retag (`:1182-1186`)
   collapses the banker's "Fleet expansion ROI projection" Model into template-004, whose title is the
   generic **"Equipment financing ROI projection."** The feed card title falls back to `template.title`
   (`page.tsx:1054`), so the fleet model now displays under a non-fleet name, while "Fleet expansion ROI
   projection" survives only as a separate ShowEvent row — which compounds the perception that fleet
   content has been replaced by other-product prose.

So the symptom is **(a) an over-generated SBA-504 model card sitting on a fleet member with no SBA
evidence, plus (b) the fleet model's identity being overwritten by the generic equipment-template
title** — both produced by the seed's evidence-blind fan-out, not by template-004 carrying SBA content.
The fix lives in the seed (gate `FIXTURE_TEMPLATES` to evidence-backed tracks) and/or a render-time
applicability gate, which would also resolve §3.

**Caveat reported faithfully:** if SBA content is seen rendering *literally inside* a card titled "Fleet
expansion ROI projection," that does **not** reproduce in the committed seed.db — there the fleet model
renders `cost_of_doing_nothing`. A screenshot of that exact case would warrant a separate trace.
