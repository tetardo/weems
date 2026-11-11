# 005 — Liste des aéroports : OurAirports, fichier dans l'API

Date : 11/11/2026. Pour la trajectoire de la carte en direct (spec `web/spec-J4-trajectoire-direct.md`).

## Contexte

Le tracker envoie seulement les codes OACI de départ et d'arrivée. Pour tracer la route et calculer la progression, il faut leurs coordonnées. Aucune liste d'aéroports n'existait dans le dépôt.

## Options

| Option | Pour | Contre |
| --- | --- | --- |
| A. OurAirports (domaine public), fichier filtré dans l'API | Gratuit, sans licence à respecter, hors ligne, mondial (46 704 codes) | Fichier de 2,1 Mo dans le dépôt, mis à jour à la main ; pas toujours identique à la base MSFS |
| B. Table PostgreSQL chargée par un script | Requêtes SQL possibles (recherche par nom) | Migration + chargement à chaque environnement, sans besoin actuel |
| C. Service en ligne (API d'aéroports) | Toujours à jour | Clé, quota, coût, dépendance réseau |
| D. Coordonnées envoyées par le tracker (lues dans MSFS) | Exactement la base du simulateur | Change le contrat du tracker, inutile si le pilote ne saisit pas son plan de vol |

## Choix

A. `pnpm --filter @weems/api airports:update` télécharge `airports.csv` d'OurAirports, garde aéroports, hydrobases et héliports ouverts, indexés par identifiant OurAirports (code OACI s'il existe) puis par codes OACI et GPS libres, et réécrit `apps/api/data/airports.csv` (`icao,lat,lon,name`). L'API charge la liste en mémoire au démarrage (environ 10 Mo).

## Conséquences

- Un code saisi dans le tracker absent de la liste donne `null` : pas de progression, le site le dit.
- Si un jour il faut chercher un aéroport par nom ou ville (gestion de compagnie, lot 3), passer à l'option B avec le même fichier comme source.
- Option D à reprendre si les pilotes signalent des écarts de position entre MSFS et Weems.
