# @weems/local-process

Commandes lancées sur le Mac du développeur, partagées par la console (`apps/console`) et le lanceur Mac (`apps/launcher`).

| Fichier | Rôle |
| --- | --- |
| `src/managed-process.ts` | Une commande dans son propre groupe de processus (arrêt de tout ce qu'elle a lancé : SIGTERM, puis SIGKILL après 10 s), avec ses journaux |
| `src/log-buffer.ts` | Les 200 dernières lignes écrites par un processus |

Jamais utilisé en production : ces outils ne servent qu'en local (fiches `docs/decisions/009-console-admin-locale.md` et `020-lanceur-mac.md`).
