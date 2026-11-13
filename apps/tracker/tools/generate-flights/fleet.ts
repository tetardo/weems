import type { AircraftInfo } from "@weems/contrats";
import { SIMULATED_TYPES } from "./aircraft-types.ts";
import { airportOf, SIMULATED_AIRPORTS } from "./airports/airport-data.ts";
import { seededRandom } from "./random.ts";
import { destinationsOf, scenarioOf } from "./routes.ts";
import { A320, type Disturbance, type Scenario } from "./scenario.ts";

const aircraft = (
  title: string,
  model: string,
  registration: string,
  emptyWeightKg: number,
): AircraftInfo => ({
  simulator: "replay",
  title,
  model,
  registration,
  engineCount: 2,
  emptyWeightKg,
  engineType: "jet",
  airframe: "airplane",
  maxGrossWeightKg: null,
});

type Icao = string;

const B738 = aircraft("Boeing 737-800", "B738", "F-WEMB", 41400);
const E190 = aircraft("Embraer E190", "E190", "F-WEME", 28000);
const AT76: AircraftInfo = {
  ...aircraft("ATR 72-600", "AT76", "F-WEMA", 13500),
  engineType: "turboprop",
};
const A319 = aircraft("Airbus A319", "A319", "F-WEMC", 40800);
const CRJ9 = aircraft("Bombardier CRJ900", "CRJ9", "F-WEMJ", 21400);

interface Leg {
  from: Icao;
  to: Icao;
  aircraft: AircraftInfo;
  cruiseAltFt: number;
  cruiseGs: number;
  approachGs: number;
  disturbances?: Disturbance[];
}

/** 10 short real routes in Europe with varied aircraft (spec J1, part 1). */
const LEGS: Leg[] = [
  { from: "LFLL", to: "LFMN", aircraft: A320, cruiseAltFt: 24000, cruiseGs: 400, approachGs: 140 },
  { from: "LFBO", to: "LFBD", aircraft: AT76, cruiseAltFt: 17000, cruiseGs: 270, approachGs: 115 },
  {
    from: "EGLL",
    to: "EHAM",
    aircraft: B738,
    cruiseAltFt: 26000,
    cruiseGs: 420,
    approachGs: 145,
    disturbances: ["goAround"],
  },
  { from: "EDDF", to: "EDDM", aircraft: A319, cruiseAltFt: 24000, cruiseGs: 400, approachGs: 135 },
  {
    from: "LSZH",
    to: "LIMC",
    aircraft: E190,
    cruiseAltFt: 23000,
    cruiseGs: 380,
    approachGs: 130,
    disturbances: ["bounce"],
  },
  { from: "LEMD", to: "LEBL", aircraft: A320, cruiseAltFt: 33000, cruiseGs: 450, approachGs: 140 },
  {
    from: "EBBR",
    to: "EDDL",
    aircraft: CRJ9,
    cruiseAltFt: 19000,
    cruiseGs: 360,
    approachGs: 135,
    disturbances: ["rejectedTakeoff"],
  },
  {
    from: "LFSB",
    to: "LFPG",
    aircraft: A319,
    cruiseAltFt: 27000,
    cruiseGs: 410,
    approachGs: 135,
    disturbances: ["pause"],
  },
  { from: "LOWW", to: "LKPR", aircraft: AT76, cruiseAltFt: 17000, cruiseGs: 270, approachGs: 115 },
  {
    from: "EIDW",
    to: "EGCC",
    aircraft: B738,
    cruiseAltFt: 25000,
    cruiseGs: 410,
    approachGs: 145,
    disturbances: ["touchAndGo"],
  },
];

function toScenario(leg: Leg, index: number): Scenario {
  return {
    name: `${leg.from.toLowerCase()}-${leg.to.toLowerCase()}`,
    callsign: `WMS${101 + index}`,
    seed: 101 + index,
    aircraft: leg.aircraft,
    departure: airportOf(leg.from),
    arrival: airportOf(leg.to),
    cruiseAltFt: leg.cruiseAltFt,
    cruiseGs: leg.cruiseGs,
    approachGs: leg.approachGs,
    disturbances: leg.disturbances ?? [],
  };
}

export const FLEET: readonly Scenario[] = LEGS.map(toScenario);

/**
 * Spec J4 (montée en charge): `count` flights, the 10 J1 routes first, then flights drawn
 * deterministically among every simulated type and airport, each in the range of its type.
 * Same count, same fleet, on every machine.
 */
export function fleetOf(count: number): Scenario[] {
  const random = seededRandom(2026);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  return Array.from({ length: count }, (_, index) => {
    const known = LEGS[index];
    if (known) return toScenario(known, index);
    const type = pick(SIMULATED_TYPES);
    const from = pick(SIMULATED_AIRPORTS.filter((a) => destinationsOf(type, a).length > 0));
    const to = pick(destinationsOf(type, from));
    return scenarioOf({ callsign: `WMS${101 + index}`, seed: 101 + index, type, from, to });
  });
}
