"use client";

import type { LiveFlight } from "@weems/contrats";
import { useMemo } from "react";
import type { Airports } from "./airport-book.ts";
import { allRouteLines, routeLinesOf } from "./all-routes.ts";
import type { AllRoutes } from "./all-routes-layers.ts";
import type { LiveFlights } from "./flights-store.ts";

/**
 * The faint routes of the map: all flights when the spectator shows them, else only the preview
 * of the hovered flight. Faded further while a flight is followed or previewed.
 */
export function useLiveRoutes(
  flights: LiveFlights,
  airports: Airports,
  {
    showRoutes,
    selected,
    hovered,
  }: {
    showRoutes: boolean;
    selected: LiveFlight | undefined;
    hovered: { flight: LiveFlight } | null;
  },
): AllRoutes {
  const hoveredFlight = hovered?.flight;
  return useMemo(() => {
    const preview =
      hoveredFlight && hoveredFlight !== selected ? routeLinesOf(hoveredFlight, airports) : [];
    const lines = showRoutes
      ? allRouteLines(flights, airports, selected?.flightId ?? null)
      : { type: "FeatureCollection" as const, features: preview };
    return {
      lines,
      dimmed: selected !== undefined || preview.length > 0,
      hoveredId: preview.length > 0 ? (hoveredFlight?.flightId ?? null) : null,
    };
  }, [showRoutes, flights, airports, selected, hoveredFlight]);
}
