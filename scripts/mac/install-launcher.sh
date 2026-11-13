#!/usr/bin/env bash
# Construit Weems.app (apps/launcher) sur ce Mac, l'installe dans Applications, pose un raccourci
# « Weems » sur le bureau et met les anciennes icônes Weems Start / Weems Stop à la corbeille.
# À relancer après une mise à jour du lanceur. Usage : bash scripts/mac/install-launcher.sh
# Fiche docs/decisions/020-lanceur-mac.md.
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
weems_load_tools
cd "$WEEMS_REPO"
app="/Applications/Weems.app"

if pgrep -f "$app/Contents/MacOS/" >/dev/null 2>&1; then
  fail "Weems est ouvert : menu Weems (barre des menus) › « Quitter (arrête tout) », puis relancez."
fi

say "Construction de Weems.app (une à deux minutes)"
pnpm --filter @weems/launcher app:package
built="$(find apps/launcher/dist/installer -maxdepth 2 -name Weems.app -type d | head -n 1)"
[[ -n "$built" ]] || fail "Weems.app introuvable dans apps/launcher/dist/installer"

# Pas de certificat Apple : une signature locale (« ad hoc ») suffit sur le Mac qui l'a construite.
say "Signature locale de l'app"
codesign --force --deep --sign - "$built"

say "Installation dans Applications"
rm -rf "$app"
ditto "$built" "$app"

say "Raccourci « Weems » sur le bureau"
ln -sfn "$app" "$HOME/Desktop/Weems"
for old in "Weems Start.command" "Weems Stop.command"; do
  if [[ -e "$HOME/Desktop/$old" ]]; then
    mv -f "$HOME/Desktop/$old" "$HOME/.Trash/"
    say "Ancienne icône « $old » mise à la corbeille"
  fi
done

say "Ouverture de Weems"
open "$app"
