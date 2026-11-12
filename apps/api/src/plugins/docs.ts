import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

/** OpenAPI description generated from the route schemas, served at /docs. */
export async function registerDocs(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: { title: "Weems API", version: "0.1.0" },
      components: {
        securitySchemes: {
          bearer: { type: "http", scheme: "bearer" },
          // Session of the site and of the admin console (Better Auth cookie).
          session: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });
}
