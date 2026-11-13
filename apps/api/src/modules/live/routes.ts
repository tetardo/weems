import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Boarding, FlightId, LiveRoute, LiveTrail, Problem } from "@weems/contrats";
import type { BoardingStream } from "./boarding-stream.ts";
import type { LiveService } from "./service.ts";
import type { LiveStream } from "./stream.ts";

/** The live map is served by the web app from another address (and port in development). */
const PUBLIC = { "access-control-allow-origin": "*" };

/**
 * GET /v1/live/stream (SSE), GET /v1/live/flights/{flightId}/route and /trail, GET
 * /v1/live/boarding and GET /v1/live/boarding/stream (SSE).
 * Public, like the map: they only show what every spectator already sees (call sign, airports,
 * positions with altitude and speeds, pilots whose profile is public).
 */
export function registerLiveRoutes(
  parent: FastifyInstance,
  streams: { live: LiveStream; boarding: BoardingStream },
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
      streams.live.connect(reply.raw);
    },
  );
  registerFlightRoutes(parent, live);
  registerBoardingRoutes(parent, streams.boarding, live);
}

/**
 * GET /v1/live/flights/{flightId}/route (the followed flight of the live map) and /trail (the page
 * of a flight in progress).
 */
function registerFlightRoutes(parent: FastifyInstance, live: LiveService): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
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

  app.get(
    "/v1/live/flights/:flightId/trail",
    {
      schema: {
        tags: ["live"],
        description:
          "Altitude, ground speed, vertical speed and phase along the trail of a flight on the live " +
          "map: profile and bands of the page of a flight in progress.",
        params: z.object({ flightId: FlightId }),
        response: { 200: LiveTrail, 400: Problem, 404: Problem },
      },
    },
    async (request, reply) => {
      reply.headers(PUBLIC);
      return live.trail(request.params.flightId);
    },
  );
}

/**
 * GET /v1/live/boarding/stream, followed by the page Boarding, and GET /v1/live/boarding: the
 * Departures and Arrivals boards, once.
 */
function registerBoardingRoutes(
  parent: FastifyInstance,
  stream: BoardingStream,
  live: LiveService,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/live/boarding/stream",
    {
      schema: {
        tags: ["live"],
        description:
          'Server-sent events of the page Boarding: "board" (format Boarding of ' +
          "packages/contrats) on connection and every time the boards change, heartbeat every 15 s.",
      },
    },
    (_request, reply) => {
      reply.hijack();
      stream.connect(reply.raw);
    },
  );
  app.get(
    "/v1/live/boarding",
    {
      schema: {
        tags: ["live"],
        description:
          "Departures and Arrivals boards of the page Boarding: every flight live now, and the " +
          "flights landed within the last hour. The page follows /v1/live/boarding/stream instead.",
        response: { 200: Boarding },
      },
    },
    async (_request, reply) => {
      reply.headers({ ...PUBLIC, "cache-control": "no-store" });
      return live.boarding();
    },
  );
}
