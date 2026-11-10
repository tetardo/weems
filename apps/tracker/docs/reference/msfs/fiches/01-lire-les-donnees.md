# Lire les données de l'avion avec SimConnect

Résumé de travail, rédigé le 2026-11-10 à partir de la doc SDK MSFS 2024. La page complète est dans `../pages/` après lancement de `scripts/update-msfs-docs.sh`.

Sources : `simconnect-requestdataonsimobject.md`, `simconnect-addtodatadefinition.md`, `simconnect-period.md`.

## Principe en 3 appels

1. `SimConnect_AddToDataDefinition` : on déclare une « définition » = une liste de SimVars avec leur unité (voir `../../simvars.yaml`).
2. `SimConnect_RequestDataOnSimObject` : on demande à recevoir cette définition pour l'avion du joueur, à une certaine fréquence.
3. On reçoit des messages `SIMCONNECT_RECV_SIMOBJECT_DATA` dans la boucle de messages.

## Objet visé

Toujours `SIMCONNECT_OBJECT_ID_USER` pour l'avion du joueur. Ne pas réutiliser un identifiant obtenu par une requête par type : il peut changer, surtout en multijoueur.

## Fréquence (`SIMCONNECT_PERIOD`)

| Valeur | Effet | Usage Weems |
| --- | --- | --- |
| `NEVER` | Rien n'est envoyé | Suspendre une requête avant de modifier sa définition |
| `ONCE` | Une seule fois | Chaînes (TITLE, ATC ID) |
| `VISUAL_FRAME` | À chaque image affichée | À éviter (dépend des images par seconde) |
| `SIM_FRAME` | À chaque image simulée | Près du sol : décollage, atterrissage |
| `SECOND` | Une fois par seconde | Croisière |

Paramètres utiles : `origin` (attendre N périodes avant le premier envoi), `interval` (envoyer toutes les N périodes), `limit` (arrêter après N envois).

## Options (`flags`)

- `CHANGED` : envoyer seulement quand une valeur change. Si une seule valeur change, toute la définition est renvoyée.
- `TAGGED` : chaque valeur arrive avec son identifiant. Pratique avec `CHANGED`.

## Bonnes pratiques tirées de la doc

- Changer de fréquence : renvoyer le même appel (mêmes RequestID, DefineID, ObjectID) avec la nouvelle période. Pas possible avec `ONCE` : utiliser un nouveau RequestID.
- Mettre en pause une requête : grand `interval` plutôt que changer la période (moins coûteux).
- Modifier une définition : passer la requête à `NEVER`, modifier, puis réactiver.
- Pas de chaînes de longueur variable dans une requête périodique.
- Booléens : 0 = faux, mais vrai peut valoir 1 ou -1. Toujours tester « différent de 0 ».
- Besoin seulement d'un top d'horloge, sans données : `SimConnect_SubscribeToSystemEvent` (événements `1sec`, `4sec`, `6Hz`).
