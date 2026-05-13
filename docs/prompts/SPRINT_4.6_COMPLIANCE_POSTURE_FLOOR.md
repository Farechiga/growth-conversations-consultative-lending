# Sprint 4.6 — Compliance posture floor

**Prompt for Claude Code. Single checkpoint. Ships the compliance posture floor before v2 phase 1 work begins, so v2 inherits the right foundation. Estimated ~1-2 effective build days. This is a labeled-block prompt: ship as one checkpoint, with each block clearly delimited in the diff so visual review can probe each independently.**

## Pre-flight context for CC

You're picking up the build after Sprint 4 Prompt 4.2a Refinement Pass #2 (the work that shipped the ActionCard checkbox bug fix, the committed/funded "Closing" relabel, and the contextual Primary concern dropdown). The Path C-modified scope decision is committed: v2 ships as the primary EVP demo surface; this Sprint 4.6 ships the compliance posture floor that v2 will inherit; Sprint 4.7 ships v2 phase 1 immediately after.

**Sprint 4.6 ships compliance work to v1 routes only.** This includes the existing Member Profile and Growth Conversations pages. **The v2 build (Sprint 4.7) will inherit all of these patterns from the start** — so the work you do here (helper text content, keyword scan registry in `lib/compliance-keywords.ts`, banner copy, the softened taxonomy values, the `Capture discipline` callout content) is fully reused in v2. Don't over-invest in v1-specific UI styling that's about to be retired in favor of v2; do invest in the underlying logic and content because that lives forever.

**Read these governance documents before starting** (in order):
1. `COMPLIANCE.md` — particularly §6 (business-factor-only taxonomy), §10 (banker-facing posture commitments), §11 (audit sweep procedure context)
2. `PROTECTED_CLASS_KEYWORD_LIST_v1.md` — the keyword registry source list with editorial decisions E1-E6 already resolved by Francisco
3. `OPEN_QUESTIONS_AMENDMENTS_2026-04-29.md` — Q-013 and Q-041 resolutions for the taxonomy refactor

If any of these documents are not in `/mnt/project/` or the project knowledge folder, **stop and notify Francisco** rather than proceeding from inference. The documents are the source of truth for the work in this sprint.

## What ships in this sprint

Five blocks, all part of one checkpoint:

- **Block A — Field label and enum value refactor**. The `Recommendation.primary_concern` field's labels and enum values per COMPLIANCE.md §6.3.
- **Block B — Helper text on free-text fields**. Permanent advisory text on the four banker-prose fields per COMPLIANCE.md §10.2.
- **Block C — Submit-time keyword scan**. Soft-advisory scan against the protected-class keyword list per COMPLIANCE.md §10.3.
- **Block D — "Member Signals does not make credit decisions" banner**. Per-session disclaimer per COMPLIANCE.md §10.1.
- **Block E — "Capture discipline" coach callout**. Scaffolded surface with the 100-word framing per COMPLIANCE.md §10.4.

Plus governance doc updates: BUILD_LOG.md entry, OPEN_QUESTIONS.md amendments applied, BLAZE_STYLE_GUIDE.md §14.5 extension.

---

## Block A — Field label and enum value refactor

### A.1 Schema changes

**`Recommendation.primary_concern` enum** — replace the existing v1 hybrid enum with two value sets per COMPLIANCE.md §6.3.

**Open-thread context (when `member_response ∈ {engaged, leaning_yes, committed}`):**

```
pricing_concern
terms_concern
timing_concern
co_decision_maker_household
external_advisor
co_owner_or_board
service_or_capability_concern
other_open_thread
```

**Decline-reason context (when `member_response ∈ {declined, dismissive}`):**

```
pricing_uncompetitive
terms_uncompetitive
timing_misaligned
chose_alternative_lender
chose_alternative_funding
need_resolved_otherwise
need_no_longer_present
wants_to_revisit_later
service_or_capability_concern
other_member_stated
```

The `service_or_capability_concern` value appears in both contexts (with the same semantic meaning).

**Migration concerns:** Existing seed data that references retired enum values (`rate`, `timing`, `spouse`, `cpa`, `partner`, `bank_capability`, `does_not_qualify`, etc.) must be migrated. Author the Prisma migration to:
1. Add the new enum values
2. Migrate seed data: `rate` → `pricing_concern`, `timing` → `timing_concern`, `spouse` → `co_decision_maker_household`, `cpa` → `external_advisor`, `partner` → `co_owner_or_board`, `bank_capability` → `service_or_capability_concern`, `does_not_qualify` → (drop entirely; surfaced concerns now go to `Closing notes` free text per COMPLIANCE.md §8.2)
3. Remove the retired enum values
4. Update `lib/enum-descriptions.ts` with descriptions for all new values per COMPLIANCE.md §6 reference table

