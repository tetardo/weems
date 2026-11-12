const PARIS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const DAY_MS = 24 * 60 * 60 * 1000;

/** The last `count` days in Paris, as YYYY-MM-DD, oldest first; the last one holds `now`. */
export function lastParisDays(now: Date, count: number): string[] {
  const today = Date.parse(`${PARIS_DAY.format(now)}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}

/** One entry per day, zeros for the days the database did not return. */
export function fillDays<T extends { date: string }>(
  days: readonly string[],
  rows: readonly T[],
  empty: (date: string) => T,
): T[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return days.map((date) => byDate.get(date) ?? empty(date));
}
