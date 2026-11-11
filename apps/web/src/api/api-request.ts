import { redirect } from "next/navigation";
import type { z } from "zod";
import { forwardedCookies, visitorAddress } from "../auth/server-session.ts";
import { serverApiUrl } from "../site/api-url.ts";

/** The API did not answer, or answered something unexpected. */
export class ApiUnavailable extends Error {
  readonly url: string;
  constructor(url: string, cause: unknown) {
    super(`Weems API unavailable at ${url}`, { cause });
    this.url = url;
  }
}

/** The API refused the request (400, 409, 413, 415, 422): `status` tells the form what to say. */
export class ApiRefused extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Weems API refused the request (HTTP ${status})`);
    this.status = status;
  }
}

export interface RequestOptions {
  method?: "GET" | "PUT" | "DELETE";
  /** JSON body. */
  body?: unknown;
  /** Public pages: the pilot's cookie is not sent, the answer is the same for everyone. */
  anonymous?: boolean;
}

async function visitorHeader(): Promise<Record<string, string>> {
  const address = await visitorAddress();
  return address ? { "x-forwarded-for": address } : {};
}

/** Fetch options of a request: GET by default, JSON body when there is one. */
async function requestInit({ method = "GET", body, anonymous = false }: RequestOptions) {
  // Anonymous: the visitor's address instead, so that the API limits each visitor, not the site.
  const headers: Record<string, string> = anonymous
    ? await visitorHeader()
    : { cookie: await forwardedCookies() };
  const json = body === undefined ? null : JSON.stringify(body);
  if (json !== null) headers["content-type"] = "application/json";
  return { method, headers, body: json, cache: "no-store" } satisfies RequestInit;
}

/** Reads the answer: data, null when there is nothing at this address, or an error. */
async function answerOf<T extends z.ZodType>(
  response: Response,
  schema: T,
  { url, anonymous }: { url: string; anonymous: boolean },
): Promise<z.infer<T> | null> {
  if (response.status === 401 && !anonymous) redirect("/login");
  // Anonymous 400: a public address that cannot exist (malformed handle or flight id).
  if (response.status === 404 || (anonymous && response.status === 400)) return null;
  if (response.status >= 400 && response.status < 500) throw new ApiRefused(response.status);
  if (!response.ok) throw new ApiUnavailable(url, new Error(`HTTP ${response.status}`));
  // 204 No Content (a deletion): nothing to read.
  return schema.parse(response.status === 204 ? null : await response.json());
}

/**
 * A request to the API from the site's server, as the logged-in pilot (session cookie forwarded)
 * or anonymously. Null when the resource does not exist or is another pilot's (404); expired
 * session → login page; other refusals (429 too many requests…) → ApiRefused.
 */
export async function apiRequest<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T> | null> {
  const url = serverApiUrl();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, await requestInit(options));
  } catch (error) {
    throw new ApiUnavailable(url, error);
  }
  return answerOf(response, schema, { url, anonymous: options.anonymous ?? false });
}
