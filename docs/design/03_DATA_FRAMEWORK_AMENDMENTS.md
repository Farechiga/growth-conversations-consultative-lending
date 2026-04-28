# 03_Data_Framework — Amendments

**Sidecar to `03_Data_Framework.docx`. Captures the textual changes that need to be folded into the source .docx at next review.**

The .docx file is the canonical source; this sidecar is the executable amendment list. CC adds entries here as schema work lands; Francisco folds them into the .docx during review.

---

## Sprint 4 §F.1 — §4 Track entity model reframe

**Context:** Sprint 4 architectural shift makes Ask + Size phases track-agnostic discovery captures; Show + Resolve (or Show + Connect) are track-specific. The current §4 describes Tracks as fixed step sequences across all phases.

**Replace** the current §4 opening paragraph with:

> A Growth Track represents the **post-discovery, product-specific portion** of a Growth Conversation. Pre-Track Ask + Size phases are NOT defined per-Track — they are track-agnostic discovery captures that surface Signals which the rule engine matches to a Track via Rule entities.
>
> Operationally, a banker entering Growth Conversations always begins with Ask + Size. The system surfaces matching Tracks once enough Signal data is captured. The matched Track then provides the Show, Resolve (or Connect), and post-Track lifecycle stages.
>
> `GrowthTrack.growth_step_sequence` describes only the post-Signal portion of the conversation. The pre-Signal portion is implicit and consistent across all Tracks.

**Update** any diagrams or example flows in §4 that depict the Ask/Size steps as part of a specific Track's `growth_step_sequence`. Per the demo seed, Tracks still include Ask/Size GrowthSteps in their sequence for back-compat with the existing rendering; this is a transitional shape pending Sprint 4 Prompt 4.2's signal-longevity work, where Ask + Size capture moves to live independently of any Track.

## Sprint 4 §A.1 / §A.2 — Recommendation entity (size_low / size_high / product_subtype)

**Replace** the current `size_proposed` row in §4 (Recommendation entity) with:

