#!/usr/bin/env bash
# Télécharge (ou met à jour) les pages du SDK MSFS listées dans docs/reference/msfs/sources.txt
# vers docs/reference/msfs/pages/, et signale ce qui a changé depuis la dernière fois.
#
# Usage, depuis le dossier apps/tracker :
#   bash scripts/update-msfs-docs.sh
#
# Compatible macOS (bash 3.2) et Linux. Nécessite curl et shasum (ou sha256sum).

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCES="$ROOT/docs/reference/msfs/sources.txt"
PAGES="$ROOT/docs/reference/msfs/pages"
LOG="$ROOT/docs/reference/msfs/CHANGELOG.md"
mkdir -p "$PAGES"

# Empreinte du contenu lu sur l'entrée standard
hash_stdin() {
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 | cut -d' ' -f1
  else sha256sum | cut -d' ' -f1; fi
}

today="$(date +%Y-%m-%d)"
new=0; changed=0; same=0; failed=0
report=""

while IFS='|' read -r name url status; do
  name="$(echo "$name" | xargs)"; url="$(echo "$url" | xargs)"
  case "$name" in ''|\#*) continue ;; esac
  tmp="$(mktemp)"
  code="$(curl -sSL -A "weems-docs-sync" -o "$tmp" -w '%{http_code}' "$url" 2>/dev/null || true)"
  if [ "$code" != "200" ] || [ ! -s "$tmp" ]; then
    echo "ECHEC  $name (HTTP $code) -> vérifier l'URL dans sources.txt"
    report="$report\n- ECHEC $name (HTTP $code)"
    failed=$((failed+1)); rm -f "$tmp"; continue
  fi
  # En-tête : source et date, pour que l'agent sache d'où vient la page
  { echo "<!-- source: $url -->"; echo "<!-- recupere le: $today -->"; echo; cat "$tmp"; } > "$tmp.h"
  rm -f "$tmp"
  dest="$PAGES/$name"
  if [ ! -f "$dest" ]; then
    mv "$tmp.h" "$dest"; echo "NOUVEAU $name"; report="$report\n- nouveau $name"; new=$((new+1))
  else
    # On compare sans les 2 lignes d'en-tête (la date change à chaque fois)
    a="$(tail -n +3 "$dest" | hash_stdin)"
    b="$(tail -n +3 "$tmp.h" | hash_stdin)"
    if [ "$a" = "$b" ]; then rm -f "$tmp.h"; same=$((same+1))
    else
      diff -u "$dest" "$tmp.h" > "$dest.diff" 2>/dev/null
      mv "$tmp.h" "$dest"; echo "MODIFIE $name (voir $name.diff)"
      report="$report\n- modifié $name"; changed=$((changed+1))
    fi
  fi
done < "$SOURCES"

echo
echo "Résumé : $new nouveau(x), $changed modifié(s), $same inchangé(s), $failed échec(s)."
if [ $((new+changed+failed)) -gt 0 ]; then
  { echo "## $today"; printf '%b\n' "$report"; echo; } >> "$LOG"
  echo "Détail ajouté à docs/reference/msfs/CHANGELOG.md"
fi
[ "$changed" -gt 0 ] && echo "Pages modifiées : relire les .diff et mettre à jour simvars.yaml / pieges.md si besoin."
exit 0
