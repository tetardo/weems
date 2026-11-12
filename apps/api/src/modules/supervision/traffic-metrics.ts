import { LatencyHistogram } from "./latency-histogram.ts";
import { RollingBuckets } from "./rolling-buckets.ts";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

interface HourBucket {
  latency: LatencyHistogram;
  serverErrors: number;
}

/**
 * What the API measures of its own traffic for the page Supervision: response times and server
 * errors per hour (24 h), positions received per minute (30 min). In memory only: an API restart
 * starts them again, which `measuredSince` says.
 */
export class TrafficMetrics {
  readonly measuredSince: Date;
  private readonly hours = new RollingBuckets<HourBucket>({
    slotMs: HOUR_MS,
    keep: 24,
    create: () => ({ latency: new LatencyHistogram(), serverErrors: 0 }),
  });
  private readonly minutes = new RollingBuckets<{ positions: number }>({
    slotMs: MINUTE_MS,
    keep: 30,
    create: () => ({ positions: 0 }),
  });
  private lastPositionMs: number | null = null;

  constructor(now: Date = new Date()) {
    this.measuredSince = now;
  }

  /** One answered request: its duration and status code. */
  request(durationMs: number, status: number, atMs: number): void {
    const bucket = this.hours.at(atMs);
    bucket.latency.record(durationMs);
    if (status >= 500) bucket.serverErrors += 1;
  }

  /** One position accepted from a tracker. */
  position(atMs: number): void {
    this.minutes.at(atMs).positions += 1;
    this.lastPositionMs = atMs;
  }

  apiHours(nowMs: number): { p95Ms: number | null; serverErrors: number }[] {
    return this.hours.window(nowMs).map((bucket) => ({
      p95Ms: bucket?.latency.p95() ?? null,
      serverErrors: bucket?.serverErrors ?? 0,
    }));
  }

  positionsPerMinute(nowMs: number): number[] {
    return this.minutes.window(nowMs).map((bucket) => bucket?.positions ?? 0);
  }

  get lastPositionAt(): Date | null {
    return this.lastPositionMs === null ? null : new Date(this.lastPositionMs);
  }
}
