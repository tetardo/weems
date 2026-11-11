import { z } from "zod";

export const Simulator = z.enum(["msfs2020", "msfs2024", "replay"]);
export type Simulator = z.infer<typeof Simulator>;

/** Aircraft description, sent when it is loaded and whenever it changes. */
export const AircraftInfo = z.object({
  simulator: Simulator,
  title: z.string().min(1),
  /** May be empty in the simulator: kept as null then. */
  model: z.string().nullable(),
  registration: z.string().nullable(),
  engineCount: z.number().int().min(0).max(8),
  emptyWeightKg: z.number().positive().nullable(),
});
export type AircraftInfo = z.infer<typeof AircraftInfo>;
