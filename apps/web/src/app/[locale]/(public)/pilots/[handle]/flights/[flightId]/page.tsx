import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getPublicFlight,
  getPublicPilot,
  getPublicTrack,
} from "../../../../../../../api/public-api.ts";
import { formatRoute } from "../../../../../../../format/flight-format.ts";
import { LiveFlightPage } from "../../../../../../../live-flight/live-flight-page.tsx";
import { publicPageMetadata } from "../../../../../../../profile/page-metadata.ts";
import { PublicFlightPage } from "../../../../../../../profile/public-flight-page.tsx";
import { apiFallback } from "../../../../../../../site/api-fallback.tsx";
import { publicApiUrl } from "../../../../../../../site/api-url.ts";

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

/**
 * A flight of a public profile (spec J4), read only, without an account: in progress, the page
 * that follows it live (spec vol en cours); closed, the flight page, at the same address.
 */
export default async function PublicFlightRoute({ params }: Props) {
  const { locale, handle, flightId } = await params;
  setRequestLocale(locale);
  try {
    const flight = await getPublicFlight(handle, flightId);
    if (!flight) notFound();
    if (flight.closedAt === null) {
      const pilot = await getPublicPilot(handle);
      return (
        <LiveFlightPage apiUrl={publicApiUrl()} handle={handle} flight={flight} pilot={pilot} />
      );
    }
    const track = await getPublicTrack(handle, flightId);
    return <PublicFlightPage handle={handle} flight={flight} track={track} />;
  } catch (error) {
    return apiFallback(error);
  }
}
