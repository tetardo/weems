import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { BackIcon, ForwardIcon } from "../../ui/icons.ts";
import type { FullFlight } from "./load-full-flight.ts";
import { fullFlightHref } from "./full-flight-href.ts";
import { VisibilitySwitch } from "./visibility-switch.tsx";

const STEP = `${buttonClass("outline")} min-h-9 px-3 text-[13px]`;

/** Back to the list, the public page switch, then the older and newer flights of the logbook. */
export function FullFlightTop({ data }: { data: FullFlight }) {
  const t = useTranslations("Logbook.flight");
  const id = data.flight.flightId;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href={`/logbook/flights/${id}`}
        className="inline-flex items-center gap-1 text-[13px] text-link"
      >
        <BackIcon size={16} aria-hidden="true" />
        {t("allFlights")}
      </Link>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {data.hiddenOnProfile !== null && (
          <VisibilitySwitch flightId={id} hidden={data.hiddenOnProfile} />
        )}
        <nav aria-label={t("neighbours")} className="flex gap-2">
          {data.older && (
            <Link href={fullFlightHref(data.older)} className={STEP}>
              <BackIcon size={15} aria-hidden="true" />
              {t("older")}
            </Link>
          )}
          {data.newer && (
            <Link href={fullFlightHref(data.newer)} className={STEP}>
              {t("newer")}
              <ForwardIcon size={15} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
