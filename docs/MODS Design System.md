# MODS Design System

MODS is a Tailwind v4 CSS-first design system starter. Every project built on MODS begins with this repo and overrides the CSS variables for its own brand. The architecture is consistent across all token types: a two-tier model where **Base variables** are the raw scale vocabulary and the **Semantic layer** is the application layer.

---

## Architecture: The Two-Tier Model

The same pattern governs every part of the system.

| | Base variables — Raw Scale | Semantic Layer |
|---|---|---|
| **Colour** | `p10`–`p100`, `s10`–`s100`, `n10`–`n100` | `--brand-main`, `--text-color`, `--surfaces-base` |
| **Typography size** | `f1`–`f15` | `.h1`, `.body-m`, `.label-m` |
| **Typography leading** | `lb1`–`lb8`, `lt1`–`lt15`, `ld6`–`ld15` | baked into Semantic component classes |
| **Elevation** | `level0`–`level5`, `shadow-level1`–`shadow-level5` | component classes (to be defined per project) |
| **Spacing** | `g0`–`g25` + half-steps | `p-g3`, `gap-g2`, `.gap-default` |
| **Shape** | `sh8`–`sh72`, `sh-full` | `--shape-xs`–`--shape-xxl`, `--shape-full`, `--shape-control` |

Base variables live in `src/_theme.css`, `src/_base-palette.css`, and `src/_base-vars.css`.  
The Semantic layer lives in `src/_semantic-tokens.css` (colour, shape) and `src/_components.css` (everything else).

---

## File Structure

```
src/
  style.css               ← Entry point. @import "tailwindcss" + all partials.
  _theme.css              ← @theme block: all Base design tokens
  _base-palette.css       ← :root CSS vars: p10–p100, s10–s100, n10–n100
  _base-vars.css          ← :root CSS vars: alphas, border widths, shape raw scale
  _semantic-tokens.css    ← :root CSS vars: brand, surfaces, actions, text, borders, shadows
  _fonts.css              ← Google Fonts import + font role CSS variables
  _components.css         ← @layer components: all Semantic utility classes
dist/
  style.css               ← Compiled output (gitignored per project)
docs/
  MODS Design System.md   ← This file
```

`tailwind.config.js` does not exist in v4. All configuration is CSS-first.

---

## Colour System

### Base variables — Palettes

Three full palettes in the starter, each with 10 steps. Stored as raw RGB channel values (no `rgb()` wrapper) so alpha can be applied at point of use via `rgb(var(--p40) / 0.87)`.

Steps run `10, 20, 30, 40, 50, 60, 70, 80, 90, 100` where 10 is lightest and 100 is darkest.

> **Generate palettes using Google's official Material Theme Builder Figma plugin.** The plugin produces a full tonal palette in the HCT colour space for any source hue. The step numbers map directly — `p10` is tone 10 of the primary palette from the plugin, `p40` is tone 40, and so on. Copy the HEX values from the plugin, convert to RGB channels, and drop them into `_base-palette.css`. Do not use HSB or HSL to hand-pick the steps — those colour spaces are perceptually uneven and will produce mismatched contrast ratios across hues.

Additional accent palettes (`a10`–`a100`, `b10`–`b100` etc.) can be added per project but are not part of the starter.

**Meaning colours** (error, alert, success) are not full 10-step palettes. They are two fixed values per meaning: a light-mode tone and a dark-mode tone, named by hue and step — `r30`/`r70`, `y30`/`y70`, `g30`/`g70`. The semantic token `--meaning-error` resolves to `r30` in light mode and `r70` in dark mode via the theme CSS variable swap.

```css
/* src/_base-palette.css */
:root {
  /* Primary — replace from Figma */
  --p10: 240 240 240; /* placeholder */
  --p20: 220 220 220;
  --p30: 200 200 200;
  --p40: 180 180 180;
  --p50: 150 150 150;
  --p60: 120 120 120;
  --p70: 90  90  90;
  --p80: 60  60  60;
  --p90: 30  30  30;
  --p100: 10  10  10;

  /* Secondary — replace from Figma */
  --s10: 240 240 240;
  --s20: 220 220 220;
  /* ...s30 through s100 */

  /* Neutral — replace from Figma */
  --n10: 245 245 245;
  --n20: 230 230 230;
  /* ...n30 through n100 */

  /* Meaning — two fixed tones per meaning (not full palettes) */
  /* r = red/error, y = yellow/alert, g = green/success */
  /* 30 = light mode tone, 70 = dark mode tone — replace from Figma */
  --r30: 220 80  80;  /* error light */
  --r70: 255 140 140; /* error dark  */
  --y30: 180 140 20;  /* alert light */
  --y70: 255 210 80;  /* alert dark  */
  --g30: 40  140 80;  /* success light */
  --g70: 100 220 140; /* success dark  */
}
```

### Semantic tokens

Semantic tokens map base palette steps to named roles. These are what Tailwind utilities reference.

Each token that carries an alpha value uses a separate colour var (raw RGB channels) and an alpha var, composed at point of use:

```css
color: rgb(var(--text-high) / var(--text-alpha-high));
```

`max`-level tokens are always fully opaque and have no alpha var.

The alpha values follow the Material Design emphasis scale and are rarely overridden per project because the MD contrast system maintains readability when swapping hues.

#### Base alpha variables

