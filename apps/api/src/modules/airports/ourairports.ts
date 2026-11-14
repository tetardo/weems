import tzLookup from "@photostructure/tz-lookup";
import { AirportType } from "@weems/contrats";
import type { AirportRecord } from "./airport-record.ts";
import { integer, parseCsv, text } from "./csv.ts";

const CODE = /^[A-Z0-9]{3,4}$/;
const IATA = /^[A-Z0-9]{3}$/;
const COUNTRY = /^[A-Z]{2}$/;
/** Kind of place at the end of a name, dropped from the short name; « Regional », « Air Base » stay. */
const KIND = /\s+(international\s+)?(airport|airfield|aerodrome|airstrip)$/i;

/** « Charles de Gaulle International Airport » → « Charles de Gaulle »; the whole name if nothing is left. */
export function shortAirportName(name: string): string {
  return name.replace(KIND, "") || name;
}

const round = (degrees: number) => Math.round(degrees * 10_000) / 10_000;

interface Row {
  codes: string[];
  airport: Omit<AirportRecord, "icao">;
}

interface Names {
  regions: ReadonlyMap<string, string>;
  countries: ReadonlyMap<string, string>;
}

function rowsOf(airportsCsv: string, names: Names): Row[] {
  return parseCsv(airportsCsv).flatMap((get) => {
    const type = AirportType.safeParse(get("type"));
    const country = get("iso_country");
    const continent = get("continent");
    const lat = Number(get("latitude_deg"));
    const lon = Number(get("longitude_deg"));
    if (!type.success || !COUNTRY.test(country) || !COUNTRY.test(continent)) return [];
    const name = get("name");
    const region = get("iso_region");
    const iata = get("iata_code");
    const airport = {
      ident: get("ident"),
      name,
      shortName: shortAirportName(name),
      nameFr: null,
      cityEn: null,
      cityFr: null,
      iata: IATA.test(iata) ? iata : null,
      country,
      countryName: names.countries.get(country) ?? null,
      elevationFt: integer(get("elevation_ft")),
      timezone: tzLookup(lat, lon),
      lat: round(lat),
      lon: round(lon),
      type: type.data,
      continent,
      region,
      regionName: names.regions.get(region) ?? null,
      scheduledService: get("scheduled_service") === "yes",
      wikipediaLink: text(get("wikipedia_link")),
      homeLink: text(get("home_link")),
      keywords: get("keywords")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0),
    };
    return [{ codes: [airport.ident, get("icao_code"), get("gps_code")], airport }];
  });
}

/**
 * Airports of the OurAirports `airports.csv` file (with the names of `regions.csv` and
 * `countries.csv`), by the code
 * the pilot types in the tracker: the OurAirports identifier (the ICAO code when there is one)
 * first, then the ICAO and GPS codes when they differ and no other airport uses them as identifier.
 * Kept: open airports, seaplane bases and heliports.
 */
export function airportsFromOurAirports(
  airportsCsv: string,
  regionsCsv: string,
  countriesCsv: string,
): AirportRecord[] {
  const namesOf = (csv: string) => new Map(parseCsv(csv).map((row) => [row("code"), row("name")]));
  const rows = rowsOf(airportsCsv, {
    regions: namesOf(regionsCsv),
    countries: namesOf(countriesCsv),
  });
  const byCode = new Map<string, AirportRecord>();
  const add = (code: string | undefined, airport: Row["airport"]) => {
    if (code && CODE.test(code) && !byCode.has(code)) byCode.set(code, { icao: code, ...airport });
  };
  for (const { codes, airport } of rows) add(codes[0], airport);
  for (const { codes, airport } of rows) codes.slice(1).forEach((code) => add(code, airport));
  return [...byCode.values()].sort((a, b) => a.icao.localeCompare(b.icao));
}
