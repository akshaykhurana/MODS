#!/bin/sh
set -e

if [ -z "$MODS_DEST" ]; then
  echo "Error: MODS_DEST is not set."
  echo "Usage: MODS_DEST=<path/to/host/styles/mods.css> npm run pack"
  echo "Example: MODS_DEST=../my-app/src/styles/mods.css npm run pack"
  exit 1
fi

# Guard: MODS_DEST must be a file path, not a directory path
case "$MODS_DEST" in
  */)
    echo "Error: MODS_DEST must be a file path, not a directory (remove the trailing slash)."
    echo "  Got: $MODS_DEST"
    exit 1
    ;;
esac
if [ -d "$MODS_DEST" ]; then
  echo "Error: MODS_DEST points to an existing directory. It must be a .css file path."
  echo "  Got: $MODS_DEST"
  exit 1
fi

# ── Build ─────────────────────────────────────────────────────────────
echo "Building CSS..."
npm run build:css

if [ ! -f "dist/style.css" ]; then
  echo "Error: dist/style.css not found after build."
  exit 1
fi

# ── Publish compiled CSS ──────────────────────────────────────────────
DEST_DIR=$(dirname "$MODS_DEST")
mkdir -p "$DEST_DIR"
cp dist/style.css "$MODS_DEST"

PACK_TS=$(date -u +"%Y-%m-%d %H:%M UTC")
MODS_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
PACK_BANNER="/* MODS v${MODS_VERSION} | packed ${PACK_TS} | commit ${GIT_COMMIT} */"
PACK_TMP=$(mktemp)
printf '%s\n' "$PACK_BANNER" > "$PACK_TMP"
cat "$MODS_DEST" >> "$PACK_TMP"
mv "$PACK_TMP" "$MODS_DEST"

echo "Published compiled CSS  → $MODS_DEST"

# ── Token snapshot ────────────────────────────────────────────────────
# Copies _base.css, _semantic-tokens.css, and _webfont-imports.css alongside
# the compiled CSS so token values survive a MODS re-clone and can be restored
# by an agent. These files are NOT imported by the host project.
SNAPSHOT_DIR="$DEST_DIR/mods-snapshot"
mkdir -p "$SNAPSHOT_DIR"
cp src/_base.css src/_semantic-tokens.css src/_webfont-imports.css "$SNAPSHOT_DIR/"

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

# Write README with agent restore prompt (single-quoted heredoc — no shell expansion,
# backticks are safe). Timestamp is injected via sed after the fact.
cat > "$SNAPSHOT_DIR/README.md" << 'HEREDOC'
# MODS token snapshot

Packed: __TIMESTAMP__

Verbatim copies of `mods/src/_base.css`, `mods/src/_semantic-tokens.css`, and
`mods/src/_webfont-imports.css` at the time `npm run pack` was last run. These files
are not imported by the host project — they exist so branding decisions can be restored
after MODS is re-cloned.

The snapshot captures:
- `_base.css`             — palette RGB values, scalar vars (alphas, border widths, letter spacing)
- `_semantic-tokens.css`  — semantic pointings (which palette steps each role maps to in light and dark mode)
- `_webfont-imports.css`  — Google Fonts `@import` URLs used by the MODS playground (see font note below)

---

## Fonts and the packed bundle

**The compiled CSS file (`mods.css` / whatever `MODS_DEST` points to) does NOT contain
Google Fonts `@import` lines.** This is intentional: Tailwind v4 inlines `_base.css`
after its own prelude, so any `@import` inside that file would violate the CSS rule
requiring `@import` before all other rules and would be silently dropped by browsers.

`_webfont-imports.css` in this snapshot is for the **MODS playground only** (it is read
by the dev server to inject font `<link>` tags). It is never part of the compiled bundle.

**The host app must load typefaces itself** using `next/font`, a `<link>` tag, self-hosted
CSS, or any other font-loading strategy — the exact mechanism depends on the project.
The family names used by the host must match the `--font-*` CSS variables in the packed CSS.

When branding changes fonts:
1. Update the font-loading in the host app.
2. Set the matching `--font-*` token values in MODS (playground or direct edit).
3. Re-run `npm run pack` so the compiled CSS reflects the new values.

