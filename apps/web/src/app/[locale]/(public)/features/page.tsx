import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPlanCatalog } from "../../../../api/public-api.ts";
import { FeaturesPage } from "../../../../features/features-page.tsx";
import { publicPageMetadata } from "../../../../profile/page-metadata.ts";
import { apiFallback } from "../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Features.meta" });
  return publicPageMetadata({
    locale,
    path: "/features",
    title: `${t("title")} · Weems`,
    description: t("description"),
  });
}

/** Page Fonctionnalités: every function of Weems, read on the plan catalogue, open without an account. */
export default async function FeaturesRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  try {
    const catalog = await getPlanCatalog();
    if (!catalog) notFound();
    return <FeaturesPage catalog={catalog} />;
  } catch (error) {
    return apiFallback(error);
  }
}
