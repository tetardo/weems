import {
  HOME_IMAGE_MAX_BYTES,
  HomeImageSettings,
  HomeImages,
  HomeTheme,
  Problem,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import { ApiProblem } from "../../plugins/problem.ts";
import type { SiteService } from "./service.ts";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const tags = ["admin"];
const security = [{ session: [] }];
const errors = { 400: Problem, 401: Problem, 403: Problem, 404: Problem, 422: Problem };
const url = "/v1/admin/site/home-images/:theme";
const params = z.object({ theme: HomeTheme });

/**
 * Routes /v1/admin/site/home-images/{theme}, for the page Personnalisation of the local admin
 * console. Administrators only (guards.admin). The image is sent as the raw body; its own content
 * type parser lives in this plugin, with the 15 MB limit of the home images.
 */
export function registerAdminSiteRoutes(
  parent: FastifyInstance,
  service: SiteService,
  guards: Guards,
): void {
  void parent.register(async (scope) => {
    scope.removeContentTypeParser(IMAGE_TYPES);
    scope.addContentTypeParser(
      IMAGE_TYPES,
      { parseAs: "buffer", bodyLimit: HOME_IMAGE_MAX_BYTES },
      (_request, body, done) => done(null, body),
    );
    routes(typed(scope), service, guards);
  });
}

const typed = (scope: FastifyInstance) => scope.withTypeProvider<ZodTypeProvider>();

function routes(app: ReturnType<typeof typed>, service: SiteService, guards: Guards) {
  const base = { onRequest: guards.admin };
  const response = { 200: HomeImages, ...errors };
  app.put(
    url,
    { ...base, schema: { tags, security, params, querystring: HomeImageSettings, response } },
    async (request) => {
      if (!Buffer.isBuffer(request.body)) {
        throw new ApiProblem(415, "Unsupported Media Type", "Send a JPEG, PNG or WebP image.");
      }
      const { theme } = request.params;
      return service.upload(theme, request.body, request.query, callerOf(request).pilotId);
    },
  );
  app.patch(
    url,
    { ...base, schema: { tags, security, params, body: HomeImageSettings, response } },
    async (request) => {
      const { theme } = request.params;
      return service.updateSettings(theme, request.body, callerOf(request).pilotId);
    },
  );
  app.delete(url, { ...base, schema: { tags, security, params } }, async (request, reply) => {
    await service.reset(request.params.theme);
    return reply.status(204).send();
  });
}
