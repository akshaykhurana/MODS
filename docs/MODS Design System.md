# MODS Design System

MODS is a Tailwind v4 CSS-first design system starter. Every project built on MODS begins with this repo and overrides the CSS variables for its own brand. The architecture is consistent across all token types: a two-tier model where **Base variables** are the raw scale vocabulary and the **Semantic layer** is the application layer.

---

## Architecture: The Two-Tier Model

The same pattern governs every part of the system.

| | Base variables — Raw Scale | Semantic Layer |
|---|---|---|
| **Colour** | `p10`–`p100`, `s10`–`s100`, `n10`–`n100` | `--brand-main-color`, `--text-color`, `--surfaces-base-color` |
| **Typography size** | `f1`–`f15` | `.h1`, `.body-m`, `.label-m` |
| **Typography leading** | `lb1`–`lb8`, `lt1`–`lt15`, `ld6`–`ld15` | baked into Semantic component classes |
| **Elevation** | `level0`–`level5`, `shadow-level1`–`shadow-level5`, `shadow-level1-inner` | component classes (to be defined per project) |
| **Spacing** | `g0`–`g25` + half-steps | `p-g3`, `gap-g2`, `.gap-default` |
| **Shape** | `sh8`–`sh72`, `sh-full` | `--shape-xxs`–`--shape-xxl`, `--shape-full` |

Base variables live in `src/_base.css`.  
The Semantic layer lives in `src/_semantic-tokens.css` (colour, shape) and `src/_components.css` (everything else).

---

## CSS Variable Naming Convention

All CSS custom properties in MODS follow a strict 4-part naming rule:

```
--{category}-{type}-{mode}-{property}
```

| Part | Values | Notes |
|---|---|---|
| `category` | `surfaces`, `text`, `border`, `action`, `meaning`, `brand`, `shadow`, `chart` | Semantic domain |
| `type` | `base`, `l1`–`l5`, `invert`, `high`, `medium`, `low`, `primary`, `error`, etc. | The specific role within the category |
| `mode` | `light`, `dark`, `global` | `global` for mode-independent values (alphas, widths, blurs) |
| `property` | `color`, `alpha`, `width`, `blur` | The CSS property type |

**Active aliases** (used in components and utilities) omit `mode` — the mode is resolved at runtime by the `.dark {}` block:
```
--surfaces-base-color    ← active alias (no mode)
--surfaces-base-light-color  ← base var (light)
--surfaces-base-dark-color   ← base var (dark)
```

**Dimension vars** (alpha, width, blur) omit mode when mode-independent:
```
--border-global-width       ← single value, not mode-sensitive
--border-focus-global-alpha ← focus alpha, same in all modes
--text-high-light-alpha     ← per-mode emphasis alpha (base var)
--text-high-alpha           ← active alias (no mode)
```


---

## File Structure

```
src/
  style.css               ← Entry point. @import "tailwindcss" + all partials.
  _base.css               ← All raw tokens: @theme block, :root palette, alpha scales, shape scale,
                            Google Fonts import, font families, font weights, font sizes, line heights
  _semantic-tokens.css    ← :root CSS vars: brand, surfaces, actions, text, borders, shadows
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

Three full palettes in the starter. Stored as raw RGB channel values (no `rgb()` wrapper) so alpha can be applied at point of use via `rgb(var(--p40) / 0.87)`.

The **primary (p)** and **secondary (s)** palettes use steps `0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 85, 90, 95, 98, 99, 100`.

The **neutral (n)** palette uses steps `0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100` — pure grey steps (R=G=B), no chromatic bias.

> **Generate palettes using Google's official Material Theme Builder Figma plugin.** The plugin produces a full tonal palette in the HCT colour space for any source hue. The step numbers map directly — `p10` is tone 10 of the primary palette from the plugin, `p40` is tone 40, and so on. Copy the HEX values from the plugin, convert to RGB channels, and drop them into `_base.css`. Do not use HSB or HSL to hand-pick the steps — those colour spaces are perceptually uneven and will produce mismatched contrast ratios across hues.

The playground integrates the Google `@material/material-color-utilities` HCT library. Every palette swatch (primary, secondary, neutral, and meaning rows) displays all three colour formats side by side: **RGB** (space-separated channels, editable), **HEX** (read-only, derived from RGB), and **HCT** (hue · chroma · tone as integers, editable). Editing either RGB or HCT cross-converts live — the colour box, CSS variable, and all three display rows update instantly. Both formats also write dirty state so a subsequent Save will persist the change to `_base.css`.

Additional accent palettes (`a10`–`a100`, `b10`–`b100` etc.) can be added per project but are not part of the starter.

**Meaning colours** (error, alert, success) are not full 10-step palettes. They are two fixed values per meaning: a light-mode tone and a dark-mode tone, named by hue and step — `r30`/`r70`, `y30`/`y70`, `g30`/`g70`. The semantic token `--meaning-error` resolves to `r30` in light mode and `r70` in dark mode via the theme CSS variable swap.

```css
/* src/_base.css */
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

Each token that carries an alpha value uses a separate colour var (raw RGB channels) and an alpha var. These are pre-composed into convenience vars for direct use:

```css
color: var(--text-high);     /* pre-composed rgb + alpha */
color: var(--text-medium);   /* pre-composed rgb + alpha */
```

The raw alpha vars are still available for manual composition when needed (e.g. overlays, custom components):

```css
color: rgb(var(--text-color) / var(--text-medium-alpha));
```

`high`-level tokens are always fully opaque and have no alpha var.

The alpha values follow the Material Design emphasis scale and are rarely overridden per project because the MD contrast system maintains readability when swapping hues.

#### Base alpha variables

