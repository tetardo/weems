"use client";

import type { PilotRoutes } from "@weems/contrats";
import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { categoryColors } from "../aircraft/category-colors.ts";
import { createBaseMap } from "../map/base-map.ts";
import type { MapTheme } from "../map/map-theme.ts";
import { airportPoints, routeLines, routesBounds } from "./routes-geojson.ts";

/** Colour of an arc: the one of its category, the plain arc colour when it has none. */
function categoryColor(theme: MapTheme): ExpressionSpecification {
  return ["coalesce", ["get", ["get", "category"], ["literal", categoryColors()]], theme.aircraft];
}

function addRouteLayers(map: MapLibreMap, routes: PilotRoutes["routes"], theme: MapTheme): void {
  map.addSource("routes", { type: "geojson", data: routeLines(routes) });
  map.addLayer({
    id: "routes",
    type: "line",
    source: "routes",
    layout: { "line-cap": "round" },
    paint: {
      "line-color": categoryColor(theme),
      "line-width": ["get", "width"],
      "line-opacity": 0.85,
    },
  });
  map.addSource("airports", { type: "geojson", data: airportPoints(routes) });
  map.addLayer({
    id: "airports",
    type: "circle",
    source: "airports",
    paint: {
      "circle-radius": 4.5,
      "circle-color": theme.airport,
      "circle-stroke-color": theme.halo,
      "circle-stroke-width": 1.5,
    },
  });
  map.addLayer({
    id: "airport-labels",
    type: "symbol",
    source: "airports",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-offset": [0, 1.1],
      "text-anchor": "top",
    },
    paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 1.5 },
  });
}

/**
 * Map of a public profile (spec J4): one arc per route, thicker when flown often, in the colour
 * of the aircraft category most flown on it.
 */
export function RoutesMap({ routes }: { routes: PilotRoutes["routes"] }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = routesBounds(routes);
    if (!container.current || !frame) return;
    const map = createBaseMap(
      container.current,
      { bounds: frame, fitBoundsOptions: { padding: 48, maxZoom: 7 } },
      (target, theme) => addRouteLayers(target, routes, theme),
    );
    return () => map.remove();
  }, [routes]);
  return (
    <div
      ref={container}
      className="h-72 w-full overflow-hidden rounded-2xl border border-line md:h-[23rem]"
    />
  );
}
