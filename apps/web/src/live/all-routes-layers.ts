import type { FeatureCollection, LineString } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";

const ALL_ROUTES = "all-routes";
/** Faint lines, fainter still while a flight is selected so that its own route stands out. */
const OPACITY = { flown: [0.45, 0.12], ahead: [0.3, 0.08] } as const;

/**
 * Routes of all flights, faint and thin so that the map stays readable with many flights: flown
 * half solid, half ahead dashed. Under the selected route and the aircraft (`beforeId`).
 */
export function addAllRoutesLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addSource(ALL_ROUTES, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer(
    {
      id: `${ALL_ROUTES}-flown`,
      type: "line",
      source: ALL_ROUTES,
      filter: ["==", ["get", "kind"], "flown"],
      layout: { "line-cap": "round" },
      paint: { "line-color": theme.aircraft, "line-opacity": OPACITY.flown[0], "line-width": 1.5 },
    },
    beforeId,
  );
  map.addLayer(
    {
      id: `${ALL_ROUTES}-ahead`,
      type: "line",
      source: ALL_ROUTES,
      filter: ["==", ["get", "kind"], "ahead"],
      paint: {
        "line-color": theme.ink,
        "line-opacity": OPACITY.ahead[0],
        "line-width": 1,
        "line-dasharray": [3, 3],
      },
    },
    beforeId,
  );
}

export interface AllRoutes {
  lines: FeatureCollection<LineString>;
  dimmed: boolean;
}

export function showAllRoutes(map: MapLibreMap, { lines, dimmed }: AllRoutes): void {
  map.getSource<GeoJSONSource>(ALL_ROUTES)?.setData(lines);
  for (const kind of ["flown", "ahead"] as const) {
    map.setPaintProperty(`${ALL_ROUTES}-${kind}`, "line-opacity", OPACITY[kind][dimmed ? 1 : 0]);
  }
}
