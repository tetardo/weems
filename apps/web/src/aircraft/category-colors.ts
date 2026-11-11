import { AircraftCategory } from "@weems/contrats";

const cssName = (category: AircraftCategory) =>
  `--wm-cat-${category.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

/**
 * Colours of the categories in the page's current theme, read from the CSS variables of
 * src/app/global.css (one source for the pills and the maps).
 */
export function categoryColors(): Record<AircraftCategory, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    AircraftCategory.options.map((category) => [
      category,
      style.getPropertyValue(cssName(category)).trim(),
    ]),
  ) as Record<AircraftCategory, string>;
}