If SQLite enum constraints make this awkward, document the approach in BUILD_LOG and ship the cleanest solution available.

### A.2 Form-side changes

**Resolve form** (`growth-conversations` route, `resolve-section.tsx` or equivalent):

1. Field label switches contextually:
   - `member_response ∈ {engaged, leaning_yes, committed}` → label: **"Primary concern"**
   - `member_response ∈ {declined, dismissive}` → label: **"Member's stated reason for declining"**
   - `member_response = null` (no response yet selected) → field hidden entirely

2. Dropdown options switch contextually per the enum value sets above. Always show "Select…" as default placeholder.

3. View-mode summary uses the same conditional label resolution. A saved declined Member shows "Member's stated reason for declining: Pricing uncompetitive" (not "Decline reason: Pricing uncompetitive" — that was the v1 framing).

4. **Watch-item from previous turn:** When banker switches Response from engaged → declined (or vice versa), the existing `primary_concern` value may not be in the new option set. Auto-clear the dropdown to "Select…" when response change makes the current value invalid. This addresses the watch-item flagged in CC's previous report.

### A.3 Read-only summaries

Member profile and other surfaces that display saved `primary_concern` values use the same context-aware label resolution. When a saved value's enum was deprecated (shouldn't happen post-migration, but defend against), display gracefully with the raw value.

### A.4 Acceptance criteria for Block A

- [ ] Migration runs cleanly; existing seed data values are mapped to new values
- [ ] Open-thread context dropdown shows 8 values; decline-reason context dropdown shows 10 values
- [ ] Field label switches contextually
- [ ] Auto-clear works when banker switches response across contexts
- [ ] View-mode summary uses contextual label
- [ ] `lib/enum-descriptions.ts` documents all new values
- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm exec next build` succeeds

---

## Block B — Helper text on free-text fields

### B.1 Four fields receive helper text

Per COMPLIANCE.md §10.2, these four free-text fields get permanent (not dismissible) advisory text:

1. **Customer response** (Resolve form) — *"Focus on what the Member said and the business factors driving their decision. Avoid notes about personal characteristics, household circumstances, or social context."*

2. **Closing notes** (Resolve form) — *"Focus on observable business and cashflow factors: financing structure, timing, terms, costs, alternatives, business situation, decision process."*

3. **Description** (Action / Next step capture form) — *"Describe the business action and timing. Avoid notes about the Member's personal characteristics."*

4. **Suggested opening** (Recommendation / Member-facing prompt drafting, if exists in v1; if it doesn't yet, defer to v2) — *"Frame the opening around the Member's business situation and the consultation purpose. Avoid personal references."*

### B.2 Visual treatment

Helper text appears beneath each field label, above the field itself. Visual treatment:
- Italic, small text size (~13px or equivalent in Tailwind scale)
- Muted color (`var(--blaze-grey-soft)` or equivalent)
- Permanent — does not dismiss
- Indented slightly to create visual association with the field

Use existing BLAZE_STYLE_GUIDE patterns; don't invent new visual primitives.

### B.3 Acceptance criteria for Block B

- [ ] All four fields show helper text
- [ ] Helper text is italic, muted, persistent (not dismissible)
- [ ] Wording matches COMPLIANCE.md §10.2 verbatim
- [ ] Helper text styling consistent with existing BLAZE_STYLE_GUIDE

---

## Block C — Submit-time keyword scan

### C.1 Source data

The keyword list lives in a new file: `lib/compliance-keywords.ts`. Source content is `PROTECTED_CLASS_KEYWORD_LIST_v1.md` (in `/mnt/project/`), with editorial decisions E1-E6 already applied. The TypeScript source should:

1. Group keywords by protected-class category (Group 1-8 per the source document)
2. Be a structured export (not a flat array) — something like:

```typescript
export const COMPLIANCE_KEYWORDS = {
  race_color_origin: [...],
  religion_creed: [...],
  disability_health: [...],
  age: [...],
  sex_gender_orientation: [...],
  marital_familial: [...],
  public_assistance: [...],
  reprisal: [...],
};

