# SPRINT_2_PROMPT_1.md

**Sprint 2 — Suggested Next Step intelligence + Growth Track progress visualization · Prompt 1 of 1**

This is the second executable prompt against DEMO_BUILD_PLAN.md. Sprint 1 was accepted on 2026-04-26 after the four-refinement pass; the Member profile is now production-quality for Jenny.

Reference governance documents (consult as needed):
- `docs/design/03_Data_Framework.docx` — schema authority (will be amended by this prompt)
- `docs/design/04_Module_and_Data_Flow.docx` — module boundaries
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content
- `BLAZE_STYLE_GUIDE.md` — visual identity
- `lib/relation-names.ts` — semantic relationship registry
- `lib/summaries.ts` — summary template registry
- `lib/verb-patterns.ts` — verb registry
- `lib/priorities.ts` — priority computation (existing from Sprint 1)
- `lib/enum-descriptions.ts` — enum value descriptions

---

## Scope of this prompt

Two related features that together transform the Suggested Next Step card from a static rule-engine output into a context-aware journey indicator:

- **Block A:** Schema simplification — expand member_response enum to include `funded` as terminal state; retire any separate Recommendation.status field if one exists; consolidate journey state into a single dimension
- **Block B:** Context-aware Suggested Next Step logic — when Member has an active engaged Recommendation, suggest follow-up action (joint call, CPA review, specialist intro), not "run a new Track"
- **Block C:** Growth Track progress visualization — small discrete dots showing where in the journey the relationship currently is; adaptive to the Track's actual step shape

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 3 work (multi-Member generalization, /members/[id] dynamic route, Northland and Cygnus Artifact rendering)
- Sprint 4 work (Meeting Recap module — the destination of "Run Growth track" stays a placeholder destination for now)
- Visual treatment refinements beyond what this prompt specifies — keep Sprint 1's visual discipline intact

Stop and check in after the full prompt completes. Single checkpoint at end; do not pause mid-prompt unless you encounter a real blocker.

---

## Block A — Schema simplification: consolidated member_response

### A.1 — Expand the member_response enum

Sprint 1 collapsed ArtifactShareRecord.member_reaction into Recommendation.member_response with a 9-value enum: `declined → leaning_no → dismissive → skeptical → confused → neutral → engaged → leaning_yes → committed`.

Add one more value to the terminal end: `funded`.

Final enum (ordered weakest-negative to strongest-positive): 
`declined | leaning_no | dismissive | skeptical | confused | neutral | engaged | leaning_yes | committed | funded`

Author description for the new value per Semantic Discipline:
- `funded`: "The opportunity has closed and money has flowed. Terminal state in the journey; the Recommendation is closed-won. Distinct from `committed` which captures member intent but precedes operational funding."

Update lib/enum-descriptions.ts → RECOMMENDATION_RESPONSE_DESCRIPTIONS to include the new value.

### A.2 — Retire any separate Recommendation.status field if one exists

Audit the schema for any field that duplicates lifecycle state (status, lifecycle_stage, opportunity_stage, etc.). If such a field exists, remove it. Journey state lives in `member_response` alone going forward.

Per Francisco's decision: "the last interaction is the truest signal." The single field captures both sentiment and lifecycle position. Edge cases:
- "Paused" opportunities (member said neither yes nor no but conversation went cold) → handled by aging heuristics in priority logic, not a discrete enum value
- "Lost" opportunities (member committed then withdrew) → handled by transitioning back to `declined`. The Recommendation history captures the prior `committed` state for audit per existing immutability discipline

### A.3 — Update lib/summaries.ts ProposalResponse type and PROPOSAL_RESPONSE_VERB table

Update PROPOSAL_RESPONSE_VERB table to include banker-facing prose for `funded`:
- `funded` verb prose: "funded" or "is funded" depending on context (e.g., "Member is funded on the $75K LOC" or "Working Capital LOC at $75K · funded")

Verify the summarizeMember template handles the `funded` state cleanly — it should produce a different summary than `committed` (e.g., "Member has Working Capital LOC at $75K active and funded" rather than "Member has committed to Working Capital LOC at $75K").

### A.4 — Migration

Schema-level migration is no-op at the SQLite level (textual enums); regenerate Prisma client. Verify all three demo Members still have valid member_response values after the migration.

