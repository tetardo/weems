import type { Feature, FeatureCollection, LineString } from "geojson";
import type { Airports } from "./airport-book.ts";
import type { LiveFlights } from "./flights-store.ts";
import { greatCircle } from "./great-circle.ts";

/** Coarser than the selected route: 500 flights stay around 10 000 points. */
const STEP_NM = 100;

const line = (kind: string, coordinates: [number, number][]): Feature<LineString> => ({
  type: "Feature",
  properties: { kind },
  geometry: { type: "LineString", coordinates },
});

/**
 * Route of every flight but the selected one (which has its real trail): great circle from the
 * departure to the aircraft ("flown", a straight approximation of the real path) and from the
 * aircraft to the arrival ("ahead"). An airport that is unknown leaves out its half.
 * Recomputed at each position batch (2 s), not at each frame.
 */
export function allRouteLines(
  flights: LiveFlights,
  airports: Airports,
  selectedId: string | null,
): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (const flight of flights.values()) {
    if (flight.flightId === selectedId) continue;
    const aircraft = flight.position;
    const departure = flight.departureIcao ? airports.get(flight.departureIcao) : null;
    const arrival = flight.plannedArrivalIcao ? airports.get(flight.plannedArrivalIcao) : null;
    if (departure) {
      const flown = greatCircle(aircraft, departure, STEP_NM).reverse();
      features.push(line("flown", flown));
    }
    if (arrival) features.push(line("ahead", greatCircle(aircraft, arrival, STEP_NM)));
  }
  return { type: "FeatureCollection", features };
}
