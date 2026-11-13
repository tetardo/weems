"use client";

import type { TrackView } from "@weems/contrats";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { createBaseMap } from "../map/base-map.ts";
import type { MapTheme } from "../map/map-theme.ts";
import { nearestIndex } from "./profile-geometry.ts";
import { bounds, endpoints, phaseLines } from "./track-geojson.ts";

type TrackPoint = TrackView["points"][number];

interface Props {
  points: readonly TrackPoint[];
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** Size of the map; it fills its box on the full page of a flight. */
  className?: string;
}

const LINES = "track";
const ENDS = "track-ends";
const CURSOR = "track-cursor";

function addTrackLayers(map: MapLibreMap, points: readonly TrackPoint[], theme: MapTheme): void {
  map.addSource(LINES, { type: "geojson", data: phaseLines(points) });
  map.addLayer({
    id: LINES,
    type: "line",
    source: LINES,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": ["get", "color"], "line-width": 3 },
  });
  map.addSource(ENDS, { type: "geojson", data: endpoints(points) });
  map.addLayer({
    id: ENDS,
    type: "circle",
    source: ENDS,
    paint: {
      "circle-radius": 6,
      "circle-color": ["match", ["get", "kind"], "departure", "#2f855a", "#9b2c2c"],
      "circle-stroke-color": theme.halo,
      "circle-stroke-width": 2,
    },
  });
  map.addSource(CURSOR, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: CURSOR,
    type: "circle",
    source: CURSOR,
    paint: {
      "circle-radius": 7,
      "circle-color": theme.ink,
      "circle-stroke-color": theme.halo,
      "circle-stroke-width": 2,
    },
  });
}

/** Pointer farther than this from the track (screen pixels): nothing selected. */
const HOVER_RADIUS_PX = 30;

/** Index of the track point closest to the pointer on screen, or null if none is near. */
function pointUnder(
  map: MapLibreMap,
  points: readonly TrackPoint[],
  event: MapMouseEvent,
): number | null {
  const distances = points.map((p) => {
    const screen = map.project([p.lon, p.lat]);
    return Math.hypot(screen.x - event.point.x, screen.y - event.point.y);
  });
  const index = nearestIndex(distances, 0); // the smallest distance
  return (distances[index] ?? Infinity) <= HOVER_RADIUS_PX ? index : null;
}

/** The whole track coloured by phase; hovering a point selects it (spec site minimal). */
export function TrackMap({ points, selected, onSelect, className = "h-80 md:h-[28rem]" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    const frame = bounds(points);
    if (!container.current || !frame) return;
    const instance = createBaseMap(
      container.current,
      { bounds: frame, fitBoundsOptions: { padding: 40 } },
      (target, theme) => addTrackLayers(target, points, theme),
    );
    map.current = instance;
    instance.on("mousemove", (event) => select.current(pointUnder(instance, points, event)));
    instance.on("mouseout", () => select.current(null));
    return () => instance.remove();
  }, [points]);

  useEffect(() => {
    const point = selected === null ? undefined : points[selected];
    const source = map.current?.getSource<GeoJSONSource>(CURSOR);
    source?.setData({
      type: "FeatureCollection",
      features: point
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [point.lon, point.lat] },
            },
          ]
        : [],
    });
  }, [selected, points]);

  return (
    <div
      ref={container}
      className={`w-full overflow-hidden rounded-control border border-line ${className}`}
    />
  );
}
