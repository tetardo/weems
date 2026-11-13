import type {
  FictitiousPopulation,
  LiveActivityProgress,
  PopulationProgress,
  PopulationResult,
} from "@weems/contrats";
import type { ActivityLaunch } from "./launch.ts";

/** Last line of `pnpm populate live`, without its type. */
export interface LiveResult {
  stopped: boolean;
  departed: number;
  landed: number;
  interrupted: number;
  pending: number;
}

export interface ActivityRun {
  launch: ActivityLaunch;
  summary: string;
  startedAt: string;
  endedAt: string | null;
  state: "running" | "stopping" | "ended";
  progress: PopulationProgress | LiveActivityProgress | null;
  result: PopulationResult | LiveResult | null;
  /** « Réussi » only when the tool finished and every check passed. */
  outcome: "success" | "failed" | "stopped" | null;
  /** Last lines written when it failed. */
  lastLines: string[];
}

export interface ActivityView {
  run: ActivityRun | null;
  /** Null when the API does not answer. */
  population: Omit<FictitiousPopulation, "pilotIds"> | null;
  /** Another run (page Trafic simulé) is in progress: launching here is refused. */
  trafficBusy: boolean;
}
