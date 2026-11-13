import {
  Map as MapLibreMap,
  type MapOptions,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import { withBasemapPaint } from "./basemap-paint.ts";
import { currentMapTheme, type MapTheme } from "./map-theme.ts";

/** Copied into public/ by scripts/copy-map-worker.ts. */
const WORKER_URL = "/maplibre-gl-worker.mjs";

/** Plain background used when the basemap cannot be loaded: our own layers still show. */
const fallbackStyle = (color: string): StyleSpecification => ({
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": color } }],
});

/** The basemap of `theme` with its colours (MapLibre applies it to the fetched style). */
const styleOf = (theme: MapTheme) => ({
  style: theme.styleUrl,
  transformStyle: (_previous: StyleSpecification | undefined, next: StyleSpecification) =>
    withBasemapPaint(next, theme.basemapPaint),
});

/** Our layers, added again on every new basemap (style changes erase them). */
export type AddLayers = (map: MapLibreMap, theme: MapTheme) => void;

/**
 * A MapLibre map on the free OpenFreeMap basemap of the page's theme (no key, spec J1); used by
 * the live map and the flight page. `addLayers` runs once the basemap is loaded, and again after
 * the pilot switches the theme: the basemap is then replaced by the one of the new theme.
 * If the basemap does not load (no network, service down), it falls back to a plain background.
 * Follows the size of its container, not only of the window (floating bar, cards).
 */
export function createBaseMap(
  container: HTMLElement,
  view: Pick<MapOptions, "center" | "zoom" | "bounds" | "fitBoundsOptions" | "interactive">,
  addLayers: AddLayers,
): MapLibreMap {
  setWorkerUrl(WORKER_URL);
  let theme = currentMapTheme();
  const map = new MapLibreMap({ container, ...styleOf(theme), ...view });
  // Our own flag: during a theme change MapLibre still reports the old style as loaded.
  let styleLoaded = false;
  map.on("style.load", () => {
    styleLoaded = true;
    addLayers(map, theme);
  });
  map.on("error", () => {
    if (styleLoaded) return;
    styleLoaded = true; // one fallback per basemap, even if several requests fail
    map.setStyle(fallbackStyle(theme.fallback), { diff: false });
  });
  const themeWatch = new MutationObserver(() => {
    const next = currentMapTheme();
    if (next === theme) return;
    theme = next;
    styleLoaded = false;
    const { style, transformStyle } = styleOf(theme);
    map.setStyle(style, { diff: false, transformStyle });
  });
  themeWatch.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const resize = new ResizeObserver(() => map.resize());
  resize.observe(container);
  map.once("remove", () => {
    resize.disconnect();
    themeWatch.disconnect();
  });
  return map;
}
