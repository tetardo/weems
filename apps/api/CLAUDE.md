# Weems API

API REST unique de Weems : seule à écrire dans la base. Tous les autres programmes (tracker, site web, app iPad, gestion de compagnie) sont ses clients.

Squelette J0 en place : vols (ouverture, événements, positions, clôture, relecture), santé, documentation OpenAPI. J1 : module `live` (carte en direct, flux SSE `/v1/live/stream`). J2 : liste des vols `GET /v1/flights`, module `tracks` (trajectoire reçue à la clôture, stockée compressée dans PostgreSQL, relue simplifiée avec la phase de chaque point). J3 : module `accounts` (comptes pilotes avec Better Auth, inscription sur invitation, connexion du tracker en OAuth 2.1 avec PKCE), module `reviews` (le pilote dit si les phases d'un vol sont justes), module `alpha` (rapport du critère de sortie de l'alpha). J4 : module `profiles` (profil public du pilote, désactivé par défaut : réglages du pilote dans `service.ts` et `routes.ts`, pages publiques sans compte dans `public-service.ts` et `public-routes.ts`, carnet de bord du pilote (sa page publique, lisible par lui même non publiée) dans `logbook-service.ts` et `logbook-routes.ts`, statistiques, heures de jour et de nuit, distance, série de semaines, données des graphiques dont les heures de décollage en heure locale (fuseau trouvé hors ligne, fiche 004), carte des trajets, photo réduite par `sharp`). J4 : module `aircraft` (catalogue des types OACI et catégorie d'avion de chaque vol, spec `../../docs/cahiers-des-charges/spec-J4-categories-avion.md`) ; module `airports` (liste OurAirports chargée au démarrage, fiche 005, route publique `GET /v1/airports?codes=…`) et route `GET /v1/live/flights/{id}/route` (aéroports et trace en mémoire du vol sélectionné sur la carte en direct) ; pilote de chaque vol du direct seulement si son profil est public (`live/live-pilots.ts`, relu toutes les 30 s, spec `../../docs/cahiers-des-charges/web/spec-J4-direct-pilote.md`). Module `stats` : route publique `GET /v1/stats` (pilotes actifs, vols, vols en direct) pour les compteurs de l'accueil, gardée 30 s en cache (spec `../../docs/cahiers-des-charges/web/spec-J4-accueil.md`) ; il lit les comptes et les vols par leurs services, jamais par leurs dépôts. Module `site` : images de fond de l'accueil, une par thème (spec `../../docs/cahiers-des-charges/web/spec-J4-personnalisation.md`), stockées en WebP dans la table `site_home_images` ; lecture publique `GET /v1/site/home-images` et `/{theme}/image`, changement par `/v1/admin/site/home-images/{theme}` (administrateur, page Personnalisation de la console).

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Principes : données, flux, sécurité, hébergement | `../../docs/cadrage/02-architecture-et-flux.md` |
| Conventions, modèle de données, routes de J0 | `../../docs/cahiers-des-charges/api/spec-J0-api.md` |
| Positions en direct et flux SSE (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Liste des vols, trajectoires (J2) | `../../docs/cahiers-des-charges/spec-J2-premier-vrai-vol.md` |
| Trajectoire et progression sur la carte en direct (J4) | `../../docs/cahiers-des-charges/web/spec-J4-trajectoire-direct.md` |
| Comptes, connexion du site et du tracker (J3) | `../../docs/cahiers-des-charges/spec-J3-alpha-fermee.md` |
| Profil public du pilote (J4) | `../../docs/cahiers-des-charges/spec-J4-profil-public.md` |
| Comptes vus par la console d'administration (rôles, désactivation, invitations) | `../../docs/cahiers-des-charges/admin/spec-admin.md`, fiche `../../docs/decisions/009-console-admin-locale.md` |
| Ce que le tracker envoie | `../../docs/cahiers-des-charges/tracker/CDC-Tracker.md` (section « Contrat avec l'API ») |
| Formats des messages | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |
| Calcul de la note | `../../packages/notation` (partagé avec le tracker, ne jamais le dupliquer ici) |

## Stack

- Node.js LTS, TypeScript strict, Fastify (en attente de confirmation de Thibault ; NestJS seulement s'il code l'API).
- PostgreSQL avec Drizzle ; fichiers dans un stockage compatible S3 à partir de J2 (outil local à choisir).
- Validation et documentation OpenAPI à partir des schémas Zod de `packages/contrats`.
- Tests : Vitest contre une vraie base PostgreSQL dans Docker.

## Organisation

```
src/
  modules/<module>/   routes.ts, service.ts, repository.ts, *.test.ts
  plugins/            authentification, version du tracker, erreurs, documentation
  db/                 schéma Drizzle et connexion
  testing/            outils des tests (base de test, vol synthétique)
  config.ts           variables d'environnement
  app.ts              assemblage
  server.ts           démarrage
migrations/
data/airports.csv   liste des aéroports (OurAirports), régénérée par `pnpm airports:update`
docker-compose.yml
```

- `routes.ts` : déclare la route et son schéma, appelle le service. Aucune logique métier.
- `service.ts` : la logique métier. Ne connaît ni Fastify ni SQL.
- `repository.ts` : le seul endroit qui parle à la base.
- Un module n'importe jamais le `repository` d'un autre module : il passe par son `service`. Vérifié par dependency-cruiser.
- Quand un module doit prévenir un autre, il définit une interface (exemple : `flights/live-feed.ts`, implémentée par `live/live-board.ts`).
- Règles de taille et de duplication : voir la section « Structure du code » des règles de développement.

## Règles pour un agent

- Toute donnée entrante est validée par un schéma de `packages/contrats` avant d'atteindre le service.
- Tout message du tracker est idempotent : un renvoi identique répond 200 sans rien modifier, un renvoi différent répond 409. Chaque nouvelle route d'écriture a un test de renvoi en double.
- Erreurs au format RFC 9457 (problem details). Codes et conventions : voir la spec J0.
- Valeur inconnue = `null`, jamais 0. Heures en UTC ISO 8601. Identifiants UUID v7.
- Toute modification de la base passe par une migration versionnée, jamais à la main.
- Aucune donnée personnelle dans les journaux.
- Vérifier les droits sur chaque requête : un pilote ne lit que ses propres vols privés.
- Routes publiques (`/v1/pilots/*`, sans compte) : formats publics de `packages/contrats` (`Public…`), limite de débit par adresse IP (`config.rateLimit`), aucune mise en cache, même 404 pour un profil inconnu ou désactivé.

## Commandes

| Commande (depuis `apps/api/`) | Effet |
| --- | --- |
| `docker compose up` | API sur http://localhost:3000 et PostgreSQL ; documentation sur http://localhost:3000/docs |
| `docker compose up -d db` | Base seule, suffisante pour `pnpm dev` et pour les tests |
| `pnpm dev` | API hors Docker, relancée à chaque modification (variables : `.env.example`) |
| `pnpm db:generate` | Crée la migration après une modification de `src/db/schema.ts` |
| `pnpm db:migrate` | Applique les migrations (fait aussi au démarrage de l'API) |
| `pnpm check` (racine) | Tout : types, style, structure, tests ; les tests exigent la base `weems_test` |
| `pnpm alpha-report --since <AAAA-MM-JJ>` | Rapport de l'alpha : vols, vols suspects, phases justes, critère de sortie (dans Docker : `docker compose exec api node apps/api/src/modules/alpha/report-cli.ts --since <date>`) |
| `pnpm airports:update` | Retélécharge la liste OurAirports et réécrit `data/airports.csv` (à relire et à committer) |
| `pnpm make-admin <e-mail>` | Donne le rôle Administrateur à un compte existant (premier administrateur de la console) |
| `pnpm reclassify` | Recalcule la catégorie d'avion de tous les vols, après une modification de `modules/aircraft/catalogue.ts` (dans Docker : `docker compose exec api node apps/api/src/modules/flights/reclassify-cli.ts`) |
| `pnpm invite <e-mail>` | Crée un code d'invitation pour l'alpha et affiche l'adresse d'inscription (dans Docker : `docker compose exec api node apps/api/src/modules/accounts/invite-cli.ts <e-mail>`) |

## Connexion (J3)

- Site : session par cookie. Les routes `/api/auth/*` (Better Auth) sont servies par l'API mais appelées à travers le site, pour que le cookie soit celui du site ; le serveur du site renvoie ce cookie à l'API.
- Tracker : OAuth 2.1, code d'autorisation avec PKCE, retour sur `http://127.0.0.1:{port}/callback`. Jetons d'accès JWT (audience `WEEMS_API_URL`, 1 h), jetons de rafraîchissement tournants (90 jours). `GET /v1/tracker/login` donne tout au tracker.
- Les tables de Better Auth sont dans `src/db/auth-schema.ts`, écrites à la main (noms de champs de la bibliothèque) : à comparer après chaque mise à jour de la bibliothèque.
- Hors production, le jeton de développement `Authorization: Bearer dev-token` reste accepté (`pnpm simulate`, `pnpm fly`) ; ses vols appartiennent au pilote de développement, qui peut se connecter au site avec `pilote@weems.local` / `weems-dev-password`.
- Hors production seulement, comptes fictifs (fiche `../../docs/decisions/011-activite-simulee-comptes-fictifs.md`) : `POST|GET|DELETE /v1/dev/fictitious-pilots` (`modules/accounts/fictitious-routes.ts`) crée, compte ou supprime tous les comptes marqués `users.fictitious` (e-mail `@fictif.weems.local`, mot de passe commun `weems-fictif`). Le jeton `dev-token:<id>` vole au nom d'un compte fictif actif ; tout autre identifiant est refusé (401). Utilisé par `pnpm populate`.
- Hors production seulement, `GET /v1/dev/metrics` donne le retard de la boucle d'événements, la mémoire, le nombre de spectateurs et de vols en direct (`modules/live/dev-routes.ts`, lu par `pnpm load`, spec J4 montée en charge).
- Hors production seulement, `DELETE /v1/flights` supprime tous les vols du pilote connecté, avec événements, trajectoire et vérification (`modules/flights/dev-routes.ts`, bouton du site en `pnpm dev`) ; avec `?simulator=replay`, seulement les vols simulés (console d'administration, `pnpm load`), jamais les vrais vols de `pnpm fly`. `GET /v1/dev/flight-counts` compte les vols simulés et réels. En production ces routes n'existent pas : un vol réel n'est jamais effacé (EF-14).

## Administration (console locale `apps/admin`)

- Rôles `pilot` et `admin` (`users.role`) ; une invitation porte le rôle donné à l'inscription. Invitations valables 14 jours, renouvelables (nouveau code), annulables ; une invitation expirée est refusée à l'inscription.
- Routes `/v1/admin/*` (`modules/accounts/admin-routes.ts`, garde `guards.admin`) : session par cookie d'un administrateur, 401 sans session, 403 pour un pilote ; le jeton de développement n'y donne pas accès. Un administrateur ne change jamais son propre compte ; le dernier administrateur actif garde son rôle.
- Désactiver un compte (`users.disabled_at`) supprime ses sessions et ses jetons du tracker ; `PilotIdentifier` refuse ensuite ses jetons d'accès déjà émis et la connexion est refusée (403). Ses vols restent ; réactivable.
- Hors production, l'origine de la console (`WEEMS_ADMIN_URL`, http://127.0.0.1:3002) est autorisée à se connecter.

En-tête obligatoire du tracker : `Weems-Client: tracker/0.1.0`.
