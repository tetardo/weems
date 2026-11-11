# 001 — Look du site : style GameLab IA, menu latéral

Date : 11/11/2026. Décidé par Greg. Partie « menu latéral » remplacée par la fiche 003 (barre flottante).

## Contexte

Le site pilote (`apps/web`) avait reçu le look Admin One React (#22). Greg cherchait encore son modèle définitif. Trois maquettes ont été comparées sur les mêmes pages (connexion, Mes vols, page d'un vol, téléphone) :

- Admin One (fusionné, #22) ;
- Soft UI Dashboard Tailwind (branche `mock/soft-ui`) ;
- le style de son autre projet GameLab IA, sans menu latéral (`mock/gamelab`), avec menu latéral (`mock/gamelab-side`) et avec le menu final estimé (`mock/gamelab-menus`).

Captures dans le dossier du projet : `j3-soft-ui/`, `j3-gamelab/`, `j3-gamelab-menu/`, `j3-gamelab-menus/`.

## Choix

Style GameLab avec menu latéral :

- thème sombre bleu nuit par défaut, thème clair selon le réglage du système, mêmes couleurs que GameLab (accent cyan, second accent orange) ;
- polices Inter (texte) et Space Grotesk (titres), servies par Next.js (`next/font`, aucun appel à Google depuis le navigateur) ;
- menu latéral de 240 px, en tiroir sous 1024 px ; boutons et champs de 44 px ; panneaux à coins de 16 px ;
- liste des vols en petites cartes sur téléphone.

## Pourquoi

- Un menu latéral parce que le site comptera 7 entrées pour un pilote et 10 à 12 pour un gérant de compagnie (lots 2 et 3) : une barre du haut seule ne suffit pas.
- Un thème sombre cohérent avec l'usage (simulation, cockpit) et avec l'autre projet de Greg.
- Aucune dépendance ajoutée.

## Conséquences

- Deux thèmes à tenir : toute couleur passe par les variables de `global.css`, jamais par une couleur Tailwind en dur.
- Le fond de carte OpenFreeMap reste clair en thème sombre (fond sombre à étudier).
- Icônes : `@mdi/js` conservé (GameLab utilise Lucide, au trait plus fin).
- Remplace le look Admin One de #22 ; la structure du cadre (menu fixe, tiroir) en reste issue (`apps/web/NOTICE.md`).