The Google Fonts URLs in `_webfont-imports.css` are provided as a reference for which
typefaces MODS was configured with — you can copy them into the host's font setup.

---

## Restore token values after re-cloning MODS

1. Re-clone MODS into the host project root and strip the nested git repo:

   ```bash
   git clone <mods-repo-url> mods
   rm -rf mods/.git
   echo "mods/" >> .gitignore
   cd mods && npm install
   ```

2. Run the restore script from inside the `mods/` directory:

   ```bash
   MODS_SNAPSHOT=<path/to/this/mods-snapshot> npm run apply-snapshot
   ```

   The path is relative to the `mods/` directory. For example, if the snapshot lives at
   `../src/styles/mods-snapshot` relative to `mods/`:

   ```bash
   MODS_SNAPSHOT=../src/styles/mods-snapshot npm run apply-snapshot
   ```

   The script copies only the user-editable token values (palette, scalar vars, semantic
   pointings) into the fresh source files, and restores `_webfont-imports.css` in full.
   It leaves file structure, comments, and non-editable sections untouched. It reports
   any tokens that are new since the snapshot (kept at MODS defaults) or were removed
   (skipped with a warning).

3. After the script completes, re-pack to publish the restored CSS and refresh the snapshot:

   ```bash
   MODS_DEST=<same-path-as-before> npm run pack
   ```

---

## Fallback: agent restore prompt

If `apply-snapshot` is unavailable (e.g. on an older MODS version), an agent can perform
the same migration manually. Copy and paste this prompt into GitHub Copilot, Cursor, or
any agent tool:

> Migrate token values from the MODS snapshot into the fresh MODS source files.
>
> Source (old values): `mods-snapshot/_base.css`, `mods-snapshot/_semantic-tokens.css`,
> and `mods-snapshot/_webfont-imports.css` (if present) in the same directory as this README.
> Target (new files):  `mods/src/_base.css`, `mods/src/_semantic-tokens.css`, and
> `mods/src/_webfont-imports.css`.
>
> Rules:
> - Copy ONLY values from sections marked USER EDITABLE in `_base.css` (the PALETTE
>   block and the BASE VARS block).
> - In `_semantic-tokens.css`, copy all `var(--)` assignments from `:root {}` and `.dark {}`.
> - If `_webfont-imports.css` exists in the snapshot, copy it verbatim to
>   `mods/src/_webfont-imports.css`. This file holds Google Fonts @import URLs for the
>   MODS playground — it is NOT imported by the Tailwind bundle or by the host project.
> - Do NOT touch sections marked DO NOT EDIT, TAILWIND THEME COMPOSITION, or any
>   `@theme` block in `_base.css`.
> - Token in snapshot but not in new file → report as warning (removed or renamed), skip it.
> - Token in new file but not in snapshot → leave at its default value, report as a new
>   token requiring a decision.
> - Do not alter file structure, comments, whitespace, or formatting in the target
>   files — only replace values on the right-hand side of matching `--token-name:` lines.
HEREDOC

# Inject timestamp (portable: no -i flag dependency)
tmpfile=$(mktemp)
sed "s/__TIMESTAMP__/$TIMESTAMP/" "$SNAPSHOT_DIR/README.md" > "$tmpfile"
mv "$tmpfile" "$SNAPSHOT_DIR/README.md"

echo "Token snapshot written  → $SNAPSHOT_DIR/"

# ── Gitignore check ───────────────────────────────────────────────────
# The compiled CSS at MODS_DEST MUST be git-tracked — it is what CI ships.
# Warn loudly if it is being ignored.
if command -v git >/dev/null 2>&1; then
  if git check-ignore -q "$MODS_DEST" 2>/dev/null; then
    echo ""
    echo "WARNING: '$MODS_DEST' is gitignored."
    echo "The compiled CSS will not be committed and will not reach CI."
    echo "Remove or negate the ignore rule covering this path in the host .gitignore."
    echo ""
  fi
fi

echo ""
echo "Pack complete."
echo "  Compiled CSS   : $MODS_DEST"
echo "  Token snapshot : $SNAPSHOT_DIR/"
echo ""
DEST_BASENAME=$(basename "$MODS_DEST")
echo "Host entry file import:"
echo "  @import './<path-relative-to-entry>/$DEST_BASENAME';"
