import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApiUnavailable } from "../../../../../api/api-request.ts";
import { getMyCodes, getMyFounder } from "../../../../../api/offers-api.ts";
import { getMyPlanInfo } from "../../../../../api/plans-api.ts";
import { SubscriptionPage } from "../../../../../offers/subscription-page.tsx";
import { apiFallback } from "../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Offers.plan" });
  return { title: t("title") };
}

/** « Mon abonnement »: plan, Pilot Pro offered, founder place, referral codes. */
export default async function PlanRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  try {
    const [plan, founder, codes] = await Promise.all([
      getMyPlanInfo(),
      getMyFounder(),
      getMyCodes(),
    ]);
    if (!plan) throw new ApiUnavailable("/v1/me/plan", new Error("no plan"));
    return <SubscriptionPage plan={plan} founder={founder} codes={codes} now={Date.now()} />;
  } catch (error) {
    return apiFallback(error);
  }
}
