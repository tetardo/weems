import { describe, expect, it } from "vitest";
import { LatencyHistogram } from "./latency-histogram.ts";
import { RollingBuckets } from "./rolling-buckets.ts";
import { TrafficMetrics } from "./traffic-metrics.ts";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const T0 = Date.parse("2026-11-12T10:00:00.000Z");

describe("RollingBuckets", () => {
  it("keeps the last slots only, oldest first, null where nothing happened", () => {
    const buckets = new RollingBuckets({ slotMs: MINUTE, keep: 3, create: () => ({ n: 0 }) });
    buckets.at(T0).n += 1;
    buckets.at(T0 + 2 * MINUTE).n += 2;
    expect(buckets.window(T0 + 2 * MINUTE)).toEqual([{ n: 1 }, null, { n: 2 }]);

    buckets.at(T0 + 3 * MINUTE).n += 3;
    expect(buckets.window(T0 + 3 * MINUTE)).toEqual([null, { n: 2 }, { n: 3 }]);
  });
});

describe("LatencyHistogram", () => {
  it("has no 95th percentile without request", () => {
    expect(new LatencyHistogram().p95()).toBeNull();
  });

  it("finds the 95th percentile within 25 %", () => {
    const histogram = new LatencyHistogram();
    for (let i = 0; i < 95; i += 1) histogram.record(10);
    for (let i = 0; i < 5; i += 1) histogram.record(900);
    const p95 = histogram.p95() ?? 0;
    expect(p95).toBeGreaterThanOrEqual(10);
    expect(p95).toBeLessThan(12.5);

    histogram.record(900);
    expect(histogram.p95()).toBeGreaterThanOrEqual(900);
  });

  it("caps the very slow requests at 30 s", () => {
    const histogram = new LatencyHistogram();
    histogram.record(120_000);
    expect(histogram.p95()).toBe(30_000);
  });
});

describe("TrafficMetrics", () => {
  it("counts server errors per hour over 24 h", () => {
    const metrics = new TrafficMetrics(new Date(T0));
    metrics.request(5, 200, T0);
    metrics.request(5, 503, T0);
    metrics.request(5, 404, T0 + HOUR);

    const hours = metrics.apiHours(T0 + HOUR);
    expect(hours).toHaveLength(24);
    expect(hours.at(-2)?.serverErrors).toBe(1);
    expect(hours.at(-1)).toMatchObject({ serverErrors: 0 });
    expect(hours.at(-1)?.p95Ms).not.toBeNull();
    expect(hours[0]).toEqual({ p95Ms: null, serverErrors: 0 });
  });

  it("counts positions per minute over 30 min and remembers the last one", () => {
    const metrics = new TrafficMetrics(new Date(T0));
    expect(metrics.lastPositionAt).toBeNull();
    metrics.position(T0);
    metrics.position(T0 + 10);
    metrics.position(T0 + MINUTE);

    const minutes = metrics.positionsPerMinute(T0 + MINUTE);
    expect(minutes).toHaveLength(30);
    expect(minutes.slice(-2)).toEqual([2, 1]);
    expect(metrics.lastPositionAt?.getTime()).toBe(T0 + MINUTE);
    expect(metrics.positionsPerMinute(T0 + 40 * MINUTE).every((n) => n === 0)).toBe(true);
  });
});
