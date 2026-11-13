"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useStoredSwitch } from "../live/use-stored-switch.ts";
import { DepartureIcon, SoundOffIcon, SoundOnIcon } from "../ui/icons.ts";
import { AirportFilter } from "./airport-filter.tsx";
import { busiestAirports, forAirport, PAGE_EVERY_MS } from "./board-rows.ts";
import { BoardingClocks } from "./boarding-clocks.tsx";
import { BoardingTable } from "./boarding-table.tsx";
import { BoardingTicker } from "./boarding-ticker.tsx";
import { FlapSoundContext } from "./flap-text.tsx";
import { useAirportFilter } from "./use-airport-filter.ts";
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

/** Rattle of the flaps: off by default, the choice kept in the browser. */
function SoundSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const t = useTranslations("Boarding");
  const Icon = on ? SoundOnIcon : SoundOffIcon;
  return (
    <button
      type="button"
      aria-pressed={on}
      title={t(on ? "soundOff" : "soundOn")}
      onClick={() => onChange(!on)}
      className={`grid size-9 place-items-center rounded-control border border-line ${on ? "text-accent" : "text-muted"} hover:text-ink`}
    >
      <Icon size={17} aria-hidden="true" />
      <span className="sr-only">{t(on ? "soundOff" : "soundOn")}</span>
    </button>
  );
}

/**
 * Page Boarding (spec web Boarding): the Departures and Arrivals boards of every member side by
 * side, read every 5 s, filtered by airport, pages turning every 15 s, letters turning on change.
 */
export function BoardingView({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Boarding");
  const { board, failed } = useBoarding(apiUrl);
  const [airport, chooseAirport] = useAirportFilter();
  const [sound, setSound] = useStoredSwitch("weems.boarding.sound", false);
  const rattle = useFlapSound(sound);
  const tick = usePageTick();
  const shown = board && forAirport(board, airport);

  return (
    <FlapSoundContext value={rattle}>
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-3 py-5 sm:px-6">
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
          <div className="ml-auto flex items-center gap-2">
            <BoardingClocks />
            <SoundSwitch on={sound} onChange={setSound} />
          </div>
        </div>
        {failed && <p className="text-sm text-danger">{t("late")}</p>}
        <div className="grid gap-3 xl:grid-cols-2">
          <BoardingTable kind="departures" flights={shown?.departures ?? []} tick={tick} />
          <BoardingTable kind="arrivals" flights={shown?.arrivals ?? []} tick={tick} />
        </div>
        {shown && <BoardingTicker board={shown} />}
        <p className="text-xs text-muted">{t("privacy")}</p>
      </main>
    </FlapSoundContext>
  );
}
