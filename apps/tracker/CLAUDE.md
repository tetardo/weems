# Weems Tracker

Application Windows qui lit Microsoft Flight Simulator pendant un vol, en déduit les phases, juge la conduite du vol selon des règles réelles, et envoie la position en direct puis un rapport de vol à l'API Weems.

Weems est un écosystème freemium pour passionnés de simulation (amateurs à semi-pros) : tracker, API, suivi des vols web, EFB iPad, gestion de compagnie virtuelle. Le réalisme est la marque de fabrique. Jamais pour la navigation réelle.

## Périmètre du lot 1 (décidé)

- MSFS 2020 et 2024 uniquement, sur Windows, via SimConnect.
- X-Plane plus tard : le cœur du tracker (modèle, phases, règles, enregistrement, envoi) ne doit jamais dépendre de Windows ni de SimConnect. Seul le connecteur MSFS le peut.
- Différenciation visée : note de confort passagers, pressurisation, approche stabilisée, remise des gaz valorisée, atterrissage remis en contexte, débriefing en langage clair.

## Stack (proposée le 2026-11-10, à confirmer par le prototype)

- TypeScript (Node.js) partout ; application de bureau Electron ; SQLite pour l'enregistreur local.
- Connecteur MSFS : `node-simconnect` (protocole SimConnect en TypeScript pur). Repli si insuffisant : connecteur C# séparé avec le SDK officiel, même interface.
- Python seulement pour l'analyse des vols de test, pas dans l'application.
- Code partagé avec l'API : formats échangés dans `../../packages/contrats`, règles et calcul de la note dans `../../packages/notation`. Ne jamais les dupliquer ici.
- Distribution : Microsoft Store (paquet MSIX construit par GitHub Actions sur Windows). Développement sur Mac : le cœur doit tourner et être testé sans Windows.

## Où trouver quoi

Lire le fichier indiqué AVANT de chercher sur le web. Si l'information manque, la chercher dans `docs/reference/msfs/pages/`, puis seulement sur le web, et ajouter ce qu'on a appris à la référence.

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Pourquoi on fait ça, fonctionnalités, concurrence, données à exploiter | `../../docs/cahiers-des-charges/tracker/CDC-Tracker.md` |
| Découpage interne : cœur, connecteurs, SQLite, file d'envoi, format de rejeu | `../../docs/cahiers-des-charges/tracker/architecture-interne.md` |
| Données reçues par le cœur, règles des 12 phases, seuils (lot T0) | `../../docs/cahiers-des-charges/tracker/spec-T0.md` |
| Quelle SimVar lire, son unité, sa fiabilité | `docs/reference/simvars.yaml` |
| Comment demander des données à SimConnect (fréquences, options) | `docs/reference/msfs/fiches/01-lire-les-donnees.md` |
| Pause, crash, chargement, téléportation, slew | `docs/reference/msfs/fiches/02-evenements-systeme.md` |
| Atterrissage, toucher, état de piste | `docs/reference/msfs/fiches/03-atterrissage-et-piste.md` |
| Comportements surprenants du simulateur | `docs/reference/pieges.md` (à lire avant toute modification de la lecture des données) |
| Doc SDK officielle complète, page par page | `docs/reference/msfs/pages/` (liste dans `docs/reference/msfs/sources.txt`) |

## Règles pour un agent

- Ne jamais inventer un nom de SimVar ou une unité. Vérifier dans `simvars.yaml` (`verified: true` = présente dans la doc SDK téléchargée). Une nouvelle variable : la chercher dans `docs/reference/msfs/pages/simvars-index-a-z.md`, puis l'ajouter au YAML. Après test dans le simulateur, mettre à jour `reliability`.
- Tout nouveau piège découvert va dans `docs/reference/pieges.md` (date, avion, version MSFS, source).
- Une donnée indisponible sur un avion ne doit jamais pénaliser le pilote : le tracker l'indique « non mesurée ».
- Les tests passent par le connecteur de test (rejeu de vols enregistrés et scénarios), pas par le simulateur.

## Mettre la documentation à jour

```
bash scripts/update-msfs-docs.sh
```

Télécharge les pages listées dans `docs/reference/msfs/sources.txt`, signale les nouveautés, les modifications (fichiers `.diff`) et les URL invalides, et l'inscrit dans `docs/reference/msfs/CHANGELOG.md`. À relancer après chaque mise à jour du SDK MSFS.

La doc SDK appartient à Microsoft : `docs/reference/msfs/pages/` reste privé (voir `.gitignore`), ne jamais le publier dans un dépôt public.
