import type { LogbookLastFlight, TrackView } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CategoryBadge } from "../../aircraft/category-badge.tsx";
import { formatDuration } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { DepartureIcon } from "../../ui/icons.ts";
import { StageProfile } from "./stage-profile.tsx";
import { SummaryCard } from "./summary-card.tsx";
import { TouchdownValue } from "./touchdown-value.tsx";

function Mini({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-box border border-line px-3 py-2">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="text-[17px] font-semibold tabular-nums">{children}</div>
    </div>
  );
}

/** The six small cards: touchdown, duration, distance, fuel, bounces, alerts. */
function Minis({ last }: { last: LogbookLastFlight }) {
  const t = useTranslations("Logbook.summary.last");
  const site = useTranslations("Site");
  const alerts = useTranslations("Alerts");
  const { flight } = last;
  const none = site("notMeasured");
  const duration = formatDuration(flight.times.airborneS ?? flight.times.blockS);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <Mini label={t("touchdown")}>
        {last.touchdownVs === null ? none : <TouchdownValue vs={last.touchdownVs} />}
      </Mini>
      <Mini label={t("duration")}>{duration ?? none}</Mini>
      <Mini label={t("distance")}>
        {last.distanceNm === null ? none : t("nm", { nm: Math.round(last.distanceNm) })}
      </Mini>
      <Mini label={t("fuel")}>
        <span className="text-[14px] font-normal text-muted">{none}</span>
      </Mini>
      <Mini label={t("bounces")}>{last.bounces}</Mini>
      <Mini label={t("alerts")}>
        {flight.alerts.length === 0 ? t("noAlert") : flight.alerts.map((a) => alerts(a)).join(", ")}
      </Mini>
    </div>
  );
}

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
    <SummaryCard
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
        <Link href={`/flights/${flight.flightId}`} className={buttonClass()}>
          {t("open")}
        </Link>
      </div>
      <Minis last={last} />
      <StageProfile points={points} />
    </SummaryCard>
  );
}
