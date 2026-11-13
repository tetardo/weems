import type { LiveRoute } from "@weems/contrats";
import type { FeatureCollection } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";
import type { LatLon } from "./great-circle.ts";
import { aircraftLines, airportPoints, trailLine } from "./route-geojson.ts";

const TRAIL = "route-trail";
const AIRCRAFT_LINES = "route-aircraft";
const AHEAD = "route-ahead";
const AIRPORTS = "route-airports";
const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Layers of the selected flight's route, under the aircraft (`beforeId`): flown trail as a solid
 * line, great circle ahead dashed, departure and arrival airports with their codes.
 */
export function addRouteLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addSource(TRAIL, { type: "geojson", data: EMPTY });
  map.addSource(AIRCRAFT_LINES, { type: "geojson", data: EMPTY });
  map.addSource(AIRPORTS, { type: "geojson", data: EMPTY });
  const flown = {
    type: "line",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": theme.aircraft, "line-width": 3 },
  } as const;
  map.addLayer({ id: TRAIL, source: TRAIL, ...flown }, beforeId);
  map.addLayer(
    {
      id: AIRCRAFT_LINES,
      source: AIRCRAFT_LINES,
      filter: ["==", ["get", "kind"], "flown"],
      ...flown,
    },
    beforeId,
  );
  map.addLayer(
    {
      id: AHEAD,
      type: "line",
      source: AIRCRAFT_LINES,
      filter: ["==", ["get", "kind"], "ahead"],
      paint: {
        "line-color": theme.aircraft,
        "line-opacity": 0.9,
        "line-width": 2.5,
        "line-dasharray": [2, 2],
      },
    },
    beforeId,
  );
  addAirportLayers(map, theme, beforeId);
}

/** Departure and arrival: a dot and the ICAO code. */
function addAirportLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addLayer(
    {
      id: AIRPORTS,
      type: "circle",
      source: AIRPORTS,
      paint: {
        "circle-radius": 5,
        "circle-color": theme.ink,
        "circle-stroke-color": theme.halo,
        "circle-stroke-width": 2,
      },
    },
    beforeId,
  );
  map.addLayer(
    {
      id: `${AIRPORTS}-label`,
      type: "symbol",
      source: AIRPORTS,
      layout: { "text-field": ["get", "icao"], "text-size": 12, "text-offset": [0, 1.3] },
      paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 1.5 },
    },
    beforeId,
  );
}

const source = (map: MapLibreMap, id: string) => map.getSource<GeoJSONSource>(id);

/** When the route changes (selection, or a new trail point from the stream). */
export function showRoute(map: MapLibreMap, route: LiveRoute | null): void {
  source(map, TRAIL)?.setData(trailLine(route));
  source(map, AIRPORTS)?.setData(airportPoints(route));
  if (!route) source(map, AIRCRAFT_LINES)?.setData(EMPTY);
}

/** At each frame while a route is shown: the lines that follow the aircraft as it glides. */
export function followAircraft(
  map: MapLibreMap,
  route: LiveRoute | null,
  aircraft: LatLon | undefined,
): void {
  source(map, AIRCRAFT_LINES)?.setData(aircraftLines(route, aircraft));
}
