import type { AircraftInfo, Sample } from "@weems/contrats";
import { ENGINE_TYPES } from "./aircraft-identity.ts";
import { ENGINE_SLOTS, type RawAircraft, type RawSample } from "./sim-vars.ts";

const RAD = Math.PI / 180;

/** An A320 in cruise as SimConnect would send it (radians, ft/s, pounds, MSFS signs). */
const CRUISE: RawSample["values"] = {
  lat: 45.5 * RAD,
  lon: 1.25 * RAD,
  altMsl: 36_000,
  altAgl: 35_200,
  altIndicated: 36_010,
  ias: 260,
  tas: 450,
  mach: 0.78,
  gs: 470,
  vs: -5,
  pitch: -2.5,
  bank: 10,
  heading: 190,
  onGround: 0,
  onRunway: 0,
  parkingBrake: 0,
  gearHandle: 0,
  flapsIndex: 0,
  spoilers: 0,
  fuelLb: 12_000,
  weightLb: 140_000,
  gForce: 1,
  accelLateral: 0,
  accelVertical: 32.174,
  accelLongitudinal: 0,
  cabinAlt: 7_000,
  cabinRate: 0,
  seatbelts: -1,
  lightBeacon: 1,
  lightLanding: 0,
  lightStrobe: 1,
  lightNav: 1,
  lightTaxi: 0,
  overspeed: 0,
  stall: 0,
  autopilot: 1,
  pushbackState: 3,
  surfaceType: 4,
  surfaceCondition: 0,
  surfaceValid: 1,
  windSpeed: 45,
  windDir: 280,
  oat: -54,
  visibility: 30_000,
  slew: 0,
};

/** Tests only. */
export function rawCruise(overrides: Partial<RawSample["values"]> = {}): RawSample {
  return {
    values: {
      ...CRUISE,
      ...overrides,
    },
    engines: [
      { running: 1, n1: 85 },
      { running: 1, n1: 85.5 },
      { running: 0, n1: 0 },
      { running: 0, n1: 0 },
    ],
  };
}

export function rawA320(title = "Airbus A320neo Weems"): RawAircraft {
  return {
    strings: {
      title,
      model: "TT:ATCCOM.AC_MODEL_A320.0.text",
      registration: "",
      airframe: "Airplane",
    },
    numbers: { engineCount: 2, emptyWeightLb: 93_000, engineType: 1, maxGrossWeightLb: 174_165 },
  };
}

const LB_PER_KG = 1 / 0.45359237;
const G_IN_FT_PER_S2 = 32.174;
/** SimConnect has no null: an unknown value reads as NaN here, which the connector rejects. */
const num = (value: number | null) => value ?? Number.NaN;
const flag = (value: boolean | null) => (value === null ? Number.NaN : value ? 1 : 0);
const SURFACE_CODES: Record<string, number> = { concrete: 0, asphalt: 4 };
const CONDITION_CODES: Record<string, number> = { normal: 0, wet: 1, icy: 2, snow: 3 };

function surfaceValues(sample: Sample) {
  const { surface } = sample;
  return {
    surfaceType: surface ? num(SURFACE_CODES[surface.type] ?? null) : Number.NaN,
    surfaceCondition: num(CONDITION_CODES[surface?.condition ?? ""] ?? null),
    surfaceValid: surface?.condition ? 1 : 0,
  };
}

function lightValues({ lights }: Sample) {
  return {
    lightBeacon: flag(lights.beacon),
    lightLanding: flag(lights.landing),
    lightStrobe: flag(lights.strobe),
    lightNav: flag(lights.nav),
    lightTaxi: flag(lights.taxi),
  };
}

function motionValues(s: Sample) {
  return {
    lat: s.lat * RAD,
    lon: s.lon * RAD,
    altMsl: s.altMsl,
    altAgl: s.altAgl,
    altIndicated: s.altIndicated,
    ias: s.ias,
    tas: s.tas,
    mach: s.mach,
    gs: s.gs,
    vs: s.vs / 60,
    pitch: -s.pitch,
    bank: -s.bank,
    heading: s.heading,
    gForce: s.gForce,
    accelLateral: s.accel.lateral * G_IN_FT_PER_S2,
    accelVertical: s.accel.vertical * G_IN_FT_PER_S2,
    accelLongitudinal: s.accel.longitudinal * G_IN_FT_PER_S2,
  };
}

function stateValues(s: Sample) {
  return {
    onGround: flag(s.onGround),
    onRunway: flag(s.onRunway),
    parkingBrake: flag(s.parkingBrake),
    gearHandle: num(s.gearHandle),
    flapsIndex: num(s.flapsIndex),
    spoilers: num(s.spoilers),
    fuelLb: s.fuelKg === null ? Number.NaN : s.fuelKg * LB_PER_KG,
    weightLb: s.weightKg === null ? Number.NaN : s.weightKg * LB_PER_KG,
    cabinAlt: num(s.cabinAlt),
    cabinRate: s.cabinRate === null ? Number.NaN : s.cabinRate / 60,
    seatbelts: flag(s.seatbelts),
    overspeed: flag(s.overspeed),
    stall: flag(s.stall),
    autopilot: flag(s.autopilot),
    pushbackState: s.pushback === null ? Number.NaN : s.pushback ? 0 : 3,
    windSpeed: s.wind.speed,
    windDir: s.wind.dir,
    oat: s.oat,
    visibility: s.visibilityM,
    slew: flag(s.slew),
  };
}

/** The values SimConnect would send for a core sample: the inverse of toSample. Tests only. */
export function rawFromSample(sample: Sample): RawSample {
  const engines = Array.from({ length: ENGINE_SLOTS }, (_, i) => {
    const engine = sample.engines[i];
    return { running: engine?.running ? 1 : 0, n1: engine?.n1 ?? 0 };
  });
  return {
    values: {
      ...motionValues(sample),
      ...stateValues(sample),
      ...lightValues(sample),
      ...surfaceValues(sample),
    },
    engines,
  };
}

/** ENGINE TYPE code of the SDK; 4 (unsupported) for an unknown engine. */
function engineTypeCode(engineType: AircraftInfo["engineType"]): number {
  const code = Object.entries(ENGINE_TYPES).find(([, type]) => type === engineType)?.[0];
  return code === undefined ? 4 : Number(code);
}

/** The aircraft identity SimConnect would send for a core aircraft. Tests only. */
export function rawFromAircraft(aircraft: AircraftInfo): RawAircraft {
  return {
    strings: {
      title: aircraft.title,
      model: aircraft.model ?? "",
      registration: aircraft.registration ?? "",
      airframe: aircraft.airframe === "helicopter" ? "Helicopter" : "Airplane",
    },
    numbers: {
      engineCount: aircraft.engineCount,
      emptyWeightLb: (aircraft.emptyWeightKg ?? 0) * LB_PER_KG,
      engineType: engineTypeCode(aircraft.engineType),
      maxGrossWeightLb: (aircraft.maxGrossWeightKg ?? 0) * LB_PER_KG,
    },
  };
}
