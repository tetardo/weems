# Spécification J4 — Trajectoire et progression sur la carte en direct

Date : 11/11/2026. Demande de Greg : « sur la vue direct, ajoute la trajectoire d'un aéroport à l'autre avec la progression ».

## 1. Ce que voit le spectateur

Quand il clique sur un avion de la carte `/live` :

| Élément | Rendu |
| --- | --- |
| Trace parcourue | Trait plein, couleur des avions, du premier point reçu par l'API jusqu'à l'avion |
| Reste à parcourir | Orthodromie (route la plus courte sur le globe) de l'avion à l'aéroport d'arrivée, en pointillés |
| Aéroports | Point et code OACI du départ et de l'arrivée |
| Progression (panneau du vol) | Barre, pourcentage, distance restante en NM, temps restant estimé (h:mm) à la vitesse sol actuelle |

Rien n'est dessiné pour les autres vols : la carte reste lisible et le coût ne dépend pas du nombre de vols.

![Échange entre tracker, API et site](../../schemas/img/j4-trajectoire-direct.png)

## 2. Règles de calcul

- Progression = distance directe départ → avion / (départ → avion + avion → arrivée). Elle ne recule pas sur un détour et vaut 100 % à l'arrivée. La trace n'entre pas dans le calcul : elle est perdue au redémarrage de l'API.
- Distance restante : orthodromie avion → arrivée, rayon terrestre moyen 3 440,065 NM.
- Temps restant : distance restante / vitesse sol ; absent sous 50 kt (sol, attente).
- Une route qui passe l'antiméridien est dessinée par le côté court.

## 3. Aéroport inconnu

L'arrivée n'est connue que si le pilote la saisit dans le tracker (champ facultatif). Sans départ ou sans arrivée, ou si le code n'est pas dans la liste d'aéroports de Weems, le panneau le dit et n'affiche pas de progression ; la trace parcourue reste dessinée.

## 4. API

- `GET /v1/live/flights/{flightId}/route` (format `LiveRoute` de `packages/contrats`) : départ, arrivée (ou `null`), trace `[lon, lat]`. Publique comme le flux du direct. 404 si le vol n'est pas sur la carte.
- Trace en mémoire dans le module `live` : un point toutes les 15 s de vol (heure de l'échantillon), au plus 1 500 points par vol (au-delà, un point sur deux est retiré). 500 vols tiennent sous 30 Mo.
- Aéroports : liste OurAirports dans `apps/api/data/airports.csv`, chargée au démarrage (fiche 005).
- Le site relit la route du vol sélectionné toutes les 30 s ; entre deux lectures, le trait suit l'avion à chaque image.

## 5. Critères d'acceptation

1. Un vol simulé LFPG → LFBO sélectionné montre la trace, l'orthodromie restante, les deux aéroports et une progression qui croît jusqu'à 100 %.
2. Un vol sans arrivée montre la trace et le message « Départ ou arrivée non renseigné ».
3. Avec 500 vols sur la carte, sélectionner un vol ne fait qu'une requête toutes les 30 s.
