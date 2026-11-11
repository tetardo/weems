import type { FlightPhase, Sample } from "@weems/contrats";
import { LandingTracker } from "./landing-tracker.ts";
import type { PhaseParams } from "./params.ts";
import { heightOf, PHASE_RULES, type PhaseRule, type RuleContext } from "./rules.ts";

/** Something the machine noticed, with the sample time `t` at which it happened. */
export type PhaseOutput =
  | { kind: "phaseChanged"; t: number; from: FlightPhase | null; to: FlightPhase; airStart?: true }
  | { kind: "rejectedTakeoff" | "goAround" | "bounce" | "touchAndGo"; t: number }
  | { kind: "touchdown"; t: number; vs: number };

interface Pending {
  rule: PhaseRule;
  sinceSimMs: number;
}

/** Starting phase: on the ground BOARDING; loaded in the air, CLIMB or CRUISE from vs. */
function initialPhase(sample: Sample, params: PhaseParams): FlightPhase {
  if (sample.onGround) return "BOARDING";
  return Math.abs(sample.vs) < params.levelMaxVs ? "CRUISE" : "CLIMB";
}

/**
 * The 12-phase state machine of spec T0, part B. Pure: fed with samples, returns what changed.
 * Durations are counted in simulated time (t × simRate); nothing is evaluated while paused.
 */
export class PhaseMachine {
  private current: FlightPhase | null = null;
  private pending: Pending | null = null;
  private simMs = 0;
  private lastT: number | null = null;
  private previousGs: number | null = null;
  private lowestHeight: number | null = null;
  private readonly landing: LandingTracker;
  private readonly params: PhaseParams;

  constructor(params: PhaseParams) {
    this.params = params;
    this.landing = new LandingTracker(params);
  }

  get phase(): FlightPhase | null {
    return this.current;
  }

  /** Ends the flight whatever the phase (manual close, crash, aircraft change). */
  close(t: number): PhaseOutput | null {
    if (this.current === null || this.current === "ARRIVED") return null;
    const from = this.current;
    this.current = "ARRIVED";
    this.pending = null;
    return { kind: "phaseChanged", t, from, to: "ARRIVED" };
  }

  feed(sample: Sample): PhaseOutput[] {
    this.advanceClock(sample);
    if (sample.paused) return [];
    if (this.current === null) return [this.start(sample)];
    const outputs = this.current === "LANDING" ? this.trackLanding(sample) : [];
    if (outputs.some((o) => o.kind === "touchAndGo")) return outputs;
    this.trackLowestHeight(sample);
    outputs.push(...this.evaluateRules(sample));
    this.previousGs = sample.gs;
    return outputs;
  }

  private advanceClock(sample: Sample): void {
    if (this.lastT !== null && !sample.paused) {
      this.simMs += (sample.t - this.lastT) * (sample.simRate ?? 1);
    }
    this.lastT = sample.t;
  }

  private start(sample: Sample): PhaseOutput {
    const to = initialPhase(sample, this.params);
    this.current = to;
    this.previousGs = sample.gs;
    return sample.onGround
      ? { kind: "phaseChanged", t: sample.t, from: null, to }
      : { kind: "phaseChanged", t: sample.t, from: null, to, airStart: true };
  }

  private trackLanding(sample: Sample): PhaseOutput[] {
    const outcome = this.landing.update(sample, this.simMs);
    if (outcome === "bounce") return [{ kind: "bounce", t: sample.t }];
    if (outcome === "touchAndGo") {
      return [{ kind: "touchAndGo", t: sample.t }, this.enter("CLIMB", sample)];
    }
    return [];
  }

  private trackLowestHeight(sample: Sample): void {
    if (this.current !== "APPROACH" && this.current !== "FINAL") return;
    const height = heightOf(sample);
    this.lowestHeight = Math.min(this.lowestHeight ?? height, height);
  }

  private evaluateRules(sample: Sample): PhaseOutput[] {
    const ctx: RuleContext = {
      params: this.params,
      previousGs: this.previousGs,
      lowestHeight: this.lowestHeight,
    };
    const phase = this.current;
    const rule = PHASE_RULES.find(
      (r) => phase !== null && r.from.includes(phase) && r.when(sample, ctx),
    );
    if (!rule) {
      this.pending = null;
      return [];
    }
    if (this.pending?.rule !== rule) this.pending = { rule, sinceSimMs: this.simMs };
    if (this.simMs - this.pending.sinceSimMs < rule.confirmS * 1000) return [];
    return this.apply(rule, sample);
  }

  private apply(rule: PhaseRule, sample: Sample): PhaseOutput[] {
    const outputs: PhaseOutput[] = [];
    if (rule.event === "touchdown") outputs.push({ kind: "touchdown", t: sample.t, vs: sample.vs });
    else if (rule.event) outputs.push({ kind: rule.event, t: sample.t });
    outputs.push(this.enter(rule.to, sample));
    return outputs;
  }

  private enter(to: FlightPhase, sample: Sample): PhaseOutput {
    const from = this.current;
    this.current = to;
    this.pending = null;
    if (to === "APPROACH" || to === "CLIMB") this.lowestHeight = null;
    if (to === "LANDING") this.landing.reset();
    return { kind: "phaseChanged", t: sample.t, from, to };
  }
}
