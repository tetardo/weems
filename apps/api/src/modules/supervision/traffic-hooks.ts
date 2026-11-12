import type { FastifyInstance } from "fastify";
import type { TrafficMetrics } from "./traffic-metrics.ts";

/** Open for as long as a spectator watches the map: its duration says nothing of the API. */
const LONG_LIVED_ROUTES = new Set(["/v1/live/stream"]);
const POSITIONS_ROUTE = "/v1/flights/:flightId/positions";

/** Feeds the traffic metrics with every answered request (page Supervision of the console). */
export function registerTrafficHooks(app: FastifyInstance, metrics: TrafficMetrics): void {
  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url;
    const now = Date.now();
    if (route === POSITIONS_ROUTE && reply.statusCode < 300) metrics.position(now);
    if (route === undefined || LONG_LIVED_ROUTES.has(route)) return;
    metrics.request(reply.elapsedTime, reply.statusCode, now);
  });
}
