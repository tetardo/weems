import { oauthProvider } from "@better-auth/oauth-provider";
import { uuidV7 } from "@weems/contrats";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import type { Config } from "../../config.ts";
import type { Database } from "../../db/client.ts";
import { authTables } from "../../db/auth-schema.ts";
import { ApiProblem } from "../../plugins/problem.ts";

/** Base path of the login routes, served through the site (see auth-routes.ts). */
export const AUTH_BASE_PATH = "/api/auth";

/** Scopes the tracker asks for: identity, plus a refresh token so the pilot logs in once. */
export const TRACKER_SCOPES = ["openid", "profile", "offline_access"] as const;

export interface AuthHooks {
  /** Called before an account is created: throws an ApiProblem to refuse it (closed alpha). */
  checkSignUp(body: unknown): Promise<void>;
  /** Called once the account exists. */
  signedUp(email: string): Promise<void>;
  /** Called before a session opens (site or tracker login): throws 403 for a disabled account. */
  checkLogin(userId: string): Promise<void>;
}

/** Our refusals become Better Auth errors, so the library answers them itself. */
async function asAuthError(check: () => Promise<void>): Promise<void> {
  try {
    await check();
  } catch (error) {
    if (error instanceof ApiProblem && error.status === 403) {
      throw new APIError("FORBIDDEN", { message: error.message });
    }
    throw error;
  }
}

/**
 * Accounts with Better Auth (decision of 10/11/2026: an open-source library inside the API).
 * - Site: e-mail and password, session cookie.
 * - Tracker: OAuth 2.1, authorization code with PKCE and a loopback redirect (RFC 8252);
 *   access tokens are JWTs for the API (audience `apiUrl`), refresh tokens rotate.
 */
export function createAuth(config: Config, db: Database, hooks: AuthHooks) {
  return betterAuth({
    appName: "Weems",
    baseURL: config.siteUrl,
    basePath: AUTH_BASE_PATH,
    secret: config.authSecret,
    // The admin console runs on the Mac only, never next to the production API.
    trustedOrigins:
      config.env === "production" ? [config.siteUrl] : [config.siteUrl, config.adminUrl],
    telemetry: { enabled: false },
    database: drizzleAdapter(db, { provider: "pg", schema: authTables }),
    advanced: { database: { generateId: () => uuidV7() } },
    emailAndPassword: { enabled: true, minPasswordLength: 10, autoSignIn: true },
    // Browser sessions never receive a JWT signed with the access-token key.
    disabledPaths: ["/token"],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") await asAuthError(() => hooks.checkSignUp(ctx.body));
      }),
    },
    databaseHooks: {
      user: { create: { after: async (user) => hooks.signedUp(user.email) } },
      session: {
        create: { before: async (session) => asAuthError(() => hooks.checkLogin(session.userId)) },
      },
    },
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      oauthProvider({
        loginPage: "/login",
        consentPage: "/consent",
        scopes: [...TRACKER_SCOPES],
        resources: [config.apiUrl],
        accessTokenExpiresIn: 60 * 60,
        refreshTokenExpiresIn: 60 * 60 * 24 * 90,
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
