import type { LiveFlight, LiveSnapshot, LiveUpdate } from "@weems/contrats";

/** Flights on the map, by id. Pure functions: easy to test, no React here. */
export type LiveFlights = ReadonlyMap<string, LiveFlight>;

export function fromSnapshot(snapshot: LiveSnapshot): LiveFlights {
  return new Map(snapshot.flights.map((flight) => [flight.flightId, flight]));
}

export function applyUpdate(current: LiveFlights, update: LiveUpdate): LiveFlights {
  const next = new Map(current);
  for (const flight of update.flights) next.set(flight.flightId, flight);
  for (const id of update.removed) next.delete(id);
  return next;
}
