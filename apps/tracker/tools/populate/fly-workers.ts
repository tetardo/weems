import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import type { WorkerFlight, WorkerJob } from "./fly-worker.ts";

export interface FlyWorkersOptions {
  apiUrl: string;
  workDir: string;
  trackerVersion: string;
  /** Flights flown at the same time, over all the threads. */
  concurrency: number;
  signal?: AbortSignal;
  onFlightDone: () => void;
}

/** Threads to use: one core left to the API and the database, at least one, at most 8. */
const threadsAvailable = () => Math.max(1, Math.min(8, availableParallelism() - 1));

/**
 * Flies the past flights in worker threads (fly-worker.ts), dealt in turn so that every thread
 * gets old and recent flights alike. The signal stops the threads at once.
 */
export async function flyInWorkers(
  flights: readonly WorkerFlight[],
  options: FlyWorkersOptions,
): Promise<void> {
  const threads = Math.max(1, Math.min(threadsAvailable(), flights.length));
  const shares = Array.from({ length: threads }, (_, thread) =>
    flights.filter((_, index) => index % threads === thread),
  );
  const perThread = Math.max(1, Math.ceil(options.concurrency / threads));
  await Promise.all(shares.map((share) => runWorker(share, perThread, options)));
}

function runWorker(
  flights: WorkerFlight[],
  concurrency: number,
  options: FlyWorkersOptions,
): Promise<void> {
  const job: WorkerJob = {
    flights,
    concurrency,
    apiUrl: options.apiUrl,
    workDir: options.workDir,
    trackerVersion: options.trackerVersion,
  };
  const worker = new Worker(new URL("./fly-worker.ts", import.meta.url), { workerData: job });
  const stop = () => void worker.terminate();
  options.signal?.addEventListener("abort", stop, { once: true });
  return new Promise<void>((resolve, reject) => {
    worker.on("message", () => options.onFlightDone());
    worker.on("error", reject);
    worker.on("exit", () => {
      options.signal?.removeEventListener("abort", stop);
      resolve();
    });
  });
}
