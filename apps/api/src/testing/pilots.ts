import { createHash, randomBytes } from "node:crypto";
import { uuidV7 } from "@weems/contrats";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { AccountsRepository } from "../modules/accounts/repository.ts";
import { AccountsService } from "../modules/accounts/service.ts";
import { connectTestDatabase } from "./database.ts";

const SITE_ORIGIN = "http://localhost:3001";
const TEST_API_URL = "http://localhost:3000";
export const PASSWORD = "correct horse battery staple";

/** A new invitation in the test database, as `pnpm invite` makes it. */
export async function invite(email: string): Promise<string> {
  const database = connectTestDatabase();
  try {
    return await new AccountsService(new AccountsRepository(database.db)).createInvitation(email);
  } finally {
    await database.close();
  }
}

export const uniqueEmail = () => `pilot-${uuidV7()}@example.test`;

export function signUp(app: FastifyInstance, body: Record<string, unknown>) {
  return app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    headers: { origin: SITE_ORIGIN, "content-type": "application/json" },
    payload: JSON.stringify(body),
  });
}

/** The session cookie set by a login answer, ready to send back. */
function sessionCookie(response: LightMyRequestResponse): string {
  return response.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

/** A new invited pilot, signed up and logged in: returns the session cookie. */
export async function newPilot(app: FastifyInstance, email = uniqueEmail()): Promise<string> {
  const inviteCode = await invite(email);
  const response = await signUp(app, { email, password: PASSWORD, name: "Test pilot", inviteCode });
  if (response.statusCode !== 200) throw new Error(`sign-up failed: ${response.body}`);
  return sessionCookie(response);
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

const LOOPBACK_REDIRECT = "http://127.0.0.1:53682/callback";

/** What the tracker does (spec J3): authorization in the browser, then the code exchange. */
export async function trackerLogin(app: FastifyInstance, cookie: string) {
  const { verifier, challenge } = pkce();
  const query = new URLSearchParams({
    response_type: "code",
    client_id: "weems-tracker",
    redirect_uri: LOOPBACK_REDIRECT,
    scope: "openid profile offline_access",
    state: "state-1",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: TEST_API_URL,
  });
  const authorize = await app.inject({
    method: "GET",
    url: `/api/auth/oauth2/authorize?${query}`,
    headers: { cookie },
  });
  const location = authorize.headers.location ?? "";
  const code = new URL(location).searchParams.get("code");
  if (!code) throw new Error(`no code: ${authorize.statusCode} ${location} ${authorize.body}`);
  return exchange(app, {
    grant_type: "authorization_code",
    code,
    redirect_uri: LOOPBACK_REDIRECT,
    client_id: "weems-tracker",
    code_verifier: verifier,
    resource: TEST_API_URL,
  });
}

export function exchange(app: FastifyInstance, form: Record<string, string>) {
  return app.inject({
    method: "POST",
    url: "/api/auth/oauth2/token",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    payload: new URLSearchParams(form).toString(),
  });
}

/** A new pilot logged in on the site (cookie) and in the tracker (headers with an access token). */
export async function newTrackerPilot(app: FastifyInstance) {
  const cookie = await newPilot(app);
  const tokens = await trackerLogin(app, cookie);
  const tracker = {
    authorization: `Bearer ${tokens.json().access_token}`,
    "weems-client": "tracker/0.1.0",
  };
  return { cookie, tracker };
}
