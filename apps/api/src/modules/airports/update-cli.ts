import { writeFileSync } from "node:fs";
import { AIRPORTS_FILE, formatAirportsFile } from "./airports-file.ts";
import { FREQUENCIES_FILE, formatFrequenciesFile } from "./frequencies-file.ts";
import { airportsFromOurAirports } from "./ourairports.ts";
import { frequenciesFromOurAirports } from "./ourairports-frequencies.ts";
import { runwaysFromOurAirports } from "./ourairports-runways.ts";
import { formatRunwaysFile, RUNWAYS_FILE } from "./runways-file.ts";

/**
 * `pnpm airports:update`: downloads the OurAirports lists (public domain) and rewrites
 * apps/api/data/airports.csv, runways.csv and frequencies.csv. Run it by hand from time to time
 * and commit the result: magnetic runway headings are worked out for today.
 */
const SOURCE = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main";

async function download(file: string): Promise<string> {
  const response = await fetch(`${SOURCE}/${file}`);
  if (!response.ok) throw new Error(`OurAirports ${file}: HTTP ${response.status}`);
  return response.text();
}

const [airportsCsv, regionsCsv, runwaysCsv, frequenciesCsv] = await Promise.all([
  download("airports.csv"),
  download("regions.csv"),
  download("runways.csv"),
  download("airport-frequencies.csv"),
]);
const airports = airportsFromOurAirports(airportsCsv, regionsCsv);
const idents = new Set(airports.map((airport) => airport.ident));
const runways = runwaysFromOurAirports(runwaysCsv, idents, new Date());
const frequencies = frequenciesFromOurAirports(frequenciesCsv, idents);
writeFileSync(AIRPORTS_FILE, formatAirportsFile(airports));
writeFileSync(RUNWAYS_FILE, formatRunwaysFile(runways));
writeFileSync(FREQUENCIES_FILE, formatFrequenciesFile(frequencies));
process.stdout.write(
  `${airports.length} airports, ${runways.length} runways, ${frequencies.length} frequencies written to ${AIRPORTS_FILE.pathname.replace(/[^/]+$/, "")}\n`,
);
