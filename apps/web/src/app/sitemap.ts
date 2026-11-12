import type { MetadataRoute } from "next";
import { getPilotIndex } from "../api/public-api.ts";
import { routing } from "../i18n/routing.ts";
import { siteUrl } from "../site/site-url.ts";

/** Asked at each request: the list of public profiles changes with the pilots' settings. */
export const dynamic = "force-dynamic";

/** One page in every language, each pointing to the others. */
function inEveryLanguage(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const url = (locale: string) => new URL(`/${locale}${path}`, siteUrl()).href;
  return routing.locales.map((locale) => ({
    url: url(locale),
    ...(lastModified ? { lastModified } : {}),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((other) => [other, url(other)])),
    },
  }));
}

/** The home page and the public profiles, in every language (spec J4 référencement, accueil). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pilots } = await getPilotIndex();
  return [
    ...inEveryLanguage(""),
    ...pilots.flatMap(({ handle, updatedAt }) => inEveryLanguage(`/pilots/${handle}`, updatedAt)),
  ];
}