```css
/* Defined in _base-vars.css */

/* Text alphas — light and dark tuned independently; aliases switch in .dark {} */
--text-light-alpha-max:    1;
--text-light-alpha-high:   0.89;
--text-light-alpha-medium: 0.60;
--text-light-alpha-low:    0.38;
--text-light-alpha-accent: 0.85;

--text-dark-alpha-max:    1;
--text-dark-alpha-high:   0.96;
--text-dark-alpha-medium: 0.77;
--text-dark-alpha-low:    0.59;
--text-dark-alpha-accent: 0.95;

/* Active aliases live in _semantic-tokens.css — switch between light/dark in .dark {} */
--text-alpha-max:    var(--text-light-alpha-max);
--text-alpha-high:   var(--text-light-alpha-high);
--text-alpha-medium: var(--text-light-alpha-medium);
--text-alpha-low:    var(--text-light-alpha-low);
--text-alpha-accent: var(--text-light-alpha-accent);

/* Border alphas — mode-independent, defined in _base-vars.css */
--border-alpha-high:   0.87;
--border-alpha-medium: 0.38;
--border-alpha-low:    0.12;
--border-alpha-focus:  1;

/* Action alphas — actions are always solid fills, no alpha vars needed */
```

#### Colour semantic tokens

All mode-switching tokens follow **Pattern 1**:
1. Named base vars `--{cat}-light-{prop}` / `--{cat}-dark-{prop}` in `:root` hold the raw palette step.
2. Active aliases `--{cat}-{prop}` point to the light set by default.
3. `.dark {}` re-points aliases to the dark set — `.dark {}` is never written programmatically.

```css
/* src/_semantic-tokens.css */
:root {

  /* ---- Brand ---- */
  --brand-main: var(--p30);  /* mode-independent — same step in both modes */

  /* ---- Surfaces ---- */
  /* Base — light mode */
  --surfaces-light-base:   var(--s98);
  --surfaces-light-l1:     var(--s99);
  --surfaces-light-l2:     var(--s100);
  --surfaces-light-l2a:    var(--s100);
  --surfaces-light-l3:     var(--s100);
  --surfaces-light-l4:     var(--s100);
  --surfaces-light-l5:     var(--s100);
  --surfaces-light-invert: var(--s5);

  /* Base — dark mode */
  --surfaces-dark-base:   var(--s5);
  --surfaces-dark-l1:     var(--s5);
  --surfaces-dark-l2:     var(--s7);
  --surfaces-dark-l2a:    var(--s9);
  --surfaces-dark-l3:     var(--s11);
  --surfaces-dark-l4:     var(--s13);
  --surfaces-dark-l5:     var(--s15);
  --surfaces-dark-invert: var(--s98);

  /* Active aliases */
  --surfaces-base:   var(--surfaces-light-base);
  --surfaces-l1:     var(--surfaces-light-l1);
  --surfaces-l2:     var(--surfaces-light-l2);
  --surfaces-l2a:    var(--surfaces-light-l2a);  /* alternate l2 — slightly more contrast */
  --surfaces-l3:     var(--surfaces-light-l3);
  --surfaces-l4:     var(--surfaces-light-l4);
  --surfaces-l5:     var(--surfaces-light-l5);
  --surfaces-invert: var(--surfaces-light-invert);
  --shadow-color:    var(--p30);  /* set via dropdown — light mode only; no shadows in dark mode */
  /* --surfaces-alpha (0.96) and --surfaces-blur (12px) live in _base-vars.css */

  /* ---- Text ---- */
  /* Single colour alias per context + a shared alpha scale applied at point of use:
       color: rgb(var(--text-color) / var(--text-alpha-high)); */

  /* Base — light mode */
  --text-light-color:         var(--s10);
  --text-light-accent:        var(--p35);
  --text-light-invert-color:  var(--s95);
  --text-light-invert-accent: var(--p80);

  /* Base — dark mode */
  --text-dark-color:         var(--s95);
  --text-dark-accent:        var(--p80);
  --text-dark-invert-color:  var(--s10);
  --text-dark-invert-accent: var(--p35);

  /* Active aliases */
  --text-color:         var(--text-light-color);
  --text-accent:        var(--text-light-accent);
  --text-invert-color:  var(--text-light-invert-color);
  --text-invert-accent: var(--text-light-invert-accent);

  /* Alpha aliases — raw values in _base-vars.css; switch in .dark {} */
  --text-alpha-max:    var(--text-light-alpha-max);
  --text-alpha-high:   var(--text-light-alpha-high);
  --text-alpha-medium: var(--text-light-alpha-medium);
  --text-alpha-low:    var(--text-light-alpha-low);
  --text-alpha-accent: var(--text-light-alpha-accent);

  /* ---- Borders ---- */
  /* Base — light mode */
  --border-light-color: var(--n90);
  --border-light-focus: var(--p50);

  /* Base — dark mode */
  --border-dark-color: var(--n10);
  --border-dark-focus: var(--p30);

  /* Active aliases */
  --border-color: var(--border-light-color);
  --border-focus: var(--border-light-focus);
  /* Alpha + width scales live in _base-vars.css */

  /* ---- Actions ---- */
  /* All action colours are solid fills — no opacity.
     primary = brand-coloured interactive elements
     secondary = subtle background for hover/pressed states
     neutral = non-brand elements (toggles, unselected tabs) */

  /* Base — light mode */
  --action-light-primary-default:   var(--p40);
  --action-light-primary-hover:     var(--p50);
  --action-light-primary-disabled:  var(--s70);
  --action-light-secondary-default: var(--p80);
  --action-light-secondary-hover:   var(--p90);
  --action-light-secondary-pressed: var(--p80);
  --action-light-neutral-default:   var(--n70);
  --action-light-neutral-disabled:  var(--n50);
  --action-light-neutral-filled:    var(--n40);

  /* Base — dark mode */
  --action-dark-primary-default:   var(--p80);
  --action-dark-primary-hover:     var(--p70);
  --action-dark-primary-disabled:  var(--s30);
  --action-dark-secondary-default: var(--p40);
  --action-dark-secondary-hover:   var(--p30);
  --action-dark-secondary-pressed: var(--p50);
  --action-dark-neutral-default:   var(--n60);
  --action-dark-neutral-disabled:  var(--n70);
  --action-dark-neutral-filled:    var(--n80);

  /* Active aliases */
  --action-primary-default:   var(--action-light-primary-default);
  --action-primary-hover:     var(--action-light-primary-hover);
  --action-primary-pressed:   var(--p60);                            /* mode-independent */
  --action-primary-disabled:  var(--action-light-primary-disabled);
  --action-secondary-default: var(--action-light-secondary-default);
  --action-secondary-hover:   var(--action-light-secondary-hover);
  --action-secondary-pressed: var(--action-light-secondary-pressed);
  --action-neutral-default:   var(--action-light-neutral-default);
  --action-neutral-disabled:  var(--action-light-neutral-disabled);
  --action-neutral-filled:    var(--action-light-neutral-filled);

  /* ---- Meaning ---- */
  /* Base — light mode */
  --meaning-light-error:   var(--r30);
  --meaning-light-alert:   var(--y30);
  --meaning-light-success: var(--g30);

  /* Base — dark mode */
  --meaning-dark-error:   var(--r70);
  --meaning-dark-alert:   var(--y70);
  --meaning-dark-success: var(--g70);

  /* Active aliases */
  --meaning-error:   var(--meaning-light-error);
  --meaning-alert:   var(--meaning-light-alert);
  --meaning-success: var(--meaning-light-success);

  /* ---- Information Visualisation ---- */
  /* 9 chart colours. Applied at 81% opacity: rgb(var(--chart-1) / var(--chart-alpha))
     Replace from Figma per project. */
  --chart-1:     255 99  132;
  --chart-2:     255 159 64;
  --chart-3:     205 220 57;
  --chart-4:     75  192 192;
  --chart-5:     54  162 235;
  --chart-6:     153 102 255;
  --chart-7:     255 206 86;
  --chart-8:     231 233 237;
  --chart-9:     100 181 246;
  --chart-alpha: 0.81;
}
```

