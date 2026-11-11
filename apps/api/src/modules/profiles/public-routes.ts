import type { FastifyInstance } from "fastify";
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
const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
/** Per visitor address: plenty for a person browsing, not for copying every profile. */
const config = { rateLimit: { max: 120, timeWindow: "1 minute" } };
/** No caching anywhere: a profile taken down disappears at the next load (spec J4). */
const noStore = "no-store";

/** Routes anyone can call, without account (spec J4 profil public). */
export function registerPublicProfileRoutes(
  parent: FastifyInstance,
  service: PublicProfilesService,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.addHook("onSend", async (request, reply) => {
    if (request.url.startsWith("/v1/pilots")) reply.header("cache-control", noStore);
  });

  app.get(
    "/v1/pilots",
    { config, schema: { tags, response: { 200: PublicPilotIndex, ...errors } } },
    async () => service.index(),
  );
  app.get(
    "/v1/pilots/:handle",
    { config, schema: { tags, params: handle, response: { 200: PublicPilot, ...errors } } },
    async (request) => service.pilot(request.params.handle),
  );
  app.get(
    "/v1/pilots/:handle/flights",
    {
      config,
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
    { config, schema: { tags, params: handle } },
    async (request, reply) => {
      const photo = await service.photo(request.params.handle);
      return reply.type("image/webp").send(photo);
    },
  );
  app.get(
    "/v1/pilots/:handle/routes",
    { config, schema: { tags, params: handle, response: { 200: PilotRoutes, ...errors } } },
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
      config,
      schema: { tags, params: handleAndFlight, response: { 200: PublicFlightView, ...errors } },
    },
    async (request) => service.flight(request.params.handle, request.params.flightId),
  );
  app.get(
    "/v1/pilots/:handle/flights/:flightId/track",
    { config, schema: { tags, params: handleAndFlight, response: { 200: TrackView, ...errors } } },
    async (request) => service.track(request.params.handle, request.params.flightId),
  );
}
