"use client";

import { useMemo, useRef } from "react";
import { FlightHoverCard } from "./flight-hover-card.tsx";
import { FlightPanel } from "./flight-panel.tsx";
import { CategoryLegend } from "./category-legend.tsx";
import { visibleFlights } from "./category-filter.ts";
import { LiveEventsPanel } from "./live-events-panel.tsx";
import { LiveSidebar } from "./live-sidebar.tsx";
import { LiveMap } from "./live-map.tsx";
import { useAirports } from "./use-airports.ts";
import { useLiveFlights } from "./use-live-flights.ts";
import { useLiveRoute } from "./use-live-route.ts";
import { useLiveRoutes } from "./use-live-routes.ts";
import { useFollowing } from "./use-following.ts";
import { useHiddenCategories } from "./use-hidden-categories.ts";
import { useOverlays } from "./use-overlays.ts";
import { useStoredSwitch } from "./use-stored-switch.ts";

/** The spectator's choices: routes and night switches, hidden categories. */
function useMapChoices() {
  const [showRoutes, setShowRoutes] = useStoredSwitch("weems-live-routes", true);
  const [showNight, setShowNight] = useStoredSwitch("weems-live-night", true);
  const [hidden, toggleCategory] = useHiddenCategories();
  return {
    routes: { on: showRoutes, set: setShowRoutes },
    night: { on: showNight, set: setShowNight },
    hidden,
    toggleCategory,
  };
}

/** Everything the page shows: flights from the stream, the spectator's choices, the layers. */
function useLivePage(apiUrl: string) {
  const { flights: all, events, connection } = useLiveFlights(apiUrl);
  const choices = useMapChoices();
  // Memoised: the map, routes and layers recompute only when flights or filters change, not on hover.
  const flights = useMemo(() => visibleFlights(all, choices.hidden), [all, choices.hidden]);
  const following = useFollowing(flights);
  const { selected, selectedId, hovered } = following;
  const airports = useAirports(apiUrl, all);
  const showRoutes = choices.routes.on;
  return {
    ...following,
    all,
    events,
    connection,
    choices,
    flights,
    airports,
    route: useLiveRoute(apiUrl, selected ? selectedId : null),
    allRoutes: useLiveRoutes(flights, airports, { showRoutes, selected, hovered }),
    overlays: useOverlays(flights, airports, choices.night.on),
  };
}

/**
 * Bottom of the map: category legend on the left (on top, under the search, on a phone), latest
 * events on the right while no flight is followed (computer only).
 */
function MapCorners({ page }: { page: ReturnType<typeof useLivePage> }) {
  const { choices } = page;
  return (
    <>
      <div className="absolute bottom-9 left-6 max-w-[calc(100%-26rem)] max-md:top-36 max-md:right-3 max-md:bottom-auto max-md:left-3 max-md:max-w-none">
        <CategoryLegend
          flights={page.all}
          hidden={choices.hidden}
          onToggle={choices.toggleCategory}
        />
      </div>
      {!page.selected && (
        <div className="absolute right-6 bottom-9 max-md:hidden">
          <LiveEventsPanel events={page.events} />
        </div>
      )}
    </>
  );
}

/**
 * The /live page: map, search, flights list, switches and category legend, latest events, card
 * of the hovered flight and panel of the followed one (spec J4, carte en direct). The map goes up
 * under the floating bar (decision 003): -mt-18 is the bar and its top margin. Airports are always loaded: the card and the panel show the progress even with the
 * routes hidden. Hidden categories leave the map, the list and the search.
 */
export function LiveView({ apiUrl }: { apiUrl: string }) {
  const page = useLivePage(apiUrl);
  const { flights, airports, selected, hovered, choices } = page;
  const mapBox = useRef<HTMLElement>(null);
  return (
    <main ref={mapBox} className="relative -mt-18 flex-1">
      <LiveMap
        flights={flights}
        selectedId={page.selectedId}
        route={page.route}
        allRoutes={page.allRoutes}
        overlays={page.overlays}
        onSelect={page.setSelectedId}
        onHover={page.setHover}
        recenterRequest={page.recenterRequest}
      />
      <LiveSidebar
        flights={flights}
        airports={airports}
        connection={page.connection}
        routes={choices.routes}
        night={choices.night}
        onPick={page.follow}
      />
      <MapCorners page={page} />
      {hovered && (
        <FlightHoverCard
          flight={hovered.flight}
          airports={airports}
          point={hovered.point}
          mapWidth={mapBox.current?.clientWidth ?? Infinity}
        />
      )}
      {selected && (
        <FlightPanel
          flight={selected}
          airports={airports}
          onClose={page.unfollow}
          onRecenter={page.recenter}
        />
      )}
    </main>
  );
}
