import { distanceNm as sharedDistanceNm } from "@weems/contrats";

/** A point in decimal degrees. */
export interface LatLon {
  lat: number;
  lon: number;
}

/** Mean Earth radius in nautical miles, as in the shared distanceNm of packages/contrats. */
const EARTH_RADIUS_NM = 3_440.065;
const rad = (degrees: number) => (degrees * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

/** Great-circle (orthodromic) distance in nautical miles (shared with the API's statistics). */
export const distanceNm = (a: LatLon, b: LatLon): number =>
  sharedDistanceNm(a.lat, a.lon, b.lat, b.lon);

/** Central angle between two points, in radians. */
const centralAngle = (a: LatLon, b: LatLon): number => distanceNm(a, b) / EARTH_RADIUS_NM;

/** Point at `fraction` (0 to 1) of the great circle from `a` to `b`. */
function pointAlong(a: LatLon, b: LatLon, angle: number, fraction: number): [number, number] {
  const k1 = Math.sin((1 - fraction) * angle) / Math.sin(angle);
  const k2 = Math.sin(fraction * angle) / Math.sin(angle);
  const x =
    k1 * Math.cos(rad(a.lat)) * Math.cos(rad(a.lon)) +
    k2 * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon));
  const y =
    k1 * Math.cos(rad(a.lat)) * Math.sin(rad(a.lon)) +
    k2 * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon));
  const z = k1 * Math.sin(rad(a.lat)) + k2 * Math.sin(rad(b.lat));
  return [deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.hypot(x, y)))];
}

/**
 * The same [lon, lat] points with each longitude moved by whole turns next to the one before it,
 * so that MapLibre draws a line over the antimeridian the short way instead of across the map.
 */
export function unwrapLongitudes(
  points: readonly [number, number][],
  startLon?: number,
): [number, number][] {
  let previous = startLon ?? points[0]?.[0] ?? 0;
  return points.map(([lon, lat]) => {
    previous = lon + 360 * Math.round((previous - lon) / 360);
    return [previous, lat];
  });
}

/**
 * The great circle from `a` to `b` as [lon, lat] points (GeoJSON order), one every `stepNm` or
 * so, starting at the longitude `startLon` (default `a.lon`) or a whole turn from it, with
 * continuous longitudes (see unwrapLongitudes).
 */
export function greatCircle(
  a: LatLon,
  b: LatLon,
  stepNm = 50,
  startLon = a.lon,
): [number, number][] {
  const angle = centralAngle(a, b);
  if (angle < 1e-9)
    return unwrapLongitudes(
      [
        [a.lon, a.lat],
        [b.lon, b.lat],
      ],
      startLon,
    );
  const steps = Math.min(256, Math.max(1, Math.ceil((EARTH_RADIUS_NM * angle) / stepNm)));
  const points = Array.from({ length: steps + 1 }, (_, i) => pointAlong(a, b, angle, i / steps));
  return unwrapLongitudes(points, startLon);
}

/** Initial bearing from `a` to `b`, radians. */
function bearing(a: LatLon, b: LatLon): number {
  const dLon = rad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon);
  return Math.atan2(y, x);
}

/** The point reached from `from` after `nm` nautical miles on the true course `courseDeg`. */
export function destination(from: LatLon, courseDeg: number, nm: number): LatLon {
  const angle = nm / EARTH_RADIUS_NM;
  const course = rad(courseDeg);
  const lat = Math.asin(
    Math.sin(rad(from.lat)) * Math.cos(angle) +
      Math.cos(rad(from.lat)) * Math.sin(angle) * Math.cos(course),
  );
  const lon =
    rad(from.lon) +
    Math.atan2(
      Math.sin(course) * Math.sin(angle) * Math.cos(rad(from.lat)),
      Math.cos(angle) - Math.sin(rad(from.lat)) * Math.sin(lat),
    );
  return { lat: deg(lat), lon: ((deg(lon) + 540) % 360) - 180 };
}

/**
 * Distance of `point` from the great circle `a` → `b`, nautical miles: positive right of the
 * route, negative left (cross-track distance).
 */
export function crossTrackNm(a: LatLon, b: LatLon, point: LatLon): number {
  const toPoint = centralAngle(a, point);
  return (
    Math.asin(Math.sin(toPoint) * Math.sin(bearing(a, point) - bearing(a, b))) * EARTH_RADIUS_NM
  );
}
