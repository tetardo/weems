import { monitorEventLoopDelay } from "node:perf_hooks";
import type { DevMetrics } from "@weems/contrats";

const NS_PER_MS = 1e6;
const BYTES_PER_MB = 1024 * 1024;
const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Event loop delay and memory of the API process (spec J4 montée en charge).
 * Each reading covers the time since the previous one.
 */
export class RuntimeMetrics {
  private readonly histogram = monitorEventLoopDelay({ resolution: 10 });

  start(): void {
    this.histogram.enable();
  }

  stop(): void {
    this.histogram.disable();
  }

  read(): Omit<DevMetrics, "live"> {
    const h = this.histogram;
    const eventLoopDelayMs = {
      p50: round(h.percentile(50) / NS_PER_MS),
      p99: round(h.percentile(99) / NS_PER_MS),
      max: round(h.max / NS_PER_MS),
    };
    h.reset();
    const memory = process.memoryUsage();
    return {
      eventLoopDelayMs,
      memoryMb: {
        rss: round(memory.rss / BYTES_PER_MB),
        heapUsed: round(memory.heapUsed / BYTES_PER_MB),
      },
    };
  }
}
