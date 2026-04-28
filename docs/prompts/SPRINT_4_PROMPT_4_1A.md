# SPRINT_4_PROMPT_4_1A.md

**Sprint 4 — Growth Conversations module · Prompt 4.1a of 4-5**

This is the first executable prompt for Sprint 4. Sprint 3 was accepted on visual review; the Member profile is now production-quality across all three demo Members (Jenny, Northland, Cygnus) with the dynamic route, both new Artifacts, and the Sprint 2 architectural decisions visually verified.

Sprint 4 is the largest sprint of the build (6-8 days). Per DEMO_BUILD_PLAN.md v2.1 §3, the original Prompt 4.1 scope was monolithic. This refined plan splits it into 4.1a (foundation) and 4.1b (first capture form), so each prompt produces something concrete and reviewable.

**Prompt 4.1a covers foundation work:** schema additions, the Growth Conversations route shell, the standalone-entry Member lookup component, the single scrolling-page layout structure, the anchor progress bar, and the Macro entity with seed data. No capture forms yet; that's Prompt 4.1b.

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan, §3 Sprint 4 acceptance criteria
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` — authoritative for Macro entity and inline insight discipline
- `docs/design/03_Data_Framework.docx` — schema authority (will be amended by this prompt)
- `docs/design/04_Module_and_Data_Flow.docx` — module boundaries (will be amended by this prompt)
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content for the three demo Members
- `BLAZE_STYLE_GUIDE.md` — visual identity
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry

---

## Scope of this prompt

Six foundation blocks. None of them produce visible capture-form UI; that's Prompt 4.1b. This prompt builds the architecture that makes 4.1b's UI work possible.

- **Block A:** Schema additions — three new fields on Recommendation, the Macro entity, the ArtifactParameterCapture entity, signal supersession tracking, skip-state fields on GrowthStepExecution
- **Block B:** Macro seed data — three sample Macros per INSIGHT_ENGINE_DESIGN_NOTES.md §3
- **Block C:** Growth Conversations route shell at `/growth-conversations` (replacing the placeholder) and `/growth-conversations/[memberId]` for prefilled entry
- **Block D:** Member lookup component for standalone-entry path
- **Block E:** Single scrolling-page layout structure with anchor progress bar (no capture forms; just the skeleton)
- **Block F:** Governance document updates — Data Framework §4 (Track entity model reframe) and §5 (new Macro section); Module and Data Flow §3 (Meeting Recap → Growth Conversations rewrite)

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Capture forms for any stage (Prompt 4.1b builds the Ask form; later prompts build the rest)
- Stage-by-stage save logic (Prompt 4.1b for Ask save; Prompt 4.2 for the rest)
- Signal longevity UI (Prompt 4.2)
- Skip handling UI (Prompt 4.3)
- Show capture form with parameter pre-population (Prompt 4.2)
- Resolve capture form for size_low/size_high and product_subtype (Prompt 4.4)
- Inline insight surfaces (Prompt 4.2 onwards)
- Macro context banner on Member profile (Prompt 4.1b — needs Macro seed data from this prompt to populate)
- Sprint 5 work (Insight Engine module)

Stop and check in after the full prompt completes. Single checkpoint at end; do not pause mid-prompt unless you encounter a real blocker.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Schema additions

### A.1 — Recommendation.size_low and Recommendation.size_high

Per the Sprint 3 architectural decision (Option B from earlier conversation), replace freeform size text with structured range capture.

```prisma
model Recommendation {
  // ... existing fields
  size_low      Decimal?  @db.Decimal(15, 2)
  size_high     Decimal?  @db.Decimal(15, 2)
}
```

Both fields nullable for legacy/migration reasons but expected populated when captured (Sprint 4 Resolve phase will enforce population through the capture form).

### A.2 — Recommendation.product_subtype

Per the Sprint 3 architectural decision (Option 1B), add product_subtype as a free-text field.

```prisma
model Recommendation {
  // ... existing fields
  product_subtype  String?
}
```

Free-text for now per Francisco's confirmation. A later Pilot phase may convert this to an enum or a Product reference table relation; the architectural seed is in place.

### A.3 — Migrate existing Recommendation seed data

Update the demo seed data to populate the new fields:

| Member | Recommendation | size_low | size_high | product_subtype |
|---|---|---|---|---|
| Jenny | Working Capital LOC | 75000 | 75000 | "seasonal_smoothing" |
| Northland | Vehicle/Fleet Loan | 180000 | 180000 | "service_van" |
| Cygnus | Owner-Occupied CRE | 4000000 | 7000000 | "manufacturing_facility" |

Note: Jenny and Northland have firm sizes (size_low === size_high), so the display layer renders single values. Cygnus has a range, so display renders "$4M-$7M".

Update the rationale prose for each Recommendation to remove redundant size mentions where the structured field now drives the header. Keep size context in rationale prose where it's part of the reasoning narrative ("$75K LOC sized at one quarter of the slow-season revenue gap" stays in rationale because it's explaining why this size, not just stating the size).

### A.4 — Recommendation header display logic

Update the rendering logic in lib/page.tsx (and any Member profile templates) to display Recommendation size from the structured fields:

- If size_low === size_high: render as "Working Capital Line of Credit at $75K"
- If size_low < size_high: render as "Owner-Occupied Commercial Real Estate at $4M-$7M"
- If size_low is null and size_high is null: render product name only ("Working Capital Line of Credit") — fallback for partial-data states
- Format numbers with appropriate scale: $75K, $1.2M, $4M-$7M (use existing number formatting helpers)

Verify the Open opportunities band on Member profiles still renders cleanly. The Recommendation title (which Sprint 3 Block A moved to its own line) now uses the structured fields.

### A.5 — Macro entity

Per INSIGHT_ENGINE_DESIGN_NOTES.md §3, add the Macro entity:

```prisma
model Macro {
  id                          String                  @id @default(cuid())
  title                       String
  summary                     String                  @db.Text
  authored_by_banker_id       String?
  authored_by_banker          Banker?                 @relation(fields: [authored_by_banker_id], references: [id])
  authored_by_external_label  String?  // For non-Banker curators (e.g., "Federal Reserve Bank of Minneapolis research")
  authored_at                 DateTime
  effective_period_start      DateTime
  effective_period_end        DateTime?  // Null means "still effective"
  affected_industry_families  String[]   // Array of IndustryFamily ids
  affected_member_types       String[]   // Array of MemberType ids
  recommended_response        String     @db.Text  // What bankers should consider doing
  evidence_links              String[]   // URLs supporting the Macro
  related_topics              String[]   // Topic ids from existing taxonomy
  created_at                  DateTime   @default(now())
  updated_at                  DateTime   @updatedAt
}
```

Note: The author can be either an internal Banker (via FK relation) or an external source labeled by string. This handles both internal authors (Marcus Wei, chief economist) and external research feeds (post-demo).

### A.6 — ArtifactParameterCapture entity

Per Sprint 3 architectural decision §3c, structured parameter capture for Show step.

```prisma
model ArtifactParameterCapture {
  id                       String                  @id @default(cuid())
  artifact_share_record_id String
  artifact_share_record    ArtifactShareRecord     @relation(fields: [artifact_share_record_id], references: [id])
  parameter_name           String                  // e.g., "current_fleet_size", "expansion_size_estimate"
  parameter_value          String                  // The captured value (string; render layer parses)
  parameter_provenance     ParameterProvenance
  captured_at              DateTime                @default(now())
  captured_by_banker_id    String
  captured_by_banker       Banker                  @relation(fields: [captured_by_banker_id], references: [id])
}

