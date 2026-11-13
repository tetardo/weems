import { z } from "zod";

/**
 * A « valid » flight: flown for real, end to end (spec offre fondateurs). Shared by the founder
 * offer and the pilot grades: the tracker and the simulator are public, so any flight could be
 * forged; these rules keep the easy fakes out.
 */
export const VALID_FLIGHT = {
  minAirborneMinutes: 15,
  /** Length of the received trajectory. */
  minDistanceNm: 20,
} as const;

/** Why a closed flight is valid, or not. */
export const FlightValidity = z.enum([
  "valid",
  /** Simulated flight of the development tools (simulator « replay »). */
  "simulated",
  /** No liftoff or no touchdown recorded. */
  "noTakeoffOrLanding",
  "tooShort",
  /** No trajectory received yet, or shorter than the minimum distance. */
  "tooShortDistance",
  /** Slew mode or position changed during the flight. */
  "moved",
  "crashed",
]);
export type FlightValidity = z.infer<typeof FlightValidity>;
