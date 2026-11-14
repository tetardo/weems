import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import {
  formatWikidataFile,
  ICAO_LETTERS,
  WIKIDATA_FILE,
  type WikidataNames,
  wikidataNames,
  wikidataQuery,
} from "./wikidata-names.ts";

/**
 * `pnpm airports:wikidata`: asks Wikidata (CC0) the French names and served cities of the airports,
 * one ICAO first letter at a time, and rewrites apps/api/data/wikidata-names.csv. Run it on the Mac
 * from time to time, then commit.
 */
const ATTEMPTS = 3;

async function ask(letter: string): Promise<string> {
  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", wikidataQuery(letter));
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: "text/csv",
        // Wikidata asks every client to name itself (no personal data: the public repository).
        "user-agent": "WeemsAirportNames/1.0 (https://github.com/tetardo/weems)",
      },
    });
    if (response.ok) return response.text();
    if (attempt === ATTEMPTS || response.status < 500) {
      throw new Error(`Wikidata, letter ${letter}: HTTP ${response.status}`);
    }
    await sleep(5_000 * attempt);
  }
}

const names = new Map<string, WikidataNames>();
for (const letter of ICAO_LETTERS) {
  const found = wikidataNames(await ask(letter));
  found.forEach((name, icao) => names.set(icao, name));
  process.stdout.write(`${letter}: ${found.size}\n`);
  await sleep(1_000); // polite pace: Wikidata limits each client
}
writeFileSync(WIKIDATA_FILE, formatWikidataFile(names));
process.stdout.write(`${names.size} airports named, written to ${WIKIDATA_FILE.pathname}\n`);
