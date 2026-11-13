# Spécification J4 — Page d'accueil publique

Date : 12/11/2026. Demande de Greg : « créer une nouvelle page qui sera la page d'accueil : image pleine page, garder le menu en haut, quelques compteurs par-dessus l'image (pilotes, vols, vols en direct), le logo et un slogan ».

Maquettes validées par Greg le 12/11/2026 entre 1 h 45 et 2 h 30 : piste F « tableau des départs », barre v2, pied de page P2, icône « Mon compte » (copies dans le dossier du projet `accueil/`). Mise en page revue et validée le 12/11/2026 à 4 h 33 : image dans une carte arrondie sous la barre (plus de plein écran), tableau « B » à droite face au texte, 8 vols sur une ligne chacun (maquette `accueil/tableau-droite/8-vols-une-ligne/`).

## 1. Ce que voit le visiteur

![Accueil : pages, API et console](../../schemas/img/j4-accueil.png)

| Zone | Contenu |
| --- | --- |
| Carte image | Sous la barre, carte aux coins arrondis de la largeur de la barre (pas de plein écran) ; une image par thème (clair, sombre), voile dégradé à gauche pour la lisibilité du texte ; sans image, dégradé « coucher de soleil » |
| Texte (à gauche) | Logo Waterline et « Weems », slogan « Décollez. Weems s'occupe du carnet. », phrase d'accroche, deux boutons : « Créer mon compte gratuit » (pilote connecté : « Mes vols ») et « Voir les vols en direct » |
| Tableau des départs (à droite, face au texte) | En-tête « En vol · In flight » avec le repère « Direct », trois compteurs à palettes côte à côte : pilotes, vols, en vol ; puis les vols en cours, un par ligne : indicatif, « départ → arrivée », phase (étiquette colorée) ; le niveau n'apparaît qu'au survol de la ligne ; en bas, « + N vols · voir la carte en direct → » vers `/live`. Depuis le 13/11 (demande de Greg, comme le tableau Boarding) : clic sur l'indicatif = le vol sur la carte en direct (`/live?flight=<id>`), clic sur un terrain = la page Boarding de ce terrain (`/boarding?airport=LFML`) |
| Pied de page P2 | Une ligne centrée : © année Weems · Mentions légales · Conditions d'utilisation · Confidentialité · Contact (pages fictives pour l'instant) |

Sous 1 024 px, le tableau passe sous le texte. Sur téléphone (sous 768 px) : 4 vols seulement, N recalculé en conséquence ; pied de page sur deux lignes.

## 2. Barre du haut des pages publiques (barre v2)

Elle remplace la barre publique de J4. Depuis le 12/11/2026 (demande de Greg), c'est la barre de **toutes** les pages, pilote connecté compris (fiche 003, mise à jour du 12/11).

| Position | Visiteur | Pilote connecté |
| --- | --- | --- |
| À gauche après le logo, groupe à part (page active en relief) | « Vols en direct » | « Mes vols », « Vols en direct » |
| À droite | « Créer un compte », icône silhouette « Se connecter » | initiale du pilote : menu « Mon profil public », « Se déconnecter » |
| Tout à droite | bouton thème (soleil / lune), choix de langue FR \| EN | idem |

Sous 768 px : logo, icône silhouette (ou initiale du pilote), thème, FR | EN, bouton menu qui ouvre les liens de la barre et, pour un visiteur, « Créer un compte ». Plus de dock en bas.

« Découvrir Weems » a été retiré le 12/11 (il menait à l'accueil, comme le logo).

Mis à jour le 13/11/2026 : la barre a évolué depuis cette spec (« Créer un compte » remplacé par le bouton « Pilot Pro », « Vols en direct » à droite, liens Découvrir, Fonctionnalités, Offres et Mon carnet de bord). État actuel : [fiche 003](../../decisions/003-navigation-barre-flottante.md), section « État de la barre au 13/11/2026 ».

## 3. Décisions de Greg (12/11/2026, 2 h 22)

1. Image par défaut : une image libre de droits avec son crédit, remplaçable depuis la console. La photo d'exemple (iStock) n'entre jamais dans le dépôt. Retenue le 12/11 : image maison de la flotte Weems fournie par Greg, publiable (`apps/web/public/home/default.jpg`, même image pour les deux thèmes ; recadrage téléphone centré sur l'avion Weems). À remplacer par une version d'au moins 2 560 px de large, avion Weems seul à droite.
2. Compteurs toujours affichés, sans seuil.
3. L'accueil et la carte en direct deviennent publics. Le direct ne montre déjà aucun nom de pilote (format `LiveFlight`).

## 4. Compteurs : `GET /v1/stats`

Route publique (module `stats` de l'API), format `SiteStats` de `packages/contrats` :

| Champ | Calcul |
| --- | --- |
| `pilots` | Comptes non désactivés |
| `flights` | Tous les vols enregistrés |
| `liveFlights` | Vols sur la carte en direct à cet instant |

Limite de débit par adresse comme les pages publiques ; réponse gardée 30 s en cache (`public, max-age=30`), les nombres n'ont pas besoin d'être exacts à la seconde. Le site lit les compteurs côté serveur ; le nombre de vols en direct suit ensuite le flux `/v1/live/stream`, comme les lignes du tableau.

## 5. Tableau des vols en cours

- Source : le flux public `/v1/live/stream` (déjà utilisé par la carte), lu par le navigateur.
- Lignes : au plus 8 vols sur ordinateur, 4 sur téléphone, ceux dont la position est la plus récente ; signal perdu exclu.
- « + N vols » : N = vols du flux en direct (signal perdu compris, comme sur la carte) moins les vols affichés ; à 0, seul « Voir la carte en direct → » reste.
- Niveau (au survol de la ligne) : altitude en centaines de pieds, `FL350` au-dessus de 10 000 ft, sinon en pieds (`4 500 ft`) ; rien au sol (l’étiquette « Au sol » le dit déjà).
- Phase : les 12 phases du tracker regroupées en 5 étiquettes (Au sol, Montée, Croisière, Descente, Approche).
- Aucun vol : « Aucun vol en ce moment » à la place des lignes.

## 6. Images par thème (console, deuxième demande de fusion)

Page « Personnalisation » de la console (groupe Site) : une image par thème, aperçu de l'accueil et du recadrage téléphone, « Remplacer », « Image par défaut », point important (gauche, centre, droite), crédit et licence obligatoires, case « même image pour les deux thèmes ». Les images passent par l'API (la console ne tourne que sur le Mac, fiche 009) : stockage sur disque en local, stockage d'objets en ligne. Détail dans la spec de cette deuxième demande.

## 7. Critères d'acceptation

1. `/fr` et `/en` s'ouvrent sans compte et montrent l'accueil ; un pilote connecté y voit « Mes vols » et son initiale.
2. Les compteurs montrent les nombres de `GET /v1/stats` ; le nombre « en vol » et les lignes suivent le direct sans recharger.
3. `/live` s'ouvre sans compte, avec la barre publique ; connecté, avec la barre du pilote.
4. La barre v2 et le pied de page P2 apparaissent sur l'accueil et les profils publics, en clair et en sombre, sur bureau et téléphone.
5. Tous les textes existent en français et en anglais.