#### Text token usage summary

Text uses a single colour alias per context (`--text-color`, `--text-accent`, `--text-invert-color`, `--text-invert-accent`) combined with a shared alpha scale: `rgb(var(--text-color) / var(--text-alpha-high))`.

| Emphasis | Colour var | Alpha var | Light | Dark |
|---|---|---|---|---|
| Max (icons, highest contrast) | `--text-color` | `--text-alpha-max` | 1.0 | 1.0 |
| High (headings) | `--text-color` | `--text-alpha-high` | 0.89 | 0.96 |
| Medium (body copy) | `--text-color` | `--text-alpha-medium` | 0.60 | 0.77 |
| Low (disabled, placeholders) | `--text-color` | `--text-alpha-low` | 0.38 | 0.59 |
| Accent (links, highlights) | `--text-accent` | `--text-alpha-accent` | 0.85 | 0.95 |
| On inverted surfaces | `--text-invert-color` / `--text-invert-accent` | same alpha scale | — | — |

#### Border token usage summary

Borders use a single colour alias `--border-color` (mode-adaptive) combined with a per-role alpha. Focus uses `--border-focus`, a separate brand colour.

| Emphasis | Colour var | Alpha var | Alpha |
|---|---|---|---|
| Strong dividers, selected borders | `--border-color` | `--border-alpha-high` | 0.87 |
| Default input borders, card outlines | `--border-color` | `--border-alpha-medium` | 0.38 |
| Subtle dividers | `--border-color` | `--border-alpha-low` | 0.12 |
| Focused inputs, active selection | `--border-focus` | `--border-alpha-focus` | 1.0 |

Usage in Tailwind: `bg-brand-main`, `text-high`, `border-medium`, `bg-level2`, `bg-meaning-success`.

#### Action token usage summary

All action colours are **solid fills — no opacity**. Hover and pressed states step progressively from the default. This ensures elements behind them cannot bleed through.

| Token | States | Usage |
|---|---|---|
| `action-primary-*` | default / hover / pressed / disabled | Buttons, checkboxes, dropdowns, progress bars |
| `action-secondary-*` | default / hover / pressed | Secondary button fills, ghost button active states |
| `action-neutral-*` | default / disabled / filled | Inactive toggles, unselected tabs, neutral state fills |

#### Meaning token usage summary

Two tones exist per meaning: `30` (light mode) and `70` (dark mode). The single semantic token swaps its underlying var at theme change — no markup changes needed.

| Token | Light (30) | Dark (70) | Usage |
|---|---|---|---|
| `meaning-error` | r30 (muted red) | r70 (bright red) | Errors, destructive actions |
| `meaning-alert` | y30 (muted amber) | y70 (bright amber) | Warnings, attention needed |
| `meaning-success` | g30 (muted green) | g70 (bright green) | Confirmation, completion |

Meaning colours are used on **icons and typography only** — not as background fills.

#### Information visualisation

Nine chart colours (`chart-1`–`chart-9`), each a single CSS variable whose value swaps at theme change (light ↔ dark). Applied at a standard **81% alpha** throughout: `rgb(var(--chart-1) / var(--chart-alpha))`.

All 9 values are project-specific — replace from Figma. The `--chart-alpha: 0.81` var is defined in `_semantic-tokens.css` and can be adjusted per project if needed.

---

## Typography System

### Base variables — Size Scale: `f1`–`f15`

Sizes are generated using the **minor third musical interval (6:5 = 1.2×)**, each step snapped to the nearest multiple of 1.5px. Base is 9px.

**Generation method:** Start at 9px and multiply by 1.2 repeatedly. Then snap each raw result to the nearest 1.5px multiple. 1.5px is the smallest unit that divides evenly into the most common screen densities, so all values remain crisp at integer pixel boundaries on 1×, 1.5×, and 2× displays.

$$f_n = \text{round}(9 \times 1.2^{(n-1)} \div 1.5) \times 1.5$$

