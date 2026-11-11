import type { Sample } from "@weems/contrats";

/** A parked airliner, engines off; tests override only what they look at. */
export function sample(overrides: Partial<Sample> = {}): Sample {
  return {
    t: 0,
    simTimeUtc: null,
    simRate: 1,
    lat: 49,
    lon: 2.5,
    altMsl: 0,
    altAgl: 0,
    altIndicated: 0,
    ias: 0,
    tas: 0,
    gs: 0,
    mach: 0,
    vs: 0,
    pitch: 0,
    bank: 0,
    heading: 90,
    onGround: true,
    onRunway: null,
    parkingBrake: true,
    gearHandle: 1,
    flapsIndex: 0,
    spoilers: 0,
    engines: [
      { running: false, n1: 0 },
      { running: false, n1: 0 },
    ],
    fuelKg: 6000,
    weightKg: 64000,
    gForce: 1,
    accel: { lateral: 0, vertical: 0, longitudinal: 0 },
    cabinAlt: 0,
    cabinRate: 0,
    seatbelts: true,
    lights: { beacon: false, landing: false, strobe: false, nav: true, taxi: false },
    overspeed: false,
    stall: false,
    autopilot: false,
    pushback: false,
    surface: null,
    wind: { dir: 270, speed: 10 },
    oat: 15,
    visibilityM: 10000,
    slew: false,
    paused: false,
    ...overrides,
  };
}

export const RUNNING = [
  { running: true, n1: 60 },
  { running: true, n1: 60 },
];
