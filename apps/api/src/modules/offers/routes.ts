import {
  AmbassadorSlug,
  MyCodes,
  Problem,
  PublicAmbassador,
  REDEEM_ATTEMPTS_PER_HOUR,
  RedeemCode,
  RedeemResult,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { AmbassadorsService } from "./ambassadors-service.ts";
import type { OffersService } from "./service.ts";

const tags = ["offers"];
const security = [{ bearer: [] }];
const params = z.object({ slug: AmbassadorSlug });

/**
 * GET /v1/me/codes (the caller's referral codes), POST /v1/me/codes/redeem (5 attempts per hour
 * and address: guessing a code is not an option).
 */
export function registerOfferRoutes(
  parent: FastifyInstance,
  service: OffersService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  app.get(
    "/v1/me/codes",
    {
      onRequest: guards.pilot,
      schema: { tags, security, response: { 200: MyCodes, 401: Problem } },
    },
    async (request) => service.mine(callerOf(request).pilotId),
  );
  app.post(
    "/v1/me/codes/redeem",
    {
      onRequest: guards.pilot,
      config: {
        rateLimit: {
          max: REDEEM_ATTEMPTS_PER_HOUR,
          timeWindow: "1 hour",
          // Per account and address: a pilot cannot try codes for others.
          keyGenerator: (request) =>
            `${request.ip}|${request.headers.cookie ?? request.headers.authorization ?? ""}`,
        },
      },
      schema: {
        tags,
        security,
        body: RedeemCode,
        response: {
          200: RedeemResult,
          400: Problem,
          401: Problem,
          404: Problem,
          409: Problem,
          410: Problem,
          429: Problem,
        },
      },
    },
    async (request) => service.redeem(callerOf(request).pilotId, request.body.code),
  );
}

/** Ambassadors' pages, without account: rate limited per address, never cached. */
export function registerAmbassadorRoutes(
  parent: FastifyInstance,
  service: AmbassadorsService,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const options = { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } };
  app.get(
    "/v1/ambassadors/:slug",
    {
      ...options,
      schema: { tags, params, response: { 200: PublicAmbassador, 404: Problem, 429: Problem } },
    },
    async (request, reply) => {
      reply.header("cache-control", "no-store");
      return service.page(request.params.slug);
    },
  );
  app.get(
    "/v1/ambassadors/:slug/photo",
    { ...options, schema: { tags, params } },
    async (request, reply) =>
      reply
        .type("image/webp")
        .header("cache-control", "no-store")
        .send(await service.photo(request.params.slug)),
  );
}
