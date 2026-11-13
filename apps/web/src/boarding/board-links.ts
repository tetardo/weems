import type { BoardingFlight } from "@weems/contrats";
import { publicProfileLinks } from "../profile/profile-links.ts";

/**
 * Where a click on a callsign leads (spec web Boarding): the public page of the flight once it is
 * closed and its pilot public; still open, the flight on the live map, the only place it can be
 * followed; closed with a private pilot, nowhere (no page shows it).
 */
export function flightHref(flight: BoardingFlight): string | null {
  if (!flight.closed) return `/live?flight=${flight.flightId}`;
  return flight.pilot ? publicProfileLinks(flight.pilot.handle).flight(flight.flightId) : null;
}
