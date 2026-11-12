import { FLIGHT_PHASES, type LiveFlight } from "@weems/contrats";
import type { Airports } from "./airport-book.ts";
import type { LiveFlights } from "./flights-store.ts";
import { routeProgress } from "./route-progress.ts";

/** At most this many answers under the search field. */
const MAX_RESULTS = 8;

/** Lower case, without accents: « Hélène » is found by « helene ». */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * How well a flight answers the search; 0 when it does not. Callsign first, then a public
 * pilot's name or handle, then the departure or arrival airport (spec J4, carte en direct).
 */
function score(flight: LiveFlight, query: string): number {
  const callsign = plain(flight.callsign);
  if (callsign.startsWith(query)) return 4;
  if (callsign.includes(query)) return 3;
  const { pilot } = flight;
  if (pilot && [pilot.name, pilot.handle].some((text) => plain(text).includes(query))) return 2;
  const airports = [flight.departureIcao, flight.plannedArrivalIcao];
  return airports.some((code) => code && plain(code).startsWith(query)) ? 1 : 0;
}

/** Flights matching the search, best first, then by callsign. Empty for an empty search. */
export function searchFlights(flights: LiveFlights, search: string): LiveFlight[] {
  const query = plain(search);
  if (query.length === 0) return [];
  return [...flights.values()]
    .map((flight) => ({ flight, score: score(flight, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.flight.callsign.localeCompare(b.flight.callsign))
    .slice(0, MAX_RESULTS)
    .map(({ flight }) => flight);
}

/** Orders of the « En vol » list. */
export const SORT_KEYS = ["arrival", "callsign", "phase"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

const remainingNm = (flight: LiveFlight, airports: Airports) => {
  const at = (code: string | null) => (code ? (airports.get(code) ?? null) : null);
  const progress = routeProgress(
    flight.position,
    at(flight.departureIcao),
    at(flight.plannedArrivalIcao),
  );
  return progress?.remainingNm ?? Infinity;
};

/**
 * The « En vol » list: closest to its arrival first (unknown route last), by callsign, or by
 * phase in flight order (boarding first). Ties by callsign.
 */
export function sortFlights(flights: LiveFlights, airports: Airports, key: SortKey): LiveFlight[] {
  const byCallsign = (a: LiveFlight, b: LiveFlight) => a.callsign.localeCompare(b.callsign);
  const rank: Record<SortKey, (flight: LiveFlight) => number> = {
    arrival: (flight) => remainingNm(flight, airports),
    callsign: () => 0,
    phase: (flight) => FLIGHT_PHASES.indexOf(flight.position.phase),
  };
  return [...flights.values()].sort((a, b) => rank[key](a) - rank[key](b) || byCallsign(a, b));
}
