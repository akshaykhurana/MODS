#!/bin/sh
set -e

if [ -z "$MODS_DEST" ]; then
  echo "Error: MODS_DEST is not set."
  echo "Usage: MODS_DEST=<path-to-mods-dir-in-host-project> npm run pack"
  echo "Example: MODS_DEST=../../my-web-app/mods npm run pack"
  exit 1
fi

# Resolve the directory that contains MODS_DEST (the host project root)
HOST_ROOT=$(dirname "$MODS_DEST")
DEST_NAME=$(basename "$MODS_DEST")

# Copy the 5 source partials
mkdir -p "$MODS_DEST"
cp src/_base.css src/_components.css src/_fonts.css src/_semantic-tokens.css src/_theme.css "$MODS_DEST/"
echo "Packed 5 source partials to $MODS_DEST"

# Check if the host .gitignore would swallow the destination directory
GITIGNORE="$HOST_ROOT/.gitignore"
if [ -f "$GITIGNORE" ]; then
  if grep -qE "^/?${DEST_NAME}(/|$)?" "$GITIGNORE"; then
    echo ""
    echo "Warning: $GITIGNORE contains a rule that ignores '$DEST_NAME/'."
    echo "The packed files will be untracked by git and won't reach CI."
    echo ""
    echo "Add these two lines immediately after the '$DEST_NAME' rule in $GITIGNORE:"
    echo ""
    echo "  !${DEST_NAME}/"
    echo "  !${DEST_NAME}/**"
    echo ""
  fi
fi
