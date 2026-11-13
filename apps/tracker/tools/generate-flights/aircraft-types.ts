import type { AircraftInfo } from "@weems/contrats";
import { A320 } from "./scenario.ts";

/** Families of the simulated types, as the fictitious pilots choose them. */
export type TypeFamily = "light" | "turboprop" | "business" | "regional" | "narrow" | "wide";

/** A type the generator can fly, with simplified performance and where it goes. */
export interface SimulatedType {
  aircraft: AircraftInfo;
  family: TypeFamily;
  /** Wanted cruise level, ft above sea level (lowered on short routes). */
  cruiseAltFt: number;
  /** Ground speeds, kt. */
  cruiseGs: number;
  approachGs: number;
  /** Lift-off ground speed, kt. */
  rotateGs: number;
  /** Vertical speed in the climb, ft/min. */
  climbFpm: number;
  /** Great-circle distances it flies, NM. */
  rangeNm: readonly [number, number];
  /** Longest runway the airport needs, ft. */
  minRunwayFt: number;
}

interface Specs {
  title: string;
  model: string;
  registration: string;
  engineCount: number;
  emptyWeightKg: number;
  maxGrossWeightKg: number;
  engineType: AircraftInfo["engineType"];
}

const aircraftOf = (specs: Specs): AircraftInfo => ({
  simulator: "replay",
  airframe: "airplane",
  ...specs,
});

type Performance = Omit<SimulatedType, "aircraft" | "family">;

const typeOf = (family: TypeFamily, specs: Specs, performance: Performance): SimulatedType => ({
  aircraft: aircraftOf(specs),
  family,
  ...performance,
});

const piston = { engineType: "piston", engineCount: 1 } as const;
const turboprop = { engineType: "turboprop" } as const;
const jet = { engineType: "jet", engineCount: 2 } as const;

/**
 * Types of the simulated fleet, from a club single-engine to long-haul twins: ICAO designators
 * of the Weems catalogue (apps/api aircraft/catalogue.ts), so every flight gets its category.
 * Speeds and levels are round typical values, enough for a plausible track, not a flight model.
 */
