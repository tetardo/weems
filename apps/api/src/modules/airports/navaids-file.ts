import { readFileSync } from "node:fs";
import { type Navaid, NavaidType } from "@weems/contrats";
import { type CsvRow, decimal, formatCsv, integer, parseCsv, text } from "./csv.ts";

/**
 * Radio aids, `apps/api/data/navaids.csv` (decision 023): one per line, the paired DME on the
 * same line. Made by `pnpm airports:update`.
 */
export const NAVAIDS_FILE = new URL("../../../data/navaids.csv", import.meta.url);

const HEADER = [
  "ident",
  "name",
  "type",
  "frequencyKhz",
  "lat",
  "lon",
  "elevationFt",
  "country",
  "dme.frequencyKhz",
  "dme.channel",
  "dme.lat",
  "dme.lon",
  "dme.elevationFt",
  "slavedVariationDeg",
  "magneticVariationDeg",
  "usage",
  "power",
  "airport",
];

const dmeCells = (dme: Navaid["dme"]) =>
  dme
    ? [dme.frequencyKhz, dme.channel, dme.lat, dme.lon, dme.elevationFt]
    : [null, null, null, null, null];

export function formatNavaidsFile(navaids: readonly Navaid[]): string {
  return formatCsv(
    HEADER,
    navaids.map((navaid) => [
      navaid.ident,
      navaid.name,
      navaid.type,
      navaid.frequencyKhz,
      navaid.lat,
      navaid.lon,
      navaid.elevationFt,
      navaid.country,
      ...dmeCells(navaid.dme),
      navaid.slavedVariationDeg,
      navaid.magneticVariationDeg,
      navaid.usage,
      navaid.power,
      navaid.airport,
    ]),
  );
}

function dmeOf(get: CsvRow): Navaid["dme"] {
  const frequencyKhz = decimal(get("dme.frequencyKhz"));
  const channel = text(get("dme.channel"));
  if (frequencyKhz === null && channel === null) return null;
  return {
    frequencyKhz,
    channel,
    lat: decimal(get("dme.lat")),
    lon: decimal(get("dme.lon")),
    elevationFt: integer(get("dme.elevationFt")),
  };
}

export function parseNavaidsFile(csv: string): Navaid[] {
  return parseCsv(csv).map((get) => ({
    ident: get("ident"),
    name: get("name"),
    type: NavaidType.parse(get("type")),
    frequencyKhz: decimal(get("frequencyKhz")),
    lat: Number(get("lat")),
    lon: Number(get("lon")),
    elevationFt: integer(get("elevationFt")),
    country: get("country"),
    dme: dmeOf(get),
    slavedVariationDeg: decimal(get("slavedVariationDeg")),
    magneticVariationDeg: decimal(get("magneticVariationDeg")),
    usage: text(get("usage")),
    power: text(get("power")),
    airport: text(get("airport")),
  }));
}

export const readNavaidsFile = (file: URL = NAVAIDS_FILE): Navaid[] =>
  parseNavaidsFile(readFileSync(file, "utf8"));
