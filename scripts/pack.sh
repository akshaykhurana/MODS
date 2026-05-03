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
echo "Published compiled CSS  → $MODS_DEST"

# ── Token snapshot ────────────────────────────────────────────────────
# Copies _base.css and _semantic-tokens.css alongside the compiled CSS
# so token values survive a MODS re-clone and can be restored by an agent.
SNAPSHOT_DIR="$DEST_DIR/mods-snapshot"
mkdir -p "$SNAPSHOT_DIR"
cp src/_base.css src/_semantic-tokens.css "$SNAPSHOT_DIR/"

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")

# Write README with agent restore prompt (single-quoted heredoc — no shell expansion,
# backticks are safe). Timestamp is injected via sed after the fact.
cat > "$SNAPSHOT_DIR/README.md" << 'HEREDOC'
# MODS token snapshot

Packed: __TIMESTAMP__

Verbatim copies of `mods/src/_base.css` and `mods/src/_semantic-tokens.css` at the
time `npm run pack` was last run. For reference and agent-assisted restore only —
these files are not imported by the host project.

---

## Restore token values after re-cloning MODS

1. Re-clone MODS into the host project root and strip the nested git repo:

   ```bash
   git clone <mods-repo-url> mods
   rm -rf mods/.git
   echo "mods/" >> .gitignore
   cd mods && npm install
   ```

2. Run the following agent prompt (works with GitHub Copilot, Cursor, or any agent tool):

---

**Agent restore prompt — copy and paste as-is:**

> Migrate token values from the MODS snapshot into the fresh MODS source files.
>
> Source (old values): `mods-snapshot/_base.css` and `mods-snapshot/_semantic-tokens.css`
> in the same directory as this README.
> Target (new files):  `mods/src/_base.css` and `mods/src/_semantic-tokens.css`.
>
> Rules:
> - Copy ONLY values from sections marked USER EDITABLE in `_base.css` (the PALETTE
>   block and the BASE VARS block).
> - In `_semantic-tokens.css`, copy all `var(--)` assignments from `:root {}` and `.dark {}`.
> - Do NOT touch sections marked DO NOT EDIT, TAILWIND THEME COMPOSITION, or any
>   `@theme` block in `_base.css`.
> - Token in snapshot but not in new file → report as warning (removed or renamed),
>   skip it.
> - Token in new file but not in snapshot → leave at its default value, report as
>   new token requiring a decision.
> - Do not alter file structure, comments, whitespace, or formatting in the target
>   files — only replace values on the right-hand side of matching `--token-name:` lines.

---

3. After the agent migration:

   ```bash
   npm run build:css && MODS_DEST=<same-path-as-before> npm run pack
   ```

   This rebuilds the compiled CSS from the restored tokens and overwrites the snapshot
   with fresh copies, so the next re-clone starts from the latest state.
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
