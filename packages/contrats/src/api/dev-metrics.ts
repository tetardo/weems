import { z } from "zod";

/**
 * GET /v1/dev/metrics, outside production only (spec J4 montée en charge):
 * what the load test reads from the API while it runs.
 */
export const DevMetrics = z.object({
  /** Event loop delay since the previous reading, ms. */
  eventLoopDelayMs: z.object({ p50: z.number(), p99: z.number(), max: z.number() }),
  memoryMb: z.object({ rss: z.number(), heapUsed: z.number() }),
  live: z.object({ viewers: z.number().int(), flights: z.number().int() }),
});
export type DevMetrics = z.infer<typeof DevMetrics>;
