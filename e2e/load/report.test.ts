import { describe, expect, it } from "vitest";
import type { MetricsReading } from "./api-metrics.ts";
import { Histogram } from "./histogram.ts";
import { formatReport, isSuccess, judge, type LoadMeasures } from "./report.ts";

const histogramOf = (...values: number[]) => {
  const h = new Histogram();
  values.forEach((v) => h.add(v));
  return h;
};

const reading = (minute: number, rss: number, p99 = 5): MetricsReading => ({
  atMs: minute * 60_000,
  eventLoopDelayMs: { p50: 1, p99, max: p99 },
  memoryMb: { rss, heapUsed: rss / 2 },
  live: { viewers: 1, flights: 1 },
});

const healthy: LoadMeasures = {
  pilots: 50,
  viewers: 100,
  speed: 1,
  minutes: 30,
  positionsSent: 1000,
  positionFailures: 0,
  positionsMissing: 0,
  positionResponseMs: histogramOf(5, 10, 20),
  deliveryDelayMs: histogramOf(500, 1500, 2500),
  positionsNeverShown: 0,
  apiReadings: [reading(0, 100), reading(10, 120), reading(30, 125)],
  generatorLagP99Ms: 20,
};

const failedIds = (m: LoadMeasures) =>
  judge(m)
    .filter((c) => c.passed === false)
    .map((c) => c.id);

describe("judge (spec J4 criteria)", () => {
  it("passes a healthy run", () => {
    expect(failedIds(healthy)).toEqual([]);
  });

  it("fails each criterion on its own measure", () => {
    expect(failedIds({ ...healthy, positionsMissing: 1 })).toEqual([1]);
    expect(failedIds({ ...healthy, deliveryDelayMs: histogramOf(500, 6_000) })).toEqual([2]);
    expect(failedIds({ ...healthy, positionResponseMs: histogramOf(300, 400) })).toEqual([3]);
    expect(failedIds({ ...healthy, positionsNeverShown: 3 })).toEqual([4]);
    expect(
      failedIds({
        ...healthy,
        apiReadings: [reading(0, 100, 150), reading(10, 120), reading(30, 125)],
      }),
    ).toEqual([5]);
    expect(
      failedIds({ ...healthy, apiReadings: [reading(0, 100), reading(10, 120), reading(30, 200)] }),
    ).toEqual([6]);
    expect(failedIds({ ...healthy, generatorLagP99Ms: 500 })).toEqual([7]);
  });

  it("does not judge memory on a run shorter than 20 min, whatever the drift", () => {
    const short = {
      ...healthy,
      minutes: 6,
      apiReadings: [reading(0, 100), reading(3, 150), reading(6, 300)],
    };
    const memory = judge(short).find((c) => c.id === 6);
    expect(memory?.passed).toBeNull();
    expect(memory?.value).toContain("non mesurée");
    expect(isSuccess(judge(short))).toBe(true);
    expect(formatReport(short, judge(short))).toContain("Palier réussi");
  });

  it("fails the run as soon as one criterion fails", () => {
    expect(isSuccess(judge({ ...healthy, positionsNeverShown: 1 }))).toBe(false);
  });
});
