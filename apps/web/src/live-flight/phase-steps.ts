import { FLIGHT_PHASES, type FlightEvent, type FlightPhase } from "@weems/contrats";
import { phaseTimeline } from "../flight/phase-timeline.ts";

export interface PhaseStep {
  phase: FlightPhase;
  /** Start of the phase; null for the phases still to come. */
  startAt: string | null;
  state: "done" | "now" | "next";
}

/**
 * The phases of a flight in progress (spec vol en cours): those flown, from the tracker's events,
 * the current one, from the latest position, then those left in the usual order, down to the
 * taxi to the gate (« Arrivé » ends the flight and the page).
 */
export function phaseSteps(events: readonly FlightEvent[], current: FlightPhase): PhaseStep[] {
  const flown = phaseTimeline(events, null);
  const nowIndex = flown.findLastIndex((span) => span.phase === current);
  const done = (nowIndex === -1 ? flown : flown.slice(0, nowIndex)).map((span): PhaseStep => ({
    phase: span.phase,
    startAt: span.startAt,
    state: "done",
  }));
  const now: PhaseStep = {
    phase: current,
    startAt: flown[nowIndex]?.startAt ?? null,
    state: "now",
  };
  const next = FLIGHT_PHASES.slice(FLIGHT_PHASES.indexOf(current) + 1)
    .filter((phase) => phase !== "ARRIVED")
    .map((phase): PhaseStep => ({ phase, startAt: null, state: "next" }));
  return [...done, now, ...next];
}