```css
/* Defined in _base.css */

/* Text alphas — light and dark tuned independently; aliases switch in .dark {} */
--text-high-light-alpha:     1;
--text-medium-light-alpha: 0.89;
--text-low-light-alpha:    0.60;
--text-disabled-light-alpha: 0.38;
--text-accent-light-alpha: 0.85;

--text-high-dark-alpha:     1;
--text-medium-dark-alpha: 0.96;
--text-low-dark-alpha:    0.77;
--text-disabled-dark-alpha: 0.59;
--text-accent-dark-alpha: 0.95;

/* Active aliases live in _semantic-tokens.css — switch between light/dark in .dark {} */
--text-high-alpha:     var(--text-light-alpha-high);
--text-medium-alpha:   var(--text-light-alpha-medium);
--text-low-alpha:      var(--text-light-alpha-low);
--text-disabled-alpha: var(--text-light-alpha-disabled);
--text-accent-alpha:   var(--text-light-alpha-accent);

/* Border alphas — mode-independent, defined in _base.css */
--border-high-alpha:   0.87;
--border-medium-alpha: 0.38;
--border-low-alpha:    0.12;
--border-focus-global-alpha:  1;

/* Action alphas — actions are always solid fills, no alpha vars needed */
```

#### Colour semantic tokens

All mode-switching tokens follow the **Variables Naming Pattern**:
1. Named base vars `--{cat}-{prop}-light-color` / `--{cat}-{prop}-dark-color` in `:root` hold the raw palette step.
2. Active aliases `--{cat}-{prop}` point to the light set by default.
3. `.dark {}` re-points aliases to the dark set — `.dark {}` is never written programmatically.

##### Composed text emphasis vars

Eight pre-composed vars combine a text colour alias with an emphasis alpha. They live in `_semantic-tokens.css` and auto-switch in dark mode because both their dependencies (`--text-color` / `--text-invert-color` and `--text-*-alpha`) already switch.

| Var | Composition | Use |
|---|---|---|
| `--text-high` | `rgb(var(--text-color) / var(--text-high-alpha))` | Body text, headings |
| `--text-medium` | `rgb(var(--text-color) / var(--text-medium-alpha))` | Secondary text |
| `--text-low` | `rgb(var(--text-color) / var(--text-low-alpha))` | Hints, captions |
| `--text-disabled` | `rgb(var(--text-color) / var(--text-disabled-alpha))` | Disabled labels |
| `--text-invert-high` | `rgb(var(--text-invert-color) / var(--text-high-alpha))` | Labels on filled/invert surfaces |
| `--text-invert-medium` | `rgb(var(--text-invert-color) / var(--text-medium-alpha))` | Secondary labels on invert surfaces |
| `--text-invert-low` | `rgb(var(--text-invert-color) / var(--text-low-alpha))` | Hints on invert surfaces |
| `--text-invert-disabled` | `rgb(var(--text-invert-color) / var(--text-disabled-alpha))` | Disabled labels on invert surfaces |

Use these directly as `color` values — `color: var(--text-high)`. They are the preferred way to apply text colour in components; raw `rgb(var(--text-color) / ...)` composition is reserved for cases where neither standard emphasis level fits.

