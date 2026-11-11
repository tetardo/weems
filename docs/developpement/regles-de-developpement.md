# Règles de développement

Rédigées le 11/11/2026, avant la première ligne de code. Elles valent pour tout le dépôt et pour toute personne ou tout agent qui code : Greg, Claude, puis Houssine ou Thibault s'ils contribuent.

But : garder un code fiable alors que Greg code seul avec Claude, sans relecteur humain.

## 1. Définition de « terminé »

Une modification n'est terminée que si **tous** ces points sont vrais :

1. Elle répond à une exigence écrite (cahier des charges ou spécification), citée dans la demande de fusion.
2. Elle est couverte par des tests automatiques qui échouaient avant et passent après.
3. La vérification des types, le contrôle du style et tous les tests passent, sur le Mac et dans l'intégration continue.
4. Elle a été relue par Claude (`/code-review`), avec `/security-review` si elle touche la connexion, les droits, les données personnelles ou les entrées venant de l'extérieur.
5. La documentation concernée est à jour : spécification, `CLAUDE.md` de l'application, `README.md` si l'usage change.
6. Elle tourne sur le Mac de Greg (sauf le connecteur MSFS, testé sur le PC Windows).

## 2. Branches et fusions

- `main` est toujours dans un état qui fonctionne. On n'y pousse jamais directement.
- Une branche courte par sujet (`feat/flights-api`, `fix/phase-bounce`), fusionnée par une demande de fusion (pull request), même quand Greg travaille seul : c'est ce qui déclenche l'intégration continue et la relecture.
- Fusion en un seul commit (squash), avec un message qui dit ce qui change et pourquoi.
- Messages de commit : préfixe en anglais (`feat`, `fix`, `docs`, `test`, `chore`), description en français.
  Exemple : `feat(api): réception des événements de vol sans doublon`.
- Protection de `main` sur GitHub : fusion seulement si l'intégration continue est verte.

## 3. Outils communs

| Sujet | Choix | Pourquoi |
| --- | --- | --- |
| Node.js | Version LTS en cours, fixée dans `.nvmrc` | La même sur le Mac, le PC et l'intégration continue |
| Gestion du dépôt | pnpm avec espaces de travail (`apps/*`, `packages/*`) [Confiance moyenne] | Gère proprement les paquets partagés d'un dépôt unique, rapide, économe en disque |
| TypeScript | Mode strict, aucun `any` sans commentaire qui le justifie | Les erreurs de type sont la première protection quand personne ne relit |
| Style | ESLint et Prettier, appliqués automatiquement | Aucun débat de forme, diff lisibles |
| Tests | Vitest partout | Un seul outil à connaître |
| Formats partagés | Zod dans `packages/contrats` | Une seule définition pour le tracker, l'API et le site |

Une commande à la racine lance tout : `pnpm check` (types, style, tests).

## 4. Tests

| Partie | Ce qui doit être testé | Comment |
| --- | --- | --- |
| Cœur du tracker | Chaque transition de phase, chaque cas particulier de la spec T0, chaque règle de notation | Vols synthétiques et vols rejoués, sans simulateur |
| Connecteur MSFS | Conversions d'unités, valeurs absentes, événements | Données enregistrées sur le PC, rejouées sur le Mac |
| API | Chaque route : cas normal, renvoi en double, données invalides, droits | Vraie base PostgreSQL dans Docker, jamais de base simulée |
| Site web | Les parcours principaux (carnet, page de vol, carte) | Tests de navigateur automatisés, à partir de J2 |

Pas d'objectif de pourcentage de couverture : il pousse à écrire des tests inutiles. La règle est qualitative : **chaque exigence a au moins un test, chaque bogue corrigé reçoit le test qui l'aurait détecté.**

## 5. Intégration continue (GitHub Actions)

À chaque demande de fusion et à chaque fusion sur `main` :

1. installation, vérification des types, contrôle du style ;
2. tests, avec un service PostgreSQL ;
3. construction des applications.

À partir de T1, une étape sur un serveur Windows construit le paquet MSIX du tracker.

## 6. Garde-fous pour Claude Code

- Un crochet (hook) de fin de tâche lance `pnpm check` : Claude ne peut pas annoncer « terminé » si les vérifications échouent.
- Chaque application a son `CLAUDE.md` : rôle, commandes, organisation, règles propres. Il est mis à jour dans la même demande de fusion que le code qu'il décrit.
- Avant une fusion : `/code-review`, puis `/simplify` si la modification est longue.
- Claude n'ajoute jamais une dépendance sans dire pourquoi, et préfère ce qui existe déjà dans le dépôt.

## 7. Sécurité et secrets

- Aucun secret dans le dépôt. Un fichier `.env.example` liste les variables nécessaires, sans valeurs ; `.env` est ignoré par git.
- Les secrets de l'intégration continue sont dans les secrets GitHub.
- Dependabot vérifie les dépendances chaque semaine ; les alertes de sécurité sont traitées avant toute nouvelle fonctionnalité.
- Toute donnée reçue de l'extérieur (tracker, navigateur, services tiers) est validée par les schémas de `packages/contrats` avant usage.

## 8. Décisions techniques

- Les décisions d'architecture du cadrage restent dans le tableau du document [Architecture et flux](../cadrage/02-architecture-et-flux.md).
- À partir de J0, chaque nouveau choix technique qui engage la suite (une bibliothèque structurante, un format, un abandon) fait l'objet d'une fiche courte dans `docs/decisions/` : contexte, options, choix, conséquences. Numérotées `001-…`, jamais supprimées, remplacées par une nouvelle fiche si on change d'avis.

## 9. Journaux et erreurs

- Journaux structurés en JSON (pino, fourni avec Fastify), jamais de données personnelles en clair (e-mail, jeton).
- Chaque requête porte un identifiant repris dans tous les journaux qu'elle produit, pour retrouver un problème signalé par un pilote.
- Côté tracker, un fichier journal local que le pilote peut joindre à un signalement.

## 10. Langue

- Documents et messages de commit : français.
- Code, noms, commentaires et messages d'erreur de l'API : anglais.
- Textes affichés aux utilisateurs : en français et en anglais, dans des fichiers de traduction, jamais écrits en dur dans le code.
