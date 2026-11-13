import type { DatabaseDay } from "@weems/contrats";

/**
 * Figures of the charts at the top of the page Base de données and of the column « 7 j », from
 * the 30 days the API gives (one size reading per day it ran, flights per day). Pure: tested apart.
 */

/** Disk of the alpha server (Scaleway DEV1-S, 20 Go): what the projection aims at. */
const DISK_BYTES = 20e9;
/** Beyond this, the projection only says « plus de 5 ans ». */
const FAR_DAYS = 5 * 365;
const DAY_MS = 86_400_000;
const WINDOW_DAYS = 7;
/** Tables shown apart in « Répartition par table »; the others are summed. */
const TOP_TABLES = 3;

type Reading = DatabaseDay & { totalBytes: number; tables: Record<string, number> };
const hasReading = (day: DatabaseDay): day is Reading =>
  day.totalBytes !== null && day.tables !== null;
const dayMs = (date: string) => Date.parse(`${date}T00:00:00Z`);

/** Growth since a past reading: `since` is its day (7 days ago, or the oldest one there is). */
export interface SizeGrowth {
  since: string;
  totalBytes: number;
  tables: Record<string, number>;
}

/**
 * Growth of the newest reading since the last one at least 7 days older; without one, since the
 * oldest; null with fewer than two readings.
 */
export function growthOf(history: readonly DatabaseDay[]): SizeGrowth | null {
  const readings = history.filter(hasReading);
  const today = readings.at(-1);
  if (!today) return null;
  const limit = dayMs(today.date) - WINDOW_DAYS * DAY_MS;
  const past = readings.slice(0, -1);
  const reference = past.filter((r) => dayMs(r.date) <= limit).at(-1) ?? past[0];
  if (!reference) return null;
  const tables: Record<string, number> = {};
  for (const [name, size] of Object.entries(today.tables))
    tables[name] = size - (reference.tables[name] ?? 0);
  return { since: reference.date, totalBytes: today.totalBytes - reference.totalBytes, tables };
}

/** When the database would fill the disk at the pace of the readings shown. */
export type Projection =
  | { kind: "date"; at: Date }
  | { kind: "far" }
  /** Fewer than two readings, or a database that does not grow (after a cleanup). */
  | { kind: "none" };

export function projection(history: readonly DatabaseDay[], disk = DISK_BYTES): Projection {
  const readings = history.filter(hasReading);
  const first = readings[0];
  const last = readings.at(-1);
  if (!first || !last || first === last) return { kind: "none" };
  const days = (dayMs(last.date) - dayMs(first.date)) / DAY_MS;
  const perDay = (last.totalBytes - first.totalBytes) / days;
  if (perDay <= 0) return { kind: "none" };
  const left = Math.max(0, disk - last.totalBytes) / perDay;
  if (left > FAR_DAYS) return { kind: "far" };
  return { kind: "date", at: new Date(dayMs(last.date) + left * DAY_MS) };
}

/** Sizes of the largest tables of the newest reading, then the others summed, per day. */
export interface TableSeries {
  names: string[];
  /** Per day, one value per name then « autres »; null on a day without reading. */
  days: (number[] | null)[];
}

export function tableSeries(history: readonly DatabaseDay[]): TableSeries {
  const newest = history.filter(hasReading).at(-1);
  const names = newest
    ? Object.entries(newest.tables)
        .sort(([, a], [, b]) => b - a)
        .slice(0, TOP_TABLES)
        .map(([name]) => name)
    : [];
  const days = history.map((day) => {
    if (!hasReading(day)) return null;
    const shown = names.map((name) => day.tables[name] ?? 0);
    const sum = shown.reduce((a, b) => a + b, 0);
    return [...shown, Math.max(0, day.totalBytes - sum)];
  });
  return { names, days };
}

/** Share of the largest table in the newest reading, from 0 to 1; null without reading. */
export function largestShare(series: TableSeries): number | null {
  const newest = series.days.filter((day) => day !== null).at(-1);
  if (!newest) return null;
  const total = newest.reduce((a, b) => a + b, 0);
  return total === 0 ? null : (newest[0] ?? 0) / total;
}

/** Flights of the 30 days, real and simulated. */
export function flightTotals(history: readonly DatabaseDay[]) {
  const real = history.reduce((sum, day) => sum + day.realFlights, 0);
  const simulated = history.reduce((sum, day) => sum + day.simulatedFlights, 0);
  return { real, simulated, all: real + simulated };
}

/** « 12 nov. » for a day YYYY-MM-DD. */
export function shortDay(date: string): string {
  return new Date(dayMs(date)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** « mars 2029 ». */
export function monthYear(at: Date): string {
  return at.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
}
