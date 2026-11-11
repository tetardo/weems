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
              <th
                key={column}
                className="px-6 py-3 text-[0.65rem] font-bold tracking-wide text-[#8392ab] uppercase opacity-70"
              >
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
    <tr className="border-t border-[#e9ecef] text-sm hover:bg-[#f8f9fa]">
      <td className="px-6 py-3 whitespace-nowrap">
        <Link
          href={`/flights/${flight.flightId}`}
          className="font-semibold text-[#344767] hover:text-[#cb0c9f]"
        >
          {format.dateTime(new Date(flight.openedAt), { dateStyle: "short", timeStyle: "short" })}
        </Link>
      </td>
      <td className="px-6 py-3 whitespace-nowrap">{flight.callsign}</td>
      <td className="px-6 py-3 whitespace-nowrap">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
      </td>
      <td className="px-6 py-3">{flight.aircraftModel ?? flight.aircraftTitle}</td>
      <td className="px-6 py-3">{formatDuration(flight.times.airborneS) ?? site("notMeasured")}</td>
      <td className="px-6 py-3">
        <FlightStatus closeReason={flight.closeReason} />
      </td>
      <td className="px-6 py-3">
        <AlertBadges alerts={flight.alerts} />
      </td>
    </tr>
  );
}
