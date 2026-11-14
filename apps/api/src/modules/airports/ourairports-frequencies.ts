import type { AirportFrequency } from "@weems/contrats";
import { parseCsv } from "./csv.ts";

/** A radio frequency and the OurAirports identifier of its airport. */
export interface FrequencyOf {
  airport: string;
  frequency: AirportFrequency;
}

/** Frequencies of the OurAirports `airport-frequencies.csv` file for the airports kept. */
export function frequenciesFromOurAirports(
  csv: string,
  airports: ReadonlySet<string>,
): FrequencyOf[] {
  return parseCsv(csv).flatMap((get) => {
    const airport = get("airport_ident");
    const mhz = Number(get("frequency_mhz"));
    if (!airports.has(airport) || !(mhz > 0)) return [];
    const type = get("type");
    return [{ airport, frequency: { type, description: get("description") || type, mhz } }];
  });
}
