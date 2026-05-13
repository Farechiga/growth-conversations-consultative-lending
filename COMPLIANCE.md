# COMPLIANCE.md

**Standalone fair lending and compliance governance reference for Member Signals. Captures the regulatory grounding, the clean-room architectural principle, the protected-class-data discipline, the Member Type governance rule, the compliance tag taxonomy, and the audit framework. Read this before authoring any field, copy, or capture surface that touches Member-decision-relevant data.**

**Status:** Authoritative. Demo and v2 must conform to this document. Pilot inherits the framework with extensions noted.

**Authored:** 2026-04-29.

**Scope:** Demo phase compliance posture. Pilot transition will require formal counsel review per §11.

**Cross-references:** ARCHITECTURE_V2.md (the v2 architecture this compliance work supports), EVIDENCE_FRAMEWORK.md (compliance tag mappings per evidence type), PROTECTED_CLASS_KEYWORD_LIST_v1.md (the keyword inventory for submit-time text scan), OPEN_QUESTIONS.md (logged questions Q-041, Q-042, Q-044+ tracked here).

---

## 1. Regulatory grounding

Member Signals operates under the union of federal and Minnesota fair lending requirements. Demo phase has near-zero direct regulatory exposure (no real Members, no real credit decisions); the discipline below is sized for Pilot phase, where the schema and patterns we ship now will be inherited.

### 1.1 Federal frameworks

