import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FlightsPage } from "../../../../../../logbook/flights/flights-page.tsx";
import { listParamsOf } from "../../../../../../logbook/flights/list-params.ts";
import { loadList } from "../../../../../../logbook/flights/load-list.ts";
import { apiFallback } from "../../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook.flights");

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Page Vols of the private logbook: the searched, filtered and sorted list, full width. */
export default async function LogbookFlightsPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const listParams = listParamsOf(await searchParams);
  try {
    const list = await loadList(listParams);
    if (!list) notFound();
    return <FlightsPage list={list} params={listParams} />;
  } catch (error) {
    return apiFallback(error);
  }
}
