/** A point in decimal degrees. */
export interface LatLon {
  lat: number;
  lon: number;
}

/** Mean Earth radius in nautical miles. */
const EARTH_RADIUS_NM = 3_440.065;
const rad = (degrees: number) => (degrees * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;

/** Central angle between two points, in radians (haversine: stable for short distances). */
function centralAngle(a: LatLon, b: LatLon): number {
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Great-circle (orthodromic) distance in nautical miles. */
export const distanceNm = (a: LatLon, b: LatLon): number => EARTH_RADIUS_NM * centralAngle(a, b);

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
