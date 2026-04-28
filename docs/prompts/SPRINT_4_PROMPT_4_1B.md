# SPRINT_4_PROMPT_4_1B.md

**Sprint 4 — Growth Conversations module · Prompt 4.1b of 4-5**

This is the second executable prompt for Sprint 4. Sprint 4 Prompt 4.1a was accepted on visual review (foundation work shipped: schema, route shell, Member lookup, scrolling page layout, anchor progress bar, Macro seed data, governance amendments).

Visual review of 4.1a surfaced four refinements before the first capture form lands. Per the discipline of breaking up monolithic prompts, this prompt covers only those visual refinements plus a navigation-pattern improvement (breadcrumb). The Ask phase capture form lands in Prompt 4.1c, alongside the Macro context banner integration on Member profiles.

**Prompt 4.1b covers chrome and structure refinements:**
- Completed-stage checkmark indicator on Growth Conversations sections
- Action notifications on the standalone Member lookup
- Breadcrumb pattern across Member profile and Growth Conversations
- Remove superfluous instructional copy on Member lookup

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` — design reference
- `BLAZE_STYLE_GUIDE.md` — visual identity
- `lib/relation-names.ts` — semantic relationship registry
- `lib/priorities.ts` — priority computation (active Signals · open opportunities counts)

---

## Scope of this prompt

Four focused refinements. None require schema changes; all are component-level UI work.

- **Block A:** Completed-stage checkmark indicator on Growth Conversations stage sections
- **Block B:** Action notifications on the standalone Member lookup
- **Block C:** Breadcrumb pattern on Member profile and Growth Conversations
- **Block D:** Remove superfluous instructional copy from Member lookup

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 4 Prompt 4.1c work: Ask phase capture form, augmenting summary pattern, Macro context banner on Member profile
- Sprint 4 Prompt 4.2 work: capture forms for Size, Show, Resolve, Connect
- Sprint 4 Prompt 4.3 work: skip handling
- Sprint 4 Prompt 4.4 work: ActionCard editing, atomic save logic
- Converting the decorative orange-to-cream gradient bar into a real nav menu (Sprint 6 polish work)
- Sprint 5 work (Insight Engine module)

Stop and check in after the full prompt completes. Single checkpoint at end.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Completed-stage checkmark indicator

### A.1 — The fix

The Growth Conversations stage sections currently show "Stage N of 6" in the section header right corner. There's no visual indicator distinguishing completed stages from upcoming ones — the user has to read the section content to know if it has captures.

Add a small checkmark indicator in the section header right corner for completed stages, positioned alongside the existing "Stage N of 6" treatment.

**Visual treatment:**
- Small checkmark icon, ~14-16px, in burnished orange (`#B45F26`)
- Renders to the left of "Stage N of 6", separated by a single bullet (·)
- Only renders for stages where the underlying Track step has a GrowthStepExecution record (per the existing stage state computation logic)
- Post-Track lifecycle stages (Decision pending, Funded, Specialist engagement, Closed) do NOT get the checkmark — they have a different lifecycle indicator pattern handled by the Member profile's Open opportunities band

**Example for Jenny's profile:**
- Ask: ✓ · Stage 1 of 6
- Size: ✓ · Stage 2 of 6
- Show: ✓ · Stage 3 of 6
- Resolve: ✓ · Stage 4 of 6
- Decision pending: Stage 5 of 6 (no checkmark; this is a lifecycle stage, not a captured Track step)
- Funded: Stage 6 of 6 (no checkmark)

**Example for Cygnus's profile:**
- Ask 1: ✓ · Stage 1 of 6
- Ask 2: ✓ · Stage 2 of 6
- Show: ✓ · Stage 3 of 6
- Connect: ✓ · Stage 4 of 6
- Specialist engagement: Stage 5 of 6 (no checkmark)
- Closed: Stage 6 of 6 (no checkmark)

### A.2 — Anchor progress bar consistency

The right-column anchor progress bar already uses dot-state visual treatment (orange filled for completed, orange ring for current, grey for upcoming). The checkmark indicator on section headers reinforces the same state without duplicating the dot pattern.

Do NOT add checkmarks to the anchor progress bar. The dot-state pattern there is already authoritative; adding checkmarks would create visual redundancy.

### A.3 — Implementation notes

Use a clean SVG checkmark or Lucide icon (e.g., `Check` from lucide-react if already imported elsewhere). Avoid emoji checkmarks (✓ rendered as character) — they have inconsistent rendering across systems and don't match the typography-led visual identity.

If introducing the checkmark requires importing a new icon library, document the choice in BUILD_LOG.

