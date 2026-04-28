# SPRINT_1_PROMPT_1.md

**Sprint 1 — Member profile refinement pass · Prompt 1 of 1**

This is the first executable prompt against the locked DEMO_BUILD_PLAN.md. Read DEMO_BUILD_PLAN.md §3 (Sprint 1 acceptance criteria) before starting; this prompt details the work, those criteria define done.

Reference governance documents (consult as needed during execution):
- `docs/design/01_Overview.docx` — system orientation
- `docs/design/02_Semantic_Discipline.docx` — AI-native ontology principles
- `docs/design/03_Data_Framework.docx` — schema authority
- `docs/design/04_Module_and_Data_Flow.docx` — module boundaries and data flow
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content
- `BLAZE_STYLE_GUIDE.md` — visual identity authority
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry (NEW — created in this prompt)

---

## Scope of this prompt

Refinement pass on Jenny's Member profile. Five work blocks:

- **Block A:** Cleanup — strip internal-vocabulary leaks (5 items)
- **Block B:** Sidebar redesign — "what's hot" prioritized action feed
- **Block C:** Layout reorganization — delete Active state band, reorder, deduplicate titles
- **Block D:** Tag and chip discipline — establish enum-vs-numeric pattern, hover provenance, resolve double-ups
- **Block E:** Verb-pattern propagation — registry creation, application to ActionCards/Artifact share/Conversations

Plus housekeeping:
- Rename recency enum value `acute_recent` to `recent`
- Update BLAZE_STYLE_GUIDE.md, lib/relation-names.ts, BUILD_LOG, OPEN_QUESTIONS as relevant

