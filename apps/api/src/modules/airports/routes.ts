import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AirportList, AirportsQuery, Problem } from "@weems/contrats";
import type { AirportsService } from "./service.ts";

/**
 * GET /v1/airports?codes=LFPG,LFBO. Public reference data (OurAirports), read by the live map
 * from the browser: open to every origin, and cacheable for a day.
 */
export function registerAirportRoutes(parent: FastifyInstance, airports: AirportsService): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/airports",
    {
      schema: {
        tags: ["airports"],
        description: "Airports by code (at most 100 per request); unknown codes are left out.",
        querystring: AirportsQuery,
        response: { 200: AirportList, 400: Problem },
      },
    },
    async (request, reply) => {
      reply.headers({
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=86400",
      });
      return { airports: airports.findAll(request.query.codes) };
    },
  );
}
