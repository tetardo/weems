"use client";

import { useCallback, useEffect, useState } from "react";
import { airportCode } from "./board-rows.ts";

/** Address of one airport's boards: /boarding?airport=LFML, a link that can be shared. */
const PARAM = "airport";

/**
 * The airport chosen on the page, kept in the address: read once the page is open, written
 * (without a new history entry) at each change.
 */
export function useAirportFilter(): [
  airport: string | null,
  choose: (code: string | null) => void,
] {
  const [airport, setAirport] = useState<string | null>(null);
  useEffect(() => {
    setAirport(airportCode(new URLSearchParams(window.location.search).get(PARAM)));
  }, []);
  const choose = useCallback((code: string | null) => {
    setAirport(code);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set(PARAM, code);
    else url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, []);
  return [airport, choose];
}
