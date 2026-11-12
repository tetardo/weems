#!/usr/bin/env bash
# Pose sur le bureau « Weems Start.command » et « Weems Stop.command », deux lanceurs de trois lignes
# vers les scripts du dépôt : une mise à jour du dépôt suffit, pas besoin de les réinstaller.
# Usage : bash scripts/mac/install-desktop-icons.sh [dossier]   (par défaut ~/Desktop)
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd)"
target="${1:-$HOME/Desktop}"

write_launcher() {
  local file="$target/Weems $1.command"
  printf '#!/bin/bash\n# Lanceur Weems : le script est dans le dépôt.\nexec "%s/scripts/mac/%s.sh"\n' \
    "$repo" "$2" >"$file"
  chmod +x "$file"
  echo "› $file"
}

write_launcher Start start
write_launcher Stop stop
