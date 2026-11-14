import type { Airport } from "@weems/contrats";

/** An airport for tests: the fields a test does not care about get plain values. */
export function testAirport(icao: string, name: string, lat: number, lon: number): Airport {
  return {
    icao,
    name,
    shortName: name,
    iata: null,
    country: "FR",
    elevationFt: 0,
    timezone: "Europe/Paris",
    lat,
    lon,
  };
}
