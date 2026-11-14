import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FlightId, Problem, Receipt, TrackUpload, TrackView } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { TracksService } from "./service.ts";

const params = z.object({ flightId: FlightId });
const errors = { 400: Problem, 401: Problem, 404: Problem, 409: Problem, 426: Problem };
const security = [{ bearer: [] }];
/**
 * Decompressed size (the tracker sends gzip, about 10 times smaller): a recorded point is about
 * 1 KB of JSON (fiche 021), so 128 MB covers the 100 000 points the contract accepts.
 */
const TRACK_BODY_LIMIT = 128 * 1024 * 1024;

/** HTTP layer of the trajectories (spec J2): schemas and status codes only. */
export function registerTrackRoutes(
  parent: FastifyInstance,
  service: TracksService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/v1/flights/:flightId/track",
    {
      onRequest: guards.tracker,
      bodyLimit: TRACK_BODY_LIMIT,
      schema: {
        tags: ["tracks"],
        security,
        params,
        body: TrackUpload,
        response: { 200: Receipt, 201: Receipt, ...errors },
      },
    },
    async (request, reply) => {
      const receipt = await service.upload(
        callerOf(request),
        request.params.flightId,
        request.body.points,
      );
      return reply.status(receipt.result === "created" ? 201 : 200).send(receipt);
    },
  );

  app.get(
    "/v1/flights/:flightId/track",
    {
      onRequest: guards.pilot,
      schema: { tags: ["tracks"], security, params, response: { 200: TrackView, ...errors } },
    },
    async (request) => service.read(callerOf(request), request.params.flightId),
  );
}
