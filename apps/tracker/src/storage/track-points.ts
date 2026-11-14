import type { RecordedPoint, Sample, TrackPoint } from "@weems/contrats";

/** Mean N1 of the running engines; null when none gives one (piston engines). */
function meanN1(engines: Sample["engines"]): number | null {
  const values = engines.flatMap((e) => (e.running && e.n1 !== null ? [e.n1] : []));
  if (values.length === 0) return engines.some((e) => e.running) ? null : 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** What the flight page and its bands draw (spec J2, carnet privé). */
function drawnValues(sample: Sample, at: string): TrackPoint {
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
 * A recorded sample as sent after closing: the drawn values plus the rest of the sample, so that
 * the server keeps everything the simulator gave (fiche 021). Only `t` is left out: `at` replaces it.
 */
export function toTrackPoint(sample: Sample, at: string): RecordedPoint {
  return {
    ...drawnValues(sample, at),
    simTimeUtc: sample.simTimeUtc,
    simRate: sample.simRate,
    altIndicated: sample.altIndicated,
    tas: sample.tas,
    mach: sample.mach,
    pitch: sample.pitch,
    onRunway: sample.onRunway,
    engines: sample.engines,
    weightKg: sample.weightKg,
    accel: sample.accel,
    cabinRate: sample.cabinRate,
    lights: sample.lights,
    overspeed: sample.overspeed,
    stall: sample.stall,
    pushback: sample.pushback,
    surface: sample.surface,
    wind: sample.wind,
    oat: sample.oat,
    visibilityM: sample.visibilityM,
    slew: sample.slew,
    paused: sample.paused,
  };
}

/**
 * At most one point per second: near the ground the tracker reads every frame (EF-09),
 * which the page does not need. Liftoffs and touchdowns are always kept.
 */
export function thinTrack<P extends TrackPoint>(points: readonly P[], minGapMs = 1_000): P[] {
  const kept: P[] = [];
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
