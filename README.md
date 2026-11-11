# Weems

Écosystème d'outils pour passionnés de simulation de vol : tracker, API, suivi des vols (web et iPad), gestion de compagnie virtuelle. Ne jamais utiliser pour la navigation réelle.

## Organisation

| Dossier | Contenu | État |
| --- | --- | --- |
| `apps/tracker` | Tracker de bureau pour MSFS 2020/2024 (TypeScript, Electron) | Cœur (phases, enregistrement, envoi), connecteur de rejeu, pilotes simulés ; connecteur MSFS et commande `pnpm fly` (J2) |
| `apps/api` | API centrale | Vols (J0), carte en direct par SSE (J1) |
| `apps/web` | Suivi des vols sur le web | Carte en direct `/live` (J1) ; liste et page de vol, français et anglais (J2) |
| `packages/contrats` | Formats échangés entre le tracker, l'API et le site | En place |
| `packages/notation` | Règles et calcul de la note, communs au tracker et à l'API | À créer au lot T0 |
| `docs/cadrage` | Parc applicatif, positionnement | Étape 1 livrée |
| `docs/cahiers-des-charges` | Cahiers des charges par application | Tracker complet |
| `docs/identite` | Identité visuelle | Planche logos v1 |

Un seul dépôt pour tout : le tracker et l'API partagent du code (`packages/`), qui ne doit exister qu'en un exemplaire.

## Documents clés

- [Parc applicatif et positionnement](docs/cadrage/01-parc-et-positionnement.md)
- [Architecture et flux](docs/cadrage/02-architecture-et-flux.md) : API, données, flux, hébergement, décisions ouvertes
- [Fondamentaux](docs/cadrage/03-fondamentaux.md) : moyens, objectif, gratuit et payant, statut juridique, environnements
- [Lots et feuille de route](docs/cadrage/04-lots-et-feuille-de-route.md) : lots 1 à 4, jalons J0 à J5 du lot 1
- [Règles de développement](docs/developpement/regles-de-developpement.md) : définition de « terminé », tests, branches, garde-fous Claude Code
- [Spécification J0 de l'API](docs/cahiers-des-charges/api/spec-J0-api.md) : conventions, modèle de données, routes
- [Site web minimal](docs/cahiers-des-charges/web/spec-J2-site-minimal.md) : liste des vols, page de vol, connexion (J2 et J3)
- [Spécification J1](docs/cahiers-des-charges/spec-J1-pilotes-simules.md) : 10 pilotes simulés sur la carte en direct
- [Spécification J2](docs/cahiers-des-charges/spec-J2-premier-vrai-vol.md) : premier vrai vol dans MSFS, trajectoire, liste et page de vol
- [Cahier des charges du tracker](docs/cahiers-des-charges/tracker/CDC-Tracker.md) : exigences, contrat avec l'API, lots T0 à T4
- [Architecture interne du tracker](docs/cahiers-des-charges/tracker/architecture-interne.md) : cœur indépendant, connecteurs, enregistreur, envoi hors ligne
- [Spécification T0 du tracker](docs/cahiers-des-charges/tracker/spec-T0.md) : données reçues et règles des phases
- [Guide PC Windows (J2)](docs/developpement/guide-pc-windows-j2.md) : installer le PC, lancer `pnpm fly`, les 10 vols de référence
- [Guide d'entretien pilotes](docs/suivi/guide-entretien-pilotes.md) : valider le produit avec 5 pilotes avant l'alpha
- [Alpha fermée : guide du testeur](docs/alpha/guide-testeur.md) (à envoyer aux pilotes) et [guide de l'organisateur](docs/alpha/guide-organisateur.md) : invitations, publier une version du tracker
- [À voir avec Houssine](docs/suivi/a-voir-avec-houssine.md) : questions en attente pour la communauté
- [À voir avec Thibault](docs/suivi/a-voir-avec-thibault.md) : questions techniques en attente
- [Référence MSFS du tracker](apps/tracker/CLAUDE.md) : quelles données lire et comment

## Travailler sur le projet

1. Cloner le dépôt : `git clone https://github.com/tetardo/weems`
2. Installer Node.js 24 (version fixée dans `.nvmrc`, par exemple avec `nvm install`) et activer pnpm : `corepack enable`
3. Installer les dépendances : `pnpm install`
4. Démarrer la base (Docker Desktop lancé) : `docker compose -f apps/api/docker-compose.yml up -d db`
5. Tout vérifier (types, style, structure, tests) : `pnpm check`
6. L'ouvrir dans VS Code avec Claude Code : les fichiers `CLAUDE.md` donnent le contexte à l'agent, et Claude ne peut pas annoncer une tâche terminée si `pnpm check` échoue (réglage dans `.claude/settings.json`).
6. Documentation SDK MSFS (copie locale, non versionnée) : `cd apps/tracker && bash scripts/update-msfs-docs.sh`

| Commande | Rôle |
| --- | --- |
| `pnpm check` | Tout : types, style, structure, tests. Doit passer avant toute fusion |
| `pnpm format` | Remet le code en forme automatiquement |
| `pnpm structure` | Frontières entre modules, code dupliqué, code inutilisé |
| `pnpm test` | Tests de toutes les applications et de tous les paquets, et le test de bout en bout `e2e/` (tracker → API → base) ; base `weems_test` nécessaire |
| `pnpm test:j2` | Test de sortie du site J2 : construit le site, puis vérifie dans un navigateur sans écran qu'un vol de 2 h s'affiche en moins de 2 s, en français et en anglais ; base `weems_test` nécessaire |
| `pnpm test:j1` | Test de sortie de J1 : 10 pilotes simulés à ×10 sur la vraie API et son flux en direct (environ 6 minutes) ; base `weems_test` nécessaire |
| `docker compose -f apps/api/docker-compose.yml up` | API complète sur http://localhost:3000, documentation sur http://localhost:3000/docs |
| `pnpm --filter @weems/web dev` | Site sur http://localhost:3001, carte en direct sur http://localhost:3001/live |

**Schémas** : sources Mermaid dans `docs/schemas/`, images régénérées par `bash scripts/render-schemas.sh`.

## Feuille de route

Détail dans [Lots et feuille de route](docs/cadrage/04-lots-et-feuille-de-route.md). Pas de dates : on passe à l'étape suivante quand son critère de sortie est atteint.

| Jalon du lot 1 | Objectif | Où |
| --- | --- | --- |
| J0 | Fondations : tracker T0, squelette de l'API | Mac |
| J1 | 10 pilotes simulés suivis sur la carte en direct | Mac |
| J2 | Premier vrai vol affiché sur le site | Mac + PC Windows |
| J3 | Alpha fermée, 5 pilotes | Serveur de Greg |
| J4 | Bêta, environ 50 pilotes, Store limité | Production |
| J5 | Version 1.0 publique sur le Store | Production |

Ensuite : lot 2 abonnement pilote, lot 3 gestion de compagnie, lot 4 app iPad.
