import { distanceNm, type LatLon } from "./great-circle.ts";

/** How far along its route a flight is. */
export interface RouteProgress {
  /** 0 to 1. */
  fraction: number;
  /** Straight (great-circle) distance left to the arrival airport. */
  remainingNm: number;
  /** At the current ground speed; null when too slow to say (on the ground, holding). */
  remainingMinutes: number | null;
}

/** Below this ground speed the time left means nothing. */
const MIN_GS_KT = 50;

/**
 * Progress from the distance flown away from departure and the distance left to arrival, both
 * direct: it never goes backwards on a detour and reaches 100 % on arrival. The flown trail is
 * not used: it is lost when the API restarts.
 */
export function routeProgress(
  aircraft: LatLon & { gs: number },
  departure: LatLon | null,
  arrival: LatLon | null,
): RouteProgress | null {
  if (!departure || !arrival) return null;
  const flown = distanceNm(departure, aircraft);
  const remainingNm = distanceNm(aircraft, arrival);
  const total = flown + remainingNm;
  return {
    fraction: total > 0 ? flown / total : 1,
    remainingNm,
    remainingMinutes: aircraft.gs >= MIN_GS_KT ? (remainingNm / aircraft.gs) * 60 : null,
  };
}