enum ParameterProvenance {
  member_profile
  captured_signal
  banker_assumption
  member_stated_in_followup
}
```

Author description for each enum value per Semantic Discipline (add to lib/enum-descriptions.ts → PARAMETER_PROVENANCE_DESCRIPTIONS):
- `member_profile`: "Parameter value pulled from existing Member profile data (e.g., revenue band, fleet size, employee count). Auto-populated by the system; banker did not type it."
- `captured_signal`: "Parameter value derived from a captured Signal during Ask or Size phase (e.g., a magnitude or quantification the Member stated). Auto-populated; provenance preserved."
- `banker_assumption`: "Parameter value entered by the banker as a working assumption (e.g., proposed financing rate based on similar deals). Banker judgment, not Member-stated."
- `member_stated_in_followup`: "Parameter value the Member provided directly in a follow-up after the Show phase (e.g., 'actually our average call value is closer to $850'). Highest-confidence provenance."

### A.7 — Signal supersession tracking

Per INSIGHT_ENGINE_DESIGN_NOTES.md §6, add fields to Signal for longevity tracking:

```prisma
model Signal {
  // ... existing fields
  superseded_by_signal_id  String?
  superseded_by_signal     Signal?   @relation("SignalSupersession", fields: [superseded_by_signal_id], references: [id])
  superseded_at            DateTime?
  superseding_signals      Signal[]  @relation("SignalSupersession")
}
```

When a banker re-enters Growth Conversations months later and updates a stale Signal (Sprint 4 Prompt 4.2 work), the new Signal record references the prior via `superseded_by_signal_id`. The prior Signal is retained with its original timestamp; the new Signal has the new timestamp and the supersession reference. Audit trail preserved.

For seed data: no signals are superseded yet (the demo's three Members each have exactly one set of signals from their featured Conversation).

### A.8 — Skip-state fields on GrowthStepExecution

Per INSIGHT_ENGINE_DESIGN_NOTES.md §6 and DEMO_BUILD_PLAN.md Sprint 4 Prompt 4.3, add skip-tracking to GrowthStepExecution:

```prisma
model GrowthStepExecution {
  // ... existing fields
  was_skipped              Boolean   @default(false)
  skip_confirmed_by_banker_id  String?
  skip_confirmed_by_banker     Banker?   @relation("SkipConfirmation", fields: [skip_confirmed_by_banker_id], references: [id])
  skip_confirmed_at        DateTime?
  skip_reason              String?    // Optional banker note explaining why
}
```

For seed data: no executions are skipped (all three Members' featured Tracks ran end-to-end). Sprint 4 Prompt 4.3 will build the skip-handling UI.

### A.9 — Migration and Prisma client regeneration

Run `pnpm prisma migrate dev --name sprint4_4_1a_growth_conversations_foundation` to create the migration. Migrate seed data via the Migration's `up` script:

- Backfill Recommendation.size_low / size_high / product_subtype per A.3
- Backfill Recommendation rationale prose updates per A.3 (where redundant size mentions are removed)
- Run `pnpm prisma generate` to regenerate the client

Verify clean re-seed produces stable row counts plus the new Macro, ArtifactParameterCapture (initially empty), and updated Recommendation rows.

---

## Block B — Macro seed data

Author and seed three sample Macros per INSIGHT_ENGINE_DESIGN_NOTES.md §3.

### B.1 — Macro 1: Q3 supplier payment compression

```typescript
{
  title: "Q3 supplier payment compression — Small Caterers",
  summary: "Small caterers across the metro are reporting 20-30% extension in customer payment terms during Q3 2025 through Q1 2026. Driven by tightened working capital across customers in the corporate hospitality segment, particularly mid-sized firms responding to elevated cost-of-capital. Members exposed to corporate event catering are most affected.",
  authored_by_external_label: "Marcus Wei (Chief Economist)",
  authored_at: new Date("2026-04-12T09:00:00Z"),
  effective_period_start: new Date("2026-04-12T00:00:00Z"),
  effective_period_end: null,  // Still effective
  affected_industry_families: ["food_and_beverage_services"],  // Or the actual ID
  affected_member_types: ["small_caterer"],
  recommended_response: "Surface seasonal cash flow stress during Ask phase. Quantify customer-payment-extension impact in Size phase. Working Capital LOC Track is well-suited; size at one quarter of slow-season revenue gap. Reference this Macro in Suggested opening to the Member as part of the conversational on-ramp.",
  evidence_links: [
    "https://www.minneapolisfed.org/research/srr/q3-2025-payments-compression",
    "https://blaze-internal.example.com/research/2026-04-12-small-caterer-cash-flow"
  ],
  related_topics: ["working_capital", "seasonal_revenue", "supplier_dynamics"]
}
```

### B.2 — Macro 2: Light commercial fleet ROI window

```typescript
{
  title: "Light commercial fleet ROI window — HVAC & Trades",
  summary: "Vehicle and equipment financing rates are at a 24-month low; meanwhile capacity-constrained HVAC and trades businesses are reporting elevated declined-call rates from limited fleet capacity. The combination creates a roughly 18-24 month ROI window where financed fleet expansion captures previously-declined revenue meaningfully faster than its debt service. Window expected to close in late Q3 2026 as financing rates normalize upward.",
  authored_by_external_label: "Sarah Chen (Sector Specialist, Skilled Trades)",
  authored_at: new Date("2026-04-10T14:30:00Z"),
  effective_period_start: new Date("2026-04-10T00:00:00Z"),
  effective_period_end: new Date("2026-09-30T23:59:59Z"),  // Window expected to close
  affected_industry_families: ["construction_and_trades"],
  affected_member_types: ["hvac_and_trades", "general_contractors", "specialty_trades"],
  recommended_response: "Surface capacity-vs-demand tension during Ask phase. Quantify declined-call value in Size phase. Vehicle/Fleet Loan Track demonstrates payback within the ROI window. Use the fleet ROI projection chart Artifact during Show phase.",
  evidence_links: [
    "https://blaze-internal.example.com/research/2026-04-10-fleet-roi-window",
    "https://www.federalreserve.gov/data/h15/current/h15.htm"  // Fed H.15 rates
  ],
  related_topics: ["fleet_expansion", "capacity_constraints", "capital_equipment_financing"]
}
```

### B.3 — Macro 3: Specialty manufacturer capital event opportunities

```typescript
{
  title: "Specialty manufacturer capital event opportunities",
  summary: "Specialty manufacturers in the Twin Cities region are reporting elevated rates of anchor-customer-driven capacity expansion conversations. Many of these capital events qualify for owner-occupied CRE financing combined with equipment lending. Members in the $20M-$100M revenue band are most likely to face these decisions in 2026.",
  authored_by_external_label: "Sarah Chen (Sector Specialist, Skilled Trades)",  // Same author for demo simplicity
  authored_at: new Date("2026-04-05T11:00:00Z"),
  effective_period_start: new Date("2026-04-05T00:00:00Z"),
  effective_period_end: null,  // Still effective
  affected_industry_families: ["specialty_manufacturing"],
  affected_member_types: ["specialty_manufacturer"],
  recommended_response: "Probe capital event evaluation during Ask phase. Discover the timing driver. CRE specialist introduction (Connect step) is likely the right path. Capital event partnership map Artifact demonstrates Blaze's coordinated capability.",
  evidence_links: [
    "https://blaze-internal.example.com/research/2026-04-05-specialty-mfg-capital-events"
  ],
  related_topics: ["capital_events", "owner_occupied_cre", "anchor_customers", "specialist_handoff"]
}
```

### B.4 — Verify seed data

After re-seed, verify:
- 3 Macros exist with the content above
- Each Macro's affected_member_types correctly maps to one of Jenny / Northland / Cygnus's Member Types
- Authored dates are before the demo's "now" anchor (2026-04-25)
- The relationship from Banker (Marcus Wei doesn't yet exist as a Banker; for now use external_label; if you'd rather seed Marcus Wei as a Banker reference, document the choice in BUILD_LOG)

If Marcus Wei isn't a Banker in the seed data and adding him as one would create complexity (he'd need a Banker record but isn't actually a relationship banker), keep him as `authored_by_external_label`. The schema supports both modes.

---

## Block C — Growth Conversations route shell

### C.1 — Replace the placeholder route

Sprint 2 Prompt 2 created a placeholder at `/growth-conversations` (renamed from `/meeting-recap`). The placeholder needs to become a real route shell.

Create two routes:

- `app/growth-conversations/page.tsx` — Standalone entry point. No member prefilled. Renders the Member lookup component (from Block D).
- `app/growth-conversations/[memberId]/page.tsx` — Prefilled entry point. Loads the specified Member. Renders the single scrolling-page layout (from Block E).

The "Run Growth Track" / "Run follow-up" buttons on Member profiles should now link to `/growth-conversations/[memberId]` (using the Member's slug).

### C.2 — Header and shell

Both routes share a consistent header treatment:

```
[orange Growth Conversations wordmark]    Logged in as Scott Brynjolffson · Primary banker
```

Same visual identity as Member profile (warm cream page ground, burnished orange accent, calm typography). Use the same header component if one exists; create a shared component if not.

### C.3 — Cancel and back navigation

The header includes a "← Back to Member profile" link that returns to `/members/[memberId]` when entered from prefilled mode. From standalone-entry mode (no Member yet selected), the back link goes to `/members/jenny` (the demo's home Member) or to a "no Member selected" landing.

For Sprint 4 Prompt 4.1a, exit-without-saving behavior is straightforward: clicking back simply navigates away. Sprint 4 Prompt 4.1b will add unsaved-changes detection and confirmation prompts when capture forms exist.

---

## Block D — Member lookup component

### D.1 — Component design

The Member lookup is the standalone-entry path's primary UI element. It's a single component used at `/growth-conversations` (page.tsx).

Visual treatment:

```
[orange section mark] Select Member
Choose the Member you'll be in conversation with.

