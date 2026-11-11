import type { FlightSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { AlertBadges } from "./alert-badges.tsx";
import { FlightStatus } from "./flight-status.tsx";

const COLUMNS = ["date", "route", "aircraft", "airborne", "status", "alerts"] as const;

/** One line per flight, newest first (spec site minimal, list). */
export function FlightTable({ flights }: { flights: readonly FlightSummary[] }) {
  const t = useTranslations("Flights.columns");
  const site = useTranslations("Site");
  const format = useFormatter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="px-2 py-1.5 font-normal">
                {t(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flights.map((flight) => (
            <tr key={flight.flightId} className="border-b border-line hover:bg-slate-50">
              <td className="px-2 py-1.5 whitespace-nowrap">
                <Link href={`/flights/${flight.flightId}`} className="underline">
                  {format.dateTime(new Date(flight.openedAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </Link>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
              </td>
              <td className="px-2 py-1.5">{flight.aircraftModel ?? flight.aircraftTitle}</td>
              <td className="px-2 py-1.5">
                {formatDuration(flight.times.airborneS) ?? site("notMeasured")}
              </td>
              <td className="px-2 py-1.5">
                <FlightStatus closeReason={flight.closeReason} />
              </td>
              <td className="px-2 py-1.5">
                <AlertBadges alerts={flight.alerts} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
