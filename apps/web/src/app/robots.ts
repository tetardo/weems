import type { MetadataRoute } from "next";
import { routing } from "../i18n/routing.ts";
import { siteUrl } from "../site/site-url.ts";

/** Read at each request: the address of the site comes from the environment of the server. */
export const dynamic = "force-dynamic";

/** Only the public profiles are open to search engines (spec J4 référencement). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: routing.locales.map((locale) => `/${locale}/pilots/`),
      disallow: "/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
