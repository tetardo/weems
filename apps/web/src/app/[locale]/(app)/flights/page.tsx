import { permanentRedirect } from "next/navigation";
import { getPathname } from "../../../../i18n/navigation.ts";

/** « Mes vols » left the bar (Greg, 13/11): every flight is now in the logbook, page Vols. */
export default async function OldFlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(getPathname({ href: "/logbook/flights", locale }));
}
