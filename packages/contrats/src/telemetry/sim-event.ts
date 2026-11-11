import { z } from "zod";
import { MonotonicMs } from "./common.ts";

export const SimEventType = z.enum([
  "simStarted",
  "simStopped",
  "paused",
  "unpaused",
  "flightLoaded",
  "aircraftLoaded",
  "positionChanged",
  "crashed",
  "connectionLost",
  "connectionRestored",
]);
export type SimEventType = z.infer<typeof SimEventType>;

/** One-off simulator event, already de-duplicated by the connector. */
export const SimEvent = z.object({
  t: MonotonicMs,
  type: SimEventType,
});
export type SimEvent = z.infer<typeof SimEvent>;
