import { z } from "zod";
import { Heading, Latitude, Longitude, MonotonicMs } from "./common.ts";

/** Values captured by the simulator at each air-to-ground transition. */
export const Touchdown = z.object({
  t: MonotonicMs,
  /** Vertical speed at touchdown in ft/min, negative when descending. */
  vs: z.number(),
  pitch: z.number(),
  bank: z.number(),
  heading: Heading,
  lat: Latitude,
  lon: Longitude,
});
export type Touchdown = z.infer<typeof Touchdown>;
