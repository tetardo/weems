import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getMyFounder, getPublicFounders } from "../../../../api/offers-api.ts";
import { getMyPlan } from "../../../../api/plans-api.ts";
import { getPlanCatalog } from "../../../../api/public-api.ts";
import { PlansPage } from "../../../../plans/plans-page.tsx";
import { plansMetadata } from "../../../../plans/plans-metadata.ts";
import { apiFallback } from "../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return plansMetadata((await params).locale, "/plans", "meta.title");
}

/** Page Offres (cadrage 05): the plans as the API describes them, open without an account. */
export default async function PlansRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  try {
    const [catalog, current, founders, mine] = await Promise.all([
      getPlanCatalog(),
      getMyPlan(),
      getPublicFounders(),
      getMyFounder(),
    ]);
    if (!catalog) notFound();
    return <PlansPage catalog={catalog} current={current} founders={founders} mine={mine} />;
  } catch (error) {
    return apiFallback(error);
  }
}
