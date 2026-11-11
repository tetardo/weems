import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LiveView } from "../../../live/live-view.tsx";
import { publicApiUrl } from "../../../site/api-url.ts";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Live" });
  return { title: t("title") };
}

/** Spec J1, part 4: the minimal live map. */
export default async function LivePage({ params }: Props) {
  setRequestLocale((await params).locale);
  return <LiveView apiUrl={publicApiUrl()} />;
}
