"use client";

import type { LiveRoute } from "@weems/contrats";
import {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapMouseEvent,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { categoryColors } from "../aircraft/category-colors.ts";
import { createBaseMap } from "../map/base-map.ts";
import type { MapTheme } from "../map/map-theme.ts";
import { addAircraftIcons } from "./aircraft-icons.ts";
import { addAllRoutesLayers, type AllRoutes, showAllRoutes } from "./all-routes-layers.ts";
import type { LiveFlights } from "./flights-store.ts";
import { addOverlayLayers, type Overlays, showOverlays } from "./overlay-layers.ts";
import { addRouteLayers, followAircraft, showRoute } from "./route-layers.ts";
import type { MapPoint } from "./card-position.ts";
import { Tracks } from "./tracks.ts";

const SOURCE = "flights";

interface Props {
  flights: LiveFlights;
  selectedId: string | null;
  /** Route of the selected flight, drawn under the aircraft. */
  route: LiveRoute | null;
  /** Routes of the other flights (empty when the spectator hides them). */
  allRoutes: AllRoutes;
  onSelect: (flightId: string | null) => void;
  /** The aircraft under the mouse and where it is on the map, or null when there is none. */
  onHover: (hover: Hover | null) => void;
  /** Each new value centres the map on the selected aircraft (button « Recentrer »). */
  recenterRequest: number;
  /** Night and busy airports. */
  overlays: Overlays;
  /** Map inside a page that scrolls (Boarding): the wheel scrolls the page, the buttons zoom. */
  embedded?: boolean;
}

export interface Hover {
  flightId: string;
  point: MapPoint;
}

/** Farther than this from the mouse, the aircraft is no longer under it. */
const HOVER_RADIUS_PX = 20;

/**
 * Calls `onHover` as the mouse moves over the aircraft, and shows the pointer cursor. Returns
 * the check to run at each frame: an aircraft gliding away from a still mouse drops its card.
 */
function watchHover(
  map: MapLibreMap,
  tracks: { current: Tracks },
  onHover: { current: Props["onHover"] },
): (nowMs: number) => void {
  let hovered: Hover | null = null;
  const show = (next: Hover | null) => {
    hovered = next;
    map.getCanvas().style.cursor = next ? "pointer" : "";
    onHover.current(next);
  };
  map.on("mousemove", SOURCE, (event) => {
    const flightId = event.features?.[0]?.properties["flightId"] as string | undefined;
    show(flightId ? { flightId, point: event.point } : null);
  });
  map.on("mouseleave", SOURCE, () => show(null));
  return (nowMs) => {
    if (!hovered) return;
    const at = tracks.current.positionOf(hovered.flightId, nowMs);
    const drawn = at && map.project([at.lon, at.lat]);
    const { x, y } = hovered.point;
    if (!drawn || Math.hypot(drawn.x - x, drawn.y - y) > HOVER_RADIUS_PX) show(null);
  };
}

/** A click on an aircraft selects its flight; elsewhere, unselects. */
function watchClicks(map: MapLibreMap, onSelect: { current: Props["onSelect"] }): void {
  map.on("click", (event: MapMouseEvent) => {
    const [feature] = map.queryRenderedFeatures(event.point, { layers: [SOURCE] });
    onSelect.current((feature?.properties["flightId"] as string | undefined) ?? null);
  });
}

function addFlightsLayer(map: MapLibreMap, theme: MapTheme): void {
  addAircraftIcons(map, theme, categoryColors());
  map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: SOURCE,
    type: "symbol",
    source: SOURCE,
    layout: {
      "icon-image": ["get", "icon"],
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-size": ["*", ["get", "scale"], ["case", ["get", "selected"], 1.4, 1]],
      "text-field": ["get", "callsign"],
      "text-size": 11,
      "text-offset": [0, 1.6],
      "text-optional": true,
    },
    paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 1.5 },
  });
}

/**
 * Aircraft on top, then busy airports, the selected route, the faint routes of all flights, and
 * the night under them.
 */
