import type { Airport, FlightPhase, LiveTrailPoint, PositionReport } from "@weems/contrats";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { destination, greatCircle, unwrapLongitudes } from "../live/great-circle.ts";

/** The speed vector shows where the aircraft will be in this many minutes (Greg, 13/11). */
export const VECTOR_MINUTES = 3;

/** Phases whose start is marked on the trail: take-off, top of climb, top of descent. */
const MARKED: Partial<Record<FlightPhase, MarkerKind>> = {
  TAKEOFF: "takeoff",
  CRUISE: "topOfClimb",
  DESCENT: "topOfDescent",
};
type MarkerKind = "takeoff" | "topOfClimb" | "topOfDescent";

export interface PhaseMarker {
  kind: MarkerKind;
  at: string;
  lat: number;
  lon: number;
}

/** First point of each marked phase, in flight order (a second cruise after a step climb is not). */
export function phaseMarkers(points: readonly LiveTrailPoint[]): PhaseMarker[] {
  const seen = new Set<MarkerKind>();
  return points.flatMap((p, i) => {
    const kind = MARKED[p.phase];
    if (!kind || seen.has(kind) || points[i - 1]?.phase === p.phase) return [];
    seen.add(kind);
    return [{ kind, at: p.at, lat: p.lat, lon: p.lon }];
  });
}

const line = (
  kind: string,
  coordinates: [number, number][],
  properties: Record<string, number> = {},
): Feature<LineString> => ({
  type: "Feature",
  properties: { kind, ...properties },
  geometry: { type: "LineString", coordinates },
});

/** The flown trail as one segment per pair of points, each with the altitude it starts at. */
function altitudeSegments(points: readonly LiveTrailPoint[]): Feature<LineString>[] {
  const coordinates = unwrapLongitudes(points.map((p) => [p.lon, p.lat]));
  return points.slice(1).flatMap((_, i) => {
    const from = coordinates[i];
    const to = coordinates[i + 1];
    return from && to ? [line("trail", [from, to], { alt: points[i]?.altMsl ?? 0 })] : [];
  });
}

/** From the aircraft to where it will be in VECTOR_MINUTES at its ground speed and heading. */
function speedVector(position: PositionReport): Feature<LineString> | null {
  if (position.onGround || position.gs <= 0) return null;
  const ahead = destination(position, position.heading, (position.gs * VECTOR_MINUTES) / 60);
  return line(
    "vector",
    unwrapLongitudes([
      [position.lon, position.lat],
      [ahead.lon, ahead.lat],
    ]),
  );
}

/**
 * What the map of a flight in progress adds to the live map (Greg, 13/11, points 1 to 4): the trail
 * coloured by altitude, the speed vector, the take-off and top of climb and descent markers with
 * their `labels`, and the direct great circle from departure to arrival, dashed.
 */
export function mapDetail(
  points: readonly LiveTrailPoint[],
  position: PositionReport | null,
  airports: { departure: Airport | null; arrival: Airport | null },
  labels: (marker: PhaseMarker) => string,
): FeatureCollection<LineString | Point> {
  const features: Feature<LineString | Point>[] = altitudeSegments(points);
  const { departure, arrival } = airports;
  if (departure && arrival) features.push(line("direct", greatCircle(departure, arrival)));
  const vector = position && speedVector(position);
  if (vector) features.push(vector);
  for (const marker of phaseMarkers(points)) {
    features.push({
      type: "Feature",
      properties: { kind: "marker", label: labels(marker) },
      geometry: { type: "Point", coordinates: [marker.lon, marker.lat] },
    });
  }
  return { type: "FeatureCollection", features };
}
