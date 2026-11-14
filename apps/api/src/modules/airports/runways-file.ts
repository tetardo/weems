import { readFileSync } from "node:fs";
import type { Runway, RunwayEnd } from "@weems/contrats";
import { decimal, formatCsv, integer, parseCsv, type CsvRow, text } from "./csv.ts";
import type { RunwayOf } from "./ourairports-runways.ts";

/**
 * Runways of the airport list, `apps/api/data/runways.csv` (decision 023): one runway per line,
 * by OurAirports identifier of its airport, its two ends side by side. Made by `pnpm airports:update`.
 */
export const RUNWAYS_FILE = new URL("../../../data/runways.csv", import.meta.url);

const END_COLUMNS = [
  "ident",
  "lat",
  "lon",
  "elevationFt",
  "headingTrueDeg",
  "headingMagneticDeg",
  "displacedThresholdFt",
] as const;
const SIDES = ["a", "b"] as const;
const HEADER = [
  "airport",
  "lengthFt",
  "widthFt",
  "surface",
  "lighted",
  "closed",
  ...SIDES.flatMap((side) => END_COLUMNS.map((column) => `${side}.${column}`)),
];

const endCells = (end: RunwayEnd | undefined) =>
  END_COLUMNS.map((column) => (end ? end[column] : null));

export function formatRunwaysFile(runways: readonly RunwayOf[]): string {
  return formatCsv(
    HEADER,
    runways.map(({ airport, runway }) => [
      airport,
      runway.lengthFt,
      runway.widthFt,
      runway.surface,
      runway.lighted,
      runway.closed,
      ...endCells(runway.ends[0]),
      ...endCells(runway.ends[1]),
    ]),
  );
}

function endOf(get: CsvRow, side: (typeof SIDES)[number]): RunwayEnd | null {
  const ident = get(`${side}.ident`);
  if (!ident) return null;
  return {
    ident,
    lat: decimal(get(`${side}.lat`)),
    lon: decimal(get(`${side}.lon`)),
    elevationFt: integer(get(`${side}.elevationFt`)),
    headingTrueDeg: decimal(get(`${side}.headingTrueDeg`)),
    headingMagneticDeg: decimal(get(`${side}.headingMagneticDeg`)),
    displacedThresholdFt: integer(get(`${side}.displacedThresholdFt`)),
  };
}

/** Runways by OurAirports identifier of their airport. */
export function parseRunwaysFile(csv: string): Map<string, Runway[]> {
  const runways = new Map<string, Runway[]>();
  for (const get of parseCsv(csv)) {
    const airport = get("airport");
    const runway: Runway = {
      lengthFt: integer(get("lengthFt")),
      widthFt: integer(get("widthFt")),
      surface: text(get("surface")),
      lighted: get("lighted") === "1",
      closed: get("closed") === "1",
      ends: SIDES.map((side) => endOf(get, side)).filter((end) => end !== null),
    };
    runways.set(airport, [...(runways.get(airport) ?? []), runway]);
  }
  return runways;
}

export const readRunwaysFile = (file: URL = RUNWAYS_FILE): Map<string, Runway[]> =>
  parseRunwaysFile(readFileSync(file, "utf8"));
