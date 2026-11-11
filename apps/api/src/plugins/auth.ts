import type { FastifyInstance, FastifyRequest, onRequestAsyncHookHandler } from "fastify";
import type { Config } from "../config.ts";
import { ApiProblem } from "./problem.ts";
import { assertTrackerVersion, CLIENT_HEADER } from "./tracker-version.ts";

/** The only pilot until accounts arrive at J3. */
const DEV_PILOT_ID = "01970000-0000-7000-8000-000000000001";

export interface Caller {
  pilotId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    caller: Caller | null;
  }
}

const unauthorized = (detail: string) => new ApiProblem(401, "Unauthorized", detail);

/**
 * J0 login: a fixed development token, refused outside development mode.
 * OAuth 2 with PKCE replaces it at J3 (spec J0, "Connexion à J0").
 */
function authenticate(request: FastifyRequest, config: Config): Caller {
  if (config.env === "production") {
    throw unauthorized("Development token refused outside development mode.");
  }
  if (request.headers.authorization !== `Bearer ${config.devToken}`) {
    throw unauthorized("Missing or invalid bearer token.");
  }
  return { pilotId: DEV_PILOT_ID };
}

export interface Guards {
  /** Any signed-in client. */
  pilot: onRequestAsyncHookHandler;
  /** A signed-in tracker recent enough (426 otherwise). */
  tracker: onRequestAsyncHookHandler;
}

/**
 * Checks run on request arrival, before the body is validated:
 * an unknown caller gets 401 whatever they send.
 */
export function registerAuth(app: FastifyInstance, config: Config): Guards {
  app.decorateRequest("caller", null);
  const pilot: onRequestAsyncHookHandler = async (request) => {
    request.caller = authenticate(request, config);
  };
  const tracker: onRequestAsyncHookHandler = async (request) => {
    request.caller = authenticate(request, config);
    const header = request.headers[CLIENT_HEADER];
    assertTrackerVersion(typeof header === "string" ? header : undefined, config.minTrackerVersion);
  };
  return { pilot, tracker };
}

/** The caller set by a guard. A route without a guard calling this is a programming error. */
export function callerOf(request: FastifyRequest): Caller {
  if (!request.caller) throw new Error("Route has no authentication guard.");
  return request.caller;
}
