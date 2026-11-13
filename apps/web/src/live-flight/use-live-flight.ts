"use client";

import type { LiveFlight } from "@weems/contrats";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAirports } from "../live/use-airports.ts";
import { useLiveFlights } from "../live/use-live-flights.ts";
import { useLiveRoute } from "../live/use-live-route.ts";
import { useLiveRoutes } from "../live/use-live-routes.ts";
import { useOverlays } from "../live/use-overlays.ts";
import { useLiveTrail } from "./use-live-trail.ts";

/**
 * Reads the page again from the server when the flight changes phase (new events for the phases
 * and the journal) and when it leaves the stream: once closed, the same address shows the full
 * flight page (spec vol en cours).
 */
function useServerRefresh(flight: LiveFlight | undefined): void {
  const router = useRouter();
  const phase = flight?.position.phase ?? null;
  const shown = useRef<string | null>(null);
  useEffect(() => {
    const key = phase ?? "gone";
    if (shown.current !== null && shown.current !== key) router.refresh();
    if (phase !== null || shown.current !== null) shown.current = key;
  }, [phase, router]);
}

/**
 * Everything the page of a flight in progress follows on the live stream: the flight itself, the
 * other aircraft around it (drawn faintly), airports, the route and the points of the profile.
 */
export function useLiveFlight(apiUrl: string, flightId: string) {
  const { flights, ready } = useLiveFlights(apiUrl);
  const flight = flights.get(flightId);
  const airports = useAirports(apiUrl, flights);
  useServerRefresh(flight);
  return {
    flight,
    flights,
    airports,
    /** The first snapshot came and the flight is not in it: no position for 10 minutes. */
    silent: ready && !flight,
    route: useLiveRoute(apiUrl, flight),
    allRoutes: useLiveRoutes(flights, airports, {
      showRoutes: true,
      selected: flight,
      hovered: null,
    }),
    overlays: useOverlays(flights, airports, false),
    points: useLiveTrail(apiUrl, flight),
  };
}
