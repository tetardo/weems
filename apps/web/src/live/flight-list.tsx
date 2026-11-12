"use client";

import type { LiveFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CategoryDot } from "../aircraft/category-dot.tsx";
import { flightLevel } from "../format/flight-format.ts";
import { ExpandIcon, ListIcon } from "../ui/icons.ts";
import type { Airports } from "./airport-book.ts";
import { categoryOf } from "./category-filter.ts";
import { SORT_KEYS, type SortKey, sortFlights } from "./flight-finder.ts";
import { FlightRouteCodes } from "./flight-route-codes.tsx";
import type { LiveFlights } from "./flights-store.ts";

/** One line of the list: category, callsign, route, phase and level. A click follows the flight. */
function FlightRow({ flight, onPick }: { flight: LiveFlight; onPick: () => void }) {
  const phases = useTranslations("Phases");
  const { position } = flight;
  const level = flightLevel(position.altMsl);
  return (
    <li className="border-t border-line">
      <button
        type="button"
        onClick={onPick}
        className="flex min-h-11 w-full items-center gap-3 px-3 text-left hover:bg-muted/10"
      >
        <CategoryDot category={categoryOf(flight)} />
        <strong className="w-20 flex-none truncate font-title">{flight.callsign}</strong>
        <FlightRouteCodes flight={flight} />
        <span className="ml-auto rounded-full bg-muted/10 px-2 py-0.5 text-[12px] whitespace-nowrap text-muted">
          {phases(position.phase)}
          <span className="max-md:hidden">{level && ` · ${level}`}</span>
        </span>
      </button>
    </li>
  );
}

/** Title and number of flights (a click folds or unfolds the list), then the order. */
function ListHeader({
  count,
  open,
  onOpen,
  sort,
  onSort,
}: {
  count: number;
  open: boolean;
  onOpen: (open: boolean) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
}) {
  const t = useTranslations("Live.list");
  return (
    <div className="flex min-h-11 items-center gap-2 px-3">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("toggle")}
        onClick={() => onOpen(!open)}
        className="flex min-h-11 items-center gap-2 font-semibold"
      >
        <ListIcon size={18} aria-hidden="true" />
        {t("title")}
        <span className="rounded-full border border-line px-2 text-[12px]">{count}</span>
        <ExpandIcon size={16} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <label className="ml-auto flex items-center gap-1 text-[13px] text-muted">
          <span className="sr-only">{t("sortLabel")}</span>
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as SortKey)}
            className="min-h-11 bg-transparent"
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`sorts.${key}`)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

/**
 * « En vol » (idea 3): every flight shown on the map, sorted closest to arrival first, by
 * callsign or by phase. Folded by default on a phone, where it is a sheet at the bottom.
 */
export function FlightList({
  flights,
  airports,
  onPick,
}: {
  flights: LiveFlights;
  airports: Airports;
  onPick: (flight: LiveFlight) => void;
}) {
  const [open, setOpen] = useState(true);
  // Folded on a phone, decided after the first render: the server does not know the screen.
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);
  const [sort, setSort] = useState<SortKey>("arrival");
  const sorted = useMemo(() => sortFlights(flights, airports, sort), [flights, airports, sort]);
  return (
    <section className="w-full overflow-hidden rounded-control border border-line bg-surface max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:rounded-b-none">
      <ListHeader count={flights.size} open={open} onOpen={setOpen} sort={sort} onSort={setSort} />
      {open && (
        <ul className="max-h-[38vh] overflow-y-auto">
          {sorted.map((flight) => (
            <FlightRow key={flight.flightId} flight={flight} onPick={() => onPick(flight)} />
          ))}
        </ul>
      )}
    </section>
  );
}
