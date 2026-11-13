import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Boarding, FlightId, LiveRoute, Problem } from "@weems/contrats";
import type { LiveService } from "./service.ts";
import type { LiveStream } from "./stream.ts";

/** The live map is served by the web app from another address (and port in development). */
const PUBLIC = { "access-control-allow-origin": "*" };

/**
 * GET /v1/live/stream (SSE), GET /v1/live/flights/{flightId}/route and GET /v1/live/boarding.
 * Public, like the map: they only show what every spectator already sees (call sign, airports,
 * positions, pilots whose profile is public).
 */
export function registerLiveRoutes(
  parent: FastifyInstance,
  stream: LiveStream,
  live: LiveService,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/live/stream",
    {
      schema: {
        tags: ["live"],
        description:
          'Server-sent events: "snapshot" on connection, then "update" every 2 s ' +
          "(formats LiveSnapshot and LiveUpdate of packages/contrats), heartbeat every 15 s.",
      },
    },
    (_request, reply) => {
      reply.hijack();
      stream.connect(reply.raw);
    },
  );

  app.get(
    "/v1/live/flights/:flightId/route",
    {
      schema: {
        tags: ["live"],
        description: "Airports and flown trail of a flight on the live map.",
        params: z.object({ flightId: FlightId }),
        response: { 200: LiveRoute, 400: Problem, 404: Problem },
      },
    },
    async (request, reply) => {
      reply.headers(PUBLIC);
      return live.route(request.params.flightId);
    },
  );

  registerBoardingRoute(parent, live);
}

/** GET /v1/live/boarding: the Departures and Arrivals boards of the page Boarding. */
function registerBoardingRoute(parent: FastifyInstance, live: LiveService): void {
  parent.withTypeProvider<ZodTypeProvider>().get(
    "/v1/live/boarding",
    {
      schema: {
        tags: ["live"],
        description:
          "Departures and Arrivals boards of the page Boarding: every flight live now, and the " +
          "flights landed within the last hour. Read again every few seconds by the site.",
        response: { 200: Boarding },
      },
    },
    async (_request, reply) => {
      reply.headers({ ...PUBLIC, "cache-control": "no-store" });
      return live.boarding();
    },
  );
}
