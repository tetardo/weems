import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPlanCatalog } from "../../../../../api/public-api.ts";
import { ComparePage } from "../../../../../plans/plans-page.tsx";
import { plansMetadata } from "../../../../../plans/plans-metadata.ts";
import { apiFallback } from "../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return plansMetadata((await params).locale, "/plans/compare", "compare.title");
}

/** Every feature of every plan, row by row (linked from the page Offres). */
export default async function CompareRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  try {
    const catalog = await getPlanCatalog();
    if (!catalog) notFound();
    return <ComparePage catalog={catalog} />;
  } catch (error) {
    return apiFallback(error);
  }
}