| Step | Raw value | Snapped to 1.5px |
|---|---|---|
| f1 | 9.00px | 9px |
| f2 | 10.80px | 10.5px |
| f3 | 12.96px | 13.5px → **12px** (nearest) |
| f4 | 15.55px | 15px |
| f5 | 18.66px | 18px |
| f6 | 22.40px | 22.5px → **21px** (nearest) |
| f7 | 26.87px | 27px → **24px** (nearest) |
| f8 | 32.24px | 31.5px → **30px** (nearest) |
| f9 | 38.69px | 39px → **36px** (nearest) |
| f10 | 46.43px | 46.5px → **42px** (nearest) |
| f11 | 55.71px | 55.5px → **48px** (nearest applied) |
| f12 | 66.86px | 67.5px → **57px** (nearest applied) |
| f13 | 80.23px | 79.5px → **69px** (nearest applied) |
| f14 | 96.27px | 96px → **81px** (nearest applied) |
| f15 | 115.53px | 115.5px → **96px** (nearest applied) |

> The larger steps (f11–f15) have visually larger snap distances. At display sizes the perceptual difference is negligible and the snapping preserves grid alignment over exact ratio fidelity.

> To change the drama of the scale, swap the ratio: major second (~1.125×) for subtler, major third (~1.25×) for more dramatic.

| Token | Size |
|---|---|
| `f1` | 9px |
| `f2` | 10.5px |
| `f3` | 12px |
| `f4` | 15px |
| `f5` | 18px |
| `f6` | 21px |
| `f7` | 24px |
| `f8` | 30px |
| `f9` | 36px |
| `f10` | 42px |
| `f11` | 48px |
| `f12` | 57px |
| `f13` | 69px |
| `f14` | 81px |
| `f15` | 96px |

These are size-only tokens. No line height is baked in. The old named scale (`xl`, `base`, `lg`, `6xl` etc.) is removed entirely.

### Base variables — Leading Scales

Leading tokens are separate from size and applied independently. Three scales for three text roles:

**Grid alignment:** Every leading value is a multiple of 4px. This means all text blocks snap to the same baseline grid — a 4px grid is the smallest common denominator that aligns comfortably with the g-scale spacing system (`g1 = 8px`, `g0h = 4px`). Mixed text elements on the same line or stacked in a layout will always land on a shared grid line.

> Line height values at `lt3` (16px) and `lt2` (16px) are intentionally the same — at very small sizes the 1.33× ratio collapses to the same 4px-snapped value.

**`lb` — Body / Label / Overline leading (~1.5×)**

| Token | Value |
|---|---|
| `lb1` | 12px |
| `lb2` | 16px |
| `lb3` | 20px |
| `lb4` | 24px |
| `lb5` | 28px |
| `lb6` | 32px |
| `lb7` | 36px |
| `lb8` | 40px |

**`lt` — Title leading (~1.33×)** — full scale `lt1`–`lt15`

| Token | Value | Token | Value |
|---|---|---|---|
| `lt1` | 12px | `lt9` | 48px |
| `lt2` | 16px | `lt10` | 56px |
| `lt3` | 16px | `lt11` | 64px |
| `lt4` | 20px | `lt12` | 76px |
| `lt5` | 24px | `lt13` | 92px |
| `lt6` | 28px | `lt14` | 108px |
| `lt7` | 32px | `lt15` | 128px |
| `lt8` | 40px | | |

**`ld` — Display leading (~1.2×)** — `ld6`–`ld15` (small sizes not used for display)

| Token | Value | Token | Value |
|---|---|---|---|
| `ld6` | 24px | `ld11` | 56px |
| `ld7` | 28px | `ld12` | 64px |
| `ld8` | 36px | `ld13` | 80px |
| `ld9` | 44px | `ld14` | 96px |
| `ld10` | 52px | `ld15` | 112px |

### How the two-tier system works together

The f-scale and the leading scales are independent Base vocabularies. They are combined at the Semantic layer — either explicitly in HTML, or baked into component classes.

**The pairing rule:** the number in the leading token always matches the number in the size token. `f7` pairs with `lb7`, `lt7`, or `ld7` — whichever leading scale fits the role. You never mix numbers across a pair.

```
text-f7  + leading-lb7  → body/label at f7 size
text-f7  + leading-lt7  → title at f7 size
text-f7  + leading-ld7  → display at f7 size
```

**Why three leading scales?** Because tighter leading looks better at display sizes and looser leading is more readable for body copy — but the font size is the same token in both cases. The three scales encode that difference:

| Scale | Ratio | Used for |
|---|---|---|
| `lb` | ~1.5× | Body copy, labels, overlines |
| `lt` | ~1.33× | Titles, headings |
| `ld` | ~1.2× | Display / hero text |

> **The ratio is approximate.** The f-scale uses a 1.2× multiplier between steps (minor third interval), but values are snapped to 1.5px increments. This means the leading values are derived from the same scale but are also snapped — so the ratio isn't exactly 1.5× or 1.33× at every step. The labels describe the *intent*, not a guarantee.

**How breakpoints feed into this:** component classes step through the f-scale as the viewport grows. Each breakpoint maps the component to a higher f-number — and because the pairing rule holds, the leading steps in lockstep. You never change one without the other.

For example, `.h1` uses the `lt` leading scale and steps through the f-scale at three breakpoints:

| Breakpoint | Size | Leading |
|---|---|---|
| Mobile (default) | `f8` (30px) | `lt8` (40px) |
| `tab-s` (768px) | `f9` (36px) | `lt9` (48px) |
| `scr-s` (1280px) | `f10` (42px) | `lt10` (56px) |
| `scr-l` (1920px) | `f11` (48px) | `lt11` (64px) |

