import type { DevFlightCounts, SimulationProgress } from "@weems/contrats";
import type { HistoryEntry } from "./history.ts";
import type { Launch } from "./launch.ts";

/** One reading of GET /v1/dev/metrics during a run (tiles and their small curves). */
export interface MetricsSample {
  at: string;
  flights: number;
  viewers: number;
  loopP99Ms: number;
  rssMb: number;
}

export interface RunView {
  id: string;
  launch: Launch;
  summary: string;
  startedAt: string;
  endedAt: string | null;
  state: "running" | "stopping" | "ended";
  /** pnpm simulate only (pnpm load prints its report at the end). */
  progress: SimulationProgress | null;
  outcome: HistoryEntry["outcome"] | null;
  detail: string | null;
  /** Last lines written: the report of pnpm load, or the reason of a failure. */
  lastLines: string[];
}

export interface TrafficView {
  run: RunView | null;
  series: MetricsSample[];
  /** Null when the API does not answer. */
  counts: DevFlightCounts | null;
  history: HistoryEntry[];
}
