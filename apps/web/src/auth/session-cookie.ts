/**
 * Name of the session cookie set by the API's login routes (Better Auth).
 * Over HTTPS the browser receives the "__Secure-" variant.
 */
const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

/** Only says a session cookie is present; the API checks it on every request. */
export function hasSessionCookie(names: Iterable<string>): boolean {
  for (const name of names) if (SESSION_COOKIES.includes(name)) return true;
  return false;
}

/** Where to go after login: an address of this site only (never "//other.site"). */
export function safeNext(next: string | null | undefined, fallback: string): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
