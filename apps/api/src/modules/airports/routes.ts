import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AirportDetail, AirportList, AirportParams, AirportsQuery, Problem } from "@weems/contrats";
import type { AirportsService } from "./service.ts";

/** Public reference data (OurAirports), read from the browser: open to every origin, cacheable for a day. */
const PUBLIC_HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=86400",
};

/** GET /v1/airports?codes=LFPG,LFBO (the live map) and GET /v1/airports/{icao} (one airport, in full). */
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
      reply.headers(PUBLIC_HEADERS);
      return { airports: airports.findAll(request.query.codes) };
    },
  );
  app.get(
    "/v1/airports/:icao",
    {
      schema: {
        tags: ["airports"],
        description: "One airport with its runways and radio frequencies.",
        params: AirportParams,
        response: { 200: AirportDetail, 400: Problem, 404: Problem },
      },
    },
    async (request, reply) => {
      reply.headers(PUBLIC_HEADERS);
      return airports.detail(request.params.icao);
    },
  );
}
