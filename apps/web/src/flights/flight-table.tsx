import type { FlightSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { AlertBadges } from "./alert-badges.tsx";
import { FlightStatus } from "./flight-status.tsx";

const COLUMNS = ["date", "callsign", "route", "aircraft", "airborne", "status", "alerts"] as const;

/** One line per flight, newest first (spec site minimal, list). */
export function FlightTable({ flights }: { flights: readonly FlightSummary[] }) {
  const t = useTranslations("Flights.columns");
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="p-3 font-semibold">
                {t(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
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
    <tr className="odd:bg-gray-100/50 hover:bg-gray-100">
      <td className="p-3 whitespace-nowrap">
        <Link href={`/flights/${flight.flightId}`} className="text-blue-600 hover:underline">
          {format.dateTime(new Date(flight.openedAt), { dateStyle: "short", timeStyle: "short" })}
        </Link>
      </td>
      <td className="p-3 whitespace-nowrap">{flight.callsign}</td>
      <td className="p-3 whitespace-nowrap">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
      </td>
      <td className="p-3">{flight.aircraftModel ?? flight.aircraftTitle}</td>
      <td className="p-3">{formatDuration(flight.times.airborneS) ?? site("notMeasured")}</td>
      <td className="p-3">
        <FlightStatus closeReason={flight.closeReason} />
      </td>
      <td className="p-3">
        <AlertBadges alerts={flight.alerts} />
      </td>
    </tr>
  );
}
