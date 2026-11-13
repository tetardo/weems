import type { LiveTrailPoint, PositionReport } from "@weems/contrats";
import { KEEP_EVERY_MS } from "../live/followed-trail.ts";

/**
 * Adds a position received on the live stream to the points of the flight, at most one every 15 s
 * of flight time, like the API's trail (sample time: a paused simulator adds nothing).
 */
export function withPosition(
  points: readonly LiveTrailPoint[],
  position: PositionReport,
): readonly LiveTrailPoint[] {
  const last = points.at(-1);
  if (last && Date.parse(position.at) - Date.parse(last.at) < KEEP_EVERY_MS) return points;
  const { at, lat, lon, altMsl, gs, vs, phase } = position;
  return [...points, { at, lat, lon, altMsl, gs, vs, phase }];
}
