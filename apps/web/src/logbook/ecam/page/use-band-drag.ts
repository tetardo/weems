"use client";

import { useRef, useState, type PointerEvent } from "react";
import { minuteAt } from "../../flights/use-band-pointer.ts";

/** Cells a drag must cover to zoom; less is a click. */
const MIN_ZOOM_CELLS = 3;

/** Cells selected by a drag in progress (inclusive, in order). */
export interface Selection {
  from: number;
  to: number;
}

/**
 * Pointer over the bands of the ECAM page: moving reads the cell under the pointer's abscissa
 * (gaps included), a mouse drag selects a stretch to zoom on, a click picks a cell. A finger only
 * reads (sliding along the bands), so the page still scrolls.
 */
export function useBandDrag(
  count: number,
  on: { read: (i: number) => void; pick: (i: number) => void; zoom: (s: Selection) => void },
) {
  const track = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const start = useRef<number | null>(null);
  const at = (event: PointerEvent) => {
    const box = track.current?.getBoundingClientRect();
    return box ? minuteAt(event.clientX, box.left, box.width, count) : null;
  };
  const span = (a: number, b: number): Selection => ({ from: Math.min(a, b), to: Math.max(a, b) });
  const handlers = {
    onPointerDown: (event: PointerEvent) => {
      const i = at(event);
      if (i === null) return;
      on.read(i);
      if (event.pointerType === "mouse" && event.button === 0) start.current = i;
    },
    onPointerMove: (event: PointerEvent) => {
      const i = at(event);
      if (i === null) return;
      on.read(i);
      if (start.current !== null && event.buttons === 1) setSelection(span(start.current, i));
    },
    onPointerUp: (event: PointerEvent) => {
      const first = start.current;
      start.current = null;
      setSelection(null);
      const i = at(event);
      if (first === null || i === null) return;
      const chosen = span(first, i);
      if (chosen.to - chosen.from + 1 >= MIN_ZOOM_CELLS) on.zoom(chosen);
      else on.pick(i);
    },
  };
  return { track, selection, handlers };
}
