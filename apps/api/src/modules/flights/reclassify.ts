import { isDeepStrictEqual } from "node:util";
import { classifyAircraft } from "../aircraft/classify.ts";
import type { FlightsRepository } from "./repository.ts";

/**
 * Classifies every flight again with the current catalogue, after it changed (`pnpm reclassify`).
 * Returns how many flights changed category.
 */
export async function reclassifyFlights(repository: FlightsRepository): Promise<number> {
  let changed = 0;
  for (const flight of await repository.allFlights()) {
    const aircraftClass = classifyAircraft(flight.aircraft);
    if (isDeepStrictEqual(aircraftClass, flight.aircraftClass)) continue;
    await repository.setAircraftClass(flight.flightId, aircraftClass);
    changed += 1;
  }
  return changed;
}