// prettier-ignore
export const SIMULATED_TYPES: readonly SimulatedType[] = [
  typeOf("light", { ...piston, title: "Cessna 172 Skyhawk", model: "C172", registration: "F-WEKA", emptyWeightKg: 760, maxGrossWeightKg: 1110 },
    { cruiseAltFt: 5500, cruiseGs: 110, approachGs: 65, rotateGs: 55, climbFpm: 700, rangeNm: [40, 220], minRunwayFt: 2500 }),
  typeOf("light", { ...piston, title: "Robin DR400", model: "DR40", registration: "F-WEKB", emptyWeightKg: 600, maxGrossWeightKg: 1000 },
    { cruiseAltFt: 4500, cruiseGs: 115, approachGs: 65, rotateGs: 55, climbFpm: 750, rangeNm: [40, 220], minRunwayFt: 2500 }),
  typeOf("light", { ...piston, title: "Diamond DA40 NG", model: "DA40", registration: "F-WEKC", emptyWeightKg: 900, maxGrossWeightKg: 1310 },
    { cruiseAltFt: 7500, cruiseGs: 130, approachGs: 70, rotateGs: 60, climbFpm: 800, rangeNm: [40, 350], minRunwayFt: 2500 }),
  typeOf("light", { ...piston, title: "Cirrus SR22", model: "SR22", registration: "F-WEKD", emptyWeightKg: 1050, maxGrossWeightKg: 1630 },
    { cruiseAltFt: 9500, cruiseGs: 170, approachGs: 80, rotateGs: 70, climbFpm: 1000, rangeNm: [60, 500], minRunwayFt: 3000 }),
  typeOf("turboprop", { ...turboprop, engineCount: 1, title: "Daher TBM 930", model: "TBM9", registration: "F-WEKE", emptyWeightKg: 2100, maxGrossWeightKg: 3350 },
    { cruiseAltFt: 28000, cruiseGs: 310, approachGs: 85, rotateGs: 85, climbFpm: 2000, rangeNm: [120, 1100], minRunwayFt: 3500 }),
  typeOf("turboprop", { ...turboprop, engineCount: 1, title: "Pilatus PC-12", model: "PC12", registration: "F-WEKF", emptyWeightKg: 2800, maxGrossWeightKg: 4740 },
    { cruiseAltFt: 25000, cruiseGs: 270, approachGs: 90, rotateGs: 85, climbFpm: 1600, rangeNm: [100, 900], minRunwayFt: 3500 }),
  typeOf("turboprop", { ...turboprop, engineCount: 2, title: "ATR 72-600", model: "AT76", registration: "F-WEMA", emptyWeightKg: 13500, maxGrossWeightKg: 23000 },
    { cruiseAltFt: 19000, cruiseGs: 270, approachGs: 115, rotateGs: 110, climbFpm: 1500, rangeNm: [80, 450], minRunwayFt: 5000 }),
  typeOf("turboprop", { ...turboprop, engineCount: 2, title: "De Havilland Dash 8-400", model: "DH8D", registration: "F-WEKG", emptyWeightKg: 17800, maxGrossWeightKg: 29500 },
    { cruiseAltFt: 25000, cruiseGs: 330, approachGs: 120, rotateGs: 115, climbFpm: 1800, rangeNm: [100, 650], minRunwayFt: 5000 }),
  typeOf("business", { ...jet, title: "Pilatus PC-24", model: "PC24", registration: "F-WEKH", emptyWeightKg: 5300, maxGrossWeightKg: 8300 },
    { cruiseAltFt: 41000, cruiseGs: 420, approachGs: 110, rotateGs: 110, climbFpm: 3000, rangeNm: [150, 1700], minRunwayFt: 4000 }),
  typeOf("business", { ...jet, title: "Bombardier Challenger 350", model: "CL35", registration: "F-WEKI", emptyWeightKg: 11000, maxGrossWeightKg: 18400 },
    { cruiseAltFt: 43000, cruiseGs: 460, approachGs: 125, rotateGs: 125, climbFpm: 3200, rangeNm: [250, 3200], minRunwayFt: 5500 }),
  typeOf("regional", { ...jet, title: "Embraer E190", model: "E190", registration: "F-WEME", emptyWeightKg: 28000, maxGrossWeightKg: 51800 },
    { cruiseAltFt: 33000, cruiseGs: 430, approachGs: 130, rotateGs: 140, climbFpm: 2500, rangeNm: [120, 1300], minRunwayFt: 6500 }),
  typeOf("regional", { ...jet, title: "Bombardier CRJ900", model: "CRJ9", registration: "F-WEMJ", emptyWeightKg: 21400, maxGrossWeightKg: 38300 },
    { cruiseAltFt: 31000, cruiseGs: 420, approachGs: 135, rotateGs: 140, climbFpm: 2500, rangeNm: [120, 1100], minRunwayFt: 6500 }),
  { aircraft: A320, family: "narrow", cruiseAltFt: 35000, cruiseGs: 450, approachGs: 140, rotateGs: 150, climbFpm: 2500, rangeNm: [150, 2300], minRunwayFt: 7000 },
  typeOf("narrow", { ...jet, title: "Airbus A319", model: "A319", registration: "F-WEMC", emptyWeightKg: 40800, maxGrossWeightKg: 75500 },
    { cruiseAltFt: 35000, cruiseGs: 445, approachGs: 135, rotateGs: 145, climbFpm: 2500, rangeNm: [150, 2300], minRunwayFt: 7000 }),
  typeOf("narrow", { ...jet, title: "Airbus A321neo", model: "A21N", registration: "F-WEKJ", emptyWeightKg: 50100, maxGrossWeightKg: 97000 },
    { cruiseAltFt: 35000, cruiseGs: 455, approachGs: 145, rotateGs: 155, climbFpm: 2300, rangeNm: [200, 2800], minRunwayFt: 7500 }),
  typeOf("narrow", { ...jet, title: "Boeing 737-800", model: "B738", registration: "F-WEMB", emptyWeightKg: 41400, maxGrossWeightKg: 79000 },
    { cruiseAltFt: 36000, cruiseGs: 455, approachGs: 145, rotateGs: 150, climbFpm: 2500, rangeNm: [150, 2500], minRunwayFt: 7000 }),
  typeOf("narrow", { ...jet, title: "Boeing 737 MAX 8", model: "B38M", registration: "F-WEKK", emptyWeightKg: 45100, maxGrossWeightKg: 82200 },
    { cruiseAltFt: 37000, cruiseGs: 455, approachGs: 145, rotateGs: 150, climbFpm: 2500, rangeNm: [150, 3000], minRunwayFt: 7000 }),
  typeOf("wide", { ...jet, title: "Airbus A350-900", model: "A359", registration: "F-WEKL", emptyWeightKg: 142000, maxGrossWeightKg: 283000 },
    { cruiseAltFt: 39000, cruiseGs: 485, approachGs: 145, rotateGs: 160, climbFpm: 2000, rangeNm: [1200, 4500], minRunwayFt: 9500 }),
  typeOf("wide", { ...jet, title: "Boeing 787-9", model: "B789", registration: "F-WEKM", emptyWeightKg: 128900, maxGrossWeightKg: 254000 },
    { cruiseAltFt: 39000, cruiseGs: 485, approachGs: 150, rotateGs: 160, climbFpm: 2000, rangeNm: [1200, 4500], minRunwayFt: 9500 }),
  typeOf("wide", { ...jet, title: "Boeing 777-300ER", model: "B77W", registration: "F-WEKN", emptyWeightKg: 167800, maxGrossWeightKg: 351500 },
    { cruiseAltFt: 37000, cruiseGs: 490, approachGs: 155, rotateGs: 165, climbFpm: 1800, rangeNm: [1500, 4500], minRunwayFt: 10000 }),
  typeOf("wide", { ...jet, title: "Airbus A330-900", model: "A339", registration: "F-WEKO", emptyWeightKg: 135000, maxGrossWeightKg: 251000 },
    { cruiseAltFt: 38000, cruiseGs: 470, approachGs: 145, rotateGs: 155, climbFpm: 2000, rangeNm: [900, 4300], minRunwayFt: 9000 }),
];

export const typesOf = (families: readonly TypeFamily[]): SimulatedType[] =>
  SIMULATED_TYPES.filter((type) => families.includes(type.family));
