import type { FlightSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../aircraft/category-badge.tsx";
import { Link } from "../i18n/navigation.ts";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { AlertBadges } from "./alert-badges.tsx";
import { FlightStatus } from "./flight-status.tsx";

const COLUMNS = ["date", "callsign", "route", "aircraft", "airborne", "status", "alerts"] as const;

/** One line per flight, newest first (spec site minimal, list); a small card per flight on phones. */
export function FlightTable({ flights }: { flights: readonly FlightSummary[] }) {
  const t = useTranslations("Flights.columns");
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left max-sm:block">
        <thead className="max-sm:hidden">
          <tr>
            {COLUMNS.map((column) => (
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
            <FlightRow key={flight.flightId} flight={flight} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlightRow({ flight }: { flight: FlightSummary }) {
  const site = useTranslations("Site");
  const format = useFormatter();
  return (
    <tr className="border-b border-line last:border-0 hover:bg-ink/4 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:gap-x-4 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3 sm:[&>td]:px-4 sm:[&>td]:py-3 max-sm:[&>td:nth-child(even)]:text-right">
      <td className="whitespace-nowrap">
        <Link
          href={`/flights/${flight.flightId}`}
          className="font-medium text-link hover:underline"
        >
          {format.dateTime(new Date(flight.openedAt), { dateStyle: "short", timeStyle: "short" })}
        </Link>
      </td>
      <td className="font-title font-bold whitespace-nowrap">{flight.callsign}</td>
      <td className="whitespace-nowrap">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
      </td>
      <td>
        <span className="inline-flex flex-wrap items-center gap-2 max-sm:justify-end">
          {flight.aircraftModel ?? flight.aircraftTitle}
          <CategoryBadge aircraftClass={flight.aircraftClass} />
        </span>
      </td>
      <td>{formatDuration(flight.times.airborneS) ?? site("notMeasured")}</td>
      <td>
        <FlightStatus closeReason={flight.closeReason} />
      </td>
      <td>
        <AlertBadges alerts={flight.alerts} />
      </td>
    </tr>
  );
}
