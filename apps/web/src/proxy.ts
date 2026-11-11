import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing.ts";

/** Sends "/" to "/fr" (or the browser's language) and keeps the language in every address. */
export default createMiddleware(routing);

export const config = {
  // Everything except Next.js files and static files (the map worker, icons…).
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
