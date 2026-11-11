import type { TrackView } from "@weems/contrats";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { colorOf } from "./phase-colors.ts";

type TrackPoint = TrackView["points"][number];

/**
 * The track as one line per run of the same phase, each coloured by its phase.
 * Consecutive runs share their boundary point, so the line has no gap.
 */
export function phaseLines(points: readonly TrackPoint[]): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  let run: TrackPoint[] = [];
  const close = () => {
    const [head] = run;
    if (head && run.length > 1) {
      features.push({
        type: "Feature",
        properties: { phase: head.phase, color: colorOf(head.phase) },
        geometry: { type: "LineString", coordinates: run.map((p) => [p.lon, p.lat]) },
      });
    }
  };
  for (const point of points) {
    const last = run.at(-1);
    if (last && last.phase !== point.phase) {
      run.push(point);
      close();
      run = [point];
    } else run.push(point);
  }
  close();
  return { type: "FeatureCollection", features };
}

/** Departure and arrival markers. */
export function endpoints(points: readonly TrackPoint[]): FeatureCollection<Point> {
  const ends = [points[0], points.at(-1)].flatMap((p, i) =>
    p ? [{ point: p, kind: i === 0 ? "departure" : "arrival" }] : [],
  );
  return {
    type: "FeatureCollection",
    features: ends.map(({ point, kind }) => ({
      type: "Feature",
      properties: { kind },
      geometry: { type: "Point", coordinates: [point.lon, point.lat] },
    })),
  };
}

/** [[west, south], [east, north]] of the track, to frame the map. */
export function bounds(points: readonly TrackPoint[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}
