import {
  angleDiffDeg,
  bearingDeg,
  crossTrackNm,
  distanceBetweenNm,
  type LatLon,
  normalizeDeg,
  RAD,
} from "@weems/contrats";

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

/** Length of `legs` flown from `start`, in NM. */
export function legsNm(start: LatLon, legs: readonly Leg[]): number {
  let total = 0;
  let from = start;
  for (const { fix } of legs) {
    total += distanceBetweenNm(from, fix);
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
  /** Where the active leg starts: its previous fix, or the position when the legs were given. */
  private entry: LatLon | null = null;
  /** Length of the legs after the active one, computed once per leg change. */
  private tailNm = 0;

  follow(legs: readonly Leg[]): void {
    this.legs = [...legs];
    this.entry = null;
    const [first, ...rest] = legs;
    this.tailNm = first ? legsNm(first.fix, rest) : 0;
  }

  /** Heading to fly now, or null without legs. */
  desiredHeading(position: LatLon, turnRadiusNm: number): number | null {
    this.entry ??= position;
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
    const leg = this.legs[0];
    return leg ? distanceBetweenNm(position, leg.fix) + this.tailNm : 0;
  }

  /** Course of the active leg: its own, or from its entry to its fix. */
  private inboundCourse(leg: Leg, position: LatLon): number {
    return leg.course ?? bearingDeg(this.entry ?? position, leg.fix);
  }

  private sequence(position: LatLon, turnRadiusNm: number): void {
    for (let [leg, next] = this.legs; leg && next; [leg, next] = this.legs) {
      const inbound = this.inboundCourse(leg, position);
      const outbound = next.course ?? bearingDeg(leg.fix, next.fix);
      const turnDeg = Math.min(150, Math.abs(angleDiffDeg(inbound, outbound)));
      const leadNm = Math.max(MIN_LEAD_NM, turnRadiusNm * Math.tan((turnDeg * RAD) / 2));
      const passed = Math.abs(angleDiffDeg(inbound, bearingDeg(position, leg.fix))) > 90;
      if (distanceBetweenNm(position, leg.fix) > leadNm && !passed) return;
      this.legs.shift();
      this.entry = leg.fix;
      this.tailNm -= distanceBetweenNm(leg.fix, next.fix);
    }
  }
}
