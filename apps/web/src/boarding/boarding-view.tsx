"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSound } from "../site/sound-setting.ts";
import { DepartureIcon } from "../ui/icons.ts";
import { AircraftChip } from "./aircraft-chip.tsx";
import { AirportFilter } from "./airport-filter.tsx";
import { busiestAirports, PAGE_EVERY_MS } from "./board-rows.ts";
import { BoardingClocks } from "./boarding-clocks.tsx";
import { BoardingTable } from "./boarding-table.tsx";
import { BoardingTicker } from "./boarding-ticker.tsx";
import { FlapSoundContext } from "./flap-text.tsx";
import { useBoardFilters } from "./use-board-filters.ts";
import { useBoarding } from "./use-boarding.ts";
import { useFlapSound } from "./use-flap-sound.ts";

/** Counts the pages: every board shows its next page every 15 s. */
function usePageTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((current) => current + 1), PAGE_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
  return tick;
}

/**
 * Page Boarding (spec web Boarding): the Departures and Arrivals boards of every member side by
 * side, followed live (SSE), filtered by airport and aircraft, pages turning every 15 s, letters turning on change.
 */
export function BoardingView({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Boarding");
  const { board, failed } = useBoarding(apiUrl);
  const { airport, chooseAirport, aircraft, chooseAircraft, choices, shown } =
    useBoardFilters(board);
  const rattle = useFlapSound(useSound());
  const tick = usePageTick();

  return (
    <FlapSoundContext value={rattle}>
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 pt-6 pb-12 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-2 flex items-center gap-2.5 font-title text-2xl font-bold">
            <DepartureIcon size={24} className="text-board-ink" aria-hidden="true" />
            {t("title")}
          </h1>
          <AirportFilter
            airport={airport}
            busiest={board ? busiestAirports(board) : []}
            onChoose={chooseAirport}
          />
          {aircraft && <AircraftChip type={aircraft} onClear={() => chooseAircraft(null)} />}
          <div className="ml-auto flex items-center gap-2">
            <BoardingClocks />
          </div>
        </div>
        {failed && <p className="text-sm text-danger">{t("late")}</p>}
        <div className="grid gap-3 xl:grid-cols-2">
          <BoardingTable
            kind="departures"
            flights={shown?.departures ?? []}
            tick={tick}
            choices={choices}
          />
          <BoardingTable
            kind="arrivals"
            flights={shown?.arrivals ?? []}
            tick={tick}
            choices={choices}
          />
        </div>
        {shown && <BoardingTicker board={shown} />}
        <p className="text-xs text-muted">{t("privacy")}</p>
      </main>
    </FlapSoundContext>
  );
}
