import { existsSync, readFileSync } from "node:fs";
import type { AirportRecord } from "./airport-record.ts";
import { formatCsv, parseCsv, text } from "./csv.ts";

/**
 * French names and served cities of airports, from Wikidata (CC0, decision 023), by ICAO code:
 * `apps/api/data/wikidata-names.csv`, made on the Mac by `pnpm airports:wikidata` (the cloud
 * environment cannot reach Wikidata). Optional: without it, the names are null.
 */
export const WIKIDATA_FILE = new URL("../../../data/wikidata-names.csv", import.meta.url);

export interface WikidataNames {
  nameFr: string | null;
  cityEn: string | null;
  cityFr: string | null;
}

/** Wikidata SPARQL query: every item with an ICAO code (P239), its French label and served city (P931). */
export const WIKIDATA_QUERY = `SELECT ?icao ?nameFr ?cityEn ?cityFr WHERE {
  ?airport wdt:P239 ?icao .
  OPTIONAL { ?airport rdfs:label ?nameFr FILTER(LANG(?nameFr) = "fr") }
  OPTIONAL {
    ?airport wdt:P931 ?city .
    OPTIONAL { ?city rdfs:label ?cityEn FILTER(LANG(?cityEn) = "en") }
    OPTIONAL { ?city rdfs:label ?cityFr FILTER(LANG(?cityFr) = "fr") }
  }
}`;

const ICAO = /^[A-Z0-9]{4}$/;

/** Names by ICAO code from the CSV answer of the query; the first line wins for a code. */
export function wikidataNames(sparqlCsv: string): Map<string, WikidataNames> {
  const names = new Map<string, WikidataNames>();
  for (const get of parseCsv(sparqlCsv)) {
    const icao = get("icao").trim().toUpperCase();
    if (!ICAO.test(icao) || names.has(icao)) continue;
    names.set(icao, {
      nameFr: text(get("nameFr")),
      cityEn: text(get("cityEn")),
      cityFr: text(get("cityFr")),
    });
  }
  return names;
}

export function formatWikidataFile(names: ReadonlyMap<string, WikidataNames>): string {
  const rows = [...names].sort(([a], [b]) => a.localeCompare(b));
  return formatCsv(
    ["icao", "nameFr", "cityEn", "cityFr"],
    rows.map(([icao, name]) => [icao, name.nameFr, name.cityEn, name.cityFr]),
  );
}

export function readWikidataFile(file: URL = WIKIDATA_FILE): Map<string, WikidataNames> {
  return existsSync(file) ? wikidataNames(readFileSync(file, "utf8")) : new Map();
}

/** The airports with their Wikidata names, found by ICAO code. */
export function withWikidataNames(
  airports: ReadonlyMap<string, AirportRecord>,
  names: ReadonlyMap<string, WikidataNames>,
): Map<string, AirportRecord> {
  return new Map(
    [...airports].map(([code, airport]) => [code, { ...airport, ...names.get(code) }]),
  );
}
