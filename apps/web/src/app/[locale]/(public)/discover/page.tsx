import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiscoverPage } from "../../../../discover/discover-page.tsx";
import { homeImages } from "../../../../home/home-data.ts";
import { homeBackgrounds } from "../../../../home/home-image.ts";
import { publicPageMetadata } from "../../../../profile/page-metadata.ts";
import { publicApiUrl } from "../../../../site/api-url.ts";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({ locale, namespace: "Discover.meta" });
  return publicPageMetadata({
    locale,
    path: "/discover",
    title: t("title"),
    description: t("description"),
  });
}

/** Page Découvrir: the principle of Weems, open without an account; banner photo of the home page. */
export default async function DiscoverRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  return <DiscoverPage photos={homeBackgrounds(await homeImages(), publicApiUrl())} />;
}