| Field | Type | Description |
|---|---|---|
| size_low | Decimal/Float, nullable | Lower bound of the proposed range. Single value when low === high (e.g., $75K LOC: low = high = 75000); range when low < high (e.g., Cygnus's CRE: low = 4000000, high = 7000000). Nullable for migration; expected populated when captured. |
| size_high | Decimal/Float, nullable | Upper bound. See size_low. |
| product_subtype | String, optional | Sub-type within a Product family. Free-text for demo phase; Pilot phase may convert to enum or Product variant relation. Examples: "service_van" (Vehicle/Fleet Loan), "manufacturing_facility" (Owner-Occupied CRE), "seasonal_smoothing" (Working Capital LOC). |

The legacy `size_proposed` field stays in the schema as a back-compat fallback; new captures should populate `size_low` / `size_high`.

## Sprint 4 §A.7 — Signal supersession tracking

**Add** to §4 (Signal entity) the following fields:

| Field | Type | Description |
|---|---|---|
| superseded_by_signal_id | String, nullable, FK→Signal | When a banker re-enters Growth Conversations and updates a stale Signal, the new Signal record references the prior via this field. The prior Signal is retained with its original timestamp and content; the new Signal carries the updated capture. |
| superseded_at | DateTime, nullable | When the supersession was recorded. |
| superseding_signals | Signal[] | Reverse relation: the Signals that have superseded this one. |

Audit-trail discipline: prior Signals are immutable once written. The active state of a Member's signals is computed as "active Signals not yet superseded."

## Sprint 4 §A.8 — GrowthStepExecution skip-state fields

**Add** to §4 (GrowthStepExecution entity) the following fields:

| Field | Type | Description |
|---|---|---|
| was_skipped | Boolean, default false | True when the banker submitted a later stage with this stage unfilled and confirmed the skip via the Sprint 4 Prompt 4.3 popup. |
| skip_confirmed_by_banker_id | String, nullable, FK→Banker | Banker who confirmed the skip. |
| skip_confirmed_at | DateTime, nullable | When the skip was confirmed. |
| skip_reason | String, nullable | Optional banker note explaining why the stage was skipped. |

Insight Engine analytics over skip patterns (Sprint 5 stage-skip view) depends on these fields.

## Sprint 4 §F.2 — §5 (new) Macro entity

**Add** as a new section §5 (renumber existing §5 onwards if present):

> ## §5 — Macro
>
> A **Macro** is a banker-authored or external-research-authored briefing on a market condition, regulatory shift, or sector pattern that is currently affecting a defined set of Member Types. Macros surface in three places: (1) Member profile context banner, (2) Insight Engine Macro context tab, (3) Growth Conversations Ask phase prompts.
>
> ### Authorship
>
> Authorship is dual-mode: an internal Banker (via `authored_by_banker_id`) or an external label (e.g., "Federal Reserve Bank of Minneapolis research") via `authored_by_external_label`. Exactly one of these two should be populated per Macro. The schema supports both modes for future-proofing — internal authors are typically chief economists or sector specialists employed by Blaze; external labels are research feeds, regulatory sources, or industry publications.
>
> ### Fields
>
> | Field | Type | Description |
> |---|---|---|
> | id | String | Primary key (cuid). |
> | title | String | Banker-facing title (e.g., "Q3 supplier payment compression — Small Caterers"). |
> | summary | String | 1-2 paragraph banker-facing prose explaining the Macro and its implications. |
> | authored_by_banker_id | String, nullable, FK→Banker | Internal authorship reference. |
> | authored_by_external_label | String, nullable | External authorship label. |
> | authored_at | DateTime | When the Macro was first published. |
> | effective_period_start | DateTime | When the Macro becomes relevant. |
> | effective_period_end | DateTime, nullable | When the Macro's relevance is expected to end. Null = "still effective." |
> | affected_industry_families | Json (array of IndustryFamily.id) | Which industry families the Macro applies to. |
> | affected_member_types | Json (array of MemberType.id) | Which Member Types the Macro applies to. |
> | recommended_response | String | What bankers should consider doing — practical guidance for Ask/Size/Show phase application. |
> | evidence_links | Json (array of URL strings) | Supporting research links. |
> | related_topics | Json (array of Topic.id) | Topics the Macro relates to. |
>
> Array fields are stored as Json arrays in SQLite (Prisma's `String[]` is Postgres-only); the application layer handles serialization.
>
> ### Relationships
>
> - Macro → Banker (optional, via `authored_by_banker_id`)
> - Macro → IndustryFamily (Json-indexed many-to-many; not a Prisma relation)
> - Macro → MemberType (Json-indexed many-to-many; not a Prisma relation)
> - Macro → Topic (Json-indexed many-to-many; not a Prisma relation)
>
> ### Use cases
>
> 1. **Member profile context banner** — when a Member's Member Type matches a current Macro, the banner surfaces above the Member identity block. (Sprint 4 Prompt 4.1b.)
> 2. **Insight Engine Macro context tab** — list of all currently-effective Macros, filterable by IndustryFamily / MemberType. (Sprint 5.)
> 3. **Growth Conversations Ask phase prompts** — when a Member's Member Type matches a current Macro, the Ask phase capture form surfaces the Macro's `recommended_response` as guidance. (Sprint 4 Prompt 4.2.)

## Sprint 4 §A.6 — ArtifactParameterCapture entity (new)

**Add** to §4 (or §5 if Macro takes §5):

> ### ArtifactParameterCapture
>
> Structured parameter capture for Show-step Artifact rendering. Each row represents one parameter the banker (or auto-fill system) supplied to the Artifact's parameter_schema, plus the provenance of that value.
>
> ### Fields
>
> | Field | Type | Description |
> |---|---|---|
> | id | String | Primary key (cuid). |
> | growth_step_execution_id | String, FK→GrowthStepExecution | The Show-step execution this parameter was captured for. (See note below on relation target.) |
> | parameter_name | String | E.g., `current_fleet_size`, `expansion_size_estimate`. Matches a key in the Artifact's `parameter_schema`. |
> | parameter_value | String | The captured value as a string; the render layer parses to the appropriate type per the parameter's schema definition. |
> | parameter_provenance | enum ParameterProvenance | One of `member_profile`, `captured_signal`, `banker_assumption`, `member_stated_in_followup`. |
> | captured_at | DateTime | When the row was written. |
> | captured_by_banker_id | String, FK→Banker | Banker who confirmed the value (auto-fills are still attributed to the banker who saved the Show step). |
>
> ### Relation target note
>
> The Sprint 3 architectural conversation framed `ArtifactParameterCapture` as linked to `ArtifactShareRecord`. The demo schema does not have `ArtifactShareRecord` as a first-class table — Sprint 1 chose to keep share-record data in `GrowthStepExecution.captured_data` (jsonb) to avoid a second persistence path. So the FK on `ArtifactParameterCapture` points to `GrowthStepExecution` directly. If a future sprint promotes `ArtifactShareRecord` to a first-class table, the relation can be re-pointed; the schema shape and provenance enum stay.
>
> ### ParameterProvenance enum
>
> Per Semantic Discipline Principle 3, descriptions for each value:
>
> - `member_profile` — Parameter value pulled from existing Member profile data (e.g., revenue band, fleet size, employee count). Auto-populated by the system; banker did not type it.
> - `captured_signal` — Parameter value derived from a captured Signal during Ask or Size phase (e.g., a magnitude or quantification the Member stated). Auto-populated; provenance preserved.
> - `banker_assumption` — Parameter value entered by the banker as a working assumption (e.g., proposed financing rate based on similar deals). Banker judgment, not Member-stated.
> - `member_stated_in_followup` — Parameter value the Member provided directly in a follow-up after the Show phase (e.g., "actually our average call value is closer to $850"). Highest-confidence provenance.

---

*Folded into `03_Data_Framework.docx`: PENDING.*
