import { cookies } from "next/headers";
import { serverApiUrl } from "../site/api-url.ts";
import { hasSessionCookie } from "./session-cookie.ts";

export interface Pilot {
  id: string;
  name: string;
  email: string;
}

/** The browser's cookies, forwarded to the API so that it recognises the pilot. */
export async function forwardedCookies(): Promise<string> {
  return (await cookies()).toString();
}

/** The logged-in pilot, or null (no cookie, expired session, API down). */
export async function currentPilot(): Promise<Pilot | null> {
  const cookie = await forwardedCookies();
  if (!cookie) return null;
  try {
    const response = await fetch(`${serverApiUrl()}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });
    const session = response.ok ? ((await response.json()) as { user?: Pilot } | null) : null;
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/** A session cookie is present: enough to choose a link, never to grant access (the API checks). */
export async function hasSession(): Promise<boolean> {
  return hasSessionCookie((await cookies()).getAll().map((cookie) => cookie.name));
}
