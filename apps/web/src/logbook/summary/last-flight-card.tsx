import type { LogbookLastFlight, TrackView } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../../aircraft/category-badge.tsx";
import { Link } from "../../i18n/navigation.ts";
import { DepartureIcon } from "../../ui/icons.ts";
import { FlightMinis } from "../flight-minis.tsx";
import { StageProfile } from "./stage-profile.tsx";
import { LogbookCard } from "../logbook-card.tsx";

/** Page Résumé, « Dernier vol » (maquette v6, C): route, aircraft, small cards, profile by stage. */
export function LastFlightCard({
  last,
  points,
  now,
}: {
  last: LogbookLastFlight;
  points: TrackView["points"];
  /** Time of the page, for « il y a 40 min ». */
  now: Date;
}) {
  const t = useTranslations("Logbook.summary.last");
  const format = useFormatter();
  const { flight } = last;
  const time = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });
  const ended = flight.closedAt ?? flight.openedAt;
  return (
    <LogbookCard
      icon={DepartureIcon}
      title={t("title")}
      aside={format.relativeTime(new Date(Math.min(Date.parse(ended), now.getTime())), now)}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-title text-[24px] font-semibold">
            {flight.departureIcao ?? "—"} <span className="text-muted">→</span>{" "}
            {flight.plannedArrivalIcao ?? "—"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            <b className="text-ink">{flight.aircraftModel ?? flight.aircraftTitle}</b>
            <CategoryBadge aircraftClass={flight.aircraftClass} />
            <span>
              {format.dateTime(new Date(flight.openedAt), { day: "numeric", month: "short" })} ·{" "}
              {time(flight.openedAt)} → {time(ended)} UTC
            </span>
          </div>
        </div>
        <Link href={`/logbook/flights/${flight.flightId}`} className={buttonClass()}>
          {t("open")}
        </Link>
      </div>
      <FlightMinis facts={last} />
      <StageProfile points={points} />
    </LogbookCard>
  );
}
