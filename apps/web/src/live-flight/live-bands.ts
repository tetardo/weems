import { type BandMinute, BandRow, type FlightBands, type LiveTrailPoint } from "@weems/contrats";

const MINUTE_MS = 60_000;

/** Rows a flight in progress can fill: positions carry no bank, controls or cabin (Greg, 13/11). */
const LIVE_ROWS = ["altitude", "speed", "verticalSpeed"] as const;

const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** Every row unknown: what positions do not carry stays null, never 0. */
const NOTHING = Object.fromEntries(
  BandRow.options.map((row) => [row, null]),
) as BandMinute["values"];

/** One column from the points of a minute: highest altitude, mean ground and vertical speeds. */
function minuteOf(at: string, points: readonly LiveTrailPoint[]): BandMinute {
  if (points.length === 0) return { at, phase: null, values: NOTHING };
  return {
    at,
    phase: points.at(-1)?.phase ?? null,
    values: {
      ...NOTHING,
      altitude: Math.max(...points.map((p) => p.altMsl)),
      speed: mean(points.map((p) => p.gs)),
      verticalSpeed: mean(points.map((p) => p.vs)),
    },
  };
}

/**
 * Flight bands of a flight in progress (spec vol en cours): one column per minute from the first
 * point, then empty columns up to `endMs` (the estimated arrival), so that the grid fills as the
 * flight goes. Minutes without a point (API restarted) stay empty.
 */
export function liveBands(points: readonly LiveTrailPoint[], endMs: number | null): FlightBands {
  const first = points[0];
  const empty = { rows: [...LIVE_ROWS], marks: null, fuelUsedKg: null, distanceNm: 0 };
  if (!first) return { minutes: [], ...empty };
  const startMs = Date.parse(first.at);
  const indexOf = (p: LiveTrailPoint) => Math.floor((Date.parse(p.at) - startMs) / MINUTE_MS);
  const flown = indexOf(points.at(-1) ?? first) + 1;
  const total = Math.max(flown, endMs === null ? 0 : Math.ceil((endMs - startMs) / MINUTE_MS));
  const byMinute = Array.from({ length: total }, () => [] as LiveTrailPoint[]);
  points.forEach((p) => byMinute[indexOf(p)]?.push(p));
  const minutes = byMinute.map((inMinute, i) =>
    minuteOf(new Date(startMs + i * MINUTE_MS).toISOString(), inMinute),
  );
  return { minutes, ...empty };
}
