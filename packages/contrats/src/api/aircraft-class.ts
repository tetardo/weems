import { z } from "zod";

/** Aircraft categories of the pilot's experience (spec J4, aircraft categories). */
export const AircraftCategory = z.enum([
  "light",
  "turboprop",
  "businessJet",
  "regionalJet",
  "narrowBody",
  "wideBody",
  "helicopter",
  "other",
]);
export type AircraftCategory = z.infer<typeof AircraftCategory>;

/**
 * Category of a flight's aircraft: from the Weems catalogue of ICAO types, or estimated from
 * what the simulator says (engines, airframe, weight) when the type is unknown.
 */
export const AircraftClass = z.object({
  category: AircraftCategory,
  estimated: z.boolean(),
});
export type AircraftClass = z.infer<typeof AircraftClass>;
