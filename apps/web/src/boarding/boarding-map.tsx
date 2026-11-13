"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Link, useRouter } from "../i18n/navigation.ts";
import { FlightHoverCard } from "../live/flight-hover-card.tsx";
import { type Hover, LiveMap } from "../live/live-map.tsx";
import { useAirports } from "../live/use-airports.ts";
import { useLiveFlights } from "../live/use-live-flights.ts";
import { useLiveRoutes } from "../live/use-live-routes.ts";
import { useOverlays } from "../live/use-overlays.ts";
import { MapIcon } from "../ui/icons.ts";

const NO_ROUTE = null;

/** Flights of the live stream, their airports, routes, night and the hovered aircraft. */
function useBoardingMap(apiUrl: string) {
  const { flights } = useLiveFlights(apiUrl);
  const airports = useAirports(apiUrl, flights);
  const [hover, setHover] = useState<Hover | null>(null);
  const hoveredFlight = hover ? flights.get(hover.flightId) : undefined;
  const hovered = hoveredFlight && hover ? { flight: hoveredFlight, point: hover.point } : null;
  const allRoutes = useLiveRoutes(flights, airports, {
    showRoutes: true,
    selected: undefined,
    hovered,
  });
  const overlays = useOverlays(flights, airports, true);
  return { flights, airports, hovered, setHover, allRoutes, overlays };
}

/**
 * The live map under the two boards (spec web Boarding): every flight in the air, its route,
 * the night and busy airports, followed live (SSE) like /live. Hovering an aircraft shows its
 * card; a click opens /live following that flight. The wheel scrolls the page, not the map.
 */
export function BoardingMap({ apiUrl }: { apiUrl: string }) {
  const t = useTranslations("Boarding.map");
  const router = useRouter();
  const { flights, airports, hovered, setHover, allRoutes, overlays } = useBoardingMap(apiUrl);
  const box = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-label={t("title")}
      className="overflow-hidden rounded-panel border border-board-edge bg-board shadow-floating"
    >
      <header className="flex items-center gap-2.5 border-b border-board-edge bg-board-head px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-[.18em] text-board-ink uppercase">
          <MapIcon size={18} aria-hidden="true" />
          {t("title")}
        </h2>
        <Link
          href="/live"
          className="ml-auto text-sm font-semibold text-board-call hover:underline"
        >
          {t("open")}
        </Link>
      </header>
      <div ref={box} className="relative h-[420px] sm:h-[520px]">
        <LiveMap
          flights={flights}
          selectedId={null}
          route={NO_ROUTE}
          allRoutes={allRoutes}
          overlays={overlays}
          onSelect={(flightId) => {
            if (flightId) router.push(`/live?flight=${flightId}`);
          }}
          onHover={setHover}
          recenterRequest={0}
          embedded
        />
        {hovered && (
          <FlightHoverCard
            flight={hovered.flight}
            airports={airports}
            point={hovered.point}
            mapWidth={box.current?.clientWidth ?? Infinity}
          />
        )}
      </div>
    </section>
  );
}
