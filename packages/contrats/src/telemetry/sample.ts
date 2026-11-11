import { z } from "zod";
import { Heading, Latitude, Longitude, MonotonicMs, measured } from "./common.ts";

const Engine = z.object({
  running: z.boolean(),
  /** N1 in percent; null for piston engines. */
  n1: measured(z.number().min(0).max(150)),
});

const Lights = z.object({
  beacon: measured(z.boolean()),
  landing: measured(z.boolean()),
  strobe: measured(z.boolean()),
  nav: measured(z.boolean()),
  taxi: measured(z.boolean()),
});

const Surface = z.object({
  type: z.string(),
  /** null when the simulator says the surface information is not valid. */
  condition: measured(z.string()),
});

/** Periodic snapshot of the aircraft, produced by a connector (spec T0, part A). */
export const Sample = z.object({
  t: MonotonicMs,
  simTimeUtc: measured(z.number()),
  simRate: measured(z.number().positive()),
  lat: Latitude,
  lon: Longitude,
  altMsl: z.number(),
  altAgl: z.number(),
  altIndicated: z.number(),
  ias: z.number(),
  tas: z.number(),
  gs: z.number().nonnegative(),
  mach: z.number().nonnegative(),
  vs: z.number(),
  pitch: z.number().min(-90).max(90),
  bank: z.number().min(-180).max(180),
  heading: Heading,
  onGround: z.boolean(),
  onRunway: measured(z.boolean()),
  parkingBrake: measured(z.boolean()),
  gearHandle: measured(z.number().min(0).max(1)),
  flapsIndex: measured(z.number().int().nonnegative()),
  spoilers: measured(z.number().min(0).max(1)),
  engines: z.array(Engine),
  fuelKg: measured(z.number().nonnegative()),
  weightKg: measured(z.number().positive()),
  gForce: z.number(),
  accel: z.object({ lateral: z.number(), vertical: z.number(), longitudinal: z.number() }),
  cabinAlt: measured(z.number()),
  cabinRate: measured(z.number()),
  seatbelts: measured(z.boolean()),
  lights: Lights,
  overspeed: measured(z.boolean()),
  stall: measured(z.boolean()),
  autopilot: measured(z.boolean()),
  pushback: measured(z.boolean()),
  surface: measured(Surface),
  wind: z.object({ dir: Heading, speed: z.number().nonnegative() }),
  oat: z.number(),
  visibilityM: z.number().nonnegative(),
  slew: z.boolean(),
  paused: z.boolean(),
});
export type Sample = z.infer<typeof Sample>;
