import type { FlightPhase, TrackView } from "@weems/contrats";

type TrackPoint = TrackView["points"][number];

export interface ProfileSize {
  width: number;
  height: number;
}

interface PhaseBand {
  phase: FlightPhase | null;
  x: number;
  width: number;
}

export interface Profile {
  altitudePath: string;
  speedPath: string;
  bands: PhaseBand[];
  /** Highest values of the two axes (rounded up), for the labels. */
  maxAltitude: number;
  maxSpeed: number;
  /** x of each point, to find the one under the pointer. */
  xs: number[];
}

const niceCeiling = (value: number, step: number) => Math.max(step, Math.ceil(value / step) * step);

function path(xs: readonly number[], ys: readonly number[]): string {
  return xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${(ys[i] ?? 0).toFixed(1)}`)
    .join("");
}

function phaseBands(
  points: readonly TrackPoint[],
  xs: readonly number[],
  width: number,
): PhaseBand[] {
  const bands: PhaseBand[] = [];
  points.forEach((point, i) => {
    const x = xs[i] ?? 0;
    const last = bands.at(-1);
    if (last && last.phase === point.phase) return;
    if (last) last.width = x - last.x;
    bands.push({ phase: point.phase, x, width: width - x });
  });
  return bands;
}

/**
 * Vertical profile in SVG coordinates (spec site minimal): altitude and ground speed
 * against time, phases as coloured bands behind.
 */
export function profileGeometry(points: readonly TrackPoint[], size: ProfileSize): Profile | null {
  const [first] = points;
  const last = points.at(-1);
  if (!first || !last || points.length < 2) return null;
  const t0 = Date.parse(first.at);
  const span = Math.max(1, Date.parse(last.at) - t0);
  const maxAltitude = niceCeiling(Math.max(...points.map((p) => p.altMsl)), 1_000);
  const maxSpeed = niceCeiling(Math.max(...points.map((p) => p.gs)), 50);
  const xs = points.map((p) => ((Date.parse(p.at) - t0) / span) * size.width);
  const yOf = (value: number, max: number) =>
    size.height - (Math.max(0, value) / max) * size.height;
  return {
    altitudePath: path(
      xs,
      points.map((p) => yOf(p.altMsl, maxAltitude)),
    ),
    speedPath: path(
      xs,
      points.map((p) => yOf(p.gs, maxSpeed)),
    ),
    bands: phaseBands(points, xs, size.width),
    maxAltitude,
    maxSpeed,
    xs,
  };
}

/** Index of the point closest to `x` (xs sorted ascending). */
export function nearestIndex(xs: readonly number[], x: number): number {
  let best = 0;
  xs.forEach((value, i) => {
    if (Math.abs(value - x) < Math.abs((xs[best] ?? 0) - x)) best = i;
  });
  return best;
}
