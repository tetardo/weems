import type { Airport } from "@weems/contrats";

/** Kinds of OurAirports places kept: everything a simulator pilot can take off from. */
const KEPT_TYPES = new Set([
  "large_airport",
  "medium_airport",
  "small_airport",
  "seaplane_base",
  "heliport",
]);
const CODE = /^[A-Z0-9]{3,4}$/;

/** Fields of one CSV line, with "quoted, values" and "" escapes (RFC 4180, no line breaks in fields). */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted && char === '"' && line[i + 1] === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else field += char;
  }
  fields.push(field);
  return fields;
}

const round = (degrees: number) => Math.round(degrees * 10_000) / 10_000;

interface Row {
  codes: string[];
  place: Omit<Airport, "icao">;
}

function rowsOf(csv: string): Row[] {
  const [header = "", ...lines] = csv.split(/\r?\n/).filter((line) => line.length > 0);
  const column = new Map(splitCsvLine(header).map((name, index) => [name, index]));
  return lines.flatMap((line) => {
    const fields = splitCsvLine(line);
    const get = (name: string) => fields[column.get(name) ?? -1] ?? "";
    if (!KEPT_TYPES.has(get("type"))) return [];
    const place = {
      name: get("name"),
      lat: round(Number(get("latitude_deg"))),
      lon: round(Number(get("longitude_deg"))),
    };
    return [{ codes: [get("ident"), get("icao_code"), get("gps_code")], place }];
  });
}

/**
 * Airports of the OurAirports `airports.csv` file, by the code the pilot types in the tracker:
 * the OurAirports identifier (the ICAO code when there is one) first, then the ICAO and GPS codes
 * when they differ and no other airport uses them as identifier.
 */
export function airportsFromOurAirports(csv: string): Airport[] {
  const rows = rowsOf(csv);
  const byCode = new Map<string, Airport>();
  const add = (code: string | undefined, place: Row["place"]) => {
    if (code && CODE.test(code) && !byCode.has(code)) byCode.set(code, { icao: code, ...place });
  };
  for (const { codes, place } of rows) add(codes[0], place);
  for (const { codes, place } of rows) codes.slice(1).forEach((code) => add(code, place));
  return [...byCode.values()].sort((a, b) => a.icao.localeCompare(b.icao));
}
