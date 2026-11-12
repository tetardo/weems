import { AircraftCategory, type LiveFlight } from "@weems/contrats";
import type { LiveFlights } from "./flights-store.ts";

/** Category of a flight on the map: « other » when the API could not tell. */
export const categoryOf = (flight: LiveFlight): AircraftCategory =>
  flight.aircraftClass?.category ?? "other";

/** Flights of each category, in the order of the legend; categories with no flight left out. */
export function categoryCounts(flights: LiveFlights): [AircraftCategory, number][] {
  const counts = new Map<AircraftCategory, number>();
  for (const flight of flights.values()) {
    const category = categoryOf(flight);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return AircraftCategory.options.flatMap((category) => {
    const count = counts.get(category);
    return count ? [[category, count] as [AircraftCategory, number]] : [];
  });
}

/** The flights the spectator did not hide with the legend. The same map when nothing is hidden. */
export function visibleFlights(
  flights: LiveFlights,
  hidden: ReadonlySet<AircraftCategory>,
): LiveFlights {
  if (hidden.size === 0) return flights;
  return new Map([...flights].filter(([, flight]) => !hidden.has(categoryOf(flight))));
}
