import { NIGHT_BELOW_DEG, sunElevationDeg, type LogbookStats } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dayAndNight } from "../profiles/day-night.ts";
import { sum } from "../profiles/sum.ts";
import { localTakeoff } from "../profiles/takeoff-hours.ts";
import type { Tracks } from "./stats-input.ts";

type Activity = LogbookStats["activity"];

const dayOf = (openedAt: string) => new Date(openedAt).toISOString().slice(0, 10);

/** Theme Activité, the four figures: hours, flying days, mean and longest flight, night time. */
export function activityOf(flights: readonly SummaryWithEvents[], tracks: Tracks): Activity {
  const blocks = flights.flatMap(({ summary }) =>
    summary.times.blockS === null ? [] : [summary.times.blockS],
  );
  return {
    flights: flights.length,
    airborneS: sum(flights.map(({ summary }) => summary.times.airborneS ?? 0)),
    flyingDays: new Set(flights.map(({ summary }) => dayOf(summary.openedAt))).size,
    averageBlockS: blocks.length === 0 ? null : sum(blocks) / blocks.length,
    longestBlockS: blocks.length === 0 ? null : Math.max(...blocks),
    ...dayAndNight(flights.map(({ summary }) => tracks.get(summary.flightId) ?? [])),
  };
}

/**
 * « Jour de la semaine » and « Heure de décollage »: airborne time by weekday of the takeoff, and
 * takeoffs by hour, in the local time of the place, by day or by night (sun at the place).
 */
export function takeoffRhythm(
  flights: readonly SummaryWithEvents[],
  tracks: Tracks,
): Pick<LogbookStats, "weekdays" | "takeoffHours"> {
  const weekdays = Array.from({ length: 7 }, () => 0);
  const takeoffHours = Array.from({ length: 24 }, () => ({ day: 0, night: 0 }));
  for (const flight of flights) {
    const takeoff = localTakeoff(flight, tracks);
    if (!takeoff) continue;
    weekdays[takeoff.day] = (weekdays[takeoff.day] ?? 0) + (flight.summary.times.airborneS ?? 0);
    const slot = takeoffHours[takeoff.hour];
    if (!slot) continue;
    if (sunElevationDeg(takeoff.time, takeoff.lat, takeoff.lon) < NIGHT_BELOW_DEG) slot.night++;
    else slot.day++;
  }
  return { weekdays, takeoffHours };
}
