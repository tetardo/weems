import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { departureOffsetsS } from "./departures.ts";

describe("departureOffsetsS", () => {
  it("spaces departures regularly without random (load test, J1)", () => {
    expect(departureOffsetsS(4, 30)).toEqual([0, 30, 60, 90]);
  });

  it("draws random gaps averaging the stagger, never two departures at once", () => {
    const offsets = departureOffsetsS(1000, 30, seededRandom(1));
    const gaps = offsets.slice(1).map((at, i) => at - (offsets[i] ?? 0));
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    expect(offsets[0]).toBe(0);
    expect(mean).toBeGreaterThan(25);
    expect(mean).toBeLessThan(35);
    expect(Math.min(...gaps)).toBeGreaterThan(30 * 0.15 - 1e-6);
    expect(Math.max(...gaps)).toBeLessThan(30 * 4 + 1e-6);
    expect(new Set(gaps.map(Math.round)).size).toBeGreaterThan(50);
  });

  it("gives the same departures for the same seed", () => {
    expect(departureOffsetsS(10, 60, seededRandom(7))).toEqual(
      departureOffsetsS(10, 60, seededRandom(7)),
    );
  });
});
