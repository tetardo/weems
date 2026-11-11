"use client";

import { useState } from "react";
import { FlightPanel } from "./flight-panel.tsx";
import { LiveMap } from "./live-map.tsx";
import { useLiveFlights } from "./use-live-flights.ts";

const CONNECTION_FR = { connecting: "Connexion…", open: "En direct", retrying: "Reconnexion…" };

/** The /live page: map, flight counter, panel of the selected flight. */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const { flights, connection } = useLiveFlights(apiUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? flights.get(selectedId) : undefined;

  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <LiveMap flights={flights} selectedId={selectedId} onSelect={setSelectedId} />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "6px 10px",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        }}
      >
        <strong>{flights.size}</strong> {flights.size > 1 ? "vols en cours" : "vol en cours"} ·{" "}
        {CONNECTION_FR[connection]}
      </div>
      {selected && <FlightPanel flight={selected} onClose={() => setSelectedId(null)} />}
    </main>
  );
}
