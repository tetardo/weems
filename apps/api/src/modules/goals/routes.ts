import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { GoalDefinition, Goals, GoalView, Problem } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { GoalsService } from "./service.ts";

const security = [{ bearer: [] }];
const tags = ["goals"];
const params = z.object({ goalId: z.uuid() });
const errors = { 400: Problem, 401: Problem, 403: Problem, 404: Problem };

/** Changing a goal: replace its definition, or set it aside. */
function registerGoalChanges(parent: FastifyInstance, service: GoalsService, guards: Guards) {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.put(
    "/v1/me/goals/:goalId",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        params,
        body: GoalDefinition,
        response: { 200: GoalView, ...errors },
      },
    },
    async (request) => service.update(callerOf(request), request.params.goalId, request.body),
  );
  app.post(
    "/v1/me/goals/:goalId/archive",
    {
      onRequest: guards.pilot,
      schema: { tags, security, params, response: { 200: GoalView, ...errors } },
    },
    async (request) => service.archive(callerOf(request), request.params.goalId),
  );
}

/** Objectifs of the private logbook (spec carnet privé, § 6): schemas only. */
export function registerGoalRoutes(
  parent: FastifyInstance,
  service: GoalsService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/me/goals",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        description: "Running and finished goals, their progress, and suggestions (Pilot Pro).",
        response: { 200: Goals, 401: Problem },
      },
    },
    async (request) => service.list(callerOf(request)),
  );
  app.post(
    "/v1/me/goals",
    {
      onRequest: guards.pilot,
      schema: {
        tags,
        security,
        description: "New goal; for a free pilot it sets the running one aside.",
        body: GoalDefinition,
        response: { 201: GoalView, ...errors },
      },
    },
    async (request, reply) =>
      reply.code(201).send(await service.create(callerOf(request), request.body)),
  );
  registerGoalChanges(parent, service, guards);
}
