import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoardingView } from "../../../../boarding/boarding-view.tsx";
import { publicApiUrl } from "../../../../site/api-url.ts";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Boarding" });
  return { title: t("title"), description: t("description") };
}

/** Page Boarding (spec web Boarding): departures and arrivals of every member, open to all. */
export default async function BoardingPage({ params }: Props) {
  setRequestLocale((await params).locale);
  return <BoardingView apiUrl={publicApiUrl()} />;
}
