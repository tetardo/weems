/** A point drawn on the map. */
export interface DrawnPosition {
  lat: number;
  lon: number;
  heading: number;
}

/** Shortest turn from `from` to `to`, in degrees (-180 to 180). */
function headingDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

/**
 * Position between `from` and `to` at `progress` (0 to 1), so that aircraft glide
 * between two updates instead of jumping (spec J1, part 4).
 */
export function interpolate(
  from: DrawnPosition,
  to: DrawnPosition,
  progress: number,
): DrawnPosition {
  const p = Math.min(1, Math.max(0, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lon: from.lon + (to.lon - from.lon) * p,
    heading: (from.heading + headingDelta(from.heading, to.heading) * p + 360) % 360,
  };
}
