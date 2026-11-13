import { permanentRedirect } from "next/navigation";
import { getPathname } from "../../../../../i18n/navigation.ts";
import { fullFlightHref } from "../../../../../logbook/flight/full-flight-href.ts";

/** Old address of a flight (« Mes vols »): its full page is now in the logbook (Greg, 13/11). */
export default async function OldFlightPage({
  params,
}: {
  params: Promise<{ locale: string; flightId: string }>;
}) {
  const { locale, flightId } = await params;
  permanentRedirect(getPathname({ href: fullFlightHref(flightId), locale }));
}
