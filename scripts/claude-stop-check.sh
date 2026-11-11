#!/usr/bin/env bash
# Claude Code "Stop" hook: Claude cannot end a task while the checks fail.
# Runs only when code files changed, so documentation-only work stays fast.
set -uo pipefail
cd "$(dirname "$0")/.."

changed=$(git status --porcelain -- '*.ts' '*.tsx' '*.js' '*.cjs' '*.json' '*.yaml' 2>/dev/null | grep -v '^??.*docs/' || true)
if [[ -z "$changed" ]]; then
  exit 0
fi

if ! output=$(pnpm check 2>&1); then
  echo "pnpm check fails: fix it before saying the task is done." >&2
  echo "$output" | tail -40 >&2
  exit 2
fi
exit 0
