# Atterrissage, piste et surface

Résumé de travail, rédigé le 2026-11-10 à partir de la doc SDK MSFS 2024 (`simvars-aircraft-misc.md`).

## Valeurs au toucher fournies par le simulateur

| SimVar | Unité | Contenu |
| --- | --- | --- |
| `PLANE TOUCHDOWN NORMAL VELOCITY` | ft/s | Vitesse perpendiculaire au sol au dernier toucher = taux d'atterrissage |
| `PLANE TOUCHDOWN PITCH DEGREES` | degrés | Assiette au toucher |
| `PLANE TOUCHDOWN BANK DEGREES` | degrés | Inclinaison au toucher |
| `PLANE TOUCHDOWN HEADING DEGREES TRUE` / `MAGNETIC` | degrés | Cap au toucher |
| `PLANE TOUCHDOWN LATITUDE` / `LONGITUDE` | radians | Position du toucher |

« Dernier toucher » : en cas de rebond, la valeur est écrasée par le toucher suivant. Le tracker doit garder sa propre série d'échantillons autour de l'atterrissage pour détecter les rebonds et garder le premier impact.

Le taux en ft/s se convertit en ft/min (× 60) pour être comparé aux usages (par exemple -150 à -200 ft/min jugé idéal par certaines compagnies virtuelles).

## Surface

- `SURFACE TYPE` : type de revêtement (0 béton, 4 asphalte, liste complète dans la page SDK).
- `SURFACE CONDITION` : 0 normal, 1 mouillé, 2 gelé, 3 neige.
- `SURFACE INFO VALID` : dire si `SURFACE CONDITION` est exploitable.

## À croiser avec

- Les seuils et la longueur des pistes (base OurAirports) pour calculer la distance au seuil, la zone de toucher et la piste restante.
- Le vent (`AMBIENT WIND …`) et la masse (`TOTAL WEIGHT`) pour remettre l'atterrissage en contexte.
