import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FlightsPage } from "../../../../../../logbook/flights/flights-page.tsx";
import { entryFilterOf } from "../../../../../../logbook/flights/entry-filter.ts";
import { loadFlightsPage } from "../../../../../../logbook/flights/load-flights.ts";
import { apiFallback } from "../../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook.flights");

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Page Vols of the private logbook: the list, and the newest flight's sheet on large screens. */
export default async function LogbookFlightsPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const filter = entryFilterOf((await searchParams)["f"]);
  try {
    const page = await loadFlightsPage(null, filter);
    if (!page) notFound();
    return <FlightsPage {...page} filter={filter} sheetFirst={false} />;
  } catch (error) {
    return apiFallback(error);
  }
}
