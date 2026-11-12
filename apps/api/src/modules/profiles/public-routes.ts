import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  FlightId,
  PilotHandle,
  PilotRoutes,
  Problem,
  PublicFlightList,
  PublicFlightView,
  PublicPilot,
  PublicPilotIndex,
  TrackView,
} from "@weems/contrats";
import type { PublicProfilesService } from "./public-service.ts";

const tags = ["public profiles"];
const errors = { 400: Problem, 404: Problem, 429: Problem };
const handle = z.object({ handle: PilotHandle });
const handleAndFlight = handle.extend({ flightId: FlightId });
/** Paging of a public flight list (public pages and the pilot's own logbook). */
export const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
/**
 * Options of every public route. Rate limit per visitor address (given by the site's server, see
 * config.trustedProxies): plenty for a person browsing, not for copying every profile. No caching
 * anywhere: a profile taken down disappears at the next load (spec J4).
 */
const options = {
  config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
  onSend: async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.header("cache-control", "no-store");
  },
};

/** Routes anyone can call, without account (spec J4 profil public). */
export function registerPublicProfileRoutes(
  parent: FastifyInstance,
  service: PublicProfilesService,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/pilots",
    { ...options, schema: { tags, response: { 200: PublicPilotIndex, ...errors } } },
    async () => service.index(),
  );
  app.get(
    "/v1/pilots/:handle",
    { ...options, schema: { tags, params: handle, response: { 200: PublicPilot, ...errors } } },
    async (request) => service.pilot(request.params.handle),
  );
  app.get(
    "/v1/pilots/:handle/flights",
    {
      ...options,
      schema: {
        tags,
        params: handle,
        querystring: listQuery,
        response: { 200: PublicFlightList, ...errors },
      },
    },
    async (request) => service.flightList(request.params.handle, request.query),
  );
  app.get(
    "/v1/pilots/:handle/photo",
    { ...options, schema: { tags, params: handle } },
    async (request, reply) => {
      const photo = await service.photo(request.params.handle);
      return reply.type("image/webp").send(photo);
    },
  );
  app.get(
    "/v1/pilots/:handle/routes",
    { ...options, schema: { tags, params: handle, response: { 200: PilotRoutes, ...errors } } },
    async (request) => service.routes(request.params.handle),
  );
  registerPublicFlightRoutes(app, service);
}

/** One flight of a public profile: the flight page, its trajectory. */
function registerPublicFlightRoutes(parent: FastifyInstance, service: PublicProfilesService): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/pilots/:handle/flights/:flightId",
    {
      ...options,
      schema: { tags, params: handleAndFlight, response: { 200: PublicFlightView, ...errors } },
    },
    async (request) => service.flight(request.params.handle, request.params.flightId),
  );
  app.get(
    "/v1/pilots/:handle/flights/:flightId/track",
    {
      ...options,
      schema: { tags, params: handleAndFlight, response: { 200: TrackView, ...errors } },
    },
    async (request) => service.track(request.params.handle, request.params.flightId),
  );
}
