import { z } from "zod";
import { FlightPhase } from "../flight/phase.ts";
import { Heading, Latitude, Longitude } from "../telemetry/common.ts";
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
});
export type TrackPoint = z.infer<typeof TrackPoint>;

/** PUT /v1/flights/{flightId}/track: the whole trajectory, once, after closing (spec J2). */
export const TrackUpload = z.object({
  points: z.array(TrackPoint).min(1).max(100_000),
});
export type TrackUpload = z.infer<typeof TrackUpload>;

/** GET /v1/flights/{flightId}/track: simplified for the map and the vertical profile. */
export const TrackView = z.object({
  /** Number of points received from the tracker. */
  recordedPoints: z.number().int().nonnegative(),
  points: z.array(TrackPoint.extend({ phase: FlightPhase.nullable() })),
});
export type TrackView = z.infer<typeof TrackView>;
