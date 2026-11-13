import type { ConsoleConfig } from "../console-config.ts";
import { AdminApiError } from "./admin-api.ts";

/** "name=value" pairs of the Set-Cookie headers, ready to send back in a Cookie header. */
export function cookieHeaderOf(setCookies: readonly string[]): string {
  return setCookies
    .map((header) => header.split(";")[0]?.trim() ?? "")
    .filter((pair) => pair.includes("="))
    .join("; ");
}

/**
 * Logs in to the API (Better Auth, /api/auth/sign-in/email) from the console's server, as the
 * site does. Returns the session cookie of the API, kept by the console in its own cookie.
 */
export async function signIn(
  config: ConsoleConfig,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(new URL("/api/auth/sign-in/email", config.apiUrl), {
    method: "POST",
    headers: { origin: config.consoleUrl, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 401) throw new AdminApiError(401, "E-mail ou mot de passe incorrect.");
  if (response.status === 403) throw new AdminApiError(403, "Ce compte est désactivé.");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new AdminApiError(response.status, body?.message ?? `HTTP ${response.status}`);
  }
  const cookie = cookieHeaderOf(response.headers.getSetCookie());
  if (!cookie) throw new AdminApiError(502, "L'API n'a pas ouvert de session.");
  return cookie;
}
