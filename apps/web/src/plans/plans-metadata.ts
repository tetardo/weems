import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { publicPageMetadata } from "../profile/page-metadata.ts";

/** Metadata of the pages Offres, the same shape for /plans and /plans/compare. */
export async function plansMetadata(
  locale: string,
  path: string,
  title: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Plans" });
  return publicPageMetadata({
    locale,
    path,
    title: `${t(title)} · Weems`,
    description: t("meta.description"),
  });
}
