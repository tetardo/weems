import type { Airport } from "@weems/contrats";

/** Airports by code, from the list loaded at start-up (decision 005). No database: it is reference data. */
export class AirportsService {
  private readonly airports: ReadonlyMap<string, Airport>;

  constructor(airports: ReadonlyMap<string, Airport>) {
    this.airports = airports;
  }

  /** null when the code is unknown or absent: the route is then drawn without that airport. */
  find(icao: string | null): Airport | null {
    return (icao && this.airports.get(icao.toUpperCase())) || null;
  }

  /** The airports among `codes` that are in the list, in the same order; unknown codes are left out. */
  findAll(codes: readonly string[]): Airport[] {
    return codes.flatMap((code) => this.find(code) ?? []);
  }
}
