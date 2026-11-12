import type { PublicFlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { FlightDetails } from "../flight/flight-details.tsx";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "@weems/ui";
import { BackIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";

/** A flight of a public profile (spec J4): the flight page, read only, with a way back. */
export function PublicFlightPage({
  handle,
  flight,
  track,
}: {
  handle: string;
  flight: PublicFlightView;
  track: TrackView | null;
}) {
  const t = useTranslations("Profile");
  return (
    <SectionMain>
      <Link href={`/pilots/${handle}`} className={`${buttonClass("ghost")} -ml-3 text-link`}>
        <BackIcon size={20} aria-hidden="true" />
        {t("back")}
      </Link>
      <FlightDetails flight={flight} track={track} />
    </SectionMain>
  );
}
