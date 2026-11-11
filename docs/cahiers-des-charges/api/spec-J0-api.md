# API — Spécification J0

Rédigée le 11/11/2026. Partie API du jalon J0 (voir [Lots et feuille de route](../../cadrage/04-lots-et-feuille-de-route.md)). Les principes viennent de l'[architecture](../../cadrage/02-architecture-et-flux.md) ; ce document les rend applicables.

## Objectif de J0 côté API

Une API qui tourne sur le Mac avec Docker et qui reçoit et stocke un vol envoyé par le cœur du tracker, sans MSFS.

**Critère de sortie** :

1. `docker compose up` démarre l'API, PostgreSQL et le stockage de fichiers sur le Mac, sans autre installation.
2. Un vol synthétique du tracker (ouverture, événements, positions, clôture) est stocké, et le relire par l'API redonne exactement ce qui a été envoyé.
3. Renvoyer n'importe quel message une deuxième fois ne change rien en base.
4. La documentation OpenAPI est générée automatiquement et publiée par l'API elle-même.
5. Les tests automatiques passent dans l'intégration continue.

## Conventions (valables pour toute l'API)

| Sujet | Règle |
| --- | --- |
| Adresses | Préfixe `/v1`, noms au pluriel en anglais : `/v1/flights`, `/v1/flights/{flightId}/events` |
| Identifiants | UUID v7 (triés par date de création). Celui du vol est créé par le tracker |
| Heures | UTC, format ISO 8601 avec millisecondes (`2026-11-11T08:15:30.250Z`) |
| Unités | Celles de la spec T0 : degrés décimaux, ft, kt, ft/min, kg. Le nom du champ porte l'unité quand elle n'est pas évidente (`fuelKg`) |
| Valeur inconnue | `null`, jamais 0 |
| Erreurs | Format standard « problem details » (RFC 9457) : `type`, `title`, `status`, `detail` ; message lisible en anglais |
| Codes | 201 créé, 200 déjà reçu (renvoi identique), 400 format invalide, 401 non connecté, 403 interdit, 404 introuvable, 409 conflit (même identifiant, contenu différent), 426 version du tracker trop ancienne |
| Renvois | Chaque message porte un identifiant ou un numéro de séquence. Un renvoi identique répond 200 sans rien modifier ; un renvoi différent répond 409 |
| Listes | Pagination par curseur (`?cursor=…&limit=…`), 50 éléments par défaut |
| Version du tracker | En-tête `Weems-Client: tracker/0.1.0` sur chaque requête |

## Modèle de données

Seules les tables marquées J0 sont créées à J0. Les autres sont listées pour vérifier que le modèle tiendra.

| Table | Contenu | Jalon |
| --- | --- | --- |
| `flights` | Identifiant, pilote, indicatif, simulateur, avion (titre et type), départ, arrivée prévue, heures d'ouverture et de clôture, motif de clôture, dernière phase, version du tracker | J0 |
| `flight_events` | Vol, numéro de séquence, heure, type, contexte (JSON) | J0 |
| `flight_tracks` | Vol, emplacement du fichier de trajectoire compressée, nombre d'échantillons, empreinte | J2 |
| `flight_scores` | Vol, version du jeu de règles, note, détail par critère | J2 |
| `pilots` | Identifiant, pseudo, e-mail, identifiants SimBrief et VATSIM, profil public oui ou non | J3 (J0 : un pilote de développement fixe) |
| `aircraft_types` | Code OACI, catégorie (léger, turbopropulseur, ligne), limites | J2 |
| `airports`, `runways` | Import d'OurAirports | J2 |
| `rule_sets` | Règles et seuils versionnés | J2 |

**Positions en direct** : pas de table. La dernière position de chaque vol ouvert reste en mémoire (décision de l'étape 2).

**Fichiers** : trajectoires dans un stockage compatible S3 (MinIO sur le Mac, Scaleway en production), à partir de J2.

**Contrainte clé** : `flight_events` a une clé unique (vol, numéro de séquence). C'est elle qui garantit l'absence de doublon.

## Routes de J0

| Route | Rôle |
| --- | --- |
| `POST /v1/flights` | Ouvrir un vol (identifiant fourni par le tracker) |
| `POST /v1/flights/{flightId}/events` | Ajouter un ou plusieurs événements |
| `POST /v1/flights/{flightId}/positions` | Mettre à jour la position en direct |
| `POST /v1/flights/{flightId}/close` | Clore le vol, avec son motif |
| `GET /v1/flights/{flightId}` | Relire un vol et ses événements (sert aux tests, puis à la page de vol en J2) |
| `GET /v1/health` | État de l'API et de la base, pour Docker et la supervision |
| `GET /docs` | Documentation OpenAPI générée |

Le flux en direct (`GET /v1/live/stream`) arrive en J1 (voir [spécification J1](../spec-J1-pilotes-simules.md)).

**Connexion à J0** : un jeton de développement fixe, refusé hors du mode développement. OAuth 2 avec PKCE arrive en J3.

## Organisation du code

Fastify par défaut (décision 2, en attente de la réponse de Thibault), en TypeScript strict.

```
apps/api/
  src/
    modules/
      flights/          routes, service, accès à la base, tests
      health/
    plugins/            base de données, authentification, erreurs, documentation
    app.ts              assemblage des modules
    server.ts           démarrage
  migrations/           évolutions de la base, versionnées
  docker-compose.yml    API, PostgreSQL, MinIO
packages/contrats/      formats des messages, partagés avec le tracker et le site
```

| Choix | Recommandation | Pourquoi |
| --- | --- | --- |
| Description des formats | Zod, dans `packages/contrats` [Confiance moyenne] | Le même schéma valide les données dans le tracker, l'API et le site, et produit la documentation OpenAPI |
| Accès à la base | Drizzle [Confiance moyenne] | En TypeScript, proche du SQL, migrations versionnées, léger |
| Tests | Vitest, avec une vraie base PostgreSQL dans Docker | Tester contre la vraie base évite les surprises en production |

## Tests

| Test | Vérifie |
| --- | --- |
| Vol synthétique complet | Critère 2 : ce qui est relu est identique à ce qui est envoyé |
| Chaque message envoyé deux fois | Critère 3 : aucun doublon, réponse 200 |
| Même identifiant, contenu différent | Réponse 409, base inchangée |
| Données invalides (latitude 200°, unité manquante) | Réponse 400 avec un message clair |
| Tracker trop ancien | Réponse 426 |

## Questions ouvertes

| Question | Qui | Bloquant |
| --- | --- | --- |
| Fastify ou NestJS | Thibault | Non : Fastify par défaut |
| Zod et Drizzle | Greg, s'il veut contester | Non |
