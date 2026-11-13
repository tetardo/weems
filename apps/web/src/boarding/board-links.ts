import type { BoardingFlight } from "@weems/contrats";
import { publicProfileLinks } from "../profile/profile-links.ts";

/**
 * Where a click on a callsign leads (spec web Boarding): with a public pilot, the public page of
 * the flight, in progress or closed (spec vol en cours: same address); with a private pilot, the
 * flight on the live map while it flies, nowhere once closed (no page shows it).
 */
export function flightHref(flight: BoardingFlight): string | null {
  if (flight.pilot) return publicProfileLinks(flight.pilot.handle).flight(flight.flightId);
  return flight.closed ? null : `/live?flight=${flight.flightId}`;
}
