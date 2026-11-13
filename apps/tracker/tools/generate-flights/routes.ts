import { distanceBetweenNm } from "@weems/contrats";
import type { AircraftInfo } from "@weems/contrats";
import { type AirportData, SIMULATED_AIRPORTS } from "./airports/airport-data.ts";
import type { SimulatedType } from "./aircraft-types.ts";
import type { Disturbance, Scenario } from "./scenario.ts";

const longestRunwayFt = (airport: AirportData) =>
  Math.max(...airport.runways.map((runway) => runway.lengthFt));

/** Whether `type` can use this airport (runway long enough). */
const servesAirport = (type: SimulatedType, airport: AirportData) =>
  longestRunwayFt(airport) >= type.minRunwayFt;

/** Airports `type` can fly to from `from`: in its range, with a runway long enough. */
export function destinationsOf(type: SimulatedType, from: AirportData): AirportData[] {
  const [min, max] = type.rangeNm;
  return SIMULATED_AIRPORTS.filter((to) => {
    if (to.icao === from.icao || !servesAirport(type, to)) return false;
    const nm = distanceBetweenNm(from, to);
    return nm >= min && nm <= max;
  });
}

/** Whether `type` can fly this route (used to send a pilot home). */
export function canFly(type: SimulatedType, from: AirportData, to: AirportData): boolean {
  return destinationsOf(type, from).some((airport) => airport.icao === to.icao);
}

/** Climb-out, arrival legs and slower climb and approach: about this much on top of the cruise. */
const PROCEDURES_S = 800;

/**
 * Time in the air the generator will fly on this route, about (liftoff to touchdown, s): what
 * the fictitious careers count to reach a pilot rank. Checked against generated flights by test.
 */
export function estimatedAirborneS(type: SimulatedType, from: AirportData, to: AirportData) {
  return (distanceBetweenNm(from, to) / type.cruiseGs) * 3600 + PROCEDURES_S;
}

export interface FlightOrder {
  name?: string;
  callsign: string;
  seed: number;
  type: SimulatedType;
  from: AirportData;
  to: AirportData;
  disturbances?: readonly Disturbance[];
  /** Simulator declared by the flight (fictitious accounts fly "msfs2024", see populate). */
  simulator?: AircraftInfo["simulator"];
}

/** Scenario of a flight of `type` between two airports, with the type's performance. */
export function scenarioOf(order: FlightOrder): Scenario {
  const { type } = order;
  return {
    name: order.name ?? `${order.from.icao.toLowerCase()}-${order.to.icao.toLowerCase()}`,
    callsign: order.callsign,
    seed: order.seed,
    aircraft: { ...type.aircraft, simulator: order.simulator ?? type.aircraft.simulator },
    departure: order.from,
    arrival: order.to,
    cruiseAltFt: type.cruiseAltFt,
    cruiseGs: type.cruiseGs,
    approachGs: type.approachGs,
    rotateGs: type.rotateGs,
    climbFpm: type.climbFpm,
    disturbances: order.disturbances ?? [],
  };
}
