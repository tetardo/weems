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
- [Cahier des charges du tracker](docs/cahiers-des-charges/tracker/CDC-Tracker.md) : exigences, contrat avec l'API, lots T0 à T4
- [Spécification T0 du tracker](docs/cahiers-des-charges/tracker/spec-T0.md) : données reçues et règles des phases
- [À voir avec Houssine](docs/suivi/a-voir-avec-houssine.md) : questions en attente pour la communauté
- [Référence MSFS du tracker](apps/tracker/CLAUDE.md) : quelles données lire et comment

## Travailler sur le projet

1. Cloner le dépôt : `git clone https://github.com/tetardo/weems`
2. L'ouvrir dans VS Code avec Claude Code : les fichiers `CLAUDE.md` donnent le contexte à l'agent.
3. Documentation SDK MSFS (copie locale, non versionnée) : `cd apps/tracker && bash scripts/update-msfs-docs.sh`

## Feuille de route

Lot 1 de Weems : tracker MSFS + API + suivi web. Le tracker avance en 5 lots :

| Lot | Objectif | Prérequis |
| --- | --- | --- |
| T0 | Fondations sur Mac : phases de vol, règles, enregistreur, vols synthétiques | — |
| T1 | Prototype du connecteur MSFS, mesures de performance, paquet Store | PC Windows avec MSFS |
| T2 | Alpha avec 5 pilotes | API minimale |
| T3 | Bêta avec environ 50 pilotes | Carte de suivi web |
| T4 | Version 1.0 sur le Microsoft Store | — |
