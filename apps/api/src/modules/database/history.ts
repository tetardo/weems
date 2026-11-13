import { DATABASE_HISTORY_DAYS, type DatabaseDay } from "@weems/contrats";
import type { FlightsOfDay, SizeReading } from "./history-repository.ts";

/** Size readings are kept 13 months (console spec, page Base de données). */
export const KEEP_READINGS_DAYS = 396;

const DAY_MS = 86_400_000;

/** YYYY-MM-DD of the UTC day `daysBack` days before the one of `at`. */
export function utcDay(at: Date, daysBack = 0): string {
  return new Date(at.getTime() - daysBack * DAY_MS).toISOString().slice(0, 10);
}

/** First day of the charts: today and the days before it, DATABASE_HISTORY_DAYS in all. */
export const historyStart = (now: Date) => utcDay(now, DATABASE_HISTORY_DAYS - 1);

/** Every day of the charts, oldest first, with its reading (or null) and its flights (or 0). */
export function historyDays(
  now: Date,
  readings: readonly SizeReading[],
  flights: readonly FlightsOfDay[],
): DatabaseDay[] {
  const byDay = new Map(readings.map((reading) => [reading.day, reading]));
  const flightsByDay = new Map(flights.map((day) => [day.day, day]));
  return Array.from({ length: DATABASE_HISTORY_DAYS }, (_, i) => {
    const date = utcDay(now, DATABASE_HISTORY_DAYS - 1 - i);
    const reading = byDay.get(date);
    const opened = flightsByDay.get(date);
    return {
      date,
      totalBytes: reading?.totalBytes ?? null,
      tables: reading?.tables ?? null,
      realFlights: opened?.real ?? 0,
      simulatedFlights: opened?.simulated ?? 0,
    };
  });
}
