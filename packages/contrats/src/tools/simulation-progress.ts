import { z } from "zod";
import { FlightPhase } from "../flight/phase.ts";

/**
 * Lines written by `pnpm simulate --progress` (one JSON object per line), read by the admin
 * console (spec admin, page Trafic simulé). Not an API format: a contract between two programs.
 */

export const PilotProgress = z.object({
  callsign: z.string(),
  departure: z.string(),
  arrival: z.string(),
  /** Null before departure. */
  phase: FlightPhase.nullable(),
  /** Share of the replay played, 0 to 1. */
  progress: z.number().min(0).max(1),
  /** Messages waiting in this tracker's outbox. */
  pending: z.number().int().nonnegative(),
});
export type PilotProgress = z.infer<typeof PilotProgress>;

export const SimulationProgress = z.object({
  total: z.number().int().nonnegative(),
  /** Pilots whose tracker has started. */
  departed: z.number().int().nonnegative(),
  /** Pilots in each phase (pilots not departed are not counted). */
  phases: z.record(z.string(), z.number().int()),
  /** Messages waiting in the outboxes. */
  pending: z.number().int().nonnegative(),
  pilots: z.array(PilotProgress),
});
export type SimulationProgress = z.infer<typeof SimulationProgress>;

export const SimulationLine = z.discriminatedUnion("type", [
  SimulationProgress.extend({ type: z.literal("progress") }),
  z.object({
    type: z.literal("result"),
    /** Stopped before the end (Ctrl+C, admin console). */
    stopped: z.boolean(),
    flights: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
  }),
]);
export type SimulationLine = z.infer<typeof SimulationLine>;
