"use client";

import { LiveRoute, type LiveFlight } from "@weems/contrats";
import { useEffect, useState } from "react";
import { type FollowedRoute, followedRoute, withPosition } from "./followed-trail.ts";

/**
 * Route of the selected flight (airports and flown trail): read once when it is selected, then
 * grown from the positions of the live stream, without reading it again. null while loading, when
 * nothing is selected, or when the API does not answer. Only the selected flight is asked for, so
 * the cost does not grow with the number of flights.
 */
export function useLiveRoute(apiUrl: string, flight: LiveFlight | undefined): LiveRoute | null {
  const flightId = flight?.flightId ?? null;
  const [followed, setFollowed] = useState<FollowedRoute | null>(null);

  useEffect(() => {
    if (!flightId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/live/flights/${flightId}/route`, {
          signal: controller.signal,
        });
        if (response.ok) {
          setFollowed(followedRoute(flightId, LiveRoute.parse(await response.json())));
        }
      } catch {
        // Network cut or flight gone: nothing drawn; selecting the flight again tries again.
      }
    };
    void load();
    return () => controller.abort();
  }, [apiUrl, flightId]);

  const position = flight?.position;
  useEffect(() => {
    if (!position) return;
    setFollowed((current) =>
      current && current.flightId === flightId ? withPosition(current, position) : current,
    );
  }, [flightId, position]);

  return followed?.flightId === flightId ? followed.route : null;
}
