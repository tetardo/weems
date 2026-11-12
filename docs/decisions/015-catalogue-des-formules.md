# 015 — Catalogue des formules dans l'API, page Offres tenue à jour

Date : 12/11/2026. Demandé par Greg (« fabrique la page en fictive pour le moment, garde à jour la liste et la grille des fonctionnalités au fur et à mesure que l'on crée les autres pages », « tout par l'API »). Cadrage : [05 — Formules d'abonnement](../cadrage/05-formules-abonnement.md).

## Contexte

Quatre formules : Pilot Free, Pilot Pro, Company, Holding. Le paiement n'existe pas encore (lot 2). Greg veut une page Offres réelle dès maintenant, avec des prix fictifs, dont la liste des fonctions suit chaque nouvelle page du site sans être réécrite à la main.

## Options étudiées

| Option | Pour | Contre |
| --- | --- | --- |
| Liste des fonctions écrite dans la page du site | Rapide | Le site déciderait des droits ; deuxième liste à tenir le jour où l'API vérifiera les droits ; oubli certain |
| **Catalogue dans l'API, clés dans `packages/contrats`, textes dans le site** | Une seule liste ; l'API décide ; les mêmes clés serviront aux droits (`/v1/me`) ; des tests repèrent un oubli | Trois fichiers à toucher pour une nouvelle fonction |
| Catalogue en base, modifiable depuis la console | Changer une offre sans déploiement | Prématuré : pas de paiement, pas de client ; une migration et une page de console de plus |

## Choix

- `packages/contrats/src/api/plans.ts` : `FeatureKey` est la **liste unique** des fonctions qu'une formule peut contenir ; `PlanCatalog` est le format de `GET /v1/plans`.
- `apps/api/src/modules/plans/catalog.ts` : pour chaque clé, son groupe, si elle figure sur les cartes, et sa valeur dans chaque formule (`false`, `true`, une limite, `"unlimited"`). Prix en centimes, marqués `indicativePrices: true` tant qu'ils sont fictifs.
- `GET /v1/plans` (public, limite de débit, cache 5 min) et `GET /v1/me/plan` (pilote connecté ; tout le monde est en Pilot Free tant qu'il n'y a pas d'abonnement).
- Le site (`apps/web/src/plans/`) ne fait qu'afficher : chaque carte liste ce que la formule **ajoute** à celle qu'elle contient, calculé depuis le catalogue ; `/plans/compare` montre tout.
- Textes : `Plans.features.<clé>` dans `messages/fr.json` et `en.json`.

![Une nouvelle fonction, du contrat à la page Offres](../schemas/img/015-catalogue-des-formules.png)

## Règle

**Toute nouvelle fonction visible par le pilote, ou toute modification d'une fonction existante, met à jour le catalogue dans la même PR** : clé dans `FeatureKey`, ligne dans `catalog.ts`, textes FR et EN. La page Offres et le tableau suivent seuls. Des tests bloquent un oubli : chaque clé est décrite une fois par l'API, chaque clé a son texte, une formule ne perd jamais une fonction de la formule qu'elle contient.

## Conséquences

- Les fonctions du carnet de vol privé (maquettes v6 à v8, pas encore codées) sont déjà dans le catalogue : la page décrit l'offre visée, pas seulement ce qui existe.
- Les boutons « Passer à Pilot Pro », « Choisir Company » et « Choisir Holding » n'agissent pas (« Paiement bientôt disponible ») jusqu'au lot 2.
- Le jour où l'API vérifiera les droits, elle lira ce même catalogue : le code testera une clé (`approachAnalysis`), jamais un nom de formule.
