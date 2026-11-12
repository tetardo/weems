import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { PilotLogbook, PilotRoutes, Problem, PublicFlightList } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { LogbookService } from "./logbook-service.ts";
import { listQuery } from "./public-routes.ts";

const tags = ["profiles"];
const security = [{ bearer: [] }];
const errors = { 400: Problem, 401: Problem, 404: Problem };

/** HTTP layer of the pilot's own logbook (the « Mon carnet de bord » page of the site). */
export function registerLogbookRoutes(
  parent: FastifyInstance,
  service: LogbookService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const own = { onRequest: guards.pilot };
  app.get(
    "/v1/me/logbook",
    { ...own, schema: { tags, security, response: { 200: PilotLogbook, ...errors } } },
    async (request) => service.logbook(callerOf(request)),
  );
  app.get(
    "/v1/me/logbook/flights",
    {
      ...own,
      schema: {
        tags,
        security,
        querystring: listQuery,
        response: { 200: PublicFlightList, ...errors },
      },
    },
    async (request) => service.flightList(callerOf(request), request.query),
  );
  app.get(
    "/v1/me/logbook/routes",
    { ...own, schema: { tags, security, response: { 200: PilotRoutes, ...errors } } },
    async (request) => service.routes(callerOf(request)),
  );
}
