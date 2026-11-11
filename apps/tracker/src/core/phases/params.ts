/**
 * Phase thresholds (spec T0, part B, "Paramètres de départ").
 * Starting values for an airliner, to be validated with a pilot: change them here only,
 * never in the rules. One set per aircraft category will follow (spec T0, open point).
 */
export interface PhaseParams {
  /** kt: taxi starts above this ground speed. */
  taxiMinGs: number;
  /** kt: take-off roll starts above this ground speed. */
  takeoffMinGs: number;
  /** kt: back below this on the ground during take-off = rejected take-off. */
  rtoMaxGs: number;
  /** ft: really airborne above this height. */
  airborneMinAgl: number;
  /** ft/min: level flight below this vertical speed. */
  levelMaxVs: number;
  /** ft/min: clear climb (or descent, negative) beyond this vertical speed. */
  climbMinVs: number;
  /** ft: approach starts below this height. */
  approachHeight: number;
  /** ft: final starts below this height (stabilised approach gate). */
  finalHeight: number;
  /** ft: height regained from the lowest point that confirms a go-around. */
  goAroundMinGain: number;
  /** s: airborne again for longer than this after touchdown = touch-and-go, not a bounce. */
  bounceMaxS: number;
  /** kt: landing roll ends below this ground speed. */
  landingEndGs: number;
}

export const AIRLINER_PARAMS: PhaseParams = {
  taxiMinGs: 3,
  takeoffMinGs: 40,
  rtoMaxGs: 30,
  airborneMinAgl: 50,
  levelMaxVs: 300,
  climbMinVs: 500,
  approachHeight: 3000,
  finalHeight: 1000,
  goAroundMinGain: 200,
  bounceMaxS: 5,
  landingEndGs: 40,
};
