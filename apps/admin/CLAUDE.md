# Weems — console d'administration

Console **locale** de Greg, sur son Mac : démarrer et arrêter les services, lancer du trafic simulé, gérer les comptes. Jamais déployée (fiche `../../docs/decisions/009-console-admin-locale.md`).

Lancement : `pnpm admin` (racine), puis http://127.0.0.1:3002.

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Contenu des pages, décisions, critère de sortie | `../../docs/cahiers-des-charges/admin/spec-admin.md` |
| Pourquoi une console locale, règles d'accès | `../../docs/decisions/009-console-admin-locale.md` |
| Maquettes validées | `/mnt/project-files/admin/` (services-v2, trafic-v2, comptes-v2) |
| Routes `/v1/admin/*` de l'API | `../api/src/modules/accounts/admin-routes.ts` |
| Formats échangés | `../../packages/contrats` (`api/admin.ts`, `api/dev-metrics.ts`, `tools/simulation-progress.ts`) |

![Console d'administration : ce qu'elle pilote](../../docs/schemas/img/admin-console.png)

## Règles

- La console **n'écrit jamais dans la base** : les comptes passent par l'API (`/v1/admin/*`, session d'un administrateur), les vols simulés par les routes de développement de l'API (jeton de développement).
- Services et Trafic sans connexion, Comptes avec connexion : ne pas changer sans relire la fiche 009.
- Écoute sur `127.0.0.1` seulement (`--hostname` du script `dev`) ; `src/proxy.ts` refuse toute autre adresse (test `server/allowed-hosts.test.ts`).
- Français seulement (exception à la règle des deux langues, spec admin question 2) : textes écrits dans les composants.
- Formulaires : modèle C choisi par Greg pour tous les formulaires (champs de 44 px, choix segmenté dans un cadre). Quand les composants communs existeront dans `packages/`, les utiliser ici.
- Icônes : Lucide, importé seulement dans `src/ui/icons.ts`.
- Les processus lancés (pnpm dev, simulate, load) sont gardés dans `globalThis` (`server/singleton.ts`) : un rechargement de Next.js ne les perd pas. Ils reçoivent l'environnement de la console sans `PORT` ni `NODE_ENV` (`childEnv`), sinon l'API prendrait le port 3002.
- Fichiers locaux (historique des lancements, rapports de `pnpm load`) dans `apps/admin/.data/`, jamais versionnés.

## Organisation

```
src/
  app/                 routes Next.js : mise en page (barre latérale G), /services, /traffic, /accounts, styles
  proxy.ts             refus des requêtes adressées à un autre nom que 127.0.0.1:3002 / localhost:3002
  actions/             actions serveur appelées par les pages (résultat { ok, value | error }, jamais d'exception)
  server/              côté serveur seulement
    console.ts           configuration et instances uniques (services, trafic)
    managed-process.ts   commande lancée dans son groupe de processus, journaux, arrêt SIGTERM puis SIGKILL
    services/            Docker (docker compose), sondes de santé, états des cartes, gestionnaire des services
    traffic/             lancement (formulaires → arguments pnpm), suivi, mesures de l'API, résultat, historique
    accounts/            connexion à l'API, appels /v1/admin/*
  site/                barre latérale, barre du haut, onglets mobiles
  features/            composants des pages : services/, traffic/, accounts/ (logique pure à part, testée)
  ui/                  icônes, pastilles d'état, titre de page, confirmation, sondage périodique
  format/              heures, durées, noms des phases
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm admin` (racine) | Console sur http://127.0.0.1:3002 |
| `pnpm --filter @weems/api make-admin <e-mail>` | Nomme le premier administrateur (le compte doit exister) |
| `pnpm check` (racine) | Types, style, structure et tests, console comprise |
