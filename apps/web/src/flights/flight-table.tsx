import type { FlightSummary, PublicFlightSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CategoryBadge } from "../aircraft/category-badge.tsx";
import { Link } from "../i18n/navigation.ts";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { AlertBadges } from "./alert-badges.tsx";
import { FlightStatus } from "./flight-status.tsx";

/** A line of the table: the pilot's own flight, or one of a public profile (spec J4). */
type Row = Omit<PublicFlightSummary, "touchdownVs"> &
  Partial<Pick<PublicFlightSummary, "touchdownVs"> & Pick<FlightSummary, "closeReason">>;

/** Columns of the pilot's own list, and of a public profile (touchdown instead of status). */
const OWN_COLUMNS = [
  "date",
  "callsign",
  "route",
  "aircraft",
  "airborne",
  "status",
  "alerts",
] as const;
export const PUBLIC_COLUMNS = [
  "date",
  "callsign",
  "route",
  "aircraft",
  "airborne",
  "touchdown",
  "alerts",
] as const;
type Column = (typeof OWN_COLUMNS)[number] | (typeof PUBLIC_COLUMNS)[number];

/** One line per flight, newest first (spec site minimal, list); a small card per flight on phones. */
export function FlightTable({
  flights,
  columns = OWN_COLUMNS,
  hrefOf = (id) => `/flights/${id}`,
}: {
  flights: readonly Row[];
  columns?: readonly Column[];
  hrefOf?: (flightId: string) => string;
}) {
  const t = useTranslations("Flights.columns");
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left max-sm:block">
        <thead className="max-sm:hidden">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border-b border-line px-4 py-3 text-[.85em] font-semibold tracking-wide text-muted uppercase"
              >
                {t(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-sm:block">
          {flights.map((flight) => (
            <FlightRow
              key={flight.flightId}
              flight={flight}
              columns={columns}
              href={hrefOf(flight.flightId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlightRow({
  flight,
  columns,
  href,
}: {
  flight: Row;
  columns: readonly Column[];
  href: string;
}) {
  const site = useTranslations("Site");
  const format = useFormatter();
  const cells: Record<Column, () => ReactNode> = {
    date: () => (
      <Link href={href} className="font-medium whitespace-nowrap text-link hover:underline">
        {format.dateTime(new Date(flight.openedAt), { dateStyle: "short", timeStyle: "short" })}
      </Link>
    ),
    callsign: () => (
      <span className="font-title font-bold whitespace-nowrap">{flight.callsign}</span>
    ),
    route: () => (
      <span className="whitespace-nowrap">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
      </span>
    ),
    aircraft: () => (
      <span className="inline-flex flex-wrap items-center gap-2 max-sm:justify-end">
        {flight.aircraftModel ?? flight.aircraftTitle}
        <CategoryBadge aircraftClass={flight.aircraftClass} />
      </span>
    ),
    airborne: () => formatDuration(flight.times.airborneS) ?? site("notMeasured"),
    status: () =>
      flight.closeReason === undefined ? null : <FlightStatus closeReason={flight.closeReason} />,
    touchdown: () =>
      flight.touchdownVs === undefined || flight.touchdownVs === null
        ? "—"
        : format.number(flight.touchdownVs),
    alerts: () => <AlertBadges alerts={flight.alerts} />,
  };
  return (
    <tr className="border-b border-line last:border-0 hover:bg-ink/4 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:gap-x-4 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3 sm:[&>td]:px-4 sm:[&>td]:py-3 max-sm:[&>td:nth-child(even)]:text-right">
      {columns.map((column) => (
        <td key={column}>{cells[column]()}</td>
      ))}
    </tr>
  );
}
