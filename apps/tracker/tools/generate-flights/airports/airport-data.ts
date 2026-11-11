import data from "./airports.json" with { type: "json" };

/** One usable runway direction: where it starts and where it points (true heading). */
export interface RunwayEnd {
  ident: string;
  /** Threshold. */
  lat: number;
  lon: number;
  headingDeg: number;
  lengthFt: number;
  elevationFt: number;
  /** Landing starts this far past the runway end. */
  displacedThresholdFt: number;
}

export interface AirportData {
  icao: string;
  name: string;
  /** Airport reference point: where simulated aircraft park. */
  lat: number;
  lon: number;
  elevationFt: number;
  runways: RunwayEnd[];
}

/** Frozen extract of OurAirports (public domain), rewritten by `pnpm airports:simulated`. */
export const SIMULATED_AIRPORTS: readonly AirportData[] = data.airports;

const byIcao = new Map(SIMULATED_AIRPORTS.map((airport) => [airport.icao, airport]));

export function airportOf(icao: string): AirportData {
  const airport = byIcao.get(icao);
  if (!airport)
    throw new Error(`Airport ${icao} is not in airports.json (pnpm airports:simulated)`);
  return airport;
}
