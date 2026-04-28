# SPRINT_2_PROMPT_2.md

**Sprint 2 — Suggested Next Step intelligence + Growth Track progress visualization · Prompt 2 of 2**

This is the second executable prompt in Sprint 2. Sprint 2 Prompt 1 was accepted on review (after the hard-refresh diagnostic resolved a CSS caching issue). The work in Prompt 1 added context-aware Suggested Next Step logic, the 10-value member_response enum with `funded` as terminal, and the adaptive Growth Track progress visualization.

Visual review of Prompt 1's output surfaced architectural questions that resulted in scope changes captured in DEMO_BUILD_PLAN.md v2 (uploaded separately). This prompt covers focused mechanical refinement that's tractable independent of the larger architectural shifts — work that should ship before Sprint 3 multi-Member generalization begins.

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2 plan (read this; it captures the architectural context for v2 changes)
- `docs/design/03_Data_Framework.docx` — schema authority
- `docs/design/04_Module_and_Data_Flow.docx` — module boundaries
- `BLAZE_STYLE_GUIDE.md` — visual identity (now four-tier display discipline; §12 progress visualization)
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry
- `lib/priorities.ts` — priority computation
- `lib/enum-descriptions.ts` — enum value descriptions

---

## Scope of this prompt

Six focused refinements that resolve known issues from Sprint 2 Prompt 1's visual review and prepare the codebase for Sprint 3's multi-Member generalization. None of these are architectural; they're mechanical fixes and small structural changes.

