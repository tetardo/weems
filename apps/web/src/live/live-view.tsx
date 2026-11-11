"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RoutesIcon } from "../ui/icons.ts";
import { allRouteLines } from "./all-routes.ts";
import { FlightPanel } from "./flight-panel.tsx";
import type { LiveFlights } from "./flights-store.ts";
import { LiveMap } from "./live-map.tsx";
import { useAirports } from "./use-airports.ts";
import { useLiveFlights } from "./use-live-flights.ts";
import { useLiveRoute } from "./use-live-route.ts";
import { useShowRoutes } from "./use-show-routes.ts";

const NO_FLIGHTS: LiveFlights = new Map();

/**
 * The /live page: map, flight counter, routes switch, panel of the selected flight. The map goes
 * up under the floating bar and down under the dock (decision 003): -mt-18 is the bar and its
 * top margin.
 */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Live");
  const { flights, connection } = useLiveFlights(apiUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useShowRoutes();
  const selected = selectedId ? flights.get(selectedId) : undefined;
  const route = useLiveRoute(apiUrl, selected ? selectedId : null);
  const airports = useAirports(apiUrl, showRoutes ? flights : NO_FLIGHTS);
  const allRoutes = useMemo(
    () => ({
      lines: allRouteLines(showRoutes ? flights : NO_FLIGHTS, airports, selectedId),
      dimmed: selected !== undefined,
    }),
    [showRoutes, flights, airports, selectedId, selected],
  );

  return (
    <main className="relative -mt-18 flex-1 max-md:-mb-24">
      <LiveMap
        flights={flights}
        selectedId={selectedId}
        route={route}
        allRoutes={allRoutes}
        onSelect={setSelectedId}
      />
      <div className="absolute top-21 left-3 flex flex-col items-start gap-2 sm:left-6">
        <div className="rounded-[10px] border border-line bg-surface px-3 py-1.5">
          {t("count", { count: flights.size })} · {t(`connection.${connection}`)}
        </div>
        <button
          type="button"
          aria-pressed={showRoutes}
          onClick={() => setShowRoutes(!showRoutes)}
          className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-3 aria-pressed:border-accent aria-pressed:text-accent"
        >
          <RoutesIcon size={18} />
          {t("showRoutes")}
        </button>
      </div>
      {selected && (
        <FlightPanel flight={selected} route={route} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
