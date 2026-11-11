import type { FastifyInstance } from "fastify";
import type { LiveStream } from "./stream.ts";

/**
 * GET /v1/live/stream (SSE). Public at J1: only simulated pilots are shown.
 * Access rules (private profiles) arrive with accounts at J3.
 */
export function registerLiveRoutes(app: FastifyInstance, stream: LiveStream): void {
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
}
