import { readAirportsFile } from "./airports-file.ts";
import { readFrequenciesFile } from "./frequencies-file.ts";
import { readRunwaysFile } from "./runways-file.ts";
import type { AirportData } from "./service.ts";

/** The three data files of `apps/api/data`, read at start-up. */
export const readAirportData = (): AirportData => ({
  airports: readAirportsFile(),
  runways: readRunwaysFile(),
  frequencies: readFrequenciesFile(),
});
