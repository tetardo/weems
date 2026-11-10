# Événements système : cycle de vie, pause, crash, triche

Résumé de travail, rédigé le 2026-11-10 à partir de la doc SDK MSFS 2024 (`simconnect-subscribetosystemevent.md`).

S'abonner avec `SimConnect_SubscribeToSystemEvent`. Les noms ne sont pas sensibles à la casse.

| Événement | Ce qu'il signale | Usage Weems |
| --- | --- | --- |
| `SimStart` / `SimStop` | Le simulateur tourne / ne tourne plus | Démarrer, suspendre le suivi |
| `Sim` | État courant, renvoyé tout de suite à l'abonnement | Connaître l'état au lancement du tracker |
| `FlightLoaded` | Un vol est chargé (nom du fichier) | Nouveau vol |
| `AircraftLoaded` | Le fichier de vol de l'avion change | Changement d'avion |
| `Pause_EX1` | Changement de pause, détaillé par bits (complète, active, simulation seule) | Temps passé en pause, règles de compagnie |
| `Paused` / `Unpaused` | Mise en pause / reprise | Idem, version simple |
| `Crashed` / `CrashReset` | Crash / fin de la séquence de crash | Vol terminé par un crash |
| `PositionChanged` | Le joueur a repositionné l'avion | Téléportation : vol invalidé hors cas prévus |
| `FlightPlanActivated` / `FlightPlanDeactivated` | Plan de vol activé / désactivé | Comparer au plan SimBrief |
| `1sec`, `4sec`, `6Hz`, `Frame` | Tops d'horloge | Cadencer des traitements |

Variable associée : `IS SLEW ACTIVE` (mode slew = déplacement libre de l'avion).

**Fiabilité :** plusieurs de ces événements posent problème sous MSFS 2024. Lire `../../pieges.md` avant de s'y fier.