- **Equal Credit Opportunity Act (ECOA)** — 15 U.S.C. § 1691 et seq., implemented by **Regulation B** at [12 CFR Part 1002](https://www.ecfr.gov/current/title-12/chapter-X/part-1002). Prohibits discrimination on race, color, religion, national origin, sex, marital status, age, receipt of public assistance income, exercise of CCPA rights. Adverse action notice rules at §1002.9 (different timing/content for businesses ≤$1M revenue, businesses >$1M revenue, and trade credit).
- **Fair Housing Act (FHA)** — 42 U.S.C. §§ 3601–3619. Applies to residential real-estate-related transactions. Adds familial status and disability as protected classes.
- **FFIEC Interagency Fair Lending Examination Procedures** — the uniform examination framework adopted by OCC, FDIC, FRB, NCUA, and CFPB. Defines disparate treatment, disparate impact, redlining, steering as analytical categories. [FFIEC Procedures PDF](https://www.ffiec.gov/sites/default/files/media/press-releases/2020/2020-june-24-fairlending.pdf).
- **ECOA §1071 / Regulation B Subpart B** — small business lending data collection. Compliance dates currently in flux per the November 2025 CFPB proposed rule. Demo schema doesn't touch §1071 data; Pilot will need readiness.
- **UDAAP (Dodd-Frank §§1031, 1036)** — 12 U.S.C. §§ 5531, 5536. Catch-all unfair/deceptive/abusive authority. Applies to Member-facing language including labels stored against Member files.
- **Servicemembers Civil Relief Act / Military Lending Act** — service-member protections; on NCUA's 2025 supervisory priority list.

### 1.2 Minnesota state frameworks

- **Minnesota Human Rights Act (MHRA)** — [Minn. Stat. ch. 363A](https://www.revisor.mn.gov/statutes/cite/363A.16). Among the strongest state civil rights laws in the U.S. §363A.16 (Credit Discrimination) prohibits discrimination on race, color, creed, religion, disability, national origin, sex, sexual orientation, marital status, public assistance receipt (including medical assistance and housing subsidies). §363A.03 broader definitions add familial status and gender identity. May 2024 amendments (effective Aug 1, 2024) added familial status protection in commercial credit, directly relevant to Blaze's commercial focus.
- **Minn. Stat. ch. 52** — credit union supervision under the Minnesota Department of Commerce. Safety/soundness + member protection examinations for state-chartered credit unions.
- **Minnesota UDAP** — [Minn. Stat. §§ 325F.69, 325D.43–.48](https://www.americascreditunions.org/blogs/compliance/remember-udap-udaap). State analog to federal UDAAP, AG-enforced.

### 1.3 The MHRA expansion vs. ECOA

MHRA covers more protected classes than federal ECOA: specifically sexual orientation, gender identity, status with regard to public assistance receipt, and familial status (in commercial credit). A pattern that's safe under ECOA may still violate MHRA. Anything that captures categorical Member observations should be designed against MHRA's protected-class set, not just ECOA's.

### 1.4 The "applying the principle" framing

§1002.107(b)(1) — the §1071 firewall provision — requires creditors collecting §1071 demographic data to procedurally separate data collection from underwriter access. The demo does not collect §1071 demographic data, so §1002.107(b)(1) does not directly apply.

However, the demo and v2 architecture **apply the principle of §1002.107(b)(1)** as a generalized discipline across all prohibited-basis factors and proxy-risk fields. This is best practice, not regulatory compliance. The architecture documents and Pilot transition plan reflect this framing precisely:

> *"Clean-room architecture: applying the §1002.107(b)(1) firewall principle (originally scoped to §1071 demographic data) as a generalized discipline across all prohibited-basis factors. The regulation requires this for §1071 data; we extend it as best practice for all protected-class data and proxy-risk fields."*

This phrasing must appear verbatim (or substantively identical) in any compliance-related copy. Alternative phrasings that imply the demo "complies with §1002.107(b)(1)" are inaccurate — the regulation has narrower direct scope.

---

## 2. The compliance tag taxonomy (Wave 1)

Every field in the schema carries one or more compliance tags. Tags are machine-readable, version-controlled, and CI-enforced. Demo phase ships eight tags; later waves add more (per ARCHITECTURE_V2 design conversation).

### 2.1 Wave 1 tags (demo phase)

| Tag | Meaning | Example fields |
|---|---|---|
| `[FL:PROXY-RISK]` | Field could correlate with protected class in disparate-impact analysis; subject to periodic correlation testing in Pilot | Member Type, Industry Family, geographic fields, captured Indecision types |
| `[FL:DECISION-TRACE]` | Field is part of the credit decision audit trail; should be reconstructable; immutable in Pilot | Recommendation, Signal, Conversation, ActionCard, GrowthStepExecution, Model, Reaction, ShowEvent |
| `[FL:ADVERSE-ACTION]` | Field that resembles or substitutes for an adverse action notice element; framing must clearly distinguish from formal Reg B adverse action | `primary_concern` in DECLINE_REASON context, decline reason taxonomy |
| `[FL:PRE-APP-OBS]` | Field captures pre-application banker observation about Member fitness; Pilot retention/access policy required | Reserved for Pilot; see §5.2 below |
| `[FL:UDAAP-LANG]` | Field whose label or value strings are surfaced to or describe the Member; UDAAP scope | All enum labels, dropdown displays, summary prose templates, Member quotes when surfaced back to Member |
| `[FL:BIZ-FACTOR]` | Affirmative declaration: this field captures only business/financial/cashflow factors (the "clean room" inhabitants) | revenue_band, employee_count, industry_naics, sizing measurements, cashflow projections, business decision-process facts |
| `[FL:DECISION-PROCESS]` | Field captures business-decision-process facts (who has authority, timing of board approval, etc.) — not personal/social observations | `co_decision_maker_household` (formerly `spouse`), `external_advisor` (formerly `cpa`), `co_owner_or_board` (formerly `partner`) |
| `[FL:BANKER-PROSE]` | Free-text banker observation field; subject to F-7 helper text and submit-time keyword scan | Customer response, Closing notes, Methodology note, Recommendation rationale, Context note, Suggested opening |

### 2.2 Wave 2 tags (deferred to post-EVP)

The following tags are designed but not implemented in Wave 1. They become meaningful when their referent infrastructure exists (immutable trace log, formal §1071 schema, retention policies):

- `[FL:CLEAN-ROOM-IN]` — input field to lending decisioning system; must be `[FL:BIZ-FACTOR]`
- `[FL:CLEAN-ROOM-OUT]` — output field from lending decisioning system; reasoning must be reconstructable from `[FL:CLEAN-ROOM-IN]` inputs only
- `[FL:HASH-CHAINED]` — field is part of an append-only hash-chained audit log
- `[FL:RETENTION-BOUND]` — field is subject to retention/deletion requirements; Member-scoped and purgeable
- `[FL:GOV-ARTIFACT]` — field carries governance metadata (Macro authorship, curator credentials, evidence links)
- `[FL:CONSENT-SCOPE]` — field captures data whose use is bound by consent or purpose-limitation
- `[FL:DEMOG-1071]` — field that is or maps to §1071-required demographic data point
- `[FL:STEER-RISK]` — field or logic that affects which products are recommended to whom

### 2.3 Tag storage and CI enforcement

Tags live in two synchronized locations:

- **Prisma schema comments** — inline `/// [FL:BIZ-FACTOR] [FL:DECISION-TRACE]` style, attached to the field declaration. Lifts during schema changes.
- **`compliance-tags.json` registry file** — machine-queryable map of `Model.field → [tags]`. Single source of truth for the audit sweep.

CI check enforces:
1. Every field with a `[FL:*]` schema comment has a matching entry in the registry.
2. Every registry entry references a field that exists in the schema.
3. Wave 2 invariants (when applicable): every `[FL:CLEAN-ROOM-IN]` field carries `[FL:BIZ-FACTOR]`.

CI failures block merge. This makes the tag system load-bearing rather than aspirational.

---

## 3. The clean-room architecture

### 3.1 The principle

The Member Signals system reads only **business and cashflow factors**. Protected-class data does not flow into Member Signals. Lending decisions happen in a downstream system; Member Signals supports the banker conversation, not the credit decision.

The architecture has four layers:

1. **System of record (Pilot loan-origination + member system)** — holds protected-class data per §1071, Member identity, full underwriting determinations, formal adverse action records.
2. **Audit zone** — periodic disparate-impact analysis runs here with strict access controls, on data joined briefly from system of record. Results: aggregate correlation reports, no per-Member exposure to non-audit roles.
3. **Member Signals portal (this tool)** — reads only the business-factor projection of Member data. No protected-class fields. No formal adverse action records.
4. **Downstream lending decision system (Pilot)** — receives business-factor outputs from Member Signals plus Member's own application data; makes credit determinations; issues adverse action notices when applicable.

### 3.2 What enforces the clean-room

For demo: **enforcement by schema design**. Member Signals' Prisma schema simply does not contain protected-class fields. There is no "race" column, no "marital status" column, no "gender" column. Protected-class data cannot be in the system because there is no place to put it. This is shielding by *omission of capability* rather than *access control on present data* — a stronger architectural commitment.

For Pilot: **enforcement by API contract**. The system of record exposes a "business-factor projection" API. Member Signals reads only from that API. The system of record's full record (including protected-class data per §1071) is accessible only to the audit zone. The Member Signals layer cannot read protected-class data even if it tries.

The compliance-tags.json registry serves as ongoing audit evidence: a sweep of all `[FL:BIZ-FACTOR]` and `[FL:DECISION-PROCESS]` tags should verify that every input to lending-decision-relevant computation comes from a clean-room field.

### 3.3 Member Signals is not a credit decisioning system

Per ARCHITECTURE_V2.md §8, the v2 workstation displays a banner-level disclaimer:

> *Member Signals supports consultative banker conversations. It does not make credit decisions, generate adverse action notices, or substitute for formal underwriting. Captures are banker working notes; formal lending decisions occur in downstream systems.*

This framing must be visible in:
- The v2 workstation banner (once per session per Member)
- The COMPLIANCE.md document (here)
- All marketing/sales material describing the product
- Internal training material for bankers

The framing is **load-bearing** for the compliance posture. The architecture's defenses against fair-lending findings depend on the system being honestly characterized as a banker tool, not a decisioning system. Drift from this framing creates exposure.

---

## 4. The Member Type discipline

### 4.1 Statement

> **Member Type discipline.** Member Type is a classifier defined exclusively by observable business attributes: industry vertical (NAICS-aligned), revenue band, employee count, business lifecycle stage (startup / growth / established / mature), and product complexity. Member Type is not, must not be, and must not be inferred from: ownership demographics, geographic location of owners, owner identity, source of outside funding, or any other attribute correlated with a protected class under ECOA, FHA, or the Minnesota Human Rights Act. Periodic disparate-impact correlation testing of Member Type against actual member demographics is a Pilot-phase governance commitment.

### 4.2 Why Member Type needs explicit governance

Member Type is core to the system's value proposition (cohort intelligence, Macro context, Track-template matching, Insight Engine analytics). It is also exactly the kind of facially-neutral category that could correlate with protected class in disparate-impact analysis if not disciplined. The governance statement above codifies the discipline.

In v2, Member Type drives:
- Macro context matching
- Track-template applicable_member_types
- Tracks-supported-by-evidence strength scoring
- Inquiry-tracks panel cohort queries
- Insight Engine View 1 (Track Performance) cohort segmentation

If Member Type assignments correlated with protected class (even unintentionally), every one of those surfaces would be a steering or disparate-impact vector. The governance commitment is what protects the architecture.

### 4.3 Member Type assignment process

For demo: hand-curated per fixture (Jenny's Catering = Small Caterer; Northland HVAC = Trades & Construction; Cygnus Bioscience = Specialty Manufacturer). Assignments are obviously business-attribute-based; no demographic inference involved.

For Pilot: Member Type is assigned via a documented rules-based process using business attributes (NAICS code, revenue band, employee count, lifecycle indicators). Algorithmic assignment must be auditable and reproducible. No ML-derived assignment without an explainability framework.

### 4.4 The correlation test

Pilot phase commits to periodic disparate-impact correlation testing of Member Type against actual member demographics. The test is run by the audit zone (per §3) on aggregated data. Findings of statistically significant correlation between Member Type and any protected class trigger remediation: review of the Member Type definition, examination of underlying business attributes, possible re-segmentation.

Demo phase does not run this test (no demographic data exists in demo). Documentation of the test as a Pilot commitment is the evidence; the test runs once data exists.

### 4.5 Member Type changes and audit

When a Member's Type changes (e.g., a Small Caterer scales to Established Restaurant Group), the change is captured as a `[FL:DECISION-TRACE]` event with reason and date. Member Type drift over time is tracked.

---

## 5. Pre-application observation handling

### 5.1 The challenge

A banker may observe during conversation that a Member's credit/collateral/DTI profile would likely block formal underwriting. This observation is real and operationally useful for the banker; it is also a recognized fair-lending risk area per FFIEC examination procedures (pre-application screening can produce disparate-impact findings if it correlates with protected class).

The challenge: how to capture banker observations of structural fit without creating a paper-trail hazard.

### 5.2 Demo phase treatment

For demo: **structural fit observations are not captured as a structured field.** The schema does not have a `does_not_qualify` enum value, a `would_not_pass_underwriting` flag, or any equivalent. Bankers using the demo cannot capture this observation in structured form.

If a banker has the observation, they may use the Closing notes free-text field to record context for the next banker who picks up the relationship. The submit-time keyword scan and helper text in that field nudge toward business-cashflow framing.

### 5.3 Pilot phase decision (Q-042)

For Pilot, the question of whether to capture pre-application structural-fit observations as a structured field is open and tracked as Q-042 in OPEN_QUESTIONS.md. Three options under consideration:

- **Option A** — never capture structurally; Closing notes free text only (current demo approach)
- **Option B** — capture as a separate `[FL:PRE-APP-OBS]`-tagged field with explicit retention, access, and aggregation restrictions; suppressed from cross-portfolio aggregations; banker-only visibility
- **Option C** — capture but only after formal application has been initiated and adverse action notice has been issued, at which point the observation joins the formal record

Resolution requires counsel review. Demo defers; Pilot decides.

### 5.4 Why this matters for v2

ARCHITECTURE_V2 §3.3 (Consult objective) defines the primary_concern field as accepting member-decline-reason values when `member_response = declined`. The taxonomy is business-factor-only (rate_uncompetitive, terms_unfavorable, timing_misaligned, etc.). The taxonomy does **not** include `does_not_qualify` or equivalent bank-side determinations. This is the operational expression of the discipline above.

When CC implements the v2 + Resolve form for the declined-response case, the dropdown options must match the business-factor-only taxonomy. Reintroducing bank-direction values violates this discipline.

---

## 6. The business-factor-only taxonomy (member-decline reasons)

Per ARCHITECTURE_V2 §3.3 and the conversation that resolved Q-041, the decline-reason field uses a strict member-direction taxonomy. Bank-side underwriting determinations are excluded.

### 6.1 The taxonomy

| Value | Display label | Definition |
|---|---|---|
| `pricing_uncompetitive` | Pricing uncompetitive | Member said the rate, fees, or all-in cost was higher than an alternative they were considering |
| `terms_uncompetitive` | Terms uncompetitive | Member said the structure (covenants, collateral asks, amortization, prepayment) didn't fit their preferred deal shape |
| `timing_misaligned` | Timing misaligned | Member said the proposed financing didn't match their cashflow timing or business calendar |
| `chose_alternative_lender` | Chose alternative lender | Member said they're proceeding with a different lender |
| `chose_alternative_funding` | Chose alternative funding | Member said they're using non-debt funding (retained earnings, owner injection, vendor financing, etc.) |
| `need_resolved_otherwise` | Need resolved otherwise | The underlying business need was met without this financing |
| `need_no_longer_present` | Need no longer present | The underlying business situation changed; financing is no longer needed |
| `wants_to_revisit_later` | Wants to revisit later | Member is interested but not ready to act in this cycle |
| `service_or_capability_concern` | Service or capability concern | Member expressed concerns about the bank's ability to deliver (response time, expertise, product range) |
| `other_member_stated` | Other (member-stated) | Free-text capture; member stated a reason that doesn't fit above |

### 6.2 What this taxonomy is not

- Not the FFIEC adverse-action reason codes. Those describe bank-side decline of an application; this taxonomy describes member-side decline of a bank's offer.
- Not a Reg B adverse action notice substitute. When formal application is filed and bank declines, Reg B §1002.9 timing/content rules apply. This taxonomy is for pre-application conversation context.
- Not a stigmatizing characterization. Phrases like "doesn't trust the institution" or "doesn't qualify" are not in the taxonomy. The taxonomy describes what the Member said, not what the banker assessed.

### 6.3 The open-thread context primary_concern

When `member_response` is in {engaged, leaning_yes, committed}, the primary_concern field captures *what's the open thread keeping this from advancing?* This is a different semantic from the decline-reason context. The taxonomy is also business-factor-only; values include rate, timing, terms, co_decision_maker_household, external_advisor, co_owner_or_board, service_or_capability_concern, other.

The field label changes contextually: "Primary concern" for engaged-spectrum responses, "Member's stated reason for declining" for declined/dismissive responses. Field copy framing is part of the compliance posture; it appears in Q-013 resolution and is part of v2 phase 1 implementation.

---

## 7. Banker-prose discipline (F-7)

### 7.1 The pattern

Free-text banker capture fields are subject to three governance moves:

1. **Helper text** framing the field as business-cashflow-only capture
2. **Submit-time keyword scan** against PROTECTED_CLASS_KEYWORD_LIST_v1
3. **Banker training surface** explaining the discipline

### 7.2 Helper text

Each free-text field gets a helper text variant. Standard phrasing:

> *Focus on observable business and cashflow factors: the financing structure, timing, terms, costs, alternatives, business situation, decision process. Avoid notes on the Member's personal characteristics, household circumstances, or social context.*

Variants per field type adjust for context but preserve the business-factor-only framing.

### 7.3 Submit-time scan

When banker submits a capture form containing a free-text field:

1. The free-text content is scanned against PROTECTED_CLASS_KEYWORD_LIST_v1 (case-insensitive, whole-word, Unicode-normalized)
2. If any term matches, a soft advisory prompt appears:

   > *Compliance check: this note mentions [matched term(s)]. Lending decisions and capture should focus on observable business and cashflow factors. Personal characteristics, household circumstances, and social context tend not to belong in member files. Continue saving, edit the note, or cancel?*

3. Three actions: **Continue saving** (banker confirmed; capture proceeds; dismissal logged), **Edit** (returns to field), **Cancel** (discards capture)

The scan is advisory, not blocking. False positives are tolerated; false negatives are the real risk.

### 7.4 Telemetry

Every scan event logs:
- Which field fired
- Which terms matched
- Which action the banker took
- Banker ID, timestamp, Member ID

Telemetry feeds Pilot calibration of the keyword list. For demo, telemetry is captured but not surfaced anywhere.

### 7.5 Banker training surface

A "Capture discipline" callout, accessible from the Growth Conversations / v2 workstation page, lays out the F-7 framing in 100 words. Training surfaces are an FFIEC examination element (Part II, Compliance Management Review); making the training accessible at the moment of capture is best-practice CMS design.

---

## 8. The decline-reason field framing

The field that captures decline reason has had three iterations during the build (Q-041 history):

- v0: shared `primary_concern` enum used for both open-thread and declined contexts (directional confusion)
- v1: hybrid taxonomy with `does_not_qualify` value (partial business-direction; bank-side determinations leaked in)
- v2 (current): strict business-factor-only member-direction taxonomy (per §6 above)

The field label is contextual:
- `member_response ∈ {engaged, leaning_yes, committed}` → "Primary concern"
- `member_response ∈ {declined, dismissive}` → "Member's stated reason for declining"

This labeling matters: "Decline reason" by itself reads like an adverse-action-notice substitute. "Member's stated reason for declining" frames the field as member-side observation, not bank-side determination.

### 8.1 What's banned in this field's copy

- "Decline reason" (without member-stated framing)
- "Reason for adverse action"
- Anything that resembles Reg B §1002.9 reason-code language

### 8.2 What's required

- Field label is contextual per `member_response` value
- Helper text frames business-cashflow-only capture
- Enum values use the §6 taxonomy
- Submit-time scan applies if banker uses "other_member_stated" with free text

---

## 9. Audit sweep procedure

The compliance posture is enforced by periodic audit. The procedure:

### 9.1 Scope

Every field on every entity in `prisma/schema.prisma`. No exceptions.

### 9.2 Steps

1. **Inventory.** Run `compliance-tags.json` against the schema to enumerate all `[FL:*]` fields. Identify any untagged fields (these are findings).
2. **Map.** For each tag, identify the regulatory exposure (§1).
3. **Test.** For each `[FL:DECISION-TRACE]` field: verify reconstruction is possible (Pilot: immutability + audit log). For each `[FL:PROXY-RISK]` field: verify periodic correlation testing is scheduled (Pilot). For each `[FL:UDAAP-LANG]` field: verify displayed strings have been counsel-reviewed. For each `[FL:PRE-APP-OBS]` field: verify retention/access policy and that field is not surfaced to Members. For each `[FL:ADVERSE-ACTION]` field: verify Reg B §1002.9 timing/content rules are or are not triggered (and if not, verify field is structurally distinct from formal adverse action capture).
4. **Remediate.** Findings flow into standard remediation cycle.

### 9.3 Cadence

Demo phase: one audit before EVP demo ships, focused on schema and tag-registry integrity.

Pilot phase: quarterly audits, plus pre-launch audit before any new feature touching `[FL:DECISION-TRACE]` or `[FL:PROXY-RISK]` fields.

### 9.4 Audit deliverables

Each audit produces:
- Inventory of all tagged fields
- Findings list (untagged fields, missing controls, copy non-conformances)
- Remediation plan with owners and dates
- Counsel sign-off (Pilot only; demo defers)

---

## 10. Documents that depend on this one

This document is the compliance authority. The following depend on or extend it:

- **ARCHITECTURE_V2.md §8** — references the clean-room architecture established here
- **EVIDENCE_FRAMEWORK.md §7-8** — uses the Wave 1 tag taxonomy from §2
- **PROTECTED_CLASS_KEYWORD_LIST_v1.md** — implements §7's submit-time scan
- **BLAZE_STYLE_GUIDE.md** — capture form copy must comply with §7-8 framing
- **OPEN_QUESTIONS.md** — Q-041, Q-042, future Q-044+ tracked here
- **MEMBER_FIXTURE_BRIEF.md** — Member fixture content must not violate §3 (no protected-class data) or §7 (banker prose framing)
- **DEMO_BUILD_PLAN.md** — Sprint 4.6 (Compliance Posture) implements this document's controls

---

## 11. Pilot transition requirements

Demo phase implements the controls above. Pilot phase requires additional steps before launch:

1. **Counsel review.** A qualified financial-services compliance attorney reviews the schema, the compliance-tags.json registry, the COMPLIANCE.md framework, and the Pilot-specific architectural extensions. Sign-off required before any real Member data enters the system.
2. **§1071 demographic data point readiness.** Schema needs slots for the §1071 demographic data points and the procedural firewall between collection and underwriter access (literal §1002.107(b)(1) compliance, not just principle-application).
3. **Adverse action notice integration architecture.** Hard structural separation between Member Signals (banker working notes) and formal application/adverse-action records (loan-origination integration).
4. **Immutable decision-trace log.** Append-only, hash-chained DecisionTraceEvent entity with full coverage of state-changing operations. Per ARCHITECTURE_V2 design conversation (Sprint 4.5 deferred from demo).
5. **Periodic disparate-impact correlation testing.** Audit zone infrastructure built. First test runs after sufficient data accumulates.
6. **Member Type assignment process formalized.** Documented rules-based assignment using business attributes only; auditable; no demographic inference.
7. **Pre-application observation handling resolved.** Q-042 resolved with counsel input; structured field added or omitted per resolution.
8. **Submit-time keyword list calibrated.** Pilot calibration based on real banker capture telemetry from demo phase.
9. **Banker training operationalized.** F-7 capture discipline becomes part of RM onboarding and ongoing training.
10. **Compliance officer review dashboard.** Insight-Engine-style dashboard for compliance team to monitor patterns (high-frequency keyword fires, banker-prose anomalies, Member Type drift, etc.).

---

## 12. What this document is not

- **Not legal advice.** Everything here is grounded in published FFIEC, CFPB, NCUA, FDIC, and Minnesota MDHR guidance. Final compliance posture for Pilot must be reviewed by qualified counsel.
- **Not a definitive interpretation.** Several framings (the §1002.107(b)(1) principle application, the Member Type discipline, the business-factor-only taxonomy) are best-practice positions defensible against the published guidance. They are not the only defensible positions; counsel may refine.
- **Not exhaustive.** Other regulatory frames (Servicemembers Civil Relief Act, Military Lending Act, state-specific consumer protection statutes) may apply depending on Pilot scope. This document covers the dominant frames.
- **Not a substitute for compliance management system (CMS) infrastructure.** A real Pilot CMS includes ongoing monitoring, complaint-tracking, audit reports, and corrective-action workflows beyond what this document specifies.

---

## 13. Document maintenance

This document is the compliance authority for demo and v2. Updates happen when:
- Regulatory frameworks change (e.g., §1071 final rule resolves; new MHRA amendments)
- A new Wave 2 tag is implemented
- Counsel review surfaces revisions
- Q-041, Q-042, Q-044+ resolve in OPEN_QUESTIONS.md
- A new field is added to the schema requiring tag assignment

Updates are noted in BUILD_LOG.md with rationale and timestamp. Cross-referencing documents update in the same commit if affected.

---

**End of COMPLIANCE.md.**
