# Sprint 4.7.1 — V2 Visual Cleanup

**Prompt for Claude Code. Single checkpoint. Ships unambiguous visual fixes from Sprint 4.7 visual review. Estimated ~1 effective build day. No schema changes, no vocabulary refactor — those land in Sprint 4.7.2 immediately after.**

## Pre-flight context

Sprint 4.7 phase 1 + 2 shipped clean. Visual review on rendered v2 surfaced eight specific issues plus an architectural refactor that splits into three waves:

- **Wave 0 (governance update — already applied before this sprint runs):** ARCHITECTURE_V2.md and EVIDENCE_FRAMEWORK.md updated to use Discover / Measure / Consult / Navigate vocabulary. Goals/Blockers/Indecision migrated to Discover. Model produced migrated to Measure. Five activities replace seven on the dialpad surface.
- **Wave 1 (this sprint, 4.7.1):** Aesthetic refinement and cleanup. Fixes that don't touch schema, code-side vocabulary, or dialpad architecture.
- **Wave 2 (next sprint, 4.7.2):** Code-side vocabulary refactor (rename ObjectiveType enum values, rename all banker-facing strings) and dialpad simplification (remove + Show and + Resolve buttons; expand + Reaction form). Touches schema migration and matches code to the already-updated governance docs.

Sprint 4.7.1 lands the visual cleanup quickly using the new vocabulary in any new copy CC writes. Sprint 4.7.2 follows immediately with the code-side rename. Do not start any 4.7.2 work in this turn.

**Read these governance documents before starting:**

1. `BLAZE_STYLE_GUIDE.md` — particularly the v1 chip aesthetic conventions (used in Sprint 4 capture forms; v2 should adopt the refined version).
2. `ARCHITECTURE_V2.md` §4 (Pattern A layout) — page header, key facts strip, dialpad spec.
3. `MEMBER_FIXTURE_BRIEF.md` §5 (Cygnus) — to inform the two-Ask restoration in Block H.

When governance docs disagree with this prompt on a Sprint 4.7.1-specific issue, this prompt wins for the issues addressed here. The docs remain authoritative for everything not addressed.

## What ships in this sprint

Eight blocks. All part of one checkpoint, delimited diffs.

- **Block A — Two-pill header badge.** Replace synthetic prose with structured pills.
- **Block B — Square chip aesthetic across v2 tags.** Revive the v1 chip refinement.
- **Block C — Member Signals logo in page header.** Brand identity.
- **Block D — "Growth Conversations" page title.** Reframes v2 around the product framing v1 established.
- **Block E — Capture cards display signal type as primary tag.** "Goal · Smooth seasonal revenue" not "ASK · Smooth seasonal revenue."
- **Block F — Compliance banner: dark grey + sharpened copy.** Plain business English, not consultese.
- **Block G — Sticky dialpad on scroll.** Dialpad sticks; header collapses to thin strip.
- **Block H — Restore Cygnus's two Asks.** Two distinct dots, two distinct captures.

---

## Block A — Two-pill header badge

### A.1 Current state

The page header right side currently displays composite synthetic prose like *"Jenny was 'leaning yes' on the $... · overdue Apr 22"*. The prose is:
- Truncating mid-sentence (the `$...` indicator)
- Past tense (wrong for an open thread)
- Synthetic — manufactured by the system to fit the badge slot, not derived from structured fields
- Hard to scan

### A.2 Replacement

Two structured pills + date · using the v1 chip aesthetic from Sprint 4 capture forms.

For Jenny (current `member_response = leaning_yes`, `Recommendation.product_type = working_capital_loc`):
- Pill 1: `leaning yes`
- Pill 2: `Working Capital LOC`
- Date: `· overdue Apr 22` (or other open-thread date)

Visual treatment:
- Pills use `var(--blaze-warning)` border + faint coral fill, matching the existing open-thread accent color discipline
- Pills sit horizontally, separated by ~6px
- Date follows pills with a · separator and muted treatment

When there's no open thread (member_response unset, or response committed/funded/declined/dismissive), the badge area renders empty.

### A.3 Source data

The two pills derive from existing structured fields:
- Pill 1: `member_response` enum value, formatted with the human-readable label from `lib/enum-descriptions.ts`
- Pill 2: `Recommendation.product_type` (or equivalent — read from the active Recommendation for this Member)

No new fields, no new derivation logic. The badge displays what's already in the schema, structured.

### A.4 Acceptance criteria for Block A

