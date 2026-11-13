import { cookies } from "next/headers";
import { config } from "../console.ts";
import { AdminApiError } from "./admin-api.ts";
import { devLogin } from "./dev-login.ts";

/** The console's own cookie, holding the API session of the administrator. */
export const SESSION_COOKIE = "weems-console-session";

export async function savedSession(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function keepSession(session: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, session, { httpOnly: true, sameSite: "strict", path: "/" });
}

const isExpired = (error: unknown) => error instanceof AdminApiError && error.status === 401;

/**
 * Runs calls of the API as the administrator: with the kept session, or, without one (or when it
 * expired), after the automatic login of the development pilot outside production (fiche 012).
 * `keep`: false while rendering a page, where Next.js forbids setting a cookie.
 */
export async function withAdminSession<T>(
  run: (session: string) => Promise<T>,
  keep = true,
): Promise<T> {
  const saved = await savedSession();
  if (saved) {
    try {
      return await run(saved);
    } catch (error) {
      if (!isExpired(error)) throw error;
    }
  }
  const session = await devLogin(config());
  if (!session) throw new AdminApiError(401, "Connectez-vous d'abord dans la page Comptes.");
  if (keep) await keepSession(session);
  return run(session);
}
