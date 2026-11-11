# J4 — Profil public du pilote

Rédigée le 11/11/2026, avant le code. Chantier « profil public » du jalon J4 (voir [Lots et feuille de route](../cadrage/04-lots-et-feuille-de-route.md)) ; la montée en charge du direct est traitée à part. Tout se développe et se teste en local (décision de Greg du 11/11/2026) : le référencement réel attend la mise en ligne.

## Objectif

Un pilote qui le souhaite obtient une page publique, partageable par un simple lien et trouvable par les moteurs de recherche : son pseudo, ses statistiques et ses vols. C'est le levier d'acquisition du lot 1 (« effet communauté », [parc et positionnement](../cadrage/01-parc-et-positionnement.md)).

**Critère de fin** : un pilote active son profil depuis le site ; un navigateur sans compte voit sa page et ses vols ; il désactive, la page répond 404 au rechargement suivant ; aucune donnée de la liste « jamais publique » n'apparaît dans les réponses publiques de l'API (vérifié par test).

## Périmètre

| Dans ce chantier | Hors chantier |
| --- | --- |
| Activation du profil par le pilote (désactivé par défaut), choix de l'adresse | Photo, biographie, liens VATSIM/IVAO/SimBrief (le profil pilote du cadrage viendra avec SimBrief) |
| Page publique : pseudo, statistiques, liste des vols | Note et débriefing : les critères ne sont pas définis |
| Page de vol publique : trajet, carte, profil vertical, phases, atterrissage | Abonnés, commentaires, « j'aime », classements |
| Masquer un vol précis de son profil | « En vol maintenant » sur le profil (dépend du direct, autre chantier) |
| Référencement : rendu serveur, métadonnées, plan du site, `robots.txt` | Export et suppression du compte (RGPD, à faire avant J5, chantier à part) |

## 1. Adresse

![Profil public : activation et consultation](../schemas/img/j4-profil-public.png)

