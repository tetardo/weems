import { defineRouting } from "next-intl/routing";

/** French by default, English as second language (spec J2: the whole site in both). */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});

export type Locale = (typeof routing.locales)[number];
