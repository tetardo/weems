import { writeFileSync } from "node:fs";
import {
  formatWikidataFile,
  WIKIDATA_FILE,
  WIKIDATA_QUERY,
  wikidataNames,
} from "./wikidata-names.ts";

/**
 * `pnpm airports:wikidata`: asks Wikidata (CC0) the French names and served cities of the airports
 * and rewrites apps/api/data/wikidata-names.csv. Run it on the Mac from time to time, then commit.
 */
const url = new URL("https://query.wikidata.org/sparql");
url.searchParams.set("query", WIKIDATA_QUERY);
const response = await fetch(url, {
  headers: {
    accept: "text/csv",
    // Wikidata asks every client to name itself (no personal data: the public repository).
    "user-agent": "WeemsAirportNames/1.0 (https://github.com/tetardo/weems)",
  },
});
if (!response.ok) throw new Error(`Wikidata: HTTP ${response.status}`);
const names = wikidataNames(await response.text());
writeFileSync(WIKIDATA_FILE, formatWikidataFile(names));
process.stdout.write(`${names.size} airports named, written to ${WIKIDATA_FILE.pathname}\n`);
