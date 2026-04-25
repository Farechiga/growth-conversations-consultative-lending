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

## 4. The dominant component pattern — orange-headed panel

This is the pattern that appears most often in the source deck. Every product card, every action item, every structured information block follows this shape.

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

## 11. Imagery and photography

The source deck uses **architectural photography** (clean modern interiors, warm wood, natural light) and **portrait photography** (real-feeling people, often in burgundy/maroon clothing that complements the burnished orange palette).

For the demo:

- **Avatar placeholders:** Use initials on warm parchment circles with `--blaze-orange-deep` text, not generic blue avatars.
- **Hero imagery:** If the demo includes hero photography, prefer warm-toned interior shots over cold tech-stock images.
- **Empty states:** Use simple line illustrations in `--blaze-grey-soft`, not 3D illustrations. Sparse, architectural, calm.

---

## 12. Tailwind configuration

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

### 12.1 CSS variables (for use outside Tailwind)

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

## 13. shadcn/ui theme override

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

## 14. What to avoid

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

## 15. Quick reference card

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

## 16. Verifying against the source

When in doubt, the source PDF (`docs/design/Improving_Lives_and_Deepening_Lifetime_Value.pdf` — if available; otherwise reference Francisco's brief in conversation) is the authoritative visual reference. Specific pages worth bookmarking:

- **Page 1 (cover):** the gradient banner, the orange-on-dark wordmark
- **Page 8 (action cards):** the orange-headed panel pattern, numbered cards
- **Page 9 (Insight Engine mockup):** the closest reference to actual app UI
- **Page 12 (Local businesses):** the semi-transparent panel pattern on photography

When this style guide and the source PDF disagree, the PDF wins. Update the style guide to reflect the source.
