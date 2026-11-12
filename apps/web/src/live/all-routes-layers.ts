import type { FeatureCollection, LineString } from "geojson";
import type { FilterSpecification, GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";

const ALL_ROUTES = "all-routes";
/** The lowest of our layers: the night goes under it. */
export const LOWEST_LIVE_LAYER = `${ALL_ROUTES}-flown`;
/** Faint lines, fainter still while a flight is selected so that its own route stands out. */
const OPACITY = { flown: [0.45, 0.12], ahead: [0.3, 0.08] } as const;

/** The route of the aircraft under the mouse, drawn over the faint ones: a preview. */
const HOVERED = `${ALL_ROUTES}-hovered`;
const hoveredFilter = (kind: string, flightId: string | null): FilterSpecification => [
  "all",
  ["==", ["get", "kind"], kind],
  ["==", ["get", "flightId"], flightId ?? ""],
];

/**
 * Routes of all flights, faint and thin so that the map stays readable with many flights: flown
 * half solid, half ahead dashed; the hovered one stands out. Under the selected route and the
 * aircraft (`beforeId`).
 */
export function addAllRoutesLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addSource(ALL_ROUTES, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer(
    {
      id: LOWEST_LIVE_LAYER,
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
  addHoveredLayers(map, theme, beforeId);
}

function addHoveredLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addLayer(
    {
      id: `${HOVERED}-flown`,
      type: "line",
      source: ALL_ROUTES,
      filter: hoveredFilter("flown", null),
      layout: { "line-cap": "round" },
      paint: { "line-color": theme.aircraft, "line-width": 2.5 },
    },
    beforeId,
  );
  map.addLayer(
    {
      id: `${HOVERED}-ahead`,
      type: "line",
      source: ALL_ROUTES,
      filter: hoveredFilter("ahead", null),
      paint: { "line-color": theme.aircraft, "line-width": 2, "line-dasharray": [2, 2] },
    },
    beforeId,
  );
}

export interface AllRoutes {
  lines: FeatureCollection<LineString>;
  dimmed: boolean;
  /** Flight under the mouse, whose route stands out. */
  hoveredId: string | null;
}

export function showAllRoutes(map: MapLibreMap, { lines, dimmed, hoveredId }: AllRoutes): void {
  map.getSource<GeoJSONSource>(ALL_ROUTES)?.setData(lines);
  for (const kind of ["flown", "ahead"] as const) {
    map.setPaintProperty(`${ALL_ROUTES}-${kind}`, "line-opacity", OPACITY[kind][dimmed ? 1 : 0]);
    map.setFilter(`${HOVERED}-${kind}`, hoveredFilter(kind, hoveredId));
  }
}
