import type { LiveRoute, PositionReport } from "@weems/contrats";

/** Same thinning as the API's trail (live-trails.ts): one point every 15 s of flight time. */
export const KEEP_EVERY_MS = 15_000;

/** Route of the followed flight: read once from the API, then grown from the live stream. */
export interface FollowedRoute {
  flightId: string;
  route: LiveRoute;
  /** Flight time of the last point added from the stream; null until the first one. */
  lastKeptMs: number | null;
}

/** The route read from the API when the flight is selected. */
export const followedRoute = (flightId: string, route: LiveRoute): FollowedRoute => ({
  flightId,
  route,
  lastKeptMs: null,
});

/**
 * Adds a position received on the stream to the trail, at most one point every 15 s of flight
 * time (sample time, not arrival time: a paused simulator adds nothing).
 */
export function withPosition(followed: FollowedRoute, position: PositionReport): FollowedRoute {
  const atMs = Date.parse(position.at);
  if (followed.lastKeptMs !== null && atMs - followed.lastKeptMs < KEEP_EVERY_MS) return followed;
  const trail: LiveRoute["trail"] = [...followed.route.trail, [position.lon, position.lat]];
  return { ...followed, route: { ...followed.route, trail }, lastKeptMs: atMs };
}
