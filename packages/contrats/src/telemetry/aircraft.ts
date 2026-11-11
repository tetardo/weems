import { z } from "zod";

export const Simulator = z.enum(["msfs2020", "msfs2024", "replay"]);
export type Simulator = z.infer<typeof Simulator>;

/** Kind of engines, as the simulator describes them (used to classify unknown types). */
export const EngineType = z.enum(["piston", "turboprop", "jet", "helicopterTurbine", "none"]);
export type EngineType = z.infer<typeof EngineType>;

/** Fixed or rotary wing, as the simulator describes the aircraft. */
export const Airframe = z.enum(["airplane", "helicopter"]);
export type Airframe = z.infer<typeof Airframe>;

/** Aircraft description, sent when it is loaded and whenever it changes. */
export const AircraftInfo = z.object({
  simulator: Simulator,
  title: z.string().min(1),
  /** ICAO type designator (ATC MODEL). May be empty in the simulator: kept as null then. */
  model: z.string().nullable(),
  registration: z.string().nullable(),
  engineCount: z.number().int().min(0).max(8),
  emptyWeightKg: z.number().positive().nullable(),
  /** The three fields below came with the aircraft categories: null from older trackers. */
  engineType: EngineType.nullable().default(null),
  airframe: Airframe.nullable().default(null),
  maxGrossWeightKg: z.number().positive().nullable().default(null),
});
export type AircraftInfo = z.infer<typeof AircraftInfo>;
