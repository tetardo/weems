"use client";

import type { FlightBands as Bands, FlightView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatRoute } from "../../../format/flight-format.ts";
import { useTime } from "../../flights/band-parts.tsx";
import type { useEcamReading } from "./use-ecam-reading.ts";

type Reading = ReturnType<typeof useEcamReading>;

const BUTTON = "cursor-pointer border px-1.5 leading-[20px] text-[11.5px]";

/** Copies the address of the held minute (?t=hh:mm), « copied » for two seconds. */
function CopyLink({ time }: { time: string }) {
  const t = useTranslations("Logbook.ecamPage");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button type="button" onClick={copy} className={`${BUTTON} border-ecam-cyan text-ecam-cyan`}>
      {copied ? t("copied") : t("copyLink", { time })}
    </button>
  );
}

/** Title, route and aircraft; scale or zoomed stretch, link to the held minute, full screen. */
export function ScreenHeader({
  flight,
  bands,
  reading,
  fullScreen,
}: {
  flight: FlightView;
  bands: Bands;
  reading: Reading;
  fullScreen: { full: boolean; toggle: () => void };
}) {
  const t = useTranslations("Logbook.ecamPage");
  const time = useTime();
  const { shown, zoomed, view, held } = reading;
  const at = (i: number) => time(bands.minutes[i]?.at ?? "");
  const heldStart = held === null ? undefined : view.starts[held];
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <h2 className="m-0 border-b border-ecam-white text-[14px] font-bold tracking-[.08em]">
        {t("title")}
      </h2>
      <span className="text-ecam-white">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
        <span className="text-ecam-cyan"> · {flight.aircraft.model ?? flight.callsign}</span>
      </span>
      <span className="ml-auto flex flex-wrap items-center gap-2 text-[12px] text-ecam-dim">
        <span className="border border-ecam-cyan px-1.5 leading-[18px] text-ecam-cyan">
          {zoomed
            ? t("zoom", { from: at(shown.from), to: at(shown.to) })
            : t("cell", { minutes: view.size })}
        </span>
        {zoomed ? t("reset") : t("dragHint")}
        {heldStart !== undefined && <CopyLink time={at(heldStart)} />}
        <button
          type="button"
          onClick={fullScreen.toggle}
          className={`${BUTTON} border-ecam-edge text-ecam-white`}
        >
          {fullScreen.full ? t("leaveFullScreen") : t("fullScreen")}
        </button>
      </span>
    </div>
  );
}