```css
/* src/_semantic-tokens.css */
:root {

  /* ---- Brand ---- */
  --brand-main-color: var(--p30);  /* mode-independent — same step in both modes */

  /* ---- Surfaces ---- */
  /* Base — light mode */
  --surfaces-base-light-color:   var(--s98);
  --surfaces-l1-light-color:     var(--s99);
  --surfaces-l2-light-color:     var(--s100);
  --surfaces-l2a-light-color:    var(--s100);
  --surfaces-l3-light-color:     var(--s100);
  --surfaces-l4-light-color:     var(--s100);
  --surfaces-l5-light-color:     var(--s100);
  --surfaces-invert-light-color: var(--s5);

  /* Base — dark mode */
  --surfaces-base-dark-color:   var(--s5);
  --surfaces-l1-dark-color:     var(--s5);
  --surfaces-l2-dark-color:     var(--s7);
  --surfaces-l2a-dark-color:    var(--s9);
  --surfaces-l3-dark-color:     var(--s11);
  --surfaces-l4-dark-color:     var(--s13);
  --surfaces-l5-dark-color:     var(--s15);
  --surfaces-invert-dark-color: var(--s98);

  /* Active aliases */
  --surfaces-base-color:   var(--surfaces-light-base);
  --surfaces-l1-color:     var(--surfaces-light-l1);
  --surfaces-l2-color:     var(--surfaces-light-l2);
  --surfaces-l2a-color:    var(--surfaces-light-l2a);  /* alternate l2 — slightly more contrast */
  --surfaces-l3-color:     var(--surfaces-light-l3);
  --surfaces-l4-color:     var(--surfaces-light-l4);
  --surfaces-l5-color:     var(--surfaces-light-l5);
  --surfaces-invert-color: var(--surfaces-light-invert);
  --shadow-color:    var(--p30);  /* set via dropdown — light mode only; no shadows in dark mode */
  /* --surfaces-global-alpha (0.96) and --surfaces-blur (12px) live in _base.css */

  /* ---- Text ---- */
  /* Single colour alias per context + a shared alpha scale applied at point of use:
       color: rgb(var(--text-color) / var(--text-medium-alpha)); */

  /* Base — light mode */
  --text-light-color:         var(--s10);
  --text-accent-light-color:        var(--p35);
  --text-invert-light-color:  var(--s95);
  --text-invert-accent-light-color: var(--p80);

  /* Base — dark mode */
  --text-dark-color:         var(--s95);
  --text-accent-dark-color:        var(--p80);
  --text-invert-dark-color:  var(--s10);
  --text-invert-accent-dark-color: var(--p35);

  /* Active aliases */
  --text-color:         var(--text-light-color);
  --text-accent-color:        var(--text-light-accent);
  --text-invert-color:  var(--text-light-invert-color);
  --text-invert-accent-color: var(--text-light-invert-accent);

  /* Alpha aliases — raw values in _base.css; switch in .dark {} */
  --text-high-alpha:     var(--text-light-alpha-high);
  --text-medium-alpha:   var(--text-light-alpha-medium);
  --text-low-alpha:      var(--text-light-alpha-low);
  --text-disabled-alpha: var(--text-light-alpha-disabled);
  --text-accent-alpha:   var(--text-light-alpha-accent);

  /* ---- Borders ---- */
  /* Base — light mode */
  --border-light-color: var(--n90);
  --border-focus-light-color: var(--p50);

  /* Base — dark mode */
  --border-dark-color: var(--n10);
  --border-focus-dark-color: var(--p30);

  /* Active aliases — point to light set; .dark {} switches to dark set */
  --border-color:       var(--border-light-color);
  --border-focus-color: var(--border-focus-light-color);
  /* Alpha + width scales live in _base.css */

  /* ---- Actions ---- */
  /* All action fills are solid — no opacity.
     primary = brand-coloured interactive elements
     secondary = subtle background for hover/pressed states (ghost buttons)
     neutral = non-brand elements (toggles, unselected tabs)
     label/outline tokens use composed text emphasis vars (var(--text-high) etc.)
     — dark-mode switching is free by construction */

  /* Base — light mode */
  --action-primary-default-light-color:    var(--p40);
  --action-primary-overlay-light-color:    var(--p60); /* brand tint composited on hover/pressed */
  --action-secondary-disabled-light-color: var(--s70);
  --action-secondary-default-light-color:  var(--p80);
  --action-secondary-overlay-light-color:  var(--p80); /* brand tint for secondary/tertiary overlay */
  --action-neutral-default-light-color:    var(--n30);
  --action-neutral-disabled-light-color:   var(--n50);
  --action-neutral-filled-light-color:     var(--n60);
  /* Button labels & outlines — light mode */
  --action-primary-label-light-color:              var(--text-invert-high);
  --action-primary-label-disabled-light-color:     var(--text-invert-medium);
  --action-secondary-outline-light-color:          var(--text-high);
  --action-secondary-label-light-color:            var(--text-high);
  --action-secondary-outline-disabled-light-color: var(--text-disabled);
  --action-secondary-label-disabled-light-color:   var(--text-disabled);
  --action-tertiary-label-light-color:             var(--text-high);
  --action-tertiary-label-disabled-light-color:    var(--text-disabled);

  /* Base — dark mode */
  --action-primary-default-dark-color:    var(--p85);
  --action-primary-overlay-dark-color:    var(--p90);
  --action-secondary-disabled-dark-color: var(--s30);
  --action-secondary-default-dark-color:  var(--p50);
  --action-secondary-overlay-dark-color:  var(--p80);
  --action-neutral-default-dark-color:    var(--n40);
  --action-neutral-disabled-dark-color:   var(--n30);
  --action-neutral-filled-dark-color:     var(--n20);
  /* Button labels & outlines — dark mode */
  --action-primary-label-dark-color:              var(--text-invert-high);
  --action-primary-label-disabled-dark-color:     var(--text-invert-disabled);
  --action-secondary-outline-dark-color:          var(--text-high);
  --action-secondary-label-dark-color:            var(--text-high);
  --action-secondary-outline-disabled-dark-color: var(--text-disabled);
  --action-secondary-label-disabled-dark-color:   var(--text-disabled);
  --action-tertiary-label-dark-color:             var(--text-high);
  --action-tertiary-label-disabled-dark-color:    var(--text-disabled);

  /* Active aliases — point to light set; .dark {} switches to dark set */
  --action-primary-default-color:    var(--action-primary-default-light-color);
  --action-primary-overlay-color:    var(--action-primary-overlay-light-color);   /* brand tint overlay — hover/pressed via alpha */
  --action-secondary-disabled-color: var(--action-secondary-disabled-light-color);
  --action-secondary-default-color:  var(--action-secondary-default-light-color);
  --action-secondary-overlay-color:  var(--action-secondary-overlay-light-color); /* brand tint overlay — hover/pressed via alpha */
  --action-neutral-default-color:    var(--action-neutral-default-light-color);
  --action-neutral-disabled-color:   var(--action-neutral-disabled-light-color);
  --action-neutral-filled-color:     var(--action-neutral-filled-light-color);
  --action-primary-label-color:              var(--action-primary-label-light-color);
  --action-primary-label-disabled-color:     var(--action-primary-label-disabled-light-color);
  --action-secondary-outline-color:          var(--action-secondary-outline-light-color);
  --action-secondary-label-color:            var(--action-secondary-label-light-color);
  --action-secondary-outline-disabled-color: var(--action-secondary-outline-disabled-light-color);
  --action-secondary-label-disabled-color:   var(--action-secondary-label-disabled-light-color);
  --action-tertiary-label-color:             var(--action-tertiary-label-light-color);
  --action-tertiary-label-disabled-color:    var(--action-tertiary-label-disabled-light-color);
  /* Overlay alpha — mode-independent; defined in _base.css */
  --action-overlay-hover-global-alpha:   0.12;
  --action-overlay-pressed-global-alpha: 0.22;

  /* ---- Meaning ---- */
  /* Base — light mode */
  --meaning-error-light-color:   var(--r30);
  --meaning-alert-light-color:   var(--y30);
  --meaning-success-light-color: var(--g30);

  /* Base — dark mode */
  --meaning-error-dark-color:   var(--r70);
  --meaning-alert-dark-color:   var(--y70);
  --meaning-success-dark-color: var(--g70);

  /* Active aliases — point to light set; .dark {} switches to dark set */
  --meaning-error-color:   var(--meaning-error-light-color);
  --meaning-alert-color:   var(--meaning-alert-light-color);
  --meaning-success-color: var(--meaning-success-light-color);

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
  --chart-global-alpha: 0.81;
}
```

