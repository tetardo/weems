import type { TrackView } from "@weems/contrats";

type TrackPoint = TrackView["points"][number];

/** The last minutes before the touchdown that the chart « Dernière approche » shows. */
const APPROACH_WINDOW_S = 180;
/** Sink rate drawn at the bottom of the chart, ft/min. */
export const SINK_FLOOR = -1500;
/** Sink rates of a stable final, ft/min (provisional criteria, to set with a pilot). */
export const STABLE_SINK = { from: -600, to: -1000 } as const;

export interface ApproachSize {
  width: number;
  /** Top band: height above the ground. */
  heightBand: [number, number];
  /** Bottom band: vertical speed, 0 at the top and SINK_FLOOR at the bottom. */
  sinkBand: [number, number];
}

export interface ApproachGeometry {
  /** Height above the ground as a filled area, and its line. */
  heightArea: string;
  heightLine: string;
  sinkLine: string;
  /** y range of the stable sink rates. */
  stable: { y: number; height: number };
  /** Highest height of the window, ft. */
  topAgl: number;
}

const path = (xy: readonly [number, number][]) =>
  xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

/** Points of the window, in time order; fewer than two: nothing to draw. */
export function approachPoints(points: readonly TrackPoint[], touchdownAt: string): TrackPoint[] {
  const end = Date.parse(touchdownAt);
  return points.filter((p) => {
    const t = Date.parse(p.at);
    return t <= end && t >= end - APPROACH_WINDOW_S * 1000;
  });
}

/** Height and vertical speed over the last three minutes; null with fewer than two points. */
export function approachGeometry(
  points: readonly TrackPoint[],
  touchdownAt: string,
  size: ApproachSize,
): ApproachGeometry | null {
  const shown = approachPoints(points, touchdownAt);
  if (shown.length < 2) return null;
  const end = Date.parse(touchdownAt);
  const x = (p: TrackPoint) =>
    size.width * (1 - (end - Date.parse(p.at)) / (APPROACH_WINDOW_S * 1000));
  const topAgl = Math.max(...shown.map((p) => p.altAgl), 1);
  const [hTop, hBottom] = size.heightBand;
  const [sTop, sBottom] = size.sinkBand;
  const heightY = (agl: number) => hBottom - (Math.max(agl, 0) / topAgl) * (hBottom - hTop);
  const sinkY = (vs: number) =>
    sTop + (Math.min(Math.max(vs, SINK_FLOOR), 0) / SINK_FLOOR) * (sBottom - sTop);
  const height = shown.map((p): [number, number] => [x(p), heightY(p.altAgl)]);
  const first = height[0]?.[0] ?? 0;
  const last = height.at(-1)?.[0] ?? size.width;
  return {
    heightLine: path(height),
    heightArea: `${path(height)}L${last.toFixed(1)},${hBottom}L${first.toFixed(1)},${hBottom}Z`,
    sinkLine: path(shown.map((p) => [x(p), sinkY(p.vs)])),
    stable: { y: sinkY(STABLE_SINK.from), height: sinkY(STABLE_SINK.to) - sinkY(STABLE_SINK.from) },
    topAgl,
  };
}
