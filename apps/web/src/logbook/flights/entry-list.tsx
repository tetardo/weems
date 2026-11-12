import type { LogbookEntry } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatRoute } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { TouchdownValue } from "../touchdown-value.tsx";
import { type EntryFilter, flightsHref } from "./entry-filter.ts";
import { VERDICT_BORDERS, VerdictChip } from "./verdict-chip.tsx";

/** One line: date, route, aircraft, verdict, touchdown; the selected one is highlighted. */
function EntryLine({
  entry,
  selected,
  filter,
}: {
  entry: LogbookEntry;
  selected: boolean;
  filter: EntryFilter;
}) {
  const format = useFormatter();
  const { flight } = entry;
  return (
    <li>
      <Link
        href={flightsHref(filter, flight.flightId)}
        aria-current={selected ? "page" : undefined}
        className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 rounded-control border-l-3 px-3 py-2 ${VERDICT_BORDERS[entry.verdict]} ${selected ? "bg-accent/12" : "hover:bg-line/40"}`}
      >
        <b className="font-semibold">
          {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
        </b>
        {entry.touchdownVs === null ? (
          <span className="text-muted">—</span>
        ) : (
          <TouchdownValue vs={entry.touchdownVs} />
        )}
        <span className="truncate text-[12.5px] text-muted">
          {format.dateTime(new Date(flight.openedAt), {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}{" "}
          · {flight.aircraftModel ?? flight.aircraftTitle}
        </span>
        <VerdictChip verdict={entry.verdict} />
      </Link>
    </li>
  );
}

/** Compact list of the page Vols (maquette v8, B), newest first. */
export function EntryList({
  entries,
  selectedId,
  filter,
}: {
  entries: readonly LogbookEntry[];
  selectedId: string | null;
  filter: EntryFilter;
}) {
  const t = useTranslations("Logbook.flights");
  return (
    <section className="rounded-panel border border-line bg-surface p-2">
      <h2 className="m-0 flex items-baseline justify-between px-2 pt-1 pb-2 text-[15px]">
        {t("title")}{" "}
        <span className="text-[12.5px] font-normal text-muted">
          {t("count", { count: entries.length })}
        </span>
      </h2>
      {entries.length === 0 ? (
        <p className="m-0 px-2 pb-2 text-[13px] text-muted">
          {t(filter === "all" ? "empty" : "emptyFiltered")}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 md:max-h-[calc(100vh-11rem)] md:overflow-y-auto">
          {entries.map((entry) => (
            <EntryLine
              key={entry.flight.flightId}
              entry={entry}
              selected={entry.flight.flightId === selectedId}
              filter={filter}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