#### Text token usage summary

Text uses a single colour alias per context (`--text-color`, `--text-accent-color`, `--text-invert-color`, `--text-invert-accent-color`) combined with a shared alpha scale: `rgb(var(--text-color) / var(--text-medium-alpha))`.

| Emphasis | Colour var | Alpha var | Light | Dark |
|---|---|---|---|---|
| High (icons, highest contrast) | `--text-color` | `--text-high-alpha` | 1.0 | 1.0 |
| Medium (headings) | `--text-color` | `--text-medium-alpha` | 0.89 | 0.96 |
| Low (body copy) | `--text-color` | `--text-low-alpha` | 0.60 | 0.77 |
| Disabled (placeholders) | `--text-color` | `--text-disabled-alpha` | 0.38 | 0.59 |
| Accent (links, highlights) | `--text-accent-color` | `--text-accent-alpha` | 0.85 | 0.95 |
| On inverted surfaces | `--text-invert-color` / `--text-invert-accent-color` | same alpha scale | — | — |

#### Border token usage summary

Borders use a single colour alias `--border-color` (mode-adaptive) combined with a per-role alpha. Focus uses `--border-focus-color`, a separate brand colour.

| Emphasis | Colour var | Alpha var | Alpha |
|---|---|---|---|
| Strong dividers, selected borders | `--border-color` | `--border-high-alpha` | — |
| Default input borders, card outlines | `--border-color` | `--border-medium-alpha` | — |
| Subtle dividers | `--border-color` | `--border-low-alpha` | — |
| Focused inputs, active selection | `--border-focus-color` | `--border-focus-global-alpha` | — |

#### Border utilities

Border utilities are split into two concerns — **width** (which sides) and **colour** (emphasis). Always compose them together.

**Width utilities** — set `border-style: solid` and `border-width` on the specified sides using `--border-global-width`:

| Utility | Sides |
|---|---|
| `border-all` | All four sides |
| `border-top` | Top only |
| `border-bottom` | Bottom only |
| `border-left` | Left only |
| `border-right` | Right only |
| `border-horizontal` | Left + right |
| `border-vertical` | Top + bottom |

**Colour utilities** — set `border-color` only (no width):

| Utility | Token |
|---|---|
| `border-high` | `--border-color` / `--border-high-alpha` |
| `border-medium` | `--border-color` / `--border-medium-alpha` |
| `border-low` | `--border-color` / `--border-low-alpha` |

`border-focus` is the exception — it sets both width (`--border-focus-global-width`) and color in one class, since focus rings are always all-sides.

**Composition examples:**
```html
<!-- All-sides medium border -->
<div class="border-all border-medium">

<!-- Bottom divider only -->
<div class="border-bottom border-low">

<!-- Focus ring (combined utility) -->
<input class="border-focus">
```

#### Divider utilities

For standalone divider elements, use `divider` (horizontal) or `divider-vertical`. Both are structural-only — always compose with a colour utility.

| Utility | Element | Renders |
|---|---|---|
| `divider` | `<hr>` or `<div>` | 0-height block, top border only |
| `divider-vertical` | `<div>` | 0-width block, left border only, stretches to container height |

```html
<!-- Horizontal divider, default emphasis -->
<hr class="divider border-low">

<!-- Vertical divider between two items -->
<div class="flex items-center gap-3">
  <span>Left</span>
  <div class="divider-vertical border-low"></div>
  <span>Right</span>
</div>
```

`border-low` is the standard emphasis for standalone dividers (consistent with all major design systems). Use `border-medium` or `border-high` when stronger visual separation is needed.

Usage in Tailwind: `bg-brand-main`, `text-medium`, `border-all border-medium`, `bg-level2`, `bg-meaning-success`.

#### Action token usage summary

Hover and pressed states use a **state layer overlay** model. A brand-tinted overlay colour (`action-primary-overlay` / `action-secondary-overlay`) is composited on top of the base surface at two shared alpha values — one for hover, one for pressed. This means adding a new button variant requires only a new default colour; hover/pressed are automatic.

**Disabled buttons suppress all overlays.** Every `:disabled` rule explicitly sets `background-image: none` so that `:hover` and `:active` overlay rules — which have higher specificity in source order — cannot bleed through. Disabled buttons must show no visual response to pointer interaction.

| Token | States | Usage |
|---|---|---|
| `action-primary-*` | default + overlay (hover/pressed) + disabled | Buttons, checkboxes, dropdowns, progress bars |
| `action-secondary-*` | default + overlay (hover/pressed) + disabled | Secondary button fills, ghost button active states |
| `action-neutral-*` | default / disabled / filled | Inactive toggles, unselected tabs, neutral state fills |
| `action-primary-label-color` / `action-primary-label-disabled-color` | — | Label colour on primary buttons (default + disabled) |
| `action-secondary-outline-color` / `action-secondary-outline-disabled-color` | — | Border colour on secondary buttons (default + disabled) |
| `action-secondary-label-color` / `action-secondary-label-disabled-color` | — | Label colour on secondary buttons (default + disabled) |
| `action-tertiary-label-color` / `action-tertiary-label-disabled-color` | — | Label colour on tertiary/ghost buttons (default + disabled) |

Label and outline tokens both use composed text emphasis vars (`var(--text-high)`, `var(--text-disabled)`, etc.). This means outline colour, label colour, and emphasis alpha all resolve from the same chain — dark-mode switching is free and outline/label stay in sync by construction. The playground outline and label dropdowns both list the text emphasis vars only.

