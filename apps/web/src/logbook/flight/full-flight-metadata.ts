import type { Metadata } from "next";
import { formatRoute } from "../../format/flight-format.ts";
import { loadFullFlight } from "./load-full-flight.ts";

/** Title of a page of one flight in the logbook (full page, ECAM page): callsign and route. */
export async function fullFlightMetadata(flightId: string, prefix = ""): Promise<Metadata> {
  try {
    const data = await loadFullFlight(flightId);
    if (!data) return {};
    const { flight } = data;
    const route = formatRoute(flight.departureIcao, flight.plannedArrivalIcao);
    return { title: `${prefix}${flight.callsign} ${route}` };
  } catch {
    return {};
  }
}
