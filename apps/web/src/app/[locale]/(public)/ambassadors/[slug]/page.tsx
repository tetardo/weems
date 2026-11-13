import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAmbassador } from "../../../../../api/offers-api.ts";
import { hasSession } from "../../../../../auth/server-session.ts";
import { AmbassadorPage } from "../../../../../offers/ambassador-page.tsx";
import { publicPageMetadata } from "../../../../../profile/page-metadata.ts";
import { apiFallback } from "../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Offers.ambassador" });
  try {
    const ambassador = await getAmbassador(slug);
    if (!ambassador) return {};
    return publicPageMetadata({
      locale,
      path: `/ambassadors/${ambassador.slug}`,
      title: t("meta.title", { name: ambassador.name }),
      description: t("meta.description", {
        name: ambassador.name,
        months: ambassador.offer.months,
      }),
    });
  } catch {
    return {};
  }
}

/** Page of an ambassador (spec offre fondateurs): open without an account, 404 when off. */
export default async function AmbassadorRoute({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  try {
    const [ambassador, loggedIn] = await Promise.all([getAmbassador(slug), hasSession()]);
    if (!ambassador) notFound();
    return <AmbassadorPage ambassador={ambassador} loggedIn={loggedIn} />;
  } catch (error) {
    return apiFallback(error);
  }
}
