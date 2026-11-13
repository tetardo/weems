# Weems — lanceur Mac

App Electron **locale** de Greg : une icône « Weems » qui démarre, arrête et redémarre la base, la console, l'API et le site, sans fenêtre Terminal ; état et journaux de chaque service ; pastille dans la barre des menus. Jamais distribuée, jamais pour le site en ligne. Choix : `../../docs/decisions/020-lanceur-mac.md` ; guide : `../../docs/developpement/demarrage-mac.md` ; maquette validée : `/mnt/project-files/lanceur-mac/`.

Installation sur le Mac : `bash scripts/mac/install-launcher.sh` (racine du dépôt). Essai sans installer : `pnpm --filter @weems/launcher app`.

## Règles

- **La console reste le chef d'orchestre** (fiche 011) : le lanceur ne lance que `scripts/mac/prepare.sh`, `console.sh` et `stop.sh` ; la base, l'API et le site passent par la console (`/api/lifecycle`, format `@weems/contrats`, `tools/local-services.ts`). Jamais de `docker` ni de `pnpm dev` lancés ici.
- Processus : `ManagedProcess` de `@weems/local-process`, jamais recopié. La console lancée par l'app a son propre groupe de processus, écrit dans `apps/admin/.data/console.pid` pour que `stop.sh` puisse l'arrêter.
- Le dépôt est écrit dans l'app à sa construction (`WEEMS_REPO_ROOT`, `scripts/build-app.ts`) ; `WEEMS_REPO` le remplace pour un essai.
- Quitter = tout arrêter (`stop.sh`), données gardées. Fermer la fenêtre ne s'arrête rien.
- Fenêtre isolée (`contextIsolation`, `sandbox`) : seul pont `window.weems` (`preload.ts`). Les journaux sont écrits en texte, jamais en HTML.
- Français seulement, comme la console. Couleurs de la console (thème sombre), dans `window/window.css`.

## Organisation

```
src/
  main.ts            Electron : fenêtre, barre des menus, Quitter = tout arrêter (point d'entrée)
  preload.ts         pont window.weems
  launcher-state.ts  ce que la fenêtre montre et peut demander (partagé main / preload / fenêtre)
  launcher.ts        démarrer, arrêter, redémarrer (tout ou un service), journaux de l'onglet Console
  rows.ts            les quatre lignes, à partir de la console et du processus de la console
  console-client.ts  appels à /api/lifecycle et /api/overview (six cartes) de la console
  tray-menu.ts       titre et menu de la barre des menus
  repo.ts            chemins des scripts, adresses du site et de la console
  window/            index.html, window.css, view.ts (entrée), rows-view.ts, cards.ts (contenu des cartes et cercles), cards-view.ts, head-buttons.ts (Tout démarrer, arrêter, redémarrer de la barre haute), format.ts, icons.ts
scripts/build-app.ts dist/app (bundles esbuild), comme le tracker
electron-builder.yml Weems.app (dossier, pas d'installateur), icône build/icon.png
```
