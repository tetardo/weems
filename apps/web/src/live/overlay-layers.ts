import type { Feature, FeatureCollection, MultiPolygon, Point } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";
import { LOWEST_LIVE_LAYER } from "./all-routes-layers.ts";

const NIGHT = "night";
const BUSY_AIRPORTS = "busy-airports";
const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/** What the live map draws besides the flights (spec J4, carte en direct, ideas 2 and 5). */
export interface Overlays {
  /** Night area, or null when the spectator hides it. */
  night: Feature<MultiPolygon> | null;
  /** Airports with departures or arrivals in progress, and how many. */
  busyAirports: FeatureCollection<Point>;
}

/**
 * Night under everything of ours; busy airports over the routes and under the aircraft
 * (`aircraftLayer`): a ring and « EHAM 4 », the busiest kept when labels collide.
 */
export function addOverlayLayers(map: MapLibreMap, theme: MapTheme, aircraftLayer: string): void {
  map.addSource(NIGHT, { type: "geojson", data: EMPTY });
  map.addLayer(
    { id: NIGHT, type: "fill", source: NIGHT, paint: { "fill-color": theme.night } },
    LOWEST_LIVE_LAYER,
  );
  map.addSource(BUSY_AIRPORTS, { type: "geojson", data: EMPTY });
  map.addLayer(
    {
      id: BUSY_AIRPORTS,
      type: "circle",
      source: BUSY_AIRPORTS,
      paint: {
        "circle-radius": 5,
        "circle-color": theme.halo,
        "circle-stroke-color": theme.airport,
        "circle-stroke-width": 2.5,
      },
    },
    aircraftLayer,
  );
  map.addLayer(
    {
      id: `${BUSY_AIRPORTS}-label`,
      type: "symbol",
      source: BUSY_AIRPORTS,
      layout: {
        "text-field": [
          "format",
          ["get", "icao"],
          {},
          "  ",
          {},
          ["to-string", ["get", "count"]],
          { "text-color": theme.airport },
        ],
        "text-size": 12,
        "text-anchor": "left",
        "text-offset": [0.9, 0],
        "symbol-sort-key": ["-", ["get", "count"]],
      },
      paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 2 },
    },
    aircraftLayer,
  );
}

export function showOverlays(map: MapLibreMap, { night, busyAirports }: Overlays): void {
  map.getSource<GeoJSONSource>(NIGHT)?.setData(night ?? EMPTY);
  map.getSource<GeoJSONSource>(BUSY_AIRPORTS)?.setData(busyAirports);
}
