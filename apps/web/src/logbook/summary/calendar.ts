import type { FlyingDay } from "@weems/contrats";

const DAY_MS = 86_400_000;

export interface CalendarDay {
  /** YYYY-MM-DD (UTC). */
  day: string;
  /** Column (week, oldest first) and row (0 = Monday). */
  week: number;
  weekday: number;
  flights: number;
  airborneS: number;
  /** 0: no flight, 1 to 3: more and more flying time. */
  level: number;
}

/** Shade of a day: 1 flight or less than 1 h, 2 flights or 2 h, more. */
function levelOf(flights: number, airborneS: number): number {
  if (flights === 0) return 0;
  if (flights >= 3 || airborneS >= 3 * 3600) return 3;
  return flights === 2 || airborneS >= 3600 ? 2 : 1;
}

/**
 * Calendar of the Régularité block: `weeks` columns of 7 days (Monday first, UTC), the last
 * column holding `today`.
 */
export function flyingCalendar(
  days: readonly FlyingDay[],
  today: Date,
  weeks: number,
): CalendarDay[] {
  const flown = new Map(days.map((d) => [d.day, d]));
  const todayIndex = Math.floor(today.getTime() / DAY_MS);
  const monday = todayIndex - ((todayIndex + 3) % 7);
  const start = monday - (weeks - 1) * 7;
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const day = new Date((start + i) * DAY_MS).toISOString().slice(0, 10);
    const entry = flown.get(day);
    const flights = entry?.flights ?? 0;
    const airborneS = entry?.airborneS ?? 0;
    return {
      day,
      week: Math.floor(i / 7),
      weekday: i % 7,
      flights,
      airborneS,
      level: levelOf(flights, airborneS),
    };
  });
}
