import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FlightsPage } from "../../../../../../../logbook/flights/flights-page.tsx";
import { entryFilterOf } from "../../../../../../../logbook/flights/entry-filter.ts";
import { loadFlightsPage } from "../../../../../../../logbook/flights/load-flights.ts";
import { apiFallback } from "../../../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook.flights");

interface Props {
  params: Promise<{ locale: string; flightId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Page Vols with a chosen flight: list and sheet, the sheet alone on phones. */
export default async function LogbookFlightPage({ params, searchParams }: Props) {
  const { locale, flightId } = await params;
  setRequestLocale(locale);
  const filter = entryFilterOf((await searchParams)["f"]);
  try {
    const page = await loadFlightsPage(flightId, filter);
    if (!page?.selected) notFound();
    return <FlightsPage {...page} filter={filter} sheetFirst />;
  } catch (error) {
    return apiFallback(error);
  }
}
