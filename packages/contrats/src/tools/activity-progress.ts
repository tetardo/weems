import { z } from "zod";

/**
 * Lines written by `pnpm populate --progress` (one JSON object per line), read by the admin
 * console (spec admin, page Activité simulée). Not an API format: a contract between two programs.
 */

const Count = z.object({
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/** Creating the fictitious population: accounts and profiles, past flights, then a check. */
export const PopulationStep = z.enum(["cleaning", "accounts", "flights", "check"]);
export type PopulationStep = z.infer<typeof PopulationStep>;

export const PopulationProgress = z.object({
  step: PopulationStep,
  accounts: Count,
  flights: Count,
  /** Flights per second over the last readings (0 before the first flight). */
  flightsPerS: z.number().nonnegative(),
});
export type PopulationProgress = z.infer<typeof PopulationProgress>;

export const PopulationResult = z.object({
  stopped: z.boolean(),
  accounts: z.number().int().nonnegative(),
  publicProfiles: z.number().int().nonnegative(),
  /** Flights the API holds for the fictitious accounts, out of the flights planned. */
  flights: Count,
  /** Public profiles whose counters and charts are filled (at least one flight), out of all. */
  filledProfiles: Count,
  durationS: z.number().nonnegative(),
});
export type PopulationResult = z.infer<typeof PopulationResult>;

export const PopulationLine = z.discriminatedUnion("type", [
  PopulationProgress.extend({ type: z.literal("progress") }),
  PopulationResult.extend({ type: z.literal("result") }),
]);
export type PopulationLine = z.infer<typeof PopulationLine>;

/** Live activity: fictitious accounts flying now, and visitors watching the live map. */
export const LiveActivityProgress = z.object({
  /** Flights in the air now. */
  airborne: z.number().int().nonnegative(),
  /** Flights started since the beginning. */
  departed: z.number().int().nonnegative(),
  /** Visitors connected to the live map now, out of those asked. */
  visitors: Count,
  elapsedS: z.number().nonnegative(),
  durationS: z.number().nonnegative(),
});
export type LiveActivityProgress = z.infer<typeof LiveActivityProgress>;

export const LiveActivityLine = z.discriminatedUnion("type", [
  LiveActivityProgress.extend({ type: z.literal("progress") }),
  z.object({
    type: z.literal("result"),
    stopped: z.boolean(),
    departed: z.number().int().nonnegative(),
    /** Flights closed normally, and flights closed as interrupted at the end. */
    landed: z.number().int().nonnegative(),
    interrupted: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
  }),
]);
export type LiveActivityLine = z.infer<typeof LiveActivityLine>;
