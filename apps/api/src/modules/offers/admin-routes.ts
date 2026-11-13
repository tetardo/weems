import {
  AdminAmbassador,
  AdminAmbassadors,
  AdminCampaigns,
  AMBASSADOR_PHOTO_MAX_BYTES,
  AmbassadorSettings,
  AmbassadorSlug,
  NewCodeBatch,
  Problem,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Guards } from "../../plugins/auth.ts";
import { ApiProblem } from "../../plugins/problem.ts";
import type { AmbassadorsService } from "./ambassadors-service.ts";
import type { OffersService } from "./service.ts";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const tags = ["admin"];
const security = [{ session: [] }];
const errors = { 401: Problem, 403: Problem };
const idParams = z.object({ id: z.uuid() });
const slugParams = z.object({ slug: AmbassadorSlug });

const typed = (scope: FastifyInstance) => scope.withTypeProvider<ZodTypeProvider>();
type App = ReturnType<typeof typed>;

/**
 * Pages Codes of the console: batches of single codes, their CSV, cancelling, and the
 * ambassadors with their shared code and photo. Administrators only (guards.admin).
 */
export function registerAdminOfferRoutes(
  parent: FastifyInstance,
  services: { offers: OffersService; ambassadors: AmbassadorsService },
  guards: Guards,
): void {
  void parent.register(async (scope) => {
    scope.removeContentTypeParser(IMAGE_TYPES);
    scope.addContentTypeParser(
      IMAGE_TYPES,
      { parseAs: "buffer", bodyLimit: AMBASSADOR_PHOTO_MAX_BYTES },
      (_request, body, done) => done(null, body),
    );
    const app = typed(scope);
    const base = { onRequest: guards.admin };
    registerCampaigns(app, services.offers, base);
    registerAmbassadors(app, services.ambassadors, base);
  });
}

function registerCampaigns(app: App, service: OffersService, base: { onRequest: Guards["admin"] }) {
  app.get(
    "/v1/admin/codes",
    { ...base, schema: { tags, security, response: { 200: AdminCampaigns, ...errors } } },
    async () => service.campaigns(),
  );
  app.post(
    "/v1/admin/codes/batches",
    {
      ...base,
      schema: {
        tags,
        security,
        body: NewCodeBatch,
        response: { 201: z.object({ id: z.uuid() }), 400: Problem, ...errors },
      },
    },
    async (request, reply) =>
      reply.status(201).send({ id: await service.createBatch(request.body) }),
  );
  app.get(
    "/v1/admin/codes/:id/csv",
    { ...base, schema: { tags, security, params: idParams } },
    async (request, reply) =>
      reply
        .type("text/csv; charset=utf-8")
        .header("content-disposition", `attachment; filename="codes-${request.params.id}.csv"`)
        .send(await service.csv(request.params.id)),
  );
  app.post(
    "/v1/admin/codes/:id/cancel",
    {
      ...base,
      schema: {
        tags,
        security,
        params: idParams,
        response: { 204: z.null(), 404: Problem, ...errors },
      },
    },
    async (request, reply) => {
      await service.cancel(request.params.id);
      return reply.status(204).send(null);
    },
  );
}

function registerAmbassadors(
  app: App,
  service: AmbassadorsService,
  base: { onRequest: Guards["admin"] },
) {
  app.get(
    "/v1/admin/ambassadors",
    { ...base, schema: { tags, security, response: { 200: AdminAmbassadors, ...errors } } },
    async () => service.list(),
  );
  app.put(
    "/v1/admin/ambassadors/:slug",
    {
      ...base,
      schema: {
        tags,
        security,
        params: slugParams,
        body: AmbassadorSettings,
        response: { 200: AdminAmbassador, 400: Problem, 409: Problem, 422: Problem, ...errors },
      },
    },
    async (request) => service.save(request.params.slug, request.body),
  );
  app.put(
    "/v1/admin/ambassadors/:slug/photo",
    {
      ...base,
      schema: {
        tags,
        security,
        params: slugParams,
        response: { 204: z.null(), 404: Problem, 415: Problem, 422: Problem, ...errors },
      },
    },
    async (request, reply) => {
      if (!Buffer.isBuffer(request.body)) {
        throw new ApiProblem(415, "Unsupported Media Type", "Send a JPEG, PNG or WebP image.");
      }
      await service.savePhoto(request.params.slug, request.body);
      return reply.status(204).send(null);
    },
  );
}