For the demo, no Member is at `funded` state initially. The state is reachable only through future Conversation captures (out of scope for this prompt; will become reachable in Sprint 4 when Meeting Recap module ships).

Update BUILD_LOG with the enum extension. Update BLAZE_STYLE_GUIDE.md if §4.6 references the old enum value count.

---

## Block B — Context-aware Suggested Next Step logic

### B.1 — Establish the principle

The Suggested Next Step card currently always shows the highest-ranked Growth Track output from the rule engine (e.g., "Smooth seasonal cash flow with LOC for small caterer" for Jenny). This made sense when Members were assumed to be in a "fresh state" — no active opportunity yet. But Members typically have active engaged Recommendations; suggesting "run a new Track" when an opportunity is already in motion is contradictory.

The new principle: **the Suggested Next Step adapts to the Member's current state.**

- If Member has an active engaged Recommendation (member_response in `engaged`, `leaning_yes`, or `committed` AND not `funded` AND not `declined`), the card shows the next step to advance THAT opportunity
- If Member has no active engaged Recommendation, the card shows the highest-ranked Growth Track from the rule engine (current behavior)

### B.2 — Build the context-aware logic

Add a new function to lib/priorities.ts (or a new module lib/suggested-next-step.ts if cleaner):

```typescript
type SuggestedNextStep = 
  | { kind: 'advance_opportunity'; recommendation: Recommendation; nextActionDescription: string; linkedActionCardId?: string }
  | { kind: 'run_track'; track: GrowthTrack; rule: Rule; confidence: 'high' | 'medium' | 'low' }
  | null;

async function computeSuggestedNextStep(memberId: string): Promise<SuggestedNextStep>
```

**Logic:**

1. Find the Member's active engaged Recommendations (member_response in `engaged`, `leaning_yes`, `committed`; exclude `funded` and `declined`)
2. If exactly one exists → return `advance_opportunity` with that Recommendation
3. If multiple exist → return the most recently engaged one (by Recommendation.updated_at)
4. If none exist → fall through to the existing rule-engine logic; return `run_track` with the highest-ranked Track output

For the `advance_opportunity` case, derive `nextActionDescription` from the linked ActionCard's rationale or the Member's stated indecision_type:

- If Member has a linked overdue ActionCard → use that ActionCard's rationale
- If Member has no overdue ActionCard but Recommendation.primary_concern exists → derive description from concern type (`spouse` → "Schedule joint call with [member's spouse name if known, else 'spouse']", `cpa` → "Follow up after [member]'s CPA review", `bank_capability` → "Confirm specialist introduction landed", etc.)
- If neither → generic "Follow up to advance the opportunity"

### B.3 — Render the new card content

Update the Suggested Next Step card component to handle both kinds.

**For `advance_opportunity`:**

```
[orange mark] Suggested next step    [progress dots — see Block C]

Follow up on $75K LOC · member leaning yes
[next action description from B.2]

[Run follow-up button]    [Dismiss]
```

The card title is "Follow up on [opportunity name]" with the Recommendation's product name + size. The subtitle includes member_response. The body is the next action description.

The "Run Growth track" button changes to "Run follow-up" (or "Schedule next step" — your choice; document in BUILD_LOG). Clicking it should navigate to the Meeting Recap module (Sprint 4 destination) — for now, this can be a placeholder route or a no-op with a tooltip "Available when Meeting Recap module ships in Sprint 4."

**For `run_track`** (existing behavior, with progress dots added):

```
[orange mark] Suggested next step    [progress dots — see Block C]

Smooth seasonal cash flow with LOC
[banker_facing_purpose from Sprint 1]

[Run Growth track]    [Dismiss]
```

No change to existing rendering except the addition of progress dots from Block C.

### B.4 — Verify across all three Members

After implementation:

- **Jenny:** Has active engaged Recommendation (member_response = `leaning_yes`). Card shows "Follow up on $75K LOC · member leaning yes" with the joint-call action description.
- **Northland:** Has active engaged Recommendation (member_response = `leaning_yes`). Card shows "Follow up on $180K Vehicle/Fleet Loan · member leaning yes" with CPA-review action description.
- **Cygnus:** Has active engaged Recommendation (member_response = `leaning_yes`). Card shows "Confirm Marcus introduction landed" or similar — Cygnus's case is a Connect-step handoff, not a Resolve-step indecision, so the next-action derivation should handle this case.

