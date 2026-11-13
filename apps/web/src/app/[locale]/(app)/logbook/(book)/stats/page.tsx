import { LogbookStatsPeriod } from "@weems/contrats";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getLogbookStats } from "../../../../../../api/logbook-api.ts";
import { StatsPage } from "../../../../../../logbook/stats/stats-page.tsx";
import { apiFallback } from "../../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook.stats");

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Page Statistiques of the private logbook (spec carnet privé, § 5): `?period=30d|12m|all`. */
export default async function LogbookStatsPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const period = LogbookStatsPeriod.catch("12m").parse((await searchParams)["period"]);
  try {
    const stats = await getLogbookStats(period);
    if (!stats) notFound();
    return <StatsPage stats={stats} today={new Date()} />;
  } catch (error) {
    return apiFallback(error);
  }
}
