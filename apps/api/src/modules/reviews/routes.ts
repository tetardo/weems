import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { FlightId, FlightReview, FlightReviewView, Problem } from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { ReviewsService } from "./service.ts";

const params = z.object({ flightId: FlightId });
const errors = { 400: Problem, 401: Problem, 404: Problem };
const security = [{ bearer: [] }];
const url = "/v1/flights/:flightId/review";

/** HTTP layer of the pilots' reviews of their flights' phases (spec J3): schemas only. */
export function registerReviewRoutes(
  parent: FastifyInstance,
  service: ReviewsService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();

  app.get(
    url,
    {
      onRequest: guards.pilot,
      schema: {
        tags: ["reviews"],
        security,
        params,
        response: { 200: FlightReviewView, ...errors },
      },
    },
    async (request) => service.read(callerOf(request), request.params.flightId),
  );

  app.put(
    url,
    {
      onRequest: guards.pilot,
      schema: {
        tags: ["reviews"],
        security,
        params,
        body: FlightReview,
        response: { 200: FlightReviewView, ...errors },
      },
    },
    async (request) => service.save(callerOf(request), request.params.flightId, request.body),
  );
}
