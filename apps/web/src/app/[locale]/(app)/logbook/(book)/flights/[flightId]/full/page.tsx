import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { formatRoute } from "../../../../../../../../format/flight-format.ts";
import { FullFlightPage } from "../../../../../../../../logbook/flight/full-flight-page.tsx";
import { loadFullFlight } from "../../../../../../../../logbook/flight/load-full-flight.ts";
import { apiFallback } from "../../../../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string; flightId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const data = await loadFullFlight((await params).flightId);
    if (!data) return {};
    const { flight } = data;
    return {
      title: `${flight.callsign} ${formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}`,
    };
  } catch {
    return {};
  }
}

/** Full page of one of the pilot's flights, in the logbook (maquette v13, A). */
export default async function FullFlightRoute({ params }: Props) {
  const { locale, flightId } = await params;
  setRequestLocale(locale);
  try {
    const data = await loadFullFlight(flightId);
    if (!data) notFound();
    return <FullFlightPage data={data} />;
  } catch (error) {
    return apiFallback(error);
  }
}
