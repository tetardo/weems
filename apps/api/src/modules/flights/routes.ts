import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  CloseFlightRequest,
  FlightEventsRequest,
  FlightId,
  FlightView,
  OpenFlightRequest,
  PositionReport,
  Problem,
  Receipt,
} from "@weems/contrats";
import { callerOf, type Guards } from "../../plugins/auth.ts";
import type { FlightsService } from "./service.ts";

const params = z.object({ flightId: FlightId });
const errors = { 400: Problem, 401: Problem, 404: Problem, 409: Problem, 426: Problem };
const security = [{ bearer: [] }];

/** Route options of a tracker message: guard, body schema, receipt answers. */
const message = <Body extends z.ZodType>(onRequest: Guards["tracker"], body: Body) => ({
  onRequest,
  schema: {
    tags: ["flights"],
    security,
    body,
    response: { 200: Receipt, 201: Receipt, ...errors },
  },
});

/** Same, for a message about an existing flight (/v1/flights/:flightId/...). */
const flightMessage = <Body extends z.ZodType>(onRequest: Guards["tracker"], body: Body) => {
  const options = message(onRequest, body);
  return { ...options, schema: { ...options.schema, params } };
};

const statusOf = (receipt: Receipt) => (receipt.result === "created" ? 201 : 200);

/** HTTP layer of the flights module: schemas and status codes only, no business rule. */
export function registerFlightRoutes(
  parent: FastifyInstance,
  service: FlightsService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const { tracker } = guards;

  app.post("/v1/flights", message(tracker, OpenFlightRequest), async (request, reply) => {
    const receipt = await service.open(callerOf(request), request.body);
    return reply.status(statusOf(receipt)).send(receipt);
  });

  app.post(
    "/v1/flights/:flightId/events",
    flightMessage(tracker, FlightEventsRequest),
    async (request, reply) => {
      const { flightId } = request.params;
      const receipt = await service.addEvents(callerOf(request), flightId, request.body.events);
      return reply.status(statusOf(receipt)).send(receipt);
    },
  );

  app.post(
    "/v1/flights/:flightId/positions",
    flightMessage(tracker, PositionReport),
    async (request, reply) => {
      const { flightId } = request.params;
      const receipt = await service.reportPosition(callerOf(request), flightId, request.body);
      return reply.status(statusOf(receipt)).send(receipt);
    },
  );

  app.post(
    "/v1/flights/:flightId/close",
    flightMessage(tracker, CloseFlightRequest),
    async (request, reply) => {
      const { flightId } = request.params;
      const receipt = await service.close(callerOf(request), flightId, request.body);
      return reply.status(statusOf(receipt)).send(receipt);
    },
  );

  app.get(
    "/v1/flights/:flightId",
    {
      onRequest: guards.pilot,
      schema: { tags: ["flights"], security, params, response: { 200: FlightView, ...errors } },
    },
    async (request) => service.read(callerOf(request), request.params.flightId),
  );
}
