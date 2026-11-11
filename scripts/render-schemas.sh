#!/usr/bin/env bash
# Regenerates the PNG diagrams from the Mermaid sources in docs/schemas/.
# Usage: bash scripts/render-schemas.sh   (needs Node.js; Chrome is downloaded by mermaid-cli on first run)
set -euo pipefail
cd "$(dirname "$0")/../docs/schemas"
mkdir -p img
MMDC="${MMDC:-npx -y @mermaid-js/mermaid-cli@11.4.2}"
PUPPETEER_ARGS=()
if [[ -n "${PUPPETEER_CONFIG:-}" ]]; then PUPPETEER_ARGS=(-p "$PUPPETEER_CONFIG"); fi
for src in *.mmd; do
  $MMDC "${PUPPETEER_ARGS[@]}" -c config.json -i "$src" -o "img/${src%.mmd}.png" -s 2 -b white -q
  echo "img/${src%.mmd}.png"
done
