# @weems/contrats

Formats de données partagés par le tracker, l'API et le site web, décrits une seule fois avec Zod.
Le même schéma valide les données à l'entrée de chaque application et produit la documentation OpenAPI.

Références : [spécification T0, partie A](../../docs/cahiers-des-charges/tracker/spec-T0.md) et [spécification J0 de l'API](../../docs/cahiers-des-charges/api/spec-J0-api.md).

| Dossier | Contenu |
| --- | --- |
| `src/telemetry/` | Ce que le connecteur fournit au cœur du tracker : échantillon, fiche avion, toucher, événements du simulateur |
| `src/flight/` | Notions de vol partagées : les 12 phases, les motifs de clôture |
| `src/api/` | Messages échangés avec l'API |

Règles : valeur inconnue = `null`, jamais 0 ; unités internes de la spec T0 (degrés, ft, kt, ft/min, kg, g, ms).
