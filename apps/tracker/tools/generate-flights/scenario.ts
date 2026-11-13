import type { AircraftInfo } from "@weems/contrats";
import { type AirportData, airportOf } from "./airports/airport-data.ts";

/** Disturbances the generator can inject (architecture interne, part 6). */
export type Disturbance =
  | "goAround"
  | "bounce"
  | "touchAndGo"
  | "rejectedTakeoff"
  | "pause"
  | "timeAcceleration"
  | "slew"
  | "teleport"
  | "crash";

/** Description of a synthetic flight. Same scenario + same seed = same file. */
export interface Scenario {
  name: string;
  callsign: string;
  seed: number;
  aircraft: AircraftInfo;
  /** Real airports with their runways (airports/airports.json). */
  departure: AirportData;
  arrival: AirportData;
  /** Wanted cruise level, ft above sea level; lowered on routes too short for it. */
  cruiseAltFt: number;
  /** Ground speeds in kt. */
  cruiseGs: number;
  approachGs: number;
  /** Lift-off ground speed, kt (airliner when absent). */
  rotateGs?: number;
  /** Vertical speed in the climb, ft/min (airliner when absent). */
  climbFpm?: number;
  disturbances: readonly Disturbance[];
}

/** Airliner values, used when the scenario gives none. */
export const DEFAULT_ROTATE_GS = 160;
export const DEFAULT_CLIMB_FPM = 2500;

export const A320: AircraftInfo = {
  simulator: "replay",
  title: "Airbus A320neo",
  model: "A20N",
  registration: "F-WEMS",
  engineCount: 2,
  emptyWeightKg: 44300,
  engineType: "jet",
  airframe: "airplane",
  maxGrossWeightKg: 79000,
};

/** Paris-Charles-de-Gaulle to Toulouse-Blagnac, short airliner flight. */
export const LFPG_LFBO: Scenario = {
  name: "lfpg-lfbo",
  callsign: "WMS100",
  seed: 42,
  aircraft: A320,
  departure: airportOf("LFPG"),
  arrival: airportOf("LFBO"),
  cruiseAltFt: 35000,
  cruiseGs: 450,
  approachGs: 140,
  disturbances: [],
};
