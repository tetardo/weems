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

# 1. Docker Desktop.
if ! docker_ready; then
  say "Démarrage de Docker Desktop…"
  open -a Docker || fail "Docker Desktop introuvable dans Applications."
  for _ in $(seq 1 90); do
    docker_ready && break
    sleep 2
  done
  docker_ready || fail "Docker Desktop ne répond pas après 3 minutes."
fi

# 2. L'ancienne API en Docker garde le port 3000 (invisible pour lsof) : on l'arrête.
if [[ "$(docker inspect -f '{{.State.Running}}' weems-api-1 2>/dev/null)" == "true" ]]; then
  say "Arrêt de l'ancien conteneur weems-api-1 (port 3000)"
  docker stop weems-api-1 >/dev/null
fi

# 3. La base.
say "Démarrage de la base"
compose up -d db >/dev/null || fail "docker compose up -d db a échoué."
for _ in $(seq 1 30); do
  compose exec -T db pg_isready -U weems >/dev/null 2>&1 && break
  sleep 1
done
compose exec -T db pg_isready -U weems >/dev/null 2>&1 || fail "La base ne répond pas."

# 4. apps/api/.env doit viser la base « weems » (pas weems_admin ni une autre base d'essai).
"$WEEMS_REPO/scripts/mac/check-api-env.sh" || exit 1

# 5. Ports : un programme étranger sur 3000, 3001 ou 3002 bloque tout, on ne le tue jamais.
for port in 3000 3001 3002; do
  pid="$(listener_of "$port")"
  [[ -z "$pid" ]] && continue
  if is_weems_process "$pid"; then
    say "Programme Weems oublié sur le port $port : arrêt"
    stop_group "$(group_of "$pid")"
  else
    fail "Port $port pris par « $(ps -o comm= -p "$pid") » (pid $pid), qui n'est pas Weems. Fermez-le puis relancez."
  fi
done

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
pnpm admin &
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