[Search input — types Member name or business name]
[Result list below — populated as the banker types]
```

Each search result shows:
- Member name (business name, e.g., "Jenny's Catering")
- Member Type · Stage indicator (e.g., "Small Caterer · Starting")
- Last touch date (e.g., "Last conversation: Apr 8, 2026")

Click a result → navigate to `/growth-conversations/[memberId]`.

### D.2 — Search behavior

- Searches against Member.legal_name, Member.dba, and Member.slug
- Case-insensitive partial match
- Results limited to the viewing banker's portfolio (Members where Member.primary_banker matches the simulated current banker — Scott in the demo)
- For demo: shows Jenny, Northland, Cygnus (all three are Scott's Members)
- If query is empty, show all of the banker's Members (3 in demo)
- If no matches, show "No Members match your search." with subtle styling (no error feel; the search is exploratory)

### D.3 — Empty state

If the banker has no Members in their portfolio, the component renders:

```
You have no Members in your portfolio yet. Once Members are assigned to you, you'll be able to start Growth Conversations from here.
```

This shouldn't happen in the demo (Scott has three Members) but the component should handle gracefully.

### D.4 — Visual identity

Same calm typography-led identity as the rest of the system. The search input uses the existing form-input treatment. The result list uses the same tag/chip discipline as the Member profile (member_type as labeled value, not a chip).

---

## Block E — Single scrolling-page layout structure

### E.1 — Page architecture

At `/growth-conversations/[memberId]`, the page renders:

**Left column (~70% width):** Single scrolling container with stage sections rendered in sequence top-to-bottom:
- Section: Ask 1
- Section: Size 1 (or skipped to Show if Track shape)
- Section: Show 1
- Section: Resolve 1 (or Connect 1)
- Section: Decision pending (post-Track lifecycle stage)
- Section: Funded (terminal post-Track stage)

For Cygnus's two-Ask Track, the Ask sections render as Ask 1 and Ask 2 distinctly.

Each section is a placeholder for now (Prompt 4.1b builds the actual capture forms). Section header reads:

```
[orange section mark] Ask                                   [Stage 1 of 6]
[Capture form goes here in Prompt 4.1b]
```

Each section has a target ID for anchor scrolling (e.g., `#stage-ask-1`, `#stage-size-1`, `#stage-show-1`, `#stage-resolve-1`, `#stage-decision-pending`, `#stage-funded`).

