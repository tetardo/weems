import { type AircraftInfo, Sample, type Simulator } from "@weems/contrats";
import type { RawAircraft, RawSample } from "./sim-vars.ts";

const FT_PER_S_TO_FT_PER_MIN = 60;
const KG_PER_LB = 0.45359237;
const FT_PER_S2_PER_G = 32.174;
const DEG_PER_RAD = 180 / Math.PI;

/**
 * MSFS gives a nose-up pitch as negative, a right bank as negative (spec T0: nose up and
 * right bank are positive). To confirm on the first real flight (simvars.yaml, pieges.md).
 */
const PITCH_SIGN = -1;
const BANK_SIGN = -1;

/** PUSHBACK STATE: 0 straight, 1 left, 2 right, 3 none (to confirm in the simulator). */
const PUSHBACK_MOVING_MAX = 2;

/** SURFACE TYPE codes listed in simvars.yaml; others are kept as their code. */
const SURFACE_TYPES: Record<number, string> = { 0: "concrete", 4: "asphalt" };
/** SURFACE CONDITION codes (simvars.yaml). */
const SURFACE_CONDITIONS: Record<number, string> = { 0: "normal", 1: "wet", 2: "icy", 3: "snow" };

/** A value outside its physical range (e.g. -999999 on a frame drop) is unknown: null. */
function within(value: number, min: number, max: number): number | null {
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/** SimConnect booleans: true may be 1 or -1, so anything but 0 (pieges.md). */
const isTrue = (value: number): boolean => value !== 0;
const bool = (value: number): boolean | null => (Number.isFinite(value) ? isTrue(value) : null);
const headingOf = (degrees: number): number => ((degrees % 360) + 360) % 360;
const kg = (pounds: number): number | null => {
  const value = within(pounds, 0, 2_000_000);
  return value === null ? null : value * KG_PER_LB;
};

function surfaceOf(v: RawSample["values"]): Sample["surface"] {
  const type = within(v.surfaceType, 0, 1_000);
  if (type === null) return null;
  const condition = SURFACE_CONDITIONS[v.surfaceCondition] ?? null;
  return {
    type: SURFACE_TYPES[type] ?? `code-${type}`,
    condition: isTrue(v.surfaceValid) ? condition : null,
  };
}

function lightsOf(v: RawSample["values"]): Sample["lights"] {
  return {
    beacon: bool(v.lightBeacon),
    landing: bool(v.lightLanding),
    strobe: bool(v.lightStrobe),
    nav: bool(v.lightNav),
    taxi: bool(v.lightTaxi),
  };
}

/** Engines that exist on this aircraft; N1 of 0 (piston engine, or not measured) is null. */
function enginesOf(raw: RawSample, engineCount: number): Sample["engines"] {
  return raw.engines.slice(0, engineCount).map((engine) => {
    const n1 = within(engine.n1, 0, 150);
    return { running: isTrue(engine.running), n1: n1 === null || n1 === 0 ? null : n1 };
  });
}

function motionOf(v: RawSample["values"]) {
  return {
    lat: v.lat * DEG_PER_RAD,
    lon: v.lon * DEG_PER_RAD,
    altMsl: v.altMsl,
    altAgl: v.altAgl,
    altIndicated: v.altIndicated,
    ias: v.ias,
    tas: v.tas,
    gs: Math.max(0, v.gs),
    mach: Math.max(0, v.mach),
    vs: v.vs * FT_PER_S_TO_FT_PER_MIN,
    pitch: PITCH_SIGN * v.pitch,
    bank: BANK_SIGN * v.bank,
    heading: headingOf(v.heading),
    gForce: v.gForce,
    accel: {
      lateral: v.accelLateral / FT_PER_S2_PER_G,
      vertical: v.accelVertical / FT_PER_S2_PER_G,
      longitudinal: v.accelLongitudinal / FT_PER_S2_PER_G,
    },
  };
}

function aircraftStateOf(v: RawSample["values"]) {
  const pushback = within(v.pushbackState, 0, 10);
  const cabinRate = within(v.cabinRate, -1_000, 1_000);
  return {
    onGround: isTrue(v.onGround),
    onRunway: bool(v.onRunway),
    parkingBrake: bool(v.parkingBrake),
    gearHandle: within(v.gearHandle, 0, 1),
    flapsIndex: within(Math.round(v.flapsIndex), 0, 50),
    spoilers: within(v.spoilers, 0, 1),
    fuelKg: kg(v.fuelLb),
    weightKg: kg(v.weightLb),
    cabinAlt: within(v.cabinAlt, -2_000, 60_000),
    cabinRate: cabinRate === null ? null : cabinRate * FT_PER_S_TO_FT_PER_MIN,
    seatbelts: bool(v.seatbelts),
    overspeed: bool(v.overspeed),
    stall: bool(v.stall),
    autopilot: bool(v.autopilot),
    pushback: pushback === null ? null : pushback <= PUSHBACK_MOVING_MAX,
    slew: isTrue(v.slew),
  };
}

export interface SampleContext {
  /** Monotonic local time of reception (ms). */
  t: number;
  /** From the pause system events (spec T0: computed by the connector). */
  paused: boolean;
  engineCount: number;
}

/**
 * Translates a raw SimConnect sample into the core's units (spec T0, part A).
 * Returns null when a value the core cannot do without is aberrant: the sample is dropped.
 * ZULU TIME and SIMULATION RATE are not verified in the SDK yet: sent as unknown (null).
 */
export function toSample(raw: RawSample, context: SampleContext): Sample | null {
  const v = raw.values;
  const sample = {
    t: Math.round(context.t),
    simTimeUtc: null,
    simRate: null,
    ...motionOf(v),
    ...aircraftStateOf(v),
    engines: enginesOf(raw, context.engineCount),
    lights: lightsOf(v),
    surface: surfaceOf(v),
    wind: { dir: headingOf(v.windDir), speed: Math.max(0, v.windSpeed) },
    oat: v.oat,
    visibilityM: Math.max(0, v.visibility),
    paused: context.paused,
  };
  const parsed = Sample.safeParse(sample);
  return parsed.success ? parsed.data : null;
}

/** Empty strings from the simulator become null (spec T0: model and registration may be empty). */
const textOrNull = (text: string): string | null => (text.trim() === "" ? null : text.trim());

export function toAircraft(raw: RawAircraft, simulator: Simulator): AircraftInfo | null {
  const title = textOrNull(raw.strings.title);
  if (title === null) return null;
  const engineCount = within(Math.round(raw.numbers.engineCount), 0, 8);
  const emptyWeight = kg(raw.numbers.emptyWeightLb);
  return {
    simulator,
    title,
    model: textOrNull(raw.strings.model),
    registration: textOrNull(raw.strings.registration),
    engineCount: engineCount ?? 0,
    emptyWeightKg: emptyWeight !== null && emptyWeight > 0 ? emptyWeight : null,
  };
}