- [ ] Header badge displays as two pills + date · format
- [ ] Pills derive from `member_response` and `Recommendation.product_type`
- [ ] No synthetic prose; no truncation
- [ ] v1 chip aesthetic applied (see Block B)
- [ ] Empty state when no open thread

---

## Block B — Square chip aesthetic across v2 tags

### B.1 Reference: v1 chip design

The Sprint 4 capture forms (Ask, Resolve) developed a refined chip vocabulary for status pills, signal-type tags, etc. Square-edged (slight border-radius), tight padding, clean typography. The v2 phase 1 build did not consistently adopt this aesthetic across its surfaces.

Audit v2 tags and pills for chip-aesthetic consistency. Apply the v1 chip styling to:
- Activity-type tags in capture cards (currently rendering as bare text "ASK" / "GOAL" / etc.)
- Status pills in the open-thread badge (per Block A)
- Tag elements in the captured feed
- Tag elements in popup detail surfaces

### B.2 Implementation

Lift the chip styling from `app/_components/` (v1 capture form components — `ask-section.tsx`, `resolve-section.tsx`, etc.) into a shared component if not already factored. Reuse on v2 surfaces.

If the v1 chip is currently inline-styled rather than componentized, factor a `<Chip>` primitive at `components/v2/chip.tsx` or equivalent, used by both v1 and v2 going forward. Default styling: square-edged, tight padding, neutral background, configurable color variants for accent / muted / default.

### B.3 Acceptance criteria for Block B

- [ ] Chip primitive exists as a shared component (or v1 inline styling lifted to v2 consistently)
- [ ] All v2 tags / pills use the chip aesthetic
- [ ] No regression in v1 chip rendering

---

## Block C — Member Signals logo in page header

### C.1 Logo

The Member Signals brand has an established orange + black logo treatment (per BLAZE_STYLE_GUIDE). Add the logo to the v2 page header, top-left.

### C.2 Placement

Top-left corner of the page header strip. Sits to the left of the page title (Block D). Approximate size: ~28-32px height, brand colors per BLAZE_STYLE_GUIDE.

If the logo asset doesn't already exist in the codebase, ask Francisco rather than generating one. The logo is a brand asset, not a generated graphic.

### C.3 Acceptance criteria for Block C

- [ ] Logo appears in top-left of v2 page header
- [ ] Brand colors and proportions match BLAZE_STYLE_GUIDE
- [ ] Logo present on all three Member fixtures (Jenny, Northland, Cygnus)

---

## Block D — "Growth Conversations" page title

### D.1 Current state

The v2 page header currently displays the Member name (e.g., "Jenny's Catering") as the primary title. The product framing — *Growth Conversations* — established in v1 has been lost in v2.

### D.2 Replacement

Page title becomes **"Growth Conversations"** using the same font and color treatment as the existing "Member Signals" brand mark (orange + black, display heading weight).

Member name (e.g., "Jenny's Catering") becomes the **subtitle** below the page title. Same visual hierarchy as v1's Member profile pages displayed Member name as the primary identifier — but here the *product framing* is primary and the *Member context* is secondary.

### D.3 Visual hierarchy

```
[logo]  Growth Conversations          [open thread badge]
        Jenny's Catering · Small Caterer · Starting · Scott Brynjolffson
```

Not:
```
[logo]  Jenny's Catering              [open thread badge]
        Small Caterer · Starting · Scott Brynjolffson
```

### D.4 Acceptance criteria for Block D

- [ ] "Growth Conversations" displays as primary page title
- [ ] Member name + tagline display as subtitle
- [ ] Font/color treatment matches Member Signals brand mark
- [ ] All three Member fixtures display correctly

---

## Block E — Capture cards display signal type as primary tag

### E.1 Current state

Capture cards in the captured feed currently display the *activity* (Ask, Quantify, Model, etc.) as the primary tag. This tells the banker *how* the capture was made but not *what* it is.

### E.2 Replacement

For Ask captures, display the *signal type* as the primary tag:
- `Goal · Smooth seasonal revenue`
- `Blocker · Slow customer payments`
- `Indecision · Needs another decision-maker's input`
- `Trigger · Anchor customer volume signal`

For other activity types, use the natural tag for that capture:
- Quantify captures: `Sized · $48K slow-season gap`
- Model captures: `Model · Seasonal cashflow projection · with Member`
- Reaction captures: `Reaction · leaning yes`
- Action captures: `Action · Schedule joint call by May 12`

### E.3 Implementation

