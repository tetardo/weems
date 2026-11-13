# shellcheck shell=bash disable=SC2034
# Shared by start.sh and stop.sh (sourced, never run alone).
# The desktop icons open a bare bash: no ~/.zshrc, so no mise and no Homebrew in PATH. Fixed here.

WEEMS_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEEMS_COMPOSE="$WEEMS_REPO/apps/api/docker-compose.yml"
WEEMS_CONSOLE_URL="http://127.0.0.1:3002"
# Group of `pnpm console` started by start.sh, and the pid of start.sh itself.
WEEMS_RUN_DIR="$WEEMS_REPO/apps/console/.data"
WEEMS_START_PID_FILE="$WEEMS_RUN_DIR/start.pid"
WEEMS_CONSOLE_PID_FILE="$WEEMS_RUN_DIR/console.pid"

say() { printf '\033[1m›\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
fail() {
  printf '\033[31m✗\033[0m %s\n' "$*"
  exit 1
}

# PATH of a Terminal session: Homebrew, Docker Desktop, then the tools of mise (node, pnpm).
weems_load_tools() {
  export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$HOME/.local/bin:$PATH"
  if command -v mise >/dev/null 2>&1; then
    eval "$(cd "$WEEMS_REPO" && mise env -s bash)"
  fi
  command -v node >/dev/null 2>&1 || fail "node introuvable (mise install node@24 ?)"
  command -v pnpm >/dev/null 2>&1 || fail "pnpm introuvable (mise install pnpm@10.28.0 ?)"
}

docker_ready() { docker info >/dev/null 2>&1; }

compose() { docker compose -f "$WEEMS_COMPOSE" "$@"; }

console_answers() { curl -fs -o /dev/null --max-time 2 "$WEEMS_CONSOLE_URL/services"; }

# POST to the console (route apps/console/src/app/api/lifecycle). Long: stopping waits for the simulation.
# On failure, prints the console's message (e.g. a port held by another program).
console_action() {
  local answer status
  answer="$(curl -sS --max-time 120 -w '\n%{http_code}' -X POST "$WEEMS_CONSOLE_URL/api/lifecycle" \
    -H 'content-type: application/json' -H 'x-weems-local-script: 1' \
    -d "{\"action\":\"$1\"}")" || return 1
  status="${answer##*$'\n'}"
  [[ "$status" == 200 ]] && return 0
  warn "Console : $(printf '%s' "${answer%$'\n'*}" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')"
  return 1
}

# Pid listening on a TCP port, empty if none.
listener_of() { lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -n 1; }

# Working folder of a process: lsof on the Mac, /proc on Linux (tests in a container).
cwd_of() {
  if [[ -e "/proc/$1/cwd" ]]; then readlink "/proc/$1/cwd" 2>/dev/null; else
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
  fi
}

is_weems_process() {
  local cwd
  cwd="$(cwd_of "$1")"
  [[ "$cwd" == "$WEEMS_REPO" || "$cwd" == "$WEEMS_REPO"/* ]]
}

# SIGTERM to a whole process group, SIGKILL after 10 s if it is still there.
stop_group() {
  local pgid="$1" waited=0
  kill -TERM -- "-$pgid" 2>/dev/null || return 0
  while kill -0 -- "-$pgid" 2>/dev/null && ((waited < 20)); do
    sleep 0.5
    waited=$((waited + 1))
  done
  kill -KILL -- "-$pgid" 2>/dev/null || true
}

group_of() { ps -o pgid= -p "$1" 2>/dev/null | tr -d ' '; }

# Weems programs left without their console (window closed, console crashed): only those whose
# working folder is in the repository. A foreign program is never touched.
stop_leftovers() {
  local port pid
  for port in 3002 3001 3000; do
    pid="$(listener_of "$port")"
    if [[ -n "$pid" ]] && is_weems_process "$pid"; then
      say "Arrêt du programme Weems resté sur le port $port"
      stop_group "$(group_of "$pid")"
    fi
  done
  for pid in $(pgrep -f 'tools/simulate/cli|tools/populate/cli|e2e/load/cli' 2>/dev/null); do
    if is_weems_process "$pid"; then
      say "Arrêt d'une simulation restée seule"
      stop_group "$(group_of "$pid")"
    fi
  done
}

# Everything, in order: simulations, site, API (through the console when it answers), the console,
# what is left, then the database. Never `docker compose down -v`: it would erase the flights.
weems_stop_all() {
  if console_answers; then
    say "La console arrête la simulation, le site, l'API et la base…"
    console_action stop-all || warn "La console n'a pas tout arrêté : on termine à la main."
  fi
  if [[ -f "$WEEMS_CONSOLE_PID_FILE" ]]; then
    say "Arrêt de la console"
    stop_group "$(cat "$WEEMS_CONSOLE_PID_FILE")"
    rm -f "$WEEMS_CONSOLE_PID_FILE"
  fi
  stop_leftovers
  if docker_ready; then
    say "Arrêt de la base (les données sont gardées)"
    compose stop >/dev/null 2>&1 || warn "docker compose stop a échoué"
  fi
}