**Right column (~30% width):** Anchor progress bar — vertical sticky list showing stage names with click-to-scroll behavior.

### E.2 — Right-column anchor progress bar

Sticky positioned (fixed during scroll). Lists each stage with:

- Stage name (clickable; clicking scrolls the left column to that section's target ID)
- Stage state indicator (visual cue for completed / current / upcoming, mirroring the Member profile's progress dots discipline)
- Currently-viewed-stage indicator (highlighted as the user scrolls past each section's threshold)

Example for Jenny's Track at the moment she has 4 GrowthStepExecutions completed (per seed data):

```
Ask              [completed]
Size             [completed]
Show             [completed]
Resolve          [completed]
Decision pending [current]
Funded           [upcoming]
```

For Cygnus's two-Ask Track:

```
Ask 1                  [completed]
Ask 2                  [completed]
Show                   [completed]
Connect                [completed]
Specialist engagement  [current]
Closed                 [upcoming]
```

The anchor progress bar reuses the visual discipline from the Member profile's progress dots component. Burnished orange for completed/current; light cool grey for upcoming. Current stage distinguished from completed (per existing pattern).

### E.3 — Stage state derivation

Same logic as the Member profile's progress visualization (per Sprint 2 Prompt 1 + Prompt 2 work):

- Stage is `completed` if a GrowthStepExecution exists for this Track step instance (or if `member_response = funded` for the terminal stage)
- Stage is `current` if it's the next un-executed step (or for post-Track stages, the current lifecycle position)
- Stage is `upcoming` otherwise

For Sprint 4 Prompt 4.1a, no new state computation is needed; the existing logic from lib/priorities.ts (computeTrackStages or similar) feeds the anchor progress bar.

### E.4 — Scroll behavior

When the user scrolls the left column, the anchor progress bar's "currently-viewed" indicator updates to reflect which section is closest to the viewport top. This uses an Intersection Observer pattern (or equivalent).

When the user clicks a stage in the anchor progress bar, the left column scrolls to that section's target ID with smooth-scroll behavior.

### E.5 — Seed-data-driven sections

For Prompt 4.1a, each section renders a placeholder reading:

```
[Capture form for {stage_name} will be added in Sprint 4 Prompt 4.1b (Ask) and subsequent prompts (Size, Show, Resolve, Connect).]
```

This makes the architecture visible without building the capture UI yet.

For completed stages (where seed data has GrowthStepExecutions), render a brief read-only summary instead:

```
[orange section mark] Ask                                              [Stage 1 of 4]
Captured from check in on April 8, 2026.

→ produced: Goal — Smooth seasonal revenue with working capital
→ produced: Blocker — Seasonal cash flow stress

[ Update captures ] (button — non-functional in this prompt)
```

This is the minimum viable read-only state. Prompt 4.1b will replace the Ask section's read-only treatment with a full capture form. For now, the read-only shows that captured data exists; a banker reading will recognize this is where they update or extend.

---

## Block F — Governance document updates

### F.1 — Data Framework §4 — Track entity model reframe

The current §4 describes Tracks as fixed step sequences. Update to reflect the v2 architectural decision: Ask + Size are track-agnostic discovery phases; Show + Resolve (or Show + Connect) are track-specific.

Add a paragraph clarifying:

```
A Growth Track represents the post-discovery, product-specific portion of a Growth Conversation. Pre-Track Ask + Size phases are NOT defined per-Track — they are track-agnostic discovery captures that surface Signals which the rule engine matches to a Track via Rule entities.

Operationally, a banker entering Growth Conversations always begins with Ask + Size. The system surfaces matching Tracks once enough Signal data is captured. The matched Track then provides the Show, Resolve (or Connect), and post-Track lifecycle stages.

Track.growth_step_sequence describes only the post-Signal portion of the conversation. The pre-Signal portion is implicit and consistent across all Tracks.
```

Update related diagrams or examples in §4 to reflect this. If Sprint 4 Prompt 4.2 (capture forms) reveals further refinements to the Track model, those land in subsequent prompts.

### F.2 — Data Framework §5 — Macro entity (new section)

Add a new §5 (renumber existing §5 onwards if needed) titled "Macro" with the entity definition, semantic discipline, relationships, and use cases. Source content from INSIGHT_ENGINE_DESIGN_NOTES.md §3.

Key elements:
- Entity definition (fields per Block A.5 above)
- Semantic discipline (each field has a description; enum values authored per Semantic Discipline)
- Relationships (Macro → Banker via authored_by_banker_id; Macro → IndustryFamily; Macro → MemberType; Macro → Topic)
- Use cases (banner on Member profile; Macro context tab in Insight Engine; Ask phase prompts in Growth Conversations)

### F.3 — Module and Data Flow §3 — Meeting Recap → Growth Conversations rewrite

Rename §3 from "Meeting Recap" to "Growth Conversations". Rewrite to reflect:

- Two entry paths (from Member profile and standalone module)
- Single scrolling page architecture
- Anchor progress bar
- Track-agnostic Ask + Size; track-specific Show + Resolve (or Connect)
- Signal longevity (banker can update stale captures with audit trail)
- Skip handling (Sprint 4 Prompt 4.3 work; document the architecture)
- Inline insight surfaces during Ask, Size, Show, Resolve phases (Sprint 4 Prompt 4.2 work; document the architecture)

Source content from DEMO_BUILD_PLAN.md v2.1 §3 (Sprint 4 description) and INSIGHT_ENGINE_DESIGN_NOTES.md §5 (Surface B).

### F.4 — Update lib/relation-names.ts and lib/verb-patterns.ts as needed

If new relations or verb patterns surface during this prompt's implementation, add them to the registries. Likely additions:

- Relation: "supersedes" (for Signal supersession) — Signal A `supersedes` Signal B when A is the new captured version
- Relation: "captured during" (for ArtifactParameterCapture) — a parameter `captured during` a specific Show step execution
- Verb pattern: "skipped" (for GrowthStepExecution where was_skipped=true)

Author descriptions and prose for any additions.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md if needed

The Growth Conversations route introduces a new layout (single scrolling page with anchor progress bar). Add a new §13 (or appropriate section) titled "Growth Conversations layout" that codifies:

- Two-column layout (~70% / 30%)
- Right-column sticky anchor progress bar
- Section markers at the top of each stage
- Stage state visual treatment (mirroring Member profile progress dots)
- Read-only-vs-capture-mode distinction (Prompt 4.1b will refine)

### H.2 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 4 Prompt 4.1a work shipped
- Schema additions (size_low, size_high, product_subtype, Macro, ArtifactParameterCapture, signal supersession, skip-state)
- Macro seed data (3 Macros with content)
- Growth Conversations route shell (two entry paths)
- Member lookup component
- Single scrolling-page layout structure with anchor progress bar
- Governance document updates

Note that capture forms are deferred to Prompt 4.1b and beyond.

### H.3 — Update OPEN_QUESTIONS

Likely additions:

- **Q-023:** Marcus Wei not yet a Banker entity. For demo, captured as `authored_by_external_label`. If Pilot phase requires Marcus Wei as a Banker (e.g., for permissions or analytics), revisit at that time.
- **Q-024:** ArtifactParameterCapture entity exists but not yet populated. Sprint 4 Prompt 4.2 will create records during Show capture; until then, it's empty.
- **Q-025:** Signal supersession schema exists; Sprint 4 Prompt 4.2 will create supersession chains when bankers update stale captures. No supersessions exist in current seed data.
- **Q-026:** GrowthStepExecution skip-state schema exists; Sprint 4 Prompt 4.3 will create skipped executions. No skipped executions in current seed data.
- **Q-027:** Anchor progress bar's "currently-viewed-stage" indicator behavior on small viewports (tablet, mobile) — validate during Prompt 4.1b visual review.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Recommendation.size_low and size_high fields added; existing Recommendations migrated with values from MEMBER_FIXTURE_BRIEF.md
- [ ] Recommendation.product_subtype field added; demo Members have subtypes per A.3
- [ ] Recommendation header display logic renders structured size correctly (single value or range)
- [ ] Macro entity added with seed data (3 Macros per Block B)
- [ ] ArtifactParameterCapture entity added (currently no records; sprint 4 Prompt 4.2 will populate)
- [ ] Signal supersession fields added (currently no supersession records)
- [ ] GrowthStepExecution skip-state fields added (currently no skipped executions)
- [ ] /growth-conversations route serves the standalone entry page with Member lookup
- [ ] /growth-conversations/[memberId] route serves the prefilled entry page with single scrolling layout
- [ ] Member lookup component searches against the viewing banker's portfolio
- [ ] Single scrolling page renders with sections for each Track stage + post-Track lifecycle stages
- [ ] Anchor progress bar (right column) is sticky; clicking a stage scrolls to its section
- [ ] Anchor progress bar's currently-viewed indicator updates as user scrolls
- [ ] Read-only summaries render for completed stages (where seed data has GrowthStepExecutions)
- [ ] Placeholder messages render for upcoming stages (capture forms come in 4.1b)
- [ ] "Run Growth Track" / "Run follow-up" buttons on Member profiles link to /growth-conversations/[memberId]
- [ ] Cancel/back navigation returns to /members/[memberId]
- [ ] Three governance document updates landed: Data Framework §4 reframe, §5 new Macro section, Module and Data Flow §3 rewrite
- [ ] BLAZE_STYLE_GUIDE.md §13 (or appropriate) added for Growth Conversations layout
- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS updated with new items
- [ ] Migration runs cleanly; clean re-seed succeeds; row counts stable + new entities
- [ ] All three Member profiles still load (smoke test; no regressions from this prompt)
- [ ] /growth-conversations works for all three Members (Jenny, Northland, Cygnus)

## Report-back format

When complete, send back:

1. **Screenshots:** /growth-conversations (standalone entry with Member lookup); /growth-conversations/jenny (single scrolling page with anchor progress bar; sections show read-only summaries for completed stages and placeholders for upcoming); /growth-conversations/cygnus (same view but with two Ask sections and Connect-ending stages)
2. **The schema additions** in summary form (entities added, fields added, migration approach)
3. **The Macro seed data** in summary form (which Macros, who authored, what affected_member_types)
4. **The single scrolling page layout** in summary form (how sections render, how the anchor progress bar tracks scroll position)
5. **Any decisions made during implementation** that the prompt didn't pre-specify
6. **Any items logged to OPEN_QUESTIONS** during implementation
7. **Confirmation that hard refresh shows the changes correctly**

Stop and check in. Sprint 4 Prompt 4.1b (Ask phase capture form + Macro context banner on Member profile) follows after acceptance.

**Reminder:** This is a foundation prompt. The first visible capture form lands in Prompt 4.1b. If the visual review feels like "more setup than payoff," that's expected — the architecture is the deliverable.
