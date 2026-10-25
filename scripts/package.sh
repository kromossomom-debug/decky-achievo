#!/usr/bin/env bash
# Builds the installable ZIP (the layout Decky's "Install Plugin from ZIP" expects).
# Usage: scripts/package.sh [output.zip]   (run `npm run build` first)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="$(realpath -m "${1:-xbox-achievements.zip}")"
[ -f dist/index.js ] || { echo "dist/index.js missing: run npm run build first" >&2; exit 1; }
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/xbox-achievements/dist"
cp dist/index.js "$STAGE/xbox-achievements/dist/"
cp main.py plugin.json package.json LICENSE README.md "$STAGE/xbox-achievements/"
find "$STAGE" -name "__pycache__" -prune -exec rm -rf {} +
rm -f "$OUT"
(cd "$STAGE" && python3 -m zipfile -c "$OUT" xbox-achievements)
echo "Wrote $OUT"
