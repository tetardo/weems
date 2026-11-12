import type { LiveFlight } from "@weems/contrats";
import type { Feature, FeatureCollection, LineString } from "geojson";
import type { Airports } from "./airport-book.ts";
import type { LiveFlights } from "./flights-store.ts";
import { greatCircle } from "./great-circle.ts";

/** Coarser than the selected route: 500 flights stay around 10 000 points. */
const STEP_NM = 100;

const line = (
  flightId: string,
  kind: string,
  coordinates: [number, number][],
): Feature<LineString> => ({
  type: "Feature",
  properties: { flightId, kind },
  geometry: { type: "LineString", coordinates },
});

/**
 * Great circle from the departure to the aircraft ("flown", a straight approximation of the real
 * path) and from the aircraft to the arrival ("ahead"). An unknown airport leaves out its half.
 */
export function routeLinesOf(flight: LiveFlight, airports: Airports): Feature<LineString>[] {
  const aircraft = flight.position;
  const departure = flight.departureIcao ? airports.get(flight.departureIcao) : null;
  const arrival = flight.plannedArrivalIcao ? airports.get(flight.plannedArrivalIcao) : null;
  const lines: Feature<LineString>[] = [];
  const { flightId } = flight;
  if (departure) {
    lines.push(line(flightId, "flown", greatCircle(aircraft, departure, STEP_NM).reverse()));
  }
  if (arrival) lines.push(line(flightId, "ahead", greatCircle(aircraft, arrival, STEP_NM)));
  return lines;
}

/**
 * Route of every flight but the selected one (which has its real trail), as routeLinesOf.
 * Recomputed at each position batch (2 s), not at each frame.
 */
export function allRouteLines(
  flights: LiveFlights,
  airports: Airports,
  selectedId: string | null,
): FeatureCollection<LineString> {
  const features = [...flights.values()]
    .filter((flight) => flight.flightId !== selectedId)
    .flatMap((flight) => routeLinesOf(flight, airports));
  return { type: "FeatureCollection", features };
}
