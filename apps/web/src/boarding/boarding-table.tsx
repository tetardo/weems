"use client";

import type { BoardingFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { ArrivalIcon, DepartureIcon } from "../ui/icons.ts";
import { AircraftCell, AirportCell, PilotCell, StatusCell, TimeCell } from "./board-cells.tsx";
import { flightHref } from "./board-links.ts";
import { arrivalTime, departureTime, pageOf } from "./board-rows.ts";
import { FlapText } from "./flap-text.tsx";

type Kind = "departures" | "arrivals";

/** What a click on an airport or an aircraft type filters. */
export interface BoardChoices {
  airport: (icao: string) => void;
  aircraft: (type: string) => void;
}

/** The callsign: its public page once closed, the live map while flying (`flightHref`). */
function CallsignCell({ flight }: { flight: BoardingFlight }) {
  const callsign = <FlapText text={flight.callsign} width={10} tone="title" />;
  const href = flightHref(flight);
  if (!href) return callsign;
  return (
    <Link href={href} className="rounded-tag hover:opacity-80">
      {callsign}
    </Link>
  );
}

/**
 * One flight: the callsign opens the flight, the pilot their page, the airport and the aircraft
 * filter the boards.
 */
function Row({
  flight,
  kind,
  choices,
}: {
  flight: BoardingFlight;
  kind: Kind;
  choices: BoardChoices;
}) {
  const time =
    kind === "departures" ? { at: departureTime(flight), estimated: false } : arrivalTime(flight);
  const landed = flight.status === "landed";
  return (
    <tr className={`border-t border-board-line hover:bg-board-head ${landed ? "opacity-60" : ""}`}>
      <td className="py-1.5 pl-3">
        <TimeCell {...time} />
      </td>
      <td className="px-1.5">
        <CallsignCell flight={flight} />
      </td>
      <td className="px-1.5">
        {kind === "departures" ? (
          <AirportCell
            icao={flight.arrivalIcao}
            name={flight.arrivalName}
            onChoose={choices.airport}
          />
        ) : (
          <AirportCell
            icao={flight.departureIcao}
            name={flight.departureName}
            onChoose={choices.airport}
          />
        )}
      </td>
      <td className="px-1.5 max-lg:hidden">
        <AircraftCell flight={flight} onChoose={choices.aircraft} />
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
        <th className="w-[60px] px-1.5 font-semibold sm:w-20 lg:w-52 xl:w-20">
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
  choices,
}: {
  kind: Kind;
  flights: readonly BoardingFlight[];
  tick: number;
  choices: BoardChoices;
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
            <Row key={flight.flightId} flight={flight} kind={kind} choices={choices} />
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
