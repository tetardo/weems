# Weems API

API REST unique de Weems : seule à écrire dans la base. Tous les autres programmes (tracker, site web, app iPad, gestion de compagnie) sont ses clients.

Squelette J0 en place : vols (ouverture, événements, positions, clôture, relecture), santé, documentation OpenAPI. J1 : module `live` (carte en direct, flux SSE `/v1/live/stream`). J2 : liste des vols `GET /v1/flights`, module `tracks` (trajectoire reçue à la clôture, stockée compressée dans PostgreSQL, relue simplifiée avec la phase de chaque point). J3 : module `accounts` (comptes pilotes avec Better Auth, inscription sur invitation, connexion du tracker en OAuth 2.1 avec PKCE), module `reviews` (le pilote dit si les phases d'un vol sont justes), module `alpha` (rapport du critère de sortie de l'alpha). J4 : module `profiles` (profil public du pilote, désactivé par défaut : réglages du pilote dans `service.ts` et `routes.ts`, pages publiques sans compte dans `public-service.ts` et `public-routes.ts`, carnet de bord du pilote (sa page publique, lisible par lui même non publiée) dans `logbook-service.ts` et `logbook-routes.ts`, statistiques, heures de jour et de nuit, distance, série de semaines, données des graphiques dont les heures de décollage en heure locale (fuseau trouvé hors ligne, fiche 004), carte des trajets, photo réduite par `sharp`). J4 : module `aircraft` (catalogue des types OACI et catégorie d'avion de chaque vol, spec `../../docs/cahiers-des-charges/spec-J4-categories-avion.md`) ; module `airports` (liste OurAirports chargée au démarrage, fiche 005, route publique `GET /v1/airports?codes=…`) et route `GET /v1/live/flights/{id}/route` (aéroports et trace en mémoire du vol sélectionné sur la carte en direct) ; pilote de chaque vol du direct seulement si son profil est public (`live/live-pilots.ts`, relu toutes les 30 s, spec `../../docs/cahiers-des-charges/web/spec-J4-direct-pilote.md`) et derniers événements du direct dans le flux (`live/live-events.ts` : décollages, atterrissages, débuts de vol des pilotes publics) ; route publique `GET /v1/live/boarding` (page Boarding du site, spec `../../docs/cahiers-des-charges/web/spec-boarding.md`) : heures de départ, de décollage et de toucher gardées en mémoire par `live/boarding-log.ts` (posés gardés une heure après leur clôture), statut et heure estimée calculés en pur dans `live/boarding.ts`. Module `stats` : route publique `GET /v1/stats` (pilotes actifs, vols, vols en direct) pour les compteurs de l'accueil, gardée 30 s en cache (spec `../../docs/cahiers-des-charges/web/spec-J4-accueil.md`) ; il lit les comptes et les vols par leurs services, jamais par leurs dépôts. Module `site` : images de fond de l'accueil, une par thème (spec `../../docs/cahiers-des-charges/web/spec-J4-personnalisation.md`), stockées en WebP dans la table `site_home_images` ; lecture publique `GET /v1/site/home-images` et `/{theme}/image`, changement par `/v1/admin/site/home-images/{theme}` (administrateur, page Personnalisation de la console). Module `plans` (cadrage 05, fiche `../../docs/decisions/015-catalogue-des-formules.md`) : catalogue des formules dans `catalog.ts` (valeur de chaque fonction de `FeatureKey` dans chaque formule, disponible aujourd'hui ou « bientôt », prix fictifs), route publique `GET /v1/plans` (pages Offres et Fonctionnalités du site, cache 5 min) et `GET /v1/me/plan` (Pilot Free pour tous en production tant qu'il n'y a pas d'abonnement) ; hors production seulement, bouton de test Free | Pro du site : `PUT /v1/dev/me/plan` (`dev-routes.ts`) range la formule choisie dans la table `test_plans`, relue par `GET /v1/me/plan` (`testSwitch: true`), à retirer avant la 1.0. Modules `founders` et `offers` (spec `../../docs/cahiers-des-charges/web/spec-offre-fondateurs.md`, fiche `../../docs/decisions/017-offre-fondateurs-hors-catalogue.md`) : Pilot Pro offert rangé dans la table `plan_grants` (`plans/repository-grants.ts`, cadeaux enchaînés dans `plans/offered.ts`) et lu par `PlansService.planOf` (`offered` dans `GET /v1/me/plan`) ; `founders` : vol valide en pur (`flights/validity.ts`, partagé avec les grades), place numérotée par séquence sous verrou (`repository.ts`), évaluée à la réception de chaque trajectoire (`TracksService.whenCompleted`) et à la lecture de `GET /v1/me/founder`, état public `GET /v1/founders`, console `/v1/admin/founders` ; `offers` : codes `WEEMS-XXXX-XXXX` par lots, parrainage et codes partagés des ambassadeurs (`POST /v1/me/codes/redeem`, 5 essais par heure ; inscription avec un code d'offre via `AccountsService.acceptOfferCodes`), pages et photos des ambassadeurs, routes de la console dans `admin-routes.ts` ; assemblage dans `src/offers-assembly.ts`. Module `logbook` : carnet privé du pilote (spec `../../docs/cahiers-des-charges/web/spec-carnet-prive.md`), `GET /v1/me/logbook/summary` (page Résumé : tous ses vols, même masqués sur sa page publique), calculé en pur dans `summary.ts` à partir des vols lus par le service `flights` et de la trajectoire du dernier vol ; `GET /v1/me/logbook/entries` (page Vols : verdict de chaque vol, `entries.ts`) et `GET /v1/me/logbook/flights/{id}/bands` (bandes de vol, une colonne par minute, calculées dans `bands.ts` sur tous les points reçus ; les repères à revoir seulement si la formule inclut `flightBandsMarks`, demandé au service `plans`). `GET /v1/me/logbook/stats?period=30d|12m|all` (page Statistiques, `stats.ts` qui assemble `stats-activity.ts`, `stats-fleet.ts`, `stats-landings.ts`, `stats-technique.ts`, fonctions pures) : « all » seulement si `statsPeriod` vaut « unlimited » (Pilot Pro), sinon 12 mois ; tendances par catégorie, temps par phase et bonnes pratiques à `null` sans `categoryTrends`, `phaseTime`, `goodPractices` ; trajectoires simplifiées des vols de la période ; noms des aéroports par le service `airports`. Les points de trajectoire portent depuis le 12/11/2026 des champs facultatifs (carburant, volets, train, N1, pilote automatique, feux…) : les vols plus anciens n'ont que les lignes de trajectoire. Module `goals` : objectifs du carnet privé (spec carnet privé § 6), table `goals` (définition seulement), `GET|POST /v1/me/goals`, `PUT /v1/me/goals/{id}`, `POST /v1/me/goals/{id}/archive` ; progression recalculée à chaque lecture en fonctions pures (`windows.ts` semaines et mois UTC, `facts.ts` faits utiles de chaque vol clos, `progress.ts` un calcul par type, `goal-view.ts` statut, rythme, projection, périodes précédentes, `suggestions.ts`) ; limite Pilot Free, suggestions et type « Bonnes pratiques » décidés par les clés `goals`, `goalSuggestions`, `goalGoodPractices` du service `plans`. Module `supervision` : `GET /v1/admin/supervision` (administrateur), page d'accueil de la console ; ses dépôts en lecture seule lisent plusieurs tables en SQL (comme `alpha`), et `traffic-metrics.ts` compte en mémoire les temps de réponse (p95 par heure sur 24 h) et les positions reçues (par minute sur 30 min) grâce au crochet `traffic-hooks.ts`, sans table. Module `database` : `GET /v1/admin/database` (tailles des tables, part simulée, état de chaque migration comparé à `drizzle.__drizzle_migrations` via `db/migration-journal.ts`, ce que le nettoyage supprimerait) et `POST /v1/admin/database/cleanup` (administrateur, page Base de données de la console) ; il supprime par les services de nettoyage des modules `flights` (vols simulés `replay` de plus de 7 jours, `cleanup-service.ts`) et `accounts` (sessions et invitations expirées), jamais un vol réel.

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Principes : données, flux, sécurité, hébergement | `../../docs/cadrage/02-architecture-et-flux.md` |
| Conventions, modèle de données, routes de J0 | `../../docs/cahiers-des-charges/api/spec-J0-api.md` |
| Positions en direct et flux SSE (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Liste des vols, trajectoires (J2) | `../../docs/cahiers-des-charges/spec-J2-premier-vrai-vol.md` |
| Trajectoire et progression sur la carte en direct (J4) | `../../docs/cahiers-des-charges/web/spec-J4-trajectoire-direct.md` |
| Page Boarding : départs et arrivées (`GET /v1/live/boarding`) | `../../docs/cahiers-des-charges/web/spec-boarding.md` |
| Comptes, connexion du site et du tracker (J3) | `../../docs/cahiers-des-charges/spec-J3-alpha-fermee.md` |
| Profil public du pilote (J4) | `../../docs/cahiers-des-charges/spec-J4-profil-public.md` |
| Comptes vus par la console d'administration (rôles, désactivation, invitations) | `../../docs/cahiers-des-charges/admin/spec-admin.md`, fiche `../../docs/decisions/009-console-admin-locale.md` |
| Accueil : compteurs et images de fond | `../../docs/cahiers-des-charges/web/spec-J4-accueil.md`, `../../docs/cahiers-des-charges/web/spec-J4-personnalisation.md` |
| Offre fondateurs, codes d'offre, ambassadeurs (`modules/founders`, `modules/offers`) | `../../docs/cahiers-des-charges/web/spec-offre-fondateurs.md`, fiche `../../docs/decisions/017-offre-fondateurs-hors-catalogue.md` |
| Formules et catalogue (`modules/plans`) | `../../docs/cadrage/05-formules-abonnement.md`, fiche `../../docs/decisions/015-catalogue-des-formules.md`, section 12 des règles de développement |
| Carnet privé (`modules/logbook`) | `../../docs/cahiers-des-charges/web/spec-carnet-prive.md` ; critères provisoires des repères : `../../docs/suivi/a-voir-avec-houssine.md` |
| Supervision et base de données (`modules/supervision`, `modules/database`) | `../../docs/cahiers-des-charges/admin/spec-admin.md`, sections « Page Supervision » et « Page Base de données » |
| Ce que le tracker envoie | `../../docs/cahiers-des-charges/tracker/CDC-Tracker.md` (section « Contrat avec l'API ») |
| Formats des messages | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |
| Calcul de la note | `../../packages/notation` (partagé avec le tracker, ne jamais le dupliquer ici ; encore vide : critères à fixer avec un pilote) |

## Stack

- Node.js LTS, TypeScript strict, Fastify (toute l'API est écrite en Fastify depuis J0 ; la question NestJS ne se pose que si Thibault code l'API : `../../docs/suivi/a-voir-avec-thibault.md`).
- PostgreSQL avec Drizzle. Trajectoires compressées, photos de profil et images de l'accueil sont stockées dans PostgreSQL (spec J2, spec profil public, spec personnalisation) ; un stockage compatible S3 ne viendra que si le volume l'exige.
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
- Formules : toute fonction visible par le pilote, nouvelle ou modifiée, a sa ligne dans `modules/plans/catalog.ts` (clé dans `FeatureKey` de `packages/contrats`) dans la même PR ; une fonction livrée passe de `SOON` à `NOW` dans la PR qui la livre (page Fonctionnalités). Plus tard, une route réservée testera une clé de fonction, jamais un nom de formule.
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
