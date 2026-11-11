"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FlightPanel } from "./flight-panel.tsx";
import { LiveMap } from "./live-map.tsx";
import { useLiveFlights } from "./use-live-flights.ts";
import { useLiveRoute } from "./use-live-route.ts";

/**
 * The /live page: map, flight counter, panel of the selected flight. The map goes up under the
 * floating bar and down under the dock (decision 003): -mt-18 is the bar and its top margin.
 */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Live");
  const { flights, connection } = useLiveFlights(apiUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? flights.get(selectedId) : undefined;
  const route = useLiveRoute(apiUrl, selected ? selectedId : null);

  return (
    <main className="relative -mt-18 flex-1 max-md:-mb-24">
      <LiveMap flights={flights} selectedId={selectedId} route={route} onSelect={setSelectedId} />
      <div className="absolute top-21 left-3 rounded sm:left-6-[10px] border border-line bg-surface px-3 py-1.5">
        {t("count", { count: flights.size })} · {t(`connection.${connection}`)}
      </div>
      {selected && (
        <FlightPanel flight={selected} route={route} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
