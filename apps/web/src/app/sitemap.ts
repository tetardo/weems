import type { MetadataRoute } from "next";
import { getPilotIndex } from "../api/public-api.ts";
import { routing } from "../i18n/routing.ts";
import { siteUrl } from "../site/site-url.ts";

/** Asked at each request: the list of public profiles changes with the pilots' settings. */
export const dynamic = "force-dynamic";

/** Public profiles only, in every language (spec J4 référencement). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pilots } = await getPilotIndex();
  const url = (locale: string, handle: string) =>
    new URL(`/${locale}/pilots/${handle}`, siteUrl()).href;
  return pilots.flatMap(({ handle, updatedAt }) =>
    routing.locales.map((locale) => ({
      url: url(locale, handle),
      lastModified: updatedAt,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((other) => [other, url(other, handle)])),
      },
    })),
  );
}
