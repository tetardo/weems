import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/** `generateMetadata` of a page whose title is `title` in the namespace `namespace`. */
export function pageTitle(namespace: string) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const t = await getTranslations({ locale: (await params).locale, namespace });
    return { title: t("title") };
  };
}
