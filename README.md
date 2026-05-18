# MODS

MODS is a Tailwind v4 CSS-first design system starter. Clone it into a project, brand the source, compile, and consume the output. Every project gets its own `/mods/` instance — there is no shared central dependency.

---

## How it works

1. Clone this repo into a host project (e.g. `mods/`)
2. Edit `src/_base.css` (and related source) to set the brand (see [Branding workflow](#branding-workflow) below)
3. Run `npm run build:css` to compile (playground and local verification; `postinstall` runs this automatically)
4. Run `MODS_DEST=<path-to-file.css> npm run pack` to publish compiled CSS to the host's tracked tree
5. In the host CSS entry point, `@import` the packed file (see [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md) Step 6)

The MODS tool directory is gitignored in the host project. The compiled CSS at `MODS_DEST` (and `mods-snapshot/` beside it) are tracked.

---

## Quick start

```bash
cd mods
npm install    # runs build:css via postinstall
npm run dev    # playground + watcher at http://localhost:3001
```

To publish compiled CSS to a host project:

```bash
MODS_DEST=../src/styles/mods.css npm run pack
```

`MODS_DEST` must be a **file path** (not a directory). `pack` runs `build:css` internally.

**Suggested script in the host project's `package.json`:**

```json
"build:mods": "MODS_DEST=../src/styles/mods.css npm --prefix mods run pack"
```

Adjust `mods` and `MODS_DEST` to match the host project's directory layout.

---

## Branding workflow

Full step-by-step for agents and developers: [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md)

Summary:

| Step | Where | What to do |
|---|---|---|
| 1 | `src/_base.css` → PALETTE | Replace palette RGB channels (`--p*`, `--s*`, `--n*`, meaning tones, charts) |
| 2 | `src/_base.css` → BASE VARS | Tune alphas, border widths, radius scale, letter-spacing |
| 3 | `src/_base.css` → TYPE SCALE / FONT FAMILIES | Adjust font sizes, line heights, families, Google Fonts `@import` |
| 4 | `src/_semantic-tokens.css` | Re-point light/dark base vars to the correct palette steps |
| 5 | `src/_components.css` | Delete `@layer components` blocks the project doesn't need |
| 6 | — | Run `npm run build:css` (or use the playground, which rebuilds on save) |
| 7 | — | Run `MODS_DEST=<path> npm run pack` to publish compiled CSS to the host |

The DO NOT EDIT and TAILWIND THEME COMPOSITION sections of `_base.css` are system-defined — change only with intent.

---

## File structure

```
src/
  style.css               ← Entry point — @import chain
  _base.css               ← Raw tokens + Tailwind @theme blocks
  _semantic-tokens.css    ← Semantic aliases + dark-mode switching
  _components.css         ← @layer components and @utility definitions
dist/
  style.css               ← Compiled output inside the tool (playground + pack source)
playground/
  index.html              ← Token playground
docs/
  MODS Design System.md   ← Full token reference
  AGENT_GUIDE.md          ← Branding + pack workflow
```

Hosts import the **packed** copy at `MODS_DEST` (e.g. `src/styles/mods.css`), not `mods/dist/style.css` directly.

---

## Reference

Full token naming convention, colour system, typography system, elevation, spacing, and shape: [`docs/MODS Design System.md`](docs/MODS%20Design%20System.md)
