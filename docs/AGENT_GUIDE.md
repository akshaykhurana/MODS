# MODS Agent Guide

This guide is the canonical workflow for branding a fresh MODS instance. Follow these steps in order. Do not skip ahead — later steps depend on decisions made in earlier ones.

For the full token reference (naming convention, all token tables, system rationale) see [`MODS Design System.md`](MODS%20Design%20System.md).

---

## What `/mods/` is

`/mods/` is a fully mutable, project-specific instance of the MODS design system. There is no upstream to stay in sync with — you own every file. Edit `src/` directly, compile, and the host project consumes `dist/style.css`.

**The host project never touches `/mods/src/` CSS variables from outside.** All brand customisation happens by editing the source files inside `/mods/` and recompiling.

---

## Setup

```bash
cd mods
npm install
npm run build:css    # confirm baseline compiles → dist/style.css
```

If `dist/style.css` is produced without errors, the baseline is healthy. Proceed to Step 1.

---

## Step 1 — Palette (`src/_base.css`)

This file contains raw RGB channel values only. No `var()` references are allowed anywhere in this file. The build will not error if you add them, but it will break the alpha-composition pattern used throughout the system.

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

The alpha scales (text, border, action, surface), border widths, blur values, and shadow alphas in `_base.css` are rarely changed per project. Only edit them if the project has a specific contrast or visual density requirement.

---

## Step 2 — Semantic tokens (`src/_semantic-tokens.css`)

This file maps the raw palette steps to named semantic roles. Every colour token follows **Pattern 1**:

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
| Actions | Which primary steps for buttons (default + hover); which neutral steps for inactive states |
| Meaning | Only needed if you changed `--r*`, `--y*`, `--g*` in `_base.css` |
| Brand | `--brand-main-color` — the single brand accent used in logo/wordmark contexts |
| Shadow | `--shadow-color` defaults to `p30`; change if the primary palette produces an odd shadow tint |
| Charts | `--chart-1` through `--chart-9` — replace from Figma per project |

### Token naming rule

```
--{category}-{type}-{mode}-{property}
```

Active aliases omit `{mode}` — mode is resolved at runtime by `.dark {}`. Full spec in [`MODS Design System.md`](MODS%20Design%20System.md).

---

## Step 3 — Component pruning (`src/_components.css`)

Delete any `@layer components` blocks the project does not need. Each block is self-contained — removing one has no effect on the others.

Common candidates for removal:
- Chart colour utilities if the project has no data visualisation
- Display typography classes (`d1`–`d3`) if the project has no hero/editorial text
- Elevation classes for surface levels that will never appear in the UI

Do not delete the base typography classes (`.h1`–`.h3`, `.body-*`, `.label-*`) unless you are replacing the entire type system with a project-specific one.

---

## Step 4 — Fonts (`src/_fonts.css`)

If the project uses a typeface other than Roboto:

1. Replace the Google Fonts `@import` URL with the new font
2. Update the font-role CSS variables:

```css
:root {
  --font-display:  'YourFont', system-ui, sans-serif;
  --font-heading:  'YourFont', system-ui, sans-serif;
  --font-title:    'YourFont', system-ui, sans-serif;
  --font-body:     'YourFont', system-ui, sans-serif;
  --font-label:    'YourFont', system-ui, sans-serif;
}
```

`--font-display` and `--font-heading` are typically a brand/display typeface. `--font-title` is intentionally separate — card and section titles often follow the body typeface where a display font would be too heavy at smaller sizes.

---

## Step 5 — Rebuild

```bash
npm run build:css
```

This produces `dist/style.css` inside the MODS tool directory. That file is used by the playground only — it is not what the host project imports.

---

## Step 6 — Pack to host project

```bash
MODS_DEST=<path-to-mods-dir-in-host> npm run pack
```

`MODS_DEST` is a path relative to the MODS tool directory. Examples:

```bash
# MODS tool at store/mods/, host mods/ dir at project root
MODS_DEST=../../mods npm run pack

# MODS tool at mods/, host mods/ dir one level up
MODS_DEST=../mods npm run pack
```

This copies the five source partials to `MODS_DEST`:

```
_base.css
_components.css
_fonts.css
_semantic-tokens.css
_theme.css
```

The host project's own Tailwind build processes these files — the `@theme` block in `_theme.css` must be visible to the host's compiler so it can generate utility classes from the design tokens. **Never point the host at `dist/style.css`** — the pre-compiled output bypasses the host's build and no MODS-derived utilities will be generated.

The script will warn you if the host `.gitignore` contains a rule that would hide the packed files from git.

Run `pack` every time you rebuild after changing any source partial.

---

## Host project integration

### CSS import

In the host project's CSS entry point (e.g. `globals.css`), import the five partials:

```css
@import './mods/_theme.css';
@import './mods/_base.css';
@import './mods/_fonts.css';
@import './mods/_semantic-tokens.css';
@import './mods/_components.css';
```

Adjust the path if `mods/` is nested differently relative to the host entry file.

### Gitignore

If the host `.gitignore` contains `mods` or `/mods`, the packed files will be invisible to git. Add negation rules immediately after that line:

```gitignore
mods
!mods/
!mods/**
```

The `pack` script checks for this automatically and prints the exact lines to add if needed.

### Proxy build script

Add to the host project's `package.json` so the full MODS build-and-pack can be triggered from the host root:

```json
{
  "scripts": {
    "build:mods": "npm --prefix <path-to-mods-tool> run build:css && MODS_DEST=<path-to-mods-dest> npm --prefix <path-to-mods-tool> run pack"
  }
}
```

Example for a project where the MODS tool lives at `store/mods/`:

```json
{
  "scripts": {
    "build:mods": "npm --prefix store/mods run build:css && MODS_DEST=../../mods npm --prefix store/mods run pack"
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

| File | Notes |
|---|---|
| `src/_theme.css` | Spacing scale, breakpoints, shape scale, typography size/leading tokens — system-wide, rarely changed. Only edit if the project requires a fundamentally different spatial grid. |
| `src/style.css` | Entry point import chain — only edit to add or remove partial files. |
| `dist/style.css` | Compiled output — never edit by hand, always overwritten by the build. |
| `server.js` | Playground dev server — leave as-is unless modifying the playground itself. |
