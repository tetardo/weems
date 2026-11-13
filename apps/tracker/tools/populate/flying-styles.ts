import {
  type SimulatedType,
  type TypeFamily,
  typesOf,
} from "../generate-flights/aircraft-types.ts";
import { type AirportData, airportOf } from "../generate-flights/airports/airport-data.ts";
import { canFly, destinationsOf } from "../generate-flights/routes.ts";
import { pick, weighted } from "./identities.ts";

/**
 * What a fictitious pilot likes to fly (page Activité simulée): club flying, business trips,
 * short or long haul. Weights: share of the population.
 */
const STYLES: readonly (readonly [readonly TypeFamily[], number])[] = [
  [["light"], 0.22],
  [["light", "turboprop"], 0.1],
  [["turboprop", "business"], 0.08],
  [["turboprop", "regional", "narrow"], 0.25],
  [["narrow"], 0.15],
  [["narrow", "wide"], 0.12],
  [["light", "turboprop", "business", "regional", "narrow", "wide"], 0.08],
];

/** The types a pilot flies: a favourite most of the time, the others of the style now and then. */
export interface PilotFleet {
  favourite: SimulatedType;
  types: readonly SimulatedType[];
}

export function pilotFleetOf(random: () => number): PilotFleet {
  const types = typesOf(weighted(random, STYLES));
  return { favourite: pick(random, types), types };
}

export const typeOfDay = (fleet: PilotFleet, random: () => number) =>
  random() < 0.6 ? fleet.favourite : pick(random, fleet.types);

export interface PlannedLeg {
  type: SimulatedType;
  from: AirportData;
  to: AirportData;
}

/** Home when away more often than not, otherwise anywhere in the type's range. */
function legOf(
  type: SimulatedType,
  at: AirportData,
  home: AirportData,
  random: () => number,
): PlannedLeg | null {
  if (at.icao !== home.icao && random() < 0.6 && canFly(type, at, home)) {
    return { type, from: at, to: home };
  }
  const destinations = destinationsOf(type, at);
  return destinations.length > 0 ? { type, from: at, to: pick(random, destinations) } : null;
}

/**
 * Next leg from `at` with the type wanted, or with another type of the pilot when it cannot
 * fly from there (a club single-engine at a long-haul destination), or else any type going home.
 */
export function nextLeg(
  pilot: { fleet: PilotFleet; atIcao: string; homeIcao: string },
  type: SimulatedType,
  random: () => number,
): PlannedLeg {
  const { fleet, atIcao } = pilot;
  const at = airportOf(atIcao);
  const home = airportOf(pilot.homeIcao);
  const fallbacks = [type, ...fleet.types, ...typesOf(["narrow", "wide"])];
  for (const candidate of fallbacks) {
    const leg = legOf(candidate, at, home, random);
    if (leg) return leg;
  }
  throw new Error(`No simulated type can fly from ${atIcao}`);
}
