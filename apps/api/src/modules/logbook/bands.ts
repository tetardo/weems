import type { BandMinute, BandRow, FlightBands, FlightPhase, TrackPoint } from "@weems/contrats";
import { BandRow as BAND_ROWS } from "@weems/contrats";
import { marksOf, type MarkedPoint } from "./marks.ts";

const MINUTE_MS = 60_000;
type Weather = NonNullable<BandMinute["weather"]>;
type Point = MarkedPoint & { phase: FlightPhase | null };

const mean = (values: readonly number[]) => values.reduce((s, v) => s + v, 0) / values.length;
const max = (values: readonly number[]) => Math.max(...values);
/** The value furthest from zero, either way. */
const extreme = (values: readonly number[]) =>
  values.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
const share = (values: readonly number[]) => mean(values);
const known = <T>(values: readonly (T | null | undefined)[]): T[] =>
  values.filter((v): v is T => v !== null && v !== undefined);
const bit = (on: boolean | null | undefined) => (on === null || on === undefined ? null : +on);

/** Strongest deceleration on the ground between consecutive points, kt/s (0 when none). */
function braking(points: readonly Point[], before: Point | undefined): number[] {
  return points.flatMap((p, i) => {
    const previous = i === 0 ? before : points[i - 1];
    if (!previous || !p.onGround || !previous.onGround) return [];
    const seconds = (Date.parse(p.at) - Date.parse(previous.at)) / 1000;
    return seconds > 0 ? [Math.max(0, (previous.gs - p.gs) / seconds)] : [];
  });
}

/** How each row reads a minute of points: which value, and how the minute sums it up. */
const READERS: Record<BandRow, (points: readonly Point[], before?: Point) => number[] | null> = {
  altitude: (ps) => ps.map((p) => p.altMsl),
  speed: (ps) => ps.map((p) => p.ias),
  verticalSpeed: (ps) => ps.map((p) => p.vs),
  bank: (ps) => known(ps.map((p) => p.bank)).map(Math.abs),
  gForce: (ps) => known(ps.map((p) => p.gForce)),
  n1: (ps) => known(ps.map((p) => p.n1)),
  flaps: (ps) => known(ps.map((p) => p.flapsIndex)),
  gear: (ps) => known(ps.map((p) => p.gearHandle)),
  spoilers: (ps) => known(ps.map((p) => p.spoilers)),
  braking: (ps, before) => braking(ps, before),
  parkingBrake: (ps) => known(ps.map((p) => bit(p.parkingBrake))),
  autopilot: (ps) => known(ps.map((p) => bit(p.autopilot))),
  landingLight: (ps) => known(ps.map((p) => bit(p.landingLight))),
  beacon: (ps) => known(ps.map((p) => bit(p.lights?.beacon))),
  strobe: (ps) => known(ps.map((p) => bit(p.lights?.strobe))),
  seatbelts: (ps) => known(ps.map((p) => bit(p.seatbelts))),
  cabinAltitude: (ps) => known(ps.map((p) => p.cabinAlt)),
  cabinRate: (ps) => known(ps.map((p) => p.cabinRate)),
};

const SUMMED_BY: Record<BandRow, (values: readonly number[]) => number> = {
  altitude: max,
  speed: mean,
  verticalSpeed: mean,
  bank: max,
  gForce: max,
  n1: mean,
  flaps: max,
  gear: max,
  spoilers: max,
  braking: max,
  parkingBrake: share,
  autopilot: share,
  landingLight: share,
  beacon: share,
  strobe: share,
  seatbelts: share,
  cabinAltitude: max,
  cabinRate: extreme,
};

/** The points of each minute since the first point; minutes without a point are left out. */
function byMinute(points: readonly Point[]): Point[][] {
  const start = Date.parse(points[0]?.at ?? "");
  const minutes = new Map<number, Point[]>();
  for (const p of points) {
    const index = Math.floor((Date.parse(p.at) - start) / MINUTE_MS);
    const minute = minutes.get(index);
    if (minute) minute.push(p);
    else minutes.set(index, [p]);
  }
  return [...minutes.values()];
}

/**
 * Wind of a minute: directions averaged as vectors (350° and 10° give 0°, not 180°), speeds as
 * a plain mean; null when no point recorded it.
 */
function windOf(points: readonly Point[]): Weather["wind"] {
  const winds = known(points.map((p) => p.wind));
  if (winds.length === 0) return null;
  const rad = (d: number) => (d * Math.PI) / 180;
  const east = mean(winds.map((w) => Math.sin(rad(w.dir))));
  const north = mean(winds.map((w) => Math.cos(rad(w.dir))));
  const dir = Math.round(((Math.atan2(east, north) * 180) / Math.PI + 360) % 360);
  return { dir, speed: Math.round(mean(winds.map((w) => w.speed))) };
}

/** Weather of a minute: wind, temperature and visibility, each null when not recorded. */
export function weatherOf(points: readonly Point[]): Weather {
  const oat = known(points.map((p) => p.oat));
  const visibility = known(points.map((p) => p.visibilityM));
  return {
    wind: windOf(points),
    oat: oat.length === 0 ? null : Math.round(mean(oat)),
    visibilityM: visibility.length === 0 ? null : Math.round(mean(visibility)),
  };
}

function minuteOf(points: readonly Point[], before: Point | undefined): BandMinute {
  const first = points[0] as Point;
  const values = Object.fromEntries(
    BAND_ROWS.options.map((row) => {
      const read = READERS[row](points, before);
      return [row, read && read.length > 0 ? SUMMED_BY[row](read) : null];
    }),
  ) as Record<BandRow, number | null>;
  return { at: first.at, phase: points.at(-1)?.phase ?? null, values, weather: weatherOf(points) };
}

/** Fuel burnt from the first to the last point that records it; null when none does. */
export function fuelUsedKg(points: readonly TrackPoint[]): number | null {
  const fuel = known(points.map((p) => p.fuelKg));
  const [first, last] = [fuel[0], fuel.at(-1)];
  return first === undefined || last === undefined ? null : Math.max(0, first - last);
}

/**
 * Flight bands (spec carnet privé, § 4): one column per minute, one row per parameter, from every
 * recorded point. `withMarks`: the plan includes the stretches to review (flightBandsMarks, marks.ts).
 */
export function flightBands(
  points: readonly Point[],
  withMarks: boolean,
): Omit<FlightBands, "distanceNm"> {
  const grouped = byMinute(points);
  const minutes = grouped.map((ps, i) => minuteOf(ps, grouped[i - 1]?.at(-1)));
  const review = withMarks ? marksOf(grouped) : null;
  return {
    minutes,
    rows: BAND_ROWS.options.filter((row) => minutes.some((m) => m.values[row] !== null)),
    marks: review?.marks ?? null,
    unmeasured: review?.unmeasured ?? null,
    fuelUsedKg: fuelUsedKg(points),
  };
}
