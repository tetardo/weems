import { z } from "zod";

/** Latitude in decimal degrees. */
export const Latitude = z.number().min(-90).max(90);

/** Longitude in decimal degrees. */
export const Longitude = z.number().min(-180).max(180);

/** Heading or direction in degrees, 0 (inclusive) to 360 (exclusive). */
export const Heading = z.number().min(0).lt(360);

/** Monotonic local time in milliseconds, used for every duration computation. */
export const MonotonicMs = z.number().int().nonnegative();

/**
 * A measured value that may be unavailable for some aircraft.
 * Unknown is always `null`, never 0: the tracker shows "not measured" and never penalises the pilot.
 */
export const measured = <T extends z.ZodType>(schema: T) => schema.nullable();