| Alpha token | Default | Role |
|---|---|---|
| `--action-overlay-hover-global-alpha` | 0.12 | Applied to overlay colour on hover |
| `--action-overlay-pressed-global-alpha` | 0.22 | Applied to overlay colour on pressed/active |

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

All 9 values are project-specific — replace from Figma. The `--chart-global-alpha: 0.81` var is defined in `_semantic-tokens.css` and can be adjusted per project if needed.

---

## Typography System

### Base variables — Size Scale: `f1`–`f15`

Sizes are generated using the **minor third musical interval (6:5 = 1.2×)** by default, each step snapped to the nearest multiple of 1.5px. Base is 9px. Five ratio presets are supported — see "Type scale presets" below.

**Generation method:** Start at 9px and multiply by the ratio repeatedly. Then snap each raw result to the nearest 1.5px multiple. 1.5px is the smallest unit that divides evenly into the most common screen densities, so all values remain crisp at integer pixel boundaries on 1×, 1.5×, and 2× displays.

$$f_n = \text{round}(9 \times r^{(n-1)} \div 1.5) \times 1.5$$

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

Each text role has its own font family, font weight, and letter-spacing CSS variable. All live in `src/_base.css`.

```css
/* src/_base.css */
:root {
  /* Font families — all default to Roboto */
  --font-display:   'Roboto', system-ui, sans-serif; /* d1–d3 */
  --font-heading:   'Roboto', system-ui, sans-serif; /* h1–h3 */
  --font-title:     'Roboto', system-ui, sans-serif; /* title-l, title-m, title-s, title-xs */
  --font-body:      'Roboto', system-ui, sans-serif; /* body-* */
  --font-label:     'Roboto', system-ui, sans-serif; /* label-*, overline-* */

  /* Font weights — one per role (body has regular + bold + italic separately) */
  --font-weight-display:      700;
  --font-weight-heading:      700;
  --font-weight-title:        700;
  --font-weight-body-regular: 400;
  --font-weight-body-bold:    700;
  --font-weight-body-italic:  400;
  --font-weight-label:        600;

  /* Letter spacing — in em units (scales proportionally with font size) */
  --letter-spacing-display:  0em;
  --letter-spacing-heading:  0em;
  --letter-spacing-title:    0em;
  --letter-spacing-body:     0em;
  --letter-spacing-label:    0em;
  --letter-spacing-overline: 0.167em; /* ~2px at the overline base size (12px) */
}
```

`--font-display` and `--font-heading` default to the same value and are typically a display or brand typeface. `--font-title` defaults to the same but is intentionally separate — card titles and section titles often follow the body typeface on projects where the display font would be too heavy at smaller sizes.

Body has three weight vars (`--font-weight-body-regular`, `--font-weight-body-bold`, and `--font-weight-body-italic`) because the same font family is used at different weights and styles within the body role. `--font-weight-body-italic` is the weight applied to italic body text (defaults to 400, but can be set to a lighter or heavier value when the italic variant of a variable font calls for it). All other roles use a single weight var.

**Letter spacing** is stored in `em` so it scales proportionally at every breakpoint. Every type class in `_components.css` applies `letter-spacing: var(--letter-spacing-{role})`. The overline default is `0.167em` — this matches the old hardcoded `2px` value at the overline base size of 12px.

### Type scale presets

The f/lb/lt/ld scale is generated by the formula:

$$f_n = \lfloor 9 \times r^{n-1} \div 1.5 \rceil \times 1.5$$

where $r$ is the ratio and values are snapped to the nearest 1.5px multiple. The leading scales are derived from the snapped f-values:

$$lb_n = \text{round}(f_n \times 1.5 \div 4) \times 4 \qquad lt_n = \text{round}(f_n \times 1.333 \div 4) \times 4 \qquad ld_n = \text{round}(f_n \times 1.25 \div 4) \times 4$$

Five ratio presets are available:

| Preset | Ratio | Character |
|---|---|---|
| Minor Second | 1.067 | Very subtle — nearly flat scale |
| Major Second | 1.125 | Subtle — good for dense UI |
| **Minor Third** | **1.200** | **Default — balanced drama** |
| Major Third | 1.250 | Noticeable jump between steps |
| Perfect Fourth | 1.333 | High contrast display scale |

The playground's **Type Scale** panel lets you select a preset, then override individual cells. The full 48-value snapshot (`f1`–`f15`, `lb1`–`lb8`, `lt1`–`lt15`, `ld6`–`ld15`) is written to `src/_base.css` on save, preserving any per-cell tweaks.

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
  letter-spacing: var(--letter-spacing-overline);
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

## Links

Three component classes handle all inline hyperlink use cases. They are **decoration-only** — colour is applied by composing `text-accent-*` or `text-*` utilities, so link intensity matches the surrounding text emphasis exactly.

### Classes

| Class | Colour default | Underline at rest | Underline on hover/focus |
|---|---|---|---|
| `.link` | None — pair with `text-accent-*` | Always visible, 40% alpha | Full `currentColor` |
| `.link-standalone` | None — pair with `text-accent-*` | None | Full `currentColor` |
| `.link-subtle` | None — pair with `text-*` | Always solid `currentColor` | No change |

### Usage pattern

```html
<!-- Inline link — high emphasis context -->
<p class="text-high">See <a class="text-accent-high link">related work</a>.</p>

<!-- Inline link — medium emphasis context -->
<p class="text-medium">Read the <a class="text-accent-medium link">full report</a> for details.</p>

<!-- Inline link — low emphasis context -->
<p class="text-low">Updated <a class="text-accent-low link">12 April 2026</a>.</p>

<!-- Standalone link -->
<a class="text-accent-medium link-standalone">View all results →</a>

<!-- Subtle link — dense text, footnotes, captions -->
<p class="text-low">Source: <a class="text-low link-subtle">Wikipedia, 2024</a>.</p>
```

### Rules

