import { useTranslations } from "next-intl";
import { Link } from "../../../i18n/navigation.ts";
import { BackIcon } from "../../../ui/icons.ts";
import { fullFlightHref } from "../../flight/full-flight-href.ts";
import type { FullFlight } from "../../flight/load-full-flight.ts";
import { EcamScreen } from "./ecam-screen.tsx";

/** ECAM page of a flight in the logbook: back to the full page, then the cockpit screen. */
export function EcamPage({ data }: { data: FullFlight }) {
  const t = useTranslations("Logbook.ecamPage");
  const { flight, points, bands } = data;
  return (
    <div className="grid gap-4">
      <Link
        href={fullFlightHref(flight.flightId)}
        className="inline-flex items-center gap-1 text-[13px] text-link"
      >
        <BackIcon size={16} aria-hidden="true" />
        {t("back")}
      </Link>
      {bands ? (
        <EcamScreen flight={flight} points={points} bands={bands} />
      ) : (
        <p className="m-0 text-[13px] text-muted">{t("noTrack")}</p>
      )}
    </div>
  );
}
