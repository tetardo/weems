"use client";

import type { LiveRoute, PositionReport } from "@weems/contrats";
import type { FeatureCollection } from "geojson";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { AllRoutes } from "../live/all-routes-layers.ts";
import type { LiveFlights } from "../live/flights-store.ts";
import { crossTrackNm } from "../live/great-circle.ts";
import { LiveMap } from "../live/live-map.tsx";
import type { Overlays } from "../live/overlay-layers.ts";
import { useMapTheme } from "../map/use-map-theme.ts";
import { formatCoordinates } from "./coordinates.ts";
import { VECTOR_MINUTES } from "./map-detail.ts";

/** Off the direct route by less than this, the aircraft is said on it, nm. */
const ON_ROUTE_NM = 0.5;

const nothing = () => undefined;

/** Callsign, level, speed, coordinates and distance off the direct route, over the map. */
function PositionCard({
  callsign,
  position,
  route,
}: {
  callsign: string;
  position: PositionReport;
  route: LiveRoute | null;
}) {
  const t = useTranslations("LiveFlight");
  const decimal = (1.5).toLocaleString(useLocale()).charAt(1);
  const off =
    route?.departure && route.arrival
      ? crossTrackNm(route.departure, route.arrival, position)
      : null;
  const side =
    off === null ? null : Math.abs(off) < ON_ROUTE_NM ? "on" : off < 0 ? "left" : "right";
  return (
    <div className="absolute top-2.5 left-2.5 rounded-box border border-accent/45 bg-surface/85 px-2.5 py-1.5 text-[11.5px] backdrop-blur">
      <b className="font-title text-[12.5px]">{callsign}</b>
      <span className="block font-mono text-ink">
        {formatCoordinates(position.lat, position.lon, decimal)}
      </span>
      {side && off !== null && (
        <span className="block text-muted">
          {t(`offRoute.${side}`, { nm: Math.abs(off).toFixed(1).replace(".", decimal) })}
        </span>
      )}
    </div>
  );
}

/** Colours of the trail by altitude, the direct route, the speed vector and the other flights. */
function Legend() {
  const t = useTranslations("LiveFlight.legend");
  const ramp = useMapTheme().altitudeRamp.join(", ");
  return (
    <div className="absolute bottom-2.5 left-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-box border border-line bg-surface/85 px-2.5 py-1.5 text-[11px] text-muted backdrop-blur">
      <span className="flex items-center gap-1.5">
        <i
          className="h-1 w-8 rounded-full"
          style={{ background: `linear-gradient(90deg, ${ramp})` }}
        />
        {t("flown")}
      </span>
      <span className="flex items-center gap-1.5">
        <i className="w-5 border-t-2 border-dashed border-muted" />
        {t("direct")}
      </span>
      <span className="flex items-center gap-1.5">
        <i className="w-5 border-t-2 border-ink" />
        {t("vector", { minutes: VECTOR_MINUTES })}
      </span>
      <span className="flex items-center gap-1.5">
        <i className="w-5 border-t border-muted opacity-60" />
        {t("others")}
      </span>
    </div>
  );
}

/**
 * Fixed map of a flight in progress (Greg, 13/11/2026): no move by hand, no zoom, centred on the
 * aircraft as it flies; the other aircraft around faintly with their routes, and the details of
 * this flight (trail by altitude, speed vector, phase markers, direct route).
 */
export function LiveFlightMap(props: {
  flightId: string;
  callsign: string;
  position: PositionReport | null;
  flights: LiveFlights;
  route: LiveRoute | null;
  allRoutes: AllRoutes;
  overlays: Overlays;
  detail: FeatureCollection;
}) {
  const { position, route } = props;
  // The trail is drawn by altitude in the detail layers: not a second time in one colour.
  const shownRoute = useMemo(() => route && { ...route, trail: [] }, [route]);
  return (
    <div className="relative min-h-96 flex-1 overflow-hidden rounded-box">
      <LiveMap
        flights={props.flights}
        selectedId={props.flightId}
        route={shownRoute}
        allRoutes={props.allRoutes}
        overlays={props.overlays}
        onSelect={nothing}
        onHover={nothing}
        recenterRequest={0}
        fixed
        detail={props.detail}
      />
      {position && <PositionCard callsign={props.callsign} position={position} route={route} />}
      <Legend />
    </div>
  );
}
