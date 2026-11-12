import { type Airport, MAX_AIRPORT_CODES } from "@weems/contrats";
import type { LiveFlights } from "./flights-store.ts";

/** Airports known in the browser; null once the API said it does not know the code. */
export type Airports = ReadonlyMap<string, Airport | null>;

/** Codes of the flights' airports not asked yet, in batches the API accepts. */
export function missingCodes(flights: LiveFlights, known: Airports): string[][] {
  const missing = new Set<string>();
  for (const flight of flights.values()) {
    for (const code of [flight.departureIcao, flight.plannedArrivalIcao]) {
      if (code && !known.has(code)) missing.add(code);
    }
  }
  const codes = [...missing];
  return Array.from({ length: Math.ceil(codes.length / MAX_AIRPORT_CODES) }, (_, i) =>
    codes.slice(i * MAX_AIRPORT_CODES, (i + 1) * MAX_AIRPORT_CODES),
  );
}

/** `known` plus the answer for `asked`: codes the API did not return are remembered as unknown. */
export function withAnswer(
  known: Airports,
  asked: readonly string[],
  found: readonly Airport[],
): Airports {
  const next = new Map(known);
  for (const code of asked) next.set(code, null);
  for (const airport of found) next.set(airport.icao, airport);
  return next;
}
