import type { FlightPhase, Sample } from "@weems/contrats";

/** EF-09: below this height (ft above ground), in flight, the tracker reads every frame. */
const HIGH_RATE_MAX_AGL = 1_000;
const HIGH_RATE_PHASES: readonly FlightPhase[] = ["TAKEOFF", "LANDING"];

/**
 * How often the connector reads the simulator (EF-09): every frame around takeoff and landing
 * and below 1 000 ft in flight, once per second elsewhere (taxi, cruise, parked).
 */
export function readRateFor(sample: Sample, phase: FlightPhase | null): "high" | "normal" {
  if (phase !== null && HIGH_RATE_PHASES.includes(phase)) return "high";
  return !sample.onGround && sample.altAgl < HIGH_RATE_MAX_AGL ? "high" : "normal";
}
