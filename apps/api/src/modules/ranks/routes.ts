import { MyRank, Problem } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { RanksService } from "./service.ts";

/** GET /v1/me/rank: card « Votre grade » of the private logbook (spec grades des pilotes). */
export function registerRankRoutes(
  parent: FastifyInstance,
  service: RanksService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/me/rank",
    {
      onRequest: guards.pilot,
      schema: {
        tags: ["ranks"],
        security: [{ bearer: [] }],
        response: { 200: MyRank, 401: Problem },
      },
    },
    async (request) => service.mine(callerOf(request).pilotId),
  );
}
