import type { Boarding, BoardingFlight, BoardingStatus } from "@weems/contrats";

/** Lines of each board on one page; beyond, the board turns its pages by itself. */
const ROWS_PER_PAGE = 12;
/** Time each page stays on the board. */
export const PAGE_EVERY_MS = 15_000;

/** A terrain code typed in the filter or read from the address (?airport=lfml → LFML). */
export function airportCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{3,4}$/.test(code) ? code : null;
}

/**
 * The boards of one airport: departures leaving it, arrivals going to it. Without a code, every
 * flight.
 */
export function forAirport(board: Boarding, airport: string | null): Boarding {
  if (!airport) return board;
  return {
    ...board,
    departures: board.departures.filter((flight) => flight.departureIcao === airport),
    arrivals: board.arrivals.filter((flight) => flight.arrivalIcao === airport),
  };
}

/** An aircraft type read from the address: as given by the simulator, trimmed. */
export function aircraftType(value: string | null | undefined): string | null {
  const type = (value ?? "").trim();
  return type.length > 0 && type.length <= 64 ? type : null;
}

/** Both boards cut to one aircraft type. Without a type, every flight. */
export function forAircraft(board: Boarding, type: string | null): Boarding {
  if (!type) return board;
  const same = (flight: BoardingFlight) => flight.aircraftType === type;
  return {
    ...board,
    departures: board.departures.filter(same),
    arrivals: board.arrivals.filter(same),
  };
}

/** The busiest airports (departures and arrivals together), most flights first, then by code. */
export function busiestAirports(board: Boarding, max = 3): { icao: string; count: number }[] {
  const counts = new Map<string, number>();
  const add = (icao: string | null) => icao && counts.set(icao, (counts.get(icao) ?? 0) + 1);
  for (const flight of board.departures) add(flight.departureIcao);
  for (const flight of board.arrivals) add(flight.arrivalIcao);
  return [...counts]
    .map(([icao, count]) => ({ icao, count }))
    .sort((a, b) => b.count - a.count || a.icao.localeCompare(b.icao))
    .slice(0, max);
}

/** Page `tick` of the rows (it wraps around), and how many pages there are. */
export function pageOf<T>(
  rows: readonly T[],
  tick: number,
  size = ROWS_PER_PAGE,
): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = ((tick % pages) + pages) % pages;
  return { rows: rows.slice(page * size, (page + 1) * size), page, pages };
}

/** Before take-off: the time shown is the start of the flight. */
const ON_STAND: ReadonlySet<BoardingStatus> = new Set(["boarding", "pushback", "taxi"]);

/** Time of a departure: take-off, or the start while still on the ground. */
export const departureTime = (flight: BoardingFlight): string =>
  ON_STAND.has(flight.status) ? flight.startedAt : (flight.takeoffAt ?? flight.startedAt);

/** Time of an arrival: touchdown once landed (actual), the estimate otherwise (null if unknown). */
export function arrivalTime(flight: BoardingFlight): { at: string | null; estimated: boolean } {
  if (flight.landedAt) return { at: flight.landedAt, estimated: false };
  return { at: flight.estimatedArrivalAt, estimated: true };
}

/** « 14:05 » in UTC, as on an airport board. */
export function utcTime(iso: string | null): string {
  return iso ? iso.slice(11, 16) : "--:--";
}

/** What the ticker under the boards says: busiest airport and softest recent touchdown. */
export function tickerFacts(board: Boarding): {
  busiest: { icao: string; count: number } | null;
  softest: { callsign: string; touchdownVs: number } | null;
} {
  const softest = board.arrivals
    .flatMap((flight) =>
      flight.touchdownVs === null
        ? []
        : [{ callsign: flight.callsign, touchdownVs: flight.touchdownVs }],
    )
    .sort((a, b) => Math.abs(a.touchdownVs) - Math.abs(b.touchdownVs))[0];
  return { busiest: busiestAirports(board, 1)[0] ?? null, softest: softest ?? null };
}

/** City of a time zone for the local clock: « Europe/Paris » → « Paris ». */
export function zoneCity(timeZone: string): string {
  return (timeZone.split("/").at(-1) ?? timeZone).replaceAll("_", " ");
}
