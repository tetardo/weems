import { readFileSync } from "node:fs";
import { AirportType } from "@weems/contrats";
import type { AirportRecord } from "./airport-record.ts";
import { formatCsv, integer, parseCsv, text } from "./csv.ts";
import { shortAirportName } from "./ourairports.ts";

/**
 * The API's airport list, `apps/api/data/airports.csv` (decisions 005 and 023): one airport per
 * line. Made by `pnpm airports:update`. The short name is not stored: it is worked out from the
 * name when the file is read. Wikidata names come from their own file (`wikidata-names.ts`).
 */
export const AIRPORTS_FILE = new URL("../../../data/airports.csv", import.meta.url);

const HEADER = [
  "icao",
  "ident",
  "lat",
  "lon",
  "elevationFt",
  "iata",
  "country",
  "countryName",
  "timezone",
  "type",
  "continent",
  "region",
  "regionName",
  "scheduledService",
  "name",
  "wikipediaLink",
  "homeLink",
  "keywords",
];

export function formatAirportsFile(airports: readonly AirportRecord[]): string {
  return formatCsv(
    HEADER,
    airports.map((airport) => [
      airport.icao,
      airport.ident,
      airport.lat,
      airport.lon,
      airport.elevationFt,
      airport.iata,
      airport.country,
      airport.countryName,
      airport.timezone,
      airport.type,
      airport.continent,
      airport.region,
      airport.regionName,
      airport.scheduledService,
      airport.name,
      airport.wikipediaLink,
      airport.homeLink,
      airport.keywords.join(", "),
    ]),
  );
}

export function parseAirportsFile(csv: string): Map<string, AirportRecord> {
  const airports = new Map<string, AirportRecord>();
  for (const get of parseCsv(csv)) {
    const name = get("name");
    const airport: AirportRecord = {
      icao: get("icao"),
      ident: get("ident"),
      lat: Number(get("lat")),
      lon: Number(get("lon")),
      elevationFt: integer(get("elevationFt")),
      iata: text(get("iata")),
      country: get("country"),
      countryName: text(get("countryName")),
      timezone: get("timezone"),
      type: AirportType.parse(get("type")),
      continent: get("continent"),
      region: get("region"),
      regionName: text(get("regionName")),
      scheduledService: get("scheduledService") === "1",
      name,
      shortName: shortAirportName(name),
      nameFr: null,
      cityEn: null,
      cityFr: null,
      wikipediaLink: text(get("wikipediaLink")),
      homeLink: text(get("homeLink")),
      keywords: get("keywords")
        .split(", ")
        .filter((keyword) => keyword.length > 0),
    };
    airports.set(airport.icao, airport);
  }
  return airports;
}

export const readAirportsFile = (file: URL = AIRPORTS_FILE): Map<string, AirportRecord> =>
  parseAirportsFile(readFileSync(file, "utf8"));
