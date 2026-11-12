"use client";

import type { LiveFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon } from "../ui/icons.ts";
import { searchFlights } from "./flight-finder.ts";
import { FlightRouteCodes } from "./flight-route-codes.tsx";
import type { LiveFlights } from "./flights-store.ts";

/** « / » anywhere on the page but in a field puts the cursor in the search. */
function useSlashShortcut(input: { current: HTMLInputElement | null }): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea");
      if (event.key !== "/" || typing) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input]);
}

/** Answers under the search field; « Aucun vol trouvé » when there is none. */
function SearchResults({
  id,
  found,
  onPick,
}: {
  id: string;
  found: LiveFlight[];
  onPick: (flight: LiveFlight) => void;
}) {
  const t = useTranslations("Live.search");
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_14px_36px_rgb(0_0_0/.2)]"
    >
      {found.length === 0 && <li className="px-3 py-2 text-muted">{t("none")}</li>}
      {found.map((flight) => (
        <li key={flight.flightId} role="option" aria-selected={false}>
          <button
            type="button"
            onClick={() => onPick(flight)}
            className="flex min-h-11 w-full items-center gap-3 px-3 text-left hover:bg-muted/10"
          >
            <strong className="font-title">{flight.callsign}</strong>
            <FlightRouteCodes flight={flight} />
            {flight.pilot && (
              <span className="ml-auto truncate text-[13px]">{flight.pilot.name}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Search of the live map (idea 1): callsign, public pilot, airport. Choosing an answer follows
 * that flight; Enter takes the first one, Escape clears.
 */
export function LiveSearch({
  flights,
  onPick,
}: {
  flights: LiveFlights;
  onPick: (flight: LiveFlight) => void;
}) {
  const t = useTranslations("Live.search");
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  useSlashShortcut(input);
  const found = searchFlights(flights, query);
  const pick = (flight: LiveFlight) => {
    onPick(flight);
    setQuery("");
    input.current?.blur();
  };
  return (
    <div className="relative w-full">
      <label className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 focus-within:border-accent">
        <SearchIcon size={18} className="text-muted" aria-hidden="true" />
        <span className="sr-only">{t("label")}</span>
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={query.length > 0}
          aria-controls={listId}
          value={query}
          placeholder={t("placeholder")}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && found[0]) pick(found[0]);
            if (event.key === "Escape") setQuery("");
          }}
          className="min-w-0 flex-1 bg-transparent py-2 outline-none focus-visible:outline-none"
        />
        <kbd className="rounded-md border border-line px-1.5 text-[12px] text-muted max-md:hidden">
          /
        </kbd>
      </label>
      {query.trim().length > 0 && <SearchResults id={listId} found={found} onPick={pick} />}
    </div>
  );
}
