import type { LiveFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { CloseIcon, OpenProfileIcon, RecenterIcon } from "../ui/icons.ts";
import { ShareButton } from "../ui/share-button.tsx";
import type { Airports } from "./airport-book.ts";
import { FlightFacts } from "./flight-facts.tsx";
import { PilotLine } from "./pilot-line.tsx";

interface Props {
  flight: LiveFlight;
  airports: Airports;
  onClose: () => void;
  onRecenter: () => void;
}

/**
 * The followed flight (spec J4, carte en direct, variant B): its facts, its pilot with a link
 * to the public profile when there is one, and the actions. A card on the right on a computer,
 * a sheet at the bottom of a phone screen, leaving the route visible above it.
 */
export function FlightPanel({ flight, airports, onClose, onRecenter }: Props) {
  const t = useTranslations("Live.panel");
  const { pilot } = flight;
  return (
    <aside className="absolute top-21 right-3 z-20 w-80 rounded-panel border border-line bg-surface px-4 py-3.5 shadow-[0_14px_36px_rgb(0_0_0/.25)] sm:right-6 max-md:fixed max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:z-40 max-md:w-auto max-md:rounded-b-none max-md:pb-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent px-2 py-0.5 text-[12px] font-semibold text-accent">
          <RecenterIcon size={13} aria-hidden="true" />
          {t("followed")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="grid size-11 place-items-center text-muted -mr-2"
        >
          <CloseIcon size={20} aria-hidden="true" />
        </button>
      </div>
      <FlightFacts flight={flight} airports={airports} />
      <div className="mt-3 flex items-center gap-2.5 rounded-box border border-line p-2.5">
        <PilotLine pilot={pilot} />
        {pilot && (
          <Link
            href={`/pilots/${pilot.handle}`}
            className={`${buttonClass("primary")} ml-auto flex-none`}
          >
            {t("profile")}
            <OpenProfileIcon size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ShareButton
          label={t("share")}
          copied={t("copied")}
          title={t("shareTitle", { callsign: flight.callsign })}
        />
        <button type="button" onClick={onRecenter} className={buttonClass("outline")}>
          <RecenterIcon size={16} aria-hidden="true" />
          {t("recenter")}
        </button>
      </div>
    </aside>
  );
}
