import {
  FictitiousPilotsCreated,
  FictitiousPilotsRequest,
  FictitiousPopulation,
  Problem,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Guards } from "../../plugins/auth.ts";
import type { FictitiousPilotsService } from "./fictitious-service.ts";

const PATH = "/v1/dev/fictitious-pilots";
const tags = ["dev"];
const security = [{ bearer: [] }];

/**
 * Development tools of the simulated activity (admin console, page Activité simulée),
 * never registered in production (see app.ts): create, count and delete the fictitious accounts.
 */
export function registerFictitiousPilotRoutes(
  parent: FastifyInstance,
  service: FictitiousPilotsService,
  guards: Guards,
): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const onRequest = guards.pilot;
  app.post(
    PATH,
    {
      onRequest,
      schema: {
        tags,
        security,
        body: FictitiousPilotsRequest,
        response: { 201: FictitiousPilotsCreated, 401: Problem },
      },
    },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );
  app.get(
    PATH,
    {
      onRequest,
      schema: { tags, security, response: { 200: FictitiousPopulation, 401: Problem } },
    },
    async () => service.population(),
  );
  app.delete(
    PATH,
    {
      onRequest,
      schema: { tags, security, response: { 200: FictitiousPopulation, 401: Problem } },
    },
    async () => service.deleteAll(),
  );
}