The capture card variant components in `components/v2/captured-feed/` (or wherever they live per Sprint 4.7 phase 2 implementation) need updated tag-rendering logic. The tag derives from:
- For Signal-type captures (Ask): the `Signal.signal_type` enum value
- For SizingMeasurement captures: the word "Sized"
- For Model captures: the word "Model" + optional with-Member / banker-draft annotation
- For Reaction captures: the word "Reaction" + the response value
- For ActionCard captures: the word "Action"

The activity *itself* (the dialpad button pressed) becomes implicit — bankers infer it from the tag.

### E.4 Acceptance criteria for Block E

- [ ] Ask captures display signal-type tag (Goal / Blocker / Indecision / Trigger)
- [ ] Other activity captures display natural type tags
- [ ] No card displays "ASK" or activity-name as primary tag
- [ ] Tag styling uses chip aesthetic (Block B)

---

## Block F — Compliance banner: dark grey + sharpened copy

### F.1 Current state

The compliance disclaimer banner displays:

> *Member Signals supports your consultative conversations. Lending decisions, formal underwriting, and adverse action determinations occur in the lending decisioning system. Captures here are working notes for relationship management.*

Two issues:
- Light tan background blends with page chrome; the banner doesn't read as distinct from the rest of the page
- Copy is consultese-jargonese ("consultative conversations," "relationship management," "adverse action determinations") — language for compliance audiences, not for working bankers

### F.2 Replacement copy

Replace banner copy with:

> *Member Signals captures consultative notes for growth conversations. Lending decisions and formal underwriting occur in the lending decisioning system.*

Plain business English. Two sentences. Drops "adverse action determinations" (the structural protection still works without that phrase, and the audience that needs that specific phrase is regulators, not the banker).

### F.3 Visual treatment

- Background: dark grey (`var(--blaze-grey-darker)` or equivalent) with white text
- Or alternatively: maintain a tan-adjacent background but boost contrast significantly so the banner reads as distinct from page chrome
- Compact: 2 lines max in standard viewport widths
- Dismissible per session (existing behavior preserved)
- Position: below header strip, above key facts strip (per Q-H1, unchanged)

CC's choice on which dark-treatment direction; visual review will confirm. If unclear which fits best, default to dark grey background with white text — clearer signal that this is a system disclaimer, not a Member-context element.

### F.4 Acceptance criteria for Block F

- [ ] Banner copy replaced with the sharpened version (verbatim from F.2)
- [ ] Background contrast improved (dark grey or equivalent)
- [ ] Banner reads as distinct from page chrome
- [ ] Dismissible per session (no behavior regression)
- [ ] All three Member fixtures display correctly

---

## Block G — Sticky dialpad on scroll

### G.1 Current state

The dialpad is positioned beneath the key facts strip in the static layout. When a banker scrolls down to read older captures, the dialpad scrolls out of view. To capture a new note, the banker must scroll back up.

### G.2 Replacement

