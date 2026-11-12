# Spécification J4 — Pilote sur la carte en direct (survol, vol suivi, enrichissements)

Date : 12/11/2026. Demande de Greg : « sur la carte en direct, affiche la bulle info au survol de la souris sur un avion, un clic sur la page publique de l'utilisateur ». Maquettes dans le dossier du projet `j4-direct-survol/` ; Greg a choisi la variante B le 12/11/2026 à 3 h 25 : **le clic suit le vol**, le panneau donne le lien vers le profil.

Pourquoi pas « clic = profil » (variante A) : le profil public est désactivé par défaut, donc la plupart des avions n'en ont pas ; le même clic aurait ouvert un profil sur certains avions et suivi le vol sur les autres, et fait quitter la carte.

![Échange entre tracker, API et site](../../schemas/img/j4-direct-pilote.png)

## 1. Ce que voit le spectateur

| Geste | Rendu |
| --- | --- |
| Souris sur un avion (ordinateur) | Bulle : pilote, indicatif, catégorie, avion, départ → arrivée avec barre de progression, % parcouru, NM et temps restants, phase, niveau, vitesse sol, « Clic : suivre ce vol ». Le trajet de l'avion passe en surbrillance (aperçu), même si les trajets sont masqués |
| Clic sur un avion | Vol suivi : panneau à droite avec les mêmes informations, la carte du pilote et son bouton « Profil », « Partager le vol » et « Recentrer » ; trace réelle et aéroports comme avant ([spec trajectoire](spec-J4-trajectoire-direct.md)) |
| Toucher un avion (téléphone, pas de survol) | Même panneau, en feuille en bas de l'écran ; la carte se décale pour garder l'avion au-dessus |
| Lien partagé `/live?flight=<id>` | La page s'ouvre sur ce vol suivi et centre la carte dessus |

![Survol d'un avion](../img/j4-direct-survol.png)

![Vol suivi](../img/j4-direct-vol-suivi.png)

Niveau : « FL300 » à partir de 10 000 ft, sinon en pieds (`4 500 ft`).

## 2. Pilote : seulement si son profil est public

- Le flux `/v1/live/stream` porte `pilot: { handle, name, country, hasPhoto }` (format `LivePilot` de `packages/contrats`), ou `null` si le profil n'est pas public. Un pilote au profil non public reste « Pilote Weems · Profil non public » : aucun nom, aucun lien, aucun identifiant interne envoyé.
- L'API garde les pilotes en mémoire (`modules/live/live-pilots.ts`) : un pilote nouveau est lu au lot suivant (2 s), tous sont relus toutes les 30 s. Un pilote qui désactive son profil disparaît donc de la carte en moins de 30 s ; son vol est renvoyé au lot suivant.
- Conséquence assumée : un profil public rend aussi visible en direct la position de son pilote.

## 3. Critères d'acceptation

1. Profil public : le vol arrive dans le flux avec le pseudo, le nom, le pays et la présence d'une photo ; profil non public : `pilot` vaut `null` (test `profiles.test.ts`).
2. Profil désactivé pendant le vol : `pilot` repasse à `null` au plus 30 s après (tests `live-pilots.test.ts`, `live-board.test.ts`).
3. La bulle n'apparaît qu'à la souris, jamais sur un écran tactile ; elle passe à gauche de l'avion près du bord droit (test `card-position.test.ts`).
4. Le bouton « Profil » n'existe que pour un profil public et ouvre `/pilots/{pseudo}`.
5. `/live?flight=<id>` ouvre le vol suivi ; fermer le panneau retire `flight` de l'adresse.
6. Textes en français et en anglais.

## 4. Enrichissements de la page (idées 1 à 6)

Demande de Greg du 12/11/2026 (« celle ci plutôt » sur la maquette des idées) : toutes les idées de `j4-direct-survol/proposition-direct.md`, en plus de la bulle et du vol suivi.

![Données des enrichissements](../../schemas/img/j4-direct-enrichi.png)

![Page enrichie](../img/j4-direct-enrichi.png)

| N° | Fonction | Règle |
| --- | --- | --- |
| 1 | Recherche | Indicatif, nom ou pseudo d'un pilote au profil public (sans accents ni majuscules), code OACI du départ ou de l'arrivée ; 8 réponses au plus ; un choix suit le vol et centre la carte ; touche « / » pour y aller, Entrée prend la première réponse |
| 2 | Jour / nuit | Zone où le soleil est sous −6° (même règle que les heures de nuit du profil, calcul du soleil commun dans `packages/contrats`), redessinée chaque minute ; bouton « Jour / nuit », choix gardé dans le navigateur, affichée par défaut |
| 3 | Liste « En vol » | Tous les vols affichés ; tri par arrivée la plus proche (distance directe restante, route inconnue en dernier), indicatif ou phase ; un clic suit le vol ; repliée par défaut sur téléphone, en feuille en bas |
| 4 | Filtres par catégorie | La légende compte les vols de chaque catégorie ; un clic masque ou réaffiche la catégorie sur la carte, dans la liste et dans la recherche ; non gardé (tout revient à l'ouverture) |
| 5 | Aéroports actifs | Anneau et « EHAM 4 » : départs et arrivées des vols en cours ; les plus actifs gardent leur étiquette quand elles se chevauchent |
| 6 | Derniers événements | Décollage (passage de la phase Décollage à Montée), atterrissage (événement « toucher », avec sa vitesse verticale), début de vol d'un pilote au profil public ; 4 affichés, en bas à droite, ordinateur seulement, masqués quand un vol est suivi |

Règles des événements (API, `modules/live/live-events.ts`) :

- Chaque événement n'est annoncé qu'une fois : un renvoi du tracker n'en crée pas de nouveau.
- Un pilote au profil non public n'est jamais nommé ; son début de vol n'est pas annoncé (seuls ses décollages et atterrissages, sous l'indicatif, comme sur la carte).
- « A commencé un vol » seulement si le vol apparaît avant le décollage (embarquement, repoussage, roulage) : un redémarrage de l'API ne réannonce pas les vols déjà en l'air.
- Les 10 derniers sont gardés en mémoire pour le spectateur qui arrive (`snapshot.events`) ; ils sont perdus au redémarrage de l'API.
- L'aéroport d'un atterrissage est l'arrivée prévue : un déroutement s'affiche donc avec l'aéroport prévu (limite connue).

Critères d'acceptation :

7. Recherche, tri de la liste, comptes des catégories, aéroports actifs et zone de nuit sont des fonctions pures testées (`flight-finder`, `category-filter`, `airport-activity`, `night-area`).
8. Un décollage et un atterrissage reçus, puis renvoyés, n'apparaissent qu'une fois dans le flux (test `stream.test.ts`).
9. Aucun début de vol annoncé pour un profil non public ni pour un vol vu d'abord en l'air (test `live-board.test.ts`).
