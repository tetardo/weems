import type { FlightView } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { FlightStatus } from "../flights/flight-status.tsx";
import { CardBox } from "../ui/card-box.tsx";

/** Callsign, aircraft, route, date, block and flight times, pauses apart (EF-15). */
export function FlightHeader({ flight }: { flight: FlightView }) {
  const t = useTranslations("Flight.header");
  const site = useTranslations("Site");
  const format = useFormatter();
  const duration = (seconds: number | null) => formatDuration(seconds) ?? site("notMeasured");
  const facts: [string, string][] = [
    [
      t("date"),
      format.dateTime(new Date(flight.openedAt), { dateStyle: "medium", timeStyle: "short" }) +
        " UTC",
    ],
    [t("block"), duration(flight.times.blockS)],
    [t("airborne"), duration(flight.times.airborneS)],
    [t("paused"), duration(flight.times.pausedS)],
    [t("simulator"), flight.aircraft.simulator],
    [t("registration"), flight.aircraft.registration ?? site("notMeasured")],
  ];
  return (
    <CardBox className="my-6">
      <header>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl leading-tight">{flight.callsign}</h1>
          <span className="text-lg">
            {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
          </span>
          <FlightStatus closeReason={flight.closeReason} />
        </div>
        <p className="text-gray-500">{flight.aircraft.title}</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="m-0 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </header>
    </CardBox>
  );
}
