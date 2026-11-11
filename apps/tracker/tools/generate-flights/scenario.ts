import type { AircraftInfo } from "@weems/contrats";

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

export interface Point {
  lat: number;
  lon: number;
}

interface Airport extends Point {
  icao: string;
}

/** Description of a synthetic flight. Same scenario + same seed = same file. */
export interface Scenario {
  name: string;
  callsign: string;
  seed: number;
  aircraft: AircraftInfo;
  departure: Airport;
  arrival: Airport;
  cruiseAltFt: number;
  /** Ground speeds in kt. */
  cruiseGs: number;
  approachGs: number;
  disturbances: readonly Disturbance[];
}

export const A320: AircraftInfo = {
  simulator: "replay",
  title: "Airbus A320neo",
  model: "A20N",
  registration: "F-WEMS",
  engineCount: 2,
  emptyWeightKg: 44300,
};

/** Paris-Charles-de-Gaulle to Toulouse-Blagnac, short airliner flight. */
export const LFPG_LFBO: Scenario = {
  name: "lfpg-lfbo",
  callsign: "WMS100",
  seed: 42,
  aircraft: A320,
  departure: { icao: "LFPG", lat: 49.0097, lon: 2.5479 },
  arrival: { icao: "LFBO", lat: 43.6293, lon: 1.3638 },
  cruiseAltFt: 35000,
  cruiseGs: 450,
  approachGs: 140,
  disturbances: [],
};
