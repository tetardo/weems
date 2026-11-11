import { z } from "zod";

/**
 * GET /v1/tracker/login: how the tracker logs a pilot in (spec J3).
 * OAuth 2.1 authorization code with PKCE (S256); the browser comes back to
 * http://127.0.0.1:{any free port}/callback (RFC 8252).
 */
export const TrackerLogin = z.object({
  /** Opened in the pilot's browser. */
  authorizationEndpoint: z.url(),
  /** Exchanges the code, then the refresh token (form-encoded POST). */
  tokenEndpoint: z.url(),
  clientId: z.string().min(1),
  /** Space-separated in the requests. */
  scopes: z.array(z.string().min(1)),
  /** The API: sent as `resource` so access tokens are JWTs for it (RFC 8707). */
  resource: z.url(),
  /** Path of the loopback redirect, after http://127.0.0.1:{port}. */
  redirectPath: z.string().startsWith("/"),
});
export type TrackerLogin = z.infer<typeof TrackerLogin>;
