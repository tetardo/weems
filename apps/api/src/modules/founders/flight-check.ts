import { FOUNDER_OFFER, type FounderFlight } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { flightValidity } from "../flights/validity.ts";

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
    check: flightValidity(flight, distanceNm),
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
