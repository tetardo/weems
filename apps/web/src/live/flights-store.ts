import type { LiveFlight, LiveSnapshot, LiveUpdate } from "@weems/contrats";

/** Flights on the map, by id. Pure functions: easy to test, no React here. */
export type LiveFlights = ReadonlyMap<string, LiveFlight>;

export function fromSnapshot(snapshot: Pick<LiveSnapshot, "flights">): LiveFlights {
  return new Map(snapshot.flights.map((flight) => [flight.flightId, flight]));
}

export function applyUpdate(
  current: LiveFlights,
  update: Pick<LiveUpdate, "flights" | "removed">,
): LiveFlights {
  const next = new Map(current);
  for (const flight of update.flights) next.set(flight.flightId, flight);
  for (const id of update.removed) next.delete(id);
  return next;
}
