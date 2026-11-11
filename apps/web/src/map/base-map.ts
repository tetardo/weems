import {
  Map as MapLibreMap,
  type MapOptions,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import type { MapTheme } from "./map-theme.ts";

/** Copied into public/ by scripts/copy-map-worker.ts. */
const WORKER_URL = "/maplibre-gl-worker.mjs";

/** Plain background used when the basemap cannot be loaded: our own layers still show. */
const fallbackStyle = (color: string): StyleSpecification => ({
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": color } }],
});

/**
 * A MapLibre map on the free OpenFreeMap basemap of `theme` (no key, spec J1); used by the live
 * map and the flight page.
 * If the basemap does not load (no network, service down), it falls back to a plain background.
 * Follows the size of its container, not only of the window (side menu, cards).
 */
export function createBaseMap(
  container: HTMLElement,
  view: Pick<MapOptions, "center" | "zoom" | "bounds" | "fitBoundsOptions">,
  theme: MapTheme,
): MapLibreMap {
  setWorkerUrl(WORKER_URL);
  const map = new MapLibreMap({ container, style: theme.styleUrl, ...view });
  map.once("error", () => {
    if (!map.isStyleLoaded()) map.setStyle(fallbackStyle(theme.fallback));
  });
  const resize = new ResizeObserver(() => map.resize());
  resize.observe(container);
  map.once("remove", () => resize.disconnect());
  return map;
}
