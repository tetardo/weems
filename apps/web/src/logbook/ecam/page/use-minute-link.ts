"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { useEffect, useRef } from "react";
import { minuteOfParam, minuteParam } from "./row-facts.ts";
import { cellOfMinute, type Place } from "./window-bands.ts";

/**
 * The held minute in the address (?t=hh:mm, Greg idea 5): opening such a link holds that minute,
 * holding a minute writes it, letting go removes it. `place` turns a minute into a cell of the view.
 */
export function useMinuteLink(
  bands: Bands,
  place: Place,
  held: number | null,
  hold: (cell: number | null) => void,
) {
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    const minute = minuteOfParam(
      bands.minutes,
      new URLSearchParams(window.location.search).get("t"),
    );
    if (minute !== null) hold(cellOfMinute(place.view, place.shown, minute));
  });
  useEffect(() => {
    if (!opened.current) return;
    const url = new URL(window.location.href);
    const minute = held === null ? undefined : bands.minutes[place.view.starts[held] ?? -1];
    if (minute) url.searchParams.set("t", minuteParam(minute));
    else url.searchParams.delete("t");
    const href = url.href.replace("%3A", ":"); // ?t=06:38, readable when shared
    if (href !== window.location.href) window.history.replaceState(null, "", href);
  });
}
