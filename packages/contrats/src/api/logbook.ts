import { z } from "zod";
import { FlightAlert, FlightSummary } from "./flight-list.ts";
import { UtcTimestamp } from "./common.ts";

/**
 * Private logbook of the pilot (spec carnet privé): every closed flight of the pilot counts,
 * including the ones hidden from the public page.
 */

const Count = z.number().int().nonnegative();
const Seconds = z.number().nonnegative();

/** The last closed flight, page Résumé: the line of the list and its landing. */
export const LogbookLastFlight = z.object({
  flight: FlightSummary,
  /** First touchdown of the final landing, ft/min (negative); null when not measured. */
  touchdownVs: z.number().nullable(),
  bounces: Count,
  goArounds: Count,
  /** Length of the trajectory, nautical miles; null without trajectory. */
  distanceNm: z.number().nonnegative().nullable(),
  /** Fuel burnt over the trajectory, kg; null when not recorded (flights before 12/11/2026). */
  fuelUsedKg: z.number().nonnegative().nullable(),
});
export type LogbookLastFlight = z.infer<typeof LogbookLastFlight>;

/** A day with a flight (UTC): page Résumé and Statistiques (Régularité). */
export const FlyingDay = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  flights: Count,
  airborneS: Seconds,
});
export type FlyingDay = z.infer<typeof FlyingDay>;

/** A value and the same value over the period before, to show the trend. */
const Trend = z.object({ current: z.number().nullable(), previous: z.number().nullable() });

/** GET /v1/me/logbook/summary: page Résumé of the private logbook. */
export const LogbookSummary = z.object({
  lastFlight: LogbookLastFlight.nullable(),
  /** Airborne time this calendar month (UTC) and the month before. */
  monthAirborneS: z.object({ current: Seconds, previous: Seconds }),
  /** Mean touchdown of the last 10 measured landings, and of the 10 before. */
  touchdownAverage: Trend,
  /** Share of clean final landings (0 to 1) over the last 30 days, and the 30 days before. */
  cleanLandingShare: Trend,
  /** Days in a row (UTC) with a flight, up to today or yesterday; longest run ever. */
  streakDays: z.object({ current: Count, record: Count }),
  /** Last final touchdowns, oldest first (30 at most). */
  recentLandings: z.array(z.object({ at: UtcTimestamp, touchdownVs: z.number() })),
  /** Days with a flight over the last 17 weeks (UTC), oldest first. */
  flyingDays: z.array(FlyingDay),
  /** « À travailler », over the last 10 flights that landed. */
  workOn: z.object({
    flights: Count,
    bouncedLandings: Count,
    alertFlights: Count,
    alerts: z.array(FlightAlert),
    goArounds: Count,
  }),
  /** The 4 last closed flights, newest first, with their touchdown. */
  recentFlights: z.array(z.object({ flight: FlightSummary, touchdownVs: z.number().nullable() })),
});
export type LogbookSummary = z.infer<typeof LogbookSummary>;
