# MODS

MODS is a Tailwind v4 CSS-first design system starter. Clone it into a project, brand the source, compile, and consume the output. Every project gets its own `/mods/` instance — there is no shared central dependency.

---

## How it works

1. Clone this repo into a host project (e.g. `store/mods/`)
2. Edit `src/` to set the brand (see [Branding workflow](#branding-workflow) below)
3. Run `npm run build:css` to compile (used by the playground)
4. Run `MODS_DEST=<path> npm run pack` to copy the 5 source partials to the host's tracked `mods/` directory
5. Import those partials in the host's CSS entry point — the host's own Tailwind build processes them

The MODS tool directory is not committed. The packed `mods/` directory in the host project is.

---

## Quick start

```bash
cd mods
npm install
npm run build:css        # one-off build (playground output)
npm run watch:css        # watch mode during active token work
npm run dev              # playground server at http://localhost:3001
```

To copy the compiled source partials to a host project:

```bash
MODS_DEST=../../path/to/host/mods npm run pack
```

**Suggested script in the host project's `package.json`:**

```json
"build:mods": "npm --prefix store/mods run build:css && MODS_DEST=../../mods npm --prefix store/mods run pack"
```

Adjust `store/mods` and `MODS_DEST` to match the host project's directory layout.

---

## Branding workflow

Full step-by-step for agents and developers: [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md)

Summary:

| Step | File | What to do |
|---|---|---|
| 1 | `src/_base.css` | Replace palette RGB channels (`--p*`, `--s*`, `--n*`, meaning tones) |
| 2 | `src/_semantic-tokens.css` | Re-point light/dark base vars to the correct new palette steps |
| 3 | `src/_components.css` | Delete any `@layer components` blocks the project doesn't need |
| 4 | `src/_fonts.css` | Swap Google Fonts import + font-role CSS vars (if changing typeface) |
| 5 | — | Run `npm run build:css` |
| 6 | — | Run `MODS_DEST=<path> npm run pack` to copy source partials to host |

---

## File structure

```
src/
  style.css               ← Entry point — @import chain
  _base.css               ← Raw palette RGB channels + scalar base vars (alphas, widths, radii)
  _semantic-tokens.css    ← Semantic colour/shape tokens + dark-mode alias switching
  _theme.css              ← Tailwind @theme block — spacing, breakpoints, typography, shape scales
  _fonts.css              ← Google Fonts import + font-role CSS variables
  _components.css         ← @layer components — all semantic utility classes
dist/
  style.css               ← Compiled output (playground only — not imported by host projects)
playground/
  index.html              ← Token playground — visual inspection during branding
docs/
  MODS Design System.md   ← Full token reference
  AGENT_GUIDE.md          ← Step-by-step branding guide for agents and developers
```

---

## Reference

Full token naming convention, colour system, typography system, elevation, spacing, and shape: [`docs/MODS Design System.md`](docs/MODS%20Design%20System.md)
