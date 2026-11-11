import { describe, expect, it } from "vitest";
import { barsOf, cellOpacity, movingAverage, touchdownBucket } from "./chart-geometry.ts";

describe("chart geometry", () => {
  it("draws bars against the largest value, an empty one still visible", () => {
    const [empty, half, full] = barsOf([0, 5, 10], {
      width: 300,
      height: 120,
      top: 10,
      bottom: 10,
    });
    expect(full).toMatchObject({ y: 10, height: 100 });
    expect(half?.height).toBe(50);
    expect(empty?.height).toBe(2);
    expect(full?.middle).toBe(250);
  });

  it("averages over the last five values", () => {
    expect(movingAverage([10, 20, 30, 40, 50, 60])).toEqual([10, 15, 20, 25, 30, 40]);
  });

  it("puts a touchdown in its bucket", () => {
    expect([-59, -60, -239, -240, -601].map(touchdownBucket)).toEqual([0, 1, 1, 2, 3]);
  });

  it("keeps empty cells faint", () => {
    expect(cellOpacity(0, 5)).toBe(0.07);
    expect(cellOpacity(5, 5)).toBe(1);
  });
});
