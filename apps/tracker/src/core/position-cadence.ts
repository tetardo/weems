import type { FlightPhase } from "@weems/contrats";

/**
 * Seconds between two live positions (spec J1, part 2): often near the ground,
 * rarely in cruise, never while parked. null = no position.
 */
const CADENCE_S: Record<FlightPhase, number | null> = {
  BOARDING: null,
  PUSHBACK: 10,
  TAXI_OUT: 10,
  TAKEOFF: 5,
  CLIMB: 10,
  CRUISE: 15,
  DESCENT: 10,
  APPROACH: 5,
  FINAL: 5,
  LANDING: 5,
  TAXI_IN: 10,
  ARRIVED: null,
};

export function positionIntervalMs(phase: FlightPhase): number | null {
  const seconds = CADENCE_S[phase];
  return seconds === null ? null : seconds * 1000;
}
