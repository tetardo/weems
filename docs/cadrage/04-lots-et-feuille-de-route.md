# Weems — Lots et feuille de route

Étape 3 du cadrage, rédigée le 11/11/2026. S'appuie sur le parc (01), l'architecture (02) et les fondamentaux (03).

## Synthèse

- Pas de dates : une suite d'étapes ordonnées. On ne passe à l'étape suivante que lorsque son critère de sortie est atteint.
- **Lot 1 — Carnet de vol connecté** (gratuit) : tracker MSFS + API + site web. Il avance en 5 jalons, J0 à J4, qui alignent les trois applications. Les lots internes du tracker (T0 à T4) s'y rangent un pour un.
- Ensuite, un lot par source de valeur : abonnement pilote, gestion de compagnie virtuelle, app iPad. X-Plane vient plus tard.
- Tout se développe et se teste sur le Mac de Greg jusqu'à l'arrivée des pilotes testeurs (J2).

## Vue d'ensemble

| Lot | Contenu | Pour qui | Revenu |
| --- | --- | --- | --- |
| **1 — Carnet de vol connecté** | Tracker MSFS, API, site web de suivi (carnet, page de vol, carte en direct) | Tous les pilotes | Gratuit |
| **2 — Abonnement pilote** | Fonctions avancées du site de suivi, paiement, micro-entreprise | Pilotes exigeants | Abonnement pilote |
| **3 — Gestion de compagnie (VACommunity)** | Compagnies, flottes, routes, validation des vols, classements | Fondateurs de compagnies virtuelles | Abonnement compagnie |
| **4 — App iPad (EFB)** | Cartes, check-lists, performances, suivi en direct (Swift) | Pilotes sur iPad | À définir |
| **Plus tard** | Connecteur X-Plane | Pilotes X-Plane | — |

L'ordre des lots 2 et 3 est une décision ouverte (voir plus bas).

## Lot 1 en 5 jalons

Chaque jalon est utilisable et vérifiable seul. Les colonnes Tracker, API et Web disent ce que chaque application doit apporter au jalon.

| Jalon | Tracker | API | Web | Où ça tourne | Critère de sortie |
| --- | --- | --- | --- | --- | --- |
| **J0 — Fondations** | T0 : modèle de télémétrie, 12 phases, enregistreur, vols synthétiques, règles v0 | Squelette Fastify, base PostgreSQL, réception d'un vol, contrat OpenAPI | — | Mac (Docker) | Les 20 scénarios synthétiques passent ; un vol synthétique envoyé est stocké par l'API |
| **J1 — Premier vrai vol** | T1 : connecteur MSFS, 10 vols de référence, mesure de l'impact sur les images par seconde | Réception des vols réels | Carnet de vol et page de vol avec trace sur carte, sans compte | Mac + PC Windows en réseau local | Les 10 vols de référence s'affichent sur le site avec leurs phases correctes |
| **J2 — Alpha fermée** | T2 : connexion au compte, envoi, file d'attente hors ligne, rapport de vol | Comptes (OAuth avec PKCE), vols, recalcul de la note | Connexion, carnet personnel, page de vol | Machine virtuelle sur le serveur Hetzner de Greg | 5 pilotes, 50 vols, zéro vol perdu, phases correctes sur au moins 95 % des vols vérifiés |
| **J3 — Bêta** | T3 : capacités différenciantes, débriefing, Store en diffusion limitée | Position en direct, environnement de test séparé | Carte en direct, débriefing, profil public | Production publique (Scaleway) | Environ 50 pilotes, 500 vols, moins de 1 % de vols en erreur, seuils de notation calés |
| **J4 — Version 1.0** | T4 : Store public, français et anglais | Supervision, procédure de correctif d'urgence | Pages publiques référencées, CGU, confidentialité | Production publique | Exigences du lot 1 validées ; correctif d'urgence testé de bout en bout |

Le « premier jalon » voulu par Greg (une API, un tracker et un site simple qui affiche les premières infos) correspond à **J1**, sur le Mac.

### Ce qu'il faut avoir défini avant chaque jalon

| Avant | À définir | Besoin d'un pilote |
| --- | --- | --- |
| Fin de J0 | Format de vol enregistré et 20 scénarios de test (point 3 de la spec T0) ; critères de notation et sources officielles (point 4) | Oui |
| J1 | Cahier des charges du site web, version minimale (carnet, page de vol) | Non |
| J2 | Organisation du code de l'API (Fastify, réponse de Thibault) ; liste des 5 pilotes testeurs (Houssine) | Non |
| J3 | Contenu du débriefing ; CGU et confidentialité ; vérification de la marque « Weems » ; micro-entreprise créée et compte Store ouvert à son nom | Débriefing : oui |
| J4 | Procédure de support et de correctif d'urgence | Non |

## Lots suivants

| Lot | Prérequis | Critère d'entrée | À définir au démarrage |
| --- | --- | --- | --- |
| **2 — Abonnement pilote** | Version 1.0 en ligne, micro-entreprise | Assez de pilotes actifs pour mesurer la conversion | Liste des fonctions avancées, prix, service de paiement (penchant Paddle) |
| **3 — Gestion de compagnie** | Lot 1 ; paiement en place | Prix validé auprès de 5 à 10 fondateurs de compagnies | Cahier des charges VACommunity, tarif par taille de compagnie |
| **4 — App iPad** | Lot 1 ; développeur Swift ou relecture assurée | — | Cahier des charges EFB, sources de cartes (licences) |

## Décision ouverte

**Ordre des lots 2 et 3.** Recommandation : abonnement pilote d'abord [Confiance moyenne]. Il est petit, il apporte un premier revenu plus tôt, et il met en place le paiement et la micro-entreprise dont la gestion de compagnie aura aussi besoin. La validation du prix auprès des fondateurs de compagnies peut se faire pendant ce temps. Contre-argument : l'étape 1 jugeait le revenu des compagnies plus sûr (un seul acheteur, beaucoup d'utilisateurs).

## Risques de la feuille de route

| Risque | Parade |
| --- | --- |
| Pas d'échéance : le projet peaufine sans jamais arriver en vol réel | Critère de sortie par jalon, vérifié avant de passer au suivant |
| Points 3 et 4 de la spec T0 bloqués faute de pilote | Les traiter dès qu'un collègue pilote est disponible ; J0 ne se clôt pas sans eux |
| Greg seul sur le code | Un jalon à la fois, garde-fous qualité (tests, revue de code par Claude) |
| Mise à jour de MSFS qui casse le tracker | Rejouer les 10 vols de référence à chaque version de MSFS |
