import type { PilotStats, TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dayNightSeconds } from "./day-night.ts";

const MONTHS_SHOWN = 12;

const monthOf = (date: Date) => date.toISOString().slice(0, 7);

/** Airborne time of each of the last 12 months (UTC), oldest first, empty months included. */
export function monthlyActivity(
  flights: readonly SummaryWithEvents[],
  now: Date,
): PilotStats["months"] {
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

/** Day and night airborne time of all the trajectories. */
export function dayAndNight(tracks: Iterable<readonly TrackPoint[]>): {
  dayS: number;
  nightS: number;
} {
  let dayS = 0;
  let nightS = 0;
  for (const points of tracks) {
    const flight = dayNightSeconds(points);
    dayS += flight.dayS;
    nightS += flight.nightS;
  }
  return { dayS, nightS };
}
