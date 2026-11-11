import type { Sample, TrackPoint } from "@weems/contrats";

/** A recorded sample, reduced to what the flight page draws (spec J2). */
export function toTrackPoint(sample: Sample, at: string): TrackPoint {
  return {
    at,
    lat: sample.lat,
    lon: sample.lon,
    altMsl: sample.altMsl,
    altAgl: sample.altAgl,
    ias: sample.ias,
    gs: sample.gs,
    vs: sample.vs,
    heading: sample.heading,
    onGround: sample.onGround,
  };
}

/**
 * At most one point per second: near the ground the tracker reads every frame (EF-09),
 * which the page does not need. Liftoffs and touchdowns are always kept.
 */
export function thinTrack(points: readonly TrackPoint[], minGapMs = 1_000): TrackPoint[] {
  const kept: TrackPoint[] = [];
  let lastMs = Number.NEGATIVE_INFINITY;
  points.forEach((point, i) => {
    const previous = points[i - 1];
    const groundChange = previous !== undefined && previous.onGround !== point.onGround;
    const ms = Date.parse(point.at);
    if (ms - lastMs < minGapMs && !groundChange && i !== points.length - 1) return;
    kept.push(point);
    lastMs = ms;
  });
  return kept;
}
