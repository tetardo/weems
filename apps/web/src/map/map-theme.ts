/**
 * Colours of the maps for the site's two themes (GameLab look, src/app/global.css): OpenFreeMap
 * « dark » basemap in the dark theme, « positron » in the light one, and our own layers drawn
 * in colours readable on each.
 */
export interface MapTheme {
  readonly styleUrl: string;
  /** Background of the fallback map when the basemap cannot be loaded. */
  readonly fallback: string;
  /** Labels and the selected point. */
  readonly ink: string;
  /** Outline around labels, aircraft and points. */
  readonly halo: string;
  /** Aircraft with a live signal, and with a lost one. */
  readonly aircraft: string;
  readonly aircraftLost: string;
  /** Airports of the map of a public profile. */
  readonly airport: string;
}

const STYLES = "https://tiles.openfreemap.org/styles";

const DARK: MapTheme = {
  styleUrl: `${STYLES}/dark`,
  fallback: "#171e2e",
  ink: "#e8ecf5",
  halo: "#0e1320",
  aircraft: "#4fd1e8",
  aircraftLost: "#9aa6bf",
  airport: "#ffb454",
};

const LIGHT: MapTheme = {
  styleUrl: `${STYLES}/positron`,
  fallback: "#eef2f6",
  ink: "#1f2430",
  halo: "#ffffff",
  aircraft: "#0b7285",
  aircraftLost: "#9aa5b1",
  airport: "#b86a00",
};

export const mapTheme = (dark: boolean): MapTheme => (dark ? DARK : LIGHT);

/** Theme of the page, set on <html> by src/site/theme.ts. */
export const currentMapTheme = (): MapTheme =>
  mapTheme(document.documentElement.dataset.theme !== "light");
