# Reste à faire pour le traqueur

Liste des travaux du traqueur (`apps/tracker`) décidés mais pas encore faits. Cocher et déplacer dans « Fait » avec le lien de la PR une fois livré. Les points MSFS à confirmer sur le PC Windows restent dans `apps/tracker/docs/reference/pieges.md`.

## À faire

- [ ] **Ouvrir le traqueur depuis le site** (ajouté le 12/11/2026, carnet de vol privé)
  Le bouton « Lancer le traqueur » de la carte « Prochain vol » du carnet ouvre le traqueur sur le PC du pilote. Il faut que le traqueur déclare une adresse `weems://` à son installation (Electron : `app.setAsDefaultProtocolClient("weems")`, et déclaration du protocole dans le paquet Microsoft Store). Le lien peut transmettre le plan SimBrief à charger, par exemple `weems://start?ofp=<id>`.
  À vérifier : comportement si le traqueur n'est pas installé (le site doit proposer le téléchargement), et si le traqueur est déjà ouvert (une seule instance, qui reçoit le lien).

## Fait

(rien pour l'instant)
