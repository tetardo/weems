import type { PilotStats } from "@weems/contrats";

const DAY_MS = 86_400_000;

/** Index of the week (Monday to Sunday, UTC) of a time. Day 0 (1 January 1970) was a Thursday. */
const weekOf = (time: Date) => Math.floor((Math.floor(time.getTime() / DAY_MS) + 3) / 7);

/** Index of the day (UTC) of a time. */
const dayOf = (time: Date) => Math.floor(time.getTime() / DAY_MS);

/**
 * Runs of consecutive periods (days or weeks) with a flight. The current run counts from this
 * period, or from the one before while this one has no flight yet; the record is the longest run.
 */
function runs(periods: ReadonlySet<number>, now: number): { current: number; record: number } {
  let period = periods.has(now) ? now : now - 1;
  let current = 0;
  while (periods.has(period)) {
    current++;
    period--;
  }
  let record = 0;
  for (const start of periods) {
    if (periods.has(start - 1)) continue;
    let length = 1;
    while (periods.has(start + length)) length++;
    record = Math.max(record, length);
  }
  return { current, record };
}

/** Weeks in a row (Monday to Sunday, UTC) with at least one flight: public profile. */
export function weeklyStreak(flightTimes: readonly Date[], now: Date): PilotStats["streak"] {
  const { current, record } = runs(new Set(flightTimes.map(weekOf)), weekOf(now));
  return { currentWeeks: current, recordWeeks: record };
}

/** Days in a row (UTC) with at least one flight: private logbook. */
export function dailyStreak(flightTimes: readonly Date[], now: Date) {
  return runs(new Set(flightTimes.map(dayOf)), dayOf(now));
}
