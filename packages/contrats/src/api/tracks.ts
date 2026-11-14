import { z } from "zod";
import { FlightPhase } from "../flight/phase.ts";
import { Heading, Latitude, Longitude } from "../telemetry/common.ts";
import { Sample } from "../telemetry/sample.ts";
import { UtcTimestamp } from "./common.ts";

/** One point of a flight's trajectory: a recorded sample, reduced to what pages draw. */
export const TrackPoint = z.object({
  at: UtcTimestamp,
  lat: Latitude,
  lon: Longitude,
  altMsl: z.number(),
  altAgl: z.number(),
  ias: z.number(),
  gs: z.number().nonnegative(),
  vs: z.number(),
  heading: Heading,
  onGround: z.boolean(),
  /**
   * Flight bands (spec carnet privé, § 7), sent by trackers since 12/11/2026: absent on older
   * flights, null when the simulator does not give the value.
   */
  bank: z.number().min(-180).max(180).optional(),
  gForce: z.number().optional(),
  /** Mean N1 of the running engines, percent; null for piston engines. */
  n1: z.number().min(0).max(150).nullable().optional(),
  flapsIndex: z.number().int().nonnegative().nullable().optional(),
  gearHandle: z.number().min(0).max(1).nullable().optional(),
  spoilers: z.number().min(0).max(1).nullable().optional(),
  parkingBrake: z.boolean().nullable().optional(),
  autopilot: z.boolean().nullable().optional(),
  landingLight: z.boolean().nullable().optional(),
  seatbelts: z.boolean().nullable().optional(),
  cabinAlt: z.number().nullable().optional(),
  fuelKg: z.number().nonnegative().nullable().optional(),
});
export type TrackPoint = z.infer<typeof TrackPoint>;

/**
 * The rest of each sample, sent by trackers since 14/11/2026 (fiche 021): kept in the compressed
 * recording for later analyses, never in the simplified points the pages draw. Absent on older
 * flights; inside, unknown values are null as in the sample.
 */
const KeptSampleValues = Sample.pick({
  simTimeUtc: true,
  simRate: true,
  altIndicated: true,
  tas: true,
  mach: true,
  pitch: true,
  onRunway: true,
  engines: true,
  weightKg: true,
  accel: true,
  cabinRate: true,
  lights: true,
  overspeed: true,
  stall: true,
  pushback: true,
  surface: true,
  wind: true,
  oat: true,
  visibilityM: true,
  slew: true,
  paused: true,
}).partial();

/** One point as the tracker records it: what pages draw, plus the rest of the sample. */
export const RecordedPoint = TrackPoint.extend(KeptSampleValues.shape);
export type RecordedPoint = z.infer<typeof RecordedPoint>;

/** PUT /v1/flights/{flightId}/track: the whole trajectory, once, after closing (spec J2). */
export const TrackUpload = z.object({
  points: z.array(RecordedPoint).min(1).max(100_000),
});
export type TrackUpload = z.infer<typeof TrackUpload>;

/** GET /v1/flights/{flightId}/track: simplified for the map and the vertical profile. */
export const TrackView = z.object({
  /** Number of points received from the tracker. */
  recordedPoints: z.number().int().nonnegative(),
  points: z.array(TrackPoint.extend({ phase: FlightPhase.nullable() })),
});
export type TrackView = z.infer<typeof TrackView>;
