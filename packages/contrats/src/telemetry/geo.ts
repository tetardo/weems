/** Mean Earth radius, in nautical miles. */
export const EARTH_RADIUS_NM = 3440.065;
/** Radians per degree. */
export const RAD = Math.PI / 180;

export interface LatLon {
  lat: number;
  lon: number;
}

/** Distance in nautical miles (great circle). */
export function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

/** Distance in nautical miles between two points (great circle). */
export const distanceBetweenNm = (a: LatLon, b: LatLon): number =>
  distanceNm(a.lat, a.lon, b.lat, b.lon);

/** Angle in [0, 360). */
export const normalizeDeg = (deg: number): number => ((deg % 360) + 360) % 360;

/** Signed smallest turn from `from` to `to`, in (-180, 180]: positive to the right. */
export function angleDiffDeg(from: number, to: number): number {
  const diff = normalizeDeg(to - from);
  return diff > 180 ? diff - 360 : diff;
}

/** Initial true course of the great circle from `from` to `to`, in degrees. */
export function bearingDeg(from: LatLon, to: LatLon): number {
  const lat1 = from.lat * RAD;
  const lat2 = to.lat * RAD;
  const dLon = (to.lon - from.lon) * RAD;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeDeg(Math.atan2(y, x) / RAD);
}

/** Point reached after `nm` on the great circle leaving `from` on true course `courseDeg`. */
export function destinationPoint(from: LatLon, courseDeg: number, nm: number): LatLon {
  const angular = nm / EARTH_RADIUS_NM;
  const course = courseDeg * RAD;
  const lat1 = from.lat * RAD;
  const lon1 = from.lon * RAD;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(course),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(course) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / RAD, lon: normalizeDeg(lon2 / RAD + 180) - 180 };
}

/** Distance from `point` to the great circle through `start` on course `courseDeg`: positive right. */
export function crossTrackNm(point: LatLon, start: LatLon, courseDeg: number): number {
  const angular = distanceBetweenNm(start, point) / EARTH_RADIUS_NM;
  const delta = (bearingDeg(start, point) - courseDeg) * RAD;
  return Math.asin(Math.sin(angular) * Math.sin(delta)) * EARTH_RADIUS_NM;
}
