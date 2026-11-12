import type { AircraftCategory, FlightSummary, PilotRoutes } from "@weems/contrats";
import type { TrackEndpoints } from "../tracks/service.ts";

type Route = PilotRoutes["routes"][number];
type RouteEnd = Route["from"];

function endOf(icao: string | null, point: { lat: number; lon: number }): RouteEnd {
  return { icao, lat: point.lat, lon: point.lon };
}

/** An airport by its code, else by its position to about 1 km. */
const endKey = (end: RouteEnd) => end.icao ?? `${end.lat.toFixed(2)},${end.lon.toFixed(2)}`;

/** A route being built: its flights, counted by aircraft category. */
interface Tally {
  from: RouteEnd;
  to: RouteEnd;
  byCategory: Map<AircraftCategory | null, number>;
}

/** The category most flown on the route (flights without one never win); first met on a tie. */
function dominantCategory(byCategory: Tally["byCategory"]): AircraftCategory | null {
  let best: { category: AircraftCategory; flights: number } | null = null;
  for (const [category, flights] of byCategory) {
    if (category && (!best || flights > best.flights)) best = { category, flights };
  }
  return best?.category ?? null;
}

function routeOf({ from, to, byCategory }: Tally): Route {
  const flights = [...byCategory.values()].reduce((total, count) => total + count, 0);
  return { from, to, flights, category: dominantCategory(byCategory) };
}

/**
 * The map of a public profile: flights grouped by route (each direction apart), placed with the
 * first and last point of their trajectory, coloured by the category most flown on it. Flights
 * without a trajectory are left out.
 */
export function routesOf(
  flights: readonly FlightSummary[],
  endpoints: ReadonlyMap<string, TrackEndpoints>,
): Route[] {
  const routes = new Map<string, Tally>();
  for (const flight of flights) {
    const track = endpoints.get(flight.flightId);
    if (!track) continue;
    const from = endOf(flight.departureIcao, track.first);
    const to = endOf(flight.plannedArrivalIcao, track.last);
    const key = `${endKey(from)}>${endKey(to)}`;
    const tally = routes.get(key) ?? { from, to, byCategory: new Map() };
    const category = flight.aircraftClass?.category ?? null;
    tally.byCategory.set(category, (tally.byCategory.get(category) ?? 0) + 1);
    routes.set(key, tally);
  }
  return [...routes.values()].map(routeOf);
}
