import type { Metadata } from "next";
import { routing } from "../i18n/routing.ts";

/**
 * Address of a public page in each language, for the canonical link and the hreflang variants
 * (spec J4 référencement). `path` starts with "/", without the language.
 */
function languageAlternates(locale: string, path: string): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries(routing.locales.map((other) => [other, `/${other}${path}`])),
  };
}

/** Title, description, canonical address and share preview of a public page. */
export function publicPageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    // The title already names Weems: no « · Weems » suffix from the root layout.
    title: { absolute: title },
    description,
    alternates: languageAlternates(locale, path),
    openGraph: { title, description, type: "profile", url: `/${locale}${path}` },
  };
}
