import { mkdirSync } from "node:fs";
import type { LiveActivityProgress } from "@weems/contrats";
import { httpApiClient } from "../../src/sender/api-client.ts";
import { liveTracker } from "../simulate/live-tracker.ts";
import { pick } from "./identities.ts";
import { liveScenario } from "./schedule.ts";
import { Visitors } from "./visitors.ts";

export interface LiveOptions {
  apiUrl: string;
  /** The fictitious accounts (the live flights are theirs), each with its own callsign. */
  pilots: readonly LivePilot[];
  /** Flights in the air at the same time. */
  airborne: number;
  visitors: number;
  durationS: number;
  speed: number;
  random: () => number;
  workDir: string;
  trackerVersion: string;
  signal?: AbortSignal;
  onProgress?: (progress: LiveActivityProgress) => void;
}

/** A fictitious account flying live: its bearer token and its pseudonym, used as callsign. */
interface LivePilot {
  token: string;
  callsign: string;
}

export interface LiveResult {
  departed: number;
  landed: number;
  interrupted: number;
  pending: number;
}

type Tracker = ReturnType<typeof liveTracker>["tracker"];

/** Real time over which the first departures and the visitors arrive. */
const RAMP_MS = 60_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Live activity (page Activité simulée): `airborne` fictitious accounts in the air at once,
 * a new departure as soon as one lands, and visitors on the live map, for `durationS` real
 * seconds. At the end, the flights still in the air are closed as interrupted.
 */
export async function runLive(options: LiveOptions): Promise<LiveResult> {
  mkdirSync(options.workDir, { recursive: true });
  return new LiveActivity(options).run();
}

class LiveActivity {
  private readonly options: LiveOptions;
  private readonly deadline: number;
  private readonly startedMs = Date.now();
  private readonly visitors: Visitors;
  private readonly flying = new Set<Tracker>();
  /** Landed or interrupted, with messages still to send. */
  private readonly finished: Tracker[] = [];
  private readonly counts = { departed: 0, landed: 0, interrupted: 0 };

  constructor(options: LiveOptions) {
    this.options = options;
    this.deadline = Date.now() + options.durationS * 1000;
    const streamUrl = new URL("/v1/live/stream", options.apiUrl).href;
    this.visitors = new Visitors(streamUrl, options.visitors, RAMP_MS);
  }

  async run(): Promise<LiveResult> {
    const pumping = this.pumpLoop();
    const slots = Array.from({ length: this.options.airborne }, (_, i) => this.slot(i));
    await Promise.all(slots);
    await pumping;
    await this.visitors.stop();
    const pending = await this.drain();
    for (const tracker of this.finished) tracker.recorder.close();
    return { ...this.counts, pending };
  }

  private stopped(): boolean {
    return Date.now() >= this.deadline || this.options.signal?.aborted === true;
  }

  /** One place in the sky: flights one after the other, until the end. */
  private async slot(index: number): Promise<void> {
    await wait((index * RAMP_MS) / Math.max(1, this.options.airborne));
    while (!this.stopped()) await this.flyOne();
  }

  private async flyOne(): Promise<void> {
    const { options } = this;
    const pilot = pick(options.random, options.pilots);
    const api = httpApiClient({
      baseUrl: options.apiUrl,
      token: pilot.token,
      trackerVersion: options.trackerVersion,
    });
    const run = liveTracker(liveScenario(pilot.callsign, options.random), {
      api,
      speed: options.speed,
      workDir: options.workDir,
      trackerVersion: options.trackerVersion,
      skipBoarding: true,
    });
    this.counts.departed++;
    this.flying.add(run.tracker);
    const stopOnEnd = setInterval(() => {
      if (this.stopped()) void run.connector.stop();
    }, 500);
    await run.tracker.runtime.start();
    clearInterval(stopOnEnd);
    this.flying.delete(run.tracker);
    this.finished.push(run.tracker);
    if (this.stopped()) {
      run.tracker.runtime.interruptFlight();
      this.counts.interrupted++;
    } else this.counts.landed++;
  }

  private all(): Tracker[] {
    return [...this.flying, ...this.finished];
  }

  private async pumpLoop(): Promise<void> {
    while (!this.stopped() || this.flying.size > 0) {
      await Promise.all(this.all().map((t) => t.runtime.pump(Date.now())));
      this.closeSent();
      this.options.onProgress?.({
        airborne: this.flying.size,
        departed: this.counts.departed,
        visitors: { done: this.visitors.count, total: this.options.visitors },
        elapsedS: (Date.now() - this.startedMs) / 1000,
        durationS: this.options.durationS,
      });
      await wait(500);
    }
  }

  /** Closes the local database of the finished flights whose messages are all sent. */
  private closeSent(): void {
    for (const tracker of [...this.finished]) {
      if (tracker.sender.pendingCount() > 0) continue;
      tracker.recorder.close();
      this.finished.splice(this.finished.indexOf(tracker), 1);
    }
  }

  /** Sends what is left (the interrupted closings) for 30 s at most. */
  private async drain(): Promise<number> {
    const pending = () => this.finished.reduce((sum, t) => sum + t.sender.pendingCount(), 0);
    const end = Date.now() + 30_000;
    while (pending() > 0 && Date.now() < end) {
      await Promise.all(this.finished.map((t) => t.runtime.pump(Date.now())));
      await wait(500);
    }
    return pending();
  }
}
