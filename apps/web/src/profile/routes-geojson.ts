import type { PilotRoutes } from "@weems/contrats";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";

type Route = PilotRoutes["routes"][number];
type End = Route["from"];

const RAD = Math.PI / 180;
const ARC_STEPS = 48;

const toVector = ({ lat, lon }: End) => [
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
];

/**
 * Points of the great circle between two airports, longitudes kept continuous across the
 * antimeridian (MapLibre then draws the short way, over the Pacific).
 */
export function greatCircle(from: End, to: End, steps = ARC_STEPS): [number, number][] {
  const [a, b] = [toVector(from), toVector(to)];
  const dot = Math.min(
    1,
    Math.max(
      -1,
      a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0),
    ),
  );
  const angle = Math.acos(dot);
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const [wa, wb] =
      angle < 1e-9
        ? [1 - f, f]
        : [Math.sin((1 - f) * angle), Math.sin(f * angle)].map((w) => w / Math.sin(angle));
    const [x, y, z] = a.map((v, k) => (wa ?? 0) * v + (wb ?? 0) * (b[k] ?? 0)) as [
      number,
      number,
      number,
    ];
    let lon = Math.atan2(y, x) / RAD;
    const previous = points[i - 1]?.[0];
    if (previous !== undefined) lon += 360 * Math.round((previous - lon) / 360);
    points.push([lon, Math.atan2(z, Math.hypot(x, y)) / RAD]);
  }
  return points;
}

/** Line width of a route: thicker when flown often, without a 50-flight route hiding the rest. */
export const routeWidth = (flights: number) => 1.5 + Math.log2(flights) * 1.5;

/** One arc per route, with its number of flights. */
export function routeLines(routes: readonly Route[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: routes.map(({ from, to, flights }): Feature<LineString> => ({
      type: "Feature",
      properties: { width: routeWidth(flights) },
      geometry: { type: "LineString", coordinates: greatCircle(from, to) },
    })),
  };
}

/** One point per airport, labelled with its ICAO code when known. */
export function airportPoints(routes: readonly Route[]): FeatureCollection<Point> {
  const airports = new Map<string, End>();
  for (const end of routes.flatMap((r) => [r.from, r.to])) {
    airports.set(end.icao ?? `${end.lat.toFixed(2)},${end.lon.toFixed(2)}`, end);
  }
  return {
    type: "FeatureCollection",
    features: [...airports.values()].map((end): Feature<Point> => ({
      type: "Feature",
      properties: { label: end.icao ?? "" },
      geometry: { type: "Point", coordinates: [end.lon, end.lat] },
    })),
  };
}

/** Frame of all the arcs, [[west, south], [east, north]]; null without route. */
export function routesBounds(
  routes: readonly Route[],
): [[number, number], [number, number]] | null {
  const coordinates = routeLines(routes).features.flatMap((f) => f.geometry.coordinates);
  if (coordinates.length === 0) return null;
  const lons = coordinates.map(([lon]) => lon ?? 0);
  const lats = coordinates.map(([, lat]) => lat ?? 0);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}
