import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FlightId, LiveRoute, Problem } from "@weems/contrats";
import type { LiveService } from "./service.ts";
import type { LiveStream } from "./stream.ts";

/** The live map is served by the web app from another address (and port in development). */
const PUBLIC = { "access-control-allow-origin": "*" };

/**
 * GET /v1/live/stream (SSE) and GET /v1/live/flights/{flightId}/route. Public, like the map:
 * they only show what every spectator already sees (call sign, airports, positions).
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
}
