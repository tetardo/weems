#!/usr/bin/env bash
# La console d'administration (127.0.0.1:3002), avec les outils de mise : lancée par start.sh et par
# le lanceur Mac (apps/launcher), qui s'ouvrent sans ~/.zshrc.
set -uo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
weems_load_tools
cd "$WEEMS_REPO" || fail "Dépôt introuvable : $WEEMS_REPO"
exec pnpm admin