- **`.link`** — use inside sentences and paragraphs. Always pair with `text-accent-high`, `text-accent-medium`, or `text-accent-low` to match the surrounding body text emphasis (`text-high`, `text-medium`, or `text-low`). No default colour.
- **`.link-standalone`** — use for links that stand alone outside body text (e.g. "View all →" after a card, resource links in footers). No underline at rest; hover reveals it. Pair with a `text-accent-*` utility. No default colour.
- **`.link-subtle`** — use when accent colour would be visually overwhelming in dense text. Pair with the same `text-*` utility as the surrounding text. Always-solid underline is mandatory since it is the only visual differentiator from surrounding text.
- **Never use any link class without a colour companion** — without an explicit `text-accent-*` (or `text-*` for `.link-subtle`), there is no colour and no visual distinction from plain text.
- **No visited state in base** — projects that need visited styling (documentation sites, editorial) add `:visited` rules themselves.
- **Focus**: all three classes use the standard `2px solid --border-focus-color` outline with `outline-offset: 2px`, consistent with buttons and form controls.

### Browser baseline

`color-mix(in srgb, ...)` used by `.link` requires Chrome 111+, Firefox 113+, Safari 16.2+. This is the same baseline required by Tailwind v4 itself.

---

## Elevation System

Elevation is expressed by **both** a surface colour token and a shadow token together. In light mode, both apply. In dark mode, surfaces resolve to tinted values, no shadows are applied, and `border-low` (`--border-color` at `--border-low-alpha`, 12%) is used on all elevated elements to delineate them.

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

All three layers share the same colour: `--shadow-color` (default `p30`, raw RGB channels from `_base.css`). Only the geometry (offsets and blur) and the per-layer alphas differ. This means you can change the shadow tint globally by editing `--shadow-color` in one place, and tune darkness per-layer via the three alpha vars.

> **Dark mode**: shadows are not rendered in dark mode. Elevation is communicated entirely through surface lightness. The `shadow-level*` tokens are defined but their visual effect is suppressed — do not apply them in dark mode. Exception: `shadow-level1-inner` is an inset shadow for recessed interactive elements (inputs, toggles) and remains visible in dark mode.

| Token | Paired surface |
|---|---|
| `shadow-level1` | `level1` |
| `shadow-level1-inner` | `level1` — inset well shadow for inputs, toggles, and other recessed controls. Single-layer inset using `--shadow-inner-global-alpha`. Stays visible in dark mode. |
| `shadow-level2` | `level2`, `level2a` |
| `shadow-level3` | `level3` |
| `shadow-level4` | `level4` |
| `shadow-level5` | `level5` |

### Dark mode

The `level*` token names stay the same in dark mode. The CSS variables they reference resolve to different values:

- **Surfaces**: progressively lighter opacities of white layered on the dark base — each higher level gets slightly more white, pushing elements visually closer to the screen
- **Shadows**: not rendered in dark mode — elevation is communicated entirely through surface lightness
- **Borders**: `border-low` (`--border-color` / `--border-low-alpha` = 12%) applied as a default border on all elevated elements. This is the primary way surfaces are visually separated from each other in dark mode.
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

