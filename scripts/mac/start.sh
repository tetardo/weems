#!/usr/bin/env bash
# Icône « Weems Start » : la base, la console, puis l'API et le site par la console, et le navigateur.
# Fenêtre à laisser ouverte : la fermer ou faire Ctrl-C arrête tout, comme l'icône Stop.
set -uo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
weems_load_tools
cd "$WEEMS_REPO" || fail "Dépôt introuvable : $WEEMS_REPO"
mkdir -p "$WEEMS_RUN_DIR"

if [[ -f "$WEEMS_START_PID_FILE" ]] && kill -0 "$(cat "$WEEMS_START_PID_FILE")" 2>/dev/null; then
  say "Weems tourne déjà : ouverture de la console."
  open "$WEEMS_CONSOLE_URL/services"
  exit 0
fi

# 1 à 5. Docker Desktop, la base, apps/api/.env, les ports.
"$WEEMS_REPO/scripts/mac/prepare.sh" || exit 1

# 6. La console, dans son propre groupe de processus (set -m) pour pouvoir l'arrêter d'un coup.
echo $$ >"$WEEMS_START_PID_FILE"
on_exit() {
  trap - INT TERM HUP
  echo
  say "Arrêt de Weems…"
  weems_stop_all
  rm -f "$WEEMS_START_PID_FILE"
  say "Tout est arrêté."
  exit 0
}
trap on_exit INT TERM HUP
set -m
say "Démarrage de la console (127.0.0.1:3002)"
"$WEEMS_REPO/scripts/mac/console.sh" &
console_pid=$!
set +m
echo "$console_pid" >"$WEEMS_CONSOLE_PID_FILE"

for _ in $(seq 1 120); do
  console_answers && break
  kill -0 "$console_pid" 2>/dev/null || {
    warn "La console s'est arrêtée au démarrage (voir les lignes ci-dessus)."
    on_exit
  }
  sleep 1
done
console_answers || warn "La console ne répond pas encore : l'API et le site ne sont pas lancés."

# 7. L'API et le site, lancés par la console (elle peut ensuite les arrêter), puis le navigateur.
if console_answers; then
  say "La console démarre l'API (3000) et le site (3001)"
  console_action start-all || warn "Démarrage incomplet : voir la page Services (bouton « Libérer le port » si c'est un vieux Weems)."
  open "$WEEMS_CONSOLE_URL/services"
fi

echo
say "Weems tourne. Laisser cette fenêtre ouverte. Pour tout arrêter : icône « Weems Stop » (ou Ctrl-C ici)."
while kill -0 "$console_pid" 2>/dev/null; do
  wait "$console_pid" 2>/dev/null
done
on_exit
