import type { BandMinute, BandRow, FlightBands as Bands } from "@weems/contrats";

/** Above this many minutes in view, one cell gathers several minutes (Greg, 14/11/2026). */
const LONG_VIEW_MINUTES = 120;
const LONG_VIEW_CELL = 5;

/** Minutes shown, by index in the flight (inclusive). */
export interface BandWindow {
  from: number;
  to: number;
}

/** The bands as shown: one cell per `size` minutes; `starts` gives each cell's first minute. */
export interface WindowedBands {
  bands: Bands;
  size: number;
  starts: number[];
}

type Gather = (values: number[]) => number;
const max: Gather = (values) => Math.max(...values);
const mean: Gather = (values) => values.reduce((a, b) => a + b, 0) / values.length;
/** The value farthest from zero, sign kept (vertical speed, cabin rate). */
const largest: Gather = (values) => values.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);

/** How the minutes of a cell are gathered: as the API builds a minute from its points. */
const GATHER: Record<BandRow, Gather> = {
  altitude: max,
  cabinAltitude: max,
  gForce: max,
  flaps: max,
  gear: max,
  spoilers: max,
  bank: max,
  braking: max,
  speed: mean,
  n1: mean,
  parkingBrake: mean,
  autopilot: mean,
  landingLight: mean,
  beacon: mean,
  strobe: mean,
  seatbelts: mean,
  verticalSpeed: largest,
  cabinRate: largest,
};

function gatherCell(
  head: BandMinute,
  minutes: readonly BandMinute[],
  rows: readonly BandRow[],
): BandMinute {
  const middle = minutes[Math.floor(minutes.length / 2)] ?? head;
  const values = Object.fromEntries(
    rows.map((row) => {
      const known = minutes
        .map((m) => m.values[row] ?? null)
        .filter((v): v is number => v !== null);
      return [row, known.length === 0 ? null : GATHER[row](known)];
    }),
  ) as BandMinute["values"];
  const weather = middle.weather ?? head.weather;
  return { at: head.at, phase: middle.phase, values, ...(weather ? { weather } : {}) };
}

/** Cell size of a view: one minute, or five beyond LONG_VIEW_MINUTES. */
export const cellSize = (window: BandWindow) =>
  window.to - window.from + 1 > LONG_VIEW_MINUTES ? LONG_VIEW_CELL : 1;

/** The bands of a window of the flight, gathered by cells when the view is long. */
export function windowBands(bands: Bands, window: BandWindow): WindowedBands {
  const size = cellSize(window);
  const starts: number[] = [];
  const minutes: BandMinute[] = [];
  for (let first = window.from; first <= window.to; first += size) {
    const group = bands.minutes.slice(first, Math.min(first + size, window.to + 1));
    const head = group[0];
    if (!head) break;
    starts.push(first);
    minutes.push(size === 1 ? head : gatherCell(head, group, bands.rows));
  }
  const cellOf = (minute: number) => Math.floor((minute - window.from) / size);
  const marks =
    bands.marks
      ?.filter((m) => m.to >= window.from && m.from <= window.to)
      .map((m) => ({
        ...m,
        from: cellOf(Math.max(m.from, window.from)),
        to: cellOf(Math.min(m.to, window.to)),
      })) ?? null;
  return { bands: { ...bands, minutes, marks }, size, starts };
}

/** The view of the bands and the stretch of the flight it shows. */
export interface Place {
  view: WindowedBands;
  shown: BandWindow;
}

/** Cell of the view holding minute `minute` of the flight, or null outside the window. */
export function cellOfMinute(view: WindowedBands, window: BandWindow, minute: number | null) {
  if (minute === null || minute < window.from || minute > window.to) return null;
  return Math.min(view.starts.length - 1, Math.floor((minute - window.from) / view.size));
}
