import type { Runway, RunwayEnd } from "@weems/contrats";
import { decimal, integer, parseCsv, type CsvRow, text } from "./csv.ts";
import { declination } from "./declination.ts";

/** A runway and the OurAirports identifier of its airport. */
export interface RunwayOf {
  airport: string;
  runway: Runway;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Heading from magnetic north, 0 to 360, from the true heading and the declination at the threshold. */
function magneticHeading(end: Omit<RunwayEnd, "headingMagneticDeg">, when: Date): number | null {
  if (end.headingTrueDeg === null || end.lat === null || end.lon === null) return null;
  const variation = declination(end.lat, end.lon, end.elevationFt ?? 0, when);
  return round1((((end.headingTrueDeg - variation) % 360) + 360) % 360);
}

function endOf(get: CsvRow, side: "le" | "he", when: Date): RunwayEnd | null {
  const ident = get(`${side}_ident`);
  if (!ident) return null;
  const end = {
    ident,
    lat: decimal(get(`${side}_latitude_deg`)),
    lon: decimal(get(`${side}_longitude_deg`)),
    elevationFt: integer(get(`${side}_elevation_ft`)),
    headingTrueDeg: decimal(get(`${side}_heading_degT`)),
    displacedThresholdFt: integer(get(`${side}_displaced_threshold_ft`)),
  };
  return { ...end, headingMagneticDeg: magneticHeading(end, when) };
}

/**
 * Runways of the OurAirports `runways.csv` file for the airports kept (by OurAirports identifier).
 * Magnetic headings are worked out for `when` (World Magnetic Model 2025-2030).
 */
export function runwaysFromOurAirports(
  csv: string,
  airports: ReadonlySet<string>,
  when: Date,
): RunwayOf[] {
  return parseCsv(csv).flatMap((get) => {
    const airport = get("airport_ident");
    if (!airports.has(airport)) return [];
    const ends = [endOf(get, "le", when), endOf(get, "he", when)].filter((end) => end !== null);
    const runway: Runway = {
      lengthFt: integer(get("length_ft")),
      widthFt: integer(get("width_ft")),
      surface: text(get("surface")),
      lighted: get("lighted") === "1",
      closed: get("closed") === "1",
      ends,
    };
    return [{ airport, runway }];
  });
}
