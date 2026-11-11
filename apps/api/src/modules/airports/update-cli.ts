import { writeFileSync } from "node:fs";
import { AIRPORTS_FILE, formatAirportsFile } from "./airports-file.ts";
import { airportsFromOurAirports } from "./ourairports.ts";

/**
 * `pnpm airports:update`: downloads the OurAirports list (public domain) and rewrites
 * apps/api/data/airports.csv. Run it by hand from time to time and commit the result.
 */
const SOURCE =
  "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`OurAirports download failed: HTTP ${response.status}`);
const airports = airportsFromOurAirports(await response.text());
writeFileSync(AIRPORTS_FILE, formatAirportsFile(airports));
process.stdout.write(`${airports.length} airports written to ${AIRPORTS_FILE.pathname}\n`);
