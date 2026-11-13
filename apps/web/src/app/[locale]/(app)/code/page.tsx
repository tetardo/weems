import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CodePage } from "../../../../offers/code-page.tsx";
import { typedCode } from "../../../../offers/redeem-outcome.ts";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Offers.redeem" });
  return { title: t("title") };
}

/** Spec offre fondateurs: enter an offer code, pre-filled from ?code=. */
export default async function CodeRoute({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const { code } = await searchParams;
  return <CodePage code={typedCode(typeof code === "string" ? code : null)} />;
}
