"use client";

import type { FlightBands as Bands, TrackView } from "@weems/contrats";
import { useEffect, useMemo, useState } from "react";
import { usePinnedMinute } from "../use-pinned-minute.ts";
import { minuteOfPoint, pointsOfMinutes } from "./minute-sync.ts";
import { useBandDrag } from "./use-band-drag.ts";
import { cellOfMinute, windowBands, type BandWindow, type WindowedBands } from "./window-bands.ts";

type Point = TrackView["points"][number];

/** Escape goes back to the whole flight when zoomed and no minute is held. */
function useEscapeZoom(active: boolean, reset: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

/** Minute of the flight in the middle of a cell of the view (null when no cell is read). */
function minuteOfCell(view: WindowedBands, shown: BandWindow, cell: number | null) {
  const start = cell === null ? undefined : view.starts[cell];
  return start === undefined ? null : Math.min(shown.to, start + Math.floor(view.size / 2));
}

/** Track points of the zoomed stretch, to frame the ND on it (empty: the whole flight). */
function framedPoints(points: readonly Point[], minutePoints: number[], shown: BandWindow) {
  return points.slice(minutePoints[shown.from] ?? 0, (minutePoints[shown.to] ?? points.length) + 1);
}

/**
 * What the ECAM page reads: the stretch shown (zoom), the cell read (hovered or held), and the
 * track point of that minute for both maps; a map hovered reads its point's minute back.
 */
export function useEcamReading(bands: Bands, points: readonly Point[]) {
  const whole: BandWindow = { from: 0, to: Math.max(0, bands.minutes.length - 1) };
  const [shown, setShown] = useState<BandWindow>(whole);
  const view = useMemo(() => windowBands(bands, shown), [bands, shown]);
  const cells = view.bands.minutes.length;
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, togglePin, setPinned] = usePinnedMinute(cells);
  const zoomed = shown.from !== whole.from || shown.to !== whole.to;
  const show = (next: BandWindow) => {
    setShown(next);
    setHovered(null);
    setPinned(null);
  };
  useEscapeZoom(zoomed && pinned === null, () => show(whole));
  const drag = useBandDrag(cells, {
    read: setHovered,
    pick: togglePin,
    zoom: (s) =>
      show({
        from: view.starts[s.from] ?? shown.from,
        to: Math.min(shown.to, (view.starts[s.to] ?? shown.to) + view.size - 1),
      }),
  });
  const minutePoints = useMemo(() => pointsOfMinutes(points, bands.minutes), [points, bands]);
  const cell = pinned ?? hovered;
  const minute = minuteOfCell(view, shown, cell);
  const fromMap = (index: number | null) => {
    const point = index === null ? undefined : points[index];
    if (!point || pinned !== null) return;
    const c = cellOfMinute(view, shown, minuteOfPoint(point, bands.minutes));
    if (c !== null) setHovered(c);
  };
  return {
    view,
    shown,
    zoomed,
    cell,
    pinned: pinned !== null,
    cursorPoint: minute === null ? -1 : (minutePoints[minute] ?? -1),
    framed: zoomed ? framedPoints(points, minutePoints, shown) : [],
    drag,
    fromMap,
    reset: () => show(whole),
    leave: () => setHovered(null),
  };
}
