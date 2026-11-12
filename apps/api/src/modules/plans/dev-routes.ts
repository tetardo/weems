import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { MyPlan, Problem, TestPlanChange } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { PlansService } from "./service.ts";

/**
 * PUT /v1/dev/me/plan: the Free/Pro test switch of the site bar changes the caller's plan, so
 * that every locked card can be tried. Never registered in production (see app.ts); removed
 * before the 1.0.
 */
export function registerDevPlanRoutes(
  parent: FastifyInstance,
  service: PlansService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.put(
    "/v1/dev/me/plan",
    {
      onRequest: guards.pilot,
      schema: {
        tags: ["plans"],
        security: [{ bearer: [] }],
        body: TestPlanChange,
        response: { 200: MyPlan, 400: Problem, 401: Problem },
      },
    },
    async (request) => service.setTestPlan(callerOf(request).pilotId, request.body.plan),
  );
}
