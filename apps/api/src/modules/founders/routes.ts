import { AdminFounders, MyFounder, Problem, PublicFounders } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { FoundersService } from "./service.ts";

const tags = ["founders"];
const NumberParams = z.object({ number: z.coerce.number().int().positive() });

/**
 * GET /v1/founders (public, rate limited, cached 1 min): places and latest founders, for the
 * page Offres. GET /v1/me/founder: the caller's progress or place.
 */
export function registerFounderRoutes(
  parent: FastifyInstance,
  service: FoundersService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/founders",
    {
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
      schema: { tags, response: { 200: PublicFounders, 429: Problem } },
    },
    async (_request, reply) => {
      reply.header("cache-control", "public, max-age=60");
      return service.public();
    },
  );
  app.get(
    "/v1/me/founder",
    {
      onRequest: guards.pilot,
      schema: { tags, security: [{ bearer: [] }], response: { 200: MyFounder, 401: Problem } },
    },
    async (request) => service.mine(callerOf(request).pilotId),
  );
}

/** Page Fondateurs of the console: every place, confirmation and refusal. */
export function registerAdminFounderRoutes(
  parent: FastifyInstance,
  service: FoundersService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const security = [{ session: [] }];
  const errors = { 401: Problem, 403: Problem };
  const base = { onRequest: guards.admin };
  app.get(
    "/v1/admin/founders",
    { ...base, schema: { tags: ["admin"], security, response: { 200: AdminFounders, ...errors } } },
    async () => service.adminList(),
  );
  for (const action of ["confirm", "refuse"] as const) {
    app.post(
      `/v1/admin/founders/:number/${action}`,
      {
        ...base,
        schema: {
          tags: ["admin"],
          security,
          params: NumberParams,
          response: { 204: z.null(), 404: Problem, 409: Problem, ...errors },
        },
      },
      async (request, reply) => {
        await service[action](request.params.number);
        return reply.status(204).send(null);
      },
    );
  }
}
