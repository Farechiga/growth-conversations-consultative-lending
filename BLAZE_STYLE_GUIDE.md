# BLAZE_STYLE_GUIDE.md

**Visual identity and styling reference for the Blaze Member Signals demo. Derived from the source PDF: "Improving Lives and Deepening Lifetime Value." Read this before writing any UI code.**

---

## 1. Visual identity in one paragraph

Blaze's visual identity is **warm, professional, and rooted in real materials**. The dominant color is a *burnished orange* — the color of weathered copper, aged wood, fall light. The structural neutral is a *deep warm grey* — not cool slate, not blue-black, but a grey that has been visually warmed toward brown. Surfaces are predominantly white or off-white parchment tones, with the burnished orange used sparingly as accent — never as a flood color. The most recognizable signature is a **horizontal gradient banner** that runs across the top of every page in the source deck, transitioning from black through burnt brown to burnished orange to warm grey.

Two patterns repeat throughout the source material and should be carried directly into the app:

1. **Gradient header band** — a thin horizontal band across the top of major surfaces, using the black-to-orange-to-grey gradient. This is the brand wordmark for the digital surfaces.
2. **Burnished-orange-headed panels** — content cards with a slim burnished-orange header strip and a white (or near-white) body, often sitting on a deeper grey ground. This is the dominant component pattern.

---

## 2. Color palette

All hex values below were sampled directly from the source PDF. Use them exactly. Do not introduce off-palette colors without checking with Francisco.

### 2.1 Burnished orange — the signature accent

| Token | Hex | Usage |
|---|---|---|
| `--blaze-orange` | `#B45F26` | **Primary accent.** Product card headers, primary CTAs, brand wordmark, focused states. |
| `--blaze-orange-bright` | `#BC5D1D` | Brighter highlight. Hover states on orange surfaces, attention pulls. |
| `--blaze-orange-deep` | `#AD571C` | Deeper accent. Title text on light grounds, the "Improving" word in the wordmark. |
| `--blaze-orange-burnt` | `#8E3F0E` | Deepest burnished tone. Pressed/active button states, emphasized inline links. |
| `--blaze-orange-pale` | `#F2D9C2` | Pale tint for subtle orange backgrounds (badges, hover tints, soft highlights). |

**Discipline:** Burnished orange is **accent-only**. It should never be a flood background. The largest use of orange in the source deck is a ~40px header strip on a card; even the gradient banner is only 30-40px tall on a 720-tall page.

### 2.2 Deep warm grey — the structural neutral

| Token | Hex | Usage |
|---|---|---|
| `--blaze-grey-dark` | `#2B2B29` | Banner dark, header backgrounds, primary text on light grounds. |
| `--blaze-grey-darker` | `#262626` | Deepest neutral. Header right-side, full-bleed dark sections. |
| `--blaze-grey-body` | `#4F5052` | Semi-transparent body cards (used on photography backgrounds in the deck). |
| `--blaze-grey-mid` | `#636468` | Mid-tone for body card variants, dividers. |
| `--blaze-grey-soft` | `#888780` | Secondary text, subtle borders, muted UI elements. |

**Discipline:** All Blaze greys are *warm* — there's slight brown shifted into them. Never substitute cool greys (e.g., #2B2B33, which has blue cast) for these values. The warmth is what makes them feel native to Blaze.

### 2.3 Warm parchment — soft surfaces

| Token | Hex | Usage |
|---|---|---|
| `--blaze-cream` | `#F5EFE5` | Lightest surface. Card backgrounds in light contexts, hover lifts. |
| `--blaze-parchment` | `#E8E0D4` | Body card on light grounds, soft information surfaces. |
| `--blaze-dust` | `#D7D3D0` | Action card body, scaffolding behind content. |
| `--blaze-white` | `#FEFFFF` | App body, content surfaces, modal backgrounds. Pure white with imperceptible warmth. |

### 2.4 Functional colors (use sparingly)

For semantic UI states (success, warning, danger, info), prefer Blaze-native tints rather than generic green/red/blue:

| Token | Hex | Usage |
|---|---|---|
| `--blaze-success` | `#5C7A3F` | Funded outcomes, confirmed states. (Warm forest green, not bright lime.) |
| `--blaze-warning` | `#B47424` | Aging cards, attention-needed states. (Slightly warmer than orange.) |
| `--blaze-danger` | `#9C3325` | Declined outcomes, errors. (Brick red, not bright crimson.) |
| `--blaze-info` | `#3D5A6C` | Informational badges, links. (Slate blue with warmth.) |

These are intentionally muted to live alongside the burnished orange without competing.

### 2.5 Surface accents (narrow purpose tokens)

Tokens reserved for very specific surface treatments, not general use. Adding a token here without a documented purpose dilutes the palette.

| Token | Hex | Usage |
|---|---|---|
| `--blaze-frost-edge` | `#CAE8FD` | 1px borders on semi-transparent white panels sitting over a dark warm-grey ground. Echoes the frosted-glass edge treatment on page 12 of the source PDF where panels float over photography. **Do not use this color anywhere except on those specific panel edges** — it is not a general accent, not a link color, not a focus ring. The reframe: this token's job is to make the frosted panel feel like glass and not like flat white-on-dark. |

The frosted-glass pattern itself: `background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(8px); border: 1px solid var(--blaze-frost-edge);` applied to panels on the dark-ground pages. The dark-ground pattern was the dominant treatment for dense surfaces in early Day-2 work; it has been superseded for those surfaces by the borderless typography-led pattern in §4.5 below.

### 2.6 Borderless-pattern tokens

Tokens used by the borderless typography-led pattern (§4.5). These are dominant on dense banker-facing surfaces (Member profile, Insight Engine views).

| Token | Hex | Usage |
|---|---|---|
| `--blaze-charcoal` | `#1A1A1A` | Primary body text on the page ground. Slightly darker than `--blaze-grey-darker` (`#262626`); reads as black on cool near-white without being true black. |
| `--blaze-paper` | `#F9FCFD` | Page ground for dense banker-facing surfaces. Cool near-white — a deliberate temperature shift from the warm `--blaze-cream`/`--blaze-parchment` family. The cool ground lets warm-toned exceptions (the pinned Suggested-next-step card, banker-facing photography, future Meeting recap surfaces) carry visual weight by temperature contrast rather than chrome. |
| `--blaze-data-cool` | `#F9FBFD` | Background fill for captured-value chips. Effectively identical to `--blaze-paper` on the page; the chip's "structured field" signal comes from its 1.5px orange border + monospace text + square edges, **not** from a fill contrast. The token is preserved as distinct from `--blaze-paper` so component code can swap chip backgrounds (e.g., on warm-card surfaces) without touching page-level tokens. |
| `--blaze-rule` | `#E8EAEC` | 1px horizontal rules between bands in the borderless layout. **Do not use as a general border color** — section separators only. Lightened from the prior `#D5D8DB` in Sprint 1 review fix #2 — the rule should disappear into the page until the eye is looking for it; the prior darker tone read as competing structure. |

All four are deliberate temperature shifts away from the warm palette: `--blaze-charcoal` is functionally neutral; `--blaze-paper`, `--blaze-data-cool`, and `--blaze-rule` are the only cool-grey tokens in the entire palette, used precisely because they need to read as "structural" rather than "decorative" against the rest of the warm content. Resist using them for general-purpose surfaces — that's how cool greys creep in and dilute the warm identity.

### 2.7 Section-mark dimensions

The orange rectangle mark used at the start of every section label in the borderless pattern (§4.5):

- **Default size:** 27px wide × 24px tall, solid `--blaze-orange` (`#B45F26`), 12px right margin before label text. The 24px height matches the section-label text height (24px); the 27px width is the proportionally-scaled 3:4 baseline (18px) widened by 50% to give the mark deliberate brand-element weight.
- **Compact contexts** (sidebar mini-bands, dense lists, modal sub-sections): 18px wide × 16px tall, same color, 8px right margin. Proportionally smaller — matches what the prior "default" was, kept available so dense surfaces have a quieter section-label rhythm.
- **Section-label text:**
  - **Default:** 24px / 600 / `letter-spacing 0.08em` / uppercase / `leading-none`. Roughly 80% of the 30px Member identity heading (Band 1 H1) — the section label has real presence without competing with the Member name at the top of the page.
  - **Compact:** 19px / 600 / `letter-spacing 0.08em` / uppercase / `leading-none`. ~80% of the page-header wordmark (24px). Used in sidebar and modal sub-sections.

Both sizes maintain `items-baseline` between the mark and the label so the mark reads as a wordmark/bullet aligned with the text baseline rather than a centered status badge.

---

## 3. The signature gradient

The gradient that runs across the top of every page in the source deck is the most recognizable visual element. Carry it forward as a thin header band in the app.

```css
.blaze-gradient-band {
  background: linear-gradient(
    to right,
    #000000 0%,
    #291305 18%,
    #441F05 32%,
    #6C300B 48%,
    #B45F26 70%,
    #BC5D1D 78%,
    #2B2B29 100%
  );
  height: 32px;  /* thin band — never thicker than 48px */
}
```

**Where to use it:**
- Top of the main app shell (full width, ~32px)
- Top of major full-bleed pages (Member profile header, Insight Engine header)
- Optional: bottom of the page footer as a thin (~4px) accent strip

