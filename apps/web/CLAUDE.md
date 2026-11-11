# Weems — site web

Site Next.js de Weems. Client de l'API comme les autres programmes : il ne parle jamais à la base.

J1 : page `/live`, carte des vols en cours alimentée par le flux SSE `/v1/live/stream` de l'API.
J2 : site en français et en anglais (`/fr/…`, `/en/…`), liste des vols `/flights` et page de vol `/flights/{id}` (carte colorée par phase, profil vertical, phases, atterrissage, journal). J3 : tout le site derrière connexion (pages `/login` et `/signup` avec code d'invitation), nom du pilote et déconnexion dans la barre du haut, look GameLab ; la page de connexion sert aussi au tracker (OAuth). J4 : profil public du pilote `/pilots/{pseudo}` et ses vols, ouverts sans compte et référencés (titre, adresse canonique fr/en, image de partage, `sitemap.xml`, `robots.txt`), réglages `/settings/profile` (section « Compte » du menu).

## Où trouver quoi

| Besoin | Fichier |
| --- | --- |
| Règles communes (terminé, tests, branches, sécurité) | `../../docs/developpement/regles-de-developpement.md` |
| Carte en direct (J1) | `../../docs/cahiers-des-charges/spec-J1-pilotes-simules.md` |
| Site minimal (J2) | `../../docs/cahiers-des-charges/web/spec-J2-site-minimal.md` |
| Comptes et connexion (J3) | `../../docs/cahiers-des-charges/spec-J3-alpha-fermee.md` |
| Profil public (J4) | `../../docs/cahiers-des-charges/spec-J4-profil-public.md` |
| Formats reçus de l'API | `../../packages/contrats` (source unique, ne jamais les redéfinir ici) |

## Stack

- Next.js (App Router), React, TypeScript strict.
- Traductions : `next-intl`, textes dans `messages/fr.json` et `messages/en.json`, jamais écrits en dur ; un test vérifie que les deux fichiers ont les mêmes clés.
- Mise en forme : Tailwind CSS 4 (`src/app/global.css`), look du projet GameLab IA de Greg (choix du 11/11/2026, fiche `docs/decisions/001-look-du-site-gamelab.md`) : thème sombre par défaut, clair selon le réglage du système, couleurs en variables dans `global.css` (jamais de couleur Tailwind en dur comme `bg-white` ou `text-blue-600`), polices Inter et Space Grotesk servies par `next/font`, menu latéral de 240 px (en tiroir sous 1024 px), boutons et champs de 44 px. Composants dans `src/ui/` et `src/site/`, pages du menu dans `src/site/menu-items.ts`. Icônes : Lucide (`lucide-react`), importé seulement dans `src/ui/icons.ts`, qui les renomme selon leur sens (fiche `docs/decisions/002-icones-lucide-et-carte-sombre.md`).
- Ne pas ajouter de bibliothèque de gestion d'état (Redux…) : les données viennent du serveur, les filtres sont dans l'adresse, le reste reste dans le composant.
- Carte : MapLibre, fond OpenFreeMap (gratuit, sans clé) : « dark » en thème sombre, « positron » en clair ; couleurs des calques de la carte dans `src/map/map-theme.ts`.
- Tests : Vitest sur la logique pure (`*.test.ts`) ; les composants React restent minces.
- Les pages de vol sont rendues côté serveur : le serveur du site appelle l'API (`WEEMS_API_URL`) en lui transmettant le cookie de session du pilote ; seule la carte en direct appelle l'API depuis le navigateur.
- Connexion (J3) : `src/proxy.ts` relaie vers l'API `/api/auth/*` (Better Auth), et en J4 la photo et la vérification du pseudo (`src/site/api-relay.ts`), pour que le cookie de session soit celui du site. Sans ce cookie, toute page renvoie vers `/login?next=…`, sauf la connexion, l'inscription et `/pilots/*`. Les pages publiques n'envoient jamais le cookie du visiteur à l'API. L'API vérifie le cookie à chaque appel : le proxy ne fait que regarder s'il est présent.
- En développement : `pilote@weems.local` / `weems-dev-password` (propriétaire des vols de `pnpm simulate`). Sous `pnpm dev` seulement, « Mes vols » montre un bouton « Supprimer tous mes vols » (`flights/delete-all-button.tsx`) pour vider les vols de test ; il n'existe pas dans la version construite.

## Organisation

```
messages/              textes en français et en anglais
src/
  app/[locale]/        routes Next.js (pages et mise en page), sans logique
    (app)/               pages du pilote connecté : menu latéral + barre du haut
    (auth)/              connexion et inscription, panneau centré
    (public)/            pages ouvertes à tous (profils publics) : barre du haut publique, sans menu
  app/sitemap.ts, app/robots.ts   plan du site (profils activés) et règles des moteurs de recherche
  proxy.ts             relais /api/auth vers l'API, connexion obligatoire, langue dans l'adresse (/ → /fr)
  i18n/                langues, chargement des textes, liens qui gardent la langue
  api/api-request.ts   appel commun à l'API (cookie du pilote, ou anonyme pour les pages publiques), erreurs
  api/weems-api.ts     appels à l'API depuis le serveur du site (liste, vol, trajectoire), en tant que pilote connecté
  api/profile-api.ts   réglages du profil du pilote connecté
  api/public-api.ts    pages publiques : toujours sans cookie
  auth/                connexion : formulaires, appel des routes /api/auth, pilote connecté, déconnexion
  site/                cadre des pages (app-shell, marque, menu latéral, barre du haut), choix de la langue, adresse de l'API, API injoignable
  ui/                  composants visuels : icônes, panneau, bouton, champ, titre de section
  map/                 carte MapLibre commune (base-map.ts : fond OpenFreeMap, fond de secours sans réseau ; map-theme.ts : fond et couleurs selon le thème)
  format/              durées h:mm, trajet, heure UTC, noms des pays
  settings/            réglages du profil public : formulaire, photo, pseudo vérifié à la frappe, actions serveur
  profile/             profil public
    routes-geojson.ts     arcs de grand cercle et aéroports de la carte des vols
    chart-geometry.ts     barres, moyenne glissante, classes de toucher (fonctions pures)
    profile-charts.tsx, stat-tiles.tsx, profile-header.tsx, routes-map.tsx
    share-map.ts, share-image.tsx   image de partage (générateur d'images de Next.js)
    page-metadata.ts      titre, description, adresse canonique et variantes de langue
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
    aircraft-icons.ts     silhouettes d'avion dessinées
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
