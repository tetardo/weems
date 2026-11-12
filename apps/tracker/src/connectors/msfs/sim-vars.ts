/**
 * SimVars read by the MSFS connector, with the unit asked to SimConnect.
 * Only variables marked `verified: true` in docs/reference/simvars.yaml (checked by sim-vars.test.ts).
 * Values arrive in this order, as 64-bit floats (strings for the aircraft identity).
 */

/** Read for each engine, `:1` to `:ENGINE_SLOTS`. */
export const ENGINE_SLOTS = 4;

export const SAMPLE_VARS = [
  ["lat", "PLANE LATITUDE", "radians"],
  ["lon", "PLANE LONGITUDE", "radians"],
  ["altMsl", "PLANE ALTITUDE", "feet"],
  ["altAgl", "PLANE ALT ABOVE GROUND", "feet"],
  ["altIndicated", "INDICATED ALTITUDE", "feet"],
  ["ias", "AIRSPEED INDICATED", "knots"],
  ["tas", "AIRSPEED TRUE", "knots"],
  ["mach", "AIRSPEED MACH", "mach"],
  ["gs", "GROUND VELOCITY", "knots"],
  ["vs", "VERTICAL SPEED", "feet per second"],
  ["pitch", "PLANE PITCH DEGREES", "degrees"],
  ["bank", "PLANE BANK DEGREES", "degrees"],
  ["heading", "PLANE HEADING DEGREES TRUE", "degrees"],
  ["onGround", "SIM ON GROUND", "bool"],
  ["onRunway", "ON ANY RUNWAY", "bool"],
  ["parkingBrake", "BRAKE PARKING POSITION", "bool"],
  ["gearHandle", "GEAR HANDLE POSITION", "percent_over_100"],
  ["flapsIndex", "FLAPS HANDLE INDEX", "number"],
  ["spoilers", "SPOILERS HANDLE POSITION", "percent_over_100"],
  ["fuelLb", "FUEL TOTAL QUANTITY WEIGHT", "pounds"],
  ["weightLb", "TOTAL WEIGHT", "pounds"],
  ["gForce", "G FORCE", "gforce"],
  ["accelLateral", "ACCELERATION BODY X", "feet per second squared"],
  ["accelVertical", "ACCELERATION BODY Y", "feet per second squared"],
  ["accelLongitudinal", "ACCELERATION BODY Z", "feet per second squared"],
  ["cabinAlt", "PRESSURIZATION CABIN ALTITUDE", "feet"],
  ["cabinRate", "PRESSURIZATION CABIN ALTITUDE RATE", "feet per second"],
  ["seatbelts", "CABIN SEATBELTS ALERT SWITCH", "bool"],
  ["lightBeacon", "LIGHT BEACON", "bool"],
  ["lightLanding", "LIGHT LANDING", "bool"],
  ["lightStrobe", "LIGHT STROBE", "bool"],
  ["lightNav", "LIGHT NAV", "bool"],
  ["lightTaxi", "LIGHT TAXI", "bool"],
  ["overspeed", "OVERSPEED WARNING", "bool"],
  ["stall", "STALL WARNING", "bool"],
  ["autopilot", "AUTOPILOT MASTER", "bool"],
  ["pushbackState", "PUSHBACK STATE", "enum"],
  ["surfaceType", "SURFACE TYPE", "enum"],
  ["surfaceCondition", "SURFACE CONDITION", "enum"],
  ["surfaceValid", "SURFACE INFO VALID", "bool"],
  ["windSpeed", "AMBIENT WIND VELOCITY", "knots"],
  ["windDir", "AMBIENT WIND DIRECTION", "degrees"],
  ["oat", "AMBIENT TEMPERATURE", "celsius"],
  ["visibility", "AMBIENT VISIBILITY", "meters"],
  ["slew", "IS SLEW ACTIVE", "bool"],
] as const;

export const ENGINE_VARS = [
  ["running", "GENERAL ENG COMBUSTION", "bool"],
  ["n1", "TURB ENG N1", "percent"],
] as const;

/** Strings first (read once, never periodically: pieges.md), then numbers. */
export const AIRCRAFT_STRING_VARS = [
  ["title", "TITLE", "string"],
  ["model", "ATC MODEL", "string"],
  ["registration", "ATC ID", "string"],
  ["airframe", "CATEGORY", "string"],
] as const;

export const AIRCRAFT_NUMBER_VARS = [
  ["engineCount", "NUMBER OF ENGINES", "number"],
  ["emptyWeightLb", "EMPTY WEIGHT", "pounds"],
  ["engineType", "ENGINE TYPE", "enum"],
  ["maxGrossWeightLb", "MAX GROSS WEIGHT", "pounds"],
] as const;

type Key<T extends readonly (readonly [string, string, string])[]> = T[number][0];

/** One sample as SimConnect sends it, before any conversion. */
export interface RawSample {
  values: Record<Key<typeof SAMPLE_VARS>, number>;
  engines: Record<Key<typeof ENGINE_VARS>, number>[];
}

export interface RawAircraft {
  strings: Record<Key<typeof AIRCRAFT_STRING_VARS>, string>;
  numbers: Record<Key<typeof AIRCRAFT_NUMBER_VARS>, number>;
}

/** Every SimVar of a sample, in the order they are declared and received. */
export function sampleDefinition(): { name: string; unit: string }[] {
  const engines = Array.from({ length: ENGINE_SLOTS }, (_, i) =>
    ENGINE_VARS.map(([, name, unit]) => ({ name: `${name}:${i + 1}`, unit })),
  ).flat();
  return [...SAMPLE_VARS.map(([, name, unit]) => ({ name, unit })), ...engines];
}

function readInto<K extends string>(
  vars: readonly (readonly [K, string, string])[],
  read: () => number,
): Record<K, number> {
  return Object.fromEntries(vars.map(([key]) => [key, read()])) as Record<K, number>;
}

/** Reads one sample from the received data, in the declared order. */
export function decodeSample(read: () => number): RawSample {
  const values = readInto(SAMPLE_VARS, read);
  const engines = Array.from({ length: ENGINE_SLOTS }, () => readInto(ENGINE_VARS, read));
  return { values, engines };
}

/** Reads the aircraft identity from the received data, in the declared order. */
export function decodeAircraft(readString: () => string, read: () => number): RawAircraft {
  const strings = Object.fromEntries(
    AIRCRAFT_STRING_VARS.map(([key]) => [key, readString()]),
  ) as RawAircraft["strings"];
  return { strings, numbers: readInto(AIRCRAFT_NUMBER_VARS, read) };
}
