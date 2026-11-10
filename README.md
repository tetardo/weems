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
