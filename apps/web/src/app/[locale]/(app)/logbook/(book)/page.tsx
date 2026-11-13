import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getLogbookSummary, getMyRank } from "../../../../../api/logbook-api.ts";
import { getTrack } from "../../../../../api/weems-api.ts";
import { SummaryPage } from "../../../../../logbook/summary/summary-page.tsx";
import { getMyFeatures } from "../../../../../plans/my-features.ts";
import { apiFallback } from "../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook");

/** « Mon carnet de bord », page Résumé (spec carnet privé, § 3). Landing page after login. */
export default async function LogbookSummaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale((await params).locale);
  try {
    const [summary, features, rank] = await Promise.all([
      getLogbookSummary(),
      getMyFeatures(),
      getMyRank(),
    ]);
    if (!summary) notFound();
    const last = summary.lastFlight?.flight.flightId;
    const track = last ? await getTrack(last) : null;
    return (
      <SummaryPage
        summary={summary}
        rank={rank}
        points={track?.points ?? []}
        detailed={features.has("workOnDetailed")}
        today={new Date()}
      />
    );
  } catch (error) {
    return apiFallback(error);
  }
}
