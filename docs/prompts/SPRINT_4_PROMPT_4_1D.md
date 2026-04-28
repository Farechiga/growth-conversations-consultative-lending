# SPRINT_4_PROMPT_4_1D.md

**Sprint 4 — Growth Conversations module · Prompt 4.1d of 4-5**

This is the fourth executable prompt for Sprint 4. Prompts 4.1a (foundation), 4.1b (chrome refinements), and 4.1c (Ask form + augmenting summary) have all been accepted on visual review.

This prompt covers four connected workstreams that complete the Member-profile-to-Growth-Conversations cross-cutting integration plus refines the Ask form's per-type field requirements based on visual review of 4.1c.

**Prompt 4.1d covers:**
- Macro context banner integration on Member profiles
- Stage label hyperlinks from Member profile progress visualization to Growth Conversations stage anchors
- Per-type required-field refactor for Ask form (Indecision and Trigger Signal types use different fields than Goal and Blocker)
- Small breadcrumb redundancy fix (drop redundant "Growth Conversations" inline header text since breadcrumb covers it)

Reference governance documents (consult as needed):
- `docs/DEMO_BUILD_PLAN.md` — v2.1 plan
- `docs/design/INSIGHT_ENGINE_DESIGN_NOTES.md` — Macro entity reference (§3) and actionable-insight discipline (§4)
- `docs/design/03_DATA_FRAMEWORK_AMENDMENTS.md` — schema authority
- `docs/design/04_MODULE_AND_DATA_FLOW_AMENDMENTS.md` — Growth Conversations module spec
- `docs/design/MEMBER_FIXTURE_BRIEF.md` — fixture content
- `BLAZE_STYLE_GUIDE.md` — visual identity, four-tier display discipline, §13-14 Growth Conversations and breadcrumb patterns
- `lib/relation-names.ts` — semantic relationship registry

---

## Scope of this prompt

Four connected blocks. Together they make the Member profile and Growth Conversations feel like one integrated system.

