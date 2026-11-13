import tzLookup from "@photostructure/tz-lookup";
import { phaseChangeOf, type PilotCharts, type TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const formats = new Map<string, Intl.DateTimeFormat>();

/** Weekday (0 = Monday) and hour of a time in a time zone. */
function localSlot(time: Date, timeZone: string): { day: number; hour: number } {
  let format = formats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "numeric",
      hourCycle: "h23",
    });
    formats.set(timeZone, format);
  }
  const parts = format.formatToParts(time);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: WEEKDAYS.indexOf(value("weekday")), hour: Number(value("hour")) };
}

/** Time of the takeoff: the first change to the TAKEOFF phase; null for a flight opened in the air. */
function takeoffTime({ events }: SummaryWithEvents): Date | null {
  const takeoff = events.find((event) => phaseChangeOf(event)?.to === "TAKEOFF");
  return takeoff ? new Date(takeoff.at) : null;
}

/** A takeoff in the local time of its place: weekday (0 = Monday), hour, time and position. */
export interface LocalTakeoff {
  day: number;
  hour: number;
  time: Date;
  lat: number;
  lon: number;
}

/** Local takeoff of a flight; null without takeoff or trajectory. */
export function localTakeoff(
  flight: SummaryWithEvents,
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
): LocalTakeoff | null {
  const time = takeoffTime(flight);
  const start = tracks.get(flight.summary.flightId)?.[0];
  if (!time || !start) return null;
  return {
    ...localSlot(time, tzLookup(start.lat, start.lon)),
    time,
    lat: start.lat,
    lon: start.lon,
  };
}

/**
 * Takeoffs by weekday and hour, in the local time of the place of takeoff: the time zone of the
 * first point of the trajectory, from a table of time zones shipped with the API (no outside
 * service). Flights without takeoff or trajectory are left out.
 */
export function takeoffHours(
  flights: readonly SummaryWithEvents[],
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
): PilotCharts["takeoffs"] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const flight of flights) {
    const takeoff = localTakeoff(flight, tracks);
    if (!takeoff) continue;
    const { day, hour } = takeoff;
    const row = grid[day];
    if (row && row[hour] !== undefined) row[hour]++;
  }
  return grid;
}
