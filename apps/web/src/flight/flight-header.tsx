import type { PublicFlightView } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { FlightStatus } from "../flights/flight-status.tsx";
import { CardBox } from "../ui/card-box.tsx";

/** Callsign, aircraft, route, date, block and flight times, pauses apart (EF-15). */
export function FlightHeader({ flight }: { flight: PublicFlightView }) {
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
    <CardBox className="mt-2 mb-5 border-t-4 border-t-accent">
      <header>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="m-0 text-[1.9em]">{flight.callsign}</h1>
          <span className="font-title text-lg text-link">
            {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
          </span>
          <FlightStatus closeReason={flight.closeReason} />
        </div>
        <p className="mt-1 mb-0 text-muted">{flight.aircraft.title}</p>
        <dl className="mt-5 mb-0 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-[1.7fr_repeat(5,1fr)]">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[.85em] tracking-wide text-muted uppercase">{label}</dt>
              <dd className="m-0 font-title text-lg font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </header>
    </CardBox>
  );
}
