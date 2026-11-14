import type { BandMinute, FlightBands } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { cellOfMinute, cellSize, windowBands } from "./window-bands.ts";

const minute = (i: number, values: Partial<BandMinute["values"]>): BandMinute => ({
  at: new Date(Date.UTC(2026, 10, 14, 5, i)).toISOString(),
  phase: "CRUISE",
  values: values as BandMinute["values"],
});

const flight = (count: number): FlightBands => ({
  minutes: Array.from({ length: count }, (_, i) =>
    minute(i, { altitude: 1000 + i, speed: i, verticalSpeed: i % 2 ? -i : i, beacon: i % 2 }),
  ),
  rows: ["altitude", "speed", "verticalSpeed", "beacon"],
  marks: [{ row: "speed", from: 7, to: 12, reason: "speed250" }],
  unmeasured: null,
  fuelUsedKg: null,
  distanceNm: 0,
});

describe("windowBands", () => {
  it("keeps one cell per minute up to 120 minutes", () => {
    const view = windowBands(flight(45), { from: 30, to: 44 });
    expect(view.size).toBe(1);
    expect(view.bands.minutes).toHaveLength(15);
    expect(view.starts[0]).toBe(30);
    expect(view.bands.marks).toEqual([]);
  });

  it("gathers five minutes per cell beyond 120 minutes, as the API builds a minute", () => {
    const view = windowBands(flight(460), { from: 0, to: 459 });
    expect(cellSize({ from: 0, to: 459 })).toBe(5);
    expect(view.bands.minutes).toHaveLength(92);
    const second = view.bands.minutes[1]?.values; // minutes 5 to 9
    expect(second?.altitude).toBe(1009); // highest
    expect(second?.speed).toBe(7); // mean
    expect(second?.verticalSpeed).toBe(-9); // farthest from zero
    expect(second?.beacon).toBeCloseTo(0.6); // share of the time on
    expect(view.bands.marks).toEqual([{ row: "speed", from: 1, to: 2, reason: "speed250" }]);
  });

  it("finds the cell of a minute of the flight", () => {
    const window = { from: 0, to: 459 };
    const view = windowBands(flight(460), window);
    expect(cellOfMinute(view, window, 12)).toBe(2);
    expect(cellOfMinute(view, { from: 30, to: 44 }, 12)).toBeNull();
  });
});
