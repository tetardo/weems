"use client";

import { useCallback, useState } from "react";

/** Address of a followed flight: /live?flight=<id>, the link of « Partager le vol ». */
const PARAM = "flight";

const fromAddress = () =>
  typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(PARAM);

/**
 * The followed flight, kept in the address so that the page can be shared and reloaded: read
 * once when the page opens, written (without a new history entry) at each change.
 */
export function useSelectedFlight(): [string | null, (flightId: string | null) => void] {
  const [selectedId, setSelectedId] = useState(fromAddress);
  const select = useCallback((flightId: string | null) => {
    setSelectedId(flightId);
    const url = new URL(window.location.href);
    if (flightId) url.searchParams.set(PARAM, flightId);
    else url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, []);
  return [selectedId, select];
}
