import type { FeatureCollection } from "geojson";
import type {
  AddLayerObject,
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";
import type { MapTheme } from "../map/map-theme.ts";

const SOURCE = "flight-detail";
const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/** Altitudes of the colours of MapTheme.altitudeRamp, ft. */
const RAMP_FEET = [0, 10_000, 25_000, 40_000] as const;

const kind = (value: string): FilterSpecification => ["==", ["get", "kind"], value];

/** Lines: direct route dashed and faint, trail coloured by altitude, speed vector. */
function lineLayers(theme: MapTheme): AddLayerObject[] {
  const ramp = RAMP_FEET.flatMap((feet, i) => [feet, theme.altitudeRamp[i] ?? theme.aircraft]);
  return [
    {
      id: `${SOURCE}-direct`,
      type: "line",
      source: SOURCE,
      filter: kind("direct"),
      paint: {
        "line-color": theme.ink,
        "line-opacity": 0.35,
        "line-width": 1.5,
        "line-dasharray": [3, 3],
      },
    },
    {
      id: `${SOURCE}-trail`,
      type: "line",
      source: SOURCE,
      filter: kind("trail"),
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ["interpolate", ["linear"], ["get", "alt"], ...ramp] as never,
        "line-width": 3.5,
      },
    },
    {
      id: `${SOURCE}-vector`,
      type: "line",
      source: SOURCE,
      filter: kind("vector"),
      layout: { "line-cap": "round" },
      paint: { "line-color": theme.ink, "line-width": 2 },
    },
  ];
}

/** Markers of take-off, top of climb and top of descent, with their label. */
function markerLayers(theme: MapTheme): AddLayerObject[] {
  return [
    {
      id: `${SOURCE}-marker`,
      type: "circle",
      source: SOURCE,
      filter: kind("marker"),
      paint: {
        "circle-radius": 4,
        "circle-color": theme.halo,
        "circle-stroke-color": theme.ink,
        "circle-stroke-width": 2,
      },
    },
    {
      id: `${SOURCE}-label`,
      type: "symbol",
      source: SOURCE,
      filter: kind("marker"),
      layout: {
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-offset": [0, -1.3],
        "text-allow-overlap": true,
      },
      paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 1.5 },
    },
  ];
}

/** Layers of the map of a flight in progress, under the aircraft (`beforeId`). */
export function addDetailLayers(map: MapLibreMap, theme: MapTheme, beforeId: string): void {
  map.addSource(SOURCE, { type: "geojson", data: EMPTY });
  for (const layer of [...lineLayers(theme), ...markerLayers(theme)]) map.addLayer(layer, beforeId);
}

/** When the trail, the position or the airports change. */
export function showDetail(map: MapLibreMap, detail: FeatureCollection | null): void {
  map.getSource<GeoJSONSource>(SOURCE)?.setData(detail ?? EMPTY);
}
