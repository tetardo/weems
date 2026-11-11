import type { FastifyError, FastifyInstance, FastifyReply } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import type { Problem } from "@weems/contrats";
import { ApiProblem } from "./problem.ts";

function send(reply: FastifyReply, problem: Problem) {
  return reply.status(problem.status).type("application/problem+json").send(problem);
}

function validationDetail(error: FastifyError): string {
  if (!hasZodFastifySchemaValidationErrors(error)) return error.message;
  return error.validation
    .map((issue) => `${issue.instancePath || "/"}: ${issue.message}`)
    .join("; ");
}

/** Every error leaves the API as RFC 9457 problem details; internals are never exposed. */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ApiProblem) {
      return send(reply, {
        type: error.type,
        title: error.title,
        status: error.status,
        detail: error.message,
      });
    }
    if (error.validation || (error.statusCode !== undefined && error.statusCode < 500)) {
      const status = error.statusCode ?? 400;
      return send(reply, {
        type: "https://weems.app/problems/bad-request",
        title: "Bad Request",
        status,
        detail: validationDetail(error),
      });
    }
    request.log.error({ err: error }, "unexpected error");
    return send(reply, {
      type: "https://weems.app/problems/internal-error",
      title: "Internal Server Error",
      status: 500,
      detail: "Unexpected error. It has been logged.",
    });
  });

  app.setNotFoundHandler((request, reply) =>
    send(reply, {
      type: "https://weems.app/problems/not-found",
      title: "Not Found",
      status: 404,
      detail: `No route for ${request.method} ${request.url}`,
    }),
  );
}
