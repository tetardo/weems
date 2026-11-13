import type { Airport, LiveRoute } from "@weems/contrats";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { greatCircle, type LatLon, unwrapLongitudes } from "./great-circle.ts";

const line = (kind: string, coordinates: [number, number][]): Feature<LineString> => ({
  type: "Feature",
  properties: { kind },
  geometry: { type: "LineString", coordinates },
});

const collection = <T extends LineString | Point>(
  features: Feature<T>[],
): FeatureCollection<T> => ({
  type: "FeatureCollection",
  features,
});

/** The flown trail (read from the API, grown from the stream), longitudes made continuous. */
export function trailLine(route: LiveRoute | null): FeatureCollection<LineString> {
  const points = unwrapLongitudes(route?.trail ?? []);
  return collection(points.length > 1 ? [line("flown", points)] : []);
}

/**
 * What moves with the aircraft, recomputed at each frame (a few dozen points): the short "flown"
 * line from the last trail point to the aircraft, and the great circle "ahead" to the arrival.
 */
export function aircraftLines(
  route: LiveRoute | null,
  aircraft: LatLon | undefined,
): FeatureCollection<LineString> {
  if (!route || !aircraft) return collection([]);
  const trail = unwrapLongitudes(route.trail);
  const last = trail.at(-1);
  const [here] = unwrapLongitudes([[aircraft.lon, aircraft.lat]], last?.[0]);
  const features = last && here ? [line("flown", [last, here])] : [];
  if (route.arrival) {
    features.push(line("ahead", greatCircle(aircraft, route.arrival, 50, here?.[0])));
  }
  return collection(features);
}

const airportPoint = (kind: string, airport: Airport): Feature<Point> => ({
  type: "Feature",
  properties: { kind, icao: airport.icao, name: airport.name },
  geometry: { type: "Point", coordinates: [airport.lon, airport.lat] },
});

/** Departure and arrival airports that are known. */
export function airportPoints(route: LiveRoute | null): FeatureCollection<Point> {
  const features: Feature<Point>[] = [];
  if (route?.departure) features.push(airportPoint("departure", route.departure));
  if (route?.arrival) features.push(airportPoint("arrival", route.arrival));
  return collection(features);
}
