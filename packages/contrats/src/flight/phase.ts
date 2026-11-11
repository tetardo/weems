import { z } from "zod";

/** The 12 flight phases, in their usual order (spec T0, part B). */
export const FLIGHT_PHASES = [
  "BOARDING",
  "PUSHBACK",
  "TAXI_OUT",
  "TAKEOFF",
  "CLIMB",
  "CRUISE",
  "DESCENT",
  "APPROACH",
  "FINAL",
  "LANDING",
  "TAXI_IN",
  "ARRIVED",
] as const;

export const FlightPhase = z.enum(FLIGHT_PHASES);
export type FlightPhase = z.infer<typeof FlightPhase>;

/** Why a flight was closed. A flight is never deleted, whatever the reason (EF-14). */
export const CloseReason = z.enum(["normal", "manual", "crash", "interrupted", "aircraftChanged"]);
export type CloseReason = z.infer<typeof CloseReason>;
