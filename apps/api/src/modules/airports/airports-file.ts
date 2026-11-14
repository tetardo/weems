import { readFileSync } from "node:fs";
import type { Airport } from "@weems/contrats";
import { shortAirportName, splitCsvLine } from "./ourairports.ts";

/**
 * The API's airport list, `apps/api/data/airports.csv` (decisions 005 and 023): one airport per
 * line, CSV with "quoted" fields when they hold a comma or a quote. Made by `pnpm airports:update`.
 * The short name is not stored: it is worked out from the name when the file is read.
 */
export const AIRPORTS_FILE = new URL("../../../data/airports.csv", import.meta.url);

const HEADER = "icao,lat,lon,elevationFt,iata,country,name";

const quoted = (text: string) => (/[",]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);

export function formatAirportsFile(airports: readonly Airport[]): string {
  const lines = airports.map((airport) =>
    [
      airport.icao,
      airport.lat,
      airport.lon,
      airport.elevationFt ?? "",
      airport.iata ?? "",
      airport.country,
      quoted(airport.name),
    ].join(","),
  );
  return `${[HEADER, ...lines].join("\n")}\n`;
}

export function parseAirportsFile(text: string): Map<string, Airport> {
  const airports = new Map<string, Airport>();
  for (const line of text.split("\n").slice(1)) {
    const [icao, lat, lon, elevation, iata, country, name] = splitCsvLine(line);
    if (icao && lat && lon && country && name !== undefined) {
      airports.set(icao, {
        icao,
        lat: Number(lat),
        lon: Number(lon),
        elevationFt: elevation ? Number(elevation) : null,
        iata: iata || null,
        country,
        shortName: shortAirportName(name),
        name,
      });
    }
  }
  return airports;
}

export const readAirportsFile = (file: URL = AIRPORTS_FILE): Map<string, Airport> =>
  parseAirportsFile(readFileSync(file, "utf8"));
