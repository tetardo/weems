import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ApiUnavailable } from "../../../../../api/api-request.ts";
import { getVisibility } from "../../../../../api/profile-api.ts";
import { getFlight, getReview, getTrack } from "../../../../../api/weems-api.ts";
import { FlightPage } from "../../../../../flight/flight-page.tsx";
import { formatRoute } from "../../../../../format/flight-format.ts";
import { ApiDown } from "../../../../../site/api-down.tsx";

interface Props {
  params: Promise<{ locale: string; flightId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const flight = await getFlight((await params).flightId);
    return {
      title: flight
        ? `${flight.callsign} ${formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}`
        : "—",
    };
  } catch {
    return {};
  }
}

/** Spec site minimal: one flight, with its simplified track (about 500 points) and its review (J3). */
export default async function FlightRoute({ params }: Props) {
  const { locale, flightId } = await params;
  setRequestLocale(locale);
  try {
    const [flight, track, review, visibility] = await Promise.all([
      getFlight(flightId),
      getTrack(flightId),
      getReview(flightId),
      getVisibility(flightId),
    ]);
    if (!flight) notFound();
    return (
      <FlightPage
        flight={flight}
        track={track}
        review={review}
        hiddenOnProfile={visibility?.hiddenOnProfile ?? null}
      />
    );
  } catch (error) {
    if (error instanceof ApiUnavailable) return <ApiDown url={error.url} />;
    throw error;
  }
}
