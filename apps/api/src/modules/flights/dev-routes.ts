import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { Problem } from "@weems/contrats";
import { z } from "zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { FlightsService } from "./service.ts";

/**
 * Development tools of the flights module, never registered in production (see app.ts):
 * DELETE /v1/flights empties the caller's flight list, to clear test flights.
 * Real flights are never deleted (EF-14).
 */
export function registerDevFlightRoutes(
  parent: FastifyInstance,
  service: FlightsService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.delete(
    "/v1/flights",
    {
      onRequest: guards.pilot,
      schema: {
        tags: ["flights"],
        security: [{ bearer: [] }],
        response: { 204: z.null(), 401: Problem },
      },
    },
    async (request, reply) => {
      await service.deleteAll(callerOf(request));
      return reply.status(204).send(null);
    },
  );
}