Body classes (`body-m` etc.) use the `lb` scale and only step up at `scr-l`. Display classes (`d1`–`d3`) use the `ld` scale and step through multiple breakpoints. The pattern is always the same: f-number and leading-number stay in sync.

### Combining size and leading

Canonical usage (Figma-aligned): apply size and leading as separate utilities.

```html
<p class="text-f5 leading-lb5">Body text</p>
<h2 class="text-f9 leading-lt9">Title</h2>
<h1 class="text-f11 leading-ld11">Display</h1>
```

In practice, you will rarely write these by hand. Component classes (`.h1`, `.body-m`, `.label-s` etc.) bake both utilities in via `@apply`, so the pairing is automatic. The raw utilities exist for one-off overrides and for building new component classes in a project.

### Font role variables

Each text role has its own font family CSS variable, all defaulting to Roboto.

```css
/* src/_fonts.css */
:root {
  --font-display:   'Roboto', system-ui, sans-serif; /* d1–d3 */
  --font-heading:   'Roboto', system-ui, sans-serif; /* h1–h3 */
  --font-title:     'Roboto', system-ui, sans-serif; /* title-l, title-m, title-s, title-xs */
  --font-body:      'Roboto', system-ui, sans-serif; /* body-* */
  --font-label:     'Roboto', system-ui, sans-serif; /* label-*, overline-* */
}
```

`--font-display` and `--font-heading` default to the same value and are typically a display or brand typeface. `--font-title` defaults to the same but is intentionally separate — card titles and section titles often follow the body typeface on projects where the display font would be too heavy at smaller sizes.

### Semantic — Typography component classes

Component classes live in `src/_components.css`. Each class bakes in a font family, font weight, size token, and leading token. Responsive sizes change at three breakpoints only: `tab-s` (768px), `scr-s` (1280px), and `scr-l` (1920px). `tab-l` and `scr-m` do not introduce new sizes — they inherit from the step below.

> **Global scr-l rule**: Every text size and every component size steps up exactly one level at `scr-l` (1920px+). This is the single design principle governing all responsive scaling at the largest breakpoint.

In v4 CSS, responsive sizing uses breakpoint variant prefixes on `@apply`:

```css
/* Heading pattern — size and leading both step together */
.h1 {
  @apply text-f8 tab-s:text-f9 scr-s:text-f10 scr-l:text-f11;
  @apply leading-lt8 tab-s:leading-lt9 scr-s:leading-lt10 scr-l:leading-lt11;
  font-family: var(--font-heading);
  font-weight: 700;
}

/* Body pattern — fixed size until scr-l jump */
.body-m {
  @apply text-f4 scr-l:text-f5;
  @apply leading-lb4 scr-l:leading-lb5;
  font-family: var(--font-body);
  font-weight: 400;
}

/* Overline pattern — uppercase + tracking, NOT uppercase for labels */
.overline-l {
  @apply text-f3 scr-l:text-f4;
  @apply leading-lb3 scr-l:leading-lb4;
  font-family: var(--font-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Label pattern — semibold UI text, NOT uppercase */
.label-m {
  @apply text-f4 scr-l:text-f5;
  @apply leading-lb4 scr-l:leading-lb5;
  font-family: var(--font-label);
  font-weight: 600;
}
```

**Variants:** Every body class has three variants:
- `.body-m` — regular (weight 400)
- `.body-m-b` — bold (weight 700), same size and leading
- `.body-m-i` — italic (`font-style: italic`), same size and leading

This applies across all body sizes: `.body-l`, `.body-m`, `.body-s`, `.body-xs`, `.body-xxs`.

Display, heading, title, and label classes have no variants — no bold, no italic. Weight and style are fixed by the class definition.

---

## Elevation System

Elevation is expressed by **both** a surface colour token and a shadow token together. In light mode, both apply. In dark mode, surfaces resolve to tinted values, no shadows are applied, and `border-low` (`--border-color` at `--border-alpha-low`, 12%) is used on all elevated elements to delineate them.

The `level*` utility classes (`level0`–`level5`, `level2a`, `level-invert`) handle this automatically — they set the fill and apply `border-low` in `.dark {}` with no extra markup needed. Use these instead of the raw `bg-level*` Tailwind utilities.

### Surface levels

| Token | Semantic role |
|---|---|
| `level0` | Page background |
| `level1` | Main UI sheet; also switch and tab fill colours |
| `level2` | Cards |
| `level2a` | Alternate card colour — visual separation at the same elevation as `level2`, no extra shadow |
| `level3` | Cards in raised / hovered / dragged state |
| `level4` | Navbars, sidebars |
| `level5` | Popup modals |
| `level-invert` | Inverted surface — dark elements on light backgrounds or light elements on dark backgrounds |

### Shadow levels

Shadows are **3-layer composites** modelling two light sources: one directly above the element, one coming from the side.

- **Umbra** (`--shadow-alpha-umbra`, default `0.09`) — the darkest, most concentrated shadow cast by the direct (sideways) light source. Closest to the object, tightest blur.
- **Penumbra** (`--shadow-alpha-penumbra`, default `0.03`) — the softer outer shadow also caused by the direct light source, where the light is only partially blocked.
- **Ambient** (`--shadow-alpha-ambient`, default `0.06`) — the wide, diffuse shadow from the overhead ambient light. Highest blur radius, wraps the whole object softly.

Layer order within each `shadow-level*` token: **umbra first, ambient second, penumbra third**.

All three layers share the same colour: `--shadow-color` (default `p30`, raw RGB channels from `_base-palette.css`). Only the geometry (offsets and blur) and the per-layer alphas differ. This means you can change the shadow tint globally by editing `--shadow-color` in one place, and tune darkness per-layer via the three alpha vars.

> **Dark mode**: shadows are not rendered in dark mode. Elevation is communicated entirely through surface lightness. The `shadow-level*` tokens are defined but their visual effect is suppressed — do not apply them in dark mode.

