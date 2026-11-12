#!/usr/bin/env bash
# apps/api/.env doit exister et viser la base « weems » du conteneur db.
# Crée le fichier depuis .env.example s'il manque ; sinon corrige DATABASE_URL avec une copie de sauvegarde.
set -euo pipefail
api="$(cd "$(dirname "$0")/../../apps/api" && pwd)"
env_file="$api/.env"
expected="postgres://weems:weems@localhost:5432/weems"

if [[ ! -f "$env_file" ]]; then
  cp "$api/.env.example" "$env_file"
  echo "› apps/api/.env créé depuis .env.example"
  exit 0
fi

current="$(sed -n 's/^DATABASE_URL=//p' "$env_file" | tail -n 1)"
if [[ "$current" == */weems ]]; then exit 0; fi

backup="$env_file.bak-$(date +%Y%m%d-%H%M%S)"
cp "$env_file" "$backup"
if [[ -z "$current" ]]; then
  printf '\nDATABASE_URL=%s\n' "$expected" >>"$env_file"
else
  sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=$expected|" "$env_file" && rm -f "$env_file.tmp"
fi
echo "› apps/api/.env visait « ${current:-rien} » : remis sur la base weems (ancien fichier : $(basename "$backup"))"
