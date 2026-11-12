import type { MetadataRoute } from "next";
import { routing } from "../i18n/routing.ts";
import { siteUrl } from "../site/site-url.ts";

/** Read at each request: the address of the site comes from the environment of the server. */
export const dynamic = "force-dynamic";

/** Only the home page and the public profiles are open to search engines (spec J4 référencement, accueil). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: routing.locales.flatMap((locale) => [`/${locale}$`, `/${locale}/pilots/`]),
      disallow: "/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
