"use client";

import type { LiveFlight } from "@weems/contrats";
import { useEffect, useRef, useState } from "react";
import { FlightHoverCard } from "./flight-hover-card.tsx";
import { FlightPanel } from "./flight-panel.tsx";
import type { LiveFlights } from "./flights-store.ts";
import { LiveControls } from "./live-controls.tsx";
import { type Hover, LiveMap } from "./live-map.tsx";
import { useAirports } from "./use-airports.ts";
import { useLiveFlights } from "./use-live-flights.ts";
import { useLiveRoute } from "./use-live-route.ts";
import { useLiveRoutes } from "./use-live-routes.ts";
import { useSelectedFlight } from "./use-selected-flight.ts";
import { useShowRoutes } from "./use-show-routes.ts";

/** Touch screens have no hover: a tap opens the panel directly. */
const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

/** The flight under the mouse and where, except the followed one; never on touch screens. */
function useHoveredFlight(flights: LiveFlights, selected: LiveFlight | undefined) {
  const [hover, setHover] = useState<Hover | null>(null);
  const flight = hover && canHover() ? flights.get(hover.flightId) : undefined;
  const hovered = flight !== selected && flight && hover ? { flight, point: hover.point } : null;
  return { hovered, setHover };
}

/** Each new value centres the map on the followed flight: the button, and a shared link once. */
function useRecenterRequests(
  selectedId: string | null,
  hasSelected: boolean,
): [number, () => void] {
  const [request, setRequest] = useState(0);
  const recenter = () => setRequest((n) => n + 1);
  const openedOn = useRef(selectedId);
  useEffect(() => {
    if (!hasSelected || openedOn.current !== selectedId) return;
    openedOn.current = null;
    setRequest((n) => n + 1);
  }, [hasSelected, selectedId]);
  return [request, recenter];
}

/** A followed flight that leaves the map (landed, silent) is no longer followed, nor in the address. */
function useUnfollowGone(selected: LiveFlight | undefined, unfollow: () => void): void {
  const seen = useRef(false);
  useEffect(() => {
    if (selected) seen.current = true;
    else if (seen.current) {
      seen.current = false;
      unfollow();
    }
  }, [selected, unfollow]);
}

/**
 * The /live page: map, flight counter, routes switch, card of the hovered flight and panel of
 * the followed one (spec J4, carte en direct). The map goes up under the floating bar (decision
 * 003): -mt-18 is the bar and its top margin. Airports are always
 * loaded: the card and the panel show the progress even with the routes hidden.
 */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const { flights, connection } = useLiveFlights(apiUrl);
  const [selectedId, setSelectedId, unfollow] = useSelectedFlight();
  const [showRoutes, setShowRoutes] = useShowRoutes();
  const mapBox = useRef<HTMLElement>(null);
  const selected = selectedId ? flights.get(selectedId) : undefined;
  const { hovered, setHover } = useHoveredFlight(flights, selected);
  useUnfollowGone(selected, unfollow);
  const [recenterRequest, recenter] = useRecenterRequests(selectedId, selected !== undefined);
  const route = useLiveRoute(apiUrl, selected ? selectedId : null);
  const airports = useAirports(apiUrl, flights);
  const allRoutes = useLiveRoutes(flights, airports, { showRoutes, selected, hovered });

  return (
    <main ref={mapBox} className="relative -mt-18 flex-1">
      <LiveMap
        flights={flights}
        selectedId={selectedId}
        route={route}
        allRoutes={allRoutes}
        onSelect={setSelectedId}
        onHover={setHover}
        recenterRequest={recenterRequest}
      />
      <LiveControls
        count={flights.size}
        connection={connection}
        showRoutes={showRoutes}
        onShowRoutes={setShowRoutes}
      />
      {hovered && (
        <FlightHoverCard
          flight={hovered.flight}
          airports={airports}
          point={hovered.point}
          mapWidth={mapBox.current?.clientWidth ?? Infinity}
        />
      )}
      {selected && (
        <FlightPanel
          flight={selected}
          airports={airports}
          onClose={unfollow}
          onRecenter={recenter}
        />
      )}
    </main>
  );
}
