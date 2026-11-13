# Weems — site web

Site Next.js de Weems. Client de l'API comme les autres programmes : il ne parle jamais à la base.

J1 : page `/live`, carte des vols en cours alimentée par le flux SSE `/v1/live/stream` de l'API.
J2 : site en français et en anglais (`/fr/…`, `/en/…`), liste des vols `/flights` et page de vol `/flights/{id}` (depuis le 13/11, ces adresses renvoient vers le carnet : `/logbook/flights` et la page complète du vol). J3 : tout le site derrière connexion (pages `/login` et `/signup` avec code d'invitation), nom du pilote et déconnexion dans la barre du haut, look GameLab ; la page de connexion sert aussi au tracker (OAuth). J4 : navigation en barre flottante (fiche 003) ; profil public du pilote `/pilots/{pseudo}` et ses vols, ouverts sans compte et référencés (titre, adresse canonique fr/en, image de partage, `sitemap.xml`, `robots.txt`), réglages `/settings/profile` (menu du pilote, « Mon profil ») ; sur la carte en direct, tous les avions montrent leur trajet (bouton « Trajets » pour les masquer) et le vol sélectionné sa trace, l'orthodromie restante, ses aéroports et sa progression ; bulle au survol d'un avion (pilote si son profil est public), clic = vol suivi avec lien vers le profil, feuille en bas sur téléphone, lien `/live?flight=<id>` ; recherche, zone de nuit, liste « En vol », filtres par catégorie, aéroports actifs, derniers événements. Accueil public `/` (spec J4 accueil) : image par thème dans une carte arrondie, slogan à gauche, tableau des départs à palettes à droite (compteurs de `GET /v1/stats`, 8 vols du flux en direct sur une ligne chacun, 4 sur téléphone, niveau au survol, « + N vols » vers `/live`) ; la carte en direct `/live` s'ouvre aussi sans compte ; barre A « Épurée » sur toutes les pages depuis le 13/11 (fiche 003, maquettes `/mnt/project-files/menu/`) : liens après le logo sans cadres, page active soulignée d'un trait lumineux (`nav-current`, `global.css`) ; à droite, pour un visiteur, « Pilot Pro » en texte dégradé vers `/plans` (`site/promo-button.ts`), puis compteur « ● N en vol » vers `/live` (`site/live-status.tsx` lit `GET /v1/stats`, `site/live-link.tsx` ; « Vols en direct » si l'API ne répond pas), langue en un seul bouton qui ouvre la même page dans la langue suivante (`site/language-choice.tsx`, `next-locale.ts`), thème, puis « Se connecter » ou la photo du pilote dans un anneau dégradé (menu : « Mon profil », test Free | Pro, déconnexion) ; sous 768 px, langue et thème passent en bas du menu, plus de dock) et pied de page sur une ligne (accueil et profils publics). Page Offres `/plans` (publique, lien « Offres » de la barre) et tableau `/plans/compare`, entièrement lus sur `GET /v1/plans` (fiche `../../docs/decisions/015-catalogue-des-formules.md`) : 4 cartes avec bannière dessinée, prix mensuel et annuel, boutons alignés (sous-grille CSS), ce que chaque formule ajoute à la précédente ; « Votre formule » d'après `GET /v1/me/plan`. Hors production, un pilote connecté a un bouton de test Free | Pro dans son menu (photo de la barre) : `site/test-plan-slot.tsx` l'affiche si `GET /v1/me/plan` répond `testSwitch: true`, `plans/test-plan-action.ts` change la formule du compte par `PUT /v1/dev/me/plan` et relit toutes les pages ; à retirer avant la 1.0. **Toute fonction ajoutée ou modifiée sur une autre page met à jour le catalogue dans la même PR** (clé dans `packages/contrats`, ligne dans le catalogue de l'API avec sa disponibilité, textes `Plans.features.<clé>` et `Features.items.<clé>` en FR et EN, illustration dans `features/illustrations/`). Page « Découvrir » `/discover` (publique, référencée) : le principe de Weems pour un visiteur, bannière commune `ui/hero-banner.tsx` (photo de l'accueil, surtitre, titre fini en dégradé, « Voir les offres » et « Vols en direct », puces vitrées, route en pointillés animée `ui/route-flourish.tsx` survolée par un avion, sans animation si l'utilisateur la refuse), puis 6 étapes le long d'une route en pointillés (tracker, suivi, communauté, simplicité, voler comme un équipage avec l'encart « simulation seulement », progression), chacune avec un écran fictif, et un slogan centré pour finir ; lien « Découvrir » dans la barre des visiteurs seulement et « Découvrir Weems » dans le pied de page. Les étiquettes « Gratuit » / « Pilot Pro » des étapes (`discover/discover-steps.ts`) doivent rester fidèles au catalogue. Page « Fonctionnalités » `/features` (publique, référencée, maquette A du 12/11) : chaque fonction du catalogue `GET /v1/plans`, groupe par groupe, avec son explication (`Features.items.<clé>.title` et `.text`), sous la même bannière que Découvrir (`features/features-banner.tsx`, puces comptées dans le catalogue : disponibles, bientôt, formules), une petite illustration aviation (`features/illustrations/`, une par fonction), la première formule qui la contient, ses limites et « Bientôt » tant que le catalogue la dit `soon` ; sommaire collant à gauche (bande défilante sur téléphone) ; lien dans la barre des visiteurs (à droite de Découvrir) et le pied de page. **Elle n'a aucune liste écrite à la main : elle suit seule le catalogue. Une nouvelle fonction ajoute son explication FR et EN et son illustration ; une fonction livrée passe de `soon` à `available` dans le catalogue de l'API, dans la même PR.** Offre « Pilote fondateur » (spec `../../docs/cahiers-des-charges/web/spec-offre-fondateurs.md`) dans `offers/` : bandeau au-dessus des cartes de `/plans` (`founders-banner.tsx`, « Plus que X places » seulement sous 100, progression vol par vol `founder-progress.tsx`), page `/code` (saisie d'un code d'offre, action serveur `redeem-action.ts`, sens des refus dans `redeem-outcome.ts`), page « Mon abonnement » `/settings/plan` (menu du pilote : formule, Pro offert, place de fondateur, codes de parrainage à copier), page publique d'un ambassadeur `/ambassadors/{adresse}` (photo relayée par `/api/ambassadors/{adresse}/photo`) ; badge `ui/founder-badge.tsx` sur le profil public et le Boarding ; le champ de `/signup` accepte aussi un code d'offre (« Code d'invitation ou d'offre »). Couleur `--color-founder`. Grades des pilotes (spec `../../docs/cahiers-des-charges/web/spec-grades-des-pilotes.md`) : insigne « ailes » dans `ui/rank-insignia.tsx` (seul dessin, métaux `--color-rank-*`), badge `ui/rank-badge.tsx` à côté du badge fondateur (profil public) ou insigne seul (Boarding) ; carte « Votre grade » et fenêtre « Nouveau grade » de la page Résumé (`logbook/summary/rank-card.tsx`, `rank-promotion.tsx`, règles pures testées `rank-progress.ts`, `rank-announce.ts`) lues sur `GET /v1/me/rank`. « Mon carnet de bord » (`/logbook`, page d'arrivée après connexion, `LANDING_PAGE` dans `auth/session-cookie.ts`) : carnet privé (spec `../../docs/cahiers-des-charges/web/spec-carnet-prive.md`), cadre dans `logbook/` (menu de gauche, onglets sur téléphone, pages listées dans `logbook/logbook-pages.ts`, groupe de routes `app/[locale]/(app)/logbook/(book)/`), page Résumé dans `logbook/summary/` lue sur `GET /v1/me/logbook/summary`, page Vols dans `logbook/flights/` (`/logbook/flights` et `/logbook/flights/{id}` : liste filtrée par `?f=` à gauche, fiche à droite, l'une ou l'autre sur téléphone ; bandes de vol lues sur `GET /v1/me/logbook/flights/{id}/bands`, une case par minute, valeurs de la minute au survol). Page complète d'un vol dans `logbook/flight/` (`/logbook/flights/{id}/full`, maquette v13 A, une colonne) : en haut l'interrupteur « Visible sur ma page publique » puis vol précédent / suivant ; en-tête et 6 mini-cartes ; carte et phases (ruban + tableau), la carte remplit toute sa case ; profil ; bandes de vol ; atterrissage et dernière approche (3 min avant le toucher, graphique étiré à sa case) ; « Comparé à vos vols » (clé `sameAircraftComparison`, calculé sur `GET /v1/me/logbook/entries`, verrouillé sans Pilot Pro) ; journal et vérification des phases. Pas encore : note privée (`flightNotes`), analyse de l'approche (`approachAnalysis`), export (`export`), tous `soon`. Page Statistiques dans `logbook/stats/` (`/logbook/stats?period=30d|12m|all`, lue sur `GET /v1/me/logbook/stats`) : période en haut à droite (« Tout » cadenassé sans Pilot Pro), barre collante des 4 thèmes (Activité, Avions et routes, Atterrissages, Technique), cartes Pilot Pro verrouillées quand l'API renvoie `null`. Une carte réservée à Pilot Pro teste une clé de fonction avec `plans/my-features.ts` (jamais un nom de formule) et montre `logbook/locked-card.tsx` (aperçu flou sans vrai chiffre). Page Objectifs dans `logbook/goals/` (`/logbook/goals?g=<id>`, maquette v12 B, lue sur `GET /v1/me/goals`) : liste avec anneaux à gauche, suivi détaillé à droite (chiffres, courbe cumulée sur une échelle ronde, vols qui comptent, périodes précédentes), suggestions (verrouillées sans Pilot Pro), « Atteints et terminés » ; formulaire en fenêtre par-dessus la page (`?new=1`, `?g=<id>&edit=1`), enregistré par actions serveur (`goal-actions.ts`). Page « Boarding » `/boarding` (publique, spec `../../docs/cahiers-des-charges/web/spec-boarding.md`) : départs et arrivées de tous les membres côte à côte sur un tableau à palettes, suivis en continu sur le flux SSE `GET /v1/live/boarding/stream`, 12 lignes par page et pages qui tournent toutes les 15 s, filtres par terrain et par avion gardés dans l'adresse (`?airport=LFML&aircraft=A320`), clic sur un terrain ou un avion pour filtrer, sur un pilote pour sa page, sur un indicatif pour la page publique du vol (en cours ou clos ; carte en direct pour un pilote masqué), horloges UTC et locale, silhouette de catégorie, pilote en pastille seule (nom dans une bulle au survol) avec grade et drapeau, pastille grise à fantôme pour un profil privé, nom du terrain dans une bulle au survol, largeur des autres pages (1 200 px), lettres qui tournent quand elles changent (sans animation si le système le demande), son des palettes coupé par défaut, allumé par le bouton son de la barre (`site/sound-toggle.tsx`, réglage partagé `site/sound-setting.ts`, à côté du thème) ; pastille « Boarding » à droite du compteur « N en vol » (`site/boarding-link.tsx`). Page d'un vol en cours (spec `../../docs/cahiers-des-charges/web/spec-vol-en-cours.md`) dans `live-flight/` : à l'adresse de la page publique du vol (`/pilots/{pseudo}/flights/{id}`) tant que `closedAt` est nul, suivie en continu sur le flux SSE du direct (trace lue une fois sur `GET /v1/live/flights/{id}/trail` puis complétée), relue par le serveur quand la phase change ou quand le vol quitte le direct (page complète à la clôture) ; en-tête, barre de progression à l'avion orienté par le vario, 6 tuiles, ligne pilote, 4 bandes de vol, carte fixe (trace colorée par l'altitude, vecteur 3 min, repères de phase, route directe, coordonnées et écart), phases et arrivée estimée, profil, journal ; liens depuis le Boarding et le panneau du vol suivi du direct (« Page du vol »). « Ma page publique » (`/logbook/public`) : la page du profil public vue par son pilote, en aperçu tant qu'elle n'est pas publique (`profile/logbook-notice.tsx`, liens dans `profile/profile-links.ts`).

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Carte en direct (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Site minimal (J2) | `../../docs/cahiers-des-charges/web/spec-J2-site-minimal.md` |
| Trajectoire et progression en direct (J4) | `../../docs/cahiers-des-charges/web/spec-J4-trajectoire-direct.md` |
| Pilote, survol, vol suivi et enrichissements du direct (J4) | `../../docs/cahiers-des-charges/web/spec-J4-direct-pilote.md` |
| Comptes et connexion (J3) | `../../docs/cahiers-des-charges/spec-J3-alpha-fermee.md` |
| Profil public (J4) | `../../docs/cahiers-des-charges/spec-J4-profil-public.md` |
| Page d'accueil (J4) | `../../docs/cahiers-des-charges/web/spec-J4-accueil.md`, images choisies dans la console : `spec-J4-personnalisation.md` |
| Grades des pilotes |  `../../docs/cahiers-des-charges/web/spec-grades-des-pilotes.md` |
| Offre fondateurs, codes d'offre, ambassadeurs | `../../docs/cahiers-des-charges/web/spec-offre-fondateurs.md` |
| Formules, pages Offres et Fonctionnalités (règles permanentes) | `../../docs/cadrage/05-formules-abonnement.md`, fiche `../../docs/decisions/015-catalogue-des-formules.md`, section 12 des règles de développement |
| Carnet de vol privé (Résumé, Vols, Statistiques, Objectifs) | `../../docs/cahiers-des-charges/web/spec-carnet-prive.md` |
| Barre et menu (état actuel) | `../../docs/decisions/003-navigation-barre-flottante.md` |
| Arrondis | `../../docs/decisions/014-arrondis-des-cadres.md` (jetons de `@weems/ui`, jamais de rayon en dur) |
| Page Boarding (départs et arrivées) | `../../docs/cahiers-des-charges/web/spec-boarding.md` |
| Page d'un vol en cours | `../../docs/cahiers-des-charges/web/spec-vol-en-cours.md` |
| Catégories d'avion (J4) | `../../docs/cahiers-des-charges/spec-J4-categories-avion.md` |
| Formats reçus de l'API | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |

## Stack

- Next.js (App Router), React, TypeScript strict.
- Traductions : `next-intl`, textes dans `messages/fr.json` et `messages/en.json`, jamais écrits en dur ; un test vérifie que les deux fichiers ont les mêmes clés.
- Mise en forme : Tailwind CSS 4 (`src/app/global.css`), look du projet GameLab IA de Greg (choix du 11/11/2026, fiche `docs/decisions/001-look-du-site-gamelab.md`) : thème sombre ou clair au choix du pilote (bouton de la barre, gardé dans le navigateur), sinon selon le réglage du système (`src/site/theme.ts`, attribut `data-theme` sur `<html>`), couleurs en variables dans `global.css` (jamais de couleur Tailwind en dur comme `bg-white` ou `text-blue-600`), polices Inter et Space Grotesk servies par `next/font`, boutons et champs de 44 px. Formulaires (fiche `docs/decisions/008-modele-de-formulaire.md`, modèle C) : une carte par sujet (`FormSection`), champs en grille (`FieldGrid`, `Field`), contrôles communs (`TextInput`, `Select`, `Segmented`, `SearchSelect`), un seul bouton Enregistrer dans une `SaveBar` ; jamais de `<select>` ni de champ écrit à la main. Ces composants et `Button` viennent du paquet `@weems/ui` (`../../packages/ui`, partagé avec la console) ; `global.css` y fait pointer Tailwind (`@source`). Navigation (fiche `docs/decisions/003-navigation-barre-flottante.md`, mise à jour du 12/11) : une seule barre flottante translucide pour tout le site (`site-shell.tsx`), liens après le logo (5 entrées au plus), menu du pilote à droite, bouton menu sous 768 px. Composants dans `src/ui/` et `src/site/`, pages du menu dans `src/site/menu-items.ts`. Icônes : Lucide (`lucide-react`), importé seulement dans `src/ui/icons.ts`, qui les renomme selon leur sens (fiche `docs/decisions/002-icones-lucide-et-carte-sombre.md`).
- Ne pas ajouter de bibliothèque de gestion d'état (Redux…) : les données viennent du serveur, les filtres sont dans l'adresse, le reste reste dans le composant.
- Carte : MapLibre, fond OpenFreeMap (gratuit, sans clé) : « dark » en thème sombre, éclairci dans nos bleus nuit (`src/map/dark-basemap.ts`, appliqué au chargement par `basemap-paint.ts`), « positron » en clair ; couleurs des calques de la carte dans `src/map/map-theme.ts` ; une carte ouverte suit le bouton thème sans rechargement (`src/map/base-map.ts` remplace le fond et redessine les calques).
- Tests : Vitest sur la logique pure (`*.test.ts`) ; les composants React restent minces.
- Les pages de vol sont rendues côté serveur : le serveur du site appelle l'API (`WEEMS_API_URL`) en lui transmettant le cookie de session du pilote ; seule la carte en direct appelle l'API depuis le navigateur.
- Connexion (J3) : `src/proxy.ts` relaie vers l'API `/api/auth/*` (Better Auth), et en J4 la photo et la vérification du pseudo (`src/site/api-relay.ts`), pour que le cookie de session soit celui du site. Sans ce cookie, toute page renvoie vers `/login?next=…`, sauf l'accueil, `/discover`, `/features`, `/live`, `/plans`, `/boarding`, `/ambassadors/*`, la connexion, l'inscription et `/pilots/*` (liste `PUBLIC_PAGES`). Les pages publiques n'envoient jamais le cookie du visiteur à l'API. L'API vérifie le cookie à chaque appel : le proxy ne fait que regarder s'il est présent.
- En développement : `pilote@weems.local` / `weems-dev-password` (propriétaire des vols de `pnpm simulate`). Sous `pnpm dev` seulement, la page Vols du carnet montre un bouton « Supprimer tous mes vols » (`logbook/flights/delete-all-button.tsx`) pour vider les vols de test ; il n'existe pas dans la version construite.

## Organisation

```
messages/              textes en français et en anglais
src/
  app/[locale]/        routes Next.js (pages et mise en page), sans logique
    (home)/              accueil public : barre et pied de page des pages publiques
    (app)/               pages du pilote connecté (et /live sans session) : même barre, sans pied de page
    (auth)/              connexion et inscription, écran coupé en deux (maquette du 13/11)
    (public)/            pages ouvertes à tous (profils publics) : même barre, pied de page
  app/sitemap.ts, app/robots.ts   plan du site (profils activés) et règles des moteurs de recherche
  proxy.ts             relais /api/auth vers l'API, connexion obligatoire, langue dans l'adresse (/ → /fr)
  i18n/                langues, chargement des textes, liens qui gardent la langue
  api/api-request.ts   appel commun à l'API (cookie du pilote, ou anonyme pour les pages publiques), erreurs
  api/weems-api.ts     appels à l'API depuis le serveur du site (liste, vol, trajectoire), en tant que pilote connecté
  api/profile-api.ts   réglages du profil du pilote connecté
  api/logbook-api.ts   carnet de bord du pilote connecté (carnet privé, et sa page publique même non publiée)
  api/public-api.ts    pages publiques : toujours sans cookie
  api/plans-api.ts     formule du pilote connecté (page Offres)
  api/offers-api.ts    offre fondateurs, codes d'offre, ambassadeurs
  auth/                connexion : formulaires, appel des routes /api/auth, pilote connecté, déconnexion ;
                       page coupée en deux (auth-page), toujours en thème sombre (classe `theme-dark` de global.css, pas de bouton thème) :
                       à gauche, dès 1024 px, plan d'aéroport (auth-welcome) et cadran de cap à deux vols (route-dial, dial-ring, dial-flight ;
                       géométrie testée dans route-dial-geometry.ts) : les avions traversent lentement leur route en continu, les destinations
                       changent au survol (use-route-morph.ts ; survol à la souris seulement, rien ne bouge si l'utilisateur refuse les animations) ;
                       à droite le formulaire, resserré (auth-field : champ à icône, mot de passe affichable ; « Rester connecté » envoie rememberMe),
                       puis l'encadré du dessous (auth-switch) : code d'invitation qui ouvre `/signup?code=…` sur la connexion, lien vers la connexion sur l'inscription.
                       Pas de « Mot de passe oublié » tant que l'API n'envoie pas d'e-mail
  home/                accueil : héros (home-hero.tsx), image de chaque thème lue sur l'API ou `public/home/default.jpg` (home-image.ts, testé), compteurs et images lus par le serveur (home-data.ts),
                       tableau des départs (departures.ts testé : phases regroupées, niveau, lignes ; departures-board.tsx, split-flap.tsx)
  site/                cadre unique des pages (site-shell : barre flottante, liens site-nav, entrée ou menu du pilote site-account, menu téléphone site-menu, compteur en direct live-status/live-link, bouton de langue language-choice, pied de page site-footer ; entrées dans menu-items.ts, page active current-page.ts), adresse de l'API, API injoignable
  ui/                  composants visuels propres au site : icônes, panneau, titre de section (les formulaires et le bouton viennent de `@weems/ui`), fermeture des menus (use-dismiss), photo ou initiale du pilote (pilot-avatar), bouton « Partager » (share-button), fond photo des bandeaux accueil et Découvrir (photo-background), bannière des pages publiques (hero-banner, route-flourish) ;
                       formulaires (fiche 008) : carte de formulaire, champ, saisie, liste courte, barre de choix,
                       liste avec recherche, barre d'enregistrement, compteur de modifications (form-changes.ts, testé)
  map/                 carte MapLibre commune (base-map.ts : fond OpenFreeMap, fond de secours sans réseau ; map-theme.ts : fond et couleurs selon le thème ; dark-basemap.ts + basemap-paint.ts : couleurs éclaircies du fond sombre)
  format/              durées h:mm, trajet, heure UTC, noms des pays
  settings/            réglages du profil public : formulaire, photo, pseudo vérifié à la frappe, actions serveur
  profile/             profil public
    routes-geojson.ts     arcs de grand cercle et aéroports de la carte des vols
    chart-geometry.ts     barres, moyenne glissante, classes de toucher (fonctions pures)
    profile-charts.tsx, stat-tiles.tsx, profile-header.tsx, routes-map.tsx, routes-legend.tsx
    experience-panel.tsx, experience-rows.tsx   bloc « Expérience par catégorie »
    share-map.ts, share-image.tsx   image de partage (générateur d'images de Next.js)
    page-metadata.ts      titre, description, adresse canonique et variantes de langue
  discover/            page Découvrir : bandeau (discover-banner), étapes (discover-steps.ts : ordre, icônes, étiquettes ; discover-step.tsx), écrans fictifs (step-illustrations, illustration-parts), slogan de fin (discover-closing)
  features/            page Fonctionnalités : page et sections (features-page), ligne d'une fonction (feature-row), sommaire qui suit la lecture (features-toc),
                       étiquettes de formule et « Bientôt » (plan-tag), dessins par fonction (feature-illustration, illustrations/ : kit + un fichier par groupe), icônes des groupes (group-icons),
                       première formule et limites (feature-display.ts, testé)
  offers/              offre fondateurs : bandeau et progression (page Offres), /code, Mon abonnement, page ambassadeur
  plans/               page Offres : cartes (plan-cards, plan-card, plan-price, plan-action, feature-text), bannières SVG (plan-banner), tableau (compare-table),
                       ce que chaque carte liste et prix (plan-display.ts, testé), promesses (plans-reassurance)
  boarding/            page Boarding : lecture (use-boarding.ts), lignes, filtre, pages, horloge (board-rows.ts, testé), tambour des palettes (flap-roll.ts, testé ; flap-text.tsx), son (use-flap-sound.ts),
                       cellules et tableaux (board-cells.tsx, boarding-table.tsx), liens des indicatifs (board-links.ts, testé), filtres terrain et avion (airport-filter.tsx, aircraft-chip.tsx, use-board-filters.ts, use-url-choice.ts), horloges, bandeau, assemblage (boarding-view.tsx)
  aircraft/            catégorie d'avion : pastille (category-badge.tsx), silhouette de la carte (category-silhouette.tsx), carré de couleur (category-dot.tsx), couleurs (category-tone.ts pour les classes, category-colors.ts pour les cartes, variables --wm-cat-* de global.css)
  flights/             liste des vols : filtres (list-query.ts), tableau, pastilles, état
  flight/              page de vol
    phase-colors.ts       une couleur par phase (carte, profil, frise)
    phase-timeline.ts     phases et durées depuis les événements
    landing-summary.ts    taux au toucher, rebonds, remises des gaz
    event-log.ts          événements du journal
    track-geojson.ts      tracé par phase pour la carte
    profile-geometry.ts   profil vertical en coordonnées SVG
    track-map.tsx, vertical-profile.tsx, flight-track.tsx (point partagé carte/profil)
    flight-header.tsx, phase-timeline-table.tsx, landing-panel.tsx, event-log-table.tsx
    flight-details.tsx    corps de la page de vol, commun à la page privée et à la page publique
  live-flight/         page d'un vol en cours (spec vol en cours) : lecture du direct, calculs testés (bandes, détails de la carte, phases, assiette, coordonnées), blocs, calques de la carte
  live/                carte en direct (J1)
    use-live-flights.ts   connexion SSE et reconnexion
    flights-store.ts      vols en cours (fonctions pures)
    tracks.ts             glissement entre deux positions
    interpolate.ts        calcul du point intermédiaire et du cap
    use-live-route.ts     route du vol sélectionné (aéroports, trace) lue une fois, followed-trail.ts : trace prolongée par le flux (testé)
    great-circle.ts       orthodromie : distance en NM, points de la route, antiméridien
    route-progress.ts     progression, distance et temps restants
    route-geojson.ts      trace, ligne restante et aéroports en GeoJSON
    route-layers.ts       calques MapLibre de la route (sous les avions)
    route-summary.tsx     départ, barre de progression, arrivée, restant (bulle et panneau)
    airport-book.ts, use-airports.ts   aéroports des vols, demandés une fois par code
    all-routes.ts         trajets de tous les vols (fait / reste) en GeoJSON
    all-routes-layers.ts  calques pâles des trajets de tous les vols, trajet de l'avion survolé en surbrillance
    use-live-routes.ts    trajets affichés : tous, ou seulement l'aperçu de l'avion survolé
    use-stored-switch.ts  boutons « Trajets » et « Jour / nuit », choix gardé dans le navigateur
    aircraft-shapes.ts    silhouette et taille par catégorie d'avion, nom des images (testé)
    aircraft-icons.ts     dessin des silhouettes, couleur de la catégorie (lue dans global.css), grise si signal perdu
    live-map.tsx          carte MapLibre : clic, survol, recentrage
    live-view.tsx         page /live : assemblage ; use-following.ts : vol suivi, survol, recentrage
    live-sidebar.tsx, live-controls.tsx   colonne de gauche : recherche, compteur, « Trajets », « Jour / nuit », liste
    live-search.tsx, flight-finder.ts   recherche (indicatif, pilote public, aéroport, touche « / ») et tri de la liste (testés)
    flight-list.tsx       liste « En vol » triable, feuille repliée en bas sur téléphone
    category-filter.ts, category-legend.tsx, use-hidden-categories.ts   légende cliquable : compte et masque les catégories (testé)
    night-area.ts         zone de nuit (soleil sous −6°, calcul commun de packages/contrats), testée
    airport-activity.ts   aéroports actifs : départs et arrivées en cours (testé)
    overlay-layers.ts, use-overlays.ts   calques de la nuit et des aéroports actifs
    events-store.ts, live-events-panel.tsx   derniers événements du flux (décollages, atterrissages, débuts de vol publics)
    flight-facts.tsx      un vol d'un coup d'œil (indicatif, catégorie, progression, phase, niveau, vitesse), commun à la bulle et au panneau
    pilot-line.tsx        pilote au profil public, ou « Pilote Weems » anonyme
    flight-hover-card.tsx, card-position.ts   bulle au survol (souris seulement) et sa place (testé)
    flight-panel.tsx      vol suivi : panneau à droite, feuille en bas sur téléphone, Profil, Partager, Recentrer
    use-selected-flight.ts   vol suivi gardé dans l'adresse (/live?flight=<id>)
    testing/              données de test
scripts/
  copy-map-worker.ts   copie le « worker » de MapLibre dans public/ avant dev et build
                       (MapLibre 6 ne le trouve plus une fois empaqueté par Next.js)
```

![Carte en direct : du flux SSE à l'écran](../../docs/schemas/img/web-carte-direct.png)

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm --filter @weems/web dev` | Site sur http://localhost:3001 (redirige vers /fr ; l'API doit tourner sur le port 3000) |
| `pnpm --filter @weems/web build` | Construction de production |
| `WEEMS_API_URL=… NEXT_PUBLIC_API_URL=… pnpm --filter @weems/web dev` | Viser une autre API (serveur du site, et navigateur pour la carte en direct) |
| `pnpm test:j3` (racine) | Tests navigateur de la connexion du site et du tracker |
