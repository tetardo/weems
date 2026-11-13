import type { FlyingDay } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";

const DAY_MS = 86_400_000;

/** Days (UTC) with a flight over the last `weeks` weeks, oldest first: Régularité calendars. */
export function flyingDays(
  flights: readonly SummaryWithEvents[],
  now: Date,
  weeks: number,
): FlyingDay[] {
  const from = now.getTime() - weeks * 7 * DAY_MS;
  const days = new Map<string, { flights: number; airborneS: number }>();
  for (const { summary } of flights) {
    if (Date.parse(summary.openedAt) < from) continue;
    const day = new Date(summary.openedAt).toISOString().slice(0, 10);
    const entry = days.get(day) ?? { flights: 0, airborneS: 0 };
    entry.flights++;
    entry.airborneS += summary.times.airborneS ?? 0;
    days.set(day, entry);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, entry]) => ({ day, ...entry }));
}
