# MODS Agent Guide

This guide is the canonical workflow for branding a fresh MODS instance. Follow these steps in order. Do not skip ahead — later steps depend on decisions made in earlier ones.

For the full token reference (naming convention, all token tables, system rationale) see [`MODS Design System.md`](MODS%20Design%20System.md).

---

## What `/mods/` is

`/mods/` is a fully mutable, project-specific instance of the MODS design system. There is no upstream to stay in sync with — you own every file. Edit `src/` directly, compile, and the host project consumes `dist/style.css`.

**The host project never touches `/mods/src/` CSS variables from outside.** All brand customisation happens by editing the source files inside `/mods/` and recompiling.

---

## Setup

Run these commands from the **host project root**:

```bash
git clone <mods-repo-url> mods   # clone MODS into the host project
rm -rf mods/.git                  # detach from upstream — kills the nested git repo
echo "mods/" >> .gitignore        # hide the tool tree from host git and VS Code
cd mods && npm install
npm run build:css                 # confirm baseline compiles → dist/style.css
```

If `dist/style.css` is produced without errors, the baseline is healthy. Proceed to Step 1.

To uninstall MODS later: `rm -rf mods/` is always safe — the compiled CSS published to `MODS_DEST` (see Step 6) is what production uses, and that file lives in the host's tracked tree.

---

## Step 1 — Palette (`src/_base.css`, USER EDITABLE → PALETTE)

The PALETTE block at the top of `_base.css` contains raw RGB channel values only. No `var()` references are allowed inside this block. The build will not error if you add them, but it will break the alpha-composition pattern used throughout the system.

### Primary, secondary, and neutral palettes

Replace the RGB channel values for `--p*` (primary), `--s*` (secondary), and `--n*` (neutral).

**Generate palettes using Google's Material Theme Builder Figma plugin.** It produces a full tonal palette in the HCT colour space. Steps map directly: `p10` = tone 10, `p40` = tone 40, and so on. Copy the HEX values, convert to space-separated RGB channels (no `rgb()` wrapper), and paste them in.

```css
/* Example — replace with the project's actual palette */
--p10: 0 25 68;
--p40: 61 93 158;
--p80: 175 198 255;
```

Do not use HSB or HSL to hand-pick steps — those colour spaces are perceptually uneven and will produce mismatched contrast ratios across hues.

### Meaning tones

Meaning colours are not full palettes. Two fixed tones per meaning: a light-mode tone (`30`) and a dark-mode tone (`70`).

```css
--r30: 220 80  80;   /* error — light mode */
--r70: 255 140 140;  /* error — dark mode  */
--y30: 180 140 20;   /* alert — light mode */
--y70: 255 210 80;   /* alert — dark mode  */
--g30: 40  140 80;   /* success — light mode */
--g70: 100 220 140;  /* success — dark mode  */
```

Replace these from Figma alongside the main palettes.

### Alpha and scalar vars

The alpha scales (text, border, action, surface), border widths, blur values, and shadow alphas live in the BASE VARS block of `_base.css` (still in the USER EDITABLE section). They are rarely changed per project. Only edit them if the project has a specific contrast or visual density requirement.

---

## Step 2 — Semantic tokens (`src/_semantic-tokens.css`)

This file maps the raw palette steps to named semantic roles. Every colour token follows the **Variables Naming Pattern**:

1. `--{cat}-{prop}-light-color` / `--{cat}-{prop}-dark-color` — hold the raw palette step
2. `--{cat}-{prop}-color` — the active alias, points to the light set by default
3. `.dark {}` at the bottom of the file re-points aliases to the dark set

After changing `_base.css`, walk through `_semantic-tokens.css` and re-point the light and dark base vars to the correct steps for the new brand. The active aliases and the `.dark {}` block do not need editing — they reference the base vars by name and will automatically resolve the new values.

### What to re-point