Dialpad becomes sticky on scroll: `position: sticky` at the top of the viewport when scrolled past its native position. Header strip collapses to a thin strip showing just the Member name (so the banker still knows whose page they're on while scrolled).

### G.3 Implementation

- Dialpad: `position: sticky; top: 0;` (or equivalent) with appropriate z-index to layer above content
- Header strip: collapses to ~40px height showing logo + Member name + open-thread badge (truncated if necessary). Key facts strip and full Member tagline both collapse.
- Compliance banner: stays in static layout (doesn't follow the sticky dialpad)
- Smooth transition between expanded and collapsed states (CSS transition, ~150ms)

### G.4 Acceptance criteria for Block G

- [ ] Dialpad sticks to top of viewport when scrolled past native position
- [ ] Header collapses to thin strip on scroll
- [ ] Logo + Member name + open-thread badge visible in collapsed state
- [ ] Smooth transition between states
- [ ] Works correctly on all three Member fixtures

---

## Block H — Restore Cygnus's two Asks

### H.1 Current state

Sprint 4.7 phase 2 collapsed Cygnus's two original Ask paragraphs into a single Discover coach paragraph (per Turn 2 deviation note). The two distinct captures became one. This was an over-correction — the v2 model retired the *stage* distinction (Ask 1 / Ask 2 stages), but it did not retire the *capture* distinction (two separate Ask captures of distinct discovery signals).

### H.2 Replacement

Restore Cygnus's two Asks as two distinct captures, rendering as two distinct dots in the Discover objective.

**Note on schema enum vocabulary:** Sprint 4.7.1 does NOT rename the `ObjectiveType` enum value (`IDENTIFY_PRODUCT_FIT` stays as the enum value until 4.7.2). However, any new banker-facing copy CC writes in this sprint should use the v2 vocabulary "Discover" per the updated ARCHITECTURE_V2.md. Existing UI that still says "Land" can remain as-is until 4.7.2 — visual review will surface those for the rename pass.

### H.3 Source data

Per `MEMBER_FIXTURE_BRIEF.md` §5 (Cygnus), the two original Ask captures naturally cluster around different discovery signals:

- **Ask cluster 1 — Customer growth signals:** Anchor customer volume signals, ~85% capacity utilization observation, customer platform consolidation naming Cygnus a preferred supplier (the 2025-06-22 forward-looking trigger Signal)
- **Ask cluster 2 — Capital event signals:** Board evaluation in progress, three-financing-scenario request, RFP vs relationship-led process indecision

If CC needs to determine the exact split, read MEMBER_FIXTURE_BRIEF.md §5 carefully and split per the natural clustering. If the original capture is currently a single record, split it into two records each with its own captured-at timestamp, banker, and structured signal type.

### H.4 Acceptance criteria for Block H

- [ ] Cygnus has two distinct Ask-derived Signal records in seed data
- [ ] Sidebar Discover objective renders two dots for Cygnus (not one collapsed)
- [ ] Captured feed displays two distinct cards for the two Asks
- [ ] Cygnus's coach content for Discover remains coherent (single paragraph still works; two captures are evidence dots, not separate coach paragraphs)

---

## Governance updates

After Blocks A-H ship and visual review confirms:

1. **BUILD_LOG.md entry** for Sprint 4.7.1 with what shipped per block, decisions made during implementation.

2. **No OPEN_QUESTIONS amendments expected.** If implementation surfaces new questions, log per existing pattern.

3. **No CLAUDE.md manifest changes** — no new governance docs added in this sprint.

---

## Pilot / 4.7.2 deferrals to honor

Sprint 4.7.1 does not ship:

- Code-side vocabulary refactor (`ObjectiveType` enum rename, all UI strings, banker-facing labels) — Sprint 4.7.2
- Dialpad button reduction (7 → 5: remove + Show, + Resolve) — Sprint 4.7.2
- Reaction form expansion to subsume primary_concern field — Sprint 4.7.2
- Coach content rewrite per Francisco's verbatim phrasing — Sprint 4.7.2
- State-dependent dot rendering — Sprint 5
- Popup-as-workflow-surface restructuring — Sprint 5
- Track templates defining evidence inputs per dot — Sprint 5
- Insight Engine portfolio surfaces — Sprint 5

If a question arises during 4.7.1 implementation that touches these areas, log to OPEN_QUESTIONS and proceed conservatively. Do not anticipate 4.7.2 work in this turn.

**Vocabulary note:** The governance documents (ARCHITECTURE_V2.md, EVIDENCE_FRAMEWORK.md) already use the new vocabulary (Discover/Measure/Consult/Navigate) by the time CC reads them in pre-flight. The code (ObjectiveType enum values, UI strings) still uses old vocabulary — that's Sprint 4.7.2's job to align. CC may notice the gap during 4.7.1 work; that gap is intentional and gets closed in 4.7.2.

---

## Reporting back

When Sprint 4.7.1 complete, report back with:

1. Confirmation that Blocks A-H shipped per acceptance criteria
2. Visual probes (screenshots if browser available, HTML probes if not) of:
   - Jenny's page with restored two-pill header badge
   - Cygnus's page with two-dot Discover objective
   - Compliance banner with new dark-grey treatment and sharpened copy
   - Sticky dialpad behavior (scrolled and unscrolled views)
   - Page title showing "Growth Conversations" with Member name as subtitle
   - Capture card displaying signal-type tag (Goal / Blocker / etc.)
3. Any deviations from spec with rationale
4. Any new questions logged to OPEN_QUESTIONS

Visual review will probe each block independently. Plan diff structure so each block is delimited.

---

## Estimated scope

~1 effective build day. Block H (Cygnus restoration) and Block F (compliance banner copy) are straightforward; Block B (chip aesthetic factoring) and Block G (sticky dialpad) are the highest-effort items. If any block threatens to exceed estimate or surfaces unexpected complexity, surface to Francisco rather than over-investing.

After Sprint 4.7.1 ships and visual review confirms, Sprint 4.7.2 (vocabulary refactor + dialpad simplification) follows immediately.
