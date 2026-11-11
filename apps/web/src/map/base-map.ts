import {
  Map as MapLibreMap,
  type MapOptions,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";

/** Free basemap without key (spec J1, open question settled at the start of J1). */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
/** Copied into public/ by scripts/copy-map-worker.ts. */
const WORKER_URL = "/maplibre-gl-worker.mjs";

/** Plain background used when the basemap cannot be loaded: our own layers still show. */
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#eef2f6" } }],
};

/**
 * A MapLibre map on the Weems basemap; used by the live map and the flight page.
 * If the basemap does not load (no network, service down), it falls back to a plain background.
 */
export function createBaseMap(
  container: HTMLElement,
  view: Pick<MapOptions, "center" | "zoom" | "bounds" | "fitBoundsOptions">,
): MapLibreMap {
  setWorkerUrl(WORKER_URL);
  const map = new MapLibreMap({ container, style: STYLE_URL, ...view });
  map.once("error", () => {
    if (!map.isStyleLoaded()) map.setStyle(FALLBACK_STYLE);
  });
  return map;
}
