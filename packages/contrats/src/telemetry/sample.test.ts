import { describe, expect, it } from "vitest";
import { Sample } from "./sample.ts";

const validSample = (): Record<string, unknown> => ({
  t: 1000,
  simTimeUtc: 30000,
  simRate: 1,
  lat: 49.0097,
  lon: 2.5479,
  altMsl: 392,
  altAgl: 0,
  altIndicated: 390,
  ias: 0,
  tas: 0,
  gs: 0,
  mach: 0,
  vs: 0,
  pitch: 0.5,
  bank: 0,
  heading: 266,
  onGround: true,
  onRunway: false,
  parkingBrake: true,
  gearHandle: 1,
  flapsIndex: 0,
  spoilers: 0,
  engines: [
    { running: false, n1: 0 },
    { running: false, n1: 0 },
  ],
  fuelKg: 8000,
  weightKg: 62000,
  gForce: 1,
  accel: { lateral: 0, vertical: 0, longitudinal: 0 },
  cabinAlt: 392,
  cabinRate: 0,
  seatbelts: true,
  lights: { beacon: false, landing: false, strobe: false, nav: true, taxi: false },
  overspeed: false,
  stall: false,
  autopilot: false,
  pushback: false,
  surface: { type: "concrete", condition: "dry" },
  wind: { dir: 270, speed: 8 },
  oat: 12,
  visibilityM: 10000,
  slew: false,
  paused: false,
});

describe("Sample", () => {
  it("accepts a complete sample", () => {
    expect(Sample.safeParse(validSample()).success).toBe(true);
  });

  it("accepts null for values the aircraft does not publish", () => {
    const sample = {
      ...validSample(),
      parkingBrake: null,
      gearHandle: null,
      fuelKg: null,
      surface: null,
      lights: { beacon: null, landing: null, strobe: null, nav: null, taxi: null },
      engines: [{ running: true, n1: null }],
    };
    expect(Sample.safeParse(sample).success).toBe(true);
  });

  it("rejects a missing value instead of guessing 0", () => {
    const { fuelKg: _omitted, ...withoutFuel } = validSample();
    expect(Sample.safeParse(withoutFuel).success).toBe(false);
  });

  it.each([
    ["lat", 200],
    ["lon", -181],
    ["heading", 360],
    ["gs", -1],
    ["t", -5],
  ])("rejects %s = %s", (field, value) => {
    expect(Sample.safeParse({ ...validSample(), [field]: value }).success).toBe(false);
  });
});
