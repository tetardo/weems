import type { PilotStats } from "@weems/contrats";

const DAY_MS = 86_400_000;

/** Index of the week (Monday to Sunday, UTC) of a time. Day 0 (1 January 1970) was a Thursday. */
const weekOf = (time: Date) => Math.floor((Math.floor(time.getTime() / DAY_MS) + 3) / 7);

/**
 * Weeks in a row with at least one flight. The current run counts from this week, or from last
 * week while this one has no flight yet; the record is the longest run ever.
 */
export function weeklyStreak(flightTimes: readonly Date[], now: Date): PilotStats["streak"] {
  const weeks = new Set(flightTimes.map(weekOf));
  const thisWeek = weekOf(now);
  let week = weeks.has(thisWeek) ? thisWeek : thisWeek - 1;
  let currentWeeks = 0;
  while (weeks.has(week)) {
    currentWeeks++;
    week--;
  }
  let recordWeeks = 0;
  for (const start of weeks) {
    if (weeks.has(start - 1)) continue;
    let length = 1;
    while (weeks.has(start + length)) length++;
    recordWeeks = Math.max(recordWeeks, length);
  }
  return { currentWeeks, recordWeeks };
}
