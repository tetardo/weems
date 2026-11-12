import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FlightBands, FlightId, LogbookEntries, LogbookSummary, Problem } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { PrivateLogbookService } from "./service.ts";

const security = [{ bearer: [] }];
const tags = ["logbook"];

/** The pilot's private logbook (spec carnet privé): pages Résumé and Vols. */
export function registerPrivateLogbookRoutes(
  parent: FastifyInstance,
  service: PrivateLogbookService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/me/logbook/summary",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        description: "Private logbook, page Résumé: every closed flight, hidden ones included.",
        response: { 200: LogbookSummary, 401: Problem },
      },
    },
    async (request) => service.summary(callerOf(request)),
  );
  app.get(
    "/v1/me/logbook/entries",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        description: "Private logbook, page Vols: every closed flight with its verdict.",
        response: { 200: LogbookEntries, 401: Problem },
      },
    },
    async (request) => service.entries(callerOf(request)),
  );
  app.get(
    "/v1/me/logbook/flights/:flightId/bands",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        params: z.object({ flightId: FlightId }),
        description: "Flight bands: one column per minute; marks for Pilot Pro only.",
        response: { 200: FlightBands, 401: Problem, 404: Problem },
      },
    },
    async (request) => service.bands(callerOf(request), request.params.flightId),
  );
}
