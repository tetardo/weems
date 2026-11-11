import { TOUCHDOWN_BUCKETS_FPM } from "@weems/contrats";

/** A bar of a bar chart, in the SVG coordinates of the chart. */
export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Centre, for the labels. */
  middle: number;
}

/** Drawing box of a chart: width, height, and room kept for labels. */
export interface ChartBox {
  width: number;
  height: number;
  top: number;
  bottom: number;
}

/** Bars side by side, as high as their value against the largest one; at least 2 px tall. */
export function barsOf(values: readonly number[], box: ChartBox): Bar[] {
  const max = Math.max(1, ...values);
  const slot = box.width / Math.max(1, values.length);
  const room = box.height - box.top - box.bottom;
  return values.map((value, i) => {
    const height = Math.max(2, (value / max) * room);
    const x = i * slot + slot * 0.2;
    return { x, y: box.top + room - height, width: slot * 0.6, height, middle: x + slot * 0.3 };
  });
}

/** Mean of each value and the ones before it, `size` at most (moving average). */
export function movingAverage(values: readonly number[], size = 5): number[] {
  return values.map((_, i) => {
    const window = values.slice(Math.max(0, i - size + 1), i + 1);
    return window.reduce((sum, v) => sum + v, 0) / window.length;
  });
}

/** Category of a touchdown, by the buckets of the API: soft, normal, firm, hard. */
export function touchdownBucket(touchdownVs: number): number {
  const index = TOUCHDOWN_BUCKETS_FPM.findIndex((bound) => Math.abs(touchdownVs) < bound);
  return index === -1 ? TOUCHDOWN_BUCKETS_FPM.length : index;
}

/** Colour of each touchdown bucket (theme variables). */
export const TOUCHDOWN_COLORS = [
  "var(--color-success)",
  "var(--color-accent)",
  "var(--color-accent-2)",
  "var(--color-danger)",
] as const;

/** Opacity of a cell of the takeoff grid: faint when empty, stronger with more takeoffs. */
export const cellOpacity = (count: number, max: number) =>
  count === 0 ? 0.07 : 0.25 + 0.75 * (count / Math.max(1, max));
