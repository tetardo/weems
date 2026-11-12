"use client";

import { AirportList } from "@weems/contrats";
import { useEffect, useRef, useState } from "react";
import { type Airports, missingCodes, withAnswer } from "./airport-book.ts";
import type { LiveFlights } from "./flights-store.ts";

/**
 * Airports of the flights on the map. A code is asked once per page (a few dozen requests at
 * most, then none): the list grows only when a flight to a new airport appears.
 */
export function useAirports(apiUrl: string, flights: LiveFlights): Airports {
  const [airports, setAirports] = useState<Airports>(new Map());
  const asked = useRef(new Set<string>());

  useEffect(() => {
    const known = new Map([...asked.current].map((code) => [code, null]));
    for (const batch of missingCodes(flights, known)) {
      batch.forEach((code) => asked.current.add(code));
      void fetch(`${apiUrl}/v1/airports?codes=${batch.join(",")}`)
        .then(async (response) => AirportList.parse(await response.json()))
        .then(({ airports: found }) => setAirports((current) => withAnswer(current, batch, found)))
        // API unreachable: forget the batch so that the next update asks again.
        .catch(() => batch.forEach((code) => asked.current.delete(code)));
    }
  }, [apiUrl, flights]);

  return airports;
}