- **Block A:** Step-position-based completion tracking (fixes the Cygnus two-Ask-step issue CC flagged)
- **Block B:** Add Recommendation.updated_at field
- **Block C:** Add Recommendation.owned_by field with default = Member.primary_banker
- **Block D:** Reposition progress dots and add pipe separators between stage labels
- **Block E:** Merge Open opportunities + Open work bands into a single unified band
- **Block F:** Module rename — Meeting Recap → Growth Conversations (route, folder, user-facing strings only; historical references preserved)

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 3 work (multi-Member generalization, /members/[id] dynamic route, Northland and Cygnus Artifact rendering)
- Sprint 4 work (Growth Conversations module — the destination of "Run Growth Track" stays a placeholder destination for now)
- Visual treatment refinements beyond what this prompt specifies — keep Sprint 1 and Sprint 2 Prompt 1's visual discipline intact
- The track-agnostic Ask + Size architectural shift (Sprint 4 work)
- Stage label clickability (Sprint 4 work — destinations don't exist yet)
- Signal longevity model (Sprint 4 work)
- Skip handling (Sprint 4 work)
- Database table or column name changes for `meeting_recap` references (no migration; v1 schema preserved)

Stop and check in after the full prompt completes. Single checkpoint at end; do not pause mid-prompt unless you encounter a real blocker.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually. The Sprint 1 final review surfaced this; let's avoid the same diagnostic round.

---

## Block A — Step-position-based completion tracking

### A.1 — Replace step-shape-based completion check

CC flagged in the Sprint 2 Prompt 1 report-back:

> "Set-based executedShapes.has(step.step_shape) for completed-step check; works for demo (all-or-nothing) but flagged for production (Cygnus's two Ask steps would both mark completed if either ran)."

This is a real defect that will surface visually in Sprint 3 when Cygnus's profile renders. Fix it now.

The current implementation tracks completion by Growth step *shape* (Ask, Size, Show, Resolve, Connect). Cygnus's Track has two distinct Ask steps in sequence (`probe_capital_event_evaluation` and `discover_timing_driver`). With shape-based tracking, executing one Ask step would incorrectly mark both Ask stages as completed.

Replace with step-position-based tracking:

- Each GrowthStep instance has a unique identity within its Track (Track.growth_step_sequence ordering, plus the step's own ID)
- A stage is `completed` if there's a GrowthStepExecution record linking to *that specific GrowthStep instance* (not just any step with the matching shape)
- Each Track step instance gets its own progress dot, even if shapes repeat

For Cygnus: 4 progress dots for the 4 Track steps (Ask, Ask, Show, Connect) plus 2 post-Track lifecycle dots (Specialist engagement, Closed) = 6 dots total. The two Ask dots are independent — completing the first doesn't affect the second.

For Jenny and Northland (each Track step shape appears once): no behavioral change. The shape-based and position-based logic produces identical results.

### A.2 — Stage labels for repeated step shapes

When a Track has multiple steps of the same shape, the simple shape label ("Ask") creates ambiguity. Use the step's own short label or its position to disambiguate:

For Cygnus's two Ask steps:
- First Ask: label as "Ask" or "Ask 1" (your call — favor whatever reads cleanly)
- Second Ask: label as "Ask 2" or use a step-specific short label if available

Document the decision in BUILD_LOG.

### A.3 — Update computeTrackStages

Update the function in lib/priorities.ts (or wherever the stage computation lives) to read from GrowthStep instances by position, not by shape. Verify with seed data that:

- Jenny's progress visualization is unchanged (4 + 2 dots, all four Track stages completed)
- Northland's progress visualization is unchanged (4 + 2 dots, all four Track stages completed)
- Cygnus's progress visualization shows 6 dots with 4 completed + 1 current + 1 upcoming, and the two Ask stages render as independent dots

---

## Block B — Add Recommendation.updated_at field

### B.1 — Schema migration

Add a non-null `updated_at` field to the Recommendation entity:

```prisma
model Recommendation {
  // ... existing fields
  updated_at DateTime @default(now()) @updatedAt
}
```

Prisma's `@updatedAt` directive auto-updates this field on every mutation. No application-level changes needed for write paths (Prisma handles it).

### B.2 — Migration data

Seed data: set `updated_at` to a sensible historical value for existing Recommendations:
- Jenny's $75K LOC Recommendation: `updated_at` = same timestamp as the April 8 Conversation that produced it
- Northland's $180K Vehicle/Fleet Loan Recommendation: same as April 15 Conversation
- Cygnus's $2.4M Owner-Occupied CRE Recommendation: same as April 21 Conversation

### B.3 — Use in computeSuggestedNextStep

The Sprint 2 Prompt 1 `computeSuggestedNextStep` logic falls back to created_at for the multi-engagement ordering (which Recommendation to surface when multiple are active). Update this to use `updated_at` instead — more honest, since a Recommendation that was recently engaged matters more than one that was created earlier but has been stale.

For demo seed data, this has no behavioral effect (each Member has one engaged Recommendation), but the logic is now correct.

### B.4 — Update lib/relation-names.ts

If the new field surfaces in any prose, add the relation name. Likely not needed for the field itself (it's metadata, not surfaced in UI).

---

## Block C — Add Recommendation.owned_by field

### C.1 — Schema migration

Add an `owned_by` field to the Recommendation entity, defaulting to the Member's primary_banker:

```prisma
model Recommendation {
  // ... existing fields
  owned_by_id  String?
  owned_by     Banker? @relation(fields: [owned_by_id], references: [id])
}
```

The field is nullable but should always be populated in practice. On Recommendation creation, set `owned_by` to the producing Member's primary_banker if not specified explicitly.

### C.2 — Seed data

For each demo Member's Recommendation, set `owned_by`:
- **Jenny's $75K LOC**: owned by Scott Brynjolffson (Jenny's primary_banker)
- **Northland's $180K Vehicle/Fleet Loan**: owned by Scott Brynjolffson (Northland's primary_banker)
- **Cygnus's $2.4M Owner-Occupied CRE**: owned by **Marcus Webb** (different from Cygnus's primary_banker Scott — this is a CRE specialist-owned opportunity, the demo's example of cross-banker handoff)

The Cygnus case is the architecturally important one. It demonstrates that ownership is independent from primary banker relationship; specialists own product opportunities even when the relationship banker remains involved.

### C.3 — Display ownership on the unified band (per Block E)

Block E merges Open opportunities + Open work into a single band. Within that merged band, ownership renders prominently:

For Jenny (Scott owns): "owned by Scott Brynjolffson"  
For Cygnus (Marcus owns the CRE): "owned by Marcus Webb"

The ownership display is the primary visible difference between the two cases.

### C.4 — Update lib/relation-names.ts

Add a relation name for "owned by" if not already present. Verify that the prose treatment (`owned by [Banker.full_name]`) reads naturally in both cases.

---

## Block D — Progress dot repositioning and pipe separators

### D.1 — Reposition the progress visualization

The progress dots currently render in the upper-right of the Suggested Next Step card, opposite the title. Visual review showed this layout was crowded — the dots were getting cut off or overlapping with the rationale text below.

Move the progress visualization to the bottom of the card:

```
[orange mark] Suggested next step

[Title — e.g., "Follow up on Working Capital Line of Credit at $75K"]
[Subtitle — e.g., "Member is leaning yes · primary concern: spouse"]

[Body paragraph — the rationale text from B.2 in Prompt 1]

[Progress visualization — dots + stage labels with pipes — see D.2 below]

[Run Growth Track button]    [Dismiss]
```

The progress visualization sits between the body paragraph and the action buttons. It's visually distinct from both — gets its own breathing room (24px margin top, 24px margin bottom).

### D.2 — Add pipe separators between stage labels

The stage labels currently render below each dot as separate text elements. Add visible pipe separators between them to make the sequence read explicitly:

```
●─●─●─●─◉─○
Ask  |  Size  |  Show  |  Resolve  |  Decision pending  |  Funded
```

Specific CSS:
- Pipe character: `|` rendered in the same muted grey as upcoming-stage labels (#4F5052 or similar)
- Spacing: 12-16px on each side of the pipe
- The pipes do NOT change color based on stage state — they're separators, not signals
- Stage labels retain their state-based color (charcoal for current, body grey for completed, soft grey for upcoming)

The visual effect should be: dots above with their state-based color; labels below with state-based color; pipes between labels with constant muted grey.

### D.3 — Stage label readability

With the new layout, stage labels need to read clearly. Current font size is 10-11px per Prompt 1's choice. Verify:
- Labels are large enough to be readable at default screen widths
- Spacing between dots is wide enough that labels don't crowd
- "Decision pending" is the longest label and should not break across two lines on standard desktop widths (~1280px viewport)

If "Decision pending" is causing layout issues, two options:
- Shorten to "Pending" (slightly less clear but fits better)
- Allow it to wrap to two lines and adjust the dot spacing accordingly

Document the choice in BUILD_LOG.

### D.4 — Stage labels are not yet clickable

Per the architectural decisions (Sprint 4 will build the destinations), stage labels are styled as plain text for this prompt. NO underline, NO hover state suggesting clickability, NO cursor pointer.

Sprint 4 will make them clickable when the destinations exist.

---

## Block E — Merge Open opportunities + Open work bands

### E.1 — Establish the merger

Visual review surfaced that Open opportunities and Open work are showing the same underlying entity twice. Every ActionCard in the demo links to a specific Recommendation. The two bands tell the same story from two angles.

Merge them into a single unified band titled "Open opportunities" with subtitle "recommendations on the table".

### E.2 — Unified band content

Each opportunity card in the merged band shows:

```
[Recommendation title — e.g., "Working Capital Line of Credit at $75K"]
[Top-right: ownership · due date if ActionCard exists]

→ serves goal: [Goal Signal]
→ addresses blocker: [Blocker Signal]
→ responds to indecision: [Indecision Signal — only if Recommendation responds_to_indecision]

Member is [chip: leaning yes] · primary concern: [chip: spouse]

[Recommendation rationale paragraph]
> View full rationale (collapsible)

[If linked overdue ActionCard exists:]
Suggested opening · member-facing
"[suggested_opening text from ActionCard]"

▶ from check in on [date] · [contributing step name]
```

### E.3 — What appears at top-right of each opportunity

The top-right corner of each opportunity card carries:

1. **Ownership** (always shown): "owned by Scott Brynjolffson" or "owned by Marcus Webb"
2. **Due date with overdue status** (only if a linked overdue or upcoming ActionCard exists): "Due Apr 22, 2026 · 3d overdue" — in the soft-red treatment from before, prominently right-aligned

For Jenny:
```
owned by Scott Brynjolffson · Due Apr 22, 2026 · 3d overdue
```

For Cygnus's CRE opportunity (no overdue ActionCard for this scenario):
```
owned by Marcus Webb
```

### E.4 — What was in Open work that needs preserving

The information that lived in Open work that's not yet in Open opportunities:

- **Suggested opening text** from the ActionCard (the member-facing message draft) — preserve this; render it within the opportunity card as shown in E.2
- **The verb-prefix "→ de-risks opportunity:"** — this was redundant signaling since the card itself IS the opportunity; remove this verb prefix
- **The "Capture closure" step reference** — preserve this; it provides traceability to the Growth step that produced the ActionCard

### E.5 — Cleanup

Remove the standalone Open work band entirely. The page band sequence becomes:

1. Suggested next step
2. **Open opportunities** (now unified, with ActionCard-derived data folded in)
3. Active signals
4. History

Update lib/page.tsx and any related components accordingly. Remove or repurpose the Open work band component if it's no longer used.

### E.6 — Sidebar What's hot priorities

The sidebar What's hot list previously deduplicated Open opportunities and Open work into a single priority. With the merger, the deduplication logic in lib/priorities.ts may simplify. Verify:

- The What's hot list still shows the right priorities (Jenny's overdue follow-up still appears as 1 priority item)
- The dedup logic in `representedRecIds: Set<string>` still works correctly (now there's only one source of opportunity-tied items, not two)
- The nav-line count "1 open opportunity · 1 open ActionCard" should now read "1 open opportunity" since there's no separate Open work tally

Audit and update accordingly.

---

## Block F — Module rename: Meeting Recap → Growth Conversations

### F.1 — User-facing rename

Per DEMO_BUILD_PLAN.md v2 §10, the rename is scoped to user-facing and route-level references:

**Renamed:**
- All user-facing UI strings ("Meeting Recap" → "Growth Conversations")
- The route path (`/meeting-recap` → `/growth-conversations`)
- The folder name (`app/meeting-recap/` → `app/growth-conversations/`)
- New code references in this and future sprints

**Not renamed (historical context preserved):**
- BUILD_LOG entries from prior sprints — keep as-is
- Database table names — preserve v1 schema; no migration
- Old code comments referencing "Meeting Recap" — update opportunistically as files are touched, not in a separate sweep

### F.2 — Route and folder rename

Currently the placeholder route is at `/meeting-recap` (Sprint 4 destination). Rename:
- Move `app/meeting-recap/` to `app/growth-conversations/`
- Update any navigation, link, or route reference to use the new path
- The destination is still a placeholder for Sprint 4; the route just needs to exist with the new name

### F.3 — User-facing string updates

Audit the codebase for user-facing strings containing "Meeting Recap" and update:
- The "Run Growth Track" button's destination should now go to `/growth-conversations` (still placeholder)
- Any tooltip or help text referencing the module
- The OPEN_QUESTIONS document if it contains user-facing string references

### F.4 — Update governance documents

In this prompt, do not yet rewrite the full Module and Data Flow §3 — that's Sprint 4 Prompt 4.1 work. Just update:

- **`SCOPE.md`** acceptance test #3 — change "Meeting Recap" reference to "Growth Conversations"
- **`CLAUDE.md`** §5 — replace "Meeting recap" with "Growth Conversations" in the vocabulary list

Note in BUILD_LOG that Module and Data Flow §3 and Data Framework §4 still need substantive rewrites (track-agnostic Ask + Size architecture); these are deferred to Sprint 4 Prompt 4.1.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

The Sprint 1 + Sprint 2 Prompt 1 work established a four-tier display discipline. Verify §4.6 reflects:

1. **Chips**: enumerated member-state values where the value is the primary signal (leaning yes, spouse)
2. **Labeled values**: descriptive captured fields where field name + value together convey meaning (Impact: painful)
3. **Inline-bold with hover provenance**: numeric measurements ($75K, 45 days)
4. **Plain inline text**: entity-categorizing metadata, redundant with other display, or weak categorization

If §12 (progress visualization) needs updating to reflect Block D's repositioning + pipe separators, update accordingly.

### H.2 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 2 Prompt 2 work shipped
- Block A: step-position-based completion tracking with the Cygnus rationale
- Block B: Recommendation.updated_at field added
- Block C: Recommendation.owned_by field added with the Cygnus → Marcus example
- Block D: Progress visualization repositioned with pipe separators
- Block E: Open opportunities + Open work merger
- Block F: Module rename (user-facing scope only; full rename deferred to Sprint 4 Prompt 4.1)
- Note that Module and Data Flow §3 and Data Framework §4 substantive rewrites are deferred to Sprint 4

### H.3 — Update OPEN_QUESTIONS

Likely no new items from this prompt's mechanical work. If any architectural questions surface during implementation, log them.

Potentially close items related to ownership and updated_at if they were previously logged.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Step-position-based completion tracking implemented; Jenny's and Northland's progress visualizations unchanged; Cygnus's two Ask steps render as independent dots
- [ ] Recommendation.updated_at field added with Prisma @updatedAt directive
- [ ] computeSuggestedNextStep uses updated_at for multi-engagement ordering
- [ ] Recommendation.owned_by field added; defaults to Member.primary_banker on creation
- [ ] Cygnus's CRE Recommendation has owned_by = Marcus Webb (different from primary_banker Scott)
- [ ] Progress dots repositioned to between body paragraph and action button on Suggested Next Step card
- [ ] Pipe separators (|) render between stage labels with proper spacing
- [ ] Stage labels are NOT clickable for this prompt (Sprint 4 work)
- [ ] Open opportunities + Open work bands merged into single unified band
- [ ] Ownership renders prominently in top-right of each opportunity card
- [ ] Suggested opening text from ActionCard preserved within the merged opportunity card
- [ ] Standalone Open work band removed
- [ ] Sidebar What's hot logic still works correctly with the merged data source
- [ ] Module renamed from Meeting Recap to Growth Conversations (route, folder, user-facing strings)
- [ ] SCOPE.md acceptance test #3 updated
- [ ] CLAUDE.md §5 vocabulary updated
- [ ] BLAZE_STYLE_GUIDE.md still reflects four-tier discipline
- [ ] BUILD_LOG entry comprehensive
- [ ] Clean re-seed succeeds; row counts stable
- [ ] All three Member profiles still load (smoke test)

## Report-back format

When complete, send back:

1. **Screenshots:** The merged Open opportunities band for Jenny (showing the unified treatment with ownership and due date); the Suggested Next Step card with repositioned progress visualization; ideally the Cygnus profile if it renders to verify the two-Ask-step treatment
2. **The step-position completion logic** in summary form (what data it reads, how stages map to executions)
3. **The merged opportunity card structure** in summary form (what data it surfaces, how ActionCard data folds in)
4. **Any decisions made during implementation** that the prompt didn't pre-specify (especially Cygnus Ask step labels, "Decision pending" wrapping behavior)
5. **Any items logged to OPEN_QUESTIONS** during implementation
6. **Confirmation that hard refresh shows the changes correctly** — take screenshots after Cmd+Shift+R or in incognito window

Stop and check in. Don't proceed to Sprint 3 work until this prompt is reviewed and accepted.
