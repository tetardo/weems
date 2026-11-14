import type { Airport, AirportDetail, AirportFrequency, Runway } from "@weems/contrats";
import { notFound } from "../../plugins/problem.ts";
import type { AirportRecord } from "./airport-record.ts";

/** What the service is built from: the three data files, read at start-up (decisions 005 and 023). */
export interface AirportData {
  airports: ReadonlyMap<string, AirportRecord>;
  /** By OurAirports identifier. */
  runways: ReadonlyMap<string, readonly Runway[]>;
  /** By OurAirports identifier. */
  frequencies: ReadonlyMap<string, readonly AirportFrequency[]>;
}

const summary = (airport: AirportRecord): Airport => ({
  icao: airport.icao,
  name: airport.name,
  shortName: airport.shortName,
  iata: airport.iata,
  country: airport.country,
  elevationFt: airport.elevationFt,
  timezone: airport.timezone,
  lat: airport.lat,
  lon: airport.lon,
});

/** Airports by code, from the lists loaded at start-up. No database: it is reference data. */
export class AirportsService {
  private readonly data: AirportData;

  constructor(data: AirportData) {
    this.data = data;
  }

  private record(icao: string | null): AirportRecord | null {
    return (icao && this.data.airports.get(icao.toUpperCase())) || null;
  }

  /** null when the code is unknown or absent: the route is then drawn without that airport. */
  find(icao: string | null): Airport | null {
    const airport = this.record(icao);
    return airport && summary(airport);
  }

  /** The airports among `codes` that are in the list, in the same order; unknown codes are left out. */
  findAll(codes: readonly string[]): Airport[] {
    return codes.flatMap((code) => this.find(code) ?? []);
  }

  /** Everything known about one airport, runways and frequencies included; 404 when unknown. */
  detail(icao: string): AirportDetail {
    const record = this.record(icao);
    if (!record) throw notFound(`Unknown airport ${icao}`);
    const { ident, ...airport } = record;
    return {
      ...airport,
      runways: [...(this.data.runways.get(ident) ?? [])],
      frequencies: [...(this.data.frequencies.get(ident) ?? [])],
    };
  }
}
