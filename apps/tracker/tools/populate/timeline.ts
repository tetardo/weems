const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
/** Europe in winter: most homes are at UTC+0 to UTC+1; one hour is close enough. */
const LOCAL_OFFSET_MS = HOUR_MS;
/** Ground before and after the flight (boarding, taxi, parking), then a rest before the next one. */
const GROUND_MS = 30 * 60 * 1000;
const REST_MS = HOUR_MS;

/** Period of a pilot's history: flights end before `nowMs`. */
export interface HistoryWindow {
  fromMs: number;
  nowMs: number;
}

/** Local departure hour: mostly evenings and mornings, as a hobby (spec admin, Activité simulée). */
function localHour(random: () => number): number {
  const slot = random();
  if (slot < 0.3) return 7 + random() * 3; // before work
  if (slot < 0.55) return 11 + random() * 5;
  return 18 + random() * 4; // evening
}

/** A day of the history, weekends twice as likely. */
function dayOf(random: () => number, window: HistoryWindow): number {
  const days = Math.max(1, Math.floor((window.nowMs - window.fromMs) / DAY_MS));
  for (;;) {
    const day = window.fromMs + Math.floor(random() * days) * DAY_MS;
    const weekend = [0, 6].includes(new Date(day).getUTCDay());
    if (weekend || random() < 0.5) return day - (day % DAY_MS);
  }
}

/** Earliest next departure after a flight of `airborneMs` opened at `openedAtMs`. */
const freeAfter = (openedAtMs: number, airborneMs: number) =>
  openedAtMs + airborneMs + GROUND_MS + REST_MS;

/**
 * Departures of a hobby pilot, one per planned flight (`airborneMs`, in order), on drawn days
 * and hours, each after the previous one has landed. Those pushed past now are dropped: the
 * history keeps the first flights of the chain.
 */
export function hobbyDepartures(
  airborneMs: readonly number[],
  window: HistoryWindow,
  random: () => number,
): number[] {
  const times = airborneMs
    .map(() =>
      Math.max(
        window.fromMs,
        dayOf(random, window) + localHour(random) * HOUR_MS - LOCAL_OFFSET_MS,
      ),
    )
    .sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) {
    times[i] = Math.max(times[i] ?? 0, freeAfter(times[i - 1] ?? 0, airborneMs[i - 1] ?? 0));
  }
  const kept = times.findIndex((at, i) => freeAfter(at, airborneMs[i] ?? 0) > window.nowMs);
  return kept === -1 ? times : times.slice(0, kept);
}

/** Flights a career pilot flies per day of history, about. */
const CAREER_FLIGHTS_PER_DAY = 0.7;

/**
 * Departures of a career: every flight kept (the rank depends on them), one after the other with
 * random rests, over a history long enough for their number, the last one landed before now.
 */
export function careerDepartures(
  airborneMs: readonly number[],
  window: HistoryWindow,
  random: () => number,
): number[] {
  const spanMs = Math.max(
    window.nowMs - window.fromMs,
    (airborneMs.length / CAREER_FLIGHTS_PER_DAY) * DAY_MS,
  );
  const busyMs = airborneMs.reduce((sum, ms) => sum + ms + GROUND_MS + REST_MS, 0);
  const slackMs = Math.max(0, spanMs - busyMs) / Math.max(1, airborneMs.length);
  const times: number[] = [];
  let at = window.nowMs - spanMs;
  for (const ms of airborneMs) {
    times.push(at);
    at = freeAfter(at, ms) + random() * 2 * slackMs;
  }
  const last = times.length - 1;
  const overMs = last < 0 ? 0 : freeAfter(times[last] ?? 0, airborneMs[last] ?? 0) - window.nowMs;
  return overMs > 0 ? times.map((t) => t - overMs) : times;
}