function addLiveLayers(map: MapLibreMap, theme: MapTheme): void {
  addFlightsLayer(map, theme);
  addAllRoutesLayers(map, theme, SOURCE);
  addRouteLayers(map, theme, SOURCE);
  addOverlayLayers(map, theme, SOURCE);
}

/** Calls `show(map, value)` when `value` changes, once the layers exist (else the load does). */
function useShown<T>(
  map: { current: MapLibreMap | null },
  value: T,
  show: (map: MapLibreMap, value: T) => void,
): void {
  useEffect(() => {
    if (map.current?.getSource(SOURCE)) show(map.current, value);
  }, [map, value, show]);
}

/** A ref that always holds the latest value: read by the map's handlers, created once. */
function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Shift of the centre so that the aircraft is not under the flight panel: left of it on a
 * computer, above the sheet on a phone (flight-panel.tsx).
 */
function besidePanel(): [number, number] {
  return window.matchMedia("(max-width: 767px)").matches ? [0, -window.innerHeight / 4] : [-170, 0];
}

/** Centres the map on the selected aircraft at each new request; a new selection alone does not. */
function useRecenter(
  map: { current: MapLibreMap | null },
  tracks: { current: Tracks },
  selected: { current: string | null },
  request: number,
): void {
  useEffect(() => {
    const aircraft =
      selected.current && tracks.current.positionOf(selected.current, performance.now());
    if (request > 0 && aircraft) {
      map.current?.easeTo({ center: [aircraft.lon, aircraft.lat], offset: besidePanel() });
    }
  }, [map, tracks, selected, request]);
}

/** In a page that scrolls, the wheel scrolls the page: zoom with the + / − buttons instead. */
function embed(map: MapLibreMap): void {
  map.scrollZoom.disable();
  map.addControl(new NavigationControl({ showCompass: false }), "top-right");
}

/** MapLibre map with one aircraft per open flight, gliding between updates, and the selected route. */
export function LiveMap(props: Props) {
  const { flights, selectedId, route, allRoutes, onSelect, onHover, recenterRequest, overlays } =
    props;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const tracks = useRef(new Tracks());
  const selected = useLatest(selectedId);
  const select = useLatest(onSelect);
  const hover = useLatest(onHover);
  const shownRoute = useLatest(route);
  const shownRoutes = useLatest(allRoutes);
  const shownOverlays = useLatest(overlays);

  useEffect(() => {
    if (!container.current) return;
    // Run on the first basemap and again after each theme switch, which erases our layers.
    const addLayers = (target: MapLibreMap, theme: MapTheme) => {
      addLiveLayers(target, theme);
      showAllRoutes(target, shownRoutes.current);
      showRoute(target, shownRoute.current);
      showOverlays(target, shownOverlays.current);
    };
    const instance = createBaseMap(container.current, { center: [5, 47], zoom: 4.3 }, addLayers);
    if (props.embedded) embed(instance);
    map.current = instance;
    const checkHover = watchHover(instance, tracks, hover);
    let frame = 0;
    const draw = () => {
      const now = performance.now();
      checkHover(now);
      const source = instance.getSource<GeoJSONSource>(SOURCE);
      source?.setData(tracks.current.features(now, selected.current));
      if (shownRoute.current && selected.current) {
        const aircraft = tracks.current.positionOf(selected.current, now);
        followAircraft(instance, shownRoute.current, aircraft);
      }
      frame = requestAnimationFrame(draw);
    };
    instance.once("load", draw);
    watchClicks(instance, select);
    return () => {
      cancelAnimationFrame(frame);
      instance.remove();
    };
    // The map is created once: the selection and the callback are read through refs.
  }, []);

  useEffect(() => tracks.current.update(flights, performance.now()), [flights]);

  useRecenter(map, tracks, selected, recenterRequest);

  useShown(map, route, showRoute);
  useShown(map, allRoutes, showAllRoutes);
  useShown(map, overlays, showOverlays);

  return <div ref={container} style={{ position: "absolute", inset: 0 }} />;
}
