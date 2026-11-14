import { redirect } from "next/navigation";
import { fullFlightHref } from "../../../../../../../logbook/flight/full-flight-href.ts";
import { getPathname } from "../../../../../../../i18n/navigation.ts";

interface Props {
  params: Promise<{ locale: string; flightId: string }>;
}

/** Former address of a flight in the page Vols (list and sheet): now its full page. */
export default async function LogbookFlightPage({ params }: Props) {
  const { locale, flightId } = await params;
  redirect(getPathname({ href: fullFlightHref(flightId), locale }));
}
