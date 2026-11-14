"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useTime } from "../../flights/band-parts.tsx";
import {
  oatText,
  stationWeather,
  visibilityText,
  windText,
  type StationWeather,
} from "./station-weather.ts";

/** One end of the flight: airport, time read, wind, temperature, visibility; a click holds it. */
function Station({
  title,
  airport,
  station,
  at,
  onPick,
}: {
  title: string;
  airport: string | null;
  station: StationWeather | null;
  at: string;
  onPick: (minute: number) => void;
}) {
  const t = useTranslations("Logbook.ecamPage");
  return (
    <button
      type="button"
      disabled={!station}
      onClick={() => station && onPick(station.minute)}
      className="grid w-full cursor-pointer grid-cols-[auto_1fr] gap-x-2 rounded-control border border-ecam-edge px-2.5 py-1.5 text-left text-[11.5px] leading-[19px] disabled:cursor-default"
    >
      <span className="col-span-full flex justify-between text-[11px] tracking-[.06em] text-ecam-cyan">
        <span>
          {title} {airport ?? ""}
        </span>
        <span className="text-ecam-dim">{station ? `${at}Z` : ""}</span>
      </span>
      {station ? (
        <>
          <span className="text-ecam-white">{t("wind")}</span>
          <span className="text-right text-ecam-green">{windText(station.weather.wind)}</span>
          <span className="text-ecam-white">OAT</span>
          <span className="text-right text-ecam-green">{oatText(station.weather.oat)}</span>
          <span className="text-ecam-white">VIS</span>
          <span className="text-right text-ecam-green">
            {visibilityText(station.weather.visibilityM)}
          </span>
        </>
      ) : (
        <span className="col-span-full text-ecam-dim">{t("noWeather")}</span>
      )}
    </button>
  );
}

/** Weather at departure and at arrival under the maps (Greg, 14/11/2026). */
export function WeatherPanel({
  bands,
  airports,
  onPick,
}: {
  bands: Bands;
  airports: { departure: string | null; arrival: string | null };
  onPick: (minute: number) => void;
}) {
  const t = useTranslations("Logbook.ecamPage");
  const time = useTime();
  const { departure, arrival } = stationWeather(bands.minutes);
  const at = (s: StationWeather | null) => (s ? time(bands.minutes[s.minute]?.at ?? "") : "");
  return (
    <div className="grid gap-2">
      <Station
        title={t("weatherDeparture")}
        airport={airports.departure}
        station={departure}
        at={at(departure)}
        onPick={onPick}
      />
      <Station
        title={t("weatherArrival")}
        airport={airports.arrival}
        station={arrival}
        at={at(arrival)}
        onPick={onPick}
      />
    </div>
  );
}
