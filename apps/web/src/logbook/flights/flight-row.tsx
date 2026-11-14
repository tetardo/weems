import type { LogbookListEntry } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../../aircraft/category-badge.tsx";
import { formatDuration, shortAirportName } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { StatsIcon } from "../../ui/icons.ts";
import { ecamFlightHref, fullFlightHref } from "../flight/full-flight-href.ts";
import { TouchdownValue } from "../touchdown-value.tsx";
import { TABLE_GRID, WIDE_ONLY } from "./table-layout.ts";
import { VERDICT_BORDERS, VerdictChip } from "./verdict-chip.tsx";

const shortName = (name: string | null) => (name === null ? "—" : shortAirportName(name));

/** Touchdown, with the bounces and go-arounds under it. */
function TouchdownCell({ entry }: { entry: LogbookListEntry }) {
  const t = useTranslations("Logbook.flights");
  const notes = [
    entry.bounces > 0 && t("bounces", { count: entry.bounces }),
    entry.goArounds > 0 && t("goArounds", { count: entry.goArounds }),
  ].filter(Boolean);
  return (
    <div role="cell" className="text-right">
      {entry.touchdownVs === null ? (
        <span className="text-muted">—</span>
      ) : (
        <>
          <TouchdownValue vs={entry.touchdownVs} />{" "}
          <span className="text-[12px] text-muted">{t("fpm")}</span>
        </>
      )}
      {notes.length > 0 && (
        <span className="block text-[11.5px] font-medium text-accent-2">{notes.join(" · ")}</span>
      )}
    </div>
  );
}

/** Verdict, with the alerts of the flight under it (pause, sim rate, slew, position, crash). */
function VerdictCell({ entry }: { entry: LogbookListEntry }) {
  const t = useTranslations("Alerts");
  const { alerts } = entry.flight;
  return (
    <div role="cell" className="flex flex-col items-end gap-1 lg:items-start">
      <VerdictChip verdict={entry.verdict} />
      {alerts.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {alerts.map((alert) => (
            <span
              key={alert}
              className={`rounded-tag px-1.5 py-px text-[11px] font-semibold ${alert === "crashed" ? "bg-danger/12 text-danger" : "bg-accent-2/14 text-accent-2"}`}
            >
              {t(alert)}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** Route: ICAO codes (the link of the line) and callsign, airport names under them from `lg`. */
function RouteCell({ entry }: { entry: LogbookListEntry }) {
  const { flight } = entry;
  return (
    <div role="cell" className="order-1 col-start-1 min-w-0 lg:order-none lg:col-start-auto">
      <Link
        href={fullFlightHref(flight.flightId)}
        className="font-semibold text-ink after:absolute after:inset-0 after:content-['']"
      >
        {flight.departureIcao ?? "—"} → {flight.plannedArrivalIcao ?? "—"}
      </Link>{" "}
      <span className="text-[12px] text-muted">{flight.callsign}</span>
      <span className={`block truncate text-[12px] text-muted ${WIDE_ONLY}`}>
        {shortName(entry.departureName)} → {shortName(entry.arrivalName)}
      </span>
    </div>
  );
}

/**
 * One flight of the list: the whole line opens the full flight page (link stretched over the
 * line from the route), the ECAM button above it opens the ECAM page.
 */
export function FlightRow({ entry }: { entry: LogbookListEntry }) {
  const t = useTranslations("Logbook.flights");
  const format = useFormatter();
  const { flight } = entry;
  const opened = new Date(flight.openedAt);
  return (
    <div
      role="row"
      className={`${TABLE_GRID} relative border-l-3 border-t border-t-line px-3 py-2.5 hover:bg-accent/6 ${VERDICT_BORDERS[entry.verdict]}`}
    >
      <div
        role="cell"
        className="order-2 col-start-1 text-[12.5px] text-muted lg:order-none lg:text-[14px] lg:text-ink"
      >
        {format.dateTime(opened, { day: "2-digit", month: "2-digit", year: "2-digit" })}{" "}
        <span className="text-muted">
          {format.dateTime(opened, { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <RouteCell entry={entry} />
      <div role="cell" className={`${WIDE_ONLY} flex min-w-0 items-center gap-2`}>
        <span className="max-w-[60%] shrink-0 truncate">
          {flight.aircraftModel ?? flight.aircraftTitle}
        </span>
        <span className="min-w-0 overflow-hidden">
          <CategoryBadge aircraftClass={flight.aircraftClass} />
        </span>
      </div>
      <div role="cell" className={`${WIDE_ONLY} text-right tabular-nums`}>
        {formatDuration(flight.times.blockS) ?? "—"}
      </div>
      <div className="col-start-2 row-span-2 row-start-1 flex flex-col items-end gap-1 lg:contents">
        <TouchdownCell entry={entry} />
        <VerdictCell entry={entry} />
      </div>
      <div role="cell" className={`${WIDE_ONLY} text-right`}>
        <Link
          href={ecamFlightHref(flight.flightId)}
          title={t("ecamPage")}
          aria-label={t("ecamPage")}
          className="relative z-10 inline-flex size-8 items-center justify-center rounded-control border border-line text-ink hover:border-accent hover:text-link"
        >
          <StatsIcon size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
