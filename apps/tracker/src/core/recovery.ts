import { distanceNm, type FlightPhase } from "@weems/contrats";

/** What the local database remembers of a flight that was still open when the tracker stopped. */
export interface SavedFlight {
  flightId: string;
  aircraftTitle: string;
  lastSeq: number;
  lastPositionSeq: number;
  lastPhase: FlightPhase | null;
  lastLat: number | null;
  lastLon: number | null;
  /** UTC ISO date of the last position or event. */
  lastAt: string | null;
}

/** Limits of a resume (spec T0 "Cas particuliers" and architecture interne, part 2). */
const RECOVERY_LIMITS = { maxGapMs: 30 * 60_000, maxDistanceNm: 5 };

/**
 * ENF-02: the flight resumes when it is the same aircraft, close to its last known position,
 * less than 30 minutes later. Otherwise it is closed as "interrupted", never deleted.
 */
export function decideRecovery(
  saved: SavedFlight,
  now: { aircraftTitle: string; lat: number; lon: number; utcMs: number },
): "resume" | "interrupt" {
  if (saved.aircraftTitle !== now.aircraftTitle) return "interrupt";
  if (saved.lastAt === null || saved.lastLat === null || saved.lastLon === null) return "interrupt";
  if (now.utcMs - Date.parse(saved.lastAt) > RECOVERY_LIMITS.maxGapMs) return "interrupt";
  const distance = distanceNm(saved.lastLat, saved.lastLon, now.lat, now.lon);
  return distance <= RECOVERY_LIMITS.maxDistanceNm ? "resume" : "interrupt";
}
