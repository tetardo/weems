import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { hasSessionCookie } from "./auth/session-cookie.ts";
import { routing } from "./i18n/routing.ts";
import { serverApiUrl } from "./site/api-url.ts";

const intl = createMiddleware(routing);

/** Pages open without an account: everything else needs a session (closed alpha, spec J3). */
const PUBLIC_PAGES = new Set(["login", "signup"]);

function localeAndPage(pathname: string): { locale: string; page: string } {
  const [first = "", second = ""] = pathname.split("/").filter(Boolean);
  const hasLocale = (routing.locales as readonly string[]).includes(first);
  return hasLocale
    ? { locale: first, page: second }
    : { locale: routing.defaultLocale, page: first };
}

/**
 * 1. /api/auth/* is relayed to the API (login routes): same address as the pages, so the session cookie is the site's.
 * 2. A page without session cookie sends to the login page, then back.
 * 3. Otherwise next-intl keeps the language in the address ("/" → "/fr").
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.rewrite(new URL(`${pathname}${search}`, serverApiUrl()));
  }
  const { locale, page } = localeAndPage(pathname);
  if (!PUBLIC_PAGES.has(page) && !hasSessionCookie(request.cookies.getAll().map((c) => c.name))) {
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return intl(request);
}

export const config = {
  // Everything except Next.js files and static files (the map worker, icons…).
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
