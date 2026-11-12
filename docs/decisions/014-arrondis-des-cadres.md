# 014 — Arrondis des cadres : 6 jetons partagés, valeurs « net »

Date : 12/11/2026. Demandé par Greg (« pour tous les cadres, réduire l'arrondi »), valeur B choisie par Greg sur maquette avant/après.

## Contexte

Le site et la console avaient une soixantaine de rayons écrits en dur (`rounded-2xl`, `rounded-[10px]`, `border-radius: 12px`…), avec des valeurs voisines pour le même rôle (14, 16, 18, 22 ou 28 px pour une carte). Greg trouvait les cadres trop arrondis. Changer l'arrondi demandait de retoucher chaque fichier.

## Options étudiées (maquette sur 6 pages réelles)

| Niveau | Actuel | A · léger | **B · net** | C · presque carré |
| --- | --- | --- | --- | --- |
| Photo d'accueil (`hero`) | 28 px | 18 px | **12 px** | 6 px |
| Cartes, barre, menus, dialogues (`panel`) | 16 px | 12 px | **8 px** | 4 px |
| Cadres internes, listes déroulantes (`box`) | 12 px | 10 px | **6 px** | 3 px |
| Boutons, champs (`control`) | 10 px | 8 px | **6 px** | 3 px |
| Onglets, options (`inner`) | 8 px | 6 px | **4 px** | 2 px |
| Badges, alertes, touches (`tag`) | 6 px | 4 px | **3 px** | 2 px |

A se distinguait à peine de l'actuel ; C jurait avec tout ce qui reste rond (avatar, pastilles d'état, points de la carte).

## Choix

- Les rayons sont des jetons Tailwind dans `packages/ui/src/radius.css` (`@theme static`), importé par `apps/web` et `apps/admin`. Classes `rounded-hero`, `rounded-panel`, `rounded-box`, `rounded-control`, `rounded-inner`, `rounded-tag` ; CSS simple : `var(--radius-panel)`…
- Valeurs B.
- Restent hors jetons : les formes rondes par nature (`rounded-full`, `50 %`, `999px`) et les tout petits repères de 2-3 px (pastilles de catégorie, drapeaux, légendes).
- Le tracker (Electron) n'est pas concerné.

## Conséquences

- Tout nouveau cadre utilise un de ces six jetons, jamais un rayon écrit en dur.
- Changer l'arrondi de tout le produit = modifier `radius.css` seul.