- **Block A:** Macro context banner on Member profile (when Member's Member Type matches a current Macro)
- **Block B:** Stage label hyperlinks from Member profile progress visualization to Growth Conversations stage anchors
- **Block C:** Per-type required-field refactor for Ask form (Indecision and Trigger Signal types differ from Goal and Blocker)
- **Block D:** Drop redundant "Growth Conversations" inline header text on Growth Conversations pages

**Out of scope for this prompt** (explicit deferrals — DO NOT do these):
- Sprint 4 Prompt 4.2: Size, Show, Resolve, Connect capture forms; ArtifactParameterCapture for Show
- Sprint 4 Prompt 4.3: Skip handling, popup confirmation, skip-state schema population
- Sprint 4 Prompt 4.4: ActionCard editing, atomic conversation-level save logic, post-save Member profile state propagation
- Sprint 5: Insight Engine module (the Macro context banner is a forward-looking integration to Sprint 5's full Macro view)
- Topic taxonomy expansion (accepted as 16 demo-sufficient Topics; Pilot phase will expand)
- Inline insight surfaces beyond the Macro banner (Sprint 4 Prompt 4.2 onwards for Ask/Size/Show/Resolve phase contextual insights)

Stop and check in after the full prompt completes. Single checkpoint at end.

**Reminder:** Hard refresh after CSS changes (Cmd+Shift+R on Mac) when reviewing visually.

---

## Block A — Macro context banner on Member profile

### A.1 — Establish the principle

Per INSIGHT_ENGINE_DESIGN_NOTES.md §3 and §5, Macros are top-down system-level entities describing market, regulatory, sector, or technology developments. When a Member's Member Type matches a current Macro's `affected_member_types`, a banner surfaces on that Member's profile providing curated conversational on-ramp.

The 3 sample Macros from Sprint 4 Prompt 4.1a's seed data each affect exactly one of the demo Members:

- **Q3 supplier payment compression — Small Caterers** → Jenny's Catering
- **Light commercial fleet ROI window — HVAC & Trades** → Northland HVAC
- **Specialty manufacturer capital event opportunities** → Cygnus Bioscience

All three demo Members will display a Macro banner.

### A.2 — Banner layout

The banner renders at the top of the Member profile, **above the Suggested next step card**, below the page header (which contains the breadcrumb and identity treatment).

**Banner content:**

```
[orange section mark — smaller than band marks, ~14px] Macro context · Q3 supplier payment compression
Authored by Marcus Wei (Chief Economist) on Apr 12, 2026

Small caterers across the metro are reporting 20-30% extension in customer payment terms during Q3 2025 through Q1 2026. Driven by tightened working capital across customers in the corporate hospitality segment.

Recommended response: Surface seasonal cash flow stress during Ask phase. Quantify customer-payment-extension impact in Size phase.

[View context →]
```

**Visual treatment:**
- Subtle background tint distinguishing it from the page ground (very light cream, ~3-5% darker than page background, to set it off without competing for attention)
- Hairline border on top and bottom (#E8EAEC, 1px)
- Tighter vertical spacing than band sections (the banner is a notification, not a content band)
- Title in burnished orange, semibold, ~15-16px
- Curator attribution in muted grey, regular weight, ~13px
- Summary in body text, ~14px
- Recommended response in body text, slightly emphasized treatment
- "View context →" as orange link at bottom right (currently links to `#` placeholder; Sprint 5 will link to the Macro view in Insight Engine)

### A.3 — Banner specificity

Each banner shows ONE Macro at a time — the most recently authored Macro that affects this Member's Member Type. If multiple Macros apply, surface the most recently authored.

For demo: each Member matches exactly one Macro, so this rule doesn't surface a real ranking decision yet. Document the precedence rule in BUILD_LOG for future use.

### A.4 — Dismissibility

Bankers may not always want the banner taking up screen real estate. Add a small "× Dismiss" affordance in the upper right of the banner.

For demo, dismissal is session-scoped only (refreshing the page brings the banner back). Persistent dismissal (banker preferences, expired-Macro auto-dismiss) is post-demo work. Document as Q-032.

### A.5 — When the banner does NOT render

The banner is suppressed when:
- The Member's Member Type doesn't match any current Macro's `affected_member_types`
- All matching Macros have `effective_period_end` in the past (expired)
- The banner has been dismissed in this session

If a Member has no matching active Macro, the banner area renders as nothing (no empty placeholder; the page just starts with the Suggested next step card, as it currently does).

### A.6 — Member profile layout impact

The Macro banner adds a new horizontal band above the existing layout. The existing band order remains:
1. **Macro context banner** (NEW — when applicable)
2. Suggested next step
3. Open opportunities
4. Active signals
5. History

The sidebar (Member identity + What's hot) is unaffected.

---

## Block B — Stage label hyperlinks

### B.1 — Establish the integration

The Member profile's Suggested next step card displays the Growth Track progress visualization — six dots with stage labels (Ask | Size | Show | Resolve | Decision pending | Funded). Sprint 2 Prompt 1 established that "stage labels are clickable; dots are not." Sprint 4 Prompt 4.1a established stable DOM IDs on Growth Conversations stage sections (`stage-ask-1`, `stage-size`, etc.).

This block makes the stage labels actually clickable, navigating to the corresponding stage in Growth Conversations.

### B.2 — Hyperlink behavior

Each stage label on the progress visualization becomes a hyperlink to the corresponding stage section in Growth Conversations:

- "Ask" → `/growth-conversations/[memberId]#stage-ask-1` (or `#stage-ask-2` for the second Ask in a multi-Ask Track)
- "Size" → `/growth-conversations/[memberId]#stage-size`
- "Show" → `/growth-conversations/[memberId]#stage-show`
- "Resolve" → `/growth-conversations/[memberId]#stage-resolve`
- "Connect" → `/growth-conversations/[memberId]#stage-connect`
- "Decision pending" → `/growth-conversations/[memberId]#stage-decision-pending`
- "Funded" → `/growth-conversations/[memberId]#stage-funded`
- "Specialist engagement" → `/growth-conversations/[memberId]#stage-specialist-engagement`
- "Closed" → `/growth-conversations/[memberId]#stage-closed`

For Cygnus's two Ask stages, the labels "Ask 1" and "Ask 2" link to `#stage-ask-1` and `#stage-ask-2` respectively.

### B.3 — Visual treatment

Stage labels become orange clickable text (matching the breadcrumb segment treatment), with hover-underline. The dots above the labels are NOT clickable (per the Sprint 2 architectural decision). Don't add cursor-pointer or hover state to the dots themselves.

The current stage label (the one with the orange ring around its dot, indicating "current" state) gets the same hyperlink treatment — bankers may want to click it to jump directly to that stage's section in Growth Conversations.

### B.4 — Anchor scrolling behavior on Growth Conversations side

When the banker arrives at `/growth-conversations/jenny#stage-resolve`, the page should scroll smoothly to the Resolve section and (if possible) flash a subtle highlight on that section to confirm the destination.

Sprint 4 Prompt 4.1a's anchor progress bar already handles smooth-scroll on click. The same Intersection Observer that updates the "currently-viewed-stage" indicator should fire for fragment-anchored arrivals, ensuring the right anchor bar entry highlights when the user lands.

### B.5 — Edge case: invalid anchor

If the URL anchor doesn't match a real stage section (e.g., somebody types `/growth-conversations/jenny#stage-funded` for Cygnus's Connect-ending Track which doesn't have a Funded stage), the page should:
- Render normally (no error)
- Default to top-of-page scroll position
- The anchor bar's "currently-viewed" indicator updates as the banker scrolls

Don't fail gracefully but invisibly to a user who clicked a stage label that exists on the visualization but routes to a non-existent section. Per Block B.2's mapping, this shouldn't happen for the demo's three Members; the mapping covers all stage shapes.

---

## Block C — Per-type required-field refactor

### C.1 — Establish the principle

Visual review of Sprint 4 Prompt 4.1c surfaced that the four Signal types share fields awkwardly. Currently, all four types require Topic / Impact / Timeframe / Source / Magnitude (when set). But:

- **Indecision Signals**: Impact (manageable/painful/acute) doesn't map intuitively to uncertainty. Indecision is by definition unresolved; "acute indecision" feels semantically forced.
- **Trigger Signals**: Timeframe (recent/ongoing/historical/anticipated) describes recency, but Triggers are forward-looking events. The semantically appropriate field is Time horizon (imminent/3-6 months/6-12 months/12-24 months/longer).

This block refactors the Ask form to have per-type required fields:

| Signal type | Required fields | Optional fields |
|---|---|---|
| Goal | Topic, Impact, Timeframe, Source | Direct quote, Magnitude (+ unit + frequency) |
| Blocker | Topic, Impact, Timeframe, Source | Direct quote, Magnitude (+ unit + frequency) |
| Indecision | Topic, Source | Direct quote, Impact (optional), Timeframe (optional), Magnitude |
| Trigger | Topic, Impact, **Time horizon** (replaces Timeframe), Source | Direct quote, Magnitude |

### C.2 — Schema implications

The Signal entity already has both `recency` and `time_horizon` fields per existing schema. The Ask form's Trigger sub-form should bind to `time_horizon` instead of `recency`:

- `time_horizon` enum values: `imminent | 3-6_months | 6-12_months | 12-24_months | longer`
- Existing `recency` enum values: `recent | ongoing | historical | anticipated` (used by Goal, Blocker, and optionally Indecision)

If the schema doesn't already have `time_horizon` as a separate field from `recency`, add it as a nullable enum field on Signal. Document the schema choice in BUILD_LOG.

For Indecision Signals: `impact` and `recency` become nullable (no validation requirement). Existing seed data Indecision Signals can keep their values; the change is to the form's required-field validation, not the data model.

### C.3 — Form refactor

The AskSection component currently renders a single sub-form layout for all four Signal types. Refactor to render per-type sub-form layouts:

**Goal sub-form** (no change from 4.1c):
- Topic / subtype (required)
- Direct quote (optional)
- Impact (required), Timeframe (required), Source (required)
- Magnitude (optional), Unit (required when Magnitude set), Frequency (required when Magnitude set)

**Blocker sub-form** (no change from 4.1c):
- Same as Goal

**Indecision sub-form** (refactored — Impact and Timeframe become optional):
- Topic / subtype (required)
- Direct quote (optional)
- Source (required)
- Impact (optional — can be left as "Select...")
- Timeframe (optional — can be left as "Select...")
- Magnitude (optional)

Visual treatment for optional Impact/Timeframe: drop the asterisk indicator; the dropdown still defaults to "Select..." but doesn't trigger validation error if left unselected.

**Trigger sub-form** (refactored — Timeframe replaced with Time horizon):
- Topic / subtype (required)
- Direct quote (optional)
- Impact (required), **Time horizon** (required — replaces Timeframe), Source (required)
- Magnitude (optional)

Time horizon dropdown options: `imminent | 3-6 months | 6-12 months | 12-24 months | longer` (display labels with friendly formatting; database values use the enum).

### C.4 — Validation logic refactor

Update the validation in saveAskCaptures Server Action to check per-type required fields:

```typescript
function validateSignal(signal: PendingSignal): ValidationResult {
  const errors: string[] = [];
  
  // Common required for all types
  if (!signal.topic_id) errors.push("Topic is required");
  if (!signal.source) errors.push("Source is required");
  
  // Type-specific required
  if (signal.signal_type === 'goal' || signal.signal_type === 'blocker') {
    if (!signal.impact) errors.push("Impact is required");
    if (!signal.recency) errors.push("Timeframe is required");
  }
  
  if (signal.signal_type === 'trigger') {
    if (!signal.impact) errors.push("Impact is required");
    if (!signal.time_horizon) errors.push("Time horizon is required");
  }
  
  // Indecision: only Topic and Source required; Impact and Timeframe optional
  
  // Magnitude conditional validation (all types)
  if (signal.magnitude !== null && signal.magnitude !== undefined) {
    if (!signal.magnitude_unit) errors.push("Magnitude unit is required when Magnitude is set");
    if (!signal.magnitude_frequency) errors.push("Magnitude frequency is required when Magnitude is set");
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### C.5 — Augmenting summary display refactor

The expanded detail view of saved Signals also needs to reflect per-type field rendering:

**For Goal/Blocker Signals (no change from 4.1c):**
```
Impact: painful · Timeframe: recent · Source: member stated
"Direct quote..."
[Magnitude details if present]
```

**For Indecision Signals (drop missing fields):**
```
Source: member stated [· Impact: painful only if captured] [· Timeframe: recent only if captured]
"Direct quote..."
[Magnitude details if present]
```

**For Trigger Signals (use time horizon):**
```
Impact: moderate · Time horizon: 6-12 months · Source: member stated
"Direct quote..."
[Magnitude details if present]
```

### C.6 — Documentation in BLAZE_STYLE_GUIDE.md

Update §14.5 (capture form patterns) to document the per-type required-field discipline:

- Common required across all types: Topic, Source
- Goal/Blocker additional required: Impact, Timeframe
- Indecision: only common required (Impact and Timeframe are optional)
- Trigger: replaces Timeframe with Time horizon (forward-looking semantics)
- Magnitude is type-agnostic optional with conditional unit/frequency requirement

This pattern will be applied consistently across Size/Show/Resolve/Connect capture forms in Prompt 4.2.

---

## Block D — Drop redundant inline header text

### D.1 — The fix

Visual review surfaced that on Growth Conversations pages, the inline page header reads:

```
Member Signals · Growth Conversations
```

While the breadcrumb just below reads:

```
Member Signals > Growth Conversations > Jenny's Catering
```

Same information twice. The breadcrumb's structure is more informative (shows full path). Drop the inline "· Growth Conversations" suffix from the page header; let the breadcrumb carry the navigation context.

### D.2 — Updated header treatment

**Before (current):**
```
[orange Member Signals wordmark · Growth Conversations] [identity treatment on right]
[breadcrumb]
[page H1]
```

**After:**
```
[orange Member Signals wordmark only] [identity treatment on right]
[breadcrumb]
[page H1]
```

The "Member Signals" wordmark stays as the system brand. The "Growth Conversations" suffix is removed from the inline header.

### D.3 — Member profile pages unaffected

This change only applies to Growth Conversations pages. Member profile pages already use just the "Member Signals" wordmark in the header without an inline suffix. No change needed there.

### D.4 — Consistency check

After the change, the only places "Growth Conversations" renders on a Growth Conversations page are:
- The breadcrumb (e.g., "Member Signals > Growth Conversations > Jenny's Catering")
- The browser tab title (HTML `<title>` element)

This is correct — the breadcrumb is the canonical navigation indicator; the tab title is for browser context.

---

## Housekeeping

### H.1 — Update BLAZE_STYLE_GUIDE.md

Add a new subsection (§13.x or appropriate) titled "Macro context banner" that codifies:
- Banner positioning (top of Member profile, above Suggested next step)
- Visual treatment (subtle background tint, hairline borders, smaller orange section mark)
- Content structure (title, curator attribution, summary, recommended response, View context link)
- Dismissibility (session-scoped × Dismiss affordance)

Update §14.5 (capture form patterns) per Block C.6 to document the per-type required-field discipline.

### H.2 — Update lib/relation-names.ts and lib/verb-patterns.ts as needed

If new relations or verb patterns surface during implementation:
- Relation: Macro `affects` Member (when Member's Member Type matches Macro's affected_member_types)
- Verb pattern: "authored" (Macro authored by Banker or external_label)

### H.3 — Update BUILD_LOG

Comprehensive entry capturing:
- Sprint 4 Prompt 4.1d work shipped
- Block A: Macro context banner integration (3 demo Members render with their respective Macros)
- Block B: Stage label hyperlinks with anchor scrolling
- Block C: Per-type required-field refactor for Ask form (Indecision and Trigger differ from Goal/Blocker)
- Block D: Removed redundant "Growth Conversations" inline header text
- Schema changes if any (Signal.time_horizon field if not already present)

### H.4 — Update OPEN_QUESTIONS

Likely additions:

- **Q-032:** Persistent banner dismissal (per-banker preferences, expired-Macro auto-dismiss). Session-scoped only for demo; Pilot phase work.
- **Q-033:** Stage label hyperlinks for stages that don't yet exist as capture interfaces (Sprint 4 Prompt 4.2 builds Size/Show/Resolve/Connect; until then, hyperlinks land on read-only summaries or placeholders).

Possibly close items related to per-type field requirements that surfaced during 4.1c review.

---

## Acceptance criteria for this prompt

Before reporting complete, verify:

- [ ] Macro context banner renders on /members/jenny showing "Q3 supplier payment compression" Macro
- [ ] Macro context banner renders on /members/northland showing "Light commercial fleet ROI window" Macro
- [ ] Macro context banner renders on /members/cygnus showing "Specialty manufacturer capital event opportunities" Macro
- [ ] Banner has × Dismiss affordance (session-scoped)
- [ ] Banner dismissal works (refreshing page brings it back; closing tab doesn't persist)
- [ ] Banner renders above Suggested next step, below page header
- [ ] Stage labels on Member profile progress visualization are clickable hyperlinks
- [ ] Click "Ask" → navigates to /growth-conversations/[id]#stage-ask-1 with smooth scroll
- [ ] Click "Show" → navigates to /growth-conversations/[id]#stage-show with smooth scroll
- [ ] Click "Decision pending" → navigates to corresponding anchor; renders without error
- [ ] Cygnus's "Ask 1" and "Ask 2" labels link to distinct anchors
- [ ] Dots remain non-clickable (no cursor change, no click handler)
- [ ] Ask form renders Indecision sub-form with Impact and Timeframe as optional fields (no asterisk)
- [ ] Ask form renders Trigger sub-form with Time horizon dropdown (replacing Timeframe)
- [ ] Time horizon dropdown shows: imminent / 3-6 months / 6-12 months / 12-24 months / longer
- [ ] Validation passes when Indecision Signal has only Topic and Source set
- [ ] Validation requires Time horizon for Trigger Signals
- [ ] Augmenting summary expanded detail renders fields per type (Goal/Blocker vs Indecision vs Trigger)
- [ ] Existing seed data Signals still render correctly (their captured values are unchanged)
- [ ] "Growth Conversations" inline suffix removed from Growth Conversations page header
- [ ] Breadcrumb still shows full path including "Growth Conversations" segment
- [ ] BLAZE_STYLE_GUIDE.md updated with Macro banner subsection and per-type field discipline
- [ ] BUILD_LOG entry comprehensive
- [ ] OPEN_QUESTIONS Q-032 and Q-033 added
- [ ] Schema migration runs cleanly if needed
- [ ] All three Member profiles still load
- [ ] /growth-conversations/[id] for all three Members renders correctly with refinements

## Report-back format

When complete, send back:

1. **Screenshots:** /members/jenny showing Macro context banner; /members/cygnus showing different Macro for Specialty Manufacturer; one Member profile with banner dismissed; the Suggested next step card with stage labels visibly clickable; /growth-conversations/jenny landing on a specific anchor (e.g., #stage-resolve); the Ask form Indecision sub-form showing optional Impact/Timeframe; the Ask form Trigger sub-form showing Time horizon dropdown
2. **The Macro banner component implementation** in summary form (data loading, matching logic, dismissal handling)
3. **The stage hyperlink integration** in summary form (URL fragment passing, anchor scrolling, edge case handling)
4. **The per-type field refactor** in summary form (validation logic changes, sub-form layout differences, augmenting summary display changes)
5. **Any decisions made during implementation** that the prompt didn't pre-specify
6. **Any items logged to OPEN_QUESTIONS** during implementation
7. **Confirmation that hard refresh shows the changes correctly**

Stop and check in. Sprint 4 Prompt 4.2 (Size, Show, Resolve, Connect capture forms with parameter pre-population) follows after acceptance.

**Reminder:** This prompt completes the Member-profile-to-Growth-Conversations integration. After this lands, the system feels like one product — Members surface Macros and progress visualizations that lead bankers into Growth Conversations to capture or update Signals, which then propagate back to the Member profile. The Ask form's per-type field discipline establishes the pattern Prompt 4.2 will replicate for the remaining four capture forms.
