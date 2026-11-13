import {
  DURATION_BUCKETS_H,
  RECENT_LANDINGS,
  TOUCHDOWN_BUCKETS_FPM,
  type PilotCharts,
  type TrackPoint,
} from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { finalLandings, measured } from "./landings.ts";
import { takeoffHours } from "./takeoff-hours.ts";

const MONTHS_SHOWN = 12;

const monthOf = (date: Date) => date.toISOString().slice(0, 7);

/** Airborne time of each of the last 12 months (UTC), oldest first, empty months included. */
export function monthlyActivity(
  flights: readonly SummaryWithEvents[],
  now: Date,
): PilotCharts["months"] {
  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) =>
    monthOf(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_SHOWN - 1 - i), 1)),
    ),
  );
  const totals = new Map(months.map((month) => [month, 0]));
  for (const { summary } of flights) {
    const month = monthOf(new Date(summary.openedAt));
    const total = totals.get(month);
    if (total !== undefined) totals.set(month, total + (summary.times.airborneS ?? 0));
  }
  return months.map((month) => ({ month, airborneS: totals.get(month) ?? 0 }));
}

/** Count of values per bucket: bucket i holds the values below bounds[i], the last one the rest. */
export function histogram(values: readonly number[], bounds: readonly number[]): number[] {
  const counts = Array.from({ length: bounds.length + 1 }, () => 0);
  for (const value of values) {
    const bucket = bounds.findIndex((bound) => value < bound);
    const index = bucket === -1 ? bounds.length : bucket;
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}

/** Data of the charts of a public profile; `flights` are newest first, as the service lists them. */
export function pilotCharts(
  flights: readonly SummaryWithEvents[],
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
  now: Date,
): PilotCharts {
  const blockHours = flights.flatMap(({ summary }) =>
    summary.times.blockS === null ? [] : [summary.times.blockS / 3600],
  );
  const landings = measured(finalLandings(flights));
  return {
    months: monthlyActivity(flights, now),
    takeoffs: takeoffHours(flights, tracks),
    durations: histogram(blockHours, DURATION_BUCKETS_H),
    touchdowns: histogram(
      landings.map((landing) => Math.abs(landing.touchdownVs)),
      TOUCHDOWN_BUCKETS_FPM,
    ),
    recentLandings: landings
      .slice(0, RECENT_LANDINGS)
      .map(({ at, touchdownVs }) => ({ at, touchdownVs }))
      .reverse(),
  };
}