If Cygnus's case requires special-casing, document the logic in BUILD_LOG.

If demo state is reset and Recommendations are removed (admin reset functionality from Sprint 6), the cards revert to `run_track` mode with the rule engine's highest-ranked Track suggestion.

---

## Block C — Growth Track progress visualization

### C.1 — Establish the visualization

Six-stage (or fewer, depending on Track shape) progress visualization that renders on the Suggested Next Step card, showing where in the journey the relationship currently is.

**Visual treatment:**
- Small discrete dots, ~6px diameter
- Spaced evenly with thin connecting line between them
- Burnished orange (`#B45F26`) for completed and current stages
- Light cool grey (`#D5D8DB`) for upcoming stages
- Current stage gets a subtle ring or larger size (~8px) to distinguish "current" from "completed"
- Labels below or beside dots, optional — your call on whether labels render at default screen widths or only on hover

NO progress percentages, NO bar fills, NO gradient transitions. Discrete dots only. Per Francisco's locked direction from earlier conversations: "small dots. These should be clear and discrete, not a lot of ambiguity."

### C.2 — Adaptive to Track shape (hybrid model)

Per Francisco's decision: the visualization adapts to each Track's actual step sequence rather than forcing a standardized 6-stage model.

**Stages 1 through N** = the actual Growth Steps in the Track:
- Jenny's Track: Ask · Size · Show · Resolve (4 steps)
- Northland's Track: Ask · Size · Show · Resolve (4 steps)
- Cygnus's Track: Ask · Ask · Show · Connect (4 steps)

**Stages N+1 through N+2** = post-Track lifecycle:
- For tracks ending in Resolve (Jenny, Northland): "Decision pending" → "Funded"
- For tracks ending in Connect (Cygnus): "Specialist engagement" → "Closed"

The visualization computes its stage count and labels from the Track's actual GrowthSteps + the post-Track lifecycle pattern.

### C.3 — Stage state computation

Compute each stage's state (`completed`, `current`, `upcoming`) from the Member's actual data:

**Stages 1 through N (Track steps):**
- `completed` if there's a GrowthStepExecution for this step in the Member's data
- `current` if this is the next un-executed step (for partial Track runs — out of scope for this prompt; should never occur in current seed data which has all-or-nothing Track executions)
- `upcoming` if there's no execution and an earlier step is still upcoming

For the demo's seed data, all four steps in each Member's featured Track are completed (4 GrowthStepExecutions exist for each).

**Stages N+1 (post-Track):**
- For Resolve-ending tracks: `current` if Recommendation exists with member_response in [`engaged`, `leaning_yes`, `committed`] and not `funded`; `completed` if member_response is `funded`
- For Connect-ending tracks: `current` if specialist handoff has occurred but specialist hasn't yet engaged; `completed` if specialist has had follow-up Conversations

