"use client";

import { useEffect, useMemo, useState } from "react";
import type { Airports } from "./airport-book.ts";
import { activeAirports } from "./airport-activity.ts";
import type { LiveFlights } from "./flights-store.ts";
import { nightArea } from "./night-area.ts";
import type { Overlays } from "./overlay-layers.ts";

/** The night moves by a quarter of a degree a minute: redrawn once a minute is plenty. */
const NIGHT_EVERY_MS = 60_000;

/** The time, renewed every minute. */
function useMinute(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), NIGHT_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Night (when shown) and busy airports of the flights on the map. */
export function useOverlays(
  flights: LiveFlights,
  airports: Airports,
  showNight: boolean,
): Overlays {
  const now = useMinute();
  const night = useMemo(() => (showNight ? nightArea(now) : null), [showNight, now]);
  const busyAirports = useMemo(() => activeAirports(flights, airports), [flights, airports]);
  return useMemo(() => ({ night, busyAirports }), [night, busyAirports]);
}