| Token | Paired surface |
|---|---|
| `shadow-level1` | `level1` |
| `shadow-level2` | `level2`, `level2a` |
| `shadow-level3` | `level3` |
| `shadow-level4` | `level4` |
| `shadow-level5` | `level5` |

### Dark mode

The `level*` token names stay the same in dark mode. The CSS variables they reference resolve to different values:

- **Surfaces**: progressively lighter opacities of white layered on the dark base — each higher level gets slightly more white, pushing elements visually closer to the screen
- **Shadows**: not rendered in dark mode — elevation is communicated entirely through surface lightness
- **Borders**: `border-low` (`--border-color` / `--border-alpha-low` = 12%) applied as a default border on all elevated elements. This is the primary way surfaces are visually separated from each other in dark mode.
- **Actions, text, borders, meaning**: same token names, different palette step values resolved via CSS vars

Switching theme is achieved entirely by swapping the CSS variable values in a `.dark` class or `prefers-color-scheme: dark` media query — no Tailwind class changes are needed in markup.

---

## Spacing System

A single unified spacing scale. No raw pixel class names — everything goes through g-tokens.

### G-scale

Formula: `gN = N × 8px` | `gNh = (N × 8) + 4px`

Half-steps run continuously through the entire scale.

| Token | Value | Token | Value |
|---|---|---|---|
| `g0` | 0px | `g6` | 48px |
| `g0h` | 4px | `g6h` | 52px |
| `g1` | 8px | `g7` | 56px |
| `g1h` | 12px | `g7h` | 60px |
| `g2` | 16px | `g8` | 64px |
| `g2h` | 20px | `g8h` | 68px |
| `g3` | 24px | `g9` | 72px |
| `g3h` | 28px | `g9h` | 76px |
| `g4` | 32px | `g10` | 80px |
| `g4h` | 36px | `g10h` | 84px |
| `g5` | 40px | `g11` | 88px |
| `g5h` | 44px | `g11h` | 92px |
| | | `g12` | 96px |
| | | `g12h` | 100px |
| | | `g13` | 104px |
| | | `g13h` | 108px |
| | | `g15` | 120px |
| | | `g16` | 128px |
| | | `g20` | 160px |
| | | `g25` | 200px |

> Note: the reference config had `g5: 30px` — this was a confirmed bug. The correct value is `40px`.

Usage: `p-g3`, `mt-g2`, `gap-g4`, `px-g1h`

---

## Grid and Layout System

### Breakpoints

Breakpoints are min-width only (mobile-first).

| Token | Min-width | Device context |
|---|---|---|
| `mob-p` | 250px | All phones portrait |
| `mob-l` | 480px | All phones landscape |
| `tab-s` | 768px | iPads |
| `tab-l` | 992px | iPad Pro |
| `scr-s` | 1280px | Desktop small |
| `scr-m` | 1440px | MacBooks |
| `scr-l` | 1920px | Desktop |

### Column grid

| Breakpoint | Container | Columns | Column width | Gutters |
|---|---|---|---|---|
| `mob-p` | 100% flexible | 4 | flexible | 16px (`g2`) |
| `mob-l` | 100% flexible | 6 | flexible | 16px (`g2`) |
| `tab-s` | 680px | 8 | 64px (`g8`) | 24px (`g3`) |
| `tab-l` | 936px | 12 | 56px (`g7`) | 24px (`g3`) |
| `scr-s` | 1128px | 12 | 72px (`g9`) | 24px (`g3`) |
| `scr-m` | 1224px | 12 | 80px (`g10`) | 24px (`g3`) |
| `scr-l` | 1600px | 12 | 104px (`g13`) | 32px (`g4`) |

The container has `24px` side padding by default, which drops to `0` at `tab-s` (auto margin takes over).

### `.gap-default`

A component class that applies the correct gutter for each breakpoint:

```css
.gap-default {
  @apply gap-g2 tab-s:gap-g3 scr-l:gap-g4;
}
```

### Container fluid

```css
.container-fluid {
  @apply w-full px-g2 tab-s:px-g3 scr-s:px-g4;
}
```

---

## Shape Scale

Formula: `sh{h} = h ÷ 8` — corner radius is exactly one-eighth of the component height. This keeps rounding proportional across every size tier with no arbitrary values.

| Token | Component height | Radius |
|---|---|---|
| `sh8` | 8px | 1px |
| `sh16` | 16px | 2px |
| `sh24` | 24px | 3px |
| `sh32` | 32px | 4px |
| `sh40` | 40px | 5px |
| `sh48` | 48px | 6px |
| `sh56` | 56px | 7px |
| `sh64` | 64px | 8px |
| `sh72` | 72px | 9px |
| `sh-full` | any | 9999px |

---

## Shape System

Corner radius is a brand expression token — the same component reads as sharp at 2px, approachable at 16px, and playful at full. MODS applies the same two-tier model as colour and typography: Base variables are the numeric border radius vocabulary, the Semantic layer maps each component height to a shape token that projects override to set their brand's corner style.

### Base variables — Shape scale

