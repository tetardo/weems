import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { uuidV7 } from "@weems/contrats";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { replayUntil } from "../../src/connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { createTracker } from "../../src/runtime/create-tracker.ts";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { generateFlight } from "../generate-flights/generator.ts";
import type { Scenario } from "../generate-flights/scenario.ts";

export interface SimulationOptions {
  scenarios: readonly Scenario[];
  api: ApiClient;
  /** Replay speed: 1 = real time, 10 = ten times faster. */
  speed: number;
  /** Simulated seconds between two departures. */
  staggerS: number;
  /** Folder for the local databases of the simulated trackers. */
  workDir: string;
  trackerVersion: string;
  /** Real ms between two sending rounds. */
  pumpEveryMs?: number;
  /** Real ms to keep sending after the last replay ends, for queued messages. */
  drainTimeoutMs?: number;
  /** Real ms after which every replay stops, flights left open (load test, spec J4). */
  stopAfterMs?: number;
}

export interface SimulatedFlight {
  scenario: Scenario;
  flightId: string | null;
  /** Messages still waiting in the tracker's outbox at the end. */
  pending: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Tracker = ReturnType<typeof createTracker>;

interface Run {
  scenario: Scenario;
  /** Built at departure only: N pilots never hold N whole flights in memory at once. */
  tracker: Tracker | null;
  connector: ReplayConnector | null;
  done: Promise<void>;
}

function buildTracker(scenario: Scenario, options: SimulationOptions) {
  const flight = generateFlight(scenario);
  // Only what can be played before the stop stays in memory (2 000 pilots in one process).
  const replay =
    options.stopAfterMs === undefined
      ? flight
      : replayUntil(flight, options.stopAfterMs * options.speed);
  const connector = new ReplayConnector(replay, options.speed);
  const tracker = createTracker({
    connector,
    databasePath: join(options.workDir, `${scenario.callsign}.db`),
    api: options.api,
    session: {
      callsign: scenario.callsign,
      flightPlan: { departureIcao: scenario.departure.icao, arrivalIcao: scenario.arrival.icao },
      trackerVersion: options.trackerVersion,
      clock: { nowUtcMs: () => Date.now() },
      newFlightId: uuidV7,
      params: AIRLINER_PARAMS,
    },
  });
  return { connector, tracker };
}

function startOne(scenario: Scenario, index: number, options: SimulationOptions, stopAtMs: number) {
  const run: Run = { scenario, tracker: null, connector: null, done: Promise.resolve() };
  const delayMs = (index * options.staggerS * 1000) / options.speed;
  // A pilot whose departure comes after the stop never takes off.
  run.done = wait(Math.min(delayMs, stopAtMs - Date.now())).then(() => {
    if (Date.now() >= stopAtMs) return;
    Object.assign(run, buildTracker(scenario, options));
    return run.tracker?.runtime.start();
  });
  return run;
}

const trackersOf = (runs: readonly Run[]) => runs.flatMap((r) => (r.tracker ? [r.tracker] : []));

/**
 * J1: N headless trackers in one process, each replaying its own flight
 * through the real core, recorder and senders, to a real API.
 */
export async function runSimulation(options: SimulationOptions): Promise<SimulatedFlight[]> {
  mkdirSync(options.workDir, { recursive: true });
  const stopAtMs = Date.now() + (options.stopAfterMs ?? Number.POSITIVE_INFINITY);
  const runs = options.scenarios.map((scenario, index) =>
    startOne(scenario, index, options, stopAtMs),
  );
  if (options.stopAfterMs !== undefined) {
    const stopAll = () => Promise.all(runs.map((r) => r.connector?.stop()));
    setTimeout(() => void stopAll(), options.stopAfterMs).unref();
  }
  let replaying = true;
  const pumping = (async () => {
    const deadline = () => Date.now() > drainEnd;
    let drainEnd = Number.POSITIVE_INFINITY;
    const pending = () => trackersOf(runs).some((t) => t.sender.pendingCount() > 0);
    while (replaying || (!deadline() && pending())) {
      await Promise.all(trackersOf(runs).map((t) => t.runtime.pump(Date.now())));
      await wait(options.pumpEveryMs ?? 500);
      if (!replaying && drainEnd === Number.POSITIVE_INFINITY) {
        drainEnd = Date.now() + (options.drainTimeoutMs ?? 120_000);
      }
    }
  })();
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
