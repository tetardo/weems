import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { Problem, SiteStats } from "@weems/contrats";
import type { StatsService } from "./service.ts";

/**
 * GET /v1/stats: counters of the home page, without account. Rate limited per visitor address
 * like the public profiles; cached 30 s, the numbers need not be exact to the second.
 */
export function registerStatsRoutes(parent: FastifyInstance, service: StatsService): void {
  parent.withTypeProvider<ZodTypeProvider>().get(
    "/v1/stats",
    {
      config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
      schema: {
        tags: ["stats"],
        description: "Pilots (accounts not disabled), recorded flights and flights live now.",
        response: { 200: SiteStats, 429: Problem },
      },
    },
    async (_request, reply) => {
      reply.header("cache-control", "public, max-age=30");
      return service.stats();
    },
  );
}
