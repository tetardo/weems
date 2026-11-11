# Pièges connus

Ce fichier grandit avec le projet. Chaque fois qu'un comportement du simulateur surprend, l'ajouter ici avec la date, l'avion, la version de MSFS et la source. Un agent doit le lire avant de toucher à la lecture des données ou aux événements.

Format : **titre court** — ce qui se passe — ce qu'on fait — source.

## MSFS 2024

- **Variables internes « scopées » illisibles** — Les variables `L:1:…` des avions (propres à chaque instance d'avion) ne sont pas lisibles par SimConnect ; aucune erreur, juste pas de donnée. — Passer par un module WASM (FSUIPC, WASimCommander ou un module Weems) pour les avions concernés. — [forum développeurs MSFS](https://devsupport.flightsimulator.com/t/how-to-access-scoped-lvars-l-with-simconnect/12540)
- **`SimStop` pas toujours envoyé** — En revenant au menu principal, MSFS 2024 n'envoie pas toujours `SimStop`. — Ne pas s'y fier seul : surveiller aussi l'arrêt des données. — [forum développeurs MSFS](https://devsupport.flightsimulator.com/t/msfs2024-not-sending-simstop-when-leaving-for-the-main-menu/11572)
- **Événements de pause peu fiables** — Le mode photo n'envoie pas d'événement de pause ; certains avions (PMDG 777) génèrent des pauses/reprises en boucle ; la pause est signalée levée juste après avoir cliqué sur « Voler ». — Croiser avec l'avancement réel du temps de simulation avant de compter une pause. — [forum développeurs MSFS](https://devsupport.flightsimulator.com/t/photo-mode-does-not-send-pause-events/15233), [support TFDi](https://support.tfdidesign.com/support/solutions/articles/62000236066-persistent-paused-unpaused-log-spam-with-pmdg-777-in-microsoft-flight-simulator-2024)
- **`SimStart`/`SimStop` en double** — Des paires supplémentaires arrivent lors d'une réinitialisation de vol ou à l'écran d'accueil. — Machine à états tolérante aux répétitions. — doc SDK `SubscribeToSystemEvent`

## Toutes versions

- **Booléens à -1** — Vrai peut valoir 1 ou -1. — Tester « différent de 0 ». — doc SDK `RequestDataOnSimObject`
- **Chaînes en périodique** — Les chaînes de longueur variable dans une requête périodique posent problème. — Lire TITLE, ATC ID avec `ONCE`. — doc SDK `RequestDataOnSimObject`
- **Taux d'atterrissage écrasé par un rebond** — `PLANE TOUCHDOWN NORMAL VELOCITY` garde le dernier toucher. — Échantillonner nous-mêmes autour du toucher. — doc SDK, variables diverses
- **Valeurs aberrantes en cas de chute d'images** — Des outils d'analyse d'atterrissage ont reçu des valeurs du type -999999 lors de chutes d'images. — Filtrer les valeurs hors plage physique. — [MSFS Landing Inspector](https://forums.flightsimulator.com/t/msfs-landing-inspector-update-oct-1-freeware-tool-for-analyzing-landings/286918)

- **Unités : demander l'unité voulue** — Le SDK indique une unité native (ex. `PLANE PITCH DEGREES` en radians malgré son nom) ; SimConnect convertit si on demande une unité compatible (`degrees`). Toujours préciser l'unité dans `AddToDataDefinition`. — `simvars.yaml`, champ `doc_unit`
- **Faux booléens** — `GEAR HANDLE POSITION`, `EXIT OPEN:n`, `APU PCT RPM` sont des pourcentages (0 à 1), pas des booléens. — Utiliser `percent_over_100` et un seuil. — doc SDK, vérifié le 2026-11-10
- **Heure et vitesse de simulation introuvables dans les SimVars** — `ZULU TIME` et `SIMULATION RATE` ne sont pas dans les pages SimVars téléchargées ; probablement des variables d'environnement documentées ailleurs. — Trouver la page et l'ajouter à `sources.txt`. — constat du 2026-11-10

## À confirmer au premier vol réel (J2, 11/11/2026)

Choix faits dans le connecteur sans avoir pu tester ; chaque ligne devient un piège daté ou est retirée après les vols de référence.

- **Signe de l'assiette et de l'inclinaison** — Le connecteur inverse `PLANE PITCH DEGREES` et `PLANE BANK DEGREES` (constantes `PITCH_SIGN`, `BANK_SIGN` de `to-sample.ts`). Vérifier : cabré au décollage = assiette positive ; virage à droite = inclinaison positive.
- **Codes de `PUSHBACK STATE`** — Supposés 0, 1, 2 = repoussage en cours, 3 = aucun. Si faux, le vol s'ouvrirait au chargement ou jamais par le repoussage.
- **MSFS 2020 ou 2024** — Déduit de la version renvoyée à la connexion (11 = 2020, 12 = 2024).
- **N1 des moteurs à pistons** — 0 lu → « non mesuré ». À vérifier sur un Cessna 172.
- **Pause (`Pause_EX1`)** — Toute valeur non nulle = en pause. Croiser avec les pièges de pause ci-dessus.

## À compléter pendant les tests

- Comportement des avions complexes (Fenix A320, PMDG 737/777, FlyByWire A32NX, iniBuilds) pour les familles 15, 17, 18, 20 : quelles SimVars standard sont à jour, lesquelles non.
