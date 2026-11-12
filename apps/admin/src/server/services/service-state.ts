import type { ProcessStatus } from "../managed-process.ts";
import type { ContainerState } from "./docker.ts";
import type { Probe } from "./probes.ts";
import type { Runner, ServiceState } from "./service-view.ts";

/** A service may take this long to answer after its start (pnpm dev compiles first). */
const STARTING_MS = 90_000;

export interface Facts {
  probe: Probe;
  process: ProcessStatus | null;
  container: ContainerState | undefined;
  /** Last line written by the process: the reason of a failed start. */
  lastLine: string | null;
  nowMs: number;
}

function runnerOf({ probe, process, container }: Facts): Runner | null {
  if (process?.running) return "console";
  if (container?.running) return "docker";
  return probe.ok ? "outside" : null;
}

type Shown = { state: ServiceState; runner: Runner | null; error: string | null };

/** Started by the console: still compiling, or never answered. */
function consoleState(facts: Facts): Shown {
  const startedMs = Date.parse(facts.process?.startedAt ?? "");
  if (facts.nowMs - startedMs < STARTING_MS)
    return { state: "starting", runner: "console", error: null };
  return { state: "error", runner: "console", error: `Ne répond pas : ${facts.probe.detail}` };
}

/** Not running: an exit other than 0 or SIGTERM (143) is a failed start. */
function idleState(facts: Facts): Shown {
  const exit = facts.process?.exitCode ?? 0;
  if (exit !== 0 && exit !== 143) {
    return { state: "error", runner: null, error: facts.lastLine ?? `Arrêté (code ${exit})` };
  }
  return { state: "stopped", runner: null, error: null };
}

/** State shown on a card, from what the console can observe. Pure: tested without processes. */
export function stateOf(facts: Facts): Shown {
  const runner = runnerOf(facts);
  if (facts.probe.ok) return { state: "running", runner, error: null };
  if (runner === "docker") return { state: "starting", runner, error: null };
  if (runner === "console") return consoleState(facts);
  return idleState(facts);
}
