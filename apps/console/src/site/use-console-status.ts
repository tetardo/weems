"use client";

import { readActivity } from "../actions/activity.ts";
import { readServices } from "../actions/services.ts";
import { readTraffic } from "../actions/traffic.ts";
import { usePolling } from "../ui/use-polling.ts";

/** A run is in progress while it exists and has not ended. */
const isRunning = (view: { run: { state: string } | null } | null | undefined) =>
  view?.run !== null && view?.run !== undefined && view.run.state !== "ended";

/** What the sidebar shows on every page: services up, a run in progress. */
export function useConsoleStatus() {
  const services = usePolling(readServices, 5_000).value;
  const traffic = usePolling(readTraffic, 5_000).value;
  const activity = usePolling(readActivity, 5_000).value;
  return {
    services: services?.services ?? [],
    running: services?.services.filter((s) => s.state === "running").length ?? 0,
    trafficRunning: isRunning(traffic),
    activityRunning: isRunning(activity),
  };
}
