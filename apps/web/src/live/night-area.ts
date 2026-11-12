import {
  destinationPoint,
  EARTH_RADIUS_NM,
  NIGHT_BELOW_DEG,
  RAD,
  subsolarPoint,
} from "@weems/contrats";
import type { Feature, MultiPolygon, Position } from "geojson";

/** Night is within this angle of the point opposite the sun (90° minus the twilight depth). */
const NIGHT_RADIUS_DEG = 90 + NIGHT_BELOW_DEG;
const STEPS = 180;

type LonLat = [number, number];

/** Longitudes made continuous: no jump of 360° between two points of the ring. */
function unwrap(ring: LonLat[]): LonLat[] {
  const out: LonLat[] = [];
  for (const [lon, lat] of ring) {
    const previous = out.at(-1)?.[0] ?? lon;
    out.push([lon + 360 * Math.round((previous - lon) / 360), lat]);
  }
  return out;
}

/** Points of the circle of this angular radius around a point, going once around it. */
function circleAround(center: { lat: number; lon: number }, radiusDeg: number): LonLat[] {
  const radiusNm = radiusDeg * RAD * EARTH_RADIUS_NM;
  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const point = destinationPoint(center, (360 * i) / STEPS, radiusNm);
    return [point.lon, point.lat];
  });
}

/**
 * Area where the sun is below NIGHT_BELOW_DEG (the profile's night rule), drawn on the live map:
 * a circle around the point opposite the sun. When it holds a pole, the ring goes once around the
 * Earth and is closed through that pole. Copies one world to each side cover the whole map.
 */
export function nightArea(at: Date): Feature<MultiPolygon> {
  const sun = subsolarPoint(at);
  const antisolar = { lat: -sun.lat, lon: sun.lon > 0 ? sun.lon - 180 : sun.lon + 180 };
  const ring = unwrap(circleAround(antisolar, NIGHT_RADIUS_DEG));
  const [first, last] = [ring[0] as LonLat, ring.at(-1) as LonLat];
  if (Math.abs(last[0] - first[0]) > 180) {
    const pole = antisolar.lat > 0 ? 90 : -90;
    ring.push([last[0], pole], [first[0], pole], first);
  }
  const shifted = (by: number): Position[][] => [ring.map(([lon, lat]) => [lon + by, lat])];
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "MultiPolygon", coordinates: [shifted(-360), shifted(0), shifted(360)] },
  };
}