Defined in `src/_base.css`. The `sh{h}` tokens are the raw vocabulary — see [Shape Scale](#shape-scale) for the full scale. Each token encodes the component height it is designed for; the value is exactly one-eighth of that height.

### Semantic shape tokens

Each shape token corresponds to a component height tier. When a project overrides the shape system, it sets the semantic vars only — component classes and markup are unaffected.

At `scr-l`, a component steps up one height tier and one shape tier simultaneously.

| Shape token | Base token | Radius | Component height | Sample components |
|---|---|---|---|---|
| `--shape-xxs` | `sh16` | 2px | 16px | checkboxes, radios, `.input-xs` |
| `--shape-xs` | `sh32` | 4px | 32px | `.btn-xs`, `.btn-icon-xs`, `.input-s`, `.chip` |
| `--shape-s` | `sh40` | 5px | 40px | `.btn-s`, `.btn-icon-s`, `.input-m` |
| `--shape-m` | `sh48` | 6px | 48px | `.btn-m`, `.btn-icon-m`, `.input-l` |
| `--shape-l` | `sh56` | 7px | 56px | `.btn-l`, `.btn-icon-l`, `.input-xl` |
| `--shape-xl` | `sh64` | 8px | 64px | `.btn-xl`, `.btn-icon-xl` |
| `--shape-xxl` | `sh72` | 9px | 72px | `.btn-xl` at scr-l, `.btn-icon-xl` at scr-l |
| `--shape-full` | `sh-full` | 9999px | any | chips, badges, radios, toggles, icon buttons (default) |

```css
/* src/_semantic-tokens.css */
:root {
  --shape-xxs:     var(--sh16);   /* 2px — 16px checkboxes/radios */
  --shape-xs:      var(--sh32);    /* 4px — 32px height */
  --shape-s:       var(--sh40);    /* 5px — 40px height */
  --shape-m:       var(--sh48);    /* 6px — 48px height */
  --shape-l:       var(--sh56);    /* 7px — 56px height */
  --shape-xl:      var(--sh64);    /* 8px — 64px height */
  --shape-xxl:     var(--sh72);    /* 9px — 72px height */
  --shape-full:    var(--sh-full); /* 9999px — pill shape */
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
| `.btn-xs` | 32px (`g4`) | 40px (`g5`) | `px-g2h` | `.label-xs` | `--shape-xs` → `--shape-s` |
| `.btn-s` | 40px (`g5`) | 48px (`g6`) | `px-g3` | `.label-s` | `--shape-s` → `--shape-m` |
| `.btn-m` | 48px (`g6`) | 56px (`g7`) | `px-g4` | `.label-m` | `--shape-m` → `--shape-l` |
| `.btn-l` | 56px (`g7`) | 64px (`g8`) | `px-g4` | `.label-l` | `--shape-l` → `--shape-xl` |
| `.btn-xl` | 64px (`g8`) | 72px (`g9`) | `px-g5` | — (f6/lb6, no named class) | `--shape-xl` → `--shape-xxl` |

| Class | Description |
|---|---|
| `.btn` | Base: `w-fit flex flex-row place-items-center` + transition |
| `.btn-tight` | Collapses `px` to 0; expands to full padding on hover/focus |
| `.btn-primary` | Brand fill (`action-primary-default`), inverted text, `shadow-level2`; hover/pressed → `action-primary-overlay` composited at `--action-overlay-alpha-hover/pressed`; disabled → flat fill, no overlay, no shadow |
| `.btn-secondary` | Transparent, `text-high` border + label (`action-secondary-outline-color` = `action-secondary-label-color`); disabled → `text-disabled` border + label, no overlay; hover/pressed → `action-secondary-overlay` composited at overlay alpha |
| `.btn-tertiary` | Text only; hover/pressed → `action-secondary-overlay` composited at overlay alpha; disabled → `text-disabled` label, no overlay |

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
| `.btn-icon-primary` | `action-primary-default` bg; hover/pressed → `action-primary-overlay` at overlay alpha; disabled → flat disabled fill, no overlay |
| `.btn-icon-secondary` | Transparent with brand border; hover/pressed → `action-secondary-overlay` at overlay alpha; disabled → disabled border + label, no overlay |
| `.btn-icon-tertiary` | No background; hover/pressed → `action-secondary-overlay` at overlay alpha; disabled → `text-disabled` label, no overlay |

### Typography classes

Responsive size mapping — three change points: `tab-s`, `scr-s`, `scr-l`.

| Role | Class | Mobile | `tab-s` | `scr-s` | `scr-l` | Leading | Font var |
|---|---|---|---|---|---|---|---|
| Display Hero | `.d1` | f8 | f10 | f12 | f14 | `ld` | `--font-display` |
| Display Medium | `.d2` | f8 | f8 | f11 | f13 | `ld` | `--font-display` |
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
| Label Extra Small | `.label-xs` | f2 | f2 | f2 | f3 | `lb` | `--font-label` |
| Overline XL | `.overline-xl` | f3 | f4 | f5 | f6 | `lb` | `--font-label` |
| Overline Large | `.overline-l` | f3 | f3 | f3 | f4 | `lb` | `--font-label` |
| Overline Medium | `.overline-m` | f2 | f2 | f2 | f3 | `lb` | `--font-label` |
| Overline Small | `.overline-s` | f1 | f1 | f1 | f2 | `lb` | `--font-label` |

All display/heading/title classes: weight 700. All body classes: weight 400. All label classes: weight 600, **not uppercase**. All overline classes: weight 600, `text-transform: uppercase`, `letter-spacing: 2px`.

### Form inputs

`.input` is a **wrapper `<div>`**. The bare `<input>` element goes inside as `.input-field`. Optional `.input-leading` / `.input-trailing` slots hold icons, prefixes, or spinners. When no slots are needed, omit them — no markup penalty.

```html
<!-- Minimal (no icons) -->
<div class="input input-m">
  <input class="input-field" placeholder="Write here">
</div>

<!-- With icon slots -->
<div class="input input-m">
  <svg class="input-leading">...</svg>
  <input class="input-field" placeholder="Search">
  <svg class="input-trailing">...</svg>
</div>
```

**Background**: always `action-neutral-filled-color` — no empty/populated flip.
**Known limitation**: browser autofill overrides the background colour. Not patched in v1.

#### Size classes

| Class | Mobile–scr-s | scr-l | Radius |
|---|---|---|---|
| `.input-xs` | 24px | 32px | `--shape-xxs` → `--shape-xs` |
| `.input-s` | 32px | 40px | `--shape-xs` → `--shape-s` |
| `.input-m` | 40px | 48px | `--shape-s` → `--shape-m` |
| `.input-l` | 48px | 56px | `--shape-m` → `--shape-l` |
| `.input-xl` | 56px | 64px | `--shape-l` → `--shape-xl` |

#### State rules

| Class / selector | Description |
|---|---|
| `.input` | Wrapper: `flex items-center gap-g1 px-g2`, `action-neutral-filled` bg, `border-medium` at rest |
| `.input-field` | Inner `<input>`: `flex: 1`, transparent bg, `font: inherit`, `color: inherit` |
| `.input-leading` / `.input-trailing` | Icon slots: `flex shrink-0`, inherit colour from wrapper |
| hover | `border-high-alpha`. Suppressed when disabled, read-only, or error |
| `.input-error` | `meaning-error` border at rest. Source-order before focus rule so focus can override while active |
| `:focus-within` | `border-focus` + `shadow-level1-inner`. Not applied when read-only or disabled |
| `:has(.input-field:disabled)` | `action-secondary-disabled` bg, `text-disabled-alpha`, `pointer-events: none` |
| `:has(.input-field:read-only)` | `action-secondary-disabled` bg, `text-medium` (full opacity), `cursor: text`. No hover/focus affordances |

#### Below-field elements

| Class | Description |
|---|---|
| `.input-error-msg` | Red error text below the field. Add `aria-invalid="true"` to `.input-field` and wire `aria-describedby` to this element's `id` |
| `.input-hint` | Persistent neutral helper text below the field. `text-medium`. Automatically hidden via sibling selector if `.input-error` is also present |

Hint and error are mutually exclusive by convention — swap them at validation time.

---

### Textarea

`.textarea` is a **wrapper `<div>` with `display: block`** (not flex — required for `resize: vertical` to work naturally). The bare `<textarea>` goes inside as `.textarea-field`. No icon slots.

```html
<div class="textarea textarea-m">
  <textarea class="textarea-field" placeholder="Write here"></textarea>
</div>
```

All state rules mirror `.input` exactly: hover, focus + inner shadow, disabled, read-only, error.

#### Size classes

| Class | Min-height (mobile) | Min-height (scr-l) | Radius |
|---|---|---|---|
| `.textarea-xs` | 24px | 32px | `--shape-xxs` → `--shape-xs` |
| `.textarea-s` | 32px | 40px | `--shape-xs` → `--shape-s` |
| `.textarea-m` | 40px | 48px | `--shape-s` → `--shape-m` |
| `.textarea-l` | 48px | 56px | `--shape-m` → `--shape-l` |
| `.textarea-xl` | 56px | 64px | `--shape-l` → `--shape-xl` |

`.textarea-field` uses `resize: vertical` — users can drag to expand. Min-height is the floor.

---

### Field wrapper

`.field` is an optional structural wrapper that pairs a label with an input or textarea. `.input` / `.textarea` work standalone without it.

```html
<div class="field">
  <label class="field-label" for="email">Email</label>
  <div class="input input-m">
    <input class="input-field" id="email" placeholder="you@example.com" required>
  </div>
  <span class="input-hint" id="email-hint">We'll never share your email</span>
</div>
```

| Class | Description |
|---|---|
| `.field` | `flex-col`. No gap — uses margins on children for different label/hint spacing |
| `.field-label` | `text-medium`. `margin-bottom: g0h` (tight — label belongs to its field). No typography set — inferred from input size via `:has()` |

#### Label auto-sizing

The label picks up body type automatically based on the size class of the contained input or textarea. No size class needed on the label itself.

| Input size | Label typography |
|---|---|
| `.input-xs` / `.textarea-xs` | `body-xxs` (f1 → f2 at scr-l) |
| `.input-s` / `.textarea-s` | `body-xs` (f2 → f3 at scr-l) |
| `.input-m` / `.textarea-m` | `body-s` (f3 → f4 at scr-l) |
| `.input-l` / `.textarea-l` | `body-m` (f4 → f5 at scr-l) |
| `.input-xl` / `.textarea-xl` | `body-l` (f5 → f6 at scr-l) |

#### Required asterisk

No extra class needed. `.field:has(:required) .field-label::after` appends a red `*` automatically when the inner `<input>` or `<textarea>` has the HTML `required` attribute.

#### Label state rules

| Condition | Label colour |
|---|---|
| `.input-field:disabled` or `.textarea-field:disabled` inside `.field` | `text-disabled-alpha` (dimmed) |
| `.input-field:read-only` or `.textarea-field:read-only` inside `.field` | `text-disabled-alpha` (dimmed) |
| `.input-error` inside `.field` | `meaning-error` (red) |

### Checkboxes and radios

| Class | Description |
|---|---|
| `.checkbox` | 16×16px (scr-l: 20×20px), `--shape-xxs`. Unchecked: `border-medium`. Checked: `action-primary-default` fill, white tick. Indeterminate: `action-primary-default` fill, white dash. |
| `.radio` | 16×16px (scr-l: 20×20px), `--shape-full`. Unchecked: `border-medium`. Checked: outer ring `action-primary-default`, filled centre dot. |
| `.checkbox:disabled`, `.radio:disabled` | `action-secondary-disabled` fill/border, no pointer events |

### Toggles

| Class | Description |
|---|---|
| `.toggle` | Pill track (32×16px, scr-l: 40×20px), `--shape-full`. Off: `action-neutral-default` track. On: `action-primary-default` track. Thumb is white, `--shape-full`, with `shadow-level2`. |
| `.toggle:disabled` | `action-secondary-disabled` / `action-neutral-disabled` fills |

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

---

## Engineering Decisions

### Shape token naming — `--shape-xxs` replaces `--shape-control`

**Decision:** The `--shape-control` semantic token was renamed to `--shape-xxs`.

**Rationale:** All other semantic shape tokens are named by size tier (`xs`, `s`, `m`, `l`, `xl`, `xxl`, `full`). `--shape-control` broke the pattern by encoding a component category (controls) rather than a size. A size-based name is more composable — any future component at 16px height can use `--shape-xxs` without the name implying it is a form control. The full scale is now `xxs → xs → s → m → l → xl → xxl → full`.

**Files changed:** `src/_semantic-tokens.css`, `src/_components.css`, `playground/index.html`, `docs/MODS Design System.md`.

---

### Playground APCA table — reads mode-specific base vars directly

**Problem:** `rebuildAPCA()` was reading the active alias vars (`--text-high-alpha`, `--border-high-alpha`, etc.) via `getComputedStyle(document.documentElement)`. These active aliases are re-pointed to their dark-mode base vars inside a `.dark {}` rule on `body`, not on `:root`. So `documentElement` always resolved through the light chain regardless of which mode the playground was in. Nudging a dark alpha input wrote the correct base var but the APCA table never reflected it.

**Decision rejected:** Keeping both light and dark input rows always visible, bridged by the active alias. This approach requires a three-layer chain (base var → active alias → APCA read) and the bug falls out of the gap between `documentElement` and `body` scope. It also makes the APCA table permanently ambiguous — you cannot validate dark alphas against a light surface or vice versa.

**Decision adopted:** `rebuildAPCA()` now reads mode-specific base vars directly, e.g. `--text-high-dark-alpha` or `--text-high-light-alpha`, chosen by `isDark()` at call time. The playground CSS already hides the inactive alpha row (`.pg-text-alpha-light` / `.pg-text-alpha-dark`) via `body:not(.dark)` / `body.dark` selectors. The invariant "visible inputs = active mode = APCA context" is now enforced at the DOM level rather than by CSS cascade indirection.

**Files changed:** `playground/playground.js`.
