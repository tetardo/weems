import type { FeatureCollection, Point } from "geojson";
import type { Airports } from "./airport-book.ts";
import type { LiveFlights } from "./flights-store.ts";

/**
 * Airports of the flights on the map, with how many leave or go there now: the busiest are
 * labelled first (« EHAM 4 »). An airport the API does not know is left out.
 */
export function activeAirports(flights: LiveFlights, airports: Airports): FeatureCollection<Point> {
  const counts = new Map<string, number>();
  for (const flight of flights.values()) {
    for (const code of new Set([flight.departureIcao, flight.plannedArrivalIcao])) {
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
  }
  const features = [...counts].flatMap(([icao, count]) => {
    const airport = airports.get(icao);
    if (!airport) return [];
    return [
      {
        type: "Feature" as const,
        properties: { icao, count },
        geometry: { type: "Point" as const, coordinates: [airport.lon, airport.lat] },
      },
    ];
  });
  return { type: "FeatureCollection", features };
}
