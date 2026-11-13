# 016 — Fond du site : plan d'aéroport inventé, très léger

Date : 13/11/2026. Demandé par Greg (« le site est très blanc »), intensité B choisie par Greg sur maquettes A/B.

## Contexte

Les pages du site posent leurs cartes sur un fond uni (`--wm-bg`). Greg voulait un arrière-plan sur tout le site : un plan d'aéroport détaillé façon carte de navigation (Marseille Provence), à peine visible.

## Source du dessin et licence

| Source | Licence | Retenue |
| --- | --- | --- |
| OpenStreetMap (taxiways, aires, bâtiments réels) | ODbL : mention « © contributeurs OpenStreetMap » obligatoire | Non : Greg ne veut aucune mention |
| Cartes SIA, IGN | Protégées / Licence Ouverte avec mention | Non |
| **Plan inventé** | Dessin original, aucune mention | **Oui** |

Seules les deux pistes reprennent LFML (13L/31R 3 500 m et 13R/31L 2 370 m, 303 m d'écart, orientation 134°/314°), d'après OurAirports, domaine public. Taxiways, aires, terminaux, hangars, rivage, roses des vents et quadrillage sont dessinés librement. Ce n'est donc pas le vrai plan de Marseille. Aucune donnée OSM n'a servi.

```mermaid
flowchart LR
  P[Pistes LFML<br/>OurAirports, domaine public] --> G[Générateur draw-plan.mjs]
  I[Taxiways, aires, bâtiments<br/>inventés] --> G
  G --> S[public/backgrounds/airport-plan.svg<br/>27 Ko, une seule couleur]
  S -->|mask-image| B[".airport-plan::before<br/>fixe, derrière le contenu"]
  T["--wm-plan-ink<br/>--wm-plan-opacity"] --> B
```

## Choix

- Fichier `apps/web/public/backgrounds/airport-plan.svg` (une seule couleur, seule l'opacité de chaque trait compte).
- Utilitaire `airport-plan` (`apps/web/src/app/global.css`) : pseudo-élément fixe sous le contenu, teinté par `--wm-plan-ink` à travers le SVG en masque. Posé sur le cadre de toutes les pages (`site/site-shell.tsx`) et sur les pages de connexion (`auth/auth-page.tsx`).
- Intensité B : 12 % en clair (encre `#1f3a66`), 15 % en sombre (encre `#9fb4d9`). La maquette A (7 % / 9 %) était recommandée.
- Masqué quand le système demande plus de contraste (`prefers-contrast: more`).
- Le générateur (script Node, hors dépôt) est dans les fichiers du projet : `fond/draw-plan.mjs`. Pour retoucher le plan, le relancer et remplacer le SVG.

## Conséquences

- Contraste : les cartes sont opaques, le plan ne passe que dans les marges et derrière les titres. Pile sur un trait plein, le texte principal reste à plus de 11:1 et le texte secondaire à 4,5:1 ; en thème clair, un lien posé directement sur un trait tombe à 4,2:1 (sous AA). Si cela gêne, baisser `--wm-plan-opacity` (7 % en clair = 4,6:1).
- Coût : un SVG de 27 Ko mis en cache, aucun JavaScript.
