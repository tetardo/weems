# Weems — console d'administration

Console **locale** de Greg, sur son Mac : page d'accueil Supervision (tuiles, surveillance, activité, communauté), démarrer et arrêter les services, lancer du trafic simulé ou de l'activité simulée (comptes fictifs), gérer les comptes, confirmer ou refuser les Pilotes fondateurs et créer les codes d'offre et les ambassadeurs (pages Fondateurs et Codes d'offre, spec `../../docs/cahiers-des-charges/web/spec-offre-fondateurs.md`), choisir l'image de fond de l'accueil du site (page Personnalisation), suivre les mises à jour des librairies (page Librairies, lecture seule), surveiller, sauvegarder et nettoyer la base (page Base de données). Jamais déployée (fiche `../../docs/decisions/009-console-admin-locale.md`).

Lancement : `pnpm admin` (racine), puis http://127.0.0.1:3002.

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Contenu des pages, décisions, critère de sortie | `../../docs/cahiers-des-charges/admin/spec-admin.md` |
| Pourquoi une console locale, règles d'accès | `../../docs/decisions/009-console-admin-locale.md`, connexion automatique en local : `012-console-connexion-automatique-en-local.md` |
| Maquettes validées | `/mnt/project-files/admin/` (services-v2, trafic-v2, comptes-v2, activite/ proposition A) |
| Page Supervision (accueil `/`) | spec admin, section « Page Supervision » ; route `../api/src/modules/supervision/routes.ts` |
| Personnalisation (images de l'accueil) | `../../docs/cahiers-des-charges/web/spec-J4-personnalisation.md` |
| Comptes fictifs et activité simulée | `../../docs/decisions/011-activite-simulee-comptes-fictifs.md`, `../tracker/tools/populate/` |
| Librairies (versions, alertes de sécurité) | spec admin, section « Page Librairies » ; `src/server/libraries/` |
| Base de données (tailles, migrations, sauvegardes, nettoyage) | spec admin, section « Page Base de données » ; `src/server/database/` ; routes `../api/src/modules/database/routes.ts` |
| Routes `/v1/admin/*` de l'API | `../api/src/modules/accounts/admin-routes.ts` |
| Formats échangés | `../../packages/contrats` (`api/admin.ts`, `api/supervision.ts`, `api/database.ts`, `api/dev-metrics.ts`, `tools/simulation-progress.ts`, `tools/activity-progress.ts`, `api/fictitious.ts`) |

![Console d'administration : ce qu'elle pilote](../../docs/schemas/img/admin-console.png)

## Règles

- La console **n'écrit jamais dans la base** : les comptes passent par l'API (`/v1/admin/*`, session d'un administrateur), les vols simulés et les comptes fictifs par les routes de développement de l'API (jeton de développement).
- Services et Trafic sans connexion, Comptes avec connexion : ne pas changer sans relire la fiche 009.
- Comptes : hors production, la console se connecte seule avec le pilote de développement (`server/accounts/dev-login.ts`, fiche 012) ; son rôle d'administrateur reste donné à la main (`make-admin`). Ne jamais ouvrir `/v1/admin/*` au jeton de développement.
- Écoute sur `127.0.0.1` seulement (`--hostname` du script `dev`) ; `src/proxy.ts` refuse toute autre adresse (test `server/allowed-hosts.test.ts`).
- Français seulement (exception à la règle des deux langues, spec admin question 2) : textes écrits dans les composants.
- Formulaires : modèle C (fiche 008), composants du paquet `@weems/ui` (`Field`, `FormField`, `TextInput`, `Segmented`…), jamais de champ écrit à la main. Tailwind ne sert qu'à eux : `src/app/global.css` importe son thème et ses utilitaires sans remise à zéro, génère seulement les classes de `packages/ui` et relie leurs couleurs aux variables de la console.
- Icônes : Lucide, importé seulement dans `src/ui/icons.ts`.
- Thème : sombre ou clair, choix gardé dans le navigateur (clé `weems-admin-theme`, bouton de la barre du haut), sinon réglage du Mac. Règles partagées avec le site dans `@weems/ui` (`themeScript`, `toggleTheme`), jamais recopiées. Bandeau du haut unique, pleine largeur et fixe au défilement (logo, fil d'Ariane, actions ; hauteur `--topbar-h`), la barre latérale commence dessous. En thème clair, il reste bleu nuit : ses jetons sombres sont redéclarés sur `.topbar` (`global.css`). Couleurs : toujours un jeton (`--violet`…), jamais de valeur en dur qui ne suivrait pas le thème.
- Un seul lancement à la fois entre Trafic et Activité : chaque gestionnaire reçoit l'occupation de l'autre (`server/console.ts`).
- Les processus lancés (pnpm dev, simulate, load, populate) passent par `ManagedProcess` du paquet `@weems/local-process` (partagé avec le lanceur) et sont gardés dans `globalThis` (`server/singleton.ts`) : un rechargement de Next.js ne les perd pas. Ils reçoivent l'environnement de la console sans `PORT` ni `NODE_ENV` (`childEnv`), sinon l'API prendrait le port 3002.
- Personnalisation : lecture sans connexion (route publique), enregistrement avec la session de la page Comptes ; l'image passe par une action serveur, d'où la limite de 16 Mo de `next.config.ts` (actions serveur et `proxy.ts`).
- Librairies : lecture seule, jamais d'installation ni d'écriture dans le dépôt ; `pnpm ls` et `pnpm audit` lancés à la racine, registre npm interrogé directement ; liens externes filtrés par `server/libraries/web-url.ts` (http ou https seulement).
- Base de données : lecture et suppressions par l'API (`/v1/admin/database`) ; la console lance seulement `pg_dump` dans le conteneur (sauvegardes) et `pnpm --filter @weems/api db:migrate`. Jamais de restauration par un bouton : la commande est affichée. Les vols réels ne sont jamais supprimés.
- Fichiers locaux (historique des lancements, rapports de `pnpm load`, dernier résultat de la page Librairies, relevés de taille et sauvegardes de la base) dans `apps/admin/.data/`, jamais versionnés.

## Organisation

```
src/
  app/                 routes Next.js : mise en page (barre latérale G), / (Supervision), /services, /traffic, /activity, /accounts, /founders, /codes, /customize, /libraries, /database, styles ;
                       api/lifecycle (état et actions des services, appelé par le lanceur Mac et scripts/mac/), api/overview (cinq cartes du lanceur, tirées de Supervision et des fichiers du Mac)
  proxy.ts             refus des requêtes adressées à un autre nom que 127.0.0.1:3002 / localhost:3002
  actions/             actions serveur appelées par les pages (résultat { ok, value | error }, jamais d'exception)
  server/              côté serveur seulement
    console.ts           configuration et instances uniques (services, trafic)
    lifecycle.ts         état et actions des services pour le lanceur Mac et scripts/mac/ (en-tête exigé)
    launcher-overview.ts cartes du lanceur Mac (base, API, utilisateurs, revenu fictif) depuis Supervision
    launcher-files.ts    carte « Fichiers » du lanceur : sauvegardes de la console et disque du Mac
    services/            Docker (docker compose), sondes de santé, états des cartes, gestionnaire des services
    traffic/             lancement (formulaires → arguments pnpm), suivi, mesures de l'API, résultat, historique
    activity/            lancement de pnpm populate, suivi, résultat, population fictive (/v1/dev/fictitious-pilots)
    accounts/            connexion à l'API, session gardée (admin-session.ts), appels /v1/admin/*
    offers/              Fondateurs et Codes d'offre (offers-api.ts : /v1/admin/founders, /codes, /ambassadors)
    site/                images de l'accueil (site-api.ts : /v1/site/home-images et /v1/admin/site/*)
    libraries/           page Librairies : pnpm ls, registre npm, pnpm audit, écarts de version, rapport gardé en cache
    database/            page Base de données : relevés de taille par jour, sauvegardes pg_dump, commande des migrations
  site/                bandeau du haut (logo compris), barre latérale, onglets mobiles
  features/            composants des pages : supervision/, services/, traffic/, activity/, accounts/, customize/, libraries/, database/ (logique pure à part, testée)
  ui/                  icônes, bloc à titre, champ numérique, état d'un lancement, pastilles d'état, titre de page, confirmation, sondage périodique
  format/              heures, durées, noms des phases (tailles : @weems/ui/format, partagé avec le lanceur)
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm admin` (racine) | Console sur http://127.0.0.1:3002 |
| App Mac « Weems » (`../launcher`) et scripts `scripts/mac/` | État et journaux (`GET /api/lifecycle`), tout ou un service : démarrer, arrêter, redémarrer (`POST`) ; `src/server/lifecycle.ts`, format `@weems/contrats` (`tools/local-services.ts`), fiche `../../docs/decisions/020-lanceur-mac.md` |
| `pnpm --filter @weems/api make-admin <e-mail>` | Nomme un administrateur (le compte doit exister) ; avec `pilote@weems.local`, la page Comptes s'ouvre ensuite sans connexion |
| `pnpm check` (racine) | Types, style, structure et tests, console comprise |
