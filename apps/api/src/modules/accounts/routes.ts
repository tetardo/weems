import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { TrackerLogin } from "@weems/contrats";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { Config } from "../../config.ts";
import { headersOf } from "../../plugins/auth.ts";
import { AUTH_BASE_PATH, type Auth, TRACKER_SCOPES } from "./auth.ts";
import { TRACKER_CLIENT_ID, TRACKER_REDIRECT_URI } from "./tracker-client.ts";

type FetchHandler = (request: Request) => Promise<Response>;

/** Fastify request → Fetch request, body passed through untouched (JSON or form). */
function toFetchRequest(request: FastifyRequest): Request {
  const url = new URL(request.url, `${request.protocol}://${request.host}`);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return new Request(url, {
    method: request.method,
    headers: headersOf(request),
    ...(hasBody && Buffer.isBuffer(request.body) ? { body: new Uint8Array(request.body) } : {}),
  });
}

async function sendFetchResponse(reply: FastifyReply, response: Response): Promise<FastifyReply> {
  reply.status(response.status);
  response.headers.forEach((value, name) => {
    if (name !== "set-cookie") reply.header(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) reply.header("set-cookie", cookies);
  return reply.send(Buffer.from(await response.arrayBuffer()));
}

/**
 * Login routes of Better Auth, under /api/auth. Browsers reach them through the site
 * (same origin as the pages, so the session cookie is the site's); the API serves them.
 */
function registerAuthHandler(
  parent: FastifyInstance,
  handler: FetchHandler,
  metadata: FetchHandler,
) {
  parent.register(async (app) => {
    // Raw bodies: the library reads JSON (site) and form-encoded bodies (tracker token requests).
    app.removeAllContentTypeParsers();
    app.addContentTypeParser("*", { parseAs: "buffer" }, (_request, body, done) =>
      done(null, body),
    );
    const forward =
      (fetchHandler: FetchHandler) => async (request: FastifyRequest, reply: FastifyReply) =>
        sendFetchResponse(reply, await fetchHandler(toFetchRequest(request)));
    app.route({
      method: ["GET", "POST"],
      url: `${AUTH_BASE_PATH}/*`,
      schema: { hide: true },
      handler: forward(handler),
    });
    // RFC 8414: metadata of an issuer with a path lives under /.well-known/…/{path}.
    app.get(
      `/.well-known/oauth-authorization-server${AUTH_BASE_PATH}`,
      { schema: { hide: true } },
      forward(metadata),
    );
  });
}

/** GET /v1/tracker/login: everything the tracker needs to log a pilot in. */
function registerTrackerLogin(parent: FastifyInstance, config: Config) {
  parent
    .withTypeProvider<ZodTypeProvider>()
    .get(
      "/v1/tracker/login",
      { schema: { tags: ["accounts"], response: { 200: TrackerLogin } } },
      async () => ({
        authorizationEndpoint: `${config.siteUrl}${AUTH_BASE_PATH}/oauth2/authorize`,
        tokenEndpoint: `${config.siteUrl}${AUTH_BASE_PATH}/oauth2/token`,
        clientId: TRACKER_CLIENT_ID,
        scopes: [...TRACKER_SCOPES],
        resource: config.apiUrl,
        redirectPath: new URL(TRACKER_REDIRECT_URI).pathname,
      }),
    );
}

export function registerAccountRoutes(parent: FastifyInstance, auth: Auth, config: Config): void {
  registerAuthHandler(parent, auth.handler, oauthProviderAuthServerMetadata(auth));
  registerTrackerLogin(parent, config);
}
