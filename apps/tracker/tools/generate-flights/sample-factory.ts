import type { AircraftInfo, Sample } from "@weems/contrats";
import type { Loading } from "./aircraft-load.ts";
import type { Cabin } from "./cabin.ts";
import { oatAt, type RouteWeather, weatherAlong, windAt } from "./weather.ts";

/** The few values the generator drives; everything else follows from them or from the conditions. */
export interface AircraftState {
  t: number;
  lat: number;
  lon: number;
  /** ft above sea level; altAgl follows from the terrain below. */
  altMsl: number;
  altAgl: number;
  gs: number;
  vs: number;
  /** True heading. */
  heading: number;
  /** Degrees, positive = right wing down. */
  bank: number;
  onGround: boolean;
  enginesRunning: boolean;
  pushback: boolean;
  parkingBrake: boolean;
  gearDown: boolean;
  paused: boolean;
  simRate: number;
  slew: boolean;
  /** Fuel on board, kg (null for an aircraft without weights). */
  fuelKg: number | null;
  /** Accelerations since the previous sample, in g (computed by the flight script). */
  accelLongitudinal: number;
  accelVertical: number;
  /** Cabin altitude, ft, and its rate, ft/min (computed by the flight script, cabin.ts). */
  cabinAlt: number;
  cabinRate: number;
  /** Share of the way from the departure (0) to the arrival (1), for the weather. */
  routeShare: number;
}

/** What does not change during the flight: the aircraft, its load and the weather. */
export interface FlightConditions {
  aircraft: AircraftInfo;
  loading: Loading | null;
  weather: RouteWeather;
  cabin: Cabin;
}

/** Speed of sound, kt, from the temperature in kelvins. */
const SOUND_KT_PER_SQRT_K = 38.967854;
const KELVIN = 273.15;
/** True airspeed grows about 2 % per 1 000 ft over the indicated one (rule of thumb). */
const TAS_GAIN_PER_1000_FT = 0.02;
/** Ground speeds of a take-off or landing roll (strobes, landing light, on the runway). */
const RUNWAY_GS = 40;
/** Landing light on in the air below this height. */
const LANDING_LIGHT_AGL_FT = 10_000;
/** N1 in percent by what the engines do; pistons give none. */
const N1 = { idle: 22, taxi: 26, takeoff: 92, climb: 88, cruise: 80, descent: 34 };
const CLIMBING_FPM = 300;
const ACCELERATING_G = 0.02;

/** Nose up 2.5° in level flight, more in the climb, less in the descent. */
const pitchFor = (vs: number) => Math.max(-3, Math.min(12, 2.5 + vs / 500));

function lightsOf(state: AircraftState) {
  const onRunway = state.onGround && state.gs > RUNWAY_GS;
  return {
    beacon: state.enginesRunning,
    landing: onRunway || (!state.onGround && state.altAgl < LANDING_LIGHT_AGL_FT),
    strobe: onRunway || !state.onGround,
    nav: true,
    taxi: state.enginesRunning && state.onGround && state.gs > 2 && !onRunway,
  };
}

function n1Of(state: AircraftState): number {
  if (state.onGround) {
    if (state.gs > RUNWAY_GS && state.accelLongitudinal > ACCELERATING_G) return N1.takeoff;
    return state.gs > 2 ? N1.taxi : N1.idle;
  }
  if (state.vs > CLIMBING_FPM) return N1.climb;
  return state.vs < -CLIMBING_FPM ? N1.descent : N1.cruise;
}

function enginesOf(state: AircraftState, aircraft: AircraftInfo): Sample["engines"] {
  const n1 = aircraft.engineType === "piston" ? null : n1Of(state);
  return Array.from({ length: aircraft.engineCount }, () => ({
    running: state.enginesRunning,
    n1: state.enginesRunning ? n1 : 0,
  }));
}

/**
 * The profile drives the ground speed: the true airspeed is taken equal to it (the track ignores
 * the wind), the indicated one is lower up high, as on a real airspeed indicator.
 */
function speedsOf(state: AircraftState, oat: number) {
  const tas = state.gs;
  const ias = state.onGround ? tas : tas / (1 + (TAS_GAIN_PER_1000_FT * state.altMsl) / 1000);
  return { ias, tas, mach: tas / (SOUND_KT_PER_SQRT_K * Math.sqrt(oat + KELVIN)) };
}

function weightOf(state: AircraftState, conditions: FlightConditions): number | null {
  const { aircraft, loading } = conditions;
  if (aircraft.emptyWeightKg === null || loading === null || state.fuelKg === null) return null;
  return aircraft.emptyWeightKg + loading.payloadKg + state.fuelKg;
}

/** g felt by the crew: the turn's load factor plus the vertical acceleration. */
const gForceOf = (state: AircraftState) =>
  1 / Math.cos((state.bank * Math.PI) / 180) + state.accelVertical;

export function toSample(state: AircraftState, conditions: FlightConditions): Sample {
  const airborne = !state.onGround;
  const weather = weatherAlong(conditions.weather, state.routeShare);
  const oat = oatAt(weather, state.altMsl);
  return {
    t: state.t,
    simTimeUtc: null,
    simRate: state.simRate,
    lat: state.lat,
    lon: state.lon,
    altMsl: state.altMsl,
    altAgl: state.altAgl,
    altIndicated: state.altMsl,
    ...speedsOf(state, oat),
    gs: state.gs,
    vs: state.vs,
    pitch: airborne ? pitchFor(state.vs) : 0,
    bank: state.bank,
    heading: state.heading,
    onGround: state.onGround,
    onRunway: state.onGround && state.gs > RUNWAY_GS,
    parkingBrake: state.parkingBrake,
    gearHandle: state.gearDown ? 1 : 0,
    flapsIndex: airborne && state.altAgl > 10000 ? 0 : 2,
    spoilers: 0,
    engines: enginesOf(state, conditions.aircraft),
    fuelKg: state.fuelKg,
    weightKg: weightOf(state, conditions),
    gForce: gForceOf(state),
    accel: { lateral: 0, vertical: state.accelVertical, longitudinal: state.accelLongitudinal },
    cabinAlt: state.cabinAlt,
    cabinRate: state.cabinRate,
    seatbelts: true,
    lights: lightsOf(state),
    overspeed: false,
    stall: false,
    autopilot: airborne && state.altAgl > 1000,
    pushback: state.pushback,
    surface: state.onGround
      ? { type: "asphalt", condition: weather.wetRunways ? "wet" : "normal" }
      : null,
    wind: windAt(weather, state.altMsl),
    oat,
    visibilityM: weather.visibilityM,
    slew: state.slew,
    paused: state.paused,
  };
}
