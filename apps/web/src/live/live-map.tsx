"use client";

import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { createBaseMap } from "../map/base-map.ts";
import { currentMapTheme, type MapTheme } from "../map/map-theme.ts";
import { addAircraftIcons, ICON_LOST, ICON_OK } from "./aircraft-icons.ts";
import type { LiveFlights } from "./flights-store.ts";
import { Tracks } from "./tracks.ts";

const SOURCE = "flights";

interface Props {
  flights: LiveFlights;
  selectedId: string | null;
  onSelect: (flightId: string | null) => void;
}

function addFlightsLayer(map: MapLibreMap, theme: MapTheme): void {
  addAircraftIcons(map, theme);
  map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addLayer({
    id: SOURCE,
    type: "symbol",
    source: SOURCE,
    layout: {
      "icon-image": ["case", ["get", "lost"], ICON_LOST, ICON_OK],
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-size": ["case", ["get", "selected"], 1.4, 1],
      "text-field": ["get", "callsign"],
      "text-size": 11,
      "text-offset": [0, 1.6],
      "text-optional": true,
    },
    paint: { "text-color": theme.ink, "text-halo-color": theme.halo, "text-halo-width": 1.5 },
  });
}

/** MapLibre map with one aircraft per open flight, gliding between updates. */
export function LiveMap({ flights, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const tracks = useRef(new Tracks());
  const selected = useRef(selectedId);
  selected.current = selectedId;
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    if (!container.current) return;
    const theme = currentMapTheme();
    const instance = createBaseMap(container.current, { center: [5, 47], zoom: 4.3 }, theme);
    map.current = instance;
    let frame = 0;
    const draw = () => {
      const source = instance.getSource<GeoJSONSource>(SOURCE);
      source?.setData(tracks.current.features(performance.now(), selected.current));
      frame = requestAnimationFrame(draw);
    };
    instance.on("load", () => {
      addFlightsLayer(instance, theme);
      draw();
    });
    instance.on("click", (event: MapMouseEvent) => {
      const [feature] = instance.queryRenderedFeatures(event.point, { layers: [SOURCE] });
      select.current((feature?.properties["flightId"] as string | undefined) ?? null);
    });
    return () => {
      cancelAnimationFrame(frame);
      instance.remove();
    };
    // The map is created once: the selection and the callback are read through refs.
  }, []);

  useEffect(() => tracks.current.update(flights, performance.now()), [flights]);

  return <div ref={container} style={{ position: "absolute", inset: 0 }} />;
}
