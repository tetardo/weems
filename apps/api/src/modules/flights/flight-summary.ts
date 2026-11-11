import { FlightAlert, type FlightEvent, type FlightSummary } from "@weems/contrats";
import { flightTimes } from "./flight-times.ts";
import type { FlightRecord } from "./repository.ts";

/** Alert badges of the list: which notable events happened, in a fixed order. */
function alertsOf(events: readonly FlightEvent[]): FlightAlert[] {
  const types = new Set<string>(events.map((e) => e.type));
  return FlightAlert.options.filter((alert) => types.has(alert));
}

/** One line of the flight list. */
export function summarize(flight: FlightRecord, events: readonly FlightEvent[]): FlightSummary {
  return {
    flightId: flight.flightId,
    callsign: flight.callsign,
    aircraftTitle: flight.aircraft.title,
    aircraftModel: flight.aircraft.model,
    aircraftClass: flight.aircraftClass,
    departureIcao: flight.departureIcao,
    plannedArrivalIcao: flight.plannedArrivalIcao,
    openedAt: flight.openedAt,
    closedAt: flight.closedAt,
    closeReason: flight.closeReason,
    times: flightTimes(flight, events),
    alerts: alertsOf(events),
  };
}
