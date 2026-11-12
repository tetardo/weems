import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { LogbookSummary, Problem } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { PrivateLogbookService } from "./service.ts";

/** GET /v1/me/logbook/summary: page Résumé of the pilot's private logbook. */
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
        tags: ["logbook"],
        security: [{ bearer: [] }],
        description: "Private logbook, page Résumé: every closed flight, hidden ones included.",
        response: { 200: LogbookSummary, 401: Problem },
      },
    },
    async (request) => service.summary(callerOf(request)),
  );
}
