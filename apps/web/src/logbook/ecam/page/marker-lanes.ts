/** Width of one character of the 10.5 px cockpit font, plus the tick and its gap (px). */
const CHAR_PX = 6.4;
const PAD_PX = 6;
/** The narrowest the cells get before the grid scrolls (min-width of the grid less its columns). */
const TRACK_PX = 460;

/**
 * Line of each label above the time axis so that close labels do not overlap: the first line whose
 * last label ends before this one starts, at most `max` lines (4) (then the line that frees first).
 */
export function markerLanes(
  markers: readonly { cell: number; text: string }[],
  count: number,
  max = 4,
): number[] {
  const cellPx = TRACK_PX / Math.max(1, count);
  const ends: number[] = [];
  return markers.map(({ cell, text }) => {
    const start = (cell + 0.5) * cellPx;
    const end = start + text.length * CHAR_PX + PAD_PX;
    let lane = ends.findIndex((e) => e <= start);
    if (lane < 0) lane = ends.length < max ? ends.length : ends.indexOf(Math.min(...ends));
    ends[lane] = end;
    return lane;
  });
}
