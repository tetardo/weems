"use client";

import { useEffect, useState } from "react";
import { LiveSnapshot, LiveUpdate } from "@weems/contrats";
import { type LiveEvents, withNewEvents } from "./events-store.ts";
import { applyUpdate, fromSnapshot, type LiveFlights } from "./flights-store.ts";

export type Connection = "connecting" | "open" | "retrying";

/** Follows GET /v1/live/stream. EventSource reconnects by itself after a cut. */
export function useLiveFlights(apiUrl: string): {
  flights: LiveFlights;
  events: LiveEvents;
  connection: Connection;
} {
  const [flights, setFlights] = useState<LiveFlights>(new Map());
  const [events, setEvents] = useState<LiveEvents>([]);
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    const source = new EventSource(`${apiUrl}/v1/live/stream`);
    source.addEventListener("open", () => setConnection("open"));
    source.addEventListener("error", () => setConnection("retrying"));
    source.addEventListener("snapshot", (event) => {
      const snapshot = LiveSnapshot.parse(JSON.parse(event.data));
      setFlights(fromSnapshot(snapshot));
      setEvents(snapshot.events);
    });
    source.addEventListener("update", (event) => {
      const update = LiveUpdate.parse(JSON.parse(event.data));
      setFlights((current) => applyUpdate(current, update));
      setEvents((current) => withNewEvents(current, update.events));
    });
    return () => source.close();
  }, [apiUrl]);

  return { flights, events, connection };
}
