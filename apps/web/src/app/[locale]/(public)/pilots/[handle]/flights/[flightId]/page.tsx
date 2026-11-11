import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicFlight, getPublicTrack } from "../../../../../../../api/public-api.ts";
import { formatRoute } from "../../../../../../../format/flight-format.ts";
import { publicPageMetadata } from "../../../../../../../profile/page-metadata.ts";
import { PublicFlightPage } from "../../../../../../../profile/public-flight-page.tsx";
import { apiFallback } from "../../../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string; handle: string; flightId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle, flightId } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.meta" });
  try {
    const flight = await getPublicFlight(handle, flightId);
    if (!flight) return {};
    const route = formatRoute(flight.departureIcao, flight.plannedArrivalIcao);
    return publicPageMetadata({
      locale,
      path: `/pilots/${handle}/flights/${flight.flightId}`,
      title: `${flight.callsign} ${route}`,
      description: t("flight", { callsign: flight.callsign, route, handle }),
    });
  } catch {
    return {};
  }
}

/** A flight of a public profile (spec J4): the flight page, read only, without an account. */
export default async function PublicFlightRoute({ params }: Props) {
  const { locale, handle, flightId } = await params;
  setRequestLocale(locale);
  try {
    const [flight, track] = await Promise.all([
      getPublicFlight(handle, flightId),
      getPublicTrack(handle, flightId),
    ]);
    if (!flight) notFound();
    return <PublicFlightPage handle={handle} flight={flight} track={track} />;
  } catch (error) {
    return apiFallback(error);
  }
}
