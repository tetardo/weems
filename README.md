# Weems

Écosystème d'outils pour passionnés de simulation de vol : tracker, API, suivi des vols (web et iPad), gestion de compagnie virtuelle. Ne jamais utiliser pour la navigation réelle.

## Organisation

| Dossier | Contenu | État |
| --- | --- | --- |
| `apps/tracker` | Tracker de bureau pour MSFS 2020/2024 (TypeScript, Electron) | Documentation de référence en place, code à venir (lot T0) |
| `apps/api` | API centrale | Plus tard |
| `apps/web` | Suivi des vols sur le web | Plus tard |
| `packages/contrats` | Formats échangés entre le tracker et l'API | À créer au lot T0 |
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
- [Spécification J1](docs/cahiers-des-charges/spec-J1-pilotes-simules.md) : 10 pilotes simulés sur la carte en direct
- [Cahier des charges du tracker](docs/cahiers-des-charges/tracker/CDC-Tracker.md) : exigences, contrat avec l'API, lots T0 à T4
- [Spécification T0 du tracker](docs/cahiers-des-charges/tracker/spec-T0.md) : données reçues et règles des phases
- [À voir avec Houssine](docs/suivi/a-voir-avec-houssine.md) : questions en attente pour la communauté
- [À voir avec Thibault](docs/suivi/a-voir-avec-thibault.md) : questions techniques en attente
- [Référence MSFS du tracker](apps/tracker/CLAUDE.md) : quelles données lire et comment

## Travailler sur le projet

1. Cloner le dépôt : `git clone https://github.com/tetardo/weems`
2. L'ouvrir dans VS Code avec Claude Code : les fichiers `CLAUDE.md` donnent le contexte à l'agent.
3. Documentation SDK MSFS (copie locale, non versionnée) : `cd apps/tracker && bash scripts/update-msfs-docs.sh`

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
