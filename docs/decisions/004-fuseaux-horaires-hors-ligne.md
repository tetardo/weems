# 004 — Fuseaux horaires sans service extérieur

Date : 11/11/2026. Proposé par Claude pour le graphique « Heures de décollage » du profil public (spec J4), choisi par Greg avec les maquettes.

## Contexte

Le graphique place chaque décollage à son heure locale, celle de l'aéroport de départ. L'heure UTC serait fausse pour un pilote hors d'Europe. Il faut donc trouver le fuseau horaire d'une position (latitude, longitude), sans appeler de service extérieur : règle « tout en local », aucune donnée de vol envoyée ailleurs.

## Options étudiées

| Option | Taille | Pour | Contre |
| --- | --- | --- | --- |
| `@photostructure/tz-lookup` (CC0) | 88 Ko, aucune dépendance | Appel direct et rapide, mis à jour plusieurs fois par an | Frontières simplifiées : imprécis à quelques kilomètres d'une frontière de fuseau |
| `geo-tz` (MIT) | 75 Mo | Frontières exactes | Trop lourd pour l'image Docker de l'API, chargement asynchrone |
| Service web (Google Time Zone, TimeZoneDB) | — | Exact | Clé, quota, données de vol envoyées à un tiers |

## Choix

`@photostructure/tz-lookup`, version 11.7.0 (septembre 2026, au moins deux semaines d'ancienneté), fixée dans `apps/api/package.json`. L'heure locale est ensuite calculée avec `Intl.DateTimeFormat` de Node.js, qui connaît les changements d'heure.

## Conséquences

- Code : `apps/api/src/modules/profiles/takeoff-hours.ts`, seul fichier qui l'importe.
- Un aéroport à quelques kilomètres d'une frontière de fuseau peut être compté dans le fuseau voisin : sans effet visible sur un graphique par heure.
- Mettre la bibliothèque à jour quand les fuseaux changent (rare) : elle suit la base de l'IANA.
