import { mkdirSync } from "node:fs";
import type { ApiClient } from "../../src/sender/api-client.ts";
import type { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { departureOffsetsS } from "./departures.ts";
import { liveTracker } from "./live-tracker.ts";
import type { Scenario } from "../generate-flights/scenario.ts";
import type { SimulationProgress } from "@weems/contrats";
import { progressOf, type ProgressSource } from "./progress.ts";

export interface SimulationOptions {
  scenarios: readonly Scenario[];
  api: ApiClient;
  /** Replay speed: 1 = real time, 10 = ten times faster. */
  speed: number;
  /** Simulated seconds between two departures (on average with `random`). */
  staggerS: number;
  /** Draws the gaps between departures; without it they are regular (load test, J1). */
  random?: () => number;
  /** Folder for the local databases of the simulated trackers. */
  workDir: string;
  trackerVersion: string;
  /** Real ms between two sending rounds. */
  pumpEveryMs?: number;
  /** Real ms to keep sending after the last replay ends, for queued messages. */
  drainTimeoutMs?: number;
  /** Real ms after which every replay stops, flights left open (load test, spec J4). */
  stopAfterMs?: number;
  /**
   * Starts each replay at the pushback (EF-07), without the minute of boarding at the gate when
   * nothing is sent: a short load test at ×1 would otherwise show no flight at all.
   */
  skipBoarding?: boolean;
  /** Stops every replay and closes the flights in the air as interrupted (admin console). */
  signal?: AbortSignal;
  /** Called after each sending round. */
  onProgress?: (progress: SimulationProgress) => void;
}

export interface SimulatedFlight {
  scenario: Scenario;
  flightId: string | null;
  /** Messages still waiting in the tracker's outbox at the end. */
  pending: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface Run extends ProgressSource {
  /** Built at departure only: N pilots never hold N whole flights in memory at once. */
  connector: ReplayConnector | null;
  done: Promise<void>;
}

function buildTracker(scenario: Scenario, options: SimulationOptions) {
  return liveTracker(scenario, {
    api: options.api,
    speed: options.speed,
    workDir: options.workDir,
    trackerVersion: options.trackerVersion,
    ...(options.skipBoarding ? { skipBoarding: true } : {}),
    ...(options.stopAfterMs === undefined ? {} : { stopAfterMs: options.stopAfterMs }),
  });
}

/** When departures stop: moved to now when the simulation is stopped. */
interface Stop {
  atMs: number;
}

function startOne(scenario: Scenario, offsetS: number, options: SimulationOptions, stop: Stop) {
  const run: Run = {
    scenario,
    tracker: null,
    connector: null,
    startedAtMs: null,
    durationMs: 1,
    done: Promise.resolve(),
  };
  const delayMs = (offsetS * 1000) / options.speed;
  // A pilot whose departure comes after the stop never takes off.
  run.done = waitUntil(Date.now() + delayMs, stop).then(() => {
    if (Date.now() >= stop.atMs) return;
    Object.assign(run, buildTracker(scenario, options));
    return run.tracker?.runtime.start();
  });
  return run;
}

/** Waits until `atMs`, or less if the stop comes first (checked every second). */
async function waitUntil(atMs: number, stop: Stop): Promise<void> {
  while (Date.now() < Math.min(atMs, stop.atMs)) {
    await wait(Math.min(1000, Math.min(atMs, stop.atMs) - Date.now()));
  }
}

const trackersOf = (runs: readonly Run[]) => runs.flatMap((r) => (r.tracker ? [r.tracker] : []));

/** Stops departures and replays; with `interrupt`, flights in the air are closed as interrupted. */
function stopAll(runs: readonly Run[], stop: Stop, interrupt: boolean): Promise<unknown> {
  stop.atMs = Date.now();
  if (interrupt) trackersOf(runs).forEach((t) => t.runtime.interruptFlight());
  return Promise.all(runs.map((r) => r.connector?.stop()));
}

/** Sends every half second while replaying, then until the outboxes are empty (or the timeout). */
async function pump(runs: readonly Run[], options: SimulationOptions, replaying: () => boolean) {
  let drainEnd = Number.POSITIVE_INFINITY;
  const pending = () => trackersOf(runs).some((t) => t.sender.pendingCount() > 0);
  while (replaying() || (Date.now() <= drainEnd && pending())) {
    await Promise.all(trackersOf(runs).map((t) => t.runtime.pump(Date.now())));
    options.onProgress?.(progressOf(runs, options.speed, Date.now()));
    await wait(options.pumpEveryMs ?? 500);
    if (!replaying() && drainEnd === Number.POSITIVE_INFINITY) {
      drainEnd = Date.now() + (options.drainTimeoutMs ?? 120_000);
    }
  }
}

/**
 * J1: N headless trackers in one process, each replaying its own flight
 * through the real core, recorder and senders, to a real API.
 */
export async function runSimulation(options: SimulationOptions): Promise<SimulatedFlight[]> {
  mkdirSync(options.workDir, { recursive: true });
  const stop: Stop = { atMs: Date.now() + (options.stopAfterMs ?? Number.POSITIVE_INFINITY) };
  const offsetsS = departureOffsetsS(options.scenarios.length, options.staggerS, options.random);
  const runs = options.scenarios.map((scenario, index) =>
    startOne(scenario, offsetsS[index] ?? 0, options, stop),
  );
  if (options.stopAfterMs !== undefined) {
    setTimeout(() => void stopAll(runs, stop, false), options.stopAfterMs).unref();
  }
  options.signal?.addEventListener("abort", () => void stopAll(runs, stop, true), { once: true });
  let replaying = true;
  const pumping = pump(runs, options, () => replaying);
  await Promise.all(runs.map((r) => r.done));
  replaying = false;
  await pumping;
  await Promise.all(trackersOf(runs).map((t) => t.runtime.pump(Date.now())));
  return runs.map((r) => {
    const result = {
      scenario: r.scenario,
      flightId: r.tracker?.runtime.currentFlightId ?? null,
      pending: r.tracker?.sender.pendingCount() ?? 0,
    };
    r.tracker?.recorder.close();
    return result;
  });
}