For demo seed data:
- Jenny: stage 5 (Decision pending) is `current`, stage 6 (Funded) is `upcoming`
- Northland: stage 5 (Decision pending) is `current`, stage 6 (Funded) is `upcoming`
- Cygnus: stage 5 (Specialist engagement) is `current` (Marcus has been handed off but hasn't had follow-up yet), stage 6 (Closed) is `upcoming`

**Stages N+2 (terminal):**
- `completed` if member_response is `funded` (or for Connect tracks, equivalent terminal state)
- `upcoming` otherwise

### C.4 — Rendering implementation

Build a new component: `<TrackProgressDots track={Track} member={Member} />`

The component:
1. Reads the Track's GrowthSteps in sequence
2. Reads the Member's GrowthStepExecutions for this Track
3. Reads the Member's Recommendation associated with this Track (if any)
4. Computes stages array with state per C.3
5. Renders dots inline with thin connecting line

**Layout positioning:** dots appear in the upper-right area of the Suggested Next Step card, opposite the title. They should not crowd the title or the action button.

**Optional stage labels:** for the demo, show labels below the dots in small text (10-11px, muted grey #4F5052). Labels are short:
- Track step labels: derived from GrowthStep shape ("Ask", "Size", "Show", "Resolve", "Connect") — keep them short
- Post-Track labels: "Decision pending", "Funded" (for Resolve tracks); "Specialist engagement", "Closed" (for Connect tracks)

If the labels create visual noise, switch to label-on-hover (tooltip) and document the choice in BUILD_LOG.

### C.5 — Apply to both Suggested Next Step modes

The progress dots render on both `advance_opportunity` cards (showing journey state and where the next action sits) and `run_track` cards (showing journey state when no action has been taken yet — all dots upcoming).

For Jenny's `advance_opportunity` card:
- Dots: 4 completed (Ask · Size · Show · Resolve) + 1 current (Decision pending) + 1 upcoming (Funded)
- The "Follow up" button maps to advancing the current stage (Decision pending → Funded)

If the demo is reset and Jenny has no Recommendation, the card switches to `run_track` mode showing all 6 dots upcoming.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Add a new §12 (or appropriate section) titled "Progress visualization" that codifies:
- Discrete dots only — no percentages, bars, or gradients
- Burnished orange for completed/current; light cool grey for upcoming
- Current stage distinguished from completed (ring or size variation)
- Adaptive to journey shape (not all journeys are 6 stages)

### H.2 — Update lib/relation-names.ts

If the new functions surface relations worth naming, add them. The Recommendation → ActionCard relationship for `de_risks_recommendation` may need verification.

### H.3 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 2 Prompt 1 work shipped
- Schema enum extension to include `funded`
- Context-aware Suggested Next Step logic with the two-mode (advance_opportunity vs run_track) approach
- Progress visualization with hybrid adaptive model
- Any decisions made during implementation that the prompt didn't pre-specify

### H.4 — Update OPEN_QUESTIONS

Add new items if any architectural questions surface during implementation. Likely candidates:
- How to handle Members with multiple active engaged Recommendations (current logic picks most-recently-engaged; Insight Engine view of full pipeline is Sprint 5 work)
- Cygnus's Connect-step handoff modeling — if the post-Track lifecycle for Connect tracks needs a distinct schema field, flag it

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] member_response enum includes `funded` as terminal value with description authored
- [ ] Any separate Recommendation.status field has been removed (if one existed)
- [ ] Jenny's Suggested Next Step card shows "Follow up on $75K LOC · member leaning yes" not "Run new Track"
- [ ] Northland's Suggested Next Step card shows similar follow-up framing
- [ ] Cygnus's Suggested Next Step card handles the Connect-step case appropriately
- [ ] Suggested Next Step card displays progress dots (6 for Jenny: 4 completed + 1 current + 1 upcoming)
- [ ] Progress dots use burnished orange for completed/current, light grey for upcoming
- [ ] Current stage is visually distinguished from completed stages
- [ ] Track step labels render below dots (or on hover if visual noise)
- [ ] Progress visualization is adaptive — Cygnus's Connect-ending track shows different post-Track labels ("Specialist engagement", "Closed") than Jenny/Northland's Resolve-ending tracks ("Decision pending", "Funded")
- [ ] If demo is reset and Jenny has no Recommendation, the card reverts to "Run new Track" mode with all 6 dots upcoming
- [ ] BLAZE_STYLE_GUIDE.md updated with progress visualization section
- [ ] BUILD_LOG entry comprehensive
- [ ] Clean re-seed succeeds; row counts stable
- [ ] Northland and Cygnus profiles still load (smoke test, not full review — Sprint 3 generalization is when those get full review)

## Report-back format

When complete, send back:

1. **Screenshots:** The Suggested Next Step card for Jenny (showing both the new content and the progress dots); ideally also screenshots for Northland and Cygnus to verify the adaptive treatment
2. **The TrackProgressDots component implementation** in summary form (what data it reads, how it computes stages)
3. **The computeSuggestedNextStep logic** in summary form (the decision tree)
4. **Any decisions made during implementation** that the prompt didn't pre-specify
5. **Any items logged to OPEN_QUESTIONS** during implementation
6. **A note on whether labels rendered below dots or as hover tooltips** (your design call during implementation)

Stop and check in. Don't proceed to Sprint 3 work until this prompt is reviewed and accepted.

**Reminder for visual review:** if CSS changes are involved, your screenshots should be taken AFTER a hard refresh (Cmd+Shift+R on Mac) or in an incognito window to avoid stale cache showing old styles. The Sprint 1 final review surfaced this — let's avoid the same diagnostic round.
