import { type FlightEvent, type FlightPhase, phaseChangeOf } from "@weems/contrats";

interface PhaseStart {
  atMs: number;
  phase: FlightPhase;
}

/** Phase changes of a flight, in time order, from its "phaseChanged" events (tracker's truth). */
export function phaseStarts(events: readonly FlightEvent[]): PhaseStart[] {
  return events.flatMap((event) => {
    const change = phaseChangeOf(event);
    return change ? [{ atMs: Date.parse(event.at), phase: change.to }] : [];
  });
}

/** Phase at each time of `timesMs` (sorted ascending); null before the first phase. */
export function phasesAt(
  starts: readonly PhaseStart[],
  timesMs: readonly number[],
): (FlightPhase | null)[] {
  let next = 0;
  let current: FlightPhase | null = null;
  return timesMs.map((t) => {
    for (let start = starts[next]; start && start.atMs <= t; start = starts[++next]) {
      current = start.phase;
    }
    return current;
  });
}

/** Index of the first point at or after each phase change: kept by the simplification. */
export function phaseChangeIndices(
  starts: readonly PhaseStart[],
  timesMs: readonly number[],
): number[] {
  return starts.map(({ atMs }) => {
    const index = timesMs.findIndex((t) => t >= atMs);
    return index < 0 ? timesMs.length - 1 : index;
  });
}
