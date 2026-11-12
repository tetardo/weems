import { type FlightEvent, type FlightPhase, phaseChangeOf } from "@weems/contrats";

export interface PhaseSpan {
  phase: FlightPhase;
  startAt: string;
  /** Until the next phase, or the closing; null while the flight is still open. */
  durationS: number | null;
}

const seconds = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 1000;

/** Phases in order with their start and duration, from the tracker's "phaseChanged" events. */
export function phaseTimeline(
  events: readonly FlightEvent[],
  closedAt: string | null,
): PhaseSpan[] {
  const starts = events.flatMap((event) => {
    const change = phaseChangeOf(event);
    return change ? [{ phase: change.to, startAt: event.at }] : [];
  });
  return starts.map((start, i) => {
    const end = starts[i + 1]?.startAt ?? (start.phase === "ARRIVED" ? start.startAt : closedAt);
    return { ...start, durationS: end === null ? null : seconds(start.startAt, end) };
  });
}
