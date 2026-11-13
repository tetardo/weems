#!/usr/bin/env bash
# Tout ce qui précède la console : Docker Desktop, la base, apps/api/.env, les ports 3000 à 3002.
# Lancé par start.sh (icône Weems Start) et par le lanceur Mac (apps/launcher), sans Terminal.
set -uo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
weems_load_tools
cd "$WEEMS_REPO" || fail "Dépôt introuvable : $WEEMS_REPO"
mkdir -p "$WEEMS_RUN_DIR"

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
