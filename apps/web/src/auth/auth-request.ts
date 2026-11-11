/** Kind of failure shown to the pilot (messages Auth.errors.*). */
export type AuthError = "credentials" | "invitation" | "exists" | "password" | "unknown";

export type AuthResult = { ok: true; redirectTo: string | null } | { ok: false; error: AuthError };

function errorOf(status: number, code: string | undefined): AuthError {
  if (status === 403) return "invitation";
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
    return "exists";
  if (code === "PASSWORD_TOO_SHORT") return "password";
  if (status === 401 || code === "INVALID_EMAIL_OR_PASSWORD") return "credentials";
  return "unknown";
}

/**
 * The tracker's login (OAuth) comes to the login page with a signed query (`sig`):
 * sent back with the login, it lets the API answer with the address of the tracker.
 */
function oauthQuery(search: string): string | undefined {
  const params = new URLSearchParams(search);
  return params.has("sig") ? params.toString() : undefined;
}

/** POST to the login routes of the API, relayed by the site (/api/auth/…). */
export async function authRequest(
  path: "/sign-in/email" | "/sign-up/email",
  body: Record<string, string>,
  search: string,
): Promise<AuthResult> {
  try {
    const response = await fetch(`/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, oauth_query: oauthQuery(search) }),
    });
    const data = (await response.json().catch(() => null)) as {
      code?: string;
      redirect?: boolean;
      url?: string;
    } | null;
    if (!response.ok) return { ok: false, error: errorOf(response.status, data?.code) };
    return { ok: true, redirectTo: data?.redirect && data.url ? data.url : null };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
