import { readFileSync } from "node:fs";
import type { AirportFrequency } from "@weems/contrats";
import { formatCsv, parseCsv } from "./csv.ts";
import type { FrequencyOf } from "./ourairports-frequencies.ts";

/**
 * Radio frequencies of the airport list, `apps/api/data/frequencies.csv` (decision 023): one per
 * line, by OurAirports identifier of the airport. Made by `pnpm airports:update`.
 */
export const FREQUENCIES_FILE = new URL("../../../data/frequencies.csv", import.meta.url);

const HEADER = ["airport", "type", "description", "mhz"];

export function formatFrequenciesFile(frequencies: readonly FrequencyOf[]): string {
  return formatCsv(
    HEADER,
    frequencies.map(({ airport, frequency }) => [
      airport,
      frequency.type,
      frequency.description,
      frequency.mhz,
    ]),
  );
}

/** Frequencies by OurAirports identifier of their airport. */
export function parseFrequenciesFile(csv: string): Map<string, AirportFrequency[]> {
  const frequencies = new Map<string, AirportFrequency[]>();
  for (const get of parseCsv(csv)) {
    const airport = get("airport");
    const frequency = {
      type: get("type"),
      description: get("description"),
      mhz: Number(get("mhz")),
    };
    frequencies.set(airport, [...(frequencies.get(airport) ?? []), frequency]);
  }
  return frequencies;
}

export const readFrequenciesFile = (
  file: URL = FREQUENCIES_FILE,
): Map<string, AirportFrequency[]> => parseFrequenciesFile(readFileSync(file, "utf8"));
