import { type FlightValidity, VALID_FLIGHT } from "@weems/contrats";
import type { SummaryWithEvents } from "./service.ts";

/** Teleports: the flight was not flown all the way. */
const MOVED = new Set(["slew", "positionChanged"]);

/**
 * Whether a closed flight is valid (founder offer, pilot grades): a real simulator, a liftoff
 * and a touchdown, 15 min in the air, 20 NM of trajectory, no teleport, no crash. Pure.
 * `distanceNm`: length of its trajectory, null when none was received yet.
 */
export function flightValidity(
  flight: SummaryWithEvents,
  distanceNm: number | null,
): FlightValidity {
  const { airborneS } = flight.summary.times;
  const types = new Set(flight.events.map((event) => event.type));
  if (flight.simulator === "replay") return "simulated";
  if (airborneS === null) return "noTakeoffOrLanding";
  if ([...types].some((type) => MOVED.has(type))) return "moved";
  if (types.has("crashed")) return "crashed";
  if (airborneS < VALID_FLIGHT.minAirborneMinutes * 60) return "tooShort";
  if (distanceNm === null || distanceNm < VALID_FLIGHT.minDistanceNm) return "tooShortDistance";
  return "valid";
}
