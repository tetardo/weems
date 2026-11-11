import type { FlightSummary, PilotRoutes } from "@weems/contrats";
import type { TrackEndpoints } from "../tracks/service.ts";

type Route = PilotRoutes["routes"][number];
type RouteEnd = Route["from"];

function endOf(icao: string | null, point: { lat: number; lon: number }): RouteEnd {
  return { icao, lat: point.lat, lon: point.lon };
}

/** An airport by its code, else by its position to about 1 km. */
const endKey = (end: RouteEnd) => end.icao ?? `${end.lat.toFixed(2)},${end.lon.toFixed(2)}`;

/**
 * The map of a public profile: flights grouped by route (each direction apart), placed with the
 * first and last point of their trajectory. Flights without a trajectory are left out.
 */
export function routesOf(
  flights: readonly FlightSummary[],
  endpoints: ReadonlyMap<string, TrackEndpoints>,
): Route[] {
  const routes = new Map<string, Route>();
  for (const flight of flights) {
    const track = endpoints.get(flight.flightId);
    if (!track) continue;
    const from = endOf(flight.departureIcao, track.first);
    const to = endOf(flight.plannedArrivalIcao, track.last);
    const key = `${endKey(from)}>${endKey(to)}`;
    const known = routes.get(key);
    routes.set(key, known ? { ...known, flights: known.flights + 1 } : { from, to, flights: 1 });
  }
  return [...routes.values()];
}