export const ALL_KEYWORDS: ReadonlyArray<{ term: string; group: keyof typeof COMPLIANCE_KEYWORDS }> = [
  // flattened for matching
];
```

3. Include a comment at the top of the file with: source attribution, the editorial decisions reflected, and a note that "Pilot will calibrate this list based on real banker capture telemetry."

### C.2 Match logic

`lib/compliance-keywords.ts` exports a `scanText(input: string): MatchedTerm[]` function with these rules:

1. **Case-insensitive.** "Black" and "black" both match `Black`.
2. **Whole-word match.** "Asian" matches; "Caucasian" does not match the substring "asian".
3. **Unicode normalization.** Apply NFKC normalization and strip diacritics before matching, so "African‑American" (typographic hyphen), "African-American" (ASCII hyphen), and "African American" (space) all match the registered term `African-American` (with space-and-hyphen variants registered separately or normalized to one canonical form).
4. **Multi-word terms match contiguously.** "African American" matches when the two words appear in sequence; doesn't match "African-other-word-American".
5. **Returns matched terms with their group labels** for the prompt copy.

### C.3 Where it fires

The four free-text fields from Block B run the scan on submit:
- Customer response (Resolve form)
- Closing notes (Resolve form)
- Description (Action / Next step)
- Suggested opening (if exists)

Plus, in v1, any other banker-prose field that exists in current routes (Conversation banker_note, etc.). Audit your existing forms; apply the scan to all `[FL:BANKER-PROSE]`-equivalent fields.

### C.4 UX behavior

When scan returns matches, display a modal (or inline alert depending on form context):

> **Compliance check:** *this note mentions [matched term(s)]. Lending decisions and capture should focus on observable business and cashflow factors. Personal characteristics, household circumstances, and social context tend not to belong in member files. Continue saving, edit the note, or cancel?*

Three actions:
- **Continue saving** — proceeds with save; capture the dismissal as a `ComplianceScanEvent` (a new lightweight Prisma entity — see C.5).
- **Edit the note** — closes the modal, returns focus to the field for revision.
- **Cancel** — discards the in-progress capture; closes the form.

When scan returns no matches, save proceeds without modal.

### C.5 Telemetry capture

Add a new Prisma entity `ComplianceScanEvent`:

```prisma
model ComplianceScanEvent {
  id              String   @id @default(cuid())
  occurred_at     DateTime @default(now())
  banker_id       String
  banker          Banker   @relation(fields: [banker_id], references: [id])
  field_name      String   // e.g., "Resolve.customer_response"
  matched_terms   Json     // array of { term: string, group: string }
  banker_action   String   // "continued" | "edited" | "cancelled"
  member_id       String?  // optional, when scan happens in member-context form
  member          Member?  @relation(fields: [member_id], references: [id])
}
```

This entity supports the Pilot calibration commitment ("the keyword list iterates based on real banker capture telemetry") without requiring full immutable trace log infrastructure (deferred per Path C-modified).

### C.6 Demo behavior

For demo phase, the keyword list is the v1 list as authored. No banker-side calibration UI; the list is updated in source code if it needs revision.

For the EVP demo, ensure the scan fires on at least one obvious test case (e.g., entering "Member's husband mentioned…" in Customer response → scan flags the term "husband" via the Marital/familial group). The system should demonstrate visibly during demo.

### C.7 Acceptance criteria for Block C

- [ ] `lib/compliance-keywords.ts` exists with all ~240 terms from the registry
- [ ] `scanText()` function works per match logic spec
- [ ] All four free-text fields (and any other `[FL:BANKER-PROSE]`-equivalent v1 fields) run the scan on submit
- [ ] Modal/alert displays correctly with three actions
- [ ] `ComplianceScanEvent` entity captures dismissal events
- [ ] Demo can showcase the scan firing during EVP walkthrough

---

## Block D — "Member Signals does not make credit decisions" banner

### D.1 Banner content

Per COMPLIANCE.md §10.1, banner copy:

> *Member Signals supports your consultative conversations. Lending decisions, formal underwriting, and adverse action determinations occur in the lending decisioning system. Captures here are working notes for relationship management.*

### D.2 Display logic

- Visible on first session visit per banker (track via session storage, not persistent storage)
- Subtle styling — small banner at top of page, neutral color (not coral, not orange)
- Dismissible — banker clicks dismiss → banner persists collapsed for the rest of the session
- Position: above the existing Macro context banner if one is present; below the page header

### D.3 Where it appears

For Sprint 4.6: appears on the v1 Growth Conversations page (`/growth-conversations`). Member profile page does not need it (the consultative work happens in Growth Conversations).

For v2 (Sprint 4.7): the same banner pattern appears on `/v2/members/[id]`. Sprint 4.6 work establishes the component; Sprint 4.7 reuses it.

### D.4 Visual treatment

- Background: light neutral, possibly a subtle warm parchment tone (`var(--blaze-cream)` or similar, but not orange)
- Text: regular weight, readable, no italic
- Dismiss button: small "✕" or "Dismiss" affordance, top-right of banner
- No call-to-action button (it's informational, not actionable)

### D.5 Acceptance criteria for Block D

- [ ] Banner appears on first visit to Growth Conversations
- [ ] Banner persists dismissed state for session
- [ ] Banner copy matches COMPLIANCE.md §10.1 verbatim
- [ ] Visually subtle — does not compete with primary content
- [ ] Component is reusable for v2 (will be invoked from `/v2/members/[id]` in Sprint 4.7)

---

## Block E — "Capture discipline" coach callout

### E.1 Content

Per COMPLIANCE.md §10.4, callout copy:

> *Captures in Member Signals are working notes for consultative conversations. The most useful captures focus on the Member's business situation, cashflow patterns, decision process, and stated concerns. Less useful — and potentially problematic — captures include personal characteristics, household details, or social context unrelated to business decisions. When in doubt, ask: would I want a regulator, my compliance officer, or the Member themselves to read this note?*

### E.2 Surface

For Sprint 4.6: a "Capture discipline" link or affordance on the Growth Conversations page (probably in the page footer or as part of a help menu). When clicked, displays the callout text in a modal or expanded section.

For v2 (Sprint 4.7): the same content lives in the "show ?" coach surface per ARCHITECTURE_V2.md §11. Sprint 4.6 establishes the content; Sprint 4.7 reuses it.

### E.3 Visual treatment

- Inline expansion or modal — banker's choice based on what fits the existing design pattern
- Quoted/italicized in the rendered display to match the source-file framing
- "Got it" or "Close" affordance to dismiss

### E.4 Acceptance criteria for Block E

- [ ] "Capture discipline" affordance is accessible from Growth Conversations
- [ ] Callout displays the verbatim copy from COMPLIANCE.md §10.4
- [ ] Component is reusable for v2

---

## Governance doc updates

After Blocks A-E ship and visual review confirms acceptance:

1. **BUILD_LOG.md entry** — comprehensive entry for Sprint 4.6 with:
   - What shipped per block
   - Decisions made during implementation (e.g., Prisma enum migration approach)
   - Lessons recorded
   - Cross-references to COMPLIANCE.md, OPEN_QUESTIONS amendments

2. **OPEN_QUESTIONS.md amendments applied** per `OPEN_QUESTIONS_AMENDMENTS_2026-04-29.md`:
   - Add Q-040 through Q-048 to Open section (Q-040 is closed in same file via Section B; apply the resolution)
   - Move Q-013, Q-029, Q-039, Q-040, Q-041 to Resolved section with the resolution metadata

3. **BLAZE_STYLE_GUIDE.md §14.5 extension** — document:
   - The contextual Primary concern label and value set table
   - The compliance disclaimer banner pattern
   - The helper text discipline for banker-prose fields
   - The Capture discipline callout

---

## Pilot deferrals to honor

Sprint 4.6 does not ship:

- **Wave 1 compliance tagging sweep** (the full schema-wide `[FL:*]` tagging). Helper text and submit-time scan ship; tags themselves wait for a focused turn post-EVP.
- **Immutable decision-trace log**. Deferred per Path C-modified to Pilot. ComplianceScanEvent is the lightweight stand-in for telemetry capture; it does not satisfy the full audit-trail commitment.
- **§1071 readiness work**. Pilot deferral.
- **Adverse action notice integration**. Pilot deferral.
- **Counsel review of all banker-facing copy**. Pilot transition requirement.

These are documented in COMPLIANCE.md §12 as Pilot deferrals; CC should not attempt to address them here. If a question arises during 4.6 implementation that touches these areas, log to OPEN_QUESTIONS.md and proceed conservatively.

---

## Reporting back

When Sprint 4.6 is complete, report back with:

1. Confirmation that Blocks A-E shipped per acceptance criteria
2. Screenshots of:
   - Resolve form with engaged-spectrum response (Primary concern dropdown showing 8 open-thread values + helper text)
   - Resolve form with declined response (Decline reason dropdown showing 10 decline values + helper text + customer response field with helper text)
   - Submit-time scan modal firing on a test phrase
   - Banner on first visit to Growth Conversations
   - Capture discipline callout
3. Migration log: which seed values were mapped to which new values
4. Any deviations from the spec (with rationale)
5. Any new questions logged to OPEN_QUESTIONS.md
6. Any acceptance-criteria items that proved infeasible (with explanation)

Visual review will probe each block independently. Plan the diff structure so each block is a delimited section in the change log.

---

## Estimated scope

1-2 effective build days. If scope creep emerges (e.g., Prisma enum migration takes longer than expected, or v1 has more banker-prose fields than the four documented), surface this early in the build rather than late.

If the work threatens to exceed 2 days, **stop and re-scope with Francisco** before shipping. The compliance posture floor is high-priority but it must not block Sprint 4.7 (v2 phase 1) — that's the major deliverable for the EVP demo.
