#!/usr/bin/env bash
# Icône « Weems Stop » : simulations, site, API, console, puis la base. Les données sont gardées.
set -uo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
weems_load_tools
cd "$WEEMS_REPO" || fail "Dépôt introuvable : $WEEMS_REPO"

start_pid="$(cat "$WEEMS_START_PID_FILE" 2>/dev/null)"
if [[ -n "$start_pid" ]] && kill -0 "$start_pid" 2>/dev/null; then
  # La fenêtre Start fait l'arrêt complet elle-même : on attend qu'elle ait fini.
  say "Arrêt demandé à la fenêtre Weems Start…"
  kill -TERM "$start_pid"
  for _ in $(seq 1 300); do
    kill -0 "$start_pid" 2>/dev/null || break
    sleep 0.5
  done
fi
# Sans fenêtre Start (ou si elle n'a pas fini) : le même arrêt, ici.
weems_stop_all
rm -f "$WEEMS_START_PID_FILE"
say "Tout est arrêté."
