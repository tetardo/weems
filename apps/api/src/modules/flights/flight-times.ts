import type { FlightEvent, FlightTimes } from "@weems/contrats";

const ms = (utc: string) => Date.parse(utc);
const seconds = (fromMs: number, toMs: number) => Math.max(0, Math.round((toMs - fromMs) / 1000));

/** Paused intervals, closed at `endMs` if the flight ended paused. */
function pausedIntervals(events: readonly FlightEvent[], endMs: number): [number, number][] {
  const intervals: [number, number][] = [];
  let since: number | null = null;
  for (const event of events) {
    if (event.type === "paused" && since === null) since = ms(event.at);
    if (event.type === "unpaused" && since !== null) {
      intervals.push([since, ms(event.at)]);
      since = null;
    }
  }
  if (since !== null) intervals.push([since, endMs]);
  return intervals;
}

/** Seconds of the intervals that fall between `fromMs` and `toMs`. */
function overlapS(intervals: readonly [number, number][], fromMs: number, toMs: number): number {
  return intervals.reduce(
    (total, [start, end]) => total + seconds(Math.max(start, fromMs), Math.min(end, toMs)),
    0,
  );
}

/** Liftoff: end of the first takeoff (TAKEOFF → CLIMB); flights started in the air count from opening. */
function liftoffMs(openedAtMs: number, events: readonly FlightEvent[]): number | null {
  for (const event of events) {
    if (event.type !== "phaseChanged") continue;
    if (event.context["from"] === "TAKEOFF" && event.context["to"] === "CLIMB") return ms(event.at);
    if (event.context["from"] === null && event.context["airStart"] === true) return openedAtMs;
  }
  return null;
}

function lastTouchdownMs(events: readonly FlightEvent[]): number | null {
  const touchdowns = events.filter((e) => e.type === "touchdown");
  const last = touchdowns[touchdowns.length - 1];
  return last ? ms(last.at) : null;
}

function airborneS(
  openedMs: number,
  events: readonly FlightEvent[],
  paused: readonly [number, number][],
): number | null {
  const liftoff = liftoffMs(openedMs, events);
  const touchdown = lastTouchdownMs(events);
  if (liftoff === null || touchdown === null || touchdown <= liftoff) return null;
  return seconds(liftoff, touchdown) - overlapS(paused, liftoff, touchdown);
}

/** Block, airborne and paused times of a flight, from its events (EF-15: pauses excluded). */
export function flightTimes(
  flight: { openedAt: string; closedAt: string | null },
  events: readonly FlightEvent[],
): FlightTimes {
  const openedMs = ms(flight.openedAt);
  const lastEvent = events[events.length - 1];
  const endMs = flight.closedAt === null ? null : ms(flight.closedAt);
  const untilMs = endMs ?? (lastEvent ? ms(lastEvent.at) : openedMs);
  const paused = pausedIntervals(events, untilMs);
  const pausedS = overlapS(paused, openedMs, untilMs);
  return {
    blockS: endMs === null ? null : seconds(openedMs, endMs) - pausedS,
    airborneS: airborneS(openedMs, events, paused),
    pausedS,
  };
}
