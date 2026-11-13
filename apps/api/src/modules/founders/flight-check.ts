import { FOUNDER_OFFER, type FounderFlight, type FounderFlightCheck } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";

/** Teleports: the flight was not flown all the way. */
const MOVED = new Set(["slew", "positionChanged"]);

/**
 * Whether a closed flight counts towards a founder place (spec offre fondateurs): a real
 * simulator, a liftoff and a touchdown, 15 min in the air, 20 NM of trajectory, no teleport,
 * no crash. `distanceNm`: length of its trajectory, null when none was received yet.
 */
export function checkFlight(
  flight: SummaryWithEvents,
  distanceNm: number | null,
): FounderFlightCheck {
  const { airborneS } = flight.summary.times;
  const types = new Set(flight.events.map((event) => event.type));
  if (flight.simulator === "replay") return "simulated";
  if (airborneS === null) return "noTakeoffOrLanding";
  if ([...types].some((type) => MOVED.has(type))) return "moved";
  if (types.has("crashed")) return "crashed";
  if (airborneS < FOUNDER_OFFER.minAirborneMinutes * 60) return "tooShort";
  if (distanceNm === null || distanceNm < FOUNDER_OFFER.minDistanceNm) return "tooShortDistance";
  return "valid";
}

/** A flight as the pilot's progress shows it. */
export function founderFlight(flight: SummaryWithEvents, distanceNm: number | null): FounderFlight {
  const { summary } = flight;
  return {
    flightId: summary.flightId,
    departureIcao: summary.departureIcao,
    arrivalIcao: summary.plannedArrivalIcao,
    aircraftTitle: summary.aircraftTitle,
    openedAt: summary.openedAt,
    airborneS: summary.times.airborneS,
    distanceNm: distanceNm === null ? null : Math.round(distanceNm),
    check: checkFlight(flight, distanceNm),
  };
}

/** Valid flights and the UTC days they were flown on; enough of both makes a founder. */
export function progressOf(flights: readonly FounderFlight[]): {
  validFlights: number;
  validDays: number;
  qualified: boolean;
} {
  const valid = flights.filter((flight) => flight.check === "valid");
  const validDays = new Set(valid.map((flight) => flight.openedAt.slice(0, 10))).size;
  const qualified =
    valid.length >= FOUNDER_OFFER.requiredFlights && validDays >= FOUNDER_OFFER.requiredDays;
  return { validFlights: valid.length, validDays, qualified };
}
