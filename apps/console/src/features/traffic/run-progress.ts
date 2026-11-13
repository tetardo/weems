import type { RunView } from "../../server/traffic/traffic-view.ts";

/** Share of the run done, 0 to 1: replays played (pnpm simulate) or time spent (pnpm load). */
export function runProgress(run: RunView, nowMs: number): number {
  if (run.state === "ended") return 1;
  if (run.launch.kind === "load") {
    return Math.min(1, (nowMs - Date.parse(run.startedAt)) / (run.launch.minutes * 60_000));
  }
  const pilots = run.progress?.pilots ?? [];
  if (pilots.length === 0) return 0;
  return pilots.reduce((sum, pilot) => sum + pilot.progress, 0) / pilots.length;
}

/** Points of a small curve in a 100 × 26 box. */
export function sparkPoints(values: readonly number[]): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  return values
    .map((value, i) => `${(i * step).toFixed(1)},${(24 - (value / max) * 22).toFixed(1)}`)
    .join(" ");
}
