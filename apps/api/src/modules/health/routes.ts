import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const Health = z.object({
  status: z.enum(["ok", "degraded"]),
  database: z.enum(["ok", "unreachable"]),
});

/** GET /v1/health: for Docker and monitoring. 503 when the database does not answer. */
export function registerHealthRoutes(
  parent: FastifyInstance,
  pingDatabase: () => Promise<void>,
): void {
  parent
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/v1/health",
      { schema: { tags: ["health"], response: { 200: Health, 503: Health } } },
      async (_request, reply) => {
        try {
          await pingDatabase();
          return { status: "ok" as const, database: "ok" as const };
        } catch {
          return reply.status(503).send({ status: "degraded", database: "unreachable" });
        }
      },
    );
}