| Section | Key decisions |
|---|---|
| Surfaces | Which neutral steps to use for `base`, `l1`–`l5`, and `invert` |
| Text | Which neutral/primary step reads well as the main text colour; which primary step for accent |
| Borders | Which neutral step for default borders; which primary step for focus rings |
| Actions | Which primary steps for buttons (default + hover overlay); which neutral steps for inactive states; which steps for button label/outline colours (primary-label, secondary-outline, secondary-label, tertiary-label — each has a default and disabled variant) |
| Meaning | Only needed if you changed `--r*`, `--y*`, `--g*` in `_base.css` |
| Brand | `--brand-main-color` — the single brand accent used in logo/wordmark contexts |
| Shadow | `--shadow-color` defaults to `p30`; change if the primary palette produces an odd shadow tint |
| Charts | `--chart-1` through `--chart-9` — replace from Figma per project |

### Token naming rule

```
--{category}-{type}-{mode}-{property}
```

Active aliases omit `{mode}` — mode is resolved at runtime by `.dark {}`. Full spec in [`MODS Design System.md`](MODS%20Design%20System.md).

### Using the playground to re-point tokens

The playground provides live dropdowns for all semantic colour tokens — no need to edit `_semantic-tokens.css` by hand for colour decisions. Open `http://localhost:3001`, select a token category panel (Surfaces, Text, Borders, Actions), pick palette steps from the dropdowns, and hit **Save**. The server rewrites the relevant vars in `_semantic-tokens.css` and triggers a rebuild.

**How the server writes semantic tokens.** The playground sends the active alias name (e.g. `action-primary-default-color`) plus a mode (`light` or `dark`). The server resolves this to the matching base var by inserting the mode before the last dash-segment (the property): `action-primary-default-color` → `action-primary-default-light-color`. It writes only to base vars in `:root {}`; the active aliases and `.dark {}` block are never touched. If you ever see an active alias pointing directly to a palette step (e.g. `var(--p80)` instead of `var(--action-primary-default-light-color)`), that means a save corrupted it — restore it to point at its `-light-color` base var.

Palette swatches show an **in-use** tag on any step that is currently referenced by at least one semantic token. This makes it easy to see at a glance which steps are load-bearing and which are free to reassign.

Button label and outline colours (primary label, secondary outline + label, tertiary label, and all disabled variants) have their own dropdown rows in the **Actions** panel, covering both light and dark modes. **Label dropdowns** offer the 8 pre-composed text emphasis vars only — `text-high`, `text-medium`, `text-low`, `text-disabled`, `text-invert-high`, `text-invert-medium`, `text-invert-low`, `text-invert-disabled`. These vars combine a text colour alias with an emphasis alpha and auto-switch in dark mode. **Outline dropdowns** remain on palette steps.

**Cross-category alias preservation.** When the server reads `_semantic-tokens.css` to populate dropdowns, it resolves alias chains to their leaf value — but stops when it encounters a semantic active alias from a different category. This means if you save `action-primary-label-light-color: var(--text-invert-high)`, the dropdown will reload showing `text-invert-high`, not the raw palette step it ultimately resolves to.

---

## Step 3 — Component pruning (`src/_components.css`)

Delete any `@layer components` blocks the project does not need. Each block is self-contained — removing one has no effect on the others.

Common candidates for removal:
- Chart colour utilities if the project has no data visualisation
- Display typography classes (`d1`–`d3`) if the project has no hero/editorial text
- Elevation classes for surface levels that will never appear in the UI

Do not delete the base typography classes (`.h1`–`.h3`, `.body-*`, `.label-*`) unless you are replacing the entire type system with a project-specific one.

---

## Step 4 — Fonts (`src/_base.css`, USER EDITABLE → TYPE SCALE + FONT FAMILIES)

Fonts live entirely in `_base.css`:

1. The Google Fonts `@import` URL on line 1 (must stay first per CSS spec).
2. The `@theme {}` block — font variables, font sizes (`--font-size-f*`), and line heights.
3. The BASE VARS block — font-weight variables and letter-spacing variables.

If the project uses a typeface other than Jost:

1. Replace the Google Fonts `@import` URL on line 1 of `_base.css` with the new font(s)
2. Update the `--font-*` variables in the TYPE SCALE + FONT FAMILIES block:

```css
@theme {
  --font-display: 'YourFont', system-ui, sans-serif;
  --font-heading: 'YourFont', system-ui, sans-serif;
  --font-title:   'YourFont', system-ui, sans-serif;
  --font-body:    'YourFont', system-ui, sans-serif;
  --font-label:   'YourFont', system-ui, sans-serif;
}
```

