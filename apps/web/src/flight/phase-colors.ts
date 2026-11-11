import type { FlightPhase } from "@weems/contrats";

/**
 * One colour per phase, shared by the map, the profile and the timeline.
 * Ground in greys, departure in greens, cruise in blue, arrival in oranges and reds.
 */
export const PHASE_COLORS: Record<FlightPhase, string> = {
  BOARDING: "#9aa5b1",
  PUSHBACK: "#7b8794",
  TAXI_OUT: "#616e7c",
  TAKEOFF: "#2f855a",
  CLIMB: "#48bb78",
  CRUISE: "#2b6cb0",
  DESCENT: "#805ad5",
  APPROACH: "#dd6b20",
  FINAL: "#e53e3e",
  LANDING: "#9b2c2c",
  TAXI_IN: "#616e7c",
  ARRIVED: "#9aa5b1",
};

/** Points recorded before the first phase. */
const NO_PHASE_COLOR = "#cbd2d9";

export const colorOf = (phase: FlightPhase | null): string =>
  phase === null ? NO_PHASE_COLOR : PHASE_COLORS[phase];
