# 002 — Icônes Lucide et fond de carte sombre

Date : 11/11/2026. Décidé par Greg (« look go »). Complète la fiche 001, dont elle remplace la partie « icônes ».

## Contexte

La fiche 001 gardait les icônes `@mdi/js` et laissait le fond de carte clair en thème sombre. Ce sont les deux écarts restants avec GameLab IA.

## Choix

- Icônes : Lucide (`lucide-react`, licence ISC), comme GameLab. Une seule porte d'entrée, `apps/web/src/ui/icons.ts`, qui renomme chaque icône selon son sens (`BackIcon`, `FlightsIcon`…). `@mdi/js` est retiré.
- Carte : fond OpenFreeMap « dark » en thème sombre, « positron » en thème clair. Les avions, étiquettes et points de la trajectoire prennent les couleurs du thème (`apps/web/src/map/map-theme.ts`).

## Conséquences

- Une dépendance remplacée par une autre, de taille comparable une fois réduite aux icônes utilisées.
- Le thème de la carte est lu à l'ouverture de la page : un changement de thème du système pendant la visite ne s'applique qu'au rechargement. Mis à jour par la fiche 003 : la carte suit le bouton thème du site sans rechargement.
- Si le style « dark » d'OpenFreeMap ne charge pas, la carte retombe sur un fond uni sombre (comportement de secours existant).
