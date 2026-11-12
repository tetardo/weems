"use client";

import type { LiveFlight } from "@weems/contrats";
import { useEffect, useRef, useState } from "react";
import type { LiveFlights } from "./flights-store.ts";
import type { Hover } from "./live-map.tsx";
import { useSelectedFlight } from "./use-selected-flight.ts";

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

/** The followed flight (address, recentring, gone flights) and the hovered one. */
export function useFollowing(flights: LiveFlights) {
  const [selectedId, setSelectedId, unfollow] = useSelectedFlight();
  const selected = selectedId ? flights.get(selectedId) : undefined;
  const { hovered, setHover } = useHoveredFlight(flights, selected);
  useUnfollowGone(selected, unfollow);
  const [recenterRequest, recenter] = useRecenterRequests(selectedId, selected !== undefined);
  const follow = (flight: LiveFlight) => {
    setSelectedId(flight.flightId);
    recenter();
  };
  return {
    selectedId,
    setSelectedId,
    unfollow,
    selected,
    hovered,
    setHover,
    recenterRequest,
    recenter,
    follow,
  };
}
