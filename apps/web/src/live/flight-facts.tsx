import type { LiveFlight } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../aircraft/category-badge.tsx";
import { flightLevel } from "../format/flight-format.ts";
import { FictitiousBadge } from "../ui/fictitious-badge.tsx";
import type { Airports } from "./airport-book.ts";
import { RouteSummary } from "./route-summary.tsx";

/**
 * A live flight at a glance, the same in the hover card and in the panel: callsign, category,
 * aircraft, progress along the route, then phase, level and ground speed.
 */
export function FlightFacts({ flight, airports }: { flight: LiveFlight; airports: Airports }) {
  const t = useTranslations("Live");
  const phases = useTranslations("Phases");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const { position } = flight;
  const tiles: [string, string][] = [
    [t("fields.phase"), phases(position.phase)],
    [t("fields.level"), flightLevel(position.altMsl) ?? `${number(position.altMsl)} ft`],
    [t("fields.groundSpeed"), `${number(position.gs)} kt`],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <strong className="font-title text-[19px] leading-tight">{flight.callsign}</strong>
        <CategoryBadge aircraftClass={flight.aircraftClass} />
        {flight.fictitious && <FictitiousBadge />}
      </div>
      <div className="mt-0.5 text-[13px] text-muted">{flight.aircraftTitle}</div>
      {flight.signal === "lost" && <p className="my-1 text-sm text-accent-2">{t("signalLost")}</p>}
      <RouteSummary flight={flight} airports={airports} />
      <dl className="mt-2.5 grid grid-cols-3 gap-1.5">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-[10px] bg-muted/10 px-2 py-1.5">
            <dt className="text-[11.5px] text-muted">{label}</dt>
            <dd className="m-0 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
