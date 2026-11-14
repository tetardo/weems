"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/** Minute under the abscissa `x` of a row of `count` cells, or null outside the cells. */
export function minuteAt(x: number, left: number, width: number, count: number): number | null {
  if (count === 0 || width <= 0 || x < left || x > left + width) return null;
  return Math.min(count - 1, Math.floor(((x - left) / width) * count));
}

/**
 * The minute read from the pointer's horizontal position over the whole bands block, not from
 * the cell under it: the reading follows the mouse in the gaps between cells and rows and on the
 * group titles, and a finger can slide along the bands (Greg, 14/11/2026). `track` goes on one row
 * of cells (they all span the same width); `handlers` on the block.
 */
export function useBandPointer(
  count: number,
  onMinute: (i: number) => void,
  onPick: (i: number) => void,
) {
  const track = useRef<HTMLDivElement>(null);
  const at = (event: ReactPointerEvent | React.MouseEvent) => {
    const box = track.current?.getBoundingClientRect();
    return box ? minuteAt(event.clientX, box.left, box.width, count) : null;
  };
  const read = (event: ReactPointerEvent) => {
    const i = at(event);
    if (i !== null) onMinute(i);
  };
  return {
    track,
    handlers: {
      onPointerMove: read,
      onPointerDown: read,
      onClick: (event: React.MouseEvent) => {
        const i = at(event);
        if (i !== null) onPick(i);
      },
    },
  };
}
