import type { TrackPoint } from "@weems/contrats";
import { sunElevationDeg } from "./sun.ts";

/** Night: from the end of evening civil twilight to the start of morning civil twilight (EASA). */
const NIGHT_BELOW_DEG = -6;

/**
 * Airborne seconds by day and by night along a trajectory: each interval between two airborne
 * points counts by the sun's elevation at its middle, where the aircraft is.
 */
export function dayNightSeconds(points: readonly TrackPoint[]): { dayS: number; nightS: number } {
  let dayS = 0;
  let nightS = 0;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    if (!a || !b || a.onGround || b.onGround) continue;
    const start = Date.parse(a.at);
    const seconds = (Date.parse(b.at) - start) / 1000;
    const middle = new Date(start + (seconds * 1000) / 2);
    // Across the antimeridian the mean longitude would be on the other side of the Earth.
    const lon = Math.abs(a.lon - b.lon) > 180 ? a.lon : (a.lon + b.lon) / 2;
    const elevation = sunElevationDeg(middle, (a.lat + b.lat) / 2, lon);
    if (elevation < NIGHT_BELOW_DEG) nightS += seconds;
    else dayS += seconds;
  }
  return { dayS, nightS };
}
