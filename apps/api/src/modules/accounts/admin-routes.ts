import {
  AccountUpdate,
  AdminAccount,
  AdminAccountList,
  AdminInvitation,
  AdminMe,
  InvitationRequest,
  Problem,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { AdminAccountsService } from "./admin-service.ts";

const security = [{ session: [] }];
const errors = { 401: Problem, 403: Problem };
const CodeParams = z.object({ code: z.string().min(1) });
const tags = ["admin"];

/** The Fastify instance with Zod schemas. */
function typed(parent: FastifyInstance) {
  return parent.withTypeProvider<ZodTypeProvider>();
}
type App = ReturnType<typeof typed>;
interface Base {
  onRequest: Guards["admin"];
}

/**
 * Routes /v1/admin/*, for the local console (console spec, page Comptes).
 * Administrators only, logged in with a session cookie (guards.admin).
 */
export function registerAdminAccountRoutes(
  parent: FastifyInstance,
  service: AdminAccountsService,
  guards: Guards,
): void {
  const app = typed(parent);
  const base: Base = { onRequest: guards.admin };
  registerAccounts(app, service, base);
  registerInvitations(app, service, base);
}

function registerAccounts(app: App, service: AdminAccountsService, base: Base): void {
  app.get(
    "/v1/admin/me",
    { ...base, schema: { tags, security, response: { 200: AdminMe, ...errors } } },
    async (request) => {
      const { id, name, email } = await service.account(callerOf(request).pilotId);
      return { id, name, email };
    },
  );
  app.get(
    "/v1/admin/accounts",
    { ...base, schema: { tags, security, response: { 200: AdminAccountList, ...errors } } },
    async () => service.list(),
  );
  app.patch(
    "/v1/admin/accounts/:id",
    {
      ...base,
      schema: {
        tags,
        security,
        params: z.object({ id: z.uuid() }),
        body: AccountUpdate,
        response: { 200: AdminAccount, 404: Problem, 409: Problem, ...errors },
      },
    },
    async (request) => service.update(callerOf(request).pilotId, request.params.id, request.body),
  );
}

function registerInvitations(app: App, service: AdminAccountsService, base: Base): void {
  app.post(
    "/v1/admin/invitations",
    {
      ...base,
      schema: {
        tags,
        security,
        body: InvitationRequest,
        response: { 201: AdminInvitation, 409: Problem, ...errors },
      },
    },
    async (request, reply) => reply.status(201).send(await service.invite(request.body)),
  );
  app.post(
    "/v1/admin/invitations/:code/renew",
    {
      ...base,
      schema: {
        tags,
        security,
        params: CodeParams,
        response: { 200: AdminInvitation, 404: Problem, ...errors },
      },
    },
    async (request) => service.renew(request.params.code),
  );
  app.delete(
    "/v1/admin/invitations/:code",
    {
      ...base,
      schema: {
        tags,
        security,
        params: CodeParams,
        response: { 204: z.null(), 404: Problem, ...errors },
      },
    },
    async (request, reply) => {
      await service.cancel(request.params.code);
      return reply.status(204).send(null);
    },
  );
}
