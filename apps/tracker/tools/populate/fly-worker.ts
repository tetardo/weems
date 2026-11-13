import { parentPort, workerData } from "node:worker_threads";
import { httpApiClient } from "../../src/sender/api-client.ts";
import { flyPastFlight, type PastFlight } from "./past-flight.ts";
import { pool } from "./pool.ts";

/** One past flight to fly, with the bearer token of its fictitious account. */
export interface WorkerFlight {
  flight: PastFlight;
  token: string;
}

/** What a worker thread is given (fly-workers.ts). */
export interface WorkerJob {
  flights: WorkerFlight[];
  apiUrl: string;
  workDir: string;
  trackerVersion: string;
  /** Flights flown at the same time in this thread. */
  concurrency: number;
}

/**
 * Worker thread of `pnpm populate create`: flies its share of the past flights through the real
 * tracker and posts "done" after each one. The tracker's work is synchronous: one thread per core.
 */
const job = workerData as WorkerJob;
await pool(job.flights, job.concurrency, async ({ flight, token }) => {
  const api = httpApiClient({ baseUrl: job.apiUrl, token, trackerVersion: job.trackerVersion });
  await flyPastFlight(flight, {
    api,
    workDir: job.workDir,
    trackerVersion: job.trackerVersion,
    // A long flight under a busy API: never give up on its messages after only a minute.
    drainTimeoutMs: 10 * 60_000,
  });
  parentPort?.postMessage("done");
});
