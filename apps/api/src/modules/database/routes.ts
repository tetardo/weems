import {
  AdminDatabase,
  DatabaseCleanupRequest,
  DatabaseCleanupResult,
  Problem,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Guards } from "../../plugins/auth.ts";
import type { DatabaseService } from "./service.ts";

const tags = ["admin"];
const security = [{ session: [] }];
const errors = { 401: Problem, 403: Problem };

/**
 * Page Base de données of the local console (console spec). Administrators only, logged in
 * with a session cookie, like every /v1/admin/* route.
 */
export function registerDatabaseRoutes(
  parent: FastifyInstance,
  service: DatabaseService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/admin/database",
    {
      onRequest: guards.admin,
      schema: {
        tags,
        security,
        description:
          "Size of each table, state of each migration and what the cleanup would delete now.",
        response: { 200: AdminDatabase, ...errors },
      },
    },
    async () => service.database(),
  );
  app.post(
    "/v1/admin/database/cleanup",
    {
      onRequest: guards.admin,
      schema: {
        tags,
        security,
        description:
          "Deletes the simulated flights older than 7 days, the expired sessions and invitations, as asked. Never a real flight.",
        body: DatabaseCleanupRequest,
        response: { 200: DatabaseCleanupResult, 400: Problem, ...errors },
      },
    },
    async (request) => service.cleanup(request.body),
  );
}
