"use client";

import type { BoardingFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { ArrivalIcon, DepartureIcon } from "../ui/icons.ts";
import { AircraftCell, AirportCell, PilotCell, StatusCell, TimeCell } from "./board-cells.tsx";
import { arrivalTime, departureTime, pageOf } from "./board-rows.ts";
import { FlapText } from "./flap-text.tsx";

type Kind = "departures" | "arrivals";

/** One flight: a click on its callsign opens it on the live map. */
function Row({ flight, kind }: { flight: BoardingFlight; kind: Kind }) {
  const time =
    kind === "departures" ? { at: departureTime(flight), estimated: false } : arrivalTime(flight);
  const landed = flight.status === "landed";
  return (
    <tr className={`border-t border-board-line hover:bg-board-head ${landed ? "opacity-60" : ""}`}>
      <td className="py-1.5 pl-3">
        <TimeCell {...time} />
      </td>
      <td className="px-1.5">
        <Link href={`/live?flight=${flight.flightId}`} className="rounded-tag hover:opacity-80">
          <FlapText text={flight.callsign} width={10} tone="title" />
        </Link>
      </td>
      <td className="px-1.5">
        {kind === "departures" ? (
          <AirportCell icao={flight.arrivalIcao} name={flight.arrivalName} />
        ) : (
          <AirportCell icao={flight.departureIcao} name={flight.departureName} />
        )}
      </td>
      <td className="px-1.5 max-lg:hidden">
        <AircraftCell flight={flight} />
      </td>
      <td className="px-1.5 max-sm:hidden">
        <PilotCell flight={flight} />
      </td>
      <td className="py-1.5 pr-3 text-right">
        <StatusCell flight={flight} />
      </td>
    </tr>
  );
}

/** Title in both languages, page and number of flights. */
function BoardHead({
  kind,
  count,
  page,
  pages,
}: {
  kind: Kind;
  count: number;
  page: number;
  pages: number;
}) {
  const t = useTranslations("Boarding");
  const Icon = kind === "departures" ? DepartureIcon : ArrivalIcon;
  return (
    <header className="flex items-center gap-2.5 border-b border-board-edge bg-board-head px-4 py-3">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-[.18em] text-board-ink uppercase">
        <Icon size={18} aria-hidden="true" />
        {t(`${kind}.title`)}
      </h2>
      <span className="text-[11px] tracking-[.16em] text-board-label uppercase max-sm:hidden">
        {t(`${kind}.other`)}
      </span>
      <span className="ml-auto font-mono text-xs text-board-muted">
        {pages > 1 && `${page + 1}/${pages} · `}
        {t("count", { count })}
      </span>
    </header>
  );
}

/** Column titles; the aircraft and the pilot give way first on narrow screens. */
function ColumnTitles({ kind }: { kind: Kind }) {
  const t = useTranslations("Boarding.columns");
  return (
    <thead>
      <tr className="text-left text-[9.5px] tracking-[.14em] text-board-label uppercase">
        <th
          className={`py-2 pl-3 font-semibold ${kind === "departures" ? "w-14 sm:w-16" : "w-[72px] sm:w-20"}`}
        >
          {t("time")}
        </th>
        <th className="w-[124px] px-1.5 font-semibold sm:w-40">{t("flight")}</th>
        <th className="w-[60px] px-1.5 font-semibold sm:w-20 2xl:w-44">
          {t(kind === "departures" ? "to" : "from")}
        </th>
        <th className="w-[76px] px-1.5 font-semibold max-lg:hidden">{t("aircraft")}</th>
        <th className="px-1.5 font-semibold max-sm:hidden">{t("pilot")}</th>
        <th className="w-24 pr-3 text-right font-semibold sm:w-28">{t("status")}</th>
      </tr>
    </thead>
  );
}

/**
 * The Departures or the Arrivals board (spec web Boarding): 12 lines per page, the pages turning
 * by themselves with `tick`.
 */
export function BoardingTable({
  kind,
  flights,
  tick,
}: {
  kind: Kind;
  flights: readonly BoardingFlight[];
  tick: number;
}) {
  const t = useTranslations("Boarding");
  const { rows, page, pages } = pageOf(flights, tick);
  return (
    <section
      aria-label={t(`${kind}.title`)}
      className="overflow-hidden rounded-panel border border-board-edge bg-board text-board-ink shadow-floating"
    >
      <BoardHead kind={kind} count={flights.length} page={page} pages={pages} />
      <table className="w-full table-fixed border-collapse">
        <ColumnTitles kind={kind} />
        <tbody>
          {rows.map((flight) => (
            <Row key={flight.flightId} flight={flight} kind={kind} />
          ))}
          {rows.length === 0 && (
            <tr className="border-t border-board-line">
              <td colSpan={6} className="px-4 py-4 text-sm text-board-muted">
                {t(`${kind}.none`)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="border-t border-board-line px-4 py-2.5 text-[11.5px] text-board-muted">
        {t(`${kind}.note`)}
      </p>
    </section>
  );
}
