import { describe, expect, it } from "vitest";
import type { RunView } from "../../server/traffic/traffic-view.ts";
import { runProgress, sparkPoints } from "./run-progress.ts";

const run = (overrides: Partial<RunView>): RunView => ({
  id: "1",
  launch: { kind: "simulate", count: 2, speed: 10, stagger: 30 },
  summary: "",
  startedAt: "2026-11-11T20:00:00.000Z",
  endedAt: null,
  state: "running",
  progress: null,
  outcome: null,
  detail: null,
  lastLines: [],
  ...overrides,
});
const pilot = (progress: number) => ({
  callsign: "W",
  departure: "LFPG",
  arrival: "LFBO",
  phase: null,
  progress,
  pending: 0,
});

describe("runProgress", () => {
  it("averages the pilots of a simulation", () => {
    const progress = {
      total: 2,
      departed: 2,
      phases: {},
      pending: 0,
      pilots: [pilot(0.2), pilot(0.6)],
    };
    expect(runProgress(run({ progress }), 0)).toBeCloseTo(0.4);
  });

  it("counts the time of a load test, and 1 once ended", () => {
    const launch = { kind: "load" as const, pilots: 50, viewers: 100, minutes: 10, speed: 1 };
    expect(runProgress(run({ launch }), Date.parse("2026-11-11T20:05:00.000Z"))).toBeCloseTo(0.5);
    expect(runProgress(run({ state: "ended" }), 0)).toBe(1);
  });
});

describe("sparkPoints", () => {
  it("draws nothing below two readings, else fills the width", () => {
    expect(sparkPoints([3])).toBe("");
    expect(sparkPoints([0, 10])).toBe("0.0,24.0 100.0,2.0");
  });
});
