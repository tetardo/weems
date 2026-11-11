import { monitorEventLoopDelay } from "node:perf_hooks";
import { httpApiClient } from "../../apps/tracker/src/sender/api-client.ts";
import { fleetOf } from "../../apps/tracker/tools/generate-flights/fleet.ts";
import { runSimulation } from "../../apps/tracker/tools/simulate/simulation.ts";
import { RecordingClient } from "../j1/recording-client.ts";
import { pollApiMetrics } from "./api-metrics.ts";
import { Histogram } from "./histogram.ts";
import type { LoadMeasures } from "./report.ts";
import { TimedClient } from "./timed-client.ts";
import { Viewer } from "./viewer.ts";

export interface LoadOptions {
  baseUrl: string;
  token: string;
  pilots: number;
  viewers: number;
  /** Replay speed: 1 = real time. */
  speed: number;
  minutes: number;
  /** Folder for the local databases of the simulated trackers. */
  workDir: string;
  /** Stops the run early (Ctrl+C, admin console): flights closed as interrupted, report kept. */
  signal?: AbortSignal;
}

const TRACKER_VERSION = "0.1.0";
/** Spec J4 criterion 4: a position not shown 20 s after it was sent is a frozen aircraft. */
const FROZEN_AFTER_MS = 20_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Empties the development pilot's simulated flights, live map included, so runs do not add up.
 * Real flights of `pnpm fly` (same pilot) are kept.
 */
async function clearFlights({ baseUrl, token }: LoadOptions): Promise<void> {
  const response = await fetch(new URL("/v1/flights?simulator=replay", baseUrl), {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}`, "weems-client": `tracker/${TRACKER_VERSION}` },
  });
  if (response.status !== 204) throw new Error(`Cannot clear flights: HTTP ${response.status}`);
}

/** Departures spread over the first 2 minutes (or the first quarter of a short run). */
function staggerS({ pilots, speed, minutes }: LoadOptions): number {
  const spreadRealS = Math.min(120, (minutes * 60) / 4);
  return (spreadRealS * speed) / Math.max(1, pilots);
}

function countSent(client: RecordingClient): { sent: number; missing: number } {
  let sent = 0;
  let missing = 0;
  for (const [flightId, seqs] of client.sentAtMs) {
    const accepted = client.accepted.get(flightId) ?? new Set<number>();
    sent += seqs.size;
    for (const seq of seqs.keys()) if (!accepted.has(seq)) missing += 1;
  }
  return { sent, missing };
}

/** The spectators and the API readings, started before the first pilot. */
function startWatching(options: LoadOptions, recording: RecordingClient) {
  const deliveryDelayMs = new Histogram();
  const streamUrl = new URL("/v1/live/stream", options.baseUrl).href;
  const viewers = Array.from(
    { length: options.viewers },
    () => new Viewer(streamUrl, recording.sentAtMs, deliveryDelayMs),
  );
  return { viewers, deliveryDelayMs, metrics: pollApiMetrics(options.baseUrl) };
}

/**
 * Spec J4 (montée en charge du direct): N simulated pilots and M spectators against
 * a running API, for a given time; returns what the criteria need.
 */
export async function runLoad(options: LoadOptions): Promise<LoadMeasures> {
  await clearFlights(options);
  const generatorLag = monitorEventLoopDelay({ resolution: 10 });
  generatorLag.enable();
  const timed = new TimedClient(
    httpApiClient({
      baseUrl: options.baseUrl,
      token: options.token,
      trackerVersion: TRACKER_VERSION,
    }),
  );
  const recording = new RecordingClient(timed);
  const { viewers, deliveryDelayMs, metrics } = startWatching(options, recording);
  await runSimulation({
    scenarios: fleetOf(options.pilots),
    api: recording,
    speed: options.speed,
    staggerS: staggerS(options),
    workDir: options.workDir,
    trackerVersion: TRACKER_VERSION,
    stopAfterMs: options.minutes * 60_000,
    drainTimeoutMs: 30_000,
    ...(options.signal ? { signal: options.signal } : {}),
  });
  await wait(3_000); // last live batch
  const neverShown = viewers.reduce((sum, v) => sum + v.missed(Date.now(), FROZEN_AFTER_MS), 0);
  await metrics.stop();
  await Promise.all(viewers.map((v) => v.close()));
  generatorLag.disable();
  await clearFlights(options);
  const { sent, missing } = countSent(recording);
  return {
    pilots: options.pilots,
    viewers: options.viewers,
    speed: options.speed,
    minutes: options.minutes,
    positionsSent: sent,
    positionFailures: timed.positionFailures,
    positionsMissing: missing,
    positionResponseMs: timed.positionResponseMs,
    deliveryDelayMs,
    positionsNeverShown: neverShown,
    apiReadings: metrics.readings,
    generatorLagP99Ms: generatorLag.percentile(99) / 1e6,
  };
}