**Where NOT to use it:**
- Inside cards or smaller components (it's a frame, not a fill)
- As a button background (use solid `--blaze-orange` instead)
- As a chart fill (charts get solid colors, not gradients)
- Behind body text (it would compromise readability)

---

## 4. The orange-headed panel — occasional anchor (sparse contexts only)

The pattern below is the canonical product-card shape from the source deck. It is **no longer the dominant pattern for dense banker-facing surfaces** — those use the borderless typography-led pattern in §4.5. The orange-headed panel is now used sparingly, for *one or two* deliberate emphasis points per surface — the canonical example is the pinned "Suggested next step" callout on the Member profile, where the card-versus-borderless contrast is what makes the suggestion land as the primary call to action. If everything is borderless, this card stops feeling deliberate; if this card is borderless too, the page loses its primary CTA.

```jsx
<div className="rounded-md overflow-hidden border border-warm-grey-50">
  <div className="bg-[#B45F26] text-white px-3 py-2 text-sm font-medium">
    Revolving line of credit
  </div>
  <div className="bg-white px-4 py-3 text-warm-grey-dark text-sm">
    Smooth out income fluctuations with a financial buffer.
  </div>
</div>
```

**Variants:**

- **On photography or dark grounds:** body switches to `rgba(255, 255, 255, 0.92)` for the semi-transparent panel effect seen on page 12.
- **On light grounds:** body is solid white (`#FEFFFF`) with a hairline grey border.
- **Selected state:** orange header gets the brighter `--blaze-orange-bright` (`#BC5D1D`); body adds a 2px outer ring in `--blaze-orange-pale`.
- **Action items (numbered cards from page 8):** orange header is replaced with a large orange numeral (1, 2, 3) in the top-left of the body, with the same `#B45F26` color.

---

## 4.5 Borderless typography-led pattern (dominant for dense surfaces)

This is the **dominant pattern** for dense banker-facing surfaces — the Member profile, the Insight Engine views, and any future analytical view. The orange-headed-panel pattern from §4 still applies but only as occasional anchor, never as the page-level chrome.

The discipline: structure comes from typography, whitespace, and small semantic accents — not from card borders. Orange does small, deliberate pieces of work as visual anchors. Most of the page is flat cream ground with charcoal text.

### Section structure

Every section opens with a **section label** consisting of an orange rectangle mark followed by **title-case** label text. The orange rectangle is doing enough visual work that we don't need typographic shouting alongside it; uppercase reads as legacy enterprise software, title case reads as modern professional.

```jsx
<div className="flex items-baseline gap-3">
  <span aria-hidden className="inline-block h-6 w-[27px] bg-[#B45F26]" />
  <span className="text-2xl font-semibold tracking-[0.02em] text-[#1A1A1A] leading-none">
    Active state
  </span>
  {meta && (
    <span className="text-sm font-medium text-[#4F5052]">{meta}</span>
  )}
</div>
```

- **Mark dimensions:** 27×24px solid `--blaze-orange`, 12px right margin (default); 18×16px in compact contexts (sidebar mini-bands, modal sub-sections), 8px right margin. The default mark width is the proportionally-scaled 3:4 baseline (18px) widened by 50% to give the mark deliberate brand-element weight; compact preserves the smaller original sizing for quieter contexts.
- **Label text:** 24px / 600 / `letter-spacing 0.02em` / **title case** / `leading-none`, color `--blaze-charcoal` (default); 19px / 600 in compact contexts. Title case throughout — no uppercase. The default is ~80% of the 30px Member identity heading.
- **Optional meta:** 13-14px / 500, color `--blaze-grey-body`. Used for descriptive context ("where things stand", "what we know about Jenny right now").

### Body text hierarchy

| Element | Size | Weight | Color |
|---|---|---|---|
| Section title (under the section label) | 18px | 600 | `#000000` (true black) |
| Member identity heading (Band 1 only — page's primary identity) | 24-28px | 600 | `#000000` |
| Body text | 14px | 400 | `--blaze-charcoal` (`#1A1A1A`) |
| Body emphasis | 14px | 500 | `--blaze-charcoal` |
| Secondary / supporting prose, captions, metadata | 13-14px | 400 | `--blaze-grey-body` (`#4F5052`) |
| Small labels, timestamps | 12-13px | 500 | `--blaze-grey-body` |

Three levels of dark (black for titles, charcoal for body, grey-body for supporting) — the eye reads structure even without colored panels. **Do not soften body text below `#262626`** — anything lighter loses presence on cream.

### Captured-value chip (the new chip pattern)

Replaces the prior orange-tinted chip. Marks structured field values captured in specific Growth-step executions, hover-tooltip cites the capture event.

```jsx
<span
  className="inline-flex items-baseline border-[1.5px] border-[#B45F26] bg-[#F9FBFD] px-1 py-0.5 font-mono text-[0.85em] text-[#1A1A1A]"
  title={`Captured · ${capturedBy}`}
>
  $75K
</span>
```

- **Background fill:** `--blaze-data-cool` (`#F9FBFD`) — cool grey signals "structured field" against warm cream ground.
- **Border:** 1.5px solid `--blaze-orange`. If the chip reads as "boxed-in label" rather than "structured value", drop to 1px.
- **Border-radius:** 0px (square edges, no rounded corners).
- **Text:** monospace at 0.85em, color `--blaze-charcoal`.
- **Padding:** 4px horizontal, 2px vertical (compact).

### Quote-attribution mark (verbatim member quotes)

```jsx
<blockquote className="border-l-[3px] border-[#B45F26] py-1 pl-3 italic text-[#4F5052]">
  &ldquo;{their_words}&rdquo;
</blockquote>
```

- **Mark:** 3px-wide vertical line in `--blaze-orange`, full height of the quote block.
- **Quote text:** italic, color `--blaze-grey-body` (softer than body charcoal — reads as voice, not statement).
- **Spacing:** 12px between line and text; 4px padding above and below the text.

### Section dividers and band spacing

Between bands, a 1px horizontal rule in `--blaze-rule` (`#E8EAEC`), centered in a generous ~113px gap:

```jsx
<hr className="my-14 border-0 border-t border-[#E8EAEC]" />
```

- **~113px total gap between bands** (`my-14` = 56px above + 56px below + 1px line) per Sprint 1 review fix #2. The earlier 40px-each-side spec was visually missing at the Active-signals → History transition; the lightened rule color and increased margin produce a consistent visible separator at every band-to-band boundary without competing with content.
- Within bands, tighter spacing (16-24px) keeps related elements visually associated.
- The cool-grey rule should disappear into the page until the eye is looking for it.

### Body text hierarchy (explicit weights)

Modern professional dashboards use weight as the primary hierarchy tool. Three weights, three colors:

| Element | Size | Weight | Color |
|---|---|---|---|
| Section title (under the section label, e.g. "Where things stand") | 18px | **600** | `#000000` |
| Member identity heading (Band 1 only) | 28-30px | 600 | `#000000` |
| Item titles within a band (Signal topic, Recommendation product, ActionCard type+owner) | 14px | **600** | `--blaze-charcoal` |
| Primary body text | 14px | 400 | `--blaze-charcoal` |
| Supporting prose / metadata | 13px | 400 | `--blaze-grey-body` |
| Small labels (sublabels like "Goals (1)" / "Blockers (2)") | 12px | **600** | `--blaze-grey-body` (sentence case, not uppercase) |

The discipline: weight handles importance, color handles secondary/tertiary status, size handles the truly small elements. Restrained palette, clear hierarchy.

### Hover states

Conversation history entries and open ActionCard rows get a subtle warm tint on hover, signaling responsiveness without adding click handlers (drill-in interactions are out of scope for v1):

```jsx
<li className="cursor-pointer transition-colors duration-150 hover:bg-[rgba(180,95,38,0.04)]">
```

The bg shift is `rgba(180, 95, 38, 0.04)` — a 4%-alpha burnished orange. On the cool paper ground this reads as a faint warm wash; on cream or other warm grounds it reads as a slight saturation lift. The cursor changes to pointer; transition lasts 150ms.

### Hyperlinks and inline navigation

Burnished orange retained for clickable tokens — this is the third piece of orange work alongside section marks and quote attribution lines.

- **Inline links** in body prose (Active state summary tokens, Recommendation responds-to anchor links): `--blaze-orange-deep` (`#AD571C`), underline on hover.
- **Verb-prefix labels** ("→ serves goal:", "→ addresses blocker:"): `--blaze-orange-deep`, normal weight; functioning as inline hierarchy markers.

### The three pieces of orange semantic work

The borderless pattern lets orange do three small deliberate jobs and nothing else:

1. **Section marks** — anchor the start of each section.
2. **Quote attribution lines** — attribute member voice.
3. **Hyperlinks and verb-prefix labels** — mark inline navigation/hierarchy.

Plus the captured-value chip border. Anything else surfacing as orange is a smell — check before adding.

### Surfaces this applies to

- Member profile (current Day-2 implementation; this pattern lands here first)
- Insight Engine views (when built — Day 3+)
- Future analytical surfaces

### Surfaces this does NOT apply to

- The pinned "Suggested next step" panel — it's the deliberate card exception per §4. Stays as the orange-pale card so the primary CTA reads as primary.
- The signature gradient band at the top of the page (§3) — that's a brand frame, not section structure.
- Buttons, form inputs, charts — they have their own patterns in §7-9.

---

## 4.6 Tag and chip discipline

**Four** distinct treatments for captured field values. Refined across Sprint 1 review passes — the original two-tier divide (chip vs inline-bold) flattened the visual texture; the three-tier divide restored field meaning via labeled values; the fourth tier (plain inline / implicit display) acknowledges that some captured fields are most legible when *not* given visual emphasis at all, because their meaning is conveyed elsewhere on the page or because they exist primarily for downstream analytics rather than banker scan.

### TAGGED — captured-value chip

Reserved for **enumerated member-state values where the value itself is the salient signal**. The reader doesn't need the field name to understand what the value means in context — `leaning yes` is self-explanatory in the sentence "Member is leaning yes."

Style spec (per §4.5 captured-value chip block):

- Background: `--blaze-data-cool` (`#F9FBFD`)
- Border: 1.5px solid `--blaze-orange` (drop to 1px if it reads as "boxed-in label" rather than "structured value")
- Border-radius: 0px (square edges)
- Text: monospace at 0.78em, color `--blaze-charcoal`
- Padding: 4px horizontal, 2px vertical
- Hover: native `title=` attribute with capture provenance.

Typical chipped values: `leaning yes`, `spouse`, `cpa`, `follow up`, `committed`, `engaged` (when surfaced as Recommendation.response), and ActionCard.type values.

Where they appear in the demo: the Open opportunities band ("Member is `leaning yes` · primary concern: `spouse`") and the Open work band (`follow up` · owned by Scott Brynjolffson).

### LABELED VALUE — `Field: value` pair

Used for **descriptive captured fields where the field name and value together convey meaning**. `painful` alone is jargon; `Impact: painful` reads as a banker noting severity. The field-name prefix makes the column meaning visible without forcing the reader to memorize chip ordering.

Style spec:

- Label: 13px / 400 / `--blaze-grey-body` (#4F5052), trailing colon, no separator.
- Value: 13px / 500 / `--blaze-charcoal` (#1A1A1A), wrapped in `<strong>`, weight 500.
- Label-to-value spacing: 6px gap (Tailwind `gap-1.5` on `inline-flex` parent — the regular text space character collapses to ~3px at small sizes and reads as cramped).
- Pipe separator surroundings: 14px horizontal margin on each side of the `·` (Tailwind `gap-x-3.5` on the surrounding flex container).
- Hover: native `title=` attribute on the value with capture provenance.

Reference implementation: `<LabeledValue>` in `app/members/jenny/page.tsx`.

Typical labeled values (Active signals band):

- `Impact: painful` (Signal.severity)
- `Timeframe: recent` (Signal.recency for blocker/goal/indecision)
- `Time horizon: hypothetical future` (Signal.recency for **trigger** Signals — the recency of a forward-looking event reads as a horizon, not a timeframe)
- `Source: member stated` (Signal.confidence)

When the value is itself a numeric measurement, the LabeledValue wraps an InlineWithProvenance for the value portion: `Quantified: **$12K/quarterly**` (where the numeric carries the styled hover tooltip and the label carries the field name).

### INLINE — bold + styled hover provenance

Used for **free numeric or string values that were captured but are not from an enum set**. The format itself ($75K, 45 days, 12K/quarterly, $90K/vehicle) carries the structure signal; a chip would imply enum membership when in fact any value is possible.

Style spec:

- Render: `<strong>` in `font-semibold` charcoal — no chip, no border, no fill.
- Hover: small custom-styled tooltip with the capture provenance (`"Captured 2026-04-08 in the Show step, Growth track 'Smooth seasonal cash flow with LOC', step 3"`).
- Tooltip styling: white bg, 1px `--blaze-rule` border, 12px charcoal text, 8px×12px padding, max-width 280px, subtle `0 2px 8px rgba(0,0,0,0.06)` shadow, positioned above the value with 8px offset.

Reference implementation: `<InlineWithProvenance>` in `app/members/jenny/page.tsx`.

Typical inline-bold values: **$75K**, **$12K/quarterly**, **45 days**, **70 calls**, **two service vehicles**, **Apr 22, 2026** (a captured date is a free temporal value, not from an enum).

### PLAIN INLINE / IMPLICIT — no visual emphasis

Used for **entity-categorizing metadata that's captured for downstream analytics but doesn't earn visual real estate in the banker UI**, or for fields whose meaning is already conveyed by something else on the page. The value lives in the schema (queryable, filterable, exportable) but the banker doesn't see it as an emphatic surface element.

Two reasons a captured field falls into this tier:

1. **Redundant with another display.** The field's meaning is already on the page through a more meaningful channel. Surfacing it again would dilute the page rather than clarify it. Example: `ActionCard.type` (follow_up / handoff / nurture) — the verb-prefix line below the card header (`→ de-risks opportunity:`, `→ hands off to specialist:`, `→ nurtures:`) conveys the kind of work more meaningfully than a `follow up` chip does. Showing both creates competing signals for the reader to reconcile.

2. **Captured for analytics, not for banker scan.** The field is useful when running production rollups ("what fraction of overdue ActionCards are nurture-type?") but the individual banker working a Member doesn't need the value visible to act. Example: `Artifact share record.shared_afterward` — production-side, knowing how often bankers send takeaways and how that correlates with conversion is valuable; member-side, the share happened or it didn't, and the banker already moved on.

When a field falls into this tier, **don't render it on the banker surface at all**. Don't even render it as plain text — that adds noise without adding value. The schema field stays; the UI line drops.

### How to choose

When captured-value rendering comes up, ask four questions in order:

1. **Is this value's primary purpose to convey member state — what the member said, felt, decided, or is doing?**
   - Yes → CHIP. The value reads as a discrete state on its own (`leaning yes`, `committed`, `engaged`, `spouse`).
   - No → continue.

2. **Is this value a measurement with units, or a free numeric / temporal value?**
   - Yes → INLINE with styled hover provenance ($75K, 45 days, Apr 22).
   - No → continue.

3. **Is this a descriptive captured field where the field name matters for clarity?**
   - Yes → LABELED VALUE (`Impact: painful`, `Source: member stated`).
   - No → continue.

4. **Otherwise — entity-categorizing metadata, redundant with another display, or weak categorization** → PLAIN INLINE or IMPLICIT (don't render).

The fourth tier is the silent default. When a captured field doesn't earn one of the first three treatments, it shouldn't appear on the surface at all.

### What to remove

Tags that aren't doing real captured-value work are visual noise. Specific cases removed during Sprint 1:

- `high confidence` chip on the Open opportunities card — confidence belongs to the system's belief in the suggestion, not to an attribute of the Recommendation captured during the conversation. Lives only on Suggested Next Step.
- `standard` structure chip on Recommendations — only show structure tags when non-standard ("phased over 18 months", "paired with equipment loan"). "standard" hides.
- `acute_recent` recency value renamed to `recent` — the word "acute" overlapped severity vocabulary like "painful" and produced the "acute recent · painful" double-up.
- `member_reaction` field on Artifact share records — removed entirely in the schema collapse. The truest signal of how the member responded lives on `Recommendation.response` at the Resolve-step closure; the Artifact share record now only captures whether the share happened, not how the member reacted.
- `ActionCard.type` chip on card headers — dropped in favor of the verb-prefix line, which conveys the card's kind more meaningfully (`→ de-risks opportunity: …` vs `follow up`). Schema field stays; display drops. Falls under the fourth tier (redundant with another display).
- `Artifact share record.shared_afterward` "sent as takeaway" line — dropped from the Artifact share record display. The relevant signals (chart shown, member responded, opportunity advanced) are captured on the Recommendation; the takeaway boolean lives in the schema for production analytics. Falls under the fourth tier (captured for analytics, not for banker scan).

---

## 5. Typography

The source deck uses **Calibri** (Microsoft default) — readable but not branded. For the app, default to **Inter** (which the Mira shadcn preset already loads) for UI, with a more characterful display option for headlines.

### 5.1 Type stack

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-display: 'Inter', system-ui, sans-serif;  /* same family, used at larger weights */
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

**Inter pairs well with the burnished orange + warm grey palette** because it's neutral enough not to compete but warm enough not to feel sterile. Avoid Helvetica (too cold), Roboto (too generic), or any serif (would feel out of place against the orange).

### 5.2 Type scale

| Element | Size | Weight | Color | Usage |
|---|---|---|---|---|
| Display H1 | 32px / 2rem | 600 | `--blaze-orange-deep` | Page-level titles in the wordmark style ("Improving lives") |
| H1 | 24px / 1.5rem | 600 | `--blaze-grey-darker` | Page titles in standard contexts |
| H2 | 20px / 1.25rem | 600 | `--blaze-grey-darker` | Section headings |
| H3 | 16px / 1rem | 600 | `--blaze-grey-dark` | Subsection headings, card titles |
| Body | 14px / 0.875rem | 400 | `--blaze-grey-darker` | Default body text |
| Body emphasis | 14px / 0.875rem | 500 | `--blaze-grey-darker` | Inline emphasis, key terms |
| Small | 13px / 0.8125rem | 400 | `--blaze-grey-soft` | Secondary text, captions, timestamps |
| Caption | 12px / 0.75rem | 500 | `--blaze-grey-soft` | Labels above metric numbers, tag pills |
| Mono | 13px / 0.8125rem | 400 | `--blaze-grey-darker` | Code, IDs, technical strings |

### 5.3 The wordmark pattern

The deck's signature wordmark is **"Improving lives"** with "Improving" in `#AD571C` (deep burnished orange) and "lives" in white or `#2B2B29`. Replicate this pattern for the app's brand title and major taglines:

```jsx
<h1 className="text-3xl font-semibold">
  <span className="text-[#AD571C]">Member</span>{' '}
  <span className="text-[#2B2B29]">Signals</span>
</h1>
```

The orange-then-dark pairing is the core brand wordmark gesture. Use sparingly — once per page maximum.

---

## 6. Surfaces and elevation

The source deck uses three surface tiers. Carry this discipline into the app.

### 6.1 Surface hierarchy

| Tier | Background | Border | Shadow | Used for |
|---|---|---|---|---|
| Ground | `--blaze-grey-darker` (`#262626`) | none | none | Full-page dark sections, photography overlays |
| Surface | `--blaze-white` (`#FEFFFF`) | `0.5px solid var(--blaze-grey-soft)` at 30% alpha | none in default; `0 1px 2px rgba(0,0,0,0.04)` on hover | Default card surface |
| Lifted | `--blaze-cream` (`#F5EFE5`) | `0.5px solid var(--blaze-orange)` at 40% alpha | `0 2px 6px rgba(43,43,41,0.08)` | Selected state, focused card |

**Discipline:**

- **No drop shadows on default state.** The deck achieves visual hierarchy through borders and color contrast, not shadows. Shadows appear only on hover/focus or on lifted surfaces.
- **Use border thickness for emphasis, not weight.** Default `0.5px`, focused `1px`, never thicker than `2px`.
- **Corner radius:** `8px` (`rounded-md`) for most components, `12px` (`rounded-lg`) for major cards, `4px` (`rounded`) for small chips and buttons. Never `rounded-full` except for avatars.

---

## 7. Buttons

### 7.1 Primary button (burnished orange)

```jsx
<button className="bg-[#B45F26] hover:bg-[#BC5D1D] active:bg-[#8E3F0E] text-white px-4 py-2 rounded text-sm font-medium transition-colors">
  Run Growth track
</button>
```

Use only for the **primary action on a screen** — there should rarely be more than one primary button visible at a time. The single most important call-to-action gets burnished orange.

### 7.2 Secondary button (warm grey outline)

```jsx
<button className="bg-transparent border border-[#888780] hover:bg-[#F5EFE5] text-[#2B2B29] px-4 py-2 rounded text-sm font-medium transition-colors">
  Cancel
</button>
```

Default for non-primary actions. Outlined, not filled.

### 7.3 Tertiary button (text-only)

```jsx
<button className="bg-transparent text-[#AD571C] hover:text-[#8E3F0E] hover:underline px-2 py-1 text-sm font-medium transition-colors">
  Learn more
</button>
```

For inline links and low-priority actions.

### 7.4 Destructive button

```jsx
<button className="bg-transparent border border-[#9C3325] hover:bg-[#9C3325] hover:text-white text-[#9C3325] px-4 py-2 rounded text-sm font-medium transition-colors">
  Decline
</button>
```

Brick red, not bright red. Outlined by default; fills on hover.

---

## 8. Forms and inputs

### 8.1 Input field

```jsx
<input
  type="text"
  className="w-full bg-white border border-[#888780]/40 rounded px-3 py-2 text-sm text-[#262626] placeholder-[#888780] focus:border-[#B45F26] focus:ring-2 focus:ring-[#B45F26]/20 focus:outline-none transition-all"
/>
```

Focus ring uses the burnished orange at 20% alpha — distinctive without being aggressive.

### 8.2 Select / dropdown

Same border and focus treatment as inputs. Chevron icon in `--blaze-grey-soft`.

### 8.3 Checkbox

```jsx
<input
  type="checkbox"
  className="w-4 h-4 border border-[#888780] rounded text-[#B45F26] focus:ring-2 focus:ring-[#B45F26]/20"
/>
```

Checked state uses burnished orange fill. Unchecked is hairline grey.

### 8.4 Chip / tag (for the Meeting recap chip-tap UI)

```jsx
// Default
<button className="bg-[#F5EFE5] border border-[#888780]/30 text-[#2B2B29] px-3 py-1.5 rounded-md text-sm hover:bg-[#E8E0D4] transition-colors">
  Cash flow seasonal
</button>

// Selected
<button className="bg-[#B45F26] border border-[#B45F26] text-white px-3 py-1.5 rounded-md text-sm">
  Cash flow seasonal
</button>
```

Cream/parchment when unselected; burnished orange when selected. The selected state is unambiguous at a glance — important for the under-60-second capture target.

---

## 9. Charts (Recharts)

Per the locked stack in `CLAUDE.md`, use Recharts. Apply Blaze colors consistently across all chart types.

### 9.1 Color sequence for series

When a chart has multiple series (e.g., the seasonal smoothing chart with "with LOC" vs "without LOC"), use this ordered palette:

```javascript
const BLAZE_CHART_COLORS = [
  '#B45F26',   // Burnished orange (primary series)
  '#4F5052',   // Body grey (secondary series)
  '#5C7A3F',   // Forest green (positive comparison)
  '#9C3325',   // Brick red (negative comparison)
  '#3D5A6C',   // Slate blue (informational)
  '#888780',   // Soft grey (baseline / reference line)
];
```

The primary series is always burnished orange. The "with LOC" line in the seasonal smoothing chart is orange; the "without LOC" comparison is grey.

### 9.2 Axis and grid styling

```javascript
const BLAZE_CHART_THEME = {
  axisColor: '#888780',
  gridColor: '#E8E0D4',
  textColor: '#4F5052',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
};
```

Grid lines are warm parchment (very subtle); axis text is mid-grey. No bright black axis lines — they would compete with the data.

---

## 10. Module-specific patterns

### 10.1 Meeting recap

The capture surface is **bright and chip-heavy** (under-60-second target). Background is white, chips are cream/parchment, selected chips are burnished orange. Real-time preview panel sits on a `--blaze-grey-dark` ground with white-92% panel body — directly inheriting the page-12 product card pattern.

### 10.2 Member profile

Six bands stacked vertically. Each band is a white surface with `0.5px` warm-grey borders. Band headers use the orange-headed panel pattern (orange strip + white body). The identity strip at top uses the gradient band background.

### 10.3 Insight Engine

Filters in a top bar (cream background, `--blaze-cream`). Charts on white surfaces with warm parchment grid lines. Leaderboards as cards with the orange-headed-panel pattern, rank numbers in burnished orange.

---

## 11. Verb pattern

Every meaningful relationship between entities on banker-facing surfaces is named with a **verb-prefix line**:

```
→ [verb]: [linked entity name]
```

The verb in `--blaze-orange-deep`, the linked entity in charcoal underline-on-hover (clickable to scroll to the anchor). This is the third piece of orange semantic work alongside section marks and quote attribution lines (§4.5) — the page's named relationships read as native UI elements rather than as prose attempting to describe them.

### Why every relationship gets a verb

The system's data model captures rich, named relationships (Recommendation → Signal, ActionCard → Recommendation, Conversation → Signal, Artifact share → Recommendation). Surfacing those relationships as flat anchor links would lose the relationship semantics; surfacing them as English prose ("This ActionCard relates to the Working Capital LOC opportunity") loses the canonical vocabulary the system uses internally. The verb-prefix line is the compromise that preserves both: short enough to read as a UI element, specific enough to surface the actual relationship.

### The canonical registry

All verbs in use across the codebase live in `lib/verb-patterns.ts`. Adding a new verb requires adding an entry to the registry first, with a description per Semantic Discipline (Principle 3 — human-readable enums):

```typescript
de_risks: {
  description: "ActionCard whose purpose is to de-risk an existing engaged Recommendation, typically by addressing a stated concern or providing supporting materials.",
  contexts: ["ActionCard → Recommendation"]
},
```

This is the same Two-File Rule discipline as `lib/relation-names.ts` — relationships and verbs both require a single source of truth.

### Verbs reuse identically across surfaces

Where a verb appears on multiple surfaces, it must be the same word, not an approximation. The verb `serves` appears in Open opportunities ("→ serves goal:"); if a Conversation served a goal, the Conversation entry uses `serves`, not `addresses` or `supports`. Approximate synonyms feel like freestyle writing; identical reuse feels canonical.

### Application surfaces (current implementation)

- **Open opportunities → Signals:** `serves goal`, `addresses blocker`, `responds to trigger`, `responds to indecision` — sorted goal → blocker → trigger → indecision.
- **ActionCard → linked entity:** `de-risks opportunity` (follow_up + linked Recommendation), `hands off to specialist` (handoff), `nurtures` (nurture).
- **Artifact share → Recommendation:** `supports opportunity`.
- **Conversation → downstream entity (selective):** `produced` (Conversation that originated a Recommendation), `captured` (Conversation that first surfaced a goal Signal), `introduced` (onboarding Conversation that originated the Member relationship). Routine conversations with no significant downstream entity get no verb line — skip rather than render an empty arrow.

### Anti-patterns

- Inventing a one-off verb for a single relationship without adding it to the registry. Stop and propose the addition first.
- Using a verb where the relationship is not actually canonical (e.g., adding `→ relates to:` as a generic catch-all). The system has named relationships; the verb registry should reflect them.
- Rendering a verb line where the linked entity is not identifiable — the line should always have a real target.

---

## 12. Progress visualization

Journey-state visualization renders on the Suggested Next Step card via the `<TrackProgressDots>` component (Sprint 2 §C). The pattern is **discrete dots only** — small, fixed-size markers on a thin connecting line, one dot per stage of the journey. No percentages, no bar fills, no gradient transitions; per Francisco's locked direction, "small dots. These should be clear and discrete, not a lot of ambiguity."

### Visual spec

- Dot size: 6px diameter for completed/upcoming; 8px ring (1.5px stroke) wrapping a 6px filled dot for the current stage. The ring lets the current stage read as visually distinct from completed without doubling the dot footprint and breaking the rhythm of the line.
- Dot fill colors: `--blaze-orange` (`#B45F26`) for completed and current; `--blaze-rule` (`#E8EAEC`) for upcoming.
- Connecting line: 1px in `--blaze-rule`, behind the dots (z-stacked below). Spans from first dot center to last dot center.
- Container width: each dot sits in a 16px-wide slot; for 6 stages the visualization is ~96px wide. Aligned to the upper-right of the Suggested Next Step card so it doesn't crowd the heading.
- Labels: 10px / 400 (or 500 for current stage) below each dot. Color follows state — charcoal for current, `--blaze-grey-body` for completed, `--blaze-grey-soft` for upcoming. The eye lands on completed/current first; upcoming labels are quietly present.

### Adaptive shape (hybrid model)

Stages 1..N are the actual GrowthSteps in the Member's Track (in order). Stages N+1 and N+2 are the post-Track lifecycle and **shape-dependent**:

- Resolve-ending track → `Decision pending` → `Funded`
- Connect-ending track → `Specialist engagement` → `Closed`

The visualization computes its stage count and labels from the Track's actual step sequence rather than forcing a standardized 6-stage model. A Track with 3 steps + 2 lifecycle stages renders 5 dots; a Track with 5 steps + 2 lifecycle stages renders 7 dots.

### Stage-state computation

Each stage carries one of three states:

| State | Color | Size | When |
|---|---|---|---|
| `completed` | orange | 6px | Track step has an execution; or `Recommendation.response = funded` for the terminal stage |
| `current` | orange + ring | 8px | Next stage demanding attention — typically the post-Track `pending` stage when an active engaged Recommendation exists, or the next un-executed Track step in a partial run |
| `upcoming` | light grey | 6px | Stages the journey hasn't reached |

The component never shows two `current` stages simultaneously; if a Track step is still in-flight (`current`), the post-Track pending stage demotes to `upcoming` to keep the journey reading as a single forward motion.

### When the card shows zero progress

When the Suggested Next Step card is in `run_track` mode (no active engaged Recommendation), all dots render as upcoming. This signals the journey-not-yet-started state truthfully — the card is suggesting a Track to run, not claiming progress that hasn't happened.

### Reference implementation

`app/members/jenny/track-progress-dots.tsx` — pure presentation component, takes a precomputed `TrackStage[]` array.

`lib/suggested-next-step.ts` — `computeTrackStages` and `computeTrackProgress` build the stages array from Track + Member data; the component renders.

---

## 13. Growth Conversations layout

The Growth Conversations module (Sprint 4) introduces a different page architecture from the Member profile: a single scrolling page with all journey stages visible at once, plus a sticky anchor progress bar in the right column for navigation.

### Two-column layout

- **Left column (~70% width)** — scrolling content. One section per stage of the Member's Track + post-Track lifecycle. Sections render top-to-bottom in stage order. Each section has a stable DOM `id` (e.g., `stage-ask-1`, `stage-show`, `stage-decision-pending`) that the right-column anchor bar targets.
- **Right column (~30% width)** — sticky anchor progress bar. Persists in view as the banker scrolls. Each entry shows the stage label + a state dot (mirroring the Member profile's TrackProgressDots discipline). Click scrolls the left column to that stage's anchor.
- **Below `lg` breakpoint:** the right column is hidden (mobile/tablet view); the page becomes single-column scrolling with no anchor bar. Sprint 4 Prompt 4.1b will revisit small-viewport behavior if needed.

### Stage section header

Every stage section opens with the same orange-rectangle-mark + label treatment as Member profile band headers:

```jsx
<div className="flex items-baseline justify-between gap-4">
  <div className="flex items-baseline">
    <span aria-hidden className="mr-3 inline-block h-6 w-[27px] bg-blaze-orange" />
    <span className="text-2xl font-semibold tracking-[0.02em] text-blaze-charcoal leading-none">
      Ask 1
    </span>
  </div>
  <span className="text-xs text-blaze-grey-body">Stage 1 of 6</span>
</div>
```

The stage counter on the right (`Stage N of M`) gives the banker explicit orientation without forcing them to count.

### Read-only vs capture-mode distinction (placeholder for Prompt 4.1b)

A stage section renders in one of two modes:

- **Read-only** — when a `GrowthStepExecution` exists for this stage. Renders a brief "Captured [date] · [step title]" line followed by a verb-prefix list of produced entities (`→ produced: Goal — …`, `→ produced: Recommendation — …`). No editing affordance in Prompt 4.1a; Sprint 4 Prompt 4.1b adds the "Update captures" affordance for the Ask stage.
- **Capture form** — when no execution exists yet. Prompt 4.1a renders only a placeholder dashed-border box stating which prompt will introduce the form. Prompt 4.1b ships the Ask form; later prompts ship Size, Show, Resolve, Connect.

Lifecycle stages (Decision pending, Funded, Specialist engagement, Closed) always render in a third mode — a forward-looking placeholder noting that the Member profile's Open opportunities band tracks the lifecycle status.

### Anchor progress bar

The right-column bar is a vertical list, NOT a horizontal pipe-separated label row (which is how Member profile's TrackProgressDots renders). The vertical orientation suits a tall scrolling page; the horizontal orientation on Member profile suits the compact card.

Each entry combines:

- 3px dot at the left (state-colored: orange / orange-ringed-current / grey-rule)
- Stage label (color follows state per the existing TrackProgressDots discipline; current stage is charcoal/medium)
- Active-view indicator: a 2px left border in `--blaze-orange-deep` on the entry corresponding to the section currently in view (computed via Intersection Observer)

The active-view indicator is a *separate concept* from the journey-state coloring. A `completed` stage that the banker is currently scrolled to renders with both: completed-state orange dot + active-view left border. A `current` stage scrolled past renders with the current-state orange ring (its journey state) but loses the active-view border.

### Scroll behavior

- Click on an anchor entry → smooth-scroll the left column to that section's `scroll-mt-24` target (24px breathing room above the section header).
- Active-view tracking via Intersection Observer with `rootMargin: -20% 0px -60% 0px` — a section is considered "in view" once its top has scrolled past the upper fifth of the viewport.

### Reference implementation

`app/growth-conversations/[memberId]/page.tsx` — server-rendered scrolling layout.
`app/growth-conversations/[memberId]/anchor-progress-bar.tsx` — client component with Intersection Observer.

### Completed-stage checkmark indicator

A small SVG checkmark sits in the right corner of each Track-step stage's section header alongside the `Stage N of M` counter when the stage has a captured GrowthStepExecution. Per Sprint 4 §4.1b A:

- Inline SVG (no icon library); 14×14px viewport.
- Burnished orange stroke (`#B45F26`), 2.25px stroke width, rounded line caps.
- Polyline points `3,8 7,12 13,4` produce a clean checkmark.
- Renders only for stages where `kind === "track_step"` AND `state === "completed"`. Lifecycle stages (`Decision pending`, `Funded`, `Specialist engagement`, `Closed`) never show the checkmark — their state is tracked by the Member profile's Open opportunities band, not by the section-header indicator.
- The right-column anchor progress bar deliberately **does not** show checkmarks. The dot-state pattern there is already authoritative; adding checkmarks would create visual redundancy.

### Member lookup action notifications

Each row in the Growth Conversations Member lookup carries an optional third line below the labeled-value metadata showing what's open for that Member:

```
4 active Signals · 1 open opportunity
```

Per Sprint 4 §4.1b B:

- Renders only when the Member has at least one active Signal OR one open opportunity. Members at zero on both omit the line entirely (rather than rendering "0 active Signals · 0 open opportunities" — that's noise).
- Same orange-link treatment as the Member profile sidebar nav-line — burnished orange (`--blaze-orange-deep`), `font-medium`, underline-offset-2, hover:underline.
- **Click navigates to the Member profile** (`/members/[slug]`), distinct from the row body's primary action (which navigates to Growth Conversations for that Member).
- Implementation pattern: a "stretched" absolute-positioned `<Link>` covers the row body for the primary action; the action notifications line stacks above (`z-10` + `pointer-events-auto`) so clicks on the orange text reach its own `<Link>` rather than the stretched primary link.

---

## 14. Breadcrumb navigation

A structured path indicator that sits below the gradient bar and above the page heading on Member profile and Growth Conversations routes. Replaces the ad hoc "← Back to Member profile" link from Sprint 4 Prompt 4.1a.

### Path structure

```
Member Signals  ›  [section]  ›  [current page]
```

- The leading `Member Signals` segment is the system brand and links to the home page (currently `/members/jenny` — the demo's home Member profile until a portfolio home page exists post-demo).
- Middle segments are clickable section markers (e.g., `Growth Conversations` linking to `/growth-conversations`).
- The terminal segment is the current page; rendered as plain text, not a link.

### Specific paths

| Route | Breadcrumb |
|---|---|
| `/members/[id]` | `Member Signals › [Member name]` |
| `/growth-conversations` | `Member Signals › Growth Conversations` |
| `/growth-conversations/[id]` | `Member Signals › Growth Conversations › [Member name]` |

### Visual treatment

- Clickable segments: `--blaze-orange-deep` (`#AD571C`), no underline by default, underline on hover, underline-offset-2.
- Current-page segment: `--blaze-charcoal` (`#1A1A1A`), `font-medium`, no link styling.
- Separators: right-chevron `›` character in `--blaze-grey-body` (`#4F5052`).
- Font size: 14px (smaller than body, larger than caption).
- Spacing: 8px between segments and chevrons (Tailwind `gap-x-2` on the `<ol>`).
- Rendered as a `<nav aria-label="Breadcrumb">` wrapping an `<ol>` for accessibility.

### Where the breadcrumb renders

- Below the gradient bar.
- Above the page heading (Member identity h1 on Member profile; "Select Member" h1 on GC standalone; Member identity block on GC prefilled).
- The `Logged in as [banker] · Primary banker` identity treatment stays on the right side of the gradient-bar header — that's separate from breadcrumb navigation; it's identity context.

### Reference implementation

`app/_components/breadcrumb.tsx` — pure presentation component, takes a `BreadcrumbSegment[]` array. Each segment is either `{ label, href }` (clickable) or `{ label, current: true }` (terminal).

---

## 14.5 Capture form pattern (Sprint 4 §4.1c)

The Ask form establishes the canonical capture pattern. Size, Show, Resolve, and Connect (Sprint 4 Prompt 4.2) replicate this shape. Get this right before scaling.

### Augmenting summary list

When the section has prior captures, render a summary list at the top — one row per captured Signal (or per other captured entity in the non-Ask phases). Each row shows:

- A small chevron toggle for expand/collapse
- The entity type (Goal / Blocker / Trigger / Indecision; uppercased + tracked) in muted grey
- The entity title (Topic display_name) in body charcoal
- The capture date in muted grey; with " · stale" suffix in italics when older than the staleness threshold (6 months for Sprint 4 §4.1c; configurable per phase)

Click a row → expands inline to show full detail with the four-tier display discipline (labeled values for descriptive captured fields; italic quote-attribution for verbatim member quotes; charcoal body for prose). The expanded detail surfaces an "Edit captures" affordance.

### Edit + supersession audit trail

Click "Edit captures" on an expanded row → the row converts into an inline editable sub-form pre-populated with current values. Save creates a NEW Signal record and sets the prior's `superseded_by_signal_id` + `superseded_at`. The prior row is retained immutably (audit trail); the active state shows the new row in its place.

This pattern is the demonstrable shape for "the system remembers what you said, and lets you update without losing history." Every capture form in Sprint 4 follows it.

### Add buttons

Below the summary list (or above an empty state), four (or context-appropriate fewer) `+ Add [Kind]` buttons sit in a horizontal row. Click → expand a fillable sub-form below for the chosen entity type. Sub-forms can stack — multiple captures in one save.

Button styling: `border border-blaze-rule bg-white px-3 py-1.5 text-xs font-medium text-blaze-orange-deep transition-colors hover:bg-blaze-cream`.

### Sub-form layout

Sub-forms render with a hairline `border border-blaze-rule` container, 16px padding, white background. Field labels in 12px muted grey; inputs styled to match the Member-lookup search input from Sprint 4 §4.1a (white background, hairline border, orange focus ring, charcoal text). Required fields marked with a small orange asterisk after the label. Top-right `× Remove` (or "Cancel edit" in edit mode) discards the sub-form's changes without affecting other pending or saved entries.

### Multi-input save

A single Save button at the bottom commits all pending sub-forms (new additions and any in-progress edit) atomically through a Server Action with `prisma.$transaction`. Validation runs on Save click; inline errors appear within the offending sub-form. After successful save, sub-forms collapse into the summary list with a brief inline success message.

### Stage state propagation

After save:
- The Server Action calls `revalidatePath` on both the Member profile route and the Growth Conversations route so the next render reflects the new state.
- The page re-renders; the section's checkmark indicator (per §13) appears if the stage now has captures; the anchor progress bar's stage state updates from `upcoming` → `current` (or `completed`); the Member profile's Active signals band reflects the new Signals.

### UI vocabulary mappings

For Ask form specifically, the form's banker-facing labels diverge from the persisted enum values. Mappings live in `ask-section.tsx`:

- **Severity labels per Signal type:** Goals show `peripheral / important / central`; Blockers and Indecisions show `manageable / painful / acute`; Triggers show `low / moderate / urgent`. All map to the schema enum values `manageable | painful | threatening`.
- **Recency labels:** `recent / ongoing / historical / anticipated` map to `recent | ongoing | chronic | hypothetical_future`.
- **Time horizon labels (Trigger only):** `imminent / 3-6 months / 6-12 months / 12-24 months / longer` map to `imminent | three_to_six_months | six_to_twelve_months | twelve_to_twenty_four_months | longer`. Triggers replace Timeframe with Time horizon — they are forward-looking events whose banker-facing question is "when will this hit?", not "how recently did this become observable?".
- **Source / Confidence labels:** `member stated / banker inferred / banker observed`. Both `banker inferred` and `banker observed` map to the schema enum value `banker_inferred` (the schema's `unclear` value is not surfaced in the Ask form).

Future capture forms should follow the same mapping discipline: render banker-facing prose; persist the canonical schema value.

### Per-type required-field discipline (Sprint 4 §4.1d)

The four Signal types share fields awkwardly. Capture forms enforce per-type required fields:

| Signal type | Required | Optional |
|---|---|---|
| Goal | Topic, Source, Impact, Timeframe | Direct quote, Magnitude trio |
| Blocker | Same as Goal | Same as Goal |
| Indecision | Topic, Source | Direct quote, Impact, Timeframe, Magnitude trio |
| Trigger | Topic, Source, Impact, **Time horizon** (replaces Timeframe) | Direct quote, Magnitude trio |

Visual treatment:
- Required fields show an orange asterisk after the label
- Optional fields drop the asterisk; the dropdown still defaults to "Select…" so the banker can choose to capture if the information is available
- For Trigger sub-forms, the Timeframe `<select>` is replaced with the Time horizon `<select>` bound to the `time_horizon` schema field
- Augmenting-summary expanded detail renders only the fields that were captured — Indecision rows that omit Impact / Timeframe show no placeholder, just Source (and any Magnitude / Direct quote actually provided)

Schema implications: `Signal.severity`, `Signal.recency`, and `Signal.time_horizon` are all nullable. Application-layer validation (both client-side `draftIsValid` and server-side `validateSignalDraft`) enforces per-type rules; the schema permits the flexibility, the application enforces the discipline.

This pattern lifts to the four remaining capture forms (Size, Show, Resolve, Connect) in Sprint 4 Prompt 4.2.

### Size capture form (Sprint 4 §4.2a)

Size is track-agnostic quantification — the banker captures the magnitude and scope of the opportunity surfaced from Ask Signals. The form replicates the AskSection shape with three differences:

1. **Single sub-form type.** Where Ask has Goal / Blocker / Trigger / Indecision sub-forms, Size has just one — every measurement carries the same field shape.
2. **Reference-table dropdown.** "Topic / dimension" pulls from the new `SizingDimension` reference table (parallel to Topic for Signal). Demo seeds 12 dimensions — slow-season revenue gap, declined work volume, capacity utilization rate, and so on. Each dimension carries a description per Semantic Discipline.
3. **Conditional Frequency.** Frequency is required only for rate-based units (`dollars`, `count`, `hours`); for `days`, `months`, `percentage`, the field is optional. The asterisk on the Frequency label shows or hides based on the selected Unit.

Augmenting summary, edit/supersession audit trail, stale-signal cue, save-via-Server-Action transaction, and `revalidatePath` propagation all follow the AskSection pattern. The collapsed measurement row title surfaces the dimension display name + magnitude/unit/frequency phrase ("$48,000 per quarter"), so a banker can read the captured fact without expanding.

Confidence stays optional in the demo — Q-036 in `OPEN_QUESTIONS.md` tracks "should this be required?" for revisit during Sprint 5 Insight Engine work, when correlation analytics may benefit from a confidence axis.

Reference implementation: `app/growth-conversations/[memberId]/size-section.tsx` (client component) + `saveSizeCaptures` server action in `app/growth-conversations/[memberId]/actions.ts`.

### Resolve capture form (Sprint 4 §4.2a)

Resolve is the closure capture for a Track. Unlike Ask / Size's multi-add pattern, Resolve is a **single-fieldset form** — one Member-response capture per session, with conditional sub-captures driven off the response value.

**View-mode vs edit-mode.** When the Track's Recommendation already carries a captured response (the demo's seeded state for Jenny + Northland), the section renders a summary view first: response chip, primary concern, direct quote (if any), open ActionCard (if any), and an "Edit captures" button. Click → toggles to edit-mode with the form pre-populated from the current Recommendation values.

**Conditional rendering** (driven by the Member response value):

| Response | Indecision sub-form | ActionCard sub-form | Closing notes |
|---|---|---|---|
| `committed` / `funded` | suppressed | suppressed | suppressed |
| `declined` / `dismissive` | hidden | hidden | optional textarea (saves to `Conversation.banker_note`) |
| `engaged` / `leaning_yes` | optional | **required** (description + owner + due date) | hidden |
| `neutral` / `leaning_no` / `skeptical` / `confused` | optional | optional | hidden |

Primary concern is required for nuanced responses (`skeptical / confused / leaning_no / declined / leaning_yes`); optional otherwise (`neutral / engaged / committed / funded / dismissive`).

**Cross-table transaction.** Resolve's save is the most complex transaction in Sprint 4. `saveResolveCaptures` opens a single `prisma.$transaction` and writes (or updates) up to four tables atomically: `Conversation`, `GrowthStepExecution`, `Recommendation`, `Signal`, `ActionCard`. Order of operations + rollback discipline are documented in the action's docblock (`app/growth-conversations/[memberId]/actions.ts`); the rule is: every dependent row references one already created in this transaction, so failure at any step cleanly reverts the whole capture.

**Track-aware.** Resolve requires the Track's Resolve step id (`growth_step_id`, NOT null), unlike Ask + Size which are track-agnostic. Cygnus's Connect-ending Track has no Resolve step, so ResolveSection is correctly suppressed there. Jenny + Northland's Tracks both end with Resolve and render the form.

**Indecision sub-form.** The optional indecision capture creates a `Signal` with `type = "indecision"` linked to the new GrowthStepExecution. Topic dropdown filters to `topic_type = "indecision"` from the existing Topic table. `severity / recency / time_horizon` are left null per Sprint 4 §4.1d Block C's per-type field discipline.

**ActionCard creation.** When ActionCard is captured, a new row is created with `type = "follow_up"` (demo default), `status = "open"`, `origin_conversation_id` + `origin_growth_step_execution_id` pointing to this Resolve session. Owner defaults to the current banker (Member's `primary_banker`); cross-banker handoff is supported via the dropdown — relevant for Cygnus's Marcus Webb scenario in pilot (Q-037 logs the default-to-`Recommendation.owned_by` question for revisit).

**Closing notes** for `declined / dismissive` responses save to `Conversation.banker_note` rather than creating an ActionCard — `ActionCard.due_at` is NOT NULL and closing notes have no due date by definition. This keeps the audit trail clean: the closure context lives on the Conversation row that captured it.

**Customer response field** (Sprint 4 §4.2a refinement #1) — a textarea labeled "Customer response" with helper sub-line *"What factor caused this decision?"*. Captures the *reason* for the Member's decision (e.g., *"I hadn't realized the line of credit could absorb my whole slow season"*), not their emotional reaction. Never pre-populates from prior captures; always starts empty so each save reflects a fresh decision rationale. Applies across all Member response states.

**Contextual Primary concern** (Sprint 4 §4.2a refinement #3) — the Primary concern dropdown's option set + field label switch on Member response value:

| Response context | Field label | Option set |
|---|---|---|
| `engaged / leaning_yes / neutral / leaning_no / skeptical / confused` | "Primary concern" | open-thread reasons |
| `declined / dismissive` | "Decline reason" | decline-reason set |
| `committed / funded` | "Primary concern" | open-thread reasons (vestigial; Member has decided) |
| (no response picked yet) | hidden | n/a |

**Open-thread option set** (the *what's-holding-them-back* cluster):

`Rate · Speed · Commitment level · Spouse · CPA / accountant · Partner · Timing · Bank capability · Other · (none)`

**Decline-reason option set** (the *why-they-said-no* cluster):

`Rate too high · Terms unfavorable · Going with competitor · No longer needed · Timing wrong · Doesn't qualify (DTI / credit / collateral) · Doesn't trust the institution · Lost interest · Found alternative funding source · Business circumstances changed · Other`

Some enum values appear in both sets with different banker-facing labels: `rate` is "Rate" in open-thread context but "Rate too high" in decline-reason context; `timing` is "Timing" vs "Timing wrong"; `bank_capability` is "Bank capability" vs "Doesn't trust the institution". The schema's `RecommendationPrimaryConcern` enum carries both clusters; the form's contextual label resolution sits in `app/growth-conversations/[memberId]/resolve-section.tsx`. Insight Engine analytics keying on the raw enum value see consistent identity across contexts; the contextual label is purely a banker-facing rendering choice.

Pilot phase may lift the option sets to a controlled-vocabulary table (parallel to `SizingDimension` for measurements) if banking-product-specific reason taxonomies are needed.

**Visual distinction `committed` vs `funded`** (Sprint 4 §4.2a refinement #2) — when a Resolve-ending Track's Recommendation is `committed` (Member said yes, but loan is in underwriting / closing / disbursement), the terminal lifecycle dot reads "Closing" instead of "Funded". Once the loan funds, the label flips back to "Funded" with the dot in completed (orange-filled) state. The canonical underlying label stays "Funded" so URL anchors (`#stage-funded`) remain stable; the swap is purely a `displayLabel` override. Connect-ending Tracks keep their "Closed" label across states — for that path, the dot's current/orange-ringed treatment already conveys "closure is in progress."

Reference implementation: `app/growth-conversations/[memberId]/resolve-section.tsx` (client component) + `saveResolveCaptures` server action in `app/growth-conversations/[memberId]/actions.ts`.

---

## 14.7 Macro context banner (Sprint 4 §4.1d)

When a Member's `member_type_id` matches a current Macro's `affected_member_types`, the Member profile renders a Macro context banner at the top of the page. Macros are top-down system-level entities (per `INSIGHT_ENGINE_DESIGN_NOTES.md` §3 and §5) describing market, regulatory, sector, or technology developments that should color the conversation a banker walks into.

### Positioning

The banner is the first content element below the page header (which carries the brand wordmark, identity treatment, and breadcrumb). It sits **above** the Suggested next step card; the existing band order becomes:

1. Macro context banner (when applicable)
2. Suggested next step
3. Open opportunities
4. Active signals
5. History

If no Macro matches the Member's Member Type, the banner is suppressed silently — no empty placeholder.

### Visual treatment

- **Background:** subtle cream tint (`bg-blaze-cream/40`) — distinguishes the banner from the page ground without competing for attention. Reads as a notification, not a content band.
- **Borders:** hairline `border-y border-blaze-rule` (1px top + bottom) spans the page width.
- **Width:** full-page horizontal band; internal content constrained by `max-w-6xl` to align with the page grid.
- **Padding:** moderately tight (`px-8 py-5`) — the banner is a notification, not a content band.
- **Section mark:** smaller orange rectangle (~14px wide × 14px tall, `h-3.5 w-[16px] bg-blaze-orange`). Section marks on the page proper are 24px; the banner's smaller mark signals a different register.
- **Title:** burnished orange-deep, semibold, ~15-16px. Format: `Macro context · {macro.title}`.
- **Curator attribution:** muted grey, regular weight, ~12px. Format: `Authored by {label} on {date}`.
- **Summary:** body charcoal, ~14px, comfortable line-height.
- **Recommended response:** body charcoal with the prefix `Recommended response:` rendered in `font-medium`. The recommended response is what bankers should do with the macro information — not just learn it.
- **View context link:** bottom-right, orange-deep, `underline-offset-2 hover:underline`. Currently `href="#"`; Sprint 5 will route to the Macro view in the Insight Engine.
- **Dismiss affordance:** upper-right, small grey × Dismiss text button. Hover transitions to charcoal.

### Dismissibility

Session-scoped only for the demo. The banner uses local React state (`useState<dismissed>`); refreshing the page brings it back. Persistent dismissal (per-banker preferences, automatic dismissal when `effective_period_end` passes) is post-demo work — see `OPEN_QUESTIONS.md` Q-032.

### Specificity rule

Each Member sees ONE banner at a time — the most recently authored Macro whose `affected_member_types` matches. For the demo each Member matches exactly one Macro, so the precedence rule doesn't surface a real ranking decision yet. Documented for Sprint 5 when the Insight Engine surfaces multiple concurrent Macros.

### Reference implementation

`app/members/[id]/macro-context-banner.tsx` (client component) + Macro fetch logic in `app/members/[id]/page.tsx` (server-side query + filter, then `<MacroContextBanner macro={macroBanner} />` rendered above the main grid when `macroBanner` is non-null).

---

## 14.8 Stage guidance scaffolding (Sprint 4 §4.2a)

Each stage section on the Growth Conversations page renders a short guidance paragraph — Member-Type-aware copy that explains what the phase is *for*. The pattern answers a 4.1d review observation: "Ask implies questions, but what's being asked?"

### Where it renders

Directly below the stage section header (orange mark + label + "Stage N of M" counter), above any capture form, augmenting summary, or read-only summary.

For Track-step stages (Ask, Size, Show, Resolve, Connect), guidance renders as a standalone paragraph. For lifecycle stages (Decision pending, Funded, Specialist engagement, Closed), the guidance content goes inside the existing dashed-border placeholder rather than appearing as a separate paragraph above it — the dashed-border treatment continues to signal "this isn't an active capture surface, it's a status reflection."

Guidance renders in both states: empty (no prior captures yet) and augmenting summary (prior captures exist). It's primary instructional content; it stays visible once you've started capturing.

### Visual treatment

- Body text size (14px), regular weight, leading-relaxed (~1.6 line-height)
- Color: `text-blaze-grey-body` — slightly muted relative to body charcoal, distinguishing guidance as scaffolding rather than primary content
- Width: capped at `max-w-3xl` so long paragraphs don't run the full column width and become hard to scan
- Single paragraph; no internal line breaks; ~25-50 words
- Non-italic — italic is reserved for direct quotes (3px orange line + grey-body italic) and stale-signal date suffixes
- Vertical rhythm: 12px (`mt-3`) below the stage header; the existing 20px (`mt-5`) below kicks in to separate guidance from capture content

For lifecycle stages, the dashed-border placeholder uses the same body text size and grey-body color, with the stage label rendered in `font-medium text-blaze-charcoal` followed by an em-dash and the guidance text inline.

### Architecture

Guidance lives in `lib/stage-guidance.ts` as a lookup function `getStageGuidance(memberTypeName, stepPhase, stageLabel)`. The lookup is reference data — it lives in code, not in the database, and can be updated without a schema migration. Keying:

- **Member Type name** (e.g., `"Small Caterer · Starting"`) — matches the seeded `MemberType.name` exactly
- **Step phase** (`ask | size | show | propose | resolve | connect | decision_pending | funded | specialist_engagement | closed`)
- **Stage label** — disambiguates Cygnus's two Ask stages (`"Ask 1"` → `ask:1` key; `"Ask 2"` → `ask:2` key)

Fallbacks: when a (Member Type, phase) tuple isn't authored, the lookup returns a generic phase-only paragraph so the page is always coherent. This also handles the "no Track yet" edge case.

### Authoring philosophy

Guidance is conversational scaffolding, not a script. It tells the banker what the phase is trying to surface or produce, framed in terms specific to that Member's industry and growth stage. It does not prescribe the literal questions a banker should ask — Topic-level example phrasings are a Pilot-phase concern (logged as Q-035 in `OPEN_QUESTIONS.md`).

When the EVP demo lands on an Ask section reading *"Establish the rhythm of cashflow and surface seasonal pressures driving working capital needs"*, the message is: this system teaches what to do, not just records what was done. That's the difference between a CRM and an enablement layer.

### Reference implementation

`lib/stage-guidance.ts` (the lookup) + `app/growth-conversations/[memberId]/page.tsx` (calls `getStageGuidance(member.member_type.name, stepPhase, stage.label)` per stage section, renders the paragraph for Track-step stages and routes the text into `StagePlaceholder` for lifecycle stages).

---

## 15. Imagery and photography

The source deck uses **architectural photography** (clean modern interiors, warm wood, natural light) and **portrait photography** (real-feeling people, often in burgundy/maroon clothing that complements the burnished orange palette).

For the demo:

- **Avatar placeholders:** Use initials on warm parchment circles with `--blaze-orange-deep` text, not generic blue avatars.
- **Hero imagery:** If the demo includes hero photography, prefer warm-toned interior shots over cold tech-stock images.
- **Empty states:** Use simple line illustrations in `--blaze-grey-soft`, not 3D illustrations. Sparse, architectural, calm.

---

## 16. Tailwind configuration

To make these tokens easy to use in code, extend the Tailwind theme. Add this to `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        blaze: {
          orange: {
            DEFAULT: '#B45F26',
            bright: '#BC5D1D',
            deep: '#AD571C',
            burnt: '#8E3F0E',
            pale: '#F2D9C2',
          },
          grey: {
            dark: '#2B2B29',
            darker: '#262626',
            body: '#4F5052',
            mid: '#636468',
            soft: '#888780',
          },
          cream: '#F5EFE5',
          parchment: '#E8E0D4',
          dust: '#D7D3D0',
          white: '#FEFFFF',
          success: '#5C7A3F',
          warning: '#B47424',
          danger: '#9C3325',
          info: '#3D5A6C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'blaze-gradient': 'linear-gradient(to right, #000000 0%, #291305 18%, #441F05 32%, #6C300B 48%, #B45F26 70%, #BC5D1D 78%, #2B2B29 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
```

After this, you can write `bg-blaze-orange` instead of `bg-[#B45F26]` everywhere — much cleaner.

### 16.1 CSS variables (for use outside Tailwind)

Also expose the palette as CSS variables in `globals.css`:

```css
:root {
  /* Burnished orange */
  --blaze-orange: #B45F26;
  --blaze-orange-bright: #BC5D1D;
  --blaze-orange-deep: #AD571C;
  --blaze-orange-burnt: #8E3F0E;
  --blaze-orange-pale: #F2D9C2;

  /* Deep warm grey */
  --blaze-grey-dark: #2B2B29;
  --blaze-grey-darker: #262626;
  --blaze-grey-body: #4F5052;
  --blaze-grey-mid: #636468;
  --blaze-grey-soft: #888780;

  /* Warm parchment */
  --blaze-cream: #F5EFE5;
  --blaze-parchment: #E8E0D4;
  --blaze-dust: #D7D3D0;
  --blaze-white: #FEFFFF;

  /* Functional */
  --blaze-success: #5C7A3F;
  --blaze-warning: #B47424;
  --blaze-danger: #9C3325;
  --blaze-info: #3D5A6C;
}
```

---

## 17. shadcn/ui theme override

The Mira shadcn preset uses Inter and provides reasonable defaults. Override the color tokens in `components.json` (or wherever the shadcn theme is stored) to map to Blaze:

```json
{
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

In `globals.css`, override the shadcn semantic tokens:

```css
:root {
  --background: 0 0% 100%;       /* white */
  --foreground: 60 3% 16%;       /* blaze-grey-darker */
  --primary: 21 64% 43%;         /* blaze-orange */
  --primary-foreground: 0 0% 100%;
  --secondary: 36 41% 92%;       /* blaze-cream */
  --secondary-foreground: 60 3% 16%;
  --muted: 36 22% 87%;           /* blaze-parchment */
  --muted-foreground: 50 4% 51%; /* blaze-grey-soft */
  --accent: 21 64% 43%;          /* blaze-orange */
  --accent-foreground: 0 0% 100%;
  --destructive: 7 60% 38%;      /* blaze-danger */
  --destructive-foreground: 0 0% 100%;
  --border: 50 4% 51%;           /* blaze-grey-soft */
  --input: 50 4% 51%;
  --ring: 21 64% 43%;            /* blaze-orange */
  --radius: 0.5rem;
}
```

After this, all shadcn components automatically use the Blaze palette without further customization.

---

## 18. What to avoid

These are anti-patterns that would break the visual identity. Do not introduce them.

- **Bright modern blue (#0066FF, #1E90FF, etc.)** — generic SaaS look, fights the warmth of the palette.
- **Cool greys (#1F2937, #374151, etc.)** — has blue cast, doesn't match Blaze's warm grey.
- **Bright pure white (#FFFFFF)** — slightly cooler than `#FEFFFF`; the latter has imperceptible warmth that matters at scale.
- **Drop shadows on default state** — the deck achieves elevation through borders and color, not shadows.
- **Multiple gradients** — the signature gradient is one gradient. Adding more dilutes it.
- **Pure black (#000000)** — except as a stop in the signature gradient. Body text uses `--blaze-grey-darker` (`#262626`).
- **Bright neon accent colors** — anything more saturated than the burnished orange will feel jarring.
- **Sans-serif fonts other than Inter** — Helvetica feels cold, Roboto feels generic, Open Sans feels indistinct. Inter is the locked choice.
- **Border-radius beyond 16px** — except for fully circular elements (avatars). Soft corners, not pillowy.
- **Center-aligned body text** — banker tools should be left-aligned for scannability. Center alignment only for headlines on hero sections.

---

## 19. Quick reference card

For day-to-day use, three things to remember:

1. **Burnished orange (`#B45F26`) is accent only — never flood color.** Header strips, CTAs, focus states.
2. **Deep warm grey (`#2B2B29`) and warm parchment (`#F5EFE5`) carry the structural weight.** Most surfaces are these.
3. **The orange-headed panel pattern is the default component.** When in doubt, that's the layout.

If a UI decision isn't covered by this guide, default to:
- Inter for typography
- 8px corner radius
- 0.5px borders in warm grey
- White surfaces with parchment hover lifts
- Burnished orange for one primary action per screen

---

## 20. Verifying against the source

When in doubt, the source PDF (`docs/design/Improving_Lives_and_Deepening_Lifetime_Value.pdf` — if available; otherwise reference Francisco's brief in conversation) is the authoritative visual reference. Specific pages worth bookmarking:

- **Page 1 (cover):** the gradient banner, the orange-on-dark wordmark
- **Page 8 (action cards):** the orange-headed panel pattern, numbered cards
- **Page 9 (Insight Engine mockup):** the closest reference to actual app UI
- **Page 12 (Local businesses):** the semi-transparent panel pattern on photography

When this style guide and the source PDF disagree, the PDF wins. Update the style guide to reflect the source.
