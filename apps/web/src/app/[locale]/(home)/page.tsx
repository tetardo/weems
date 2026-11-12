import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasSession } from "../../../auth/server-session.ts";
import { HomeHero } from "../../../home/home-hero.tsx";
import { homeImages, homeStats } from "../../../home/home-data.ts";
import { homeBackgrounds } from "../../../home/home-image.ts";
import { publicApiUrl } from "../../../site/api-url.ts";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Home" });
  return { title: { absolute: t("title") }, description: t("lead") };
}

/** Spec J4 accueil: the public home page. */
export default async function HomePage({ params }: Props) {
  setRequestLocale((await params).locale);
  const [loggedIn, stats, images] = await Promise.all([hasSession(), homeStats(), homeImages()]);
  const apiUrl = publicApiUrl();
  return (
    <HomeHero
      loggedIn={loggedIn}
      stats={stats}
      apiUrl={apiUrl}
      backgrounds={homeBackgrounds(images, apiUrl)}
    />
  );
}
