import type { FastifyInstance, FastifyRequest, onRequestAsyncHookHandler } from "fastify";
import type { Config } from "../config.ts";
import { ApiProblem } from "./problem.ts";
import { assertTrackerVersion, CLIENT_HEADER } from "./tracker-version.ts";

/** Pilot of the development token; also created as a real account in development (dev-pilot.ts). */
export const DEV_PILOT_ID = "01970000-0000-7000-8000-000000000001";

export interface Caller {
  pilotId: string;
  /** A fictitious account of the simulated activity, flying with the development token (page Activité simulée). */
  fictitious?: boolean;
}

/** How a request is tied to a pilot: implemented by the accounts module. */
export interface Identify {
  /** Pilot of an access token issued to the tracker, or null. */
  fromAccessToken(token: string): Promise<string | null>;
  /** Pilot of the session cookie the site forwards, or null. */
  fromSession(headers: Headers): Promise<string | null>;
  /** Whether the account has the administrator role. */
  isAdmin(pilotId: string): Promise<boolean>;
  /** Whether the account is an active fictitious account (simulated activity). */
  isFictitious(pilotId: string): Promise<boolean>;
}

declare module "fastify" {
  interface FastifyRequest {
    caller: Caller | null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const unauthorized = (detail: string) => new ApiProblem(401, "Unauthorized", detail);

export function headersOf(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

function bearerOf(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export interface Guards {
  /** A pilot: the tracker (access token) or the site (session cookie). */
  pilot: onRequestAsyncHookHandler;
  /** A tracker recent enough (426 otherwise), with an access token. */
  tracker: onRequestAsyncHookHandler;
  /** An administrator logged in with a session cookie (console); 403 for anyone else. */
  admin: onRequestAsyncHookHandler;
}

/**
 * Checks run on request arrival, before the body is validated: an unknown caller gets 401 whatever they send.
 * The fixed development token (spec J0) still works outside production, for `pnpm simulate` and `pnpm fly`;
 * `<development token>:<pilot id>` flies as a fictitious account (page Activité simulée), never as a real one.
 */
export function registerAuth(app: FastifyInstance, config: Config, identify: Identify): Guards {
  app.decorateRequest("caller", null);

  async function fromDevToken(token: string): Promise<Caller | null> {
    if (config.env === "production") return null;
    if (token === config.devToken) return { pilotId: DEV_PILOT_ID };
    const prefix = `${config.devToken}:`;
    if (!token.startsWith(prefix)) return null;
    const pilotId = token.slice(prefix.length);
    if (!UUID.test(pilotId) || !(await identify.isFictitious(pilotId))) {
      throw unauthorized("The development token flies only as a fictitious account.");
    }
    return { pilotId, fictitious: true };
  }

  async function fromBearer(token: string): Promise<Caller> {
    const developer = await fromDevToken(token);
    if (developer) return developer;
    const pilotId = await identify.fromAccessToken(token);
    if (!pilotId) throw unauthorized("Invalid or expired access token.");
    return { pilotId };
  }

  const pilot: onRequestAsyncHookHandler = async (request) => {
    const token = bearerOf(request);
    if (token) {
      request.caller = await fromBearer(token);
      return;
    }
    const pilotId = await identify.fromSession(headersOf(request));
    if (!pilotId) throw unauthorized("Log in, or send an access token.");
    request.caller = { pilotId };
  };
  const tracker: onRequestAsyncHookHandler = async (request) => {
    const token = bearerOf(request);
    if (!token) throw unauthorized("Missing bearer token.");
    request.caller = await fromBearer(token);
    const header = request.headers[CLIENT_HEADER];
    assertTrackerVersion(typeof header === "string" ? header : undefined, config.minTrackerVersion);
  };
  const admin: onRequestAsyncHookHandler = async (request) => {
    const pilotId = await identify.fromSession(headersOf(request));
    if (!pilotId) throw unauthorized("Log in with an administrator account.");
    if (!(await identify.isAdmin(pilotId))) {
      throw new ApiProblem(403, "Forbidden", "Reserved to administrators.");
    }
    request.caller = { pilotId };
  };
  return { pilot, tracker, admin };
}

/** The caller set by a guard. A route without a guard calling this is a programming error. */
export function callerOf(request: FastifyRequest): Caller {
  if (!request.caller) throw new Error("Route has no authentication guard.");
  return request.caller;
}