---

## Block B — Action notifications on Member lookup

### B.1 — The fix

The Member lookup at `/growth-conversations` currently shows for each Member:
- Member name (e.g., "Jenny's Catering")
- Member Type · Stage indicator (e.g., "Small Caterer · Starting")
- Last conversation date (e.g., "Last conversation: Apr 8, 2026")

Visual review surfaced that bankers prioritize from the lookup itself; adding "what's open" signals lets them see at a glance which Members need attention.

Add the same action notification treatment from the Member profile sidebar to each Member lookup row. The notification text uses the existing pattern from lib/priorities.ts (or wherever the sidebar nav-line counts are computed):

```
4 active Signals · 1 open opportunity
```

For each Member in the lookup:
- Compute the active Signal count and open opportunity count (same logic as Member profile sidebar)
- Render as a third line in the lookup row, below the Last conversation date
- Use the same orange link treatment as the Member profile sidebar (clickable; click navigates to the Member profile, NOT to Growth Conversations for that Member — keep the lookup's primary action distinct from the secondary navigation)

### B.2 — Lookup row layout

Updated lookup row:

```
Cygnus Bioscience
Member Type: Specialty Manufacturer · Established · Last conversation: Apr 21, 2026
4 active Signals · 1 open opportunity
```

The action notifications line is meaningfully clickable — a banker scanning their portfolio sees "1 open opportunity" and may want to jump to the Member profile to see what's pending before starting a Growth Conversation.

### B.3 — Click behavior disambiguation

The lookup row now has two clickable affordances:
- **Member name** (and the row body): click → start Growth Conversation for this Member (`/growth-conversations/[memberId]`)
- **Action notifications** (the orange link): click → view Member profile (`/members/[memberId]`)

Use distinct hover states to make the two affordances visually distinguishable. The row-as-a-whole hover state should not extend to the action notifications text (which is its own link).

### B.4 — Empty state

For Members with zero active Signals AND zero open opportunities, omit the action notifications line entirely (rather than rendering "0 active Signals · 0 open opportunities" — that's noise).

---

## Block C — Breadcrumb pattern

### C.1 — Establish the breadcrumb

Visual review surfaced that the top of pages is dense (Member Signals brand + page name + back link + identity + role). A breadcrumb pattern replaces the ad hoc "← Back to Member profile" link with a structured path indicator that's clearer about where the banker is in the system.

**Breadcrumb pattern:**

```
Member Signals  >  [section]  >  [current page]
```

Each segment is clickable (except the current page). Separators are the right chevron `>` character (or a clean SVG/icon chevron).

### C.2 — Specific breadcrumb paths

**On Member profile (e.g., /members/jenny):**

```
Member Signals  >  Jenny's Catering
```

The "Member Signals" segment is the system brand and links to the home page (which for the demo is /members/jenny — eventually a portfolio home, but for now the home is just the first Member profile).

**On Growth Conversations standalone (/growth-conversations):**

```
Member Signals  >  Growth Conversations
```

The "Growth Conversations" segment is the current page (not clickable).

**On Growth Conversations prefilled (/growth-conversations/jenny):**

```
Member Signals  >  Growth Conversations  >  Jenny's Catering
```

Each segment is clickable except the current page (the Member name).

### C.3 — Where the breadcrumb renders

The breadcrumb replaces the current "← Back to Member profile" treatment in the Growth Conversations header. On Member profile pages, the breadcrumb is added as a new element above the Member identity block.

Specific positioning:
- **Member profile**: breadcrumb renders below the orange-cream gradient bar, above the page H1 (Member name in the body, sidebar identity)
- **Growth Conversations**: breadcrumb renders below the gradient bar, above the page heading ("Member lookup" on standalone; the Member identity block on prefilled)

The "Logged in as Scott Brynjolffson · Primary banker" identity treatment stays on the right side of the gradient bar — that's separate from breadcrumb navigation; it's identity context.

### C.4 — Visual treatment

Breadcrumb segment styling:
- Clickable segments: burnished orange (`#B45F26`), no underline by default, underline on hover
- Current-page segment: dark text (`#1A1A1A`), no link styling
- Separators (chevrons): muted grey (`#4F5052`), positioned with even spacing
- Font size: ~14px (smaller than body, larger than caption)
- Spacing: 6-8px between segments and chevrons

### C.5 — Remove the redundant "← Back to Member profile" link

Once the breadcrumb is in place on Growth Conversations, the "← Back to Member profile" link in the header is redundant (clicking the Member name in the breadcrumb takes the banker back). Remove the back link from the Growth Conversations header.

---

## Block D — Remove superfluous instructional copy

### D.1 — The fix

The Member lookup currently includes:

```
Choose the Member you'll be in conversation with. Search by business name; the result list shows every Member in your portfolio.
```

Bankers know what a Member lookup is. The orange section mark "Select Member" is sufficient context. Remove this paragraph entirely.

### D.2 — Updated Member lookup layout

```
[orange section mark] Select Member

[Search input — types Member name or business name]
[Result list below — populated as the banker types]
```

The result list shows all of the banker's Members by default (no search query needed). The search input narrows as the banker types.

If the empty state from 4.1a ("You have no Members in your portfolio yet...") still applies, it stays — that's not superfluous, it's a meaningful empty-state communication.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Add or update §13 (Growth Conversations layout) to document:
- Completed-stage checkmark indicator pattern (section header right corner, alongside "Stage N of 6")
- Action notification treatment on Member lookup rows (matching Member profile sidebar)

Add a new §14 (Breadcrumb navigation) covering:
- Path structure: Member Signals > [section] > [current page]
- Visual treatment (orange clickable segments, dark current page, muted grey chevrons)
- Where breadcrumbs render (below gradient bar, above page heading)

If §14 already exists in 4.1a's renumbering, insert the breadcrumb documentation in the appropriate section and renumber as needed.

### H.2 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 4 Prompt 4.1b work shipped
- Block A: completed-stage checkmark indicator
- Block B: action notifications on Member lookup
- Block C: breadcrumb pattern across Member profile and Growth Conversations
- Block D: removed superfluous instructional copy
- BLAZE_STYLE_GUIDE.md additions for breadcrumb pattern

### H.3 — Update OPEN_QUESTIONS

Likely no new items. If anything surfaces during implementation (e.g., breadcrumb behavior on small viewports), log it.

Possibly close items related to navigation chrome that were captured ad hoc earlier.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Completed stages on Growth Conversations show checkmark indicator in section header right corner (alongside "Stage N of 6")
- [ ] Post-Track lifecycle stages (Decision pending, Funded, Specialist engagement, Closed) do NOT show checkmarks
- [ ] Anchor progress bar (right column) is unchanged — no checkmarks added there
- [ ] Member lookup rows show action notifications ("N active Signals · M open opportunity") below Last conversation date
- [ ] Action notifications use same orange link treatment as Member profile sidebar
- [ ] Action notifications click navigates to Member profile (not Growth Conversations)
- [ ] Member name / row body click navigates to Growth Conversations for that Member
- [ ] Members with zero active Signals AND zero open opportunities omit the notifications line entirely
- [ ] Breadcrumb renders on /members/[id] above page identity
- [ ] Breadcrumb renders on /growth-conversations above page heading
- [ ] Breadcrumb renders on /growth-conversations/[memberId] above page heading
- [ ] Breadcrumb segments are clickable except current page
- [ ] Old "← Back to Member profile" link removed from Growth Conversations header
- [ ] Superfluous instructional copy removed from Member lookup
- [ ] BLAZE_STYLE_GUIDE.md §13 updated with checkmark and action notification treatments
- [ ] BLAZE_STYLE_GUIDE.md §14 (or appropriate section) added for breadcrumb pattern
- [ ] BUILD_LOG entry comprehensive
- [ ] All three Member profiles still load (smoke test; no regressions)
- [ ] /growth-conversations and /growth-conversations/[memberId] for all three Members render correctly with refinements

## Report-back format

When complete, send back:

1. **Screenshots:** /members/jenny (showing breadcrumb above identity); /growth-conversations (showing Member lookup with action notifications, breadcrumb, no superfluous copy); /growth-conversations/jenny (showing breadcrumb path Member Signals > Growth Conversations > Jenny's Catering, plus completed-stage checkmarks); /growth-conversations/cygnus (showing two-Ask treatment with checkmarks)
2. **The breadcrumb component implementation** in summary form (how segments are computed, how clickability is determined per page)
3. **The action notification computation** in summary form (whether it reuses lib/priorities.ts logic or forks)
4. **Any decisions made during implementation** that the prompt didn't pre-specify
5. **Any items logged to OPEN_QUESTIONS** during implementation
6. **Confirmation that hard refresh shows the changes correctly**

Stop and check in. Sprint 4 Prompt 4.1c (Ask phase capture form + augmenting summary pattern + Macro context banner on Member profile) follows after acceptance.

**Reminder:** This is a chrome refinement prompt. The capture form work lands in Prompt 4.1c. Visual review of 4.1b should focus on the four refinement areas; other parts of the page should be unchanged from 4.1a's accepted state.
