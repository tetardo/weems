import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EcamPage } from "../../../../../../../../logbook/ecam/page/ecam-page.tsx";
import { fullFlightMetadata } from "../../../../../../../../logbook/flight/full-flight-metadata.ts";
import { loadFullFlight } from "../../../../../../../../logbook/flight/load-full-flight.ts";
import { apiFallback } from "../../../../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string; flightId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return fullFlightMetadata((await params).flightId, "ECAM ");
}

/** ECAM page of one of the pilot's flights, to compare with the full page (Greg, 14/11/2026). */
export default async function EcamFlightRoute({ params }: Props) {
  const { locale, flightId } = await params;
  setRequestLocale(locale);
  try {
    const data = await loadFullFlight(flightId);
    if (!data) notFound();
    return <EcamPage data={data} />;
  } catch (error) {
    return apiFallback(error);
  }
}