`--font-display` and `--font-heading` are typically a brand/display typeface. `--font-title` is intentionally separate — card and section titles often follow the body typeface where a display font would be too heavy at smaller sizes.

> **Using `_base.css` as a partial (imported by a host entry file)?** CSS requires all `@import` rules before any other rules. When `_base.css` is pulled in via `@import "mods/_base.css"` from a host `globals.css`, the Google Fonts `@import` on line 1 ends up after `@import "tailwindcss"` in the processed output and is silently dropped by the parser. Fix: move the `@import url('https://fonts.googleapis.com/...')` line to the very top of your host entry file and remove it from `_base.css`. Importing partials directly is not the recommended consumption path — see Step 6 for the standard workflow.

### Font weights

Each font role has a dedicated weight variable in the BASE VARS block of `_base.css`:

```css
:root {
  --font-weight-display:      700;
  --font-weight-heading:      700;
  --font-weight-title:        700;
  --font-weight-body-regular: 400;
  --font-weight-body-bold:    700;
  --font-weight-label:        600;
}
```

Body has two weight vars because the same font family is used at both weights within the body role. All component classes in `_components.css` reference these vars — changing a weight var affects every component in that role.

### Letter spacing

Six letter-spacing variables live in the BASE VARS block of `_base.css`, one per role (stored in `em` so they scale with each element's own font size):

```css
:root {
  --letter-spacing-display:  0em;
  --letter-spacing-heading:  0em;
  --letter-spacing-title:    0em;
  --letter-spacing-body:     0em;
  --letter-spacing-label:    0em;
  --letter-spacing-overline: 0.167em; /* ~2px at 12px */
}
```

The overline default matches the old hardcoded `2px` value. Every type class in `_components.css` references `letter-spacing: var(--letter-spacing-{role})`, so adjusting these vars affects all classes in that role simultaneously.

The playground's **Letter Spacing** panel lets you edit these live. Enter a value as a plain percentage (e.g. `5` → `0.05em`). A px reference label shows the approximate pixel equivalent at that role's base size.

### Type scale

The f-scale (font sizes) and lb/lt/ld (line heights) live in the TYPE SCALE + FONT FAMILIES block of `_base.css`. To regenerate from a different ratio, use the playground's **Type Scale** panel: select a preset (Minor Second through Perfect Fourth), optionally tweak individual cells in the editable grid, then save — the server rewrites all 48 tokens in `_base.css` from the snapshot.

If you prefer to edit `_base.css` directly, the token names are `--font-size-f1` through `--font-size-f15`, `--line-height-lb1`–`lb8`, `--line-height-lt1`–`lt15`, `--line-height-ld6`–`ld15`.

---

## Step 5 — Rebuild (local check)

```bash
npm run build:css
```

This produces `dist/style.css` inside the MODS tool directory for use by the playground. `npm run pack` (Step 6) runs this build automatically, so you only need to call this step directly when iterating inside the playground without publishing to the host yet.

---

## Step 6 — Pack to host project

```bash
MODS_DEST=<path/to/host/styles/mods.css> npm run pack
```

`MODS_DEST` is a **file path** (not a directory) relative to the MODS tool directory, pointing to where the compiled CSS should live in the host's tracked tree. Examples:

```bash
# MODS tool at host/mods/, compiled CSS published to host/src/styles/mods.css
MODS_DEST=../src/styles/mods.css npm run pack

# MODS tool at store/mods/, compiled CSS at project root styles/
MODS_DEST=../../styles/mods.css npm run pack
```

The script:
1. Runs `npm run build:css` to produce a fresh `dist/style.css`.
2. Copies `dist/style.css` to `MODS_DEST` (creates parent directories if needed).
3. Writes a token snapshot to `<MODS_DEST_dir>/mods-snapshot/` — see **Token snapshot** below.
4. Warns if `MODS_DEST` is gitignored (the compiled CSS must reach CI).

Run `pack` every time you change tokens and want the host to pick up the changes.

### Token snapshot

Alongside the compiled CSS, `pack` writes a `mods-snapshot/` folder:

```
<MODS_DEST_dir>/
  mods.css              ← compiled CSS (host imports this)
  mods-snapshot/
    _base.css           ← verbatim copy of src/_base.css at pack time
    _semantic-tokens.css
    README.md           ← restore instructions + agent prompt
```

The snapshot is git-tracked and survives a MODS tool deletion. If you re-clone MODS and need to restore your palette and token decisions, open `mods-snapshot/README.md` and follow the agent restore prompt there. The agent reads both the snapshot and the fresh source files, copies only USER EDITABLE values, and reports any tokens that are new or have been removed between versions.

---

## Host project integration

### CSS import

In the host project's CSS entry point (e.g. `globals.css`), import the compiled CSS file published by `pack`:

```css
/* At the very top of globals.css — before @import "tailwindcss" */
@import url('https://fonts.googleapis.com/css2?family=...');

@import "tailwindcss";
@import './styles/mods.css';   /* adjust path to match MODS_DEST */
```

The Google Fonts `@import` must be the first line in the entry file. Do not rely on the one inside `mods/src/_base.css` — when `_base.css` is processed as part of a larger CSS pipeline, that `@import` lands after `@import "tailwindcss"` and is silently dropped by the CSS parser.

### Gitignore

The MODS tool directory (`mods/`) must be gitignored so VS Code and host git do not treat it as a nested repository. The compiled CSS file at `MODS_DEST` must **not** be gitignored — it is what CI and production use.

```gitignore
# .gitignore in host project root
mods/                   # hide the MODS tool tree
# Do NOT add the MODS_DEST path here — e.g. src/styles/mods.css must be tracked
```

The `pack` script checks automatically and warns if `MODS_DEST` is being ignored.

### Proxy build script

Add to the host project's `package.json` so pack can be triggered from the host root (no need to `cd mods/` first). `pack` already runs the build internally, so only one command is needed:

```json
{
  "scripts": {
    "build:mods": "MODS_DEST=<path-to-mods-dest> npm --prefix <path-to-mods-tool> run pack"
  }
}
```

Example for a project where the MODS tool lives at `mods/` and the compiled CSS goes to `src/styles/mods.css`:

```json
{
  "scripts": {
    "build:mods": "MODS_DEST=../src/styles/mods.css npm --prefix mods run pack"
  }
}
```

### Wiring up agent instructions

MODS ships no `.instructions.md` file to avoid colliding with the host project's own agent configuration. To make Copilot and other agents aware of this guide when working inside `/mods/`, add one line to the host project's own instructions file (e.g. `.github/instructions/project.instructions.md`):

```
When working with files inside /mods/, follow the workflow in mods/docs/AGENT_GUIDE.md.
```

---

## What not to touch

| File / section | Notes |
|---|---|
| `src/_base.css` → DO NOT EDIT | Breakpoints, spacing scale (g0–g25), shadow geometry literals. System-wide, rarely changed. Only edit if the project requires a fundamentally different spatial grid or shadow language. |
| `src/_base.css` → TAILWIND THEME COMPOSITION | The `@theme inline {}` block at the bottom of the file. Changing it adds/removes utility categories. Edit only with intent. |
| `src/style.css` | Entry point import chain — only edit to add or remove partial files. |
| `dist/style.css` | Compiled output — never edit by hand, always overwritten by the build. |
| `server.js` | Playground dev server — leave as-is unless modifying the playground itself. |

---

## Playground engineering notes

### Dark-mode live token cascade
Semantic tokens are declared in `:root {}` (light) and `body.dark {}` (dark). When the playground applies a live token change via `setProperty`, the target element matters: a CSS class rule on `body` wins over an inline style set further up on `html` (`document.documentElement`). All live dark-mode overrides in `playground.js` must therefore write to `document.body`, not `document.documentElement`. Use the `liveTokenTarget()` helper — it returns `document.body` in dark mode and `document.documentElement` in light mode — for any `setProperty` call that is mode-specific.

### Playground spacing convention
All `gap`, `padding`, and `margin` values in `playground.css` must use spacing tokens (`var(--spacing-g*)`) rather than hardcoded pixel values. This keeps the playground chrome consistent with the design system's spatial grid.
