# Weems API

API REST unique de Weems : seule à écrire dans la base. Tous les autres programmes (tracker, site web, app iPad, gestion de compagnie) sont ses clients.

Aucun code n'existe encore : ce fichier fixe les règles avant le jalon J0.

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Principes : données, flux, sécurité, hébergement | `../../docs/cadrage/02-architecture-et-flux.md` |
| Conventions, modèle de données, routes de J0 | `../../docs/cahiers-des-charges/api/spec-J0-api.md` |
| Positions en direct et flux SSE (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Ce que le tracker envoie | `../../docs/cahiers-des-charges/tracker/CDC-Tracker.md` (section « Contrat avec l'API ») |
| Formats des messages | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |
| Calcul de la note | `../../packages/notation` (partagé avec le tracker, ne jamais le dupliquer ici) |

## Stack

- Node.js LTS, TypeScript strict, Fastify (en attente de confirmation de Thibault ; NestJS seulement s'il code l'API).
- PostgreSQL avec Drizzle ; fichiers dans un stockage compatible S3 (MinIO en local).
- Validation et documentation OpenAPI à partir des schémas Zod de `packages/contrats`.
- Tests : Vitest contre une vraie base PostgreSQL dans Docker.

## Organisation

```
src/
  modules/<module>/   routes.ts, service.ts, repository.ts, *.test.ts
  plugins/            base, authentification, erreurs, documentation
  app.ts              assemblage
  server.ts           démarrage
migrations/
docker-compose.yml
```

- `routes.ts` : déclare la route et son schéma, appelle le service. Aucune logique métier.
- `service.ts` : la logique métier. Ne connaît ni Fastify ni SQL.
- `repository.ts` : le seul endroit qui parle à la base.
- Un module n'importe jamais le `repository` d'un autre module : il passe par son `service`.

## Règles pour un agent

- Toute donnée entrante est validée par un schéma de `packages/contrats` avant d'atteindre le service.
- Tout message du tracker est idempotent : un renvoi identique répond 200 sans rien modifier, un renvoi différent répond 409. Chaque nouvelle route d'écriture a un test de renvoi en double.
- Erreurs au format RFC 9457 (problem details). Codes et conventions : voir la spec J0.
- Valeur inconnue = `null`, jamais 0. Heures en UTC ISO 8601. Identifiants UUID v7.
- Toute modification de la base passe par une migration versionnée, jamais à la main.
- Aucune donnée personnelle dans les journaux.
- Vérifier les droits sur chaque requête : un pilote ne lit que ses propres vols privés.

## Commandes

À compléter en J0 (`pnpm dev`, `pnpm test`, `docker compose up`).
