import type { PilotProgress, SimulationProgress } from "@weems/contrats";
import type { createTracker } from "../../src/runtime/create-tracker.ts";
import type { Scenario } from "../generate-flights/scenario.ts";

/** What the progress needs from one pilot of the simulation. */
export interface ProgressSource {
  scenario: Scenario;
  tracker: ReturnType<typeof createTracker> | null;
  /** Real time of departure; null before. */
  startedAtMs: number | null;
  /** Simulated length of the replay. */
  durationMs: number;
}

function pilotOf(run: ProgressSource, speed: number, nowMs: number): PilotProgress {
  const phase = run.tracker?.runtime.currentPhase ?? null;
  const played =
    run.startedAtMs === null ? 0 : ((nowMs - run.startedAtMs) * speed) / run.durationMs;
  return {
    callsign: run.scenario.callsign,
    departure: run.scenario.departure.icao,
    arrival: run.scenario.arrival.icao,
    phase,
    progress: phase === "ARRIVED" ? 1 : Math.min(1, Math.max(0, played)),
    pending: run.tracker?.sender.pendingCount() ?? 0,
  };
}

export function progressOf(
  runs: readonly ProgressSource[],
  speed: number,
  nowMs: number,
): SimulationProgress {
  const pilots = runs.map((run) => pilotOf(run, speed, nowMs));
  const phases: Record<string, number> = {};
  for (const { phase } of pilots) if (phase) phases[phase] = (phases[phase] ?? 0) + 1;
  return {
    total: runs.length,
    departed: runs.filter((run) => run.tracker).length,
    phases,
    pending: pilots.reduce((sum, pilot) => sum + pilot.pending, 0),
    pilots,
  };
}
