import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { NavaidList, NavaidsQuery, Problem } from "@weems/contrats";
import type { NavaidsService } from "./navaids-service.ts";
import { PUBLIC_HEADERS } from "./public-headers.ts";

/** GET /v1/navaids?lat=…&lon=…&radiusNm=…: radio aids around a point. */
export function registerNavaidRoutes(parent: FastifyInstance, navaids: NavaidsService): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/navaids",
    {
      schema: {
        tags: ["airports"],
        description:
          "Radio aids (VOR, DME, NDB, TACAN) around a point, nearest first (at most 200).",
        querystring: NavaidsQuery,
        response: { 200: NavaidList, 400: Problem },
      },
    },
    async (request, reply) => {
      reply.headers(PUBLIC_HEADERS);
      return { navaids: navaids.near(request.query) };
    },
  );
}
