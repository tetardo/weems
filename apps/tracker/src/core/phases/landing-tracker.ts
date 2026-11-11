import type { Sample } from "@weems/contrats";
import type { PhaseParams } from "./params.ts";
import { heightOf } from "./rules.ts";

export type LandingOutcome = "bounce" | "touchAndGo" | null;

/**
 * During LANDING: an aircraft back in the air for less than bounceMaxS then on the ground
 * again has bounced; airborne for longer and above airborneMinAgl, it is a touch-and-go.
 */
export class LandingTracker {
  private airborneSinceMs: number | null = null;
  private readonly params: PhaseParams;

  constructor(params: PhaseParams) {
    this.params = params;
  }

  reset(): void {
    this.airborneSinceMs = null;
  }

  /** `simMs`: simulated time, so that time acceleration does not distort durations. */
  update(sample: Sample, simMs: number): LandingOutcome {
    if (!sample.onGround) {
      this.airborneSinceMs ??= simMs;
      const airborneS = (simMs - this.airborneSinceMs) / 1000;
      if (airborneS > this.params.bounceMaxS && heightOf(sample) > this.params.airborneMinAgl) {
        this.reset();
        return "touchAndGo";
      }
      return null;
    }
    if (this.airborneSinceMs === null) return null;
    this.reset();
    return "bounce";
  }
}
