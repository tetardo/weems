import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  FlightId,
  FlightVisibility,
  HandleCheck,
  HandleCheckQuery,
  HiddenFlights,
  MyProfile,
  Problem,
  ProfileUpdate,
} from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import { ApiProblem } from "../../plugins/problem.ts";
import type { ProfilesService } from "./service.ts";

const errors = { 400: Problem, 401: Problem, 404: Problem, 409: Problem, 422: Problem };
const security = [{ bearer: [] }];
const tags = ["profiles"];
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Upload limit of a photo; it is stored reduced to about 20 KB. */
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
/** Checks of an address as the pilot types it: enough for typing, too few to list the handles. */
const HANDLE_CHECKS_PER_MINUTE = 60;

/** HTTP layer of the pilot's own profile settings (spec J4 profil public): schemas only. */
export function registerProfileRoutes(
  parent: FastifyInstance,
  service: ProfilesService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const own = { onRequest: guards.pilot };

  app.get(
    "/v1/me/profile",
    { ...own, schema: { tags, security, response: { 200: MyProfile, ...errors } } },
    async (request) => service.read(callerOf(request)),
  );

  app.put(
    "/v1/me/profile",
    {
      ...own,
      schema: { tags, security, body: ProfileUpdate, response: { 200: MyProfile, ...errors } },
    },
    async (request) => service.update(callerOf(request), request.body),
  );

  registerPhotoRoutes(app, service, guards);

  registerSettingsHelpers(app, service, guards);

  const visibility = {
    ...own,
    schema: {
      tags,
      security,
      params: z.object({ flightId: FlightId }),
      response: { 200: FlightVisibility, ...errors },
    },
  };
  app.get("/v1/flights/:flightId/visibility", visibility, async (request) =>
    service.visibility(callerOf(request), request.params.flightId),
  );
  app.put(
    "/v1/flights/:flightId/visibility",
    { ...visibility, schema: { ...visibility.schema, body: FlightVisibility } },
    async (request) =>
      service.setVisibility(callerOf(request), request.params.flightId, request.body),
  );
}

/** Lists and checks the settings page needs: hidden flights, address availability. */
function registerSettingsHelpers(
  parent: FastifyInstance,
  service: ProfilesService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const own = { onRequest: guards.pilot };
  app.get(
    "/v1/me/profile/hidden-flights",
    { ...own, schema: { tags, security, response: { 200: HiddenFlights, ...errors } } },
    async (request) => service.hiddenFlights(callerOf(request)),
  );

  app.get(
    "/v1/me/profile/handle-check",
    {
      ...own,
      config: { rateLimit: { max: HANDLE_CHECKS_PER_MINUTE, timeWindow: "1 minute" } },
      schema: {
        tags,
        security,
        querystring: HandleCheckQuery,
        response: { 200: HandleCheck, ...errors },
      },
    },
    async (request) => service.checkHandle(callerOf(request), request.query.handle),
  );
}

/** The photo is sent as the raw image body (Content-Type image/jpeg, image/png or image/webp). */
function registerPhotoRoutes(app: FastifyInstance, service: ProfilesService, guards: Guards): void {
  app.addContentTypeParser(
    PHOTO_TYPES,
    { parseAs: "buffer", bodyLimit: PHOTO_MAX_BYTES },
    (_request, body, done) => done(null, body),
  );
  const url = "/v1/me/profile/photo";
  const schema = { tags, security };

  app.get(url, { onRequest: guards.pilot, schema }, async (request, reply) => {
    const photo = await service.photo(callerOf(request));
    return reply.type("image/webp").header("cache-control", "private, no-cache").send(photo);
  });

  app.put(url, { onRequest: guards.pilot, schema }, async (request, reply) => {
    if (!Buffer.isBuffer(request.body)) {
      throw new ApiProblem(415, "Unsupported Media Type", "Send a JPEG, PNG or WebP image.");
    }
    await service.savePhoto(callerOf(request), request.body);
    return reply.status(204).send();
  });

  app.delete(url, { onRequest: guards.pilot, schema }, async (request, reply) => {
    await service.deletePhoto(callerOf(request));
    return reply.status(204).send();
  });
}
