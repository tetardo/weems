"use client";

import { readServices } from "../actions/services.ts";
import { readTraffic } from "../actions/traffic.ts";
import { usePolling } from "../ui/use-polling.ts";

/** What the sidebar shows on every page: services up, a run in progress. */
export function useConsoleStatus() {
  const services = usePolling(readServices, 5_000).value;
  const traffic = usePolling(readTraffic, 5_000).value;
  return {
    services: services?.services ?? [],
    running: services?.services.filter((s) => s.state === "running").length ?? 0,
    trafficRunning:
      traffic?.run !== null && traffic?.run !== undefined && traffic.run.state !== "ended",
  };
}
