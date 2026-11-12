# Weems — site web

Site Next.js de Weems. Client de l'API comme les autres programmes : il ne parle jamais à la base.

J1 : page `/live`, carte des vols en cours alimentée par le flux SSE `/v1/live/stream` de l'API.
J2 : site en français et en anglais (`/fr/…`, `/en/…`), liste des vols `/flights` et page de vol `/flights/{id}` (carte colorée par phase, profil vertical, phases, atterrissage, journal). J3 : tout le site derrière connexion (pages `/login` et `/signup` avec code d'invitation), nom du pilote et déconnexion dans la barre du haut, look GameLab ; la page de connexion sert aussi au tracker (OAuth). J4 : navigation en barre flottante (fiche 003) ; profil public du pilote `/pilots/{pseudo}` et ses vols, ouverts sans compte et référencés (titre, adresse canonique fr/en, image de partage, `sitemap.xml`, `robots.txt`), réglages `/settings/profile` (menu du pilote, « Mon profil public ») ; sur la carte en direct, tous les avions montrent leur trajet (bouton « Trajets » pour les masquer) et le vol sélectionné sa trace, l'orthodromie restante, ses aéroports et sa progression. Accueil public `/` (spec J4 accueil) : image plein écran par thème, slogan, tableau des départs à palettes (compteurs de `GET /v1/stats`, vols du flux en direct) ; la carte en direct `/live` s'ouvre aussi sans compte ; barre v2 sur toutes les pages depuis le 12/11 (liens « Mon carnet de bord » et « Mes vols » pour le pilote connecté et « Vols en direct », « Créer un compte » et icône de connexion ou menu du pilote, thème, FR | EN, bouton menu sous 768 px, plus de dock) et pied de page sur une ligne (accueil et profils publics). « Mon carnet de bord » (`/logbook`, page d'arrivée après connexion, `LANDING_PAGE` dans `auth/session-cookie.ts`) : la page du profil public vue par son pilote, en aperçu tant qu'elle n'est pas publique (`profile/logbook-notice.tsx`, liens dans `profile/profile-links.ts`).

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Carte en direct (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Site minimal (J2) | `../../docs/cahiers-des-charges/web/spec-J2-site-minimal.md` |
| Trajectoire et progression en direct (J4) | `../../docs/cahiers-des-charges/web/spec-J4-trajectoire-direct.md` |
| Comptes et connexion (J3) | `../../docs/cahiers-des-charges/spec-J3-alpha-fermee.md` |
| Profil public (J4) | `../../docs/cahiers-des-charges/spec-J4-profil-public.md` |
| Page d'accueil (J4) | `../../docs/cahiers-des-charges/web/spec-J4-accueil.md`, images choisies dans la console : `spec-J4-personnalisation.md` |
| Catégories d'avion (J4) | `../../docs/cahiers-des-charges/spec-J4-categories-avion.md` |
| Formats reçus de l'API | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |

## Stack

- Next.js (App Router), React, TypeScript strict.
- Traductions : `next-intl`, textes dans `messages/fr.json` et `messages/en.json`, jamais écrits en dur ; un test vérifie que les deux fichiers ont les mêmes clés.
- Mise en forme : Tailwind CSS 4 (`src/app/global.css`), look du projet GameLab IA de Greg (choix du 11/11/2026, fiche `docs/decisions/001-look-du-site-gamelab.md`) : thème sombre ou clair au choix du pilote (bouton de la barre, gardé dans le navigateur), sinon selon le réglage du système (`src/site/theme.ts`, attribut `data-theme` sur `<html>`), couleurs en variables dans `global.css` (jamais de couleur Tailwind en dur comme `bg-white` ou `text-blue-600`), polices Inter et Space Grotesk servies par `next/font`, boutons et champs de 44 px. Formulaires (fiche `docs/decisions/008-modele-de-formulaire.md`, modèle C) : une carte par sujet (`FormSection`), champs en grille (`FieldGrid`, `Field`), contrôles communs (`TextInput`, `Select`, `Segmented`, `SearchSelect`), un seul bouton Enregistrer dans une `SaveBar` ; jamais de `<select>` ni de champ écrit à la main. Ces composants et `Button` viennent du paquet `@weems/ui` (`../../packages/ui`, partagé avec la console d'administration) ; `global.css` y fait pointer Tailwind (`@source`). Navigation (fiche `docs/decisions/003-navigation-barre-flottante.md`, mise à jour du 12/11) : une seule barre flottante translucide pour tout le site (`site-shell.tsx`), liens après le logo (5 entrées au plus), menu du pilote à droite, bouton menu sous 768 px. Composants dans `src/ui/` et `src/site/`, pages du menu dans `src/site/menu-items.ts`. Icônes : Lucide (`lucide-react`), importé seulement dans `src/ui/icons.ts`, qui les renomme selon leur sens (fiche `docs/decisions/002-icones-lucide-et-carte-sombre.md`).
- Ne pas ajouter de bibliothèque de gestion d'état (Redux…) : les données viennent du serveur, les filtres sont dans l'adresse, le reste reste dans le composant.
- Carte : MapLibre, fond OpenFreeMap (gratuit, sans clé) : « dark » en thème sombre, « positron » en clair ; couleurs des calques de la carte dans `src/map/map-theme.ts` ; une carte ouverte suit le bouton thème sans rechargement (`src/map/base-map.ts` remplace le fond et redessine les calques).
- Tests : Vitest sur la logique pure (`*.test.ts`) ; les composants React restent minces.
- Les pages de vol sont rendues côté serveur : le serveur du site appelle l'API (`WEEMS_API_URL`) en lui transmettant le cookie de session du pilote ; seule la carte en direct appelle l'API depuis le navigateur.
- Connexion (J3) : `src/proxy.ts` relaie vers l'API `/api/auth/*` (Better Auth), et en J4 la photo et la vérification du pseudo (`src/site/api-relay.ts`), pour que le cookie de session soit celui du site. Sans ce cookie, toute page renvoie vers `/login?next=…`, sauf l'accueil, `/live`, la connexion, l'inscription et `/pilots/*` (liste `PUBLIC_PAGES`). Les pages publiques n'envoient jamais le cookie du visiteur à l'API. L'API vérifie le cookie à chaque appel : le proxy ne fait que regarder s'il est présent.
- En développement : `pilote@weems.local` / `weems-dev-password` (propriétaire des vols de `pnpm simulate`). Sous `pnpm dev` seulement, « Mes vols » montre un bouton « Supprimer tous mes vols » (`flights/delete-all-button.tsx`) pour vider les vols de test ; il n'existe pas dans la version construite.

## Organisation

```
messages/              textes en français et en anglais
src/
  app/[locale]/        routes Next.js (pages et mise en page), sans logique
    (home)/              accueil public : barre posée sur l'image, pied de page
    (app)/               pages du pilote connecté (et /live sans session) : même barre, sans pied de page
    (auth)/              connexion et inscription, panneau centré
    (public)/            pages ouvertes à tous (profils publics) : même barre, pied de page
  app/sitemap.ts, app/robots.ts   plan du site (profils activés) et règles des moteurs de recherche
  proxy.ts             relais /api/auth vers l'API, connexion obligatoire, langue dans l'adresse (/ → /fr)
  i18n/                langues, chargement des textes, liens qui gardent la langue
  api/api-request.ts   appel commun à l'API (cookie du pilote, ou anonyme pour les pages publiques), erreurs
  api/weems-api.ts     appels à l'API depuis le serveur du site (liste, vol, trajectoire), en tant que pilote connecté
  api/profile-api.ts   réglages du profil du pilote connecté
  api/logbook-api.ts   carnet de bord du pilote connecté (sa page publique, même non publiée)
  api/public-api.ts    pages publiques : toujours sans cookie
  auth/                connexion : formulaires, appel des routes /api/auth, pilote connecté, déconnexion
  home/                accueil : héros (home-hero.tsx), image de chaque thème lue sur l'API ou `public/home/default.jpg` (home-image.ts, testé), compteurs et images lus par le serveur (home-data.ts),
                       tableau des départs (departures.ts testé : phases regroupées, niveau, lignes ; departures-board.tsx, split-flap.tsx)
  site/                cadre unique des pages (site-shell : barre flottante, liens site-nav, entrée ou menu du pilote site-account, menu téléphone site-menu, FR | EN language-choice, pied de page site-footer ; entrées dans menu-items.ts, page active current-page.ts), adresse de l'API, API injoignable
  ui/                  composants visuels propres au site : icônes, panneau, titre de section (les formulaires et le bouton viennent de `@weems/ui`), fermeture des menus (use-dismiss) ;
                       formulaires (fiche 008) : carte de formulaire, champ, saisie, liste courte, barre de choix,
                       liste avec recherche, barre d'enregistrement, compteur de modifications (form-changes.ts, testé)
  map/                 carte MapLibre commune (base-map.ts : fond OpenFreeMap, fond de secours sans réseau ; map-theme.ts : fond et couleurs selon le thème)
  format/              durées h:mm, trajet, heure UTC, noms des pays
  settings/            réglages du profil public : formulaire, photo, pseudo vérifié à la frappe, actions serveur
  profile/             profil public
    routes-geojson.ts     arcs de grand cercle et aéroports de la carte des vols
    chart-geometry.ts     barres, moyenne glissante, classes de toucher (fonctions pures)
    profile-charts.tsx, stat-tiles.tsx, profile-header.tsx, routes-map.tsx, routes-legend.tsx
    experience-panel.tsx, experience-rows.tsx   bloc « Expérience par catégorie »
    share-map.ts, share-image.tsx   image de partage (générateur d'images de Next.js)
    page-metadata.ts      titre, description, adresse canonique et variantes de langue
  aircraft/            catégorie d'avion : pastille (category-badge.tsx), carré de couleur (category-dot.tsx), couleurs (category-tone.ts pour les classes, category-colors.ts pour les cartes, variables --wm-cat-* de global.css)
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
  live/                carte en direct (J1)
    use-live-flights.ts   connexion SSE et reconnexion
    flights-store.ts      vols en cours (fonctions pures)
    tracks.ts             glissement entre deux positions
    interpolate.ts        calcul du point intermédiaire et du cap
    use-live-route.ts     route du vol sélectionné (aéroports, trace), relue toutes les 30 s
    great-circle.ts       orthodromie : distance en NM, points de la route, antiméridien
    route-progress.ts     progression, distance et temps restants
    route-geojson.ts      trace, ligne restante et aéroports en GeoJSON
    route-layers.ts       calques MapLibre de la route (sous les avions)
    route-summary.tsx     barre de progression du panneau du vol
    airport-book.ts, use-airports.ts   aéroports des vols, demandés une fois par code
    all-routes.ts         trajets de tous les vols (fait / reste) en GeoJSON
    all-routes-layers.ts  calques pâles des trajets de tous les vols
    use-show-routes.ts    bouton « Trajets », choix gardé dans le navigateur
    aircraft-shapes.ts    silhouette et taille par catégorie d'avion, nom des images (testé)
    aircraft-icons.ts     dessin des silhouettes, couleur de la catégorie (lue dans global.css), grise si signal perdu
    live-map.tsx          carte MapLibre
    flight-panel.tsx      panneau du vol choisi
    live-view.tsx         assemblage de la page
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
