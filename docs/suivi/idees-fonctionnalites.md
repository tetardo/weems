# Idées de fonctionnalités pour plus tard

Liste tenue à jour au fil du projet : idées validées sur le principe par Greg, sans lot ni date. Quand une idée entre dans un lot, la déplacer dans « Planifiées » avec le lien vers sa spécification.

## En attente

- **Niveau Weems** (ajouté le 11/11/2026, profil public)
  Heures de vol par catégorie d'avion (léger, turbopropulseur, ligne, hélicoptère), calculées à partir des vols, affichées sur le profil à côté du niveau déclaré par le pilote. Plus crédible que le niveau déclaré, car mesuré.
  Les heures par catégorie existent depuis la spec `docs/cahiers-des-charges/spec-J4-categories-avion.md` (bloc « Expérience par catégorie ») ; reste à en tirer un niveau.

- **Médailles de pilote** (ajouté le 11/11/2026, profil public ; remplacent les « badges », choix de Greg)
  Médailles illustrées (ruban et médaille en bronze, argent ou or selon la difficulté), attribuées automatiquement d'après les vols : premier vol, 10, 100 et 1 000 vols, plume (toucher très doux), transatlantique, globe-trotter, oiseau de nuit (heures de nuit), long-courrier, sécurité d'abord (remise des gaz suivie d'un atterrissage), approche stabilisée… Les médailles non obtenues apparaissent grisées avec la progression. Sur le profil : les plus récentes et un lien vers la page de toutes les médailles.
  Prérequis : la notation (point 4 de la spec T0) pour les médailles de pilotage (approche stabilisée, etc.).

  ![Maquette des médailles](img/medailles-maquette.png)

- **Médailles par catégorie d'avion** (ajouté le 11/11/2026, catégories d'avion)
  Premier vol en hélicoptère, 10 h en long-courrier, « touche-à-tout » pour 5 catégories volées… À construire avec les médailles de pilote, à partir de `stats.experience` du profil.

- **Signaler une photo de profil** (ajouté le 11/11/2026, profil public)
  Bouton « signaler » sur le profil public et retrait par Weems. À faire avant l'inscription libre.

- **Suivre un pilote, fil d'activité** (ajouté le 11/11/2026, profil public)
  Suivre d'autres pilotes et voir leurs derniers vols dans un fil.

- **Rejeu d'un vol** (ajouté le 11/11/2026)
  À garder pour l'abonnement pilote (lot 2). Pas encore dans le catalogue des formules.

- **Heures en ligne VATSIM et IVAO** (ajouté le 11/11/2026, profil public)
  Lues depuis les données publiques des deux réseaux, à partir des identifiants du profil. Vérifier leurs conditions d'usage.

- **Compagnie Weems pour tous les pilotes** (ajouté le 13/11/2026, page Boarding)
  Tout pilote inscrit fait partie par défaut d'une compagnie « Weems », pour faire vivre la communauté. Chaque compagnie aura sa propre page Boarding ; celle de Weems est la page Boarding publique. Les vols de la compagnie Weems pourraient être organisés par une IA, comme le feront les responsables des compagnies du lot 3 (VACommunity). Donne aussi plus de sens aux médailles (missions de compagnie, ponctualité).
  Rien à stocker tant que tous les pilotes en font partie : l'appartenance se déduit. Le jour où les compagnies arrivent (lot 3), créer les tables compagnies et adhésions, puis y inscrire tous les pilotes existants dans Weems.
  Bonus : des vols planifiés par la compagnie donnent une heure prévue, donc les statuts « Prévu » et « Retardé » du tableau Boarding.

- **Vols de la compagnie Weems organisés par une IA** (ajouté le 13/11/2026, page Boarding ; à rediscuter avec Greg)
  Une IA propose des vols aux pilotes de la compagnie Weems, comme le feront les responsables des compagnies du lot 3. Piste de Claude : générer les vols par des règles simples (terrains, catégorie d'avion, niveau du pilote), et réserver l'IA aux textes (briefings), pour le coût, la prévisibilité et les tests.

## Planifiées

- **Export du carnet** : clé `export` du catalogue des formules (Pilot Pro, « bientôt »), fiche [015](../decisions/015-catalogue-des-formules.md).
- **Compagnies du pilote sur son profil** : lot 3 (VACommunity). Emplacement montré sur la maquette du profil public.
