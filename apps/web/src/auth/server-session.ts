import { cookies, headers } from "next/headers";
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

/**
 * Address of the visitor, passed on to the API for its per-visitor limits: the last one of
 * X-Forwarded-For, the one added by the reverse proxy in front of the site (the earlier ones come
 * from the visitor, who can write anything there). Online, the site must stay behind such a
 * proxy; Next.js alone does not add the header.
 */
export async function visitorAddress(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() || null;
}
