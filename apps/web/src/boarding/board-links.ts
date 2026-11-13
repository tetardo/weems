import type { BoardingFlight } from "@weems/contrats";
import { publicProfileLinks } from "../profile/profile-links.ts";

/**
 * Where a click on a callsign leads (spec web Boarding): with a public pilot, the public page of
 * the flight once closed, and while in progress too unless the pilot keeps that page off (spec
 * vol en cours: same address); otherwise the flight on the live map while it flies, nowhere once
 * closed with a private pilot (no page shows it).
 */
export function flightHref(flight: BoardingFlight): string | null {
  const { pilot, closed, flightId } = flight;
  if (pilot && (closed || pilot.liveFlightPage))
    return publicProfileLinks(pilot.handle).flight(flightId);
  return closed ? null : `/live?flight=${flightId}`;
}
