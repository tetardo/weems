import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { MyPlan, PlanCatalog, Problem } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { PlansService } from "./service.ts";

const tags = ["plans"];

/**
 * GET /v1/plans: the plans and what they include (page Offres of the site), without account,
 * rate limited per visitor address, cached 5 min. GET /v1/me/plan: the caller's plan.
 */
export function registerPlanRoutes(
  parent: FastifyInstance,
  service: PlansService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/plans",
    {
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
      schema: {
        tags,
        description: "Subscription plans: audience, prices, features and limits of each plan.",
        response: { 200: PlanCatalog, 429: Problem },
      },
    },
    async (_request, reply) => {
      reply.header("cache-control", "public, max-age=300");
      return service.catalog();
    },
  );
  app.get(
    "/v1/me/plan",
    {
      onRequest: guards.pilot,
      schema: { tags, security: [{ bearer: [] }], response: { 200: MyPlan, 401: Problem } },
    },
    async (request) => service.planOf(callerOf(request).pilotId),
  );
}
