import type { Sample } from "@weems/contrats";
import type { FlightLog } from "./flight-log.ts";

/**
 * Records pause, time acceleration and slew changes (EF-15): the rules decide later
 * whether they matter; the core only notes them, with their time.
 */
export class SimStateWatcher {
  private paused: boolean | null = null;
  private simRate: number | null = null;
  private slew: boolean | null = null;

  watch(sample: Sample, log: FlightLog): void {
    if (this.paused !== null && sample.paused !== this.paused) {
      log.record(sample.paused ? "paused" : "unpaused", sample.t);
    }
    if (this.simRate !== null && sample.simRate !== null && sample.simRate !== this.simRate) {
      log.record("simRateChanged", sample.t, { from: this.simRate, to: sample.simRate });
    }
    if (this.slew !== null && sample.slew !== this.slew) {
      log.record("slew", sample.t, { active: sample.slew });
    }
    this.paused = sample.paused;
    this.simRate = sample.simRate ?? this.simRate;
    this.slew = sample.slew;
  }
}
