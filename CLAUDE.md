# Weems — dépôt unique

Lire d'abord `README.md` (organisation). Chaque application a son propre `CLAUDE.md` (par exemple `apps/tracker/CLAUDE.md`).

- Langue des documents : français. Code et identifiants : anglais.
- Stack : TypeScript partout (Node.js), Python seulement pour l'analyse de données.
- Le code partagé entre applications va dans `packages/`, jamais copié dans une application.
- Les décisions et cahiers des charges sont dans `docs/` : les consulter avant de proposer une fonctionnalité.
- Développeur principal sur Mac : tout ce qui ne parle pas directement au simulateur doit tourner et être testé sur Mac.
