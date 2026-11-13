import type { GoalView } from "@weems/contrats";

const [W, H] = [1000, 300];
export const CHART_SIZE = { width: W, height: H };

export interface GoalChartShape {
  /** The value after each counted flight, as steps from zero. */
  steps: string;
  /** Steady pace from zero to the target; null without end. */
  pace: string | null;
  /** From today's value to the target at the projected day; null without projection in view. */
  projection: string | null;
  todayX: number;
  /** Top of the scale, in the goal's unit: a round number of steps. */
  top: number;
  /** Round values of the scale, from 0 to top. */
  ticks: number[];
  /** First and last instants shown (ms). */
  from: number;
  to: number;
}

/** A round step (1, 2, 2.5 or 5 times a power of ten, at least 1) for about 4 rows up to max. */
export function roundStep(max: number): number {
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const factor = [1, 2, 2.5, 5, 10].find((f) => f * power >= raw) ?? 10;
  return Math.max(1, factor * power);
}

/** Cumulative chart of a goal (maquette v12 B): steps, steady pace, projection, today. */
export function goalChartShape(goal: GoalView, now: number): GoalChartShape {
  const from = Date.parse(goal.from);
  const to = goal.to ? Date.parse(goal.to) : Math.max(now, from + 7 * 86_400_000);
  const max = Math.max(goal.total, goal.value, ...goal.series.map((p) => p.value)) || 1;
  const step = roundStep(max);
  const top = step * Math.ceil(max / step);
  const x = (at: number) => (W * (Math.min(Math.max(at, from), to) - from)) / (to - from);
  const y = (value: number) => H - (H * value) / top;
  let steps = `M0,${H}`;
  let last = 0;
  for (const point of goal.series) {
    const px = x(Date.parse(point.at)).toFixed(1);
    steps += `L${px},${y(last).toFixed(1)}L${px},${y(point.value).toFixed(1)}`;
    last = point.value;
  }
  const todayX = x(now);
  steps += `L${Math.max(todayX, x(Date.parse(goal.series.at(-1)?.at ?? goal.from))).toFixed(1)},${y(last).toFixed(1)}`;
  const projected = goal.projection ? Date.parse(goal.projection) : null;
  return {
    steps,
    pace: goal.to ? `M0,${H}L${W},${y(goal.total).toFixed(1)}` : null,
    projection:
      projected !== null && projected <= to
        ? `M${todayX.toFixed(1)},${y(goal.value).toFixed(1)}L${x(projected).toFixed(1)},${y(goal.total).toFixed(1)}`
        : null,
    todayX,
    top,
    ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step),
    from,
    to,
  };
}
