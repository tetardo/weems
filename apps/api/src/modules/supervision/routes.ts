import { AdminSupervision, Problem } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Guards } from "../../plugins/auth.ts";
import type { SupervisionService } from "./service.ts";

/**
 * GET /v1/admin/supervision: the page Supervision of the local console (console spec).
 * Administrators only, logged in with a session cookie, like every /v1/admin/* route.
 */
export function registerSupervisionRoutes(
  parent: FastifyInstance,
  service: SupervisionService,
  guards: Guards,
): void {
  parent.withTypeProvider<ZodTypeProvider>().get(
    "/v1/admin/supervision",
    {
      onRequest: guards.admin,
      schema: {
        tags: ["admin"],
        security: [{ session: [] }],
        description:
          "Counters, health, activity and community of the console's page Supervision; real accounts and flights apart from the fictitious and simulated ones.",
        response: { 200: AdminSupervision, 401: Problem, 403: Problem },
      },
    },
    async () => service.supervision(),
  );
}