- Profil : `/{langue}/pilots/{pseudo-url}`, par exemple `/fr/pilots/greg-fr`.
- Vol public : `/{langue}/pilots/{pseudo-url}/flights/{id}`.
- **Pseudo d'adresse** (`handle`) : choisi par le pilote à l'activation, unique, 3 à 30 caractères `a-z`, `0-9` et `-`, sans tiret au début ni à la fin. Proposé par défaut à partir de son pseudo affiché. Une liste de mots réservés (`admin`, `weems`, `support`, `settings`…) est refusée.
- Modifiable ; l'ancienne adresse répond alors 404, sans redirection (simple, et aucun lien n'est encore partagé en local) [Confiance moyenne : à revoir avant J5 si des pilotes changent souvent d'adresse].
- Pourquoi pas l'identifiant du compte (UUID) dans l'adresse : illisible, mauvais pour le partage et le référencement. Pourquoi pas le pseudo affiché : il n'est pas unique et peut contenir n'importe quel caractère.

## 2. Ce qui est public, ce qui ne l'est jamais

| Public quand le profil est activé | Jamais public |
| --- | --- |
| Pseudo affiché, pseudo d'adresse, date d'activation du profil | E-mail, identifiant interne du compte, sessions, jetons |
| Vols **clos** non masqués : indicatif, avion, départ, arrivée, heures UTC, temps bloc et en vol, phases, atterrissage, événements, trajectoire simplifiée | Vols en cours (pas de suivi d'une personne en temps réel par son profil) |
| Statistiques calculées sur ces vols | Vols masqués par le pilote, et leurs effets sur les statistiques |
| | Version du tracker, trajectoire complète (seule la simplifiée est montrée), avis du pilote sur les phases (alpha) |

Règles :

- **Désactivé par défaut** (cadrage, section RGPD). Rien n'est public tant que le pilote n'a pas activé lui-même le profil.
- **Désactivé ou inexistant = 404**, la même réponse dans les deux cas : on ne révèle pas qu'un pseudo existe.
- **Vol masqué** : bouton sur sa page de vol privée. Un vol masqué répond 404 en public et sort des statistiques.
- **Effet immédiat** : pas de cache côté site ni côté API pour ces pages en J4 ; une désactivation se voit au rechargement suivant.

## 3. Confidentialité et RGPD

- **Base légale** : le consentement du pilote (activation explicite, case à cocher qui dit ce qui sera visible), retirable à tout moment par le même interrupteur.
- **Minimisation** : un pseudo, aucune donnée d'identité réelle. Le formulaire d'activation rappelle de ne pas utiliser son vrai nom s'il ne le souhaite pas.
- **Retrait** : la désactivation retire la page tout de suite chez Weems et du plan du site. Les moteurs de recherche peuvent garder une copie quelques jours : le texte d'activation le dit [Confiance élevée].
- **Trace** : la date d'activation est gardée (preuve du consentement) ; la date de désactivation aussi.
- Les mentions de confidentialité (jalon J4, « CGU et confidentialité ») devront décrire ce traitement. Hors de ce chantier, noté pour ne pas l'oublier.

## 4. Contenu des pages

**Profil** (`/pilots/{handle}`)

- En-tête : pseudo, « pilote depuis » (date d'activation), avion le plus volé.
- Statistiques : nombre de vols, heures de vol (temps en vol) et heures bloc, aéroports différents visités, nombre d'avions différents, taux de chute moyen au toucher et meilleur atterrissage (le plus doux).
- Liste des vols, du plus récent au plus ancien, 20 par page : date, indicatif, trajet, avion, temps bloc, pastilles (remise des gaz, rebond…). Même tableau que « Mes vols », sans filtres.
- Pas de carte de tous les trajets en J4 : il faudrait les coordonnées des aéroports (import OurAirports pas encore fait).

**Vol public** (`/pilots/{handle}/flights/{id}`) : la page de vol existante (carte colorée par phase, profil vertical, phases, atterrissage, journal), en lecture seule, avec un lien vers le profil. Le vol doit appartenir au pilote de l'adresse, sinon 404.

**Réglages** (`/settings/profile`, connecté) : interrupteur, pseudo d'adresse, lien « Voir mon profil public », rappel de ce qui est public. Nouvelle entrée « Profil public » dans le menu.

Textes en français et en anglais, comme le reste du site.

## 5. Référencement

- Pages rendues côté serveur (déjà le cas), titre et description par page (« Greg-FR — 42 vols sur Weems »), image de partage (Open Graph) générique Weems en J4.
- Adresse canonique et variantes de langue (`hreflang` fr et en).
- `sitemap.xml` : les profils activés, avec leur date de mise à jour ; `robots.txt` : tout le reste du site (pages connectées) est exclu.
- Pages connectées marquées `noindex`.
- Limite assumée [Confiance élevée] : en local, rien n'est indexé ; on vérifie les balises et le plan du site, pas le classement.

## 6. API

Nouveau module `profiles` : `routes.ts`, `service.ts`, `repository.ts`. Il lit les vols par le service du module `flights`, jamais par son `repository`.

| Route | Accès | Rôle |
| --- | --- | --- |
| `GET /v1/me/profile` | Pilote connecté | État du profil, pseudo d'adresse, pseudo proposé |
| `PUT /v1/me/profile` | Pilote connecté | Activer ou désactiver, changer le pseudo d'adresse (409 s'il est pris, 422 s'il est invalide ou réservé) |
| `PUT /v1/flights/{id}/visibility` | Propriétaire du vol | Masquer ou montrer un vol sur le profil |
| `GET /v1/pilots/{handle}` | Public | Profil et statistiques |
| `GET /v1/pilots/{handle}/flights` | Public | Vols publics, par pages (même curseur que `/v1/flights`) |
| `GET /v1/pilots/{handle}/flights/{id}` et `…/track` | Public | Vol public et trajectoire simplifiée |
| `GET /v1/pilots` | Public | Profils activés et date de mise à jour, pour le plan du site |

- Base : nouvelle table `pilot_profiles` (compte, pseudo d'adresse unique, activé oui ou non, dates d'activation, de désactivation et de mise à jour), et une colonne `hidden_on_profile` sur `flights` (faux par défaut). On ne touche pas aux tables de Better Auth.
- Formats des réponses publiques dans `packages/contrats`, **distincts** des formats privés : un format public ne contient que les champs de la colonne « public » ci-dessus. C'est ce qui empêche une fuite si on ajoute plus tard un champ privé à un vol.
- Statistiques calculées à la demande à partir des vols et de leurs événements. Suffisant en local et pour l'alpha ; à remplacer par des valeurs stockées à la clôture du vol si un profil dépasse quelques centaines de vols [Confiance moyenne].
- Routes publiques limitées en débit par adresse IP (protection contre l'aspiration des profils).

## 7. Site

- `proxy.ts` : `/pilots/*`, `sitemap.xml` et `robots.txt` ouverts sans compte ; le reste du site reste derrière la connexion.
- Les composants de la page de vol sont réutilisés tels quels (`src/flight/`) ; la page publique ne fait que changer la source des données (routes publiques, sans cookie).
- Nouveau dossier `src/profile/` : statistiques, en-tête, réglages.

## 8. Tests

| Exigence | Test |
| --- | --- |
| Désactivé par défaut | Un compte neuf : `GET /v1/pilots/{handle}` répond 404 |
| 404 identique | Profil désactivé et pseudo inexistant : même réponse |
| Vol d'un autre pilote | `/pilots/a/flights/{vol de b}` répond 404 |
| Vol masqué | 404 en public et absent des statistiques |
| Vol en cours | Absent de la liste et 404 en public |
| Aucune donnée privée | La réponse publique ne contient ni e-mail, ni identifiant de compte, ni version du tracker (test sur le contenu brut) |
| Pseudo d'adresse | Invalide ou réservé : 422 ; déjà pris : 409 ; deux demandes simultanées : une seule gagne |
| Droits | Masquer le vol d'un autre pilote : 404 |
| Site | Test navigateur : activer, ouvrir le profil sans session, désactiver, 404 |
| Référencement | Le plan du site liste les profils activés seulement ; les pages connectées portent `noindex` |

## 9. Ordre de livraison

1. Cette spec, validée par Greg.
2. API : table, routes, formats publics, tests (une PR).
3. Site : réglages, page de profil, page de vol publique, référencement, test navigateur (une PR).

## Choix proposés à Greg

| Sujet | Recommandation | Alternative écartée |
| --- | --- | --- |
| Adresse | `/pilots/{pseudo-url}`, pseudo d'adresse choisi et unique | Identifiant du compte : illisible ; pseudo affiché : pas unique |
| Granularité | Un interrupteur pour le profil, plus « masquer ce vol » | Tout ou rien : un vol raté pousserait à tout fermer ; vol par vol à activer : trop de clics, profils vides |
| Vols en cours | Jamais sur le profil | Les montrer : suivi d'une personne en temps réel, et dépend du chantier du direct |
| Référencement | Profil activé = référencé, sans réglage séparé | Case « ne pas référencer » : une option de plus pour un gain faible ; ajoutable plus tard |
| Statistiques | Calculées à la demande | Stockées à la clôture : plus rapide, mais une migration et un recalcul en plus, inutiles à ce volume |
