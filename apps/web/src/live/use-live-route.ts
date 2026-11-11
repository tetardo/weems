"use client";

import { LiveRoute } from "@weems/contrats";
import { useEffect, useState } from "react";

/** The trail grows by one point every 15 s on the API: reading it twice a minute is plenty. */
const REFRESH_MS = 30_000;

/**
 * Route of the selected flight (airports and flown trail), read when it is selected and then
 * every 30 s; null while loading, when nothing is selected, or when the API does not answer.
 * Only the selected flight is asked for, so the cost does not grow with the number of flights.
 */
export function useLiveRoute(apiUrl: string, flightId: string | null): LiveRoute | null {
  const [route, setRoute] = useState<{ flightId: string; route: LiveRoute } | null>(null);

  useEffect(() => {
    if (!flightId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/live/flights/${flightId}/route`, {
          signal: controller.signal,
        });
        if (response.ok) setRoute({ flightId, route: LiveRoute.parse(await response.json()) });
      } catch {
        // Network cut or flight gone: keep what is drawn, the next try may work.
      }
    };
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [apiUrl, flightId]);

  return route?.flightId === flightId ? route.route : null;
}
