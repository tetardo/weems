# À voir avec Houssine

Liste tenue à jour au fil du projet. Cocher une ligne quand c'est réglé, et noter la réponse en dessous.

## À demander

- [ ] **Pilotes A32NX autour de lui** (ajouté le 10/11/2026)
  Des pilotes de sa communauté volent-ils sur l'A32NX de FlyByWire, et acceptent-ils de partager leurs fichiers d'enregistrement `.fdr` ? Ces fichiers donnent de vrais vols MSFS pour tester les 12 phases du tracker avant d'avoir le PC Windows.
  Où les trouver sur leur PC : voir [fdr-analysis](https://github.com/flybywiresim/fdr-analysis). Demander leur accord pour utiliser ces vols en interne.

- [ ] **Avions de référence** (ajouté le 10/11/2026)
  Sur quels avions vole sa communauté ? La liste proposée (avions par défaut, FlyByWire A32NX, Fenix A320, PMDG 737) est à confirmer (exigence ENF-04 du cahier des charges).

- [ ] **Pilotes pour l'alpha et entretiens** (ajouté le 10/11/2026, complété le 11/11/2026)
  5 pilotes prêts à tester le tracker à l'alpha (J3, 50 vols au total), puis une cinquantaine pour la bêta (J4).
  Avant l'alpha, idéalement avant la fin de J1 : un entretien de 45 minutes avec chacun, selon le [guide d'entretien](guide-entretien-pilotes.md).

- [ ] **Fondateurs de compagnies virtuelles** (ajouté le 10/11/2026)
  Peut-il présenter 5 à 10 fondateurs de compagnies virtuelles, pour valider le prix de l'offre compagnie avant le lot 2 ?

- [ ] **Critères des repères à revoir sur les bandes de vol** (ajouté le 13/11/2026)
  Le carnet (page Vols, Pilot Pro) encadre 3 moments à revoir, sur des critères provisoires : plus de 250 kt sous 10 000 ft (SERA.6001), une inclinaison de plus de 30°, plus de 1 000 ft/min de descente sous 1 000 ft au-dessus du sol (approche stabilisée FSF). Les faire valider ou corriger par un pilote, et compléter la liste (seuils par catégorie d'avion ?). Code : `apps/api/src/modules/logbook/marks.ts`.
  Ajoutés le 14/11/2026 (fiche 022), aussi provisoires : alarme de survitesse ou de décrochage en vol ; feu anticollision éteint moteur en marche ; feux à éclats éteints sur la piste ; phares éteints en vol sous 10 000 ft ; roulage à plus de 30 kt (vitesse sol) ; variation cabine au-delà de +500 ft/min en montée ou -300 ft/min en descente (avion pressurisé seulement). Questions : ces seuils sont-ils les bons, faut-il des seuils par catégorie (roulage d'un avion léger), le feu anticollision doit-il s'allumer avant le repoussage plutôt qu'au démarrage ?

- [ ] **Avions lents : un vol qui ne se clôt jamais** (ajouté le 13/11/2026, trouvé par le simulateur d'activité, fiche 019)
  Le tracker n'a qu'un jeu de seuils de phases, celui d'un avion de ligne (`apps/tracker/src/core/phases/params.ts`). Il ne passe en DESCENT qu'au-delà de 500 ft/min de descente pendant 30 s. Or un C172 ou un PC-12 sur un plan à 3° à 65-90 kt descend à 350-480 ft/min. Après une croisière basse (sous 3 000 ft sol) ou une remise de gaz suivie d'un tour de piste, le vol reste en CRUISE : aucun atterrissage n'est reconnu et le vol n'est jamais clos. Le générateur l'évite en gardant la vitesse des avions lents jusqu'à 5 NM ; un vrai pilote n'y échappera pas. À trancher avec un pilote : seuils par catégorie d'avion (point ouvert de la spec T0) ou passage de CRUISE à APPROACH sous la hauteur d'approche.

## Réglé

- [x] **Un PC Windows avec MSFS** (11/11/2026)
  Greg aura son propre PC Windows avec MSFS sous quelques jours.

- [x] **Fastify ou NestJS pour l'API** (10/11/2026)
  Houssine ne connaît pas NestJS. Question transmise à Thibault (voir [à voir avec Thibault](a-voir-avec-thibault.md)).
