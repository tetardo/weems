import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { DevMetrics } from "@weems/contrats";
import type { LiveBoard } from "./live-board.ts";
import { RuntimeMetrics } from "./runtime-metrics.ts";
import type { LiveStream } from "./stream.ts";

/**
 * Development tools of the live module, never registered in production (see app.ts):
 * GET /v1/dev/metrics, read by the load test (spec J4 montée en charge).
 * Public like the live stream: it shows counts and timings, nothing personal.
 */
export function registerDevLiveRoutes(
  parent: FastifyInstance,
  board: LiveBoard,
  stream: LiveStream,
): void {
  const metrics = new RuntimeMetrics();
  parent.addHook("onReady", async () => metrics.start());
  parent.addHook("preClose", async () => metrics.stop());
  parent
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/v1/dev/metrics",
      { schema: { tags: ["live"], response: { 200: DevMetrics } } },
      async () => ({
        ...metrics.read(),
        live: { viewers: stream.clientCount, flights: board.flightCount },
      }),
    );
}
