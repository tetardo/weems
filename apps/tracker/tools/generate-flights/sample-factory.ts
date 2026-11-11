import type { Sample } from "@weems/contrats";

/** The few values the generator drives; everything else gets a plausible constant. */
export interface AircraftState {
  t: number;
  lat: number;
  lon: number;
  altAgl: number;
  gs: number;
  vs: number;
  heading: number;
  onGround: boolean;
  enginesRunning: boolean;
  pushback: boolean;
  parkingBrake: boolean;
  gearDown: boolean;
  paused: boolean;
  simRate: number;
  slew: boolean;
}

const lights = (on: boolean) => ({ beacon: on, landing: on, strobe: on, nav: true, taxi: on });

export function toSample(state: AircraftState, engineCount: number): Sample {
  const airborne = !state.onGround;
  return {
    t: state.t,
    simTimeUtc: null,
    simRate: state.simRate,
    lat: state.lat,
    lon: state.lon,
    altMsl: state.altAgl,
    altAgl: state.altAgl,
    altIndicated: state.altAgl,
    ias: state.gs,
    tas: state.gs,
    gs: state.gs,
    mach: state.gs / 661,
    vs: state.vs,
    pitch: airborne ? 2.5 : 0,
    bank: 0,
    heading: state.heading,
    onGround: state.onGround,
    onRunway: null,
    parkingBrake: state.parkingBrake,
    gearHandle: state.gearDown ? 1 : 0,
    flapsIndex: airborne && state.altAgl > 10000 ? 0 : 2,
    spoilers: 0,
    engines: Array.from({ length: engineCount }, () => ({
      running: state.enginesRunning,
      n1: state.enginesRunning ? 60 : 0,
    })),
    fuelKg: 6000,
    weightKg: 64000,
    gForce: 1,
    accel: { lateral: 0, vertical: 0, longitudinal: 0 },
    cabinAlt: Math.min(state.altAgl, 8000),
    cabinRate: 0,
    seatbelts: true,
    lights: lights(state.enginesRunning),
    overspeed: false,
    stall: false,
    autopilot: airborne && state.altAgl > 1000,
    pushback: state.pushback,
    surface: state.onGround ? { type: "asphalt", condition: "normal" } : null,
    wind: { dir: 270, speed: 10 },
    oat: 15 - (state.altAgl / 1000) * 2,
    visibilityM: 10000,
    slew: state.slew,
    paused: state.paused,
  };
}
