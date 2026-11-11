import {
  angleDiffDeg,
  bearingDeg,
  crossTrackNm,
  distanceNm,
  type LatLon,
  normalizeDeg,
} from "../../../src/core/geo.ts";

/** A leg ends at `fix`: flown direct, or along `course` (runway axis) with cross-track correction. */
export interface Leg {
  fix: LatLon;
  course?: number;
}

/** Degrees of intercept per NM off course, up to MAX_INTERCEPT_DEG (like a localizer capture). */
const INTERCEPT_DEG_PER_NM = 90;
const MAX_INTERCEPT_DEG = 30;
const MIN_LEAD_NM = 0.05;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const between = (a: LatLon, b: LatLon) => distanceNm(a.lat, a.lon, b.lat, b.lon);

/** Course flown on `leg` from `from`. */
const courseOf = (from: LatLon, leg: Leg) => leg.course ?? bearingDeg(from, leg.fix);

/** Length of `legs` flown from `start`, in NM. */
export function legsNm(start: LatLon, legs: readonly Leg[]): number {
  let total = 0;
  let from = start;
  for (const { fix } of legs) {
    total += between(from, fix);
    from = fix;
  }
  return total;
}

/**
 * Follows a list of legs like a flight management system: steers to the active leg,
 * starts each turn early enough to roll out on the next one, never leaves the last leg.
 */
export class Navigator {
  private legs: Leg[] = [];

  follow(legs: readonly Leg[]): void {
    this.legs = [...legs];
  }

  /** Heading to fly now, or null without legs. */
  desiredHeading(position: LatLon, turnRadiusNm: number): number | null {
    this.sequence(position, turnRadiusNm);
    const leg = this.legs[0];
    if (!leg) return null;
    if (leg.course === undefined) return bearingDeg(position, leg.fix);
    const offNm = crossTrackNm(position, leg.fix, leg.course);
    const intercept = clamp(offNm * INTERCEPT_DEG_PER_NM, -MAX_INTERCEPT_DEG, MAX_INTERCEPT_DEG);
    return normalizeDeg(leg.course - intercept);
  }

  /** Distance still to fly along the legs, to the end of the last one. */
  remainingNm(position: LatLon): number {
    return legsNm(position, this.legs);
  }

  private sequence(position: LatLon, turnRadiusNm: number): void {
    for (let [leg, next] = this.legs; leg && next; [leg, next] = this.legs) {
      const inbound = courseOf(position, leg);
      const turnDeg = Math.min(150, Math.abs(angleDiffDeg(inbound, courseOf(leg.fix, next))));
      const leadNm = Math.max(MIN_LEAD_NM, turnRadiusNm * Math.tan((turnDeg * Math.PI) / 360));
      const passed = Math.abs(angleDiffDeg(inbound, bearingDeg(position, leg.fix))) > 90;
      if (between(position, leg.fix) > leadNm && !passed) return;
      this.legs.shift();
    }
  }
}
