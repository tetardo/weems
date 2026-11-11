import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ApiUnavailable, listFlights } from "../../../api/weems-api.ts";
import { FlightList } from "../../../flights/flight-list.tsx";
import { readFilters, toApiQuery } from "../../../flights/list-query.ts";
import { ApiDown } from "../../../site/api-down.tsx";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Flights" });
  return { title: t("title") };
}

/** Spec site minimal: the pilot's flights, newest first, 50 per page. */
export default async function FlightsPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const filters = readFilters(await searchParams);
  try {
    const list = await listFlights(toApiQuery(filters));
    return <FlightList list={list} filters={filters} />;
  } catch (error) {
    if (error instanceof ApiUnavailable) return <ApiDown url={error.url} />;
    throw error;
  }
}