Defined in `src/_theme.css`. The `sh{h}` tokens are the raw vocabulary — see [Shape Scale](#shape-scale) for the full scale. Each token encodes the component height it is designed for; the value is exactly one-eighth of that height.

### Semantic shape tokens

Each shape token corresponds to a component height tier. When a project overrides the shape system, it sets the semantic vars only — component classes and markup are unaffected.

At `scr-l`, a component steps up one height tier and one shape tier simultaneously.

| Shape token | Base token | Radius | Component height | Sample components |
|---|---|---|---|---|
| `--shape-xs` | `sh32` | 4px | 32px | `.btn-xs`, `.btn-icon-xs`, `.input-s`, `.chip` |
| `--shape-s` | `sh40` | 5px | 40px | `.btn-s`, `.btn-icon-s`, `.input-m` |
| `--shape-m` | `sh48` | 6px | 48px | `.btn-m`, `.btn-icon-m`, `.input-l` |
| `--shape-l` | `sh56` | 7px | 56px | `.btn-l`, `.btn-icon-l` |
| `--shape-xl` | `sh64` | 8px | 64px | `.btn-xl`, `.btn-icon-xl` |
| `--shape-xxl` | `sh72` | 9px | 72px | `.btn-xl` at scr-l, `.btn-icon-xl` at scr-l |
| `--shape-full` | `sh-full` | 9999px | any | chips, badges, radios, toggles, icon buttons (default) |
| `--shape-control` | `sh16` | 2px | 16px | checkboxes |

```css
/* src/_semantic-tokens.css */
:root {
  --shape-xs:      var(--sh32);    /* 4px — 32px height */
  --shape-s:       var(--sh40);    /* 5px — 40px height */
  --shape-m:       var(--sh48);    /* 6px — 48px height */
  --shape-l:       var(--sh56);    /* 7px — 56px height */
  --shape-xl:      var(--sh64);    /* 8px — 64px height */
  --shape-xxl:     var(--sh72);    /* 9px — 72px height */
  --shape-full:    var(--sh-full); /* 9999px — pill shape */
  --shape-control: var(--sh16);   /* 2px — 16px checkboxes */
}
```

### Using shape tokens in component classes

Component classes reference `var(--shape-*)` for `border-radius` rather than a numeric utility. At `scr-l`, the component steps up both height and shape tier simultaneously:

```css
.btn-m {
  border-radius: var(--shape-m);       /* 48px height at mobile–scr-s */
}
@media (min-width: 1920px) {
  .btn-m {
    border-radius: var(--shape-l);     /* 56px height at scr-l */
  }
}
```

### Overriding for brand

Override the base `sh{h}` vars. All semantic shape tokens and all component classes cascade automatically — no other changes needed.

```css
/* Example: sharper brand — compress all rounding */
:root {
  --sh16:  1px;
  --sh32:  2px;
  --sh40:  3px;
  --sh48:  4px;
  --sh56:  5px;
  --sh64:  6px;
  --sh72:  7px;
  /* sh-full left unchanged — pills stay round */
}
```

---

## Component Classes Reference

### Buttons

Button sizes follow the global scr-l rule — each size steps up one level at 1920px.

| Class | Mobile–scr-s | scr-l | Padding | Label class | Radius |
|---|---|---|---|---|---|
| `.btn-xs` | 32px (`g4`) | 40px (`g5`) | `px-g2h` | `.label-s` | `--shape-xs` → `--shape-s` |
| `.btn-s` | 40px (`g5`) | 48px (`g6`) | `px-g3` | `.label-s` | `--shape-s` → `--shape-m` |
| `.btn-m` | 48px (`g6`) | 56px (`g7`) | `px-g4` | `.label-m` | `--shape-m` → `--shape-l` |
| `.btn-l` | 56px (`g7`) | 64px (`g8`) | `px-g4` | `.label-l` | `--shape-l` → `--shape-xl` |
| `.btn-xl` | 64px (`g8`) | 72px (`g9`) | `px-g5` | `.label-l` | `--shape-xl` → `--shape-xxl` |

| Class | Description |
|---|---|
| `.btn` | Base: `w-fit flex flex-row place-items-center` + transition |
| `.btn-tight` | Collapses `px` to 0; expands to full padding on hover/focus |
| `.btn-primary` | Brand fill (`action-primary-default`), inverted text, `shadow-level2`; hover → `shadow-level4` |
| `.btn-secondary` | Transparent with brand border; hover → `action-secondary-hover` bg |
| `.btn-tertiary` | Text only; hover → `action-secondary-hover` bg |

### Icon buttons

Icon buttons are square buttons with no text, typically used in circular form. Heights match the corresponding `btn-*` size exactly so they can be mixed in the same row without misalignment.

| Class | Mobile–scr-s | scr-l | Default radius | Square radius (`.btn-icon-sq`) | Equivalent btn |
|---|---|---|---|---|---|
| `.btn-icon-xs` | 32×32px (`g4`) | 40×40px (`g5`) | `--shape-full` | `--shape-xs` → `--shape-s` | `.btn-xs` |
| `.btn-icon-s` | 40×40px (`g5`) | 48×48px (`g6`) | `--shape-full` | `--shape-s` → `--shape-m` | `.btn-s` |
| `.btn-icon-m` | 48×48px (`g6`) | 56×56px (`g7`) | `--shape-full` | `--shape-m` → `--shape-l` | `.btn-m` |
| `.btn-icon-l` | 56×56px (`g7`) | 64×64px (`g8`) | `--shape-full` | `--shape-l` → `--shape-xl` | `.btn-l` |
| `.btn-icon-xl` | 64×64px (`g8`) | 72×72px (`g9`) | `--shape-full` | `--shape-xl` → `--shape-xxl` | `.btn-xl` |

| Class | Description |
|---|---|
| `.btn-icon` | Base: `flex items-center justify-center` + transition |
| `.btn-icon-sq` | Square radius modifier — overrides `rounded-full` with the size's square radius (see table above) |
| `.btn-icon-primary` | `action-primary-default` bg; hover → `action-primary-hover` |
| `.btn-icon-secondary` | Transparent with brand border; hover → `action-secondary-hover` bg |
| `.btn-icon-tertiary` | No background; hover → `action-secondary-hover` bg |

### Typography classes

Responsive size mapping — three change points: `tab-s`, `scr-s`, `scr-l`.

| Role | Class | Mobile | `tab-s` | `scr-s` | `scr-l` | Leading | Font var |
|---|---|---|---|---|---|---|---|
| Display Hero | `.d1` | f8 | f8 | f11 | f13 | `ld` | `--font-display` |
| Display Medium | `.d2` | f8 | f10 | f12 | f14 | `ld` | `--font-display` |
| Display Small | `.d3` | f7 | f8 | f11 | f12 | `ld` | `--font-display` |
| Heading Large | `.h1` | f8 | f9 | f10 | f11 | `lt` | `--font-heading` |
| Heading Medium | `.h2` | f7 | f8 | f9 | f10 | `lt` | `--font-heading` |
| Heading Small | `.h3` | f6 | f7 | f8 | f9 | `lt` | `--font-heading` |
| Title Large | `.title-l` | f7 | f7 | f7 | f8 | `lt` | `--font-title` |
| Title Medium | `.title-m` | f6 | f6 | f6 | f7 | `lt` | `--font-title` |
| Title Small | `.title-s` | f5 | f5 | f5 | f6 | `lt` | `--font-title` |
| Title Extra Small | `.title-xs` | f4 | f4 | f4 | f5 | `lt` | `--font-title` |
| Body Large | `.body-l` | f5 | f5 | f5 | f6 | `lb` | `--font-body` |
| Body Medium | `.body-m` | f4 | f4 | f4 | f5 | `lb` | `--font-body` |
| Body Small | `.body-s` | f3 | f3 | f3 | f4 | `lb` | `--font-body` |
| Body Extra Small | `.body-xs` | f2 | f2 | f2 | f3 | `lb` | `--font-body` |
| Body XXS | `.body-xxs` | f1 | f1 | f1 | f2 | `lb` | `--font-body` |
| Label Large | `.label-l` | f5 | f5 | f5 | f6 | `lb` | `--font-label` |
| Label Medium | `.label-m` | f4 | f4 | f4 | f5 | `lb` | `--font-label` |
| Label Small | `.label-s` | f3 | f3 | f3 | f4 | `lb` | `--font-label` |
| Overline XL | `.overline-xl` | f3 | f4 | f5 | f6 | `lb` | `--font-label` |
| Overline Large | `.overline-l` | f3 | f3 | f3 | f4 | `lb` | `--font-label` |
| Overline Medium | `.overline-m` | f2 | f2 | f2 | f3 | `lb` | `--font-label` |
| Overline Small | `.overline-s` | f1 | f1 | f1 | f2 | `lb` | `--font-label` |

All display/heading/title classes: weight 700. All body classes: weight 400. All label classes: weight 600, **not uppercase**. All overline classes: weight 600, `text-transform: uppercase`, `letter-spacing: 2px`.

### Form inputs

All input components share a base height scale that follows the global scr-l rule.

| Class | Mobile–scr-s | scr-l | Radius | Label class |
|---|---|---|---|---|
| `.input-s` | 32px | 40px | `--shape-xs` → `--shape-s` | `.label-s` |
| `.input-m` | 40px | 48px | `--shape-s` → `--shape-m` | `.label-m` |
| `.input-l` | 48px | 56px | `--shape-m` → `--shape-l` | `.label-l` |

| Class | Description |
|---|---|
| `.input` | Base: `w-full flex items-center` + border + transition. Uses `border-medium` at rest. |
| `.input:focus` | `border-focus` colour, no size change |
| `.input:disabled` | `text-low` colour, `action-primary-disabled` bg, no pointer events |
| `.input-error` | `meaning-error` border; add `.input-error-msg` below for error text |
| `.input-success` | `meaning-success` border |

### Checkboxes and radios

| Class | Description |
|---|---|
| `.checkbox` | 16×16px (scr-l: 20×20px), `--shape-control`. Unchecked: `border-medium`. Checked: `action-primary-default` fill, white tick. Indeterminate: `action-primary-default` fill, white dash. |
| `.radio` | 16×16px (scr-l: 20×20px), `--shape-full`. Unchecked: `border-medium`. Checked: outer ring `action-primary-default`, filled centre dot. |
| `.checkbox:disabled`, `.radio:disabled` | `action-primary-disabled` fill/border, no pointer events |

### Toggles

| Class | Description |
|---|---|
| `.toggle` | Pill track (32×16px, scr-l: 40×20px), `--shape-full`. Off: `action-neutral-default` track. On: `action-primary-default` track. Thumb is white, `--shape-full`, with `shadow-level2`. |
| `.toggle:disabled` | `action-primary-disabled` / `action-neutral-disabled` fills |

### Badges

Badges are non-interactive labels. No hover state.

| Class | Description |
|---|---|
| `.badge` | Base: `--shape-full px-g1h py-g0h`, `.label-s` text, `w-fit` |
| `.badge-primary` | `brand-main` bg, inverted text |
| `.badge-success` | `meaning-success` bg or tint; `meaning-success` text |
| `.badge-error` | `meaning-error` bg or tint; `meaning-error` text |
| `.badge-alert` | `meaning-alert` bg or tint; `meaning-alert` text |
| `.badge-neutral` | `surfaces-l2` bg, `text-medium` text |

### Chips

Chips are interactive — selectable and/or dismissible.

| Class | Description |
|---|---|
| `.chip` | Base: 32px height (scr-l: 40px), `--shape-full px-g2`, `.label-s` text, `border-medium` border, `surfaces-l1` bg. Matches `.btn-xs` height. |
| `.chip.selected` | `action-primary-default` border, `brand-lighter` bg, `text-accent` text |
| `.chip-dismiss` | Adds a trailing `×` icon button wired to remove the chip |
| `.chip:disabled` | `text-low` colour, no pointer events |

---

## Build

```bash
npm install
npm run build:css   # outputs dist/style.css
```

Build script: `npx tailwindcss -i src/style.css -o dist/style.css`

Tailwind v4 uses automatic content detection — no `content` paths needed in configuration.
