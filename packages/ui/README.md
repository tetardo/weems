# @weems/ui

Composants React communs au site (`apps/web`) et à la console d'administration (`apps/admin`). Aujourd'hui : les formulaires du modèle C (fiche `docs/decisions/008-modele-de-formulaire.md`) et le bouton.

- Mis en forme avec Tailwind CSS 4. L'application qui les utilise ajoute `@source "<chemin>/packages/ui/src";` à son CSS et définit les couleurs `--color-bg`, `--color-surface`, `--color-line`, `--color-ink`, `--color-muted`, `--color-accent`, `--color-on-accent`, `--color-link`, `--color-accent-2`, `--color-danger` et l'ombre `--shadow-floating`.
- Sans texte écrit en dur : libellés et messages viennent de l'application (traductions du site, français de la console).
- Les icônes que l'application passe sont les siennes (`IconComponent`) ; le paquet n'importe Lucide que dans `src/icons.ts`, pour ses propres flèches.
- `react-aria-components` n'est importé que par `src/forms/search-select.tsx`.
- Arrondis : jetons `rounded-hero|panel|box|control|inner|tag` définis dans `src/radius.css`, que l'application importe dans son CSS (fiche `docs/decisions/014-arrondis-des-cadres.md`).
- Logique pure testée à part (`form-changes.test.ts`) ; les composants restent minces.
