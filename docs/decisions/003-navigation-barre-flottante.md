# 003 — Navigation : barre flottante translucide

Date : 11/11/2026. Décidé par Greg (« partons sur la maquette B barre flottante »). Remplace, dans la fiche 001, le menu latéral de 240 px et la barre du haut de 52 px.

## Contexte

Greg aime la mise en page des contenus, mais trouve l'en-tête et le menu datés : menu latéral à libellés, bloc cyan sur la page active, barre du haut presque vide. Huit directions ont été maquettées (`/mnt/project-files/j4-navigation/`, `maquette-navigation.html?v=a…h`) : rail d'icônes, barre flottante, palette de commande, avionique, bandeau cockpit, dock vertical, espaces par compagnie, carte en bandeau.

![Comparaison des quatre premières directions](img/003-navigation-comparaison.png)

## Choix

Direction B :

- une barre translucide (flou d'arrière-plan) détachée des bords, collée en haut au défilement, alignée sur la largeur des contenus ;
- le logo à gauche, les pages en onglets segmentés au centre (la page active est en relief), le menu du pilote à droite (initiale, nom sur grand écran, langue et déconnexion dans un menu) ;
- un bouton soleil / lune dans la barre pour passer en thème clair ou sombre (ajout de Greg) : le choix est gardé dans le navigateur (`localStorage`), sinon le site suit le réglage du système ; un petit script dans l'en-tête de la page applique le thème avant l'affichage, sans clignotement (`src/site/theme.ts`, testé) ;
- une lueur douce en haut de la page, couleur de l'accent ;
- sur téléphone (moins de 768 px), les onglets passent dans un dock flottant en bas de l'écran, à portée du pouce ;
- la carte en direct passe sous la barre et sous le dock.

Les couleurs « verre », lueur et ombres sont des variables du thème (`global.css`), en sombre et en clair.

## Conséquences

- **Limite assumée : 5 entrées au plus dans la barre.** Le menu final estimé en compte environ 13 (lot 3, compagnie virtuelle). La compagnie (« Ma compagnie ») ouvrira un menu déroulant, et le compte (réglages, abonnement, tracker) ira dans le menu du pilote. Recommandation contraire de Claude : rail d'icônes (direction A), qui accepte plus d'entrées sans menu caché. Si un pilote peut appartenir à plusieurs compagnies, il faudra revoir la question au lot 3.
- `src/site/aside-menu.tsx` est supprimé ; la page active est calculée par `src/site/current-page.ts` (testé).
- Les cartes (direct, page de vol) gardent le thème qu'elles avaient à l'ouverture de la page : changer de thème sur une carte ne la recolore qu'au rechargement.
- Écarts assumés avec la maquette : « Statistiques », « Ma compagnie », la recherche et les notifications n'apparaîtront qu'avec leurs pages (pas de lien mort).
- Les menus déroulants partagent `src/ui/use-dismiss.ts` (Échap, clic à l'extérieur).
