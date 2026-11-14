import type { LogbookSummary } from "@weems/contrats";
import { fullFlightHref } from "../flight/full-flight-href.ts";
import { useFormatter, useTranslations } from "next-intl";
import { formatRoute } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { FlightsIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
import { TouchdownValue } from "../touchdown-value.tsx";

/** « Vols récents »: the 4 last flights, their touchdown in its colour, each opening its page. */
export function RecentFlights({ flights }: { flights: LogbookSummary["recentFlights"] }) {
  const t = useTranslations("Logbook.summary.recent");
  const format = useFormatter();
  const all = (
    <Link href="/logbook/flights" className="font-semibold text-link">
      {t("all")}
    </Link>
  );
  return (
    <LogbookCard icon={FlightsIcon} title={t("title")} aside={all}>
      <ul className="m-0 list-none p-0">
        {flights.map(({ flight, touchdownVs }) => (
          <li key={flight.flightId} className="border-b border-line last:border-b-0">
            <Link
              href={fullFlightHref(flight.flightId)}
              className="grid grid-cols-[3.5em_minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-[14px] hover:text-link sm:grid-cols-[3.5em_9em_minmax(0,1fr)_auto]"
            >
              <span className="text-muted tabular-nums">
                {format.dateTime(new Date(flight.openedAt), { day: "2-digit", month: "2-digit" })}
              </span>
              <b className="font-semibold">
                {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
              </b>
              <span className="truncate text-muted max-sm:hidden">
                {flight.aircraftModel ?? flight.aircraftTitle}
              </span>
              {touchdownVs === null ? (
                <span className="text-muted">—</span>
              ) : (
                <TouchdownValue vs={touchdownVs} />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </LogbookCard>
  );
}
