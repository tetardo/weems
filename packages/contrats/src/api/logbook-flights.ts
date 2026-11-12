import { z } from "zod";
import { FlightPhase } from "../flight/phase.ts";
import { FlightSummary } from "./flight-list.ts";
import { UtcTimestamp } from "./common.ts";

/**
 * Page Vols of the private logbook (spec carnet privé, § 4): the list with a verdict per flight,
 * and the flight bands of the selected flight.
 */

const Count = z.number().int().nonnegative();

/**
 * Verdict of a flight in the list: non-compliant (alerts) first, then no landing, bounce, firm
 * touchdown (240 ft/min or more), clean.
 */
export const LandingVerdict = z.enum(["clean", "firm", "bounce", "nonCompliant", "noLanding"]);
export type LandingVerdict = z.infer<typeof LandingVerdict>;

export const LogbookEntry = z.object({
  flight: FlightSummary,
  /** First touchdown of the final landing, ft/min (negative); null when not measured. */
  touchdownVs: z.number().nullable(),
  bounces: Count,
  goArounds: Count,
  verdict: LandingVerdict,
});
export type LogbookEntry = z.infer<typeof LogbookEntry>;

/** GET /v1/me/logbook/entries: every closed flight of the pilot, newest first. */
export const LogbookEntries = z.object({ entries: z.array(LogbookEntry) });
export type LogbookEntries = z.infer<typeof LogbookEntries>;

/** Rows of the flight bands, in display order, by group (trajectory, controls, cabin). */
export const BandRow = z.enum([
  "altitude",
  "speed",
  "verticalSpeed",
  "bank",
  "gForce",
  "n1",
  "flaps",
  "gear",
  "spoilers",
  "braking",
  "parkingBrake",
  "autopilot",
  "landingLight",
  "seatbelts",
  "cabinAltitude",
]);
export type BandRow = z.infer<typeof BandRow>;

/**
 * Why a stretch of the bands is worth reviewing (Pilot Pro, provisional criteria until set with a
 * pilot): above 250 kt below 10,000 ft (SERA.6001), bank over 30°, sink rate over 1,000 ft/min
 * below 1,000 ft above the ground (Flight Safety Foundation stabilised approach).
 */
export const BandMarkReason = z.enum(["speed250", "bank30", "sinkRate"]);
export type BandMarkReason = z.infer<typeof BandMarkReason>;

/**
 * One column of the bands: a minute of the flight. Values per row: altitude ft MSL (highest),
 * speed kt IAS (mean), vertical speed ft/min (mean), bank ° (largest either side), load factor g
 * (highest), N1 % (mean), flaps (highest index), gear and spoilers 0 to 1 (highest), braking kt/s
 * on the ground (strongest deceleration), parking brake, autopilot, landing light and seat belt
 * sign as the share of the minute when on (0 to 1), cabin altitude ft (highest). null: not recorded.
 */
export const BandMinute = z.object({
  at: UtcTimestamp,
  phase: FlightPhase.nullable(),
  values: z.record(BandRow, z.number().nullable()),
});
export type BandMinute = z.infer<typeof BandMinute>;

/** GET /v1/me/logbook/flights/{flightId}/bands. */
export const FlightBands = z.object({
  minutes: z.array(BandMinute),
  /** Rows with at least one value: older flights have the trajectory rows only. */
  rows: z.array(BandRow),
  /** Stretches to review, by minute index (inclusive); null when the plan does not include them. */
  marks: z
    .array(z.object({ row: BandRow, from: Count, to: Count, reason: BandMarkReason }))
    .nullable(),
  /** Fuel burnt from the first to the last point, kg; null when not recorded. */
  fuelUsedKg: z.number().nonnegative().nullable(),
  /** Length of the trajectory, nautical miles (simplified points, as on the page Résumé). */
  distanceNm: z.number().nonnegative(),
});
export type FlightBands = z.infer<typeof FlightBands>;
