import { readFileSync } from "node:fs";
import type { Airport } from "@weems/contrats";

/**
 * The API's airport list, `apps/api/data/airports.csv` (decision 005): one airport per line,
 * `icao,lat,lon,name`, the name last so that it may contain commas. Made by `pnpm airports:update`.
 */
export const AIRPORTS_FILE = new URL("../../../data/airports.csv", import.meta.url);

const HEADER = "icao,lat,lon,name";

export function formatAirportsFile(airports: readonly Airport[]): string {
  const lines = airports.map(({ icao, lat, lon, name }) => `${icao},${lat},${lon},${name}`);
  return `${[HEADER, ...lines].join("\n")}\n`;
}

export function parseAirportsFile(text: string): Map<string, Airport> {
  const airports = new Map<string, Airport>();
  for (const line of text.split("\n").slice(1)) {
    const [icao, lat, lon, ...name] = line.split(",");
    if (icao && lat && lon) {
      airports.set(icao, { icao, lat: Number(lat), lon: Number(lon), name: name.join(",") });
    }
  }
  return airports;
}

export const readAirportsFile = (file: URL = AIRPORTS_FILE): Map<string, Airport> =>
  parseAirportsFile(readFileSync(file, "utf8"));
