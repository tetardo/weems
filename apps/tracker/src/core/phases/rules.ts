import type { FlightPhase, Sample } from "@weems/contrats";
import type { PhaseParams } from "./params.ts";

/** What a rule may look at besides the current sample. */
export interface RuleContext {
  params: PhaseParams;
  /** Ground speed of the previous sample, to know whether the aircraft accelerates. */
  previousGs: number | null;
  /** Lowest height reached since entering the approach, for go-around detection. */
  lowestHeight: number | null;
}

/** Notable fact a transition carries, recorded as a flight event. */
type TransitionEvent = "rejectedTakeoff" | "goAround" | "touchdown";

export interface PhaseRule {
  /** Unique name: two rules may lead to the same phase with different confirmations. */
  id: string;
  from: readonly FlightPhase[];
  to: FlightPhase;
  /** Simulated seconds the condition must hold before the change (0 = immediate). */
  confirmS: number;
  when: (sample: Sample, ctx: RuleContext) => boolean;
  event?: TransitionEvent;
}

/** Height used by the rules. J0: above ground; above destination once airports are known. */
export const heightOf = (sample: Sample): number => sample.altAgl;

const engineRunning = (s: Sample) => s.engines.some((e) => e.running);
const enginesStopped = (s: Sample) => s.engines.every((e) => !e.running);
const isLevel = (s: Sample, p: PhaseParams) => Math.abs(s.vs) < p.levelMaxVs;
const gearDownOrFixed = (s: Sample) => s.gearHandle === null || s.gearHandle >= 1;

/**
 * Transition table of spec T0, part B, in priority order: for a given phase,
 * the first rule whose condition holds is the one being confirmed.
 * LANDING to CLIMB (touch-and-go) and bounces are handled by the landing tracker.
 */
export const PHASE_RULES: readonly PhaseRule[] = [
  {
    id: "pushback",
    from: ["BOARDING"],
    to: "PUSHBACK",
    confirmS: 2,
    when: (s) => s.pushback === true,
  },
  {
    id: "taxiOut",
    from: ["BOARDING", "PUSHBACK"],
    to: "TAXI_OUT",
    confirmS: 5,
    when: (s, { params }) =>
      s.onGround && s.pushback !== true && engineRunning(s) && s.gs > params.taxiMinGs,
  },
  {
    id: "takeoffRoll",
    from: ["TAXI_OUT"],
    to: "TAKEOFF",
    confirmS: 2,
    when: (s, { params, previousGs }) =>
      s.onGround && s.gs > params.takeoffMinGs && previousGs !== null && s.gs > previousGs,
  },
  {
    id: "rejectedTakeoff",
    from: ["TAKEOFF"],
    to: "TAXI_OUT",
    confirmS: 3,
    when: (s, { params }) => s.onGround && s.gs < params.rtoMaxGs,
    event: "rejectedTakeoff",
  },
  {
    id: "liftOff",
    from: ["TAKEOFF"],
    to: "CLIMB",
    confirmS: 3,
    when: (s, { params }) => !s.onGround && heightOf(s) > params.airborneMinAgl,
  },
  {
    id: "goAround",
    from: ["APPROACH", "FINAL"],
    to: "CLIMB",
    confirmS: 5,
    when: (s, { params, lowestHeight }) =>
      !s.onGround &&
      s.vs > params.climbMinVs &&
      lowestHeight !== null &&
      heightOf(s) - lowestHeight > params.goAroundMinGain,
    event: "goAround",
  },
  {
    id: "touchdown",
    from: ["DESCENT", "APPROACH", "FINAL"],
    to: "LANDING",
    confirmS: 0,
    when: (s) => s.onGround,
    event: "touchdown",
  },
  {
    id: "levelOff",
    from: ["CLIMB"],
    to: "CRUISE",
    confirmS: 60,
    when: (s, { params }) => isLevel(s, params) && heightOf(s) > 1000,
  },
  {
    id: "stepClimb",
    from: ["CRUISE"],
    to: "CLIMB",
    confirmS: 30,
    when: (s, { params }) => s.vs > params.climbMinVs,
  },
  {
    id: "topOfDescent",
    from: ["CLIMB", "CRUISE"],
    to: "DESCENT",
    confirmS: 30,
    when: (s, { params }) => s.vs < -params.climbMinVs,
  },
  {
    id: "descentLevelOff",
    from: ["DESCENT"],
    to: "CRUISE",
    confirmS: 60,
    when: (s, { params }) => isLevel(s, params) && heightOf(s) >= params.approachHeight,
  },
  {
    id: "approach",
    from: ["DESCENT"],
    to: "APPROACH",
    confirmS: 10,
    when: (s, { params }) => heightOf(s) < params.approachHeight,
  },
  {
    id: "final",
    from: ["APPROACH"],
    to: "FINAL",
    confirmS: 3,
    when: (s, { params }) => heightOf(s) < params.finalHeight && gearDownOrFixed(s),
  },
  {
    id: "landingRollEnd",
    from: ["LANDING"],
    to: "TAXI_IN",
    confirmS: 3,
    when: (s, { params }) => s.onGround && s.gs < params.landingEndGs,
  },
  {
    id: "blockOn",
    from: ["TAXI_IN"],
    to: "ARRIVED",
    confirmS: 10,
    when: (s) => s.parkingBrake === true && enginesStopped(s),
  },
  {
    id: "blockOnWithoutBrakeData",
    from: ["TAXI_IN"],
    to: "ARRIVED",
    confirmS: 30,
    when: (s) => s.parkingBrake === null && enginesStopped(s) && s.gs < 1,
  },
];
