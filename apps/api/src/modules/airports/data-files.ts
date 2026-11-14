import { readAirportsFile } from "./airports-file.ts";
import { readFrequenciesFile } from "./frequencies-file.ts";
import { readNavaidsFile } from "./navaids-file.ts";
import { NavaidsService } from "./navaids-service.ts";
import { readRunwaysFile } from "./runways-file.ts";
import { type AirportData, AirportsService } from "./service.ts";
import { readWikidataFile, withWikidataNames } from "./wikidata-names.ts";

/** The data files of `apps/api/data`, read at start-up. */
const readAirportData = (): AirportData => ({
  airports: withWikidataNames(readAirportsFile(), readWikidataFile()),
  runways: readRunwaysFile(),
  frequencies: readFrequenciesFile(),
  navaids: readNavaidsFile(),
});

/** The services of the module, built from the data files once at start-up. */
export function loadAirportServices(): { airports: AirportsService; navaids: NavaidsService } {
  const data = readAirportData();
  return { airports: new AirportsService(data), navaids: new NavaidsService(data.navaids) };
}
