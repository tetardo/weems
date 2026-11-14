import type { TrackView } from "@weems/contrats";

type Point = TrackView["points"][number];

export const ND_WIDTH = 300;
export const ND_HEIGHT = 240;
const MARGIN = 34;

/** Track points on the ND, and how many drawing units a nautical mile takes. */
export interface Projected {
  at: [number, number][];
  pxPerNm: number;
}

/** Position of each track point on the ND, north up, the `framed` points filling the box. */
export function projectTrack(points: readonly Point[], framed: readonly Point[]): Projected {
  const frame = framed.length > 0 ? framed : points;
  if (frame.length === 0) return { at: [], pxPerNm: 1 };
  const midLat = frame.reduce((sum, p) => sum + p.lat, 0) / frame.length;
  const squeeze = Math.cos((midLat * Math.PI) / 180);
  const xOf = (p: Point) => p.lon * squeeze;
  const xs = frame.map(xOf);
  const ys = frame.map((p) => -p.lat);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min(
    (ND_WIDTH - 2 * MARGIN) / (x1 - x0 || 1e-6),
    (ND_HEIGHT - 2 * MARGIN) / (y1 - y0 || 1e-6),
  );
  const dx = (ND_WIDTH - (x1 - x0) * scale) / 2;
  const dy = (ND_HEIGHT - (y1 - y0) * scale) / 2;
  return {
    at: points.map((p) => [dx + (xOf(p) - x0) * scale, dy + (-p.lat - y0) * scale]),
    pxPerNm: scale / 60, // one degree of latitude is 60 NM
  };
}

/** Index of the projected point nearest to (x, y), or null when none is within `radius`. */
export function nearestProjected(
  projected: readonly [number, number][],
  x: number,
  y: number,
  radius: number,
): number | null {
  let best: number | null = null;
  let gap = radius;
  projected.forEach(([px, py], i) => {
    const d = Math.hypot(px - x, py - y);
    if (d <= gap) [best, gap] = [i, d];
  });
  return best;
}

/** Round distances for the three range rings, about a third of the box height apart. */
export function ringStep(pxPerNm: number): number {
  const wanted = ND_HEIGHT / 3 / pxPerNm;
  return [1, 2, 5, 10, 20, 50, 100, 200, 500].find((nm) => nm >= wanted * 0.75) ?? 1000;
}
