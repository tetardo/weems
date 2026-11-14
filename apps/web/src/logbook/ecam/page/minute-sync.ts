import type { BandMinute, TrackView } from "@weems/contrats";

type Point = TrackView["points"][number];
const MINUTE_MS = 60_000;

/** For each minute of the bands, the track point closest to its middle (-1 without points). */
export function pointsOfMinutes(
  points: readonly Point[],
  minutes: readonly BandMinute[],
): number[] {
  const times = points.map((p) => Date.parse(p.at));
  return minutes.map((m) => {
    const middle = Date.parse(m.at) + MINUTE_MS / 2;
    let best = -1;
    let gap = Infinity;
    times.forEach((t, i) => {
      if (Math.abs(t - middle) < gap) [best, gap] = [i, Math.abs(t - middle)];
    });
    return best;
  });
}

/** Minute of the bands holding a track point (the nearest one before the first or after the last). */
export function minuteOfPoint(point: Point, minutes: readonly BandMinute[]): number | null {
  const first = minutes[0];
  if (!first) return null;
  const index = Math.floor((Date.parse(point.at) - Date.parse(first.at)) / MINUTE_MS);
  return Math.min(minutes.length - 1, Math.max(0, index));
}
