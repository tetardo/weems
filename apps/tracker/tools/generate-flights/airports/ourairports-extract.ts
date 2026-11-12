import type { AirportData, RunwayEnd } from "./airport-data.ts";

/** Runways an airliner of the simulated fleet can use. */
const MIN_LENGTH_FT = 7000;
const SOFT_SURFACES = /GRASS|TURF|GRV|GRAVEL|DIRT|WATER|SNOW/i;

type Row = Record<string, string>;

/** CSV text to rows keyed by header (OurAirports: quoted fields, no line breaks inside). */
export function parseCsv(text: string): Row[] {
  const [header = "", ...lines] = text.split(/\r?\n/).filter(Boolean);
  const cells = (line: string) =>
    [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)]
      .slice(0, -1)
      .map(([, cell = ""]) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
  const names = cells(header);
  return lines.map((line) => {
    const values = cells(line);
    return Object.fromEntries(names.map((name, i) => [name, values[i] ?? ""]));
  });
}

const round = (value: number, digits: number) => Number(value.toFixed(digits));

function runwayEnd(
  row: Row,
  end: "le" | "he",
  other: "le" | "he",
  airportElevationFt: number,
): RunwayEnd | null {
  const lat = Number(row[`${end}_latitude_deg`]);
  const lon = Number(row[`${end}_longitude_deg`]);
  const heading = row[`${end}_heading_degT`];
  if (!row[`${end}_latitude_deg`] || !row[`${other}_latitude_deg`] || !heading) return null;
  return {
    ident: row[`${end}_ident`] ?? "",
    lat: round(lat, 6),
    lon: round(lon, 6),
    headingDeg: Number(heading),
    lengthFt: Number(row["length_ft"]),
    elevationFt: Number(row[`${end}_elevation_ft`] || airportElevationFt),
    displacedThresholdFt: Number(row[`${end}_displaced_threshold_ft`] || 0),
  };
}

function usable(row: Row): boolean {
  return (
    row["closed"] === "0" &&
    Number(row["length_ft"]) >= MIN_LENGTH_FT &&
    !SOFT_SURFACES.test(row["surface"] ?? "")
  );
}

/** Airports of `icaos` with their usable runway ends, from the OurAirports CSV files. */
export function extractAirports(
  icaos: readonly string[],
  airportsCsv: string,
  runwaysCsv: string,
): AirportData[] {
  const wanted = new Set(icaos);
  const runways = parseCsv(runwaysCsv).filter((r) => wanted.has(r["airport_ident"] ?? ""));
  return parseCsv(airportsCsv)
    .filter((a) => wanted.has(a["ident"] ?? ""))
    .map((a) => {
      const elevationFt = Number(a["elevation_ft"] || 0);
      const ends = (r: Row) => [
        runwayEnd(r, "le", "he", elevationFt),
        runwayEnd(r, "he", "le", elevationFt),
      ];
      return {
        icao: a["ident"] ?? "",
        name: a["name"] ?? "",
        lat: round(Number(a["latitude_deg"]), 6),
        lon: round(Number(a["longitude_deg"]), 6),
        elevationFt,
        runways: runways
          .filter((r) => r["airport_ident"] === a["ident"] && usable(r))
          .flatMap(ends)
          .filter((end): end is RunwayEnd => end !== null),
      };
    })
    .sort((a, b) => a.icao.localeCompare(b.icao));
}
