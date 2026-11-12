import type { Sample, TrackPoint } from "@weems/contrats";

/** Mean N1 of the running engines; null when none gives one (piston engines). */
function meanN1(engines: Sample["engines"]): number | null {
  const values = engines.flatMap((e) => (e.running && e.n1 !== null ? [e.n1] : []));
  if (values.length === 0) return engines.some((e) => e.running) ? null : 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** A recorded sample, reduced to what the flight page and its bands draw (spec J2, carnet privé). */
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
    bank: sample.bank,
    gForce: sample.gForce,
    n1: meanN1(sample.engines),
    flapsIndex: sample.flapsIndex,
    gearHandle: sample.gearHandle,
    spoilers: sample.spoilers,
    parkingBrake: sample.parkingBrake,
    autopilot: sample.autopilot,
    landingLight: sample.lights.landing,
    seatbelts: sample.seatbelts,
    cabinAlt: sample.cabinAlt,
    fuelKg: sample.fuelKg,
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
