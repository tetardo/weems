import { describe, expect, it } from "vitest";
import { positionIntervalMs } from "./position-cadence.ts";

describe("positionIntervalMs (spec J1)", () => {
  it.each([
    ["BOARDING", null],
    ["TAXI_OUT", 10_000],
    ["TAKEOFF", 5_000],
    ["CLIMB", 10_000],
    ["CRUISE", 15_000],
    ["FINAL", 5_000],
    ["ARRIVED", null],
  ] as const)("%s → %s", (phase, interval) => {
    expect(positionIntervalMs(phase)).toBe(interval);
  });
});
