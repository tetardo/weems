"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FlightPanel } from "./flight-panel.tsx";
import { LiveMap } from "./live-map.tsx";
import { useLiveFlights } from "./use-live-flights.ts";

/** The /live page: map, flight counter, panel of the selected flight. */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Live");
  const { flights, connection } = useLiveFlights(apiUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? flights.get(selectedId) : undefined;

  return (
    <main className="relative flex-1">
      <LiveMap flights={flights} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="absolute top-3 left-3 rounded-[10px] border border-line bg-surface px-3 py-1.5">
        {t("count", { count: flights.size })} · {t(`connection.${connection}`)}
      </div>
      {selected && <FlightPanel flight={selected} onClose={() => setSelectedId(null)} />}
    </main>
  );
}
