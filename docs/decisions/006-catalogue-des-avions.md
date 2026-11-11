# 006 — Catalogue des avions : une liste écrite par Weems

Date : 11/11/2026. Validé par Greg avec les maquettes des catégories d'avion (spec [catégories d'avion](../cahiers-des-charges/spec-J4-categories-avion.md)).

## Contexte

Pour l'expérience par catégorie (profil public), la pastille de « Mes vols » et la carte du direct, chaque vol doit être rangé dans une catégorie d'avion. Le simulateur donne un code de type OACI (`ATC MODEL`), parfois vide ou propre à un module.

## Options

| Option | Pour | Contre |
| --- | --- | --- |
| Doc 8643 de l'OACI (liste officielle des types) | Complète | Données de l'OACI, reproduction soumise à autorisation : pas dans un dépôt public [Confiance moyenne] |
| Liste Wikipédia des codes de type | Libre | CC BY-SA 4.0 : attribution et partage à l'identique du fichier copié |
| **Liste écrite par Weems** | Aucune contrainte de licence (les codes de type sont des faits), limitée à ce que les pilotes volent dans MSFS | À compléter à la main |

## Choix

- Liste écrite par Weems, `apps/api/src/modules/aircraft/catalogue.ts` : environ 270 types rangés dans 8 catégories (léger, turbopropulseur, jet d'affaires, jet régional, moyen-courrier, long-courrier, hélicoptère, autres). Wikipédia sert seulement à vérifier.
- On range l'**avion**, pas le trajet : un A321LR reste moyen-courrier au-dessus de l'Atlantique.
- Type inconnu : catégorie **estimée** d'après le simulateur (voilure, type de moteur, masse maximale pour les réacteurs), marquée comme telle. Rien de connu : pas de catégorie.
- La catégorie est **stockée avec le vol** (filtres et totaux en SQL). Après une modification du catalogue, `pnpm reclassify` (API) met à jour les vols déjà enregistrés.
- Le pilote ne corrige pas la catégorie d'un vol en v1 : on corrige le catalogue, pour tout le monde.

## Conséquences

- Un type absent du catalogue reste « estimé » jusqu'à son ajout ; les seuils de masse se trompent parfois (le Global 7500, 52 t, tomberait en jet régional).
- Les ULM (VL3) sont rangés en « léger ».