**Out of scope for this prompt** (explicit deferrals — DO NOT do these in this prompt):
- The progress-bar visualization on Suggested Next Step (that's Sprint 2)
- The context-aware Suggested Next Step logic when Member has active engaged Recommendation (that's Sprint 2)
- Any work on /members/[id] dynamic route generalization (that's Sprint 3)
- The Meeting Recap module (that's Sprint 4)
- Schema additions to Recommendation status enum (that's Sprint 2)

Stop and check in after the full prompt completes. Single checkpoint at end of prompt; do not pause mid-prompt unless you encounter a real blocker.

---

## Block A — Cleanup (strip internal-vocabulary leaks)

Five items to remove from Jenny's Member profile. Each is unambiguously internal vocabulary that should never have surfaced to bankers.

### A.1 — Strip the summary-template footer

The Active state band currently shows:
> "Generated from the Member summary template (lib/summaries.ts · v1). Tokens above link to the relevant band."

Remove this footer entirely from the Active state band. The summary's provenance is captured in MemberSummarySnapshot records — that's the audit trail. The banker doesn't need to see implementation references on the production surface.

If you want a hidden inspector view for debugging, put it behind a key combination or admin route. Don't ship it on the main profile.

### A.2 — Strip the rule reference line

The Suggested next step card currently shows:
> "Surfaced by rule: Surface seasonal cash flow track for small caterers"

Remove this line entirely. Rule references are internal logic. The banker doesn't need to know which rule fired any more than a doctor needs to see which database query produced the patient's chart.

### A.3 — Strip the editor-facing track description; replace with member-facing prose

The Suggested next step card currently shows the canonical Growth track description authored for the Growth lead's track-editor view:
> "Surfaces seasonal cash flow stress for small caterers, quantifies the gap, renders a parameterized smoothing chart, and closes with a sized LOC proposal. Designed for owner-operator catering businesses in their first three years where seasonality is the dominant cash flow shape."

This is editor-facing language. On a banker's profile, replace with member-facing copy.

**Schema addition:** Add a new field to GrowthTrack:
- Field name: `banker_facing_purpose`
- Type: String (max 250 chars)
- Description per Semantic Discipline: "The member-specific framing of the Track's purpose, written for the banker reading a Member profile. Distinct from the canonical Track description (which is editor-facing) and from the suggested_opening on individual ActionCards (which is member-facing prose for outbound communication). Surfaces on the Suggested Next Step card."

Populate for the three Growth tracks:
- Jenny's Track: "Walk Jenny through how a $75K line of credit would smooth her slow months and capture revenue she's currently leaving on the table during winter."
- Northland's Track: "Walk Dan through how financing two new trucks would let him capture the ~70 service calls he's been turning away each peak season."
- Cygnus's Track: "Bring Marcus into the conversation early — Margaret's leadership team is moving on a $4-7M expansion and Blaze should be the bank that earns this deal."

Render `banker_facing_purpose` on the Suggested Next Step card in place of the stripped editor description.

Update lib/relation-names.ts only if a new relationship is introduced (likely no; this is a scalar field on GrowthTrack).

### A.4 — Strip BAND numbers from section headers

Section headers currently show "BAND 2", "BAND 3", "BAND 4", "BAND 5", "BAND 6" appended to the section labels. Band numbers are design-conversation vocabulary that was never meant to surface in production UI.

Remove the band-number suffix from all section headers across the Member profile. Section labels become just the descriptive name + the subtle subtitle:
- "Active state · where things stand" (without "BAND 2")
- "Active signals · what we know about Jenny's Catering right now" (without "BAND 3")
- "Active proposals · recommendations on the table" (without "BAND 4") — note this band gets renamed to "Open opportunities" in Block C
- "Open work · ActionCards for Jenny's Catering" (without "BAND 5")
- "History · conversations and Artifact share record" (without "BAND 6")

The "Member" band header is unaffected.

### A.5 — Strip "for small caterer" suffix on Track names when on Member profile

The Track name "Smooth seasonal cash flow with LOC for small caterer" reads naturally in the canonical Track library (where it lives alongside other tracks for other Member Types). On Jenny's specific Member profile, the "for small caterer" suffix is redundant — we know she's a small caterer.

When rendering a Track name on a Member profile, strip the trailing "for [member_type]" if present. The full canonical name remains in the database; only the display strips.

**Implementation choice (your call, document in BUILD_LOG):**
- Option 1: Stripping logic in the rendering component (regex-based; works against the canonical name)
- Option 2: Add `display_name_short` field to GrowthTrack and use it on Member profiles

Either is acceptable. Option 2 is cleaner if other places need the short form too; Option 1 is faster if this is the only consumer.

Apply the same logic for Northland's "Unlock growth capacity with fleet financing for HVAC trades" → strip the suffix; for Cygnus's "Earn the capital event with the right team in the room" → no suffix to strip (already clean). Verify these render correctly across all three Members even though full multi-Member generalization is Sprint 3 work.

---

## Block B — Sidebar redesign

The sidebar currently shows "Private notes" empty state, "Forward signals" empty state, and a "Sidebar visibility is banker-only" footer. All three are wasted real estate for empty content. Replace with a prioritized "what's hot" feed.

### B.1 — Remove existing sidebar contents

Drop the Private notes panel, Forward signals panel, and the visibility footer entirely. Forward signals as currently surfaced are orphaned; the data still exists in the schema for forward Signal records, but doesn't earn permanent sidebar real estate. Private notes can be reintroduced later as a small "+ Add note" affordance somewhere on the page (not in this prompt; defer).

### B.2 — Build a "what's hot" sidebar — prioritized action feed

Surfaces the top items demanding the banker's attention right now, ranked by computed priority. Uses existing fields from the schema — no new entities, no new scoring system.

**Priority scoring uses transparent bucketed rules:**

- **Bucket 1 (top priority):** Overdue ActionCards
  - Filter: `ActionCard.status IN [open, in_progress] AND ActionCard.due_at < today`
  - Sort within bucket: most overdue first
  - Display label: "Follow up overdue · [opportunity name] · [N] days late"
  - Hover detail: ActionCard rationale snippet (first 120 chars)

- **Bucket 2:** Open Opportunities awaiting response
  - Filter: `Recommendation.status = surfaced AND Recommendation.response IN [leaning_yes, neutral, leaning_no]`
  - Sort within bucket: most recently engaged first (by Recommendation.updated_at)
  - Display label: "Awaiting decision · [product] at [size] · member [response]"
  - Hover detail: last-touch date + primary concern

- **Bucket 3:** Aging painful or threatening Signals not yet linked to a Recommendation
  - Filter: `Signal.severity IN [painful, threatening] AND Signal.captured_at < today - 30 days AND Signal.active = true AND Signal NOT IN any Recommendation.responds_to_signals`
  - Sort within bucket: oldest first
  - Display label: "Unaddressed · [Signal display name] · [N] [days/weeks/months] stale"
  - Hover detail: their_words quote (first 100 chars)

- **Bucket 4:** Recently captured high-engagement Artifact shares
  - Filter: `Artifact share record where reaction = engaged AND shared_afterward = true AND created_at > today - 14 days`
  - Sort within bucket: most recent first
  - Display label: "Member engaged · [Artifact name] · sent as takeaway [N] days ago"
  - Hover detail: artifact name + Conversation context

**Output:** Top 4 items across all buckets, ordered by bucket then within-bucket sort. Cap at 4; if fewer than 4 exist, show fewer (no padding with placeholders).

For Jenny's current state, the sidebar should show approximately:
1. Follow up overdue · Working Capital LOC · 3 days late
2. Awaiting decision · Working Capital LOC at $75K · member leaning yes
3. (Possibly) Unaddressed · Slow customer payments · 4 months stale (depending on captured_at vs demo-now)
4. Member engaged · Seasonal cash flow smoothing chart · sent as takeaway 17 days ago

**If a Member has nothing in any bucket** (e.g., a quiet Member with no overdue work, no active proposals, no painful signals), the sidebar simply shows nothing — no empty state message, no "everything looks calm" placeholder. Empty real estate is better than filler text.

### B.3 — Implementation pattern

Build a small priority computation module:

**File:** `lib/priorities.ts`
**Exports:** `computeTopPriorities(memberId: string): Promise<Priority[]>`
**Pure function** over the Member's current state (queries Prisma; doesn't mutate)

Priority shape:
```
type Priority = {
  id: string;                    // unique id for React key
  bucket: 1 | 2 | 3 | 4;
  label: string;                 // display text
  detail: string;                // hover detail
  linkedEntityId: string;        // the source record id
  linkedEntityType: 'action_card' | 'recommendation' | 'signal' | 'artifact_share';
}
```

**Render in sidebar:** Simple ordered list. No icons, no badges, no decorative elements — restraint matches the borderless main column. Use the same chip/inline discipline established in Block D for any structured values within the labels.

Sidebar header: small section mark (orange rectangle) + label "Priorities" or "What's hot" — your design choice; document in BUILD_LOG.

---

## Block C — Layout reorganization

### C.1 — Delete the Active state band entirely

The Active state band's only unique content was the three clickable summary tokens ("2 active blockers", "1 open ActionCard", "$75K proposal"). The narrative summary itself duplicates content already shown in the Member band.

Delete the Active state band from the Member profile entirely. The summarizeMember template still exists in lib/summaries.ts and still generates MemberSummarySnapshot records — that's the audit trail. The narrative just stops appearing in the visible UI.

The three clickable tokens (active blockers count, open ActionCard count, proposal status) — these become navigational anchors that scroll to the relevant band when clicked. They appear nowhere visually until the page reorganization in C.2 places Open opportunities prominently. After C.2, the Member identity band can include a small "active summary line" with these three tokens at its bottom, but the band-as-narrative is gone.

### C.2 — Reorder bands

New top-to-bottom order on Member profile:
1. **Suggested next step** (kept at top)
2. **Open opportunities** (was Active proposals — see C.3 for rename)
3. **Member identity** (was at top; moves below opportunities)
4. **Active signals**
5. **Open work**
6. **History**

The reordering reflects banker priority: action → what's on the table → who is this business → why → what's pending → what happened.

### C.3 — Rename "Active proposals" to "Open opportunities"

The word "proposal" implies paperwork in formal commercial banking vocabulary. "Recommendation" is internal data-model name. "Open opportunities" captures the right register: active engagement, follow-up needed, not yet closed. Generalizes well across Jenny's $75K LOC, Northland's fleet loan, and Cygnus's CRE event.

Change all UI references from "Active proposals" to "Open opportunities". The underlying entity remains `Recommendation` in the data model; only the banker-facing display string changes.

Update CLAUDE.md §5 (vocabulary tier 2 list) to reflect the rename: "Open opportunities" (was Active proposals).

### C.4 — Strip redundant section title duplication

Each band currently shows section label + band title that say roughly the same thing. Example: "Active state · where things stand" then below it the H2 "Where things stand". Same content twice.

Remove the redundant H2 from every band. Pattern becomes:
```
[orange mark] Section name · subtle subtitle
[content begins immediately]
```

Apply across all bands.

---

## Block D — Tag and chip discipline

### D.1 — Establish the principle

**TAGGED** (chip pattern: monospace font, cool grey fill #F9FBFD, orange outline 1.5px #B45F26, square edges, 4px horizontal padding, 2px vertical padding, dark charcoal text #1A1A1A):

Reserved for **enumerated field values captured at a specific moment in a specific Growth step.** The system knows all possible values; this value is one of them.

Examples: `leaning yes`, `spouse`, `painful`, `member stated`, `recent`, `cpa`, `eager`, `engaged`

**INLINE** (no chip; bold dark text #1A1A1A, possibly with subtle data-cool background tint to maintain captured-value temperature signal but without the enum implication):

Used for **free numeric or string values captured but not from an enum set.** The format itself ($75K, $12K/quarterly, 45 days) carries the structure signal; a chip would imply enum membership when actually any value is possible.

Examples: **$75K**, **$12K/quarterly**, **45 days**, **70 calls**

### D.2 — Apply consistently

Audit current rendering and apply the principle:

- `$75K` in Open opportunities: change from chip to inline-bold
- `$12K/quarterly` in Active signals: already inline-bold (verify, no change needed)
- `45 days` in Active signals: already inline-bold (verify, no change needed)
- `leaning yes` in Open opportunities: keep as chip (correct, enum value)
- `spouse` in Open opportunities: keep as chip (correct, enum value)
- `high confidence` in Open opportunities: REMOVE entirely (see D.4)
- `standard` in Open opportunities: REMOVE entirely (see D.5)

For each Signal in Active signals, audit chips and verify only enum values are tagged:
- `manageable`, `painful`, `threatening` (severity enum) → chip
- `recent`, `ongoing`, `chronic`, `hypothetical_future` (recency enum) → chip
- `member stated`, `banker inferred`, `banker estimated from cues` (confidence enum) → chip
- Numeric magnitudes: inline-bold

### D.3 — Add hover tooltips on inline numeric values

Each inline numeric value gets a hover tooltip showing capture provenance.

Examples:
- `$75K` hover: "Captured 2026-04-08 in the Show step, Growth track 'Smooth seasonal cash flow with LOC', step 3"
- `$12K/quarterly` hover: "Captured 2026-04-08 in the Size step, banker_estimated_from_cues"
- `45 days` hover: "Captured 2025-12-04 in the service conversation, member_stated"

Tooltip on hover only — no click action in this prompt. Click-to-navigate is deferred until the Insight Engine's Conversation drill-in views exist (Sprint 5).

**Style the tooltip subtly:**
- Background: white (#FFFFFF)
- Border: 1px light cool grey (#E8EAEC)
- Text: 12px charcoal (#1A1A1A)
- Padding: 8px 12px
- Max width: 280px
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.06)
- Position: above the value with 8px offset; flips below if near top of viewport

### D.4 — Resolve the "leaning yes" + "high confidence" double-up

These describe different things (member's response to the proposal vs system's confidence in the original suggestion) but rendering them together creates competing signals.

**Decision:** Keep "high confidence" only on the Suggested next step card (where it represents system belief in the suggestion, signaling to the banker that the rule fired with strong conviction). Drop it from Open opportunities (where the relevant signal is member engagement state, not system confidence).

After this change:
- **Suggested next step card:** shows `high confidence` chip (system's confidence)
- **Open opportunities card:** shows `leaning yes` + `spouse` only (member engagement state)

### D.5 — Hide "standard" structure tag

Only show structure tags when the structure is non-standard. "standard" hides; "phased over 18 months" or "paired with equipment loan" shows.

For Jenny's Recommendation (structure = standard), the structure tag disappears entirely. Combined with the D.4 change, Jenny's Open opportunities card now shows only:
- `leaning yes` + `spouse` chips
- Inline-bold $75K with hover provenance
- The verb-prefix lines from existing implementation
- The one-line rationale summary + "View full rationale" expansion

Cleaner read.

### D.6 — Rename `acute_recent` recency enum value to `recent`

The current recency enum `acute_recent` collides linguistically with severity values like `painful`, creating the "acute recent · painful" double-up Francisco flagged. The word "acute" was meant to convey "felt sharply and recently" but it overlaps the severity vocabulary.

**Migration sequence:**
1. Add `recent` as a new value in the Signal.recency enum
2. Author its description per Semantic Discipline:
   > "recent: The issue or event was felt or occurred recently — within roughly the past 30 days. Distinct from `ongoing` (chronic-but-current) and `chronic` (long-running pattern)."
3. Migrate fixture data: change all `acute_recent` to `recent`
4. Verify lib/summaries.ts and any UI rendering uses the new value
5. Remove `acute_recent` from the enum
6. Run a clean re-seed to confirm

The enum becomes: `recent | ongoing | chronic | hypothetical_future`.

Update CLAUDE.md §5 if it references the old value. Log the migration in BUILD_LOG.

---

## Block E — Verb-pattern propagation

The pattern from Open opportunities ("→ serves goal:", "→ addresses blocker:", "→ responds to indecision:") propagates across the page. Every meaningful relationship gets a verb that names what it does.

### E.1 — Create the verb registry

**File:** `lib/verb-patterns.ts`

Canonical verb vocabulary with descriptions. Same Two-File Rule discipline as relation-names.ts — new verbs require adding here first before being used in code.

Initial registry contents:

```typescript
export const VERB_PATTERNS = {
  // Recommendation → Signal relationships
  serves: {
    description: "Recommendation or Conversation that addresses a member-stated goal Signal.",
    contexts: ["Recommendation → goal Signal", "Conversation → goal Signal"]
  },
  addresses: {
    description: "Recommendation or ActionCard that addresses a blocker Signal preventing member progress.",
    contexts: ["Recommendation → blocker Signal", "ActionCard → blocker Signal"]
  },
  responds_to: {
    description: "Recommendation or ActionCard that responds to an indecision Signal preventing closure.",
    contexts: ["Recommendation → indecision Signal", "ActionCard → indecision Signal"]
  },

  // ActionCard → other entities
  de_risks: {
    description: "ActionCard whose purpose is to de-risk an existing engaged Recommendation, typically by addressing a stated concern or providing supporting materials.",
    contexts: ["ActionCard → Recommendation"]
  },
  hands_off: {
    description: "ActionCard that transfers responsibility to a specialist Banker, typically with context for the receiving party.",
    contexts: ["ActionCard → specialist Banker"]
  },
  resolves: {
    description: "ActionCard whose completion will close out an open issue, blocker, or pending decision.",
    contexts: ["ActionCard → blocker Signal", "ActionCard → Recommendation"]
  },
  explores: {
    description: "ActionCard initiated to investigate a forward-looking trigger Signal whose implications are not yet clear.",
    contexts: ["ActionCard → trigger Signal"]
  },
  nurtures: {
    description: "ActionCard for ongoing relationship maintenance without immediate transactional intent.",
    contexts: ["ActionCard → Member"]
  },

  // Artifact share → other entities
  supports: {
    description: "Artifact share record indicating the artifact was used in service of a specific Recommendation or opportunity.",
    contexts: ["Artifact share → Recommendation"]
  },

  // Conversation → other entities
  produced: {
    description: "Conversation that originated a downstream Recommendation or significant Signal.",
    contexts: ["Conversation → Recommendation", "Conversation → Signal"]
  },
  captured: {
    description: "Conversation that originated a notable Signal (typically a goal, trigger, or blocker first surfaced).",
    contexts: ["Conversation → Signal"]
  },
  resolved: {
    description: "Conversation that closed an opportunity (committed, declined, or otherwise terminated).",
    contexts: ["Conversation → Recommendation closure"]
  },
  introduced: {
    description: "Onboarding-type Conversation that originated the Member relationship.",
    contexts: ["Conversation → Member relationship origin"]
  },
} as const;

export type VerbPattern = keyof typeof VERB_PATTERNS;
```

### E.2 — Apply verb-prefix lines to ActionCards in Open work

Each ActionCard shows what it relates to using the verb pattern:

```
[follow up chip] · owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue
→ de-risks opportunity: Working Capital LOC at $75K
[rationale text]
[Suggested opening (member-facing) block]
[from check in · Apr 8, 2026 · Capture closure]
```

The verb-prefix line is clickable. Clicking the linked entity name (Working Capital LOC at $75K) scrolls to the corresponding entry in Open opportunities and briefly highlights it (subtle background flash, ~600ms).

For Jenny's existing ActionCard:
- Type: follow_up
- Verb pattern: `de_risks`
- Linked entity: the $75K LOC Recommendation
- Display: "→ de-risks opportunity: Working Capital LOC at $75K"

### E.3 — Apply verb-prefix line to Artifact share records

Each Artifact share record shows what it supported:

```
Seasonal cash flow smoothing chart · shown Apr 8, 2026 · member reaction: engaged · sent as takeaway
→ supports opportunity: Working Capital LOC at $75K
```

Linked opportunity name is clickable, scrolls to Open opportunities.

### E.4 — Apply optional verb-prefix lines to Conversations in History

For Conversations that produced significant downstream artifacts, show what they produced:

```
Apr 8, 2026 · check in · in person · receptive · 32m
"this is exactly what I needed to see — wow"
Husband is the financial decision-maker; include him next time
→ produced: Working Capital LOC opportunity at $75K
→ 4 Growth step executions
```

Conversations without significant downstream products (the routine December 2025 service call, the September 2024 Visa renewal) don't show the verb line — skip rather than render an empty arrow.

For Jenny's history, expected verb lines:
- Apr 8, 2026 (check in): "→ produced: Working Capital LOC opportunity at $75K"
- Dec 4, 2025 (service): no verb line (routine)
- Sep 8, 2024 (check in): no verb line (routine)
- Mar 12, 2024 (check in): "→ captured: Goal — Smooth seasonal revenue with working capital" (the goal Signal that was banker_inferred from this conversation per the brief)
- Jun 15, 2023 (onboarding): "→ introduced: Member relationship"

### E.5 — Active Signals don't get verb-prefix lines in this prompt

Defer adding "→ contributes to opportunity:" lines to Active Signals. The Active signals band already shows the relationships that matter through chip/inline discipline. The inverse is shown elsewhere (Open opportunities lists the Signals it serves) — that's enough connectivity for now.

If a future iteration wants to surface this on Signals, it's defensible. Document the deferral in BUILD_LOG.

### E.6 — Discipline note for the verb registry

Where verbs reuse across sections, they must be identical, not approximations. The verb "serves" appears in Open opportunities ("→ serves goal:"); if a Conversation served a goal, the Conversation entry uses "serves", not "addresses" or "supports". The system's vocabulary should feel canonical, not freestyle.

If during implementation you find a need for a verb not in the registry, stop and propose addition rather than ad-hoc inventing one.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Add a new section §4.6 (or update §4.5) titled "Tag and chip discipline" that codifies:
- Chip pattern reserved for enumerated field values
- Inline-bold treatment for numeric values with hover provenance
- Specific styling specs (cool grey fill, orange outline, square edges, monospace, etc.)
- Examples of what gets which treatment

Add a new section §11 titled "Verb pattern" that codifies:
- Why every meaningful relationship gets a verb
- The canonical registry at lib/verb-patterns.ts
- The discipline that verbs reuse identically across surfaces, not as approximations
- Examples of correct vs incorrect application

### H.2 — Update lib/relation-names.ts

If the GrowthTrack.banker_facing_purpose field surfaces a relation worth naming (it likely doesn't — it's a scalar field), document it. Otherwise no changes to the registry from this prompt.

### H.3 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 1 Prompt 1 work shipped
- The five A-block cleanups
- Sidebar redesign with priority computation logic
- Layout reorganization
- Tag/chip discipline establishment
- Verb registry creation and propagation
- The acute_recent → recent enum migration
- Any decisions made during implementation that the prompt didn't pre-specify (e.g., the implementation choice between the two options in A.5)

### H.4 — Update OPEN_QUESTIONS

Add new items if any architectural questions surface during implementation. Move resolved items to the Resolved section.

### H.5 — Verify all three Member fixtures still load cleanly after changes

Even though /members/[id] generalization is Sprint 3 work, verify that Northland and Cygnus still load correctly after the schema additions and fixture updates. The banker_facing_purpose field needs values for all three Tracks; the recency enum migration affects all Members' Signals.

Run a clean re-seed and verify row counts are stable.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] All five Block A cleanups are visible on Jenny's profile (or rather: the things that were there are now gone, and the banker_facing_purpose is what shows on the Suggested Next Step card)
- [ ] Sidebar shows Jenny's prioritized list with at least 3 items in the expected order (overdue follow-up first, awaiting decision second, etc.)
- [ ] Bands appear in the new order: Suggested next step → Open opportunities → Member identity → Active signals → Open work → History
- [ ] No band shows duplicate section title (the band header alone, no H2 below it saying the same thing)
- [ ] "Active proposals" labeled as "Open opportunities" everywhere
- [ ] Jenny's Open opportunities card shows only `leaning yes` + `spouse` chips; $75K is inline-bold with hover tooltip
- [ ] No `high confidence` chip on Open opportunities; no `standard` chip on Recommendation
- [ ] Suggested Next Step card retains `high confidence` chip
- [ ] Hover provenance tooltips work on inline numeric values
- [ ] All chips show `recent` not `acute_recent`; recency enum cleanly migrated
- [ ] lib/verb-patterns.ts exists with the documented vocabulary
- [ ] ActionCard shows "→ de-risks opportunity:" prefix linking to the LOC Recommendation
- [ ] Artifact share record shows "→ supports opportunity:" prefix
- [ ] Apr 8 Conversation in history shows "→ produced:" line; Mar 12 shows "→ captured:" line; Jun 15 shows "→ introduced:" line
- [ ] BLAZE_STYLE_GUIDE.md updated with the new sections
- [ ] BUILD_LOG entry comprehensive
- [ ] Clean re-seed succeeds; row counts stable
- [ ] Northland and Cygnus profiles still load (smoke test, not full review)

## Report-back format

When complete, send back:

1. **Screenshots:** Top-to-bottom of Jenny's full Member profile (multiple screenshots if needed for the full page); the Artifact preview modal; the sidebar prioritized list
2. **The recomputed sidebar priority list** for all three Members (text output, showing what each banker sees on each Member's profile)
3. **The verb-patterns.ts content** as authored
4. **Any decisions made during implementation** that the prompt didn't pre-specify
5. **Any items logged to OPEN_QUESTIONS** during implementation

Stop and check in. Don't proceed to Sprint 2 work (Suggested Next Step intelligence + progress visualization) until this prompt is reviewed and accepted.
